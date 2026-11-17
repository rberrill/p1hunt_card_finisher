// Helpers for the layout cases (tests/automation/layout.spec.js) that the other areas don't
// share: the frames a sheet or the Front and Back pill passes through, the height of a slider's
// knob as drawn, and the steps the export's progress line takes. They read the page only to
// check a result. holdFinger (a finger held still on the screen) is support/app.js's, exported
// here too.
'use strict';
const { holdFinger } = require('./app.js');

// How long a recorder watches the frames after a tap, in ms: past a 280 ms sheet slide.
const RECORD_MS = 450;
// A pill between its two halves is more than this share of its width from either end.
const PILL_END_FRAC = 0.02;
// A pixel of a screenshot counts as the white of a slider's knob when each of its red, green
// and blue is above this (the app's white is #f2f2f3, 242).
const KNOB_WHITE_MIN = 200;
// How far above and below a knob's middle its screenshot reaches, in CSS px: past a held knob
// (30 px) with room to spare.
const KNOB_REACH_PX = 22;
// How far a color channel (0 to 255) may move between two screenshots before the pixel counts
// as changed (screenDifference).
const SCREEN_CHANNEL_SLACK = 16;
// A slider's knob at rest, across, in CSS px (css/app.css, the slider part's thumb).
const KNOB_PX = 22;

// Starts recording, at every frame for RECORD_MS, where a step's options sheet is: in
// window.testFrames, { isShown, offsetPx, dimming } per frame, with offsetPx how far the sheet
// is below its resting place (0 at rest) and dimming the opacity of the shade over the photo.
// Read the frames with framesRecorded.
function recordSheetFrames(page, step) {
  return page.evaluate(({ id, durationMs }) => {
    const layer = document.getElementById(id);
    const sheet = layer.querySelector('.sheet');
    const shade = layer.querySelector('.sheet-scrim');
    window.testFrames = [];
    window.testFramesDone = false;
    const startedAt = performance.now();
    const look = now => {
      window.testFrames.push({
        isShown: !layer.hidden,
        offsetPx: Math.round(new DOMMatrix(getComputedStyle(sheet).transform).m42),
        dimming: Number(getComputedStyle(shade).opacity),
      });
      if (now - startedAt < durationMs) requestAnimationFrame(look);
      else window.testFramesDone = true;
    };
    requestAnimationFrame(look);
  }, { id: `${step}Sheet`, durationMs: RECORD_MS });
}

// Starts recording, at every frame for RECORD_MS, where the Front and Back pill is: in
// window.testFrames, the share of the way from Front (0) to Back (1) it has gone in each. Each
// slide the browser starts on the pill is noted too, by the property it moves, in
// window.testPillSlides: a busy page may draw no frame in the middle of a short slide, but the
// browser still starts it. Read the frames with framesRecorded, the slides with pillSlides.
function recordPillFrames(page) {
  return page.evaluate(durationMs => {
    const pill = document.querySelector('#sideSwitch .segment-thumb');
    window.testFrames = [];
    window.testFramesDone = false;
    window.testPillSlides = [];
    pill.addEventListener('transitionrun', event => {
      window.testPillSlides.push(event.propertyName);
    });
    const startedAt = performance.now();
    const look = now => {
      const across = new DOMMatrix(getComputedStyle(pill).transform).m41;
      window.testFrames.push(across / pill.getBoundingClientRect().width);
      if (now - startedAt < durationMs) requestAnimationFrame(look);
      else window.testFramesDone = true;
    };
    requestAnimationFrame(look);
  }, RECORD_MS);
}

// The slides the browser has started on the Front and Back pill since recordPillFrames, by the
// property each moves ('transform' for a slide across).
function pillSlides(page) {
  return page.evaluate(() => window.testPillSlides);
}

// Waits until a recorder has finished and returns its frames.
async function framesRecorded(page) {
  await page.waitForFunction(() => window.testFramesDone === true);
  return page.evaluate(() => window.testFrames);
}

// True when a pill's share of the way is strictly between its two ends.
function isBetween(fraction) {
  return fraction > PILL_END_FRAC && fraction < 1 - PILL_END_FRAC;
}

// The middle of a slider's knob on the page, in CSS px. The knob runs from half its width in
// from the slider's left end (at its lowest value) to half its width in from its right end.
function knobMiddle(slider) {
  return slider.evaluate((input, knobPx) => {
    const box = input.getBoundingClientRect();
    const fraction = (input.value - input.min) / (input.max - input.min);
    const x = box.left + knobPx / 2 + (box.width - knobPx) * fraction;
    return { x, y: box.top + box.height / 2 };
  }, KNOB_PX);
}

// The height of a slider's knob as the screen shows it now, in CSS px: the run of white pixels
// down a screenshot of the column through its middle. The knob is drawn by the browser itself
// (a range input's thumb), so its size can't be read from the page, only from the picture.
async function knobHeightPx(page, slider) {
  const middle = await knobMiddle(slider);
  const picture = await page.screenshot({
    clip: { x: middle.x - 1, y: middle.y - KNOB_REACH_PX, width: 2, height: KNOB_REACH_PX * 2 },
  });
  return page.evaluate(async ({ data, whiteMin, reachPx }) => {
    const bytes = Uint8Array.from(atob(data), character => character.charCodeAt(0));
    const bitmap = await createImageBitmap(new Blob([bytes], { type: 'image/png' }));
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(bitmap, 0, 0);
    const column = Math.floor(bitmap.width / 2);
    let whiteRows = 0;
    for (let y = 0; y < bitmap.height; y++) {
      const pixel = ctx.getImageData(column, y, 1, 1).data;
      if (pixel[0] > whiteMin && pixel[1] > whiteMin && pixel[2] > whiteMin) whiteRows++;
    }
    return whiteRows * (reachPx * 2) / bitmap.height;
  }, { data: picture.toString('base64'), whiteMin: KNOB_WHITE_MIN, reachPx: KNOB_REACH_PX });
}

// The share of pixels (0 to 1) that differ between two screenshots of the same size (PNG
// buffers), counting a pixel when any of its red, green or blue differs by more than
// SCREEN_CHANNEL_SLACK. A redraw of the photo can move a few anti-aliased pixels by a shade with
// nothing a person would see as a change, so an exact comparison of the files is too strict.
function screenDifference(page, before, after) {
  return page.evaluate(async ({ first, second, slack }) => {
    const pixelsOf = async data => {
      const bytes = Uint8Array.from(atob(data), character => character.charCodeAt(0));
      const bitmap = await createImageBitmap(new Blob([bytes], { type: 'image/png' }));
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(bitmap, 0, 0);
      return ctx.getImageData(0, 0, bitmap.width, bitmap.height).data;
    };
    const firstPixels = await pixelsOf(first);
    const secondPixels = await pixelsOf(second);
    if (firstPixels.length !== secondPixels.length) return 1;
    let differing = 0;
    for (let offset = 0; offset < firstPixels.length; offset += 4) {
      for (let channel = 0; channel < 3; channel++) {
        if (Math.abs(firstPixels[offset + channel] - secondPixels[offset + channel]) > slack) {
          differing++;
          break;
        }
      }
    }
    return differing / (firstPixels.length / 4);
  }, {
    first: before.toString('base64'),
    second: after.toString('base64'),
    slack: SCREEN_CHANNEL_SLACK,
  });
}

// Starts recording every change to a progress line (by its id): in window.testProgress,
// { scale, isHidden } per change, with scale the share of its width it shows (0 to 1).
function recordProgress(page, lineId) {
  return page.evaluate(id => {
    const line = document.getElementById(id);
    window.testProgress = [];
    const note = () => {
      const scale = new DOMMatrix(getComputedStyle(line).transform).a;
      window.testProgress.push({ scale, isHidden: line.hidden });
    };
    new MutationObserver(note).observe(line, { attributes: true });
  }, lineId);
}

// The changes recordProgress has seen.
function progressRecorded(page) {
  return page.evaluate(() => window.testProgress);
}

module.exports = {
  holdFinger,
  recordSheetFrames,
  recordPillFrames,
  framesRecorded,
  pillSlides,
  isBetween,
  knobMiddle,
  knobHeightPx,
  screenDifference,
  recordProgress,
  progressRecorded,
};
