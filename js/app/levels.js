/* =====================================================================
   js/app/levels.js — Levels: draft → apply/discard, Auto, the dropper, compare, and the levels overlays.
   Shell modules share one namespace, CF (created in core.js). Names from core are
   destructured below; anything from another module is called as CF.name.
   tests/selftest.js checks these boundaries.
   ===================================================================== */
(function (CF) {
  'use strict';
  const { E, M3, els, clone, makeCanvas, ctx2d, app, geoCfg, toast } = CF;

  /* ---------- levels: draft → apply ---------- */
  // Picks and Auto edit a draft that only the Levels tab shows. Apply commits it to the edit
  // state (one undo step); every other tab and the export use the applied levels.
  const draftLevels = () => app.levelsPending ? app.levelsDraft : (app.state.levels || null);
  const levelsShown = () => app.tab === 'levels' ? (app.compare ? null : draftLevels()) : (app.state.levels || null);
  const luma = c => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];

  function setDraft(mutator) {
    const d = clone(draftLevels() || { white: null, black: null });
    mutator(d);
    app.levelsDraft = d.white || d.black ? d : null;
    app.levelsPending = JSON.stringify(app.levelsDraft) !== JSON.stringify(app.state.levels || null);
    CF.syncUI(); CF.requestRender(); CF.Session.saveSoon();
  }
  function applyLevels() {
    if (!app.levelsPending) return;
    const d = app.levelsDraft;
    app.levelsPending = false; app.levelsDraft = null;
    CF.commit(s => { s.levels = d ? clone(d) : null; });
  }
  function discardLevels() { app.levelsPending = false; app.levelsDraft = null; CF.syncUI(); CF.requestRender(); CF.Session.saveSoon(); }

  // Small render of the current framing (no levels) from the preview copy, for Auto.
  function renderSmall(maxPx) {
    const st = clone(app.state); st.export.longEdge = maxPx; st.levels = null;
    const g = E.computeGeometry(st, geoCfg());
    if (!g.ok) return null;
    const out = new ImageData(g.out.w, g.out.h);
    return E.warp(out, app.preview.data, M3.mul(M3.scale(app.preview.k), g.MoutInv), { fill: [0, 0, 0, 0] });
  }
  function autoLevelsDraft() {
    const img = renderSmall(CONFIG.levels.autoSamplePx);
    const a = img && E.autoLevels(img, CONFIG.levels);
    if (!a) { toast('Couldn’t estimate levels from this image.', 'warn'); return; }
    setDraft(d => { d.white = a.white; d.black = a.black; d.whiteAt = null; d.blackAt = null; });
    toast(a.black ? 'Auto set white and black points. Check them, then Apply.' : 'Auto set the white point (no clear black). Check it, then Apply.');
  }

  // Dropper: average a patch of the full-resolution photo under the pick point.
  function pickAt(screenPt) {
    const which = app.dropper, v = CF.currentView(), g = app.geo;
    app.dropper = null;
    if (!which || !v || !g || !g.ok) { CF.syncUI(); return; }
    const SRi = M3.inv(g.SR), w = CF.toWorld(v, screenPt);
    const p = M3.apply(SRi, w[0], w[1]), q = M3.apply(SRi, w[0] + CONFIG.levels.sampleRadiusPx / v.z, w[1]);
    if (!(p[0] >= 0 && p[1] >= 0 && p[0] < app.img.width && p[1] < app.img.height)) { toast('That spot is outside the photo.', 'warn'); CF.syncUI(); return; }
    const r = Math.max(4, E.V.dist(p, q));
    const roi = CF.readRegion({ x0: p[0] - r, y0: p[1] - r, x1: p[0] + r, y1: p[1] + r }, 1e6);
    const col = roi && E.meanColor(roi, CONFIG.levels.sampleTrim);
    if (!col) { CF.syncUI(); return; }
    const d = draftLevels() || {};
    if (which === 'white' && d.black && luma(col) <= luma(d.black) + 20) { toast('That spot is darker than the black point. Pick something brighter.', 'warn'); CF.syncUI(); return; }
    if (which === 'black' && luma(col) > CONFIG.levels.maxBlackLuma) { toast('That spot is too light to be a black point. Pick something dark, or skip the black point.', 'warn'); CF.syncUI(); return; }
    if (which === 'black' && d.white && luma(col) >= luma(d.white) - 20) { toast('That spot is brighter than the white point. Pick something darker.', 'warn'); CF.syncUI(); return; }
    setDraft(dd => { dd[which] = col; dd[which + 'At'] = [Math.round(p[0]), Math.round(p[1])]; });
  }
  function setCompare(on) { if (app.compare !== on) { app.compare = on; CF.requestRender(); } }

  // The warped preview with a levels LUT applied, cached per (preview, levels).
  function previewCanvas(levels) {
    const pp = CF.ensurePPreview();
    const lut = E.levelsLUT(levels, CONFIG.levels);
    if (!lut) return pp.canvas;
    const key = pp.key + JSON.stringify([levels.white, levels.black]);
    if (app.ppLevels && app.ppLevels.key === key) return app.ppLevels.canvas;
    const img = new ImageData(new Uint8ClampedArray(pp.data.data), pp.data.width, pp.data.height);
    E.applyLUT(img, lut);
    const reuse = app.ppLevels && app.ppLevels.canvas.width === img.width && app.ppLevels.canvas.height === img.height;
    const c = reuse ? app.ppLevels.canvas : makeCanvas(img.width, img.height);
    ctx2d(c).putImageData(img, 0, 0);
    app.ppLevels = { key, canvas: c };
    return c;
  }

  function drawLevelsOverlay(ctx, v) {
    const g = app.geo, d = draftLevels();
    if (d && !app.compare) for (const [k, label] of [['whiteAt', 'W'], ['blackAt', 'B']]) {
      if (!d[k]) continue;
      const s = CF.toScreen(v, M3.apply(g.SR, d[k][0], d[k][1]));
      ctx.lineWidth = 2; ctx.strokeStyle = '#000'; ctx.beginPath(); ctx.arc(s[0], s[1], 9, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = '#fff'; ctx.beginPath(); ctx.arc(s[0], s[1], 7, 0, Math.PI * 2); ctx.stroke();
      ctx.font = 'bold 12px system-ui, sans-serif'; ctx.textAlign = 'left'; ctx.fillStyle = '#fff'; ctx.fillText(label, s[0] + 11, s[1] - 9);
    }
    if (app.compare) {
      ctx.font = '600 13px system-ui, sans-serif'; ctx.textAlign = 'left';
      const t = 'Before levels', w = ctx.measureText(t).width + 20;
      ctx.fillStyle = 'rgba(0,0,0,.7)'; ctx.fillRect(12, 12, w, 28); ctx.fillStyle = '#fff'; ctx.fillText(t, 22, 31);
    }
    const gs = app.gesture;
    if (gs && gs.type === 'dropper') drawScreenLoupe(ctx, gs);
  }
  // Dropper loupe: magnifies what's on screen (so it shows the current levels) with the sample circle.
  function drawScreenLoupe(ctx, g) {
    const R = CF.loupeRadius(), Z = CONFIG.loupeZoom, d = app.dpr, p = g.last, [lx, ly] = CF.loupeCenter(g, R), src = R / Z;
    ctx.save();
    CF.setScreen(ctx); ctx.beginPath(); ctx.arc(lx, ly, R, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = '#000'; ctx.fillRect(lx - R, ly - R, 2 * R, 2 * R);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(els.canvas, (p[0] - src) * d, (p[1] - src) * d, 2 * src * d, 2 * src * d, lx - R, ly - R, 2 * R, 2 * R);
    ctx.lineWidth = 1.5; ctx.strokeStyle = '#000'; ctx.beginPath(); ctx.arc(lx, ly, CONFIG.levels.sampleRadiusPx * Z + 1.5, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = '#fff'; ctx.beginPath(); ctx.arc(lx, ly, CONFIG.levels.sampleRadiusPx * Z, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
    CF.setScreen(ctx); ctx.lineWidth = 3; ctx.strokeStyle = '#fff'; ctx.beginPath(); ctx.arc(lx, ly, R, 0, Math.PI * 2); ctx.stroke();
  }

  Object.assign(CF, { draftLevels, levelsShown, setDraft, applyLevels, discardLevels, autoLevelsDraft, pickAt, setCompare, previewCanvas, drawLevelsOverlay });
})(window.CF);
