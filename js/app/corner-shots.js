/* =====================================================================
   js/app/corner-shots.js: Corner shots (Export → More options), close-ups of the card's four
   corners as one 2×2 sheet or four photos. They render like the main export, from the
   full-resolution photo, without the overlay; the geometry is CardEngine.cornerShots. The
   sheet / photos choice is a remembered preference, not edit state.
   Shell modules share one namespace, CF (created in core.js). Names from core are
   destructured below; anything from another module is called as CF.name.
   tests/selftest.js checks these boundaries.
   ===================================================================== */
(function (CF) {
  'use strict';
  const { byId, makeEl, clone, makeCanvas, context2d, app, geometryConfig, toast } = CF;

  // The two outputs: one 2×2 image, or four files.
  const OUTPUTS = ['sheet', 'photos'];
  // Some browsers drop a download started in the same moment as another, so the four photos
  // start this far apart.
  const DOWNLOAD_GAP_MS = 250;

  /* ---------- the output choice (a preference) ---------- */

  // The remembered output. localStorage is untrusted, so anything but a known output falls
  // back to CONFIG's, and a bad CONFIG value to the sheet.
  function storedOutput() {
    const stored = CF.Prefs.load().cornerShots;
    if (OUTPUTS.includes(stored)) return stored;
    return OUTPUTS.includes(CONFIG.cornerShots.output) ? CONFIG.cornerShots.output : 'sheet';
  }

  // Picks the sheet or the photos. Files waiting for "Share now" were the other output, so
  // they're dropped.
  function setOutput(output) {
    if (!OUTPUTS.includes(output)) return;
    app.cornerShotsOutput = output;
    app.pendingCorners = null;
    CF.Prefs.save();
    syncCornerShots();
  }

  // The corner shots of the current edits (CardEngine.cornerShots), or { ok: false }.
  function currentShots() {
    if (!app.geometry || !app.geometry.ok) return { ok: false };
    return CardEngine.cornerShots(app.geometry, CONFIG.cornerShots);
  }

  /* ---------- rendering and encoding ---------- */

  // Renders shot i of `shots` → a Promise of its canvas, at the photo's resolution or, when
  // shots.isUpscaled, at the asked size and then sharpened (CF.sharpenUpscaled). onProgress
  // gets the fraction done over all four shots.
  async function renderShot(state, shots, i, onProgress) {
    const count = shots.shots.length;
    const shotProgress = fraction => onProgress((i + fraction) / count);
    const sizePx = shots.sizePx;
    const outputToSource = shots.shots[i].outputToSource;
    const canvas = await CF.renderWarped(state, outputToSource, sizePx, sizePx, shotProgress);
    if (!shots.isUpscaled) return canvas;
    const whole = { x: 0, y: 0, width: sizePx, height: sizePx };
    await CF.sharpenUpscaled(canvas, whole, sizePx / shots.realPx);
    return canvas;
  }

  // The four photos, rendered and encoded one at a time (phone memory) → Files named
  // <photo>-corner-tl, -tr, -br, -bl.
  async function encodePhotos(state, shots, type, onProgress) {
    const files = [];
    for (let i = 0; i < shots.shots.length; i++) {
      const canvas = await renderShot(state, shots, i, onProgress);
      files.push(await CF.encodeCanvas(canvas, state, type));
    }
    const extension = CF.extensionFor(files[0]);
    const baseName = CF.exportBaseName(state);
    return files.map((blob, i) => {
      const name = `${baseName}-corner-${shots.shots[i].label}.${extension}`;
      return new File([blob], name, { type: blob.type });
    });
  }

  // The sheet → one File named <photo>-corners: the four shots in a 2×2 grid (tl tr over
  // bl br), the gutter between them in the export fill, each shot freed once it's drawn. An
  // upscaled sheet is exactly the target size.
  async function encodeSheet(state, shots, type, onProgress) {
    const sheetPx = shots.isUpscaled ? CONFIG.cornerShots.upscaleTargetPx : 0;
    const layout = CardEngine.cornerSheetLayout(shots.sizePx, CONFIG.cornerShots, sheetPx);
    const sheet = makeCanvas(layout.width, layout.height);
    const ctx = context2d(sheet);
    if (state.export.fill !== 'transparent') {
      ctx.fillStyle = state.export.fill;
      ctx.fillRect(0, 0, layout.width, layout.height);
    }
    for (let i = 0; i < shots.shots.length; i++) {
      const label = shots.shots[i].label;
      const tile = layout.tiles.find(candidate => candidate.label === label);
      const canvas = await renderShot(state, shots, i, onProgress);
      ctx.drawImage(canvas, tile.x, tile.y);
      canvas.width = 0;
      canvas.height = 0;
    }
    const blob = await CF.encodeCanvas(sheet, state, type);
    const extension = CF.extensionFor(blob);
    const name = `${CF.exportBaseName(state)}-corners.${extension}`;
    return [new File([blob], name, { type: blob.type })];
  }

  /* ---------- saving ---------- */

  // The side of the file the current output saves (the sheet, or each photo) for tiles of
  // sizePx.
  function filePx(sizePx) {
    if (app.cornerShotsOutput === 'photos') return sizePx;
    return CardEngine.cornerSheetLayout(sizePx, CONFIG.cornerShots).width;
  }

  // The tile side that makes the file exactly CONFIG.cornerShots.upscaleTargetPx.
  function upscaledTilePx() {
    const targetPx = CONFIG.cornerShots.upscaleTargetPx;
    if (app.cornerShotsOutput === 'photos') return targetPx;
    return CardEngine.cornerSheetTilePx(targetPx, CONFIG.cornerShots);
  }

  // Saves the corner shots of the current edits. kind: 'download' or 'share'. When the file
  // (the sheet, or each photo) would be under CONFIG.cornerShots.upscaleTargetPx at the
  // photo's resolution, the upscale question (CF.askUpscale) comes first; Yes or No then
  // saves, Cancel doesn't. Never marks the edits as exported: only the main
  // export shows Next card.
  function saveCornerShots(kind) {
    if (!app.img || app.exporting) return;
    const shots = currentShots();
    if (!shots.ok) {
      toast(shots.reason, 'error', 5000);
      return;
    }
    const targetPx = CONFIG.cornerShots.upscaleTargetPx;
    const realFilePx = filePx(shots.sizePx);
    if (!(targetPx > 0) || realFilePx >= targetPx) {
      renderAndSave(kind, false);
      return;
    }
    const what = app.cornerShotsOutput === 'photos' ? 'Each corner is' : 'The sheet is';
    const text = `${what} ${realFilePx} px at the photo's resolution.`;
    CF.askUpscale(targetPx, text, isUpscaled => renderAndSave(kind, isUpscaled));
  }

  // Renders and saves the corner shots. isUpscaled: render every tile at the size that makes
  // the file CONFIG.cornerShots.upscaleTargetPx, bicubic whatever the export's interpolation,
  // and sharpen it (renderShot).
  async function renderAndSave(kind, isUpscaled) {
    const state = clone(app.state);
    const geometry = CardEngine.computeGeometry(state, geometryConfig());
    const tilePx = isUpscaled ? upscaledTilePx() : 0;
    const shots = CardEngine.cornerShots(geometry, CONFIG.cornerShots, tilePx);
    if (!shots.ok) {
      toast(shots.reason, 'error', 5000);
      return;
    }
    shots.isUpscaled = isUpscaled;
    if (isUpscaled) state.export.interp = 'bicubic';
    const type = CF.MIME_TYPES[state.export.format];
    const encode = app.cornerShotsOutput === 'photos' ? encodePhotos : encodeSheet;
    const startTime = performance.now();
    try {
      const files = await CF.runWithProgress(
        onProgress => encode(state, shots, type, onProgress),
      );
      await deliverCornerShots(kind, files, startTime, shots, type);
    } catch (error) {
      console.error(error);
      toast('Corner shots failed: ' + error.message, 'error', 6000);
    }
  }

  // Delivers finished corner files by Download or Share, with a toast saying how it went and,
  // after an upscale, at what size. type: the requested MIME type (CF.toastSaved's note).
  async function deliverCornerShots(kind, files, startTime, shots, type) {
    const seconds = ((performance.now() - startTime) / 1000).toFixed(1);
    const what = files.length === 1 ? 'the corner sheet' : `${files.length} corner shots`;
    const size = shots.isUpscaled ? ` at ${CONFIG.cornerShots.upscaleTargetPx} px` : '';
    const done = `Saved ${what}${size} in ${seconds} s.`;
    if (kind === 'download') {
      // Saved first, since a download can leave the page on iPhone.
      CF.Session.flush();
      for (let i = 0; i < files.length; i++) {
        if (i) await new Promise(resolve => setTimeout(resolve, DOWNLOAD_GAP_MS));
        CF.Exporter.download(files[i], files[i].name);
      }
      CF.toastSaved(done, files, type, 'saved');
      return;
    }
    const outcome = await shareCornerShots(files);
    CF.toastSaved(done, files, type, outcome);
  }

  // Shares the corner files in one share sheet. On 'pending' (a slow render) the group's
  // Share button becomes "Share now"; any edit cancels it. Returns CF.shareFiles' outcome.
  async function shareCornerShots(files) {
    const outcome = await CF.shareFiles(files, !app.pendingCorners);
    if (outcome === 'pending') app.pendingCorners = files;
    else if (outcome !== 'cancelled') app.pendingCorners = null;
    syncCornerShots();
    return outcome;
  }

  /* ---------- the group: readout, buttons, thumbnails ---------- */

  // The readout: what will be saved and how big, at the photo's real resolution.
  function readout(shots, state) {
    const format = state.export.format.toUpperCase();
    const sizePx = shots.sizePx;
    if (app.cornerShotsOutput === 'photos') {
      return ['4 photos · ', makeEl('b', null, `${sizePx} × ${sizePx}`), ` px · ${format}`];
    }
    const layout = CardEngine.cornerSheetLayout(sizePx, CONFIG.cornerShots);
    const sheetSize = makeEl('b', null, `${layout.width} × ${layout.height}`);
    return ['Sheet ', sheetSize, ` px · ${sizePx} px corners · ${format}`];
  }

  // Syncs the group to the edits and the output choice. Called from CF.syncReadouts.
  function syncCornerShots() {
    const state = app.state;
    if (!state) return;
    const shots = currentShots();
    CF.setSegment('cornerOutput', app.cornerShotsOutput);
    byId('cornerReadout').replaceChildren(...(shots.ok ? readout(shots, state) : []));
    const share = byId('btnCornerShare');
    share.querySelector('span').textContent = app.pendingCorners ? 'Share now' : 'Share corners';
    share.disabled = !shots.ok || (!!app.exporting && !app.pendingCorners);
    byId('btnCornerDownload').disabled = !shots.ok || !!app.exporting;
    requestThumbs();
  }

  // True while the thumbnails can be seen: on Export with More options open.
  function areThumbsShown() {
    return app.tab === 'export' && !!byId('cornerShots').closest('details').open;
  }

  let isThumbsQueued = false;
  // Redraws the thumbnails on the next frame, at most once a frame, and only while they show.
  function requestThumbs() {
    if (isThumbsQueued || !areThumbsShown()) return;
    isThumbsQueued = true;
    requestAnimationFrame(() => {
      isThumbsQueued = false;
      drawThumbs();
    });
  }

  // Draws each shot from the warped preview copy with the applied levels, as the photo is drawn
  // on screen (view.js drawResult): thumbnail px ← rotated px ← perspective px ← preview px.
  // They show framing, not sharpness.
  function drawThumbs() {
    const shots = currentShots();
    const preview = shots.ok ? CF.ensurePerspectivePreview() : null;
    const exportFill = app.state.export.fill;
    const fill = exportFill === 'transparent' ? CONFIG.theme.stage : exportFill;
    const pixelRatio = Math.min(2, window.devicePixelRatio || 1);
    document.querySelectorAll('canvas[data-corner]').forEach(canvas => {
      const size = Math.round(canvas.getBoundingClientRect().width * pixelRatio);
      if (!size) return;
      if (canvas.width !== size) {
        canvas.width = size;
        canvas.height = size;
      }
      const ctx = context2d(canvas);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = fill;
      ctx.fillRect(0, 0, size, size);
      if (!preview) return;
      const shot = shots.shots.find(candidate => candidate.label === canvas.dataset.corner);
      drawThumb(ctx, shot.rectRotated, size, preview);
    });
  }

  // One thumbnail: the square `rect` (rotated px) scaled to size × size px.
  function drawThumb(ctx, rect, size, preview) {
    const toRotated = app.geometry.perspectiveToRotated;
    ctx.save();
    ctx.scale(size / rect.width, size / rect.height);
    ctx.translate(-rect.x, -rect.y);
    // Canvas transforms take (a, b, c, d, e, f) = the matrix's columns.
    ctx.transform(
      toRotated[0], toRotated[3],
      toRotated[1], toRotated[4],
      toRotated[2], toRotated[5],
    );
    ctx.scale(1 / preview.scale, 1 / preview.scale);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(CF.previewCanvas(app.state.levels || null), 0, 0);
    ctx.restore();
  }

  // Wires the group's controls. Share shows only where the browser can share files, as for
  // the main export; Download always shows.
  function bindCornerShots() {
    app.cornerShotsOutput = storedOutput();
    CF.bindSegment('cornerOutput', setOutput);
    byId('btnCornerDownload').onclick = () => saveCornerShots('download');
    byId('btnCornerShare').onclick = () => {
      if (app.pendingCorners) shareCornerShots(app.pendingCorners);
      else saveCornerShots('share');
    };
    byId('btnCornerShare').hidden = !CF.Exporter.canShare();
    byId('cornerShots').closest('details').addEventListener('toggle', requestThumbs);
  }

  Object.assign(CF, {
    bindCornerShots,
    syncCornerShots,
    saveCornerShots,
  });
})(window.CF);
