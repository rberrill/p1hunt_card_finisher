/* =====================================================================
   js/app/export.js: the full-resolution render in row bands, Download / Share / Copy
   (Exporter), and saving and loading edits files.
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
   * renderFull(state, onProgress) → { canvas, geometry }: the export at full resolution,
   * rendered from the original photo. Deterministic for a given state. Renders in row bands so
   * a phone never holds the whole source and output as raw pixels at once.
   */
  async function renderFull(state, onProgress) {
    const geometry = CardEngine.computeGeometry(state, geometryConfig());
    if (!geometry.ok) throw new Error(geometry.reason);
    const sourceWidth = state.source.width;
    const sourceHeight = state.source.height;
    const { width: outputWidth, height: outputHeight } = geometry.output;
    const outputToSource = geometry.outputToSource;
    const isTransparent = state.export.fill === 'transparent';
    const isJpegOnTransparent = state.export.format === 'jpeg' && isTransparent;
    const fill = CF.fillRgba(isJpegOnTransparent ? '#ffffff' : state.export.fill);
    const output = makeCanvas(outputWidth, outputHeight);
    const outputContext = context2d(output);
    const lut = CardEngine.levelsLut(state.levels, CONFIG.levels);
    const region = makeCanvas(1, 1);
    const regionContext = context2d(region, true);
    let bandRows = Math.max(MIN_BAND_ROWS, Math.floor(CONFIG.export.bandPx / outputWidth));
    let y = 0;
    while (y < outputHeight) {
      const rows = Math.min(bandRows, outputHeight - y);
      const box = bandSourceBox(
        outputToSource,
        outputWidth,
        y,
        y + rows,
        sourceWidth,
        sourceHeight,
      );
      const band = new ImageData(outputWidth, rows);
      if (box) {
        const density = samplingDensity(outputToSource, outputWidth / 2, y + rows / 2);
        // When shrinking a lot, the browser's area-filtered resampler pre-shrinks the region
        // first (a mip level), since bilinear alone only reads 4 texels and aliases.
        const regionScale = isFinite(density) && density > 1.5 ? Math.min(1, 1.25 / density) : 1;
        const boxWidth = box.right - box.left;
        const boxHeight = box.bottom - box.top;
        const regionPixels = boxWidth * boxHeight * regionScale * regionScale;
        const isTooBig = regionPixels > CONFIG.export.maxBandSrcPx;
        if (isTooBig && bandRows > MIN_BAND_ROWS) {
          bandRows = Math.max(MIN_BAND_ROWS, bandRows >> 1);
          continue;
        }
        const regionWidth = Math.max(1, Math.round(boxWidth * regionScale));
        const regionHeight = Math.max(1, Math.round(boxHeight * regionScale));
        const scaleX = regionWidth / boxWidth;
        const scaleY = regionHeight / boxHeight;
        region.width = regionWidth;
        region.height = regionHeight;
        regionContext.imageSmoothingEnabled = true;
        regionContext.imageSmoothingQuality = 'high';
        regionContext.drawImage(
          app.img.el,
          box.left, box.top, boxWidth, boxHeight,
          0, 0, regionWidth, regionHeight,
        );
        const source = regionContext.getImageData(0, 0, regionWidth, regionHeight);
        // Levels are per pixel, so applying them before the warp leaves the fill color untouched.
        if (lut) CardEngine.applyLut(source, lut);
        const outputToRegion = Mat3.chain(
          Mat3.scale(scaleX, scaleY),
          Mat3.translate(-box.left, -box.top),
          outputToSource,
        );
        CardEngine.warp(band, source, outputToRegion, {
          fill,
          interp: state.export.interp,
          rowOffset: y,
          bounds: [
            -box.left * scaleX,
            -box.top * scaleY,
            (sourceWidth - box.left) * scaleX,
            (sourceHeight - box.top) * scaleY,
          ],
        });
      } else {
        for (let offset = 0; offset < band.data.length; offset += 4) band.data.set(fill, offset);
      }
      outputContext.putImageData(band, 0, y);
      y += rows;
      if (onProgress) onProgress(y / outputHeight);
      await nextFrame();
    }
    region.width = 0;
    region.height = 0;
    // The overlay goes on last, before encoding (Levels never touches it).
    CF.compositeOverlay(outputContext, state, outputWidth, outputHeight);
    return { canvas: output, geometry };
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

  // Renders and encodes the export → a Promise of the file's Blob.
  function encodeExport(state, type, onProgress) {
    return renderFull(state, onProgress).then(async ({ canvas }) => {
      const needsFlattening = type === 'image/jpeg' && state.export.fill === 'transparent';
      const image = needsFlattening ? flattenOnWhite(canvas) : canvas;
      const quality = state.export.format === 'png' ? undefined : state.export.quality;
      const blob = await toBlob(image, type, quality);
      // Free the big buffer now (it matters on iOS).
      image.width = 0;
      image.height = 0;
      return blob;
    });
  }

  // Delivers a finished export by Download or Share, with a toast saying how it went.
  async function deliverExport(kind, blob, state, type, startTime) {
    const extension = EXTENSIONS[blob.type] || 'png';
    if (blob.type !== type) {
      const format = state.export.format.toUpperCase();
      const savedAs = extension.toUpperCase();
      toast(`${format} isn’t supported by this browser — saved as ${savedAs}.`, 'warn', 5000);
    }
    const baseName = (state.source.name || 'photo').replace(/\.[^.]+$/, '');
    const seconds = ((performance.now() - startTime) / 1000).toFixed(1);
    const name = `${baseName}${CONFIG.export.suffix}.${extension}`;
    const output = app.geometry.output;
    const done = `Exported ${output.width} × ${output.height} px in ${seconds} s.`;
    if (kind === 'download') {
      CF.Session.flush();
      Exporter.download(blob, name);
      toast(done);
      return;
    }
    const outcome = await shareFile(new File([blob], name, { type: blob.type }));
    if (outcome === 'pending') toast(done + ' Tap Share now to open the share sheet.', '', 6000);
    else if (outcome === 'shared') toast(done);
  }

  // Exports the current edits. kind: 'download', 'share' or 'copy' (PNG to the clipboard).
  async function doExport(kind) {
    if (!app.img || app.exporting) return;
    const state = clone(app.state);
    const type = kind === 'copy' ? 'image/png' : MIME_TYPES[state.export.format];
    const progress = byId('progress');
    const bar = progress.firstElementChild;
    app.exporting = true;
    progress.hidden = false;
    bar.style.width = '0%';
    CF.syncReadouts();
    const startTime = performance.now();
    const encoding = encodeExport(state, type, fraction => {
      bar.style.width = Math.round(fraction * 100) + '%';
    });
    try {
      if (kind === 'copy') {
        await Exporter.copy(encoding);
        toast('Copied to clipboard (PNG).');
      } else {
        await deliverExport(kind, await encoding, state, type, startTime);
      }
    } catch (error) {
      console.error(error);
      toast((kind === 'copy' ? 'Copy failed: ' : 'Export failed: ') + error.message, 'error', 6000);
    } finally {
      app.exporting = false;
      progress.hidden = true;
      CF.syncReadouts();
    }
  }

  // Opens the share sheet for a finished file. Returns 'shared', 'cancelled', 'pending' or
  // 'failed'. 'pending': the browser refused because the tap was too long ago (a slow export),
  // so the Share button becomes "Share now" and a fresh tap opens the sheet. Any edit cancels it.
  async function shareFile(file) {
    try {
      await navigator.share({ files: [file] });
      app.pendingSave = null;
      return 'shared';
    } catch (error) {
      if (error.name === 'AbortError') return 'cancelled';
      if (error.name === 'NotAllowedError' && !app.pendingSave) {
        app.pendingSave = file;
        return 'pending';
      }
      app.pendingSave = null;
      toast('Share failed: ' + error.message, 'error', 6000);
      return 'failed';
    } finally {
      CF.syncReadouts();
    }
  }

  /* ---------- saving and loading edits (the serializable edit state) ---------- */
  function saveEdits() {
    if (!app.state) return;
    // The overlay image travels inside the edits file, so loading it rebuilds the export exactly.
    const overlayImage = CF.overlayForEdits(app.state) || undefined;
    const data = Object.assign(clone(app.state), { overlayImage });
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const baseName = (app.state.source.name || 'photo').replace(/\.[^.]+$/, '');
    CF.Session.flush();
    Exporter.download(blob, baseName + '-edits.json');
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

  Object.assign(CF, { Exporter, renderFull, doExport, shareFile, saveEdits, loadEdits });
})(window.CF);
