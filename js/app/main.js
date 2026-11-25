/* =====================================================================
   js/app/main.js: the layout switch, the self-test runner, and init (wires the events and the
   test hook). Loaded last; calls init().
   Shell modules share one namespace, CF (created in core.js). Names from core are
   destructured below; anything from another module is called as CF.name.
   tests/selftest.js checks these boundaries.
   ===================================================================== */
(function (CF) {
  'use strict';
  const { params, byId, elements, app, toast } = CF;

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

  function bindPhotoInput() {
    // The picker's photo is for what opened it (Open, Next card or Add back).
    const onFile = (file, name) => {
      const intent = app.fileIntent || 'open';
      app.fileIntent = null;
      CF.receivePhoto(file, name, intent);
    };
    // Whether a dropped or pasted picture is a logo here: on the Overlay step, with a photo open.
    const isLogoStep = () => app.tab === 'overlay' && !!app.img;
    // On the Overlay step, a dropped or pasted image becomes the overlay; elsewhere it opens a
    // new photo (asking first while a pair is open). While an export runs it becomes neither:
    // receivePhoto refuses it, on Overlay too, with the message a photo gets (ruling R32).
    const onDropOrPaste = (file, name) => {
      const isLogo = isLogoStep() && !app.exporting;
      if (isLogo) CF.addOverlayFile(file);
      else CF.receivePhoto(file, name, 'open');
    };
    // On the Overlay step a dropped file whose type isn't a picture type is taken by its name
    // when Add logo would take it (ruling R19). bindDrop already takes a JPEG, PNG or WebP by
    // its name on every step, so what this adds is an SVG, and only where a drop is a logo.
    const isLogoDrop = file => isLogoStep() && CF.isLogoFile(file);
    CF.ImageSource.bindPicker(elements.fileInput, onFile);
    CF.ImageSource.bindDrop(elements.stage, onDropOrPaste, isLogoDrop);
    CF.ImageSource.bindPaste(onDropOrPaste);
    bindStrayDrop();
  }

  // A file dropped anywhere but the photo area (the panel, the top bar) would make the browser
  // open it in place of the app, losing the edits. The photo area's own handlers run first and
  // cancel the event; anything they leave is cancelled here, with the no-drop cursor.
  function bindStrayDrop() {
    window.addEventListener('dragover', event => {
      if (event.defaultPrevented) return;
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'none';
    });
    window.addEventListener('drop', event => {
      if (!event.defaultPrevented) event.preventDefault();
    });
  }

  function bindCanvasInput() {
    const canvas = elements.canvas;
    canvas.addEventListener('pointerdown', CF.onPointerDown);
    canvas.addEventListener('pointermove', CF.onPointerMove);
    canvas.addEventListener('pointerup', CF.onPointerUp);
    canvas.addEventListener('pointercancel', CF.onPointerCancel);
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
    const holdButtons = document.querySelectorAll('[data-nudge]');
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
    console.info(`[card-finisher] v${CONFIG.appVersion}`);
    CF.buildControls();
    CF.bindControls();
    document.querySelector('.top-bar-brand').title = 'Version ' + CONFIG.appVersion;
    // Also in Export's options, where a phone can read it.
    byId('versionInfo').textContent = 'Card Finisher ' + CONFIG.appVersion;
    CF.placeLayout();
    phoneLayout.addEventListener('change', CF.placeLayout);
    CF.EngineWorker.init();
    bindPhotoInput();
    bindCanvasInput();
    bindWindowEvents();
    CF.resizeCanvas();
    CF.syncUI();
    CF.offerResume();
    CF.loadSavedOverlay();
    if (CONFIG.debug) CF.toggleDebugPanel(true);
    // ?selftest=0 means off (ruling R28); any other value, or none, runs them.
    if (params.has('selftest') && params.get('selftest') !== '0') runSelfTests();
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
