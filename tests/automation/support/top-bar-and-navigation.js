// Helpers for the top bar and navigation cases (tests/automation/top-bar-and-navigation.spec.js):
// starting on a step, the options tab and its sheet (open, closed, where its top edge is, how
// far it travels), a finger held on a tab while it drags, the tab's arrow, and where things are
// on the page. Like app.js, they drive the app as a person would and read its state only
// through window.__straightener and CF, to check a result.
'use strict';
const { openApp, openPhoto, goToStep, handFor } = require('./app.js');
const { sendTouch } = require('./perspective.js');

// The photo most cases use: it detects the same in Chromium and WebKit.
const PHOTO = '01_chrome_flat_black.JPEG';
// How many moves a held drag on a tab is split into, so the app sees a drag and not a jump.
const HELD_MOVES = 8;

// Opens the app with a photo (PHOTO unless `photo` names another) and goes to `step`
// (Perspective, where every photo opens, unless it names another). Returns the hand for this
// target.
async function startOn(page, testInfo, step = 'perspective', { photo = PHOTO, address } = {}) {
  await openApp(page, address);
  await openPhoto(page, photo);
  const hand = handFor(page, testInfo);
  if (step !== 'perspective') await goToStep(page, step, hand);
  return hand;
}

// The options tab on the top edge of a step's controls.
const optionsTab = (page, step) => page.locator(`#${step}AreaGrabber`);

// A step's options sheet (its layer, which holds the dim and the sheet).
const sheetOf = (page, step) => page.locator(`#${step}Sheet`);

// True while a step's sheet is open or opening.
function isSheetOpen(page, step) {
  return page.evaluate(id => window.CF.isSheetOpen(document.getElementById(id)), `${step}Sheet`);
}

// Waits until a step's sheet is open (true), or closed and hidden once its slide has ended
// (false).
function waitForSheet(page, step, isOpen) {
  return page.waitForFunction(({ id, wanted }) => {
    const layer = document.getElementById(id);
    const isOpenNow = window.CF.isSheetOpen(layer);
    return wanted ? isOpenNow : !isOpenNow && layer.hidden;
  }, { id: `${step}Sheet`, wanted: isOpen });
}

// Where the top edge of a step's sheet is on the page, in CSS px.
function sheetTopPx(page, step) {
  return page.evaluate(id => {
    const sheet = document.querySelector(`#${id} .sheet`);
    return sheet.getBoundingClientRect().top;
  }, `${step}Sheet`);
}

// Where the top edge of a step's controls is on the page, in CSS px.
function areaTopPx(page, step) {
  return page.evaluate(id => document.getElementById(id).getBoundingClientRect().top,
    `${step}Area`);
}

// How far a step's sheet travels between closed and open, in CSS px: from the top edge of the
// controls, where a closed sheet's top edge rests, to the open sheet's top edge. It opens the
// sheet with a tap to measure it, and closes it again with its cross.
async function sheetTravelPx(page, hand, step) {
  await hand.tap(optionsTab(page, step));
  await waitForSheet(page, step, true);
  await page.waitForFunction(id => {
    const sheet = document.querySelector(`#${id} .sheet`);
    return sheet.getAnimations().every(animation => animation.playState !== 'running');
  }, `${step}Sheet`);
  const openTop = await sheetTopPx(page, step);
  await hand.tap(sheetOf(page, step).locator('.sheet-close'));
  await waitForSheet(page, step, false);
  return (await areaTopPx(page, step)) - openTop;
}

// The middle of an element on the page, in CSS px, read in the page.
function middleOnPage(page, selector) {
  return page.evaluate(target => {
    const box = document.querySelector(target).getBoundingClientRect();
    return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
  }, selector);
}

// Puts a dispatched finger down on the element `selector` names, at `start`, and moves it by
// dy CSS px (negative is up) without lifting. Returns the point it stopped at, for liftFinger.
async function holdFingerDrag(page, selector, start, dy) {
  await sendTouch(page, selector, 'pointerdown', start);
  return moveFinger(page, selector, start, dy);
}

// Moves the finger holdFingerDrag holds down on `selector` from `start` by dy CSS px, still
// without lifting. Returns the point it stopped at.
async function moveFinger(page, selector, start, dy) {
  let point = start;
  for (let i = 1; i <= HELD_MOVES; i++) {
    point = { x: start.x, y: start.y + dy * i / HELD_MOVES };
    await sendTouch(page, selector, 'pointermove', point);
  }
  return point;
}

// Lifts the finger holdFingerDrag put down: 'pointerup', or 'pointercancel' for a touch the
// browser takes away.
function liftFinger(page, selector, point, type = 'pointerup') {
  return sendTouch(page, selector, type, point);
}

// A finger drag on a tab: down at its middle, `dy` CSS px up or down, then lifted.
async function dragTab(page, selector, dy) {
  const start = await middleOnPage(page, selector);
  const end = await holdFingerDrag(page, selector, start, dy);
  await liftFinger(page, selector, end);
}

// The two arms of a tab's glyph (the arrow or the bar): each one's box on the page and its
// angle in degrees. selector: the tab's holder (the options tab or a sheet's own tab).
function tabArms(page, selector) {
  return page.evaluate(holder => [...document.querySelectorAll(`${holder} .handle-arm`)]
    .map(arm => {
      const box = arm.getBoundingClientRect();
      const matrix = new DOMMatrix(getComputedStyle(arm).transform);
      return {
        left: box.left,
        top: box.top,
        right: box.right,
        bottom: box.bottom,
        angleDeg: Math.atan2(matrix.b, matrix.a) * 180 / Math.PI,
      };
    }), selector);
}

// The box around both arms of a tab's glyph: { width, height, middleX } in CSS px.
async function glyphBox(page, selector) {
  const arms = await tabArms(page, selector);
  const left = Math.min(...arms.map(arm => arm.left));
  const right = Math.max(...arms.map(arm => arm.right));
  const top = Math.min(...arms.map(arm => arm.top));
  const bottom = Math.max(...arms.map(arm => arm.bottom));
  return { width: right - left, height: bottom - top, middleX: (left + right) / 2 };
}

// The id (or, without one, the class) of the element on top at a point of the page.
function topElementAt(page, point) {
  return page.evaluate(({ x, y }) => {
    const el = document.elementFromPoint(x, y);
    if (!el) return '';
    const withId = el.closest('[id]');
    return withId ? withId.id : el.className;
  }, point);
}

// The photo view now: { zoom, panX, panY, isFitted }, or null when nothing is drawn.
function viewNow(page) {
  return page.evaluate(() => {
    const view = window.CF.currentView();
    if (!view) return null;
    return { zoom: view.zoom, panX: view.panX, panY: view.panY, isFitted: view.auto !== false };
  });
}

// The quarter turns in the edits (0 to 3, clockwise).
const quarterTurns = page => page.evaluate(() => window.__straightener.app.state.rotation.quarter);

// The page boxes of the top bar's controls that can be seen, by name, in order from the left:
// [{ name, left, right, top, bottom }].
function topBarBoxes(page) {
  return page.evaluate(() => {
    const named = [
      ['brand', '.top-bar-brand'],
      ['open', '#btnOpen'],
      ['steps', '#topBarSteps .tab-bar'],
      ['front', '#sideSwitch .segment[data-value="front"]'],
      ['back', '#sideSwitch .segment[data-value="back"]'],
      ['unpair', '#btnUnpair'],
      ['fit', '#btnFit'],
      ['undo', '#btnUndo'],
      ['redo', '#btnRedo'],
    ];
    return named
      .map(([name, selector]) => {
        const el = document.querySelector(selector);
        const box = el ? el.getBoundingClientRect() : null;
        if (!box || !box.width || !box.height) return null;
        return { name, left: box.left, right: box.right, top: box.top, bottom: box.bottom };
      })
      .filter(Boolean)
      .sort((first, second) => first.left - second.left);
  });
}

module.exports = {
  PHOTO,
  startOn,
  optionsTab,
  sheetOf,
  isSheetOpen,
  waitForSheet,
  sheetTopPx,
  areaTopPx,
  sheetTravelPx,
  middleOnPage,
  holdFingerDrag,
  moveFinger,
  liftFinger,
  dragTab,
  tabArms,
  glyphBox,
  topElementAt,
  viewNow,
  quarterTurns,
  topBarBoxes,
};
