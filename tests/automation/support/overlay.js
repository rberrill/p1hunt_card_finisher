// Helpers for the Overlay cases (tests/automation/overlay.spec.js): logo files made in the test
// (PNG, WebP and JPEG drawn on a canvas, SVG written as text, a file over the size limit, a text
// file named like a picture), choosing one in the logo picker, where the logo, its corner
// handles and the snap rings are on the page, a real finger's slide on a slider, the photo area
// as drawn, and the logo found in a saved file.
// They drive the app as a person would and read its state only to find a place to press or to
// check a result.
'use strict';
const fs = require('fs');
const path = require('path');
const { openApp, openPhoto, goToStep, handFor } = require('./app.js');
const { pickWith, waitUntil } = require('./start-and-session.js');

// The photo most cases use: a PSA slab.
const PHOTO = 'IMG_9136.JPEG';
// How long a logo may take to be added (or refused) before a case gives up.
const LOGO_TIMEOUT_MS = 10000;
// The paints a drawn logo can have (drawnLogo):
//   'disc'   a blue disc on a see-through square, filling it edge to edge
//   'split'  the left half black, the right half white
//   'green'  solid pure green
//   'greys'  the left half gray 100, the right half gray 150 (0 to 255)
const PAINTS = ['disc', 'split', 'green', 'greys'];
// The green paint as [r, g, b] (the color readSavedLogo looks for), and the two grays (0 to
// 255).
const GREEN = [0, 255, 0];
const DARK_GREY = 100;
const LIGHT_GREY = 150;
// The pointer id of the finger tapAndLookAtLogo dispatches: any number a real pointer is
// unlikely to have.
const TAP_FINGER_ID = 31;
// How many moves a real finger's slide is split into.
const SLIDE_MOVES = 10;
// Bytes per chunk when a file made in the page crosses back as base64.
const BASE64_CHUNK = 0x8000;
// The image types a saved file can have, by its extension.
const MIME_TYPES = { '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
// One MB in bytes, and a file of 6 MB: over the logo limit of 5 MB (CONFIG.overlay.maxBytes).
const MEGABYTE = 1048576;
const SIX_MB = 6 * MEGABYTE;

// Opens the app (at `address`, which may carry settings from a link) with the case's photo and
// goes to the Overlay step. Returns the hand for this target.
async function startOnOverlay(page, testInfo, { photo = PHOTO, address } = {}) {
  await openApp(page, address);
  await openPhoto(page, photo);
  const hand = handFor(page, testInfo);
  await goToStep(page, 'overlay', hand);
  return hand;
}

// A logo drawn on a canvas in the page and saved as `type` ('image/png', 'image/webp' or
// 'image/jpeg'), `width` × `height` px, with one of PAINTS. Returns a file payload for a
// picker: { name, mimeType, buffer }.
async function drawnLogo(page, { name, type = 'image/png', width = 400, height = 400,
  paint = 'disc' }) {
  if (!PAINTS.includes(paint)) throw new Error(`Unknown paint ${paint}`);
  const base64 = await page.evaluate(async ({ mimeType, logoWidth, logoHeight, logoPaint,
    chunk, darkGrey, lightGrey }) => {
    const canvas = document.createElement('canvas');
    canvas.width = logoWidth;
    canvas.height = logoHeight;
    const ctx = canvas.getContext('2d');
    const half = logoWidth / 2;
    if (logoPaint === 'disc') {
      ctx.fillStyle = 'rgb(0, 0, 255)';
      ctx.beginPath();
      ctx.ellipse(half, logoHeight / 2, half, logoHeight / 2, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (logoPaint === 'green') {
      ctx.fillStyle = 'rgb(0, 255, 0)';
      ctx.fillRect(0, 0, logoWidth, logoHeight);
    } else {
      const left = logoPaint === 'split' ? 0 : darkGrey;
      const right = logoPaint === 'split' ? 255 : lightGrey;
      ctx.fillStyle = `rgb(${left}, ${left}, ${left})`;
      ctx.fillRect(0, 0, half, logoHeight);
      ctx.fillStyle = `rgb(${right}, ${right}, ${right})`;
      ctx.fillRect(half, 0, half, logoHeight);
    }
    const blob = await new Promise(resolve => canvas.toBlob(resolve, mimeType, 1));
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let binary = '';
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    return btoa(binary);
  }, {
    mimeType: type,
    logoWidth: width,
    logoHeight: height,
    logoPaint: paint,
    chunk: BASE64_CHUNK,
    darkGrey: DARK_GREY,
    lightGrey: LIGHT_GREY,
  });
  return { name, mimeType: type, buffer: Buffer.from(base64, 'base64') };
}

// An SVG logo written as text: the left half black, the right half white, `width` × `height`
// in its own units (a viewBox of the same size). Returns a file payload for a picker.
function svgLogo(name = 'logo.svg', width = 200, height = 100) {
  const half = width / 2;
  const markup = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" `
    + `viewBox="0 0 ${width} ${height}">`
    + `<rect width="${half}" height="${height}" fill="#000"/>`
    + `<rect x="${half}" width="${half}" height="${height}" fill="#fff"/></svg>`;
  return { name, mimeType: 'image/svg+xml', buffer: Buffer.from(markup) };
}

// A file named like a PNG logo whose bytes are a line of text: no browser can read it.
function textNamedPng() {
  return {
    name: 'not-a-logo.png',
    mimeType: 'image/png',
    buffer: Buffer.from('This is a line of text, not a picture.\n'),
  };
}

// A file named like a PNG logo, `bytes` long. Only its size matters: the app refuses a file
// over the limit before reading it.
function oversizedPng(bytes = SIX_MB) {
  return { name: 'big-logo.png', mimeType: 'image/png', buffer: Buffer.alloc(bytes) };
}

// A GIF file, a picture type the logo picker doesn't take (the smallest valid GIF: one
// see-through pixel).
function gifLogo() {
  const base64 = 'R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
  return { name: 'logo.gif', mimeType: 'image/gif', buffer: Buffer.from(base64, 'base64') };
}

// The logo's id on the photo, or null.
function logoId(page) {
  return page.evaluate(() => {
    const overlay = window.__straightener.app.state.overlay;
    return overlay ? overlay.id : null;
  });
}

// Taps `control` (Add logo or Replace logo), chooses `file` in the picker that opens and waits
// until a new logo is on the photo. Returns its id.
async function chooseLogo(page, hand, control, file) {
  const before = await logoId(page);
  await pickWith(page, hand, control, file);
  await page.waitForFunction(idBefore => {
    const overlay = window.__straightener.app.state.overlay;
    return !!overlay && overlay.id !== idBefore;
  }, before, { timeout: LOGO_TIMEOUT_MS });
  return logoId(page);
}

// Taps `control`, chooses `file` and waits until the app has shown a message about it in the
// line above the controls. Returns the picker, so a case can read what it asked for.
async function chooseBadLogo(page, hand, control, file) {
  const chooser = await pickWith(page, hand, control, file);
  await page.locator('#overlayStatus').waitFor({ state: 'visible', timeout: LOGO_TIMEOUT_MS });
  return chooser;
}

// The logo as the app holds it now, pulled inside the crop as it is drawn: { cx, cy, w,
// opacity, aspect } (fractions of the crop; cx and cy its middle) and the crop's size in the
// straightened picture's px, { cropWidth, cropHeight }. Null with no logo placed.
function logoPlacement(page) {
  return page.evaluate(() => {
    const app = window.__straightener.app;
    const overlay = app.state.overlay;
    if (!overlay || !app.geometry || !app.geometry.ok) return null;
    const crop = app.geometry.crop;
    const placed = window.CardEngine.clampOverlay(overlay, crop.width, crop.height);
    return {
      cx: placed.cx,
      cy: placed.cy,
      w: placed.w,
      opacity: placed.opacity,
      aspect: placed.aspect,
      cropWidth: crop.width,
      cropHeight: crop.height,
    };
  });
}

// The logo's box in the straightened picture's px, measured from the crop's top-left:
// { left, top, right, bottom, width, height }, or null with no logo placed.
async function logoBox(page) {
  const placed = await logoPlacement(page);
  if (!placed) return null;
  const width = placed.w * placed.cropWidth;
  const height = width / placed.aspect;
  const left = placed.cx * placed.cropWidth - width / 2;
  const top = placed.cy * placed.cropHeight - height / 2;
  return { left, top, right: left + width, bottom: top + height, width, height };
}

// Where the logo is on the page, in CSS px: { x, y, width, height, middle, corners }, with
// middle and each corner (nw, ne, se, sw) as { x, y }. Null with no logo placed.
function logoOnPage(page) {
  return page.evaluate(() => {
    const app = window.__straightener.app;
    const overlay = app.state.overlay;
    if (!overlay || !app.geometry || !app.geometry.ok) return null;
    const crop = app.geometry.crop;
    const placed = window.CardEngine.clampOverlay(overlay, crop.width, crop.height);
    const rect = window.CardEngine.overlayRect(placed, crop.width, crop.height);
    const view = window.CF.currentView();
    const box = document.getElementById('view').getBoundingClientRect();
    const onPage = (x, y) => {
      const [screenX, screenY] = window.CF.toScreen(view, [crop.x + x, crop.y + y]);
      return { x: box.left + screenX, y: box.top + screenY };
    };
    const topLeft = onPage(rect.x, rect.y);
    const bottomRight = onPage(rect.x + rect.width, rect.y + rect.height);
    return {
      x: topLeft.x,
      y: topLeft.y,
      width: bottomRight.x - topLeft.x,
      height: bottomRight.y - topLeft.y,
      middle: { x: (topLeft.x + bottomRight.x) / 2, y: (topLeft.y + bottomRight.y) / 2 },
      corners: {
        nw: topLeft,
        ne: { x: bottomRight.x, y: topLeft.y },
        se: bottomRight,
        sw: { x: topLeft.x, y: bottomRight.y },
      },
    };
  });
}

// The crop (the framed photo) on the page, in CSS px: { left, top, right, bottom }.
function cropOnPage(page) {
  return page.evaluate(() => {
    const crop = window.__straightener.app.geometry.crop;
    const view = window.CF.currentView();
    const box = document.getElementById('view').getBoundingClientRect();
    const [left, top] = window.CF.toScreen(view, [crop.x, crop.y]);
    const [right, bottom] = window.CF.toScreen(view, [crop.x + crop.width, crop.y + crop.height]);
    return {
      left: box.left + left,
      top: box.top + top,
      right: box.left + right,
      bottom: box.top + bottom,
    };
  });
}

// Where a snap ring is on the page, in CSS px: `where` is 'tl', 't', 'tr', 'l', 'c', 'r',
// 'bl', 'b' or 'br'. The rings sit CONFIG.overlay.hotSpotInset px in from the crop's edges (or
// a quarter of the crop, if that is less).
async function ringOnPage(page, where) {
  const crop = await cropOnPage(page);
  const insetPx = await page.evaluate(() => CONFIG.overlay.hotSpotInset);
  const width = crop.right - crop.left;
  const height = crop.bottom - crop.top;
  const inset = Math.min(insetPx, width / 4, height / 4);
  const across = { l: crop.left + inset, r: crop.right - inset };
  const down = { t: crop.top + inset, b: crop.bottom - inset };
  const x = across[where.replace(/[tb]/, '')] || (crop.left + crop.right) / 2;
  const y = down[where.replace(/[lr]/, '')] || (crop.top + crop.bottom) / 2;
  return { x, y };
}

// The photo view's zoom and pan: { zoom, panX, panY }.
function viewNow(page) {
  return page.evaluate(() => {
    const view = window.CF.currentView();
    return { zoom: view.zoom, panX: view.panX, panY: view.panY };
  });
}

// How many steps Undo can take back now.
function undoSteps(page) {
  return page.evaluate(() => window.CF.History.undo.length);
}

// Slides a slider (a range input) with a real finger on a phone target, or the mouse on a wide
// one, from `fromFrac` to `toFrac` of its width (0 to 1), without lifting. Call liftSlide to
// let go. A dispatched pointer doesn't move a native slider, so a phone target's finger goes
// through Chromium's own touch input (the DevTools protocol), as a real touch would.
async function holdSlide(page, hand, slider, fromFrac, toFrac) {
  const box = await slider.boundingBox();
  const middleY = box.y + box.height / 2;
  const xAt = fraction => box.x + box.width * fraction;
  if (!hand.isTouch) {
    await page.mouse.move(xAt(fromFrac), middleY);
    await page.mouse.down();
    await page.mouse.move(xAt(toFrac), middleY, { steps: SLIDE_MOVES });
    return null;
  }
  const session = await page.context().newCDPSession(page);
  const touch = (type, x) => session.send('Input.dispatchTouchEvent', {
    type,
    touchPoints: type === 'touchEnd' ? [] : [{ x, y: middleY }],
  });
  await touch('touchStart', xAt(fromFrac));
  for (let i = 1; i <= SLIDE_MOVES; i++) {
    const fraction = fromFrac + (toFrac - fromFrac) * i / SLIDE_MOVES;
    await touch('touchMove', xAt(fraction));
  }
  return { touch, session };
}

// Lets go of a slide holdSlide started (`held` is what it returned).
async function liftSlide(page, held) {
  if (!held) {
    await page.mouse.up();
    return;
  }
  await held.touch('touchEnd', 0);
  await held.session.detach();
}

// Slides a slider from `fromFrac` to `toFrac` of its width and lets go.
async function slide(page, hand, slider, fromFrac, toFrac) {
  const held = await holdSlide(page, hand, slider, fromFrac, toFrac);
  await liftSlide(page, held);
}

// The color of the photo area as drawn at a page point (CSS px): [r, g, b] (0 to 255), the
// mean of a small square around it. It waits for the next frames first, so a redraw the app
// has asked for is on the screen.
async function colorOnPage(page, point, radiusPx = 2) {
  await nextFrames(page);
  return page.evaluate(({ x, y, radius }) => {
    const canvas = document.getElementById('view');
    const box = canvas.getBoundingClientRect();
    const scale = canvas.width / box.width;
    const size = Math.max(1, Math.round(radius * 2 * scale));
    const left = Math.round((x - box.left - radius) * scale);
    const top = Math.round((y - box.top - radius) * scale);
    const pixels = canvas.getContext('2d').getImageData(left, top, size, size).data;
    const sums = [0, 0, 0];
    for (let i = 0; i < pixels.length; i += 4) {
      for (let channel = 0; channel < 3; channel++) sums[channel] += pixels[i + channel];
    }
    return sums.map(sum => Math.round(sum / (pixels.length / 4)));
  }, { x: point.x, y: point.y, radius: radiusPx });
}

// Taps a page point with one dispatched finger and, at the frame drawn next, reads the photo
// area's color inside the logo where the tap has placed it: a quarter of the logo's width left
// of its middle. Returns [r, g, b]. It all happens in one go in the page, so no round trip to
// the test delays the look: what it sees is the first frame a person would see after the tap.
function tapAndLookAtLogo(page, point) {
  return page.evaluate(async ({ x, y, fingerId }) => {
    const canvas = document.getElementById('view');
    const send = type => canvas.dispatchEvent(new PointerEvent(type, {
      pointerId: fingerId,
      pointerType: 'touch',
      isPrimary: true,
      clientX: x,
      clientY: y,
      bubbles: true,
      cancelable: true,
      buttons: type === 'pointerdown' ? 1 : 0,
    }));
    send('pointerdown');
    send('pointerup');
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const app = window.__straightener.app;
    const crop = app.geometry.crop;
    const placed = window.CardEngine.clampOverlay(app.state.overlay, crop.width, crop.height);
    const rect = window.CardEngine.overlayRect(placed, crop.width, crop.height);
    const lookAt = [crop.x + rect.x + rect.width / 4, crop.y + rect.y + rect.height / 2];
    const [screenX, screenY] = window.CF.toScreen(window.CF.currentView(), lookAt);
    const scale = canvas.width / canvas.getBoundingClientRect().width;
    const pixel = canvas.getContext('2d')
      .getImageData(Math.round(screenX * scale), Math.round(screenY * scale), 1, 1).data;
    return Array.from(pixel.slice(0, 3));
  }, { x: point.x, y: point.y, fingerId: TAP_FINGER_ID });
}

// Waits for the next two frames the page draws, so a redraw asked for now has happened.
function nextFrames(page) {
  return page.evaluate(() => new Promise(resolve => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  }));
}

// Reads a saved image file in the page. Returns { width, height, box, row }:
//   box  the smallest box holding every pixel near pure `color` ([r, g, b]), as
//        { left, top, right, bottom } in the image's px (right and bottom past the last), or
//        null when none is;
//   row  the red channel (0 to 255) of every pixel of the row `rowFrac` (0 to 1) down, when
//        rowFrac is given.
async function readSavedLogo(page, file, { color = GREEN, rowFrac = null } = {}) {
  const type = MIME_TYPES[path.extname(file).toLowerCase()] || 'image/jpeg';
  const base64 = fs.readFileSync(file).toString('base64');
  return page.evaluate(async ({ data, mimeType, target, rowFraction }) => {
    const bytes = Uint8Array.from(atob(data), character => character.charCodeAt(0));
    const bitmap = await createImageBitmap(new Blob([bytes], { type: mimeType }));
    const { width, height } = bitmap;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(bitmap, 0, 0);
    const pixels = ctx.getImageData(0, 0, width, height).data;
    // A channel within this much of the color's counts as the color (JPEG noise).
    const tolerance = 60;
    let box = null;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const offset = (y * width + x) * 4;
        const isColor = [0, 1, 2].every(channel => (
          Math.abs(pixels[offset + channel] - target[channel]) < tolerance));
        if (!isColor) continue;
        if (!box) box = { left: x, top: y, right: x + 1, bottom: y + 1 };
        box.left = Math.min(box.left, x);
        box.top = Math.min(box.top, y);
        box.right = Math.max(box.right, x + 1);
        box.bottom = Math.max(box.bottom, y + 1);
      }
    }
    let row = null;
    if (rowFraction !== null) {
      const y = Math.min(height - 1, Math.floor(rowFraction * height));
      row = Array.from({ length: width }, (unused, x) => pixels[(y * width + x) * 4]);
    }
    return { width, height, box, row };
  }, { data: base64, mimeType: type, target: color, rowFraction: rowFrac });
}

// Waits until the logo saved in this browser has `settings` ({ cx, cy, w, opacity }, each
// optional): the stored record's settings match within a millionth.
async function waitForSavedSettings(page, settings, timeoutMs = LOGO_TIMEOUT_MS) {
  await waitUntil(page, async wanted => {
    const record = await window.__straightener.Session.get('overlay');
    if (!record || !record.settings) return false;
    return Object.keys(wanted).every(key => (
      Math.abs(record.settings[key] - wanted[key]) < 1e-6));
  }, settings, timeoutMs, `the saved logo's settings ${JSON.stringify(settings)}`);
}

module.exports = {
  PHOTO,
  GREEN,
  DARK_GREY,
  LIGHT_GREY,
  MEGABYTE,
  SIX_MB,
  startOnOverlay,
  drawnLogo,
  svgLogo,
  textNamedPng,
  oversizedPng,
  gifLogo,
  logoId,
  chooseLogo,
  chooseBadLogo,
  logoPlacement,
  logoBox,
  logoOnPage,
  cropOnPage,
  ringOnPage,
  viewNow,
  undoSteps,
  holdSlide,
  liftSlide,
  slide,
  colorOnPage,
  nextFrames,
  tapAndLookAtLogo,
  readSavedLogo,
  waitForSavedSettings,
};
