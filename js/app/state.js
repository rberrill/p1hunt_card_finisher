/* =====================================================================
   js/app/state.js: edit-state defaults, undo / redo history, crop orientation, stateChanged,
   opening photos (with resume) and detection.
   Shell modules share one namespace, CF (created in core.js). Names from core are
   destructured below; anything from another module is called as CF.name.
   tests/selftest.js checks these boundaries.
   ===================================================================== */
(function (CF) {
  'use strict';
  const { Quad, elements, clone, nextFrame, app, geometryConfig, toast, hideToast } = CF;

  // Repeats of the same control within this time are one undo step (slider drags, key nudges).
  const COALESCE_MS = 900;

  /* ---------- state helpers ---------- */
  function cardAspect(orientation) {
    return { ratio: CONFIG.card.w / CONFIG.card.h, orientation: orientation || 'auto' };
  }

  // The width ÷ height of a crop preset, or null (free) / 'original'.
  function presetRatio(id) {
    const preset = CONFIG.crop.presets.find(candidate => candidate.id === id);
    return preset ? preset.ratio : null;
  }

  // Fallback corners when detection finds nothing: a centered rectangle inset defaultInsetPct.
  function insetCorners(width, height) {
    const inset = CONFIG.defaultInsetPct / 100;
    return [
      [width * inset, height * inset],
      [width * (1 - inset), height * inset],
      [width * (1 - inset), height * (1 - inset)],
      [width * inset, height * (1 - inset)],
    ];
  }

  // Export settings: remembered prefs where set, else CONFIG.
  function exportDefaults(prefs) {
    const defaults = CONFIG.export;
    const remembered = (prefs && prefs.export) || {};
    return {
      format: remembered.format || defaults.format,
      quality: remembered.quality != null ? remembered.quality : defaults.quality,
      longEdge: remembered.longEdge != null ? remembered.longEdge : defaults.longEdge,
      interp: remembered.interp || defaults.interp,
      fill: remembered.fill || defaults.fill,
    };
  }

  function cropDefaults(prefs) {
    const id = (prefs && prefs.cropPreset) || CONFIG.crop.defaultPreset;
    return {
      mode: 'fit',
      preset: id,
      ratio: presetRatio(id),
      swapped: false,
      orient: null,
      rect: null,
    };
  }

  // A fresh state for this photo. Remembered prefs come from storage, so they're checked like
  // an edits file.
  function newState(img) {
    const prefs = CF.Prefs.load();
    return cleanState(defaultState(img, prefs), img).state;
  }

  // Rebuilds untrusted state (edits file, stored session, prefs) on top of this photo's
  // defaults → { state, invalid, fields } (CardEngine.sanitizeState).
  function cleanState(input, img) {
    const options = {
      presetIds: CONFIG.crop.presets.map(preset => preset.id),
      maxPx: CONFIG.maxOutputPx,
    };
    return CardEngine.sanitizeState(input, defaultState(img, {}), options);
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
      // Logo placement (Overlay step); the image itself lives outside the state.
      overlay: null,
      export: exportDefaults(prefs),
    };
  }

  /* ---------- history: undo and redo store snapshots of the edit state ---------- */
  const History = {
    undo: [],
    redo: [],
    lastKey: null,
    lastTime: 0,

    reset() {
      this.undo = [];
      this.redo = [];
      this.lastKey = null;
    },

    // Records the state from before a change. `key` names the control, so rapid repeats of
    // the same one coalesce into a single step.
    push(snapshot, key) {
      const time = performance.now();
      if (key && key === this.lastKey && time - this.lastTime < COALESCE_MS) {
        this.lastTime = time;
        this.redo = [];
        return;
      }
      this.undo.push(snapshot);
      if (this.undo.length > CONFIG.historyLimit) this.undo.shift();
      this.redo = [];
      this.lastKey = key || null;
      this.lastTime = time;
    },
  };

  // Changes the state through `mutator(state)` as one undo step (nothing if it changed nothing).
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

  function undo() {
    if (!History.undo.length) return;
    History.redo.push(clone(app.state));
    app.state = History.undo.pop();
    History.lastKey = null;
    stateChanged();
  }

  function redo() {
    if (!History.redo.length) return;
    History.undo.push(clone(app.state));
    app.state = History.redo.pop();
    History.lastKey = null;
    stateChanged();
  }

  /* ---------- crop orientation ----------
     It follows the card as it ends up after Perspective and Rotate, unless Swap chose one
     (crop.orient). The card's position doesn't depend on the crop, so aligning after computing
     geometry is safe; geometry is recomputed only if the crop changed. */

  // The crop ratio before any swap.
  function cropBaseRatio(state) {
    if (state.crop.ratio === 'original') return state.source.width / state.source.height;
    return state.crop.ratio;
  }

  // 'landscape' or 'portrait' for the card in the rotated frame, or null without geometry.
  function cardOrient(geometry) {
    if (!geometry || !geometry.ok) return null;
    const box = Quad.boundingBox(geometry.cardRotated);
    return box.width > box.height ? 'landscape' : 'portrait';
  }

  // The crop orientation in use: Swap's choice, else the card's, else the ratio's own.
  function cropOrient(state, geometry) {
    const chosen = state.crop.orient || cardOrient(geometry);
    if (chosen) return chosen;
    const ratio = cropBaseRatio(state);
    const swappedRatio = state.crop.swapped ? 1 / ratio : ratio;
    return ratio && swappedRatio < 1 ? 'portrait' : 'landscape';
  }

  // Sets crop.swapped so the crop's orientation matches cropOrient. Returns true if it changed.
  function alignCrop(state, geometry) {
    const ratio = cropBaseRatio(state);
    if (!ratio || ratio === 1) {
      const wasSwapped = !!state.crop.swapped;
      state.crop.swapped = false;
      return wasSwapped;
    }
    const wanted = state.crop.orient || cardOrient(geometry);
    if (!wanted) return false;
    const shouldSwap = (ratio > 1) !== (wanted === 'landscape');
    if (shouldSwap === !!state.crop.swapped) return false;
    state.crop.swapped = shouldSwap;
    if (state.crop.mode === 'manual' && state.crop.rect) {
      const rect = state.crop.rect;
      state.crop.rect = { cx: rect.cx, cy: rect.cy, w: rect.h, h: rect.w };
    }
    return true;
  }

  // A preset's label for the orientation in use: 5:4 ↔ 4:5, 16:9 ↔ 9:16, "5:7 card" ↔ "7:5 card".
  function cropLabel(preset, orient) {
    const match = /^(\d+):(\d+)/.exec(preset.id);
    if (!match || match[1] === match[2]) return preset.label;
    const larger = Math.max(+match[1], +match[2]);
    const smaller = Math.min(+match[1], +match[2]);
    const ratio = orient === 'portrait' ? `${smaller}:${larger}` : `${larger}:${smaller}`;
    return ratio + preset.label.slice(preset.id.length);
  }

  // After every committed change: geometry, crop alignment, saving, and a redraw.
  function stateChanged() {
    app.geometry = app.state ? CardEngine.computeGeometry(app.state, geometryConfig()) : null;
    if (app.state && alignCrop(app.state, app.geometry)) {
      app.geometry = CardEngine.computeGeometry(app.state, geometryConfig());
    }
    // Refit lazily.
    if (app.views.result && app.views.result.auto) app.views.result = null;
    app.views.export = null;
    // An export waiting for a second tap no longer matches the edits.
    app.pendingSave = null;
    CF.Prefs.save();
    CF.Session.saveSoon();
    CF.overlayStateChanged();
    CF.syncUI();
    CF.requestRender();
    CF.requestMini();
  }

  // The light-weight update during drags: geometry only, no prefs or panel rebuild.
  function liveChanged() {
    app.geometry = CardEngine.computeGeometry(app.state, geometryConfig());
    CF.syncReadouts();
    CF.requestRender();
    CF.requestMini();
  }

  /* ---------- loading ---------- */

  // The downscaled copies a photo needs: the preview, the mini-preview thumbnail and the
  // detection working image. Each gets `scale` = its px per source px.
  function makeCopies(img) {
    const longSide = Math.max(img.width, img.height);
    app.preview = CF.scaledCopy(img.el, img.width, img.height, CONFIG.previewMaxPx);
    const previewCanvas = app.preview.canvas;
    const copyOfPreview = maxPx => (
      CF.scaledCopy(previewCanvas, previewCanvas.width, previewCanvas.height, maxPx)
    );
    const thumbScale = Math.min(1, CONFIG.thumbMaxPx / longSide);
    app.thumb = copyOfPreview(longSide * thumbScale);
    app.thumb.scale = app.thumb.data.width / img.width;
    const workScale = Math.min(1, CONFIG.detect.workingSize / longSide);
    app.work = copyOfPreview(longSide * workScale);
    app.work.scale = app.work.data.width / img.width;
  }

  // Clears everything that belonged to the previous photo.
  function resetPhotoState() {
    History.reset();
    app.views = { source: null, result: null, export: null };
    app.detection = {
      candidates: [],
      index: 0,
      last: null,
      running: 0,
      message: '',
      snapPoints: [],
      snapLines: [],
    };
    app.findMode = false;
    app.perspectivePreview = null;
    app.edgeCanvas = null;
    app.selected = 0;
    app.levelsPending = false;
    app.levelsDraft = null;
    app.perspectivePreviewLevels = null;
    app.dropper = null;
    app.compare = false;
    app.previewMode = false;
    app.exportedState = null;
  }

  // Reapplies a resumed session's unapplied Levels draft.
  function restoreLevelsDraft(restore, img) {
    if (!restore.draft) return;
    const draft = cleanState({ levels: restore.draft }, img);
    if (draft.invalid.length || !draft.state.levels) return;
    app.levelsDraft = draft.state.levels;
    app.levelsPending = JSON.stringify(restore.draft) !== JSON.stringify(app.state.levels || null);
  }

  // Opens a photo. restore: a saved session record ({ state, draft, tab, exported, width,
  // height }) to reapply instead of starting fresh; it's used only if the photo's size matches.
  async function openFile(file, name, restore) {
    const startTime = performance.now();
    const id = ++app.loadId;
    toast('Loading…');
    let img;
    try {
      img = await CF.ImageSource.load(file, name);
    } catch (error) {
      toast(error.message, 'error', 6000);
      return;
    }
    // Another photo was opened meanwhile.
    if (id !== app.loadId) {
      img.close();
      return;
    }
    if (app.img) app.img.close();
    app.img = img;
    makeCopies(img);
    app.state = newState(img);
    const resumed = !!(restore
      && restore.state
      && restore.width === img.width
      && restore.height === img.height);
    if (resumed) {
      app.state = cleanState(restore.state, img).state;
      app.state.source.name = img.name;
    }
    resetPhotoState();
    if (resumed) restoreLevelsDraft(restore, img);
    // The stored record is untrusted: only a literal true counts.
    if (resumed && restore.exported === true) app.exportedState = JSON.stringify(app.state);
    elements.empty.hidden = true;
    // A resumed photo is already stored.
    if (resumed) CF.Session.photoId = id;
    else CF.Session.savePhoto(file, id);
    stateChanged();
    CF.setTab(resumed && CF.STEPS[restore.tab] ? restore.tab : 'perspective');
    await nextFrame();
    const durationMs = performance.now() - startTime;
    const size = `${img.width}×${img.height}`;
    const took = `${durationMs.toFixed(0)} ms`;
    console.info(`[card-finisher] ${img.name}: ${size} loaded + previewed in ${took}`);
    app.loadDurationMs = durationMs;
    hideToast();
    if (resumed) {
      toast('Resumed where you left off.');
      CF.ensureOverlayImage();
    }
    runDetect({ auto: true, keepCorners: resumed });
  }

  /* ---------- detection ---------- */

  // Finds card candidates and moves the corners to the best one. auto: without an undo step
  // (on open). keepCorners: find candidates (for Candidate n/3 and snapping) without moving
  // the corners (session resume). seed: a source-px point the card should contain (Find card);
  // it's used for this run only.
  async function runDetect({ auto = false, keepCorners = false, seed = null } = {}) {
    if (!app.img) return;
    const run = ++app.detection.running;
    const startTime = performance.now();
    app.detection.message = 'Detecting…';
    CF.syncUI();
    try {
      const candidates = await CF.Detector.detect(app.work.data, {
        ratio: CONFIG.card.w / CONFIG.card.h,
        seed,
        sourceWidth: app.img.width,
        sourceHeight: app.img.height,
        getRegion: CF.readRegion,
        debug: app.debugOverlay || CONFIG.debug,
      });
      // A newer run has started.
      if (run !== app.detection.running) return;
      const last = CF.JSDetector.last;
      app.detection.candidates = candidates;
      app.detection.index = 0;
      app.detection.last = last;
      app.detection.durationMs = performance.now() - startTime;
      buildSnapTargets(last);
      app.edgeCanvas = null;
      const bestCorners = () => candidates[0].corners.map(point => point.slice());
      if (!candidates.length) {
        if (!auto) {
          const message = 'No card-shaped edges found. '
            + 'Drag the corners into place, or tap to find card and tap the card again.';
          toast(message, 'warn', 5000);
        }
      } else if (keepCorners) {
        // Leave the resumed corners alone.
      } else if (auto) {
        app.state.corners = bestCorners();
        stateChanged();
      } else {
        commit(state => {
          state.corners = bestCorners();
        });
      }
      app.detection.message = '';
      if (CONFIG.debug) console.info('[card-finisher] detect', last && last.timing, candidates);
    } catch (error) {
      console.error(error);
      app.detection.message = '';
      toast('Detection failed: ' + error.message, 'error');
    }
    CF.syncUI();
    CF.requestRender();
    CF.updateDebugPanel();
  }

  // Find card: disarms it, then finds the card containing `point` (source px, where the photo
  // was tapped). The corners move as one undo step.
  function findCardAt(point) {
    app.findMode = false;
    return runDetect({ seed: point });
  }

  function useCandidate(index) {
    const candidate = app.detection.candidates[index];
    if (!candidate) return;
    app.detection.index = index;
    commit(state => {
      state.corners = candidate.corners.map(point => point.slice());
    });
  }

  // Snap targets for corner dragging: the detected lines and their near-perpendicular crossings.
  function buildSnapTargets(last) {
    app.detection.snapLines = [];
    app.detection.snapPoints = [];
    if (!last || !last.lines) return;
    // Lines come back in working px: normal · point = offset → in source px: offset ÷ scale.
    const lines = last.lines.map(line => ({
      normalX: line.normalX,
      normalY: line.normalY,
      offset: line.offset / last.workingScale,
    }));
    app.detection.snapLines = lines;
    const width = app.img.width;
    const height = app.img.height;
    const isNearPhoto = point => point
      && point[0] > -width * 0.02
      && point[1] > -height * 0.02
      && point[0] < width * 1.02
      && point[1] < height * 1.02;
    for (let i = 0; i < lines.length; i++) {
      for (let j = i + 1; j < lines.length; j++) {
        const first = lines[i];
        const second = lines[j];
        const dot = Math.abs(first.normalX * second.normalX + first.normalY * second.normalY);
        // Only near-perpendicular pairs make corners.
        if (dot > 0.5) continue;
        const crossing = CardEngine.intersectLines(lines[i], lines[j]);
        if (isNearPhoto(crossing)) app.detection.snapPoints.push(crossing);
      }
    }
  }

  Object.assign(CF, {
    cardAspect,
    presetRatio,
    insetCorners,
    cropDefaults,
    cleanState,
    History,
    commit,
    commitFrom,
    undo,
    redo,
    cardOrient,
    cropOrient,
    alignCrop,
    cropLabel,
    stateChanged,
    liveChanged,
    openFile,
    runDetect,
    findCardAt,
    useCandidate,
  });
})(window.CF);
