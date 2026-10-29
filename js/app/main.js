/* =====================================================================
   js/app/main.js — Layout switching, self-test runner, init (wires events, test hook). Loaded last; calls init().
   Shell modules share one namespace, CF (created in core.js). Names from core are
   destructured below; anything from another module is called as CF.name.
   tests/selftest.js checks these boundaries.
   ===================================================================== */
(function (CF) {
  'use strict';
  const { E, params, els, app, toast } = CF;

  /* ---------- self-tests (?selftest=1) ---------- */
  async function runSelfTests() {
    const main = E.selfTest();
    console.group('[card-finisher] self-tests (main thread)'); console.table(main.results); console.groupEnd();
    let worker = null;
    if (CF.EngineWorker.worker && !CF.EngineWorker.failed) {
      try { worker = await CF.EngineWorker.call('selftest', {}); console.group('[card-finisher] self-tests (Web Worker)'); console.table(worker.results); console.groupEnd(); }
      catch (e) { console.error('worker self-test failed', e); }
    }
    const count = r => `${r.results.filter(x => x.pass).length}/${r.results.length}`;
    const msg = `Self-tests: main ${count(main)}` + (worker ? `, worker ${count(worker)}` : ', worker unavailable');
    toast(msg, main.passed && (!worker || worker.passed) ? '' : 'err', 8000);
    window.__selftest = { main, worker };
  }

  /* ---------- init ---------- */
  const phoneLayout = matchMedia('(max-width: 760px)');
  function placeLayout() {
    // Wide screens show every "More options" section open; phones start them closed.
    if (phoneLayout.matches) CF.collapseMore(); else document.querySelectorAll('details.more').forEach(d => { d.open = true; });
    CF.closeStepMenu();
  }

  function init() {
    els.root.dataset.tab = app.tab;
    document.querySelector('.brand').title = 'Version ' + CONFIG.appVersion;
    console.info(`[card-finisher] v${CONFIG.appVersion}`);
    CF.buildControls(); CF.bindControls();
    placeLayout(); phoneLayout.addEventListener('change', placeLayout);
    CF.EngineWorker.init();
    const onFile = (f, name) => CF.openFile(f, name);
    // On the Overlay step, a dropped or pasted image becomes the overlay; elsewhere it opens a new photo.
    const onDropOrPaste = (f, name) => app.tab === 'overlay' && app.img ? CF.addOverlayFile(f) : CF.openFile(f, name);
    CF.ImageSource.bindPicker(els.fileInput, onFile);
    CF.ImageSource.bindDrop(els.stage, onDropOrPaste);
    CF.ImageSource.bindPaste(onDropOrPaste);
    const c = els.canvas;
    c.addEventListener('pointerdown', CF.onPointerDown);
    c.addEventListener('pointermove', CF.onPointerMove);
    c.addEventListener('pointerup', CF.onPointerUp);
    c.addEventListener('pointercancel', CF.onPointerUp);
    c.addEventListener('wheel', CF.onWheel, { passive: false });
    c.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('gesturestart', e => e.preventDefault()); // stop iOS page zoom during pinch
    // iOS Safari: cancelling touchstart on the photo and on press-and-hold buttons stops the long-press
    // selection magnifier and callout. Pointer events still fire, so drags and holds work as before.
    const noTouchDefault = e => { if (e.cancelable) e.preventDefault(); };
    for (const el of [c, ...document.querySelectorAll('[data-nudge], [data-onudge]')]) el.addEventListener('touchstart', noTouchDefault, { passive: false });
    els.root.addEventListener('selectstart', e => { if (!e.target.closest || !e.target.closest('input, select, textarea')) e.preventDefault(); });
    window.addEventListener('keydown', CF.onKeyDown);
    window.addEventListener('keyup', e => { if (e.key.toLowerCase() === CONFIG.keys.compare) CF.setCompare(false); });
    window.addEventListener('blur', () => CF.setCompare(false));
    // Save the edits right away when the page is hidden or left (iOS may close a background tab).
    window.addEventListener('pagehide', () => CF.Session.flush());
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') CF.Session.flush(); });
    new ResizeObserver(CF.resizeCanvas).observe(els.stage);
    new ResizeObserver(() => CF.requestMini()).observe(els.mini);
    CF.resizeCanvas(); CF.syncUI();
    CF.offerResume(); CF.loadSavedOverlay();
    if (CONFIG.debug) CF.toggleDebugPanel(true);
    if (params.has('selftest')) runSelfTests();
    // PWA (phase two): register the service worker from its own file.
    // if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js');
    // Test hook (not used by the UI): lets automated checks drive the app.
    window.__straightener = { app, openFile: CF.openFile, runDetect: CF.runDetect, renderFull: CF.renderFull, setTab: CF.setTab, commit: CF.commit, undo: CF.undo, redo: CF.redo, stateChanged: CF.stateChanged, EngineWorker: CF.EngineWorker, Detector: CF.Detector, draw: CF.draw, Session: CF.Session, resumeSession: CF.resumeSession, shareFile: CF.shareFile, Exporter: CF.Exporter };
  }

  Object.assign(CF, { phoneLayout });

  init();
})(window.CF);
