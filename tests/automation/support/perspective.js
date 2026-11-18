// Helpers for the Perspective cases (tests/automation/perspective.spec.js): where a handle is on
// the page, taps and presses at a point of the photo, held buttons, a finger whose drag the
// browser cancels, a two-finger pinch, a plain picture with no card in it, and recorders for
// the line's messages, the corner's moves and the searches for the card (one of which can be
// held open). Like app.js, they drive the app as a person would and read its state only
// through window.__straightener and CF.
'use strict';
const fs = require('fs');
const path = require('path');
const { root, openApp, openPhoto, handFor, tapPoint, viewZoom, offsetBy } = require('./app.js');

// The photo most cases use: a PSA slab, found within 0.5% by detection.
const PHOTO = 'IMG_9136.JPEG';
// How long a photo may take to open and be searched before the case gives up.
const OPEN_TIMEOUT_MS = 20000;
// Pointer ids for dispatched fingers. Any numbers a real pointer is unlikely to have.
const FIRST_FINGER_ID = 21;
const SECOND_FINGER_ID = 22;
// How many moves a dispatched drag or pinch is split into, so the app sees movement.
const DISPATCHED_MOVES = 8;
// The plain picture's grey (0 to 255) and its default size in px.
const BLANK_GREY = 128;
const BLANK_WIDTH = 1200;
const BLANK_HEIGHT = 1600;

// Opens the app (at `address`, which may carry settings from a link) with a sample photo, on
// the Perspective step where every photo opens. Returns the hand for this target.
async function startOnPerspective(page, testInfo, { photo = PHOTO, address } = {}) {
  await openApp(page, address);
  await openPhoto(page, photo);
  return handFor(page, testInfo);
}

// Where handle `index` is on the page, in CSS px: 0 to 3 the corners (top-left first,
// clockwise), 4 to 7 the middles of the edges (top edge first).
function handleOnPage(page, index) {
  return page.evaluate(handleIndex => {
    const corners = window.__straightener.app.state.corners;
    const point = window.CF.handlePosition(corners, handleIndex);
    const [x, y] = window.CF.toScreen(window.CF.currentView(), point);
    const box = document.getElementById('view').getBoundingClientRect();
    return { x: box.left + x, y: box.top + y };
  }, index);
}

// The four corners, in the photo's own px (source px), top-left first.
function cornersNow(page) {
  return page.evaluate(() => JSON.parse(JSON.stringify(window.__straightener.app.state.corners)));
}

// The zoom at which the whole photo fits the photo area.
function fittedZoom(page) {
  return page.evaluate(() => {
    const img = window.__straightener.app.img;
    return window.CF.fitView(img.width, img.height).zoom;
  });
}

// Two quick taps on one point: two finger taps, or a mouse double-click.
async function doubleTapAt(page, hand, point) {
  if (!hand.isTouch) {
    await page.mouse.dblclick(point.x, point.y);
    return;
  }
  await page.touchscreen.tap(point.x, point.y);
  await page.touchscreen.tap(point.x, point.y);
}

// Sends one dispatched touch pointer event to the element `selector` names. A dispatched
// pointer is not one the browser knows, so setPointerCapture would throw where a real finger's
// would not; for this one event it ignores the dispatched fingers (as touchDrag in app.js does).
function sendTouch(page, selector, type, point, pointerId = FIRST_FINGER_ID) {
  return page.evaluate(({ targetSelector, eventType, x, y, id, fingerIds }) => {
    const element = document.querySelector(targetSelector);
    const capture = Element.prototype.setPointerCapture;
    Element.prototype.setPointerCapture = function captureUnlessDispatched(pointer) {
      if (!fingerIds.includes(pointer)) capture.call(this, pointer);
    };
    try {
      element.dispatchEvent(new PointerEvent(eventType, {
        pointerId: id,
        pointerType: 'touch',
        isPrimary: id === fingerIds[0],
        clientX: x,
        clientY: y,
        bubbles: true,
        cancelable: true,
        buttons: eventType === 'pointerdown' || eventType === 'pointermove' ? 1 : 0,
      }));
    } finally {
      Element.prototype.setPointerCapture = capture;
    }
  }, {
    targetSelector: selector,
    eventType: type,
    x: point.x,
    y: point.y,
    id: pointerId,
    fingerIds: [FIRST_FINGER_ID, SECOND_FINGER_ID],
  });
}

// Presses one point of the photo and holds it still for holdMs before letting go.
async function pressAt(page, hand, point, holdMs) {
  if (hand.isTouch) {
    await sendTouch(page, '#view', 'pointerdown', point);
    await page.waitForTimeout(holdMs);
    await sendTouch(page, '#view', 'pointerup', point);
    return;
  }
  await page.mouse.move(point.x, point.y);
  await page.mouse.down();
  await page.waitForTimeout(holdMs);
  await page.mouse.up();
}

// Holds a button (the element `selector` names) down for holdMs, then lifts. A finger is
// dispatched; the mouse is real.
async function holdButton(page, hand, selector, holdMs) {
  const point = await pressButton(page, hand, selector);
  await page.waitForTimeout(holdMs);
  await releaseButton(page, hand, selector, point);
}

// The points of a straight move from start to end, end included.
function stepsBetween(start, end) {
  return Array.from({ length: DISPATCHED_MOVES }, (unused, i) => {
    const fraction = (i + 1) / DISPATCHED_MOVES;
    return { x: start.x + (end.x - start.x) * fraction, y: start.y + (end.y - start.y) * fraction };
  });
}

// A one-finger drag on the photo from start to end that the browser cancels before the finger
// lifts (as iOS does when a system gesture takes the touch): the last event is pointercancel.
async function cancelledTouchDrag(page, start, end) {
  await sendTouch(page, '#view', 'pointerdown', start);
  for (const point of stepsBetween(start, end)) {
    await sendTouch(page, '#view', 'pointermove', point);
  }
  await sendTouch(page, '#view', 'pointercancel', end);
}

// Presses a handle and moves it (mouse or dispatched finger) to `end` without letting go, so a
// screenshot can show the drag in progress. Call releaseDrag to finish it.
async function holdDragAt(page, hand, start, end) {
  if (hand.isTouch) {
    await sendTouch(page, '#view', 'pointerdown', start);
    for (const point of stepsBetween(start, end)) {
      await sendTouch(page, '#view', 'pointermove', point);
    }
    return;
  }
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y, { steps: DISPATCHED_MOVES });
}

// Lets go of a drag holdDragAt started.
function releaseDrag(page, hand, end) {
  return hand.isTouch ? sendTouch(page, '#view', 'pointerup', end) : page.mouse.up();
}

// Two fingers on the photo, centered on `center`, moving apart from startGapPx to endGapPx
// (CSS px between them), then lifting.
async function pinchAt(page, center, startGapPx, endGapPx) {
  const fingerAt = (gapPx, side) => ({ x: center.x + side * gapPx / 2, y: center.y });
  await sendTouch(page, '#view', 'pointerdown', fingerAt(startGapPx, -1), FIRST_FINGER_ID);
  await sendTouch(page, '#view', 'pointerdown', fingerAt(startGapPx, 1), SECOND_FINGER_ID);
  for (let i = 1; i <= DISPATCHED_MOVES; i++) {
    const gapPx = startGapPx + (endGapPx - startGapPx) * i / DISPATCHED_MOVES;
    await sendTouch(page, '#view', 'pointermove', fingerAt(gapPx, -1), FIRST_FINGER_ID);
    await sendTouch(page, '#view', 'pointermove', fingerAt(gapPx, 1), SECOND_FINGER_ID);
  }
  await sendTouch(page, '#view', 'pointerup', fingerAt(endGapPx, -1), FIRST_FINGER_ID);
  await sendTouch(page, '#view', 'pointerup', fingerAt(endGapPx, 1), SECOND_FINGER_ID);
}

// A plain grey PNG with no card in it, drawn in the page: { name, mimeType, buffer }, ready for
// setInputFiles.
async function blankPicture(page, width = BLANK_WIDTH, height = BLANK_HEIGHT) {
  const base64 = await page.evaluate(async ({ pictureWidth, pictureHeight, grey }) => {
    const canvas = document.createElement('canvas');
    canvas.width = pictureWidth;
    canvas.height = pictureHeight;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = `rgb(${grey}, ${grey}, ${grey})`;
    ctx.fillRect(0, 0, pictureWidth, pictureHeight);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let text = '';
    for (const byte of bytes) text += String.fromCharCode(byte);
    return btoa(text);
  }, { pictureWidth: width, pictureHeight: height, grey: BLANK_GREY });
  return { name: 'blank.png', mimeType: 'image/png', buffer: Buffer.from(base64, 'base64') };
}

// Chooses a picture made in the test (blankPicture) through the app's file input and waits
// until it is open and searched, as openPhoto does for a sample.
async function openPicture(page, picture) {
  await page.evaluate(() => {
    window.testPhotoBefore = window.__straightener.app.img;
  });
  await page.setInputFiles('#fileInput', picture);
  await page.waitForFunction(name => {
    const app = window.__straightener.app;
    const isNewPhoto = !!app.img && app.img !== window.testPhotoBefore;
    const isSearched = app.detection.running > 0 && app.detection.message === '';
    return isNewPhoto && !!app.state && app.state.source.name === name && isSearched;
  }, picture.name, { timeout: OPEN_TIMEOUT_MS });
}

// Opens the app with the plain picture (blankPicture), on the Perspective step. Returns the
// hand for this target.
async function startOnBlank(page, testInfo, { address, width, height } = {}) {
  await openApp(page, address);
  await openPicture(page, await blankPicture(page, width, height));
  return handFor(page, testInfo);
}

// A picture from tests/fixtures/, by file name, ready for setInputFiles (openPicture).
function fixturePicture(name) {
  return {
    name,
    mimeType: 'image/png',
    buffer: fs.readFileSync(path.join(root, 'tests', 'fixtures', name)),
  };
}

// Opens the app (at `address`) with a PNG from tests/fixtures/, on the Perspective step.
// Returns the hand for this target.
async function startOnFixture(page, testInfo, name, address) {
  await openApp(page, address);
  await openPicture(page, fixturePicture(name));
  return handFor(page, testInfo);
}

// Starts recording every message the line above Perspective's controls shows, in order, into
// a list the page keeps (readStatuses reads it).
function recordStatuses(page) {
  return page.evaluate(() => {
    const status = document.getElementById('perspectiveStatus');
    window.testStatuses = [];
    const note = () => {
      const text = status.hidden ? '' : status.querySelector('.status-text').textContent;
      const last = window.testStatuses[window.testStatuses.length - 1];
      if (text && text !== last) window.testStatuses.push(text);
    };
    new MutationObserver(note).observe(status, {
      attributes: true,
      childList: true,
      characterData: true,
      subtree: true,
    });
  });
}

// The messages recordStatuses has seen, in order.
function readStatuses(page) {
  return page.evaluate(() => window.testStatuses.slice());
}

// Holds the next search for the card open until releaseSearch is called: the search runs, and
// its result is handed back only on release. A search takes about half a second and no control
// can slow it, so this one change is made in the page's code (the detector's entry point).
// failure: words for the held search to fail with on release, where a case needs a search that
// fails (no photo makes one fail); left out, the search hands back its result.
function holdNextSearch(page, failure = '') {
  return page.evaluate(failureText => {
    const detector = window.CF.Detector;
    const detect = detector.detect;
    window.testSearchHeld = new Promise(resolve => {
      window.testReleaseSearch = resolve;
    });
    detector.detect = async function detectWhenReleased(imageData, options) {
      detector.detect = detect;
      const result = await detect.call(detector, imageData, options);
      await window.testSearchHeld;
      if (failureText) throw new Error(failureText);
      return result;
    };
  }, failure);
}

// Lets the search holdNextSearch held hand back its result.
function releaseSearch(page) {
  return page.evaluate(() => window.testReleaseSearch());
}

// Starts recording the point each search for the card is handed (in the photo's own px), or
// null for a search handed none, into a list the page keeps (readSearchPoints reads it).
function recordSearchPoints(page) {
  return page.evaluate(() => {
    const detector = window.CF.Detector;
    const detect = detector.detect;
    window.testSearchPoints = [];
    detector.detect = function detectAndRecord(imageData, options) {
      window.testSearchPoints.push(options.seed ? options.seed.slice() : null);
      return detect.call(detector, imageData, options);
    };
  });
}

// The points recordSearchPoints has seen, in order.
function readSearchPoints(page) {
  return page.evaluate(() => window.testSearchPoints.slice());
}

// Presses a button (the element `selector` names) and keeps it down: a dispatched finger, or
// the real mouse. Returns the point pressed, for releaseButton.
async function pressButton(page, hand, selector) {
  const box = await page.locator(selector).boundingBox();
  const middle = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  if (hand.isTouch) {
    await sendTouch(page, selector, 'pointerdown', middle);
    return middle;
  }
  await page.mouse.move(middle.x, middle.y);
  await page.mouse.down();
  return middle;
}

// Lets go of a button pressButton pressed, at `point`.
function releaseButton(page, hand, selector, point) {
  return hand.isTouch ? sendTouch(page, selector, 'pointerup', point) : page.mouse.up();
}

// Starts recording the times (performance.now(), ms) at which the top-left corner moves, read
// once a frame, into a list the page keeps (readCornerMoveTimes reads it).
function recordCornerMoveTimes(page) {
  return page.evaluate(() => {
    const app = window.__straightener.app;
    window.testMoveTimes = [];
    let last = app.state.corners[0].join();
    const watch = () => {
      const now = app.state.corners[0].join();
      if (now !== last) window.testMoveTimes.push(performance.now());
      last = now;
      requestAnimationFrame(watch);
    };
    requestAnimationFrame(watch);
  });
}

// The times recordCornerMoveTimes has seen, in order.
function readCornerMoveTimes(page) {
  return page.evaluate(() => window.testMoveTimes.slice());
}

// The mean red, green and blue (0 to 255) of the middle third of the photo area as drawn now.
function middleColor(page) {
  return page.evaluate(() => {
    const canvas = document.getElementById('view');
    const ctx = canvas.getContext('2d');
    const width = Math.floor(canvas.width / 3);
    const height = Math.floor(canvas.height / 3);
    const pixels = ctx.getImageData(width, height, width, height).data;
    const sums = [0, 0, 0];
    for (let i = 0; i < pixels.length; i += 4) {
      for (let channel = 0; channel < 3; channel++) sums[channel] += pixels[i + channel];
    }
    return sums.map(sum => sum / (pixels.length / 4));
  });
}

// The line above Perspective's controls that names the selected handle.
const handleName = page => page.locator('#perspectiveLine .line-value');

module.exports = {
  PHOTO,
  startOnPerspective,
  startOnBlank,
  startOnFixture,
  fixturePicture,
  blankPicture,
  openPicture,
  handleOnPage,
  offsetBy,
  cornersNow,
  fittedZoom,
  doubleTapAt,
  sendTouch,
  pressAt,
  holdButton,
  cancelledTouchDrag,
  holdDragAt,
  releaseDrag,
  pinchAt,
  recordStatuses,
  readStatuses,
  holdNextSearch,
  releaseSearch,
  recordSearchPoints,
  readSearchPoints,
  pressButton,
  releaseButton,
  recordCornerMoveTimes,
  readCornerMoveTimes,
  middleColor,
  tapAt: tapPoint,
  zoomNow: viewZoom,
  handleName,
};
