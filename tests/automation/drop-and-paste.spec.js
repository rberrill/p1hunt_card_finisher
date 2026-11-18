// The drop-and-paste cases (tests/catalog/drop-and-paste.md): a photo dropped on the photo area
// or pasted, the drop outline, a logo dropped or pasted on the Overlay step, a photo that
// arrives while the app is busy, and a file dropped outside the photo area.
// A drop is the browser's own drag events carrying the files in a DataTransfer; a paste is a
// real Ctrl+V with a picture on the clipboard (Chromium at desktop size: a phone has neither).
// The files other than sample photos are the committed ones in tests/fixtures/ that the cases
// name. Each test reads the app's state only to check a result.
'use strict';
const { test, expect } = require('./support/case.js');
const {
  openApp,
  goToStep,
  handFor,
  editState,
  stepNow,
  isQuestionUp,
} = require('./support/app.js');
const { waitForQuestion } = require('./support/export.js');
const {
  makePair,
  switchTo,
  waitingPhotoName,
  holdNextOpening,
  releaseOpening,
  waitForOpening,
  PORTRAIT_PAIR,
} = require('./support/front-and-back.js');
const { logoId, logoPlacement, slide } = require('./support/overlay.js');
const {
  PHOTO,
  OTHER_SIZE_PHOTO,
  startOn,
  saveEdits,
  recordMessages,
  messagesSoFar,
  toastNow,
  waitForToast,
  sampleFile,
  droppedFixture,
  dragFiles,
  dropOutline,
  copyImage,
  copyText,
  allowClipboard,
  startHeldExport,
  releaseHeldExport,
} = require('./support/edits-drop-keys.js');

// The photo area, where a drop opens a photo.
const STAGE = '#stage';
// The message a photo arriving during an export gets, word for word.
const WAIT_FOR_EXPORT = 'Wait for the export to finish, then open the photo.';
// The message a photo arriving while a pair's side opens gets, word for word (ruling R13;
// tests/catalog/wording.md).
const WAIT_FOR_SIDE = 'Wait for the other side to open, then open the photo.';
// The message a HEIC file gets in a browser that can't open HEIC, word for word.
const NO_HEIC = 'This browser can’t open HEIC. Save the photo as JPEG first (Safari opens HEIC '
  + 'directly).';
// The name the app gives a pasted photo.
const PASTED_NAME = 'pasted-photo';
// How long a case waits to be sure nothing happened, in ms.
const NOTHING_HAPPENS_MS = 800;
// The drop outline's border: 2 px, dashed, the app's white (#f2f2f3).
const OUTLINE_BORDER = '2px dashed rgb(242, 242, 243)';
// Two logos added less than this far apart, in ms, would be one undo step today (ruling R19).
const COALESCE_MS = 900;
// The Overlay step's move pad's Move right key and size pad's Larger key, and how many times
// "Change the logo" presses each.
const MOVE_RIGHT = '#overlayMovePad [data-key="1,0"]';
const LARGER = '#overlaySizePad [data-key="grow"]';
const MOVE_TAPS = 10;
const GROW_TAPS = 3;
// A new logo's width as a fraction of the photo's (CardEngine.OVERLAY_DEFAULTS.width). One
// Move right moves it 0.5% of the photo's width (CONFIG.overlay.nudgePct); one Larger makes it
// 1.05 times as wide (CONFIG.overlay.sizeStep). So "Change the logo" leaves its middle 55% of
// the way across and its width 28.9% of the photo's.
const START_WIDTH = 0.25;
const MOVED_CX = 0.5 + MOVE_TAPS * 0.005;
const GROWN_WIDTH = START_WIDTH * 1.05 ** GROW_TAPS;
// How close two fractions of the photo must be (a placement is kept as exact fractions).
const FRACTION_TOLERANCE = 1e-6;
// Where the Opacity slider's knob rests at 100% and its middle, as fractions of its width.
const SLIDER_RIGHT_END = 0.98;
const SLIDER_MIDDLE = 0.5;

// The fixtures the cases drop: a line of text, a stand-in for a HEIC photo and two logos.
const notesFile = () => droppedFixture('notes.txt');
const heicFile = () => droppedFixture('card.HEIC');
const greenLogo = () => droppedFixture('green-logo.png');
const blueDisc = () => droppedFixture('blue-disc.png');

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

// When the last undo step was recorded, on the page's clock in ms: a logo added a moment
// after another is recorded at its own time even when the two are merged into one step.
const lastStepTime = page => page.evaluate(() => window.CF.History.lastTime);

// Opens the app on its start screen, with no photo open. Returns the hand for this target.
async function startEmpty(page, testInfo) {
  await openApp(page);
  return handFor(page, testInfo);
}

// Waits until a logo other than `idBefore` is on the photo.
function waitForNewLogo(page, idBefore) {
  return page.waitForFunction(before => {
    const overlay = window.__straightener.app.state.overlay;
    return !!overlay && overlay.id !== before;
  }, idBefore);
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
    expect(await stepNow(page)).toBe('perspective');
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
  // card.HEIC with no type given, as some systems hand a HEIC over. Its bytes are a stand-in:
  // no browser here decodes HEIC, and the app says so, which shows it was taken.
  await dragFiles(page, STAGE, [notesFile(), heicFile()]);
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
  await check('the pair is open: Front / Back shows in the top bar', async () => {
    await expect(page.locator('#sideSwitch')).toBeVisible();
  });
  await dragFiles(page, STAGE, [sampleFile(PHOTO)]);
  const box = page.locator('#pairPrompt');
  await check('the question box asks "New photo": "End the pair, or replace the side you’re '
    + 'on?", with New photo and Replace back', async () => {
    await waitForQuestion(page, true);
    await expect(box.locator('.alert-title')).toHaveText('New photo');
    await expect(box).toContainText('End the pair, or replace the side you’re on?');
    await expect(box.getByRole('button', { name: 'New photo', exact: true })).toBeVisible();
    await expect(box.getByRole('button', { name: 'Replace back', exact: true })).toBeVisible();
  });
  await hand.tap(box.getByRole('button', { name: 'New photo', exact: true }));
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
  await dragFiles(page, STAGE, [greenLogo()], 'over');
  await check('holding green-logo.png over the photo: the outline reads "Drop to add as the '
    + 'logo"', async () => {
    const outline = await dropOutline(page);
    expect(outline).toEqual({
      isShown: true,
      caption: 'Drop to add as the logo',
      border: OUTLINE_BORDER,
    });
  });
  await dragFiles(page, STAGE, [greenLogo()], 'drop');
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
    expect(await stepNow(page)).toBe('perspective');
  });
  const hand = handFor(page, testInfo);
  await goToStep(page, 'export', hand);
  await check('Export in the step tabs: the Export step shows, with Export options', async () => {
    expect(await stepNow(page)).toBe('export');
    await expect(page.locator('#btnSaveEdits')).toBeVisible();
  });
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
  await dragFiles(page, STAGE, [greenLogo()]);
  await check('the green logo shows on the photo; IMG_9136.JPEG is still open, on Overlay',
    async () => {
      await waitForNewLogo(page, null);
      expect(await openPhotoName(page)).toBe(PHOTO);
      expect(await stepNow(page)).toBe('overlay');
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
  await copyImage(page, greenLogo());
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
  await dragFiles(page, STAGE, [greenLogo()]);
  await check('on the back, the logo shows; no question box shows', async () => {
    await waitForNewLogo(page, null);
    expect(await isQuestionUp(page)).toBe(false);
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
  const disc = blueDisc();
  const green = greenLogo();
  await dragFiles(page, STAGE, [disc]);
  await waitForNewLogo(page, null);
  const discAddedMs = await lastStepTime(page);
  const discId = await logoId(page);
  await check('blue-disc.png dropped: the blue disc is the logo', () => {
    expect(discId).not.toBeNull();
  });
  await dragFiles(page, STAGE, [green]);
  await waitForNewLogo(page, discId);
  const greenAddedMs = await lastStepTime(page);
  await check('green-logo.png dropped at once: the green square is the logo, added less than '
    + '0.9 s after the blue disc', async () => {
    expect(await logoId(page)).not.toBe(discId);
    expect(greenAddedMs - discAddedMs).toBeLessThan(COALESCE_MS);
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
    await dragFiles(page, STAGE, [droppedFixture('green-logo.png', '')]);
    await page.waitForTimeout(NOTHING_HAPPENS_MS);
    await check('green-logo.png, dropped with no type, shows on the photo as the logo',
      async () => {
        expect(await logoId(page)).not.toBeNull();
      });
  });

// The body of DND-04.6 and DND-04.7: holds an export open (Download, then No), goes to
// Overlay, brings green-logo.png in with `bringIn(logo)` and expects it refused with the
// dropped photo's amber message; then lets the export finish and expects IMG_9136.JPEG still
// open, with no logo.
async function checkLogoRefusedDuringExport(page, check, hand, bringIn) {
  const logo = greenLogo();
  await startHeldExport(page, hand, check);
  await goToStep(page, 'overlay', hand);
  await check('during the export, Overlay in the step tabs: the Overlay step shows', async () => {
    expect(await stepNow(page)).toBe('overlay');
    expect(await page.evaluate(() => window.__straightener.app.exporting)).toBe(true);
  });
  await bringIn(logo);
  await page.waitForTimeout(NOTHING_HAPPENS_MS);
  const added = await logoId(page);
  const message = await toastNow(page);
  await releaseHeldExport(page);
  await check(`no logo is added, and an amber message reads "${WAIT_FOR_EXPORT}"`, () => {
    expect(added).toBeNull();
    expect(message).toEqual({ text: WAIT_FOR_EXPORT, kind: 'warn', isShown: true });
  });
  await page.waitForTimeout(NOTHING_HAPPENS_MS);
  await check('once the export ends, IMG_9136.JPEG is still the photo open, with no logo',
    async () => {
      expect(await openPhotoName(page)).toBe(PHOTO);
      expect(await logoId(page)).toBeNull();
    });
}

test('DND-04.6 During an export, a dropped logo is refused [desktop]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo);
  await checkLogoRefusedDuringExport(page, check, hand, logo => dragFiles(page, STAGE, [logo]));
});

test('DND-04.7 During an export, a pasted logo is refused [desktop]', async ({
  page,
  context,
  browserName,
  check,
}, testInfo) => {
  await allowClipboard(context, browserName, test);
  const hand = await startOn(page, testInfo);
  // The logo is on the clipboard before the export: putting it there draws on a canvas.
  await copyImage(page, greenLogo());
  await checkLogoRefusedDuringExport(page, check, hand, () => page.keyboard.press('Control+V'));
});

// Expects two numbers to be within `tolerance` of each other.
function expectNear(actual, expected, tolerance) {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance);
}

// The OPACITY readout beside the slider, as a number of percent.
async function opacityReadout(page) {
  return parseInt(await page.locator('#overlayOpacityValue').textContent(), 10);
}

test('DND-04.8 A logo dropped while one is placed takes its place, width and opacity '
  + '[desktop]', async ({ page, check }, testInfo) => {
  const hand = await startOn(page, testInfo, { step: 'overlay' });
  await dragFiles(page, STAGE, [blueDisc()]);
  await waitForNewLogo(page, null);
  const discId = await logoId(page);
  const start = await logoPlacement(page);
  await check('blue-disc.png dropped: the blue disc is the logo, in the middle of the photo, a '
    + 'quarter of its width, with OPACITY at 100%', async () => {
    expectNear(start.cx, 0.5, FRACTION_TOLERANCE);
    expectNear(start.cy, 0.5, FRACTION_TOLERANCE);
    expectNear(start.w, START_WIDTH, FRACTION_TOLERANCE);
    expect(start.opacity).toBe(1);
    expect(await opacityReadout(page)).toBe(100);
  });
  // The named action "Change the logo".
  for (let i = 0; i < MOVE_TAPS; i++) await hand.tap(page.locator(MOVE_RIGHT));
  for (let i = 0; i < GROW_TAPS; i++) await hand.tap(page.locator(LARGER));
  await slide(page, hand, page.locator('#overlayOpacity'), SLIDER_RIGHT_END, SLIDER_MIDDLE);
  const changed = await logoPlacement(page);
  await check('the disc\'s middle is 55% of the way across the photo, it is 28.9% of the '
    + 'photo\'s width, and OPACITY reads about 50%', async () => {
    expectNear(changed.cx, MOVED_CX, FRACTION_TOLERANCE);
    expectNear(changed.cy, start.cy, FRACTION_TOLERANCE);
    expectNear(changed.w, GROWN_WIDTH, FRACTION_TOLERANCE);
    expect(changed.opacity).toBeGreaterThan(0.4);
    expect(changed.opacity).toBeLessThan(0.6);
    expect(await opacityReadout(page)).toBe(Math.round(changed.opacity * 100));
  });
  await dragFiles(page, STAGE, [greenLogo()]);
  await waitForNewLogo(page, discId);
  const replaced = await logoPlacement(page);
  await check('green-logo.png dropped: the green square is the logo, where the disc was: its '
    + 'middle 55% of the way across, as far down as the disc\'s, 28.9% of the photo\'s width, at '
    + 'the same opacity', async () => {
    expect(await logoId(page)).not.toBe(discId);
    expectNear(replaced.cx, MOVED_CX, FRACTION_TOLERANCE);
    expectNear(replaced.cy, changed.cy, FRACTION_TOLERANCE);
    expectNear(replaced.w, GROWN_WIDTH, FRACTION_TOLERANCE);
    expect(replaced.opacity).toBe(changed.opacity);
    expect(await opacityReadout(page)).toBe(Math.round(changed.opacity * 100));
  });
});

// The body of DND-05.1 and DND-05.2: holds an export open (Download, then No), brings
// IMG_9075.JPEG in with `bringIn()`, expects the amber message, then lets the export finish
// and expects IMG_9136.JPEG still open.
async function checkPhotoRefusedDuringExport(page, check, hand, bringIn) {
  await startHeldExport(page, hand, check);
  await bringIn();
  await check(`an amber message reads "${WAIT_FOR_EXPORT}"`, async () => {
    expect(await waitForToast(page)).toEqual({
      text: WAIT_FOR_EXPORT,
      kind: 'warn',
      isShown: true,
    });
  });
  await releaseHeldExport(page);
  await page.waitForTimeout(NOTHING_HAPPENS_MS);
  await check('once the export ends, IMG_9136.JPEG is still the photo open', async () => {
    expect(await openPhotoName(page)).toBe(PHOTO);
  });
}

test('DND-05.1 A photo dropped during an export is refused [desktop]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOn(page, testInfo);
  const bringIn = () => dragFiles(page, STAGE, [sampleFile(OTHER_SIZE_PHOTO)]);
  await checkPhotoRefusedDuringExport(page, check, hand, bringIn);
});

test('DND-05.2 A photo pasted during an export is refused [desktop]', async ({
  page,
  context,
  browserName,
  check,
}, testInfo) => {
  await allowClipboard(context, browserName, test);
  const hand = await startOn(page, testInfo);
  // The photo is on the clipboard before the export: putting it there draws on a canvas.
  await copyImage(page, sampleFile(OTHER_SIZE_PHOTO));
  const bringIn = () => page.keyboard.press('Control+V');
  await checkPhotoRefusedDuringExport(page, check, hand, bringIn);
});

test('DND-05.3 A photo dropped while a side is opening gets the side\'s own warning '
  + '[desktop]', async ({ page, check }, testInfo) => {
  const hand = await makePair(page, testInfo);
  await holdNextOpening(page);
  await hand.tap(page.locator('#sideSwitch .segment[data-value="front"]'));
  await check('Front: the front starts to open; Front / Back is greyed out', async () => {
    await waitForOpening(page);
    await expect(page.locator('#sideSwitch .segment[data-value="front"]')).toBeDisabled();
    await expect(page.locator('#sideSwitch .segment[data-value="back"]')).toBeDisabled();
  });
  await dragFiles(page, STAGE, [sampleFile(PHOTO)]);
  const shown = await waitForToast(page);
  await releaseOpening(page);
  await check(`an amber message reads "${WAIT_FOR_SIDE}"`, () => {
    expect(shown).toEqual({ text: WAIT_FOR_SIDE, kind: 'warn', isShown: true });
  });
  await check('the front is open; IMG_9136.JPEG replaced neither side', async () => {
    await page.waitForFunction(() => !window.__straightener.app.isSwitching);
    expect(await openPhotoName(page)).toBe(PORTRAIT_PAIR.front);
    expect(await waitingPhotoName(page)).toBe(PORTRAIT_PAIR.back);
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
    expect(await stepNow(page)).toBe('rotate');
  });
});
