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
// How long waitInPage waits for its check to come out true before giving up, in ms.
const WAIT_IN_PAGE_TIMEOUT_MS = 20000;
// How often waitInPage asks the page again, in ms.
const WAIT_IN_PAGE_POLL_MS = 100;
// How far past the bottom-right corner crossTheCorners drags the top-left one, in source px.
const CROSS_PAST_PX = 60;

// The full path of a sample photo.
const samplePath = name => path.join(root, 'samples', name);

// The lines of ruling R12's one Load edits warning, in the words Rich approved
// (tests/catalog/wording.md). R48: they apply to every load with a problem; R59: the logo's
// line says "Logo".
const RULED_EDITS_LINES = {
  loaded: 'Edits loaded.',
  logoLeftOut: 'Logo left out; it couldn’t be read.',
  savedFor: name => `Saved for “${name}”; sizes match.`,
  reset: fields => `Reset, not valid: ${fields}.`,
};

// What a finished save is called, in today's words and in ruling R79's ("THING ACTION: SIZE in
// N s.", tests/catalog/wording.md), by the kind of save: a single photo, a pair's Together
// image or its two files, the corner sheet, or the four corner photos. Today's words name the
// size only for a single photo; R79's name it for every kind, in words not yet approved beyond
// a single photo's "W × H px", so its pattern takes any size there.
const FINISHED_WORDS = {
  photo: { today: 'Exported ', ruled: 'Photo' },
  together: { today: 'Exported the Together image', ruled: 'Front and back' },
  separately: { today: 'Exported the front and back', ruled: 'Front and back' },
  cornerSheet: { today: 'Saved the corner sheet(?: at \\d+ px)?', ruled: 'Corner sheet' },
  cornerPhotos: { today: 'Saved 4 corner shots(?: at \\d+ px)?', ruled: '4 corner photos' },
};

// A text made safe to put in a regular expression as it is.
const asPattern = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Ruling R79's finished message, exactly: "THING ACTION: SIZE in N s." kind: a key of
// FINISHED_WORDS; action: 'downloaded' or 'shared'; size: the size the message must give
// ('1074 × 1074 px'), or null for any. The seconds are its first group. Only the one case
// that owns each kind of message holds the app to these words (and is marked as a known
// defect until R79 is built); every other case reads the message with finishedMessage.
function ruledFinishedMessage(kind, action, size = null) {
  const sizeText = size === null ? '.+' : asPattern(size);
  const thing = asPattern(FINISHED_WORDS[kind].ruled);
  return new RegExp(`^${thing} ${action}: ${sizeText} in (\\d+\\.\\d) s\\.$`);
}

// A finished message in today's words or ruling R79's, for a case that reads only the size or
// the time from it: it passes before and after R79 is built. kind: a key of FINISHED_WORDS;
// size: for a single photo, the size it must give ('2000 × 2000 px'), or null for any. The
// seconds are its first group. It matches the start of the message, so a note may follow.
function finishedMessage(kind, size = null) {
  const words = FINISHED_WORDS[kind];
  const sizeText = size === null ? '.+?' : asPattern(size);
  const today = kind === 'photo' ? `${words.today}${sizeText}` : words.today;
  const ruled = `${asPattern(words.ruled)} (?:downloaded|shared): ${sizeText}`;
  return new RegExp(`^(?:${today}|${ruled}) in (\\d+\\.\\d) s\\.`);
}

// Copy's message in today's words ("Copied to clipboard (PNG).") or ruling R79's ("Photo
// copied (PNG)." for a single photo, "Front and back copied (PNG)." for a pair), for a case
// that only needs to know the copy finished. isPair: true for a pair's joined image.
function copiedMessage(isPair = false) {
  const thing = isPair ? 'Front and back' : 'Photo';
  return new RegExp(`^(?:Copied to clipboard|${thing} copied) \\(PNG\\)\\.$`);
}

// Ruling R79's Copy message, exactly. isPair: true for a pair's joined image.
function ruledCopiedMessage(isPair = false) {
  return `${isPair ? 'Front and back' : 'Photo'} copied (PNG).`;
}

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

// Taps a button that saves a file (Download, Download corners, Save edits: a locator),
// answers the Upscale question with `upscaleAnswer` ('No' by default) if it is asked, and waits
// for the file. Returns { name, file }: the name the app gave it and the path of the saved copy.
async function saveFileBy(page, hand, button, upscaleAnswer = 'No') {
  const downloading = page.waitForEvent('download');
  await hand.tap(button);
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

// saveFileBy for Download on the Export step.
function saveByDownload(page, hand, upscaleAnswer = 'No') {
  return saveFileBy(page, hand, page.locator('#btnDownload'), upscaleAnswer);
}

// The size of a saved image file, as [width, height] in px.
async function savedSize(page, file) {
  const image = await readSavedImage(page, file);
  return [image.width, image.height];
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

// On the Perspective step, drags the top-left corner handle past the bottom-right one, so the
// outline crosses itself and the corners are invalid.
async function crossTheCorners(page, hand) {
  const start = await cornerOnPage(page, 0);
  const end = await page.evaluate(pastPx => {
    const app = window.__straightener.app;
    const [right, bottom] = app.state.corners[2];
    const [x, y] = window.CF.toScreen(window.CF.currentView(), [right + pastPx, bottom + pastPx]);
    const box = document.getElementById('view').getBoundingClientRect();
    return { x: box.left + x, y: box.top + y };
  }, CROSS_PAST_PX);
  await hand.drag(start, end);
}

// A point moved by (dx, dy) CSS px.
const offsetBy = (point, dx, dy) => ({ x: point.x + dx, y: point.y + dy });

// Taps (a finger) or clicks (the mouse) one point of the page.
function tapPoint(page, hand, point) {
  return hand.isTouch ? page.touchscreen.tap(point.x, point.y) : page.mouse.click(point.x, point.y);
}

// Puts one finger on the page at `point` (CSS px) and keeps it there, through the browser's own
// touch input (the DevTools protocol's Input.dispatchTouchEvent), as a real finger would be: the
// browser scrolls a row and moves a native slider for it as it does for a real finger, which a
// dispatched pointer can't do and Playwright's touchscreen (it can only tap) can't either.
// Chromium only. Returns the finger: { moveTo(point), lift() }; lift ends the touch.
async function holdFinger(page, point) {
  const session = await page.context().newCDPSession(page);
  // Sends one touch event of `type` with the finger at (x, y); a touchEnd has no finger left.
  const touch = (type, place) => session.send('Input.dispatchTouchEvent', {
    type,
    touchPoints: type === 'touchEnd' ? [] : [{ x: place.x, y: place.y }],
  });
  await touch('touchStart', point);
  return {
    moveTo: target => touch('touchMove', target),
    lift: async () => {
      await touch('touchEnd', point);
      await session.detach();
    },
  };
}

// Waits until the next two frames have been drawn, so a redraw the app has asked for (the
// photo, a thumbnail, a badge) is on the screen.
function nextFrames(page) {
  return page.evaluate(() => new Promise(resolve => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  }));
}

// The step the app shows: 'perspective', 'rotate' and so on.
const stepNow = page => page.evaluate(() => window.__straightener.app.tab);

// The view the photo area is drawn with now: { zoom, panX, panY }.
function viewNow(page) {
  return page.evaluate(() => {
    const view = window.CF.currentView();
    return { zoom: view.zoom, panX: view.panX, panY: view.panY };
  });
}

// The photo view's zoom: CSS px per px of the picture.
function viewZoom(page) {
  return page.evaluate(() => window.CF.currentView().zoom);
}

// How many undo steps there are.
function undoSteps(page) {
  return page.evaluate(() => window.CF.History.undo.length);
}

// Waits until no detection is running: the last run has cleared its message.
function waitForDetection(page) {
  return page.waitForFunction(() => window.__straightener.app.detection.message === '');
}

// The question box over the photo (the question card layer), and one of its buttons by label.
const questionCard = page => page.locator('#pairPrompt');
const questionButton = (page, label) => questionCard(page)
  .getByRole('button', { name: label, exact: true });

// True when the question box is up. Its layer's open mark is read, not its hidden, which lags
// about 200 ms behind a close.
function isQuestionUp(page) {
  return page.evaluate(() => window.CF.isAlertOpen(document.getElementById('pairPrompt')));
}

// An element's background color as the browser computes it ('rgb(r, g, b)').
function backgroundOf(locator) {
  return locator.evaluate(el => getComputedStyle(el).backgroundColor);
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

// Waits until `check(arg)`, run in the page, comes out true; gives up with an error after
// timeoutMs. `check` may be async (it may read the app's storage): page.waitForFunction can't
// take one, since it counts the promise an async function returns as true at once.
async function waitInPage(page, check, arg = null, timeoutMs = WAIT_IN_PAGE_TIMEOUT_MS) {
  const deadline = Date.now() + timeoutMs;
  while (!(await page.evaluate(check, arg))) {
    if (Date.now() > deadline) throw new Error(`Waited ${timeoutMs} ms in vain: ${check}`);
    await page.waitForTimeout(WAIT_IN_PAGE_POLL_MS);
  }
}

// Waits until the open photo's edits, as they are now, are kept on the device for Resume
// (what a person's "wait two seconds" gives time for), so a reload or opening the build again
// offers them: the stored edits and step match the screen's.
function waitForEditsKept(page) {
  return waitInPage(page, async () => {
    const app = window.__straightener.app;
    const record = await window.__straightener.Session.peek();
    const isSameState = !!record && JSON.stringify(record.state) === JSON.stringify(app.state);
    return isSameState && record.tab === app.tab;
  });
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
  RULED_EDITS_LINES,
  ruledFinishedMessage,
  finishedMessage,
  copiedMessage,
  ruledCopiedMessage,
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
  saveFileBy,
  saveByDownload,
  savedSize,
  readSavedImage,
  crossTheCorners,
  offsetBy,
  tapPoint,
  holdFinger,
  nextFrames,
  stepNow,
  viewNow,
  viewZoom,
  undoSteps,
  waitForDetection,
  questionCard,
  questionButton,
  isQuestionUp,
  backgroundOf,
  pictureOf,
  cropBox,
  waitForStill,
  waitInPage,
  waitForEditsKept,
  hasWhiteFill,
};
