// Helpers for the edits-file cases (tests/catalog/edits-files.md) that the shared
// edits-drop-keys.js doesn't have: the committed files in tests/fixtures/ that the cases name,
// the toast's text as the screen shows it (for the one combined warning of ruling R12), Undo
// and Redo as the top bar shows them, and the green logo as it is drawn on the photo.
'use strict';
const fs = require('fs');
const path = require('path');
const { logoOnPage, colorOnPage } = require('./overlay.js');

// The folder of files the cases name: edits files changed by hand, logos, a file that isn't JSON.
const FIXTURES = path.resolve(__dirname, '../../fixtures');
// The type a fixture is handed over with, by its extension.
const FIXTURE_TYPES = {
  '.json': 'application/json',
  '.png': 'image/png',
  '.gif': 'image/gif',
};
// A color channel within this much of pure green's counts as the green logo (0 to 255).
const GREEN_TOLERANCE = 40;
// The largest value a color channel can have.
const CHANNEL_MAX = 255;

// The full path of a file in tests/fixtures/.
const fixturePath = name => path.join(FIXTURES, name);

// A file in tests/fixtures/ as a file payload for a picker: { name, mimeType, buffer }.
function fixtureFile(name) {
  const mimeType = FIXTURE_TYPES[path.extname(name).toLowerCase()] || 'application/octet-stream';
  return { name, mimeType, buffer: fs.readFileSync(fixturePath(name)) };
}

// A fixture edits file read as JSON, to change for a case that must make a file too large to
// commit.
const fixtureEdits = name => JSON.parse(fs.readFileSync(fixturePath(name), 'utf8'));

// The toast's text as the screen shows it, with every run of white space (a line break between
// two lines too) made one space, so lines on separate rows and lines in one run read the same.
function toastShownText(page) {
  return page.locator('#toast .toast-text')
    .evaluate(el => el.innerText.replace(/\s+/g, ' ').trim());
}

// Whether Undo and Redo in the top bar are greyed out now: { undo, redo }, true when greyed.
function undoRedoGreyed(page) {
  return page.evaluate(() => ({
    undo: document.getElementById('btnUndo').disabled,
    redo: document.getElementById('btnRedo').disabled,
  }));
}

// True when a color ([r, g, b], 0 to 255) is the green logo's.
const isGreen = color => Math.abs(color[0]) < GREEN_TOLERANCE
  && Math.abs(color[1] - CHANNEL_MAX) < GREEN_TOLERANCE
  && Math.abs(color[2]) < GREEN_TOLERANCE;

// True when a logo is drawn on the photo in the green logo's color (tests/fixtures/
// green-logo.png). It looks a quarter of the logo's width left of its middle, where no snap
// ring is drawn.
async function isLogoGreen(page) {
  const logo = await logoOnPage(page);
  if (!logo) return false;
  const point = { x: logo.middle.x - logo.width / 4, y: logo.middle.y };
  return isGreen(await colorOnPage(page, point));
}

module.exports = {
  fixturePath,
  fixtureFile,
  fixtureEdits,
  toastShownText,
  undoRedoGreyed,
  isLogoGreen,
};
