// The Corner shots cases (tests/catalog/corner-shots.md): the sheet, the thumbnails, 4 photos
// or 1 sheet, the size line, Share corners and Download corners, Share now, when the buttons
// are dimmed, how each shot is framed, the sheet's layout, the export settings, file names,
// progress, Next card and pairs.
// Each test drives the app as a person would, through hand.tap and hand.drag (a finger on the
// phone targets, the mouse on the wide ones), and reads the app's state only to check a result.
// Every row of a case has its own check, in order, described in the row's own words.
// No test opens a real share sheet: the page gets a stand-in (support/export.js).
'use strict';
const fs = require('fs');
const { test, expect } = require('./support/case.js');
const {
  samplePath,
  goToStep,
  openOptions,
  closeOptions,
  middleOf,
  hasWhiteFill,
  stepNow,
  nextFrames: waitForThumbnails,
} = require('./support/app.js');
const {
  installShareStandIn,
  choiceButton,
  selectedChoices,
  crossTheCorners,
  exportStarts,
  toastMessage,
  tapRegardless,
  waitForExportEnd,
  waitForShares,
  sharesSoFar,
  downloadAnswering,
  isSameFile,
  dragQualityTo,
  nextCard,
  tapFormat,
} = require('./support/export.js');
const {
  PORTRAIT_PAIR,
  makePair,
  sideButton,
  switchTo,
  holdNextOpening,
  releaseOpening,
  waitForOpening,
  noteDownloadStarts,
  downloadStarts,
  regionMeans,
  shownToast,
} = require('./support/front-and-back.js');
const {
  rememberPhoto,
  waitForPhoto,
  waitForSaved,
  reloadToStart,
} = require('./support/start-and-session.js');
const { tapAt } = require('./support/perspective.js');
const { ringOnPage, logoPlacement, logoOnPage, colorOnPage } = require('./support/overlay.js');
const {
  CORNER_PHOTO,
  NO_CORNER_QUESTION,
  startOnExport,
  isCornerSheetOpen,
  waitForCornerSheet,
  openCornerSheet,
  closeCornerSheet,
  chooseCornerOutput,
  cornerReadout,
  saveCorners,
  questionButton,
  expectQuestion,
  isQuestionUp,
  imageSize,
  collectDownloads,
  downloadsAfterWait,
  luminanceProfile,
  cardCornerInShot,
  cardWidthInExport,
  makeCornerShotsImpossible,
  installSwitchableShare,
  recordCornerProgress,
  cornerProgressSoFar,
  openPicker,
  chooseFixtureLogo,
  saveTheCorners,
  thumbnailDigests,
  isOutlineCrossed,
  logoCoverOfShot,
  downloadCorners,
} = require('./support/corner-shots.js');

// The case photo's corner shots at its own resolution, in px: each shot's side, and the sheet's
// side (two shots and a 2 px gap, 0.8% of 312 px rounded).
const SHOT_PX = 156;
const GAP_PX = 2;
const SHEET_PX = 2 * SHOT_PX + GAP_PX;
// Its crop at Original, in px.
const ORIGINAL_CROP_PX = 1074;
// The file names the case photo's corner shots are saved under.
const PHOTO_BASE = '01_chrome_flat_black';
const SHEET_NAME = `${PHOTO_BASE}-corners.jpg`;
// The four photos, in the order they are saved.
const SHOT_LABELS = ['tl', 'tr', 'br', 'bl'];
const shotName = (label, extension = 'jpg') => `${PHOTO_BASE}-corner-${label}.${extension}`;
// The size lines the case photo's corner shots show.
const SHEET_LINE = `Sheet ${SHEET_PX} × ${SHEET_PX} px · ${SHOT_PX} px corners · JPEG`;
const PHOTOS_LINE = `4 photos · ${SHOT_PX} × ${SHOT_PX} px · JPEG`;
const PHOTOS_PNG_LINE = `4 photos · ${SHOT_PX} × ${SHOT_PX} px · PNG`;
// The sheet's hint, word for word.
const CORNER_HINT = 'Close-ups of the card’s four corners, at the photo’s own resolution, '
  + 'with this photo’s levels and no overlay.';
// The question asked before saving something under 2000 px.
const UPSCALE_QUESTION = 'Upscale to 2000 px?';
// The line above Perspective's controls while the corners cross.
const CROSSED_MESSAGE = 'Corners cross or fold inward. Drag them back into a convex shape.';
// The size line's endings under ruling R20, in its approved words (tests/catalog/wording.md).
const TOO_SMALL_ENDING = ' · the card is too small';
const FIX_CORNERS_ENDING = ' · fix the corners in Perspective first';
// The engine's reasons for refusing corner shots (js/engine.js, cornerShots).
const TOO_SMALL_REASON = 'The card is too small for corner shots.';
const NOT_INVERTIBLE_REASON = 'Transform is not invertible.';
// Where the card's corner sits in each shot, as a fraction of its side (insetFraction), and how
// far a measured edge may be from it: 5 px of a 156 px shot.
const CORNER_INSET = 0.3;
const INSET_TOLERANCE = 5 / SHOT_PX;
// A shot's side as a fraction of the card's short edge (sizeFraction), and how far the measured
// ratio may be from it, as a fraction of it: a shot is at the resolution of the card's least
// detailed corner, and the export at Original at the most detailed part of the crop, so the
// two scales differ by a few percent.
const SHOT_FRACTION = 0.25;
const SHOT_FRACTION_TOLERANCE = 0.1;
// The card's width in the case photo's export at Original, in px, and how far a measurement may
// be from it.
const CARD_WIDTH_PX = 660;
const CARD_WIDTH_TOLERANCE_PX = 15;
// How far down the sheet's grabber is dragged to close it, in CSS px.
const CLOSE_DRAG_PX = 300;
// The app's background behind a Transparent fill (CONFIG.theme.stage, #2b2b2b), as [r, g, b].
const STAGE_RGB = [43, 43, 43];
const WHITE_RGB = [255, 255, 255];
// How long a case waits to be sure a tap saved nothing, in ms.
const NOTHING_SAVED_WAIT_MS = 1500;
// The four photos are started this far apart (DOWNLOAD_GAP_MS in js/app/corner-shots.js), and
// each gap must be at least the lower figure on this machine's clock.
const DOWNLOAD_GAP_MIN_MS = 200;
// A gap line of white fill in a JPEG reads at least this luminance (0 to 255); the mat at the
// sheet's outer edges at most the other.
const WHITE_LINE_MIN = 225;
const DARK_EDGE_MAX = 160;
// The grid each tile and photo is split into to compare them, cells per side, and the most a
// matching pair of cells may differ on average (0 to 255): JPEG saved twice.
const MATCH_GRID = 4;
const MATCH_TOLERANCE = 12;
// The pair's corner shots in Chromium: the back's and the front's shot sides, in px.
const BACK_SHOT_PX = 152;
const FRONT_SHOT_PX = 144;
// The logo the no-logo cases add, from tests/fixtures/: a solid green square.
const GREEN_LOGO = 'green-logo.png';
// The logo's middle, as a fraction of the crop, is under this once it is snapped to the top-left
// ring; and within this of 0.5 when it is first added, in the middle.
const TOP_LEFT_MAX = 0.25;
const MIDDLE_TOLERANCE = 0.01;
// Snapped to the top-left ring, the logo covers at least this much of the top-left corner
// shot's square, so it would show there if it were drawn in.
const LOGO_COVER_MIN = 0.2;
// A color on the photo counts as the logo's green when its green channel is at least the first
// figure and at least the second above its red and its blue (0 to 255): the logo is drawn at
// its opacity over the photo, so its pure green reads paler on screen (about 223, 255, 223
// over the light card), and no part of the card or the mat is that green.
const ON_SCREEN_GREEN_MIN = 200;
const ON_SCREEN_GREEN_LEAD = 25;
// The Quality row's text at the start, and at the slider's two ends.
const QUALITY_START = '92%';
const QUALITY_HIGH = '100%';
const QUALITY_LOW = '50%';

// The Corner shots button, and the sheet's two save buttons and their labels.
const cornerShotsButton = page => page.locator('#btnCornerShots');
const shareCorners = page => page.locator('#btnCornerShare');
const shareCornersLabel = page => page.locator('#btnCornerShare .action-label');
// True when a control has the red main look.
const isRed = locator => locator.evaluate(el => el.classList.contains('is-main'));

// Taps Share corners and waits until the stand-in share sheet has had `count` calls in all.
async function shareCornersOnce(page, hand, count) {
  await hand.tap(shareCorners(page));
  await waitForShares(page, count);
  await waitForExportEnd(page);
}

// The pixels of every thumbnail canvas, summed up: for each, whether every pixel is the one
// color `rgb` (within a step for rounding).
function thumbnailsArePlain(page, rgb) {
  return page.evaluate(color => [...document.querySelectorAll('canvas[data-corner]')]
    .map(canvas => {
      const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
      for (let offset = 0; offset < pixels.length; offset += 4) {
        for (let channel = 0; channel < 3; channel++) {
          if (Math.abs(pixels[offset + channel] - color[channel]) > 1) return false;
        }
      }
      return canvas.width > 0;
    }), rgb);
}

// Taps a step tab and records the row's verdict: that step shows (`then` checks anything more
// the row says).
async function tapStepAndCheck(page, hand, check, step, description, then = async () => {}) {
  await goToStep(page, step, hand);
  await check(description, async () => {
    expect(await stepNow(page)).toBe(step);
    await then();
  });
}

// Taps Corner shots and records the row's verdict: the sheet has risen (`then` checks anything
// more the row says).
async function openSheetAndCheck(page, hand, check, description, then = async () => {}) {
  await openCornerSheet(page, hand);
  await check(description, async () => {
    expect(await isCornerSheetOpen(page)).toBe(true);
    await then();
  });
}

// Taps the × of the Corner shots sheet and records the row's verdict: the sheet has gone down
// (`then` checks anything more the row says).
async function closeSheetAndCheck(page, hand, check, description = 'the sheet goes down',
  then = async () => {}) {
  await closeCornerSheet(page, hand);
  await check(description, async () => {
    expect(await isCornerSheetOpen(page)).toBe(false);
    await then();
  });
}

// Taps 4 photos (or 1 sheet) in the open sheet and records the verdict that it is selected
// (white).
async function chooseOutputAndCheck(page, hand, check, label) {
  await chooseCornerOutput(page, hand, label);
  await check(`${label} is selected`, async () => {
    expect(await selectedChoices(page, 'cornerOutput')).toEqual([label]);
    expect(await hasWhiteFill(choiceButton(page, 'cornerOutput', label))).toBe(true);
  });
}

// Records the verdict that 1 sheet is selected in the Corner shots sheet.
function isSheetChosen(page) {
  return async () => {
    expect(await selectedChoices(page, 'cornerOutput')).toEqual(['1 sheet']);
  };
}

// Taps a Format choice and records the verdict that it is selected.
async function tapFormatAndCheck(page, hand, check, label) {
  await tapFormat(page, hand, label);
  await check(`${label} is selected`, async () => {
    expect(await selectedChoices(page, 'exportFormat')).toEqual([label]);
  });
}

// Drags the top-left corner handle past the bottom-right one on Perspective and records the
// row's verdict as a person sees it: the handles have crossed, and the line above the controls
// says so.
async function crossAndCheck(page, hand, check) {
  await crossTheCorners(page, hand);
  await check(`the outline crosses itself; the line above the controls reads "${CROSSED_MESSAGE}"`,
    async () => {
      expect(await isOutlineCrossed(page)).toBe(true);
      const status = page.locator('#perspectiveStatus');
      await expect(status).toBeVisible();
      await expect(status.locator('.status-text')).toHaveText(CROSSED_MESSAGE);
    });
}

// True when the photo shows the logo's green at a page point (CSS px).
async function isGreenOnScreen(page, point) {
  const [red, green, blue] = await colorOnPage(page, point);
  return green >= ON_SCREEN_GREEN_MIN
    && green - red >= ON_SCREEN_GREEN_LEAD
    && green - blue >= ON_SCREEN_GREEN_LEAD;
}

// From Export with no logo: taps Overlay, Add logo, chooses the fixture green-logo.png, taps
// the top-left ring and goes back to Export, recording each row's verdict in turn (the rows
// CNR-02.3 and CNR-12.4 share). The top-left ring's row also checks that the logo now covers
// part of the top-left corner shot, so it would show there if the shots drew it.
async function addGreenLogoTopLeft(page, hand, check) {
  await tapStepAndCheck(page, hand, check, 'overlay', 'the Overlay step shows, with Add logo',
    async () => {
      await expect(page.locator('#btnOverlayAdd')).toBeVisible();
    });
  const chooser = await openPicker(page, hand, page.locator('#btnOverlayAdd'));
  await check('the file picker opens', async () => {
    expect(chooser.page()).toBe(page);
  });
  await chooseFixtureLogo(page, chooser, GREEN_LOGO);
  await check('a green square shows in the middle of the photo', async () => {
    const placed = await logoPlacement(page);
    expect(Math.abs(placed.cx - 0.5)).toBeLessThan(MIDDLE_TOLERANCE);
    expect(Math.abs(placed.cy - 0.5)).toBeLessThan(MIDDLE_TOLERANCE);
    expect(await isGreenOnScreen(page, (await logoOnPage(page)).middle)).toBe(true);
  });
  await tapAt(page, hand, await ringOnPage(page, 'tl'));
  await check('the green square moves to the photo\'s top-left corner, over the card\'s '
    + 'top-left corner', async () => {
    await expect.poll(async () => (await logoPlacement(page)).cx).toBeLessThan(TOP_LEFT_MAX);
    expect((await logoPlacement(page)).cy).toBeLessThan(TOP_LEFT_MAX);
    expect(await logoCoverOfShot(page, 'tl')).toBeGreaterThan(LOGO_COVER_MIN);
  });
  await tapStepAndCheck(page, hand, check, 'export',
    'the Export step shows, the green square still at the top left of the photo', async () => {
      expect((await logoPlacement(page)).cx).toBeLessThan(TOP_LEFT_MAX);
      expect(await isGreenOnScreen(page, (await logoOnPage(page)).middle)).toBe(true);
    });
}

// Goes to Levels and records the verdict that its controls show, with Auto among the tools
// (`then` checks anything more the row says).
function goToLevelsAndCheck(page, hand, check, description, then = async () => {}) {
  return tapStepAndCheck(page, hand, check, 'levels', description, async () => {
    await expect(page.locator('#toolAutoLevels')).toBeVisible();
    await then();
  });
}

// Taps Auto on Levels and records the verdict that Apply is no longer greyed out.
async function tapAutoAndCheck(page, hand, check) {
  await hand.tap(page.locator('#toolAutoLevels'));
  await check('Apply is no longer greyed out', async () => {
    await expect(page.locator('#btnApplyLevels')).toBeEnabled();
  });
}

// Taps Apply on Levels and records the verdict that Apply and Discard are greyed out.
async function tapApplyAndCheck(page, hand, check) {
  await hand.tap(page.locator('#btnApplyLevels'));
  await check('Apply and Discard are greyed out', async () => {
    await expect(page.locator('#btnApplyLevels')).toBeDisabled();
    await expect(page.locator('#btnDiscardLevels')).toBeDisabled();
  });
}

test('CNR-01.1 On a phone, the Corner shots sheet opens and closes like any other sheet [phone]',
  async ({ page, check }, testInfo) => {
    const hand = await startOnExport(page, testInfo);
    await openSheetAndCheck(page, hand, check, 'a sheet titled CORNER SHOTS rises; its last '
      + `line reads "${CORNER_HINT}"`, async () => {
      await expect(page.locator('#cornerShotsSheetTitle')).toHaveText('Corner shots');
      await expect(page.locator('#cornerShotsSheet .sheet-hint')).toHaveText(CORNER_HINT);
      await expect(page.locator('#cornerShotsSheet .sheet-hint')).toBeVisible();
    });
    await closeSheetAndCheck(page, hand, check);
    await openSheetAndCheck(page, hand, check, 'the sheet rises again');
    const grabber = page.locator('#cornerShotsSheet .sheet-grabber');
    const start = await middleOf(grabber);
    await hand.drag(start, { x: start.x, y: start.y + CLOSE_DRAG_PX },
      '#cornerShotsSheet .sheet-grabber');
    await waitForCornerSheet(page, false);
    await check('the sheet goes down', async () => {
      expect(await isCornerSheetOpen(page)).toBe(false);
    });
  });

test('CNR-01.2 On a wide screen, Corner shots is a section of the panel, always open [desktop]',
  async ({ page, check }, testInfo) => {
    const hand = await startOnExport(page, testInfo);
    const section = page.locator('#cornerShotsSheet');
    const placeBefore = await section.boundingBox();
    await check('a section titled CORNER SHOTS shows four close-ups, 4 photos and 1 sheet, a size '
      + 'line and Download corners, with no × to close it', async () => {
      await expect(page.locator('#cornerShotsSheetTitle')).toBeVisible();
      await expect(page.locator('#cornerShotsSheet canvas[data-corner]:visible')).toHaveCount(4);
      await expect(page.locator('#cornerOutput')).toBeVisible();
      expect(await cornerReadout(page)).toBe(SHEET_LINE);
      await expect(downloadCorners(page)).toBeVisible();
      await expect(page.locator('#cornerShotsSheet .sheet-close')).toBeHidden();
    });
    await hand.tap(cornerShotsButton(page));
    await check('the section is still shown, in the same place, and nothing rises over the photo',
      async () => {
        await expect(page.locator('#cornerShotsSheetTitle')).toBeVisible();
        const placeAfter = await section.boundingBox();
        const panel = await page.locator('#panel').boundingBox();
        expect(placeAfter.y).toBeCloseTo(placeBefore.y, 0);
        expect(placeAfter.x).toBeGreaterThanOrEqual(panel.x);
      });
  });

test('CNR-02.1 The thumbnails show each corner, with the applied levels [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnExport(page, testInfo);
  await openCornerSheet(page, hand);
  await waitForThumbnails(page);
  await check.eye('four square close-ups in a row, left to right: the card\'s top-left, '
    + 'top-right, bottom-left and bottom-right corners; in each the dark mat shows along the two '
    + 'outer sides, and the card\'s corner sits about a third of the way in from them');
  await closeSheetAndCheck(page, hand, check);
  await goToLevelsAndCheck(page, hand, check, 'the Levels step shows, with Auto among its tools');
  await tapAutoAndCheck(page, hand, check);
  await tapApplyAndCheck(page, hand, check);
  await tapStepAndCheck(page, hand, check, 'export', 'the Export step shows');
  await openCornerSheet(page, hand);
  await waitForThumbnails(page);
  await check.eye('the four close-ups show the same corners with the brighter, higher-contrast '
    + 'look Auto gave the photo');
});

test('CNR-02.2 While the corners are invalid, the thumbnails show only the background [phone]',
  async ({ page, check }, testInfo) => {
    const hand = await startOnExport(page, testInfo, { step: 'perspective' });
    await crossAndCheck(page, hand, check);
    await tapStepAndCheck(page, hand, check, 'export', 'the Export step shows');
    await openCornerSheet(page, hand);
    await waitForThumbnails(page);
    await check('each of the four close-ups is plain white, the fill, with no part of the photo',
      async () => {
        expect(await isCornerSheetOpen(page)).toBe(true);
        expect(await thumbnailsArePlain(page, WHITE_RGB)).toEqual([true, true, true, true]);
      });
    await closeSheetAndCheck(page, hand, check);
    await openOptions(page, hand, 'export');
    await check('Export options rise; the Fill outside photo row reads White', async () => {
      await expect(page.locator('#exportSheetTitle')).toBeVisible();
      await expect(page.locator('#fillValue')).toHaveText('White');
    });
    await page.locator('#fill').selectOption('transparent');
    await check('the Fill outside photo row reads Transparent', async () => {
      await expect(page.locator('#fillValue')).toHaveText('Transparent');
    });
    await closeOptions(page, hand, 'export');
    await check('the options go down', async () => {
      await expect(page.locator('#exportSheet')).toBeHidden();
    });
    await openCornerSheet(page, hand);
    await waitForThumbnails(page);
    await check('each close-up is plain dark gray (#2b2b2b), the app\'s background', async () => {
      expect(await thumbnailsArePlain(page, STAGE_RGB)).toEqual([true, true, true, true]);
    });
  });

test('CNR-02.3 The thumbnails never show the logo [phone]', async ({ page, check }, testInfo) => {
  const hand = await startOnExport(page, testInfo);
  await openCornerSheet(page, hand);
  await waitForThumbnails(page);
  const before = await thumbnailDigests(page);
  await check('four close-ups of the card\'s corners', async () => {
    expect(await isCornerSheetOpen(page)).toBe(true);
    expect(before).toHaveLength(4);
  });
  await closeSheetAndCheck(page, hand, check);
  await addGreenLogoTopLeft(page, hand, check);
  await openCornerSheet(page, hand);
  await waitForThumbnails(page);
  const after = await thumbnailDigests(page);
  await check('the four close-ups are the same as in row 1: there is no green square in the '
    + 'top-left one', async () => {
    expect(after).toEqual(before);
  });
});

test('CNR-03.1 1 sheet is the first choice, and 4 photos is remembered after a reload '
  + '[phone] [webkit]', async ({ page, check }, testInfo) => {
  const hand = await startOnExport(page, testInfo);
  await openSheetAndCheck(page, hand, check, '1 sheet is selected (white), and the corner size '
    + 'line begins "Sheet"', async () => {
    expect(await selectedChoices(page, 'cornerOutput')).toEqual(['1 sheet']);
    expect(await hasWhiteFill(choiceButton(page, 'cornerOutput', '1 sheet'))).toBe(true);
    expect(await cornerReadout(page)).toMatch(/^Sheet /);
  });
  await chooseCornerOutput(page, hand, '4 photos');
  await check('4 photos is selected, and the corner size line begins "4 photos"', async () => {
    expect(await selectedChoices(page, 'cornerOutput')).toEqual(['4 photos']);
    expect(await cornerReadout(page)).toMatch(/^4 photos /);
  });
  // The person's two seconds: the edits are kept on the device a moment after the last change.
  await waitForSaved(page, { name: CORNER_PHOTO, tab: 'export' });
  await reloadToStart(page);
  await check(`the start screen asks "Resume ${CORNER_PHOTO}?", with Resume and Start fresh`,
    async () => {
      await expect(page.locator('#resumeName')).toHaveText(CORNER_PHOTO);
      await expect(page.locator('#btnResume')).toBeVisible();
      await expect(page.locator('#btnFresh')).toBeVisible();
    });
  await hand.tap(page.locator('#btnFresh'));
  await check('the question goes; Open photo shows and no photo is open', async () => {
    await expect(page.locator('#btnResume')).toBeHidden();
    await expect(page.locator('#btnOpenEmpty')).toBeVisible();
    expect(await page.evaluate(() => !!window.__straightener.app.img)).toBe(false);
  });
  const chooser = await openPicker(page, hand, page.locator('#btnOpenEmpty'));
  await check('the file picker opens', async () => {
    expect(chooser.page()).toBe(page);
  });
  await rememberPhoto(page);
  await chooser.setFiles(samplePath(CORNER_PHOTO));
  await waitForPhoto(page, CORNER_PHOTO);
  await check('the photo opens on the Perspective step', async () => {
    expect(await stepNow(page)).toBe('perspective');
  });
  await tapStepAndCheck(page, hand, check, 'export', 'the Export step shows');
  await openCornerSheet(page, hand);
  await check('4 photos is still selected', async () => {
    expect(await selectedChoices(page, 'cornerOutput')).toEqual(['4 photos']);
  });
});

test('CNR-03.2 Changing the choice drops the files waiting for Share now [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnExport(page, testInfo, {
    address: NO_CORNER_QUESTION,
    share: 'refuseOnce',
  });
  await openSheetAndCheck(page, hand, check, 'the Corner shots sheet rises, with 1 sheet selected',
    isSheetChosen(page));
  await shareCornersOnce(page, hand, 1);
  await check('the share is refused, and the red button now reads Share now', async () => {
    await expect(shareCornersLabel(page)).toHaveText('Share now');
    expect(await isRed(shareCorners(page))).toBe(true);
  });
  await chooseCornerOutput(page, hand, '4 photos');
  await check('the red button reads Share corners again', async () => {
    await expect(shareCornersLabel(page)).toHaveText('Share corners');
  });
  await shareCornersOnce(page, hand, 2);
  await check('the share sheet is handed four photos, -tl, -tr, -br and -bl, not the sheet',
    async () => {
      const shares = await sharesSoFar(page);
      const names = shares[1].files.map(file => file.name);
      expect(names).toEqual(SHOT_LABELS.map(label => shotName(label)));
    });
});

test('CNR-04.1 The size line gives the sheet\'s or each photo\'s size, and the format [phone]',
  async ({ page, check }, testInfo) => {
    const hand = await startOnExport(page, testInfo);
    await openSheetAndCheck(page, hand, check, `the corner size line reads "${SHEET_LINE}"`,
      async () => {
        expect(await cornerReadout(page)).toBe(SHEET_LINE);
      });
    await chooseCornerOutput(page, hand, '4 photos');
    await check(`it reads "${PHOTOS_LINE}"`, async () => {
      expect(await cornerReadout(page)).toBe(PHOTOS_LINE);
    });
    await closeSheetAndCheck(page, hand, check);
    await tapFormatAndCheck(page, hand, check, 'PNG');
    await openCornerSheet(page, hand);
    await check(`the corner size line reads "${PHOTOS_PNG_LINE}"`, async () => {
      expect(await cornerReadout(page)).toBe(PHOTOS_PNG_LINE);
    });
  });

test('CNR-04.2 While the corners are invalid, the size line is empty [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnExport(page, testInfo, { step: 'perspective' });
  await crossAndCheck(page, hand, check);
  await tapStepAndCheck(page, hand, check, 'export', 'the Export step shows');
  await openCornerSheet(page, hand);
  await check('the corner size line is empty', async () => {
    expect(await isCornerSheetOpen(page)).toBe(true);
    expect(await cornerReadout(page)).toBe('');
  });
});

test('CNR-04.3 When the corner shots can\'t be made, the line gives the real reason [phone]',
  async ({ page, check }, testInfo) => {
    test.fail(true, 'BUG-120');
    const hand = await startOnExport(page, testInfo);
    await makeCornerShotsImpossible(page, NOT_INVERTIBLE_REASON);
    await openCornerSheet(page, hand);
    // A plain comparison, not a retrying expect: the known defect fails at once.
    const sheetLine = await cornerReadout(page);
    await check(`the corner size line reads "Sheet${FIX_CORNERS_ENDING}"`, async () => {
      expect(sheetLine).toBe(`Sheet${FIX_CORNERS_ENDING}`);
    });
    await chooseCornerOutput(page, hand, '4 photos');
    const photosLine = await cornerReadout(page);
    await check(`it reads "4 photos${FIX_CORNERS_ENDING}"`, async () => {
      expect(photosLine).toBe(`4 photos${FIX_CORNERS_ENDING}`);
    });
  });

test('CNR-05.2 Share corners hands the share sheet the corner sheet [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnExport(page, testInfo, { address: NO_CORNER_QUESTION });
  await openSheetAndCheck(page, hand, check, 'Share corners shows in red, and Download corners '
    + 'beside it is not red', async () => {
    await expect(shareCorners(page)).toBeVisible();
    expect(await isRed(shareCorners(page))).toBe(true);
    expect(await isRed(downloadCorners(page))).toBe(false);
  });
  await shareCornersOnce(page, hand, 1);
  await check(`the share sheet is handed one JPEG file, ${SHEET_NAME}; a message begins "Saved `
    + 'the corner sheet in"', async () => {
    const [share] = await sharesSoFar(page);
    expect(share.files.map(file => [file.name, file.type])).toEqual([[SHEET_NAME, 'image/jpeg']]);
    await expect.poll(() => toastMessage(page)).toMatch(/^Saved the corner sheet in /);
  });
});

test('CNR-05.3 Where the browser can\'t share files, Share corners is hidden [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnExport(page, testInfo, { share: 'none' });
  await openCornerSheet(page, hand);
  await check('there is no Share corners; Download corners shows', async () => {
    await expect(shareCorners(page)).toBeHidden();
    await expect(downloadCorners(page)).toBeVisible();
  });
});

test('CNR-05.4 Share corners appears once the browser can share, as Share does [phone]', async ({
  page,
  check,
}, testInfo) => {
  test.fail(true, 'BUG-121');
  await installSwitchableShare(page);
  const hand = await startOnExport(page, testInfo, { share: null });
  await openCornerSheet(page, hand);
  await check('there is no Share corners', async () => {
    await expect(shareCorners(page)).toBeHidden();
  });
  await closeSheetAndCheck(page, hand, check);
  // The stand-in browser can share from here on (the case's "now that the browser can share").
  await page.evaluate(() => {
    window.testCanShare = true;
  });
  await tapFormat(page, hand, 'PNG');
  await check('Share shows on Export', async () => {
    await expect(page.locator('#btnShare')).toBeVisible();
  });
  await openCornerSheet(page, hand);
  // A plain reading, not a retrying expect: the known defect fails at once.
  const isShareShown = await shareCorners(page).isVisible();
  await check('Share corners shows too', async () => {
    expect(isShareShown).toBe(true);
  });
});

test('CNR-06.1 Download corners saves the corner sheet as a plain download [phone] [webkit]',
  async ({ page, check }, testInfo) => {
    const hand = await startOnExport(page, testInfo, { address: NO_CORNER_QUESTION });
    await openSheetAndCheck(page, hand, check, 'Download corners shows', async () => {
      await expect(downloadCorners(page)).toBeVisible();
    });
    const saved = await saveCorners(page, hand);
    await check(`one file is saved, a JPEG of ${SHEET_PX} × ${SHEET_PX} px; a message begins `
      + '"Saved the corner sheet in"', async () => {
      expect(saved).toHaveLength(1);
      expect([...fs.readFileSync(saved[0].file).subarray(0, 3)]).toEqual([0xff, 0xd8, 0xff]);
      expect(await imageSize(page, saved[0].file)).toEqual([SHEET_PX, SHEET_PX]);
      await expect.poll(() => toastMessage(page)).toMatch(/^Saved the corner sheet in /);
    });
  });

test('CNR-06.2 Without Share corners, Download corners is the red one [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnExport(page, testInfo, { share: 'none' });
  await openCornerSheet(page, hand);
  await check('Download corners is red and runs the whole width of the sheet', async () => {
    expect(await isRed(downloadCorners(page))).toBe(true);
    const button = await downloadCorners(page).boundingBox();
    const row = await page.locator('#cornerSaveRow').boundingBox();
    expect(button.width).toBeGreaterThan(row.width - 2);
  });
});

test('CNR-07.1 Share now shares the files already made, without asking again [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnExport(page, testInfo, { share: 'refuseOnce' });
  await openSheetAndCheck(page, hand, check, 'the Corner shots sheet rises, with 1 sheet selected',
    isSheetChosen(page));
  await hand.tap(shareCorners(page));
  await check(`the question box asks "${UPSCALE_QUESTION}": the sheet is ${SHEET_PX} px`,
    async () => {
      await expectQuestion(page, UPSCALE_QUESTION);
    });
  await hand.tap(questionButton(page, 'No'));
  await waitForShares(page, 1);
  await waitForExportEnd(page);
  await check('the share is refused; the red button reads Share now', async () => {
    await expect(shareCornersLabel(page)).toHaveText('Share now');
  });
  await hand.tap(shareCorners(page));
  await waitForShares(page, 2);
  await check(`no question is asked; the share sheet is handed the same file, ${SHEET_NAME}, and `
    + 'the button reads Share corners again', async () => {
    expect(await isQuestionUp(page)).toBe(false);
    const isSameFiles = await page.evaluate(() => window.testSharedFiles[0][0]
      === window.testSharedFiles[1][0]);
    expect(isSameFiles).toBe(true);
    expect((await sharesSoFar(page))[1].files.map(file => file.name)).toEqual([SHEET_NAME]);
    await expect(shareCornersLabel(page)).toHaveText('Share corners');
  });
});

test('CNR-07.2 Share now stays live while an export runs [desktop]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnExport(page, testInfo, {
    address: NO_CORNER_QUESTION,
    share: 'refuseOnce',
    isWatched: true,
  });
  await shareCornersOnce(page, hand, 1);
  await check('the share is refused; the button reads Share now', async () => {
    await expect(shareCornersLabel(page)).toHaveText('Share now');
  });
  const exported = await downloadAnswering(page, hand, 'No');
  await check(`the question box asks "${UPSCALE_QUESTION}": the crop is 1074 px`, async () => {
    expect(exported.question).toBe(UPSCALE_QUESTION);
  });
  await check('while the thin red line runs, Share now stays live and Download corners is '
    + 'greyed out', async () => {
    const starts = await exportStarts(page);
    const exportStart = starts[starts.length - 1];
    expect(exportStart.controls.btnCornerShare).toMatchObject({
      disabled: false,
      label: 'Share now',
    });
    expect(exportStart.controls.btnCornerDownload.disabled).toBe(true);
  });
});

test('CNR-07.3 An edit drops a waiting Share now [phone]', async ({ page, check }, testInfo) => {
  const hand = await startOnExport(page, testInfo, {
    address: NO_CORNER_QUESTION,
    share: 'refuseOnce',
  });
  await openSheetAndCheck(page, hand, check, 'the Corner shots sheet rises');
  await shareCornersOnce(page, hand, 1);
  await check('the share is refused; the red button reads Share now', async () => {
    await expect(shareCornersLabel(page)).toHaveText('Share now');
  });
  await closeSheetAndCheck(page, hand, check);
  await tapFormatAndCheck(page, hand, check, 'PNG');
  await openCornerSheet(page, hand);
  await check('the red button reads Share corners', async () => {
    await expect(shareCornersLabel(page)).toHaveText('Share corners');
    expect(await isRed(shareCorners(page))).toBe(true);
  });
});

test('CNR-07.4 A corner-shots Share now doesn\'t hide Next card [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnExport(page, testInfo, {
    address: NO_CORNER_QUESTION,
    share: 'refuseOnce',
  });
  const exported = await downloadAnswering(page, hand, 'No');
  await check(`the question box asks "${UPSCALE_QUESTION}": the crop is 1074 px`, async () => {
    expect(exported.question).toBe(UPSCALE_QUESTION);
  });
  await check('a file is saved, and Next card shows in white', async () => {
    expect(exported.bytes).toBeGreaterThan(0);
    await expect(nextCard(page)).toBeVisible();
    expect(await hasWhiteFill(nextCard(page))).toBe(true);
  });
  await openSheetAndCheck(page, hand, check, 'the Corner shots sheet rises');
  await shareCornersOnce(page, hand, 1);
  await check('the share is refused; the red button reads Share now', async () => {
    await expect(shareCornersLabel(page)).toHaveText('Share now');
  });
  await closeCornerSheet(page, hand);
  await check('Next card still shows', async () => {
    await expect(nextCard(page)).toBeVisible();
  });
});

test('CNR-08.1 Invalid corners dim Share corners and Download corners [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnExport(page, testInfo, { step: 'perspective' });
  await crossAndCheck(page, hand, check);
  await tapStepAndCheck(page, hand, check, 'export', 'the Export step shows');
  await openCornerSheet(page, hand);
  await check('Share corners and Download corners are greyed out', async () => {
    await expect(shareCorners(page)).toBeDisabled();
    await expect(downloadCorners(page)).toBeDisabled();
  });
  const collector = collectDownloads(page);
  await tapRegardless(hand, downloadCorners(page));
  const count = await downloadsAfterWait(page, collector, NOTHING_SAVED_WAIT_MS);
  collector.stop();
  await check('nothing is saved', async () => {
    expect(count).toBe(0);
  });
});

test('CNR-08.2 For a card too small for corner shots, both buttons are dimmed [phone]', async ({
  page,
  check,
}, testInfo) => {
  test.fail(true, 'BUG-120');
  const hand = await startOnExport(page, testInfo);
  await makeCornerShotsImpossible(page, TOO_SMALL_REASON);
  await openCornerSheet(page, hand);
  // Plain readings, not retrying expects: the known defect fails at once.
  const seen = {
    line: await cornerReadout(page),
    isShareDimmed: await shareCorners(page).isDisabled(),
    isDownloadDimmed: await downloadCorners(page).isDisabled(),
  };
  await check(`the corner size line reads "Sheet${TOO_SMALL_ENDING}", and Share corners and `
    + 'Download corners are greyed out', async () => {
    expect(seen).toEqual({
      line: `Sheet${TOO_SMALL_ENDING}`,
      isShareDimmed: true,
      isDownloadDimmed: true,
    });
  });
});

test('CNR-08.3 While the corner shots are saved, both buttons are dimmed [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnExport(page, testInfo, {
    address: NO_CORNER_QUESTION,
    isWatched: true,
  });
  await openSheetAndCheck(page, hand, check, 'the Corner shots sheet rises');
  await saveCorners(page, hand);
  await check('while the thin red line runs on the sheet\'s top edge, Share corners and Download '
    + 'corners are greyed out', async () => {
    const [start] = await exportStarts(page);
    expect(start.controls.btnCornerShare.disabled).toBe(true);
    expect(start.controls.btnCornerDownload.disabled).toBe(true);
  });
  await waitForExportEnd(page);
  await check('both buttons are live again', async () => {
    await expect(shareCorners(page)).toBeEnabled();
    await expect(downloadCorners(page)).toBeEnabled();
  });
});

test('CNR-08.4 While a pair\'s other side opens, both buttons are dimmed [phone]', async ({
  page,
  check,
}, testInfo) => {
  await installShareStandIn(page);
  const hand = await makePair(page, testInfo, PORTRAIT_PAIR);
  await goToStep(page, 'export', hand);
  await holdNextOpening(page);
  await hand.tap(sideButton(page, 'front'));
  await waitForOpening(page);
  await check('a message reads "Opening the front…"', async () => {
    await expect(shownToast(page)).toHaveText('Opening the front…');
  });
  await openCornerSheet(page, hand);
  await check('the Corner shots sheet rises while the front is still opening; Share corners and '
    + 'Download corners are greyed out', async () => {
    expect(await isCornerSheetOpen(page)).toBe(true);
    expect(await page.evaluate(() => window.__straightener.app.isSwitching)).toBe(true);
    await expect(shareCorners(page)).toBeDisabled();
    await expect(downloadCorners(page)).toBeDisabled();
  });
  await releaseOpening(page);
  await page.waitForFunction(() => {
    const app = window.__straightener.app;
    return !app.isSwitching && app.pair.current === 'front';
  });
  await check('both buttons are live', async () => {
    await expect(shareCorners(page)).toBeEnabled();
    await expect(downloadCorners(page)).toBeEnabled();
  });
});

// The four photos as saved, by corner label: { tl: { name, file }, … }.
function byLabel(saved) {
  return Object.fromEntries(saved.map(file => [file.name.match(/-corner-(\w+)\./)[1], file]));
}

// Where the card's corner is in each of the four photos, as fractions of the side in from the
// shot's two outer edges: { tl: { across, down }, … }.
async function insetsOf(page, shots) {
  const insets = {};
  for (const label of SHOT_LABELS) {
    const corner = await cardCornerInShot(page, shots[label].file, label);
    insets[label] = {
      across: label.endsWith('l') ? corner.across : 1 - corner.across,
      down: label.startsWith('t') ? corner.down : 1 - corner.down,
    };
  }
  return insets;
}

test('CNR-09.1 Each shot is a quarter of the card\'s width, with the card\'s corner 30% in '
  + '[phone] [webkit]', async ({ page, check }, testInfo) => {
  const hand = await startOnExport(page, testInfo, { address: NO_CORNER_QUESTION });
  await hand.tap(choiceButton(page, 'exportSize', 'Original'));
  await check('Original is selected', async () => {
    expect(await selectedChoices(page, 'exportSize')).toEqual(['Original']);
  });
  const original = await downloadAnswering(page, hand);
  await check(`a file of ${ORIGINAL_CROP_PX} × ${ORIGINAL_CROP_PX} px is saved, with no question `
    + 'first', async () => {
    expect(original.question).toBe('');
    expect(await imageSize(page, original.file)).toEqual([ORIGINAL_CROP_PX, ORIGINAL_CROP_PX]);
  });
  const cardWidthPx = await cardWidthInExport(page, original.file);
  await check(`on the row 30% of the way down, the card is about ${CARD_WIDTH_PX} px wide `
    + `(within ${CARD_WIDTH_TOLERANCE_PX} px)`, async () => {
    expect(Math.abs(cardWidthPx - CARD_WIDTH_PX)).toBeLessThan(CARD_WIDTH_TOLERANCE_PX);
  });
  await openSheetAndCheck(page, hand, check, 'the Corner shots sheet rises');
  await chooseCornerOutput(page, hand, '4 photos');
  await check(`the corner size line reads "${PHOTOS_LINE}": a quarter of the card's width, `
    + 'within 10%', async () => {
    expect(await cornerReadout(page)).toBe(PHOTOS_LINE);
    expect(Math.abs(SHOT_PX / cardWidthPx - SHOT_FRACTION))
      .toBeLessThan(SHOT_FRACTION * SHOT_FRACTION_TOLERANCE);
  });
  const shots = byLabel(await saveCorners(page, hand, 4));
  const sizes = [];
  for (const label of SHOT_LABELS) sizes.push(await imageSize(page, shots[label].file));
  await check(`four square files of ${SHOT_PX} × ${SHOT_PX} px are saved`, async () => {
    expect(sizes).toEqual(SHOT_LABELS.map(() => [SHOT_PX, SHOT_PX]));
  });
  const insets = await insetsOf(page, shots);
  await check('in each shot the card\'s corner is 30% of the side in from its two outer edges '
    + '(47 px, within 5 px)', async () => {
    for (const label of SHOT_LABELS) {
      expect(Math.abs(insets[label].across - CORNER_INSET), label).toBeLessThan(INSET_TOLERANCE);
      expect(Math.abs(insets[label].down - CORNER_INSET), label).toBeLessThan(INSET_TOLERANCE);
    }
  });
});

test('CNR-09.2 A link can cap the shots\' size [phone]', async ({ page, check }, testInfo) => {
  const hand = await startOnExport(page, testInfo, {
    address: 'index.html?cornerShots.maxPx=100&cornerShots.upscaleTargetPx=0',
  });
  await openSheetAndCheck(page, hand, check, 'the Corner shots sheet rises, with 1 sheet selected',
    isSheetChosen(page));
  await chooseCornerOutput(page, hand, '4 photos');
  await check('the corner size line reads "4 photos · 100 × 100 px · JPEG"', async () => {
    expect(await cornerReadout(page)).toBe('4 photos · 100 × 100 px · JPEG');
  });
  const saved = await saveCorners(page, hand, 4);
  const sizes = [];
  for (const file of saved) sizes.push(await imageSize(page, file.file));
  await check('four files of 100 × 100 px are saved', async () => {
    expect(sizes).toEqual([[100, 100], [100, 100], [100, 100], [100, 100]]);
  });
});

// The rectangles of a MATCH_GRID × MATCH_GRID grid over a square of side sizePx whose top-left
// is at (x, y), in px.
function gridRects(x, y, sizePx) {
  const cellPx = sizePx / MATCH_GRID;
  const rects = [];
  for (let row = 0; row < MATCH_GRID; row++) {
    for (let column = 0; column < MATCH_GRID; column++) {
      rects.push({
        x: Math.round(x + column * cellPx),
        y: Math.round(y + row * cellPx),
        width: Math.floor(cellPx),
        height: Math.floor(cellPx),
      });
    }
  }
  return rects;
}

// The mean difference (0 to 255) between two lists of [r, g, b] means.
function meanDifference(first, second) {
  let total = 0;
  first.forEach((cell, index) => {
    for (let channel = 0; channel < 3; channel++) {
      total += Math.abs(cell[channel] - second[index][channel]);
    }
  });
  return total / (first.length * 3);
}

// Where each tile sits in the sheet (px), by corner label: tl tr over bl br.
const TILE_PLACES = {
  tl: [0, 0],
  tr: [SHOT_PX + GAP_PX, 0],
  bl: [0, SHOT_PX + GAP_PX],
  br: [SHOT_PX + GAP_PX, SHOT_PX + GAP_PX],
};

// For each tile of the sheet, the photo (by label) it matches best, and how far off it is.
async function matchTilesToPhotos(page, sheetFile, photos) {
  const photoCells = {};
  for (const label of SHOT_LABELS) {
    photoCells[label] = (await regionMeans(page, photos[label].file, gridRects(0, 0, SHOT_PX)))
      .means;
  }
  const matches = {};
  for (const [tile, [x, y]] of Object.entries(TILE_PLACES)) {
    const tileCells = (await regionMeans(page, sheetFile, gridRects(x, y, SHOT_PX))).means;
    const ranked = SHOT_LABELS
      .map(label => ({ label, difference: meanDifference(tileCells, photoCells[label]) }))
      .sort((first, second) => first.difference - second.difference);
    matches[tile] = ranked[0];
  }
  return matches;
}

// The mean of a list of numbers.
const mean = values => values.reduce((sum, value) => sum + value, 0) / values.length;

// The mean luminance of the two pixel rows and two pixel columns between the sheet's tiles.
async function gapLinesOf(page, sheetFile) {
  const gapLines = [];
  for (const offsetPx of [0, 1]) {
    const lineAt = (SHOT_PX + offsetPx) / SHEET_PX;
    gapLines.push(mean(await luminanceProfile(page, sheetFile, 'column', lineAt, 1)));
    gapLines.push(mean(await luminanceProfile(page, sheetFile, 'row', lineAt, 1)));
  }
  return gapLines;
}

// The mean luminance of the sheet's four outer edges: top row, left column, bottom row, right
// column.
async function outerEdgesOf(page, sheetFile) {
  return [
    mean(await luminanceProfile(page, sheetFile, 'row', 0, 1)),
    mean(await luminanceProfile(page, sheetFile, 'column', 0, 1)),
    mean(await luminanceProfile(page, sheetFile, 'row', 1, 1)),
    mean(await luminanceProfile(page, sheetFile, 'column', 1, 1)),
  ];
}

test('CNR-10.1 The sheet holds the four shots in reading order, a 2 px white gap between them '
  + 'and no margin [phone] [webkit]', async ({ page, check }, testInfo) => {
  const hand = await startOnExport(page, testInfo, { address: NO_CORNER_QUESTION });
  await openSheetAndCheck(page, hand, check, 'the Corner shots sheet rises, with 1 sheet selected',
    isSheetChosen(page));
  const [sheet] = await saveCorners(page, hand);
  await check(`one file of ${SHEET_PX} × ${SHEET_PX} px is saved: two ${SHOT_PX} px tiles and a `
    + `${GAP_PX} px gap each way`, async () => {
    expect(await imageSize(page, sheet.file)).toEqual([SHEET_PX, SHEET_PX]);
  });
  await chooseOutputAndCheck(page, hand, check, '4 photos');
  const photos = byLabel(await saveCorners(page, hand, 4));
  const sizes = [];
  for (const label of SHOT_LABELS) sizes.push(await imageSize(page, photos[label].file));
  await check(`four files of ${SHOT_PX} × ${SHOT_PX} px are saved`, async () => {
    expect(Object.keys(photos).sort()).toEqual(['bl', 'br', 'tl', 'tr']);
    expect(sizes).toEqual(SHOT_LABELS.map(() => [SHOT_PX, SHOT_PX]));
  });
  const matches = await matchTilesToPhotos(page, sheet.file, photos);
  await check('the top-left tile is the -tl photo, the top-right tile -tr, the bottom-left tile '
    + '-bl and the bottom-right tile -br', async () => {
    for (const tile of Object.keys(TILE_PLACES)) {
      expect(matches[tile].label, tile).toBe(tile);
      expect(matches[tile].difference, tile).toBeLessThan(MATCH_TOLERANCE);
    }
  });
  const gapLines = await gapLinesOf(page, sheet.file);
  await check('the two pixel rows and columns between the tiles are white, the fill', async () => {
    expect(Math.min(...gapLines)).toBeGreaterThan(WHITE_LINE_MIN);
  });
  const edges = await outerEdgesOf(page, sheet.file);
  await check('the sheet\'s outer edges are the dark mat of the photo, with no white margin',
    async () => {
      expect(Math.max(...edges)).toBeLessThan(DARK_EDGE_MAX);
    });
});

test('CNR-11.1 One tap of Download corners saves four files, a quarter of a second apart '
  + '[phone] [webkit]', async ({ page, check }, testInfo) => {
  const hand = await startOnExport(page, testInfo, { address: NO_CORNER_QUESTION });
  await openSheetAndCheck(page, hand, check, 'the Corner shots sheet rises, with 1 sheet selected',
    isSheetChosen(page));
  await chooseOutputAndCheck(page, hand, check, '4 photos');
  await noteDownloadStarts(page);
  const saved = await saveCorners(page, hand, 4);
  const starts = await downloadStarts(page);
  const gaps = starts.slice(1).map((start, index) => start - starts[index]);
  await check('four files arrive, in the order top-left, top-right, bottom-right, bottom-left, '
    + `each at least ${DOWNLOAD_GAP_MIN_MS} ms after the one before; a message begins "Saved 4 `
    + 'corner shots in"', async () => {
    expect(saved.map(file => file.name)).toEqual(SHOT_LABELS.map(label => shotName(label)));
    expect(starts).toHaveLength(4);
    expect(Math.min(...gaps)).toBeGreaterThanOrEqual(DOWNLOAD_GAP_MIN_MS);
    await expect.poll(() => toastMessage(page)).toMatch(/^Saved 4 corner shots in /);
  });
});

test('CNR-11.2 Share corners puts all four photos in one share sheet [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnExport(page, testInfo, { address: NO_CORNER_QUESTION });
  await openSheetAndCheck(page, hand, check, 'the Corner shots sheet rises, with 1 sheet selected',
    isSheetChosen(page));
  await chooseOutputAndCheck(page, hand, check, '4 photos');
  await shareCornersOnce(page, hand, 1);
  await check('the share sheet is handed once, with four JPEG files: the -tl, -tr, -br and -bl '
    + 'shots', async () => {
    const shares = await sharesSoFar(page);
    expect(shares).toHaveLength(1);
    expect(shares[0].files.map(file => [file.name, file.type]))
      .toEqual(SHOT_LABELS.map(label => [shotName(label), 'image/jpeg']));
  });
});

test('CNR-12.1 The sheet is saved in the format chosen on Export [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnExport(page, testInfo, { address: NO_CORNER_QUESTION });
  await tapFormatAndCheck(page, hand, check, 'PNG');
  const [png] = await saveTheCorners(page, hand);
  await check(`a PNG file is saved, ${PHOTO_BASE}-corners.png, of ${SHEET_PX} × ${SHEET_PX} px`,
    async () => {
      expect(png.name).toBe(`${PHOTO_BASE}-corners.png`);
      expect([...fs.readFileSync(png.file).subarray(1, 4)]).toEqual([0x50, 0x4e, 0x47]);
      expect(await imageSize(page, png.file)).toEqual([SHEET_PX, SHEET_PX]);
    });
  await tapFormatAndCheck(page, hand, check, 'WebP');
  const [webp] = await saveTheCorners(page, hand);
  await check(`a WebP file is saved, ${PHOTO_BASE}-corners.webp`, async () => {
    expect(webp.name).toBe(`${PHOTO_BASE}-corners.webp`);
    expect(fs.readFileSync(webp.file).subarray(8, 12).toString('latin1')).toBe('WEBP');
  });
});

// Taps the options tab on Export and records the verdict that Export options rise with the
// Quality row reading `quality`.
async function openQualityAndCheck(page, hand, check, quality) {
  await openOptions(page, hand, 'export');
  await check(`Export options rise; the Quality row reads ${quality}`, async () => {
    await expect(page.locator('#exportSheetTitle')).toBeVisible();
    await expect(page.locator('#qualityValue')).toHaveText(quality);
  });
}

// Drags the Quality knob to one end and records the verdict that the row reads `quality`.
async function dragQualityAndCheck(page, hand, check, end, quality) {
  await dragQualityTo(page, hand, end);
  await check(`the Quality row reads ${quality}`, async () => {
    await expect(page.locator('#qualityValue')).toHaveText(quality);
  });
}

// Taps the × of Export options and records the verdict that they go down.
async function closeQualityAndCheck(page, hand, check) {
  await closeOptions(page, hand, 'export');
  await check('the options go down', async () => {
    await expect(page.locator('#exportSheet')).toBeHidden();
  });
}

test('CNR-12.2 A lower Quality gives a smaller sheet [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnExport(page, testInfo, { address: NO_CORNER_QUESTION });
  await openQualityAndCheck(page, hand, check, QUALITY_START);
  await dragQualityAndCheck(page, hand, check, 'high', QUALITY_HIGH);
  await closeQualityAndCheck(page, hand, check);
  const [high] = await saveTheCorners(page, hand);
  await check('a JPEG sheet is saved', async () => {
    expect(high.name).toBe(SHEET_NAME);
    expect([...fs.readFileSync(high.file).subarray(0, 3)]).toEqual([0xff, 0xd8, 0xff]);
  });
  await openQualityAndCheck(page, hand, check, QUALITY_HIGH);
  await dragQualityAndCheck(page, hand, check, 'low', QUALITY_LOW);
  await closeQualityAndCheck(page, hand, check);
  const [low] = await saveTheCorners(page, hand);
  await check('a second JPEG sheet is saved, of the same size in px as the first and a smaller '
    + 'file', async () => {
    expect(low.name).toBe(SHEET_NAME);
    expect(await imageSize(page, low.file)).toEqual(await imageSize(page, high.file));
    expect(fs.statSync(low.file).size).toBeLessThan(fs.statSync(high.file).size);
  });
});

test('CNR-12.3 Applied levels are in the shots, unapplied ones are not [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnExport(page, testInfo, { address: NO_CORNER_QUESTION });
  const [sheetA] = await saveTheCorners(page, hand);
  await check('sheet A is saved', async () => {
    expect(sheetA.name).toBe(SHEET_NAME);
  });
  await goToLevelsAndCheck(page, hand, check, 'the Levels step shows, with Auto among its tools');
  await tapAutoAndCheck(page, hand, check);
  await tapStepAndCheck(page, hand, check, 'export', 'the Export step shows');
  const [sheetB] = await saveTheCorners(page, hand);
  await check('sheet B is saved, byte for byte the same as sheet A: the levels not yet applied '
    + 'are not in it', async () => {
    expect(isSameFile(sheetB.file, sheetA.file)).toBe(true);
  });
  await goToLevelsAndCheck(page, hand, check, 'the Levels step shows, Apply still live',
    async () => {
      await expect(page.locator('#btnApplyLevels')).toBeEnabled();
    });
  await tapApplyAndCheck(page, hand, check);
  await tapStepAndCheck(page, hand, check, 'export', 'the Export step shows');
  const [sheetC] = await saveTheCorners(page, hand);
  await check('sheet C is saved, and it differs from sheet A', async () => {
    expect(isSameFile(sheetC.file, sheetA.file)).toBe(false);
  });
});

test('CNR-12.4 The logo is never in the shots [phone]', async ({ page, check }, testInfo) => {
  const hand = await startOnExport(page, testInfo, { address: NO_CORNER_QUESTION });
  const [sheetA] = await saveTheCorners(page, hand);
  await check('sheet A is saved', async () => {
    expect(sheetA.name).toBe(SHEET_NAME);
  });
  await addGreenLogoTopLeft(page, hand, check);
  const [sheetB] = await saveTheCorners(page, hand);
  await check('sheet B is saved, byte for byte the same as sheet A: the logo is not in its '
    + 'top-left tile', async () => {
    expect(isSameFile(sheetB.file, sheetA.file)).toBe(true);
  });
});

test('CNR-13.1 The sheet and the photos are named for the photo and their corner '
  + '[phone] [webkit]', async ({ page, check }, testInfo) => {
  const hand = await startOnExport(page, testInfo, { address: NO_CORNER_QUESTION });
  await openSheetAndCheck(page, hand, check, 'the Corner shots sheet rises, with 1 sheet selected',
    isSheetChosen(page));
  const [sheet] = await saveCorners(page, hand);
  await check(`a file named ${SHEET_NAME} is saved`, async () => {
    expect(sheet.name).toBe(SHEET_NAME);
  });
  await chooseOutputAndCheck(page, hand, check, '4 photos');
  const photos = await saveCorners(page, hand, 4);
  await check('four files are saved: -corner-tl.jpg, -corner-tr.jpg, -corner-br.jpg and '
    + '-corner-bl.jpg', async () => {
    expect(photos.map(file => file.name).sort())
      .toEqual(SHOT_LABELS.map(label => shotName(label)).sort());
  });
});

test('CNR-14.1 The line runs once from start to end over the four photos [phone]', async ({
  page,
  check,
}, testInfo) => {
  await recordCornerProgress(page);
  const hand = await startOnExport(page, testInfo, { address: NO_CORNER_QUESTION });
  await openSheetAndCheck(page, hand, check, 'the Corner shots sheet rises, with 1 sheet selected',
    isSheetChosen(page));
  await chooseOutputAndCheck(page, hand, check, '4 photos');
  await saveCorners(page, hand, 4);
  const values = await cornerProgressSoFar(page);
  await check('the thin red line starts at the left, grows to the full width once and never '
    + 'shrinks back on the way', async () => {
    expect(values[0]).toBe(0);
    expect(values[values.length - 1]).toBe(100);
    const isRising = values.every((value, index) => index === 0 || value >= values[index - 1]);
    expect(isRising).toBe(true);
    expect(values.filter(value => value === 100)).toHaveLength(1);
  });
  await waitForExportEnd(page);
  await check('the line has gone', async () => {
    await expect(page.locator('#cornerShotsSheet .progress-line')).toBeHidden();
  });
});

test('CNR-15.1 Neither Download corners nor a finished Share corners brings Next card [phone]',
  async ({ page, check }, testInfo) => {
    const hand = await startOnExport(page, testInfo, { address: NO_CORNER_QUESTION });
    await openSheetAndCheck(page, hand, check, 'the Corner shots sheet rises');
    const [saved] = await saveCorners(page, hand);
    await check('the corner sheet is saved', async () => {
      expect(saved.name).toBe(SHEET_NAME);
    });
    await waitForExportEnd(page);
    await closeSheetAndCheck(page, hand, check, 'the sheet goes down; there is no Next card',
      async () => {
        await expect(nextCard(page)).toBeHidden();
      });
    await openSheetAndCheck(page, hand, check, 'the Corner shots sheet rises');
    await shareCornersOnce(page, hand, 1);
    await check('the share sheet is handed the corner sheet, and finishes', async () => {
      expect((await sharesSoFar(page))[0].files.map(file => file.name)).toEqual([SHEET_NAME]);
      await expect(shareCornersLabel(page)).toHaveText('Share corners');
    });
    await closeSheetAndCheck(page, hand, check, 'the sheet goes down; there is no Next card',
      async () => {
        await expect(nextCard(page)).toBeHidden();
      });
    const exported = await downloadAnswering(page, hand, 'No');
    await check(`the question box asks "${UPSCALE_QUESTION}": the crop is 1074 px`, async () => {
      expect(exported.question).toBe(UPSCALE_QUESTION);
    });
    await check('the photo is saved, and Next card shows', async () => {
      expect(exported.bytes).toBeGreaterThan(0);
      await expect(nextCard(page)).toBeVisible();
    });
  });

test('CNR-16.1 In a pair, the corner shots are of the side on screen [phone]', async ({
  page,
  check,
}, testInfo) => {
  await installShareStandIn(page);
  const hand = await makePair(page, testInfo, PORTRAIT_PAIR, NO_CORNER_QUESTION);
  await goToStep(page, 'export', hand);
  const backSheetPx = 2 * BACK_SHOT_PX + GAP_PX;
  const frontSheetPx = 2 * FRONT_SHOT_PX + GAP_PX;
  const backLine = `Sheet ${backSheetPx} × ${backSheetPx} px · ${BACK_SHOT_PX} px corners · JPEG`;
  const frontLine = `Sheet ${frontSheetPx} × ${frontSheetPx} px · ${FRONT_SHOT_PX} px corners · `
    + 'JPEG';
  await openSheetAndCheck(page, hand, check, `the corner size line reads "${backLine}"`,
    async () => {
      expect(await cornerReadout(page)).toBe(backLine);
    });
  const [back] = await saveCorners(page, hand);
  await check(`a file named 14_back_portrait_raw_white-corners.jpg is saved, of ${backSheetPx} × `
    + `${backSheetPx} px`, async () => {
    expect(back.name).toBe('14_back_portrait_raw_white-corners.jpg');
    expect(await imageSize(page, back.file)).toEqual([backSheetPx, backSheetPx]);
  });
  await waitForExportEnd(page);
  await closeSheetAndCheck(page, hand, check);
  await switchTo(page, hand, 'front');
  await check('Front is selected (white) and the front\'s photo shows', async () => {
    await expect(sideButton(page, 'front')).toHaveAttribute('aria-pressed', 'true');
    const shownName = await page.evaluate(() => window.__straightener.app.state.source.name);
    expect(shownName).toBe(PORTRAIT_PAIR.front);
  });
  await openSheetAndCheck(page, hand, check, `the corner size line reads "${frontLine}"`,
    async () => {
      expect(await cornerReadout(page)).toBe(frontLine);
    });
  const [front] = await saveCorners(page, hand);
  await check(`a file named 14_front_portrait_raw_white-corners.jpg is saved, of ${frontSheetPx} `
    + `× ${frontSheetPx} px`, async () => {
    expect(front.name).toBe('14_front_portrait_raw_white-corners.jpg');
    expect(await imageSize(page, front.file)).toEqual([frontSheetPx, frontSheetPx]);
  });
});
