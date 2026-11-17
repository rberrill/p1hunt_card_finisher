// Helpers for the Export cases (tests/automation/export.spec.js): stand-ins for the browser's
// share sheet, a recorder of what the screen looked like as each export began, and small steps
// on the Export step (choosing a size, a fill, reading the size line and its notes).
// They read the app's state only to check a result, never to act.
'use strict';
const fs = require('fs');
const path = require('path');
const {
  openOptions,
  closeOptions,
  cornerOnPage,
  saveByDownload,
  waitForStill,
} = require('./app.js');

// The image types a saved file can have, by its extension.
const MIME_TYPES = { '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };

// How the stand-in share sheet answers (installShareStandIn):
//   'share'       it shares the files
//   'cancel'      the person closes it (the browser's AbortError)
//   'refuseOnce'  the browser refuses the first time, as it does when the tap was too long ago
//                 (NotAllowedError), and shares the next time
//   'fail'        it fails with another error
//   'none'        the browser has no share sheet at all
const SHARE_BEHAVIORS = ['share', 'cancel', 'refuseOnce', 'fail', 'none'];
// The error message the 'fail' stand-in gives, which the app shows after "Share failed: ".
const SHARE_FAILURE_MESSAGE = 'The stand-in share sheet failed';
// The controls whose state recordExports keeps for each export, by id.
const WATCHED_CONTROLS = [
  'btnShare',
  'btnDownload',
  'btnCopy',
  'btnAddBack',
  'btnCornerShots',
  'btnNextCard',
  'btnCornerShare',
  'btnCornerDownload',
  'btnUndo',
  'btnRedo',
  'btnSaveEdits',
  'btnLoadEdits',
  'btnUnpair',
  'quality',
  'interp',
  'fill',
  'exportResetRow',
];
// The groups of choices whose segments recordExports keeps, by id.
const WATCHED_CHOICES = ['exportSize', 'exportFormat', 'pairOutput', 'cornerOutput', 'sideSwitch'];
// How far past the bottom-right corner the top-left one is dragged to cross the outline, in
// source px.
const CROSS_PAST_PX = 60;
// How many moves a drag of the Quality slider is made of (dragQualityTo).
const QUALITY_SLIDE_MOVES = 12;
// How far past an end of the Quality slider's track a drag to that end goes, in CSS px, so
// the knob ends hard against it, as a finger that overshoots does.
const QUALITY_PAST_END_PX = 12;
// The width of a slider's knob, in CSS px (css/app.css, .slider input's thumb).
const SLIDER_KNOB_PX = 22;
// The rows readSavedRows reads, as fractions of the image's height.
const SAVED_ROW_FRACTIONS = [0.25, 0.5, 0.75];

// Gives the page a stand-in for the browser's share sheet before the app loads, so a case can
// prove what the app hands over without opening a real one (Rich: no case uses a desktop
// browser's own share feature). Each call is recorded in window.testShares as
// { files: [{ name, type, size }] }, and the File objects in window.testSharedFiles (one array
// per call), so a case can tell whether a second share reused the same files.
async function installShareStandIn(page, behavior = 'share') {
  if (!SHARE_BEHAVIORS.includes(behavior)) throw new Error(`Unknown share stand-in ${behavior}`);
  await page.addInitScript(({ mode, failureMessage }) => {
    window.testShares = [];
    window.testSharedFiles = [];
    if (mode === 'none') {
      Object.defineProperty(Navigator.prototype, 'share', { value: undefined });
      Object.defineProperty(Navigator.prototype, 'canShare', { value: undefined });
      return;
    }
    navigator.canShare = () => true;
    navigator.share = async data => {
      window.testSharedFiles.push(data.files);
      window.testShares.push({
        files: data.files.map(file => ({ name: file.name, type: file.type, size: file.size })),
      });
      const callCount = window.testShares.length;
      if (mode === 'cancel') throw new DOMException('Share canceled', 'AbortError');
      if (mode === 'fail') throw new DOMException(failureMessage, 'DataError');
      if (mode === 'refuseOnce' && callCount === 1) {
        throw new DOMException('The request is not allowed', 'NotAllowedError');
      }
    };
  }, { mode: behavior, failureMessage: SHARE_FAILURE_MESSAGE });
}

// Records, as each export or corner-shot save begins, what the screen showed at that moment:
// window.testExportStarts gets one entry per start,
// { host, edgeOffsetPx, linesShown, controls, choices, tabs }.
//   host          the id of what the progress line is on (a sheet or a control area)
//   edgeOffsetPx  how far the line's top is below the top edge of that sheet or control area,
//                 in CSS px (it sits on the edge: within a pixel or two of 0)
//   linesShown    how many progress lines can be seen on the page at that moment
//   controls      per watched id: { disabled, hidden, label }
//   choices       per watched group of choices: true when every one of its choices is dimmed
//   tabs          the step tabs that are dimmed, by step name
// A start is the first change the browser reports to a progress line while the app is
// exporting (js/app/parts/progress-line.js). The report comes after the app has finished the
// work the tap did at once, so the record shows the screen as a person would see it during the
// export, however short the export is.
async function recordExports(page) {
  await page.addInitScript(({ controlIds, choiceIds }) => {
    window.testExportStarts = [];
    // A progress line that can be seen: not hidden, and laid out on the page.
    const isShown = line => !line.hidden && line.getClientRects().length > 0;
    // The top of the box whose top edge the line runs along: the sheet itself (not its
    // dimmed layer) or the control area.
    const edgeOffsetOf = line => {
      const edge = line.closest('.sheet, .control-area');
      if (!edge) return null;
      return line.getBoundingClientRect().top - edge.getBoundingClientRect().top;
    };
    const describe = id => {
      const el = document.getElementById(id);
      if (!el) return null;
      const label = el.querySelector('.action-label');
      return {
        disabled: !!el.disabled,
        hidden: el.hidden || !el.getClientRects().length,
        label: (label || el).textContent.trim(),
      };
    };
    const isAllDimmed = id => {
      const segments = [...document.querySelectorAll(`#${id} .segment`)];
      return segments.length > 0 && segments.every(segment => segment.disabled);
    };
    const record = line => {
      const host = line.closest('.sheet-layer, .control-area');
      const controls = Object.fromEntries(controlIds.map(id => [id, describe(id)]));
      const choices = Object.fromEntries(choiceIds.map(id => [id, isAllDimmed(id)]));
      const tabs = [...document.querySelectorAll('.step-tab')]
        .filter(tab => tab.getClientRects().length && tab.disabled)
        .map(tab => tab.dataset.step);
      window.testExportStarts.push({
        host: host ? host.id : '',
        edgeOffsetPx: edgeOffsetOf(line),
        linesShown: [...document.querySelectorAll('.progress-line')].filter(isShown).length,
        controls,
        choices,
        tabs,
      });
    };
    // True from the first change to a progress line while the app is exporting until a change
    // seen after the export ended (the line fading out), so each export is recorded once.
    let isInExport = false;
    document.addEventListener('DOMContentLoaded', () => {
      new MutationObserver(changes => {
        const lines = changes
          .map(change => change.target)
          .filter(target => target.classList.contains('progress-line') && !target.hidden);
        if (!lines.length) return;
        const isExporting = !!window.__straightener.app.exporting;
        if (isExporting && !isInExport) record(lines[0]);
        isInExport = isExporting;
      }).observe(document.body, {
        subtree: true,
        attributes: true,
        attributeFilter: ['aria-valuenow', 'class', 'hidden'],
      });
    });
  }, { controlIds: WATCHED_CONTROLS, choiceIds: WATCHED_CHOICES });
}

// The records recordExports has taken so far.
function exportStarts(page) {
  return page.evaluate(() => window.testExportStarts);
}

// The calls the stand-in share sheet has had so far: [{ files: [{ name, type, size }] }].
function sharesSoFar(page) {
  return page.evaluate(() => window.testShares);
}

// One choice of a row of choices on the Export step (Size, Format, Together | Separately), by
// its label as the screen shows it.
function choiceButton(page, groupId, label) {
  return page.locator(`#${groupId}`).getByRole('button', { name: label, exact: true });
}

// The labels of the choices that are selected in a row of choices.
function selectedChoices(page, groupId) {
  return page.locator(`#${groupId} .segment[aria-pressed="true"]`).allTextContents();
}

// The size line's text as the screen shows it: parts hidden by the layout are left out.
function readoutText(page) {
  return page.locator('#exportReadout').evaluate(el => el.innerText.replace(/\s+/g, ' ').trim());
}

// The notes under the size line that can be seen, in order, as text.
async function visibleNotes(page) {
  const notes = page.locator('#exportMessage .export-note');
  const texts = [];
  for (const note of await notes.all()) {
    if (await note.isVisible()) texts.push((await note.textContent()).trim());
  }
  return texts;
}

// Chooses a Fill outside photo color in Export options ('transparent', '#ffffff', '#000000' or
// 'custom'), through the row's own picker, and closes the options again on a phone.
async function chooseFill(page, hand, value) {
  await openOptions(page, hand, 'export');
  await page.locator('#fill').selectOption(value);
  await closeOptions(page, hand, 'export');
}

// The message the toast shows, or '' when no message is up.
async function toastMessage(page) {
  const toast = page.locator('#toast');
  const isShown = await toast.evaluate(el => el.classList.contains('is-shown'));
  return isShown ? (await toast.locator('.toast-text').textContent()).trim() : '';
}

// On the Perspective step, drags the top-left corner handle past the bottom-right one, so the
// outline crosses itself and the corners are invalid.
async function crossTheCorners(page, hand) {
  const start = await cornerOnPage(page, 0);
  const end = await page.evaluate(pastPx => {
    const app = window.__straightener.app;
    const [right, bottom] = app.state.corners[2];
    const [x, y] = window.CF.toScreen(window.CF.currentView(), [right + pastPx, bottom + pastPx]);
    const box = document.getElementById('view').getBoundingClientRect();
    return { x: box.left + x, y: box.top + y };
  }, CROSS_PAST_PX);
  await hand.drag(start, end);
}

// Downloads the export and returns { name, file, bytes }: the name the app gave it, the path of
// the saved copy and its size in bytes. upscaleAnswer as for saveByDownload.
async function downloadExport(page, hand, upscaleAnswer = 'No') {
  const saved = await saveByDownload(page, hand, upscaleAnswer);
  return { ...saved, bytes: fs.statSync(saved.file).size };
}

// Takes away the browser's ability to put images on the clipboard, before the app loads, as a
// browser without image copying is.
async function takeAwayImageClipboard(page) {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'ClipboardItem', { value: undefined });
  });
}

// Taps a control that should not respond (it is greyed out): the tap goes ahead without
// waiting for the control to come live, as a finger's would.
function tapRegardless(hand, locator) {
  return hand.isTouch ? locator.tap({ force: true }) : locator.click({ force: true });
}

// Waits until no export or save is running.
function waitForExportEnd(page) {
  return page.waitForFunction(() => !window.__straightener.app.exporting);
}

// Waits until the stand-in share sheet has had `count` calls in all.
function waitForShares(page, count) {
  return page.waitForFunction(wanted => window.testShares.length >= wanted, count);
}

// The pixel size of a file handed to the stand-in share sheet: { width, height }. call and
// index count from 0.
function sharedImageSize(page, call = 0, index = 0) {
  return page.evaluate(async ({ callIndex, fileIndex }) => {
    const bitmap = await createImageBitmap(window.testSharedFiles[callIndex][fileIndex]);
    return { width: bitmap.width, height: bitmap.height };
  }, { callIndex: call, fileIndex: index });
}

// Reads the image on the clipboard (Chromium, with clipboard permissions granted). Returns
// { types, width, height, corners, minAlpha }: the clipboard item's types, the PNG's size in
// px, the [r, g, b, a] (0 to 255) of its four corner pixels, top-left first, clockwise, and the
// lowest alpha of any pixel (255: nothing is see-through).
function readClipboardImage(page) {
  return page.evaluate(async () => {
    const [item] = await navigator.clipboard.read();
    const bitmap = await createImageBitmap(await item.getType('image/png'));
    const { width, height } = bitmap;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(bitmap, 0, 0);
    const pixels = ctx.getImageData(0, 0, width, height).data;
    const pixelAt = (x, y) => {
      const offset = (y * width + x) * 4;
      return Array.from(pixels.slice(offset, offset + 4));
    };
    const corners = [
      pixelAt(0, 0),
      pixelAt(width - 1, 0),
      pixelAt(width - 1, height - 1),
      pixelAt(0, height - 1),
    ];
    let minAlpha = 255;
    for (let offset = 3; offset < pixels.length; offset += 4) {
      minAlpha = Math.min(minAlpha, pixels[offset]);
    }
    return { types: item.types, width, height, corners, minAlpha };
  });
}

// Taps a button that saves a file (Download corners, Save edits), answers the Upscale question
// with `upscaleAnswer` if it is asked, and waits for the file. Returns { name, file }.
async function saveFileBy(page, hand, button, upscaleAnswer = 'No') {
  const downloading = page.waitForEvent('download');
  await hand.tap(button);
  const card = page.locator('#pairPrompt');
  const isAsked = await Promise.race([
    downloading.then(() => false),
    card.waitFor({ state: 'visible' }).then(() => true, () => false),
  ]);
  if (isAsked) await hand.tap(card.getByRole('button', { name: upscaleAnswer, exact: true }));
  const download = await downloading;
  return { name: download.suggestedFilename(), file: await download.path() };
}

// Reads pixels of a saved image file in the page. points: [[across, down]] as fractions (0 to
// 1) of the image's width and height. Returns { width, height, pixels }, with each point's
// [r, g, b, a] (0 to 255).
async function readSavedPixels(page, file, points) {
  const type = MIME_TYPES[path.extname(file).toLowerCase()] || 'image/jpeg';
  const base64 = fs.readFileSync(file).toString('base64');
  return page.evaluate(async ({ data, mimeType, fractions }) => {
    const bytes = Uint8Array.from(atob(data), character => character.charCodeAt(0));
    const bitmap = await createImageBitmap(new Blob([bytes], { type: mimeType }));
    const { width, height } = bitmap;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(bitmap, 0, 0);
    const pixels = fractions.map(([across, down]) => {
      const x = Math.min(width - 1, Math.floor(across * width));
      const y = Math.min(height - 1, Math.floor(down * height));
      return Array.from(ctx.getImageData(x, y, 1, 1).data);
    });
    return { width, height, pixels };
  }, { data: base64, mimeType: type, fractions: points });
}

// Moves the Quality slider in Export options to its 'low' or 'high' end. A native range input
// ignores the dispatched pointer events a phone target's drags are made of, so the slider is
// moved with the Home and End keys, which change it through the same input event as a drag.
// Kept for other areas' cases that only need a setting changed; the Export cases drag the
// knob (dragQualityTo).
async function moveQualityTo(page, end) {
  const slider = page.locator('#quality');
  await slider.focus();
  await page.keyboard.press(end === 'low' ? 'Home' : 'End');
}

// Drags the Quality slider's knob in Export options from where it rests to one end of its
// track ('low' at the left, 'high' at the right) in one movement, and lets go: a finger on a
// phone target, the mouse on a wide one. The drag is QUALITY_SLIDE_MOVES moves, each a separate
// input event, so the app sees a drag and not a jump. A dispatched pointer doesn't move a
// native slider, so in Chromium a finger goes through the browser's own touch input (the
// DevTools protocol), as a real touch would; WebKit has no such input, so there the mouse
// stands in for the finger. pauseMs: a wait between the moves, for a case that proves what a
// slow drag would do (0 for one smooth movement).
async function dragQualityTo(page, hand, end, pauseMs = 0) {
  const slider = page.locator('#quality');
  // The options sheet may still be rising: measure the slider once it is still.
  await waitForStill(page);
  const box = await slider.boundingBox();
  const fraction = await slider.evaluate(
    input => (input.value - input.min) / (input.max - input.min),
  );
  // The knob's middle is half a knob in from each end of the track at its two ends.
  const knobHalf = SLIDER_KNOB_PX / 2;
  const startX = box.x + knobHalf + fraction * (box.width - 2 * knobHalf);
  const endX = end === 'low'
    ? box.x - QUALITY_PAST_END_PX
    : box.x + box.width + QUALITY_PAST_END_PX;
  const middleY = box.y + box.height / 2;
  const xAtMove = move => startX + (endX - startX) * move / QUALITY_SLIDE_MOVES;
  const isCdpTouch = hand.isTouch && page.context().browser().browserType().name() === 'chromium';
  if (!isCdpTouch) {
    await page.mouse.move(startX, middleY);
    await page.mouse.down();
    for (let move = 1; move <= QUALITY_SLIDE_MOVES; move++) {
      await page.mouse.move(xAtMove(move), middleY);
      if (pauseMs) await page.waitForTimeout(pauseMs);
    }
    await page.mouse.up();
    return;
  }
  const session = await page.context().newCDPSession(page);
  const touch = (type, x) => session.send('Input.dispatchTouchEvent', {
    type,
    touchPoints: type === 'touchEnd' ? [] : [{ x, y: middleY }],
  });
  await touch('touchStart', startX);
  for (let move = 1; move <= QUALITY_SLIDE_MOVES; move++) {
    await touch('touchMove', xAtMove(move));
    if (pauseMs) await page.waitForTimeout(pauseMs);
  }
  await touch('touchEnd', endX);
  await session.detach();
}

// Reads three rows of pixels of a saved image file in the page, at a quarter, a half and three
// quarters of its height. Returns { width, height, rows }: rows[r][x] is the [r, g, b] (0 to 255)
// of the pixel x px from the left in the r-th row.
async function readSavedRows(page, file) {
  const type = MIME_TYPES[path.extname(file).toLowerCase()] || 'image/jpeg';
  const base64 = fs.readFileSync(file).toString('base64');
  return page.evaluate(async ({ data, mimeType, fractions }) => {
    const bytes = Uint8Array.from(atob(data), character => character.charCodeAt(0));
    const bitmap = await createImageBitmap(new Blob([bytes], { type: mimeType }));
    const { width, height } = bitmap;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(bitmap, 0, 0);
    const rows = fractions.map(down => {
      const y = Math.min(height - 1, Math.floor(down * height));
      const pixels = ctx.getImageData(0, y, width, 1).data;
      const row = [];
      for (let x = 0; x < width; x++) row.push(Array.from(pixels.slice(x * 4, x * 4 + 3)));
      return row;
    });
    return { width, height, rows };
  }, { data: base64, mimeType: type, fractions: SAVED_ROW_FRACTIONS });
}

// Waits until the question card (Upscale to N px?) is up (true) or gone (false). Its layer's
// open mark is read, not its hidden, which lags about 200 ms behind a close.
function waitForQuestion(page, isUp) {
  return page.waitForFunction(wanted => {
    const layer = document.getElementById('pairPrompt');
    return (!!layer && window.CF.isAlertOpen(layer)) === wanted;
  }, isUp);
}

// Taps Download once no question card is up, answers the Upscale question with `answer` if it
// is asked, and waits for the file. Returns { question, name, file, bytes }: the question
// card's title ('' when none was asked), the name the app gave the file, the path of the saved
// copy and its size in bytes.
async function downloadAnswering(page, hand, answer = 'No') {
  await waitForQuestion(page, false);
  const downloading = page.waitForEvent('download');
  await hand.tap(page.locator('#btnDownload'));
  const asking = waitForQuestion(page, true).then(() => true, () => false);
  const isAsked = await Promise.race([downloading.then(() => false), asking]);
  let question = '';
  if (isAsked) {
    const card = page.locator('#pairPrompt');
    question = (await card.locator('.alert-title').textContent()).trim();
    await hand.tap(card.getByRole('button', { name: answer, exact: true }));
  }
  const download = await downloading;
  const file = await download.path();
  return { question, name: download.suggestedFilename(), file, bytes: fs.statSync(file).size };
}

// True when two saved files hold the same bytes.
function isSameFile(first, second) {
  return fs.readFileSync(first).equals(fs.readFileSync(second));
}

// Takes away the browser's ability to save WebP, before the app loads, as Safari's is: asked
// for a WebP, a canvas hands back a PNG instead, which is what a browser does with a type it
// can't encode (Playwright's WebKit can save WebP, so it can't stand in for Safari here).
async function takeAwayWebpSaving(page) {
  await page.addInitScript(() => {
    const toBlob = HTMLCanvasElement.prototype.toBlob;
    HTMLCanvasElement.prototype.toBlob = function toBlobWithoutWebp(callback, type, quality) {
      const savedType = type === 'image/webp' ? 'image/png' : type;
      return toBlob.call(this, callback, savedType, quality);
    };
  });
}

// Puts a photo file on the clipboard as a PNG image, as copying it in an image viewer does
// (Chromium, with clipboard permissions granted). It is decoded and re-encoded in the page,
// since a clipboard takes images as PNG.
async function copyPhotoToClipboard(page, file) {
  const base64 = fs.readFileSync(file).toString('base64');
  const type = MIME_TYPES[path.extname(file).toLowerCase()] || 'image/jpeg';
  await page.evaluate(async ({ data, mimeType }) => {
    const bytes = Uint8Array.from(atob(data), character => character.charCodeAt(0));
    const bitmap = await createImageBitmap(new Blob([bytes], { type: mimeType }));
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    canvas.getContext('2d').drawImage(bitmap, 0, 0);
    const png = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': png })]);
  }, { data: base64, mimeType: type });
}

// True when two page rectangles ({ x, y, width, height }) overlap by any area.
function rectsOverlap(first, second) {
  const isApartAcross = first.x + first.width <= second.x || second.x + second.width <= first.x;
  const isApartDown = first.y + first.height <= second.y || second.y + second.height <= first.y;
  return !isApartAcross && !isApartDown;
}

module.exports = {
  SHARE_FAILURE_MESSAGE,
  installShareStandIn,
  recordExports,
  exportStarts,
  sharesSoFar,
  choiceButton,
  selectedChoices,
  readoutText,
  visibleNotes,
  chooseFill,
  toastMessage,
  crossTheCorners,
  downloadExport,
  takeAwayImageClipboard,
  tapRegardless,
  waitForExportEnd,
  waitForShares,
  sharedImageSize,
  readClipboardImage,
  saveFileBy,
  readSavedPixels,
  moveQualityTo,
  dragQualityTo,
  readSavedRows,
  waitForQuestion,
  downloadAnswering,
  isSameFile,
  takeAwayWebpSaving,
  copyPhotoToClipboard,
  rectsOverlap,
};
