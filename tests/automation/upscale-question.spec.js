// The Upscale question's cases (tests/catalog/upscale-question.md): when it is asked for a
// single photo, a pair and the corner shots, what Yes, No and Cancel do, and that the answer
// counts for one export only.
// Each test drives the app as a person would, through hand.tap (a finger on the phone targets,
// the mouse on the wide ones), and reads the app's state only to check a result.
// Every row of a case has its own check, in order, described in the row's own words.
// No test opens a real share sheet: the page gets a stand-in (support/export.js).
'use strict';
const { test, expect } = require('./support/case.js');
const {
  goToStep,
  finishedMessage,
  copiedMessage,
} = require('./support/app.js');
const {
  waitForShares,
  waitForExportEnd,
  sharedImageSize,
  readClipboardImage,
  toastMessage,
  waitForQuestion,
  isSameFile,
  downloadAnswering,
  exportStarts,
} = require('./support/export.js');
const { PORTRAIT_PAIR, makePair, chooseOutput } = require('./support/front-and-back.js');
const { logoPlacement } = require('./support/overlay.js');
const {
  startOnExport,
  questionButton,
  expectQuestion,
  isQuestionUp,
  isCornerSheetOpen,
  imageSize,
  collectDownloads,
  downloadsAfterWait,
  downloadsArrived,
  regionFingerprint,
  topElementAt,
  openPicker,
  chooseFixtureLogo,
  downloadCorners,
} = require('./support/corner-shots.js');
const {
  QUESTION_BOX,
  askAndCheck,
  answerAndCheckClosed,
  chooseAndCheck,
  openCornerSheetAndCheck,
  closeCornerSheetAndCheck,
  setBicubicAndCheck,
  reopenAndCheck,
  resumeAndCheck,
  downloadButton,
} = require('./support/questions.js');

// The case photo, its crop at its own resolution, in px, and the question's line for it.
const PHOTO = '01_chrome_flat_black.JPEG';
const CROP_PX = 1074;
const CROP_TEXT = `The crop is ${CROP_PX} × ${CROP_PX} px at the photo’s resolution.`;
// The size the question offers by default, in px.
const SIZE_PX = 2000;
const ASK_2000 = `Upscale to ${SIZE_PX} px?`;
const ASK_1080 = 'Upscale to 1080 px?';
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
// The line at 1080, where the back's file is held to 1080 px: it names only the front, the
// side Yes would upscale (ruling R50).
const SEPARATELY_1080_TEXT = 'The front is 748 × 1047 px at the photo’s resolution.';
// A link that turns upscaling on and asks for 12000 px, which the 16.7 MP canvas limit holds
// back; and the size the limit holds each of the pair's two files at, in px.
const OVER_LIMIT_LINK = 'index.html?export.allowUpscale=1&export.longEdge=12000';
const HELD_BACK_PX = [3461, 4846];
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
// How far down the page a tap on the dimmed screen above the question box lands, in CSS px.
const ABOVE_BOX_Y_PX = 150;
// The logo the case adds, from tests/fixtures/: the app's icon, an opaque square with a drawing
// in it, so that sharpening would change the pixels inside it.
const LOGO = 'app-icon-logo.png';
// How far the logo's middle may be from the photo's middle, as a fraction of the crop.
const MIDDLE_TOLERANCE = 0.01;
// The first row's words for the question box, with its definition.
const FIRST_ASK = `${QUESTION_BOX} asks "${ASK_2000}"`;
const shareButton = page => page.locator('#btnShare');
const copyButton = page => page.locator('#btnCopy');
// The sizes selected on Export, by their labels.
const selectedSizes = page => page.locator('#exportSize .segment[aria-pressed="true"]')
  .allTextContents();

// Answers the question box that is up with `answer` and waits for `count` downloads. Returns
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

// Taps Download and, as a row where no question box should show, lets the file come: a
// question box that does show is answered No so the case can still report the file. Returns
// { name, file, wasAsked }.
async function saveWithoutQuestion(page, hand) {
  const saved = await downloadAnswering(page, hand, 'No');
  return { name: saved.name, file: saved.file, wasAsked: saved.question !== '' };
}

// The verdict that a saved image is `width` × `height` px.
async function expectSize(page, file, width, height = width) {
  expect(await imageSize(page, file)).toEqual([width, height]);
}

test('UPS-01.1 Download, Share and Copy each ask first, naming the size and the crop [phone]',
  async ({ page, check }, testInfo) => {
    const hand = await startOnExport(page, testInfo);
    await askAndCheck(page, hand, check, downloadButton(page),
      `${FIRST_ASK} and reads "${CROP_TEXT}"`, ASK_2000, CROP_TEXT);
    await answerAndCheckClosed(page, hand, check, 'Cancel', 'the question box closes');
    await askAndCheck(page, hand, check, shareButton(page),
      `the question box asks "${ASK_2000}" and reads "${CROP_TEXT}"`, ASK_2000, CROP_TEXT);
    await answerAndCheckClosed(page, hand, check, 'Cancel', 'the question box closes');
    await askAndCheck(page, hand, check, copyButton(page),
      `the question box asks "${ASK_2000}" and reads "${CROP_TEXT}"`, ASK_2000, CROP_TEXT);
    await answerAndCheckClosed(page, hand, check, 'Cancel', 'the question box closes');
    await chooseAndCheck(page, hand, check, 'exportSize', '1080');
    await askAndCheck(page, hand, check, downloadButton(page),
      `the question box asks "${ASK_1080}" and reads "${CROP_TEXT}"`, ASK_1080, CROP_TEXT);
  });

test('UPS-02.1 Yes saves the photo at the chosen size [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnExport(page, testInfo);
  await askAndCheck(page, hand, check, downloadButton(page), FIRST_ASK, ASK_2000);
  const [saved] = await answerAndCollect(page, hand, 'Yes');
  await check('the question box closes and a 2000 × 2000 px file is saved; a message begins '
    + '"Photo downloaded: 2000 × 2000 px in"', async () => {
    expect(await isQuestionUp(page)).toBe(false);
    await expectSize(page, saved.file, SIZE_PX);
    const finished = finishedMessage('photo', 'downloaded', '2000 × 2000 px');
    await expect.poll(() => toastMessage(page)).toMatch(finished);
  });
});

test('UPS-02.2 Yes sharpens the enlarged photo [phone]', async ({ page, check }, testInfo) => {
  const hand = await startOnExport(page, testInfo);
  await askAndCheck(page, hand, check, downloadButton(page), FIRST_ASK, ASK_2000);
  const [sharpened] = await answerAndCollect(page, hand, 'Yes');
  await check('file A, of 2000 × 2000 px, is saved', async () => {
    await expectSize(page, sharpened.file, SIZE_PX);
  });
  await waitForExportEnd(page);
  await reopenAndCheck(page, check, NO_SHARPEN, PHOTO);
  await resumeAndCheck(page, hand, check, 'the photo opens on the Export step, with 2000 selected',
    async () => {
      expect(await selectedSizes(page)).toEqual(['2000']);
    });
  await askAndCheck(page, hand, check, downloadButton(page),
    `the question box asks "${ASK_2000}"`, ASK_2000);
  const [plain] = await answerAndCollect(page, hand, 'Yes');
  await check('file B, of 2000 × 2000 px, is saved', async () => {
    await expectSize(page, plain.file, SIZE_PX);
  });
  await check('files A and B differ: only A was sharpened', async () => {
    expect(isSameFile(plain.file, sharpened.file)).toBe(false);
  });
});

// Where the logo is in a 2000 px export, { x, y, width, height } in px, inset by LOGO_INSET_PX
// on every side.
async function logoInExport(page) {
  const logo = await page.evaluate(sizePx => window.CardEngine.overlayRect(
    window.__straightener.app.state.overlay,
    sizePx,
    sizePx,
  ), SIZE_PX);
  return {
    x: Math.ceil(logo.x) + LOGO_INSET_PX,
    y: Math.ceil(logo.y) + LOGO_INSET_PX,
    width: Math.floor(logo.width) - 2 * LOGO_INSET_PX,
    height: Math.floor(logo.height) - 2 * LOGO_INSET_PX,
  };
}

// The verdict that the logo sits in the middle of the photo.
async function expectLogoInMiddle(page) {
  const placed = await logoPlacement(page);
  expect(Math.abs(placed.cx - 0.5)).toBeLessThan(MIDDLE_TOLERANCE);
  expect(Math.abs(placed.cy - 0.5)).toBeLessThan(MIDDLE_TOLERANCE);
}

test('UPS-02.3 The logo goes on after the sharpening [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnExport(page, testInfo, { step: 'overlay' });
  // Add the logo, the case's named action: Add logo, then the fixture in the picker.
  const chooser = await openPicker(page, hand, page.locator('#btnOverlayAdd'));
  await chooseFixtureLogo(page, chooser, LOGO);
  await check('the logo shows in the middle of the photo', async () => {
    await expectLogoInMiddle(page);
  });
  await goToStep(page, 'export', hand);
  await check('the Export step shows, with 2000 selected', async () => {
    expect(await page.evaluate(() => window.__straightener.app.tab)).toBe('export');
    expect(await selectedSizes(page)).toEqual(['2000']);
  });
  await chooseAndCheck(page, hand, check, 'exportFormat', 'PNG');
  await askAndCheck(page, hand, check, downloadButton(page), FIRST_ASK, ASK_2000);
  const [sharpened] = await answerAndCollect(page, hand, 'Yes');
  const logo = await logoInExport(page);
  await check('PNG file A, of 2000 × 2000 px, is saved, with the logo in its middle', async () => {
    expect(sharpened.name.endsWith('.png')).toBe(true);
    await expectSize(page, sharpened.file, SIZE_PX);
    expect(logo.x).toBeGreaterThan(PHOTO_PATCH.x + PHOTO_PATCH.width);
    expect(Math.abs(logo.x + logo.width / 2 - SIZE_PX / 2)).toBeLessThan(LOGO_INSET_PX);
  });
  await waitForExportEnd(page);
  await reopenAndCheck(page, check, NO_SHARPEN, PHOTO);
  await resumeAndCheck(page, hand, check, 'the photo opens on the Export step, the logo in its '
    + 'middle, PNG selected', async () => {
    await expectLogoInMiddle(page);
    expect(await page.locator('#exportFormat .segment[aria-pressed="true"]').allTextContents())
      .toEqual(['PNG']);
  });
  await askAndCheck(page, hand, check, downloadButton(page),
    `the question box asks "${ASK_2000}"`, ASK_2000);
  const [plain] = await answerAndCollect(page, hand, 'Yes');
  await check('PNG file B, of 2000 × 2000 px, is saved', async () => {
    await expectSize(page, plain.file, SIZE_PX);
  });
  const logoA = await regionFingerprint(page, sharpened.file, logo);
  const logoB = await regionFingerprint(page, plain.file, logo);
  const photoA = await regionFingerprint(page, sharpened.file, PHOTO_PATCH);
  const photoB = await regionFingerprint(page, plain.file, PHOTO_PATCH);
  await check('inside the logo every pixel is the same in both; in the photo away from it, they '
    + 'differ', async () => {
    expect(logoB).toBe(logoA);
    expect(photoB).not.toBe(photoA);
  });
});

test('UPS-03.1 No saves the photo at its own size [phone]', async ({ page, check }, testInfo) => {
  const hand = await startOnExport(page, testInfo);
  await askAndCheck(page, hand, check, downloadButton(page), FIRST_ASK, ASK_2000);
  const [saved] = await answerAndCollect(page, hand, 'No');
  await check(`the question box closes and a ${CROP_PX} × ${CROP_PX} px file is saved; a `
    + `message begins "Photo downloaded: ${CROP_PX} × ${CROP_PX} px in"`, async () => {
    expect(await isQuestionUp(page)).toBe(false);
    await expectSize(page, saved.file, CROP_PX);
    const finished = finishedMessage('photo', 'downloaded', '1074 × 1074 px');
    await expect.poll(() => toastMessage(page)).toMatch(finished);
  });
});

test('UPS-03.2 Cancel and a tap outside the question box save nothing [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnExport(page, testInfo, { isWatched: true });
  const collector = collectDownloads(page);
  await askAndCheck(page, hand, check, downloadButton(page), FIRST_ASK, ASK_2000);
  await hand.tap(questionButton(page, 'Cancel'));
  const afterCancel = await downloadsAfterWait(page, collector, NOTHING_SAVED_WAIT_MS);
  await check('the question box closes; nothing is saved, and no progress line runs', async () => {
    expect(await isQuestionUp(page)).toBe(false);
    expect(afterCancel).toBe(0);
    expect(await exportStarts(page)).toEqual([]);
  });
  await askAndCheck(page, hand, check, downloadButton(page),
    `the question box asks "${ASK_2000}" again`, ASK_2000);
  await page.touchscreen.tap(page.viewportSize().width / 2, ABOVE_BOX_Y_PX);
  const afterOutside = await downloadsAfterWait(page, collector, NOTHING_SAVED_WAIT_MS);
  collector.stop();
  await check('a tap on the dimmed screen closes the question box; nothing is saved', async () => {
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
  await askAndCheck(page, hand, check, downloadButton(page), FIRST_ASK, ASK_2000);
  await page.keyboard.press('Escape');
  const count = await downloadsAfterWait(page, collector, NOTHING_SAVED_WAIT_MS);
  collector.stop();
  await check('Escape closes the question box; nothing is saved', async () => {
    expect(await isQuestionUp(page)).toBe(false);
    expect(count).toBe(0);
  });
});

test('UPS-04.1 Original never asks [phone]', async ({ page, check }, testInfo) => {
  const hand = await startOnExport(page, testInfo);
  await chooseAndCheck(page, hand, check, 'exportSize', 'Original');
  const saved = await saveWithoutQuestion(page, hand);
  await check(`no question box shows; a ${CROP_PX} × ${CROP_PX} px file is saved`, async () => {
    expect(saved.wasAsked).toBe(false);
    await expectSize(page, saved.file, CROP_PX);
  });
});

test('UPS-04.2 A crop already over the size isn\'t asked about [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnExport(page, testInfo, { photo: LARGE_CROP_PHOTO });
  await chooseAndCheck(page, hand, check, 'exportSize', '1080');
  const saved = await saveWithoutQuestion(page, hand);
  await check('no question box shows; a 1080 × 1080 px file is saved', async () => {
    expect(saved.wasAsked).toBe(false);
    await expectSize(page, saved.file, 1080);
  });
  await waitForExportEnd(page);
  await chooseAndCheck(page, hand, check, 'exportSize', '2000');
  await askAndCheck(page, hand, check, downloadButton(page),
    `the question box asks "${ASK_2000}"`, ASK_2000);
});

test('UPS-04.3 With upscaling on from a link, there is no question [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnExport(page, testInfo, {
    address: 'index.html?export.allowUpscale=1',
  });
  const saved = await saveWithoutQuestion(page, hand);
  await check('no question box shows; a 2000 × 2000 px file is saved', async () => {
    expect(saved.wasAsked).toBe(false);
    await expectSize(page, saved.file, SIZE_PX);
  });
});

test('UPS-04.4 With upscaling on from a link, a size the canvas limit holds back isn\'t asked '
  + 'about either [phone]', async ({ page, check }, testInfo) => {
  const hand = await startOnExport(page, testInfo, { address: OVER_LIMIT_LINK });
  const saved = await saveWithoutQuestion(page, hand);
  await check('no question box shows; a 4096 × 4096 px file is saved', async () => {
    expect(saved.wasAsked).toBe(false);
    await expectSize(page, saved.file, 4096);
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
  await askAndCheck(page, hand, check, downloadButton(page),
    `${FIRST_ASK} and reads "${TOGETHER_TEXT}"`, ASK_2000, TOGETHER_TEXT);
  const [saved] = await answerAndCollect(page, hand, 'Yes');
  const [width, height] = await imageSize(page, saved.file);
  await check('one file, 14_front_portrait_raw_white-pair.jpg, is saved: 2000 px wide and about '
    + '1390 px tall (within 2 px)', async () => {
    expect(saved.name).toBe('14_front_portrait_raw_white-pair.jpg');
    expect(width).toBe(SIZE_PX);
    expect(Math.abs(height - FITTED_HEIGHT_PX)).toBeLessThanOrEqual(FITTED_TOLERANCE_PX);
  });
});

test('UPS-05.2 Where a canvas cap leaves no room to enlarge the joined image, no question is '
  + 'asked [phone]', async ({ page, check }, testInfo) => {
  const hand = await startOnPair(page, testInfo, 'together', AREA_CAP_LINK);
  // If a question box does show, a Yes lets the file come so the case can report its size.
  const saved = await downloadAnswering(page, hand, 'Yes');
  const size = await imageSize(page, saved.file);
  await check('no question box shows; one file, 14_front_portrait_raw_white-pair.jpg, is saved '
    + 'at 1583 × 1100 px', async () => {
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
  await askAndCheck(page, hand, check, downloadButton(page),
    `${FIRST_ASK} and reads "${SEPARATELY_TEXT}"`, ASK_2000, SEPARATELY_TEXT);
  const saved = await answerAndCollect(page, hand, 'Yes', 2);
  const heights = [];
  for (const file of saved) heights.push((await imageSize(page, file.file))[1]);
  await check('two files are saved, 14_front_portrait_raw_white-front.jpg and '
    + '14_back_portrait_raw_white-back.jpg, each 2000 px tall', async () => {
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
    await chooseAndCheck(page, hand, check, 'exportSize', '1080');
    await askAndCheck(page, hand, check, downloadButton(page),
      `${QUESTION_BOX} asks "${ASK_1080}" and reads "${SEPARATELY_1080_TEXT}"`, ASK_1080,
      SEPARATELY_1080_TEXT);
    const [frontNo, backNo] = await answerAndCollect(page, hand, 'No', 2);
    await check('two files are saved: the front 748 × 1047 px, the back 1080 px tall', async () => {
      expect(await imageSize(page, frontNo.file)).toEqual(FRONT_PX);
      expect((await imageSize(page, backNo.file))[1]).toBe(1080);
    });
    await waitForExportEnd(page);
    await askAndCheck(page, hand, check, downloadButton(page),
      `the question box asks "${ASK_1080}" again`, ASK_1080);
    const [frontYes, backYes] = await answerAndCollect(page, hand, 'Yes', 2);
    await check('two more files are saved: the front now 1080 px tall; the back byte for byte '
      + 'the same as after No', async () => {
      expect((await imageSize(page, frontYes.file))[1]).toBe(1080);
      expect(isSameFile(backYes.file, backNo.file)).toBe(true);
    });
  });

test('UPS-06.3 Where the canvas limit leaves no room to enlarge either side, no question is '
  + 'asked [phone]', async ({ page, check }, testInfo) => {
  const hand = await startOnPair(page, testInfo, 'separately', OVER_LIMIT_LINK);
  const collector = collectDownloads(page);
  let question;
  let saved;
  try {
    // If a question box does show, a No lets the files come so the case can report them.
    question = (await downloadAnswering(page, hand, 'No')).question;
    saved = await downloadsArrived(page, collector, 2);
  } finally {
    collector.stop();
  }
  const sizes = [];
  for (const file of saved) sizes.push(await imageSize(page, file.file));
  await check('no question box shows; two files are saved, 14_front_portrait_raw_white-front.jpg '
    + 'and 14_back_portrait_raw_white-back.jpg, each 3461 × 4846 px', async () => {
    expect(question).toBe('');
    expect(saved.map(file => file.name)).toEqual([
      '14_front_portrait_raw_white-front.jpg',
      '14_back_portrait_raw_white-back.jpg',
    ]);
    expect(sizes).toEqual([HELD_BACK_PX, HELD_BACK_PX]);
  });
});

test('UPS-07.1 For the sheet it names the sheet\'s size, and Yes saves a 2000 px sheet '
  + '[phone] [webkit]', async ({ page, check }, testInfo) => {
  const hand = await startOnExport(page, testInfo);
  await openCornerSheetAndCheck(page, hand, check, '1 sheet');
  await askAndCheck(page, hand, check, downloadCorners(page),
    `${FIRST_ASK} and reads "${SHEET_TEXT}"`, ASK_2000, SHEET_TEXT);
  const [saved] = await answerAndCollect(page, hand, 'Yes');
  await check('one file of exactly 2000 × 2000 px is saved; a message begins "Corner sheet '
    + 'downloaded: 2000 × 2000 px in"', async () => {
    await expectSize(page, saved.file, SIZE_PX);
    await expect.poll(() => toastMessage(page))
      .toMatch(finishedMessage('cornerSheet', 'downloaded', '2000 × 2000 px'));
  });
});

test('UPS-07.2 For four photos it names each corner\'s size, and Yes saves four 2000 px photos '
  + '[phone]', async ({ page, check }, testInfo) => {
  const hand = await startOnExport(page, testInfo);
  await openCornerSheetAndCheck(page, hand, check, '1 sheet');
  await chooseAndCheck(page, hand, check, 'cornerOutput', '4 photos');
  await askAndCheck(page, hand, check, downloadCorners(page),
    `${FIRST_ASK} and reads "${EACH_CORNER_TEXT}"`, ASK_2000, EACH_CORNER_TEXT);
  const saved = await answerAndCollect(page, hand, 'Yes', 4);
  const sizes = [];
  for (const file of saved) sizes.push(await imageSize(page, file.file));
  await check('four files of 2000 × 2000 px are saved', async () => {
    expect(sizes).toEqual([1, 2, 3, 4].map(() => [SIZE_PX, SIZE_PX]));
  });
});

test('UPS-07.3 An upscaled sheet is bicubic whatever Interpolation says [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnExport(page, testInfo);
  await openCornerSheetAndCheck(page, hand, check, '1 sheet');
  await askAndCheck(page, hand, check, downloadCorners(page), FIRST_ASK, ASK_2000);
  const [bilinear] = await answerAndCollect(page, hand, 'Yes');
  await check('sheet A, of 2000 × 2000 px, is saved', async () => {
    await expectSize(page, bilinear.file, SIZE_PX);
  });
  await waitForExportEnd(page);
  await closeCornerSheetAndCheck(page, hand, check);
  await setBicubicAndCheck(page, hand, check);
  // Save the sheet enlarged, the case's named action: Corner shots, Download corners, Yes.
  await hand.tap(page.locator('#btnCornerShots'));
  await page.waitForFunction(() => window.CF.isSheetOpen(
    document.getElementById('cornerShotsSheet'),
  ));
  await hand.tap(downloadCorners(page));
  await expectQuestion(page, ASK_2000);
  const [bicubic] = await answerAndCollect(page, hand, 'Yes');
  await check('sheet B, of 2000 × 2000 px, is saved', async () => {
    await expectSize(page, bicubic.file, SIZE_PX);
  });
  await check('sheets A and B are the same, byte for byte', async () => {
    expect(isSameFile(bicubic.file, bilinear.file)).toBe(true);
  });
});

test('UPS-07.4 An upscaled sheet is sharpened [phone]', async ({ page, check }, testInfo) => {
  const hand = await startOnExport(page, testInfo);
  await openCornerSheetAndCheck(page, hand, check, '1 sheet');
  await askAndCheck(page, hand, check, downloadCorners(page), FIRST_ASK, ASK_2000);
  const [sharpened] = await answerAndCollect(page, hand, 'Yes');
  await check('sheet A, of 2000 × 2000 px, is saved', async () => {
    await expectSize(page, sharpened.file, SIZE_PX);
  });
  await waitForExportEnd(page);
  await reopenAndCheck(page, check, NO_SHARPEN, PHOTO);
  await resumeAndCheck(page, hand, check, 'the photo opens on the Export step');
  await openCornerSheetAndCheck(page, hand, check, '1 sheet');
  await askAndCheck(page, hand, check, downloadCorners(page),
    `the question box asks "${ASK_2000}"`, ASK_2000);
  const [plain] = await answerAndCollect(page, hand, 'Yes');
  await check('sheet B, of 2000 × 2000 px, is saved', async () => {
    await expectSize(page, plain.file, SIZE_PX);
  });
  await check('sheets A and B differ: only A was sharpened', async () => {
    expect(isSameFile(plain.file, sharpened.file)).toBe(false);
  });
});

test('UPS-08.1 The question sits above the open Corner shots sheet [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnExport(page, testInfo);
  await openCornerSheetAndCheck(page, hand, check);
  await askAndCheck(page, hand, check, downloadCorners(page),
    `${FIRST_ASK} in front of the Corner shots sheet: the whole box shows, and the sheet behind `
    + 'it is dimmed', ASK_2000);
  await check('the whole box is on top, and the sheet is under the dim', async () => {
    await expect(page.locator('#pairPrompt .alert-card')).toBeInViewport({ ratio: 1 });
    expect(await topElementAt(page, page.locator('#btnPromptFirst'))).toBe('btnPromptFirst');
    expect(await topElementAt(page, page.locator('#btnPromptCancel'))).toBe('btnPromptCancel');
    expect(await topElementAt(page, page.locator('#cornerOutput'))).toBe('pairPrompt');
  });
  await answerAndCollect(page, hand, 'Yes');
  await check('the question box closes and the sheet is still open, with Download corners in '
    + 'view', async () => {
    await waitForQuestion(page, false);
    expect(await isCornerSheetOpen(page)).toBe(true);
    await expect(downloadCorners(page)).toBeInViewport();
  });
});

test('UPS-09.1 After Yes, the next Download asks again, and Undo has nothing to undo [phone]',
  async ({ page, check }, testInfo) => {
    const hand = await startOnExport(page, testInfo);
    await askAndCheck(page, hand, check, downloadButton(page), FIRST_ASK, ASK_2000);
    const [saved] = await answerAndCollect(page, hand, 'Yes');
    await check('a 2000 × 2000 px file is saved; Undo is still greyed out', async () => {
      await expectSize(page, saved.file, SIZE_PX);
      await expect(page.locator('#btnUndo')).toBeDisabled();
    });
    await waitForExportEnd(page);
    await askAndCheck(page, hand, check, downloadButton(page),
      `the question box asks "${ASK_2000}" again`, ASK_2000);
  });

test('UPS-09.2 Share now shares the upscaled photo without asking again [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnExport(page, testInfo, { share: 'refuseOnce' });
  await askAndCheck(page, hand, check, shareButton(page), FIRST_ASK, ASK_2000);
  await hand.tap(questionButton(page, 'Yes'));
  await waitForShares(page, 1);
  await waitForExportEnd(page);
  await check('the share is refused; the red button reads Share now', async () => {
    await expect(page.locator('#btnShare .action-label')).toHaveText('Share now');
  });
  await hand.tap(shareButton(page));
  await waitForShares(page, 2);
  const size = await sharedImageSize(page, 1, 0);
  await check('no question is asked; the share sheet is handed the same 2000 × 2000 px file again',
    async () => {
      expect(await isQuestionUp(page)).toBe(false);
      expect(size).toEqual({ width: SIZE_PX, height: SIZE_PX });
      expect(await page.evaluate(() => window.testSharedFiles[0][0]
        === window.testSharedFiles[1][0])).toBe(true);
    });
});

test('UPS-09.3 After Yes and a reload, the resumed photo asks again [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnExport(page, testInfo);
  await askAndCheck(page, hand, check, downloadButton(page), FIRST_ASK, ASK_2000);
  const [saved] = await answerAndCollect(page, hand, 'Yes');
  await check('a file of 2000 × 2000 px is saved', async () => {
    await expectSize(page, saved.file, SIZE_PX);
  });
  await waitForExportEnd(page);
  await reopenAndCheck(page, check, null, PHOTO);
  await resumeAndCheck(page, hand, check, 'the photo opens on the Export step, with 2000 selected',
    async () => {
      expect(await selectedSizes(page)).toEqual(['2000']);
    });
  await askAndCheck(page, hand, check, downloadButton(page),
    `the question box asks "${ASK_2000}" again`, ASK_2000);
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
  await askAndCheck(page, hand, check, copyButton(page), FIRST_ASK, ASK_2000);
  await hand.tap(questionButton(page, 'Yes'));
  await check(`a message reads "${copiedMessage()}"; the clipboard holds a PNG of `
    + '2000 × 2000 px', async () => {
    await expect.poll(() => toastMessage(page)).toBe(copiedMessage());
    const copied = await readClipboardImage(page);
    expect(copied.types).toContain('image/png');
    expect([copied.width, copied.height]).toEqual([SIZE_PX, SIZE_PX]);
  });
});
