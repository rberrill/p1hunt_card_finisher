/* =====================================================================
   js/app/input.js — Pointer and keyboard input: handles, crop box, pan, pinch, wheel, snapping, nudges.
   Shell modules share one namespace, CF (created in core.js). Names from core are
   destructured below; anything from another module is called as CF.name.
   tests/selftest.js checks these boundaries.
   ===================================================================== */
(function (CF) {
  'use strict';
  const { E, els, clone, app, toast } = CF;

  /* ---------- pointer input: handles, crop box, pan, pinch, wheel ---------- */
  const pointers = new Map();
  let lastTap = { t: 0, x: 0, y: 0 }, lastHandleTap = { t: 0, idx: -1 };
  function localPt(e) { const r = els.canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }

  function hitHandle(v, p) {
    const s = app.state, q = s.corners.map(c => CF.toScreen(v, c)), R = CONFIG.handle.hitRadius;
    let best = -1, bd = R;
    q.forEach((c, k) => { const d = Math.hypot(c[0] - p[0], c[1] - p[1]); if (d < bd) { bd = d; best = k; } });
    if (best >= 0) return best;
    for (let k = 0; k < 4; k++) { const m = E.V.mid(q[k], q[(k + 1) % 4]), d = Math.hypot(m[0] - p[0], m[1] - p[1]); if (d < bd) { bd = d; best = 4 + k; } }
    return best;
  }
  function cropHandles(v) {
    const c = app.geo.crop, a = CF.toScreen(v, [c.x, c.y]), b = CF.toScreen(v, [c.x + c.w, c.y + c.h]), mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
    return [{ part: 'nw', p: a }, { part: 'ne', p: [b[0], a[1]] }, { part: 'se', p: b }, { part: 'sw', p: [a[0], b[1]] },
      { part: 'n', p: [mx, a[1]] }, { part: 'e', p: [b[0], my] }, { part: 's', p: [mx, b[1]] }, { part: 'w', p: [a[0], my] }];
  }
  function hitCrop(v, p) {
    let best = null, bd = CONFIG.handle.hitRadius;
    for (const h of cropHandles(v)) { const d = Math.hypot(h.p[0] - p[0], h.p[1] - p[1]); if (d < bd) { bd = d; best = h.part; } }
    if (best) return best;
    const c = app.geo.crop, w = CF.toWorld(v, p);
    return w[0] > c.x && w[0] < c.x + c.w && w[1] > c.y && w[1] < c.y + c.h ? 'move' : null;
  }

  function onPointerDown(e) {
    if (!app.img) return;
    els.canvas.focus({ preventScroll: true });
    try { els.canvas.setPointerCapture(e.pointerId); } catch (err) { /* pointer already gone */ }
    const p = localPt(e);
    pointers.set(e.pointerId, p);
    const v = CF.currentView(); if (!v) return;
    if (pointers.size === 2) {
      endGesture(); // a second finger turns any drag into a pinch
      const [a, b] = [...pointers.values()];
      app.gesture = { type: 'pinch', d0: Math.hypot(a[0] - b[0], a[1] - b[1]), m0: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], v0: { ...v } };
      return;
    }
    if (pointers.size > 2) return;
    const base = { start: p, last: p, t0: performance.now(), pointerType: e.pointerType, moved: false };
    if (app.tab === 'perspective' && !app.previewMode) {
      if (app.seedMode) { app.detection.seed = CF.toWorld(v, p); app.seedMode = false; CF.syncUI(); CF.requestRender(); toast('Seed set. Press Detect.'); return; }
      const h = hitHandle(v, p);
      if (h >= 0) {
        app.selected = h;
        app.gesture = Object.assign(base, { type: 'handle', idx: h, w0: CF.toWorld(v, p), c0: clone(app.state.corners), before: clone(app.state) });
        CF.requestRender(); return;
      }
    }
    if (app.tab === 'crop' && app.geo && app.geo.ok) {
      const part = hitCrop(v, p);
      if (part) { app.gesture = Object.assign(base, { type: 'crop', part, w0: CF.toWorld(v, p), r0: { ...app.geo.crop }, before: clone(app.state), shift: e.shiftKey }); return; }
    }
    if (app.tab === 'levels' && app.dropper && app.geo && app.geo.ok) { app.gesture = Object.assign(base, { type: 'dropper' }); CF.requestRender(); return; }
    app.gesture = Object.assign(base, { type: 'pan', v0: { x: v.x, y: v.y } });
    if (app.tab === 'levels' && app.geo && app.geo.ok) {
      // Levels: press and hold the photo (without moving) to compare with no levels.
      const g = app.gesture;
      g.holdTimer = setTimeout(() => { if (app.gesture === g && !g.moved) { g.comparing = true; CF.setCompare(true); } }, CONFIG.levels.compareHoldMs);
    }
  }

  function onPointerMove(e) {
    if (!pointers.has(e.pointerId)) { hoverCursor(e); return; }
    const p = localPt(e); pointers.set(e.pointerId, p);
    const g = app.gesture, v = CF.currentView(); if (!g || !v) return;
    if (g.type === 'pinch') {
      if (pointers.size < 2) return;
      const [a, b] = [...pointers.values()];
      const d = Math.hypot(a[0] - b[0], a[1] - b[1]), m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      const z = Math.min(64, Math.max(0.01, g.v0.z * d / g.d0));
      const wm = [(g.m0[0] - g.v0.x) / g.v0.z, (g.m0[1] - g.v0.y) / g.v0.z]; // world point under the starting midpoint
      Object.assign(v, { z, x: m[0] - wm[0] * z, y: m[1] - wm[1] * z, auto: false });
      CF.requestRender(); return;
    }
    g.last = p;
    if (Math.hypot(p[0] - g.start[0], p[1] - g.start[1]) > 4) g.moved = true;
    if (g.type === 'dropper') { CF.requestRender(); return; }
    if (g.type === 'pan' && g.comparing) return;
    if (g.type === 'pan') { v.x = g.v0.x + p[0] - g.start[0]; v.y = g.v0.y + p[1] - g.start[1]; v.auto = false; CF.requestRender(); return; }
    const w = CF.toWorld(v, p), dx = w[0] - g.w0[0], dy = w[1] - g.w0[1];
    if (g.type === 'handle') { moveHandle(g.idx, g.c0, dx, dy, v); CF.liveChanged(); return; }
    if (g.type === 'crop') { dragCrop(g, dx, dy, e.shiftKey || g.shift); CF.liveChanged(); }
  }

  function onPointerUp(e) {
    if (!pointers.has(e.pointerId)) return;
    pointers.delete(e.pointerId);
    const g = app.gesture;
    if (g && g.type === 'pinch') { if (pointers.size === 0) app.gesture = null; return; }
    if (g && g.type === 'pan' && !g.moved && performance.now() - g.t0 < 300) {
      // Double-tap / double-click on empty canvas fits the view.
      const t = performance.now(), p = g.start;
      if (t - lastTap.t < 320 && Math.hypot(p[0] - lastTap.x, p[1] - lastTap.y) < 24) { CF.fitCurrent(); lastTap.t = 0; }
      else lastTap = { t, x: p[0], y: p[1] };
    }
    if (g && g.type === 'handle' && !g.moved && performance.now() - g.t0 < 300) {
      // Double-tap a handle: zoom in on it; double-tap again while zoomed in: fit the photo.
      const t = performance.now();
      if (lastHandleTap.idx === g.idx && t - lastHandleTap.t < 350) { zoomToHandle(g.idx); lastHandleTap.t = 0; }
      else lastHandleTap = { t, idx: g.idx };
    }
    endGesture();
  }
  function zoomToHandle(k) {
    const v = CF.currentView(), s = app.state;
    if (!v) return;
    const fitZ = CF.fitView(app.img.width, app.img.height).z;
    if (v.z > fitZ * 2) { app.views.source = null; CF.requestRender(); return; }
    const c = k < 4 ? s.corners[k] : E.V.mid(s.corners[k - 4], s.corners[(k - 3) % 4]), z = Math.min(64, fitZ * CONFIG.handleZoom);
    Object.assign(v, { z, x: app.cssW / 2 - c[0] * z, y: app.cssH / 2 - c[1] * z, auto: false });
    CF.requestRender();
  }
  function endGesture() {
    const g = app.gesture; app.gesture = null;
    if (!g) return;
    clearTimeout(g.holdTimer);
    if (g.comparing) CF.setCompare(false);
    if (g.type === 'dropper') CF.pickAt(g.last);
    if ((g.type === 'handle' || g.type === 'crop') && g.before) CF.commitFrom(g.before);
    CF.requestRender();
  }

  function moveHandle(idx, c0, dx, dy, v) {
    const s = app.state;
    if (idx < 4) {
      let p = [c0[idx][0] + dx, c0[idx][1] + dy];
      if (app.snap) p = snapPoint(p, v);
      s.corners[idx] = p;
    } else {
      // Edge handle: move the whole edge parallel to itself (along its normal).
      const k = idx - 4, a = c0[k], b = c0[(k + 1) % 4];
      const L = E.V.dist(a, b) || 1, nx = -(b[1] - a[1]) / L, ny = (b[0] - a[0]) / L;
      let t = dx * nx + dy * ny;
      if (app.snap) t = snapEdge(a, b, nx, ny, t, v);
      s.corners = c0.map(p => p.slice());
      s.corners[k] = [a[0] + nx * t, a[1] + ny * t];
      s.corners[(k + 1) % 4] = [b[0] + nx * t, b[1] + ny * t];
    }
  }
  function snapPoint(p, v) {
    const r = CONFIG.snapRadiusPx / v.z;
    let best = null, bd = r;
    for (const q of app.detection.snapPts) { const d = E.V.dist(p, q); if (d < bd) { bd = d; best = q; } }
    return best ? best.slice() : p;
  }
  function snapEdge(a, b, nx, ny, t, v) {
    const r = CONFIG.snapRadiusPx / v.z, m = [(a[0] + b[0]) / 2 + nx * t, (a[1] + b[1]) / 2 + ny * t];
    let best = t, bd = r;
    for (const l of app.detection.snapLines) {
      if (Math.abs(l.nx * nx + l.ny * ny) < Math.cos(3 * Math.PI / 180)) continue; // must run parallel (±3°)
      const d = l.nx * m[0] + l.ny * m[1] - l.c;
      if (Math.abs(d) < bd) { bd = Math.abs(d); best = t - d / (l.nx * nx + l.ny * ny); }
    }
    return best;
  }

  function dragCrop(g, dx, dy, shift) {
    const s = app.state, G = app.geo, Rw = G.R.w, Rh = G.R.h, r0 = g.r0, min = CONFIG.crop.minSizePx;
    let ratio = E.cropRatio(s.crop, s.source.width, s.source.height);
    if (!ratio && shift) ratio = r0.w / r0.h;
    let x0 = r0.x, y0 = r0.y, x1 = r0.x + r0.w, y1 = r0.y + r0.h;
    if (g.part === 'move') {
      const nx = Math.min(Math.max(0, x0 + dx), Rw - r0.w), ny = Math.min(Math.max(0, y0 + dy), Rh - r0.h);
      x0 = nx; y0 = ny; x1 = nx + r0.w; y1 = ny + r0.h;
    } else {
      const P = g.part;
      if (P.includes('w')) x0 = Math.min(Math.max(0, x0 + dx), x1 - min);
      if (P.includes('e')) x1 = Math.max(Math.min(Rw, x1 + dx), x0 + min);
      if (P.includes('n')) y0 = Math.min(Math.max(0, y0 + dy), y1 - min);
      if (P.includes('s')) y1 = Math.max(Math.min(Rh, y1 + dy), y0 + min);
      if (ratio) {
        let w = x1 - x0, h = y1 - y0;
        if (P.length === 2) { if (w / h > ratio) w = h * ratio; else h = w / ratio; }
        else if (P === 'e' || P === 'w') h = w / ratio; else w = h * ratio;
        // Anchor: the opposite corner/edge stays put; side handles stay centered on the other axis.
        const ax = P.includes('w') ? r0.x + r0.w : P.includes('e') ? r0.x : r0.x + r0.w / 2;
        const ay = P.includes('n') ? r0.y + r0.h : P.includes('s') ? r0.y : r0.y + r0.h / 2;
        // Shrink to stay inside the frame.
        const maxW = P.includes('w') ? ax : P.includes('e') ? Rw - ax : 2 * Math.min(ax, Rw - ax);
        const maxH = P.includes('n') ? ay : P.includes('s') ? Rh - ay : 2 * Math.min(ay, Rh - ay);
        const k = Math.min(1, maxW / w, maxH / h); w *= k; h *= k;
        x0 = P.includes('w') ? ax - w : P.includes('e') ? ax : ax - w / 2;
        y0 = P.includes('n') ? ay - h : P.includes('s') ? ay : ay - h / 2;
        x1 = x0 + w; y1 = y0 + h;
      }
    }
    setCropAbs({ x: x0, y: y0, w: x1 - x0, h: y1 - y0 });
  }
  // Store an absolute R-frame rect as the proportional manual crop.
  function setCropAbs(r) {
    const G = app.geo, L = G.L;
    app.state.crop.mode = 'manual';
    app.state.crop.rect = { cx: (r.x + r.w / 2 - G.R.w / 2) / L, cy: (r.y + r.h / 2 - G.R.h / 2) / L, w: r.w / L, h: r.h / L };
  }

  function hoverCursor(e) {
    if (e.pointerType !== 'mouse' || !app.img || app.gesture) return;
    const v = CF.currentView(), p = localPt(e); let c = 'grab';
    if (v && app.tab === 'perspective' && !app.previewMode) {
      if (app.seedMode) c = 'crosshair'; else if (hitHandle(v, p) >= 0) c = 'move';
    } else if (v && app.tab === 'crop' && app.geo && app.geo.ok) {
      const h = hitCrop(v, p);
      c = !h ? 'grab' : h === 'move' ? 'move' : ({ n: 'ns', s: 'ns', e: 'ew', w: 'ew', nw: 'nwse', se: 'nwse', ne: 'nesw', sw: 'nesw' })[h] + '-resize';
    }
    if (app.tab === 'levels' && app.dropper) c = 'crosshair';
    els.canvas.style.cursor = c;
  }

  function onWheel(e) {
    if (!app.img) return;
    e.preventDefault();
    const v = CF.currentView(); if (!v) return;
    const p = localPt(e), dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
    CF.zoomAt(v, p[0], p[1], Math.exp(-dy * (e.ctrlKey ? 0.01 : 0.0015)));
    CF.requestRender();
  }

  /* ---------- keyboard ---------- */
  function keyMatch(e, spec) {
    const parts = spec.toLowerCase().split('+'), key = parts.pop();
    const mod = e.ctrlKey || e.metaKey;
    return (e.key.toLowerCase() === key || (key === 'tab' && e.key === 'Tab')) &&
      parts.includes('mod') === mod && parts.includes('shift') === e.shiftKey;
  }
  function onKeyDown(e) {
    const t = e.target, typing = t && (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA');
    // Undo/redo only defer to the browser inside the debug panel's tuning fields, where native
    // text undo is what you want. Sliders, toggles, buttons and the degrees box keep app undo,
    // since focus stays on them after use.
    const textEntry = t && t.closest && !!t.closest('#debugPanel') && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA');
    const K = CONFIG.keys;
    if (keyMatch(e, K.undo)) { if (!textEntry) { e.preventDefault(); CF.undo(); } return; }
    if (keyMatch(e, K.redo) || keyMatch(e, K.redoAlt)) { if (!textEntry) { e.preventDefault(); CF.redo(); } return; }
    if (typing || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === K.debug) { CF.toggleDebugPanel(); return; }
    if (!app.img) return;
    const k = e.key.toLowerCase();
    if (k === K.fit) { CF.fitCurrent(); return; }
    if (k === K.compare && app.tab === 'levels') { if (!e.repeat) CF.setCompare(true); return; }
    if (/^[1-5]$/.test(e.key)) { CF.setTab(['perspective', 'rotate', 'crop', 'levels', 'export'][+e.key - 1]); return; }
    if (app.tab !== 'perspective') return;
    // Tab cycles handles only while the canvas (or nothing) has focus, so form navigation still works.
    if (e.key === 'Tab' && (document.activeElement === els.canvas || document.activeElement === document.body)) {
      e.preventDefault(); app.selected = (app.selected + (e.shiftKey ? 7 : 1)) % 8; CF.requestRender(); return;
    }
    const dirs = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    if (dirs[e.key] && app.selected >= 0) {
      e.preventDefault();
      const n = e.shiftKey ? K.nudgeShift : K.nudge, [dx, dy] = dirs[e.key];
      CF.commit(s => moveHandleBy(s, app.selected, dx * n, dy * n), 'nudge');
    }
  }
  function moveHandleBy(s, idx, dx, dy) {
    if (idx < 4) { s.corners[idx] = [s.corners[idx][0] + dx, s.corners[idx][1] + dy]; return; }
    const k = idx - 4, a = s.corners[k], b = s.corners[(k + 1) % 4];
    const L = E.V.dist(a, b) || 1, nx = -(b[1] - a[1]) / L, ny = (b[0] - a[0]) / L, t = dx * nx + dy * ny;
    s.corners[k] = [a[0] + nx * t, a[1] + ny * t]; s.corners[(k + 1) % 4] = [b[0] + nx * t, b[1] + ny * t];
  }

  Object.assign(CF, { cropHandles, onPointerDown, onPointerMove, onPointerUp, setCropAbs, onWheel, onKeyDown, moveHandleBy });
})(window.CF);
