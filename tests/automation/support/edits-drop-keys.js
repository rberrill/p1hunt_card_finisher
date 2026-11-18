// Helpers for the edits-file, drop-and-paste and keyboard cases (tests/automation/
// edits-files.spec.js, drop-and-paste.spec.js and keyboard.spec.js): saving and loading an
// edits file through Export options, edits files changed or made in the test, files dropped on
// the page with a DataTransfer (the committed ones in tests/fixtures/ among them), images put
// on the clipboard for a paste, an export held open so a case can act while it runs, the
// question box, and the messages the toast shows.
// They drive the app as a person would and read its state only to check a result. The few that
// change the page's code say why: no control can do it.
'use strict';
const fs = require('fs');
const path = require('path');
const {
  samplePath,
  openApp,
  openPhoto,
  goToStep,
  handFor,
  openOptions,
  closeOptions,
} = require('./app.js');
const { saveFileBy } = require('./export.js');
const { expect } = require('./case.js');

// The photo most cases use: a PSA slab, 1498 × 2098 px.
const PHOTO = 'IMG_9136.JPEG';
// Another photo of exactly the same size, with another name.
const SAME_SIZE_PHOTO = 'IMG_9060.JPEG';
// A photo of another size: 1536 × 2048 px.
const OTHER_SIZE_PHOTO = 'IMG_9075.JPEG';
// How long a message may take to show after a file is chosen or dropped.
const MESSAGE_TIMEOUT_MS = 10000;
// Bytes per chunk when a file made in the page crosses back as base64.
const BASE64_CHUNK = 0x8000;
// The image types a file can have, by its extension (for files built from samples).
const MIME_TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};

// Opens the app (at `address`, which may carry settings from a link) with the case's photo and
// goes to a step (Export unless `step` names another). Returns the hand for this target.
async function startOn(page, testInfo, { step = 'export', photo = PHOTO, address } = {}) {
  await openApp(page, address);
  await openPhoto(page, photo);
  const hand = handFor(page, testInfo);
  await goToStep(page, step, hand);
  return hand;
}

// On the Export step: opens Export options, taps Save edits and waits for the file, then closes
// the options again on a phone. The saved copy is kept in the case's own output folder under
// the name the app gave it. Returns { name, file, edits }: that name, the kept copy's path and
// the file's content read as JSON.
async function saveEdits(page, hand, testInfo) {
  await openOptions(page, hand, 'export');
  const saved = await saveFileBy(page, hand, page.locator('#btnSaveEdits'));
  await closeOptions(page, hand, 'export');
  const file = testInfo.outputPath(saved.name);
  fs.copyFileSync(saved.file, file);
  return { name: saved.name, file, edits: JSON.parse(fs.readFileSync(file, 'utf8')) };
}

// On the Export step: opens Export options, taps Load edits and chooses `file` in the picker
// that opens (a path, or a payload { name, mimeType, buffer }), then closes the options on a
// phone. Returns the picker, so a case can read what it asked for. It does not wait for the
// file to be applied: the case waits for what it expects.
// A file named by its path is handed over with its bytes: given only the path, Chromium reads
// the file from disk when the app asks for its text, and a just-written file can be locked for
// a moment (a virus scan), which the app reports as a file that isn't JSON.
async function loadEdits(page, hand, file) {
  const payload = typeof file === 'string'
    ? { name: path.basename(file), mimeType: 'application/json', buffer: fs.readFileSync(file) }
    : file;
  await openOptions(page, hand, 'export');
  const choosing = page.waitForEvent('filechooser');
  await hand.tap(page.locator('#btnLoadEdits'));
  const chooser = await choosing;
  await chooser.setFiles(payload);
  await closeOptions(page, hand, 'export');
  return chooser;
}

// Writes an edits file made or changed in the test to the case's output folder, laid out as
// the app lays one out. Returns its path.
function writeEdits(testInfo, name, edits) {
  const file = testInfo.outputPath(name);
  fs.writeFileSync(file, JSON.stringify(edits, null, 2));
  return file;
}

// A copy of an edits object, to change for a case without touching the original.
const copyOf = edits => JSON.parse(JSON.stringify(edits));

// Waits until the app's edits match `expected`, a few fields picked out of the edit state:
// { quarter, fine, format, preset, hasLogo } (any of them).
function waitForEdits(page, expected) {
  return page.waitForFunction(wanted => {
    const state = window.__straightener.app.state;
    const now = {
      quarter: state.rotation.quarter,
      fine: state.rotation.fine,
      format: state.export.format,
      preset: state.crop.preset,
      hasLogo: !!state.overlay,
    };
    return Object.keys(wanted).every(key => now[key] === wanted[key]);
  }, expected, { timeout: MESSAGE_TIMEOUT_MS });
}

// Starts recording every message the toast shows, as [{ text, kind }] (kind: 'error', 'warn'
// or ''), from before the app loads. Each time the toast rises counts, even with the same words
// as the last, and so does a message replaced by another in the same moment, which a person
// would see only as a flicker. The toast is built when it is first needed, so the whole page
// is watched for it.
function recordMessages(page) {
  return page.addInitScript(() => {
    window.testMessages = [];
    const isToast = node => !!node && node.id === 'toast';
    const kindOf = className => {
      if (/\bis-error\b/.test(className)) return 'error';
      if (/\bis-warn\b/.test(className)) return 'warn';
      return '';
    };
    const isShownIn = className => /\bis-shown\b/.test(className || '');
    let text = '';
    const onChanges = changes => {
      const toast = document.getElementById('toast');
      const classChanges = changes.filter(change => (
        change.type === 'attributes' && isToast(change.target)));
      // The class after each change: the next change's old value, or the class now.
      const classAfter = change => {
        const next = classChanges[classChanges.indexOf(change) + 1];
        return next ? next.oldValue : toast.className;
      };
      for (const change of changes) {
        const isText = change.type === 'childList'
          && change.target.classList
          && change.target.classList.contains('toast-text')
          && isToast(change.target.parentElement);
        // Each new message is a new text node, so it still holds the words set at that moment.
        if (isText) text = change.addedNodes.length ? change.addedNodes[0].textContent : '';
        if (!classChanges.includes(change)) continue;
        const after = classAfter(change);
        if (!isShownIn(change.oldValue) && isShownIn(after)) {
          window.testMessages.push({ text, kind: kindOf(after) });
        }
      }
    };
    document.addEventListener('DOMContentLoaded', () => {
      new MutationObserver(onChanges).observe(document.body, {
        attributes: true,
        attributeFilter: ['class'],
        attributeOldValue: true,
        childList: true,
        subtree: true,
      });
    });
  });
}

// The messages recordMessages has seen so far: [{ text, kind }].
const messagesSoFar = page => page.evaluate(() => window.testMessages.slice());

// The toast over the photo now: { text, kind, isShown }; kind is 'error', 'warn' or ''.
function toastNow(page) {
  return page.evaluate(() => {
    const toast = document.getElementById('toast');
    let kind = '';
    if (toast.classList.contains('is-error')) kind = 'error';
    if (toast.classList.contains('is-warn')) kind = 'warn';
    const text = toast.querySelector('.toast-text').textContent;
    return { text, kind, isShown: toast.classList.contains('is-shown') };
  });
}

// Waits until the toast shows a message and returns it ({ text, kind }).
async function waitForToast(page) {
  await page.locator('#toast.is-shown').waitFor({ timeout: MESSAGE_TIMEOUT_MS });
  return toastNow(page);
}

// The folder of files the drop and paste cases name, other than the sample photos.
const FIXTURES = path.resolve(__dirname, '../../fixtures');
// The type a dragged file carries, by its extension. A HEIC file carries none, as some systems
// hand one over; only its name says what it is.
const DROPPED_TYPES = {
  '.txt': 'text/plain',
  '.png': 'image/png',
  '.heic': '',
};

// A file in tests/fixtures/ as a dragged file's payload ({ name, mimeType, buffer }), with the
// type its extension gives, or `mimeType` when one is passed ('' for none).
function droppedFixture(name, mimeType = null) {
  const type = mimeType === null ? DROPPED_TYPES[path.extname(name).toLowerCase()] : mimeType;
  return { name, mimeType: type, buffer: fs.readFileSync(path.join(FIXTURES, name)) };
}

// A sample photo as a file payload ({ name, mimeType, buffer }), under its own name or `name`.
function sampleFile(sampleName, name = sampleName) {
  const mimeType = MIME_TYPES[path.extname(sampleName).toLowerCase()] || 'image/jpeg';
  return { name, mimeType, buffer: fs.readFileSync(samplePath(sampleName)) };
}

// Sends the drag events of a file dragged from the computer onto the element `selector`
// names, carrying `files` (payloads { name, mimeType, buffer }) in a DataTransfer, as the
// browser sends them for a real drag. stage: 'over' (the file is held over the element),
// 'leave' (it is held over, then taken away) or 'drop' (held over, then let go).
// Returns { overPrevented, dropPrevented, dropEffect }: whether the page took the drag over and
// the drop for itself (when it doesn't, the browser opens the file in place of the app), and
// the drop effect it set (the cursor: 'none' is the no-drop cursor).
async function dragFiles(page, selector, files, stage = 'drop') {
  const encoded = files.map(file => ({
    name: file.name,
    type: file.mimeType,
    data: file.buffer.toString('base64'),
  }));
  return page.evaluate(({ targetSelector, payloads, dragStage }) => {
    const transfer = new DataTransfer();
    for (const payload of payloads) {
      const bytes = Uint8Array.from(atob(payload.data), character => character.charCodeAt(0));
      transfer.items.add(new File([bytes], payload.name, { type: payload.type }));
    }
    const target = document.querySelector(targetSelector);
    const box = target.getBoundingClientRect();
    const send = type => {
      const event = new DragEvent(type, {
        dataTransfer: transfer,
        bubbles: true,
        cancelable: true,
        clientX: box.left + box.width / 2,
        clientY: box.top + box.height / 2,
      });
      target.dispatchEvent(event);
      return event.defaultPrevented;
    };
    send('dragenter');
    const overPrevented = send('dragover');
    const dropEffect = transfer.dropEffect;
    let dropPrevented = false;
    if (dragStage === 'leave') send('dragleave');
    if (dragStage === 'drop') dropPrevented = send('drop');
    return { overPrevented, dropPrevented, dropEffect };
  }, { targetSelector: selector, payloads: encoded, dragStage: stage });
}

// The drop outline over the photo area now: { isShown, caption, border }: whether it shows,
// the caption it writes and its border (width, style and color).
function dropOutline(page) {
  return page.evaluate(() => {
    const stage = document.getElementById('stage');
    const outline = getComputedStyle(stage, '::after');
    const isShown = stage.classList.contains('drag-over') && outline.content !== 'none';
    return {
      isShown,
      caption: isShown ? outline.content.replace(/^"|"$/g, '') : '',
      border: `${outline.borderTopWidth} ${outline.borderTopStyle} ${outline.borderTopColor}`,
    };
  });
}

// Puts an image file (a payload { name, mimeType, buffer }) on the clipboard as a PNG, as an
// image viewer's Copy does (Chromium, with clipboard permissions granted). It is decoded and
// re-encoded in the page, since a clipboard takes images as PNG.
async function copyImage(page, file) {
  await page.evaluate(async ({ data, mimeType }) => {
    const bytes = Uint8Array.from(atob(data), character => character.charCodeAt(0));
    const bitmap = await createImageBitmap(new Blob([bytes], { type: mimeType }));
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    canvas.getContext('2d').drawImage(bitmap, 0, 0);
    const png = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': png })]);
  }, { data: file.buffer.toString('base64'), mimeType: file.mimeType });
}

// Puts a line of text on the clipboard (Chromium, with clipboard permissions granted).
function copyText(page, text) {
  return page.evaluate(line => navigator.clipboard.writeText(line), text);
}

// Lets a case read and write the clipboard. Only Chromium lets a test do that, so the case is
// skipped elsewhere.
async function allowClipboard(context, browserName, test) {
  test.skip(browserName !== 'chromium', 'Only Chromium lets a test use the clipboard');
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
}

// Holds every export's encoding (the last part of making the file) until releaseEncoding is
// called, so a case can act while an export runs. A real export lasts well under a second on
// this machine, too short to act in, and no control can slow it, so this one change is made in
// the page's code.
function holdEncoding(page) {
  return page.evaluate(() => {
    const toBlob = HTMLCanvasElement.prototype.toBlob;
    window.testEncodingHeld = new Promise(resolve => {
      window.testReleaseEncoding = resolve;
    });
    HTMLCanvasElement.prototype.toBlob = function toBlobOnceReleased(...args) {
      window.testEncodingHeld.then(() => toBlob.apply(this, args));
    };
  });
}

// Lets the encodings holdEncoding held go on.
function releaseEncoding(page) {
  return page.evaluate(() => window.testReleaseEncoding());
}

// Waits until an export is running (true) or none is (false).
function waitForExporting(page, isRunning) {
  return page.waitForFunction(wanted => !!window.__straightener.app.exporting === wanted,
    isRunning);
}

// Whether a running export's progress line shows now, on the top edge of the controls or of
// an open sheet. A line that is fading out (is-done) belongs to an export that has ended, so
// it doesn't count.
function isProgressShown(page) {
  return page.evaluate(() => [...document.querySelectorAll('.progress-line')].some(line => (
    !line.hidden
    && !line.classList.contains('is-done')
    && line.getBoundingClientRect().width > 0)));
}

// The question box's title now, or '' when none is up.
function questionTitle(page) {
  return page.evaluate(() => {
    const layer = document.getElementById('pairPrompt');
    if (!layer || !window.CF.isAlertOpen(layer)) return '';
    return layer.querySelector('.alert-title').textContent;
  });
}

// From the Export step at 2000: holds the export's encoding, taps Download and checks the
// question box asks "Upscale to 2000 px?", taps No and checks the export runs, with its progress
// line. These are a case's rows, so each is checked with `check` (the case's check fixture).
// releaseHeldExport lets the export finish.
async function startHeldExport(page, hand, check) {
  await holdEncoding(page);
  await hand.tap(page.locator('#btnDownload'));
  await check('the question box asks "Upscale to 2000 px?"', async () => {
    await expect.poll(() => questionTitle(page)).toBe('Upscale to 2000 px?');
  });
  await hand.tap(page.locator('#pairPrompt').getByRole('button', { name: 'No', exact: true }));
  await check('the export runs: a progress line crosses the top edge of the controls',
    async () => {
      await waitForExporting(page, true);
      // The line has no width until the export's first part is drawn and a frame has passed,
      // so it is waited for, not read once.
      await expect.poll(() => isProgressShown(page)).toBe(true);
    });
}

// Lets an export startHeldExport held finish and waits until it has.
async function releaseHeldExport(page) {
  await releaseEncoding(page);
  await waitForExporting(page, false);
}

// A logo of random colored pixels drawn in the page and saved as a PNG, `sidePx` square. Noise
// doesn't compress, so the file is about 4 bytes per pixel: a 200 px logo is about 160 KB.
// Returns a payload { name, mimeType, buffer }.
async function noisyLogo(page, name, sidePx) {
  const base64 = await page.evaluate(async ({ side, chunk }) => {
    const canvas = document.createElement('canvas');
    canvas.width = side;
    canvas.height = side;
    const ctx = canvas.getContext('2d');
    const image = ctx.createImageData(side, side);
    for (let i = 0; i < image.data.length; i++) {
      image.data[i] = (i % 4 === 3) ? 255 : Math.floor(Math.random() * 256);
    }
    ctx.putImageData(image, 0, 0);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let binary = '';
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    return btoa(binary);
  }, { side: sidePx, chunk: BASE64_CHUNK });
  return { name, mimeType: 'image/png', buffer: Buffer.from(base64, 'base64') };
}

// The most Tab presses tabTo makes before giving up: more than the controls on any screen.
const TAB_PRESSES_MAX = 80;

// Presses Tab until the keyboard focus is on the element `selector` names (or inside it, for a
// wrapper such as a slider's), as a person tabs through the page to reach a control. Returns
// how many presses it took.
async function tabTo(page, selector) {
  for (let presses = 1; presses <= TAB_PRESSES_MAX; presses++) {
    await page.keyboard.press('Tab');
    const isThere = await page.evaluate(wanted => {
      const target = document.querySelector(wanted);
      return !!target && target.contains(document.activeElement);
    }, selector);
    if (isThere) return presses;
  }
  throw new Error(`Tab never reached ${selector}`);
}

// The keyboard focus ring of an element, or of the element focus is in: its outline as
// { width, style, color } (CSS values), read from the element `selector` names.
function focusRingOf(page, selector) {
  return page.evaluate(wanted => {
    const style = getComputedStyle(document.querySelector(wanted));
    return { width: style.outlineWidth, style: style.outlineStyle, color: style.outlineColor };
  }, selector);
}

// How many steps Undo and Redo can take now: { undo, redo }.
function historySteps(page) {
  return page.evaluate(() => ({
    undo: window.CF.History.undo.length,
    redo: window.CF.History.redo.length,
  }));
}

module.exports = {
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
  toastNow,
  waitForToast,
  sampleFile,
  droppedFixture,
  dragFiles,
  dropOutline,
  copyImage,
  copyText,
  allowClipboard,
  holdEncoding,
  releaseEncoding,
  waitForExporting,
  isProgressShown,
  questionTitle,
  startHeldExport,
  releaseHeldExport,
  noisyLogo,
  tabTo,
  focusRingOf,
  historySteps,
};
