// The storage and settings cases (tests/catalog/storage-and-settings.md): the remembered
// preferences, what the session keeps on the device, the saved logo, what a reload forgets,
// the app opened from a subfolder, from disk and without its worker, the page's title and
// icons, and the image engine running in its worker.
// Each test drives the app as a person would, through hand.tap and hand.drag (a finger on the
// phone targets, the mouse on the wide ones), and reads the app's state only to check a result.
// What a case has a person read in the developer tools (the stored records, a setting), the
// test reads in the page.
// STO-06 is proven by node tests/selftest.js and STO-08.1 needs a real iPhone, so they have no
// test here.
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { test, expect } = require('./support/case.js');
const {
  root,
  openApp,
  goToStep,
  editState,
  handFor,
  openOptions,
  closeOptions,
  readSavedImage,
} = require('./support/app.js');
const {
  waitUntil,
  waitForSaved,
  reloadToStart,
  resumeAs,
  addLogo,
  storedRecord,
  toastNow,
} = require('./support/start-and-session.js');
const { choiceButton, selectedChoices } = require('./support/export.js');
const { presetChip, selectedChips } = require('./support/crop.js');
const { makePair } = require('./support/front-and-back.js');
const { pinchAt } = require('./support/perspective.js');
const {
  PHOTO,
  startWith,
  openWith,
  stepShown,
  isOnFoundCard,
  tapDownload,
  answerForFile,
  watchConsole,
  watchRequests,
  storedPrefs,
  refusePrefsStorage,
} = require('./support/security-layout-speed.js');

// The size an upscaled export of the case photo has (the default Size), and the size of its
// 1:1 crop as it is, in px.
const UPSCALED_PX = 2000;
const CROP_PX = 1400;
// The Upscale question for the default Size.
const UPSCALE_QUESTION = 'Upscale to 2000 px?';
// A second photo, for "the next photo".
const SECOND_PHOTO = 'IMG_9075.JPEG';
// The address the app has under a website's subfolder, as GitHub Pages serves it.
const SUBFOLDER_ADDRESS = 'p1hunt_card_finisher/index.html';
// The console warning when the image engine's worker can't start, up to the reason.
const WORKER_WARNING = '[card-finisher] Web Worker unavailable, running on main thread:';
// The page's title and the browser's own color (the theme-color meta).
const PAGE_TITLE = 'P1Hunt Card Finisher';
const THEME_COLOR = '#161618';
// The home-screen icon's size, in px.
const TOUCH_ICON_PX = 180;
// The size pad's Larger key on the Overlay step, and how much one tap widens the logo.
const LARGER = '#overlaySizePad [data-key="grow"]';
const SIZE_STEP = 1.05;
// A new logo's width, as a fraction of the crop's (CardEngine.OVERLAY_DEFAULTS.width).
const LOGO_START_WIDTH = 0.25;
// How long the app waits after a change before saving it, plus a margin, in ms ("wait two
// seconds" in the cases is longer still).
const SAVED_AFTER_MS = 1000;
// The gap between two fingers before and after a pinch that zooms in, in CSS px.
const PINCH_FROM_PX = 60;
const PINCH_TO_PX = 180;
// The records a pair with a logo keeps on the device.
const PAIR_RECORDS = ['edits', 'overlay', 'pair', 'pairPhoto', 'photo', 'photoOverlay'];

// The photo's view on screen: true when it is zoomed or panned away from its fitted view.
function isZoomed(page) {
  return page.evaluate(() => window.CF.currentView().auto === false);
}

// The pressed state of a tool (a mode or a switch), as the screen marks it.
function isPressed(page, selector) {
  return page.locator(selector).evaluate(el => el.getAttribute('aria-pressed') === 'true');
}

// Turns a switch in a step's options with a tap on its row: opens the options, taps the row,
// closes them (the case's named actions "Turn Debug overlay on" and "Turn Grid off").
async function tapSwitchInOptions(page, hand, step, switchId) {
  await openOptions(page, hand, step);
  await hand.tap(page.locator(`#${step}Sheet label:has(#${switchId})`));
  await closeOptions(page, hand, step);
}

// The case's named action "Reload and resume": waits until the edits on screen are saved (the
// case waits two seconds), reloads the page and taps Resume.
async function reloadAndResume(page, hand, expected) {
  await waitForSaved(page, expected);
  await reloadToStart(page);
  await resumeAs(page, hand, PHOTO);
}

// The names of the records the app keeps on the device now, in order.
function storedKeys(page) {
  return page.evaluate(async () => {
    const database = await window.__straightener.Session.open();
    return new Promise((resolve, reject) => {
      const request = database.transaction('session').objectStore('session').getAllKeys();
      request.onsuccess = () => resolve(request.result.map(String).sort());
      request.onerror = () => reject(request.error);
    });
  });
}

/* ---------------- STO-01 Preferences are remembered ---------------- */

test('STO-01.1 Undoing a Format change also changes the remembered Format [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startWith(page, testInfo);
  await goToStep(page, 'export', hand);
  await hand.tap(choiceButton(page, 'exportFormat', 'PNG'));
  await check('PNG is selected', async () => {
    expect(await selectedChoices(page, 'exportFormat')).toEqual(['PNG']);
    expect((await storedPrefs(page)).export.format).toBe('png');
  });
  await hand.tap(page.locator('#btnUndo'));
  await check('JPEG is selected again', async () => {
    expect(await selectedChoices(page, 'exportFormat')).toEqual(['JPEG']);
  });
  await openWith(page, hand, page.locator('#btnOpen'), SECOND_PHOTO);
  await check('IMG_9075.JPEG opens on the Perspective step', async () => {
    expect((await editState(page)).source.name).toBe(SECOND_PHOTO);
    expect(await stepShown(page)).toBe('perspective');
  });
  await goToStep(page, 'export', hand);
  await check('JPEG is selected: the Undo changed the remembered Format too', async () => {
    expect(await selectedChoices(page, 'exportFormat')).toEqual(['JPEG']);
  });
});

test('STO-01.2 Reset crop leaves the remembered preset for after a reload [phone] [webkit]',
  async ({ page, check }, testInfo) => {
    const hand = await startWith(page, testInfo);
    await goToStep(page, 'crop', hand);
    await hand.tap(presetChip(page, '4:5'));
    await check('4:5 is selected', async () => {
      expect(await selectedChips(page)).toEqual(['4:5']);
    });
    await openOptions(page, hand, 'crop');
    await check('Crop options rise, with Reset crop', async () => {
      await expect(page.locator('#cropResetRow')).toBeVisible();
    });
    await hand.tap(page.locator('#cropResetRow'));
    const chipsAfterReset = await selectedChips(page);
    await check('4:5 is still selected: the crop went back to the remembered preset', async () => {
      expect(chipsAfterReset).toEqual(['4:5']);
    });
    await page.waitForTimeout(SAVED_AFTER_MS);
    await reloadToStart(page);
    await check('the start screen offers Resume', async () => {
      await expect(page.locator('#btnResume')).toBeVisible();
    });
    await hand.tap(page.locator('#btnFresh'));
    await check('the start screen, with no Resume card', async () => {
      await expect(page.locator('#resume')).toBeHidden();
    });
    await openWith(page, hand, page.locator('#btnOpenEmpty'), SECOND_PHOTO);
    await check('IMG_9075.JPEG opens on the Perspective step', async () => {
      expect(await stepShown(page)).toBe('perspective');
    });
    await goToStep(page, 'crop', hand);
    const chips = await selectedChips(page);
    await check('4:5 is selected: the remembered preset is still the one chosen before Reset '
      + 'crop', async () => {
      expect(chips).toEqual(['4:5']);
    });
  });

test('STO-01.3 When preferences can\'t be saved, the app carries on without a message [phone]',
  async ({ page, check }, testInfo) => {
    await refusePrefsStorage(page);
    const hand = await startWith(page, testInfo);
    await goToStep(page, 'export', hand);
    await hand.tap(choiceButton(page, 'exportFormat', 'PNG'));
    await check('PNG is selected, and no message shows over the photo', async () => {
      expect(await selectedChoices(page, 'exportFormat')).toEqual(['PNG']);
      expect((await toastNow(page)).isShown).toBe(false);
      expect(await storedPrefs(page)).toBeNull();
    });
    const { question, downloading } = await tapDownload(page, hand);
    await check(`the question box asks "${UPSCALE_QUESTION}"`, async () => {
      expect(question).toBe(UPSCALE_QUESTION);
    });
    const saved = await answerForFile(page, hand, 'No', downloading);
    await check('IMG_9136-straight.png is saved', async () => {
      expect(saved.name).toBe('IMG_9136-straight.png');
    });
    await check('the Console holds no error', async () => {
      expect(check.consoleErrors()).toEqual([]);
    });
  });

/* ---------------- STO-02 The session is kept on the device ---------------- */

test('STO-02.1 A pair with a logo keeps all six records on the device [phone] [webkit]',
  async ({ page, check }, testInfo) => {
    const hand = await makePair(page, testInfo);
    await goToStep(page, 'overlay', hand);
    await check('the Overlay step shows, with Add logo', async () => {
      await expect(page.locator('#btnOverlayAdd')).toBeVisible();
    });
    const id = await addLogo(page, hand, page.locator('#btnOverlayAdd'), 'icon.svg');
    await check('the logo is placed on the back', async () => {
      expect(await page.evaluate(() => window.__straightener.app.pair.current)).toBe('back');
      expect((await editState(page)).overlay.id).toBe(id);
    });
    await waitForSaved(page, { overlayId: id });
    await waitUntil(page, async names => {
      const Session = window.__straightener.Session;
      const records = await Promise.all(names.map(name => Session.get(name)));
      return records.every(Boolean);
    }, PAIR_RECORDS, SAVED_AFTER_MS * 5, 'all six records');
    await check('the store holds six records: edits, overlay, pair, pairPhoto, photo and '
      + 'photoOverlay', async () => {
      expect(await storedKeys(page)).toEqual(PAIR_RECORDS);
    });
    await check('the edits record names 14_back_portrait_raw_white.JPEG and holds the logo',
      async () => {
        const edits = await storedRecord(page, 'edits');
        expect(edits.name).toBe('14_back_portrait_raw_white.JPEG');
        expect(edits.state.overlay.id).toBe(id);
      });
  });

test('STO-02.2 Remove leaves this photo\'s logo stored [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startWith(page, testInfo);
  await goToStep(page, 'overlay', hand);
  const id = await addLogo(page, hand, page.locator('#btnOverlayAdd'), 'icon.svg');
  await check('the logo is placed', async () => {
    expect((await editState(page)).overlay.id).toBe(id);
  });
  await hand.tap(page.locator('#toolOverlayRemove'));
  await check('the logo is gone from the photo', async () => {
    expect((await editState(page)).overlay).toBeNull();
  });
  await waitForSaved(page, { overlayId: null });
  await check('the overlay in the edits record\'s state is null: the edits hold no logo',
    async () => {
      expect((await storedRecord(page, 'edits')).state.overlay).toBeNull();
    });
  await check('the photoOverlay record is still there, named icon.svg', async () => {
    const record = await storedRecord(page, 'photoOverlay');
    expect(record && { id: record.id, name: record.name }).toEqual({ id, name: 'icon.svg' });
  });
});

/* ---------------- STO-03 The saved logo outlives a reload and Start fresh ---------------- */

test('STO-03.1 The saved logo comes back after Start fresh, at the size it was last used '
  + '[phone] [webkit]', async ({ page, check }, testInfo) => {
  const hand = await startWith(page, testInfo);
  await goToStep(page, 'overlay', hand);
  await addLogo(page, hand, page.locator('#btnOverlayAdd'), 'icon.svg');
  await check('the logo is placed, a quarter of the crop\'s width', async () => {
    expect((await editState(page)).overlay.w).toBeCloseTo(LOGO_START_WIDTH, 4);
  });
  await hand.tap(page.locator(LARGER));
  await check('the logo grows a little, to 1.05 times its width', async () => {
    expect((await editState(page)).overlay.w).toBeCloseTo(LOGO_START_WIDTH * SIZE_STEP, 4);
  });
  await page.waitForTimeout(SAVED_AFTER_MS);
  await reloadToStart(page);
  await check('the start screen offers Resume', async () => {
    await expect(page.locator('#btnResume')).toBeVisible();
  });
  await hand.tap(page.locator('#btnFresh'));
  await check('the start screen, with no Resume card', async () => {
    await expect(page.locator('#resume')).toBeHidden();
  });
  await openWith(page, hand, page.locator('#btnOpenEmpty'), SECOND_PHOTO);
  await check('IMG_9075.JPEG opens on the Perspective step', async () => {
    expect(await stepShown(page)).toBe('perspective');
  });
  await goToStep(page, 'overlay', hand);
  await check('no logo is on the photo; Use saved overlay is offered', async () => {
    expect((await editState(page)).overlay).toBeNull();
    await expect(page.locator('#btnUseSaved')).toBeVisible();
  });
  await hand.tap(page.locator('#btnUseSaved'));
  await page.waitForFunction(() => !!window.__straightener.app.state.overlay);
  await check('the logo is placed at 1.05 times a quarter of the crop\'s width', async () => {
    expect((await editState(page)).overlay.w).toBeCloseTo(LOGO_START_WIDTH * SIZE_STEP, 4);
  });
});

/* ---------------- STO-04 What a reload forgets ---------------- */

test('STO-04.1 A reload forgets Debug overlay and Grid [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startWith(page, testInfo);
  await tapSwitchInOptions(page, hand, 'perspective', 'debugOverlay');
  await check('detection\'s lines are drawn over the photo', async () => {
    expect(await page.locator('#debugOverlay').isChecked()).toBe(true);
  });
  await goToStep(page, 'rotate', hand);
  await check('the Rotate step shows, with the grid over the photo', async () => {
    expect(await page.locator('#rotateGrid').isChecked()).toBe(true);
  });
  await tapSwitchInOptions(page, hand, 'rotate', 'rotateGrid');
  await check('the grid goes', async () => {
    expect(await page.locator('#rotateGrid').isChecked()).toBe(false);
  });
  await reloadAndResume(page, hand, { tab: 'rotate' });
  await check('the photo opens on the Rotate step, with the grid over it again', async () => {
    expect(await stepShown(page)).toBe('rotate');
    expect(await page.locator('#rotateGrid').isChecked()).toBe(true);
  });
  await openOptions(page, hand, 'rotate');
  await check('Rotate options rise, with Grid on', async () => {
    await expect(page.locator('#rotateGrid')).toBeChecked();
    await expect(page.locator('#rotateSheet label:has(#rotateGrid)')).toBeVisible();
  });
  await closeOptions(page, hand, 'rotate');
  await check('the options close', async () => {
    await expect(page.locator('#rotateSheet')).toBeHidden();
  });
  await goToStep(page, 'perspective', hand);
  await check('the Perspective step shows, with no detection lines over the photo', async () => {
    expect(await stepShown(page)).toBe('perspective');
    expect(await page.locator('#debugOverlay').isChecked()).toBe(false);
  });
  await openOptions(page, hand, 'perspective');
  await check('Perspective options rise, with Debug overlay off', async () => {
    await expect(page.locator('#perspectiveSheet label:has(#debugOverlay)')).toBeVisible();
    await expect(page.locator('#debugOverlay')).not.toBeChecked();
  });
});

test('STO-04.2 Grid and Debug overlay carry over to a new photo in the same visit [phone]',
  async ({ page, check }, testInfo) => {
    const hand = await startWith(page, testInfo);
    await tapSwitchInOptions(page, hand, 'perspective', 'debugOverlay');
    await check('detection\'s lines are drawn over the photo', async () => {
      expect(await page.locator('#debugOverlay').isChecked()).toBe(true);
    });
    await goToStep(page, 'rotate', hand);
    await check('the Rotate step shows, with the grid over the photo', async () => {
      expect(await page.locator('#rotateGrid').isChecked()).toBe(true);
    });
    await tapSwitchInOptions(page, hand, 'rotate', 'rotateGrid');
    await check('the grid goes', async () => {
      expect(await page.locator('#rotateGrid').isChecked()).toBe(false);
    });
    await openWith(page, hand, page.locator('#btnOpen'), SECOND_PHOTO);
    await check('IMG_9075.JPEG opens on the Perspective step, with detection\'s lines drawn over '
      + 'it', async () => {
      expect(await stepShown(page)).toBe('perspective');
      expect(await page.locator('#debugOverlay').isChecked()).toBe(true);
    });
    await goToStep(page, 'rotate', hand);
    await check('the Rotate step shows, with no grid over the photo: Grid is still off',
      async () => {
        expect(await page.locator('#rotateGrid').isChecked()).toBe(false);
      });
  });

test('STO-04.3 A reload forgets the chosen modes, the zoom and the undo history [phone]',
  async ({ page, check }, testInfo) => {
    const hand = await startWith(page, testInfo);
    await hand.tap(page.locator('#toolFlatten'));
    await check('Flatten is selected; the line above the controls reads FLATTEN and 100%',
      async () => {
        expect(await isPressed(page, '#toolFlatten')).toBe(true);
        await expect(page.locator('#perspectiveLine')).toContainText(/flatten/i);
        await expect(page.locator('#perspectiveLine')).toContainText('100%');
      });
    await goToStep(page, 'rotate', hand);
    await check('the Rotate step shows, with the Straighten ruler', async () => {
      await expect(page.locator('#rotateRulerRow')).toBeVisible();
    });
    await hand.tap(page.locator('#toolRotateRight'));
    await check('the photo turns a quarter right; Undo is no longer greyed out', async () => {
      expect((await editState(page)).rotation.quarter).toBe(1);
      await expect(page.locator('#btnUndo')).toBeEnabled();
    });
    await hand.tap(page.locator('#toolFlip'));
    await check('Flip is selected instead of Straighten; Horizontal and Vertical show in place '
      + 'of the ruler', async () => {
      expect(await isPressed(page, '#toolFlip')).toBe(true);
      await expect(page.locator('#btnFlipHorizontal')).toBeVisible();
      await expect(page.locator('#btnFlipVertical')).toBeVisible();
      await expect(page.locator('#rotateRulerRow')).toBeHidden();
    });
    const view = await page.locator('#view').boundingBox();
    const middle = { x: view.x + view.width / 2, y: view.y + view.height / 2 };
    await pinchAt(page, middle, PINCH_FROM_PX, PINCH_TO_PX);
    await check('the photo is zoomed in', async () => {
      expect(await isZoomed(page)).toBe(true);
    });
    await reloadAndResume(page, hand, { quarter: 1, tab: 'rotate' });
    await check('the photo opens on the Rotate step, turned a quarter right and fitted to the '
      + 'screen, not zoomed', async () => {
      expect(await stepShown(page)).toBe('rotate');
      expect((await editState(page)).rotation.quarter).toBe(1);
      expect(await isZoomed(page)).toBe(false);
    });
    await check('Straighten is selected, not Flip, and its ruler shows', async () => {
      expect(await isPressed(page, '#toolStraighten')).toBe(true);
      expect(await isPressed(page, '#toolFlip')).toBe(false);
      await expect(page.locator('#rotateRulerRow')).toBeVisible();
    });
    await check('Undo is greyed out: the undo history was not kept', async () => {
      await expect(page.locator('#btnUndo')).toBeDisabled();
    });
    await goToStep(page, 'perspective', hand);
    await check('Nudge is selected, not Flatten', async () => {
      expect(await isPressed(page, '#toolNudge')).toBe(true);
      expect(await isPressed(page, '#toolFlatten')).toBe(false);
    });
  });

test('STO-04.4 A reload forgets the answer to the Upscale question [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startWith(page, testInfo);
  await goToStep(page, 'export', hand);
  const first = await tapDownload(page, hand);
  await check(`the question box asks "${UPSCALE_QUESTION}"`, async () => {
    expect(first.question).toBe(UPSCALE_QUESTION);
  });
  const upscaled = await answerForFile(page, hand, 'Yes', first.downloading);
  const upscaledImage = await readSavedImage(page, upscaled.file);
  await check('IMG_9136-straight.jpg is saved, 2000 × 2000 px', async () => {
    expect(upscaled.name).toBe('IMG_9136-straight.jpg');
    expect([upscaledImage.width, upscaledImage.height]).toEqual([UPSCALED_PX, UPSCALED_PX]);
  });
  await waitForSaved(page, { tab: 'export' });
  await reloadToStart(page);
  await check('the start screen offers Resume', async () => {
    await expect(page.locator('#btnResume')).toBeVisible();
  });
  await resumeAs(page, hand, PHOTO);
  await check('the photo opens on the Export step', async () => {
    expect(await stepShown(page)).toBe('export');
  });
  const second = await tapDownload(page, hand);
  await check(`the question box asks "${UPSCALE_QUESTION}" again: the Yes was not kept`,
    async () => {
      expect(second.question).toBe(UPSCALE_QUESTION);
    });
  const asIs = await answerForFile(page, hand, 'No', second.downloading);
  const asIsImage = await readSavedImage(page, asIs.file);
  await check('IMG_9136-straight.jpg is saved, 1400 × 1400 px', async () => {
    expect(asIs.name).toBe('IMG_9136-straight.jpg');
    expect([asIsImage.width, asIsImage.height]).toEqual([CROP_PX, CROP_PX]);
  });
});

/* ---------------- STO-05 Runs from a file, a local server or a subfolder ---------------- */

// Checks the rows STO-05.1, STO-05.2 and STO-05.3 share once the start screen is up: Open
// photo, Export, Download, and the answer to the Upscale question. Returns the saved file.
async function openAndDownload(page, hand, check, answer) {
  await openWith(page, hand, page.locator('#btnOpenEmpty'), PHOTO);
  await check('the photo opens on the Perspective step, with the corner outline on the card\'s '
    + 'edges', async () => {
    expect(await stepShown(page)).toBe('perspective');
    expect(await isOnFoundCard(page)).toBe(true);
  });
  await goToStep(page, 'export', hand);
  await check('the Export step shows, with Download', async () => {
    await expect(page.locator('#btnDownload')).toBeVisible();
  });
  const { question, downloading } = await tapDownload(page, hand);
  await check(`the question box asks "${UPSCALE_QUESTION}"`, async () => {
    expect(question).toBe(UPSCALE_QUESTION);
  });
  return answerForFile(page, hand, answer, downloading);
}

test('STO-05.1 The app works from a website\'s subfolder [phone]', async ({
  page,
  check,
}, testInfo) => {
  const failed = [];
  page.on('response', response => {
    if (response.status() >= 400) failed.push(`${response.status()} ${response.url()}`);
  });
  const requests = watchRequests(page);
  await openApp(page, SUBFOLDER_ADDRESS);
  await check('every file the page asked for came from the subfolder, and none failed',
    async () => {
      const served = requests.filter(address => /^https?:/.test(address));
      expect(served.length).toBeGreaterThan(0);
      const outside = served.filter(address => !address.includes('/p1hunt_card_finisher/'));
      expect(outside).toEqual([]);
      expect(failed).toEqual([]);
    });
  const hand = handFor(page, testInfo);
  const saved = await openAndDownload(page, hand, check, 'No');
  await check('IMG_9136-straight.jpg is saved', async () => {
    expect(saved.name).toBe('IMG_9136-straight.jpg');
  });
});

test('STO-05.2 The app works opened from disk [disk]', async ({ page, check }, testInfo) => {
  const requests = watchRequests(page);
  const messages = watchConsole(page);
  await openApp(page, pathToFileURL(path.join(root, 'index.html')).href);
  const hand = handFor(page, testInfo);
  const saved = await openAndDownload(page, hand, check, 'No');
  await check('IMG_9136-straight.jpg is saved', async () => {
    expect(saved.name).toBe('IMG_9136-straight.jpg');
  });
  await check('no error and no warning that the worker is unavailable; every address starts '
    + 'with file:, blob: or data:', async () => {
    expect(check.consoleErrors()).toEqual([]);
    expect(messages.filter(message => message.text.startsWith(WORKER_WARNING))).toEqual([]);
    expect(await page.evaluate(() => window.__straightener.EngineWorker.failed)).toBe(false);
    expect(requests.filter(address => !/^(file|blob|data):/.test(address))).toEqual([]);
  });
});

test('STO-05.3 Without a worker the engine runs on the page [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  await page.addInitScript(() => {
    window.Worker = function refuseWorker() {
      throw new Error('Stand-in: workers are blocked');
    };
  });
  const messages = watchConsole(page);
  await openApp(page);
  await check(`one warning reads "${WORKER_WARNING} Stand-in: workers are blocked"`, async () => {
    const warnings = messages.filter(message => message.text.startsWith(WORKER_WARNING));
    expect(warnings.map(message => message.text))
      .toEqual([`${WORKER_WARNING} Stand-in: workers are blocked`]);
  });
  const hand = handFor(page, testInfo);
  const saved = await openAndDownload(page, hand, check, 'Yes');
  const image = await readSavedImage(page, saved.file);
  await check('IMG_9136-straight.jpg is saved at 2000 × 2000 px: the sharpening ran on the page '
    + 'too', async () => {
    expect(saved.name).toBe('IMG_9136-straight.jpg');
    expect([image.width, image.height]).toEqual([UPSCALED_PX, UPSCALED_PX]);
  });
});

/* ---------------- STO-07 Page title, theme color and icons ---------------- */

// Whether the file at `address` (relative to the page) decodes as a picture in the page.
function isPicture(page, address) {
  return page.evaluate(async src => {
    const picture = new Image();
    picture.src = src;
    return picture.decode().then(() => picture.naturalWidth > 0, () => false);
  }, address);
}

test('STO-07.1 The tab reads P1Hunt Card Finisher and shows the app\'s icons [phone]', async ({
  page,
  check,
}) => {
  await openApp(page);
  await check(`the tab reads ${PAGE_TITLE}`, async () => {
    await expect(page).toHaveTitle(PAGE_TITLE);
  });
  await check(`the theme color is '${THEME_COLOR}', the app's dark gray`, async () => {
    const color = await page.evaluate(
      () => document.querySelector('meta[name="theme-color"]').content,
    );
    expect(color).toBe(THEME_COLOR);
  });
  const iconLinks = await page.locator('link[rel="icon"]')
    .evaluateAll(links => links.map(link => link.getAttribute('href').split('?')[0]));
  for (const file of ['icons/favicon.ico', 'icons/icon.svg']) {
    await check(`${file}, named in the page's head, shows the app's icon`, async () => {
      expect(iconLinks).toContain(file);
      expect(await isPicture(page, file)).toBe(true);
    });
  }
});

/* ---------------- STO-08 The home-screen icon ---------------- */

test('STO-08.2 The home-screen icon is a 180 px PNG [phone]', async ({ page, check }) => {
  await openApp(page);
  const icon = await page.evaluate(async () => {
    const link = document.querySelector('link[rel="apple-touch-icon"]');
    const response = await fetch(link.href);
    const blob = await response.blob();
    const bitmap = await createImageBitmap(blob);
    return {
      file: link.getAttribute('href').split('?')[0],
      type: blob.type,
      width: bitmap.width,
      height: bitmap.height,
    };
  });
  await check('icons/apple-touch-icon.png shows: a PNG of 180 × 180 px', async () => {
    expect(icon).toEqual({
      file: 'icons/apple-touch-icon.png',
      type: 'image/png',
      width: TOUCH_ICON_PX,
      height: TOUCH_ICON_PX,
    });
  });
});

/* ---------------- STO-09 The image engine really runs in its worker ---------------- */

// The calls the page has handed its worker so far, by type (see the test's init script).
const workerCalls = page => page.evaluate(() => window.testWorkerCalls.slice());

test('STO-09.1 Detection and sharpening run in the worker [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  await page.addInitScript(() => {
    window.testWorkerCalls = [];
    const post = Worker.prototype.postMessage;
    Worker.prototype.postMessage = function noteCall(message, ...rest) {
      if (message && message.type) window.testWorkerCalls.push(message.type);
      return post.call(this, message, ...rest);
    };
  });
  const messages = watchConsole(page);
  await openApp(page);
  const hand = handFor(page, testInfo);
  await openWith(page, hand, page.locator('#btnOpenEmpty'), PHOTO);
  await check('the photo opens with the corner outline on the card\'s edges; the worker was '
    + 'handed the detection', async () => {
    expect(await isOnFoundCard(page)).toBe(true);
    expect(await workerCalls(page)).toContain('detect');
  });
  await goToStep(page, 'export', hand);
  await check('the Export step shows, with Download', async () => {
    await expect(page.locator('#btnDownload')).toBeVisible();
  });
  const { question, downloading } = await tapDownload(page, hand);
  await check(`the question box asks "${UPSCALE_QUESTION}"`, async () => {
    expect(question).toBe(UPSCALE_QUESTION);
  });
  const callsBefore = (await workerCalls(page)).length;
  const saved = await answerForFile(page, hand, 'Yes', downloading);
  await check('IMG_9136-straight.jpg is saved; the worker was handed the sharpening', async () => {
    expect(saved.name).toBe('IMG_9136-straight.jpg');
    expect((await workerCalls(page)).slice(callsBefore)).toContain('sharpen');
  });
  await check('no warning that the worker is unavailable', async () => {
    expect(await page.evaluate(() => window.__straightener.EngineWorker.failed)).toBe(false);
    expect(messages.filter(message => message.text.startsWith(WORKER_WARNING))).toEqual([]);
  });
});
