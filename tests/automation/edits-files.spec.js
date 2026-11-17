// The edits-file cases (tests/catalog/edits-files.md): Save edits and Load edits, what the
// file holds and leaves out, the files that are refused or applied with a warning, older
// files, the round trip, the logo in a file, and edits files in a pair.
// Each test saves its edits files with a real download and loads them through the real picker.
// The files a case names are the committed ones in tests/fixtures/; a file too large to commit
// (over 8 MB, or holding a logo over 5 MB) is made in the test from the fixture the case names,
// as the case tells a person to make it. A test reads the app's state only to check a result.
'use strict';
const fs = require('fs');
const { test, expect } = require('./support/case.js');
const {
  openApp,
  goToStep,
  editState,
  openOptions,
  waitForStill,
  hasWhiteFill,
  stepNow,
} = require('./support/app.js');
const { recordExports, exportStarts, downloadAnswering, isSameFile, readoutText } =
  require('./support/export.js');
const {
  waitForStart,
  pickWith,
  waitForPhoto,
  waitForSaved,
} = require('./support/start-and-session.js');
const {
  PORTRAIT_PAIR,
  makePair,
  switchTo,
  chooseOutput,
  chooseInPicker,
  waitForSide,
} = require('./support/front-and-back.js');
const { fixtureLogo, chooseLogo, logoOnPage } = require('./support/overlay.js');
const { openCornerSheet, closeCornerSheet } = require('./support/corner-shots.js');
const {
  PHOTO,
  SAME_SIZE_PHOTO,
  OTHER_SIZE_PHOTO,
  startOn,
  saveEdits,
  loadEdits,
  writeEdits,
  waitForEdits,
  recordMessages,
  messagesSoFar,
  waitForToast,
  historySteps,
} = require('./support/edits-drop-keys.js');
const {
  fixtureFile,
  fixtureEdits,
  toastShownText,
  undoRedoGreyed,
  isLogoGreen,
} = require('./support/edits-files.js');
const { selectedPreset } = require('./support/crop.js');

// The name of IMG_9136.JPEG's edits file.
const EDITS_NAME = 'IMG_9136-edits.json';
// The edits files in tests/fixtures/ that the cases name (each described in its case).
const TURNED = 'IMG_9136-turned-edits.json';
const TURNED_2_DEGREES = 'IMG_9136-turned-2-degrees-edits.json';
const QUALITY_7 = 'IMG_9136-quality-7-edits.json';
const QUALITY_7_GIF_LOGO = 'IMG_9136-quality-7-gif-logo-edits.json';
const GIF_LOGO = 'IMG_9136-gif-logo-edits.json';
const VERSION_3 = 'IMG_9136-version-3-edits.json';
const NO_CORNERS = 'IMG_9136-no-corners-edits.json';
const WIDTH_AS_TEXT = 'IMG_9136-width-as-text-edits.json';
const PLACEMENT_ONLY = 'IMG_9136-logo-placement-only-edits.json';
const VERSION_1 = 'IMG_9136-version-1-edits.json';
const OLDER_CROP = 'IMG_9136-older-crop-edits.json';
const ROUND_TRIP = 'IMG_9136-round-trip-edits.json';
const GREEN_LOGO_EDITS = 'IMG_9136-green-logo-edits.json';
const BACK_PNG_1080 = '14_back_portrait_raw_white-png-1080-edits.json';
const NOTES = 'notes.json';
// The logos in tests/fixtures/: a solid green square, 400 px; random colors, 165 px, 81,928
// bytes.
const GREEN_LOGO = 'green-logo.png';
const NOISY_LOGO = 'noisy-logo.png';
// The messages of the refused files, word for word.
const TOO_LARGE = 'That file is too large to be a Card Finisher edits file.';
const NOT_JSON = 'That file isn’t valid JSON.';
const NOT_EDITS = 'That isn’t a Card Finisher edits file.';
const LOGO_LEFT_OUT = 'The overlay in these edits couldn’t be read, so it was left out.';
// The lines of ruling R12's one warning, in the wording Rich approved (tests/catalog/
// wording.md).
const LOADED_LINE = 'Edits loaded.';
const SAVED_FOR_LINE = 'Saved for “IMG_9136.JPEG”; sizes match.';
const RESET_LINE = 'Reset, not valid: export.';
const LOGO_LINE = 'Overlay left out; it couldn’t be read.';
// The edits file limit (CONFIG.export.editsMaxBytes), and a logo of 5.5 MB: over the logo
// limit of 5 MB (CONFIG.overlay.maxBytes) and, written into a file, still under 8 MB.
const EDITS_MAX_BYTES = 8 * 1024 * 1024;
const OVER_LOGO_LIMIT_BYTES = 5.5 * 1024 * 1024;
// A link that lowers the logo limit to its least, 64 KB: noisy-logo.png is over it.
const LOW_LOGO_LIMIT_LINK = 'index.html?overlay.maxBytes=65536';
// Rounding allowed when comparing page positions, in CSS px.
const PLACE_TOLERANCE_PX = 1;
// How long to watch for a message that must not come, or for a second one, in ms.
const QUIET_MS = 500;
// The size line before and after IMG_9136-older-crop-edits.json is loaded (EDT-11.2).
const SIZE_BEFORE_OLDER_CROP = 'Output 1400 × 1400 px · JPEG · full crop, not upscaled';
const SIZE_AFTER_OLDER_CROP = 'Output 1520 × 1216 px · JPEG · full crop, not upscaled';

// Taps 90° right on the Rotate step and waits for the quarter turn.
async function turnQuarterRight(page, hand) {
  await hand.tap(page.locator('#toolRotateRight'));
  await page.waitForFunction(() => window.__straightener.app.state.rotation.quarter === 1);
}

// Loads the edits file `name` from tests/fixtures/ through Export options (the case's named
// action "Load the edits file").
const loadFixture = (page, hand, name) => loadEdits(page, hand, fixtureFile(name));

// Waits until loading a file has shown `count` messages in all (see recordMessages), then
// gives the app a moment in case another follows, and returns them.
async function messagesAfterLoad(page, count) {
  await page.waitForFunction(wanted => window.testMessages.length >= wanted, count);
  await page.waitForTimeout(QUIET_MS);
  return messagesSoFar(page);
}

// The messages shown since `before` of them had been, after a quiet moment.
async function messagesSince(page, before) {
  await page.waitForTimeout(QUIET_MS);
  return (await messagesSoFar(page)).slice(before);
}

// The edits a case compares before and after a refused file: the whole edit state and how
// many steps Undo and Redo can take.
async function editsAndHistory(page) {
  return { state: await editState(page), history: await historySteps(page) };
}

// Checks a refused file's "nothing has changed" row: the edits and the undo history are as
// `before`, so the photo is upright, and Undo and Redo are still greyed out.
async function expectNothingChanged(page, before) {
  expect(await editsAndHistory(page)).toEqual(before);
  expect((await editState(page)).rotation.quarter).toBe(0);
  expect(await undoRedoGreyed(page)).toEqual({ undo: true, redo: true });
}

// The crop box's shape now: 'portrait' (taller than wide), 'landscape' or 'square'.
async function cropShape(page) {
  const crop = await page.evaluate(() => window.__straightener.app.geometry.crop);
  if (Math.abs(crop.width - crop.height) < 1) return 'square';
  return crop.width > crop.height ? 'landscape' : 'portrait';
}

// Which side the Front | Back switch has selected: 'front', 'back' or null.
function selectedSide(page) {
  return page.locator('#sideSwitch .segment[aria-pressed="true"]')
    .evaluate(el => el.dataset.value);
}

test('EDT-01.1 Save edits saves a readable file named for the photo [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo, { step: 'rotate' });
  await turnQuarterRight(page, hand);
  await check('the photo turns a quarter clockwise', async () => {
    expect((await editState(page)).rotation.quarter).toBe(1);
  });
  await goToStep(page, 'export', hand);
  await check('the Export step shows, with Download', async () => {
    await expect(page.locator('#btnDownload')).toBeVisible();
  });
  const saved = await saveEdits(page, hand, testInfo);
  await check('a file named IMG_9136-edits.json is saved', () => {
    expect(saved.name).toBe(EDITS_NAME);
  });
  const text = fs.readFileSync(saved.file, 'utf8');
  await check('it is plain text, one setting to a line, and its first setting reads '
    + '"version": 2', () => {
    expect(text.startsWith('{\n  "version": 2,\n')).toBe(true);
  });
  await check('under "source": "name": "IMG_9136.JPEG", "width": 1498 and "height": 2098', () => {
    expect(text).toContain('"source": {\n    "name": "IMG_9136.JPEG",\n    "width": 1498,\n'
      + '    "height": 2098\n  }');
  });
  await check('under "rotation": "quarter": 1', () => {
    expect(text).toContain('"rotation": {\n    "quarter": 1,');
  });
});

test('EDT-02.1 The edits file holds the logo picture itself [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo, { step: 'overlay' });
  const logo = fixtureLogo(GREEN_LOGO);
  await chooseLogo(page, hand, page.locator('#btnOverlayAdd'), logo);
  await check('the green square shows on the photo', async () => {
    await expect.poll(() => isLogoGreen(page)).toBe(true);
  });
  await goToStep(page, 'export', hand);
  await check('the Export step shows, with the green square on the photo', async () => {
    await expect.poll(() => isLogoGreen(page)).toBe(true);
  });
  const saved = await saveEdits(page, hand, testInfo);
  await check('a file named IMG_9136-edits.json is saved', () => {
    expect(saved.name).toBe(EDITS_NAME);
  });
  await check('"overlayImage" names green-logo.png, of the type image/png, and holds the '
    + 'logo\'s bytes as base64 that decodes to green-logo.png exactly', () => {
    const embedded = saved.edits.overlayImage;
    expect(embedded.name).toBe(GREEN_LOGO);
    expect(embedded.type).toBe('image/png');
    expect(Buffer.from(embedded.data, 'base64').equals(logo.buffer)).toBe(true);
  });
});

test('EDT-03.1 The file leaves out the photo, unapplied levels and the corner-shots choice '
  + '[phone]', async ({ page, check }, testInfo) => {
  const hand = await startOn(page, testInfo, { step: 'levels' });
  await hand.tap(page.locator('#toolAutoLevels'));
  await check('the photo brightens; a white dot shows on the Levels tab: the levels wait for '
    + 'Apply', async () => {
    await expect(page.locator('[data-step="levels"]:visible .step-tab-mark')).toBeVisible();
    expect(await page.evaluate(() => window.__straightener.app.levelsPending)).toBe(true);
  });
  await goToStep(page, 'export', hand);
  await check('the Export step shows, with Corner shots', async () => {
    await expect(page.locator('#btnCornerShots')).toBeVisible();
  });
  await openCornerSheet(page, hand);
  const output = page.locator('#cornerOutput');
  await check('Corner shots shows 4 photos and 1 sheet', async () => {
    await expect(output.getByRole('button', { name: '4 photos', exact: true })).toBeVisible();
    await expect(output.getByRole('button', { name: '1 sheet', exact: true })).toBeVisible();
  });
  const fourPhotos = output.getByRole('button', { name: '4 photos', exact: true });
  await hand.tap(fourPhotos);
  await check('4 photos is selected (a solid white fill)', async () => {
    await expect(fourPhotos).toHaveAttribute('aria-pressed', 'true');
    expect(await hasWhiteFill(fourPhotos)).toBe(true);
  });
  await closeCornerSheet(page, hand);
  await check('the Export step\'s Download shows (on a phone, the Corner shots sheet has gone)',
    async () => {
      await expect(page.locator('#btnDownload')).toBeVisible();
      if (hand.isTouch) await expect(page.locator('#cornerShotsSheet')).toBeHidden();
    });
  const saved = await saveEdits(page, hand, testInfo);
  const text = fs.readFileSync(saved.file, 'utf8');
  await check('a file named IMG_9136-edits.json is saved, under 10 KB: the photo is not in it',
    () => {
      expect(saved.name).toBe(EDITS_NAME);
      expect(fs.statSync(saved.file).size).toBeLessThan(10 * 1024);
    });
  await check('the levels line reads "levels": null: the unapplied levels are not in it', () => {
    expect(text).toContain('"levels": null');
  });
  await check('the word photos is nowhere in the file: the corner-shots choice is not in it',
    () => {
      expect(text).not.toMatch(/photos/i);
    });
});

test('EDT-03.2 In a pair the file leaves out the other side and Together or Separately '
  + '[phone]', async ({ page, check }, testInfo) => {
  const hand = await makePair(page, testInfo);
  await goToStep(page, 'export', hand);
  await check('the Export step shows Together and Separately beside the size line', async () => {
    await expect(page.locator('#pairOutput')).toBeVisible();
    await expect(page.locator('#pairOutput .segment')).toHaveText(['Together', 'Separately']);
  });
  await chooseOutput(page, hand, 'separately');
  await check('Separately is selected', async () => {
    await expect(page.locator('#pairOutput .segment[aria-pressed="true"]'))
      .toHaveText('Separately');
  });
  const saved = await saveEdits(page, hand, testInfo);
  const text = fs.readFileSync(saved.file, 'utf8');
  await check('a file named 14_back_portrait_raw_white-edits.json is saved', () => {
    expect(saved.name).toBe('14_back_portrait_raw_white-edits.json');
  });
  await check('none of front, separately, together and pair is in the file: neither the other '
    + 'side nor the choice is in it', () => {
    expect(text).not.toMatch(/front|separately|together|pair/i);
  });
});

test('EDT-04.1 Load edits opens a picker for one .json file and applies it [phone] [webkit]',
  async ({ page, check }, testInfo) => {
    const hand = await startOn(page, testInfo, { step: 'rotate' });
    await turnQuarterRight(page, hand);
    await check('the photo turns a quarter clockwise', async () => {
      await waitForEdits(page, { quarter: 1 });
    });
    await goToStep(page, 'export', hand);
    await check('the Export step shows', async () => {
      expect(await stepNow(page)).toBe('export');
    });
    const saved = await saveEdits(page, hand, testInfo);
    await check('a file named IMG_9136-edits.json is saved', () => {
      expect(saved.name).toBe(EDITS_NAME);
    });
    await hand.tap(page.locator('#btnUndo'));
    await check('the photo is upright again', async () => {
      await waitForEdits(page, { quarter: 0 });
    });
    await openOptions(page, hand, 'export');
    await check('Load edits shows', async () => {
      await expect(page.locator('#btnLoadEdits')).toBeVisible();
    });
    const choosing = page.waitForEvent('filechooser');
    await hand.tap(page.locator('#btnLoadEdits'));
    const chooser = await choosing;
    await check('a file picker opens for one file, offering only .json files', async () => {
      expect(chooser.isMultiple()).toBe(false);
      expect(await chooser.element().getAttribute('accept')).toBe('application/json,.json');
    });
    // Handed over with its bytes: see loadEdits on a just-written file.
    await chooser.setFiles({
      name: saved.name,
      mimeType: 'application/json',
      buffer: fs.readFileSync(saved.file),
    });
    await check('the photo turns a quarter clockwise again', async () => {
      await waitForEdits(page, { quarter: 1 });
    });
  });

test('EDT-04.2 While an export runs, Load edits is dimmed and the step tabs stay live [phone]',
  async ({ page, check }, testInfo) => {
    test.fail(true, 'BUG-013');
    await recordExports(page);
    const hand = await startOn(page, testInfo);
    const saved = await downloadAnswering(page, hand);
    await check('the question box asks "Upscale to 2000 px?"', () => {
      expect(saved.question).toBe('Upscale to 2000 px?');
    });
    const starts = await exportStarts(page);
    await check('the export runs: a progress line crosses the top edge of the controls', () => {
      expect(starts.length).toBe(1);
      expect(starts[0].linesShown).toBe(1);
    });
    await check('the step tabs are live, none greyed out', () => {
      expect(starts[0].tabs).toEqual([]);
    });
    await check('Load edits is greyed out', () => {
      expect(starts[0].controls.btnLoadEdits.disabled).toBe(true);
    });
  });

test('EDT-05.1 A file over 8 MB is refused before it is read [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo);
  // The case's file: the fixture made larger than 8 MB with spaces after its last brace, so it
  // is still valid JSON and an edits file in every other way.
  const turned = fixtureFile(TURNED).buffer.toString('utf8');
  const padded = turned + ' '.repeat(EDITS_MAX_BYTES + 1 - Buffer.byteLength(turned));
  const file = {
    name: 'IMG_9136-large-edits.json',
    mimeType: 'application/json',
    buffer: Buffer.from(padded),
  };
  const before = await editsAndHistory(page);
  await loadEdits(page, hand, file);
  await check(`a red message reads "${TOO_LARGE}"`, async () => {
    expect(await waitForToast(page)).toEqual({ text: TOO_LARGE, kind: 'error', isShown: true });
  });
  await check('nothing has changed: the photo is upright, and Undo and Redo are still greyed '
    + 'out', async () => {
    await expectNothingChanged(page, before);
  });
});

test('EDT-05.2 A file that isn\'t JSON is refused [phone]', async ({ page, check }, testInfo) => {
  const hand = await startOn(page, testInfo);
  const before = await editsAndHistory(page);
  await loadFixture(page, hand, NOTES);
  await check(`a red message reads "${NOT_JSON}"`, async () => {
    expect(await waitForToast(page)).toEqual({ text: NOT_JSON, kind: 'error', isShown: true });
  });
  await check('nothing has changed: the photo is upright, and Undo and Redo are still greyed '
    + 'out', async () => {
    await expectNothingChanged(page, before);
  });
});

test('EDT-05.3 JSON that isn\'t an edits file is refused [phone]', async ({
  page,
  check,
}, testInfo) => {
  await recordMessages(page);
  const hand = await startOn(page, testInfo);
  const before = await editsAndHistory(page);
  const shownBefore = (await messagesSoFar(page)).length;
  const rows = [
    { name: VERSION_3, message: `a red message reads "${NOT_EDITS}"` },
    { name: NO_CORNERS, message: 'the same red message shows again' },
    { name: WIDTH_AS_TEXT, message: 'the same red message shows again' },
  ];
  for (const [index, row] of rows.entries()) {
    await loadFixture(page, hand, row.name);
    const messages = await messagesAfterLoad(page, shownBefore + index + 1);
    await check(`${row.name}: ${row.message}; the photo is still upright, and Undo and Redo `
      + 'still greyed out', async () => {
      expect(messages.slice(shownBefore + index)).toEqual([{ text: NOT_EDITS, kind: 'error' }]);
      await expectNothingChanged(page, before);
    });
  }
});

test('EDT-06.1 Edits for a photo of another size are refused, naming both sizes [phone]',
  async ({ page, check }, testInfo) => {
    const hand = await startOn(page, testInfo, { photo: OTHER_SIZE_PHOTO });
    const before = await editsAndHistory(page);
    await loadFixture(page, hand, TURNED);
    const expected = 'These edits are for a 1498×2098 photo; this one is 1536×2048.';
    await check(`a red message reads "${expected}"`, async () => {
      expect(await waitForToast(page)).toEqual({ text: expected, kind: 'error', isShown: true });
    });
    await check('nothing has changed: the photo is upright, and Undo and Redo are still greyed '
      + 'out', async () => {
      await expectNothingChanged(page, before);
    });
  });

test('EDT-07.1 Edits for another photo of the same size are applied with a warning [phone]',
  async ({ page, check }, testInfo) => {
    const hand = await startOn(page, testInfo, { photo: SAME_SIZE_PHOTO });
    await loadFixture(page, hand, TURNED);
    const expected = 'Edits were saved for “IMG_9136.JPEG”. Applied anyway — sizes match.';
    await check(`an amber message reads "${expected}"`, async () => {
      expect(await waitForToast(page)).toEqual({ text: expected, kind: 'warn', isShown: true });
    });
    await check('it is turned a quarter clockwise: the edits were applied', async () => {
      await waitForEdits(page, { quarter: 1 });
    });
  });

// The body of the cases written to ruling R12: loads the fixture `name` into the open photo
// and expects one amber message whose lines are `lines`, in order. Both checks compare plain
// values, so the known defect fails at once.
async function checkOneCombinedWarning(page, check, hand, name, lines) {
  const before = (await messagesSoFar(page)).length;
  await loadFixture(page, hand, name);
  const messages = (await messagesAfterLoad(page, before + 1)).slice(before);
  await check('one amber message shows, and no other message comes after it', () => {
    expect(messages.map(message => message.kind)).toEqual(['warn']);
  });
  const shown = await toastShownText(page);
  const quoted = lines.map(line => `"${line}"`).join(', ');
  await check(`its lines read ${quoted}, in that order`, () => {
    expect(shown).toBe(lines.join(' '));
  });
}

test('EDT-07.2 Another photo\'s name and a damaged setting give one warning [phone]', async ({
  page,
  check,
}, testInfo) => {
  test.fail(true, 'BUG-190');
  await recordMessages(page);
  const hand = await startOn(page, testInfo, { photo: SAME_SIZE_PHOTO });
  await checkOneCombinedWarning(page, check, hand, QUALITY_7,
    [LOADED_LINE, SAVED_FOR_LINE, RESET_LINE]);
});

test('EDT-08.1 A damaged setting is reset and named; the rest is applied [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo);
  await loadFixture(page, hand, QUALITY_7);
  const expected = 'Some settings in these edits weren’t valid and were reset: export.';
  await check(`an amber message reads "${expected}"`, async () => {
    expect(await waitForToast(page)).toEqual({ text: expected, kind: 'warn', isShown: true });
  });
  await check('it is turned a quarter clockwise: the rest of the file was applied', async () => {
    await waitForEdits(page, { quarter: 1 });
  });
  await openOptions(page, hand, 'export');
  await check('Quality reads 92%: the export settings are back to their defaults', async () => {
    await expect(page.locator('#qualityValue')).toHaveText('92%');
  });
});

test('EDT-08.2 A damaged setting and an unreadable logo give one warning [phone]', async ({
  page,
  check,
}, testInfo) => {
  test.fail(true, 'BUG-190');
  await recordMessages(page);
  const hand = await startOn(page, testInfo);
  await checkOneCombinedWarning(page, check, hand, QUALITY_7_GIF_LOGO,
    [LOADED_LINE, RESET_LINE, LOGO_LINE]);
});

test('EDT-09.1 A logo of a type a logo can\'t be is left out with a warning [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo);
  await loadFixture(page, hand, GIF_LOGO);
  await check(`an amber message reads "${LOGO_LEFT_OUT}"`, async () => {
    expect(await waitForToast(page)).toEqual({ text: LOGO_LEFT_OUT, kind: 'warn', isShown: true });
  });
  await check('it is turned a quarter clockwise, with no logo: the rest was applied', async () => {
    await waitForEdits(page, { quarter: 1, hasLogo: false });
    expect(await logoOnPage(page)).toBeNull();
  });
});

test('EDT-09.2 A logo over 5 MB is left out with a warning [phone]', async ({
  page,
  check,
}, testInfo) => {
  // The case's file, made from the fixture as the case says: the logo's type changed to PNG
  // and its data replaced by 5.5 MB of zero bytes, which its size alone refuses.
  const edits = fixtureEdits(GIF_LOGO);
  edits.overlayImage.type = 'image/png';
  edits.overlayImage.data = Buffer.alloc(OVER_LOGO_LIMIT_BYTES).toString('base64');
  const file = writeEdits(testInfo, 'IMG_9136-big-logo-edits.json', edits);
  expect(fs.statSync(file).size).toBeLessThan(EDITS_MAX_BYTES);
  const hand = await startOn(page, testInfo);
  await loadEdits(page, hand, file);
  await check(`an amber message reads "${LOGO_LEFT_OUT}"`, async () => {
    expect(await waitForToast(page)).toEqual({ text: LOGO_LEFT_OUT, kind: 'warn', isShown: true });
  });
  await check('it is turned a quarter clockwise, with no logo: the rest was applied', async () => {
    await waitForEdits(page, { quarter: 1, hasLogo: false });
    expect(await logoOnPage(page)).toBeNull();
  });
});

test('EDT-09.3 A link\'s lower logo limit leaves a larger logo out [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo, { step: 'overlay' });
  await chooseLogo(page, hand, page.locator('#btnOverlayAdd'), fixtureLogo(NOISY_LOGO));
  await check('the logo shows on the photo', async () => {
    expect(await logoOnPage(page)).not.toBeNull();
  });
  await goToStep(page, 'export', hand);
  await check('the Export step shows, with the logo on the photo', async () => {
    expect(await stepNow(page)).toBe('export');
    expect(await logoOnPage(page)).not.toBeNull();
  });
  const saved = await saveEdits(page, hand, testInfo);
  await check('a file named IMG_9136-edits.json is saved', () => {
    expect(saved.name).toBe(EDITS_NAME);
  });
  await openApp(page, LOW_LOGO_LIMIT_LINK);
  await waitForStart(page);
  await check('the start screen offers "Resume IMG_9136.JPEG?"', async () => {
    await expect(page.locator('#resume .resume-name')).toHaveText(`Resume ${PHOTO}?`);
  });
  await hand.tap(page.locator('#btnFresh'));
  await check('the offer to resume goes', async () => {
    await expect(page.locator('#resume')).toBeHidden();
  });
  await pickWith(page, hand, page.locator('#btnOpenEmpty'), PHOTO);
  await waitForPhoto(page, PHOTO);
  await check('the photo opens, with no logo', async () => {
    expect((await editState(page)).overlay).toBeNull();
  });
  await goToStep(page, 'export', hand);
  await check('the Export step shows', async () => {
    expect(await stepNow(page)).toBe('export');
  });
  await loadEdits(page, hand, saved.file);
  await check(`an amber message reads "${LOGO_LEFT_OUT}"; no logo shows`, async () => {
    expect(await waitForToast(page)).toEqual({ text: LOGO_LEFT_OUT, kind: 'warn', isShown: true });
    expect((await editState(page)).overlay).toBeNull();
  });
});

test('EDT-09.4 A logo placement with no picture keeps a logo the app already has [phone]',
  async ({ page, check }, testInfo) => {
    await recordMessages(page);
    const hand = await startOn(page, testInfo, { step: 'overlay' });
    await chooseLogo(page, hand, page.locator('#btnOverlayAdd'), fixtureLogo(GREEN_LOGO));
    await hand.tap(page.locator('#toolOverlayRemove'));
    await check('the logo goes from the photo', async () => {
      await waitForEdits(page, { hasLogo: false });
    });
    await goToStep(page, 'export', hand);
    await check('the Export step shows, with no logo on the photo', async () => {
      expect(await stepNow(page)).toBe('export');
      expect(await logoOnPage(page)).toBeNull();
    });
    const before = (await messagesSoFar(page)).length;
    await loadFixture(page, hand, PLACEMENT_ONLY);
    await check('the green logo is back on the photo, with no message', async () => {
      await waitForEdits(page, { hasLogo: true });
      await expect.poll(() => isLogoGreen(page)).toBe(true);
      expect(await messagesSince(page, before)).toEqual([]);
    });
  });

test('EDT-09.5 A logo placement with no picture, the logo not loaded, is left out [phone]',
  async ({ page, check }, testInfo) => {
    const hand = await startOn(page, testInfo);
    await loadFixture(page, hand, PLACEMENT_ONLY);
    await check(`an amber message reads "${LOGO_LEFT_OUT}"`, async () => {
      expect(await waitForToast(page)).toEqual({
        text: LOGO_LEFT_OUT,
        kind: 'warn',
        isShown: true,
      });
    });
    await check('no logo shows on it', async () => {
      expect((await editState(page)).overlay).toBeNull();
      expect(await logoOnPage(page)).toBeNull();
    });
  });

test('EDT-09.6 Another photo\'s name, a damaged setting and an unreadable logo give one '
  + 'warning [phone]', async ({ page, check }, testInfo) => {
  test.fail(true, 'BUG-190');
  await recordMessages(page);
  const hand = await startOn(page, testInfo, { photo: SAME_SIZE_PHOTO });
  await checkOneCombinedWarning(page, check, hand, QUALITY_7_GIF_LOGO,
    [LOADED_LINE, SAVED_FOR_LINE, RESET_LINE, LOGO_LINE]);
});

test('EDT-10.1 Loading is one undo step; loading the same edits again adds none [phone]',
  async ({ page, check }, testInfo) => {
    const hand = await startOn(page, testInfo);
    await loadFixture(page, hand, TURNED_2_DEGREES);
    await check('the photo is turned a quarter and tilted 2°; Undo is no longer greyed out',
      async () => {
        await waitForEdits(page, { quarter: 1, fine: 2 });
        await expect(page.locator('#btnUndo')).toBeEnabled();
      });
    await hand.tap(page.locator('#btnUndo'));
    await check('both are taken back at once: the photo is upright, not tilted, and Undo is '
      + 'greyed out', async () => {
      await waitForEdits(page, { quarter: 0, fine: 0 });
      await expect(page.locator('#btnUndo')).toBeDisabled();
    });
    await hand.tap(page.locator('#btnRedo'));
    await check('the photo is turned a quarter and tilted 2° again', async () => {
      await waitForEdits(page, { quarter: 1, fine: 2 });
    });
    const turned = await editState(page);
    await loadFixture(page, hand, TURNED_2_DEGREES);
    await page.waitForTimeout(QUIET_MS);
    await check('the photo does not move', async () => {
      expect(await editState(page)).toEqual(turned);
    });
    await hand.tap(page.locator('#btnUndo'));
    await check('the photo is upright, not tilted, and Undo is greyed out: the second load '
      + 'added no step', async () => {
      await waitForEdits(page, { quarter: 0, fine: 0 });
      await expect(page.locator('#btnUndo')).toBeDisabled();
    });
  });

test('EDT-11.1 A version 1 file\'s Square up becomes Flatten 0% [phone]', async ({
  page,
  check,
}, testInfo) => {
  await recordMessages(page);
  const hand = await startOn(page, testInfo);
  const before = (await messagesSoFar(page)).length;
  await loadFixture(page, hand, VERSION_1);
  // The file is taken once the app holds its Flatten of 0% (row 3 shows it on screen).
  await page.waitForFunction(() => window.__straightener.app.state.strength === 0);
  await check('no message shows: the file, with its Case target, is taken', async () => {
    expect(await messagesSince(page, before)).toEqual([]);
  });
  await goToStep(page, 'perspective', hand);
  await check('the Perspective step shows, with Flatten in the row of tools', async () => {
    await expect(page.locator('#toolFlatten')).toBeVisible();
  });
  await check('Flatten reads 0%', async () => {
    await expect(page.locator('#toolFlatten .tool-value')).toHaveText('0%');
  });
});

test('EDT-11.2 A file from before the crop followed the card takes its swap setting [phone]',
  async ({ page, check }, testInfo) => {
    const hand = await startOn(page, testInfo);
    expect(await readoutText(page)).toBe(SIZE_BEFORE_OLDER_CROP);
    await loadFixture(page, hand, OLDER_CROP);
    await page.waitForFunction(() => window.__straightener.app.state.crop.preset === '5:4');
    await check(`the size line reads ${SIZE_AFTER_OLDER_CROP}: wider than tall`, async () => {
      await expect.poll(() => readoutText(page)).toBe(SIZE_AFTER_OLDER_CROP);
    });
    await goToStep(page, 'crop', hand);
    await check('5:4 is selected and the box is wider than tall, 5 wide to 4 high, though the '
      + 'card is upright', async () => {
      await expect(selectedPreset(page)).toHaveText('5:4');
      expect(await cropShape(page)).toBe('landscape');
    });
  });

test('EDT-12.1 Re-opened with its edits file, the photo exports the same file [phone] '
  + '[webkit]', async ({ page, check }, testInfo) => {
  const hand = await startOn(page, testInfo);
  await loadFixture(page, hand, ROUND_TRIP);
  await check('the photo is tilted 3°, cropped 4:5 (taller than wide), brighter, with the green '
    + 'logo on it', async () => {
    await waitForEdits(page, { fine: 3, hasLogo: true });
    expect(await cropShape(page)).toBe('portrait');
    expect((await editState(page)).levels).not.toBeNull();
    await expect.poll(() => isLogoGreen(page)).toBe(true);
  });
  const first = await downloadAnswering(page, hand);
  await check('a file named IMG_9136-straight.jpg is saved', () => {
    expect(first.name).toBe('IMG_9136-straight.jpg');
  });
  const firstCopy = testInfo.outputPath('first-IMG_9136-straight.jpg');
  fs.copyFileSync(first.file, firstCopy);
  const saved = await saveEdits(page, hand, testInfo);
  await check('a file named IMG_9136-edits.json is saved', () => {
    expect(saved.name).toBe(EDITS_NAME);
  });
  await page.reload();
  await waitForStart(page);
  await check('the start screen offers "Resume IMG_9136.JPEG?"', async () => {
    await expect(page.locator('#resume .resume-name')).toHaveText(`Resume ${PHOTO}?`);
  });
  await hand.tap(page.locator('#btnFresh'));
  await check('the offer to resume goes', async () => {
    await expect(page.locator('#resume')).toBeHidden();
  });
  await pickWith(page, hand, page.locator('#btnOpenEmpty'), PHOTO);
  await waitForPhoto(page, PHOTO);
  await check('the photo opens with no edits: not tilted, no logo', async () => {
    const state = await editState(page);
    expect([state.rotation.fine, state.overlay]).toEqual([0, null]);
  });
  await goToStep(page, 'export', hand);
  await check('the Export step shows', async () => {
    expect(await stepNow(page)).toBe('export');
  });
  await loadEdits(page, hand, saved.file);
  await check('the edits come back: tilted 3°, 4:5, brighter, with the green logo', async () => {
    await waitForEdits(page, { fine: 3, hasLogo: true });
    expect(await cropShape(page)).toBe('portrait');
    expect((await editState(page)).levels).not.toBeNull();
    await expect.poll(() => isLogoGreen(page)).toBe(true);
  });
  const second = await downloadAnswering(page, hand);
  await check('a second IMG_9136-straight.jpg is saved, the same as the first byte for byte',
    () => {
      expect(second.name).toBe('IMG_9136-straight.jpg');
      expect(isSameFile(firstCopy, second.file)).toBe(true);
    });
});

test('EDT-13.1 A loaded logo is kept for Resume but is not the saved logo [phone] [webkit]',
  async ({ page, check }, testInfo) => {
    const logoId = fixtureEdits(GREEN_LOGO_EDITS).overlay.id;
    const hand = await startOn(page, testInfo);
    await loadFixture(page, hand, GREEN_LOGO_EDITS);
    await check('the green logo is on the photo', async () => {
      await waitForEdits(page, { hasLogo: true });
      await expect.poll(() => isLogoGreen(page)).toBe(true);
    });
    await goToStep(page, 'overlay', hand);
    await check('the Overlay step shows the green logo, with Remove in the row of tools',
      async () => {
        await expect.poll(() => isLogoGreen(page)).toBe(true);
        await expect(page.locator('#toolOverlayRemove')).toBeVisible();
      });
    await hand.tap(page.locator('#toolOverlayRemove'));
    await check('the logo goes; Add logo shows, and no Use saved overlay: the loaded logo '
      + 'didn\'t become the saved logo', async () => {
      await waitForEdits(page, { hasLogo: false });
      await expect(page.locator('#btnOverlayAdd')).toBeVisible();
      await expect(page.locator('#btnUseSaved')).toBeHidden();
    });
    await hand.tap(page.locator('#btnUndo'));
    await check('the green logo is back', async () => {
      await waitForEdits(page, { hasLogo: true });
      await expect.poll(() => isLogoGreen(page)).toBe(true);
    });
    // The two seconds a person waits: until the edits are saved on the device as they are.
    await waitForSaved(page, { tab: 'overlay', overlayId: logoId });
    await page.reload();
    await waitForStart(page);
    await check('the start screen offers "Resume IMG_9136.JPEG?"', async () => {
      await expect(page.locator('#resume .resume-name')).toHaveText(`Resume ${PHOTO}?`);
    });
    await hand.tap(page.locator('#btnResume'));
    await page.waitForFunction(() => {
      const app = window.__straightener.app;
      return !!app.state && !!app.geometry && app.tab === 'overlay';
    });
    await check('the photo opens on Overlay with the green logo on it', async () => {
      expect(await stepNow(page)).toBe('overlay');
      await expect.poll(() => isLogoGreen(page)).toBe(true);
    });
  });

test('EDT-14.1 In a pair, Save edits saves the side you\'re on [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await makePair(page, testInfo);
  await goToStep(page, 'export', hand);
  await check('the Export step shows; Back is selected in the top bar', async () => {
    expect(await stepNow(page)).toBe('export');
    expect(await selectedSide(page)).toBe('back');
  });
  const back = await saveEdits(page, hand, testInfo);
  await check('a file named 14_back_portrait_raw_white-edits.json is saved, naming that photo '
    + 'after "name":', () => {
    expect(back.name).toBe('14_back_portrait_raw_white-edits.json');
    expect(back.edits.source.name).toBe(PORTRAIT_PAIR.back);
  });
  await switchTo(page, hand, 'front');
  await check('the front shows, still on the Export step, with Front selected', async () => {
    expect((await editState(page)).source.name).toBe(PORTRAIT_PAIR.front);
    expect(await stepNow(page)).toBe('export');
    expect(await selectedSide(page)).toBe('front');
  });
  const front = await saveEdits(page, hand, testInfo);
  await check('a file named 14_front_portrait_raw_white-edits.json is saved, naming that photo '
    + 'after "name":', () => {
    expect(front.name).toBe('14_front_portrait_raw_white-edits.json');
    expect(front.edits.source.name).toBe(PORTRAIT_PAIR.front);
  });
});

test('EDT-14.2 Loading into one side gives the other side the file\'s export settings [phone]',
  async ({ page, check }, testInfo) => {
    const hand = await makePair(page, testInfo);
    await goToStep(page, 'export', hand);
    const format = page.locator('#exportFormat .segment[aria-pressed="true"]');
    const size = page.locator('#exportSize .segment[aria-pressed="true"]');
    await expect(format).toHaveText('JPEG');
    await expect(size).toHaveText('2000');
    await loadFixture(page, hand, BACK_PNG_1080);
    await check('on the back, PNG and 1080 are selected', async () => {
      await waitForEdits(page, { format: 'png' });
      await expect(format).toHaveText('PNG');
      await expect(size).toHaveText('1080');
    });
    await switchTo(page, hand, 'front');
    await check('the front shows, still on the Export step, with PNG and 1080 selected too',
      async () => {
        expect((await editState(page)).source.name).toBe(PORTRAIT_PAIR.front);
        expect(await stepNow(page)).toBe('export');
        await expect(format).toHaveText('PNG');
        await expect(size).toHaveText('1080');
      });
  });

test('EDT-14.3 A single photo\'s edits loaded into a side keep the 5:7 lock [phone]', async ({
  page,
  check,
}, testInfo) => {
  await recordMessages(page);
  const hand = await startOn(page, testInfo, { photo: PORTRAIT_PAIR.front });
  const saved = await saveEdits(page, hand, testInfo);
  await check('a file named 14_front_portrait_raw_white-edits.json is saved, with '
    + '"preset": "1:1" under "crop"', () => {
    expect(saved.name).toBe('14_front_portrait_raw_white-edits.json');
    expect(saved.edits.crop.preset).toBe('1:1');
  });
  await chooseInPicker(page, hand, page.locator('#btnAddBack'), PORTRAIT_PAIR.back);
  await waitForSide(page, 'back', PORTRAIT_PAIR.back);
  await check('the back opens; Front and Back show in the top bar', async () => {
    await expect(page.locator('#sideSwitch .segment')).toHaveText(['Front', 'Back']);
  });
  await switchTo(page, hand, 'front');
  await check('the front shows, with Front selected', async () => {
    expect((await editState(page)).source.name).toBe(PORTRAIT_PAIR.front);
    expect(await selectedSide(page)).toBe('front');
  });
  await goToStep(page, 'export', hand);
  await check('the Export step shows', async () => {
    expect(await stepNow(page)).toBe('export');
  });
  const before = (await messagesSoFar(page)).length;
  await loadEdits(page, hand, saved.file);
  await check('no message shows', async () => {
    expect(await messagesSince(page, before)).toEqual([]);
  });
  await goToStep(page, 'crop', hand);
  await check('5:7 card is selected and the box is taller than wide: the file\'s 1:1 was not '
    + 'taken', async () => {
    await expect(selectedPreset(page)).toHaveText('5:7 card');
    expect(await cropShape(page)).toBe('portrait');
  });
});

// An element's text as the screen shows it: parts hidden by the app are left out.
const shownText = locator => locator.evaluate(el => el.innerText.replace(/\s+/g, ' ').trim());

test('EDT-15.1 Export options group Save edits and Load edits under Edits, with a hint [both]',
  async ({ page, check }, testInfo) => {
    const hand = await startOn(page, testInfo);
    await openOptions(page, hand, 'export');
    // Measured once the sheet has finished rising.
    await waitForStill(page);
    const sheet = page.locator('#exportSheet');
    await check('an Edits heading shows', async () => {
      await expect(sheet.getByText('Edits', { exact: true })).toBeVisible();
    });
    const heading = await sheet.getByText('Edits', { exact: true }).boundingBox();
    const save = await page.locator('#btnSaveEdits').boundingBox();
    const load = await page.locator('#btnLoadEdits').boundingBox();
    await check('under it, Save edits and Load edits side by side, the same size, Save edits on '
      + 'the left', () => {
      expect(save.y).toBeGreaterThan(heading.y + heading.height - PLACE_TOLERANCE_PX);
      expect(Math.abs(save.y - load.y)).toBeLessThan(PLACE_TOLERANCE_PX);
      expect(Math.abs(save.width - load.width)).toBeLessThan(PLACE_TOLERANCE_PX);
      expect(Math.abs(save.height - load.height)).toBeLessThan(PLACE_TOLERANCE_PX);
      expect(save.x + save.width).toBeLessThanOrEqual(load.x);
    });
    const hint = page.locator('#exportEditsRow + .sheet-hint');
    await check('under the two buttons, the hint "A small JSON file. Re-open the same photo, '
      + 'load it, and the export is identical."', async () => {
      expect(await shownText(hint)).toBe('A small JSON file. Re-open the same photo, load it, '
        + 'and the export is identical.');
      expect((await hint.boundingBox()).y).toBeGreaterThan(save.y + save.height);
    });
  });

test('EDT-15.2 While paired, the hint starts with "Saves the side you\'re on." [phone]',
  async ({ page, check }, testInfo) => {
    const hand = await makePair(page, testInfo);
    await goToStep(page, 'export', hand);
    await check('the Export step shows', async () => {
      expect(await stepNow(page)).toBe('export');
    });
    await openOptions(page, hand, 'export');
    await check('the Edits group shows', async () => {
      await expect(page.locator('#exportSheet').getByText('Edits', { exact: true }))
        .toBeVisible();
      await expect(page.locator('#exportEditsRow')).toBeVisible();
    });
    await check('it starts with Saves the side you’re on. in bold, then "A small JSON file."',
      async () => {
        const lead = page.locator('#editsPairHint');
        await expect(lead).toBeVisible();
        await expect(lead).toHaveText('Saves the side you’re on. ');
        expect(await lead.evaluate(el => Number(getComputedStyle(el).fontWeight)))
          .toBeGreaterThanOrEqual(600);
        expect(await shownText(page.locator('#exportEditsRow + .sheet-hint')))
          .toMatch(/^Saves the side you’re on\. A small JSON file\./);
      });
  });
