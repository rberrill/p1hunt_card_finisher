// The Upscale question's cases (tests/catalog/upscale-question.md): when it is asked for a
// single photo, a pair and the corner shots, what Yes, No and Cancel do, and that the answer
// counts for one export only.
// Each test drives the app as a person would, through hand.tap (a finger on the phone targets,
// the mouse on the wide ones), and reads the app's state only to check a result.
// No test opens a real share sheet: the page gets a stand-in (support/export.js).
'use strict';
const { test, expect } = require('./support/case.js');
const { openApp, openPhoto, goToStep } = require('./support/app.js');
const {
  choiceButton,
  waitForShares,
  waitForExportEnd,
  sharedImageSize,
  readClipboardImage,
  toastMessage,
  downloadAnswering,
  waitForQuestion,
  isSameFile,
} = require('./support/export.js');
const {
  PORTRAIT_PAIR,
  makePair,
  chooseOutput,
  downloadAll,
} = require('./support/front-and-back.js');
const { addLogo } = require('./support/start-and-session.js');
const {
  CORNER_PHOTO,
  startOnExport,
  openCornerSheet,
  closeCornerSheet,
  chooseCornerOutput,
  saveCorners,
  questionButton,
  expectQuestion,
  isQuestionUp,
  imageSize,
  collectDownloads,
  downloadsAfterWait,
  downloadsArrived,
  regionFingerprint,
  chooseInterpolation,
  topElementAt,
} = require('./support/corner-shots.js');

// The case photo's crop at its own resolution, in px, and the question's line for it.
const CROP_PX = 1074;
const CROP_TEXT = `The crop is ${CROP_PX} × ${CROP_PX} px at the photo’s resolution.`;
// The size the question offers by default, in px.
const SIZE_PX = 2000;
const ASK_2000 = `Upscale to ${SIZE_PX} px?`;
// A photo whose crop (1400 px) is over 1080 px.
const LARGE_CROP_PHOTO = 'IMG_9136.JPEG';
// A link that turns the sharpening after an upscale off.
const NO_SHARPEN = 'index.html?upscale.sharpenAmount=0';
// The pair's sizes at the photos' resolution, as Chromium finds the cards: the Together
// image, and each side's export.
const TOGETHER_TEXT = 'The image is 1583 × 1100 px at the photos’ resolution.';
const TOGETHER_PX = [1583, 1100];
const SEPARATELY_TEXT = 'The front is 748 × 1047 px and the back 785 × 1100 px at the photos’ '
  + 'resolution.';
const FRONT_PX = [748, 1047];
// A link that caps a saved image's area at 2.5 MP: over the Together image (1.74 MP), under it
// fitted to 2000 px (2.78 MP).
const AREA_CAP_LINK = 'index.html?maxOutputArea=2500000';
// The Together image fitted to 2000 px: its height, and how far a saved one may be from it.
const FITTED_HEIGHT_PX = 1390;
const FITTED_TOLERANCE_PX = 2;
// The corner shots' lines for the case photo.
const SHEET_TEXT = 'The sheet is 314 px at the photo’s resolution.';
const EACH_CORNER_TEXT = 'Each corner is 156 px at the photo’s resolution.';
// How long a case waits to be sure a tap saved nothing, in ms.
const NOTHING_SAVED_WAIT_MS = 1500;
// How far in from the logo's edges its pixels are compared, in px: the edge pixels blend the
// logo with the photo under it when it is drawn smaller or larger than its file.
const LOGO_INSET_PX = 4;
// A part of the 2000 px photo away from the logo in its middle, in px.
const PHOTO_PATCH = { x: 100, y: 100, width: 300, height: 300 };
// How far down the page a tap on the dimmed screen above the card lands, in CSS px.
const ABOVE_CARD_Y_PX = 150;
// The name of the logo file used, from the repository's icons/ folder: an opaque square.
const LOGO = 'apple-touch-icon.png';

// The size that is selected on Export, by its label.
const tapSize = (page, hand, label) => hand.tap(choiceButton(page, 'exportSize', label));

// Taps a save button on Export by id and waits for the Upscale question.
async function askBy(page, hand, buttonId) {
  await waitForQuestion(page, false);
  await hand.tap(page.locator(`#${buttonId}`));
  await waitForQuestion(page, true);
}

// Answers the question card that is up with `answer` and waits for `count` downloads. Returns
// [{ name, file }] in the order they arrived.
async function answerAndCollect(page, hand, answer, count = 1) {
  const collector = collectDownloads(page);
  try {
    await hand.tap(questionButton(page, answer));
    return await downloadsArrived(page, collector, count);
  } finally {
    collector.stop();
  }
}

// Opens the case photo in the page as it is now (after a page.goto), and goes to Export.
async function reopenOnExport(page, hand, address) {
  await openApp(page, address);
  await openPhoto(page, CORNER_PHOTO);
  await goToStep(page, 'export', hand);
}

// Downloads with the Upscale question answered `answer`, and returns the saved file's path.
async function downloadAnsweredWith(page, hand, answer) {
  const saved = await downloadAnswering(page, hand, answer);
  return saved.file;
}

// Adds the logo on the Overlay step, chooses PNG on Export, and saves with Yes. Returns the saved
// file's path and the logo's place in it, { x, y, width, height } in px, inset by LOGO_INSET_PX.
async function saveUpscaledWithLogo(page, hand) {
  await goToStep(page, 'overlay', hand);
  await addLogo(page, hand, page.locator('#btnOverlayAdd'), LOGO);
  await goToStep(page, 'export', hand);
  await hand.tap(choiceButton(page, 'exportFormat', 'PNG'));
  const file = await downloadAnsweredWith(page, hand, 'Yes');
  const logo = await page.evaluate(sizePx => window.CardEngine.overlayRect(
    window.__straightener.app.state.overlay,
    sizePx,
    sizePx,
  ), SIZE_PX);
  const inset = {
    x: Math.ceil(logo.x) + LOGO_INSET_PX,
    y: Math.ceil(logo.y) + LOGO_INSET_PX,
    width: Math.floor(logo.width) - 2 * LOGO_INSET_PX,
    height: Math.floor(logo.height) - 2 * LOGO_INSET_PX,
  };
  return { file, logo: inset };
}

test('UPS-01.1 Download, Share and Copy each ask first, naming the size and the crop [phone]',
  async ({ page, check }, testInfo) => {
    const hand = await startOnExport(page, testInfo);
    await askBy(page, hand, 'btnDownload');
    await check(`a card asks "${ASK_2000}" and reads "${CROP_TEXT}"`, async () => {
      await expectQuestion(page, ASK_2000, CROP_TEXT);
    });
    await hand.tap(questionButton(page, 'Cancel'));
    await askBy(page, hand, 'btnShare');
    await check(`Share asks "${ASK_2000}"`, async () => {
      await expectQuestion(page, ASK_2000, CROP_TEXT);
    });
    await hand.tap(questionButton(page, 'Cancel'));
    await askBy(page, hand, 'btnCopy');
    await check(`Copy asks "${ASK_2000}"`, async () => {
      await expectQuestion(page, ASK_2000, CROP_TEXT);
    });
    await hand.tap(questionButton(page, 'Cancel'));
    await waitForQuestion(page, false);
    await tapSize(page, hand, '1080');
    await askBy(page, hand, 'btnDownload');
    await check(`at 1080 it asks "Upscale to 1080 px?" and reads "${CROP_TEXT}"`, async () => {
      await expectQuestion(page, 'Upscale to 1080 px?', CROP_TEXT);
    });
  });

test('UPS-02.1 Yes saves the photo at the chosen size [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnExport(page, testInfo);
  const saved = await downloadAnswering(page, hand, 'Yes');
  await check(`a card asks "${ASK_2000}"`, async () => {
    expect(saved.question).toBe(ASK_2000);
  });
  await check('after Yes a 2000 × 2000 px file is saved; "Exported 2000 × 2000 px in …"',
    async () => {
      expect(await imageSize(page, saved.file)).toEqual([SIZE_PX, SIZE_PX]);
      await expect.poll(() => toastMessage(page)).toMatch(/^Exported 2000 × 2000 px in /);
    });
});

test('UPS-02.2 Yes sharpens the enlarged photo [phone]', async ({ page, check }, testInfo) => {
  const hand = await startOnExport(page, testInfo);
  const sharpened = await downloadAnsweredWith(page, hand, 'Yes');
  await check('file A of 2000 × 2000 px is saved', async () => {
    expect(await imageSize(page, sharpened)).toEqual([SIZE_PX, SIZE_PX]);
  });
  await reopenOnExport(page, hand, NO_SHARPEN);
  const plain = await downloadAnsweredWith(page, hand, 'Yes');
  await check('with the sharpening off, file B of 2000 × 2000 px differs from file A',
    async () => {
      expect(await imageSize(page, plain)).toEqual([SIZE_PX, SIZE_PX]);
      expect(isSameFile(plain, sharpened)).toBe(false);
    });
});

test('UPS-02.3 The logo goes on after the sharpening [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnExport(page, testInfo, { step: 'overlay' });
  const sharpened = await saveUpscaledWithLogo(page, hand);
  await check('PNG file A of 2000 × 2000 px is saved, with the logo in its middle', async () => {
    expect(await imageSize(page, sharpened.file)).toEqual([SIZE_PX, SIZE_PX]);
    expect(sharpened.logo.x).toBeGreaterThan(PHOTO_PATCH.x + PHOTO_PATCH.width);
  });
  await reopenOnExport(page, hand, NO_SHARPEN);
  const plain = await saveUpscaledWithLogo(page, hand);
  await check('with the sharpening off, PNG file B is saved', async () => {
    expect(await imageSize(page, plain.file)).toEqual([SIZE_PX, SIZE_PX]);
  });
  const logoA = await regionFingerprint(page, sharpened.file, sharpened.logo);
  const logoB = await regionFingerprint(page, plain.file, sharpened.logo);
  const photoA = await regionFingerprint(page, sharpened.file, PHOTO_PATCH);
  const photoB = await regionFingerprint(page, plain.file, PHOTO_PATCH);
  await check('inside the logo every pixel is the same in both; in the photo they differ',
    async () => {
      expect(logoB).toBe(logoA);
      expect(photoB).not.toBe(photoA);
    });
});

test('UPS-03.1 No saves the photo at its own size [phone]', async ({ page, check }, testInfo) => {
  const hand = await startOnExport(page, testInfo);
  const saved = await downloadAnswering(page, hand, 'No');
  await check(`a card asks "${ASK_2000}"`, async () => {
    expect(saved.question).toBe(ASK_2000);
  });
  await check(`after No a ${CROP_PX} × ${CROP_PX} px file is saved; "Exported ${CROP_PX} × `
    + `${CROP_PX} px in …"`, async () => {
    expect(await imageSize(page, saved.file)).toEqual([CROP_PX, CROP_PX]);
    await expect.poll(() => toastMessage(page)).toMatch(/^Exported 1074 × 1074 px in /);
  });
});

test('UPS-03.2 Cancel and a tap outside the card save nothing [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnExport(page, testInfo);
  const collector = collectDownloads(page);
  await askBy(page, hand, 'btnDownload');
  await check(`a card asks "${ASK_2000}"`, async () => {
    await expectQuestion(page, ASK_2000);
  });
  await hand.tap(questionButton(page, 'Cancel'));
  const afterCancel = await downloadsAfterWait(page, collector, NOTHING_SAVED_WAIT_MS);
  await check('Cancel closes the card; nothing is saved and no export runs', async () => {
    expect(await isQuestionUp(page)).toBe(false);
    expect(afterCancel).toBe(0);
    expect(await page.evaluate(() => !!window.__straightener.app.exporting)).toBe(false);
  });
  await askBy(page, hand, 'btnDownload');
  await check('Download asks again', async () => {
    await expectQuestion(page, ASK_2000);
  });
  await page.touchscreen.tap(page.viewportSize().width / 2, ABOVE_CARD_Y_PX);
  const afterOutside = await downloadsAfterWait(page, collector, NOTHING_SAVED_WAIT_MS);
  collector.stop();
  await check('a tap on the dimmed screen closes the card; nothing is saved', async () => {
    expect(await isQuestionUp(page)).toBe(false);
    expect(afterOutside).toBe(0);
  });
});

test('UPS-03.3 Escape closes the question and saves nothing [desktop]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnExport(page, testInfo);
  const collector = collectDownloads(page);
  await askBy(page, hand, 'btnDownload');
  await check(`a card over the photo asks "${ASK_2000}"`, async () => {
    await expectQuestion(page, ASK_2000);
  });
  await page.keyboard.press('Escape');
  const count = await downloadsAfterWait(page, collector, NOTHING_SAVED_WAIT_MS);
  collector.stop();
  await check('Escape closes the card; nothing is saved', async () => {
    expect(await isQuestionUp(page)).toBe(false);
    expect(count).toBe(0);
  });
});

test('UPS-04.1 Original never asks [phone]', async ({ page, check }, testInfo) => {
  const hand = await startOnExport(page, testInfo);
  await tapSize(page, hand, 'Original');
  const saved = await downloadAnswering(page, hand);
  await check(`no question; a ${CROP_PX} × ${CROP_PX} px file is saved`, async () => {
    expect(saved.question).toBe('');
    expect(await imageSize(page, saved.file)).toEqual([CROP_PX, CROP_PX]);
  });
});

test('UPS-04.2 A crop already over the size isn\'t asked about [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnExport(page, testInfo, { photo: LARGE_CROP_PHOTO });
  await tapSize(page, hand, '1080');
  const saved = await downloadAnswering(page, hand);
  await check('at 1080, no question; a 1080 × 1080 px file is saved', async () => {
    expect(saved.question).toBe('');
    expect(await imageSize(page, saved.file)).toEqual([1080, 1080]);
  });
  await tapSize(page, hand, '2000');
  await askBy(page, hand, 'btnDownload');
  await check(`at 2000 a card asks "${ASK_2000}"`, async () => {
    await expectQuestion(page, ASK_2000);
  });
});

test('UPS-04.3 With upscaling on from a link, there is no question [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnExport(page, testInfo, {
    address: 'index.html?export.allowUpscale=1',
  });
  const saved = await downloadAnswering(page, hand);
  await check('no question; a 2000 × 2000 px file is saved', async () => {
    expect(saved.question).toBe('');
    expect(await imageSize(page, saved.file)).toEqual([SIZE_PX, SIZE_PX]);
  });
});

test('UPS-04.4 With upscaling on from a link, a size the canvas limit holds back isn\'t asked '
  + 'about either [phone]', async ({ page, check }, testInfo) => {
  test.fail(true, 'BUG-142');
  const hand = await startOnExport(page, testInfo, {
    address: 'index.html?export.allowUpscale=1&export.longEdge=12000',
  });
  const saved = await downloadAnswering(page, hand);
  const size = await imageSize(page, saved.file);
  await check('no question; a 4096 × 4096 px file is saved', async () => {
    expect(saved.question).toBe('');
    expect(size).toEqual([4096, 4096]);
  });
});

// Makes the case's pair (the back open), goes to Export and picks the output. Returns the hand.
async function startOnPair(page, testInfo, output, address = 'index.html') {
  const hand = await makePair(page, testInfo, PORTRAIT_PAIR, address);
  await goToStep(page, 'export', hand);
  await chooseOutput(page, hand, output);
  return hand;
}

test('UPS-05.1 Together asks about the joined image, and Yes fits its long edge to the size '
  + '[phone]', async ({ page, check }, testInfo) => {
  const hand = await startOnPair(page, testInfo, 'together');
  await askBy(page, hand, 'btnDownload');
  await check(`a card asks "${ASK_2000}" and reads "${TOGETHER_TEXT}"`, async () => {
    await expectQuestion(page, ASK_2000, TOGETHER_TEXT);
  });
  const [saved] = await answerAndCollect(page, hand, 'Yes');
  const [width, height] = await imageSize(page, saved.file);
  await check('after Yes, 14_front_portrait_raw_white-pair.jpg is saved, 2000 px wide and about '
    + '1390 px tall', async () => {
    expect(saved.name).toBe('14_front_portrait_raw_white-pair.jpg');
    expect(width).toBe(SIZE_PX);
    expect(Math.abs(height - FITTED_HEIGHT_PX)).toBeLessThanOrEqual(FITTED_TOLERANCE_PX);
  });
});

test('UPS-05.2 Where a canvas cap leaves no room to enlarge the joined image, no question is '
  + 'asked [phone]', async ({ page, check }, testInfo) => {
  test.fail(true, 'BUG-142');
  const hand = await startOnPair(page, testInfo, 'together', AREA_CAP_LINK);
  const saved = await downloadAnswering(page, hand, 'Yes');
  const size = await imageSize(page, saved.file);
  await check('no question; 14_front_portrait_raw_white-pair.jpg is saved at 1583 × 1100 px',
    async () => {
      expect(saved.question).toBe('');
      expect(saved.name).toBe('14_front_portrait_raw_white-pair.jpg');
      expect(size).toEqual(TOGETHER_PX);
    });
});

test('UPS-06.1 Separately names both sides, and Yes gives each the size [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnPair(page, testInfo, 'separately');
  await askBy(page, hand, 'btnDownload');
  await check(`a card asks "${ASK_2000}" and names the front's and the back's sizes`, async () => {
    await expectQuestion(page, ASK_2000, SEPARATELY_TEXT);
  });
  const saved = await answerAndCollect(page, hand, 'Yes', 2);
  const heights = [];
  for (const file of saved) heights.push((await imageSize(page, file.file))[1]);
  await check('after Yes the front and the back are saved, each 2000 px tall', async () => {
    expect(saved.map(file => file.name)).toEqual([
      '14_front_portrait_raw_white-front.jpg',
      '14_back_portrait_raw_white-back.jpg',
    ]);
    expect(heights).toEqual([SIZE_PX, SIZE_PX]);
  });
});

test('UPS-06.2 A side already at the size is saved the same after Yes as after No [phone]',
  async ({ page, check }, testInfo) => {
    const hand = await startOnPair(page, testInfo, 'separately');
    await tapSize(page, hand, '1080');
    await askBy(page, hand, 'btnDownload');
    await check('a card asks "Upscale to 1080 px?"', async () => {
      await expectQuestion(page, 'Upscale to 1080 px?');
    });
    const [frontNo, backNo] = await answerAndCollect(page, hand, 'No', 2);
    await check('after No the front is 748 × 1047 px and the back 1080 px tall', async () => {
      expect(await imageSize(page, frontNo.file)).toEqual(FRONT_PX);
      expect((await imageSize(page, backNo.file))[1]).toBe(1080);
    });
    await waitForExportEnd(page);
    const [frontYes, backYes] = await downloadAll(page, hand, 2, 'Yes');
    await check('after Yes the front is 1080 px tall; the back is byte for byte as after No',
      async () => {
        expect((await imageSize(page, frontYes.file))[1]).toBe(1080);
        expect(isSameFile(backYes.file, backNo.file)).toBe(true);
      });
  });

test('UPS-07.1 For the sheet it names the sheet\'s size, and Yes saves a 2000 px sheet '
  + '[phone] [webkit]', async ({ page, check }, testInfo) => {
  const hand = await startOnExport(page, testInfo);
  await openCornerSheet(page, hand);
  await askBy(page, hand, 'btnCornerDownload');
  await check(`a card asks "${ASK_2000}" and reads "${SHEET_TEXT}"`, async () => {
    await expectQuestion(page, ASK_2000, SHEET_TEXT);
  });
  const [saved] = await answerAndCollect(page, hand, 'Yes');
  await check('after Yes one 2000 × 2000 px sheet is saved; "Saved the corner sheet at 2000 px '
    + 'in …"', async () => {
    expect(await imageSize(page, saved.file)).toEqual([SIZE_PX, SIZE_PX]);
    await expect.poll(() => toastMessage(page))
      .toMatch(/^Saved the corner sheet at 2000 px in /);
  });
});

test('UPS-07.2 For four photos it names each corner\'s size, and Yes saves four 2000 px photos '
  + '[phone]', async ({ page, check }, testInfo) => {
  const hand = await startOnExport(page, testInfo);
  await chooseCornerOutput(page, hand, '4 photos');
  await askBy(page, hand, 'btnCornerDownload');
  await check(`a card asks "${ASK_2000}" and reads "${EACH_CORNER_TEXT}"`, async () => {
    await expectQuestion(page, ASK_2000, EACH_CORNER_TEXT);
  });
  const saved = await answerAndCollect(page, hand, 'Yes', 4);
  const sizes = [];
  for (const file of saved) sizes.push(await imageSize(page, file.file));
  await check('after Yes four files of 2000 × 2000 px are saved', async () => {
    expect(sizes).toEqual([1, 2, 3, 4].map(() => [SIZE_PX, SIZE_PX]));
  });
});

test('UPS-07.3 An upscaled sheet is bicubic whatever Interpolation says [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnExport(page, testInfo);
  await openCornerSheet(page, hand);
  const [bilinear] = await saveCorners(page, hand, 1, 'Yes');
  await check('sheet A of 2000 × 2000 px is saved', async () => {
    expect(await imageSize(page, bilinear.file)).toEqual([SIZE_PX, SIZE_PX]);
  });
  await waitForExportEnd(page);
  await closeCornerSheet(page, hand);
  await chooseInterpolation(page, hand, 'Bicubic (sharper, slower)');
  await check('the Interpolation row reads Bicubic', async () => {
    await expect(page.locator('#interpValue')).toHaveText('Bicubic');
  });
  await openCornerSheet(page, hand);
  const [bicubic] = await saveCorners(page, hand, 1, 'Yes');
  await check('sheet B is byte for byte sheet A', async () => {
    expect(isSameFile(bicubic.file, bilinear.file)).toBe(true);
  });
});

test('UPS-07.4 An upscaled sheet is sharpened [phone]', async ({ page, check }, testInfo) => {
  const hand = await startOnExport(page, testInfo);
  await openCornerSheet(page, hand);
  const [sharpened] = await saveCorners(page, hand, 1, 'Yes');
  await check('sheet A of 2000 × 2000 px is saved', async () => {
    expect(await imageSize(page, sharpened.file)).toEqual([SIZE_PX, SIZE_PX]);
  });
  await reopenOnExport(page, hand, NO_SHARPEN);
  await openCornerSheet(page, hand);
  const [plain] = await saveCorners(page, hand, 1, 'Yes');
  await check('with the sharpening off, sheet B of 2000 × 2000 px differs from sheet A',
    async () => {
      expect(await imageSize(page, plain.file)).toEqual([SIZE_PX, SIZE_PX]);
      expect(isSameFile(plain.file, sharpened.file)).toBe(false);
    });
});

test('UPS-08.1 The question sits above the open Corner shots sheet [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnExport(page, testInfo);
  await openCornerSheet(page, hand);
  await askBy(page, hand, 'btnCornerDownload');
  const card = page.locator('#pairPrompt .alert-card');
  await check(`a card asks "${ASK_2000}" in front of the sheet, which is dimmed behind it`,
    async () => {
      await expectQuestion(page, ASK_2000);
      expect(await topElementAt(page, page.locator('#btnPromptFirst'))).toBe('btnPromptFirst');
      expect(await topElementAt(page, page.locator('#btnPromptCancel'))).toBe('btnPromptCancel');
      expect(await topElementAt(page, page.locator('#cornerOutput'))).toBe('pairPrompt');
      await expect(card).toBeVisible();
    });
  await answerAndCollect(page, hand, 'Yes');
  await check('after Yes the card closes and the sheet is still open', async () => {
    await waitForQuestion(page, false);
    expect(await page.evaluate(() => window.CF.isSheetOpen(
      document.getElementById('cornerShotsSheet'),
    ))).toBe(true);
    await expect(page.locator('#btnCornerDownload')).toBeVisible();
  });
});

test('UPS-09.1 After Yes, the next Download asks again, and Undo has nothing to undo [phone]',
  async ({ page, check }, testInfo) => {
    const hand = await startOnExport(page, testInfo);
    const saved = await downloadAnswering(page, hand, 'Yes');
    await check('a 2000 × 2000 px file is saved; Undo is still greyed out', async () => {
      expect(await imageSize(page, saved.file)).toEqual([SIZE_PX, SIZE_PX]);
      await expect(page.locator('#btnUndo')).toBeDisabled();
    });
    await waitForExportEnd(page);
    await askBy(page, hand, 'btnDownload');
    await check(`Download asks "${ASK_2000}" again`, async () => {
      await expectQuestion(page, ASK_2000);
    });
  });

test('UPS-09.2 Share now shares the upscaled photo without asking again [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnExport(page, testInfo, { share: 'refuseOnce' });
  await askBy(page, hand, 'btnShare');
  await hand.tap(questionButton(page, 'Yes'));
  await waitForShares(page, 1);
  await waitForExportEnd(page);
  await check('after Share and Yes the share is refused; the red button reads Share now',
    async () => {
      await expect(page.locator('#btnShare .action-label')).toHaveText('Share now');
    });
  await hand.tap(page.locator('#btnShare'));
  await waitForShares(page, 2);
  const size = await sharedImageSize(page, 1, 0);
  await check('no question; the same 2000 × 2000 px file is shared', async () => {
    expect(await isQuestionUp(page)).toBe(false);
    expect(size).toEqual({ width: SIZE_PX, height: SIZE_PX });
    expect(await page.evaluate(() => window.testSharedFiles[0][0]
      === window.testSharedFiles[1][0])).toBe(true);
  });
});

test('UPS-10.2 Copy after Yes puts the enlarged photo on the clipboard [phone]', async ({
  page,
  context,
  browserName,
  check,
}, testInfo) => {
  test.skip(browserName !== 'chromium', 'Only Chromium lets a test read the clipboard back');
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const hand = await startOnExport(page, testInfo);
  await askBy(page, hand, 'btnCopy');
  await check(`a card asks "${ASK_2000}"`, async () => {
    await expectQuestion(page, ASK_2000);
  });
  await hand.tap(questionButton(page, 'Yes'));
  await check('"Copied to clipboard (PNG)."; the clipboard holds a 2000 × 2000 px PNG',
    async () => {
      await expect.poll(() => toastMessage(page)).toBe('Copied to clipboard (PNG).');
      const copied = await readClipboardImage(page);
      expect(copied.types).toContain('image/png');
      expect([copied.width, copied.height]).toEqual([SIZE_PX, SIZE_PX]);
    });
});
