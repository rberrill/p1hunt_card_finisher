/* =====================================================================
   js/app/perspective.js: the Perspective step's controls, built from js/app/parts/. The control
   area: a label row (Nudge's handle, Flatten's value or Preview's line, with the confidence
   readout at its right), which a status replaces when there is something to act on; a control
   row (the nudge pad and Next handle, the Flatten slider, or Preview's line); and the tool row
   (Nudge, Flatten, Candidate, Snap, Preview). The options sheet: Tap to find card, Card
   orientation, Reset perspective, Debug overlay and the Tips. On a wide screen the mini Result
   preview sits between the two.
   Shell modules share one namespace, CF (created in core.js). Names from core are
   destructured below; anything from another module is called as CF.name.
   tests/selftest.js checks these boundaries.
   ===================================================================== */
(function (CF) {
  'use strict';
  const { byId, makeEl, elements, clone, app } = CF;

  // The approved tips (the plan's Wording section, 14 November) and the keyboard help shown
  // under them on a wide screen (frame DT3).
  const PERSPECTIVE_TIPS = [
    'Drag a corner or the middle of an edge. Double tap a handle to zoom in on it; '
      + 'double tap again to zoom out.',
    'The arrows nudge the selected handle. Hold one to repeat.',
    'Flatten: 0% squares the card up but keeps the camera’s depth. '
      + '100% is a flat 5:7 rectangle, like a scan.',
    'Corners on the wrong card? Tap to find card, then tap the card.',
  ];
  const PERSPECTIVE_KEYS = [
    'Double-click a handle to zoom in on it. Tab selects the next handle; arrows nudge 1 px '
      + '(Shift 10). F fits; 1 to 6 change step.',
  ];
  // The nudge pad's keys, left to right, and the direction each moves the handle (screen px).
  const NUDGE_KEYS = [
    { value: '-1,0', icon: 'left', label: 'Nudge left' },
    { value: '0,-1', icon: 'up', label: 'Nudge up' },
    { value: '0,1', icon: 'down', label: 'Nudge down' },
    { value: '1,0', icon: 'right', label: 'Nudge right' },
  ];
  // Handles: indices 0 to 3 are the corners, 4 to 7 the edge midpoints (view.js draws them so).
  const CORNER_COUNT = 4;
  const HANDLE_COUNT = 8;
  // Next handle's trailing chevron, in CSS px.
  const NEXT_ICON_PX = 16;
  const ORIENTATIONS = [
    { value: 'auto', label: 'Auto' },
    { value: 'portrait', label: 'Portrait' },
    { value: 'landscape', label: 'Landscape' },
  ];

  // The adjustment showing in the control area: 'nudge' (the resting line) or 'flatten'.
  // Preview, a switch, replaces both while it is on. Only this module reads it.
  let lineMode = 'nudge';

  /* ---------- building ---------- */
  // Builds Perspective's control area and options sheet into its section of index.html, around
  // the static Result preview (#mini, which core.js looks up at load).
  function buildPerspectiveControls() {
    const section = document.querySelector('section[data-panel="perspective"]');
    const area = CF.buildControlArea('perspectiveArea',
      CF.buildAdjustmentLine({ id: 'perspectiveLine', name: 'Nudge' }),
      CF.buildLabelRow('perspectivePreviewLine',
        makeEl('span', { class: 'line-label' }, 'Preview'),
        makeEl('span', { class: 'perspective-note' }, 'The corrected card. Handles are hidden.')),
      CF.buildStatus('perspectiveStatus'),
      buildNudgeRow(),
      CF.buildControlRow('perspectiveFlattenRow',
        CF.buildSlider({ id: 'strength', min: 0, max: 100, step: 1, label: 'Flatten' })),
      CF.buildControlRow('perspectivePreviewRow',
        makeEl('span', { class: 'perspective-note' },
          'Pinch to zoom, drag to pan. Tap Preview again for the corners.')),
      buildPerspectiveTools());
    section.prepend(area);
    section.append(buildPerspectiveSheet());
  }

  // The control row in Nudge: the four-way pad and Next handle (with a trailing chevron).
  function buildNudgeRow() {
    const pad = CF.buildNudgePad({
      id: 'perspectiveNudge',
      label: 'Nudge the selected handle',
      keys: NUDGE_KEYS,
    });
    const next = CF.buildActionButton({
      id: 'btnNextHandle',
      label: 'Next handle',
      isWide: true,
      title: 'Select the next handle',
    });
    next.append(CF.makeIcon('right', NEXT_ICON_PX));
    // Marked as a nudge control, so the shell keeps the nudge loupe up when it is pressed.
    next.dataset.nudge = 'cycle';
    return CF.buildControlRow('perspectiveNudgeRow', pad, next);
  }

  // The tool row: two modes, one action and two switches.
  function buildPerspectiveTools() {
    return CF.buildToolRow('perspectiveTools',
      CF.buildTool({ id: 'toolNudge', kind: 'mode', label: 'Nudge', icon: 'nudge' }),
      CF.buildTool({ id: 'toolFlatten', kind: 'mode', label: 'Flatten', icon: 'flatten' }),
      CF.buildTool({
        id: 'toolCandidate',
        kind: 'action',
        label: 'Candidate',
        icon: 'candidate',
        title: 'Try the next detected candidate',
      }),
      CF.buildTool({
        id: 'toolSnap',
        kind: 'switch',
        label: 'Snap',
        icon: 'snap',
        title: 'Snap handles to detected edges',
      }),
      CF.buildTool({
        id: 'toolPreview',
        kind: 'switch',
        label: 'Preview',
        icon: 'preview',
        title: 'Show the corrected card',
      }));
  }

  // The options sheet "Perspective options" (frame P17).
  function buildPerspectiveSheet() {
    const reset = CF.buildSheetRow({
      id: 'btnResetPerspective',
      icon: 'rotateLeft',
      label: 'Reset perspective',
      isDanger: true,
    });
    // The shell binds every [data-reset] button to its step's reset.
    reset.dataset.reset = 'perspective';
    return CF.buildSheet({ id: 'perspectiveSheet', title: 'Perspective options' },
      CF.buildSheetList(CF.buildSheetRow({
        id: 'btnFindCard',
        icon: 'findCard',
        label: 'Tap to find card',
        detail: 'then tap the card',
      })),
      CF.buildSheetHeading('Card orientation'),
      CF.buildSegmented({ id: 'orientation', label: 'Card orientation', options: ORIENTATIONS }),
      CF.buildSheetList(reset),
      CF.buildSheetHeading('Developer'),
      CF.buildSheetList(CF.buildSwitchRow({ id: 'debugOverlay', label: 'Debug overlay' })),
      CF.buildTipsRow('perspectiveTips', PERSPECTIVE_TIPS, PERSPECTIVE_KEYS));
  }

  /* ---------- binding ---------- */
  // The nudge pad (one screen pixel per step, never less than one source pixel; hold to
  // repeat, in the part) and Next handle. Each shows the nudge loupe on the selected handle.
  function bindHandleNudge() {
    let loupeTimer = 0;
    const flashLoupe = () => {
      app.nudgeLoupeUntil = performance.now() + CONFIG.nudge.loupeMs;
      CF.requestRender();
      clearTimeout(loupeTimer);
      loupeTimer = setTimeout(CF.requestRender, CONFIG.nudge.loupeMs + 50);
    };
    CF.bindNudgePad(byId('perspectiveNudge'), value => {
      const view = CF.currentView();
      if (!view || app.tab !== 'perspective' || app.previewMode) return;
      const stepPx = Math.max(1, 1 / view.zoom);
      const [directionX, directionY] = value.split(',').map(Number);
      const dx = directionX * stepPx;
      const dy = directionY * stepPx;
      CF.commit(state => CF.moveHandleBy(state, app.selected, dx, dy), 'nudge');
      flashLoupe();
    });
    const next = byId('btnNextHandle');
    const selectNextHandle = () => {
      app.selected = (app.selected + 1) % HANDLE_COUNT;
      flashLoupe();
      syncPerspectiveReadouts();
    };
    // On pointerdown, as the pad does: main.js cancels the touch on [data-nudge], which on iOS
    // also cancels the click. A keyboard or a screen reader presses it with a click.
    next.addEventListener('pointerdown', event => {
      event.preventDefault();
      selectNextHandle();
    });
    next.addEventListener('click', event => {
      if (event.detail === 0) selectNextHandle();
    });
  }

  // Binds the tools, the Flatten slider, the status's Cancel and the sheet's rows.
  function bindPerspective() {
    bindPerspectiveTools();
    bindFlattenSlider();
    // Arms (or cancels) Tap to find card: the next still tap on the photo finds the card there.
    // On the phone the sheet closes so the whole photo is there to tap; the status prompts,
    // with Cancel, until the tap.
    byId('btnFindCard').addEventListener('click', () => {
      app.findMode = !app.findMode;
      if (app.findMode) CF.closeSheets();
      CF.syncUI();
    });
    byId('perspectiveStatusAction').addEventListener('click', () => {
      app.findMode = false;
      CF.syncUI();
    });
    CF.bindSegmented(byId('orientation'), value => CF.commit(state => {
      state.aspect.orientation = value;
    }));
    byId('debugOverlay').addEventListener('change', event => {
      app.debugOverlay = event.target.checked;
      const hasDebugData = app.detection.last && app.detection.last.debug;
      if (app.debugOverlay && !hasDebugData) CF.runDetect();
      CF.requestRender();
    });
    // Selecting a handle on the photo (a press, or Tab) doesn't resync the controls, so the
    // label row's handle name is refreshed after each.
    const refreshHandle = () => {
      if (app.tab === 'perspective' && app.state) syncPerspectiveReadouts();
    };
    elements.canvas.addEventListener('pointerup', refreshHandle);
    window.addEventListener('keyup', refreshHandle);
  }

  // The tool row: the two modes swap the line, Candidate cycles, Snap and Preview switch.
  function bindPerspectiveTools() {
    const pickMode = mode => {
      lineMode = mode;
      CF.syncUI();
    };
    byId('toolNudge').addEventListener('click', () => pickMode('nudge'));
    byId('toolFlatten').addEventListener('click', () => pickMode('flatten'));
    byId('toolCandidate').addEventListener('click', () => {
      const count = app.detection.candidates.length;
      if (count) CF.useCandidate((app.detection.index + 1) % count);
    });
    byId('toolSnap').addEventListener('click', () => {
      app.snap = !app.snap;
      CF.syncUI();
    });
    byId('toolPreview').addEventListener('click', () => {
      app.previewMode = !app.previewMode;
      app.views.result = null;
      CF.syncUI();
      CF.requestRender();
    });
  }

  // Flatten updates live while sliding (geometry only); one undo step per slide.
  function bindFlattenSlider() {
    const strength = byId('strength');
    let strengthBefore = null;
    strength.addEventListener('input', () => {
      if (!strengthBefore) strengthBefore = clone(app.state);
      app.state.strength = strength.value / 100;
      syncFlattenValue(Number(strength.value));
      CF.liveChanged();
    });
    strength.addEventListener('change', () => {
      if (strengthBefore) CF.commitFrom(strengthBefore, 'strength');
      strengthBefore = null;
    });
  }

  /* ---------- syncing ---------- */
  // Writes the state into the controls: which rows show, the tools, the slider and the sheet.
  function syncPerspective(state) {
    const isPreview = !!app.previewMode;
    const flattenPercent = Math.round(state.strength * 100);
    byId('perspectiveNudgeRow').hidden = isPreview || lineMode !== 'nudge';
    byId('perspectiveFlattenRow').hidden = isPreview || lineMode !== 'flatten';
    byId('perspectivePreviewRow').hidden = !isPreview;
    CF.updateSlider(byId('strength').parentElement, { value: flattenPercent });
    syncFlattenValue(flattenPercent);
    CF.updateTool(byId('toolNudge'), {
      isOn: !isPreview && lineMode === 'nudge',
      isDisabled: isPreview,
    });
    CF.updateTool(byId('toolFlatten'), {
      isOn: !isPreview && lineMode === 'flatten',
      isDisabled: isPreview,
    });
    CF.updateTool(byId('toolSnap'), { isOn: !!app.snap });
    CF.updateTool(byId('toolPreview'), { isOn: isPreview });
    const count = app.detection.candidates.length;
    CF.updateTool(byId('toolCandidate'), {
      isDisabled: count < 2,
      valueText: count > 1 ? `${app.detection.index + 1}/${count}` : '',
    });
    CF.updateSegmented(byId('orientation'), state.aspect.orientation);
    byId('debugOverlay').checked = !!app.debugOverlay;
    byId('btnFindCard').setAttribute('aria-pressed', String(!!app.findMode));
  }

  // Flatten's value, in the tool (in place of its icon) and in its label row.
  function syncFlattenValue(flattenPercent) {
    CF.updateTool(byId('toolFlatten'), { valueText: `${flattenPercent}%` });
    if (lineMode === 'flatten') {
      CF.updateAdjustmentLine(byId('perspectiveLine'), { value: `${flattenPercent}%` });
    }
  }

  // The selected handle's name: "Corner 1 of 4" or "Edge 2 of 4".
  function handleName(index) {
    if (index < CORNER_COUNT) return `Corner ${index + 1} of ${CORNER_COUNT}`;
    return `Edge ${index - CORNER_COUNT + 1} of ${HANDLE_COUNT - CORNER_COUNT}`;
  }

  // Today's engine words a reason with a dash ("… inward — drag them …"); the approved wording
  // makes it two sentences.
  function asSentences(text) {
    return text.replace(/ — (\S)/, (match, letter) => '. ' + letter.toUpperCase());
  }

  // The message to act on, as { kind, text, actionLabel }, or null for none. Only the armed
  // Tap to find card carries a button (Cancel).
  function perspectiveStatus(geometry, candidate) {
    if (app.findMode) {
      return { kind: 'info', text: 'Tap the card in the photo.', actionLabel: 'Cancel' };
    }
    if (geometry && !geometry.ok) return { kind: 'error', text: asSentences(geometry.reason) };
    if (app.detection.message) return { kind: 'info', text: app.detection.message };
    if (candidate && candidate.confidence < CONFIG.detect.minConfidence) {
      const percent = Math.round(candidate.confidence * 100);
      return { kind: 'warn', text: `Low confidence (${percent}%). Check the corners.` };
    }
    if (!app.detection.candidates.length && app.img && app.detection.last) {
      return { kind: 'warn', text: 'Nothing detected. Drag the corners into place.' };
    }
    if (geometry && geometry.perspective.isClamped) {
      const text = `Corrected frame clamped to ${CONFIG.maxOutputPx}px on the long side.`;
      return { kind: 'info', text };
    }
    return null;
  }

  // The label row (or the status in its place) and the confidence readout at its right.
  function syncPerspectiveReadouts() {
    const count = app.detection.candidates.length;
    const candidate = count ? app.detection.candidates[app.detection.index] : null;
    const message = perspectiveStatus(app.geometry, candidate);
    const isStatusShown = CF.updateStatus(byId('perspectiveStatus'), message || { text: '' });
    const isPreview = !!app.previewMode;
    const line = byId('perspectiveLine');
    line.hidden = isStatusShown || isPreview;
    byId('perspectivePreviewLine').hidden = isStatusShown || !isPreview;
    const readout = candidate
      ? ['Confidence ', makeEl('b', {}, `${Math.round(candidate.confidence * 100)}%`)]
      : '';
    const isFlatten = lineMode === 'flatten';
    CF.updateAdjustmentLine(line, {
      name: isFlatten ? 'Flatten' : 'Nudge',
      value: isFlatten
        ? `${Math.round(app.state.strength * 100)}%`
        : handleName(Math.max(0, app.selected)),
      readout,
    });
  }

  Object.assign(CF, {
    buildPerspectiveControls,
    bindHandleNudge,
    bindPerspective,
    syncPerspective,
    syncPerspectiveReadouts,
  });
})(window.CF);
