// The Overlay step's cases (tests/catalog/overlay.md): adding a logo, the files it takes, where
// it lands, the saved logo, Opacity, the move and size pads, the tools, the gestures on the
// photo, the snap rings, and how the logo goes into the saved file.
// Each test drives the app as a person would, through hand.tap and hand.drag (a finger on the
// phone targets, the mouse on the wide ones), and reads the app's state only to find a place to
// press or to check a result. The logos are made in the test (support/overlay.js); no logo
// file is kept in the repository.
'use strict';
const { test, expect } = require('./support/case.js');
const { goToStep, editState, openOptions } = require('./support/app.js');
const {
  pickWith,
  waitForPhoto,
  watchStorageAndDownloads,
  storageWritesSince,
  lastClickMs,
  pageNowMs,
  refuseStorage,
  toastNow,
  storedRecord,
} = require('./support/start-and-session.js');
const {
  choiceButton,
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
  DARK_GREY,
  LIGHT_GREY,
  MEGABYTE,
  startOnOverlay,
  drawnLogo,
  svgLogo,
  textNamedPng,
  oversizedPng,
  gifLogo,
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
  readSavedLogo,
  waitForSavedSettings,
} = require('./support/overlay.js');

const SECOND_PHOTO = 'IMG_9075.JPEG';
// The words on the screen.
const HINT = 'Add a logo or watermark: PNG, WebP, JPG or SVG, up to 5 MB.';
const NOT_SUPPORTED = 'That file type isn’t supported. Use PNG, WebP, JPG or SVG.';
const CANT_READ = 'Couldn’t read that image. Try another PNG, WebP, JPG or SVG file.';
const CANT_SAVE = 'This overlay works on this photo, but it can’t be saved in this browser.';
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
// NOT_BLUE_MAX (0 to 255).
const BLUE_MIN = 200;
const NOT_BLUE_MAX = 60;
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

// The blue disc logo most cases use: 400 × 400 px, see-through around the disc.
const discLogo = page => drawnLogo(page, { name: 'logo.png' });

// Adds the blue disc logo with Add logo. Returns its id.
async function addDisc(page, hand) {
  return chooseLogo(page, hand, page.locator('#btnOverlayAdd'), await discLogo(page));
}

// How many px of the row `row` (red channel values) between `fromX` and `toX` are gray: the
// soft part of an edge between black and white.
function grayCount(row, fromX, toX) {
  return row.slice(fromX, toX).filter(value => (
    value > EDGE_GRAY_MIN && value < EDGE_GRAY_MAX)).length;
}

// Saves the export as a PNG at Size 3000, answering Yes to the Upscale question, and returns
// the gray px across the black-to-white edge in the middle of a logo placed at the start (the
// split logos): the row through the logo's middle, across the middle fifth of the image.
async function savedEdgeGray(page, hand) {
  await goToStep(page, 'export', hand);
  await hand.tap(choiceButton(page, 'exportFormat', 'PNG'));
  await hand.tap(choiceButton(page, 'exportSize', '3000'));
  const saved = await downloadAnswering(page, hand, 'Yes');
  const image = await readSavedLogo(page, saved.file, { rowFrac: 0.5 });
  const fifth = Math.round(image.width / 10);
  const middle = Math.round(image.width / 2);
  return { image, gray: grayCount(image.row, middle - fifth, middle + fifth) };
}

test('OVL-01.1 Add logo picks a file and places it [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnOverlay(page, testInfo);
  await check('the hint reads "' + HINT + '"; the red Add logo shows; no logo is on the photo',
    async () => {
      await expect(page.locator('#overlayHintLine')).toHaveText(HINT);
      await expect(page.locator('#btnOverlayAdd')).toBeVisible();
      await expect(page.locator('#btnOverlayAdd')).toHaveClass(/is-main/);
      expect(await logoId(page)).toBeNull();
    });
  const logo = await discLogo(page);
  const chooser = await pickWith(page, hand, page.locator('#btnOverlayAdd'), logo);
  const accepted = await page.locator('#overlayInput').getAttribute('accept');
  await check('Add logo opens the file picker for one file: PNG, WebP, JPG and SVG pictures',
    async () => {
      expect(chooser.isMultiple()).toBe(false);
      for (const type of ['image/png', 'image/webp', 'image/jpeg', 'image/svg+xml']) {
        expect(accepted.split(',')).toContain(type);
      }
    });
  await page.waitForFunction(() => !!window.__straightener.app.state.overlay);
  const placed = await logoOnPage(page);
  await check('the blue disc shows in the middle of the photo; Opacity reads 100%', async () => {
    expectBlue(await colorOnPage(page, inDisc(placed)));
    await expect(page.locator('#overlayOpacityLine')).toBeVisible();
    await expect(page.locator('#overlayOpacityValue')).toHaveText('100%');
  });
});

test('OVL-01.2 The hint says 5 MB when a link lowers the limit [phone]', async ({
  page,
  check,
}, testInfo) => {
  const address = `index.html?overlay.maxBytes=${MEGABYTE}`;
  const hand = await startOnOverlay(page, testInfo, { address });
  await check('the hint still reads "' + HINT + '"', async () => {
    await expect(page.locator('#overlayHintLine')).toHaveText(HINT);
  });
  await chooseBadLogo(page, hand, page.locator('#btnOverlayAdd'), oversizedPng(2 * MEGABYTE));
  await check('a 2 MB file gets "That file is 2.0 MB. The overlay limit is 1 MB." and no logo',
    async () => {
      await expect(page.locator('#overlayStatus')).toHaveText(
        'That file is 2.0 MB. The overlay limit is 1 MB.');
      expect(await logoId(page)).toBeNull();
    });
});

// Expects the logo on the page to be `ratio` times as wide as it is high (within 2%).
async function expectLogoShape(page, ratio) {
  const placed = await logoOnPage(page);
  expect(Math.abs(placed.width / placed.height / ratio - 1)).toBeLessThan(RATIO_TOLERANCE);
}

test('OVL-02.1 PNG, JPEG, WebP and SVG logos are each placed [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnOverlay(page, testInfo);
  const replace = page.locator('#toolOverlayReplace');
  const png = await chooseLogo(page, hand, page.locator('#btnOverlayAdd'), await discLogo(page));
  await check('logo.png, 400 × 400 px, shows as a square blue disc', async () => {
    expect(png).not.toBeNull();
    await expectLogoShape(page, 1);
    expectBlue(await colorOnPage(page, inDisc(await logoOnPage(page))));
  });
  const jpeg = await drawnLogo(page, {
    name: 'logo.jpg',
    type: 'image/jpeg',
    width: 300,
    height: 100,
    paint: 'green',
  });
  const jpegId = await chooseLogo(page, hand, replace, jpeg);
  await check('logo.jpg, 300 × 100 px, takes its place, three times as wide as high', async () => {
    expect(jpegId).not.toBe(png);
    await expectLogoShape(page, 3);
  });
  const webp = await drawnLogo(page, {
    name: 'logo.webp',
    type: 'image/webp',
    width: 200,
    height: 400,
  });
  const webpId = await chooseLogo(page, hand, replace, webp);
  await check('logo.webp, 200 × 400 px, takes its place, half as wide as high', async () => {
    expect(webpId).not.toBe(jpegId);
    await expectLogoShape(page, 0.5);
  });
  const svgId = await chooseLogo(page, hand, replace, svgLogo('logo.svg', 200, 100));
  await check('logo.svg, 200 × 100 units, takes its place, twice as wide as high', async () => {
    expect(svgId).not.toBe(webpId);
    await expectLogoShape(page, 2);
  });
});

test('OVL-02.2 A logo file with no picture type is taken by its name [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnOverlay(page, testInfo);
  const logo = await discLogo(page);
  const untyped = { ...logo, mimeType: 'application/octet-stream' };
  await chooseLogo(page, hand, page.locator('#btnOverlayAdd'), untyped);
  await check('logo.png, sent with no picture type, shows as the blue disc', async () => {
    expectBlue(await colorOnPage(page, inDisc(await logoOnPage(page))));
    await expect(page.locator('#overlayStatus')).toBeHidden();
  });
});

test('OVL-02.3 A GIF is refused [phone]', async ({ page, check }, testInfo) => {
  const hand = await startOnOverlay(page, testInfo);
  await chooseBadLogo(page, hand, page.locator('#btnOverlayAdd'), gifLogo());
  await check('a red message reads "' + NOT_SUPPORTED + '" where the hint was; no logo',
    async () => {
      await expect(page.locator('#overlayStatus')).toHaveText(NOT_SUPPORTED);
      await expect(page.locator('#overlayStatus')).toHaveClass(/is-error/);
      await expect(page.locator('#overlayHintLine')).toBeHidden();
      expect(await logoId(page)).toBeNull();
    });
});

test('OVL-02.4 An SVG logo stays sharp in a large export [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnOverlay(page, testInfo);
  await chooseLogo(page, hand, page.locator('#btnOverlayAdd'), svgLogo());
  await check('logo.svg shows: its left half black, its right half white', async () => {
    const placed = await logoOnPage(page);
    const left = await colorOnPage(page, { x: placed.x + placed.width / 8, y: placed.middle.y });
    const right = await colorOnPage(page, {
      x: placed.x + placed.width * 7 / 8,
      y: placed.middle.y,
    });
    expect(Math.max(...left)).toBeLessThan(EDGE_GRAY_MIN);
    expect(Math.min(...right)).toBeGreaterThan(EDGE_GRAY_MAX);
  });
  await holdButton(page, hand, LARGER, GROW_TO_FULL_MS);
  await check('holding Larger grows the logo to the full width of the crop', async () => {
    expectNear((await logoPlacement(page)).w, 1, FRACTION_TOLERANCE);
  });
  const { image, gray } = await savedEdgeGray(page, hand);
  await check(`a 3000 × 3000 px PNG is saved; across the logo's middle the black turns white `
    + `within ${SHARP_EDGE_MAX_PX} px`, async () => {
    expect([image.width, image.height]).toEqual([3000, 3000]);
    expect(gray).toBeLessThanOrEqual(SHARP_EDGE_MAX_PX);
  });
});

test('OVL-02.5 A logo\'s see-through parts stay see-through in the saved file [phone] [webkit]',
  async ({ page, check }, testInfo) => {
    const hand = await startOnOverlay(page, testInfo);
    await goToStep(page, 'export', hand);
    const before = await downloadAnswering(page, hand, 'No');
    await goToStep(page, 'overlay', hand);
    await addDisc(page, hand);
    const box = await logoBox(page);
    const placed = await logoPlacement(page);
    await goToStep(page, 'export', hand);
    const after = await downloadAnswering(page, hand, 'No');
    // Points as fractions of the saved image: the logo box's top-left corner area (outside the
    // disc) and a point inside the disc.
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
    await check('in the second file the corner of the logo\'s square shows the photo as in the '
      + 'first; inside the disc it is blue', async () => {
      for (let channel = 0; channel < 3; channel++) {
        expectNear(withLogo.pixels[0][channel], without.pixels[0][channel], SAME_COLOR_TOLERANCE);
      }
      expectBlue(withLogo.pixels[1]);
    });
  });

test('OVL-02.6 A logo larger than the cap is scaled down to it [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnOverlay(page, testInfo);
  const logo = await drawnLogo(page, { name: 'split.png', width: 2048, height: 1024,
    paint: 'split' });
  await chooseLogo(page, hand, page.locator('#btnOverlayAdd'), logo);
  await holdButton(page, hand, LARGER, GROW_TO_FULL_MS);
  await check('holding Larger grows the logo to the full width of the crop', async () => {
    expectNear((await logoPlacement(page)).w, 1, FRACTION_TOLERANCE);
  });
  const sharp = await savedEdgeGray(page, hand);
  await check(`without a cap, across the logo's middle the black turns white within `
    + `${SHARP_EDGE_MAX_PX} px`, async () => {
    expect(sharp.gray).toBeLessThanOrEqual(SHARP_EDGE_MAX_PX);
  });
  await startOnOverlay(page, testInfo, { address: 'index.html?overlay.maxPx=256' });
  await chooseLogo(page, hand, page.locator('#btnOverlayAdd'), logo);
  await holdButton(page, hand, LARGER, GROW_TO_FULL_MS);
  const soft = await savedEdgeGray(page, hand);
  await check(`with the cap at 256 px the same edge is soft: ${SOFT_EDGE_MIN_PX} px of gray or `
    + 'more', async () => {
    expect(soft.gray).toBeGreaterThanOrEqual(SOFT_EDGE_MIN_PX);
  });
});

// One key of the move pad, by its direction: 'left', 'up', 'down' or 'right'.
const MOVE_KEY_VALUES = { left: '-1,0', up: '0,-1', down: '0,1', right: '1,0' };
const moveKey = (page, direction) => page.locator(
  `#overlayMovePad [data-key="${MOVE_KEY_VALUES[direction]}"]`);

test('OVL-03.1 A new logo lands in the middle, a quarter wide, at 100% [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnOverlay(page, testInfo);
  const stepsBefore = await undoSteps(page);
  await addDisc(page, hand);
  const placed = await logoPlacement(page);
  await check('the logo\'s middle is on the middle of the photo, its width a quarter of the '
    + 'photo\'s; Opacity reads 100%', async () => {
    expectNear(placed.cx, 0.5, FRACTION_TOLERANCE);
    expectNear(placed.cy, 0.5, FRACTION_TOLERANCE);
    expectNear(placed.w, START_WIDTH, FRACTION_TOLERANCE);
    expect(placed.opacity).toBe(1);
    await expect(page.locator('#overlayOpacityValue')).toHaveText('100%');
    expect(await undoSteps(page)).toBe(stepsBefore + 1);
  });
  await hand.tap(page.locator('#btnUndo'));
  await check('one Undo takes the logo off; Add logo shows again', async () => {
    expect(await logoId(page)).toBeNull();
    await expect(page.locator('#btnOverlayAdd')).toBeVisible();
    expect(await undoSteps(page)).toBe(stepsBefore);
  });
});

test('OVL-03.2 Two logos added within 0.9 s are two undo steps [phone]', async ({
  page,
  check,
}, testInfo) => {
  test.fail(true, 'BUG-080');
  const hand = await startOnOverlay(page, testInfo);
  const first = await discLogo(page);
  const second = await drawnLogo(page, { name: 'green.png', paint: 'green' });
  const startedMs = Date.now();
  const firstId = await chooseLogo(page, hand, page.locator('#btnOverlayAdd'), first);
  const secondId = await chooseLogo(page, hand, page.locator('#toolOverlayReplace'), second);
  const tookMs = Date.now() - startedMs;
  await check('within 0.9 s of the first, green.png has taken the blue disc\'s place', () => {
    expect(secondId).not.toBe(firstId);
    expect(tookMs).toBeLessThan(UNDO_GAP_MS);
  });
  await hand.tap(page.locator('#btnUndo'));
  const afterUndo = await logoId(page);
  await check('Undo brings the blue disc back', () => {
    expect(afterUndo).toBe(firstId);
  });
});

test('OVL-04.1 Use saved overlay places the saved logo where it was last [phone] [webkit]',
  async ({ page, check }, testInfo) => {
    const hand = await startOnOverlay(page, testInfo);
    const saved = await addDisc(page, hand);
    await hand.tap(moveKey(page, 'right'));
    await hand.tap(moveKey(page, 'right'));
    await hand.tap(page.locator(LARGER));
    const moved = await logoPlacement(page);
    await check('the logo moves right and grows', () => {
      expectNear(moved.cx, 0.5 + 2 * NUDGE_FRAC, FRACTION_TOLERANCE);
      expectNear(moved.w, START_WIDTH * SIZE_STEP, FRACTION_TOLERANCE);
    });
    // A person waits a moment before opening the next photo; the place is saved 0.4 s after
    // the last change.
    await waitForSavedSettings(page, { cx: moved.cx, w: moved.w });
    await pickWith(page, hand, page.locator('#btnOpen'), SECOND_PHOTO);
    await waitForPhoto(page, SECOND_PHOTO);
    await goToStep(page, 'overlay', hand);
    await check('on IMG_9075.JPEG no logo is on the photo; the thumbnail and Use saved overlay '
      + 'show beside Add logo', async () => {
      expect(await logoId(page)).toBeNull();
      await expect(page.locator('#overlayThumb')).toBeVisible();
      await expect(page.locator('#btnUseSaved')).toBeVisible();
      await expect(page.locator('#btnOverlayAdd')).toBeVisible();
    });
    await hand.tap(page.locator('#btnUseSaved'));
    await page.waitForFunction(() => !!window.__straightener.app.state.overlay);
    const placed = await logoPlacement(page);
    await check('Use saved overlay places the blue disc as far right and as large as it was, '
      + 'at 100%', async () => {
      expect(await logoId(page)).toBe(saved);
      expectNear(placed.cx, moved.cx, FRACTION_TOLERANCE);
      expectNear(placed.cy, moved.cy, FRACTION_TOLERANCE);
      expectNear(placed.w, moved.w, FRACTION_TOLERANCE);
      await expect(page.locator('#overlayOpacityValue')).toHaveText('100%');
    });
    await hand.tap(page.locator('#btnUndo'));
    await check('one Undo takes it off; Use saved overlay shows again', async () => {
      expect(await logoId(page)).toBeNull();
      await expect(page.locator('#btnUseSaved')).toBeVisible();
    });
  });

test('OVL-05.1 The pads take the place of Add logo [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnOverlay(page, testInfo);
  await check('with no logo, Add logo shows and the pads don\'t', async () => {
    await expect(page.locator('#overlayAddRow')).toBeVisible();
    await expect(page.locator('#overlayPadRow')).toBeHidden();
  });
  await addDisc(page, hand);
  await check('with the logo placed, the move pad and the size pad show and Add logo doesn\'t',
    async () => {
      await expect(page.locator('#overlayMovePad')).toBeVisible();
      await expect(page.locator('#overlaySizePad')).toBeVisible();
      await expect(page.locator('#overlayAddRow')).toBeHidden();
    });
  await hand.tap(page.locator('#toolOverlayRemove'));
  await check('after Remove, Add logo shows again, with the saved logo\'s Use saved overlay, '
    + 'and the pads don\'t', async () => {
    await expect(page.locator('#btnOverlayAdd')).toBeVisible();
    await expect(page.locator('#btnUseSaved')).toBeVisible();
    await expect(page.locator('#overlayPadRow')).toBeHidden();
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
    await check('while the finger is still down at the middle, the value reads about 50% and '
      + 'the disc shows the photo through it', () => {
      const value = parseInt(percent, 10);
      expect(value).toBeGreaterThan(40);
      expect(value).toBeLessThan(60);
      expectNotBlue(color);
    });
    await liftSlide(page, held);
    const placed = await logoPlacement(page);
    await check('after letting go the value stays; the logo\'s opacity matches it', async () => {
      await expect(page.locator('#overlayOpacityValue')).toHaveText(percent);
      expect(Math.round(placed.opacity * 100)).toBe(parseInt(percent, 10));
    });
    await hand.tap(page.locator('#btnUndo'));
    await check('one Undo sets it back to 100%, the disc solid blue', async () => {
      await expect(page.locator('#overlayOpacityValue')).toHaveText('100%');
      expectBlue(await colorOnPage(page, point));
    });
  });

test('OVL-07.1 Each arrow of the move pad moves the logo 0.5% of the photo\'s width [phone]',
  async ({ page, check }, testInfo) => {
    const hand = await startOnOverlay(page, testInfo);
    await addDisc(page, hand);
    const start = await logoBox(page);
    const { cropWidth } = await logoPlacement(page);
    const stepPx = NUDGE_FRAC * cropWidth;
    const moves = [
      ['right', 'left', stepPx, 'Move right moves the logo right by 0.5% of the photo\'s width'],
      ['left', 'left', 0, 'Move left moves it back'],
      ['down', 'top', stepPx, 'Move down moves it down by 0.5% of the photo\'s width'],
      ['up', 'top', 0, 'Move up moves it back'],
    ];
    for (const [direction, edge, offsetPx, result] of moves) {
      await hand.tap(moveKey(page, direction));
      const box = await logoBox(page);
      await check(result, () => {
        expectNear(box[edge] - start[edge], offsetPx, PICTURE_TOLERANCE_PX / 10);
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
  const stepsBefore = await undoSteps(page);
  const startedMs = Date.now();
  await hand.tap(moveKey(page, 'right'));
  await hand.tap(moveKey(page, 'right'));
  await hand.tap(moveKey(page, 'down'));
  const tookMs = Date.now() - startedMs;
  const moved = await logoPlacement(page);
  await check('three quick presses (right, right, down) move the logo', () => {
    expect(tookMs).toBeLessThan(UNDO_GAP_MS);
    expectNear(moved.cx, start.cx + 2 * NUDGE_FRAC, FRACTION_TOLERANCE);
    expect(moved.cy).toBeGreaterThan(start.cy);
  });
  await hand.tap(page.locator('#btnUndo'));
  const undone = await logoPlacement(page);
  await check('one Undo puts it back in the middle', async () => {
    expectNear(undone.cx, start.cx, FRACTION_TOLERANCE);
    expectNear(undone.cy, start.cy, FRACTION_TOLERANCE);
    expect(await undoSteps(page)).toBe(stepsBefore);
  });
  await hand.tap(moveKey(page, 'right'));
  await page.waitForTimeout(PAUSE_MS);
  await hand.tap(moveKey(page, 'right'));
  await hand.tap(page.locator('#btnUndo'));
  const oneBack = await logoPlacement(page);
  await check('two presses a second apart, then Undo, take back only the second', () => {
    expectNear(oneBack.cx, start.cx + NUDGE_FRAC, FRACTION_TOLERANCE);
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
  await check(`holding Move right for 1 s moves the logo at least ${HELD_MOVES_MIN} steps`, () => {
    const steps = Math.round((held.cx - start.cx) / NUDGE_FRAC);
    expect(steps).toBeGreaterThanOrEqual(HELD_MOVES_MIN);
  });
  await hand.tap(page.locator('#btnUndo'));
  await check('one Undo puts it back in the middle', async () => {
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
  await check('Larger (+) makes the logo 1.05 times as wide and high, its middle kept', () => {
    expectNear(larger.width, start.width * SIZE_STEP, PICTURE_TOLERANCE_PX / 10);
    expectNear(larger.height, start.height * SIZE_STEP, PICTURE_TOLERANCE_PX / 10);
    expectNear(larger.left + larger.width / 2, start.left + start.width / 2,
      PICTURE_TOLERANCE_PX / 10);
  });
  await hand.tap(page.locator(SMALLER));
  const back = await logoBox(page);
  await check('Smaller (−) makes it its first size again', () => {
    expectNear(back.width, start.width, PICTURE_TOLERANCE_PX / 10);
  });
  await hand.tap(page.locator(SMALLER));
  const smaller = await logoBox(page);
  await check('Smaller again makes it 1.05 times smaller than at first', () => {
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
  await check(`holding Larger for 1 s grows the logo at least ${HELD_MOVES_MIN} steps`, () => {
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
  await check('Move right then Larger, quickly: the logo moves and grows', () => {
    expect(tookMs).toBeLessThan(UNDO_GAP_MS);
    expect(changed.cx).toBeGreaterThan(start.cx);
    expect(changed.w).toBeGreaterThan(start.w);
  });
  await hand.tap(page.locator('#btnUndo'));
  const undone = await logoPlacement(page);
  await check('one Undo takes back both: the middle, a quarter wide', () => {
    expectNear(undone.cx, start.cx, FRACTION_TOLERANCE);
    expectNear(undone.w, start.w, FRACTION_TOLERANCE);
  });
});

// Changes the logo from where it lands: Move right twice, Larger once, then Opacity slid to
// about half. Returns the placement it ends at.
async function moveGrowAndFade(page, hand) {
  await hand.tap(moveKey(page, 'right'));
  await hand.tap(moveKey(page, 'right'));
  await hand.tap(page.locator(LARGER));
  await slide(page, hand, page.locator('#overlayOpacity'), SLIDER_RIGHT_END,
    SLIDER_MIDDLE);
  return logoPlacement(page);
}

test('OVL-09.1 A replacement logo takes the old one\'s place, width and opacity [phone]',
  async ({ page, check }, testInfo) => {
    test.fail(true, 'BUG-081');
    const hand = await startOnOverlay(page, testInfo);
    const first = await addDisc(page, hand);
    const changed = await moveGrowAndFade(page, hand);
    await check('the blue disc moves right, grows, and Opacity reads about 50%', () => {
      expect(changed.cx).toBeGreaterThan(0.5);
      expect(changed.w).toBeGreaterThan(START_WIDTH);
      expect(changed.opacity).toBeLessThan(1);
    });
    await page.waitForTimeout(PAUSE_MS);
    const green = await drawnLogo(page, { name: 'green.png', paint: 'green' });
    const second = await chooseLogo(page, hand, page.locator('#toolOverlayReplace'), green);
    const replaced = await logoPlacement(page);
    await check('green.png takes the disc\'s place at the same place, width and opacity', () => {
      expect(second).not.toBe(first);
      expectNear(replaced.cx, changed.cx, FRACTION_TOLERANCE);
      expectNear(replaced.cy, changed.cy, FRACTION_TOLERANCE);
      expectNear(replaced.w, changed.w, FRACTION_TOLERANCE);
      expect(replaced.opacity).toBe(changed.opacity);
    });
  });

test('OVL-09.2 The replacement becomes the saved logo [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnOverlay(page, testInfo);
  const first = await addDisc(page, hand);
  await page.waitForTimeout(PAUSE_MS);
  const green = await drawnLogo(page, { name: 'green.png', paint: 'green' });
  const second = await chooseLogo(page, hand, page.locator('#toolOverlayReplace'), green);
  await check('Replace logo opens the file picker; green.png takes the blue disc\'s place',
    () => {
      expect(second).not.toBe(first);
    });
  await hand.tap(page.locator('#toolOverlayRemove'));
  await check('after Remove, the thumbnail beside Use saved overlay shows the green square',
    async () => {
      await expect(page.locator('#overlayThumb')).toBeVisible();
      const thumbColor = await page.locator('#overlayThumb').evaluate(async img => {
        await img.decode();
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, 1, 1);
        return Array.from(ctx.getImageData(0, 0, 1, 1).data.slice(0, 3));
      });
      expect(thumbColor[1]).toBeGreaterThan(BLUE_MIN);
      expect(thumbColor[2]).toBeLessThan(NOT_BLUE_MAX);
    });
  await hand.tap(page.locator('#btnUseSaved'));
  await page.waitForFunction(() => !!window.__straightener.app.state.overlay);
  await check('Use saved overlay places green.png', async () => {
    expect(await logoId(page)).toBe(second);
  });
});

test('OVL-10.1 Reset puts the logo back in the middle, a quarter wide, at 100% [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnOverlay(page, testInfo);
  await addDisc(page, hand);
  const changed = await moveGrowAndFade(page, hand);
  await check('the logo moves right, grows, and Opacity reads about 50%', () => {
    expect(changed.cx).toBeGreaterThan(0.5);
    expect(changed.w).toBeGreaterThan(START_WIDTH);
    expect(changed.opacity).toBeLessThan(1);
  });
  await page.waitForTimeout(PAUSE_MS);
  await hand.tap(page.locator('#toolOverlayReset'));
  const reset = await logoPlacement(page);
  await check('Reset: the middle of the photo, a quarter of its width, Opacity 100%', async () => {
    expectNear(reset.cx, 0.5, FRACTION_TOLERANCE);
    expectNear(reset.cy, 0.5, FRACTION_TOLERANCE);
    expectNear(reset.w, START_WIDTH, FRACTION_TOLERANCE);
    await expect(page.locator('#overlayOpacityValue')).toHaveText('100%');
  });
  await hand.tap(page.locator('#btnUndo'));
  const undone = await logoPlacement(page);
  await check('one Undo brings back the moved, larger, fainter logo', () => {
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
  await check('the disc is gone from the photo; Add logo shows, with the thumbnail and Use saved '
    + 'overlay beside it', async () => {
    expect(await logoId(page)).toBeNull();
    expectNotBlue(await colorOnPage(page, point));
    await expect(page.locator('#btnOverlayAdd')).toBeVisible();
    await expect(page.locator('#overlayThumb')).toBeVisible();
    await expect(page.locator('#btnUseSaved')).toBeVisible();
  });
  await hand.tap(page.locator('#btnUndo'));
  await check('one Undo puts the disc back where it was', async () => {
    expect(await logoId(page)).toBe(logo);
    expectBlue(await colorOnPage(page, point));
  });
});

test('OVL-12.1 Delete saved forgets the saved logo and leaves the one on the photo [phone] '
  + '[webkit]', async ({ page, check }, testInfo) => {
  const hand = await startOnOverlay(page, testInfo);
  const logo = await addDisc(page, hand);
  const point = inDisc(await logoOnPage(page));
  await waitForSavedSettings(page, { cx: 0.5 });
  await hand.tap(page.locator('#toolOverlayDeleteSaved'));
  await check('the disc stays on the photo; Delete saved is greyed out', async () => {
    expect(await logoId(page)).toBe(logo);
    expectBlue(await colorOnPage(page, point));
    await expect(page.locator('#toolOverlayDeleteSaved')).toBeDisabled();
  });
  await hand.tap(page.locator('#toolOverlayRemove'));
  await check('after Remove, Add logo shows alone: no thumbnail, no Use saved overlay',
    async () => {
      await expect(page.locator('#btnOverlayAdd')).toBeVisible();
      await expect(page.locator('#overlayThumb')).toBeHidden();
      await expect(page.locator('#btnUseSaved')).toBeHidden();
    });
  await startOnOverlay(page, testInfo, { photo: SECOND_PHOTO });
  await check('after a reload, with IMG_9075.JPEG open, Overlay offers no saved logo',
    async () => {
      const stored = await page.evaluate(() => window.__straightener.Session.get('overlay'));
      expect(stored === null || stored === undefined).toBe(true);
      await expect(page.locator('#btnUseSaved')).toBeHidden();
      await expect(page.locator('#overlayTools')).toBeHidden();
    });
});

// Expects the tool row to show exactly the tools named (by id), and no other.
async function expectTools(page, shownIds) {
  const all = [
    'toolOverlayReplace',
    'toolOverlayReset',
    'toolOverlayRemove',
    'toolOverlayDeleteSaved',
  ];
  await expect(page.locator('#overlayTools')).toBeVisible();
  for (const id of all) {
    if (shownIds.includes(id)) await expect(page.locator(`#${id}`)).toBeVisible();
    else await expect(page.locator(`#${id}`)).toBeHidden();
  }
}

test('OVL-13.1 The tool row shows the tools that can act [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnOverlay(page, testInfo);
  const allTools = [
    'toolOverlayReplace',
    'toolOverlayReset',
    'toolOverlayRemove',
    'toolOverlayDeleteSaved',
  ];
  await check('with no logo placed and none saved, there is no tool row', async () => {
    await expect(page.locator('#overlayTools')).toBeHidden();
  });
  await addDisc(page, hand);
  await check('with a logo placed: Replace logo, Reset, Remove and Delete saved, all live',
    async () => {
      await expectTools(page, allTools);
      await expect(page.locator('#toolOverlayDeleteSaved')).toBeEnabled();
    });
  await hand.tap(page.locator('#toolOverlayRemove'));
  await check('after Remove, with a logo saved, Delete saved shows alone', async () => {
    await expectTools(page, ['toolOverlayDeleteSaved']);
  });
  await hand.tap(page.locator('#btnUseSaved'));
  await page.waitForFunction(() => !!window.__straightener.app.state.overlay);
  await hand.tap(page.locator('#toolOverlayDeleteSaved'));
  await check('after Use saved overlay and Delete saved: all four tools, Delete saved greyed out',
    async () => {
      await expectTools(page, allTools);
      await expect(page.locator('#toolOverlayDeleteSaved')).toBeDisabled();
    });
  await hand.tap(page.locator('#toolOverlayRemove'));
  await check('after Remove, with nothing saved, there is no tool row', async () => {
    await expect(page.locator('#overlayTools')).toBeHidden();
  });
});

test('OVL-14.1 A file that isn\'t a picture gets a red message in place of the hint [phone]',
  async ({ page, check }, testInfo) => {
    const hand = await startOnOverlay(page, testInfo);
    await chooseBadLogo(page, hand, page.locator('#btnOverlayAdd'), textNamedPng());
    await check('a red message reads "' + CANT_READ + '" in place of the hint; no logo',
      async () => {
        await expect(page.locator('#overlayStatus')).toHaveText(CANT_READ);
        await expect(page.locator('#overlayStatus')).toHaveClass(/is-error/);
        await expect(page.locator('#overlayHintLine')).toBeHidden();
        expect(await logoId(page)).toBeNull();
      });
    await addDisc(page, hand);
    await check('after a good logo is added the message has gone; Opacity shows', async () => {
      await expect(page.locator('#overlayStatus')).toBeHidden();
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
  await check('a red message reads "That file is 6.0 MB. The overlay limit is 5 MB." in place '
    + 'of Opacity; the disc stays as it was', async () => {
    await expect(page.locator('#overlayStatus')).toHaveText(
      'That file is 6.0 MB. The overlay limit is 5 MB.');
    await expect(page.locator('#overlayOpacityLine')).toBeHidden();
    expect(await logoId(page)).toBe(logo);
    expect(await logoPlacement(page)).toEqual(before);
  });
  await hand.tap(moveKey(page, 'right'));
  await check('Move right moves the disc and the message goes; Opacity shows again', async () => {
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
  await chooseBadLogo(page, hand, page.locator('#toolOverlayReplace'), textNamedPng());
  await check('a red message reads "' + CANT_READ + '"', async () => {
    await expect(page.locator('#overlayStatus')).toHaveText(CANT_READ);
  });
  await hand.tap(page.locator('#toolOverlayRemove'));
  await check('after Remove the message has gone; the hint shows', async () => {
    await expect(page.locator('#overlayStatus')).toBeHidden();
    await expect(page.locator('#overlayHintLine')).toHaveText(HINT);
  });
  await chooseBadLogo(page, hand, page.locator('#btnOverlayAdd'), textNamedPng());
  await check('the message shows again for the same file', async () => {
    await expect(page.locator('#overlayStatus')).toHaveText(CANT_READ);
  });
  await goToStep(page, 'export', hand);
  await goToStep(page, 'overlay', hand);
  await check('after Export and back to Overlay the message has gone; the hint shows',
    async () => {
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
  await chooseBadLogo(page, hand, page.locator('#btnOverlayAdd'), textNamedPng());
  await check('on the back\'s Overlay step a red message reads "' + CANT_READ + '"', async () => {
    await expect(page.locator('#overlayStatus')).toHaveText(CANT_READ);
  });
  await switchTo(page, hand, 'front');
  await check('after Front, the front\'s Overlay step shows the hint and no message',
    async () => {
      expect(await page.evaluate(() => window.__straightener.app.tab)).toBe('overlay');
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
// How long the rings take to come back after a gesture, in ms: 100 ms, then a 150 ms fade.
const RINGS_BACK_MS = 400;

// A point of the photo away from the logo, its corners and the rings: a quarter of the way in
// from the crop's left edge and three quarters of the way down.
async function emptyPoint(page) {
  const crop = await cropOnPage(page);
  return {
    x: crop.left + (crop.right - crop.left) / 4,
    y: crop.top + (crop.bottom - crop.top) * 3 / 4,
  };
}

// A point moved by (dx, dy) CSS px.
const movedBy = (point, dx, dy) => ({ x: point.x + dx, y: point.y + dy });

test('OVL-15.1 A drag and a pinch on the photo move the logo, not the photo [phone] [webkit]',
  async ({ page, check }, testInfo) => {
    const hand = await startOnOverlay(page, testInfo);
    await addDisc(page, hand);
    const view = await viewNow(page);
    const start = await logoOnPage(page);
    const from = await emptyPoint(page);
    await hand.drag(from, movedBy(from, DRAG_ACROSS_PX, DRAG_DOWN_PX));
    const dragged = await logoOnPage(page);
    await check('a drag on an empty part of the photo moves the logo; the photo doesn\'t move',
      async () => {
        expect(await viewNow(page)).toEqual(view);
        expectNear(dragged.middle.x - start.middle.x, DRAG_ACROSS_PX, PAGE_TOLERANCE_PX);
      });
    await pinchAt(page, await emptyPoint(page), PINCH_START_PX, PINCH_END_PX);
    const pinched = await logoOnPage(page);
    await check('a pinch on the photo makes the logo larger; the photo doesn\'t zoom', async () => {
      expect(await viewNow(page)).toEqual(view);
      expect(pinched.width).toBeGreaterThan(dragged.width);
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
  await hand.drag(from, movedBy(from, DRAG_ACROSS_PX, DRAG_DOWN_PX));
  await check('a drag on the photo: the photo doesn\'t move; Undo has nothing new', async () => {
    expect(await viewNow(page)).toEqual(view);
    expect(await undoSteps(page)).toBe(steps);
  });
  await pinchAt(page, from, PINCH_START_PX, PINCH_END_PX);
  await check('a pinch on the photo: the photo doesn\'t zoom; Undo has nothing new', async () => {
    expect(await viewNow(page)).toEqual(view);
    expect(await undoSteps(page)).toBe(steps);
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
  await check('with no logo, the wheel over the photo changes nothing', async () => {
    expect(await viewNow(page)).toEqual(view);
    expect(await logoId(page)).toBeNull();
  });
  await addDisc(page, hand);
  await page.mouse.move(point.x, point.y);
  await page.mouse.wheel(0, -BIG_WHEEL_PX);
  await check('with the logo placed, the wheel doesn\'t zoom the photo either', async () => {
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
  await hand.drag(from, movedBy(from, DRAG_ACROSS_PX, DRAG_DOWN_PX));
  const moved = await logoOnPage(page);
  await check('the logo moves 60 px right and 40 px down with the finger, its size kept', () => {
    expectNear(moved.middle.x - start.middle.x, DRAG_ACROSS_PX, PAGE_TOLERANCE_PX);
    expectNear(moved.middle.y - start.middle.y, DRAG_DOWN_PX, PAGE_TOLERANCE_PX);
    expectNear(moved.width, start.width, PAGE_TOLERANCE_PX);
  });
  await hand.tap(page.locator('#btnUndo'));
  const undone = await logoOnPage(page);
  await check('one Undo puts it back in the middle', () => {
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
  await hand.drag(from, movedBy(from, -DRAG_DOWN_PX, -DRAG_ACROSS_PX));
  const moved = await logoOnPage(page);
  await check('a drag that starts on an empty part of the photo moves the logo 40 px left and '
    + '60 px up', () => {
    expectNear(moved.middle.x - start.middle.x, -DRAG_DOWN_PX, PAGE_TOLERANCE_PX);
    expectNear(moved.middle.y - start.middle.y, -DRAG_ACROSS_PX, PAGE_TOLERANCE_PX);
  });
});

test('OVL-17.1 Dragging a corner resizes the logo, its shape and the far corner kept [phone] '
  + '[webkit]', async ({ page, check }, testInfo) => {
  const hand = await startOnOverlay(page, testInfo);
  await addDisc(page, hand);
  const start = await logoOnPage(page);
  const corner = start.corners.se;
  await hand.drag(corner, movedBy(corner, CORNER_DRAG_PX, CORNER_DRAG_PX / 2));
  const resized = await logoOnPage(page);
  await check('dragging the bottom-right handle 40 px right and 20 px down: the logo is 40 px '
    + 'wider and 40 px higher; its top-left corner stays', () => {
    expectNear(resized.width - start.width, CORNER_DRAG_PX, PAGE_TOLERANCE_PX);
    expectNear(resized.height - start.height, CORNER_DRAG_PX, PAGE_TOLERANCE_PX);
    expectNear(resized.x, start.x, PAGE_TOLERANCE_PX);
    expectNear(resized.y, start.y, PAGE_TOLERANCE_PX);
  });
  await hand.tap(page.locator('#btnUndo'));
  await check('one Undo gives it its first size', async () => {
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
  const farPast = movedBy(start.corners.nw, -2 * CORNER_DRAG_PX, -2 * CORNER_DRAG_PX);
  await hand.drag(corner, farPast);
  const box = await logoBox(page);
  const shrunk = await logoOnPage(page);
  await check('dragging the bottom-right handle far past the top-left one leaves a logo 8 px '
    + 'of the photo wide, its top-left corner where it was', () => {
    expectNear(box.width, MIN_WIDTH_PX, PICTURE_TOLERANCE_PX);
    expectNear(shrunk.x, start.x, PAGE_TOLERANCE_PX);
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
  const between = { x: (corner.x + ring.x) / 2, y: (corner.y + ring.y) / 2 };
  const fromCorner = Math.hypot(between.x - corner.x, between.y - corner.y);
  const fromRing = Math.hypot(between.x - ring.x, between.y - ring.y);
  await check('the top-left ring snaps the logo to the top-left; a point between its top-left '
    + 'handle and the ring is within 24 px of both', () => {
    expect(snapped.x).toBeLessThan(ring.x);
    expect(fromCorner).toBeLessThan(HIT_RADIUS_PX);
    expect(fromRing).toBeLessThan(HIT_RADIUS_PX);
  });
  await hand.drag(between, movedBy(between, CORNER_DRAG_PX / 2, CORNER_DRAG_PX / 2));
  const resized = await logoOnPage(page);
  await check('a drag from there resizes the logo: smaller, its bottom-right corner kept', () => {
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
  await check('two fingers spread from 40 to 100 px apart make the logo 2.5 times as wide, its '
    + 'middle kept', () => {
    expectNear(pinched.width / start.width, PINCH_END_PX / PINCH_START_PX, RATIO_TOLERANCE);
    expectNear(pinched.middle.x, start.middle.x, PAGE_TOLERANCE_PX);
    expectNear(pinched.middle.y, start.middle.y, PAGE_TOLERANCE_PX);
  });
  await hand.tap(page.locator('#btnUndo'));
  await check('one Undo gives it its first size', async () => {
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
  await check('two fingers spread, then the right one lifts: the logo is larger', () => {
    expect(pinched.width).toBeGreaterThan(start.width);
  });
  const left = finger(PINCH_END_PX, -1);
  for (let i = 1; i <= FINGER_MOVES; i++) {
    const step = movedBy(left, DRAG_ACROSS_PX * i / FINGER_MOVES, 0);
    await sendTouch(page, '#view', 'pointermove', step, FIRST_FINGER);
  }
  await sendTouch(page, '#view', 'pointerup', movedBy(left, DRAG_ACROSS_PX, 0), FIRST_FINGER);
  const moved = await logoOnPage(page);
  await check('the left finger, still down, moves 60 px right and the logo moves with it',
    () => {
      expectNear(moved.middle.x - pinched.middle.x, DRAG_ACROSS_PX, PAGE_TOLERANCE_PX);
      expectNear(moved.width, pinched.width, PAGE_TOLERANCE_PX);
    });
  await hand.tap(page.locator('#btnUndo'));
  const undone = await logoOnPage(page);
  await check('one Undo takes back the whole gesture: the first size, in the middle', () => {
    expectNear(undone.width, start.width, PAGE_TOLERANCE_PX);
    expectNear(undone.middle.x, start.middle.x, PAGE_TOLERANCE_PX);
  });
});

test('OVL-19.1 Nine rings on the photo, for a person to judge [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnOverlay(page, testInfo);
  await addDisc(page, hand);
  await page.waitForTimeout(RINGS_BACK_MS);
  await check('the logo is placed', async () => {
    expect(await logoId(page)).not.toBeNull();
  });
  await check.eye('nine white rings with a dot in each sit on the framed photo: at its four '
    + 'corners, the middles of its four sides and its center, each the same small distance in '
    + 'from the edges; the center ring sits on the middle of the logo');
});

test('OVL-20.1 Tapping a corner ring snaps the logo there at once, one undo step [phone] '
  + '[webkit]', async ({ page, check }, testInfo) => {
  const hand = await startOnOverlay(page, testInfo);
  await addDisc(page, hand);
  const ring = await ringOnPage(page, 'tr');
  await tapAt(page, hand, ring);
  const box = await logoBox(page);
  const { cropWidth } = await logoPlacement(page);
  const marginPx = SNAP_MARGIN_FRAC * cropWidth;
  await check('at once, the logo\'s top and right edges are 3% of the photo\'s width in from '
    + 'the top and right', () => {
    expectNear(cropWidth - box.right, marginPx, PICTURE_TOLERANCE_PX);
    expectNear(box.top, marginPx, PICTURE_TOLERANCE_PX);
  });
  await hand.tap(page.locator('#btnUndo'));
  const undone = await logoPlacement(page);
  await check('one Undo puts it back in the middle', () => {
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
  await check('the bottom ring: the logo is centered across, its bottom edge 3% of the photo\'s '
    + 'width up from the bottom', () => {
    expectNear(placed.cx, 0.5, FRACTION_TOLERANCE);
    expectNear(placed.cropHeight - box.bottom, SNAP_MARGIN_FRAC * placed.cropWidth,
      PICTURE_TOLERANCE_PX);
  });
  await page.waitForTimeout(RINGS_BACK_MS);
  await tapAt(page, hand, await ringOnPage(page, 'c'));
  const centered = await logoPlacement(page);
  await check('the center ring: the logo is in the middle again', () => {
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
  await hand.drag(ring, movedBy(ring, DRAG_ACROSS_PX, 0));
  const moved = await logoOnPage(page);
  await check('a drag from the left ring 60 px right moves the logo 60 px right; it doesn\'t '
    + 'snap to the left', () => {
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
  const end = movedBy(start, DRAG_ACROSS_PX, DRAG_DOWN_PX);
  await holdDragAt(page, hand, start, end);
  await page.waitForTimeout(RINGS_BACK_MS);
  await check('mid-drag, the logo has moved with the finger', async () => {
    expect((await logoPlacement(page)).cx).toBeGreaterThan(0.5);
  });
  await check.eye('mid-drag: no rings on the photo; the logo, its dashed box and its four '
    + 'handles show');
  await releaseDrag(page, hand, end);
  await page.waitForTimeout(RINGS_BACK_MS);
  await check.eye('after letting go: the nine rings are back');
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
  await check('the next frame after the tap on the bottom-right ring already shows the logo in '
    + 'the bottom-right corner', () => {
    expectBlue(color);
  });
});

test('OVL-23.1 The logo\'s box and handles, for a person to judge [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnOverlay(page, testInfo);
  await addDisc(page, hand);
  await page.waitForTimeout(RINGS_BACK_MS);
  await check('the logo is placed', async () => {
    expect(await logoId(page)).not.toBeNull();
  });
  await check.eye('on Overlay: a dashed white box around the blue disc and a small white square '
    + 'handle on each of its four corners');
  await goToStep(page, 'export', hand);
  await check.eye('on Export: the blue disc alone, with no box, no handles and no rings');
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
  await check('on Overlay the blue disc shows on the photo', async () => {
    expect(await blueShare(page)).toBeGreaterThan(SHOWN_SHARE_MIN);
  });
  for (const step of ['perspective', 'rotate', 'crop', 'levels']) {
    await goToStep(page, step, hand);
    await check(`on ${step[0].toUpperCase() + step.slice(1)} no logo shows`, async () => {
      expect(await blueShare(page)).toBeLessThan(HIDDEN_SHARE_MAX);
    });
  }
  await goToStep(page, 'export', hand);
  await check('on Export the blue disc shows again', async () => {
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
  await check('Opacity slid to the left end reads 0%', async () => {
    await expect(page.locator('#overlayOpacityValue')).toHaveText('0%');
  });
  await goToStep(page, 'export', hand);
  const photoColor = await colorOnPage(page, inDisc(await logoOnPage(page)));
  await check('on Export, at 0%, no logo shows', async () => {
    expect(await blueShare(page)).toBeLessThan(HIDDEN_SHARE_MAX);
  });
  await goToStep(page, 'overlay', hand);
  await slide(page, hand, slider, 0, SLIDER_MIDDLE);
  const percent = parseInt(await page.locator('#overlayOpacityValue').textContent(), 10);
  await goToStep(page, 'export', hand);
  const mixed = await colorOnPage(page, inDisc(await logoOnPage(page)));
  await check('at about 50%, on Export the disc is the photo and the blue mixed in that '
    + 'proportion', () => {
    const blue = [0, 0, 255];
    for (let channel = 0; channel < 3; channel++) {
      const expected = photoColor[channel] * (1 - percent / 100) + blue[channel] * percent / 100;
      expectNear(mixed[channel], expected, MIX_TOLERANCE);
    }
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
  await check('dragged past the right edge, the logo\'s right edge stops on the photo\'s', () => {
    expectNear(box.right, cropWidth, PICTURE_TOLERANCE_PX);
  });
});

test('OVL-25.2 The logo is shrunk to fit, and again when the crop changes [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnOverlay(page, testInfo);
  await goToStep(page, 'crop', hand);
  await hand.tap(page.locator('.preset-chip[data-value="5:7"]'));
  await goToStep(page, 'overlay', hand);
  const tall = await drawnLogo(page, { name: 'tall.png', width: 100, height: 400 });
  await chooseLogo(page, hand, page.locator('#btnOverlayAdd'), tall);
  await holdButton(page, hand, LARGER, HOLD_MS);
  const grown = await logoBox(page);
  const placed = await logoPlacement(page);
  await check('a logo four times as high as wide, held on Larger in a 5:7 crop, grows until it '
    + 'is as high as the photo and stops', () => {
    expectNear(grown.height, placed.cropHeight, PICTURE_TOLERANCE_PX);
    expectNear(grown.top, 0, PICTURE_TOLERANCE_PX);
  });
  await goToStep(page, 'crop', hand);
  await hand.tap(page.locator('.preset-chip[data-value="1:1"]'));
  await goToStep(page, 'overlay', hand);
  const fitted = await logoBox(page);
  const square = await logoPlacement(page);
  await check('after Crop is changed to 1:1, the logo is smaller, still as high as the photo, '
    + 'and wholly inside it', () => {
    expect(fitted.height).toBeLessThan(grown.height);
    expectNear(fitted.height, square.cropHeight, PICTURE_TOLERANCE_PX);
    expect(fitted.left).toBeGreaterThanOrEqual(-PICTURE_TOLERANCE_PX);
    expect(fitted.right).toBeLessThanOrEqual(square.cropWidth + PICTURE_TOLERANCE_PX);
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
  await check('a roll of the wheel away from you makes the logo larger', () => {
    expectNear(grown.w / start.w, WHEEL_FACTOR, FRACTION_TOLERANCE);
  });
  await page.mouse.wheel(0, WHEEL_PX);
  await page.mouse.wheel(0, WHEEL_PX);
  await expect.poll(async () => (await logoPlacement(page)).w).toBeLessThan(start.w);
  await check('two rolls toward you make it smaller than at first', async () => {
    expectNear((await logoPlacement(page)).w * WHEEL_FACTOR, start.w, FRACTION_TOLERANCE);
  });
  await page.waitForTimeout(PAUSE_MS);
  await hand.tap(page.locator('#btnUndo'));
  await check('one Undo takes back the three quick rolls', async () => {
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
    [placed.corners.se, 'nwse-resize', 'over the bottom-right handle: a diagonal resize arrow'],
    [placed.corners.ne, 'nesw-resize', 'over the top-right handle: the other diagonal arrow'],
    [await ringOnPage(page, 'tl'), 'pointer', 'over the top-left ring: a pointing hand'],
    [await emptyPoint(page), 'move', 'over the rest of the photo: the move cursor'],
  ];
  for (const [point, cursor, result] of hovers) {
    await page.mouse.move(point.x, point.y);
    await check(result, async () => {
      expect(await cursorNow(page)).toBe(cursor);
    });
  }
  await hand.tap(page.locator('#toolOverlayRemove'));
  const empty = await emptyPoint(page);
  await page.mouse.move(empty.x + 1, empty.y + 1);
  await check('after Remove, the plain arrow', async () => {
    expect(await cursorNow(page)).toBe('default');
  });
});

test('OVL-28.1 A change to the saved logo\'s place is saved 0.4 s later [phone] [webkit]',
  async ({ page, check }, testInfo) => {
    await watchStorageAndDownloads(page);
    const hand = await startOnOverlay(page, testInfo);
    const logo = await addDisc(page, hand);
    await check('the added logo is saved in the browser', async () => {
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
    const writes = await storageWritesSince(page, 'overlay', beforeTapMs);
    await check('after Move right, the new place is saved 0.4 s after the tap, not before',
      () => {
        expect(writes.length).toBe(1);
        expect(writes[0].atMs - beforeTapMs).toBeGreaterThanOrEqual(SAVE_DELAY_MS - TIMER_EARLY_MS);
        expect(writes[0].atMs - afterTapMs).toBeLessThan(SAVE_DELAY_MS + SAVE_LATE_MS);
      });
  });

test('OVL-28.2 A logo the browser won\'t keep still goes on the photo [phone]', async ({
  page,
  check,
}, testInfo) => {
  await refuseStorage(page, ['overlay']);
  const hand = await startOnOverlay(page, testInfo);
  await addDisc(page, hand);
  await check('the blue disc shows; a warning reads "' + CANT_SAVE + '"', async () => {
    expectBlue(await colorOnPage(page, inDisc(await logoOnPage(page))));
    await expect(page.locator('#toast')).toContainText(CANT_SAVE);
    expect((await toastNow(page)).kind).toBe('warn');
  });
  await hand.tap(page.locator('#toolOverlayRemove'));
  await check('after Remove, no saved logo is offered', async () => {
    await expect(page.locator('#btnOverlayAdd')).toBeVisible();
    await expect(page.locator('#btnUseSaved')).toBeHidden();
  });
});

test('OVL-28.3 After Delete saved, moving the logo saves nothing [phone]', async ({
  page,
  check,
}, testInfo) => {
  await watchStorageAndDownloads(page);
  const hand = await startOnOverlay(page, testInfo);
  await addDisc(page, hand);
  await waitForSavedSettings(page, { cx: 0.5 });
  await hand.tap(page.locator('#toolOverlayDeleteSaved'));
  const deletedMs = await lastClickMs(page);
  await hand.tap(moveKey(page, 'right'));
  await page.waitForTimeout(PAUSE_MS);
  await check('Move right moves the logo; a second later nothing has been saved as the logo',
    async () => {
      expectNear((await logoPlacement(page)).cx, 0.5 + NUDGE_FRAC, FRACTION_TOLERANCE);
      expect(await storageWritesSince(page, 'overlay', deletedMs)).toEqual([]);
      expect(await storedRecord(page, 'overlay')).toBeNull();
    });
});

// Saves the export as a PNG at Size `size` (its label), answering the Upscale question with
// `answer` if it is asked. Returns the saved file's path.
async function savePng(page, hand, size, answer = 'No') {
  await goToStep(page, 'export', hand);
  await hand.tap(choiceButton(page, 'exportFormat', 'PNG'));
  await hand.tap(choiceButton(page, 'exportSize', size));
  return (await downloadAnswering(page, hand, answer)).file;
}

// The green logo: 400 × 400 px of pure green.
const greenLogo = page => drawnLogo(page, { name: 'green.png', paint: 'green' });

test('OVL-29.1 Levels never change the logo in the saved file [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnOverlay(page, testInfo);
  await chooseLogo(page, hand, page.locator('#btnOverlayAdd'), await greenLogo(page));
  const box = await logoBox(page);
  const placed = await logoPlacement(page);
  const logoMiddle = [placed.cx, placed.cy];
  const photoPoint = [(box.left / 2) / placed.cropWidth, placed.cy];
  const before = await readSavedPixels(page, await savePng(page, hand, '2000'),
    [logoMiddle, photoPoint]);
  await goToStep(page, 'levels', hand);
  await hand.tap(page.locator('#toolAutoLevels'));
  await hand.tap(page.locator('#btnApplyLevels'));
  await check('Levels: Auto, then Apply, applies a white point; Apply is greyed out again',
    async () => {
      await expect(page.locator('#btnApplyLevels')).toBeDisabled();
      expect((await editState(page)).levels.white).not.toBeNull();
    });
  const after = await readSavedPixels(page, await savePng(page, hand, '2000'),
    [logoMiddle, photoPoint]);
  await check('in the PNG saved after the levels, the photo beside the logo is lighter or '
    + 'darker than before; the logo is the same pure green', () => {
    expect(after.pixels[1]).not.toEqual(before.pixels[1]);
    expect(after.pixels[0].slice(0, 3)).toEqual([0, 255, 0]);
    expect(before.pixels[0].slice(0, 3)).toEqual([0, 255, 0]);
  });
});

test('OVL-29.2 The upscale\'s sharpening never touches the logo [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnOverlay(page, testInfo);
  const greys = await drawnLogo(page, { name: 'greys.png', paint: 'greys' });
  await chooseLogo(page, hand, page.locator('#btnOverlayAdd'), greys);
  const file = await savePng(page, hand, '3000', 'Yes');
  const image = await readSavedLogo(page, file, { rowFrac: 0.5 });
  // The logo spans the middle quarter of the width; its own outer edges are left out.
  const inner = image.row.slice(Math.round(image.width * 0.38), Math.round(image.width * 0.62));
  await check('in the 3000 px PNG, across the logo\'s middle, no px is darker than its gray 100 '
    + 'or lighter than its gray 150', () => {
    expect([image.width, image.height]).toEqual([3000, 3000]);
    expect(Math.min(...inner)).toBeGreaterThanOrEqual(DARK_GREY - 1);
    expect(Math.max(...inner)).toBeLessThanOrEqual(LIGHT_GREY + 1);
  });
});

test('OVL-29.3 The logo keeps its place in the photo at every Size [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnOverlay(page, testInfo);
  await chooseLogo(page, hand, page.locator('#btnOverlayAdd'), await greenLogo(page));
  await tapAt(page, hand, await ringOnPage(page, 'br'));
  const small = await readSavedLogo(page, await savePng(page, hand, '1080'));
  const full = await readSavedLogo(page, await savePng(page, hand, 'Original'));
  await check('the logo\'s square takes the same share of the image, in the same corner, in '
    + 'the 1080 px file and the Original one', () => {
    expect(small.width).toBe(1080);
    expect(full.width).toBeGreaterThan(small.width);
    for (const [edge, size] of [['left', 'width'], ['right', 'width'], ['top', 'height'],
      ['bottom', 'height']]) {
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
  await hand.tap(moveKey(page, 'right'));
  await page.waitForTimeout(PAUSE_MS);
  await hand.tap(page.locator('#btnUndo'));
  await check('Undo puts the moved logo back in the middle', async () => {
    expectNear((await logoPlacement(page)).cx, 0.5, FRACTION_TOLERANCE);
  });
  await hand.tap(page.locator('#btnRedo'));
  await check('Redo moves it right again', async () => {
    expectNear((await logoPlacement(page)).cx, 0.5 + NUDGE_FRAC, FRACTION_TOLERANCE);
  });
  await pickWith(page, hand, page.locator('#btnOpen'), SECOND_PHOTO);
  await waitForPhoto(page, SECOND_PHOTO);
  await goToStep(page, 'overlay', hand);
  await check('on IMG_9075.JPEG no logo is placed; Use saved overlay is offered', async () => {
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
  await addDisc(page, hand);
  await tapAt(page, hand, await ringOnPage(page, 'tl'));
  const back = await logoPlacement(page);
  await switchTo(page, hand, 'front');
  await check('the front\'s Overlay step has no logo placed', async () => {
    expect(await logoId(page)).toBeNull();
  });
  await hand.tap(page.locator('#btnUseSaved'));
  await page.waitForFunction(() => !!window.__straightener.app.state.overlay);
  await page.waitForTimeout(PAUSE_MS);
  await tapAt(page, hand, await ringOnPage(page, 'br'));
  const front = await logoPlacement(page);
  await check('Use saved overlay and the bottom-right ring put the logo bottom-right on the '
    + 'front', () => {
    expect(front.cx).toBeGreaterThan(0.5);
    expect(front.cy).toBeGreaterThan(0.5);
  });
  await switchTo(page, hand, 'back');
  await check('Back: the back\'s logo is still top-left', async () => {
    const now = await logoPlacement(page);
    expectNear(now.cx, back.cx, FRACTION_TOLERANCE);
    expectNear(now.cy, back.cy, FRACTION_TOLERANCE);
  });
  await switchTo(page, hand, 'front');
  await check('Front: the front\'s logo is still bottom-right', async () => {
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
    await crossTheCorners(page, hand);
    await goToStep(page, 'overlay', hand);
    const addOff = await isGreyedOut(page.locator('#btnOverlayAdd'));
    const savedOff = await isGreyedOut(page.locator('#btnUseSaved'));
    const line = await overlayLabelText(page);
    await check('Add logo and Use saved overlay are greyed out; the line above the controls reads '
      + '"' + FIX_CORNERS + '"', () => {
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
  await crossTheCorners(page, hand);
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
    await check('the sheet Overlay options opens, holding one row, Tips', async () => {
      await expect(page.locator('#overlaySheetTitle')).toHaveText('Overlay options');
      await expect(page.locator('#overlaySheet .sheet-row:visible')).toHaveCount(1);
      await expect(page.locator('#overlayTips')).toContainText('Tips');
    });
    await hand.tap(page.locator('#overlayTips'));
    await check('Tips opens in place: four tips, the first about the rings', async () => {
      expect(await shownTips(page)).toEqual(OVERLAY_TIPS);
    });
    return;
  }
  await check('the side panel shows, under the controls, the heading Tips and keys with no '
    + 'Overlay options title and no Tips row', async () => {
    await expect(page.locator('#overlaySheet .sheet-tips-heading')).toHaveText('Tips and keys');
    await expect(page.locator('#overlaySheetTitle')).toBeHidden();
    await expect(page.locator('#overlayTips')).toBeHidden();
  });
  await check('three tips (not the one about rings for touch) and the keys line', async () => {
    expect(await shownTips(page)).toEqual([...OVERLAY_TIPS.slice(1), OVERLAY_KEYS]);
  });
});
