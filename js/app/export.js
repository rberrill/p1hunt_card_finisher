/* =====================================================================
   js/app/export.js: the full-resolution render in row bands, Download / Share / Copy
   (Exporter), the upscale question, and saving and loading edits files.
   Shell modules share one namespace, CF (created in core.js). Names from core are
   destructured below; anything from another module is called as CF.name.
   tests/selftest.js checks these boundaries.
   ===================================================================== */
(function (CF) {
  'use strict';
  const {
    Mat3,
    Vec2,
    byId,
    clone,
    shortText,
    nextFrame,
    makeCanvas,
    context2d,
    app,
    geometryConfig,
    toast,
  } = CF;

  /* =====================================================================
     EXPORT: a full-resolution render in row bands, then encoding through Exporter.
     ===================================================================== */

  // The phase-two swap point for saving: native apps save to Photos instead.
  const Exporter = {
    download(blob, filename) {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(link.href), 60000);
    },

    // The share sheet (Save Image, AirDrop…) keeps the app open, where a download on iOS Safari
    // replaces the page with the file. Only offered when the browser can share image files
    // (secure pages only).
    canShare() {
      if (!CONFIG.export.share || !navigator.share || !navigator.canShare) return false;
      try {
        const probe = new File([new Blob()], 'test.jpg', { type: 'image/jpeg' });
        return navigator.canShare({ files: [probe] });
      } catch (error) {
        return false;
      }
    },

    canCopy: () => !!(navigator.clipboard && navigator.clipboard.write && window.ClipboardItem),

    // Safari requires the ClipboardItem to be created synchronously in the gesture, with a Promise.
    copy(blobPromise) {
      return navigator.clipboard.write([new ClipboardItem({ 'image/png': blobPromise })]);
    },
  };

  const MIME_TYPES = { jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
  const EXTENSIONS = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
  // Bicubic sampling reads 2 px past a pixel, so band regions get this margin.
  const BAND_MARGIN_PX = 3;
  const MIN_BAND_ROWS = 8;
  // A pair export releases the open photo and reloads it afterwards (pair.js); when the reload
  // fails, every full-resolution render refuses with this until the photo is back. Switching
  // sides decodes the photo again.
  const PHOTO_RELEASED_MESSAGE = 'The photo isn’t loaded after the last export. '
    + 'Tap Front or Back to switch sides, then switch back.';

  function toBlob(canvas, type, quality) {
    return new Promise((resolve, reject) => canvas.toBlob(blob => {
      if (blob) resolve(blob);
      else reject(new Error('Encoding failed (image too large for this browser?)'));
    }, type, quality));
  }

  // The source-space bounding box { left, top, right, bottom } of output rows [top, bottom), or
  // null. Projective maps send lines to lines, so points along the band's edges bound its
  // preimage, unless it straddles the horizon (then it's the whole photo).
  function bandSourceBox(outputToSource, outputWidth, top, bottom, sourceWidth, sourceHeight) {
    const points = [];
    const steps = 8;
    for (let i = 0; i <= steps; i++) {
      points.push([outputWidth * i / steps, top]);
      points.push([outputWidth * i / steps, bottom]);
    }
    for (const x of [0, outputWidth]) {
      for (let i = 1; i < steps; i++) points.push([x, top + (bottom - top) * i / steps]);
    }
    let left = Infinity;
    let upper = Infinity;
    let right = -Infinity;
    let lower = -Infinity;
    for (const point of points) {
      if (Mat3.homogeneousW(outputToSource, point[0], point[1]) <= 1e-12) {
        left = 0;
        upper = 0;
        right = sourceWidth;
        lower = sourceHeight;
        continue;
      }
      const source = Mat3.apply(outputToSource, point[0], point[1]);
      left = Math.min(left, source[0]);
      upper = Math.min(upper, source[1]);
      right = Math.max(right, source[0]);
      lower = Math.max(lower, source[1]);
    }
    left = Math.max(0, Math.floor(left) - BAND_MARGIN_PX);
    upper = Math.max(0, Math.floor(upper) - BAND_MARGIN_PX);
    right = Math.min(sourceWidth, Math.ceil(right) + BAND_MARGIN_PX);
    lower = Math.min(sourceHeight, Math.ceil(lower) + BAND_MARGIN_PX);
    if (right <= left || lower <= upper) return null;
    return { left, top: upper, right, bottom: lower };
  }

  // Source px covered by one output px, at an output point (the local sampling density).
  function samplingDensity(outputToSource, x, y) {
    const center = Mat3.apply(outputToSource, x, y);
    const acrossX = Mat3.apply(outputToSource, x + 1, y);
    const acrossY = Mat3.apply(outputToSource, x, y + 1);
    const area = Vec2.distance(center, acrossX) * Vec2.distance(center, acrossY);
    return Math.sqrt(Math.max(1e-9, area));
  }

  /**
   * renderFull(state, onProgress, isUpscaled) → { canvas, geometry }: the export at full
   * resolution, rendered from the original photo, with the overlay. Deterministic for a given
   * state. isUpscaled (the upscale question's Yes): a crop smaller than the chosen Size is
   * enlarged to it, bicubic, and sharpened before the overlay goes on.
   */
  async function renderFull(state, onProgress, isUpscaled = false) {
    const geometry = exportGeometry(state, isUpscaled);
    const { width: outputWidth, height: outputHeight } = geometry.output;
    const output = await renderWarped(
      upscaleRenderState(state, isUpscaled),
      geometry.outputToSource,
      outputWidth,
      outputHeight,
      onProgress,
    );
    if (isUpscaled && geometry.output.scale > 1) {
      const whole = { x: 0, y: 0, width: outputWidth, height: outputHeight };
      await sharpenUpscaled(output, whole, geometry.output.scale);
    }
    // The overlay goes on last, before encoding (Levels never touches it).
    CF.compositeOverlay(context2d(output), state, outputWidth, outputHeight);
    return { canvas: output, geometry };
  }

  // The export's geometry: at the real resolution or, with isUpscaled, with a crop smaller
  // than the chosen Size enlarged to it. Throws when the edits have no geometry.
  function exportGeometry(state, isUpscaled) {
    const config = geometryConfig();
    if (isUpscaled) config.allowUpscale = true;
    const geometry = CardEngine.computeGeometry(state, config);
    if (!geometry.ok) throw new Error(geometry.reason);
    return geometry;
  }

  // The state to render with: an upscale is always bicubic, whatever Interpolation says, as
  // the corner shots' is. The caller's state is left alone.
  function upscaleRenderState(state, isUpscaled) {
    if (!isUpscaled) return state;
    const renderState = clone(state);
    renderState.export.interp = 'bicubic';
    return renderState;
  }

  /**
   * renderWarped(state, outputToSource, outputWidth, outputHeight, onProgress, options) → a
   * canvas of the photo warped through outputToSource (output px → source px), from the
   * original photo, with the applied levels and the export fill, and no overlay. The main
   * export, the corner shots and a pair's sides all render through it. Renders in row bands so
   * a phone never holds the whole source and output as raw pixels at once.
   * options: photo (the full-resolution image to read; the open photo by default) and target
   * ({ canvas, x, y }: render into that canvas at that offset instead of a new one, as a pair's
   * Together image does).
   */
  async function renderWarped(state, outputToSource, outputWidth, outputHeight, onProgress,
    options = {}) {
    const isTransparent = state.export.fill === 'transparent';
    const isJpegOnTransparent = state.export.format === 'jpeg' && isTransparent;
    const photo = options.photo || app.img.el;
    if (!photo) throw new Error(PHOTO_RELEASED_MESSAGE);
    const region = makeCanvas(1, 1);
    const target = options.target || null;
    const render = {
      state,
      photo,
      outputToSource,
      outputWidth,
      fill: CF.fillRgba(isJpegOnTransparent ? '#ffffff' : state.export.fill),
      lut: CardEngine.levelsLut(state.levels, CONFIG.levels),
      region,
      regionContext: context2d(region, true),
    };
    const output = target ? target.canvas : makeCanvas(outputWidth, outputHeight);
    const outputContext = context2d(output);
    const offsetX = target ? target.x : 0;
    const offsetY = target ? target.y : 0;
    let bandRows = Math.max(MIN_BAND_ROWS, Math.floor(CONFIG.export.bandPx / outputWidth));
    let y = 0;
    while (y < outputHeight) {
      const rows = Math.min(bandRows, outputHeight - y);
      const box = bandSourceBox(
        outputToSource,
        outputWidth,
        y,
        y + rows,
        state.source.width,
        state.source.height,
      );
      const density = samplingDensity(outputToSource, outputWidth / 2, y + rows / 2);
      // When shrinking a lot, the browser's area-filtered resampler pre-shrinks the region
      // first (a mip level), since bilinear alone only reads 4 texels and aliases.
      const regionScale = isFinite(density) && density > 1.5 ? Math.min(1, 1.25 / density) : 1;
      if (box && isRegionTooBig(box, regionScale) && bandRows > MIN_BAND_ROWS) {
        bandRows = Math.max(MIN_BAND_ROWS, bandRows >> 1);
        continue;
      }
      const band = new ImageData(outputWidth, rows);
      if (box) {
        warpBand(render, band, box, regionScale, y);
      } else {
        for (let offset = 0; offset < band.data.length; offset += 4) {
          band.data.set(render.fill, offset);
        }
      }
      outputContext.putImageData(band, offsetX, offsetY + y);
      y += rows;
      if (onProgress) onProgress(y / outputHeight);
      await nextFrame();
    }
    region.width = 0;
    region.height = 0;
    return output;
  }

  // True when a band's source box, read at regionScale, is more pixels than one band may read.
  function isRegionTooBig(box, regionScale) {
    const regionPixels = (box.right - box.left) * (box.bottom - box.top)
      * regionScale * regionScale;
    return regionPixels > CONFIG.export.maxBandSrcPx;
  }

  // Warps one band of output rows starting at row y: reads the band's source box (source px)
  // from the photo at regionScale, applies levels, and samples it into `band`.
  function warpBand(render, band, box, regionScale, y) {
    const { state, photo, outputToSource, region, regionContext } = render;
    const boxWidth = box.right - box.left;
    const boxHeight = box.bottom - box.top;
    const regionWidth = Math.max(1, Math.round(boxWidth * regionScale));
    const regionHeight = Math.max(1, Math.round(boxHeight * regionScale));
    const scaleX = regionWidth / boxWidth;
    const scaleY = regionHeight / boxHeight;
    region.width = regionWidth;
    region.height = regionHeight;
    regionContext.imageSmoothingEnabled = true;
    regionContext.imageSmoothingQuality = 'high';
    regionContext.drawImage(
      photo,
      box.left, box.top, boxWidth, boxHeight,
      0, 0, regionWidth, regionHeight,
    );
    const source = regionContext.getImageData(0, 0, regionWidth, regionHeight);
    // Levels are per pixel, so applying them before the warp leaves the fill color untouched.
    if (render.lut) CardEngine.applyLut(source, render.lut);
    const outputToRegion = Mat3.chain(
      Mat3.scale(scaleX, scaleY),
      Mat3.translate(-box.left, -box.top),
      outputToSource,
    );
    CardEngine.warp(band, source, outputToRegion, {
      fill: render.fill,
      interp: state.export.interp,
      rowOffset: y,
      bounds: [
        -box.left * scaleX,
        -box.top * scaleY,
        (state.source.width - box.left) * scaleX,
        (state.source.height - box.top) * scaleY,
      ],
    });
  }

  // A copy of the canvas flattened onto white (JPEG can't hold alpha, and transparent turns
  // black). Frees the original.
  function flattenOnWhite(canvas) {
    const flat = makeCanvas(canvas.width, canvas.height);
    const ctx = context2d(flat);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, flat.width, flat.height);
    ctx.drawImage(canvas, 0, 0);
    canvas.width = 0;
    return flat;
  }

  // Encodes a finished canvas as `type` with the export's quality, then frees it → a Promise
  // of the Blob.
  async function encodeCanvas(canvas, state, type) {
    const needsFlattening = type === 'image/jpeg' && state.export.fill === 'transparent';
    const image = needsFlattening ? flattenOnWhite(canvas) : canvas;
    const quality = state.export.format === 'png' ? undefined : state.export.quality;
    const blob = await toBlob(image, type, quality);
    // Free the big buffer now (it matters on iOS).
    image.width = 0;
    image.height = 0;
    return blob;
  }

  // Renders and encodes the export → a Promise of the file's Blob. isUpscaled as for renderFull.
  function encodeExport(state, type, onProgress, isUpscaled = false) {
    return renderFull(state, onProgress, isUpscaled)
      .then(({ canvas }) => encodeCanvas(canvas, state, type));
  }

  /* ---------- the upscale question ---------- */

  // The unsharp mask's settings for an upscale by `factor`: CONFIG.upscale's sigma is in
  // source px, so it scales with the factor.
  function sharpenOptions(factor) {
    const settings = CONFIG.upscale;
    return {
      sigmaPx: settings.sharpenSigma * factor,
      amount: settings.sharpenAmount,
      thresholdLevels: settings.sharpenThreshold,
    };
  }

  // Sharpens the upscaled photo in `rect` ({ x, y, width, height }, canvas px) of `canvas` in
  // the worker (CardEngine.unsharpMask), for an upscale by `factor`. Called before the
  // overlay goes on, so a logo is never sharpened.
  async function sharpenUpscaled(canvas, rect, factor) {
    const ctx = context2d(canvas);
    const image = ctx.getImageData(rect.x, rect.y, rect.width, rect.height);
    const options = sharpenOptions(factor);
    const sharpened = await CF.EngineWorker.call('sharpen', { image, options });
    ctx.putImageData(sharpened, rect.x, rect.y);
  }

  // Asks "Upscale to N px?" on a card over the photo (CF.showPrompt): onAnswer(true) on Yes,
  // onAnswer(false) on No, nothing on Cancel. The main export, a pair's and the corner shots
  // all ask through it. `text` gives the real size.
  function askUpscale(targetPx, text, onAnswer) {
    CF.showPrompt({
      title: `Upscale to ${targetPx} px?`,
      text,
      choices: [
        { label: 'Yes', action: () => onAnswer(true) },
        { label: 'No', action: () => onAnswer(false) },
      ],
    });
  }

  // The upscale the question offers for the open photo's export: { targetPx, text } when the
  // crop's long edge is under the chosen Size (the readout's "full crop, not upscaled"), else
  // null. With a link's export.allowUpscale the output is already at Size, so no question.
  function offeredUpscale(state) {
    const targetPx = state.export.longEdge;
    const geometry = app.geometry;
    if (!targetPx || !geometry || !geometry.ok) return null;
    const { width, height } = geometry.output;
    if (Math.max(width, height) >= targetPx) return null;
    return {
      targetPx,
      text: `The crop is ${width} × ${height} px at the photo's resolution.`,
    };
  }

  // The photo's name without its extension, the start of every exported file's name.
  const exportBaseName = state => (state.source.name || 'photo').replace(/\.[^.]+$/, '');

  // The file extension for an encoded blob: the blob's real type, which is PNG when the browser
  // couldn't encode the chosen format (Safari has no WebP encoder). toastSaved says so.
  function extensionFor(blob) {
    return EXTENSIONS[blob.type] || 'png';
  }

  // The sentence a save's toast adds when the browser saved `file` as another format than the
  // requested `type` (a MIME type), or '' when it saved the requested one.
  function fallbackNote(file, type) {
    if (file.type === type) return '';
    const asked = (EXTENSIONS[type] || type).toUpperCase();
    const savedAs = extensionFor(file).toUpperCase();
    return ` ${asked} isn’t supported by this browser, so it was saved as ${savedAs}.`;
  }

  // Shows how a save went: `done` ("Exported … in N s."), with fallbackNote's sentence when the
  // browser saved another format than the requested `type`, as a longer warning. The note used
  // to be its own toast, which `done` replaced at once. outcome: 'saved' (Download) or
  // shareFiles' outcome; 'pending' adds how to finish, 'cancelled' and 'failed' show nothing
  // (shareFiles already said why).
  function toastSaved(done, files, type, outcome) {
    if (!['saved', 'shared', 'pending'].includes(outcome)) return;
    const note = fallbackNote(files[0], type);
    const finish = outcome === 'pending' ? ' Tap Share now to open the share sheet.' : '';
    const text = done + note + finish;
    if (note || finish) toast(text, note ? 'warn' : '', 6000);
    else toast(text);
  }

  // Delivers a finished export by Download or Share, with a toast saying how it went.
  async function deliverExport(kind, blob, state, type, startTime, isUpscaled) {
    const extension = extensionFor(blob);
    const seconds = ((performance.now() - startTime) / 1000).toFixed(1);
    const name = `${exportBaseName(state)}${CONFIG.export.suffix}.${extension}`;
    const output = exportGeometry(state, isUpscaled).output;
    const done = `Exported ${output.width} × ${output.height} px in ${seconds} s.`;
    const file = new File([blob], name, { type: blob.type });
    if (kind === 'download') {
      // Saved before the download, which can leave the page on iPhone.
      markExported(state);
      CF.Session.flush();
      Exporter.download(blob, name);
      toastSaved(done, [file], type, 'saved');
      return;
    }
    const outcome = await shareExport([file], () => markExported(state));
    toastSaved(done, [file], type, outcome);
  }

  // Records that these edits were exported (downloaded, copied or shared), which shows Next
  // card until an edit changes the output or another photo opens.
  function markExported(state) {
    app.exportedState = JSON.stringify(state);
    CF.Session.saveSoon();
  }

  // The second tap after a slow export ("Share now"). Any edit clears the waiting files, so a
  // finished share here is of the current edits.
  async function sharePending() {
    const pending = app.pendingSave;
    if (!pending) return;
    const outcome = await shareFiles(pending.files, false);
    if (outcome !== 'cancelled') app.pendingSave = null;
    if (outcome === 'shared') pending.onShared();
    CF.syncReadouts();
  }

  // Runs task(onProgress) with the progress bar showing and the export buttons disabled, so
  // only one export runs at a time. Returns the task's promise.
  async function runWithProgress(task) {
    const progress = byId('progress');
    const bar = progress.firstElementChild;
    app.exporting = true;
    progress.hidden = false;
    bar.style.width = '0%';
    CF.syncReadouts();
    try {
      return await task(fraction => {
        bar.style.width = Math.round(fraction * 100) + '%';
      });
    } finally {
      app.exporting = false;
      progress.hidden = true;
      CF.syncReadouts();
    }
  }

  // Exports the current edits. kind: 'download', 'share' or 'copy' (PNG to the clipboard). A
  // pair exports both sides as chosen, except that Copy with Separately copies the open side.
  // When the crop is under the chosen Size, the upscale question comes first (offeredUpscale);
  // Copy still reaches the clipboard inside the tap that answers it.
  function doExport(kind) {
    if (!app.img || app.exporting) return;
    if (app.pair && (kind !== 'copy' || app.pairOutput !== 'separately')) {
      CF.exportPair(kind);
      return;
    }
    const state = clone(app.state);
    const offer = offeredUpscale(state);
    if (!offer) {
      runExport(kind, state, false);
      return;
    }
    askUpscale(offer.targetPx, offer.text, isUpscaled => runExport(kind, state, isUpscaled));
  }

  // Renders, encodes and delivers one export of `state` (a copy of the edits). kind as for
  // doExport; isUpscaled as for renderFull.
  async function runExport(kind, state, isUpscaled) {
    const type = kind === 'copy' ? 'image/png' : MIME_TYPES[state.export.format];
    const startTime = performance.now();
    try {
      await runWithProgress(async onProgress => {
        const encoding = encodeExport(state, type, onProgress, isUpscaled);
        if (kind === 'copy') {
          await Exporter.copy(encoding);
          markExported(state);
          toast('Copied to clipboard (PNG).');
        } else {
          await deliverExport(kind, await encoding, state, type, startTime, isUpscaled);
        }
      });
    } catch (error) {
      console.error(error);
      toast((kind === 'copy' ? 'Copy failed: ' : 'Export failed: ') + error.message, 'error', 6000);
    }
  }

  // Opens the share sheet for finished files. Returns 'shared', 'cancelled', 'pending' or
  // 'failed'. 'pending': the browser refused because the tap was too long ago (a slow export)
  // and canWait is true, so the caller keeps the files for a fresh tap ("Share now").
  async function shareFiles(files, canWait) {
    try {
      await navigator.share({ files });
      return 'shared';
    } catch (error) {
      if (error.name === 'AbortError') return 'cancelled';
      if (error.name === 'NotAllowedError' && canWait) return 'pending';
      toast('Share failed: ' + error.message, 'error', 6000);
      return 'failed';
    }
  }

  // Shares finished export files in one sheet; onShared() runs once they're shared. On
  // 'pending' the Share button becomes "Share now" (app.pendingSave = { files, onShared }) and a
  // fresh tap opens the sheet; any edit cancels it. Returns shareFiles' outcome.
  async function shareExport(files, onShared) {
    const outcome = await shareFiles(files, !app.pendingSave);
    if (outcome === 'pending') app.pendingSave = { files, onShared };
    else if (outcome !== 'cancelled') app.pendingSave = null;
    if (outcome === 'shared') onShared();
    CF.syncReadouts();
    return outcome;
  }

  // Shares one file of the open photo's export (the test hook's entry point).
  const shareFile = file => shareExport([file], () => markExported(app.state));

  /* ---------- saving and loading edits (the serializable edit state) ---------- */
  function saveEdits() {
    if (!app.state) return;
    // The overlay image travels inside the edits file, so loading it rebuilds the export exactly.
    const overlayImage = CF.overlayForEdits(app.state) || undefined;
    const data = Object.assign(clone(app.state), { overlayImage });
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    CF.Session.flush();
    Exporter.download(blob, exportBaseName(app.state) + '-edits.json');
  }

  // An edits file is untrusted: its size is checked before reading, and the fields the messages
  // below show (source name and size) before they're used. Everything else goes through
  // cleanState.
  const isPlainObject = value => value !== null
    && typeof value === 'object'
    && !Array.isArray(value);
  const isDimension = value => Number.isInteger(value) && value > 0;

  function looksLikeEdits(edits) {
    return isPlainObject(edits)
      && [1, 2].includes(edits.version)
      && isPlainObject(edits.source)
      && isDimension(edits.source.width)
      && isDimension(edits.source.height)
      && Array.isArray(edits.corners);
  }

  // Brings older files up to date: v1 had separate Square up / Flatten modes and a Card / Case
  // target (square up = 0% flatten); files before crop.orient follow the swap.
  function upgradeEdits(edits) {
    if (edits.version === 1) {
      if (edits.mode === 'square') edits.strength = 0;
      edits.aspect = CF.cardAspect(edits.aspect && edits.aspect.orientation);
      delete edits.mode;
      delete edits.target;
      edits.version = 2;
    }
    if (isPlainObject(edits.crop) && edits.crop.orient === undefined) {
      const crop = edits.crop;
      const sourceRatio = edits.source.width / edits.source.height;
      const ratio = crop.ratio === 'original' ? sourceRatio : crop.ratio;
      const shown = crop.swapped ? 1 / ratio : ratio;
      crop.orient = ratio && ratio !== 1 ? (shown < 1 ? 'portrait' : 'landscape') : null;
    }
  }

  async function loadEdits(file) {
    if (file.size > CONFIG.export.editsMaxBytes) {
      toast('That file is too large to be a Card Finisher edits file.', 'error');
      return;
    }
    let edits;
    try {
      edits = JSON.parse(await file.text());
    } catch (error) {
      toast('That file isn’t valid JSON.', 'error');
      return;
    }
    if (!looksLikeEdits(edits)) {
      toast('That isn’t a Card Finisher edits file.', 'error');
      return;
    }
    if (!app.img) {
      toast('Open the matching photo first, then load its edits.', 'warn', 5000);
      return;
    }
    upgradeEdits(edits);
    const { width, height } = edits.source;
    if (width !== app.img.width || height !== app.img.height) {
      const photoSize = `${app.img.width}×${app.img.height}`;
      const message = `These edits are for a ${width}×${height} photo; this one is ${photoSize}.`;
      toast(message, 'error', 6000);
      return;
    }
    if (edits.source.name !== app.img.name) {
      const savedFor = shortText(edits.source.name) || 'another photo';
      toast(`Edits were saved for “${savedFor}”. Applied anyway — sizes match.`, 'warn', 5000);
    }
    // Only well-formed fields are used; anything else in the file falls back to the default.
    const clean = CF.cleanState(edits, app.img);
    const next = clean.state;
    if (clean.invalid.length) {
      const fields = clean.invalid.join(', ');
      toast(`Some settings in these edits weren’t valid and were reset: ${fields}.`, 'warn', 6000);
    }
    next.overlayImage = edits.overlayImage;
    if (!(await CF.overlayFromEdits(next))) {
      toast('The overlay in these edits couldn’t be read, so it was left out.', 'warn', 5000);
      next.overlay = null;
    }
    CF.commit(state => {
      for (const key of Object.keys(state)) delete state[key];
      Object.assign(state, next);
    });
  }

  Object.assign(CF, {
    Exporter,
    MIME_TYPES,
    PHOTO_RELEASED_MESSAGE,
    renderFull,
    exportGeometry,
    sharpenUpscaled,
    askUpscale,
    renderWarped,
    encodeCanvas,
    exportBaseName,
    extensionFor,
    toastSaved,
    runWithProgress,
    doExport,
    shareFiles,
    shareExport,
    shareFile,
    sharePending,
    saveEdits,
    loadEdits,
  });
})(window.CF);
