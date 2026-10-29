/* =====================================================================
   js/app/view.js — Zoom/pan views, every canvas draw (source, loupe, debug overlay, result), and the mini result preview.
   Shell modules share one namespace, CF (created in core.js). Names from core are
   destructured below; anything from another module is called as CF.name.
   tests/selftest.js checks these boundaries.
   ===================================================================== */
(function (CF) {
  'use strict';
  const { E, M3, Quad, els, makeCanvas, ctx2d, app } = CF;

  /* ---------- views (zoom/pan) ---------- */
  // view: screen = world · z + (x, y), in CSS px.
  function fitView(ww, wh, pad = 24) {
    const cw = app.cssW, ch = app.cssH;
    const z = Math.max(1e-4, Math.min((cw - 2 * pad) / ww, (ch - 2 * pad) / wh));
    return { z, x: (cw - ww * z) / 2, y: (ch - wh * z) / 2, auto: true };
  }
  function exportWorld() { const c = app.geo.crop; return { x: c.x, y: c.y, w: c.w, h: c.h }; }
  function currentView() {
    if (app.tab === 'perspective' && !app.previewMode) {
      if (!app.views.source) app.views.source = fitView(app.img.width, app.img.height);
      return app.views.source;
    }
    if (!app.geo || !app.geo.ok) return null;
    if (app.tab === 'export' || app.tab === 'levels' || app.tab === 'overlay') {
      if (!app.views.export) { const w = exportWorld(), v = fitView(w.w, w.h); v.x -= w.x * v.z; v.y -= w.y * v.z; app.views.export = v; }
      return app.views.export;
    }
    if (!app.views.result) app.views.result = fitView(app.geo.R.w, app.geo.R.h, app.tab === 'crop' ? 36 : 24);
    return app.views.result;
  }
  function viewKey() { return app.tab === 'perspective' && !app.previewMode ? 'source' : app.tab === 'export' || app.tab === 'levels' || app.tab === 'overlay' ? 'export' : 'result'; }
  const toScreen = (v, p) => [p[0] * v.z + v.x, p[1] * v.z + v.y];
  const toWorld = (v, p) => [(p[0] - v.x) / v.z, (p[1] - v.y) / v.z];
  function zoomAt(v, sx, sy, factor) {
    const z = Math.min(64, Math.max(0.01, v.z * factor)), f = z / v.z;
    v.x = sx - (sx - v.x) * f; v.y = sy - (sy - v.y) * f; v.z = z; v.auto = false;
  }
  function fitCurrent() { app.views[viewKey()] = null; requestRender(); }

  /* ---------- rendering ---------- */
  let renderQueued = false;
  function requestRender() { if (!renderQueued) { renderQueued = true; requestAnimationFrame(() => { renderQueued = false; draw(); }); } }

  function resizeCanvas() {
    const r = els.stage.getBoundingClientRect(), dpr = Math.min(3, window.devicePixelRatio || 1);
    app.cssW = r.width; app.cssH = r.height; app.dpr = dpr;
    els.canvas.width = Math.max(1, Math.round(r.width * dpr)); els.canvas.height = Math.max(1, Math.round(r.height * dpr));
    for (const k of Object.keys(app.views)) if (app.views[k] && app.views[k].auto) app.views[k] = null;
    requestRender();
  }

  function fillRGBA(fill) {
    if (!fill || fill === 'transparent') return [0, 0, 0, 0];
    const m = /^#?([0-9a-f]{6})$/i.exec(fill); if (!m) return [255, 255, 255, 255];
    const n = parseInt(m[1], 16); return [n >> 16, (n >> 8) & 255, n & 255, 255];
  }
  let checker = null;
  function underlayStyle(ctx, fill) {
    if (fill !== 'transparent') return fill;
    if (!checker) {
      const c = makeCanvas(16, 16), x = ctx2d(c);
      x.fillStyle = '#5a5a5a'; x.fillRect(0, 0, 16, 16); x.fillStyle = '#7a7a7a'; x.fillRect(0, 0, 8, 8); x.fillRect(8, 8, 8, 8);
      checker = c;
    }
    return ctx.createPattern(checker, 'repeat');
  }

  // Warped preview of the whole P frame, from the 2048-px preview copy. Built lazily,
  // keyed on the perspective transform, never during a drag.
  function ensurePPreview() {
    const g = app.geo;
    if (!g || !g.ok) return null;
    const key = JSON.stringify([g.HP, g.P.w, g.P.h]);
    if (app.pPreview && app.pPreview.key === key) return app.pPreview;
    const k = app.preview.k;
    const q = Math.min(k, CONFIG.previewMaxPx / Math.max(g.P.w, g.P.h));
    const w = Math.max(1, Math.round(g.P.w * q)), h = Math.max(1, Math.round(g.P.h * q));
    const M = M3.chain(M3.scale(q), g.HP, M3.scale(1 / k)); // preview px → P-preview px
    const out = new ImageData(w, h);
    E.warp(out, app.preview.data, M3.inv(M), { fill: [0, 0, 0, 0] });
    const c = app.pPreview && app.pPreview.canvas.width === w && app.pPreview.canvas.height === h ? app.pPreview.canvas : makeCanvas(w, h);
    ctx2d(c).putImageData(out, 0, 0);
    app.pPreview = { canvas: c, q, key, data: out };
    return app.pPreview;
  }

  function draw() {
    const cv = els.canvas, ctx = cv.getContext('2d'), dpr = app.dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = CONFIG.theme.stage; ctx.fillRect(0, 0, cv.width, cv.height);
    if (!app.img) return;
    const v = currentView();
    if (app.tab === 'perspective' && !app.previewMode) return drawSource(ctx, v, true);
    if (!v) return drawMessage(ctx, 'Fix the corners in Perspective first.');
    drawResult(ctx, v);
  }
  function drawMessage(ctx, text) {
    ctx.setTransform(app.dpr, 0, 0, app.dpr, 0, 0);
    ctx.fillStyle = CONFIG.theme.muted; ctx.font = '15px system-ui, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(text, app.cssW / 2, app.cssH / 2);
  }
  function setWorld(ctx, v) { const d = app.dpr; ctx.setTransform(d * v.z, 0, 0, d * v.z, d * v.x, d * v.y); }
  function setScreen(ctx) { ctx.setTransform(app.dpr, 0, 0, app.dpr, 0, 0); }

  // Draw the source image; switch to full-res tiles of the visible area when zoomed past the preview.
  function drawSourceImage(ctx, v) {
    const W = app.img.width, H = app.img.height;
    setWorld(ctx, v);
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    if (v.z * app.dpr > app.preview.k * 1.15) {
      const a = toWorld(v, [0, 0]), b = toWorld(v, [app.cssW, app.cssH]);
      const x0 = Math.max(0, Math.floor(a[0])), y0 = Math.max(0, Math.floor(a[1]));
      const x1 = Math.min(W, Math.ceil(b[0])), y1 = Math.min(H, Math.ceil(b[1]));
      if (x1 > x0 && y1 > y0) ctx.drawImage(app.img.el, x0, y0, x1 - x0, y1 - y0, x0, y0, x1 - x0, y1 - y0);
    } else ctx.drawImage(app.preview.canvas, 0, 0, W, H);
  }

  function drawSource(ctx, v, overlays) {
    drawSourceImage(ctx, v);
    if (!overlays) return;
    if (app.debugOverlay) drawDebug(ctx, v);
    setScreen(ctx);
    const s = app.state, ok = app.geo && app.geo.ok, C = CONFIG.colors, Hh = CONFIG.handle;
    const q = s.corners.map(p => toScreen(v, p));
    // Edge extensions across the whole image, for aligning against long card edges.
    const img = [toScreen(v, [0, 0]), toScreen(v, [app.img.width, app.img.height])];
    ctx.save(); ctx.beginPath(); ctx.rect(img[0][0], img[0][1], img[1][0] - img[0][0], img[1][1] - img[0][1]); ctx.clip();
    ctx.strokeStyle = C.extend; ctx.lineWidth = 1; ctx.setLineDash([6, 6]);
    for (let k = 0; k < 4; k++) {
      const a = q[k], b = q[(k + 1) % 4], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, e = 1e5 / L;
      ctx.beginPath(); ctx.moveTo(a[0] - dx * e, a[1] - dy * e); ctx.lineTo(b[0] + dx * e, b[1] + dy * e); ctx.stroke();
    }
    ctx.restore();
    ctx.setLineDash([]);
    ctx.lineWidth = Hh.lineWidth; ctx.strokeStyle = ok ? C.quad : C.quadInvalid;
    ctx.beginPath(); q.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.stroke();
    // Handles: corners (circles) then edge midpoints (squares). Constant screen size at any zoom.
    for (let k = 0; k < 4; k++) {
      const m = E.V.mid(q[k], q[(k + 1) % 4]), sel = app.selected === 4 + k, r = Hh.edgeSize / 2 + (sel ? 2 : 0);
      ctx.fillStyle = sel ? C.handleSelected : C.handle; ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.rect(m[0] - r, m[1] - r, 2 * r, 2 * r); ctx.fill(); ctx.stroke();
    }
    q.forEach((p, k) => {
      const sel = app.selected === k;
      ctx.beginPath(); ctx.arc(p[0], p[1], Hh.cornerRadius + (sel ? 2 : 0), 0, Math.PI * 2);
      ctx.fillStyle = sel ? 'rgba(229,50,45,.35)' : 'rgba(255,255,255,.18)'; ctx.fill();
      ctx.lineWidth = 2.5; ctx.strokeStyle = sel ? C.handleSelected : C.handle; ctx.stroke();
      ctx.beginPath(); ctx.arc(p[0], p[1], 2, 0, Math.PI * 2); ctx.fillStyle = C.handle; ctx.fill();
    });
    if (app.detection.seed) {
      const p = toScreen(v, app.detection.seed);
      ctx.strokeStyle = C.seed; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(p[0], p[1], 9, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(p[0] - 14, p[1]); ctx.lineTo(p[0] + 14, p[1]); ctx.moveTo(p[0], p[1] - 14); ctx.lineTo(p[0], p[1] + 14); ctx.stroke();
    }
    const g = app.gesture;
    if (g && g.type === 'handle') drawLoupe(ctx, v, g);
    else if (app.nudgeLoupeUntil > performance.now() && app.selected >= 0) {
      // After an on-screen nudge, briefly show the loupe on the selected handle so the move is visible.
      const st = app.state, k = app.selected, c = k < 4 ? st.corners[k] : E.V.mid(st.corners[k - 4], st.corners[(k - 3) % 4]);
      drawLoupe(ctx, v, { idx: k, last: toScreen(v, c), pointerType: 'touch' });
    }
  }

  function drawLoupe(ctx, v, g) {
    const s = app.state, R = loupeRadius(), z = v.z * CONFIG.loupeZoom;
    const c = g.idx < 4 ? s.corners[g.idx] : E.V.mid(s.corners[g.idx - 4], s.corners[(g.idx - 3) % 4]);
    const [lx, ly] = loupeCenter(g, R);
    const d = app.dpr;
    ctx.save();
    setScreen(ctx); ctx.beginPath(); ctx.arc(lx, ly, R, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = '#000'; ctx.fillRect(lx - R, ly - R, 2 * R, 2 * R);
    ctx.setTransform(d * z, 0, 0, d * z, d * (lx - c[0] * z), d * (ly - c[1] * z));
    const W = app.img.width, H = app.img.height, half = R / z + 2;
    const x0 = Math.max(0, Math.floor(c[0] - half)), y0 = Math.max(0, Math.floor(c[1] - half));
    const x1 = Math.min(W, Math.ceil(c[0] + half)), y1 = Math.min(H, Math.ceil(c[1] + half));
    ctx.imageSmoothingEnabled = z < 6;
    if (x1 > x0 && y1 > y0) ctx.drawImage(app.img.el, x0, y0, x1 - x0, y1 - y0, x0, y0, x1 - x0, y1 - y0);
    ctx.strokeStyle = CONFIG.colors.quad; ctx.lineWidth = 1.5 / z;
    ctx.beginPath(); s.corners.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.stroke();
    setScreen(ctx);
    ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(lx - R, ly); ctx.lineTo(lx - 5, ly); ctx.moveTo(lx + 5, ly); ctx.lineTo(lx + R, ly);
    ctx.moveTo(lx, ly - R); ctx.lineTo(lx, ly - 5); ctx.moveTo(lx, ly + 5); ctx.lineTo(lx, ly + R); ctx.stroke();
    ctx.restore();
    setScreen(ctx); ctx.lineWidth = 3; ctx.strokeStyle = '#fff'; ctx.beginPath(); ctx.arc(lx, ly, R, 0, Math.PI * 2); ctx.stroke();
  }

  // Loupe size: CONFIG.loupeSize, but never wider than loupeMaxFrac of the photo area (phones).
  const loupeRadius = () => Math.min(CONFIG.loupeSize, app.cssW * CONFIG.loupeMaxFrac) / 2;
  // Loupe position. Mouse: up-right of the cursor. Touch/pen: pinned to the top corner on the far
  // side from the finger, so the hand never covers it (a phone's photo area is too short to fit it above the finger).
  function loupeCenter(g, R) {
    if (g.pointerType === 'mouse') {
      let lx = g.last[0] + R + 28, ly = g.last[1] - R - 28;
      if (ly - R < 4) ly = g.last[1] + CONFIG.loupeOffset + R;           // flip below near the top
      lx = Math.min(app.cssW - R - 4, Math.max(R + 4, lx));
      ly = Math.min(app.cssH - R - 4, Math.max(R + 4, ly));
      return [lx, ly];
    }
    const m = 8, pinLeft = g.last[0] > app.cssW / 2;
    return [pinLeft ? m + R : app.cssW - m - R, m + R];
  }

  function drawDebug(ctx, v) {
    const last = app.detection.last;
    if (!last) return;
    const ks = last.ks;
    if (last.debug && !app.edgeCanvas) {
      const d = last.debug, c = makeCanvas(d.width, d.height), x = ctx2d(c), im = x.createImageData(d.width, d.height);
      for (let i = 0; i < d.edges.length; i++) if (d.edges[i]) { const o = i * 4; im.data[o] = 0; im.data[o + 1] = 255; im.data[o + 2] = 255; im.data[o + 3] = 200; }
      x.putImageData(im, 0, 0); app.edgeCanvas = c;
    }
    setWorld(ctx, v);
    if (app.edgeCanvas) { ctx.imageSmoothingEnabled = false; ctx.drawImage(app.edgeCanvas, 0, 0, app.img.width, app.img.height); ctx.imageSmoothingEnabled = true; }
    setScreen(ctx);
    const W = app.img.width, H = app.img.height;
    ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,220,0,.55)';
    for (const l of app.detection.snapLines) {
      // Clip n·p = c to the image box by intersecting with its 4 sides.
      const pts = [];
      for (const [a, b] of [[[0, 0], [W, 0]], [[W, 0], [W, H]], [[W, H], [0, H]], [[0, H], [0, 0]]]) {
        const p = E.intersect(l, E.lineThrough(a, b));
        if (p && p[0] >= -1 && p[0] <= W + 1 && p[1] >= -1 && p[1] <= H + 1) pts.push(p);
      }
      if (pts.length >= 2) { const a = toScreen(v, pts[0]), b = toScreen(v, pts[1]); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
    }
    if (last.debug) {
      ctx.font = '11px ui-monospace, monospace';
      last.debug.quads.forEach((dq, i) => {
        const q = dq.corners.map(p => toScreen(v, [p[0] / ks, p[1] / ks]));
        ctx.strokeStyle = i < 3 ? 'rgba(255,80,255,.95)' : 'rgba(255,80,255,.3)'; ctx.lineWidth = i === 0 ? 2 : 1;
        ctx.beginPath(); q.forEach((p, j) => j ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.stroke();
        if (i < 8) { ctx.fillStyle = 'rgba(255,80,255,.95)'; ctx.fillText(`#${i + 1} ${dq.score.toFixed(2)} (${Math.round(dq.confidence * 100)}%)`, q[0][0] + 4, q[0][1] + 12 + i * 12); }
      });
    }
  }

  function drawResult(ctx, v) {
    const g = app.geo, s = app.state, pp = ensurePPreview(), C = CONFIG.colors;
    setWorld(ctx, v);
    const c = g.crop;
    // Underlay = the export fill, so preview matches output where the warp leaves the photo.
    ctx.fillStyle = underlayStyle(ctx, s.export.fill);
    const framed = app.tab === 'export' || app.tab === 'levels' || app.tab === 'overlay';
    if (framed) ctx.fillRect(c.x, c.y, c.w, c.h); else ctx.fillRect(0, 0, g.R.w, g.R.h);
    ctx.save();
    if (framed) { ctx.beginPath(); ctx.rect(c.x, c.y, c.w, c.h); ctx.clip(); }
    const m = g.MR; ctx.transform(m[0], m[3], m[1], m[4], m[2], m[5]); ctx.scale(1 / pp.q, 1 / pp.q);
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(CF.previewCanvas(CF.levelsShown()), 0, 0);
    ctx.restore();
    setScreen(ctx);
    const a = toScreen(v, [c.x, c.y]), b = toScreen(v, [c.x + c.w, c.y + c.h]);
    if (app.tab === 'levels') CF.drawLevelsOverlay(ctx, v);
    if (app.tab === 'overlay' || app.tab === 'export') CF.drawOverlayPreview(ctx, v);
    if (app.tab === 'rotate') {
      if (app.showGrid) {
        const f0 = toScreen(v, [0, 0]), f1 = toScreen(v, [g.R.w, g.R.h]), step = CONFIG.rotate.gridPx;
        ctx.strokeStyle = C.grid; ctx.lineWidth = 1; ctx.beginPath();
        const cx = (f0[0] + f1[0]) / 2, cy = (f0[1] + f1[1]) / 2;
        for (let x = cx % step; x < app.cssW; x += step) { ctx.moveTo(Math.round(x) + 0.5, 0); ctx.lineTo(Math.round(x) + 0.5, app.cssH); }
        for (let y = cy % step; y < app.cssH; y += step) { ctx.moveTo(0, Math.round(y) + 0.5); ctx.lineTo(app.cssW, Math.round(y) + 0.5); }
        ctx.stroke();
      }
      ctx.setLineDash([6, 5]); ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 1.5;
      ctx.strokeRect(a[0], a[1], b[0] - a[0], b[1] - a[1]); ctx.setLineDash([]);
    } else if (app.tab === 'crop') {
      ctx.fillStyle = C.dim; ctx.beginPath(); ctx.rect(0, 0, app.cssW, app.cssH); ctx.rect(a[0], a[1], b[0] - a[0], b[1] - a[1]); ctx.fill('evenodd');
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.strokeRect(a[0], a[1], b[0] - a[0], b[1] - a[1]);
      if (app.gesture && app.gesture.type === 'crop') {
        ctx.strokeStyle = C.thirds; ctx.lineWidth = 1; ctx.beginPath();
        for (let i = 1; i < 3; i++) {
          const x = a[0] + (b[0] - a[0]) * i / 3, y = a[1] + (b[1] - a[1]) * i / 3;
          ctx.moveTo(x, a[1]); ctx.lineTo(x, b[1]); ctx.moveTo(a[0], y); ctx.lineTo(b[0], y);
        }
        ctx.stroke();
      }
      for (const h of CF.cropHandles(v)) {
        ctx.fillStyle = '#fff'; ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.lineWidth = 1.5;
        const r = h.part.length === 2 ? 7 : 5;
        ctx.beginPath(); ctx.rect(h.p[0] - r, h.p[1] - r, 2 * r, 2 * r); ctx.fill(); ctx.stroke();
      }
    }
  }

  /* ---------- mini result preview (perspective panel) ---------- */
  let miniQueued = false;
  function requestMini() { if (!miniQueued && app.tab === 'perspective') { miniQueued = true; requestAnimationFrame(() => { miniQueued = false; drawMini(); }); } }
  function drawMini() {
    const cv = els.mini, rect = cv.getBoundingClientRect();
    if (!rect.width || !app.img) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1), S = Math.round(rect.width * dpr);
    if (cv.width !== S) { cv.width = S; cv.height = S; }
    const x = ctx2d(cv); x.fillStyle = CONFIG.theme.stage; x.fillRect(0, 0, S, S);
    const g = app.geo;
    if (!g || !g.ok) return;
    // Show the corrected card with 15% padding: mini px → P px → source px → thumb px.
    const bb = Quad.bbox(g.cardP), pad = 0.15 * Math.max(bb.w, bb.h);
    const side = Math.max(bb.w, bb.h) + 2 * pad, m = S / side;
    const ox = (bb.x0 + bb.x1) / 2 - side / 2, oy = (bb.y0 + bb.y1) / 2 - side / 2;
    const HPi = M3.inv(g.HP);
    if (!HPi) return;
    const Minv = M3.chain(M3.scale(app.thumb.k), HPi, M3.translate(ox, oy), M3.scale(1 / m));
    const out = new ImageData(S, S);
    E.warp(out, app.thumb.data, Minv, { fill: fillRGBA(app.state.export.fill === 'transparent' ? '#2b2b2b' : app.state.export.fill) });
    x.putImageData(out, 0, 0);
  }

  Object.assign(CF, { fitView, currentView, toScreen, toWorld, zoomAt, fitCurrent, requestRender, resizeCanvas, fillRGBA, ensurePPreview, draw, setScreen, loupeRadius, loupeCenter, requestMini });
})(window.CF);
