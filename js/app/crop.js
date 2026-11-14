/* =====================================================================
   js/app/crop.js: the Crop step's controls: the preset chips, Swap, Fit to card and
   the crop readout.
   Shell modules share one namespace, CF (created in core.js). Names from core are
   destructured below; anything from another module is called as CF.name.
   tests/selftest.js checks these boundaries.
   ===================================================================== */
(function (CF) {
  'use strict';
  const { byId, makeEl, app } = CF;

  // One chip per preset in CONFIG, then Swap.
  function buildCropChips() {
    const chips = CONFIG.crop.presets.map(
      preset => makeEl('button', { class: 'chip', 'data-crop': preset.id }, preset.label),
    );
    const swapAttributes = { class: 'chip', id: 'btnSwap', title: 'Swap portrait / landscape' };
    const swap = makeEl('button', swapAttributes, '⇄ Swap');
    byId('cropChips').replaceChildren(...chips, swap);
  }

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

  function bindCrop() {
    byId('cropChips').addEventListener('click', event => {
      const chip = event.target.closest('[data-crop]');
      if (chip) pickCropPreset(chip.dataset.crop);
    });
    byId('btnSwap').onclick = () => {
      if (app.pair) CF.swapPair();
      else swapCrop();
    };
    byId('btnFitToCard').onclick = () => CF.commit(state => {
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

  // The chips: which is selected, their labels in the crop's orientation, and the pair lock.
  function syncCrop(state) {
    const orient = CF.cropOrient(state, app.geometry);
    document.querySelectorAll('[data-crop]').forEach(chip => {
      chip.setAttribute('aria-pressed', String(chip.dataset.crop === state.crop.preset));
      // A pair is locked to 5:7.
      if (app.pair) chip.disabled = chip.dataset.crop !== state.crop.preset;
      const preset = CONFIG.crop.presets.find(candidate => candidate.id === chip.dataset.crop);
      chip.textContent = CF.cropLabel(preset, orient);
    });
    byId('btnSwap').disabled = !state.crop.ratio || state.crop.ratio === 1;
  }

  // The crop's size in pixels; empty while the corners are invalid.
  function syncCropReadout() {
    const geometry = app.geometry;
    if (!geometry || !geometry.ok) {
      byId('cropReadout').textContent = '';
      return;
    }
    const { crop } = geometry;
    const cropSize = `${Math.round(crop.width)} × ${Math.round(crop.height)}`;
    byId('cropReadout').replaceChildren('Crop ', makeEl('b', null, cropSize), ' px');
  }

  Object.assign(CF, {
    buildCropChips,
    bindCrop,
    syncCrop,
    syncCropReadout,
  });
})(window.CF);
