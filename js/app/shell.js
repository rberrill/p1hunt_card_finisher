/* =====================================================================
   js/app/shell.js: the shell of the 1.10 layout. The top bar and the tab bar, switching steps,
   each step's control area and options sheet (the grabber, closing sheets, the phone and wide
   arrangements), binding and syncing the controls of every step (each step's own handlers live
   in its module), and the step resets.
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
  // Each step's options sheet title (the plan's approved wording).
  const SHEET_TITLES = {
    perspective: 'Perspective options',
    rotate: 'Rotate options',
    crop: 'Crop options',
    levels: 'Levels tips',
    overlay: 'Overlay options',
    export: 'Export options',
  };

  /* ---------- steps ---------- */
  function setTab(tab) {
    app.tab = tab;
    elements.root.dataset.tab = tab;
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
    closeSheets();
    CF.Session.saveSoon();
    syncUI();
    CF.requestRender();
    CF.requestMini();
  }

  // A segmented control of the old layout (data-segment="name"): onPick(value) when one of its
  // buttons is tapped. The parts' segmented control has its own (CF.bindSegmented).
  function bindSegment(name, onPick) {
    document.querySelectorAll(`[data-segment="${name}"] button`).forEach(button => {
      button.addEventListener('click', () => onPick(button.dataset.value));
    });
  }

  // Lights the old layout's segment with this value.
  function setSegment(name, value) {
    document.querySelectorAll(`[data-segment="${name}"] button`).forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.value === value));
    });
  }

  /* ---------- the bars ---------- */
  // Builds the top bar and the tab bar into their hosts. The tab bar's place depends on the
  // window's width (placeLayout).
  function buildBars() {
    elements.topBar = CF.buildTopBar();
    elements.tabBar = CF.buildTabBar();
    byId('topBarHost').replaceChildren(elements.topBar);
    byId('tabBarHost').replaceChildren(elements.tabBar);
  }

  // The phone and wide arrangements. Phone: the tab bar along the bottom and every sheet
  // closed. Wide: the tab bar inside the top bar and every step's options open, listed inline
  // in the side panel (css/app.css).
  function placeLayout() {
    const isPhone = CF.phoneLayout.matches;
    const host = isPhone ? byId('tabBarHost') : byId('topBarSteps');
    if (elements.tabBar.parentElement !== host) host.append(elements.tabBar);
    document.querySelectorAll('section[data-panel] .sheet-layer').forEach(layer => {
      if (isPhone) {
        layer.classList.remove('is-open');
        layer.hidden = true;
      } else {
        layer.hidden = false;
        layer.classList.add('is-open');
      }
    });
    syncFitButton();
  }

  // Fit shows on a wide screen always, and on the phone only while the photo is zoomed or
  // panned away from its fitted view. view.js calls this after every draw.
  function syncFitButton() {
    if (!elements.topBar) return;
    const view = app.img ? CF.currentView() : null;
    const isMoved = !!view && view.auto === false;
    const isWide = !CF.phoneLayout.matches;
    // A wide screen always shows Fit, dimmed until a photo is open (DT1).
    CF.updateTopBar(elements.topBar, { isFitShown: isWide || (!!app.img && isMoved) });
    byId('btnFit').disabled = !app.img;
  }

  /* ---------- each step's control area and sheet ---------- */
  // A step whose phase hasn't come yet keeps its old markup (.controls, details.more and
  // .action-bar). This moves it into a control area (which scrolls for now) and a sheet with
  // the step's id names, so the shell treats every step alike. The ids inside are unchanged,
  // so the step's handlers bind as before. Returns without a change for a converted step.
  function mountInterimStep(section) {
    const step = section.dataset.panel;
    const controls = section.querySelector(':scope > .controls');
    if (!controls) return;
    const more = controls.querySelector(':scope > details.more');
    const actionBar = section.querySelector(':scope > .action-bar');
    const kept = [...controls.children].filter(child => child !== more);
    // The old controls scroll inside the area, so the grabber on its top edge is never cut.
    const scroller = makeEl('div', { class: 'interim-controls' }, ...kept, actionBar);
    const area = CF.buildControlArea(`${step}Area`, scroller);
    area.classList.add('is-interim');
    const moreContent = more ? [...more.children].filter(child => child.tagName !== 'SUMMARY') : [];
    const sheet = CF.buildSheet({ id: `${step}Sheet`, title: SHEET_TITLES[step] }, ...moreContent);
    controls.replaceWith(area);
    section.append(sheet);
  }

  // The open step's options sheet; null on a wide screen, where options are always inline.
  function currentSheet() {
    if (!CF.phoneLayout.matches || !app.img) return null;
    return byId(`${app.tab}Sheet`);
  }

  // Closes every open sheet on the phone. Returns true when one was open (Escape uses it).
  function closeSheets() {
    if (!CF.phoneLayout || !CF.phoneLayout.matches) return false;
    let wasOpen = false;
    document.querySelectorAll('.sheet-layer').forEach(layer => {
      if (!CF.isSheetOpen(layer)) return;
      wasOpen = true;
      CF.closeSheet(layer);
    });
    return wasOpen;
  }

  // Fills in the controls that come from CONFIG, builds the bars, and gives every step its
  // control area and sheet. Each step builds its own controls first.
  function buildControls() {
    buildBars();
    CF.buildPerspectiveControls();
    CF.buildRotateControls();
    CF.buildCropChips();
    CF.buildSizeOptions();
    document.querySelectorAll('section[data-panel]').forEach(mountInterimStep);
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

  // The top bar, the tab bar and the grabbers.
  function bindNavigation() {
    elements.tabBar.addEventListener('click', event => {
      const tab = event.target.closest('.step-tab');
      if (tab && app.img) setTab(tab.dataset.step);
    });
    byId('btnOpen').onclick = () => pickPhoto('open');
    byId('btnOpenEmpty').onclick = () => pickPhoto('open');
    CF.bindStartScreen();
    byId('btnUndo').onclick = CF.undo;
    byId('btnRedo').onclick = CF.redo;
    byId('btnFit').onclick = CF.fitCurrent;
    document.querySelectorAll('.control-area > .grabber').forEach(grabber => {
      CF.bindSheetHandle(grabber, currentSheet);
    });
    document.addEventListener('pointerdown', event => {
      // The nudge loupe stays up between nudges; touching anything else hides it.
      if (app.nudgeLoupeUntil && !event.target.closest('[data-nudge], .nudge-pad')) {
        app.nudgeLoupeUntil = 0;
        CF.requestRender();
      }
    }, true);
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
    CF.updateTopBar(elements.topBar, {
      canUndo: CF.History.undo.length > 0,
      canRedo: CF.History.redo.length > 0,
    });
    CF.updateTabBar(elements.tabBar, { current: app.tab, isDisabled: !hasPhoto });
    syncFitButton();
    document.querySelectorAll('.panel button, .panel select, .panel input').forEach(control => {
      control.disabled = !hasPhoto;
    });
    if (!state) return;
    CF.syncPerspective(state);
    CF.syncRotate(state);
    CF.syncCrop(state);
    CF.syncExportControls(state);
    CF.syncLevels();
    CF.updateTabBar(elements.tabBar, { hasLevelsMark: app.levelsPending });
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
    placeLayout,
    syncFitButton,
    closeSheets,
    buildControls,
    bindControls,
    pickPhoto,
    syncUI,
    syncReadouts,
  });
})(window.CF);
