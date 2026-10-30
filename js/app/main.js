/* =====================================================================
   js/app/main.js: the layout switch, the self-test runner, and init (wires the events and the
   test hook). Loaded last; calls init().
   Shell modules share one namespace, CF (created in core.js). Names from core are
   destructured below; anything from another module is called as CF.name.
   tests/selftest.js checks these boundaries.
   ===================================================================== */
(function (CF) {
  'use strict';
  const { params, elements, app, toast } = CF;

  /* ---------- self-tests (?selftest=1) ---------- */

  // Runs the engine self-tests on the main thread and in the worker; the toast gives both counts.
  async function runSelfTests() {
    const main = CardEngine.selfTest();
    console.group('[card-finisher] self-tests (main thread)');
    console.table(main.results);
    console.groupEnd();
    let worker = null;
    if (CF.EngineWorker.worker && !CF.EngineWorker.failed) {
      try {
        worker = await CF.EngineWorker.call('selftest', {});
        console.group('[card-finisher] self-tests (Web Worker)');
        console.table(worker.results);
        console.groupEnd();
      } catch (error) {
        console.error('worker self-test failed', error);
      }
    }
    const count = run => {
      const passed = run.results.filter(result => result.pass).length;
      return `${passed}/${run.results.length}`;
    };
    const workerCount = worker ? `, worker ${count(worker)}` : ', worker unavailable';
    const message = `Self-tests: main ${count(main)}` + workerCount;
    const passed = main.passed && (!worker || worker.passed);
    toast(message, passed ? '' : 'error', 8000);
    window.__selftest = { main, worker };
  }

  /* ---------- init ---------- */
  const phoneLayout = matchMedia('(max-width: 760px)');

  // Wide screens show every "More options" section open; phones start them closed.
  function placeLayout() {
    if (phoneLayout.matches) {
      CF.collapseMore();
    } else {
      document.querySelectorAll('details.more').forEach(details => {
        details.open = true;
      });
    }
    CF.closeStepMenu();
  }

  function bindPhotoInput() {
    const onFile = (file, name) => CF.openFile(file, name);
    // On the Overlay step, a dropped or pasted image becomes the overlay; elsewhere it opens a
    // new photo.
    const onDropOrPaste = (file, name) => {
      if (app.tab === 'overlay' && app.img) CF.addOverlayFile(file);
      else CF.openFile(file, name);
    };
    CF.ImageSource.bindPicker(elements.fileInput, onFile);
    CF.ImageSource.bindDrop(elements.stage, onDropOrPaste);
    CF.ImageSource.bindPaste(onDropOrPaste);
  }

  function bindCanvasInput() {
    const canvas = elements.canvas;
    canvas.addEventListener('pointerdown', CF.onPointerDown);
    canvas.addEventListener('pointermove', CF.onPointerMove);
    canvas.addEventListener('pointerup', CF.onPointerUp);
    canvas.addEventListener('pointercancel', CF.onPointerUp);
    canvas.addEventListener('wheel', CF.onWheel, { passive: false });
    canvas.addEventListener('contextmenu', event => event.preventDefault());
    // Stop iOS page zoom during a pinch.
    document.addEventListener('gesturestart', event => event.preventDefault());
    // iOS Safari: cancelling touchstart on the photo and on press-and-hold buttons stops the
    // long-press selection magnifier and callout. Pointer events still fire, so drags and holds
    // work as before.
    const cancelTouchDefault = event => {
      if (event.cancelable) event.preventDefault();
    };
    const holdButtons = document.querySelectorAll('[data-nudge], [data-overlay-nudge]');
    const holdTargets = [canvas, ...holdButtons];
    for (const el of holdTargets) {
      el.addEventListener('touchstart', cancelTouchDefault, { passive: false });
    }
    elements.root.addEventListener('selectstart', event => {
      const isField = event.target.closest && event.target.closest('input, select, textarea');
      if (!isField) event.preventDefault();
    });
  }

  function bindWindowEvents() {
    window.addEventListener('keydown', CF.onKeyDown);
    window.addEventListener('keyup', event => {
      if (event.key.toLowerCase() === CONFIG.keys.compare) CF.setCompare(false);
    });
    window.addEventListener('blur', () => CF.setCompare(false));
    // Save the edits right away when the page is hidden or left (iOS may close a background tab).
    window.addEventListener('pagehide', () => CF.Session.flush());
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') CF.Session.flush();
    });
    new ResizeObserver(CF.resizeCanvas).observe(elements.stage);
    new ResizeObserver(() => CF.requestMini()).observe(elements.mini);
  }

  function init() {
    elements.root.dataset.tab = app.tab;
    document.querySelector('.brand').title = 'Version ' + CONFIG.appVersion;
    console.info(`[card-finisher] v${CONFIG.appVersion}`);
    CF.buildControls();
    CF.bindControls();
    placeLayout();
    phoneLayout.addEventListener('change', placeLayout);
    CF.EngineWorker.init();
    bindPhotoInput();
    bindCanvasInput();
    bindWindowEvents();
    CF.resizeCanvas();
    CF.syncUI();
    CF.offerResume();
    CF.loadSavedOverlay();
    if (CONFIG.debug) CF.toggleDebugPanel(true);
    if (params.has('selftest')) runSelfTests();
    // PWA (phase two): register the service worker from its own file.
    // if ('serviceWorker' in navigator && location.protocol === 'https:') {
    //   navigator.serviceWorker.register('sw.js');
    // }
    // The test hook (not used by the UI): lets automated checks drive the app.
    window.__straightener = {
      app,
      openFile: CF.openFile,
      runDetect: CF.runDetect,
      renderFull: CF.renderFull,
      setTab: CF.setTab,
      commit: CF.commit,
      undo: CF.undo,
      redo: CF.redo,
      stateChanged: CF.stateChanged,
      EngineWorker: CF.EngineWorker,
      Detector: CF.Detector,
      draw: CF.draw,
      Session: CF.Session,
      resumeSession: CF.resumeSession,
      shareFile: CF.shareFile,
      Exporter: CF.Exporter,
    };
  }

  Object.assign(CF, { phoneLayout });

  init();
})(window.CF);
