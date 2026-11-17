// The speed cases (tests/catalog/speed.md): how long a photo takes to appear, detection, a
// pair's switch of sides, the export at each Size and an upscaled export.
// Each test times one operation once, from the same number a person reads (the Console's line,
// the tuning panel's line or the finished message), records it (the run folder's timings.jsonl
// and a note on the case's result) and holds it to its limit, from ruling R44: three times the
// median of the times measured on the development PC over five runs. A case that fails here is
// a slowdown to look at.
// Each test drives the app as a person would, through hand.tap (a finger on the phone
// targets, the mouse on the wide ones), and reads the app's state only to check a result.
// PERF-01.2, PERF-02.2 and PERF-09 need a real iPhone, so they have no test here.
'use strict';
const { test, expect } = require('./support/case.js');
const {
  openApp,
  openPhoto,
  goToStep,
  handFor,
  readSavedImage,
} = require('./support/app.js');
const {
  pickWith,
  waitForPhoto,
  enlargedSample,
} = require('./support/start-and-session.js');
const {
  choiceButton,
  selectedChoices,
  readoutText,
} = require('./support/export.js');
const { makePair, switchTo } = require('./support/front-and-back.js');
const { watchMessages, waitForMessage } = require('./support/messages.js');
const {
  PHOTO,
  recordTiming,
  watchConsole,
  linesStarting,
  isOnFoundCard,
  tapDownload,
  answerForFile,
} = require('./support/security-layout-speed.js');

// The case photo enlarged to a phone camera's size: IMG_9136.JPEG (1498 × 2098 px) 2.2 times,
// 3296 × 4616 px (15.2 MP), whose 1:1 crop (about 3080 px) is over every Size but Original.
const ENLARGE_FACTOR = 2.2;
const LARGE_PHOTO = 'IMG_9136-15MP.JPEG';
const LARGE_SIZE_PX = [3296, 4616];
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
// Each operation's limit, in ms, from ruling R44 (three times the median, rounded up to the
// next 50 ms). Written out, not worked out, so they stay what the ruling gives.
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
// Milliseconds in a second: the finished message gives its time in seconds.
const MS_PER_SECOND = 1000;
// The words of the Console's line for a photo on screen, and for a switch of sides; the
// number of ms is the line's last number.
const PREVIEW_LINE = `[card-finisher] ${LARGE_PHOTO}: ${LARGE_SIZE_PX.join('×')} loaded + `
  + 'previewed in ';
const SWITCH_LINE = '[card-finisher] switched to the front in ';
// The tuning panel's first line: "round trip N ms (analyze …".
const ROUND_TRIP_PATTERN = /^round trip (\d+) ms/;
// Original's picture is the crop at the photo's own resolution: about 3080 px across for the
// enlarged photo, over the largest Size (3000), which shows it is not a scaled-down copy.
const ORIGINAL_SIDE_FLOOR_PX = 3000;

// Opens the app at `address` and opens the enlarged case photo with Open photo. Returns the
// hand.
async function openLargePhoto(page, testInfo, address = 'index.html') {
  await openApp(page, address);
  const hand = handFor(page, testInfo);
  const photo = await enlargedSample(page, PHOTO, ENLARGE_FACTOR, LARGE_PHOTO);
  await pickWith(page, hand, page.locator('#btnOpenEmpty'), photo);
  await waitForPhoto(page, LARGE_PHOTO);
  return hand;
}

// Records `durationMs` for `what` and checks it against its limit. description: the number
// checked, as the case's row names it.
async function holdToLimit(check, testInfo, what, durationMs, description) {
  recordTiming(testInfo, what, durationMs);
  const limitMs = LIMIT_MS[what];
  await check(`${description} is at most ${limitMs} ms (ruling R44: 3 × the median of `
    + `${MEDIAN_MS[what]} ms)`,
    async () => {
      expect(Math.round(durationMs)).toBeLessThanOrEqual(limitMs);
    });
}

// The number of ms at the end of the one Console line in `messages` that starts with `start`
// ("… in 407 ms"). Fails the case when there is not exactly one such line.
function msFromLine(messages, start) {
  const lines = linesStarting(messages, start);
  expect(lines.map(line => line.text)).toEqual([expect.stringMatching(/ in \d+ ms$/)]);
  return Number(lines[0].text.slice(start.length).replace(' ms', ''));
}

// The pattern of the finished message for a saved picture `width` × `height` px; its one group
// is the time, in seconds to a tenth.
function exportedPattern(width, height) {
  return new RegExp(`^Exported ${width} × ${height} px in (\\d+\\.\\d) s\\.$`);
}

// Waits for the finished message of a picture `width` × `height` px and returns its time in
// ms, from the seconds it gives.
async function exportedMs(page, width, height) {
  const pattern = exportedPattern(width, height);
  const message = await waitForMessage(page, pattern);
  return Number(message.text.match(pattern)[1]) * MS_PER_SECOND;
}

// Taps Download, which saves the file with no question first. Returns { question, name, file }.
async function downloadWithoutQuestion(page, hand) {
  const { question, downloading } = await tapDownload(page, hand);
  const download = await downloading;
  return { question, name: download.suggestedFilename(), file: await download.path() };
}

// The size the size line gives ("Output 3080 × 3080 px · JPEG"), in px: [width, height].
async function sizeLinePx(page) {
  const text = await readoutText(page);
  const match = text.match(/^Output (\d+) × (\d+) px/);
  return match ? [Number(match[1]), Number(match[2])] : [];
}

// The body of PERF-04 to PERF-07: on the enlarged photo, taps `size` on Export (row 1), taps
// Download (row 2: the file, no question, its size and the finished message) and holds the
// message's time to the limit (row 3). sidePx: the picture's side at that Size, or null for
// Original, whose size is the one the size line gives.
async function timeExportAt(page, check, testInfo, size, what, sidePx) {
  await watchMessages(page);
  const hand = await openLargePhoto(page, testInfo);
  await goToStep(page, 'export', hand);
  await hand.tap(choiceButton(page, 'exportSize', size));
  const wantedPx = sidePx ? [sidePx, sidePx] : await sizeLinePx(page);
  const sizeText = sidePx ? '' : `; the size line gives over ${ORIGINAL_SIDE_FLOOR_PX} px`;
  await check(`${size} is selected${sizeText}`, async () => {
    expect(await selectedChoices(page, 'exportSize')).toEqual([size]);
    if (!sidePx) expect(wantedPx[0]).toBeGreaterThan(ORIGINAL_SIDE_FLOOR_PX);
  });
  const saved = await downloadWithoutQuestion(page, hand);
  const savedImage = await readSavedImage(page, saved.file);
  const durationMs = await exportedMs(page, wantedPx[0], wantedPx[1]);
  await check(`IMG_9136-15MP-straight.jpg is saved, ${wantedPx.join(' × ')} px, with no `
    + `question first; the message reads "Exported ${wantedPx.join(' × ')} px in N s."`,
    async () => {
      expect(saved.question).toBe('');
      expect(saved.name).toBe('IMG_9136-15MP-straight.jpg');
      expect([savedImage.width, savedImage.height]).toEqual(wantedPx);
    });
  await holdToLimit(check, testInfo, what, durationMs, `the message's N, from the tap on `
    + `Download to the file at Size ${size},`);
}

test('PERF-01.1 A 15 MP photo is on screen [phone]', async ({ page, check }, testInfo) => {
  const messages = watchConsole(page);
  await openLargePhoto(page, testInfo);
  await check('the photo, 3296 × 4616 px, is on screen, ready to edit', async () => {
    const shown = await page.evaluate(() => {
      const app = window.__straightener.app;
      return { size: [app.img.width, app.img.height], step: app.tab };
    });
    expect(shown).toEqual({ size: LARGE_SIZE_PX, step: 'perspective' });
    await expect(page.locator('#btnOpenEmpty')).toBeHidden();
    await expect(page.locator('#view')).toBeVisible();
  });
  const durationMs = msFromLine(messages, PREVIEW_LINE);
  await holdToLimit(check, testInfo, 'preview', durationMs, 'the Console line\'s N, from '
    + 'choosing the photo to the photo on screen,');
});

test('PERF-02.1 Detection on a 15 MP photo finishes [desktop]', async ({
  page,
  check,
}, testInfo) => {
  await openLargePhoto(page, testInfo, 'index.html?debug=1');
  await check('the card\'s corners are placed on the card', async () => {
    expect(await isOnFoundCard(page)).toBe(true);
  });
  const panelText = await page.locator('#debugInfo').textContent();
  const firstLine = panelText.split('\n')[0];
  await check('the Detection tuning panel\'s text below its settings starts "round trip N ms"',
    async () => {
      await expect(page.locator('#debugPanel')).toBeVisible();
      expect(firstLine).toMatch(ROUND_TRIP_PATTERN);
    });
  const durationMs = Number(firstLine.match(ROUND_TRIP_PATTERN)[1]);
  await holdToLimit(check, testInfo, 'detection', durationMs, 'the panel\'s N, from the start '
    + 'of finding the card to the corners placed,');
});

test('PERF-03.1 Switching sides in a pair [phone]', async ({ page, check }, testInfo) => {
  const messages = watchConsole(page);
  const hand = await makePair(page, testInfo);
  await switchTo(page, hand, 'front');
  await check('the front is on screen, ready to edit', async () => {
    const name = await page.evaluate(() => window.__straightener.app.state.source.name);
    expect(name).toBe('14_front_portrait_raw_white.JPEG');
    await expect(page.locator('#sideSwitch .segment[data-value="front"]'))
      .toHaveAttribute('aria-pressed', 'true');
  });
  const durationMs = msFromLine(messages, SWITCH_LINE);
  await holdToLimit(check, testInfo, 'switchSides', durationMs, 'the Console line\'s N, from '
    + 'the tap on Front to the front on screen,');
});

test('PERF-04.1 An export at Size 1080 [phone]', async ({ page, check }, testInfo) => {
  await timeExportAt(page, check, testInfo, '1080', 'export1080', 1080);
});

test('PERF-05.1 An export at Size 2000 [phone]', async ({ page, check }, testInfo) => {
  await timeExportAt(page, check, testInfo, '2000', 'export2000', 2000);
});

test('PERF-06.1 An export at Size 3000 [phone]', async ({ page, check }, testInfo) => {
  await timeExportAt(page, check, testInfo, '3000', 'export3000', 3000);
});

test('PERF-07.1 An export at Size Original [phone]', async ({ page, check }, testInfo) => {
  await timeExportAt(page, check, testInfo, 'Original', 'exportOriginal', null);
});

test('PERF-08.1 An upscaled export [phone]', async ({ page, check }, testInfo) => {
  await watchMessages(page);
  await openApp(page);
  await openPhoto(page, PHOTO);
  const hand = handFor(page, testInfo);
  await goToStep(page, 'export', hand);
  const { question, downloading } = await tapDownload(page, hand);
  await check('the question box asks "Upscale to 2000 px?"', async () => {
    expect(question).toBe('Upscale to 2000 px?');
  });
  const saved = await answerForFile(page, hand, 'Yes', downloading);
  const savedImage = await readSavedImage(page, saved.file);
  const durationMs = await exportedMs(page, 2000, 2000);
  await check('IMG_9136-straight.jpg is saved, enlarged to 2000 × 2000 px; the message reads '
    + '"Exported 2000 × 2000 px in N s."', async () => {
    expect(saved.name).toBe('IMG_9136-straight.jpg');
    expect([savedImage.width, savedImage.height]).toEqual([2000, 2000]);
  });
  await holdToLimit(check, testInfo, 'upscaled', durationMs, 'the message\'s N, from the tap '
    + 'on Yes to the enlarged file,');
});
