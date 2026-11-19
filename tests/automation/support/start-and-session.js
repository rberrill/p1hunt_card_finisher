// Helpers for the start screen and session cases (tests/catalog/start-and-session.md): the file
// picker, waiting for a photo or a Resume, reloading to the start screen, what is saved on the
// device, the toast, files made for a case (a sideways or enlarged copy of a sample, a file that
// isn't an image), and the copies of the photo the app works from.
// They drive the app as a person would and read its state only to check a result.
'use strict';
const fs = require('fs');
const path = require('path');
const { root, samplePath, goToStep } = require('./app.js');

// How long a photo may take to open (an enlarged 48 MP copy is slow in WebKit).
const OPEN_TIMEOUT_MS = 45000;
// How long to wait for the saved session to catch up with the screen.
const SAVE_TIMEOUT_MS = 5000;
// How long the start screen's Resume check is given after the page loads, in ms: it reads the
// device's storage before deciding whether to show the card.
const START_SETTLE_MS = 100;
// The EXIF tag that records how the camera was held (TIFF tag 0x0112).
const ORIENTATION_TAG = 0x0112;
// Bytes from an APP1 segment's start to its TIFF header: marker (2), length (2), "Exif\0\0" (6).
const TIFF_OFFSET = 10;
// Bytes in one TIFF directory entry, and from an entry's start to its value.
const IFD_ENTRY_BYTES = 12;
const IFD_VALUE_OFFSET = 8;
// The JPEG markers read here: the app segment that holds EXIF.
const APP1_MARKER = 0xe1;
// The quality an enlarged copy is saved at, 0 to 1.
const ENLARGED_QUALITY = 0.85;
// Bytes per chunk when a large file crosses from the page as base64.
const BASE64_CHUNK = 0x8000;
// How often waitUntil asks the page again, in ms.
const POLL_MS = 50;

// Waits until an async function run in the page returns a truthy value, asking again every
// POLL_MS until timeoutMs. page.waitForFunction can't do this: it takes the promise an async
// function returns as a truthy value and stops at once.
async function waitUntil(page, pageFunction, argument, timeoutMs, what) {
  const endMs = Date.now() + timeoutMs;
  for (;;) {
    if (await page.evaluate(pageFunction, argument)) return;
    if (Date.now() > endMs) throw new Error(`Waited ${timeoutMs} ms for ${what}`);
    await page.waitForTimeout(POLL_MS);
  }
}

// Taps a control that opens the photo picker and answers the picker: with a sample's name, a
// file payload ({ name, mimeType, buffer }) or null to close it without a file. Returns the
// picker, so a case can read what it asked for.
async function pickWith(page, hand, control, file) {
  await rememberPhoto(page);
  const choosing = page.waitForEvent('filechooser');
  await hand.tap(control);
  const chooser = await choosing;
  let files = [];
  if (typeof file === 'string') files = samplePath(file);
  else if (file) files = file;
  await chooser.setFiles(files);
  return chooser;
}

// Notes the photo that is open now (or none), so that waitForPhoto waits for another one: the
// same file opened again is a new photo too.
async function rememberPhoto(page) {
  await page.evaluate(() => {
    window.testPhotoBefore = window.__straightener.app.img;
  });
}

// Waits until a photo named `name`, other than the one rememberPhoto noted, is open and its card
// detection has finished.
async function waitForPhoto(page, name) {
  await page.waitForFunction(photoName => {
    const app = window.__straightener.app;
    const isNew = !!app.img && app.img !== window.testPhotoBefore;
    const isThisPhoto = isNew && !!app.state && app.state.source.name === photoName;
    const isDetected = app.detection.running > 0 && app.detection.message === '';
    return isThisPhoto && !!app.geometry && isDetected && !app.isSwitching;
  }, name, { timeout: OPEN_TIMEOUT_MS });
}

// Waits until the edits saved on the device match `expected`: any of the record's own fields
// ({ name, tab, exported, width }) and { quarter, hasDraft, draft, isDraftCurrent, corners,
// overlayId }: the quarter turns; whether any Levels change waits; the exact Levels change that
// waits (null for none); with isDraftCurrent true, that the Levels change saved is the one the
// app holds now (null when none waits), so a reload can't restore an earlier draft; the corners;
// and the logo's id in the saved edits.
async function waitForSaved(page, expected) {
  await waitUntil(page, async wanted => {
    const record = await window.__straightener.Session.peek();
    if (!record || !record.state) return false;
    const overlay = record.state.overlay;
    const app = window.__straightener.app;
    const savedDraft = JSON.stringify(record.draft || null);
    const draftNow = JSON.stringify(app.levelsPending ? app.levelsDraft : null);
    const checks = {
      quarter: () => record.state.rotation.quarter === wanted.quarter,
      hasDraft: () => !!record.draft === wanted.hasDraft,
      draft: () => savedDraft === JSON.stringify(wanted.draft),
      isDraftCurrent: () => (savedDraft === draftNow) === wanted.isDraftCurrent,
      corners: () => JSON.stringify(record.state.corners) === JSON.stringify(wanted.corners),
      overlayId: () => (overlay ? overlay.id : null) === wanted.overlayId,
    };
    const matches = key => (checks[key] ? checks[key]() : record[key] === wanted[key]);
    return Object.keys(wanted).every(matches);
  }, expected, SAVE_TIMEOUT_MS, `saved edits ${JSON.stringify(expected)}`);
}

// Waits until the start screen has finished deciding whether to offer Resume.
async function waitForStart(page) {
  await page.waitForFunction(() => !!window.__straightener);
  await page.evaluate(async settleMs => {
    await window.__straightener.Session.peek();
    await new Promise(resolve => setTimeout(resolve, settleMs));
  }, START_SETTLE_MS);
}

// Reloads the page and waits for the start screen to settle.
async function reloadToStart(page) {
  await page.reload();
  await waitForStart(page);
}

// Taps Resume and waits until the saved photo, `name`, is open again.
async function resumeAs(page, hand, name) {
  await rememberPhoto(page);
  await hand.tap(page.locator('#btnResume'));
  await waitForPhoto(page, name);
}

// A logo file from the app's own icons/ folder, as a file payload for a picker.
function logoFile(name) {
  const types = { '.svg': 'image/svg+xml', '.png': 'image/png' };
  const buffer = fs.readFileSync(path.join(root, 'icons', name));
  return { name, mimeType: types[path.extname(name)], buffer };
}

// Adds a logo on the Overlay step with `control` (Add logo or Replace logo) and the icons/
// file `name`, and waits until it is the logo on the photo. Returns the logo's id.
async function addLogo(page, hand, control, name) {
  const before = await page.evaluate(() => {
    const overlay = window.__straightener.app.state.overlay;
    return overlay ? overlay.id : null;
  });
  await pickWith(page, hand, control, logoFile(name));
  await page.waitForFunction(idBefore => {
    const overlay = window.__straightener.app.state.overlay;
    return !!overlay && overlay.id !== idBefore;
  }, before, { timeout: SAVE_TIMEOUT_MS });
  return page.evaluate(() => window.__straightener.app.state.overlay.id);
}

// Makes a front and back pair: on the Export step, taps Add back and chooses the sample
// `backName`, then waits until the back is open and the pair is saved on the device.
async function addBack(page, hand, backName) {
  await goToStep(page, 'export', hand);
  await pickWith(page, hand, page.locator('#btnAddBack'), backName);
  await waitForPhoto(page, backName);
  await waitUntil(page, async name => {
    const Session = window.__straightener.Session;
    const [pair, edits] = await Promise.all([Session.get('pair'), Session.peek()]);
    return !!window.__straightener.app.pair && !!pair && !!edits && edits.name === name;
  }, backName, SAVE_TIMEOUT_MS, 'the pair to be saved');
}

// The toast over the photo: { text, kind, isShown }; kind is 'error', 'warn' or ''.
function toastNow(page) {
  return page.evaluate(() => {
    const toast = document.getElementById('toast');
    if (!toast) return { text: '', kind: '', isShown: false };
    let kind = '';
    if (toast.classList.contains('is-error')) kind = 'error';
    if (toast.classList.contains('is-warn')) kind = 'warn';
    const text = toast.querySelector('.toast-text').textContent;
    return { text, kind, isShown: toast.classList.contains('is-shown') };
  });
}

// One record the app keeps on the device (the IndexedDB store's 'photo', 'edits',
// 'photoOverlay', 'overlay', 'pair' or 'pairPhoto'), or null.
function storedRecord(page, key) {
  return page.evaluate(async recordKey => {
    try {
      const record = await window.__straightener.Session.get(recordKey);
      return record ? JSON.parse(JSON.stringify(record, (name, value) => (
        value instanceof ArrayBuffer ? { bytes: value.byteLength } : value))) : null;
    } catch (error) {
      return null;
    }
  }, key);
}

// Records every write to the device's session store, every file download and every click in
// the page, from before the app loads: window.storageWrites gets { key, atMs, name, tab,
// quarter, exported, format, downloadCount, isInDownloadTask }, window.downloadsAtMs the time of
// each download and window.clicksAtMs the time of each click (a tap ends in a click), all in
// performance.now() ms. downloadCount is how many downloads had started when the write was made;
// isInDownloadTask is true when the write was made in the same turn of the page's work as the
// last download, before the page could do anything else (a timer, an event). They only watch;
// the writes, downloads and clicks go ahead unchanged.
async function watchStorageAndDownloads(page) {
  await page.addInitScript(() => {
    window.storageWrites = [];
    window.downloadsAtMs = [];
    window.clicksAtMs = [];
    window.isDownloadTaskOpen = false;
    document.addEventListener('click', () => window.clicksAtMs.push(performance.now()), true);
    const put = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function watchedPut(value, key) {
      const state = value && value.state;
      window.storageWrites.push({
        key,
        atMs: performance.now(),
        name: value && value.name,
        tab: value && value.tab,
        quarter: state ? state.rotation.quarter : null,
        exported: value && value.exported,
        format: state ? state.export.format : null,
        downloadCount: window.downloadsAtMs.length,
        isInDownloadTask: window.isDownloadTaskOpen,
      });
      return put.call(this, value, key);
    };
    const click = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function watchedClick() {
      if (this.download) {
        window.downloadsAtMs.push(performance.now());
        // A zero timer runs only after the work under way (and its promise steps) is done, so
        // it closes the download's turn.
        window.isDownloadTaskOpen = true;
        setTimeout(() => {
          window.isDownloadTaskOpen = false;
        }, 0);
      }
      return click.call(this);
    };
  });
}

// The writes of `key` made with the last download: in the same turn of the page's work as it
// started, before the page could do anything else (see watchStorageAndDownloads). The app
// starts its save just before the download, and the write itself follows a moment later in that
// same turn; a write the page made in any later turn (a timer's, say) is not among them.
function writesWithLastDownload(page, key) {
  return page.evaluate(recordKey => {
    const downloads = window.downloadsAtMs.length;
    return window.storageWrites.filter(write => write.key === recordKey
      && write.downloadCount === downloads
      && write.isInDownloadTask);
  }, key);
}

// Makes the device refuse to store the session records named in `keys` (such as 'photo' or
// 'edits'), as a full disk would: from before the app loads, a write of one of them throws
// a QuotaExceededError. refuseStorageNow adds a key later.
async function refuseStorage(page, keys) {
  await page.addInitScript(refused => {
    window.refusedStorageKeys = refused;
    const put = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function refusingPut(value, key) {
      if (window.refusedStorageKeys.includes(key)) {
        throw new DOMException('Stand-in: the device storage is full', 'QuotaExceededError');
      }
      return put.call(this, value, key);
    };
  }, keys);
}

// Makes the device refuse the session record `key` from now on (see refuseStorage).
function refuseStorageNow(page, key) {
  return page.evaluate(refusedKey => window.refusedStorageKeys.push(refusedKey), key);
}

// The time of the last click in the page, in performance.now() ms (see
// watchStorageAndDownloads).
function lastClickMs(page) {
  return page.evaluate(() => window.clicksAtMs[window.clicksAtMs.length - 1]);
}

// The time of the last file download in the page, in performance.now() ms.
function lastDownloadMs(page) {
  return page.evaluate(() => window.downloadsAtMs[window.downloadsAtMs.length - 1]);
}

// The writes recorded by watchStorageAndDownloads since `sinceMs`, for one key.
function storageWritesSince(page, key, sinceMs = 0) {
  return page.evaluate(({ recordKey, fromMs }) => window.storageWrites
    .filter(write => write.key === recordKey && write.atMs >= fromMs), {
    recordKey: key,
    fromMs: sinceMs,
  });
}

// The page's clock, in performance.now() ms.
function pageNowMs(page) {
  return page.evaluate(() => performance.now());
}

// Changes one field of the saved edits on the device. There is no way to do this from the
// app's screen; it stands in for a record the app can no longer read as it wrote it.
function changeSavedEdits(page, field, value) {
  return page.evaluate(async ({ name, newValue }) => {
    const Session = window.__straightener.Session;
    const record = await Session.get('edits');
    record[name] = newValue;
    await Session.put('edits', record);
  }, { name: field, newValue: value });
}

// Deletes the saved edits on the device and leaves the saved photo. There is no way to do this
// from the app's screen; it stands in for a browser that cleared part of the site's data.
function deleteSavedEdits(page) {
  return page.evaluate(() => window.__straightener.Session.del('edits'));
}

// Where the orientation value is in a JPEG's EXIF block: { valueAt, isLittleEndian }, with
// valueAt the byte offset, or -1 when the photo records none.
function findOrientation(bytes) {
  let offset = 2;
  while (offset + 4 < bytes.length && bytes[offset] === 0xff) {
    const marker = bytes[offset + 1];
    const length = bytes.readUInt16BE(offset + 2);
    const isExif = bytes.toString('ascii', offset + 4, offset + 8) === 'Exif';
    if (marker === APP1_MARKER && isExif) {
      const tiff = offset + TIFF_OFFSET;
      const isLittleEndian = bytes.toString('ascii', tiff, tiff + 2) === 'II';
      const read16 = position => (isLittleEndian
        ? bytes.readUInt16LE(position)
        : bytes.readUInt16BE(position));
      const read32 = position => (isLittleEndian
        ? bytes.readUInt32LE(position)
        : bytes.readUInt32BE(position));
      const directory = tiff + read32(tiff + 4);
      for (let i = 0; i < read16(directory); i++) {
        const entry = directory + 2 + i * IFD_ENTRY_BYTES;
        if (read16(entry) === ORIENTATION_TAG) {
          return { valueAt: entry + IFD_VALUE_OFFSET, isLittleEndian };
        }
      }
    }
    offset += 2 + length;
  }
  return { valueAt: -1, isLittleEndian: false };
}

// A copy of a sample photo whose recorded camera orientation is `orientation` (EXIF: 6 means
// the picture is shown turned a quarter clockwise). Returns a file payload for the picker.
function sampleWithOrientation(name, orientation, newName) {
  const bytes = Buffer.from(fs.readFileSync(samplePath(name)));
  const { valueAt, isLittleEndian } = findOrientation(bytes);
  if (valueAt < 0) throw new Error(`${name} has no orientation tag to change`);
  if (isLittleEndian) bytes.writeUInt16LE(orientation, valueAt);
  else bytes.writeUInt16BE(orientation, valueAt);
  return { name: newName, mimeType: 'image/jpeg', buffer: bytes };
}

// A sample photo enlarged by `factor` and saved as a JPEG, drawn in the page. Returns a file
// payload for the picker.
async function enlargedSample(page, name, factor, newName) {
  const original = fs.readFileSync(samplePath(name)).toString('base64');
  const base64 = await page.evaluate(async ({ data, scale, quality, chunk }) => {
    const bytes = Uint8Array.from(atob(data), character => character.charCodeAt(0));
    const bitmap = await createImageBitmap(new Blob([bytes], { type: 'image/jpeg' }));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
    canvas.width = 0;
    const output = new Uint8Array(await blob.arrayBuffer());
    let binary = '';
    for (let i = 0; i < output.length; i += chunk) {
      binary += String.fromCharCode.apply(null, output.subarray(i, i + chunk));
    }
    return btoa(binary);
  }, { data: original, scale: factor, quality: ENLARGED_QUALITY, chunk: BASE64_CHUNK });
  return { name: newName, mimeType: 'image/jpeg', buffer: Buffer.from(base64, 'base64') };
}

// Makes the photo file named `fileName` slow to load, as a large photo is on a phone: from
// before the app loads, the browser's decoding of that file (createImageBitmap) resolves
// `delayMs` later than it would. Other files decode as usual.
async function slowDecodeOf(page, fileName, delayMs) {
  await page.addInitScript(({ name, waitMs }) => {
    const decode = window.createImageBitmap;
    window.createImageBitmap = function slowDecode(source, ...rest) {
      const decoding = decode.call(window, source, ...rest);
      if (!(source instanceof File) || source.name !== name) return decoding;
      return new Promise(resolve => setTimeout(resolve, waitMs)).then(() => decoding);
    };
  }, { name: fileName, waitMs: delayMs });
}

// A file that is not an image: tests/fixtures/not-a-photo.JPEG, a line of text named like a
// photo, as a file payload for the picker. It stands in for a broken or wrongly named file.
function notAPhoto() {
  return {
    name: 'not-a-photo.JPEG',
    mimeType: 'image/jpeg',
    buffer: fs.readFileSync(path.join(root, 'tests', 'fixtures', 'not-a-photo.JPEG')),
  };
}

// A stand-in for a HEIC photo in a browser that can't decode HEIC: a file named card.HEIC, of
// the HEIC type, whose bytes no browser decodes (the same bytes as tests/fixtures/card.HEIC,
// made here so the case doesn't depend on that file being present). Returns a file payload for
// the picker.
function heicStandIn() {
  return {
    name: 'card.HEIC',
    mimeType: 'image/heic',
    buffer: Buffer.from('Stand-in for a HEIC photo: no browser decodes these bytes.\n'),
  };
}

// The source line near the foot of Export options ("Source 1498 × 2098 px (3.1 MP) · …").
function sourceLine(page) {
  return page.locator('#sourceInfo').textContent();
}

// The long side, in px, of each copy the app works from: { preview, thumb, work } (the photo on
// screen, the live preview while dragging and card detection).
function copyLongSides(page) {
  return page.evaluate(() => {
    const app = window.__straightener.app;
    const longSide = copy => Math.max(copy.data.width, copy.data.height);
    return {
      preview: longSide(app.preview),
      thumb: longSide(app.thumb),
      work: longSide(app.work),
    };
  });
}

// The photo on screen as the app decoded it, read from its preview copy: { width, height,
// cells }, its size in px and the mean [r, g, b] (0 to 255) of each cell of a cellsPerSide x
// cellsPerSide grid laid over it, row by row from the top-left.
function previewCells(page, cellsPerSide) {
  return page.evaluate(gridSize => {
    const { data } = window.__straightener.app.preview;
    const { width, height } = data;
    // Each cell's running totals: red, green, blue, then the pixel count.
    const sums = Array.from({ length: gridSize * gridSize }, () => [0, 0, 0, 0]);
    for (let y = 0; y < height; y++) {
      const cellRow = Math.floor(y * gridSize / height);
      for (let x = 0; x < width; x++) {
        const sum = sums[cellRow * gridSize + Math.floor(x * gridSize / width)];
        const offset = (y * width + x) * 4;
        for (let channel = 0; channel < 3; channel++) sum[channel] += data.data[offset + channel];
        sum[3] += 1;
      }
    }
    const cells = sums.map(sum => sum.slice(0, 3).map(total => total / sum[3]));
    return { width, height, cells };
  }, cellsPerSide);
}

module.exports = {
  slowDecodeOf,
  notAPhoto,
  heicStandIn,
  sourceLine,
  copyLongSides,
  previewCells,
  waitUntil,
  pickWith,
  rememberPhoto,
  waitForPhoto,
  waitForSaved,
  waitForStart,
  reloadToStart,
  resumeAs,
  addBack,
  logoFile,
  addLogo,
  toastNow,
  storedRecord,
  watchStorageAndDownloads,
  writesWithLastDownload,
  storageWritesSince,
  refuseStorage,
  refuseStorageNow,
  lastClickMs,
  lastDownloadMs,
  pageNowMs,
  changeSavedEdits,
  deleteSavedEdits,
  sampleWithOrientation,
  enlargedSample,
};
