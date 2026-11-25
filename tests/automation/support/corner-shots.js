// Helpers for the Corner shots, Upscale question and Question card cases
// (tests/automation/corner-shots.spec.js, upscale-question.spec.js, question-cards.spec.js):
// starting on Export, the Corner shots sheet, the question card, saved files and what is in
// them. Like support/app.js, they act through the app's controls and read its state (through
// window.__straightener and CF) only to wait for a result or to check one. The few that act
// through the page's code say why: there is no control a person could use for it.
'use strict';
const fs = require('fs');
const path = require('path');
const { expect } = require('@playwright/test');
const {
  root,
  openApp,
  openPhoto,
  goToStep,
  handFor,
  openOptions,
  closeOptions,
  cornerOnPage,
  questionCard,
  questionButton,
  isQuestionUp,
  savedSize,
  waitInPage,
} = require('./app.js');
const {
  installShareStandIn,
  recordExports,
  waitForQuestion,
  waitForExportEnd,
} = require('./export.js');
const { downloadAll, chooseFile, switchTo } = require('./front-and-back.js');

// The committed files the cases name besides the sample photos (a logo, and the like).
const FIXTURES_DIR = path.join(root, 'tests', 'fixtures');
// The image types a fixture can have, by its extension.
const FIXTURE_TYPES = { '.png': 'image/png', '.svg': 'image/svg+xml', '.gif': 'image/gif' };

// The case photo for corner shots: a raw chrome card flat on a black mat. Its card is found the
// same in Chromium and WebKit (14_front_portrait_raw_white.JPEG is not: its corner shots are
// 144 px in Chromium and 136 px in WebKit), and the light card on the dark mat shows where the
// card's corner sits in each shot.
const CORNER_PHOTO = '01_chrome_flat_black.JPEG';
// The edits file that places the front's corners in the "14" pair: saved with Save edits from
// 14_front_portrait_raw_white.JPEG on its own, its corners where Chromium's detection puts them
// (on the card), turned 3.0° and with a square crop (the pair's lock drops the crop; Reset on
// Rotate undoes the turn).
const FRONT_CORNERS_EDITS = 'pair-front-square-crop-edits.json';
// A link that never asks the Upscale question for corner shots (0 never asks), for cases about
// something else.
const NO_CORNER_QUESTION = 'index.html?cornerShots.upscaleTargetPx=0';
// How long a case waits for downloads before giving up.
const DOWNLOAD_TIMEOUT_MS = 20000;
// A pixel's luminance weights for red, green and blue (Rec. 601).
const LUMA_WEIGHTS = [0.299, 0.587, 0.114];
// How many rows (or columns) around a profile's line are averaged, so the mat's texture and
// JPEG noise don't move the edge.
const PROFILE_BAND_PX = 5;
// Where cardEdgeAlong reads the mat's level (the outer stretch of a line) and the card's (a
// stretch well inside it), as fractions of the line's length.
const MAT_STRETCH = [0, 0.15];
const CARD_STRETCH = [0.45, 0.55];
// For how many pixels in a row a line must stay past the halfway mark to count as the card, so
// a light speck in the mat's weave isn't taken for its edge.
const CARD_RUN_PX = 3;
// How much of a shot a corner measurement averages across, as a fraction of its side: half,
// all of it on the card's side of the corner, so the card's own pattern evens out.
const SHOT_BAND = 0.5;
// The same for the card's width in an export: a strip 4% of its height.
const EXPORT_BAND = 0.04;
// The row cardWidthInExport measures along, as a fraction of the export's height.
const WIDTH_ROW_AT = 0.3;

// Opens the app with a photo (CORNER_PHOTO unless `photo` names another) and goes to a step
// (Export unless `step` says another). The page gets a stand-in share sheet first
// (support/export.js; 'share' unless `share` names another behavior), so Share shows as it does
// on an iPhone and no real sheet ever opens. address: the page to open, for a link with
// settings in it. isWatched: record the screen as each save begins (recordExports).
// Returns the hand for this target.
async function startOnExport(page, testInfo, options = {}) {
  const {
    step = 'export',
    share = 'share',
    address = 'index.html',
    photo = CORNER_PHOTO,
    isWatched = false,
  } = options;
  if (share) await installShareStandIn(page, share);
  if (isWatched) await recordExports(page);
  await openApp(page, address);
  await openPhoto(page, photo);
  const hand = handFor(page, testInfo);
  await goToStep(page, step, hand);
  return hand;
}

// True while the Corner shots sheet is open (on a wide screen it is listed in the panel and
// counts as open only on a phone's terms: never).
function isCornerSheetOpen(page) {
  return page.evaluate(() => window.CF.isSheetOpen(document.getElementById('cornerShotsSheet')));
}

// Waits until the Corner shots sheet is open (true) or has gone (false), and has stopped
// moving.
async function waitForCornerSheet(page, isOpen) {
  await page.waitForFunction(wanted => {
    const layer = document.getElementById('cornerShotsSheet');
    const isOpenNow = window.CF.isSheetOpen(layer);
    return wanted ? isOpenNow : !isOpenNow && layer.hidden;
  }, isOpen);
}

// Taps Corner shots on Export. On a phone it waits for the sheet to rise; on a wide screen the
// section is always shown in the panel.
async function openCornerSheet(page, hand) {
  await hand.tap(page.locator('#btnCornerShots'));
  if (hand.isTouch) await waitForCornerSheet(page, true);
}

// Closes the Corner shots sheet on a phone with its Close button (× at its top right); on a wide
// screen it does nothing.
function closeCornerSheet(page, hand) {
  return closeOptions(page, hand, 'cornerShots');
}

// Opens the Corner shots sheet and chooses one of its outputs ('4 photos' or '1 sheet').
async function chooseCornerOutput(page, hand, label) {
  if (hand.isTouch && !(await isCornerSheetOpen(page))) await openCornerSheet(page, hand);
  await hand.tap(page.locator('#cornerOutput').getByRole('button', { name: label, exact: true }));
}

// The Corner shots size line's text as the screen shows it.
function cornerReadout(page) {
  return page.locator('#cornerReadout').evaluate(el => el.innerText.replace(/\s+/g, ' ').trim());
}

// Taps Download corners (or, with button '#btnCornerShare', Share corners), answers the Upscale
// question with `answer` if it is asked, and collects `count` downloads. Returns
// [{ name, file, atMs }] in the order they arrived.
function saveCorners(page, hand, count = 1, answer = 'No') {
  return downloadAll(page, hand, count, answer, '#btnCornerDownload');
}

// Expects the question card to be up, asking `title` (and, when given, saying `text`).
async function expectQuestion(page, title, text = null) {
  await waitForQuestion(page, true);
  await expect(questionCard(page).locator('.alert-title')).toHaveText(title);
  if (text !== null) await expect(questionCard(page).locator('.alert-text')).toHaveText(text);
}

// The sheet's Download button.
const downloadCorners = page => page.locator('#btnCornerDownload');

// Collects every download that arrives from now on into the returned list ({ name, file }
// promises resolve as each finishes). Call stop() to stop collecting.
function collectDownloads(page) {
  const downloads = [];
  const onDownload = download => downloads.push(download);
  page.on('download', onDownload);
  return {
    downloads,
    stop: () => page.off('download', onDownload),
  };
}

// Waits a moment and returns how many downloads `collector` has seen: for a case that must
// show that nothing was saved.
async function downloadsAfterWait(page, collector, waitMs) {
  await page.waitForTimeout(waitMs);
  return collector.downloads.length;
}

// Waits until `count` downloads have reached `collector`, and returns them as
// [{ name, file }].
async function downloadsArrived(page, collector, count) {
  const deadline = Date.now() + DOWNLOAD_TIMEOUT_MS;
  while (collector.downloads.length < count && Date.now() < deadline) {
    await page.waitForTimeout(50);
  }
  if (collector.downloads.length < count) {
    throw new Error(`Expected ${count} downloads, ${collector.downloads.length} arrived`);
  }
  const saved = [];
  for (const download of collector.downloads.slice(0, count)) {
    saved.push({ name: download.suggestedFilename(), file: await download.path() });
  }
  return saved;
}

// The luminance (0 to 255) along a line across a saved image, one value per pixel: a row
// (axis 'row', at `lineAt` of the height, read left to right) or a column (axis 'column', at
// `lineAt` of the width, read top to bottom). Each value averages `band` lines around it: a
// number of px, or, under 1, a fraction of the image's size across the line.
async function luminanceProfile(page, file, axis, lineAt, band = PROFILE_BAND_PX) {
  const base64 = fs.readFileSync(file).toString('base64');
  const type = file.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
  return page.evaluate(async ({ data, mimeType, lineAxis, fraction, bandSize, weights }) => {
    const bytes = Uint8Array.from(atob(data), character => character.charCodeAt(0));
    const bitmap = await createImageBitmap(new Blob([bytes], { type: mimeType }));
    const { width, height } = bitmap;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(bitmap, 0, 0);
    const pixels = ctx.getImageData(0, 0, width, height).data;
    const isRow = lineAxis === 'row';
    const length = isRow ? width : height;
    const across = isRow ? height : width;
    const middle = Math.round(fraction * across);
    const bandPx = bandSize < 1 ? Math.max(1, Math.round(bandSize * across)) : bandSize;
    // The lines averaged: from `reach` before the middle one to `reach` after it.
    const reach = Math.floor(bandPx / 2);
    const lineCount = 2 * reach + 1;
    const profile = [];
    for (let along = 0; along < length; along++) {
      let total = 0;
      for (let offset = -reach; offset <= reach; offset++) {
        const line = Math.min(across - 1, Math.max(0, middle + offset));
        const x = isRow ? along : line;
        const y = isRow ? line : along;
        const index = (y * width + x) * 4;
        total += pixels[index] * weights[0]
          + pixels[index + 1] * weights[1]
          + pixels[index + 2] * weights[2];
      }
      profile.push(total / lineCount);
    }
    return profile;
  }, {
    data: base64,
    mimeType: type,
    lineAxis: axis,
    fraction: lineAt,
    bandSize: band,
    weights: LUMA_WEIGHTS,
  });
}

// A fingerprint of the pixels inside a rectangle of a saved image ({ x, y, width, height } in
// its px): a string that is the same for two rectangles exactly when their [r, g, b, a] values
// are, short of a collision. For comparing parts of two lossless (PNG) files.
async function regionFingerprint(page, file, rect) {
  const base64 = fs.readFileSync(file).toString('base64');
  const type = file.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
  return page.evaluate(async ({ data, mimeType, area }) => {
    const bytes = Uint8Array.from(atob(data), character => character.charCodeAt(0));
    const bitmap = await createImageBitmap(new Blob([bytes], { type: mimeType }));
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(bitmap, 0, 0);
    const pixels = ctx.getImageData(area.x, area.y, area.width, area.height).data;
    const digest = await crypto.subtle.digest('SHA-256', pixels);
    return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  }, { data: base64, mimeType: type, area: rect });
}

// The mean of a stretch of a profile, from fromFraction to toFraction of its length.
function meanOf(profile, fromFraction, toFraction) {
  const start = Math.floor(fromFraction * profile.length);
  const end = Math.max(start + 1, Math.floor(toFraction * profile.length));
  const stretch = profile.slice(start, end);
  return stretch.reduce((sum, value) => sum + value, 0) / stretch.length;
}

// Where a light card begins on a dark mat along a profile, as a fraction (0 to 1) of its
// length: the first point, going in from the side `fromEnd` names ('start' or 'end'), past the
// halfway mark between the mat's level (its outer 15%) and the card's (from 45% to 55% in),
// that stays past it for CARD_RUN_PX. Returns null when it never does: no card edge on this
// line.
function cardEdgeAlong(profile, fromEnd) {
  const ordered = fromEnd === 'start' ? profile : profile.slice().reverse();
  const halfway = (meanOf(ordered, ...MAT_STRETCH) + meanOf(ordered, ...CARD_STRETCH)) / 2;
  const index = ordered.findIndex((value, start) => ordered
    .slice(start, start + CARD_RUN_PX)
    .every(next => next > halfway));
  if (index < 0) return null;
  const fraction = index / ordered.length;
  return fromEnd === 'start' ? fraction : 1 - fraction;
}

// Where the card's corner sits in a saved corner shot: { across, down }, each a fraction (0 to
// 1) of the shot's side, measured along a row and a column through the card's part of the
// shot. label: 'tl', 'tr', 'br' or 'bl', the corner it shows, which says on which sides the
// mat is.
async function cardCornerInShot(page, file, label) {
  const isLeft = label.endsWith('l');
  const isTop = label.startsWith('t');
  // A line through the card's part, away from the rounded corner.
  const throughCard = isTop ? 0.65 : 0.35;
  const throughCardAcross = isLeft ? 0.65 : 0.35;
  const row = await luminanceProfile(page, file, 'row', throughCard, SHOT_BAND);
  const column = await luminanceProfile(page, file, 'column', throughCardAcross, SHOT_BAND);
  return {
    across: cardEdgeAlong(row, isLeft ? 'start' : 'end'),
    down: cardEdgeAlong(column, isTop ? 'start' : 'end'),
  };
}

// The card's width in a saved export, in px: from its left edge to its right edge along a row
// 30% of the way down (a light card on a dark mat; the row runs through the card's silver
// lettering, clear of the darker helmet below it).
async function cardWidthInExport(page, file) {
  const row = await luminanceProfile(page, file, 'row', WIDTH_ROW_AT, EXPORT_BAND);
  const left = cardEdgeAlong(row, 'start');
  const right = cardEdgeAlong(row, 'end');
  return Math.round((right - left) * row.length);
}

// Makes the corner shots impossible from now on, for the reason given: CardEngine.cornerShots
// answers { ok: false, reason }. A person can't bring this about with today's controls and
// photos (the engine refuses only a frame it can't invert, or a card with no size), so this one
// change is made in the page's code. The screen is updated after it. For a card that is too
// small, use makeCardTooSmallForCorners: its reason comes from the engine itself.
async function makeCornerShotsImpossible(page, reason) {
  await page.evaluate(engineReason => {
    window.CardEngine.cornerShots = () => ({ ok: false, reason: engineReason });
    window.CF.syncReadouts();
  }, reason);
}

// Makes the card too small for corner shots from now on, in the engine's own words: every
// call of CardEngine.cornerShots goes to the real engine with the card's four corners moved
// onto one point, a card with no size, which it refuses as too small. The reason on screen is
// then the engine's, not a copy of its sentence kept here, so a case fails if the app stops
// recognizing it. A person can't bring this about with today's controls and photos. The screen
// is updated after it.
async function makeCardTooSmallForCorners(page) {
  await page.evaluate(() => {
    const realCornerShots = window.CardEngine.cornerShots;
    window.CardEngine.cornerShots = (geometry, config, sizePx) => {
      if (!geometry || !geometry.ok) return realCornerShots(geometry, config, sizePx);
      const onePoint = geometry.cardRotated[0];
      const noSizeCard = geometry.cardRotated.map(() => onePoint.slice());
      const noSizeGeometry = Object.assign({}, geometry, { cardRotated: noSizeCard });
      return realCornerShots(noSizeGeometry, config, sizePx);
    };
    window.CF.syncReadouts();
  });
}

// Gives the page a stand-in share sheet whose "can this browser share files?" answer can change
// while the app runs (window.testCanShare, false to start with), as when a page that could not
// share becomes able to. Shares are recorded as installShareStandIn's are.
async function installSwitchableShare(page) {
  await page.addInitScript(() => {
    window.testCanShare = false;
    window.testShares = [];
    window.testSharedFiles = [];
    navigator.canShare = () => window.testCanShare;
    navigator.share = async data => {
      window.testSharedFiles.push(data.files);
      window.testShares.push({
        files: data.files.map(file => ({ name: file.name, type: file.type, size: file.size })),
      });
    };
  });
}

// Records each value the Corner shots sheet's progress line is set to (0 to 100), in order, in
// window.testCornerProgress, from before the app loads. Several values can be set before the
// page reports them; each report's old values give the ones in between.
async function recordCornerProgress(page) {
  await page.addInitScript(() => {
    window.testCornerProgress = [];
    document.addEventListener('DOMContentLoaded', () => {
      new MutationObserver(changes => {
        const lineChanges = changes.filter(change => !!change.target.closest('#cornerShotsSheet'));
        lineChanges.forEach((change, index) => {
          if (index > 0) window.testCornerProgress.push(Number(change.oldValue));
        });
        const line = lineChanges.length ? lineChanges[0].target : null;
        if (line) window.testCornerProgress.push(Number(line.getAttribute('aria-valuenow')));
      }).observe(document.body, {
        subtree: true,
        attributes: true,
        attributeOldValue: true,
        attributeFilter: ['aria-valuenow'],
      });
    });
  });
}

// The values recordCornerProgress has seen so far.
const cornerProgressSoFar = page => page.evaluate(() => window.testCornerProgress.slice());

// Opens Export options, picks an Interpolation ('Bilinear' or 'Bicubic (sharper, slower)'), and
// closes them again on a phone.
async function chooseInterpolation(page, hand, label) {
  await openOptions(page, hand, 'export');
  await page.locator('#interp').selectOption({ label });
  await closeOptions(page, hand, 'export');
}

// Where an element's box is on the page: { x, y, width, height } in CSS px.
const boxOf = locator => locator.boundingBox();

// The element on top at the middle of `locator`'s box: the id of the nearest element with an
// id, from what the page would hit there.
function topElementAt(page, locator) {
  return locator.evaluate(el => {
    const rect = el.getBoundingClientRect();
    const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    const holder = hit && hit.closest('[id]');
    return holder ? holder.id : '';
  });
}

// A file from tests/fixtures/ as a payload for a file picker: { name, mimeType, buffer }.
function fixtureFile(name) {
  const mimeType = FIXTURE_TYPES[path.extname(name).toLowerCase()] || 'application/octet-stream';
  return { name, mimeType, buffer: fs.readFileSync(path.join(FIXTURES_DIR, name)) };
}

// Taps a control that opens the file picker (Open photo, Add logo) and waits for the picker to
// open. Returns the picker, still open, so a case can check it before choosing a file.
async function openPicker(page, hand, control) {
  const choosing = page.waitForEvent('filechooser');
  await hand.tap(control);
  return choosing;
}

// Chooses a logo from tests/fixtures/ in an open picker (from Add logo or Replace logo) and
// waits until it is the logo on the photo.
async function chooseFixtureLogo(page, chooser, name) {
  const before = await page.evaluate(() => {
    const overlay = window.__straightener.app.state.overlay;
    return overlay ? overlay.id : null;
  });
  await chooser.setFiles(fixtureFile(name));
  await page.waitForFunction(idBefore => {
    const overlay = window.__straightener.app.state.overlay;
    return !!overlay && overlay.id !== idBefore;
  }, before);
}

// Save the corners, the named action in tests/catalog/corner-shots.md: with the Corner shots
// sheet closed, taps Corner shots, then Download corners (answering the Upscale question with
// `answer` if it is asked), waits for `count` files and for the save to end, and closes the
// sheet. Returns [{ name, file, atMs }] in the order the files arrived.
async function saveTheCorners(page, hand, count = 1, answer = 'No') {
  await openCornerSheet(page, hand);
  const saved = await saveCorners(page, hand, count, answer);
  await waitForExportEnd(page);
  await closeCornerSheet(page, hand);
  return saved;
}

// Place the front's corners, the named action in the pair cases about sizes (CNR-16.1,
// MSG-24.1, MSG-77, UPS-06): from the "14" pair (PORTRAIT_PAIR) with the back open, taps Front,
// Export, opens Export options, taps Load edits and chooses FRONT_CORNERS_EDITS, then taps Rotate
// and Reset (the angle back to 0.0°), then Back. Ends with the back open on Rotate.
// Why: detection of that front differs by browser engine (Chromium finds the card; Playwright's
// WebKit an outline about 38 px inside its left and right edges), and the crop is fitted to the
// corners. With the corners from a file, every engine measures the same card.
async function placeFrontCorners(page, hand) {
  await switchTo(page, hand, 'front');
  await goToStep(page, 'export', hand);
  await openOptions(page, hand, 'export');
  await chooseFile(page, hand, page.locator('#btnLoadEdits'),
    path.join(FIXTURES_DIR, FRONT_CORNERS_EDITS));
  await waitInPage(page, () => window.__straightener.app.state.rotation.fine === 3);
  // On a phone the app closes the options once it has applied the file (ruling R12).
  if (hand.isTouch) await page.locator('#exportSheet').waitFor({ state: 'hidden' });
  await goToStep(page, 'rotate', hand);
  await hand.tap(page.locator('#btnRotateReset'));
  await waitInPage(page, () => window.__straightener.app.state.rotation.fine === 0);
  await switchTo(page, hand, 'back');
}

// The four thumbnails as drawn now, in order: a SHA-256 of each canvas's pixels, equal for two
// drawings exactly when every pixel is.
function thumbnailDigests(page) {
  return page.evaluate(async () => {
    const canvases = [...document.querySelectorAll('canvas[data-corner]')];
    const digests = [];
    for (const canvas of canvases) {
      const ctx = canvas.getContext('2d');
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const digest = await crypto.subtle.digest('SHA-256', pixels);
      const hex = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0'));
      digests.push(hex.join(''));
    }
    return digests;
  });
}

// True when the outline crosses itself as a person sees it on Perspective: the top-left
// corner's handle sits below and to the right of the bottom-right one on the page.
async function isOutlineCrossed(page) {
  const topLeft = await cornerOnPage(page, 0);
  const bottomRight = await cornerOnPage(page, 2);
  return topLeft.x > bottomRight.x && topLeft.y > bottomRight.y;
}

// How much of a corner shot the logo covers, as a fraction (0 to 1) of the shot's square: the
// overlap of the logo's box and the square the shot frames, both in the straightened picture's
// px. label: 'tl', 'tr', 'br' or 'bl'. 0 with no logo or no corner shots. For the cases that
// prove the logo is left out: they place it where it would show if it were drawn in.
function logoCoverOfShot(page, label) {
  return page.evaluate(shotLabel => {
    const app = window.__straightener.app;
    const overlay = app.state.overlay;
    if (!overlay || !app.geometry || !app.geometry.ok) return 0;
    const shots = window.CardEngine.cornerShots(app.geometry, CONFIG.cornerShots);
    if (!shots.ok) return 0;
    const crop = app.geometry.crop;
    const placed = window.CardEngine.clampOverlay(overlay, crop.width, crop.height);
    const logo = window.CardEngine.overlayRect(placed, crop.width, crop.height);
    const square = shots.shots.find(shot => shot.label === shotLabel).rectRotated;
    const overlapOf = (logoStart, logoSize, squareStart, squareSize) => Math.max(0,
      Math.min(logoStart + logoSize, squareStart + squareSize) - Math.max(logoStart, squareStart));
    const across = overlapOf(crop.x + logo.x, logo.width, square.x, square.width);
    const down = overlapOf(crop.y + logo.y, logo.height, square.y, square.height);
    return (across * down) / (square.width * square.height);
  }, label);
}

module.exports = {
  CORNER_PHOTO,
  NO_CORNER_QUESTION,
  startOnExport,
  isCornerSheetOpen,
  waitForCornerSheet,
  openCornerSheet,
  closeCornerSheet,
  chooseCornerOutput,
  cornerReadout,
  saveCorners,
  questionCard,
  questionButton,
  expectQuestion,
  isQuestionUp,
  collectDownloads,
  downloadsAfterWait,
  downloadsArrived,
  luminanceProfile,
  regionFingerprint,
  cardCornerInShot,
  cardWidthInExport,
  makeCornerShotsImpossible,
  makeCardTooSmallForCorners,
  installSwitchableShare,
  recordCornerProgress,
  cornerProgressSoFar,
  chooseInterpolation,
  boxOf,
  topElementAt,
  fixtureFile,
  openPicker,
  chooseFixtureLogo,
  saveTheCorners,
  placeFrontCorners,
  thumbnailDigests,
  isOutlineCrossed,
  logoCoverOfShot,
  imageSize: savedSize,
  downloadCorners,
};
