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

  /* ---------------- CONFIG overrides from the URL ----------------
     Number and on/off settings only (the engine checks them); anything else in a link is ignored. */
  const params = new URLSearchParams(location.search);
  const overrides = [...params].filter(([k]) => k !== 'debug' && k !== 'selftest');
  if (params.has('debug')) CONFIG.debug = !['0', 'false'].includes(params.get('debug'));
  const { rejected } = E.applyConfigOverrides(CONFIG, overrides);
  if (rejected.length) console.warn('[card-finisher] URL settings ignored (unknown, or not a number / on-off setting):', rejected.join(', '));
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

  // Builds an element without parsing HTML: h('button', { class: 'chip', 'data-crop': id }, label).
  // Strings become text nodes, so data can never turn into markup (the self-test bans innerHTML).
  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) if (v != null && v !== false) el.setAttribute(k, v === true ? '' : String(v));
    el.append(...kids.flat().filter(k => k != null && k !== false));
    return el;
  }

  Object.assign(CF, { E, M3, Quad, params, $, h, els, clone, nextFrame, makeCanvas, ctx2d, app, geoCfg, toast, hideToast });
})();
