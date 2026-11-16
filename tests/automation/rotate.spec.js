// The Rotate step's cases (tests/catalog/rotate.md): the angle, the Straighten ruler, the typed
// angle, Reset, Flip, the quarter turns, Fill frame, Grid and Reset rotation.
// Each test drives the app as a person would, through hand.tap and hand.drag (a finger on the
// phone targets, the mouse on the wide ones), and reads the app's state only to check a result.
'use strict';
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
  saveByDownload,
  readSavedImage,
  pictureOf,
  cropBox,
  waitForStill,
  hasWhiteFill,
} = require('./support/app.js');

const PHOTO = 'IMG_9136.JPEG';
const SECOND_PHOTO = 'IMG_9075.JPEG';
// The ruler's scale: CSS px per degree (RULER_TICK_PX in js/app/parts/ruler.js, and the
// catalog's ROT-02).
const RULER_PX_PER_DEGREE = 11;
// A drag long enough to run the ruler past its end (±45°) from 0°.
const RULER_PAST_END_PX = 500;
const RULER = '#rotateRulerRow .ruler';
// The true minus sign the app writes before a negative angle.
const MINUS = '−';
// How close two measured angles must be, in degrees: the angle is kept to 0.1°.
const ANGLE_TOLERANCE_DEG = 0.05;
// How close two positions in the straightened picture must be, in its px.
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

// Opens the app with the case's photo and goes to Rotate. Returns the hand for this target.
async function startOnRotate(page, testInfo) {
  await openApp(page);
  await openPhoto(page, PHOTO);
  await goToStep(page, 'rotate');
  return handFor(page, testInfo);
}

// The angle as the line above the ruler shows it.
const angleText = page => page.locator('#rotateAngleText');

// Taps the angle and types `text` into the box that takes its place. The box opens with the
// angle selected, so what is typed replaces it.
async function typeIntoAngleBox(page, hand, text) {
  await hand.tap(page.locator('#rotateAngle'));
  await page.locator('#rotateAngleField').waitFor({ state: 'visible' });
  await page.keyboard.type(text);
}

// Types an angle and saves it with Done.
async function typeAngle(page, hand, text) {
  await typeIntoAngleBox(page, hand, text);
  await hand.tap(page.locator('#btnAngleDone'));
}

// Drags the Straighten ruler sideways by dx CSS px from its middle (dragging right lowers the
// angle).
async function dragRuler(page, hand, dx) {
  const start = await middleOf(page.locator(RULER));
  await hand.drag(start, { x: start.x + dx, y: start.y }, RULER);
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

// Chooses Flip and then one of its buttons ('Horizontal' or 'Vertical').
async function flipFromStraighten(page, hand, button) {
  await hand.tap(page.locator('#toolFlip'));
  await hand.tap(page.locator(`#btnFlip${button}`));
}

test('ROT-01.1 The angle reads with one decimal and a true minus sign [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnRotate(page, testInfo);
  await check('the line reads STRAIGHTEN and 0.0°', async () => {
    await expect(page.locator('#rotateStraightenLine')).toContainText('Straighten');
    await expect(angleText(page)).toHaveText('0.0°');
  });
  await typeAngle(page, hand, '-3.5');
  await check('the angle reads −3.5° with a true minus sign', async () => {
    await expect(angleText(page)).toHaveText(`${MINUS}3.5°`);
  });
  await typeAngle(page, hand, '-0.04');
  await check('the angle reads 0.0°, never −0.0°', async () => {
    await expect(angleText(page)).toHaveText('0.0°');
  });
});

test('ROT-02.1 Dragging the ruler turns the photo, one undo step per drag [phone] [webkit]',
  async ({ page, check }, testInfo) => {
    const hand = await startOnRotate(page, testInfo);
    const tiltBefore = await tiltDeg(page);
    await dragRuler(page, hand, -2 * RULER_PX_PER_DEGREE);
    await check('the angle reads 2.0° and the photo turns 2° clockwise', async () => {
      await expect(angleText(page)).toHaveText('2.0°');
      expect(Math.abs(await tiltDeg(page) - tiltBefore - 2)).toBeLessThan(ANGLE_TOLERANCE_DEG);
    });
    await dragRuler(page, hand, -RULER_PX_PER_DEGREE);
    await check('a second drag 11 px to the left makes it 3.0°', async () => {
      await expect(angleText(page)).toHaveText('3.0°');
    });
    await hand.tap(page.locator('#btnUndo'));
    await check('Undo takes back only the second drag: 2.0°', async () => {
      await expect(angleText(page)).toHaveText('2.0°');
    });
    await hand.tap(page.locator('#btnUndo'));
    await check('a second Undo takes back the first drag: 0.0°', async () => {
      await expect(angleText(page)).toHaveText('0.0°');
    });
    await dragRuler(page, hand, 3 * RULER_PX_PER_DEGREE);
    await check('dragging 33 px to the right makes it −3.0°', async () => {
      await expect(angleText(page)).toHaveText(`${MINUS}3.0°`);
    });
  });

test('ROT-02.2 The ruler\'s scale, for a person to judge [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnRotate(page, testInfo);
  await waitForStill(page);
  await check.eye('at 0.0°: short ticks one per degree, a tall tick every fifth, and the '
    + 'white pointer in the middle standing on a tall tick');
  await dragRuler(page, hand, -2 * RULER_PX_PER_DEGREE);
  await check('the angle reads 2.0°', async () => {
    await expect(angleText(page)).toHaveText('2.0°');
  });
  await waitForStill(page);
  await check.eye('at 2.0°: the scale has slid left; the pointer stands on the second short '
    + 'tick to the right of a tall tick');
});

test('ROT-03.1 The angle stays within ±45° and is rounded to 0.1° [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnRotate(page, testInfo);
  await typeAngle(page, hand, '50');
  await check('a typed 50 is saved as 45.0°', async () => {
    await expect(angleText(page)).toHaveText('45.0°');
    expect((await editState(page)).rotation.fine).toBe(45);
  });
  await typeAngle(page, hand, '2.36');
  await check('a typed 2.36 is saved as 2.4°', async () => {
    await expect(angleText(page)).toHaveText('2.4°');
    expect((await editState(page)).rotation.fine).toBe(2.4);
  });
  await dragRuler(page, hand, -RULER_PAST_END_PX);
  await check('the ruler dragged far to the left stops at 45.0°', async () => {
    await expect(angleText(page)).toHaveText('45.0°');
  });
  await dragRuler(page, hand, 2 * RULER_PAST_END_PX);
  await check('the ruler dragged far to the right stops at −45.0°', async () => {
    await expect(angleText(page)).toHaveText(`${MINUS}45.0°`);
  });
});

test('ROT-04.1 Tapping the angle opens a box to type it in [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnRotate(page, testInfo);
  await typeAngle(page, hand, '-3.5');
  await check('the angle reads −3.5°', async () => {
    await expect(angleText(page)).toHaveText(`${MINUS}3.5°`);
  });
  await hand.tap(page.locator('#rotateAngle'));
  const field = page.locator('#rotateAngleField');
  await check('a text box takes the angle\'s place, showing −3.5, all of it selected', async () => {
    await expect(field).toBeVisible();
    await expect(field).toBeFocused();
    await expect(field).toHaveValue(`${MINUS}3.5`);
    await expect(page.locator('#rotateAngle')).toBeHidden();
    const selection = await field.evaluate(box => [box.selectionStart, box.selectionEnd]);
    expect(selection).toEqual([0, `${MINUS}3.5`.length]);
  });
  await page.keyboard.type('1');
  await check('typing 1 replaces the whole angle: the box shows 1', async () => {
    await expect(field).toHaveValue('1');
  });
});

test('ROT-05.1 ± changes the sign of the typed angle and Done saves it [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnRotate(page, testInfo);
  const sign = page.locator('#btnAngleSign');
  const done = page.locator('#btnAngleDone');
  const reset = page.locator('#btnRotateReset');
  const field = page.locator('#rotateAngleField');
  await check('Reset is at the right of the line; ± and Done are not shown', async () => {
    await expect(reset).toBeVisible();
    await expect(sign).toBeHidden();
    await expect(done).toBeHidden();
  });
  await typeIntoAngleBox(page, hand, '3.5');
  await check('while typing, ± and Done take Reset\'s place', async () => {
    await expect(reset).toBeHidden();
    await expect(sign).toBeVisible();
    await expect(done).toBeVisible();
    await expect(field).toHaveValue('3.5');
  });
  await hand.tap(sign);
  await check('± makes it −3.5, with the cursor at the end', async () => {
    await expect(field).toHaveValue(`${MINUS}3.5`);
    await expect(field).toBeFocused();
  });
  await page.keyboard.type('2');
  await check('typing 2 adds to the end: −3.52', async () => {
    await expect(field).toHaveValue(`${MINUS}3.52`);
  });
  await hand.tap(sign);
  await check('± again makes it 3.52', async () => {
    await expect(field).toHaveValue('3.52');
  });
  await hand.tap(done);
  await check('Done saves 3.5°; Reset is back and ± and Done have gone', async () => {
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
  await typeAngle(page, hand, '7.5');
  await check('the angle reads 7.5° and the photo turns 7.5° clockwise', async () => {
    await expect(angleText(page)).toHaveText('7.5°');
    expect(Math.abs(await tiltDeg(page) - tiltBefore - 7.5)).toBeLessThan(ANGLE_TOLERANCE_DEG);
  });
  await hand.tap(page.locator('#btnUndo'));
  await check('one Undo takes it back to 0.0°', async () => {
    await expect(angleText(page)).toHaveText('0.0°');
    await expect(page.locator('#btnUndo')).toBeDisabled();
  });
  await hand.tap(page.locator('#btnRedo'));
  await check('Redo brings back 7.5°', async () => {
    await expect(angleText(page)).toHaveText('7.5°');
  });
});

test('ROT-06.2 Enter saves the typed angle [desktop]', async ({ page, check }, testInfo) => {
  const hand = await startOnRotate(page, testInfo);
  await typeIntoAngleBox(page, hand, '4');
  await page.keyboard.press('Enter');
  await check('Enter saves 4.0° and the box closes', async () => {
    await expect(angleText(page)).toHaveText('4.0°');
    await expect(page.locator('#rotateAngleField')).toBeHidden();
  });
  await hand.tap(page.locator('#btnUndo'));
  await check('one Undo takes it back to 0.0°', async () => {
    await expect(angleText(page)).toHaveText('0.0°');
  });
});

test('ROT-06.3 Done on an empty box keeps the angle [phone]', async ({
  page,
  check,
}, testInfo) => {
  test.fail(true, 'BUG-002');
  const hand = await startOnRotate(page, testInfo);
  await typeAngle(page, hand, '5');
  await check('the angle reads 5.0°', async () => {
    await expect(angleText(page)).toHaveText('5.0°');
  });
  await hand.tap(page.locator('#rotateAngle'));
  await page.keyboard.press('Backspace');
  await check('the box is empty', async () => {
    await expect(page.locator('#rotateAngleField')).toHaveValue('');
  });
  await hand.tap(page.locator('#btnAngleDone'));
  await check('Done leaves the angle at 5.0°', async () => {
    await expect(angleText(page)).toHaveText('5.0°');
  });
  await hand.tap(page.locator('#btnUndo'));
  await check('one Undo goes back to 0.0°: the empty Done added no undo step', async () => {
    await expect(angleText(page)).toHaveText('0.0°');
  });
});

test('ROT-07.1 Escape closes the box without saving [desktop]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnRotate(page, testInfo);
  await typeIntoAngleBox(page, hand, '9');
  await page.keyboard.press('Escape');
  await check('the box closes, the angle still reads 0.0° and Undo stays off', async () => {
    await expect(page.locator('#rotateAngleField')).toBeHidden();
    await expect(angleText(page)).toHaveText('0.0°');
    await expect(page.locator('#btnUndo')).toBeDisabled();
  });
});

test('ROT-07.2 A tap on the photo closes the box without saving [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnRotate(page, testInfo);
  await typeIntoAngleBox(page, hand, '9');
  await hand.tap(page.locator('#view'));
  await check('the box closes, the angle still reads 0.0° and Undo stays off', async () => {
    await expect(page.locator('#rotateAngleField')).toBeHidden();
    await expect(angleText(page)).toHaveText('0.0°');
    await expect(page.locator('#btnUndo')).toBeDisabled();
  });
});

test('ROT-07.3 Choosing Flip or Straighten closes the box without saving [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnRotate(page, testInfo);
  await typeIntoAngleBox(page, hand, '9');
  await hand.tap(page.locator('#toolFlip'));
  await check('Flip\'s line shows in place of the box', async () => {
    await expect(page.locator('#rotateFlipLine')).toBeVisible();
  });
  await hand.tap(page.locator('#toolStraighten'));
  await check('back on Straighten, the angle still reads 0.0°', async () => {
    await expect(angleText(page)).toHaveText('0.0°');
  });
  await typeIntoAngleBox(page, hand, '9');
  await hand.tap(page.locator('#toolStraighten'));
  await check('Straighten closes the box; the angle still reads 0.0°; Undo is off', async () => {
    await expect(page.locator('#rotateAngleField')).toBeHidden();
    await expect(angleText(page)).toHaveText('0.0°');
    await expect(page.locator('#btnUndo')).toBeDisabled();
  });
});

test('ROT-07.4 Leaving the step closes the box without saving [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnRotate(page, testInfo);
  await typeIntoAngleBox(page, hand, '9');
  await goToStep(page, 'crop');
  await goToStep(page, 'rotate');
  await check('back on Rotate, the box is closed and the angle reads 0.0°', async () => {
    await expect(page.locator('#rotateAngleField')).toBeHidden();
    await expect(angleText(page)).toHaveText('0.0°');
    await expect(page.locator('#btnUndo')).toBeDisabled();
  });
});

test('ROT-08.1 The box accepts a hyphen or a true minus sign [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnRotate(page, testInfo);
  await typeAngle(page, hand, '-2.5');
  await check('-2.5 with a hyphen is saved as −2.5°', async () => {
    await expect(angleText(page)).toHaveText(`${MINUS}2.5°`);
  });
  await typeAngle(page, hand, `${MINUS}4`);
  await check('−4 with a true minus sign is saved as −4.0°', async () => {
    await expect(angleText(page)).toHaveText(`${MINUS}4.0°`);
  });
});

test('ROT-08.2 The box accepts a decimal comma and a degree sign [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnRotate(page, testInfo);
  await typeAngle(page, hand, '1,5');
  await check('1,5 is saved as 1.5°', async () => {
    await expect(angleText(page)).toHaveText('1.5°');
  });
  await typeAngle(page, hand, '6°');
  await check('6° is saved as 6.0°', async () => {
    await expect(angleText(page)).toHaveText('6.0°');
  });
});

test('ROT-08.3 An unreadable entry keeps the angle [phone]', async ({
  page,
  check,
}, testInfo) => {
  test.fail(true, 'BUG-002');
  const hand = await startOnRotate(page, testInfo);
  await typeAngle(page, hand, '5');
  await check('the angle reads 5.0°', async () => {
    await expect(angleText(page)).toHaveText('5.0°');
  });
  await typeAngle(page, hand, 'abc');
  await check('Done on abc leaves the angle at 5.0°', async () => {
    await expect(angleText(page)).toHaveText('5.0°');
  });
  await hand.tap(page.locator('#btnUndo'));
  await check('one Undo goes back to 0.0°: abc added no undo step', async () => {
    await expect(angleText(page)).toHaveText('0.0°');
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
  await hand.tap(page.locator('#rotateAngle'));
  await check('the box opens where the angle was; the line and the ruler do not move', async () => {
    await expect(page.locator('#rotateAngleField')).toBeVisible();
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
  await check('at 0.0°, Reset is off', async () => {
    await expect(reset).toBeDisabled();
  });
  await hand.tap(page.locator('#toolRotateRight'));
  await typeAngle(page, hand, '4');
  await check('the angle reads 4.0° and Reset is on', async () => {
    await expect(angleText(page)).toHaveText('4.0°');
    await expect(reset).toBeEnabled();
  });
  await hand.tap(reset);
  await check('Reset sets 0.0° and is off again; the photo stays on its side', async () => {
    await expect(angleText(page)).toHaveText('0.0°');
    await expect(reset).toBeDisabled();
    const { picture } = await topMiddleInPicture(page);
    expect(picture.width).toBeGreaterThan(picture.height);
  });
  await hand.tap(page.locator('#btnUndo'));
  await check('one Undo brings back 4.0°', async () => {
    await expect(angleText(page)).toHaveText('4.0°');
  });
});

test('ROT-11.1 Straighten is the resting mode [phone]', async ({ page, check }, testInfo) => {
  const hand = await startOnRotate(page, testInfo);
  const straighten = page.locator('#toolStraighten');
  const flip = page.locator('#toolFlip');
  await check('Straighten is selected, with the angle\'s line and the ruler', async () => {
    expect(await hasWhiteFill(straighten)).toBe(true);
    expect(await hasWhiteFill(flip)).toBe(false);
    await expect(page.locator('#rotateStraightenLine')).toBeVisible();
    await expect(page.locator(RULER)).toBeVisible();
  });
  await hand.tap(flip);
  await check('Flip is selected instead and the ruler has gone', async () => {
    await expect(page.locator(RULER)).toBeHidden();
    expect(await hasWhiteFill(flip)).toBe(true);
    expect(await hasWhiteFill(straighten)).toBe(false);
  });
  await hand.tap(straighten);
  await check('Straighten is selected again, with the angle\'s line and the ruler', async () => {
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
  await check('the line reads FLIP and "as you see it on screen"', async () => {
    const line = page.locator('#rotateFlipLine');
    await expect(line).toBeVisible();
    await expect(line).toContainText('Flip');
    await expect(line).toContainText('as you see it on screen');
    await expect(page.locator('#rotateStraightenLine')).toBeHidden();
  });
  await check('Horizontal and Vertical are under it, neither lit; no ruler', async () => {
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
  await flipFromStraighten(page, hand, button);
  const flipButton = page.locator(`#btnFlip${button}`);
  const isHorizontal = button === 'Horizontal';
  const label = isHorizontal ? 'left to right' : 'top to bottom';
  await check(`the photo is mirrored ${label} and ${button} is lit white`, async () => {
    const after = await pictureOf(page, points);
    const mirrored = before.points.map(([x, y]) => (isHorizontal
      ? [before.width - x, y]
      : [x, before.height - y]));
    expectSamePoints(after.points, mirrored);
    expect(await hasWhiteFill(flipButton)).toBe(true);
  });
  await hand.tap(page.locator('#btnUndo'));
  await check(`one Undo puts the photo back and ${button} is no longer lit`, async () => {
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
  await typeAngle(page, hand, '3');
  await hand.tap(page.locator('#toolRotateRight'));
  await check('the angle reads 3.0° and the photo lies on its side', async () => {
    await expect(angleText(page)).toHaveText('3.0°');
    const { picture } = await topMiddleInPicture(page);
    expect(picture.width).toBeGreaterThan(picture.height);
  });
  const points = await samplePoints(page);
  const before = await pictureOf(page, points);
  await flipFromStraighten(page, hand, button);
  const isHorizontal = button === 'Horizontal';
  const label = isHorizontal ? 'left to right' : 'top to bottom';
  await check(`the picture is what was on screen, mirrored ${label}`, async () => {
    const after = await pictureOf(page, points);
    const mirrored = before.points.map(([x, y]) => (isHorizontal
      ? [before.width - x, y]
      : [x, before.height - y]));
    expectSamePoints(after.points, mirrored);
  });
  await hand.tap(page.locator('#toolStraighten'));
  await check('the angle now reads −3.0°', async () => {
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

// Draws a crop box by hand on the Crop step: chooses the 3:4 preset, then drags the box from
// its middle by (dx, dy) CSS px. Leaves the app on the Crop step.
async function drawCropByHand(page, hand, dx, dy) {
  await goToStep(page, 'crop');
  await hand.tap(page.locator('.preset-chip', { hasText: '3:4' }));
  const { middleOnPage } = await cropBox(page);
  await hand.drag(middleOnPage, { x: middleOnPage.x + dx, y: middleOnPage.y + dy });
}

test('ROT-15.3 A flip mirrors a crop box drawn by hand [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnRotate(page, testInfo);
  await goToStep(page, 'crop');
  const fitted = await cropBox(page);
  await drawCropByHand(page, hand, CROP_DRAG_PX, 0);
  const drawn = await cropBox(page);
  await check('the crop box has moved to the right', async () => {
    expect(drawn.x).toBeGreaterThan(fitted.x + drawn.width / 10);
  });
  await goToStep(page, 'rotate');
  const { width } = await pictureOf(page, []);
  const photoUnder = await photoPointUnderCrop(page);
  await flipFromStraighten(page, hand, 'Horizontal');
  await check('the dashed box is mirrored with the photo: as far from the left edge as it '
    + 'was from the right, over the same part of the card', async () => {
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
  await goToStep(page, 'export');
  const first = await saveByDownload(page, hand, 'No');
  await check('the first file is saved as IMG_9136-straight.jpg', async () => {
    expect(first.name).toBe('IMG_9136-straight.jpg');
  });
  await goToStep(page, 'rotate');
  await flipFromStraighten(page, hand, 'Horizontal');
  await goToStep(page, 'export');
  const second = await saveByDownload(page, hand, 'No');
  const firstImage = await readSavedImage(page, first.file, COMPARE_GRID);
  const secondImage = await readSavedImage(page, second.file, COMPARE_GRID);
  await check('the second file is the first one mirrored left to right', async () => {
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
  await check(`the photo lies on its side with its top edge at the ${topSide}`, async () => {
    const top = await topMiddleInPicture(page);
    expect(top.picture.width).toBeGreaterThan(top.picture.height);
    const across = topSide === 'left' ? top.across : 1 - top.across;
    expect(across).toBeLessThan(0.1);
    expect(Math.abs(top.down - 0.5)).toBeLessThan(0.1);
  });
  await hand.tap(page.locator('#btnUndo'));
  await check('one Undo stands the photo upright again', async () => {
    const top = await topMiddleInPicture(page);
    expect(top.picture.height).toBeGreaterThan(top.picture.width);
    expect(top.down).toBeLessThan(0.1);
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
  await drawCropByHand(page, hand, 0, CROP_DRAG_PX);
  const drawn = await cropBox(page);
  await check('the 3:4 crop box is taller than wide', async () => {
    expect(drawn.height).toBeGreaterThan(drawn.width);
  });
  await goToStep(page, 'rotate');
  const photoUnder = await photoPointUnderCrop(page);
  await hand.tap(page.locator('#toolRotateRight'));
  await check('the dashed box turned with the photo: wider than tall, over the same part of '
    + 'the card', async () => {
    const turned = await cropBox(page);
    expect(Math.abs(turned.width - drawn.height)).toBeLessThan(POSITION_TOLERANCE_PX);
    expect(Math.abs(turned.height - drawn.width)).toBeLessThan(POSITION_TOLERANCE_PX);
    expectSamePoints([await photoPointUnderCrop(page)], [photoUnder]);
  });
});

test('ROT-19.1 Fill frame leaves no empty corners in the saved image [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnRotate(page, testInfo);
  await typeAngle(page, hand, '10');
  await check('the angle reads 10.0°', async () => {
    await expect(angleText(page)).toHaveText('10.0°');
  });
  await hand.tap(page.locator('#toolFillFrame'));
  await check('Fill frame reads On', async () => {
    await expect(page.locator('#toolFillFrame')).toContainText('On');
  });
  await goToStep(page, 'export');
  const saved = await saveByDownload(page, hand, 'No');
  const image = await readSavedImage(page, saved.file);
  await check('none of the saved image\'s four corners is the white fill', async () => {
    const isFill = pixel => pixel.slice(0, 3).every(channel => channel >= FILL_WHITE_MIN);
    expect(image.corners.filter(isFill)).toEqual([]);
  });
});

test('ROT-19.2 Fill frame is a switch, and each change is one undo step [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnRotate(page, testInfo);
  const fillFrame = page.locator('#toolFillFrame');
  await check('Fill frame reads Off', async () => {
    await expect(fillFrame).toContainText('Off');
  });
  const cropBefore = await cropBox(page);
  await hand.tap(fillFrame);
  await check('Fill frame reads On and the dashed box gets smaller', async () => {
    await expect(fillFrame).toContainText('On');
    expect((await cropBox(page)).width).toBeLessThan(cropBefore.width);
  });
  await hand.tap(page.locator('#btnUndo'));
  await check('Undo turns it Off, with the box at its old size', async () => {
    await expect(fillFrame).toContainText('Off');
    expect(Math.abs((await cropBox(page)).width - cropBefore.width)).toBeLessThan(1);
    await expect(page.locator('#btnUndo')).toBeDisabled();
  });
  await hand.tap(page.locator('#btnRedo'));
  await check('Redo turns it On again', async () => {
    await expect(fillFrame).toContainText('On');
  });
  await hand.tap(fillFrame);
  await check('a second tap turns it Off', async () => {
    await expect(fillFrame).toContainText('Off');
  });
  await hand.tap(page.locator('#btnUndo'));
  await check('Undo takes back only that tap: On', async () => {
    await expect(fillFrame).toContainText('On');
  });
});

test('ROT-20.1 The grid, for a person to judge [phone]', async ({ page, check }, testInfo) => {
  const hand = await startOnRotate(page, testInfo);
  await waitForStill(page);
  await check.eye('faint lines in squares of about 48 px over the whole photo area, the '
    + 'middle of the grid on the middle of the picture');
  await goToStep(page, 'crop');
  await waitForStill(page);
  await check.eye('on the Crop step: no grid lines');
  await goToStep(page, 'rotate');
  await openOptions(page, hand, 'rotate');
  const grid = page.locator('#rotateGrid');
  await check('in Rotate options, Grid is on', async () => {
    await expect(grid).toBeChecked();
  });
  await hand.tap(grid);
  await closeOptions(page, hand, 'rotate');
  await check('Grid is now off', async () => {
    await expect(grid).not.toBeChecked();
  });
  await waitForStill(page);
  await check.eye('with Grid off: no grid lines; the dashed box is still there');
});

test('ROT-20.2 The grid is never exported [phone] [webkit]', async ({ page, check }, testInfo) => {
  const hand = await startOnRotate(page, testInfo);
  await goToStep(page, 'export');
  const withGrid = await saveByDownload(page, hand, 'No');
  await goToStep(page, 'rotate');
  await openOptions(page, hand, 'rotate');
  await hand.tap(page.locator('#rotateGrid'));
  await check('Grid is off', async () => {
    await expect(page.locator('#rotateGrid')).not.toBeChecked();
  });
  await closeOptions(page, hand, 'rotate');
  await goToStep(page, 'export');
  const withoutGrid = await saveByDownload(page, hand, 'No');
  const firstImage = await readSavedImage(page, withGrid.file, COMPARE_GRID);
  const secondImage = await readSavedImage(page, withoutGrid.file, COMPARE_GRID);
  await check('the two saved images are the same, pixel for pixel', async () => {
    expect(secondImage).toEqual(firstImage);
  });
});

test('ROT-21.1 The crop on Rotate, for a person to judge [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnRotate(page, testInfo);
  await waitForStill(page);
  await check.eye('a dashed white square around the card in its holder');
  await typeAngle(page, hand, '10');
  await check('the angle reads 10.0°', async () => {
    await expect(angleText(page)).toHaveText('10.0°');
  });
  await waitForStill(page);
  await check.eye('at 10.0°: the photo is tilted; the dashed square stays square to the '
    + 'screen, around the card');
});

test('ROT-22.1 Reset rotation clears turns, angle, flips and Fill frame in one step [phone]',
  async ({ page, check }, testInfo) => {
    const hand = await startOnRotate(page, testInfo);
    const tiltAtStart = await tiltDeg(page);
    await dragRuler(page, hand, -6 * RULER_PX_PER_DEGREE);
    await hand.tap(page.locator('#toolRotateRight'));
    await hand.tap(page.locator('#toolFillFrame'));
    await flipFromStraighten(page, hand, 'Horizontal');
    const changed = await editState(page);
    await check('the photo is tilted, turned, mirrored, with Fill frame On', async () => {
      expect(changed.rotation).toEqual({ quarter: 3, fine: -6, fillFrame: true });
      expect(changed.flip).toEqual({ h: true, v: false });
      await expect(page.locator('#toolFillFrame')).toContainText('On');
      expect(await hasWhiteFill(page.locator('#btnFlipHorizontal'))).toBe(true);
    });
    await openOptions(page, hand, 'rotate');
    await hand.tap(page.locator('#rotateResetRow'));
    await closeOptions(page, hand, 'rotate');
    await check('the photo is upright, level and not mirrored; Fill frame reads Off; '
      + 'Horizontal is not lit', async () => {
      const state = await editState(page);
      expect(state.rotation).toEqual({ quarter: 0, fine: 0, fillFrame: false });
      expect(state.flip).toEqual({ h: false, v: false });
      expect(Math.abs(await tiltDeg(page) - tiltAtStart)).toBeLessThan(ANGLE_TOLERANCE_DEG);
      await expect(page.locator('#toolFillFrame')).toContainText('Off');
      expect(await hasWhiteFill(page.locator('#btnFlipHorizontal'))).toBe(false);
    });
    await hand.tap(page.locator('#toolStraighten'));
    await check('the angle reads 0.0°', async () => {
      await expect(angleText(page)).toHaveText('0.0°');
    });
    await hand.tap(page.locator('#btnUndo'));
    await check('one Undo brings it all back: on its side, mirrored, Fill frame On, −6.0°',
      async () => {
        const state = await editState(page);
        expect(state.rotation).toEqual(changed.rotation);
        expect(state.flip).toEqual(changed.flip);
        await expect(page.locator('#toolFillFrame')).toContainText('On');
        await expect(angleText(page)).toHaveText(`${MINUS}6.0°`);
      });
  });

test('ROT-22.2 Reset rotation leaves Grid as it is [phone]', async ({ page, check }, testInfo) => {
  const hand = await startOnRotate(page, testInfo);
  await openOptions(page, hand, 'rotate');
  const grid = page.locator('#rotateGrid');
  await hand.tap(grid);
  await check('Grid is off', async () => {
    await expect(grid).not.toBeChecked();
  });
  await hand.tap(page.locator('#rotateResetRow'));
  await check('after Reset rotation, Grid is still off', async () => {
    await expect(grid).not.toBeChecked();
    expect(await page.evaluate(() => window.__straightener.app.showGrid)).toBe(false);
  });
});

// Chooses Flip and turns Grid off: the two things Rotate keeps for the session.
async function chooseFlipAndHideGrid(page, hand) {
  await hand.tap(page.locator('#toolFlip'));
  await openOptions(page, hand, 'rotate');
  await hand.tap(page.locator('#rotateGrid'));
  await closeOptions(page, hand, 'rotate');
}

test('ROT-23.1 Flip and Grid stay as set for the next photo [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnRotate(page, testInfo);
  await chooseFlipAndHideGrid(page, hand);
  await check('Flip is selected, Grid is off, and Undo is still off', async () => {
    expect(await hasWhiteFill(page.locator('#toolFlip'))).toBe(true);
    await expect(page.locator('#rotateGrid')).not.toBeChecked();
    await expect(page.locator('#btnUndo')).toBeDisabled();
  });
  await openPhoto(page, SECOND_PHOTO);
  await goToStep(page, 'rotate');
  await check('with the next photo, Rotate opens on Flip', async () => {
    expect(await hasWhiteFill(page.locator('#toolFlip'))).toBe(true);
    await expect(page.locator('#rotateFlipLine')).toBeVisible();
  });
  await openOptions(page, hand, 'rotate');
  await check('and Grid is still off', async () => {
    await expect(page.locator('#rotateGrid')).not.toBeChecked();
  });
});

test('ROT-23.2 Flip and Grid are not kept after a reload [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnRotate(page, testInfo);
  await chooseFlipAndHideGrid(page, hand);
  // A person would wait a moment; the script waits until the photo is saved for Resume.
  await page.waitForFunction(async name => {
    const record = await window.__straightener.Session.peek();
    return !!record && record.name === name;
  }, PHOTO);
  await page.reload();
  await page.waitForFunction(() => !!window.__straightener);
  await check('the start screen offers to resume IMG_9136.JPEG', async () => {
    await expect(page.locator('#btnResume')).toBeVisible();
    await expect(page.locator('#resumeName')).toHaveText(PHOTO);
  });
  await hand.tap(page.locator('#btnResume'));
  await page.waitForFunction(() => !!window.__straightener.app.geometry);
  await goToStep(page, 'rotate');
  await check('Rotate opens on Straighten, with the angle\'s line and the ruler', async () => {
    expect(await hasWhiteFill(page.locator('#toolStraighten'))).toBe(true);
    await expect(page.locator(RULER)).toBeVisible();
  });
  await openOptions(page, hand, 'rotate');
  await check('Grid is on again', async () => {
    await expect(page.locator('#rotateGrid')).toBeChecked();
  });
});
