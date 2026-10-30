/* =====================================================================
   js/app/adapters.js: the phase-two swap points. ImageSource, the engine Web Worker,
   Detector (JS today), Prefs (localStorage) and Session (IndexedDB).
   Shell modules share one namespace, CF (created in core.js). Names from core are
   destructured below; anything from another module is called as CF.name.
   tests/selftest.js checks these boundaries.
   ===================================================================== */
(function (CF) {
  'use strict';
  const { Quad, clone, makeCanvas, context2d, app } = CF;

  /* =====================================================================
     IMAGE I/O: ImageSource (file picker, drag and drop, paste).
     Phase two adds the camera and photo library behind the same load(blob) call.
     ===================================================================== */
  const ImageSource = {
    isHeic: file => /image\/hei[cf]/i.test(file.type || '') || /\.hei[cf]$/i.test(file.name || ''),

    // Decodes a photo, honoring its EXIF orientation. Returns { el, width, height, name, close }.
    async load(blob, name) {
      const photoName = name || blob.name || 'photo';
      let bitmap = null;
      if (typeof createImageBitmap === 'function') {
        try {
          bitmap = await createImageBitmap(blob, { imageOrientation: 'from-image' });
        } catch (error) {
          bitmap = null;
        }
      }
      if (bitmap) {
        const close = () => {
          try {
            bitmap.close();
          } catch (error) { /* already closed */ }
        };
        return { el: bitmap, width: bitmap.width, height: bitmap.height, name: photoName, close };
      }
      // Fallback: <img> honors EXIF orientation by default (CSS image-orientation: from-image).
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.src = url;
      try {
        await img.decode();
      } catch (error) {
        URL.revokeObjectURL(url);
        if (ImageSource.isHeic(blob)) {
          throw new Error('This browser can’t open HEIC. Save the photo as JPEG first '
            + '(Safari opens HEIC directly).');
        }
        throw new Error('Couldn’t read that file as an image.');
      }
      const close = () => {
        URL.revokeObjectURL(url);
        img.src = '';
      };
      return {
        el: img,
        width: img.naturalWidth,
        height: img.naturalHeight,
        name: photoName,
        close,
      };
    },

    bindPicker(input, onFile) {
      input.addEventListener('change', () => {
        if (input.files[0]) onFile(input.files[0]);
        input.value = '';
      });
    },

    bindDrop(el, onFile) {
      el.addEventListener('dragover', event => {
        event.preventDefault();
        el.classList.add('drag-over');
      });
      el.addEventListener('dragleave', () => el.classList.remove('drag-over'));
      el.addEventListener('drop', event => {
        event.preventDefault();
        el.classList.remove('drag-over');
        const isPhoto = file => file.type.startsWith('image/') || ImageSource.isHeic(file);
        const file = [...(event.dataTransfer.files || [])].find(isPhoto);
        if (file) onFile(file);
      });
    },

    bindPaste(onFile) {
      document.addEventListener('paste', event => {
        const items = event.clipboardData ? event.clipboardData.items : [];
        const item = [...items].find(candidate => candidate.type.startsWith('image/'));
        if (!item) return;
        event.preventDefault();
        onFile(item.getAsFile(), 'pasted-photo');
      });
    },
  };

  // A downscaled copy at most maxPx on its long side → { canvas, data, scale }. Reduces by
  // repeated halving (each step ≤ 2×) so large reductions don't alias.
  function scaledCopy(source, sourceWidth, sourceHeight, maxPx) {
    const scale = Math.min(1, maxPx / Math.max(sourceWidth, sourceHeight));
    const targetWidth = Math.max(1, Math.round(sourceWidth * scale));
    const targetHeight = Math.max(1, Math.round(sourceHeight * scale));
    let current = source;
    let currentWidth = sourceWidth;
    let currentHeight = sourceHeight;
    while (currentWidth / 2 > targetWidth) {
      const nextWidth = Math.max(targetWidth, Math.round(currentWidth / 2));
      const nextHeight = Math.max(targetHeight, Math.round(currentHeight / 2));
      const canvas = makeCanvas(nextWidth, nextHeight);
      const ctx = context2d(canvas);
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(current, 0, 0, currentWidth, currentHeight, 0, 0, nextWidth, nextHeight);
      if (current !== source) current.width = 0;
      current = canvas;
      currentWidth = nextWidth;
      currentHeight = nextHeight;
    }
    const output = makeCanvas(targetWidth, targetHeight);
    const ctx = context2d(output, true);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(current, 0, 0, currentWidth, currentHeight, 0, 0, targetWidth, targetHeight);
    if (current !== source) current.width = 0;
    const data = ctx.getImageData(0, 0, targetWidth, targetHeight);
    return { canvas: output, data, scale: targetWidth / sourceWidth };
  }

  // A full-resolution region of the photo (for refinement), at most maxPx pixels in total.
  // box: { left, top, right, bottom } in source px. Returns an ImageData-like object plus
  // { originX, originY, scale } (region px = (source − origin) · scale), or null if tiny.
  function readRegion(box, maxPx) {
    const img = app.img;
    const left = Math.max(0, Math.floor(box.left));
    const top = Math.max(0, Math.floor(box.top));
    const right = Math.min(img.width, Math.ceil(box.right));
    const bottom = Math.min(img.height, Math.ceil(box.bottom));
    const width = right - left;
    const height = bottom - top;
    if (width < 8 || height < 8) return null;
    const scale = Math.min(1, Math.sqrt(maxPx / (width * height)));
    const regionWidth = Math.max(1, Math.round(width * scale));
    const regionHeight = Math.max(1, Math.round(height * scale));
    const canvas = makeCanvas(regionWidth, regionHeight);
    const ctx = context2d(canvas, true);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img.el, left, top, width, height, 0, 0, regionWidth, regionHeight);
    const pixels = ctx.getImageData(0, 0, regionWidth, regionHeight);
    canvas.width = 0;
    return {
      data: pixels.data,
      width: regionWidth,
      height: regionHeight,
      originX: left,
      originY: top,
      scale: regionWidth / width,
    };
  }

  /* =====================================================================
     DETECTION: Detector.detect(imageData, options) → [{ corners, confidence, … }]
     Corners are in source pixels. Phase two: Apple Vision / ML Kit return the same shape.
     ===================================================================== */

  // Appended to the engine's source to make the worker: runs one engine call per message.
  const WORKER_GLUE = `
;self.onmessage = function (event) {
  var message = event.data;
  var payload = message.payload;
  var result;
  try {
    if (message.type === 'detect') {
      result = CardEngine.detect(payload.image, payload.options);
    } else if (message.type === 'refine') {
      result = CardEngine.refineQuad(payload.roi, payload.corners, payload.options);
    } else if (message.type === 'selftest') {
      result = CardEngine.selfTest();
    } else {
      throw new Error('Unknown message ' + message.type);
    }
    self.postMessage({ id: message.id, result: result });
  } catch (error) {
    self.postMessage({ id: message.id, error: String(error && error.stack || error) });
  }
};`;

  // Runs engine calls in a Web Worker, or on the main thread if the worker can't start.
  const EngineWorker = {
    worker: null,
    failed: false,
    lastId: 0,
    pending: new Map(),

    init() {
      try {
        // Built from the engine's source text, not loaded by URL: Chrome blocks file-based
        // workers from file://.
        const source = '(' + CardEngineModule.toString() + ')(self);' + WORKER_GLUE;
        const url = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
        this.worker = new Worker(url);
        this.worker.onmessage = event => {
          const call = this.pending.get(event.data.id);
          if (!call) return;
          this.pending.delete(event.data.id);
          if (event.data.error) call.reject(new Error(event.data.error));
          else call.resolve(event.data.result);
        };
        this.worker.onerror = event => {
          if (event.preventDefault) event.preventDefault();
          this.fail('worker error');
        };
      } catch (error) {
        this.fail(error.message);
      }
    },

    fail(reason) {
      if (!this.failed) {
        console.warn('[card-finisher] Web Worker unavailable, running on main thread:', reason);
      }
      this.failed = true;
      for (const call of this.pending.values()) call.reject(new Error('worker failed'));
      this.pending.clear();
    },

    // The same calls on the main thread.
    local(type, payload) {
      if (type === 'detect') return CardEngine.detect(payload.image, payload.options);
      if (type === 'refine') {
        return CardEngine.refineQuad(payload.roi, payload.corners, payload.options);
      }
      if (type === 'selftest') return CardEngine.selfTest();
      return undefined;
    },

    call(type, payload) {
      if (!this.worker || this.failed) {
        return new Promise(resolve => setTimeout(() => resolve(this.local(type, payload)), 0));
      }
      const id = ++this.lastId;
      const reply = new Promise((resolve, reject) => {
        this.pending.set(id, { resolve, reject });
        this.worker.postMessage({ id, type, payload });
      });
      return reply.catch(error => {
        if (this.failed) return this.local(type, payload);
        throw error;
      });
    },
  };

  // The number and on/off settings of CONFIG.detect, for the engine.
  function detectParams() {
    const params = {};
    for (const [key, value] of Object.entries(CONFIG.detect)) {
      if (typeof value === 'number' || typeof value === 'boolean') params[key] = value;
    }
    return params;
  }

  const JSDetector = {
    name: 'js',
    // The last run's lines, debug data and timing, with workingScale (working px per source px).
    last: null,

    // options: { sourceWidth, ratio, seed (source px), debug, quads, getRegion (for refinement) }.
    async detect(imageData, options) {
      const workingScale = imageData.width / options.sourceWidth;
      const toWorking = point => [point[0] * workingScale, point[1] * workingScale];
      const seed = options.seed ? toWorking(options.seed) : null;
      const result = await EngineWorker.call('detect', {
        image: imageData,
        options: {
          ratio: options.ratio,
          seed,
          params: detectParams(),
          debug: !!options.debug,
          quads: options.quads,
        },
      });
      const searchPx = CONFIG.detect.refineSearchWorkingPx / workingScale;
      const toSource = point => [point[0] / workingScale, point[1] / workingScale];
      const candidates = [];
      for (const candidate of result.candidates) {
        let corners = candidate.corners.map(toSource);
        let refined = null;
        if (options.getRegion && CONFIG.detect.refine) {
          const box = Quad.boundingBox(corners);
          const margin = searchPx * 3;
          const region = {
            left: box.left - margin,
            top: box.top - margin,
            right: box.right + margin,
            bottom: box.bottom + margin,
          };
          const roi = options.getRegion(region, CONFIG.detect.refineMaxPx);
          if (roi) {
            const refinement = await EngineWorker.call('refine', {
              roi,
              corners,
              options: { params: detectParams(), searchPx },
            });
            corners = refinement.corners;
            refined = refinement.refined;
          }
        }
        candidates.push({
          corners,
          confidence: candidate.confidence,
          score: candidate.score,
          parts: candidate.parts,
          refined,
        });
      }
      JSDetector.last = {
        workingScale,
        lines: result.lines,
        debug: result.debug || null,
        timing: result.timing,
      };
      return candidates;
    },
  };

  // The swap point for native detection (Apple Vision / ML Kit) in phase two; today it's the
  // JS engine.
  const Detector = {
    detect(imageData, options) {
      return JSDetector.detect(imageData, options);
    },
  };

  /* ---------- preferences (localStorage, best-effort) ---------- */
  const Prefs = {
    load() {
      try {
        return JSON.parse(localStorage.getItem(CONFIG.storageKey)) || {};
      } catch (error) {
        return {};
      }
    },

    save() {
      if (!app.state) return;
      const { crop, export: exportState } = app.state;
      const prefs = {
        cropPreset: crop.preset,
        export: {
          format: exportState.format,
          quality: exportState.quality,
          longEdge: exportState.longEdge,
          interp: exportState.interp,
          fill: exportState.fill,
        },
      };
      try {
        localStorage.setItem(CONFIG.storageKey, JSON.stringify(prefs));
      } catch (error) { /* private mode or quota: ignore */ }
    },
  };

  /* ---------- session restore (IndexedDB, best-effort) ----------
     Records: 'photo' (the original file's bytes, written once per photo), 'edits' (the edit
     state, Levels draft and step, rewritten shortly after every change), 'overlay' (the saved
     logo) and 'photoOverlay' (the current photo's logo, for Resume). */
  const Session = {
    database: null,
    timer: 0,
    photoId: 0,

    get enabled() {
      return CONFIG.session.enabled && typeof indexedDB !== 'undefined';
    },

    open() {
      if (!this.database) {
        this.database = new Promise((resolve, reject) => {
          const request = indexedDB.open(CONFIG.session.dbName, 1);
          request.onupgradeneeded = () => request.result.createObjectStore('session');
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
      }
      return this.database;
    },

    // Runs `work(store)` in one transaction; resolves with the result of the request it returns.
    async transaction(mode, work) {
      const database = await this.open();
      return new Promise((resolve, reject) => {
        const transaction = database.transaction('session', mode);
        const request = work(transaction.objectStore('session'));
        transaction.oncomplete = () => resolve(request && request.result);
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error);
      });
    },

    snapshot() {
      return {
        name: app.img.name,
        width: app.img.width,
        height: app.img.height,
        state: clone(app.state),
        draft: app.levelsPending ? clone(app.levelsDraft) : null,
        tab: app.tab,
        savedAt: Date.now(),
      };
    },

    // Called once per newly opened photo; `id` guards against a slow read finishing after
    // another photo opened.
    async savePhoto(file, id) {
      if (!this.enabled) return;
      try {
        const bytes = await file.arrayBuffer();
        if (id !== app.loadId || !app.img) return;
        await this.transaction('readwrite', store => {
          store.put({ buf: bytes, type: file.type, name: app.img.name }, 'photo');
          return store.put(this.snapshot(), 'edits');
        });
        this.photoId = id;
      } catch (error) {
        console.warn('[card-finisher] session photo not saved:', error);
      }
    },

    saveSoon() {
      if (!this.enabled || !app.img || this.photoId !== app.loadId) return;
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this.flush(), CONFIG.session.saveDelayMs);
    },

    flush() {
      clearTimeout(this.timer);
      if (!this.enabled || !app.img || !app.state || this.photoId !== app.loadId) return;
      this.transaction('readwrite', store => store.put(this.snapshot(), 'edits'))
        .catch(error => console.warn('[card-finisher] session edits not saved:', error));
    },

    // The saved edits if a whole session (edits and photo) is stored, else null.
    async peek() {
      if (!this.enabled) return null;
      try {
        const [edits, photoCount] = await Promise.all([
          this.transaction('readonly', store => store.get('edits')),
          this.transaction('readonly', store => store.count('photo')),
        ]);
        return edits && photoCount ? edits : null;
      } catch (error) {
        return null;
      }
    },

    loadPhoto() {
      return this.transaction('readonly', store => store.get('photo'));
    },

    // Start fresh clears the photo session only; the saved overlay ('overlay') survives it.
    clear() {
      this.photoId = 0;
      if (!this.enabled) return Promise.resolve();
      return this.transaction('readwrite', store => {
        store.delete('photo');
        store.delete('photoOverlay');
        return store.delete('edits');
      }).catch(() => {});
    },

    get(key) {
      if (!this.enabled) return Promise.reject(new Error('storage unavailable'));
      return this.transaction('readonly', store => store.get(key));
    },

    put(key, value) {
      if (!this.enabled) return Promise.reject(new Error('storage unavailable'));
      return this.transaction('readwrite', store => store.put(value, key));
    },

    del(key) {
      if (!this.enabled) return Promise.resolve();
      return this.transaction('readwrite', store => store.delete(key));
    },
  };

  Object.assign(CF, {
    ImageSource,
    scaledCopy,
    readRegion,
    EngineWorker,
    JSDetector,
    Detector,
    Prefs,
    Session,
  });
})(window.CF);
