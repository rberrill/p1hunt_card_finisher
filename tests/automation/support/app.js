// Helpers that drive the app the way a person would: open the page, choose a photo, go to a
// step, drag on the photo. They read the app's state only through its test hook,
// window.__straightener, and through CF.
'use strict';
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../..');
// How many moves a drag is split into, so the app sees a drag and not a jump.
const DRAG_MOVES = 8;
// How long a photo may take to open and be detected before the case gives up.
const OPEN_TIMEOUT_MS = 20000;
// How long to wait for a question card to show before deciding none was asked.
const QUESTION_WAIT_MS = 1500;
// The pointer id of a dispatched finger (touchDrag). Any number a real pointer is unlikely to
// have.
const DISPATCHED_POINTER_ID = 7;
// A color channel above this (0 to 255) counts as white for hasWhiteFill. The app's white is
// #f2f2f3 (242).
const WHITE_FILL_MIN = 230;
// The image types a saved file can have, by its extension.
const MIME_TYPES = { '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };

// The full path of a sample photo.
const samplePath = name => path.join(root, 'samples', name);

// Opens the app and waits until its test hook is there.
async function openApp(page, address = 'index.html') {
  await page.goto(address);
  await page.waitForFunction(() => !!window.__straightener);
}

// Chooses a sample photo through the app's own file input and waits until it is open and
// detection has finished. It works for a second photo too: the photo open before is kept in a
// variable of the test's own on the page, and the wait is for a different one.
async function openPhoto(page, name) {
  await page.evaluate(() => {
    window.testPhotoBefore = window.__straightener.app.img;
  });
  await page.setInputFiles('#fileInput', samplePath(name));
  try {
    await page.waitForFunction(photoName => {
      // Each photo starts a fresh detection record. detection.running counts the runs started
      // for it (it never goes back down); a run that has finished clears detection.message.
      const app = window.__straightener.app;
      const isNewPhoto = !!app.img && app.img !== window.testPhotoBefore;
      const isDetected = app.detection.running > 0 && app.detection.message === '';
      const isThisPhoto = !!app.state && app.state.source.name === photoName;
      return isNewPhoto && !!app.geometry && isThisPhoto && isDetected;
    }, name, { timeout: OPEN_TIMEOUT_MS });
  } catch (error) {
    const seen = await page.evaluate(() => {
      const app = window.__straightener.app;
      return JSON.stringify({
        hasPhoto: !!app.img,
        hasGeometry: !!app.geometry,
        detectionsRunning: app.detection.running,
        candidates: app.detection.candidates.length,
        message: app.detection.message,
      });
    });
    throw new Error(`The photo ${name} did not finish opening. The app's state: ${seen}`);
  }
}

// Goes to a step by its tab (the tab bar on a phone, the top bar on a wide screen). Pass the
// hand from handFor so a phone target is tapped with a finger; without it the tab is clicked.
async function goToStep(page, step, hand = null) {
  const tab = page.locator(`[data-step="${step}"]:visible`).first();
  await (hand ? hand.tap(tab) : tab.click());
  await page.waitForFunction(wanted => window.__straightener.app.tab === wanted, step);
}

// A copy of the app's edit state.
function editState(page) {
  return page.evaluate(() => JSON.parse(JSON.stringify(window.__straightener.app.state)));
}

// Where a corner handle is on the page, in CSS pixels. index: 0 to 3, top-left first.
function cornerOnPage(page, index) {
  return page.evaluate(cornerIndex => {
    const app = window.__straightener.app;
    const [x, y] = window.CF.toScreen(window.CF.currentView(), app.state.corners[cornerIndex]);
    const box = document.getElementById('view').getBoundingClientRect();
    return { x: box.left + x, y: box.top + y };
  }, index);
}

// Drags with the mouse from one page point to another.
async function mouseDrag(page, start, end) {
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y, { steps: DRAG_MOVES });
  await page.mouse.up();
}

// Drags with one finger from one page point to another, by dispatching touch pointer events
// on an element: the photo unless `selector` names another (the Straighten ruler, say). They
// are not trusted events, which the app does not check.
// A dispatched pointer is not one the browser knows, so setPointerCapture would throw where a
// real finger's would not. For the length of the drag it is made to ignore that one pointer:
// the events go to the element anyway, which is what capture is for.
async function touchDrag(page, start, end, selector = '#view') {
  await page.evaluate(({ from, target, moves, targetSelector, pointerId }) => {
    const element = document.querySelector(targetSelector);
    const capture = Element.prototype.setPointerCapture;
    Element.prototype.setPointerCapture = function captureUnlessDispatched(id) {
      if (id !== pointerId) capture.call(this, id);
    };
    const send = (type, x, y) => element.dispatchEvent(new PointerEvent(type, {
      pointerId,
      pointerType: 'touch',
      isPrimary: true,
      clientX: x,
      clientY: y,
      bubbles: true,
      cancelable: true,
      buttons: type === 'pointerup' ? 0 : 1,
    }));
    try {
      send('pointerdown', from.x, from.y);
      for (let i = 1; i <= moves; i++) {
        const fraction = i / moves;
        send(
          'pointermove',
          from.x + (target.x - from.x) * fraction,
          from.y + (target.y - from.y) * fraction,
        );
      }
      send('pointerup', target.x, target.y);
    } finally {
      Element.prototype.setPointerCapture = capture;
    }
  }, {
    from: start,
    target: end,
    moves: DRAG_MOVES,
    targetSelector: selector,
    pointerId: DISPATCHED_POINTER_ID,
  });
}

// How a person presses on this target: a finger on a phone target (it has touch), the mouse on
// a wide one. hand.tap(locator) taps or clicks a control; hand.drag(start, end, selector) drags
// between two page points, on the photo unless selector names another element.
//   const hand = handFor(page, testInfo);
function handFor(page, testInfo) {
  const isTouch = !!testInfo.project.use.hasTouch;
  return {
    isTouch,
    tap: locator => (isTouch ? locator.tap() : locator.click()),
    drag: (start, end, selector) => (isTouch
      ? touchDrag(page, start, end, selector)
      : mouseDrag(page, start, end)),
  };
}

// The middle of an element on the page, in CSS pixels.
async function middleOf(locator) {
  const box = await locator.boundingBox();
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

// Shows a step's options: on a phone it taps the Options tab on the control area's top edge and
// waits for the sheet to finish rising; on a wide screen they are always shown, so it does
// nothing. step: 'rotate', 'crop' and so on.
async function openOptions(page, hand, step) {
  const sheet = page.locator(`#${step}Sheet`);
  if (await sheet.locator('.sheet-body').isVisible()) return;
  await hand.tap(page.locator(`#${step}AreaGrabber`));
  await page.waitForFunction(
    id => window.CF.isSheetOpen(document.getElementById(id)),
    `${step}Sheet`,
  );
  await sheet.locator('.sheet-close').waitFor({ state: 'visible' });
}

// Closes a step's options sheet on a phone with its Close button and waits until it has gone
// (its layer is hidden once the slide ends). On a wide screen, where the options stay shown,
// it does nothing.
async function closeOptions(page, hand, step) {
  const sheet = page.locator(`#${step}Sheet`);
  const close = sheet.locator('.sheet-close');
  if (!(await close.isVisible())) return;
  await hand.tap(close);
  await sheet.waitFor({ state: 'hidden' });
}

// Taps Download on the Export step, answers the Upscale question if it is asked (with
// `upscaleAnswer`, 'No' by default) and waits for the file. Returns { name, file }: the name
// the app gave it and the path of the saved copy.
async function saveByDownload(page, hand, upscaleAnswer = 'No') {
  const downloading = page.waitForEvent('download');
  await hand.tap(page.locator('#btnDownload'));
  const card = page.locator('#pairPrompt');
  // Either the file comes, or the question is asked first.
  const isAsked = await Promise.race([
    downloading.then(() => false),
    card.waitFor({ state: 'visible' }).then(() => true, () => false),
  ]);
  if (isAsked) await hand.tap(card.getByRole('button', { name: upscaleAnswer, exact: true }));
  const download = await downloading;
  return { name: download.suggestedFilename(), file: await download.path() };
}

// Reads a saved image file in the page. Returns { width, height, corners, cells }: its size in
// px; the [r, g, b, a] (0 to 255) of its four corner pixels, top-left first, clockwise; and,
// when gridSize is given, the mean [r, g, b, a] of each cell of a gridSize x gridSize grid laid
// over it, row by row from the top-left.
async function readSavedImage(page, file, gridSize = 0) {
  const type = MIME_TYPES[path.extname(file).toLowerCase()] || 'image/jpeg';
  const base64 = fs.readFileSync(file).toString('base64');
  return page.evaluate(async ({ data, mimeType, cellsPerSide }) => {
    const bytes = Uint8Array.from(atob(data), character => character.charCodeAt(0));
    const bitmap = await createImageBitmap(new Blob([bytes], { type: mimeType }));
    const { width, height } = bitmap;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(bitmap, 0, 0);
    const pixels = ctx.getImageData(0, 0, width, height).data;
    const pixelAt = (x, y) => {
      const offset = (y * width + x) * 4;
      return Array.from(pixels.slice(offset, offset + 4));
    };
    const corners = [
      pixelAt(0, 0),
      pixelAt(width - 1, 0),
      pixelAt(width - 1, height - 1),
      pixelAt(0, height - 1),
    ];
    // Each cell's running totals: red, green, blue, alpha, then the pixel count.
    const sums = Array.from({ length: cellsPerSide * cellsPerSide }, () => [0, 0, 0, 0, 0]);
    const rowsToRead = cellsPerSide ? height : 0;
    for (let y = 0; y < rowsToRead; y++) {
      const cellRow = Math.floor(y * cellsPerSide / height);
      for (let x = 0; x < width; x++) {
        const sum = sums[cellRow * cellsPerSide + Math.floor(x * cellsPerSide / width)];
        const offset = (y * width + x) * 4;
        for (let channel = 0; channel < 4; channel++) sum[channel] += pixels[offset + channel];
        sum[4] += 1;
      }
    }
    const cells = sums.map(sum => sum.slice(0, 4).map(total => total / sum[4]));
    return { width, height, corners, cells };
  }, { data: base64, mimeType: type, cellsPerSide: gridSize });
}

// Where points of the original photo (source px) are in the straightened picture: the frame
// that Rotate turns, flips and tilts, and that the crop is drawn in. Returns { width, height,
// points }: the picture's size and each point's [x, y] in it, in the picture's px. A person
// sees the same thing as where that part of the photo has moved to on screen.
function pictureOf(page, sourcePoints) {
  return page.evaluate(points => {
    const geometry = window.__straightener.app.geometry;
    return {
      width: geometry.rotated.width,
      height: geometry.rotated.height,
      points: points.map(([x, y]) => window.CF.Mat3.apply(geometry.sourceToRotated, x, y)),
    };
  }, sourcePoints);
}

// The crop box as it is drawn on this step: { x, y, width, height } in the straightened
// picture's px (see pictureOf), and its middle on the page in CSS pixels, for a drag.
function cropBox(page) {
  return page.evaluate(() => {
    const crop = window.__straightener.app.geometry.crop;
    const middle = [crop.x + crop.width / 2, crop.y + crop.height / 2];
    const [x, y] = window.CF.toScreen(window.CF.currentView(), middle);
    const view = document.getElementById('view').getBoundingClientRect();
    return {
      x: crop.x,
      y: crop.y,
      width: crop.width,
      height: crop.height,
      middleOnPage: { x: view.left + x, y: view.top + y },
    };
  });
}

// Waits until nothing on the page is moving: no transition or finite animation still running
// (a step change fades the control rows in, a sheet slides). Call it before check.eye, so the
// screenshot shows the screen at rest.
async function waitForStill(page) {
  await page.waitForFunction(() => document.getAnimations().every(animation => {
    const hasEnd = animation.effect.getComputedTiming().endTime !== Infinity;
    return animation.playState !== 'running' || !hasEnd;
  }));
}

// True when a control has the app's selected look, a solid white fill: its background's red,
// green and blue are all above WHITE_FILL_MIN.
async function hasWhiteFill(locator) {
  const color = await locator.evaluate(element => getComputedStyle(element).backgroundColor);
  const channels = (color.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
  return channels.length === 3 && channels.every(channel => channel > WHITE_FILL_MIN);
}

// Answers the question card (Upscale to N px?, Unpair, New photo) if one is showing.
async function answerQuestion(page, answer) {
  const card = page.locator('#pairPrompt');
  // The card arrives a frame or two after the tap that asks, so give it a moment to show.
  const isAsked = await card.waitFor({ state: 'visible', timeout: QUESTION_WAIT_MS })
    .then(() => true, () => false);
  if (isAsked) await card.getByRole('button', { name: answer, exact: true }).click();
}

module.exports = {
  root,
  samplePath,
  openApp,
  openPhoto,
  goToStep,
  editState,
  cornerOnPage,
  mouseDrag,
  touchDrag,
  handFor,
  middleOf,
  openOptions,
  closeOptions,
  answerQuestion,
  saveByDownload,
  readSavedImage,
  pictureOf,
  cropBox,
  waitForStill,
  hasWhiteFill,
};
