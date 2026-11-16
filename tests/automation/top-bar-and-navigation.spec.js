// The Top bar and navigation cases (tests/catalog/top-bar-and-navigation.md): Open, Undo and
// Redo and what makes an undo step, Fit, the step tabs and what a step change resets, the top
// bar's order and fit, the options tab and its sheet (open, drag, close, the dim, focus), the
// wide screen's inline options, tips and keys, messages, the progress line, the three kinds of
// tool, and their fades and hover fills.
// Each test drives the app as a person would, through hand.tap and dispatched fingers (on the
// phone targets) or the mouse (on the wide ones), and reads the app's state only to check a
// result.
'use strict';
const { test, expect } = require('./support/case.js');
const {
  samplePath,
  openApp,
  openPhoto,
  goToStep,
  editState,
  handFor,
  middleOf,
  openOptions,
  closeOptions,
  waitForStill,
  hasWhiteFill,
} = require('./support/app.js');
const {
  sendTouch,
  pinchAt,
  cornersNow,
  handleOnPage,
  offsetBy,
  zoomNow,
  startOnBlank,
  holdDragAt,
} = require('./support/perspective.js');
const { chooseInPicker, waitForPhoto, makePair, zoomIn } = require('./support/front-and-back.js');
const {
  choiceButton,
  recordExports,
  exportStarts,
  waitForExportEnd,
  downloadAnswering,
  crossTheCorners,
  tapRegardless,
} = require('./support/export.js');
const { startOnExport, openCornerSheet, saveCorners } = require('./support/corner-shots.js');
const {
  startOnLevels,
  pickButton,
  armedPick,
  levelsDot,
} = require('./support/levels.js');
const { presetChip, selectedChips } = require('./support/crop.js');
const {
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
} = require('./support/top-bar-and-navigation.js');

const SECOND_PHOTO = 'IMG_9136.JPEG';
const STEP_NAMES = ['Perspective', 'Rotate', 'Crop', 'Levels', 'Overlay', 'Export'];
// Each step's options sheet title, as written in the page (shown in capitals).
const SHEET_TITLES = {
  perspective: 'Perspective options',
  rotate: 'Rotate options',
  crop: 'Crop options',
  levels: 'Levels tips',
  overlay: 'Overlay options',
  export: 'Export options',
};
// The colors the cases compare, as the browser writes them: the app's white (--ink), the
// controls' color (--surface), the tab's outline (--track), the page (--page), the pressed and
// hover fill (--pressed), amber (--warn) and P1Hunt red (--accent).
const WHITE = 'rgb(242, 242, 243)';
const SURFACE = 'rgb(22, 22, 24)';
const TRACK = 'rgb(74, 74, 82)';
const PAGE_BLACK = 'rgb(11, 11, 12)';
const PRESSED = 'rgb(58, 58, 64)';
const AMBER = 'rgb(227, 179, 65)';
const P1HUNT_RED = 'rgb(229, 50, 45)';
const QUIET_GREY = 'rgb(168, 171, 178)';
// A disabled control's opacity (css/app.css, the shared button rules).
const DIMMED_OPACITY = '0.38';
// How close two page measurements must be, in CSS px.
const PLACE_TOLERANCE_PX = 1.5;
// The arrow's expected size on the options tab, in CSS px, and how far a measurement may be
// from it (the arms are rounded bars posed at 45°, so their box is a little larger).
const ARROW_WIDTH_PX = 16;
const ARROW_HEIGHT_PX = 8;
const ARROW_TOLERANCE_PX = 2;
// The open sheet's bar, in CSS px.
const BAR_WIDTH_PX = 36;
const BAR_HEIGHT_PX = 5;
// The open sheet is at most this tall, in CSS px (css/app.css, .sheet).
const SHEET_MAX_PX = 470;
// The undo history's length (CONFIG.historyLimit), and the turns TOP-06.1 makes past it.
const HISTORY_LIMIT = 50;
const EXTRA_TURNS = 2;
// How long a pause between nudges starts a new undo step (over 900 ms, state.js), in ms.
const PAUSE_MS = 1500;
// How far down the screen a tap on the dimmed photo lands, in CSS px.
const DIM_TAP_Y_PX = 150;
// How long TOP-26.2 waits to see the sheet stay open, in ms.
const STAY_OPEN_MS = 1000;
// How far above the top edge of the controls a tap on the options tab's raised strip lands
// (the strip runs from 25 to 45 px above it), in CSS px.
const RAISED_STRIP_PX = 35;
// How far down into the line under the tab a tap on a control lands, in CSS px (the tab's
// touch area reaches 19 px below the top edge of the controls, and the line starts 7 px down).
const UNDER_TAB_PX = 14;
// The window widths TOP-17.1 tries, in CSS px, and its height.
const WIDE_WIDTHS = [1280, 1119, 1000, 899, 761];
const WIDE_HEIGHT = 800;
const NAME_HIDDEN_AT_PX = 1119;
const ICON_HIDDEN_AT_PX = 899;
// The window a desktop target narrows to in TOP-28.2, in CSS px.
const PHONE_WINDOW = { width: 390, height: 844 };
// The fraction of the sheet's travel a drag goes: past a third settles it, short of it doesn't.
const HALF = 0.5;
const FIFTH = 0.2;
// How far TOP-27.1 drags an open sheet's top edge down, in CSS px.
const CLOSE_DRAG_PX = 120;
// How far TOP-21.1 drags a corner up, in CSS px, and where it puts the corner first: left of
// the tab's middle and above the photo's bottom edge.
const CORNER_LIFT_PX = 60;
const CORNER_LEFT_OF_TAB_PX = 20;
const CORNER_ABOVE_EDGE_PX = 12;
// How far TOP-07.1 drags a corner, in CSS px.
const CORNER_DRAG_PX = 40;
// How long an action tool flashes, in ms (tool.js, FLASH_MS), and a wait comfortably past it.
const FLASH_PAST_MS = 400;
// The most Tab presses TOP-18.3 makes to reach the options tab.
const MAX_TABS = 40;
// A mode tap's swap: the old line fades for 60 ms before the new one rises in (CF.swapLine).
const LINE_SWAP_MS = 60;

// The quarter turn buttons on Rotate.
const turnRight = page => page.locator('#toolRotateRight');
const turnLeft = page => page.locator('#toolRotateLeft');

// The step tab for `step` that can be seen (the tab bar on a phone, the top bar on a wide
// screen).
const stepTab = (page, step) => page.locator(`[data-step="${step}"]:visible`);

// True when a control is greyed out.
const isDimmed = locator => locator.isDisabled();

// The opacity of an element, as the browser writes it.
const opacityOf = locator => locator.evaluate(el => getComputedStyle(el).opacity);

// A style property of an element, as the browser writes it.
const styleOf = (locator, property) => locator.evaluate(
  (el, name) => getComputedStyle(el)[name],
  property,
);

test('TOP-01.1 Open in the top bar opens a second photo [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo, 'rotate');
  const choosing = page.waitForEvent('filechooser');
  await hand.tap(page.locator('#btnOpen'));
  const chooser = await choosing;
  await check('the photo picker opens', async () => {
    expect(chooser.isMultiple()).toBe(false);
  });
  await chooser.setFiles(samplePath(SECOND_PHOTO));
  await waitForPhoto(page, SECOND_PHOTO);
  await check('IMG_9136.JPEG is on screen, on the Perspective step', async () => {
    expect((await editState(page)).source.name).toBe(SECOND_PHOTO);
    await expect(stepTab(page, 'perspective')).toHaveAttribute('aria-selected', 'true');
  });
});

test('TOP-01.2 Open is an icon on a phone and a pill with its name on a wide screen [both]',
  async ({ page, check }, testInfo) => {
    const hand = await startOn(page, testInfo);
    const open = page.locator('#btnOpen');
    const label = open.locator('.icon-button-label');
    await check('a phone shows the folder alone, 44 × 44 px; a wide screen a pill with "Open"',
      async () => {
        await expect(open.locator('svg')).toBeVisible();
        if (hand.isTouch) {
          await expect(label).toBeHidden();
          const box = await open.boundingBox();
          expect([box.width, box.height]).toEqual([44, 44]);
        } else {
          await expect(label).toHaveText('Open');
          await expect(label).toBeVisible();
          expect(await styleOf(open, 'backgroundColor')).not.toBe('rgba(0, 0, 0, 0)');
          expect(parseFloat(await styleOf(open, 'borderRadius'))).toBeGreaterThanOrEqual(18);
        }
      });
    await check('its name is "Open photo"', async () => {
      await expect(open).toHaveAttribute('aria-label', 'Open photo');
      await expect(open).toHaveAttribute('title', 'Open photo');
    });
  });

test('TOP-02.1 Undo takes back the last edit and is greyed out when there is none [phone]',
  async ({ page, check }, testInfo) => {
    const hand = await startOn(page, testInfo, 'rotate');
    const undo = page.locator('#btnUndo');
    await check('Undo is greyed out; named "Undo", tooltip "Undo (Ctrl/Cmd+Z)"', async () => {
      await expect(undo).toBeDisabled();
      await expect(undo).toHaveAttribute('aria-label', 'Undo');
      await expect(undo).toHaveAttribute('title', 'Undo (Ctrl/Cmd+Z)');
    });
    await hand.tap(turnRight(page));
    await check('the photo turns a quarter clockwise; Undo is live', async () => {
      expect(await quarterTurns(page)).toBe(1);
      await expect(undo).toBeEnabled();
    });
    await hand.tap(undo);
    await check('the photo is the right way up; Undo is greyed out again', async () => {
      expect(await quarterTurns(page)).toBe(0);
      await expect(undo).toBeDisabled();
    });
  });

// The body of TOP-02.2 and TOP-03.2: by ruling R17, `id` (Undo or Redo) is greyed out while an
// export runs. withUndo: tap Undo after the size change, so Redo has something to put back.
async function checkDimmedDuringExport(page, check, testInfo, id, withUndo) {
  const hand = await startOnExport(page, testInfo, { isWatched: true });
  const control = page.locator(`#${id}`);
  await hand.tap(choiceButton(page, 'exportSize', '1080'));
  if (withUndo) await hand.tap(page.locator('#btnUndo'));
  await check(`${withUndo ? '2000' : '1080'} is selected; ${id === 'btnUndo' ? 'Undo' : 'Redo'} `
    + 'is live', async () => {
    await expect(control).toBeEnabled();
  });
  await downloadAnswering(page, hand, 'No');
  const [start] = await exportStarts(page);
  await check('it is greyed out while the export runs', () => {
    expect(start.controls[id].disabled).toBe(true);
  });
  await waitForExportEnd(page);
  await check('it is live again once the file is saved', async () => {
    await expect(control).toBeEnabled();
  });
}

test('TOP-02.2 Undo is greyed out while an export runs [phone]', async ({
  page,
  check,
}, testInfo) => {
  test.fail(true, 'BUG-013');
  await checkDimmedDuringExport(page, check, testInfo, 'btnUndo', false);
});

test('TOP-03.1 Redo puts back what Undo took back, and is greyed out when there is none '
  + '[phone]', async ({ page, check }, testInfo) => {
  const hand = await startOn(page, testInfo, 'rotate');
  const redo = page.locator('#btnRedo');
  await check('Redo is greyed out; named "Redo", tooltip "Redo (Shift+Ctrl/Cmd+Z)"', async () => {
    await expect(redo).toBeDisabled();
    await expect(redo).toHaveAttribute('aria-label', 'Redo');
    await expect(redo).toHaveAttribute('title', 'Redo (Shift+Ctrl/Cmd+Z)');
  });
  await hand.tap(turnRight(page));
  await hand.tap(page.locator('#btnUndo'));
  await check('the photo is the right way up; Redo is live', async () => {
    expect(await quarterTurns(page)).toBe(0);
    await expect(redo).toBeEnabled();
  });
  await hand.tap(redo);
  await check('the photo is turned a quarter clockwise again; Redo is greyed out', async () => {
    expect(await quarterTurns(page)).toBe(1);
    await expect(redo).toBeDisabled();
  });
});

test('TOP-03.2 Redo is greyed out while an export runs [phone]', async ({
  page,
  check,
}, testInfo) => {
  test.fail(true, 'BUG-013');
  await checkDimmedDuringExport(page, check, testInfo, 'btnRedo', true);
});

test('TOP-03.3 Ctrl+Y redoes too, though the tooltip names only Shift+Ctrl+Z [desktop]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo, 'rotate');
  const redo = page.locator('#btnRedo');
  await redo.hover();
  const redoTip = 'the tooltip reads "Redo (Shift+Ctrl/Cmd+Z)", with no mention of Ctrl+Y';
  await check(redoTip, async () => {
    await expect(redo).toHaveAttribute('title', 'Redo (Shift+Ctrl/Cmd+Z)');
  });
  await hand.tap(turnRight(page));
  await hand.tap(page.locator('#btnUndo'));
  await check('the photo is the right way up; Redo is live', async () => {
    expect(await quarterTurns(page)).toBe(0);
    await expect(redo).toBeEnabled();
  });
  await page.keyboard.press('Control+y');
  await check('Ctrl+Y turns it a quarter clockwise again; Redo is greyed out', async () => {
    expect(await quarterTurns(page)).toBe(1);
    await expect(redo).toBeDisabled();
  });
});

test('TOP-04.1 A change that changes nothing makes no undo step [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo, 'rotate');
  await hand.tap(page.locator('#rotateAngle'));
  await page.locator('#rotateAngleField').waitFor({ state: 'visible' });
  await page.keyboard.type('0');
  await hand.tap(page.locator('#btnAngleDone'));
  await check('the angle still reads 0.0°; Undo is still greyed out', async () => {
    await expect(page.locator('#rotateAngleText')).toHaveText('0.0°');
    await expect(page.locator('#btnUndo')).toBeDisabled();
  });
});

test('TOP-04.2 A new edit clears what Redo could put back [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo, 'rotate');
  await hand.tap(turnRight(page));
  await hand.tap(page.locator('#btnUndo'));
  await check('the photo is the right way up; Redo is live', async () => {
    expect(await quarterTurns(page)).toBe(0);
    await expect(page.locator('#btnRedo')).toBeEnabled();
  });
  await hand.tap(turnLeft(page));
  await check('90° left turns it a quarter counterclockwise; Redo is greyed out', async () => {
    expect(await quarterTurns(page)).toBe(3);
    await expect(page.locator('#btnRedo')).toBeDisabled();
  });
});

// The top-left corner's x, in the photo's own px.
const topLeftX = async page => (await cornersNow(page))[0][0];

test('TOP-05.1 Quick nudges are one undo step; a pause starts a new one [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo);
  const nudgeRight = page.locator('#perspectiveNudge .nudge-key[data-key="1,0"]');
  const undo = page.locator('#btnUndo');
  await check('the line reads NUDGE Corner 1 of 4', async () => {
    await expect(page.locator('#perspectiveLine')).toContainText('Corner 1 of 4');
  });
  const startX = await topLeftX(page);
  // One nudge is one screen px, in the photo's px (never less than one).
  const stepPx = Math.max(1, 1 / await zoomNow(page));
  for (let i = 0; i < 3; i++) await hand.tap(nudgeRight);
  await check('three quick taps move the top-left corner right three times', async () => {
    expect(await topLeftX(page)).toBeCloseTo(startX + 3 * stepPx, 3);
  });
  await hand.tap(undo);
  await check('one Undo puts the corner back where it started; Undo is greyed out', async () => {
    expect(await topLeftX(page)).toBeCloseTo(startX, 3);
    await expect(undo).toBeDisabled();
  });
  await hand.tap(nudgeRight);
  await page.waitForTimeout(PAUSE_MS);
  await hand.tap(nudgeRight);
  await check('a tap, a 1.5 s pause and a tap move it right twice', async () => {
    expect(await topLeftX(page)).toBeCloseTo(startX + 2 * stepPx, 3);
  });
  await hand.tap(undo);
  await check('one Undo takes back only the second tap', async () => {
    expect(await topLeftX(page)).toBeCloseTo(startX + stepPx, 3);
  });
});

test('TOP-06.1 Undo goes back 50 steps and no further [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo, 'rotate');
  const undo = page.locator('#btnUndo');
  for (let i = 0; i < HISTORY_LIMIT + EXTRA_TURNS; i++) await hand.tap(turnRight(page));
  await check('after 52 quarter turns the photo is the right way up; Undo is live', async () => {
    expect(await quarterTurns(page)).toBe(0);
    await expect(undo).toBeEnabled();
  });
  for (let i = 0; i < HISTORY_LIMIT; i++) await hand.tap(undo);
  await check('after 50 Undos the photo is upside down: the state after the second turn',
    async () => {
      expect(await quarterTurns(page)).toBe(EXTRA_TURNS);
    });
  await check('Undo is greyed out: the first two turns can\'t be undone', async () => {
    await expect(undo).toBeDisabled();
  });
});

test('TOP-07.1 A drag becomes an undo step when the finger lifts [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo);
  const undo = page.locator('#btnUndo');
  const before = await cornersNow(page);
  const start = await handleOnPage(page, 0);
  const end = offsetBy(start, 0, CORNER_DRAG_PX);
  await holdDragAt(page, hand, start, end);
  await check('the corner follows the finger; Undo is still greyed out', async () => {
    const now = await handleOnPage(page, 0);
    expect(Math.abs(now.y - end.y)).toBeLessThan(PLACE_TOLERANCE_PX);
    expect(await isDimmed(undo)).toBe(true);
  });
  await sendTouch(page, '#view', 'pointerup', end);
  await check('once the finger lifts, Undo is live', async () => {
    await expect(undo).toBeEnabled();
  });
  await hand.tap(undo);
  await check('one Undo puts the corner back; Undo is greyed out', async () => {
    expect(await cornersNow(page)).toEqual(before);
    await expect(undo).toBeDisabled();
  });
});

test('TOP-07.2 A drag the phone cancels makes no undo step [phone]', async ({
  page,
  check,
}, testInfo) => {
  test.fail(true, 'BUG-060');
  const hand = await startOn(page, testInfo);
  const before = await cornersNow(page);
  const start = await handleOnPage(page, 0);
  const end = offsetBy(start, 0, CORNER_DRAG_PX);
  await holdDragAt(page, hand, start, end);
  await check('the corner follows the finger', async () => {
    const now = await handleOnPage(page, 0);
    expect(Math.abs(now.y - end.y)).toBeLessThan(PLACE_TOLERANCE_PX);
  });
  await sendTouch(page, '#view', 'pointercancel', end);
  await check('after the browser cancels the touch, Undo is greyed out and the corner is back',
    async () => {
      expect(await isDimmed(page.locator('#btnUndo'))).toBe(true);
      expect(await cornersNow(page)).toEqual(before);
    });
});

test('TOP-08.1 Zoom, steps, Snap, Grid and an unapplied Levels change make no undo step '
  + '[phone]', async ({ page, check }, testInfo) => {
  const hand = await startOn(page, testInfo);
  const undo = page.locator('#btnUndo');
  const zoomBefore = await zoomNow(page);
  await zoomIn(page, hand);
  await check('two fingers zoom the photo in; Undo is greyed out', async () => {
    expect(await zoomNow(page)).toBeGreaterThan(zoomBefore);
    expect(await isDimmed(undo)).toBe(true);
  });
  await hand.tap(page.locator('#toolSnap'));
  await check('Snap reads On; Undo is greyed out', async () => {
    await expect(page.locator('#toolSnap .tool-state')).toHaveText('On');
    expect(await isDimmed(undo)).toBe(true);
  });
  await goToStep(page, 'rotate', hand);
  await openOptions(page, hand, 'rotate');
  await hand.tap(page.locator('#rotateGrid'));
  await check('Grid is off; Undo is greyed out', async () => {
    await expect(page.locator('#rotateGrid')).not.toBeChecked();
    expect(await isDimmed(undo)).toBe(true);
  });
  await closeOptions(page, hand, 'rotate');
  await goToStep(page, 'levels', hand);
  await hand.tap(page.locator('#toolAutoLevels'));
  await check('Auto marks the Levels tab with a dot; Undo is greyed out', async () => {
    await expect(levelsDot(page)).toBeVisible();
    expect(await isDimmed(undo)).toBe(true);
  });
  await hand.tap(page.locator('#btnApplyLevels'));
  await check('Apply takes the dot away; Undo is live', async () => {
    await expect(levelsDot(page)).toBeHidden();
    await expect(undo).toBeEnabled();
  });
});

test('TOP-08.2 Undo takes back a flip, a crop and an export setting, newest first [phone]',
  async ({ page, check }, testInfo) => {
    const hand = await startOn(page, testInfo, 'rotate');
    const undo = page.locator('#btnUndo');
    const isMirrored = async () => (await editState(page)).flip.h;
    await hand.tap(page.locator('#toolFlip'));
    await hand.tap(page.locator('#btnFlipHorizontal'));
    await check('the photo is mirrored left to right', async () => {
      expect(await isMirrored()).toBe(true);
    });
    await goToStep(page, 'crop', hand);
    await hand.tap(presetChip(page, '4:5'));
    await check('4:5 is selected', async () => {
      expect(await selectedChips(page)).toEqual(['4:5']);
    });
    await goToStep(page, 'export', hand);
    await hand.tap(choiceButton(page, 'exportSize', '3000'));
    await check('3000 is selected', async () => {
      await expect(choiceButton(page, 'exportSize', '3000')).toHaveAttribute('aria-pressed',
        'true');
    });
    await hand.tap(undo);
    await check('Undo selects 2000 again', async () => {
      await expect(choiceButton(page, 'exportSize', '2000')).toHaveAttribute('aria-pressed',
        'true');
    });
    await goToStep(page, 'crop', hand);
    await hand.tap(undo);
    await check('on Crop, Undo selects 1:1 again', async () => {
      expect(await selectedChips(page)).toEqual(['1:1']);
    });
    await hand.tap(undo);
    await check('Undo takes back the mirror; Undo is greyed out', async () => {
      expect(await isMirrored()).toBe(false);
      await expect(undo).toBeDisabled();
    });
  });

test('TOP-09.1 On a phone, Fit shows only while the photo is zoomed or moved, and fits it '
  + '[phone]', async ({ page, check }, testInfo) => {
  const hand = await startOn(page, testInfo);
  const fit = page.locator('#btnFit');
  await check('the top bar has no Fit to screen', async () => {
    await expect(fit).toBeHidden();
  });
  await zoomIn(page, hand);
  await check('two fingers zoom in; Fit to screen shows, left of Undo', async () => {
    await expect(fit).toBeVisible();
    const fitBox = await fit.boundingBox();
    const undoBox = await page.locator('#btnUndo').boundingBox();
    expect(fitBox.x + fitBox.width).toBeLessThanOrEqual(undoBox.x + PLACE_TOLERANCE_PX);
  });
  await hand.tap(fit);
  await check('Fit to screen fits the photo again and goes', async () => {
    expect((await viewNow(page)).isFitted).toBe(true);
    await expect(fit).toBeHidden();
  });
  const start = await page.evaluate(() => {
    const box = document.getElementById('view').getBoundingClientRect();
    return { x: box.left + 40, y: box.top + 60 };
  });
  await hand.drag(start, offsetBy(start, 60, 0));
  await check('a drag on an empty part moves the photo; Fit to screen shows', async () => {
    expect((await viewNow(page)).isFitted).toBe(false);
    await expect(fit).toBeVisible();
  });
});

test('TOP-09.2 On a wide screen, Fit always shows, greyed out until a photo is open [desktop]',
  async ({ page, check }, testInfo) => {
    const hand = handFor(page, testInfo);
    await openApp(page);
    const fit = page.locator('#btnFit');
    await check('Fit to screen shows, greyed out; tooltip "Fit to screen (F)"', async () => {
      await expect(fit).toBeVisible();
      await expect(fit).toBeDisabled();
      await expect(fit).toHaveAttribute('title', 'Fit to screen (F)');
    });
    await openPhoto(page, PHOTO);
    await check('with the photo open, Fit to screen is live', async () => {
      await expect(fit).toBeEnabled();
    });
    await zoomIn(page, hand);
    await check('the wheel zooms the photo in', async () => {
      expect((await viewNow(page)).isFitted).toBe(false);
    });
    await hand.tap(fit);
    await check('Fit to screen fits it again, and still shows', async () => {
      expect((await viewNow(page)).isFitted).toBe(true);
      await expect(fit).toBeVisible();
    });
  });

test('TOP-10.1 The six step tabs, in order, with the current one marked [both]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo);
  const tabs = page.locator('.step-tab:visible');
  await check('six tabs in order, Perspective to Export; along the bottom with icons on a phone, '
    + 'text in the top bar on a wide screen', async () => {
    await expect(tabs.locator('.step-tab-label')).toHaveText(STEP_NAMES);
    const host = hand.isTouch ? '#tabBarHost' : '#topBarSteps';
    await expect(page.locator(`${host} .step-tab`)).toHaveCount(STEP_NAMES.length);
    await expect(tabs.locator('svg').first()).toBeVisible({ visible: hand.isTouch });
    if (hand.isTouch) {
      const barBox = await page.locator('#tabBarHost').boundingBox();
      const areaBox = await page.locator('#perspectiveArea').boundingBox();
      expect(barBox.y).toBeGreaterThanOrEqual(areaBox.y + areaBox.height - PLACE_TOLERANCE_PX);
    }
  });
  const current = stepTab(page, 'perspective');
  await check('Perspective is marked: white and bold on a phone, a white pill on a wide screen',
    async () => {
      await expect(current).toHaveAttribute('aria-selected', 'true');
      if (hand.isTouch) {
        expect(await styleOf(current, 'color')).toBe(WHITE);
        expect(Number(await styleOf(current, 'fontWeight'))).toBeGreaterThanOrEqual(700);
        expect(await styleOf(stepTab(page, 'rotate'), 'color')).toBe(QUIET_GREY);
      } else {
        expect(await hasWhiteFill(current)).toBe(true);
        expect(await styleOf(current, 'color')).toBe(PAGE_BLACK);
      }
    });
});

test('TOP-11.1 A step tab opens that step\'s controls only [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo);
  await hand.tap(stepTab(page, 'rotate'));
  await check('Rotate is marked; STRAIGHTEN and the ruler show; Perspective\'s controls have gone',
    async () => {
      await expect(stepTab(page, 'rotate')).toHaveAttribute('aria-selected', 'true');
      await expect(page.locator('#rotateStraightenLine')).toBeVisible();
      await expect(page.locator('#rotateRulerRow')).toBeVisible();
      await expect(page.locator('#perspectiveArea')).toBeHidden();
    });
  await hand.tap(stepTab(page, 'export'));
  await check('Export is marked; the sizes and Download show; Rotate\'s controls have gone',
    async () => {
      await expect(stepTab(page, 'export')).toHaveAttribute('aria-selected', 'true');
      await expect(page.locator('#exportSize')).toBeVisible();
      await expect(page.locator('#btnDownload')).toBeVisible();
      await expect(page.locator('#rotateArea')).toBeHidden();
    });
});

test('TOP-11.2 The step tabs are greyed out and do nothing with no photo open [desktop]',
  async ({ page, check }, testInfo) => {
    const hand = handFor(page, testInfo);
    await openApp(page);
    const tabs = page.locator('#topBarSteps .step-tab');
    await check('all six step tabs are greyed out', async () => {
      await expect(tabs).toHaveCount(STEP_NAMES.length);
      for (const tab of await tabs.all()) await expect(tab).toBeDisabled();
    });
    await tapRegardless(hand, stepTab(page, 'export'));
    await check('a click on Export changes nothing: Perspective is still the step', async () => {
      await expect(stepTab(page, 'perspective')).toHaveAttribute('aria-selected', 'true');
      expect(await page.evaluate(() => window.__straightener.app.tab)).toBe('perspective');
    });
  });

test('TOP-11.3 The step tabs stay live while an export runs [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnExport(page, testInfo, { isWatched: true });
  await downloadAnswering(page, hand, 'No');
  const [start] = await exportStarts(page);
  await check('while the red line runs, no step tab is greyed out', () => {
    expect(start.tabs).toEqual([]);
  });
});

test('TOP-12.1 The Levels dot shows on every step until the change is applied [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnLevels(page, testInfo);
  const dot = levelsDot(page);
  await hand.tap(page.locator('#toolAutoLevels'));
  await check('a white dot shows beside the Levels tab\'s icon', async () => {
    await expect(dot).toBeVisible();
    expect(await styleOf(dot, 'backgroundColor')).toBe(WHITE);
    const dotBox = await dot.boundingBox();
    const iconBox = await stepTab(page, 'levels').locator('svg').boundingBox();
    expect(dotBox.x).toBeGreaterThan(iconBox.x + iconBox.width / 2);
  });
  await goToStep(page, 'export', hand);
  await check('on Export the dot still shows on the Levels tab', async () => {
    await expect(dot).toBeVisible();
  });
  await goToStep(page, 'levels', hand);
  await hand.tap(page.locator('#btnApplyLevels'));
  await check('after Apply the dot has gone', async () => {
    await expect(dot).toBeHidden();
  });
});

test('TOP-12.2 On a wide screen the dot follows the name, dark while Levels is selected '
  + '[desktop]', async ({ page, check }, testInfo) => {
  const hand = await startOnLevels(page, testInfo);
  const dot = levelsDot(page);
  await hand.tap(page.locator('#toolAutoLevels'));
  await check('a dark dot shows right after the word Levels in its white pill', async () => {
    await expect(dot).toBeVisible();
    const labelBox = await stepTab(page, 'levels').locator('.step-tab-label').boundingBox();
    const dotBox = await dot.boundingBox();
    expect(dotBox.x).toBeGreaterThanOrEqual(labelBox.x + labelBox.width);
    expect(await styleOf(dot, 'backgroundColor')).toBe(PAGE_BLACK);
  });
  await goToStep(page, 'export', hand);
  const dotOnExport = 'with Export selected, the Levels tab is not white and its dot is white';
  await check(dotOnExport, async () => {
    expect(await hasWhiteFill(stepTab(page, 'levels'))).toBe(false);
    expect(await styleOf(dot, 'backgroundColor')).toBe(WHITE);
  });
});

// The line above Perspective's controls when a message takes its place.
const perspectiveStatus = page => page.locator('#perspectiveStatus');
const FIND_TEXT = 'Tap the card in the photo.';

// Opens Perspective's options and taps Tap to find card.
async function armFindCard(page, hand) {
  await openOptions(page, hand, 'perspective');
  await hand.tap(page.locator('#btnFindCard'));
  await waitForSheet(page, 'perspective', false);
}

test('TOP-13.1 Changing step cancels Tap to find card [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo);
  await armFindCard(page, hand);
  await check('the line reads "Tap the card in the photo." with Cancel', async () => {
    await expect(perspectiveStatus(page).locator('.status-text')).toHaveText(FIND_TEXT);
    await expect(page.locator('#perspectiveStatusAction')).toHaveText('Cancel');
  });
  await goToStep(page, 'rotate', hand);
  await goToStep(page, 'perspective', hand);
  await check('back on Perspective the line reads NUDGE again', async () => {
    await expect(perspectiveStatus(page)).toBeHidden();
    await expect(page.locator('#perspectiveLine')).toContainText('Nudge');
  });
});

test('TOP-13.2 Leaving Levels disarms the picker [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnLevels(page, testInfo);
  await hand.tap(pickButton(page, 'white'));
  await check('Pick white is selected; the line reads "Tap something white"', async () => {
    expect(await armedPick(page)).toBe('white');
    await expect(page.locator('#levelsHint')).toHaveText('Tap something white');
  });
  await goToStep(page, 'export', hand);
  await goToStep(page, 'levels', hand);
  await check('back on Levels neither pick is selected', async () => {
    expect(await armedPick(page)).toBe('');
  });
});

test('TOP-13.3 Changing step with a key closes the open options [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo, 'rotate');
  await openOptions(page, hand, 'rotate');
  await check('the sheet titled ROTATE OPTIONS rises', async () => {
    await expect(sheetOf(page, 'rotate').locator('.sheet-title')).toHaveText('Rotate options');
  });
  await page.keyboard.press('3');
  await waitForSheet(page, 'rotate', false);
  await check('3 opens the Crop step, and no sheet is open', async () => {
    await expect(stepTab(page, 'crop')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('.sheet-layer.is-open')).toHaveCount(0);
  });
});

test('TOP-13.4 Preview stays on across a step change [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo);
  const previewState = page.locator('#toolPreview .tool-state');
  await hand.tap(page.locator('#toolPreview'));
  await check('Preview reads On; the line reads PREVIEW', async () => {
    await expect(previewState).toHaveText('On');
    await expect(page.locator('#perspectivePreviewLine')).toBeVisible();
  });
  await goToStep(page, 'rotate', hand);
  await goToStep(page, 'perspective', hand);
  await check('back on Perspective, Preview still reads On', async () => {
    await expect(previewState).toHaveText('On');
    await expect(page.locator('#perspectivePreviewLine')).toBeVisible();
  });
});

test('TOP-14.1 With no photo, every control in the side panel is disabled [desktop]', async ({
  page,
  check,
}) => {
  await openApp(page);
  await check('no step\'s controls show in the side panel', async () => {
    await expect(page.locator('#panel .control-area:visible')).toHaveCount(0);
  });
  await check('every button, slider, list and box in the panel is disabled', async () => {
    const live = await page.evaluate(() => [
      ...document.querySelectorAll('#panel button, #panel select, #panel input'),
    ].filter(control => !control.disabled).map(control => control.id || control.className));
    expect(live).toEqual([]);
  });
});

test('TOP-14.2 A disabled control shows at 38% opacity [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo);
  const undo = page.locator('#btnUndo');
  const redo = page.locator('#btnRedo');
  await check('Undo and Redo are greyed out, at 38% opacity', async () => {
    await expect(undo).toBeDisabled();
    expect(await opacityOf(undo)).toBe(DIMMED_OPACITY);
    expect(await opacityOf(redo)).toBe(DIMMED_OPACITY);
  });
  await hand.tap(page.locator('#toolSnap'));
  await check('after Snap, Undo and Redo are still at 38%', async () => {
    expect(await opacityOf(undo)).toBe(DIMMED_OPACITY);
    expect(await opacityOf(redo)).toBe(DIMMED_OPACITY);
  });
});

test('TOP-15.1 The top bar\'s order on a phone and on a wide screen [both]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await makePair(page, testInfo);
  await zoomIn(page, hand);
  await check('the photo zooms in; Fit to screen shows', async () => {
    await expect(page.locator('#btnFit')).toBeVisible();
  });
  const expected = hand.isTouch
    ? ['open', 'front', 'back', 'unpair', 'fit', 'undo', 'redo']
    : ['brand', 'open', 'steps', 'front', 'back', 'unpair', 'undo', 'redo', 'fit'];
  await check(hand.isTouch
    ? 'left to right: Open, Front / Back, Unpair, Fit to screen, Undo, Redo'
    : 'left to right: the app\'s name, Open, the steps, Front / Back, Unpair, Undo, Redo, '
      + 'Fit to screen', async () => {
    expect((await topBarBoxes(page)).map(box => box.name)).toEqual(expected);
  });
});

test('TOP-16.1 The app\'s name, and its version on hover [desktop]', async ({ page, check }) => {
  await openApp(page);
  const brand = page.locator('.top-bar-brand');
  await check('the left end of the top bar shows the app\'s icon, then Card Finisher', async () => {
    await expect(brand).toBeVisible();
    await expect(brand).toHaveText('Card Finisher');
    await expect(brand.locator('img')).toBeVisible();
  });
  await brand.hover();
  const version = await page.evaluate(() => CONFIG.appVersion);
  await check('the tooltip reads "Version " and the build\'s version', async () => {
    await expect(brand).toHaveAttribute('title', `Version ${version}`);
  });
});

// The overlaps between the top bar's controls that can be seen, and anything past the window's
// right edge: a list of what is wrong, empty when the bar fits.
async function topBarProblems(page, width) {
  const boxes = await topBarBoxes(page);
  const problems = [];
  boxes.forEach((box, index) => {
    if (box.right > width + 0.5) problems.push(`${box.name} runs past the right end`);
    const next = boxes[index + 1];
    if (next && next.left < box.right - 0.5) problems.push(`${box.name} overlaps ${next.name}`);
  });
  return problems;
}

test('TOP-17.1 The top bar fits from 1280 px down to 761 px, with a pair open [desktop] '
  + '[webkit]', async ({ page, check }, testInfo) => {
  await makePair(page, testInfo);
  const brand = page.locator('.top-bar-brand');
  const openLabel = page.locator('#btnOpen .icon-button-label');
  for (const width of WIDE_WIDTHS) {
    await page.setViewportSize({ width, height: WIDE_HEIGHT });
    await waitForStill(page);
    const isNameShown = width > NAME_HIDDEN_AT_PX;
    const isIconShown = width > ICON_HIDDEN_AT_PX;
    await check(`at ${width} px: name ${isNameShown ? 'and Open\'s word shown' : 'gone'}, icon `
      + `${isIconShown ? 'shown' : 'gone'}; nothing overlaps`, async () => {
      expect(await topBarProblems(page, width)).toEqual([]);
      await expect(openLabel).toBeVisible({ visible: isNameShown });
      expect(parseFloat(await styleOf(brand, 'fontSize')) > 0).toBe(isNameShown);
      await expect(brand.locator('img')).toBeVisible({ visible: isIconShown });
      await expect(page.locator('#btnUnpair')).toBeVisible();
      await expect(page.locator('#btnFit')).toBeVisible();
    });
  }
});

test('TOP-18.1 Each step\'s options tab opens that step\'s sheet [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo);
  for (const step of Object.keys(SHEET_TITLES)) {
    if (step !== 'perspective') await goToStep(page, step, hand);
    await hand.tap(optionsTab(page, step));
    await waitForSheet(page, step, true);
    await check(`on ${step} the sheet rises, titled ${SHEET_TITLES[step].toUpperCase()}`,
      async () => {
        const title = sheetOf(page, step).locator('.sheet-title');
        await expect(title).toHaveText(SHEET_TITLES[step]);
        await expect(title).toHaveCSS('text-transform', 'uppercase');
        expect(await sheetTopPx(page, step)).toBeLessThan(await areaTopPx(page, step));
      });
    await closeOptions(page, hand, step);
  }
});

test('TOP-18.2 The options tab\'s size, place and arrow [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  await startOn(page, testInfo);
  const tab = optionsTab(page, 'perspective').locator('.handle-tab');
  const areaTop = await areaTopPx(page, 'perspective');
  await check('the tab is 80 px wide, centered, and rises 24 px over the photo', async () => {
    const box = await tab.boundingBox();
    expect(box.width).toBe(80);
    expect(Math.abs(box.x + box.width / 2 - PHONE_WINDOW.width / 2)).toBeLessThan(0.5);
    expect(areaTop - box.y).toBeCloseTo(24, 0);
  });
  const tabLook = 'it is the controls\' color, outlined on its top and sides, not its foot';
  await check(tabLook, async () => {
    expect(await styleOf(tab, 'backgroundColor')).toBe(SURFACE);
    const sides = ['Top', 'Left', 'Right'];
    for (const side of sides) {
      expect(await styleOf(tab, `border${side}Width`)).toBe('1px');
      expect(await styleOf(tab, `border${side}Color`)).toBe(TRACK);
    }
    expect(await styleOf(tab, 'borderBottomWidth')).toBe('0px');
  });
  await check('its arrow is about 16 × 8 px, centered in the tab', async () => {
    const arrow = await glyphBox(page, '#perspectiveAreaGrabber');
    expect(Math.abs(arrow.width - ARROW_WIDTH_PX)).toBeLessThanOrEqual(ARROW_TOLERANCE_PX);
    expect(Math.abs(arrow.height - ARROW_HEIGHT_PX)).toBeLessThanOrEqual(ARROW_TOLERANCE_PX);
    expect(Math.abs(arrow.middleX - PHONE_WINDOW.width / 2)).toBeLessThan(0.5);
  });
  await check('its name is "Options"', async () => {
    await expect(optionsTab(page, 'perspective')).toHaveAttribute('aria-label', 'Options');
  });
});

// Presses Tab until the focus is on `locator`, or MAX_TABS times. Returns true when it got there.
async function tabTo(page, locator) {
  for (let i = 0; i < MAX_TABS; i++) {
    if (await locator.evaluate(el => el === document.activeElement)) return true;
    await page.keyboard.press('Tab');
  }
  return locator.evaluate(el => el === document.activeElement);
}

test('TOP-18.3 Enter and Space on the options tab open the sheet [phone]', async ({
  page,
  check,
}, testInfo) => {
  test.fail(true, 'BUG-150');
  const hand = await startOn(page, testInfo, 'rotate');
  const tab = optionsTab(page, 'rotate');
  const hasFocus = await tabTo(page, tab);
  await check('Tab brings the focus to the options tab', () => {
    expect(hasFocus).toBe(true);
  });
  await page.keyboard.press('Enter');
  await check('Enter opens the sheet titled ROTATE OPTIONS', async () => {
    expect(await isSheetOpen(page, 'rotate')).toBe(true);
  });
  await closeOptions(page, hand, 'rotate');
  await tabTo(page, tab);
  await page.keyboard.press(' ');
  await check('Space opens it again', async () => {
    expect(await isSheetOpen(page, 'rotate')).toBe(true);
  });
});

test('TOP-19.1 A drag on the options tab pulls the sheet, and settles it by a third [phone] '
  + '[webkit]', async ({ page, check }, testInfo) => {
  const hand = await startOn(page, testInfo);
  const travelPx = await sheetTravelPx(page, hand, 'perspective');
  const areaTop = await areaTopPx(page, 'perspective');
  const tabSelector = '#perspectiveAreaGrabber';
  const sheetTab = '#perspectiveSheet .sheet-grabber';
  const start = await middleOnPage(page, tabSelector);
  const held = await holdFingerDrag(page, tabSelector, start, -HALF * travelPx);
  await check('the sheet\'s top edge has come up with the finger, half way', async () => {
    const top = await sheetTopPx(page, 'perspective');
    expect(Math.abs(areaTop - top - HALF * travelPx)).toBeLessThan(PLACE_TOLERANCE_PX);
  });
  await liftFinger(page, tabSelector, held);
  await waitForSheet(page, 'perspective', true);
  await check('lifted, it rises the rest of the way and is open', async () => {
    expect(await isSheetOpen(page, 'perspective')).toBe(true);
  });
  await waitForStill(page);
  await dragTab(page, sheetTab, FIFTH * travelPx);
  await waitForStill(page);
  await check('dragged down a fifth, it goes back up: still open', async () => {
    expect(await isSheetOpen(page, 'perspective')).toBe(true);
  });
  await dragTab(page, sheetTab, HALF * travelPx);
  await waitForSheet(page, 'perspective', false);
  await check('dragged down half the travel, it closes', async () => {
    expect(await isSheetOpen(page, 'perspective')).toBe(false);
  });
  await dragTab(page, tabSelector, -FIFTH * travelPx);
  await waitForSheet(page, 'perspective', false);
  await check('dragged up a fifth, it drops back: closed', async () => {
    expect(await isSheetOpen(page, 'perspective')).toBe(false);
  });
});

test('TOP-19.2 A drag the phone cancels leaves the sheet as it was [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo);
  const travelPx = await sheetTravelPx(page, hand, 'perspective');
  const areaTop = await areaTopPx(page, 'perspective');
  const tabSelector = '#perspectiveAreaGrabber';
  const start = await middleOnPage(page, tabSelector);
  const held = await holdFingerDrag(page, tabSelector, start, -HALF * travelPx);
  await check('the sheet has come up half way', async () => {
    const top = await sheetTopPx(page, 'perspective');
    expect(Math.abs(areaTop - top - HALF * travelPx)).toBeLessThan(PLACE_TOLERANCE_PX);
  });
  await liftFinger(page, tabSelector, held, 'pointercancel');
  await waitForSheet(page, 'perspective', false);
  await check('after the browser cancels the touch, the sheet is closed, as before', async () => {
    expect(await isSheetOpen(page, 'perspective')).toBe(false);
  });
});

test('TOP-20.1 An up arrow on the closed tab, a flat bar on the open sheet\'s [phone] [webkit]',
  async ({ page, check }, testInfo) => {
    const hand = await startOn(page, testInfo, 'rotate');
    const areaTab = optionsTab(page, 'rotate').locator('.handle-tab');
    const expectArrow = async () => {
      const arrow = await glyphBox(page, '#rotateAreaGrabber');
      expect(Math.abs(arrow.width - ARROW_WIDTH_PX)).toBeLessThanOrEqual(ARROW_TOLERANCE_PX);
      expect(Math.abs(arrow.height - ARROW_HEIGHT_PX)).toBeLessThanOrEqual(ARROW_TOLERANCE_PX);
    };
    await check('the options tab holds an up arrow, about 16 × 8 px', expectArrow);
    await openOptions(page, hand, 'rotate');
    await waitForStill(page);
    await check('open, the sheet\'s tab holds a flat bar about 36 × 5 px; the controls\' tab '
      + 'can\'t be seen', async () => {
      const bar = await glyphBox(page, '#rotateSheet .sheet-grabber');
      expect(Math.abs(bar.width - BAR_WIDTH_PX)).toBeLessThan(1);
      expect(Math.abs(bar.height - BAR_HEIGHT_PX)).toBeLessThan(1);
      for (const arm of await tabArms(page, '#rotateSheet .sheet-grabber')) {
        expect(Math.abs(arm.angleDeg)).toBeLessThan(0.5);
      }
      expect(await opacityOf(areaTab)).toBe('0');
    });
    await closeOptions(page, hand, 'rotate');
    await check('closed, the controls\' tab shows again, with its up arrow', async () => {
      expect(await opacityOf(areaTab)).toBe('1');
      await expectArrow();
    });
  });

test('TOP-20.2 The arrow flattens as the sheet is dragged up, for a person to judge [phone]',
  async ({ page, check }, testInfo) => {
    const hand = await startOn(page, testInfo);
    const travelPx = await sheetTravelPx(page, hand, 'perspective');
    const tabSelector = '#perspectiveAreaGrabber';
    const sheetTab = '#perspectiveSheet .sheet-grabber';
    const start = await middleOnPage(page, tabSelector);
    await holdFingerDrag(page, tabSelector, start, -FIFTH * travelPx);
    await check('a fifth of the way up, each arm slopes at about 22°', async () => {
      const slopes = (await tabArms(page, sheetTab)).map(arm => Math.abs(arm.angleDeg));
      for (const slope of slopes) expect(slope).toBeCloseTo(22.5, 0);
    });
    await check.eye('a fifth of the way up: the tab\'s arrow is half flattened, a shallow arrow');
    const held = await moveFinger(page, tabSelector, offsetBy(start, 0, -FIFTH * travelPx),
      -(HALF - FIFTH) * travelPx);
    await check('half way up, the arms are level: a flat bar', async () => {
      for (const arm of await tabArms(page, sheetTab)) {
        expect(Math.abs(arm.angleDeg)).toBeLessThan(0.5);
      }
    });
    await check.eye('half way up: the tab holds a flat bar');
    await liftFinger(page, tabSelector, held);
  });

test('TOP-21.1 A corner under the options tab is dragged, and the sheet stays shut [phone] '
  + '[webkit]', async ({ page, check }, testInfo) => {
  const hand = await startOn(page, testInfo);
  const tabBox = await optionsTab(page, 'perspective').boundingBox();
  const photoBox = await page.locator('#view').boundingBox();
  const onTab = {
    x: tabBox.x + tabBox.width / 2 - CORNER_LEFT_OF_TAB_PX,
    y: photoBox.y + photoBox.height - CORNER_ABOVE_EDGE_PX,
  };
  await hand.drag(await handleOnPage(page, 3), onTab);
  await check('the bottom-left ring is over the options tab', async () => {
    const ring = await handleOnPage(page, 3);
    expect(Math.abs(ring.x - onTab.x)).toBeLessThan(PLACE_TOLERANCE_PX);
    expect(Math.abs(ring.y - onTab.y)).toBeLessThan(PLACE_TOLERANCE_PX);
    expect(await topElementAt(page, onTab)).toBe('perspectiveAreaGrabber');
  });
  // The press lands on the tab, which hands it to the photo; the photo then holds the finger
  // (pointer capture), so the moves and the lift go to the photo, as a real finger's would.
  const lifted = offsetBy(onTab, 0, -CORNER_LIFT_PX);
  await sendTouch(page, '#perspectiveAreaGrabber', 'pointerdown', onTab);
  for (let i = 1; i <= 8; i++) {
    await sendTouch(page, '#view', 'pointermove', offsetBy(onTab, 0, -CORNER_LIFT_PX * i / 8));
  }
  await sendTouch(page, '#view', 'pointerup', lifted);
  await check('the corner moved 60 px up with the finger; no sheet opened', async () => {
    const ring = await handleOnPage(page, 3);
    expect(Math.abs(ring.y - lifted.y)).toBeLessThan(PLACE_TOLERANCE_PX);
    expect(await isSheetOpen(page, 'perspective')).toBe(false);
  });
});

// The body of TOP-22.1 and TOP-22.2: a tap on `control` where it lies under the options tab's
// touch area takes the tap (`isTaken` says how to see it), and a tap on the tab's raised strip,
// above it, opens the sheet.
async function checkControlUnderTab(page, check, hand, step, control, isTaken, description) {
  // While a step's controls fade in (0.12 s after the step opens) the tab is on top of them.
  await waitForStill(page);
  const tabBox = await optionsTab(page, step).boundingBox();
  const controlBox = await control.boundingBox();
  const areaTop = await areaTopPx(page, step);
  const left = Math.max(tabBox.x, controlBox.x);
  const right = Math.min(tabBox.x + tabBox.width, controlBox.x + controlBox.width);
  const underTab = { x: (left + right) / 2, y: areaTop + UNDER_TAB_PX };
  await check('that part of the control lies under the options tab\'s touch area', () => {
    expect(right).toBeGreaterThan(left);
    expect(underTab.y).toBeLessThan(tabBox.y + tabBox.height);
  });
  await page.touchscreen.tap(underTab.x, underTab.y);
  await check(description, async () => {
    await isTaken();
    expect(await isSheetOpen(page, step)).toBe(false);
  });
  return { x: tabBox.x + tabBox.width / 2, y: areaTop - RAISED_STRIP_PX };
}

test('TOP-22.1 Rotate\'s angle under the options tab takes the tap [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo, 'rotate');
  const strip = await checkControlUnderTab(page, check, hand, 'rotate',
    page.locator('#rotateAngle'), async () => {
      await expect(page.locator('#rotateAngleField')).toBeVisible();
    }, 'a text box takes the angle\'s place; no sheet opens');
  await hand.tap(page.locator('#btnAngleDone'));
  await page.touchscreen.tap(strip.x, strip.y);
  await waitForSheet(page, 'rotate', true);
  await check('a tap on the tab\'s strip 35 px above the controls opens ROTATE OPTIONS',
    async () => {
      expect(await isSheetOpen(page, 'rotate')).toBe(true);
    });
});

test('TOP-22.2 Size and Format under the options tab take the tap [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo, 'export');
  const original = choiceButton(page, 'exportSize', 'Original');
  const strip = await checkControlUnderTab(page, check, hand, 'export', original, async () => {
    await expect(original).toHaveAttribute('aria-pressed', 'true');
  }, 'Original is selected; no sheet opens');
  await page.touchscreen.tap(strip.x, strip.y);
  await waitForSheet(page, 'export', true);
  await check('a tap on the tab\'s strip 35 px above the controls opens EXPORT OPTIONS',
    async () => {
      expect(await isSheetOpen(page, 'export')).toBe(true);
    });
});

test('TOP-23.1 An open sheet covers the lower photo, at most 470 px, and scrolls inside '
  + '[phone] [webkit]', async ({ page, check }, testInfo) => {
  const hand = await startOn(page, testInfo);
  const photo = page.locator('#view');
  const photoBefore = await photo.boundingBox();
  await openOptions(page, hand, 'perspective');
  await waitForStill(page);
  const sheet = sheetOf(page, 'perspective').locator('.sheet');
  await check('the sheet covers the lower part of the photo; the photo area keeps its size',
    async () => {
      expect(await photo.boundingBox()).toEqual(photoBefore);
      const top = await sheetTopPx(page, 'perspective');
      expect(top).toBeGreaterThan(photoBefore.y);
      expect(top).toBeLessThan(photoBefore.y + photoBefore.height);
    });
  await hand.tap(page.locator('#perspectiveTips'));
  await check('with the tips open, the sheet is 470 px tall, no more', async () => {
    expect((await sheet.boundingBox()).height).toBeCloseTo(SHEET_MAX_PX, 0);
  });
  const body = sheetOf(page, 'perspective').locator('.sheet-body');
  const topBefore = await sheetTopPx(page, 'perspective');
  await body.evaluate(el => el.scrollBy(0, 100));
  await check('its content scrolls inside it; the sheet stays where it is', async () => {
    expect(await body.evaluate(el => el.scrollTop)).toBeGreaterThan(0);
    expect(await sheetTopPx(page, 'perspective')).toBe(topBefore);
  });
});

test('TOP-24.1 Opening a sheet puts the focus on its cross; a closed sheet is hidden [phone] '
  + '[webkit]', async ({ page, check }, testInfo) => {
  await startOn(page, testInfo, 'rotate');
  const close = sheetOf(page, 'rotate').locator('.sheet-close');
  await optionsTab(page, 'rotate').click();
  await waitForSheet(page, 'rotate', true);
  await check('ROTATE OPTIONS rises; the focus is on its cross, named Close', async () => {
    await expect(close).toBeFocused();
    await expect(close).toHaveAttribute('aria-label', 'Close');
  });
  await close.click();
  await check('the sheet slides down, and once still it is gone from the page', async () => {
    await expect(sheetOf(page, 'rotate')).toBeHidden();
    expect(await sheetOf(page, 'rotate').evaluate(el => el.hidden)).toBe(true);
  });
});

test('TOP-25.1 The cross closes the sheet [phone]', async ({ page, check }, testInfo) => {
  const hand = await startOn(page, testInfo, 'crop');
  await hand.tap(optionsTab(page, 'crop'));
  await waitForSheet(page, 'crop', true);
  const close = sheetOf(page, 'crop').locator('.sheet-close');
  await check('CROP OPTIONS rises, with a cross named Close at its top right', async () => {
    await expect(close).toBeVisible();
    await expect(close).toHaveAttribute('aria-label', 'Close');
    const closeBox = await close.boundingBox();
    const titleBox = await sheetOf(page, 'crop').locator('.sheet-title').boundingBox();
    expect(closeBox.x).toBeGreaterThan(titleBox.x + titleBox.width);
  });
  await hand.tap(close);
  await waitForSheet(page, 'crop', false);
  await check('the sheet closes; Crop\'s controls are there', async () => {
    expect(await isSheetOpen(page, 'crop')).toBe(false);
    await expect(page.locator('#cropArea')).toBeVisible();
  });
});

test('TOP-26.1 A tap on the dimmed photo closes the sheet [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo, 'rotate');
  const viewBefore = await viewNow(page);
  await hand.tap(optionsTab(page, 'rotate'));
  await waitForSheet(page, 'rotate', true);
  await check('the sheet rises and the dim shows over the rest of the screen', async () => {
    await expect(sheetOf(page, 'rotate').locator('.sheet-scrim')).toBeVisible();
  });
  await waitForStill(page);
  await page.touchscreen.tap(PHONE_WINDOW.width / 2, DIM_TAP_Y_PX);
  await waitForSheet(page, 'rotate', false);
  await check('a tap on the dimmed photo closes it; the photo has not moved', async () => {
    expect(await isSheetOpen(page, 'rotate')).toBe(false);
    expect(await viewNow(page)).toEqual(viewBefore);
  });
});

test('TOP-26.2 The tap that opens a sheet doesn\'t close it again [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo, 'rotate');
  await hand.tap(optionsTab(page, 'rotate'));
  await check('the sheet rises', async () => {
    expect(await isSheetOpen(page, 'rotate')).toBe(true);
  });
  await page.waitForTimeout(STAY_OPEN_MS);
  await check('a second later it is still open', async () => {
    expect(await isSheetOpen(page, 'rotate')).toBe(true);
  });
});

test('TOP-27.1 A drag down on the sheet\'s tab or title closes it [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo);
  await openOptions(page, hand, 'perspective');
  await check('PERSPECTIVE OPTIONS is open', async () => {
    expect(await isSheetOpen(page, 'perspective')).toBe(true);
  });
  await waitForStill(page);
  await dragTab(page, '#perspectiveSheet .sheet-grabber', CLOSE_DRAG_PX);
  await waitForSheet(page, 'perspective', false);
  await check('a drag 120 px down on the sheet\'s tab closes it', async () => {
    expect(await isSheetOpen(page, 'perspective')).toBe(false);
  });
  await openOptions(page, hand, 'perspective');
  await waitForStill(page);
  await dragTab(page, '#perspectiveSheet .sheet-header', CLOSE_DRAG_PX);
  await waitForSheet(page, 'perspective', false);
  await check('a drag 120 px down on its title closes it', async () => {
    expect(await isSheetOpen(page, 'perspective')).toBe(false);
  });
});

test('TOP-27.2 A tap on the sheet\'s tab or title closes it [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo);
  await openOptions(page, hand, 'perspective');
  await waitForStill(page);
  const tabMiddle = await middleOnPage(page, '#perspectiveSheet .sheet-grabber');
  await page.touchscreen.tap(tabMiddle.x, tabMiddle.y);
  await waitForSheet(page, 'perspective', false);
  await check('a tap on the sheet\'s tab closes it', async () => {
    expect(await isSheetOpen(page, 'perspective')).toBe(false);
  });
  await openOptions(page, hand, 'perspective');
  await waitForStill(page);
  await hand.tap(sheetOf(page, 'perspective').locator('.sheet-title'));
  await waitForSheet(page, 'perspective', false);
  await check('a tap on the title PERSPECTIVE OPTIONS closes it', async () => {
    expect(await isSheetOpen(page, 'perspective')).toBe(false);
  });
});

test('TOP-28.1 Tap to find card closes the sheet [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo);
  await openOptions(page, hand, 'perspective');
  await check('PERSPECTIVE OPTIONS is open', async () => {
    expect(await isSheetOpen(page, 'perspective')).toBe(true);
  });
  await hand.tap(page.locator('#btnFindCard'));
  await waitForSheet(page, 'perspective', false);
  await check('the sheet closes; the line reads "Tap the card in the photo."', async () => {
    expect(await isSheetOpen(page, 'perspective')).toBe(false);
    await expect(perspectiveStatus(page).locator('.status-text')).toHaveText(FIND_TEXT);
  });
});

test('TOP-28.2 Narrowing a wide window to a phone\'s width closes the options [desktop]',
  async ({ page, check }, testInfo) => {
    await startOn(page, testInfo, 'rotate');
    await check('Rotate\'s options are listed under its controls', async () => {
      await expect(sheetOf(page, 'rotate').locator('.sheet-title')).toBeVisible();
      await expect(page.locator('#rotateGrid')).toBeVisible();
      await expect(page.locator('#rotateResetRow')).toBeVisible();
    });
    await page.setViewportSize(PHONE_WINDOW);
    await check('at 390 px no sheet is open; the options tab shows', async () => {
      await expect(page.locator('.sheet-layer.is-open')).toHaveCount(0);
      await expect(sheetOf(page, 'rotate')).toBeHidden();
      await expect(optionsTab(page, 'rotate')).toBeVisible();
    });
  });

test('TOP-29.1 The dim behind a sheet covers the top bar too [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo, 'rotate');
  await hand.tap(turnRight(page));
  await check('the photo turns; Undo is live', async () => {
    expect(await quarterTurns(page)).toBe(1);
    await expect(page.locator('#btnUndo')).toBeEnabled();
  });
  await openOptions(page, hand, 'rotate');
  await waitForStill(page);
  const undoMiddle = await middleOf(page.locator('#btnUndo'));
  await check('the dim covers the whole screen, the top bar included', async () => {
    const dim = await sheetOf(page, 'rotate').locator('.sheet-scrim').boundingBox();
    expect(dim).toEqual({ x: 0, y: 0, width: PHONE_WINDOW.width, height: PHONE_WINDOW.height });
    expect(await topElementAt(page, undoMiddle)).toBe('rotateSheet');
  });
  await page.touchscreen.tap(undoMiddle.x, undoMiddle.y);
  await waitForSheet(page, 'rotate', false);
  await check('a tap where Undo is closes the sheet; the photo is still turned', async () => {
    expect(await isSheetOpen(page, 'rotate')).toBe(false);
    expect(await quarterTurns(page)).toBe(1);
  });
});

test('TOP-30.1 On a wide screen each step\'s options are listed in the panel [desktop]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo);
  const expectInline = async step => {
    const sheet = sheetOf(page, step);
    const title = sheet.locator('.sheet-title');
    await expect(title).toBeVisible();
    await expect(title).toHaveText(SHEET_TITLES[step]);
    expect(await styleOf(title, 'color')).toBe(QUIET_GREY);
    const titleBox = await title.boundingBox();
    const areaBox = await page.locator(`#${step}Area`).boundingBox();
    expect(titleBox.y).toBeGreaterThan(areaBox.y + areaBox.height - PLACE_TOLERANCE_PX);
    await expect(optionsTab(page, step)).toBeHidden();
    await expect(sheet.locator('.sheet-scrim')).toBeHidden();
    await expect(sheet.locator('.sheet-close')).toBeHidden();
  };
  await check('under Perspective\'s controls: the grey heading PERSPECTIVE OPTIONS, Tap to find '
    + 'card first; no options tab, dim or cross', async () => {
    await expectInline('perspective');
    await expect(page.locator('#btnFindCard')).toBeVisible();
  });
  for (const step of ['rotate', 'crop', 'export']) {
    await goToStep(page, step, hand);
    await check(`${step}: its options listed under ${SHEET_TITLES[step].toUpperCase()}`, () => (
      expectInline(step)
    ));
  }
  await goToStep(page, 'overlay', hand);
  await check('overlay: its tips listed with no OVERLAY OPTIONS heading', async () => {
    await expect(sheetOf(page, 'overlay').locator('.sheet-title')).toBeHidden();
    await expect(sheetOf(page, 'overlay').locator('.sheet-tips')).toBeVisible();
  });
});

const ROTATE_FIRST_TIP = 'Drag the ruler to straighten, or tap the angle to type it.';

test('TOP-31.1 Tips open in place on a phone, and are always open on a wide screen [both]',
  async ({ page, check }, testInfo) => {
    const hand = await startOn(page, testInfo, 'rotate');
    const row = page.locator('#rotateTips');
    const tips = sheetOf(page, 'rotate').locator('.sheet-tips');
    await openOptions(page, hand, 'rotate');
    await check(hand.isTouch
      ? 'a Tips row shows, the tips not shown'
      : 'no Tips row; the tips show, starting with the ruler tip', async () => {
      await expect(row).toBeVisible({ visible: hand.isTouch });
      await expect(tips).toBeVisible({ visible: !hand.isTouch });
      const firstTip = tips.locator('.sheet-hint').first();
      if (!hand.isTouch) await expect(firstTip).toHaveText(ROTATE_FIRST_TIP);
    });
    if (!hand.isTouch) return;
    await hand.tap(row);
    await check('Tips opens the tips under the row, starting with the ruler tip', async () => {
      await expect(tips).toBeVisible();
      await expect(tips.locator('.sheet-hint').first()).toHaveText(ROTATE_FIRST_TIP);
      expect((await tips.boundingBox()).y).toBeGreaterThan((await row.boundingBox()).y);
    });
    await hand.tap(row);
    await check('Tips again closes them', async () => {
      await expect(tips).toBeHidden();
    });
  });

// The tips block of a step's options on a wide screen: its heading and the paragraphs shown.
function shownTips(page, step) {
  return page.evaluate(id => {
    const group = document.querySelector(`#${id} .sheet-tips-group:not(.is-phone-only)`);
    const isShown = el => el.getClientRects().length > 0;
    const heading = group.querySelector('.sheet-tips-heading');
    return {
      heading: heading && isShown(heading) ? heading.textContent : '',
      paragraphs: [...group.querySelectorAll('.sheet-hint')].filter(isShown)
        .map(hint => hint.textContent),
    };
  }, `${step}Sheet`);
}

test('TOP-32.1 Keyboard help under Tips and keys; touch-only tips left out [desktop]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo, 'rotate');
  await check('Rotate: a block headed TIPS AND KEYS, its tips, then "F fits; 1 to 6 change step."',
    async () => {
      const tips = await shownTips(page, 'rotate');
      expect(tips.heading).toBe('Tips and keys');
      expect(tips.paragraphs[0]).toBe(ROTATE_FIRST_TIP);
      expect(tips.paragraphs[tips.paragraphs.length - 1]).toBe('F fits; 1 to 6 change step.');
    });
  await goToStep(page, 'perspective', hand);
  await check('Perspective: no touch tip about dragging a corner; it ends with its keys',
    async () => {
      const tips = await shownTips(page, 'perspective');
      expect(tips.heading).toBe('Tips and keys');
      expect(tips.paragraphs.some(text => text.startsWith('Drag a corner'))).toBe(false);
      expect(tips.paragraphs[tips.paragraphs.length - 1])
        .toMatch(/^Drag corners or edge midpoints\./);
    });
  await goToStep(page, 'export', hand);
  await check('Export: headed TIPS, with no tip about Share\'s Save Image', async () => {
    const tips = await shownTips(page, 'export');
    expect(tips.heading).toBe('Tips');
    expect(tips.paragraphs.some(text => text.includes('Save Image'))).toBe(false);
  });
});

test('TOP-32.2 Levels shows two tips headings on a wide screen [desktop]', async ({
  page,
  check,
}, testInfo) => {
  await startOn(page, testInfo, 'levels');
  await check('LEVELS TIPS over the tips, then a second heading, TIPS AND KEYS, over the compare '
    + 'key', async () => {
    const headings = sheetOf(page, 'levels').locator('.sheet-title:visible, '
      + '.sheet-heading:visible');
    await expect(headings).toHaveText(['Levels tips', 'Tips and keys']);
    await expect(sheetOf(page, 'levels').locator('.sheet-keys .sheet-hint')).toHaveText(
      'Hold C, or press and hold the photo, to compare.',
    );
  });
});

// The status line's icon color and its text, and whether its button shows.
async function statusLook(page) {
  const status = perspectiveStatus(page);
  return {
    text: (await status.locator('.status-text').textContent()).trim(),
    iconColor: await styleOf(status.locator('.status-icon'), 'color'),
    hasButton: await page.locator('#perspectiveStatusAction').isVisible(),
  };
}

test('TOP-33.1 A message takes the line\'s place, its icon colored by kind [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnBlank(page, testInfo);
  await check('an amber icon and "Nothing detected. Drag the corners into place.", no button; '
    + 'the NUDGE line has gone', async () => {
    expect(await statusLook(page)).toEqual({
      text: 'Nothing detected. Drag the corners into place.',
      iconColor: AMBER,
      hasButton: false,
    });
    await expect(page.locator('#perspectiveLine')).toBeHidden();
  });
  await openPhoto(page, PHOTO);
  await armFindCard(page, hand);
  await check('a grey icon and "Tap the card in the photo.", with one small button, Cancel',
    async () => {
      expect(await statusLook(page)).toEqual({
        text: FIND_TEXT,
        iconColor: QUIET_GREY,
        hasButton: true,
      });
      await expect(perspectiveStatus(page).locator('button:visible')).toHaveText(['Cancel']);
    });
  await hand.tap(page.locator('#perspectiveStatusAction'));
  await crossTheCorners(page, hand);
  await check('a red icon and a message about the corners, in at most two lines', async () => {
    const look = await statusLook(page);
    expect(look.iconColor).toBe(P1HUNT_RED);
    expect(look.text).toMatch(/corners/i);
    const textBox = await perspectiveStatus(page).locator('.status-text').boundingBox();
    const lineHeight = parseFloat(await styleOf(perspectiveStatus(page).locator('.status-text'),
      'lineHeight'));
    expect(textBox.height).toBeLessThanOrEqual(2 * lineHeight + 0.5);
  });
});

test('TOP-33.2 A message hides Perspective\'s confidence [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo);
  const readout = page.locator('#perspectiveLine .line-readout');
  await check('the line reads NUDGE Corner 1 of 4, with Confidence and a percentage', async () => {
    await expect(page.locator('#perspectiveLine')).toContainText('Corner 1 of 4');
    await expect(readout).toHaveText(/^Confidence \d+%$/);
    await expect(readout).toBeVisible();
  });
  await armFindCard(page, hand);
  await check('with "Tap the card in the photo." up, the confidence is not shown', async () => {
    await expect(perspectiveStatus(page).locator('.status-text')).toHaveText(FIND_TEXT);
    await expect(readout).toBeHidden();
  });
});

test('TOP-34.1 A red line runs along the top of the controls during an export [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnExport(page, testInfo, { isWatched: true });
  const line = page.locator('#exportAreaProgress');
  await downloadAnswering(page, hand, 'No');
  const [start] = await exportStarts(page);
  await check('a 3 px red line runs along the top edge of the controls, read as a progress bar',
    async () => {
      expect(start.host).toBe('exportArea');
      expect(Math.abs(start.edgeOffsetPx)).toBeLessThanOrEqual(1);
      expect(start.linesShown).toBe(1);
      await expect(line).toHaveAttribute('role', 'progressbar');
      expect(await styleOf(line, 'backgroundColor')).toBe(P1HUNT_RED);
      expect(await styleOf(line, 'height')).toBe('3px');
    });
  await waitForExportEnd(page);
  await check('once the file is saved the line fades out and is gone', async () => {
    await expect(line).toBeHidden();
  });
});

test('TOP-34.2 The line runs along the top of the open Corner shots sheet [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnExport(page, testInfo, { isWatched: true });
  await openCornerSheet(page, hand);
  await check('the Corner shots sheet rises', async () => {
    expect(await isSheetOpen(page, 'cornerShots')).toBe(true);
  });
  await saveCorners(page, hand, 1, 'No');
  const [start] = await exportStarts(page);
  await check('the red line runs along the sheet\'s top edge, and nowhere else', () => {
    expect(start.host).toBe('cornerShotsSheet');
    expect(Math.abs(start.edgeOffsetPx)).toBeLessThanOrEqual(1);
    expect(start.linesShown).toBe(1);
  });
});

test('TOP-35.1 A mode fills white, an action flashes, a switch reads On or Off [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo, 'rotate');
  const straighten = page.locator('#toolStraighten');
  const flip = page.locator('#toolFlip');
  const fillState = page.locator('#toolFillFrame .tool-state');
  await check('Straighten is filled white; Fill frame reads Off', async () => {
    expect(await hasWhiteFill(straighten)).toBe(true);
    await expect(fillState).toHaveText('Off');
  });
  await hand.tap(flip);
  await check('Flip fills white; Straighten is no longer white', async () => {
    expect(await hasWhiteFill(flip)).toBe(true);
    expect(await hasWhiteFill(straighten)).toBe(false);
  });
  const plainFill = await styleOf(turnRight(page), 'backgroundColor');
  // The class changes on 90° right as they happen, with the time of each: the flash is too
  // short for a round trip from the test to catch.
  const flash = page.evaluate(() => new Promise(resolve => {
    const tool = document.getElementById('toolRotateRight');
    const seen = [];
    new MutationObserver(() => {
      seen.push({ isFlashing: tool.classList.contains('is-flashing'), atMs: performance.now() });
      if (seen.length === 2) resolve(seen);
    }).observe(tool, { attributes: true, attributeFilter: ['class'] });
  }));
  await hand.tap(turnRight(page));
  const [lit, unlit] = await flash;
  await check('90° right flashes a lighter shade for about 0.15 s, then is plain', async () => {
    expect([lit.isFlashing, unlit.isFlashing]).toEqual([true, false]);
    expect(unlit.atMs - lit.atMs).toBeGreaterThanOrEqual(140);
    expect(unlit.atMs - lit.atMs).toBeLessThan(FLASH_PAST_MS);
    expect(await styleOf(turnRight(page), 'backgroundColor')).toBe(plainFill);
  });
  await hand.tap(page.locator('#toolFillFrame'));
  await check('Fill frame\'s corner reads On', async () => {
    await expect(fillState).toHaveText('On');
  });
});

test('TOP-36.1 A mode tap swaps the line with a short fade, for a person to judge [phone]',
  async ({ page, check }, testInfo) => {
    const hand = await startOn(page, testInfo);
    const flatten = page.locator('#toolFlatten');
    const nudgeRow = page.locator('#perspectiveNudgeRow');
    await hand.tap(flatten);
    const atTap = {
      isWhite: await hasWhiteFill(flatten),
      isLeaving: await nudgeRow.evaluate(row => row.classList.contains('is-leaving')),
    };
    await check('Flatten fills white at once, and the arrow buttons fade out', () => {
      expect(atTap).toEqual({ isWhite: true, isLeaving: true });
    });
    await page.waitForTimeout(LINE_SWAP_MS * 3);
    await check('the Flatten slider has taken their place', async () => {
      await expect(page.locator('#perspectiveFlattenRow')).toBeVisible();
      await expect(nudgeRow).toBeHidden();
    });
    await waitForStill(page);
    await hand.tap(flatten);
    await check('Flatten again: nothing fades', async () => {
      await expect(page.locator('#perspectiveArea .is-leaving')).toHaveCount(0);
    });
    await hand.tap(stepTab(page, 'rotate'));
    await check('a step change fades Rotate\'s controls in', async () => {
      await expect(page.locator('#rotateArea')).toHaveClass(/is-arriving/);
    });
    await check.eye('Rotate\'s controls fully shown once still: STRAIGHTEN, the angle and the '
      + 'ruler, then the five tools');
  });

test('TOP-36.2 With Preview on, Nudge and Flatten are greyed out [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo);
  await hand.tap(page.locator('#toolPreview'));
  await check('Preview reads On; Nudge and Flatten are greyed out', async () => {
    await expect(page.locator('#toolPreview .tool-state')).toHaveText('On');
    await expect(page.locator('#toolNudge')).toBeDisabled();
    await expect(page.locator('#toolFlatten')).toBeDisabled();
  });
  await tapRegardless(hand, page.locator('#toolFlatten'));
  await check('a tap on Flatten changes nothing: the line still reads PREVIEW', async () => {
    await expect(page.locator('#perspectivePreviewLine')).toBeVisible();
    await expect(page.locator('#perspectiveFlattenRow')).toBeHidden();
  });
});

test('TOP-37.1 Controls take a fill under the mouse, for a person to judge [desktop]', async ({
  page,
  check,
}, testInfo) => {
  await startOn(page, testInfo, 'rotate');
  const hoverFill = async (locator, description, expected) => {
    await locator.hover();
    await waitForStill(page);
    await check(description, async () => {
      expect(await styleOf(locator, 'backgroundColor')).toBe(expected);
    });
    await check.eye(description);
  };
  await hoverFill(turnRight(page), 'under the mouse, 90° right takes a lighter grey fill',
    PRESSED);
  await hoverFill(page.locator('#toolStraighten'), 'Straighten, selected, stays solid white',
    WHITE);
  await hoverFill(page.locator('#btnRedo'), 'Redo, greyed out, doesn\'t change',
    'rgba(0, 0, 0, 0)');
  await hoverFill(stepTab(page, 'crop'), 'the Crop step tab takes the lighter grey fill', PRESSED);
  await hoverFill(page.locator('#btnOpen'), 'Open\'s pill turns the lighter grey', PRESSED);
});
