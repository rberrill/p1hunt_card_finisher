// Helpers for front and back pairs, made the way a person makes one: Export, then Add back,
// choosing the back photo in the file picker that Add back opens. Other areas that need a pair
// can use makePair (and switchTo to change sides).
// Like support/app.js, they act through the app's controls and read its state (through
// window.__straightener and CF) only to wait for a result or to check one. The few that act
// through the page's code say why: there is no control a person could use for it.
'use strict';
const fs = require('fs');
const path = require('path');
const {
  samplePath,
  openApp,
  openPhoto,
  goToStep,
  handFor,
  middleOf,
  waitInPage,
  crossTheCorners,
} = require('./app.js');

// How long a side may take to open (and, for a new photo, be detected) before a case gives up.
const SIDE_TIMEOUT_MS = 20000;
// How long a case waits for its downloads before giving up.
const DOWNLOAD_TIMEOUT_MS = 20000;
// How long to wait for a question card to show before deciding none was asked.
const QUESTION_WAIT_MS = 1500;
// The pointer ids of the two dispatched fingers of a pinch: any numbers a real pointer is
// unlikely to have.
const PINCH_FINGER_IDS = [11, 12];
// A pinch's fingers start this far apart and end this far apart, in CSS px: about 2.5x.
const PINCH_START_GAP_PX = 60;
const PINCH_END_GAP_PX = 150;
// How many moves a pinch is split into, so the app sees a gesture and not a jump.
const PINCH_MOVES = 8;
// One mouse wheel roll away from the person, in wheel delta px (negative zooms in).
const WHEEL_ZOOM_IN_PX = -400;

// The two sample pairs: portrait cards side by side, landscape cards stacked.
const PORTRAIT_PAIR = {
  front: '14_front_portrait_raw_white.JPEG',
  back: '14_back_portrait_raw_white.JPEG',
};
const LANDSCAPE_PAIR = {
  front: '13_front_landscape_onetouch_labeled_white.JPEG',
  back: '13_back_landscape_onetouch_labeled_white.JPEG',
};

// Taps a control that opens a file picker (Open, Add back, Next card, a logo, Load edits) and
// chooses the file at `filePath` in it, as a person would. Returns once the picker has handed
// it over.
async function chooseFile(page, hand, control, filePath) {
  const choosing = page.waitForEvent('filechooser');
  await hand.tap(control);
  const chooser = await choosing;
  await chooser.setFiles(filePath);
}

// chooseFile for a photo in samples/, by its file name.
function chooseInPicker(page, hand, control, name) {
  return chooseFile(page, hand, control, samplePath(name));
}

// Writes a file named like a photo that holds text, so no browser can read it as an image.
// Returns its path (in the case's own output folder).
function unreadablePhoto(testInfo) {
  const file = testInfo.outputPath('not-a-photo.jpg');
  fs.writeFileSync(file, 'This is text, not a photo.');
  return file;
}

// Waits until a photo named `name` is open, nothing is opening, and detection for it has
// finished. side: 'front' or 'back' to wait for that side of a pair; null for a single photo.
async function waitForPhoto(page, name, side = null) {
  await page.waitForFunction(({ wantedSide, photoName }) => {
    const app = window.__straightener.app;
    const isRightSide = wantedSide
      ? !!app.pair && app.pair.current === wantedSide
      : !app.pair;
    const isOpen = isRightSide
      && !app.isSwitching
      && !!app.state
      && app.state.source.name === photoName
      && !!app.geometry;
    // detection.running counts the runs started for this photo; a finished run clears message.
    return isOpen && app.detection.running > 0 && app.detection.message === '';
  }, { wantedSide: side, photoName: name }, { timeout: SIDE_TIMEOUT_MS });
}

// waitForPhoto for one side of a pair.
function waitForSide(page, side, name) {
  return waitForPhoto(page, name, side);
}

// From a single open photo: goes to Export, taps Add back and chooses `backName`. Returns once
// the back is open and detected (the app opens it on Perspective).
async function addBack(page, hand, backName) {
  await goToStep(page, 'export', hand);
  await chooseInPicker(page, hand, page.locator('#btnAddBack'), backName);
  await waitForSide(page, 'back', backName);
}

// Opens the app, opens `photos.front` and adds `photos.back` with Add back (PORTRAIT_PAIR by
// default). address: the page to open, for a link with settings in it. Returns the hand for
// this target. The back is open, on Perspective.
//   const hand = await makePair(page, testInfo);
async function makePair(page, testInfo, photos = PORTRAIT_PAIR, address = 'index.html') {
  const hand = handFor(page, testInfo);
  await openApp(page, address);
  await openPhoto(page, photos.front);
  await addBack(page, hand, photos.back);
  return hand;
}

// The Front | Back switch's choice for `side`.
const sideButton = (page, side) => page.locator(`#sideSwitch .segment[data-value="${side}"]`);

// Taps Front or Back in the top bar and waits until that side is open and any detection it
// runs (a side brought back by Resume detects on its first switch) has finished.
async function switchTo(page, hand, side) {
  await hand.tap(sideButton(page, side));
  await page.waitForFunction(wanted => {
    const app = window.__straightener.app;
    const isOpen = !!app.pair && app.pair.current === wanted && !app.isSwitching;
    return isOpen && app.detection.message === '';
  }, side, { timeout: SIDE_TIMEOUT_MS });
}

// The open side ('front' or 'back'), or null when no pair is open.
function openSide(page) {
  return page.evaluate(() => {
    const pair = window.__straightener.app.pair;
    return pair ? pair.current : null;
  });
}

// Holds the next photo the app reads (a side switch, the back after Add back) until
// releaseOpening is called, so a case can look at the screen while a side is opening. A real
// read takes a few tens of milliseconds, too short to look at, and no control can slow it, so
// this one change is made in the page's code.
function holdNextOpening(page) {
  return page.evaluate(() => {
    const source = window.CF.ImageSource;
    const load = source.load;
    window.testOpeningHeld = new Promise(resolve => {
      window.testReleaseOpening = resolve;
    });
    source.load = async function loadOnceReleased(...args) {
      source.load = load;
      await window.testOpeningHeld;
      return load.apply(source, args);
    };
  });
}

// Lets the read that holdNextOpening held go on.
function releaseOpening(page) {
  return page.evaluate(() => window.testReleaseOpening());
}

// Waits until a side is opening (the read is held by holdNextOpening).
function waitForOpening(page) {
  return page.waitForFunction(() => !!window.__straightener.app.isSwitching);
}

// Taps a save button (Download by default) and collects `count` downloads, answering the
// Upscale question with `upscaleAnswer` if it is asked. Returns [{ name, file, atMs }] in the
// order they arrived: the name the app gave each, the path of the saved copy, and when it
// arrived (ms on this machine's clock).
async function downloadAll(page, hand, count, upscaleAnswer = 'No', button = '#btnDownload') {
  const arrived = [];
  const onDownload = download => arrived.push({ download, atMs: Date.now() });
  page.on('download', onDownload);
  try {
    await hand.tap(page.locator(button));
    const card = page.locator('#pairPrompt');
    const isAsked = await card.waitFor({ state: 'visible', timeout: QUESTION_WAIT_MS })
      .then(() => true, () => false);
    if (isAsked) {
      await hand.tap(card.getByRole('button', { name: upscaleAnswer, exact: true }));
    }
    const deadline = Date.now() + DOWNLOAD_TIMEOUT_MS;
    while (arrived.length < count && Date.now() < deadline) await page.waitForTimeout(50);
  } finally {
    page.off('download', onDownload);
  }
  if (arrived.length < count) {
    throw new Error(`Expected ${count} downloads, ${arrived.length} arrived`);
  }
  const saved = [];
  for (const { download, atMs } of arrived) {
    saved.push({ name: download.suggestedFilename(), file: await download.path(), atMs });
  }
  return saved;
}

// Picks Together or Separately ('together' | 'separately') beside the size line on Export.
async function chooseOutput(page, hand, output) {
  await hand.tap(page.locator(`#pairOutput .segment[data-value="${output}"]`));
  await page.waitForFunction(wanted => window.__straightener.app.pairOutput === wanted, output);
}

// Picks a Size on Export: '1080', '2000', '3000' or '0' (Original).
function chooseSize(page, hand, size) {
  return hand.tap(page.locator(`#exportSize .segment[data-value="${size}"]`));
}

// A stored session record, read back from the app's storage (IndexedDB). key: 'pair' (the
// pair's own record), 'edits', 'photo' or 'pairPhoto'. A photo record comes back as
// { name, type, bytes } (bytes: its length), the others as they are; undefined when none.
function storedRecord(page, key) {
  return page.evaluate(async recordKey => {
    const record = await window.CF.Session.get(recordKey);
    if (!record || !(record.buf instanceof ArrayBuffer)) return record;
    return { name: record.name, type: record.type, bytes: record.buf.byteLength };
  }, key);
}

// Waits until the pair is stored for Resume as it is on screen: the pair's record names the
// open side and holds the waiting side's edits, the waiting side's photo is stored, and the
// stored photo and edits are the open side's, edits and step and all. A person would wait a
// moment before closing the page; this waits for exactly that moment.
async function waitUntilPairStored(page) {
  await waitInPage(page, async () => {
    const app = window.__straightener.app;
    const session = window.CF.Session;
    const [pair, pairPhoto, edits, photo] = await Promise.all([
      session.get('pair'),
      session.get('pairPhoto'),
      session.get('edits'),
      session.get('photo'),
    ]);
    return !!pair
      && !!app.pair
      && pair.current === app.pair.current
      && JSON.stringify(pair.other.edits.state) === JSON.stringify(app.pair.other.state)
      && !!pairPhoto
      && pairPhoto.name === app.pair.other.name
      && !!edits
      && JSON.stringify(edits.state) === JSON.stringify(app.state)
      && edits.tab === app.tab
      && !!photo
      && photo.name === app.img.name;
  });
}

// Waits until a single photo is stored for Resume as it is on screen (its photo, its edits and
// the step it is on) and no pair is stored. The step is saved a moment after a step change,
// apart from the edits, so a wait on the edits alone can end before it.
async function waitUntilSingleStored(page) {
  await waitInPage(page, async () => {
    const app = window.__straightener.app;
    const session = window.CF.Session;
    const [pair, edits, photo] = await Promise.all([
      session.get('pair'),
      session.get('edits'),
      session.get('photo'),
    ]);
    return !pair
      && !!edits
      && JSON.stringify(edits.state) === JSON.stringify(app.state)
      && edits.tab === app.tab
      && !!photo
      && photo.name === app.img.name;
  });
}

// Reloads the page and waits for the start screen's Resume prompt.
async function reloadToResume(page) {
  await page.reload();
  await page.waitForFunction(() => !!window.__straightener);
  await page.locator('#btnResume').waitFor({ state: 'visible' });
}

// Taps Resume and waits until the photo `name` is open (as `side` of a pair, or alone when
// side is null) and its detection has finished.
async function resume(page, hand, name, side) {
  await hand.tap(page.locator('#btnResume'));
  await waitForPhoto(page, name, side);
}

// The toast over the photo: a locator for it while it shows (its copy fading out is not it).
const shownToast = page => page.locator('#toast.is-shown');

// The Together | Separately readout's sizes as numbers: [[width, height]] for Together, or
// [[frontWidth, frontHeight], [backWidth, backHeight]] for Separately.
async function readoutSizes(page) {
  const text = await page.locator('#exportReadout').textContent();
  return [...text.matchAll(/(\d+) × (\d+)/g)].map(match => [Number(match[1]), Number(match[2])]);
}

// The image types a saved file can have, by its extension.
const MIME_TYPES = { '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };

// Reads a saved image file in the page and averages the given rectangles of it. rects:
// [{ x, y, width, height }] in the image's px. Returns { width, height, means }: its size and
// each rectangle's mean [r, g, b] (0 to 255).
async function regionMeans(page, file, rects) {
  const type = MIME_TYPES[path.extname(file).toLowerCase()] || 'image/jpeg';
  const base64 = fs.readFileSync(file).toString('base64');
  return page.evaluate(async ({ data, mimeType, regions }) => {
    const bytes = Uint8Array.from(atob(data), character => character.charCodeAt(0));
    const bitmap = await createImageBitmap(new Blob([bytes], { type: mimeType }));
    const { width, height } = bitmap;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(bitmap, 0, 0);
    const means = regions.map(rect => {
      const pixels = ctx.getImageData(rect.x, rect.y, rect.width, rect.height).data;
      const sums = [0, 0, 0];
      for (let offset = 0; offset < pixels.length; offset += 4) {
        for (let channel = 0; channel < 3; channel++) sums[channel] += pixels[offset + channel];
      }
      return sums.map(sum => sum / (pixels.length / 4));
    });
    return { width, height, means };
  }, { data: base64, mimeType: type, regions: rects });
}

// Puts a stand-in for the browser's share sheet in the page before it loads (call it before
// openApp or makePair): the browser says it can share files, and each share records what it
// was handed in window.testShared, as [{ names, types }], instead of opening a sheet. A case
// may not open a real share sheet on a desktop browser (Rich's decision); the real sheet is
// for a person on an iPhone.
function standInShareSheet(page) {
  return page.addInitScript(() => {
    window.testShared = [];
    Object.defineProperty(navigator, 'canShare', { value: () => true, configurable: true });
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: async ({ files }) => {
        window.testShared.push({
          names: files.map(file => file.name),
          types: files.map(file => file.type),
        });
      },
    });
  });
}

// What the share stand-in was handed: [{ names, types }], one per share.
const sharedFiles = page => page.evaluate(() => window.testShared);

// Puts a stand-in for the clipboard in the page before it loads (call it before openApp or
// makePair): a copied image is decoded and recorded in window.testCopied as
// { type, width, height }. A real clipboard write needs a permission a test run can't grant
// in every browser.
function standInClipboard(page) {
  return page.addInitScript(() => {
    window.testCopied = null;
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        write: async items => {
          const blob = await items[0].getType('image/png');
          const bitmap = await createImageBitmap(blob);
          window.testCopied = { type: blob.type, width: bitmap.width, height: bitmap.height };
        },
      },
    });
  });
}

// What the clipboard stand-in recorded: { type, width, height }, or null before a copy.
const copiedImage = page => page.evaluate(() => window.testCopied);

// Spreads two dispatched fingers apart on the photo, around `center` (page CSS px). Like
// touchDrag in app.js, setPointerCapture ignores the dispatched fingers for the gesture.
function spreadFingers(page, center) {
  return page.evaluate(({ middle, fingerIds, startGap, endGap, moves }) => {
    const element = document.getElementById('view');
    const capture = Element.prototype.setPointerCapture;
    Element.prototype.setPointerCapture = function captureUnlessDispatched(id) {
      if (!fingerIds.includes(id)) capture.call(this, id);
    };
    const send = (type, id, gap, side) => element.dispatchEvent(new PointerEvent(type, {
      pointerId: id,
      pointerType: 'touch',
      isPrimary: id === fingerIds[0],
      clientX: middle.x + side * gap / 2,
      clientY: middle.y,
      bubbles: true,
      cancelable: true,
      buttons: type === 'pointerup' ? 0 : 1,
    }));
    try {
      send('pointerdown', fingerIds[0], startGap, -1);
      send('pointerdown', fingerIds[1], startGap, 1);
      for (let i = 1; i <= moves; i++) {
        const gap = startGap + (endGap - startGap) * i / moves;
        send('pointermove', fingerIds[0], gap, -1);
        send('pointermove', fingerIds[1], gap, 1);
      }
      send('pointerup', fingerIds[0], endGap, -1);
      send('pointerup', fingerIds[1], endGap, 1);
    } finally {
      Element.prototype.setPointerCapture = capture;
    }
  }, {
    middle: center,
    fingerIds: PINCH_FINGER_IDS,
    startGap: PINCH_START_GAP_PX,
    endGap: PINCH_END_GAP_PX,
    moves: PINCH_MOVES,
  });
}

// Zooms in on the middle of the photo as a person would: two fingers spread apart on a phone,
// the mouse wheel rolled away on a wide screen.
async function zoomIn(page, hand) {
  const center = await middleOf(page.locator('#view'));
  if (hand.isTouch) {
    await spreadFingers(page, center);
    return;
  }
  await page.mouse.move(center.x, center.y);
  await page.mouse.wheel(0, WHEEL_ZOOM_IN_PX);
}

// The photo area's view now: { zoom, isFitted } (isFitted: not zoomed or panned by hand), or
// null when nothing is drawn.
function viewNow(page) {
  return page.evaluate(() => {
    const view = window.CF.currentView();
    return view ? { zoom: view.zoom, isFitted: view.auto !== false } : null;
  });
}

// Makes every read of the photo named `name` fail, as a read under memory pressure on an
// iPhone does, until allowReads. No control can make a read fail, so this one change is made
// in the page's code.
function failReadsOf(page, name) {
  return page.evaluate(photoName => {
    const source = window.CF.ImageSource;
    window.testFailingName = photoName;
    if (window.testLoadBeforeFailing) return;
    const load = source.load;
    window.testLoadBeforeFailing = load;
    source.load = function loadUnlessFailing(blob, wantedName) {
      if (wantedName === window.testFailingName) {
        return Promise.reject(new Error('Couldn’t read that file as an image.'));
      }
      return load.call(source, blob, wantedName);
    };
  }, name);
}

// Lets reads that failReadsOf made fail work again.
function allowReads(page) {
  return page.evaluate(() => {
    window.testFailingName = null;
  });
}

// Starts counting the full-size photos the app holds: the open one now, plus each one it reads,
// minus each one it lets go of. Read the count with heldPhotos. A person can't see this, and the
// app keeps no count, so the counting is added to the page's code.
function countHeldPhotos(page) {
  return page.evaluate(() => {
    const held = { now: 0, most: 0, events: [] };
    window.testHeld = held;
    const track = (img, name) => {
      held.now += 1;
      held.most = Math.max(held.most, held.now);
      let isClosed = false;
      const close = img.close;
      img.close = () => {
        if (!isClosed) {
          isClosed = true;
          held.now -= 1;
          held.events.push(`let go ${name}`);
        }
        close.call(img);
      };
      return img;
    };
    const app = window.__straightener.app;
    track(app.img, app.img.name);
    const source = window.CF.ImageSource;
    const load = source.load;
    source.load = async function loadAndCount(blob, name) {
      const img = await load.call(source, blob, name);
      held.events.push(`read ${name}`);
      return track(img, name);
    };
  });
}

// What countHeldPhotos saw since the last call, and starts again from the photos held now:
// { now, most, events } (events: 'read <name>' and 'let go <name>', in order).
function heldPhotos(page) {
  return page.evaluate(() => {
    const held = window.testHeld;
    const seen = { now: held.now, most: held.most, events: held.events.slice() };
    held.most = held.now;
    held.events = [];
    return seen;
  });
}

// Starts recording every message the toast shows, as [{ text, kind }] in window.testToasts
// (kind: 'error', 'warn' or ''). A message can be replaced before a case could look at it.
function recordToasts(page) {
  return page.evaluate(() => {
    window.testToasts = [];
    const toast = document.getElementById('toast');
    const record = () => {
      if (!toast.classList.contains('is-shown')) return;
      const text = toast.querySelector('.toast-text').textContent;
      let kind = '';
      if (toast.classList.contains('is-error')) kind = 'error';
      if (toast.classList.contains('is-warn')) kind = 'warn';
      const last = window.testToasts[window.testToasts.length - 1];
      if (last && last.text === text && last.kind === kind) return;
      window.testToasts.push({ text, kind });
    };
    new MutationObserver(record).observe(toast, {
      attributes: true,
      childList: true,
      subtree: true,
      characterData: true,
    });
  });
}

// The messages recordToasts has seen since the last call: [{ text, kind }].
function toastsSoFar(page) {
  return page.evaluate(() => window.testToasts.splice(0));
}

// Starts noting the moments the page starts a download (a click on a link with a download
// name), on the page's own clock. When a download reaches the test runner depends on how busy
// the machine is; when the page starts it does not.
function noteDownloadStarts(page) {
  return page.evaluate(() => {
    window.testDownloadStarts = [];
    document.addEventListener('click', event => {
      const link = event.target;
      if (link instanceof HTMLAnchorElement && link.download) {
        window.testDownloadStarts.push(performance.now());
      }
    }, true);
  });
}

// The moments noteDownloadStarts has noted since the last call, in ms on the page's clock.
const downloadStarts = page => page.evaluate(() => window.testDownloadStarts.splice(0));

// Holds each write to the app's storage (IndexedDB) for delayMs before it starts, as on a busy
// phone. No control can slow storage, so this one change is made in the page's code.
function slowStorageWrites(page, delayMs) {
  return page.evaluate(holdMs => {
    const session = window.CF.Session;
    const transaction = session.transaction;
    session.transaction = async function slowTransaction(mode, work) {
      if (mode === 'readwrite') await new Promise(resolve => setTimeout(resolve, holdMs));
      return transaction.call(session, mode, work);
    };
  }, delayMs);
}

// Changes the stored pair record ('pair') in the app's storage. change: 'damage' (its waiting
// side's edits become a word) or 'other photo' (the waiting side's stored photo becomes the
// sample `photoName`, a photo of another size). No control can do this; Resume then reads it.
function changeStoredPair(page, change, photoName = '') {
  return page.evaluate(async ({ kind, address }) => {
    const session = window.CF.Session;
    if (kind === 'damage') {
      const pair = await session.get('pair');
      pair.other.edits.state = 'damaged';
      await session.put('pair', pair);
      return;
    }
    const photo = await session.get('pairPhoto');
    photo.buf = await (await fetch(address)).arrayBuffer();
    await session.put('pairPhoto', photo);
  }, { kind: change, address: `samples/${photoName}` });
}

module.exports = {
  zoomIn,
  viewNow,
  failReadsOf,
  allowReads,
  countHeldPhotos,
  heldPhotos,
  recordToasts,
  toastsSoFar,
  changeStoredPair,
  noteDownloadStarts,
  downloadStarts,
  slowStorageWrites,
  waitInPage,
  regionMeans,
  standInShareSheet,
  sharedFiles,
  standInClipboard,
  copiedImage,
  PORTRAIT_PAIR,
  LANDSCAPE_PAIR,
  SIDE_TIMEOUT_MS,
  chooseFile,
  chooseInPicker,
  unreadablePhoto,
  waitForPhoto,
  waitForSide,
  addBack,
  makePair,
  sideButton,
  switchTo,
  openSide,
  holdNextOpening,
  releaseOpening,
  waitForOpening,
  downloadAll,
  chooseOutput,
  chooseSize,
  storedRecord,
  waitUntilPairStored,
  waitUntilSingleStored,
  reloadToResume,
  resume,
  shownToast,
  readoutSizes,
  crossCorners: crossTheCorners,
};
