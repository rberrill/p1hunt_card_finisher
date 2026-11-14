/* =====================================================================
   js/app/shell.js: the steps and the step menu, binding and syncing the controls
   of every step (each step's own handlers live in its module), and the step resets.
   Shell modules share one namespace, CF (created in core.js). Names from core are
   destructured below; anything from another module is called as CF.name.
   tests/selftest.js checks these boundaries.
   ===================================================================== */
(function (CF) {
  'use strict';
  const { byId, makeEl, elements, app } = CF;

  const STEPS = {
    perspective: 'Perspective',
    rotate: 'Rotate',
    crop: 'Crop',
    levels: 'Levels',
    overlay: 'Overlay',
    export: 'Export',
  };
  // True for a real step name. A stored step (session records are untrusted) is checked with
  // this, not `STEPS[tab]`, which is truthy for inherited keys such as 'constructor'.
  const isStep = tab => Object.prototype.hasOwnProperty.call(STEPS, tab);

  /* ---------- steps ---------- */
  function setTab(tab) {
    app.tab = tab;
    elements.root.dataset.tab = tab;
    document.querySelectorAll('.tab').forEach(button => {
      button.setAttribute('aria-selected', String(button.dataset.tab === tab));
    });
    document.querySelectorAll('section[data-panel]').forEach(section => {
      section.classList.toggle('active', section.dataset.panel === tab);
    });
    elements.canvas.style.cursor = '';
    if (tab === 'export' || tab === 'levels' || tab === 'overlay') app.views.export = null;
    if (tab !== 'levels') {
      app.dropper = null;
      app.compare = false;
    }
    if (tab !== 'overlay') app.overlayMessage = '';
    app.nudgeLoupeUntil = 0;
    app.findMode = false;
    closeStepMenu();
    CF.Session.saveSoon();
    if (CF.phoneLayout.matches) collapseMore();
    syncUI();
    CF.requestRender();
    CF.requestMini();
  }

  // A segmented control (data-segment="name"): onPick(value) when one of its buttons is tapped.
  function bindSegment(name, onPick) {
    document.querySelectorAll(`[data-segment="${name}"] button`).forEach(button => {
      button.addEventListener('click', () => onPick(button.dataset.value));
    });
  }

  function setSegment(name, value) {
    document.querySelectorAll(`[data-segment="${name}"] button`).forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.value === value));
    });
  }

  // The step menu (phones): lists the steps above the action bar.
  function openStepMenu(button) {
    const menu = byId('stepMenu');
    const items = Object.keys(STEPS).map((tab, i) => makeEl('button', {
      role: 'menuitem',
      'data-goto': tab,
      'aria-current': tab === app.tab && 'step',
      class: tab === 'levels' && app.levelsPending && 'pending',
    }, makeEl('span', { class: 'step-number' }, String(i + 1)), STEPS[tab]));
    menu.replaceChildren(...items);
    menu.hidden = false;
    button.setAttribute('aria-expanded', 'true');
  }

  function closeStepMenu() {
    byId('stepMenu').hidden = true;
    document.querySelectorAll('[data-step-menu]').forEach(button => {
      button.setAttribute('aria-expanded', 'false');
    });
  }

  // "More options" expands the control area on phones.
  function collapseMore() {
    document.querySelectorAll('details.more').forEach(details => {
      details.open = false;
    });
    elements.panel.classList.remove('expanded');
  }

  /* ---------- building the controls ---------- */
  // Phones: each action bar starts with the step menu button.
  function buildStepButtons() {
    document.querySelectorAll('section[data-panel] .action-bar').forEach(bar => {
      const tab = bar.closest('section').dataset.panel;
      bar.prepend(makeEl('button', {
        class: 'btn step-button',
        'data-step-menu': true,
        'aria-haspopup': 'menu',
        'aria-expanded': 'false',
        title: 'Go to a step',
      }, `${STEPS[tab]} ▾`));
    });
  }

  // Fills in the controls that come from CONFIG. Each step builds its own.
  function buildControls() {
    CF.buildCropChips();
    CF.buildSizeOptions();
    buildStepButtons();
    CF.buildFineRange();
  }

  /* ---------- binding the controls ---------- */
  // Binds every control once, at start-up. Each step binds its own.
  function bindControls() {
    bindNavigation();
    CF.bindHandleNudge();
    CF.bindPerspective();
    CF.bindRotate();
    CF.bindCrop();
    CF.bindLevels();
    CF.bindExport();
    document.querySelectorAll('[data-reset]').forEach(button => {
      button.addEventListener('click', () => resetStep(button.dataset.reset));
    });
    CF.bindOverlayControls();
    CF.bindCornerShots();
    CF.bindPair();
  }

  // Opens the file picker for `intent` (see receivePhoto in pair.js).
  function pickPhoto(intent) {
    app.fileIntent = intent;
    elements.fileInput.click();
  }

  // The header, tabs, step menu, More options and Preview.
  function bindNavigation() {
    document.querySelectorAll('.tab').forEach(button => {
      button.addEventListener('click', () => app.img && setTab(button.dataset.tab));
    });
    byId('btnOpen').onclick = () => pickPhoto('open');
    byId('btnOpenEmpty').onclick = () => pickPhoto('open');
    CF.bindStartScreen();
    byId('btnUndo').onclick = CF.undo;
    byId('btnRedo').onclick = CF.redo;
    byId('btnFit').onclick = CF.fitCurrent;
    document.querySelectorAll('[data-next]').forEach(button => {
      button.addEventListener('click', () => setTab(button.dataset.next));
    });
    document.querySelectorAll('[data-step-menu]').forEach(button => {
      button.addEventListener('click', () => {
        if (byId('stepMenu').hidden) openStepMenu(button);
        else closeStepMenu();
      });
    });
    byId('stepMenu').addEventListener('click', event => {
      const item = event.target.closest('[data-goto]');
      if (!item) return;
      closeStepMenu();
      setTab(item.dataset.goto);
    });
    document.addEventListener('pointerdown', event => {
      if (!event.target.closest('#stepMenu, [data-step-menu]')) closeStepMenu();
      // The nudge loupe stays up between nudges; touching anything else hides it.
      if (app.nudgeLoupeUntil && !event.target.closest('[data-nudge]')) {
        app.nudgeLoupeUntil = 0;
        CF.requestRender();
      }
    }, true);
    const onMoreToggled = () => {
      if (!CF.phoneLayout.matches) return;
      const isAnyOpen = !!document.querySelector('section.active details.more[open]');
      elements.panel.classList.toggle('expanded', isAnyOpen);
    };
    document.querySelectorAll('details.more').forEach(details => {
      details.addEventListener('toggle', onMoreToggled);
    });
    byId('btnPreview').onclick = () => {
      app.previewMode = !app.previewMode;
      app.views.result = null;
      syncUI();
      CF.requestRender();
    };
  }

  // A step's Reset button: that step's settings back to their defaults.
  function resetStep(step) {
    CF.commit(state => {
      if (step === 'perspective') {
        const best = app.detection.candidates[0];
        state.corners = best
          ? best.corners.map(point => point.slice())
          : CF.insetCorners(state.source.width, state.source.height);
        state.strength = CONFIG.perspective.strength / 100;
        state.aspect = CF.cardAspect();
        state.squareUpHeight = CONFIG.squareUpHeight;
      } else if (step === 'rotate') {
        state.rotation = { quarter: 0, fine: 0, fillFrame: false };
        state.flip = { h: false, v: false };
      } else if (step === 'crop') {
        state.crop = CF.cropDefaults(null);
      } else if (step === 'export') {
        const defaults = CONFIG.export;
        state.export = {
          format: defaults.format,
          quality: defaults.quality,
          longEdge: defaults.longEdge,
          interp: defaults.interp,
          fill: defaults.fill,
        };
      }
    });
  }

  /* ---------- syncing the controls to the state ---------- */
  function syncUI() {
    const hasPhoto = !!app.img;
    const state = app.state;
    elements.root.classList.toggle('has-img', hasPhoto);
    elements.root.classList.toggle('previewing', !!app.previewMode && app.tab === 'perspective');
    byId('btnPreview').setAttribute('aria-pressed', String(!!app.previewMode));
    byId('btnPreview').querySelector('span').textContent = app.previewMode ? 'Corners' : 'Preview';
    byId('btnUndo').disabled = !CF.History.undo.length;
    byId('btnRedo').disabled = !CF.History.redo.length;
    byId('btnFit').disabled = !hasPhoto;
    document.querySelectorAll('.tab').forEach(button => {
      button.disabled = !hasPhoto;
    });
    document.querySelectorAll('.panel button, .panel select, .panel input').forEach(control => {
      control.disabled = !hasPhoto;
    });
    if (!state) return;
    CF.syncPerspective(state);
    CF.syncRotate(state);
    CF.syncCrop(state);
    CF.syncExportControls(state);
    CF.syncLevels();
    CF.syncOverlay();
    syncReadouts();
  }

  // The readouts and what follows from them. An export's start and end resync only these.
  function syncReadouts() {
    CF.syncSourceInfo();
    // Here rather than in syncUI: the side switch is off while an export runs.
    CF.syncPair();
    if (!app.state) return;
    CF.syncNextCard(app.state);
    CF.syncCornerShots();
    CF.syncPerspectiveReadouts();
    CF.syncCropReadout();
    CF.syncExportReadouts();
  }

  Object.assign(CF, {
    setTab,
    STEPS,
    isStep,
    bindSegment,
    setSegment,
    closeStepMenu,
    collapseMore,
    buildControls,
    bindControls,
    pickPhoto,
    syncUI,
    syncReadouts,
  });
})(window.CF);
