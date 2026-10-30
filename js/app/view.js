/* =====================================================================
   js/app/view.js: zoom and pan views, every canvas draw (source, loupe, debug overlay,
   result) and the mini result preview.
   Shell modules share one namespace, CF (created in core.js). Names from core are
   destructured below; anything from another module is called as CF.name.
   tests/selftest.js checks these boundaries.
   ===================================================================== */
(function (CF) {
  'use strict';
  const { FULL_CIRCLE, Mat3, Vec2, Quad, elements, makeCanvas, context2d, app } = CF;

  // Zoom limits, as screen px per world px.
  const MIN_ZOOM = 0.01;
  const MAX_ZOOM = 64;

  /* ---------- views (zoom and pan) ----------
     A view maps world (image) coordinates to the screen in CSS px:
     screen = world · zoom + (panX, panY). `auto` marks a view that still fits the photo, so a
     resize can refit it. */

  // The view that fits a worldWidth × worldHeight area in the photo area with `padding` CSS px.
  function fitView(worldWidth, worldHeight, padding = 24) {
    const width = app.cssWidth;
    const height = app.cssHeight;
    const fitX = (width - 2 * padding) / worldWidth;
    const fitY = (height - 2 * padding) / worldHeight;
    const zoom = Math.max(1e-4, Math.min(fitX, fitY));
    return {
      zoom,
      panX: (width - worldWidth * zoom) / 2,
      panY: (height - worldHeight * zoom) / 2,
      auto: true,
    };
  }

  // The steps that show the photo framed by its crop.
  const isFramedStep = tab => tab === 'export' || tab === 'levels' || tab === 'overlay';

  // The view for the current step, built when needed; null while the geometry is invalid.
  function currentView() {
    if (app.tab === 'perspective' && !app.previewMode) {
      if (!app.views.source) app.views.source = fitView(app.img.width, app.img.height);
      return app.views.source;
    }
    if (!app.geometry || !app.geometry.ok) return null;
    if (isFramedStep(app.tab)) {
      if (!app.views.export) {
        const crop = app.geometry.crop;
        const view = fitView(crop.width, crop.height);
        view.panX -= crop.x * view.zoom;
        view.panY -= crop.y * view.zoom;
        app.views.export = view;
      }
      return app.views.export;
    }
    if (!app.views.result) {
      const rotated = app.geometry.rotated;
      app.views.result = fitView(rotated.width, rotated.height, app.tab === 'crop' ? 36 : 24);
    }
    return app.views.result;
  }

  // Which of app.views the current step uses.
  function viewKey() {
    if (app.tab === 'perspective' && !app.previewMode) return 'source';
    return isFramedStep(app.tab) ? 'export' : 'result';
  }

  const toScreen = (view, point) => [
    point[0] * view.zoom + view.panX,
    point[1] * view.zoom + view.panY,
  ];
  const toWorld = (view, point) => [
    (point[0] - view.panX) / view.zoom,
    (point[1] - view.panY) / view.zoom,
  ];

  // Zooms by `factor` keeping the world point under screen point (screenX, screenY) still.
  function zoomAt(view, screenX, screenY, factor) {
    const zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, view.zoom * factor));
    const change = zoom / view.zoom;
    view.panX = screenX - (screenX - view.panX) * change;
    view.panY = screenY - (screenY - view.panY) * change;
    view.zoom = zoom;
    view.auto = false;
  }

  function fitCurrent() {
    app.views[viewKey()] = null;
    requestRender();
  }

  /* ---------- rendering ---------- */
  let isRenderQueued = false;
  // Redraws on the next animation frame (once, however often it's asked).
  function requestRender() {
    if (isRenderQueued) return;
    isRenderQueued = true;
    requestAnimationFrame(() => {
      isRenderQueued = false;
      draw();
    });
  }

  // Matches the canvas to the photo area at the device pixel ratio (at most 3).
  function resizeCanvas() {
    const rect = elements.stage.getBoundingClientRect();
    const pixelRatio = Math.min(3, window.devicePixelRatio || 1);
    app.cssWidth = rect.width;
    app.cssHeight = rect.height;
    app.devicePixelRatio = pixelRatio;
    elements.canvas.width = Math.max(1, Math.round(rect.width * pixelRatio));
    elements.canvas.height = Math.max(1, Math.round(rect.height * pixelRatio));
    for (const key of Object.keys(app.views)) {
      if (app.views[key] && app.views[key].auto) app.views[key] = null;
    }
    requestRender();
  }

  // An export fill ('transparent' or '#rrggbb') as RGBA 0–255.
  function fillRgba(fill) {
    if (!fill || fill === 'transparent') return [0, 0, 0, 0];
    const match = /^#?([0-9a-f]{6})$/i.exec(fill);
    if (!match) return [255, 255, 255, 255];
    const value = parseInt(match[1], 16);
    return [value >> 16, (value >> 8) & 255, value & 255, 255];
  }

  let checkerTile = null;
  // The fill style under the photo: the export fill, or a checkerboard for transparent.
  function underlayStyle(ctx, fill) {
    if (fill !== 'transparent') return fill;
    if (!checkerTile) {
      checkerTile = makeCanvas(16, 16);
      const tileContext = context2d(checkerTile);
      tileContext.fillStyle = '#5a5a5a';
      tileContext.fillRect(0, 0, 16, 16);
      tileContext.fillStyle = '#7a7a7a';
      tileContext.fillRect(0, 0, 8, 8);
      tileContext.fillRect(8, 8, 8, 8);
    }
    return ctx.createPattern(checkerTile, 'repeat');
  }

  // The warped preview of the whole perspective frame, from the 2048-px preview copy. Built
  // lazily, keyed on the perspective transform, never during a drag. Returns
  // { canvas, scale (preview px per perspective px), key, data }.
  function ensurePerspectivePreview() {
    const geometry = app.geometry;
    if (!geometry || !geometry.ok) return null;
    const { perspective, sourceToPerspective } = geometry;
    const key = JSON.stringify([sourceToPerspective, perspective.width, perspective.height]);
    const cached = app.perspectivePreview;
    if (cached && cached.key === key) return cached;
    const previewScale = app.preview.scale;
    const longSide = Math.max(perspective.width, perspective.height);
    const scale = Math.min(previewScale, CONFIG.previewMaxPx / longSide);
    const width = Math.max(1, Math.round(perspective.width * scale));
    const height = Math.max(1, Math.round(perspective.height * scale));
    // Preview px → perspective-preview px.
    const previewToWarped = Mat3.chain(
      Mat3.scale(scale),
      sourceToPerspective,
      Mat3.scale(1 / previewScale),
    );
    const pixels = new ImageData(width, height);
    CardEngine.warp(pixels, app.preview.data, Mat3.invert(previewToWarped), { fill: [0, 0, 0, 0] });
    const canReuse = cached && cached.canvas.width === width && cached.canvas.height === height;
    const canvas = canReuse ? cached.canvas : makeCanvas(width, height);
    context2d(canvas).putImageData(pixels, 0, 0);
    app.perspectivePreview = { canvas, scale, key, data: pixels };
    return app.perspectivePreview;
  }

  function draw() {
    const canvas = elements.canvas;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = CONFIG.theme.stage;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (!app.img) return;
    const view = currentView();
    if (app.tab === 'perspective' && !app.previewMode) {
      drawSource(ctx, view, true);
      return;
    }
    if (!view) {
      drawMessage(ctx, 'Fix the corners in Perspective first.');
      return;
    }
    drawResult(ctx, view);
  }

  function drawMessage(ctx, text) {
    setScreen(ctx);
    ctx.fillStyle = CONFIG.theme.muted;
    ctx.font = '15px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, app.cssWidth / 2, app.cssHeight / 2);
  }

  // Draws in world coordinates through `view`.
  function setWorld(ctx, view) {
    const ratio = app.devicePixelRatio;
    const scale = ratio * view.zoom;
    ctx.setTransform(scale, 0, 0, scale, ratio * view.panX, ratio * view.panY);
  }

  // Draws in screen CSS px.
  function setScreen(ctx) {
    ctx.setTransform(app.devicePixelRatio, 0, 0, app.devicePixelRatio, 0, 0);
  }

  // Traces a closed polygon through screen or world points.
  function tracePolygon(ctx, points) {
    ctx.beginPath();
    points.forEach((point, i) => {
      if (i) ctx.lineTo(point[0], point[1]);
      else ctx.moveTo(point[0], point[1]);
    });
    ctx.closePath();
  }

  // Draws the full-resolution region [left, right) × [top, bottom) of the photo, clipped to it.
  function drawPhotoRegion(ctx, left, top, right, bottom) {
    const clampedLeft = Math.max(0, Math.floor(left));
    const clampedTop = Math.max(0, Math.floor(top));
    const clampedRight = Math.min(app.img.width, Math.ceil(right));
    const clampedBottom = Math.min(app.img.height, Math.ceil(bottom));
    if (clampedRight <= clampedLeft || clampedBottom <= clampedTop) return;
    const width = clampedRight - clampedLeft;
    const height = clampedBottom - clampedTop;
    ctx.drawImage(
      app.img.el,
      clampedLeft, clampedTop, width, height,
      clampedLeft, clampedTop, width, height,
    );
  }

  // Draws the source photo; switches to a full-resolution tile of the visible area when zoomed
  // in past the preview copy.
  function drawSourceImage(ctx, view) {
    setWorld(ctx, view);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    if (view.zoom * app.devicePixelRatio > app.preview.scale * 1.15) {
      const topLeft = toWorld(view, [0, 0]);
      const bottomRight = toWorld(view, [app.cssWidth, app.cssHeight]);
      drawPhotoRegion(ctx, topLeft[0], topLeft[1], bottomRight[0], bottomRight[1]);
    } else {
      ctx.drawImage(app.preview.canvas, 0, 0, app.img.width, app.img.height);
    }
  }

  // The position of handle `index`: 0–3 the corners, 4–7 the edge midpoints.
  function handlePosition(corners, index) {
    if (index < 4) return corners[index];
    return Vec2.midpoint(corners[index - 4], corners[(index - 3) % 4]);
  }

  // Dashed extensions of the four quad edges across the whole photo, for lining up against long
  // card edges.
  function drawEdgeExtensions(ctx, view, quad) {
    const photoTopLeft = toScreen(view, [0, 0]);
    const photoBottomRight = toScreen(view, [app.img.width, app.img.height]);
    ctx.save();
    ctx.beginPath();
    const photoWidth = photoBottomRight[0] - photoTopLeft[0];
    const photoHeight = photoBottomRight[1] - photoTopLeft[1];
    ctx.rect(photoTopLeft[0], photoTopLeft[1], photoWidth, photoHeight);
    ctx.clip();
    ctx.strokeStyle = CONFIG.colors.extend;
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 6]);
    for (let k = 0; k < 4; k++) {
      const start = quad[k];
      const end = quad[(k + 1) % 4];
      const dx = end[0] - start[0];
      const dy = end[1] - start[1];
      const reach = 1e5 / (Math.hypot(dx, dy) || 1);
      ctx.beginPath();
      ctx.moveTo(start[0] - dx * reach, start[1] - dy * reach);
      ctx.lineTo(end[0] + dx * reach, end[1] + dy * reach);
      ctx.stroke();
    }
    ctx.restore();
    ctx.setLineDash([]);
  }

  // Handles at a constant screen size at any zoom: the edge midpoints (squares), then the
  // corners (circles with a center dot).
  function drawHandles(ctx, quad) {
    const colors = CONFIG.colors;
    const handle = CONFIG.handle;
    for (let k = 0; k < 4; k++) {
      const middle = Vec2.midpoint(quad[k], quad[(k + 1) % 4]);
      const isSelected = app.selected === 4 + k;
      const half = handle.edgeSize / 2 + (isSelected ? 2 : 0);
      ctx.fillStyle = isSelected ? colors.handleSelected : colors.handle;
      ctx.strokeStyle = 'rgba(0,0,0,.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.rect(middle[0] - half, middle[1] - half, 2 * half, 2 * half);
      ctx.fill();
      ctx.stroke();
    }
    quad.forEach((corner, k) => {
      const isSelected = app.selected === k;
      ctx.beginPath();
      ctx.arc(corner[0], corner[1], handle.cornerRadius + (isSelected ? 2 : 0), 0, FULL_CIRCLE);
      ctx.fillStyle = isSelected ? 'rgba(229,50,45,.35)' : 'rgba(255,255,255,.18)';
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = isSelected ? colors.handleSelected : colors.handle;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(corner[0], corner[1], 2, 0, FULL_CIRCLE);
      ctx.fillStyle = colors.handle;
      ctx.fill();
    });
  }

  // The detection seed: a ring with a cross.
  function drawSeed(ctx, view) {
    const point = toScreen(view, app.detection.seed);
    ctx.strokeStyle = CONFIG.colors.seed;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(point[0], point[1], 9, 0, FULL_CIRCLE);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(point[0] - 14, point[1]);
    ctx.lineTo(point[0] + 14, point[1]);
    ctx.moveTo(point[0], point[1] - 14);
    ctx.lineTo(point[0], point[1] + 14);
    ctx.stroke();
  }

  // The Perspective step: the photo with the corner quad, handles, seed and loupe.
  function drawSource(ctx, view, showControls) {
    drawSourceImage(ctx, view);
    if (!showControls) return;
    if (app.debugOverlay) drawDebug(ctx, view);
    setScreen(ctx);
    const isValid = app.geometry && app.geometry.ok;
    const quad = app.state.corners.map(corner => toScreen(view, corner));
    drawEdgeExtensions(ctx, view, quad);
    ctx.lineWidth = CONFIG.handle.lineWidth;
    ctx.strokeStyle = isValid ? CONFIG.colors.quad : CONFIG.colors.quadInvalid;
    tracePolygon(ctx, quad);
    ctx.stroke();
    drawHandles(ctx, quad);
    if (app.detection.seed) drawSeed(ctx, view);
    const gesture = app.gesture;
    if (gesture && gesture.type === 'handle') {
      drawLoupe(ctx, view, gesture);
    } else if (app.nudgeLoupeUntil > performance.now() && app.selected >= 0) {
      // After an on-screen nudge, briefly show the loupe on the selected handle so the move
      // is visible.
      const position = handlePosition(app.state.corners, app.selected);
      drawLoupe(ctx, view, {
        handleIndex: app.selected,
        last: toScreen(view, position),
        pointerType: 'touch',
      });
    }
  }

  // The crosshair in the middle of a loupe, with a gap at the center.
  function drawCrosshair(ctx, centerX, centerY, radius) {
    ctx.strokeStyle = 'rgba(255,255,255,.9)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(centerX - radius, centerY);
    ctx.lineTo(centerX - 5, centerY);
    ctx.moveTo(centerX + 5, centerY);
    ctx.lineTo(centerX + radius, centerY);
    ctx.moveTo(centerX, centerY - radius);
    ctx.lineTo(centerX, centerY - 5);
    ctx.moveTo(centerX, centerY + 5);
    ctx.lineTo(centerX, centerY + radius);
    ctx.stroke();
  }

  // The loupe's white rim.
  function drawLoupeRim(ctx, centerX, centerY, radius) {
    setScreen(ctx);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#fff';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, FULL_CIRCLE);
    ctx.stroke();
  }

  // The handle loupe: the full-resolution photo around the handle, magnified loupeZoom×.
  // gesture: { handleIndex, last (screen point), pointerType }.
  function drawLoupe(ctx, view, gesture) {
    const radius = loupeRadius();
    const zoom = view.zoom * CONFIG.loupeZoom;
    const corners = app.state.corners;
    const handle = handlePosition(corners, gesture.handleIndex);
    const [centerX, centerY] = loupeCenter(gesture, radius);
    const ratio = app.devicePixelRatio;
    ctx.save();
    setScreen(ctx);
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, FULL_CIRCLE);
    ctx.clip();
    ctx.fillStyle = '#000';
    ctx.fillRect(centerX - radius, centerY - radius, 2 * radius, 2 * radius);
    ctx.setTransform(
      ratio * zoom, 0,
      0, ratio * zoom,
      ratio * (centerX - handle[0] * zoom), ratio * (centerY - handle[1] * zoom),
    );
    const halfSpan = radius / zoom + 2;
    ctx.imageSmoothingEnabled = zoom < 6;
    drawPhotoRegion(
      ctx,
      handle[0] - halfSpan,
      handle[1] - halfSpan,
      handle[0] + halfSpan,
      handle[1] + halfSpan,
    );
    ctx.strokeStyle = CONFIG.colors.quad;
    ctx.lineWidth = 1.5 / zoom;
    tracePolygon(ctx, corners);
    ctx.stroke();
    setScreen(ctx);
    drawCrosshair(ctx, centerX, centerY, radius);
    ctx.restore();
    drawLoupeRim(ctx, centerX, centerY, radius);
  }

  // The loupe's radius: CONFIG.loupeSize, but never wider than loupeMaxFrac of the photo area
  // (phones).
  const loupeRadius = () => Math.min(CONFIG.loupeSize, app.cssWidth * CONFIG.loupeMaxFrac) / 2;

  // The loupe's position. Mouse: up and right of the cursor. Touch and pen: pinned to the top
  // corner on the far side from the finger, so the hand never covers it (a phone's photo area
  // is too short to fit it above the finger).
  function loupeCenter(gesture, radius) {
    const pointer = gesture.last;
    if (gesture.pointerType === 'mouse') {
      let centerX = pointer[0] + radius + 28;
      let centerY = pointer[1] - radius - 28;
      // Flip below the cursor near the top.
      if (centerY - radius < 4) centerY = pointer[1] + CONFIG.loupeOffset + radius;
      centerX = Math.min(app.cssWidth - radius - 4, Math.max(radius + 4, centerX));
      centerY = Math.min(app.cssHeight - radius - 4, Math.max(radius + 4, centerY));
      return [centerX, centerY];
    }
    const margin = 8;
    const pinLeft = pointer[0] > app.cssWidth / 2;
    return [pinLeft ? margin + radius : app.cssWidth - margin - radius, margin + radius];
  }

  // The detection debug overlay: the edge map, the Hough lines and the scored quads.
  function drawDebug(ctx, view) {
    const last = app.detection.last;
    if (!last) return;
    if (last.debug && !app.edgeCanvas) app.edgeCanvas = edgeMapCanvas(last.debug);
    setWorld(ctx, view);
    if (app.edgeCanvas) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(app.edgeCanvas, 0, 0, app.img.width, app.img.height);
      ctx.imageSmoothingEnabled = true;
    }
    setScreen(ctx);
    drawSnapLines(ctx, view);
    if (last.debug) drawDebugQuads(ctx, view, last.debug.quads, last.workingScale);
  }

  // The Canny edge map as cyan pixels on a transparent canvas.
  function edgeMapCanvas(debug) {
    const canvas = makeCanvas(debug.width, debug.height);
    const ctx = context2d(canvas);
    const pixels = ctx.createImageData(debug.width, debug.height);
    for (let i = 0; i < debug.edges.length; i++) {
      if (debug.edges[i]) pixels.data.set([0, 255, 255, 200], i * 4);
    }
    ctx.putImageData(pixels, 0, 0);
    return canvas;
  }

  // Each detected line, clipped to the photo by crossing it with the photo's four sides.
  function drawSnapLines(ctx, view) {
    const width = app.img.width;
    const height = app.img.height;
    const photoSides = [
      [[0, 0], [width, 0]],
      [[width, 0], [width, height]],
      [[width, height], [0, height]],
      [[0, height], [0, 0]],
    ];
    const isOnPhoto = point => point
      && point[0] >= -1
      && point[0] <= width + 1
      && point[1] >= -1
      && point[1] <= height + 1;
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255,220,0,.55)';
    for (const line of app.detection.snapLines) {
      const ends = photoSides
        .map(([start, end]) => CardEngine.intersectLines(line, CardEngine.lineThrough(start, end)))
        .filter(isOnPhoto);
      if (ends.length < 2) continue;
      const start = toScreen(view, ends[0]);
      const end = toScreen(view, ends[1]);
      ctx.beginPath();
      ctx.moveTo(start[0], start[1]);
      ctx.lineTo(end[0], end[1]);
      ctx.stroke();
    }
  }

  // The best-scoring detection quads (working px), the top three brighter, the top eight labelled.
  function drawDebugQuads(ctx, view, quads, workingScale) {
    ctx.font = '11px ui-monospace, monospace';
    quads.forEach((candidate, i) => {
      const toSource = point => [point[0] / workingScale, point[1] / workingScale];
      const quad = candidate.corners.map(point => toScreen(view, toSource(point)));
      ctx.strokeStyle = i < 3 ? 'rgba(255,80,255,.95)' : 'rgba(255,80,255,.3)';
      ctx.lineWidth = i === 0 ? 2 : 1;
      tracePolygon(ctx, quad);
      ctx.stroke();
      if (i >= 8) return;
      const confidence = Math.round(candidate.confidence * 100);
      const label = `#${i + 1} ${candidate.score.toFixed(2)} (${confidence}%)`;
      ctx.fillStyle = 'rgba(255,80,255,.95)';
      ctx.fillText(label, quad[0][0] + 4, quad[0][1] + 12 + i * 12);
    });
  }

  // The steps after Perspective: the corrected photo, then each step's guides.
  function drawResult(ctx, view) {
    const geometry = app.geometry;
    const crop = geometry.crop;
    const preview = ensurePerspectivePreview();
    setWorld(ctx, view);
    // The underlay is the export fill, so the preview matches the output where the warp leaves
    // the photo.
    ctx.fillStyle = underlayStyle(ctx, app.state.export.fill);
    const isFramed = isFramedStep(app.tab);
    if (isFramed) ctx.fillRect(crop.x, crop.y, crop.width, crop.height);
    else ctx.fillRect(0, 0, geometry.rotated.width, geometry.rotated.height);
    ctx.save();
    if (isFramed) {
      ctx.beginPath();
      ctx.rect(crop.x, crop.y, crop.width, crop.height);
      ctx.clip();
    }
    const toRotated = geometry.perspectiveToRotated;
    // Canvas transforms take (a, b, c, d, e, f) = the matrix's columns.
    ctx.transform(
      toRotated[0], toRotated[3],
      toRotated[1], toRotated[4],
      toRotated[2], toRotated[5],
    );
    ctx.scale(1 / preview.scale, 1 / preview.scale);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(CF.previewCanvas(CF.levelsShown()), 0, 0);
    ctx.restore();
    setScreen(ctx);
    const cropTopLeft = toScreen(view, [crop.x, crop.y]);
    const cropBottomRight = toScreen(view, [crop.x + crop.width, crop.y + crop.height]);
    if (app.tab === 'levels') CF.drawLevelsOverlay(ctx, view);
    if (app.tab === 'overlay' || app.tab === 'export') CF.drawOverlayPreview(ctx, view);
    if (app.tab === 'rotate') drawRotateGuides(ctx, view, cropTopLeft, cropBottomRight);
    else if (app.tab === 'crop') drawCropGuides(ctx, view, cropTopLeft, cropBottomRight);
  }

  // The Rotate step: an optional grid centered on the frame, and the crop as a dashed box.
  function drawRotateGuides(ctx, view, cropTopLeft, cropBottomRight) {
    if (app.showGrid) {
      const frameTopLeft = toScreen(view, [0, 0]);
      const rotated = app.geometry.rotated;
      const frameBottomRight = toScreen(view, [rotated.width, rotated.height]);
      const step = CONFIG.rotate.gridPx;
      const centerX = (frameTopLeft[0] + frameBottomRight[0]) / 2;
      const centerY = (frameTopLeft[1] + frameBottomRight[1]) / 2;
      ctx.strokeStyle = CONFIG.colors.grid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = centerX % step; x < app.cssWidth; x += step) {
        ctx.moveTo(Math.round(x) + 0.5, 0);
        ctx.lineTo(Math.round(x) + 0.5, app.cssHeight);
      }
      for (let y = centerY % step; y < app.cssHeight; y += step) {
        ctx.moveTo(0, Math.round(y) + 0.5);
        ctx.lineTo(app.cssWidth, Math.round(y) + 0.5);
      }
      ctx.stroke();
    }
    ctx.setLineDash([6, 5]);
    ctx.strokeStyle = 'rgba(255,255,255,.8)';
    ctx.lineWidth = 1.5;
    const cropWidth = cropBottomRight[0] - cropTopLeft[0];
    const cropHeight = cropBottomRight[1] - cropTopLeft[1];
    ctx.strokeRect(cropTopLeft[0], cropTopLeft[1], cropWidth, cropHeight);
    ctx.setLineDash([]);
  }

  // The Crop step: everything outside the crop dimmed, the crop box, thirds while dragging, and
  // the handles.
  function drawCropGuides(ctx, view, cropTopLeft, cropBottomRight) {
    const [left, top] = cropTopLeft;
    const [right, bottom] = cropBottomRight;
    ctx.fillStyle = CONFIG.colors.dim;
    ctx.beginPath();
    ctx.rect(0, 0, app.cssWidth, app.cssHeight);
    ctx.rect(left, top, right - left, bottom - top);
    ctx.fill('evenodd');
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(left, top, right - left, bottom - top);
    if (app.gesture && app.gesture.type === 'crop') {
      ctx.strokeStyle = CONFIG.colors.thirds;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 1; i < 3; i++) {
        const x = left + (right - left) * i / 3;
        const y = top + (bottom - top) * i / 3;
        ctx.moveTo(x, top);
        ctx.lineTo(x, bottom);
        ctx.moveTo(left, y);
        ctx.lineTo(right, y);
      }
      ctx.stroke();
    }
    for (const handle of CF.cropHandles(view)) {
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = 'rgba(0,0,0,.6)';
      ctx.lineWidth = 1.5;
      // Corner handles are larger than side handles.
      const half = handle.part.length === 2 ? 7 : 5;
      ctx.beginPath();
      ctx.rect(handle.point[0] - half, handle.point[1] - half, 2 * half, 2 * half);
      ctx.fill();
      ctx.stroke();
    }
  }

  /* ---------- mini result preview (Perspective panel) ---------- */
  let isMiniQueued = false;
  function requestMini() {
    if (isMiniQueued || app.tab !== 'perspective') return;
    isMiniQueued = true;
    requestAnimationFrame(() => {
      isMiniQueued = false;
      drawMini();
    });
  }

  // The corrected card with 15% padding, warped from the thumbnail: mini px → perspective px →
  // source px → thumbnail px.
  function drawMini() {
    const canvas = elements.mini;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !app.img) return;
    const pixelRatio = Math.min(2, window.devicePixelRatio || 1);
    const size = Math.round(rect.width * pixelRatio);
    if (canvas.width !== size) {
      canvas.width = size;
      canvas.height = size;
    }
    const ctx = context2d(canvas);
    ctx.fillStyle = CONFIG.theme.stage;
    ctx.fillRect(0, 0, size, size);
    const geometry = app.geometry;
    if (!geometry || !geometry.ok) return;
    const box = Quad.boundingBox(geometry.cardPerspective);
    const padding = 0.15 * Math.max(box.width, box.height);
    const side = Math.max(box.width, box.height) + 2 * padding;
    const miniScale = size / side;
    const originX = (box.left + box.right) / 2 - side / 2;
    const originY = (box.top + box.bottom) / 2 - side / 2;
    const perspectiveToSource = Mat3.invert(geometry.sourceToPerspective);
    if (!perspectiveToSource) return;
    const miniToThumb = Mat3.chain(
      Mat3.scale(app.thumb.scale),
      perspectiveToSource,
      Mat3.translate(originX, originY),
      Mat3.scale(1 / miniScale),
    );
    const pixels = new ImageData(size, size);
    const fill = app.state.export.fill === 'transparent' ? '#2b2b2b' : app.state.export.fill;
    CardEngine.warp(pixels, app.thumb.data, miniToThumb, { fill: fillRgba(fill) });
    ctx.putImageData(pixels, 0, 0);
  }

  Object.assign(CF, {
    fitView,
    currentView,
    toScreen,
    toWorld,
    zoomAt,
    fitCurrent,
    requestRender,
    resizeCanvas,
    fillRgba,
    ensurePerspectivePreview,
    draw,
    setScreen,
    handlePosition,
    loupeRadius,
    loupeCenter,
    drawLoupeRim,
    requestMini,
    MIN_ZOOM,
    MAX_ZOOM,
  });
})(window.CF);
