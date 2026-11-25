// The Messages cases (tests/catalog/messages.md): every message the app shows. Each case brings
// a message up the way a person would and checks its words and its kind: information (a white
// pill), a warning (amber, a triangle), an error (red, a circle), or a line above the controls.
// Many messages are raised by steps the finished areas already use; their helpers are reused
// here. A message no control can reach is raised by a stand-in, which the case names.
// Each test drives the app through hand.tap and hand.drag, and reads the app's state only to
// check a result.
'use strict';
const fs = require('fs');
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
  readSavedImage,
  cornerOnPage,
  waitForStill,
  stepNow,
  copiedMessage,
  nextFrames,
  samplePath,
} = require('./support/app.js');
const {
  pickWith,
  waitForStart,
  waitForPhoto,
  waitForSaved,
  reloadToStart,
  resumeAs,
  changeSavedEdits,
  refuseStorage,
  addLogo,
} = require('./support/start-and-session.js');
const {
  CORNER_PHOTO,
  NO_CORNER_QUESTION,
  startOnExport,
  openCornerSheet,
  cornerReadout,
  questionCard,
  questionButton,
  expectQuestion,
  makeCornerShotsImpossible,
  makeCardTooSmallForCorners,
  isCornerSheetOpen,
  placeFrontCorners,
} = require('./support/corner-shots.js');
const {
  SHARE_FAILURE_MESSAGE,
  choiceButton,
  chooseFill,
  waitForExportEnd,
  takeAwayWebpSaving,
  waitForQuestion,
  selectedChoices,
  installShareStandIn,
} = require('./support/export.js');
const {
  makePair,
  sideButton,
  switchTo,
  holdNextOpening,
  releaseOpening,
  waitForOpening,
  chooseOutput,
  chooseSize,
  waitUntilPairStored,
  reloadToResume,
  resume,
  failReadsOf,
  changeStoredPair,
  crossCorners,
  zoomIn,
  openSide,
  readoutSizes,
  PORTRAIT_PAIR,
} = require('./support/front-and-back.js');
const {
  openPicture,
  tapAt,
} = require('./support/perspective.js');
const {
  LEVELS_PHOTO,
  SPOTS,
  startOnLevels,
  spotOnPage,
  pickButton,
  armedPick,
  swatchColor,
  tapPoint,
  photoPointAt,
  viewNow,
} = require('./support/levels.js');
const {
  startOnOverlay,
  oversizedPng,
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
  refusePhotos,
  loseStoredLogo,
  failEncoding,
  slowEncoding,
  refuseClipboard,
  faultGeometry,
  clearGeometryFault,
  fixtureFile,
  tapAndCollect,
  exportNotesNow,
  visibleTips,
} = require('./support/messages.js');
const { toastShownLines } = require('./support/edits-files.js');
const { messageBoxes, isInside } = require('./support/toast.js');
const { typeAngle, angleText } = require('./support/rotate.js');
const {
  cropHandleOnPage,
  sizeLine,
  cropRect,
  frameSize,
} = require('./support/crop.js');
const { recordDrawnText, drawnTextsSoFar, stageShare } = require('./support/photo-view.js');

// The photo most cases use: a raw chrome card flat on a black mat. It is found the same in
// Chromium and WebKit.
const PHOTO = CORNER_PHOTO;
// A second photo, of another size: a PSA slab (1498 × 2098 px).
const SLAB_PHOTO = 'IMG_9136.JPEG';
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
const PHOTO_GONE = 'The saved photo is gone. Open it again.';
const TAP_THE_CARD = 'Tap the card in the photo.';
// The approved wording (tests/catalog/wording.md) of messages that rulings changed.
const OPENED_FRESH = 'Full edit history could not be restored, your photo has been opened '
  + 'fresh.';
const DETECTION_FAILED = 'Detection failed.';
const RESUME_FAILED = 'Couldn’t resume.';
const COPY_FAILED = 'Copy failed.';
const EXPORT_FAILED = 'Export failed.';
const SHARE_FAILED = 'Share failed.';
const CORNERS_FAILED = 'Corner shots failed.';
const SIDE_WAIT = 'Wait for the other side to open, then open the photo.';
const EDITS_LOADED = 'Edits loaded.';
const RESET_CROP = 'Reset, not valid: crop.';
const LOGO_LEFT_OUT = 'Logo left out; it couldn’t be read.';
const FIX_BACK = 'Fix the back’s corners in Perspective first.';
// Ruling R98's approved words for the photo area: the front named, and both sides.
const FIX_FRONT = 'Fix the front’s corners in Perspective first.';
const FIX_BOTH = 'Fix the corners of both sides in Perspective first.';
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
const LONG_ERROR = 'Stand-in failure with a long explanation: the browser stopped part of the '
  + 'way through reading the photo, after taking in every row of it but the last few, and gave '
  + 'up before it could say whether the file was a picture at all or something else.';
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

// The starting screen of the cases whose information message is Resume's (ruling R73 took
// Auto's away): LEVELS_PHOTO opened and taken to Levels, kept on the device, and the page
// reloaded to the start screen, which offers Resume. Returns the hand.
async function startResumableOnLevels(page, testInfo) {
  const hand = await startLevels(page, testInfo);
  await waitForSaved(page, { name: LEVELS_PHOTO, tab: 'levels' });
  await reloadToStart(page);
  return hand;
}

// Taps Resume and waits until the photo is open on Levels and "Resumed where you left off."
// shows. Returns the message's record.
async function resumeOnLevels(page, hand) {
  await resumeAs(page, hand, LEVELS_PHOTO);
  return waitForMessage(page, RESUMED);
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

// Arms Tap to find card (the cases' named action: the options tab, then Tap to find card in
// the sheet); on a phone it waits for the sheet to slide away before the photo is tapped. Then,
// given `check`, it checks the row's result: the line above the controls reads "Tap the card in
// the photo.".
async function armFindCard(page, hand, check = null) {
  await openOptions(page, hand, 'perspective');
  await hand.tap(page.locator('#btnFindCard'));
  if (hand.isTouch) await page.locator('#perspectiveSheet').waitFor({ state: 'hidden' });
  if (!check) return;
  await check(`the line above the controls reads "${TAP_THE_CARD}"`, async () => {
    await expectStatus(page, 'perspectiveStatus', TAP_THE_CARD, 'info');
  });
}

// The middle of the photo area on the page, in CSS px.
function photoAreaMiddle(page) {
  return middleOf(page.locator('#view'));
}

// Raises an error message: Load edits with notes.json (tests/fixtures/), a file that isn't
// JSON, on the Export step. Returns the record of "That file isn’t valid JSON.".
async function raiseError(page, hand) {
  await loadEditsFile(page, hand, fixtureFile('notes.json'));
  return waitForMessage(page, NOT_JSON);
}

// Taps Export in the step tabs and checks the row's result: Export's controls show.
async function goToExportStep(page, hand, check) {
  await goToStep(page, 'export', hand);
  await check('the Export step\'s controls show', async () => {
    await expect(page.locator('#btnDownload')).toBeVisible();
  });
}

// On Levels, taps Pick white or Pick black (which: 'white' or 'black') and checks the row's
// result: it is selected.
async function armPick(page, hand, check, which) {
  await hand.tap(pickButton(page, which));
  const name = which === 'white' ? 'Pick white' : 'Pick black';
  await check(`${name} is selected (a white fill)`, async () => {
    expect(await armedPick(page)).toBe(which);
  });
}

// The question box, as the cases name it where a row first uses it.
const QUESTION_BOX_SENTENCE = 'The question box (the box over the dimmed photo with a question '
  + 'and buttons)';
const UPSCALE_2000 = 'Upscale to 2000 px?';
// What 01_chrome_flat_black.JPEG's export at 2000 saves without upscaling: its 1:1 crop at the
// photo's resolution, in px, and the file's name.
const CROP_PX = 1074;
const SINGLE_FILE = '01_chrome_flat_black-straight.jpg';
// The files a pair of 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG
// saves: Together, and Separately.
const TOGETHER_FILE = '14_front_portrait_raw_white-pair.jpg';
const FRONT_FILE = '14_front_portrait_raw_white-front.jpg';
const BACK_FILE = '14_back_portrait_raw_white-back.jpg';
// The edits file the Load edits cases start from (tests/fixtures/): 01_chrome_flat_black's edits
// after a quarter turn right. Its changed copies are named 01_chrome_flat_black-<kind>-edits.json.
const TURNED_EDITS = '01_chrome_flat_black-turned-edits.json';
// The error the stand-in encoder makes the export raise (support/messages.js, failEncoding).
const ENCODING_FAILED = 'Encoding failed (image too large for this browser?)';
// The canvas-limit note, in the wording Rich approved (rulings R14 and R15).
const SCALED_DOWN = 'Scaled down to fit the 16.7 MP limit.';
// MSG-72.2's and MSG-72.3's link lowers the limit to 1 MP; the note gives the limit in force
// (R47). For a pair saved Separately it names the side not on screen, or says both.
const SCALED_DOWN_1MP = 'Scaled down to fit the 1 MP limit.';
const FRONT_SCALED_DOWN = 'The front is scaled down to fit the 1 MP limit.';
const BOTH_SCALED_DOWN = 'Both sides are scaled down to fit the 1 MP limit.';
// Ruling R102's approved words: the note names the long-side limit when that is the limit that
// set the size. MSG-72.4 to MSG-72.7's links lower it to 1000 px, and the note gives the limit
// in force.
const LONG_SIDE_PX = 1000;
const SCALED_DOWN_1000PX = 'Scaled down to fit the 1000 px limit.';
const BACK_SCALED_DOWN_1000PX = 'The back is scaled down to fit the 1000 px limit.';
const BOTH_SCALED_DOWN_1000PX = 'Both sides are scaled down to fit the 1000 px limit.';
// Ruling R102's approved words for a pair saved Separately whose two sides were scaled down by
// different limits.
const BOTH_BY_DIFFERENT_LIMITS = 'Both sides are scaled down to fit the size limits.';
// MSG-51.1's drag of the top-left corner, and how close its end must be, in CSS px.
const MOVE_PX = 40;
const MOVE_TOLERANCE_PX = 2;
// The line above Perspective's controls once the corners cross.
const CROSSED = 'Corners cross or fold inward. Drag them back into a convex shape.';

// Taps `control`, which asks the Upscale question at 2000 px, and checks the row's result.
async function tapAndExpectUpscale(page, hand, check, control) {
  await hand.tap(control);
  await check(`${QUESTION_BOX_SENTENCE} asks "${UPSCALE_2000}"`, async () => {
    await expectQuestion(page, UPSCALE_2000);
  });
}

// On a pair's Export step, taps Separately and checks the row's result: it is selected.
async function chooseSeparately(page, hand, check) {
  await chooseOutput(page, hand, 'separately');
  await check('Separately is selected (a white fill)', async () => {
    expect(await selectedChoices(page, 'pairOutput')).toEqual(['Separately']);
  });
}

// Taps Corner shots and checks the row's result: its sheet rises.
async function openCornerSheetAndSee(page, hand, check) {
  await openCornerSheet(page, hand);
  await check('The Corner shots sheet rises', async () => {
    expect(await isCornerSheetOpen(page)).toBe(true);
  });
}

// In the open Corner shots sheet, taps `label` ('4 photos' or '1 sheet') and checks the row's
// result: it is selected.
async function chooseCornerChoice(page, hand, check, label) {
  await hand.tap(page.locator('#cornerOutput').getByRole('button', { name: label, exact: true }));
  await check(`${label} is selected (a white fill)`, async () => {
    expect(await selectedChoices(page, 'cornerOutput')).toEqual([label]);
  });
}

// Whether Share corners and Download corners are greyed out, each shown dim and not answering
// a tap: { share, download }. A hidden button is not greyed out.
async function cornerButtonsDimmed(page) {
  const isGreyedOut = async button => (await button.isVisible()) && (await button.isDisabled());
  return {
    share: await isGreyedOut(page.locator('#btnCornerShare')),
    download: await isGreyedOut(page.locator('#btnCornerDownload')),
  };
}

// The size of the picture on the clipboard, in px: { width, height }, or null for none. Pasting
// it would show the same picture; the script reads it directly.
function clipboardPictureSize(page) {
  return page.evaluate(async () => {
    const [item] = await navigator.clipboard.read();
    if (!item || !item.types.includes('image/png')) return null;
    const bitmap = await createImageBitmap(await item.getType('image/png'));
    return { width: bitmap.width, height: bitmap.height };
  });
}

// Loads 01_chrome_flat_black-<kind>-edits.json (tests/fixtures/) with Load edits, waits until
// its quarter turn is on the photo, reads its message off the screen, and then waits long
// enough for any later message. Returns { shown, onScreen }: the messages that showed from the
// load on, and the first one as the screen showed it ({ lines, isCut }, support/edits-files.js).
async function loadAndSettle(page, hand, kind) {
  const before = (await messagesSoFar(page)).length;
  await loadEditsFile(page, hand, fixtureFile(`01_chrome_flat_black-${kind}-edits.json`));
  await page.waitForFunction(() => window.__straightener.app.state.rotation.quarter === 1);
  await page.locator('#toast.is-shown').waitFor();
  const onScreen = await toastShownLines(page);
  await page.waitForTimeout(NOTHING_WAIT_MS);
  return { shown: (await messagesSoFar(page)).slice(before), onScreen };
}

// The row of a load with a problem (rulings R12 and R48): of what loadAndSettle saw, one amber
// message showed and no other, and the screen showed its lines as `lines`, each on a line of
// its own, in order, with none cut off.
function expectOneWarning(loaded, lines) {
  expect(loaded.shown.map(message => message.kind)).toEqual(['warn']);
  expect(loaded.onScreen).toEqual({ lines, isCut: false });
}

// Checks a row whose result is the photo turned a quarter clockwise (`description`).
async function expectTurned(page, check, description) {
  await check(description, async () => {
    expect((await editState(page)).rotation.quarter).toBe(1);
  });
}

// Opens the app from the tuning panel's link, then PHOTO with Open photo on the start screen,
// recording every message. Returns the hand.
async function startTuning(page, testInfo) {
  await watchMessages(page);
  await openApp(page, TUNING_LINK);
  await waitForStart(page);
  const hand = handFor(page, testInfo);
  await pickWith(page, hand, page.locator('#btnOpenEmpty'), PHOTO);
  await waitForPhoto(page, PHOTO);
  return hand;
}

// Expects a step's options sheet to be up, titled `title` (shown in capitals).
async function expectSheetTitle(page, step, title) {
  const heading = page.locator(`#${step}Sheet .sheet-title`);
  await expect(heading).toBeVisible();
  await expect(heading).toHaveText(title);
  await expect(heading).toHaveCSS('text-transform', 'uppercase');
}

// The step's options sheet titles, as the app writes them.
const SHEET_TITLES = {
  perspective: 'Perspective options',
  rotate: 'Rotate options',
  crop: 'Crop options',
  overlay: 'Overlay options',
  export: 'Export options',
};

// Taps the options tab and checks the row's result (the step's options rise), then taps Tips.
// Returns the paragraphs that show.
async function openTips(page, hand, check, step) {
  await openOptions(page, hand, step);
  const title = SHEET_TITLES[step];
  await check(`${title.toUpperCase()} rise from the bottom`, async () => {
    await expectSheetTitle(page, step, title);
  });
  await hand.tap(page.locator(`#${step}Tips`));
  return visibleTips(page, `${step}Tips`);
}

// A list of texts as a row quotes it: "a", "b", "c" and "d".
function quoted(texts) {
  const marked = texts.map(text => `"${text}"`);
  return `${marked.slice(0, -1).join(', ')} and ${marked[marked.length - 1]}`;
}

test('MSG-01.1 A new message takes the place of the one showing at once [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startResumableOnLevels(page, testInfo);
  await resumeOnLevels(page, hand);
  await check(`The photo opens on the Levels step, and "${RESUMED}" shows over the photo`,
    async () => {
      expect(await stepNow(page)).toBe('levels');
      await expect(page.locator('#toast')).toHaveClass(/is-shown/);
      await expect(page.locator('#toast .toast-text')).toHaveText(RESUMED);
    });
  await hand.tap(pickButton(page, 'black'));
  await check('Pick black is selected (a white fill); the message is still up', async () => {
    expect(await armedPick(page)).toBe('black');
    await expect(page.locator('#toast')).toHaveClass(/is-shown/);
    await expect(page.locator('#toast .toast-text')).toHaveText(RESUMED);
  });
  await tapPoint(page, hand, await spotOnPage(page, SPOTS.white));
  await waitForMessage(page, TOO_LIGHT_FOR_BLACK);
  const messages = await messagesSoFar(page);
  const [first, second] = messages.slice(-2);
  await check(`"${TOO_LIGHT_FOR_BLACK}" takes its place at once, the first fading out beneath `
    + 'it; one message shows', async () => {
    expect([first.text, second.text]).toEqual([RESUMED, TOO_LIGHT_FOR_BLACK]);
    expect(first.hiddenAtMs).toBe(second.shownAtMs);
    expect(await fadingCopies(page)).toEqual([RESUMED]);
    await expect(page.locator('.toast-message.is-shown:not(.is-ghost)')).toHaveCount(1);
  });
});

test('MSG-01.2 The message sits over the photo\'s bottom edge [both]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startLevels(page, testInfo);
  await armPick(page, hand, check, 'black');
  await tapPoint(page, hand, await spotOnPage(page, SPOTS.white));
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
  const hand = await startResumableOnLevels(page, testInfo);
  await resumeAs(page, hand, LEVELS_PHOTO);
  const info = await waitUntilGone(page, RESUMED, INFO_MS * 2);
  await check(`"${RESUMED}" stays 3 s`, () => {
    expectStayed(info, INFO_MS);
  });
  await armPick(page, hand, check, 'black');
  await tapPoint(page, hand, await spotOnPage(page, SPOTS.white));
  const warning = await waitUntilGone(page, TOO_LIGHT_FOR_BLACK, WARN_MS * 2);
  await check(`"${TOO_LIGHT_FOR_BLACK}" stays 5 s`, () => {
    expectStayed(warning, WARN_MS);
  });
  await goToExportStep(page, hand, check);
  await loadEditsFile(page, hand, fixtureFile('notes.json'));
  const error = await waitUntilGone(page, NOT_JSON, ERROR_MS * 2);
  await check(`"${NOT_JSON}" stays 6 s`, () => {
    expectStayed(error, ERROR_MS);
  });
});

test('MSG-03.1 Information is white, a warning amber with a triangle, an error red with a '
  + 'circle [phone]', async ({ page, check }, testInfo) => {
  const hand = await startResumableOnLevels(page, testInfo);
  const info = await resumeOnLevels(page, hand);
  await check(`Once the photo is open, "${RESUMED}" is a white pill with no icon`, () => {
    expectKind(info, 'info');
  });
  await armPick(page, hand, check, 'black');
  await tapPoint(page, hand, await spotOnPage(page, SPOTS.white));
  const warning = await waitForMessage(page, TOO_LIGHT_FOR_BLACK);
  await check(`"${TOO_LIGHT_FOR_BLACK}" is amber, led by a triangle`, () => {
    expectKind(warning, 'warn');
  });
  await goToExportStep(page, hand, check);
  const error = await raiseError(page, hand);
  await check(`"${NOT_JSON}" is red, led by a circle`, () => {
    expectKind(error, 'error');
  });
});

test('MSG-03.2 The three kinds of message, for a person to judge [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startResumableOnLevels(page, testInfo);
  await resumeOnLevels(page, hand);
  await check.eye('Once the photo is open, a white pill with dark bold text and no icon, over '
    + 'the photo\'s bottom edge');
  await armPick(page, hand, check, 'black');
  await tapPoint(page, hand, await spotOnPage(page, SPOTS.white));
  await waitForMessage(page, TOO_LIGHT_FOR_BLACK);
  await check.eye('an amber pill led by a dark triangle with an exclamation mark, its text '
    + 'readable against the amber');
  await goToExportStep(page, hand, check);
  await raiseError(page, hand);
  await check('A red message shows, just above the open sheet', async () => {
    await expect(page.locator('#toast')).toHaveClass(/is-error/);
    await expect(page.locator('#toast')).toHaveClass(/is-shown/);
    const { toast } = await toastPlace(page);
    const sheetTop = (await page.locator('#exportSheet .sheet').boundingBox()).y;
    expectNear(toast.bottom, sheetTop - PHONE_BOTTOM_PX);
  });
  await closeOptions(page, hand, 'export');
  await check.eye('a red pill led by a circle with an exclamation mark, over the photo\'s bottom '
    + 'edge, its text white and readable against the red');
});

test('MSG-04.1 A drag that starts on a message moves the photo beneath it [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startResumableOnLevels(page, testInfo);
  await resumeOnLevels(page, hand);
  const start = await middleOf(page.locator('#toast'));
  await check(`Once the photo is open, "${RESUMED}" shows over the photo: the message covers the `
    + 'point the drag starts from', async () => {
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
  const hand = await startOnStartScreen(page, testInfo);
  // Stand-in: no file makes the app show a message this long, so reading a photo is made to
  // fail with a long error, which the app shows as it is.
  await refusePhotos(page, LONG_ERROR);
  await pickWith(page, hand, page.locator('#btnOpenEmpty'), PHOTO);
  await waitForMessage(page, LONG_ERROR);
  await check('a red message shows three lines of text, the rest cut off',
    async () => {
      await expect(page.locator('#toast')).toHaveClass(/is-error/);
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
  const hand = await startResumableOnLevels(page, testInfo);
  await resumeOnLevels(page, hand);
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
  await armPick(page, hand, check, 'black');
  await tapPoint(page, hand, await spotOnPage(page, SPOTS.white));
  await waitForMessage(page, TOO_LIGHT_FOR_BLACK);
  const resting = await toastPlace(page);
  await check('the message\'s bottom is 36 px above the photo area\'s bottom edge', () => {
    expectNear(resting.toast.bottom, resting.stage.bottom - PHONE_BOTTOM_PX);
  });
  await openOptions(page, hand, 'levels');
  const lifted = await toastPlace(page);
  const sheetTop = (await page.locator('#levelsSheet .sheet').boundingBox()).y;
  await check('with LEVELS TIPS open, the message\'s bottom is 36 px above the sheet\'s top edge',
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
  await pickWith(page, hand, page.locator('#btnOpenEmpty'), fixtureFile('card.HEIC'));
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
  await pickWith(page, hand, page.locator('#btnOpenEmpty'), fixtureFile('not-a-photo.JPEG'));
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
  const hand = await startWithSavedPhoto(page, testInfo);
  const { width } = (await page.evaluate(async () => (
    window.__straightener.Session.get('edits'))));
  // No control changes a saved record: this stands in for one the app can't read as written.
  await changeSavedEdits(page, 'width', width + 1);
  await resumeAs(page, hand, PHOTO);
  await page.waitForTimeout(NOTHING_WAIT_MS);
  // A plain reading: the message comes with the photo or not at all.
  const shown = (await messagesSoFar(page)).filter(message => message.text !== 'Loading…');
  await check(`one amber warning reads "${OPENED_FRESH}"`, () => {
    expect(shown.map(message => message.text)).toEqual([OPENED_FRESH]);
    expectKind(shown[0], 'warn');
  });
});

// Checks a red message that ruling R24 words (`approvedText`), then that the error's own words
// (`detail`) went to the console. The red message is the first error the toast showed; it is a
// plain reading.
async function expectPlainError(page, check, approvedText, detail) {
  await page.waitForFunction(() => window.testMessages.some(message => message.kind === 'error'));
  const message = (await messagesSoFar(page)).find(shown => shown.kind === 'error');
  await check(`A red message reads "${approvedText}"`, () => {
    expectKind(message, 'error');
    expect(message.text).toBe(approvedText);
  });
  await check(`The failure's own words, "${detail}", are written to the console as an error`,
    () => {
      expect(check.consoleErrors().join('\n')).toContain(detail);
    });
}

test('MSG-11.1 A failed search says "Detection failed." [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await start(page, testInfo, { step: 'perspective' });
  // Stand-in: no photo makes detection fail, so the detector is made to throw.
  await refuseDetection(page, STAND_IN_ERROR);
  await armFindCard(page, hand, check);
  await tapAt(page, hand, await photoAreaMiddle(page));
  await expectPlainError(page, check, DETECTION_FAILED, STAND_IN_ERROR);
});

test('MSG-12.1 Resume after the saved photo has gone [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startWithSavedPhoto(page, testInfo);
  const secondTab = await page.context().newPage();
  await openApp(secondTab);
  await waitForStart(secondTab);
  await check('the second tab\'s start screen offers Resume and Start fresh too', async () => {
    await expect(secondTab.locator('#btnResume')).toBeVisible();
    await expect(secondTab.locator('#btnFresh')).toBeVisible();
  });
  await handFor(secondTab, testInfo).tap(secondTab.locator('#btnFresh'));
  await check('Resume and Start fresh go from the second tab', async () => {
    await expect(secondTab.locator('#btnResume')).toBeHidden();
    await expect(secondTab.locator('#btnFresh')).toBeHidden();
  });
  await page.bringToFront();
  await hand.tap(page.locator('#btnResume'));
  const message = await waitForMessage(page, PHOTO_GONE);
  await check(`an amber warning reads "${PHOTO_GONE}"`, () => {
    expectKind(message, 'warn');
  });
});

test('MSG-13.1 A Resume that fails says "Couldn’t resume." [phone]', async ({
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
  await hand.tap(page.locator('#btnResume'));
  await page.waitForFunction(() => window.testMessages.some(message => message.kind === 'error'));
  const message = (await messagesSoFar(page)).find(shown => shown.kind === 'error');
  await check(`a red message reads "${RESUME_FAILED}"`, () => {
    expectKind(message, 'error');
    expect(message.text).toBe(RESUME_FAILED);
  });
  await check('the browser\'s own error is written there as an error', () => {
    expect(check.consoleErrors().join('\n')).toContain('Failed to execute');
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
  await watchMessages(page);
  const lines = listenToConsole(page);
  await openApp(page, 'index.html?selftest=0');
  await waitForStart(page);
  await page.waitForTimeout(NOTHING_WAIT_MS);
  const shown = (await messagesSoFar(page)).map(message => message.text);
  await check('no message starting "Self-tests:" shows over the start screen', () => {
    expect(shown.filter(text => text.startsWith('Self-tests:'))).toEqual([]);
  });
  await check('it has no "[card-finisher] self-tests" group: no self-tests ran', () => {
    const groups = lines.filter(line => line.text.startsWith('[card-finisher] self-tests'));
    expect(groups).toEqual([]);
  });
});

test('MSG-15.1 Auto with nothing to go on [phone]', async ({ page, check }, testInfo) => {
  const hand = await startLevels(page, testInfo);
  await openPicture(page, fixtureFile('plain-white.png'));
  await goToStep(page, 'levels', hand);
  await hand.tap(page.locator('#toolAutoLevels'));
  const message = await waitForMessage(page, AUTO_FAILED);
  await check(`an amber warning reads "${AUTO_FAILED}"`, () => {
    expectKind(message, 'warn');
  });
});

test('MSG-18.1 A pick off the photo [phone]', async ({ page, check }, testInfo) => {
  const hand = await startLevels(page, testInfo);
  const box = await page.locator('#view').boundingBox();
  const middle = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  await hand.drag(middle, { x: middle.x + PAN_PX, y: middle.y });
  await check('the empty area past the photo\'s left edge shows', async () => {
    expect((await photoPointAt(page, { x: box.x + 1, y: middle.y }))[0]).toBeLessThan(0);
  });
  await armPick(page, hand, check, 'white');
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
  await pickDarkSpot(page, hand, check, 'black');
  await armPick(page, hand, check, 'white');
  await tapPoint(page, hand, await spotOnPage(page, SPOTS.dark));
  const message = await waitForMessage(page, DARKER_THAN_BLACK);
  await check(`an amber warning reads "${DARKER_THAN_BLACK}"; Pick white stays selected`,
    async () => {
      expectKind(message, 'warn');
      expect(await armedPick(page)).toBe('white');
    });
});

test('MSG-20.1 A black pick that is too light [phone]', async ({ page, check }, testInfo) => {
  const hand = await startLevels(page, testInfo);
  await armPick(page, hand, check, 'black');
  await tapPoint(page, hand, await spotOnPage(page, SPOTS.white));
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
  await pickDarkSpot(page, hand, check, 'white');
  await armPick(page, hand, check, 'black');
  await tapPoint(page, hand, await spotOnPage(page, SPOTS.dark));
  const message = await waitForMessage(page, BRIGHTER_THAN_WHITE);
  await check(`an amber warning reads "${BRIGHTER_THAN_WHITE}"; Pick black stays selected`,
    async () => {
      expectKind(message, 'warn');
      expect(await armedPick(page)).toBe('black');
    });
});

// The brightest a channel of the dark grey a pick of the card's dark background gives may be
// (0 to 255): the black-point limit, CONFIG.levels.maxBlackLuma.
const DARK_GREY_MAX = 100;

// MSG-19.1's and MSG-21.1's first two rows: arms `which` pick ('white' or 'black'), taps the
// card's dark background, and checks that the pick's color patch fills with a dark grey.
async function pickDarkSpot(page, hand, check, which) {
  await armPick(page, hand, check, which);
  await tapPoint(page, hand, await spotOnPage(page, SPOTS.dark));
  const name = which === 'white' ? 'Pick white' : 'Pick black';
  await check(`the color patch beside ${name} (the small square that shows the color picked) `
    + 'fills with a dark grey', async () => {
    await expect.poll(() => swatchColor(page, which)).not.toBeNull();
    const color = await swatchColor(page, which);
    expect(Math.max(...color)).toBeLessThanOrEqual(DARK_GREY_MAX);
  });
}

// The page's console from now on: every message's type and text, in order.
function listenToConsole(page) {
  const lines = [];
  page.on('console', message => lines.push({ type: message.type(), text: message.text() }));
  return lines;
}

// Any finished message: it gives the seconds the save took, to one decimal place.
const ANY_FINISHED = / in \d+\.\d s\./;

// A finished message with its seconds written as N, as the cases' rows write it ("Photo
// downloaded: 1074 × 1074 px in N s."). The seconds must have one decimal place.
const withSecondsAsN = text => text.replace(/ in \d+\.\d s\./, ' in N s.');

// Waits for the next finished message and checks the row's result: a white message reads
// `wanted` (the seconds written as N), N the seconds the save took, to one decimal place.
async function expectFinished(page, check, wanted) {
  const message = await waitForMessage(page, ANY_FINISHED);
  await check(`A white message reads "${wanted}", N the seconds it took, to one decimal place`,
    () => {
      expect(withSecondsAsN(message.text)).toBe(wanted);
      expectKind(message, 'info');
    });
}

test('MSG-22.1 A single photo\'s Download says what it saved [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await start(page, testInfo);
  await tapAndExpectUpscale(page, hand, check, page.locator('#btnDownload'));
  const [saved] = await tapAndCollect(page, hand, questionButton(page, 'No'), 1);
  const { width, height } = await readSavedImage(page, saved.file);
  await check(`One file is saved: ${SINGLE_FILE}, 1074 × 1074 px`, () => {
    expect({ name: saved.name, width, height }).toEqual({
      name: SINGLE_FILE,
      width: CROP_PX,
      height: CROP_PX,
    });
  });
  await expectFinished(page, check, 'Photo downloaded: 1074 × 1074 px in N s.');
});

test('MSG-22.2 A single photo\'s Share says what it shared [phone]', async ({
  page,
  check,
}, testInfo) => {
  // The page gets a stand-in share sheet (start's default) that takes the file at once.
  const hand = await start(page, testInfo);
  await tapAndExpectUpscale(page, hand, check, page.locator('#btnShare'));
  await hand.tap(questionButton(page, 'No'));
  await page.waitForFunction(() => window.testShares.length === 1);
  const shared = await page.evaluate(() => window.testShares[0].files.map(file => file.name));
  await check(`The share sheet is handed one file, ${SINGLE_FILE}`, () => {
    expect(shared).toEqual([SINGLE_FILE]);
  });
  await expectFinished(page, check, 'Photo shared: 1074 × 1074 px in N s.');
});

test('MSG-23.1 A pair\'s Together Download says so [phone]', async ({
  page,
  check,
}, testInfo) => {
  await watchMessages(page);
  const hand = await makePair(page, testInfo);
  await goToStep(page, 'export', hand);
  await tapAndExpectUpscale(page, hand, check, page.locator('#btnDownload'));
  const saved = await tapAndCollect(page, hand, questionButton(page, 'No'), 1);
  const { width, height } = await readSavedImage(page, saved[0].file);
  await check(`One file is saved: ${TOGETHER_FILE}, 1583 × 1100 px`, () => {
    expect({ names: saved.map(file => file.name), width, height }).toEqual({
      names: [TOGETHER_FILE],
      width: 1583,
      height: 1100,
    });
  });
  await expectFinished(page, check, 'Front and back downloaded: 1583 × 1100 px in N s.');
});

test('MSG-24.1 A pair\'s Separately Download says so [phone]', async ({
  page,
  check,
}, testInfo) => {
  await watchMessages(page);
  const hand = await makePair(page, testInfo);
  await placeFrontCorners(page, hand);
  await goToStep(page, 'export', hand);
  await chooseSeparately(page, hand, check);
  await tapAndExpectUpscale(page, hand, check, page.locator('#btnDownload'));
  const saved = await tapAndCollect(page, hand, questionButton(page, 'No'), 2);
  const sizes = {};
  for (const file of saved) {
    const { width, height } = await readSavedImage(page, file.file);
    sizes[file.name] = `${width} × ${height} px`;
  }
  await check(`Two files are saved: ${FRONT_FILE}, 748 × 1047 px, and ${BACK_FILE}, 785 × 1100 `
    + 'px', () => {
    expect(sizes).toEqual({ [FRONT_FILE]: '748 × 1047 px', [BACK_FILE]: '785 × 1100 px' });
  });
  await expectFinished(page, check,
    'Front and back downloaded: 748 × 1047 px and 785 × 1100 px in N s.');
});

test('MSG-25.1 Download corners with 1 sheet says so [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await start(page, testInfo, { address: NO_CORNER_QUESTION });
  await openCornerSheetAndSee(page, hand, check);
  await chooseCornerChoice(page, hand, check, '1 sheet');
  const saved = await tapAndCollect(page, hand, page.locator('#btnCornerDownload'), 1);
  const isAsked = await page.locator('#pairPrompt').isVisible();
  const { width, height } = await readSavedImage(page, saved[0].file);
  await check('One file is saved: 01_chrome_flat_black-corners.jpg, 314 × 314 px; no question '
    + 'box asks first', () => {
    expect(saved.map(file => file.name)).toEqual(['01_chrome_flat_black-corners.jpg']);
    expect({ width, height }).toEqual({ width: 314, height: 314 });
    expect(isAsked).toBe(false);
  });
  await expectFinished(page, check, 'Corner sheet downloaded: 314 × 314 px in N s.');
});

test('MSG-26.1 Download corners with 4 photos says so [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await start(page, testInfo, { address: NO_CORNER_QUESTION });
  await openCornerSheetAndSee(page, hand, check);
  await chooseCornerChoice(page, hand, check, '4 photos');
  const saved = await tapAndCollect(page, hand, page.locator('#btnCornerDownload'), 4);
  const sizes = [];
  for (const file of saved) {
    const { width, height } = await readSavedImage(page, file.file);
    sizes.push(`${width} × ${height} px`);
  }
  await check('Four files are saved, each 156 × 156 px: 01_chrome_flat_black-corner-tl.jpg, '
    + '-corner-tr.jpg, -corner-bl.jpg and -corner-br.jpg', () => {
    const names = ['bl', 'br', 'tl', 'tr'].map(corner => `01_chrome_flat_black-corner-${corner}`
      + '.jpg');
    expect(saved.map(file => file.name).sort()).toEqual(names);
    expect(sizes).toEqual(names.map(() => '156 × 156 px'));
  });
  await expectFinished(page, check, '4 corner photos downloaded: 156 × 156 px each in N s.');
});

// The sentence a WebP export gains where the browser saved a PNG instead, and the one a
// refused share gains. Each is a line of its own under the finished sentence (ruling R99).
const WEBP_AS_PNG = 'WEBP isn’t supported by this browser, so it was saved as PNG.';
const TAP_SHARE_NOW = 'Tap Share now to open the share sheet.';

// The finished message as the screen shows it now: { lines, isCut } (toastShownLines), with
// the seconds in its lines written as N.
async function finishedLinesShown(page) {
  const shown = await toastShownLines(page);
  return { lines: shown.lines.map(withSecondsAsN), isCut: shown.isCut };
}

test('MSG-27.1 A format the browser couldn\'t save is named [phone]', async ({
  page,
  check,
}, testInfo) => {
  // Stand-in: the browser hands back a PNG when asked for WebP, as Safari does.
  await takeAwayWebpSaving(page);
  const hand = await start(page, testInfo);
  await hand.tap(choiceButton(page, 'exportFormat', 'WebP'));
  await check('WebP is selected (a white fill)', async () => {
    expect(await selectedChoices(page, 'exportFormat')).toEqual(['WebP']);
  });
  await tapAndExpectUpscale(page, hand, check, page.locator('#btnDownload'));
  const saved = await tapAndCollect(page, hand, questionButton(page, 'No'), 1);
  await check('One file is saved, and it is a PNG: 01_chrome_flat_black-straight.png', () => {
    expect(saved.map(file => file.name)).toEqual(['01_chrome_flat_black-straight.png']);
    expect(fs.readFileSync(saved[0].file).subarray(1, 4).toString()).toBe('PNG');
  });
  const message = await waitForMessage(page, / s\. WEBP isn’t supported/);
  const onScreen = await finishedLinesShown(page);
  await check('An amber warning reads, on two lines with neither cut off, "Photo downloaded: '
    + `1074 × 1074 px in N s." and "${WEBP_AS_PNG}", N the seconds it took, to one decimal `
    + 'place', () => {
    expect(onScreen).toEqual({
      lines: ['Photo downloaded: 1074 × 1074 px in N s.', WEBP_AS_PNG],
      isCut: false,
    });
    expectKind(message, 'warn');
  });
  const gone = await waitUntilGone(page, message.text, ERROR_MS * 2);
  await check('It stays 6 s', () => {
    expectStayed(gone, ERROR_MS);
  });
});

test('MSG-28.1 A refused share says to tap Share now [phone]', async ({
  page,
  check,
}, testInfo) => {
  // Stand-in: a share sheet that refuses the first share, as Safari does after a slow export.
  const hand = await start(page, testInfo, { share: 'refuseOnce' });
  await tapAndExpectUpscale(page, hand, check, page.locator('#btnShare'));
  await hand.tap(questionButton(page, 'No'));
  const message = await waitForMessage(page, /Tap Share now to open the share sheet\.$/);
  const onScreen = await finishedLinesShown(page);
  await check('A white message reads, on two lines with neither cut off, "Photo ready: 1074 × '
    + `1074 px in N s." and "${TAP_SHARE_NOW}", N the seconds the export took, to one decimal `
    + 'place; the red button reads Share now', async () => {
    expect(onScreen).toEqual({
      lines: ['Photo ready: 1074 × 1074 px in N s.', TAP_SHARE_NOW],
      isCut: false,
    });
    expectKind(message, 'info');
    await expect(page.locator('#btnShare')).toContainText('Share now');
  });
  await hand.tap(page.locator('#btnShare'));
  await check('The message goes at once, well before its 6 s are up', async () => {
    await expect(page.locator('#toast')).not.toHaveClass(/is-shown/);
    const after = (await messagesSoFar(page)).find(shown => shown.text === message.text);
    expect(shownForMs(after)).toBeLessThan(ERROR_MS - LATE_MS);
  });
});

// The lines of MSG-28.3's and MSG-28.4's message, the seconds written as N: a pair's Together
// image, asked for as WebP and saved as PNG, waiting for Share now.
const THREE_SENTENCES = ['Front and back ready: 1583 × 1100 px in N s.', WEBP_AS_PNG,
  TAP_SHARE_NOW];

// The body of MSG-28.3 and MSG-28.4 (ruling R99): a pair's Share of a WebP the browser saves
// as PNG, refused once, shows a finished message of three sentences, each on a line of its own
// and every line whole, inside the photo area, for 6 s. The cases differ in the size of the
// phone.
async function checkThreeSentencesWhole(page, check, testInfo) {
  await watchMessages(page);
  // Stand-ins: the browser hands back a PNG when asked for WebP, and the share sheet refuses
  // the first share, both as Safari does.
  await takeAwayWebpSaving(page);
  await installShareStandIn(page, 'refuseOnce');
  const hand = await makePair(page, testInfo);
  await goToStep(page, 'export', hand);
  await hand.tap(choiceButton(page, 'exportFormat', 'WebP'));
  await check('WebP is selected (a white fill)', async () => {
    expect(await selectedChoices(page, 'exportFormat')).toEqual(['WebP']);
  });
  await tapAndExpectUpscale(page, hand, check, page.locator('#btnShare'));
  await hand.tap(questionButton(page, 'No'));
  const message = await waitForMessage(page, /Tap Share now to open the share sheet\.$/);
  const onScreen = await finishedLinesShown(page);
  await check(`An amber warning shows over the photo; its lines read ${quoted(THREE_SENTENCES)}, `
    + 'in that order, each sentence starting a line of its own, N the seconds the export took, '
    + 'to one decimal place', () => {
    expectKind(message, 'warn');
    expect(onScreen.lines).toEqual(THREE_SENTENCES);
  });
  await waitForStill(page);
  const boxes = await messageBoxes(page);
  await check('Every line is shown whole, none cut off or ending in "…", and the whole message '
    + 'is inside the photo area, between the top bar and the controls', () => {
    // Whole: none of the text is cut off below the message's last row, there is a line for
    // each sentence, and each line lies inside the message.
    expect(onScreen.isCut).toBe(false);
    expect(boxes.lines.length).toBe(THREE_SENTENCES.length);
    expect(isInside(boxes.toast, boxes.stage)).toBe(true);
    expect(boxes.lines.every(line => isInside(line, boxes.toast))).toBe(true);
  });
  const gone = await waitUntilGone(page, message.text, ERROR_MS * 2);
  await check('It stays 6 s', () => {
    expectStayed(gone, ERROR_MS);
  });
}

test('MSG-28.3 A pair\'s finished message of three sentences shows every line whole [phone] '
  + '[webkit]', async ({ page, check }, testInfo) => {
  await checkThreeSentencesWhole(page, check, testInfo);
});

test('MSG-28.4 On a small phone a pair\'s finished message of three sentences shows every '
  + 'line whole [small]', async ({ page, check }, testInfo) => {
  await checkThreeSentencesWhole(page, check, testInfo);
});

// Any message a finished Copy shows: it names the format on the clipboard.
const ANY_COPIED = /\(PNG\)\.$/;

test('MSG-29.1 Copy says what it put on the clipboard [phone]', async ({
  page,
  context,
  browserName,
  check,
}, testInfo) => {
  test.skip(browserName !== 'chromium', 'Only Chromium lets a test use the clipboard');
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const hand = await start(page, testInfo);
  await tapAndExpectUpscale(page, hand, check, page.locator('#btnCopy'));
  await hand.tap(questionButton(page, 'No'));
  const message = await waitForMessage(page, ANY_COPIED);
  const copied = await clipboardPictureSize(page);
  await check(`A white message reads "${copiedMessage()}"; the clipboard holds a 1074 × 1074 `
    + 'px picture', () => {
    expect(message.text).toBe(copiedMessage());
    expectKind(message, 'info');
    expect(copied).toEqual({ width: CROP_PX, height: CROP_PX });
  });
});

test('MSG-29.2 A pair\'s Copy says it copied the front and back [phone]', async ({
  page,
  context,
  browserName,
  check,
}, testInfo) => {
  test.skip(browserName !== 'chromium', 'Only Chromium lets a test use the clipboard');
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await watchMessages(page);
  const hand = await makePair(page, testInfo);
  await goToStep(page, 'export', hand);
  await chooseSize(page, hand, '0');
  await check('Original is selected (a white fill): at the photos\' own resolution no question '
    + 'box asks first', async () => {
    expect(await selectedChoices(page, 'exportSize')).toEqual(['Original']);
  });
  await hand.tap(page.locator('#btnCopy'));
  const message = await waitForMessage(page, ANY_COPIED);
  await check(`A white message reads "${copiedMessage(true)}"`, () => {
    expect(message.text).toBe(copiedMessage(true));
    expectKind(message, 'info');
  });
});

test('MSG-30.1 A failed Copy says "Copy failed." [phone]', async ({
  page,
  check,
}, testInfo) => {
  // Stand-in: the clipboard refuses every write, as a browser that blocks the page does.
  await refuseClipboard(page, STAND_IN_ERROR);
  const hand = await start(page, testInfo);
  await tapAndExpectUpscale(page, hand, check, page.locator('#btnCopy'));
  await hand.tap(questionButton(page, 'No'));
  await expectPlainError(page, check, COPY_FAILED, STAND_IN_ERROR);
});

test('MSG-31.1 A failed Download says "Export failed." [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await start(page, testInfo);
  // Stand-in: the browser hands back no file, as when a canvas is too big for it.
  await failEncoding(page);
  await tapAndExpectUpscale(page, hand, check, page.locator('#btnDownload'));
  await hand.tap(questionButton(page, 'No'));
  await expectPlainError(page, check, EXPORT_FAILED, ENCODING_FAILED);
});

test('MSG-32.1 A failed share says "Share failed." [phone]', async ({
  page,
  check,
}, testInfo) => {
  // Stand-in: a share sheet that fails with an error of its own.
  const hand = await start(page, testInfo, { share: 'fail' });
  await tapAndExpectUpscale(page, hand, check, page.locator('#btnShare'));
  await hand.tap(questionButton(page, 'No'));
  await expectPlainError(page, check, SHARE_FAILED, SHARE_FAILURE_MESSAGE);
});

// The advice an export gives when the photo's logo isn't loaded (ruling R49).
const LOGO_NOT_LOADED = 'The logo isn’t loaded. Open the Overlay step and add it again.';

test('MSG-94.1 An export whose logo isn\'t loaded says how to get it back [phone]', async ({
  page,
  check,
}, testInfo) => {
  await watchMessages(page);
  const hand = await startOnOverlay(page, testInfo, { photo: PHOTO });
  const logo = await addLogo(page, hand, page.locator('#btnOverlayAdd'), 'icon.svg');
  await waitForSaved(page, { name: PHOTO, tab: 'overlay', overlayId: logo });
  await reloadToStart(page);
  // Stand-in: the logo kept on the device goes, as when a browser clears part of a site's
  // storage; the saved edits still place it on the photo.
  await loseStoredLogo(page);
  await resumeAs(page, hand, PHOTO);
  await check('The photo opens on the Overlay step', async () => {
    expect(await stepNow(page)).toBe('overlay');
  });
  await goToExportStep(page, hand, check);
  await tapAndExpectUpscale(page, hand, check, page.locator('#btnDownload'));
  const arrived = [];
  page.on('download', download => arrived.push(download.suggestedFilename()));
  await hand.tap(questionButton(page, 'No'));
  await page.waitForFunction(() => window.testMessages.some(message => message.kind === 'error'));
  await waitForExportEnd(page);
  await page.waitForTimeout(NOTHING_WAIT_MS);
  const errors = (await messagesSoFar(page)).filter(message => message.kind === 'error');
  await check(`No file is saved; one red message reads "${LOGO_NOT_LOADED}"`, () => {
    expect(arrived).toEqual([]);
    expect(errors.map(message => message.text)).toEqual([LOGO_NOT_LOADED]);
    expectKind(errors[0], 'error');
  });
});

// The largest edits file the app reads, in bytes (CONFIG.export.editsMaxBytes: 8 MB).
const EDITS_MAX_BYTES = 8 * 1024 * 1024;

test('MSG-33.1 An edits file over 8 MB [phone]', async ({ page, check }, testInfo) => {
  const hand = await start(page, testInfo);
  // Too large to keep in tests/fixtures/: 8 MB and one byte of spaces, as the case says.
  const tooLarge = {
    name: 'big-edits.json',
    mimeType: 'application/json',
    buffer: Buffer.alloc(EDITS_MAX_BYTES + 1, ' '),
  };
  await loadEditsFile(page, hand, tooLarge);
  const text = 'That file is too large to be a Card Finisher edits file.';
  const message = await waitForMessage(page, text);
  await check(`A red message reads "${text}"`, () => {
    expectKind(message, 'error');
  });
});

test('MSG-34.1 An edits file that isn\'t JSON [phone]', async ({ page, check }, testInfo) => {
  const hand = await start(page, testInfo);
  await loadEditsFile(page, hand, fixtureFile('notes.json'));
  const message = await waitForMessage(page, NOT_JSON);
  await check(`A red message reads "${NOT_JSON}"`, () => {
    expectKind(message, 'error');
  });
});

test('MSG-35.1 JSON that isn\'t an edits file [phone]', async ({ page, check }, testInfo) => {
  const hand = await start(page, testInfo);
  await loadEditsFile(page, hand, fixtureFile('list.json'));
  const text = 'That isn’t a Card Finisher edits file.';
  const message = await waitForMessage(page, text);
  await check(`A red message reads "${text}"`, () => {
    expectKind(message, 'error');
  });
});

test('MSG-36.1 Edits with no photo open [phone]', async ({ page, check }, testInfo) => {
  await startOnStartScreen(page, testInfo);
  // Load edits is greyed out with no photo, so the file is handed straight to its picker.
  await page.setInputFiles('#editsInput', fixtureFile(TURNED_EDITS));
  const text = 'Open the matching photo first, then load its edits.';
  const message = await waitForMessage(page, text);
  await check(`An amber warning reads "${text}"; the start screen stays`, async () => {
    expectKind(message, 'warn');
    await expect(page.locator('#empty')).toBeVisible();
  });
});

test('MSG-37.1 Edits for a photo of another size [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await start(page, testInfo, { photo: SLAB_PHOTO });
  await loadEditsFile(page, hand, fixtureFile(TURNED_EDITS));
  // Ruling R58: sizes are written "W × H".
  const text = 'These edits are for a 1536 × 2048 photo; this one is 1498 × 2098.';
  const message = await waitForMessage(page, text);
  await check(`A red message reads "${text}"`, () => {
    expectKind(message, 'error');
  });
  await check('It is still upright: nothing was applied', async () => {
    expect((await editState(page)).rotation.quarter).toBe(0);
  });
});

test('MSG-38.1 Edits saved for a file of another name [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await start(page, testInfo);
  const loaded = await loadAndSettle(page, hand, 'another-name');
  const lines = [EDITS_LOADED, 'Saved for “another-card.JPEG”; sizes match.'];
  await check('One amber message shows, and no other comes after it; its lines read '
    + `"${lines[0]}" and "${lines[1]}", in that order`, () => {
    expectOneWarning(loaded, lines);
  });
  await expectTurned(page, check, 'It is turned a quarter clockwise: the edits were applied');
});

test('MSG-38.2 Three problems in one edits file make one warning [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await start(page, testInfo);
  const loaded = await loadAndSettle(page, hand, 'three-problems');
  await check('One amber message shows, and no other comes after it', () => {
    expect(loaded.shown.map(message => message.kind)).toEqual(['warn']);
  });
  const lines = [EDITS_LOADED, 'Saved for “another-card.JPEG”; sizes match.', RESET_CROP,
    LOGO_LEFT_OUT];
  await check(`Its lines read ${lines.map(line => `"${line}"`).join(', ')}, in that order`,
    () => {
      expect(loaded.onScreen).toEqual({ lines, isCut: false });
    });
  await check('It is turned a quarter clockwise, with no logo: the rest was applied', async () => {
    const state = await editState(page);
    expect({ quarter: state.rotation.quarter, overlay: state.overlay }).toEqual({
      quarter: 1,
      overlay: null,
    });
  });
});

test('MSG-38.3 An edits file that names no photo says it was saved for another photo [phone]',
  async ({ page, check }, testInfo) => {
    const hand = await start(page, testInfo);
    const loaded = await loadAndSettle(page, hand, 'no-name');
    // Ruling R97: with no photo name in the file, the line names "another photo".
    const lines = [EDITS_LOADED, 'Saved for “another photo”; sizes match.'];
    await check('One amber message shows, and no other comes after it; its lines read '
      + `"${lines[0]}" and "${lines[1]}", in that order`, () => {
      expectOneWarning(loaded, lines);
    });
    await expectTurned(page, check, 'It is turned a quarter clockwise: the edits were applied');
  });

test('MSG-39.1 Settings in the edits file that were reset [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await start(page, testInfo);
  const loaded = await loadAndSettle(page, hand, 'crop-as-words');
  const lines = [EDITS_LOADED, RESET_CROP];
  await check(`One amber message shows; its lines read "${lines[0]}" and "${lines[1]}", in that `
    + 'order', () => {
    expectOneWarning(loaded, lines);
  });
  await expectTurned(page, check, 'It is turned a quarter clockwise: the rest of the file was '
    + 'applied');
});

test('MSG-40.1 A logo in the edits file that can\'t be read [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await start(page, testInfo);
  const loaded = await loadAndSettle(page, hand, 'gif-logo');
  const lines = [EDITS_LOADED, LOGO_LEFT_OUT];
  await check(`One amber message shows; its lines read "${lines[0]}" and "${lines[1]}", in that `
    + 'order', () => {
    expectOneWarning(loaded, lines);
  });
  await check('It is turned a quarter clockwise, with no logo: the rest was applied', async () => {
    const state = await editState(page);
    expect({ quarter: state.rotation.quarter, overlay: state.overlay }).toEqual({
      quarter: 1,
      overlay: null,
    });
  });
});

test('MSG-93.1 A loaded edits file says so [phone]', async ({ page, check }, testInfo) => {
  const hand = await start(page, testInfo);
  const loaded = await loadAndSettle(page, hand, 'turned');
  await check(`A white message reads "${EDITS_LOADED}", and no other message comes after it`,
    () => {
      expect(loaded.shown.map(message => message.text)).toEqual([EDITS_LOADED]);
      expectKind(loaded.shown[0], 'info');
      expect(loaded.onScreen).toEqual({ lines: [EDITS_LOADED], isCut: false });
    });
  await expectTurned(page, check, 'It is turned a quarter clockwise: the edits were applied');
});

// The tuning panel's link: it opens with the panel showing.
const TUNING_LINK = 'index.html?debug';

test('MSG-41.1 Copy CONFIG says it copied [desktop]', async ({
  page,
  context,
  browserName,
  check,
}, testInfo) => {
  test.skip(browserName !== 'chromium', 'Only Chromium lets a test use the clipboard');
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const hand = await startTuning(page, testInfo);
  await hand.tap(page.locator('#debugCopy'));
  const message = await waitForMessage(page, 'CONFIG copied.');
  await check('A white message reads "CONFIG copied."', () => {
    expectKind(message, 'info');
  });
  // Pasting reads the clipboard; the script reads it directly.
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  await check('The pasted text starts "const CONFIG = ": the clipboard holds the settings', () => {
    expect(copied.startsWith('const CONFIG = ')).toBe(true);
  });
});

test('MSG-42.1 Copy CONFIG with the clipboard blocked [desktop]', async ({
  page,
  check,
}, testInfo) => {
  // Stand-in: the clipboard refuses every write, as a browser that blocks the page does.
  await refuseClipboard(page, STAND_IN_ERROR);
  const lines = listenToConsole(page);
  const hand = await startTuning(page, testInfo);
  await hand.tap(page.locator('#debugCopy'));
  // Ruling R60: two sentences. The message is awaited by its first words and compared whole.
  const text = 'Clipboard blocked. CONFIG printed to the console.';
  const message = await waitForMessage(page, /^Clipboard blocked/);
  await check(`An amber warning reads "${text}"`, () => {
    expect(message.text).toBe(text);
    expectKind(message, 'warn');
  });
  await check('It holds the settings, starting "const CONFIG = "', () => {
    expect(lines.some(line => line.text.startsWith('const CONFIG = '))).toBe(true);
  });
});

test('MSG-43.1 A logo the browser won\'t keep [phone]', async ({ page, check }, testInfo) => {
  // Stand-in: the device refuses to store the logo, as a full disk would.
  await refuseStorage(page, ['overlay']);
  await watchMessages(page);
  const hand = await startOnOverlay(page, testInfo, { photo: PHOTO });
  await addLogo(page, hand, page.locator('#btnOverlayAdd'), 'icon.svg');
  // Ruling R59: messages say "logo".
  const text = 'This logo works on this photo, but it can’t be saved in this browser.';
  const message = await waitForMessage(page, /works on this photo, but it can’t be saved/);
  await check(`The logo goes on the middle of the photo; an amber warning reads "${text}"`,
    async () => {
      const { overlay } = await editState(page);
      expect(overlay).not.toBeNull();
      expect({ cx: overlay.cx, cy: overlay.cy }).toEqual({ cx: 0.5, cy: 0.5 });
      expect(message.text).toBe(text);
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
  await check(`${QUESTION_BOX_SENTENCE} asks "Unpair"`, async () => {
    await expectQuestion(page, 'Unpair');
  });
  await hand.tap(questionButton(page, 'Keep front'));
  const text = 'Unpaired. The front is a single photo now.';
  const message = await waitForMessage(page, text);
  await check(`A white message reads "${text}"; Front / Back has gone from the top bar`,
    async () => {
      expectKind(message, 'info');
      await expect(page.locator('#sideSwitch')).toBeHidden();
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
  await tapAndExpectUpscale(page, hand, check, page.locator('#btnDownload'));
  await hand.tap(questionButton(page, 'No'));
  await check('A thin red line runs along the top edge of the controls: the export is running',
    async () => {
      await expect(page.locator('#exportArea .progress-line')).toBeVisible();
      expect(await page.evaluate(() => window.__straightener.app.exporting)).toBe(true);
    });
  await pickWith(page, hand, page.locator('#btnOpen'), SLAB_PHOTO);
  const message = await waitForMessage(page, EXPORT_WAIT);
  await check(`An amber warning reads "${EXPORT_WAIT}"; 01_chrome_flat_black.JPEG stays open`,
    async () => {
      expectKind(message, 'warn');
      expect((await editState(page)).source.name).toBe(PHOTO);
    });
});

test('MSG-46.2 A photo opened while a side opens is refused with its own words [phone]',
  async ({ page, check }, testInfo) => {
    await watchMessages(page);
    const hand = await makePair(page, testInfo);
    // Stand-in: the front's opening is held until the photo has been chosen.
    await holdNextOpening(page);
    await hand.tap(sideButton(page, 'front'));
    await waitForOpening(page);
    const opening = await waitForMessage(page, 'Opening the front…');
    await check('"Opening the front…" shows over the photo', () => {
      expect(opening.hiddenAtMs).toBeNull();
    });
    await pickWith(page, hand, page.locator('#btnOpen'), SLAB_PHOTO);
    await page.waitForFunction(() => window.testMessages.some(message => message.kind === 'warn'));
    // The one warning shown while the front's opening is held.
    const message = (await messagesSoFar(page)).find(shown => shown.kind === 'warn');
    await check(`An amber warning reads "${SIDE_WAIT}"`, () => {
      expect(message.text).toBe(SIDE_WAIT);
      expectKind(message, 'warn');
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
  const saved = await tapAndCollect(page, hand, page.locator('#btnDownload'), 1);
  await check(`One file is saved: ${TOGETHER_FILE}`, () => {
    expect(saved.map(file => file.name)).toEqual([TOGETHER_FILE]);
  });
  await waitForExportEnd(page);
  const text = 'The photo isn’t loaded after the last export. '
    + 'Tap Front or Back to switch sides, then switch back.';
  const message = await waitForMessage(page, text);
  await check(`An amber warning reads "${text}"`, () => {
    expectKind(message, 'warn');
  });
  const gone = await waitUntilGone(page, text, LONG_ERROR_MS * 2);
  await check('It stays 8 s', () => {
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

test('MSG-50.1 Failed corner shots say "Corner shots failed." [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await start(page, testInfo, { address: NO_CORNER_QUESTION });
  await openCornerSheetAndSee(page, hand, check);
  // Stand-in: the browser hands back no file, as when a canvas is too big for it.
  await failEncoding(page);
  await hand.tap(page.locator('#btnCornerDownload'));
  await expectPlainError(page, check, CORNERS_FAILED, ENCODING_FAILED);
});

// Perspective's line above the controls, and the Overlay step's.
const PERSPECTIVE_STATUS = 'perspectiveStatus';
const OVERLAY_STATUS = 'overlayStatus';

test('MSG-51.1 Tap to find card\'s line, with Cancel [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await start(page, testInfo, { step: 'perspective' });
  const cardCorner = await cornerOnPage(page, 0);
  await hand.drag(cardCorner, { x: cardCorner.x + MOVE_PX, y: cardCorner.y });
  const moved = (await editState(page)).corners[0];
  await check('The outline\'s top-left corner sits 40 px right of the card\'s corner', async () => {
    const corner = await cornerOnPage(page, 0);
    expect(Math.abs(corner.x - cardCorner.x - MOVE_PX)).toBeLessThanOrEqual(MOVE_TOLERANCE_PX);
  });
  await armFindCard(page, hand);
  await check(`The line above the controls reads "${TAP_THE_CARD}" with a grey information icon `
    + 'and Cancel at its right', async () => {
    await expectStatus(page, PERSPECTIVE_STATUS, TAP_THE_CARD, 'info');
    expect((await statusNow(page, PERSPECTIVE_STATUS)).action).toBe('Cancel');
  });
  await hand.tap(page.locator('#perspectiveStatusAction'));
  await check('The line above the controls reads NUDGE and "Corner 1 of 4"', async () => {
    await expect(page.locator('#perspectiveStatus')).toBeHidden();
    const line = page.locator('#perspectiveLine');
    await expect(line.locator('.line-label')).toHaveText('Nudge');
    await expect(line.locator('.line-label')).toHaveCSS('text-transform', 'uppercase');
    await expect(line).toContainText('Corner 1 of 4');
  });
  await tapAt(page, hand, await photoAreaMiddle(page));
  // A search an armed tap starts finishes well inside this wait.
  await page.waitForTimeout(NOTHING_WAIT_MS);
  await check('No corner moves: the top-left corner stays 40 px right of the card\'s corner (an '
    + 'armed Tap to find card would have put it back on the card)', async () => {
    expect((await editState(page)).corners[0]).toEqual(moved);
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
// Rulings R81 and R82: an engine fault shows as this line on Perspective itself.
const FIX_HERE = 'Fix the corners first.';
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
  const lines = listenToConsole(page);
  await start(page, testInfo, { step: 'perspective' });
  for (const fault of OTHER_FAULTS) {
    // Stand-in: no control brings these faults about, so the engine is made to report one.
    await faultGeometry(page, fault);
    // A plain reading of the line: it is redrawn as the fault is reported.
    const status = await statusNow(page, PERSPECTIVE_STATUS);
    await check(`The line above the controls reads "${FIX_HERE}" with a red error icon; the `
      + `Console holds "${fault}"`, () => {
      expect({ text: status.text, kind: status.kind }).toEqual({ text: FIX_HERE, kind: 'error' });
      expect(lines.some(line => line.text.includes(fault))).toBe(true);
    });
  }
  await clearGeometryFault(page);
});

test('MSG-55.1 "Detecting…" while a search runs [phone]', async ({ page, check }, testInfo) => {
  const hand = await startOnStartScreen(page, testInfo);
  await watchStatus(page, PERSPECTIVE_STATUS);
  await pickWith(page, hand, page.locator('#btnOpenEmpty'), PHOTO);
  await waitForPhoto(page, PHOTO);
  await check('For a moment, before the corner handles show on the card, the line above the '
    + 'controls reads "Detecting…" with a grey information icon', async () => {
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

// The plain grey picture with no card in it (tests/fixtures/).
const GREY_PICTURE = 'plain-grey.png';
const NOTHING_DETECTED = 'Nothing detected. Drag the corners into place.';

// Chooses the plain grey picture with Open photo on the start screen, and waits until its
// search for a card has ended.
async function openGreyPicture(page, hand) {
  await pickWith(page, hand, page.locator('#btnOpenEmpty'), fixtureFile(GREY_PICTURE));
  await waitForPhoto(page, GREY_PICTURE);
}

test('MSG-57.1 Nothing detected [phone]', async ({ page, check }, testInfo) => {
  const hand = await startOnStartScreen(page, testInfo);
  await openGreyPicture(page, hand);
  await check('The picture opens on the Perspective step; the line above the controls reads '
    + `"${NOTHING_DETECTED}" with an amber warning icon`, async () => {
    expect(await page.evaluate(() => window.__straightener.app.tab)).toBe('perspective');
    await expectStatus(page, PERSPECTIVE_STATUS, NOTHING_DETECTED, 'warn');
  });
});

test('MSG-57.2 A search that finds no card says so in the line alone [phone]',
  async ({ page, check }, testInfo) => {
    const hand = await startOnStartScreen(page, testInfo);
    await openGreyPicture(page, hand);
    await check('The picture opens on the Perspective step; the line above the controls reads '
      + `"${NOTHING_DETECTED}"; no message shows over the picture`, async () => {
      expect(await page.evaluate(() => window.__straightener.app.tab)).toBe('perspective');
      await expectStatus(page, PERSPECTIVE_STATUS, NOTHING_DETECTED, 'warn');
      const shown = (await messagesSoFar(page)).map(message => message.text);
      expect(shown.filter(text => text !== 'Loading…')).toEqual([]);
      await expect(page.locator('#toast')).not.toHaveClass(/is-shown/);
    });
    await findNoCard(page, hand, check);
  });

test('MSG-57.3 Re-detect in the tuning panel that finds no card shows no message [desktop]',
  async ({ page, check }, testInfo) => {
    await reDetectNoCard(page, check, testInfo);
  });

// MSG-57.3's rows: opens the grey picture with the tuning panel showing, clicks Re-detect and
// checks that the line, alone, says nothing was found (ruling R77).
async function reDetectNoCard(page, check, testInfo) {
  await watchMessages(page);
  await openApp(page, TUNING_LINK);
  await waitForStart(page);
  const hand = handFor(page, testInfo);
  await openGreyPicture(page, hand);
  await check('The picture opens; the Detection tuning panel still shows; no message shows over '
    + 'the picture', async () => {
    await expect(page.locator('#debugPanel')).toBeVisible();
    const shown = (await messagesSoFar(page)).map(message => message.text);
    expect(shown.filter(text => text !== 'Loading…')).toEqual([]);
    await expect(page.locator('#toast')).not.toHaveClass(/is-shown/);
  });
  const runsBefore = await page.evaluate(() => window.__straightener.app.detection.running);
  const before = (await messagesSoFar(page)).length;
  await hand.tap(page.locator('#debugRun'));
  await page.waitForFunction(runs => {
    const detection = window.__straightener.app.detection;
    return detection.running > runs && detection.message === '';
  }, runsBefore);
  await check('The search runs again and ends; the line above the controls still reads '
    + `"${NOTHING_DETECTED}"`, async () => {
    await expectStatus(page, PERSPECTIVE_STATUS, NOTHING_DETECTED, 'warn');
  });
  await expectNoMessageAfter(page, check, before, 'No message has shown over the picture since '
    + 'the click');
}

// The last row of MSG-57.2 and MSG-57.3 (ruling R77): `before` messages had shown when the
// search was started; five seconds on, none has shown since.
async function expectNoMessageAfter(page, check, before, description) {
  await page.waitForTimeout(WARN_MS);
  const shown = (await messagesSoFar(page)).slice(before).map(message => message.text);
  await check(description, () => {
    expect(shown).toEqual([]);
  });
}

// MSG-57.2's rows 2 to 4: arms Tap to find card, taps the middle of the picture, and checks
// that the line, alone, says nothing was found (ruling R77).
async function findNoCard(page, hand, check) {
  await armFindCard(page, hand, check);
  const runsBefore = await page.evaluate(() => window.__straightener.app.detection.running);
  const before = (await messagesSoFar(page)).length;
  await tapAt(page, hand, await photoAreaMiddle(page));
  await page.waitForFunction(runs => {
    const detection = window.__straightener.app.detection;
    return detection.running > runs && detection.message === '';
  }, runsBefore);
  await check(`the line above the controls reads "${NOTHING_DETECTED}"`, async () => {
    await expectStatus(page, PERSPECTIVE_STATUS, NOTHING_DETECTED, 'warn');
  });
  await expectNoMessageAfter(page, check, before, 'No message has shown over the picture since '
    + 'the tap');
}

test('MSG-58.1 A corrected frame over the cap is noted in the console only [phone]', async ({
  page,
  check,
}, testInfo) => {
  const lines = listenToConsole(page);
  await start(page, testInfo, { photo: SLAB_PHOTO, address: CLAMPED_LINK, step: 'perspective' });
  await check('It holds no message: it reads NUDGE and "Corner 1 of 4"', async () => {
    // The frame is clamped, so the line would have something to say if it still said it.
    expect(await page.evaluate(() => window.__straightener.app.geometry.perspective.isClamped))
      .toBe(true);
    await expect(page.locator('#perspectiveStatus')).toBeHidden();
    const line = page.locator('#perspectiveLine');
    await expect(line.locator('.line-label')).toHaveText('Nudge');
    await expect(line).toContainText('Corner 1 of 4');
  });
  const note = '[card-finisher] Corrected frame clamped to 1000 px on the long side.';
  await check(`One line reads "${note}"`, () => {
    expect(lines.filter(line => line.text === note)).toHaveLength(1);
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
  await chooseLogoFile(page, hand, fixtureFile('logo.gif'));
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
  // Ruling R59: messages say "logo".
  const text = 'That file is 6.0 MB. The logo limit is 5 MB.';
  await page.waitForFunction(id => {
    return /limit is/.test(document.querySelector(`#${id} .status-text`).textContent);
  }, OVERLAY_STATUS);
  await check(`the line above the controls reads "${text}" with a red error icon`, async () => {
    expect((await statusNow(page, OVERLAY_STATUS)).text).toBe(text);
    await expectStatus(page, OVERLAY_STATUS, text, 'error');
  });
});

test('MSG-61.1 A logo image that can\'t be read [phone]', async ({
  page,
  check,
}, testInfo) => {
  await watchMessages(page);
  const hand = await startOnOverlay(page, testInfo, { photo: PHOTO });
  await chooseLogoFile(page, hand, fixtureFile('not-a-logo.png'));
  const text = 'Couldn’t read that image. Try another PNG, WebP, JPG or SVG file.';
  await check(`the line above the controls reads "${text}" with a red error icon`, async () => {
    await expectStatus(page, OVERLAY_STATUS, text, 'error');
  });
});

test('MSG-62.1 An SVG logo with no size [phone]', async ({ page, check }, testInfo) => {
  await watchMessages(page);
  const hand = await startOnOverlay(page, testInfo, { photo: PHOTO });
  await chooseLogoFile(page, hand, fixtureFile('unsized.svg'));
  const text = 'That SVG has no width, height or viewBox, so it can’t be sized. '
    + 'Re-export it with a size.';
  await check(`The line above the controls reads "${text}" with a red error icon`, async () => {
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
  await check('A white dot shows on the Levels tab: the levels are not applied yet', async () => {
    await expect(page.locator('[data-step="levels"]:visible .step-tab-mark')).toBeVisible();
  });
  await goToStep(page, 'export', hand);
  const text = 'Levels has unapplied changes; export uses the applied levels.';
  await check(`Under the size line, led by the amber warning mark: "${text}"`, async () => {
    await expectExportNote(page, text);
  });
});

// A link that makes IMG_9136's output larger than the canvas area limit (EXP-06.3's).
const CLAMP_LINK = 'index.html?export.longEdge=12000&export.allowUpscale=1';

test('MSG-72.1 The canvas-limit note says 16.7 MP [phone]', async ({
  page,
  check,
}, testInfo) => {
  await start(page, testInfo, { photo: SLAB_PHOTO, address: CLAMP_LINK });
  await check(`Under the size line, led by the amber warning mark: "${SCALED_DOWN}"`, async () => {
    await expectExportNote(page, SCALED_DOWN);
  });
});

// The pair for MSG-72.2: a large front and a small back (EXP-06.4's), and the area limit that
// clamps the front at Original but not the back. MSG-72.3's pair is the large photo twice, so
// the limit clamps both sides.
const CLAMP_PAIR = { front: SLAB_PHOTO, back: BACK };
const CLAMP_BOTH_PAIR = { front: SLAB_PHOTO, back: SLAB_PHOTO };
const AREA_LIMIT_LINK = 'index.html?maxOutputArea=1000000';

test('MSG-72.2 With Separately, the note also covers the side not on screen [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await makePair(page, testInfo, CLAMP_PAIR, AREA_LIMIT_LINK);
  await goToStep(page, 'export', hand);
  await chooseSize(page, hand, '0');
  await check('Original is selected (a white fill)', async () => {
    expect(await selectedChoices(page, 'exportSize')).toEqual(['Original']);
  });
  await chooseSeparately(page, hand, check);
  await check('With the back on screen, one note, led by the amber warning mark, reads '
    + `"${FRONT_SCALED_DOWN}", the approved words with the limit in force, which this case's `
    + 'link lowers to 1 MP (ruling R47)', async () => {
    expect((await editState(page)).source.name).toBe(BACK);
    await expectExportNote(page, FRONT_SCALED_DOWN);
  });
  await switchTo(page, hand, 'front');
  await check(`The front opens, and the one note reads "${SCALED_DOWN_1MP}": the side scaled `
    + 'down is now the one on screen, so the note names no side', async () => {
    expect((await editState(page)).source.name).toBe(SLAB_PHOTO);
    await expectExportNote(page, SCALED_DOWN_1MP);
  });
});

test('MSG-72.3 With Separately, the note says so when both sides are scaled down [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await makePair(page, testInfo, CLAMP_BOTH_PAIR, AREA_LIMIT_LINK);
  await goToStep(page, 'export', hand);
  await chooseSize(page, hand, '0');
  await check('Original is selected (a white fill)', async () => {
    expect(await selectedChoices(page, 'exportSize')).toEqual(['Original']);
  });
  await chooseSeparately(page, hand, check);
  await check(`One note, led by the amber warning mark, reads "${BOTH_SCALED_DOWN}"`, async () => {
    await expectExportNote(page, BOTH_SCALED_DOWN);
  });
});

// Links that lower the long-side limit to 1000 px (the lowest a link may set). The second also
// switches upscaling on, so at Size 2000 the output would be 2000 px on its long side, over the
// limit: without it the picture the crop is cut from is itself held to 1000 px, and no output
// is longer.
const LONG_SIDE_LINK = 'index.html?maxOutputPx=1000';
const LONG_SIDE_UPSCALE_LINK = 'index.html?maxOutputPx=1000&export.allowUpscale=1';
// Both limits lowered, with upscaling on, so the 2000 × 2000 px output is over both. In the
// first the long side asks for the smaller picture (1000 × 1000 px, under its 1.5 MP); in the
// second the area does (1 MP, 1000 × 1000 px, under its 1500 px).
const LONG_SIDE_DECIDES_LINK = 'index.html?maxOutputPx=1000&maxOutputArea=1500000'
  + '&export.allowUpscale=1';
const AREA_DECIDES_LINK = 'index.html?maxOutputPx=1500&maxOutputArea=1000000'
  + '&export.allowUpscale=1';
// A long-side limit that is not a whole number of px, with upscaling on (MSG-72.10).
const FRACTION_LINK = 'index.html?maxOutputPx=1000.5&export.allowUpscale=1';
// How far MSG-72.5 drags two of the crop box's corner handles outward, in CSS px: past the
// picture's own corners, so the box stops at the picture's edges.
const CROP_GROW_PX = { across: 200, down: 280 };
// How close a crop box's edge must be to the picture's edge to count as on it, in the
// picture's px.
const EDGE_PX = 1;

// The body of MSG-72.4, MSG-72.7, MSG-72.8 and MSG-72.10: IMG_9136.JPEG open on Export from `link`, whose
// output is scaled down to 1000 × 1000 px. Checks the two rows: the size line, and the one
// note, which must read `note`.
async function checkLimitNamed(page, check, testInfo, link, note) {
  await start(page, testInfo, { photo: SLAB_PHOTO, address: link });
  const sizeText = 'Output 1000 × 1000 px · JPEG';
  await check(`The size line reads "${sizeText}"`, async () => {
    await expect(page.locator('#exportReadout')).toBeVisible();
    await expect(page.locator('#exportReadout')).toHaveText(sizeText);
  });
  await check(`Under the size line, led by the amber warning mark: "${note}"`, async () => {
    await expectExportNote(page, note);
  });
}

test('MSG-72.4 The note names the long-side limit when that is what scaled the output [phone]',
  async ({ page, check }, testInfo) => {
    await checkLimitNamed(page, check, testInfo, LONG_SIDE_UPSCALE_LINK, SCALED_DOWN_1000PX);
  });

// Drags one of the crop box's corner handles (part: 'se' or 'nw') outward by CROP_GROW_PX.
async function growCropBox(page, hand, part) {
  const start = await cropHandleOnPage(page, part);
  const direction = part === 'se' ? 1 : -1;
  await hand.drag(start, {
    x: start.x + direction * CROP_GROW_PX.across,
    y: start.y + direction * CROP_GROW_PX.down,
  });
}

// The crop's height as Crop's line above the controls gives it, in px.
async function cropHeightShown(page) {
  const { size } = await sizeLine(page);
  return Number(size.split(' × ')[1]);
}

test('MSG-72.5 With Separately, the long-side note names the side not on screen [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await makePair(page, testInfo, PORTRAIT_PAIR, LONG_SIDE_LINK);
  await goToStep(page, 'rotate', hand);
  await check('The Rotate controls show, with the angle at 0.0°', async () => {
    await expect(angleText(page)).toHaveText('0.0°');
  });
  await typeAngle(page, hand, '20');
  await check('The angle reads 20.0°, and the back’s picture is turned', async () => {
    await expect(angleText(page)).toHaveText('20.0°');
    expect((await editState(page)).rotation.fine).toBe(20);
  });
  await goToStep(page, 'crop', hand);
  const boxAtFirst = await cropRect(page);
  await check('The Crop controls show; the size in the line above them is under 1000 px tall',
    async () => {
      expect(await stepNow(page)).toBe('crop');
      await expect(page.locator('#cropSize')).toBeVisible();
      expect(await cropHeightShown(page)).toBeLessThan(LONG_SIDE_PX);
    });
  const picture = await frameSize(page);
  await growCropBox(page, hand, 'se');
  const boxGrown = await cropRect(page);
  await check('The box grows down and to the right, until its bottom edge is on the picture’s '
    + 'bottom edge', async () => {
    expect(boxGrown.width).toBeGreaterThan(boxAtFirst.width);
    expect(boxGrown.height).toBeGreaterThan(boxAtFirst.height);
    expect(Math.abs(boxGrown.y + boxGrown.height - picture.height)).toBeLessThan(EDGE_PX);
  });
  await growCropBox(page, hand, 'nw');
  const boxFull = await cropRect(page);
  await check('The box grows up and to the left, until its top edge is on the picture’s top '
    + 'edge; the size in the line above the controls is more than 1000 px tall', async () => {
    expect(boxFull.x).toBeLessThan(boxGrown.x);
    expect(Math.abs(boxFull.y)).toBeLessThan(EDGE_PX);
    expect(await cropHeightShown(page)).toBeGreaterThan(LONG_SIDE_PX);
  });
  await goToStep(page, 'export', hand);
  await check('The Export step, with Together selected (a white fill)', async () => {
    expect(await selectedChoices(page, 'pairOutput')).toEqual(['Together']);
  });
  await chooseOutput(page, hand, 'separately');
  // The sizes are still in the page while the note takes their place on a phone: the front as
  // it is, the back held to the limit on its long side.
  const [frontSize, backSize] = await readoutSizes(page);
  await check('Separately is selected, and with the back on screen the one note, led by the '
    + `amber warning mark, reads "${SCALED_DOWN_1000PX}": the back is the side scaled down, so `
    + 'the note names no side', async () => {
    expect(await selectedChoices(page, 'pairOutput')).toEqual(['Separately']);
    expect(await openSide(page)).toBe('back');
    expect(Math.max(...frontSize), 'the front is under the limit').toBeLessThan(LONG_SIDE_PX);
    expect(Math.max(...backSize), 'the back is held to the limit').toBe(LONG_SIDE_PX);
    await expectExportNote(page, SCALED_DOWN_1000PX);
  });
  await switchTo(page, hand, 'front');
  await check(`The front opens, and the one note reads "${BACK_SCALED_DOWN_1000PX}"`, async () => {
    expect(await openSide(page)).toBe('front');
    await expectExportNote(page, BACK_SCALED_DOWN_1000PX);
  });
});

test('MSG-72.6 With Separately, the long-side note says so when both sides are scaled down '
  + '[phone]', async ({ page, check }, testInfo) => {
  const hand = await makePair(page, testInfo, PORTRAIT_PAIR, LONG_SIDE_UPSCALE_LINK);
  await goToStep(page, 'export', hand);
  await check('The Export step, with 2000 and Together selected (a white fill each)', async () => {
    expect(await selectedChoices(page, 'exportSize')).toEqual(['2000']);
    expect(await selectedChoices(page, 'pairOutput')).toEqual(['Together']);
  });
  await chooseOutput(page, hand, 'separately');
  const sizes = await readoutSizes(page);
  await check('Separately is selected, and the one note, led by the amber warning mark, reads '
    + `"${BOTH_SCALED_DOWN_1000PX}"`, async () => {
    expect(await selectedChoices(page, 'pairOutput')).toEqual(['Separately']);
    expect(sizes.map(size => Math.max(...size)), 'each side is held to the limit')
      .toEqual([LONG_SIDE_PX, LONG_SIDE_PX]);
    await expectExportNote(page, BOTH_SCALED_DOWN_1000PX);
  });
});

test('MSG-72.7 Over both limits, the note names the long side when it set the size [phone]',
  async ({ page, check }, testInfo) => {
    await checkLimitNamed(page, check, testInfo, LONG_SIDE_DECIDES_LINK, SCALED_DOWN_1000PX);
  });

test('MSG-72.8 Over both limits, the note names the area when it set the size [phone]',
  async ({ page, check }, testInfo) => {
    await checkLimitNamed(page, check, testInfo, AREA_DECIDES_LINK, SCALED_DOWN_1MP);
  });

// MSG-72.9's stand-in: from now on the app's size calculation reports that the photo named
// `photoName`, when its output is scaled down, was scaled down by the area limit. Both sides of
// a pair have the same 5:7 shape, so the same limit sets both sizes unless whole-pixel rounding
// falls differently for the two, which no person can arrange.
function reportAreaLimitFor(page, photoName) {
  return page.evaluate(name => {
    const engine = window.CardEngine;
    const computeGeometry = engine.computeGeometry;
    engine.computeGeometry = function computeWithAreaLimit(state, ...rest) {
      const geometry = computeGeometry.call(engine, state, ...rest);
      const isNamed = !!state && !!state.source && state.source.name === name;
      if (!isNamed || !geometry.ok || !geometry.output.isClamped) return geometry;
      return { ...geometry, output: { ...geometry.output, clampedBy: 'area' } };
    };
  }, photoName);
}

test('MSG-72.9 With Separately, two sides scaled down by different limits share one note '
  + '[phone]', async ({ page, check }, testInfo) => {
  const hand = await makePair(page, testInfo, PORTRAIT_PAIR, LONG_SIDE_UPSCALE_LINK);
  // Stand-in: the front is reported as scaled down by the area limit; the back is scaled down
  // by the long-side limit, as both really are under this link.
  await reportAreaLimitFor(page, FRONT);
  await goToStep(page, 'export', hand);
  await check('The Export step, with 2000 and Together selected (a white fill each)', async () => {
    expect(await selectedChoices(page, 'exportSize')).toEqual(['2000']);
    expect(await selectedChoices(page, 'pairOutput')).toEqual(['Together']);
  });
  await chooseOutput(page, hand, 'separately');
  const sizes = await readoutSizes(page);
  const limits = await page.evaluate(() => window.CF.pairReadout().clampedBy);
  await check('Separately is selected, and the one note, led by the amber warning mark, reads '
    + `"${BOTH_BY_DIFFERENT_LIMITS}"`, async () => {
    expect(await selectedChoices(page, 'pairOutput')).toEqual(['Separately']);
    expect(sizes.map(size => Math.max(...size)), 'each side is scaled down')
      .toEqual([LONG_SIDE_PX, LONG_SIDE_PX]);
    expect(limits, 'the two sides’ limits differ').toEqual({ front: 'area', back: 'longSide' });
    await expectExportNote(page, BOTH_BY_DIFFERENT_LIMITS);
  });
});

test('MSG-72.10 A long-side limit with a fraction reads rounded down [phone]', async ({
  page,
  check,
}, testInfo) => {
  await checkLimitNamed(page, check, testInfo, FRACTION_LINK, SCALED_DOWN_1000PX);
});

test('MSG-73.1 Export\'s JPEG transparency note [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await start(page, testInfo);
  // The case's named action, Make the fill transparent: the options, Fill outside photo, close.
  await chooseFill(page, hand, 'transparent');
  const text = 'JPEG has no transparency; empty areas will be white.';
  await check(`Under the size line, led by the amber warning mark: "${text}"`, async () => {
    await expectExportNote(page, text);
  });
});

test('MSG-74.1 Corner shots that can\'t be made give the real reason [phone]', async ({
  page,
  check,
}, testInfo) => {
  // The page gets a stand-in share sheet (start's default), so Share corners shows.
  const hand = await start(page, testInfo);
  // Stand-in: no photo or control makes the engine refuse a card with valid corners.
  await makeCornerShotsImpossible(page, 'Transform is not invertible.');
  await openCornerSheet(page, hand);
  const readout = await cornerReadout(page);
  const dimmed = await cornerButtonsDimmed(page);
  await check('The corner size line reads "Sheet · fix the corners in Perspective first"; Share '
    + 'corners and Download corners are greyed out (shown dim and not answering a tap)', () => {
    expect(readout).toBe('Sheet · fix the corners in Perspective first');
    expect(dimmed).toEqual({ share: true, download: true });
  });
});

test('MSG-74.2 For a card too small for corner shots, the size line says so [phone]', async ({
  page,
  check,
}, testInfo) => {
  // The page gets a stand-in share sheet (start's default), so Share corners shows.
  const hand = await start(page, testInfo);
  // Stand-in: no photo or control makes the card too small, so the real engine is handed a
  // card with no size. Its reason is its own: the case fails if the app no longer knows it.
  await makeCardTooSmallForCorners(page);
  await openCornerSheet(page, hand);
  const readout = await cornerReadout(page);
  const dimmed = await cornerButtonsDimmed(page);
  await check('The corner size line reads "Sheet · the card is too small"; Share corners and '
    + 'Download corners are greyed out (shown dim and not answering a tap)', () => {
    expect(readout).toBe('Sheet · the card is too small');
    expect(dimmed).toEqual({ share: true, download: true });
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
  const text = 'The crop is 1074 × 1074 px at the photo’s resolution.';
  await check(`${QUESTION_BOX_SENTENCE} asks "${UPSCALE_2000}" and reads "${text}", with Yes in `
    + 'red, No and Cancel', async () => {
    await expectQuestion(page, UPSCALE_2000, text);
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
  const text = 'The image is 1583 × 1100 px at the photos’ resolution.';
  await check(`${QUESTION_BOX_SENTENCE} asks "${UPSCALE_2000}" and reads "${text}"`, async () => {
    await expectQuestion(page, UPSCALE_2000, text);
  });
});

test('MSG-77.1 The Upscale question for a pair saved Separately [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await makePair(page, testInfo);
  await placeFrontCorners(page, hand);
  await goToStep(page, 'export', hand);
  await chooseSeparately(page, hand, check);
  await hand.tap(page.locator('#btnDownload'));
  const text = 'The front is 748 × 1047 px and the back 785 × 1100 px at the photos’ '
    + 'resolution.';
  await check(`${QUESTION_BOX_SENTENCE} asks "${UPSCALE_2000}" and reads "${text}"`, async () => {
    await expectQuestion(page, UPSCALE_2000, text);
  });
});

test('MSG-77.2 With one side over the size, the question names only the other [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await makePair(page, testInfo);
  await placeFrontCorners(page, hand);
  await goToStep(page, 'export', hand);
  await chooseSeparately(page, hand, check);
  await chooseSize(page, hand, '1080');
  await check('1080 is selected (a white fill)', async () => {
    expect(await selectedChoices(page, 'exportSize')).toEqual(['1080']);
  });
  await hand.tap(page.locator('#btnDownload'));
  await page.locator('#pairPrompt .alert-text').waitFor({ state: 'visible' });
  // Ruling R50's words.
  const title = await page.locator('#pairPrompt .alert-title').textContent();
  const shown = await page.locator('#pairPrompt .alert-text').textContent();
  const text = 'The front is 748 × 1047 px at the photo’s resolution.';
  await check(`The question box asks "Upscale to 1080 px?" and reads "${text}": the back isn't `
    + 'named', () => {
    expect({ title, shown }).toEqual({ title: 'Upscale to 1080 px?', shown: text });
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
  await check('The Corner shots sheet rises, with 1 sheet selected', async () => {
    expect(await isCornerSheetOpen(page)).toBe(true);
    expect(await selectedChoices(page, 'cornerOutput')).toEqual(['1 sheet']);
  });
  await hand.tap(page.locator('#btnCornerDownload'));
  const sheetText = 'The sheet is 314 px at the photo’s resolution.';
  await check(`${QUESTION_BOX_SENTENCE}, above the open sheet, asks "${UPSCALE_2000}" and reads `
    + `"${sheetText}"`, async () => {
    await expectQuestion(page, UPSCALE_2000, sheetText);
    expect(await isQuestionOnTop(page)).toBe(true);
  });
  await hand.tap(questionButton(page, 'Cancel'));
  await check('The question box goes; the sheet stays open', async () => {
    await waitForQuestion(page, false);
    expect(await isCornerSheetOpen(page)).toBe(true);
  });
  await chooseCornerChoice(page, hand, check, '4 photos');
  await hand.tap(page.locator('#btnCornerDownload'));
  const cornerText = 'Each corner is 156 px at the photo’s resolution.';
  await check(`The question box asks "${UPSCALE_2000}" and reads "${cornerText}"`, async () => {
    await expectQuestion(page, UPSCALE_2000, cornerText);
  });
});

test('MSG-79.1 The Unpair question box [phone]', async ({ page, check }, testInfo) => {
  const hand = await makePair(page, testInfo);
  await hand.tap(page.locator('#btnUnpair'));
  await check(`${QUESTION_BOX_SENTENCE} asks "Unpair" and reads "Keep one side as a single `
    + 'photo.", with Keep front, Keep back (neither red) and Cancel', async () => {
    await expectQuestion(page, 'Unpair', 'Keep one side as a single photo.');
    await expectQuestionButtons(page, ['Keep front', 'Keep back', 'Cancel']);
  });
});

test('MSG-80.1 The New photo question box [phone]', async ({ page, check }, testInfo) => {
  const hand = await makePair(page, testInfo);
  await pickWith(page, hand, page.locator('#btnOpen'), SLAB_PHOTO);
  await check(`${QUESTION_BOX_SENTENCE} asks "New photo" and reads "End the pair, or replace the `
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
  await check('The corner lines cross', async () => {
    await expectStatus(page, PERSPECTIVE_STATUS, CROSSED, 'error');
  });
  await goToStep(page, 'rotate', hand);
  await check.eye('In place of the photo, grey text centered in the photo area reads "Fix the '
    + 'corners in Perspective first."; no picture is drawn');
});

test('MSG-82.1 The words in place of the joined image, for a person to judge [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await makePair(page, testInfo);
  await crossCorners(page, hand);
  await check('The corner lines cross', async () => {
    await expectStatus(page, PERSPECTIVE_STATUS, CROSSED, 'error');
  });
  await goToStep(page, 'export', hand);
  await check.eye('With Together selected, grey text centered in the photo area reads "Fix the '
    + 'back’s corners in Perspective first."; no joined image is drawn');
});

test('MSG-82.2 With the waiting side\'s corners crossed, Export names the side to fix [phone]',
  async ({ page, check }, testInfo) => {
    // Stand-in: a share sheet, so Share shows as on an iPhone.
    await installShareStandIn(page, 'share');
    const hand = await makePair(page, testInfo);
    await crossCorners(page, hand);
    await check('The corner lines cross', async () => {
      await expectStatus(page, PERSPECTIVE_STATUS, CROSSED, 'error');
    });
    // Not switchTo: a switch that stops part-way (BUG-034) would time out in its detection wait.
    await hand.tap(sideButton(page, 'front'));
    await page.waitForFunction(() => !window.__straightener.app.isSwitching);
    // Plain readings: a switch that stops part-way fails at once rather than waiting.
    const afterSwitch = await page.evaluate(() => {
      const app = window.__straightener.app;
      return { side: app.pair.current, photo: app.state.source.name, step: app.tab };
    });
    await check('The front opens on the Perspective step', () => {
      expect(afterSwitch).toEqual({ side: 'front', photo: FRONT, step: 'perspective' });
    });
    await goToStep(page, 'export', hand);
    // The size line's row: on a phone a note may take the size line's place in it.
    const row = await page.locator('#exportReadoutRow').textContent();
    const dimmed = {
      share: await page.locator('#btnShare').isDisabled(),
      download: await page.locator('#btnDownload').isDisabled(),
      copy: await page.locator('#btnCopy').isDisabled(),
    };
    await check(`The size line reads "${FIX_BACK}"; Share, Download and Copy are greyed out (shown `
      + 'dim and not answering a tap)', () => {
      expect(row).toContain(FIX_BACK);
      expect(dimmed).toEqual({ share: true, download: true, copy: true });
    });
  });

// The share of the photo area that is empty stage when only a line of words is drawn on it
// (photo-view.spec.js's MESSAGE_ONLY_SHARE).
const WORDS_ONLY_SHARE = 0.97;

// Does `action` (a tap that makes the photo area draw again) and returns what the photo area
// then holds: { words, isWordsOnly }: the last line of words drawn on it ('' when none was),
// and whether nothing else is drawn there (no photo, no joined image). recordDrawnText must
// have been called before the app was opened: the words are drawn, so no element holds them.
async function photoAreaAfter(page, action) {
  await drawnTextsSoFar(page);
  await action();
  await waitForStill(page);
  await nextFrames(page);
  const texts = await drawnTextsSoFar(page);
  return {
    words: texts.length ? texts[texts.length - 1] : '',
    isWordsOnly: (await stageShare(page)) > WORDS_ONLY_SHARE,
  };
}

// Crosses the open side's corners on Perspective and checks the row's result.
async function crossAndCheck(page, hand, check) {
  await crossCorners(page, hand);
  await check('The corner lines cross', async () => {
    await expectStatus(page, PERSPECTIVE_STATUS, CROSSED, 'error');
  });
}

// What a pair's Export step says under the photo about the corners to fix: the size line's
// words, whether the line can be seen, and whether Download is greyed out.
async function fixLineNow(page) {
  const line = page.locator('#exportReadout');
  return {
    line: (await line.textContent()).trim(),
    isLineShown: await line.isVisible(),
    isDownloadOff: await page.locator('#btnDownload').isDisabled(),
  };
}

// fixLineNow's reading when the size line reads `words` and nothing can be saved.
const fixLineOf = words => ({ line: words, isLineShown: true, isDownloadOff: true });

// Taps Export in the step tabs with Together chosen and checks the row's result: no joined
// image, only `words` in the photo area; the size line under it reads the same; Download is
// greyed out. isFirst: the row also says Together is selected.
async function exportAndExpectWords(page, hand, check, words, isFirst = true) {
  const shown = await photoAreaAfter(page, () => goToStep(page, 'export', hand));
  const under = await fixLineNow(page);
  const lead = isFirst ? 'With Together selected, the' : 'The';
  await check(`${lead} photo area holds no joined image, only the words "${words}"; the size `
    + 'line under it reads the same words, and Download is greyed out', async () => {
    expect(await selectedChoices(page, 'pairOutput')).toEqual(['Together']);
    expect(shown).toEqual({ words, isWordsOnly: true });
    expect(under).toEqual(fixLineOf(words));
  });
}

// Taps Front or Back on a pair's Export step with Together chosen and checks the row's result:
// that side opens, the photo area still holds only `words`, and the size line under it reads
// the same.
async function switchAndExpectWords(page, hand, check, side, words) {
  const shown = await photoAreaAfter(page, () => switchTo(page, hand, side));
  const opened = { side: await openSide(page), step: await stepNow(page) };
  const under = await fixLineNow(page);
  await check(`The ${side} opens, still on Export; the photo area still holds only the words `
    + `"${words}", and the size line under it reads the same words`, async () => {
    expect(opened).toEqual({ side, step: 'export' });
    expect(shown).toEqual({ words, isWordsOnly: true });
    expect(under).toEqual(fixLineOf(words));
  });
}

// Taps Separately on a pair's Export step, with the open side's corners crossed, and checks the
// row's result: it is selected, the photo area still holds only `words`, the size line still
// reads the same, and Download is still greyed out.
async function separatelyAndExpectWords(page, hand, check, words) {
  const shown = await photoAreaAfter(page, () => chooseOutput(page, hand, 'separately'));
  const under = await fixLineNow(page);
  await check('Separately is selected (a white fill); the photo area still holds only the words '
    + `"${words}", the size line still reads the same words, and Download is still greyed out`,
  async () => {
    expect(await selectedChoices(page, 'pairOutput')).toEqual(['Separately']);
    expect(shown).toEqual({ words, isWordsOnly: true });
    expect(under).toEqual(fixLineOf(words));
  });
}

test('MSG-82.3 The photo area and the size line name the back when only its corners are crossed '
  + '[phone]', async ({ page, check }, testInfo) => {
  await recordDrawnText(page);
  const hand = await makePair(page, testInfo);
  await crossAndCheck(page, hand, check);
  await exportAndExpectWords(page, hand, check, FIX_BACK);
  await switchAndExpectWords(page, hand, check, 'front', FIX_BACK);
  // Back to the side whose corners are crossed: the switch must finish there too.
  await switchAndExpectWords(page, hand, check, 'back', FIX_BACK);
  await separatelyAndExpectWords(page, hand, check, FIX_BACK);
  // With Separately the photo area shows the open side, here the front, whose corners are fine.
  const shown = await photoAreaAfter(page, () => switchTo(page, hand, 'front'));
  const frontOpen = { side: await openSide(page), under: await fixLineNow(page) };
  await check(`The front opens, and the photo area shows its picture; the size line still reads `
    + `"${FIX_BACK}", and Download is still greyed out`, async () => {
    expect(shown).toEqual({ words: '', isWordsOnly: false });
    expect(frontOpen).toEqual({ side: 'front', under: fixLineOf(FIX_BACK) });
  });
});

test('MSG-82.4 They name the front, and say both sides only when both are crossed [phone]',
  async ({ page, check }, testInfo) => {
    await recordDrawnText(page);
    const hand = await makePair(page, testInfo);
    await switchTo(page, hand, 'front');
    await crossAndCheck(page, hand, check);
    await exportAndExpectWords(page, hand, check, FIX_FRONT);
    await switchAndExpectWords(page, hand, check, 'back', FIX_FRONT);
    await goToStep(page, 'perspective', hand);
    await check('The Perspective step, with the back’s photo and its outline, which does not '
      + 'cross itself', async () => {
      expect(await stepNow(page)).toBe('perspective');
      expect((await editState(page)).source.name).toBe(BACK);
      expect(await page.evaluate(() => window.__straightener.app.geometry.ok)).toBe(true);
    });
    await crossAndCheck(page, hand, check);
    await exportAndExpectWords(page, hand, check, FIX_BOTH, false);
    await separatelyAndExpectWords(page, hand, check, FIX_BOTH);
  });

test('MSG-82.5 While the back opens after Add back, a crossed front is the one side named '
  + '[phone]', async ({ page, check }, testInfo) => {
  await recordDrawnText(page);
  const hand = await start(page, testInfo, { photo: FRONT, step: 'perspective', share: null });
  await crossAndCheck(page, hand, check);
  const alone = await photoAreaAfter(page, () => goToStep(page, 'export', hand));
  const lineAlone = await fixLineNow(page);
  await check('The photo area holds no picture, only the words "Fix the corners in Perspective '
    + 'first."; the size line is empty, and Download is greyed out', async () => {
    expect(alone).toEqual({ words: 'Fix the corners in Perspective first.', isWordsOnly: true });
    expect(lineAlone).toEqual({ line: '', isLineShown: false, isDownloadOff: true });
  });
  // Stand-in: the back's opening is held, so the screen can be read while it opens. The photo
  // area is not drawn again until the back is up, so only the line is read here.
  const choosing = page.waitForEvent('filechooser');
  await hand.tap(page.locator('#btnAddBack'));
  const chooser = await choosing;
  await check('The file picker opens', () => {
    expect(chooser.isMultiple()).toBe(false);
  });
  await holdNextOpening(page);
  await chooser.setFiles(samplePath(BACK));
  await waitForOpening(page);
  const lineOpening = await fixLineNow(page);
  await check(`While the back opens, the size line reads "${FIX_FRONT}", and Download is greyed `
    + 'out', async () => {
    expect(await page.evaluate(() => !!window.__straightener.app.isSwitching)).toBe(true);
    expect(lineOpening).toEqual(fixLineOf(FIX_FRONT));
  });
  await releaseOpening(page);
  await page.waitForFunction(name => {
    const app = window.__straightener.app;
    return !app.isSwitching && !!app.pair && app.state.source.name === name;
  }, BACK);
  await check('The back opens on the Perspective step, with Back selected in the top bar',
    async () => {
      expect(await stepNow(page)).toBe('perspective');
      expect(await openSide(page)).toBe('back');
      await expect(sideButton(page, 'back')).toHaveAttribute('aria-pressed', 'true');
    });
});

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
];

test('MSG-83.1 Perspective\'s tips [phone]', async ({ page, check }, testInfo) => {
  const hand = await start(page, testInfo, { step: 'perspective' });
  const tips = await openTips(page, hand, check, 'perspective');
  await check(`Four paragraphs open in place, in this order: ${quoted(PERSPECTIVE_TIPS)}`, () => {
    expect(tips).toEqual(PERSPECTIVE_TIPS);
  });
});

test('MSG-84.1 Rotate\'s tips [phone]', async ({ page, check }, testInfo) => {
  const hand = await start(page, testInfo, { step: 'rotate' });
  const tips = await openTips(page, hand, check, 'rotate');
  await check(`Four paragraphs open in place, in this order: ${quoted(ROTATE_TIPS)}`, () => {
    expect(tips).toEqual(ROTATE_TIPS);
  });
});

test('MSG-85.1 Crop\'s tip [phone]', async ({ page, check }, testInfo) => {
  const hand = await start(page, testInfo, { step: 'crop' });
  const tips = await openTips(page, hand, check, 'crop');
  await check(`One paragraph opens in place: "${CROP_TIPS[0]}"`, () => {
    expect(tips).toEqual(CROP_TIPS);
  });
});

test('MSG-86.1 Levels\' tips [phone]', async ({ page, check }, testInfo) => {
  const hand = await startLevels(page, testInfo);
  await openOptions(page, hand, 'levels');
  const sheet = page.locator('#levelsSheet');
  const tips = await sheet.locator('.sheet-hint:visible').allTextContents();
  await check('A sheet titled LEVELS TIPS rises, holding three paragraphs, in this order: '
    + quoted(LEVELS_TIPS), async () => {
    await expect(sheet.locator('.sheet-title')).toHaveText('Levels tips');
    await expect(sheet.locator('.sheet-title')).toHaveCSS('text-transform', 'uppercase');
    expect(tips).toEqual(LEVELS_TIPS);
  });
});

test('MSG-87.1 Overlay\'s tips [phone]', async ({ page, check }, testInfo) => {
  const hand = await startOnOverlay(page, testInfo, { photo: PHOTO });
  const tips = await openTips(page, hand, check, 'overlay');
  await check(`Four paragraphs open in place, in this order: ${quoted(OVERLAY_TIPS)}`, () => {
    expect(tips).toEqual(OVERLAY_TIPS);
  });
});

test('MSG-88.1 Export\'s tips [phone]', async ({ page, check }, testInfo) => {
  const hand = await start(page, testInfo);
  const tips = await openTips(page, hand, check, 'export');
  // Ruling R61: the fourth tip, which nearly repeated the edits hint, has gone.
  await check(`Three paragraphs open in place, in this order: ${quoted(EXPORT_TIPS)}; none says `
    + '"An edits file is small."', () => {
    expect(tips).toEqual(EXPORT_TIPS);
  });
});

test('MSG-89.1 The Corner shots sheet\'s hint [phone]', async ({ page, check }, testInfo) => {
  const hand = await start(page, testInfo);
  await openCornerSheet(page, hand);
  const text = 'Close-ups of the card’s four corners, at the photo’s own resolution, with this '
    + 'photo’s levels and no overlay.';
  await check(`The Corner shots sheet rises and reads "${text}"`, async () => {
    expect(await isCornerSheetOpen(page)).toBe(true);
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
  await check(`EXPORT OPTIONS rise from the bottom; under Save edits and Load edits: `
    + `"${EDITS_HINT}"`, async () => {
    await expectSheetTitle(page, 'export', 'Export options');
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
  await check('EXPORT OPTIONS rise from the bottom; under Save edits and Load edits the hint '
    + `reads "Saves the side you’re on. ${EDITS_HINT}", its first sentence in bold`, async () => {
    await expectSheetTitle(page, 'export', 'Export options');
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
  await check('On Rotate, the keyboard help reads "F fits; 1 to 6 change step."', async () => {
    await expect(page.locator('.sheet-tips-heading:visible')).toHaveText(['Tips and keys']);
    expect(await keyHelp(page)).toEqual(['F fits; 1 to 6 change step.']);
  });
  await goToStep(page, 'crop', hand);
  await check('On Crop, under "Tips and keys": "Shift keeps the aspect in Free."', async () => {
    await expect(page.locator('.sheet-tips-heading:visible')).toHaveText(['Tips and keys']);
    expect(await keyHelp(page)).toEqual(['Shift keeps the aspect in Free.']);
  });
  await goToStep(page, 'export', hand);
  await check('On Export there is no keyboard help', async () => {
    expect(await keyHelp(page)).toEqual([]);
  });
});

test('MSG-91.1 Controls without words have names for screen readers [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await start(page, testInfo, { step: 'rotate' });
  // The starting screen: zoomed in, so Fit to screen shows.
  await zoomIn(page, hand);
  await expect(page.locator('#btnFit')).toBeVisible();
  await check('They are named "Open photo", "Fit to screen", "Undo" and "Redo"', async () => {
    for (const name of ['Open photo', 'Fit to screen', 'Undo', 'Redo']) {
      await expect(page.getByRole('button', { name, exact: true })).toBeVisible();
    }
  });
  await check('It is named "Options"', async () => {
    await expect(page.locator('#rotateAreaGrabber')).toBeVisible();
    await expect(page.locator('#rotateAreaGrabber')).toHaveAttribute('aria-label', 'Options');
  });
  await openOptions(page, hand, 'rotate');
  await check('ROTATE OPTIONS rise from the bottom', async () => {
    await expectSheetTitle(page, 'rotate', 'Rotate options');
  });
  await check('It is named "Close"', async () => {
    const close = page.locator('#rotateSheet').getByRole('button', { name: 'Close', exact: true });
    await expect(close).toBeVisible();
  });
});

test('MSG-91.3 The nudge keys, Close tuning and the corner thumbnails have names [desktop]',
  async ({ page, check }, testInfo) => {
    const hand = await startTuning(page, testInfo);
    await check('They are named "Nudge left", "Nudge up", "Nudge down" and "Nudge right"',
      async () => {
        const keys = page.locator('#perspectiveNudge .nudge-key');
        await expect(keys.first()).toBeVisible();
        const names = await keys.evaluateAll(all => all.map(key => key.getAttribute('aria-label')));
        expect(names).toEqual(['Nudge left', 'Nudge up', 'Nudge down', 'Nudge right']);
      });
    await check('It is named "Close tuning"', async () => {
      await expect(page.locator('#debugClose')).toBeVisible();
      await expect(page.locator('#debugClose')).toHaveAttribute('aria-label', 'Close tuning');
    });
    await goToStep(page, 'export', hand);
    await check('The Export step\'s controls show', async () => {
      await expect(page.locator('#btnDownload')).toBeVisible();
    });
    await openCornerSheet(page, hand);
    const thumbnails = page.locator('#cornerShotsSheet .corner-thumbs canvas');
    await check('The four corner thumbnails show', async () => {
      await expect(thumbnails).toHaveCount(4);
      await expect(thumbnails.first()).toBeVisible();
    });
    await check('They are named "Top-left corner", "Top-right corner", "Bottom-left corner" and '
      + '"Bottom-right corner"', async () => {
      const names = await thumbnails.evaluateAll(all => all.map(thumb => (
        thumb.getAttribute('aria-label'))));
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
  const hand = await startOnStartScreen(page, testInfo);
  const version = await appVersion(page);
  await check('It reads "[card-finisher] vX.Y.Z", with the build\'s version', () => {
    expect(lines.map(line => line.text)).toContain(`[card-finisher] v${version}`);
  });
  await pickWith(page, hand, page.locator('#btnOpenEmpty'), PHOTO);
  await waitForPhoto(page, PHOTO);
  await check(`Then "[card-finisher] ${PHOTO}: 1536×2048 loaded + previewed in N ms", N the `
    + 'milliseconds it took', () => {
    const loadLine = new RegExp(`^\\[card-finisher\\] ${PHOTO.replace('.', '\\.')}: `
      + '1536×2048 loaded \\+ previewed in \\d+ ms$');
    expect(lines.some(line => loadLine.test(line.text))).toBe(true);
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
  const hand = await startOnStartScreen(page, testInfo);
  await pickWith(page, hand, page.locator('#btnOpenEmpty'), PHOTO);
  await waitForPhoto(page, PHOTO);
  await check('The photo opens; the console warns "[card-finisher] session photo not saved:"',
    async () => {
      expect((await editState(page)).source.name).toBe(PHOTO);
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
  const hand = await startOnStartScreen(page, testInfo);
  await pickWith(page, hand, page.locator('#btnOpenEmpty'), PHOTO);
  await waitForPhoto(page, PHOTO);
  await check('The console warns "[card-finisher] Web Worker unavailable, running on main '
    + 'thread:"; the photo still opens with its corner handles on the card', async () => {
    expect(lines.some(line => line.type === 'warning' && line.text.startsWith(
      '[card-finisher] Web Worker unavailable, running on main thread:',
    ))).toBe(true);
    expect((await editState(page)).source.name).toBe(PHOTO);
    const candidates = await page.evaluate(() => (
      window.__straightener.app.detection.candidates.length));
    expect(candidates).toBeGreaterThan(0);
  });
});
