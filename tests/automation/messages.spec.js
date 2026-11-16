// The Messages cases (tests/catalog/messages.md): every message the app shows. Each case brings
// a message up the way a person would and checks its words and its kind: information (a white
// pill), a warning (amber, a triangle), an error (red, a circle), or a line above the controls.
// Many messages are raised by steps the finished areas already use; their helpers are reused
// here. A message no control can reach is raised by a stand-in, which the case names.
// Each test drives the app through hand.tap and hand.drag, and reads the app's state only to
// check a result.
'use strict';
const { test, expect } = require('./support/case.js');
const {
  openApp,
  openPhoto,
  goToStep,
  editState,
  handFor,
  middleOf,
  openOptions,
  closeOptions,
  saveByDownload,
  readSavedImage,
  cornerOnPage,
  waitForStill,
} = require('./support/app.js');
const {
  pickWith,
  waitForStart,
  waitForSaved,
  reloadToStart,
  resumeAs,
  changeSavedEdits,
  refuseStorage,
  notAPhoto,
  heicStandIn,
  addLogo,
} = require('./support/start-and-session.js');
const {
  CORNER_PHOTO,
  NO_CORNER_QUESTION,
  startOnExport,
  openCornerSheet,
  chooseCornerOutput,
  cornerReadout,
  saveCorners,
  questionCard,
  questionButton,
  expectQuestion,
  makeCornerShotsImpossible,
} = require('./support/corner-shots.js');
const {
  SHARE_FAILURE_MESSAGE,
  choiceButton,
  chooseFill,
  saveFileBy,
  waitForExportEnd,
  takeAwayWebpSaving,
  waitForQuestion,
} = require('./support/export.js');
const {
  makePair,
  sideButton,
  switchTo,
  holdNextOpening,
  releaseOpening,
  waitForOpening,
  downloadAll,
  chooseOutput,
  chooseSize,
  waitUntilPairStored,
  reloadToResume,
  resume,
  failReadsOf,
  changeStoredPair,
  crossCorners,
  PORTRAIT_PAIR,
} = require('./support/front-and-back.js');
const {
  startOnBlank,
  openPicture,
  tapAt,
} = require('./support/perspective.js');
const {
  LEVELS_PHOTO,
  SPOTS,
  startOnLevels,
  pickButton,
  armedPick,
  pickSpot,
  tapPoint,
  photoPointAt,
  viewNow,
  whitePicture,
} = require('./support/levels.js');
const {
  startOnOverlay,
  textNamedPng,
  oversizedPng,
  gifLogo,
} = require('./support/overlay.js');
const {
  TOAST_LOOKS,
  watchMessages,
  messagesSoFar,
  fadingCopies,
  waitForMessage,
  expectKind,
  shownForMs,
  statusNow,
  expectStatus,
  watchStatus,
  statusesSoFar,
  refuseDetection,
  failEncoding,
  slowEncoding,
  refuseClipboard,
  faultGeometry,
  clearGeometryFault,
  jsonFile,
  readEdits,
  exportNotesNow,
  visibleTips,
} = require('./support/messages.js');

// The photo most cases use: a raw chrome card flat on a black mat. It is found the same in
// Chromium and WebKit.
const PHOTO = CORNER_PHOTO;
// A second photo, of another size: a PSA slab (1498 × 2098 px).
const SLAB_PHOTO = 'IMG_9136.JPEG';
// A card whose framed picture has no clear black, for Auto's white-only message.
const NO_BLACK_PHOTO = '13_front_landscape_onetouch_labeled_white.JPEG';
const FRONT = PORTRAIT_PAIR.front;
const BACK = PORTRAIT_PAIR.back;
// How long each kind of message stays, in ms (TOAST_DURATIONS_MS in js/app/core.js), and how
// far a measured time may be from it: the page's timer and the recorder's own reaction.
const INFO_MS = 3000;
const WARN_MS = 5000;
const ERROR_MS = 6000;
const LONG_ERROR_MS = 8000;
const EARLY_MS = 50;
const LATE_MS = 400;
// The messages' words, as the app writes them.
const AUTO_BOTH = 'Auto set white and black points. Check them, then Apply.';
const AUTO_WHITE_ONLY = 'Auto set the white point (no clear black). Check it, then Apply.';
const AUTO_FAILED = 'Couldn’t estimate levels from this image.';
const OUTSIDE_PHOTO = 'That spot is outside the photo.';
const DARKER_THAN_BLACK = 'That spot is darker than the black point. Pick something brighter.';
const TOO_LIGHT_FOR_BLACK = 'That spot is too light to be a black point. '
  + 'Pick something dark, or skip the black point.';
const BRIGHTER_THAN_WHITE = 'That spot is brighter than the white point. Pick something darker.';
const HEIC_MESSAGE = 'This browser can’t open HEIC. Save the photo as JPEG first '
  + '(Safari opens HEIC directly).';
const NOT_AN_IMAGE = 'Couldn’t read that file as an image.';
const RESUMED = 'Resumed where you left off.';
const NO_CARD_FOUND = 'No card-shaped edges found. Drag the corners into place, or tap to find '
  + 'card and tap the card again.';
const PHOTO_GONE = 'The saved photo is gone. Open it again.';
const NOT_JSON = 'That file isn’t valid JSON.';
// A stand-in failure's own words, which ruling R24 keeps out of the message.
const STAND_IN_ERROR = 'Stand-in failure 4417';
// How far the photo is dragged to show the empty area past its left edge, in CSS px, and how
// far in from the photo area's left edge the tap outside the photo lands (LEV-12.1's steps).
const PAN_PX = 200;
const EDGE_INSET_PX = 15;
// How far MSG-04.1's drag moves the photo, in CSS px, and how close the move must be.
const DRAG_PX = 60;
const DRAG_TOLERANCE_PX = 1;
// The toast's place (css/app.css, the toast part), in CSS px: on a phone 16 px in from each
// side and 36 px above the photo's bottom edge; on a wide screen 20 px up, centered, at most
// 460 px wide.
const PHONE_SIDE_PX = 16;
const PHONE_BOTTOM_PX = 36;
const WIDE_BOTTOM_PX = 20;
const WIDE_MAX_WIDTH_PX = 460;
const PLACE_TOLERANCE_PX = 1;
// The toast's text line (css/app.css): 18 px, and three lines at most.
const TOAST_LINE_PX = 18;
const TOAST_LINES_MAX = 3;
// A stand-in failure long enough to need more than three lines of the toast on a phone.
const LONG_ERROR = 'Stand-in failure with a long explanation: the engine stopped part of the '
  + 'way through the search for the card, after reading every edge it found in the photo, and '
  + 'gave up before it could say which of them belonged to the card and which to the mat.';
// How long a case waits for something that should not come, in ms.
const NOTHING_WAIT_MS = 3000;

// Opens the app with `photo` (PHOTO unless named) and goes to `step` (Export unless named),
// recording every message from the start. address: a link with settings in it. share: the
// stand-in share sheet's behavior (support/export.js). Returns the hand for this target.
async function start(page, testInfo, options = {}) {
  await watchMessages(page);
  return startOnExport(page, testInfo, { photo: PHOTO, ...options });
}

// Opens the app on the start screen, recording every message. Returns the hand.
async function startOnStartScreen(page, testInfo) {
  await watchMessages(page);
  await openApp(page);
  await waitForStart(page);
  return handFor(page, testInfo);
}

// Opens the app with `photo` on the Levels step, recording every message. Returns the hand.
async function startLevels(page, testInfo, photo = LEVELS_PHOTO) {
  await watchMessages(page);
  return startOnLevels(page, testInfo, { photo });
}

// The toast and the photo area on the page: { toast, stage } as { left, right, top, bottom,
// width } in CSS px, read once the toast has finished rising.
async function toastPlace(page) {
  await waitForStill(page);
  return page.evaluate(() => {
    const box = element => {
      const rect = element.getBoundingClientRect();
      return {
        left: rect.left,
        right: rect.right,
        top: rect.top,
        bottom: rect.bottom,
        width: rect.width,
      };
    };
    return {
      toast: box(document.getElementById('toast')),
      stage: box(document.getElementById('stage')),
    };
  });
}

// Expects two numbers to be within PLACE_TOLERANCE_PX of each other.
function expectNear(actual, expected) {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(PLACE_TOLERANCE_PX);
}

// Expects a recorded message to have stayed up `durationMs`, within EARLY_MS and LATE_MS.
function expectStayed(message, durationMs) {
  const stayedMs = shownForMs(message);
  expect(stayedMs).not.toBeNull();
  expect(stayedMs).toBeGreaterThanOrEqual(durationMs - EARLY_MS);
  expect(stayedMs).toBeLessThanOrEqual(durationMs + LATE_MS);
}

// Waits until a recorded message has gone, and returns its record.
async function waitUntilGone(page, text, timeoutMs) {
  await page.waitForFunction(wanted => window.testMessages.some(message => (
    message.text === wanted && message.hiddenAtMs !== null)), text, { timeout: timeoutMs });
  return (await messagesSoFar(page)).find(message => message.text === text);
}

// Taps Load edits in Export options and chooses `file` (a file payload) in its picker.
async function loadEditsFile(page, hand, file) {
  await openOptions(page, hand, 'export');
  await pickWith(page, hand, page.locator('#btnLoadEdits'), file);
}

// Arms Tap to find card in Perspective options; on a phone it waits for the sheet to slide
// away before the photo is tapped.
async function armFindCard(page, hand) {
  await openOptions(page, hand, 'perspective');
  await hand.tap(page.locator('#btnFindCard'));
  if (hand.isTouch) await page.locator('#perspectiveSheet').waitFor({ state: 'hidden' });
}

// The middle of the photo area on the page, in CSS px.
function photoAreaMiddle(page) {
  return middleOf(page.locator('#view'));
}

// Raises an error message: on Export, Load edits with a file that isn't JSON. Returns the
// record of "That file isn’t valid JSON.".
async function raiseError(page, hand) {
  await goToStep(page, 'export', hand);
  await loadEditsFile(page, hand, jsonFile('notes.json', 'These are notes, not edits.'));
  return waitForMessage(page, NOT_JSON);
}

test('MSG-01.1 A new message takes the place of the one showing at once [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startLevels(page, testInfo);
  await hand.tap(page.locator('#toolAutoLevels'));
  await waitForMessage(page, AUTO_BOTH);
  await check(`"${AUTO_BOTH}" shows over the photo`, async () => {
    await expect(page.locator('#toast')).toHaveClass(/is-shown/);
    await expect(page.locator('#toast .toast-text')).toHaveText(AUTO_BOTH);
  });
  await pickSpot(page, hand, 'black', SPOTS.white);
  await waitForMessage(page, TOO_LIGHT_FOR_BLACK);
  const messages = await messagesSoFar(page);
  const [first, second] = messages.slice(-2);
  await check(`"${TOO_LIGHT_FOR_BLACK}" takes its place at once, the first fading out beneath `
    + 'it; one message shows', async () => {
    expect([first.text, second.text]).toEqual([AUTO_BOTH, TOO_LIGHT_FOR_BLACK]);
    expect(first.hiddenAtMs).toBe(second.shownAtMs);
    expect(await fadingCopies(page)).toEqual([AUTO_BOTH]);
    await expect(page.locator('.toast-message.is-shown:not(.is-ghost)')).toHaveCount(1);
  });
});

test('MSG-01.2 The message sits over the photo\'s bottom edge [both]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startLevels(page, testInfo);
  await pickSpot(page, hand, 'black', SPOTS.white);
  await waitForMessage(page, TOO_LIGHT_FOR_BLACK);
  const { toast, stage } = await toastPlace(page);
  if (hand.isTouch) {
    await check('on a phone the message spans the photo area less 16 px each side, its bottom '
      + '36 px above the photo area\'s bottom edge', () => {
      expectNear(toast.left, stage.left + PHONE_SIDE_PX);
      expectNear(toast.right, stage.right - PHONE_SIDE_PX);
      expectNear(toast.bottom, stage.bottom - PHONE_BOTTOM_PX);
    });
    return;
  }
  await check('on a wide screen the message is centered, its bottom 20 px above the photo '
    + 'area\'s bottom edge, at most 460 px wide', () => {
    expectNear(toast.left + toast.width / 2, stage.left + (stage.right - stage.left) / 2);
    expectNear(toast.bottom, stage.bottom - WIDE_BOTTOM_PX);
    expect(toast.width).toBeLessThanOrEqual(WIDE_MAX_WIDTH_PX);
  });
});

test('MSG-02.1 Information stays 3 s, a warning 5 s and an error 6 s [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startLevels(page, testInfo);
  await hand.tap(page.locator('#toolAutoLevels'));
  const info = await waitUntilGone(page, AUTO_BOTH, INFO_MS * 2);
  await check(`"${AUTO_BOTH}" stays 3 s`, () => {
    expectStayed(info, INFO_MS);
  });
  await pickSpot(page, hand, 'black', SPOTS.white);
  const warning = await waitUntilGone(page, TOO_LIGHT_FOR_BLACK, WARN_MS * 2);
  await check(`"${TOO_LIGHT_FOR_BLACK}" stays 5 s`, () => {
    expectStayed(warning, WARN_MS);
  });
  await raiseError(page, hand);
  const error = await waitUntilGone(page, NOT_JSON, ERROR_MS * 2);
  await check(`"${NOT_JSON}" stays 6 s`, () => {
    expectStayed(error, ERROR_MS);
  });
});

test('MSG-03.1 Information is white, a warning amber with a triangle, an error red with a '
  + 'circle [phone]', async ({ page, check }, testInfo) => {
  const hand = await startLevels(page, testInfo);
  await hand.tap(page.locator('#toolAutoLevels'));
  const info = await waitForMessage(page, AUTO_BOTH);
  await check(`"${AUTO_BOTH}" is a white pill with no icon`, () => {
    expectKind(info, 'info');
  });
  await pickSpot(page, hand, 'black', SPOTS.white);
  const warning = await waitForMessage(page, TOO_LIGHT_FOR_BLACK);
  await check(`"${TOO_LIGHT_FOR_BLACK}" is amber, led by a triangle`, () => {
    expectKind(warning, 'warn');
  });
  const error = await raiseError(page, hand);
  await check(`"${NOT_JSON}" is red, led by a circle`, () => {
    expectKind(error, 'error');
  });
});

test('MSG-03.2 The three kinds of message, for a person to judge [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startLevels(page, testInfo);
  await hand.tap(page.locator('#toolAutoLevels'));
  await waitForMessage(page, AUTO_BOTH);
  await check.eye('a white pill with dark bold text and no icon, over the photo\'s bottom edge');
  await pickSpot(page, hand, 'black', SPOTS.white);
  await waitForMessage(page, TOO_LIGHT_FOR_BLACK);
  await check.eye('an amber pill led by a dark triangle with an exclamation mark, its text '
    + 'readable against the amber');
  await raiseError(page, hand);
  await closeOptions(page, hand, 'export');
  await check.eye('a red pill led by a circle with an exclamation mark, its text white and '
    + 'readable against the red');
});

test('MSG-04.1 A drag that starts on a message moves the photo beneath it [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startLevels(page, testInfo);
  await hand.tap(page.locator('#toolAutoLevels'));
  await waitForMessage(page, AUTO_BOTH);
  const start = await middleOf(page.locator('#toast'));
  await check('the message covers the point the drag starts from', async () => {
    const box = await page.locator('#toast').boundingBox();
    expect(start.y).toBeGreaterThan(box.y);
    expect(start.y).toBeLessThan(box.y + box.height);
  });
  const before = await viewNow(page);
  // A real pointer, not a dispatched one, so the browser decides what is under it.
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + DRAG_PX, start.y, { steps: 8 });
  await page.mouse.up();
  await check('the photo moves 60 px to the right, as a drag on the photo does', async () => {
    const after = await viewNow(page);
    expect(Math.abs(after.panX - before.panX - DRAG_PX)).toBeLessThanOrEqual(DRAG_TOLERANCE_PX);
  });
});

test('MSG-04.2 A long message is cut to three lines [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await start(page, testInfo, { step: 'perspective' });
  // Stand-in: no photo makes detection fail, so the detector is made to throw a long error.
  await refuseDetection(page, LONG_ERROR);
  await armFindCard(page, hand);
  await tapAt(page, hand, await photoAreaMiddle(page));
  await waitForMessage(page, /^Detection failed: /);
  await check('the message shows three lines of text, the rest cut off', async () => {
    const text = await page.locator('#toast .toast-text').evaluate(element => ({
      shownPx: element.clientHeight,
      wholePx: element.scrollHeight,
      lineClamp: getComputedStyle(element).webkitLineClamp,
    }));
    expect(text.shownPx).toBe(TOAST_LINE_PX * TOAST_LINES_MAX);
    expect(text.wholePx).toBeGreaterThan(text.shownPx);
    expect(text.lineClamp).toBe(String(TOAST_LINES_MAX));
  });
});

test('MSG-04.3 A message is announced without interrupting [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startLevels(page, testInfo);
  await hand.tap(page.locator('#toolAutoLevels'));
  await waitForMessage(page, AUTO_BOTH);
  await check('the message is a polite status: read out when the screen reader is free',
    async () => {
      const toast = page.locator('#toast');
      await expect(toast).toHaveAttribute('role', 'status');
      await expect(toast).toHaveAttribute('aria-live', 'polite');
    });
});

test('MSG-05.1 A message rides above an open sheet [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startLevels(page, testInfo);
  await pickSpot(page, hand, 'black', SPOTS.white);
  await waitForMessage(page, TOO_LIGHT_FOR_BLACK);
  const resting = await toastPlace(page);
  await check('the message\'s bottom is 36 px above the photo area\'s bottom edge', () => {
    expectNear(resting.toast.bottom, resting.stage.bottom - PHONE_BOTTOM_PX);
  });
  await openOptions(page, hand, 'levels');
  const lifted = await toastPlace(page);
  const sheetTop = (await page.locator('#levelsSheet .sheet').boundingBox()).y;
  await check('with Levels tips open, the message\'s bottom is 36 px above the sheet\'s top edge',
    () => {
      expectNear(lifted.toast.bottom, sheetTop - PHONE_BOTTOM_PX);
    });
  await closeOptions(page, hand, 'levels');
  const lowered = await toastPlace(page);
  await check('with the sheet closed, the message is back 36 px above the photo area\'s bottom '
    + 'edge', () => {
    expectNear(lowered.toast.bottom, lowered.stage.bottom - PHONE_BOTTOM_PX);
  });
});

test('MSG-06.1 "Loading…" shows while a photo opens [phone]', async ({
  page,
  check,
}, testInfo) => {
  await startOnStartScreen(page, testInfo);
  await openPhoto(page, PHOTO);
  const [loading] = await messagesSoFar(page);
  await check('"Loading…" shows, white, while the photo opens', () => {
    expect(loading.text).toBe('Loading…');
    expectKind(loading, 'info');
  });
  await check('once the photo shows, "Loading…" has gone', async () => {
    expect(loading.hiddenAtMs).not.toBeNull();
    await expect(page.locator('#toast')).not.toHaveClass(/is-shown/);
  });
});

test('MSG-07.1 A HEIC photo the browser can\'t open [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnStartScreen(page, testInfo);
  await pickWith(page, hand, page.locator('#btnOpenEmpty'), heicStandIn());
  const message = await waitForMessage(page, HEIC_MESSAGE);
  await check(`a red message reads "${HEIC_MESSAGE}"`, () => {
    expectKind(message, 'error');
  });
  const gone = await waitUntilGone(page, HEIC_MESSAGE, ERROR_MS * 2);
  await check('it stays 6 s', () => {
    expectStayed(gone, ERROR_MS);
  });
});

test('MSG-08.1 A file that isn\'t a photo [phone]', async ({ page, check }, testInfo) => {
  const hand = await startOnStartScreen(page, testInfo);
  await pickWith(page, hand, page.locator('#btnOpenEmpty'), notAPhoto());
  const message = await waitForMessage(page, NOT_AN_IMAGE);
  await check(`a red message reads "${NOT_AN_IMAGE}"`, () => {
    expectKind(message, 'error');
  });
});

// Opens PHOTO on the start screen, waits until it is saved on the device and reloads to the
// start screen, which offers Resume. Returns the hand.
async function startWithSavedPhoto(page, testInfo) {
  const hand = await startOnStartScreen(page, testInfo);
  await openPhoto(page, PHOTO);
  await waitForSaved(page, { name: PHOTO });
  await reloadToStart(page);
  return hand;
}

test('MSG-09.1 Resume says it resumed [phone]', async ({ page, check }, testInfo) => {
  const hand = await startWithSavedPhoto(page, testInfo);
  await resumeAs(page, hand, PHOTO);
  const message = await waitForMessage(page, RESUMED);
  await check(`a white message reads "${RESUMED}"`, () => {
    expectKind(message, 'info');
  });
});

test('MSG-09.2 Edits that don\'t fit the photo say it was opened fresh [phone]', async ({
  page,
  check,
}, testInfo) => {
  test.fail(true, 'BUG-050');
  const hand = await startWithSavedPhoto(page, testInfo);
  const { width } = (await page.evaluate(async () => (
    window.__straightener.Session.get('edits'))));
  // No control changes a saved record: this stands in for one the app can't read as written.
  await changeSavedEdits(page, 'width', width + 1);
  await resumeAs(page, hand, PHOTO);
  await page.waitForTimeout(NOTHING_WAIT_MS);
  // A plain reading: the message comes with the photo or not at all.
  const shown = (await messagesSoFar(page)).filter(message => message.text !== 'Loading…');
  await check('an amber warning says the edits couldn\'t be restored and the photo was opened '
    + 'fresh', () => {
    expect(shown.length).toBe(1);
    expectKind(shown[0], 'warn');
  });
});

test('MSG-10.1 A search that finds no card says so [phone]', async ({
  page,
  check,
}, testInfo) => {
  await watchMessages(page);
  const hand = await startOnBlank(page, testInfo);
  await armFindCard(page, hand);
  await tapAt(page, hand, await photoAreaMiddle(page));
  const message = await waitForMessage(page, NO_CARD_FOUND);
  await check(`an amber warning reads "${NO_CARD_FOUND}"`, () => {
    expectKind(message, 'warn');
  });
  const gone = await waitUntilGone(page, NO_CARD_FOUND, WARN_MS * 2);
  await check('it stays 5 s', () => {
    expectStayed(gone, WARN_MS);
  });
});

test('MSG-11.1 A failed search names no raw error [phone]', async ({
  page,
  check,
}, testInfo) => {
  test.fail(true, 'BUG-051');
  const hand = await start(page, testInfo, { step: 'perspective' });
  // Stand-in: no photo makes detection fail, so the detector is made to throw.
  await refuseDetection(page, STAND_IN_ERROR);
  await armFindCard(page, hand);
  await tapAt(page, hand, await photoAreaMiddle(page));
  await page.waitForFunction(() => window.testMessages.some(message => message.kind === 'error'));
  const [message] = (await messagesSoFar(page)).filter(shown => shown.kind === 'error');
  await check('the error\'s own words are written to the console', () => {
    expect(check.consoleErrors().join('\n')).toContain(STAND_IN_ERROR);
  });
  await check('a red message gives a fixed sentence with a next step, without the error\'s own '
    + 'words', () => {
    expectKind(message, 'error');
    expect(message.text).not.toContain(STAND_IN_ERROR);
  });
});

test('MSG-12.1 Resume after the saved photo has gone [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startWithSavedPhoto(page, testInfo);
  const secondTab = await page.context().newPage();
  await openApp(secondTab);
  await waitForStart(secondTab);
  await handFor(secondTab, testInfo).tap(secondTab.locator('#btnFresh'));
  await check('in the second tab, Start fresh takes the card away', async () => {
    await expect(secondTab.locator('#resume')).toBeHidden();
  });
  await page.bringToFront();
  await hand.tap(page.locator('#btnResume'));
  const message = await waitForMessage(page, PHOTO_GONE);
  await check(`an amber warning reads "${PHOTO_GONE}"`, () => {
    expectKind(message, 'warn');
  });
});

test('MSG-13.1 A Resume that fails names no raw error [phone]', async ({
  page,
  check,
}, testInfo) => {
  test.fail(true, 'BUG-051');
  const hand = await startWithSavedPhoto(page, testInfo);
  // The developer tools' Clear site data, through the same browser command they use.
  const devTools = await page.context().newCDPSession(page);
  await devTools.send('Storage.clearDataForOrigin', {
    origin: new URL(page.url()).origin,
    storageTypes: 'all',
  });
  await hand.tap(page.locator('#btnResume'));
  await page.waitForFunction(() => window.testMessages.some(message => message.kind === 'error'));
  const [message] = (await messagesSoFar(page)).filter(shown => shown.kind === 'error');
  await check('a red message gives a fixed sentence with a next step, without the browser\'s '
    + 'error', () => {
    expectKind(message, 'error');
    expect(message.text).not.toContain('Failed to execute');
  });
});

test('MSG-14.1 The self-test result, from a link [phone]', async ({ page, check }) => {
  await watchMessages(page);
  await openApp(page, 'index.html?selftest');
  const message = await waitForMessage(page, /^Self-tests: main /);
  await check('a white message reads "Self-tests: main N/N, worker N/N", every test passed',
    () => {
      expect(message.text).toMatch(/^Self-tests: main (\d+)\/\1, worker (\d+)\/\2$/);
      expectKind(message, 'info');
    });
  const gone = await waitUntilGone(page, message.text, LONG_ERROR_MS * 2);
  await check('it stays 8 s', () => {
    expectStayed(gone, LONG_ERROR_MS);
  });
});

test('MSG-14.2 A link with selftest=0 runs no self-tests [phone]', async ({ page, check }) => {
  test.fail(true, 'BUG-171');
  await watchMessages(page);
  await openApp(page, 'index.html?selftest=0');
  await waitForStart(page);
  await page.waitForTimeout(NOTHING_WAIT_MS);
  // Plain readings: the known defect fails at once rather than waiting.
  const shown = (await messagesSoFar(page)).map(message => message.text);
  const hasRun = await page.evaluate(() => !!window.__selftest);
  await check('no self-test message shows, and no self-tests run', () => {
    expect(shown.filter(text => text.startsWith('Self-tests'))).toEqual([]);
    expect(hasRun).toBe(false);
  });
});

test('MSG-15.1 Auto with nothing to go on [phone]', async ({ page, check }, testInfo) => {
  const hand = await startLevels(page, testInfo);
  await openPicture(page, await whitePicture(page));
  await goToStep(page, 'levels', hand);
  await hand.tap(page.locator('#toolAutoLevels'));
  const message = await waitForMessage(page, AUTO_FAILED);
  await check(`an amber warning reads "${AUTO_FAILED}"`, () => {
    expectKind(message, 'warn');
  });
});

test('MSG-16.1 Auto sets both points [phone]', async ({ page, check }, testInfo) => {
  const hand = await startLevels(page, testInfo);
  await hand.tap(page.locator('#toolAutoLevels'));
  const message = await waitForMessage(page, AUTO_BOTH);
  await check(`a white message reads "${AUTO_BOTH}"`, () => {
    expectKind(message, 'info');
  });
});

test('MSG-17.1 Auto sets the white point only [phone]', async ({ page, check }, testInfo) => {
  const hand = await startLevels(page, testInfo, NO_BLACK_PHOTO);
  await hand.tap(page.locator('#toolAutoLevels'));
  const message = await waitForMessage(page, AUTO_WHITE_ONLY);
  await check(`a white message reads "${AUTO_WHITE_ONLY}"`, () => {
    expectKind(message, 'info');
  });
});

test('MSG-18.1 A pick off the photo [phone]', async ({ page, check }, testInfo) => {
  const hand = await startLevels(page, testInfo);
  const box = await page.locator('#view').boundingBox();
  const middle = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  await hand.drag(middle, { x: middle.x + PAN_PX, y: middle.y });
  await hand.tap(pickButton(page, 'white'));
  const outside = { x: box.x + EDGE_INSET_PX, y: middle.y };
  await check('the point near the photo area\'s left edge is past the photo\'s own edge',
    async () => {
      expect((await photoPointAt(page, outside))[0]).toBeLessThan(0);
    });
  await tapPoint(page, hand, outside);
  const message = await waitForMessage(page, OUTSIDE_PHOTO);
  await check(`an amber warning reads "${OUTSIDE_PHOTO}"; Pick white stays selected`,
    async () => {
      expectKind(message, 'warn');
      expect(await armedPick(page)).toBe('white');
    });
});

test('MSG-19.1 A white pick darker than the black point [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startLevels(page, testInfo);
  await pickSpot(page, hand, 'black', SPOTS.dark);
  await pickSpot(page, hand, 'white', SPOTS.dark);
  const message = await waitForMessage(page, DARKER_THAN_BLACK);
  await check(`an amber warning reads "${DARKER_THAN_BLACK}"; Pick white stays selected`,
    async () => {
      expectKind(message, 'warn');
      expect(await armedPick(page)).toBe('white');
    });
});

test('MSG-20.1 A black pick that is too light [phone]', async ({ page, check }, testInfo) => {
  const hand = await startLevels(page, testInfo);
  await pickSpot(page, hand, 'black', SPOTS.white);
  const message = await waitForMessage(page, TOO_LIGHT_FOR_BLACK);
  await check(`an amber warning reads "${TOO_LIGHT_FOR_BLACK}"; Pick black stays selected`,
    async () => {
      expectKind(message, 'warn');
      expect(await armedPick(page)).toBe('black');
    });
});

test('MSG-21.1 A black pick brighter than the white point [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startLevels(page, testInfo);
  await pickSpot(page, hand, 'white', SPOTS.dark);
  await pickSpot(page, hand, 'black', SPOTS.dark);
  const message = await waitForMessage(page, BRIGHTER_THAN_WHITE);
  await check(`an amber warning reads "${BRIGHTER_THAN_WHITE}"; Pick black stays selected`,
    async () => {
      expectKind(message, 'warn');
      expect(await armedPick(page)).toBe('black');
    });
});

// The page's console from now on: every message's type and text, in order.
function listenToConsole(page) {
  const lines = [];
  page.on('console', message => lines.push({ type: message.type(), text: message.text() }));
  return lines;
}

// Waits until the toast has shown a red message, and returns the first.
async function firstError(page) {
  await page.waitForFunction(() => window.testMessages.some(message => message.kind === 'error'));
  return (await messagesSoFar(page)).find(message => message.kind === 'error');
}

test('MSG-22.1 A single photo\'s Download says what it saved [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await start(page, testInfo);
  const saved = await saveByDownload(page, hand);
  const message = await waitForMessage(page, /^Exported /);
  const { width, height } = await readSavedImage(page, saved.file);
  await check('a white message reads "Exported W × H px in N s.", with the saved file\'s size',
    () => {
      expect(message.text).toMatch(/^Exported \d+ × \d+ px in \d+\.\d s\.$/);
      expect(message.text).toContain(`Exported ${width} × ${height} px in `);
      expectKind(message, 'info');
    });
});

test('MSG-23.1 A pair\'s Together Download says so [phone]', async ({
  page,
  check,
}, testInfo) => {
  await watchMessages(page);
  const hand = await makePair(page, testInfo);
  await goToStep(page, 'export', hand);
  await downloadAll(page, hand, 1);
  const message = await waitForMessage(page, /^Exported the Together image in /);
  await check('a white message reads "Exported the Together image in N s."', () => {
    expect(message.text).toMatch(/^Exported the Together image in \d+\.\d s\.$/);
    expectKind(message, 'info');
  });
});

test('MSG-24.1 A pair\'s Separately Download says so [phone]', async ({
  page,
  check,
}, testInfo) => {
  await watchMessages(page);
  const hand = await makePair(page, testInfo);
  await goToStep(page, 'export', hand);
  await chooseOutput(page, hand, 'separately');
  await downloadAll(page, hand, 2);
  const message = await waitForMessage(page, /^Exported the front and back in /);
  await check('a white message reads "Exported the front and back in N s."', () => {
    expect(message.text).toMatch(/^Exported the front and back in \d+\.\d s\.$/);
    expectKind(message, 'info');
  });
});

test('MSG-25.1 Download corners with 1 sheet says so [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await start(page, testInfo, { address: NO_CORNER_QUESTION });
  await chooseCornerOutput(page, hand, '1 sheet');
  await saveCorners(page, hand, 1);
  const message = await waitForMessage(page, /^Saved the corner sheet in /);
  await check('a white message reads "Saved the corner sheet in N s."', () => {
    expect(message.text).toMatch(/^Saved the corner sheet in \d+\.\d s\.$/);
    expectKind(message, 'info');
  });
});

test('MSG-26.1 Download corners with 4 photos says so [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await start(page, testInfo, { address: NO_CORNER_QUESTION });
  await chooseCornerOutput(page, hand, '4 photos');
  await saveCorners(page, hand, 4);
  const message = await waitForMessage(page, /^Saved 4 corner shots in /);
  await check('a white message reads "Saved 4 corner shots in N s."', () => {
    expect(message.text).toMatch(/^Saved 4 corner shots in \d+\.\d s\.$/);
    expectKind(message, 'info');
  });
});

// The sentence a WebP export gains where the browser saved a PNG instead.
const WEBP_AS_PNG = 'WEBP isn’t supported by this browser, so it was saved as PNG.';

test('MSG-27.1 A format the browser couldn\'t save is named [phone]', async ({
  page,
  check,
}, testInfo) => {
  await takeAwayWebpSaving(page);
  const hand = await start(page, testInfo);
  await hand.tap(choiceButton(page, 'exportFormat', 'WebP'));
  const saved = await saveByDownload(page, hand);
  const message = await waitForMessage(page, /^Exported .* s\. WEBP isn’t supported/);
  await check('the file is a PNG; an amber warning reads "Exported W × H px in N s. '
    + `${WEBP_AS_PNG}"`, () => {
      expect(saved.name).toMatch(/\.png$/);
      expect(message.text).toMatch(/^Exported \d+ × \d+ px in \d+\.\d s\. /);
      expect(message.text.endsWith(` ${WEBP_AS_PNG}`)).toBe(true);
      expectKind(message, 'warn');
    });
  const gone = await waitUntilGone(page, message.text, ERROR_MS * 2);
  await check('it stays 6 s', () => {
    expectStayed(gone, ERROR_MS);
  });
});

test('MSG-28.1 A refused share says to tap Share now [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await start(page, testInfo, { share: 'refuseOnce' });
  await hand.tap(page.locator('#btnShare'));
  await hand.tap(questionButton(page, 'No'));
  const message = await waitForMessage(page, /Tap Share now to open the share sheet\.$/);
  await check('a white message reads "Exported W × H px in N s. Tap Share now to open the share '
    + 'sheet."; Share reads Share now', async () => {
    expect(message.text).toMatch(/^Exported \d+ × \d+ px in \d+\.\d s\. Tap Share now/);
    expectKind(message, 'info');
    await expect(page.locator('#btnShare')).toContainText('Share now');
  });
  await hand.tap(page.locator('#btnShare'));
  await check('the message goes at once', async () => {
    await expect(page.locator('#toast')).not.toHaveClass(/is-shown/);
    const after = (await messagesSoFar(page)).find(shown => shown.text === message.text);
    expect(shownForMs(after)).toBeLessThan(ERROR_MS - LATE_MS);
  });
});

test('MSG-29.1 Copy says what it put on the clipboard [phone]', async ({
  page,
  context,
  check,
}, testInfo) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const hand = await start(page, testInfo);
  await hand.tap(page.locator('#btnCopy'));
  await hand.tap(questionButton(page, 'No'));
  const message = await waitForMessage(page, 'Copied to clipboard (PNG).');
  await check('a white message reads "Copied to clipboard (PNG)."', () => {
    expectKind(message, 'info');
  });
});

test('MSG-30.1 A failed Copy names no raw error [phone]', async ({
  page,
  check,
}, testInfo) => {
  test.fail(true, 'BUG-051');
  // Stand-in: the clipboard refuses every write, as a browser that blocks the page does.
  await refuseClipboard(page, STAND_IN_ERROR);
  const hand = await start(page, testInfo);
  await hand.tap(page.locator('#btnCopy'));
  await hand.tap(questionButton(page, 'No'));
  const message = await firstError(page);
  await check('the error\'s own words are written to the console', () => {
    expect(check.consoleErrors().join('\n')).toContain(STAND_IN_ERROR);
  });
  await check('a red message gives a fixed sentence with a next step, without the error\'s own '
    + 'words', () => {
    expectKind(message, 'error');
    expect(message.text).not.toContain(STAND_IN_ERROR);
  });
});

test('MSG-31.1 A failed Download names no raw error [phone]', async ({
  page,
  check,
}, testInfo) => {
  test.fail(true, 'BUG-051');
  const hand = await start(page, testInfo);
  // Stand-in: the browser hands back no file, as when a canvas is too big for it.
  await failEncoding(page);
  await hand.tap(page.locator('#btnDownload'));
  await hand.tap(questionButton(page, 'No'));
  const message = await firstError(page);
  await check('the error\'s own words are written to the console', () => {
    expect(check.consoleErrors().join('\n')).toContain('Encoding failed');
  });
  await check('a red message gives a fixed sentence with a next step, without the error\'s own '
    + 'words', () => {
    expectKind(message, 'error');
    expect(message.text).not.toContain('Encoding failed');
  });
});

test('MSG-32.1 A failed share names no raw error [phone]', async ({
  page,
  check,
}, testInfo) => {
  test.fail(true, 'BUG-051');
  const hand = await start(page, testInfo, { share: 'fail' });
  await hand.tap(page.locator('#btnShare'));
  await hand.tap(questionButton(page, 'No'));
  const message = await firstError(page);
  await check('the error\'s own words are written to the console', () => {
    expect(check.consoleErrors().join('\n')).toContain(SHARE_FAILURE_MESSAGE);
  });
  await check('a red message gives a fixed sentence with a next step, without the error\'s own '
    + 'words', () => {
    expectKind(message, 'error');
    expect(message.text).not.toContain(SHARE_FAILURE_MESSAGE);
  });
});

// The largest edits file the app reads, in bytes (CONFIG.export.editsMaxBytes: 8 MB).
const EDITS_MAX_BYTES = 8 * 1024 * 1024;

test('MSG-33.1 An edits file over 8 MB [phone]', async ({ page, check }, testInfo) => {
  const hand = await start(page, testInfo);
  const tooLarge = {
    name: 'big-edits.json',
    mimeType: 'application/json',
    buffer: Buffer.alloc(EDITS_MAX_BYTES + 1, ' '),
  };
  await loadEditsFile(page, hand, tooLarge);
  const text = 'That file is too large to be a Card Finisher edits file.';
  const message = await waitForMessage(page, text);
  await check(`a red message reads "${text}"`, () => {
    expectKind(message, 'error');
  });
});

test('MSG-34.1 An edits file that isn\'t JSON [phone]', async ({ page, check }, testInfo) => {
  const hand = await start(page, testInfo);
  await loadEditsFile(page, hand, jsonFile('notes.json', 'These are notes, not edits.'));
  const message = await waitForMessage(page, NOT_JSON);
  await check(`a red message reads "${NOT_JSON}"`, () => {
    expectKind(message, 'error');
  });
});

test('MSG-35.1 JSON that isn\'t an edits file [phone]', async ({ page, check }, testInfo) => {
  const hand = await start(page, testInfo);
  await loadEditsFile(page, hand, jsonFile('list.json', { shopping: ['tape', 'sleeves'] }));
  const text = 'That isn’t a Card Finisher edits file.';
  const message = await waitForMessage(page, text);
  await check(`a red message reads "${text}"`, () => {
    expectKind(message, 'error');
  });
});

// An edits file as small as the app accepts: version 2, a photo's name and size, no corners.
const BARE_EDITS = {
  version: 2,
  source: { name: PHOTO, width: 3024, height: 4032 },
  corners: [],
};

test('MSG-36.1 Edits with no photo open [phone]', async ({ page, check }, testInfo) => {
  await startOnStartScreen(page, testInfo);
  // Load edits is greyed out with no photo, so the file is handed straight to its picker.
  await page.setInputFiles('#editsInput', jsonFile('card-edits.json', BARE_EDITS));
  const text = 'Open the matching photo first, then load its edits.';
  const message = await waitForMessage(page, text);
  await check(`an amber warning reads "${text}"; the start screen stays`, async () => {
    expectKind(message, 'warn');
    await expect(page.locator('#empty')).toBeVisible();
  });
});

// On Rotate, turns the photo a quarter to the right, then saves its edits with Save edits in
// Export options and takes the turn back with Undo. Returns the saved edits as an object, the
// quarter turn in them.
async function saveTurnedEdits(page, hand) {
  await goToStep(page, 'rotate', hand);
  await hand.tap(page.locator('#toolRotateRight'));
  await goToStep(page, 'export', hand);
  await openOptions(page, hand, 'export');
  const saved = await saveFileBy(page, hand, page.locator('#btnSaveEdits'));
  await closeOptions(page, hand, 'export');
  await hand.tap(page.locator('#btnUndo'));
  await page.waitForFunction(() => window.__straightener.app.state.rotation.quarter === 0);
  return readEdits(saved.file);
}

// A logo placement and an embedded logo no browser can read, for an edits file.
const UNREADABLE_LOGO = {
  overlay: { id: 'stand-in', aspect: 1, cx: 0.5, cy: 0.5, w: 0.25, opacity: 1 },
  overlayImage: { id: 'stand-in', type: 'image/gif', name: 'logo.gif', data: 'R0lGOD' },
};

// Loads `edits` with Load edits and waits until they are on the photo (its quarter turn).
async function loadAndSettle(page, hand, edits) {
  await loadEditsFile(page, hand, jsonFile('card-edits.json', edits));
  await page.waitForFunction(() => window.__straightener.app.state.rotation.quarter === 1);
}

test('MSG-37.1 Edits for a photo of another size [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await start(page, testInfo);
  const edits = await saveTurnedEdits(page, hand);
  await openPhoto(page, SLAB_PHOTO);
  await goToStep(page, 'export', hand);
  await loadEditsFile(page, hand, jsonFile('card-edits.json', edits));
  const text = 'These edits are for a 1536×2048 photo; this one is 1498×2098.';
  const message = await waitForMessage(page, text);
  await check(`a red message reads "${text}"; the photo stays upright`, async () => {
    expectKind(message, 'error');
    expect((await editState(page)).rotation.quarter).toBe(0);
  });
});

test('MSG-38.1 Edits saved for a file of another name [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await start(page, testInfo);
  const edits = await saveTurnedEdits(page, hand);
  edits.source.name = 'another-card.JPEG';
  const before = (await messagesSoFar(page)).length;
  await loadAndSettle(page, hand, edits);
  await page.waitForFunction(count => window.testMessages.length > count, before);
  const shown = (await messagesSoFar(page)).slice(before);
  await check('the edits are applied (the photo turns a quarter right); one amber warning says '
    + 'they were saved for another-card.JPEG', () => {
    expect(shown.length).toBe(1);
    expectKind(shown[0], 'warn');
    expect(shown[0].text).toContain('another-card.JPEG');
  });
});

test('MSG-38.2 Three problems in one edits file make one warning [phone]', async ({
  page,
  check,
}, testInfo) => {
  test.fail(true, 'BUG-190');
  const hand = await start(page, testInfo);
  const edits = await saveTurnedEdits(page, hand);
  edits.source.name = 'another-card.JPEG';
  edits.crop = 'the whole card';
  Object.assign(edits, UNREADABLE_LOGO);
  const before = (await messagesSoFar(page)).length;
  await loadAndSettle(page, hand, edits);
  await page.waitForTimeout(NOTHING_WAIT_MS);
  // A plain reading: the messages shown, once the load has settled.
  const shown = (await messagesSoFar(page)).slice(before);
  await check('the edits are applied, and one amber warning, of up to three short lines, '
    + 'covers all three problems', () => {
    expect(shown.length).toBe(1);
    expectKind(shown[0], 'warn');
  });
});

test('MSG-39.1 Settings in the edits file that were reset [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await start(page, testInfo);
  const edits = await saveTurnedEdits(page, hand);
  const crop = (await editState(page)).crop;
  edits.crop = 'the whole card';
  const before = (await messagesSoFar(page)).length;
  await loadAndSettle(page, hand, edits);
  await page.waitForFunction(count => window.testMessages.length > count, before);
  const [message] = (await messagesSoFar(page)).slice(before);
  await check('the edits are applied with the crop as it was before; an amber warning says the '
    + 'crop setting was reset', async () => {
    expect((await editState(page)).crop).toEqual(crop);
    expectKind(message, 'warn');
    expect(message.text).toContain('crop');
  });
});

test('MSG-40.1 A logo in the edits file that can\'t be read [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await start(page, testInfo);
  const edits = await saveTurnedEdits(page, hand);
  Object.assign(edits, UNREADABLE_LOGO);
  const before = (await messagesSoFar(page)).length;
  await loadAndSettle(page, hand, edits);
  await page.waitForFunction(count => window.testMessages.length > count, before);
  const [message] = (await messagesSoFar(page)).slice(before);
  await check('the edits are applied with no logo; an amber warning says the logo couldn\'t be '
    + 'read', async () => {
    expect((await editState(page)).overlay).toBeNull();
    expectKind(message, 'warn');
  });
});

// The tuning panel's link: it opens with the panel showing.
const TUNING_LINK = 'index.html?debug';

test('MSG-41.1 Copy CONFIG says it copied [phone]', async ({
  page,
  context,
  check,
}, testInfo) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const hand = await start(page, testInfo, { address: TUNING_LINK, step: 'perspective' });
  await hand.tap(page.locator('#debugCopy'));
  const message = await waitForMessage(page, 'CONFIG copied.');
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  await check('a white message reads "CONFIG copied."; the clipboard holds the settings',
    () => {
      expectKind(message, 'info');
      expect(copied.startsWith('const CONFIG = ')).toBe(true);
    });
});

test('MSG-42.1 Copy CONFIG with the clipboard blocked [phone]', async ({
  page,
  check,
}, testInfo) => {
  // Stand-in: the clipboard refuses every write, as a browser that blocks the page does.
  await refuseClipboard(page, STAND_IN_ERROR);
  const hand = await start(page, testInfo, { address: TUNING_LINK, step: 'perspective' });
  const lines = listenToConsole(page);
  await hand.tap(page.locator('#debugCopy'));
  const text = 'Clipboard blocked — CONFIG printed to the console.';
  const message = await waitForMessage(page, text);
  await check(`an amber warning reads "${text}"; the console holds the settings`, () => {
    expectKind(message, 'warn');
    expect(lines.some(line => line.text.startsWith('const CONFIG = '))).toBe(true);
  });
});

test('MSG-43.1 A logo the browser won\'t keep [phone]', async ({ page, check }, testInfo) => {
  await refuseStorage(page, ['overlay']);
  await watchMessages(page);
  const hand = await startOnOverlay(page, testInfo, { photo: PHOTO });
  await addLogo(page, hand, page.locator('#btnOverlayAdd'), 'icon.svg');
  const text = 'This overlay works on this photo, but it can’t be saved in this browser.';
  const message = await waitForMessage(page, text);
  await check(`the logo goes on the photo; an amber warning reads "${text}"`, async () => {
    expect((await editState(page)).overlay).not.toBeNull();
    expectKind(message, 'warn');
  });
});

test('MSG-44.1 "Opening the front…" while the front opens [phone]', async ({
  page,
  check,
}, testInfo) => {
  await watchMessages(page);
  const hand = await makePair(page, testInfo);
  await holdNextOpening(page);
  await hand.tap(sideButton(page, 'front'));
  await waitForOpening(page);
  const message = await waitForMessage(page, 'Opening the front…');
  await check('a white message reads "Opening the front…" while the front opens', () => {
    expectKind(message, 'info');
    expect(message.hiddenAtMs).toBeNull();
  });
  await releaseOpening(page);
  await page.waitForFunction(() => window.__straightener.app.pair.current === 'front'
    && !window.__straightener.app.isSwitching);
  await check('once the front shows, the message has gone', async () => {
    await expect(page.locator('#toast')).not.toHaveClass(/is-shown/);
  });
});

test('MSG-45.1 Unpair says which side is kept [phone]', async ({ page, check }, testInfo) => {
  await watchMessages(page);
  const hand = await makePair(page, testInfo);
  await hand.tap(page.locator('#btnUnpair'));
  await hand.tap(questionButton(page, 'Keep front'));
  const text = 'Unpaired. The front is a single photo now.';
  const message = await waitForMessage(page, text);
  await check(`a white message reads "${text}"`, () => {
    expectKind(message, 'info');
  });
});

// How long each image encoding is held back while MSG-46.1 opens a photo, in ms.
const SLOW_ENCODING_MS = 3000;
const EXPORT_WAIT = 'Wait for the export to finish, then open the photo.';

test('MSG-46.1 A photo opened during an export is refused [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await start(page, testInfo);
  // Stand-in: each encoding is held back, as on a slow phone, so the export is still running.
  await slowEncoding(page, SLOW_ENCODING_MS);
  await hand.tap(page.locator('#btnDownload'));
  await hand.tap(questionButton(page, 'No'));
  await page.waitForFunction(() => window.__straightener.app.exporting);
  await pickWith(page, hand, page.locator('#btnOpen'), SLAB_PHOTO);
  const message = await waitForMessage(page, EXPORT_WAIT);
  await check(`an amber warning reads "${EXPORT_WAIT}"; the photo stays`, async () => {
    expectKind(message, 'warn');
    expect((await editState(page)).source.name).toBe(PHOTO);
  });
});

test('MSG-46.2 A photo opened while a side opens is refused with its own words [phone]',
  async ({ page, check }, testInfo) => {
    test.fail(true, 'BUG-031');
    await watchMessages(page);
    const hand = await makePair(page, testInfo);
    await holdNextOpening(page);
    await hand.tap(sideButton(page, 'front'));
    await waitForOpening(page);
    await pickWith(page, hand, page.locator('#btnOpen'), SLAB_PHOTO);
    await page.waitForFunction(() => window.testMessages.some(message => message.kind === 'warn'));
    const message = (await messagesSoFar(page)).find(shown => shown.kind === 'warn');
    await check('an amber warning says to wait for the other side to open, not for the export',
      () => {
        expectKind(message, 'warn');
        expect(message.text).not.toBe(EXPORT_WAIT);
      });
  });

test('MSG-47.1 The photo isn\'t loaded after a pair\'s export [phone]', async ({
  page,
  check,
}, testInfo) => {
  await watchMessages(page);
  const hand = await makePair(page, testInfo);
  await goToStep(page, 'export', hand);
  await chooseSize(page, hand, '0');
  // Stand-in: every read of the back fails, as under memory pressure on an iPhone.
  await failReadsOf(page, BACK);
  await downloadAll(page, hand, 1);
  await waitForExportEnd(page);
  const text = 'The photo isn’t loaded after the last export. '
    + 'Tap Front or Back to switch sides, then switch back.';
  const message = await waitForMessage(page, text);
  await check(`an amber warning reads "${text}"`, () => {
    expectKind(message, 'warn');
  });
  const gone = await waitUntilGone(page, text, LONG_ERROR_MS * 2);
  await check('it stays 8 s', () => {
    expectStayed(gone, LONG_ERROR_MS);
  });
});

test('MSG-48.1 A saved pair that couldn\'t be rebuilt [phone]', async ({
  page,
  check,
}, testInfo) => {
  await watchMessages(page);
  const hand = await makePair(page, testInfo);
  await waitUntilPairStored(page);
  // Stand-in: no control damages a stored record; this does, as a failed write could.
  await changeStoredPair(page, 'damage');
  await reloadToResume(page);
  await resume(page, hand, BACK, null);
  const text = 'The saved pair wasn’t valid, so it was reset. This photo resumed on its own.';
  const message = await waitForMessage(page, text);
  const resumed = (await messagesSoFar(page)).find(shown => shown.text === RESUMED);
  await check(`an amber warning reads "${text}", in place of "${RESUMED}" at once`, () => {
    expectKind(message, 'warn');
    expect(resumed.hiddenAtMs).toBe(message.shownAtMs);
  });
});

test('MSG-49.1 Corner shots that can\'t be made can\'t be saved [phone]', async ({
  page,
  check,
}, testInfo) => {
  test.fail(true, 'BUG-120');
  const hand = await start(page, testInfo);
  // Stand-in: no photo or control makes the engine refuse a card with valid corners.
  await makeCornerShotsImpossible(page, 'The card is too small for corner shots.');
  await openCornerSheet(page, hand);
  // Plain readings: the known defect fails at once rather than waiting.
  const isDownloadDimmed = await page.locator('#btnCornerDownload').isDisabled();
  const isShareDimmed = await page.locator('#btnCornerShare').isDisabled();
  await check('Download corners and Share corners are greyed out', () => {
    expect({ isDownloadDimmed, isShareDimmed }).toEqual({
      isDownloadDimmed: true,
      isShareDimmed: true,
    });
  });
});

test('MSG-50.1 Failed corner shots name no raw error [phone]', async ({
  page,
  check,
}, testInfo) => {
  test.fail(true, 'BUG-051');
  const hand = await start(page, testInfo, { address: NO_CORNER_QUESTION });
  await openCornerSheet(page, hand);
  // Stand-in: the browser hands back no file, as when a canvas is too big for it.
  await failEncoding(page);
  await hand.tap(page.locator('#btnCornerDownload'));
  const message = await firstError(page);
  await check('the error\'s own words are written to the console', () => {
    expect(check.consoleErrors().join('\n')).toContain('Encoding failed');
  });
  await check('a red message gives a fixed sentence with a next step, without the error\'s own '
    + 'words', () => {
    expectKind(message, 'error');
    expect(message.text).not.toContain('Encoding failed');
  });
});

// Perspective's line above the controls, and the Overlay step's.
const PERSPECTIVE_STATUS = 'perspectiveStatus';
const OVERLAY_STATUS = 'overlayStatus';

test('MSG-51.1 Tap to find card\'s line, with Cancel [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await start(page, testInfo, { step: 'perspective' });
  await armFindCard(page, hand);
  const text = 'Tap the card in the photo.';
  await check(`the line above the controls reads "${text}" with a grey information icon and `
    + 'Cancel', async () => {
    await expectStatus(page, PERSPECTIVE_STATUS, text, 'info');
    expect((await statusNow(page, PERSPECTIVE_STATUS)).action).toBe('Cancel');
  });
  await hand.tap(page.locator('#perspectiveStatusAction'));
  await check('Cancel takes the line away; Tap to find card is no longer armed', async () => {
    await expect(page.locator('#perspectiveStatus')).toBeHidden();
    expect(await page.evaluate(() => !!window.__straightener.app.findMode)).toBe(false);
  });
});

test('MSG-52.1 Corners that cross [phone]', async ({ page, check }, testInfo) => {
  const hand = await start(page, testInfo, { step: 'perspective' });
  await crossCorners(page, hand);
  const text = 'Corners cross or fold inward. Drag them back into a convex shape.';
  await check(`the line above the controls reads "${text}" with a red error icon`, async () => {
    await expectStatus(page, PERSPECTIVE_STATUS, text, 'error');
  });
});

test('MSG-53.1 Two corners too close together [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await start(page, testInfo, { step: 'perspective' });
  const topLeft = await cornerOnPage(page, 0);
  const topRight = await cornerOnPage(page, 1);
  await hand.drag(topRight, topLeft);
  const text = 'Two corners are too close together.';
  await check(`the line above the controls reads "${text}" with a red error icon`, async () => {
    await expectStatus(page, PERSPECTIVE_STATUS, text, 'error');
  });
});

// The engine's other corner faults, as the line above Perspective's controls shows them.
const OTHER_FAULTS = [
  'Corners are missing or invalid.',
  'Could not solve the perspective for these corners.',
  'Crop is empty.',
  'Transform is not invertible.',
];

test('MSG-54.1 The engine\'s other corner faults [phone]', async ({
  page,
  check,
}, testInfo) => {
  await start(page, testInfo, { step: 'perspective' });
  for (const fault of OTHER_FAULTS) {
    // Stand-in: no control brings these faults about, so the engine is made to report one.
    await faultGeometry(page, fault);
    await check(`the line above the controls reads "${fault}" with a red error icon`,
      async () => {
        await expectStatus(page, PERSPECTIVE_STATUS, fault, 'error');
      });
  }
  await clearGeometryFault(page);
});

test('MSG-55.1 "Detecting…" while a search runs [phone]', async ({ page, check }) => {
  await watchMessages(page);
  await openApp(page);
  await watchStatus(page, PERSPECTIVE_STATUS);
  await openPhoto(page, PHOTO);
  await check('for a moment the line above the controls reads "Detecting…" with a grey '
    + 'information icon', async () => {
    expect(await statusesSoFar(page)).toContainEqual({ text: 'Detecting…', kind: 'info' });
  });
});

// Links that make IMG_9136's 99% confidence count as low, and that clamp its corrected frame to
// 1000 px (perspective.spec.js's PER-36 cases).
const LOW_CONFIDENCE_LINK = 'index.html?detect.minConfidence=1';
const CLAMPED_LINK = 'index.html?maxOutputPx=1000';

test('MSG-56.1 Low confidence [phone]', async ({ page, check }, testInfo) => {
  await start(page, testInfo, {
    photo: SLAB_PHOTO,
    address: LOW_CONFIDENCE_LINK,
    step: 'perspective',
  });
  const text = 'Low confidence (99%). Check the corners.';
  await check(`the line above the controls reads "${text}" with an amber warning icon`,
    async () => {
      await expectStatus(page, PERSPECTIVE_STATUS, text, 'warn');
    });
});

test('MSG-57.1 Nothing detected [phone]', async ({ page, check }, testInfo) => {
  await watchMessages(page);
  await startOnBlank(page, testInfo);
  const text = 'Nothing detected. Drag the corners into place.';
  await check(`the line above the controls reads "${text}" with an amber warning icon`,
    async () => {
      await expectStatus(page, PERSPECTIVE_STATUS, text, 'warn');
    });
});

test('MSG-58.1 A corrected frame over the cap [phone]', async ({ page, check }, testInfo) => {
  await start(page, testInfo, { photo: SLAB_PHOTO, address: CLAMPED_LINK, step: 'perspective' });
  const text = 'Corrected frame clamped to 1000px on the long side.';
  await check(`the line above the controls reads "${text}" with a grey information icon`,
    async () => {
      await expectStatus(page, PERSPECTIVE_STATUS, text, 'info');
    });
});

// Taps Add logo on the Overlay step and chooses `file` in its picker.
function chooseLogoFile(page, hand, file) {
  return pickWith(page, hand, page.locator('#btnOverlayAdd'), file);
}

test('MSG-59.1 A logo file of a type that isn\'t supported [phone]', async ({
  page,
  check,
}, testInfo) => {
  await watchMessages(page);
  const hand = await startOnOverlay(page, testInfo, { photo: PHOTO });
  await chooseLogoFile(page, hand, gifLogo());
  const text = 'That file type isn’t supported. Use PNG, WebP, JPG or SVG.';
  await check(`the line above the controls reads "${text}" with a red error icon`, async () => {
    await expectStatus(page, OVERLAY_STATUS, text, 'error');
  });
});

test('MSG-60.1 A logo file over the size limit [phone]', async ({
  page,
  check,
}, testInfo) => {
  await watchMessages(page);
  const hand = await startOnOverlay(page, testInfo, { photo: PHOTO });
  await chooseLogoFile(page, hand, oversizedPng());
  const text = 'That file is 6.0 MB. The overlay limit is 5 MB.';
  await check(`the line above the controls reads "${text}" with a red error icon`, async () => {
    await expectStatus(page, OVERLAY_STATUS, text, 'error');
  });
});

test('MSG-61.1 A logo image that can\'t be read [phone]', async ({
  page,
  check,
}, testInfo) => {
  await watchMessages(page);
  const hand = await startOnOverlay(page, testInfo, { photo: PHOTO });
  await chooseLogoFile(page, hand, textNamedPng());
  const text = 'Couldn’t read that image. Try another PNG, WebP, JPG or SVG file.';
  await check(`the line above the controls reads "${text}" with a red error icon`, async () => {
    await expectStatus(page, OVERLAY_STATUS, text, 'error');
  });
});

// An SVG logo with no width, height or viewBox: a black square drawn in it.
const UNSIZED_SVG = {
  name: 'unsized.svg',
  mimeType: 'image/svg+xml',
  buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg">'
    + '<rect width="100" height="100" fill="#000"/></svg>'),
};

test('MSG-62.1 An SVG logo with no size [phone]', async ({ page, check }, testInfo) => {
  await watchMessages(page);
  const hand = await startOnOverlay(page, testInfo, { photo: PHOTO });
  await chooseLogoFile(page, hand, UNSIZED_SVG);
  const text = 'That SVG has no width, height or viewBox, so it can’t be sized. '
    + 'Re-export it with a size.';
  await check(`the line above the controls reads "${text}" with a red error icon`, async () => {
    await expectStatus(page, OVERLAY_STATUS, text, 'error');
  });
});

test('MSG-63.1 Preview\'s two lines [phone]', async ({ page, check }, testInfo) => {
  const hand = await start(page, testInfo, { step: 'perspective' });
  await hand.tap(page.locator('#toolPreview'));
  await check('the line above the controls reads PREVIEW and "The corrected card. Handles are '
    + 'hidden."; the controls row reads "Pinch to zoom, drag to pan. Tap Preview again for the '
    + 'corners."', async () => {
    const line = page.locator('#perspectivePreviewLine');
    await expect(line.locator('.line-label')).toHaveText('Preview');
    await expect(line.locator('.line-label')).toHaveCSS('text-transform', 'uppercase');
    await expect(line).toContainText('The corrected card. Handles are hidden.');
    await expect(page.locator('#perspectivePreviewRow')).toHaveText(
      'Pinch to zoom, drag to pan. Tap Preview again for the corners.',
    );
  });
});

test('MSG-64.1 Flip\'s line [phone]', async ({ page, check }, testInfo) => {
  const hand = await start(page, testInfo, { step: 'rotate' });
  await hand.tap(page.locator('#toolFlip'));
  await check('the line above the controls reads FLIP and "as you see it on screen"', async () => {
    const line = page.locator('#rotateFlipLine');
    await expect(line).toBeVisible();
    await expect(line.locator('.line-label')).toHaveText('Flip');
    await expect(line.locator('.line-label')).toHaveCSS('text-transform', 'uppercase');
    await expect(line).toContainText('as you see it on screen');
  });
});

test('MSG-65.1 "Pair: 5:7 only" on Crop [phone]', async ({ page, check }, testInfo) => {
  const hand = await makePair(page, testInfo);
  await goToStep(page, 'crop', hand);
  await check('the size line ends with "Pair: 5:7 only" at its right', async () => {
    const note = page.locator('#cropPairNote');
    await expect(note).toBeVisible();
    await expect(note).toHaveText('Pair: 5:7 only');
    const noteBox = await note.boundingBox();
    const lineBox = await page.locator('#cropPairNote').locator('..').boundingBox();
    expect(noteBox.x + noteBox.width).toBeGreaterThan(lineBox.x + lineBox.width / 2);
  });
});

// Levels' instruction between Discard and Apply.
const levelsHint = page => page.locator('#levelsHint');

test('MSG-66.1 "Pick white, or try Auto" [phone]', async ({ page, check }, testInfo) => {
  await startLevels(page, testInfo);
  await check('between Discard and Apply the instruction reads "Pick white, or try Auto"',
    async () => {
      await expect(levelsHint(page)).toHaveText('Pick white, or try Auto');
    });
});

test('MSG-67.1 "Tap something white" while Pick white is armed [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startLevels(page, testInfo);
  const before = (await messagesSoFar(page)).length;
  await hand.tap(pickButton(page, 'white'));
  await check('the instruction reads "Tap something white", and no message pops up', async () => {
    await expect(levelsHint(page)).toHaveText('Tap something white');
    expect((await messagesSoFar(page)).length).toBe(before);
  });
});

test('MSG-68.1 "Tap something black" while Pick black is armed [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startLevels(page, testInfo);
  await hand.tap(pickButton(page, 'black'));
  await check('the instruction reads "Tap something black"', async () => {
    await expect(levelsHint(page)).toHaveText('Tap something black');
  });
});

test('MSG-69.1 "Hold the photo to compare" once the photo shows levels [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startLevels(page, testInfo);
  await hand.tap(page.locator('#toolAutoLevels'));
  await check('the instruction reads "Hold the photo to compare"', async () => {
    await expect(levelsHint(page)).toHaveText('Hold the photo to compare');
  });
});

test('MSG-70.1 Overlay\'s hint with no logo placed [phone]', async ({
  page,
  check,
}, testInfo) => {
  await startOnOverlay(page, testInfo, { photo: PHOTO });
  const text = 'Add a logo or watermark: PNG, WebP, JPG or SVG, up to 5 MB.';
  await check(`the line above the controls reads "${text}"`, async () => {
    await expect(page.locator('#overlayHintLine')).toBeVisible();
    await expect(page.locator('#overlayHintLine')).toHaveText(text);
  });
});

// Expects the one note under Export's size line to read `text`, led by the amber warning mark.
async function expectExportNote(page, text) {
  await expect.poll(async () => (await exportNotesNow(page)).map(note => note.text))
    .toEqual([text]);
  const [note] = await exportNotesNow(page);
  expect({ icon: note.icon, iconColor: note.iconColor }).toEqual({
    icon: 'warning',
    iconColor: TOAST_LOOKS.warn.background,
  });
}

test('MSG-71.1 Export\'s note for unapplied levels [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startLevels(page, testInfo);
  await hand.tap(page.locator('#toolAutoLevels'));
  await goToStep(page, 'export', hand);
  const text = 'Levels has unapplied changes; export uses the applied levels.';
  await check(`under the size line, led by the amber warning mark: "${text}"`, async () => {
    await expectExportNote(page, text);
  });
});

// A link that makes IMG_9136's output larger than the canvas area limit (EXP-06.3's).
const CLAMP_LINK = 'index.html?export.longEdge=12000&export.allowUpscale=1';

test('MSG-72.1 The canvas-limit note says 16.7 MP [phone]', async ({
  page,
  check,
}, testInfo) => {
  test.fail(true, 'BUG-011');
  await start(page, testInfo, { photo: SLAB_PHOTO, address: CLAMP_LINK });
  await page.locator('#exportMessage .export-note').first().waitFor();
  // A plain reading: the known defect fails at once rather than waiting.
  const notes = (await exportNotesNow(page)).map(note => note.text);
  await check('under the size line, led by the amber warning mark: "Clamped to fit the 16.7 MP '
    + 'canvas limit."', () => {
    expect(notes).toEqual(['Clamped to fit the 16.7 MP canvas limit.']);
  });
});

// The pair for MSG-72.2: a large front and a small back (EXP-06.4's), and the area limit that
// clamps the front at Original but not the back.
const CLAMP_PAIR = { front: SLAB_PHOTO, back: BACK };
const AREA_LIMIT_LINK = 'index.html?maxOutputArea=1000000';

test('MSG-72.2 With Separately, the note also covers the side not on screen [phone]', async ({
  page,
  check,
}, testInfo) => {
  test.fail(true, 'BUG-012');
  const hand = await makePair(page, testInfo, CLAMP_PAIR, AREA_LIMIT_LINK);
  await goToStep(page, 'export', hand);
  await chooseSize(page, hand, '0');
  await chooseOutput(page, hand, 'separately');
  // A plain reading: the known defect fails at once rather than waiting.
  const notes = (await exportNotesNow(page)).map(note => note.text);
  await check('with the back on screen, a note under the size line says the front was scaled '
    + 'down to fit the canvas limit, naming the front', () => {
    expect(notes.length).toBe(1);
    expect(notes[0]).toMatch(/front/i);
  });
});

test('MSG-73.1 Export\'s JPEG transparency note [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await start(page, testInfo);
  await chooseFill(page, hand, 'transparent');
  const text = 'JPEG has no transparency; empty areas will be white.';
  await check(`under the size line, led by the amber warning mark: "${text}"`, async () => {
    await expectExportNote(page, text);
  });
});

test('MSG-74.1 Corner shots that can\'t be made give the real reason [phone]', async ({
  page,
  check,
}, testInfo) => {
  test.fail(true, 'BUG-120');
  const hand = await start(page, testInfo);
  // Stand-in: no photo or control makes the engine refuse a card with valid corners.
  await makeCornerShotsImpossible(page, 'Transform is not invertible.');
  await openCornerSheet(page, hand);
  // Plain readings: the known defect fails at once rather than waiting.
  const readout = await cornerReadout(page);
  const isDownloadDimmed = await page.locator('#btnCornerDownload').isDisabled();
  await check('the size line gives the real reason, not "the card is too small"; Download '
    + 'corners is greyed out', () => {
    expect(readout).not.toContain('the card is too small');
    expect(isDownloadDimmed).toBe(true);
  });
});

// Expects the question card's buttons to read `labels`, in order, with only `redLabel` (or
// none) in P1Hunt red.
async function expectQuestionButtons(page, labels, redLabel = null) {
  const buttons = questionCard(page).getByRole('button');
  await expect(buttons).toHaveText(labels);
  for (const label of labels) {
    const background = await questionButton(page, label)
      .evaluate(element => getComputedStyle(element).backgroundColor);
    expect(background === TOAST_LOOKS.error.background, `${label} is red`).toBe(
      label === redLabel,
    );
  }
}

test('MSG-75.1 The Upscale question for a single photo [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await start(page, testInfo);
  await hand.tap(page.locator('#btnDownload'));
  await check('a card over the photo asks "Upscale to 2000 px?" and reads "The crop is W × H px '
    + 'at the photo’s resolution.", with Yes in red, No and Cancel', async () => {
    await expectQuestion(page, 'Upscale to 2000 px?');
    await expect(questionCard(page).locator('.alert-text')).toHaveText(
      /^The crop is \d+ × \d+ px at the photo’s resolution\.$/,
    );
    await expectQuestionButtons(page, ['Yes', 'No', 'Cancel'], 'Yes');
  });
});

test('MSG-76.1 The Upscale question for a pair\'s Together image [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await makePair(page, testInfo);
  await goToStep(page, 'export', hand);
  await hand.tap(page.locator('#btnDownload'));
  await check('the card reads "The image is W × H px at the photos’ resolution."', async () => {
    await expectQuestion(page, 'Upscale to 2000 px?');
    await expect(questionCard(page).locator('.alert-text')).toHaveText(
      /^The image is \d+ × \d+ px at the photos’ resolution\.$/,
    );
  });
});

test('MSG-77.1 The Upscale question for a pair saved Separately [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await makePair(page, testInfo);
  await goToStep(page, 'export', hand);
  await chooseOutput(page, hand, 'separately');
  await hand.tap(page.locator('#btnDownload'));
  await check('the card reads "The front is W × H px and the back W × H px at the photos’ '
    + 'resolution."', async () => {
    await expectQuestion(page, 'Upscale to 2000 px?');
    await expect(questionCard(page).locator('.alert-text')).toHaveText(
      /^The front is \d+ × \d+ px and the back \d+ × \d+ px at the photos’ resolution\.$/,
    );
  });
});

// True when the question card is what a tap at its middle reaches (nothing lies over it).
function isQuestionOnTop(page) {
  return page.evaluate(() => {
    const card = document.querySelector('#pairPrompt .alert-card');
    const box = card.getBoundingClientRect();
    const top = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
    return card.contains(top);
  });
}

test('MSG-78.1 The Upscale question for corner shots [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await start(page, testInfo);
  await openCornerSheet(page, hand);
  await hand.tap(page.locator('#btnCornerDownload'));
  await check('with 1 sheet, a card above the open sheet asks "Upscale to 2000 px?" and reads '
    + '"The sheet is N px at the photo’s resolution."', async () => {
    await expectQuestion(page, 'Upscale to 2000 px?');
    await expect(questionCard(page).locator('.alert-text')).toHaveText(
      /^The sheet is \d+ px at the photo’s resolution\.$/,
    );
    expect(await isQuestionOnTop(page)).toBe(true);
  });
  await hand.tap(questionButton(page, 'Cancel'));
  await waitForQuestion(page, false);
  await chooseCornerOutput(page, hand, '4 photos');
  await hand.tap(page.locator('#btnCornerDownload'));
  await check('with 4 photos, it reads "Each corner is N px at the photo’s resolution."',
    async () => {
      await expectQuestion(page, 'Upscale to 2000 px?');
      await expect(questionCard(page).locator('.alert-text')).toHaveText(
        /^Each corner is \d+ px at the photo’s resolution\.$/,
      );
    });
});

test('MSG-79.1 The Unpair card [phone]', async ({ page, check }, testInfo) => {
  const hand = await makePair(page, testInfo);
  await hand.tap(page.locator('#btnUnpair'));
  await check('a card over the photo asks "Unpair" and reads "Keep one side as a single photo.", '
    + 'with Keep front, Keep back (neither red) and Cancel', async () => {
    await expectQuestion(page, 'Unpair', 'Keep one side as a single photo.');
    await expectQuestionButtons(page, ['Keep front', 'Keep back', 'Cancel']);
  });
});

test('MSG-80.1 The New photo card [phone]', async ({ page, check }, testInfo) => {
  const hand = await makePair(page, testInfo);
  await pickWith(page, hand, page.locator('#btnOpen'), SLAB_PHOTO);
  await check('a card over the photo asks "New photo" and reads "End the pair, or replace the '
    + 'side you’re on?", with New photo, Replace back and Cancel', async () => {
    await expectQuestion(page, 'New photo', 'End the pair, or replace the side you’re on?');
    await expect(questionCard(page).getByRole('button')).toHaveText([
      'New photo',
      'Replace back',
      'Cancel',
    ]);
  });
});

test('MSG-81.1 "Fix the corners in Perspective first." on the photo, for a person to judge '
  + '[phone]', async ({ page, check }, testInfo) => {
  const hand = await start(page, testInfo, { step: 'perspective' });
  await crossCorners(page, hand);
  await goToStep(page, 'rotate', hand);
  await check.eye('in place of the photo, grey text centered in the photo area reads "Fix the '
    + 'corners in Perspective first."; no picture is drawn');
});

test('MSG-82.1 "Fix the corners of both sides in Perspective first." on the joined image, for '
  + 'a person to judge [phone]', async ({ page, check }, testInfo) => {
  const hand = await makePair(page, testInfo);
  await crossCorners(page, hand);
  await goToStep(page, 'export', hand);
  await check.eye('with Together chosen, grey text centered in the photo area reads "Fix the '
    + 'corners of both sides in Perspective first."; no joined image is drawn');
});

test('MSG-82.2 With the waiting side\'s corners crossed, Export names the side to fix [phone]',
  async ({ page, check }, testInfo) => {
    test.fail(true, 'BUG-034');
    const hand = await makePair(page, testInfo);
    await crossCorners(page, hand);
    // Not switchTo: today the switch stops part-way, and its detection wait would time out.
    await hand.tap(sideButton(page, 'front'));
    await page.waitForFunction(() => {
      const app = window.__straightener.app;
      return app.pair.current === 'front' && !app.isSwitching;
    });
    await goToStep(page, 'export', hand);
    // Plain readings: the known defect fails at once rather than waiting.
    const row = await page.locator('#exportReadoutRow').textContent();
    const dimmed = {
      download: await page.locator('#btnDownload').isDisabled(),
      share: await page.locator('#btnShare').isDisabled(),
      copy: await page.locator('#btnCopy').isDisabled(),
    };
    await check('the row under the size line names the back as the side to fix in Perspective; '
      + 'Share, Download and Copy are greyed out', () => {
      expect(row).toMatch(/back/i);
      expect(dimmed).toEqual({ download: true, share: true, copy: true });
    });
  });

// Opens a step's options and its Tips row. Returns the paragraphs that show.
async function openTips(page, hand, step) {
  await openOptions(page, hand, step);
  await hand.tap(page.locator(`#${step}Tips`));
  return visibleTips(page, `${step}Tips`);
}

// Each step's tips, as the app writes them (the phone shows them all; a wide screen leaves out
// the ones about touch).
const PERSPECTIVE_TIPS = [
  'Drag a corner or the middle of an edge. Double tap a handle to zoom in on it; double tap '
    + 'again to zoom out.',
  'The arrows nudge the selected handle. Hold one to repeat.',
  'Flatten: 0% squares the card up but keeps the camera’s depth. 100% is a flat 5:7 rectangle, '
    + 'like a scan.',
  'Corners on the wrong card? Tap to find card, then tap the card.',
];
const ROTATE_TIPS = [
  'Drag the ruler to straighten, or tap the angle to type it.',
  'Fill frame zooms in so a tilted photo leaves no empty corners.',
  'Flip mirrors the photo as you see it on screen.',
  'The grid is a guide; it is never exported.',
];
const CROP_TIPS = ['Drag inside the box to move it, and its handles to resize.'];
const LEVELS_TIPS = [
  'White: tap a grading label or the card’s white border; avoid foil and reflections. Black is '
    + 'optional.',
  'Auto estimates both from the framed image; colored backdrops can fool it, so check the result.',
  'Hold the photo to compare with no levels. Clear, then Apply, removes levels.',
];
const OVERLAY_TIPS = [
  'Tap a ring to snap the logo to that corner, side or the center. Drag to move it; drag a '
    + 'corner or pinch to resize.',
  'On this step the photo stays framed as set in Crop.',
  'Your last logo is kept in this browser for the next photo.',
  'Delete saved leaves the logo on this photo.',
];
const EXPORT_TIPS = [
  'Share’s Save Image puts the photo in Photos.',
  'Original keeps the crop at the photo’s own resolution and never upscales.',
  'Next card shows once these edits are exported.',
  'An edits file is small. Re-open the same photo, load it, and the export is identical.',
];

test('MSG-83.1 Perspective\'s tips [phone]', async ({ page, check }, testInfo) => {
  const hand = await start(page, testInfo, { step: 'perspective' });
  const tips = await openTips(page, hand, 'perspective');
  await check('four paragraphs open in place, in this order: dragging and double-tapping '
    + 'handles, the arrows, Flatten, and Tap to find card', () => {
    expect(tips).toEqual(PERSPECTIVE_TIPS);
  });
});

test('MSG-84.1 Rotate\'s tips [phone]', async ({ page, check }, testInfo) => {
  const hand = await start(page, testInfo, { step: 'rotate' });
  const tips = await openTips(page, hand, 'rotate');
  await check('four paragraphs open in place: the ruler and the typed angle, Fill frame, Flip '
    + 'and the grid', () => {
    expect(tips).toEqual(ROTATE_TIPS);
  });
});

test('MSG-85.1 Crop\'s tip [phone]', async ({ page, check }, testInfo) => {
  const hand = await start(page, testInfo, { step: 'crop' });
  const tips = await openTips(page, hand, 'crop');
  await check(`one paragraph opens in place: "${CROP_TIPS[0]}"`, () => {
    expect(tips).toEqual(CROP_TIPS);
  });
});

test('MSG-86.1 Levels\' tips [phone]', async ({ page, check }, testInfo) => {
  const hand = await startLevels(page, testInfo);
  await openOptions(page, hand, 'levels');
  const sheet = page.locator('#levelsSheet');
  const tips = await sheet.locator('.sheet-hint:visible').allTextContents();
  await check('a sheet titled "Levels tips" holds three paragraphs: picking white and black, '
    + 'Auto, and holding the photo to compare', async () => {
    await expect(sheet.locator('.sheet-title')).toHaveText('Levels tips');
    expect(tips).toEqual(LEVELS_TIPS);
  });
});

test('MSG-87.1 Overlay\'s tips [phone]', async ({ page, check }, testInfo) => {
  const hand = await startOnOverlay(page, testInfo, { photo: PHOTO });
  const tips = await openTips(page, hand, 'overlay');
  await check('four paragraphs open in place: the rings and gestures, the photo framed as set '
    + 'in Crop, the logo kept in the browser, and Delete saved', () => {
    expect(tips).toEqual(OVERLAY_TIPS);
  });
});

test('MSG-88.1 Export\'s tips [phone]', async ({ page, check }, testInfo) => {
  const hand = await start(page, testInfo);
  const tips = await openTips(page, hand, 'export');
  await check('four paragraphs open in place: Save Image, Original, Next card and the edits '
    + 'file', () => {
    expect(tips).toEqual(EXPORT_TIPS);
  });
});

test('MSG-89.1 The Corner shots sheet\'s hint [phone]', async ({ page, check }, testInfo) => {
  const hand = await start(page, testInfo);
  await openCornerSheet(page, hand);
  const text = 'Close-ups of the card’s four corners, at the photo’s own resolution, with this '
    + 'photo’s levels and no overlay.';
  await check(`the sheet reads "${text}"`, async () => {
    await expect(page.locator('#cornerShotsSheet').getByText(text)).toBeVisible();
  });
});

// The hint under Save edits and Load edits in Export options.
const EDITS_HINT = 'A small JSON file. Re-open the same photo, load it, and the export is '
  + 'identical.';
const editsHint = page => page.locator('#editsPairHint').locator('..');

test('MSG-89.2 The hint under the edits buttons [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await start(page, testInfo);
  await openOptions(page, hand, 'export');
  await check(`under Save edits and Load edits: "${EDITS_HINT}"`, async () => {
    await expect(editsHint(page)).toBeVisible();
    await expect(page.locator('#editsPairHint')).toBeHidden();
    expect(await editsHint(page).innerText()).toBe(EDITS_HINT);
  });
});

test('MSG-89.3 With a pair open, the edits hint says which side it saves [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await makePair(page, testInfo);
  await goToStep(page, 'export', hand);
  await openOptions(page, hand, 'export');
  await check(`the hint reads "Saves the side you’re on. ${EDITS_HINT}", its first sentence in `
    + 'bold', async () => {
    await expect(editsHint(page)).toHaveText(`Saves the side you’re on. ${EDITS_HINT}`);
    await expect(page.locator('#editsPairHint')).toBeVisible();
    expect(await page.locator('#editsPairHint').evaluate(element => element.tagName)).toBe('B');
  });
});

// The keyboard help of the step that is open, on a wide screen: the paragraphs that show.
function keyHelp(page) {
  return page.locator('.sheet-keys.sheet-hint:visible, .sheet-keys .sheet-hint:visible')
    .allTextContents();
}

test('MSG-90.1 Keyboard help on a wide screen [desktop]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await start(page, testInfo, { step: 'rotate' });
  await check('on Rotate, under "Tips and keys": "F fits; 1 to 6 change step."', async () => {
    await expect(page.locator('.sheet-tips-heading:visible')).toHaveText(['Tips and keys']);
    expect(await keyHelp(page)).toEqual(['F fits; 1 to 6 change step.']);
  });
  await goToStep(page, 'crop', hand);
  await check('on Crop, under "Tips and keys": "Shift keeps the aspect in Free."', async () => {
    await expect(page.locator('.sheet-tips-heading:visible')).toHaveText(['Tips and keys']);
    expect(await keyHelp(page)).toEqual(['Shift keeps the aspect in Free.']);
  });
  await goToStep(page, 'export', hand);
  await check('on Export there is no keyboard help', async () => {
    expect(await keyHelp(page)).toEqual([]);
  });
});

test('MSG-91.1 Controls without words have names for screen readers [phone]', async ({
  page,
  check,
}, testInfo) => {
  await start(page, testInfo, { step: 'rotate' });
  await check('the top bar\'s icon buttons are named Open photo, Fit to screen, Undo and Redo',
    async () => {
      await expect(page.locator('#btnOpen')).toHaveAttribute('aria-label', 'Open photo');
      await expect(page.locator('#btnFit')).toHaveAttribute('aria-label', 'Fit to screen');
      await expect(page.locator('#btnUndo')).toHaveAttribute('aria-label', 'Undo');
      await expect(page.locator('#btnRedo')).toHaveAttribute('aria-label', 'Redo');
    });
  await check('the tab with the up arrow above the controls is named Options, and the options '
    + 'sheet\'s close button Close', async () => {
    await expect(page.locator('#rotateAreaGrabber')).toHaveAttribute('aria-label', 'Options');
    await expect(page.locator('#rotateSheet .sheet-close')).toHaveAttribute('aria-label', 'Close');
  });
});

test('MSG-91.3 The nudge keys, Close tuning and the corner thumbnails have names [phone]',
  async ({ page, check }, testInfo) => {
    const hand = await start(page, testInfo, { address: TUNING_LINK, step: 'perspective' });
    await check('the four arrow keys under Nudge are named Nudge left, Nudge up, Nudge down and '
      + 'Nudge right', async () => {
      const names = await page.locator('#perspectiveNudge .nudge-key')
        .evaluateAll(keys => keys.map(key => key.getAttribute('aria-label')));
      expect(names).toEqual(['Nudge left', 'Nudge up', 'Nudge down', 'Nudge right']);
    });
    await check('the tuning panel\'s close button is named Close tuning', async () => {
      await expect(page.locator('#debugClose')).toHaveAttribute('aria-label', 'Close tuning');
    });
    await goToStep(page, 'export', hand);
    await openCornerSheet(page, hand);
    await check('the four thumbnails are named Top-left corner, Top-right corner, Bottom-left '
      + 'corner and Bottom-right corner', async () => {
      const names = await page.locator('#cornerShotsSheet .corner-thumbs canvas')
        .evaluateAll(thumbs => thumbs.map(thumb => thumb.getAttribute('aria-label')));
      expect(names).toEqual([
        'Top-left corner',
        'Top-right corner',
        'Bottom-left corner',
        'Bottom-right corner',
      ]);
    });
  });

test('MSG-91.4 Unpair has a name [phone]', async ({ page, check }, testInfo) => {
  await makePair(page, testInfo);
  await check('Unpair, beside Front / Back, is named Unpair', async () => {
    await expect(page.locator('#btnUnpair')).toBeVisible();
    await expect(page.locator('#btnUnpair')).toHaveAttribute('aria-label', 'Unpair');
  });
});

test('MSG-91.2 Tooltips on a wide screen [desktop]', async ({ page, check }, testInfo) => {
  await start(page, testInfo, { step: 'rotate' });
  await check('Undo\'s tooltip reads "Undo (Ctrl/Cmd+Z)", Redo\'s "Redo (Shift+Ctrl/Cmd+Z)" and '
    + 'Fit\'s "Fit to screen (F)"', async () => {
    await expect(page.locator('#btnUndo')).toHaveAttribute('title', 'Undo (Ctrl/Cmd+Z)');
    await expect(page.locator('#btnRedo')).toHaveAttribute('title', 'Redo (Shift+Ctrl/Cmd+Z)');
    await expect(page.locator('#btnFit')).toHaveAttribute('title', 'Fit to screen (F)');
  });
  await check('the Open button shows the word "Open"', async () => {
    await expect(page.locator('#btnOpen')).toContainText('Open');
    await expect(page.locator('#btnOpen').getByText('Open', { exact: true })).toBeVisible();
  });
});

// The app's version, as config.js gives it.
async function appVersion(page) {
  return page.evaluate(() => CONFIG.appVersion);
}

test('MSG-92.1 The console shows the version and each photo\'s load time [phone]', async ({
  page,
  check,
}, testInfo) => {
  const lines = listenToConsole(page);
  await start(page, testInfo, { step: 'perspective' });
  const version = await appVersion(page);
  await check('the console reads "[card-finisher] vX.Y.Z" at start, with the build\'s version',
    () => {
      expect(lines.map(line => line.text)).toContain(`[card-finisher] v${version}`);
    });
  await check('then "[card-finisher] 01_chrome_flat_black.JPEG: W×H loaded + previewed in N ms"',
    () => {
      const start = `[card-finisher] ${PHOTO}: `;
      const loadTime = /^\d+×\d+ loaded \+ previewed in \d+ ms$/;
      const isLoadLine = text => text.startsWith(start) && loadTime.test(text.slice(start.length));
      expect(lines.some(line => isLoadLine(line.text))).toBe(true);
    });
});

test('MSG-92.2 The console warns about link settings it ignored [phone]', async ({
  page,
  check,
}) => {
  const lines = listenToConsole(page);
  await openApp(page, 'index.html?nonsense=1');
  await check('the console warns "[card-finisher] URL settings ignored …", naming nonsense',
    () => {
      const warning = lines.find(line => line.text.startsWith('[card-finisher] URL settings '
        + 'ignored'));
      expect(warning && warning.type).toBe('warning');
      expect(warning.text).toContain('nonsense');
    });
});

test('MSG-92.3 The console warns when the photo couldn\'t be saved [phone]', async ({
  page,
  check,
}, testInfo) => {
  // Stand-in: the device refuses to store the photo, as a full disk would.
  await refuseStorage(page, ['photo']);
  const lines = listenToConsole(page);
  await start(page, testInfo, { step: 'perspective' });
  await check('the console warns "[card-finisher] session photo not saved:"', async () => {
    await expect.poll(() => lines.some(line => line.type === 'warning'
      && line.text.startsWith('[card-finisher] session photo not saved:'))).toBe(true);
  });
});

test('MSG-92.4 The console warns when the background worker falls back [phone]', async ({
  page,
  check,
}, testInfo) => {
  // Stand-in: a browser that can't start the engine's background worker.
  await page.addInitScript(() => {
    window.Worker = function NoWorker() {
      throw new Error('Stand-in: no background workers');
    };
  });
  const lines = listenToConsole(page);
  await start(page, testInfo, { step: 'perspective' });
  await check('the console warns "[card-finisher] Web Worker unavailable, running on main '
    + 'thread:"; the photo still opens with its card found', async () => {
    expect(lines.some(line => line.type === 'warning' && line.text.startsWith(
      '[card-finisher] Web Worker unavailable, running on main thread:',
    ))).toBe(true);
    expect((await editState(page)).source.name).toBe(PHOTO);
  });
});
