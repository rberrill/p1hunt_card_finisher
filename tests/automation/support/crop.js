// Helpers for the Crop cases (tests/automation/crop.spec.js): the preset chips and their row,
// where the crop box's handles are on the page, the card's own box, and the size line. Like
// app.js, they drive the app as a person would and read its state only through
// window.__straightener and CF, to check a result.
'use strict';
const { openApp, openPhoto, goToStep, handFor } = require('./app.js');

// The photo most cases use: a PSA slab, its card upright, found within 0.5% by detection.
const CROP_PHOTO = 'IMG_9136.JPEG';
// How long to wait between two looks at a scrolling row, in ms.
const SCROLL_SETTLE_MS = 100;
// A finger swipe across the row of presets: it starts and ends this share of the row's width
// in from its edges, in this many moves, this many ms apart (about a 0.2 s swipe).
const SWIPE_NEAR_EDGE = 0.1;
const SWIPE_MOVES = 10;
const SWIPE_MOVE_MS = 16;

// Opens the app (at `address`, which may carry settings from a link) with a photo and goes to
// the Crop step. Returns the hand for this target.
async function startOnCrop(page, testInfo, { photo = CROP_PHOTO, address } = {}) {
  await openApp(page, address);
  await openPhoto(page, photo);
  const hand = handFor(page, testInfo);
  await goToStep(page, 'crop', hand);
  return hand;
}

// One preset chip, by its label as the screen shows it ('4:5', '5:7 card').
function presetChip(page, label) {
  return page.locator('#cropPresets').getByRole('button', { name: label, exact: true });
}

// The chips' labels, in order.
function chipLabels(page) {
  return page.locator('#cropPresets .preset-chip').allTextContents();
}

// The labels of the selected chips (one, normally).
function selectedChips(page) {
  return page.locator('#cropPresets .preset-chip[aria-pressed="true"]').allTextContents();
}

// The crop box in the straightened picture's px: { x, y, width, height }, with its middle
// { centerX, centerY }.
function cropRect(page) {
  return page.evaluate(() => {
    const crop = window.__straightener.app.geometry.crop;
    return {
      x: crop.x,
      y: crop.y,
      width: crop.width,
      height: crop.height,
      centerX: crop.x + crop.width / 2,
      centerY: crop.y + crop.height / 2,
    };
  });
}

// The straightened picture's size, in its px: { width, height }.
function frameSize(page) {
  return page.evaluate(() => {
    const rotated = window.__straightener.app.geometry.rotated;
    return { width: rotated.width, height: rotated.height };
  });
}

// The card's own box in the straightened picture's px: { x, y, width, height }.
function cardBox(page) {
  return page.evaluate(() => {
    const points = window.__straightener.app.geometry.cardRotated;
    const across = points.map(point => point[0]);
    const down = points.map(point => point[1]);
    const left = Math.min(...across);
    const top = Math.min(...down);
    return { x: left, y: top, width: Math.max(...across) - left, height: Math.max(...down) - top };
  });
}

// Where one of the crop box's handles is on the page, in CSS px. part: 'nw', 'n', 'ne', 'e',
// 'se', 's', 'sw' or 'w' (the compass point of the handle), or 'middle'.
function cropHandleOnPage(page, part) {
  return page.evaluate(handlePart => {
    const view = window.CF.currentView();
    const box = document.getElementById('view').getBoundingClientRect();
    const toPage = ([x, y]) => ({ x: box.left + x, y: box.top + y });
    if (handlePart === 'middle') {
      const crop = window.__straightener.app.geometry.crop;
      const middle = [crop.x + crop.width / 2, crop.y + crop.height / 2];
      return toPage(window.CF.toScreen(view, middle));
    }
    const handle = window.CF.cropHandles(view).find(candidate => candidate.part === handlePart);
    return toPage(handle.point);
  }, part);
}

// The photo view's zoom (CSS px per px of the picture) and pan, as on screen now.
function viewNow(page) {
  return page.evaluate(() => {
    const view = window.CF.currentView();
    return { zoom: view.zoom, panX: view.panX, panY: view.panY };
  });
}

// How many undo steps there are.
function undoSteps(page) {
  return page.evaluate(() => window.CF.History.undo.length);
}

// The crop's size as the line above the controls shows it ('1400 × 1400'), and whether its
// "px" shows: { size, isUnitShown }.
async function sizeLine(page) {
  return {
    size: (await page.locator('#cropSize').textContent()).trim(),
    isUnitShown: await page.locator('#cropUnit').isVisible(),
  };
}

// Swipes the row of presets with one finger, across most of its width, and waits until it has
// stopped moving. direction: 'left' (the finger moves left, the row shows its end) or 'right'
// (back towards its start). The touches go through the browser's own input pipeline (the
// DevTools protocol's Input.dispatchTouchEvent), so the browser scrolls the row as it does for
// a real finger; Playwright's touchscreen can only tap. Chromium only.
async function swipePresetRow(page, direction) {
  const box = await page.locator('#cropPresets').boundingBox();
  const y = Math.round(box.y + box.height / 2);
  const nearLeft = Math.round(box.x + box.width * SWIPE_NEAR_EDGE);
  const nearRight = Math.round(box.x + box.width * (1 - SWIPE_NEAR_EDGE));
  const fromX = direction === 'left' ? nearRight : nearLeft;
  const toX = direction === 'left' ? nearLeft : nearRight;
  const client = await page.context().newCDPSession(page);
  // Sends one touch event of `type` with the finger at (x, y); a touchEnd has no finger left.
  const touch = (type, x) => client.send('Input.dispatchTouchEvent', {
    type,
    touchPoints: type === 'touchEnd' ? [] : [{ x, y }],
  });
  await touch('touchStart', fromX);
  for (let i = 1; i <= SWIPE_MOVES; i++) {
    await touch('touchMove', fromX + (toX - fromX) * i / SWIPE_MOVES);
    await page.waitForTimeout(SWIPE_MOVE_MS);
  }
  await touch('touchEnd', toX);
  await client.detach();
  // The row may glide on after the finger lifts: wait until it has stopped moving.
  let last = -1;
  for (;;) {
    await page.waitForTimeout(SCROLL_SETTLE_MS);
    const now = await rowScroll(page);
    if (now === last) return;
    last = now;
  }
}

// How far the row of presets can scroll, in CSS px: 0 at its start.
function rowScrollMax(page) {
  return page.locator('#cropPresets').evaluate(row => row.scrollWidth - row.clientWidth);
}

// Where a chip sits in the row: { left, right, rowLeft, rowRight }, in CSS px, with rowRight the
// right edge of the part of the row the chips rest in (inside its right padding).
function chipPlace(page, label) {
  return presetChip(page, label).evaluate(chip => {
    const row = chip.parentElement;
    const rowBox = row.getBoundingClientRect();
    const chipBox = chip.getBoundingClientRect();
    const gutterPx = parseFloat(getComputedStyle(row).paddingRight) || 0;
    return {
      left: chipBox.left,
      right: chipBox.right,
      rowLeft: rowBox.left,
      rowRight: rowBox.right - gutterPx,
    };
  });
}

// True when a chip is wholly in view in its row.
async function isChipInView(page, label) {
  const place = await chipPlace(page, label);
  return place.left >= place.rowLeft - 1 && place.right <= place.rowRight + 1;
}

// How far the row of presets is scrolled, in CSS px.
function rowScroll(page) {
  return page.locator('#cropPresets').evaluate(row => row.scrollLeft);
}

module.exports = {
  CROP_PHOTO,
  startOnCrop,
  presetChip,
  chipLabels,
  selectedChips,
  cropRect,
  frameSize,
  cardBox,
  cropHandleOnPage,
  viewNow,
  undoSteps,
  sizeLine,
  swipePresetRow,
  chipPlace,
  isChipInView,
  rowScroll,
  rowScrollMax,
};
