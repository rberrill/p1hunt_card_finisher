/* =====================================================================
   js/app/levels.js: Levels. The draft and Apply / Discard, Auto, the dropper, compare, and
   the Levels overlays.
   Shell modules share one namespace, CF (created in core.js). Names from core are
   destructured below; anything from another module is called as CF.name.
   tests/selftest.js checks these boundaries.
   ===================================================================== */
(function (CF) {
  'use strict';
  const {
    FULL_CIRCLE,
    Mat3,
    Vec2,
    elements,
    clone,
    makeCanvas,
    context2d,
    app,
    geometryConfig,
    toast,
  } = CF;

  // A white pick must be at least this much brighter than the black point, and vice versa.
  const MIN_LUMA_GAP = 20;

  /* ---------- the draft and Apply ----------
     Picks and Auto edit a draft that only the Levels step shows. Apply commits it to the edit
     state (one undo step); every other step and the export use the applied levels. */
  const draftLevels = () => (app.levelsPending ? app.levelsDraft : (app.state.levels || null));

  // The levels the photo shows now: the draft on the Levels step (none while comparing), else
  // the applied ones.
  function levelsShown() {
    if (app.tab !== 'levels') return app.state.levels || null;
    return app.compare ? null : draftLevels();
  }

  // Brightness of an sRGB color (Rec. 709 weights).
  const luma = color => 0.2126 * color[0] + 0.7152 * color[1] + 0.0722 * color[2];

  // Changes the draft through `mutator(draft)`; it's pending while it differs from the applied.
  function setDraft(mutator) {
    const draft = clone(draftLevels() || { white: null, black: null });
    mutator(draft);
    app.levelsDraft = draft.white || draft.black ? draft : null;
    const applied = JSON.stringify(app.state.levels || null);
    app.levelsPending = JSON.stringify(app.levelsDraft) !== applied;
    CF.syncUI();
    CF.requestRender();
    CF.Session.saveSoon();
  }

  function applyLevels() {
    if (!app.levelsPending) return;
    const draft = app.levelsDraft;
    app.levelsPending = false;
    app.levelsDraft = null;
    CF.commit(state => {
      state.levels = draft ? clone(draft) : null;
    });
  }

  function discardLevels() {
    app.levelsPending = false;
    app.levelsDraft = null;
    CF.syncUI();
    CF.requestRender();
    CF.Session.saveSoon();
  }

  // A small render of the current framing (no levels) from the preview copy, for Auto.
  function renderSmall(maxPx) {
    const state = clone(app.state);
    state.export.longEdge = maxPx;
    state.levels = null;
    const geometry = CardEngine.computeGeometry(state, geometryConfig());
    if (!geometry.ok) return null;
    const pixels = new ImageData(geometry.output.width, geometry.output.height);
    const outputToPreview = Mat3.multiply(Mat3.scale(app.preview.scale), geometry.outputToSource);
    return CardEngine.warp(pixels, app.preview.data, outputToPreview, { fill: [0, 0, 0, 0] });
  }

  function autoLevelsDraft() {
    const img = renderSmall(CONFIG.levels.autoSamplePx);
    const found = img && CardEngine.autoLevels(img, CONFIG.levels);
    if (!found) {
      toast('Couldn’t estimate levels from this image.', 'warn');
      return;
    }
    setDraft(draft => {
      draft.white = found.white;
      draft.black = found.black;
      draft.whiteAt = null;
      draft.blackAt = null;
    });
    toast(found.black
      ? 'Auto set white and black points. Check them, then Apply.'
      : 'Auto set the white point (no clear black). Check it, then Apply.');
  }

  // Why a picked color can't be the `which` point, or '' if it can.
  function pickProblem(which, color, draft) {
    if (which === 'white' && draft.black && luma(color) <= luma(draft.black) + MIN_LUMA_GAP) {
      return 'That spot is darker than the black point. Pick something brighter.';
    }
    if (which === 'black' && luma(color) > CONFIG.levels.maxBlackLuma) {
      return 'That spot is too light to be a black point. '
        + 'Pick something dark, or skip the black point.';
    }
    if (which === 'black' && draft.white && luma(color) >= luma(draft.white) - MIN_LUMA_GAP) {
      return 'That spot is brighter than the white point. Pick something darker.';
    }
    return '';
  }

  // The dropper: averages a patch of the full-resolution photo under the pick point.
  function pickAt(screenPoint) {
    const which = app.dropper;
    const view = CF.currentView();
    const geometry = app.geometry;
    app.dropper = null;
    if (!which || !view || !geometry || !geometry.ok) {
      CF.syncUI();
      return;
    }
    const rotatedToSource = Mat3.invert(geometry.sourceToRotated);
    const world = CF.toWorld(view, screenPoint);
    const point = Mat3.apply(rotatedToSource, world[0], world[1]);
    const radiusWorld = CONFIG.levels.sampleRadiusPx / view.zoom;
    const edge = Mat3.apply(rotatedToSource, world[0] + radiusWorld, world[1]);
    const isOnPhoto = point[0] >= 0
      && point[1] >= 0
      && point[0] < app.img.width
      && point[1] < app.img.height;
    if (!isOnPhoto) {
      toast('That spot is outside the photo.', 'warn');
      CF.syncUI();
      return;
    }
    const radius = Math.max(4, Vec2.distance(point, edge));
    const region = {
      left: point[0] - radius,
      top: point[1] - radius,
      right: point[0] + radius,
      bottom: point[1] + radius,
    };
    const roi = CF.readRegion(region, 1e6);
    const color = roi && CardEngine.meanColor(roi, CONFIG.levels.sampleTrim);
    if (!color) {
      CF.syncUI();
      return;
    }
    const problem = pickProblem(which, color, draftLevels() || {});
    if (problem) {
      toast(problem, 'warn');
      CF.syncUI();
      return;
    }
    setDraft(draft => {
      draft[which] = color;
      draft[which + 'At'] = [Math.round(point[0]), Math.round(point[1])];
    });
  }

  function setCompare(isOn) {
    if (app.compare === isOn) return;
    app.compare = isOn;
    CF.requestRender();
  }

  // The perspective preview with a levels LUT applied, cached per (preview, levels).
  function previewCanvas(levels) {
    const preview = CF.ensurePerspectivePreview();
    const lut = CardEngine.levelsLut(levels, CONFIG.levels);
    if (!lut) return preview.canvas;
    const key = preview.key + JSON.stringify([levels.white, levels.black]);
    const cached = app.perspectivePreviewLevels;
    if (cached && cached.key === key) return cached.canvas;
    const source = preview.data;
    const pixels = new ImageData(new Uint8ClampedArray(source.data), source.width, source.height);
    CardEngine.applyLut(pixels, lut);
    const canReuse = cached
      && cached.canvas.width === pixels.width
      && cached.canvas.height === pixels.height;
    const canvas = canReuse ? cached.canvas : makeCanvas(pixels.width, pixels.height);
    context2d(canvas).putImageData(pixels, 0, 0);
    app.perspectivePreviewLevels = { key, canvas };
    return canvas;
  }

  // A pick marker: a black and white ring labelled W or B.
  function drawPickMarker(ctx, point, label) {
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#000';
    ctx.beginPath();
    ctx.arc(point[0], point[1], 9, 0, FULL_CIRCLE);
    ctx.stroke();
    ctx.strokeStyle = '#fff';
    ctx.beginPath();
    ctx.arc(point[0], point[1], 7, 0, FULL_CIRCLE);
    ctx.stroke();
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#fff';
    ctx.fillText(label, point[0] + 11, point[1] - 9);
  }

  // The "Before levels" badge while comparing.
  function drawCompareBadge(ctx) {
    const text = 'Before levels';
    ctx.font = '600 13px system-ui, sans-serif';
    ctx.textAlign = 'left';
    const width = ctx.measureText(text).width + 20;
    ctx.fillStyle = 'rgba(0,0,0,.7)';
    ctx.fillRect(12, 12, width, 28);
    ctx.fillStyle = '#fff';
    ctx.fillText(text, 22, 31);
  }

  // The Levels step's overlays: the pick markers, the compare badge and the dropper loupe.
  function drawLevelsOverlay(ctx, view) {
    const draft = draftLevels();
    if (draft && !app.compare) {
      for (const [key, label] of [['whiteAt', 'W'], ['blackAt', 'B']]) {
        if (!draft[key]) continue;
        const rotated = Mat3.apply(app.geometry.sourceToRotated, draft[key][0], draft[key][1]);
        drawPickMarker(ctx, CF.toScreen(view, rotated), label);
      }
    }
    if (app.compare) drawCompareBadge(ctx);
    const gesture = app.gesture;
    if (gesture && gesture.type === 'dropper') drawScreenLoupe(ctx, gesture);
  }

  // The dropper loupe: magnifies what's on screen (so it shows the current levels) with the
  // sample circle.
  function drawScreenLoupe(ctx, gesture) {
    const radius = CF.loupeRadius();
    const zoom = CONFIG.loupeZoom;
    const ratio = app.devicePixelRatio;
    const pointer = gesture.last;
    const [centerX, centerY] = CF.loupeCenter(gesture, radius);
    const sourceHalf = radius / zoom;
    const sampleRadius = CONFIG.levels.sampleRadiusPx * zoom;
    ctx.save();
    CF.setScreen(ctx);
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, FULL_CIRCLE);
    ctx.clip();
    ctx.fillStyle = '#000';
    ctx.fillRect(centerX - radius, centerY - radius, 2 * radius, 2 * radius);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      elements.canvas,
      (pointer[0] - sourceHalf) * ratio,
      (pointer[1] - sourceHalf) * ratio,
      2 * sourceHalf * ratio,
      2 * sourceHalf * ratio,
      centerX - radius, centerY - radius, 2 * radius, 2 * radius,
    );
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#000';
    ctx.beginPath();
    ctx.arc(centerX, centerY, sampleRadius + 1.5, 0, FULL_CIRCLE);
    ctx.stroke();
    ctx.strokeStyle = '#fff';
    ctx.beginPath();
    ctx.arc(centerX, centerY, sampleRadius, 0, FULL_CIRCLE);
    ctx.stroke();
    ctx.restore();
    CF.drawLoupeRim(ctx, centerX, centerY, radius);
  }

  Object.assign(CF, {
    draftLevels,
    levelsShown,
    setDraft,
    applyLevels,
    discardLevels,
    autoLevelsDraft,
    pickAt,
    setCompare,
    previewCanvas,
    drawLevelsOverlay,
  });
})(window.CF);
