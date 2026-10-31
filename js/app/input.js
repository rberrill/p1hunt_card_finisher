/* =====================================================================
   js/app/input.js: pointer and keyboard input. Handles, the crop box, pan, pinch, wheel,
   snapping and nudges. On the Overlay step everything routes to overlay.js.
   Shell modules share one namespace, CF (created in core.js). Names from core are
   destructured below; anything from another module is called as CF.name.
   tests/selftest.js checks these boundaries.
   ===================================================================== */
(function (CF) {
  'use strict';
  const { Vec2, elements, clone, app } = CF;

  // A press shorter than this, without moving, is a tap.
  const TAP_MS = 300;
  // Two taps within this time (and DOUBLE_TAP_RADIUS_PX) are a double tap.
  const DOUBLE_TAP_MS = 320;
  const DOUBLE_TAP_HANDLE_MS = 350;
  const DOUBLE_TAP_RADIUS_PX = 24;
  // A pointer that moves further than this has dragged.
  const DRAG_THRESHOLD_PX = 4;
  // A snap line must run within this angle of the edge being dragged.
  const SNAP_PARALLEL_DEG = 3;

  // The steps in keyboard order (keys 1–6).
  const STEP_ORDER = ['perspective', 'rotate', 'crop', 'levels', 'overlay', 'export'];
  const ARROW_DIRECTIONS = {
    ArrowLeft: [-1, 0],
    ArrowRight: [1, 0],
    ArrowUp: [0, -1],
    ArrowDown: [0, 1],
  };

  /* ---------- pointer input: handles, crop box, pan, pinch, wheel ---------- */
  // Pointers currently down, by id → screen point.
  const pointers = new Map();
  let lastTap = { time: 0, x: 0, y: 0 };
  let lastHandleTap = { time: 0, handleIndex: -1 };

  // The event's position in CSS px from the canvas's top-left.
  function localPoint(event) {
    const rect = elements.canvas.getBoundingClientRect();
    return [event.clientX - rect.left, event.clientY - rect.top];
  }

  // The perspective handle under a screen point: 0–3 corners, 4–7 edge midpoints, or −1.
  // Corners win over edges.
  function hitHandle(view, point) {
    const quad = app.state.corners.map(corner => CF.toScreen(view, corner));
    let best = -1;
    let bestDistance = CONFIG.handle.hitRadius;
    quad.forEach((corner, k) => {
      const distance = Vec2.distance(corner, point);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = k;
      }
    });
    if (best >= 0) return best;
    for (let k = 0; k < 4; k++) {
      const distance = Vec2.distance(Vec2.midpoint(quad[k], quad[(k + 1) % 4]), point);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = 4 + k;
      }
    }
    return best;
  }

  // The crop box's eight handles in screen px: [{ part ('nw', 'n', …), point }].
  function cropHandles(view) {
    const crop = app.geometry.crop;
    const [left, top] = CF.toScreen(view, [crop.x, crop.y]);
    const [right, bottom] = CF.toScreen(view, [crop.x + crop.width, crop.y + crop.height]);
    const middleX = (left + right) / 2;
    const middleY = (top + bottom) / 2;
    return [
      { part: 'nw', point: [left, top] },
      { part: 'ne', point: [right, top] },
      { part: 'se', point: [right, bottom] },
      { part: 'sw', point: [left, bottom] },
      { part: 'n', point: [middleX, top] },
      { part: 'e', point: [right, middleY] },
      { part: 's', point: [middleX, bottom] },
      { part: 'w', point: [left, middleY] },
    ];
  }

  // What a press on the Crop step grabs: a handle's part, 'move' inside the box, or null.
  function hitCrop(view, point) {
    let best = null;
    let bestDistance = CONFIG.handle.hitRadius;
    for (const handle of cropHandles(view)) {
      const distance = Vec2.distance(handle.point, point);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = handle.part;
      }
    }
    if (best) return best;
    const crop = app.geometry.crop;
    const [x, y] = CF.toWorld(view, point);
    const isInside = x > crop.x
      && x < crop.x + crop.width
      && y > crop.y
      && y < crop.y + crop.height;
    return isInside ? 'move' : null;
  }

  const hasGeometry = () => app.geometry && app.geometry.ok;

  // Starts the gesture a press begins: pinch (second finger), handle, crop, dropper or pan.
  function onPointerDown(event) {
    if (!app.img) return;
    elements.canvas.focus({ preventScroll: true });
    try {
      elements.canvas.setPointerCapture(event.pointerId);
    } catch (error) { /* the pointer is already gone */ }
    const point = localPoint(event);
    pointers.set(event.pointerId, point);
    const view = CF.currentView();
    if (!view) return;
    if (app.tab === 'overlay') {
      CF.overlayPointerDown(point, [...pointers.values()]);
      return;
    }
    if (pointers.size === 2) {
      // A second finger turns any drag into a pinch.
      endGesture();
      const [first, second] = [...pointers.values()];
      app.gesture = {
        type: 'pinch',
        startDistance: Vec2.distance(first, second),
        startMidpoint: Vec2.midpoint(first, second),
        startView: { ...view },
      };
      return;
    }
    if (pointers.size > 2) return;
    const base = {
      start: point,
      last: point,
      startTime: performance.now(),
      pointerType: event.pointerType,
      moved: false,
    };
    if (app.tab === 'perspective' && !app.previewMode) {
      if (app.findMode) {
        // Find card is armed: a still tap finds the card (onPointerUp); a drag pans as usual
        // and never grabs a handle.
        app.gesture = Object.assign(base, {
          type: 'pan',
          isFind: true,
          startView: { panX: view.panX, panY: view.panY },
        });
        return;
      }
      const handleIndex = hitHandle(view, point);
      if (handleIndex >= 0) {
        app.selected = handleIndex;
        app.gesture = Object.assign(base, {
          type: 'handle',
          handleIndex,
          startWorld: CF.toWorld(view, point),
          startCorners: clone(app.state.corners),
          before: clone(app.state),
        });
        CF.requestRender();
        return;
      }
    }
    if (app.tab === 'crop' && hasGeometry()) {
      const part = hitCrop(view, point);
      if (part) {
        app.gesture = Object.assign(base, {
          type: 'crop',
          part,
          startWorld: CF.toWorld(view, point),
          startCrop: { ...app.geometry.crop },
          before: clone(app.state),
          shiftHeld: event.shiftKey,
        });
        return;
      }
    }
    if (app.tab === 'levels' && app.dropper && hasGeometry()) {
      app.gesture = Object.assign(base, { type: 'dropper' });
      CF.requestRender();
      return;
    }
    app.gesture = Object.assign(base, {
      type: 'pan',
      startView: { panX: view.panX, panY: view.panY },
    });
    if (app.tab === 'levels' && hasGeometry()) {
      // Levels: press and hold the photo (without moving) to compare with no levels.
      const gesture = app.gesture;
      gesture.holdTimer = setTimeout(() => {
        if (app.gesture !== gesture || gesture.moved) return;
        gesture.comparing = true;
        CF.setCompare(true);
      }, CONFIG.levels.compareHoldMs);
    }
  }

  // Pinch: zoom by the change in finger distance, keeping the world point under the starting
  // midpoint under the current one.
  function pinchView(gesture, view) {
    const [first, second] = [...pointers.values()];
    const midpoint = Vec2.midpoint(first, second);
    const start = gesture.startView;
    const wanted = start.zoom * Vec2.distance(first, second) / gesture.startDistance;
    const zoom = Math.min(CF.MAX_ZOOM, Math.max(CF.MIN_ZOOM, wanted));
    const anchor = [
      (gesture.startMidpoint[0] - start.panX) / start.zoom,
      (gesture.startMidpoint[1] - start.panY) / start.zoom,
    ];
    Object.assign(view, {
      zoom,
      panX: midpoint[0] - anchor[0] * zoom,
      panY: midpoint[1] - anchor[1] * zoom,
      auto: false,
    });
  }

  function onPointerMove(event) {
    if (!pointers.has(event.pointerId)) {
      hoverCursor(event);
      return;
    }
    const point = localPoint(event);
    pointers.set(event.pointerId, point);
    const gesture = app.gesture;
    const view = CF.currentView();
    if (!gesture || !view) return;
    if (gesture.type.startsWith('overlay')) {
      CF.overlayPointerMove(gesture, point, [...pointers.values()]);
      return;
    }
    if (gesture.type === 'pinch') {
      if (pointers.size < 2) return;
      pinchView(gesture, view);
      CF.requestRender();
      return;
    }
    gesture.last = point;
    if (Vec2.distance(point, gesture.start) > DRAG_THRESHOLD_PX) gesture.moved = true;
    if (gesture.type === 'dropper') {
      CF.requestRender();
      return;
    }
    if (gesture.type === 'pan') {
      if (gesture.comparing) return;
      view.panX = gesture.startView.panX + point[0] - gesture.start[0];
      view.panY = gesture.startView.panY + point[1] - gesture.start[1];
      view.auto = false;
      CF.requestRender();
      return;
    }
    const world = CF.toWorld(view, point);
    const dx = world[0] - gesture.startWorld[0];
    const dy = world[1] - gesture.startWorld[1];
    if (gesture.type === 'handle') {
      moveHandle(gesture.handleIndex, gesture.startCorners, dx, dy, view);
      CF.liveChanged();
    } else if (gesture.type === 'crop') {
      dragCrop(gesture, dx, dy, event.shiftKey || gesture.shiftHeld);
      CF.liveChanged();
    }
  }

  // Double tap or double click on an empty part of the photo fits the view.
  function checkDoubleTap(gesture) {
    const time = performance.now();
    const point = gesture.start;
    const isDouble = time - lastTap.time < DOUBLE_TAP_MS
      && Math.hypot(point[0] - lastTap.x, point[1] - lastTap.y) < DOUBLE_TAP_RADIUS_PX;
    if (isDouble) {
      CF.fitCurrent();
      lastTap.time = 0;
    } else {
      lastTap = { time, x: point[0], y: point[1] };
    }
  }

  // Double tap a handle: zoom in on it; double tap again while zoomed in: fit the photo.
  function checkHandleDoubleTap(gesture) {
    const time = performance.now();
    const isDouble = lastHandleTap.handleIndex === gesture.handleIndex
      && time - lastHandleTap.time < DOUBLE_TAP_HANDLE_MS;
    if (isDouble) {
      zoomToHandle(gesture.handleIndex);
      lastHandleTap.time = 0;
    } else {
      lastHandleTap = { time, handleIndex: gesture.handleIndex };
    }
  }

  function onPointerUp(event) {
    if (!pointers.has(event.pointerId)) return;
    pointers.delete(event.pointerId);
    const gesture = app.gesture;
    if (gesture && gesture.type === 'pinch') {
      if (pointers.size === 0) app.gesture = null;
      return;
    }
    if (gesture && gesture.type === 'overlayPinch' && pointers.size === 1) {
      CF.overlayPinchEnded([...pointers.values()][0]);
      return;
    }
    // A tap on a snap ring.
    const isSpotTap = gesture
      && gesture.type === 'overlayMove'
      && gesture.spot
      && !gesture.moved
      && pointers.size === 0;
    if (isSpotTap) {
      CF.overlaySpotTap(gesture);
      return;
    }
    if (gesture && gesture.type.startsWith('overlay') && pointers.size > 0) return;
    // Find card: a still tap (however long) finds the card where the photo was tapped.
    const isFindTap = gesture && gesture.isFind && !gesture.moved && pointers.size === 0;
    if (isFindTap) {
      const view = CF.currentView();
      endGesture();
      if (view) CF.findCardAt(CF.toWorld(view, gesture.start));
      return;
    }
    const isTap =gesture && !gesture.moved && performance.now() - gesture.startTime < TAP_MS;
    if (isTap && gesture.type === 'pan') checkDoubleTap(gesture);
    if (isTap && gesture.type === 'handle') checkHandleDoubleTap(gesture);
    endGesture();
  }

  // Zooms to handleZoom × the fit scale centered on a handle, or back to fit if already zoomed.
  function zoomToHandle(handleIndex) {
    const view = CF.currentView();
    if (!view) return;
    const fitZoom = CF.fitView(app.img.width, app.img.height).zoom;
    if (view.zoom > fitZoom * 2) {
      app.views.source = null;
      CF.requestRender();
      return;
    }
    const handle = CF.handlePosition(app.state.corners, handleIndex);
    const zoom = Math.min(CF.MAX_ZOOM, fitZoom * CONFIG.handleZoom);
    Object.assign(view, {
      zoom,
      panX: app.cssWidth / 2 - handle[0] * zoom,
      panY: app.cssHeight / 2 - handle[1] * zoom,
      auto: false,
    });
    CF.requestRender();
  }

  // Ends the current gesture: stops a compare, drops a dropper pick, commits a drag.
  function endGesture() {
    const gesture = app.gesture;
    app.gesture = null;
    if (!gesture) return;
    clearTimeout(gesture.holdTimer);
    if (gesture.comparing) CF.setCompare(false);
    if (gesture.type === 'dropper') CF.pickAt(gesture.last);
    const isEdit = gesture.type === 'handle'
      || gesture.type === 'crop'
      || gesture.type.startsWith('overlay');
    if (isEdit && gesture.before) CF.commitFrom(gesture.before);
    CF.requestRender();
  }

  // An edge's unit normal, from start to end turned a quarter.
  function edgeNormal(start, end) {
    const length = Vec2.distance(start, end) || 1;
    return [-(end[1] - start[1]) / length, (end[0] - start[0]) / length];
  }

  // Moves an edge (corners k and k + 1) of `corners` by `distance` along its normal.
  function moveEdge(corners, k, start, end, normal, distance) {
    corners[k] = [start[0] + normal[0] * distance, start[1] + normal[1] * distance];
    corners[(k + 1) % 4] = [end[0] + normal[0] * distance, end[1] + normal[1] * distance];
  }

  // Drags handle `handleIndex` by (dx, dy) world px from where the drag started.
  function moveHandle(handleIndex, startCorners, dx, dy, view) {
    const state = app.state;
    if (handleIndex < 4) {
      let point = [startCorners[handleIndex][0] + dx, startCorners[handleIndex][1] + dy];
      if (app.snap) point = snapPoint(point, view);
      state.corners[handleIndex] = point;
      return;
    }
    // An edge handle moves the whole edge parallel to itself (along its normal).
    const k = handleIndex - 4;
    const start = startCorners[k];
    const end = startCorners[(k + 1) % 4];
    const normal = edgeNormal(start, end);
    let distance = dx * normal[0] + dy * normal[1];
    if (app.snap) distance = snapEdge(start, end, normal, distance, view);
    state.corners = startCorners.map(corner => corner.slice());
    moveEdge(state.corners, k, start, end, normal, distance);
  }

  // The nearest detected corner within snapRadiusPx (screen px) of a point, else the point.
  function snapPoint(point, view) {
    let best = null;
    let bestDistance = CONFIG.snapRadiusPx / view.zoom;
    for (const target of app.detection.snapPoints) {
      const distance = Vec2.distance(point, target);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = target;
      }
    }
    return best ? best.slice() : point;
  }

  // The edge's move distance snapped to the nearest parallel detected line within snapRadiusPx.
  function snapEdge(start, end, normal, distance, view) {
    const middle = [
      (start[0] + end[0]) / 2 + normal[0] * distance,
      (start[1] + end[1]) / 2 + normal[1] * distance,
    ];
    const minAlignment = Math.cos(SNAP_PARALLEL_DEG * Math.PI / 180);
    let best = distance;
    let bestGap = CONFIG.snapRadiusPx / view.zoom;
    for (const line of app.detection.snapLines) {
      const alignment = line.normalX * normal[0] + line.normalY * normal[1];
      if (Math.abs(alignment) < minAlignment) continue;
      const gap = line.normalX * middle[0] + line.normalY * middle[1] - line.offset;
      if (Math.abs(gap) < bestGap) {
        bestGap = Math.abs(gap);
        best = distance - gap / alignment;
      }
    }
    return best;
  }

  // Where the crop's anchor sits along one axis while resizing at a fixed ratio: the opposite
  // side for a side being dragged, else the middle.
  function anchorAlong(part, startSide, endSide, start, size) {
    if (part.includes(startSide)) return start + size;
    if (part.includes(endSide)) return start;
    return start + size / 2;
  }

  // The most room along one axis from the anchor, inside a frame of `frameSize`.
  function roomAlong(part, startSide, endSide, anchor, frameSize) {
    if (part.includes(startSide)) return anchor;
    if (part.includes(endSide)) return frameSize - anchor;
    return 2 * Math.min(anchor, frameSize - anchor);
  }

  // The new start of a span of `size` around the anchor.
  function startAlong(part, startSide, endSide, anchor, size) {
    if (part.includes(startSide)) return anchor - size;
    if (part.includes(endSide)) return anchor;
    return anchor - size / 2;
  }

  // Drags the crop box (rotated-frame px). shift keeps a free crop's aspect.
  function dragCrop(gesture, dx, dy, shift) {
    const state = app.state;
    const frameWidth = app.geometry.rotated.width;
    const frameHeight = app.geometry.rotated.height;
    const startCrop = gesture.startCrop;
    const minSize = CONFIG.crop.minSizePx;
    let ratio = CardEngine.cropRatio(state.crop, state.source.width, state.source.height);
    if (!ratio && shift) ratio = startCrop.width / startCrop.height;
    let left = startCrop.x;
    let top = startCrop.y;
    let right = startCrop.x + startCrop.width;
    let bottom = startCrop.y + startCrop.height;
    const part = gesture.part;
    if (part === 'move') {
      left = Math.min(Math.max(0, left + dx), frameWidth - startCrop.width);
      top = Math.min(Math.max(0, top + dy), frameHeight - startCrop.height);
      right = left + startCrop.width;
      bottom = top + startCrop.height;
    } else {
      if (part.includes('w')) left = Math.min(Math.max(0, left + dx), right - minSize);
      if (part.includes('e')) right = Math.max(Math.min(frameWidth, right + dx), left + minSize);
      if (part.includes('n')) top = Math.min(Math.max(0, top + dy), bottom - minSize);
      if (part.includes('s')) bottom = Math.max(Math.min(frameHeight, bottom + dy), top + minSize);
      if (ratio) {
        let width = right - left;
        let height = bottom - top;
        const isCorner = part.length === 2;
        if (isCorner) {
          if (width / height > ratio) width = height * ratio;
          else height = width / ratio;
        } else if (part === 'e' || part === 'w') {
          height = width / ratio;
        } else {
          width = height * ratio;
        }
        // The opposite corner or edge stays put; side handles stay centered on the other axis.
        const anchorX = anchorAlong(part, 'w', 'e', startCrop.x, startCrop.width);
        const anchorY = anchorAlong(part, 'n', 's', startCrop.y, startCrop.height);
        // Shrink to stay inside the frame.
        const maxWidth = roomAlong(part, 'w', 'e', anchorX, frameWidth);
        const maxHeight = roomAlong(part, 'n', 's', anchorY, frameHeight);
        const fit = Math.min(1, maxWidth / width, maxHeight / height);
        width *= fit;
        height *= fit;
        left = startAlong(part, 'w', 'e', anchorX, width);
        top = startAlong(part, 'n', 's', anchorY, height);
        right = left + width;
        bottom = top + height;
      }
    }
    setCropAbsolute({ x: left, y: top, width: right - left, height: bottom - top });
  }

  // Stores an absolute rotated-frame rect as the manual crop: center and size relative to the
  // frame's center, in units of the perspective frame's long side.
  function setCropAbsolute(rect) {
    const geometry = app.geometry;
    const unit = geometry.perspectiveLongSide;
    app.state.crop.mode = 'manual';
    app.state.crop.rect = {
      cx: (rect.x + rect.width / 2 - geometry.rotated.width / 2) / unit,
      cy: (rect.y + rect.height / 2 - geometry.rotated.height / 2) / unit,
      w: rect.width / unit,
      h: rect.height / unit,
    };
  }

  const RESIZE_CURSORS = {
    n: 'ns',
    s: 'ns',
    e: 'ew',
    w: 'ew',
    nw: 'nwse',
    se: 'nwse',
    ne: 'nesw',
    sw: 'nesw',
  };

  // The mouse cursor for what a press at this point would do.
  function hoverCursor(event) {
    if (event.pointerType !== 'mouse' || !app.img || app.gesture) return;
    const view = CF.currentView();
    const point = localPoint(event);
    let cursor = 'grab';
    if (view && app.tab === 'perspective' && !app.previewMode) {
      if (app.findMode) cursor = 'crosshair';
      else if (hitHandle(view, point) >= 0) cursor = 'move';
    } else if (view && app.tab === 'crop' && hasGeometry()) {
      const part = hitCrop(view, point);
      if (part === 'move') cursor = 'move';
      else if (part) cursor = RESIZE_CURSORS[part] + '-resize';
    }
    if (app.tab === 'levels' && app.dropper) cursor = 'crosshair';
    if (view && app.tab === 'overlay') cursor = CF.overlayCursor(view, point);
    elements.canvas.style.cursor = cursor;
  }

  // The wheel zooms about the cursor (faster with Ctrl, as trackpad pinches send). On the
  // Overlay step the photo stays framed and the wheel sizes the overlay.
  function onWheel(event) {
    if (!app.img) return;
    event.preventDefault();
    const view = CF.currentView();
    if (!view) return;
    const point = localPoint(event);
    const deltaY = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
    if (app.tab === 'overlay') {
      CF.overlayWheel(deltaY);
      return;
    }
    CF.zoomAt(view, point[0], point[1], Math.exp(-deltaY * (event.ctrlKey ? 0.01 : 0.0015)));
    CF.requestRender();
  }

  /* ---------- keyboard ---------- */

  // True when the event is the shortcut `spec`, such as 'mod+shift+z' (mod = Ctrl or ⌘).
  function keyMatches(event, spec) {
    const parts = spec.toLowerCase().split('+');
    const key = parts.pop();
    const isModifierDown = event.ctrlKey || event.metaKey;
    const isKey = event.key.toLowerCase() === key || (key === 'tab' && event.key === 'Tab');
    return isKey
      && parts.includes('mod') === isModifierDown
      && parts.includes('shift') === event.shiftKey;
  }

  function onKeyDown(event) {
    const target = event.target;
    const isField = tag => tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA';
    const isTyping = target && isField(target.tagName);
    // Undo and redo defer to the browser only inside the debug panel's tuning fields, where
    // native text undo is what you want. Sliders, toggles, buttons and the degrees box keep app
    // undo, since focus stays on them after use.
    const isTextEntry = target && target.closest && !!target.closest('#debugPanel')
      && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');
    const keys = CONFIG.keys;
    if (keyMatches(event, keys.undo)) {
      if (!isTextEntry) {
        event.preventDefault();
        CF.undo();
      }
      return;
    }
    if (keyMatches(event, keys.redo) || keyMatches(event, keys.redoAlt)) {
      if (!isTextEntry) {
        event.preventDefault();
        CF.redo();
      }
      return;
    }
    if (isTyping || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key === keys.debug) {
      CF.toggleDebugPanel();
      return;
    }
    if (!app.img) return;
    onPhotoKey(event, keys);
  }

  // Keys that act on an open photo: fit, compare, steps, overlay keys, handle cycling and nudges.
  function onPhotoKey(event, keys) {
    const key = event.key.toLowerCase();
    if (key === keys.fit) {
      CF.fitCurrent();
      return;
    }
    if (key === keys.compare && app.tab === 'levels') {
      if (!event.repeat) CF.setCompare(true);
      return;
    }
    if (/^[1-6]$/.test(event.key)) {
      CF.setTab(STEP_ORDER[+event.key - 1]);
      return;
    }
    if (app.tab === 'overlay') {
      if (CF.overlayKey(event)) event.preventDefault();
      return;
    }
    if (app.tab !== 'perspective') return;
    // Tab cycles handles only while the canvas (or nothing) has focus, so form navigation
    // still works.
    const focused = document.activeElement;
    const isCanvasFocused = focused === elements.canvas || focused === document.body;
    if (event.key === 'Tab' && isCanvasFocused) {
      event.preventDefault();
      app.selected = (app.selected + (event.shiftKey ? 7 : 1)) % 8;
      CF.requestRender();
      return;
    }
    const direction = ARROW_DIRECTIONS[event.key];
    if (direction && app.selected >= 0) {
      event.preventDefault();
      const step = event.shiftKey ? keys.nudgeShift : keys.nudge;
      const [dx, dy] = [direction[0] * step, direction[1] * step];
      CF.commit(state => moveHandleBy(state, app.selected, dx, dy), 'nudge');
    }
  }

  // Moves handle `handleIndex` by (dx, dy) source px; an edge handle moves along its normal.
  function moveHandleBy(state, handleIndex, dx, dy) {
    if (handleIndex < 4) {
      const corner = state.corners[handleIndex];
      state.corners[handleIndex] = [corner[0] + dx, corner[1] + dy];
      return;
    }
    const k = handleIndex - 4;
    const start = state.corners[k];
    const end = state.corners[(k + 1) % 4];
    const normal = edgeNormal(start, end);
    moveEdge(state.corners, k, start, end, normal, dx * normal[0] + dy * normal[1]);
  }

  Object.assign(CF, {
    ARROW_DIRECTIONS,
    DRAG_THRESHOLD_PX,
    cropHandles,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    setCropAbsolute,
    onWheel,
    onKeyDown,
    moveHandleBy,
  });
})(window.CF);
