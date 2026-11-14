/* =====================================================================
   js/app/rotate.js: the Rotate step. Its control area (Straighten or Flip in the label and
   control rows, then the tool row: Straighten, Flip, 90° left, 90° right, Fill frame), the typed
   angle (the label row lifts above the on-screen keyboard), and its options sheet (Grid, Reset
   rotation, Tips).
   Shell modules share one namespace, CF (created in core.js). Names from core are
   destructured below; anything from another module is called as CF.name.
   tests/selftest.js checks these boundaries.
   ===================================================================== */
(function (CF) {
  'use strict';
  const { byId, makeEl, app } = CF;

  // The step's tips (the plan's approved wording, 14 November) and its keyboard help on a wide
  // screen (Claude's wording, recorded by the lead).
  const ROTATE_TIPS = [
    'Drag the ruler to straighten, or tap the angle to type it.',
    'Fill frame zooms in so a tilted photo leaves no empty corners.',
    'Flip mirrors the photo as you see it on screen.',
    'The grid is a guide; it is never exported.',
  ];
  const ROTATE_KEYS = ['F fits; 1 to 6 change step.'];
  // The pencil after the angle, in CSS px (the plan's frame R1).
  const PENCIL_ICON_PX = 14;
  // The on-screen keyboard is taken as up when it hides more than this much of the window, in
  // CSS px. Smaller differences are the browser's own bars coming and going.
  const KEYBOARD_MIN_PX = 120;
  // The true minus sign, as the plan writes negative angles (−3.5°).
  const MINUS_SIGN = '−';

  // What the control area shows, kept in this module only: the mode ('straighten' or 'flip')
  // and whether the angle is being typed. Neither is edit state, so neither is undone or saved.
  const rotateView = { mode: 'straighten', isTyping: false, isPressingTypingKey: false };

  /* ---------- building the control area and the sheet ---------- */
  // Builds Rotate's control area and options sheet into its section (the shell's contract).
  function buildRotateControls() {
    const section = document.querySelector('section[data-panel="rotate"]');
    const area = CF.buildControlArea('rotateArea',
      buildStraightenLine(),
      makeEl('div', { class: 'rotate-lift-gap', id: 'rotateLiftGap', hidden: true }),
      buildFlipLine(),
      CF.buildControlRow('rotateRulerRow', buildFineRuler()),
      buildFlipRow(),
      buildRotateTools());
    const sheet = CF.buildSheet({ id: 'rotateSheet', title: 'Rotate options' },
      CF.buildSheetList(CF.buildSwitchRow({ id: 'rotateGrid', icon: 'grid', label: 'Grid' })),
      CF.buildSheetList(buildResetRow()),
      CF.buildTipsRow('rotateTips', ROTATE_TIPS, ROTATE_KEYS));
    section.replaceChildren(area, sheet);
  }

  // Straighten's label row: STRAIGHTEN, the angle (a button that opens the typed angle, with
  // the field it swaps for), and Reset at the right. While typing, Reset gives way to ± and
  // Done (the decimal pad on a phone has no minus key, frame R3).
  function buildStraightenLine() {
    const angleButton = makeEl('button', {
      class: 'line-value rotate-angle',
      id: 'rotateAngle',
      type: 'button',
      title: 'Type the angle',
    },
    makeEl('span', { class: 'rotate-angle-face' },
      makeEl('span', { class: 'rotate-angle-text', id: 'rotateAngleText' }, '0.0°'),
      CF.makeIcon('pencil', PENCIL_ICON_PX)));
    const field = makeEl('input', {
      class: 'rotate-angle-field',
      id: 'rotateAngleField',
      type: 'text',
      inputmode: 'decimal',
      enterkeyhint: 'done',
      autocomplete: 'off',
      'aria-label': 'Angle in degrees',
      hidden: true,
    });
    const reset = CF.buildTextButton({
      id: 'btnRotateReset',
      label: 'Reset',
      title: 'Angle to 0°',
    });
    const plusMinus = CF.buildActionButton({
      id: 'btnAngleSign',
      label: '±',
      size: 'small',
      title: 'Change the sign',
    });
    const done = CF.buildActionButton({
      id: 'btnAngleDone',
      label: 'Done',
      look: 'next',
      size: 'small',
    });
    plusMinus.hidden = true;
    done.hidden = true;
    return CF.buildLabelRow('rotateStraightenLine',
      makeEl('span', { class: 'line-label' }, 'Straighten'),
      angleButton,
      field,
      makeEl('span', { class: 'line-spacer' }),
      reset,
      plusMinus,
      done);
  }

  // Flip's label row: FLIP, then what it means.
  function buildFlipLine() {
    const line = CF.buildLabelRow('rotateFlipLine',
      makeEl('span', { class: 'line-label' }, 'Flip'),
      makeEl('span', { class: 'line-readout' }, 'as you see it on screen'));
    line.hidden = true;
    return line;
  }

  // The ruler. Its range input keeps the id `fine`: tests/sample-regression.js reads it.
  function buildFineRuler() {
    const range = CONFIG.rotate.fineRangeDeg;
    return CF.buildRuler({
      id: 'fine',
      min: -range,
      max: range,
      step: CONFIG.rotate.fineStepDeg,
      label: 'Straighten angle in degrees',
    });
  }

  // Flip's control row: Horizontal and Vertical, each lit while that flip is on.
  function buildFlipRow() {
    const row = CF.buildControlRow('rotateFlipRow',
      CF.buildActionButton({ id: 'btnFlipHorizontal', label: 'Horizontal', isWide: true }),
      CF.buildActionButton({ id: 'btnFlipVertical', label: 'Vertical', isWide: true }));
    row.hidden = true;
    return row;
  }

  // The tool row: two modes, two actions and a switch.
  function buildRotateTools() {
    return CF.buildToolRow('rotateTools',
      CF.buildTool({ id: 'toolStraighten', kind: 'mode', label: 'Straighten', icon: 'straighten' }),
      CF.buildTool({ id: 'toolFlip', kind: 'mode', label: 'Flip', icon: 'flipHorizontal' }),
      CF.buildTool({
        id: 'toolRotateLeft',
        kind: 'action',
        label: '90° left',
        icon: 'rotateLeft',
        title: 'Rotate 90° left',
      }),
      CF.buildTool({
        id: 'toolRotateRight',
        kind: 'action',
        label: '90° right',
        icon: 'rotateRight',
        title: 'Rotate 90° right',
      }),
      CF.buildTool({
        id: 'toolFillFrame',
        kind: 'switch',
        label: 'Fill frame',
        icon: 'fillFrame',
        title: 'Fill frame: no empty corners',
      }));
  }

  // Reset rotation: the shell's step reset binds every [data-reset] button.
  function buildResetRow() {
    const row = CF.buildSheetRow({
      id: 'rotateResetRow',
      icon: 'rotateLeft',
      label: 'Reset rotation',
      isDanger: true,
    });
    row.dataset.reset = 'rotate';
    return row;
  }

  /* ---------- the edits ---------- */
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

  // Sets the fine angle in degrees, clamped to ±fineRangeDeg and rounded to 0.1°. `key` groups
  // a drag's many changes into one undo step; a typed angle or Reset is a step of its own.
  function setFine(degrees, key) {
    const range = CONFIG.rotate.fineRangeDeg;
    CF.commit(state => {
      state.rotation.fine = Math.round(Math.max(-range, Math.min(range, degrees)) * 10) / 10;
    }, key);
  }

  // The angle as the label row shows it: one decimal, a true minus sign, and never −0.0°.
  function angleText(degrees) {
    const text = (Math.abs(degrees) < 0.05 ? 0 : degrees).toFixed(1);
    return `${text.replace('-', MINUS_SIGN)}°`;
  }

  /* ---------- the typed angle (frame R3) ---------- */
  // Reads a typed angle: a hyphen or a true minus sign, and a decimal comma (the pad on a phone
  // set to some regions types one). Returns degrees, or 0 for an empty or unreadable entry, as
  // the old number box did.
  function readTypedAngle(text) {
    const normal = text.replace(MINUS_SIGN, '-').replace(',', '.').replace('°', '').trim();
    const degrees = parseFloat(normal);
    return Number.isFinite(degrees) ? degrees : 0;
  }

  // Opens the typed angle: the field takes the angle's place, ± and Done take Reset's, and on a
  // phone the row lifts above the keyboard once it is up.
  function startTyping() {
    if (rotateView.isTyping || !app.state) return;
    rotateView.isTyping = true;
    const field = byId('rotateAngleField');
    field.value = angleText(app.state.rotation.fine).replace('°', '');
    showTypingControls(true);
    field.focus({ preventScroll: true });
    field.select();
    placeTypingRow();
  }

  // Closes the typed angle; commits it when `shouldCommit`, through the same clamp and rounding
  // as the ruler.
  function stopTyping(shouldCommit) {
    if (!rotateView.isTyping) return;
    rotateView.isTyping = false;
    const field = byId('rotateAngleField');
    const degrees = readTypedAngle(field.value);
    showTypingControls(false);
    placeTypingRow();
    if (shouldCommit) setFine(degrees);
    if (document.activeElement === field) field.blur();
    if (app.state) syncRotate(app.state);
  }

  // Swaps the row's parts between resting (the angle and Reset) and typing (the field, ± and
  // Done).
  function showTypingControls(isTyping) {
    byId('rotateAngle').hidden = isTyping;
    byId('rotateAngleField').hidden = !isTyping;
    byId('btnRotateReset').hidden = isTyping;
    byId('btnAngleSign').hidden = !isTyping;
    byId('btnAngleDone').hidden = !isTyping;
  }

  // ± changes the typed angle's sign, keeping the caret at the end.
  function toggleTypedSign() {
    const field = byId('rotateAngleField');
    const text = field.value.trim();
    const isNegative = text.startsWith('-') || text.startsWith(MINUS_SIGN);
    field.value = isNegative ? text.slice(1) : `${MINUS_SIGN}${text}`;
    field.focus({ preventScroll: true });
    field.setSelectionRange(field.value.length, field.value.length);
  }

  // Lifts Straighten's label row above the on-screen keyboard while the angle is typed on a
  // phone. The iOS keyboard doesn't resize the page, only the visual viewport, so the row is
  // placed from window.visualViewport: its bottom on the viewport's bottom edge. A gap the
  // row's height keeps the ruler where it was. Anywhere else the row stays in place.
  function placeTypingRow() {
    const row = byId('rotateStraightenLine');
    const viewport = window.visualViewport;
    const hiddenPx = viewport ? window.innerHeight - viewport.height * viewport.scale : 0;
    const isLifted = rotateView.isTyping
      && CF.phoneLayout.matches
      && !!viewport
      && hiddenPx > KEYBOARD_MIN_PX;
    row.classList.toggle('is-lifted', isLifted);
    byId('rotateLiftGap').hidden = !isLifted;
    if (!isLifted) {
      row.style.top = '';
      return;
    }
    const rowHeightPx = row.getBoundingClientRect().height;
    row.style.top = `${viewport.offsetTop + viewport.height - rowHeightPx}px`;
  }

  // The typed angle's events: Enter or Done commits; Escape or a tap anywhere else cancels.
  // A press on ± or Done would take the focus from the field first, so it is held there.
  function bindTyping() {
    const field = byId('rotateAngleField');
    byId('rotateAngle').addEventListener('click', startTyping);
    field.addEventListener('keydown', event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        stopTyping(true);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        stopTyping(false);
      }
    });
    field.addEventListener('blur', () => {
      if (rotateView.isPressingTypingKey) {
        field.focus({ preventScroll: true });
        return;
      }
      stopTyping(false);
    });
    for (const key of [byId('btnAngleSign'), byId('btnAngleDone')]) {
      key.addEventListener('pointerdown', event => {
        rotateView.isPressingTypingKey = true;
        event.preventDefault();
      });
      key.addEventListener('mousedown', event => event.preventDefault());
    }
    const release = () => {
      rotateView.isPressingTypingKey = false;
    };
    document.addEventListener('pointerup', release, true);
    document.addEventListener('pointercancel', release, true);
    byId('btnAngleSign').addEventListener('click', toggleTypedSign);
    byId('btnAngleDone').addEventListener('click', () => stopTyping(true));
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', placeTypingRow);
      window.visualViewport.addEventListener('scroll', placeTypingRow);
    }
  }

  /* ---------- binding and syncing ---------- */
  // Shows the mode's label and control rows and lights its tool.
  function setRotateMode(mode) {
    if (rotateView.isTyping) stopTyping(false);
    rotateView.mode = mode;
    if (app.state) syncRotate(app.state);
  }

  // Binds the step's controls once, at start-up.
  function bindRotate() {
    byId('toolStraighten').addEventListener('click', () => setRotateMode('straighten'));
    byId('toolFlip').addEventListener('click', () => setRotateMode('flip'));
    byId('toolRotateLeft').addEventListener('click', () => turn(-1));
    byId('toolRotateRight').addEventListener('click', () => turn(1));
    byId('toolFillFrame').addEventListener('click', () => CF.commit(state => {
      state.rotation.fillFrame = !state.rotation.fillFrame;
    }));
    byId('btnFlipHorizontal').addEventListener('click', () => flip('h'));
    byId('btnFlipVertical').addEventListener('click', () => flip('v'));
    byId('fine').addEventListener('input', event => setFine(Number(event.target.value), 'fine'));
    byId('btnRotateReset').addEventListener('click', () => setFine(0));
    byId('rotateGrid').addEventListener('change', event => {
      app.showGrid = event.target.checked;
      CF.requestRender();
    });
    bindTyping();
  }

  // Writes the state into the controls: the angle and the ruler, both flips, Fill frame, the
  // grid, and which mode is showing. Leaving the step closes the typed angle unsaved.
  function syncRotate(state) {
    if (rotateView.isTyping && app.tab !== 'rotate') stopTyping(false);
    const fine = state.rotation.fine;
    const isFlipMode = rotateView.mode === 'flip';
    byId('rotateAngleText').textContent = angleText(fine);
    byId('btnRotateReset').disabled = !app.img || fine === 0;
    CF.updateRuler(byId('fine').closest('.ruler'), { value: fine });
    byId('rotateStraightenLine').hidden = isFlipMode;
    byId('rotateRulerRow').hidden = isFlipMode;
    byId('rotateFlipLine').hidden = !isFlipMode;
    byId('rotateFlipRow').hidden = !isFlipMode;
    CF.updateTool(byId('toolStraighten'), { isOn: !isFlipMode });
    CF.updateTool(byId('toolFlip'), { isOn: isFlipMode });
    CF.updateTool(byId('toolFillFrame'), { isOn: !!state.rotation.fillFrame });
    syncFlipButton(byId('btnFlipHorizontal'), state.flip.h);
    syncFlipButton(byId('btnFlipVertical'), state.flip.v);
    byId('rotateGrid').checked = app.showGrid;
  }

  // A flip button is lit (white, the plan's selected look) while that flip is on.
  function syncFlipButton(button, isOn) {
    button.setAttribute('aria-pressed', String(!!isOn));
    CF.updateActionButton(button, { look: isOn ? 'next' : '' });
  }

  Object.assign(CF, {
    buildRotateControls,
    bindRotate,
    syncRotate,
  });
})(window.CF);
