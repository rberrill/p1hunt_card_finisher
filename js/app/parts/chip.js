/* =====================================================================
   js/app/parts/chip.js: the Chip part. A crop preset: white while selected. On the phone the
   chips sit in one row that scrolls sideways and runs off the right edge, so it reads as
   scrollable; on a wide screen they wrap.
   Shell modules share one namespace, CF (created in core.js). Names from core are destructured
   below; anything from another module is called as CF.name. tests/selftest.js checks these
   boundaries.
   ===================================================================== */
(function (CF) {
  'use strict';
  const { makeEl } = CF;

  // Builds a chip; `value` is what it stands for (a preset id), read back from data-value.
  function buildChip({ label, value }) {
    return makeEl('button', {
      class: 'preset-chip',
      type: 'button',
      'data-value': value,
      'aria-pressed': 'false',
    }, label);
  }

  // Updates a chip; a value left out stays as it is.
  function updateChip(chip, { label, isOn, isDisabled }) {
    if (label !== undefined) chip.textContent = label;
    if (isOn !== undefined) chip.setAttribute('aria-pressed', String(!!isOn));
    if (isDisabled !== undefined) chip.disabled = !!isDisabled;
  }

  // The row the chips sit in.
  function buildChipRow(id, ...chips) {
    return makeEl('div', { class: 'chip-row', id }, ...chips);
  }

  // Scrolls the row so the selected chip is in view (the row rests on it). Does nothing when the
  // row doesn't scroll.
  function revealSelectedChip(row) {
    const chip = row.querySelector('.preset-chip[aria-pressed="true"]');
    if (!chip) return;
    const rowRect = row.getBoundingClientRect();
    const chipRect = chip.getBoundingClientRect();
    if (chipRect.right > rowRect.right) row.scrollLeft += chipRect.right - rowRect.right;
    else if (chipRect.left < rowRect.left) row.scrollLeft -= rowRect.left - chipRect.left;
  }

  Object.assign(CF, { buildChip, updateChip, buildChipRow, revealSelectedChip });
})(window.CF);
