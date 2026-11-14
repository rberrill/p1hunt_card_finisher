/* =====================================================================
   js/app/overlay.js: the Overlay step. A logo placed on the framed photo and merged at export.
   Its control area, built from js/app/parts/: with no logo, a hint in the label row, the saved
   logo's thumbnail with Use saved overlay and Add logo in the control row, and Delete saved in
   the tool row; with a logo placed, Opacity in the label row, the move and size pads in the
   control row, and the tool row (Replace logo, Reset, Remove, Delete saved). A file error takes
   the label row as a status. Its options sheet holds the Tips.
   Shell modules share one namespace, CF (created in core.js). Names from core are
   destructured below; anything from another module is called as CF.name.
   tests/selftest.js checks these boundaries.
   ===================================================================== */
(function (CF) {
  'use strict';
  const {
    FULL_CIRCLE,
    Vec2,
    byId,
    makeEl,
    elements,
    clone,
    makeCanvas,
    context2d,
    app,
    toast,
  } = CF;

  /* ---------- the overlay image ----------
     state.overlay = { id, aspect, cx, cy, w, opacity } (placement relative to the crop; see
     CardEngine.overlayRect). The image itself is kept out of the edit state so undo snapshots
     stay small: `images` holds every overlay decoded this page session, by id (a hash of its
     bytes). An image record is { id, buf, type, name, el, width, height }. */
  const images = new Map();
  // The browser's saved overlay: { id, type, name, settings, url } (url: a thumbnail).
  let saved = null;

  const TYPES_BY_EXTENSION = {
    png: 'image/png',
    webp: 'image/webp',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    svg: 'image/svg+xml',
  };
  const SUPPORTED_TYPES = Object.values(TYPES_BY_EXTENSION);
  const MESSAGES = {
    type: 'That file type isn’t supported. Use PNG, WebP, JPG or SVG.',
    bad: 'Couldn’t read that image. Try another PNG, WebP, JPG or SVG file.',
    nosize: 'That SVG has no width, height or viewBox, so it can’t be sized. '
      + 'Re-export it with a size.',
  };
  const BYTES_PER_MB = 1048576;

  // The file's image type, from its MIME type or else its extension; null if unsupported.
  function imageTypeOf(file) {
    const type = (file.type || '').toLowerCase();
    if (SUPPORTED_TYPES.includes(type)) return type;
    const match = /\.(png|webp|jpe?g|svg)$/i.exec(file.name || '');
    return match ? TYPES_BY_EXTENSION[match[1].toLowerCase()] : null;
  }

  // FNV-1a over the bytes, plus the length: the same file always gets the same id.
  function hashBytes(buffer) {
    const bytes = new Uint8Array(buffer);
    let hash = 0x811c9dc5;
    for (let i = 0; i < bytes.length; i++) {
      hash ^= bytes[i];
      hash = Math.imul(hash, 0x01000193);
    }
    return (hash >>> 0).toString(16).padStart(8, '0') + '-' + bytes.length.toString(16);
  }

  function loadImageElement(blob) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('bad'));
      // The URL stays alive: the element is drawn again on every render.
      img.src = URL.createObjectURL(blob);
    });
  }

  // Decodes to something drawImage can draw, keeping alpha. Large rasters are capped (phone
  // memory); they're never drawn bigger than the export, so the cap only costs detail beyond it.
  async function decode(buffer, type) {
    if (type === 'image/svg+xml') return decodeSvg(buffer);
    const blob = new Blob([buffer], { type });
    let el = null;
    let width = 0;
    let height = 0;
    try {
      el = await createImageBitmap(blob);
      width = el.width;
      height = el.height;
    } catch (error) {
      el = await loadImageElement(blob);
      width = el.naturalWidth;
      height = el.naturalHeight;
    }
    if (!(width > 0 && height > 0)) throw new Error('bad');
    const max = CONFIG.overlay.maxPx;
    if (Math.max(width, height) > max) {
      const scale = max / Math.max(width, height);
      const canvas = makeCanvas(Math.round(width * scale), Math.round(height * scale));
      const ctx = context2d(canvas);
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(el, 0, 0, canvas.width, canvas.height);
      if (el.close) el.close();
      el = canvas;
      width = canvas.width;
      height = canvas.height;
    }
    return { el, width, height };
  }

  // An SVG's size: from width / height, or the viewBox (Safari reports 0×0 for an SVG without
  // them). Returns [width, height], or throws 'nosize'.
  function svgSize(svg, viewBox, hasViewBox) {
    const lengthOf = name => {
      const value = svg.getAttribute(name);
      return value && !/%/.test(value) && parseFloat(value) > 0 ? parseFloat(value) : 0;
    };
    let width = lengthOf('width');
    let height = lengthOf('height');
    if (!(width && height) && hasViewBox) {
      if (width) {
        height = width * viewBox[3] / viewBox[2];
      } else if (height) {
        width = height * viewBox[2] / viewBox[3];
      } else {
        width = viewBox[2];
        height = viewBox[3];
      }
    }
    if (!(width > 0 && height > 0)) throw new Error('nosize');
    return [width, height];
  }

  // An SVG takes its proportions from svgSize, then gets a large intrinsic size so it
  // rasterizes crisply at export size.
  async function decodeSvg(buffer) {
    const doc = new DOMParser().parseFromString(new TextDecoder().decode(buffer), 'image/svg+xml');
    const svg = doc.documentElement;
    const hasParseError = doc.getElementsByTagName('parsererror').length > 0;
    const isSvg = svg && svg.nodeName.toLowerCase() === 'svg' && !hasParseError;
    if (!isSvg) throw new Error('bad');
    const viewBox = (svg.getAttribute('viewBox') || '').trim().split(/[\s,]+/).map(Number);
    const hasViewBox = viewBox.length === 4 && viewBox[2] > 0 && viewBox[3] > 0;
    const [width, height] = svgSize(svg, viewBox, hasViewBox);
    if (!hasViewBox) svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    const scale = CONFIG.overlay.svgPx / Math.max(width, height);
    svg.setAttribute('width', String(width * scale));
    svg.setAttribute('height', String(height * scale));
    const markup = new XMLSerializer().serializeToString(svg);
    const img = await loadImageElement(new Blob([markup], { type: 'image/svg+xml' }));
    return { el: img, width: width * scale, height: height * scale };
  }

  // Decodes and remembers an overlay image (once per id). Checks the type and bytes again, since
  // stored and embedded records come from outside the app.
  async function register(buffer, type, name) {
    if (!SUPPORTED_TYPES.includes(type) || !(buffer instanceof ArrayBuffer)) throw new Error('bad');
    const id = hashBytes(buffer);
    if (images.has(id)) return images.get(id);
    const decoded = await decode(buffer, type);
    const image = {
      id,
      buf: buffer,
      type,
      name: name || 'overlay',
      el: decoded.el,
      width: decoded.width,
      height: decoded.height,
    };
    images.set(id, image);
    return image;
  }

  /* ---------- placement helpers ---------- */

  // The crop the overlay is placed in, or null without valid geometry.
  const frame = () => (app.geometry && app.geometry.ok ? app.geometry.crop : null);

  // The stored placement, pulled fully inside the current crop (it may have changed since).
  function effective(overlay, frameWidth, frameHeight) {
    return CardEngine.clampOverlay(overlay, frameWidth, frameHeight);
  }

  function setPlacement(state, overlay) {
    const crop = frame();
    state.overlay = crop ? effective(overlay, crop.width, crop.height) : overlay;
  }

  function defaultPlacement(image) {
    return {
      id: image.id,
      aspect: image.width / image.height,
      cx: 0.5,
      cy: 0.5,
      w: CardEngine.OVERLAY_DEFAULTS.width,
      opacity: 1,
    };
  }

  // { overlay (effective placement), crop } when an overlay is placed and its image is loaded.
  function current() {
    const overlay = app.state && app.state.overlay;
    const crop = frame();
    if (!overlay || !crop || !images.has(overlay.id)) return null;
    return { overlay: effective(overlay, crop.width, crop.height), crop };
  }

  // The placement (as JSON) a message was shown over: see setMessage.
  let messagePlacement = '';

  // Shows a message in the label row (a file that can't be used). It stays until a logo is
  // added, the step is left or the logo next changes: with a logo placed it stands where
  // Opacity does, so it must not outstay the next edit.
  function setMessage(text) {
    app.overlayMessage = text || '';
    messagePlacement = JSON.stringify((app.state && app.state.overlay) || null);
    CF.syncUI();
  }

  // Places an image as the overlay (one undo step), at saved settings if given.
  function place(image, settings) {
    const wanted = settings || {};
    CF.commit(state => {
      const defaults = defaultPlacement(image);
      // Saved settings come from storage.
      const isUnit = value => typeof value === 'number' && value >= 0 && value <= 1;
      const unitOr = (value, fallback) => (isUnit(value) ? value : fallback);
      setPlacement(state, Object.assign(defaults, {
        cx: unitOr(wanted.cx, defaults.cx),
        cy: unitOr(wanted.cy, defaults.cy),
        w: unitOr(wanted.w, defaults.w) || defaults.w,
        opacity: unitOr(wanted.opacity, defaults.opacity),
      }));
    }, 'overlayPlace');
    CF.Session.put('photoOverlay', storedRecord(image)).catch(() => {});
  }

  // The fields of an image record that go into storage.
  function storedRecord(image) {
    return { id: image.id, buf: image.buf, type: image.type, name: image.name };
  }

  // Adds a logo (the button, or drop or paste on this step). Errors leave the current overlay
  // as it was.
  async function addOverlayFile(file) {
    if (!app.img || !frame() || !file) return;
    const type = imageTypeOf(file);
    if (!type) {
      setMessage(MESSAGES.type);
      return;
    }
    const maxBytes = CONFIG.overlay.maxBytes;
    if (file.size > maxBytes) {
      const sizeMb = (file.size / BYTES_PER_MB).toFixed(1);
      setMessage(`That file is ${sizeMb} MB. The overlay limit is ${maxBytes / BYTES_PER_MB} MB.`);
      return;
    }
    let image;
    try {
      image = await register(await file.arrayBuffer(), type, file.name);
    } catch (error) {
      setMessage(error.message === 'nosize' ? MESSAGES.nosize : MESSAGES.bad);
      return;
    }
    app.overlayMessage = '';
    place(image, null);
    saveToBrowser(image);
  }

  /* ---------- the saved overlay (IndexedDB) ---------- */
  function settingsOf(overlay) {
    return { cx: overlay.cx, cy: overlay.cy, w: overlay.w, opacity: overlay.opacity };
  }

  async function saveToBrowser(image) {
    const record = Object.assign(storedRecord(image), { settings: settingsOf(app.state.overlay) });
    try {
      await CF.Session.put('overlay', record);
      setSaved(record);
    } catch (error) {
      const message = 'This overlay works on this photo, but it can’t be saved in this browser.';
      toast(message, 'warn', 5000);
    }
  }

  // Remembers the saved overlay (or null), with a thumbnail URL. The record comes from storage,
  // so its type and bytes are checked.
  function setSaved(record) {
    if (saved && saved.url) URL.revokeObjectURL(saved.url);
    const isUsable = record
      && SUPPORTED_TYPES.includes(record.type)
      && record.buf instanceof ArrayBuffer;
    saved = isUsable
      ? {
        id: record.id,
        type: record.type,
        name: record.name,
        settings: record.settings,
        url: URL.createObjectURL(new Blob([record.buf], { type: record.type })),
      }
      : null;
    CF.syncUI();
  }

  async function loadSavedOverlay() {
    try {
      const record = await CF.Session.get('overlay');
      if (record && record.buf) setSaved(record);
    } catch (error) { /* storage unavailable: nothing saved */ }
  }

  let settingsTimer = 0;
  // The latest placement becomes the saved "last used" settings (only for the saved logo).
  // A message shown over an earlier placement is cleared too (state.js calls this before the
  // controls are synced).
  function overlayStateChanged() {
    const overlay = app.state && app.state.overlay;
    if (app.overlayMessage && JSON.stringify(overlay || null) !== messagePlacement) {
      app.overlayMessage = '';
    }
    if (!overlay || !saved || overlay.id !== saved.id) return;
    const settings = settingsOf(overlay);
    if (JSON.stringify(settings) === JSON.stringify(saved.settings)) return;
    saved.settings = settings;
    clearTimeout(settingsTimer);
    settingsTimer = setTimeout(async () => {
      try {
        const record = await CF.Session.get('overlay');
        if (!record || record.id !== saved.id) return;
        record.settings = saved.settings;
        await CF.Session.put('overlay', record);
      } catch (error) { /* not saved */ }
    }, CONFIG.session.saveDelayMs);
  }

  async function useSaved() {
    if (!saved) return;
    let image = images.get(saved.id);
    try {
      if (!image) {
        const record = await CF.Session.get('overlay');
        if (!record) {
          setSaved(null);
          return;
        }
        image = await register(record.buf, record.type, record.name);
      }
    } catch (error) {
      setMessage(MESSAGES.bad);
      return;
    }
    app.overlayMessage = '';
    place(image, saved.settings);
  }

  // Clears storage only; the logo on this photo stays until Remove.
  async function deleteSaved() {
    try {
      await CF.Session.del('overlay');
    } catch (error) { /* already gone */ }
    setSaved(null);
  }

  // After a resume (or an undo past a reload), finds the overlay image for the restored state.
  async function ensureOverlayImage() {
    const overlay = app.state && app.state.overlay;
    if (!overlay || images.has(overlay.id)) return;
    for (const key of ['photoOverlay', 'overlay']) {
      try {
        const record = await CF.Session.get(key);
        if (record && record.id === overlay.id) {
          await register(record.buf, record.type, record.name);
          CF.requestRender();
          CF.syncUI();
          return;
        }
      } catch (error) { /* try the next */ }
    }
  }

  // The stored form ({ id, buf, type, name }) of a decoded logo, or null: a pair keeps the
  // waiting side's logo with its photo for Resume.
  function overlayRecord(id) {
    const image = images.get(id);
    return image ? storedRecord(image) : null;
  }

  // Decodes a stored logo record again (Resume of a pair). It comes from storage; register
  // checks its type and bytes, and a bad record is skipped (the export then says the logo is
  // missing, as for a bad edits file).
  async function restoreOverlayRecord(record) {
    if (!record || typeof record !== 'object') return;
    try {
      const name = typeof record.name === 'string' ? record.name.slice(0, 200) : '';
      await register(record.buf, record.type, name);
    } catch (error) { /* left out */ }
  }

  /* ---------- edits files: the overlay image is embedded ---------- */
  const BASE64_CHUNK = 0x8000;

  function toBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i += BASE64_CHUNK) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + BASE64_CHUNK));
    }
    return btoa(binary);
  }

  function fromBase64(text) {
    const binary = atob(text);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
  }

  // The overlay image to embed in an edits file, or null.
  function overlayForEdits(state) {
    const image = state.overlay && images.get(state.overlay.id);
    if (!image) return null;
    return { id: image.id, type: image.type, name: image.name, data: toBase64(image.buf) };
  }

  // Loads an edits file's embedded overlay image (state.overlayImage, removed from the state).
  // Returns false if it can't be used.
  async function overlayFromEdits(state) {
    const embedded = state.overlayImage;
    delete state.overlayImage;
    if (!state.overlay) return true;
    if (!embedded) return images.has(state.overlay.id);
    // The same rules as adding a logo: a known image type and at most CONFIG.overlay.maxBytes.
    const isUsable = typeof embedded === 'object'
      && typeof embedded.data === 'string'
      && SUPPORTED_TYPES.includes(embedded.type)
      && embedded.data.length * 3 / 4 <= CONFIG.overlay.maxBytes + 3;
    if (!isUsable) return false;
    try {
      const name = typeof embedded.name === 'string' ? embedded.name.slice(0, 200) : 'overlay';
      const image = await register(fromBase64(embedded.data), embedded.type, name);
      state.overlay.id = image.id;
      CF.Session.put('photoOverlay', storedRecord(image)).catch(() => {});
      return true;
    } catch (error) {
      return false;
    }
  }

  /* ---------- export compositing ---------- */

  // Draws the overlay onto the finished output canvas, before encoding. drawImage keeps the
  // logo's own alpha; globalAlpha applies the opacity on top.
  function compositeOverlay(ctx, state, outputWidth, outputHeight) {
    if (!state.overlay) return;
    const image = images.get(state.overlay.id);
    if (!image) {
      throw new Error('The overlay image isn’t loaded. Open the Overlay step and add it again.');
    }
    const placement = effective(state.overlay, outputWidth, outputHeight);
    const rect = CardEngine.overlayRect(placement, outputWidth, outputHeight);
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, state.overlay.opacity));
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(image.el, rect.x, rect.y, rect.width, rect.height);
    ctx.restore();
  }

  /* ---------- preview ---------- */

  // The overlay's rectangle in screen px.
  function screenRect(view, overlay, crop) {
    const rect = CardEngine.overlayRect(overlay, crop.width, crop.height);
    const topLeft = CF.toScreen(view, [crop.x + rect.x, crop.y + rect.y]);
    const bottomRight = CF.toScreen(view, [
      crop.x + rect.x + rect.width,
      crop.y + rect.y + rect.height,
    ]);
    return {
      x: topLeft[0],
      y: topLeft[1],
      width: bottomRight[0] - topLeft[0],
      height: bottomRight[1] - topLeft[1],
    };
  }

  function overlayCorners(rect) {
    return {
      nw: [rect.x, rect.y],
      ne: [rect.x + rect.width, rect.y],
      se: [rect.x + rect.width, rect.y + rect.height],
      sw: [rect.x, rect.y + rect.height],
    };
  }

  // The overlay on the Overlay and Export steps; on Overlay also its box, resize handles and
  // (between gestures) the snap rings.
  function drawOverlayPreview(ctx, view) {
    const placed = current();
    if (!placed) return;
    const image = images.get(placed.overlay.id);
    const rect = screenRect(view, placed.overlay, placed.crop);
    CF.setScreen(ctx);
    ctx.save();
    ctx.globalAlpha = placed.overlay.opacity;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(image.el, rect.x, rect.y, rect.width, rect.height);
    ctx.restore();
    if (app.tab !== 'overlay') return;
    if (!app.gesture) drawHotSpots(ctx, view, placed.crop);
    ctx.setLineDash([6, 5]);
    ctx.strokeStyle = 'rgba(255,255,255,.85)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
    ctx.setLineDash([]);
    for (const corner of Object.values(overlayCorners(rect))) {
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = 'rgba(0,0,0,.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.rect(corner[0] - 7, corner[1] - 7, 14, 14);
      ctx.fill();
      ctx.stroke();
    }
  }

  /* ---------- snap hot spots: nine rings on the photo (corners, side middles, center) ----------
     A still tap on a ring snaps the logo there; a drag that starts on one moves the logo as
     usual. The rings hide during a gesture so they never get in the way of placing by hand. */

  // The rings' screen positions by snap preset ('tl', 't', … 'br').
  function hotSpots(view, crop) {
    const [left, top] = CF.toScreen(view, [crop.x, crop.y]);
    const [right, bottom] = CF.toScreen(view, [crop.x + crop.width, crop.y + crop.height]);
    const inset = Math.min(CONFIG.overlay.hotSpotInset, (right - left) / 4, (bottom - top) / 4);
    const middleX = (left + right) / 2;
    const middleY = (top + bottom) / 2;
    return {
      tl: [left + inset, top + inset],
      t: [middleX, top + inset],
      tr: [right - inset, top + inset],
      l: [left + inset, middleY],
      c: [middleX, middleY],
      r: [right - inset, middleY],
      bl: [left + inset, bottom - inset],
      b: [middleX, bottom - inset],
      br: [right - inset, bottom - inset],
    };
  }

  // The key of the target within hitRadius of `point` that is nearest, or null.
  function nearestTarget(targets, point) {
    let best = null;
    let bestDistance = CONFIG.handle.hitRadius;
    for (const [key, target] of Object.entries(targets)) {
      const distance = Vec2.distance(target, point);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = key;
      }
    }
    return best;
  }

  function hitSpot(view, point) {
    const placed = current();
    return placed ? nearestTarget(hotSpots(view, placed.crop), point) : null;
  }

  function drawHotSpots(ctx, view, crop) {
    for (const spot of Object.values(hotSpots(view, crop))) {
      ctx.beginPath();
      ctx.arc(spot[0], spot[1], 11, 0, FULL_CIRCLE);
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(0,0,0,.45)';
      ctx.stroke();
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(255,255,255,.9)';
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(spot[0], spot[1], 2.5, 0, FULL_CIRCLE);
      ctx.fillStyle = 'rgba(255,255,255,.9)';
      ctx.fill();
    }
  }

  // On pointer-up for a tap (no drag) that started on a ring: undo any sub-threshold jitter,
  // then snap.
  function overlaySpotTap(gesture) {
    app.gesture = null;
    app.state.overlay = clone(gesture.before.overlay);
    adjust((overlay, crop) => (
      CardEngine.snapOverlay(overlay, gesture.spot, crop.width, crop.height)
    ));
  }

  /* ---------- gestures ----------
    On this step every touch acts on the overlay; the photo stays framed. */

  function hitCorner(view, point) {
    const placed = current();
    if (!placed) return null;
    const corners = overlayCorners(screenRect(view, placed.overlay, placed.crop));
    return nearestTarget(corners, point);
  }

  const OPPOSITE_CORNERS = { nw: 'se', ne: 'sw', se: 'nw', sw: 'ne' };

  // Starts an overlay gesture: a pinch (two fingers), a resize (a corner) or a move.
  function overlayPointerDown(point, points) {
    const placed = current();
    const view = CF.currentView();
    if (!placed || !view) {
      app.gesture = null;
      return;
    }
    const before = app.gesture && app.gesture.before ? app.gesture.before : clone(app.state);
    if (points.length === 2) {
      const [first, second] = points;
      app.gesture = {
        type: 'overlayPinch',
        before,
        startOverlay: placed.overlay,
        startDistance: Vec2.distance(first, second) || 1,
        startMidpoint: Vec2.midpoint(first, second),
        moved: true,
      };
      return;
    }
    if (points.length > 2) return;
    const corner = hitCorner(view, point);
    if (corner) {
      const rect = screenRect(view, placed.overlay, placed.crop);
      app.gesture = {
        type: 'overlayResize',
        before,
        startOverlay: placed.overlay,
        corner,
        anchor: CF.toWorld(view, overlayCorners(rect)[OPPOSITE_CORNERS[corner]]),
        start: point,
        last: point,
        moved: false,
      };
    } else {
      app.gesture = {
        type: 'overlayMove',
        before,
        startOverlay: placed.overlay,
        startWorld: CF.toWorld(view, point),
        start: point,
        last: point,
        moved: false,
        spot: hitSpot(view, point),
      };
    }
    CF.requestRender();
  }

  // The placement a gesture gives at the current pointer(s), or null.
  function gesturePlacement(gesture, point, points, view, crop) {
    const start = gesture.startOverlay;
    if (gesture.type === 'overlayPinch') {
      if (points.length < 2) return null;
      const [first, second] = points;
      const midpoint = Vec2.midpoint(first, second);
      return Object.assign({}, start, {
        w: start.w * Vec2.distance(first, second) / gesture.startDistance,
        cx: start.cx + (midpoint[0] - gesture.startMidpoint[0]) / view.zoom / crop.width,
        cy: start.cy + (midpoint[1] - gesture.startMidpoint[1]) / view.zoom / crop.height,
      });
    }
    if (gesture.type === 'overlayMove') {
      const world = CF.toWorld(view, point);
      return Object.assign({}, start, {
        cx: start.cx + (world[0] - gesture.startWorld[0]) / crop.width,
        cy: start.cy + (world[1] - gesture.startWorld[1]) / crop.height,
      });
    }
    if (gesture.type === 'overlayResize') {
      // Aspect locked: the larger of the two pointer distances from the opposite corner sets
      // the size.
      const world = CF.toWorld(view, point);
      const signX = gesture.corner[1] === 'e' ? 1 : -1;
      const signY = gesture.corner[0] === 's' ? 1 : -1;
      const reachX = signX * (world[0] - gesture.anchor[0]);
      const reachY = signY * (world[1] - gesture.anchor[1]) * start.aspect;
      const widthPx = Math.max(8, Math.max(reachX, reachY));
      const heightPx = widthPx / start.aspect;
      return Object.assign({}, start, {
        w: widthPx / crop.width,
        cx: (gesture.anchor[0] + signX * widthPx / 2 - crop.x) / crop.width,
        cy: (gesture.anchor[1] + signY * heightPx / 2 - crop.y) / crop.height,
      });
    }
    return null;
  }

  function overlayPointerMove(gesture, point, points) {
    const placed = current();
    const view = CF.currentView();
    if (!placed || !view) return;
    const next = gesturePlacement(gesture, point, points, view, placed.crop);
    if (!next) return;
    gesture.last = point;
    const hasDragged = gesture.start && Vec2.distance(point, gesture.start) > CF.DRAG_THRESHOLD_PX;
    if (hasDragged) gesture.moved = true;
    app.state.overlay = effective(next, placed.crop.width, placed.crop.height);
    CF.requestRender();
  }

  // A pinch that loses a finger carries on as a move with the remaining one (one undo step
  // overall).
  function overlayPinchEnded(remaining) {
    const placed = current();
    const view = CF.currentView();
    const gesture = app.gesture;
    if (!placed || !view || !gesture) return;
    app.gesture = {
      type: 'overlayMove',
      before: gesture.before,
      startOverlay: placed.overlay,
      startWorld: CF.toWorld(view, remaining),
      start: remaining,
      last: remaining,
      moved: true,
    };
  }

  function overlayCursor(view, point) {
    if (!current()) return 'default';
    const corner = hitCorner(view, point);
    if (corner) return corner === 'nw' || corner === 'se' ? 'nwse-resize' : 'nesw-resize';
    return hitSpot(view, point) ? 'pointer' : 'move';
  }

  /* ---------- nudges, keys, wheel, buttons ---------- */

  // Changes the placement through `change(placement, crop)` as one undo step (`key` coalesces).
  function adjust(change, key) {
    const placed = current();
    if (!placed) return;
    CF.commit(state => {
      setPlacement(state, change(Object.assign({}, placed.overlay), placed.crop));
    }, key);
  }

  // direction: [dx, dy] (a move of nudgePct of the frame width) or 'grow' / 'shrink'.
  function nudge(direction, isBig) {
    const settings = CONFIG.overlay;
    const step = (isBig ? settings.nudgeShiftPct : settings.nudgePct) / 100;
    if (direction === 'grow' || direction === 'shrink') {
      const factor = direction === 'grow' ? settings.sizeStep : 1 / settings.sizeStep;
      adjust(overlay => Object.assign(overlay, { w: overlay.w * factor }), 'overlayNudge');
      return;
    }
    adjust((overlay, crop) => Object.assign(overlay, {
      cx: overlay.cx + direction[0] * step,
      cy: overlay.cy + direction[1] * step * crop.width / crop.height,
    }), 'overlayNudge');
  }

  // Arrow keys move the logo (Shift for bigger steps); + and − size it. True if handled.
  function overlayKey(event) {
    const direction = CF.ARROW_DIRECTIONS[event.key];
    if (direction) {
      nudge(direction, event.shiftKey);
      return true;
    }
    if (event.key === '+' || event.key === '=') {
      nudge('grow');
      return true;
    }
    if (event.key === '-' || event.key === '_') {
      nudge('shrink');
      return true;
    }
    return false;
  }

  function overlayWheel(deltaY) {
    const factor = Math.exp(-deltaY * 0.0015);
    adjust(overlay => Object.assign(overlay, { w: overlay.w * factor }), 'overlayWheel');
  }

  function resetPlacement() {
    const overlay = app.state.overlay;
    if (!overlay) return;
    CF.commit(state => {
      const centered = { cx: 0.5, cy: 0.5, w: CardEngine.OVERLAY_DEFAULTS.width, opacity: 1 };
      setPlacement(state, Object.assign({}, overlay, centered));
    });
  }

  // Takes the logo off this photo (one undo step); the saved logo stays.
  function removeOverlay() {
    app.overlayMessage = '';
    CF.commit(state => {
      state.overlay = null;
    });
  }

  /* ---------- the controls: building ---------- */
  // The step's tips: the plan's approved wording (14 November), and the line that sat under
  // Delete saved overlay in the sheet, reworded for the tool (Rich, 14 November). Then the
  // keyboard help shown under them on a wide screen (frame DT9).
  const OVERLAY_TIPS = [
    'Tap a ring to snap the logo to that corner, side or the center. Drag to move it; '
      + 'drag a corner or pinch to resize.',
    'On this step the photo stays framed as set in Crop.',
    'Your last logo is kept in this browser for the next photo.',
    'Delete saved leaves the logo on this photo.',
  ];
  const OVERLAY_KEYS = [
    'Arrows move the logo (Shift for bigger steps); + and − resize it; the wheel resizes too.',
  ];
  const OVERLAY_HINT = 'Add a logo or watermark: PNG, WebP, JPG or SVG, up to 5 MB.';
  // The move pad's keys, left to right, with the direction each moves the logo, and the size
  // pad's. A key's value is what nudge() takes.
  const MOVE_KEYS = [
    { value: '-1,0', icon: 'left', label: 'Move left' },
    { value: '0,-1', icon: 'up', label: 'Move up' },
    { value: '0,1', icon: 'down', label: 'Move down' },
    { value: '1,0', icon: 'right', label: 'Move right' },
  ];
  const SIZE_KEYS = [
    { value: 'shrink', icon: 'minus', label: 'Smaller' },
    { value: 'grow', icon: 'plus', label: 'Larger' },
  ];

  // Builds Overlay's control area and options sheet into its section (the shell's contract).
  // The sheet holds only the Tips: all four buttons are tools (Rich, 14 November).
  function buildOverlayControls() {
    const section = document.querySelector('section[data-panel="overlay"]');
    const area = CF.buildControlArea('overlayArea',
      CF.buildLabelRow('overlayHintLine', makeEl('span', { class: 'overlay-hint' }, OVERLAY_HINT)),
      buildOpacityLine(),
      CF.buildStatus('overlayStatus'),
      buildAddRow(),
      buildPadRow(),
      buildOverlayTools());
    const sheet = CF.buildSheet({ id: 'overlaySheet', title: 'Overlay options' },
      CF.buildTipsRow('overlayTips', OVERLAY_TIPS, OVERLAY_KEYS));
    section.replaceChildren(area, sheet);
  }

  // The label row with a logo placed: OPACITY, its slider, then the value (frame O8).
  function buildOpacityLine() {
    return CF.buildLabelRow('overlayOpacityLine',
      makeEl('span', { class: 'line-label' }, 'Opacity'),
      CF.buildSlider({ id: 'overlayOpacity', min: 0, max: 100, step: 1, label: 'Opacity' }),
      makeEl('span', { class: 'line-value overlay-opacity-value', id: 'overlayOpacityValue' }));
  }

  // The control row with no logo placed: the saved logo's thumbnail and Use saved overlay
  // (both only while a logo is saved), then Add logo, the step's red main action.
  function buildAddRow() {
    return CF.buildControlRow('overlayAddRow',
      makeEl('img', { class: 'overlay-saved-thumb', id: 'overlayThumb', alt: 'Saved overlay' }),
      CF.buildActionButton({ id: 'btnUseSaved', label: 'Use saved overlay', isWide: true }),
      CF.buildActionButton({
        id: 'btnOverlayAdd',
        label: 'Add logo',
        icon: 'plus',
        look: 'main',
        isWide: true,
      }));
  }

  // The control row with a logo placed: the move pad at the left, the size pad at the right.
  function buildPadRow() {
    return CF.buildControlRow('overlayPadRow',
      CF.buildNudgePad({ id: 'overlayMovePad', label: 'Move the logo', keys: MOVE_KEYS }),
      makeEl('span', { class: 'line-spacer' }),
      CF.buildNudgePad({ id: 'overlaySizePad', label: 'Resize the logo', keys: SIZE_KEYS }));
  }

  // The tool row: four actions. Delete saved, at the far right, is the one tool that also
  // shows while a saved logo is offered but not placed.
  function buildOverlayTools() {
    const deleteSavedTool = CF.buildTool({
      id: 'toolOverlayDeleteSaved',
      kind: 'action',
      label: 'Delete saved',
      icon: 'bin',
      title: 'Delete the logo saved in this browser',
    });
    return CF.buildToolRow('overlayTools',
      CF.buildTool({
        id: 'toolOverlayReplace',
        kind: 'action',
        label: 'Replace logo',
        icon: 'image',
        title: 'Choose another logo',
      }),
      CF.buildTool({
        id: 'toolOverlayReset',
        kind: 'action',
        label: 'Reset',
        icon: 'rotateLeft',
        title: 'Center the logo at its first size, at 100%',
      }),
      CF.buildTool({
        id: 'toolOverlayRemove',
        kind: 'action',
        label: 'Remove',
        icon: 'close',
        title: 'Take the logo off this photo',
      }),
      deleteSavedTool);
  }

  /* ---------- the controls: binding and syncing ---------- */
  // Opacity updates live while sliding; one undo step per slide.
  function bindOpacitySlider() {
    const slider = byId('overlayOpacity');
    let before = null;
    slider.addEventListener('input', () => {
      if (!app.state.overlay) return;
      if (!before) before = clone(app.state);
      app.state.overlay.opacity = slider.value / 100;
      byId('overlayOpacityValue').textContent = `${slider.value}%`;
      CF.requestRender();
    });
    slider.addEventListener('change', () => {
      if (before) CF.commitFrom(before, 'overlayOpacity');
      before = null;
    });
  }

  // Binds the step's controls once, at start-up. Both pads repeat while a key is held (the
  // nudge pad part does that, with the perspective nudge's timing).
  function bindOverlayControls() {
    elements.overlayInput = byId('overlayInput');
    const pickLogo = () => elements.overlayInput.click();
    byId('btnOverlayAdd').addEventListener('click', pickLogo);
    byId('toolOverlayReplace').addEventListener('click', pickLogo);
    elements.overlayInput.addEventListener('change', () => {
      const file = elements.overlayInput.files[0];
      elements.overlayInput.value = '';
      if (file) addOverlayFile(file);
    });
    byId('btnUseSaved').addEventListener('click', useSaved);
    byId('toolOverlayDeleteSaved').addEventListener('click', deleteSaved);
    byId('toolOverlayRemove').addEventListener('click', removeOverlay);
    byId('toolOverlayReset').addEventListener('click', resetPlacement);
    bindOpacitySlider();
    CF.bindNudgePad(byId('overlayMovePad'), value => nudge(value.split(',').map(Number)));
    CF.bindNudgePad(byId('overlaySizePad'), value => nudge(value));
  }

  // Writes the state into the controls. Three states: no logo and none saved (the hint and
  // Add logo), a saved logo offered (its thumbnail, Use saved overlay and the Delete saved
  // tool as well), and a logo placed (Opacity, the pads and all four tools). A message takes
  // the label row in any of them.
  function syncOverlay() {
    const overlay = app.state && app.state.overlay;
    const hasPhoto = !!app.img;
    const isPlaced = !!overlay;
    const hasSaved = !!saved;
    const message = { kind: 'error', text: app.overlayMessage || '' };
    const isStatusShown = CF.updateStatus(byId('overlayStatus'), message);
    byId('overlayHintLine').hidden = isPlaced || isStatusShown;
    byId('overlayOpacityLine').hidden = !isPlaced || isStatusShown;
    byId('overlayAddRow').hidden = isPlaced;
    byId('overlayPadRow').hidden = !isPlaced;
    const thumb = byId('overlayThumb');
    thumb.hidden = !hasSaved;
    if (hasSaved && thumb.getAttribute('src') !== saved.url) thumb.src = saved.url;
    CF.updateActionButton(byId('btnUseSaved'), { isHidden: !hasSaved, isDisabled: !hasPhoto });
    CF.updateActionButton(byId('btnOverlayAdd'), { isDisabled: !hasPhoto });
    CF.updateNudgePad(byId('overlayMovePad'), { isDisabled: !isPlaced });
    CF.updateNudgePad(byId('overlaySizePad'), { isDisabled: !isPlaced });
    const percent = isPlaced ? Math.round(overlay.opacity * 100) : 100;
    CF.updateSlider(byId('overlayOpacity').parentElement, {
      value: percent,
      isDisabled: !isPlaced,
    });
    byId('overlayOpacityValue').textContent = `${percent}%`;
    syncOverlayTools(isPlaced, hasSaved, hasPhoto);
  }

  // The tool row: all four tools with a logo placed; Delete saved alone while a saved logo is
  // only offered; no row with neither. Delete saved is dimmed while nothing is saved.
  function syncOverlayTools(isPlaced, hasSaved, hasPhoto) {
    byId('overlayTools').hidden = !isPlaced && !hasSaved;
    for (const id of ['toolOverlayReplace', 'toolOverlayReset', 'toolOverlayRemove']) {
      byId(id).hidden = !isPlaced;
    }
    CF.updateTool(byId('toolOverlayReplace'), { isDisabled: !isPlaced || !hasPhoto });
    CF.updateTool(byId('toolOverlayReset'), { isDisabled: !isPlaced });
    CF.updateTool(byId('toolOverlayRemove'), { isDisabled: !isPlaced });
    CF.updateTool(byId('toolOverlayDeleteSaved'), { isDisabled: !hasSaved });
  }

  Object.assign(CF, {
    buildOverlayControls,
    addOverlayFile,
    loadSavedOverlay,
    overlayStateChanged,
    ensureOverlayImage,
    overlayRecord,
    restoreOverlayRecord,
    overlayForEdits,
    overlayFromEdits,
    compositeOverlay,
    drawOverlayPreview,
    overlayPointerDown,
    overlayPointerMove,
    overlayPinchEnded,
    overlaySpotTap,
    overlayCursor,
    overlayKey,
    overlayWheel,
    bindOverlayControls,
    syncOverlay,
  });
})(window.CF);
