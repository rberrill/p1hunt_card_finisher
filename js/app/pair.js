/* =====================================================================
   js/app/pair.js: front + back pairs. Add back keeps the front and opens the back; the header's
   Front | Back chip switches sides and ⨯ unpairs; while paired, both sides are locked to the 5:7
   crop with one orientation and share their export settings. Export saves the pair Together
   (one joined image) or Separately (two files), and shows the Together image beforehand.
   The open side lives in app.* as any photo does. The other side waits in app.pair.other with
   its edits, undo history, preview copies and original bytes; its full-resolution photo is
   decoded again only when it's needed, so a phone holds one full-resolution photo at a time.
   Shell modules share one namespace, CF (created in core.js). Names from core are
   destructured below; anything from another module is called as CF.name.
   tests/selftest.js checks these boundaries.
   ===================================================================== */
(function (CF) {
  'use strict';
  const {
    Mat3,
    byId,
    elements,
    clone,
    shortText,
    makeCanvas,
    context2d,
    app,
    geometryConfig,
    toast,
    hideToast,
  } = CF;

  const SIDES = ['front', 'back'];
  const ORIENTS = ['portrait', 'landscape'];
  const PAIR_OUTPUTS = ['together', 'separately'];
  // The crop preset both sides are locked to while paired.
  const PAIR_PRESET = '5:7';
  // Two downloads in a row need a short gap, or a browser may drop the second.
  const PAIR_DOWNLOAD_GAP_MS = 250;
  // A pair's manual crop whose aspect is further than this from 5:7 (as a fraction) goes back
  // to fit, since it was drawn for another preset.
  const ASPECT_TOLERANCE = 0.01;
  // Everything a side keeps in app.* while it's open.
  const SIDE_FIELDS = [
    'file',
    'preview',
    'thumb',
    'work',
    'state',
    'tab',
    'detection',
    'levelsDraft',
    'levelsPending',
    'exportedState',
    'views',
    'selected',
    'perspectivePreview',
  ];

  const otherSide = side => (side === 'front' ? 'back' : 'front');
  const isRecordObject = value => value !== null
    && typeof value === 'object'
    && !Array.isArray(value);

  /* ---------- the output choice (a preference) ---------- */

  // The remembered output. localStorage is untrusted, so anything but a known output falls back
  // to CONFIG's, and a bad CONFIG value to Together.
  function storedPairOutput() {
    const stored = CF.Prefs.load().pairOutput;
    if (PAIR_OUTPUTS.includes(stored)) return stored;
    return PAIR_OUTPUTS.includes(CONFIG.pair.output) ? CONFIG.pair.output : 'together';
  }

  function setPairOutput(output) {
    if (!PAIR_OUTPUTS.includes(output)) return;
    app.pairOutput = output;
    app.views.together = null;
    CF.Prefs.save();
    CF.syncUI();
    CF.requestRender();
  }

  const isTogether = () => app.pairOutput !== 'separately';

  // True when Export's photo area shows the Together image instead of the open side.
  const isTogetherShown = () => !!app.pair && app.tab === 'export' && isTogether();

  /* ---------- the pair's rules ---------- */

  // Applies the pair's rules to the open side's state (stateChanged calls it before computing
  // geometry): the 5:7 crop in the pair's orientation, and its export settings for both sides.
  function applyPairRules(state) {
    const pair = app.pair;
    if (!pair) return;
    lockCrop(state, pair.orient);
    const other = pair.other.state;
    if (JSON.stringify(other.export) !== JSON.stringify(state.export)) {
      other.export = clone(state.export);
      savePairSoon();
    }
  }

  // Sets a state's crop to 5:7 in `orient` (alignCrop then turns the box to match). A manual
  // box drawn for another preset goes back to fit, so the crop is never stretched.
  function lockCrop(state, orient) {
    const crop = state.crop;
    crop.preset = PAIR_PRESET;
    crop.ratio = CF.presetRatio(PAIR_PRESET);
    crop.orient = orient;
    if (crop.mode !== 'manual' || !crop.rect) return;
    const shortSide = Math.min(crop.rect.w, crop.rect.h);
    const longSide = Math.max(crop.rect.w, crop.rect.h);
    if (Math.abs(shortSide / longSide - crop.ratio) > crop.ratio * ASPECT_TOLERANCE) {
      crop.mode = 'fit';
      crop.rect = null;
    }
  }

  // Applies the lock to the waiting side's state and turns its box to match.
  function lockOtherCrop(pair) {
    const state = pair.other.state;
    lockCrop(state, pair.orient);
    CF.alignCrop(state, CardEngine.computeGeometry(state, geometryConfig()));
    pair.other.views = Object.assign({}, pair.other.views, {
      result: null,
      export: null,
      together: null,
    });
  }

  // Swap while paired: turns both sides' crops at once. It isn't an undo step (tapping Swap again
  // reverses it), so one side's Undo never changes the other side.
  function swapPair() {
    const pair = app.pair;
    if (!pair) return;
    pair.orient = otherOrient(pair.orient);
    lockOtherCrop(pair);
    CF.stateChanged();
    savePairSoon();
  }

  const otherOrient = orient => (orient === 'portrait' ? 'landscape' : 'portrait');

  /* ---------- the two sides ---------- */

  // The open side as a record to keep while the other side is open (references, not copies:
  // nothing else holds them once the other side is open).
  function captureSide() {
    const side = {
      name: app.img.name,
      width: app.img.width,
      height: app.img.height,
      history: { undo: CF.History.undo, redo: CF.History.redo },
    };
    for (const key of SIDE_FIELDS) side[key] = app[key];
    return side;
  }

  // Opens a kept side with its decoded full-resolution photo `img`.
  function applySide(side, img) {
    app.img = img;
    for (const key of SIDE_FIELDS) app[key] = side[key];
    CF.History.undo = side.history.undo;
    CF.History.redo = side.history.redo;
    CF.History.lastKey = null;
    app.perspectivePreviewLevels = null;
    app.edgeCanvas = null;
    app.findMode = false;
    app.dropper = null;
    app.compare = false;
    app.previewMode = false;
    app.overlayMessage = '';
    app.pendingSave = null;
    app.pendingCorners = null;
  }

  // Add back: keeps the open photo as the front and opens `file` as the back. The front's crop
  // becomes 5:7 (fit), in the orientation it had. If the back can't be opened, nothing changes.
  async function startPair(file, name) {
    const front = captureSide();
    const orient = CF.cropOrient(app.state, app.geometry);
    const pair = { current: 'back', orient, other: front, exportedKey: null };
    const wasPairCrop = app.isPairCrop;
    app.pair = pair;
    app.isPairCrop = true;
    if (!(await CF.openFile(file, name))) {
      if (app.pair === pair) app.pair = null;
      app.isPairCrop = wasPairCrop;
      return;
    }
    front.state.crop.mode = 'fit';
    front.state.crop.rect = null;
    lockOtherCrop(pair);
    CF.syncUI();
    savePairSession(true);
  }

  // Switches to the other side, on the step you're on (Crop on the back opens Crop on the front),
  // so the two sides can be compared step by step. Its photo is decoded before the open one is
  // released, so a failed read leaves everything as it was.
  async function switchSide() {
    const pair = app.pair;
    if (!pair || app.exporting || app.isSwitching) return;
    app.isSwitching = true;
    const startTime = performance.now();
    const other = pair.other;
    toast('Opening the ' + otherSide(pair.current) + '…');
    let img;
    try {
      img = await CF.ImageSource.load(other.file, other.name);
    } catch (error) {
      app.isSwitching = false;
      toast(error.message, 'error', 6000);
      return;
    }
    if (app.pair !== pair) {
      img.close();
      app.isSwitching = false;
      return;
    }
    CF.Session.flush();
    const step = app.tab;
    const leaving = captureSide();
    app.img.close();
    // Work still running for the side being left (detection, a session save) is now stale.
    app.loadId++;
    applySide(other, img);
    pair.other = leaving;
    pair.current = otherSide(pair.current);
    app.isSwitching = false;
    CF.stateChanged();
    CF.setTab(step);
    hideToast();
    app.switchDurationMs = performance.now() - startTime;
    console.info(`[card-finisher] switched to the ${pair.current} in `
      + `${app.switchDurationMs.toFixed(0)} ms`);
    savePairSession(true);
    // A side restored from a session has no candidates yet (for Candidate and snapping).
    if (!app.detection.last) CF.runDetect({ auto: true, keepCorners: true });
  }

  // Ends the pair, keeping `side` as a single photo. Its crop stays 5:7 and the preset unlocks;
  // the remembered preset stays as it was until a preset is picked (app.isPairCrop).
  async function unpair(side) {
    hidePrompt();
    if (!app.pair) return;
    if (side !== app.pair.current) await switchSide();
    if (!app.pair || app.pair.current !== side) return;
    app.pair = null;
    clearPairSession();
    CF.stateChanged();
    toast(`Unpaired. The ${side} is a single photo now.`);
  }

  // Opens `file` as a new single photo, ending any pair. If it can't be read, the pair stays.
  async function openSingle(file, name) {
    const pair = app.pair;
    app.pair = null;
    if (!(await CF.openFile(file, name))) {
      if (!app.pair) app.pair = pair;
      CF.syncUI();
      return;
    }
    if (pair) clearPairSession();
  }

  // Replaces the open side's photo, keeping the pair; the new photo starts like a back does.
  async function replaceSide(file, name) {
    if (await CF.openFile(file, name)) savePairSession(false);
  }

  // Every photo that comes in (Open, Next card, Add back, drop, paste) goes through here.
  // intent: 'open', 'next' (Next card →, which ends a pair after its export without asking) or
  // 'addBack'. While paired, Open, drop and paste ask whether to end the pair or replace the
  // side you're on.
  function receivePhoto(file, name, intent) {
    if (app.exporting || app.isSwitching) {
      toast('Wait for the export to finish, then open the photo.', 'warn');
      return;
    }
    hidePrompt();
    if (intent === 'addBack' && app.img && !app.pair) {
      startPair(file, name);
      return;
    }
    if (!app.pair || intent === 'next') {
      openSingle(file, name);
      return;
    }
    showPrompt({
      title: 'New photo',
      text: 'End the pair, or replace the side you’re on?',
      choices: [
        { label: 'New photo', action: () => openSingle(file, name) },
        { label: 'Replace ' + app.pair.current, action: () => replaceSide(file, name) },
      ],
    });
  }

  /* ---------- the question card ---------- */

  // Shows a question on a card over the dimmed photo, like Resume (with the step menu, the only
  // things allowed over the photo): a title, a line of text, two choices and Cancel. A tap
  // outside the card or Escape cancels. choices: [{ label, action }]. Corner shots ask their
  // upscale question on it too.
  function showPrompt({ title, text, choices }) {
    byId('pairPromptTitle').textContent = title;
    byId('pairPromptText').textContent = text;
    ['btnPromptFirst', 'btnPromptSecond'].forEach((id, i) => {
      const button = byId(id);
      button.textContent = choices[i].label;
      button.onclick = () => {
        hidePrompt();
        choices[i].action();
      };
    });
    byId('pairPrompt').hidden = false;
    elements.root.classList.add('prompting');
    CF.closeStepMenu();
    byId('btnPromptFirst').focus({ preventScroll: true });
  }

  function hidePrompt() {
    byId('pairPrompt').hidden = true;
    elements.root.classList.remove('prompting');
  }

  function askUnpair() {
    showPrompt({
      title: 'Unpair',
      text: 'Keep one side as a single photo.',
      choices: [
        { label: 'Keep front', action: () => unpair('front') },
        { label: 'Keep back', action: () => unpair('back') },
      ],
    });
  }

  /* ---------- export ---------- */

  // Both sides' edits by side: { front: { state, name }, back: … }, the open side's live state.
  function sideStates() {
    const pair = app.pair;
    const result = {};
    result[pair.current] = { state: app.state, name: app.img.name };
    result[otherSide(pair.current)] = { state: pair.other.state, name: pair.other.name };
    return result;
  }

  // Identifies what a pair export saved: both sides' edits and the output choice. Next card shows
  // while it matches.
  function pairKey() {
    const sides = sideStates();
    return JSON.stringify([sides.front.state, sides.back.state, app.pairOutput]);
  }

  const isPairExported = () => !!app.pair && app.pair.exportedKey === pairKey();

  function markPairExported(key) {
    if (!app.pair) return;
    app.pair.exportedKey = key;
    savePairSoon();
    CF.syncReadouts();
  }

  // The Together layout for both sides' export sizes, within the canvas caps.
  function togetherLayout(sides) {
    const size = state => {
      const output = CardEngine.computeGeometry(state, geometryConfig()).output;
      return { width: output.width, height: output.height };
    };
    return CardEngine.pairLayout(size(sides.front.state), size(sides.back.state), app.pair.orient, {
      gutterPct: CONFIG.pair.gutterPct,
      maxOutputPx: CONFIG.maxOutputPx,
      maxOutputArea: CONFIG.maxOutputArea,
    });
  }

  // The export's readout for a pair: the choice and its size, e.g. "Together · 2881 × 2000 px".
  function pairReadout() {
    const sides = sideStates();
    if (isTogether()) {
      const layout = togetherLayout(sides);
      return { label: 'Together', size: `${layout.width} × ${layout.height}`, layout };
    }
    const sizeOf = state => {
      const output = CardEngine.computeGeometry(state, geometryConfig()).output;
      return `${output.width} × ${output.height}`;
    };
    const size = `${sizeOf(sides.front.state)} + ${sizeOf(sides.back.state)}`;
    return { label: 'Separately', size, layout: null };
  }

  // Runs task(side, photoEl) for each side from its full-resolution photo, one photo in memory at
  // a time: the open side first, then its photo is released while the other side's is decoded,
  // used and closed, and the open side's photo is decoded again at the end. A failed reload
  // doesn't fail the task (see reloadOpenPhoto).
  async function forEachSidePhoto(task) {
    const pair = app.pair;
    await task(pair.current, app.img.el);
    app.img.close();
    app.img.el = null;
    try {
      const other = await CF.ImageSource.load(pair.other.file, pair.other.name);
      try {
        await task(otherSide(pair.current), other.el);
      } finally {
        other.close();
      }
    } finally {
      await reloadOpenPhoto();
    }
  }

  // Decodes the open side's photo again after a pair export released it. Returns true when the
  // photo is back. On a failure (memory pressure on a phone, with the export's canvas still
  // held, is the realistic case) the photo stays released: the preview copies still draw it,
  // and exports refuse with CF.PHOTO_RELEASED_MESSAGE until it's back.
  async function reloadOpenPhoto() {
    if (app.img.el) return true;
    try {
      app.img = await CF.ImageSource.load(app.file, app.img.name);
      return true;
    } catch (error) {
      console.warn('[card-finisher] photo not reloaded after the pair export:', error);
      return false;
    }
  }

  // Renders one side into `canvas` at `place` ({ x, y, width, height }), with its overlay, from
  // its photo element. A side scaled down for the caps is rendered at that size in one resample.
  async function renderSideInto(canvas, place, state, photo, onProgress) {
    const geometry = CardEngine.computeGeometry(state, geometryConfig());
    if (!geometry.ok) throw new Error(geometry.reason);
    const output = geometry.output;
    const placeToSource = Mat3.chain(
      geometry.outputToSource,
      Mat3.scale(output.width / place.width, output.height / place.height),
    );
    await CF.renderWarped(state, placeToSource, place.width, place.height, onProgress, {
      photo,
      target: { canvas, x: place.x, y: place.y },
    });
    const ctx = context2d(canvas);
    ctx.save();
    ctx.translate(place.x, place.y);
    CF.compositeOverlay(ctx, state, place.width, place.height);
    ctx.restore();
  }

  // The Together image → a Promise of its Blob, each side rendered from its own photo.
  async function encodeTogether(sides, type, onProgress) {
    const layout = togetherLayout(sides);
    const frontState = sides.front.state;
    const canvas = makeCanvas(layout.width, layout.height);
    if (frontState.export.fill !== 'transparent') {
      const ctx = context2d(canvas);
      ctx.fillStyle = frontState.export.fill;
      ctx.fillRect(0, 0, layout.width, layout.height);
    }
    let done = 0;
    await forEachSidePhoto(async (side, photo) => {
      const progress = fraction => onProgress((done + fraction) / 2);
      await renderSideInto(canvas, layout[side], sides[side].state, photo, progress);
      done++;
    });
    return CF.encodeCanvas(canvas, frontState, type);
  }

  // Two files, <front>-front and <back>-back, each identical to that side's own export.
  async function encodeSeparately(sides, type, onProgress) {
    const blobs = {};
    let done = 0;
    await forEachSidePhoto(async (side, photo) => {
      const state = sides[side].state;
      const geometry = CardEngine.computeGeometry(state, geometryConfig());
      if (!geometry.ok) throw new Error(geometry.reason);
      const { width, height } = geometry.output;
      const canvas = makeCanvas(width, height);
      const place = { x: 0, y: 0, width, height };
      const progress = fraction => onProgress((done + fraction) / 2);
      await renderSideInto(canvas, place, state, photo, progress);
      blobs[side] = await CF.encodeCanvas(canvas, state, type);
      done++;
    });
    return SIDES.map(side => {
      const state = sides[side].state;
      const extension = CF.extensionFor(blobs[side], state, type);
      const name = `${CF.exportBaseName(state)}-${side}.${extension}`;
      return new File([blobs[side]], name, { type: blobs[side].type });
    });
  }

  // Wraps the Together blob as a File named <front>-pair.
  async function togetherFile(sides, type, onProgress) {
    const blob = await encodeTogether(sides, type, onProgress);
    const state = sides.front.state;
    const extension = CF.extensionFor(blob, state, type);
    const name = `${CF.exportBaseName(state)}-pair.${extension}`;
    return [new File([blob], name, { type: blob.type })];
  }

  // Exports the pair as chosen. kind: 'download', 'share' or 'copy' (the Together image as PNG;
  // with Separately chosen, Copy copies the open side through the normal export).
  async function exportPair(kind) {
    if (!app.pair || app.exporting) return;
    const sides = sideStates();
    sides.front.state = clone(sides.front.state);
    sides.back.state = clone(sides.back.state);
    const key = pairKey();
    const type = kind === 'copy' ? 'image/png' : CF.MIME_TYPES[app.state.export.format];
    const startTime = performance.now();
    try {
      await CF.runWithProgress(async onProgress => {
        if (kind === 'copy') {
          await CF.Exporter.copy(encodeTogether(sides, type, onProgress));
          markPairExported(key);
          toast('Copied to clipboard (PNG).');
          return;
        }
        const encode = isTogether() ? togetherFile : encodeSeparately;
        const files = await encode(sides, type, onProgress);
        await deliverPair(kind, files, key, startTime);
      });
    } catch (error) {
      console.error(error);
      const what = kind === 'copy' ? 'Copy failed: ' : 'Export failed: ';
      toast(what + error.message, 'error', 6000);
    }
    // The export's canvas is freed by now, so a reload that failed under memory pressure gets
    // one more try; if the photo is still missing, say how to get it back.
    if (app.img && !app.img.el && !(await reloadOpenPhoto())) {
      toast(CF.PHOTO_RELEASED_MESSAGE, 'warn', 8000);
      CF.requestRender();
    }
  }

  // Delivers the pair's files by Download (one after another) or one share sheet.
  async function deliverPair(kind, files, key, startTime) {
    const seconds = ((performance.now() - startTime) / 1000).toFixed(1);
    const what = files.length === 1 ? 'the Together image' : 'the front and back';
    const done = `Exported ${what} in ${seconds} s.`;
    if (kind === 'download') {
      // Saved first, since a download can leave the page on iPhone.
      markPairExported(key);
      CF.Session.flush();
      for (let i = 0; i < files.length; i++) {
        if (i) await new Promise(resolve => setTimeout(resolve, PAIR_DOWNLOAD_GAP_MS));
        CF.Exporter.download(files[i], files[i].name);
      }
      toast(done);
      return;
    }
    const outcome = await CF.shareExport(files, () => markPairExported(key));
    if (outcome === 'pending') toast(done + ' Tap Share now to open the share sheet.', '', 6000);
    if (outcome === 'shared') toast(done);
  }

  /* ---------- the Together preview (Export) ---------- */

  // The parts of a side's state its picture depends on (not the format or quality).
  function pictureKey(state) {
    const picture = Object.assign({}, state);
    picture.export = { fill: state.export.fill, longEdge: state.export.longEdge };
    return picture;
  }

  // One side's export, rendered small from its preview copy with its applied levels → ImageData.
  function renderPreviewSide(state, preview, width, height) {
    const geometry = CardEngine.computeGeometry(state, geometryConfig());
    const lut = CardEngine.levelsLut(state.levels, CONFIG.levels);
    let source = preview.data;
    if (lut) {
      source = new ImageData(new Uint8ClampedArray(source.data), source.width, source.height);
      CardEngine.applyLut(source, lut);
    }
    const output = geometry.output;
    const outputToPreview = Mat3.chain(
      Mat3.scale(preview.scale),
      geometry.outputToSource,
      Mat3.scale(output.width / width, output.height / height),
    );
    const pixels = new ImageData(width, height);
    const fill = CF.fillRgba(state.export.fill);
    CardEngine.warp(pixels, source, outputToPreview, { fill, interp: 'bilinear' });
    return pixels;
  }

  // The Together image as Export shows it: both sides rendered from their preview copies at most
  // CONFIG.pair.previewMaxPx on the long side, joined as the export will be, with each side's
  // overlay. Cached until a side's picture changes. Null if a side's corners are invalid.
  function togetherPreview() {
    const pair = app.pair;
    const current = { state: app.state, preview: app.preview };
    const waiting = { state: pair.other.state, preview: pair.other.preview };
    const sides = pair.current === 'front'
      ? { front: current, back: waiting }
      : { front: waiting, back: current };
    const key = JSON.stringify([
      pictureKey(sides.front.state),
      pictureKey(sides.back.state),
      pair.orient,
    ]);
    if (pair.preview && pair.preview.key === key) return pair.preview.canvas;
    const outputs = {};
    for (const side of SIDES) {
      const geometry = CardEngine.computeGeometry(sides[side].state, geometryConfig());
      if (!geometry.ok) return null;
      outputs[side] = geometry.output;
    }
    const longest = Math.max(...SIDES.map(side => Math.max(outputs[side].width,
      outputs[side].height)));
    const scale = Math.min(1, CONFIG.pair.previewMaxPx / longest);
    const sized = side => ({
      width: Math.max(1, Math.round(outputs[side].width * scale)),
      height: Math.max(1, Math.round(outputs[side].height * scale)),
    });
    const layout = CardEngine.pairLayout(sized('front'), sized('back'), pair.orient, {
      gutterPct: CONFIG.pair.gutterPct,
    });
    const canvas = makeCanvas(layout.width, layout.height);
    drawPreviewSides(canvas, layout, sides);
    pair.preview = { key, canvas };
    return canvas;
  }

  // Fills the preview canvas: the fill colour, then each side and its overlay in its cell.
  function drawPreviewSides(canvas, layout, sides) {
    const ctx = context2d(canvas);
    const fill = sides.front.state.export.fill;
    if (fill !== 'transparent') {
      ctx.fillStyle = fill;
      ctx.fillRect(0, 0, layout.width, layout.height);
    }
    const cell = makeCanvas(1, 1);
    for (const side of SIDES) {
      const place = layout[side];
      const { state, preview } = sides[side];
      cell.width = place.width;
      cell.height = place.height;
      context2d(cell).putImageData(renderPreviewSide(state, preview, place.width,
        place.height), 0, 0);
      ctx.drawImage(cell, place.x, place.y);
      ctx.save();
      ctx.translate(place.x, place.y);
      try {
        CF.compositeOverlay(ctx, state, place.width, place.height);
      } catch (error) { /* the logo isn't loaded yet; the export says so */ }
      ctx.restore();
    }
    cell.width = 0;
  }

  /* ---------- session restore ---------- */

  let pairSaveTimer = 0;
  // Saves the pair record shortly (the waiting side's settings changed: export, Swap, exported).
  function savePairSoon() {
    clearTimeout(pairSaveTimer);
    pairSaveTimer = setTimeout(() => savePairSession(false), CONFIG.session.saveDelayMs);
  }

  // Saves the pair for Resume: 'pair' (the open side, the orientation, and the waiting side's
  // edits) and, with withPhotos, 'pairPhoto' (the waiting side's photo and logo) plus the open
  // side's photo and edits ('photo' and 'edits', as for a single photo).
  async function savePairSession(withPhotos) {
    const pair = app.pair;
    if (!pair || !CF.Session.enabled) return;
    clearTimeout(pairSaveTimer);
    const other = pair.other;
    const record = {
      current: pair.current,
      orient: pair.orient,
      exported: isPairExported(),
      other: {
        side: otherSide(pair.current),
        edits: {
          name: other.name,
          width: other.width,
          height: other.height,
          state: clone(other.state),
          draft: other.levelsPending ? clone(other.levelsDraft) : null,
          tab: other.tab,
        },
      },
    };
    try {
      if (withPhotos) {
        const bytes = await other.file.arrayBuffer();
        if (app.pair !== pair) return;
        const overlay = other.state.overlay ? CF.overlayRecord(other.state.overlay.id) : null;
        const photo = { buf: bytes, type: other.file.type, name: other.name, overlay };
        await CF.Session.put('pairPhoto', photo);
        await CF.Session.savePhoto(app.file, app.loadId);
      }
      if (app.pair === pair) await CF.Session.put('pair', record);
    } catch (error) {
      console.warn('[card-finisher] pair not saved:', error);
    }
  }

  function clearPairSession() {
    clearTimeout(pairSaveTimer);
    CF.Session.del('pair').catch(() => {});
    CF.Session.del('pairPhoto').catch(() => {});
  }

  // A stored pair record has the expected shape (it comes from storage, so it's untrusted; the
  // waiting side's state goes through cleanState once its photo is decoded).
  function isPairRecord(record) {
    return isRecordObject(record)
      && SIDES.includes(record.current)
      && ORIENTS.includes(record.orient)
      && isRecordObject(record.other)
      && record.other.side === otherSide(record.current)
      && isRecordObject(record.other.edits)
      && isRecordObject(record.other.edits.state);
  }

  // The stored pair record, or null.
  async function peekPair() {
    try {
      const record = await CF.Session.get('pair');
      return record || null;
    } catch (error) {
      return null;
    }
  }

  // Resume, before the open side opens: rebuilds the waiting side from storage (photo, edits,
  // logo), making its preview copies with its full-resolution photo, which is closed before the
  // open side is decoded. Returns true if the pair is back; a malformed record drops it, with
  // the usual "reset" notice, and the open side resumes on its own.
  async function restorePair(record) {
    try {
      const photo = await CF.Session.get('pairPhoto');
      const isPhoto = isRecordObject(photo) && photo.buf instanceof ArrayBuffer;
      if (!isPairRecord(record) || !isPhoto) throw new Error('malformed pair');
      const file = new File([photo.buf], shortText(photo.name, 200) || 'photo', {
        type: typeof photo.type === 'string' ? photo.type : '',
      });
      const side = await restoredSide(file, record.other.edits);
      if (photo.overlay) await CF.restoreOverlayRecord(photo.overlay);
      app.pair = {
        current: record.current,
        orient: record.orient,
        other: side,
        exportedKey: null,
        wasExported: record.exported === true,
      };
      app.isPairCrop = true;
      return true;
    } catch (error) {
      console.warn('[card-finisher] pair not restored:', error);
      clearPairSession();
      // Said once the open side is up, so the opening toasts don't hide it.
      app.wasPairReset = true;
      return false;
    }
  }

  // The waiting side rebuilt from its photo and stored edits (checked like an edits file).
  async function restoredSide(file, edits) {
    const img = await CF.ImageSource.load(file, file.name);
    try {
      if (edits.width !== img.width || edits.height !== img.height) {
        throw new Error('photo size changed');
      }
      const clean = CF.cleanState(edits.state, img);
      if (clean.invalid.length) throw new Error('invalid: ' + clean.invalid.join(', '));
      const draft = edits.draft ? CF.cleanState({ levels: edits.draft }, img) : null;
      const levelsDraft = draft && !draft.invalid.length ? draft.state.levels : null;
      return Object.assign(CF.makeCopies(img), {
        file,
        name: img.name,
        width: img.width,
        height: img.height,
        state: clean.state,
        tab: CF.isStep(edits.tab) ? edits.tab : 'perspective',
        detection: CF.emptyDetection(),
        levelsDraft,
        levelsPending: !!levelsDraft
          && JSON.stringify(levelsDraft) !== JSON.stringify(clean.state.levels || null),
        exportedState: null,
        views: { source: null, result: null, export: null, together: null },
        selected: 0,
        perspectivePreview: null,
        history: { undo: [], redo: [] },
      });
    } finally {
      img.close();
    }
  }

  // Resume, after the open side opened: Next card shows again if the pair's export was saved,
  // and a pair that couldn't be restored says so.
  function finishResume() {
    if (app.wasPairReset) {
      app.wasPairReset = false;
      const message = 'The saved pair wasn’t valid, so it was reset. '
        + 'This photo resumed on its own.';
      toast(message, 'warn', 6000);
    }
    const pair = app.pair;
    if (!pair) return;
    if (pair.wasExported) pair.exportedKey = pairKey();
    delete pair.wasExported;
    CF.syncUI();
  }

  /* ---------- controls ---------- */

  function bindPair() {
    app.pairOutput = storedPairOutput();
    document.querySelectorAll('#sideSwitch [data-side]').forEach(button => {
      button.addEventListener('click', () => {
        if (app.pair && button.dataset.side !== app.pair.current) switchSide();
      });
    });
    byId('btnUnpair').onclick = askUnpair;
    byId('btnPromptCancel').onclick = hidePrompt;
    byId('pairPrompt').addEventListener('click', event => {
      if (event.target === event.currentTarget) hidePrompt();
    });
    byId('btnAddBack').onclick = () => {
      app.fileIntent = 'addBack';
      elements.fileInput.click();
    };
    byId('pairOutput').onchange = event => setPairOutput(event.target.value);
  }

  // The header chip, Unpair, the output dropdown and the Save edits hint follow the pair.
  function syncPair() {
    const pair = app.pair;
    elements.root.classList.toggle('paired', !!pair);
    byId('sideSwitch').hidden = !pair;
    byId('btnUnpair').hidden = !pair;
    byId('pairOutput').hidden = !pair;
    byId('editsPairHint').hidden = !pair;
    if (!pair) {
      hidePrompt();
      return;
    }
    document.querySelectorAll('#sideSwitch [data-side]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.side === pair.current));
      button.disabled = !!app.exporting || !!app.isSwitching;
    });
    byId('pairOutput').value = app.pairOutput;
  }

  Object.assign(CF, {
    isTogetherShown,
    applyPairRules,
    swapPair,
    switchSide,
    receivePhoto,
    showPrompt,
    hidePrompt,
    isPairExported,
    pairReadout,
    exportPair,
    togetherPreview,
    peekPair,
    restorePair,
    finishResume,
    bindPair,
    syncPair,
  });
})(window.CF);
