// The Export step's cases (tests/catalog/export.md): Size and Format, the size line and its
// notes, Share, Download and Copy, Share now, Next card and what counts as exported, the export
// options (Quality, Interpolation, Fill outside photo, Reset, the source and version lines),
// and what the saved file holds.
// Each test drives the app as a person would, through hand.tap and hand.drag (a finger on the
// phone targets, the mouse on the wide ones), and reads the app's state only to check a result.
// No test opens a real share sheet: the page gets a stand-in (support/export.js).
'use strict';
const fs = require('fs');
const path = require('path');
const { test, expect } = require('./support/case.js');
const {
  root,
  openApp,
  openPhoto,
  goToStep,
  handFor,
  openOptions,
  closeOptions,
  samplePath,
  hasWhiteFill,
  readSavedImage,
  waitForStill,
} = require('./support/app.js');
const {
  installShareStandIn,
  choiceButton,
  selectedChoices,
  readoutText,
  visibleNotes,
  chooseFill,
  crossTheCorners,
  downloadExport,
  recordExports,
  exportStarts,
  sharesSoFar,
  toastMessage,
  takeAwayImageClipboard,
  tapRegardless,
  waitForExportEnd,
  waitForShares,
  sharedImageSize,
  readClipboardImage,
  saveFileBy,
  readSavedPixels,
  moveQualityTo,
  downloadAnswering,
  isSameFile,
  takeAwayWebpSaving,
  copyPhotoToClipboard,
  SHARE_FAILURE_MESSAGE,
  rectsOverlap,
} = require('./support/export.js');

const PHOTO = 'IMG_9136.JPEG';
const SECOND_PHOTO = 'IMG_9075.JPEG';
const PAIR_BACK = '14_back_portrait_raw_white.JPEG';
// IMG_9136.JPEG's crop at the photo's own resolution, in px: the default 1:1 crop around the
// card, as both engines detect it.
const CROP_PX = 1400;
const FULL_CROP_LINE = `Output ${CROP_PX} × ${CROP_PX} px · JPEG · full crop, not upscaled`;
const JPEG_NOTE = 'JPEG has no transparency; empty areas will be white.';
const LEVELS_NOTE = 'Levels has unapplied changes; export uses the applied levels.';
// A link that makes the output larger than the canvas limit: a 12000 px long edge, with
// upscaling allowed so the small crop is enlarged to it.
const OVER_LIMIT_LINK = 'index.html?export.longEdge=12000&export.allowUpscale=1';
// The amber of a note's warning mark (CONFIG.theme.warn, #e3b341).
const WARN_AMBER = 'rgb(227, 179, 65)';
// The first three bytes of every JPEG file (its start-of-image marker).
const JPEG_SIGNATURE = [0xff, 0xd8, 0xff];
// A pixel's [r, g, b, a] when it is solid white.
const OPAQUE_WHITE = [255, 255, 255, 255];

// Opens the app with the case's photo and goes to a step (Export unless `step` says another).
// The page gets a stand-in share sheet first (support/export.js; 'share' unless `share` names
// another behavior), so Share shows as it does on an iPhone and no real sheet ever opens.
// isWatched: record the screen as each export begins (recordExports).
// Returns the hand for this target.
async function startOn(page, testInfo, options = {}) {
  const { step = 'export', share = 'share', address, photo = PHOTO, isWatched } = options;
  await installShareStandIn(page, share);
  if (isWatched) await recordExports(page);
  await openApp(page, address);
  await openPhoto(page, photo);
  const hand = handFor(page, testInfo);
  await goToStep(page, step, hand);
  return hand;
}

// Opens the case's second photo, as Open does, and goes back to Export.
async function openSecondPhoto(page, hand) {
  await openPhoto(page, SECOND_PHOTO);
  await goToStep(page, 'export', hand);
}

// Taps one of the Size choices by its label ('1080', '2000', '3000' or 'Original').
const tapSize = (page, hand, label) => hand.tap(choiceButton(page, 'exportSize', label));

// Taps one of the Format choices by its label ('JPEG', 'PNG' or 'WebP').
const tapFormat = (page, hand, label) => hand.tap(choiceButton(page, 'exportFormat', label));

// The question card over the photo, and one of its buttons by label.
const questionCard = page => page.locator('#pairPrompt');
const questionButton = (page, label) => questionCard(page)
  .getByRole('button', { name: label, exact: true });

// Records the verdict that the Upscale question is up, asking for `sizePx`.
async function checkAskedToUpscale(page, check, sizePx = 2000) {
  await check(`a question card asks "Upscale to ${sizePx} px?"`, async () => {
    await expect(questionCard(page)).toBeVisible();
    await expect(questionCard(page)).toContainText(`Upscale to ${sizePx} px?`);
  });
}

// Taps Share and answers the Upscale question No, without recording a verdict: for a case
// whose rows begin after that.
async function shareAnsweringNo(page, hand) {
  await hand.tap(page.locator('#btnShare'));
  await hand.tap(questionButton(page, 'No'));
}

// The label the red Share button shows.
const shareLabel = page => page.locator('#btnShare .action-label');

// Expects each of these buttons, by id, to be live (true) or greyed out (false).
async function expectLive(page, ids, isLive) {
  for (const id of ids) {
    const button = page.locator(`#${id}`);
    await (isLive ? expect(button).toBeEnabled() : expect(button).toBeDisabled());
  }
}

const SAVE_BUTTONS = ['btnShare', 'btnDownload', 'btnCopy'];

// Expects exactly one choice of a row of choices to be selected, and to look selected (white).
async function expectSelected(page, groupId, label) {
  expect(await selectedChoices(page, groupId)).toEqual([label]);
  expect(await hasWhiteFill(choiceButton(page, groupId, label))).toBe(true);
}

test('EXP-01.1 The size choices set the long edge, each one undo step [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo);
  await check('2000 is selected and the size line reads the full crop, not upscaled', async () => {
    await expectSelected(page, 'exportSize', '2000');
    expect(await readoutText(page)).toBe(FULL_CROP_LINE);
  });
  await tapSize(page, hand, '1080');
  await check('1080 is selected; the size line reads Output 1080 × 1080 px · JPEG', async () => {
    await expectSelected(page, 'exportSize', '1080');
    expect(await readoutText(page)).toBe('Output 1080 × 1080 px · JPEG');
  });
  await tapSize(page, hand, '3000');
  await check('3000 is selected; the size line reads the full crop, not upscaled', async () => {
    await expectSelected(page, 'exportSize', '3000');
    expect(await readoutText(page)).toBe(FULL_CROP_LINE);
  });
  await tapSize(page, hand, 'Original');
  await check('Original is selected; the size line reads Output 1400 × 1400 px · JPEG',
    async () => {
      await expectSelected(page, 'exportSize', 'Original');
      expect(await readoutText(page)).toBe(`Output ${CROP_PX} × ${CROP_PX} px · JPEG`);
    });
  await hand.tap(page.locator('#btnUndo'));
  await check('Undo selects 3000 again', async () => {
    await expectSelected(page, 'exportSize', '3000');
  });
  await hand.tap(page.locator('#btnUndo'));
  await check('a second Undo selects 1080 again', async () => {
    await expectSelected(page, 'exportSize', '1080');
  });
  await openSecondPhoto(page, hand);
  await check('the next photo starts with 1080: the undone size is remembered', async () => {
    await expectSelected(page, 'exportSize', '1080');
  });
});

test('EXP-02.1 An edits file with a 1500 px long edge leaves no size selected [phone]',
  async ({ page, check }, testInfo) => {
    await checkUnlistedLongEdge(page, check, testInfo);
  });

// With Export options open, taps Load edits, chooses the edits file `file` in the picker and
// waits until its corners and export settings are the ones in use.
async function loadEditsFile(page, hand, file) {
  const edits = JSON.parse(fs.readFileSync(file, 'utf8'));
  const choosing = page.waitForEvent('filechooser');
  await hand.tap(page.locator('#btnLoadEdits'));
  await (await choosing).setFiles(file);
  await page.waitForFunction(({ corners, exportSettings }) => {
    const state = window.__straightener.app.state;
    const isSameCorners = JSON.stringify(state.corners) === corners;
    const isSameExport = Object.entries(exportSettings)
      .every(([key, value]) => JSON.stringify(state.export[key]) === JSON.stringify(value));
    return isSameCorners && isSameExport;
  }, { corners: JSON.stringify(edits.corners), exportSettings: edits.export });
}

// The body of EXP-02.1: an edits file whose long edge is 1500 px selects none of the sizes.
async function checkUnlistedLongEdge(page, check, testInfo) {
  const hand = await startOn(page, testInfo);
  await check('2000 is selected', async () => {
    await expectSelected(page, 'exportSize', '2000');
  });
  await openOptions(page, hand, 'export');
  await check('Save edits and Load edits show', async () => {
    await expect(page.locator('#btnSaveEdits')).toBeVisible();
    await expect(page.locator('#btnLoadEdits')).toBeVisible();
  });
  // The case's edits file: saved by Save edits, then changed as the case says.
  const saving = page.waitForEvent('download');
  await hand.tap(page.locator('#btnSaveEdits'));
  const edits = JSON.parse(fs.readFileSync(await (await saving).path(), 'utf8'));
  edits.export.longEdge = 1500;
  const editsFile = testInfo.outputPath('IMG_9136-edits.json');
  fs.writeFileSync(editsFile, JSON.stringify(edits, null, 2));
  await loadEditsFile(page, hand, editsFile);
  await closeOptions(page, hand, 'export');
  await check('none of the four sizes is selected', async () => {
    expect(await selectedChoices(page, 'exportSize')).toEqual([]);
  });
  await check('the size line reads the full crop, not upscaled', async () => {
    expect(await readoutText(page)).toBe(FULL_CROP_LINE);
  });
  await tapSize(page, hand, '1080');
  await check('1080 is selected; the size line reads Output 1080 × 1080 px · JPEG', async () => {
    await expectSelected(page, 'exportSize', '1080');
    expect(await readoutText(page)).toBe('Output 1080 × 1080 px · JPEG');
  });
}

test('EXP-03.1 The format choices set the format, each one undo step [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo);
  await check('JPEG is selected and the size line says JPEG', async () => {
    await expectSelected(page, 'exportFormat', 'JPEG');
    expect(await readoutText(page)).toBe(FULL_CROP_LINE);
  });
  await tapFormat(page, hand, 'PNG');
  await check('PNG is selected; the size line says PNG', async () => {
    await expectSelected(page, 'exportFormat', 'PNG');
    expect(await readoutText(page)).toBe(FULL_CROP_LINE.replace('JPEG', 'PNG'));
  });
  await tapFormat(page, hand, 'WebP');
  await check('WebP is selected; the size line says WEBP', async () => {
    await expectSelected(page, 'exportFormat', 'WebP');
    expect(await readoutText(page)).toBe(FULL_CROP_LINE.replace('JPEG', 'WEBP'));
  });
  await hand.tap(page.locator('#btnUndo'));
  await check('Undo selects PNG again', async () => {
    await expectSelected(page, 'exportFormat', 'PNG');
  });
  await openSecondPhoto(page, hand);
  await check('the next photo starts with PNG: the undone format is remembered', async () => {
    await expectSelected(page, 'exportFormat', 'PNG');
  });
});

test('EXP-04.1 The size line gives the output size and format [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo);
  await check('it reads the full crop, not upscaled, at 2000', async () => {
    expect(await readoutText(page)).toBe(FULL_CROP_LINE);
  });
  await tapSize(page, hand, '1080');
  await check('at 1080 it reads Output 1080 × 1080 px · JPEG', async () => {
    expect(await readoutText(page)).toBe('Output 1080 × 1080 px · JPEG');
  });
  await tapFormat(page, hand, 'PNG');
  await check('with PNG it reads Output 1080 × 1080 px · PNG', async () => {
    expect(await readoutText(page)).toBe('Output 1080 × 1080 px · PNG');
  });
});

test('EXP-04.2 While a note shows, a phone drops the "not upscaled" part [both]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo);
  await check('it reads the full crop, not upscaled', async () => {
    expect(await readoutText(page)).toBe(FULL_CROP_LINE);
  });
  await openOptions(page, hand, 'export');
  await check('Fill outside photo reads White', async () => {
    await expect(page.locator('#fillValue')).toHaveText('White');
  });
  await page.locator('#fill').selectOption('transparent');
  await check('Fill outside photo reads Transparent', async () => {
    await expect(page.locator('#fillValue')).toHaveText('Transparent');
  });
  await closeOptions(page, hand, 'export');
  await check('the JPEG note shows under the size line', async () => {
    expect(await visibleNotes(page)).toEqual([JPEG_NOTE]);
  });
  const shortLine = `Output ${CROP_PX} × ${CROP_PX} px · JPEG`;
  const expected = hand.isTouch ? shortLine : FULL_CROP_LINE;
  await check('on a phone the line drops "· full crop, not upscaled"; a wide screen keeps it',
    async () => {
      expect(await readoutText(page)).toBe(expected);
    });
});

test('EXP-04.3 With upscaling on from a link, the size line has no "not upscaled" part [phone]',
  async ({ page, check }, testInfo) => {
    test.fail(true, 'BUG-010');
    await startOn(page, testInfo, { address: 'index.html?export.allowUpscale=1' });
    await check('it reads Output 2000 × 2000 px · JPEG, with no "not upscaled" part', async () => {
      expect(await readoutText(page)).toBe('Output 2000 × 2000 px · JPEG');
    });
  });

test('EXP-05.1 Invalid corners blank the size line and its note [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo);
  await openOptions(page, hand, 'export');
  await check('Fill outside photo reads White', async () => {
    await expect(page.locator('#fillValue')).toHaveText('White');
  });
  await page.locator('#fill').selectOption('transparent');
  await closeOptions(page, hand, 'export');
  await check('the size line shows the output and the JPEG note shows', async () => {
    expect(await readoutText(page)).toMatch(/^Output 1400 × 1400 px · JPEG/);
    expect(await visibleNotes(page)).toEqual([JPEG_NOTE]);
  });
  await goToStep(page, 'perspective', hand);
  await crossTheCorners(page, hand);
  await check('the outline crosses itself: the corners are invalid', async () => {
    expect(await page.evaluate(() => window.__straightener.app.geometry.ok)).toBe(false);
  });
  await goToStep(page, 'export', hand);
  await check('the size line is empty and no note shows', async () => {
    await expect(page.locator('#exportReadout')).toHaveText('');
    await expect(page.locator('#exportMessage')).toBeHidden();
  });
});

// Taps Auto on the Levels step, which leaves the levels with changes not yet applied.
async function makeLevelsDraft(page, hand) {
  await hand.tap(page.locator('#toolAutoLevels'));
  await page.waitForFunction(() => window.__straightener.app.levelsPending === true);
}

test('EXP-06.1 A wide screen shows every note, each with an amber mark [desktop]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo, { step: 'levels', address: OVER_LIMIT_LINK });
  await makeLevelsDraft(page, hand);
  await check('a white dot shows on the Levels tab', async () => {
    await expect(page.locator('[data-step="levels"]:visible .step-tab-mark')).toBeVisible();
  });
  await goToStep(page, 'export', hand);
  await check('two notes: the Levels note, then the clamp note', async () => {
    const notes = await visibleNotes(page);
    expect(notes).toHaveLength(2);
    expect(notes[0]).toBe(LEVELS_NOTE);
    expect(notes[1]).toMatch(/^Clamped to fit the .* MP canvas limit\.$/);
  });
  await chooseFill(page, hand, 'transparent');
  await check('the JPEG note follows them', async () => {
    const notes = await visibleNotes(page);
    expect(notes).toHaveLength(3);
    expect(notes[2]).toBe(JPEG_NOTE);
  });
  await check('each note is led by an amber warning mark', async () => {
    const colors = await page.locator('#exportMessage .export-note .icon')
      .evaluateAll(icons => icons.map(icon => getComputedStyle(icon).color));
    expect(colors).toEqual([WARN_AMBER, WARN_AMBER, WARN_AMBER]);
  });
});

test('EXP-06.2 A phone shows one note at a time, in order [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo, { step: 'levels', address: OVER_LIMIT_LINK });
  await makeLevelsDraft(page, hand);
  await check('a white dot shows on the Levels tab', async () => {
    await expect(page.locator('[data-step="levels"]:visible .step-tab-mark')).toBeVisible();
  });
  await goToStep(page, 'export', hand);
  await check('one note shows: the Levels note', async () => {
    expect(await visibleNotes(page)).toEqual([LEVELS_NOTE]);
  });
  await chooseFill(page, hand, 'transparent');
  await check('still only the Levels note shows', async () => {
    expect(await visibleNotes(page)).toEqual([LEVELS_NOTE]);
  });
  await goToStep(page, 'levels', hand);
  await hand.tap(page.locator('#btnApplyLevels'));
  await check('the white dot on the Levels tab goes', async () => {
    await expect(page.locator('[data-step="levels"]:visible .step-tab-mark')).toBeHidden();
  });
  await goToStep(page, 'export', hand);
  await check('one note shows: the clamp note', async () => {
    const notes = await visibleNotes(page);
    expect(notes).toHaveLength(1);
    expect(notes[0]).toMatch(/^Clamped to fit the .* MP canvas limit\.$/);
  });
  await tapSize(page, hand, '1080');
  await check('at 1080 one note shows: the JPEG note', async () => {
    expect(await visibleNotes(page)).toEqual([JPEG_NOTE]);
  });
});

test('EXP-06.3 The clamp note reads 16.7 MP [phone]', async ({ page, check }, testInfo) => {
  test.fail(true, 'BUG-011');
  await startOn(page, testInfo, { address: OVER_LIMIT_LINK });
  await check('the size line begins Output 4096 × 4096 px · JPEG', async () => {
    expect(await readoutText(page)).toMatch(/^Output 4096 × 4096 px · JPEG/);
  });
  await check('the note reads "Clamped to fit the 16.7 MP canvas limit."', async () => {
    expect(await visibleNotes(page)).toEqual(['Clamped to fit the 16.7 MP canvas limit.']);
  });
});

// Taps Add back, chooses `name` in the file picker and waits until the back is open and its
// corners are found.
async function addBack(page, hand, name) {
  const choosing = page.waitForEvent('filechooser');
  await hand.tap(page.locator('#btnAddBack'));
  await (await choosing).setFiles(samplePath(name));
  await page.waitForFunction(photoName => {
    const app = window.__straightener.app;
    const isBackOpen = !!app.pair && app.pair.current === 'back' && !app.isSwitching;
    const isDetected = app.detection.running > 0 && app.detection.message === '';
    return isBackOpen && app.state.source.name === photoName && isDetected;
  }, name);
}

test('EXP-06.4 For a pair saved Separately, a clamp on the other side shows a note [phone]',
  async ({ page, check }, testInfo) => {
    test.fail(true, 'BUG-012');
    const hand = await startOn(page, testInfo, { address: 'index.html?maxOutputArea=1000000' });
    await tapSize(page, hand, 'Original');
    await check('the size line reads Output 1000 × 1000 px · JPEG, with the clamp note',
      async () => {
        expect(await readoutText(page)).toBe('Output 1000 × 1000 px · JPEG');
        expect((await visibleNotes(page))[0]).toMatch(/^Clamped to fit the /);
      });
    await addBack(page, hand, PAIR_BACK);
    await check('the back opens, with Front and Back in the top bar and Back selected',
      async () => {
        expect(await selectedChoices(page, 'sideSwitch')).toEqual(['Back']);
      });
    await goToStep(page, 'export', hand);
    await check('Together and Separately show beside the size line', async () => {
      await expect(page.locator('#pairOutput')).toBeVisible();
    });
    await hand.tap(choiceButton(page, 'pairOutput', 'Separately'));
    await check('Separately is selected', async () => {
      expect(await selectedChoices(page, 'pairOutput')).toEqual(['Separately']);
    });
    await check('a warning note shows: the front is scaled down to fit', async () => {
      const isFrontClamped = await page.evaluate(() => {
        const front = window.__straightener.app.pair.other.state;
        return CardEngine.computeGeometry(front, window.CF.geometryConfig()).output.isClamped;
      });
      expect(isFrontClamped).toBe(true);
      const notes = await page.locator('#exportMessage .export-note').count();
      expect(notes).toBe(1);
    });
  });

// Expects the export note to be whole within its column and to cover none of the buttons of
// Export's control area that show.
async function expectNoteClearOfButtons(page) {
  const note = await page.locator('#exportMessage .export-note').first().boundingBox();
  const column = await page.locator('.export-readout-column').boundingBox();
  expect(note.y).toBeGreaterThanOrEqual(column.y - 0.5);
  expect(note.y + note.height).toBeLessThanOrEqual(column.y + column.height + 0.5);
  const buttons = await page.locator('#exportArea .action-button:visible').all();
  expect(buttons.length).toBeGreaterThan(0);
  for (const button of buttons) {
    const box = await button.boundingBox();
    const name = (await button.textContent()).trim();
    expect(rectsOverlap(note, box), `the note overlaps ${name}`).toBe(false);
  }
}

test('EXP-07.1 A note covers no button, before and after an export [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo);
  await openOptions(page, hand, 'export');
  await check('Fill outside photo reads White', async () => {
    await expect(page.locator('#fillValue')).toHaveText('White');
  });
  await page.locator('#fill').selectOption('transparent');
  await closeOptions(page, hand, 'export');
  await check('the JPEG note shows under the size line', async () => {
    expect(await visibleNotes(page)).toEqual([JPEG_NOTE]);
  });
  await check('the whole note can be read and it covers no button', async () => {
    await expectNoteClearOfButtons(page);
  });
  await downloadExport(page, hand);
  await check('a file is saved and Next card shows', async () => {
    await expect(page.locator('#btnNextCard')).toBeVisible();
  });
  await check('the note is still whole and covers no button, Next card included', async () => {
    await expectNoteClearOfButtons(page);
  });
});

// The message Download and Share show once the file is saved: "Exported 1400 × 1400 px in N s."
const EXPORTED_MESSAGE = new RegExp(`^Exported ${CROP_PX} × ${CROP_PX} px in \\d+\\.\\d s\\.`);

test('EXP-08.1 Share hands the share sheet the finished photo [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo);
  const share = page.locator('#btnShare');
  await check('Share is first in the row, red, with its tooltip', async () => {
    const firstButton = page.locator('#exportSaveRow .action-button').first();
    await expect(firstButton).toHaveId('btnShare');
    await expect(share).toHaveClass(/is-main/);
    await expect(share).toHaveAttribute('title',
      'Share or save the image (Save Image puts it in Photos)');
  });
  await hand.tap(share);
  await checkAskedToUpscale(page, check);
  await hand.tap(questionButton(page, 'No'));
  await waitForShares(page, 1);
  await check('the share sheet gets one file, IMG_9136-straight.jpg, a 1400 × 1400 JPEG',
    async () => {
      const [call] = await sharesSoFar(page);
      expect(call.files.map(file => [file.name, file.type])).toEqual([
        ['IMG_9136-straight.jpg', 'image/jpeg'],
      ]);
      expect(await sharedImageSize(page)).toEqual({ width: CROP_PX, height: CROP_PX });
    });
  await check('a message begins "Exported 1400 × 1400 px in"', async () => {
    await expect.poll(() => toastMessage(page)).toMatch(EXPORTED_MESSAGE);
  });
});

test('EXP-10.1 Where the browser can\'t share files, Share is hidden [phone]', async ({
  page,
  check,
}, testInfo) => {
  await startOn(page, testInfo, { share: 'none' });
  await check('there is no Share button; the row holds Download and Copy', async () => {
    await expect(page.locator('#btnShare')).toBeHidden();
    await expect(page.locator('#btnDownload')).toBeVisible();
    await expect(page.locator('#btnCopy')).toBeVisible();
  });
});

test('EXP-10.2 A link with export.share=0 hides Share [phone]', async ({
  page,
  check,
}, testInfo) => {
  await startOn(page, testInfo, { address: 'index.html?export.share=0' });
  await check('there is no Share button; the row holds Download and Copy', async () => {
    expect(await page.evaluate(() => typeof navigator.share)).toBe('function');
    await expect(page.locator('#btnShare')).toBeHidden();
    await expect(page.locator('#btnDownload')).toBeVisible();
    await expect(page.locator('#btnCopy')).toBeVisible();
  });
});

test('EXP-11.1 Download saves the photo as a plain download [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo);
  const download = page.locator('#btnDownload');
  await check('Download shows, grey, beside the red Share', async () => {
    await expect(download).toBeVisible();
    await expect(download).not.toHaveClass(/is-main/);
    await expect(page.locator('#btnShare')).toHaveClass(/is-main/);
  });
  const downloading = page.waitForEvent('download');
  await hand.tap(download);
  await checkAskedToUpscale(page, check);
  await hand.tap(questionButton(page, 'No'));
  const saved = await downloading;
  await check('IMG_9136-straight.jpg is saved with the Exported message; no share sheet',
    async () => {
      expect(saved.suggestedFilename()).toBe('IMG_9136-straight.jpg');
      await expect.poll(() => toastMessage(page)).toMatch(EXPORTED_MESSAGE);
      expect(await sharesSoFar(page)).toEqual([]);
    });
  const file = await saved.path();
  const image = await readSavedImage(page, file);
  await check('the file is a JPEG of 1400 × 1400 px', async () => {
    const bytes = fs.readFileSync(file);
    expect([bytes[0], bytes[1], bytes[2]]).toEqual(JPEG_SIGNATURE);
    expect([image.width, image.height]).toEqual([CROP_PX, CROP_PX]);
  });
});

test('EXP-11.2 Without Share, Download is red and wider [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  await startOn(page, testInfo, { share: 'none' });
  await check('Download is red and wider than Copy', async () => {
    const download = page.locator('#btnDownload');
    await expect(download).toHaveClass(/is-main/);
    const downloadBox = await download.boundingBox();
    const copyBox = await page.locator('#btnCopy').boundingBox();
    expect(downloadBox.width).toBeGreaterThan(copyBox.width);
  });
});

// Types an angle on the Rotate step: taps the angle, types `text` and taps Done.
async function typeAngle(page, hand, text) {
  await hand.tap(page.locator('#rotateAngle'));
  await page.locator('#rotateAngleField').waitFor({ state: 'visible' });
  await page.keyboard.type(text);
  await hand.tap(page.locator('#btnAngleDone'));
}

// Lets the page read and write the clipboard. Only Chromium can grant that to a page under
// test, so a Copy case runs there only.
async function allowClipboard(context, browserName) {
  test.skip(browserName !== 'chromium', 'Only Chromium lets a test read the clipboard back');
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
}

test('EXP-12.1 Copy puts a PNG on the clipboard though JPEG is chosen [phone]', async ({
  page,
  context,
  browserName,
  check,
}, testInfo) => {
  await allowClipboard(context, browserName);
  const hand = await startOn(page, testInfo);
  const copy = page.locator('#btnCopy');
  await check('Copy shows, last in the row', async () => {
    await expect(copy).toBeVisible();
    const lastButton = page.locator('#exportSaveRow .action-button:visible').last();
    await expect(lastButton).toHaveId('btnCopy');
  });
  await hand.tap(copy);
  await checkAskedToUpscale(page, check);
  await hand.tap(questionButton(page, 'No'));
  await check('a message reads "Copied to clipboard (PNG)."', async () => {
    await expect.poll(() => toastMessage(page)).toBe('Copied to clipboard (PNG).');
  });
  const pasted = await readClipboardImage(page);
  await check('the clipboard holds a PNG of 1400 × 1400 px', async () => {
    expect(pasted.types).toEqual(['image/png']);
    expect([pasted.width, pasted.height]).toEqual([CROP_PX, CROP_PX]);
  });
});

test('EXP-12.2 With JPEG and a Transparent fill, Copy\'s empty areas are white [phone]',
  async ({ page, context, browserName, check }, testInfo) => {
    await allowClipboard(context, browserName);
    const hand = await startOn(page, testInfo, { step: 'rotate' });
    await typeAngle(page, hand, '10');
    await check('the angle reads 10.0°', async () => {
      await expect(page.locator('#rotateAngleText')).toHaveText('10.0°');
    });
    await goToStep(page, 'export', hand);
    await chooseFill(page, hand, 'transparent');
    await check('the JPEG note shows under the size line', async () => {
      expect(await visibleNotes(page)).toEqual([JPEG_NOTE]);
    });
    await hand.tap(page.locator('#btnCopy'));
    await checkAskedToUpscale(page, check);
    await hand.tap(questionButton(page, 'No'));
    await check('a message reads "Copied to clipboard (PNG)."', async () => {
      await expect.poll(() => toastMessage(page)).toBe('Copied to clipboard (PNG).');
    });
    const pasted = await readClipboardImage(page);
    await check('the corners the tilt left empty are solid white; nothing is see-through',
      async () => {
        const whiteCorners = pasted.corners.filter(pixel => pixel.join() === OPAQUE_WHITE.join());
        expect(whiteCorners.length).toBeGreaterThanOrEqual(2);
        expect(pasted.minAlpha).toBe(255);
      });
  });

test('EXP-13.1 Where the clipboard can\'t take images, Copy is hidden [phone]', async ({
  page,
  check,
}, testInfo) => {
  await takeAwayImageClipboard(page);
  await startOn(page, testInfo);
  await check('there is no Copy button; Download shows', async () => {
    await expect(page.locator('#btnCopy')).toBeHidden();
    await expect(page.locator('#btnDownload')).toBeVisible();
  });
});

test('EXP-13.2 A pair set to Separately hides Copy [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo);
  const copy = page.locator('#btnCopy');
  await check('Copy shows', async () => {
    await expect(copy).toBeVisible();
  });
  await addBack(page, hand, PAIR_BACK);
  await check('the back opens, with Front and Back in the top bar', async () => {
    await expect(page.locator('#sideSwitch')).toBeVisible();
  });
  await goToStep(page, 'export', hand);
  await check('Together and Separately show; Copy shows', async () => {
    await expect(page.locator('#pairOutput')).toBeVisible();
    await expect(copy).toBeVisible();
  });
  await hand.tap(choiceButton(page, 'pairOutput', 'Separately'));
  await check('with Separately, Copy is gone', async () => {
    await expect(copy).toBeHidden();
  });
  await hand.tap(choiceButton(page, 'pairOutput', 'Together'));
  await check('with Together, Copy is back', async () => {
    await expect(copy).toBeVisible();
  });
});

// How long a case waits for a file or a question card that should not come, in ms.
const NOTHING_COMES_MS = 1500;

test('EXP-14.1 Invalid corners dim Share, Download and Copy [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo);
  await check('Share, Download and Copy are live', async () => {
    await expectLive(page, SAVE_BUTTONS, true);
  });
  await goToStep(page, 'perspective', hand);
  await crossTheCorners(page, hand);
  await check('the outline crosses itself: the corners are invalid', async () => {
    expect(await page.evaluate(() => window.__straightener.app.geometry.ok)).toBe(false);
  });
  await goToStep(page, 'export', hand);
  await check('Share, Download and Copy are greyed out', async () => {
    await expectLive(page, SAVE_BUTTONS, false);
  });
  const downloading = page.waitForEvent('download', { timeout: NOTHING_COMES_MS })
    .then(() => true, () => false);
  await tapRegardless(hand, page.locator('#btnDownload'));
  const isSaved = await downloading;
  await check('a tap on Download saves nothing and asks nothing', async () => {
    expect(isSaved).toBe(false);
    await expect(questionCard(page)).toBeHidden();
  });
});

test('EXP-14.2 Share, Download and Copy are dimmed while an export runs [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo, { isWatched: true });
  const downloading = page.waitForEvent('download');
  await hand.tap(page.locator('#btnDownload'));
  await checkAskedToUpscale(page, check);
  await hand.tap(questionButton(page, 'No'));
  const saved = await downloading;
  await check('while the progress line runs, Share, Download and Copy are greyed out',
    async () => {
      const [start] = await exportStarts(page);
      expect(start.host).toBe('exportArea');
      const states = SAVE_BUTTONS.map(id => start.controls[id].disabled);
      expect(states).toEqual([true, true, true]);
    });
  await waitForExportEnd(page);
  await check('the file is saved and the three buttons are live again', async () => {
    expect(saved.suggestedFilename()).toBe('IMG_9136-straight.jpg');
    await expectLive(page, SAVE_BUTTONS, true);
  });
});

// "Exported 1400 × 1400 px in N s. Tap Share now to open the share sheet."
const SHARE_NOW_MESSAGE = new RegExp(`${EXPORTED_MESSAGE.source} Tap Share now to open the `
  + 'share sheet\\.$');

test('EXP-15.1 A refused share leaves Share now, which shares the same file [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo, { share: 'refuseOnce', isWatched: true });
  await hand.tap(page.locator('#btnShare'));
  await checkAskedToUpscale(page, check);
  await hand.tap(questionButton(page, 'No'));
  await waitForShares(page, 1);
  await check('the sheet is refused; the message says to tap Share now; Share reads Share now',
    async () => {
      await expect.poll(() => toastMessage(page)).toMatch(SHARE_NOW_MESSAGE);
      await expect(shareLabel(page)).toHaveText('Share now');
    });
  await hand.tap(page.locator('#btnShare'));
  await waitForShares(page, 2);
  await check('the share sheet opens with the same file, and nothing is rendered again',
    async () => {
      const isSameFile = await page.evaluate(
        () => window.testSharedFiles[1][0] === window.testSharedFiles[0][0],
      );
      expect(isSameFile).toBe(true);
      expect((await sharesSoFar(page))[1].files[0].name).toBe('IMG_9136-straight.jpg');
      expect(await exportStarts(page)).toHaveLength(1);
    });
  await check('the red button reads Share again', async () => {
    await expect(shareLabel(page)).toHaveText('Share');
  });
});

test('EXP-15.2 Share now stays live while another save runs [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo, { share: 'refuseOnce', isWatched: true });
  await shareAnsweringNo(page, hand);
  await waitForShares(page, 1);
  await check('the red button reads Share now', async () => {
    await expect(shareLabel(page)).toHaveText('Share now');
  });
  const downloading = page.waitForEvent('download');
  await hand.tap(page.locator('#btnDownload'));
  await checkAskedToUpscale(page, check);
  await hand.tap(questionButton(page, 'No'));
  const saved = await downloading;
  await check('while it runs, Download and Copy are greyed out and Share now stays live',
    async () => {
      const starts = await exportStarts(page);
      expect(starts).toHaveLength(2);
      const { controls } = starts[1];
      expect(controls.btnShare).toMatchObject({ disabled: false, label: 'Share now' });
      expect([controls.btnDownload.disabled, controls.btnCopy.disabled]).toEqual([true, true]);
    });
  await waitForExportEnd(page);
  await check('the file is saved and the red button still reads Share now', async () => {
    expect(saved.suggestedFilename()).toBe('IMG_9136-straight.jpg');
    await expect(shareLabel(page)).toHaveText('Share now');
  });
});

test('EXP-16.1 An edit drops a waiting Share now [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo, { share: 'refuseOnce', isWatched: true });
  await shareAnsweringNo(page, hand);
  await waitForShares(page, 1);
  await check('the red button reads Share now', async () => {
    await expect(shareLabel(page)).toHaveText('Share now');
  });
  await tapSize(page, hand, '1080');
  await check('after choosing 1080 it reads Share again', async () => {
    await expect(shareLabel(page)).toHaveText('Share');
  });
  await hand.tap(page.locator('#btnShare'));
  await waitForShares(page, 2);
  await check('the photo is rendered again and shared at 1080 × 1080 px', async () => {
    expect(await exportStarts(page)).toHaveLength(2);
    expect((await sharesSoFar(page))[1].files[0].name).toBe('IMG_9136-straight.jpg');
    expect(await sharedImageSize(page, 1)).toEqual({ width: 1080, height: 1080 });
  });
});

test('EXP-17.1 Cancelling the share sheet shows nothing and doesn\'t count [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo, { share: 'cancel' });
  await hand.tap(page.locator('#btnShare'));
  await checkAskedToUpscale(page, check);
  await hand.tap(questionButton(page, 'No'));
  await waitForShares(page, 1);
  await check('the share sheet opens', async () => {
    expect(await sharesSoFar(page)).toHaveLength(1);
  });
  await waitForExportEnd(page);
  await check('no message shows, Next card doesn\'t show, the button still reads Share',
    async () => {
      expect(await toastMessage(page)).toBe('');
      await expect(page.locator('#btnNextCard')).toBeHidden();
      await expect(shareLabel(page)).toHaveText('Share');
    });
});

test('EXP-18.1 While an export runs, the other save buttons are dimmed [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo, { isWatched: true });
  let downloads = 0;
  page.on('download', () => {
    downloads += 1;
  });
  const downloading = page.waitForEvent('download');
  await hand.tap(page.locator('#btnDownload'));
  await checkAskedToUpscale(page, check);
  await hand.tap(questionButton(page, 'No'));
  const saved = await downloading;
  const cornerButtons = ['btnCornerShare', 'btnCornerDownload'];
  const allButtons = SAVE_BUTTONS.concat(cornerButtons);
  await check('Share, Download and Copy are greyed out (on a wide screen, Share corners and '
    + 'Download corners too)', async () => {
    const [start] = await exportStarts(page);
    expect(allButtons.filter(id => start.controls[id].disabled)).toEqual(allButtons);
    if (!hand.isTouch) {
      expect(cornerButtons.map(id => start.controls[id].hidden)).toEqual([false, false]);
    }
  });
  await waitForExportEnd(page);
  await check('one file, IMG_9136-straight.jpg, is saved; every button is live again',
    async () => {
      expect(saved.suggestedFilename()).toBe('IMG_9136-straight.jpg');
      expect(downloads).toBe(1);
      await expectLive(page, allButtons, true);
    });
});

// The settings ruling R17 dims during an export, by id: buttons and form controls.
const R17_CONTROLS = [
  'btnUndo',
  'btnRedo',
  'btnAddBack',
  'quality',
  'interp',
  'fill',
  'exportResetRow',
  'btnLoadEdits',
];

test('EXP-18.2 While an export runs, the settings are dimmed and the steps stay live [phone]',
  async ({ page, check }, testInfo) => {
    test.fail(true, 'BUG-013');
    const hand = await startOn(page, testInfo, { isWatched: true });
    await tapSize(page, hand, '1080');
    await tapSize(page, hand, '3000');
    await check('3000 is selected', async () => {
      await expectSelected(page, 'exportSize', '3000');
    });
    await hand.tap(page.locator('#btnUndo'));
    await check('1080 is selected; Undo and Redo are both live', async () => {
      await expectSelected(page, 'exportSize', '1080');
      await expectLive(page, ['btnUndo', 'btnRedo'], true);
    });
    const downloading = page.waitForEvent('download');
    await hand.tap(page.locator('#btnDownload'));
    await downloading;
    await check('Size, Format, Undo, Redo, Add back and the options\' settings are greyed out; '
      + 'the step tabs stay live', async () => {
      const [start] = await exportStarts(page);
      expect(start.tabs).toEqual([]);
      const live = R17_CONTROLS.filter(id => !start.controls[id].disabled);
      const liveChoices = ['exportSize', 'exportFormat'].filter(id => !start.choices[id]);
      expect(live.concat(liveChoices)).toEqual([]);
    });
    await waitForExportEnd(page);
    await check('a file is saved and everything is live again', async () => {
      await expectLive(page, ['btnUndo', 'btnRedo', 'btnDownload'], true);
    });
  });

// Waits until the photo `name` is open and its corners are found, after a picker other than
// openPhoto's (Next card).
function waitForPhotoOpen(page, name) {
  return page.waitForFunction(photoName => {
    const app = window.__straightener.app;
    const isDetected = app.detection.running > 0 && app.detection.message === '';
    return !!app.geometry && app.state.source.name === photoName && isDetected;
  }, name);
}

const nextCard = page => page.locator('#btnNextCard');

// Records the verdict that Next card shows, in white.
async function checkNextCardShows(page, check, description) {
  await check(description, async () => {
    await expect(nextCard(page)).toBeVisible();
    expect(await hasWhiteFill(nextCard(page))).toBe(true);
  });
}

test('EXP-19.1 Add back shows only while the photo isn\'t part of a pair [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo);
  const addBackButton = page.locator('#btnAddBack');
  await check('Add back shows, with its tooltip', async () => {
    await expect(addBackButton).toBeVisible();
    await expect(addBackButton).toHaveAttribute('title',
      'Keep this photo as the front and open the back');
  });
  await addBack(page, hand, PAIR_BACK);
  await check('the back opens; Front, Back and Unpair show in the top bar', async () => {
    await expect(page.locator('#sideSwitch')).toBeVisible();
    await expect(page.locator('#btnUnpair')).toBeVisible();
  });
  await goToStep(page, 'export', hand);
  await check('Add back is gone from the bottom row', async () => {
    await expect(addBackButton).toBeHidden();
  });
  await hand.tap(page.locator('#btnUnpair'));
  await check('a question card titled Unpair offers Keep front and Keep back', async () => {
    await expect(questionCard(page)).toContainText('Unpair');
    await expect(questionButton(page, 'Keep front')).toBeVisible();
    await expect(questionButton(page, 'Keep back')).toBeVisible();
  });
  await hand.tap(questionButton(page, 'Keep back'));
  await check('"Unpaired. The back is a single photo now."; Front and Back go', async () => {
    await expect.poll(() => toastMessage(page)).toBe('Unpaired. The back is a single photo now.');
    await expect(page.locator('#sideSwitch')).toBeHidden();
  });
  await check('Add back shows again', async () => {
    await expect(addBackButton).toBeVisible();
  });
});

// True when a sheet (by id) is open.
const isSheetOpen = (page, id) => page.evaluate(
  sheetId => window.CF.isSheetOpen(document.getElementById(sheetId)),
  id,
);

// Waits until the Corner shots sheet is open (true) or closed (false) and done moving.
async function waitForCornerSheet(page, isOpen) {
  await page.waitForFunction(wanted => {
    const layer = document.getElementById('cornerShotsSheet');
    return window.CF.isSheetOpen(layer) === wanted;
  }, isOpen);
  await waitForStill(page);
}

// How far down from the page's top a tap on the dimmed photo above an open sheet lands, in CSS
// px: well above the sheet, which is at most about 470 px tall.
const ABOVE_SHEET_Y_PX = 120;

test('EXP-20.1 On a phone, Corner shots opens its sheet [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo);
  await hand.tap(page.locator('#btnCornerShots'));
  await waitForCornerSheet(page, true);
  await check('the Corner shots sheet rises with four close-ups; Export options stay closed',
    async () => {
      await expect(page.locator('#cornerShotsSheet canvas[data-corner]:visible')).toHaveCount(4);
      expect(await isSheetOpen(page, 'exportSheet')).toBe(false);
    });
  // A tap at one point of the backdrop: hand.tap would tap its middle, which the sheet covers.
  const backdrop = page.locator('#cornerShotsSheet .sheet-scrim');
  const { width } = await backdrop.boundingBox();
  await backdrop.tap({ position: { x: width / 2, y: ABOVE_SHEET_Y_PX } });
  await waitForCornerSheet(page, false);
  await check('the sheet goes down', async () => {
    expect(await isSheetOpen(page, 'cornerShotsSheet')).toBe(false);
  });
  await hand.tap(page.locator('#btnCornerShots'));
  await waitForCornerSheet(page, true);
  await check('the Corner shots sheet rises again', async () => {
    expect(await isSheetOpen(page, 'cornerShotsSheet')).toBe(true);
  });
});

// Where the Corner shots section and the panel are on the page: { section, panel } as
// { top, bottom } in CSS px, and the panel's scroll offset.
function cornerSectionPlace(page) {
  return page.evaluate(() => {
    const place = id => {
      const rect = document.getElementById(id).getBoundingClientRect();
      return { top: rect.top, bottom: rect.bottom };
    };
    const panel = document.getElementById('panel');
    return { section: place('cornerShotsSheet'), panel: place('panel'), scroll: panel.scrollTop };
  });
}

// The text of the element that has the keyboard focus, and whether it is the selected choice
// of the Corner shots section.
function focusedCornerChoice(page) {
  return page.evaluate(() => {
    const focused = document.activeElement;
    const isSelectedChoice = focused.matches('#cornerOutput [aria-pressed="true"]');
    return { text: focused.textContent.trim(), isSelectedChoice };
  });
}

// A wide window too short to show the whole Corner shots section, in CSS px.
const SHORT_DESKTOP = { width: 1280, height: 520 };
// Rounding allowed when comparing page positions, in CSS px.
const PLACE_TOLERANCE_PX = 1;

test('EXP-20.2 On a wide screen, Corner shots brings its section into view only when needed '
  + '[desktop] [webkit]', async ({ page, check }, testInfo) => {
  const hand = await startOn(page, testInfo);
  const before = await cornerSectionPlace(page);
  await check('the Corner shots section shows whole', async () => {
    expect(before.section.top).toBeGreaterThanOrEqual(before.panel.top);
    expect(before.section.bottom).toBeLessThanOrEqual(before.panel.bottom);
  });
  await hand.tap(page.locator('#btnCornerShots'));
  await check('the panel doesn\'t move; the focus is on 1 sheet', async () => {
    expect((await cornerSectionPlace(page)).scroll).toBe(before.scroll);
    expect(await focusedCornerChoice(page)).toEqual({ text: '1 sheet', isSelectedChoice: true });
  });
  await page.setViewportSize(SHORT_DESKTOP);
  await check('the bottom of the section is cut off by the window\'s lower edge', async () => {
    const short = await cornerSectionPlace(page);
    expect(short.section.bottom).toBeGreaterThan(short.panel.bottom);
  });
  await hand.tap(page.locator('#btnCornerShots'));
  await check('the panel scrolls just enough to show the whole section; the focus is on 1 sheet',
    async () => {
      const after = await cornerSectionPlace(page);
      expect(after.scroll).toBeGreaterThan(0);
      expect(after.section.top).toBeGreaterThanOrEqual(after.panel.top - PLACE_TOLERANCE_PX);
      expect(after.section.bottom).toBeLessThanOrEqual(after.panel.bottom + PLACE_TOLERANCE_PX);
      expect(await focusedCornerChoice(page)).toEqual({ text: '1 sheet', isSelectedChoice: true });
    });
});

test('EXP-21.1 Next card shows once the edits are exported, and opens the picker [phone]',
  async ({ page, check }, testInfo) => {
    const hand = await startOn(page, testInfo);
    await check('there is no Next card', async () => {
      await expect(nextCard(page)).toBeHidden();
    });
    await downloadExport(page, hand);
    await checkNextCardShows(page, check, 'a file is saved and Next card shows, in white');
    await tapSize(page, hand, '1080');
    await check('Next card goes after choosing 1080', async () => {
      await expect(nextCard(page)).toBeHidden();
    });
    await hand.tap(page.locator('#btnUndo'));
    await check('Undo selects 2000 again, and Next card is back', async () => {
      await expectSelected(page, 'exportSize', '2000');
      await expect(nextCard(page)).toBeVisible();
    });
    const choosing = page.waitForEvent('filechooser');
    await hand.tap(nextCard(page));
    const chooser = await choosing;
    await check('the photo picker opens', async () => {
      expect(chooser.isMultiple()).toBe(false);
    });
    await chooser.setFiles(samplePath(SECOND_PHOTO));
    await waitForPhotoOpen(page, SECOND_PHOTO);
    await check('the new photo opens on the Perspective step', async () => {
      expect(await page.evaluate(() => window.__straightener.app.tab)).toBe('perspective');
    });
  });

test('EXP-21.2 A waiting Share now holds Next card back, even for exported edits [phone]',
  async ({ page, check }, testInfo) => {
    const hand = await startOn(page, testInfo, { share: 'refuseOnce' });
    await downloadExport(page, hand);
    await check('a file is saved and Next card shows', async () => {
      await expect(nextCard(page)).toBeVisible();
    });
    await shareAnsweringNo(page, hand);
    await waitForShares(page, 1);
    await check('the red button reads Share now, and Next card has gone', async () => {
      await expect(shareLabel(page)).toHaveText('Share now');
      await expect(nextCard(page)).toBeHidden();
    });
    await hand.tap(page.locator('#btnShare'));
    await waitForShares(page, 2);
    await check('once shared, the button reads Share and Next card is back', async () => {
      await expect(shareLabel(page)).toHaveText('Share');
      await expect(nextCard(page)).toBeVisible();
    });
  });

test('EXP-22.1 Corner shots and Save edits don\'t count as exported; a finished Share does '
  + '[phone]', async ({ page, check }, testInfo) => {
  const hand = await startOn(page, testInfo);
  await hand.tap(page.locator('#btnCornerShots'));
  await check('the Corner shots sheet opens', async () => {
    await expect(page.locator('#btnCornerDownload')).toBeVisible();
  });
  const corners = await saveFileBy(page, hand, page.locator('#btnCornerDownload'));
  await waitForExportEnd(page);
  await check('a file of corner shots is saved; Next card doesn\'t show', async () => {
    expect(corners.name).toMatch(/^IMG_9136-/);
    await expect(nextCard(page)).toBeHidden();
  });
  await closeOptions(page, hand, 'cornerShots');
  await openOptions(page, hand, 'export');
  await check('Save edits shows', async () => {
    await expect(page.locator('#btnSaveEdits')).toBeVisible();
  });
  const edits = await saveFileBy(page, hand, page.locator('#btnSaveEdits'));
  await check('IMG_9136-edits.json is saved; Next card doesn\'t show', async () => {
    expect(edits.name).toBe('IMG_9136-edits.json');
    await expect(nextCard(page)).toBeHidden();
  });
  await closeOptions(page, hand, 'export');
  await hand.tap(page.locator('#btnShare'));
  await checkAskedToUpscale(page, check);
  await hand.tap(questionButton(page, 'No'));
  await waitForShares(page, 1);
  await checkNextCardShows(page, check, 'once shared, Next card shows in white');
});

test('EXP-22.2 A failed share doesn\'t count as exported [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo, { share: 'fail' });
  await hand.tap(page.locator('#btnShare'));
  await checkAskedToUpscale(page, check);
  await hand.tap(questionButton(page, 'No'));
  await waitForShares(page, 1);
  await waitForExportEnd(page);
  await check('a red message reads "Share failed: " and the reason; no Next card', async () => {
    await expect.poll(() => toastMessage(page)).toBe(`Share failed: ${SHARE_FAILURE_MESSAGE}`);
    await expect(page.locator('#toast')).toHaveClass(/is-error/);
    await expect(nextCard(page)).toBeHidden();
  });
});

test('EXP-22.3 A finished Copy counts as exported [phone]', async ({
  page,
  context,
  browserName,
  check,
}, testInfo) => {
  await allowClipboard(context, browserName);
  const hand = await startOn(page, testInfo);
  await hand.tap(page.locator('#btnCopy'));
  await checkAskedToUpscale(page, check);
  await hand.tap(questionButton(page, 'No'));
  await check('"Copied to clipboard (PNG)."; Next card shows in white', async () => {
    await expect.poll(() => toastMessage(page)).toBe('Copied to clipboard (PNG).');
    await expect(nextCard(page)).toBeVisible();
    expect(await hasWhiteFill(nextCard(page))).toBe(true);
  });
});

test('EXP-23.1 Exported edits still count after a reload and Resume [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo);
  await downloadExport(page, hand);
  await check('a file is saved and Next card shows', async () => {
    await expect(nextCard(page)).toBeVisible();
  });
  // A person would wait a moment; the script waits until the exported edits are saved.
  await page.waitForFunction(async () => {
    const record = await window.__straightener.Session.peek();
    return !!record && record.exported === true;
  });
  await page.reload();
  await page.waitForFunction(() => !!window.__straightener);
  await check('the start screen offers to resume IMG_9136.JPEG', async () => {
    await expect(page.locator('#btnResume')).toBeVisible();
    await expect(page.locator('#resumeName')).toHaveText(PHOTO);
  });
  await hand.tap(page.locator('#btnResume'));
  await page.waitForFunction(() => !!window.__straightener.app.geometry);
  await check('the photo opens on Export with "Resumed where you left off."', async () => {
    await expect.poll(() => toastMessage(page)).toBe('Resumed where you left off.');
    expect(await page.evaluate(() => window.__straightener.app.tab)).toBe('export');
  });
  await checkNextCardShows(page, check, 'Next card shows in white');
});

const qualityValue = page => page.locator('#qualityValue');

test('EXP-24.1 Quality goes from 50 to 100%, is hidden for PNG, and is one undo step [phone]',
  async ({ page, check }, testInfo) => {
    const hand = await startOn(page, testInfo);
    await openOptions(page, hand, 'export');
    await check('the Quality row reads 92%', async () => {
      await expect(qualityValue(page)).toHaveText('92%');
    });
    await moveQualityTo(page, 'high');
    await check('at the right end it reads 100%', async () => {
      await expect(qualityValue(page)).toHaveText('100%');
    });
    await closeOptions(page, hand, 'export');
    await tapFormat(page, hand, 'PNG');
    await openOptions(page, hand, 'export');
    await check('with PNG there is no Quality row', async () => {
      await expect(page.locator('#qualityRow')).toBeHidden();
    });
    await closeOptions(page, hand, 'export');
    await tapFormat(page, hand, 'JPEG');
    await openOptions(page, hand, 'export');
    await check('with JPEG the Quality row is back, reading 100%', async () => {
      await expect(page.locator('#qualityRow')).toBeVisible();
      await expect(qualityValue(page)).toHaveText('100%');
    });
    await moveQualityTo(page, 'low');
    await check('at the left end it reads 50%', async () => {
      await expect(qualityValue(page)).toHaveText('50%');
    });
    await closeOptions(page, hand, 'export');
    await hand.tap(page.locator('#btnUndo'));
    await openOptions(page, hand, 'export');
    await check('Undo takes it back to 100%', async () => {
      await expect(qualityValue(page)).toHaveText('100%');
    });
    await closeOptions(page, hand, 'export');
    await openSecondPhoto(page, hand);
    await openOptions(page, hand, 'export');
    await check('the next photo starts at 100%: the undone quality is remembered', async () => {
      await expect(qualityValue(page)).toHaveText('100%');
    });
  });

test('EXP-24.2 A lower Quality gives a smaller file [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo);
  await tapSize(page, hand, '1080');
  const atDefault = await downloadExport(page, hand);
  await check('IMG_9136-straight.jpg is saved at 92%', async () => {
    expect(atDefault.name).toBe('IMG_9136-straight.jpg');
  });
  await openOptions(page, hand, 'export');
  await check('the Quality row reads 92%', async () => {
    await expect(qualityValue(page)).toHaveText('92%');
  });
  await moveQualityTo(page, 'low');
  await check('at the left end it reads 50%', async () => {
    await expect(qualityValue(page)).toHaveText('50%');
  });
  await closeOptions(page, hand, 'export');
  const atLow = await downloadExport(page, hand);
  await check('a second file is saved', async () => {
    expect(atLow.name).toBe('IMG_9136-straight.jpg');
  });
  await check('the file at 50% is smaller than the one at 92%', async () => {
    expect(atLow.bytes).toBeLessThan(atDefault.bytes);
  });
});

test('EXP-25.1 Interpolation picks Bilinear or Bicubic, one undo step each [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo);
  await openOptions(page, hand, 'export');
  const value = page.locator('#interpValue');
  await check('the Interpolation row reads Bilinear', async () => {
    await expect(value).toHaveText('Bilinear');
  });
  await check('its list offers Bilinear and Bicubic (sharper, slower)', async () => {
    const choices = await page.locator('#interp option').allTextContents();
    expect(choices).toEqual(['Bilinear', 'Bicubic (sharper, slower)']);
  });
  await page.locator('#interp').selectOption({ label: 'Bicubic (sharper, slower)' });
  await check('the row reads Bicubic', async () => {
    await expect(value).toHaveText('Bicubic');
  });
  await closeOptions(page, hand, 'export');
  await hand.tap(page.locator('#btnUndo'));
  await openOptions(page, hand, 'export');
  await check('Undo makes it read Bilinear', async () => {
    await expect(value).toHaveText('Bilinear');
  });
  await closeOptions(page, hand, 'export');
  await openSecondPhoto(page, hand);
  await openOptions(page, hand, 'export');
  await check('the next photo starts with Bilinear: the undo put the remembered one back',
    async () => {
      await expect(value).toHaveText('Bilinear');
    });
});

// The fill's row: what it reads, and its swatch's look ({ isCheckered, color }).
async function fillRow(page) {
  const swatch = page.locator('#fillSwatch');
  return {
    text: await page.locator('#fillValue').textContent(),
    isCheckered: await swatch.evaluate(el => getComputedStyle(el).backgroundImage !== 'none'),
    color: await swatch.evaluate(el => getComputedStyle(el).backgroundColor),
  };
}

test('EXP-26.1 Fill outside photo picks a color and shows its swatch [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo);
  await openOptions(page, hand, 'export');
  await check('the row reads White, with a white swatch', async () => {
    expect(await fillRow(page)).toMatchObject({ text: 'White', color: 'rgb(255, 255, 255)' });
  });
  await check('its list offers Transparent, White, Black and Custom…', async () => {
    const choices = await page.locator('#fill option').allTextContents();
    expect(choices).toEqual(['Transparent', 'White', 'Black', 'Custom…']);
  });
  await page.locator('#fill').selectOption({ label: 'Transparent' });
  await check('the row reads Transparent, with a checkered swatch', async () => {
    expect(await fillRow(page)).toMatchObject({ text: 'Transparent', isCheckered: true });
  });
  await page.locator('#fill').selectOption({ label: 'Black' });
  await check('the row reads Black, with a black swatch', async () => {
    const row = await fillRow(page);
    expect(row).toMatchObject({ text: 'Black', isCheckered: false, color: 'rgb(0, 0, 0)' });
  });
  await closeOptions(page, hand, 'export');
  await hand.tap(page.locator('#btnUndo'));
  await openOptions(page, hand, 'export');
  await check('Undo makes it read Transparent, with the checkered swatch', async () => {
    expect(await fillRow(page)).toMatchObject({ text: 'Transparent', isCheckered: true });
  });
  await closeOptions(page, hand, 'export');
  await openSecondPhoto(page, hand);
  await openOptions(page, hand, 'export');
  await check('the next photo starts with Transparent: the undo put the remembered fill back',
    async () => {
      expect((await fillRow(page)).text).toBe('Transparent');
    });
});

test('EXP-27.1 Custom… opens the color picker and shows the Custom color row [phone]', async ({
  page,
  check,
}, testInfo) => {
  // Counts the times the app opens the color picker, which no script can see open.
  await page.addInitScript(() => {
    window.testPickerOpenings = 0;
    const showPicker = HTMLInputElement.prototype.showPicker;
    HTMLInputElement.prototype.showPicker = function countOpening() {
      if (this.type === 'color') window.testPickerOpenings += 1;
      return showPicker.call(this);
    };
  });
  const hand = await startOn(page, testInfo);
  await openOptions(page, hand, 'export');
  const customRow = page.locator('#fillColorRow');
  await check('the fill reads White; there is no Custom color row', async () => {
    await expect(page.locator('#fillValue')).toHaveText('White');
    await expect(customRow).toBeHidden();
  });
  await page.locator('#fill').selectOption({ label: 'Custom…' });
  await check('the color picker opens; the row reads Custom; Custom color reads #ffffff',
    async () => {
      expect(await page.evaluate(() => window.testPickerOpenings)).toBe(1);
      await expect(page.locator('#fillValue')).toHaveText('Custom');
      await expect(customRow).toBeVisible();
      await expect(page.locator('#fillColorValue')).toHaveText('#ffffff');
    });
  // The picker itself is the system's; a drag in it reaches the app as the color input's
  // input events, which fill() sends. Two quick ones stand for a drag from red to orange.
  await page.locator('#fillColor').fill('#ff0000');
  await page.locator('#fillColor').fill('#ff8800');
  await check('Custom color reads #ff8800 and the swatch is that orange', async () => {
    await expect(page.locator('#fillColorValue')).toHaveText('#ff8800');
    expect((await fillRow(page)).color).toBe('rgb(255, 136, 0)');
  });
  await closeOptions(page, hand, 'export');
  await hand.tap(page.locator('#btnUndo'));
  await openOptions(page, hand, 'export');
  await check('one Undo: the fill reads White again and the Custom color row is gone',
    async () => {
      await expect(page.locator('#fillValue')).toHaveText('White');
      await expect(customRow).toBeHidden();
    });
});

// The four corners of a saved image, as fractions, top-left first, clockwise.
const IMAGE_CORNERS = [[0, 0], [1, 0], [1, 1], [0, 1]];

// Downloads the export and reads its four corner pixels.
async function downloadCorners(page, hand) {
  const saved = await downloadExport(page, hand);
  const { pixels } = await readSavedPixels(page, saved.file, IMAGE_CORNERS);
  return { name: saved.name, corners: pixels };
}

test('EXP-28.1 The fill paints the empty corners, and a JPEG flattens Transparent onto white '
  + '[phone] [webkit]', async ({ page, check }, testInfo) => {
  const hand = await startOn(page, testInfo, { step: 'rotate' });
  await typeAngle(page, hand, '10');
  await check('the angle reads 10.0°', async () => {
    await expect(page.locator('#rotateAngleText')).toHaveText('10.0°');
  });
  await goToStep(page, 'export', hand);
  await tapSize(page, hand, '1080');
  await tapFormat(page, hand, 'PNG');
  await check('the size line reads Output 1080 × 1080 px · PNG', async () => {
    expect(await readoutText(page)).toBe('Output 1080 × 1080 px · PNG');
  });
  await chooseFill(page, hand, 'transparent');
  const transparent = await downloadCorners(page, hand);
  const empty = transparent.corners
    .map((pixel, index) => (pixel[3] === 0 ? index : -1))
    .filter(index => index >= 0);
  await check('IMG_9136-straight.png is saved, with two see-through corners', async () => {
    expect(transparent.name).toBe('IMG_9136-straight.png');
    expect(empty).toHaveLength(2);
  });
  await chooseFill(page, hand, '#000000');
  const black = await downloadCorners(page, hand);
  await check('in the second PNG the same corners are solid black', async () => {
    expect(empty.map(index => black.corners[index])).toEqual([[0, 0, 0, 255], [0, 0, 0, 255]]);
  });
  await chooseFill(page, hand, 'transparent');
  await tapFormat(page, hand, 'JPEG');
  const flattened = await downloadCorners(page, hand);
  await check('IMG_9136-straight.jpg is saved, with those corners white', async () => {
    expect(flattened.name).toBe('IMG_9136-straight.jpg');
    const corners = empty.map(index => flattened.corners[index]);
    expect(corners.every(pixel => pixel.slice(0, 3).every(isNearWhite))).toBe(true);
  });
});

// A JPEG channel this close to 255 or to 0 is white or black after compression.
const isNearWhite = channel => channel >= 250;
const isNearBlack = channel => channel <= 30;
// Points on the lines between the corner sheet's four tiles, as fractions of its size: the
// line down the middle, above and below the center, and the line across, left and right.
const SHEET_GUTTER_POINTS = [[0.5, 0.25], [0.5, 0.75], [0.25, 0.5], [0.75, 0.5]];

test('EXP-28.2 The fill paints the gap between the corner sheet\'s tiles [phone] [webkit]',
  async ({ page, check }, testInfo) => {
    const hand = await startOn(page, testInfo);
    await openOptions(page, hand, 'export');
    await check('Fill outside photo reads White', async () => {
      await expect(page.locator('#fillValue')).toHaveText('White');
    });
    await page.locator('#fill').selectOption({ label: 'Black' });
    await closeOptions(page, hand, 'export');
    await check('the swatch is black', async () => {
      expect((await fillRow(page)).color).toBe('rgb(0, 0, 0)');
    });
    await hand.tap(page.locator('#btnCornerShots'));
    await check('the Corner shots sheet opens with 1 sheet selected', async () => {
      await expect(page.locator('#btnCornerDownload')).toBeVisible();
      expect(await selectedChoices(page, 'cornerOutput')).toEqual(['1 sheet']);
    });
    const sheet = await saveFileBy(page, hand, page.locator('#btnCornerDownload'));
    const { pixels } = await readSavedPixels(page, sheet.file, SHEET_GUTTER_POINTS);
    await check('a 2 × 2 sheet of the corners is saved', async () => {
      expect(sheet.name).toMatch(/^IMG_9136-.*\.jpg$/);
    });
    await check('the lines between the tiles are black', async () => {
      expect(pixels.every(pixel => pixel.slice(0, 3).every(isNearBlack))).toBe(true);
    });
  });

// Opens the Corner shots sheet (a section of the panel on a wide screen), chooses one of its
// outputs ('4 photos' or '1 sheet') and closes it again on a phone.
async function chooseCornerOutput(page, hand, label) {
  await hand.tap(page.locator('#btnCornerShots'));
  await hand.tap(choiceButton(page, 'cornerOutput', label));
  await closeOptions(page, hand, 'cornerShots');
}

test('EXP-29.1 Reset export settings puts five settings back in one undo step [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo);
  await openOptions(page, hand, 'export');
  await moveQualityTo(page, 'low');
  await page.locator('#interp').selectOption('bicubic');
  await page.locator('#fill').selectOption('#000000');
  await check('Quality reads 50%, Interpolation Bicubic, the fill Black', async () => {
    await expect(qualityValue(page)).toHaveText('50%');
    await expect(page.locator('#interpValue')).toHaveText('Bicubic');
    await expect(page.locator('#fillValue')).toHaveText('Black');
  });
  await closeOptions(page, hand, 'export');
  await tapSize(page, hand, '1080');
  await tapFormat(page, hand, 'PNG');
  await check('1080 and PNG are selected', async () => {
    await expectSelected(page, 'exportSize', '1080');
    await expectSelected(page, 'exportFormat', 'PNG');
  });
  await chooseCornerOutput(page, hand, '4 photos');
  await check('4 photos was selected', async () => {
    expect(await selectedChoices(page, 'cornerOutput')).toEqual(['4 photos']);
  });
  await openOptions(page, hand, 'export');
  await hand.tap(page.locator('#exportResetRow'));
  await check('Quality reads 92%, Interpolation Bilinear, the fill White', async () => {
    await expect(qualityValue(page)).toHaveText('92%');
    await expect(page.locator('#interpValue')).toHaveText('Bilinear');
    await expect(page.locator('#fillValue')).toHaveText('White');
  });
  await closeOptions(page, hand, 'export');
  await check('2000 and JPEG are selected', async () => {
    await expectSelected(page, 'exportSize', '2000');
    await expectSelected(page, 'exportFormat', 'JPEG');
  });
  await hand.tap(page.locator('#btnCornerShots'));
  await check('in Corner shots, 4 photos is still selected', async () => {
    expect(await selectedChoices(page, 'cornerOutput')).toEqual(['4 photos']);
  });
  await closeOptions(page, hand, 'cornerShots');
  await hand.tap(page.locator('#btnUndo'));
  await check('one Undo selects 1080 and PNG again', async () => {
    await expectSelected(page, 'exportSize', '1080');
    await expectSelected(page, 'exportFormat', 'PNG');
  });
  await openOptions(page, hand, 'export');
  await check('Interpolation reads Bicubic and the fill Black; Quality is hidden', async () => {
    await expect(page.locator('#interpValue')).toHaveText('Bicubic');
    await expect(page.locator('#fillValue')).toHaveText('Black');
    await expect(page.locator('#qualityRow')).toBeHidden();
  });
  await closeOptions(page, hand, 'export');
  await tapFormat(page, hand, 'JPEG');
  await openOptions(page, hand, 'export');
  await check('with JPEG, Quality reads 50%: all five came back', async () => {
    await expect(qualityValue(page)).toHaveText('50%');
  });
});

// The source line's text.
const sourceLine = page => page.locator('#sourceInfo');

// A photo file's size in MB to one decimal, as the source line gives it.
const megabytesOf = file => (fs.statSync(file).size / 1048576).toFixed(1);

test('EXP-30.1 The source line describes the photo as received [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo);
  await openOptions(page, hand, 'export');
  const megabytes = megabytesOf(samplePath(PHOTO));
  await check('it reads Source 1498 × 2098 px (3.1 MP) · image/jpeg · N MB · IMG_9136.JPEG',
    async () => {
      await expect(sourceLine(page)).toHaveText(
        `Source 1498 × 2098 px (3.1 MP) · image/jpeg · ${megabytes} MB · ${PHOTO}`,
      );
    });
});

test('EXP-31.1 The version line names the app and its version [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo);
  await openOptions(page, hand, 'export');
  const config = fs.readFileSync(path.join(root, 'js/config.js'), 'utf8');
  const version = config.match(/appVersion:\s*'([^']+)'/)[1];
  await check(`a line reads Card Finisher ${version}`, async () => {
    await expect(page.locator('#versionInfo')).toHaveText(`Card Finisher ${version}`);
  });
});

// A link that makes the on-screen copy of the photo 512 px on its long side.
const SMALL_PREVIEW_LINK = 'index.html?previewMaxPx=512';
// The on-screen copy's long side with that link, in px.
const SMALL_PREVIEW_PX = 512;

// The size of a saved image file, as [width, height] in px.
async function savedSize(page, file) {
  const image = await readSavedImage(page, file);
  return [image.width, image.height];
}

test('EXP-32.1 The saved file doesn\'t depend on the preview\'s resolution [phone] [webkit]',
  async ({ page, check }, testInfo) => {
    const hand = await startOn(page, testInfo);
    await tapSize(page, hand, 'Original');
    const first = await downloadAnswering(page, hand);
    await check('IMG_9136-straight.jpg of 1400 × 1400 px is saved', async () => {
      expect(first.name).toBe('IMG_9136-straight.jpg');
      expect(await savedSize(page, first.file)).toEqual([CROP_PX, CROP_PX]);
    });
    await openOptions(page, hand, 'export');
    const saved = await saveFileBy(page, hand, page.locator('#btnSaveEdits'));
    await check('IMG_9136-edits.json is saved', async () => {
      expect(saved.name).toBe('IMG_9136-edits.json');
    });
    const editsFile = testInfo.outputPath(saved.name);
    fs.copyFileSync(saved.file, editsFile);
    await openApp(page, SMALL_PREVIEW_LINK);
    await openPhoto(page, PHOTO);
    await check('the photo opens; on screen it is the 512 px copy', async () => {
      const longSide = await page.evaluate(() => {
        const preview = window.__straightener.app.preview.canvas;
        return Math.max(preview.width, preview.height);
      });
      expect(longSide).toBe(SMALL_PREVIEW_PX);
    });
    await goToStep(page, 'export', hand);
    await openOptions(page, hand, 'export');
    await loadEditsFile(page, hand, editsFile);
    await check('Original is selected', async () => {
      await expectSelected(page, 'exportSize', 'Original');
    });
    await closeOptions(page, hand, 'export');
    const second = await downloadAnswering(page, hand);
    await check('a second IMG_9136-straight.jpg of 1400 × 1400 px is saved', async () => {
      expect(second.name).toBe('IMG_9136-straight.jpg');
      expect(await savedSize(page, second.file)).toEqual([CROP_PX, CROP_PX]);
    });
    await check('the two files are the same, byte for byte', async () => {
      expect(isSameFile(first.file, second.file)).toBe(true);
    });
  });

test('EXP-32.2 The saved file has the applied levels, not unapplied ones [phone] [webkit]',
  async ({ page, check }, testInfo) => {
    const hand = await startOn(page, testInfo);
    await tapSize(page, hand, '1080');
    const first = await downloadAnswering(page, hand);
    await check('IMG_9136-straight.jpg is saved', async () => {
      expect(first.name).toBe('IMG_9136-straight.jpg');
    });
    await goToStep(page, 'levels', hand);
    await makeLevelsDraft(page, hand);
    await check('a white dot shows on the Levels tab', async () => {
      await expect(page.locator('[data-step="levels"]:visible .step-tab-mark')).toBeVisible();
    });
    await goToStep(page, 'export', hand);
    await check('a note reads "Levels has unapplied changes; export uses the applied levels."',
      async () => {
        expect(await visibleNotes(page)).toEqual([LEVELS_NOTE]);
      });
    const second = await downloadAnswering(page, hand);
    await check('a second file is saved, byte for byte the same as the first', async () => {
      expect(isSameFile(first.file, second.file)).toBe(true);
    });
    await goToStep(page, 'levels', hand);
    await hand.tap(page.locator('#btnApplyLevels'));
    await check('the white dot goes', async () => {
      await expect(page.locator('[data-step="levels"]:visible .step-tab-mark')).toBeHidden();
    });
    await goToStep(page, 'export', hand);
    const third = await downloadAnswering(page, hand);
    await check('a third file is saved, and it differs from the first', async () => {
      expect(third.name).toBe('IMG_9136-straight.jpg');
      expect(isSameFile(first.file, third.file)).toBe(false);
    });
  });

// The tip on Original in Export options.
const ORIGINAL_TIP = 'Original keeps the crop at the photo’s own resolution and never upscales.';

// Opens Export options' Tips, if they are folded.
async function unfoldExportTips(page, hand) {
  const tips = page.locator('#exportTips');
  if (await tips.getAttribute('aria-expanded') !== 'true') await hand.tap(tips);
}

test('EXP-33.1 The long edge fits the size and is enlarged only on Yes [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo);
  await tapSize(page, hand, '1080');
  const at1080 = await downloadAnswering(page, hand);
  await check('no question; the saved file is 1080 × 1080 px', async () => {
    expect(at1080.question).toBe('');
    expect(await savedSize(page, at1080.file)).toEqual([1080, 1080]);
  });
  await tapSize(page, hand, '3000');
  const downloading = page.waitForEvent('download');
  await hand.tap(page.locator('#btnDownload'));
  await checkAskedToUpscale(page, check, 3000);
  await hand.tap(questionButton(page, 'No'));
  const notEnlarged = await (await downloading).path();
  await check('the saved file is 1400 × 1400 px: not enlarged', async () => {
    expect(await savedSize(page, notEnlarged)).toEqual([CROP_PX, CROP_PX]);
  });
  const enlarged = await downloadAnswering(page, hand, 'Yes');
  await check('after Yes, the saved file is 3000 × 3000 px', async () => {
    expect(enlarged.question).toBe('Upscale to 3000 px?');
    expect(await savedSize(page, enlarged.file)).toEqual([3000, 3000]);
  });
  await tapSize(page, hand, 'Original');
  const original = await downloadAnswering(page, hand);
  await check('with Original, no question; the saved file is 1400 × 1400 px', async () => {
    expect(original.question).toBe('');
    expect(await savedSize(page, original.file)).toEqual([CROP_PX, CROP_PX]);
  });
  await openOptions(page, hand, 'export');
  await unfoldExportTips(page, hand);
  await check(`a tip reads "${ORIGINAL_TIP}"`, async () => {
    await expect(page.locator('#exportSheet').getByText(ORIGINAL_TIP)).toBeVisible();
  });
});

test('EXP-34.1 The saved photo is at most 16,777,216 px in area [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  test.fail(true, 'BUG-142');
  const hand = await startOn(page, testInfo, { address: OVER_LIMIT_LINK });
  await check('the size line begins Output 4096 × 4096 px · JPEG', async () => {
    expect(await readoutText(page)).toMatch(/^Output 4096 × 4096 px · JPEG/);
  });
  // Answers No if the question is asked, so the file still comes and its size can be read.
  const saved = await downloadAnswering(page, hand, 'No');
  await check('no question card: upscaling is already on, so a file is saved straight away',
    () => {
      expect(saved.question).toBe('');
    });
  await check('the saved file is 4096 × 4096 px: 16,777,216 px in area', async () => {
    expect(await savedSize(page, saved.file)).toEqual([4096, 4096]);
  });
});

test('EXP-34.2 The saved photo\'s long side is capped [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo, { address: 'index.html?maxOutputPx=1000' });
  await tapSize(page, hand, '3000');
  await check('the size line reads Output 657 × 657 px · JPEG · full crop, not upscaled',
    async () => {
      expect(await readoutText(page)).toBe('Output 657 × 657 px · JPEG · full crop, not upscaled');
    });
  const downloading = page.waitForEvent('download');
  await hand.tap(page.locator('#btnDownload'));
  await checkAskedToUpscale(page, check, 3000);
  await hand.tap(questionButton(page, 'Yes'));
  const saved = await (await downloading).path();
  await check('the saved file is 1000 × 1000 px: capped at 1000 px, not 3000', async () => {
    expect(await savedSize(page, saved)).toEqual([1000, 1000]);
  });
});

test('EXP-36.1 Bicubic gives a different file from Bilinear [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo);
  await tapSize(page, hand, '1080');
  const bilinear = await downloadAnswering(page, hand);
  await check('no question; IMG_9136-straight.jpg of 1080 × 1080 px is saved', async () => {
    expect(bilinear.question).toBe('');
    expect(bilinear.name).toBe('IMG_9136-straight.jpg');
    expect(await savedSize(page, bilinear.file)).toEqual([1080, 1080]);
  });
  await openOptions(page, hand, 'export');
  await check('the Interpolation row reads Bilinear', async () => {
    await expect(page.locator('#interpValue')).toHaveText('Bilinear');
  });
  await page.locator('#interp').selectOption({ label: 'Bicubic (sharper, slower)' });
  await check('the row reads Bicubic', async () => {
    await expect(page.locator('#interpValue')).toHaveText('Bicubic');
  });
  await closeOptions(page, hand, 'export');
  const bicubic = await downloadAnswering(page, hand);
  await check('a second file of 1080 × 1080 px is saved', async () => {
    expect(await savedSize(page, bicubic.file)).toEqual([1080, 1080]);
  });
  await check('the two files differ', async () => {
    expect(isSameFile(bilinear.file, bicubic.file)).toBe(false);
  });
});

test('EXP-36.2 An upscale is bicubic whatever Interpolation says [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo);
  await tapSize(page, hand, '3000');
  const downloading = page.waitForEvent('download');
  await hand.tap(page.locator('#btnDownload'));
  await checkAskedToUpscale(page, check, 3000);
  await hand.tap(questionButton(page, 'Yes'));
  const withBilinear = await (await downloading).path();
  await check('IMG_9136-straight.jpg of 3000 × 3000 px is saved', async () => {
    expect(await savedSize(page, withBilinear)).toEqual([3000, 3000]);
  });
  await openOptions(page, hand, 'export');
  await check('the Interpolation row reads Bilinear', async () => {
    await expect(page.locator('#interpValue')).toHaveText('Bilinear');
  });
  await page.locator('#interp').selectOption({ label: 'Bicubic (sharper, slower)' });
  await check('the row reads Bicubic', async () => {
    await expect(page.locator('#interpValue')).toHaveText('Bicubic');
  });
  await closeOptions(page, hand, 'export');
  const withBicubic = await downloadAnswering(page, hand, 'Yes');
  await check('a second file of 3000 × 3000 px is saved', async () => {
    expect(withBicubic.question).toBe('Upscale to 3000 px?');
    expect(await savedSize(page, withBicubic.file)).toEqual([3000, 3000]);
  });
  await check('the two files are the same, byte for byte', async () => {
    expect(isSameFile(withBilinear, withBicubic.file)).toBe(true);
  });
});

test('EXP-37.1 The saved file is named for the photo and the format [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo);
  await tapSize(page, hand, '1080');
  const jpeg = await downloadAnswering(page, hand);
  await check('a file named IMG_9136-straight.jpg is saved', async () => {
    expect(jpeg.name).toBe('IMG_9136-straight.jpg');
  });
  await tapFormat(page, hand, 'PNG');
  const png = await downloadAnswering(page, hand);
  await check('a file named IMG_9136-straight.png is saved', async () => {
    expect(png.name).toBe('IMG_9136-straight.png');
  });
  await tapFormat(page, hand, 'WebP');
  const webp = await downloadAnswering(page, hand);
  await check('a file named IMG_9136-straight.webp is saved', async () => {
    expect(webp.name).toBe('IMG_9136-straight.webp');
  });
});

// The name the app gives a pasted photo.
const PASTED_NAME = 'pasted-photo';

test('EXP-37.2 A pasted photo saves as pasted-photo-straight.jpg [desktop]', async ({
  page,
  context,
  browserName,
  check,
}, testInfo) => {
  await allowClipboard(context, browserName);
  await installShareStandIn(page);
  await openApp(page);
  const hand = handFor(page, testInfo);
  // Before the case: the photo is copied as an image, as an image viewer's Copy does.
  await copyPhotoToClipboard(page, samplePath(PHOTO));
  await page.keyboard.press('Control+V');
  await waitForPhotoOpen(page, PASTED_NAME);
  await check('the card photo opens and its corners are found', async () => {
    expect(await page.evaluate(() => window.__straightener.app.geometry.ok)).toBe(true);
  });
  await goToStep(page, 'export', hand);
  await tapSize(page, hand, '1080');
  await check('1080 is selected', async () => {
    await expectSelected(page, 'exportSize', '1080');
  });
  const saved = await downloadAnswering(page, hand);
  await check('a file named pasted-photo-straight.jpg is saved', async () => {
    expect(saved.name).toBe(`${PASTED_NAME}-straight.jpg`);
  });
});

// The first four bytes of every PNG file (part of its signature).
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47];
// The done message when WebP was saved as a PNG: "Exported 1080 × 1080 px in N s. WEBP isn’t
// supported by this browser, so it was saved as PNG."
const WEBP_FALLBACK_MESSAGE = new RegExp('^Exported 1080 × 1080 px in \\d+\\.\\d s\\. WEBP '
  + 'isn’t supported by this browser, so it was saved as PNG\\.$');

test('EXP-38.2 Where WebP can\'t be saved, Download saves a PNG and says so [phone]', async ({
  page,
  check,
}, testInfo) => {
  await takeAwayWebpSaving(page);
  const hand = await startOn(page, testInfo);
  await tapSize(page, hand, '1080');
  await tapFormat(page, hand, 'WebP');
  await check('WebP is selected; the size line reads Output 1080 × 1080 px · WEBP', async () => {
    await expectSelected(page, 'exportFormat', 'WebP');
    expect(await readoutText(page)).toBe('Output 1080 × 1080 px · WEBP');
  });
  const saved = await downloadAnswering(page, hand);
  await check('a file named IMG_9136-straight.png is saved', async () => {
    expect(saved.name).toBe('IMG_9136-straight.png');
  });
  await check('the message says WEBP isn’t supported, so it was saved as PNG, as a warning',
    async () => {
      await expect.poll(() => toastMessage(page)).toMatch(WEBP_FALLBACK_MESSAGE);
      await expect(page.locator('#toast')).toHaveClass(/is-warn/);
    });
  await check('the saved file is a PNG of 1080 × 1080 px', async () => {
    const bytes = fs.readFileSync(saved.file);
    expect(Array.from(bytes.subarray(0, PNG_SIGNATURE.length))).toEqual(PNG_SIGNATURE);
    expect(await savedSize(page, saved.file)).toEqual([1080, 1080]);
  });
});

// How far a progress line's top may be from the edge it runs along, in CSS px (it is 3 px
// tall and sits on the edge, 1 px above it on a control area).
const LINE_ON_EDGE_PX = 1.5;

// Expects an export's record (recordExports) to show one progress line, on the top edge of
// the element `hostId`.
function expectLineOnTopEdge(start, hostId) {
  expect(start.host).toBe(hostId);
  expect(Math.abs(start.edgeOffsetPx)).toBeLessThanOrEqual(LINE_ON_EDGE_PX);
  expect(start.linesShown).toBe(1);
}

test('EXP-39.1 The main export\'s line runs on the top edge of Export\'s controls [both]',
  async ({ page, check }, testInfo) => {
    const hand = await startOn(page, testInfo, { isWatched: true });
    const downloading = page.waitForEvent('download');
    await hand.tap(page.locator('#btnDownload'));
    await checkAskedToUpscale(page, check);
    await hand.tap(questionButton(page, 'No'));
    const saved = await downloading;
    await check('a thin red line runs along the top edge of the controls, and on no other edge',
      async () => {
        const [start] = await exportStarts(page);
        expectLineOnTopEdge(start, 'exportArea');
      });
    await waitForExportEnd(page);
    await check('a file named IMG_9136-straight.jpg is saved, and the line has gone', async () => {
      expect(saved.suggestedFilename()).toBe('IMG_9136-straight.jpg');
      await expect(page.locator('#exportArea .progress-line')).toBeHidden();
    });
  });

test('EXP-39.2 Corner shots\' line runs on the top edge of the Corner shots sheet [phone]',
  async ({ page, check }, testInfo) => {
    const hand = await startOn(page, testInfo, { isWatched: true });
    await hand.tap(page.locator('#btnCornerShots'));
    await waitForCornerSheet(page, true);
    await check('the Corner shots sheet rises over the photo', async () => {
      expect(await isSheetOpen(page, 'cornerShotsSheet')).toBe(true);
    });
    const saved = await saveFileBy(page, hand, page.locator('#btnCornerDownload'));
    await check('a thin red line runs along the sheet\'s top edge, and none on the controls',
      async () => {
        const [start] = await exportStarts(page);
        expectLineOnTopEdge(start, 'cornerShotsSheet');
      });
    await waitForExportEnd(page);
    await check('a file of the four corners is saved, and the line has gone', async () => {
      expect(saved.name).toMatch(/^IMG_9136-.*\.jpg$/);
      await expect(page.locator('#cornerShotsSheet .progress-line')).toBeHidden();
    });
  });

// The four corner close-ups that can be seen inside an element.
const visibleCloseUps = (page, selector) => page.locator(`${selector} canvas[data-corner]:visible`);

// The top of an element on the page, in CSS px.
const topOf = async locator => (await locator.boundingBox()).y;

test('EXP-40.1 Corner shots comes before Export options [both]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo);
  const exportTitle = page.locator('#exportSheetTitle');
  const cornerTitle = page.locator('#cornerShotsSheetTitle');
  if (hand.isTouch) {
    await openOptions(page, hand, 'export');
    await check('a sheet titled Export options rises, with no corner close-ups in it', async () => {
      await expect(exportTitle).toHaveText('Export options');
      await expect(exportTitle).toBeVisible();
      await expect(visibleCloseUps(page, '#exportSheet')).toHaveCount(0);
    });
    await closeOptions(page, hand, 'export');
    await hand.tap(page.locator('#btnCornerShots'));
    await waitForCornerSheet(page, true);
    await check('a separate sheet titled Corner shots rises, with four close-ups and no Quality',
      async () => {
        await expect(cornerTitle).toHaveText('Corner shots');
        await expect(visibleCloseUps(page, '#cornerShotsSheet')).toHaveCount(4);
        await expect(page.locator('#cornerShotsSheet #qualityRow')).toHaveCount(0);
        expect(await isSheetOpen(page, 'exportSheet')).toBe(false);
      });
    return;
  }
  await check('the panel lists Corner shots, with four close-ups, above Export options',
    async () => {
      await expect(visibleCloseUps(page, '#cornerShotsSheet')).toHaveCount(4);
      expect(await topOf(cornerTitle)).toBeLessThan(await topOf(exportTitle));
    });
  await hand.tap(page.locator('#btnCornerShots'));
  await check('Corner shots is still listed above Export options', async () => {
    expect(await topOf(cornerTitle)).toBeLessThan(await topOf(exportTitle));
  });
});
