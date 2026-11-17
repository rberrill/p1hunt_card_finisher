// The Overlay step's cases (tests/catalog/overlay.md): adding a logo, the files it takes, where
// it lands, the saved logo, Opacity, the move and size pads, the tools, the gestures on the
// photo, the snap rings, and how the logo goes into the saved file.
// Each test drives the app as a person would, through hand.tap and hand.drag (a finger on the
// phone targets, the mouse on the wide ones), and reads the app's state only to find a place to
// press or to check a result. The logos are the files in tests/fixtures/ that each case names;
// only a file over the size limit, too big to keep there, is made in the test.
'use strict';
const { test, expect } = require('./support/case.js');
const { goToStep, openOptions, stepNow, offsetBy } = require('./support/app.js');
const {
  pickWith,
  waitForPhoto,
  waitForSaved,
  reloadToStart,
  watchStorageAndDownloads,
  storageWritesSince,
  pageNowMs,
  refuseStorage,
  toastNow,
  storedRecord,
} = require('./support/start-and-session.js');
const {
  choiceButton,
  selectedChoices,
  readoutText,
  downloadAnswering,
  crossTheCorners,
  readSavedPixels,
} = require('./support/export.js');
const {
  tapAt,
  holdButton,
  sendTouch,
  pinchAt,
  holdDragAt,
  releaseDrag,
} = require('./support/perspective.js');
const { makePair, switchTo } = require('./support/front-and-back.js');
const {
  MEGABYTE,
  PHOTO,
  startOnOverlay,
  fixtureLogo,
  oversizedPng,
  logoId,
  chooseLogo,
  chooseBadLogo,
  logoPlacement,
  logoBox,
  logoOnPage,
  cropOnPage,
  ringOnPage,
  viewNow,
  undoSteps,
  holdSlide,
  liftSlide,
  slide,
  colorOnPage,
  nextFrames,
  tapAndLookAtLogo,
  ringMarksAt,
  readSavedLogo,
  bandSpread,
  waitForSavedSettings,
} = require('./support/overlay.js');

const SECOND_PHOTO = 'IMG_9075.JPEG';
// The logos from tests/fixtures/ (described at the top of tests/catalog/overlay.md).
const BLUE_DISC = 'blue-disc.png';
const GREEN_SQUARE = 'green-logo.png';
const GREEN_WIDE = 'overlay-green-wide.jpg';
const BLUE_OVAL = 'overlay-blue-oval.webp';
const TALL_OVAL = 'overlay-tall-oval.png';
const SPLIT_SVG = 'overlay-split.svg';
const SPLIT_PNG = 'overlay-split-2048.png';
const TWO_GREYS = 'overlay-greys.png';
const DARK_AND_LIGHT_GRAYS = 'overlay-dark-and-light-grays.png';
const NOT_A_LOGO = 'not-a-logo.png';
const GIF_LOGO = 'logo.gif';
// The words on the screen.
const HINT = 'Add a logo or watermark: PNG, WebP, JPG or SVG, up to 5 MB.';
const NOT_SUPPORTED = 'That file type isn’t supported. Use PNG, WebP, JPG or SVG.';
const CANT_READ = 'Couldn’t read that image. Try another PNG, WebP, JPG or SVG file.';
// The warning for a logo the browser won't keep, in ruling R59's words ("logo"), and the
// pattern a case that isn't about the words reads it with: R59's words or today's.
const CANT_SAVE = 'This logo works on this photo, but it can’t be saved in this browser.';
const CANT_SAVE_EITHER = new RegExp('This (logo|overlay) works on this photo, but it can’t be '
  + 'saved in this browser\\.');
const FIX_CORNERS = 'Fix the corners in Perspective first.';
// A new logo's width as a fraction of the crop's width (CardEngine.OVERLAY_DEFAULTS.width).
const START_WIDTH = 0.25;
// One move pad press: 0.5% of the crop's width (CONFIG.overlay.nudgePct); one size pad press
// multiplies the width by 1.05 (CONFIG.overlay.sizeStep).
const NUDGE_FRAC = 0.005;
const SIZE_STEP = 1.05;
// A snapped logo sits 3% of the crop's width in from the edges (OVERLAY_DEFAULTS.snapMargin).
const SNAP_MARGIN_FRAC = 0.03;
// Two presses closer together than this make one undo step, in ms (COALESCE_MS in state.js);
// a person's pause between two separate changes is longer.
const UNDO_GAP_MS = 900;
const PAUSE_MS = 1000;
// How long a held pad key is held, in ms, and the fewest moves it must make in that time: the
// first at once, then one every 60 ms after 350 ms (CONFIG.nudge) gives about 11.
const HOLD_MS = 1000;
const HELD_MOVES_MIN = 6;
// How close two fractions of the crop must be (a placement is kept as exact fractions).
const FRACTION_TOLERANCE = 1e-6;
// How close two positions or sizes on the page must be, in CSS px.
const PAGE_TOLERANCE_PX = 1;
// How close two sizes in the straightened picture must be, in its px.
const PICTURE_TOLERANCE_PX = 0.5;
// A drawn color counts as the logo's blue when blue is above this and red and green below
// NOT_BLUE_MAX (0 to 255); the same bounds, green for blue, make the green logos' green.
const BLUE_MIN = 200;
const NOT_BLUE_MAX = 60;
// How many taps of a pad key make a named "ten taps": a tenth of a quarter-wide logo's width
// per two taps, so ten move it a fifth of its own width.
const TEN_TAPS = 10;
// A gray level between these (0 to 255) is neither the black nor the white half of the split
// logo: the soft part of the edge between them.
const EDGE_GRAY_MIN = 30;
const EDGE_GRAY_MAX = 225;
// The most px of gray a sharp edge may take in a saved file, and the fewest a soft one does.
const SHARP_EDGE_MAX_PX = 2;
const SOFT_EDGE_MIN_PX = 5;
// The size pad's Larger key, and how long it is held to grow a new logo to the crop's full
// width (1.05 a step, about 30 steps).
const LARGER = '#overlaySizePad [data-key="grow"]';
const SMALLER = '#overlaySizePad [data-key="shrink"]';
const GROW_TO_FULL_MS = 2500;
// The wait before a change to the saved logo's place is saved, in ms
// (CONFIG.session.saveDelayMs); how much earlier a timer may seem to fire (the clock's
// rounding), and how much later the save may land (the timer, then the database).
const SAVE_DELAY_MS = 400;
const TIMER_EARLY_MS = 2;
const SAVE_LATE_MS = 150;
// How far a measured ratio of two sizes may be from the expected one, as a fraction.
const RATIO_TOLERANCE = 0.02;
// Where the Opacity slider's knob rests at 100% and its middle, as fractions of its width.
const SLIDER_RIGHT_END = 0.98;
const SLIDER_MIDDLE = 0.5;
// How near a press must be to a corner handle or a ring to take it, in CSS px
// (CONFIG.handle.hitRadius).
const HIT_RADIUS_PX = 24;
// A roll of the wheel big enough to zoom the photo on any other step, in wheel delta px.
const BIG_WHEEL_PX = 300;
// How close a share of a saved image must be in two files: 1.5 px of the smaller one.
const SHARE_TOLERANCE_PX = 1.5;
// How many moves the remaining finger of OVL-18.2 makes.
const FINGER_MOVES = 4;
// How close two colors of a saved JPEG must be to count as the same (0 to 255, per channel).
const SAME_COLOR_TOLERANCE = 12;

// Expects a drawn color ([r, g, b]) to be the logo's blue.
function expectBlue(color) {
  expect(color[0]).toBeLessThan(NOT_BLUE_MAX);
  expect(color[1]).toBeLessThan(NOT_BLUE_MAX);
  expect(color[2]).toBeGreaterThan(BLUE_MIN);
}

// Expects a drawn color not to be the logo's blue.
function expectNotBlue(color) {
  const isBlue = color[0] < NOT_BLUE_MAX && color[1] < NOT_BLUE_MAX && color[2] > BLUE_MIN;
  expect(isBlue).toBe(false);
}

// Expects two numbers to be within `tolerance` of each other.
function expectNear(actual, expected, tolerance) {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance);
}

// A point inside the blue disc but clear of the ring drawn in the photo's middle: a quarter of
// the logo's width left of its middle. placed: from logoOnPage.
const inDisc = placed => ({ x: placed.middle.x - placed.width / 4, y: placed.middle.y });

// Expects a drawn color ([r, g, b]) to be the green logos' green.
function expectGreen(color) {
  expect(color[0]).toBeLessThan(NOT_BLUE_MAX);
  expect(color[1]).toBeGreaterThan(BLUE_MIN);
  expect(color[2]).toBeLessThan(NOT_BLUE_MAX);
}

// Adds the logo file `name` from tests/fixtures/ with Add logo. Returns its id.
function addLogo(page, hand, name) {
  return chooseLogo(page, hand, page.locator('#btnOverlayAdd'), fixtureLogo(name));
}

// Replaces the logo with the file `name` from tests/fixtures/, through Replace logo. Returns the
// new logo's id.
function replaceLogo(page, hand, name) {
  return chooseLogo(page, hand, page.locator('#toolOverlayReplace'), fixtureLogo(name));
}

// Adds blue-disc.png, the logo most cases use. Returns its id.
function addDisc(page, hand) {
  return addLogo(page, hand, BLUE_DISC);
}

// Taps a control `times` times, each tap right after the last (well under 0.9 s apart).
async function tapTimes(hand, locator, times) {
  for (let i = 0; i < times; i++) await hand.tap(locator);
}

// Opens the sample photo `name` with Open (the folder at the top left) and waits for it.
async function openNext(page, hand, name) {
  await pickWith(page, hand, page.locator('#btnOpen'), name);
  await waitForPhoto(page, name);
}

// How many px of the row `row` (red channel values) between `fromX` and `toX` are gray: the
// soft part of an edge between black and white.
function grayCount(row, fromX, toX) {
  return row.slice(fromX, toX).filter(value => (
    value > EDGE_GRAY_MIN && value < EDGE_GRAY_MAX)).length;
}

/// The named action "Save a PNG at N": Export in the step tabs, PNG, the Size `size` (its label),
// then Download, answering the Upscale question with `answer` when it is asked. Returns
// { question, file }: the question's title ('' when none was asked) and the saved file's path.
async function savePngAt(page, hand, size, answer = 'No') {
  await goToStep(page, 'export', hand);
  await hand.tap(choiceButton(page, 'exportFormat', 'PNG'));
  await hand.tap(choiceButton(page, 'exportSize', size));
  const saved = await downloadAnswering(page, hand, answer);
  return { question: saved.question, file: saved.file };
}

// The gray px across the black-to-white edge in the middle of a split logo placed at the start
// and grown to the full width, in a saved file: the row through the image's middle, across its
// middle fifth. Returns { image, gray }.
async function savedEdgeGray(page, file) {
  const image = await readSavedLogo(page, file, { rowFrac: 0.5 });
  const fifth = Math.round(image.width / 10);
  const middle = Math.round(image.width / 2);
  return { image, gray: grayCount(image.row, middle - fifth, middle + fifth) };
}

test('OVL-01.1 Add logo picks a file and places it [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnOverlay(page, testInfo);
  await check('the line above the controls reads "' + HINT + '"; the red Add logo button shows; '
    + 'no logo is on the photo', async () => {
    await expect(page.locator('#overlayHintLine')).toHaveText(HINT);
    await expect(page.locator('#btnOverlayAdd')).toBeVisible();
    await expect(page.locator('#btnOverlayAdd')).toHaveClass(/is-main/);
    expect(await logoId(page)).toBeNull();
  });
  const chooser = await pickWith(page, hand, page.locator('#btnOverlayAdd'),
    fixtureLogo(BLUE_DISC));
  const accepted = await page.locator('#overlayInput').getAttribute('accept');
  await check('the file picker opens; it lets you pick one file only, and it offers PNG, WebP, '
    + 'JPG and SVG pictures', () => {
    expect(chooser.isMultiple()).toBe(false);
    for (const type of ['image/png', 'image/webp', 'image/jpeg', 'image/svg+xml']) {
      expect(accepted.split(',')).toContain(type);
    }
  });
  await page.waitForFunction(() => !!window.__straightener.app.state.overlay);
  const placed = await logoOnPage(page);
  const crop = await cropOnPage(page);
  await check('the blue disc shows in the middle of the photo; the line above the controls now '
    + 'reads OPACITY with a slider and 100%', async () => {
    expectBlue(await colorOnPage(page, inDisc(placed)));
    expectNear(placed.middle.x, (crop.left + crop.right) / 2, PAGE_TOLERANCE_PX);
    expectNear(placed.middle.y, (crop.top + crop.bottom) / 2, PAGE_TOLERANCE_PX);
    await expect(page.locator('#overlayOpacityLine')).toBeVisible();
    await expect(page.locator('#overlayOpacity')).toBeVisible();
    await expect(page.locator('#overlayOpacityValue')).toHaveText('100%');
  });
});

test('OVL-01.2 The hint gives the lower limit a link sets [phone]', async ({
  page,
  check,
}, testInfo) => {
  test.fail(true, 'BUG-293, BUG-283');
  const address = `index.html?overlay.maxBytes=${MEGABYTE}`;
  const hand = await startOnOverlay(page, testInfo, { address });
  // Ruling R83: the hint gives the limit in force. A plain reading, so the known defect fails
  // at once.
  const hintWithLimit = HINT.replace('up to 5 MB.', 'up to 1 MB.');
  await check(`the line above the controls reads "${hintWithLimit}": the limit the link set`,
    async () => {
      expect(await page.locator('#overlayHintLine').textContent()).toBe(hintWithLimit);
    });
  const chooser = await chooseBadLogo(page, hand, page.locator('#btnOverlayAdd'),
    oversizedPng(2 * MEGABYTE));
  await check('the file picker opens', () => {
    expect(chooser).toBeTruthy();
  });
  // Ruling R59: messages say "logo".
  await check('a red message takes the line\'s place: "That file is 2.0 MB. The logo limit is '
    + '1 MB."; no logo is on the photo', async () => {
    await expect(page.locator('#overlayStatus')).toHaveText(
      'That file is 2.0 MB. The logo limit is 1 MB.');
    await expect(page.locator('#overlayStatus')).toHaveClass(/is-error/);
    await expect(page.locator('#overlayHintLine')).toBeHidden();
    expect(await logoId(page)).toBeNull();
  });
});

// Expects the logo on the page to be `ratio` times as wide as it is high (within 2%).
async function expectLogoShape(page, ratio) {
  const placed = await logoOnPage(page);
  expect(Math.abs(placed.width / placed.height / ratio - 1)).toBeLessThan(RATIO_TOLERANCE);
}

// Expects the logo on the photo to be the split logo: its left half black, its right half white.
async function expectSplitLogo(page) {
  const placed = await logoOnPage(page);
  const left = await colorOnPage(page, { x: placed.x + placed.width / 8, y: placed.middle.y });
  const right = await colorOnPage(page, {
    x: placed.x + placed.width * 7 / 8,
    y: placed.middle.y,
  });
  expect(Math.max(...left)).toBeLessThan(EDGE_GRAY_MIN);
  expect(Math.min(...right)).toBeGreaterThan(EDGE_GRAY_MAX);
}

test('OVL-02.1 PNG, JPEG, WebP and SVG logos are each placed [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnOverlay(page, testInfo);
  const pngId = await addLogo(page, hand, BLUE_DISC);
  await check('a blue disc shows on the photo, in a square box', async () => {
    expect(pngId).not.toBeNull();
    await expectLogoShape(page, 1);
    expectBlue(await colorOnPage(page, inDisc(await logoOnPage(page))));
  });
  const jpegId = await replaceLogo(page, hand, GREEN_WIDE);
  await check('a green box takes its place, three times as wide as it is high', async () => {
    expect(jpegId).not.toBe(pngId);
    await expectLogoShape(page, 3);
    expectGreen(await colorOnPage(page, inDisc(await logoOnPage(page))));
  });
  const webpId = await replaceLogo(page, hand, BLUE_OVAL);
  await check('a blue oval takes its place, in a box half as wide as it is high', async () => {
    expect(webpId).not.toBe(jpegId);
    await expectLogoShape(page, 0.5);
    const placed = await logoOnPage(page);
    expectBlue(await colorOnPage(page, { x: placed.middle.x, y: placed.y + placed.height / 4 }));
  });
  const svgId = await replaceLogo(page, hand, SPLIT_SVG);
  await check('a black and white box takes its place, twice as wide as it is high', async () => {
    expect(svgId).not.toBe(webpId);
    await expectLogoShape(page, 2);
    await expectSplitLogo(page);
  });
});

test('OVL-02.2 A logo file with no picture type is taken by its name [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnOverlay(page, testInfo);
  const untyped = fixtureLogo(BLUE_DISC, 'application/octet-stream');
  const chooser = await pickWith(page, hand, page.locator('#btnOverlayAdd'), untyped);
  await check('the file picker opens', () => {
    expect(chooser).toBeTruthy();
  });
  await page.waitForFunction(() => !!window.__straightener.app.state.overlay);
  await check('the blue disc shows on the photo, with no message', async () => {
    expectBlue(await colorOnPage(page, inDisc(await logoOnPage(page))));
    await expect(page.locator('#overlayStatus')).toBeHidden();
  });
});

test('OVL-02.3 A GIF is refused [phone]', async ({ page, check }, testInfo) => {
  const hand = await startOnOverlay(page, testInfo);
  const chooser = await chooseBadLogo(page, hand, page.locator('#btnOverlayAdd'),
    fixtureLogo(GIF_LOGO));
  await check('the file picker opens', () => {
    expect(chooser).toBeTruthy();
  });
  await check('a red message takes the place of the hint in the line above the controls: "'
    + NOT_SUPPORTED + '"; no logo is on the photo', async () => {
    await expect(page.locator('#overlayStatus')).toHaveText(NOT_SUPPORTED);
    await expect(page.locator('#overlayStatus')).toHaveClass(/is-error/);
    await expect(page.locator('#overlayHintLine')).toBeHidden();
    expect(await logoId(page)).toBeNull();
  });
});

// The size line on Export at a Size that the crop is smaller than, for a PNG: "Output", the
// crop's own size, then "px · PNG · full crop, not upscaled".
const NOT_UPSCALED_LINE = /^Output (\d+) × (\d+) px · PNG · full crop, not upscaled$/;

test('OVL-02.4 An SVG logo stays sharp in a large export [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnOverlay(page, testInfo);
  await addLogo(page, hand, SPLIT_SVG);
  await check('the logo shows in the middle of the photo: its left half black, its right half '
    + 'white', async () => {
    await expectSplitLogo(page);
  });
  await holdButton(page, hand, LARGER, GROW_TO_FULL_MS);
  await check('the logo grows to the photo\'s full width and stops', async () => {
    expectNear((await logoPlacement(page)).w, 1, FRACTION_TOLERANCE);
  });
  await goToStep(page, 'export', hand);
  await check('the Export step shows', async () => {
    expect(await stepNow(page)).toBe('export');
  });
  await hand.tap(choiceButton(page, 'exportFormat', 'PNG'));
  await check('PNG is selected', async () => {
    expect(await selectedChoices(page, 'exportFormat')).toEqual(['PNG']);
  });
  await hand.tap(choiceButton(page, 'exportSize', '3000'));
  const line = await readoutText(page);
  await check('3000 is selected; the size line reads "Output", the crop\'s own size, then "px · '
    + 'PNG · full crop, not upscaled"', async () => {
    expect(await selectedChoices(page, 'exportSize')).toEqual(['3000']);
    const match = line.match(NOT_UPSCALED_LINE);
    expect(match).not.toBeNull();
    expect(Number(match[1])).toBeLessThan(3000);
  });
  const saved = await downloadAnswering(page, hand, 'Yes');
  await check('the question box asks "Upscale to 3000 px?"', () => {
    expect(saved.question).toBe('Upscale to 3000 px?');
  });
  const { image, gray } = await savedEdgeGray(page, saved.file);
  await check('a PNG of 3000 × 3000 px is saved', () => {
    expect([image.width, image.height]).toEqual([3000, 3000]);
  });
  await check(`where black meets white in the middle of the logo, the edge is sharp: at most `
    + `${SHARP_EDGE_MAX_PX} px of gray`, () => {
    expect(gray).toBeLessThanOrEqual(SHARP_EDGE_MAX_PX);
  });
});

// The named action "Save the photo": Export in the step tabs, then Download, answering the
// Upscale question with `answer`. Returns what downloadAnswering returns.
async function saveThePhoto(page, hand, answer) {
  await goToStep(page, 'export', hand);
  return downloadAnswering(page, hand, answer);
}

test('OVL-02.5 A logo\'s see-through parts stay see-through in the saved file [phone] [webkit]',
  async ({ page, check }, testInfo) => {
    const hand = await startOnOverlay(page, testInfo);
    const before = await saveThePhoto(page, hand, 'No');
    await check('the question box asks "Upscale to 2000 px?"', () => {
      expect(before.question).toBe('Upscale to 2000 px?');
    });
    await check('a first file is saved, with no logo', async () => {
      expect(before.bytes).toBeGreaterThan(0);
      expect(await logoId(page)).toBeNull();
    });
    await goToStep(page, 'overlay', hand);
    await check('the Overlay step shows, with no logo', async () => {
      expect(await stepNow(page)).toBe('overlay');
      expect(await logoId(page)).toBeNull();
    });
    await addDisc(page, hand);
    await check('the blue disc shows in the middle of the photo', async () => {
      expectBlue(await colorOnPage(page, inDisc(await logoOnPage(page))));
      expectNear((await logoPlacement(page)).cx, 0.5, FRACTION_TOLERANCE);
    });
    const box = await logoBox(page);
    const placed = await logoPlacement(page);
    const after = await saveThePhoto(page, hand, 'No');
    await check('the question box asks "Upscale to 2000 px?"', () => {
      expect(after.question).toBe('Upscale to 2000 px?');
    });
    await check('a second file is saved', () => {
      expect(after.bytes).toBeGreaterThan(0);
    });
    // Points as fractions of the saved image: just inside the logo box's top-left corner
    // (outside the disc) and a point inside the disc.
    const corner = [
      (box.left + box.width * 0.08) / placed.cropWidth,
      (box.top + box.height * 0.08) / placed.cropHeight,
    ];
    const inside = [
      (box.left + box.width * 0.3) / placed.cropWidth,
      (box.top + box.height * 0.5) / placed.cropHeight,
    ];
    const without = await readSavedPixels(page, before.file, [corner, inside]);
    const withLogo = await readSavedPixels(page, after.file, [corner, inside]);
    await check('just inside the top-left corner of the logo\'s square the second file shows the '
      + 'photo, the same as the first; inside the disc the second file is blue', () => {
      for (let channel = 0; channel < 3; channel++) {
        expectNear(withLogo.pixels[0][channel], without.pixels[0][channel], SAME_COLOR_TOLERANCE);
      }
      expectBlue(withLogo.pixels[1]);
      expectNotBlue(without.pixels[1]);
    });
  });

// The shared body of OVL-02.6 and OVL-02.7: at `address`, adds overlay-split-2048.png, grows it
// to the full width and saves a PNG at 3000, answering Yes, checking each row on the way.
// Returns { image, gray } for the saved file, as savedEdgeGray does.
async function splitLogoEdge(page, check, testInfo, address) {
  const hand = await startOnOverlay(page, testInfo, { address });
  await addLogo(page, hand, SPLIT_PNG);
  await check('the logo shows in the middle of the photo: its left half black, its right half '
    + 'white', async () => {
    await expectSplitLogo(page);
  });
  await holdButton(page, hand, LARGER, GROW_TO_FULL_MS);
  await check('the logo grows to the photo\'s full width and stops', async () => {
    expectNear((await logoPlacement(page)).w, 1, FRACTION_TOLERANCE);
  });
  const saved = await savePngAt(page, hand, '3000', 'Yes');
  await check('the question box asks "Upscale to 3000 px?"', () => {
    expect(saved.question).toBe('Upscale to 3000 px?');
  });
  return savedEdgeGray(page, saved.file);
}

test('OVL-02.6 A large PNG logo stays sharp in a large export [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const { image, gray } = await splitLogoEdge(page, check, testInfo, undefined);
  await check(`a PNG is saved; in it, across the logo's middle, the black turns white within `
    + `${SHARP_EDGE_MAX_PX} px`, () => {
    expect([image.width, image.height]).toEqual([3000, 3000]);
    expect(gray).toBeLessThanOrEqual(SHARP_EDGE_MAX_PX);
  });
});

test('OVL-02.7 A logo larger than the cap is scaled down to it [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const address = 'index.html?overlay.maxPx=256';
  const { image, gray } = await splitLogoEdge(page, check, testInfo, address);
  await check(`a PNG is saved; in it, across the logo's middle, the edge between black and white `
    + `is soft: ${SOFT_EDGE_MIN_PX} px of gray or more`, () => {
    expect([image.width, image.height]).toEqual([3000, 3000]);
    expect(gray).toBeGreaterThanOrEqual(SOFT_EDGE_MIN_PX);
  });
});

// One key of the move pad, by its direction: 'left', 'up', 'down' or 'right'.
const MOVE_KEY_VALUES = { left: '-1,0', up: '0,-1', down: '0,1', right: '1,0' };
// The move pad's key for `direction`.
const moveKey = (page, direction) => page.locator(
  `#overlayMovePad [data-key="${MOVE_KEY_VALUES[direction]}"]`);

test('OVL-03.1 A new logo lands in the middle, a quarter wide, at 100% [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnOverlay(page, testInfo);
  const chooser = await pickWith(page, hand, page.locator('#btnOverlayAdd'),
    fixtureLogo(BLUE_DISC));
  await check('the file picker opens', () => {
    expect(chooser).toBeTruthy();
  });
  await page.waitForFunction(() => !!window.__straightener.app.state.overlay);
  const placed = await logoPlacement(page);
  await check('the logo\'s middle is on the middle of the photo, its width a quarter of the '
    + 'photo\'s; the line above the controls reads OPACITY 100%', async () => {
    expectNear(placed.cx, 0.5, FRACTION_TOLERANCE);
    expectNear(placed.cy, 0.5, FRACTION_TOLERANCE);
    expectNear(placed.w, START_WIDTH, FRACTION_TOLERANCE);
    expect(placed.opacity).toBe(1);
    await expect(page.locator('#overlayOpacityValue')).toHaveText('100%');
  });
  await hand.tap(page.locator('#btnUndo'));
  await check('the logo is gone and Add logo shows again', async () => {
    expect(await logoId(page)).toBeNull();
    await expect(page.locator('#btnOverlayAdd')).toBeVisible();
  });
});

test('OVL-03.2 Two logos added within 0.9 s are two undo steps [phone]', async ({
  page,
  check,
}, testInfo) => {
  test.fail(true, 'BUG-080');
  const hand = await startOnOverlay(page, testInfo);
  const startedMs = Date.now();
  const firstId = await addDisc(page, hand);
  const secondId = await replaceLogo(page, hand, GREEN_SQUARE);
  const tookMs = Date.now() - startedMs;
  await check('the green square has taken the blue disc\'s place', async () => {
    expect(secondId).not.toBe(firstId);
    expect(tookMs).toBeLessThan(UNDO_GAP_MS);
    expectGreen(await colorOnPage(page, inDisc(await logoOnPage(page))));
  });
  await hand.tap(page.locator('#btnUndo'));
  const afterUndo = await logoId(page);
  await check('the blue disc is back', () => {
    expect(afterUndo).toBe(firstId);
  });
});

// The named action "Move and grow" (and the first part of "Change the logo"): Move right ten
// times, then Larger three times.
async function moveAndGrow(page, hand) {
  await tapTimes(hand, moveKey(page, 'right'), TEN_TAPS);
  await tapTimes(hand, page.locator(LARGER), 3);
}

// Where "Move and grow" leaves a logo that started in the middle: a fifth of its first width
// right of the middle (ten moves of 0.5% of the photo's width), 1.05 cubed as wide.
const MOVED_CX = 0.5 + TEN_TAPS * NUDGE_FRAC;
const GROWN_WIDTH = START_WIDTH * SIZE_STEP ** 3;

test('OVL-04.1 Use saved overlay places the saved logo where it was last [phone] [webkit]',
  async ({ page, check }, testInfo) => {
    const hand = await startOnOverlay(page, testInfo);
    const saved = await addDisc(page, hand);
    await check('the blue disc shows in the middle of the photo', async () => {
      expectBlue(await colorOnPage(page, inDisc(await logoOnPage(page))));
      expectNear((await logoPlacement(page)).cx, 0.5, FRACTION_TOLERANCE);
    });
    await moveAndGrow(page, hand);
    const moved = await logoPlacement(page);
    await check('the logo has moved right by a fifth of its first width, and grown by about a '
      + 'sixth', () => {
      expectNear(moved.cx, MOVED_CX, FRACTION_TOLERANCE);
      expectNear(moved.w, GROWN_WIDTH, FRACTION_TOLERANCE);
    });
    await page.waitForTimeout(PAUSE_MS);
    await openNext(page, hand, SECOND_PHOTO);
    await check('IMG_9075.JPEG opens on the Perspective step', async () => {
      expect(await stepNow(page)).toBe('perspective');
    });
    await goToStep(page, 'overlay', hand);
    await check('no logo is on the photo; a thumbnail of the blue disc and Use saved overlay show '
      + 'beside Add logo', async () => {
      expect(await logoId(page)).toBeNull();
      await expect(page.locator('#overlayThumb')).toBeVisible();
      await expect(page.locator('#btnUseSaved')).toBeVisible();
      await expect(page.locator('#btnOverlayAdd')).toBeVisible();
    });
    await hand.tap(page.locator('#btnUseSaved'));
    await page.waitForFunction(() => !!window.__straightener.app.state.overlay);
    const placed = await logoPlacement(page);
    await check('the blue disc shows as far right of the middle and as large as it was on the '
      + 'first photo; OPACITY reads 100%', async () => {
      expect(await logoId(page)).toBe(saved);
      expectNear(placed.cx, moved.cx, FRACTION_TOLERANCE);
      expectNear(placed.cy, moved.cy, FRACTION_TOLERANCE);
      expectNear(placed.w, moved.w, FRACTION_TOLERANCE);
      await expect(page.locator('#overlayOpacityValue')).toHaveText('100%');
    });
    await hand.tap(page.locator('#btnUndo'));
    await check('the logo is gone; Use saved overlay shows again', async () => {
      expect(await logoId(page)).toBeNull();
      await expect(page.locator('#btnUseSaved')).toBeVisible();
    });
  });

test('OVL-05.1 The pads take the place of Add logo [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnOverlay(page, testInfo);
  await check('Add logo shows; no arrow pad', async () => {
    await expect(page.locator('#btnOverlayAdd')).toBeVisible();
    await expect(page.locator('#overlayMovePad')).toBeHidden();
  });
  await addDisc(page, hand);
  await check('Add logo is gone; in its place a pad of four arrows on the left and a pad with − '
    + 'and + on the right', async () => {
    await expect(page.locator('#overlayAddRow')).toBeHidden();
    await expect(page.locator('#overlayMovePad')).toBeVisible();
    await expect(page.locator('#overlayMovePad .nudge-key')).toHaveCount(4);
    await expect(page.locator(SMALLER)).toBeVisible();
    await expect(page.locator(LARGER)).toBeVisible();
    const moveBox = await page.locator('#overlayMovePad').boundingBox();
    const sizeBox = await page.locator('#overlaySizePad').boundingBox();
    expect(moveBox.x).toBeLessThan(sizeBox.x);
  });
  await hand.tap(page.locator('#toolOverlayRemove'));
  await check('the pads are gone; Add logo shows again, with Use saved overlay beside it',
    async () => {
      await expect(page.locator('#overlayPadRow')).toBeHidden();
      await expect(page.locator('#btnOverlayAdd')).toBeVisible();
      await expect(page.locator('#btnUseSaved')).toBeVisible();
    });
});

test('OVL-06.1 Opacity changes the logo as the slider moves, one undo step a slide [phone]',
  async ({ page, check }, testInfo) => {
    const hand = await startOnOverlay(page, testInfo);
    await addDisc(page, hand);
    const point = inDisc(await logoOnPage(page));
    const slider = page.locator('#overlayOpacity');
    const held = await holdSlide(page, hand, slider, SLIDER_RIGHT_END, SLIDER_MIDDLE);
    const percent = await page.locator('#overlayOpacityValue').textContent();
    const color = await colorOnPage(page, point);
    await check('the value beside it reads about 50%, and already the photo shows through the '
      + 'disc', () => {
      const value = parseInt(percent, 10);
      expect(value).toBeGreaterThan(40);
      expect(value).toBeLessThan(60);
      expectNotBlue(color);
    });
    await liftSlide(page, held);
    const placed = await logoPlacement(page);
    await check('the value stays where it was', async () => {
      await expect(page.locator('#overlayOpacityValue')).toHaveText(percent);
      expect(Math.round(placed.opacity * 100)).toBe(parseInt(percent, 10));
    });
    await hand.tap(page.locator('#btnUndo'));
    await check('OPACITY reads 100% and the disc is solid blue again', async () => {
      await expect(page.locator('#overlayOpacityValue')).toHaveText('100%');
      expectBlue(await colorOnPage(page, point));
    });
  });

test('OVL-07.1 Each arrow of the move pad moves the logo 0.5% of the photo\'s width [phone]',
  async ({ page, check }, testInfo) => {
    const hand = await startOnOverlay(page, testInfo);
    await addDisc(page, hand);
    const start = await logoBox(page);
    const fifthPx = start.width / 5;
    const moves = [
      ['right', 'left', fifthPx, 'the logo has moved right by a fifth of its own width (5% of '
        + 'the photo\'s width), its size kept'],
      ['left', 'left', 0, 'it is back in the middle'],
      ['down', 'top', fifthPx, 'it has moved down by a fifth of its own width'],
      ['up', 'top', 0, 'it is back in the middle'],
    ];
    for (const [direction, edge, offsetPx, result] of moves) {
      await tapTimes(hand, moveKey(page, direction), TEN_TAPS);
      const box = await logoBox(page);
      await check(result, () => {
        expectNear(box[edge] - start[edge], offsetPx, PICTURE_TOLERANCE_PX);
        expectNear(box.left - start.left, edge === 'left' ? offsetPx : 0, PICTURE_TOLERANCE_PX);
        expectNear(box.top - start.top, edge === 'top' ? offsetPx : 0, PICTURE_TOLERANCE_PX);
        expectNear(box.width, start.width, PICTURE_TOLERANCE_PX / 10);
      });
    }
  });

test('OVL-07.2 Quick presses on the move pad are one undo step [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnOverlay(page, testInfo);
  await addDisc(page, hand);
  const start = await logoPlacement(page);
  const fifth = TEN_TAPS * NUDGE_FRAC;
  await tapTimes(hand, moveKey(page, 'right'), TEN_TAPS);
  const moved = await logoPlacement(page);
  await check('the logo has moved right by a fifth of its own width', () => {
    expectNear(moved.cx, start.cx + fifth, FRACTION_TOLERANCE);
  });
  await hand.tap(page.locator('#btnUndo'));
  const undone = await logoPlacement(page);
  await check('the logo is back in the middle: all ten taps are taken back', () => {
    expectNear(undone.cx, start.cx, FRACTION_TOLERANCE);
  });
  await tapTimes(hand, moveKey(page, 'right'), TEN_TAPS);
  const again = await logoPlacement(page);
  await check('the logo has moved right by a fifth of its width again', () => {
    expectNear(again.cx, start.cx + fifth, FRACTION_TOLERANCE);
  });
  await page.waitForTimeout(PAUSE_MS);
  await tapTimes(hand, moveKey(page, 'right'), TEN_TAPS);
  const twice = await logoPlacement(page);
  await check('it has moved right by two fifths of its width in all', () => {
    expectNear(twice.cx, start.cx + 2 * fifth, FRACTION_TOLERANCE);
  });
  await hand.tap(page.locator('#btnUndo'));
  const oneBack = await logoPlacement(page);
  await check('only the second ten are taken back: the logo is a fifth of its width right of the '
    + 'middle', () => {
    expectNear(oneBack.cx, start.cx + fifth, FRACTION_TOLERANCE);
  });
});

test('OVL-07.3 Holding a move key keeps moving the logo [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnOverlay(page, testInfo);
  await addDisc(page, hand);
  const start = await logoPlacement(page);
  await holdButton(page, hand, '#overlayMovePad [data-key="1,0"]', HOLD_MS);
  const held = await logoPlacement(page);
  await check('the logo keeps moving while it is held, and ends at least an eighth of its own '
    + 'width right of the middle', () => {
    expect(held.cx - start.cx).toBeGreaterThanOrEqual(held.w / 8);
  });
  await hand.tap(page.locator('#btnUndo'));
  await check('the logo is back in the middle', async () => {
    expectNear((await logoPlacement(page)).cx, start.cx, FRACTION_TOLERANCE);
  });
});

test('OVL-08.1 Larger and Smaller change the width by 1.05 [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnOverlay(page, testInfo);
  await addDisc(page, hand);
  const start = await logoBox(page);
  await hand.tap(page.locator(LARGER));
  const larger = await logoBox(page);
  await check('the logo is 1.05 times as wide and as high, its middle where it was', () => {
    expectNear(larger.width, start.width * SIZE_STEP, PICTURE_TOLERANCE_PX / 10);
    expectNear(larger.height, start.height * SIZE_STEP, PICTURE_TOLERANCE_PX / 10);
    expectNear(larger.left + larger.width / 2, start.left + start.width / 2,
      PICTURE_TOLERANCE_PX / 10);
    expectNear(larger.top + larger.height / 2, start.top + start.height / 2,
      PICTURE_TOLERANCE_PX / 10);
  });
  await hand.tap(page.locator(SMALLER));
  const back = await logoBox(page);
  await check('it is its first size again', () => {
    expectNear(back.width, start.width, PICTURE_TOLERANCE_PX / 10);
  });
  await hand.tap(page.locator(SMALLER));
  const smaller = await logoBox(page);
  await check('it is 1.05 times smaller than at first', () => {
    expectNear(smaller.width, start.width / SIZE_STEP, PICTURE_TOLERANCE_PX / 10);
  });
});

test('OVL-08.2 Holding Larger keeps growing the logo [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnOverlay(page, testInfo);
  await addDisc(page, hand);
  const start = await logoPlacement(page);
  await holdButton(page, hand, LARGER, HOLD_MS);
  const held = await logoPlacement(page);
  await check(`the logo keeps growing while it is held: at least ${HELD_MOVES_MIN} steps of 1.05 `
    + 'in all, so about a third wider', () => {
    const steps = Math.round(Math.log(held.w / start.w) / Math.log(SIZE_STEP));
    expect(steps).toBeGreaterThanOrEqual(HELD_MOVES_MIN);
  });
});

test('OVL-08.3 Quick presses on both pads are one undo step [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnOverlay(page, testInfo);
  await addDisc(page, hand);
  const start = await logoPlacement(page);
  const startedMs = Date.now();
  await hand.tap(moveKey(page, 'right'));
  await hand.tap(page.locator(LARGER));
  const tookMs = Date.now() - startedMs;
  const changed = await logoPlacement(page);
  await check('the logo moves right and grows', () => {
    expect(tookMs).toBeLessThan(UNDO_GAP_MS);
    expect(changed.cx).toBeGreaterThan(start.cx);
    expect(changed.w).toBeGreaterThan(start.w);
  });
  await hand.tap(page.locator('#btnUndo'));
  const undone = await logoPlacement(page);
  await check('both are taken back: the logo is in the middle, a quarter of the photo\'s width',
    () => {
      expectNear(undone.cx, start.cx, FRACTION_TOLERANCE);
      expectNear(undone.w, START_WIDTH, FRACTION_TOLERANCE);
    });
});

// The named action "Change the logo": Move right ten times, Larger three times, then the
// Opacity slider's knob slid from the right end to the middle. Returns the placement it ends
// at.
async function changeTheLogo(page, hand) {
  await moveAndGrow(page, hand);
  await slide(page, hand, page.locator('#overlayOpacity'), SLIDER_RIGHT_END, SLIDER_MIDDLE);
  return logoPlacement(page);
}

// Expects a placement to be the one "Change the logo" leaves: right of the middle, larger,
// and about 50% opaque, with OPACITY reading so.
async function expectChanged(page, changed) {
  expectNear(changed.cx, MOVED_CX, FRACTION_TOLERANCE);
  expectNear(changed.w, GROWN_WIDTH, FRACTION_TOLERANCE);
  expect(changed.opacity).toBeGreaterThan(0.4);
  expect(changed.opacity).toBeLessThan(0.6);
  const percent = parseInt(await page.locator('#overlayOpacityValue').textContent(), 10);
  expect(percent).toBe(Math.round(changed.opacity * 100));
}

// A point inside a logo that is clear of the rings drawn on the photo's middle and sides: a
// quarter of the logo's width right of and above its middle. placed: from logoOnPage.
const upRightInLogo = placed => ({
  x: placed.middle.x + placed.width / 4,
  y: placed.middle.y - placed.width / 4,
});

// The channels of a drawn color ([r, g, b]).
const GREEN = 1;
const BLUE = 2;

// Expects `channel` to be the strongest of a drawn color's three: how a pure blue or green
// logo shows at about half opacity, whatever part of the photo is under it.
function expectStrongest(color, channel) {
  for (let other = 0; other < color.length; other++) {
    if (other !== channel) expect(color[channel]).toBeGreaterThan(color[other]);
  }
}

test('OVL-09.1 A replacement logo takes the old one\'s place, width and opacity [phone]',
  async ({ page, check }, testInfo) => {
    const hand = await startOnOverlay(page, testInfo);
    const first = await addDisc(page, hand);
    const changed = await changeTheLogo(page, hand);
    await check('the blue disc is right of the middle, larger, and OPACITY reads about 50%',
      async () => {
        await expectChanged(page, changed);
        expectStrongest(await colorOnPage(page, upRightInLogo(await logoOnPage(page))), BLUE);
      });
    await page.waitForTimeout(PAUSE_MS);
    const second = await replaceLogo(page, hand, GREEN_SQUARE);
    const replaced = await logoPlacement(page);
    await check('the green square takes the disc\'s place: as far right, as wide, and at the '
      + 'same opacity', async () => {
      expect(second).not.toBe(first);
      expectStrongest(await colorOnPage(page, upRightInLogo(await logoOnPage(page))), GREEN);
      expectNear(replaced.cx, changed.cx, FRACTION_TOLERANCE);
      expectNear(replaced.cy, changed.cy, FRACTION_TOLERANCE);
      expectNear(replaced.w, changed.w, FRACTION_TOLERANCE);
      expect(replaced.opacity).toBe(changed.opacity);
      const percent = parseInt(await page.locator('#overlayOpacityValue').textContent(), 10);
      expect(percent).toBe(Math.round(changed.opacity * 100));
    });
  });

// The color of the saved logo's thumbnail beside Use saved overlay, at its middle: [r, g, b].
function thumbnailColor(page) {
  return page.locator('#overlayThumb').evaluate(async img => {
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, 1, 1);
    return Array.from(ctx.getImageData(0, 0, 1, 1).data.slice(0, 3));
  });
}

test('OVL-09.2 The replacement becomes the saved logo [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnOverlay(page, testInfo);
  const first = await addDisc(page, hand);
  await page.waitForTimeout(PAUSE_MS);
  const chooser = await pickWith(page, hand, page.locator('#toolOverlayReplace'),
    fixtureLogo(GREEN_SQUARE));
  await check('the file picker opens', () => {
    expect(chooser).toBeTruthy();
  });
  await page.waitForFunction(idBefore => (
    window.__straightener.app.state.overlay.id !== idBefore), first);
  const second = await logoId(page);
  await check('the green square takes the blue disc\'s place', async () => {
    expect(second).not.toBe(first);
    expectGreen(await colorOnPage(page, inDisc(await logoOnPage(page))));
  });
  await hand.tap(page.locator('#toolOverlayRemove'));
  await check('the logo is gone; the thumbnail beside Use saved overlay is the green square',
    async () => {
      expect(await logoId(page)).toBeNull();
      await expect(page.locator('#overlayThumb')).toBeVisible();
      await expect(page.locator('#btnUseSaved')).toBeVisible();
      expectGreen(await thumbnailColor(page));
    });
  await hand.tap(page.locator('#btnUseSaved'));
  await page.waitForFunction(() => !!window.__straightener.app.state.overlay);
  await check('the green square is placed on the photo', async () => {
    expect(await logoId(page)).toBe(second);
    expectGreen(await colorOnPage(page, inDisc(await logoOnPage(page))));
  });
});

// Where the middle of a logo a quarter of the photo's width is, across and down a square
// photo, after a snap to the bottom-right ring: 3% of the photo's width and half the logo's
// own width in from the right and bottom edges, so 84.5%.
const SNAPPED_MIDDLE = 1 - SNAP_MARGIN_FRAC - START_WIDTH / 2;
// Where the middle of a logo half the photo's height is, down the photo, with its bottom edge
// on the photo's bottom edge.
const PULLED_UP_MIDDLE = 0.75;

test('OVL-09.3 A replacement of another shape keeps the old middle and width, pulled inside '
  + 'the photo\'s edge [phone]', async ({ page, check }, testInfo) => {
  const hand = await startOnOverlay(page, testInfo);
  await addDisc(page, hand);
  await tapAt(page, hand, await ringOnPage(page, 'br'));
  const disc = await logoPlacement(page);
  const discBox = await logoBox(page);
  await check('the disc goes to the bottom-right corner: its middle is 84.5% across and 84.5% '
    + 'down, its right and bottom edges 3% of the photo\'s width in from the photo\'s', () => {
    // The photo is framed as a square, so the same share is as far across as it is down.
    expect(disc.cropWidth).toBe(disc.cropHeight);
    expectNear(disc.cx, SNAPPED_MIDDLE, FRACTION_TOLERANCE);
    expectNear(disc.cy, SNAPPED_MIDDLE, FRACTION_TOLERANCE);
    const marginPx = SNAP_MARGIN_FRAC * disc.cropWidth;
    expectNear(disc.cropWidth - discBox.right, marginPx, PICTURE_TOLERANCE_PX);
    expectNear(disc.cropHeight - discBox.bottom, marginPx, PICTURE_TOLERANCE_PX);
  });
  await replaceLogo(page, hand, GREEN_WIDE);
  const wide = await logoPlacement(page);
  await check('a green box three times as wide as it is high, a quarter of the photo\'s width '
    + 'as the disc was, its middle where the disc\'s was: 84.5% across and 84.5% down',
  async () => {
    expectNear(wide.w, START_WIDTH, FRACTION_TOLERANCE);
    expectNear(wide.cx, SNAPPED_MIDDLE, FRACTION_TOLERANCE);
    expectNear(wide.cy, SNAPPED_MIDDLE, FRACTION_TOLERANCE);
    await expectLogoShape(page, 3);
    // Read at the box's middle, which is clear of the rings once the box is in the corner.
    expectGreen(await colorOnPage(page, (await logoOnPage(page)).middle));
  });
  await replaceLogo(page, hand, BLUE_OVAL);
  const oval = await logoPlacement(page);
  const ovalBox = await logoBox(page);
  await check('a blue oval in a box a quarter of the photo\'s width and half its height, its '
    + 'middle still 84.5% across. Kept 84.5% down it would cross the photo\'s bottom edge, so '
    + 'it is pulled up: its bottom edge is on the photo\'s bottom edge and its middle is 75% '
    + 'down', async () => {
    expectNear(oval.w, START_WIDTH, FRACTION_TOLERANCE);
    expectNear(ovalBox.height, oval.cropHeight / 2, PICTURE_TOLERANCE_PX);
    expectNear(oval.cx, SNAPPED_MIDDLE, FRACTION_TOLERANCE);
    expectNear(ovalBox.bottom, oval.cropHeight, PICTURE_TOLERANCE_PX);
    expectNear(oval.cy, PULLED_UP_MIDDLE, FRACTION_TOLERANCE);
    // Read a quarter of the way down the box, inside the oval and clear of the rings.
    const placed = await logoOnPage(page);
    expectBlue(await colorOnPage(page, { x: placed.middle.x, y: placed.y + placed.height / 4 }));
  });
});

test('OVL-10.1 Reset puts the logo back in the middle, a quarter wide, at 100% [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnOverlay(page, testInfo);
  await addDisc(page, hand);
  const changed = await changeTheLogo(page, hand);
  await check('the logo is right of the middle, larger, and OPACITY reads about 50%', async () => {
    await expectChanged(page, changed);
  });
  await page.waitForTimeout(PAUSE_MS);
  await hand.tap(page.locator('#toolOverlayReset'));
  const reset = await logoPlacement(page);
  await check('the logo is in the middle of the photo, a quarter of its width; OPACITY reads '
    + '100%', async () => {
    expectNear(reset.cx, 0.5, FRACTION_TOLERANCE);
    expectNear(reset.cy, 0.5, FRACTION_TOLERANCE);
    expectNear(reset.w, START_WIDTH, FRACTION_TOLERANCE);
    await expect(page.locator('#overlayOpacityValue')).toHaveText('100%');
  });
  await hand.tap(page.locator('#btnUndo'));
  const undone = await logoPlacement(page);
  await check('the moved, larger, fainter logo is back', () => {
    expectNear(undone.cx, changed.cx, FRACTION_TOLERANCE);
    expectNear(undone.w, changed.w, FRACTION_TOLERANCE);
    expect(undone.opacity).toBe(changed.opacity);
  });
});

test('OVL-11.1 Remove takes the logo off this photo and keeps the saved one [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnOverlay(page, testInfo);
  const logo = await addDisc(page, hand);
  const point = inDisc(await logoOnPage(page));
  await hand.tap(page.locator('#toolOverlayRemove'));
  await check('the disc is gone from the photo; Add logo shows, with the disc\'s thumbnail and '
    + 'Use saved overlay beside it', async () => {
    expect(await logoId(page)).toBeNull();
    expectNotBlue(await colorOnPage(page, point));
    await expect(page.locator('#btnOverlayAdd')).toBeVisible();
    await expect(page.locator('#overlayThumb')).toBeVisible();
    expectBlue(await thumbnailColor(page));
    await expect(page.locator('#btnUseSaved')).toBeVisible();
  });
  await hand.tap(page.locator('#btnUndo'));
  await check('the disc is back where it was', async () => {
    expect(await logoId(page)).toBe(logo);
    expectBlue(await colorOnPage(page, point));
  });
});

// Three rows several cases share: reload the page (the start screen asks to resume
// IMG_9136.JPEG), tap Start fresh (Open photo shows), then open `name` with Open photo (it opens
// on the Perspective step). Each row's result is checked. The open photo's edits are saved
// first, as they are a moment after any change.
async function reloadStartFreshAndOpen(page, hand, check, name) {
  await waitForSaved(page, { name: PHOTO });
  await reloadToStart(page);
  await check('the start screen asks "Resume IMG_9136.JPEG?", with Resume and Start fresh',
    async () => {
      await expect(page.locator('#resume .resume-name')).toHaveText(`Resume ${PHOTO}?`);
      await expect(page.locator('#btnResume')).toBeVisible();
      await expect(page.locator('#btnFresh')).toBeVisible();
    });
  await hand.tap(page.locator('#btnFresh'));
  await check('the question goes; Open photo shows', async () => {
    await expect(page.locator('#resume')).toBeHidden();
    await expect(page.locator('#btnOpenEmpty')).toBeVisible();
  });
  await pickWith(page, hand, page.locator('#btnOpenEmpty'), name);
  await waitForPhoto(page, name);
  await check(`${name} opens on the Perspective step`, async () => {
    expect(await stepNow(page)).toBe('perspective');
  });
}

test('OVL-12.1 Delete saved forgets the saved logo and leaves the one on the photo [phone] '
  + '[webkit]', async ({ page, check }, testInfo) => {
  const hand = await startOnOverlay(page, testInfo);
  const logo = await addDisc(page, hand);
  const point = inDisc(await logoOnPage(page));
  await page.waitForTimeout(PAUSE_MS);
  await hand.tap(page.locator('#toolOverlayDeleteSaved'));
  await check('the disc stays on the photo; Delete saved is greyed out', async () => {
    expect(await logoId(page)).toBe(logo);
    expectBlue(await colorOnPage(page, point));
    await expect(page.locator('#toolOverlayDeleteSaved')).toBeDisabled();
  });
  await hand.tap(page.locator('#toolOverlayRemove'));
  await check('Add logo shows alone: no thumbnail, no Use saved overlay', async () => {
    await expect(page.locator('#btnOverlayAdd')).toBeVisible();
    await expect(page.locator('#overlayThumb')).toBeHidden();
    await expect(page.locator('#btnUseSaved')).toBeHidden();
  });
  // A person reloads a moment later; the edits are saved 0.4 s after the change.
  await waitForSaved(page, { name: PHOTO, overlayId: null });
  await reloadStartFreshAndOpen(page, hand, check, SECOND_PHOTO);
  await goToStep(page, 'overlay', hand);
  await check('no saved logo is offered: Add logo alone, and no row of tools', async () => {
    await expect(page.locator('#btnOverlayAdd')).toBeVisible();
    await expect(page.locator('#overlayThumb')).toBeHidden();
    await expect(page.locator('#btnUseSaved')).toBeHidden();
    await expect(page.locator('#overlayTools')).toBeHidden();
  });
});

// The four tools of the row of tools, by id.
const ALL_TOOLS = [
  'toolOverlayReplace',
  'toolOverlayReset',
  'toolOverlayRemove',
  'toolOverlayDeleteSaved',
];

// Expects the row of tools to show exactly the tools named (by id), and no other.
async function expectTools(page, shownIds) {
  await expect(page.locator('#overlayTools')).toBeVisible();
  for (const id of ALL_TOOLS) {
    if (shownIds.includes(id)) await expect(page.locator(`#${id}`)).toBeVisible();
    else await expect(page.locator(`#${id}`)).toBeHidden();
  }
}

test('OVL-13.1 The row of tools shows the tools that can act [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnOverlay(page, testInfo);
  await check('no row of tools', async () => {
    await expect(page.locator('#overlayTools')).toBeHidden();
  });
  await addDisc(page, hand);
  await check('a row of tools: Replace logo, Reset, Remove and Delete saved, none greyed out',
    async () => {
      await expectTools(page, ALL_TOOLS);
      for (const id of ALL_TOOLS) await expect(page.locator(`#${id}`)).toBeEnabled();
    });
  await hand.tap(page.locator('#toolOverlayRemove'));
  await check('Delete saved alone', async () => {
    await expectTools(page, ['toolOverlayDeleteSaved']);
  });
  await hand.tap(page.locator('#btnUseSaved'));
  await page.waitForFunction(() => !!window.__straightener.app.state.overlay);
  await check('all four tools again, none greyed out', async () => {
    await expectTools(page, ALL_TOOLS);
    for (const id of ALL_TOOLS) await expect(page.locator(`#${id}`)).toBeEnabled();
  });
  await hand.tap(page.locator('#toolOverlayDeleteSaved'));
  await check('all four tools, Delete saved greyed out', async () => {
    await expectTools(page, ALL_TOOLS);
    await expect(page.locator('#toolOverlayDeleteSaved')).toBeDisabled();
  });
  await hand.tap(page.locator('#toolOverlayRemove'));
  await check('no row of tools', async () => {
    await expect(page.locator('#overlayTools')).toBeHidden();
  });
});

test('OVL-14.1 A file that isn\'t a picture gets a red message in place of the hint [phone]',
  async ({ page, check }, testInfo) => {
    const hand = await startOnOverlay(page, testInfo);
    await chooseBadLogo(page, hand, page.locator('#btnOverlayAdd'), fixtureLogo(NOT_A_LOGO));
    await check('a red message takes the hint\'s place in the line above the controls: "'
      + CANT_READ + '"; no logo', async () => {
      await expect(page.locator('#overlayStatus')).toHaveText(CANT_READ);
      await expect(page.locator('#overlayStatus')).toHaveClass(/is-error/);
      await expect(page.locator('#overlayHintLine')).toBeHidden();
      expect(await logoId(page)).toBeNull();
    });
    await addDisc(page, hand);
    await check('the message has gone; the disc shows, with OPACITY in the line above the '
      + 'controls', async () => {
      await expect(page.locator('#overlayStatus')).toBeHidden();
      expectBlue(await colorOnPage(page, inDisc(await logoOnPage(page))));
      await expect(page.locator('#overlayOpacityLine')).toBeVisible();
    });
  });

test('OVL-14.2 A file over 5 MB is refused and the logo stays [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnOverlay(page, testInfo);
  const logo = await addDisc(page, hand);
  const before = await logoPlacement(page);
  await chooseBadLogo(page, hand, page.locator('#toolOverlayReplace'), oversizedPng());
  // Ruling R59's words, or today's ("overlay limit"): MSG-60.1 holds the words.
  await check('a red message takes OPACITY\'s place: "That file is 6.0 MB. The logo limit is '
    + '5 MB."; the disc stays as it was', async () => {
    await expect(page.locator('#overlayStatus')).toHaveText(
      /^That file is 6\.0 MB\. The (logo|overlay) limit is 5 MB\.$/);
    await expect(page.locator('#overlayOpacityLine')).toBeHidden();
    expect(await logoId(page)).toBe(logo);
    expect(await logoPlacement(page)).toEqual(before);
  });
  await hand.tap(moveKey(page, 'right'));
  await check('the disc moves; the message has gone and OPACITY shows again', async () => {
    expect((await logoPlacement(page)).cx).toBeGreaterThan(before.cx);
    await expect(page.locator('#overlayStatus')).toBeHidden();
    await expect(page.locator('#overlayOpacityLine')).toBeVisible();
  });
});

test('OVL-14.3 The message goes when the logo is removed or the step is left [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnOverlay(page, testInfo);
  await addDisc(page, hand);
  await chooseBadLogo(page, hand, page.locator('#toolOverlayReplace'), fixtureLogo(NOT_A_LOGO));
  await check('a red message reads "' + CANT_READ + '"', async () => {
    await expect(page.locator('#overlayStatus')).toHaveText(CANT_READ);
  });
  await hand.tap(page.locator('#toolOverlayRemove'));
  await check('the message has gone; the hint shows', async () => {
    await expect(page.locator('#overlayStatus')).toBeHidden();
    await expect(page.locator('#overlayHintLine')).toHaveText(HINT);
  });
  await chooseBadLogo(page, hand, page.locator('#btnOverlayAdd'), fixtureLogo(NOT_A_LOGO));
  await check('the same red message shows', async () => {
    await expect(page.locator('#overlayStatus')).toHaveText(CANT_READ);
  });
  await goToStep(page, 'export', hand);
  await check('the Export step shows', async () => {
    expect(await stepNow(page)).toBe('export');
  });
  await goToStep(page, 'overlay', hand);
  await check('the message has gone; the hint shows', async () => {
    await expect(page.locator('#overlayStatus')).toBeHidden();
    await expect(page.locator('#overlayHintLine')).toHaveText(HINT);
  });
});

test('OVL-14.4 The message goes when a pair switches side [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await makePair(page, testInfo);
  await goToStep(page, 'overlay', hand);
  await check('the back\'s Overlay step, with the hint', async () => {
    expect(await stepNow(page)).toBe('overlay');
    expect(await page.evaluate(() => window.__straightener.app.pair.current)).toBe('back');
    await expect(page.locator('#overlayHintLine')).toHaveText(HINT);
  });
  await chooseBadLogo(page, hand, page.locator('#btnOverlayAdd'), fixtureLogo(NOT_A_LOGO));
  await check('a red message reads "' + CANT_READ + '"', async () => {
    await expect(page.locator('#overlayStatus')).toHaveText(CANT_READ);
  });
  await switchTo(page, hand, 'front');
  await check('the front\'s Overlay step shows the hint and no message', async () => {
    expect(await stepNow(page)).toBe('overlay');
    await expect(page.locator('#overlayStatus')).toBeHidden();
    await expect(page.locator('#overlayHintLine')).toHaveText(HINT);
  });
});

// The pointer ids of two dispatched fingers: the ones support/perspective.js's sendTouch lets
// past the pointer capture (FIRST_FINGER_ID and SECOND_FINGER_ID there).
const FIRST_FINGER = 21;
const SECOND_FINGER = 22;
// How far a drag on the photo goes, in CSS px across and down.
const DRAG_ACROSS_PX = 60;
const DRAG_DOWN_PX = 40;
// A pinch on the logo: the fingers start this far apart and end this far apart, in CSS px.
const PINCH_START_PX = 40;
const PINCH_END_PX = 100;
// How far a corner handle is dragged out, in CSS px each way.
const CORNER_DRAG_PX = 40;
// The narrowest the logo may be, in px of the photo (CardEngine.OVERLAY_DEFAULTS.minWidthPx).
const MIN_WIDTH_PX = 8;
// How long the rings take to come back after a gesture, in ms: 100 ms, then a 150 ms fade
// (and a snap's glide, 180 ms, is over by then too).
const RINGS_BACK_MS = 400;
// How far in from the framed photo's edges the rings sit, in CSS px (the entry OVL-19 gives
// it; CONFIG.overlay.hotSpotInset in the code). A ring is a white circle of radius 11 px round
// a white dot, with a dark outline round the circle: the device pixel RING_OUTLINE_PX left of
// the dot's middle is in that outline, darker than RING_OUTLINE_MAX on any photo (0 to 255),
// and the dot is brighter than RING_DOT_MIN.
const RING_INSET_PX = 28;
const RING_OUTLINE_PX = 12.5;
const RING_OUTLINE_MAX = 170;
const RING_DOT_MIN = 200;

// A point of the photo away from the logo, its corners and the rings: a quarter of the way in
// from the crop's left edge and three quarters of the way down.
async function emptyPoint(page) {
  const crop = await cropOnPage(page);
  return {
    x: crop.left + (crop.right - crop.left) / 4,
    y: crop.top + (crop.bottom - crop.top) * 3 / 4,
  };
}

test('OVL-15.1 A drag and a pinch on the photo move the logo, not the photo [phone] [webkit]',
  async ({ page, check }, testInfo) => {
    const hand = await startOnOverlay(page, testInfo);
    await addDisc(page, hand);
    const view = await viewNow(page);
    const start = await logoOnPage(page);
    const from = await emptyPoint(page);
    await hand.drag(from, offsetBy(from, DRAG_ACROSS_PX, DRAG_DOWN_PX));
    const dragged = await logoOnPage(page);
    await check('the logo moves 60 px right and 40 px down; the photo doesn\'t move', async () => {
      expect(await viewNow(page)).toEqual(view);
      expectNear(dragged.middle.x - start.middle.x, DRAG_ACROSS_PX, PAGE_TOLERANCE_PX);
      expectNear(dragged.middle.y - start.middle.y, DRAG_DOWN_PX, PAGE_TOLERANCE_PX);
    });
    await pinchAt(page, await emptyPoint(page), PINCH_START_PX, PINCH_END_PX);
    const pinched = await logoOnPage(page);
    await check('the logo grows; the photo doesn\'t zoom', async () => {
      expect(await viewNow(page)).toEqual(view);
      expect(pinched.width).toBeGreaterThan(dragged.width + PAGE_TOLERANCE_PX);
    });
  });

test('OVL-15.2 With no logo placed, a drag and a pinch do nothing [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnOverlay(page, testInfo);
  const view = await viewNow(page);
  const steps = await undoSteps(page);
  const from = await emptyPoint(page);
  await hand.drag(from, offsetBy(from, DRAG_ACROSS_PX, DRAG_DOWN_PX));
  await check('the photo stays where it was, at the same size; Undo is still greyed out',
    async () => {
      expect(await viewNow(page)).toEqual(view);
      expect(await undoSteps(page)).toBe(steps);
      await expect(page.locator('#btnUndo')).toBeDisabled();
    });
  await pinchAt(page, from, PINCH_START_PX, PINCH_END_PX);
  await check('the photo doesn\'t zoom: it stays at the same size; Undo is still greyed out',
    async () => {
      expect(await viewNow(page)).toEqual(view);
      expect(await undoSteps(page)).toBe(steps);
      await expect(page.locator('#btnUndo')).toBeDisabled();
    });
});

test('OVL-15.3 The mouse wheel never zooms the photo here [desktop]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnOverlay(page, testInfo);
  const view = await viewNow(page);
  const point = await emptyPoint(page);
  await page.mouse.move(point.x, point.y);
  await page.mouse.wheel(0, -BIG_WHEEL_PX);
  await check('nothing changes: the photo doesn\'t zoom', async () => {
    await nextFrames(page);
    expect(await viewNow(page)).toEqual(view);
    expect(await logoId(page)).toBeNull();
  });
  await addDisc(page, hand);
  await check('the blue disc shows in the middle of the photo', async () => {
    expectBlue(await colorOnPage(page, inDisc(await logoOnPage(page))));
    expectNear((await logoPlacement(page)).cx, 0.5, FRACTION_TOLERANCE);
  });
  await page.mouse.move(point.x, point.y);
  await page.mouse.wheel(0, -BIG_WHEEL_PX);
  await check('the photo still doesn\'t zoom', async () => {
    await nextFrames(page);
    expect(await viewNow(page)).toEqual(view);
  });
});

test('OVL-16.1 Dragging the logo moves it, one undo step [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnOverlay(page, testInfo);
  await addDisc(page, hand);
  const start = await logoOnPage(page);
  const from = inDisc(start);
  await hand.drag(from, offsetBy(from, DRAG_ACROSS_PX, DRAG_DOWN_PX));
  const moved = await logoOnPage(page);
  await check('the logo moves with the finger, 60 px right and 40 px down, its size kept', () => {
    expectNear(moved.middle.x - start.middle.x, DRAG_ACROSS_PX, PAGE_TOLERANCE_PX);
    expectNear(moved.middle.y - start.middle.y, DRAG_DOWN_PX, PAGE_TOLERANCE_PX);
    expectNear(moved.width, start.width, PAGE_TOLERANCE_PX);
  });
  await hand.tap(page.locator('#btnUndo'));
  const undone = await logoOnPage(page);
  await check('the logo is back in the middle', () => {
    expectNear(undone.middle.x, start.middle.x, PAGE_TOLERANCE_PX);
    expectNear(undone.middle.y, start.middle.y, PAGE_TOLERANCE_PX);
  });
});

test('OVL-16.2 A drag away from the logo moves it too [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnOverlay(page, testInfo);
  await addDisc(page, hand);
  const start = await logoOnPage(page);
  const from = await emptyPoint(page);
  await hand.drag(from, offsetBy(from, -DRAG_DOWN_PX, -DRAG_ACROSS_PX));
  const moved = await logoOnPage(page);
  await check('the logo moves 40 px left and 60 px up', () => {
    expectNear(moved.middle.x - start.middle.x, -DRAG_DOWN_PX, PAGE_TOLERANCE_PX);
    expectNear(moved.middle.y - start.middle.y, -DRAG_ACROSS_PX, PAGE_TOLERANCE_PX);
  });
});

test('OVL-16.3 A logo drag the browser cancels puts the logo back [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnOverlay(page, testInfo);
  await addDisc(page, hand);
  const start = await logoOnPage(page);
  const placedBefore = await logoPlacement(page);
  const from = inDisc(start);
  const end = offsetBy(from, DRAG_ACROSS_PX, DRAG_DOWN_PX);
  await holdDragAt(page, hand, from, end);
  await check('the logo follows the finger, 60 px right and 40 px down', async () => {
    const held = await logoOnPage(page);
    expectNear(held.middle.x - start.middle.x, DRAG_ACROSS_PX, PAGE_TOLERANCE_PX);
    expectNear(held.middle.y - start.middle.y, DRAG_DOWN_PX, PAGE_TOLERANCE_PX);
  });
  // The stand-in: the browser cancels the touch instead of the finger lifting.
  await sendTouch(page, '#view', 'pointercancel', end);
  await check('the logo is back in the middle, where it was before the drag', async () => {
    expect(await logoPlacement(page)).toEqual(placedBefore);
  });
  await hand.tap(page.locator('#btnUndo'));
  await check('the logo is gone and Add logo shows again: the one undo step is the one adding '
    + 'the logo made', async () => {
    expect(await logoId(page)).toBeNull();
    await expect(page.locator('#btnOverlayAdd')).toBeVisible();
  });
});

test('OVL-17.1 Dragging a corner resizes the logo, its shape and the far corner kept [phone] '
  + '[webkit]', async ({ page, check }, testInfo) => {
  const hand = await startOnOverlay(page, testInfo);
  await addDisc(page, hand);
  const start = await logoOnPage(page);
  const corner = start.corners.se;
  await hand.drag(corner, offsetBy(corner, CORNER_DRAG_PX, CORNER_DRAG_PX / 2));
  const resized = await logoOnPage(page);
  await check('the logo is 40 px wider and 40 px higher, still square; its top-left corner '
    + 'hasn\'t moved', () => {
    expectNear(resized.width - start.width, CORNER_DRAG_PX, PAGE_TOLERANCE_PX);
    expectNear(resized.height - start.height, CORNER_DRAG_PX, PAGE_TOLERANCE_PX);
    expectNear(resized.x, start.x, PAGE_TOLERANCE_PX);
    expectNear(resized.y, start.y, PAGE_TOLERANCE_PX);
  });
  await hand.tap(page.locator('#btnUndo'));
  await check('the logo is its first size', async () => {
    expectNear((await logoOnPage(page)).width, start.width, PAGE_TOLERANCE_PX);
  });
});

test('OVL-17.2 A corner drag never makes the logo narrower than 8 px [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnOverlay(page, testInfo);
  await addDisc(page, hand);
  const start = await logoOnPage(page);
  const corner = start.corners.se;
  const farPast = offsetBy(start.corners.nw, -2 * CORNER_DRAG_PX, -2 * CORNER_DRAG_PX);
  await hand.drag(corner, farPast);
  const box = await logoBox(page);
  const shrunk = await logoOnPage(page);
  await check('the logo shrinks to a speck 8 px of the photo wide (under 3 px on the screen), '
    + 'its top-left corner where it was', () => {
    expectNear(box.width, MIN_WIDTH_PX, PICTURE_TOLERANCE_PX);
    expect(shrunk.width).toBeLessThan(3);
    expectNear(shrunk.x, start.x, PAGE_TOLERANCE_PX);
    expectNear(shrunk.y, start.y, PAGE_TOLERANCE_PX);
  });
});

test('OVL-17.3 A corner handle near a ring wins over the ring [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnOverlay(page, testInfo);
  await addDisc(page, hand);
  const ring = await ringOnPage(page, 'tl');
  await tapAt(page, hand, ring);
  await page.waitForTimeout(RINGS_BACK_MS);
  const snapped = await logoOnPage(page);
  const corner = snapped.corners.nw;
  // Where the handle touches the ring: midway between the handle's middle and the ring's,
  // which is where the handle's outer corner meets the ring's dark outline; a press there is
  // within reach of both.
  const between = { x: (corner.x + ring.x) / 2, y: (corner.y + ring.y) / 2 };
  const fromCorner = Math.hypot(between.x - corner.x, between.y - corner.y);
  const fromRing = Math.hypot(between.x - ring.x, between.y - ring.y);
  const crop = await cropOnPage(page);
  await check('the logo snaps to the photo\'s top-left corner; its top-left handle sits between '
    + 'the ring and the photo\'s corner, touching the ring', () => {
    expectNear(snapped.x - crop.left, snapped.y - crop.top, PAGE_TOLERANCE_PX);
    expect(snapped.x - crop.left).toBeLessThan(ring.x - crop.left);
    expect(corner.x).toBeLessThan(ring.x);
    expect(corner.x).toBeGreaterThan(crop.left);
    expect(fromCorner).toBeLessThan(HIT_RADIUS_PX);
    expect(fromRing).toBeLessThan(HIT_RADIUS_PX);
  });
  await hand.drag(between, offsetBy(between, CORNER_DRAG_PX / 2, CORNER_DRAG_PX / 2));
  const resized = await logoOnPage(page);
  await check('the logo is resized, smaller, its bottom-right corner where it was: the handle '
    + 'took the press, not the ring', () => {
    expect(resized.width).toBeLessThan(snapped.width - PAGE_TOLERANCE_PX);
    expectNear(resized.corners.se.x, snapped.corners.se.x, PAGE_TOLERANCE_PX);
    expectNear(resized.corners.se.y, snapped.corners.se.y, PAGE_TOLERANCE_PX);
  });
});

test('OVL-18.1 A pinch resizes the logo, one undo step [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnOverlay(page, testInfo);
  await addDisc(page, hand);
  const start = await logoOnPage(page);
  await pinchAt(page, start.middle, PINCH_START_PX, PINCH_END_PX);
  const pinched = await logoOnPage(page);
  await check('the logo is 2.5 times as wide, its middle where it was', () => {
    expectNear(pinched.width / start.width, PINCH_END_PX / PINCH_START_PX, RATIO_TOLERANCE);
    expectNear(pinched.middle.x, start.middle.x, PAGE_TOLERANCE_PX);
    expectNear(pinched.middle.y, start.middle.y, PAGE_TOLERANCE_PX);
  });
  await hand.tap(page.locator('#btnUndo'));
  await check('the logo is its first size', async () => {
    expectNear((await logoOnPage(page)).width, start.width, PAGE_TOLERANCE_PX);
  });
});

test('OVL-18.2 After one finger lifts, the other moves the logo on [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnOverlay(page, testInfo);
  await addDisc(page, hand);
  const start = await logoOnPage(page);
  const middle = start.middle;
  const finger = (gapPx, side) => ({ x: middle.x + side * gapPx / 2, y: middle.y });
  await sendTouch(page, '#view', 'pointerdown', finger(PINCH_START_PX, -1), FIRST_FINGER);
  await sendTouch(page, '#view', 'pointerdown', finger(PINCH_START_PX, 1), SECOND_FINGER);
  await sendTouch(page, '#view', 'pointermove', finger(PINCH_END_PX, -1), FIRST_FINGER);
  await sendTouch(page, '#view', 'pointermove', finger(PINCH_END_PX, 1), SECOND_FINGER);
  await sendTouch(page, '#view', 'pointerup', finger(PINCH_END_PX, 1), SECOND_FINGER);
  const pinched = await logoOnPage(page);
  await check('the logo is larger', () => {
    expect(pinched.width).toBeGreaterThan(start.width);
  });
  const left = finger(PINCH_END_PX, -1);
  for (let i = 1; i <= FINGER_MOVES; i++) {
    const step = offsetBy(left, DRAG_ACROSS_PX * i / FINGER_MOVES, 0);
    await sendTouch(page, '#view', 'pointermove', step, FIRST_FINGER);
  }
  await sendTouch(page, '#view', 'pointerup', offsetBy(left, DRAG_ACROSS_PX, 0), FIRST_FINGER);
  const moved = await logoOnPage(page);
  await check('the logo moves 60 px right with the finger, its size kept', () => {
    expectNear(moved.middle.x - pinched.middle.x, DRAG_ACROSS_PX, PAGE_TOLERANCE_PX);
    expectNear(moved.width, pinched.width, PAGE_TOLERANCE_PX);
  });
  await hand.tap(page.locator('#btnUndo'));
  const undone = await logoOnPage(page);
  await check('the whole gesture is taken back: the logo is its first size, in the middle',
    () => {
      expectNear(undone.width, start.width, PAGE_TOLERANCE_PX);
      expectNear(undone.middle.x, start.middle.x, PAGE_TOLERANCE_PX);
      expectNear(undone.middle.y, start.middle.y, PAGE_TOLERANCE_PX);
    });
});

test('OVL-19.1 Nine rings on the photo, for a person to judge [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnOverlay(page, testInfo);
  await addDisc(page, hand);
  await page.waitForTimeout(RINGS_BACK_MS);
  await check.eye('nine white rings with a dot in each sit on the framed photo: at its four '
    + 'corners, the middles of its four sides and its center, each the same small distance in '
    + 'from the edges; the center ring sits on the middle of the logo');
  const crop = await cropOnPage(page);
  const across = {
    l: crop.left + RING_INSET_PX,
    m: (crop.left + crop.right) / 2,
    r: crop.right - RING_INSET_PX,
  };
  const down = {
    t: crop.top + RING_INSET_PX,
    m: (crop.top + crop.bottom) / 2,
    b: crop.bottom - RING_INSET_PX,
  };
  const marks = [];
  for (const row of ['t', 'm', 'b']) {
    for (const column of ['l', 'm', 'r']) {
      marks.push(await ringMarksAt(page, { x: across[column], y: down[row] }, RING_OUTLINE_PX));
    }
  }
  await check('each corner ring\'s dot is 28 px in from both edges by its corner; each side '
    + 'ring\'s dot is 28 px in from its edge and midway along it; the center ring\'s dot is on '
    + 'the frame\'s middle', () => {
    for (const { dot, shadow } of marks) {
      expect(Math.min(...dot)).toBeGreaterThan(RING_DOT_MIN);
      expect(Math.max(...shadow)).toBeLessThan(RING_OUTLINE_MAX);
    }
  });
});

test('OVL-20.1 Tapping a corner ring snaps the logo there, one undo step [phone] '
  + '[webkit]', async ({ page, check }, testInfo) => {
  const hand = await startOnOverlay(page, testInfo);
  await addDisc(page, hand);
  const ring = await ringOnPage(page, 'tr');
  await tapAt(page, hand, ring);
  const box = await logoBox(page);
  const { cropWidth } = await logoPlacement(page);
  const marginPx = SNAP_MARGIN_FRAC * cropWidth;
  await check('the logo goes to the top-right corner; its top and right edges end 3% of the '
    + 'photo\'s width in from the top and right', () => {
    expectNear(cropWidth - box.right, marginPx, PICTURE_TOLERANCE_PX);
    expectNear(box.top, marginPx, PICTURE_TOLERANCE_PX);
  });
  await hand.tap(page.locator('#btnUndo'));
  const undone = await logoPlacement(page);
  await check('the logo is back in the middle', () => {
    expectNear(undone.cx, 0.5, FRACTION_TOLERANCE);
    expectNear(undone.cy, 0.5, FRACTION_TOLERANCE);
  });
});

test('OVL-20.2 The bottom ring and the center ring [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnOverlay(page, testInfo);
  await addDisc(page, hand);
  await tapAt(page, hand, await ringOnPage(page, 'b'));
  const box = await logoBox(page);
  const placed = await logoPlacement(page);
  await check('the logo is centered across the photo, its bottom edge 3% of the photo\'s width '
    + 'up from the bottom', () => {
    expectNear(placed.cx, 0.5, FRACTION_TOLERANCE);
    expectNear(placed.cropHeight - box.bottom, SNAP_MARGIN_FRAC * placed.cropWidth,
      PICTURE_TOLERANCE_PX);
  });
  await page.waitForTimeout(RINGS_BACK_MS);
  await tapAt(page, hand, await ringOnPage(page, 'c'));
  const centered = await logoPlacement(page);
  await check('the logo is in the middle of the photo again', () => {
    expectNear(centered.cx, 0.5, FRACTION_TOLERANCE);
    expectNear(centered.cy, 0.5, FRACTION_TOLERANCE);
  });
});

test('OVL-21.1 A drag that starts on a ring moves the logo [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnOverlay(page, testInfo);
  await addDisc(page, hand);
  const start = await logoOnPage(page);
  const ring = await ringOnPage(page, 'l');
  await hand.drag(ring, offsetBy(ring, DRAG_ACROSS_PX, 0));
  const moved = await logoOnPage(page);
  await check('the logo moves 60 px right; it doesn\'t snap to the left', () => {
    expectNear(moved.middle.x - start.middle.x, DRAG_ACROSS_PX, PAGE_TOLERANCE_PX);
    expectNear(moved.middle.y, start.middle.y, PAGE_TOLERANCE_PX);
  });
});

test('OVL-22.1 The rings fade during a drag, for a person to judge [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnOverlay(page, testInfo);
  await addDisc(page, hand);
  const start = inDisc(await logoOnPage(page));
  const end = offsetBy(start, DRAG_ACROSS_PX, DRAG_DOWN_PX);
  await holdDragAt(page, hand, start, end);
  await page.waitForTimeout(RINGS_BACK_MS);
  expect((await logoPlacement(page)).cx).toBeGreaterThan(0.5);
  await check.eye('the logo follows the finger; no rings show on the photo; the logo\'s dashed box '
    + 'and four handles do');
  await releaseDrag(page, hand, end);
  await page.waitForTimeout(RINGS_BACK_MS);
  await check.eye('the nine rings are back');
});

test('OVL-22.2 Under reduced motion a tapped ring moves the logo at once [phone]', async ({
  page,
  check,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const hand = await startOnOverlay(page, testInfo);
  await addDisc(page, hand);
  await page.waitForTimeout(RINGS_BACK_MS);
  const color = await tapAndLookAtLogo(page, await ringOnPage(page, 'br'));
  await check('in the very next frame the logo is already in the bottom-right corner, with no '
    + 'glide', () => {
    expectBlue(color);
  });
});

test('OVL-22.4 A tapped ring glides the logo there, not at once [phone]', async ({
  page,
  check,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const hand = await startOnOverlay(page, testInfo);
  await addDisc(page, hand);
  await page.waitForTimeout(RINGS_BACK_MS);
  const color = await tapAndLookAtLogo(page, await ringOnPage(page, 'br'));
  await check('in the very next frame the logo is still on its way: the place where it will sit '
    + 'doesn\'t show the blue disc yet', () => {
    expectNotBlue(color);
  });
  await page.waitForTimeout(RINGS_BACK_MS);
  const placed = await logoOnPage(page);
  const settled = await colorOnPage(page, {
    x: placed.x + placed.width * 3 / 4,
    y: placed.y + placed.height / 4,
  });
  const crop = await cropOnPage(page);
  await check('the blue disc sits in the bottom-right corner', () => {
    expectBlue(settled);
    expect(placed.middle.x).toBeGreaterThan((crop.left + crop.right) / 2);
    expect(placed.middle.y).toBeGreaterThan((crop.top + crop.bottom) / 2);
  });
});

test('OVL-23.1 The logo\'s box and handles, for a person to judge [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnOverlay(page, testInfo);
  await addDisc(page, hand);
  await page.waitForTimeout(RINGS_BACK_MS);
  expect(await logoId(page)).not.toBeNull();
  await check.eye('a dashed white box around the blue disc, and a small white square handle on '
    + 'each of its four corners');
  await goToStep(page, 'export', hand);
  await check.eye('the blue disc alone: no box, no handles and no rings');
});

// The share of the photo area's pixels drawn in the logo's blue, 0 to 1.
async function blueShare(page) {
  await nextFrames(page);
  return page.evaluate(({ blueMin, otherMax }) => {
    const canvas = document.getElementById('view');
    const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
    let blue = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      const isBlue = pixels[i] < otherMax && pixels[i + 1] < otherMax && pixels[i + 2] > blueMin;
      if (isBlue) blue += 1;
    }
    return blue / (pixels.length / 4);
  }, { blueMin: BLUE_MIN, otherMax: NOT_BLUE_MAX });
}

// The share of the photo area the blue disc fills at least, where it shows (0 to 1), and the
// most that may be blue where it doesn't (the photo itself has a speck or two).
const SHOWN_SHARE_MIN = 0.01;
const HIDDEN_SHARE_MAX = 0.0005;
// How close a drawn color must be to the one the opacity predicts (0 to 255, per channel).
const MIX_TOLERANCE = 12;

test('OVL-24.1 The logo shows on Overlay and Export only [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnOverlay(page, testInfo);
  await addDisc(page, hand);
  await check('the blue disc shows', async () => {
    expect(await blueShare(page)).toBeGreaterThan(SHOWN_SHARE_MIN);
  });
  for (const step of ['perspective', 'rotate', 'crop', 'levels']) {
    await goToStep(page, step, hand);
    await check(`no logo shows (on ${step[0].toUpperCase() + step.slice(1)})`, async () => {
      expect(await blueShare(page)).toBeLessThan(HIDDEN_SHARE_MAX);
    });
  }
  await goToStep(page, 'export', hand);
  await check('the blue disc shows again', async () => {
    expect(await blueShare(page)).toBeGreaterThan(SHOWN_SHARE_MIN);
  });
});

test('OVL-24.2 The logo is drawn at its opacity [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnOverlay(page, testInfo);
  await addDisc(page, hand);
  const slider = page.locator('#overlayOpacity');
  await slide(page, hand, slider, SLIDER_RIGHT_END, 0);
  await check('it reads 0%', async () => {
    await expect(page.locator('#overlayOpacityValue')).toHaveText('0%');
  });
  await goToStep(page, 'export', hand);
  const photoColor = await colorOnPage(page, inDisc(await logoOnPage(page)));
  await check('no logo shows on the photo', async () => {
    expect(await blueShare(page)).toBeLessThan(HIDDEN_SHARE_MAX);
  });
  await goToStep(page, 'overlay', hand);
  await check('the Overlay step shows; OPACITY reads 0%', async () => {
    expect(await stepNow(page)).toBe('overlay');
    await expect(page.locator('#overlayOpacityValue')).toHaveText('0%');
  });
  await slide(page, hand, slider, 0, SLIDER_MIDDLE);
  const percent = parseInt(await page.locator('#overlayOpacityValue').textContent(), 10);
  await check('OPACITY reads about 50%', () => {
    expect(percent).toBeGreaterThan(40);
    expect(percent).toBeLessThan(60);
  });
  await goToStep(page, 'export', hand);
  const mixed = await colorOnPage(page, inDisc(await logoOnPage(page)));
  await check('the disc shows half see-through: the photo shows through it, tinted blue, neither '
    + 'solid blue nor the photo alone', () => {
    const blue = [0, 0, 255];
    for (let channel = 0; channel < 3; channel++) {
      const expected = photoColor[channel] * (1 - percent / 100) + blue[channel] * percent / 100;
      expectNear(mixed[channel], expected, MIX_TOLERANCE);
    }
    expectNotBlue(mixed);
    expect(mixed[2] - photoColor[2]).toBeGreaterThan(MIX_TOLERANCE);
  });
});

test('OVL-25.1 A logo dragged off the side stops at the edge [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnOverlay(page, testInfo);
  await addDisc(page, hand);
  const crop = await cropOnPage(page);
  const from = inDisc(await logoOnPage(page));
  await hand.drag(from, { x: crop.right + 2 * DRAG_ACROSS_PX, y: from.y });
  const box = await logoBox(page);
  const { cropWidth } = await logoPlacement(page);
  await check('the logo\'s right edge stops on the photo\'s right edge', () => {
    expectNear(box.right, cropWidth, PICTURE_TOLERANCE_PX);
  });
});

// The crop box on the Crop step, as the screen shows it: { width, height } in CSS px.
async function cropBoxSize(page) {
  const crop = await cropOnPage(page);
  return { width: crop.right - crop.left, height: crop.bottom - crop.top };
}

test('OVL-25.2 The logo is shrunk to fit, and again when the crop changes [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnOverlay(page, testInfo, { step: 'crop' });
  await hand.tap(page.locator('.preset-chip[data-value="5:7"]'));
  await check('the crop box is taller than wide', async () => {
    const size = await cropBoxSize(page);
    expect(size.height).toBeGreaterThan(size.width);
  });
  await goToStep(page, 'overlay', hand);
  await check('the photo is framed taller than wide, with no logo', async () => {
    const size = await cropBoxSize(page);
    expect(size.height).toBeGreaterThan(size.width);
    expect(await logoId(page)).toBeNull();
  });
  await addLogo(page, hand, TALL_OVAL);
  await check('the tall oval shows in the middle', async () => {
    const placed = await logoOnPage(page);
    expectBlue(await colorOnPage(page, { x: placed.middle.x, y: placed.y + placed.height / 4 }));
    expectNear((await logoPlacement(page)).cx, 0.5, FRACTION_TOLERANCE);
    expect(placed.height).toBeGreaterThan(placed.width);
  });
  await holdButton(page, hand, LARGER, HOLD_MS);
  const grown = await logoBox(page);
  const placed = await logoPlacement(page);
  await check('the logo grows until it is as high as the framed photo, then stops', () => {
    expectNear(grown.height, placed.cropHeight, PICTURE_TOLERANCE_PX);
    expectNear(grown.top, 0, PICTURE_TOLERANCE_PX);
  });
  await goToStep(page, 'crop', hand);
  await check('the Crop step shows', async () => {
    expect(await stepNow(page)).toBe('crop');
  });
  await hand.tap(page.locator('.preset-chip[data-value="1:1"]'));
  await check('1:1 is selected; the crop box is square', async () => {
    await expect(page.locator('.preset-chip[data-value="1:1"]')).toHaveAttribute('aria-pressed',
      'true');
    const size = await cropBoxSize(page);
    expectNear(size.width, size.height, PAGE_TOLERANCE_PX);
  });
  await goToStep(page, 'overlay', hand);
  const fitted = await logoBox(page);
  const square = await logoPlacement(page);
  await check('the logo is smaller: still as high as the framed photo, and wholly inside it',
    () => {
      expect(fitted.height).toBeLessThan(grown.height);
      expectNear(fitted.height, square.cropHeight, PICTURE_TOLERANCE_PX);
      expect(fitted.left).toBeGreaterThanOrEqual(-PICTURE_TOLERANCE_PX);
      expect(fitted.top).toBeGreaterThanOrEqual(-PICTURE_TOLERANCE_PX);
      expect(fitted.right).toBeLessThanOrEqual(square.cropWidth + PICTURE_TOLERANCE_PX);
      expect(fitted.bottom).toBeLessThanOrEqual(square.cropHeight + PICTURE_TOLERANCE_PX);
    });
});

// One roll of the mouse wheel, in wheel delta px, and the factor it changes the logo's width
// by (Math.exp(-deltaY * 0.0015) in overlayWheel).
const WHEEL_PX = 100;
const WHEEL_FACTOR = Math.exp(WHEEL_PX * 0.0015);

test('OVL-26.1 The mouse wheel resizes the logo [desktop]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnOverlay(page, testInfo);
  await addDisc(page, hand);
  const start = await logoPlacement(page);
  const point = await emptyPoint(page);
  await page.mouse.move(point.x, point.y);
  await page.mouse.wheel(0, -WHEEL_PX);
  await expect.poll(async () => (await logoPlacement(page)).w).not.toBe(start.w);
  const grown = await logoPlacement(page);
  await check('the logo grows', () => {
    expectNear(grown.w / start.w, WHEEL_FACTOR, FRACTION_TOLERANCE);
  });
  await page.mouse.wheel(0, WHEEL_PX);
  await page.mouse.wheel(0, WHEEL_PX);
  await expect.poll(async () => (await logoPlacement(page)).w).toBeLessThan(start.w);
  await check('the logo is a little smaller than at first', async () => {
    expectNear((await logoPlacement(page)).w * WHEEL_FACTOR, start.w, FRACTION_TOLERANCE);
  });
  await page.waitForTimeout(PAUSE_MS);
  await hand.tap(page.locator('#btnUndo'));
  await check('the logo is its first size: the three rolls were one undo step', async () => {
    expectNear((await logoPlacement(page)).w, start.w, FRACTION_TOLERANCE);
  });
});

// The mouse cursor over the photo area.
const cursorNow = page => page.locator('#view').evaluate(canvas => getComputedStyle(canvas)
  .cursor);

test('OVL-27.1 The mouse cursor shows what a press would do [desktop]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnOverlay(page, testInfo);
  await addDisc(page, hand);
  const placed = await logoOnPage(page);
  const hovers = [
    [placed.corners.se, 'nwse-resize', 'a diagonal resize arrow, top-left to bottom-right'],
    [placed.corners.ne, 'nesw-resize', 'the other diagonal resize arrow'],
    [await ringOnPage(page, 'tl'), 'pointer', 'a pointing hand'],
    [await emptyPoint(page), 'move', 'the move cursor (four arrows)'],
  ];
  for (const [point, cursor, result] of hovers) {
    await page.mouse.move(point.x, point.y);
    await check(result, async () => {
      expect(await cursorNow(page)).toBe(cursor);
    });
  }
  await hand.tap(page.locator('#toolOverlayRemove'));
  await check('the logo is gone from the photo', async () => {
    expect(await logoId(page)).toBeNull();
  });
  const empty = await emptyPoint(page);
  await page.mouse.move(empty.x + 1, empty.y + 1);
  await check('the plain arrow', async () => {
    expect(await cursorNow(page)).toBe('default');
  });
});

test('OVL-28.1 A change to the saved logo\'s place is kept in the browser [phone] [webkit]',
  async ({ page, check }, testInfo) => {
    const hand = await startOnOverlay(page, testInfo);
    const logo = await addDisc(page, hand);
    await check('the blue disc shows in the middle of the photo', async () => {
      expectBlue(await colorOnPage(page, inDisc(await logoOnPage(page))));
      expectNear((await logoPlacement(page)).cx, 0.5, FRACTION_TOLERANCE);
    });
    await page.waitForTimeout(PAUSE_MS);
    await tapTimes(hand, moveKey(page, 'right'), TEN_TAPS);
    const moved = await logoPlacement(page);
    await check('the logo has moved right by a fifth of its own width', () => {
      expectNear(moved.cx, MOVED_CX, FRACTION_TOLERANCE);
    });
    await page.waitForTimeout(PAUSE_MS);
    await reloadStartFreshAndOpen(page, hand, check, SECOND_PHOTO);
    await goToStep(page, 'overlay', hand);
    await check('no logo is on the photo; the disc\'s thumbnail and Use saved overlay show beside '
      + 'Add logo', async () => {
      expect(await logoId(page)).toBeNull();
      await expect(page.locator('#overlayThumb')).toBeVisible();
      expectBlue(await thumbnailColor(page));
      await expect(page.locator('#btnUseSaved')).toBeVisible();
      await expect(page.locator('#btnOverlayAdd')).toBeVisible();
    });
    await hand.tap(page.locator('#btnUseSaved'));
    await page.waitForFunction(() => !!window.__straightener.app.state.overlay);
    const placed = await logoPlacement(page);
    await check('the blue disc shows a fifth of its width right of the middle, where it was moved '
      + 'to on the first photo', async () => {
      expect(await logoId(page)).toBe(logo);
      expectNear(placed.cx, MOVED_CX, FRACTION_TOLERANCE);
      expectNear(placed.cy, 0.5, FRACTION_TOLERANCE);
    });
  });

test('OVL-28.2 A logo the browser won\'t keep still goes on the photo [phone]', async ({
  page,
  check,
}, testInfo) => {
  await refuseStorage(page, ['overlay']);
  const hand = await startOnOverlay(page, testInfo);
  await addDisc(page, hand);
  await check('the disc shows on the photo; an amber warning reads "' + CANT_SAVE + '"',
    async () => {
      expectBlue(await colorOnPage(page, inDisc(await logoOnPage(page))));
      await expect(page.locator('#toast')).toContainText(CANT_SAVE_EITHER);
      expect((await toastNow(page)).kind).toBe('warn');
    });
  await hand.tap(page.locator('#toolOverlayRemove'));
  await check('Add logo shows, with no Use saved overlay', async () => {
    await expect(page.locator('#btnOverlayAdd')).toBeVisible();
    await expect(page.locator('#btnUseSaved')).toBeHidden();
  });
});

test('OVL-28.3 After Delete saved, moving the logo saves nothing [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnOverlay(page, testInfo);
  const logo = await addDisc(page, hand);
  const point = inDisc(await logoOnPage(page));
  await page.waitForTimeout(PAUSE_MS);
  await hand.tap(page.locator('#toolOverlayDeleteSaved'));
  await check('the disc stays on the photo; Delete saved is greyed out', async () => {
    expect(await logoId(page)).toBe(logo);
    expectBlue(await colorOnPage(page, point));
    await expect(page.locator('#toolOverlayDeleteSaved')).toBeDisabled();
  });
  await tapTimes(hand, moveKey(page, 'right'), TEN_TAPS);
  await check('the logo has moved right by a fifth of its own width', async () => {
    expectNear((await logoPlacement(page)).cx, MOVED_CX, FRACTION_TOLERANCE);
  });
  await page.waitForTimeout(PAUSE_MS);
  await reloadStartFreshAndOpen(page, hand, check, SECOND_PHOTO);
  await goToStep(page, 'overlay', hand);
  await check('no saved logo is offered: Add logo alone, with no thumbnail and no Use saved '
    + 'overlay', async () => {
    await expect(page.locator('#btnOverlayAdd')).toBeVisible();
    await expect(page.locator('#overlayThumb')).toBeHidden();
    await expect(page.locator('#btnUseSaved')).toBeHidden();
  });
});

test('OVL-28.4 A change to the saved logo\'s place is stored 0.4 s later, once [phone] [webkit]',
  async ({ page, check }, testInfo) => {
    await watchStorageAndDownloads(page);
    const hand = await startOnOverlay(page, testInfo);
    const logo = await addDisc(page, hand);
    await check('the logo is stored in the browser as the saved logo, in the middle', async () => {
      await waitForSavedSettings(page, { cx: 0.5, w: START_WIDTH });
      expect((await storedRecord(page, 'overlay')).id).toBe(logo);
    });
    await page.waitForTimeout(PAUSE_MS);
    // The pad's key takes the finger's press itself, so the tap ends in no click: its time is
    // taken from the page's clock just before and just after it.
    const beforeTapMs = await pageNowMs(page);
    await hand.tap(moveKey(page, 'right'));
    const afterTapMs = await pageNowMs(page);
    await waitForSavedSettings(page, { cx: 0.5 + NUDGE_FRAC });
    // Long enough for a second, unwanted save to land too.
    await page.waitForTimeout(PAUSE_MS);
    const writes = await storageWritesSince(page, 'overlay', beforeTapMs);
    await check('the new place is stored as the saved logo\'s once, 0.4 s after the tap and not '
      + 'before', () => {
      expect(writes.length).toBe(1);
      expect(writes[0].atMs - beforeTapMs).toBeGreaterThanOrEqual(SAVE_DELAY_MS - TIMER_EARLY_MS);
      expect(writes[0].atMs - afterTapMs).toBeLessThan(SAVE_DELAY_MS + SAVE_LATE_MS);
    });
  });

// The two grays of a two-gray logo in a saved file, each [r, g, b], read at the middle of each
// half of the logo, and the photo just left of the logo: { darkHalf, lightHalf, beside }.
async function graysAndBeside(page, file, box, placed) {
  const across = x => x / placed.cropWidth;
  const middleDown = (box.top + box.height / 2) / placed.cropHeight;
  const points = [
    [across(box.left + box.width / 4), middleDown],
    [across(box.left + box.width * 3 / 4), middleDown],
    [across(box.left / 2), middleDown],
  ];
  const { pixels } = await readSavedPixels(page, file, points);
  return {
    darkHalf: pixels[0].slice(0, 3),
    lightHalf: pixels[1].slice(0, 3),
    beside: pixels[2].slice(0, 3),
  };
}

// What the levels the photo has now would turn a gray (0 to 255) into, were they put on it:
// [r, g, b].
function grayThroughLevels(page, gray) {
  return page.evaluate(level => {
    const lut = window.CardEngine.levelsLut(window.__straightener.app.state.levels, CONFIG.levels);
    return lut ? [0, 1, 2].map(channel => lut[channel][level]) : [level, level, level];
  }, gray);
}

// The grays of overlay-dark-and-light-grays.png (OVL-29.1) and of overlay-greys.png (OVL-29.2),
// 0 to 255.
const DARK_GRAY = 30;
const LIGHT_GRAY = 220;
const MIDDLE_DARK_GRAY = 100;
const MIDDLE_LIGHT_GRAY = 150;
// How far the levels in OVL-29.1 must move each gray of its logo in at least one channel for
// the case to be able to tell, were they put on the logo (0 to 255).
const LEVELS_SHIFT_MIN = 6;
// The largest change of a color that counts as none, in a saved PNG (0 to 255).
const SAME_PNG_TOLERANCE = 1;

// Expects [r, g, b] to be the gray `gray`, within SAME_PNG_TOLERANCE.
function expectGray(color, gray) {
  for (const channel of color) expectNear(channel, gray, SAME_PNG_TOLERANCE);
}

test('OVL-29.1 Levels never change the logo in the saved file [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnOverlay(page, testInfo);
  await addLogo(page, hand, DARK_AND_LIGHT_GRAYS);
  const box = await logoBox(page);
  const placed = await logoPlacement(page);
  await check('the two-gray square shows in the middle', async () => {
    expectNear(placed.cx, 0.5, FRACTION_TOLERANCE);
    const onPage = await logoOnPage(page);
    const dark = await colorOnPage(page, { x: onPage.x + onPage.width / 4, y: onPage.middle.y });
    const light = await colorOnPage(page, {
      x: onPage.x + onPage.width * 3 / 4,
      y: onPage.middle.y,
    });
    expectNear(dark[1], DARK_GRAY, SAME_COLOR_TOLERANCE);
    expectNear(light[1], LIGHT_GRAY, SAME_COLOR_TOLERANCE);
  });
  const first = await savePngAt(page, hand, '2000', 'No');
  await check('the question box asks "Upscale to 2000 px?"', () => {
    expect(first.question).toBe('Upscale to 2000 px?');
  });
  await check('a first PNG is saved', () => {
    expect(first.file.length).toBeGreaterThan(0);
  });
  await goToStep(page, 'levels', hand);
  await check('the Levels step shows', async () => {
    expect(await stepNow(page)).toBe('levels');
  });
  const levelsDot = page.locator('[data-step="levels"]:visible .step-tab-mark');
  await hand.tap(page.locator('#toolAutoLevels'));
  await check('a white dot shows on the Levels tab: levels are set but not applied', async () => {
    await expect(levelsDot).toBeVisible();
  });
  await hand.tap(page.locator('#btnApplyLevels'));
  await check('the dot on the Levels tab has gone; Apply is greyed out', async () => {
    await expect(levelsDot).toBeHidden();
    await expect(page.locator('#btnApplyLevels')).toBeDisabled();
  });
  // The case can only fail if the applied levels would change the logo's grays: they must.
  const largestShift = (through, gray) => Math.max(...through.map(value => (
    Math.abs(value - gray))));
  expect(largestShift(await grayThroughLevels(page, DARK_GRAY), DARK_GRAY))
    .toBeGreaterThanOrEqual(LEVELS_SHIFT_MIN);
  expect(largestShift(await grayThroughLevels(page, LIGHT_GRAY), LIGHT_GRAY))
    .toBeGreaterThanOrEqual(LEVELS_SHIFT_MIN);
  const second = await savePngAt(page, hand, '2000', 'No');
  await check('the question box asks "Upscale to 2000 px?"', () => {
    expect(second.question).toBe('Upscale to 2000 px?');
  });
  await check('a second PNG is saved', () => {
    expect(second.file).not.toBe(first.file);
  });
  const before = await graysAndBeside(page, first.file, box, placed);
  const after = await graysAndBeside(page, second.file, box, placed);
  await check('beside the logo the second PNG is lighter than the first; the logo\'s halves are '
    + 'gray 30 and gray 220 in both, to within 1', () => {
    const sum = color => color.reduce((total, channel) => total + channel, 0);
    expect(sum(after.beside)).toBeGreaterThan(sum(before.beside));
    for (const shot of [before, after]) {
      expectGray(shot.darkHalf, DARK_GRAY);
      expectGray(shot.lightHalf, LIGHT_GRAY);
    }
  });
});

// The unsharp mask the upscale's Yes puts on the photo (CONFIG.upscale), for an upscale by
// `factor`: its blur's sigma is in the photo's px, so it grows with the factor.
function upscaleSharpening(page, factor) {
  return page.evaluate(scale => ({
    sigmaPx: CONFIG.upscale.sharpenSigma * scale,
    amount: CONFIG.upscale.sharpenAmount,
    thresholdLevels: CONFIG.upscale.sharpenThreshold,
  }), factor);
}

// How far a px across overlay-greys.png's middle may stray past its two grays in a saved file
// without being a sharpening halo, 0 to 255. Measured on 16 November: WebKit draws a logo it
// enlarges with a little ringing of its own (4 past each gray), Chromium with 1; the photo's
// sharpening put on the logo would stray 11 (Chromium) or 16 (WebKit).
const HALO_TOLERANCE = 6;
// The middle of the logo's width that OVL-29.2 reads, as fractions of the image's width: the logo
// spans the middle quarter (0.375 to 0.625), and its own outer edges are left out.
const LOGO_INNER_FROM = 0.38;
const LOGO_INNER_TO = 0.62;

test('OVL-29.2 The upscale\'s sharpening never touches the logo [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnOverlay(page, testInfo);
  await addLogo(page, hand, TWO_GREYS);
  const { cropWidth } = await logoPlacement(page);
  await check('the two-gray square shows in the middle', async () => {
    expectNear((await logoPlacement(page)).cx, 0.5, FRACTION_TOLERANCE);
    const onPage = await logoOnPage(page);
    const dark = await colorOnPage(page, { x: onPage.x + onPage.width / 4, y: onPage.middle.y });
    expectNear(dark[1], MIDDLE_DARK_GRAY, SAME_COLOR_TOLERANCE);
  });
  const saved = await savePngAt(page, hand, '3000', 'Yes');
  await check('the question box asks "Upscale to 3000 px?"', () => {
    expect(saved.question).toBe('Upscale to 3000 px?');
  });
  const image = await readSavedLogo(page, saved.file);
  await check('a PNG of 3000 × 3000 px is saved', () => {
    expect([image.width, image.height]).toEqual([3000, 3000]);
  });
  const options = await upscaleSharpening(page, image.width / cropWidth);
  const spread = await bandSpread(page, saved.file, {
    fromFrac: LOGO_INNER_FROM,
    toFrac: LOGO_INNER_TO,
    options,
  });
  // The case can only fail if the photo's sharpening, put on the logo, would show: it must.
  const isHaloShown = range => range.min < MIDDLE_DARK_GRAY - HALO_TOLERANCE
    || range.max > MIDDLE_LIGHT_GRAY + HALO_TOLERANCE;
  expect(isHaloShown(spread.sharpened)).toBe(true);
  await check('no px is more than 6 darker than gray 100 or more than 6 lighter than gray 150: '
    + 'no sharpening halo along the edge between the two grays', () => {
    expect(isHaloShown(spread.saved)).toBe(false);
  });
});

test('OVL-29.3 The logo keeps its place in the photo at every Size [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnOverlay(page, testInfo);
  await addLogo(page, hand, GREEN_SQUARE);
  await check('the green square shows in the middle', async () => {
    expectGreen(await colorOnPage(page, inDisc(await logoOnPage(page))));
    expectNear((await logoPlacement(page)).cx, 0.5, FRACTION_TOLERANCE);
  });
  await tapAt(page, hand, await ringOnPage(page, 'br'));
  await check('the green square sits in the bottom-right corner', async () => {
    const placed = await logoPlacement(page);
    expect(placed.cx).toBeGreaterThan(0.5);
    expect(placed.cy).toBeGreaterThan(0.5);
  });
  const smallSave = await savePngAt(page, hand, '1080');
  const small = await readSavedLogo(page, smallSave.file);
  await check('a PNG 1080 px wide is saved, with no question asked', () => {
    expect(smallSave.question).toBe('');
    expect(small.width).toBe(1080);
  });
  await hand.tap(choiceButton(page, 'exportSize', 'Original'));
  await check('Original is selected', async () => {
    expect(await selectedChoices(page, 'exportSize')).toEqual(['Original']);
  });
  const fullSave = await downloadAnswering(page, hand, 'No');
  const full = await readSavedLogo(page, fullSave.file);
  await check('a larger PNG is saved, with no question asked', () => {
    expect(fullSave.question).toBe('');
    expect(full.width).toBeGreaterThan(small.width);
  });
  await check('the green square takes the same share of the image, in the same place, within a '
    + 'pixel', () => {
    const edges = [['left', 'width'], ['right', 'width'], ['top', 'height'], ['bottom', 'height']];
    for (const [edge, size] of edges) {
      const tolerance = SHARE_TOLERANCE_PX / small[size];
      expectNear(small.box[edge] / small[size], full.box[edge] / full[size], tolerance);
    }
  });
});

test('OVL-30.1 Undo and Redo move the logo; a new photo has none placed [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnOverlay(page, testInfo);
  await addDisc(page, hand);
  await page.waitForTimeout(PAUSE_MS);
  await tapTimes(hand, moveKey(page, 'right'), TEN_TAPS);
  await check('the logo has moved right by a fifth of its own width', async () => {
    expectNear((await logoPlacement(page)).cx, MOVED_CX, FRACTION_TOLERANCE);
  });
  await hand.tap(page.locator('#btnUndo'));
  await check('the logo is back in the middle', async () => {
    expectNear((await logoPlacement(page)).cx, 0.5, FRACTION_TOLERANCE);
  });
  await hand.tap(page.locator('#btnRedo'));
  await check('it has moved right by a fifth of its width again', async () => {
    expectNear((await logoPlacement(page)).cx, MOVED_CX, FRACTION_TOLERANCE);
  });
  await openNext(page, hand, SECOND_PHOTO);
  await check('IMG_9075.JPEG opens on the Perspective step', async () => {
    expect(await stepNow(page)).toBe('perspective');
  });
  await goToStep(page, 'overlay', hand);
  await check('no logo is placed on this photo; Use saved overlay is offered', async () => {
    expect(await logoId(page)).toBeNull();
    await expect(page.locator('#btnUseSaved')).toBeVisible();
  });
});

test('OVL-30.2 Each side of a pair keeps its own logo place [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await makePair(page, testInfo);
  await goToStep(page, 'overlay', hand);
  await check('the back\'s Overlay step, with no logo', async () => {
    expect(await stepNow(page)).toBe('overlay');
    expect(await page.evaluate(() => window.__straightener.app.pair.current)).toBe('back');
    expect(await logoId(page)).toBeNull();
  });
  await addDisc(page, hand);
  await check('the logo shows in the middle of the back', async () => {
    expectBlue(await colorOnPage(page, inDisc(await logoOnPage(page))));
    expectNear((await logoPlacement(page)).cx, 0.5, FRACTION_TOLERANCE);
  });
  await tapAt(page, hand, await ringOnPage(page, 'tl'));
  const back = await logoPlacement(page);
  await check('the logo sits top-left on the back', () => {
    expect(back.cx).toBeLessThan(0.5);
    expect(back.cy).toBeLessThan(0.5);
  });
  await switchTo(page, hand, 'front');
  await check('the front\'s Overlay step, with no logo placed', async () => {
    expect(await stepNow(page)).toBe('overlay');
    expect(await logoId(page)).toBeNull();
  });
  await hand.tap(page.locator('#btnUseSaved'));
  await page.waitForFunction(() => !!window.__straightener.app.state.overlay);
  await check('the logo shows on the front', async () => {
    await page.waitForTimeout(RINGS_BACK_MS);
    expectBlue(await colorOnPage(page, inDisc(await logoOnPage(page))));
  });
  await page.waitForTimeout(PAUSE_MS);
  await tapAt(page, hand, await ringOnPage(page, 'br'));
  const front = await logoPlacement(page);
  await check('the logo sits bottom-right on the front', () => {
    expect(front.cx).toBeGreaterThan(0.5);
    expect(front.cy).toBeGreaterThan(0.5);
  });
  await switchTo(page, hand, 'back');
  await check('the back\'s logo is still top-left', async () => {
    const now = await logoPlacement(page);
    expectNear(now.cx, back.cx, FRACTION_TOLERANCE);
    expectNear(now.cy, back.cy, FRACTION_TOLERANCE);
  });
  await switchTo(page, hand, 'front');
  await check('the front\'s logo is still bottom-right', async () => {
    const now = await logoPlacement(page);
    expectNear(now.cx, front.cx, FRACTION_TOLERANCE);
    expectNear(now.cy, front.cy, FRACTION_TOLERANCE);
  });
});

// True when a control is greyed out. Read at once, with no waiting: a known-defect check.
const isGreyedOut = locator => locator.evaluate(el => el.disabled);
// The text of the line above Overlay's controls, as shown.
const overlayLabelText = page => page.locator('#overlayArea').evaluate(area => [
  ...area.querySelectorAll('.label-row, .status-line'),
].filter(row => row.getClientRects().length).map(row => row.innerText).join(' '));

test('OVL-31.1 With crossed corners Add logo and Use saved overlay are greyed out [phone]',
  async ({ page, check }, testInfo) => {
    test.fail(true, 'BUG-082');
    const hand = await startOnOverlay(page, testInfo);
    await addDisc(page, hand);
    await hand.tap(page.locator('#toolOverlayRemove'));
    await goToStep(page, 'perspective', hand);
    await check('the Perspective step shows the card\'s outline, with a ring on each corner',
      async () => {
        expect(await stepNow(page)).toBe('perspective');
        expect(await page.evaluate(() => window.__straightener.app.geometry.ok)).toBe(true);
      });
    await crossTheCorners(page, hand);
    await check('the outline crosses itself and turns red', async () => {
      expect(await page.evaluate(() => window.__straightener.app.geometry.ok)).toBe(false);
    });
    await goToStep(page, 'overlay', hand);
    const addOff = await isGreyedOut(page.locator('#btnOverlayAdd'));
    const savedOff = await isGreyedOut(page.locator('#btnUseSaved'));
    const line = await overlayLabelText(page);
    await check('Add logo and Use saved overlay are greyed out; the line above the controls '
      + 'reads "' + FIX_CORNERS + '"', () => {
      expect(addOff).toBe(true);
      expect(savedOff).toBe(true);
      expect(line).toContain(FIX_CORNERS);
    });
  });

test('OVL-31.2 With crossed corners Replace logo is greyed out [phone]', async ({
  page,
  check,
}, testInfo) => {
  test.fail(true, 'BUG-082');
  const hand = await startOnOverlay(page, testInfo);
  await addDisc(page, hand);
  await goToStep(page, 'perspective', hand);
  await check('the Perspective step shows the card\'s outline, with a ring on each corner',
    async () => {
      expect(await stepNow(page)).toBe('perspective');
      expect(await page.evaluate(() => window.__straightener.app.geometry.ok)).toBe(true);
    });
  await crossTheCorners(page, hand);
  await check('the outline crosses itself and turns red', async () => {
    expect(await page.evaluate(() => window.__straightener.app.geometry.ok)).toBe(false);
  });
  await goToStep(page, 'overlay', hand);
  const replaceOff = await isGreyedOut(page.locator('#toolOverlayReplace'));
  const line = await overlayLabelText(page);
  await check('Replace logo is greyed out; the line above the controls reads "' + FIX_CORNERS
    + '"', () => {
    expect(replaceOff).toBe(true);
    expect(line).toContain(FIX_CORNERS);
  });
});

const OVERLAY_TIPS = [
  'Tap a ring to snap the logo to that corner, side or the center. Drag to move it; drag a '
    + 'corner or pinch to resize.',
  'On this step the photo stays framed as set in Crop.',
  'Your last logo is kept in this browser for the next photo.',
  'Delete saved leaves the logo on this photo.',
];
const OVERLAY_KEYS = 'Arrows move the logo (Shift for bigger steps); + and − resize it; the '
  + 'wheel resizes too.';

// The lines of the Overlay tips that can be seen, in order.
const shownTips = page => page.locator('#overlaySheet .sheet-tips .sheet-hint').evaluateAll(
  hints => hints.filter(hint => hint.getClientRects().length).map(hint => hint.textContent));

test('OVL-32.1 Overlay options hold only the tips [both]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnOverlay(page, testInfo);
  if (hand.isTouch) {
    await openOptions(page, hand, 'overlay');
    await check('the sheet Overlay options rises, holding one row, Tips', async () => {
      await expect(page.locator('#overlaySheetTitle')).toHaveText('Overlay options');
      await expect(page.locator('#overlaySheet .sheet-row:visible')).toHaveCount(1);
      await expect(page.locator('#overlayTips')).toContainText('Tips');
    });
    await hand.tap(page.locator('#overlayTips'));
    await check('it opens in place, with the four tips', async () => {
      expect(await shownTips(page)).toEqual(OVERLAY_TIPS);
    });
    return;
  }
  await check('the heading TIPS AND KEYS, with no Overlay options title and no Tips row; under '
    + 'it the last three tips (not the one about rings) and the keys line', async () => {
    await expect(page.locator('#overlaySheet .sheet-tips-heading')).toHaveText('Tips and keys');
    await expect(page.locator('#overlaySheetTitle')).toBeHidden();
    await expect(page.locator('#overlayTips')).toBeHidden();
    expect(await shownTips(page)).toEqual([...OVERLAY_TIPS.slice(1), OVERLAY_KEYS]);
  });
});
