// The Corner shots cases (tests/catalog/corner-shots.md): the sheet, the thumbnails, 4 photos
// or 1 sheet, the size line, Share corners and Download corners, Share now, when the buttons
// are dimmed, how each shot is framed, the sheet's layout, the export settings, file names,
// progress, Next card and pairs.
// Each test drives the app as a person would, through hand.tap and hand.drag (a finger on the
// phone targets, the mouse on the wide ones), and reads the app's state only to check a result.
// No test opens a real share sheet: the page gets a stand-in (support/export.js).
'use strict';
const fs = require('fs');
const { test, expect } = require('./support/case.js');
const {
  openApp,
  openPhoto,
  goToStep,
  openOptions,
  closeOptions,
  middleOf,
  hasWhiteFill,
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
  moveQualityTo,
  chooseFill,
  isSameFile,
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
} = require('./support/front-and-back.js');
const { addLogo } = require('./support/start-and-session.js');
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
// The sheet's hint, word for word.
const CORNER_HINT = 'Close-ups of the card’s four corners, at the photo’s own resolution, '
  + 'with this photo’s levels and no overlay.';
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

// The Corner shots button, and the sheet's two save buttons and their labels.
const cornerShotsButton = page => page.locator('#btnCornerShots');
const shareCorners = page => page.locator('#btnCornerShare');
const downloadCorners = page => page.locator('#btnCornerDownload');
const shareCornersLabel = page => page.locator('#btnCornerShare .action-label');
const nextCard = page => page.locator('#btnNextCard');

// Taps one of the Format choices by its label ('JPEG', 'PNG' or 'WebP').
const tapFormat = (page, hand, label) => hand.tap(choiceButton(page, 'exportFormat', label));

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

// Waits until the thumbnails have been drawn since the sheet opened (two frames).
function waitForThumbnails(page) {
  return page.evaluate(() => new Promise(resolve => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  }));
}

test('CNR-01.1 On a phone, the Corner shots sheet opens and closes like any other sheet [phone]',
  async ({ page, check }, testInfo) => {
    const hand = await startOnExport(page, testInfo);
    await openCornerSheet(page, hand);
    await check('a sheet titled Corner shots rises, ending with its line about close-ups',
      async () => {
        await expect(page.locator('#cornerShotsSheetTitle')).toHaveText('Corner shots');
        await expect(page.locator('#cornerShotsSheet .sheet-hint')).toHaveText(CORNER_HINT);
        await expect(page.locator('#cornerShotsSheet .sheet-hint')).toBeVisible();
      });
    await hand.tap(page.locator('#cornerShotsSheet .sheet-close'));
    await waitForCornerSheet(page, false);
    await check('the × closes the sheet', async () => {
      expect(await isCornerSheetOpen(page)).toBe(false);
    });
    await openCornerSheet(page, hand);
    await check('Corner shots opens it again', async () => {
      expect(await isCornerSheetOpen(page)).toBe(true);
    });
    const grabber = page.locator('#cornerShotsSheet .sheet-grabber');
    const start = await middleOf(grabber);
    await hand.drag(start, { x: start.x, y: start.y + CLOSE_DRAG_PX },
      '#cornerShotsSheet .sheet-grabber');
    await waitForCornerSheet(page, false);
    await check('a drag down on its top edge closes the sheet', async () => {
      expect(await isCornerSheetOpen(page)).toBe(false);
    });
  });

test('CNR-01.2 On a wide screen, Corner shots is a section of the panel, always open [desktop]',
  async ({ page, check }, testInfo) => {
    const hand = await startOnExport(page, testInfo);
    const section = page.locator('#cornerShotsSheet');
    const placeBefore = await section.boundingBox();
    await check('the panel shows the Corner shots section, with no × to close it', async () => {
      await expect(page.locator('#cornerShotsSheetTitle')).toBeVisible();
      await expect(page.locator('#cornerShotsSheet canvas[data-corner]:visible')).toHaveCount(4);
      await expect(page.locator('#cornerOutput')).toBeVisible();
      await expect(downloadCorners(page)).toBeVisible();
      await expect(page.locator('#cornerShotsSheet .sheet-close')).toBeHidden();
    });
    await hand.tap(cornerShotsButton(page));
    await check('after Corner shots the section is still shown in the same place', async () => {
      await expect(page.locator('#cornerShotsSheetTitle')).toBeVisible();
      const placeAfter = await section.boundingBox();
      const panel = await page.locator('#panel').boundingBox();
      expect(placeAfter.y).toBeCloseTo(placeBefore.y, 0);
      expect(placeAfter.x).toBeGreaterThanOrEqual(panel.x);
    });
  });

test('CNR-02.1 The thumbnails show each corner, and only the background while the corners are '
  + 'invalid [phone]', async ({ page, check }, testInfo) => {
  const hand = await startOnExport(page, testInfo);
  await openCornerSheet(page, hand);
  await waitForThumbnails(page);
  await check.eye('four close-ups, top-left, top-right, bottom-left, bottom-right; the dark mat '
    + 'along each one\'s two outer sides, the card\'s corner about a third in from them');
  await closeCornerSheet(page, hand);
  await goToStep(page, 'levels', hand);
  await hand.tap(page.locator('#toolAutoLevels'));
  await hand.tap(page.locator('#btnApplyLevels'));
  await goToStep(page, 'export', hand);
  await openCornerSheet(page, hand);
  await waitForThumbnails(page);
  await check.eye('the same four corners, with the brighter, higher-contrast look of Auto');
  await closeCornerSheet(page, hand);
  await goToStep(page, 'perspective', hand);
  await crossTheCorners(page, hand);
  await goToStep(page, 'export', hand);
  await openCornerSheet(page, hand);
  await waitForThumbnails(page);
  await check('each of the four close-ups is plain white, with no part of the photo', async () => {
    expect(await thumbnailsArePlain(page, WHITE_RGB)).toEqual([true, true, true, true]);
  });
  await closeCornerSheet(page, hand);
  await chooseFill(page, hand, 'transparent');
  await openCornerSheet(page, hand);
  await waitForThumbnails(page);
  await check('with a Transparent fill each close-up is plain dark gray, #2b2b2b', async () => {
    expect(await thumbnailsArePlain(page, STAGE_RGB)).toEqual([true, true, true, true]);
  });
});

test('CNR-03.1 1 sheet is the first choice, and 4 photos is remembered after a reload '
  + '[phone] [webkit]', async ({ page, check }, testInfo) => {
  const hand = await startOnExport(page, testInfo);
  await openCornerSheet(page, hand);
  await check('1 sheet is selected and the size line begins "Sheet"', async () => {
    expect(await selectedChoices(page, 'cornerOutput')).toEqual(['1 sheet']);
    expect(await hasWhiteFill(choiceButton(page, 'cornerOutput', '1 sheet'))).toBe(true);
    expect(await cornerReadout(page)).toMatch(/^Sheet /);
  });
  await chooseCornerOutput(page, hand, '4 photos');
  await check('4 photos is selected and the size line begins "4 photos"', async () => {
    expect(await selectedChoices(page, 'cornerOutput')).toEqual(['4 photos']);
    expect(await cornerReadout(page)).toMatch(/^4 photos /);
  });
  await openApp(page);
  await openPhoto(page, CORNER_PHOTO);
  await check('after a reload the photo opens on the Perspective step', async () => {
    expect(await page.evaluate(() => window.__straightener.app.tab)).toBe('perspective');
  });
  await goToStep(page, 'export', hand);
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
  await openCornerSheet(page, hand);
  await shareCornersOnce(page, hand, 1);
  await check('the share is refused and the red button reads Share now', async () => {
    await expect(shareCornersLabel(page)).toHaveText('Share now');
  });
  await chooseCornerOutput(page, hand, '4 photos');
  await check('after 4 photos the button reads Share corners again', async () => {
    await expect(shareCornersLabel(page)).toHaveText('Share corners');
  });
  await shareCornersOnce(page, hand, 2);
  await check('the share sheet opens with the four photos, not the sheet', async () => {
    const shares = await sharesSoFar(page);
    const names = shares[1].files.map(file => file.name);
    expect(names).toEqual(SHOT_LABELS.map(label => shotName(label)));
  });
});

test('CNR-04.1 The size line gives the sheet\'s or each photo\'s size, and the format [phone]',
  async ({ page, check }, testInfo) => {
    const hand = await startOnExport(page, testInfo);
    await openCornerSheet(page, hand);
    await check(`it reads "${SHEET_LINE}"`, async () => {
      expect(await cornerReadout(page)).toBe(SHEET_LINE);
    });
    await chooseCornerOutput(page, hand, '4 photos');
    await check(`it reads "${PHOTOS_LINE}"`, async () => {
      expect(await cornerReadout(page)).toBe(PHOTOS_LINE);
    });
    await closeCornerSheet(page, hand);
    await tapFormat(page, hand, 'PNG');
    await openCornerSheet(page, hand);
    await check(`after PNG it reads "4 photos · ${SHOT_PX} × ${SHOT_PX} px · PNG"`, async () => {
      expect(await cornerReadout(page)).toBe(`4 photos · ${SHOT_PX} × ${SHOT_PX} px · PNG`);
    });
  });

test('CNR-04.2 While the corners are invalid, the size line is empty [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnExport(page, testInfo, { step: 'perspective' });
  await crossTheCorners(page, hand);
  await check('the outline crosses itself', async () => {
    expect(await page.evaluate(() => window.__straightener.app.geometry.ok)).toBe(false);
  });
  await goToStep(page, 'export', hand);
  await openCornerSheet(page, hand);
  await check('the size line is empty', async () => {
    expect(await cornerReadout(page)).toBe('');
  });
});

test('CNR-04.3 When the corner shots can\'t be made, the line gives the real reason [phone]',
  async ({ page, check }, testInfo) => {
    test.fail(true, 'BUG-120');
    const hand = await startOnExport(page, testInfo);
    await makeCornerShotsImpossible(page, 'Transform is not invertible.');
    await openCornerSheet(page, hand);
    const line = await cornerReadout(page);
    await check('the line says the shots can\'t be framed, not "the card is too small"',
      async () => {
        expect(line).not.toBe('');
        expect(line).not.toContain('the card is too small');
      });
  });

test('CNR-05.2 Share corners hands the share sheet the corner sheet [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnExport(page, testInfo, { address: NO_CORNER_QUESTION });
  await openCornerSheet(page, hand);
  await check('Share corners shows in red, Download corners beside it is not red', async () => {
    await expect(shareCorners(page)).toBeVisible();
    expect(await isRed(shareCorners(page))).toBe(true);
    expect(await isRed(downloadCorners(page))).toBe(false);
  });
  await shareCornersOnce(page, hand, 1);
  await check(`the share sheet gets one JPEG, ${SHEET_NAME}; "Saved the corner sheet in …"`,
    async () => {
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
  await closeCornerSheet(page, hand);
  await page.evaluate(() => {
    window.testCanShare = true;
  });
  await tapFormat(page, hand, 'PNG');
  await check('once the browser can share, an edit brings Share on Export', async () => {
    await expect(page.locator('#btnShare')).toBeVisible();
  });
  await openCornerSheet(page, hand);
  await check('Share corners shows too', async () => {
    expect(await shareCorners(page).isVisible()).toBe(true);
  });
});

test('CNR-06.1 Download corners saves the corner sheet as a plain download [phone] [webkit]',
  async ({ page, check }, testInfo) => {
    const hand = await startOnExport(page, testInfo, { address: NO_CORNER_QUESTION });
    await openCornerSheet(page, hand);
    await check('Download corners shows', async () => {
      await expect(downloadCorners(page)).toBeVisible();
    });
    const saved = await saveCorners(page, hand);
    await check(`one JPEG of ${SHEET_PX} × ${SHEET_PX} px is saved; `
      + '"Saved the corner sheet in …"', async () => {
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
  await openCornerSheet(page, hand);
  await hand.tap(shareCorners(page));
  await check('a question card asks "Upscale to 2000 px?"', async () => {
    await expectQuestion(page, 'Upscale to 2000 px?');
  });
  await hand.tap(questionButton(page, 'No'));
  await waitForShares(page, 1);
  await waitForExportEnd(page);
  await check('the share is refused; the red button reads Share now', async () => {
    await expect(shareCornersLabel(page)).toHaveText('Share now');
  });
  await hand.tap(shareCorners(page));
  await waitForShares(page, 2);
  await check('no question; the same file is shared, and the button reads Share corners',
    async () => {
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
  await check('while the main export ran, Share now was live and Download corners greyed out',
    async () => {
      expect(exported.question).toBe('Upscale to 2000 px?');
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
  await openCornerSheet(page, hand);
  await shareCornersOnce(page, hand, 1);
  await check('the share is refused; the red button reads Share now', async () => {
    await expect(shareCornersLabel(page)).toHaveText('Share now');
  });
  await closeCornerSheet(page, hand);
  await tapFormat(page, hand, 'PNG');
  await openCornerSheet(page, hand);
  await check('after PNG the red button reads Share corners', async () => {
    await expect(shareCornersLabel(page)).toHaveText('Share corners');
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
  await downloadAnswering(page, hand, 'No');
  await check('a file is saved, and Next card shows in white', async () => {
    await expect(nextCard(page)).toBeVisible();
    expect(await hasWhiteFill(nextCard(page))).toBe(true);
  });
  await openCornerSheet(page, hand);
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
  await crossTheCorners(page, hand);
  await check('the outline crosses itself', async () => {
    expect(await page.evaluate(() => window.__straightener.app.geometry.ok)).toBe(false);
  });
  await goToStep(page, 'export', hand);
  await openCornerSheet(page, hand);
  await check('Share corners and Download corners are greyed out', async () => {
    await expect(shareCorners(page)).toBeDisabled();
    await expect(downloadCorners(page)).toBeDisabled();
  });
  const collector = collectDownloads(page);
  await tapRegardless(hand, downloadCorners(page));
  const count = await downloadsAfterWait(page, collector, NOTHING_SAVED_WAIT_MS);
  collector.stop();
  await check('a tap on Download corners saves nothing', async () => {
    expect(count).toBe(0);
  });
});

test('CNR-08.2 For a card too small for corner shots, both buttons are dimmed [phone]', async ({
  page,
  check,
}, testInfo) => {
  test.fail(true, 'BUG-120');
  const hand = await startOnExport(page, testInfo);
  await makeCornerShotsImpossible(page, 'The card is too small for corner shots.');
  await openCornerSheet(page, hand);
  const states = {
    share: await shareCorners(page).isDisabled(),
    download: await downloadCorners(page).isDisabled(),
  };
  await check('Share corners and Download corners are greyed out', async () => {
    expect(states).toEqual({ share: true, download: true });
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
  await openCornerSheet(page, hand);
  await saveCorners(page, hand);
  await check('while the line ran, Share corners and Download corners were greyed out',
    async () => {
      const [start] = await exportStarts(page);
      expect(start.controls.btnCornerShare.disabled).toBe(true);
      expect(start.controls.btnCornerDownload.disabled).toBe(true);
    });
  await waitForExportEnd(page);
  await check('once the file is saved both buttons are live again', async () => {
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
  await openCornerSheet(page, hand);
  await check('while the front opens, Share corners and Download corners are greyed out',
    async () => {
      expect(await page.evaluate(() => window.__straightener.app.isSwitching)).toBe(true);
      await expect(shareCorners(page)).toBeDisabled();
      await expect(downloadCorners(page)).toBeDisabled();
    });
  await releaseOpening(page);
  await page.waitForFunction(() => {
    const app = window.__straightener.app;
    return !app.isSwitching && app.pair.current === 'front';
  });
  await check('once the front is open both buttons are live', async () => {
    await expect(shareCorners(page)).toBeEnabled();
    await expect(downloadCorners(page)).toBeEnabled();
  });
});

// The four photos as saved, by corner label: { tl: { name, file }, … }.
function byLabel(saved) {
  return Object.fromEntries(saved.map(file => [file.name.match(/-corner-(\w+)\./)[1], file]));
}

test('CNR-09.1 Each shot is a quarter of the card\'s width, with the card\'s corner 30% in '
  + '[phone] [webkit]', async ({ page, check }, testInfo) => {
  const hand = await startOnExport(page, testInfo, { address: NO_CORNER_QUESTION });
  await hand.tap(choiceButton(page, 'exportSize', 'Original'));
  const original = await downloadAnswering(page, hand);
  const cardWidthPx = await cardWidthInExport(page, original.file);
  await check(`a file of ${ORIGINAL_CROP_PX} × ${ORIGINAL_CROP_PX} px is saved, the card about `
    + `${CARD_WIDTH_PX} px wide`, async () => {
    expect(await imageSize(page, original.file)).toEqual([ORIGINAL_CROP_PX, ORIGINAL_CROP_PX]);
    expect(Math.abs(cardWidthPx - CARD_WIDTH_PX)).toBeLessThan(CARD_WIDTH_TOLERANCE_PX);
  });
  await chooseCornerOutput(page, hand, '4 photos');
  await check(`the size line reads "${PHOTOS_LINE}": a quarter of the card's width`, async () => {
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
  const insets = {};
  for (const label of SHOT_LABELS) {
    const corner = await cardCornerInShot(page, shots[label].file, label);
    // How far in from the shot's outer edges the corner is, as fractions of its side.
    insets[label] = {
      across: label.endsWith('l') ? corner.across : 1 - corner.across,
      down: label.startsWith('t') ? corner.down : 1 - corner.down,
    };
  }
  await check('in each shot the card\'s corner is 30% of the side in from its two outer edges',
    async () => {
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
  await chooseCornerOutput(page, hand, '4 photos');
  await check('the size line reads "4 photos · 100 × 100 px · JPEG"', async () => {
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

test('CNR-10.1 The sheet holds the four shots in reading order, a 2 px white gap between them '
  + 'and no margin [phone] [webkit]', async ({ page, check }, testInfo) => {
  const hand = await startOnExport(page, testInfo, { address: NO_CORNER_QUESTION });
  await openCornerSheet(page, hand);
  const [sheet] = await saveCorners(page, hand);
  await check(`one file of ${SHEET_PX} × ${SHEET_PX} px is saved: two ${SHOT_PX} px tiles and a `
    + `${GAP_PX} px gap each way`, async () => {
    expect(await imageSize(page, sheet.file)).toEqual([SHEET_PX, SHEET_PX]);
  });
  await chooseCornerOutput(page, hand, '4 photos');
  const photos = byLabel(await saveCorners(page, hand, 4));
  await check(`four files of ${SHOT_PX} × ${SHOT_PX} px are saved`, async () => {
    expect(Object.keys(photos).sort()).toEqual(['bl', 'br', 'tl', 'tr']);
    expect(await imageSize(page, photos.tl.file)).toEqual([SHOT_PX, SHOT_PX]);
  });
  const matches = await matchTilesToPhotos(page, sheet.file, photos);
  await check('the tiles are, in reading order, the -tl, -tr, -bl and -br photos', async () => {
    for (const tile of Object.keys(TILE_PLACES)) {
      expect(matches[tile].label, tile).toBe(tile);
      expect(matches[tile].difference, tile).toBeLessThan(MATCH_TOLERANCE);
    }
  });
  const gapLines = [];
  for (const offsetPx of [0, 1]) {
    const lineAt = (SHOT_PX + offsetPx) / SHEET_PX;
    gapLines.push(mean(await luminanceProfile(page, sheet.file, 'column', lineAt, 1)));
    gapLines.push(mean(await luminanceProfile(page, sheet.file, 'row', lineAt, 1)));
  }
  await check('the two pixel rows and columns between the tiles are white, the fill', async () => {
    expect(Math.min(...gapLines)).toBeGreaterThan(WHITE_LINE_MIN);
  });
  const edges = [
    mean(await luminanceProfile(page, sheet.file, 'row', 0, 1)),
    mean(await luminanceProfile(page, sheet.file, 'column', 0, 1)),
    mean(await luminanceProfile(page, sheet.file, 'row', 1, 1)),
    mean(await luminanceProfile(page, sheet.file, 'column', 1, 1)),
  ];
  await check('the sheet\'s outer edges are the dark mat, with no white margin', async () => {
    expect(Math.max(...edges)).toBeLessThan(DARK_EDGE_MAX);
  });
});

test('CNR-11.1 One tap of Download corners saves four files, a quarter of a second apart '
  + '[phone] [webkit]', async ({ page, check }, testInfo) => {
  const hand = await startOnExport(page, testInfo, { address: NO_CORNER_QUESTION });
  await chooseCornerOutput(page, hand, '4 photos');
  await noteDownloadStarts(page);
  const saved = await saveCorners(page, hand, 4);
  const starts = await downloadStarts(page);
  const gaps = starts.slice(1).map((start, index) => start - starts[index]);
  await check('four files arrive, tl, tr, br, bl, each at least 200 ms after the one before; '
    + '"Saved 4 corner shots in …"', async () => {
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
  await chooseCornerOutput(page, hand, '4 photos');
  await shareCornersOnce(page, hand, 1);
  await check('one share sheet opens, with the -tl, -tr, -br and -bl JPEGs', async () => {
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
  await tapFormat(page, hand, 'PNG');
  await check('PNG is selected', async () => {
    expect(await selectedChoices(page, 'exportFormat')).toEqual(['PNG']);
  });
  await openCornerSheet(page, hand);
  const [png] = await saveCorners(page, hand);
  await check(`a PNG, ${PHOTO_BASE}-corners.png, of ${SHEET_PX} × ${SHEET_PX} px is saved`,
    async () => {
      expect(png.name).toBe(`${PHOTO_BASE}-corners.png`);
      expect([...fs.readFileSync(png.file).subarray(1, 4)]).toEqual([0x50, 0x4e, 0x47]);
      expect(await imageSize(page, png.file)).toEqual([SHEET_PX, SHEET_PX]);
    });
  await closeCornerSheet(page, hand);
  await tapFormat(page, hand, 'WebP');
  await openCornerSheet(page, hand);
  const [webp] = await saveCorners(page, hand);
  await check(`a WebP, ${PHOTO_BASE}-corners.webp, is saved`, async () => {
    expect(webp.name).toBe(`${PHOTO_BASE}-corners.webp`);
    expect(fs.readFileSync(webp.file).subarray(8, 12).toString('latin1')).toBe('WEBP');
  });
});

test('CNR-12.2 A lower Quality gives a smaller sheet [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnExport(page, testInfo, { address: NO_CORNER_QUESTION });
  await openOptions(page, hand, 'export');
  await moveQualityTo(page, 'high');
  await check('Quality reads 100%', async () => {
    await expect(page.locator('#qualityValue')).toHaveText('100%');
  });
  await closeOptions(page, hand, 'export');
  await openCornerSheet(page, hand);
  const [high] = await saveCorners(page, hand);
  await check('a JPEG sheet is saved', async () => {
    expect(high.name).toBe(SHEET_NAME);
  });
  await closeCornerSheet(page, hand);
  await openOptions(page, hand, 'export');
  await moveQualityTo(page, 'low');
  await check('Quality reads 50%', async () => {
    await expect(page.locator('#qualityValue')).toHaveText('50%');
  });
  await closeOptions(page, hand, 'export');
  await openCornerSheet(page, hand);
  const [low] = await saveCorners(page, hand);
  await check('a second sheet of the same size in px and a smaller file is saved', async () => {
    expect(await imageSize(page, low.file)).toEqual(await imageSize(page, high.file));
    expect(fs.statSync(low.file).size).toBeLessThan(fs.statSync(high.file).size);
  });
});

// Goes to a step, then back to Export with the Corner shots sheet open, and saves the sheet.
// Returns the saved file's path.
async function saveSheetAfter(page, hand, step, action) {
  await closeCornerSheet(page, hand);
  await goToStep(page, step, hand);
  await action();
  await goToStep(page, 'export', hand);
  await openCornerSheet(page, hand);
  const [saved] = await saveCorners(page, hand);
  return saved.file;
}

test('CNR-12.3 Applied levels are in the shots, unapplied ones and the logo never are [phone]',
  async ({ page, check }, testInfo) => {
    const hand = await startOnExport(page, testInfo, { address: NO_CORNER_QUESTION });
    await openCornerSheet(page, hand);
    const [first] = await saveCorners(page, hand);
    await check('sheet A is saved', async () => {
      expect(first.name).toBe(SHEET_NAME);
    });
    const unapplied = await saveSheetAfter(page, hand, 'levels', () => hand.tap(
      page.locator('#toolAutoLevels'),
    ));
    await check('with Auto not applied, sheet B is byte for byte sheet A', async () => {
      expect(isSameFile(unapplied, first.file)).toBe(true);
    });
    const applied = await saveSheetAfter(page, hand, 'levels', () => hand.tap(
      page.locator('#btnApplyLevels'),
    ));
    await check('with the levels applied, sheet C differs from sheet A', async () => {
      expect(isSameFile(applied, first.file)).toBe(false);
    });
    await closeCornerSheet(page, hand);
    await goToStep(page, 'overlay', hand);
    await addLogo(page, hand, page.locator('#btnOverlayAdd'), 'apple-touch-icon.png');
    await check('the logo shows on the photo', async () => {
      expect(await page.evaluate(() => !!window.__straightener.app.state.overlay)).toBe(true);
    });
    await goToStep(page, 'export', hand);
    await openCornerSheet(page, hand);
    const [withLogo] = await saveCorners(page, hand);
    await check('with the logo on, sheet D is byte for byte sheet C', async () => {
      expect(isSameFile(withLogo.file, applied)).toBe(true);
    });
  });

test('CNR-13.1 The sheet and the photos are named for the photo and their corner '
  + '[phone] [webkit]', async ({ page, check }, testInfo) => {
  const hand = await startOnExport(page, testInfo, { address: NO_CORNER_QUESTION });
  await openCornerSheet(page, hand);
  const [sheet] = await saveCorners(page, hand);
  await check(`a file named ${SHEET_NAME} is saved`, async () => {
    expect(sheet.name).toBe(SHEET_NAME);
  });
  await chooseCornerOutput(page, hand, '4 photos');
  const photos = await saveCorners(page, hand, 4);
  await check('four files are saved, named -corner-tl, -tr, -br and -bl', async () => {
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
  await chooseCornerOutput(page, hand, '4 photos');
  await saveCorners(page, hand, 4);
  await waitForExportEnd(page);
  const values = await cornerProgressSoFar(page);
  await check('the line starts at the left, grows to the full width once, never shrinking back',
    async () => {
      expect(values[0]).toBe(0);
      expect(values[values.length - 1]).toBe(100);
      const isRising = values.every((value, index) => index === 0 || value >= values[index - 1]);
      expect(isRising).toBe(true);
      expect(values.filter(value => value === 100)).toHaveLength(1);
    });
  await check('once the four files are saved the line has gone', async () => {
    await expect(page.locator('#cornerShotsSheet .progress-line')).toBeHidden();
  });
});

test('CNR-15.1 Neither Download corners nor a finished Share corners brings Next card [phone]',
  async ({ page, check }, testInfo) => {
    const hand = await startOnExport(page, testInfo, { address: NO_CORNER_QUESTION });
    await openCornerSheet(page, hand);
    await saveCorners(page, hand);
    await waitForExportEnd(page);
    await closeCornerSheet(page, hand);
    await check('the corner sheet is saved; there is no Next card', async () => {
      await expect(nextCard(page)).toBeHidden();
    });
    await openCornerSheet(page, hand);
    await shareCornersOnce(page, hand, 1);
    await closeCornerSheet(page, hand);
    await check('the corner sheet is shared; there is no Next card', async () => {
      expect((await sharesSoFar(page))[0].files.map(file => file.name)).toEqual([SHEET_NAME]);
      await expect(nextCard(page)).toBeHidden();
    });
    await downloadAnswering(page, hand, 'No');
    await check('after the main Download, Next card shows', async () => {
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
  await openCornerSheet(page, hand);
  const backSheetPx = 2 * BACK_SHOT_PX + GAP_PX;
  const frontSheetPx = 2 * FRONT_SHOT_PX + GAP_PX;
  await check(`the size line reads "Sheet ${backSheetPx} × ${backSheetPx} px · ${BACK_SHOT_PX} px `
    + 'corners · JPEG"', async () => {
    expect(await cornerReadout(page))
      .toBe(`Sheet ${backSheetPx} × ${backSheetPx} px · ${BACK_SHOT_PX} px corners · JPEG`);
  });
  const [back] = await saveCorners(page, hand);
  await check(`14_back_portrait_raw_white-corners.jpg of ${backSheetPx} px is saved`, async () => {
    expect(back.name).toBe('14_back_portrait_raw_white-corners.jpg');
    expect(await imageSize(page, back.file)).toEqual([backSheetPx, backSheetPx]);
  });
  await waitForExportEnd(page);
  await closeCornerSheet(page, hand);
  await switchTo(page, hand, 'front');
  await openCornerSheet(page, hand);
  await check(`the size line reads "Sheet ${frontSheetPx} × ${frontSheetPx} px · `
    + `${FRONT_SHOT_PX} px corners · JPEG"`, async () => {
    expect(await cornerReadout(page))
      .toBe(`Sheet ${frontSheetPx} × ${frontSheetPx} px · ${FRONT_SHOT_PX} px corners · JPEG`);
  });
  const [front] = await saveCorners(page, hand);
  await check(`14_front_portrait_raw_white-corners.jpg of ${frontSheetPx} px is saved`,
    async () => {
      expect(front.name).toBe('14_front_portrait_raw_white-corners.jpg');
      expect(await imageSize(page, front.file)).toEqual([frontSheetPx, frontSheetPx]);
    });
});
