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
    toast: byId('toast'),
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
    views: { source: null, result: null, export: null },
    detection: {
      candidates: [],
      index: 0,
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
    loadId: 0,
    pendingSave: null,
    // The edit state (as JSON) of this photo's last finished export, for Next card.
    exportedState: null,
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

  let toastTimer = 0;
  // Shows a short message; kind '' | 'warn' | 'error' sets its color.
  function toast(text, kind = '', durationMs = 3000) {
    const toastEl = elements.toast;
    toastEl.textContent = text;
    toastEl.className = 'toast show ' + kind;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hideToast, durationMs);
  }
  function hideToast() {
    elements.toast.classList.remove('show');
  }

  // Builds an element without parsing HTML:
  //   makeEl('button', { class: 'chip', 'data-crop': id }, label).
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
