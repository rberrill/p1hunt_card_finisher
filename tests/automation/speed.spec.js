// The speed cases (tests/catalog/speed.md): how long a photo takes to appear, detection, a
// pair's switch of sides, the export at each Size and an upscaled export.
// Each test times one operation once, records the time (the run folder's timings.jsonl and a
// note on the case's result) and holds it to its limit, approved by Rich in ruling R44: three
// times the median of the times measured on the development PC over five runs. A case that
// fails here is a slowdown to look at.
// Each test drives the app as a person would, through hand.tap (a finger on the phone
// targets, the mouse on the wide ones), and reads the app's own timings only to check a
// result. PERF-09 needs a real iPhone, so it has no test here.
'use strict';
const { test, expect } = require('./support/case.js');
const { openApp, openPhoto, goToStep, handFor, saveByDownload } = require('./support/app.js');
const {
  pickWith,
  waitForPhoto,
  enlargedSample,
} = require('./support/start-and-session.js');
const { choiceButton } = require('./support/export.js');
const { makePair, switchTo } = require('./support/front-and-back.js');
const {
  PHOTO,
  recordTiming,
  watchTapsAndDownloads,
  tapToDownloadMs,
} = require('./support/security-layout-speed.js');

// The case photo enlarged to a phone camera's size: IMG_9136.JPEG (1498 × 2098 px) 2.2 times,
// 3296 × 4616 px (15.2 MP), whose 1:1 crop (about 3080 px) is over every Size but Original.
const ENLARGE_FACTOR = 2.2;
const LARGE_PHOTO = 'IMG_9136-15MP.JPEG';
// The median of five runs of each operation on the development PC, in ms (Chromium, phone
// size), measured on 16 November 2026, one test at a time (Chromium 158, Windows 11).
const MEDIAN_MS = {
  preview: 407,
  detection: 2903,
  switchSides: 152,
  export1080: 163,
  export2000: 308,
  export3000: 544,
  exportOriginal: 548,
  upscaled: 1576,
};
// Each operation's limit, in ms, as Rich approved them in ruling R44 (three times the median,
// rounded up to the next 50 ms). Written out, not worked out, so they stay what was approved.
const LIMIT_MS = {
  preview: 1250,
  detection: 8750,
  switchSides: 500,
  export1080: 500,
  export2000: 950,
  export3000: 1650,
  exportOriginal: 1650,
  upscaled: 4750,
};

// Opens the app and opens the enlarged case photo with Open photo. Returns the hand.
async function openLargePhoto(page, testInfo) {
  await openApp(page);
  const hand = handFor(page, testInfo);
  const photo = await enlargedSample(page, PHOTO, ENLARGE_FACTOR, LARGE_PHOTO);
  await pickWith(page, hand, page.locator('#btnOpenEmpty'), photo);
  await waitForPhoto(page, LARGE_PHOTO);
  return hand;
}

// Records `durationMs` for `what` and checks it against its limit.
async function holdToLimit(check, testInfo, what, durationMs, description) {
  recordTiming(testInfo, what, durationMs);
  const limitMs = LIMIT_MS[what];
  await check(`${description} within ${limitMs} ms (ruling R44: 3 × the median of `
    + `${MEDIAN_MS[what]} ms)`,
    async () => {
      expect(Math.round(durationMs)).toBeLessThanOrEqual(limitMs);
    });
}

// The body of PERF-04 to PERF-07: on the enlarged photo, chooses `size` on Export, taps
// Download and times the tap to the file being saved.
async function timeExportAt(page, check, testInfo, size, what) {
  await watchTapsAndDownloads(page);
  const hand = await openLargePhoto(page, testInfo);
  await goToStep(page, 'export', hand);
  await hand.tap(choiceButton(page, 'exportSize', size));
  const saved = await saveByDownload(page, hand, 'No');
  await check('the file IMG_9136-15MP-straight.jpg is saved, with no Upscale question',
    async () => {
      expect(saved.name).toBe('IMG_9136-15MP-straight.jpg');
      expect(await page.locator('#pairPrompt').isVisible()).toBe(false);
    });
  const durationMs = await tapToDownloadMs(page, 'btnDownload');
  await holdToLimit(check, testInfo, what, durationMs, `from the tap on Download to the file, `
    + `at Size ${size},`);
}

test('PERF-01.1 A 15 MP photo is on screen [phone]', async ({ page, check }, testInfo) => {
  await openLargePhoto(page, testInfo);
  const durationMs = await page.evaluate(() => window.__straightener.app.loadDurationMs);
  await check('the photo, 3296 × 4616 px, is on screen', async () => {
    const size = await page.evaluate(() => {
      const img = window.__straightener.app.img;
      return [img.width, img.height];
    });
    expect(size).toEqual([3296, 4616]);
  });
  await holdToLimit(check, testInfo, 'preview', durationMs, 'from choosing it to the photo on '
    + 'screen,');
});

test('PERF-02.1 Detection on a 15 MP photo finishes [phone]', async ({
  page,
  check,
}, testInfo) => {
  await openLargePhoto(page, testInfo);
  const detection = await page.evaluate(() => {
    const app = window.__straightener.app;
    return { durationMs: app.detection.durationMs, candidates: app.detection.candidates.length };
  });
  await check('the card\'s corners are found', async () => {
    expect(detection.candidates).toBeGreaterThan(0);
  });
  await holdToLimit(check, testInfo, 'detection', detection.durationMs, 'from the start of '
    + 'finding the card to the corners placed,');
});

test('PERF-03.1 Switching sides in a pair [phone]', async ({ page, check }, testInfo) => {
  const hand = await makePair(page, testInfo);
  await switchTo(page, hand, 'front');
  const durationMs = await page.evaluate(() => window.__straightener.app.switchDurationMs);
  await check('the front is on screen, ready to edit', async () => {
    const name = await page.evaluate(() => window.__straightener.app.state.source.name);
    expect(name).toBe('14_front_portrait_raw_white.JPEG');
  });
  await holdToLimit(check, testInfo, 'switchSides', durationMs, 'from the tap on Front to the '
    + 'front on screen,');
});

test('PERF-04.1 An export at Size 1080 [phone]', async ({ page, check }, testInfo) => {
  await timeExportAt(page, check, testInfo, '1080', 'export1080');
});

test('PERF-05.1 An export at Size 2000 [phone]', async ({ page, check }, testInfo) => {
  await timeExportAt(page, check, testInfo, '2000', 'export2000');
});

test('PERF-06.1 An export at Size 3000 [phone]', async ({ page, check }, testInfo) => {
  await timeExportAt(page, check, testInfo, '3000', 'export3000');
});

test('PERF-07.1 An export at Size Original [phone]', async ({ page, check }, testInfo) => {
  await timeExportAt(page, check, testInfo, 'Original', 'exportOriginal');
});

test('PERF-08.1 An upscaled export [phone]', async ({ page, check }, testInfo) => {
  await watchTapsAndDownloads(page);
  await openApp(page);
  await openPhoto(page, PHOTO);
  const hand = handFor(page, testInfo);
  await goToStep(page, 'export', hand);
  const saved = await saveByDownload(page, hand, 'Yes');
  await check('Yes to "Upscale to 2000 px?" saves IMG_9136-straight.jpg', async () => {
    expect(saved.name).toBe('IMG_9136-straight.jpg');
  });
  const durationMs = await tapToDownloadMs(page, 'btnPromptFirst');
  await holdToLimit(check, testInfo, 'upscaled', durationMs, 'from the tap on Yes to the '
    + 'enlarged, sharpened file,');
});
