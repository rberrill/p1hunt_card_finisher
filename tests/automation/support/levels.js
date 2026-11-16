// Helpers for the Levels cases (tests/automation/levels.spec.js): where a spot of the framed
// picture is on the page, the two pick buttons, holding the photo to compare, the Before levels
// badge, and the colors a pick or a saved file should hold, worked out here from the files
// themselves. Like app.js, they drive the app as a person would and read its state only through
// window.__straightener and CF, to check a result.
'use strict';
const fs = require('fs');
const path = require('path');
const { openApp, openPhoto, goToStep, handFor, samplePath } = require('./app.js');
const { sendTouch } = require('./perspective.js');

// The photo the pick cases use: a graded card in a clear slab on a white background. Its white
// background and the card's dark background are both large, even patches.
const LEVELS_PHOTO = 'IMG_9075.JPEG';
// Spots of the framed picture, as fractions [across, down] of the crop the Levels step shows
// (the same on a phone and a wide screen):
//   white       the white background just left of the slab, halfway down (about 225, 226, 217)
//   whiteRight  the white background just right of the slab, halfway down
//   dark        the card's dark background, up and to the left of the driver's head (about 67,
//               65, 68)
const SPOTS = {
  white: [0.05, 0.46],
  whiteRight: [0.96, 0.46],
  dark: [0.37, 0.2],
};
// How many frames badgeFadeSeries records once the comparison starts.
const FADE_FRAMES = 12;
// How long badgeFadeSeries waits for the comparison to start, in ms.
const FADE_WAIT_MS = 2000;
// The image types a file can have, by its extension.
const MIME_TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};
// The badge's box on the photo area, in CSS px from its top-left (drawCompareBadge in
// js/app/levels.js: a 28 px tall box at 12, 12; its text is about 90 px wide).
const BADGE_BOX = { x: 12, y: 12, width: 110, height: 28 };
// A badge pixel brighter than this in every channel is its white text.
const BADGE_TEXT_MIN = 200;
// The badge counts as shown when at least this many of its pixels are text.
const BADGE_TEXT_PIXELS = 30;
// How long a press must be held for the comparison (CONFIG.levels.compareHoldMs), in ms.
const COMPARE_HOLD_MS = 250;
// A press held past this is a hold, not a compare-length tap (TAP_MS in js/app/input.js).
const TAP_MS = 300;
// A pointer id for the dispatched finger of pressThenTap, unlike any real pointer's.
const PRESS_FINGER_ID = 31;
// How long to wait between polls of the comparison while holding, in ms.
const POLL_MS = 2;

// Opens the app (at `address`, which may carry settings from a link) with a photo and goes to
// the Levels step. Returns the hand for this target.
async function startOnLevels(page, testInfo, { photo = LEVELS_PHOTO, address } = {}) {
  await openApp(page, address);
  await openPhoto(page, photo);
  const hand = handFor(page, testInfo);
  await goToStep(page, 'levels', hand);
  return hand;
}

// Where a spot of the framed picture is on the page, in CSS px. spot: [across, down] as
// fractions of the crop (SPOTS).
function spotOnPage(page, spot) {
  return page.evaluate(([across, down]) => {
    const crop = window.__straightener.app.geometry.crop;
    const world = [crop.x + across * crop.width, crop.y + down * crop.height];
    const [x, y] = window.CF.toScreen(window.CF.currentView(), world);
    const box = document.getElementById('view').getBoundingClientRect();
    return { x: box.left + x, y: box.top + y };
  }, spot);
}

// The photo point (source px) under a point of the page.
function photoPointAt(page, point) {
  return page.evaluate(({ x, y }) => {
    const geometry = window.__straightener.app.geometry;
    const box = document.getElementById('view').getBoundingClientRect();
    const world = window.CF.toWorld(window.CF.currentView(), [x - box.left, y - box.top]);
    const rotatedToSource = window.CF.Mat3.invert(geometry.sourceToRotated);
    return window.CF.Mat3.apply(rotatedToSource, world[0], world[1]);
  }, point);
}

// The Pick white or Pick black button. which: 'white' or 'black'.
const pickButton = (page, which) => page.locator(`#levelsPicks .segment[data-value="${which}"]`);

// The armed pick's value ('white' or 'black'), or '' when neither is selected.
async function armedPick(page) {
  const pressed = page.locator('#levelsPicks .segment[aria-pressed="true"]');
  return (await pressed.count()) ? pressed.getAttribute('data-value') : '';
}

// The white dot on the Levels tab that marks unapplied changes.
const levelsDot = page => page.locator('[data-step="levels"]:visible .step-tab-mark');

// What Levels holds now: { draft, applied, isPending, dropper, isComparing }. draft is the
// unapplied draft (null when nothing waits), applied the levels in the edits.
function levelsNow(page) {
  return page.evaluate(() => {
    const app = window.__straightener.app;
    return JSON.parse(JSON.stringify({
      draft: app.levelsPending ? app.levelsDraft : null,
      applied: app.state.levels,
      isPending: !!app.levelsPending,
      dropper: app.dropper || '',
      isComparing: !!app.compare,
    }));
  });
}

// The color a swatch's tooltip names: [red, green, blue], or null when it reads "Not set".
async function swatchColor(page, which) {
  const id = which === 'white' ? '#swatchWhite' : '#swatchBlack';
  const title = await page.locator(id).getAttribute('title');
  const match = /^RGB (\d+), (\d+), (\d+)$/.exec(title || '');
  return match ? match.slice(1).map(Number) : null;
}

// Taps Pick white or Pick black, then taps a spot of the framed picture. hand: from handFor.
async function pickSpot(page, hand, which, spot) {
  await hand.tap(pickButton(page, which));
  const point = await spotOnPage(page, spot);
  await tapPoint(page, hand, point);
}

// Taps (a finger) or clicks (the mouse) one point of the page.
function tapPoint(page, hand, point) {
  return hand.isTouch ? page.touchscreen.tap(point.x, point.y) : page.mouse.click(point.x, point.y);
}

// Puts a finger (dispatched) or the mouse button down on a point of the photo, and leaves it
// there. releasePhoto lifts it.
async function pressPhoto(page, hand, point) {
  if (hand.isTouch) {
    await sendTouch(page, '#view', 'pointerdown', point);
    return;
  }
  await page.mouse.move(point.x, point.y);
  await page.mouse.down();
}

// Lifts the finger or the mouse button pressPhoto put down.
function releasePhoto(page, hand, point) {
  return hand.isTouch ? sendTouch(page, '#view', 'pointerup', point) : page.mouse.up();
}

// Presses the photo and holds it still until the comparison shows (or, when it never does,
// COMPARE_HOLD_MS and a little more), and keeps holding. releasePhoto lifts it.
async function holdPhoto(page, hand, point) {
  await pressPhoto(page, hand, point);
  await page.waitForTimeout(COMPARE_HOLD_MS);
  await page.waitForFunction(() => window.__straightener.app.compare, null, { timeout: 500 })
    .catch(() => {});
}

// True when the Before levels badge is drawn at the top left of the photo area: its white text
// is on the canvas. Phone layout only: there the badge's box is above the framed picture, while
// on a wide screen the picture's own whites can fall inside it.
function badgeShown(page) {
  return page.evaluate(({ box, textMin, needed }) => {
    const canvas = document.getElementById('view');
    const scale = canvas.width / canvas.getBoundingClientRect().width;
    const pixels = canvas.getContext('2d').getImageData(
      Math.round(box.x * scale),
      Math.round(box.y * scale),
      Math.round(box.width * scale),
      Math.round(box.height * scale),
    ).data;
    let textPixels = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      const isText = pixels[i] > textMin
        && pixels[i + 1] > textMin
        && pixels[i + 2] > textMin
        && pixels[i + 3] > textMin;
      if (isText) textPixels += 1;
    }
    return textPixels >= needed;
  }, { box: BADGE_BOX, textMin: BADGE_TEXT_MIN, needed: BADGE_TEXT_PIXELS });
}

// Waits until the photo area has been drawn twice more, so a change asked for is on screen.
function afterDraw(page) {
  return page.evaluate(() => new Promise(resolve => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  }));
}

// The box around a pick mark's letter, in CSS px from the picked point: drawPickMarker in
// js/app/levels.js writes the W or B in bold 12 px type, its left end 11 px right of the point
// and its baseline 9 px above it. The box holds the letter with 3 px to spare on every side for
// an outline, and stays clear of the mark's ring (radius 9, 2 px wide, so 10 px at most).
const LABEL_BOX = { left: 11, top: -24, width: 18, height: 19 };
// A pixel whose brightness (0 to 255) is under this counts as dark: an outline drawn in black
// or a dark grey, never the white letter or the white background it sits on.
const LABEL_DARK_MAX = 96;
// A pixel brighter than this (0 to 255) counts as the white letter where it sits on a dark spot.
const LABEL_BRIGHT_MIN = 200;

// What surrounds a pick mark's letter on screen, in the box around it (LABEL_BOX):
// { darkest, darkPixels, brightPixels }: the darkest brightness (0 to 255), and how many of its
// device pixels are dark (under LABEL_DARK_MAX) and bright (over LABEL_BRIGHT_MIN). which:
// 'white' or 'black', the mark's point in the draft. A white letter on a white spot with a dark
// outline has dark pixels there; a white letter alone has none. On a dark spot the letter's own
// bright pixels show that the box is where the letter is.
function labelSurround(page, which) {
  return page.evaluate(({ key, box, darkMax, brightMin }) => {
    const app = window.__straightener.app;
    const point = app.levelsDraft[key];
    const rotated = window.CF.Mat3.apply(app.geometry.sourceToRotated, point[0], point[1]);
    const [x, y] = window.CF.toScreen(window.CF.currentView(), rotated);
    const canvas = document.getElementById('view');
    const scale = canvas.width / canvas.getBoundingClientRect().width;
    const pixels = canvas.getContext('2d').getImageData(
      Math.round((x + box.left) * scale),
      Math.round((y + box.top) * scale),
      Math.round(box.width * scale),
      Math.round(box.height * scale),
    ).data;
    let darkest = 255;
    let darkPixels = 0;
    let brightPixels = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      const brightness = 0.2126 * pixels[i] + 0.7152 * pixels[i + 1] + 0.0722 * pixels[i + 2];
      darkest = Math.min(darkest, brightness);
      if (brightness < darkMax) darkPixels += 1;
      if (brightness > brightMin) brightPixels += 1;
    }
    return { darkest: Math.round(darkest), darkPixels, brightPixels };
  }, {
    key: which === 'white' ? 'whiteAt' : 'blackAt',
    box: LABEL_BOX,
    darkMax: LABEL_DARK_MAX,
    brightMin: LABEL_BRIGHT_MIN,
  });
}

// Starts watching the Before levels badge: once the comparison starts, records how bright the
// badge's box is at each of the next FADE_FRAMES frames (its brightest pixel's brightness times
// its opacity, 0 to 255: the white text as it fades in), leaving out frames with nothing drawn
// there. Call it before the press; it resolves with the list once the frames are recorded.
function badgeFadeSeries(page) {
  return page.evaluate(({ box, frames, waitMs }) => new Promise((resolve, reject) => {
    const canvas = document.getElementById('view');
    const ctx = canvas.getContext('2d');
    const series = [];
    const startMs = performance.now();
    const brightness = () => {
      const scale = canvas.width / canvas.getBoundingClientRect().width;
      const pixels = ctx.getImageData(
        Math.round(box.x * scale),
        Math.round(box.y * scale),
        Math.round(box.width * scale),
        Math.round(box.height * scale),
      ).data;
      let brightest = 0;
      for (let i = 0; i < pixels.length; i += 4) {
        const light = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
        brightest = Math.max(brightest, light * pixels[i + 3] / 255);
      }
      return brightest;
    };
    const record = () => {
      if (!window.__straightener.app.compare) {
        if (performance.now() - startMs > waitMs) {
          reject(new Error('The comparison never started'));
          return;
        }
        requestAnimationFrame(record);
        return;
      }
      const value = brightness();
      if (value > 0 || series.length) series.push(value);
      if (series.length >= frames) resolve(series);
      else requestAnimationFrame(record);
    };
    requestAnimationFrame(record);
  }), { box: BADGE_BOX, frames: FADE_FRAMES, waitMs: FADE_WAIT_MS });
}

// A finger presses one point of the photo and holds it still until the comparison shows, then
// lifts at once and taps the same point again, all within the page so the timing is exact.
// Returns { holdMs, isCompared }: how long the press lasted (under TAP_MS when the comparison
// showed in time) and whether the comparison showed.
function pressThenTap(page, point) {
  return page.evaluate(async ({ x, y, fingerId, holdMs, pollMs, tapMs }) => {
    const view = document.getElementById('view');
    const capture = Element.prototype.setPointerCapture;
    Element.prototype.setPointerCapture = function captureUnlessDispatched(id) {
      if (id !== fingerId) capture.call(this, id);
    };
    const send = type => view.dispatchEvent(new PointerEvent(type, {
      pointerId: fingerId,
      pointerType: 'touch',
      isPrimary: true,
      clientX: x,
      clientY: y,
      bubbles: true,
      cancelable: true,
      buttons: type === 'pointerdown' ? 1 : 0,
    }));
    const wait = delayMs => new Promise(resolve => setTimeout(resolve, delayMs));
    try {
      const startMs = performance.now();
      send('pointerdown');
      await wait(holdMs);
      while (!window.__straightener.app.compare && performance.now() - startMs < tapMs) {
        await wait(pollMs);
      }
      const isCompared = !!window.__straightener.app.compare;
      send('pointerup');
      const pressMs = performance.now() - startMs;
      send('pointerdown');
      send('pointerup');
      return { holdMs: pressMs, isCompared };
    } finally {
      Element.prototype.setPointerCapture = capture;
    }
  }, {
    x: point.x,
    y: point.y,
    fingerId: PRESS_FINGER_ID,
    holdMs: COMPARE_HOLD_MS,
    pollMs: POLL_MS,
    tapMs: TAP_MS,
  });
}

// The color of a square patch of an image file, worked out in the page the way the app's
// dropper averages one (CardEngine.meanColor): the patch runs from center − radius to center +
// radius (rounded outward, kept inside the image); with trim, only the share (1 − 2·trim) of its
// pixels closest in brightness to the patch's median brightness count; the mean is taken in
// linear light. Returns [red, green, blue] (0 to 255, not rounded). It is worked out here from
// the file, not by the app, so a case can compare the two.
async function fileRegionColor(page, file, center, radiusPx, trim = 0) {
  const type = MIME_TYPES[path.extname(file).toLowerCase()] || 'image/jpeg';
  const base64 = fs.readFileSync(file).toString('base64');
  return page.evaluate(async ({ data, mimeType, point, radius, trimShare }) => {
    const bytes = Uint8Array.from(atob(data), character => character.charCodeAt(0));
    const bitmap = await createImageBitmap(new Blob([bytes], { type: mimeType }));
    const left = Math.max(0, Math.floor(point[0] - radius));
    const top = Math.max(0, Math.floor(point[1] - radius));
    const right = Math.min(bitmap.width, Math.ceil(point[0] + radius));
    const bottom = Math.min(bitmap.height, Math.ceil(point[1] + radius));
    const canvas = document.createElement('canvas');
    canvas.width = right - left;
    canvas.height = bottom - top;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const { width, height } = canvas;
    ctx.drawImage(bitmap, left, top, width, height, 0, 0, width, height);
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const toLinear = value => {
      const encoded = value / 255;
      return encoded <= 0.04045 ? encoded / 12.92 : Math.pow((encoded + 0.055) / 1.055, 2.4);
    };
    const toSrgb = linear => 255 * (linear <= 0.0031308
      ? linear * 12.92
      : 1.055 * Math.pow(linear, 1 / 2.4) - 0.055);
    const brightness = offset => 0.2126 * pixels[offset]
      + 0.7152 * pixels[offset + 1]
      + 0.0722 * pixels[offset + 2];
    let offsets = [];
    for (let offset = 0; offset < pixels.length; offset += 4) offsets.push(offset);
    if (trimShare > 0) {
      const sorted = offsets.map(brightness).sort((first, second) => first - second);
      const median = sorted[sorted.length >> 1];
      offsets.sort((first, second) => Math.abs(brightness(first) - median)
        - Math.abs(brightness(second) - median));
      offsets = offsets.slice(0, Math.max(1, Math.ceil(offsets.length * (1 - 2 * trimShare))));
    }
    const sums = [0, 0, 0];
    for (const offset of offsets) {
      for (let channel = 0; channel < 3; channel++) {
        sums[channel] += toLinear(pixels[offset + channel]);
      }
    }
    return sums.map(sum => toSrgb(sum / offsets.length));
  }, { data: base64, mimeType: type, point: center, radius: radiusPx, trimShare: trim });
}

// The color a pick at a photo point (source px) should read from the sample photo `name`, with
// a patch of radiusPx photo px and the trim the dropper uses (CONFIG.levels.sampleTrim, 0.25).
function expectedPick(page, name, sourcePoint, radiusPx, trim = 0.25) {
  return fileRegionColor(page, samplePath(name), sourcePoint, radiusPx, trim);
}

// Where a photo point (source px) lands in the saved file, in its px.
function outputPointOf(page, sourcePoint) {
  return page.evaluate(([x, y]) => {
    const geometry = window.__straightener.app.geometry;
    const sourceToOutput = window.CF.Mat3.invert(geometry.outputToSource);
    return window.CF.Mat3.apply(sourceToOutput, x, y);
  }, sourcePoint);
}

// The photo view's zoom: CSS px per px of the picture.
function viewZoom(page) {
  return page.evaluate(() => window.CF.currentView().zoom);
}

// The photo view's place: { zoom, panX, panY }.
function viewNow(page) {
  return page.evaluate(() => {
    const view = window.CF.currentView();
    return { zoom: view.zoom, panX: view.panX, panY: view.panY };
  });
}

// A plain white picture with nothing in it, drawn in the page: { name, mimeType, buffer },
// ready for setInputFiles. Every pixel is 255, which Auto leaves out as clipped.
async function whitePicture(page, width = 1200, height = 1600) {
  const base64 = await page.evaluate(async ({ pictureWidth, pictureHeight }) => {
    const canvas = document.createElement('canvas');
    canvas.width = pictureWidth;
    canvas.height = pictureHeight;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, pictureWidth, pictureHeight);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let text = '';
    for (const byte of bytes) text += String.fromCharCode(byte);
    return btoa(text);
  }, { pictureWidth: width, pictureHeight: height });
  return { name: 'white.png', mimeType: 'image/png', buffer: Buffer.from(base64, 'base64') };
}

module.exports = {
  LEVELS_PHOTO,
  SPOTS,
  startOnLevels,
  spotOnPage,
  photoPointAt,
  pickButton,
  armedPick,
  levelsDot,
  levelsNow,
  swatchColor,
  pickSpot,
  tapPoint,
  pressPhoto,
  releasePhoto,
  holdPhoto,
  badgeShown,
  afterDraw,
  labelSurround,
  badgeFadeSeries,
  pressThenTap,
  fileRegionColor,
  expectedPick,
  outputPointOf,
  viewZoom,
  viewNow,
  whitePicture,
};
