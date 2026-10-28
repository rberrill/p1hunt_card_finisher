/* =====================================================================
   js/app/core.js — Namespace (CF), URL overrides of CONFIG, theme, DOM handles, small helpers, the app state object, toasts.
   Shell modules share one namespace, CF (created in core.js). Names from core are
   destructured below; anything from another module is called as CF.name.
   tests/selftest.js checks these boundaries.
   ===================================================================== */
(function () {
  'use strict';
  const CF = window.CF = {};

  const E = CardEngine, M3 = E.M3, Quad = E.Quad;

  /* ---------------- CONFIG overrides from the URL ---------------- */
  const params = new URLSearchParams(location.search);
  for (const [k, v] of params) {
    if (k === 'debug') { CONFIG.debug = v !== '0' && v !== 'false'; continue; }
    if (k === 'selftest') continue;
    const path = k.split('.'); let o = CONFIG;
    for (let i = 0; i < path.length - 1 && o; i++) o = typeof o[path[i]] === 'object' ? o[path[i]] : null;
    const last = path[path.length - 1];
    if (!o || !(last in o)) { console.warn('[card-finisher] Unknown CONFIG key in URL:', k); continue; }
    const cur = o[last];
    o[last] = typeof cur === 'number' ? Number(v) : typeof cur === 'boolean' ? (v === '1' || v === 'true') : v;
  }
  for (const [k, v] of Object.entries(CONFIG.theme)) document.documentElement.style.setProperty('--' + k, v);

  const $ = id => document.getElementById(id);
  const els = {
    stage: $('stage'), canvas: $('view'), empty: $('empty'), toast: $('toast'), panel: $('panel'), mini: $('mini'),
    fileInput: $('fileInput'), editsInput: $('editsInput'), debugPanel: $('debugPanel'), root: $('app'),
  };
  const clone = o => JSON.parse(JSON.stringify(o));
  const nextFrame = () => new Promise(r => requestAnimationFrame(() => r()));
  const makeCanvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const ctx2d = (c, read) => c.getContext('2d', read ? { willReadFrequently: true } : undefined);

  /* =====================================================================
     UI / STATE
     ===================================================================== */
  const app = {
    img: null, preview: null, thumb: null, work: null,
    state: null, geo: null, pPreview: null,
    tab: 'perspective', selected: 0,
    views: { source: null, result: null, export: null },
    detection: { candidates: [], index: 0, seed: null, last: null, running: 0, msg: '', snapPts: [], snapLines: [] },
    seedMode: false, snap: false, debugOverlay: !!CONFIG.debug, showGrid: true,
    dropper: null, compare: false, levelsPending: false, levelsDraft: null, ppLevels: null,
    gesture: null, dpr: 1, cssW: 0, cssH: 0, edgeCanvas: null,
    loadId: 0, pendingSave: null,
  };
  const geoCfg = () => ({
    maxOutputPx: CONFIG.maxOutputPx, maxOutputArea: CONFIG.maxOutputArea, maxBoundsFactor: CONFIG.maxBoundsFactor,
    minCornerDistPx: CONFIG.minCornerDistPx, fitPaddingPct: CONFIG.crop.fitPaddingPct, allowUpscale: CONFIG.export.allowUpscale,
    focalFactor: CONFIG.detect.focalFactor,
  });

  let toastTimer = 0;
  function toast(text, kind = '', ms = 3000) {
    const t = els.toast; t.textContent = text; t.className = 'toast show ' + kind;
    clearTimeout(toastTimer); toastTimer = setTimeout(hideToast, ms);
  }
  function hideToast() { els.toast.classList.remove('show'); }

  Object.assign(CF, { E, M3, Quad, params, $, els, clone, nextFrame, makeCanvas, ctx2d, app, geoCfg, toast, hideToast });
})();
