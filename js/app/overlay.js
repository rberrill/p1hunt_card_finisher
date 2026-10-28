/* =====================================================================
   js/app/overlay.js — Overlay step: a logo / watermark placed on the framed photo and merged at export.
   Shell modules share one namespace, CF (created in core.js). Names from core are
   destructured below; anything from another module is called as CF.name.
   tests/selftest.js checks these boundaries.
   ===================================================================== */
(function (CF) {
  'use strict';
  const { E, $, els, clone, makeCanvas, ctx2d, app, toast } = CF;

  /* ---------- the overlay image ----------
     state.overlay = { id, aspect, cx, cy, w, opacity } (placement relative to the crop; see
     CardEngine.overlayRect). The image itself is kept out of the edit state so undo snapshots stay
     small: `images` holds every overlay decoded this page session, by id (a hash of its bytes). */
  const images = new Map();
  let saved = null; // the browser's saved overlay: { id, type, name, settings, url } (url = thumbnail)

  const KINDS = { png: 'image/png', webp: 'image/webp', jpg: 'image/jpeg', jpeg: 'image/jpeg', svg: 'image/svg+xml' };
  const MSG = {
    type: 'That file type isn’t supported. Use PNG, WebP, JPG or SVG.',
    bad: 'Couldn’t read that image. Try another PNG, WebP, JPG or SVG file.',
    nosize: 'That SVG has no width, height or viewBox, so it can’t be sized. Re-export it with a size.',
  };
  function mimeOf(file) {
    const t = (file.type || '').toLowerCase();
    if (Object.values(KINDS).includes(t)) return t;
    const m = /\.(png|webp|jpe?g|svg)$/i.exec(file.name || '');
    return m ? KINDS[m[1].toLowerCase()] : null;
  }
  // FNV-1a over the bytes, plus the length: the same file always gets the same id.
  function hashBytes(buf) {
    const b = new Uint8Array(buf); let h = 0x811c9dc5;
    for (let i = 0; i < b.length; i++) { h ^= b[i]; h = Math.imul(h, 0x01000193); }
    return (h >>> 0).toString(16).padStart(8, '0') + '-' + b.length.toString(16);
  }
  function loadImg(blob) {
    return new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => res(img); img.onerror = () => rej(new Error('bad'));
      img.src = URL.createObjectURL(blob); // kept alive: the element is drawn again on every render
    });
  }
  // Decode to something drawImage can draw, keeping alpha. Large rasters are capped (phone memory);
  // they are never drawn bigger than the export, so the cap only costs detail beyond it.
  async function decode(buf, type) {
    if (type === 'image/svg+xml') return decodeSvg(buf);
    const blob = new Blob([buf], { type });
    let el = null, w = 0, h = 0;
    try { el = await createImageBitmap(blob); w = el.width; h = el.height; }
    catch (e) { el = await loadImg(blob); w = el.naturalWidth; h = el.naturalHeight; }
    if (!(w > 0 && h > 0)) throw new Error('bad');
    const max = CONFIG.overlay.maxPx;
    if (Math.max(w, h) > max) {
      const k = max / Math.max(w, h), c = makeCanvas(Math.round(w * k), Math.round(h * k)), x = ctx2d(c);
      x.imageSmoothingQuality = 'high'; x.drawImage(el, 0, 0, c.width, c.height);
      if (el.close) el.close();
      el = c; w = c.width; h = c.height;
    }
    return { el, width: w, height: h };
  }
  // SVG: take the proportions from width/height or the viewBox (Safari reports 0×0 for an SVG
  // without them), then give it a large intrinsic size so it rasterizes crisply at export size.
  async function decodeSvg(buf) {
    const doc = new DOMParser().parseFromString(new TextDecoder().decode(buf), 'image/svg+xml'), svg = doc.documentElement;
    if (!svg || svg.nodeName.toLowerCase() !== 'svg' || doc.getElementsByTagName('parsererror').length) throw new Error('bad');
    const num = a => { const v = svg.getAttribute(a); return v && !/%/.test(v) && parseFloat(v) > 0 ? parseFloat(v) : 0; };
    const vb = (svg.getAttribute('viewBox') || '').trim().split(/[\s,]+/).map(Number), hasVb = vb.length === 4 && vb[2] > 0 && vb[3] > 0;
    let w = num('width'), h = num('height');
    if (!(w && h) && hasVb) { if (w) h = w * vb[3] / vb[2]; else if (h) w = h * vb[2] / vb[3]; else { w = vb[2]; h = vb[3]; } }
    if (!(w > 0 && h > 0)) throw new Error('nosize');
    if (!hasVb) svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    const k = CONFIG.overlay.svgPx / Math.max(w, h);
    svg.setAttribute('width', String(w * k)); svg.setAttribute('height', String(h * k));
    const img = await loadImg(new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' }));
    return { el: img, width: w * k, height: h * k };
  }
  async function register(buf, type, name) {
    const id = hashBytes(buf);
    if (images.has(id)) return images.get(id);
    const d = await decode(buf, type);
    const rec = { id, buf, type, name: name || 'overlay', el: d.el, width: d.width, height: d.height };
    images.set(id, rec);
    return rec;
  }

  /* ---------- placement helpers ---------- */
  const frame = () => app.geo && app.geo.ok ? app.geo.crop : null;
  // Effective placement: the stored one, pulled fully inside the current crop (it may have changed since).
  function effective(ov, fw, fh) { return E.clampOverlay(ov, fw, fh); }
  function setPlacement(st, ov) { const f = frame(); st.overlay = f ? effective(ov, f.w, f.h) : ov; }
  function defaults(rec) { return { id: rec.id, aspect: rec.width / rec.height, cx: 0.5, cy: 0.5, w: E.OVERLAY_DEFAULTS.width, opacity: 1 }; }
  function current() { const ov = app.state && app.state.overlay, f = frame(); return ov && f && images.has(ov.id) ? { ov: effective(ov, f.w, f.h), f } : null; }

  function setMsg(text) { app.overlayMsg = text || ''; CF.syncUI(); }
  function place(rec, settings) {
    const s = settings || {};
    CF.commit(st => {
      const d = defaults(rec);
      setPlacement(st, Object.assign(d, { cx: s.cx ?? d.cx, cy: s.cy ?? d.cy, w: s.w ?? d.w, opacity: s.opacity ?? d.opacity }));
    }, 'overlayPlace');
    CF.Session.put('photoOverlay', { id: rec.id, buf: rec.buf, type: rec.type, name: rec.name }).catch(() => {});
  }

  // AC4–AC6: upload (button, drop or paste on this step). Errors leave the current overlay as it was.
  async function addOverlayFile(file) {
    if (!app.img || !frame() || !file) return;
    const type = mimeOf(file);
    if (!type) return setMsg(MSG.type);
    const max = CONFIG.overlay.maxBytes;
    if (file.size > max) return setMsg(`That file is ${(file.size / 1048576).toFixed(1)} MB. The overlay limit is ${max / 1048576} MB.`);
    let rec;
    try { rec = await register(await file.arrayBuffer(), type, file.name); }
    catch (e) { return setMsg(e.message === 'nosize' ? MSG.nosize : MSG.bad); }
    app.overlayMsg = '';
    place(rec, null);
    saveToBrowser(rec);
  }

  /* ---------- saved overlay (IndexedDB) — AC19–AC22 ---------- */
  function settingsOf(ov) { return { cx: ov.cx, cy: ov.cy, w: ov.w, opacity: ov.opacity }; }
  async function saveToBrowser(rec) {
    const ov = app.state.overlay, record = { id: rec.id, buf: rec.buf, type: rec.type, name: rec.name, settings: settingsOf(ov) };
    try { await CF.Session.put('overlay', record); setSaved(record); }
    catch (e) { toast('This overlay works on this photo, but it can’t be saved in this browser.', 'warn', 5000); }
  }
  function setSaved(record) {
    if (saved && saved.url) URL.revokeObjectURL(saved.url);
    saved = record ? { id: record.id, type: record.type, name: record.name, settings: record.settings, url: URL.createObjectURL(new Blob([record.buf], { type: record.type })) } : null;
    CF.syncUI();
  }
  async function loadSavedOverlay() {
    try { const r = await CF.Session.get('overlay'); if (r && r.buf) setSaved(r); } catch (e) { /* storage unavailable: nothing saved */ }
  }
  // Q8: the latest placement becomes the saved "last-used" settings (only for the saved logo).
  let settingsTimer = 0;
  function overlayStateChanged() {
    const ov = app.state && app.state.overlay;
    if (!ov || !saved || ov.id !== saved.id) return;
    const s = settingsOf(ov);
    if (JSON.stringify(s) === JSON.stringify(saved.settings)) return;
    saved.settings = s;
    clearTimeout(settingsTimer);
    settingsTimer = setTimeout(async () => {
      try { const r = await CF.Session.get('overlay'); if (r && r.id === saved.id) { r.settings = saved.settings; await CF.Session.put('overlay', r); } } catch (e) { /* not saved */ }
    }, CONFIG.session.saveDelayMs);
  }
  async function useSaved() {
    if (!saved) return;
    let rec = images.get(saved.id);
    try {
      if (!rec) { const r = await CF.Session.get('overlay'); if (!r) { setSaved(null); return; } rec = await register(r.buf, r.type, r.name); }
    } catch (e) { return setMsg(MSG.bad); }
    app.overlayMsg = '';
    place(rec, saved.settings);
  }
  async function deleteSaved() { // Q9: storage only; the logo on this photo stays until Remove
    try { await CF.Session.del('overlay'); } catch (e) { /* already gone */ }
    setSaved(null);
  }
  // After a resume (or an undo past a reload), find the overlay image for the restored state.
  async function ensureOverlayImage() {
    const ov = app.state && app.state.overlay;
    if (!ov || images.has(ov.id)) return;
    for (const key of ['photoOverlay', 'overlay']) {
      try { const r = await CF.Session.get(key); if (r && r.id === ov.id) { await register(r.buf, r.type, r.name); CF.requestRender(); CF.syncUI(); return; } } catch (e) { /* try the next */ }
    }
  }

  /* ---------- edits files: the overlay image is embedded (Q10) ---------- */
  function toBase64(buf) { const b = new Uint8Array(buf); let s = ''; for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000)); return btoa(s); }
  function fromBase64(str) { const s = atob(str), b = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i); return b.buffer; }
  function overlayForEdits(st) {
    const rec = st.overlay && images.get(st.overlay.id);
    return rec ? { id: rec.id, type: rec.type, name: rec.name, data: toBase64(rec.buf) } : null;
  }
  async function overlayFromEdits(st) { // returns false if the embedded image can't be used
    const o = st.overlayImage; delete st.overlayImage;
    if (!st.overlay) return true;
    if (!o) return images.has(st.overlay.id);
    try {
      const rec = await register(fromBase64(o.data), o.type, o.name);
      st.overlay.id = rec.id;
      CF.Session.put('photoOverlay', { id: rec.id, buf: rec.buf, type: rec.type, name: rec.name }).catch(() => {});
      return true;
    } catch (e) { return false; }
  }

  /* ---------- export compositing (AC8, AC23) ---------- */
  // Draws the overlay onto the finished output canvas, before encoding. drawImage keeps the logo's
  // own alpha; globalAlpha applies the opacity on top.
  function compositeOverlay(ctx, st, outW, outH) {
    if (!st.overlay) return;
    const rec = images.get(st.overlay.id);
    if (!rec) throw new Error('The overlay image isn’t loaded. Open the Overlay step and add it again.');
    const r = E.overlayRect(effective(st.overlay, outW, outH), outW, outH);
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, st.overlay.opacity));
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(rec.el, r.x, r.y, r.w, r.h);
    ctx.restore();
  }

  /* ---------- preview ---------- */
  function screenRect(v, ov, f) {
    const r = E.overlayRect(ov, f.w, f.h), a = CF.toScreen(v, [f.x + r.x, f.y + r.y]), b = CF.toScreen(v, [f.x + r.x + r.w, f.y + r.y + r.h]);
    return { x: a[0], y: a[1], w: b[0] - a[0], h: b[1] - a[1] };
  }
  function overlayCorners(r) { return { nw: [r.x, r.y], ne: [r.x + r.w, r.y], se: [r.x + r.w, r.y + r.h], sw: [r.x, r.y + r.h] }; }
  function drawOverlayPreview(ctx, v) {
    const c = current(); if (!c) return;
    const rec = images.get(c.ov.id), r = screenRect(v, c.ov, c.f);
    CF.setScreen(ctx);
    ctx.save();
    ctx.globalAlpha = c.ov.opacity; ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(rec.el, r.x, r.y, r.w, r.h);
    ctx.restore();
    if (app.tab !== 'overlay') return;
    if (!app.gesture) drawHotSpots(ctx, v, c.f);
    ctx.setLineDash([6, 5]); ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 1.5;
    ctx.strokeRect(r.x, r.y, r.w, r.h); ctx.setLineDash([]);
    for (const p of Object.values(overlayCorners(r))) {
      ctx.fillStyle = '#fff'; ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.rect(p[0] - 7, p[1] - 7, 14, 14); ctx.fill(); ctx.stroke();
    }
  }

  /* ---------- snap hot spots: five rings on the photo (four corners and the center) ----------
     A still tap on a ring snaps the logo there; a drag that starts on one moves the logo as usual.
     The rings hide during a gesture so they never get in the way of placing by hand. */
  function hotSpots(v, f) {
    const a = CF.toScreen(v, [f.x, f.y]), b = CF.toScreen(v, [f.x + f.w, f.y + f.h]);
    const i = Math.min(CONFIG.overlay.hotSpotInset, (b[0] - a[0]) / 4, (b[1] - a[1]) / 4);
    return { tl: [a[0] + i, a[1] + i], tr: [b[0] - i, a[1] + i], c: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], bl: [a[0] + i, b[1] - i], br: [b[0] - i, b[1] - i] };
  }
  function hitSpot(v, p) {
    const c = current(); if (!c) return null;
    let best = null, bd = CONFIG.handle.hitRadius;
    for (const [k, q] of Object.entries(hotSpots(v, c.f))) { const d = Math.hypot(q[0] - p[0], q[1] - p[1]); if (d < bd) { bd = d; best = k; } }
    return best;
  }
  function drawHotSpots(ctx, v, f) {
    for (const p of Object.values(hotSpots(v, f))) {
      ctx.beginPath(); ctx.arc(p[0], p[1], 11, 0, Math.PI * 2);
      ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.stroke();
      ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.stroke();
      ctx.beginPath(); ctx.arc(p[0], p[1], 2.5, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.fill();
    }
  }
  // Called on pointer-up for a tap (no drag) that started on a ring: undo any sub-threshold jitter, then snap.
  function overlaySpotTap(g) {
    app.gesture = null;
    app.state.overlay = clone(g.before.overlay);
    adjust((ov, f) => E.snapOverlay(ov, g.spot, f.w, f.h));
  }

  /* ---------- gestures (Q5: on this step every touch acts on the overlay; the photo stays framed) ---------- */
  function hitCorner(v, p) {
    const c = current(); if (!c) return null;
    let best = null, bd = CONFIG.handle.hitRadius;
    for (const [k, q] of Object.entries(overlayCorners(screenRect(v, c.ov, c.f)))) { const d = Math.hypot(q[0] - p[0], q[1] - p[1]); if (d < bd) { bd = d; best = k; } }
    return best;
  }
  function overlayPointerDown(p, pts) {
    const c = current(), v = CF.currentView();
    if (!c || !v) { app.gesture = null; return; }
    const before = app.gesture && app.gesture.before ? app.gesture.before : clone(app.state);
    if (pts.length === 2) {
      const [a, b] = pts;
      app.gesture = { type: 'ovPinch', before, ov0: c.ov, d0: Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, m0: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], moved: true };
      return;
    }
    if (pts.length > 2) return;
    const corner = hitCorner(v, p);
    if (corner) {
      const r = screenRect(v, c.ov, c.f), opp = { nw: 'se', ne: 'sw', se: 'nw', sw: 'ne' }[corner];
      app.gesture = { type: 'ovResize', before, ov0: c.ov, corner, anchor: CF.toWorld(v, overlayCorners(r)[opp]), start: p, last: p, moved: false };
    } else app.gesture = { type: 'ovMove', before, ov0: c.ov, w0: CF.toWorld(v, p), start: p, last: p, moved: false, spot: hitSpot(v, p) };
    CF.requestRender();
  }
  function overlayPointerMove(g, p, pts) {
    const c = current(), v = CF.currentView(); if (!c || !v) return;
    const f = c.f, ov0 = g.ov0;
    let next = null;
    if (g.type === 'ovPinch') {
      if (pts.length < 2) return;
      const [a, b] = pts, d = Math.hypot(a[0] - b[0], a[1] - b[1]), m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      next = Object.assign({}, ov0, { w: ov0.w * d / g.d0, cx: ov0.cx + (m[0] - g.m0[0]) / v.z / f.w, cy: ov0.cy + (m[1] - g.m0[1]) / v.z / f.h });
    } else if (g.type === 'ovMove') {
      const w = CF.toWorld(v, p);
      next = Object.assign({}, ov0, { cx: ov0.cx + (w[0] - g.w0[0]) / f.w, cy: ov0.cy + (w[1] - g.w0[1]) / f.h });
    } else if (g.type === 'ovResize') {
      // Aspect locked: the larger of the two pointer distances from the opposite corner sets the size.
      const w = CF.toWorld(v, p), sx = g.corner[1] === 'e' ? 1 : -1, sy = g.corner[0] === 's' ? 1 : -1;
      const wPx = Math.max(8, Math.max(sx * (w[0] - g.anchor[0]), sy * (w[1] - g.anchor[1]) * ov0.aspect)), hPx = wPx / ov0.aspect;
      next = Object.assign({}, ov0, { w: wPx / f.w, cx: (g.anchor[0] + sx * wPx / 2 - f.x) / f.w, cy: (g.anchor[1] + sy * hPx / 2 - f.y) / f.h });
    }
    if (!next) return;
    g.last = p; if (g.start && Math.hypot(p[0] - g.start[0], p[1] - g.start[1]) > 4) g.moved = true;
    app.state.overlay = effective(next, f.w, f.h);
    CF.requestRender();
  }
  // A pinch that loses a finger carries on as a move with the remaining one (one undo step overall).
  function overlayPinchEnded(remaining) {
    const c = current(), v = CF.currentView(), g = app.gesture;
    if (!c || !v || !g) return;
    app.gesture = { type: 'ovMove', before: g.before, ov0: c.ov, w0: CF.toWorld(v, remaining), start: remaining, last: remaining, moved: true };
  }
  function overlayCursor(v, p) {
    if (!current()) return 'default';
    const k = hitCorner(v, p);
    return k ? (k === 'nw' || k === 'se' ? 'nwse-resize' : 'nesw-resize') : hitSpot(v, p) ? 'pointer' : 'move';
  }

  /* ---------- nudges, keys, wheel, buttons (AC14–AC18) ---------- */
  function adjust(fn, key) {
    const c = current(); if (!c) return;
    CF.commit(st => { setPlacement(st, fn(Object.assign({}, c.ov), c.f)); }, key);
  }
  function nudge(dir, big) { // dir: [dx, dy] or 'grow' / 'shrink'
    const O = CONFIG.overlay, pct = (big ? O.nudgeShiftPct : O.nudgePct) / 100;
    if (dir === 'grow' || dir === 'shrink') adjust(ov => Object.assign(ov, { w: ov.w * (dir === 'grow' ? O.sizeStep : 1 / O.sizeStep) }), 'overlayNudge');
    else adjust((ov, f) => Object.assign(ov, { cx: ov.cx + dir[0] * pct, cy: ov.cy + dir[1] * pct * f.w / f.h }), 'overlayNudge');
  }
  function overlayKey(e) {
    const dirs = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    if (dirs[e.key]) { nudge(dirs[e.key], e.shiftKey); return true; }
    if (e.key === '+' || e.key === '=') { nudge('grow'); return true; }
    if (e.key === '-' || e.key === '_') { nudge('shrink'); return true; }
    return false;
  }
  function overlayWheel(dy) { adjust(ov => Object.assign(ov, { w: ov.w * Math.exp(-dy * 0.0015) }), 'overlayWheel'); }

  function bindOverlayControls() {
    els.overlayInput = $('overlayInput');
    $('btnOvUpload').onclick = () => els.overlayInput.click();
    els.overlayInput.addEventListener('change', () => { const f = els.overlayInput.files[0]; els.overlayInput.value = ''; if (f) addOverlayFile(f); });
    $('btnUseSaved').onclick = useSaved;
    $('btnOvDeleteSaved').onclick = deleteSaved;
    $('btnOvRemove').onclick = () => { app.overlayMsg = ''; CF.commit(st => { st.overlay = null; }); };
    $('btnOvReset').onclick = () => { const ov = app.state.overlay; if (ov) CF.commit(st => { setPlacement(st, Object.assign({}, ov, { cx: 0.5, cy: 0.5, w: E.OVERLAY_DEFAULTS.width, opacity: 1 })); }); };
    // Opacity updates live while sliding; one undo step per slide.
    const op = $('ovOpacity'); let opBefore = null;
    op.oninput = () => {
      if (!app.state.overlay) return;
      if (!opBefore) opBefore = clone(app.state);
      app.state.overlay.opacity = op.value / 100; $('ovOpacityVal').textContent = op.value + '%'; CF.requestRender();
    };
    op.onchange = () => { if (opBefore) CF.commitFrom(opBefore, 'overlayOpacity'); opBefore = null; };
    // On-screen arrows and − +: same hold-to-repeat timing as the perspective nudge strip.
    let timer = 0;
    document.querySelectorAll('[data-onudge]').forEach(b => {
      const stop = () => { clearTimeout(timer); clearInterval(timer); };
      const step = () => { const d = b.dataset.onudge; nudge(d === 'grow' || d === 'shrink' ? d : d.split(',').map(Number)); };
      b.addEventListener('pointerdown', e => { e.preventDefault(); stop(); step(); timer = setTimeout(() => { timer = setInterval(step, CONFIG.nudge.repeatMs); }, CONFIG.nudge.delayMs); });
      for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) b.addEventListener(ev, stop);
      b.addEventListener('contextmenu', e => e.preventDefault());
    });
  }

  function syncOverlay() {
    const ov = app.state && app.state.overlay, has = !!app.img, placed = !!ov;
    $('ovEmpty').hidden = placed; $('ovEdit').hidden = !placed;
    $('ovSavedRow').hidden = !saved;
    if (saved && $('ovThumb').getAttribute('src') !== saved.url) $('ovThumb').src = saved.url;
    $('ovHint').hidden = !!saved;
    const up = $('btnOvUpload');
    up.textContent = placed ? 'Replace' : 'Upload'; up.classList.toggle('primary', !placed);
    up.disabled = !has; $('btnUseSaved').disabled = !has || !saved;
    $('btnOvDeleteSaved').disabled = !saved;
    for (const id of ['btnOvReset', 'btnOvRemove']) $(id).disabled = !placed;
    document.querySelectorAll('[data-onudge], #ovOpacity').forEach(x => { x.disabled = !placed; });
    if (placed) { const pct = Math.round(ov.opacity * 100); $('ovOpacity').value = pct; $('ovOpacityVal').textContent = pct + '%'; }
    const st = $('overlayStatus'); st.className = 'status' + (app.overlayMsg ? ' err' : ''); st.textContent = app.overlayMsg || '';
  }

  Object.assign(CF, {
    addOverlayFile, loadSavedOverlay, overlayStateChanged, ensureOverlayImage, overlayForEdits, overlayFromEdits, compositeOverlay,
    drawOverlayPreview, overlayPointerDown, overlayPointerMove, overlayPinchEnded, overlaySpotTap, overlayCursor, overlayKey, overlayWheel,
    bindOverlayControls, syncOverlay,
  });
})(window.CF);
