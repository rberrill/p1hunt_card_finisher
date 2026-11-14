/* =====================================================================
   js/app/parts/progress-line.js: the Progress line part. A thin red line on the top edge of the
   control area, or of the open sheet, while an export or the corner shots render.
   Shell modules share one namespace, CF (created in core.js). Names from core are destructured
   below; anything from another module is called as CF.name. tests/selftest.js checks these
   boundaries.
   ===================================================================== */
(function (CF) {
  'use strict';
  const { makeEl } = CF;

  // Builds a hidden progress line.
  function buildProgressLine(id) {
    return makeEl('div', {
      class: 'progress-line',
      id,
      role: 'progressbar',
      'aria-valuemin': 0,
      'aria-valuemax': 100,
      hidden: true,
    });
  }

  // Shows the line at `fraction` (0 to 1) of the width; null hides it.
  function updateProgressLine(line, fraction) {
    line.hidden = fraction == null;
    if (fraction == null) return;
    const clamped = Math.min(1, Math.max(0, fraction));
    // Scaled, not resized: only transform and opacity animate, so nothing is laid out again
    // while the export is busy.
    line.style.transform = `scaleX(${clamped})`;
    line.setAttribute('aria-valuenow', Math.round(clamped * 100));
  }

  Object.assign(CF, { buildProgressLine, updateProgressLine });
})(window.CF);
