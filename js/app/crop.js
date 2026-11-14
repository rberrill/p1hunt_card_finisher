/* =====================================================================
   js/app/crop.js: the Crop step. Its control area (the label row: CROP, the crop's size and,
   while a pair is open, why the presets are locked; the control row: the presets as chips in
   one row; the tool row: Fit to card and Swap) and its options sheet (Reset crop, Tips).
   Shell modules share one namespace, CF (created in core.js). Names from core are
   destructured below; anything from another module is called as CF.name.
   tests/selftest.js checks these boundaries.
   ===================================================================== */
(function (CF) {
  'use strict';
  const { byId, makeEl, app } = CF;

  // The step's tip (the plan's approved wording, 14 November) and its keyboard help on a wide
  // screen (frame DT4).
  const CROP_TIPS = ['Drag inside the box to move it, and its handles to resize.'];
  const CROP_KEYS = [
    'Shift keeps the aspect in Free.',
  ];
  // The label row's note while a pair is open (the plan's approved wording).
  const PAIR_NOTE = 'Pair: 5:7 only';

  // What the preset row last rested on: the selected preset and its label's orientation, while
  // the step was open. Only this module reads it; it is not edit state.
  let restingPreset = '';

  /* ---------- building the control area and the sheet ---------- */
  // Builds Crop's control area and options sheet into its section (the shell's contract).
  function buildCropControls() {
    const section = document.querySelector('section[data-panel="crop"]');
    const area = CF.buildControlArea('cropArea',
      buildCropLine(),
      buildPresetRow(),
      buildCropTools());
    const sheet = CF.buildSheet({ id: 'cropSheet', title: 'Crop options' },
      CF.buildSheetList(buildCropResetRow()),
      CF.buildTipsRow('cropTips', CROP_TIPS, CROP_KEYS));
    section.replaceChildren(area, sheet);
  }

  // The label row: CROP, the crop's size in bold, "px", and the pair's note at the right.
  function buildCropLine() {
    const unit = makeEl('span', { class: 'line-readout', id: 'cropUnit' }, 'px');
    const pairNote = makeEl('span', { class: 'line-readout', id: 'cropPairNote' }, PAIR_NOTE);
    pairNote.hidden = true;
    return CF.buildLabelRow('cropLine',
      makeEl('span', { class: 'line-label' }, 'Crop'),
      makeEl('span', { class: 'line-value', id: 'cropSize' }),
      unit,
      makeEl('span', { class: 'line-spacer' }),
      pairNote);
  }

  // The control row: one chip per preset in CONFIG. On the phone the row scrolls sideways; on
  // a wide screen it wraps (the chip part's rules).
  function buildPresetRow() {
    const chips = CONFIG.crop.presets.map(
      preset => CF.buildChip({ label: preset.label, value: preset.id }),
    );
    const row = CF.buildChipRow('cropPresets', ...chips);
    row.setAttribute('role', 'group');
    row.setAttribute('aria-label', 'Crop preset');
    return row;
  }

  // The tool row: two actions.
  function buildCropTools() {
    return CF.buildToolRow('cropTools',
      CF.buildTool({
        id: 'toolFitToCard',
        kind: 'action',
        label: 'Fit to card',
        icon: 'fit',
        title: 'Put the crop back around the card',
      }),
      CF.buildTool({
        id: 'toolSwap',
        kind: 'action',
        label: 'Swap',
        icon: 'swap',
        title: 'Swap portrait / landscape',
      }));
  }

  // Reset crop: the shell's step reset binds every [data-reset] button.
  function buildCropResetRow() {
    const row = CF.buildSheetRow({
      id: 'cropResetRow',
      icon: 'rotateLeft',
      label: 'Reset crop',
      isDanger: true,
    });
    row.dataset.reset = 'crop';
    return row;
  }

  /* ---------- the edits ---------- */
  // Picks a crop preset. A manual box is reshaped to the new aspect with the same center and area.
  // A pair keeps 5:7; once unpaired, a picked preset is remembered again.
  function pickCropPreset(presetId) {
    if (app.pair) return;
    app.isPairCrop = false;
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

  // Fit to card: the preset goes back around the card, dropping a box drawn by hand.
  function fitCropToCard() {
    CF.commit(state => {
      state.crop.mode = 'fit';
      state.crop.rect = null;
    });
  }

  // Swap on a single photo: the crop turns between portrait and landscape (one undo step).
  function swapCrop() {
    CF.commit(state => {
      const next = CF.cropOrient(state, app.geometry) === 'portrait' ? 'landscape' : 'portrait';
      state.crop.orient = next === CF.cardOrient(app.geometry) ? null : next;
      state.crop.swapped = !state.crop.swapped;
      if (state.crop.mode === 'manual' && state.crop.rect) {
        const rect = state.crop.rect;
        state.crop.rect = { cx: rect.cx, cy: rect.cy, w: rect.h, h: rect.w };
      }
    });
  }

  /* ---------- binding and syncing ---------- */
  // Binds the step's controls once, at start-up.
  function bindCrop() {
    byId('cropPresets').addEventListener('click', event => {
      const chip = event.target.closest('.preset-chip');
      if (chip) pickCropPreset(chip.dataset.value);
    });
    byId('toolFitToCard').addEventListener('click', fitCropToCard);
    byId('toolSwap').addEventListener('click', () => {
      if (app.pair) CF.swapPair();
      else swapCrop();
    });
  }

  // Writes the state into the controls: which chip is selected, the labels in the crop's
  // orientation, the pair's lock (only its 5:7 chip is enabled) and its note, and Swap, which
  // is off for a preset with nothing to turn (Free and 1:1).
  function syncCrop(state) {
    const orient = CF.cropOrient(state, app.geometry);
    const isPaired = !!app.pair;
    const row = byId('cropPresets');
    row.querySelectorAll('.preset-chip').forEach(chip => {
      const presetId = chip.dataset.value;
      const preset = CONFIG.crop.presets.find(candidate => candidate.id === presetId);
      const isSelected = presetId === state.crop.preset;
      CF.updateChip(chip, {
        label: CF.cropLabel(preset, orient),
        isOn: isSelected,
        isDisabled: isPaired && !isSelected,
      });
    });
    byId('cropPairNote').hidden = !isPaired;
    CF.updateTool(byId('toolSwap'), {
      isDisabled: !state.crop.ratio || state.crop.ratio === 1,
    });
    restPresetRow(row, `${state.crop.preset} ${orient}`);
  }

  // Rests the preset row on the selected chip (the phone's row scrolls sideways): when the step
  // opens, and when the selection or its label changes while it is open. Between those the row
  // stays where the user scrolled it.
  function restPresetRow(row, selection) {
    if (app.tab !== 'crop') {
      restingPreset = '';
      return;
    }
    if (selection === restingPreset) return;
    restingPreset = selection;
    CF.revealSelectedChip(row);
  }

  // The crop's size in pixels; empty while the corners are invalid.
  function syncCropReadout() {
    const geometry = app.geometry;
    const isValid = !!geometry && geometry.ok;
    byId('cropUnit').hidden = !isValid;
    if (!isValid) {
      byId('cropSize').textContent = '';
      return;
    }
    const { crop } = geometry;
    byId('cropSize').textContent = `${Math.round(crop.width)} × ${Math.round(crop.height)}`;
  }

  Object.assign(CF, {
    buildCropControls,
    bindCrop,
    syncCrop,
    syncCropReadout,
  });
})(window.CF);
