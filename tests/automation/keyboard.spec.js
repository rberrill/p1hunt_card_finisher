// The keyboard cases (tests/catalog/keyboard.md): undo and redo keys, the shortcuts and when
// they stay out of the way, the number keys, F, C, Tab and the arrow keys on Perspective and
// Overlay, Shift on a Free crop, Escape, the backtick, the focus ring, and keys a focused
// control takes for itself.
// The keys are real key presses; most cases run at desktop size, where a keyboard is. Each test
// reads the app's state only to check a result.
'use strict';
const { test, expect } = require('./support/case.js');
const {
  openApp,
  openPhoto,
  goToStep,
  editState,
  middleOf,
  openOptions,
  waitForStill,
  stepNow,
} = require('./support/app.js');
const { choiceButton, selectedChoices, waitForQuestion } = require('./support/export.js');
const {
  cornersNow,
  handleOnPage,
  tapAt,
  zoomNow,
  handleName,
} = require('./support/perspective.js');
const { startOnLevels, levelsNow, pickButton, armedPick } = require('./support/levels.js');
const { presetChip, cropHandleOnPage } = require('./support/crop.js');
const { fixtureLogo, chooseLogo, logoPlacement } = require('./support/overlay.js');
const {
  PHOTO,
  startOn,
  startHeldExport,
  releaseHeldExport,
  tabTo,
  focusRingOf,
} = require('./support/edits-drop-keys.js');

// The app's white (#f2f2f3), the color of every focus ring.
const RING_WHITE = 'rgb(242, 242, 243)';
// The photo's handles: 0 to 3 the corners, top-left first; 4 to 7 the edges, top edge first.
const TOP_LEFT = 0;
const BOTTOM_LEFT = 3;
const TOP_EDGE = 4;
const LAST_HANDLE = 7;
// How many Tab presses take the focus from a fresh page to the photo: Open, the six steps and
// Fit to screen come first.
const TABS_TO_PHOTO = 9;
// How close two positions of the photo must be, in its px.
const PHOTO_TOLERANCE_PX = 0.01;
// How close two logo placements must be, as fractions of the crop.
const PLACEMENT_TOLERANCE = 1e-6;
// One mouse wheel roll away from the person over the photo, in wheel delta px: zooms in.
const WHEEL_ZOOM_IN_PX = -400;
// How much bigger than fitted the photo must be to count as zoomed in.
const ZOOMED_IN_FACTOR = 1.5;
// How long a case waits to be sure nothing happened, in ms.
const NOTHING_HAPPENS_MS = 500;
// How far the crop box's right edge is dragged on Crop, in CSS px.
const EDGE_DRAG_PX = 60;
// How close two crop shapes (width / height) must be.
const SHAPE_TOLERANCE = 0.01;

// The selected handle's number (0 to 7).
const selectedHandle = page => page.evaluate(() => window.__straightener.app.selected);

// The quarter turns of the photo now.
const quarterNow = async page => (await editState(page)).rotation.quarter;

// Whether the tuning panel is open now.
const isPanelOpen = page => page.locator('#debugPanel').isVisible();

// Clicks the photo area 20 px in from its top-left corner, away from the card, so the photo has
// the focus and the next Tab starts from it.
async function clickPhotoEdge(page, hand) {
  const box = await page.locator('#view').boundingBox();
  await tapAt(page, hand, { x: box.x + 20, y: box.y + 20 });
}

// Rolls the mouse wheel away from the person over the middle of the photo, to zoom in.
async function rollWheelIn(page) {
  const middle = await middleOf(page.locator('#view'));
  await page.mouse.move(middle.x, middle.y);
  await page.mouse.wheel(0, WHEEL_ZOOM_IN_PX);
}

test('KEY-01.1 Ctrl+Z undoes the last edit [desktop]', async ({ page, check }, testInfo) => {
  const hand = await startOn(page, testInfo, { step: 'rotate' });
  await check('Undo\'s tooltip reads "Undo (Ctrl/Cmd+Z)"', async () => {
    await expect(page.locator('#btnUndo')).toHaveAttribute('title', 'Undo (Ctrl/Cmd+Z)');
  });
  await hand.tap(page.locator('#toolRotateRight'));
  await check('90° right turns the photo a quarter clockwise', async () => {
    expect(await quarterNow(page)).toBe(1);
  });
  await page.keyboard.press('Control+z');
  await check('Ctrl+Z turns it back upright; Undo is greyed out', async () => {
    expect(await quarterNow(page)).toBe(0);
    await expect(page.locator('#btnUndo')).toBeDisabled();
  });
});

test('KEY-01.2 During an export, Ctrl+Z does nothing [desktop]', async ({
  page,
  check,
}, testInfo) => {
  test.fail(true, 'BUG-193');
  const hand = await startOn(page, testInfo);
  await hand.tap(choiceButton(page, 'exportFormat', 'PNG'));
  await check('PNG is selected', async () => {
    expect(await selectedChoices(page, 'exportFormat')).toEqual(['PNG']);
  });
  await startHeldExport(page, hand, check);
  await page.keyboard.press('Control+z');
  const during = await selectedChoices(page, 'exportFormat');
  await releaseHeldExport(page);
  await check('Ctrl+Z while the export runs: PNG is still selected', () => {
    expect(during).toEqual(['PNG']);
  });
});

test('KEY-02.1 Shift+Ctrl+Z and Ctrl+Y redo [desktop]', async ({ page, check }, testInfo) => {
  const hand = await startOn(page, testInfo, { step: 'rotate' });
  await check('Redo\'s tooltip reads "Redo (Shift+Ctrl/Cmd+Z)"', async () => {
    await expect(page.locator('#btnRedo')).toHaveAttribute('title', 'Redo (Shift+Ctrl/Cmd+Z)');
  });
  await hand.tap(page.locator('#toolRotateRight'));
  await check('90° right turns the photo a quarter clockwise', async () => {
    expect(await quarterNow(page)).toBe(1);
  });
  await page.keyboard.press('Control+z');
  await check('Ctrl+Z: upright, and Redo is no longer greyed out', async () => {
    expect(await quarterNow(page)).toBe(0);
    await expect(page.locator('#btnRedo')).toBeEnabled();
  });
  await page.keyboard.press('Shift+Control+z');
  await check('Shift+Ctrl+Z turns it a quarter again', async () => {
    expect(await quarterNow(page)).toBe(1);
  });
  await page.keyboard.press('Control+z');
  await check('Ctrl+Z: upright again', async () => {
    expect(await quarterNow(page)).toBe(0);
  });
  await page.keyboard.press('Control+y');
  await check('Ctrl+Y: turned a quarter again; Redo is greyed out', async () => {
    expect(await quarterNow(page)).toBe(1);
    await expect(page.locator('#btnRedo')).toBeDisabled();
  });
});

test('KEY-02.2 During an export, the redo keys do nothing [desktop]', async ({
  page,
  check,
}, testInfo) => {
  test.fail(true, 'BUG-193');
  const hand = await startOn(page, testInfo);
  await hand.tap(choiceButton(page, 'exportFormat', 'PNG'));
  await check('PNG is selected', async () => {
    expect(await selectedChoices(page, 'exportFormat')).toEqual(['PNG']);
  });
  await hand.tap(page.locator('#btnUndo'));
  await check('Undo: JPEG is selected and Redo is no longer greyed out', async () => {
    expect(await selectedChoices(page, 'exportFormat')).toEqual(['JPEG']);
    await expect(page.locator('#btnRedo')).toBeEnabled();
  });
  await startHeldExport(page, hand, check);
  await page.keyboard.press('Shift+Control+z');
  const afterShift = await selectedChoices(page, 'exportFormat');
  await page.keyboard.press('Control+y');
  const afterY = await selectedChoices(page, 'exportFormat');
  await releaseHeldExport(page);
  await check('Shift+Ctrl+Z while the export runs: JPEG is still selected', () => {
    expect(afterShift).toEqual(['JPEG']);
  });
  await check('Ctrl+Y while the export runs: JPEG is still selected', () => {
    expect(afterY).toEqual(['JPEG']);
  });
});

test('KEY-03.1 The undo key undoes the app\'s edit from a switch, a slider or the typed angle '
  + '[desktop]', async ({ page, check }, testInfo) => {
  const hand = await startOn(page, testInfo, { step: 'rotate' });
  const fillFrame = page.locator('#toolFillFrame');
  await hand.tap(fillFrame);
  await check('Fill frame reads On, and has the keyboard focus', async () => {
    await expect(fillFrame).toHaveAttribute('aria-pressed', 'true');
    await expect(fillFrame).toBeFocused();
  });
  await page.keyboard.press('Control+z');
  await check('Ctrl+Z: Fill frame reads Off', async () => {
    await expect(fillFrame).toHaveAttribute('aria-pressed', 'false');
  });
  await hand.tap(page.locator('#rotateAngle'));
  await page.keyboard.type('5');
  await page.keyboard.press('Enter');
  await check('the angle 5 typed: the angle reads 5.0° and the photo turns', async () => {
    await expect(page.locator('#rotateAngle')).toContainText('5.0°');
    expect((await editState(page)).rotation.fine).toBe(5);
  });
  await hand.tap(page.locator('#rotateAngle'));
  await check('a click on the angle: the box opens again showing 5.0, with the focus', async () => {
    await expect(page.locator('#rotateAngleField')).toBeFocused();
    await expect(page.locator('#rotateAngleField')).toHaveValue('5.0');
  });
  await page.keyboard.press('Control+z');
  await check('Ctrl+Z in the box: the photo goes back to 0.0°', async () => {
    expect((await editState(page)).rotation.fine).toBe(0);
  });
  await goToStep(page, 'export', hand);
  await check('Export shows, with Quality at 92% under the controls', async () => {
    expect(await stepNow(page)).toBe('export');
    await expect(page.locator('#qualityValue')).toHaveText('92%');
  });
  const quality = page.locator('#quality');
  await hand.tap(quality);
  await check('a click in the middle of Quality sets it to 75%; the slider has the focus',
    async () => {
      await expect(page.locator('#qualityValue')).toHaveText('75%');
      await expect(quality).toBeFocused();
    });
  await page.keyboard.press('Control+z');
  await check('Ctrl+Z: Quality reads 92% again', async () => {
    await expect(page.locator('#qualityValue')).toHaveText('92%');
  });
});

test('KEY-03.2 In the tuning panel\'s fields, Ctrl+Z is the browser\'s own [desktop]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo, { step: 'rotate' });
  await hand.tap(page.locator('#toolRotateRight'));
  await check('90° right: the photo is turned a quarter', async () => {
    expect(await quarterNow(page)).toBe(1);
  });
  await page.keyboard.press('Backquote');
  const field = page.locator('#debugPanel input[type="number"]').first();
  await check('the backtick opens the tuning panel', async () => {
    await expect(field).toBeVisible();
  });
  const valueBefore = await field.inputValue();
  await hand.tap(field);
  await check('a click in the first number field: it has a text cursor', async () => {
    await expect(field).toBeFocused();
  });
  await page.keyboard.press('End');
  await page.keyboard.type('5');
  await check(`a 5 added at the end of the field: it reads ${valueBefore}5`, async () => {
    await expect(field).toHaveValue(`${valueBefore}5`);
  });
  await page.keyboard.press('Control+z');
  await check(`Ctrl+Z takes back the typing (${valueBefore}); the photo is still turned`,
    async () => {
      await expect(field).toHaveValue(valueBefore);
      expect(await quarterNow(page)).toBe(1);
    });
});

test('KEY-04.1 The shortcuts do nothing while typing, or with Alt held [desktop]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo, { step: 'rotate' });
  const fitted = await zoomNow(page);
  await rollWheelIn(page);
  await check('rolling the mouse wheel over the photo zooms in', async () => {
    await expect.poll(() => zoomNow(page)).toBeGreaterThan(fitted * ZOOMED_IN_FACTOR);
  });
  const angleField = page.locator('#rotateAngleField');
  await hand.tap(page.locator('#rotateAngle'));
  await check('a click on the angle: a box with 0.0 in it, selected', async () => {
    await expect(angleField).toBeFocused();
    await expect(angleField).toHaveValue('0.0');
  });
  await page.keyboard.type('3');
  await check('typing 3 in the angle box: the box shows 3; still on Rotate', async () => {
    await expect(angleField).toHaveValue('3');
    expect(await stepNow(page)).toBe('rotate');
  });
  await page.keyboard.type('f');
  await page.waitForTimeout(NOTHING_HAPPENS_MS);
  await check('typing f: the box shows 3f; the photo is still zoomed in', async () => {
    await expect(angleField).toHaveValue('3f');
    expect(await zoomNow(page)).toBeGreaterThan(fitted * ZOOMED_IN_FACTOR);
  });
  await page.keyboard.press('Escape');
  await check('Escape: the box closes; the angle reads 0.0°', async () => {
    await expect(angleField).toBeHidden();
    await expect(page.locator('#rotateAngle')).toContainText('0.0°');
  });
  await page.keyboard.press('Alt+3');
  await check('Alt+3 leaves the step on Rotate', async () => {
    expect(await stepNow(page)).toBe('rotate');
  });
  await page.keyboard.press('3');
  await check('3 on its own goes to Crop', async () => {
    expect(await stepNow(page)).toBe('crop');
  });
});

test('KEY-04.2 The shortcuts do nothing with Ctrl held [desktop]', async ({
  page,
  check,
}, testInfo) => {
  await startOn(page, testInfo, { step: 'rotate' });
  await page.keyboard.press('Control+Backquote');
  await page.waitForTimeout(NOTHING_HAPPENS_MS);
  await check('Ctrl+`: the tuning panel stays closed', async () => {
    expect(await isPanelOpen(page)).toBe(false);
  });
  await page.keyboard.press('Control+3');
  await check('Ctrl+3: the step is still Rotate', async () => {
    expect(await stepNow(page)).toBe('rotate');
  });
  await page.keyboard.press('Backquote');
  await check('the backtick alone opens the tuning panel', async () => {
    await expect(page.locator('#debugPanel')).toBeVisible();
  });
});

test('KEY-04.3 On a Mac, the shortcuts do nothing with Cmd held [desktop]', async ({
  page,
  check,
}, testInfo) => {
  await startOn(page, testInfo, { step: 'rotate' });
  await page.keyboard.press('Meta+3');
  await check('Cmd+3: the step is still Rotate', async () => {
    expect(await stepNow(page)).toBe('rotate');
  });
  await page.keyboard.press('3');
  await check('3 alone goes to Crop', async () => {
    expect(await stepNow(page)).toBe('crop');
  });
});

test('KEY-05.1 The keys 1 to 6 go to the six steps [desktop]', async ({
  page,
  check,
}, testInfo) => {
  await openApp(page);
  await page.keyboard.press('6');
  await check('with no photo open, 6 does nothing: the start screen stays', async () => {
    await expect(page.locator('#btnOpenEmpty')).toBeVisible();
  });
  await startOn(page, testInfo, { step: 'perspective' });
  await check('IMG_9136.JPEG opens on Perspective', async () => {
    expect(await stepNow(page)).toBe('perspective');
  });
  const steps = ['rotate', 'crop', 'levels', 'overlay', 'export', 'perspective'];
  const keys = ['2', '3', '4', '5', '6', '1'];
  for (const [index, key] of keys.entries()) {
    await page.keyboard.press(key);
    const step = steps[index];
    await check(`${key}: the ${step} step shows, its tab selected`, async () => {
      expect(await stepNow(page)).toBe(step);
      await expect(page.locator(`.step-tab[data-step="${step}"]:visible`))
        .toHaveAttribute('aria-selected', 'true');
    });
  }
});

test('KEY-06.1 F fits the photo to the screen [desktop]', async ({ page, check }, testInfo) => {
  await startOn(page, testInfo, { step: 'rotate' });
  await check('Fit\'s tooltip reads "Fit to screen (F)"', async () => {
    await expect(page.locator('#btnFit')).toHaveAttribute('title', 'Fit to screen (F)');
  });
  const fitted = await zoomNow(page);
  await rollWheelIn(page);
  await check('rolling the mouse wheel over the photo zooms in', async () => {
    await expect.poll(() => zoomNow(page)).toBeGreaterThan(fitted * ZOOMED_IN_FACTOR);
  });
  await page.keyboard.press('f');
  await check('F: the whole photo fits the photo area again', async () => {
    await expect.poll(() => zoomNow(page)).toBeCloseTo(fitted, 5);
  });
});

// A function that tells whether Levels is showing the photo before levels (the comparison, with
// the Before levels badge), for expect.poll. The badge itself is read from the screen only at
// phone size (support/levels.js); at desktop size the photo's own whites can fall where it is.
const isComparing = page => async () => (await levelsNow(page)).isComparing;

test('KEY-07.1 Holding C on Levels shows the photo before levels [desktop]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnLevels(page, testInfo);
  await hand.tap(page.locator('#toolAutoLevels'));
  await check('Auto: the photo is brighter (a draft of levels)', async () => {
    expect((await levelsNow(page)).draft).not.toBeNull();
  });
  await hand.tap(page.locator('#btnApplyLevels'));
  await check('Apply: Apply and Discard are greyed out; the levels are applied', async () => {
    await expect(page.locator('#btnApplyLevels')).toBeDisabled();
    await expect(page.locator('#btnDiscardLevels')).toBeDisabled();
    expect((await levelsNow(page)).applied).not.toBeNull();
  });
  await page.keyboard.down('c');
  await check('holding C: the photo shows without levels, with the Before levels badge',
    async () => {
      await expect.poll(isComparing(page)).toBe(true);
    });
  await page.keyboard.up('c');
  await check('letting go: the levels are back and the badge goes', async () => {
    await expect.poll(isComparing(page)).toBe(false);
  });
  await page.keyboard.down('c');
  await check('holding C again: the Before levels badge shows again', async () => {
    await expect.poll(isComparing(page)).toBe(true);
  });
  // The browser window losing focus, as when another window is clicked: no key or control in
  // the page can do it, so the window is told it has lost focus.
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await check('still holding C, the window losing focus: the comparison ends', async () => {
    await expect.poll(isComparing(page)).toBe(false);
  });
  await page.keyboard.up('c');
});

test('KEY-07.2 With no levels, holding C does nothing [desktop]', async ({
  page,
  check,
}, testInfo) => {
  test.fail(true, 'BUG-102');
  await startOnLevels(page, testInfo);
  await page.keyboard.down('c');
  await page.waitForTimeout(NOTHING_HAPPENS_MS);
  const isComparingWhileHeld = await isComparing(page)();
  await page.keyboard.up('c');
  await check('holding C with no levels: no comparison, no Before levels badge', () => {
    expect(isComparingWhileHeld).toBe(false);
  });
});

// Opens the app afresh with the case's photo, on Perspective, with nothing else clicked: no tab
// is tapped, so nothing on the page has the focus.
async function openAfresh(page) {
  await openApp(page);
  await openPhoto(page, PHOTO);
}

// Presses Tab `count` times.
async function pressTab(page, count) {
  for (let press = 0; press < count; press++) await page.keyboard.press('Tab');
}

test('KEY-08.1 Tab steps through the eight handles once the photo has the focus [desktop]',
  async ({ page, check }) => {
    await openAfresh(page);
    await pressTab(page, TABS_TO_PHOTO);
    await check('Tab, nine times from a fresh page: past Open, the six steps and Fit to the '
      + 'photo, with Corner 1 of 4 selected', async () => {
      await expect(page.locator('#view')).toBeFocused();
      await expect(handleName(page)).toHaveText('Corner 1 of 4');
    });
    await pressTab(page, 4);
    await check('Tab four more times: Edge 1 of 4; the photo still has the focus', async () => {
      await expect(handleName(page)).toHaveText('Edge 1 of 4');
      await expect(page.locator('#view')).toBeFocused();
    });
    await pressTab(page, 3);
    await check('Tab three more times: Edge 4 of 4, the last handle', async () => {
      await expect(handleName(page)).toHaveText('Edge 4 of 4');
      expect(await selectedHandle(page)).toBe(LAST_HANDLE);
    });
    await page.keyboard.press('Tab');
    await check('Tab once more: the photo lets go, and the focus is on Nudge left', async () => {
      await expect(page.locator('#view')).not.toBeFocused();
      await expect(page.locator(':focus')).toHaveAttribute('aria-label', 'Nudge left');
    });
    await page.keyboard.press('Shift+Tab');
    await check('Shift+Tab: back on the photo; the line still reads Edge 4 of 4', async () => {
      await expect(page.locator('#view')).toBeFocused();
      await expect(handleName(page)).toHaveText('Edge 4 of 4');
    });
    await page.keyboard.press('Shift+Tab');
    await check('Shift+Tab: Edge 3 of 4; the photo still has the focus', async () => {
      await expect(handleName(page)).toHaveText('Edge 3 of 4');
      await expect(page.locator('#view')).toBeFocused();
    });
  });

test('KEY-08.2 While Preview is on, Tab doesn\'t step through the handles [desktop]', async ({
  page,
  check,
}, testInfo) => {
  test.fail(true, 'BUG-062');
  const hand = await startOn(page, testInfo, { step: 'perspective' });
  await hand.tap(page.locator('#toolPreview'));
  await check('Preview reads On: the corrected card shows, with no handles', async () => {
    await expect(page.locator('#toolPreview .tool-state')).toHaveText('On');
  });
  await clickPhotoEdge(page, hand);
  await check('a click on the photo: it has the focus; the line reads Corner 1 of 4', async () => {
    await expect(page.locator('#view')).toBeFocused();
    await expect(handleName(page)).toHaveText('Corner 1 of 4');
  });
  await page.keyboard.press('Tab');
  const nameAfter = await handleName(page).textContent();
  const isPhotoFocused = await page.locator('#view').evaluate(el => el === document.activeElement);
  await check('Tab: the line still reads Corner 1 of 4, and the focus has moved on', () => {
    expect({ nameAfter, isPhotoFocused }).toEqual({
      nameAfter: 'Corner 1 of 4',
      isPhotoFocused: false,
    });
  });
});

test('KEY-08.3 Shift+Tab steps back through the handles and leaves before the first '
  + '[desktop]', async ({ page, check }) => {
  await openAfresh(page);
  await pressTab(page, TABS_TO_PHOTO);
  await check('Tab nine times: the photo has the focus; Corner 1 of 4', async () => {
    await expect(page.locator('#view')).toBeFocused();
    await expect(handleName(page)).toHaveText('Corner 1 of 4');
  });
  await page.keyboard.press('Tab');
  await check('Tab: Corner 2 of 4', async () => {
    await expect(handleName(page)).toHaveText('Corner 2 of 4');
  });
  await page.keyboard.press('Shift+Tab');
  await check('Shift+Tab: Corner 1 of 4; the photo still has the focus', async () => {
    await expect(handleName(page)).toHaveText('Corner 1 of 4');
    await expect(page.locator('#view')).toBeFocused();
  });
  await page.keyboard.press('Shift+Tab');
  await check('Shift+Tab: the focus leaves the photo for Fit to screen', async () => {
    await expect(page.locator('#btnFit')).toBeFocused();
  });
  await page.keyboard.press('Tab');
  await check('Tab: back on the photo; the line still reads Corner 1 of 4', async () => {
    await expect(page.locator('#view')).toBeFocused();
    await expect(handleName(page)).toHaveText('Corner 1 of 4');
  });
});

// The ring the photo shows when the keyboard brings the focus to it.
const PHOTO_RING = { width: '2px', style: 'solid', color: RING_WHITE };

// The first three rows of KEY-09.1 and KEY-09.2: a click on the photo (no ring), Shift+Tab to
// Fit to screen, and Tab back to the photo (the ring).
async function tabBackToPhoto(page, check, hand) {
  await clickPhotoEdge(page, hand);
  await check('a click on the photo: it has the focus, with no ring', async () => {
    await expect(page.locator('#view')).toBeFocused();
    expect((await focusRingOf(page, '#view')).style).toBe('none');
  });
  await page.keyboard.press('Shift+Tab');
  await check('Shift+Tab: the focus leaves the photo for Fit to screen', async () => {
    await expect(page.locator('#btnFit')).toBeFocused();
  });
  await page.keyboard.press('Tab');
  await check('Tab back to the photo: a 2 px white ring around it', async () => {
    await expect(page.locator('#view')).toBeFocused();
    expect(await focusRingOf(page, '#view')).toEqual(PHOTO_RING);
  });
}

test('KEY-09.1 The photo shows a white ring when the keyboard brings the focus, not a click '
  + '[desktop] [webkit]', async ({ page, check }, testInfo) => {
  const hand = await startOn(page, testInfo, { step: 'perspective' });
  await tabBackToPhoto(page, check, hand);
});

test('KEY-09.2 After Tab, a click on the photo leaves the ring [desktop] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo, { step: 'perspective' });
  await tabBackToPhoto(page, check, hand);
  await clickPhotoEdge(page, hand);
  await check('a click on the photo now: the ring stays', async () => {
    await expect(page.locator('#view')).toBeFocused();
    expect(await focusRingOf(page, '#view')).toEqual(PHOTO_RING);
  });
});

test('KEY-10.1 The arrow keys move the selected handle; a side moves straight; one undo step '
  + '[desktop]', async ({ page, check }, testInfo) => {
  const hand = await startOn(page, testInfo, { step: 'perspective' });
  const start = await cornersNow(page);
  await tabTo(page, '#view');
  await check('Tab until the photo has the focus: Corner 1 of 4', async () => {
    await expect(handleName(page)).toHaveText('Corner 1 of 4');
  });
  await page.keyboard.press('ArrowRight');
  await check('→ moves the top-left corner 1 photo pixel right', async () => {
    const [corner] = await cornersNow(page);
    expect(Math.abs(corner[0] - start[TOP_LEFT][0] - 1)).toBeLessThan(PHOTO_TOLERANCE_PX);
    expect(Math.abs(corner[1] - start[TOP_LEFT][1])).toBeLessThan(PHOTO_TOLERANCE_PX);
  });
  await page.keyboard.press('Shift+ArrowDown');
  await check('Shift+↓ moves it 10 photo pixels down', async () => {
    const [corner] = await cornersNow(page);
    expect(Math.abs(corner[1] - start[TOP_LEFT][1] - 10)).toBeLessThan(PHOTO_TOLERANCE_PX);
  });
  await hand.tap(page.locator('#btnUndo'));
  await check('one Undo takes both presses back; Undo is greyed out', async () => {
    expect(await cornersNow(page)).toEqual(start);
    await expect(page.locator('#btnUndo')).toBeDisabled();
  });
  await clickPhotoEdge(page, hand);
  await check('a click on the photo: it has the focus; still Corner 1 of 4', async () => {
    await expect(page.locator('#view')).toBeFocused();
    await expect(handleName(page)).toHaveText('Corner 1 of 4');
  });
  await pressTab(page, TOP_EDGE);
  await check('Tab four times: Edge 1 of 4, the top edge', async () => {
    await expect(handleName(page)).toHaveText('Edge 1 of 4');
  });
  const edgeStart = await handleOnPage(page, TOP_EDGE);
  await page.keyboard.press('Shift+ArrowUp');
  await check('Shift+↑: the top edge moves out, straight up from the card, both its corners with '
    + 'it, and nothing else moves', async () => {
    const moved = await cornersNow(page);
    expect(moved[0][1]).toBeLessThan(start[0][1]);
    expect(moved[1][1]).toBeLessThan(start[1][1]);
    expect(moved.slice(2)).toEqual(start.slice(2));
    const edgeNow = await handleOnPage(page, TOP_EDGE);
    expect(edgeNow.y).toBeLessThan(edgeStart.y);
  });
});

test('KEY-10.2 While Preview is on, the arrow keys don\'t move the handle [desktop]', async ({
  page,
  check,
}, testInfo) => {
  test.fail(true, 'BUG-062');
  const hand = await startOn(page, testInfo, { step: 'perspective' });
  const start = await cornersNow(page);
  await hand.tap(page.locator('#toolPreview'));
  await check('Preview reads On', async () => {
    await expect(page.locator('#toolPreview .tool-state')).toHaveText('On');
  });
  for (let press = 0; press < 3; press++) await page.keyboard.press('ArrowRight');
  const corners = await cornersNow(page);
  await check('→ three times: the corners haven\'t moved', () => {
    expect(corners).toEqual(start);
  });
});

// Opens the case's photo on Overlay and adds green-logo.png from tests/fixtures/ with Add logo.
// Returns the hand.
async function startWithLogo(page, testInfo) {
  const hand = await startOn(page, testInfo, { step: 'overlay' });
  await chooseLogo(page, hand, page.locator('#btnOverlayAdd'), fixtureLogo('green-logo.png'));
  return hand;
}

// Expects two numbers to match within PLACEMENT_TOLERANCE.
const expectClose = (actual, expected) => {
  expect(Math.abs(actual - expected)).toBeLessThan(PLACEMENT_TOLERANCE);
};

test('KEY-11.1 On Overlay, the arrow keys move the logo [desktop]', async ({
  page,
  check,
}, testInfo) => {
  await startWithLogo(page, testInfo);
  const start = await logoPlacement(page);
  await check('the logo sits in the middle of the framed photo', () => {
    expect([start.cx, start.cy]).toEqual([0.5, 0.5]);
  });
  await page.keyboard.press('ArrowRight');
  await check('→ moves it right by 0.5% of the framed photo\'s width', async () => {
    expectClose((await logoPlacement(page)).cx, 0.505);
  });
  await page.keyboard.press('Shift+ArrowLeft');
  await check('Shift+← moves it left by 5%', async () => {
    expectClose((await logoPlacement(page)).cx, 0.455);
  });
  await page.keyboard.press('ArrowDown');
  await check('↓ moves it down by 0.5% of the width', async () => {
    const placed = await logoPlacement(page);
    const downPx = (placed.cy - start.cy) * placed.cropHeight;
    expect(Math.abs(downPx - 0.005 * placed.cropWidth)).toBeLessThan(PLACEMENT_TOLERANCE);
  });
});

test('KEY-12.1 On Overlay, plus and minus size the logo [desktop]', async ({
  page,
  check,
}, testInfo) => {
  await startWithLogo(page, testInfo);
  const start = (await logoPlacement(page)).w;
  await page.keyboard.press('+');
  await check('+ makes it 5% wider', async () => {
    expectClose((await logoPlacement(page)).w, start * 1.05);
  });
  await page.keyboard.press('=');
  await check('= makes it 5% wider again', async () => {
    expectClose((await logoPlacement(page)).w, start * 1.05 * 1.05);
  });
  await page.keyboard.press('-');
  await check('− makes it 5% smaller', async () => {
    expectClose((await logoPlacement(page)).w, start * 1.05);
  });
  await page.keyboard.press('_');
  await check('_ makes it 5% smaller again: back to where it started', async () => {
    expectClose((await logoPlacement(page)).w, start);
  });
});

// The crop box's shape and width: { shape: width / height, width } in the straightened
// picture's px.
async function cropNow(page) {
  const crop = await page.evaluate(() => window.__straightener.app.geometry.crop);
  return { shape: crop.width / crop.height, width: crop.width };
}

// Drags the crop box's right edge EDGE_DRAG_PX to the left with the mouse. shiftAt: 'press'
// (Shift held from the press), 'halfway' (pressed halfway through the drag) or 'never'.
async function dragRightEdge(page, shiftAt) {
  const start = await cropHandleOnPage(page, 'e');
  const halfway = { x: start.x - EDGE_DRAG_PX / 2, y: start.y };
  const end = { x: start.x - EDGE_DRAG_PX, y: start.y };
  if (shiftAt === 'press') await page.keyboard.down('Shift');
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(halfway.x, halfway.y, { steps: 4 });
  if (shiftAt === 'halfway') await page.keyboard.down('Shift');
  await page.mouse.move(end.x, end.y, { steps: 4 });
  await page.mouse.up();
  if (shiftAt !== 'never') await page.keyboard.up('Shift');
}

test('KEY-13.1 Shift keeps a Free crop\'s shape [desktop]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo, { step: 'crop' });
  await hand.tap(presetChip(page, 'Free'));
  const first = await cropNow(page);
  await check('Free is selected', async () => {
    await expect(presetChip(page, 'Free')).toHaveAttribute('aria-pressed', 'true');
  });
  await dragRightEdge(page, 'press');
  const second = await cropNow(page);
  await check('the right edge Shift-dragged: the box is smaller, the same shape', () => {
    expect(second.width).toBeLessThan(first.width);
    expect(Math.abs(second.shape - first.shape)).toBeLessThan(SHAPE_TOLERANCE);
  });
  await dragRightEdge(page, 'halfway');
  const third = await cropNow(page);
  await check('the same with Shift pressed halfway: smaller again, still the same shape', () => {
    expect(third.width).toBeLessThan(second.width);
    expect(Math.abs(third.shape - first.shape)).toBeLessThan(SHAPE_TOLERANCE);
  });
  await dragRightEdge(page, 'never');
  await check('the same with no Shift: the box gets narrower; its shape changes', async () => {
    expect((await cropNow(page)).shape).toBeLessThan(first.shape - SHAPE_TOLERANCE);
  });
});

test('KEY-14.1 Escape cancels a question [desktop]', async ({ page, check }, testInfo) => {
  const hand = await startOn(page, testInfo);
  let downloads = 0;
  page.on('download', () => {
    downloads += 1;
  });
  await hand.tap(page.locator('#btnDownload'));
  await check('Download: the question box asks "Upscale to 2000 px?"', async () => {
    await waitForQuestion(page, true);
    await expect(page.locator('#pairPrompt .alert-title')).toHaveText('Upscale to 2000 px?');
  });
  await page.keyboard.press('Escape');
  await check('Escape: the question box closes and nothing is saved', async () => {
    await waitForQuestion(page, false);
    await page.waitForTimeout(NOTHING_HAPPENS_MS);
    expect(downloads).toBe(0);
  });
});

test('KEY-15.1 In the phone layout, Escape closes an options sheet but leaves a pick armed '
  + '[phone]', async ({ page, check }, testInfo) => {
  const hand = await startOn(page, testInfo, { step: 'rotate' });
  await openOptions(page, hand, 'rotate');
  await check('the options tab: ROTATE OPTIONS rise', async () => {
    await expect(page.locator('#rotateSheet .sheet-close')).toBeVisible();
    await expect(page.locator('#rotateSheet')).toContainText(/Rotate options/i);
  });
  await page.keyboard.press('Escape');
  await check('Escape closes them', async () => {
    await expect(page.locator('#rotateSheet')).toBeHidden();
  });
  await goToStep(page, 'levels', hand);
  await check('Levels in the step tabs: the Levels step shows', async () => {
    expect(await stepNow(page)).toBe('levels');
  });
  await hand.tap(pickButton(page, 'white'));
  await check('Pick white is selected', async () => {
    expect(await armedPick(page)).toBe('white');
  });
  await openOptions(page, hand, 'levels');
  await check('the options tab: the Levels tips rise', async () => {
    await expect(page.locator('#levelsSheet .sheet-close')).toBeVisible();
    await expect(page.locator('#levelsSheet')).toContainText(/Levels tips/i);
  });
  await page.keyboard.press('Escape');
  await check('Escape closes the tips; Pick white is still selected', async () => {
    await expect(page.locator('#levelsSheet')).toBeHidden();
    expect(await armedPick(page)).toBe('white');
  });
});

test('KEY-16.1 The backtick opens and closes the tuning panel over a photo [desktop]', async ({
  page,
  check,
}, testInfo) => {
  await startOn(page, testInfo, { step: 'perspective' });
  const panel = page.locator('#debugPanel');
  await check('the tuning panel is closed', async () => {
    await expect(panel).toBeHidden();
  });
  await page.keyboard.press('Backquote');
  await check('` opens it', async () => {
    await expect(panel).toBeVisible();
  });
  await page.keyboard.press('Backquote');
  await check('` again closes it', async () => {
    await expect(panel).toBeHidden();
  });
});

// The controls KEY-17.1 tabs to, one of each kind: the step it is on, the element the ring is
// drawn on, the control that takes the focus and how a person would name it.
const RING_TARGETS = [
  { step: 'export', ring: '#btnDownload', focus: '#btnDownload', name: 'Download' },
  { step: 'export', ring: '#exportSize .segment[data-value="1080"]',
    focus: '#exportSize .segment[data-value="1080"]', name: 'the Size choice 1080' },
  { step: 'crop', ring: '#cropPresets .preset-chip[data-value="free"]',
    focus: '#cropPresets .preset-chip[data-value="free"]', name: 'the Free preset' },
  { step: 'rotate', ring: '#toolFillFrame', focus: '#toolFillFrame', name: 'Fill frame' },
  { step: 'rotate', ring: '#rotateRulerRow .ruler', focus: '#fine', name: 'the ruler' },
];

test('KEY-17.1 Every kind of control shows a white ring when it has the keyboard focus '
  + '[desktop]', async ({ page, check }, testInfo) => {
  const hand = await startOn(page, testInfo, { step: 'export' });
  for (const target of RING_TARGETS) {
    await goToStep(page, target.step, hand);
    await clickPhotoEdge(page, hand);
    await tabTo(page, target.focus);
    await check(`Tab to ${target.name}: a 2 px white ring`, async () => {
      expect(await focusRingOf(page, target.ring)).toEqual({
        width: '2px',
        style: 'solid',
        color: RING_WHITE,
      });
    });
    await waitForStill(page);
    await check.eye(`${target.name} has a 2 px white ring around it, clear of its neighbors`);
  }
});

// Clicks the photo area's edge, then presses Tab until the control `selector` names has the
// focus: KEY-18.1's "Tab to X".
async function tabFromPhotoTo(page, hand, selector) {
  await clickPhotoEdge(page, hand);
  await tabTo(page, selector);
}

// The x of the left edge's two corners (top-left and bottom-left), in the photo's px.
async function leftEdgeX(page) {
  const corners = await cornersNow(page);
  return [corners[TOP_LEFT][0], corners[BOTTOM_LEFT][0]];
}

test('KEY-18.1 A focused control takes its own keys [desktop]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo, { step: 'rotate' });
  await tabFromPhotoTo(page, hand, '#fine');
  await check('Tab to the ruler: a white ring shows around it', async () => {
    expect((await focusRingOf(page, '#rotateRulerRow .ruler')).color).toBe(RING_WHITE);
  });
  await page.keyboard.press('ArrowRight');
  await check('→: the angle moves by 0.1°', async () => {
    expect(Math.abs((await editState(page)).rotation.fine)).toBeCloseTo(0.1, 5);
  });
  await goToStep(page, 'export', hand);
  await check('Export in the step tabs: the Export step shows', async () => {
    expect(await stepNow(page)).toBe('export');
  });
  await tabFromPhotoTo(page, hand, '#quality');
  await check('Tab to Quality: it has the focus', async () => {
    await expect(page.locator('#quality')).toBeFocused();
  });
  await page.keyboard.press('ArrowLeft');
  await check('←: Quality reads 91%', async () => {
    await expect(page.locator('#qualityValue')).toHaveText('91%');
  });
  await goToStep(page, 'perspective', hand);
  await check('Perspective in the step tabs: the Perspective step shows', async () => {
    expect(await stepNow(page)).toBe('perspective');
  });
  await tabFromPhotoTo(page, hand, '#perspectiveNudge .nudge-key[data-key="1,0"]');
  await check('Tab to Nudge right: the line reads Edge 4 of 4, the left edge', async () => {
    await expect(handleName(page)).toHaveText('Edge 4 of 4');
  });
  const start = await leftEdgeX(page);
  await page.keyboard.press('Enter');
  const afterEnter = await leftEdgeX(page);
  await check('Enter: the left edge moves right once', () => {
    expect(afterEnter[0]).toBeGreaterThan(start[0]);
    expect(afterEnter[1]).toBeGreaterThan(start[1]);
  });
  await page.keyboard.press('Space');
  await check('Space: it moves right once more', async () => {
    const afterSpace = await leftEdgeX(page);
    expect(afterSpace[0]).toBeGreaterThan(afterEnter[0]);
    expect(afterSpace[1]).toBeGreaterThan(afterEnter[1]);
  });
});
