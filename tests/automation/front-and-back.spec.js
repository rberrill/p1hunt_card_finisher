// Front and back pairs' cases (tests/catalog/front-and-back.md): Add back, switching sides,
// Unpair, the 5:7 lock, the shared export settings, saving Together or Separately, and Resume.
// Each test drives the app as a person would, through hand.tap and hand.drag (a finger on the
// phone targets, the mouse on the wide ones), and reads the app's state only to check a result.
// The pair is made as a person makes one: Export, Add back, the back chosen in the picker
// (support/front-and-back.js).
'use strict';
const path = require('path');
const { test, expect } = require('./support/case.js');
const {
  openApp,
  openPhoto,
  goToStep,
  editState,
  handFor,
  cornerOnPage,
  cropBox,
  openOptions,
  closeOptions,
  samplePath,
  readSavedImage,
  root,
  stepNow,
  questionCard,
} = require('./support/app.js');
const {
  PORTRAIT_PAIR,
  LANDSCAPE_PAIR,
  chooseFile,
  chooseInPicker,
  waitForSide,
  makePair,
  sideButton,
  switchTo,
  shownToast,
  holdNextOpening,
  releaseOpening,
  waitForOpening,
  chooseSize,
  waitForPhoto,
  downloadAll,
  storedRecord,
  waitUntilSingleStored,
  reloadToResume,
  resume,
  addBack,
  chooseOutput,
  waitUntilPairStored,
  regionMeans,
  readoutSizes,
  standInShareSheet,
  sharedFiles,
  standInClipboard,
  copiedImage,
  crossCorners,
  zoomIn,
  viewNow,
  failReadsOf,
  allowReads,
  countHeldPhotos,
  heldPhotos,
  recordToasts,
  toastsSoFar,
  changeStoredPair,
  noteDownloadStarts,
  downloadStarts,
  slowStorageWrites,
  waitInPage,
} = require('./support/front-and-back.js');
const {
  installShareStandIn,
  dragQualityTo,
  waitForExportEnd,
  shareLabel,
} = require('./support/export.js');
const { typeAngle, angleText } = require('./support/rotate.js');
const { levelsDot } = require('./support/levels.js');
const { selectedPreset } = require('./support/crop.js');
const { fixturePath } = require('./support/edits-files.js');

const FRONT = PORTRAIT_PAIR.front;
const BACK = PORTRAIT_PAIR.back;
// A photo that is neither side, opened while a pair is open.
const OTHER_PHOTO = 'IMG_9136.JPEG';
// A logo: the app's own icon.
const LOGO = path.join(root, 'icons', 'icon.svg');
// A line of text named like a photo, so no browser can read it as an image.
const NOT_A_PHOTO = fixturePath('not-a-photo.JPEG');
// A line of text, which Overlay's Add logo refuses.
const NOT_A_LOGO = fixturePath('notes.txt');
// Edits saved from the front on its own, turned 3°, its square 1:1 box dragged by hand.
const SQUARE_CROP_EDITS = fixturePath('pair-front-square-crop-edits.json');
// The 3:4 preset's id: presets are named landscape-first, and read 3:4 for an upright card.
const THREE_BY_FOUR = '4:3';
// An upright 3:4 box's width over its height.
const THREE_BY_FOUR_ASPECT = 3 / 4;
// The grid laid over a saved image to compare two of them: cells per side.
const COMPARE_GRID = 16;
// The grid's columns that lie wholly inside the front's and the back's halves of a portrait
// Together image (each half is just under half its width).
const FRONT_COLUMNS = [0, 1, 2, 3, 4, 5, 6];
const BACK_COLUMNS = [9, 10, 11, 12, 13, 14, 15];
// The least mean difference (0 to 255) a logo makes in the grid cell it changes most.
const LOGO_MIN = 5;
// The gutter between a Together image's cards, as % of the two cells' size across it
// (CONFIG.pair.gutterPct).
const GUTTER_PCT = 0.8;
// A card is compared with its place in a Together image on a grid of this many cells a side.
const MATCH_GRID = 3;
// The largest mean difference (0 to 255) between a card's own file and its place in a Together
// image: both are JPEGs of the same pixels, so only the encoding differs.
const MATCH_MAX = 6;
// A mean this close to white in every channel is the fill outside the photo (JPEG noise
// allowed).
const FILL_WHITE_MIN = 245;
// The lowered canvas limit for PAIR-27.1, in pixels (the lowest a link may set).
const LOW_AREA = 1000000;
// How much a scaled image's shape may differ from the unscaled one, as a fraction (rounding).
const SHAPE_TOLERANCE = 0.01;
// The least gap between the starts of Separately's two downloads, in ms, on the page's clock:
// the app waits 250 ms, and a browser's timer may fire a few ms early.
const DOWNLOAD_GAP_MIN_MS = 240;
// A card's short side over its long side: 5:7.
const CARD_ASPECT = 5 / 7;
// How close a crop box's aspect must be to 5:7, as a fraction of it.
const ASPECT_TOLERANCE = 0.01;
const UNREADABLE_MESSAGE = 'Couldn’t read that file as an image.';
// The message for a photo opened while an export runs (and, today, while a side opens).
const EXPORT_WAIT_MESSAGE = 'Wait for the export to finish, then open the photo.';
// Ruling R13's approved words for a photo opened while a side opens (tests/catalog/wording.md).
const SIDE_WAIT_MESSAGE = 'Wait for the other side to open, then open the photo.';
// Rulings R14 and R15's approved clamp notes, with the limit's number left to the app: these
// cases lower the limit with a link, and whether the note then gives 16.7 or the lowered limit
// is for Rich to say (as EXP-06.4).
const APPROVED_CLAMP_NOTE = /^Scaled down to fit the [\d.]+ MP limit\.$/;
const APPROVED_BACK_CLAMP_NOTE = /^The back is scaled down to fit the [\d.]+ MP limit\.$/;
// Ruling R26's approved size line when the back, not on screen, has invalid corners.
const FIX_BACK_MESSAGE = 'Fix the back’s corners in Perspective first.';
const STEPS = ['perspective', 'rotate', 'crop', 'levels', 'overlay', 'export'];
// The warning when the open photo can't be read again after a pair's export.
const PHOTO_RELEASED_MESSAGE = 'The photo isn’t loaded after the last export. '
  + 'Tap Front or Back to switch sides, then switch back.';
// The warning when a stored pair can't be brought back.
const PAIR_RESET_MESSAGE = 'The saved pair wasn’t valid, so it was reset. '
  + 'This photo resumed on its own.';
// Perspective's message while the corners cross.
const CROSSED_MESSAGE = 'Corners cross or fold inward. Drag them back into a convex shape.';
// How long PAIR-12.2 holds each write to storage, in ms: longer than a reload takes to start.
const SLOW_WRITE_MS = 500;
// How long a case watches for a download that should not come, in ms.
const NO_DOWNLOAD_WAIT_MS = 1500;
// How far PAIR-43.1 drags a corner handle to the left, in CSS px, and how far the handle may
// end from that (the finger's path is split into steps, and the view rounds).
const CORNER_DRAG_PX = 40;
const CORNER_TOLERANCE_PX = 2;
// How far PAIR-37.2 drags two of the back's corner handles outward, in CSS px each way.
const ENLARGE_DRAG_PX = 60;
// A size scaled down to an area limit fills at least this fraction of it (whole-pixel rounding).
const AREA_FILL_MIN = 0.99;
// The controls a side's opening greys out on Export (the corner shots' save buttons are
// PAIR-09.4's).
const BUSY_CONTROLS = [
  '#sideSwitch .segment[data-value="front"]',
  '#sideSwitch .segment[data-value="back"]',
  '#btnUnpair',
  '#btnShare',
  '#btnDownload',
  '#btnCopy',
  '#pairOutput .segment[data-value="together"]',
  '#pairOutput .segment[data-value="separately"]',
];
// The corner shots' save buttons, which a side's opening greys out too.
const CORNER_SAVE_BUTTONS = ['#btnCornerShare', '#btnCornerDownload'];

// Opens the app with the front photo on its own. Returns the hand for this target.
async function startWithFront(page, testInfo, photo = FRONT) {
  await openApp(page);
  await openPhoto(page, photo);
  return handFor(page, testInfo);
}

// Expects Levels' Discard and Apply both to be greyed out ('disabled') or both live
// ('enabled'). They are always shown; only whether they answer a tap changes.
async function expectLevelsButtons(page, wanted) {
  for (const id of ['#btnDiscardLevels', '#btnApplyLevels']) {
    const button = page.locator(id);
    await expect(button).toBeVisible();
    await (wanted === 'enabled' ? expect(button).toBeEnabled() : expect(button).toBeDisabled());
  }
}

// A crop preset's chip on the Crop step, by its preset ('3:4', '5:7', …).
const presetChip = (page, preset) => page.locator(
  `#cropPresets .preset-chip[data-value="${preset}"]`,
);

// One choice of a segmented control (Size, Format, Together / Separately) by its value.
const segment = (page, controlId, value) => page.locator(
  `#${controlId} .segment[data-value="${value}"]`,
);

// Expects the Export step's settings to read as given: size ('1080', '2000', …), format ('jpeg',
// 'png', 'webp'), and the options' quality ('92%'), interp ('Bilinear') and fill ('White').
// A setting left out is not checked.
async function expectExportSettings(page, { size, format, quality, interp, fill }) {
  const pressed = ['aria-pressed', 'true'];
  if (size) await expect(segment(page, 'exportSize', size)).toHaveAttribute(...pressed);
  if (format) await expect(segment(page, 'exportFormat', format)).toHaveAttribute(...pressed);
  if (quality) await expect(page.locator('#qualityValue')).toHaveText(quality);
  if (interp) await expect(page.locator('#interpValue')).toHaveText(interp);
  if (fill) await expect(page.locator('#fillValue')).toHaveText(fill);
}

// The crop preset the app remembers for the next photo (its saved settings).
function rememberedPreset(page) {
  return page.evaluate(() => window.CF.Prefs.load().cropPreset);
}

// The largest mean difference (0 to 255) between two saved images' grid cells, over the
// given columns of the grid (readSavedImage with COMPARE_GRID).
function columnsDifference(first, second, columns) {
  let largest = 0;
  for (let row = 0; row < COMPARE_GRID; row++) {
    for (const column of columns) {
      const index = row * COMPARE_GRID + column;
      const cell = second.cells[index];
      const twin = first.cells[index];
      let total = 0;
      for (let channel = 0; channel < 3; channel++) {
        total += Math.abs(cell[channel] - twin[channel]);
      }
      largest = Math.max(largest, total / 3);
    }
  }
  return largest;
}

// Expects two saved images to be the same size and the same, cell for cell, on a fine grid.
async function expectSameImage(page, firstFile, secondFile) {
  const first = await readSavedImage(page, firstFile, COMPARE_GRID);
  const second = await readSavedImage(page, secondFile, COMPARE_GRID);
  expect([second.width, second.height]).toEqual([first.width, first.height]);
  const allColumns = [...Array(COMPARE_GRID).keys()];
  expect(columnsDifference(first, second, allColumns)).toBe(0);
  expect(second.corners).toEqual(first.corners);
}

// Expects the crop box to be 5:7 upright (portrait) or 7:5 lying down (landscape).
async function expectCardCrop(page, orient) {
  const box = await cropBox(page);
  const isPortrait = box.height > box.width;
  expect(isPortrait).toBe(orient === 'portrait');
  const aspect = Math.min(box.width, box.height) / Math.max(box.width, box.height);
  expect(Math.abs(aspect - CARD_ASPECT)).toBeLessThan(CARD_ASPECT * ASPECT_TOLERANCE);
}

// Taps one of the question card's buttons by its label.
function answerCard(page, hand, label) {
  return hand.tap(questionCard(page).getByRole('button', { name: label, exact: true }));
}

// Expects the question card to be open with this title, this line of text and these buttons,
// in this order.
async function expectCard(page, title, text, buttons) {
  const card = questionCard(page);
  await expect(card).toHaveClass(/is-open/);
  await expect(card.locator('.alert-title')).toHaveText(title);
  await expect(card.locator('.alert-text')).toHaveText(text);
  await expect(card.getByRole('button')).toHaveText(buttons);
}

// Starts recording, each time `trigger`'s disabled attribute changes, whether each control in
// `watched` was disabled and whether an export or a side opening was running at that moment.
// Read the records with seenWhileWatching.
function watchDisabled(page, trigger, watched) {
  return page.evaluate(({ triggerSelector, watchedSelectors }) => {
    window.testSeen = [];
    const record = () => {
      const app = window.__straightener.app;
      const disabled = {};
      for (const selector of watchedSelectors) {
        const element = document.querySelector(selector);
        disabled[selector] = !!element && element.disabled;
      }
      window.testSeen.push({
        isExporting: !!app.exporting,
        isSwitching: !!app.isSwitching,
        disabled,
      });
    };
    window.testObserver = new MutationObserver(record);
    window.testObserver.observe(document.querySelector(triggerSelector), {
      attributes: true,
      attributeFilter: ['disabled'],
    });
  }, { triggerSelector: trigger, watchedSelectors: watched });
}

// Stops watchDisabled and returns what it recorded.
function seenWhileWatching(page) {
  return page.evaluate(() => {
    window.testObserver.disconnect();
    return window.testSeen;
  });
}

test('PAIR-01.1 Add back keeps the front and opens the back [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startWithFront(page, testInfo);
  await goToStep(page, 'rotate', hand);
  await typeAngle(page, hand, '2');
  await check('the angle reads 2.0°', async () => {
    await expect(angleText(page)).toHaveText('2.0°');
  });
  await goToStep(page, 'export', hand);
  await check('the Export step shows Add back in its bottom row', async () => {
    await expect(page.locator('#btnAddBack')).toBeVisible();
  });
  await chooseInPicker(page, hand, page.locator('#btnAddBack'), BACK);
  await waitForSide(page, 'back', BACK);
  await check('the back opens on Perspective, Back selected, Undo greyed out', async () => {
    expect(await page.evaluate(() => window.__straightener.app.tab)).toBe('perspective');
    await expect(page.locator('#sideSwitch')).toBeVisible();
    await expect(sideButton(page, 'back')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#btnUndo')).toBeDisabled();
  });
  await goToStep(page, 'rotate', hand);
  await check('the back\'s angle reads 0.0°', async () => {
    await expect(angleText(page)).toHaveText('0.0°');
  });
  await switchTo(page, hand, 'front');
  await check('the front opens on Rotate; its angle reads 2.0°', async () => {
    expect(await page.evaluate(() => window.__straightener.app.tab)).toBe('rotate');
    await expect(angleText(page)).toHaveText('2.0°');
  });
  await hand.tap(page.locator('#btnUndo'));
  await check('Undo makes the angle 0.0°: the front kept its undo history', async () => {
    await expect(angleText(page)).toHaveText('0.0°');
  });
});

test('PAIR-01.2 Add back is dimmed while an export runs [phone]', async ({
  page,
  check,
}, testInfo) => {
  test.fail(true, 'BUG-030');
  const hand = await startWithFront(page, testInfo);
  await goToStep(page, 'export', hand);
  await hand.tap(page.locator('#exportSize .segment[data-value="0"]'));
  await check('Add back is there and can be tapped', async () => {
    await expect(page.locator('#btnAddBack')).toBeEnabled();
  });
  await watchDisabled(page, '#btnDownload', ['#btnAddBack', '#btnDownload']);
  const downloading = page.waitForEvent('download');
  await hand.tap(page.locator('#btnDownload'));
  await downloading;
  await page.waitForFunction(() => !window.__straightener.app.exporting);
  const seen = await seenWhileWatching(page);
  await check('while the export runs, Add back is greyed out with Download', async () => {
    const whileExporting = seen.filter(record => record.isExporting);
    expect(whileExporting.length, 'moments seen while exporting').toBeGreaterThan(0);
    const isDownloadDimmed = whileExporting.every(record => record.disabled['#btnDownload']);
    expect(isDownloadDimmed, 'Download greyed out').toBe(true);
    const isAddBackDimmed = whileExporting.every(record => record.disabled['#btnAddBack']);
    expect(isAddBackDimmed, 'Add back greyed out').toBe(true);
  });
  await check('once the file has arrived, Add back can be tapped again', async () => {
    await expect(page.locator('#btnAddBack')).toBeEnabled();
  });
});

test('PAIR-02.1 A portrait front makes a portrait pair, cropped 5:7 to the card [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startWithFront(page, testInfo);
  await goToStep(page, 'crop', hand);
  await check('before: the front\'s preset is 1:1', async () => {
    await expect(selectedPreset(page)).toHaveText('1:1');
  });
  await goToStep(page, 'export', hand);
  await check('the Export step shows Add back', async () => {
    await expect(page.locator('#btnAddBack')).toBeVisible();
  });
  await chooseInPicker(page, hand, page.locator('#btnAddBack'), BACK);
  await waitForSide(page, 'back', BACK);
  await check('the back opens; Front / Back shows in the top bar', async () => {
    await expect(page.locator('#sideSwitch')).toBeVisible();
  });
  await goToStep(page, 'crop', hand);
  await check('the back\'s crop box is upright, 5 wide to 7 high, under 5:7 card', async () => {
    await expect(selectedPreset(page)).toHaveText('5:7 card');
    await expectCardCrop(page, 'portrait');
  });
  await switchTo(page, hand, 'front');
  await check('the front\'s preset is now 5:7 card, upright, fitted around the card', async () => {
    await expect(selectedPreset(page)).toHaveText('5:7 card');
    await expectCardCrop(page, 'portrait');
    expect((await editState(page)).crop.mode).toBe('fit');
  });
});

test('PAIR-02.2 A landscape front makes a landscape pair [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startWithFront(page, testInfo, LANDSCAPE_PAIR.front);
  await goToStep(page, 'export', hand);
  await chooseInPicker(page, hand, page.locator('#btnAddBack'), LANDSCAPE_PAIR.back);
  await waitForSide(page, 'back', LANDSCAPE_PAIR.back);
  await check('the back opens; Front / Back shows in the top bar', async () => {
    await expect(page.locator('#sideSwitch')).toBeVisible();
  });
  await goToStep(page, 'crop', hand);
  await check('the back\'s crop box is 7 wide to 5 high, under 7:5 card', async () => {
    await expect(selectedPreset(page)).toHaveText('7:5 card');
    await expectCardCrop(page, 'landscape');
  });
  await switchTo(page, hand, 'front');
  await check('the front\'s crop box is also 7 wide to 5 high, under 7:5 card', async () => {
    await expect(selectedPreset(page)).toHaveText('7:5 card');
    await expectCardCrop(page, 'landscape');
  });
});

test('PAIR-03.1 A back that can\'t be read leaves the front on its own [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startWithFront(page, testInfo);
  await goToStep(page, 'export', hand);
  await chooseFile(page, hand, page.locator('#btnAddBack'), NOT_A_PHOTO);
  await check('"Couldn’t read that file as an image."; the front stays on screen', async () => {
    await expect(shownToast(page)).toHaveText(UNREADABLE_MESSAGE);
    expect((await editState(page)).source.name).toBe(FRONT);
  });
  await check('there is no Front / Back and no Unpair in the top bar', async () => {
    await expect(page.locator('#sideSwitch')).toBeHidden();
    await expect(page.locator('#btnUnpair')).toBeHidden();
    expect(await page.evaluate(() => window.__straightener.app.pair)).toBeNull();
  });
  await check('Add back is still there', async () => {
    await expect(page.locator('#btnAddBack')).toBeVisible();
  });
  await goToStep(page, 'crop', hand);
  await check('the preset is still 1:1', async () => {
    await expect(selectedPreset(page)).toHaveText('1:1');
  });
});

test('PAIR-04.1 Front / Back is on every step, and its white moves at the tap [both]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await makePair(page, testInfo);
  await check('Front / Back in the middle of the top bar, Back in white', async () => {
    await expect(page.locator('#sideSwitch')).toBeVisible();
    await expect(sideButton(page, 'back')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#sideSwitch')).toHaveAttribute('data-index', '1');
  });
  for (const step of STEPS.slice(1)) {
    await goToStep(page, step, hand);
    await check(`on ${step}, Front / Back is still in the top bar, Back in white`, async () => {
      await expect(page.locator('#sideSwitch')).toBeVisible();
      await expect(sideButton(page, 'back')).toHaveAttribute('aria-pressed', 'true');
    });
  }
  await holdNextOpening(page);
  await hand.tap(sideButton(page, 'front'));
  await waitForOpening(page);
  await check('the white moves to Front at the tap, while the back is still open', async () => {
    await expect(sideButton(page, 'front')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#sideSwitch')).toHaveAttribute('data-index', '0');
    await expect(shownToast(page)).toHaveText('Opening the front…');
    expect(await page.evaluate(() => window.__straightener.app.pair.current)).toBe('back');
  });
  await releaseOpening(page);
  await waitForSide(page, 'front', FRONT);
  await check('the front replaces the back; Front stays white', async () => {
    await expect(sideButton(page, 'front')).toHaveAttribute('aria-pressed', 'true');
    expect((await editState(page)).source.name).toBe(FRONT);
  });
});

test('PAIR-05.1 Switching sides stays on the step you are on [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await makePair(page, testInfo);
  await goToStep(page, 'crop', hand);
  await check('the back\'s Crop step', async () => {
    expect(await stepNow(page)).toBe('crop');
  });
  await switchTo(page, hand, 'front');
  await check('the front opens on the Crop step', async () => {
    expect(await stepNow(page)).toBe('crop');
    expect((await editState(page)).source.name).toBe(FRONT);
  });
  await goToStep(page, 'levels', hand);
  await check('the front\'s Levels step', async () => {
    expect(await stepNow(page)).toBe('levels');
  });
  await switchTo(page, hand, 'back');
  await check('the back opens on the Levels step', async () => {
    expect(await stepNow(page)).toBe('levels');
    expect((await editState(page)).source.name).toBe(BACK);
  });
});

test('PAIR-06.1 A side that can\'t be read leaves the open side as it was [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await makePair(page, testInfo);
  await goToStep(page, 'rotate', hand);
  await typeAngle(page, hand, '2');
  await check('the angle reads 2.0°', async () => {
    await expect(angleText(page)).toHaveText('2.0°');
  });
  // No control can spoil a side's kept photo: the test swaps its bytes for text.
  await page.evaluate(() => {
    const other = window.__straightener.app.pair.other;
    other.file = new File(['not a photo'], other.name, { type: 'image/jpeg' });
  });
  await hand.tap(sideButton(page, 'front'));
  await check('"Couldn’t read that file as an image."; the back stays, at 2.0°', async () => {
    await expect(shownToast(page)).toHaveText(UNREADABLE_MESSAGE);
    await expect(sideButton(page, 'back')).toHaveAttribute('aria-pressed', 'true');
    expect((await editState(page)).source.name).toBe(BACK);
    await expect(angleText(page)).toHaveText('2.0°');
  });
  await check('Front / Back and Unpair can be tapped (not greyed out)', async () => {
    await expect(sideButton(page, 'front')).toBeEnabled();
    await expect(sideButton(page, 'back')).toBeEnabled();
    await expect(page.locator('#btnUnpair')).toBeEnabled();
  });
  await hand.tap(page.locator('#btnUndo'));
  await check('Undo makes the angle 0.0°', async () => {
    await expect(angleText(page)).toHaveText('0.0°');
  });
});

test('PAIR-07.1 Each side keeps its own edits, Levels changes and selected corner [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await makePair(page, testInfo);
  const selectedCorner = () => page.evaluate(() => window.__straightener.app.selected);
  await switchTo(page, hand, 'front');
  await check('the front opens on Perspective; the top-left corner is selected', async () => {
    expect(await stepNow(page)).toBe('perspective');
    expect(await selectedCorner()).toBe(0);
  });
  await hand.tap(page.locator('#btnNextHandle'));
  await check('the top-right corner is selected', async () => {
    expect(await selectedCorner()).toBe(1);
  });
  await goToStep(page, 'rotate', hand);
  await typeAngle(page, hand, '2');
  await check('the angle reads 2.0°', async () => {
    await expect(angleText(page)).toHaveText('2.0°');
  });
  await goToStep(page, 'levels', hand);
  await check('the Levels step, with no dot on its tab; Discard and Apply are greyed out',
    async () => {
      await expect(levelsDot(page)).toBeHidden();
      await expectLevelsButtons(page, 'disabled');
    });
  await hand.tap(page.locator('#toolAutoLevels'));
  await check('Discard and Apply are no longer greyed out, and a white dot is on the Levels tab',
    async () => {
      await expectLevelsButtons(page, 'enabled');
      await expect(levelsDot(page)).toBeVisible();
    });
  await switchTo(page, hand, 'back');
  await check('the back opens on Levels with no dot; Discard and Apply are greyed out; Undo is '
    + 'greyed out', async () => {
    expect(await stepNow(page)).toBe('levels');
    await expect(levelsDot(page)).toBeHidden();
    await expectLevelsButtons(page, 'disabled');
    await expect(page.locator('#btnUndo')).toBeDisabled();
  });
  await switchTo(page, hand, 'front');
  await check('the front opens on Levels: Discard and Apply are no longer greyed out, and the '
    + 'dot is back', async () => {
    await expectLevelsButtons(page, 'enabled');
    await expect(levelsDot(page)).toBeVisible();
  });
  await goToStep(page, 'perspective', hand);
  await check('the top-right corner is still the selected one', async () => {
    expect(await selectedCorner()).toBe(1);
  });
  await goToStep(page, 'rotate', hand);
  await check('the angle reads 2.0°', async () => {
    await expect(angleText(page)).toHaveText('2.0°');
  });
});

test('PAIR-07.2 Each side keeps its own zoom [phone]', async ({ page, check }, testInfo) => {
  const hand = await makePair(page, testInfo);
  const fit = page.locator('#btnFit');
  const fitted = await viewNow(page);
  await check('there is no Fit in the top bar', async () => {
    expect(fitted.isFitted).toBe(true);
    await expect(fit).toBeHidden();
  });
  await zoomIn(page, hand);
  const zoomed = await viewNow(page);
  await check('the back\'s photo grows; Fit appears in the top bar', async () => {
    expect(zoomed.isFitted).toBe(false);
    expect(zoomed.zoom).toBeGreaterThan(fitted.zoom);
    await expect(fit).toBeVisible();
  });
  await switchTo(page, hand, 'front');
  await check('the front opens fitted to the photo area; Fit has gone', async () => {
    expect((await editState(page)).source.name).toBe(FRONT);
    expect((await viewNow(page)).isFitted).toBe(true);
    await expect(fit).toBeHidden();
  });
  await switchTo(page, hand, 'back');
  await check('the back opens as large as it was left; Fit is back in the top bar', async () => {
    expect(await viewNow(page)).toEqual(zoomed);
    await expect(fit).toBeVisible();
  });
});

// Candidate's number (such as '1/3') and the confidence at the right of Perspective's line
// (such as 'Confidence 97%').
function candidateReadout(page) {
  return page.evaluate(() => ({
    candidate: document.querySelector('#toolCandidate .tool-value').textContent,
    confidence: document.querySelector('#perspectiveLine .line-readout').textContent,
  }));
}

test('PAIR-07.3 Each side keeps its own detection results [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await makePair(page, testInfo);
  await check('Candidate reads 1/3; the line reads Confidence 97%', async () => {
    expect(await candidateReadout(page)).toEqual({
      candidate: '1/3',
      confidence: 'Confidence 97%',
    });
  });
  const firstCorners = (await editState(page)).corners;
  await hand.tap(page.locator('#toolCandidate'));
  const second = await candidateReadout(page);
  const secondCorners = (await editState(page)).corners;
  await check('the corners move to another shape; Candidate reads 2/3 and the line gives a '
    + 'lower confidence: Confidence 87% (88% in some browsers)', async () => {
    expect(secondCorners).not.toEqual(firstCorners);
    expect(second.candidate).toBe('2/3');
    expect(['Confidence 87%', 'Confidence 88%']).toContain(second.confidence);
  });
  await switchTo(page, hand, 'front');
  await check('the front opens on Perspective: Candidate reads 1/3 and the line Confidence 99%',
    async () => {
      expect(await stepNow(page)).toBe('perspective');
      expect(await candidateReadout(page)).toEqual({
        candidate: '1/3',
        confidence: 'Confidence 99%',
      });
    });
  await switchTo(page, hand, 'back');
  await check('the back opens with Candidate at 2/3 and the confidence row 2 gave; its corners '
    + 'are on the second shape', async () => {
    expect(await candidateReadout(page)).toEqual(second);
    expect((await editState(page)).corners).toEqual(secondCorners);
  });
});

test('PAIR-08.1 A switch turns off Tap to find card, Preview and an armed pick [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await makePair(page, testInfo);
  const armedText = page.getByText('Tap the card in the photo.');
  await openOptions(page, hand, 'perspective');
  await check('Tap to find card is listed', async () => {
    await expect(page.locator('#btnFindCard')).toBeVisible();
  });
  await hand.tap(page.locator('#btnFindCard'));
  await check('the line reads "Tap the card in the photo." with Cancel', async () => {
    await expect(armedText).toBeVisible();
  });
  await switchTo(page, hand, 'front');
  await check('the front opens on Perspective; "Tap the card in the photo." has gone', async () => {
    expect(await stepNow(page)).toBe('perspective');
    await expect(armedText).toBeHidden();
    expect(await page.evaluate(() => window.__straightener.app.findMode)).toBe(false);
  });
  await hand.tap(page.locator('#toolPreview'));
  await check('Preview is on: the photo shows the straightened card', async () => {
    await expect(page.locator('#toolPreview')).toHaveAttribute('aria-pressed', 'true');
    expect(await page.evaluate(() => window.__straightener.app.previewMode)).toBe(true);
  });
  await switchTo(page, hand, 'back');
  await check('the back opens with Preview off and its corner handles showing', async () => {
    await expect(page.locator('#toolPreview')).toHaveAttribute('aria-pressed', 'false');
    expect(await page.evaluate(() => window.__straightener.app.previewMode)).toBe(false);
  });
  await goToStep(page, 'levels', hand);
  await check('the back\'s Levels step', async () => {
    expect(await stepNow(page)).toBe('levels');
  });
  const pickWhite = page.locator('#levelsPicks .segment[data-value="white"]');
  await hand.tap(pickWhite);
  await check('Pick white is selected', async () => {
    await expect(pickWhite).toHaveAttribute('aria-pressed', 'true');
  });
  await switchTo(page, hand, 'front');
  await check('the front opens on Levels with neither pick selected', async () => {
    await expect(page.locator('#levelsPicks .segment[aria-pressed="true"]')).toHaveCount(0);
    expect(await page.evaluate(() => window.__straightener.app.dropper)).toBeNull();
  });
});

// Whether the photo shows without its Levels changes, with the Before levels badge (the badge
// is drawn on the photo's canvas while the app compares).
const isComparing = page => page.evaluate(() => !!window.__straightener.app.compare);

test('PAIR-08.2 A switch ends the before-levels comparison [desktop]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await makePair(page, testInfo);
  await goToStep(page, 'levels', hand);
  await hand.tap(page.locator('#toolAutoLevels'));
  const backDraft = await page.evaluate(() => window.__straightener.app.levelsDraft);
  await check('the back\'s whites turn brighter; a white dot appears on the Levels tab',
    async () => {
      expect(backDraft, 'Auto set a white point').toBeTruthy();
      await expect(levelsDot(page)).toBeVisible();
    });
  await page.keyboard.down('c');
  await check('the photo goes back to how it was before Auto, with a Before levels badge',
    async () => {
      expect(await isComparing(page)).toBe(true);
    });
  await switchTo(page, hand, 'front');
  await check('the front opens on Levels with no Before levels badge', async () => {
    expect((await editState(page)).source.name).toBe(FRONT);
    expect(await stepNow(page)).toBe('levels');
    expect(await isComparing(page)).toBe(false);
  });
  const frontBefore = await page.evaluate(() => ({
    levels: window.__straightener.app.state.levels,
    draft: window.__straightener.app.levelsDraft,
  }));
  await page.keyboard.up('c');
  await check('the front is unchanged', async () => {
    expect(await isComparing(page)).toBe(false);
    const frontAfter = await page.evaluate(() => ({
      levels: window.__straightener.app.state.levels,
      draft: window.__straightener.app.levelsDraft,
    }));
    expect(frontAfter).toEqual(frontBefore);
  });
  await switchTo(page, hand, 'back');
  await check('the back opens with its brighter whites from Auto and no Before levels badge',
    async () => {
      expect(await page.evaluate(() => window.__straightener.app.levelsDraft)).toEqual(backDraft);
      await expect(levelsDot(page)).toBeVisible();
      expect(await isComparing(page)).toBe(false);
    });
});

test('PAIR-08.3 A switch clears Overlay\'s file message [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await makePair(page, testInfo);
  const message = page.getByText('That file type isn’t supported. Use PNG, WebP, JPG or SVG.');
  await goToStep(page, 'overlay', hand);
  const choosing = page.waitForEvent('filechooser');
  await hand.tap(page.locator('#btnOverlayAdd'));
  const chooser = await choosing;
  await check('the file picker opens', async () => {
    expect(chooser.isMultiple()).toBe(false);
  });
  await chooser.setFiles(NOT_A_LOGO);
  await check('the line above the controls reads "That file type isn’t supported. Use PNG, '
    + 'WebP, JPG or SVG."', async () => {
    await expect(message).toBeVisible();
  });
  await switchTo(page, hand, 'front');
  await check('the front opens on Overlay; the message has gone', async () => {
    expect(await stepNow(page)).toBe('overlay');
    expect((await editState(page)).source.name).toBe(FRONT);
    await expect(message).toBeHidden();
  });
  await switchTo(page, hand, 'back');
  await check('the back opens on Overlay; the message is not back', async () => {
    expect((await editState(page)).source.name).toBe(BACK);
    await expect(message).toBeHidden();
  });
});

test('PAIR-08.4 A switch drops a share waiting for Share now [phone]', async ({
  page,
  check,
}, testInfo) => {
  // Stand-in: the share sheet refuses the first share, as Safari does after a slow export.
  await installShareStandIn(page, 'refuseOnce');
  const hand = await makePair(page, testInfo);
  await goToStep(page, 'export', hand);
  await chooseSize(page, hand, '0');
  await hand.tap(page.locator('#btnShare'));
  await page.waitForFunction(() => window.testShares.length === 1);
  await check('no share sheet; a message ends "Tap Share now to open the share sheet."; Share '
    + 'reads Share now', async () => {
    await expect(shownToast(page)).toHaveText(/Tap Share now to open the share sheet\.$/);
    await expect(shareLabel(page)).toHaveText('Share now');
  });
  await switchTo(page, hand, 'front');
  await check('the front opens on Export; the button reads Share again', async () => {
    expect(await stepNow(page)).toBe('export');
    expect((await editState(page)).source.name).toBe(FRONT);
    await expect(shareLabel(page)).toHaveText('Share');
  });
  await hand.tap(page.locator('#btnShare'));
  await page.waitForFunction(() => window.testShares.length === 2);
  const second = await page.evaluate(() => ({
    names: window.testShares[1].files.map(file => file.name),
    isNewExport: window.testSharedFiles[1][0] !== window.testSharedFiles[0][0],
  }));
  await check('a new export, and the share sheet is handed one file: '
    + '14_front_portrait_raw_white-pair.jpg', async () => {
    expect(second).toEqual({
      names: ['14_front_portrait_raw_white-pair.jpg'],
      isNewExport: true,
    });
  });
});

test('PAIR-09.1 While a side opens, the switch and save controls are greyed out [phone]', async ({
  page,
  check,
}, testInfo) => {
  // A browser that can share files and copy images, as an iPhone's Safari on the UAT site.
  await standInShareSheet(page);
  await standInClipboard(page);
  const hand = await makePair(page, testInfo);
  await goToStep(page, 'export', hand);
  await check('Front / Back, Unpair, Share, Download, Copy and Together / Separately can all be '
    + 'tapped', async () => {
    for (const selector of BUSY_CONTROLS) {
      await expect(page.locator(selector)).toBeVisible();
      await expect(page.locator(selector)).toBeEnabled();
    }
  });
  await holdNextOpening(page);
  await hand.tap(sideButton(page, 'front'));
  await waitForOpening(page);
  await check('while "Opening the front…" shows, all of them are greyed out', async () => {
    await expect(shownToast(page)).toHaveText('Opening the front…');
    for (const selector of BUSY_CONTROLS) await expect(page.locator(selector)).toBeDisabled();
  });
  await releaseOpening(page);
  await waitForSide(page, 'front', FRONT);
  await check('once the front is open, all of them can be tapped again', async () => {
    for (const selector of BUSY_CONTROLS) await expect(page.locator(selector)).toBeEnabled();
  });
});

test('PAIR-09.2 During a pair\'s export, Front / Back and Unpair are greyed out [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await makePair(page, testInfo);
  await goToStep(page, 'export', hand);
  await chooseSize(page, hand, '0');
  // Front, Back, Unpair, Together and Separately.
  const switchControls = BUSY_CONTROLS.filter(selector => !/Share|Download|Copy/.test(selector));
  await check('Front / Back, Unpair and Together / Separately can be tapped', async () => {
    for (const selector of switchControls) await expect(page.locator(selector)).toBeEnabled();
  });
  await watchDisabled(page, '#btnDownload', switchControls);
  const downloading = page.waitForEvent('download');
  await hand.tap(page.locator('#btnDownload'));
  await downloading;
  await page.waitForFunction(() => !window.__straightener.app.exporting);
  const seen = await seenWhileWatching(page);
  const whileExportingText = 'while the export runs, Front / Back, Unpair, Together / Separately '
    + 'are greyed out';
  await check(whileExportingText, async () => {
    const whileExporting = seen.filter(record => record.isExporting);
    expect(whileExporting.length, 'moments seen while exporting').toBeGreaterThan(0);
    for (const selector of switchControls) {
      const isDimmed = whileExporting.every(record => record.disabled[selector]);
      expect(isDimmed, `${selector} greyed out`).toBe(true);
    }
  });
  await check('once the file has arrived, all of them can be tapped again', async () => {
    for (const selector of switchControls) await expect(page.locator(selector)).toBeEnabled();
  });
});

test('PAIR-09.3 A photo opened while a side opens is refused with its own message [phone]', async ({
  page,
  check,
}, testInfo) => {
  test.fail(true, 'BUG-031');
  const hand = await makePair(page, testInfo);
  await holdNextOpening(page);
  await hand.tap(sideButton(page, 'front'));
  await waitForOpening(page);
  await check('"Opening the front…" shows', async () => {
    await expect(shownToast(page)).toHaveText('Opening the front…');
  });
  await chooseInPicker(page, hand, page.locator('#btnOpen'), 'IMG_9136.JPEG');
  const toastText = shownToast(page).locator('.toast-text');
  await toastText.filter({ hasNotText: 'Opening' }).waitFor();
  // A known defect: plain value comparisons, so the case fails at once rather than waiting.
  const message = await toastText.textContent();
  const isWarning = await shownToast(page).evaluate(toast => toast.classList.contains('is-warn'));
  await check(`an amber warning reads "${SIDE_WAIT_MESSAGE}"`, async () => {
    expect(isWarning, 'the message is a warning').toBe(true);
    expect(message, 'not the export\'s words').not.toBe(EXPORT_WAIT_MESSAGE);
    expect(message).toBe(SIDE_WAIT_MESSAGE);
  });
  await releaseOpening(page);
  await waitForSide(page, 'front', FRONT);
  await check('the front is open, still paired; IMG_9136.JPEG was not opened', async () => {
    await expect(page.locator('#sideSwitch')).toBeVisible();
    expect((await editState(page)).source.name).toBe(FRONT);
  });
});

test('PAIR-09.4 On a wide screen, a switch greys out the corner shots\' save buttons [desktop]',
  async ({ page, check }, testInfo) => {
    // A browser that can share files, so Share corners shows.
    await standInShareSheet(page);
    const hand = await makePair(page, testInfo);
    await goToStep(page, 'export', hand);
    await hand.tap(page.locator('#btnCornerShots'));
    await check('the side panel shows the Corner shots part, with Share corners and Download '
      + 'corners; both can be clicked', async () => {
      for (const selector of CORNER_SAVE_BUTTONS) {
        await expect(page.locator(selector)).toBeVisible();
        await expect(page.locator(selector)).toBeEnabled();
      }
    });
    await holdNextOpening(page);
    await hand.tap(sideButton(page, 'front'));
    await waitForOpening(page);
    await check('while "Opening the front…" shows, Share corners and Download corners are '
      + 'greyed out', async () => {
      await expect(shownToast(page)).toHaveText('Opening the front…');
      for (const selector of CORNER_SAVE_BUTTONS) {
        await expect(page.locator(selector)).toBeDisabled();
      }
    });
    await releaseOpening(page);
    await waitForSide(page, 'front', FRONT);
    await check('Share corners and Download corners can be clicked again', async () => {
      for (const selector of CORNER_SAVE_BUTTONS) {
        await expect(page.locator(selector)).toBeEnabled();
      }
    });
  });

test('PAIR-10.1 Unpair shows only while a pair is open [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startWithFront(page, testInfo);
  await goToStep(page, 'export', hand);
  await check('there is no Front / Back and no Unpair', async () => {
    await expect(page.locator('#sideSwitch')).toBeHidden();
    await expect(page.locator('#btnUnpair')).toBeHidden();
  });
  await chooseInPicker(page, hand, page.locator('#btnAddBack'), BACK);
  await waitForSide(page, 'back', BACK);
  await check('Unpair sits beside Front / Back, named "Unpair (keep one side)"', async () => {
    await expect(page.locator('#btnUnpair')).toBeVisible();
    await expect(page.locator('#btnUnpair')).toHaveAttribute('title', 'Unpair (keep one side)');
  });
  await hand.tap(page.locator('#btnUnpair'));
  await check('the question box asks which side to keep', async () => {
    await expectCard(page, 'Unpair', 'Keep one side as a single photo.',
      ['Keep front', 'Keep back', 'Cancel']);
  });
  await answerCard(page, hand, 'Keep back');
  await check('the question box closes; Unpair and Front / Back have gone', async () => {
    await expect(questionCard(page)).not.toHaveClass(/is-open/);
    await expect(page.locator('#btnUnpair')).toBeHidden();
    await expect(page.locator('#sideSwitch')).toBeHidden();
  });
});

test('PAIR-11.1 Unpair asks which side to keep, and Cancel keeps the pair [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await makePair(page, testInfo);
  await hand.tap(page.locator('#btnUnpair'));
  await check('a card titled "Unpair": Keep front, Keep back and Cancel', async () => {
    await expectCard(page, 'Unpair', 'Keep one side as a single photo.',
      ['Keep front', 'Keep back', 'Cancel']);
  });
  await answerCard(page, hand, 'Cancel');
  await check('the card closes; still paired, Back in white, the back on screen', async () => {
    await expect(questionCard(page)).not.toHaveClass(/is-open/);
    await expect(sideButton(page, 'back')).toHaveAttribute('aria-pressed', 'true');
    expect((await editState(page)).source.name).toBe(BACK);
  });
});

test('PAIR-11.2 Keeping the side that isn\'t open switches to it first [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await makePair(page, testInfo);
  await hand.tap(page.locator('#btnUnpair'));
  await check('the card asks: Keep front, Keep back, Cancel', async () => {
    await expectCard(page, 'Unpair', 'Keep one side as a single photo.',
      ['Keep front', 'Keep back', 'Cancel']);
  });
  await answerCard(page, hand, 'Keep front');
  await waitForPhoto(page, FRONT);
  const unpaired = 'the front replaces the back; "Unpaired. The front is a single photo now."';
  await check(unpaired, async () => {
    await expect(shownToast(page)).toHaveText('Unpaired. The front is a single photo now.');
    expect((await editState(page)).source.name).toBe(FRONT);
  });
  await check('Front / Back and Unpair have gone', async () => {
    await expect(page.locator('#sideSwitch')).toBeHidden();
    await expect(page.locator('#btnUnpair')).toBeHidden();
  });
});

test('PAIR-12.1 Unpair leaves a single photo, and Resume brings it back [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await makePair(page, testInfo);
  await hand.tap(page.locator('#btnUnpair'));
  await answerCard(page, hand, 'Keep back');
  await check('"Unpaired. The back is a single photo now."; Front / Back has gone', async () => {
    await expect(shownToast(page)).toHaveText('Unpaired. The back is a single photo now.');
    await expect(page.locator('#sideSwitch')).toBeHidden();
  });
  await goToStep(page, 'crop', hand);
  await check('5:7 card is still selected, every preset can be tapped, no pair note', async () => {
    await expect(selectedPreset(page)).toHaveText('5:7 card');
    await expect(page.locator('#cropPresets .preset-chip:disabled')).toHaveCount(0);
    await expect(page.locator('#cropPairNote')).toBeHidden();
  });
  await waitUntilSingleStored(page);
  await reloadToResume(page);
  await check('Resume names only the back photo; the pair\'s records are gone', async () => {
    await expect(page.locator('#resumeName')).toHaveText(BACK);
    expect(await storedRecord(page, 'pair')).toBeUndefined();
    expect(await storedRecord(page, 'pairPhoto')).toBeUndefined();
  });
  await resume(page, hand, BACK, null);
  await check('the back opens on its own, on Crop, under 5:7 card', async () => {
    expect(await stepNow(page)).toBe('crop');
    await expect(selectedPreset(page)).toHaveText('5:7 card');
    await expect(page.locator('#sideSwitch')).toBeHidden();
  });
});

test('PAIR-12.2 A reload straight after Unpair resumes the kept side [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  test.fail(true, 'BUG-032');
  const hand = await makePair(page, testInfo);
  await waitUntilPairStored(page);
  // Storage is slow on a busy phone. Each write is held a moment, so whether the message waits
  // for the kept side to be stored decides the case every run, not the race of the moment.
  await slowStorageWrites(page, SLOW_WRITE_MS);
  await hand.tap(page.locator('#btnUnpair'));
  // The reload comes the moment the message appears, the earliest a person could reload,
  // which is the moment ruling R25 is about. The message is noted in sessionStorage first, so
  // it can be checked after the reload.
  await page.evaluate(() => {
    const toast = document.getElementById('toast');
    new MutationObserver(() => {
      const text = toast.textContent;
      if (!toast.classList.contains('is-shown') || !text.startsWith('Unpaired')) return;
      sessionStorage.setItem('testUnpairedMessage', text);
      location.reload();
    }).observe(toast, { attributes: true, childList: true, subtree: true });
  });
  const reloading = page.waitForEvent('load');
  await answerCard(page, hand, 'Keep front');
  await reloading;
  await page.waitForFunction(() => !!window.__straightener);
  const message = await page.evaluate(() => sessionStorage.getItem('testUnpairedMessage'));
  await check('"Unpaired. The front is a single photo now."', async () => {
    expect(message).toBe('Unpaired. The front is a single photo now.');
  });
  await page.locator('#btnResume').waitFor({ state: 'visible' });
  const resumeName = await page.locator('#resumeName').textContent();
  await check('the start screen offers Resume, naming the front photo', async () => {
    expect(resumeName).toBe(FRONT);
  });
  await hand.tap(page.locator('#btnResume'));
  await page.waitForFunction(() => !!window.__straightener.app.state);
  const resumedName = (await editState(page)).source.name;
  await check('the front opens on its own, with no Front / Back', async () => {
    expect(resumedName).toBe(FRONT);
    await expect(page.locator('#sideSwitch')).toBeHidden();
  });
});

test('PAIR-13.1 Open while paired asks: New photo, or replace the side you are on [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await makePair(page, testInfo);
  const choices = side => ['New photo', `Replace ${side}`, 'Cancel'];
  const question = 'End the pair, or replace the side you’re on?';
  const filePicker = page.waitForEvent('filechooser');
  await hand.tap(page.locator('#btnOpen'));
  const chooser = await filePicker;
  await check('the photo picker opens', async () => {
    expect(chooser.isMultiple()).toBe(false);
  });
  await chooser.setFiles(samplePath(OTHER_PHOTO));
  await check('a card titled "New photo": New photo, Replace back, Cancel', async () => {
    await expectCard(page, 'New photo', question, choices('back'));
  });
  await answerCard(page, hand, 'Cancel');
  await check('the card closes; the back is still on screen, paired', async () => {
    await expect(questionCard(page)).not.toHaveClass(/is-open/);
    expect((await editState(page)).source.name).toBe(BACK);
    await expect(page.locator('#sideSwitch')).toBeVisible();
  });
  await switchTo(page, hand, 'front');
  await check('the front opens', async () => {
    expect((await editState(page)).source.name).toBe(FRONT);
  });
  await chooseInPicker(page, hand, page.locator('#btnOpen'), OTHER_PHOTO);
  await check('the same card, its middle button reading Replace front', async () => {
    await expectCard(page, 'New photo', question, choices('front'));
  });
  await answerCard(page, hand, 'Cancel');
  await check('the card closes; the front is still on screen, paired', async () => {
    await expect(questionCard(page)).not.toHaveClass(/is-open/);
    expect((await editState(page)).source.name).toBe(FRONT);
    await expect(page.locator('#sideSwitch')).toBeVisible();
  });
});

test('PAIR-14.1 New photo ends the pair and opens the photo on its own [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await makePair(page, testInfo);
  await chooseInPicker(page, hand, page.locator('#btnOpen'), OTHER_PHOTO);
  await check('the card asks: New photo, Replace back, Cancel', async () => {
    await expect(questionCard(page)).toHaveClass(/is-open/);
  });
  await answerCard(page, hand, 'New photo');
  await waitForPhoto(page, OTHER_PHOTO);
  await check('IMG_9136.JPEG opens on Perspective; Front / Back and Unpair have gone', async () => {
    expect(await stepNow(page)).toBe('perspective');
    await expect(page.locator('#sideSwitch')).toBeHidden();
    await expect(page.locator('#btnUnpair')).toBeHidden();
  });
  await goToStep(page, 'export', hand);
  await check('Add back is in the bottom row: a single photo', async () => {
    await expect(page.locator('#btnAddBack')).toBeVisible();
  });
});

test('PAIR-14.2 New photo with a file that can\'t be read keeps the pair [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await makePair(page, testInfo);
  await chooseFile(page, hand, page.locator('#btnOpen'), NOT_A_PHOTO);
  await check('the card asks: New photo, Replace back, Cancel', async () => {
    await expect(questionCard(page)).toHaveClass(/is-open/);
  });
  await answerCard(page, hand, 'New photo');
  await check('"Couldn’t read that file as an image."', async () => {
    await expect(shownToast(page)).toHaveText(UNREADABLE_MESSAGE);
  });
  await check('Front / Back is still there, Back in white; the back is on screen', async () => {
    await expect(sideButton(page, 'back')).toHaveAttribute('aria-pressed', 'true');
    expect((await editState(page)).source.name).toBe(BACK);
  });
  await switchTo(page, hand, 'front');
  await check('the front opens: the pair is whole', async () => {
    expect((await editState(page)).source.name).toBe(FRONT);
  });
});

test('PAIR-15.1 Replace back opens the new photo as the back, with fresh edits [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await makePair(page, testInfo);
  await goToStep(page, 'rotate', hand);
  await typeAngle(page, hand, '2');
  await check('the angle reads 2.0°', async () => {
    await expect(angleText(page)).toHaveText('2.0°');
  });
  await chooseInPicker(page, hand, page.locator('#btnOpen'), OTHER_PHOTO);
  await check('the card asks: New photo, Replace back, Cancel', async () => {
    await expect(questionCard(page)).toHaveClass(/is-open/);
  });
  await answerCard(page, hand, 'Replace back');
  await waitForSide(page, 'back', OTHER_PHOTO);
  await check('IMG_9136.JPEG opens on Perspective as the back; Undo is greyed out', async () => {
    expect(await stepNow(page)).toBe('perspective');
    await expect(sideButton(page, 'back')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#btnUndo')).toBeDisabled();
  });
  await goToStep(page, 'rotate', hand);
  await check('the angle reads 0.0°: the new back starts fresh', async () => {
    await expect(angleText(page)).toHaveText('0.0°');
  });
  await goToStep(page, 'crop', hand);
  await check('5:7 card is selected and the line reads "Pair: 5:7 only"', async () => {
    await expect(selectedPreset(page)).toHaveText('5:7 card');
    await expect(page.locator('#cropPairNote')).toHaveText('Pair: 5:7 only');
  });
  await switchTo(page, hand, 'front');
  await check('the front opens as it was', async () => {
    expect((await editState(page)).source.name).toBe(FRONT);
  });
});

test('PAIR-16.1 Next card after a pair\'s export opens the photo without asking [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await makePair(page, testInfo);
  await goToStep(page, 'export', hand);
  await chooseSize(page, hand, '0');
  const saved = await downloadAll(page, hand, 1);
  await check('one file arrives; Next card shows, "Open the next photo"', async () => {
    expect(saved).toHaveLength(1);
    await expect(page.locator('#btnNextCard')).toBeVisible();
    await expect(page.locator('#btnNextCard')).toHaveAttribute('title', 'Open the next photo');
  });
  const filePicker = page.waitForEvent('filechooser');
  await hand.tap(page.locator('#btnNextCard'));
  const chooser = await filePicker;
  await check('the photo picker opens', async () => {
    expect(chooser.isMultiple()).toBe(false);
  });
  await chooser.setFiles(samplePath(OTHER_PHOTO));
  await waitForPhoto(page, OTHER_PHOTO);
  await check('IMG_9136.JPEG opens on its own, no question asked; no Front / Back', async () => {
    await expect(questionCard(page)).not.toHaveClass(/is-open/);
    await expect(page.locator('#sideSwitch')).toBeHidden();
  });
});

test('PAIR-17.1 Add back hides while paired and comes back after Unpair [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await makePair(page, testInfo);
  await goToStep(page, 'export', hand);
  await check('the bottom row holds Corner shots but no Add back', async () => {
    await expect(page.locator('#btnCornerShots')).toBeVisible();
    await expect(page.locator('#btnAddBack')).toBeHidden();
  });
  await switchTo(page, hand, 'front');
  await check('the front\'s Export: still no Add back', async () => {
    await expect(page.locator('#btnAddBack')).toBeHidden();
  });
  await hand.tap(page.locator('#btnUnpair'));
  await answerCard(page, hand, 'Keep front');
  await check('Add back is back in the bottom row', async () => {
    await expect(page.locator('#btnAddBack')).toBeVisible();
  });
});

test('PAIR-18.1 Undo can\'t take a side out of the 5:7 lock [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startWithFront(page, testInfo);
  await goToStep(page, 'crop', hand);
  await hand.tap(presetChip(page, THREE_BY_FOUR));
  await check('3:4 is selected; the box is 3 wide to 4 high', async () => {
    await expect(selectedPreset(page)).toHaveText('3:4');
    const box = await cropBox(page);
    const aspect = box.width / box.height;
    const allowed = THREE_BY_FOUR_ASPECT * ASPECT_TOLERANCE;
    expect(Math.abs(aspect - THREE_BY_FOUR_ASPECT)).toBeLessThan(allowed);
  });
  await addBack(page, hand, BACK);
  await check('the back opens; Front / Back shows in the top bar', async () => {
    await expect(page.locator('#sideSwitch')).toBeVisible();
  });
  await switchTo(page, hand, 'front');
  await check('the front opens on Perspective, the step the back was on', async () => {
    expect(await stepNow(page)).toBe('perspective');
  });
  await goToStep(page, 'crop', hand);
  await check('5:7 card is selected', async () => {
    await expect(selectedPreset(page)).toHaveText('5:7 card');
  });
  await hand.tap(page.locator('#btnUndo'));
  await check('Undo leaves 5:7 card selected, the box 5 wide to 7 high', async () => {
    await expect(selectedPreset(page)).toHaveText('5:7 card');
    await expectCardCrop(page, 'portrait');
  });
});

test('PAIR-18.2 An edits file with a hand-drawn square crop can\'t break the lock [phone] '
  + '[webkit]', async ({ page, check }, testInfo) => {
  const hand = await makePair(page, testInfo);
  await switchTo(page, hand, 'front');
  await goToStep(page, 'export', hand);
  // The starting screen: the front open on Export, its angle at 0.0°.
  expect((await editState(page)).rotation.fine).toBe(0);
  await openOptions(page, hand, 'export');
  await check('Save edits and Load edits show', async () => {
    await expect(page.locator('#btnSaveEdits')).toBeVisible();
    await expect(page.locator('#btnLoadEdits')).toBeVisible();
  });
  const choosing = page.waitForEvent('filechooser');
  await hand.tap(page.locator('#btnLoadEdits'));
  const chooser = await choosing;
  await check('the file picker opens', async () => {
    expect(chooser.isMultiple()).toBe(false);
  });
  await chooser.setFiles(SQUARE_CROP_EDITS);
  await page.waitForFunction(() => window.__straightener.app.state.rotation.fine === 3);
  await check('the options stay open, with no red message', async () => {
    await expect(page.locator('#btnLoadEdits')).toBeVisible();
    await expect(page.locator('#toast.is-shown.is-error')).toHaveCount(0);
  });
  await closeOptions(page, hand, 'export');
  await check('the options are closed on a phone', async () => {
    await expect(page.locator('#btnLoadEdits')).toBeHidden();
  });
  await goToStep(page, 'rotate', hand);
  await check('the angle reads 3.0°: the file\'s edits were loaded', async () => {
    await expect(angleText(page)).toHaveText('3.0°');
  });
  await goToStep(page, 'crop', hand);
  await check('5:7 card, 5 wide to 7 high, fitted: the square box was dropped', async () => {
    await expect(selectedPreset(page)).toHaveText('5:7 card');
    await expectCardCrop(page, 'portrait');
    expect((await editState(page)).crop.mode).toBe('fit');
  });
});

test('PAIR-19.1 On Crop only 5:7 card can be tapped, under "Pair: 5:7 only" [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await makePair(page, testInfo);
  // Every preset but the pair's, in the row's order.
  const lockedPresets = ['Free', 'Original', '1:1', '3:4', '4:5', '2:3', '9:16'];
  const expectLocked = async () => {
    await expect(selectedPreset(page)).toHaveText('5:7 card');
    await expect(selectedPreset(page)).toBeEnabled();
    await expect(page.locator('#cropPresets .preset-chip:disabled')).toHaveText(lockedPresets);
    await expect(page.locator('#cropPairNote')).toHaveText('Pair: 5:7 only');
    await expect(page.locator('#cropPairNote')).toBeVisible();
  };
  await goToStep(page, 'crop', hand);
  await check('only 5:7 card can be tapped; the line reads "Pair: 5:7 only"', expectLocked);
  // The chip is greyed out, which Playwright won't tap unless told to; a person can tap it.
  const squareChip = presetChip(page, '1:1');
  await (hand.isTouch ? squareChip.tap({ force: true }) : squareChip.click({ force: true }));
  await check('nothing changes: 5:7 card stays selected', async () => {
    await expect(selectedPreset(page)).toHaveText('5:7 card');
    expect((await editState(page)).crop.preset).toBe('5:7');
  });
  await switchTo(page, hand, 'front');
  await check('the front\'s Crop step shows the same lock', expectLocked);
});

test('PAIR-20.1 Swap turns both sides, and Undo doesn\'t turn them back [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await makePair(page, testInfo);
  await goToStep(page, 'rotate', hand);
  await typeAngle(page, hand, '2');
  await check('the angle reads 2.0°', async () => {
    await expect(angleText(page)).toHaveText('2.0°');
  });
  await goToStep(page, 'crop', hand);
  await check('5:7 card; the box is upright', async () => {
    await expect(selectedPreset(page)).toHaveText('5:7 card');
    await expectCardCrop(page, 'portrait');
  });
  await hand.tap(page.locator('#toolSwap'));
  await check('the box lies down, 7 wide to 5 high, under 7:5 card', async () => {
    await expect(selectedPreset(page)).toHaveText('7:5 card');
    await expectCardCrop(page, 'landscape');
  });
  await hand.tap(page.locator('#btnUndo'));
  await check('after Undo the box is still 7 wide to 5 high', async () => {
    await expectCardCrop(page, 'landscape');
  });
  await goToStep(page, 'rotate', hand);
  await check('the angle reads 0.0°: Undo took back the angle, not the Swap', async () => {
    await expect(angleText(page)).toHaveText('0.0°');
  });
  await switchTo(page, hand, 'front');
  await goToStep(page, 'crop', hand);
  await check('the front\'s box is 7 wide to 5 high too', async () => {
    await expectCardCrop(page, 'landscape');
  });
  await hand.tap(page.locator('#toolSwap'));
  await check('the front\'s box is upright again', async () => {
    await expectCardCrop(page, 'portrait');
  });
  await switchTo(page, hand, 'back');
  await check('the back\'s box is upright again too', async () => {
    await expectCardCrop(page, 'portrait');
  });
});

// Expects Separately to be the selected one of Together / Separately.
async function expectSeparately(page) {
  await expect(segment(page, 'pairOutput', 'separately')).toHaveAttribute('aria-pressed', 'true');
}

test('PAIR-21.1 Size, Format and Separately chosen on one side are the other side\'s too [phone]',
  async ({ page, check }, testInfo) => {
    const hand = await makePair(page, testInfo);
    await goToStep(page, 'export', hand);
    // The starting screen: 2000, JPEG and Together.
    await expectExportSettings(page, { size: '2000', format: 'jpeg' });
    await chooseOutput(page, hand, 'separately');
    await check('Separately is selected', async () => {
      await expectSeparately(page);
    });
    await chooseSize(page, hand, '1080');
    await check('1080 is selected', async () => {
      await expectExportSettings(page, { size: '1080' });
    });
    await hand.tap(segment(page, 'exportFormat', 'webp'));
    await check('WebP is selected', async () => {
      await expectExportSettings(page, { format: 'webp' });
    });
    await switchTo(page, hand, 'front');
    await check('the front\'s Export: Size 1080, Format WebP and Separately are selected',
      async () => {
        expect((await editState(page)).source.name).toBe(FRONT);
        expect(await stepNow(page)).toBe('export');
        await expectSeparately(page);
        await expectExportSettings(page, { size: '1080', format: 'webp' });
      });
  });

test('PAIR-21.2 The options\' settings changed on one side are the other side\'s too [phone]',
  async ({ page, check }, testInfo) => {
    const hand = await makePair(page, testInfo);
    await goToStep(page, 'export', hand);
    await openOptions(page, hand, 'export');
    await check('Quality reads 92%, Interpolation Bilinear, Fill outside photo White', async () => {
      await expectExportSettings(page, { quality: '92%', interp: 'Bilinear', fill: 'White' });
    });
    await dragQualityTo(page, hand, 'low');
    await check('Quality reads 50%', async () => {
      await expect(page.locator('#qualityValue')).toHaveText('50%');
    });
    // A native list: picking in the list it opens is selectOption.
    await page.locator('#interp').selectOption('bicubic');
    await check('the row reads Bicubic', async () => {
      await expect(page.locator('#interpValue')).toHaveText('Bicubic');
    });
    await page.locator('#fill').selectOption('#000000');
    await check('the row reads Black', async () => {
      await expect(page.locator('#fillValue')).toHaveText('Black');
    });
    await closeOptions(page, hand, 'export');
    await check('the options close and the top bar shows Front / Back', async () => {
      await expect(page.locator('#qualityValue')).toBeHidden();
      await expect(page.locator('#sideSwitch')).toBeVisible();
    });
    await switchTo(page, hand, 'front');
    await check('the front opens on Export', async () => {
      expect((await editState(page)).source.name).toBe(FRONT);
      expect(await stepNow(page)).toBe('export');
    });
    await openOptions(page, hand, 'export');
    await check('the front\'s options read 50%, Bicubic, Black', async () => {
      await expectExportSettings(page, { quality: '50%', interp: 'Bicubic', fill: 'Black' });
    });
  });

test('PAIR-21.3 Reset export settings on one side resets both, and keeps Separately [phone]',
  async ({ page, check }, testInfo) => {
    const hand = await makePair(page, testInfo);
    await goToStep(page, 'export', hand);
    // The starting screen: Separately, 1080 and WebP.
    await chooseOutput(page, hand, 'separately');
    await chooseSize(page, hand, '1080');
    await hand.tap(segment(page, 'exportFormat', 'webp'));
    await expectExportSettings(page, { size: '1080', format: 'webp' });
    await openOptions(page, hand, 'export');
    await check('Reset export settings is among the options', async () => {
      await expect(page.locator('#exportResetRow')).toBeVisible();
    });
    await hand.tap(page.locator('#exportResetRow'));
    await check('Quality reads 92%, Interpolation Bilinear, Fill outside photo White', async () => {
      await expectExportSettings(page, { quality: '92%', interp: 'Bilinear', fill: 'White' });
    });
    await closeOptions(page, hand, 'export');
    await check('Size 2000 and Format JPEG are selected; Separately is still selected',
      async () => {
        await expectExportSettings(page, { size: '2000', format: 'jpeg' });
        await expectSeparately(page);
      });
    await switchTo(page, hand, 'front');
    await check('the front\'s Export shows the same: Size 2000, Format JPEG, Separately',
      async () => {
        expect((await editState(page)).source.name).toBe(FRONT);
        await expectExportSettings(page, { size: '2000', format: 'jpeg' });
        await expectSeparately(page);
      });
  });

test('PAIR-22.1 The next photo after a pair starts with the preset picked before it [phone] '
  + '[webkit]', async ({ page, check }, testInfo) => {
  const hand = await startWithFront(page, testInfo);
  await goToStep(page, 'crop', hand);
  await hand.tap(presetChip(page, THREE_BY_FOUR));
  await check('3:4 is selected', async () => {
    await expect(selectedPreset(page)).toHaveText('3:4');
  });
  await addBack(page, hand, BACK);
  await check('the back opens; Front / Back shows in the top bar', async () => {
    await expect(page.locator('#sideSwitch')).toBeVisible();
  });
  await goToStep(page, 'crop', hand);
  await check('5:7 card is selected; 3:4 is still the remembered preset', async () => {
    await expect(selectedPreset(page)).toHaveText('5:7 card');
    expect(await rememberedPreset(page)).toBe(THREE_BY_FOUR);
  });
  await hand.tap(page.locator('#btnUnpair'));
  await answerCard(page, hand, 'Keep back');
  await check('"Unpaired. The back is a single photo now."; still 5:7 card', async () => {
    await expect(shownToast(page)).toHaveText('Unpaired. The back is a single photo now.');
    await expect(selectedPreset(page)).toHaveText('5:7 card');
    expect(await rememberedPreset(page)).toBe(THREE_BY_FOUR);
  });
  await chooseInPicker(page, hand, page.locator('#btnOpen'), OTHER_PHOTO);
  await waitForPhoto(page, OTHER_PHOTO);
  await check('IMG_9136.JPEG opens on its own, with no question asked', async () => {
    await expect(questionCard(page)).not.toHaveClass(/is-open/);
    await expect(page.locator('#sideSwitch')).toBeHidden();
  });
  await goToStep(page, 'crop', hand);
  await check('3:4 is selected: the pair\'s 5:7 was never remembered', async () => {
    await expect(selectedPreset(page)).toHaveAttribute('data-value', THREE_BY_FOUR);
  });
});

test('PAIR-23.1 Undo and Redo on the back leave the front alone [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await makePair(page, testInfo);
  await switchTo(page, hand, 'front');
  await goToStep(page, 'rotate', hand);
  await check('the front\'s angle reads 0.0°', async () => {
    await expect(angleText(page)).toHaveText('0.0°');
  });
  await typeAngle(page, hand, '2');
  await check('the angle reads 2.0°', async () => {
    await expect(angleText(page)).toHaveText('2.0°');
  });
  await switchTo(page, hand, 'back');
  await check('the back opens on Rotate; its angle reads 0.0°', async () => {
    await expect(angleText(page)).toHaveText('0.0°');
  });
  await typeAngle(page, hand, '5');
  await check('the angle reads 5.0°', async () => {
    await expect(angleText(page)).toHaveText('5.0°');
  });
  await hand.tap(page.locator('#btnUndo'));
  await check('Undo: the back\'s angle reads 0.0°', async () => {
    await expect(angleText(page)).toHaveText('0.0°');
  });
  await hand.tap(page.locator('#btnRedo'));
  await check('Redo: the back\'s angle reads 5.0°', async () => {
    await expect(angleText(page)).toHaveText('5.0°');
  });
  await hand.tap(page.locator('#btnUndo'));
  await check('Undo again: the back\'s angle reads 0.0°', async () => {
    await expect(angleText(page)).toHaveText('0.0°');
  });
  await switchTo(page, hand, 'front');
  await check('the front\'s angle still reads 2.0°', async () => {
    await expect(angleText(page)).toHaveText('2.0°');
  });
});

test('PAIR-24.1 A logo on the back is saved on the back\'s half only [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await makePair(page, testInfo);
  await goToStep(page, 'export', hand);
  await chooseSize(page, hand, '0');
  await hand.tap(segment(page, 'exportFormat', 'png'));
  const [before] = await downloadAll(page, hand, 1);
  await check('one file, 14_front_portrait_raw_white-pair.png, arrives', async () => {
    expect(before.name).toBe('14_front_portrait_raw_white-pair.png');
  });
  await goToStep(page, 'overlay', hand);
  await check('the back\'s Overlay step, with Add logo and no logo', async () => {
    await expect(page.locator('#btnOverlayAdd')).toBeVisible();
    expect((await editState(page)).overlay).toBeNull();
  });
  await chooseFile(page, hand, page.locator('#btnOverlayAdd'), LOGO);
  await page.waitForFunction(() => !!window.__straightener.app.state.overlay);
  await check('the logo appears on the back', async () => {
    expect((await editState(page)).overlay).not.toBeNull();
  });
  await switchTo(page, hand, 'front');
  await check('the front\'s Overlay step, with Add logo and no logo', async () => {
    await expect(page.locator('#btnOverlayAdd')).toBeVisible();
    expect((await editState(page)).overlay).toBeNull();
  });
  await goToStep(page, 'export', hand);
  const [after] = await downloadAll(page, hand, 1);
  await check('a second -pair.png file arrives', async () => {
    expect(after.name).toBe('14_front_portrait_raw_white-pair.png');
  });
  const first = await readSavedImage(page, before.file, COMPARE_GRID);
  const second = await readSavedImage(page, after.file, COMPARE_GRID);
  await check('the left half (front) is the same; the right half (back) differs', async () => {
    expect([second.width, second.height]).toEqual([first.width, first.height]);
    expect(columnsDifference(first, second, FRONT_COLUMNS), 'front half').toBe(0);
    expect(columnsDifference(first, second, BACK_COLUMNS), 'back half').toBeGreaterThan(LOGO_MIN);
  });
});

test('PAIR-25.1 Together or Separately is remembered across a reload [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await makePair(page, testInfo);
  await goToStep(page, 'export', hand);
  await check('Together / Separately beside the size line, Together in white', async () => {
    await expect(page.locator('#pairOutput')).toBeVisible();
    await expect(segment(page, 'pairOutput', 'together')).toHaveAttribute('aria-pressed', 'true');
  });
  await chooseOutput(page, hand, 'separately');
  await check('Separately is white; the size line gives two sizes joined by +', async () => {
    await expect(segment(page, 'pairOutput', 'separately')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#exportReadout')).toHaveText(/^\d+ × \d+ \+ \d+ × \d+ px/);
  });
  await waitUntilPairStored(page);
  await reloadToResume(page);
  await check('the start screen offers Resume', async () => {
    await expect(page.locator('#btnResume')).toBeVisible();
  });
  await resume(page, hand, BACK, 'back');
  await goToStep(page, 'export', hand);
  await check('Separately is still selected', async () => {
    await expect(segment(page, 'pairOutput', 'separately')).toHaveAttribute('aria-pressed', 'true');
  });
});

// The Together layout the app should make from the two sides' own sizes ([width, height]
// each, in px): { width, height, front, back, gutter }, where front and back are the cards'
// places and gutter the strip between them ({ x, y, width, height } each). Portrait cards sit
// side by side, landscape ones are stacked; each card is centered in a cell the size of the
// larger card, and the gutter is GUTTER_PCT % of the two cells' size across it.
function expectedTogether(front, back, orient) {
  const cellWidth = Math.max(front[0], back[0]);
  const cellHeight = Math.max(front[1], back[1]);
  const isSideBySide = orient === 'portrait';
  const across = isSideBySide ? cellWidth : cellHeight;
  const gutterPx = Math.round(GUTTER_PCT / 100 * 2 * across);
  const backCell = isSideBySide
    ? { x: cellWidth + gutterPx, y: 0 }
    : { x: 0, y: cellHeight + gutterPx };
  const place = (size, cell) => ({
    x: cell.x + Math.floor((cellWidth - size[0]) / 2),
    y: cell.y + Math.floor((cellHeight - size[1]) / 2),
    width: size[0],
    height: size[1],
  });
  const gutter = isSideBySide
    ? { x: cellWidth, y: 0, width: gutterPx, height: cellHeight }
    : { x: 0, y: cellHeight, width: cellWidth, height: gutterPx };
  return {
    width: isSideBySide ? 2 * cellWidth + gutterPx : cellWidth,
    height: isSideBySide ? cellHeight : 2 * cellHeight + gutterPx,
    front: place(front, { x: 0, y: 0 }),
    back: place(back, backCell),
    gutter,
    cellWidth,
    cellHeight,
  };
}

// A rectangle cut into a cells x cells grid: [{ x, y, width, height }], row by row.
function gridOf(rect, cells = MATCH_GRID) {
  const parts = [];
  for (let row = 0; row < cells; row++) {
    for (let column = 0; column < cells; column++) {
      const x = rect.x + Math.floor(column * rect.width / cells);
      const y = rect.y + Math.floor(row * rect.height / cells);
      const nextX = rect.x + Math.floor((column + 1) * rect.width / cells);
      const nextY = rect.y + Math.floor((row + 1) * rect.height / cells);
      parts.push({ x, y, width: nextX - x, height: nextY - y });
    }
  }
  return parts;
}

// The mean difference (0 to 255) between two lists of [r, g, b] means.
function meansDifference(first, second) {
  let total = 0;
  first.forEach((mean, index) => {
    for (let channel = 0; channel < 3; channel++) {
      total += Math.abs(mean[channel] - second[index][channel]);
    }
  });
  return total / (first.length * 3);
}

// True when every channel of every mean is near white (the fill outside the photo).
const isAllWhite = means => means.every(mean => mean.every(channel => channel > FILL_WHITE_MIN));

// How closely a card in a Together image matches a saved file: the mean difference between
// the file's grid and the grid of `place` in the Together image (MATCH_GRID cells a side).
async function cardMatch(page, togetherFile, place, cardFile) {
  const card = await regionMeans(page, cardFile, gridOf({ ...place, x: 0, y: 0 }));
  const inTogether = await regionMeans(page, togetherFile, gridOf(place));
  return meansDifference(card.means, inTogether.means);
}

// The shared body of PAIR-26.1 and PAIR-26.2: saves the pair Separately and then Together,
// and checks the Together image's size, the order and size of the cards in it, the white
// gutter and, for the smaller card, the white around it.
async function checkTogetherImage(page, check, testInfo, photos, orient) {
  const hand = await makePair(page, testInfo, photos);
  await goToStep(page, 'export', hand);
  await chooseSize(page, hand, '0');
  await chooseOutput(page, hand, 'separately');
  const [frontSaved, backSaved] = await downloadAll(page, hand, 2);
  const front = await regionMeans(page, frontSaved.file, []);
  const back = await regionMeans(page, backSaved.file, []);
  await check('two files: the front\'s and the back\'s', async () => {
    expect(frontSaved.name).toMatch(/-front\.jpg$/);
    expect(backSaved.name).toMatch(/-back\.jpg$/);
  });
  await chooseOutput(page, hand, 'together');
  const [together] = await downloadAll(page, hand, 1);
  const baseName = photos.front.replace(/\.JPEG$/, '');
  await check(`one file, ${baseName}-pair.jpg`, async () => {
    expect(together.name).toBe(`${baseName}-pair.jpg`);
  });
  const layout = expectedTogether([front.width, front.height], [back.width, back.height], orient);
  const image = await regionMeans(page, together.file, [layout.gutter]);
  await check('its size: the larger card twice, plus a gap of 0.8% of that', async () => {
    expect([image.width, image.height]).toEqual([layout.width, layout.height]);
  });
  const frontInPlace = await cardMatch(page, together.file, layout.front, frontSaved.file);
  const frontInBackPlace = await cardMatch(page, together.file, layout.back, frontSaved.file);
  const backInPlace = await cardMatch(page, together.file, layout.back, backSaved.file);
  const where = orient === 'portrait' ? 'the front on the left' : 'the front on top';
  await check(`${where}, each card at its own size; the gap is white`, async () => {
    expect(frontInPlace, 'front in its place').toBeLessThan(MATCH_MAX);
    expect(backInPlace, 'back in its place').toBeLessThan(MATCH_MAX);
    expect(frontInBackPlace, 'front not in the back\'s place').toBeGreaterThan(frontInPlace);
    expect(isAllWhite(image.means), 'white gap').toBe(true);
  });
  return { layout, together };
}

test('PAIR-26.1 Together puts portrait cards side by side, the front on the left [phone] '
  + '[webkit]', async ({ page, check }, testInfo) => {
  const { layout, together } = await checkTogetherImage(page, check, testInfo, PORTRAIT_PAIR,
    'portrait');
  // Side by side, both cells start at the top; the smaller card is centered in its cell.
  const smaller = layout.front.height < layout.back.height ? layout.front : layout.back;
  const above = { x: smaller.x, y: 0, width: smaller.width, height: smaller.y };
  const margins = await regionMeans(page, together.file, above.height > 0 ? [above] : []);
  await check('the smaller card sits in the middle of its half, with white around it', async () => {
    expect(above.height, 'a margin above the smaller card').toBeGreaterThan(0);
    expect(isAllWhite(margins.means), 'white above it').toBe(true);
  });
  await check('no margin: the larger card\'s edges are the image\'s edges', async () => {
    const larger = smaller === layout.front ? layout.back : layout.front;
    expect(larger.y).toBe(0);
    expect(larger.height).toBe(layout.height);
  });
});

test('PAIR-26.2 Together stacks landscape cards, the front on top [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  await checkTogetherImage(page, check, testInfo, LANDSCAPE_PAIR, 'landscape');
});

test('PAIR-27.1 A Together image over the canvas limit scales both cards down alike [phone] '
  + '[webkit]', async ({ page, check }, testInfo) => {
  test.fail(true, 'BUG-011');
  const lowLimitLink = `index.html?maxOutputArea=${LOW_AREA}`;
  const hand = await makePair(page, testInfo, PORTRAIT_PAIR, lowLimitLink);
  await goToStep(page, 'export', hand);
  await chooseSize(page, hand, '0');
  await chooseOutput(page, hand, 'separately');
  const [front, back] = await readoutSizes(page);
  await check('two sizes, each under 1,000,000 pixels, with no note', async () => {
    expect(front[0] * front[1]).toBeLessThan(LOW_AREA);
    expect(back[0] * back[1]).toBeLessThan(LOW_AREA);
    await expect(page.locator('#exportMessage')).toBeHidden();
  });
  await chooseOutput(page, hand, 'together');
  const [joined] = await readoutSizes(page);
  const full = expectedTogether(front, back, 'portrait');
  // A known defect: a plain value comparison, so the case fails at once rather than waiting.
  await page.locator('#exportMessage').waitFor({ state: 'visible' });
  const note = await page.locator('#exportMessage').textContent();
  await check('one size of at most 1 MP, the shape of the two cards side by side; a note reads '
    + '"Scaled down to fit the N MP limit."', async () => {
    expect(joined[0] * joined[1]).toBeLessThanOrEqual(LOW_AREA);
    expect(full.width * full.height).toBeGreaterThan(LOW_AREA);
    const shapeChange = Math.abs(joined[0] / joined[1] - full.width / full.height);
    expect(shapeChange).toBeLessThan(full.width / full.height * SHAPE_TOLERANCE);
    expect(note).toMatch(APPROVED_CLAMP_NOTE);
  });
  const [saved] = await downloadAll(page, hand, 1);
  const scale = joined[1] / full.height;
  const middleOfGap = { x: Math.round(full.cellWidth * scale), y: 0, width: 1, height: joined[1] };
  const image = await regionMeans(page, saved.file, [middleOfGap]);
  await check('one file, at the size the line gave', async () => {
    expect([image.width, image.height]).toEqual(joined);
  });
  await check('both cards shrunk by the same factor, keeping their shape; gap white', async () => {
    expect(Math.abs(joined[0] / full.width - scale)).toBeLessThan(SHAPE_TOLERANCE);
    expect(isAllWhite(image.means), 'white gap').toBe(true);
  });
});

test('PAIR-28.1 Separately saves the front exactly as its own export [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startWithFront(page, testInfo);
  await goToStep(page, 'crop', hand);
  await hand.tap(presetChip(page, '5:7'));
  await check('5:7 card is selected', async () => {
    await expect(selectedPreset(page)).toHaveText('5:7 card');
  });
  await goToStep(page, 'export', hand);
  await check('the Export step', async () => {
    expect(await stepNow(page)).toBe('export');
  });
  await chooseSize(page, hand, '0');
  await check('Original is selected', async () => {
    await expectExportSettings(page, { size: '0' });
  });
  const [frontAlone] = await downloadAll(page, hand, 1);
  await check('one file, 14_front_portrait_raw_white-straight.jpg: the front on its own',
    async () => {
      expect(frontAlone.name).toBe('14_front_portrait_raw_white-straight.jpg');
    });
  const choosing = page.waitForEvent('filechooser');
  await hand.tap(page.locator('#btnAddBack'));
  const chooser = await choosing;
  await check('the photo picker opens', async () => {
    expect(chooser.isMultiple()).toBe(false);
  });
  await chooser.setFiles(samplePath(BACK));
  await waitForSide(page, 'back', BACK);
  await check('the back opens; Front / Back shows in the top bar', async () => {
    await expect(page.locator('#sideSwitch')).toBeVisible();
  });
  await goToStep(page, 'export', hand);
  await check('the back\'s Export step, Size Original', async () => {
    expect(await stepNow(page)).toBe('export');
    await expectExportSettings(page, { size: '0' });
  });
  await chooseOutput(page, hand, 'separately');
  await check('Separately is selected', async () => {
    await expectSeparately(page);
  });
  const [frontOfPair, backOfPair] = await downloadAll(page, hand, 2);
  await check('two files, 14_front_portrait_raw_white-front.jpg and '
    + '14_back_portrait_raw_white-back.jpg', async () => {
    expect(frontOfPair.name).toBe('14_front_portrait_raw_white-front.jpg');
    expect(backOfPair.name).toBe('14_back_portrait_raw_white-back.jpg');
  });
  await check('the front\'s file and the file from row 4 are the same size and the same, pixel '
    + 'for pixel', async () => {
    await expectSameImage(page, frontOfPair.file, frontAlone.file);
  });
});

test('PAIR-28.2 Separately saves the back exactly as its own export [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await makePair(page, testInfo);
  await goToStep(page, 'export', hand);
  await chooseSize(page, hand, '0');
  await chooseOutput(page, hand, 'separately');
  const [frontOfPair, backOfPair] = await downloadAll(page, hand, 2);
  await check('two files, 14_front_portrait_raw_white-front.jpg and '
    + '14_back_portrait_raw_white-back.jpg', async () => {
    expect(frontOfPair.name).toBe('14_front_portrait_raw_white-front.jpg');
    expect(backOfPair.name).toBe('14_back_portrait_raw_white-back.jpg');
  });
  await hand.tap(page.locator('#btnUnpair'));
  await check('the question box asks: Keep front, Keep back, Cancel', async () => {
    await expectCard(page, 'Unpair', 'Keep one side as a single photo.',
      ['Keep front', 'Keep back', 'Cancel']);
  });
  await answerCard(page, hand, 'Keep back');
  await check('the back is a single photo: Front / Back has gone', async () => {
    await expect(page.locator('#sideSwitch')).toBeHidden();
    expect((await editState(page)).source.name).toBe(BACK);
  });
  const [backAlone] = await downloadAll(page, hand, 1);
  await check('one file, 14_back_portrait_raw_white-straight.jpg: the back on its own',
    async () => {
      expect(backAlone.name).toBe('14_back_portrait_raw_white-straight.jpg');
    });
  await check('it and the back\'s file from row 1 are the same size and the same, pixel for '
    + 'pixel', async () => {
    await expectSameImage(page, backOfPair.file, backAlone.file);
  });
});

test('PAIR-29.1 The pair\'s files are named after the front and the back [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await makePair(page, testInfo);
  await goToStep(page, 'export', hand);
  await chooseSize(page, hand, '0');
  await hand.tap(segment(page, 'exportFormat', 'png'));
  const together = await downloadAll(page, hand, 1);
  await check('one file: 14_front_portrait_raw_white-pair.png', async () => {
    expect(together.map(saved => saved.name)).toEqual(['14_front_portrait_raw_white-pair.png']);
  });
  await chooseOutput(page, hand, 'separately');
  await check('Separately is selected', async () => {
    await expectSeparately(page);
  });
  const separatePng = await downloadAll(page, hand, 2);
  await check('two files: …-front.png and …-back.png', async () => {
    expect(separatePng.map(saved => saved.name)).toEqual([
      '14_front_portrait_raw_white-front.png',
      '14_back_portrait_raw_white-back.png',
    ]);
  });
  await hand.tap(segment(page, 'exportFormat', 'jpeg'));
  await check('JPEG is selected', async () => {
    await expectExportSettings(page, { format: 'jpeg' });
  });
  const separateJpeg = await downloadAll(page, hand, 2);
  await check('two files: …-front.jpg and …-back.jpg', async () => {
    expect(separateJpeg.map(saved => saved.name)).toEqual([
      '14_front_portrait_raw_white-front.jpg',
      '14_back_portrait_raw_white-back.jpg',
    ]);
  });
});

test('PAIR-30.1 Download saves one file for Together and two, a moment apart, for Separately '
  + '[phone] [webkit]', async ({ page, check }, testInfo) => {
  const hand = await makePair(page, testInfo);
  await goToStep(page, 'export', hand);
  await chooseSize(page, hand, '0');
  const together = await downloadAll(page, hand, 1);
  await check('one file arrives; "Exported the Together image in N s."', async () => {
    expect(together).toHaveLength(1);
    await expect(shownToast(page)).toHaveText(/^Exported the Together image in \d+\.\d s\.$/);
  });
  await chooseOutput(page, hand, 'separately');
  await check('Separately is selected', async () => {
    await expectSeparately(page);
  });
  await noteDownloadStarts(page);
  const separately = await downloadAll(page, hand, 2);
  const starts = await downloadStarts(page);
  await check('two files, a quarter of a second apart; "Exported the front and back in N s."',
    async () => {
      expect(separately).toHaveLength(2);
      expect(starts).toHaveLength(2);
      expect(starts[1] - starts[0]).toBeGreaterThanOrEqual(DOWNLOAD_GAP_MIN_MS);
      await expect(shownToast(page)).toHaveText(/^Exported the front and back in \d+\.\d s\.$/);
    });
});

test('PAIR-32.2 Share hands over one file for Together and both for Separately [phone]', async ({
  page,
  check,
}, testInfo) => {
  await standInShareSheet(page);
  const hand = await makePair(page, testInfo);
  await goToStep(page, 'export', hand);
  await chooseSize(page, hand, '0');
  await check('Share is the red button, beside Download', async () => {
    await expect(page.locator('#btnShare')).toBeVisible();
    await expect(page.locator('#btnShare')).toHaveClass(/is-main/);
    await expect(page.locator('#btnDownload')).toBeVisible();
  });
  await hand.tap(page.locator('#btnShare'));
  await page.waitForFunction(() => window.testShared.length === 1);
  await check('one share sheet, with one file: 14_front_portrait_raw_white-pair.jpg', async () => {
    expect((await sharedFiles(page))[0].names).toEqual(['14_front_portrait_raw_white-pair.jpg']);
  });
  await chooseOutput(page, hand, 'separately');
  await check('Separately is selected', async () => {
    await expectSeparately(page);
  });
  await hand.tap(page.locator('#btnShare'));
  await page.waitForFunction(() => window.testShared.length === 2);
  await check('one share sheet, with two files: …-front.jpg and …-back.jpg', async () => {
    expect((await sharedFiles(page))[1].names).toEqual([
      '14_front_portrait_raw_white-front.jpg',
      '14_back_portrait_raw_white-back.jpg',
    ]);
  });
});

test('PAIR-33.1 Copy puts the Together image on the clipboard, and hides for Separately '
  + '[phone]', async ({ page, check }, testInfo) => {
  await standInClipboard(page);
  const hand = await makePair(page, testInfo);
  await goToStep(page, 'export', hand);
  await chooseSize(page, hand, '0');
  const [joined] = await readoutSizes(page);
  await hand.tap(page.locator('#btnCopy'));
  await check('"Copied to clipboard (PNG)."', async () => {
    await expect(shownToast(page)).toHaveText('Copied to clipboard (PNG).');
  });
  await check('a PNG image the size the size line gives', async () => {
    const copied = await copiedImage(page);
    expect(copied.type).toBe('image/png');
    expect([copied.width, copied.height]).toEqual(joined);
  });
  await chooseOutput(page, hand, 'separately');
  await check('Copy is no longer in the save row', async () => {
    await expect(page.locator('#btnCopy')).toBeHidden();
  });
  await chooseOutput(page, hand, 'together');
  await check('Copy is back', async () => {
    await expect(page.locator('#btnCopy')).toBeVisible();
  });
});

test('PAIR-34.1 Next card shows while both sides and the output choice are as exported '
  + '[phone]', async ({ page, check }, testInfo) => {
  const hand = await makePair(page, testInfo);
  const nextCard = page.locator('#btnNextCard');
  await goToStep(page, 'export', hand);
  await chooseSize(page, hand, '0');
  await check('no Next card', async () => {
    await expect(nextCard).toBeHidden();
  });
  await downloadAll(page, hand, 1);
  await check('the file arrives; Next card shows', async () => {
    await expect(nextCard).toBeVisible();
  });
  await switchTo(page, hand, 'front');
  await check('the front\'s Export: Next card still shows', async () => {
    expect(await stepNow(page)).toBe('export');
    await expect(nextCard).toBeVisible();
  });
  await chooseOutput(page, hand, 'separately');
  await check('Next card goes: Separately hasn\'t been saved', async () => {
    await expect(nextCard).toBeHidden();
  });
  await chooseOutput(page, hand, 'together');
  await check('Next card is back', async () => {
    await expect(nextCard).toBeVisible();
  });
  await goToStep(page, 'rotate', hand);
  await check('the front\'s Rotate step; the angle reads 0.0°', async () => {
    expect(await stepNow(page)).toBe('rotate');
    await expect(angleText(page)).toHaveText('0.0°');
  });
  await typeAngle(page, hand, '2');
  await check('the angle reads 2.0°', async () => {
    await expect(angleText(page)).toHaveText('2.0°');
  });
  await goToStep(page, 'export', hand);
  await check('no Next card: the front has changed since the export', async () => {
    await expect(nextCard).toBeHidden();
  });
});

test('PAIR-35.1 A pair\'s export never holds two full-size photos at once [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await makePair(page, testInfo);
  await goToStep(page, 'export', hand);
  await chooseSize(page, hand, '0');
  await countHeldPhotos(page);
  const together = await downloadAll(page, hand, 1);
  await waitForExportEnd(page);
  const heldForTogether = await heldPhotos(page);
  // The open side (the back) goes first, is let go, the front is read, used and let go, and
  // the back is read again.
  const oneAtATime = [`let go ${BACK}`, `read ${FRONT}`, `let go ${FRONT}`, `read ${BACK}`];
  await check('one file arrives; at most one full-size photo is held all through the export: '
    + 'the back\'s let go before the front\'s is read, the front\'s before the back\'s is read '
    + 'again', async () => {
    expect(together).toHaveLength(1);
    expect(heldForTogether.most, 'the most full-size photos held at once').toBe(1);
    expect(heldForTogether.events).toEqual(oneAtATime);
  });
  await check('once the export has finished, the app holds the back\'s full-size photo, and '
    + 'nothing else', async () => {
    expect(heldForTogether.now).toBe(1);
    const openPhoto = await page.evaluate(() => {
      const img = window.__straightener.app.img;
      return { name: img.name, isHeld: !!img.el };
    });
    expect(openPhoto).toEqual({ name: BACK, isHeld: true });
  });
  await chooseOutput(page, hand, 'separately');
  await check('Separately is selected', async () => {
    await expectSeparately(page);
  });
  const separately = await downloadAll(page, hand, 2);
  await waitForExportEnd(page);
  const heldForSeparately = await heldPhotos(page);
  await check('two files arrive; again at most one full-size photo is held at a time, and the '
    + 'back\'s is held again at the end', async () => {
    expect(separately).toHaveLength(2);
    expect(heldForSeparately.most, 'the most full-size photos held at once').toBe(1);
    expect(heldForSeparately.events).toEqual(oneAtATime);
    expect(heldForSeparately.now).toBe(1);
  });
});

test('PAIR-36.1 When the open photo can\'t be read again, saving waits for a side switch '
  + '[phone]', async ({ page, check }, testInfo) => {
  const hand = await makePair(page, testInfo);
  await goToStep(page, 'export', hand);
  await chooseSize(page, hand, '0');
  await recordToasts(page);
  await failReadsOf(page, BACK);
  const [saved] = await downloadAll(page, hand, 1);
  await waitForExportEnd(page);
  await check('the file arrives; then an amber warning reads "The photo isn’t loaded after the '
    + 'last export. Tap Front or Back to switch sides, then switch back."', async () => {
    expect(saved.name).toBe('14_front_portrait_raw_white-pair.jpg');
    await expect(shownToast(page)).toHaveText(PHOTO_RELEASED_MESSAGE);
    await expect(shownToast(page)).toHaveClass(/is-warn/);
  });
  await check('the joined image is still drawn on screen', async () => {
    const screen = await page.evaluate(() => ({
      isPhotoHeld: !!window.__straightener.app.img.el,
      isTogetherShown: window.CF.isTogetherShown(),
      hasJoinedImage: !!window.CF.togetherPreview(),
    }));
    expect(screen).toEqual({ isPhotoHeld: false, isTogetherShown: true, hasJoinedImage: true });
  });
  await toastsSoFar(page);
  const arrived = [];
  page.on('download', download => arrived.push(download.suggestedFilename()));
  await hand.tap(page.locator('#btnDownload'));
  await page.waitForFunction(() => window.testToasts.some(toast => toast.kind === 'error'));
  await waitForExportEnd(page);
  await page.waitForTimeout(NO_DOWNLOAD_WAIT_MS);
  const messages = await toastsSoFar(page);
  await check('no file: a red message begins "Export failed"', async () => {
    expect(arrived).toEqual([]);
    const failures = messages.filter(message => message.kind === 'error');
    expect(failures).toHaveLength(1);
    expect(failures[0].text).toMatch(/^Export failed/);
  });
  await allowReads(page);
  await switchTo(page, hand, 'front');
  await check('the front opens', async () => {
    expect((await editState(page)).source.name).toBe(FRONT);
  });
  await switchTo(page, hand, 'back');
  await check('the back opens', async () => {
    expect((await editState(page)).source.name).toBe(BACK);
    expect(await page.evaluate(() => !!window.__straightener.app.img.el)).toBe(true);
  });
  await goToStep(page, 'export', hand);
  const afterSwitch = await downloadAll(page, hand, 1);
  await check('the file arrives: 14_front_portrait_raw_white-pair.jpg', async () => {
    expect(afterSwitch.map(file => file.name)).toEqual(['14_front_portrait_raw_white-pair.jpg']);
  });
});

test('PAIR-37.1 The size line gives the joined size, or the front\'s and the back\'s [phone]',
  async ({ page, check }, testInfo) => {
    const hand = await makePair(page, testInfo);
    const readout = page.locator('#exportReadout');
    await goToStep(page, 'export', hand);
    await chooseSize(page, hand, '0');
    await check('it reads "W × H px · JPEG", W × H in bold', async () => {
      await expect(readout).toHaveText(/^\d+ × \d+ px · JPEG$/);
      await expect(readout.locator('b')).toHaveText(/^\d+ × \d+$/);
    });
    await chooseOutput(page, hand, 'separately');
    const [front, back] = await readoutSizes(page);
    const backOwn = await page.evaluate(() => {
      const output = window.__straightener.app.geometry.output;
      return [output.width, output.height];
    });
    await check('it reads "W × H + W × H px · JPEG": the front\'s size, then the back\'s',
      async () => {
        await expect(readout).toHaveText(/^\d+ × \d+ \+ \d+ × \d+ px · JPEG$/);
        expect(back, 'the second size is the back\'s own (the side on screen)').toEqual(backOwn);
        expect(front).not.toEqual(back);
      });
    await hand.tap(segment(page, 'exportFormat', 'png'));
    await check('the line ends "px · PNG"', async () => {
      await expect(readout).toHaveText(/ px · PNG$/);
    });
    await chooseOutput(page, hand, 'together');
    const layout = expectedTogether(front, back, 'portrait');
    await check('the joined size again: twice the wider card plus the gap across, the taller '
      + 'card\'s height, "px · PNG"', async () => {
      await expect(readout).toHaveText(`${layout.width} × ${layout.height} px · PNG`);
    });
  });

test('PAIR-37.2 Separately warns when the side not on screen is scaled down [phone]', async ({
  page,
  check,
}, testInfo) => {
  test.fail(true, 'BUG-033');
  const lowLimitLink = `index.html?maxOutputArea=${LOW_AREA}`;
  const hand = await makePair(page, testInfo, PORTRAIT_PAIR, lowLimitLink);
  const topLeft = await cornerOnPage(page, 0);
  const upAndLeft = { x: topLeft.x - ENLARGE_DRAG_PX, y: topLeft.y - ENLARGE_DRAG_PX };
  await hand.drag(topLeft, upAndLeft);
  await check('the top-left handle sits outside the card, up and to the left of its corner',
    async () => {
      const handle = await cornerOnPage(page, 0);
      expect(Math.abs(handle.x - upAndLeft.x)).toBeLessThan(CORNER_TOLERANCE_PX);
      expect(Math.abs(handle.y - upAndLeft.y)).toBeLessThan(CORNER_TOLERANCE_PX);
    });
  const bottomRight = await cornerOnPage(page, 2);
  const downAndRight = {
    x: bottomRight.x + ENLARGE_DRAG_PX,
    y: bottomRight.y + ENLARGE_DRAG_PX,
  };
  await hand.drag(bottomRight, downAndRight);
  await check('the bottom-right handle sits outside the card, down and to the right: the '
    + 'outline is larger than the card', async () => {
    const handle = await cornerOnPage(page, 2);
    expect(Math.abs(handle.x - downAndRight.x)).toBeLessThan(CORNER_TOLERANCE_PX);
    expect(Math.abs(handle.y - downAndRight.y)).toBeLessThan(CORNER_TOLERANCE_PX);
  });
  await switchTo(page, hand, 'front');
  await check('the front opens on Perspective, with Front in white', async () => {
    expect(await stepNow(page)).toBe('perspective');
    await expect(sideButton(page, 'front')).toHaveAttribute('aria-pressed', 'true');
  });
  await goToStep(page, 'export', hand);
  await check('the Export step, with Together selected', async () => {
    await expect(segment(page, 'pairOutput', 'together')).toHaveAttribute('aria-pressed', 'true');
  });
  await chooseSize(page, hand, '0');
  await check('Original is selected', async () => {
    await expectExportSettings(page, { size: '0' });
  });
  await chooseOutput(page, hand, 'separately');
  // The sizes are still in the page while the note takes their place on a phone: the front is
  // under the limit as it is, the back scaled down to just under it.
  const [frontSize, backSize] = await readoutSizes(page);
  // A known defect: plain value comparisons, so the case fails at once rather than waiting.
  const isNoteShown = await page.locator('#exportMessage').isVisible();
  const note = await page.locator('#exportMessage').textContent();
  await check('Separately is selected, and beside it one note reads "The back is scaled down to '
    + 'fit the N MP limit."', async () => {
    await expectSeparately(page);
    expect(frontSize[0] * frontSize[1], 'the front is under the limit').toBeLessThan(LOW_AREA);
    const backScaled = backSize[0] * backSize[1];
    expect(backScaled, 'the back is scaled to the limit').toBeLessThanOrEqual(LOW_AREA);
    expect(backScaled, 'the back is scaled to the limit').toBeGreaterThan(LOW_AREA * AREA_FILL_MIN);
    expect(isNoteShown, 'a note shows').toBe(true);
    expect(note).toMatch(APPROVED_BACK_CLAMP_NOTE);
  });
});

test('PAIR-37.3 When the other side\'s corners are crossed, the line says which side to fix '
  + '[phone]', async ({ page, check }, testInfo) => {
  test.fail(true, 'BUG-034');
  // A browser that can share files and copy images, so Share and Copy show.
  await standInShareSheet(page);
  await standInClipboard(page);
  const hand = await makePair(page, testInfo);
  await crossCorners(page, hand);
  await check(`the corner lines cross; the line reads "${CROSSED_MESSAGE}"`, async () => {
    await expect(page.getByText(CROSSED_MESSAGE)).toBeVisible();
    expect(await page.evaluate(() => window.__straightener.app.geometry.ok)).toBe(false);
  });
  // Not switchTo: today the switch stops part-way, and its detection wait would time out.
  await hand.tap(sideButton(page, 'front'));
  await page.waitForFunction(() => {
    const app = window.__straightener.app;
    return app.pair.current === 'front' && !app.isSwitching;
  });
  // A known defect: plain value comparisons, so the case fails at once rather than waiting.
  const afterSwitch = {
    step: await stepNow(page),
    photo: (await editState(page)).source.name,
    isOpeningShown: await shownToast(page).isVisible(),
  };
  await check('the front opens on Perspective, its picture replacing the back\'s; the '
    + '"Opening the front…" message goes', async () => {
    expect(afterSwitch).toEqual({ step: 'perspective', photo: FRONT, isOpeningShown: false });
  });
  await goToStep(page, 'export', hand);
  // The size line's row: on a phone a note may take the size line's place in it.
  const readout = await page.locator('#exportReadoutRow').textContent();
  const dimmed = {};
  for (const id of ['btnShare', 'btnDownload', 'btnCopy']) {
    dimmed[id] = await page.locator(`#${id}`).isDisabled();
  }
  await check(`the size line reads "${FIX_BACK_MESSAGE}"; Share, Download and Copy are greyed `
    + 'out', async () => {
    expect(readout).toContain(FIX_BACK_MESSAGE);
    expect(dimmed).toEqual({ btnShare: true, btnDownload: true, btnCopy: true });
  });
  await recordToasts(page);
  const arrived = [];
  page.on('download', download => arrived.push(download.suggestedFilename()));
  // A greyed-out button takes no tap; Playwright is told to tap it anyway, as a person can.
  const download = page.locator('#btnDownload');
  await (hand.isTouch ? download.tap({ force: true }) : download.click({ force: true }));
  await page.waitForTimeout(NO_DOWNLOAD_WAIT_MS);
  const messages = await toastsSoFar(page);
  await check('nothing is saved, and no message beginning "Export failed" shows', async () => {
    expect(arrived).toEqual([]);
    expect(messages.filter(message => message.text.startsWith('Export failed'))).toEqual([]);
  });
});

test('PAIR-38.1 The Together preview, for a person to judge [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await makePair(page, testInfo);
  await goToStep(page, 'overlay', hand);
  await chooseFile(page, hand, page.locator('#btnOverlayAdd'), LOGO);
  await page.waitForFunction(() => !!window.__straightener.app.state.overlay);
  await check('the logo appears on the back', async () => {
    expect((await editState(page)).overlay).not.toBeNull();
  });
  await switchTo(page, hand, 'front');
  await check('the front opens on the Overlay step, with no logo', async () => {
    expect((await editState(page)).source.name).toBe(FRONT);
    expect(await stepNow(page)).toBe('overlay');
    expect((await editState(page)).overlay).toBeNull();
  });
  await goToStep(page, 'levels', hand);
  await check('the front\'s Levels step', async () => {
    expect(await stepNow(page)).toBe('levels');
  });
  await hand.tap(page.locator('#toolAutoLevels'));
  await check('the front\'s whites turn brighter, and a white dot shows on the Levels tab',
    async () => {
      expect(await page.evaluate(() => window.__straightener.app.levelsDraft)).toBeTruthy();
      await expect(levelsDot(page)).toBeVisible();
    });
  await hand.tap(page.locator('#btnApplyLevels'));
  await check('Apply is greyed out and the dot on the Levels tab goes', async () => {
    await expect(page.locator('#btnApplyLevels')).toBeDisabled();
    await expect(levelsDot(page)).toBeHidden();
    expect((await editState(page)).levels).not.toBeNull();
  });
  await goToStep(page, 'export', hand);
  await check('the photo area shows the joined image', async () => {
    expect(await page.evaluate(() => window.CF.isTogetherShown())).toBe(true);
  });
  // Auto's message still shows over the photo; the screenshots wait for it to go.
  await shownToast(page).waitFor({ state: 'hidden' });
  await check.eye('one joined image: the front on the left with its brighter levels and no '
    + 'logo, the back on the right with the logo where it was placed, a thin white gap between '
    + 'them, nothing else around them');
  await openOptions(page, hand, 'export');
  await page.locator('#fill').selectOption('transparent');
  await closeOptions(page, hand, 'export');
  await check('Fill outside photo is Transparent', async () => {
    expect((await editState(page)).export.fill).toBe('transparent');
  });
  await check.eye('the gap between the cards and the space around the smaller card show a grey '
    + 'checkerboard instead of white');
  await chooseOutput(page, hand, 'separately');
  await check('the joined image is no longer shown', async () => {
    expect(await page.evaluate(() => window.CF.isTogetherShown())).toBe(false);
  });
  await check.eye('the front alone (the side on screen), framed by its crop, with no back '
    + 'beside it');
});

test('PAIR-39.1 The Together preview zooms on its own and fits again when it changes [both]',
  async ({ page, check }, testInfo) => {
    const hand = await makePair(page, testInfo);
    const fit = page.locator('#btnFit');
    const isPhoneLayout = await page.evaluate(() => window.CF.phoneLayout.matches);
    const isTogetherShown = () => page.evaluate(() => window.CF.isTogetherShown());
    const expectGrown = async fitted => {
      const view = await viewNow(page);
      expect(view.isFitted).toBe(false);
      expect(view.zoom).toBeGreaterThan(fitted.zoom);
    };
    await goToStep(page, 'export', hand);
    const fitted = await viewNow(page);
    await check('the joined image fits the photo area; on a phone no Fit, on a wide screen Fit '
      + 'is there', async () => {
      expect(await isTogetherShown()).toBe(true);
      expect(fitted.isFitted).toBe(true);
      await (isPhoneLayout ? expect(fit).toBeHidden() : expect(fit).toBeVisible());
    });
    await zoomIn(page, hand);
    await check('the image grows; on a phone Fit appears', async () => {
      await expectGrown(fitted);
      await expect(fit).toBeVisible();
    });
    await chooseOutput(page, hand, 'separately');
    await check('the back alone, fitted to the photo area; on a phone Fit goes', async () => {
      expect(await isTogetherShown()).toBe(false);
      expect((await viewNow(page)).isFitted).toBe(true);
      if (isPhoneLayout) await expect(fit).toBeHidden();
    });
    await chooseOutput(page, hand, 'together');
    await check('the joined image fits the photo area again, as in row 1', async () => {
      expect(await viewNow(page)).toEqual(fitted);
    });
    await zoomIn(page, hand);
    await check('the image grows', async () => {
      await expectGrown(fitted);
    });
    await hand.tap(fit);
    await check('Fit: the joined image fits the photo area again', async () => {
      expect(await viewNow(page)).toEqual(fitted);
    });
    await zoomIn(page, hand);
    await check('the image grows again', async () => {
      await expectGrown(fitted);
    });
    await goToStep(page, 'crop', hand);
    await check('the back\'s Crop step, its box upright under 5:7 card', async () => {
      await expect(selectedPreset(page)).toHaveText('5:7 card');
      await expectCardCrop(page, 'portrait');
    });
    await hand.tap(page.locator('#toolSwap'));
    await check('the box lies down, 7 wide to 5 high, under 7:5 card', async () => {
      await expect(selectedPreset(page)).toHaveText('7:5 card');
      await expectCardCrop(page, 'landscape');
    });
    await goToStep(page, 'export', hand);
    await check('the two cards lie down, one above the other, and the joined image fits the '
      + 'photo area', async () => {
      expect(await page.evaluate(() => window.__straightener.app.pair.orient)).toBe('landscape');
      expect((await viewNow(page)).isFitted).toBe(true);
    });
  });

// Waits until the stored pair says it was exported (its record is saved a moment after the
// export).
function waitUntilStoredAsExported(page) {
  return waitInPage(page, async () => {
    const pair = await window.CF.Session.get('pair');
    return !!pair && pair.exported === true;
  });
}

test('PAIR-40.1 Resume brings back the waiting side\'s edits, Levels changes, logo and the '
  + 'pair\'s orientation [phone] [webkit]', async ({ page, check }, testInfo) => {
  const hand = await makePair(page, testInfo);
  await switchTo(page, hand, 'front');
  await goToStep(page, 'rotate', hand);
  await typeAngle(page, hand, '3');
  await check('the angle reads 3.0°', async () => {
    await expect(angleText(page)).toHaveText('3.0°');
  });
  await goToStep(page, 'crop', hand);
  await hand.tap(page.locator('#toolSwap'));
  await check('the box lies down, 7 wide to 5 high, under 7:5 card', async () => {
    await expect(selectedPreset(page)).toHaveText('7:5 card');
    await expectCardCrop(page, 'landscape');
  });
  await goToStep(page, 'overlay', hand);
  await chooseFile(page, hand, page.locator('#btnOverlayAdd'), LOGO);
  await page.waitForFunction(() => !!window.__straightener.app.state.overlay);
  await check('the logo appears on the front', async () => {
    expect((await editState(page)).overlay).not.toBeNull();
  });
  await goToStep(page, 'levels', hand);
  await hand.tap(page.locator('#toolAutoLevels'));
  await check('Discard and Apply are no longer greyed out, and a white dot is on the Levels tab',
    async () => {
      await expectLevelsButtons(page, 'enabled');
      await expect(levelsDot(page)).toBeVisible();
    });
  await switchTo(page, hand, 'back');
  await check('the back opens on Levels, with no dot on the tab', async () => {
    expect(await stepNow(page)).toBe('levels');
    await expect(levelsDot(page)).toBeHidden();
  });
  await waitUntilPairStored(page);
  await reloadToResume(page);
  await check(`Resume names ${FRONT} + ${BACK}`, async () => {
    await expect(page.locator('#resumeName')).toHaveText(`${FRONT} + ${BACK}`);
  });
  await resume(page, hand, BACK, 'back');
  await check('the back opens on Levels, with Back in white', async () => {
    expect(await stepNow(page)).toBe('levels');
    await expect(sideButton(page, 'back')).toHaveAttribute('aria-pressed', 'true');
  });
  await switchTo(page, hand, 'front');
  await check('the front opens on Levels: Discard and Apply are not greyed out, and the dot is '
    + 'on the Levels tab', async () => {
    expect(await stepNow(page)).toBe('levels');
    await expectLevelsButtons(page, 'enabled');
    await expect(levelsDot(page)).toBeVisible();
  });
  await goToStep(page, 'rotate', hand);
  await check('the angle reads 3.0°', async () => {
    await expect(angleText(page)).toHaveText('3.0°');
  });
  await goToStep(page, 'overlay', hand);
  await check('the logo is on the front, and the card lies down, 7 wide to 5 high', async () => {
    expect((await editState(page)).overlay).not.toBeNull();
    await expectCardCrop(page, 'landscape');
  });
});

test('PAIR-41.1 Resume opens the side that was open, and the waiting side without undo history '
  + '[phone] [webkit]', async ({ page, check }, testInfo) => {
  const hand = await makePair(page, testInfo);
  await switchTo(page, hand, 'front');
  await goToStep(page, 'rotate', hand);
  await typeAngle(page, hand, '2');
  await check('the angle reads 2.0°; Undo can be tapped', async () => {
    await expect(angleText(page)).toHaveText('2.0°');
    await expect(page.locator('#btnUndo')).toBeEnabled();
  });
  await switchTo(page, hand, 'back');
  await check('the back opens on Rotate', async () => {
    expect(await stepNow(page)).toBe('rotate');
    expect((await editState(page)).source.name).toBe(BACK);
  });
  await goToStep(page, 'export', hand);
  await check('the back\'s Export step', async () => {
    expect(await stepNow(page)).toBe('export');
  });
  await chooseSize(page, hand, '0');
  await check('Original is selected', async () => {
    await expectExportSettings(page, { size: '0' });
  });
  const saved = await downloadAll(page, hand, 1);
  await check('the file arrives; Next card shows in the bottom row', async () => {
    expect(saved).toHaveLength(1);
    await expect(page.locator('#btnNextCard')).toBeVisible();
  });
  await waitUntilPairStored(page);
  await waitUntilStoredAsExported(page);
  await reloadToResume(page);
  await check(`Resume names ${FRONT} + ${BACK}`, async () => {
    await expect(page.locator('#resumeName')).toHaveText(`${FRONT} + ${BACK}`);
  });
  // Which photo is read first can't be seen, so the reads are noted as they happen.
  await page.evaluate(() => {
    const source = window.CF.ImageSource;
    const load = source.load;
    window.testReads = [];
    source.load = function loadAndNote(blob, name) {
      window.testReads.push(name);
      return load.call(source, blob, name);
    };
  });
  await resume(page, hand, BACK, 'back');
  await check('the back opens on Export, with Back in white', async () => {
    expect(await stepNow(page)).toBe('export');
    await expect(sideButton(page, 'back')).toHaveAttribute('aria-pressed', 'true');
  });
  const reads = await page.evaluate(() => window.testReads);
  await check('Next card shows: the pair\'s export was remembered (the front\'s photo was read '
    + 'before the back\'s)', async () => {
    await expect(page.locator('#btnNextCard')).toBeVisible();
    expect(reads).toEqual([FRONT, BACK]);
  });
  await switchTo(page, hand, 'front');
  await check('the front opens on Export; Undo is greyed out', async () => {
    expect(await stepNow(page)).toBe('export');
    await expect(page.locator('#btnUndo')).toBeDisabled();
  });
  await goToStep(page, 'rotate', hand);
  await check('the angle reads 2.0°', async () => {
    await expect(angleText(page)).toHaveText('2.0°');
  });
});

test('PAIR-42.1 A damaged stored pair is dropped, and the open side resumes alone [phone] '
  + '[webkit]', async ({ page, check }, testInfo) => {
  const hand = await makePair(page, testInfo);
  await waitUntilPairStored(page);
  await changeStoredPair(page, 'damage');
  await reloadToResume(page);
  await check('the start screen offers Resume', async () => {
    await expect(page.locator('#btnResume')).toBeVisible();
  });
  await resume(page, hand, BACK, null);
  await check(`the back opens on its own; a warning reads "${PAIR_RESET_MESSAGE}"`, async () => {
    expect((await editState(page)).source.name).toBe(BACK);
    await expect(shownToast(page)).toHaveText(PAIR_RESET_MESSAGE);
    await expect(shownToast(page)).toHaveClass(/is-warn/);
  });
  await check('there is no Front / Back and no Unpair', async () => {
    await expect(page.locator('#sideSwitch')).toBeHidden();
    await expect(page.locator('#btnUnpair')).toBeHidden();
  });
  await waitUntilSingleStored(page);
  await reloadToResume(page);
  await check(`Resume names only ${BACK}: the damaged pair was deleted`, async () => {
    await expect(page.locator('#resumeName')).toHaveText(BACK);
    expect(await storedRecord(page, 'pair')).toBeUndefined();
    expect(await storedRecord(page, 'pairPhoto')).toBeUndefined();
  });
});

test('PAIR-42.2 A stored pair whose photo doesn\'t match its edits is dropped [phone] [webkit]',
  async ({ page, check }, testInfo) => {
    const hand = await makePair(page, testInfo);
    await waitUntilPairStored(page);
    await changeStoredPair(page, 'other photo', OTHER_PHOTO);
    await reloadToResume(page);
    await check('the start screen offers Resume', async () => {
      await expect(page.locator('#btnResume')).toBeVisible();
    });
    await resume(page, hand, BACK, null);
    await check(`the back opens on its own; a warning reads "${PAIR_RESET_MESSAGE}"`,
      async () => {
        expect((await editState(page)).source.name).toBe(BACK);
        await expect(shownToast(page)).toHaveText(PAIR_RESET_MESSAGE);
      });
    await goToStep(page, 'export', hand);
    await check('Add back is in the bottom row: the back is a single photo', async () => {
      await expect(page.locator('#btnAddBack')).toBeVisible();
      await expect(page.locator('#sideSwitch')).toBeHidden();
    });
  });

test('PAIR-43.1 The first switch to a resumed side finds its card but leaves its corners alone '
  + '[phone]', async ({ page, check }, testInfo) => {
  const hand = await makePair(page, testInfo);
  const candidate = page.locator('#toolCandidate');
  await switchTo(page, hand, 'front');
  await check('the front opens on Perspective; Candidate can be tapped', async () => {
    expect(await stepNow(page)).toBe('perspective');
    await expect(candidate).toBeEnabled();
  });
  const start = await cornerOnPage(page, 0);
  await hand.drag(start, { x: start.x - CORNER_DRAG_PX, y: start.y });
  const end = await cornerOnPage(page, 0);
  const draggedCorners = (await editState(page)).corners;
  await check('the handle sits 40 px left of the card\'s corner', async () => {
    expect(Math.abs(start.x - CORNER_DRAG_PX - end.x)).toBeLessThan(CORNER_TOLERANCE_PX);
    expect(Math.abs(start.y - end.y)).toBeLessThan(CORNER_TOLERANCE_PX);
  });
  await switchTo(page, hand, 'back');
  await check('the back opens on Perspective', async () => {
    expect((await editState(page)).source.name).toBe(BACK);
  });
  await waitUntilPairStored(page);
  await reloadToResume(page);
  await check(`the start screen offers Resume, naming ${FRONT} + ${BACK}`, async () => {
    await expect(page.locator('#resumeName')).toHaveText(`${FRONT} + ${BACK}`);
  });
  await resume(page, hand, BACK, 'back');
  await check('the back opens on Perspective, with Back in white', async () => {
    expect(await stepNow(page)).toBe('perspective');
    await expect(sideButton(page, 'back')).toHaveAttribute('aria-pressed', 'true');
  });
  await switchTo(page, hand, 'front');
  await check('the front opens on Perspective; Candidate can be tapped again; the top-left '
    + 'handle is still 40 px left of the card\'s corner; Undo is greyed out', async () => {
    expect(await stepNow(page)).toBe('perspective');
    await expect(candidate).toBeEnabled();
    expect((await editState(page)).corners).toEqual(draggedCorners);
    await expect(page.locator('#btnUndo')).toBeDisabled();
  });
  await hand.tap(candidate);
  await check('the corners jump to another shape detection found', async () => {
    expect((await editState(page)).corners).not.toEqual(draggedCorners);
  });
});
