// The Photo view cases (tests/catalog/photo-view.md): the fitted start, each view's own zoom,
// when a view refits, pinch, a second and a third finger, the wheel, the zoom limits, pan, the
// double tap, sharpness, what shows around and instead of the photo, the mouse pointer, the
// right-click menu and focus, iPhone's page zoom and selection, and the drawing's density.
// Each test drives the app as a person would, through hand.tap, dispatched fingers (on the phone
// targets) and the mouse (on the wide ones), and reads the app's state only to check a result.
'use strict';
const { test, expect } = require('./support/case.js');
const {
  goToStep,
  editState,
  openOptions,
  closeOptions,
  waitForStill,
} = require('./support/app.js');
const {
  sendTouch,
  pinchAt,
  cornersNow,
  handleOnPage,
  doubleTapAt,
  tapAt,
} = require('./support/perspective.js');
const { makePair, zoomIn, chooseOutput } = require('./support/front-and-back.js');
const { crossTheCorners } = require('./support/export.js');
const {
  startOnLevels,
  SPOTS,
  spotOnPage,
  pickButton,
  armedPick,
  patchFill,
  isPatchEmpty,
  levelsDot,
  pressThenTap,
} = require('./support/levels.js');
const { cropHandleOnPage } = require('./support/crop.js');
const { chooseLogo, fixtureLogo } = require('./support/overlay.js');
const {
  startOn,
  waitForSheet,
  viewNow,
  middleOnPage,
} = require('./support/top-bar-and-navigation.js');
const {
  FIRST_FINGER,
  SECOND_FINGER,
  THIRD_FINGER,
  photoGaps,
  worldUnder,
  wheelAt,
  pointerShape,
  pointInPhoto,
  slideFinger,
  fingerDown,
  fingerUp,
  drawingSize,
  colorsAround,
  stageShare,
  drawnSource,
  recordDrawnText,
} = require('./support/photo-view.js');

// The space around a fitted photo, in CSS px (view.js, FIT_PADDING_PX and CROP_FIT_PADDING_PX):
// 24, and 36 on Crop.
const FIT_GAP_PX = 24;
const CROP_GAP_PX = 36;
// How close two page measurements must be, in CSS px.
const GAP_TOLERANCE_PX = 0.5;
// A pinch's fingers start and end this far apart, in CSS px.
const PINCH_START_PX = 100;
const PINCH_END_PX = 200;
const PINCH_WIDER_PX = 300;
const PINCH_SMALL_END_PX = 160;
// How close a picture point must stay under the fingers or the pointer, in its own px.
const WORLD_TOLERANCE_PX = 0.5;
// The wheel: one notch in px, and the zoom factor it gives without and with Ctrl (input.js,
// onWheel: e^(0.0015 · 100) and e^(0.01 · 100)).
const NOTCH_PX = 100;
const NOTCH_FACTOR = Math.exp(0.15);
const CTRL_NOTCH_FACTOR = Math.exp(1);
// Wheel notches past either zoom limit from the fitted photo (about 0.34 at desktop size): 35
// notches reach 64 times, and 59 more go down to a hundredth.
const GROW_NOTCHES = 40;
const SHRINK_NOTCHES = 70;
// The zoom limits (view.js): screen px per photo px.
const MAX_ZOOM = 64;
const MIN_ZOOM = 0.01;
// How far a pan drag goes, in CSS px.
const PAN_DX_PX = 60;
const PAN_DY_PX = 40;
// Where an empty part of the photo is, from the photo area's top-left, in CSS px: left of and
// above the card in 01_chrome_flat_black.JPEG.
const EMPTY_SPOT = { dx: 40, dy: 60 };
// How far a corner is dragged before the second finger, and the second finger's start, in CSS px.
const CORNER_DRAG_PX = 30;
const SECOND_FINGER_GAP_PX = 100;
// How far right of the first finger VIEW-05.2's second finger lands, in CSS px: still on the
// framed picture.
const PICK_SECOND_FINGER_PX = 80;
const SPREAD_EACH_PX = 50;
const SPREAD_MOVES = 8;
// How far the third finger and a leftover finger slide, in CSS px.
const THIRD_SLIDE_PX = 80;
const LEFTOVER_SLIDE_PX = 60;
const THIRD_FINGER_BELOW_PX = 100;
// Two taps further apart than a double tap's 24 px, in CSS px, and longer apart than its
// 320 ms, in ms.
const FAR_TAP_PX = 40;
const SLOW_TAP_MS = 500;
// The angle typed in VIEW-12.1, in degrees.
const TILT_DEG = '10';
// The fill's white, and the checkerboard's two greys (view.js, underlayStyle), as 'r,g,b'.
const FILL_WHITE = '255,255,255';
const CHECKER_GREYS = ['90,90,90', '122,122,122'];
// How far in from a corner of the straightened frame VIEW-12.1 reads, in the frame's own px,
// and the half-sides of the squares read around that point on the page, in CSS px: one inside
// the fill, one wide enough for both greys of the checkerboard.
const FRAME_CORNER_PX = 60;
const SPOT_RADIUS_PX = 3;
const CHECKER_RADIUS_PX = 8;
// VIEW-11.1 rolls the wheel this many notches from the fitted photo (about 0.34 at desktop
// size), to about four screen px per photo px (3.75), give or take SHARP_ZOOM_TOLERANCE.
const SHARP_NOTCHES = 16;
const SHARP_ZOOM = 4;
const SHARP_ZOOM_TOLERANCE = 0.5;
// VIEW-11.1's link: the on-screen copy made 512 px on its long side (CONFIG.previewMaxPx, whose
// least is 512), a quarter of 01_chrome_flat_black.JPEG's 2048, so the full-resolution drawing
// differs from the copy's. At the default 2048 the copy is the photo itself.
const SMALL_COPY_PX = 512;
const SMALL_COPY_LINK = `index.html?previewMaxPx=${SMALL_COPY_PX}`;
// Where VIEW-11.1 compares the drawing: a square centered on the card's top-left corner, where
// the card's edges meet the dark background, half its side in CSS px.
const SHARP_SPOT_RADIUS_PX = 40;
// The share of that square's pixels (0 to 1) that may differ from the full-resolution photo,
// and the share that must differ from the 512 px copy (about 40% did on 16 November).
const SAME_DRAWING_MAX = 0.01;
const COPY_DIFFERENT_MIN = 0.1;
// VIEW-10.6's logo (tests/fixtures/), and where it double taps: a quarter of the way in from the
// crop's left edge and up from its bottom, clear of the logo (the middle quarter of the width)
// and of the nine rings (at least 57 px from each on a phone, where a ring takes a press within
// 24 px).
const LOGO_FILE = 'blue-disc.png';
const AWAY_FROM_RINGS = { across: 0.25, down: 0.75 };
// The share of the photo area that must be the empty stage when only a message is drawn.
const MESSAGE_ONLY_SHARE = 0.97;
// A screen's density in device px per CSS px: an iPhone's, and the most the app draws at.
const PHONE_DENSITY = 3;
// A desktop window and a smaller one, in CSS px.
const DESKTOP_WINDOW = { width: 1280, height: 800 };
const SMALLER_WINDOW = { width: 1000, height: 600 };
// The white background left of the slab in IMG_9075.JPEG as a pick reads it (r, g, b), and how
// far each channel may be from it (levels.md, LEV-07.1).
const BACKGROUND_WHITE = [225, 226, 217];
const PICK_TOLERANCE = 3;
// How many Tab presses VIEW-16.2 makes from the Rotate tab it clicked, and the focus ring it
// expects: 2 px of --ink, the app's near-white (css/app.css), as the computed style writes it.
const RING_TABS = 3;
const RING_OUTLINE = 'solid 2px rgb(242, 242, 243)';
// VIEW-15.2: how far above the middle of the crop box's top side the pointer goes, in CSS px.
const ABOVE_CROP_PX = 40;
// VIEW-15.3: the pointer goes back near the photo's middle, this far right and down of where it
// was, in CSS px, so that it moves and the app sets the pointer's shape again.
const NEAR_MIDDLE_PX = 5;
// A press held until the compare shows must still be under a tap's 300 ms (input.js, TAP_MS).
const TAP_MS = 300;

// The middle of the photo area on the page.
const photoMiddle = page => middleOnPage(page, '#view');

// The smaller of the gaps on the photo's tighter side, and how far it is from centered on the
// other: { tight, offCenter }, in CSS px.
function fitOf(gaps) {
  const across = Math.min(gaps.left, gaps.right);
  const down = Math.min(gaps.top, gaps.bottom);
  const isAcrossTight = across <= down;
  return {
    tight: Math.min(across, down),
    offCenter: isAcrossTight
      ? Math.abs(gaps.top - gaps.bottom)
      : Math.abs(gaps.left - gaps.right),
    tightSides: isAcrossTight
      ? Math.abs(gaps.left - gaps.right)
      : Math.abs(gaps.top - gaps.bottom),
  };
}

// Expects the current step's picture to be fitted with `gapPx` on its tighter side and centered.
async function expectFitted(page, gapPx) {
  const fit = fitOf(await photoGaps(page));
  expect(Math.abs(fit.tight - gapPx)).toBeLessThan(GAP_TOLERANCE_PX);
  expect(fit.offCenter).toBeLessThan(GAP_TOLERANCE_PX);
  expect(fit.tightSides).toBeLessThan(GAP_TOLERANCE_PX);
}

// Pinches on the middle of the photo from PINCH_START_PX to `endPx` apart.
async function pinchMiddle(page, endPx = PINCH_END_PX) {
  await pinchAt(page, await photoMiddle(page), PINCH_START_PX, endPx);
}

// Export's Together or Separately choice for a pair: output is 'together' or 'separately'.
const outputSegment = (page, output) => page.locator(
  `#pairOutput .segment[data-value="${output}"]`,
);

// True while the photo area shows a pair's joined picture of both cards.
const isJoinedShown = page => page.evaluate(() => window.CF.isTogetherShown());

test('VIEW-01.1 The photo opens fitted, with 24 px around it [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo);
  await check('the photo is 24 px from the left and right edges and centered top to bottom',
    async () => {
      const gaps = await photoGaps(page);
      expect(Math.abs(gaps.left - FIT_GAP_PX)).toBeLessThan(GAP_TOLERANCE_PX);
      expect(Math.abs(gaps.right - FIT_GAP_PX)).toBeLessThan(GAP_TOLERANCE_PX);
      expect(Math.abs(gaps.top - gaps.bottom)).toBeLessThan(GAP_TOLERANCE_PX);
    });
  await goToStep(page, 'rotate', hand);
  await check('on Rotate the straightened photo is 24 px from the edges on its tighter side, '
    + 'centered', () => expectFitted(page, FIT_GAP_PX));
});

test('VIEW-01.2 Crop opened first leaves 36 px, and Rotate then fits its own 24 px [phone]',
  async ({ page, check }, testInfo) => {
    const hand = await startOn(page, testInfo);
    await goToStep(page, 'crop', hand);
    await check('on Crop the photo is 36 px from the edges on its tighter side',
      () => expectFitted(page, CROP_GAP_PX));
    await goToStep(page, 'rotate', hand);
    await check('on Rotate the straightened photo is 24 px from the edges on its tighter side, '
      + 'and centered on the other', () => expectFitted(page, FIT_GAP_PX));
  });

test('VIEW-01.3 Rotate opened first leaves 24 px, and Crop then fits its own 36 px [phone]',
  async ({ page, check }, testInfo) => {
    const hand = await startOn(page, testInfo);
    await goToStep(page, 'rotate', hand);
    await check('on Rotate the straightened photo is 24 px from the edges on its tighter side',
      () => expectFitted(page, FIT_GAP_PX));
    await goToStep(page, 'crop', hand);
    await check('on Crop the photo is 36 px from the edges on its tighter side, and centered on '
      + 'the other', () => expectFitted(page, CROP_GAP_PX));
  });

test('VIEW-01.4 After a zoom kept from Rotate, Fit to screen on Crop leaves 36 px, and Rotate '
  + 'then fits its own 24 px [phone]', async ({ page, check }, testInfo) => {
  const hand = await startOn(page, testInfo);
  await goToStep(page, 'rotate', hand);
  await check('on Rotate the straightened photo is 24 px from the edges on its tighter side',
    () => expectFitted(page, FIT_GAP_PX));
  const rotateFitted = await viewNow(page);
  await pinchMiddle(page);
  const rotateView = await viewNow(page);
  await check('the photo zooms in to twice its fitted size; Fit to screen shows', async () => {
    expect(rotateView.isFitted).toBe(false);
    expect(rotateView.zoom / rotateFitted.zoom).toBeCloseTo(PINCH_END_PX / PINCH_START_PX, 5);
    await expect(page.locator('#btnFit')).toBeVisible();
  });
  await goToStep(page, 'crop', hand);
  await check('Crop shows the photo zoomed exactly as on Rotate; Fit to screen still shows',
    async () => {
      expect(await viewNow(page)).toEqual(rotateView);
      await expect(page.locator('#btnFit')).toBeVisible();
    });
  await hand.tap(page.locator('#btnFit'));
  await check('the photo is 36 px from the edges on its tighter side, and centered on the '
    + 'other; Fit to screen has gone', async () => {
    await expectFitted(page, CROP_GAP_PX);
    expect((await viewNow(page)).isFitted).toBe(true);
    await expect(page.locator('#btnFit')).toBeHidden();
  });
  await goToStep(page, 'rotate', hand);
  await check('on Rotate the straightened photo is 24 px from the edges on its tighter side, '
    + 'and centered on the other', () => expectFitted(page, FIT_GAP_PX));
});

test('VIEW-02.1 Perspective keeps its zoom; Rotate and Crop share theirs [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo);
  const perspectiveFitted = await viewNow(page);
  await pinchMiddle(page);
  const perspectiveView = await viewNow(page);
  await check('the photo zooms in to twice its fitted size', () => {
    expect(perspectiveView.isFitted).toBe(false);
    expect(perspectiveView.zoom / perspectiveFitted.zoom)
      .toBeCloseTo(PINCH_END_PX / PINCH_START_PX, 5);
  });
  await goToStep(page, 'rotate', hand);
  await check('Rotate\'s photo is fitted, not zoomed', async () => {
    expect((await viewNow(page)).isFitted).toBe(true);
  });
  const rotateFitted = await viewNow(page);
  await pinchMiddle(page, PINCH_WIDER_PX);
  const rotateView = await viewNow(page);
  await check('the photo zooms in to three times its fitted size, more than Perspective\'s did',
    () => {
      expect(rotateView.zoom / rotateFitted.zoom)
        .toBeCloseTo(PINCH_WIDER_PX / PINCH_START_PX, 5);
    });
  await goToStep(page, 'crop', hand);
  await check('Crop shows the photo zoomed exactly as on Rotate', async () => {
    expect(await viewNow(page)).toEqual(rotateView);
  });
  await goToStep(page, 'perspective', hand);
  await check('Perspective shows the photo zoomed exactly as it was left', async () => {
    expect(await viewNow(page)).toEqual(perspectiveView);
  });
});

test('VIEW-02.2 A pair\'s joined preview is fitted again each time Together is chosen [phone]',
  async ({ page, check }, testInfo) => {
    const hand = await makePair(page, testInfo);
    await goToStep(page, 'export', hand);
    await check('the two cards show side by side, fitted, with Together chosen', async () => {
      await expect(outputSegment(page, 'together')).toHaveAttribute('aria-pressed', 'true');
      expect(await isJoinedShown(page)).toBe(true);
      expect((await viewNow(page)).isFitted).toBe(true);
    });
    await pinchMiddle(page);
    await check('the joined picture of both cards zooms in', async () => {
      expect(await isJoinedShown(page)).toBe(true);
      expect((await viewNow(page)).isFitted).toBe(false);
    });
    await chooseOutput(page, hand, 'separately');
    await check('only the back shows, fitted, not zoomed', async () => {
      expect(await isJoinedShown(page)).toBe(false);
      expect(await page.evaluate(() => window.__straightener.app.pair.current)).toBe('back');
      expect((await viewNow(page)).isFitted).toBe(true);
    });
    await chooseOutput(page, hand, 'together');
    await check('the two cards show side by side again, fitted: the zoom is gone', async () => {
      expect(await isJoinedShown(page)).toBe(true);
      expect((await viewNow(page)).isFitted).toBe(true);
    });
  });

test('VIEW-03.1 A fitted photo refits when the window changes size; a zoomed one stays '
  + '[desktop]', async ({ page, check }, testInfo) => {
  const hand = await startOn(page, testInfo);
  const fittedBefore = await viewNow(page);
  const widthBefore = (await photoGaps(page)).areaWidth;
  await page.setViewportSize(SMALLER_WINDOW);
  await page.waitForFunction(width => window.__straightener.app.cssWidth < width, widthBefore);
  await check('at 1000 × 600 the photo is smaller, still as large as fits', async () => {
    const view = await viewNow(page);
    expect(view.zoom).toBeLessThan(fittedBefore.zoom);
    await expectFitted(page, FIT_GAP_PX);
  });
  await zoomIn(page, hand);
  const zoomed = await viewNow(page);
  await check('the wheel zooms the photo in', () => {
    expect(zoomed.isFitted).toBe(false);
  });
  const smallerWidth = (await photoGaps(page)).areaWidth;
  await page.setViewportSize(DESKTOP_WINDOW);
  await page.waitForFunction(width => window.__straightener.app.cssWidth > width, smallerWidth);
  await check('back at 1280 × 800 the zoom is the same, not refitted', async () => {
    const view = await viewNow(page);
    expect(view.zoom).toBe(zoomed.zoom);
    expect(view.isFitted).toBe(false);
  });
});

test('VIEW-03.2 A fitted photo refits after an edit; a zoomed one stays [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo, 'rotate');
  await hand.tap(page.locator('#toolRotateRight'));
  await check('90° right turns the photo and fits it again, on its side', async () => {
    await expectFitted(page, FIT_GAP_PX);
    const rotated = await page.evaluate(() => window.__straightener.app.geometry.rotated);
    expect(rotated.width).toBeGreaterThan(rotated.height);
  });
  await pinchMiddle(page);
  const zoomed = await viewNow(page);
  await check('two fingers zoom it in', () => {
    expect(zoomed.isFitted).toBe(false);
  });
  await hand.tap(page.locator('#toolRotateRight'));
  await check('another 90° right turns it; the zoom is the same as before the turn', async () => {
    expect((await editState(page)).rotation.quarter).toBe(2);
    expect((await viewNow(page)).zoom).toBe(zoomed.zoom);
  });
});

test('VIEW-03.3 Levels\' zoom is dropped when the step is opened again; Perspective\'s is kept '
  + '[phone]', async ({ page, check }, testInfo) => {
  const hand = await startOn(page, testInfo);
  await pinchMiddle(page);
  const perspectiveView = await viewNow(page);
  await check('two fingers zoom the photo in', () => {
    expect(perspectiveView.isFitted).toBe(false);
  });
  await goToStep(page, 'levels', hand);
  await check('Levels shows the cropped photo, fitted', async () => {
    expect((await viewNow(page)).isFitted).toBe(true);
  });
  await pinchMiddle(page);
  await check('two fingers zoom it in', async () => {
    expect((await viewNow(page)).isFitted).toBe(false);
  });
  await goToStep(page, 'rotate', hand);
  await check('the straightened photo shows, with STRAIGHTEN in the line above the controls',
    async () => {
      await expect(page.locator('#rotateStraightenLine .line-label')).toHaveText(/straighten/i);
      await expect(page.locator('#rotateStraightenLine')).toBeVisible();
    });
  await goToStep(page, 'levels', hand);
  await check('back on Levels, the cropped photo is fitted again', async () => {
    expect((await viewNow(page)).isFitted).toBe(true);
  });
  await goToStep(page, 'perspective', hand);
  await check('Perspective is still zoomed as it was left', async () => {
    expect(await viewNow(page)).toEqual(perspectiveView);
  });
});

test('VIEW-04.1 Two fingers zoom the photo about the point between them [phone] [webkit]',
  async ({ page, check }, testInfo) => {
    await startOn(page, testInfo);
    const middle = await photoMiddle(page);
    const before = await viewNow(page);
    const underBefore = await worldUnder(page, middle);
    await check('before the pinch the photo is fitted', () => {
      expect(before.isFitted).toBe(true);
    });
    await pinchAt(page, middle, PINCH_START_PX, PINCH_END_PX);
    await check('spread from 100 to 200 px, the photo is twice as large, and the same part of '
      + 'it is between the fingers', async () => {
      expect((await viewNow(page)).zoom / before.zoom).toBeCloseTo(2, 5);
      const underAfter = await worldUnder(page, middle);
      expect(Math.abs(underAfter[0] - underBefore[0])).toBeLessThan(WORLD_TOLERANCE_PX);
      expect(Math.abs(underAfter[1] - underBefore[1])).toBeLessThan(WORLD_TOLERANCE_PX);
    });
  });

test('VIEW-04.2 On Overlay with no logo, two fingers do nothing [phone]', async ({
  page,
  check,
}, testInfo) => {
  await startOn(page, testInfo, 'overlay');
  const before = await viewNow(page);
  await pinchMiddle(page);
  await check('the photo does not zoom or move', async () => {
    expect(await viewNow(page)).toEqual(before);
  });
});

test('VIEW-05.1 A second finger ends a corner drag, keeping it, and zooms [phone] [webkit]',
  async ({ page, check }, testInfo) => {
    const hand = await startOn(page, testInfo);
    const before = await cornersNow(page);
    const viewBefore = await viewNow(page);
    const zoomBefore = viewBefore.zoom;
    const panBefore = { x: viewBefore.panX, y: viewBefore.panY };
    const start = await handleOnPage(page, 0);
    await fingerDown(page, FIRST_FINGER, start);
    const first = await slideFinger(page, FIRST_FINGER, start, -CORNER_DRAG_PX, 0);
    await check('the corner follows the first finger', async () => {
      expect(Math.abs((await handleOnPage(page, 0)).x - first.x)).toBeLessThan(1);
    });
    const second = { x: first.x + SECOND_FINGER_GAP_PX, y: first.y };
    await fingerDown(page, SECOND_FINGER, second);
    await check('the photo does not move or change size; the corner stays where the first '
      + 'finger left it', async () => {
      const view = await viewNow(page);
      expect([view.zoom, view.panX, view.panY]).toEqual([zoomBefore, panBefore.x, panBefore.y]);
      const moved = (await cornersNow(page))[0][0] - before[0][0];
      expect(moved * zoomBefore).toBeCloseTo(-CORNER_DRAG_PX, 3);
    });
    for (let i = 1; i <= SPREAD_MOVES; i++) {
      const step = SPREAD_EACH_PX * i / SPREAD_MOVES;
      await sendTouch(page, '#view', 'pointermove', { x: first.x - step, y: first.y },
        FIRST_FINGER);
      await sendTouch(page, '#view', 'pointermove', { x: second.x + step, y: second.y },
        SECOND_FINGER);
    }
    await check('the photo zooms in', async () => {
      expect((await viewNow(page)).zoom).toBeGreaterThan(zoomBefore);
    });
    await fingerUp(page, SECOND_FINGER, { x: second.x + SPREAD_EACH_PX, y: second.y });
    await fingerUp(page, FIRST_FINGER, { x: first.x - SPREAD_EACH_PX, y: first.y });
    await check('the corner is where the first finger left it: 30 px left of where it started, '
      + 'at the size the photo had then', async () => {
      const moved = (await cornersNow(page))[0][0] - before[0][0];
      expect(moved * zoomBefore).toBeCloseTo(-CORNER_DRAG_PX, 3);
    });
    await hand.tap(page.locator('#btnUndo'));
    await check('the corner is back where it started; Undo is greyed out', async () => {
      expect(await cornersNow(page)).toEqual(before);
      await expect(page.locator('#btnUndo')).toBeDisabled();
    });
  });

test('VIEW-05.2 A second finger while a Levels pick is armed cancels the press [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnLevels(page, testInfo);
  await hand.tap(pickButton(page, 'white'));
  await check('Pick white is selected', async () => {
    expect(await armedPick(page)).toBe('white');
  });
  const first = await spotOnPage(page, SPOTS.white);
  const second = { x: first.x + PICK_SECOND_FINGER_PX, y: first.y };
  await fingerDown(page, FIRST_FINGER, first);
  await check('the color patch is still dashed and empty', async () => {
    expect(await isPatchEmpty(page, 'white')).toBe(true);
  });
  // The patch is empty, and Pick white still selected, after each later finger.
  const expectStillArmed = async () => {
    expect(await isPatchEmpty(page, 'white')).toBe(true);
    expect(await armedPick(page)).toBe('white');
  };
  const stillArmed = 'the color patch is still dashed and empty; Pick white is still selected';
  await fingerDown(page, SECOND_FINGER, second);
  await check(stillArmed, expectStillArmed);
  await fingerUp(page, SECOND_FINGER, second);
  await check(stillArmed, expectStillArmed);
  await fingerUp(page, FIRST_FINGER, first);
  await check(stillArmed, expectStillArmed);
});

test('VIEW-06.1 A third finger is ignored [phone]', async ({ page, check }, testInfo) => {
  await startOn(page, testInfo);
  const middle = await photoMiddle(page);
  const left = { x: middle.x - PINCH_START_PX / 2, y: middle.y };
  const right = { x: middle.x + PINCH_START_PX / 2, y: middle.y };
  const spreadEach = (PINCH_SMALL_END_PX - PINCH_START_PX) / 2;
  await fingerDown(page, FIRST_FINGER, left);
  await fingerDown(page, SECOND_FINGER, right);
  const leftEnd = await slideFinger(page, FIRST_FINGER, left, -spreadEach, 0);
  const rightEnd = await slideFinger(page, SECOND_FINGER, right, spreadEach, 0);
  const pinched = await viewNow(page);
  await check('the photo zooms in', () => {
    expect(pinched.isFitted).toBe(false);
  });
  const third = { x: middle.x, y: middle.y + THIRD_FINGER_BELOW_PX };
  await fingerDown(page, THIRD_FINGER, third);
  await check('the photo does not change', async () => {
    expect(await viewNow(page)).toEqual(pinched);
  });
  const thirdEnd = await slideFinger(page, THIRD_FINGER, third, 0, THIRD_SLIDE_PX);
  await check('the photo does not change', async () => {
    expect(await viewNow(page)).toEqual(pinched);
  });
  await fingerUp(page, THIRD_FINGER, thirdEnd);
  await fingerUp(page, SECOND_FINGER, rightEnd);
  await fingerUp(page, FIRST_FINGER, leftEnd);
  await check('the photo stays as it was after row 1', async () => {
    expect(await viewNow(page)).toEqual(pinched);
  });
});

test('VIEW-06.2 The finger left after a pinch does nothing until it lifts [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo);
  const middle = await photoMiddle(page);
  const left = { x: middle.x - PINCH_START_PX / 2, y: middle.y };
  const right = { x: middle.x + PINCH_START_PX / 2, y: middle.y };
  const spreadEach = (PINCH_SMALL_END_PX - PINCH_START_PX) / 2;
  await fingerDown(page, FIRST_FINGER, left);
  await fingerDown(page, SECOND_FINGER, right);
  const leftEnd = await slideFinger(page, FIRST_FINGER, left, -spreadEach, 0);
  const rightEnd = await slideFinger(page, SECOND_FINGER, right, spreadEach, 0);
  const pinched = await viewNow(page);
  await check('the photo zooms in', () => {
    expect(pinched.isFitted).toBe(false);
  });
  await fingerUp(page, SECOND_FINGER, rightEnd);
  await check('the photo stays as it is', async () => {
    expect(await viewNow(page)).toEqual(pinched);
  });
  const leftover = await slideFinger(page, FIRST_FINGER, leftEnd, LEFTOVER_SLIDE_PX, 0);
  await check('the photo does not move', async () => {
    expect(await viewNow(page)).toEqual(pinched);
  });
  await fingerUp(page, FIRST_FINGER, leftover);
  await check('the photo stays as it is', async () => {
    expect(await viewNow(page)).toEqual(pinched);
  });
  const start = await pointInPhoto(page, EMPTY_SPOT.dx, EMPTY_SPOT.dy);
  await hand.drag(start, { x: start.x + LEFTOVER_SLIDE_PX, y: start.y });
  await check('the photo moves 60 px to the right', async () => {
    expect((await viewNow(page)).panX - pinched.panX).toBeCloseTo(LEFTOVER_SLIDE_PX, 3);
  });
});

test('VIEW-07.1 The wheel zooms about the cursor, faster with Ctrl, and the page doesn\'t '
  + 'scroll [desktop]', async ({ page, check }, testInfo) => {
  await startOn(page, testInfo);
  const corner = await handleOnPage(page, 0);
  const before = await viewNow(page);
  const underBefore = await worldUnder(page, corner);
  await wheelAt(page, corner, -NOTCH_PX);
  const afterNotch = await viewNow(page);
  await check('one notch grows the photo about 16%; the corner is still under the pointer; the '
    + 'page has not scrolled', async () => {
    expect(afterNotch.zoom / before.zoom).toBeCloseTo(NOTCH_FACTOR, 5);
    const underAfter = await worldUnder(page, corner);
    expect(Math.abs(underAfter[0] - underBefore[0])).toBeLessThan(WORLD_TOLERANCE_PX);
    expect(Math.abs(underAfter[1] - underBefore[1])).toBeLessThan(WORLD_TOLERANCE_PX);
    expect(await page.evaluate(() => [window.scrollX, window.scrollY])).toEqual([0, 0]);
  });
  await wheelAt(page, corner, -NOTCH_PX, true);
  await check('with Ctrl, one notch grows it about 2.7 times', async () => {
    expect((await viewNow(page)).zoom / afterNotch.zoom).toBeCloseTo(CTRL_NOTCH_FACTOR, 5);
  });
});

test('VIEW-07.2 On Overlay with no logo, the wheel does nothing [desktop]', async ({
  page,
  check,
}, testInfo) => {
  await startOn(page, testInfo, 'overlay');
  const before = await viewNow(page);
  await wheelAt(page, await photoMiddle(page), -NOTCH_PX);
  await check('the photo does not zoom', async () => {
    expect(await viewNow(page)).toEqual(before);
  });
});

test('VIEW-08.1 Zoom stops at 64 times and at a hundredth [desktop]', async ({
  page,
  check,
}, testInfo) => {
  await startOn(page, testInfo);
  const middle = await photoMiddle(page);
  for (let i = 0; i < GROW_NOTCHES; i++) await wheelAt(page, middle, -NOTCH_PX);
  await check('the zoom is 64: one photo pixel covers 64 × 64 screen pixels', async () => {
    expect((await viewNow(page)).zoom).toBe(MAX_ZOOM);
  });
  await wheelAt(page, middle, -NOTCH_PX);
  await check('the zoom is still 64: the photo does not grow', async () => {
    expect((await viewNow(page)).zoom).toBe(MAX_ZOOM);
  });
  for (let i = 0; i < SHRINK_NOTCHES; i++) await wheelAt(page, middle, NOTCH_PX);
  await check('the zoom is 0.01: 100 × 100 photo pixels share one screen pixel', async () => {
    expect((await viewNow(page)).zoom).toBe(MIN_ZOOM);
  });
  await wheelAt(page, middle, NOTCH_PX);
  await check('the zoom is still 0.01: the photo does not shrink', async () => {
    expect((await viewNow(page)).zoom).toBe(MIN_ZOOM);
  });
});

test('VIEW-09.1 Dragging an empty part of the photo moves it [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo);
  const before = await viewNow(page);
  const corners = await cornersNow(page);
  const start = await pointInPhoto(page, EMPTY_SPOT.dx, EMPTY_SPOT.dy);
  await hand.drag(start, { x: start.x + PAN_DX_PX, y: start.y + PAN_DY_PX });
  await check('the photo moved 60 px right and 40 px down; the corners are on the same points; '
    + 'Fit to screen shows', async () => {
    const after = await viewNow(page);
    expect(after.panX - before.panX).toBeCloseTo(PAN_DX_PX, 3);
    expect(after.panY - before.panY).toBeCloseTo(PAN_DY_PX, 3);
    expect(after.zoom).toBe(before.zoom);
    expect(await cornersNow(page)).toEqual(corners);
    await expect(page.locator('#btnFit')).toBeVisible();
  });
});

test('VIEW-09.2 On Overlay with no logo, a drag does nothing [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo, 'overlay');
  const before = await viewNow(page);
  const middle = await photoMiddle(page);
  await hand.drag(middle, { x: middle.x + PAN_DX_PX, y: middle.y + PAN_DY_PX });
  await check('the photo does not move', async () => {
    expect(await viewNow(page)).toEqual(before);
  });
});

test('VIEW-10.1 A double tap fits the photo again [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo);
  await pinchMiddle(page);
  await check('the photo zooms in; Fit to screen shows in the top bar', async () => {
    expect((await viewNow(page)).isFitted).toBe(false);
    await expect(page.locator('#btnFit')).toBeVisible();
  });
  await doubleTapAt(page, hand, await photoMiddle(page));
  await check('the photo is back at its fitted size and place; Fit to screen has gone',
    async () => {
      expect((await viewNow(page)).isFitted).toBe(true);
      await expect(page.locator('#btnFit')).toBeHidden();
    });
});

test('VIEW-10.2 Two taps too slow or too far apart don\'t fit [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo);
  const middle = await photoMiddle(page);
  await pinchMiddle(page);
  const zoomed = await viewNow(page);
  await check('the photo zooms in', () => {
    expect(zoomed.isFitted).toBe(false);
  });
  // The photo is still as the pinch left it.
  const expectZoomed = async () => {
    expect(await viewNow(page)).toEqual(zoomed);
  };
  await tapAt(page, hand, middle);
  await check('the photo stays zoomed in', expectZoomed);
  await page.waitForTimeout(SLOW_TAP_MS);
  await tapAt(page, hand, middle);
  await check('the photo stays zoomed in: two taps half a second apart are not a double tap',
    expectZoomed);
  await page.waitForTimeout(SLOW_TAP_MS);
  await tapAt(page, hand, middle);
  await check('the photo stays zoomed in', expectZoomed);
  await tapAt(page, hand, { x: middle.x + FAR_TAP_PX, y: middle.y });
  await check('the photo stays zoomed in: two quick taps 40 px apart are not a double tap',
    expectZoomed);
});

test('VIEW-10.3 A double tap does nothing while a Levels pick is armed [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnLevels(page, testInfo);
  await pinchAt(page, await spotOnPage(page, SPOTS.white), PINCH_START_PX, PINCH_END_PX);
  const zoomed = await viewNow(page);
  const white = await spotOnPage(page, SPOTS.white);
  await check('the photo zooms in; the white background is still in the photo area', async () => {
    expect(zoomed.isFitted).toBe(false);
    const area = await page.locator('#view').boundingBox();
    expect(white.x).toBeGreaterThan(area.x);
    expect(white.x).toBeLessThan(area.x + area.width);
    expect(white.y).toBeGreaterThan(area.y);
    expect(white.y).toBeLessThan(area.y + area.height);
  });
  await hand.tap(pickButton(page, 'white'));
  await check('Pick white is selected', async () => {
    expect(await armedPick(page)).toBe('white');
  });
  await doubleTapAt(page, hand, white);
  await check('the color patch fills with the background\'s off-white (each within 3 of 225, '
    + '226, 217); the photo stays zoomed in', async () => {
    const color = await patchFill(page, 'white');
    expect(color).not.toBeNull();
    color.forEach((value, i) => {
      expect(Math.abs(value - BACKGROUND_WHITE[i])).toBeLessThanOrEqual(PICK_TOLERANCE);
    });
    expect(await viewNow(page)).toEqual(zoomed);
  });
});

test('VIEW-10.4 A double tap does nothing while Tap to find card is armed [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo);
  await pinchMiddle(page);
  const zoomed = await viewNow(page);
  await check('the photo zooms in', () => {
    expect(zoomed.isFitted).toBe(false);
  });
  await openOptions(page, hand, 'perspective');
  await check('PERSPECTIVE OPTIONS rise over the photo, with Tap to find card among them',
    async () => {
      expect(await page.evaluate(() => window.CF.isSheetOpen(
        document.getElementById('perspectiveSheet'),
      ))).toBe(true);
      await expect(page.locator('#btnFindCard')).toBeVisible();
    });
  await hand.tap(page.locator('#btnFindCard'));
  await waitForSheet(page, 'perspective', false);
  await check('the options close; the line above the controls reads "Tap the card in the '
    + 'photo."', async () => {
    await expect(page.locator('#perspectiveSheet')).toBeHidden();
    await expect(page.locator('#perspectiveStatus .status-text'))
      .toHaveText('Tap the card in the photo.');
  });
  const runsBefore = await page.evaluate(() => window.__straightener.app.detection.running);
  await doubleTapAt(page, hand, await photoMiddle(page));
  await page.waitForFunction(runs => {
    const detection = window.__straightener.app.detection;
    return detection.running > runs && detection.message === '';
  }, runsBefore);
  await check('the card is found: the line reads Nudge Corner 1 of 4 again, with "Confidence" '
    + 'and a percentage at its right; the photo stays zoomed in', async () => {
    const line = page.locator('#perspectiveLine');
    await expect(line).toBeVisible();
    await expect(line.locator('.line-label')).toHaveText(/^nudge$/i);
    await expect(line.locator('.line-value')).toHaveText('Corner 1 of 4');
    await expect(line.locator('.line-readout')).toHaveText(/^Confidence \d+%$/);
    expect(await viewNow(page)).toEqual(zoomed);
  });
});

test('VIEW-10.5 A press that showed Levels\' compare doesn\'t count toward a double tap [phone]',
  async ({ page, check }, testInfo) => {
    const hand = await startOnLevels(page, testInfo);
    await hand.tap(page.locator('#toolAutoLevels'));
    await check('a white dot shows on the Levels tab in the step tabs', async () => {
      await expect(levelsDot(page)).toBeVisible();
    });
    const middle = await photoMiddle(page);
    await pinchAt(page, middle, PINCH_START_PX, PINCH_END_PX);
    const zoomed = await viewNow(page);
    await check('the photo zooms in', () => {
      expect(zoomed.isFitted).toBe(false);
    });
    const press = await pressThenTap(page, middle);
    await check('the comparison started, and the press lasted under 0.3 seconds in all', () => {
      expect(press.isCompared).toBe(true);
      expect(press.holdMs).toBeLessThan(TAP_MS);
    });
    const view = await viewNow(page);
    await check('the photo stays zoomed in: the press and the tap were not a double tap', () => {
      expect(view.zoom).toBe(zoomed.zoom);
    });
  });

// A point of the framed photo on the page, as fractions of the crop (0 to 1 across and down).
function cropPointOnPage(page, across, down) {
  return page.evaluate(([acrossFrac, downFrac]) => {
    const crop = window.__straightener.app.geometry.crop;
    const view = window.CF.currentView();
    const box = document.getElementById('view').getBoundingClientRect();
    const [x, y] = window.CF.toScreen(view,
      [crop.x + acrossFrac * crop.width, crop.y + downFrac * crop.height]);
    return { x: box.left + x, y: box.top + y };
  }, [across, down]);
}

// The logo on the photo and how many undo steps there are: { overlay, undoSteps }.
const logoAndSteps = page => page.evaluate(() => ({
  overlay: window.__straightener.app.state.overlay,
  undoSteps: window.CF.History.undo.length,
}));

test('VIEW-10.6 On Overlay a double tap moves nothing and adds no undo step [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo, 'overlay');
  await chooseLogo(page, hand, page.locator('#btnOverlayAdd'), fixtureLogo(LOGO_FILE));
  const before = await logoAndSteps(page);
  const viewBefore = await viewNow(page);
  const spot = await cropPointOnPage(page, AWAY_FROM_RINGS.across, AWAY_FROM_RINGS.down);
  await doubleTapAt(page, hand, spot);
  await check('the logo stays where it was, at the same size; the photo does not move or change '
    + 'size', async () => {
    expect(await logoAndSteps(page)).toEqual(before);
    expect(await viewNow(page)).toEqual(viewBefore);
  });
  await hand.tap(page.locator('#btnUndo'));
  await check('the logo goes, and Undo is greyed out: the double tap added no undo step',
    async () => {
      expect((await logoAndSteps(page)).overlay).toBeNull();
      await expect(page.locator('#btnUndo')).toBeDisabled();
    });
});

test('VIEW-11.1 Zoomed far in on Perspective, the card\'s corner is sharp, for a person to '
  + 'judge [desktop]', async ({ page, check }, testInfo) => {
  await startOn(page, testInfo, 'perspective', { address: SMALL_COPY_LINK });
  // The link's effect, which the case's Build line states: no row of its own.
  await check('the on-screen copy is 512 px on its long side, a quarter of the photo\'s 2048',
    async () => {
      const copy = await page.evaluate(() => {
        const preview = window.__straightener.app.preview.canvas;
        return Math.max(preview.width, preview.height);
      });
      expect(copy).toBe(SMALL_COPY_PX);
    });
  // The pointer on the card's corner, at whole CSS px: the wheel's events carry whole px, and
  // the zoom keeps the point under them still.
  const handle = await handleOnPage(page, 0);
  const corner = { x: Math.round(handle.x), y: Math.round(handle.y) };
  const fitted = await viewNow(page);
  const underBefore = await worldUnder(page, corner);
  for (let i = 0; i < SHARP_NOTCHES; i++) await wheelAt(page, corner, -NOTCH_PX);
  await check('the photo is about 11 times its fitted size, the card\'s corner still under the '
    + 'pointer; one photo pixel covers about 4 × 4 screen pixels', async () => {
    const view = await viewNow(page);
    expect(view.zoom / fitted.zoom).toBeCloseTo(NOTCH_FACTOR ** SHARP_NOTCHES, 5);
    expect(Math.abs(view.zoom - SHARP_ZOOM)).toBeLessThan(SHARP_ZOOM_TOLERANCE);
    const underAfter = await worldUnder(page, corner);
    expect(Math.abs(underAfter[0] - underBefore[0])).toBeLessThan(WORLD_TOLERANCE_PX);
    expect(Math.abs(underAfter[1] - underBefore[1])).toBeLessThan(WORLD_TOLERANCE_PX);
  });
  await waitForStill(page);
  const source = await drawnSource(page, corner, SHARP_SPOT_RADIUS_PX);
  await check('around the card\'s corner the drawing is the full-resolution photo, not the copy',
    () => {
      expect(source.fromPhoto).toBeLessThan(SAME_DRAWING_MAX);
      expect(source.fromCopy).toBeGreaterThan(COPY_DIFFERENT_MIN);
    });
  await check.eye('the card\'s corner and its printed edge are crisp: each edge goes from dark '
    + 'to light within about 4 screen pixels, not a soft blur about 15 screen pixels wide');
});

// A point of the straightened frame (its own px) near one of its corners but outside the tilted
// photo, where only the fill shows: the first of the frame's four corners, FRAME_CORNER_PX in
// from both edges, that the photo's outline doesn't hold.
function pointOutsidePhoto(page, insetPx = FRAME_CORNER_PX) {
  return page.evaluate(inset => {
    const app = window.__straightener.app;
    const { width, height } = app.geometry.rotated;
    const source = app.state.source;
    const outline = [[0, 0], [source.width, 0], [source.width, source.height], [0, source.height]]
      .map(([x, y]) => window.CF.Mat3.apply(app.geometry.sourceToRotated, x, y));
    // True when a point is inside the outline: on the same side of each of its four edges.
    const isInside = ([x, y]) => outline.every((start, i) => {
      const end = outline[(i + 1) % outline.length];
      return (end[0] - start[0]) * (y - start[1]) - (end[1] - start[1]) * (x - start[0]) >= 0;
    });
    const candidates = [
      [inset, inset],
      [width - inset, inset],
      [width - inset, height - inset],
      [inset, height - inset],
    ];
    return candidates.find(point => !isInside(point)) || null;
  }, insetPx);
}

test('VIEW-12.1 Around a tilted photo: the fill color, or a checkerboard, for a person to judge '
  + '[phone]', async ({ page, check }, testInfo) => {
  const hand = await startOn(page, testInfo, 'rotate');
  await hand.tap(page.locator('#rotateAngle'));
  await page.locator('#rotateAngleField').waitFor({ state: 'visible' });
  await page.keyboard.type(TILT_DEG);
  await hand.tap(page.locator('#btnAngleDone'));
  const frameCorner = await pointOutsidePhoto(page);
  await waitForStill(page);
  await check('the photo is tilted 10°; the triangles outside it are white', async () => {
    expect(await colorsAround(page, frameCorner, SPOT_RADIUS_PX)).toEqual([FILL_WHITE]);
  });
  await check.eye('the photo tilted 10°; the four triangles between its edges and the frame\'s '
    + 'are white');
  await goToStep(page, 'export', hand);
  await check('Export\'s controls show, with Download', async () => {
    await expect(page.locator('#btnDownload')).toBeVisible();
  });
  await openOptions(page, hand, 'export');
  await check('EXPORT OPTIONS rise over the photo; Fill outside photo reads White', async () => {
    expect(await page.evaluate(() => window.CF.isSheetOpen(
      document.getElementById('exportSheet'),
    ))).toBe(true);
    await expect(page.locator('#fill')).toBeVisible();
    await expect(page.locator('#fill option:checked')).toHaveText('White');
  });
  await page.locator('#fill').selectOption('transparent');
  await check('Fill outside photo reads Transparent', async () => {
    await expect(page.locator('#fill option:checked')).toHaveText('Transparent');
  });
  await closeOptions(page, hand, 'export');
  await check('the options close', async () => {
    await expect(page.locator('#exportSheet')).toBeHidden();
  });
  await goToStep(page, 'rotate', hand);
  await waitForStill(page);
  await check('the four triangles show a grey checkerboard of two greys', async () => {
    const colors = await colorsAround(page, frameCorner, CHECKER_RADIUS_PX);
    expect(colors).toEqual(expect.arrayContaining(CHECKER_GREYS));
    for (const color of colors) {
      const [red, green, blue] = color.split(',').map(Number);
      expect([green, blue]).toEqual([red, red]);
    }
  });
  await check.eye('the four triangles show a grey checkerboard of two greys');
});

test('VIEW-13.1 Rotate shows the whole frame; Levels shows only the crop, for a person to judge '
  + '[phone]', async ({ page, check }, testInfo) => {
  const hand = await startOn(page, testInfo, 'rotate');
  await waitForStill(page);
  await check('Rotate fits the whole straightened frame, taller than wide', async () => {
    await expectFitted(page, FIT_GAP_PX);
    const rotated = await page.evaluate(() => window.__straightener.app.geometry.rotated);
    expect(rotated.height).toBeGreaterThan(rotated.width);
  });
  await check.eye('the whole straightened photo, taller than wide, with the square crop drawn '
    + 'as a dashed box on it');
  await goToStep(page, 'levels', hand);
  await waitForStill(page);
  await check('Levels fits only the square crop, across the photo area\'s width', async () => {
    const gaps = await photoGaps(page);
    expect(Math.abs(gaps.left - FIT_GAP_PX)).toBeLessThan(GAP_TOLERANCE_PX);
    expect(Math.abs(gaps.right - FIT_GAP_PX)).toBeLessThan(GAP_TOLERANCE_PX);
    const width = gaps.areaWidth - gaps.left - gaps.right;
    const height = gaps.areaHeight - gaps.top - gaps.bottom;
    expect(Math.abs(width - height)).toBeLessThan(GAP_TOLERANCE_PX);
  });
  await check.eye('only the square inside the crop shows, filling the width of the photo area');
});

// Records that the photo area shows no photo, only the stage and a line of text. drawnText:
// the words the line must be, read from recordDrawnText's list, or null not to read them.
async function checkMessageOnly(page, check, description, drawnText = null) {
  await waitForStill(page);
  const lastDrawn = await page.evaluate(() => (window.testDrawnTexts || []).slice(-1)[0]);
  await check(description, async () => {
    expect(await page.evaluate(() => window.CF.currentView())).toBeNull();
    expect(await stageShare(page)).toBeGreaterThan(MESSAGE_ONLY_SHARE);
    if (drawnText !== null) expect(lastDrawn).toBe(drawnText);
  });
  await check.eye(`${description}: the words are grey, centered in the photo area`);
}

test('VIEW-14.1 With the corners crossed, the later steps show a message, for a person to '
  + 'judge [phone]', async ({ page, check }, testInfo) => {
  await recordDrawnText(page);
  const hand = await startOn(page, testInfo);
  await crossTheCorners(page, hand);
  await check('the outline crosses itself', async () => {
    expect(await page.evaluate(() => window.__straightener.app.geometry.ok)).toBe(false);
  });
  await goToStep(page, 'rotate', hand);
  // Ruling R82 changed the words on Perspective only: every later step still names the step.
  await checkMessageOnly(page, check,
    'on Rotate, no photo, only "Fix the corners in Perspective first."',
    'Fix the corners in Perspective first.');
});

test('VIEW-14.2 Preview with the corners crossed asks to fix them, for a person to judge '
  + '[phone]', async ({ page, check }, testInfo) => {
  await recordDrawnText(page);
  const hand = await startOn(page, testInfo);
  await crossTheCorners(page, hand);
  await check('the outline crosses itself', async () => {
    expect(await page.evaluate(() => window.__straightener.app.geometry.ok)).toBe(false);
  });
  await hand.tap(page.locator('#toolPreview'));
  // Ruling R82: on Perspective itself the words are these.
  await checkMessageOnly(page, check, 'with Preview on, no photo, only "Fix the corners first."',
    'Fix the corners first.');
});

test('VIEW-14.3 A pair\'s joined preview with one side\'s corners crossed, for a person to '
  + 'judge [phone]', async ({ page, check }, testInfo) => {
  await recordDrawnText(page);
  const hand = await makePair(page, testInfo);
  await crossTheCorners(page, hand);
  await check('the back\'s outline crosses itself', async () => {
    expect(await page.evaluate(() => window.__straightener.app.geometry.ok)).toBe(false);
  });
  await goToStep(page, 'export', hand);
  await check('Together is chosen', async () => {
    await expect(outputSegment(page, 'together')).toHaveAttribute('aria-pressed', 'true');
  });
  // Ruling R98: the words name the side whose corners are crossed.
  await checkMessageOnly(page, check,
    'on Export, no photo, only "Fix the back’s corners in Perspective first."',
    'Fix the back’s corners in Perspective first.');
});

test('VIEW-15.1 On Perspective the pointer is a hand, a move pointer on a handle, a crosshair '
  + 'to find the card [desktop]', async ({ page, check }, testInfo) => {
  await startOn(page, testInfo);
  const empty = await pointInPhoto(page, EMPTY_SPOT.dx, EMPTY_SPOT.dy);
  await page.mouse.move(empty.x, empty.y);
  await check('the pointer is an open hand', async () => {
    expect(await pointerShape(page)).toBe('grab');
  });
  await page.mouse.down();
  await page.mouse.move(empty.x + 10, empty.y + 10, { steps: 4 });
  await check('the hand is closed', async () => {
    expect(await pointerShape(page)).toBe('grabbing');
  });
  await page.mouse.up();
  await check('the pointer is an open hand again', async () => {
    expect(await pointerShape(page)).toBe('grab');
  });
  const corner = await handleOnPage(page, 0);
  await page.mouse.move(corner.x, corner.y, { steps: 4 });
  await check('the pointer is the four-way move arrow', async () => {
    expect(await pointerShape(page)).toBe('move');
  });
  await page.locator('#btnFindCard').click();
  await check('the line above the controls reads "Tap the card in the photo."', async () => {
    await expect(page.locator('#perspectiveStatus .status-text'))
      .toHaveText('Tap the card in the photo.');
  });
  const middle = await photoMiddle(page);
  await page.mouse.move(middle.x, middle.y, { steps: 4 });
  await check('the pointer is a crosshair', async () => {
    expect(await pointerShape(page)).toBe('crosshair');
  });
});

test('VIEW-15.2 On Crop the pointer moves the box inside it and resizes on a handle [desktop]',
  async ({ page, check }, testInfo) => {
    await startOn(page, testInfo, 'crop');
    const moveTo = async point => page.mouse.move(point.x, point.y, { steps: 4 });
    await moveTo(await cropHandleOnPage(page, 'middle'));
    await check('the pointer is the four-way move arrow', async () => {
      expect(await pointerShape(page)).toBe('move');
    });
    await moveTo(await cropHandleOnPage(page, 'nw'));
    await check('the pointer is a diagonal resize arrow (top-left to bottom-right)', async () => {
      expect(await pointerShape(page)).toBe('nwse-resize');
    });
    await moveTo(await cropHandleOnPage(page, 'e'));
    await check('the pointer is a left-right resize arrow', async () => {
      expect(await pointerShape(page)).toBe('ew-resize');
    });
    const outside = await page.evaluate(abovePx => {
      const crop = window.__straightener.app.geometry.crop;
      const [x, y] = window.CF.toScreen(window.CF.currentView(),
        [crop.x + crop.width / 2, crop.y]);
      const box = document.getElementById('view').getBoundingClientRect();
      return { x: box.left + x, y: box.top + y - abovePx };
    }, ABOVE_CROP_PX);
    await moveTo(outside);
    await check('the pointer is an open hand', async () => {
      expect(await pointerShape(page)).toBe('grab');
    });
  });

test('VIEW-15.3 A crosshair while a Levels pick is armed [desktop]', async ({
  page,
  check,
}, testInfo) => {
  await startOnLevels(page, testInfo);
  const middle = await photoMiddle(page);
  await page.mouse.move(middle.x, middle.y, { steps: 4 });
  await check('the pointer is an open hand', async () => {
    expect(await pointerShape(page)).toBe('grab');
  });
  await pickButton(page, 'white').click();
  await check('Pick white is selected', async () => {
    expect(await armedPick(page)).toBe('white');
  });
  await page.mouse.move(middle.x + NEAR_MIDDLE_PX, middle.y + NEAR_MIDDLE_PX, { steps: 4 });
  await check('the pointer is a crosshair', async () => {
    expect(await pointerShape(page)).toBe('crosshair');
  });
});

test('VIEW-16.1 A right click on the photo opens no menu [desktop]', async ({
  page,
  check,
}, testInfo) => {
  await startOn(page, testInfo);
  // Notes whether the browser's own menu was held back, once the app has had the event.
  await page.evaluate(() => {
    window.testMenuHeldBack = null;
    window.addEventListener('contextmenu', event => {
      window.testMenuHeldBack = event.defaultPrevented;
    });
  });
  const middle = await photoMiddle(page);
  await page.mouse.click(middle.x, middle.y, { button: 'right' });
  await check('no menu opens: the browser\'s own menu is held back', async () => {
    expect(await page.evaluate(() => window.testMenuHeldBack)).toBe(true);
  });
});

test('VIEW-16.2 Clicking the photo gives it the focus, with no focus ring [desktop] [webkit]',
  async ({ page, check }, testInfo) => {
    await startOn(page, testInfo, 'rotate');
    for (let press = 0; press < RING_TABS; press++) await page.keyboard.press('Tab');
    await check('a white ring, 2 px wide, is drawn around a control', async () => {
      const ring = await page.evaluate(() => {
        const focused = document.activeElement;
        const style = getComputedStyle(focused);
        return {
          isControl: focused !== document.body && focused.id !== 'view',
          isVisible: focused.matches(':focus-visible'),
          outline: `${style.outlineStyle} ${style.outlineWidth} ${style.outlineColor}`,
        };
      });
      expect(ring).toEqual({ isControl: true, isVisible: true, outline: RING_OUTLINE });
    });
    const empty = await pointInPhoto(page, EMPTY_SPOT.dx, EMPTY_SPOT.dy);
    await page.mouse.click(empty.x, empty.y);
    await check('the photo has the focus (its name is "Photo editing canvas"); no ring is '
      + 'drawn around it', async () => {
      const view = page.locator('#view');
      await expect(view).toBeFocused();
      await expect(view).toHaveAttribute('aria-label', 'Photo editing canvas');
      expect(await view.evaluate(el => el.classList.contains('is-keyboard-focus'))).toBe(false);
      expect(await view.evaluate(el => getComputedStyle(el).outlineStyle)).toBe('none');
    });
  });

// Sends `type` (a cancelable event) to the element `selector` names and returns whether the page
// cancelled it.
function isCancelled(page, selector, type) {
  return page.evaluate(({ target, eventType }) => {
    const event = new Event(eventType, { bubbles: true, cancelable: true });
    document.querySelector(target).dispatchEvent(event);
    return event.defaultPrevented;
  }, { target: selector, eventType: type });
}

test('VIEW-17.2 The page cancels the pinch zoom and text selection, but not in a text box '
  + '[phone] [webkit]', async ({ page, check }, testInfo) => {
  const hand = await startOn(page, testInfo, 'rotate');
  await check('the page cancels it (Safari\'s gesture start)', async () => {
    expect(await isCancelled(page, '#view', 'gesturestart')).toBe(true);
  });
  await check('the page cancels it (a text selection start on STRAIGHTEN)', async () => {
    expect(await isCancelled(page, '#rotateStraightenLine .line-label', 'selectstart')).toBe(true);
  });
  await hand.tap(page.locator('#rotateAngle'));
  await check('a text box takes its place', async () => {
    await expect(page.locator('#rotateAngleField')).toBeVisible();
  });
  await check('the page lets it go ahead (a text selection start in the text box)', async () => {
    expect(await isCancelled(page, '#rotateAngleField', 'selectstart')).toBe(false);
  });
});

test('VIEW-18.1 The photo is drawn at the screen\'s pixel density [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  await startOn(page, testInfo);
  await check('the photo area is 390 × 544 CSS px; the drawing is 1170 × 1632 pixels', async () => {
    expect(await drawingSize(page)).toEqual({
      width: 390 * PHONE_DENSITY,
      height: 544 * PHONE_DENSITY,
      cssWidth: 390,
      cssHeight: 544,
    });
  });
});

test.describe('on a screen of 4 device pixels per CSS pixel', () => {
  test.use({ deviceScaleFactor: 4 });

  test('VIEW-18.2 On a denser screen the drawing stops at 3 pixels per CSS pixel [phone]',
    async ({ page, check }, testInfo) => {
      await startOn(page, testInfo);
      await check('the photo area is 390 × 544 CSS px; the drawing is 1170 × 1632 pixels',
        async () => {
          expect(await page.evaluate(() => window.devicePixelRatio)).toBe(4);
          expect(await drawingSize(page)).toEqual({
            width: 390 * PHONE_DENSITY,
            height: 544 * PHONE_DENSITY,
            cssWidth: 390,
            cssHeight: 544,
          });
        });
    });
});
