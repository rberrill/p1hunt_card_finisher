// Helpers for the Messages cases (tests/automation/messages.spec.js): a recorder of every
// message the toast shows over the photo (its words, its kind as drawn, when it showed and
// when it went), the status line that takes the row above a step's controls, and the few
// stand-ins a case needs for a failure no control can bring about (a refusing engine, an
// encoder that hands back nothing, a refusing clipboard). Like app.js, they read the app's
// state only to check a result; each stand-in says why it is one.
'use strict';
const fs = require('fs');
const { expect } = require('@playwright/test');

// What each kind of toast looks like: its background as the browser computes it and the icon
// it leads with ('' for none). The colors are the stylesheet's --ink (white), --warn (amber)
// and --accent (P1Hunt red).
const TOAST_LOOKS = {
  info: { background: 'rgb(242, 242, 243)', icon: '' },
  warn: { background: 'rgb(227, 179, 65)', icon: 'warning' },
  error: { background: 'rgb(229, 50, 45)', icon: 'error' },
};
// What each kind of status line's icon looks like: the icon and its color (--quiet grey,
// --warn amber, --accent red).
const STATUS_LOOKS = {
  info: { color: 'rgb(168, 171, 178)', icon: 'info' },
  warn: { color: 'rgb(227, 179, 65)', icon: 'warning' },
  error: { color: 'rgb(229, 50, 45)', icon: 'error' },
};
// How long a case waits for a message to show, in ms.
const MESSAGE_TIMEOUT_MS = 20000;

// Records every message the toast shows, from before the app loads, into window.testMessages:
// [{ text, kind, icon, background, shownAtMs, hiddenAtMs }] on the page's clock (ms). kind is
// 'info', 'warn' or 'error' (the toast's own class); icon the name of the icon it leads with
// ('' for none); hiddenAtMs stays null while it shows. A message that replaces another at once
// is its own entry. Only watches: the toast works as it always does.
async function watchMessages(page) {
  await page.addInitScript(() => {
    window.testMessages = [];
    const iconName = toast => {
      const path = toast.querySelector('.toast-icon path');
      if (!path) return '';
      const icons = window.CF.ICONS;
      return Object.keys(icons).find(name => icons[name] === path.getAttribute('d')) || '?';
    };
    const kindOf = toast => {
      if (toast.classList.contains('is-error')) return 'error';
      if (toast.classList.contains('is-warn')) return 'warn';
      return 'info';
    };
    const note = toast => {
      const nowMs = performance.now();
      const last = window.testMessages[window.testMessages.length - 1];
      const isShown = toast.classList.contains('is-shown');
      if (!isShown) {
        if (last && last.hiddenAtMs === null) last.hiddenAtMs = nowMs;
        return;
      }
      const text = toast.querySelector('.toast-text').textContent;
      const kind = kindOf(toast);
      const isSame = last && last.hiddenAtMs === null && last.text === text && last.kind === kind;
      if (isSame) return;
      // A message replaced at once ends at the moment the new one shows.
      if (last && last.hiddenAtMs === null) last.hiddenAtMs = nowMs;
      window.testMessages.push({
        text,
        kind,
        icon: iconName(toast),
        background: getComputedStyle(toast).backgroundColor,
        shownAtMs: nowMs,
        hiddenAtMs: null,
      });
    };
    // A message replaced at once leaves a fading copy of itself beside the toast: each copy's
    // words, as it is added, go into window.testFadingCopies.
    window.testFadingCopies = [];
    const noteCopies = records => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node.classList && node.classList.contains('is-ghost')) {
            window.testFadingCopies.push(node.querySelector('.toast-text').textContent);
          }
        }
      }
    };
    // The toast is built when the page has loaded; the watch starts as soon as it is there.
    const watchToast = () => {
      const toast = document.getElementById('toast');
      if (!toast) return false;
      new MutationObserver(() => note(toast)).observe(toast, {
        attributes: true,
        childList: true,
        subtree: true,
        characterData: true,
      });
      new MutationObserver(noteCopies).observe(toast.parentElement, { childList: true });
      return true;
    };
    const waitForToast = new MutationObserver(() => {
      if (watchToast()) waitForToast.disconnect();
    });
    waitForToast.observe(document, { childList: true, subtree: true });
  });
}

// The messages watchMessages has recorded so far.
function messagesSoFar(page) {
  return page.evaluate(() => window.testMessages.slice());
}

// The words of each fading copy a replaced message has left so far (see watchMessages).
function fadingCopies(page) {
  return page.evaluate(() => window.testFadingCopies.slice());
}

// Turns a string or RegExp into something page.evaluate can carry.
function portable(wanted) {
  if (wanted instanceof RegExp) return { source: wanted.source, flags: wanted.flags };
  return { text: wanted };
}

// Waits until the toast has shown a message whose words are `wanted` (a string, exactly, or a
// RegExp), and returns its record (see watchMessages).
async function waitForMessage(page, wanted, timeoutMs = MESSAGE_TIMEOUT_MS) {
  const handle = await page.waitForFunction(want => {
    const matches = text => (want.source === undefined
      ? text === want.text
      : new RegExp(want.source, want.flags).test(text));
    return window.testMessages.find(message => matches(message.text)) || false;
  }, portable(wanted), { timeout: timeoutMs });
  return handle.jsonValue();
}

// Expects a recorded message to have the look of its kind: 'info' (white, no icon), 'warn'
// (amber, a triangle) or 'error' (red, a circle).
function expectKind(message, kind) {
  const look = TOAST_LOOKS[kind];
  expect({ kind: message.kind, icon: message.icon, background: message.background }).toEqual({
    kind,
    icon: look.icon,
    background: look.background,
  });
}

// How long a recorded message stayed up, in ms (null while it still shows).
function shownForMs(message) {
  return message.hiddenAtMs === null ? null : message.hiddenAtMs - message.shownAtMs;
}

// The status line `id` (perspectiveStatus, overlayStatus) as it is now: { isShown, text, kind,
// icon, iconColor, action }, with action the label of its button ('' when hidden).
function statusNow(page, id) {
  return page.evaluate(statusId => {
    const status = document.getElementById(statusId);
    const path = status.querySelector('.status-icon path');
    const icons = window.CF.ICONS;
    const icon = path ? Object.keys(icons).find(name => icons[name] === path.getAttribute('d'))
      : '';
    const kinds = ['info', 'warn', 'error'];
    const button = status.querySelector('.action-button');
    const isActionShown = !!button && !button.hidden && getComputedStyle(button).display !== 'none';
    return {
      isShown: !status.hidden,
      text: status.querySelector('.status-text').textContent,
      kind: kinds.find(kind => status.classList.contains(`is-${kind}`)) || '',
      icon: icon || '',
      iconColor: getComputedStyle(status.querySelector('.status-icon')).color,
      action: isActionShown ? button.textContent.trim() : '',
    };
  }, id);
}

// Expects the status line `id` to show `text` with the look of `kind` ('info': a grey info
// icon; 'warn': an amber triangle; 'error': a red circle). It waits for the words.
async function expectStatus(page, id, text, kind) {
  await expect.poll(async () => (await statusNow(page, id)).text).toBe(text);
  const status = await statusNow(page, id);
  const look = STATUS_LOOKS[kind];
  expect({
    isShown: status.isShown,
    kind: status.kind,
    icon: status.icon,
    iconColor: status.iconColor,
  }).toEqual({ isShown: true, kind, icon: look.icon, iconColor: look.color });
}

// Records every message the status line `id` shows, in order, as [{ text, kind }] in
// window.testStatuses, from now on (statusesSoFar reads it). A message that lasts a moment
// (Detecting…) is caught.
function watchStatus(page, id) {
  return page.evaluate(statusId => {
    const status = document.getElementById(statusId);
    window.testStatuses = [];
    const note = () => {
      if (status.hidden) return;
      const text = status.querySelector('.status-text').textContent;
      const kind = ['info', 'warn', 'error'].find(name => status.classList.contains(`is-${name}`));
      const last = window.testStatuses[window.testStatuses.length - 1];
      if (!last || last.text !== text) window.testStatuses.push({ text, kind });
    };
    new MutationObserver(note).observe(status, {
      attributes: true,
      childList: true,
      characterData: true,
      subtree: true,
    });
  }, id);
}

// The messages watchStatus has seen, in order.
function statusesSoFar(page) {
  return page.evaluate(() => window.testStatuses.slice());
}

// Makes card detection fail from now on, as an engine that throws would: the detector
// rejects with an Error whose message is `errorText`. No photo or control makes detection
// throw, so this one change is made in the page's code.
function refuseDetection(page, errorText) {
  return page.evaluate(text => {
    window.CF.Detector.detect = async () => {
      throw new Error(text);
    };
  }, errorText);
}

// Makes every image encoding fail from now on, as a browser that runs out of memory for a big
// canvas does: the canvas hands back no file. No control can make the browser fail to encode,
// so this one change is made in the page's code.
function failEncoding(page) {
  return page.evaluate(() => {
    HTMLCanvasElement.prototype.toBlob = function noFile(callback) {
      setTimeout(() => callback(null), 0);
    };
  });
}

// Makes each image encoding take `delayMs` longer from now on, as a slow phone's does, so a
// case can act while an export runs. The files themselves are unchanged.
function slowEncoding(page, delayMs) {
  return page.evaluate(waitMs => {
    const encode = HTMLCanvasElement.prototype.toBlob;
    HTMLCanvasElement.prototype.toBlob = function slowToBlob(callback, ...rest) {
      setTimeout(() => encode.call(this, callback, ...rest), waitMs);
    };
  }, delayMs);
}

// Makes the clipboard refuse every write, before the app loads, as a browser that blocks the
// page from it does: an image write and a text write both reject with `errorText`. Copy still
// shows (the browser still has image copying).
async function refuseClipboard(page, errorText) {
  await page.addInitScript(text => {
    const refuse = async () => {
      throw new DOMException(text, 'NotAllowedError');
    };
    Clipboard.prototype.write = refuse;
    Clipboard.prototype.writeText = refuse;
  }, errorText);
}

// Makes the engine report the corner fault `reason` for the edits from now on, as it does for
// corners it can't use: CardEngine.computeGeometry answers { ok: false, reason }. Four of the
// engine's faults can't be brought about with the controls (corners that are missing, a
// perspective that can't be solved, an empty crop, a frame that can't be inverted), so this
// one change is made in the page's code, and the screen is updated after it.
// clearGeometryFault ends it.
function faultGeometry(page, reason) {
  return page.evaluate(faultReason => {
    if (!window.testComputeGeometry) {
      window.testComputeGeometry = window.CardEngine.computeGeometry;
      window.CardEngine.computeGeometry = (...args) => (window.testGeometryFault
        ? { ok: false, reason: window.testGeometryFault }
        : window.testComputeGeometry(...args));
    }
    window.testGeometryFault = faultReason;
    window.CF.stateChanged();
  }, reason);
}

// Ends faultGeometry's fault and updates the screen.
function clearGeometryFault(page) {
  return page.evaluate(() => {
    window.testGeometryFault = null;
    window.CF.stateChanged();
  });
}

// A file payload for a picker holding `data` as JSON (or, for a string, as it is), named
// `name`.
function jsonFile(name, data) {
  const text = typeof data === 'string' ? data : JSON.stringify(data);
  return { name, mimeType: 'application/json', buffer: Buffer.from(text) };
}

// Reads a saved edits file back as an object.
function readEdits(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

// The notes under Export's size line that can be seen: [{ text, icon, iconColor }].
function exportNotesNow(page) {
  return page.evaluate(() => {
    const icons = window.CF.ICONS;
    return [...document.querySelectorAll('#exportMessage .export-note')]
      .filter(note => note.offsetParent !== null)
      .map(note => {
        const path = note.querySelector('.icon path');
        return {
          text: note.querySelector('.export-note-text').textContent,
          icon: path ? Object.keys(icons).find(name => icons[name] === path.getAttribute('d'))
            : '',
          iconColor: getComputedStyle(note.querySelector('.icon')).color,
        };
      });
  });
}

// The paragraphs of a step's tips that can be seen, in order (Tips rows: #perspectiveTips,
// #rotateTips, …; the body follows the row's list, in the same group).
function visibleTips(page, rowId) {
  return page.evaluate(id => {
    const group = document.getElementById(id).closest('.sheet-tips-group');
    const body = group.querySelector('.sheet-tips');
    return [...body.querySelectorAll('.sheet-hint')]
      .filter(hint => hint.offsetParent !== null)
      .map(hint => hint.textContent);
  }, rowId);
}

module.exports = {
  TOAST_LOOKS,
  STATUS_LOOKS,
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
  failEncoding,
  slowEncoding,
  refuseClipboard,
  faultGeometry,
  clearGeometryFault,
  jsonFile,
  readEdits,
  exportNotesNow,
  visibleTips,
};
