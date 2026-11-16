// The Levels step's cases (tests/catalog/levels.md): Discard and Apply, the draft, the two picks
// and their swatches, aiming and the magnifier, how a pick samples the photo, picks that can't
// work, the pick marks, Auto, Clear, holding the photo to compare and its badge, leaving the
// step, Resume, where the picked points land in the saved file, the instruction, the tips and
// the undo steps.
// Each test drives the app as a person would, through hand.tap and hand.drag (a finger on the
// phone targets, the mouse on the wide ones), and reads the app's state only to check a result.
'use strict';
const { test, expect } = require('./support/case.js');
const {
  openPhoto,
  goToStep,
  editState,
  openOptions,
  saveByDownload,
  hasWhiteFill,
  waitForStill,
} = require('./support/app.js');
const {
  middleColor,
  pinchAt,
  holdDragAt,
  releaseDrag,
  offsetBy,
  sendTouch,
  openPicture,
} = require('./support/perspective.js');
const {
  toastNow,
  waitForSaved,
  reloadToStart,
  resumeAs,
  addLogo,
} = require('./support/start-and-session.js');
const {
  LEVELS_PHOTO,
  SPOTS,
  startOnLevels,
  spotOnPage,
  photoPointAt,
  pickButton,
  armedPick,
  levelsDot,
  levelsNow,
  swatchColor,
  pickSpot,
  tapPoint,
  pressPhoto,
  releasePhoto,
  holdPhoto,
  badgeShown,
  pressThenTap,
  fileRegionColor,
  expectedPick,
  outputPointOf,
  viewNow,
  whitePicture,
  afterDraw,
  badgeFadeSeries,
} = require('./support/levels.js');

// Another photo, a raw card on white, for the cases that open a second photo.
const SECOND_PHOTO = '14_front_portrait_raw_white.JPEG';
// A photo on which Auto finds no clear black: a landscape card in a labelled one-touch, on white.
const NO_BLACK_PHOTO = '13_front_landscape_onetouch_labeled_white.JPEG';
// The four instructions between Discard and Apply (js/app/levels.js, LEVELS_HINTS).
const HINTS = {
  start: 'Pick white, or try Auto',
  white: 'Tap something white',
  black: 'Tap something black',
  compare: 'Hold the photo to compare',
};
// The pop-ups and warnings the cases expect, word for word.
const AUTO_BOTH = 'Auto set white and black points. Check them, then Apply.';
const AUTO_WHITE_ONLY = 'Auto set the white point (no clear black). Check it, then Apply.';
const AUTO_FAILED = 'Couldn’t estimate levels from this image.';
const OUTSIDE_PHOTO = 'That spot is outside the photo.';
const TOO_LIGHT_FOR_BLACK = 'That spot is too light to be a black point. '
  + 'Pick something dark, or skip the black point.';
const DARKER_THAN_BLACK = 'That spot is darker than the black point. Pick something brighter.';
const BRIGHTER_THAN_WHITE = 'That spot is brighter than the white point. Pick something darker.';
// The colors of the two spots the picks use, measured once on IMG_9075.JPEG (0 to 255).
const WHITE_SPOT_COLOR = [225, 226, 217];
const DARK_SPOT_COLOR = [67, 65, 68];
// How close a swatch must be to a spot's measured color, per channel (0 to 255).
const SPOT_TOLERANCE = 3;
// Two drawings of the photo whose mean colors differ by less than this, per channel, are the
// same picture (0 to 255).
const SAME_COLOR_TOLERANCE = 1;
// Levels change the mean color of the middle of the photo by more than this in at least one
// channel (Auto on IMG_9075 changes it by several units).
const CHANGED_COLOR_MIN = 2;
// How far, in photo px, a recorded pick point may be from where the finger lifted (it is
// rounded to a whole px).
const PICK_POINT_TOLERANCE_PX = 2;
// The saved file's color at a pick point may differ from the target by this much per channel
// (JPEG at quality 0.92 and resampling), 0 to 255.
const SAVED_TOLERANCE = 4;
// The patch of the saved file read around a pick point, radius in its px.
const SAVED_PATCH_PX = 6;
// The dropper's patch radius in screen px (CONFIG.levels.sampleRadiusPx) and the least it
// covers on the photo, in photo px.
const SAMPLE_RADIUS_SCREEN_PX = 4;
const SAMPLE_RADIUS_MIN_PX = 4;
// The share of the patch's darkest and brightest pixels the dropper leaves out
// (CONFIG.levels.sampleTrim).
const SAMPLE_TRIM = 0.25;
// How close the swatch must be to the color worked out from the photo file, per channel: the
// app rounds to one decimal, the swatch's tooltip to whole numbers.
const PICK_MATCH_TOLERANCE = 1;
// A spot where the slab's left edge runs through the dropper's patch, as fractions of the crop:
// the trimmed and untrimmed means differ there.
const EDGE_SPOT = [0.188, 0.5];
// The trimmed mean differs from the plain mean at the edge spot by more than this in at least
// one channel, so leaving pixels out shows.
const TRIM_EFFECT_MIN = 4;
// The pixel color of the white target and the black target (CONFIG.levels.whiteTarget and
// blackTarget).
const WHITE_TARGET = 245;
const BLACK_TARGET = 8;
// The app icon used as a logo (icons/icon.svg): its matte black, P1Hunt red and white, and
// where each is, as fractions [across, down] of the saved image (the logo sits in the middle at
// a quarter of the width).
const LOGO = 'icon.svg';
const LOGO_PARTS = [
  { name: 'matte black', color: [22, 22, 24], place: [0.39, 0.39] },
  { name: 'red P', color: [229, 50, 45], place: [0.43, 0.525] },
  { name: 'white 1', color: [255, 255, 255], place: [0.57, 0.525] },
];
// A logo color in the saved file may differ from the drawing's own color by this much per
// channel (JPEG blurs the red's edges), 0 to 255.
const LOGO_TOLERANCE = 10;
// How far the photo is dragged to show the empty area past its left edge, in CSS px.
const PAN_PX = 200;
// How far in from the photo area's left edge the tap outside the photo lands, in CSS px.
const EDGE_INSET_PX = 15;
// How far below the framed picture the tap on the empty area lands, in CSS px.
const BELOW_PICTURE_PX = 40;
// The two dispatched fingers sendTouch knows (FIRST_FINGER_ID and SECOND_FINGER_ID in
// support/perspective.js).
const FIRST_FINGER = 21;
const SECOND_FINGER = 22;
// How far apart the second finger lands from the first, in CSS px.
const SECOND_FINGER_GAP_PX = 80;
// A pinch that doubles the gap between two fingers zooms in about twice.
const PINCH_START_GAP_PX = 100;
const PINCH_END_GAP_PX = 200;
// After that pinch the zoom is more than this many times the fitted one.
const PINCH_ZOOM_MIN = 1.5;
// A press held this long or more is not a tap (TAP_MS in js/app/input.js), in ms.
const TAP_MS = 300;
// A frame of the badge part-way through its fade is brighter than the frame before it began by
// more than FADE_STEP_MIN, and dimmer than this share of its full brightness (0 to 255).
const FADE_DIM_SHARE = 0.8;
const FADE_STEP_MIN = 20;

// The dropper's patch radius at a point of the page, in photo px: 4 screen px, measured on the
// photo, and never less than 4 photo px.
async function sampleRadiusAt(page, point, screenRadiusPx = SAMPLE_RADIUS_SCREEN_PX) {
  const center = await photoPointAt(page, point);
  const edge = await photoPointAt(page, offsetBy(point, screenRadiusPx, 0));
  const radius = Math.hypot(edge[0] - center[0], edge[1] - center[1]);
  return { center, radius: Math.max(SAMPLE_RADIUS_MIN_PX, radius), screenRadius: radius };
}

// Expects two colors ([red, green, blue]) to match within `tolerance` per channel.
function expectSameColor(actual, expected, tolerance) {
  expect(actual).toHaveLength(3);
  actual.forEach((channel, index) => {
    expect(Math.abs(channel - expected[index])).toBeLessThanOrEqual(tolerance);
  });
}

// The largest difference between two colors in any one channel.
function colorDifference(first, second) {
  return Math.max(...first.map((channel, index) => Math.abs(channel - second[index])));
}

// The mean color of the middle of the photo area once it has been drawn.
async function drawnColor(page) {
  await afterDraw(page);
  return middleColor(page);
}

// The instruction between Discard and Apply.
const hintLine = page => page.locator('#levelsHint');

test('LEV-01.1 Discard drops the unapplied changes [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnLevels(page, testInfo);
  const discard = page.locator('#btnDiscardLevels');
  const colorBefore = await drawnColor(page);
  await check('Discard is greyed out; there is no dot on the Levels tab', async () => {
    await expect(discard).toBeDisabled();
    await expect(levelsDot(page)).toBeHidden();
  });
  await hand.tap(page.locator('#toolAutoLevels'));
  await check('after Auto the photo changes, Discard is live and the Levels tab has a dot',
    async () => {
      expect(colorDifference(await drawnColor(page), colorBefore)).toBeGreaterThan(
        CHANGED_COLOR_MIN,
      );
      await expect(discard).toBeEnabled();
      await expect(levelsDot(page)).toBeVisible();
    });
  await hand.tap(discard);
  await check('Discard puts the photo back, empties both swatches, greys out Discard and Apply '
    + 'and removes the dot; Undo stays greyed out', async () => {
    expect(colorDifference(await drawnColor(page), colorBefore)).toBeLessThanOrEqual(
      SAME_COLOR_TOLERANCE,
    );
    expect(await swatchColor(page, 'white')).toBeNull();
    expect(await swatchColor(page, 'black')).toBeNull();
    await expect(discard).toBeDisabled();
    await expect(page.locator('#btnApplyLevels')).toBeDisabled();
    await expect(levelsDot(page)).toBeHidden();
    await expect(page.locator('#btnUndo')).toBeDisabled();
  });
});

test('LEV-02.1 Apply makes the changes part of the photo as one undo step [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnLevels(page, testInfo);
  const apply = page.locator('#btnApplyLevels');
  const colorBefore = await drawnColor(page);
  await check('Apply is greyed out', async () => {
    await expect(apply).toBeDisabled();
  });
  await hand.tap(page.locator('#toolAutoLevels'));
  const colorDraft = await drawnColor(page);
  const draft = (await levelsNow(page)).draft;
  await check('after Auto, Apply is live', async () => {
    await expect(apply).toBeEnabled();
  });
  await hand.tap(apply);
  await check('Apply keeps the photo as it looks, greys out Apply and Discard, removes the dot '
    + 'and lights Undo', async () => {
    expect(colorDifference(await drawnColor(page), colorDraft)).toBeLessThanOrEqual(
      SAME_COLOR_TOLERANCE,
    );
    expect((await levelsNow(page)).applied).toEqual(draft);
    await expect(apply).toBeDisabled();
    await expect(page.locator('#btnDiscardLevels')).toBeDisabled();
    await expect(levelsDot(page)).toBeHidden();
    await expect(page.locator('#btnUndo')).toBeEnabled();
  });
  await hand.tap(page.locator('#btnUndo'));
  await check('one Undo takes the levels away: the photo is as it was and Undo is greyed out',
    async () => {
      expect(colorDifference(await drawnColor(page), colorBefore)).toBeLessThanOrEqual(
        SAME_COLOR_TOLERANCE,
      );
      expect((await levelsNow(page)).applied).toBeNull();
      await expect(page.locator('#btnUndo')).toBeDisabled();
    });
});

test('LEV-03.1 The other steps show the applied levels, not the unapplied ones [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnLevels(page, testInfo);
  await goToStep(page, 'crop', hand);
  const cropColor = await drawnColor(page);
  await goToStep(page, 'levels', hand);
  const levelsColor = await drawnColor(page);
  await hand.tap(page.locator('#toolAutoLevels'));
  const draftColor = await drawnColor(page);
  await check('on Levels, Auto changes the photo', async () => {
    expect(colorDifference(draftColor, levelsColor)).toBeGreaterThan(CHANGED_COLOR_MIN);
  });
  await goToStep(page, 'crop', hand);
  await check('on Crop the photo looks as it did before Auto; the Levels tab has a dot',
    async () => {
      expect(colorDifference(await drawnColor(page), cropColor)).toBeLessThanOrEqual(
        SAME_COLOR_TOLERANCE,
      );
      await expect(levelsDot(page)).toBeVisible();
    });
  await goToStep(page, 'levels', hand);
  await check('back on Levels the photo shows Auto\'s change again', async () => {
    expect(colorDifference(await drawnColor(page), draftColor)).toBeLessThanOrEqual(
      SAME_COLOR_TOLERANCE,
    );
  });
});

test('LEV-04.1 Auto again after Apply leaves nothing to apply [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnLevels(page, testInfo);
  await hand.tap(page.locator('#toolAutoLevels'));
  await hand.tap(page.locator('#btnApplyLevels'));
  await check('the levels are applied: Apply and Discard are greyed out, no dot', async () => {
    await expect(page.locator('#btnApplyLevels')).toBeDisabled();
    await expect(levelsDot(page)).toBeHidden();
  });
  await hand.tap(page.locator('#toolAutoLevels'));
  await check('Auto again, with the same result: Apply and Discard stay greyed out, no dot',
    async () => {
      await expect(page.locator('#btnApplyLevels')).toBeDisabled();
      await expect(page.locator('#btnDiscardLevels')).toBeDisabled();
      await expect(levelsDot(page)).toBeHidden();
      expect((await levelsNow(page)).isPending).toBe(false);
    });
});

test('LEV-05.1 Pick white arms the picker, and a second tap disarms it [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnLevels(page, testInfo);
  const pickWhite = pickButton(page, 'white');
  await hand.tap(pickWhite);
  await check('Pick white is selected (solid white) and the line reads "Tap something white"',
    async () => {
      await expect(pickWhite).toHaveAttribute('aria-pressed', 'true');
      expect(await hasWhiteFill(pickWhite)).toBe(true);
      await expect(hintLine(page)).toHaveText(HINTS.white);
    });
  await hand.tap(pickWhite);
  await check('a second tap: Pick white is no longer selected and the line reads "Pick white, '
    + 'or try Auto"', async () => {
    await expect(pickWhite).toHaveAttribute('aria-pressed', 'false');
    expect(await hasWhiteFill(pickWhite)).toBe(false);
    await expect(hintLine(page)).toHaveText(HINTS.start);
  });
});

test('LEV-05.2 Escape leaves Pick white armed [desktop]', async ({ page, check }, testInfo) => {
  const hand = await startOnLevels(page, testInfo);
  const pickWhite = pickButton(page, 'white');
  await hand.tap(pickWhite);
  await check('Pick white is selected and the line reads "Tap something white"', async () => {
    await expect(pickWhite).toHaveAttribute('aria-pressed', 'true');
    await expect(hintLine(page)).toHaveText(HINTS.white);
  });
  await page.keyboard.press('Escape');
  await check('after Escape Pick white is still selected and the line still reads "Tap '
    + 'something white"', async () => {
    await expect(pickWhite).toHaveAttribute('aria-pressed', 'true');
    await expect(hintLine(page)).toHaveText(HINTS.white);
  });
});

test('LEV-06.1 Pick black arms the picker, takes over from Pick white, and disarms [phone]',
  async ({ page, check }, testInfo) => {
    const hand = await startOnLevels(page, testInfo);
    const pickWhite = pickButton(page, 'white');
    const pickBlack = pickButton(page, 'black');
    await hand.tap(pickBlack);
    await check('Pick black is selected and the line reads "Tap something black"', async () => {
      await expect(pickBlack).toHaveAttribute('aria-pressed', 'true');
      expect(await hasWhiteFill(pickBlack)).toBe(true);
      await expect(hintLine(page)).toHaveText(HINTS.black);
    });
    await hand.tap(pickWhite);
    await check('Pick white takes over: it is selected, Pick black is not, and the line reads '
      + '"Tap something white"', async () => {
      await expect(pickWhite).toHaveAttribute('aria-pressed', 'true');
      await expect(pickBlack).toHaveAttribute('aria-pressed', 'false');
      await expect(hintLine(page)).toHaveText(HINTS.white);
    });
    await hand.tap(pickBlack);
    await hand.tap(pickBlack);
    await check('Pick black, then Pick black again: neither is selected and the line reads '
      + '"Pick white, or try Auto"', async () => {
      expect(await armedPick(page)).toBe('');
      await expect(hintLine(page)).toHaveText(HINTS.start);
    });
  });

test('LEV-07.1 The swatches read Not set, then the picked color [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnLevels(page, testInfo);
  const whiteSwatch = page.locator('#swatchWhite');
  const blackSwatch = page.locator('#swatchBlack');
  await check('both swatches are dashed and empty, with the tooltip "Not set"', async () => {
    await expect(whiteSwatch).toHaveAttribute('title', 'Not set');
    await expect(blackSwatch).toHaveAttribute('title', 'Not set');
    await expect(whiteSwatch).not.toHaveClass(/is-set/);
    expect(await whiteSwatch.evaluate(el => getComputedStyle(el).borderStyle)).toBe('dashed');
  });
  await pickSpot(page, hand, 'white', SPOTS.white);
  await check('after a white pick on the background, Pick white\'s swatch is filled with that '
    + 'white and its tooltip reads "RGB" and its three values; the black swatch still reads '
    + '"Not set"', async () => {
    const color = await swatchColor(page, 'white');
    expectSameColor(color, WHITE_SPOT_COLOR, SPOT_TOLERANCE);
    const fill = await whiteSwatch.evaluate(el => el.style.background);
    expect(fill).toContain(`rgb(${color.join(', ')})`);
    await expect(blackSwatch).toHaveAttribute('title', 'Not set');
  });
  await pickSpot(page, hand, 'black', SPOTS.dark);
  await check('after a black pick on the card\'s dark background, Pick black\'s swatch shows '
    + 'that dark grey and its values', async () => {
    expectSameColor(await swatchColor(page, 'black'), DARK_SPOT_COLOR, SPOT_TOLERANCE);
    await expect(blackSwatch).toHaveClass(/is-set/);
  });
});

test('LEV-08.1 The color is taken where the finger lifts, and the photo does not move [phone] '
  + '[webkit]', async ({ page, check }, testInfo) => {
  const hand = await startOnLevels(page, testInfo);
  await hand.tap(pickButton(page, 'white'));
  const viewBefore = await viewNow(page);
  const start = await spotOnPage(page, SPOTS.white);
  const end = await spotOnPage(page, SPOTS.dark);
  await hand.drag(start, end);
  await check('pressing on the white background and lifting on the card\'s dark background '
    + 'sets the white point to the dark grey where the finger lifted', async () => {
    expectSameColor(await swatchColor(page, 'white'), DARK_SPOT_COLOR, SPOT_TOLERANCE);
    const { draft } = await levelsNow(page);
    const lifted = await photoPointAt(page, end);
    expect(Math.abs(draft.whiteAt[0] - lifted[0])).toBeLessThanOrEqual(PICK_POINT_TOLERANCE_PX);
    expect(Math.abs(draft.whiteAt[1] - lifted[1])).toBeLessThanOrEqual(PICK_POINT_TOLERANCE_PX);
  });
  await check('the photo did not move under the finger', async () => {
    expect(await viewNow(page)).toEqual(viewBefore);
  });
});

test('LEV-08.2 A second finger cancels the pick and leaves the picker armed [phone]', async ({
  page,
  check,
}, testInfo) => {
  test.fail(true, 'BUG-101');
  const hand = await startOnLevels(page, testInfo);
  await hand.tap(pickButton(page, 'white'));
  const first = await spotOnPage(page, SPOTS.white);
  const second = offsetBy(first, SECOND_FINGER_GAP_PX, 0);
  await sendTouch(page, '#view', 'pointerdown', first, FIRST_FINGER);
  await sendTouch(page, '#view', 'pointerdown', second, SECOND_FINGER);
  await sendTouch(page, '#view', 'pointerup', second, SECOND_FINGER);
  await sendTouch(page, '#view', 'pointerup', first, FIRST_FINGER);
  await check('no white point is set: the swatch still reads "Not set"', async () => {
    expect(await swatchColor(page, 'white')).toBeNull();
  });
  await check('Pick white is still selected and the line still reads "Tap something white"',
    async () => {
      expect(await armedPick(page)).toBe('white');
      await expect(hintLine(page)).toHaveText(HINTS.white);
    });
});

// Presses on a spot with the white pick armed and moves a little without lifting, so the
// magnifier shows. Returns the point it stopped at, for releaseDrag.
async function aimAt(page, hand, spot) {
  await hand.tap(pickButton(page, 'white'));
  const start = await spotOnPage(page, spot);
  const end = offsetBy(start, 0, 10);
  await holdDragAt(page, hand, start, end);
  await afterDraw(page);
  return end;
}

test('LEV-09.1 The picker\'s magnifier under a finger, for a person to judge [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnLevels(page, testInfo);
  const left = await aimAt(page, hand, SPOTS.white);
  await check.eye('a finger pressing the white background at the left: a round magnifier in the '
    + 'top right corner of the photo area shows that spot 4 times larger, with a small white '
    + 'circle (the patch the pick reads) in its middle and a white rim');
  await releaseDrag(page, hand, left);
  await check('lifting the finger sets the white point', async () => {
    expect(await swatchColor(page, 'white')).not.toBeNull();
  });
  const right = await aimAt(page, hand, SPOTS.whiteRight);
  await check.eye('a finger pressing the white background at the right: the magnifier is in the '
    + 'top left corner of the photo area');
  await releaseDrag(page, hand, right);
  await afterDraw(page);
  await check.eye('the finger lifted: no magnifier');
});

test('LEV-09.2 The picker\'s magnifier beside the mouse, for a person to judge [desktop]',
  async ({ page, check }, testInfo) => {
    const hand = await startOnLevels(page, testInfo);
    const point = await aimAt(page, hand, SPOTS.white);
    await check.eye('the mouse button held on the white background left of the slab: a round '
      + 'magnifier up and to the right of the pointer shows that spot 4 times larger, with a '
      + 'small white circle in its middle and a white rim');
    await releaseDrag(page, hand, point);
    await afterDraw(page);
    await check.eye('the button let go: no magnifier');
  });

test('LEV-10.1 A pick leaves out the darkest and brightest pixels of its patch [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnLevels(page, testInfo);
  const point = await spotOnPage(page, EDGE_SPOT);
  const { center, radius } = await sampleRadiusAt(page, point);
  const trimmed = await expectedPick(page, LEVELS_PHOTO, center, radius, SAMPLE_TRIM);
  const plain = await expectedPick(page, LEVELS_PHOTO, center, radius, 0);
  await check('at this spot on the slab\'s edge, leaving out the darkest and brightest pixels '
    + 'changes the color: the patch takes in both the slab and the white background', () => {
    expect(colorDifference(trimmed, plain)).toBeGreaterThan(TRIM_EFFECT_MIN);
  });
  await hand.tap(pickButton(page, 'white'));
  await tapPoint(page, hand, point);
  await check('the white swatch is the mean of the patch with the darkest and brightest pixels '
    + 'left out, not the plain mean', async () => {
    const color = await swatchColor(page, 'white');
    expectSameColor(color, trimmed, PICK_MATCH_TOLERANCE);
  });
});

test('LEV-10.2 A pick reads at least 4 photo pixels around the point [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnLevels(page, testInfo, {
    address: 'index.html?levels.sampleRadiusPx=1',
  });
  const point = await spotOnPage(page, EDGE_SPOT);
  const { center, radius, screenRadius } = await sampleRadiusAt(page, point, 1);
  const atLeast = await expectedPick(page, LEVELS_PHOTO, center, radius, SAMPLE_TRIM);
  const tooSmall = await expectedPick(page, LEVELS_PHOTO, center, screenRadius, SAMPLE_TRIM);
  await check('with a 1 screen px circle the patch would be under 4 photo px; at this spot a '
    + '4 px patch reads a different color', () => {
    expect(screenRadius).toBeLessThan(SAMPLE_RADIUS_MIN_PX);
    expect(colorDifference(atLeast, tooSmall)).toBeGreaterThan(PICK_MATCH_TOLERANCE);
  });
  await hand.tap(pickButton(page, 'white'));
  await tapPoint(page, hand, point);
  await check('the white swatch is the color of a 4 photo px patch', async () => {
    expectSameColor(await swatchColor(page, 'white'), atLeast, PICK_MATCH_TOLERANCE);
  });
});

test('LEV-11.1 A pick that works sets the point, marks the spot and disarms [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnLevels(page, testInfo);
  const point = await spotOnPage(page, SPOTS.white);
  await hand.tap(pickButton(page, 'white'));
  await tapPoint(page, hand, point);
  await check('the white swatch shows the background\'s white', async () => {
    expectSameColor(await swatchColor(page, 'white'), WHITE_SPOT_COLOR, SPOT_TOLERANCE);
  });
  await check('the pick is marked where the finger lifted', async () => {
    const { draft } = await levelsNow(page);
    const tapped = await photoPointAt(page, point);
    expect(Math.abs(draft.whiteAt[0] - tapped[0])).toBeLessThanOrEqual(PICK_POINT_TOLERANCE_PX);
    expect(Math.abs(draft.whiteAt[1] - tapped[1])).toBeLessThanOrEqual(PICK_POINT_TOLERANCE_PX);
  });
  await check('neither pick is selected; the line reads "Hold the photo to compare"; Apply is '
    + 'live', async () => {
    expect(await armedPick(page)).toBe('');
    await expect(hintLine(page)).toHaveText(HINTS.compare);
    await expect(page.locator('#btnApplyLevels')).toBeEnabled();
  });
});

// Checks that a warning with `message` is up and the `which` pick is still armed, with no
// point set for it.
async function checkRefusedPick(page, check, which, message) {
  await check(`a warning reads "${message}"`, async () => {
    const toast = await toastNow(page);
    expect(toast).toEqual({ text: message, kind: 'warn', isShown: true });
  });
  await check(`Pick ${which} is still selected and the line still reads "${HINTS[which]}"`,
    async () => {
      expect(await armedPick(page)).toBe(which);
      await expect(hintLine(page)).toHaveText(HINTS[which]);
    });
}

test('LEV-12.1 A tap outside the photo warns and stays armed [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnLevels(page, testInfo);
  const box = await page.locator('#view').boundingBox();
  const middle = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  const viewBefore = await viewNow(page);
  await hand.drag(middle, offsetBy(middle, PAN_PX, 0));
  await check('with no pick armed, the drag moves the photo 200 px to the right', async () => {
    const view = await viewNow(page);
    expect(Math.abs(view.panX - viewBefore.panX - PAN_PX)).toBeLessThan(1);
  });
  await hand.tap(pickButton(page, 'white'));
  const outside = { x: box.x + EDGE_INSET_PX, y: middle.y };
  await check('the point near the photo area\'s left edge is past the photo\'s own edge',
    async () => {
      expect((await photoPointAt(page, outside))[0]).toBeLessThan(0);
    });
  await tapPoint(page, hand, outside);
  await checkRefusedPick(page, check, 'white', OUTSIDE_PHOTO);
  await check('the white swatch still reads "Not set"', async () => {
    expect(await swatchColor(page, 'white')).toBeNull();
  });
});

test('LEV-12.2 A black pick on something light warns and stays armed [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnLevels(page, testInfo);
  await pickSpot(page, hand, 'black', SPOTS.white);
  await checkRefusedPick(page, check, 'black', TOO_LIGHT_FOR_BLACK);
  await check('the black swatch still reads "Not set"', async () => {
    expect(await swatchColor(page, 'black')).toBeNull();
  });
});

test('LEV-12.3 A white pick no brighter than the black point warns and stays armed [phone]',
  async ({ page, check }, testInfo) => {
    const hand = await startOnLevels(page, testInfo);
    await pickSpot(page, hand, 'black', SPOTS.dark);
    await check('the black point is set to the dark grey', async () => {
      expectSameColor(await swatchColor(page, 'black'), DARK_SPOT_COLOR, SPOT_TOLERANCE);
    });
    await pickSpot(page, hand, 'white', SPOTS.dark);
    await checkRefusedPick(page, check, 'white', DARKER_THAN_BLACK);
    await check('the white swatch still reads "Not set"', async () => {
      expect(await swatchColor(page, 'white')).toBeNull();
    });
  });

test('LEV-12.4 A black pick no darker than the white point warns and stays armed [phone]',
  async ({ page, check }, testInfo) => {
    const hand = await startOnLevels(page, testInfo);
    await pickSpot(page, hand, 'white', SPOTS.dark);
    await check('the white point is set to the dark grey', async () => {
      expectSameColor(await swatchColor(page, 'white'), DARK_SPOT_COLOR, SPOT_TOLERANCE);
    });
    await pickSpot(page, hand, 'black', SPOTS.dark);
    await checkRefusedPick(page, check, 'black', BRIGHTER_THAN_WHITE);
    await check('the black swatch still reads "Not set"', async () => {
      expect(await swatchColor(page, 'black')).toBeNull();
    });
  });

test('LEV-12.5 A tap on the empty area below the picture takes a color from the photo hidden '
  + 'there [phone]', async ({ page, check }, testInfo) => {
  const hand = await startOnLevels(page, testInfo);
  const bottomLeft = await spotOnPage(page, [0, 1]);
  const topRight = await spotOnPage(page, [1, 0]);
  const below = { x: (bottomLeft.x + topRight.x) / 2, y: bottomLeft.y + BELOW_PICTURE_PX };
  const hidden = await photoPointAt(page, below);
  await check('the point 40 px below the picture is on the photo, outside the part shown',
    async () => {
      const { width, height } = (await editState(page)).source;
      expect(hidden[0]).toBeGreaterThan(0);
      expect(hidden[0]).toBeLessThan(width);
      expect(hidden[1]).toBeGreaterThan(0);
      expect(hidden[1]).toBeLessThan(height);
    });
  await hand.tap(pickButton(page, 'white'));
  await tapPoint(page, hand, below);
  await check('no warning; the white point is set, from the photo hidden under the empty area, '
    + 'and the picker is disarmed', async () => {
    expect((await toastNow(page)).isShown).toBe(false);
    const { draft } = await levelsNow(page);
    expect(Math.abs(draft.whiteAt[1] - hidden[1])).toBeLessThanOrEqual(PICK_POINT_TOLERANCE_PX);
    expect(await armedPick(page)).toBe('');
  });
});

test('LEV-13.1 The pick marks, for a person to judge [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnLevels(page, testInfo);
  await pickSpot(page, hand, 'white', SPOTS.white);
  await pickSpot(page, hand, 'black', SPOTS.dark);
  await check('both points are set', async () => {
    const { draft } = await levelsNow(page);
    expect(draft.whiteAt).not.toBeNull();
    expect(draft.blackAt).not.toBeNull();
  });
  await waitForStill(page);
  await check.eye('a small black and white ring labelled W on the white background left of the '
    + 'slab, and one labelled B on the card\'s dark background up and to the left of the '
    + 'driver\'s head');
  const middle = await spotOnPage(page, [0.5, 0.5]);
  await holdPhoto(page, hand, middle);
  await check.eye('holding the photo: the picture without levels, the Before levels badge at '
    + 'the top left, and no W or B ring');
  await releasePhoto(page, hand, middle);
  await hand.tap(page.locator('#toolAutoLevels'));
  await check('after Auto neither point has a place', async () => {
    const { draft } = await levelsNow(page);
    expect(draft.whiteAt).toBeNull();
    expect(draft.blackAt).toBeNull();
  });
  await afterDraw(page);
  await check.eye('after Auto: no W or B ring on the photo');
});

test('LEV-14.1 Auto sets both points, says so, and removes the pick marks [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnLevels(page, testInfo);
  await hand.tap(pickButton(page, 'white'));
  await check('arming Pick white shows no pop-up', async () => {
    expect((await toastNow(page)).isShown).toBe(false);
  });
  await tapPoint(page, hand, await spotOnPage(page, SPOTS.white));
  await check('the white point is set, with its mark', async () => {
    expect((await levelsNow(page)).draft.whiteAt).not.toBeNull();
  });
  await hand.tap(page.locator('#toolAutoLevels'));
  await check(`a pop-up reads "${AUTO_BOTH}"`, async () => {
    expect(await toastNow(page)).toEqual({ text: AUTO_BOTH, kind: '', isShown: true });
  });
  await check('both swatches are filled, Apply is live, and the white pick\'s mark has gone',
    async () => {
      expect(await swatchColor(page, 'white')).not.toBeNull();
      expect(await swatchColor(page, 'black')).not.toBeNull();
      await expect(page.locator('#btnApplyLevels')).toBeEnabled();
      expect((await levelsNow(page)).draft.whiteAt).toBeNull();
    });
});

test('LEV-14.2 With no clear black, Auto sets the white point only [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnLevels(page, testInfo, { photo: NO_BLACK_PHOTO });
  await hand.tap(page.locator('#toolAutoLevels'));
  await check(`a pop-up reads "${AUTO_WHITE_ONLY}"`, async () => {
    expect(await toastNow(page)).toEqual({ text: AUTO_WHITE_ONLY, kind: '', isShown: true });
  });
  await check('the white swatch is filled; the black swatch still reads "Not set"', async () => {
    expect(await swatchColor(page, 'white')).not.toBeNull();
    expect(await swatchColor(page, 'black')).toBeNull();
  });
});

test('LEV-14.3 Auto on a picture with nothing to go on warns, with no next step [phone]',
  async ({ page, check }, testInfo) => {
    const hand = await startOnLevels(page, testInfo);
    await openPicture(page, await whitePicture(page));
    await goToStep(page, 'levels', hand);
    await hand.tap(page.locator('#toolAutoLevels'));
    await check(`a warning reads "${AUTO_FAILED}"`, async () => {
      expect(await toastNow(page)).toEqual({ text: AUTO_FAILED, kind: 'warn', isShown: true });
    });
    await check('nothing changes: both swatches read "Not set" and Apply is greyed out',
      async () => {
        expect(await swatchColor(page, 'white')).toBeNull();
        expect(await swatchColor(page, 'black')).toBeNull();
        await expect(page.locator('#btnApplyLevels')).toBeDisabled();
      });
  });

test('LEV-15.1 Clear empties both points and disarms the picker [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnLevels(page, testInfo);
  const clear = page.locator('#toolClearLevels');
  const colorBefore = await drawnColor(page);
  await check('Clear is greyed out', async () => {
    await expect(clear).toBeDisabled();
  });
  await hand.tap(page.locator('#toolAutoLevels'));
  await hand.tap(pickButton(page, 'white'));
  await check('after Auto, Clear is live; Pick white is selected', async () => {
    await expect(clear).toBeEnabled();
    expect(await armedPick(page)).toBe('white');
  });
  await hand.tap(clear);
  await check('Clear empties both swatches, disarms Pick white, puts the photo back and greys '
    + 'out Clear and Apply', async () => {
    expect(await swatchColor(page, 'white')).toBeNull();
    expect(await swatchColor(page, 'black')).toBeNull();
    expect(await armedPick(page)).toBe('');
    expect(colorDifference(await drawnColor(page), colorBefore)).toBeLessThanOrEqual(
      SAME_COLOR_TOLERANCE,
    );
    await expect(clear).toBeDisabled();
    await expect(page.locator('#btnApplyLevels')).toBeDisabled();
  });
});

test('LEV-15.2 Clear, then Apply, removes applied levels as one undo step [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnLevels(page, testInfo);
  const colorBefore = await drawnColor(page);
  await hand.tap(page.locator('#toolAutoLevels'));
  await hand.tap(page.locator('#btnApplyLevels'));
  const applied = (await levelsNow(page)).applied;
  const colorApplied = await drawnColor(page);
  await hand.tap(page.locator('#toolClearLevels'));
  await check('Clear shows the photo without levels and lights Apply; the levels are still '
    + 'applied', async () => {
    expect(colorDifference(await drawnColor(page), colorBefore)).toBeLessThanOrEqual(
      SAME_COLOR_TOLERANCE,
    );
    await expect(page.locator('#btnApplyLevels')).toBeEnabled();
    expect((await levelsNow(page)).applied).toEqual(applied);
  });
  await hand.tap(page.locator('#btnApplyLevels'));
  await check('Apply removes the levels: none are applied and Apply is greyed out', async () => {
    expect((await levelsNow(page)).applied).toBeNull();
    await expect(page.locator('#btnApplyLevels')).toBeDisabled();
  });
  await hand.tap(page.locator('#btnUndo'));
  await check('one Undo brings the levels back', async () => {
    expect((await levelsNow(page)).applied).toEqual(applied);
    expect(colorDifference(await drawnColor(page), colorApplied)).toBeLessThanOrEqual(
      SAME_COLOR_TOLERANCE,
    );
  });
});

test('LEV-16.1 Holding the photo shows it with no levels until it is let go [phone] [webkit]',
  async ({ page, check }, testInfo) => {
    const hand = await startOnLevels(page, testInfo);
    const colorNone = await drawnColor(page);
    await hand.tap(page.locator('#toolAutoLevels'));
    const colorDraft = await drawnColor(page);
    const viewBefore = await viewNow(page);
    const middle = await spotOnPage(page, [0.5, 0.5]);
    await holdPhoto(page, hand, middle);
    await check('held still for a quarter of a second, the photo shows with no levels',
      async () => {
        expect((await levelsNow(page)).isComparing).toBe(true);
        expect(colorDifference(await drawnColor(page), colorNone)).toBeLessThanOrEqual(
          SAME_COLOR_TOLERANCE,
        );
      });
    await releasePhoto(page, hand, middle);
    await check('let go, the levels are back; the photo has not moved', async () => {
      expect((await levelsNow(page)).isComparing).toBe(false);
      expect(colorDifference(await drawnColor(page), colorDraft)).toBeLessThanOrEqual(
        SAME_COLOR_TOLERANCE,
      );
      expect(await viewNow(page)).toEqual(viewBefore);
    });
  });

test('LEV-16.2 With no levels, holding the photo does nothing [phone]', async ({
  page,
  check,
}, testInfo) => {
  test.fail(true, 'BUG-102');
  const hand = await startOnLevels(page, testInfo);
  const middle = await spotOnPage(page, [0.5, 0.5]);
  await holdPhoto(page, hand, middle);
  const isComparing = (await levelsNow(page)).isComparing;
  await releasePhoto(page, hand, middle);
  await check('held for a quarter of a second, there is no comparison', () => {
    expect(isComparing).toBe(false);
  });
});

test('LEV-16.3 A press that showed the comparison is not also a tap [phone]', async ({
  page,
  check,
}, testInfo) => {
  test.fail(true, 'BUG-103');
  const hand = await startOnLevels(page, testInfo);
  await hand.tap(page.locator('#toolAutoLevels'));
  const box = await page.locator('#view').boundingBox();
  const middle = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  const fitted = await viewNow(page);
  await pinchAt(page, middle, PINCH_START_GAP_PX, PINCH_END_GAP_PX);
  const zoomed = await viewNow(page);
  await check('two fingers moving apart zoom the photo in; Fit shows in the top bar', async () => {
    expect(zoomed.zoom).toBeGreaterThan(fitted.zoom * PINCH_ZOOM_MIN);
    await expect(page.locator('#btnFit')).toBeVisible();
  });
  const press = await pressThenTap(page, middle);
  await check('the press showed the comparison and lasted under 0.3 seconds', () => {
    expect(press.isCompared).toBe(true);
    expect(press.holdMs).toBeLessThan(TAP_MS);
  });
  await check('the quick tap after it is a single tap: the photo stays zoomed in', async () => {
    expect((await viewNow(page)).zoom).toBe(zoomed.zoom);
  });
});

test('LEV-17.1 The Before levels badge, for a person to judge [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnLevels(page, testInfo);
  await hand.tap(page.locator('#toolAutoLevels'));
  const middle = await spotOnPage(page, [0.5, 0.5]);
  await holdPhoto(page, hand, middle);
  await page.waitForTimeout(150);
  await check('while held, a badge is drawn at the top left of the photo area', async () => {
    expect(await badgeShown(page)).toBe(true);
  });
  await check.eye('a dark badge at the top left of the photo area reads "Before levels" in '
    + 'white');
  await releasePhoto(page, hand, middle);
  await check('let go, the badge has gone', async () => {
    await afterDraw(page);
    expect(await badgeShown(page)).toBe(false);
  });
});

test('LEV-17.2 The badge fades in even when the device asks for less motion [phone]', async ({
  page,
  check,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const hand = await startOnLevels(page, testInfo);
  await hand.tap(page.locator('#toolAutoLevels'));
  const middle = await spotOnPage(page, [0.5, 0.5]);
  const fading = badgeFadeSeries(page);
  await pressPhoto(page, hand, middle);
  const series = await fading;
  await releasePhoto(page, hand, middle);
  await check('the badge fades in: at least one frame shows it part-way between nothing and its '
    + 'full brightness', () => {
    const first = series[0];
    const last = series[series.length - 1];
    const partWay = series.filter(value => value > first + FADE_STEP_MIN
      && value < last * FADE_DIM_SHARE);
    expect(partWay.length).toBeGreaterThan(0);
  });
});

test('LEV-17.3 With no levels there is no badge [phone]', async ({ page, check }, testInfo) => {
  test.fail(true, 'BUG-102');
  const hand = await startOnLevels(page, testInfo);
  const middle = await spotOnPage(page, [0.5, 0.5]);
  await holdPhoto(page, hand, middle);
  await page.waitForTimeout(150);
  const isShown = await badgeShown(page);
  await releasePhoto(page, hand, middle);
  await check('while held, no Before levels badge', () => {
    expect(isShown).toBe(false);
  });
});

test('LEV-18.1 Leaving the step disarms the picker and keeps the unapplied changes [phone]',
  async ({ page, check }, testInfo) => {
    const hand = await startOnLevels(page, testInfo);
    await hand.tap(page.locator('#toolAutoLevels'));
    const draft = (await levelsNow(page)).draft;
    await hand.tap(pickButton(page, 'white'));
    await goToStep(page, 'crop', hand);
    await check('on Crop, the Levels tab has a dot', async () => {
      await expect(levelsDot(page)).toBeVisible();
    });
    await goToStep(page, 'levels', hand);
    await check('back on Levels: neither pick is selected, the line reads "Hold the photo to '
      + 'compare", Apply is live and Auto\'s points are still there', async () => {
      expect(await armedPick(page)).toBe('');
      await expect(hintLine(page)).toHaveText(HINTS.compare);
      await expect(page.locator('#btnApplyLevels')).toBeEnabled();
      expect((await levelsNow(page)).draft).toEqual(draft);
    });
  });

test('LEV-18.2 Leaving the step ends a comparison [desktop]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnLevels(page, testInfo);
  await hand.tap(page.locator('#toolAutoLevels'));
  await page.keyboard.down('c');
  await check('holding C shows the photo with no levels', async () => {
    await page.waitForFunction(() => window.__straightener.app.compare);
  });
  await page.keyboard.press('3');
  await check('pressing 3 goes to Crop and ends the comparison', async () => {
    await page.waitForFunction(() => window.__straightener.app.tab === 'crop');
    expect((await levelsNow(page)).isComparing).toBe(false);
  });
  await page.keyboard.press('4');
  await check('pressing 4 comes back to Levels, with the levels shown, not the comparison',
    async () => {
      await page.waitForFunction(() => window.__straightener.app.tab === 'levels');
      expect((await levelsNow(page)).isComparing).toBe(false);
    });
  await page.keyboard.up('c');
});

test('LEV-19.1 A newly opened photo has no levels [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnLevels(page, testInfo);
  await hand.tap(page.locator('#toolAutoLevels'));
  await hand.tap(page.locator('#btnApplyLevels'));
  await check('the levels are applied to IMG_9075.JPEG', async () => {
    expect((await levelsNow(page)).applied).not.toBeNull();
  });
  await openPhoto(page, SECOND_PHOTO);
  await goToStep(page, 'levels', hand);
  await check('the next photo has no levels: both swatches read "Not set", Apply, Discard and '
    + 'Clear are greyed out and the Levels tab has no dot', async () => {
    expect((await levelsNow(page)).applied).toBeNull();
    expect(await swatchColor(page, 'white')).toBeNull();
    expect(await swatchColor(page, 'black')).toBeNull();
    await expect(page.locator('#btnApplyLevels')).toBeDisabled();
    await expect(page.locator('#btnDiscardLevels')).toBeDisabled();
    await expect(page.locator('#toolClearLevels')).toBeDisabled();
    await expect(levelsDot(page)).toBeHidden();
  });
});

test('LEV-20.1 Resume brings back unapplied changes on top of applied levels [phone] [webkit]',
  async ({ page, check }, testInfo) => {
    const hand = await startOnLevels(page, testInfo);
    await hand.tap(page.locator('#toolAutoLevels'));
    await hand.tap(page.locator('#btnApplyLevels'));
    const autoWhite = await swatchColor(page, 'white');
    await pickSpot(page, hand, 'white', SPOTS.white);
    const pickedWhite = await swatchColor(page, 'white');
    await check('the white pick waits to be applied: a new white, Apply live, a dot', async () => {
      expect(pickedWhite).not.toEqual(autoWhite);
      await expect(page.locator('#btnApplyLevels')).toBeEnabled();
      await expect(levelsDot(page)).toBeVisible();
    });
    await waitForSaved(page, { tab: 'levels', hasDraft: true });
    await reloadToStart(page);
    await resumeAs(page, hand, LEVELS_PHOTO);
    await check('after a reload and Resume, Levels shows the picked white, with Apply live and '
      + 'the dot', async () => {
      expect(await page.evaluate(() => window.__straightener.app.tab)).toBe('levels');
      expect(await swatchColor(page, 'white')).toEqual(pickedWhite);
      await expect(page.locator('#btnApplyLevels')).toBeEnabled();
      await expect(levelsDot(page)).toBeVisible();
    });
    await hand.tap(page.locator('#btnDiscardLevels'));
    await check('Discard goes back to the applied levels: Auto\'s white', async () => {
      expect(await swatchColor(page, 'white')).toEqual(autoWhite);
      expect((await levelsNow(page)).applied).not.toBeNull();
    });
  });

test('LEV-21.1 In the saved file the picked white is 245 and the picked black 8 [phone] '
  + '[webkit]', async ({ page, check }, testInfo) => {
  const hand = await startOnLevels(page, testInfo);
  await pickSpot(page, hand, 'white', SPOTS.white);
  await pickSpot(page, hand, 'black', SPOTS.dark);
  await hand.tap(page.locator('#btnApplyLevels'));
  const { applied } = await levelsNow(page);
  await check('both points are applied', () => {
    expect(applied.white).not.toBeNull();
    expect(applied.black).not.toBeNull();
  });
  const whiteAt = await outputPointOf(page, applied.whiteAt);
  const blackAt = await outputPointOf(page, applied.blackAt);
  await goToStep(page, 'export', hand);
  const saved = await saveByDownload(page, hand, 'No');
  const savedWhite = await fileRegionColor(page, saved.file, whiteAt, SAVED_PATCH_PX, SAMPLE_TRIM);
  const savedBlack = await fileRegionColor(page, saved.file, blackAt, SAVED_PATCH_PX, SAMPLE_TRIM);
  await check('where the white was picked, the saved file reads 245, 245, 245', () => {
    expectSameColor(savedWhite, [WHITE_TARGET, WHITE_TARGET, WHITE_TARGET], SAVED_TOLERANCE);
  });
  await check('where the black was picked, the saved file reads 8, 8, 8', () => {
    expectSameColor(savedBlack, [BLACK_TARGET, BLACK_TARGET, BLACK_TARGET], SAVED_TOLERANCE);
  });
});

// Reads the logo's three colors and the card's dark background from a saved file.
async function logoAndPhotoColors(page, file, darkAt) {
  const logo = [];
  for (const part of LOGO_PARTS) {
    const { width, height } = await page.evaluate(() => {
      const output = window.__straightener.app.geometry.output;
      return { width: output.width, height: output.height };
    });
    const center = [part.place[0] * width, part.place[1] * height];
    logo.push(await fileRegionColor(page, file, center, 2));
  }
  const photo = await fileRegionColor(page, file, darkAt, SAVED_PATCH_PX, SAMPLE_TRIM);
  return { logo, photo };
}

test('LEV-21.2 Levels never change the logo [phone]', async ({ page, check }, testInfo) => {
  const hand = await startOnLevels(page, testInfo);
  const darkSource = await photoPointAt(page, await spotOnPage(page, SPOTS.dark));
  const darkAt = await outputPointOf(page, darkSource);
  await goToStep(page, 'overlay', hand);
  await addLogo(page, hand, page.locator('#btnOverlayAdd'), LOGO);
  await goToStep(page, 'export', hand);
  const before = await saveByDownload(page, hand, 'No');
  await goToStep(page, 'levels', hand);
  await pickSpot(page, hand, 'white', SPOTS.dark);
  await hand.tap(page.locator('#btnApplyLevels'));
  await goToStep(page, 'export', hand);
  const after = await saveByDownload(page, hand, 'No');
  const first = await logoAndPhotoColors(page, before.file, darkAt);
  const second = await logoAndPhotoColors(page, after.file, darkAt);
  await check('the white point on the dark background brightens the photo: that spot goes from '
    + 'dark grey to 245', () => {
    expectSameColor(first.photo, DARK_SPOT_COLOR, SPOT_TOLERANCE + 1);
    expectSameColor(second.photo, [WHITE_TARGET, WHITE_TARGET, WHITE_TARGET], SAVED_TOLERANCE);
  });
  await check('the logo\'s matte black, red P and white 1 are the same in both files, in the '
    + 'logo\'s own colors', () => {
    LOGO_PARTS.forEach((part, index) => {
      expectSameColor(second.logo[index], first.logo[index], SAVED_TOLERANCE);
      expectSameColor(second.logo[index], part.color, LOGO_TOLERANCE);
    });
  });
});

test('LEV-22.1 The instruction between Discard and Apply [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnLevels(page, testInfo);
  const hint = hintLine(page);
  await hint.evaluate(el => {
    window.testHintWrites = 0;
    new MutationObserver(changes => {
      window.testHintWrites += changes.filter(change => change.type === 'childList').length;
    }).observe(el, { childList: true, characterData: true, subtree: true });
  });
  const writes = () => page.evaluate(() => window.testHintWrites);
  await check('it reads "Pick white, or try Auto", is announced to screen readers and lets taps '
    + 'through', async () => {
    await expect(hint).toHaveText(HINTS.start);
    await expect(hint).toHaveAttribute('role', 'status');
    expect(await hint.evaluate(el => getComputedStyle(el).pointerEvents)).toBe('none');
  });
  await hand.tap(pickButton(page, 'white'));
  await check('with Pick white selected it reads "Tap something white"', async () => {
    await expect(hint).toHaveText(HINTS.white);
  });
  await hand.tap(pickButton(page, 'black'));
  await check('with Pick black selected it reads "Tap something black"', async () => {
    await expect(hint).toHaveText(HINTS.black);
  });
  await hand.tap(pickButton(page, 'black'));
  await hand.tap(page.locator('#toolAutoLevels'));
  await check('after Auto it reads "Hold the photo to compare"; it has been rewritten four times',
    async () => {
      await expect(hint).toHaveText(HINTS.compare);
      expect(await writes()).toBe(4);
    });
  await hand.tap(page.locator('#toolAutoLevels'));
  await check('Auto again leaves the words as they were, and they are not rewritten', async () => {
    await expect(hint).toHaveText(HINTS.compare);
    expect(await writes()).toBe(4);
  });
  await hand.tap(page.locator('#toolClearLevels'));
  await check('after Clear it reads "Pick white, or try Auto" again', async () => {
    await expect(hint).toHaveText(HINTS.start);
  });
});

// The three tips, word for word (LEVELS_TIPS in js/app/levels.js).
const LEVELS_TIPS = [
  'White: tap a grading label or the card’s white border; avoid foil and reflections. '
    + 'Black is optional.',
  'Auto estimates both from the framed image; colored backdrops can fool it, so check the '
    + 'result.',
  'Hold the photo to compare with no levels. Clear, then Apply, removes levels.',
];
const LEVELS_KEY_HELP = 'Hold C, or press and hold the photo, to compare.';

// The texts of the hints in the Levels sheet that can be seen, in order.
async function shownHints(page) {
  const hints = page.locator('#levelsSheet .sheet-hint');
  const texts = [];
  for (const hint of await hints.all()) {
    if (await hint.isVisible()) texts.push((await hint.textContent()).trim());
  }
  return texts;
}

test('LEV-23.1 The options sheet is the tips alone [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnLevels(page, testInfo);
  await openOptions(page, hand, 'levels');
  const sheet = page.locator('#levelsSheet');
  await check('the sheet is titled "Levels tips" and shows the three tips, nothing else',
    async () => {
      await expect(sheet.locator('.sheet-title')).toHaveText('Levels tips');
      expect(await shownHints(page)).toEqual(LEVELS_TIPS);
      await expect(sheet.locator('.sheet-row')).toHaveCount(0);
      await expect(sheet.locator('.switch')).toHaveCount(0);
      await expect(sheet.getByText('Tips and keys')).toBeHidden();
    });
});

test('LEV-23.2 On a wide screen the tips are followed by the keyboard help [desktop]', async ({
  page,
  check,
}, testInfo) => {
  await startOnLevels(page, testInfo);
  const sheet = page.locator('#levelsSheet');
  await check('the side panel shows "Levels tips" with the three tips, then "Tips and keys" '
    + 'with the keyboard help', async () => {
    await expect(sheet.locator('.sheet-title')).toBeVisible();
    await expect(sheet.locator('.sheet-title')).toHaveText('Levels tips');
    await expect(sheet.getByText('Tips and keys')).toBeVisible();
    expect(await shownHints(page)).toEqual([...LEVELS_TIPS, LEVELS_KEY_HELP]);
  });
});

test('LEV-24.1 Only Apply adds an undo step [phone]', async ({ page, check }, testInfo) => {
  const hand = await startOnLevels(page, testInfo);
  const undo = page.locator('#btnUndo');
  await pickSpot(page, hand, 'white', SPOTS.white);
  await pickSpot(page, hand, 'black', SPOTS.dark);
  await hand.tap(page.locator('#toolAutoLevels'));
  await hand.tap(page.locator('#toolClearLevels'));
  await hand.tap(page.locator('#toolAutoLevels'));
  const middle = await spotOnPage(page, [0.5, 0.5]);
  await holdPhoto(page, hand, middle);
  await releasePhoto(page, hand, middle);
  await hand.tap(page.locator('#btnDiscardLevels'));
  await check('after two picks, Auto, Clear, Auto, a comparison and Discard, Undo is still '
    + 'greyed out', async () => {
    await expect(undo).toBeDisabled();
  });
  await hand.tap(page.locator('#toolAutoLevels'));
  await hand.tap(page.locator('#btnApplyLevels'));
  await check('Apply lights Undo', async () => {
    await expect(undo).toBeEnabled();
  });
  await hand.tap(undo);
  await check('one Undo removes the levels and greys Undo out again', async () => {
    expect((await levelsNow(page)).applied).toBeNull();
    await expect(undo).toBeDisabled();
  });
});
