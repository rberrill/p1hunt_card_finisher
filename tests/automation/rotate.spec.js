// The Rotate step's cases (tests/catalog/rotate.md): the angle, the Straighten ruler, the typed
// angle, Reset, Flip, the quarter turns, Fill frame, Grid and Reset rotation.
// Each test drives the app as a person would, through hand.tap and hand.drag (a finger on the
// phone targets, the mouse on the wide ones), and reads the app's state only to check a result.
// Every row of a case has its own check, in order, described in the row's own words.
'use strict';
const fs = require('fs');
const { test, expect } = require('./support/case.js');
const {
  openApp,
  openPhoto,
  goToStep,
  editState,
  handFor,
  middleOf,
  openOptions,
  closeOptions,
  readSavedImage,
  pictureOf,
  cropBox,
  waitForStill,
  hasWhiteFill,
  waitInPage,
} = require('./support/app.js');
const {
  pressFinger,
  moveFinger,
  liftFinger,
  zeroTickOnPage,
  saveCopy,
  typeAngle,
  angleText,
} = require('./support/rotate.js');
const { exportStep, downloadStep, answerNo } = require('./support/export.js');

const PHOTO = 'IMG_9136.JPEG';
const SECOND_PHOTO = 'IMG_9075.JPEG';
// The name the app gives the saved picture of PHOTO.
const SAVED_NAME = 'IMG_9136-straight.jpg';
// The question the app asks before saving PHOTO's crop at the default Size, 2000 px.
const UPSCALE_QUESTION = 'Upscale to 2000 px?';
// The ruler's scale: CSS px per degree (RULER_TICK_PX in js/app/parts/ruler.js, and the
// catalog's ROT-02).
const RULER_PX_PER_DEGREE = 11;
const RULER = '#rotateRulerRow .ruler';
// How far in from the ruler's ends a drag "from one end to the other" starts and stops, in CSS
// px: a finger lands on the ruler, not on its very edge.
const RULER_END_INSET_PX = 4;
// The true minus sign the app writes before a negative angle.
const MINUS = '−';
// How close two measured angles must be, in degrees: the angle is kept to 0.1°.
const ANGLE_TOLERANCE_DEG = 0.05;
// How close two positions must be: in the straightened picture's px, or on the page in CSS px.
const POSITION_TOLERANCE_PX = 1;
// A cell of a saved image differs from its mirror twin by less than this on average (0 to
// 255), allowing for JPEG noise; an unmirrored comparison differs by far more.
const MIRROR_TOLERANCE = 6;
// The grid laid over a saved image to compare two of them: cells per side.
const COMPARE_GRID = 16;
// A saved pixel this close to white in every channel is the fill outside the photo.
const FILL_WHITE_MIN = 250;
// How far a hand-drawn crop box is dragged on the Crop step, in CSS px.
const CROP_DRAG_PX = 30;
// A quarter-turned photo's top middle lies within this fraction of the picture's edge.
const EDGE_FRACTION = 0.1;

// Opens the app with the case's photo and goes to Rotate. Returns the hand for this target.
async function startOnRotate(page, testInfo) {
  const hand = handFor(page, testInfo);
  await openApp(page);
  await openPhoto(page, PHOTO);
  await goToStep(page, 'rotate', hand);
  return hand;
}
// The text box that takes the angle's place while it is typed.
const angleField = page => page.locator('#rotateAngleField');

// The [start, end] of a text box's selection, in characters.
function selectionOf(field) {
  return field.evaluate(box => [box.selectionStart, box.selectionEnd]);
}

// Taps the angle (a row of its own): checks that a text box takes its place, focused, holding
// `shown`, all of it selected, with the angle and its pencil gone.
async function tapAngleStep(page, hand, check, shown, description) {
  await hand.tap(page.locator('#rotateAngle'));
  const wording = description || `a text box takes the angle's place, with ${shown} in it, `
    + 'selected';
  await check(wording, async () => {
    const field = angleField(page);
    await expect(field).toBeVisible();
    await expect(field).toBeFocused();
    await expect(field).toHaveValue(shown);
    await expect(page.locator('#rotateAngle')).toBeHidden();
    expect(await selectionOf(field)).toEqual([0, shown.length]);
  });
}

// Types `text` into the open box (a row of its own) and checks that it shows `shown`.
async function typeStep(page, check, text, shown = text) {
  await page.keyboard.type(text);
  await check(`the box shows ${shown}`, async () => {
    await expect(angleField(page)).toHaveValue(shown);
  });
}

// Taps ± (a row of its own) and checks that the box shows `shown`.
async function signStep(page, hand, check, shown) {
  await hand.tap(page.locator('#btnAngleSign'));
  await check(`the box shows ${shown}`, async () => {
    await expect(angleField(page)).toHaveValue(shown);
  });
}

// Taps Done (a row of its own) and checks that the box has closed and the angle reads `angle`.
async function doneStep(page, hand, check, angle, description) {
  await hand.tap(page.locator('#btnAngleDone'));
  await check(description || `the angle reads ${angle}`, async () => {
    await expect(angleField(page)).toBeHidden();
    await expect(angleText(page)).toHaveText(angle);
  });
}

// Drags the Straighten ruler sideways by dx CSS px from its middle (dragging right lowers the
// angle).
async function dragRuler(page, hand, dx) {
  const start = await middleOf(page.locator(RULER));
  await hand.drag(start, { x: start.x + dx, y: start.y }, RULER);
}

// Drags the ruler from one of its ends to the other: 'left' drags from the right end to the left
// end (the angle rises), 'right' from the left end to the right end.
async function dragRulerEndToEnd(page, hand, direction) {
  const box = await page.locator(RULER).boundingBox();
  const middleY = box.y + box.height / 2;
  const left = { x: box.x + RULER_END_INSET_PX, y: middleY };
  const right = { x: box.x + box.width - RULER_END_INSET_PX, y: middleY };
  const [start, end] = direction === 'left' ? [right, left] : [left, right];
  await hand.drag(start, end, RULER);
}

// The angle shown, in degrees, read from the screen's text (true minus sign and all).
async function shownAngleDeg(page) {
  const text = await angleText(page).textContent();
  return Number(text.replace(MINUS, '-').replace('°', ''));
}

// The photo's tilt on screen, in degrees, clockwise positive: the angle of its top edge in the
// straightened picture. Perspective has its own effect on that edge, so only a change in the
// tilt is meaningful: Straighten's angle adds to it exactly.
async function tiltDeg(page) {
  const { width } = (await editState(page)).source;
  const { points } = await pictureOf(page, [[0, 0], [width, 0]]);
  const [left, right] = points;
  return Math.atan2(right[1] - left[1], right[0] - left[0]) * 180 / Math.PI;
}

// Points spread over the photo (source px), for checking where its parts move to.
async function samplePoints(page) {
  const { width, height } = (await editState(page)).source;
  return [[0.25, 0.2], [0.7, 0.35], [0.4, 0.8]].map(([across, down]) => [
    width * across,
    height * down,
  ]);
}

// Where the photo's top middle is in the straightened picture, as fractions of the picture's
// width and height: { across, down }, 0 to 1 from the top-left.
async function topMiddleInPicture(page) {
  const { width } = (await editState(page)).source;
  const picture = await pictureOf(page, [[width / 2, 0]]);
  const [x, y] = picture.points[0];
  return { across: x / picture.width, down: y / picture.height, picture };
}

// Whether the photo lies on its side: the straightened picture is wider than tall.
async function isOnItsSide(page) {
  const { picture } = await topMiddleInPicture(page);
  return picture.width > picture.height;
}

// The card's four corners and their middle in the straightened picture's px: { corners,
// middle }.
async function cardInPicture(page) {
  const { corners } = await editState(page);
  const { points } = await pictureOf(page, corners);
  const middle = [0, 1].map(axis => points.reduce((sum, point) => sum + point[axis], 0) / 4);
  return { corners: points, middle };
}

// The middle of a crop box ({ x, y, width, height }, picture px) as [x, y].
const middleOfBox = box => [box.x + box.width / 2, box.y + box.height / 2];

// The point of the original photo (source px) under the middle of the crop box.
function photoPointUnderCrop(page) {
  return page.evaluate(() => {
    const geometry = window.__straightener.app.geometry;
    const crop = geometry.crop;
    const pictureToSource = window.CF.Mat3.invert(geometry.sourceToRotated);
    const middleX = crop.x + crop.width / 2;
    const middleY = crop.y + crop.height / 2;
    return window.CF.Mat3.apply(pictureToSource, middleX, middleY);
  });
}

// For each corner of the crop box, top-left first and clockwise, whether it lies on the photo:
// mapped back into the original photo, it falls inside its width and height.
function cropCornersOnPhoto(page) {
  return page.evaluate(() => {
    const app = window.__straightener.app;
    const crop = app.geometry.crop;
    const pictureToSource = window.CF.Mat3.invert(app.geometry.sourceToRotated);
    const { width, height } = app.state.source;
    const corners = [
      [crop.x, crop.y],
      [crop.x + crop.width, crop.y],
      [crop.x + crop.width, crop.y + crop.height],
      [crop.x, crop.y + crop.height],
    ];
    return corners.map(([x, y]) => {
      const [sourceX, sourceY] = window.CF.Mat3.apply(pictureToSource, x, y);
      return sourceX >= 0 && sourceX <= width && sourceY >= 0 && sourceY <= height;
    });
  });
}

// Expects two lists of [x, y] points to match within POSITION_TOLERANCE_PX.
function expectSamePoints(actual, expected) {
  expect(actual).toHaveLength(expected.length);
  actual.forEach((point, index) => {
    expect(Math.abs(point[0] - expected[index][0])).toBeLessThan(POSITION_TOLERANCE_PX);
    expect(Math.abs(point[1] - expected[index][1])).toBeLessThan(POSITION_TOLERANCE_PX);
  });
}

// The mean difference (0 to 255) between two grids of cells, comparing each cell of `second`
// with the cell of `first` that `twinOf(row, column)` names.
function gridDifference(first, second, twinOf) {
  let total = 0;
  for (let row = 0; row < COMPARE_GRID; row++) {
    for (let column = 0; column < COMPARE_GRID; column++) {
      const [twinRow, twinColumn] = twinOf(row, column);
      const cell = second.cells[row * COMPARE_GRID + column];
      const twin = first.cells[twinRow * COMPARE_GRID + twinColumn];
      for (let channel = 0; channel < 3; channel++) {
        total += Math.abs(cell[channel] - twin[channel]);
      }
    }
  }
  return total / (COMPARE_GRID * COMPARE_GRID * 3);
}

// Whether a saved pixel ([r, g, b, a], 0 to 255) is the white fill outside the photo.
const isWhiteFill = pixel => pixel.slice(0, 3).every(channel => channel >= FILL_WHITE_MIN);

// Taps Flip in the row of tools (a row of its own) and checks that Horizontal and Vertical
// show, neither of them lit white.
async function flipModeStep(page, hand, check) {
  await hand.tap(page.locator('#toolFlip'));
  await check('Horizontal and Vertical show, neither of them white', async () => {
    const horizontal = page.locator('#btnFlipHorizontal');
    const vertical = page.locator('#btnFlipVertical');
    await expect(horizontal).toBeVisible();
    await expect(vertical).toBeVisible();
    expect(await hasWhiteFill(horizontal)).toBe(false);
    expect(await hasWhiteFill(vertical)).toBe(false);
  });
}

// Taps Undo, the arrow curving left at the top right.
function tapUndo(page, hand) {
  return hand.tap(page.locator('#btnUndo'));
}

test('ROT-01.1 The angle reads with one decimal and a true minus sign [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnRotate(page, testInfo);
  await check('the line reads STRAIGHTEN, then 0.0° with a pencil after it', async () => {
    await expect(page.locator('#rotateStraightenLine .line-label')).toHaveText('Straighten');
    await expect(angleText(page)).toHaveText('0.0°');
    await expect(page.locator('#rotateAngle svg')).toBeVisible();
  });
  await tapAngleStep(page, hand, check, '0.0');
  await typeStep(page, check, '3.5');
  await signStep(page, hand, check, `${MINUS}3.5`);
  await doneStep(page, hand, check, `${MINUS}3.5°`,
    'the angle reads −3.5°: one decimal, and a long minus sign, not a short hyphen');
  await tapAngleStep(page, hand, check, `${MINUS}3.5`,
    'the text box opens, with −3.5 in it, selected');
  await typeStep(page, check, '0.04');
  await signStep(page, hand, check, `${MINUS}0.04`);
  await doneStep(page, hand, check, '0.0°', 'the angle reads 0.0°, with no minus sign');
});

test('ROT-02.1 Dragging the ruler turns the photo, one undo step per drag [phone] [webkit]',
  async ({ page, check }, testInfo) => {
    const hand = await startOnRotate(page, testInfo);
    const tiltBefore = await tiltDeg(page);
    await dragRuler(page, hand, -2 * RULER_PX_PER_DEGREE);
    await check('the angle reads 2.0°; the photo has turned 2° clockwise', async () => {
      await expect(angleText(page)).toHaveText('2.0°');
      expect(Math.abs(await tiltDeg(page) - tiltBefore - 2)).toBeLessThan(ANGLE_TOLERANCE_DEG);
    });
    await dragRuler(page, hand, -RULER_PX_PER_DEGREE);
    await check('the angle reads 3.0°', async () => {
      await expect(angleText(page)).toHaveText('3.0°');
    });
    await tapUndo(page, hand);
    await check('the angle reads 2.0°: only the second drag is undone', async () => {
      await expect(angleText(page)).toHaveText('2.0°');
    });
    await tapUndo(page, hand);
    await check('the angle reads 0.0°', async () => {
      await expect(angleText(page)).toHaveText('0.0°');
    });
    await dragRuler(page, hand, 3 * RULER_PX_PER_DEGREE);
    await check('the angle reads −3.0°', async () => {
      await expect(angleText(page)).toHaveText(`${MINUS}3.0°`);
    });
  });

test('ROT-02.2 The ruler\'s scale, for a person to judge [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnRotate(page, testInfo);
  await waitForStill(page);
  await check.eye('short ticks, one per degree, and a taller tick every fifth; a white upright '
    + 'pointer in the middle stands on a tall tick');
  await dragRuler(page, hand, -2 * RULER_PX_PER_DEGREE);
  await check('the angle reads 2.0°', async () => {
    await expect(angleText(page)).toHaveText('2.0°');
  });
  await waitForStill(page);
  await check.eye('the scale has slid left, and the pointer stands on the second short tick to '
    + 'the right of a tall tick');
});

test('ROT-02.3 The ruler follows the finger one to one [phone]', async ({
  page,
  check,
}, testInfo) => {
  await startOnRotate(page, testInfo);
  const pressed = await zeroTickOnPage(page, RULER);
  // Expects the tall tick to be under the finger, at a page x (CSS px).
  const expectTickUnder = async fingerX => {
    const tick = await zeroTickOnPage(page, RULER);
    expect(Math.abs(tick.x - fingerX)).toBeLessThan(POSITION_TOLERANCE_PX);
  };
  await pressFinger(page, RULER, pressed);
  await check('the angle still reads 0.0°', async () => {
    await expect(angleText(page)).toHaveText('0.0°');
  });
  const twoTicks = { x: pressed.x - 2 * RULER_PX_PER_DEGREE, y: pressed.y };
  await moveFinger(page, RULER, pressed, twoTicks);
  await check('the angle reads 2.0°, and the tall tick has moved with the finger: it is still '
    + 'under it', async () => {
    await expect(angleText(page)).toHaveText('2.0°');
    await expectTickUnder(twoTicks.x);
  });
  const fiveTicks = { x: pressed.x - 5 * RULER_PX_PER_DEGREE, y: pressed.y };
  await moveFinger(page, RULER, twoTicks, fiveTicks);
  await check('the angle reads 5.0°; the tall tick is still under the finger', async () => {
    await expect(angleText(page)).toHaveText('5.0°');
    await expectTickUnder(fiveTicks.x);
  });
  const fourTicks = { x: pressed.x - 4 * RULER_PX_PER_DEGREE, y: pressed.y };
  await moveFinger(page, RULER, fiveTicks, fourTicks);
  await check('the angle reads 4.0°; the tall tick is still under the finger', async () => {
    await expect(angleText(page)).toHaveText('4.0°');
    await expectTickUnder(fourTicks.x);
  });
  await liftFinger(page, RULER, fourTicks);
  await check('the angle still reads 4.0°', async () => {
    await expect(angleText(page)).toHaveText('4.0°');
    expect((await editState(page)).rotation.fine).toBe(4);
  });
});

test('ROT-03.1 A typed angle is kept within ±45° and rounded to 0.1° [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnRotate(page, testInfo);
  await tapAngleStep(page, hand, check, '0.0');
  await typeStep(page, check, '50');
  await doneStep(page, hand, check, '45.0°');
  await tapAngleStep(page, hand, check, '45.0', 'the text box opens, with 45.0 in it, selected');
  await typeStep(page, check, '2.36');
  await doneStep(page, hand, check, '2.4°');
});

test('ROT-03.2 The ruler stops at ±45° [phone]', async ({ page, check }, testInfo) => {
  const hand = await startOnRotate(page, testInfo);
  // Expects the angle shown to lie between two values, in degrees.
  const expectAngleBetween = async (lowest, highest) => {
    const angle = await shownAngleDeg(page);
    expect(angle).toBeGreaterThanOrEqual(lowest);
    expect(angle).toBeLessThanOrEqual(highest);
  };
  await dragRulerEndToEnd(page, hand, 'left');
  await check('the angle reads between 25.0° and 35.0°', async () => {
    await expectAngleBetween(25, 35);
  });
  await dragRulerEndToEnd(page, hand, 'left');
  await check('the angle reads 45.0°: it went no further', async () => {
    await expect(angleText(page)).toHaveText('45.0°');
  });
  await dragRulerEndToEnd(page, hand, 'right');
  await check('the angle reads between 10.0° and 20.0°', async () => {
    await expectAngleBetween(10, 20);
  });
  await dragRulerEndToEnd(page, hand, 'right');
  await check('the angle reads between −25.0° and −10.0°', async () => {
    await expectAngleBetween(-25, -10);
  });
  await dragRulerEndToEnd(page, hand, 'right');
  await check('the angle reads −45.0°: it went no further', async () => {
    await expect(angleText(page)).toHaveText(`${MINUS}45.0°`);
  });
});

test('ROT-04.1 Tapping the angle opens a box to type it in [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnRotate(page, testInfo);
  await tapAngleStep(page, hand, check, '0.0');
  await typeStep(page, check, '3.5');
  await signStep(page, hand, check, `${MINUS}3.5`);
  await doneStep(page, hand, check, `${MINUS}3.5°`);
  await tapAngleStep(page, hand, check, `${MINUS}3.5`, 'a text box takes its place, with −3.5 '
    + 'in it, all of it selected; the pencil has gone');
  await typeStep(page, check, '1');
});

test('ROT-05.1 ± changes the sign of the typed angle and Done saves it [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnRotate(page, testInfo);
  const sign = page.locator('#btnAngleSign');
  const done = page.locator('#btnAngleDone');
  const reset = page.locator('#btnRotateReset');
  const field = angleField(page);
  await check('Reset is there; there is no ± and no Done', async () => {
    await expect(reset).toBeVisible();
    await expect(sign).toBeHidden();
    await expect(done).toBeHidden();
  });
  await hand.tap(page.locator('#rotateAngle'));
  await check('a text box takes the angle\'s place; ± and Done take Reset\'s place', async () => {
    await expect(field).toBeVisible();
    await expect(reset).toBeHidden();
    await expect(sign).toBeVisible();
    await expect(done).toBeVisible();
  });
  await typeStep(page, check, '3.5');
  await hand.tap(sign);
  await check('the box shows −3.5, with the cursor after the 5', async () => {
    await expect(field).toHaveValue(`${MINUS}3.5`);
    await expect(field).toBeFocused();
    const end = `${MINUS}3.5`.length;
    expect(await selectionOf(field)).toEqual([end, end]);
  });
  await typeStep(page, check, '2', `${MINUS}3.52`);
  await signStep(page, hand, check, '3.52');
  await hand.tap(done);
  await check('the angle reads 3.5°; Reset is back, and ± and Done have gone', async () => {
    await expect(angleText(page)).toHaveText('3.5°');
    await expect(reset).toBeVisible();
    await expect(sign).toBeHidden();
    await expect(done).toBeHidden();
  });
});

test('ROT-06.1 Done saves the typed angle as one undo step [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnRotate(page, testInfo);
  const tiltBefore = await tiltDeg(page);
  await tapAngleStep(page, hand, check, '0.0');
  await typeStep(page, check, '7.5');
  await hand.tap(page.locator('#btnAngleDone'));
  await check('the angle reads 7.5°; the photo has turned 7.5° clockwise', async () => {
    await expect(angleText(page)).toHaveText('7.5°');
    expect(Math.abs(await tiltDeg(page) - tiltBefore - 7.5)).toBeLessThan(ANGLE_TOLERANCE_DEG);
  });
  await tapUndo(page, hand);
  await check('the angle reads 0.0°; Undo is greyed out again', async () => {
    await expect(angleText(page)).toHaveText('0.0°');
    await expect(page.locator('#btnUndo')).toBeDisabled();
  });
  await hand.tap(page.locator('#btnRedo'));
  await check('the angle reads 7.5°', async () => {
    await expect(angleText(page)).toHaveText('7.5°');
  });
});

test('ROT-06.2 Enter saves the typed angle [desktop]', async ({ page, check }, testInfo) => {
  const hand = await startOnRotate(page, testInfo);
  await tapAngleStep(page, hand, check, '0.0');
  await typeStep(page, check, '4');
  await page.keyboard.press('Enter');
  await check('the box closes; the angle reads 4.0°', async () => {
    await expect(angleField(page)).toBeHidden();
    await expect(angleText(page)).toHaveText('4.0°');
  });
  await tapUndo(page, hand);
  await check('the angle reads 0.0°', async () => {
    await expect(angleText(page)).toHaveText('0.0°');
  });
});

test('ROT-06.3 Done on an empty box keeps the angle [phone]', async ({
  page,
  check,
}, testInfo) => {
  test.fail(true, 'BUG-002');
  const hand = await startOnRotate(page, testInfo);
  await tapAngleStep(page, hand, check, '0.0');
  await typeStep(page, check, '5');
  await doneStep(page, hand, check, '5.0°');
  await tapAngleStep(page, hand, check, '5.0', 'the text box opens, with 5.0 in it, selected');
  await page.keyboard.press('Backspace');
  await check('the box is empty', async () => {
    await expect(angleField(page)).toHaveValue('');
  });
  await hand.tap(page.locator('#btnAngleDone'));
  await check('the angle still reads 5.0°', async () => {
    expect(await angleText(page).textContent()).toBe('5.0°');
  });
  await tapUndo(page, hand);
  await check('the angle reads 0.0°: the empty Done added no undo step', async () => {
    expect(await angleText(page).textContent()).toBe('0.0°');
  });
});

// Checks the result that ends ROT-07.1: the box has closed without saving; the angle still
// reads 0.0° and Undo is still greyed out.
async function checkClosedUnsaved(page, check, description) {
  await check(description, async () => {
    await expect(angleField(page)).toBeHidden();
    await expect(angleText(page)).toHaveText('0.0°');
    await expect(page.locator('#btnUndo')).toBeDisabled();
  });
}

// Checks a ROT-07 row written to ruling R92: the box has closed and the typed angle is saved,
// so the angle reads `angle` ('9.0°') and, when isUndoChecked, Undo is lit. Plain readings, so
// the known defect fails at once.
async function checkClosedSaved(page, check, description, angle, isUndoChecked = true) {
  const isOpen = await angleField(page).isVisible();
  const shown = await angleText(page).textContent();
  const isUndoLit = await page.locator('#btnUndo').isEnabled();
  await check(description, () => {
    expect(isOpen).toBe(false);
    expect(shown).toBe(angle);
    if (isUndoChecked) expect(isUndoLit).toBe(true);
  });
}

test('ROT-07.1 Escape closes the box without saving [desktop]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnRotate(page, testInfo);
  await tapAngleStep(page, hand, check, '0.0');
  await typeStep(page, check, '9');
  await page.keyboard.press('Escape');
  await checkClosedUnsaved(page, check,
    'the box closes; the angle reads 0.0°; Undo is still greyed out');
});

test('ROT-07.2 A tap on the photo closes the box and saves the angle [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  test.fail(true, 'BUG-296');
  const hand = await startOnRotate(page, testInfo);
  await tapAngleStep(page, hand, check, '0.0');
  await typeStep(page, check, '9');
  await hand.tap(page.locator('#view'));
  await checkClosedSaved(page, check, 'the box closes; the angle reads 9.0°; Undo is lit',
    '9.0°');
});

test('ROT-07.3 Choosing Flip or Straighten closes the box and saves the angle [phone]', async ({
  page,
  check,
}, testInfo) => {
  test.fail(true, 'BUG-296');
  const hand = await startOnRotate(page, testInfo);
  await tapAngleStep(page, hand, check, '0.0');
  await typeStep(page, check, '9');
  await hand.tap(page.locator('#toolFlip'));
  await check('the line above the controls reads FLIP and "as you see it on screen"', async () => {
    const line = page.locator('#rotateFlipLine');
    await expect(line).toBeVisible();
    await expect(line.locator('.line-label')).toHaveText('Flip');
    await expect(line.locator('.line-readout')).toHaveText('as you see it on screen');
  });
  await hand.tap(page.locator('#toolStraighten'));
  await page.locator('#rotateStraightenLine').waitFor({ state: 'visible' });
  await checkClosedSaved(page, check, 'the line reads STRAIGHTEN and 9.0°: the angle typed before '
    + 'Flip was saved; Undo is lit', '9.0°');
  await tapAngleStep(page, hand, check, '9.0', 'the text box opens, with 9.0 in it, selected');
  await typeStep(page, check, '3');
  await hand.tap(page.locator('#toolStraighten'));
  await checkClosedSaved(page, check, 'the box closes; the angle reads 3.0°', '3.0°', false);
});

test('ROT-07.4 Leaving the step closes the box and saves the angle [phone]', async ({
  page,
  check,
}, testInfo) => {
  test.fail(true, 'BUG-296');
  const hand = await startOnRotate(page, testInfo);
  await tapAngleStep(page, hand, check, '0.0');
  await typeStep(page, check, '9');
  await goToStep(page, 'crop', hand);
  await check('the Crop step shows', async () => {
    await expect(page.locator('#cropArea')).toBeVisible();
  });
  await goToStep(page, 'rotate', hand);
  await checkClosedSaved(page, check, 'the box is closed; the angle reads 9.0°; Undo is lit',
    '9.0°');
});

test('ROT-08.1 The box accepts a hyphen or a true minus sign [desktop]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnRotate(page, testInfo);
  await tapAngleStep(page, hand, check, '0.0');
  await typeStep(page, check, '-2.5');
  await doneStep(page, hand, check, `${MINUS}2.5°`);
  await tapAngleStep(page, hand, check, `${MINUS}2.5`,
    'the text box opens, with −2.5 in it, selected');
  // A paste puts the whole text in at once, as insertText does.
  await page.keyboard.insertText(`${MINUS}4`);
  await check('the box shows −4', async () => {
    await expect(angleField(page)).toHaveValue(`${MINUS}4`);
  });
  await doneStep(page, hand, check, `${MINUS}4.0°`);
});

test('ROT-08.2 The box accepts a decimal comma and a degree sign [desktop]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnRotate(page, testInfo);
  await tapAngleStep(page, hand, check, '0.0');
  await typeStep(page, check, '1,5');
  await doneStep(page, hand, check, '1.5°');
  await tapAngleStep(page, hand, check, '1.5', 'the text box opens, with 1.5 in it, selected');
  await page.keyboard.insertText('6°');
  await check('the box shows 6°', async () => {
    await expect(angleField(page)).toHaveValue('6°');
  });
  await doneStep(page, hand, check, '6.0°');
});

test('ROT-08.3 An unreadable entry keeps the angle [desktop]', async ({
  page,
  check,
}, testInfo) => {
  test.fail(true, 'BUG-002');
  const hand = await startOnRotate(page, testInfo);
  await tapAngleStep(page, hand, check, '0.0');
  await typeStep(page, check, '5');
  await doneStep(page, hand, check, '5.0°');
  await tapAngleStep(page, hand, check, '5.0', 'the text box opens, with 5.0 in it, selected');
  await typeStep(page, check, 'abc');
  await hand.tap(page.locator('#btnAngleDone'));
  await check('the angle still reads 5.0°', async () => {
    expect(await angleText(page).textContent()).toBe('5.0°');
  });
  await tapUndo(page, hand);
  await check('the angle reads 0.0°: abc added no undo step', async () => {
    expect(await angleText(page).textContent()).toBe('0.0°');
  });
});

test('ROT-09.2 On a wide screen the line stays in place while typing [desktop] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnRotate(page, testInfo);
  const line = page.locator('#rotateStraightenLine');
  const ruler = page.locator(RULER);
  const lineBefore = await line.boundingBox();
  const rulerBefore = await ruler.boundingBox();
  await check('the line is at the top of the panel on the right, with the ruler under it',
    async () => {
      const viewport = page.viewportSize();
      expect(lineBefore.x).toBeGreaterThan(viewport.width / 2);
      expect(rulerBefore.y).toBeGreaterThan(lineBefore.y);
    });
  await hand.tap(page.locator('#rotateAngle'));
  await check('a text box takes the angle\'s place; the line and the ruler stay exactly where '
    + 'they were, with no gap opening between them', async () => {
    await expect(angleField(page)).toBeVisible();
    const lineAfter = await line.boundingBox();
    const rulerAfter = await ruler.boundingBox();
    expect(Math.abs(lineAfter.y - lineBefore.y)).toBeLessThan(POSITION_TOLERANCE_PX);
    expect(Math.abs(rulerAfter.y - rulerBefore.y)).toBeLessThan(POSITION_TOLERANCE_PX);
    await expect(page.locator('#rotateLiftGap')).toBeHidden();
  });
});

test('ROT-10.1 Reset sets the angle to 0° as one undo step [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnRotate(page, testInfo);
  const reset = page.locator('#btnRotateReset');
  await check('Reset is greyed out', async () => {
    await expect(reset).toBeDisabled();
  });
  await hand.tap(page.locator('#toolRotateRight'));
  await check('the photo lies on its side, wider than tall', async () => {
    expect(await isOnItsSide(page)).toBe(true);
  });
  await tapAngleStep(page, hand, check, '0.0');
  await typeStep(page, check, '4');
  await hand.tap(page.locator('#btnAngleDone'));
  await check('the angle reads 4.0°; Reset is no longer greyed out', async () => {
    await expect(angleText(page)).toHaveText('4.0°');
    await expect(reset).toBeEnabled();
  });
  await hand.tap(reset);
  await check('the angle reads 0.0° and Reset is greyed out again; the photo still lies on its '
    + 'side', async () => {
    await expect(angleText(page)).toHaveText('0.0°');
    await expect(reset).toBeDisabled();
    expect(await isOnItsSide(page)).toBe(true);
  });
  await tapUndo(page, hand);
  await check('the angle reads 4.0°', async () => {
    await expect(angleText(page)).toHaveText('4.0°');
  });
});

test('ROT-11.1 Straighten is the resting mode [phone]', async ({ page, check }, testInfo) => {
  const hand = await startOnRotate(page, testInfo);
  const straighten = page.locator('#toolStraighten');
  const flip = page.locator('#toolFlip');
  await check('Straighten is selected and Flip is not; above them are the STRAIGHTEN line and '
    + 'the ruler', async () => {
    expect(await hasWhiteFill(straighten)).toBe(true);
    expect(await hasWhiteFill(flip)).toBe(false);
    await expect(page.locator('#rotateStraightenLine')).toBeVisible();
    await expect(page.locator(RULER)).toBeVisible();
  });
  await hand.tap(flip);
  await check('Flip is selected instead of Straighten; the ruler has gone', async () => {
    await expect(page.locator(RULER)).toBeHidden();
    expect(await hasWhiteFill(flip)).toBe(true);
    expect(await hasWhiteFill(straighten)).toBe(false);
  });
  await hand.tap(straighten);
  await check('Straighten is selected again; the STRAIGHTEN line and the ruler are back',
    async () => {
      await expect(page.locator('#rotateStraightenLine')).toBeVisible();
      await expect(page.locator(RULER)).toBeVisible();
      expect(await hasWhiteFill(straighten)).toBe(true);
    });
});

test('ROT-12.1 Flip shows its line and the Horizontal and Vertical buttons [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnRotate(page, testInfo);
  await hand.tap(page.locator('#toolFlip'));
  await check('the line reads FLIP and "as you see it on screen", in place of STRAIGHTEN and '
    + 'the angle', async () => {
    const line = page.locator('#rotateFlipLine');
    await expect(line).toBeVisible();
    await expect(line.locator('.line-label')).toHaveText('Flip');
    await expect(line.locator('.line-readout')).toHaveText('as you see it on screen');
    await expect(page.locator('#rotateStraightenLine')).toBeHidden();
  });
  await check('two buttons, Horizontal and Vertical, neither of them white; no ruler', async () => {
    const horizontal = page.locator('#btnFlipHorizontal');
    const vertical = page.locator('#btnFlipVertical');
    await expect(horizontal).toHaveText('Horizontal');
    await expect(vertical).toHaveText('Vertical');
    expect(await hasWhiteFill(horizontal)).toBe(false);
    expect(await hasWhiteFill(vertical)).toBe(false);
    await expect(page.locator(RULER)).toBeHidden();
  });
});

// The body of ROT-13.1 and ROT-14.1: a flip mirrors the photo as seen, lights its button and
// is one undo step. button: 'Horizontal' or 'Vertical'.
async function checkOneFlip(page, check, testInfo, button) {
  const hand = await startOnRotate(page, testInfo);
  const points = await samplePoints(page);
  const before = await pictureOf(page, points);
  await flipModeStep(page, hand, check);
  const flipButton = page.locator(`#btnFlip${button}`);
  const isHorizontal = button === 'Horizontal';
  await hand.tap(flipButton);
  const mirrorWording = isHorizontal
    ? 'the photo is mirrored left to right; Horizontal is solid white'
    : 'the photo is mirrored top to bottom; Vertical is solid white';
  await check(mirrorWording, async () => {
    const after = await pictureOf(page, points);
    const mirrored = before.points.map(([x, y]) => (isHorizontal
      ? [before.width - x, y]
      : [x, before.height - y]));
    expectSamePoints(after.points, mirrored);
    expect(await hasWhiteFill(flipButton)).toBe(true);
  });
  await tapUndo(page, hand);
  await check(`the photo is as it was; ${button} is no longer white; Undo is greyed out`,
    async () => {
      expectSamePoints((await pictureOf(page, points)).points, before.points);
      await expect(page.locator('#btnUndo')).toBeDisabled();
      expect(await hasWhiteFill(flipButton)).toBe(false);
    });
}

test('ROT-13.1 Horizontal mirrors the photo left to right [phone]', async ({
  page,
  check,
}, testInfo) => {
  await checkOneFlip(page, check, testInfo, 'Horizontal');
});

test('ROT-14.1 Vertical mirrors the photo top to bottom [phone]', async ({
  page,
  check,
}, testInfo) => {
  await checkOneFlip(page, check, testInfo, 'Vertical');
});

// The body of ROT-15.1 and ROT-15.2: on a photo tilted 3° and turned a quarter, a flip mirrors
// the picture exactly as it was on screen, and the angle changes sign.
async function checkFlipAsSeen(page, check, testInfo, button) {
  const hand = await startOnRotate(page, testInfo);
  await tapAngleStep(page, hand, check, '0.0');
  await typeStep(page, check, '3');
  await doneStep(page, hand, check, '3.0°');
  await hand.tap(page.locator('#toolRotateRight'));
  await check('the photo lies on its side, its top edge at the right', async () => {
    const top = await topMiddleInPicture(page);
    expect(top.picture.width).toBeGreaterThan(top.picture.height);
    expect(top.across).toBeGreaterThan(1 - EDGE_FRACTION);
  });
  const points = await samplePoints(page);
  const before = await pictureOf(page, points);
  await check('you have the picture as it looks now', async () => {
    expect(before.points).toHaveLength(points.length);
  });
  await flipModeStep(page, hand, check);
  const isHorizontal = button === 'Horizontal';
  await hand.tap(page.locator(`#btnFlip${button}`));
  const mirrorWording = isHorizontal
    ? 'the picture is the screenshot\'s mirror image left to right'
    : 'the picture is the screenshot\'s mirror image top to bottom';
  await check(mirrorWording, async () => {
    const after = await pictureOf(page, points);
    const mirrored = before.points.map(([x, y]) => (isHorizontal
      ? [before.width - x, y]
      : [x, before.height - y]));
    expectSamePoints(after.points, mirrored);
  });
  await hand.tap(page.locator('#toolStraighten'));
  await check('the angle reads −3.0°', async () => {
    await expect(angleText(page)).toHaveText(`${MINUS}3.0°`);
  });
}

test('ROT-15.1 Horizontal mirrors a tilted, turned photo as seen [phone]', async ({
  page,
  check,
}, testInfo) => {
  await checkFlipAsSeen(page, check, testInfo, 'Horizontal');
});

test('ROT-15.2 Vertical mirrors a tilted, turned photo as seen [phone]', async ({
  page,
  check,
}, testInfo) => {
  await checkFlipAsSeen(page, check, testInfo, 'Vertical');
});

// The first rows of ROT-15.3 and ROT-18.1: on the Crop step, chooses 3:4 and drags the box from
// its middle by (dx, dy) CSS px, checking each row. Returns the crop box as drawn.
async function drawCropByHandSteps(page, hand, check, dx, dy) {
  await goToStep(page, 'crop', hand);
  await check('the Crop step shows a crop box around the card', async () => {
    const box = await cropBox(page);
    const { corners } = await cardInPicture(page);
    for (const [x, y] of corners) {
      expect(x).toBeGreaterThanOrEqual(box.x);
      expect(x).toBeLessThanOrEqual(box.x + box.width);
      expect(y).toBeGreaterThanOrEqual(box.y);
      expect(y).toBeLessThanOrEqual(box.y + box.height);
    }
  });
  await hand.tap(page.locator('.preset-chip', { hasText: '3:4' }));
  await check('the box becomes an upright rectangle, narrower than tall, centered on the card',
    async () => {
      const box = await cropBox(page);
      const { middle } = await cardInPicture(page);
      expect(box.height).toBeGreaterThan(box.width);
      expectSamePoints([middleOfBox(box)], [middle]);
    });
  const { middleOnPage } = await cropBox(page);
  await hand.drag(middleOnPage, { x: middleOnPage.x + dx, y: middleOnPage.y + dy });
  return cropBox(page);
}

test('ROT-15.3 A flip mirrors a crop box drawn by hand [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnRotate(page, testInfo);
  const drawn = await drawCropByHandSteps(page, hand, check, CROP_DRAG_PX, 0);
  const { middle: cardMiddle } = await cardInPicture(page);
  await check('the box has moved to the right of the card\'s middle', async () => {
    expect(middleOfBox(drawn)[0]).toBeGreaterThan(cardMiddle[0] + drawn.width / 10);
  });
  await goToStep(page, 'rotate', hand);
  await check('a dashed box shows the crop, to the right of the card\'s middle', async () => {
    expect(await page.evaluate(() => window.__straightener.app.tab)).toBe('rotate');
    expect(middleOfBox(await cropBox(page))[0]).toBeGreaterThan(cardMiddle[0]);
  });
  const { width } = await pictureOf(page, []);
  const photoUnder = await photoPointUnderCrop(page);
  await flipModeStep(page, hand, check);
  await hand.tap(page.locator('#btnFlipHorizontal'));
  await check('the photo is mirrored, and the dashed box with it: it is now as far left of the '
    + 'card\'s middle as it was right, over the same part of the card', async () => {
    const after = await cropBox(page);
    const mirroredX = width - drawn.x - drawn.width;
    expect(Math.abs(after.x - mirroredX)).toBeLessThan(POSITION_TOLERANCE_PX);
    expect(Math.abs(after.width - drawn.width)).toBeLessThan(POSITION_TOLERANCE_PX);
    expectSamePoints([await photoPointUnderCrop(page)], [photoUnder]);
  });
});

test('ROT-15.4 The saved picture is mirrored too [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnRotate(page, testInfo);
  await exportStep(page, hand, check, 'the Export step shows Download');
  const firstDownload = await downloadStep(page, hand, check,
    'the question box asks "Upscale to 2000 px?"');
  const first = await answerNo(page, hand, firstDownload);
  await check('a file named IMG_9136-straight.jpg is saved', async () => {
    expect(first.name).toBe(SAVED_NAME);
  });
  await goToStep(page, 'rotate', hand);
  await check('the Rotate step shows', async () => {
    await expect(page.locator('#rotateArea')).toBeVisible();
  });
  await flipModeStep(page, hand, check);
  await hand.tap(page.locator('#btnFlipHorizontal'));
  await check('the photo is mirrored left to right', async () => {
    expect((await editState(page)).flip.h).toBe(true);
  });
  await exportStep(page, hand, check, 'the Export step shows');
  const secondDownload = await downloadStep(page, hand, check,
    'the question box asks again "Upscale to 2000 px?"');
  const second = await answerNo(page, hand, secondDownload);
  await check('a second file is saved', async () => {
    expect(fs.existsSync(second.file)).toBe(true);
  });
  const firstImage = await readSavedImage(page, first.file, COMPARE_GRID);
  const secondImage = await readSavedImage(page, second.file, COMPARE_GRID);
  await check('the second is the first one mirrored left to right, the same size', async () => {
    expect([secondImage.width, secondImage.height]).toEqual([firstImage.width, firstImage.height]);
    const lastColumn = COMPARE_GRID - 1;
    const mirrorDifference = gridDifference(firstImage, secondImage,
      (row, column) => [row, lastColumn - column]);
    const plainDifference = gridDifference(firstImage, secondImage,
      (row, column) => [row, column]);
    expect(mirrorDifference).toBeLessThan(MIRROR_TOLERANCE);
    expect(plainDifference).toBeGreaterThan(mirrorDifference * 3);
  });
});

// The body of ROT-16.1 and ROT-17.1: a quarter turn and its undo. button: the tool's id;
// topSide: where the photo's top edge goes, 'left' or 'right'.
async function checkQuarterTurn(page, check, testInfo, button, topSide) {
  const hand = await startOnRotate(page, testInfo);
  await hand.tap(page.locator(button));
  await check(`the photo lies on its side, wider than tall, its top edge (the grading label) at `
    + `the ${topSide}`, async () => {
    const top = await topMiddleInPicture(page);
    expect(top.picture.width).toBeGreaterThan(top.picture.height);
    const across = topSide === 'left' ? top.across : 1 - top.across;
    expect(across).toBeLessThan(EDGE_FRACTION);
    expect(Math.abs(top.down - 0.5)).toBeLessThan(EDGE_FRACTION);
  });
  await tapUndo(page, hand);
  await check('the photo stands upright again, the label at the top; Undo is greyed out',
    async () => {
      const top = await topMiddleInPicture(page);
      expect(top.picture.height).toBeGreaterThan(top.picture.width);
      expect(top.down).toBeLessThan(EDGE_FRACTION);
      await expect(page.locator('#btnUndo')).toBeDisabled();
    });
}

test('ROT-16.1 90° left turns the photo a quarter turn counterclockwise [phone]', async ({
  page,
  check,
}, testInfo) => {
  await checkQuarterTurn(page, check, testInfo, '#toolRotateLeft', 'left');
});

test('ROT-17.1 90° right turns the photo a quarter turn clockwise [phone]', async ({
  page,
  check,
}, testInfo) => {
  await checkQuarterTurn(page, check, testInfo, '#toolRotateRight', 'right');
});

test('ROT-18.1 A quarter turn carries a crop box drawn by hand [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnRotate(page, testInfo);
  const drawn = await drawCropByHandSteps(page, hand, check, 0, CROP_DRAG_PX);
  const { middle: cardMiddle } = await cardInPicture(page);
  await check('the box has moved down the card', async () => {
    expect(middleOfBox(drawn)[1]).toBeGreaterThan(cardMiddle[1] + drawn.height / 20);
  });
  await goToStep(page, 'rotate', hand);
  await check('a dashed box shows the crop, over the lower part of the card', async () => {
    expect(await page.evaluate(() => window.__straightener.app.tab)).toBe('rotate');
    expect(middleOfBox(await cropBox(page))[1]).toBeGreaterThan(cardMiddle[1]);
  });
  const photoUnder = await photoPointUnderCrop(page);
  await hand.tap(page.locator('#toolRotateRight'));
  await check('the photo lies on its side, and the dashed box has turned with it: wider than '
    + 'tall now, over the same part of the card as before', async () => {
    expect(await isOnItsSide(page)).toBe(true);
    const turned = await cropBox(page);
    expect(Math.abs(turned.width - drawn.height)).toBeLessThan(POSITION_TOLERANCE_PX);
    expect(Math.abs(turned.height - drawn.width)).toBeLessThan(POSITION_TOLERANCE_PX);
    expectSamePoints([await photoPointUnderCrop(page)], [photoUnder]);
  });
});

test('ROT-19.1 Fill frame Off leaves white corners in the saved image; On leaves none '
  + '[phone] [webkit]', async ({ page, check }, testInfo) => {
  const hand = await startOnRotate(page, testInfo);
  const fillFrame = page.locator('#toolFillFrame');
  await typeAngle(page, hand, '10');
  await check('the angle reads 10.0°; inside the dashed box, white wedges show at two corners '
    + 'where the tilted photo ends', async () => {
    await expect(angleText(page)).toHaveText('10.0°');
    expect(await cropCornersOnPhoto(page)).toEqual([false, true, false, true]);
  });
  await exportStep(page, hand, check, 'the Export step shows Download');
  const first = await saveCopy(page, hand);
  await check('a file named IMG_9136-straight.jpg is saved (the question box asked "Upscale to '
    + '2000 px?" and No was tapped)', async () => {
    expect(first.question).toBe(UPSCALE_QUESTION);
    expect(first.name).toBe(SAVED_NAME);
  });
  const firstImage = await readSavedImage(page, first.file);
  await check('two of its corners, the top left and the bottom right, are plain white',
    async () => {
      expect(firstImage.corners.map(isWhiteFill)).toEqual([true, false, true, false]);
    });
  await goToStep(page, 'rotate', hand);
  await check('the Rotate step shows, with Fill frame reading Off', async () => {
    await expect(fillFrame).toBeVisible();
    await expect(fillFrame).toContainText('Off');
  });
  const cropBefore = await cropBox(page);
  await hand.tap(fillFrame);
  await check('it reads On; the dashed box is smaller, with photo in all four of its corners',
    async () => {
      await expect(fillFrame).toContainText('On');
      expect((await cropBox(page)).width).toBeLessThan(cropBefore.width);
      expect(await cropCornersOnPhoto(page)).toEqual([true, true, true, true]);
    });
  await exportStep(page, hand, check, 'the Export step shows Download');
  const second = await saveCopy(page, hand);
  await check('a second file is saved (the question box asked "Upscale to 2000 px?" and No was '
    + 'tapped)', async () => {
    expect(second.question).toBe(UPSCALE_QUESTION);
    expect(fs.existsSync(second.file)).toBe(true);
  });
  const secondImage = await readSavedImage(page, second.file);
  await check('each corner shows the photo; none is plain white', async () => {
    expect(secondImage.corners.filter(isWhiteFill)).toEqual([]);
  });
});

test('ROT-19.2 Fill frame is a switch, and each change is one undo step [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnRotate(page, testInfo);
  const fillFrame = page.locator('#toolFillFrame');
  await check('it reads Off', async () => {
    await expect(fillFrame).toContainText('Off');
  });
  const cropBefore = await cropBox(page);
  await hand.tap(fillFrame);
  await check('it reads On; the dashed box gets smaller', async () => {
    await expect(fillFrame).toContainText('On');
    expect((await cropBox(page)).width).toBeLessThan(cropBefore.width);
  });
  await tapUndo(page, hand);
  await check('Fill frame reads Off; the dashed box is its old size; Undo is greyed out',
    async () => {
      await expect(fillFrame).toContainText('Off');
      const widthNow = (await cropBox(page)).width;
      expect(Math.abs(widthNow - cropBefore.width)).toBeLessThan(POSITION_TOLERANCE_PX);
      await expect(page.locator('#btnUndo')).toBeDisabled();
    });
  await hand.tap(page.locator('#btnRedo'));
  await check('Fill frame reads On', async () => {
    await expect(fillFrame).toContainText('On');
  });
  await hand.tap(fillFrame);
  await check('it reads Off', async () => {
    await expect(fillFrame).toContainText('Off');
  });
  await tapUndo(page, hand);
  await check('Fill frame reads On: only the last tap was undone', async () => {
    await expect(fillFrame).toContainText('On');
  });
});

test('ROT-20.1 The grid, for a person to judge [phone]', async ({ page, check }, testInfo) => {
  const hand = await startOnRotate(page, testInfo);
  await waitForStill(page);
  await check.eye('faint lines in squares of about 48 px cover the whole photo area; the middle '
    + 'of the grid sits on the middle of the picture');
  await goToStep(page, 'crop', hand);
  await waitForStill(page);
  await check.eye('no grid lines on the Crop step');
  await goToStep(page, 'rotate', hand);
  await waitForStill(page);
  await check.eye('the grid is back');
  await openOptions(page, hand, 'rotate');
  const grid = page.locator('#rotateGrid');
  await check('Rotate options rise from the bottom; Grid is switched on', async () => {
    await expect(page.locator('#rotateSheet .sheet-body')).toBeVisible();
    await expect(grid).toBeChecked();
  });
  await hand.tap(grid);
  await check('it switches off', async () => {
    await expect(grid).not.toBeChecked();
  });
  await closeOptions(page, hand, 'rotate');
  await waitForStill(page);
  await check.eye('the options go down; no grid lines on the photo, and the dashed box is still '
    + 'there');
});

test('ROT-20.2 The grid is never exported [phone] [webkit]', async ({ page, check }, testInfo) => {
  const hand = await startOnRotate(page, testInfo);
  const grid = page.locator('#rotateGrid');
  // Whether the grid is drawn over the photo on screen.
  const isGridDrawn = () => page.evaluate(() => window.__straightener.app.showGrid);
  await exportStep(page, hand, check, 'the Export step shows Download');
  const withGrid = await saveCopy(page, hand);
  await check('a file named IMG_9136-straight.jpg is saved (the question box asked "Upscale to '
    + '2000 px?" and No was tapped)', async () => {
    expect(withGrid.question).toBe(UPSCALE_QUESTION);
    expect(withGrid.name).toBe(SAVED_NAME);
  });
  await goToStep(page, 'rotate', hand);
  await check('the photo shows with the grid over it', async () => {
    expect(await isGridDrawn()).toBe(true);
  });
  await openOptions(page, hand, 'rotate');
  await check('the Grid switch is on', async () => {
    await expect(grid).toBeChecked();
  });
  await hand.tap(grid);
  await check('it switches off', async () => {
    await expect(grid).not.toBeChecked();
  });
  await closeOptions(page, hand, 'rotate');
  await check('no grid lines on the photo', async () => {
    expect(await isGridDrawn()).toBe(false);
  });
  await exportStep(page, hand, check, 'the Export step shows Download');
  const withoutGrid = await saveCopy(page, hand);
  await check('a second file is saved (the question box asked "Upscale to 2000 px?" and No was '
    + 'tapped)', async () => {
    expect(withoutGrid.question).toBe(UPSCALE_QUESTION);
    expect(fs.existsSync(withoutGrid.file)).toBe(true);
  });
  await check('they are the same picture, with no grid lines in either: the two files are '
    + 'identical, byte for byte', async () => {
    const firstBytes = fs.readFileSync(withGrid.file);
    const secondBytes = fs.readFileSync(withoutGrid.file);
    expect(firstBytes.equals(secondBytes)).toBe(true);
  });
});

test('ROT-21.1 The crop on Rotate, for a person to judge [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnRotate(page, testInfo);
  await waitForStill(page);
  await check.eye('a dashed white square around the card in its holder');
  await tapAngleStep(page, hand, check, '0.0');
  await typeStep(page, check, '10');
  await doneStep(page, hand, check, '10.0°');
  await waitForStill(page);
  await check.eye('the angle reads 10.0°; the photo is tilted, and the dashed square stays '
    + 'square to the screen, around the card');
});

test('ROT-22.1 Reset rotation clears turns, angle, flips and Fill frame in one step [phone]',
  async ({ page, check }, testInfo) => {
    const hand = await startOnRotate(page, testInfo);
    const tiltAtStart = await tiltDeg(page);
    const fillFrame = page.locator('#toolFillFrame');
    const horizontal = page.locator('#btnFlipHorizontal');
    await dragRuler(page, hand, -6 * RULER_PX_PER_DEGREE);
    await check('the angle reads 6.0°', async () => {
      await expect(angleText(page)).toHaveText('6.0°');
    });
    await hand.tap(page.locator('#toolRotateRight'));
    await check('the photo lies on its side', async () => {
      expect(await isOnItsSide(page)).toBe(true);
    });
    await hand.tap(fillFrame);
    await check('it reads On', async () => {
      await expect(fillFrame).toContainText('On');
    });
    await flipModeStep(page, hand, check);
    await hand.tap(horizontal);
    await check('the photo is mirrored; Horizontal is solid white', async () => {
      expect((await editState(page)).flip.h).toBe(true);
      expect(await hasWhiteFill(horizontal)).toBe(true);
    });
    const changed = await editState(page);
    await openOptions(page, hand, 'rotate');
    await check('Grid and Reset rotation show', async () => {
      await expect(page.locator('#rotateGrid')).toBeVisible();
      await expect(page.locator('#rotateResetRow')).toBeVisible();
    });
    await hand.tap(page.locator('#rotateResetRow'));
    await check('the photo stands upright, level and not mirrored', async () => {
      const state = await editState(page);
      expect(state.rotation.quarter).toBe(0);
      expect(state.flip).toEqual({ h: false, v: false });
      expect(Math.abs(await tiltDeg(page) - tiltAtStart)).toBeLessThan(ANGLE_TOLERANCE_DEG);
    });
    await closeOptions(page, hand, 'rotate');
    await check('Fill frame reads Off; Horizontal is not white', async () => {
      await expect(fillFrame).toContainText('Off');
      expect(await hasWhiteFill(horizontal)).toBe(false);
    });
    await hand.tap(page.locator('#toolStraighten'));
    await check('the angle reads 0.0°', async () => {
      await expect(angleText(page)).toHaveText('0.0°');
    });
    await tapUndo(page, hand);
    await check('everything comes back at once: the photo on its side and mirrored, Fill frame '
      + 'On, and the angle reading −6.0°', async () => {
      const state = await editState(page);
      expect(state.rotation).toEqual(changed.rotation);
      expect(state.flip).toEqual(changed.flip);
      expect(await isOnItsSide(page)).toBe(true);
      await expect(fillFrame).toContainText('On');
      await expect(angleText(page)).toHaveText(`${MINUS}6.0°`);
    });
  });

test('ROT-22.2 Reset rotation leaves Grid as it is [phone]', async ({ page, check }, testInfo) => {
  const hand = await startOnRotate(page, testInfo);
  const grid = page.locator('#rotateGrid');
  await openOptions(page, hand, 'rotate');
  await check('the Grid switch is on', async () => {
    await expect(grid).toBeChecked();
  });
  await hand.tap(grid);
  await check('it switches off', async () => {
    await expect(grid).not.toBeChecked();
  });
  await hand.tap(page.locator('#rotateResetRow'));
  await check('the Grid switch is still off', async () => {
    await expect(grid).not.toBeChecked();
    expect(await page.evaluate(() => window.__straightener.app.showGrid)).toBe(false);
  });
});

// The first four rows of ROT-23.1 and ROT-23.2: chooses Flip and turns Grid off, checking each
// row. undoWording: what the first and last rows add about Undo ('' for none).
async function chooseFlipAndHideGridSteps(page, hand, check, undoWording) {
  const undo = page.locator('#btnUndo');
  await hand.tap(page.locator('#toolFlip'));
  await check(`Flip is selected (solid white)${undoWording ? '; Undo stays greyed out' : ''}`,
    async () => {
      expect(await hasWhiteFill(page.locator('#toolFlip'))).toBe(true);
      if (undoWording) await expect(undo).toBeDisabled();
    });
  await openOptions(page, hand, 'rotate');
  const grid = page.locator('#rotateGrid');
  await check('the Grid switch is on', async () => {
    await expect(grid).toBeChecked();
  });
  await hand.tap(grid);
  await check('it switches off', async () => {
    await expect(grid).not.toBeChecked();
  });
  await closeOptions(page, hand, 'rotate');
  await check(`no grid lines on the photo${undoWording ? '; Undo is still greyed out' : ''}`,
    async () => {
      expect(await page.evaluate(() => window.__straightener.app.showGrid)).toBe(false);
      if (undoWording) await expect(undo).toBeDisabled();
    });
}

test('ROT-23.1 Flip and Grid stay as set for the next photo [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnRotate(page, testInfo);
  await chooseFlipAndHideGridSteps(page, hand, check, 'with Undo');
  await openPhoto(page, SECOND_PHOTO);
  await check('the new photo opens', async () => {
    expect((await editState(page)).source.name).toBe(SECOND_PHOTO);
  });
  await goToStep(page, 'rotate', hand);
  await check('Flip is selected, with the FLIP line; no grid lines on the photo', async () => {
    expect(await hasWhiteFill(page.locator('#toolFlip'))).toBe(true);
    await expect(page.locator('#rotateFlipLine')).toBeVisible();
    expect(await page.evaluate(() => window.__straightener.app.showGrid)).toBe(false);
  });
  await openOptions(page, hand, 'rotate');
  await check('the Grid switch is off', async () => {
    await expect(page.locator('#rotateGrid')).not.toBeChecked();
  });
});

test('ROT-23.2 Flip and Grid are not kept after a reload [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnRotate(page, testInfo);
  await chooseFlipAndHideGridSteps(page, hand, check, '');
  // A person waits two seconds; the script waits until the photo is saved for Resume.
  await waitInPage(page, async name => {
    const record = await window.__straightener.Session.peek();
    return !!record && record.name === name;
  }, PHOTO);
  await page.reload();
  await page.waitForFunction(() => !!window.__straightener);
  await check('the start screen offers to resume IMG_9136.JPEG, with Resume and Start fresh',
    async () => {
      await expect(page.locator('#btnResume')).toBeVisible();
      await expect(page.locator('#resumeName')).toHaveText(PHOTO);
      await expect(page.locator('#btnFresh')).toBeVisible();
    });
  await hand.tap(page.locator('#btnResume'));
  await check('the photo opens', async () => {
    await page.waitForFunction(() => !!window.__straightener.app.geometry);
    expect((await editState(page)).source.name).toBe(PHOTO);
  });
  await goToStep(page, 'rotate', hand);
  await check('Straighten is selected, with the STRAIGHTEN line and the ruler; grid lines show '
    + 'over the photo', async () => {
    expect(await hasWhiteFill(page.locator('#toolStraighten'))).toBe(true);
    await expect(page.locator('#rotateStraightenLine')).toBeVisible();
    await expect(page.locator(RULER)).toBeVisible();
    expect(await page.evaluate(() => window.__straightener.app.showGrid)).toBe(true);
  });
  await openOptions(page, hand, 'rotate');
  await check('the Grid switch is on', async () => {
    await expect(page.locator('#rotateGrid')).toBeChecked();
  });
});
