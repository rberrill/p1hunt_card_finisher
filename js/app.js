/* =====================================================================
   SHELL — image I/O adapters, detection adapters, UI/state, export.
   Talks to the engine only through CardEngine and the adapters
   (ImageSource, Detector, Exporter, Session) so phase two can swap in native ones.
   ===================================================================== */
(function () {
  'use strict';
  const E = CardEngine, M3 = E.M3, Quad = E.Quad;

  /* ---------------- CONFIG overrides from the URL ---------------- */
  const params = new URLSearchParams(location.search);
  for (const [k, v] of params) {
    if (k === 'debug') { CONFIG.debug = v !== '0' && v !== 'false'; continue; }
    if (k === 'selftest') continue;
    const path = k.split('.'); let o = CONFIG;
    for (let i = 0; i < path.length - 1 && o; i++) o = typeof o[path[i]] === 'object' ? o[path[i]] : null;
    const last = path[path.length - 1];
    if (!o || !(last in o)) { console.warn('[card-finisher] Unknown CONFIG key in URL:', k); continue; }
    const cur = o[last];
    o[last] = typeof cur === 'number' ? Number(v) : typeof cur === 'boolean' ? (v === '1' || v === 'true') : v;
  }
  for (const [k, v] of Object.entries(CONFIG.theme)) document.documentElement.style.setProperty('--' + k, v);

  const $ = id => document.getElementById(id);
  const els = {
    stage: $('stage'), canvas: $('view'), empty: $('empty'), toast: $('toast'), panel: $('panel'), mini: $('mini'),
    fileInput: $('fileInput'), editsInput: $('editsInput'), debugPanel: $('debugPanel'), root: $('app'),
  };
  const clone = o => JSON.parse(JSON.stringify(o));
  const nextFrame = () => new Promise(r => requestAnimationFrame(() => r()));
  const makeCanvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const ctx2d = (c, read) => c.getContext('2d', read ? { willReadFrequently: true } : undefined);

  /* =====================================================================
     IMAGE I/O (shell adapters) — ImageSource: file picker, drag-drop, paste.
     Phase two adds camera + photo library behind the same load(blob) call.
     ===================================================================== */
  const ImageSource = {
    isHeic: f => /image\/hei[cf]/i.test(f.type || '') || /\.hei[cf]$/i.test(f.name || ''),
    async load(blob, name) {
      name = name || blob.name || 'photo';
      let bitmap = null;
      if (typeof createImageBitmap === 'function') {
        try { bitmap = await createImageBitmap(blob, { imageOrientation: 'from-image' }); } catch (e) { bitmap = null; }
      }
      if (bitmap) return { el: bitmap, width: bitmap.width, height: bitmap.height, name, close() { try { bitmap.close(); } catch (e) {} } };
      // Fallback: <img> honors EXIF orientation by default (CSS image-orientation: from-image).
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.src = url;
      try { await img.decode(); } catch (e) {
        URL.revokeObjectURL(url);
        if (ImageSource.isHeic(blob)) throw new Error('This browser can’t open HEIC. Save the photo as JPEG first (Safari opens HEIC directly).');
        throw new Error('Couldn’t read that file as an image.');
      }
      return { el: img, width: img.naturalWidth, height: img.naturalHeight, name, close() { URL.revokeObjectURL(url); img.src = ''; } };
    },
    bindPicker(input, onFile) { input.addEventListener('change', () => { if (input.files[0]) onFile(input.files[0]); input.value = ''; }); },
    bindDrop(el, onFile) {
      el.addEventListener('dragover', e => { e.preventDefault(); el.classList.add('dragover'); });
      el.addEventListener('dragleave', () => el.classList.remove('dragover'));
      el.addEventListener('drop', e => {
        e.preventDefault(); el.classList.remove('dragover');
        const f = [...(e.dataTransfer.files || [])].find(f => f.type.startsWith('image/') || ImageSource.isHeic(f));
        if (f) onFile(f);
      });
    },
    bindPaste(onFile) {
      document.addEventListener('paste', e => {
        const item = [...(e.clipboardData ? e.clipboardData.items : [])].find(i => i.type.startsWith('image/'));
        if (item) { e.preventDefault(); onFile(item.getAsFile(), 'pasted-photo'); }
      });
    },
  };

  // Downscale with repeated halving (each step ≤ 2×) so large reductions don't alias.
  function scaledCopy(src, sw, sh, maxPx) {
    const k = Math.min(1, maxPx / Math.max(sw, sh));
    const tw = Math.max(1, Math.round(sw * k)), th = Math.max(1, Math.round(sh * k));
    let cur = src, cw = sw, ch = sh;
    while (cw / 2 > tw) {
      const nw = Math.max(tw, Math.round(cw / 2)), nh = Math.max(th, Math.round(ch / 2));
      const c = makeCanvas(nw, nh), x = ctx2d(c);
      x.imageSmoothingQuality = 'high'; x.drawImage(cur, 0, 0, cw, ch, 0, 0, nw, nh);
      if (cur !== src) cur.width = 0;
      cur = c; cw = nw; ch = nh;
    }
    const out = makeCanvas(tw, th), x = ctx2d(out, true);
    x.imageSmoothingQuality = 'high'; x.drawImage(cur, 0, 0, cw, ch, 0, 0, tw, th);
    if (cur !== src) cur.width = 0;
    return { canvas: out, data: x.getImageData(0, 0, tw, th), k: tw / sw };
  }

  // Full-resolution region read (for refinement), capped at maxPx pixels.
  function readRegion(box, maxPx) {
    const img = app.img, W = img.width, H = img.height;
    const x0 = Math.max(0, Math.floor(box.x0)), y0 = Math.max(0, Math.floor(box.y0));
    const x1 = Math.min(W, Math.ceil(box.x1)), y1 = Math.min(H, Math.ceil(box.y1));
    const w = x1 - x0, h = y1 - y0;
    if (w < 8 || h < 8) return null;
    const s = Math.min(1, Math.sqrt(maxPx / (w * h)));
    const rw = Math.max(1, Math.round(w * s)), rh = Math.max(1, Math.round(h * s));
    const c = makeCanvas(rw, rh), x = ctx2d(c, true);
    x.imageSmoothingQuality = 'high'; x.drawImage(img.el, x0, y0, w, h, 0, 0, rw, rh);
    const d = x.getImageData(0, 0, rw, rh);
    c.width = 0;
    return { data: d.data, width: rw, height: rh, ox: x0, oy: y0, scale: rw / w };
  }

  /* =====================================================================
     DETECTION adapters — Detector.detect(imageData, options) → [{corners, confidence}]
     corners are in source pixels. Phase two: Apple Vision / ML Kit return the same shape.
     ===================================================================== */
  const WORKER_GLUE = `
;self.onmessage = function (e) {
  var m = e.data, r;
  try {
    if (m.type === 'detect') r = CardEngine.detect(m.payload.image, m.payload.opts);
    else if (m.type === 'refine') r = CardEngine.refineQuad(m.payload.roi, m.payload.corners, m.payload.opts);
    else if (m.type === 'selftest') r = CardEngine.selfTest();
    else throw new Error('Unknown message ' + m.type);
    self.postMessage({ id: m.id, result: r });
  } catch (err) { self.postMessage({ id: m.id, error: String(err && err.stack || err) }); }
};`;
  const EngineWorker = {
    worker: null, failed: false, seq: 0, pending: new Map(),
    init() {
      try {
        const src = '(' + CardEngineModule.toString() + ')(self);' + WORKER_GLUE;
        this.worker = new Worker(URL.createObjectURL(new Blob([src], { type: 'text/javascript' })));
        this.worker.onmessage = e => {
          const p = this.pending.get(e.data.id); if (!p) return;
          this.pending.delete(e.data.id);
          e.data.error ? p.reject(new Error(e.data.error)) : p.resolve(e.data.result);
        };
        this.worker.onerror = e => { e.preventDefault && e.preventDefault(); this.fail('worker error'); };
      } catch (e) { this.fail(e.message); }
    },
    fail(why) {
      if (!this.failed) console.warn('[card-finisher] Web Worker unavailable, running on main thread:', why);
      this.failed = true;
      for (const p of this.pending.values()) p.reject(new Error('worker failed'));
      this.pending.clear();
    },
    local(type, p) {
      if (type === 'detect') return E.detect(p.image, p.opts);
      if (type === 'refine') return E.refineQuad(p.roi, p.corners, p.opts);
      if (type === 'selftest') return E.selfTest();
    },
    call(type, payload) {
      if (!this.worker || this.failed) return new Promise(r => setTimeout(() => r(this.local(type, payload)), 0));
      const id = ++this.seq;
      return new Promise((resolve, reject) => {
        this.pending.set(id, { resolve, reject });
        this.worker.postMessage({ id, type, payload });
      }).catch(err => {
        if (this.failed) return this.local(type, payload);
        throw err;
      });
    },
  };

  function detectParams() {
    const p = {};
    for (const [k, v] of Object.entries(CONFIG.detect)) if (typeof v === 'number' || typeof v === 'boolean') p[k] = v;
    return p;
  }

  const JSDetector = {
    name: 'js', last: null,
    async detect(imageData, options) {
      const ks = imageData.width / options.sourceWidth; // working px per source px
      const res = await EngineWorker.call('detect', {
        image: imageData,
        opts: { ratio: options.ratio, seed: options.seed ? [options.seed[0] * ks, options.seed[1] * ks] : null,
          params: detectParams(), debug: !!options.debug, quads: options.quads },
      });
      const searchPx = CONFIG.detect.refineSearchWorkingPx / ks;
      const out = [];
      for (const c of res.candidates) {
        let corners = c.corners.map(p => [p[0] / ks, p[1] / ks]), refined = null;
        if (options.getRegion && CONFIG.detect.refine) {
          const bb = Quad.bbox(corners), m = searchPx * 3;
          const roi = options.getRegion({ x0: bb.x0 - m, y0: bb.y0 - m, x1: bb.x1 + m, y1: bb.y1 + m }, CONFIG.detect.refineMaxPx);
          if (roi) {
            const r = await EngineWorker.call('refine', { roi, corners, opts: { params: detectParams(), searchPx } });
            corners = r.corners; refined = r.refined;
          }
        }
        out.push({ corners, confidence: c.confidence, score: c.score, parts: c.parts, refined });
      }
      JSDetector.last = { ks, lines: res.lines, debug: res.debug || null, timing: res.timing };
      return out;
    },
  };

  // Opt-in (CONFIG.detect.opencv.enabled): OpenCV.js proposes extra quads from contours; the JS
  // engine scores them next to its own Hough quads with the same evidence, then refines.
  const OpenCVDetector = {
    name: 'opencv', ready: null,
    load() {
      if (this.ready) return this.ready;
      this.ready = new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = CONFIG.detect.opencv.url; s.async = true;
        s.onload = () => {
          // The Emscripten module defines Module.then, so it is "thenable": resolving a Promise
          // with it (or awaiting it) re-resolves forever and freezes the page. Wait via its own
          // then(), and remove that method before handing the module to a real Promise.
          const done = m => { try { delete m.then; } catch (e) { m.then = undefined; } window.cv = m; resolve(m); };
          const cv = window.cv;
          if (!cv) reject(new Error('OpenCV.js loaded but did not define cv'));
          else if (cv.Mat) done(cv);
          else if (typeof cv.then === 'function') cv.then(done);
          else cv.onRuntimeInitialized = () => done(cv);
        };
        s.onerror = () => reject(new Error('OpenCV.js failed to load (offline?)'));
        document.head.appendChild(s);
      });
      this.ready.catch(() => { this.ready = null; });
      return this.ready;
    },
    async detect(imageData, options) {
      const cv = await this.load(), oc = CONFIG.detect.opencv;
      const src = cv.matFromImageData(imageData), gray = new cv.Mat(), edges = new cv.Mat();
      const contours = new cv.MatVector(), hier = new cv.Mat(), kernel = cv.Mat.ones(3, 3, cv.CV_8U);
      const quads = [];
      try {
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
        cv.GaussianBlur(gray, gray, new cv.Size(5, 5), 0);
        cv.Canny(gray, edges, oc.cannyLow, oc.cannyHigh);
        cv.dilate(edges, edges, kernel);
        cv.findContours(edges, contours, hier, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);
        const minA = CONFIG.detect.minAreaFrac * imageData.width * imageData.height;
        for (let i = 0; i < contours.size(); i++) {
          const c = contours.get(i), approx = new cv.Mat();
          cv.approxPolyDP(c, approx, oc.approxEps * cv.arcLength(c, true), true);
          if (approx.rows === 4 && cv.isContourConvex(approx) && Math.abs(cv.contourArea(approx)) > minA) {
            const d = approx.data32S; quads.push([[d[0], d[1]], [d[2], d[3]], [d[4], d[5]], [d[6], d[7]]]);
          }
          approx.delete(); c.delete();
        }
      } finally { [src, gray, edges, contours, hier, kernel].forEach(m => m.delete()); }
      if (!quads.length) throw new Error('OpenCV found no quadrilaterals');
      return JSDetector.detect(imageData, Object.assign({}, options, { quads }));
    },
  };

  const Detector = {
    async detect(imageData, options) {
      if (CONFIG.detect.opencv.enabled) {
        try { return await OpenCVDetector.detect(imageData, options); }
        catch (e) { toast('OpenCV detector unavailable — using the built-in detector. ' + e.message, 'warn'); }
      }
      return JSDetector.detect(imageData, options);
    },
  };

  /* =====================================================================
     UI / STATE
     ===================================================================== */
  const app = {
    img: null, preview: null, thumb: null, work: null,
    state: null, geo: null, pPreview: null,
    tab: 'perspective', selected: 0,
    views: { source: null, result: null, export: null },
    detection: { candidates: [], index: 0, seed: null, last: null, running: 0, msg: '', snapPts: [], snapLines: [] },
    seedMode: false, snap: false, debugOverlay: !!CONFIG.debug, showGrid: true,
    dropper: null, compare: false, levelsPending: false, levelsDraft: null, ppLevels: null,
    gesture: null, dpr: 1, cssW: 0, cssH: 0, edgeCanvas: null,
    loadId: 0, pendingSave: null,
  };
  const geoCfg = () => ({
    maxOutputPx: CONFIG.maxOutputPx, maxOutputArea: CONFIG.maxOutputArea, maxBoundsFactor: CONFIG.maxBoundsFactor,
    minCornerDistPx: CONFIG.minCornerDistPx, fitPaddingPct: CONFIG.crop.fitPaddingPct, allowUpscale: CONFIG.export.allowUpscale,
    focalFactor: CONFIG.detect.focalFactor,
  });

  /* ---------- preferences (localStorage, best-effort) ---------- */
  const Prefs = {
    load() { try { return JSON.parse(localStorage.getItem(CONFIG.storageKey)) || {}; } catch (e) { return {}; } },
    save() {
      if (!app.state) return;
      const s = app.state;
      try {
        localStorage.setItem(CONFIG.storageKey, JSON.stringify({
          cropPreset: s.crop.preset,
          export: { format: s.export.format, quality: s.export.quality, longEdge: s.export.longEdge, interp: s.export.interp, fill: s.export.fill },
        }));
      } catch (e) { /* private mode / quota: ignore */ }
    },
  };

  /* ---------- session restore (IndexedDB, best-effort) ----------
     Two records: 'photo' (the original file's bytes, written once per photo) and 'edits'
     (the edit state, Levels draft and step, rewritten shortly after every change). */
  const Session = {
    db: null, timer: 0, photoId: 0,
    get enabled() { return CONFIG.session.enabled && typeof indexedDB !== 'undefined'; },
    open() {
      if (!this.db) this.db = new Promise((res, rej) => {
        const r = indexedDB.open(CONFIG.session.dbName, 1);
        r.onupgradeneeded = () => r.result.createObjectStore('session');
        r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
      });
      return this.db;
    },
    async tx(mode, fn) {
      const db = await this.open();
      return new Promise((res, rej) => {
        const t = db.transaction('session', mode), req = fn(t.objectStore('session'));
        t.oncomplete = () => res(req && req.result); t.onerror = t.onabort = () => rej(t.error);
      });
    },
    snapshot() {
      const s = app.state;
      return { name: app.img.name, width: app.img.width, height: app.img.height, state: clone(s),
        draft: app.levelsPending ? clone(app.levelsDraft) : null, tab: app.tab, savedAt: Date.now() };
    },
    // Called once per newly opened photo; id guards against a slow read finishing after another photo opened.
    async savePhoto(file, id) {
      if (!this.enabled) return;
      try {
        const buf = await file.arrayBuffer();
        if (id !== app.loadId || !app.img) return;
        await this.tx('readwrite', st => { st.put({ buf, type: file.type, name: app.img.name }, 'photo'); return st.put(this.snapshot(), 'edits'); });
        this.photoId = id;
      } catch (e) { console.warn('[card-finisher] session photo not saved:', e); }
    },
    saveSoon() {
      if (!this.enabled || !app.img || this.photoId !== app.loadId) return;
      clearTimeout(this.timer); this.timer = setTimeout(() => this.flush(), CONFIG.session.saveDelayMs);
    },
    flush() {
      clearTimeout(this.timer);
      if (!this.enabled || !app.img || !app.state || this.photoId !== app.loadId) return;
      this.tx('readwrite', st => st.put(this.snapshot(), 'edits')).catch(e => console.warn('[card-finisher] session edits not saved:', e));
    },
    async peek() {
      if (!this.enabled) return null;
      try {
        const [edits, n] = await Promise.all([this.tx('readonly', st => st.get('edits')), this.tx('readonly', st => st.count('photo'))]);
        return edits && n ? edits : null;
      } catch (e) { return null; }
    },
    loadPhoto() { return this.tx('readonly', st => st.get('photo')); },
    clear() { this.photoId = 0; return this.enabled ? this.tx('readwrite', st => st.clear()).catch(() => {}) : Promise.resolve(); },
  };

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
  function newState(img) {
    const prefs = Prefs.load();
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
    Prefs.save(); Session.saveSoon();
    syncUI();
    requestRender();
    requestMini();
  }
  // Light-weight update during drags: geometry only, no prefs or panel rebuild.
  function liveChanged() { app.geo = E.computeGeometry(app.state, geoCfg()); syncReadouts(); requestRender(); requestMini(); }

  /* ---------- loading ---------- */
  // restore: a saved session record ({ state, draft, tab }) to reapply instead of starting fresh.
  async function openFile(file, name, restore) {
    const t0 = performance.now(), id = ++app.loadId;
    toast('Loading…');
    let img;
    try { img = await ImageSource.load(file, name); }
    catch (e) { toast(e.message, 'err', 6000); return; }
    if (id !== app.loadId) { img.close(); return; } // another photo was opened meanwhile
    if (app.img) app.img.close();
    app.img = img;
    app.preview = scaledCopy(img.el, img.width, img.height, CONFIG.previewMaxPx);
    const tk = Math.min(1, CONFIG.thumbMaxPx / Math.max(img.width, img.height));
    app.thumb = scaledCopy(app.preview.canvas, app.preview.canvas.width, app.preview.canvas.height, Math.max(img.width, img.height) * tk);
    app.thumb.k = app.thumb.data.width / img.width;
    const wk = Math.min(1, CONFIG.detect.workingSize / Math.max(img.width, img.height));
    app.work = scaledCopy(app.preview.canvas, app.preview.canvas.width, app.preview.canvas.height, Math.max(img.width, img.height) * wk);
    app.work.k = app.work.data.width / img.width;
    app.state = newState(img);
    const resumed = !!(restore && restore.state && restore.width === img.width && restore.height === img.height);
    if (resumed) { app.state = restore.state; app.state.source.name = img.name; }
    History.reset();
    app.views = { source: null, result: null, export: null };
    app.detection = { candidates: [], index: 0, seed: null, last: null, running: 0, msg: '', snapPts: [], snapLines: [] };
    app.pPreview = null; app.edgeCanvas = null; app.selected = 0;
    app.levelsPending = false; app.levelsDraft = null; app.ppLevels = null; app.dropper = null; app.compare = false; app.previewMode = false;
    if (resumed && restore.draft) { app.levelsDraft = restore.draft; app.levelsPending = JSON.stringify(restore.draft) !== JSON.stringify(app.state.levels || null); }
    els.empty.hidden = true;
    if (resumed) Session.photoId = id; // the photo is already stored
    else Session.savePhoto(file, id);
    stateChanged();
    setTab(resumed && STEPS[restore.tab] ? restore.tab : 'perspective');
    await nextFrame();
    const ms = performance.now() - t0;
    console.info(`[card-finisher] ${img.name}: ${img.width}×${img.height} loaded + previewed in ${ms.toFixed(0)} ms`);
    app.loadMs = ms;
    hideToast();
    if (resumed) toast('Resumed where you left off.');
    runDetect({ auto: true, keepCorners: resumed });
  }

  /* ---------- detection ---------- */
  // keepCorners: find candidates (for Candidate n/3 and snapping) without moving the corners (session resume).
  async function runDetect({ auto = false, keepCorners = false } = {}) {
    if (!app.img) return;
    const run = ++app.detection.running, t0 = performance.now();
    app.detection.msg = 'Detecting…'; syncUI();
    try {
      const cands = await Detector.detect(app.work.data, {
        ratio: CONFIG.card.w / CONFIG.card.h, seed: app.detection.seed,
        sourceWidth: app.img.width, sourceHeight: app.img.height, getRegion: readRegion, debug: app.debugOverlay || CONFIG.debug,
      });
      if (run !== app.detection.running) return;
      const last = JSDetector.last;
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
    syncUI(); requestRender(); updateDebugPanel();
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
    if (app.tab === 'export' || app.tab === 'levels') {
      if (!app.views.export) { const w = exportWorld(), v = fitView(w.w, w.h); v.x -= w.x * v.z; v.y -= w.y * v.z; app.views.export = v; }
      return app.views.export;
    }
    if (!app.views.result) app.views.result = fitView(app.geo.R.w, app.geo.R.h, app.tab === 'crop' ? 36 : 24);
    return app.views.result;
  }
  function viewKey() { return app.tab === 'perspective' && !app.previewMode ? 'source' : app.tab === 'export' || app.tab === 'levels' ? 'export' : 'result'; }
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
    const framed = app.tab === 'export' || app.tab === 'levels';
    if (framed) ctx.fillRect(c.x, c.y, c.w, c.h); else ctx.fillRect(0, 0, g.R.w, g.R.h);
    ctx.save();
    if (framed) { ctx.beginPath(); ctx.rect(c.x, c.y, c.w, c.h); ctx.clip(); }
    const m = g.MR; ctx.transform(m[0], m[3], m[1], m[4], m[2], m[5]); ctx.scale(1 / pp.q, 1 / pp.q);
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(previewCanvas(levelsShown()), 0, 0);
    ctx.restore();
    setScreen(ctx);
    const a = toScreen(v, [c.x, c.y]), b = toScreen(v, [c.x + c.w, c.y + c.h]);
    if (app.tab === 'levels') drawLevelsOverlay(ctx, v);
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
      for (const h of cropHandles(v)) {
        ctx.fillStyle = '#fff'; ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.lineWidth = 1.5;
        const r = h.part.length === 2 ? 7 : 5;
        ctx.beginPath(); ctx.rect(h.p[0] - r, h.p[1] - r, 2 * r, 2 * r); ctx.fill(); ctx.stroke();
      }
    }
  }

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
    syncUI(); requestRender(); Session.saveSoon();
  }
  function applyLevels() {
    if (!app.levelsPending) return;
    const d = app.levelsDraft;
    app.levelsPending = false; app.levelsDraft = null;
    commit(s => { s.levels = d ? clone(d) : null; });
  }
  function discardLevels() { app.levelsPending = false; app.levelsDraft = null; syncUI(); requestRender(); Session.saveSoon(); }

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
    const which = app.dropper, v = currentView(), g = app.geo;
    app.dropper = null;
    if (!which || !v || !g || !g.ok) { syncUI(); return; }
    const SRi = M3.inv(g.SR), w = toWorld(v, screenPt);
    const p = M3.apply(SRi, w[0], w[1]), q = M3.apply(SRi, w[0] + CONFIG.levels.sampleRadiusPx / v.z, w[1]);
    if (!(p[0] >= 0 && p[1] >= 0 && p[0] < app.img.width && p[1] < app.img.height)) { toast('That spot is outside the photo.', 'warn'); syncUI(); return; }
    const r = Math.max(4, E.V.dist(p, q));
    const roi = readRegion({ x0: p[0] - r, y0: p[1] - r, x1: p[0] + r, y1: p[1] + r }, 1e6);
    const col = roi && E.meanColor(roi, CONFIG.levels.sampleTrim);
    if (!col) { syncUI(); return; }
    const d = draftLevels() || {};
    if (which === 'white' && d.black && luma(col) <= luma(d.black) + 20) { toast('That spot is darker than the black point. Pick something brighter.', 'warn'); syncUI(); return; }
    if (which === 'black' && luma(col) > CONFIG.levels.maxBlackLuma) { toast('That spot is too light to be a black point. Pick something dark, or skip the black point.', 'warn'); syncUI(); return; }
    if (which === 'black' && d.white && luma(col) >= luma(d.white) - 20) { toast('That spot is brighter than the white point. Pick something darker.', 'warn'); syncUI(); return; }
    setDraft(dd => { dd[which] = col; dd[which + 'At'] = [Math.round(p[0]), Math.round(p[1])]; });
  }
  function setCompare(on) { if (app.compare !== on) { app.compare = on; requestRender(); } }

  // The warped preview with a levels LUT applied, cached per (preview, levels).
  function previewCanvas(levels) {
    const pp = ensurePPreview();
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
      const s = toScreen(v, M3.apply(g.SR, d[k][0], d[k][1]));
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
    const R = loupeRadius(), Z = CONFIG.loupeZoom, d = app.dpr, p = g.last, [lx, ly] = loupeCenter(g, R), src = R / Z;
    ctx.save();
    setScreen(ctx); ctx.beginPath(); ctx.arc(lx, ly, R, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = '#000'; ctx.fillRect(lx - R, ly - R, 2 * R, 2 * R);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(els.canvas, (p[0] - src) * d, (p[1] - src) * d, 2 * src * d, 2 * src * d, lx - R, ly - R, 2 * R, 2 * R);
    ctx.lineWidth = 1.5; ctx.strokeStyle = '#000'; ctx.beginPath(); ctx.arc(lx, ly, CONFIG.levels.sampleRadiusPx * Z + 1.5, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = '#fff'; ctx.beginPath(); ctx.arc(lx, ly, CONFIG.levels.sampleRadiusPx * Z, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
    setScreen(ctx); ctx.lineWidth = 3; ctx.strokeStyle = '#fff'; ctx.beginPath(); ctx.arc(lx, ly, R, 0, Math.PI * 2); ctx.stroke();
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

  /* ---------- pointer input: handles, crop box, pan, pinch, wheel ---------- */
  const pointers = new Map();
  let lastTap = { t: 0, x: 0, y: 0 }, lastHandleTap = { t: 0, idx: -1 };
  function localPt(e) { const r = els.canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }

  function hitHandle(v, p) {
    const s = app.state, q = s.corners.map(c => toScreen(v, c)), R = CONFIG.handle.hitRadius;
    let best = -1, bd = R;
    q.forEach((c, k) => { const d = Math.hypot(c[0] - p[0], c[1] - p[1]); if (d < bd) { bd = d; best = k; } });
    if (best >= 0) return best;
    for (let k = 0; k < 4; k++) { const m = E.V.mid(q[k], q[(k + 1) % 4]), d = Math.hypot(m[0] - p[0], m[1] - p[1]); if (d < bd) { bd = d; best = 4 + k; } }
    return best;
  }
  function cropHandles(v) {
    const c = app.geo.crop, a = toScreen(v, [c.x, c.y]), b = toScreen(v, [c.x + c.w, c.y + c.h]), mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
    return [{ part: 'nw', p: a }, { part: 'ne', p: [b[0], a[1]] }, { part: 'se', p: b }, { part: 'sw', p: [a[0], b[1]] },
      { part: 'n', p: [mx, a[1]] }, { part: 'e', p: [b[0], my] }, { part: 's', p: [mx, b[1]] }, { part: 'w', p: [a[0], my] }];
  }
  function hitCrop(v, p) {
    let best = null, bd = CONFIG.handle.hitRadius;
    for (const h of cropHandles(v)) { const d = Math.hypot(h.p[0] - p[0], h.p[1] - p[1]); if (d < bd) { bd = d; best = h.part; } }
    if (best) return best;
    const c = app.geo.crop, w = toWorld(v, p);
    return w[0] > c.x && w[0] < c.x + c.w && w[1] > c.y && w[1] < c.y + c.h ? 'move' : null;
  }

  function onPointerDown(e) {
    if (!app.img) return;
    els.canvas.focus({ preventScroll: true });
    try { els.canvas.setPointerCapture(e.pointerId); } catch (err) { /* pointer already gone */ }
    const p = localPt(e);
    pointers.set(e.pointerId, p);
    const v = currentView(); if (!v) return;
    if (pointers.size === 2) {
      endGesture(); // a second finger turns any drag into a pinch
      const [a, b] = [...pointers.values()];
      app.gesture = { type: 'pinch', d0: Math.hypot(a[0] - b[0], a[1] - b[1]), m0: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], v0: { ...v } };
      return;
    }
    if (pointers.size > 2) return;
    const base = { start: p, last: p, t0: performance.now(), pointerType: e.pointerType, moved: false };
    if (app.tab === 'perspective' && !app.previewMode) {
      if (app.seedMode) { app.detection.seed = toWorld(v, p); app.seedMode = false; syncUI(); requestRender(); toast('Seed set. Press Detect.'); return; }
      const h = hitHandle(v, p);
      if (h >= 0) {
        app.selected = h;
        app.gesture = Object.assign(base, { type: 'handle', idx: h, w0: toWorld(v, p), c0: clone(app.state.corners), before: clone(app.state) });
        requestRender(); return;
      }
    }
    if (app.tab === 'crop' && app.geo && app.geo.ok) {
      const part = hitCrop(v, p);
      if (part) { app.gesture = Object.assign(base, { type: 'crop', part, w0: toWorld(v, p), r0: { ...app.geo.crop }, before: clone(app.state), shift: e.shiftKey }); return; }
    }
    if (app.tab === 'levels' && app.dropper && app.geo && app.geo.ok) { app.gesture = Object.assign(base, { type: 'dropper' }); requestRender(); return; }
    app.gesture = Object.assign(base, { type: 'pan', v0: { x: v.x, y: v.y } });
    if (app.tab === 'levels' && app.geo && app.geo.ok) {
      // Levels: press and hold the photo (without moving) to compare with no levels.
      const g = app.gesture;
      g.holdTimer = setTimeout(() => { if (app.gesture === g && !g.moved) { g.comparing = true; setCompare(true); } }, CONFIG.levels.compareHoldMs);
    }
  }

  function onPointerMove(e) {
    if (!pointers.has(e.pointerId)) { hoverCursor(e); return; }
    const p = localPt(e); pointers.set(e.pointerId, p);
    const g = app.gesture, v = currentView(); if (!g || !v) return;
    if (g.type === 'pinch') {
      if (pointers.size < 2) return;
      const [a, b] = [...pointers.values()];
      const d = Math.hypot(a[0] - b[0], a[1] - b[1]), m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      const z = Math.min(64, Math.max(0.01, g.v0.z * d / g.d0));
      const wm = [(g.m0[0] - g.v0.x) / g.v0.z, (g.m0[1] - g.v0.y) / g.v0.z]; // world point under the starting midpoint
      Object.assign(v, { z, x: m[0] - wm[0] * z, y: m[1] - wm[1] * z, auto: false });
      requestRender(); return;
    }
    g.last = p;
    if (Math.hypot(p[0] - g.start[0], p[1] - g.start[1]) > 4) g.moved = true;
    if (g.type === 'dropper') { requestRender(); return; }
    if (g.type === 'pan' && g.comparing) return;
    if (g.type === 'pan') { v.x = g.v0.x + p[0] - g.start[0]; v.y = g.v0.y + p[1] - g.start[1]; v.auto = false; requestRender(); return; }
    const w = toWorld(v, p), dx = w[0] - g.w0[0], dy = w[1] - g.w0[1];
    if (g.type === 'handle') { moveHandle(g.idx, g.c0, dx, dy, v); liveChanged(); return; }
    if (g.type === 'crop') { dragCrop(g, dx, dy, e.shiftKey || g.shift); liveChanged(); }
  }

  function onPointerUp(e) {
    if (!pointers.has(e.pointerId)) return;
    pointers.delete(e.pointerId);
    const g = app.gesture;
    if (g && g.type === 'pinch') { if (pointers.size === 0) app.gesture = null; return; }
    if (g && g.type === 'pan' && !g.moved && performance.now() - g.t0 < 300) {
      // Double-tap / double-click on empty canvas fits the view.
      const t = performance.now(), p = g.start;
      if (t - lastTap.t < 320 && Math.hypot(p[0] - lastTap.x, p[1] - lastTap.y) < 24) { fitCurrent(); lastTap.t = 0; }
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
    const v = currentView(), s = app.state;
    if (!v) return;
    const fitZ = fitView(app.img.width, app.img.height).z;
    if (v.z > fitZ * 2) { app.views.source = null; requestRender(); return; }
    const c = k < 4 ? s.corners[k] : E.V.mid(s.corners[k - 4], s.corners[(k - 3) % 4]), z = Math.min(64, fitZ * CONFIG.handleZoom);
    Object.assign(v, { z, x: app.cssW / 2 - c[0] * z, y: app.cssH / 2 - c[1] * z, auto: false });
    requestRender();
  }
  function endGesture() {
    const g = app.gesture; app.gesture = null;
    if (!g) return;
    clearTimeout(g.holdTimer);
    if (g.comparing) setCompare(false);
    if (g.type === 'dropper') pickAt(g.last);
    if ((g.type === 'handle' || g.type === 'crop') && g.before) commitFrom(g.before);
    requestRender();
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
    const v = currentView(), p = localPt(e); let c = 'grab';
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
    const v = currentView(); if (!v) return;
    const p = localPt(e), dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
    zoomAt(v, p[0], p[1], Math.exp(-dy * (e.ctrlKey ? 0.01 : 0.0015)));
    requestRender();
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
    if (keyMatch(e, K.undo)) { if (!textEntry) { e.preventDefault(); undo(); } return; }
    if (keyMatch(e, K.redo) || keyMatch(e, K.redoAlt)) { if (!textEntry) { e.preventDefault(); redo(); } return; }
    if (typing || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === K.debug) { toggleDebugPanel(); return; }
    if (!app.img) return;
    const k = e.key.toLowerCase();
    if (k === K.fit) { fitCurrent(); return; }
    if (k === K.compare && app.tab === 'levels') { if (!e.repeat) setCompare(true); return; }
    if (/^[1-5]$/.test(e.key)) { setTab(['perspective', 'rotate', 'crop', 'levels', 'export'][+e.key - 1]); return; }
    if (app.tab !== 'perspective') return;
    // Tab cycles handles only while the canvas (or nothing) has focus, so form navigation still works.
    if (e.key === 'Tab' && (document.activeElement === els.canvas || document.activeElement === document.body)) {
      e.preventDefault(); app.selected = (app.selected + (e.shiftKey ? 7 : 1)) % 8; requestRender(); return;
    }
    const dirs = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    if (dirs[e.key] && app.selected >= 0) {
      e.preventDefault();
      const n = e.shiftKey ? K.nudgeShift : K.nudge, [dx, dy] = dirs[e.key];
      commit(s => moveHandleBy(s, app.selected, dx * n, dy * n), 'nudge');
    }
  }
  function moveHandleBy(s, idx, dx, dy) {
    if (idx < 4) { s.corners[idx] = [s.corners[idx][0] + dx, s.corners[idx][1] + dy]; return; }
    const k = idx - 4, a = s.corners[k], b = s.corners[(k + 1) % 4];
    const L = E.V.dist(a, b) || 1, nx = -(b[1] - a[1]) / L, ny = (b[0] - a[0]) / L, t = dx * nx + dy * ny;
    s.corners[k] = [a[0] + nx * t, a[1] + ny * t]; s.corners[(k + 1) % 4] = [b[0] + nx * t, b[1] + ny * t];
  }

  /* ---------- tabs + panel binding ---------- */
  function setTab(tab) {
    app.tab = tab;
    els.root.dataset.tab = tab;
    document.querySelectorAll('.tab').forEach(b => b.setAttribute('aria-selected', String(b.dataset.tab === tab)));
    document.querySelectorAll('section[data-panel]').forEach(s => s.classList.toggle('active', s.dataset.panel === tab));
    els.canvas.style.cursor = '';
    if (tab === 'export' || tab === 'levels') app.views.export = null;
    if (tab !== 'levels') { app.dropper = null; app.compare = false; }
    app.nudgeLoupeUntil = 0; closeStepMenu(); Session.saveSoon();
    if (phoneLayout.matches) collapseMore();
    syncUI(); requestRender(); requestMini();
  }

  function bindSeg(name, onPick) {
    document.querySelectorAll(`[data-seg="${name}"] button`).forEach(b => b.addEventListener('click', () => onPick(b.dataset.v)));
  }
  function setSeg(name, val) { document.querySelectorAll(`[data-seg="${name}"] button`).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === val))); }

  const STEPS = { perspective: 'Perspective', rotate: 'Rotate', crop: 'Crop', levels: 'Levels', export: 'Export' };

  // Step menu (phones): lists the five steps above the action bar.
  function openStepMenu(btn) {
    const m = $('stepMenu');
    m.innerHTML = Object.keys(STEPS).map((t, i) =>
      `<button role="menuitem" data-goto="${t}"${t === app.tab ? ' aria-current="step"' : ''}${t === 'levels' && app.levelsPending ? ' class="pending"' : ''}><span class="n">${i + 1}</span>${STEPS[t]}</button>`).join('');
    m.hidden = false; btn.setAttribute('aria-expanded', 'true');
  }
  function closeStepMenu() {
    $('stepMenu').hidden = true;
    document.querySelectorAll('[data-stepmenu]').forEach(b => b.setAttribute('aria-expanded', 'false'));
  }
  // "More options" expands the control area on phones.
  function collapseMore() { document.querySelectorAll('details.more').forEach(d => { d.open = false; }); els.panel.classList.remove('expanded'); }

  function buildControls() {
    $('cropChips').innerHTML = CONFIG.crop.presets.map(p => `<button class="chip" data-crop="${p.id}">${p.label}</button>`).join('')
      + '<button class="chip" id="btnSwap" title="Swap portrait / landscape">⇄ Swap</button>';
    $('size').innerHTML = CONFIG.export.longEdgePresets.map(n => `<option value="${n}">${n ? n + ' px' : 'Original size'}</option>`).join('');
    // Phones: each action bar starts with the step menu button.
    document.querySelectorAll('section[data-panel] .actionbar').forEach(bar => {
      const tab = bar.closest('section').dataset.panel;
      bar.insertAdjacentHTML('afterbegin', `<button class="btn stepbtn" data-stepmenu aria-haspopup="menu" aria-expanded="false" title="Go to a step">${STEPS[tab]} ▾</button>`);
    });
    $('fine').min = $('fineNum').min = -CONFIG.rotate.fineRangeDeg; $('fine').max = $('fineNum').max = CONFIG.rotate.fineRangeDeg;
    $('fine').step = $('fineNum').step = CONFIG.rotate.fineStepDeg;
  }

  function bindControls() {
    document.querySelectorAll('.tab').forEach(b => b.addEventListener('click', () => app.img && setTab(b.dataset.tab)));
    $('btnOpen').onclick = $('btnOpenEmpty').onclick = () => els.fileInput.click();
    $('btnResume').onclick = resumeSession;
    $('btnFresh').onclick = () => { Session.clear(); hideResume(); };
    $('btnUndo').onclick = undo; $('btnRedo').onclick = redo; $('btnFit').onclick = fitCurrent;
    document.querySelectorAll('[data-next]').forEach(b => b.addEventListener('click', () => setTab(b.dataset.next)));
    document.querySelectorAll('[data-stepmenu]').forEach(b => b.addEventListener('click', () => { if ($('stepMenu').hidden) openStepMenu(b); else closeStepMenu(); }));
    $('stepMenu').addEventListener('click', e => { const b = e.target.closest('[data-goto]'); if (b) { closeStepMenu(); setTab(b.dataset.goto); } });
    document.addEventListener('pointerdown', e => {
      if (!e.target.closest('#stepMenu, [data-stepmenu]')) closeStepMenu();
      // The nudge loupe stays up between nudges; touching anything else hides it.
      if (app.nudgeLoupeUntil && !e.target.closest('[data-nudge]')) { app.nudgeLoupeUntil = 0; requestRender(); }
    }, true);
    document.querySelectorAll('details.more').forEach(d => d.addEventListener('toggle', () => {
      if (phoneLayout.matches) els.panel.classList.toggle('expanded', !!document.querySelector('section.active details.more[open]'));
    }));
    $('btnPreview').onclick = () => { app.previewMode = !app.previewMode; app.views.result = null; syncUI(); requestRender(); };

    // On-screen nudge pad (phones): one screen pixel per step, never less than one source pixel; hold to repeat.
    let nudgeTimer = 0, loupeTimer = 0;
    const flashLoupe = () => {
      app.nudgeLoupeUntil = performance.now() + CONFIG.nudge.loupeMs; requestRender();
      clearTimeout(loupeTimer); loupeTimer = setTimeout(requestRender, CONFIG.nudge.loupeMs + 50);
    };
    const nudgeStep = d => {
      const v = currentView();
      if (!v || app.tab !== 'perspective' || app.previewMode) return;
      const n = Math.max(1, 1 / v.z);
      commit(s => moveHandleBy(s, app.selected, d[0] * n, d[1] * n), 'nudge');
      flashLoupe();
    };
    document.querySelectorAll('[data-nudge]').forEach(b => {
      const stop = () => { clearTimeout(nudgeTimer); clearInterval(nudgeTimer); };
      b.addEventListener('pointerdown', e => {
        e.preventDefault(); stop();
        if (b.dataset.nudge === 'cycle') { app.selected = (app.selected + 1) % 8; flashLoupe(); return; }
        const d = b.dataset.nudge.split(',').map(Number);
        nudgeStep(d);
        nudgeTimer = setTimeout(() => { nudgeTimer = setInterval(() => nudgeStep(d), CONFIG.nudge.repeatMs); }, CONFIG.nudge.delayMs);
      });
      for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) b.addEventListener(ev, stop);
      b.addEventListener('contextmenu', e => e.preventDefault());
    });

    // Perspective
    $('btnDetect').onclick = () => runDetect();
    $('btnNext').onclick = () => { const n = app.detection.candidates.length; if (n) useCandidate((app.detection.index + 1) % n); };
    $('btnSeed').onclick = () => { app.seedMode = !app.seedMode; syncUI(); if (app.seedMode) toast('Tap inside the card.'); };
    $('btnClearSeed').onclick = () => { app.detection.seed = null; app.seedMode = false; syncUI(); requestRender(); };
    // Strength updates live while sliding (geometry only); one undo step per slide.
    const str = $('strength');
    let strengthBefore = null;
    str.oninput = () => {
      if (!strengthBefore) strengthBefore = clone(app.state);
      app.state.strength = str.value / 100; $('strengthVal').textContent = str.value + '%'; liveChanged();
    };
    str.onchange = () => { if (strengthBefore) commitFrom(strengthBefore, 'strength'); strengthBefore = null; };
    bindSeg('orientation', v => commit(s => { s.aspect.orientation = v; }));
    $('snap').onchange = e => { app.snap = e.target.checked; };
    $('debugOverlay').onchange = e => { app.debugOverlay = e.target.checked; if (app.debugOverlay && !(app.detection.last && app.detection.last.debug)) runDetect(); requestRender(); };
    $('fill').onchange = e => { const v = e.target.value === 'custom' ? $('fillColor').value : e.target.value; commit(s => { s.export.fill = v; }); };
    $('fillColor').oninput = e => { $('fill').value = 'custom'; commit(s => { s.export.fill = e.target.value; }, 'fill'); };

    // Rotate
    const turn = d => commit(s => {
      s.rotation.quarter = (s.rotation.quarter + d + 4) % 4;
      // Keep a manual crop on the same content: rotate its center/size by the same quarter turn.
      if (s.crop.rect) { const r = s.crop.rect; s.crop.rect = d > 0 ? { cx: -r.cy, cy: r.cx, w: r.h, h: r.w } : { cx: r.cy, cy: -r.cx, w: r.h, h: r.w }; }
      if (s.crop.ratio && s.crop.ratio !== 1) s.crop.swapped = !s.crop.swapped;
      if (s.crop.orient) s.crop.orient = s.crop.orient === 'portrait' ? 'landscape' : 'portrait';
    });
    $('btnRotL').onclick = () => turn(-1); $('btnRotR').onclick = () => turn(1);
    // Screen-space flips. The pipeline flips before rotating, and reflect·Rot(θ) = Rot(−θ)·reflect,
    // so a flip "as seen" = toggle the flip bit and negate the rotation.
    const flip = axis => commit(s => {
      s.flip[axis] = !s.flip[axis];
      s.rotation.quarter = (4 - s.rotation.quarter) % 4; s.rotation.fine = -s.rotation.fine || 0;
      if (s.crop.rect) { if (axis === 'h') s.crop.rect.cx = -s.crop.rect.cx; else s.crop.rect.cy = -s.crop.rect.cy; }
    });
    $('btnFlipH').onclick = () => flip('h'); $('btnFlipV').onclick = () => flip('v');
    const setFine = v => commit(s => { s.rotation.fine = Math.round(Math.max(-CONFIG.rotate.fineRangeDeg, Math.min(CONFIG.rotate.fineRangeDeg, v)) * 10) / 10; }, 'fine');
    $('fine').oninput = e => setFine(+e.target.value);
    $('fineNum').onchange = e => setFine(+e.target.value || 0);
    $('btnFineZero').onclick = () => setFine(0);
    $('fillFrame').onchange = e => commit(s => { s.rotation.fillFrame = e.target.checked; });
    $('showGrid').onchange = e => { app.showGrid = e.target.checked; requestRender(); };

    // Crop
    $('cropChips').addEventListener('click', e => {
      const b = e.target.closest('[data-crop]'); if (!b) return;
      commit(s => {
        const prevAbs = app.geo && app.geo.ok ? { ...app.geo.crop } : null;
        s.crop.preset = b.dataset.crop; s.crop.ratio = presetRatio(b.dataset.crop);
        s.crop.swapped = false; alignCrop(s, app.geo); // the box swap is handled by the reshape below
        if (s.crop.mode === 'manual' && prevAbs && s.crop.ratio) {
          // Re-shape the manual box to the new aspect, same center and area.
          const r = E.cropRatio(s.crop, s.source.width, s.source.height), A = prevAbs.w * prevAbs.h;
          let w = Math.sqrt(A * r), h = Math.sqrt(A / r);
          const k = Math.min(1, app.geo.R.w / w, app.geo.R.h / h); w *= k; h *= k;
          const cx = Math.min(Math.max(prevAbs.x + prevAbs.w / 2, w / 2), app.geo.R.w - w / 2), cy = Math.min(Math.max(prevAbs.y + prevAbs.h / 2, h / 2), app.geo.R.h - h / 2);
          setCropAbs({ x: cx - w / 2, y: cy - h / 2, w, h });
        }
      });
    });
    $('btnSwap').onclick = () => commit(s => {
      const next = cropOrient(s, app.geo) === 'portrait' ? 'landscape' : 'portrait';
      s.crop.orient = next === cardOrient(app.geo) ? null : next;
      s.crop.swapped = !s.crop.swapped;
      if (s.crop.mode === 'manual' && s.crop.rect) { const r = s.crop.rect; s.crop.rect = { cx: r.cx, cy: r.cy, w: r.h, h: r.w }; }
    });
    $('btnFit2Card').onclick = () => commit(s => { s.crop.mode = 'fit'; s.crop.rect = null; });

    // Levels
    $('btnAutoLevels').onclick = autoLevelsDraft;
    const arm = which => { app.dropper = app.dropper === which ? null : which; syncUI(); if (app.dropper) toast(`Tap the image where it should be ${which}.`); };
    $('btnPickWhite').onclick = () => arm('white');
    $('btnPickBlack').onclick = () => arm('black');
    $('btnClearLevels').onclick = () => { app.dropper = null; setDraft(d => { d.white = d.whiteAt = d.black = d.blackAt = null; }); };
    $('btnApplyLevels').onclick = applyLevels;
    $('btnDiscardLevels').onclick = discardLevels;

    // Export
    $('format').onchange = e => commit(s => { s.export.format = e.target.value; });
    const ql = $('quality');
    ql.oninput = () => commit(s => { s.export.quality = +ql.value; }, 'quality');
    $('size').onchange = e => commit(s => { s.export.longEdge = +e.target.value || 0; });
    $('interp').onchange = e => commit(s => { s.export.interp = e.target.value; });
    $('btnDownload').onclick = () => doExport('download');
    $('btnShare').onclick = () => app.pendingSave ? shareFile(app.pendingSave) : doExport('share');
    // Share is the main action where the browser supports it; Download stays as a plain download.
    if (Exporter.canShare()) { $('btnShare').hidden = false; $('btnDownload').classList.remove('primary'); }
    $('btnCopy').onclick = () => doExport('copy');
    $('btnListing').onclick = () => commit(s => {
      s.crop = { mode: 'fit', preset: '1:1', ratio: 1, swapped: false, orient: null, rect: null };
      s.export.format = 'jpeg'; s.export.quality = 0.92; s.export.longEdge = 2000;
      if (s.export.fill === 'transparent') s.export.fill = '#ffffff';
    });
    $('btnSaveEdits').onclick = saveEdits;
    $('btnLoadEdits').onclick = () => els.editsInput.click();
    els.editsInput.addEventListener('change', () => { const f = els.editsInput.files[0]; els.editsInput.value = ''; if (f) loadEdits(f); });

    document.querySelectorAll('[data-reset]').forEach(b => b.addEventListener('click', () => resetStep(b.dataset.reset)));
  }

  function resetStep(step) {
    commit(s => {
      if (step === 'perspective') {
        const c = app.detection.candidates[0];
        s.corners = c ? c.corners.map(p => p.slice()) : insetCorners(s.source.width, s.source.height);
        s.strength = CONFIG.perspective.strength / 100;
        s.aspect = cardAspect(); s.squareUpHeight = CONFIG.squareUpHeight;
      } else if (step === 'rotate') { s.rotation = { quarter: 0, fine: 0, fillFrame: false }; s.flip = { h: false, v: false }; }
      else if (step === 'crop') s.crop = cropDefaults(null);
      else if (step === 'export') {
        const x = CONFIG.export;
        s.export = { format: x.format, quality: x.quality, longEdge: x.longEdge, interp: x.interp, fill: x.fill };
      }
    });
  }

  function syncUI() {
    const has = !!app.img, s = app.state;
    els.root.classList.toggle('has-img', has);
    els.root.classList.toggle('previewing', !!app.previewMode && app.tab === 'perspective');
    $('btnPreview').setAttribute('aria-pressed', String(!!app.previewMode));
    $('btnPreview').querySelector('span').textContent = app.previewMode ? 'Corners' : 'Preview';
    $('btnUndo').disabled = !History.undo.length; $('btnRedo').disabled = !History.redo.length;
    $('btnFit').disabled = !has;
    document.querySelectorAll('.tab').forEach(b => { b.disabled = !has; });
    document.querySelectorAll('.panel button, .panel select, .panel input').forEach(x => { x.disabled = !has; });
    if (!s) return;
    setSeg('orientation', s.aspect.orientation); $('format').value = s.export.format;
    $('strength').value = Math.round(s.strength * 100); $('strengthVal').textContent = Math.round(s.strength * 100) + '%';
    $('snap').checked = app.snap; $('debugOverlay').checked = app.debugOverlay;
    const fill = s.export.fill, known = ['transparent', '#ffffff', '#000000'].includes(fill);
    $('fill').value = known ? fill : 'custom'; if (!known) $('fillColor').value = fill;
    $('btnSeed').setAttribute('aria-pressed', String(app.seedMode));
    $('btnClearSeed').disabled = !app.detection.seed;
    const n = app.detection.candidates.length;
    $('btnNext').disabled = n < 2;
    $('btnNext').textContent = n > 1 ? `Candidate ${app.detection.index + 1}/${n}` : 'Candidate';
    $('fine').value = s.rotation.fine; $('fineNum').value = s.rotation.fine;
    $('fillFrame').checked = !!s.rotation.fillFrame; $('showGrid').checked = app.showGrid;
    const orient = cropOrient(s, app.geo);
    document.querySelectorAll('[data-crop]').forEach(b => {
      b.setAttribute('aria-pressed', String(b.dataset.crop === s.crop.preset));
      b.textContent = cropLabel(CONFIG.crop.presets.find(p => p.id === b.dataset.crop), orient);
    });
    $('btnSwap').disabled = !s.crop.ratio || s.crop.ratio === 1;
    $('quality').value = s.export.quality; $('qualityVal').textContent = Math.round(s.export.quality * 100) + '%';
    $('qualityRow').hidden = s.export.format === 'png';
    $('size').value = String(s.export.longEdge || 0);
    $('interp').value = s.export.interp;
    syncLevels();
    syncReadouts();
  }

  function syncLevels() {
    const s = app.state;
    if (app.levelsPending && JSON.stringify(app.levelsDraft) === JSON.stringify(s.levels || null)) { app.levelsPending = false; app.levelsDraft = null; }
    const lv = draftLevels() || {};
    const sw = (id, c) => {
      const e = $(id), rgb = c && c.map(Math.round).join(', ');
      e.style.background = c ? `rgb(${rgb})` : ''; e.classList.toggle('unset', !c); e.title = c ? `RGB ${rgb}` : 'Not set';
    };
    sw('swWhite', lv.white); sw('swBlack', lv.black);
    $('btnPickWhite').setAttribute('aria-pressed', String(app.dropper === 'white'));
    $('btnPickBlack').setAttribute('aria-pressed', String(app.dropper === 'black'));
    $('btnClearLevels').disabled = !lv.white && !lv.black;
    $('btnApplyLevels').disabled = $('btnDiscardLevels').disabled = !app.levelsPending;
    // No "unapplied" message: the step's dot and the enabled Apply button say it.
    document.querySelector('[data-tab="levels"]').classList.toggle('pending', app.levelsPending);
    els.root.classList.toggle('levels-pending', app.levelsPending);
  }

  function syncReadouts() {
    const s = app.state, g = app.geo; if (!s) return;
    $('btnShare').querySelector('span').textContent = app.pendingSave ? 'Share now' : 'Share';
    // Perspective: detection details live under More; the status line only shows what needs action.
    const n = app.detection.candidates.length, c = n ? app.detection.candidates[app.detection.index] : null;
    $('detectInfo').textContent = app.detection.msg || (c ? `Candidate ${app.detection.index + 1}/${n} · confidence ${Math.round(c.confidence * 100)}%` : '');
    const ps = $('perspStatus');
    ps.className = 'status' + (g && !g.ok ? ' err' : '');
    ps.textContent = g && !g.ok ? g.reason
      : app.detection.msg ? app.detection.msg
      : c && c.confidence < CONFIG.detect.minConfidence ? `Low confidence (${Math.round(c.confidence * 100)}%) — check the corners.`
      : !n && app.img && app.detection.last ? 'Nothing detected — drag the corners into place.'
      : g && g.P.clamped ? `Corrected frame clamped to ${CONFIG.maxOutputPx}px on the long side.` : '';
    if (!g || !g.ok) { $('cropReadout').textContent = ''; $('exportReadout').textContent = ''; $('exportMsg').textContent = ''; $('btnDownload').disabled = $('btnShare').disabled = $('btnCopy').disabled = true; return; }
    $('cropReadout').innerHTML = `Crop <b>${Math.round(g.crop.w)} × ${Math.round(g.crop.h)}</b> px`;
    const small = s.export.longEdge && g.out.scale >= 1 && Math.max(g.crop.w, g.crop.h) < s.export.longEdge;
    $('exportReadout').innerHTML = `Output <b>${g.out.w} × ${g.out.h}</b> px · ${s.export.format.toUpperCase()}` + (small ? ' · full crop, not upscaled' : '');
    const em = $('exportMsg'), notes = [];
    if (g.out.clamped) notes.push(`Clamped to fit the ${Math.round(CONFIG.maxOutputArea / 1e6 * 10) / 10} MP canvas limit.`);
    if (s.export.format === 'jpeg' && s.export.fill === 'transparent') notes.push('JPEG has no transparency; empty areas will be white.');
    if (app.levelsPending) notes.push('Levels has unapplied changes; the export uses the applied levels only.');
    em.className = 'status'; em.textContent = notes.join(' ');
    $('btnDownload').disabled = !!app.exporting; $('btnShare').disabled = !!app.exporting && !app.pendingSave; $('btnCopy').disabled = !!app.exporting || !Exporter.canCopy();
  }

  let toastTimer = 0;
  function toast(text, kind = '', ms = 3000) {
    const t = els.toast; t.textContent = text; t.className = 'toast show ' + kind;
    clearTimeout(toastTimer); toastTimer = setTimeout(hideToast, ms);
  }
  function hideToast() { els.toast.classList.remove('show'); }

  /* =====================================================================
     EXPORT — full-resolution render in row bands, then encode via Exporter.
     ===================================================================== */
  const Exporter = {
    download(blob, filename) {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = filename;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 60000);
    },
    // Share sheet (Save Image, AirDrop…): keeps the app open, where a download on iOS Safari replaces
    // the page with the file. Only offered when the browser can share image files (secure pages only).
    canShare() {
      if (!CONFIG.export.share || !navigator.share || !navigator.canShare) return false;
      try { return navigator.canShare({ files: [new File([new Blob()], 'test.jpg', { type: 'image/jpeg' })] }); } catch (e) { return false; }
    },
    canCopy: () => !!(navigator.clipboard && navigator.clipboard.write && window.ClipboardItem),
    // Safari requires the ClipboardItem to be created synchronously in the gesture with a Promise.
    copy(blobPromise) { return navigator.clipboard.write([new ClipboardItem({ 'image/png': blobPromise })]); },
  };
  const MIME = { jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
  const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
  const toBlob = (c, type, q) => new Promise((res, rej) => c.toBlob(b => b ? res(b) : rej(new Error('Encoding failed (image too large for this browser?)')), type, q));

  // Source-space bounding box of an output row band (projective maps send lines to lines,
  // so the band's 4 corners bound its preimage unless it straddles the horizon).
  function bandSourceBox(Minv, outW, y0, y1, W, H) {
    const pts = [], n = 8;
    for (let i = 0; i <= n; i++) for (const y of [y0, y1]) pts.push([outW * i / n, y]);
    for (const x of [0, outW]) for (let i = 1; i < n; i++) pts.push([x, y0 + (y1 - y0) * i / n]);
    let x0 = Infinity, ya = Infinity, x1 = -Infinity, yb = -Infinity, any = false;
    for (const p of pts) {
      if (M3.w(Minv, p[0], p[1]) <= 1e-12) { x0 = 0; ya = 0; x1 = W; yb = H; any = true; continue; }
      const q = M3.apply(Minv, p[0], p[1]); any = true;
      x0 = Math.min(x0, q[0]); ya = Math.min(ya, q[1]); x1 = Math.max(x1, q[0]); yb = Math.max(yb, q[1]);
    }
    const m = 3; // bicubic needs 2 px of neighbors
    x0 = Math.max(0, Math.floor(x0) - m); ya = Math.max(0, Math.floor(ya) - m);
    x1 = Math.min(W, Math.ceil(x1) + m); yb = Math.min(H, Math.ceil(yb) + m);
    return any && x1 > x0 && yb > ya ? { x0, y0: ya, x1, y1: yb } : null;
  }

  // render(sourceImage, state) at full resolution → canvas. Deterministic for a given state.
  async function renderFull(st, onProgress) {
    const g = E.computeGeometry(st, geoCfg());
    if (!g.ok) throw new Error(g.reason);
    const W = st.source.width, H = st.source.height, outW = g.out.w, outH = g.out.h, Minv = g.MoutInv;
    const fill = fillRGBA(st.export.format === 'jpeg' && st.export.fill === 'transparent' ? '#ffffff' : st.export.fill);
    const out = makeCanvas(outW, outH), octx = ctx2d(out);
    const lut = E.levelsLUT(st.levels, CONFIG.levels);
    const reg = makeCanvas(1, 1), rctx = ctx2d(reg, true);
    let bandH = Math.max(8, Math.floor(CONFIG.export.bandPx / outW)), y = 0;
    while (y < outH) {
      const bh = Math.min(bandH, outH - y);
      const box = bandSourceBox(Minv, outW, y, y + bh, W, H);
      const band = new ImageData(outW, bh);
      if (box) {
        // Local sampling density: source px covered by one output px at the band center.
        const c0 = M3.apply(Minv, outW / 2, y + bh / 2), cx = M3.apply(Minv, outW / 2 + 1, y + bh / 2), cy = M3.apply(Minv, outW / 2, y + bh / 2 + 1);
        const dens = Math.sqrt(Math.max(1e-9, E.V.dist(c0, cx) * E.V.dist(c0, cy)));
        // When shrinking a lot, let the browser's area-filtered resampler pre-shrink the region
        // first (a mip level), since bilinear alone only reads 4 texels and aliases.
        const r = isFinite(dens) && dens > 1.5 ? Math.min(1, 1.25 / dens) : 1;
        const sw = box.x1 - box.x0, sh = box.y1 - box.y0;
        if (sw * sh * r * r > CONFIG.export.maxBandSrcPx && bandH > 8) { bandH = Math.max(8, bandH >> 1); continue; }
        const rw = Math.max(1, Math.round(sw * r)), rh = Math.max(1, Math.round(sh * r)), rx = rw / sw, ry = rh / sh;
        reg.width = rw; reg.height = rh;
        rctx.imageSmoothingEnabled = true; rctx.imageSmoothingQuality = 'high';
        rctx.drawImage(app.img.el, box.x0, box.y0, sw, sh, 0, 0, rw, rh);
        const src = rctx.getImageData(0, 0, rw, rh);
        if (lut) E.applyLUT(src, lut); // levels are per-pixel, so applying before the warp leaves the fill color untouched
        const M = M3.chain(M3.scale(rx, ry), M3.translate(-box.x0, -box.y0), Minv);
        E.warp(band, src, M, { fill, interp: st.export.interp, rowOffset: y, bounds: [-box.x0 * rx, -box.y0 * ry, (W - box.x0) * rx, (H - box.y0) * ry] });
      } else {
        const d = band.data; for (let i = 0; i < d.length; i += 4) { d[i] = fill[0]; d[i + 1] = fill[1]; d[i + 2] = fill[2]; d[i + 3] = fill[3]; }
      }
      octx.putImageData(band, 0, y);
      y += bh;
      onProgress && onProgress(y / outH);
      await nextFrame();
    }
    reg.width = reg.height = 0;
    return { canvas: out, geo: g };
  }

  async function doExport(kind) {
    if (!app.img || app.exporting) return;
    const st = clone(app.state);
    const fmt = kind === 'copy' ? 'image/png' : MIME[st.export.format];
    const prog = $('progress'), bar = prog.firstElementChild;
    app.exporting = true; prog.hidden = false; bar.style.width = '0%'; syncReadouts();
    const t0 = performance.now();
    const work = renderFull(st, f => { bar.style.width = Math.round(f * 100) + '%'; })
      .then(async ({ canvas }) => {
        // JPEG can't hold alpha; flatten onto white so transparent fill doesn't turn black.
        if (fmt === 'image/jpeg' && st.export.fill === 'transparent') {
          const c2 = makeCanvas(canvas.width, canvas.height), x = ctx2d(c2);
          x.fillStyle = '#fff'; x.fillRect(0, 0, c2.width, c2.height); x.drawImage(canvas, 0, 0); canvas.width = 0; canvas = c2;
        }
        const blob = await toBlob(canvas, fmt, st.export.format === 'png' ? undefined : st.export.quality);
        canvas.width = canvas.height = 0; // free the big buffer now (matters on iOS)
        return blob;
      });
    try {
      if (kind === 'copy') {
        await Exporter.copy(work);
        toast('Copied to clipboard (PNG).');
      } else {
        const blob = await work;
        const ext = EXT[blob.type] || 'png';
        if (blob.type !== fmt) toast(`${st.export.format.toUpperCase()} isn’t supported by this browser — saved as ${ext.toUpperCase()}.`, 'warn', 5000);
        const base = (st.source.name || 'photo').replace(/\.[^.]+$/, '');
        const secs = ((performance.now() - t0) / 1000).toFixed(1);
        const name = `${base}${CONFIG.export.suffix}.${ext}`, done = `Exported ${app.geo.out.w} × ${app.geo.out.h} px in ${secs} s.`;
        if (kind === 'download') { Session.flush(); Exporter.download(blob, name); toast(done); }
        else {
          const how = await shareFile(new File([blob], name, { type: blob.type }));
          if (how === 'pending') toast(done + ' Tap Share now to open the share sheet.', '', 6000);
          else if (how === 'shared') toast(done);
        }
      }
    } catch (e) {
      console.error(e); toast((kind === 'copy' ? 'Copy failed: ' : 'Export failed: ') + e.message, 'err', 6000);
    } finally {
      app.exporting = false; prog.hidden = true; syncReadouts();
    }
  }

  // Opens the share sheet for a finished file. Returns 'shared', 'cancelled', 'pending' or 'failed'.
  // 'pending': the browser refused because the tap was too long ago (a slow export), so the Share
  // button becomes "Share now" and a fresh tap opens the sheet. Any edit cancels it.
  async function shareFile(file) {
    try { await navigator.share({ files: [file] }); app.pendingSave = null; return 'shared'; }
    catch (e) {
      if (e.name === 'AbortError') return 'cancelled';
      if (e.name === 'NotAllowedError' && !app.pendingSave) { app.pendingSave = file; return 'pending'; }
      app.pendingSave = null; toast('Share failed: ' + e.message, 'err', 6000); return 'failed';
    } finally { syncReadouts(); }
  }

  /* ---------- save / load edits (the serializable edit state) ---------- */
  function saveEdits() {
    if (!app.state) return;
    const blob = new Blob([JSON.stringify(app.state, null, 2)], { type: 'application/json' });
    Session.flush(); Exporter.download(blob, (app.state.source.name || 'photo').replace(/\.[^.]+$/, '') + '-edits.json');
  }
  async function loadEdits(file) {
    let st;
    try { st = JSON.parse(await file.text()); } catch (e) { toast('That file isn’t valid JSON.', 'err'); return; }
    if (!st || ![1, 2].includes(st.version) || !st.source || !Array.isArray(st.corners)) { toast('That isn’t a Card Finisher edits file.', 'err'); return; }
    if (st.version === 1) {
      // v1 had separate Square up / Flatten modes and a Card/Case target; square up = 0% flatten.
      if (st.mode === 'square') st.strength = 0;
      st.aspect = cardAspect(st.aspect && st.aspect.orientation);
      delete st.mode; delete st.target; st.version = 2;
    }
    if (!app.img) { toast('Open the matching photo first, then load its edits.', 'warn', 5000); return; }
    if (st.crop && st.crop.orient === undefined) {
      const r = st.crop.ratio === 'original' ? st.source.width / st.source.height : st.crop.ratio;
      st.crop.orient = r && r !== 1 ? ((st.crop.swapped ? 1 / r : r) < 1 ? 'portrait' : 'landscape') : null;
    }
    if (st.source.width !== app.img.width || st.source.height !== app.img.height) {
      toast(`These edits are for a ${st.source.width}×${st.source.height} photo; this one is ${app.img.width}×${app.img.height}.`, 'err', 6000); return;
    }
    if (st.source.name !== app.img.name) toast(`Edits were saved for “${st.source.name}”. Applied anyway — sizes match.`, 'warn', 5000);
    st.source.name = app.img.name;
    commit(s => { for (const k of Object.keys(s)) delete s[k]; Object.assign(s, st); });
  }

  /* ---------- debug tuning panel (?debug=1 or the ` key) ---------- */
  function toggleDebugPanel(force) {
    const p = els.debugPanel, show = force !== undefined ? force : p.hidden;
    p.hidden = !show;
    if (show) { buildDebugPanel(); if (!app.debugOverlay) { app.debugOverlay = true; syncUI(); if (app.img) runDetect(); } }
  }
  let redetectTimer = 0;
  function buildDebugPanel() {
    const p = els.debugPanel, d = CONFIG.detect;
    const rows = Object.keys(d).filter(k => typeof d[k] === 'number' || typeof d[k] === 'boolean').map(k => typeof d[k] === 'boolean'
      ? `<label>${k}<input type="checkbox" data-k="${k}" ${d[k] ? 'checked' : ''}></label>`
      : `<label>${k}<input type="number" data-k="${k}" value="${d[k]}" step="any"></label>`).join('');
    p.innerHTML = `<div class="row" style="justify-content:space-between"><b>Detection tuning</b><button class="btn" id="dbgClose" style="min-height:32px">×</button></div>
      <div class="row"><button class="btn" id="dbgCopy" style="min-height:36px">Copy CONFIG</button><button class="btn" id="dbgRun" style="min-height:36px">Re-detect</button></div>
      ${rows}<pre id="dbgInfo"></pre>`;
    p.querySelector('#dbgClose').onclick = () => toggleDebugPanel(false);
    p.querySelector('#dbgRun').onclick = () => runDetect();
    p.querySelector('#dbgCopy').onclick = async () => {
      const text = 'const CONFIG = ' + JSON.stringify(CONFIG, null, 2) + ';\n';
      try { await navigator.clipboard.writeText(text); toast('CONFIG copied.'); }
      catch (e) { console.log(text); toast('Clipboard blocked — CONFIG printed to the console.', 'warn'); }
    };
    p.querySelectorAll('input[data-k]').forEach(inp => inp.addEventListener('input', () => {
      const k = inp.dataset.k;
      CONFIG.detect[k] = inp.type === 'checkbox' ? inp.checked : Number(inp.value);
      clearTimeout(redetectTimer); redetectTimer = setTimeout(() => runDetect(), 350);
    }));
    updateDebugPanel();
  }
  function updateDebugPanel() {
    const info = els.debugPanel.querySelector('#dbgInfo'); if (!info) return;
    const last = app.detection.last; if (!last) { info.textContent = ''; return; }
    const t = last.timing || {};
    info.textContent = `round trip ${Math.round(app.detection.ms || 0)} ms (analyze ${Math.round(t.analyze)} ms, quads ${Math.round(t.quads)} ms)\n` +
      `${t.lines} lines → ${t.quadCount} quads\n` + app.detection.candidates.map((c, i) =>
        `#${i + 1} score ${c.score.toFixed(3)} conf ${(c.confidence * 100).toFixed(0)}% sup ${c.parts.support.toFixed(2)} min ${c.parts.supMin.toFixed(2)} asp ${c.parts.aspect.toFixed(2)} ang ${c.parts.angle.toFixed(2)} area ${(c.parts.areaFrac * 100).toFixed(1)}% refined ${c.refined ? c.refined.map(Number).join('') : '-'}`).join('\n');
  }

  /* ---------- self-tests (?selftest=1) ---------- */
  async function runSelfTests() {
    const main = E.selfTest();
    console.group('[card-finisher] self-tests (main thread)'); console.table(main.results); console.groupEnd();
    let worker = null;
    if (EngineWorker.worker && !EngineWorker.failed) {
      try { worker = await EngineWorker.call('selftest', {}); console.group('[card-finisher] self-tests (Web Worker)'); console.table(worker.results); console.groupEnd(); }
      catch (e) { console.error('worker self-test failed', e); }
    }
    const count = r => `${r.results.filter(x => x.pass).length}/${r.results.length}`;
    const msg = `Self-tests: main ${count(main)}` + (worker ? `, worker ${count(worker)}` : ', worker unavailable');
    toast(msg, main.passed && (!worker || worker.passed) ? '' : 'err', 8000);
    window.__selftest = { main, worker };
  }

  /* ---------- resume prompt (start screen) ---------- */
  function ago(t) {
    const m = Math.round((Date.now() - t) / 60000);
    return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`;
  }
  async function offerResume() {
    const rec = await Session.peek();
    if (!rec || app.img) return;
    $('resumeName').textContent = rec.name; $('resumeWhen').textContent = '(' + ago(rec.savedAt) + ')';
    $('resume').hidden = false; $('btnOpenEmpty').classList.remove('primary');
  }
  function hideResume() { $('resume').hidden = true; $('btnOpenEmpty').classList.add('primary'); }
  async function resumeSession() {
    hideResume();
    try {
      const [photo, edits] = await Promise.all([Session.loadPhoto(), Session.peek()]);
      if (!photo) { toast('The saved photo is gone. Open it again.', 'warn', 5000); return; }
      await openFile(new File([photo.buf], photo.name, { type: photo.type }), photo.name, edits);
    } catch (e) { console.error(e); toast('Couldn’t resume: ' + e.message, 'err', 6000); }
  }

  /* ---------- init ---------- */
  const phoneLayout = matchMedia('(max-width: 760px)');
  function placeLayout() {
    // Wide screens show every "More options" section open; phones start them closed.
    if (phoneLayout.matches) collapseMore(); else document.querySelectorAll('details.more').forEach(d => { d.open = true; });
    closeStepMenu();
  }

  function init() {
    els.root.dataset.tab = app.tab;
    document.querySelector('.brand').title = 'Version ' + CONFIG.appVersion;
    console.info(`[card-finisher] v${CONFIG.appVersion}`);
    buildControls(); bindControls();
    placeLayout(); phoneLayout.addEventListener('change', placeLayout);
    EngineWorker.init();
    const onFile = (f, name) => openFile(f, name);
    ImageSource.bindPicker(els.fileInput, onFile);
    ImageSource.bindDrop(els.stage, onFile);
    ImageSource.bindPaste(onFile);
    const c = els.canvas;
    c.addEventListener('pointerdown', onPointerDown);
    c.addEventListener('pointermove', onPointerMove);
    c.addEventListener('pointerup', onPointerUp);
    c.addEventListener('pointercancel', onPointerUp);
    c.addEventListener('wheel', onWheel, { passive: false });
    c.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('gesturestart', e => e.preventDefault()); // stop iOS page zoom during pinch
    // iOS Safari: cancelling touchstart on the photo and on press-and-hold buttons stops the long-press
    // selection magnifier and callout. Pointer events still fire, so drags and holds work as before.
    const noTouchDefault = e => { if (e.cancelable) e.preventDefault(); };
    for (const el of [c, ...document.querySelectorAll('[data-nudge]')]) el.addEventListener('touchstart', noTouchDefault, { passive: false });
    els.root.addEventListener('selectstart', e => { if (!e.target.closest || !e.target.closest('input, select, textarea')) e.preventDefault(); });
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', e => { if (e.key.toLowerCase() === CONFIG.keys.compare) setCompare(false); });
    window.addEventListener('blur', () => setCompare(false));
    // Save the edits right away when the page is hidden or left (iOS may close a background tab).
    window.addEventListener('pagehide', () => Session.flush());
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') Session.flush(); });
    new ResizeObserver(resizeCanvas).observe(els.stage);
    new ResizeObserver(() => requestMini()).observe(els.mini);
    resizeCanvas(); syncUI();
    offerResume();
    if (CONFIG.debug) toggleDebugPanel(true);
    if (params.has('selftest')) runSelfTests();
    // PWA (phase two): register the service worker from its own file.
    // if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js');
    // Test hook (not used by the UI): lets automated checks drive the app.
    window.__straightener = { app, openFile, runDetect, renderFull, setTab, commit, undo, redo, stateChanged, EngineWorker, Detector, draw, Session, resumeSession, shareFile, Exporter };
  }
  init();
})();
