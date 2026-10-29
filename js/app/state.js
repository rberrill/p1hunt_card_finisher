/* =====================================================================
   js/app/state.js — Edit-state defaults, undo/redo history, crop orientation, stateChanged, opening photos (incl. resume), detection.
   Shell modules share one namespace, CF (created in core.js). Names from core are
   destructured below; anything from another module is called as CF.name.
   tests/selftest.js checks these boundaries.
   ===================================================================== */
(function (CF) {
  'use strict';
  const { E, els, clone, nextFrame, app, geoCfg, toast, hideToast } = CF;

  /* ---------- state helpers ---------- */
  function cardAspect(orientation) { return { ratio: CONFIG.card.w / CONFIG.card.h, orientation: orientation || 'auto' }; }
  function presetRatio(id) { const p = CONFIG.crop.presets.find(x => x.id === id); return p ? p.ratio : null; }
  function insetCorners(W, H) {
    const f = CONFIG.defaultInsetPct / 100;
    return [[W * f, H * f], [W * (1 - f), H * f], [W * (1 - f), H * (1 - f)], [W * f, H * (1 - f)]];
  }
  function exportDefaults(prefs) {
    const x = CONFIG.export, p = (prefs && prefs.export) || {};
    return { format: p.format || x.format, quality: p.quality != null ? p.quality : x.quality,
      longEdge: p.longEdge != null ? p.longEdge : x.longEdge, interp: p.interp || x.interp, fill: p.fill || x.fill };
  }
  function cropDefaults(prefs) {
    const id = (prefs && prefs.cropPreset) || CONFIG.crop.defaultPreset;
    return { mode: 'fit', preset: id, ratio: presetRatio(id), swapped: false, orient: null, rect: null };
  }
  // Remembered prefs come from storage, so they're checked like an edits file.
  function newState(img) {
    const prefs = CF.Prefs.load();
    return cleanState(defaultState(img, prefs), img).state;
  }
  // Rebuilds untrusted state (edits file, stored session, prefs) on top of this photo's defaults.
  function cleanState(input, img) {
    return E.sanitizeState(input, defaultState(img, {}), { presetIds: CONFIG.crop.presets.map(p => p.id), maxPx: CONFIG.maxOutputPx });
  }
  function defaultState(img, prefs) {
    return {
      version: 2,
      source: { name: img.name, width: img.width, height: img.height },
      corners: insetCorners(img.width, img.height),
      strength: CONFIG.perspective.strength / 100,
      aspect: cardAspect(),
      squareUpHeight: CONFIG.squareUpHeight,
      rotation: { quarter: 0, fine: 0, fillFrame: false },
      flip: { h: false, v: false },
      crop: cropDefaults(prefs),
      levels: null,
      overlay: null,               // logo / watermark placement (Overlay step); the image itself lives outside the state
      export: exportDefaults(prefs),
    };
  }

  /* ---------- history: undo/redo store snapshots of the edit state ---------- */
  const History = {
    undo: [], redo: [], lastKey: null, lastTime: 0,
    reset() { this.undo = []; this.redo = []; this.lastKey = null; },
    push(snapshot, key) {
      const t = performance.now();
      // Coalesce rapid repeats of the same control (slider drags, key nudges) into one step.
      if (key && key === this.lastKey && t - this.lastTime < 900) { this.lastTime = t; this.redo = []; return; }
      this.undo.push(snapshot);
      if (this.undo.length > CONFIG.historyLimit) this.undo.shift();
      this.redo = []; this.lastKey = key || null; this.lastTime = t;
    },
  };
  function commit(mutator, key) {
    if (!app.state) return;
    const before = clone(app.state);
    mutator(app.state);
    if (JSON.stringify(before) === JSON.stringify(app.state)) return;
    History.push(before, key);
    stateChanged();
  }
  // For gestures: mutate live, then record the pre-gesture snapshot once at the end.
  function commitFrom(before, key) {
    if (JSON.stringify(before) === JSON.stringify(app.state)) return;
    History.push(before, key);
    stateChanged();
  }
  function undo() { if (!History.undo.length) return; History.redo.push(clone(app.state)); app.state = History.undo.pop(); History.lastKey = null; stateChanged(); }
  function redo() { if (!History.redo.length) return; History.undo.push(clone(app.state)); app.state = History.redo.pop(); History.lastKey = null; stateChanged(); }

  // Crop orientation follows the card as it ends up after Perspective and Rotate, unless Swap
  // chose one (crop.orient). The card's position doesn't depend on the crop, so aligning after
  // computing geometry is safe; geometry is recomputed only if the crop changed.
  const cropBase = s => s.crop.ratio === 'original' ? s.source.width / s.source.height : s.crop.ratio;
  function cardOrient(g) { if (!g || !g.ok) return null; const b = E.Quad.bbox(g.cardR); return b.w > b.h ? 'landscape' : 'portrait'; }
  function cropOrient(s, g) {
    const r = cropBase(s);
    return s.crop.orient || cardOrient(g) || (r && (s.crop.swapped ? 1 / r : r) < 1 ? 'portrait' : 'landscape');
  }
  function alignCrop(s, g) {
    const r = cropBase(s);
    if (!r || r === 1) { const was = !!s.crop.swapped; s.crop.swapped = false; return was; }
    const want = s.crop.orient || cardOrient(g);
    if (!want) return false;
    const sw = (r > 1) !== (want === 'landscape');
    if (sw === !!s.crop.swapped) return false;
    s.crop.swapped = sw;
    if (s.crop.mode === 'manual' && s.crop.rect) { const q = s.crop.rect; s.crop.rect = { cx: q.cx, cy: q.cy, w: q.h, h: q.w }; }
    return true;
  }
  // Preset label for the orientation in use: 5:4 ↔ 4:5, 16:9 ↔ 9:16, "5:7 card" ↔ "7:5 card".
  function cropLabel(p, orient) {
    const m = /^(\d+):(\d+)/.exec(p.id);
    if (!m || m[1] === m[2]) return p.label;
    const a = Math.max(+m[1], +m[2]), b = Math.min(+m[1], +m[2]);
    return (orient === 'portrait' ? `${b}:${a}` : `${a}:${b}`) + p.label.slice(p.id.length);
  }

  function stateChanged() {
    app.geo = app.state ? E.computeGeometry(app.state, geoCfg()) : null;
    if (app.state && alignCrop(app.state, app.geo)) app.geo = E.computeGeometry(app.state, geoCfg());
    if (app.views.result && app.views.result.auto) app.views.result = null; // refit lazily
    app.views.export = null;
    app.pendingSave = null; // an export waiting for a second tap no longer matches the edits
    CF.Prefs.save(); CF.Session.saveSoon(); CF.overlayStateChanged();
    CF.syncUI();
    CF.requestRender();
    CF.requestMini();
  }
  // Light-weight update during drags: geometry only, no prefs or panel rebuild.
  function liveChanged() { app.geo = E.computeGeometry(app.state, geoCfg()); CF.syncReadouts(); CF.requestRender(); CF.requestMini(); }

  /* ---------- loading ---------- */
  // restore: a saved session record ({ state, draft, tab }) to reapply instead of starting fresh.
  async function openFile(file, name, restore) {
    const t0 = performance.now(), id = ++app.loadId;
    toast('Loading…');
    let img;
    try { img = await CF.ImageSource.load(file, name); }
    catch (e) { toast(e.message, 'err', 6000); return; }
    if (id !== app.loadId) { img.close(); return; } // another photo was opened meanwhile
    if (app.img) app.img.close();
    app.img = img;
    app.preview = CF.scaledCopy(img.el, img.width, img.height, CONFIG.previewMaxPx);
    const tk = Math.min(1, CONFIG.thumbMaxPx / Math.max(img.width, img.height));
    app.thumb = CF.scaledCopy(app.preview.canvas, app.preview.canvas.width, app.preview.canvas.height, Math.max(img.width, img.height) * tk);
    app.thumb.k = app.thumb.data.width / img.width;
    const wk = Math.min(1, CONFIG.detect.workingSize / Math.max(img.width, img.height));
    app.work = CF.scaledCopy(app.preview.canvas, app.preview.canvas.width, app.preview.canvas.height, Math.max(img.width, img.height) * wk);
    app.work.k = app.work.data.width / img.width;
    app.state = newState(img);
    const resumed = !!(restore && restore.state && restore.width === img.width && restore.height === img.height);
    if (resumed) { app.state = cleanState(restore.state, img).state; app.state.source.name = img.name; }
    History.reset();
    app.views = { source: null, result: null, export: null };
    app.detection = { candidates: [], index: 0, seed: null, last: null, running: 0, msg: '', snapPts: [], snapLines: [] };
    app.pPreview = null; app.edgeCanvas = null; app.selected = 0;
    app.levelsPending = false; app.levelsDraft = null; app.ppLevels = null; app.dropper = null; app.compare = false; app.previewMode = false;
    const draft = resumed && restore.draft ? cleanState({ levels: restore.draft }, img) : null;
    if (draft && !draft.invalid.length && draft.state.levels) { app.levelsDraft = draft.state.levels; app.levelsPending = JSON.stringify(restore.draft) !== JSON.stringify(app.state.levels || null); }
    els.empty.hidden = true;
    if (resumed) CF.Session.photoId = id; // the photo is already stored
    else CF.Session.savePhoto(file, id);
    stateChanged();
    CF.setTab(resumed && CF.STEPS[restore.tab] ? restore.tab : 'perspective');
    await nextFrame();
    const ms = performance.now() - t0;
    console.info(`[card-finisher] ${img.name}: ${img.width}×${img.height} loaded + previewed in ${ms.toFixed(0)} ms`);
    app.loadMs = ms;
    hideToast();
    if (resumed) { toast('Resumed where you left off.'); CF.ensureOverlayImage(); }
    runDetect({ auto: true, keepCorners: resumed });
  }

  /* ---------- detection ---------- */
  // keepCorners: find candidates (for Candidate n/3 and snapping) without moving the corners (session resume).
  async function runDetect({ auto = false, keepCorners = false } = {}) {
    if (!app.img) return;
    const run = ++app.detection.running, t0 = performance.now();
    app.detection.msg = 'Detecting…'; CF.syncUI();
    try {
      const cands = await CF.Detector.detect(app.work.data, {
        ratio: CONFIG.card.w / CONFIG.card.h, seed: app.detection.seed,
        sourceWidth: app.img.width, sourceHeight: app.img.height, getRegion: CF.readRegion, debug: app.debugOverlay || CONFIG.debug,
      });
      if (run !== app.detection.running) return;
      const last = CF.JSDetector.last;
      app.detection.candidates = cands; app.detection.index = 0; app.detection.last = last;
      app.detection.ms = performance.now() - t0;
      buildSnapTargets(last); app.edgeCanvas = null;
      if (cands.length) {
        if (keepCorners) { /* leave the resumed corners alone */ }
        else if (auto) { app.state.corners = cands[0].corners.map(p => p.slice()); stateChanged(); }
        else commit(s => { s.corners = cands[0].corners.map(p => p.slice()); });
      } else if (!auto) toast('No card-shaped edges found. Place the corners by hand, or tap to seed and retry.', 'warn', 5000);
      app.detection.msg = '';
      if (CONFIG.debug) console.info('[card-finisher] detect', last && last.timing, cands);
    } catch (e) {
      console.error(e); app.detection.msg = '';
      toast('Detection failed: ' + e.message, 'err');
    }
    CF.syncUI(); CF.requestRender(); CF.updateDebugPanel();
  }
  function useCandidate(i) {
    const c = app.detection.candidates[i]; if (!c) return;
    app.detection.index = i;
    commit(s => { s.corners = c.corners.map(p => p.slice()); });
  }
  function buildSnapTargets(last) {
    app.detection.snapLines = []; app.detection.snapPts = [];
    if (!last || !last.lines) return;
    // Lines come back in working px: n·p = c  →  in source px: n·p = c / ks.
    const L = last.lines.map(l => ({ nx: l.nx, ny: l.ny, c: l.c / last.ks }));
    app.detection.snapLines = L;
    const W = app.img.width, H = app.img.height;
    for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) {
      const dot = Math.abs(L[i].nx * L[j].nx + L[i].ny * L[j].ny);
      if (dot > 0.5) continue; // only near-perpendicular pairs make corners
      const p = E.intersect(L[i], L[j]);
      if (p && p[0] > -W * 0.02 && p[1] > -H * 0.02 && p[0] < W * 1.02 && p[1] < H * 1.02) app.detection.snapPts.push(p);
    }
  }

  Object.assign(CF, { cardAspect, presetRatio, insetCorners, cropDefaults, cleanState, History, commit, commitFrom, undo, redo, cardOrient, cropOrient, alignCrop, cropLabel, stateChanged, liveChanged, openFile, runDetect, useCandidate });
})(window.CF);
