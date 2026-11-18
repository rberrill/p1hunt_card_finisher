// The Levels step's cases (tests/catalog/levels.md): Discard and Apply, the draft, the two picks
// and their color patches, aiming and the magnifier, how a pick samples the photo, picks that
// can't work, the pick marks, Auto, Clear, holding the photo to compare and its badge, leaving
// the step, Resume, where the picked points land in the saved file, the instruction, the tips
// and the undo steps.
// Each test drives the app as a person would, through hand.tap and hand.drag (a finger on the
// phone targets, the mouse on the wide ones), and reads the app's state only to check a result.
'use strict';
const { test, expect } = require('./support/case.js');
const {
  samplePath,
  goToStep,
  editState,
  openOptions,
  hasWhiteFill,
  waitForStill,
  readSavedImage,
} = require('./support/app.js');
const {
  middleColor,
  pinchAt,
  holdDragAt,
  releaseDrag,
  offsetBy,
  sendTouch,
} = require('./support/perspective.js');
const {
  toastNow,
  reloadToStart,
  resumeAs,
  rememberPhoto,
  waitForPhoto,
} = require('./support/start-and-session.js');
const {
  LEVELS_PHOTO,
  SPOTS,
  startOnLevels,
  spotOnPage,
  sourceOnPage,
  screenColorAt,
  photoPointAt,
  pickButton,
  armedPick,
  levelsDot,
  levelsNow,
  swatchColor,
  patchFill,
  isPatchEmpty,
  pickSpot,
  tapPoint,
  pressPhoto,
  releasePhoto,
  slideBy,
  holdPhoto,
  badgeShown,
  badgeBoxPixels,
  badgeBoxChange,
  pressThenTap,
  fileRegionColor,
  waitForSavedDraft,
  outputPointOf,
  viewNow,
  afterDraw,
  labelSurround,
  badgeFadeSeries,
} = require('./support/levels.js');
const { exportStep, downloadStep, answerNo } = require('./support/export.js');
const { fixturePath } = require('./support/edits-files.js');

// Another photo, a raw card on white, for the cases that open a second photo.
const SECOND_PHOTO = '14_front_portrait_raw_white.JPEG';
// A photo on which Auto finds no clear black: a landscape card in a labelled one-touch, on white.
const NO_BLACK_PHOTO = '13_front_landscape_onetouch_labeled_white.JPEG';
// Pictures from tests/fixtures/ (each described in its case):
//   SPECKLED_GREY  120 x 160 px, grey 100 with 4 pixels in every 10 white (255), in fine dots
//   SMALL_SQUARE   120 x 160 px, grey 100 with a white square 4 px a side, px 58 to 61 across and
//                  78 to 81 down
//   TWO_GREYS      400 x 560 px, the left half grey 128, the right half grey 32
//   PLAIN_WHITE    1200 x 1600 px, every pixel white (255)
const SPECKLED_GREY = 'levels-speckled-grey.png';
const SMALL_SQUARE = 'levels-small-white-square.png';
const TWO_GREYS = 'levels-two-greys.png';
const PLAIN_WHITE = 'plain-white.png';
// The grey the speckled and the small-square pictures are made of, and the white in them.
const FIXTURE_GREY = 100;
const FIXTURE_WHITE = 255;
// The middle of the small white square, in picture px.
const SQUARE_MIDDLE = [60, 80];
// The two greys of TWO_GREYS, and where each lands in the saved file once the white point is
// picked on the lighter one: 245 (the white target) and 70, worked out by hand from the sRGB
// formula (32 in linear light is 0.0144; times 0.9131 / 0.2159, the ratio of 245 to 128 in
// linear light, is 0.0611, which is 70 in sRGB). Scaling the stored values instead gives 61.
const LIGHT_GREY = 128;
const DARK_GREY = 32;
const DARK_GREY_LANDS = 70;
// The names the app gives the saved files.
const SAVED_NAME = 'IMG_9075-straight.jpg';
const TWO_GREYS_SAVED_NAME = 'levels-two-greys-straight.jpg';
// The question Download asks for these photos, whose crop is under 2000 px.
const UPSCALE_QUESTION = 'Upscale to 2000 px?';
// The four instructions between Discard and Apply (js/app/levels.js, LEVELS_HINTS).
const HINTS = {
  start: 'Pick white, or try Auto',
  white: 'Tap something white',
  black: 'Tap something black',
  compare: 'Hold the photo to compare',
};
// The pop-ups and warnings the cases expect, word for word.
const AUTO_FAILED = 'Couldn’t estimate levels from this image.';
const OUTSIDE_PHOTO = 'That spot is outside the photo.';
const TOO_LIGHT_FOR_BLACK = 'That spot is too light to be a black point. '
  + 'Pick something dark, or skip the black point.';
const DARKER_THAN_BLACK = 'That spot is darker than the black point. Pick something brighter.';
const BRIGHTER_THAN_WHITE = 'That spot is brighter than the white point. Pick something darker.';
// The colors of the two spots the picks use, measured once on IMG_9075.JPEG (0 to 255).
const WHITE_SPOT_COLOR = [225, 226, 217];
const DARK_SPOT_COLOR = [67, 65, 68];
// How close a color patch must be to a spot's measured color, per channel (0 to 255).
const SPOT_TOLERANCE = 3;
// A color patch filled with a near-white has every channel above this (0 to 255).
const NEAR_WHITE_MIN = 180;
// A mid grey: every channel between these (0 to 255), well away from both black and white.
const MID_GREY_MIN = 60;
const MID_GREY_MAX = 200;
// An outline round a pick mark's 12 px letter darkens far more device pixels than this around
// it; with no outline, the white letter on a white spot darkens none.
const LABEL_OUTLINE_PIXELS = 20;
// A 12 px bold letter covers far more device pixels than this.
const LABEL_LETTER_PIXELS = 20;
// Two drawings of the photo whose mean colors differ by less than this, per channel, are the
// same picture (0 to 255).
const SAME_COLOR_TOLERANCE = 1;
// Levels change the mean color of the middle of the photo by more than this in at least one
// channel (Auto on IMG_9075 changes it by several units).
const CHANGED_COLOR_MIN = 2;
// A white point picked on the card's dark background brightens the middle of the photo by more
// than this in every channel (0 to 255): "brightens strongly".
const STRONG_BRIGHTENING_MIN = 40;
// How far, in photo px, a recorded pick point may be from where the finger lifted (it is
// rounded to a whole px).
const PICK_POINT_TOLERANCE_PX = 2;
// The saved file's color at a pick point may differ from the target by this much per channel
// (JPEG at quality 0.92 and resampling), 0 to 255.
const SAVED_TOLERANCE = 4;
// The same for a flat fixture's saved halves, which JPEG keeps closer.
const FLAT_SAVED_TOLERANCE = 3;
// The patch of the saved file read around a point: radius in its px (a square 12 px a side).
const SAVED_PATCH_PX = 6;
// The dropper's patch radius in screen px (CONFIG.levels.sampleRadiusPx) and the least it
// covers on the photo, in photo px.
const SAMPLE_RADIUS_SCREEN_PX = 4;
const SAMPLE_RADIUS_MIN_PX = 4;
// How close the color patch's tooltip must be to the grey a fixture is made of, per channel:
// the app rounds to whole numbers.
const PICK_MATCH_TOLERANCE = 1;
// The plain mean of the speckled picture's 4 px patch holds its white dots: well above this.
const SPECKLED_PLAIN_MEAN_MIN = 150;
// A patch only as big as 4 screen px would hold nothing but the small square's white: above this.
const SQUARE_ONLY_WHITE_MIN = 250;
// The pixel color of the white target and the black target (CONFIG.levels.whiteTarget and
// blackTarget).
const WHITE_TARGET = 245;
const BLACK_TARGET = 8;
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
// The slide of LEV-16.4 and LEV-16.5: 60 px to the right, over half a second (16.4) or at once.
const SLIDE_PX = 60;
const SLOW_SLIDE_MS = 500;
// How far the photo may be from where it should be after a slide, in CSS px.
const PAN_TOLERANCE_PX = 1;
// A frame of the badge part-way through its fade is brighter than the frame before it began by
// more than FADE_STEP_MIN, and dimmer than this share of its full brightness (0 to 255).
const FADE_DIM_SHARE = 0.8;
const FADE_STEP_MIN = 20;
// The badge's white text changes far more device pixels of its box than this; with no badge,
// the box is as it was (BADGE_SAME_MAX at most, for antialiasing).
const BADGE_CHANGED_MIN = 100;
const BADGE_SAME_MAX = 5;

// The dropper's patch radius at a point of the page, in photo px: 4 screen px, measured on the
// photo, and never less than 4 photo px. Returns { center, radius, screenRadius }.
async function sampleRadiusAt(page, point) {
  const center = await photoPointAt(page, point);
  const edge = await photoPointAt(page, offsetBy(point, SAMPLE_RADIUS_SCREEN_PX, 0));
  const screenRadius = Math.hypot(edge[0] - center[0], edge[1] - center[1]);
  return { center, radius: Math.max(SAMPLE_RADIUS_MIN_PX, screenRadius), screenRadius };
}

// Expects two colors ([red, green, blue]) to match within `tolerance` per channel.
function expectSameColor(actual, expected, tolerance) {
  expect(actual).toHaveLength(3);
  actual.forEach((channel, index) => {
    expect(Math.abs(channel - expected[index])).toBeLessThanOrEqual(tolerance);
  });
}

// Expects a color to be a mid grey: every channel between MID_GREY_MIN and MID_GREY_MAX.
function expectMidGrey(color) {
  expect(color).toHaveLength(3);
  color.forEach(channel => {
    expect(channel).toBeGreaterThan(MID_GREY_MIN);
    expect(channel).toBeLessThan(MID_GREY_MAX);
  });
}

// The grey [value, value, value].
const grey = value => [value, value, value];

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

// Rests the mouse pointer on a color patch and returns its tooltip's text. which: 'white' or
// 'black'.
async function patchTooltip(page, which) {
  const patch = page.locator(which === 'white' ? '#swatchWhite' : '#swatchBlack');
  await patch.hover();
  return patch.getAttribute('title');
}

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
  await check('the photo changes; Discard is no longer greyed out; a white dot sits on the '
    + 'Levels tab', async () => {
    expect(colorDifference(await drawnColor(page), colorBefore)).toBeGreaterThan(
      CHANGED_COLOR_MIN,
    );
    await expect(discard).toBeEnabled();
    await expect(levelsDot(page)).toBeVisible();
  });
  await hand.tap(discard);
  await check('the photo looks as it did before Auto; both color patches are dashed and empty '
    + 'again; Discard and Apply are greyed out; the dot has gone; Undo is still greyed out',
  async () => {
    expect(colorDifference(await drawnColor(page), colorBefore)).toBeLessThanOrEqual(
      SAME_COLOR_TOLERANCE,
    );
    expect(await isPatchEmpty(page, 'white')).toBe(true);
    expect(await isPatchEmpty(page, 'black')).toBe(true);
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
  await check('the photo changes; Apply is no longer greyed out', async () => {
    expect(colorDifference(colorDraft, colorBefore)).toBeGreaterThan(CHANGED_COLOR_MIN);
    await expect(apply).toBeEnabled();
  });
  await hand.tap(apply);
  await check('the photo keeps Auto\'s look; Apply and Discard are greyed out; there is no dot '
    + 'on the Levels tab; Undo is no longer greyed out', async () => {
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
  await check('the photo looks as it did before Auto; Undo is greyed out again', async () => {
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
  await check('the Crop step shows the whole photo, with the row of crop sizes under it',
    async () => {
      await expect(page.locator('.preset-chip').first()).toBeVisible();
    });
  await goToStep(page, 'levels', hand);
  const levelsColor = await drawnColor(page);
  await check('the Levels step shows the photo framed by the crop; Apply is greyed out',
    async () => {
      await expect(page.locator('#btnApplyLevels')).toBeDisabled();
    });
  await hand.tap(page.locator('#toolAutoLevels'));
  const draftColor = await drawnColor(page);
  await check('the photo\'s colors change from row 2', () => {
    expect(colorDifference(draftColor, levelsColor)).toBeGreaterThan(CHANGED_COLOR_MIN);
  });
  await goToStep(page, 'crop', hand);
  await check('the photo looks as it did in row 1, without Auto\'s change; a white dot sits on '
    + 'the Levels tab', async () => {
    expect(colorDifference(await drawnColor(page), cropColor)).toBeLessThanOrEqual(
      SAME_COLOR_TOLERANCE,
    );
    await expect(levelsDot(page)).toBeVisible();
  });
  await goToStep(page, 'levels', hand);
  await check('the photo shows Auto\'s change again, as in row 3', async () => {
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
  const apply = page.locator('#btnApplyLevels');
  const discard = page.locator('#btnDiscardLevels');
  await hand.tap(page.locator('#toolAutoLevels'));
  await check('Apply is no longer greyed out; a white dot sits on the Levels tab', async () => {
    await expect(apply).toBeEnabled();
    await expect(levelsDot(page)).toBeVisible();
  });
  await hand.tap(apply);
  await check('Apply and Discard are greyed out; no dot on the Levels tab', async () => {
    await expect(apply).toBeDisabled();
    await expect(discard).toBeDisabled();
    await expect(levelsDot(page)).toBeHidden();
  });
  await hand.tap(page.locator('#toolAutoLevels'));
  await check('Auto sets the same points as before: Apply and Discard stay greyed out, and no '
    + 'dot shows', async () => {
    expect((await levelsNow(page)).isPending).toBe(false);
    await expect(apply).toBeDisabled();
    await expect(discard).toBeDisabled();
    await expect(levelsDot(page)).toBeHidden();
  });
});

test('LEV-05.1 Pick white arms the picker, and a second tap disarms it [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnLevels(page, testInfo);
  const pickWhite = pickButton(page, 'white');
  await hand.tap(pickWhite);
  await check('Pick white is selected (solid white); the line between Discard and Apply reads '
    + '"Tap something white"', async () => {
    await expect(pickWhite).toHaveAttribute('aria-pressed', 'true');
    expect(await hasWhiteFill(pickWhite)).toBe(true);
    await expect(hintLine(page)).toHaveText(HINTS.white);
  });
  await hand.tap(pickWhite);
  await check('Pick white is no longer white; the line reads "Pick white, or try Auto"',
    async () => {
      await expect(pickWhite).toHaveAttribute('aria-pressed', 'false');
      expect(await hasWhiteFill(pickWhite)).toBe(false);
      await expect(hintLine(page)).toHaveText(HINTS.start);
    });
});

test('LEV-05.2 Escape leaves Pick white armed [desktop]', async ({ page, check }, testInfo) => {
  const hand = await startOnLevels(page, testInfo);
  const pickWhite = pickButton(page, 'white');
  await hand.tap(pickWhite);
  await check('Pick white is selected; the line between Discard and Apply reads "Tap something '
    + 'white"', async () => {
    await expect(pickWhite).toHaveAttribute('aria-pressed', 'true');
    await expect(hintLine(page)).toHaveText(HINTS.white);
  });
  await page.keyboard.press('Escape');
  await check('Pick white is still selected and the line still reads "Tap something white"',
    async () => {
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
    await check('Pick black is selected (solid white); the line between Discard and Apply reads '
      + '"Tap something black"', async () => {
      await expect(pickBlack).toHaveAttribute('aria-pressed', 'true');
      expect(await hasWhiteFill(pickBlack)).toBe(true);
      await expect(hintLine(page)).toHaveText(HINTS.black);
    });
    await hand.tap(pickWhite);
    await check('Pick white is selected instead, Pick black is not; the line reads "Tap '
      + 'something white"', async () => {
      await expect(pickWhite).toHaveAttribute('aria-pressed', 'true');
      await expect(pickBlack).toHaveAttribute('aria-pressed', 'false');
      await expect(hintLine(page)).toHaveText(HINTS.white);
    });
    await hand.tap(pickBlack);
    await check('Pick black is selected, Pick white is not; the line reads "Tap something black"',
      async () => {
        await expect(pickBlack).toHaveAttribute('aria-pressed', 'true');
        await expect(pickWhite).toHaveAttribute('aria-pressed', 'false');
        await expect(hintLine(page)).toHaveText(HINTS.black);
      });
    await hand.tap(pickBlack);
    await check('neither is selected; the line reads "Pick white, or try Auto"', async () => {
      expect(await armedPick(page)).toBe('');
      await expect(hintLine(page)).toHaveText(HINTS.start);
    });
  });

test('LEV-07.1 The color patches read Not set, then the picked color [desktop]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnLevels(page, testInfo);
  await check('the color patch of Pick white is dashed and empty; its tooltip reads "Not set"',
    async () => {
      expect(await isPatchEmpty(page, 'white')).toBe(true);
      expect(await patchTooltip(page, 'white')).toBe('Not set');
    });
  await check('the color patch of Pick black is dashed and empty; its tooltip reads "Not set"',
    async () => {
      expect(await isPatchEmpty(page, 'black')).toBe(true);
      expect(await patchTooltip(page, 'black')).toBe('Not set');
    });
  await pickSpot(page, hand, 'white', SPOTS.white);
  await check('the color patch of Pick white is filled with that off-white', async () => {
    expectSameColor(await patchFill(page, 'white'), WHITE_SPOT_COLOR, SPOT_TOLERANCE);
  });
  await check('its tooltip reads "RGB" and three values, each within 3 of 225, 226, 217',
    async () => {
      expect(await patchTooltip(page, 'white')).toMatch(/^RGB \d+, \d+, \d+$/);
      expectSameColor(await swatchColor(page, 'white'), WHITE_SPOT_COLOR, SPOT_TOLERANCE);
    });
  await check('the tooltip of Pick black\'s color patch still reads "Not set"', async () => {
    expect(await patchTooltip(page, 'black')).toBe('Not set');
  });
  await pickSpot(page, hand, 'black', SPOTS.dark);
  await check('the color patch of Pick black is filled with that dark grey', async () => {
    expectSameColor(await patchFill(page, 'black'), DARK_SPOT_COLOR, SPOT_TOLERANCE);
  });
  await check('its tooltip reads "RGB" and three values, each within 3 of 67, 65, 68',
    async () => {
      expect(await patchTooltip(page, 'black')).toMatch(/^RGB \d+, \d+, \d+$/);
      expectSameColor(await swatchColor(page, 'black'), DARK_SPOT_COLOR, SPOT_TOLERANCE);
    });
});

test('LEV-08.1 The color is taken where the finger lifts, and the photo does not move [phone] '
  + '[webkit]', async ({ page, check }, testInfo) => {
  const hand = await startOnLevels(page, testInfo);
  await hand.tap(pickButton(page, 'white'));
  await check('Pick white is selected (solid white)', async () => {
    expect(await armedPick(page)).toBe('white');
    expect(await hasWhiteFill(pickButton(page, 'white'))).toBe(true);
  });
  const viewBefore = await viewNow(page);
  const start = await spotOnPage(page, SPOTS.white);
  const end = await spotOnPage(page, SPOTS.dark);
  await hand.drag(start, end);
  await check('the color patch is filled with the dark grey where the finger lifted, not the '
    + 'white where it pressed; the photo has not moved under the finger', async () => {
    expectSameColor(await patchFill(page, 'white'), DARK_SPOT_COLOR, SPOT_TOLERANCE);
    const { draft } = await levelsNow(page);
    const lifted = await photoPointAt(page, end);
    expect(Math.abs(draft.whiteAt[0] - lifted[0])).toBeLessThanOrEqual(PICK_POINT_TOLERANCE_PX);
    expect(Math.abs(draft.whiteAt[1] - lifted[1])).toBeLessThanOrEqual(PICK_POINT_TOLERANCE_PX);
    expect(await viewNow(page)).toEqual(viewBefore);
  });
});

test('LEV-08.2 A second finger cancels the pick and leaves the picker armed [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnLevels(page, testInfo);
  await hand.tap(pickButton(page, 'white'));
  await check('Pick white is selected; the line between Discard and Apply reads "Tap something '
    + 'white"', async () => {
    expect(await armedPick(page)).toBe('white');
    await expect(hintLine(page)).toHaveText(HINTS.white);
  });
  const first = await spotOnPage(page, SPOTS.white);
  const second = offsetBy(first, SECOND_FINGER_GAP_PX, 0);
  // Plain reads, not retrying expects: a pick fills the patch and disarms within the finger's
  // own event, so a pick taken by any of these four would show at once.
  await sendTouch(page, '#view', 'pointerdown', first, FIRST_FINGER);
  await check('the color patch is still dashed and empty, with one finger down', async () => {
    expect(await isPatchEmpty(page, 'white')).toBe(true);
  });
  await sendTouch(page, '#view', 'pointerdown', second, SECOND_FINGER);
  await check('the color patch is still dashed and empty, with the second finger down',
    async () => {
      expect(await isPatchEmpty(page, 'white')).toBe(true);
    });
  await sendTouch(page, '#view', 'pointerup', second, SECOND_FINGER);
  await check('the color patch is still dashed and empty, the second finger lifted', async () => {
    expect(await isPatchEmpty(page, 'white')).toBe(true);
  });
  await sendTouch(page, '#view', 'pointerup', first, FIRST_FINGER);
  await check('the color patch is still dashed and empty: no white point is set', async () => {
    expect(await isPatchEmpty(page, 'white')).toBe(true);
    expect(await swatchColor(page, 'white')).toBeNull();
  });
  await check('Pick white is still selected and the line still reads "Tap something white"',
    async () => {
      expect(await armedPick(page)).toBe('white');
      expect(await hintLine(page).textContent()).toBe(HINTS.white);
    });
});

// Presses on a spot with the white pick armed and moves a little without lifting, so the
// magnifier shows. Returns the point it stopped at, for releaseDrag.
async function aimAt(page, hand, spot) {
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
  await hand.tap(pickButton(page, 'white'));
  await check('Pick white is selected (solid white)', async () => {
    expect(await armedPick(page)).toBe('white');
  });
  const left = await aimAt(page, hand, SPOTS.white);
  await check.eye('a round magnifier in the top right corner of the photo area shows that spot 4 '
    + 'times larger, with a small white circle (the patch the pick reads) in its middle and a '
    + 'white rim');
  await releaseDrag(page, hand, left);
  await afterDraw(page);
  await check('the magnifier goes; the color patch at the left of Pick white is filled',
    async () => {
      expect(await patchFill(page, 'white')).not.toBeNull();
    });
  await hand.tap(pickButton(page, 'white'));
  await check('Pick white is selected', async () => {
    expect(await armedPick(page)).toBe('white');
  });
  const right = await aimAt(page, hand, SPOTS.whiteRight);
  await check.eye('the magnifier is in the top left corner of the photo area');
  await releaseDrag(page, hand, right);
  await afterDraw(page);
  await check.eye('the magnifier goes');
});

test('LEV-09.2 The picker\'s magnifier beside the mouse, for a person to judge [desktop]',
  async ({ page, check }, testInfo) => {
    const hand = await startOnLevels(page, testInfo);
    await hand.tap(pickButton(page, 'white'));
    await check('Pick white is selected (solid white)', async () => {
      expect(await armedPick(page)).toBe('white');
    });
    const point = await aimAt(page, hand, SPOTS.white);
    await check.eye('a round magnifier up and to the right of the pointer shows that spot 4 '
      + 'times larger, with a small white circle in its middle and a white rim');
    await releaseDrag(page, hand, point);
    await afterDraw(page);
    await check.eye('the magnifier goes');
  });

test('LEV-10.1 A pick reads the half of its patch nearest the middle brightness [desktop]',
  async ({ page, check }, testInfo) => {
    const hand = await startOnLevels(page, testInfo, { picture: SPECKLED_GREY });
    const point = await spotOnPage(page, [0.5, 0.5]);
    const { center, radius, screenRadius } = await sampleRadiusAt(page, point);
    // Read from the file itself, not by the app's rule: the least patch, 4 picture px each
    // way, holds white dots enough to lift its plain mean far above the grey, so a pick that
    // reads the grey alone has left them out.
    const plain = await fileRegionColor(page, fixturePath(SPECKLED_GREY), center, radius);
    await hand.tap(pickButton(page, 'white'));
    await check('Pick white is selected (solid white)', async () => {
      expect(await armedPick(page)).toBe('white');
    });
    await tapPoint(page, hand, point);
    await check('the color patch is filled with a mid grey', async () => {
      expectMidGrey(await patchFill(page, 'white'));
    });
    await check('its tooltip reads "RGB 100, 100, 100" (each value within 1): the white dots '
      + 'were left out', async () => {
      // The patch did hold white dots: 4 screen px is under 1 picture px, so the pick read its
      // least patch, and that patch's plain mean is far above grey 100.
      expect(screenRadius).toBeLessThan(1);
      plain.forEach(channel => expect(channel).toBeGreaterThan(SPECKLED_PLAIN_MEAN_MIN));
      expect(await patchTooltip(page, 'white')).toMatch(/^RGB \d+, \d+, \d+$/);
      expectSameColor(await swatchColor(page, 'white'), grey(FIXTURE_GREY),
        PICK_MATCH_TOLERANCE);
    });
  });

test('LEV-10.2 A pick reads at least 4 photo pixels around the point [desktop]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnLevels(page, testInfo, { picture: SMALL_SQUARE });
  const point = await sourceOnPage(page, SQUARE_MIDDLE);
  const { center, screenRadius } = await sampleRadiusAt(page, point);
  // Read from the file itself: a patch only 4 screen px each way would hold nothing but the
  // white square.
  const tooSmall = await fileRegionColor(page, fixturePath(SMALL_SQUARE), center, screenRadius);
  await hand.tap(pickButton(page, 'white'));
  await check('Pick white is selected (solid white)', async () => {
    expect(await armedPick(page)).toBe('white');
  });
  await tapPoint(page, hand, point);
  await check('the color patch is filled with a mid grey, not white', async () => {
    expectMidGrey(await patchFill(page, 'white'));
  });
  await check('its tooltip reads "RGB 100, 100, 100" (each value within 1)', async () => {
    // 4 screen px is under 1 picture px, and a patch that size holds only the white square: the
    // grey came from the least patch, 4 picture px each way.
    expect(screenRadius).toBeLessThan(1);
    tooSmall.forEach(channel => expect(channel).toBeGreaterThan(SQUARE_ONLY_WHITE_MIN));
    expect(await patchTooltip(page, 'white')).toMatch(/^RGB \d+, \d+, \d+$/);
    expectSameColor(await swatchColor(page, 'white'), grey(FIXTURE_GREY), PICK_MATCH_TOLERANCE);
  });
});

test('LEV-11.1 A pick that works sets the point, marks the spot and disarms [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnLevels(page, testInfo);
  const point = await spotOnPage(page, SPOTS.white);
  await hand.tap(pickButton(page, 'white'));
  await check('Pick white is selected (solid white)', async () => {
    expect(await armedPick(page)).toBe('white');
    expect(await hasWhiteFill(pickButton(page, 'white'))).toBe(true);
  });
  await tapPoint(page, hand, point);
  await check('the color patch at the left of Pick white is filled with the background\'s '
    + 'off-white', async () => {
    expectSameColor(await patchFill(page, 'white'), WHITE_SPOT_COLOR, SPOT_TOLERANCE);
  });
  await check('a small ring labelled W marks the spot tapped', async () => {
    const { draft } = await levelsNow(page);
    const tapped = await photoPointAt(page, point);
    expect(Math.abs(draft.whiteAt[0] - tapped[0])).toBeLessThanOrEqual(PICK_POINT_TOLERANCE_PX);
    expect(Math.abs(draft.whiteAt[1] - tapped[1])).toBeLessThanOrEqual(PICK_POINT_TOLERANCE_PX);
  });
  await check('neither pick is selected; the line reads "Hold the photo to compare"; Apply is '
    + 'no longer greyed out', async () => {
    expect(await armedPick(page)).toBe('');
    await expect(hintLine(page)).toHaveText(HINTS.compare);
    await expect(page.locator('#btnApplyLevels')).toBeEnabled();
  });
});

// Checks that a warning with `message` is up (one row), then that the `which` pick is still
// selected, the line still asks for it and its color patch is still dashed and empty (the next).
async function checkRefusedPick(page, check, which, message) {
  await check(`a warning reads "${message}"`, async () => {
    const toast = await toastNow(page);
    expect(toast).toEqual({ text: message, kind: 'warn', isShown: true });
  });
  await check(`Pick ${which} is still selected, the line still reads "${HINTS[which]}", and the `
    + 'color patch is still dashed and empty', async () => {
    expect(await armedPick(page)).toBe(which);
    await expect(hintLine(page)).toHaveText(HINTS[which]);
    expect(await isPatchEmpty(page, which)).toBe(true);
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
  const outside = { x: box.x + EDGE_INSET_PX, y: middle.y };
  await check('the photo moves 200 px right; the empty area past its left edge shows at the '
    + 'left of the photo area', async () => {
    const view = await viewNow(page);
    expect(Math.abs(view.panX - viewBefore.panX - PAN_PX)).toBeLessThan(1);
    expect((await photoPointAt(page, outside))[0]).toBeLessThan(0);
  });
  await hand.tap(pickButton(page, 'white'));
  await check('Pick white is selected (solid white)', async () => {
    expect(await armedPick(page)).toBe('white');
  });
  await tapPoint(page, hand, outside);
  await checkRefusedPick(page, check, 'white', OUTSIDE_PHOTO);
});

test('LEV-12.2 A black pick on something light warns and stays armed [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnLevels(page, testInfo);
  await pickSpot(page, hand, 'black', SPOTS.white);
  await checkRefusedPick(page, check, 'black', TOO_LIGHT_FOR_BLACK);
});

test('LEV-12.3 A white pick no brighter than the black point warns and stays armed [phone]',
  async ({ page, check }, testInfo) => {
    const hand = await startOnLevels(page, testInfo);
    await pickSpot(page, hand, 'black', SPOTS.dark);
    await check('the color patch of Pick black is filled with that dark grey', async () => {
      expectSameColor(await patchFill(page, 'black'), DARK_SPOT_COLOR, SPOT_TOLERANCE);
    });
    await pickSpot(page, hand, 'white', SPOTS.dark);
    await checkRefusedPick(page, check, 'white', DARKER_THAN_BLACK);
  });

test('LEV-12.4 A black pick no darker than the white point warns and stays armed [phone]',
  async ({ page, check }, testInfo) => {
    const hand = await startOnLevels(page, testInfo);
    await pickSpot(page, hand, 'white', SPOTS.dark);
    await check('the color patch of Pick white is filled with that dark grey', async () => {
      expectSameColor(await patchFill(page, 'white'), DARK_SPOT_COLOR, SPOT_TOLERANCE);
    });
    await pickSpot(page, hand, 'black', SPOTS.dark);
    await checkRefusedPick(page, check, 'black', BRIGHTER_THAN_WHITE);
  });

test('LEV-12.5 A tap on the empty area below the picture is ignored and the pick stays armed '
  + '[phone]', async ({ page, check }, testInfo) => {
  const hand = await startOnLevels(page, testInfo);
  const bottomLeft = await spotOnPage(page, [0, 1]);
  const topRight = await spotOnPage(page, [1, 0]);
  const below = { x: (bottomLeft.x + topRight.x) / 2, y: bottomLeft.y + BELOW_PICTURE_PX };
  const hidden = await photoPointAt(page, below);
  const { width, height } = (await editState(page)).source;
  await hand.tap(pickButton(page, 'white'));
  await check(`Pick white is selected and the line between Discard and Apply reads `
    + `"${HINTS.white}"`, async () => {
    expect(await armedPick(page)).toBe('white');
    await expect(hintLine(page)).toHaveText(HINTS.white);
  });
  await tapPoint(page, hand, below);
  // Plain reads, not retrying expects: a pick fills the patch, and a refused one shows its
  // warning, within the tap's own event, so either would show at once.
  await check('the color patch at the left of Pick white is still dashed and empty, and no '
    + 'warning shows', async () => {
    // The point tapped is on the photo, in the part the step hides.
    expect(hidden[0]).toBeGreaterThan(0);
    expect(hidden[0]).toBeLessThan(width);
    expect(hidden[1]).toBeGreaterThan(0);
    expect(hidden[1]).toBeLessThan(height);
    expect(await isPatchEmpty(page, 'white')).toBe(true);
    expect(await swatchColor(page, 'white')).toBeNull();
    expect((await toastNow(page)).isShown).toBe(false);
  });
  await check(`Pick white is still selected and the line still reads "${HINTS.white}"`,
    async () => {
      expect(await armedPick(page)).toBe('white');
      expect(await hintLine(page).textContent()).toBe(HINTS.white);
    });
});

test('LEV-13.1 The pick marks, for a person to judge [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnLevels(page, testInfo);
  await pickSpot(page, hand, 'white', SPOTS.white);
  await check('the color patch of Pick white is filled', async () => {
    expect(await patchFill(page, 'white')).not.toBeNull();
  });
  await pickSpot(page, hand, 'black', SPOTS.dark);
  await waitForStill(page);
  await check.eye('a small black and white ring labelled W sits on the white background left of '
    + 'the slab, and one labelled B on the card\'s dark background; each letter is white with a '
    + 'dark outline round it, and the W can be read easily on the white background (ruling R39; '
    + 'until it is built this fails by eye, BUG-231)');
  const middle = await spotOnPage(page, [0.5, 0.5]);
  await holdPhoto(page, hand, middle);
  await check.eye('the picture shows without levels, the Before levels badge at its top left, '
    + 'and no W or B ring');
  await releasePhoto(page, hand, middle);
  await afterDraw(page);
  await check.eye('the levels show again, with the W and B rings');
  await hand.tap(page.locator('#toolAutoLevels'));
  await afterDraw(page);
  await check.eye('no W or B ring on the photo');
});

test('LEV-13.2 The W on a white spot has a dark outline [phone]', async ({
  page,
  check,
}, testInfo) => {
  test.fail(true, 'BUG-231');
  const hand = await startOnLevels(page, testInfo);
  await pickSpot(page, hand, 'white', SPOTS.white);
  await check('the color patch of Pick white is filled with the background\'s white (within 3 '
    + 'of 225, 226, 217)', async () => {
    expectSameColor(await patchFill(page, 'white'), WHITE_SPOT_COLOR, SPOT_TOLERANCE);
  });
  await pickSpot(page, hand, 'black', SPOTS.dark);
  await check('the color patch of Pick black is filled with that dark grey (within 3 of 67, 65, '
    + '68)', async () => {
    expectSameColor(await patchFill(page, 'black'), DARK_SPOT_COLOR, SPOT_TOLERANCE);
  });
  await waitForStill(page);
  await afterDraw(page);
  // The B's white letter on the dark spot shows the box the script reads is where a mark's
  // letter is drawn, so that no dark pixel around the W means no outline, not a missed letter.
  const besideB = await labelSurround(page, 'black');
  await check(`the B's white letter is there: at least ${LABEL_LETTER_PIXELS} device pixels `
    + 'brighter than 200', () => {
    expect(besideB.brightPixels).toBeGreaterThanOrEqual(LABEL_LETTER_PIXELS);
  });
  const besideW = await labelSurround(page, 'white');
  await check(`dark pixels outline the white W: at least ${LABEL_OUTLINE_PIXELS} device pixels `
    + 'around the letter are darker than a brightness of 96', () => {
    expect(besideW.darkPixels).toBeGreaterThanOrEqual(LABEL_OUTLINE_PIXELS);
  });
});

test('LEV-14.1 Auto sets both points and removes the pick marks [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnLevels(page, testInfo);
  await hand.tap(pickButton(page, 'white'));
  await check('no pop-up', async () => {
    expect((await toastNow(page)).isShown).toBe(false);
  });
  await tapPoint(page, hand, await spotOnPage(page, SPOTS.white));
  await check('the color patch of Pick white is filled and a W ring marks the spot', async () => {
    expect(await patchFill(page, 'white')).not.toBeNull();
    expect((await levelsNow(page)).draft.whiteAt).not.toBeNull();
  });
  await hand.tap(page.locator('#toolAutoLevels'));
  await check('both color patches are filled', async () => {
    await expect.poll(() => patchFill(page, 'black')).not.toBeNull();
    expect(await patchFill(page, 'white')).not.toBeNull();
  });
  await check('Apply is no longer greyed out; the W ring has gone', async () => {
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
  await check('the color patch of Pick white is filled', async () => {
    await expect.poll(() => patchFill(page, 'white')).not.toBeNull();
  });
  await check('the color patch of Pick black is still dashed and empty', async () => {
    expect(await isPatchEmpty(page, 'black')).toBe(true);
  });
});

test('LEV-14.3 Auto on a picture with nothing to go on warns, with no next step [phone]',
  async ({ page, check }, testInfo) => {
    const hand = await startOnLevels(page, testInfo, { picture: PLAIN_WHITE });
    await hand.tap(page.locator('#toolAutoLevels'));
    await check(`a warning reads "${AUTO_FAILED}"`, async () => {
      expect(await toastNow(page)).toEqual({ text: AUTO_FAILED, kind: 'warn', isShown: true });
    });
    await check('both color patches are still dashed and empty; Apply is greyed out',
      async () => {
        expect(await isPatchEmpty(page, 'white')).toBe(true);
        expect(await isPatchEmpty(page, 'black')).toBe(true);
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
  await check('Clear is no longer greyed out', async () => {
    await expect(clear).toBeEnabled();
  });
  await hand.tap(pickButton(page, 'white'));
  await check('Pick white is selected (solid white)', async () => {
    expect(await armedPick(page)).toBe('white');
    expect(await hasWhiteFill(pickButton(page, 'white'))).toBe(true);
  });
  await hand.tap(clear);
  await check('both color patches are dashed and empty; neither pick is selected; the photo '
    + 'looks as it did before Auto; Clear and Apply are greyed out', async () => {
    expect(await isPatchEmpty(page, 'white')).toBe(true);
    expect(await isPatchEmpty(page, 'black')).toBe(true);
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
  const apply = page.locator('#btnApplyLevels');
  const colorBefore = await drawnColor(page);
  await hand.tap(page.locator('#toolAutoLevels'));
  const colorAuto = await drawnColor(page);
  await check('the photo changes', () => {
    expect(colorDifference(colorAuto, colorBefore)).toBeGreaterThan(CHANGED_COLOR_MIN);
  });
  await hand.tap(apply);
  const applied = (await levelsNow(page)).applied;
  await check('the photo keeps Auto\'s look; Apply is greyed out', async () => {
    expect(colorDifference(await drawnColor(page), colorAuto)).toBeLessThanOrEqual(
      SAME_COLOR_TOLERANCE,
    );
    await expect(apply).toBeDisabled();
  });
  await hand.tap(page.locator('#toolClearLevels'));
  await check('the photo shows without levels; Apply is no longer greyed out', async () => {
    expect(colorDifference(await drawnColor(page), colorBefore)).toBeLessThanOrEqual(
      SAME_COLOR_TOLERANCE,
    );
    await expect(apply).toBeEnabled();
    expect((await levelsNow(page)).applied).toEqual(applied);
  });
  await hand.tap(apply);
  await check('the photo stays without levels; Apply is greyed out', async () => {
    expect(colorDifference(await drawnColor(page), colorBefore)).toBeLessThanOrEqual(
      SAME_COLOR_TOLERANCE,
    );
    expect((await levelsNow(page)).applied).toBeNull();
    await expect(apply).toBeDisabled();
  });
  await hand.tap(page.locator('#btnUndo'));
  await check('Auto\'s levels are back on the photo', async () => {
    expect((await levelsNow(page)).applied).toEqual(applied);
    expect(colorDifference(await drawnColor(page), colorAuto)).toBeLessThanOrEqual(
      SAME_COLOR_TOLERANCE,
    );
  });
});

// Taps Auto (the first row of several LEV-16 and LEV-17 cases) and checks that the photo
// changes. Returns the colors of the middle of the photo before and after: { none, auto }.
async function autoChangesPhoto(page, hand, check) {
  const none = await drawnColor(page);
  await hand.tap(page.locator('#toolAutoLevels'));
  const auto = await drawnColor(page);
  await check('the photo changes', () => {
    expect(colorDifference(auto, none)).toBeGreaterThan(CHANGED_COLOR_MIN);
  });
  return { none, auto };
}

test('LEV-16.1 Holding the photo shows it with no levels until it is let go [phone] [webkit]',
  async ({ page, check }, testInfo) => {
    const hand = await startOnLevels(page, testInfo);
    const colors = await autoChangesPhoto(page, hand, check);
    const viewBefore = await viewNow(page);
    const middle = await spotOnPage(page, [0.5, 0.5]);
    await holdPhoto(page, hand, middle);
    await check('after a quarter of a second the photo looks as it did before Auto', async () => {
      expect((await levelsNow(page)).isComparing).toBe(true);
      expect(colorDifference(await drawnColor(page), colors.none)).toBeLessThanOrEqual(
        SAME_COLOR_TOLERANCE,
      );
    });
    await releasePhoto(page, hand, middle);
    await check('Auto\'s change is back; the photo has not moved', async () => {
      expect((await levelsNow(page)).isComparing).toBe(false);
      expect(colorDifference(await drawnColor(page), colors.auto)).toBeLessThanOrEqual(
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
  await afterDraw(page);
  // Plain reads, not retrying expects, so the known defect fails fast.
  await check('there is no comparison: no Before levels badge at the top left of the photo area',
    async () => {
      expect(await badgeShown(page)).toBe(false);
    });
  await releasePhoto(page, hand, middle);
  await afterDraw(page);
  await check('nothing changes: still no badge', async () => {
    expect(await badgeShown(page)).toBe(false);
  });
});

test('LEV-16.3 A press that showed the comparison is not also a tap [phone]', async ({
  page,
  check,
}, testInfo) => {
  test.fail(true, 'BUG-103');
  const hand = await startOnLevels(page, testInfo);
  await autoChangesPhoto(page, hand, check);
  const box = await page.locator('#view').boundingBox();
  const middle = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  const fitted = await viewNow(page);
  await pinchAt(page, middle, PINCH_START_GAP_PX, PINCH_END_GAP_PX);
  const zoomed = await viewNow(page);
  await check('the photo zooms in; Fit shows in the top bar', async () => {
    expect(zoomed.zoom).toBeGreaterThan(fitted.zoom * PINCH_ZOOM_MIN);
    await expect(page.locator('#btnFit')).toBeVisible();
  });
  const press = await pressThenTap(page, middle);
  await check('the comparison showed (the Before levels badge), and the press lasted under 0.3 '
    + 'seconds', () => {
    expect(press.isCompared).toBe(true);
    expect(press.holdMs).toBeLessThan(TAP_MS);
  });
  await check('the photo stays zoomed in: the press and the tap were not a double tap',
    async () => {
      expect((await viewNow(page)).zoom).toBe(zoomed.zoom);
    });
});

test('LEV-16.4 A press that moves pans the photo and shows no comparison [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnLevels(page, testInfo);
  await autoChangesPhoto(page, hand, check);
  const viewBefore = await viewNow(page);
  const middle = await spotOnPage(page, [0.5, 0.5]);
  const seen = [];
  await pressPhoto(page, hand, middle);
  const end = await slideBy(page, hand, middle, SLIDE_PX, SLOW_SLIDE_MS, async () => {
    await afterDraw(page);
    seen.push({
      panX: (await viewNow(page)).panX,
      isComparing: (await levelsNow(page)).isComparing,
      hasBadge: await badgeShown(page),
    });
  });
  await check('the photo follows the finger to the right; it keeps Auto\'s look all the way, '
    + 'with no Before levels badge', async () => {
    const panSteps = seen.map(step => step.panX);
    expect(panSteps[panSteps.length - 1]).toBeGreaterThan(panSteps[0]);
    expect(seen.every(step => !step.isComparing && !step.hasBadge)).toBe(true);
  });
  await releasePhoto(page, hand, end);
  await check('the photo stays 60 px to the right, with Auto\'s look', async () => {
    const view = await viewNow(page);
    expect(Math.abs(view.panX - viewBefore.panX - SLIDE_PX)).toBeLessThan(PAN_TOLERANCE_PX);
    expect((await levelsNow(page)).isComparing).toBe(false);
    expect(await badgeShown(page)).toBe(false);
  });
});

test('LEV-16.5 Moving the finger during the comparison does not pan [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnLevels(page, testInfo);
  const colors = await autoChangesPhoto(page, hand, check);
  const viewBefore = await viewNow(page);
  const middle = await spotOnPage(page, [0.5, 0.5]);
  await holdPhoto(page, hand, middle);
  await check('the photo looks as it did before Auto, with the Before levels badge at the top '
    + 'left of the photo area', async () => {
    expect(colorDifference(await drawnColor(page), colors.none)).toBeLessThanOrEqual(
      SAME_COLOR_TOLERANCE,
    );
    expect(await badgeShown(page)).toBe(true);
  });
  const end = await slideBy(page, hand, middle, SLIDE_PX, 0);
  await check('the photo does not move; the comparison stays', async () => {
    expect(await viewNow(page)).toEqual(viewBefore);
    await afterDraw(page);
    expect(await badgeShown(page)).toBe(true);
    expect((await levelsNow(page)).isComparing).toBe(true);
  });
  await releasePhoto(page, hand, end);
  await check('Auto\'s change is back; the photo is where it was before row 2', async () => {
    expect(colorDifference(await drawnColor(page), colors.auto)).toBeLessThanOrEqual(
      SAME_COLOR_TOLERANCE,
    );
    expect(await viewNow(page)).toEqual(viewBefore);
  });
});

test('LEV-17.1 The Before levels badge, for a person to judge [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnLevels(page, testInfo);
  await autoChangesPhoto(page, hand, check);
  const middle = await spotOnPage(page, [0.5, 0.5]);
  await holdPhoto(page, hand, middle);
  await page.waitForTimeout(150);
  await check('while held, a badge is drawn at the top left of the photo area', async () => {
    expect(await badgeShown(page)).toBe(true);
  });
  await check.eye('a dark badge at the top left of the photo area reads "Before levels" in '
    + 'white');
  await releasePhoto(page, hand, middle);
  await check('the badge goes', async () => {
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
  await autoChangesPhoto(page, hand, check);
  const middle = await spotOnPage(page, [0.5, 0.5]);
  const fading = badgeFadeSeries(page);
  await pressPhoto(page, hand, middle);
  const series = await fading;
  await releasePhoto(page, hand, middle);
  await check('the Before levels badge fades in: in at least one frame its text is part-way '
    + 'between nothing and full white', () => {
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
  await check('no Before levels badge at the top left of the photo area', () => {
    expect(isShown).toBe(false);
  });
});

test('LEV-18.1 Leaving the step disarms the picker and keeps the unapplied changes [phone]',
  async ({ page, check }, testInfo) => {
    const hand = await startOnLevels(page, testInfo);
    await hand.tap(page.locator('#toolAutoLevels'));
    const draft = (await levelsNow(page)).draft;
    const autoFills = [await patchFill(page, 'white'), await patchFill(page, 'black')];
    await check('both color patches are filled', () => {
      expect(autoFills[0]).not.toBeNull();
      expect(autoFills[1]).not.toBeNull();
    });
    await hand.tap(pickButton(page, 'white'));
    await check('Pick white is selected (solid white)', async () => {
      expect(await armedPick(page)).toBe('white');
      expect(await hasWhiteFill(pickButton(page, 'white'))).toBe(true);
    });
    await goToStep(page, 'crop', hand);
    await check('the Crop step shows; a white dot sits on the Levels tab', async () => {
      await expect(page.locator('.preset-chip').first()).toBeVisible();
      await expect(levelsDot(page)).toBeVisible();
    });
    await goToStep(page, 'levels', hand);
    await check('neither pick is selected; the line between Discard and Apply reads "Hold the '
      + 'photo to compare"; Apply is not greyed out; both color patches still show Auto\'s points',
    async () => {
      expect(await armedPick(page)).toBe('');
      await expect(hintLine(page)).toHaveText(HINTS.compare);
      await expect(page.locator('#btnApplyLevels')).toBeEnabled();
      expect(await patchFill(page, 'white')).toEqual(autoFills[0]);
      expect(await patchFill(page, 'black')).toEqual(autoFills[1]);
      expect((await levelsNow(page)).draft).toEqual(draft);
    });
  });

test('LEV-18.2 Leaving the step ends a comparison [desktop]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnLevels(page, testInfo);
  // On a wide screen the badge's box can hold part of the picture, so the badge is told by how
  // the box differs from a reading with no badge on the same step.
  await goToStep(page, 'crop', hand);
  await afterDraw(page);
  const cropBox = await badgeBoxPixels(page);
  await goToStep(page, 'levels', hand);
  const colors = await autoChangesPhoto(page, hand, check);
  await afterDraw(page);
  const levelsBox = await badgeBoxPixels(page);
  await page.keyboard.down('c');
  await check('the photo shows without levels, with the Before levels badge', async () => {
    await page.waitForFunction(() => window.__straightener.app.compare);
    await afterDraw(page);
    expect(colorDifference(await middleColor(page), colors.none)).toBeLessThanOrEqual(
      SAME_COLOR_TOLERANCE,
    );
    expect(badgeBoxChange(await badgeBoxPixels(page), levelsBox)).toBeGreaterThan(
      BADGE_CHANGED_MIN,
    );
  });
  await page.keyboard.press('3');
  await check('the Crop step shows, with no Before levels badge', async () => {
    await page.waitForFunction(() => window.__straightener.app.tab === 'crop');
    await afterDraw(page);
    expect(badgeBoxChange(await badgeBoxPixels(page), cropBox)).toBeLessThanOrEqual(
      BADGE_SAME_MAX,
    );
  });
  await page.keyboard.press('4');
  await check('the Levels step shows the photo with Auto\'s levels, with no Before levels badge',
    async () => {
      await page.waitForFunction(() => window.__straightener.app.tab === 'levels');
      await afterDraw(page);
      expect(colorDifference(await middleColor(page), colors.auto)).toBeLessThanOrEqual(
        SAME_COLOR_TOLERANCE,
      );
      expect(badgeBoxChange(await badgeBoxPixels(page), levelsBox)).toBeLessThanOrEqual(
        BADGE_SAME_MAX,
      );
    });
  await page.keyboard.up('c');
  await afterDraw(page);
  await check('nothing changes: Auto\'s levels still show, with no badge', async () => {
    expect(colorDifference(await middleColor(page), colors.auto)).toBeLessThanOrEqual(
      SAME_COLOR_TOLERANCE,
    );
    expect(badgeBoxChange(await badgeBoxPixels(page), levelsBox)).toBeLessThanOrEqual(
      BADGE_SAME_MAX,
    );
  });
});

test('LEV-19.1 A newly opened photo has no levels [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnLevels(page, testInfo);
  const colorBefore = await drawnColor(page);
  await hand.tap(page.locator('#toolAutoLevels'));
  await check('the photo changes; a white dot sits on the Levels tab', async () => {
    expect(colorDifference(await drawnColor(page), colorBefore)).toBeGreaterThan(
      CHANGED_COLOR_MIN,
    );
    await expect(levelsDot(page)).toBeVisible();
  });
  await hand.tap(page.locator('#btnApplyLevels'));
  await check('Apply is greyed out; the dot has gone', async () => {
    await expect(page.locator('#btnApplyLevels')).toBeDisabled();
    await expect(levelsDot(page)).toBeHidden();
    expect((await levelsNow(page)).applied).not.toBeNull();
  });
  await rememberPhoto(page);
  const choosing = page.waitForEvent('filechooser');
  await hand.tap(page.locator('#btnOpen'));
  const chooser = await choosing;
  await check('the photo picker opens', () => {
    expect(chooser.page()).toBe(page);
  });
  await chooser.setFiles(samplePath(SECOND_PHOTO));
  await waitForPhoto(page, SECOND_PHOTO);
  await check('the new photo opens on the Perspective step', async () => {
    expect((await editState(page)).source.name).toBe(SECOND_PHOTO);
    expect(await page.evaluate(() => window.__straightener.app.tab)).toBe('perspective');
  });
  await goToStep(page, 'levels', hand);
  await check('both color patches are dashed and empty; Apply, Discard and Clear are greyed out; '
    + 'there is no dot on the Levels tab', async () => {
    expect((await levelsNow(page)).applied).toBeNull();
    expect(await isPatchEmpty(page, 'white')).toBe(true);
    expect(await isPatchEmpty(page, 'black')).toBe(true);
    await expect(page.locator('#btnApplyLevels')).toBeDisabled();
    await expect(page.locator('#btnDiscardLevels')).toBeDisabled();
    await expect(page.locator('#toolClearLevels')).toBeDisabled();
    await expect(levelsDot(page)).toBeHidden();
  });
});

test('LEV-20.1 Resume brings back unapplied changes on top of applied levels [phone] [webkit]',
  async ({ page, check }, testInfo) => {
    const hand = await startOnLevels(page, testInfo);
    const apply = page.locator('#btnApplyLevels');
    const colorNone = await drawnColor(page);
    await hand.tap(page.locator('#toolAutoLevels'));
    const autoWhite = await patchFill(page, 'white');
    await check('the photo changes; the color patch is filled with a near-white; a white dot '
      + 'sits on the Levels tab', async () => {
      expect(colorDifference(await drawnColor(page), colorNone)).toBeGreaterThan(
        CHANGED_COLOR_MIN,
      );
      autoWhite.forEach(channel => expect(channel).toBeGreaterThan(NEAR_WHITE_MIN));
      await expect(levelsDot(page)).toBeVisible();
    });
    await hand.tap(apply);
    const colorApplied = await drawnColor(page);
    await check('the dot on the Levels tab has gone; Apply is greyed out', async () => {
      await expect(levelsDot(page)).toBeHidden();
      await expect(apply).toBeDisabled();
    });
    await pickSpot(page, hand, 'white', SPOTS.dark);
    const colorPicked = await drawnColor(page);
    await check('the whole photo brightens strongly; the color patch shows that dark grey; Apply '
      + 'is no longer greyed out; the dot is back', async () => {
      colorPicked.forEach((channel, index) => {
        expect(channel - colorApplied[index]).toBeGreaterThan(STRONG_BRIGHTENING_MIN);
      });
      expectSameColor(await patchFill(page, 'white'), DARK_SPOT_COLOR, SPOT_TOLERANCE);
      await expect(apply).toBeEnabled();
      await expect(levelsDot(page)).toBeVisible();
    });
    // The stand-in for "two seconds or more": wait until the pick itself has been saved.
    await waitForSavedDraft(page);
    await reloadToStart(page);
    await check(`a box offers "Resume ${LEVELS_PHOTO}?"`, async () => {
      await expect(page.locator('.resume-name')).toHaveText(`Resume ${LEVELS_PHOTO}?`);
    });
    await resumeAs(page, hand, LEVELS_PHOTO);
    await check('the photo opens on the Levels step, brightened strongly as in row 3, with the '
      + 'dark grey in the color patch, Apply not greyed out and the dot on the Levels tab',
    async () => {
      expect(await page.evaluate(() => window.__straightener.app.tab)).toBe('levels');
      expect(colorDifference(await drawnColor(page), colorPicked)).toBeLessThanOrEqual(
        SAME_COLOR_TOLERANCE,
      );
      expectSameColor(await patchFill(page, 'white'), DARK_SPOT_COLOR, SPOT_TOLERANCE);
      await expect(apply).toBeEnabled();
      await expect(levelsDot(page)).toBeVisible();
    });
    await hand.tap(page.locator('#btnDiscardLevels'));
    await check('the photo is no longer brightened; the color patch shows the near-white of row '
      + '1 again; Apply is greyed out and the dot has gone', async () => {
      expect(colorDifference(await drawnColor(page), colorApplied)).toBeLessThanOrEqual(
        SAME_COLOR_TOLERANCE,
      );
      expect(await patchFill(page, 'white')).toEqual(autoWhite);
      await expect(apply).toBeDisabled();
      await expect(levelsDot(page)).toBeHidden();
    });
    await check('Clear is not greyed out: Auto\'s levels, applied in row 2, came back too',
      async () => {
        await expect(page.locator('#toolClearLevels')).toBeEnabled();
        expect((await levelsNow(page)).applied).not.toBeNull();
      });
  });

test('LEV-21.1 In the saved file the picked white is 245 and the picked black 8 [phone] '
  + '[webkit]', async ({ page, check }, testInfo) => {
  const hand = await startOnLevels(page, testInfo);
  await pickSpot(page, hand, 'white', SPOTS.white);
  await check('the color patch of Pick white is filled', async () => {
    expect(await patchFill(page, 'white')).not.toBeNull();
  });
  await pickSpot(page, hand, 'black', SPOTS.dark);
  await check('the color patch of Pick black is filled', async () => {
    expect(await patchFill(page, 'black')).not.toBeNull();
  });
  await hand.tap(page.locator('#btnApplyLevels'));
  await check('Apply is greyed out; there is no dot on the Levels tab', async () => {
    await expect(page.locator('#btnApplyLevels')).toBeDisabled();
    await expect(levelsDot(page)).toBeHidden();
  });
  const { applied } = await levelsNow(page);
  const whiteAt = await outputPointOf(page, applied.whiteAt);
  const blackAt = await outputPointOf(page, applied.blackAt);
  await exportStep(page, hand, check, 'the Export step shows, with Download');
  const asked = await downloadStep(page, hand, check, `a question box asks "${UPSCALE_QUESTION}"`);
  const saved = await answerNo(page, hand, asked);
  await check(`a file named ${SAVED_NAME} is saved`, () => {
    expect(saved.name).toBe(SAVED_NAME);
  });
  const savedWhite = await fileRegionColor(page, saved.file, whiteAt, SAVED_PATCH_PX);
  const savedBlack = await fileRegionColor(page, saved.file, blackAt, SAVED_PATCH_PX);
  await check('where the white was picked: 245, 245, 245, each within 4', () => {
    expectSameColor(savedWhite, grey(WHITE_TARGET), SAVED_TOLERANCE);
  });
  await check('where the black was picked: 8, 8, 8, each within 4', () => {
    expectSameColor(savedBlack, grey(BLACK_TARGET), SAVED_TOLERANCE);
  });
});

test('LEV-21.3 A grey between the points lands where linear light puts it [phone] [webkit]',
  async ({ page, check }, testInfo) => {
    const hand = await startOnLevels(page, testInfo, { picture: TWO_GREYS });
    const leftMiddle = await spotOnPage(page, [0.25, 0.5]);
    const rightMiddle = await spotOnPage(page, [0.75, 0.5]);
    const rightBefore = await screenColorAt(page, rightMiddle);
    await pickSpot(page, hand, 'white', [0.25, 0.5]);
    await afterDraw(page);
    await check('the color patch of Pick white is filled with a mid grey; the left half turns '
      + 'near-white and the right half lightens to a dark grey', async () => {
      expectSameColor(await swatchColor(page, 'white'), grey(LIGHT_GREY), PICK_MATCH_TOLERANCE);
      expectMidGrey(await patchFill(page, 'white'));
      const left = await screenColorAt(page, leftMiddle);
      const right = await screenColorAt(page, rightMiddle);
      left.forEach(channel => expect(channel).toBeGreaterThan(WHITE_TARGET - SAVED_TOLERANCE));
      right.forEach((channel, index) => {
        expect(channel).toBeGreaterThan(rightBefore[index] + CHANGED_COLOR_MIN);
        expect(channel).toBeLessThan(LIGHT_GREY);
      });
    });
    await hand.tap(page.locator('#btnApplyLevels'));
    await check('Apply is greyed out; there is no dot on the Levels tab', async () => {
      await expect(page.locator('#btnApplyLevels')).toBeDisabled();
      await expect(levelsDot(page)).toBeHidden();
    });
    await exportStep(page, hand, check, 'the Export step shows, with Download');
    const asked = await downloadStep(page, hand, check,
      `a question box asks "${UPSCALE_QUESTION}"`);
    const saved = await answerNo(page, hand, asked);
    await check(`a file named ${TWO_GREYS_SAVED_NAME} is saved`, () => {
      expect(saved.name).toBe(TWO_GREYS_SAVED_NAME);
    });
    const { width, height } = await readSavedImage(page, saved.file);
    const left = await fileRegionColor(page, saved.file, [width / 4, height / 2], SAVED_PATCH_PX);
    const right = await fileRegionColor(page, saved.file, [width * 3 / 4, height / 2],
      SAVED_PATCH_PX);
    await check('the middle of its left half: 245, 245, 245, each within 3', () => {
      expectSameColor(left, grey(WHITE_TARGET), FLAT_SAVED_TOLERANCE);
    });
    await check(`the middle of its right half: ${DARK_GREY_LANDS}, each within 3: not 61 (the `
      + `grey ${DARK_GREY} scaled without linear light)`, () => {
      expectSameColor(right, grey(DARK_GREY_LANDS), FLAT_SAVED_TOLERANCE);
    });
  });

test('LEV-22.1 The instruction between Discard and Apply [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnLevels(page, testInfo);
  const hint = hintLine(page);
  await check(`it reads "${HINTS.start}"`, async () => {
    await expect(hint).toHaveText(HINTS.start);
  });
  await hand.tap(pickButton(page, 'white'));
  await check(`it reads "${HINTS.white}"`, async () => {
    await expect(hint).toHaveText(HINTS.white);
  });
  await hand.tap(pickButton(page, 'black'));
  await check(`it reads "${HINTS.black}"`, async () => {
    await expect(hint).toHaveText(HINTS.black);
  });
  await hand.tap(pickButton(page, 'black'));
  await check(`it reads "${HINTS.start}" again`, async () => {
    await expect(hint).toHaveText(HINTS.start);
  });
  await hand.tap(page.locator('#toolAutoLevels'));
  await check(`it reads "${HINTS.compare}"`, async () => {
    await expect(hint).toHaveText(HINTS.compare);
  });
  await hand.tap(page.locator('#toolClearLevels'));
  await check(`it reads "${HINTS.start}" once more`, async () => {
    await expect(hint).toHaveText(HINTS.start);
  });
});

test('LEV-22.2 The instruction is announced, rewritten only when it changes, and lets taps '
  + 'through [phone]', async ({ page, check }, testInfo) => {
  const hand = await startOnLevels(page, testInfo);
  const hint = hintLine(page);
  await hint.evaluate(el => {
    window.testHintWrites = 0;
    new MutationObserver(changes => {
      window.testHintWrites += changes.filter(change => change.type === 'childList').length;
    }).observe(el, { childList: true, characterData: true, subtree: true });
  });
  // How many times the instruction's words have been written since the watch began.
  const writes = () => page.evaluate(() => window.testHintWrites);
  await check(`it reads "${HINTS.start}"; screen readers are told it is a status line; taps `
    + 'pass through it', async () => {
    await expect(hint).toHaveText(HINTS.start);
    await expect(hint).toHaveAttribute('role', 'status');
    expect(await hint.evaluate(el => getComputedStyle(el).pointerEvents)).toBe('none');
  });
  await hand.tap(pickButton(page, 'white'));
  await check(`it reads "${HINTS.white}"; its words have been written once since row 1`,
    async () => {
      await expect(hint).toHaveText(HINTS.white);
      expect(await writes()).toBe(1);
    });
  await hand.tap(pickButton(page, 'black'));
  await check(`it reads "${HINTS.black}"; written twice since row 1`, async () => {
    await expect(hint).toHaveText(HINTS.black);
    expect(await writes()).toBe(2);
  });
  await hand.tap(pickButton(page, 'black'));
  await check(`it reads "${HINTS.start}"; written three times`, async () => {
    await expect(hint).toHaveText(HINTS.start);
    expect(await writes()).toBe(3);
  });
  await hand.tap(page.locator('#toolAutoLevels'));
  await check(`it reads "${HINTS.compare}"; written four times`, async () => {
    await expect(hint).toHaveText(HINTS.compare);
    expect(await writes()).toBe(4);
  });
  await hand.tap(page.locator('#toolAutoLevels'));
  await afterDraw(page);
  await check(`it still reads "${HINTS.compare}", and has not been written again: still four `
    + 'times', async () => {
    await expect(hint).toHaveText(HINTS.compare);
    expect(await writes()).toBe(4);
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
  await check('a sheet titled "Levels tips" rises, with the three tips; no options, no switches, '
    + 'no Tips row, no reset and no keyboard help', async () => {
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
  await check('the three tips of LEV-23.1, then "Hold C, or press and hold the photo, to '
    + 'compare." under the heading TIPS AND KEYS', async () => {
    await expect(sheet.getByText('Tips and keys')).toBeVisible();
    expect(await shownHints(page)).toEqual([...LEVELS_TIPS, LEVELS_KEY_HELP]);
  });
});

test('LEV-24.1 Only Apply adds an undo step [phone]', async ({ page, check }, testInfo) => {
  const hand = await startOnLevels(page, testInfo);
  const undo = page.locator('#btnUndo');
  const colorNone = await drawnColor(page);
  await pickSpot(page, hand, 'white', SPOTS.white);
  await check('the color patch of Pick white is filled; Undo is still greyed out', async () => {
    expect(await patchFill(page, 'white')).not.toBeNull();
    await expect(undo).toBeDisabled();
  });
  await pickSpot(page, hand, 'black', SPOTS.dark);
  await check('the color patch of Pick black is filled; Undo is still greyed out', async () => {
    expect(await patchFill(page, 'black')).not.toBeNull();
    await expect(undo).toBeDisabled();
  });
  await hand.tap(page.locator('#toolClearLevels'));
  await check('both color patches are dashed and empty; Undo is still greyed out', async () => {
    expect(await isPatchEmpty(page, 'white')).toBe(true);
    expect(await isPatchEmpty(page, 'black')).toBe(true);
    await expect(undo).toBeDisabled();
  });
  await hand.tap(page.locator('#toolAutoLevels'));
  const colorAuto = await drawnColor(page);
  await check('the photo changes; Undo is still greyed out', async () => {
    expect(colorDifference(colorAuto, colorNone)).toBeGreaterThan(CHANGED_COLOR_MIN);
    await expect(undo).toBeDisabled();
  });
  const middle = await spotOnPage(page, [0.5, 0.5]);
  await holdPhoto(page, hand, middle);
  await check('the photo shows without levels, with the Before levels badge; Undo is still '
    + 'greyed out', async () => {
    expect(colorDifference(await drawnColor(page), colorNone)).toBeLessThanOrEqual(
      SAME_COLOR_TOLERANCE,
    );
    expect(await badgeShown(page)).toBe(true);
    await expect(undo).toBeDisabled();
  });
  await releasePhoto(page, hand, middle);
  await check('Auto\'s levels show again; Undo is still greyed out', async () => {
    expect(colorDifference(await drawnColor(page), colorAuto)).toBeLessThanOrEqual(
      SAME_COLOR_TOLERANCE,
    );
    await expect(undo).toBeDisabled();
  });
  await hand.tap(page.locator('#btnDiscardLevels'));
  await check('the photo shows without levels; Undo is still greyed out', async () => {
    expect(colorDifference(await drawnColor(page), colorNone)).toBeLessThanOrEqual(
      SAME_COLOR_TOLERANCE,
    );
    await expect(undo).toBeDisabled();
  });
  await hand.tap(page.locator('#toolAutoLevels'));
  await check('Apply is no longer greyed out; Undo is still greyed out', async () => {
    await expect(page.locator('#btnApplyLevels')).toBeEnabled();
    await expect(undo).toBeDisabled();
  });
  await hand.tap(page.locator('#btnApplyLevels'));
  await check('Undo is no longer greyed out', async () => {
    await expect(undo).toBeEnabled();
  });
  await hand.tap(undo);
  await check('the levels are gone; Undo is greyed out again', async () => {
    expect((await levelsNow(page)).applied).toBeNull();
    expect(colorDifference(await drawnColor(page), colorNone)).toBeLessThanOrEqual(
      SAME_COLOR_TOLERANCE,
    );
    await expect(undo).toBeDisabled();
  });
});
