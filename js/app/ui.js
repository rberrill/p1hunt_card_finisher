/* =====================================================================
   js/app/ui.js: step tabs and the step menu, building and binding the controls, syncUI and
   the readouts, the debug panel and the resume prompt.
   Shell modules share one namespace, CF (created in core.js). Names from core are
   destructured below; anything from another module is called as CF.name.
   tests/selftest.js checks these boundaries.
   ===================================================================== */
(function (CF) {
  'use strict';
  const { byId, makeEl, elements, clone, shortText, app, toast } = CF;

  const STEPS = {
    perspective: 'Perspective',
    rotate: 'Rotate',
    crop: 'Crop',
    levels: 'Levels',
    overlay: 'Overlay',
    export: 'Export',
  };
  // The debug panel re-runs detection this long after the last change to a setting.
  const REDETECT_DELAY_MS = 350;

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
  function buildControls() {
    const chips = CONFIG.crop.presets.map(
      preset => makeEl('button', { class: 'chip', 'data-crop': preset.id }, preset.label),
    );
    const swapAttributes = { class: 'chip', id: 'btnSwap', title: 'Swap portrait / landscape' };
    const swap = makeEl('button', swapAttributes, '⇄ Swap');
    byId('cropChips').replaceChildren(...chips, swap);
    byId('size').replaceChildren(...CONFIG.export.longEdgePresets.map(
      pixels => makeEl('option', { value: pixels }, pixels ? pixels + ' px' : 'Original size'),
    ));
    // Phones: each action bar starts with the step menu button.
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
    const range = CONFIG.rotate.fineRangeDeg;
    for (const input of [byId('fine'), byId('fineNumber')]) {
      input.min = -range;
      input.max = range;
      input.step = CONFIG.rotate.fineStepDeg;
    }
  }

  /* ---------- binding the controls ---------- */
  function bindControls() {
    bindNavigation();
    bindNudgePad();
    bindPerspective();
    bindRotate();
    bindCrop();
    bindLevels();
    bindExport();
    document.querySelectorAll('[data-reset]').forEach(button => {
      button.addEventListener('click', () => resetStep(button.dataset.reset));
    });
    CF.bindOverlayControls();
  }

  // The header, tabs, step menu, More options and Preview.
  function bindNavigation() {
    document.querySelectorAll('.tab').forEach(button => {
      button.addEventListener('click', () => app.img && setTab(button.dataset.tab));
    });
    byId('btnOpen').onclick = () => elements.fileInput.click();
    byId('btnOpenEmpty').onclick = () => elements.fileInput.click();
    byId('btnResume').onclick = resumeSession;
    byId('btnFresh').onclick = () => {
      CF.Session.clear();
      hideResume();
    };
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

  // The on-screen nudge pad (phones): one screen pixel per step, never less than one source
  // pixel; hold to repeat.
  function bindNudgePad() {
    let nudgeTimer = 0;
    let loupeTimer = 0;
    const flashLoupe = () => {
      app.nudgeLoupeUntil = performance.now() + CONFIG.nudge.loupeMs;
      CF.requestRender();
      clearTimeout(loupeTimer);
      loupeTimer = setTimeout(CF.requestRender, CONFIG.nudge.loupeMs + 50);
    };
    const nudgeStep = direction => {
      const view = CF.currentView();
      if (!view || app.tab !== 'perspective' || app.previewMode) return;
      const step = Math.max(1, 1 / view.zoom);
      const [dx, dy] = [direction[0] * step, direction[1] * step];
      CF.commit(state => CF.moveHandleBy(state, app.selected, dx, dy), 'nudge');
      flashLoupe();
    };
    const stop = () => {
      clearTimeout(nudgeTimer);
      clearInterval(nudgeTimer);
    };
    document.querySelectorAll('[data-nudge]').forEach(button => {
      button.addEventListener('pointerdown', event => {
        event.preventDefault();
        stop();
        if (button.dataset.nudge === 'cycle') {
          app.selected = (app.selected + 1) % 8;
          flashLoupe();
          return;
        }
        const direction = button.dataset.nudge.split(',').map(Number);
        nudgeStep(direction);
        nudgeTimer = setTimeout(() => {
          nudgeTimer = setInterval(() => nudgeStep(direction), CONFIG.nudge.repeatMs);
        }, CONFIG.nudge.delayMs);
      });
      for (const type of ['pointerup', 'pointerleave', 'pointercancel']) {
        button.addEventListener(type, stop);
      }
      button.addEventListener('contextmenu', event => event.preventDefault());
    });
  }

  function bindPerspective() {
    byId('btnNext').onclick = () => {
      const count = app.detection.candidates.length;
      if (count) CF.useCandidate((app.detection.index + 1) % count);
    };
    // Arms (or cancels) Find card: the next still tap on the photo finds the card there. On
    // phones, More options closes so the whole photo is there to tap; the status line prompts
    // until the tap.
    byId('btnFindCard').onclick = () => {
      app.findMode = !app.findMode;
      if (app.findMode && CF.phoneLayout.matches) collapseMore();
      syncUI();
    };
    // Strength updates live while sliding (geometry only); one undo step per slide.
    const strength = byId('strength');
    let strengthBefore = null;
    strength.oninput = () => {
      if (!strengthBefore) strengthBefore = clone(app.state);
      app.state.strength = strength.value / 100;
      byId('strengthValue').textContent = strength.value + '%';
      CF.liveChanged();
    };
    strength.onchange = () => {
      if (strengthBefore) CF.commitFrom(strengthBefore, 'strength');
      strengthBefore = null;
    };
    bindSegment('orientation', value => CF.commit(state => {
      state.aspect.orientation = value;
    }));
    byId('snap').onchange = event => {
      app.snap = event.target.checked;
    };
    byId('debugOverlay').onchange = event => {
      app.debugOverlay = event.target.checked;
      const hasDebugData = app.detection.last && app.detection.last.debug;
      if (app.debugOverlay && !hasDebugData) CF.runDetect();
      CF.requestRender();
    };
    byId('fill').onchange = event => {
      const fill = event.target.value === 'custom' ? byId('fillColor').value : event.target.value;
      CF.commit(state => {
        state.export.fill = fill;
      });
    };
    byId('fillColor').oninput = event => {
      byId('fill').value = 'custom';
      CF.commit(state => {
        state.export.fill = event.target.value;
      }, 'fill');
    };
  }

  // A quarter turn (direction +1 clockwise, −1 counterclockwise), keeping a manual crop on the
  // same content by turning its center and size with it.
  function turn(direction) {
    CF.commit(state => {
      state.rotation.quarter = (state.rotation.quarter + direction + 4) % 4;
      const rect = state.crop.rect;
      if (rect) {
        state.crop.rect = direction > 0
          ? { cx: -rect.cy, cy: rect.cx, w: rect.h, h: rect.w }
          : { cx: rect.cy, cy: -rect.cx, w: rect.h, h: rect.w };
      }
      if (state.crop.ratio && state.crop.ratio !== 1) state.crop.swapped = !state.crop.swapped;
      if (state.crop.orient) {
        state.crop.orient = state.crop.orient === 'portrait' ? 'landscape' : 'portrait';
      }
    });
  }

  // A flip as seen on screen. The pipeline flips before rotating, and reflect·Rot(θ) =
  // Rot(−θ)·reflect, so a flip "as seen" toggles the flip bit and negates the rotation.
  function flip(axis) {
    CF.commit(state => {
      state.flip[axis] = !state.flip[axis];
      state.rotation.quarter = (4 - state.rotation.quarter) % 4;
      state.rotation.fine = -state.rotation.fine || 0;
      if (!state.crop.rect) return;
      if (axis === 'h') state.crop.rect.cx = -state.crop.rect.cx;
      else state.crop.rect.cy = -state.crop.rect.cy;
    });
  }

  function bindRotate() {
    byId('btnRotateLeft').onclick = () => turn(-1);
    byId('btnRotateRight').onclick = () => turn(1);
    byId('btnFlipH').onclick = () => flip('h');
    byId('btnFlipV').onclick = () => flip('v');
    const range = CONFIG.rotate.fineRangeDeg;
    const setFine = degrees => CF.commit(state => {
      state.rotation.fine = Math.round(Math.max(-range, Math.min(range, degrees)) * 10) / 10;
    }, 'fine');
    byId('fine').oninput = event => setFine(+event.target.value);
    byId('fineNumber').onchange = event => setFine(+event.target.value || 0);
    byId('btnFineZero').onclick = () => setFine(0);
    byId('fillFrame').onchange = event => CF.commit(state => {
      state.rotation.fillFrame = event.target.checked;
    });
    byId('showGrid').onchange = event => {
      app.showGrid = event.target.checked;
      CF.requestRender();
    };
  }

  // Picks a crop preset. A manual box is reshaped to the new aspect with the same center and area.
  function pickCropPreset(presetId) {
    CF.commit(state => {
      const previous = app.geometry && app.geometry.ok ? { ...app.geometry.crop } : null;
      state.crop.preset = presetId;
      state.crop.ratio = CF.presetRatio(presetId);
      // The box swap is handled by the reshape below.
      state.crop.swapped = false;
      CF.alignCrop(state, app.geometry);
      if (state.crop.mode !== 'manual' || !previous || !state.crop.ratio) return;
      const ratio = CardEngine.cropRatio(state.crop, state.source.width, state.source.height);
      const area = previous.width * previous.height;
      const frameWidth = app.geometry.rotated.width;
      const frameHeight = app.geometry.rotated.height;
      let width = Math.sqrt(area * ratio);
      let height = Math.sqrt(area / ratio);
      const fit = Math.min(1, frameWidth / width, frameHeight / height);
      width *= fit;
      height *= fit;
      const previousCenterX = previous.x + previous.width / 2;
      const previousCenterY = previous.y + previous.height / 2;
      const centerX = Math.min(Math.max(previousCenterX, width / 2), frameWidth - width / 2);
      const centerY = Math.min(Math.max(previousCenterY, height / 2), frameHeight - height / 2);
      CF.setCropAbsolute({ x: centerX - width / 2, y: centerY - height / 2, width, height });
    });
  }

  function bindCrop() {
    byId('cropChips').addEventListener('click', event => {
      const chip = event.target.closest('[data-crop]');
      if (chip) pickCropPreset(chip.dataset.crop);
    });
    byId('btnSwap').onclick = () => CF.commit(state => {
      const next = CF.cropOrient(state, app.geometry) === 'portrait' ? 'landscape' : 'portrait';
      state.crop.orient = next === CF.cardOrient(app.geometry) ? null : next;
      state.crop.swapped = !state.crop.swapped;
      if (state.crop.mode === 'manual' && state.crop.rect) {
        const rect = state.crop.rect;
        state.crop.rect = { cx: rect.cx, cy: rect.cy, w: rect.h, h: rect.w };
      }
    });
    byId('btnFitToCard').onclick = () => CF.commit(state => {
      state.crop.mode = 'fit';
      state.crop.rect = null;
    });
  }

  function bindLevels() {
    byId('btnAutoLevels').onclick = CF.autoLevelsDraft;
    const armDropper = which => {
      app.dropper = app.dropper === which ? null : which;
      syncUI();
      if (app.dropper) toast(`Tap the image where it should be ${which}.`);
    };
    byId('btnPickWhite').onclick = () => armDropper('white');
    byId('btnPickBlack').onclick = () => armDropper('black');
    byId('btnClearLevels').onclick = () => {
      app.dropper = null;
      CF.setDraft(draft => {
        draft.white = null;
        draft.whiteAt = null;
        draft.black = null;
        draft.blackAt = null;
      });
    };
    byId('btnApplyLevels').onclick = CF.applyLevels;
    byId('btnDiscardLevels').onclick = CF.discardLevels;
  }

  function bindExport() {
    byId('format').onchange = event => CF.commit(state => {
      state.export.format = event.target.value;
    });
    const quality = byId('quality');
    quality.oninput = () => CF.commit(state => {
      state.export.quality = +quality.value;
    }, 'quality');
    byId('size').onchange = event => CF.commit(state => {
      state.export.longEdge = +event.target.value || 0;
    });
    byId('interp').onchange = event => CF.commit(state => {
      state.export.interp = event.target.value;
    });
    byId('btnDownload').onclick = () => CF.doExport('download');
    byId('btnShare').onclick = () => {
      if (app.pendingSave) CF.sharePending();
      else CF.doExport('share');
    };
    // Next card opens the photo picker, like Open; the new photo starts as any other does.
    byId('btnNextCard').onclick = () => elements.fileInput.click();
    // Share is the main action where the browser supports it; Download stays a plain download.
    if (CF.Exporter.canShare()) {
      byId('btnShare').hidden = false;
      byId('btnDownload').classList.remove('primary');
    }
    // Copy needs the image clipboard (secure pages only); hide it rather than show a dead button.
    byId('btnCopy').hidden = !CF.Exporter.canCopy();
    byId('btnCopy').onclick = () => CF.doExport('copy');
    byId('btnSaveEdits').onclick = CF.saveEdits;
    byId('btnLoadEdits').onclick = () => elements.editsInput.click();
    elements.editsInput.addEventListener('change', () => {
      const file = elements.editsInput.files[0];
      elements.editsInput.value = '';
      if (file) CF.loadEdits(file);
    });
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
    syncPerspective(state);
    syncRotateAndCrop(state);
    syncExportControls(state);
    syncLevels();
    CF.syncOverlay();
    syncReadouts();
  }

  function syncPerspective(state) {
    setSegment('orientation', state.aspect.orientation);
    const strengthPercent = Math.round(state.strength * 100);
    byId('strength').value = strengthPercent;
    byId('strengthValue').textContent = strengthPercent + '%';
    byId('snap').checked = app.snap;
    byId('debugOverlay').checked = app.debugOverlay;
    const fill = state.export.fill;
    const isPreset = ['transparent', '#ffffff', '#000000'].includes(fill);
    byId('fill').value = isPreset ? fill : 'custom';
    if (!isPreset) byId('fillColor').value = fill;
    byId('btnFindCard').setAttribute('aria-pressed', String(app.findMode));
    const count = app.detection.candidates.length;
    byId('btnNext').disabled = count < 2;
    const label = count > 1 ? `Candidate ${app.detection.index + 1}/${count}` : 'Candidate';
    byId('btnNext').textContent = label;
  }

  function syncRotateAndCrop(state) {
    byId('fine').value = state.rotation.fine;
    byId('fineNumber').value = state.rotation.fine;
    byId('fillFrame').checked = !!state.rotation.fillFrame;
    byId('showGrid').checked = app.showGrid;
    const orient = CF.cropOrient(state, app.geometry);
    document.querySelectorAll('[data-crop]').forEach(chip => {
      chip.setAttribute('aria-pressed', String(chip.dataset.crop === state.crop.preset));
      const preset = CONFIG.crop.presets.find(candidate => candidate.id === chip.dataset.crop);
      chip.textContent = CF.cropLabel(preset, orient);
    });
    byId('btnSwap').disabled = !state.crop.ratio || state.crop.ratio === 1;
  }

  function syncExportControls(state) {
    byId('format').value = state.export.format;
    byId('quality').value = state.export.quality;
    byId('qualityValue').textContent = Math.round(state.export.quality * 100) + '%';
    byId('qualityRow').hidden = state.export.format === 'png';
    byId('size').value = String(state.export.longEdge || 0);
    byId('interp').value = state.export.interp;
  }

  // A Levels swatch: the picked color, or empty.
  function setSwatch(id, color) {
    const swatch = byId(id);
    const rgb = color && color.map(Math.round).join(', ');
    swatch.style.background = color ? `rgb(${rgb})` : '';
    swatch.classList.toggle('unset', !color);
    swatch.title = color ? `RGB ${rgb}` : 'Not set';
  }

  function syncLevels() {
    const state = app.state;
    // A draft that matches the applied levels isn't pending.
    const applied = JSON.stringify(state.levels || null);
    const isSameAsApplied = JSON.stringify(app.levelsDraft) === applied;
    if (app.levelsPending && isSameAsApplied) {
      app.levelsPending = false;
      app.levelsDraft = null;
    }
    const levels = CF.draftLevels() || {};
    setSwatch('swatchWhite', levels.white);
    setSwatch('swatchBlack', levels.black);
    byId('btnPickWhite').setAttribute('aria-pressed', String(app.dropper === 'white'));
    byId('btnPickBlack').setAttribute('aria-pressed', String(app.dropper === 'black'));
    byId('btnClearLevels').disabled = !levels.white && !levels.black;
    byId('btnApplyLevels').disabled = !app.levelsPending;
    byId('btnDiscardLevels').disabled = !app.levelsPending;
    // No "unapplied" message: the step's dot and the enabled Apply button say it.
    document.querySelector('[data-tab="levels"]').classList.toggle('pending', app.levelsPending);
    elements.root.classList.toggle('levels-pending', app.levelsPending);
  }

  // The Perspective status line: only what needs action (detection details live under More).
  function perspectiveStatus(geometry, candidate) {
    const count = app.detection.candidates.length;
    if (app.findMode) return 'Tap the card in the photo.';
    if (geometry && !geometry.ok) return geometry.reason;
    if (app.detection.message) return app.detection.message;
    if (candidate && candidate.confidence < CONFIG.detect.minConfidence) {
      return `Low confidence (${Math.round(candidate.confidence * 100)}%) — check the corners.`;
    }
    if (!count && app.img && app.detection.last) {
      return 'Nothing detected — drag the corners into place.';
    }
    if (geometry && geometry.perspective.isClamped) {
      return `Corrected frame clamped to ${CONFIG.maxOutputPx}px on the long side.`;
    }
    return '';
  }

  // The export notes: why the output isn't what you might expect.
  function exportNotes(state, geometry) {
    const notes = [];
    if (geometry.output.isClamped) {
      const megapixels = Math.round(CONFIG.maxOutputArea / 1e6 * 10) / 10;
      notes.push(`Clamped to fit the ${megapixels} MP canvas limit.`);
    }
    if (state.export.format === 'jpeg' && state.export.fill === 'transparent') {
      notes.push('JPEG has no transparency; empty areas will be white.');
    }
    if (app.levelsPending) {
      notes.push('Levels has unapplied changes; the export uses the applied levels only.');
    }
    return notes.join(' ');
  }

  function syncReadouts() {
    const state = app.state;
    const geometry = app.geometry;
    if (!state) return;
    syncNextCard(state);
    byId('btnShare').querySelector('span').textContent = app.pendingSave ? 'Share now' : 'Share';
    const count = app.detection.candidates.length;
    const candidate = count ? app.detection.candidates[app.detection.index] : null;
    const candidateInfo = candidate
      ? `Candidate ${app.detection.index + 1}/${count} · `
        + `confidence ${Math.round(candidate.confidence * 100)}%`
      : '';
    byId('detectInfo').textContent = app.detection.message || candidateInfo;
    const status = byId('perspectiveStatus');
    status.className = 'status' + (geometry && !geometry.ok ? ' error' : '');
    status.textContent = perspectiveStatus(geometry, candidate);
    const exportButtons = ['btnDownload', 'btnShare', 'btnCopy'].map(byId);
    if (!geometry || !geometry.ok) {
      byId('cropReadout').textContent = '';
      byId('exportReadout').textContent = '';
      byId('exportMessage').textContent = '';
      exportButtons.forEach(button => {
        button.disabled = true;
      });
      return;
    }
    const { crop, output } = geometry;
    const cropSize = `${Math.round(crop.width)} × ${Math.round(crop.height)}`;
    byId('cropReadout').replaceChildren('Crop ', makeEl('b', null, cropSize), ' px');
    const longEdge = state.export.longEdge;
    const isSmall = longEdge && output.scale >= 1 && Math.max(crop.width, crop.height) < longEdge;
    const format = state.export.format.toUpperCase();
    const details = ` px · ${format}` + (isSmall ? ' · full crop, not upscaled' : '');
    const outputSize = makeEl('b', null, `${output.width} × ${output.height}`);
    byId('exportReadout').replaceChildren('Output ', outputSize, details);
    const message = byId('exportMessage');
    message.className = 'status';
    // The phone control area can't hold a note and Next card together. The note was on screen
    // when the photo was exported, so Next card takes its place until the next edit (on wide
    // screens too, so both layouts behave the same).
    const isNextCardShown = !byId('btnNextCard').hidden;
    message.textContent = isNextCardShown ? '' : exportNotes(state, geometry);
    byId('btnDownload').disabled = !!app.exporting;
    byId('btnShare').disabled = !!app.exporting && !app.pendingSave;
    byId('btnCopy').disabled = !!app.exporting;
  }

  // Next card shows only once the current edits are exported, so it never offers to leave
  // unexported work behind, and not while a share waits for its second tap.
  function syncNextCard(state) {
    const isExported = app.exportedState === JSON.stringify(state);
    const isShown = isExported && !app.pendingSave;
    byId('btnNextCard').hidden = !isShown;
  }

  /* ---------- the debug tuning panel (?debug=1 or the ` key) ---------- */
  function toggleDebugPanel(force) {
    const panel = elements.debugPanel;
    const show = force !== undefined ? force : panel.hidden;
    panel.hidden = !show;
    if (!show) return;
    buildDebugPanel();
    if (!app.debugOverlay) {
      app.debugOverlay = true;
      syncUI();
      if (app.img) CF.runDetect();
    }
  }

  let redetectTimer = 0;
  // One field per number or on/off setting in CONFIG.detect; editing one re-runs detection.
  function buildDebugPanel() {
    const panel = elements.debugPanel;
    const settings = CONFIG.detect;
    const isTunable = key => ['number', 'boolean'].includes(typeof settings[key]);
    const keys = Object.keys(settings).filter(isTunable);
    const rows = keys.map(key => makeEl('label', null, key, typeof settings[key] === 'boolean'
      ? makeEl('input', { type: 'checkbox', 'data-key': key, checked: settings[key] })
      : makeEl('input', { type: 'number', 'data-key': key, value: settings[key], step: 'any' })));
    const button = (id, label) => makeEl('button', { class: 'btn debug-button', id }, label);
    panel.replaceChildren(
      makeEl('div', { class: 'row debug-head' },
        makeEl('b', null, 'Detection tuning'),
        button('debugClose', '×')),
      makeEl('div', { class: 'row' },
        button('debugCopy', 'Copy CONFIG'),
        button('debugRun', 'Re-detect')),
      ...rows,
      makeEl('pre', { id: 'debugInfo' }),
    );
    panel.querySelector('#debugClose').onclick = () => toggleDebugPanel(false);
    panel.querySelector('#debugRun').onclick = () => CF.runDetect();
    panel.querySelector('#debugCopy').onclick = async () => {
      const text = 'const CONFIG = ' + JSON.stringify(CONFIG, null, 2) + ';\n';
      try {
        await navigator.clipboard.writeText(text);
        toast('CONFIG copied.');
      } catch (error) {
        console.log(text);
        toast('Clipboard blocked — CONFIG printed to the console.', 'warn');
      }
    };
    const onSettingChanged = input => () => {
      const key = input.dataset.key;
      CONFIG.detect[key] = input.type === 'checkbox' ? input.checked : Number(input.value);
      clearTimeout(redetectTimer);
      redetectTimer = setTimeout(() => CF.runDetect(), REDETECT_DELAY_MS);
    };
    panel.querySelectorAll('input[data-key]').forEach(input => {
      input.addEventListener('input', onSettingChanged(input));
    });
    updateDebugPanel();
  }

  // The last detection's timing and each candidate's score parts.
  function updateDebugPanel() {
    const info = elements.debugPanel.querySelector('#debugInfo');
    if (!info) return;
    const last = app.detection.last;
    if (!last) {
      info.textContent = '';
      return;
    }
    const timing = last.timing || {};
    const header = `round trip ${Math.round(app.detection.durationMs || 0)} ms `
      + `(analyze ${Math.round(timing.analyze)} ms, quads ${Math.round(timing.quads)} ms)\n`
      + `${timing.lines} lines → ${timing.quadCount} quads\n`;
    const describe = (candidate, i) => {
      const parts = candidate.parts;
      const refined = candidate.refined ? candidate.refined.map(Number).join('') : '-';
      const confidence = (candidate.confidence * 100).toFixed(0);
      return `#${i + 1} score ${candidate.score.toFixed(3)} conf ${confidence}%`
        + ` sup ${parts.support.toFixed(2)} min ${parts.supportMin.toFixed(2)}`
        + ` asp ${parts.aspect.toFixed(2)} ang ${parts.angle.toFixed(2)}`
        + ` area ${(parts.areaFrac * 100).toFixed(1)}% refined ${refined}`;
    };
    info.textContent = header + app.detection.candidates.map(describe).join('\n');
  }

  /* ---------- the resume prompt (start screen) ---------- */

  // How long ago a timestamp was, roughly.
  function timeAgo(time) {
    const minutes = Math.round((Date.now() - time) / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes} min ago`;
    if (minutes < 1440) return `${Math.round(minutes / 60)} h ago`;
    return `${Math.round(minutes / 1440)} d ago`;
  }

  async function offerResume() {
    const record = await CF.Session.peek();
    if (!record || app.img) return;
    // The record comes from storage.
    byId('resumeName').textContent = shortText(record.name) || 'your last photo';
    const when = Number.isFinite(record.savedAt) ? '(' + timeAgo(record.savedAt) + ')' : '';
    byId('resumeWhen').textContent = when;
    byId('resume').hidden = false;
    byId('btnOpenEmpty').classList.remove('primary');
  }

  function hideResume() {
    byId('resume').hidden = true;
    byId('btnOpenEmpty').classList.add('primary');
  }

  async function resumeSession() {
    hideResume();
    try {
      const [photo, edits] = await Promise.all([CF.Session.loadPhoto(), CF.Session.peek()]);
      if (!photo) {
        toast('The saved photo is gone. Open it again.', 'warn', 5000);
        return;
      }
      await CF.openFile(new File([photo.buf], photo.name, { type: photo.type }), photo.name, edits);
    } catch (error) {
      console.error(error);
      toast('Couldn’t resume: ' + error.message, 'error', 6000);
    }
  }

  Object.assign(CF, {
    setTab,
    STEPS,
    closeStepMenu,
    collapseMore,
    buildControls,
    bindControls,
    syncUI,
    syncReadouts,
    toggleDebugPanel,
    updateDebugPanel,
    offerResume,
    resumeSession,
  });
})(window.CF);
