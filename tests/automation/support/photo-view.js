// Helpers for the photo view cases (tests/automation/photo-view.spec.js): where the photo sits
// in the photo area, the mouse wheel, the pointer's shape, fingers by id, and what the photo
// area's drawing holds. Like app.js, they drive the app as a person would and read its state only
// through window.__straightener and CF, to check a result.
'use strict';
const { sendTouch } = require('./perspective.js');

// Pointer ids for a third dispatched finger: the first two are perspective.js's (21 and 22).
const FIRST_FINGER = 21;
const SECOND_FINGER = 22;
const THIRD_FINGER = 23;
// How many moves a dispatched finger's slide is split into.
const SLIDE_MOVES = 8;

// The gaps between what the current step shows and the photo area's edges, in CSS px:
// { left, right, top, bottom, areaWidth, areaHeight }. What it shows: the photo itself on
// Perspective, the straightened frame on Rotate and Crop, the crop on Levels, Overlay and Export.
function photoGaps(page) {
  return page.evaluate(() => {
    const app = window.__straightener.app;
    const view = window.CF.currentView();
    const isFramed = ['levels', 'overlay', 'export'].includes(app.tab);
    let world = { x: 0, y: 0, width: app.img.width, height: app.img.height };
    if (app.tab !== 'perspective' || app.previewMode) {
      const rotated = app.geometry.rotated;
      world = isFramed
        ? app.geometry.crop
        : { x: 0, y: 0, width: rotated.width, height: rotated.height };
    }
    const [left, top] = window.CF.toScreen(view, [world.x, world.y]);
    const [right, bottom] = window.CF.toScreen(view,
      [world.x + world.width, world.y + world.height]);
    return {
      left,
      right: app.cssWidth - right,
      top,
      bottom: app.cssHeight - bottom,
      areaWidth: app.cssWidth,
      areaHeight: app.cssHeight,
    };
  });
}

// The point of the picture (in its own px) under a point of the page.
function worldUnder(page, point) {
  return page.evaluate(({ x, y }) => {
    const box = document.getElementById('view').getBoundingClientRect();
    return window.CF.toWorld(window.CF.currentView(), [x - box.left, y - box.top]);
  }, point);
}

// Rolls the mouse wheel by deltaY px at a point of the page (negative zooms in), holding Ctrl
// when isCtrl.
async function wheelAt(page, point, deltaY, isCtrl = false) {
  await page.mouse.move(point.x, point.y);
  if (isCtrl) await page.keyboard.down('Control');
  await page.mouse.wheel(0, deltaY);
  if (isCtrl) await page.keyboard.up('Control');
  // The wheel's redraw waits for the next frame.
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));
}

// The mouse pointer's shape over the photo, as the app sets it ('grab', 'move', 'crosshair'…).
const pointerShape = page => page.evaluate(() => document.getElementById('view').style.cursor);

// A point of the photo area, from its top-left corner, in page CSS px.
async function pointInPhoto(page, dx, dy) {
  const box = await page.locator('#view').boundingBox();
  return { x: box.x + dx, y: box.y + dy };
}

// Slides one dispatched finger (pointer id `id`) from `start` by (dx, dy) CSS px on the photo,
// without putting it down or lifting it.
async function slideFinger(page, id, start, dx, dy) {
  for (let i = 1; i <= SLIDE_MOVES; i++) {
    const point = { x: start.x + dx * i / SLIDE_MOVES, y: start.y + dy * i / SLIDE_MOVES };
    await sendTouch(page, '#view', 'pointermove', point, id);
  }
  return { x: start.x + dx, y: start.y + dy };
}

// Puts finger `id` down on the photo at `point`.
const fingerDown = (page, id, point) => sendTouch(page, '#view', 'pointerdown', point, id);

// Lifts finger `id` from the photo at `point`.
const fingerUp = (page, id, point) => sendTouch(page, '#view', 'pointerup', point, id);

// The photo area's drawing: its size in device pixels and the photo area's in CSS px.
function drawingSize(page) {
  return page.evaluate(() => {
    const canvas = document.getElementById('view');
    const box = canvas.getBoundingClientRect();
    return {
      width: canvas.width,
      height: canvas.height,
      cssWidth: box.width,
      cssHeight: box.height,
    };
  });
}

// The colors drawn in a square of the photo area around a point of the picture (its own px),
// as [r, g, b] strings, each once. radiusPx: half the square's side, in CSS px.
function colorsAround(page, worldPoint, radiusPx = 4) {
  return page.evaluate(({ point, radius }) => {
    const app = window.__straightener.app;
    const canvas = document.getElementById('view');
    const [x, y] = window.CF.toScreen(window.CF.currentView(), point);
    const ratio = app.devicePixelRatio;
    const size = Math.round(2 * radius * ratio);
    const ctx = canvas.getContext('2d');
    const pixels = ctx.getImageData(Math.round((x - radius) * ratio),
      Math.round((y - radius) * ratio), size, size).data;
    const colors = new Set();
    for (let i = 0; i < pixels.length; i += 4) {
      colors.add(`${pixels[i]},${pixels[i + 1]},${pixels[i + 2]}`);
    }
    return [...colors];
  }, { point: worldPoint, radius: radiusPx });
}

// The share of the photo area's drawing (0 to 1) that is the stage's own grey: 1 when nothing
// but the empty stage (and, at most, a line of text) is drawn.
function stageShare(page) {
  return page.evaluate(() => {
    const canvas = document.getElementById('view');
    const ctx = canvas.getContext('2d');
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const stage = CONFIG.theme.stage;
    const [red, green, blue] = [1, 3, 5]
      .map(start => parseInt(stage.slice(start, start + 2), 16));
    let count = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i] === red && pixels[i + 1] === green && pixels[i + 2] === blue) count += 1;
    }
    return count / (pixels.length / 4);
  });
}

// A color channel further than this (0 to 255) from a reference drawing counts as a different
// pixel (drawnSource).
const PIXEL_DIFFERENCE_MIN = 8;

// Which of its two sources a square of the photo area's drawing was drawn from: the
// full-resolution photo or the smaller on-screen copy. Each is drawn here at the same zoom,
// place and smoothing as the app draws. `point` is the square's middle on the page and
// `radiusPx` half its side, in CSS px. Returns { fromPhoto, fromCopy }: the share (0 to 1) of
// the square's device pixels that differ from each. A pixel that differs from both is left out:
// it is the outline or a handle drawn over the photo. The source the app drew differs nowhere.
function drawnSource(page, point, radiusPx) {
  return page.evaluate(({ middle, radius, differenceMin }) => {
    const app = window.__straightener.app;
    const view = window.CF.currentView();
    const canvas = document.getElementById('view');
    const box = canvas.getBoundingClientRect();
    const ratio = app.devicePixelRatio;
    const size = Math.round(2 * radius * ratio);
    const left = Math.round((middle.x - box.left - radius) * ratio);
    const top = Math.round((middle.y - box.top - radius) * ratio);
    const drawn = canvas.getContext('2d').getImageData(left, top, size, size).data;
    // The same square drawn from `source`, stretched over the whole photo as the app draws it.
    const drawFrom = source => {
      const copy = document.createElement('canvas');
      copy.width = size;
      copy.height = size;
      const ctx = copy.getContext('2d');
      const scale = ratio * view.zoom;
      ctx.setTransform(scale, 0, 0, scale, ratio * view.panX - left, ratio * view.panY - top);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(source, 0, 0, app.img.width, app.img.height);
      return ctx.getImageData(0, 0, size, size).data;
    };
    const fromPhoto = drawFrom(app.img.el);
    const fromCopy = drawFrom(app.preview.canvas);
    const differs = (reference, i) => [0, 1, 2]
      .some(channel => Math.abs(drawn[i + channel] - reference[i + channel]) > differenceMin);
    let photoCount = 0;
    let copyCount = 0;
    let counted = 0;
    for (let i = 0; i < drawn.length; i += 4) {
      const isPhotoDifferent = differs(fromPhoto, i);
      const isCopyDifferent = differs(fromCopy, i);
      if (isPhotoDifferent && isCopyDifferent) continue;
      counted += 1;
      if (isPhotoDifferent) photoCount += 1;
      if (isCopyDifferent) copyCount += 1;
    }
    return { fromPhoto: photoCount / counted, fromCopy: copyCount / counted };
  }, { middle: point, radius: radiusPx, differenceMin: PIXEL_DIFFERENCE_MIN });
}

// Records, in the page, every line of text drawn on a canvas from the moment it opens, in
// window.testDrawnTexts: the words in the photo area are drawn, so no element holds them. Call
// it before the app is opened.
function recordDrawnText(page) {
  return page.addInitScript(() => {
    window.testDrawnTexts = [];
    const fillText = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function recordFillText(text, ...rest) {
      window.testDrawnTexts.push(String(text));
      return fillText.call(this, text, ...rest);
    };
  });
}

// The lines of text recordDrawnText has seen drawn since the last call, in order.
function drawnTextsSoFar(page) {
  return page.evaluate(() => window.testDrawnTexts.splice(0));
}

module.exports = {
  recordDrawnText,
  drawnTextsSoFar,
  drawnSource,
  FIRST_FINGER,
  SECOND_FINGER,
  THIRD_FINGER,
  photoGaps,
  worldUnder,
  wheelAt,
  pointerShape,
  pointInPhoto,
  slideFinger,
  fingerDown,
  fingerUp,
  drawingSize,
  colorsAround,
  stageShare,
};
