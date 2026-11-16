// The edits-file cases (tests/catalog/edits-files.md): Save edits and Load edits, what the
// file holds and leaves out, the files that are refused or applied with a warning, older
// files, the round trip, the logo in a file, and edits files in a pair.
// Each test saves its edits file with a real download and loads it through the real picker;
// a file a case needs changed (a bad setting, a wrong size, over 8 MB) is made in the test from
// a saved one. It reads the app's state only to check a result.
'use strict';
const fs = require('fs');
const { test, expect } = require('./support/case.js');
const {
  openApp,
  openPhoto,
  goToStep,
  editState,
  openOptions,
  waitForStill,
} = require('./support/app.js');
const { recordExports, exportStarts, downloadAnswering, isSameFile } =
  require('./support/export.js');
const { waitForStart } = require('./support/start-and-session.js');
const {
  PORTRAIT_PAIR,
  makePair,
  switchTo,
  chooseOutput,
  chooseInPicker,
  waitForSide,
} = require('./support/front-and-back.js');
const { drawnLogo, chooseLogo, logoOnPage, colorOnPage } = require('./support/overlay.js');
const { presetChip } = require('./support/crop.js');
const { chooseCornerOutput, closeCornerSheet } = require('./support/corner-shots.js');
const {
  PHOTO,
  SAME_SIZE_PHOTO,
  OTHER_SIZE_PHOTO,
  startOn,
  saveEdits,
  loadEdits,
  writeEdits,
  copyOf,
  waitForEdits,
  recordMessages,
  messagesSoFar,
  waitForToast,
  noisyLogo,
  historySteps,
} = require('./support/edits-drop-keys.js');

// The name of IMG_9136.JPEG's edits file.
const EDITS_NAME = 'IMG_9136-edits.json';
// The messages of the refused files, word for word.
const TOO_LARGE = 'That file is too large to be a Card Finisher edits file.';
const NOT_JSON = 'That file isn’t valid JSON.';
const NOT_EDITS = 'That isn’t a Card Finisher edits file.';
const LOGO_LEFT_OUT = 'The overlay in these edits couldn’t be read, so it was left out.';
// The edits file limit (CONFIG.export.editsMaxBytes), and a logo of 5.5 MB: over the logo
// limit of 5 MB (CONFIG.overlay.maxBytes) and, written into a file, still under 8 MB.
const EDITS_MAX_BYTES = 8 * 1024 * 1024;
const OVER_LOGO_LIMIT_BYTES = 5.5 * 1024 * 1024;
// A link that lowers the logo limit to its least, 64 KB, and a logo of 200 px of noise
// (about 160 KB) that is over it.
const LOW_LOGO_LIMIT_LINK = 'index.html?overlay.maxBytes=65536';
const NOISY_LOGO_PX = 200;
// The smallest valid GIF (one see-through pixel): a picture type a logo can't be.
const GIF_BASE64 = 'R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
// A color channel within this much of pure green's counts as the green logo (0 to 255).
const GREEN_TOLERANCE = 40;
// Rounding allowed when comparing page positions, in CSS px.
const PLACE_TOLERANCE_PX = 1;

// Taps 90° right on the Rotate step and waits for the quarter turn.
async function turnQuarterRight(page, hand) {
  await hand.tap(page.locator('#toolRotateRight'));
  await page.waitForFunction(() => window.__straightener.app.state.rotation.quarter === 1);
}

// Types an angle on the Rotate step: taps the angle, types `text`, taps Done.
async function typeAngle(page, hand, text) {
  await hand.tap(page.locator('#rotateAngle'));
  await page.locator('#rotateAngleField').waitFor({ state: 'visible' });
  await page.keyboard.type(text);
  await hand.tap(page.locator('#btnAngleDone'));
}

// The edits a case compares before and after a refused file: the whole edit state and how
// many steps Undo and Redo can take.
async function editsAndHistory(page) {
  return { state: await editState(page), history: await historySteps(page) };
}

// A green logo drawn in the test, 400 px square.
const greenLogo = (page, name = 'green-logo.png') => drawnLogo(page, { name, paint: 'green' });

// Reloads the page, taps Start fresh on the Resume card and opens the case's photo again,
// on the Export step.
async function reopenFresh(page, hand, photo = PHOTO) {
  await page.reload();
  await waitForStart(page);
  await hand.tap(page.locator('#btnFresh'));
  await openPhoto(page, photo);
  await goToStep(page, 'export', hand);
}

// Waits until loading a file has shown `count` messages in all (see recordMessages), then
// gives the app a moment in case another follows, and returns them.
async function messagesAfterLoad(page, count) {
  await page.waitForFunction(wanted => window.testMessages.length >= wanted, count);
  await page.waitForTimeout(300);
  return messagesSoFar(page);
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
  const saved = await saveEdits(page, hand, testInfo);
  await check('a file named IMG_9136-edits.json is saved', () => {
    expect(saved.name).toBe(EDITS_NAME);
  });
  const text = fs.readFileSync(saved.file, 'utf8');
  await check('it is text laid out one setting to a line, starting with "version": 2', () => {
    expect(text.startsWith('{\n  "version": 2,\n')).toBe(true);
  });
  await check('it names IMG_9136.JPEG, 1498 × 2098 px, and one quarter turn', () => {
    expect(saved.edits.source).toEqual({ name: PHOTO, width: 1498, height: 2098 });
    expect(saved.edits.rotation.quarter).toBe(1);
  });
});

test('EDT-02.1 The edits file holds the logo picture itself [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo, { step: 'overlay' });
  const logo = await greenLogo(page);
  await chooseLogo(page, hand, page.locator('#btnOverlayAdd'), logo);
  await check('the green logo shows on the photo', async () => {
    expect(await logoOnPage(page)).not.toBeNull();
  });
  await goToStep(page, 'export', hand);
  const saved = await saveEdits(page, hand, testInfo);
  await check('IMG_9136-edits.json is saved', () => {
    expect(saved.name).toBe(EDITS_NAME);
  });
  await check('it holds green-logo.png, a PNG, byte for byte', () => {
    const embedded = saved.edits.overlayImage;
    expect(embedded.name).toBe('green-logo.png');
    expect(embedded.type).toBe('image/png');
    expect(Buffer.from(embedded.data, 'base64').equals(logo.buffer)).toBe(true);
  });
});

test('EDT-03.1 The file leaves out the photo, unapplied levels and the corner-shots choice '
  + '[phone]', async ({ page, check }, testInfo) => {
  const hand = await startOn(page, testInfo, { step: 'levels' });
  await hand.tap(page.locator('#toolAutoLevels'));
  await check('Auto sets levels that wait for Apply: a white dot on the Levels tab', async () => {
    await expect(page.locator('[data-step="levels"]:visible .step-tab-mark')).toBeVisible();
  });
  await goToStep(page, 'export', hand);
  await chooseCornerOutput(page, hand, '4 photos');
  await check('in Corner shots, 4 photos is chosen', async () => {
    await expect(page.locator('#cornerOutput .segment[aria-pressed="true"]'))
      .toHaveText('4 photos');
  });
  await closeCornerSheet(page, hand);
  const saved = await saveEdits(page, hand, testInfo);
  const text = fs.readFileSync(saved.file, 'utf8');
  await check('IMG_9136-edits.json is saved, under 10 KB: no photo is in it', () => {
    expect(saved.name).toBe(EDITS_NAME);
    expect(fs.statSync(saved.file).size).toBeLessThan(10 * 1024);
  });
  await check('its levels line reads "levels": null: the unapplied levels are left out', () => {
    expect(text).toContain('"levels": null');
  });
  await check('the word photos is nowhere in it: the corner-shots choice is left out', () => {
    expect(text).not.toMatch(/photos/i);
  });
});

test('EDT-03.2 In a pair the file leaves out the other side and Together or Separately '
  + '[phone]', async ({ page, check }, testInfo) => {
  const hand = await makePair(page, testInfo);
  await goToStep(page, 'export', hand);
  await chooseOutput(page, hand, 'separately');
  await check('Separately is chosen', async () => {
    await expect(page.locator('#pairOutput .segment[aria-pressed="true"]'))
      .toHaveText('Separately');
  });
  const saved = await saveEdits(page, hand, testInfo);
  const text = fs.readFileSync(saved.file, 'utf8');
  await check('a file named 14_back_portrait_raw_white-edits.json is saved', () => {
    expect(saved.name).toBe('14_back_portrait_raw_white-edits.json');
  });
  await check('the words front, separately, together and pair are nowhere in it', () => {
    expect(text).not.toMatch(/front|separately|together|pair/i);
  });
});

test('EDT-04.1 Load edits opens a picker for one .json file and applies it [phone] [webkit]',
  async ({ page, check }, testInfo) => {
    const hand = await startOn(page, testInfo, { step: 'rotate' });
    await turnQuarterRight(page, hand);
    await goToStep(page, 'export', hand);
    const saved = await saveEdits(page, hand, testInfo);
    await hand.tap(page.locator('#btnUndo'));
    await check('IMG_9136-edits.json is saved; after Undo the photo is upright again', async () => {
      expect(saved.name).toBe(EDITS_NAME);
      await waitForEdits(page, { quarter: 0 });
    });
    const chooser = await loadEdits(page, hand, saved.file);
    await check('Load edits opens a picker for one file, of the .json type', async () => {
      expect(chooser.isMultiple()).toBe(false);
      expect(await chooser.element().getAttribute('accept')).toBe('application/json,.json');
    });
    await check('choosing IMG_9136-edits.json turns the photo a quarter clockwise again',
      async () => {
        await waitForEdits(page, { quarter: 1 });
      });
  });

test('EDT-04.2 While an export runs, Load edits is dimmed and the step tabs stay live [phone]',
  async ({ page, check }, testInfo) => {
    test.fail(true, 'BUG-013');
    await recordExports(page);
    const hand = await startOn(page, testInfo);
    await downloadAnswering(page, hand);
    const [start] = await exportStarts(page);
    await check('as the export began, the step tabs were live', () => {
      expect(start.tabs).toEqual([]);
    });
    await check('as the export began, Load edits was greyed out', () => {
      expect(start.controls.btnLoadEdits.disabled).toBe(true);
    });
  });

test('EDT-05.1 A file over 8 MB is refused before it is read [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo, { step: 'rotate' });
  await turnQuarterRight(page, hand);
  await goToStep(page, 'export', hand);
  const saved = await saveEdits(page, hand, testInfo);
  // The case's file: the saved edits, made larger than 8 MB with spaces after the last brace,
  // so it is still valid JSON and an edits file in every other way.
  const text = fs.readFileSync(saved.file, 'utf8');
  const padded = text + ' '.repeat(EDITS_MAX_BYTES + 1 - Buffer.byteLength(text));
  const file = { name: EDITS_NAME, mimeType: 'application/json', buffer: Buffer.from(padded) };
  await hand.tap(page.locator('#btnUndo'));
  await waitForEdits(page, { quarter: 0 });
  const before = await editsAndHistory(page);
  await loadEdits(page, hand, file);
  await check(`a red message reads "${TOO_LARGE}"`, async () => {
    expect(await waitForToast(page)).toEqual({ text: TOO_LARGE, kind: 'error', isShown: true });
  });
  await check('nothing changes: the photo is still upright and Redo still lit', async () => {
    expect(await editsAndHistory(page)).toEqual(before);
  });
});

test('EDT-05.2 A file that isn\'t JSON is refused [phone]', async ({ page, check }, testInfo) => {
  const hand = await startOn(page, testInfo);
  const before = await editsAndHistory(page);
  const file = {
    name: EDITS_NAME,
    mimeType: 'application/json',
    buffer: Buffer.from('These are notes about a card, not an edits file.\n'),
  };
  await loadEdits(page, hand, file);
  await check(`a red message reads "${NOT_JSON}"`, async () => {
    expect(await waitForToast(page)).toEqual({ text: NOT_JSON, kind: 'error', isShown: true });
  });
  await check('nothing changes', async () => {
    expect(await editsAndHistory(page)).toEqual(before);
  });
});

test('EDT-05.3 JSON that isn\'t an edits file is refused [phone]', async ({
  page,
  check,
}, testInfo) => {
  await recordMessages(page);
  const hand = await startOn(page, testInfo);
  const saved = await saveEdits(page, hand, testInfo);
  const before = await editsAndHistory(page);
  const shownBefore = (await messagesSoFar(page)).length;
  // Three files made from the saved one: a version the app doesn't know, no corners, and a
  // width written as text.
  const versionThree = Object.assign(copyOf(saved.edits), { version: 3 });
  const noCorners = copyOf(saved.edits);
  delete noCorners.corners;
  const widthAsText = copyOf(saved.edits);
  widthAsText.source.width = '1498';
  const files = [versionThree, noCorners, widthAsText];
  for (const [index, edits] of files.entries()) {
    const description = ['version 3', 'no corners', 'the width written as text'][index];
    await loadEdits(page, hand, writeEdits(testInfo, `bad-${index + 1}-edits.json`, edits));
    await check(`a file with ${description}: a red message reads "${NOT_EDITS}"; nothing changes`,
      async () => {
        const messages = await messagesAfterLoad(page, shownBefore + index + 1);
        expect(messages[shownBefore + index]).toEqual({ text: NOT_EDITS, kind: 'error' });
        expect(await editsAndHistory(page)).toEqual(before);
      });
  }
});

test('EDT-06.1 Edits for a photo of another size are refused, naming both sizes [phone]',
  async ({ page, check }, testInfo) => {
    const hand = await startOn(page, testInfo);
    const saved = await saveEdits(page, hand, testInfo);
    await check('IMG_9136-edits.json is saved', () => {
      expect(saved.name).toBe(EDITS_NAME);
    });
    await openPhoto(page, OTHER_SIZE_PHOTO);
    await goToStep(page, 'export', hand);
    const before = await editsAndHistory(page);
    await loadEdits(page, hand, saved.file);
    const expected = 'These edits are for a 1498×2098 photo; this one is 1536×2048.';
    await check(`a red message reads "${expected}"`, async () => {
      expect(await waitForToast(page)).toEqual({ text: expected, kind: 'error', isShown: true });
    });
    await check('nothing changes', async () => {
      expect(await editsAndHistory(page)).toEqual(before);
    });
  });

test('EDT-07.1 Edits for another photo of the same size are applied with a warning [phone]',
  async ({ page, check }, testInfo) => {
    const hand = await startOn(page, testInfo, { step: 'rotate' });
    await turnQuarterRight(page, hand);
    await goToStep(page, 'export', hand);
    const saved = await saveEdits(page, hand, testInfo);
    await openPhoto(page, SAME_SIZE_PHOTO);
    await goToStep(page, 'export', hand);
    await check('IMG_9060.JPEG opens upright', async () => {
      expect((await editState(page)).rotation.quarter).toBe(0);
    });
    await loadEdits(page, hand, saved.file);
    const expected = 'Edits were saved for “IMG_9136.JPEG”. Applied anyway — sizes match.';
    await check(`an amber message reads "${expected}"`, async () => {
      expect(await waitForToast(page)).toEqual({ text: expected, kind: 'warn', isShown: true });
    });
    await check('the edits are applied: the photo is turned a quarter clockwise', async () => {
      await waitForEdits(page, { quarter: 1 });
    });
  });

// Opens the case's photo, turns it a quarter, saves its edits and returns them, with the hand.
async function savedTurnedEdits(page, testInfo) {
  await recordMessages(page);
  const hand = await startOn(page, testInfo, { step: 'rotate' });
  await turnQuarterRight(page, hand);
  await goToStep(page, 'export', hand);
  const saved = await saveEdits(page, hand, testInfo);
  return { hand, saved };
}

// The Quality the case's damaged files hold: 7, where it must be between 0 and 1.
const BAD_QUALITY = 7;
// The logo the case's damaged files hold: a GIF, a type a logo can't be.
const GIF_LOGO = { id: 'gif-logo', type: 'image/gif', name: 'logo.gif', data: GIF_BASE64 };
// A logo placement for GIF_LOGO, in the middle of the crop.
const GIF_PLACEMENT = { id: 'gif-logo', aspect: 1, cx: 0.5, cy: 0.5, w: 0.25, opacity: 1 };

// The body of the cases written to ruling R12: loads `edits` into the open photo and expects
// one warning holding every part in `parts` (words each part's line must have).
async function checkOneCombinedWarning(page, check, hand, file, parts) {
  const before = (await messagesSoFar(page)).length;
  await loadEdits(page, hand, file);
  const messages = (await messagesAfterLoad(page, before + 1)).slice(before);
  await check('one amber warning shows', () => {
    expect(messages.map(message => message.kind)).toEqual(['warn']);
  });
  await check(`it says all of: ${parts.join('; ')}`, () => {
    for (const words of parts) expect(messages[0].text).toContain(words);
  });
}

test('EDT-07.2 Another photo\'s name and a damaged setting give one warning [phone]', async ({
  page,
  check,
}, testInfo) => {
  test.fail(true, 'BUG-190');
  const { hand, saved } = await savedTurnedEdits(page, testInfo);
  const damaged = copyOf(saved.edits);
  damaged.export.quality = BAD_QUALITY;
  await openPhoto(page, SAME_SIZE_PHOTO);
  await goToStep(page, 'export', hand);
  const file = writeEdits(testInfo, EDITS_NAME, damaged);
  await checkOneCombinedWarning(page, check, hand, file, ['IMG_9136.JPEG', 'export']);
});

test('EDT-08.1 A damaged setting is reset and named; the rest is applied [phone]', async ({
  page,
  check,
}, testInfo) => {
  const { hand, saved } = await savedTurnedEdits(page, testInfo);
  const damaged = copyOf(saved.edits);
  damaged.export.quality = BAD_QUALITY;
  await hand.tap(page.locator('#btnUndo'));
  await waitForEdits(page, { quarter: 0 });
  await loadEdits(page, hand, writeEdits(testInfo, EDITS_NAME, damaged));
  const expected = 'Some settings in these edits weren’t valid and were reset: export.';
  await check(`an amber message reads "${expected}"`, async () => {
    expect(await waitForToast(page)).toEqual({ text: expected, kind: 'warn', isShown: true });
  });
  await check('the turn is applied: the photo is turned a quarter clockwise', async () => {
    await waitForEdits(page, { quarter: 1 });
  });
  await openOptions(page, hand, 'export');
  await check('in Export options, Quality reads 92%: the export settings are the defaults',
    async () => {
      await expect(page.locator('#qualityValue')).toHaveText('92%');
    });
});

test('EDT-08.2 A damaged setting and an unreadable logo give one warning [phone]', async ({
  page,
  check,
}, testInfo) => {
  test.fail(true, 'BUG-190');
  const { hand, saved } = await savedTurnedEdits(page, testInfo);
  const damaged = Object.assign(copyOf(saved.edits), {
    overlay: GIF_PLACEMENT,
    overlayImage: GIF_LOGO,
  });
  damaged.export.quality = BAD_QUALITY;
  const file = writeEdits(testInfo, EDITS_NAME, damaged);
  await checkOneCombinedWarning(page, check, hand, file, ['export', 'overlay']);
});

test('EDT-09.1 A logo of a type a logo can\'t be is left out with a warning [phone]', async ({
  page,
  check,
}, testInfo) => {
  const { hand, saved } = await savedTurnedEdits(page, testInfo);
  const withGif = Object.assign(copyOf(saved.edits), {
    overlay: GIF_PLACEMENT,
    overlayImage: GIF_LOGO,
  });
  await hand.tap(page.locator('#btnUndo'));
  await waitForEdits(page, { quarter: 0 });
  await loadEdits(page, hand, writeEdits(testInfo, EDITS_NAME, withGif));
  await check(`an amber message reads "${LOGO_LEFT_OUT}"`, async () => {
    expect(await waitForToast(page)).toEqual({ text: LOGO_LEFT_OUT, kind: 'warn', isShown: true });
  });
  await check('the rest is applied with no logo: turned a quarter clockwise', async () => {
    await waitForEdits(page, { quarter: 1, hasLogo: false });
  });
});

test('EDT-09.2 A logo over 5 MB is left out with a warning [phone]', async ({
  page,
  check,
}, testInfo) => {
  const { hand, saved } = await savedTurnedEdits(page, testInfo);
  // A 5.5 MB logo of zeros: its size alone refuses it, before it is read.
  const bigLogo = {
    id: 'big-logo',
    type: 'image/png',
    name: 'big-logo.png',
    data: Buffer.alloc(OVER_LOGO_LIMIT_BYTES).toString('base64'),
  };
  const withBigLogo = Object.assign(copyOf(saved.edits), {
    overlay: Object.assign({}, GIF_PLACEMENT, { id: 'big-logo' }),
    overlayImage: bigLogo,
  });
  const file = writeEdits(testInfo, EDITS_NAME, withBigLogo);
  await check('the case\'s file is under 8 MB', () => {
    expect(fs.statSync(file).size).toBeLessThan(EDITS_MAX_BYTES);
  });
  await hand.tap(page.locator('#btnUndo'));
  await waitForEdits(page, { quarter: 0 });
  await loadEdits(page, hand, file);
  await check(`an amber message reads "${LOGO_LEFT_OUT}"`, async () => {
    expect(await waitForToast(page)).toEqual({ text: LOGO_LEFT_OUT, kind: 'warn', isShown: true });
  });
  await check('the rest is applied with no logo: turned a quarter clockwise', async () => {
    await waitForEdits(page, { quarter: 1, hasLogo: false });
  });
});

test('EDT-09.3 A link\'s lower logo limit leaves a larger logo out [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo, { step: 'overlay' });
  const logo = await noisyLogo(page, 'noisy-logo.png', NOISY_LOGO_PX);
  await chooseLogo(page, hand, page.locator('#btnOverlayAdd'), logo);
  await check('a logo of about 160 KB shows on the photo', async () => {
    expect(logo.buffer.length).toBeGreaterThan(100 * 1024);
    expect(await logoOnPage(page)).not.toBeNull();
  });
  await goToStep(page, 'export', hand);
  const saved = await saveEdits(page, hand, testInfo);
  await openApp(page, LOW_LOGO_LIMIT_LINK);
  await openPhoto(page, PHOTO);
  await goToStep(page, 'export', hand);
  await check('the app opens again with the link; the photo opens with no logo', async () => {
    await waitForEdits(page, { hasLogo: false });
  });
  await loadEdits(page, hand, saved.file);
  await check(`an amber message reads "${LOGO_LEFT_OUT}"; no logo`, async () => {
    expect(await waitForToast(page)).toEqual({ text: LOGO_LEFT_OUT, kind: 'warn', isShown: true });
    expect((await editState(page)).overlay).toBeNull();
  });
});

// Opens the case's photo on Overlay, adds the green logo, saves the edits and returns the
// saved file's edits with the logo's picture taken out (only its placement is left), with the
// hand.
async function editsWithPlacementOnly(page, testInfo) {
  await recordMessages(page);
  const hand = await startOn(page, testInfo, { step: 'overlay' });
  await chooseLogo(page, hand, page.locator('#btnOverlayAdd'), await greenLogo(page));
  await goToStep(page, 'export', hand);
  const saved = await saveEdits(page, hand, testInfo);
  const placementOnly = copyOf(saved.edits);
  delete placementOnly.overlayImage;
  return { hand, file: writeEdits(testInfo, 'placement-only-edits.json', placementOnly) };
}

test('EDT-09.4 A logo placement with no picture keeps a logo the app already has [phone]',
  async ({ page, check }, testInfo) => {
    const { hand, file } = await editsWithPlacementOnly(page, testInfo);
    await goToStep(page, 'overlay', hand);
    await hand.tap(page.locator('#toolOverlayRemove'));
    await check('Remove takes the logo off the photo', async () => {
      await waitForEdits(page, { hasLogo: false });
    });
    await goToStep(page, 'export', hand);
    const before = (await messagesSoFar(page)).length;
    await loadEdits(page, hand, file);
    await check('the green logo is back on the photo, with no message', async () => {
      await waitForEdits(page, { hasLogo: true });
      await page.waitForTimeout(300);
      expect((await messagesSoFar(page)).slice(before)).toEqual([]);
    });
  });

test('EDT-09.5 A logo placement with no picture, the logo not loaded, is left out [phone]',
  async ({ page, check }, testInfo) => {
    const { hand, file } = await editsWithPlacementOnly(page, testInfo);
    await reopenFresh(page, hand);
    await check('after a reload and Start fresh, the photo opens with no logo', async () => {
      await waitForEdits(page, { hasLogo: false });
    });
    await loadEdits(page, hand, file);
    await check(`an amber message reads "${LOGO_LEFT_OUT}"; no logo`, async () => {
      expect(await waitForToast(page)).toEqual({
        text: LOGO_LEFT_OUT,
        kind: 'warn',
        isShown: true,
      });
      expect((await editState(page)).overlay).toBeNull();
    });
  });

test('EDT-09.6 Another photo\'s name, a damaged setting and an unreadable logo give one '
  + 'warning [phone]', async ({ page, check }, testInfo) => {
  test.fail(true, 'BUG-190');
  const { hand, saved } = await savedTurnedEdits(page, testInfo);
  const damaged = Object.assign(copyOf(saved.edits), {
    overlay: GIF_PLACEMENT,
    overlayImage: GIF_LOGO,
  });
  damaged.export.quality = BAD_QUALITY;
  await openPhoto(page, SAME_SIZE_PHOTO);
  await goToStep(page, 'export', hand);
  const file = writeEdits(testInfo, EDITS_NAME, damaged);
  await checkOneCombinedWarning(page, check, hand, file, ['IMG_9136.JPEG', 'export', 'overlay']);
});

test('EDT-10.1 Loading is one undo step; loading the same edits again adds none [phone]',
  async ({ page, check }, testInfo) => {
    const hand = await startOn(page, testInfo, { step: 'rotate' });
    await turnQuarterRight(page, hand);
    await typeAngle(page, hand, '2');
    await check('the photo is turned a quarter, and the angle reads 2.0°', async () => {
      await waitForEdits(page, { quarter: 1, fine: 2 });
    });
    await goToStep(page, 'export', hand);
    const saved = await saveEdits(page, hand, testInfo);
    await hand.tap(page.locator('#btnUndo'));
    await hand.tap(page.locator('#btnUndo'));
    await check('two Undos: upright, at 0.0°; Undo greyed out', async () => {
      await waitForEdits(page, { quarter: 0, fine: 0 });
      await expect(page.locator('#btnUndo')).toBeDisabled();
    });
    await loadEdits(page, hand, saved.file);
    await check('loading the file: a quarter turn and 2.0°', async () => {
      await waitForEdits(page, { quarter: 1, fine: 2 });
    });
    await hand.tap(page.locator('#btnUndo'));
    await check('one Undo takes both back: upright, at 0.0°, Undo greyed out', async () => {
      await waitForEdits(page, { quarter: 0, fine: 0 });
      await expect(page.locator('#btnUndo')).toBeDisabled();
    });
    await hand.tap(page.locator('#btnRedo'));
    await waitForEdits(page, { quarter: 1, fine: 2 });
    await loadEdits(page, hand, saved.file);
    await page.waitForTimeout(500);
    await hand.tap(page.locator('#btnUndo'));
    await check('after Redo and loading the same file again, one Undo still goes back to upright '
      + 'at 0.0°, Undo greyed out', async () => {
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
  const saved = await saveEdits(page, hand, testInfo);
  const shownBefore = (await messagesSoFar(page)).length;
  // The file as version 1 wrote it: Square up mode, the Case target, and Flatten at 100%.
  const versionOne = Object.assign(copyOf(saved.edits), {
    version: 1,
    mode: 'square',
    target: 'case',
    strength: 1,
  });
  await loadEdits(page, hand, writeEdits(testInfo, EDITS_NAME, versionOne));
  await goToStep(page, 'perspective', hand);
  await check('on Perspective, Flatten reads 0%', async () => {
    await expect(page.locator('#toolFlatten .tool-value')).toHaveText('0%');
  });
  await check('no message showed', async () => {
    expect((await messagesSoFar(page)).slice(shownBefore)).toEqual([]);
  });
});

// The selected crop preset's chip.
const selectedChip = page => page.locator('#cropPresets .preset-chip[aria-pressed="true"]');

// The crop box's shape now: 'portrait' (taller than wide), 'landscape' or 'square'.
async function cropShape(page) {
  const crop = await page.evaluate(() => window.__straightener.app.geometry.crop);
  if (Math.abs(crop.width - crop.height) < 1) return 'square';
  return crop.width > crop.height ? 'landscape' : 'portrait';
}

test('EDT-11.2 A file from before the crop followed the card takes its swap setting [phone]',
  async ({ page, check }, testInfo) => {
    const hand = await startOn(page, testInfo);
    const saved = await saveEdits(page, hand, testInfo);
    // The 5:4 preset, not swapped, as a file from before the crop followed the card records
    // it: no orientation of its own. The card is upright, so a crop that followed it would be
    // taller than wide.
    const older = copyOf(saved.edits);
    older.crop = { mode: 'fit', preset: '5:4', ratio: 1.25, swapped: false, rect: null };
    await loadEdits(page, hand, writeEdits(testInfo, EDITS_NAME, older));
    await page.waitForFunction(() => window.__straightener.app.state.crop.preset === '5:4');
    await goToStep(page, 'crop', hand);
    await check('on Crop, 5:4 is selected and the box is wider than tall (5 wide to 4 high)',
      async () => {
        await expect(selectedChip(page)).toHaveText('5:4');
        expect(await cropShape(page)).toBe('landscape');
      });
  });

test('EDT-12.1 Re-opened with its edits file, the photo exports the same file [phone] '
  + '[webkit]', async ({ page, check }, testInfo) => {
  const hand = await startOn(page, testInfo, { step: 'rotate' });
  await typeAngle(page, hand, '3');
  await goToStep(page, 'crop', hand);
  await hand.tap(presetChip(page, '4:5'));
  await goToStep(page, 'levels', hand);
  await hand.tap(page.locator('#toolAutoLevels'));
  await hand.tap(page.locator('#btnApplyLevels'));
  await goToStep(page, 'overlay', hand);
  await chooseLogo(page, hand, page.locator('#btnOverlayAdd'), await greenLogo(page));
  await check('the angle is 3.0°, 4:5, levels applied and the green logo on the photo',
    async () => {
      const state = await editState(page);
      expect(state.rotation.fine).toBe(3);
      expect(state.levels).not.toBeNull();
      expect(state.overlay).not.toBeNull();
      await goToStep(page, 'crop', hand);
      await expect(selectedChip(page)).toHaveText('4:5');
    });
  await goToStep(page, 'export', hand);
  const first = await downloadAnswering(page, hand);
  const saved = await saveEdits(page, hand, testInfo);
  await check('IMG_9136-straight.jpg and IMG_9136-edits.json are saved', () => {
    expect([first.name, saved.name]).toEqual(['IMG_9136-straight.jpg', EDITS_NAME]);
  });
  const firstCopy = testInfo.outputPath('first-IMG_9136-straight.jpg');
  fs.copyFileSync(first.file, firstCopy);
  await reopenFresh(page, hand);
  await check('after a reload and Start fresh, the photo opens with no edits', async () => {
    const state = await editState(page);
    expect([state.rotation.fine, state.overlay]).toEqual([0, null]);
  });
  await loadEdits(page, hand, saved.file);
  await check('loading the file brings the edits back: 3.0°, 4:5, the levels and the logo',
    async () => {
      // The chip reading 4:5 is the 5:4 preset, turned to follow the upright card.
      await waitForEdits(page, { fine: 3, preset: '5:4', hasLogo: true });
      expect((await editState(page)).levels).not.toBeNull();
    });
  const second = await downloadAnswering(page, hand);
  await check('a second IMG_9136-straight.jpg is saved, the same as the first byte for byte',
    () => {
      expect(second.name).toBe('IMG_9136-straight.jpg');
      expect(isSameFile(firstCopy, second.file)).toBe(true);
    });
});

// True when a color ([r, g, b], 0 to 255) is the green logo's.
const isGreen = color => Math.abs(color[0]) < GREEN_TOLERANCE
  && Math.abs(color[1] - 255) < GREEN_TOLERANCE
  && Math.abs(color[2]) < GREEN_TOLERANCE;

// True when the logo is drawn on the photo in the green logo's color. It looks a quarter of
// the logo's width left of its middle, where no snap ring is drawn.
async function isLogoGreen(page) {
  const logo = await logoOnPage(page);
  if (!logo) return false;
  const point = { x: logo.middle.x - logo.width / 4, y: logo.middle.y };
  return isGreen(await colorOnPage(page, point));
}

test('EDT-13.1 A loaded logo is kept for Resume but is not the saved logo [phone] [webkit]',
  async ({ page, check }, testInfo) => {
    const hand = await startOn(page, testInfo, { step: 'overlay' });
    await chooseLogo(page, hand, page.locator('#btnOverlayAdd'), await greenLogo(page));
    await goToStep(page, 'export', hand);
    const saved = await saveEdits(page, hand, testInfo);
    await goToStep(page, 'overlay', hand);
    await hand.tap(page.locator('#toolOverlayDeleteSaved'));
    await hand.tap(page.locator('#toolOverlayRemove'));
    await check('after Delete saved and Remove: no logo, and no Use saved overlay', async () => {
      await waitForEdits(page, { hasLogo: false });
      await expect(page.locator('#btnOverlayAdd')).toBeVisible();
      await expect(page.locator('#btnUseSaved')).toBeHidden();
    });
    await reopenFresh(page, hand);
    await loadEdits(page, hand, saved.file);
    await waitForEdits(page, { hasLogo: true });
    await goToStep(page, 'overlay', hand);
    await check('after a reload, Start fresh and Load edits, the green logo is on the photo',
      async () => {
        expect(await isLogoGreen(page)).toBe(true);
      });
    await hand.tap(page.locator('#toolOverlayRemove'));
    await check('Remove: Add logo shows, and still no Use saved overlay', async () => {
      await expect(page.locator('#btnOverlayAdd')).toBeVisible();
      await expect(page.locator('#btnUseSaved')).toBeHidden();
    });
    await hand.tap(page.locator('#btnUndo'));
    await waitForEdits(page, { hasLogo: true });
    // A person waits a moment before reloading; the edits are saved 0.4 s after a change.
    await page.waitForTimeout(1000);
    await page.reload();
    await waitForStart(page);
    await hand.tap(page.locator('#btnResume'));
    await page.waitForFunction(() => {
      const app = window.__straightener.app;
      return !!app.state && !!app.geometry && app.tab === 'overlay';
    });
    await check('after Undo, a reload and Resume, the green logo is on the photo', async () => {
      await expect.poll(() => isLogoGreen(page)).toBe(true);
    });
  });

test('EDT-14.1 In a pair, Save edits saves the side you\'re on [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await makePair(page, testInfo);
  await goToStep(page, 'export', hand);
  await check('the back is open', async () => {
    await expect(page.locator('#sideSwitch .segment[data-value="back"]'))
      .toHaveAttribute('aria-pressed', 'true');
  });
  const back = await saveEdits(page, hand, testInfo);
  await check('a file named 14_back_portrait_raw_white-edits.json is saved, for that photo',
    () => {
      expect(back.name).toBe('14_back_portrait_raw_white-edits.json');
      expect(back.edits.source.name).toBe(PORTRAIT_PAIR.back);
    });
  await switchTo(page, hand, 'front');
  await goToStep(page, 'export', hand);
  const front = await saveEdits(page, hand, testInfo);
  await check('on the front, a file named 14_front_portrait_raw_white-edits.json is saved', () => {
    expect(front.name).toBe('14_front_portrait_raw_white-edits.json');
    expect(front.edits.source.name).toBe(PORTRAIT_PAIR.front);
  });
});

test('EDT-14.2 Loading into one side gives the other side the file\'s export settings [phone]',
  async ({ page, check }, testInfo) => {
    const hand = await makePair(page, testInfo);
    await goToStep(page, 'export', hand);
    const saved = await saveEdits(page, hand, testInfo);
    const changed = copyOf(saved.edits);
    changed.export.format = 'png';
    changed.export.longEdge = 1080;
    await loadEdits(page, hand, writeEdits(testInfo, saved.name, changed));
    await check('on the back, PNG and 1080 are selected', async () => {
      await waitForEdits(page, { format: 'png' });
      await expect(page.locator('#exportFormat .segment[aria-pressed="true"]')).toHaveText('PNG');
      await expect(page.locator('#exportSize .segment[aria-pressed="true"]')).toHaveText('1080');
    });
    await switchTo(page, hand, 'front');
    await goToStep(page, 'export', hand);
    await check('on the front, PNG and 1080 are selected too', async () => {
      await expect(page.locator('#exportFormat .segment[aria-pressed="true"]')).toHaveText('PNG');
      await expect(page.locator('#exportSize .segment[aria-pressed="true"]')).toHaveText('1080');
    });
  });

test('EDT-14.3 A single photo\'s edits loaded into a side keep the 5:7 lock [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo, { photo: PORTRAIT_PAIR.front });
  const saved = await saveEdits(page, hand, testInfo);
  await check('the front alone saves its edits, with the 1:1 crop', () => {
    expect(saved.edits.crop.preset).toBe('1:1');
  });
  await chooseInPicker(page, hand, page.locator('#btnAddBack'), PORTRAIT_PAIR.back);
  await waitForSide(page, 'back', PORTRAIT_PAIR.back);
  await switchTo(page, hand, 'front');
  await goToStep(page, 'export', hand);
  await loadEdits(page, hand, saved.file);
  await page.waitForTimeout(300);
  await check('the edits load with no error message', async () => {
    await expect(page.locator('#toast.is-shown.is-error')).toHaveCount(0);
  });
  await goToStep(page, 'crop', hand);
  await check('on Crop, 5:7 card is selected and the box is taller than wide', async () => {
    await expect(selectedChip(page)).toHaveText('5:7 card');
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
    await check('an Edits heading shows in Export options', async () => {
      await expect(sheet.getByText('Edits', { exact: true })).toBeVisible();
    });
    const save = await page.locator('#btnSaveEdits').boundingBox();
    const load = await page.locator('#btnLoadEdits').boundingBox();
    await check('under it, Save edits and Load edits side by side, the same size', () => {
      expect(Math.abs(save.y - load.y)).toBeLessThan(PLACE_TOLERANCE_PX);
      expect(Math.abs(save.width - load.width)).toBeLessThan(PLACE_TOLERANCE_PX);
      expect(save.x + save.width).toBeLessThanOrEqual(load.x);
    });
    const hint = page.locator('#exportEditsRow + .sheet-hint');
    await check('under them, the hint "A small JSON file. Re-open the same photo, load it, and '
      + 'the export is identical."', async () => {
      expect(await shownText(hint)).toBe('A small JSON file. Re-open the same photo, load it, '
        + 'and the export is identical.');
      expect((await hint.boundingBox()).y).toBeGreaterThan(save.y + save.height);
    });
  });

test('EDT-15.2 While paired, the hint starts with "Saves the side you\'re on." [phone]',
  async ({ page, check }, testInfo) => {
    const hand = await makePair(page, testInfo);
    await goToStep(page, 'export', hand);
    await openOptions(page, hand, 'export');
    await check('the hint starts with Saves the side you’re on., in bold', async () => {
      const lead = page.locator('#editsPairHint');
      await expect(lead).toBeVisible();
      await expect(lead).toHaveText('Saves the side you’re on. ');
      expect(await lead.evaluate(el => Number(getComputedStyle(el).fontWeight)))
        .toBeGreaterThanOrEqual(600);
      expect(await shownText(page.locator('#exportEditsRow + .sheet-hint')))
        .toMatch(/^Saves the side you’re on\. A small JSON file\./);
    });
  });
