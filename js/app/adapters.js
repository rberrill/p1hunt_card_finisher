/* =====================================================================
   js/app/adapters.js — Phase-two swap points: ImageSource, the engine Web Worker, Detector (JS), Prefs (localStorage), Session (IndexedDB).
   Shell modules share one namespace, CF (created in core.js). Names from core are
   destructured below; anything from another module is called as CF.name.
   tests/selftest.js checks these boundaries.
   ===================================================================== */
(function (CF) {
  'use strict';
  const { E, Quad, clone, makeCanvas, ctx2d, app, toast } = CF;

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

  // The swap point for native detection (Apple Vision / ML Kit) in phase two; today it's the JS engine.
  const Detector = {
    detect(imageData, options) { return JSDetector.detect(imageData, options); },
  };

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
    // Start fresh clears the photo session only; the saved overlay ('overlay') survives it.
    clear() {
      this.photoId = 0;
      return this.enabled ? this.tx('readwrite', st => { st.delete('photo'); st.delete('photoOverlay'); return st.delete('edits'); }).catch(() => {}) : Promise.resolve();
    },
    // Other records: 'overlay' (the saved logo, AC19) and 'photoOverlay' (the current photo's logo, for Resume).
    get(key) { return this.enabled ? this.tx('readonly', st => st.get(key)) : Promise.reject(new Error('storage unavailable')); },
    put(key, value) { return this.enabled ? this.tx('readwrite', st => st.put(value, key)) : Promise.reject(new Error('storage unavailable')); },
    del(key) { return this.enabled ? this.tx('readwrite', st => st.delete(key)) : Promise.resolve(); },
  };

  Object.assign(CF, { ImageSource, scaledCopy, readRegion, EngineWorker, JSDetector, Detector, Prefs, Session });
})(window.CF);
