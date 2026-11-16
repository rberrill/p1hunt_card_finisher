// The storage and settings cases (tests/catalog/storage-and-settings.md): the remembered
// preferences, what the session keeps on the device, the saved logo, what a reload forgets,
// the app opened from a subfolder, from disk and without its worker, the page's title and
// icons, and the image engine running in its worker.
// Each test drives the app as a person would, through hand.tap and hand.drag (a finger on the
// phone targets, the mouse on the wide ones), and reads the app's state only to check a result.
// STO-06 is proven by node tests/selftest.js and STO-08.1 needs a real iPhone, so they have no
// test here.
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { test, expect } = require('./support/case.js');
const {
  root,
  openApp,
  openPhoto,
  goToStep,
  editState,
  handFor,
  openOptions,
  closeOptions,
  saveByDownload,
  readSavedImage,
} = require('./support/app.js');
const {
  pickWith,
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
  watchConsole,
  watchRequests,
  storedPrefs,
  refusePrefsStorage,
} = require('./support/security-layout-speed.js');

// The size an upscaled export of the case photo has: the default Size, in px.
const UPSCALED_PX = 2000;
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
// How long the app waits after a change before saving it, plus a margin, in ms.
const SAVED_AFTER_MS = 1000;
// The gap between two fingers before and after a pinch that zooms in, in CSS px.
const PINCH_FROM_PX = 60;
const PINCH_TO_PX = 180;

// Opens the photo picker with Open (the start screen's button or the top bar's) and opens a
// sample photo with it.
async function openWithButton(page, hand, name) {
  const isStartShown = await page.locator('#btnOpenEmpty').isVisible();
  const control = page.locator(isStartShown ? '#btnOpenEmpty' : '#btnOpen');
  await pickWith(page, hand, control, name);
  await page.waitForFunction(photoName => {
    const app = window.__straightener.app;
    const isOpen = !!app.state && app.state.source.name === photoName && !!app.geometry;
    return isOpen && app.detection.running > 0 && app.detection.message === '';
  }, name);
}

// On the Crop step, opens Crop options and taps Reset crop.
async function resetCrop(page, hand) {
  await openOptions(page, hand, 'crop');
  await hand.tap(page.locator('#cropResetRow'));
}

// The photo's view on screen: true when it is zoomed or panned away from its fitted view.
function isZoomed(page) {
  return page.evaluate(() => window.CF.currentView().auto === false);
}

// The pressed state of a tool (a mode or a switch), as the screen marks it.
function isPressed(page, selector) {
  return page.locator(selector).evaluate(el => el.getAttribute('aria-pressed') === 'true');
}

/* ---------------- STO-01 Preferences are remembered ---------------- */

test('STO-01.1 Undoing a Format change also changes the remembered Format [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startWith(page, testInfo);
  await goToStep(page, 'export', hand);
  await hand.tap(choiceButton(page, 'exportFormat', 'PNG'));
  await check('PNG is selected and remembered', async () => {
    expect(await selectedChoices(page, 'exportFormat')).toEqual(['PNG']);
    expect((await storedPrefs(page)).export.format).toBe('png');
  });
  await hand.tap(page.locator('#btnUndo'));
  await check('after Undo, JPEG is selected', async () => {
    expect(await selectedChoices(page, 'exportFormat')).toEqual(['JPEG']);
  });
  await openWithButton(page, hand, SECOND_PHOTO);
  await goToStep(page, 'export', hand);
  await check('the next photo, IMG_9075.JPEG, starts with JPEG', async () => {
    expect(await selectedChoices(page, 'exportFormat')).toEqual(['JPEG']);
  });
});

test('STO-01.2 Reset crop leaves the remembered preset for after a reload [phone] [webkit]',
  async ({ page, check }, testInfo) => {
    test.fail(true, 'BUG-100');
    const hand = await startWith(page, testInfo);
    await goToStep(page, 'crop', hand);
    await hand.tap(presetChip(page, '4:5'));
    await resetCrop(page, hand);
    await page.waitForTimeout(SAVED_AFTER_MS);
    await reloadToStart(page);
    await hand.tap(page.locator('#btnFresh'));
    await openWithButton(page, hand, SECOND_PHOTO);
    await goToStep(page, 'crop', hand);
    const chips = await selectedChips(page);
    await check('IMG_9075.JPEG opens with 4:5 selected', async () => {
      expect(chips).toEqual(['4:5']);
    });
  });

test('STO-01.3 When preferences can\'t be saved, the app carries on without a message [phone]',
  async ({ page, check }, testInfo) => {
    await refusePrefsStorage(page);
    const hand = await startWith(page, testInfo);
    await goToStep(page, 'export', hand);
    await hand.tap(choiceButton(page, 'exportFormat', 'PNG'));
    await check('PNG is selected, and no message shows', async () => {
      expect(await selectedChoices(page, 'exportFormat')).toEqual(['PNG']);
      expect((await toastNow(page)).isShown).toBe(false);
    });
    const saved = await saveByDownload(page, hand, 'No');
    await check('Download saves IMG_9136-straight.png, with no error in the console', async () => {
      expect(saved.name).toBe('IMG_9136-straight.png');
      expect(check.consoleErrors()).toEqual([]);
    });
  });

/* ---------------- STO-02 The session is kept on the device ---------------- */

test('STO-02.1 A pair with a logo keeps all six records on the device [phone] [webkit]',
  async ({ page, check }, testInfo) => {
    const hand = await makePair(page, testInfo);
    await goToStep(page, 'overlay', hand);
    const id = await addLogo(page, hand, page.locator('#btnOverlayAdd'), 'icon.svg');
    await waitForSaved(page, { overlayId: id });
    const keys = ['photo', 'edits', 'photoOverlay', 'overlay', 'pair', 'pairPhoto'];
    await waitUntil(page, async names => {
      const Session = window.__straightener.Session;
      const records = await Promise.all(names.map(name => Session.get(name)));
      return records.every(Boolean);
    }, keys, SAVED_AFTER_MS * 5, 'all six records');
    await check('the device holds the photo, its edits, its logo, the saved logo, the pair and '
      + 'the other photo', async () => {
      const stored = {};
      for (const key of keys) stored[key] = !!(await storedRecord(page, key));
      expect(stored).toEqual(Object.fromEntries(keys.map(key => [key, true])));
    });
    await check('the stored edits are the back\'s, with its logo', async () => {
      const edits = await storedRecord(page, 'edits');
      expect(edits.name).toBe('14_back_portrait_raw_white.JPEG');
      expect(edits.state.overlay).not.toBeNull();
    });
  });

test('STO-02.2 Remove leaves this photo\'s logo stored [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startWith(page, testInfo);
  await goToStep(page, 'overlay', hand);
  const id = await addLogo(page, hand, page.locator('#btnOverlayAdd'), 'icon.svg');
  await hand.tap(page.locator('#toolOverlayRemove'));
  await waitForSaved(page, { overlayId: null });
  await check('the logo is gone from the photo and its edits', async () => {
    expect((await editState(page)).overlay).toBeNull();
  });
  await check('this photo\'s logo is still stored on the device', async () => {
    const record = await storedRecord(page, 'photoOverlay');
    expect(record && record.id).toBe(id);
  });
});

/* ---------------- STO-03 The saved logo outlives a reload and Start fresh ---------------- */

test('STO-03.1 The saved logo comes back after Start fresh, at the size it was last used '
  + '[phone] [webkit]', async ({ page, check }, testInfo) => {
  const hand = await startWith(page, testInfo);
  await goToStep(page, 'overlay', hand);
  await addLogo(page, hand, page.locator('#btnOverlayAdd'), 'icon.svg');
  await hand.tap(page.locator(LARGER));
  await page.waitForTimeout(SAVED_AFTER_MS);
  await reloadToStart(page);
  await hand.tap(page.locator('#btnFresh'));
  await openWithButton(page, hand, SECOND_PHOTO);
  await goToStep(page, 'overlay', hand);
  await check('no logo is placed; Use saved overlay is offered', async () => {
    expect((await editState(page)).overlay).toBeNull();
    await expect(page.locator('#btnUseSaved')).toBeVisible();
  });
  await hand.tap(page.locator('#btnUseSaved'));
  await page.waitForFunction(() => !!window.__straightener.app.state.overlay);
  await check('Use saved overlay places the logo one Larger step wider than a new one',
    async () => {
      const overlay = (await editState(page)).overlay;
      expect(overlay.w).toBeCloseTo(LOGO_START_WIDTH * SIZE_STEP, 4);
    });
});

/* ---------------- STO-04 What a reload forgets ---------------- */

test('STO-04.1 A reload forgets Grid, Debug overlay, the modes, the zoom and the undo history '
  + '[phone]', async ({ page, check }, testInfo) => {
  const hand = await startWith(page, testInfo);
  await openOptions(page, hand, 'perspective');
  await hand.tap(page.locator('#perspectiveSheet label:has(#debugOverlay)'));
  await closeOptions(page, hand, 'perspective');
  await hand.tap(page.locator('#toolFlatten'));
  await goToStep(page, 'rotate', hand);
  await hand.tap(page.locator('#toolRotateRight'));
  await openOptions(page, hand, 'rotate');
  await hand.tap(page.locator('#rotateSheet label:has(#rotateGrid)'));
  await closeOptions(page, hand, 'rotate');
  await hand.tap(page.locator('#toolFlip'));
  const view = await page.locator('#view').boundingBox();
  await pinchAt(page, { x: view.x + view.width / 2, y: view.y + view.height / 2 },
    PINCH_FROM_PX, PINCH_TO_PX);
  await check('before the reload: Debug overlay on, Grid off, Flip and Flatten chosen, the '
    + 'photo zoomed, Undo lit', async () => {
    expect(await page.locator('#debugOverlay').isChecked()).toBe(true);
    expect(await page.locator('#rotateGrid').isChecked()).toBe(false);
    expect(await isPressed(page, '#toolFlip')).toBe(true);
    expect(await isPressed(page, '#toolFlatten')).toBe(true);
    expect(await isZoomed(page)).toBe(true);
    await expect(page.locator('#btnUndo')).toBeEnabled();
  });
  await waitForSaved(page, { quarter: 1, tab: 'rotate' });
  await reloadToStart(page);
  await resumeAs(page, hand, PHOTO);
  await check('after Resume: the photo turned, fitted to the screen, Undo greyed out, Flip '
    + 'not chosen', async () => {
    expect((await editState(page)).rotation.quarter).toBe(1);
    expect(await isZoomed(page)).toBe(false);
    await expect(page.locator('#btnUndo')).toBeDisabled();
    expect(await isPressed(page, '#toolFlip')).toBe(false);
  });
  await check('Grid is on again and Debug overlay off', async () => {
    expect(await page.locator('#rotateGrid').isChecked()).toBe(true);
    expect(await page.locator('#debugOverlay').isChecked()).toBe(false);
  });
  await goToStep(page, 'perspective', hand);
  await check('on Perspective, Nudge is chosen, not Flatten', async () => {
    expect(await isPressed(page, '#toolNudge')).toBe(true);
    expect(await isPressed(page, '#toolFlatten')).toBe(false);
  });
});

test('STO-04.2 Grid and Debug overlay carry over to a new photo in the same visit [phone]',
  async ({ page, check }, testInfo) => {
    const hand = await startWith(page, testInfo);
    await openOptions(page, hand, 'perspective');
    await hand.tap(page.locator('#perspectiveSheet label:has(#debugOverlay)'));
    await closeOptions(page, hand, 'perspective');
    await goToStep(page, 'rotate', hand);
    await openOptions(page, hand, 'rotate');
    await hand.tap(page.locator('#rotateSheet label:has(#rotateGrid)'));
    await closeOptions(page, hand, 'rotate');
    await openWithButton(page, hand, SECOND_PHOTO);
    await check('the new photo opens with Debug overlay still on and Grid still off', async () => {
      expect(await page.locator('#debugOverlay').isChecked()).toBe(true);
      expect(await page.locator('#rotateGrid').isChecked()).toBe(false);
    });
  });

/* ---------------- STO-05 Runs from a file, a local server or a subfolder ---------------- */

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
  await openPhoto(page, PHOTO);
  const hand = handFor(page, testInfo);
  await goToStep(page, 'export', hand);
  const saved = await saveByDownload(page, hand, 'No');
  await check('every file the page asked for came from the subfolder, and none was missing',
    async () => {
      const outside = requests.filter(address => /^https?:/.test(address)
        && !address.includes('/p1hunt_card_finisher/'));
      expect(outside).toEqual([]);
      expect(failed).toEqual([]);
    });
  await check('a photo opens, its corners are found and it saves as IMG_9136-straight.jpg',
    async () => {
      expect((await editState(page)).corners).toHaveLength(4);
      expect(saved.name).toBe('IMG_9136-straight.jpg');
    });
});

test('STO-05.2 The app works opened from disk [disk]', async ({ page, check }, testInfo) => {
  const requests = watchRequests(page);
  await openApp(page, pathToFileURL(path.join(root, 'index.html')).href);
  await openPhoto(page, PHOTO);
  const hand = handFor(page, testInfo);
  await goToStep(page, 'export', hand);
  const saved = await saveByDownload(page, hand, 'No');
  await check('a photo opens, its corners are found and it saves as IMG_9136-straight.jpg',
    async () => {
      expect((await editState(page)).corners).toHaveLength(4);
      expect(saved.name).toBe('IMG_9136-straight.jpg');
    });
  await check('the engine ran in its worker, and nothing came from a server', async () => {
    const worker = await page.evaluate(() => ({
      isStarted: !!window.__straightener.EngineWorker.worker,
      hasFailed: window.__straightener.EngineWorker.failed,
    }));
    expect(worker).toEqual({ isStarted: true, hasFailed: false });
    expect(requests.filter(address => !/^(file|blob|data):/.test(address))).toEqual([]);
  });
  await check('no console error', async () => {
    expect(check.consoleErrors()).toEqual([]);
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
  const hand = await startWith(page, testInfo);
  await check(`the console warns "${WORKER_WARNING} Stand-in: workers are blocked"`, async () => {
    const warnings = messages.filter(message => message.text.startsWith(WORKER_WARNING));
    expect(warnings.map(message => message.text))
      .toEqual([`${WORKER_WARNING} Stand-in: workers are blocked`]);
  });
  await check('the card\'s corners are found all the same', async () => {
    const candidates = await page.evaluate(() => window.__straightener.app.detection.candidates);
    expect(candidates.length).toBeGreaterThan(0);
  });
  await goToStep(page, 'export', hand);
  const saved = await saveByDownload(page, hand, 'Yes');
  const image = await readSavedImage(page, saved.file);
  await check('Download, answered Yes, saves IMG_9136-straight.jpg upscaled to 2000 × 2000 px',
    async () => {
      expect(saved.name).toBe('IMG_9136-straight.jpg');
      expect([image.width, image.height]).toEqual([UPSCALED_PX, UPSCALED_PX]);
    });
});

/* ---------------- STO-07 Page title, theme color and icons ---------------- */

test('STO-07.1 The tab reads P1Hunt Card Finisher and shows the app\'s icons [phone]', async ({
  page,
  check,
}) => {
  await openApp(page);
  await check(`the page's title is ${PAGE_TITLE} and the browser's color ${THEME_COLOR}`,
    async () => {
      await expect(page).toHaveTitle(PAGE_TITLE);
      const color = await page.locator('meta[name="theme-color"]').getAttribute('content');
      expect(color).toBe(THEME_COLOR);
    });
  await check('the favicon and the SVG icon both load as pictures', async () => {
    const icons = await page.evaluate(async () => {
      const links = [...document.querySelectorAll('link[rel="icon"]')];
      return Promise.all(links.map(async link => {
        const picture = new Image();
        picture.src = link.href;
        const isPicture = await picture.decode().then(() => picture.naturalWidth > 0, () => false);
        return { file: link.getAttribute('href').split('?')[0], isPicture };
      }));
    });
    expect(icons).toEqual([
      { file: 'icons/favicon.ico', isPicture: true },
      { file: 'icons/icon.svg', isPicture: true },
    ]);
  });
});

/* ---------------- STO-08 The home-screen icon ---------------- */

test('STO-08.2 The home-screen icon is a 180 px PNG [phone]', async ({ page, check }) => {
  await openApp(page);
  const icon = await page.evaluate(async () => {
    const link = document.querySelector('link[rel="apple-touch-icon"]');
    const response = await fetch(link.href);
    const blob = await response.blob();
    const bitmap = await createImageBitmap(blob);
    return { type: blob.type, width: bitmap.width, height: bitmap.height };
  });
  await check('the page names icons/apple-touch-icon.png, a PNG of 180 × 180 px', async () => {
    expect(icon).toEqual({ type: 'image/png', width: TOUCH_ICON_PX, height: TOUCH_ICON_PX });
  });
});

/* ---------------- STO-09 The image engine really runs in its worker ---------------- */

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
  const hand = await startWith(page, testInfo);
  await goToStep(page, 'export', hand);
  await saveByDownload(page, hand, 'Yes');
  const calls = await page.evaluate(() => window.testWorkerCalls);
  await check('the worker started and was handed the detection and the sharpening', async () => {
    expect(calls).toContain('detect');
    expect(calls).toContain('sharpen');
  });
  await check('the app has not fallen back to the page', async () => {
    expect(await page.evaluate(() => window.__straightener.EngineWorker.failed)).toBe(false);
    expect(messages.filter(message => message.text.startsWith(WORKER_WARNING))).toEqual([]);
  });
});
