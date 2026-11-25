// The start screen and session cases (tests/catalog/start-and-session.md): the start screen,
// opening a photo, Resume and Start fresh, and how the open photo and its edits are kept on the
// device. Each test drives the app as a person would, through hand.tap and hand.drag (a finger
// on the phone targets, the mouse on the wide ones), and reads the app's state only to check a
// result. Every test starts in a fresh browser context, so nothing is saved on the device until
// the test saves it; a reload keeps what the test saved.
'use strict';
const fs = require('fs');
const { test, expect } = require('./support/case.js');
const {
  openApp,
  goToStep,
  editState,
  handFor,
  middleOf,
  samplePath,
  cornerOnPage,
  openOptions,
  closeOptions,
  readSavedImage,
  stepNow,
  backgroundOf,
} = require('./support/app.js');
const {
  pickWith,
  rememberPhoto,
  waitForPhoto,
  waitForSaved,
  waitForStart,
  reloadToStart,
  resumeAs,
  addBack,
  addLogo,
  toastNow,
  storedRecord,
  changeSavedEdits,
  deleteSavedEdits,
  watchStorageAndDownloads,
  writesWithLastDownload,
  storageWritesSince,
  refuseStorage,
  refuseStorageNow,
  lastClickMs,
  notAPhoto,
  heicStandIn,
  sourceLine,
  copyLongSides,
  previewCells,
  sampleWithOrientation,
  enlargedSample,
  slowDecodeOf,
  pageNowMs,
} = require('./support/start-and-session.js');
const { holdNextSearch } = require('./support/perspective.js');

const PHOTO = 'IMG_9136.JPEG';
const SECOND_PHOTO = 'IMG_9075.JPEG';
// P1Hunt red (#e5322d), the color of the one main button on a screen.
const P1HUNT_RED = 'rgb(229, 50, 45)';
const STEP_NAMES = ['perspective', 'rotate', 'crop', 'levels', 'overlay', 'export'];
const FRONT = '14_front_portrait_raw_white.JPEG';
const BACK = '14_back_portrait_raw_white.JPEG';
// A photo name longer than the card shows (70 characters); the card cuts it to 60.
const LONG_NAME = 'A-card-photo-whose-name-is-much-longer-than-the-resume-card-shows.JPEG';
const NAME_SHOWN_MAX = 60;
// How long the script watches the start screen to see whether it resumes by itself.
const NO_AUTO_RESUME_WAIT_MS = 2000;
// Times in ms, for setting the page's clock ahead.
const MINUTE_MS = 60000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
// How far past a whole number of minutes the clock is set, so it doesn't sit on a rounding edge.
const CLOCK_MARGIN_MS = 10000;
// How many Tab presses may pass before the Resume button has the focus.
const TAB_PRESSES_MAX = 20;
// IMG_9136.JPEG's size in px, as it decodes.
const PHOTO_WIDTH = 1498;
const PHOTO_HEIGHT = 2098;
// The app's wait before saving a change, in ms (CONFIG.session.saveDelayMs), and the longer one
// a link sets in STA-14.2.
const SAVE_DELAY_MS = 100;
const LONG_SAVE_DELAY_MS = 1500;
// How much earlier than its delay a timer may seem to fire, in ms (the clock's rounding), and
// how much later a save may land after it (the timer, then opening the database).
const TIMER_EARLY_MS = 2;
const SAVE_LATE_MS = 150;
// How long the cases wait for a save to land, past its delay, and for the page to go quiet
// after opening a photo or a step (no save waiting), in ms.
const SETTLE_AFTER_SAVE_MS = 700;
const QUIET_MS = 700;
// Two quick clicks: the shortest and longest gap between them, in ms. Inside the save delay,
// so the first click's save is still waiting when the second comes, and long enough to tell a
// save 0.1 s after the second click from one 0.1 s after the first. QUICK_CLICK_HOLD_MS is how
// long the button is held down, and the pause between the two clicks; with the browser's own
// time the gap measures about 30 ms in Chromium and 45 ms in WebKit.
const QUICK_TAP_GAP_MIN_MS = 20;
const QUICK_TAP_GAP_MS = 90;
const QUICK_CLICK_HOLD_MS = 10;
// A save made at once lands within this many ms.
const QUICK_SAVE_MS = 100;
// The longest a change may wait before it is saved, in ms (ruling R36: about 0.1 s, so a
// change is saved before a person could close the tab).
const SOON_SAVE_MS = 200;
// How close the saved time must be to the clock when the record is read, in ms.
const SAVED_AT_TOLERANCE_MS = 5000;
// How far a corner handle is dragged, in CSS px each way.
const CORNER_DRAG_PX = 40;
// The logos: the app's own icons (icons/).
const LOGO = 'icon.svg';
const OTHER_LOGO = 'apple-touch-icon.png';
// The grid laid over a saved image to compare two of them: cells per side.
const COMPARE_GRID = 16;
// The messages for a file the browser can't open (js/app/adapters.js, ImageSource.load).
const NOT_AN_IMAGE_MESSAGE = 'Couldn’t read that file as an image.';
const HEIC_MESSAGE = 'This browser can’t open HEIC. Save the photo as JPEG first '
  + '(Safari opens HEIC directly).';
// The approved wording (tests/catalog/wording.md) for a resume whose saved size doesn't match
// (ruling R23) and for a resume that fails (ruling R24).
const SIZE_MISMATCH_MESSAGE = 'Full edit history could not be restored, your photo has been '
  + 'opened fresh.';
const RESUME_FAILED_MESSAGE = 'Couldn’t resume.';
// The Upscale question a sample photo's export at 2000 px asks.
const UPSCALE_TITLE = 'Upscale to 2000 px?';
// The EXIF orientation that says the picture is shown turned a quarter clockwise.
const ORIENTATION_QUARTER_CLOCKWISE = 6;
const SIDEWAYS_PHOTO = 'IMG_9136-sideways.JPEG';
// The grid laid over the photo on screen to compare two decodings: cells per side. Coarse, so
// the two copies' different scaling to the screen size averages out.
const ORIENTATION_GRID = 8;
// The mean difference (0 to 255) below which two decodings show the same picture; measured at
// 0.0 for the right turn and about 38 for the wrong one, in Chromium and WebKit.
const SAME_PICTURE_MAX = 4;
// IMG_9136.JPEG enlarged to about 48 MP (5842 × 8182 px), as a 48 MP iPhone photo is.
const BIG_PHOTO = 'IMG_9136-48MP.JPEG';
const BIG_PHOTO_FACTOR = 3.9;
const BIG_PHOTO_WIDTH = 5842;
const BIG_PHOTO_HEIGHT = 8182;
// The long sides of the copies the app works from, in px (CONFIG.previewMaxPx,
// CONFIG.thumbMaxPx and CONFIG.detect.workingSize).
const PREVIEW_COPY_PX = 2048;
const LIVE_COPY_PX = 720;
const DETECTION_COPY_PX = 1000;
// The export's long side with nothing remembered, in px (CONFIG.export.longEdge).
const EXPORT_LONG_EDGE_PX = 2000;
// How long STA-23.1 holds back the first photo's loading, in ms, and then watches that the
// photo opened last stays open: longer, so the first photo's load has ended by then.
const SLOW_LOAD_MS = 2000;
const STILL_OPEN_WAIT_MS = 3000;
// Where a pan of the photo starts, in from the photo area's top-left corner, and how far it
// goes each way, in CSS px: away from every handle.
const PAN_INSET_PX = 40;
const PAN_DRAG_PX = 60;
// How many card outlines detection finds in IMG_9136.JPEG and in IMG_9075.JPEG (measured in
// Chromium at phone size).
const FIRST_PHOTO_OUTLINES = 3;
const SECOND_PHOTO_OUTLINES = 3;

// Opens the app on the start screen and waits until it has decided whether to offer Resume.
// Returns the hand for this target.
async function startOnStartScreen(page, testInfo) {
  await openApp(page);
  await waitForStart(page);
  return handFor(page, testInfo);
}

// Opens the app and opens `photo` with Open photo on the start screen. Returns the hand.
async function startWithPhoto(page, testInfo, photo = PHOTO) {
  const hand = await startOnStartScreen(page, testInfo);
  await pickWith(page, hand, page.locator('#btnOpenEmpty'), photo);
  await waitForPhoto(page, photo);
  return hand;
}

// The Levels tab's white dot, which marks a Levels change waiting to be applied.
function levelsMark(page) {
  return page.locator('[data-step="levels"]:visible .step-tab-mark');
}

test('STA-01.1 The start screen shows until a photo opens [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnStartScreen(page, testInfo);
  const start = page.locator('#empty');
  await check('the app icon, P1HUNT CARD FINISHER, Finish a card photo, the two lines and the '
    + 'red Open photo button', async () => {
    await expect(start.locator('.start-icon')).toBeVisible();
    await expect(start.locator('.start-eyebrow')).toHaveText('P1Hunt Card Finisher');
    await expect(start.locator('h1')).toHaveText('Finish a card photo');
    await expect(start.locator('.start-text')).toContainText('Open, drop, or paste a photo.');
    await expect(start.locator('.start-text')).toContainText('Everything stays on this device.');
    const open = page.locator('#btnOpenEmpty');
    await expect(open).toBeVisible();
    await expect(open).toHaveText('Open photo');
    expect(await backgroundOf(open)).toBe(P1HUNT_RED);
  });
  await pickWith(page, hand, page.locator('#btnOpenEmpty'), PHOTO);
  await waitForPhoto(page, PHOTO);
  await check('the photo opens and the start screen has gone', async () => {
    await expect(start).toBeHidden();
    await expect(page.locator('#view')).toBeVisible();
  });
});

test('STA-02.1 Open photo asks for one image and opens it [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnStartScreen(page, testInfo);
  const chooser = await pickWith(page, hand, page.locator('#btnOpenEmpty'), PHOTO);
  await check('the file picker opens for one file, offering images and HEIC photos', async () => {
    expect(chooser.isMultiple()).toBe(false);
    const accepted = (await page.locator('#fileInput').getAttribute('accept')).split(',');
    expect(accepted).toEqual(expect.arrayContaining(['image/*', '.heic', '.heif']));
  });
  await waitForPhoto(page, PHOTO);
  await check('the photo opens on Perspective, with its corner handles on the card', async () => {
    expect(await stepNow(page)).toBe('perspective');
    const found = await page.evaluate(() => {
      const app = window.__straightener.app;
      const best = app.detection.candidates[0];
      return { corners: app.state.corners, best: best ? best.corners : null };
    });
    expect(found.best).not.toBeNull();
    expect(found.corners).toEqual(found.best);
  });
});

test('STA-02.2 The same photo can be chosen twice in a row [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startWithPhoto(page, testInfo);
  await goToStep(page, 'rotate', hand);
  await hand.tap(page.locator('#toolRotateRight'));
  await check('the photo lies on its side and Undo is on', async () => {
    expect((await editState(page)).rotation.quarter).toBe(1);
    await expect(page.locator('#btnUndo')).toBeEnabled();
  });
  await pickWith(page, hand, page.locator('#btnOpen'), PHOTO);
  await waitForPhoto(page, PHOTO);
  await check('the same photo opens again from the start: upright, on Perspective, Undo off',
    async () => {
      expect((await editState(page)).rotation.quarter).toBe(0);
      expect(await stepNow(page)).toBe('perspective');
      await expect(page.locator('#btnUndo')).toBeDisabled();
    });
});

test('STA-03.1 On a phone, nothing but the start screen shows [phone]', async ({
  page,
  check,
}, testInfo) => {
  await startOnStartScreen(page, testInfo);
  await check('no top bar: no Open, Undo or Redo', async () => {
    await expect(page.locator('#topBarHost')).toBeHidden();
    await expect(page.locator('#btnOpen')).toBeHidden();
    await expect(page.locator('#btnUndo')).toBeHidden();
    await expect(page.locator('#btnRedo')).toBeHidden();
  });
  await check('no controls and no step bar: only the start screen', async () => {
    await expect(page.locator('#panel')).toBeHidden();
    await expect(page.locator('#tabBarHost')).toBeHidden();
    await expect(page.locator('#empty')).toBeVisible();
  });
});

test('STA-03.2 On a wide screen, the steps and Fit are greyed out [desktop]', async ({
  page,
  check,
}, testInfo) => {
  await startOnStartScreen(page, testInfo);
  const visibleSections = () => page.locator('section[data-panel]:visible').count();
  await check('the top bar shows Open and six greyed-out steps; Fit, Undo and Redo are greyed '
    + 'out', async () => {
    await expect(page.locator('#btnOpen')).toBeEnabled();
    for (const step of STEP_NAMES) {
      const tab = page.locator(`#topBarHost [data-step="${step}"]`);
      await expect(tab).toBeVisible();
      await expect(tab).toBeDisabled();
    }
    await expect(page.locator('#btnFit')).toBeVisible();
    await expect(page.locator('#btnFit')).toBeDisabled();
    await expect(page.locator('#btnUndo')).toBeDisabled();
    await expect(page.locator('#btnRedo')).toBeDisabled();
  });
  await check('no step\'s controls are in the panel', async () => {
    expect(await visibleSections()).toBe(0);
  });
  // The step is greyed out, so the click goes to the place where it is, as a person's would.
  const rotate = await middleOf(page.locator('#topBarHost [data-step="rotate"]'));
  await page.mouse.click(rotate.x, rotate.y);
  await check('clicking Rotate does nothing: the start screen stays, the panel empty', async () => {
    await expect(page.locator('#empty')).toBeVisible();
    expect(await stepNow(page)).toBe('perspective');
    expect(await visibleSections()).toBe(0);
  });
});

test('STA-03.3 The backtick key opens the tuning panel with no photo open [desktop]', async ({
  page,
  check,
}, testInfo) => {
  await startOnStartScreen(page, testInfo);
  await page.keyboard.press('Backquote');
  await check('the detection tuning panel opens at the right, over the empty side panel; the '
    + 'start screen still shows, and no part of the panel is over Open photo', async () => {
    await expect(page.locator('#debugPanel')).toBeVisible();
    await expect(page.locator('#empty')).toBeVisible();
    const panel = await page.locator('#debugPanel').boundingBox();
    const open = await page.locator('#btnOpenEmpty').boundingBox();
    const side = await page.locator('#panel').boundingBox();
    const isApartSideways = panel.x + panel.width <= open.x || open.x + open.width <= panel.x;
    const isApartUpDown = panel.y + panel.height <= open.y || open.y + open.height <= panel.y;
    expect(isApartSideways || isApartUpDown).toBe(true);
    expect(panel.x).toBeGreaterThanOrEqual(side.x);
    expect(panel.x + panel.width).toBeLessThanOrEqual(side.x + side.width);
  });
  await page.keyboard.press('Backquote');
  await check('the backtick again closes it; the start screen is as it was', async () => {
    await expect(page.locator('#debugPanel')).toBeHidden();
    await expect(page.locator('#empty')).toBeVisible();
  });
});

// Opens `photo` with Open photo, waits until it is saved, and reloads to the start screen,
// which then offers to resume it. Returns the hand.
async function startWithSavedPhoto(page, testInfo, photo = PHOTO) {
  const hand = await startWithPhoto(page, testInfo, photo);
  await waitForSaved(page, { name: photo });
  await reloadToStart(page);
  return hand;
}

// The id of the element with the keyboard focus.
function focusedId(page) {
  return page.evaluate(() => document.activeElement && document.activeElement.id);
}

// True when a photo is open.
function hasPhoto(page) {
  return page.evaluate(() => !!window.__straightener.app.img);
}

test('STA-04.1 After a reload the card offers Resume and never resumes by itself [phone] '
  + '[webkit]', async ({ page, check }, testInfo) => {
  const hand = await startOnStartScreen(page, testInfo);
  await check('no card above Open photo: nothing is offered to resume', async () => {
    await expect(page.locator('#resume')).toBeHidden();
    await expect(page.locator('#btnOpenEmpty')).toBeVisible();
  });
  await pickWith(page, hand, page.locator('#btnOpenEmpty'), PHOTO);
  await waitForPhoto(page, PHOTO);
  await check('the photo opens', async () => {
    await expect(page.locator('#empty')).toBeHidden();
  });
  await waitForSaved(page, { name: PHOTO });
  await reloadToStart(page);
  await check('after a reload the card offers Resume and Start fresh; no photo is open',
    async () => {
      await expect(page.locator('#resume')).toBeVisible();
      await expect(page.locator('#btnResume')).toBeVisible();
      await expect(page.locator('#btnFresh')).toBeVisible();
      expect(await hasPhoto(page)).toBe(false);
    });
  await page.waitForTimeout(NO_AUTO_RESUME_WAIT_MS);
  await check('a while later the card is still there: the app did not resume by itself',
    async () => {
      await expect(page.locator('#resume')).toBeVisible();
      expect(await hasPhoto(page)).toBe(false);
    });
});

test('STA-04.2 The card goes when a photo is opened another way [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startWithSavedPhoto(page, testInfo);
  await pickWith(page, hand, page.locator('#btnOpenEmpty'), SECOND_PHOTO);
  await waitForPhoto(page, SECOND_PHOTO);
  await check('IMG_9075.JPEG opens and the card has gone', async () => {
    await expect(page.locator('#resume')).toBeHidden();
    await expect(page.locator('#empty')).toBeHidden();
  });
  await waitForSaved(page, { name: SECOND_PHOTO });
  await reloadToStart(page);
  await check('after a reload the card offers "Resume IMG_9075.JPEG?"', async () => {
    await expect(page.locator('#resume')).toBeVisible();
    await expect(page.locator('#resumeName')).toHaveText(SECOND_PHOTO);
  });
});

test('STA-04.3 The Tab key moves on out of the card [desktop] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  await startWithSavedPhoto(page, testInfo);
  for (let i = 0; i < TAB_PRESSES_MAX && await focusedId(page) !== 'btnResume'; i++) {
    await page.keyboard.press('Tab');
  }
  await check('Resume has the focus', async () => {
    expect(await focusedId(page)).toBe('btnResume');
  });
  await page.keyboard.press('Tab');
  await check('Tab moves it to Start fresh', async () => {
    expect(await focusedId(page)).toBe('btnFresh');
  });
  await page.keyboard.press('Tab');
  await check('the next Tab leaves the card: Open photo has the focus', async () => {
    expect(await focusedId(page)).toBe('btnOpenEmpty');
  });
});

test('STA-05.1 The card names the photo and when it was saved [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  await startWithSavedPhoto(page, testInfo);
  await check('the card reads LAST PHOTO · JUST NOW and "Resume IMG_9136.JPEG?"', async () => {
    await expect(page.locator('#resumeWhen')).toHaveText('Last photo · just now');
    await expect(page.locator('#resume .resume-name')).toHaveText(`Resume ${PHOTO}?`);
  });
  await check('the small picture is one drawn card outline, not the photo', async () => {
    const thumb = page.locator('#resumeThumb');
    await expect(thumb).toBeVisible();
    await expect(thumb).not.toHaveClass(/is-pair/);
    expect(await thumb.locator('img, canvas').count()).toBe(0);
  });
});

test('STA-05.2 A long name is cut short [phone]', async ({ page, check }, testInfo) => {
  const hand = await startOnStartScreen(page, testInfo);
  const renamed = {
    name: LONG_NAME,
    mimeType: 'image/jpeg',
    buffer: fs.readFileSync(samplePath(PHOTO)),
  };
  await pickWith(page, hand, page.locator('#btnOpenEmpty'), renamed);
  await waitForPhoto(page, LONG_NAME);
  await check('the renamed photo opens', async () => {
    await expect(page.locator('#empty')).toBeHidden();
  });
  await waitForSaved(page, { name: LONG_NAME });
  await reloadToStart(page);
  const shown = `${LONG_NAME.slice(0, NAME_SHOWN_MAX - 1)}…`;
  await check('the card shows the first 59 characters and an ellipsis, 60 in all', async () => {
    await expect(page.locator('#resumeName')).toHaveText(shown);
    expect(shown).toHaveLength(NAME_SHOWN_MAX);
  });
});

test('STA-05.3 A pair reads front + back, with two outlines [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startWithPhoto(page, testInfo, FRONT);
  await goToStep(page, 'export', hand);
  await check('the Export step shows Add back', async () => {
    await expect(page.locator('#btnAddBack')).toBeVisible();
  });
  await addBack(page, hand, BACK);
  await check('the back opens; Front and Back show in the top bar', async () => {
    await expect(page.locator('#sideSwitch')).toBeVisible();
  });
  await reloadToStart(page);
  await check('the card reads "Resume <front> + <back>?"', async () => {
    await expect(page.locator('#resume .resume-name')).toHaveText(`Resume ${FRONT} + ${BACK}?`);
  });
  await check('the small picture is two drawn card outlines, not the photos', async () => {
    const thumb = page.locator('#resumeThumb');
    await expect(thumb).toHaveClass(/is-pair/);
    expect(await thumb.locator('img, canvas').count()).toBe(0);
  });
});

test('STA-05.4 The card says how long ago the photo was saved [phone]', async ({
  page,
  check,
}, testInfo) => {
  await startWithSavedPhoto(page, testInfo);
  const { savedAt } = await storedRecord(page, 'edits');
  const when = page.locator('#resumeWhen');
  // The start screen saves nothing, so moving the page's clock there leaves the record's time
  // as it was saved. The page's clock stands in for the computer's.
  const fiveMinutesAhead = savedAt + 5 * MINUTE_MS + CLOCK_MARGIN_MS;
  await page.clock.setFixedTime(fiveMinutesAhead);
  await check('the clock shows 5 minutes past the real time; the card still reads LAST PHOTO · '
    + 'JUST NOW', async () => {
    expect(await page.evaluate(() => Date.now())).toBe(fiveMinutesAhead);
    await expect(when).toHaveText('Last photo · just now');
  });
  await reloadToStart(page);
  await check('after a reload it reads LAST PHOTO · 5 MIN AGO', async () => {
    await expect(when).toHaveText('Last photo · 5 min ago');
  });
  const threeHoursAhead = savedAt + 3 * HOUR_MS + CLOCK_MARGIN_MS;
  await page.clock.setFixedTime(threeHoursAhead);
  await check('the clock shows 3 hours past the real time', async () => {
    expect(await page.evaluate(() => Date.now())).toBe(threeHoursAhead);
  });
  await reloadToStart(page);
  await check('after a reload it reads LAST PHOTO · 3 H AGO', async () => {
    await expect(when).toHaveText('Last photo · 3 h ago');
  });
  const twoDaysAhead = savedAt + 2 * DAY_MS + CLOCK_MARGIN_MS;
  await page.clock.setFixedTime(twoDaysAhead);
  await check('the clock shows 2 days past the real time', async () => {
    expect(await page.evaluate(() => Date.now())).toBe(twoDaysAhead);
  });
  await reloadToStart(page);
  await check('after a reload it reads LAST PHOTO · 2 D AGO', async () => {
    await expect(when).toHaveText('Last photo · 2 d ago');
  });
});

test('STA-05.5 An unreadable saved time and name [phone]', async ({
  page,
  check,
}, testInfo) => {
  await startWithSavedPhoto(page, testInfo);
  // Script only: no control changes a saved record (whether the developer tools can is Q-07).
  await changeSavedEdits(page, 'savedAt', 'soon');
  await check('the saved edits hold the time "soon"', async () => {
    expect((await storedRecord(page, 'edits')).savedAt).toBe('soon');
  });
  await changeSavedEdits(page, 'name', 42);
  await check('the saved edits hold the name 42', async () => {
    expect((await storedRecord(page, 'edits')).name).toBe(42);
  });
  await reloadToStart(page);
  await check('the card has no LAST PHOTO line and reads "Resume your last photo?"', async () => {
    await expect(page.locator('#resume')).toBeVisible();
    await expect(page.locator('#resumeWhen')).toHaveText('');
    await expect(page.locator('#resume .resume-name')).toHaveText('Resume your last photo?');
  });
});

test('STA-06.1 Resume is the red button while the card shows [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnStartScreen(page, testInfo);
  const open = page.locator('#btnOpenEmpty');
  await check('Open photo is red', async () => {
    expect(await backgroundOf(open)).toBe(P1HUNT_RED);
  });
  await pickWith(page, hand, open, PHOTO);
  await waitForPhoto(page, PHOTO);
  await check('the photo opens', async () => {
    await expect(page.locator('#empty')).toBeHidden();
  });
  await waitForSaved(page, { name: PHOTO });
  await reloadToStart(page);
  await check('with the card, Resume is red; Start fresh and Open photo are not', async () => {
    await expect(page.locator('#resume')).toBeVisible();
    expect(await backgroundOf(page.locator('#btnResume'))).toBe(P1HUNT_RED);
    expect(await backgroundOf(page.locator('#btnFresh'))).not.toBe(P1HUNT_RED);
    expect(await backgroundOf(open)).not.toBe(P1HUNT_RED);
  });
  await hand.tap(page.locator('#btnFresh'));
  await check('Start fresh: the card goes and Open photo is red again', async () => {
    await expect(page.locator('#resume')).toBeHidden();
    await expect.poll(() => backgroundOf(open)).toBe(P1HUNT_RED);
  });
});

test('STA-07.1 Resume brings back the edits and the step [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startWithPhoto(page, testInfo);
  await goToStep(page, 'rotate', hand);
  await hand.tap(page.locator('#toolRotateRight'));
  await check('the photo lies on its side', async () => {
    expect((await editState(page)).rotation.quarter).toBe(1);
  });
  await goToStep(page, 'crop', hand);
  await waitForSaved(page, { tab: 'crop', quarter: 1 });
  await reloadToStart(page);
  await check('the card offers "Resume IMG_9136.JPEG?"', async () => {
    await expect(page.locator('#resumeName')).toHaveText(PHOTO);
  });
  await resumeAs(page, hand, PHOTO);
  await check('the photo opens on Crop, on its side, with "Resumed where you left off."',
    async () => {
      expect(await stepNow(page)).toBe('crop');
      expect((await editState(page)).rotation.quarter).toBe(1);
      const toast = await toastNow(page);
      expect(toast.text).toBe('Resumed where you left off.');
      expect(toast.isShown).toBe(true);
    });
});

test('STA-07.2 Resume brings back an unapplied Levels change [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startWithPhoto(page, testInfo);
  await goToStep(page, 'levels', hand);
  await hand.tap(page.locator('#toolAutoLevels'));
  await check('Discard and Apply are no longer greyed out, and a white dot sits on the Levels tab',
    async () => {
      await expect(page.locator('#btnDiscardLevels')).toBeEnabled();
      await expect(page.locator('#btnApplyLevels')).toBeEnabled();
      await expect(levelsMark(page)).toBeVisible();
    });
  const draft = await page.evaluate(() => window.__straightener.app.levelsDraft);
  // The exact draft on screen, not any draft: an earlier save could hold another one.
  await waitForSaved(page, { tab: 'levels', draft });
  await reloadToStart(page);
  await check('the card offers "Resume IMG_9136.JPEG?"', async () => {
    await expect(page.locator('#resumeName')).toHaveText(PHOTO);
  });
  await resumeAs(page, hand, PHOTO);
  await check('it opens on Levels with Discard and Apply on and the dot: the change still waits',
    async () => {
      expect(await stepNow(page)).toBe('levels');
      await expect(page.locator('#btnDiscardLevels')).toBeEnabled();
      await expect(page.locator('#btnApplyLevels')).toBeEnabled();
      await expect(levelsMark(page)).toBeVisible();
      const resumed = await page.evaluate(() => {
        const app = window.__straightener.app;
        return { draft: app.levelsDraft, applied: app.state.levels };
      });
      expect(resumed.draft).toEqual(draft);
      expect(resumed.applied).toBeNull();
    });
});

test('STA-07.3 Resume brings back Next card after an export [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startWithPhoto(page, testInfo);
  await goToStep(page, 'export', hand);
  const nextCard = page.locator('#btnNextCard');
  await check('the Export step shows Download and no Next card', async () => {
    await expect(page.locator('#btnDownload')).toBeVisible();
    await expect(nextCard).toBeHidden();
  });
  await tapAndSeeQuestion(page, hand, check, page.locator('#btnDownload'),
    'a question box asks "Upscale to 2000 px?"');
  const saved = await answerAndSave(page, hand);
  await check('a file is saved and Next card shows', async () => {
    expect(saved.name).toBe('IMG_9136-straight.jpg');
    await expect(nextCard).toBeVisible();
  });
  await waitForSaved(page, { exported: true });
  await reloadToStart(page);
  await check('the card offers "Resume IMG_9136.JPEG?"', async () => {
    await expect(page.locator('#resumeName')).toHaveText(PHOTO);
  });
  await resumeAs(page, hand, PHOTO);
  await check('the photo opens on Export with Next card showing', async () => {
    expect(await stepNow(page)).toBe('export');
    await expect(nextCard).toBeVisible();
  });
});

test('STA-07.4 A pair comes back as a pair [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startWithPhoto(page, testInfo, FRONT);
  await goToStep(page, 'export', hand);
  await addBack(page, hand, BACK);
  const segment = side => page.locator(`#sideSwitch .segment[data-value="${side}"]`);
  await check('the back opens on Perspective; Front and Back show, Back selected', async () => {
    expect(await stepNow(page)).toBe('perspective');
    await expect(page.locator('#sideSwitch')).toBeVisible();
    await expect(segment('back')).toHaveAttribute('aria-pressed', 'true');
  });
  await reloadToStart(page);
  await check('the card offers both photos, front + back', async () => {
    await expect(page.locator('#resumeName')).toHaveText(`${FRONT} + ${BACK}`);
  });
  await resumeAs(page, hand, BACK);
  await check('the back opens on Perspective, Front | Back with Back selected, and Unpair',
    async () => {
      expect(await stepNow(page)).toBe('perspective');
      await expect(page.locator('#sideSwitch')).toBeVisible();
      await expect(segment('back')).toHaveAttribute('aria-pressed', 'true');
      await expect(page.locator('#btnUnpair')).toBeVisible();
    });
  await rememberPhoto(page);
  await hand.tap(segment('front'));
  await waitForPhoto(page, FRONT);
  await check('Front shows the front photo, with Front selected', async () => {
    await expect(segment('front')).toHaveAttribute('aria-pressed', 'true');
    expect((await editState(page)).source.name).toBe(FRONT);
  });
});

// Opens the photo, turns it a quarter on Rotate, waits until that is saved and reloads to the
// start screen. Returns the hand.
async function startWithSavedTurn(page, testInfo) {
  const hand = await startWithPhoto(page, testInfo);
  await goToStep(page, 'rotate', hand);
  await hand.tap(page.locator('#toolRotateRight'));
  await waitForSaved(page, { tab: 'rotate', quarter: 1 });
  await reloadToStart(page);
  return hand;
}

test('STA-08.1 A size mismatch says the photo was opened fresh [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startWithSavedTurn(page, testInfo);
  // Script only: no control changes a saved record (whether the developer tools can is Q-07).
  await changeSavedEdits(page, 'width', PHOTO_WIDTH + 1);
  await check('the saved edits hold the width 1499', async () => {
    expect((await storedRecord(page, 'edits')).width).toBe(PHOTO_WIDTH + 1);
  });
  await resumeAs(page, hand, PHOTO);
  await check('the photo opens upright on Perspective: the saved turn was not applied',
    async () => {
      expect((await editState(page)).rotation.quarter).toBe(0);
      expect(await stepNow(page)).toBe('perspective');
    });
  // A plain reading, not a retrying one: the message comes with the photo or not at all.
  const toast = await toastNow(page);
  await check(`an amber message reads "${SIZE_MISMATCH_MESSAGE}"`, async () => {
    expect(toast.isShown).toBe(true);
    expect(toast.kind).toBe('warn');
    expect(toast.text).toBe(SIZE_MISMATCH_MESSAGE);
  });
});

test('STA-08.2 After a size mismatch the fresh edits replace the saved ones [phone] '
  + '[webkit]', async ({ page, check }, testInfo) => {
  const hand = await startWithSavedTurn(page, testInfo);
  await changeSavedEdits(page, 'width', PHOTO_WIDTH + 1);
  await check('the saved edits hold the width 1499', async () => {
    expect((await storedRecord(page, 'edits')).width).toBe(PHOTO_WIDTH + 1);
  });
  await resumeAs(page, hand, PHOTO);
  await check('the photo opens upright on Perspective, Undo greyed out', async () => {
    expect((await editState(page)).rotation.quarter).toBe(0);
    expect(await stepNow(page)).toBe('perspective');
    await expect(page.locator('#btnUndo')).toBeDisabled();
  });
  await waitForSaved(page, { width: PHOTO_WIDTH, quarter: 0 });
  await reloadToStart(page);
  await check('after a reload the card offers "Resume IMG_9136.JPEG?" again', async () => {
    await expect(page.locator('#resumeName')).toHaveText(PHOTO);
  });
  await resumeAs(page, hand, PHOTO);
  await check('it opens upright with "Resumed where you left off.": the fresh edits replaced '
    + 'the saved turn', async () => {
    expect((await editState(page)).rotation.quarter).toBe(0);
    expect((await toastNow(page)).text).toBe('Resumed where you left off.');
  });
});

// The last two rows of STA-08.3 and STA-08.4: Resume opens the photo upright on Perspective,
// with the amber opened-fresh message.
async function checkResumeOpensFresh(page, check, hand) {
  await resumeAs(page, hand, PHOTO);
  await check('the photo opens upright on Perspective', async () => {
    expect((await editState(page)).rotation.quarter).toBe(0);
    expect(await stepNow(page)).toBe('perspective');
  });
  // A plain reading, not a retrying one: the message comes with the photo or not at all.
  const toast = await toastNow(page);
  await check(`an amber message reads "${SIZE_MISMATCH_MESSAGE}"`, async () => {
    expect(toast.isShown).toBe(true);
    expect(toast.kind).toBe('warn');
    expect(toast.text).toBe(SIZE_MISMATCH_MESSAGE);
  });
}

test('STA-08.3 A saved record that holds no edits says the photo was opened fresh [phone]',
  async ({ page, check }, testInfo) => {
    const hand = await startWithSavedTurn(page, testInfo);
    // Script only: no control changes a saved record (whether the developer tools can is Q-07).
    await changeSavedEdits(page, 'state', null);
    await check('the saved record holds no edits, and still holds the width 1498', async () => {
      const record = await storedRecord(page, 'edits');
      expect(record.state).toBeNull();
      expect(record.width).toBe(PHOTO_WIDTH);
    });
    await checkResumeOpensFresh(page, check, hand);
  });

test('STA-08.4 A saved record that has gone says the photo was opened fresh [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startWithSavedTurn(page, testInfo);
  // Script only: no control deletes the saved edits and keeps the photo.
  await deleteSavedEdits(page);
  await check('no edits are saved; the card still offers "Resume IMG_9136.JPEG?"', async () => {
    expect(await storedRecord(page, 'edits')).toBeNull();
    await expect(page.locator('#btnResume')).toBeVisible();
    await expect(page.locator('#resumeName')).toHaveText(PHOTO);
  });
  await checkResumeOpensFresh(page, check, hand);
});

test('STA-09.1 Resume keeps corners placed by hand [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startWithPhoto(page, testInfo);
  const detectedCorners = (await editState(page)).corners;
  const detected = detectedCorners[0];
  const start = await cornerOnPage(page, 0);
  await hand.drag(start, { x: start.x + CORNER_DRAG_PX, y: start.y + CORNER_DRAG_PX });
  const placed = (await editState(page)).corners;
  await check('the top-left handle sits inside the card, off its corner', async () => {
    expect(placed[0][0]).toBeGreaterThan(detected[0]);
    expect(placed[0][1]).toBeGreaterThan(detected[1]);
  });
  await waitForSaved(page, { corners: placed });
  await reloadToStart(page);
  await check('the card offers "Resume IMG_9136.JPEG?"', async () => {
    await expect(page.locator('#resumeName')).toHaveText(PHOTO);
  });
  await resumeAs(page, hand, PHOTO);
  await check('the top-left handle is where it was left', async () => {
    expect((await editState(page)).corners).toEqual(placed);
  });
  const candidate = page.locator('#toolCandidate');
  await check('once settled Candidate can be tapped; it shows its icon and no number, and the '
    + 'handles have not moved', async () => {
    await expect(candidate).toBeEnabled();
    await expect(candidate.locator('.tool-glyph')).toBeVisible();
    await expect(candidate.locator('.tool-value')).toBeHidden();
    expect((await editState(page)).corners).toEqual(placed);
  });
  await hand.tap(candidate);
  await check('Candidate reads 1/3, and the handles are on the card\'s four corners: the best '
    + 'outline found', async () => {
    await expect(candidate.locator('.tool-value')).toHaveText('1/3');
    expect((await editState(page)).corners).toEqual(detectedCorners);
  });
});

// Candidate's number and the confidence at the right of Perspective's line, as shown.
function candidateAndConfidence(page) {
  return page.evaluate(() => {
    const number = document.querySelector('#toolCandidate .tool-value');
    const line = document.querySelector('#perspectiveLine');
    return {
      candidate: number.hidden ? '' : number.textContent,
      confidence: line.hidden ? '' : line.querySelector('.line-readout').textContent,
    };
  });
}

test('STA-09.2 Resume with corners nobody moved keeps Candidate\'s number and the confidence '
  + '[phone] [webkit]', async ({ page, check }, testInfo) => {
  const hand = await startWithPhoto(page, testInfo);
  const detectedCorners = (await editState(page)).corners;
  const before = await candidateAndConfidence(page);
  await check('Candidate reads 1/3, and the line reads Confidence and a percentage', async () => {
    expect(before.candidate).toBe('1/3');
    expect(before.confidence).toMatch(/^Confidence \d+%$/);
  });
  await waitForSaved(page, { corners: detectedCorners });
  await reloadToStart(page);
  await check('the card offers "Resume IMG_9136.JPEG?"', async () => {
    await expect(page.locator('#resumeName')).toHaveText(PHOTO);
  });
  await resumeAs(page, hand, PHOTO);
  await check('the photo opens with its handles on the card, where they were', async () => {
    expect((await editState(page)).corners).toEqual(detectedCorners);
  });
  await check('once settled Candidate reads 1/3, and the line reads the same confidence as in '
    + 'row 1', async () => {
    await expect(page.locator('#toolCandidate')).toBeEnabled();
    expect(await candidateAndConfidence(page)).toEqual(before);
    expect((await editState(page)).corners).toEqual(detectedCorners);
  });
});

// The rectangle every photo's corners start on, a fifth in from each edge (CONFIG.defaultInsetPct),
// in photo px, top-left first, clockwise.
function startingRectangle(width, height) {
  return [
    [width * 0.2, height * 0.2],
    [width * 0.8, height * 0.2],
    [width * 0.8, height * 0.8],
    [width * 0.2, height * 0.8],
  ];
}

// Expects two lists of [x, y] photo points to match within a hundredth of a photo px.
function expectSameCorners(actual, expected) {
  expect(actual).toHaveLength(expected.length);
  actual.forEach((point, index) => {
    expect(Math.abs(point[0] - expected[index][0])).toBeLessThan(0.01);
    expect(Math.abs(point[1] - expected[index][1])).toBeLessThan(0.01);
  });
}

test('STA-09.3 Resume puts corners still on the starting rectangle on the card, with no undo '
  + 'step [phone] [webkit]', async ({ page, check }, testInfo) => {
  // Before the case starts: the photo opened on its own, to learn where its corners land.
  const hand = await startWithPhoto(page, testInfo);
  const detectedCorners = (await editState(page)).corners;
  // Script only: the next search is held open and never ends (the reload cuts it off), so the
  // corners saved for Resume are the ones every photo starts on.
  await holdNextSearch(page);
  await pickWith(page, hand, page.locator('#btnOpen'), PHOTO);
  await page.waitForFunction(() => {
    const app = window.__straightener.app;
    const isNew = !!app.img && app.img !== window.testPhotoBefore;
    return isNew && !!app.geometry && app.detection.message === 'Detecting…';
  });
  const startCorners = (await editState(page)).corners;
  await check('the photo opens again on Perspective, its outline on the rectangle a fifth in '
    + 'from each edge, and the line reads "Detecting…"', async () => {
    expect(await stepNow(page)).toBe('perspective');
    expectSameCorners(startCorners, startingRectangle(PHOTO_WIDTH, PHOTO_HEIGHT));
    await expect(page.locator('#perspectiveStatus .status-text')).toHaveText('Detecting…');
  });
  await waitForSaved(page, { name: PHOTO, tab: 'perspective', corners: startCorners });
  const wasStillSearching = await page.evaluate(() => (
    window.__straightener.app.detection.isSearching));
  await reloadToStart(page);
  await check('the card offers "Resume IMG_9136.JPEG?" (the search had not ended at the reload)',
    async () => {
      expect(wasStillSearching).toBe(true);
      await expect(page.locator('#resumeName')).toHaveText(PHOTO);
    });
  await resumeAs(page, hand, PHOTO);
  await check('the photo opens on the Perspective step', async () => {
    expect(await stepNow(page)).toBe('perspective');
  });
  await check('once settled the four corners are on the card\'s corners, where they land when '
    + 'this photo is opened on its own, and Candidate reads 1/3', async () => {
    expectSameCorners((await editState(page)).corners, detectedCorners);
    await expect(page.locator('#toolCandidate .tool-value')).toHaveText('1/3');
  });
  await check('Undo is greyed out', async () => {
    await expect(page.locator('#btnUndo')).toBeDisabled();
  });
});

// Expects two saved images to be the same picture: every cell of the grid within a level.
function expectSamePicture(first, second) {
  expect([second.width, second.height]).toEqual([first.width, first.height]);
  second.cells.forEach((cell, index) => {
    cell.forEach((channel, channelIndex) => {
      expect(Math.abs(channel - first.cells[index][channelIndex])).toBeLessThanOrEqual(1);
    });
  });
}

// The question box's layer: the box over the dimmed photo with a question and buttons.
function questionBox(page) {
  return page.locator('#pairPrompt');
}

// Taps `control` and records the row's verdict: the question box asks `title`. `description`
// is the row's result in its own words.
async function tapAndSeeQuestion(page, hand, check, control, description, title = UPSCALE_TITLE) {
  await hand.tap(control);
  await check(description, async () => {
    await expect(questionBox(page)).toBeVisible();
    await expect(questionBox(page).locator('.alert-title')).toHaveText(title);
  });
}

// Taps `answer` in the question box and waits for the file it saves. Returns { name, file }:
// the name the app gave the file and the path of the saved copy.
async function answerAndSave(page, hand, answer = 'No') {
  const downloading = page.waitForEvent('download');
  await hand.tap(questionBox(page).getByRole('button', { name: answer, exact: true }));
  const download = await downloading;
  return { name: download.suggestedFilename(), file: await download.path() };
}

// Taps `answer` in the question box. Returns the saved file's path, or null when the export
// fails instead (a red message, and no file), so a failed export is seen at once rather than
// after a download's timeout.
async function answerAndSaveOrFail(page, hand, answer = 'No') {
  const downloading = page.waitForEvent('download')
    .then(download => download.path(), () => null);
  await hand.tap(questionBox(page).getByRole('button', { name: answer, exact: true }));
  const failing = page.locator('#toast.is-error').waitFor({ state: 'visible' })
    .then(() => null, () => null);
  return Promise.race([downloading, failing]);
}

// Goes to `step` with its tab and records the row's verdict: `control` shows. `description`
// is the row's result in its own words.
async function goToStepAndSee(page, hand, check, step, control, description) {
  await goToStep(page, step, hand);
  await check(description, async () => {
    expect(await stepNow(page)).toBe(step);
    await expect(control).toBeVisible();
  });
}

test('STA-10.1 Resume brings the logo back [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startWithPhoto(page, testInfo);
  const download = page.locator('#btnDownload');
  await goToStepAndSee(page, hand, check, 'overlay', page.locator('#btnOverlayAdd'),
    'the Overlay step shows Add logo');
  const logo = await addLogo(page, hand, page.locator('#btnOverlayAdd'), LOGO);
  await check('the logo shows on the photo', async () => {
    expect((await editState(page)).overlay.id).toBe(logo);
  });
  await goToStepAndSee(page, hand, check, 'export', download, 'the Export step shows Download');
  await tapAndSeeQuestion(page, hand, check, download,
    'a question box asks "Upscale to 2000 px?"');
  const first = await answerAndSave(page, hand);
  await check('a file named IMG_9136-straight.jpg is saved, with the logo in it', async () => {
    expect(first.name).toBe('IMG_9136-straight.jpg');
    expect((await editState(page)).overlay.id).toBe(logo);
  });
  await waitForSaved(page, { overlayId: logo, exported: true });
  await reloadToStart(page);
  await check('the card offers "Resume IMG_9136.JPEG?"', async () => {
    await expect(page.locator('#resumeName')).toHaveText(PHOTO);
  });
  await resumeAs(page, hand, PHOTO);
  await check('the photo opens on the Export step', async () => {
    expect(await stepNow(page)).toBe('export');
  });
  await tapAndSeeQuestion(page, hand, check, download,
    'the question box asks "Upscale to 2000 px?"');
  const second = await answerAndSave(page, hand);
  const firstImage = await readSavedImage(page, first.file, COMPARE_GRID);
  const secondImage = await readSavedImage(page, second.file, COMPARE_GRID);
  await check('a second file is saved, with no message about the logo: the same picture, logo '
    + 'and all', async () => {
    expect((await toastNow(page)).kind).toBe('');
    expectSamePicture(firstImage, secondImage);
  });
});

test('STA-10.2 Remove and Undo after a resume bring the logo back [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startWithPhoto(page, testInfo);
  const download = page.locator('#btnDownload');
  await goToStepAndSee(page, hand, check, 'overlay', page.locator('#btnOverlayAdd'),
    'the Overlay step shows Add logo');
  const logo = await addLogo(page, hand, page.locator('#btnOverlayAdd'), LOGO);
  await check('the logo shows on the photo', async () => {
    expect((await editState(page)).overlay.id).toBe(logo);
  });
  await waitForSaved(page, { overlayId: logo, tab: 'overlay' });
  await reloadToStart(page);
  await check('the card offers "Resume IMG_9136.JPEG?"', async () => {
    await expect(page.locator('#resumeName')).toHaveText(PHOTO);
  });
  await resumeAs(page, hand, PHOTO);
  await check('the photo opens on the Overlay step, with the logo', async () => {
    expect(await stepNow(page)).toBe('overlay');
    expect((await editState(page)).overlay.id).toBe(logo);
  });
  await hand.tap(page.locator('#toolOverlayRemove'));
  await check('Remove takes the logo off; Add logo shows', async () => {
    expect((await editState(page)).overlay).toBeNull();
    await expect(page.locator('#btnOverlayAdd')).toBeVisible();
  });
  await hand.tap(page.locator('#btnUndo'));
  await check('Undo brings the logo back', async () => {
    expect((await editState(page)).overlay.id).toBe(logo);
  });
  await goToStepAndSee(page, hand, check, 'export', download, 'the Export step shows Download');
  await tapAndSeeQuestion(page, hand, check, download,
    'a question box asks "Upscale to 2000 px?"');
  const saved = await answerAndSave(page, hand);
  await check('a file named IMG_9136-straight.jpg is saved, with no message about the logo',
    async () => {
      expect(saved.name).toBe('IMG_9136-straight.jpg');
      expect((await toastNow(page)).kind).toBe('');
    });
});

test('STA-10.3 After a replaced logo is undone, Resume keeps the logo [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startWithPhoto(page, testInfo);
  const download = page.locator('#btnDownload');
  await goToStep(page, 'overlay', hand);
  const first = await addLogo(page, hand, page.locator('#btnOverlayAdd'), LOGO);
  await check('the app icon shows on the photo as the logo', async () => {
    expect((await editState(page)).overlay.id).toBe(first);
  });
  const second = await addLogo(page, hand, page.locator('#toolOverlayReplace'), OTHER_LOGO);
  await check('Replace logo changes the logo to the other picture', async () => {
    expect(second).not.toBe(first);
  });
  await hand.tap(page.locator('#btnUndo'));
  await check('Undo makes the app icon the logo again', async () => {
    expect((await editState(page)).overlay.id).toBe(first);
  });
  await goToStepAndSee(page, hand, check, 'export', download, 'the Export step shows Download');
  await tapAndSeeQuestion(page, hand, check, download,
    'a question box asks "Upscale to 2000 px?"');
  const before = await answerAndSave(page, hand);
  await check('a file named IMG_9136-straight.jpg is saved; the app icon is still the logo on '
    + 'the photo', async () => {
    expect(before.name).toBe('IMG_9136-straight.jpg');
    expect((await editState(page)).overlay.id).toBe(first);
  });
  await waitForSaved(page, { overlayId: first, exported: true });
  await reloadToStart(page);
  await check('the card offers "Resume IMG_9136.JPEG?"', async () => {
    await expect(page.locator('#resumeName')).toHaveText(PHOTO);
  });
  await resumeAs(page, hand, PHOTO);
  await check('the photo opens on the Export step', async () => {
    expect(await stepNow(page)).toBe('export');
  });
  await tapAndSeeQuestion(page, hand, check, download,
    'the question box asks "Upscale to 2000 px?"');
  const after = await answerAndSaveOrFail(page, hand);
  const toast = await toastNow(page);
  await check('a second file is saved, with no message about the logo: the same picture as the '
    + 'first, logo and all', async () => {
    expect(toast.kind, `the message: ${toast.text}`).toBe('');
    expect(after).not.toBeNull();
    const beforeImage = await readSavedImage(page, before.file, COMPARE_GRID);
    const afterImage = await readSavedImage(page, after, COMPARE_GRID);
    expectSamePicture(beforeImage, afterImage);
  });
});

// STA-10.4's named action "Save the edits": on Export, opens its options, taps Save edits and
// closes them. Returns the saved edits file's download.
async function saveTheEdits(page, hand) {
  await goToStep(page, 'export', hand);
  await openOptions(page, hand, 'export');
  const saving = page.waitForEvent('download');
  await hand.tap(page.locator('#btnSaveEdits'));
  const editsFile = await saving;
  await closeOptions(page, hand, 'export');
  return editsFile;
}

// STA-10.4's named action "Load the edits": on Export, opens its options and loads the edits
// file `editsFile` (a download); returns once its logo is back on the photo and, on a phone,
// the options have closed.
async function loadTheEdits(page, hand, editsFile, logo) {
  await goToStep(page, 'export', hand);
  await openOptions(page, hand, 'export');
  const edits = {
    name: editsFile.suggestedFilename(),
    mimeType: 'application/json',
    buffer: fs.readFileSync(await editsFile.path()),
  };
  await pickWith(page, hand, page.locator('#btnLoadEdits'), edits);
  await expect.poll(async () => (await editState(page)).overlay.id).toBe(logo);
  // On a phone the app closes Export options when it applies the file.
  if (hand.isTouch) await page.locator('#exportSheet').waitFor({ state: 'hidden' });
}

test('STA-10.4 Resume falls back to the logo saved in the browser [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startWithPhoto(page, testInfo);
  await goToStep(page, 'overlay', hand);
  const pngLogo = await addLogo(page, hand, page.locator('#btnOverlayAdd'), OTHER_LOGO);
  await check('apple-touch-icon.png shows on the photo', async () => {
    expect((await editState(page)).overlay.id).toBe(pngLogo);
  });
  const editsFile = await saveTheEdits(page, hand);
  await check('a file named IMG_9136-edits.json is saved; the Export step shows', async () => {
    expect(editsFile.suggestedFilename()).toBe('IMG_9136-edits.json');
    expect(await stepNow(page)).toBe('export');
  });
  await goToStep(page, 'overlay', hand);
  await check('the Overlay step shows, with the logo', async () => {
    expect(await stepNow(page)).toBe('overlay');
    expect((await editState(page)).overlay.id).toBe(pngLogo);
  });
  const svgLogo = await addLogo(page, hand, page.locator('#toolOverlayReplace'), LOGO);
  await check('the app icon is the logo now', async () => {
    expect(svgLogo).not.toBe(pngLogo);
  });
  await loadTheEdits(page, hand, editsFile, pngLogo);
  await check('Load the edits makes apple-touch-icon.png the logo again', async () => {
    expect((await editState(page)).overlay.id).toBe(pngLogo);
  });
  await hand.tap(page.locator('#btnUndo'));
  await check('Undo makes the app icon the logo again', async () => {
    expect((await editState(page)).overlay.id).toBe(svgLogo);
  });
  await waitForSaved(page, { overlayId: svgLogo });
  await reloadToStart(page);
  await check('the card offers "Resume IMG_9136.JPEG?"; the photo\'s stored logo is the other '
    + 'one, the saved logo this one', async () => {
    await expect(page.locator('#resumeName')).toHaveText(PHOTO);
    expect((await storedRecord(page, 'photoOverlay')).id).toBe(pngLogo);
    expect((await storedRecord(page, 'overlay')).id).toBe(svgLogo);
  });
  await resumeAs(page, hand, PHOTO);
  await check('the photo opens on the Export step', async () => {
    expect(await stepNow(page)).toBe('export');
  });
  await tapAndSeeQuestion(page, hand, check, page.locator('#btnDownload'),
    'a question box asks "Upscale to 2000 px?"');
  const saved = await answerAndSave(page, hand);
  await check('a file named IMG_9136-straight.jpg is saved, with no message about the logo',
    async () => {
      expect(saved.name).toBe('IMG_9136-straight.jpg');
      expect((await toastNow(page)).kind).toBe('');
    });
});

// Taps Download where it asks no question (Size Original). Returns { name, file } for the saved
// file, or null when the export fails instead (a red message, and no file), so a failed export
// is seen at once rather than after a download's timeout.
async function downloadOrFail(page, hand) {
  const downloading = page.waitForEvent('download').then(async download => ({
    name: download.suggestedFilename(),
    file: await download.path(),
  }), () => null);
  await hand.tap(page.locator('#btnDownload'));
  const failing = page.locator('#toast.is-error').waitFor({ state: 'visible' })
    .then(() => null, () => null);
  return Promise.race([downloading, failing]);
}

// STA-10.5's starting screen: Original for Size, apple-touch-icon.png added as the logo, the
// edits saved, then the Overlay step. Returns { pngLogo, editsFile }: the logo's id and the
// saved edits file's download.
async function startWithLogoAndSavedEdits(page, hand) {
  await goToStep(page, 'export', hand);
  await hand.tap(exportSegment(page, 'exportSize', '0'));
  await expectSelected(exportSegment(page, 'exportSize', '0'));
  await goToStep(page, 'overlay', hand);
  const pngLogo = await addLogo(page, hand, page.locator('#btnOverlayAdd'), OTHER_LOGO);
  const editsFile = await saveTheEdits(page, hand);
  await goToStep(page, 'overlay', hand);
  return { pngLogo, editsFile };
}

test('STA-10.5 After Delete saved, Resume still brings the logo back [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startWithPhoto(page, testInfo);
  const download = page.locator('#btnDownload');
  const deleteSaved = page.locator('#toolOverlayDeleteSaved');
  const { pngLogo, editsFile } = await startWithLogoAndSavedEdits(page, hand);
  const svgLogo = await addLogo(page, hand, page.locator('#toolOverlayReplace'), LOGO);
  await check('the app icon is the logo now', async () => {
    expect(svgLogo).not.toBe(pngLogo);
  });
  await loadTheEdits(page, hand, editsFile, pngLogo);
  await check('Load the edits makes apple-touch-icon.png the logo again', async () => {
    expect((await editState(page)).overlay.id).toBe(pngLogo);
  });
  await hand.tap(page.locator('#btnUndo'));
  await check('Undo makes the app icon the logo again', async () => {
    expect((await editState(page)).overlay.id).toBe(svgLogo);
  });
  await goToStep(page, 'overlay', hand);
  await check('the Overlay step shows, with the app icon as the logo and Delete saved in the row '
    + 'of tools', async () => {
    expect(await stepNow(page)).toBe('overlay');
    expect((await editState(page)).overlay.id).toBe(svgLogo);
    await expect(deleteSaved).toBeVisible();
    await expect(deleteSaved).toBeEnabled();
  });
  await hand.tap(deleteSaved);
  await check('Delete saved is greyed out; the app icon is still the logo', async () => {
    await expect(deleteSaved).toBeDisabled();
    expect((await editState(page)).overlay.id).toBe(svgLogo);
  });
  await goToStepAndSee(page, hand, check, 'export', download, 'the Export step shows Download');
  const before = await downloadOrFail(page, hand);
  await check('a file named IMG_9136-straight.jpg is saved', async () => {
    expect(before).not.toBeNull();
    expect(before.name).toBe('IMG_9136-straight.jpg');
  });
  await waitForSaved(page, { overlayId: svgLogo, exported: true });
  // The saved logo has gone from the device before the reload.
  await expect.poll(() => storedRecord(page, 'overlay')).toBeNull();
  await reloadToStart(page);
  await check('the card offers "Resume IMG_9136.JPEG?"', async () => {
    await expect(page.locator('#resumeName')).toHaveText(PHOTO);
  });
  await resumeAs(page, hand, PHOTO);
  await check('the photo opens on the Export step', async () => {
    expect(await stepNow(page)).toBe('export');
  });
  const after = await downloadOrFail(page, hand);
  const toast = await toastNow(page);
  await check('a second file is saved, with no message about the logo: the same picture as the '
    + 'first, logo and all', async () => {
    expect(toast.kind, `the message: ${toast.text}`).toBe('');
    expect(after).not.toBeNull();
    const beforeImage = await readSavedImage(page, before.file, COMPARE_GRID);
    const afterImage = await readSavedImage(page, after.file, COMPARE_GRID);
    expectSamePicture(beforeImage, afterImage);
  });
});

test('STA-11.1 Resume after the saved photo has gone [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startWithSavedPhoto(page, testInfo);
  const secondTab = await page.context().newPage();
  await openApp(secondTab);
  await waitForStart(secondTab);
  const secondHand = handFor(secondTab, testInfo);
  await secondHand.tap(secondTab.locator('#btnFresh'));
  await check('in the second tab, Start fresh takes the card away', async () => {
    await expect(secondTab.locator('#resume')).toBeHidden();
  });
  await page.bringToFront();
  await check('back in the first tab, its start screen still offers "Resume IMG_9136.JPEG?"',
    async () => {
      await expect(page.locator('#resume')).toBeVisible();
      await expect(page.locator('#resumeName')).toHaveText(PHOTO);
    });
  await hand.tap(page.locator('#btnResume'));
  await check('"The saved photo is gone. Open it again." in amber; the start screen stays, '
    + 'its card hidden, no photo', async () => {
    await expect(page.locator('#toast')).toContainText('The saved photo is gone. Open it again.');
    expect((await toastNow(page)).kind).toBe('warn');
    await expect(page.locator('#empty')).toBeVisible();
    await expect(page.locator('#resume')).toBeHidden();
    expect(await hasPhoto(page)).toBe(false);
  });
});

test('STA-12.1 Resume that fails names no browser error [desktop]', async ({
  page,
  browserName,
  check,
}, testInfo) => {
  test.skip(browserName !== 'chromium', 'Only Chromium lets a test clear the site data');
  const hand = await startWithSavedPhoto(page, testInfo);
  // The developer tools' Clear site data, through the same browser command they use.
  const devTools = await page.context().newCDPSession(page);
  await devTools.send('Storage.clearDataForOrigin', {
    origin: new URL(page.url()).origin,
    storageTypes: 'all',
  });
  await check('the stored data is cleared; the card still shows', async () => {
    await expect(page.locator('#resume')).toBeVisible();
  });
  await hand.tap(page.locator('#btnResume'));
  await expect.poll(async () => (await toastNow(page)).isShown).toBe(true);
  // A plain reading: the message is up, and its words are what they are.
  const toast = await toastNow(page);
  await check(`a red message reads "${RESUME_FAILED_MESSAGE}" and nothing more: no browser error`,
    async () => {
      expect(toast.kind).toBe('error');
      expect(toast.text).toBe(RESUME_FAILED_MESSAGE);
    });
  await check('the browser\'s error is logged in the console', async () => {
    const errors = check.consoleErrors().join('\n');
    expect(errors).toContain('database connection is closing');
  });
});

// Every record of the photo session, read from the device: photo, edits, photoOverlay, pair
// and pairPhoto. Each is null when it is gone.
async function sessionRecords(page) {
  const keys = ['photo', 'edits', 'photoOverlay', 'pair', 'pairPhoto'];
  const records = {};
  for (const key of keys) records[key] = await storedRecord(page, key);
  return records;
}

test('STA-13.1 Start fresh forgets the photo, its logo and a pair [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startWithPhoto(page, testInfo, FRONT);
  await goToStepAndSee(page, hand, check, 'overlay', page.locator('#btnOverlayAdd'),
    'the Overlay step shows Add logo');
  const logo = await addLogo(page, hand, page.locator('#btnOverlayAdd'), LOGO);
  await check('the logo shows on the front', async () => {
    expect((await editState(page)).overlay.id).toBe(logo);
  });
  await goToStepAndSee(page, hand, check, 'export', page.locator('#btnAddBack'),
    'the Export step shows Add back');
  await addBack(page, hand, BACK);
  await check('the back opens; Front and Back show in the top bar', async () => {
    await expect(page.locator('#sideSwitch')).toBeVisible();
  });
  await reloadToStart(page);
  await check('the card offers the front + the back', async () => {
    await expect(page.locator('#resumeName')).toHaveText(`${FRONT} + ${BACK}`);
    const records = await sessionRecords(page);
    expect(Object.values(records).every(record => record !== null)).toBe(true);
  });
  await hand.tap(page.locator('#btnFresh'));
  await check('Start fresh: the card goes; the front\'s photo and edits, its logo, and the back '
    + 'with its photo are all gone from storage', async () => {
    await expect(page.locator('#resume')).toBeHidden();
    await expect.poll(() => sessionRecords(page)).toEqual({
      photo: null,
      edits: null,
      photoOverlay: null,
      pair: null,
      pairPhoto: null,
    });
  });
  await reloadToStart(page);
  await check('after a reload there is no card', async () => {
    await expect(page.locator('#resume')).toBeHidden();
  });
});

test('STA-13.2 Start fresh keeps the saved logo and the remembered settings [phone] [webkit]',
  async ({ page, check }, testInfo) => {
    const hand = await startWithPhoto(page, testInfo);
    await goToStepAndSee(page, hand, check, 'overlay', page.locator('#btnOverlayAdd'),
      'the Overlay step shows Add logo');
    const logo = await addLogo(page, hand, page.locator('#btnOverlayAdd'), LOGO);
    await check('the logo shows on the photo', async () => {
      expect((await editState(page)).overlay.id).toBe(logo);
    });
    // The 4:3 preset reads 3:4 for an upright card.
    const threeByFour = page.locator('.preset-chip[data-value="4:3"]:visible');
    await goToStepAndSee(page, hand, check, 'crop', threeByFour,
      'the Crop step shows its row of sizes');
    await hand.tap(threeByFour);
    await check('3:4 is selected', async () => {
      await expect(threeByFour).toHaveAttribute('aria-pressed', 'true');
    });
    await waitForSaved(page, { tab: 'crop', overlayId: logo });
    await reloadToStart(page);
    await check('the card offers "Resume IMG_9136.JPEG?"', async () => {
      await expect(page.locator('#resumeName')).toHaveText(PHOTO);
    });
    await hand.tap(page.locator('#btnFresh'));
    await check('Start fresh takes the card away', async () => {
      await expect(page.locator('#resume')).toBeHidden();
    });
    await pickWith(page, hand, page.locator('#btnOpenEmpty'), SECOND_PHOTO);
    await waitForPhoto(page, SECOND_PHOTO);
    await check('IMG_9075.JPEG opens', async () => {
      await expect(page.locator('#empty')).toBeHidden();
    });
    await goToStep(page, 'crop', hand);
    await check('on Crop, 3:4 is selected: the remembered size stayed', async () => {
      await expect(threeByFour).toHaveAttribute('aria-pressed', 'true');
      expect((await editState(page)).crop.preset).toBe('4:3');
    });
    await goToStep(page, 'overlay', hand);
    await check('on Overlay, Use saved overlay is offered beside the saved logo', async () => {
      await expect(page.locator('#btnUseSaved')).toBeVisible();
      await expect(page.locator('#overlayThumb')).toBeVisible();
    });
  });

// Opens the app at `address` watching its storage writes, downloads and clicks, opens the
// photo, goes to `step` and waits until the saves of opening it are done. Returns the hand.
async function startWatched(page, testInfo, step, address = 'index.html') {
  await watchStorageAndDownloads(page);
  await openApp(page, address);
  await waitForStart(page);
  const hand = handFor(page, testInfo);
  await pickWith(page, hand, page.locator('#btnOpenEmpty'), PHOTO);
  await waitForPhoto(page, PHOTO);
  await goToStep(page, step, hand);
  await page.waitForTimeout(QUIET_MS);
  return hand;
}

// The edits written since `sinceMs`, each with its delay after `sinceMs` in ms.
async function editsWritesAfter(page, sinceMs) {
  const writes = await storageWritesSince(page, 'edits', sinceMs);
  return writes.map(write => Object.assign(write, { delayMs: write.atMs - sinceMs }));
}

// Taps a control and returns when the page saw the tap's click, in performance.now() ms.
async function tapAndTime(page, hand, control) {
  await hand.tap(control);
  return lastClickMs(page);
}

// Expects exactly one edits write since a tap, `delayMs` (± the margins) after it, and returns
// it.
async function expectOneSaveAfter(page, tapMs, delayMs) {
  const writes = await editsWritesAfter(page, tapMs);
  expect(writes.map(write => Math.round(write.delayMs))).toHaveLength(1);
  expect(writes[0].delayMs).toBeGreaterThanOrEqual(delayMs - TIMER_EARLY_MS);
  expect(writes[0].delayMs).toBeLessThanOrEqual(delayMs + SAVE_LATE_MS);
  return writes[0];
}

// Ruling R36 made the wait before a save 0.1 s.
test('STA-14.1 A change is saved 0.1 s after the last one [desktop] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startWatched(page, testInfo, 'rotate');
  const turn = page.locator('#toolRotateRight');
  const firstTapMs = await tapAndTime(page, hand, turn);
  await page.waitForTimeout(SETTLE_AFTER_SAVE_MS);
  await check('the photo lies on its side; the edits are saved once, 0.10 to 0.25 s after the '
    + 'tap', async () => {
    expect((await editState(page)).rotation.quarter).toBe(1);
    const write = await expectOneSaveAfter(page, firstTapMs, SAVE_DELAY_MS);
    expect(write.quarter).toBe(1);
  });
  const record = await storedRecord(page, 'edits');
  await check('the record holds the name and size, the turn, the step, not exported, and the '
    + 'time', async () => {
    expect(record.name).toBe(PHOTO);
    expect([record.width, record.height]).toEqual([PHOTO_WIDTH, PHOTO_HEIGHT]);
    expect(record.state.rotation.quarter).toBe(1);
    expect(record.tab).toBe('rotate');
    expect(record.exported).toBe(false);
    expect(Math.abs(Date.now() - record.savedAt)).toBeLessThan(SAVED_AT_TOLERANCE_MS);
  });
  // Two clicks about 40 ms apart, made in one action (this case runs with a mouse only), so
  // that a busy machine can't stretch the gap past the save delay.
  await turn.dblclick({ delay: QUICK_CLICK_HOLD_MS });
  const [secondTapMs, thirdTapMs] = await page.evaluate(() => window.clicksAtMs.slice(-2));
  await page.waitForTimeout(SETTLE_AFTER_SAVE_MS);
  await check('two quick taps are saved once, 0.10 to 0.25 s after the second', async () => {
    expect(thirdTapMs - secondTapMs).toBeGreaterThanOrEqual(QUICK_TAP_GAP_MIN_MS);
    expect(thirdTapMs - secondTapMs).toBeLessThan(QUICK_TAP_GAP_MS);
    const early = (await editsWritesAfter(page, secondTapMs))
      .filter(write => write.atMs < thirdTapMs + SAVE_DELAY_MS - TIMER_EARLY_MS);
    expect(early).toEqual([]);
    const write = await expectOneSaveAfter(page, thirdTapMs, SAVE_DELAY_MS);
    expect(write.quarter).toBe(3);
  });
  await goToStep(page, 'crop', hand);
  const stepTapMs = await lastClickMs(page);
  await page.waitForTimeout(SETTLE_AFTER_SAVE_MS);
  await check('a step change is saved once, 0.10 to 0.25 s after the tap, with the step crop',
    async () => {
      const write = await expectOneSaveAfter(page, stepTapMs, SAVE_DELAY_MS);
      expect(write.tab).toBe('crop');
    });
  const delays = await editsWritesAfter(page, firstTapMs);
  testInfo.annotations.push({
    type: 'measured',
    description: `save times after the first tap, ms: ${delays.map(write =>
      Math.round(write.delayMs)).join(', ')}`,
  });
});

test('STA-14.2 A link can lengthen the wait before a save [phone]', async ({
  page,
  check,
}, testInfo) => {
  const address = `index.html?session.saveDelayMs=${LONG_SAVE_DELAY_MS}`;
  const hand = await startWatched(page, testInfo, 'rotate', address);
  const tapMs = await tapAndTime(page, hand, page.locator('#toolRotateRight'));
  await page.waitForTimeout(LONG_SAVE_DELAY_MS + SETTLE_AFTER_SAVE_MS);
  await check('the edits are saved once, 1.50 to 1.65 s after the tap', async () => {
    expect((await editState(page)).rotation.quarter).toBe(1);
    await expectOneSaveAfter(page, tapMs, LONG_SAVE_DELAY_MS);
  });
});

// Ruling R36: a save started as a tab closes sometimes doesn't land (in Chromium, about one run
// in twelve under load), so each change is saved soon after it is made. The tab is not left or
// hidden here, so only the save after the change can be seen. The time is the moment the app
// hands the edits to the device's storage.
test('STA-15.3 A change is saved within 0.2 s, before the tab can be closed [phone] [webkit]',
  async ({ page, check }, testInfo) => {
    const hand = await startWatched(page, testInfo, 'rotate');
    const tapMs = await tapAndTime(page, hand, page.locator('#toolRotateRight'));
    await page.waitForTimeout(SETTLE_AFTER_SAVE_MS);
    const writes = await editsWritesAfter(page, tapMs);
    testInfo.annotations.push({
      type: 'measured',
      description: `save times after the tap, ms: ${writes.map(write =>
        Math.round(write.delayMs)).join(', ')}`,
    });
    await check('the photo lies on its side; the edits, with the turn, are saved within 0.2 s '
      + 'of the tap', async () => {
      expect((await editState(page)).rotation.quarter).toBe(1);
      expect(writes.length).toBeGreaterThan(0);
      expect(writes[0].quarter).toBe(1);
      expect(writes[0].delayMs).toBeLessThanOrEqual(SOON_SAVE_MS);
    });
  });

// Tells the page it is hidden (as switching to another tab or app does) or, with
// `event` 'pagehide', that it is being left, without closing it. Returns the moment, in
// performance.now() ms.
function signalLeaving(page, event) {
  return page.evaluate(eventName => {
    if (eventName === 'pagehide') {
      window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: false }));
      return performance.now();
    }
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    return performance.now();
  }, event);
}

// Tells the page it is shown again, after signalLeaving(page, 'visibilitychange').
function signalShown(page) {
  return page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
}

// Ruling R36 keeps the save on hiding or leaving the page as a backstop to the sooner save after
// each change. The link lengthens the wait before the usual save to 1.5 s, so that only the
// backstop can save within 0.1 s; the page is never closed, so the write can be seen.
test('STA-15.6 Hiding or leaving the page starts a save at once [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const address = `index.html?session.saveDelayMs=${LONG_SAVE_DELAY_MS}`;
  const hand = await startWatched(page, testInfo, 'rotate', address);
  const turn = page.locator('#toolRotateRight');
  await hand.tap(turn);
  await check('the photo lies on its side', async () => {
    expect((await editState(page)).rotation.quarter).toBe(1);
  });
  const hiddenAtMs = await signalLeaving(page, 'visibilitychange');
  await page.waitForTimeout(QUICK_SAVE_MS);
  await check('the page told it is hidden: the edits, with the turn, are saved within 0.1 s',
    async () => {
      const writes = await editsWritesAfter(page, hiddenAtMs);
      expect(writes.length).toBeGreaterThan(0);
      expect(writes[0].delayMs).toBeLessThan(QUICK_SAVE_MS);
      expect(writes[0].quarter).toBe(1);
    });
  await signalShown(page);
  await page.waitForTimeout(LONG_SAVE_DELAY_MS + SETTLE_AFTER_SAVE_MS);
  await check('shown again and two seconds later, the photo still lies on its side', async () => {
    expect((await editState(page)).rotation.quarter).toBe(1);
  });
  await hand.tap(turn);
  await check('the photo is upside down', async () => {
    expect((await editState(page)).rotation.quarter).toBe(2);
  });
  const leftAtMs = await signalLeaving(page, 'pagehide');
  await page.waitForTimeout(QUICK_SAVE_MS);
  await check('the page told it is being left: the edits, with the second turn, are saved within '
    + '0.1 s', async () => {
    const writes = await editsWritesAfter(page, leftAtMs);
    expect(writes.length).toBeGreaterThan(0);
    expect(writes[0].delayMs).toBeLessThan(QUICK_SAVE_MS);
    expect(writes[0].quarter).toBe(2);
  });
});

// Expects the edits to have been saved as the last download started, in the same turn of the
// page's work, before the page could do anything else; a save in any later turn (the usual one,
// 0.1 s after a change) doesn't count. Returns those saves.
async function expectSaveWithDownload(page) {
  const writes = await writesWithLastDownload(page, 'edits');
  expect(writes.length).toBeGreaterThan(0);
  return writes;
}

test('STA-15.4 Every download saves the edits first [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startWatched(page, testInfo, 'export');
  await tapAndSeeQuestion(page, hand, check, page.locator('#btnDownload'),
    'a question box asks "Upscale to 2000 px?"');
  const saved = await answerAndSave(page, hand);
  await check('IMG_9136-straight.jpg is saved; the edits, marked as exported, were saved as its '
    + 'download started', async () => {
    expect(saved.name).toBe('IMG_9136-straight.jpg');
    const writes = await expectSaveWithDownload(page);
    expect(writes.some(write => write.exported === true)).toBe(true);
  });
  await page.waitForTimeout(QUIET_MS);
  await openOptions(page, hand, 'export');
  const saveEdits = page.locator('#btnSaveEdits');
  await check('Save edits shows in Export options', async () => {
    await expect(saveEdits).toBeVisible();
  });
  const savingEdits = page.waitForEvent('download');
  await hand.tap(saveEdits);
  const editsFile = await savingEdits;
  await check('IMG_9136-edits.json is saved; the edits were saved as its download started',
    async () => {
      expect(editsFile.suggestedFilename()).toBe('IMG_9136-edits.json');
      await expectSaveWithDownload(page);
    });
  await closeOptions(page, hand, 'export');
  const cornerShots = page.locator('#btnCornerShots');
  await check('Corner shots shows in the bottom row of the controls', async () => {
    await expect(cornerShots).toBeVisible();
  });
  await hand.tap(cornerShots);
  const cornerDownload = page.locator('#btnCornerDownload');
  await check('the Corner shots sheet rises, with Download corners', async () => {
    await expect(cornerDownload).toBeVisible();
    await expect(cornerDownload).toContainText('Download corners');
  });
  await page.waitForTimeout(QUIET_MS);
  await tapAndSeeQuestion(page, hand, check, cornerDownload,
    'the question box asks "Upscale to 2000 px?"');
  const corners = await answerAndSave(page, hand);
  await check('the corner sheet is saved; the edits were saved as its download started',
    async () => {
      expect(corners.name).toMatch(/^IMG_9136-corners/);
      await expectSaveWithDownload(page);
    });
});

test('STA-15.5 A pair\'s download saves the edits first [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  await watchStorageAndDownloads(page);
  const hand = await startWithPhoto(page, testInfo, FRONT);
  await addBack(page, hand, BACK);
  await goToStep(page, 'export', hand);
  await check('the Export step shows Together and Separately', async () => {
    await expect(page.locator('#pairOutput')).toBeVisible();
  });
  await page.waitForTimeout(QUIET_MS);
  await tapAndSeeQuestion(page, hand, check, page.locator('#btnDownload'),
    'a question box asks "Upscale to 2000 px?"');
  await answerAndSave(page, hand);
  await check('the pair\'s file is saved; the edits were saved as its download started, not 0.1 s '
    + 'later', async () => {
    await expectSaveWithDownload(page);
  });
});

test('STA-16.1 The photo itself is saved once [desktop] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startWatched(page, testInfo, 'perspective');
  await check('the photo opens; storage holds the file\'s bytes, type and name, written once, '
    + 'before any edits', async () => {
    expect((await editState(page)).source.name).toBe(PHOTO);
    const photo = await storedRecord(page, 'photo');
    expect(photo).toEqual({
      buf: { bytes: fs.statSync(samplePath(PHOTO)).size },
      type: 'image/jpeg',
      name: PHOTO,
    });
    const writes = await page.evaluate(() => window.storageWrites.map(write => write.key));
    expect(writes.filter(key => key === 'photo')).toHaveLength(1);
    expect(writes.indexOf('photo')).toBeLessThan(writes.indexOf('edits'));
  });
  await goToStepAndSee(page, hand, check, 'rotate', page.locator('#toolRotateRight'),
    'the Rotate step shows');
  await hand.tap(page.locator('#toolRotateRight'));
  await waitForSaved(page, { quarter: 1 });
  await check('the photo lies on its side; the edits are saved with the turn; the file is not '
    + 'written again', async () => {
    expect((await editState(page)).rotation.quarter).toBe(1);
    expect(await storageWritesSince(page, 'photo')).toHaveLength(1);
  });
  const leftTapMs = await pageNowMs(page);
  await hand.tap(page.locator('#toolRotateLeft'));
  await waitForSaved(page, { quarter: 0 });
  await check('upright again; the edits are saved again; the file is still not written again',
    async () => {
      expect((await editState(page)).rotation.quarter).toBe(0);
      const quarters = (await storageWritesSince(page, 'edits', leftTapMs))
        .map(write => write.quarter);
      expect(quarters).toContain(0);
      expect(await storageWritesSince(page, 'photo')).toHaveLength(1);
    });
  await pickWith(page, hand, page.locator('#btnOpen'), SECOND_PHOTO);
  await waitForPhoto(page, SECOND_PHOTO);
  await waitForSaved(page, { name: SECOND_PHOTO });
  await check('IMG_9075.JPEG opens; the stored file is IMG_9075.JPEG, written once more',
    async () => {
      expect((await editState(page)).source.name).toBe(SECOND_PHOTO);
      expect((await storedRecord(page, 'photo')).name).toBe(SECOND_PHOTO);
      expect(await storageWritesSince(page, 'photo')).toHaveLength(2);
    });
});

test('STA-16.2 No edits are saved until the photo is [phone]', async ({
  page,
  check,
}, testInfo) => {
  await refuseStorage(page, ['photo']);
  const hand = await startWithPhoto(page, testInfo);
  await check('the photo opens; it is not stored', async () => {
    await expect(page.locator('#empty')).toBeHidden();
    expect(await storedRecord(page, 'photo')).toBeNull();
  });
  await goToStepAndSee(page, hand, check, 'rotate', page.locator('#toolRotateRight'),
    'the Rotate step shows');
  await hand.tap(page.locator('#toolRotateRight'));
  await page.waitForTimeout(SETTLE_AFTER_SAVE_MS + SAVE_DELAY_MS);
  await check('the photo lies on its side; no edits were saved', async () => {
    expect((await editState(page)).rotation.quarter).toBe(1);
    expect(await storedRecord(page, 'edits')).toBeNull();
  });
  await reloadToStart(page);
  await check('after a reload there is no card', async () => {
    await expect(page.locator('#resume')).toBeHidden();
  });
});

test('STA-17.1 A link can turn saving off [phone]', async ({ page, check }, testInfo) => {
  const address = 'index.html?session.enabled=0';
  await openApp(page, address);
  await waitForStart(page);
  const hand = handFor(page, testInfo);
  await pickWith(page, hand, page.locator('#btnOpenEmpty'), PHOTO);
  await waitForPhoto(page, PHOTO);
  await check('the photo opens', async () => {
    await expect(page.locator('#empty')).toBeHidden();
  });
  await goToStepAndSee(page, hand, check, 'rotate', page.locator('#toolRotateRight'),
    'the Rotate step shows');
  await hand.tap(page.locator('#toolRotateRight'));
  await page.waitForTimeout(SETTLE_AFTER_SAVE_MS + SAVE_DELAY_MS);
  await check('the photo lies on its side', async () => {
    expect((await editState(page)).rotation.quarter).toBe(1);
  });
  await reloadToStart(page);
  await check('after a reload with the same link, no card', async () => {
    await expect(page.locator('#resume')).toBeHidden();
  });
  await openApp(page);
  await waitForStart(page);
  await check('without the link, no card either: nothing was saved', async () => {
    await expect(page.locator('#resume')).toBeHidden();
    expect(await storedRecord(page, 'edits')).toBeNull();
  });
});

test('STA-17.2 Without an on-device database nothing is saved [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  // The browser's IndexedDB is taken away from the page before the app loads.
  await page.addInitScript(() => {
    Object.defineProperty(window, 'indexedDB', { value: undefined, configurable: true });
  });
  const hand = await startWithPhoto(page, testInfo);
  await check('the photo opens as usual, with no message', async () => {
    await expect(page.locator('#empty')).toBeHidden();
    const toast = await toastNow(page);
    expect(toast.isShown && toast.kind !== '').toBe(false);
  });
  await goToStepAndSee(page, hand, check, 'rotate', page.locator('#toolRotateRight'),
    'the Rotate step shows');
  await hand.tap(page.locator('#toolRotateRight'));
  await page.waitForTimeout(SETTLE_AFTER_SAVE_MS + SAVE_DELAY_MS);
  await check('the photo lies on its side; no error in the console', async () => {
    expect((await editState(page)).rotation.quarter).toBe(1);
    expect(check.consoleErrors()).toEqual([]);
  });
  await reloadToStart(page);
  await check('after a reload there is no card', async () => {
    await expect(page.locator('#resume')).toBeHidden();
  });
});

test('STA-17.3 A failed save shows the user nothing [phone]', async ({
  page,
  check,
}, testInfo) => {
  await refuseStorage(page, []);
  const warnings = [];
  page.on('console', message => {
    if (message.type() === 'warning') warnings.push(message.text());
  });
  const hand = await startWithPhoto(page, testInfo);
  await goToStep(page, 'rotate', hand);
  await waitForSaved(page, { tab: 'rotate' });
  await refuseStorageNow(page, 'edits');
  await hand.tap(page.locator('#toolRotateRight'));
  await page.waitForTimeout(SETTLE_AFTER_SAVE_MS + SAVE_DELAY_MS);
  await check('the photo lies on its side; no message shows over the photo', async () => {
    expect((await editState(page)).rotation.quarter).toBe(1);
    expect((await toastNow(page)).isShown).toBe(false);
  });
  await check('the console has a warning "[card-finisher] session edits not saved:"', async () => {
    const saveWarnings = warnings.filter(text => text.startsWith(
      '[card-finisher] session edits not saved:',
    ));
    expect(saveWarnings.length).toBeGreaterThan(0);
  });
});

// Opens the case's second photo with Open in the top bar and waits until it is open.
async function openSecondPhoto(page, hand) {
  await pickWith(page, hand, page.locator('#btnOpen'), SECOND_PHOTO);
  await waitForPhoto(page, SECOND_PHOTO);
}

test('STA-18.1 A new photo opens on Perspective with nothing to undo [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startWithPhoto(page, testInfo);
  await goToStep(page, 'rotate', hand);
  await check('the Rotate step shows', async () => {
    expect(await stepNow(page)).toBe('rotate');
  });
  const turn = page.locator('#toolRotateRight');
  await hand.tap(turn);
  await check('the photo lies on its side', async () => {
    expect((await editState(page)).rotation.quarter).toBe(1);
  });
  await hand.tap(turn);
  await check('the photo is upside down', async () => {
    expect((await editState(page)).rotation.quarter).toBe(2);
  });
  await hand.tap(page.locator('#btnUndo'));
  await check('Undo: on its side again, and Redo is on', async () => {
    expect((await editState(page)).rotation.quarter).toBe(1);
    await expect(page.locator('#btnRedo')).toBeEnabled();
  });
  await openSecondPhoto(page, hand);
  await check('IMG_9075.JPEG opens upright on Perspective, Undo and Redo greyed out', async () => {
    expect((await editState(page)).rotation.quarter).toBe(0);
    expect(await stepNow(page)).toBe('perspective');
    await expect(page.locator('#btnUndo')).toBeDisabled();
    await expect(page.locator('#btnRedo')).toBeDisabled();
  });
});

test('STA-18.2 A Levels change left unapplied does not carry over [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startWithPhoto(page, testInfo);
  await goToStep(page, 'levels', hand);
  await check('the Levels step shows', async () => {
    expect(await stepNow(page)).toBe('levels');
  });
  await hand.tap(page.locator('#toolAutoLevels'));
  await check('Discard and Apply are no longer greyed out, and a white dot sits on the Levels tab',
    async () => {
      await expect(page.locator('#btnDiscardLevels')).toBeEnabled();
      await expect(page.locator('#btnApplyLevels')).toBeEnabled();
      await expect(levelsMark(page)).toBeVisible();
    });
  await openSecondPhoto(page, hand);
  await check('IMG_9075.JPEG opens on Perspective; no dot on the Levels tab', async () => {
    expect(await stepNow(page)).toBe('perspective');
    await expect(levelsMark(page)).toBeHidden();
  });
  await goToStep(page, 'levels', hand);
  await check('on Levels, Discard and Apply are greyed out: nothing waits', async () => {
    await expect(page.locator('#btnDiscardLevels')).toBeDisabled();
    await expect(page.locator('#btnApplyLevels')).toBeDisabled();
  });
});

test('STA-18.3 A new photo is not marked as exported [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startWithPhoto(page, testInfo);
  await goToStep(page, 'export', hand);
  const nextCard = page.locator('#btnNextCard');
  await check('the Export step shows Download and no Next card', async () => {
    await expect(page.locator('#btnDownload')).toBeVisible();
    await expect(nextCard).toBeHidden();
  });
  await tapAndSeeQuestion(page, hand, check, page.locator('#btnDownload'),
    'a question box asks "Upscale to 2000 px?"');
  const saved = await answerAndSave(page, hand);
  await check('a file is saved, and Next card shows', async () => {
    expect(saved.name).toBe('IMG_9136-straight.jpg');
    await expect(nextCard).toBeVisible();
  });
  await pickWith(page, hand, nextCard, SECOND_PHOTO);
  await waitForPhoto(page, SECOND_PHOTO);
  await check('Next card opens IMG_9075.JPEG on the Perspective step', async () => {
    expect(await stepNow(page)).toBe('perspective');
  });
  await goToStep(page, 'export', hand);
  await check('on Export, no Next card: the new photo has not been exported', async () => {
    await expect(page.locator('#btnDownload')).toBeVisible();
    await expect(nextCard).toBeHidden();
  });
});

test('STA-18.4 A new photo opens fitted to the screen [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startWithPhoto(page, testInfo);
  const fit = page.locator('#btnFit');
  await check('no Fit to screen in the top bar', async () => {
    await expect(fit).toBeHidden();
  });
  const area = await page.locator('#view').boundingBox();
  const start = { x: area.x + PAN_INSET_PX, y: area.y + PAN_INSET_PX };
  await hand.drag(start, { x: start.x + PAN_DRAG_PX, y: start.y + PAN_DRAG_PX });
  await check('the photo moves with the finger, and Fit to screen shows', async () => {
    expect(await page.evaluate(() => window.CF.currentView().auto)).toBe(false);
    await expect(fit).toBeVisible();
  });
  await openSecondPhoto(page, hand);
  await check('IMG_9075.JPEG opens fitted to the screen; Fit to screen has gone', async () => {
    expect(await page.evaluate(() => window.CF.currentView().auto)).toBe(true);
    await expect(fit).toBeHidden();
  });
});

test('STA-18.5 Preview is off for a new photo [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startWithPhoto(page, testInfo);
  const preview = page.locator('#toolPreview');
  await hand.tap(preview);
  await check('Preview is On; the line reads PREVIEW and the handles are hidden', async () => {
    await expect(preview).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#perspectivePreviewLine')).toBeVisible();
    expect(await page.evaluate(() => window.__straightener.app.previewMode)).toBe(true);
  });
  await openSecondPhoto(page, hand);
  await check('IMG_9075.JPEG opens with Preview Off, its handles showing and the line NUDGE',
    async () => {
      await expect(preview).toHaveAttribute('aria-pressed', 'false');
      await expect(page.locator('#perspectivePreviewLine')).toBeHidden();
      await expect(page.locator('#perspectiveLine')).toContainText('Nudge');
      expect(await page.evaluate(() => window.__straightener.app.previewMode)).toBe(false);
    });
});

test('STA-18.6 The first corner is selected for a new photo [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startWithPhoto(page, testInfo);
  const line = page.locator('#perspectiveLine');
  const nextHandle = page.locator('#btnNextHandle');
  await check('the line reads NUDGE CORNER 1 OF 4', async () => {
    await expect(line).toContainText('Corner 1 of 4');
  });
  await hand.tap(nextHandle);
  await check('Next handle: the line reads NUDGE CORNER 2 OF 4', async () => {
    await expect(line).toContainText('Corner 2 of 4');
  });
  await hand.tap(nextHandle);
  await check('Next handle again: the line reads NUDGE CORNER 3 OF 4', async () => {
    await expect(line).toContainText('Corner 3 of 4');
  });
  await openSecondPhoto(page, hand);
  await check('IMG_9075.JPEG opens; the line reads NUDGE CORNER 1 OF 4', async () => {
    await expect(line).toContainText('Corner 1 of 4');
    expect(await page.evaluate(() => window.__straightener.app.selected)).toBe(0);
  });
});

test('STA-18.7 Tap to find card is not left waiting for a new photo [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startWithPhoto(page, testInfo);
  await openOptions(page, hand, 'perspective');
  const findCard = page.locator('#btnFindCard');
  await check('Tap to find card shows in Perspective options', async () => {
    await expect(findCard).toBeVisible();
  });
  await hand.tap(findCard);
  const status = page.locator('#perspectiveStatus');
  await check('the line reads "Tap the card in the photo." with Cancel', async () => {
    await expect(status).toContainText('Tap the card in the photo.');
    await expect(page.locator('#perspectiveStatusAction')).toBeVisible();
  });
  await openSecondPhoto(page, hand);
  await check('IMG_9075.JPEG opens with the line NUDGE CORNER 1 OF 4, no prompt and no Cancel',
    async () => {
      await expect(page.locator('#perspectiveLine')).toContainText('Corner 1 of 4');
      await expect(status).not.toContainText('Tap the card in the photo.');
      await expect(page.locator('#perspectiveStatusAction')).toBeHidden();
    });
});

// Turns Snap on and picks Flatten, checking each as a person sees it.
async function setSnapAndFlatten(page, hand, check) {
  const snap = page.locator('#toolSnap');
  await hand.tap(snap);
  await check('Snap is On', async () => {
    await expect(snap).toHaveAttribute('aria-pressed', 'true');
  });
  await hand.tap(page.locator('#toolFlatten'));
  await check('Flatten is selected; the line reads FLATTEN', async () => {
    await expect(page.locator('#toolFlatten')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#perspectiveLine')).toContainText('Flatten');
  });
}

test('STA-18.8 Snap and Flatten stay as set for a new photo [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startWithPhoto(page, testInfo);
  await setSnapAndFlatten(page, hand, check);
  await openSecondPhoto(page, hand);
  await check('IMG_9075.JPEG opens with Flatten still selected, the line FLATTEN, and Snap On',
    async () => {
      await expect(page.locator('#toolFlatten')).toHaveAttribute('aria-pressed', 'true');
      await expect(page.locator('#perspectiveLine')).toContainText('Flatten');
      await expect(page.locator('#toolSnap')).toHaveAttribute('aria-pressed', 'true');
    });
});

test('STA-18.9 Snap and Flatten go back to their start after a reload [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startWithPhoto(page, testInfo);
  await setSnapAndFlatten(page, hand, check);
  await waitForSaved(page, { name: PHOTO, tab: 'perspective' });
  await reloadToStart(page);
  await check('the card offers "Resume IMG_9136.JPEG?"', async () => {
    await expect(page.locator('#resumeName')).toHaveText(PHOTO);
  });
  await resumeAs(page, hand, PHOTO);
  await check('it opens on Perspective with Nudge selected, the line NUDGE, and Snap Off',
    async () => {
      expect(await stepNow(page)).toBe('perspective');
      await expect(page.locator('#toolNudge')).toHaveAttribute('aria-pressed', 'true');
      await expect(page.locator('#perspectiveLine')).toContainText('Nudge');
      await expect(page.locator('#toolSnap')).toHaveAttribute('aria-pressed', 'false');
    });
});

test('STA-18.10 The card outlines found are those of the new photo [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startWithPhoto(page, testInfo);
  const candidate = page.locator('#toolCandidate');
  await check(`Candidate reads 1/${FIRST_PHOTO_OUTLINES}`, async () => {
    await expect(candidate.locator('.tool-value')).toHaveText(`1/${FIRST_PHOTO_OUTLINES}`);
  });
  const cornersBefore = (await editState(page)).corners;
  await hand.tap(candidate);
  await check(`Candidate reads 2/${FIRST_PHOTO_OUTLINES}; the handles move to the second outline`,
    async () => {
      await expect(candidate.locator('.tool-value')).toHaveText(`2/${FIRST_PHOTO_OUTLINES}`);
      expect((await editState(page)).corners).not.toEqual(cornersBefore);
    });
  await openSecondPhoto(page, hand);
  const found = await page.evaluate(() => {
    const app = window.__straightener.app;
    const best = app.detection.candidates[0];
    return { corners: app.state.corners, best: best ? best.corners : null };
  });
  await check(`IMG_9075.JPEG opens; Candidate reads 1/${SECOND_PHOTO_OUTLINES}, its handles on `
    + 'its own first outline', async () => {
    await expect(candidate.locator('.tool-value')).toHaveText(`1/${SECOND_PHOTO_OUTLINES}`);
    expect(found.best).not.toBeNull();
    expect(found.corners).toEqual(found.best);
  });
});

test('STA-18.11 Pick white is not left armed for a new photo [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startWithPhoto(page, testInfo);
  const pickWhite = page.locator('#levelsPicks .segment[data-value="white"]');
  const hint = page.locator('#levelsHint');
  await goToStepAndSee(page, hand, check, 'levels', pickWhite, 'the Levels step shows Pick white');
  await hand.tap(pickWhite);
  await check('Pick white is selected (solid white); the line reads "Tap something white"',
    async () => {
      await expect(pickWhite).toHaveAttribute('aria-pressed', 'true');
      await expect(hint).toHaveText('Tap something white');
    });
  await openSecondPhoto(page, hand);
  await check('IMG_9075.JPEG opens on the Perspective step', async () => {
    expect(await stepNow(page)).toBe('perspective');
  });
  await goToStep(page, 'levels', hand);
  await check('on Levels, Pick white is not selected; the line reads "Pick white, or try Auto"',
    async () => {
      await expect(pickWhite).toHaveAttribute('aria-pressed', 'false');
      await expect(hint).toHaveText('Pick white, or try Auto');
    });
});

// A segment of one of Export's two-part controls (Size, Format) by its value.
function exportSegment(page, control, value) {
  return page.locator(`#${control} .segment[data-value="${value}"]`);
}

// A preset in Crop's row of sizes by its value (the label can be turned: 5:4 reads 4:5 for an
// upright card).
function cropPreset(page, value) {
  return page.locator(`.preset-chip[data-value="${value}"]:visible`);
}

// Expects a control to show as selected (a segment or a preset).
async function expectSelected(locator) {
  await expect(locator).toHaveAttribute('aria-pressed', 'true');
}

test('STA-19.1 With nothing remembered, a photo starts at 1:1, 2000 px, JPEG [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startWithPhoto(page, testInfo);
  await goToStep(page, 'crop', hand);
  await check('1:1 is selected in the row of sizes', async () => {
    await expectSelected(cropPreset(page, '1:1'));
  });
  await goToStep(page, 'export', hand);
  await check('2000 and JPEG are selected', async () => {
    await expectSelected(exportSegment(page, 'exportSize', String(EXPORT_LONG_EDGE_PX)));
    await expectSelected(exportSegment(page, 'exportFormat', 'jpeg'));
  });
  await openOptions(page, hand, 'export');
  await check('Quality reads 92%, Interpolation Bilinear, Fill outside photo White', async () => {
    await expect(page.locator('#qualityValue')).toHaveText('92%');
    await expect(page.locator('#interpValue')).toHaveText('Bilinear');
    await expect(page.locator('#fillValue')).toHaveText('White');
  });
});

// The named action "Start over with IMG_9075.JPEG" of STA-19.2 and 19.3: waits until the edits
// are saved (a person waits two seconds), reloads, taps Start fresh and opens the second photo
// with Open photo. Export options, if open, are closed first.
async function startOverWithSecondPhoto(page, hand, step) {
  if (step === 'export') await closeOptions(page, hand, 'export');
  await waitForSaved(page, { tab: step });
  await reloadToStart(page);
  await hand.tap(page.locator('#btnFresh'));
  await expect(page.locator('#resume')).toBeHidden();
  await pickWith(page, hand, page.locator('#btnOpenEmpty'), SECOND_PHOTO);
  await waitForPhoto(page, SECOND_PHOTO);
}

test('STA-19.2 The next photo starts from the crop size used last, after a reload too [phone] '
  + '[webkit]', async ({ page, check }, testInfo) => {
  const hand = await startWithPhoto(page, testInfo);
  await goToStep(page, 'crop', hand);
  await check('1:1 is selected (solid white) in the row of sizes', async () => {
    await expectSelected(cropPreset(page, '1:1'));
  });
  await hand.tap(cropPreset(page, '5:4'));
  await check('4:5 is selected', async () => {
    await expectSelected(cropPreset(page, '5:4'));
    await expect(cropPreset(page, '5:4')).toContainText('4:5');
  });
  await startOverWithSecondPhoto(page, hand, 'crop');
  await check('IMG_9075.JPEG opens on the Perspective step', async () => {
    expect((await editState(page)).source.name).toBe(SECOND_PHOTO);
    expect(await stepNow(page)).toBe('perspective');
  });
  await goToStep(page, 'crop', hand);
  await check('on Crop, 4:5 is selected', async () => {
    await expectSelected(cropPreset(page, '5:4'));
    expect((await editState(page)).crop.preset).toBe('5:4');
  });
});

test('STA-19.3 The next photo starts from the export settings used last, after a reload too '
  + '[phone] [webkit]', async ({ page, check }, testInfo) => {
  const hand = await startWithPhoto(page, testInfo);
  await goToStep(page, 'export', hand);
  await check('2000 and JPEG are selected', async () => {
    await expectSelected(exportSegment(page, 'exportSize', String(EXPORT_LONG_EDGE_PX)));
    await expectSelected(exportSegment(page, 'exportFormat', 'jpeg'));
  });
  await hand.tap(exportSegment(page, 'exportSize', '1080'));
  await check('1080 is selected', async () => {
    await expectSelected(exportSegment(page, 'exportSize', '1080'));
  });
  await hand.tap(exportSegment(page, 'exportFormat', 'webp'));
  await check('WebP is selected', async () => {
    await expectSelected(exportSegment(page, 'exportFormat', 'webp'));
  });
  await openOptions(page, hand, 'export');
  await check('Quality reads 92%', async () => {
    await expect(page.locator('#qualityValue')).toHaveText('92%');
  });
  // The slider is set as a finger leaves it: its value, with the events a drag sends.
  await page.locator('#quality').fill('0.8');
  await check('Quality reads 80%', async () => {
    await expect(page.locator('#qualityValue')).toHaveText('80%');
  });
  // The rows open the phone's own pickers, which a script answers through their select.
  await page.locator('#interp').selectOption('bicubic');
  await check('Interpolation reads Bicubic', async () => {
    await expect(page.locator('#interpValue')).toHaveText('Bicubic');
  });
  await page.locator('#fill').selectOption('#000000');
  await check('Fill outside photo reads Black', async () => {
    await expect(page.locator('#fillValue')).toHaveText('Black');
  });
  await startOverWithSecondPhoto(page, hand, 'export');
  await check('IMG_9075.JPEG opens on the Perspective step', async () => {
    expect((await editState(page)).source.name).toBe(SECOND_PHOTO);
    expect(await stepNow(page)).toBe('perspective');
  });
  await goToStep(page, 'export', hand);
  await check('on Export, 1080 and WebP are selected', async () => {
    await expectSelected(exportSegment(page, 'exportSize', '1080'));
    await expectSelected(exportSegment(page, 'exportFormat', 'webp'));
  });
  await openOptions(page, hand, 'export');
  await check('Quality reads 80%, Interpolation Bicubic and Fill outside photo Black', async () => {
    await expect(page.locator('#qualityValue')).toHaveText('80%');
    await expect(page.locator('#interpValue')).toHaveText('Bicubic');
    await expect(page.locator('#fillValue')).toHaveText('Black');
  });
});

// The mean difference (0 to 255) between two grids of cells, comparing each cell of `turned`
// with the cell of `upright` that `twinOf(row, column)` names.
function cellsDifference(upright, turned, twinOf) {
  let total = 0;
  for (let row = 0; row < ORIENTATION_GRID; row++) {
    for (let column = 0; column < ORIENTATION_GRID; column++) {
      const [twinRow, twinColumn] = twinOf(row, column);
      const cell = turned.cells[row * ORIENTATION_GRID + column];
      const twin = upright.cells[twinRow * ORIENTATION_GRID + twinColumn];
      for (let channel = 0; channel < 3; channel++) {
        total += Math.abs(cell[channel] - twin[channel]);
      }
    }
  }
  return total / (ORIENTATION_GRID * ORIENTATION_GRID * 3);
}

test('STA-20.1 A photo marked as taken sideways opens turned the way it was taken [phone] '
  + '[webkit]', async ({ page, check }, testInfo) => {
  const hand = await startWithPhoto(page, testInfo);
  const upright = await previewCells(page, ORIENTATION_GRID);
  await check('the card stands upright', async () => {
    expect(upright.height).toBeGreaterThan(upright.width);
  });
  await goToStep(page, 'export', hand);
  await openOptions(page, hand, 'export');
  await check('the source line starts "Source 1498 × 2098 px"', async () => {
    expect(await sourceLine(page)).toMatch(/^Source 1498 × 2098 px/);
  });
  await closeOptions(page, hand, 'export');
  await check('the photo shows whole above the controls', async () => {
    await expect(page.locator('#exportSheet .sheet-close')).toBeHidden();
    await expect(page.locator('#view')).toBeVisible();
  });
  const sideways = sampleWithOrientation(PHOTO, ORIENTATION_QUARTER_CLOCKWISE, SIDEWAYS_PHOTO);
  await pickWith(page, hand, page.locator('#btnOpen'), sideways);
  await waitForPhoto(page, SIDEWAYS_PHOTO);
  const turned = await previewCells(page, ORIENTATION_GRID);
  // Turned a quarter clockwise, the picture's row r, column c shows the upright picture's
  // row (last - c), column r.
  const last = ORIENTATION_GRID - 1;
  const clockwise = cellsDifference(upright, turned, (row, column) => [last - column, row]);
  const counterclockwise = cellsDifference(upright, turned, (row, column) => [column, last - row]);
  testInfo.annotations.push({
    type: 'measured',
    description: `difference: clockwise ${clockwise.toFixed(1)}, `
      + `counterclockwise ${counterclockwise.toFixed(1)}`,
  });
  await check('the same card lies on its side, its top to the right: turned a quarter clockwise',
    async () => {
      expect(turned.width).toBeGreaterThan(turned.height);
      expect(clockwise).toBeLessThan(SAME_PICTURE_MAX);
    });
  await goToStep(page, 'export', hand);
  await openOptions(page, hand, 'export');
  await check('the source line starts "Source 2098 × 1498 px"', async () => {
    expect(await sourceLine(page)).toMatch(/^Source 2098 × 1498 px/);
  });
});

test('STA-21.2 A browser that can\'t open HEIC says so [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnStartScreen(page, testInfo);
  await pickWith(page, hand, page.locator('#btnOpenEmpty'), heicStandIn());
  await check('a red message says the browser can\'t open HEIC; the start screen stays, no photo',
    async () => {
      await expect(page.locator('#toast')).toContainText(HEIC_MESSAGE);
      expect((await toastNow(page)).kind).toBe('error');
      await expect(page.locator('#empty')).toBeVisible();
      expect(await hasPhoto(page)).toBe(false);
    });
});

test('STA-22.1 A file that isn\'t an image opens nothing [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnStartScreen(page, testInfo);
  await pickWith(page, hand, page.locator('#btnOpenEmpty'), notAPhoto());
  await check('a red message says "Couldn’t read that file as an image."; the start screen stays',
    async () => {
      await expect(page.locator('#toast')).toContainText(NOT_AN_IMAGE_MESSAGE);
      expect((await toastNow(page)).kind).toBe('error');
      await expect(page.locator('#empty')).toBeVisible();
      expect(await hasPhoto(page)).toBe(false);
    });
});

test('STA-22.2 A file that isn\'t an image leaves the open photo as it was [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startWithPhoto(page, testInfo);
  await goToStep(page, 'rotate', hand);
  await check('the Rotate step shows', async () => {
    expect(await stepNow(page)).toBe('rotate');
  });
  await hand.tap(page.locator('#toolRotateRight'));
  await check('the photo lies on its side and Undo is on', async () => {
    expect((await editState(page)).rotation.quarter).toBe(1);
    await expect(page.locator('#btnUndo')).toBeEnabled();
  });
  await pickWith(page, hand, page.locator('#btnOpen'), notAPhoto());
  await check('the red message shows; IMG_9136.JPEG stays on Rotate, on its side, Undo on',
    async () => {
      await expect(page.locator('#toast')).toContainText(NOT_AN_IMAGE_MESSAGE);
      expect((await toastNow(page)).kind).toBe('error');
      const state = await editState(page);
      expect(state.source.name).toBe(PHOTO);
      expect(state.rotation.quarter).toBe(1);
      expect(await stepNow(page)).toBe('rotate');
      await expect(page.locator('#btnUndo')).toBeEnabled();
    });
});

test('STA-22.3 After a failed open, the open photo\'s edits are still kept for Resume [phone] '
  + '[webkit]', async ({ page, check }, testInfo) => {
  const hand = await startWithPhoto(page, testInfo);
  await goToStep(page, 'rotate', hand);
  await waitForSaved(page, { name: PHOTO, tab: 'rotate' });
  await pickWith(page, hand, page.locator('#btnOpen'), notAPhoto());
  await check('the red message shows; IMG_9136.JPEG stays open', async () => {
    await expect(page.locator('#toast')).toContainText(NOT_AN_IMAGE_MESSAGE);
    expect((await editState(page)).source.name).toBe(PHOTO);
  });
  await hand.tap(page.locator('#toolRotateRight'));
  await check('the photo lies on its side', async () => {
    expect((await editState(page)).rotation.quarter).toBe(1);
  });
  // A person waits two seconds; the save, if it comes, lands 0.1 s after the tap.
  await page.waitForTimeout(SETTLE_AFTER_SAVE_MS + SAVE_DELAY_MS);
  await reloadToStart(page);
  await check('the card offers "Resume IMG_9136.JPEG?"', async () => {
    await expect(page.locator('#resumeName')).toHaveText(PHOTO);
  });
  await resumeAs(page, hand, PHOTO);
  // A plain reading, not a retrying one: the resumed edits are what they are.
  const resumed = await editState(page);
  await check('it opens on Rotate, lying on its side: the turn was kept', async () => {
    expect(await stepNow(page)).toBe('rotate');
    expect(resumed.rotation.quarter).toBe(1);
  });
});

// Collects the names of the photos the app finishes opening, from the line it logs for each
// ("[card-finisher] <name>: <width>×<height> loaded + previewed in …"). Returns the list, which
// fills as photos open.
function watchOpenedPhotos(page) {
  const opened = [];
  page.on('console', message => {
    const match = /^\[card-finisher\] (.+): \d+×\d+ loaded/.exec(message.text());
    if (match) opened.push(match[1]);
  });
  return opened;
}

test('STA-23.1 A photo chosen while another is loading is the one that opens [phone]', async ({
  page,
  check,
}, testInfo) => {
  // A stand-in for a photo large enough to take a moment to load: this one is held back.
  await slowDecodeOf(page, PHOTO, SLOW_LOAD_MS);
  const hand = await startOnStartScreen(page, testInfo);
  const opened = watchOpenedPhotos(page);
  await pickWith(page, hand, page.locator('#btnOpenEmpty'), PHOTO);
  // Plain readings at once: the case needs the first photo still loading here.
  const toast = await toastNow(page);
  const isStartShown = await page.locator('#empty').isVisible();
  await check('"Loading…" shows over the start screen', async () => {
    expect(toast.text).toBe('Loading…');
    expect(toast.isShown).toBe(true);
    expect(isStartShown).toBe(true);
  });
  await pickWith(page, hand, page.locator('#btnOpenEmpty'), SECOND_PHOTO);
  await waitForPhoto(page, SECOND_PHOTO);
  await check('IMG_9075.JPEG opens', async () => {
    expect((await editState(page)).source.name).toBe(SECOND_PHOTO);
  });
  await page.waitForTimeout(STILL_OPEN_WAIT_MS);
  await check('three seconds later IMG_9075.JPEG is still open: the first photo never showed',
    async () => {
      expect((await editState(page)).source.name).toBe(SECOND_PHOTO);
      expect(opened).toEqual([SECOND_PHOTO]);
    });
});

test('STA-24.2 A 48 MP photo is worked on from smaller copies [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  // Making the 48 MP copy and decoding it take several seconds, more in WebKit.
  test.slow();
  const hand = await startOnStartScreen(page, testInfo);
  const big = await enlargedSample(page, PHOTO, BIG_PHOTO_FACTOR, BIG_PHOTO);
  await pickWith(page, hand, page.locator('#btnOpenEmpty'), big);
  await waitForPhoto(page, BIG_PHOTO);
  await check('it opens on Perspective, handles on the card; copies of 2048, 720 and 1000 px',
    async () => {
      expect(await stepNow(page)).toBe('perspective');
      const found = await page.evaluate(() => {
        const app = window.__straightener.app;
        const best = app.detection.candidates[0];
        return { corners: app.state.corners, best: best ? best.corners : null };
      });
      expect(found.best).not.toBeNull();
      expect(found.corners).toEqual(found.best);
      expect(await copyLongSides(page)).toEqual({
        preview: PREVIEW_COPY_PX,
        thumb: LIVE_COPY_PX,
        work: DETECTION_COPY_PX,
      });
    });
  await goToStepAndSee(page, hand, check, 'export', page.locator('#btnDownload'),
    'the Export step shows Download');
  await openOptions(page, hand, 'export');
  await check('the source line starts "Source 5842 × 8182 px (47.8 MP)"', async () => {
    const expected = `Source ${BIG_PHOTO_WIDTH} × ${BIG_PHOTO_HEIGHT} px (47.8 MP)`;
    expect((await sourceLine(page)).startsWith(expected)).toBe(true);
  });
  await closeOptions(page, hand, 'export');
  await check('Download shows in the controls', async () => {
    await expect(page.locator('#btnDownload')).toBeVisible();
  });
  const downloading = page.waitForEvent('download');
  await hand.tap(page.locator('#btnDownload'));
  const download = await downloading;
  const isAsked = await page.locator('#pairPrompt').isVisible();
  const saved = await readSavedImage(page, await download.path());
  await check('a file 2000 px on its long side is saved, with no question first', async () => {
    expect(isAsked).toBe(false);
    expect(Math.max(saved.width, saved.height)).toBe(EXPORT_LONG_EDGE_PX);
  });
});

test('STA-25.1 Cancelling Open keeps the photo and its edits [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startWithPhoto(page, testInfo);
  await goToStep(page, 'rotate', hand);
  await check('the Rotate step shows', async () => {
    expect(await stepNow(page)).toBe('rotate');
  });
  await hand.tap(page.locator('#toolRotateRight'));
  await check('the photo lies on its side and Undo is on', async () => {
    expect((await editState(page)).rotation.quarter).toBe(1);
    await expect(page.locator('#btnUndo')).toBeEnabled();
  });
  await page.evaluate(() => {
    window.testPhotoKept = window.__straightener.app.img;
  });
  const chooser = await pickWith(page, hand, page.locator('#btnOpen'), null);
  await check('the file picker opens', async () => {
    expect(chooser.isMultiple()).toBe(false);
  });
  await check('cancelled: IMG_9136.JPEG still open on Rotate, on its side, Undo on, no message',
    async () => {
      const isSamePhoto = await page.evaluate(
        () => window.__straightener.app.img === window.testPhotoKept,
      );
      expect(isSamePhoto).toBe(true);
      expect((await editState(page)).rotation.quarter).toBe(1);
      expect(await stepNow(page)).toBe('rotate');
      await expect(page.locator('#btnUndo')).toBeEnabled();
      expect((await toastNow(page)).isShown).toBe(false);
    });
});

test('STA-25.2 Cancelling Next card keeps the exported photo [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startWithPhoto(page, testInfo);
  await goToStep(page, 'export', hand);
  const nextCard = page.locator('#btnNextCard');
  await tapAndSeeQuestion(page, hand, check, page.locator('#btnDownload'),
    'a question box asks "Upscale to 2000 px?"');
  const saved = await answerAndSave(page, hand);
  await check('a file is saved, and Next card shows', async () => {
    expect(saved.name).toBe('IMG_9136-straight.jpg');
    await expect(nextCard).toBeVisible();
  });
  const chooser = await pickWith(page, hand, nextCard, null);
  await check('Next card opens the file picker', async () => {
    expect(chooser.isMultiple()).toBe(false);
  });
  await check('cancelled: IMG_9136.JPEG still open on Export, with Next card', async () => {
    expect((await editState(page)).source.name).toBe(PHOTO);
    expect(await stepNow(page)).toBe('export');
    await expect(nextCard).toBeVisible();
  });
});

test('STA-25.3 Cancelling Add back leaves the photo unpaired [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startWithPhoto(page, testInfo, FRONT);
  await goToStep(page, 'export', hand);
  const addBackButton = page.locator('#btnAddBack');
  const chooser = await pickWith(page, hand, addBackButton, null);
  await check('Add back opens the file picker', async () => {
    expect(chooser.isMultiple()).toBe(false);
  });
  await check('cancelled: still on Export, Add back showing, no Front or Back', async () => {
    expect((await editState(page)).source.name).toBe(FRONT);
    expect(await stepNow(page)).toBe('export');
    await expect(addBackButton).toBeVisible();
    await expect(page.locator('#sideSwitch')).toBeHidden();
  });
  await pickWith(page, hand, page.locator('#btnOpen'), FRONT);
  await waitForPhoto(page, FRONT);
  await check('Open opens it as a new photo on Perspective, with no Front or Back', async () => {
    expect(await stepNow(page)).toBe('perspective');
    await expect(page.locator('#sideSwitch')).toBeHidden();
    expect(await page.evaluate(() => !!window.__straightener.app.pair)).toBe(false);
  });
});
