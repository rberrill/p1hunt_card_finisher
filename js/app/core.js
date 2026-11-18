/* =====================================================================
   js/app/core.js: the namespace (CF), URL overrides of CONFIG, the theme, DOM handles,
   small helpers, the app state object and toasts.
   Shell modules share one namespace, CF (created here). Names from core are destructured at
   the top of each module; anything from another module is called as CF.name.
   tests/selftest.js checks these boundaries.
   ===================================================================== */
(function () {
  'use strict';
  const CF = window.CF = {};

  const Mat3 = CardEngine.Mat3;
  const Vec2 = CardEngine.Vec2;
  const Quad = CardEngine.Quad;
  // A full turn in radians, for canvas arcs.
  const FULL_CIRCLE = Math.PI * 2;

  /* ---------------- CONFIG overrides from the URL ----------------
     Number and on/off settings only, inside CONFIG_LIMITS (the engine checks them); anything
     else in a link is ignored. */
  const params = new URLSearchParams(location.search);
  const overrides = [...params].filter(([key]) => key !== 'debug' && key !== 'selftest');
  if (params.has('debug')) CONFIG.debug = !['0', 'false'].includes(params.get('debug'));
  const { rejected } = CardEngine.applyConfigOverrides(CONFIG, overrides, CONFIG_LIMITS);
  if (rejected.length) {
    console.warn('[card-finisher] URL settings ignored (unknown, not a number / on-off setting, '
      + 'or outside its safe range):', rejected.join(', '));
  }
  for (const [name, value] of Object.entries(CONFIG.theme)) {
    document.documentElement.style.setProperty('--' + name, value);
  }

  const byId = id => document.getElementById(id);
  const elements = {
    stage: byId('stage'),
    canvas: byId('view'),
    empty: byId('empty'),
    // Built by mountToast() (below), once the parts have loaded.
    toast: null,
    panel: byId('panel'),
    mini: byId('mini'),
    fileInput: byId('fileInput'),
    editsInput: byId('editsInput'),
    debugPanel: byId('debugPanel'),
    root: byId('app'),
  };
  const clone = value => JSON.parse(JSON.stringify(value));

  // Text from a file or storage shown in a message: a string, cut short. (textContent keeps it
  // from being markup.)
  function shortText(text, max = 60) {
    if (typeof text !== 'string') return '';
    return text.length > max ? text.slice(0, max - 1) + '…' : text;
  }

  const nextFrame = () => new Promise(resolve => requestAnimationFrame(() => resolve()));

  function makeCanvas(width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }

  // A canvas's 2D context; `willRead` hints that getImageData will be called often.
  function context2d(canvas, willRead) {
    return canvas.getContext('2d', willRead ? { willReadFrequently: true } : undefined);
  }

  /* =====================================================================
     UI / STATE
     ===================================================================== */
  const app = {
    img: null,
    preview: null,
    thumb: null,
    work: null,
    state: null,
    geometry: null,
    // The perspective-corrected preview canvas, cached by its inputs (view.js).
    perspectivePreview: null,
    tab: 'perspective',
    selected: 0,
    views: { source: null, result: null, export: null, together: null },
    detection: {
      candidates: [],
      index: 0,
      isOnCandidate: false,
      wasMovedByHand: false,
      cornersAfterRun: '',
      last: null,
      running: 0,
      message: '',
      snapPoints: [],
      snapLines: [],
    },
    // Find card is armed: the next still tap on the photo finds the card there.
    findMode: false,
    snap: false,
    debugOverlay: !!CONFIG.debug,
    showGrid: true,
    dropper: null,
    compare: false,
    levelsPending: false,
    levelsDraft: null,
    // perspectivePreview with the Levels draft applied, cached (levels.js).
    perspectivePreviewLevels: null,
    previewMode: false,
    gesture: null,
    devicePixelRatio: 1,
    cssWidth: 0,
    cssHeight: 0,
    edgeCanvas: null,
    // Counts the photos that have opened, a side switch included; the session saves only for
    // the one that is open.
    loadId: 0,
    // Counts the opens that have started, so a slow one can tell a newer one took its place.
    // An open that fails leaves loadId alone: the open photo keeps being saved (ruling R31).
    openRequestId: 0,
    pendingSave: null,
    // Corner shots: the output ('sheet' or 'photos', a preference) and the files waiting for
    // "Share now" (corner-shots.js).
    cornerShotsOutput: null,
    pendingCorners: null,
    // The edit state (as JSON) of this photo's last finished export, for Next card.
    exportedState: null,
    // The open photo's original file (a pair decodes a side again from it).
    file: null,
    // A front + back pair (pair.js): { current, orient, other, exportedKey }, or null.
    pair: null,
    // The pair's output ('together' or 'separately', a preference).
    pairOutput: null,
    // True while the crop is the pair's 5:7 (paired, or a side kept after Unpair): the
    // remembered crop preset isn't overwritten until a preset is picked.
    isPairCrop: false,
    // What the next photo from the file picker is for: 'open', 'next' or 'addBack'.
    fileIntent: null,
  };

  // The CONFIG settings CardEngine.computeGeometry reads.
  const geometryConfig = () => ({
    maxOutputPx: CONFIG.maxOutputPx,
    maxOutputArea: CONFIG.maxOutputArea,
    maxBoundsFactor: CONFIG.maxBoundsFactor,
    minCornerDistPx: CONFIG.minCornerDistPx,
    fitPaddingPct: CONFIG.crop.fitPaddingPct,
    allowUpscale: CONFIG.export.allowUpscale,
    focalFactor: CONFIG.detect.focalFactor,
  });

  /* ---------- toasts ---------- */

  // How long a toast stays when its caller gives no duration, by kind, in ms: info 3 s, a
  // warning 5 s, an error 6 s (the plan's frames T1 to T3).
  const TOAST_DURATIONS_MS = { '': 3000, warn: 5000, error: 6000 };
  // How long a replaced message takes to fade out, in ms (css/app.css, .is-ghost; motion M10),
  // and the margin after it before its copy is removed if no transitionend comes.
  const TOAST_REPLACE_MS = 80;
  const TOAST_GHOST_FALLBACK_MS = TOAST_REPLACE_MS + 70;
  let toastTimer = 0;

  // Builds the toast (the Toast part) at the end of the stage, once; returns it. The parts
  // load after this file, so it is built when the page has loaded, or by the first toast if
  // that comes sooner. Being there before its first message lets a screen reader announce it.
  function mountToast() {
    if (!elements.toast) {
      elements.toast = CF.buildToast('toast');
      elements.stage.append(elements.toast);
    }
    return elements.toast;
  }

  // How far the toast must rise, in CSS px, to sit above an open sheet: the height of the
  // stage that sheet covers. 0 with no sheet open, and on a wide screen, where the options are
  // listed in the panel. The sheet's resting place is measured (its layer's bottom edge less
  // its own height), because it is still sliding up when `sheetopen` fires.
  function toastLiftPx() {
    if (!CF.phoneLayout || !CF.phoneLayout.matches) return 0;
    const sheet = document.querySelector('.sheet-layer.is-open .sheet');
    if (!sheet) return 0;
    const layerBottomPx = sheet.parentElement.getBoundingClientRect().bottom;
    const sheetTopPx = layerBottomPx - sheet.getBoundingClientRect().height;
    return Math.max(0, elements.stage.getBoundingClientRect().bottom - sheetTopPx);
  }

  // Puts the toast in its place: on the phone 36 px above the photo's bottom edge or, while a
  // sheet is open, 36 px above that sheet's top edge, which is 12 px above the grabber's or the
  // sheet's 24 px tab (css/app.css, .toast-message reads --toast-lift).
  function placeToast() {
    // A resize can fire before the parts have loaded: there is no toast to place yet.
    if (!CF.buildToast) return;
    mountToast().style.setProperty('--toast-lift', `${toastLiftPx()}px`);
  }

  // Shows a short message over the photo's bottom edge; a new one replaces the one that's up.
  // kind: '' (info) | 'warn' | 'error' sets its color and icon. It stays durationMs, or as
  // long as its kind does (TOAST_DURATIONS_MS).
  function toast(text, kind = '', durationMs = TOAST_DURATIONS_MS[kind]) {
    const toastEl = mountToast();
    if (toastEl.classList.contains('is-shown')) fadeOutCopy(toastEl);
    CF.updateToast(toastEl, { text, kind, isShown: false });
    placeToast();
    // Reading its size makes the browser take in the hidden state first, so each message
    // rises in afresh, from its place, even when it replaces one.
    toastEl.getBoundingClientRect();
    CF.updateToast(toastEl, { isShown: true });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hideToast, durationMs || TOAST_DURATIONS_MS['']);
  }

  // Leaves a copy of the message that is up where it is, fading out in 80 ms, while the toast
  // itself takes the new message and rises in over it. The live element keeps its id and gets
  // the new text at once, for callers, the tests and screen readers; the copy is hidden from
  // them and removed when its fade ends.
  function fadeOutCopy(toastEl) {
    const ghost = toastEl.cloneNode(true);
    ghost.removeAttribute('id');
    ghost.removeAttribute('role');
    ghost.removeAttribute('aria-live');
    ghost.setAttribute('aria-hidden', 'true');
    ghost.classList.add('is-ghost');
    toastEl.before(ghost);
    // Read a layout value so the copy is drawn opaque before its fade starts.
    ghost.getBoundingClientRect();
    ghost.classList.add('is-leaving');
    const removeGhost = () => ghost.remove();
    ghost.addEventListener('transitionend', removeGhost);
    setTimeout(removeGhost, TOAST_GHOST_FALLBACK_MS);
  }

  // Takes the toast down now.
  function hideToast() {
    clearTimeout(toastTimer);
    if (elements.toast) CF.updateToast(elements.toast, { isShown: false });
  }

  document.addEventListener('DOMContentLoaded', mountToast);
  // A sheet's events don't bubble, so they are caught on their way down to it.
  document.addEventListener('sheetopen', placeToast, true);
  document.addEventListener('sheetclose', placeToast, true);
  window.addEventListener('resize', placeToast);

  // Builds an element without parsing HTML:
  //   makeEl('button', { class: 'sheet-hint', id }, label).
  // Strings become text nodes, so data can never turn into markup (the self-test bans innerHTML).
  // An attribute that is null, undefined or false is left off; true sets it empty.
  function makeEl(tag, attributes, ...children) {
    const el = document.createElement(tag);
    for (const [name, value] of Object.entries(attributes || {})) {
      if (value == null || value === false) continue;
      el.setAttribute(name, value === true ? '' : String(value));
    }
    el.append(...children.flat().filter(child => child != null && child !== false));
    return el;
  }

  Object.assign(CF, {
    Mat3,
    Vec2,
    Quad,
    FULL_CIRCLE,
    params,
    byId,
    makeEl,
    elements,
    clone,
    shortText,
    nextFrame,
    makeCanvas,
    context2d,
    app,
    geometryConfig,
    toast,
    hideToast,
  });
})();
