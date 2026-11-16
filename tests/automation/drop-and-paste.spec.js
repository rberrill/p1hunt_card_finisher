// The drop-and-paste cases (tests/catalog/drop-and-paste.md): a photo dropped on the photo area
// or pasted, the drop outline, a logo dropped or pasted on the Overlay step, a photo that
// arrives while the app is busy, and a file dropped outside the photo area.
// A drop is the browser's own drag events carrying the files in a DataTransfer; a paste is a
// real Ctrl+V with a picture on the clipboard (Chromium at desktop size: a phone has neither).
// Each test reads the app's state only to check a result.
'use strict';
const { test, expect } = require('./support/case.js');
const { openApp, goToStep, handFor, editState } = require('./support/app.js');
const { waitForQuestion } = require('./support/export.js');
const {
  makePair,
  switchTo,
  holdNextOpening,
  releaseOpening,
  waitForOpening,
  PORTRAIT_PAIR,
} = require('./support/front-and-back.js');
const { drawnLogo, logoId } = require('./support/overlay.js');
const {
  PHOTO,
  OTHER_SIZE_PHOTO,
  startOn,
  saveEdits,
  recordMessages,
  messagesSoFar,
  waitForToast,
  sampleFile,
  dragFiles,
  dropOutline,
  copyImage,
  copyText,
  allowClipboard,
  holdEncoding,
  releaseEncoding,
  waitForExporting,
} = require('./support/edits-drop-keys.js');

// The photo area, where a drop opens a photo.
const STAGE = '#stage';
// The message a photo arriving during an export gets, word for word.
const WAIT_FOR_EXPORT = 'Wait for the export to finish, then open the photo.';
// The message a HEIC file gets in a browser that can't open HEIC, word for word.
const NO_HEIC = 'This browser can’t open HEIC. Save the photo as JPEG first (Safari opens HEIC '
  + 'directly).';
// The name the app gives a pasted photo.
const PASTED_NAME = 'pasted-photo';
// How long a case waits to be sure nothing happened, in ms.
const NOTHING_HAPPENS_MS = 800;
// The drop outline's border: 2 px, dashed, the app's white (#f2f2f3).
const OUTLINE_BORDER = '2px dashed rgb(242, 242, 243)';

// A line of text named like notes: a file that is not a picture.
const notesFile = () => ({
  name: 'notes.txt',
  mimeType: 'text/plain',
  buffer: Buffer.from('Notes about the card.\n'),
});

// Waits until the photo named `name` is open and its corners have been looked for.
function waitForPhotoNamed(page, name) {
  return page.waitForFunction(photoName => {
    const app = window.__straightener.app;
    const isDetected = app.detection.running > 0 && app.detection.message === '';
    return !!app.state && app.state.source.name === photoName && !!app.geometry && isDetected;
  }, name);
}

// The name of the photo that is open, or '' with none.
const openPhotoName = page => page.evaluate(() => {
  const state = window.__straightener.app.state;
  return state ? state.source.name : '';
});

// Opens the app on its start screen, with no photo open. Returns the hand for this target.
async function startEmpty(page, testInfo) {
  await openApp(page);
  return handFor(page, testInfo);
}

// A green logo, 400 px square, as a file payload.
const greenLogo = page => drawnLogo(page, { name: 'green-logo.png', paint: 'green' });

// Waits until a logo other than `idBefore` is on the photo.
function waitForNewLogo(page, idBefore) {
  return page.waitForFunction(before => {
    const overlay = window.__straightener.app.state.overlay;
    return !!overlay && overlay.id !== before;
  }, idBefore);
}

// From the Export step: holds the export's encoding, taps Download and answers No to the
// Upscale question, and waits until the export is running. releaseEncoding lets it finish.
async function startHeldExport(page, hand) {
  await holdEncoding(page);
  await hand.tap(page.locator('#btnDownload'));
  await waitForQuestion(page, true);
  await hand.tap(page.locator('#pairPrompt').getByRole('button', { name: 'No', exact: true }));
  await waitForExporting(page, true);
}

// Lets a held export finish and waits until it has.
async function finishHeldExport(page) {
  await releaseEncoding(page);
  await waitForExporting(page, false);
}

test('DND-01.1 A photo dropped on the photo area opens [desktop]', async ({
  page,
  check,
}, testInfo) => {
  await startEmpty(page, testInfo);
  await check('the start screen shows, with no photo', async () => {
    await expect(page.locator('#btnOpenEmpty')).toBeVisible();
    expect(await openPhotoName(page)).toBe('');
  });
  const drop = await dragFiles(page, STAGE, [sampleFile(PHOTO)]);
  await check('dropping IMG_9136.JPEG opens it on the Perspective step', async () => {
    expect(drop.dropPrevented).toBe(true);
    await waitForPhotoNamed(page, PHOTO);
    expect(await page.evaluate(() => window.__straightener.app.tab)).toBe('perspective');
  });
});

test('DND-01.2 Of several files dropped, the first picture opens [desktop]', async ({
  page,
  check,
}, testInfo) => {
  await startEmpty(page, testInfo);
  const files = [notesFile(), sampleFile(OTHER_SIZE_PHOTO), sampleFile(PHOTO)];
  await dragFiles(page, STAGE, files);
  await check('of notes.txt, IMG_9075.JPEG and IMG_9136.JPEG, IMG_9075.JPEG opens', async () => {
    await waitForPhotoNamed(page, OTHER_SIZE_PHOTO);
  });
});

test('DND-01.3 A HEIC file is taken by its name [desktop]', async ({
  page,
  check,
}, testInfo) => {
  await startEmpty(page, testInfo);
  // A file named card.HEIC with no type given, as some systems hand a HEIC over. Its bytes are
  // a stand-in: no browser here decodes HEIC, and the app says so, which shows it was taken.
  const heic = {
    name: 'card.HEIC',
    mimeType: '',
    buffer: Buffer.from('Stand-in for a HEIC photo.\n'),
  };
  await dragFiles(page, STAGE, [notesFile(), heic]);
  await check(`a red message reads "${NO_HEIC}"`, async () => {
    expect(await waitForToast(page)).toEqual({ text: NO_HEIC, kind: 'error', isShown: true });
  });
});

test('DND-01.4 A dropped file that isn\'t a picture is ignored [desktop]', async ({
  page,
  check,
}, testInfo) => {
  await recordMessages(page);
  await startEmpty(page, testInfo);
  const drop = await dragFiles(page, STAGE, [notesFile()]);
  await page.waitForTimeout(NOTHING_HAPPENS_MS);
  await check('dropping notes.txt does nothing: no message, the start screen stays', async () => {
    expect(drop.dropPrevented).toBe(true);
    expect(await messagesSoFar(page)).toEqual([]);
    await expect(page.locator('#btnOpenEmpty')).toBeVisible();
    expect(await openPhotoName(page)).toBe('');
  });
});

test('DND-01.5 While a pair is open, a dropped photo asks New photo or Replace back '
  + '[desktop]', async ({ page, check }, testInfo) => {
  const hand = await makePair(page, testInfo);
  await check('the pair is open, on the back', async () => {
    await expect(page.locator('#sideSwitch')).toBeVisible();
  });
  await dragFiles(page, STAGE, [sampleFile(PHOTO)]);
  const card = page.locator('#pairPrompt');
  await check('a card asks "New photo": "End the pair, or replace the side you’re on?", with '
    + 'New photo and Replace back', async () => {
    await waitForQuestion(page, true);
    await expect(card.locator('.alert-title')).toHaveText('New photo');
    await expect(card).toContainText('End the pair, or replace the side you’re on?');
    await expect(card.getByRole('button', { name: 'New photo', exact: true })).toBeVisible();
    await expect(card.getByRole('button', { name: 'Replace back', exact: true })).toBeVisible();
  });
  await hand.tap(card.getByRole('button', { name: 'New photo', exact: true }));
  await check('New photo: IMG_9136.JPEG opens on its own; Front / Back is gone', async () => {
    await waitForPhotoNamed(page, PHOTO);
    await expect(page.locator('#sideSwitch')).toBeHidden();
  });
});

test('DND-02.1 A file held over the photo area shows the outline and Drop to open [desktop]',
  async ({ page, check }, testInfo) => {
    await startOn(page, testInfo, { step: 'perspective' });
    await check('no outline shows', async () => {
      expect((await dropOutline(page)).isShown).toBe(false);
    });
    await dragFiles(page, STAGE, [sampleFile(OTHER_SIZE_PHOTO)], 'over');
    await check('holding IMG_9075.JPEG over the photo: a white dashed outline, "Drop to open"',
      async () => {
        const outline = await dropOutline(page);
        expect(outline).toEqual({ isShown: true, caption: 'Drop to open', border: OUTLINE_BORDER });
      });
    await dragFiles(page, STAGE, [sampleFile(OTHER_SIZE_PHOTO)], 'leave');
    await check('taking it away: the outline goes, and IMG_9136.JPEG is still open', async () => {
      expect((await dropOutline(page)).isShown).toBe(false);
      expect(await openPhotoName(page)).toBe(PHOTO);
    });
  });

test('DND-02.2 On Overlay the outline says Drop to add as the logo, and goes on the drop '
  + '[desktop]', async ({ page, check }, testInfo) => {
  await startOn(page, testInfo, { step: 'overlay' });
  const logo = await greenLogo(page);
  await dragFiles(page, STAGE, [logo], 'over');
  await check('holding a logo over the photo: the outline reads "Drop to add as the logo"',
    async () => {
      const outline = await dropOutline(page);
      expect(outline).toEqual({
        isShown: true,
        caption: 'Drop to add as the logo',
        border: OUTLINE_BORDER,
      });
    });
  await dragFiles(page, STAGE, [logo], 'drop');
  await check('letting go: the outline goes and the logo shows on the photo', async () => {
    expect((await dropOutline(page)).isShown).toBe(false);
    await waitForNewLogo(page, null);
  });
});

test('DND-03.1 A pasted picture opens as a photo named pasted-photo [desktop]', async ({
  page,
  context,
  browserName,
  check,
}, testInfo) => {
  await allowClipboard(context, browserName, test);
  await startEmpty(page, testInfo);
  // Before the case: the photo is copied as a picture, as an image viewer's Copy does.
  await copyImage(page, sampleFile(PHOTO));
  await page.keyboard.press('Control+V');
  await check('Ctrl+V opens the card photo on Perspective', async () => {
    await waitForPhotoNamed(page, PASTED_NAME);
    expect(await page.evaluate(() => window.__straightener.app.tab)).toBe('perspective');
  });
  const hand = handFor(page, testInfo);
  await goToStep(page, 'export', hand);
  const saved = await saveEdits(page, hand, testInfo);
  await check('Save edits saves a file named pasted-photo-edits.json', () => {
    expect(saved.name).toBe(`${PASTED_NAME}-edits.json`);
  });
});

test('DND-03.2 A paste with no picture in it is left to the browser [desktop]', async ({
  page,
  context,
  browserName,
  check,
}, testInfo) => {
  await allowClipboard(context, browserName, test);
  const hand = await startOn(page, testInfo, { step: 'rotate' });
  await copyText(page, '7');
  await hand.tap(page.locator('#rotateAngle'));
  const field = page.locator('#rotateAngleField');
  await check('the angle opens as a box, with 0.0 selected', async () => {
    await expect(field).toBeFocused();
    await expect(field).toHaveValue('0.0');
  });
  await page.keyboard.press('Control+V');
  await check('Ctrl+V with the text 7 copied: the box shows 7; IMG_9136.JPEG is still open',
    async () => {
      await expect(field).toHaveValue('7');
      expect(await openPhotoName(page)).toBe(PHOTO);
    });
});

test('DND-04.1 On Overlay, a dropped picture becomes the logo [desktop]', async ({
  page,
  check,
}, testInfo) => {
  await startOn(page, testInfo, { step: 'overlay' });
  await dragFiles(page, STAGE, [await greenLogo(page)]);
  await check('the green logo shows on the photo; IMG_9136.JPEG is still open, on Overlay',
    async () => {
      await waitForNewLogo(page, null);
      expect(await openPhotoName(page)).toBe(PHOTO);
      expect(await page.evaluate(() => window.__straightener.app.tab)).toBe('overlay');
    });
});

test('DND-04.2 On Overlay, a pasted picture becomes the logo [desktop]', async ({
  page,
  context,
  browserName,
  check,
}, testInfo) => {
  await allowClipboard(context, browserName, test);
  await startOn(page, testInfo, { step: 'overlay' });
  await copyImage(page, await greenLogo(page));
  await page.keyboard.press('Control+V');
  await check('Ctrl+V: the green logo shows on the photo; IMG_9136.JPEG is still open',
    async () => {
      await waitForNewLogo(page, null);
      expect(await openPhotoName(page)).toBe(PHOTO);
    });
});

test('DND-04.3 In a pair, a dropped logo goes to the side you\'re on, with no question '
  + '[desktop]', async ({ page, check }, testInfo) => {
  const hand = await makePair(page, testInfo);
  await goToStep(page, 'overlay', hand);
  await dragFiles(page, STAGE, [await greenLogo(page)]);
  await check('on the back, the logo shows; no question is asked', async () => {
    await waitForNewLogo(page, null);
    expect(await page.evaluate(() => window.CF.isAlertOpen(
      document.getElementById('pairPrompt')))).toBe(false);
  });
  await switchTo(page, hand, 'front');
  await check('on the front, no logo', async () => {
    expect(await logoId(page)).toBeNull();
  });
});

test('DND-04.4 Two logos dropped within 0.9 s are two undo steps [desktop]', async ({
  page,
  check,
}, testInfo) => {
  test.fail(true, 'BUG-080');
  const hand = await startOn(page, testInfo, { step: 'overlay' });
  const disc = await drawnLogo(page, { name: 'blue-disc.png', paint: 'disc' });
  const green = await greenLogo(page);
  await dragFiles(page, STAGE, [disc]);
  await waitForNewLogo(page, null);
  const discId = await logoId(page);
  await dragFiles(page, STAGE, [green]);
  await waitForNewLogo(page, discId);
  await check('the blue disc, then at once the green square: the green square shows', async () => {
    expect(await logoId(page)).not.toBe(discId);
  });
  await hand.tap(page.locator('#btnUndo'));
  await check('one Undo brings back the blue disc', async () => {
    expect(await logoId(page)).toBe(discId);
  });
});

test('DND-04.5 A dropped logo is taken by its name, as the logo picker takes it [desktop]',
  async ({ page, check }, testInfo) => {
    test.fail(true, 'BUG-191');
    await startOn(page, testInfo, { step: 'overlay' });
    // A PNG handed over with no type, as some systems drag one: only its name says PNG.
    const logo = Object.assign(await greenLogo(page), { mimeType: '' });
    await dragFiles(page, STAGE, [logo]);
    await page.waitForTimeout(NOTHING_HAPPENS_MS);
    await check('green-logo.png, dropped with no type, shows on the photo as the logo',
      async () => {
        expect(await logoId(page)).not.toBeNull();
      });
  });

// The body of DND-04.6 and DND-04.7: during a held export, goes to Overlay, brings a logo in
// with `bringIn(logo)` and expects it refused with the dropped photo's message.
async function checkLogoRefusedDuringExport(page, check, hand, bringIn) {
  const logo = await greenLogo(page);
  await startHeldExport(page, hand);
  await goToStep(page, 'overlay', hand);
  await check('during the export, the Overlay step opens', async () => {
    expect(await page.evaluate(() => window.__straightener.app.exporting)).toBe(true);
  });
  await bringIn(logo);
  await page.waitForTimeout(NOTHING_HAPPENS_MS);
  const added = await logoId(page);
  const message = await page.evaluate(() => document.querySelector('#toast .toast-text')
    .textContent);
  await finishHeldExport(page);
  await check(`no logo is added, and an amber message reads "${WAIT_FOR_EXPORT}"`, () => {
    expect(added).toBeNull();
    expect(message).toBe(WAIT_FOR_EXPORT);
  });
}

test('DND-04.6 During an export, a dropped logo is refused [desktop]', async ({
  page,
  check,
}, testInfo) => {
  test.fail(true, 'BUG-192');
  const hand = await startOn(page, testInfo);
  await checkLogoRefusedDuringExport(page, check, hand, logo => dragFiles(page, STAGE, [logo]));
});

test('DND-04.7 During an export, a pasted logo is refused [desktop]', async ({
  page,
  context,
  browserName,
  check,
}, testInfo) => {
  test.fail(true, 'BUG-192');
  await allowClipboard(context, browserName, test);
  const hand = await startOn(page, testInfo);
  // The logo is on the clipboard before the export: putting it there draws on a canvas.
  await copyImage(page, await greenLogo(page));
  await checkLogoRefusedDuringExport(page, check, hand, () => page.keyboard.press('Control+V'));
});

test('DND-05.1 A photo dropped during an export is refused [desktop]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo);
  await startHeldExport(page, hand);
  await dragFiles(page, STAGE, [sampleFile(OTHER_SIZE_PHOTO)]);
  await check(`an amber message reads "${WAIT_FOR_EXPORT}"`, async () => {
    expect(await waitForToast(page)).toEqual({
      text: WAIT_FOR_EXPORT,
      kind: 'warn',
      isShown: true,
    });
  });
  await finishHeldExport(page);
  await page.waitForTimeout(NOTHING_HAPPENS_MS);
  await check('once the export ends, IMG_9136.JPEG is still the photo open', async () => {
    expect(await openPhotoName(page)).toBe(PHOTO);
  });
});

test('DND-05.2 A photo pasted during an export is refused [desktop]', async ({
  page,
  context,
  browserName,
  check,
}, testInfo) => {
  await allowClipboard(context, browserName, test);
  const hand = await startOn(page, testInfo);
  await copyImage(page, sampleFile(OTHER_SIZE_PHOTO));
  await startHeldExport(page, hand);
  await page.keyboard.press('Control+V');
  await check(`an amber message reads "${WAIT_FOR_EXPORT}"`, async () => {
    expect(await waitForToast(page)).toEqual({
      text: WAIT_FOR_EXPORT,
      kind: 'warn',
      isShown: true,
    });
  });
  await finishHeldExport(page);
  await page.waitForTimeout(NOTHING_HAPPENS_MS);
  await check('once the export ends, IMG_9136.JPEG is still the photo open', async () => {
    expect(await openPhotoName(page)).toBe(PHOTO);
  });
});

test('DND-05.3 A photo dropped while a side is opening gets the side\'s own warning '
  + '[desktop]', async ({ page, check }, testInfo) => {
  test.fail(true, 'BUG-031');
  const hand = await makePair(page, testInfo);
  await holdNextOpening(page);
  await hand.tap(page.locator('#sideSwitch .segment[data-value="front"]'));
  await waitForOpening(page);
  await dragFiles(page, STAGE, [sampleFile(PHOTO)]);
  const shown = await waitForToast(page);
  await releaseOpening(page);
  await check('an amber warning says to wait for the other side to open, not for an export',
    () => {
      expect(shown.kind).toBe('warn');
      expect(shown.text).not.toMatch(/export/i);
      expect(shown.text).toMatch(/side/i);
    });
  await check('the front opens; no photo replaced either side', async () => {
    await page.waitForFunction(() => !window.__straightener.app.isSwitching);
    expect(await openPhotoName(page)).toBe(PORTRAIT_PAIR.front);
  });
});

test('DND-06.1 A file dropped outside the photo area is ignored [desktop]', async ({
  page,
  check,
}, testInfo) => {
  await startOn(page, testInfo, { step: 'rotate' });
  const before = await editState(page);
  const panel = await dragFiles(page, '#panel', [sampleFile(OTHER_SIZE_PHOTO)]);
  await check('over the side panel: the no-drop cursor, and the page keeps the drop', () => {
    expect(panel).toEqual({ overPrevented: true, dropPrevented: true, dropEffect: 'none' });
  });
  const topBar = await dragFiles(page, '#topBarHost', [sampleFile(OTHER_SIZE_PHOTO)]);
  await check('over the top bar: the no-drop cursor, and the page keeps the drop', () => {
    expect(topBar).toEqual({ overPrevented: true, dropPrevented: true, dropEffect: 'none' });
  });
  await page.waitForTimeout(NOTHING_HAPPENS_MS);
  await check('IMG_9136.JPEG is still open, its edits as they were, on Rotate', async () => {
    expect(await openPhotoName(page)).toBe(PHOTO);
    expect(await editState(page)).toEqual(before);
    expect(await page.evaluate(() => window.__straightener.app.tab)).toBe('rotate');
  });
});
