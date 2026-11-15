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

  // How long the line fades out when the export ends, in ms (css/app.css, .is-done; motion
  // M11), before it is hidden.
  const PROGRESS_FADE_MS = 200;

  // Shows the line at `fraction` (0 to 1) of the width; null ends it: it fades out, then is
  // hidden (at once under reduced motion).
  function updateProgressLine(line, fraction) {
    if (fraction == null) {
      endProgressLine(line);
      return;
    }
    const clamped = Math.min(1, Math.max(0, fraction));
    // Scaled, not resized: only transform and opacity animate, so nothing is laid out again
    // while the export is busy.
    const transform = `scaleX(${clamped})`;
    const isRestarting = line.hidden || line.classList.contains('is-done');
    clearTimeout(line.hideTimer);
    line.classList.remove('is-done');
    line.hidden = false;
    if (isRestarting) {
      // A new export, perhaps while the last one's line is still fading: it starts where it
      // is told to, at once, instead of shrinking back across the screen.
      line.classList.add('is-restarting');
      line.style.transform = transform;
      line.getBoundingClientRect();
      line.classList.remove('is-restarting');
    } else {
      line.style.transform = transform;
    }
    line.setAttribute('aria-valuenow', Math.round(clamped * 100));
  }

  // Fades the line out and hides it after; at once under reduced motion. Nothing happens to a
  // line that is already hidden or fading.
  function endProgressLine(line) {
    if (line.hidden || line.classList.contains('is-done')) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      line.hidden = true;
      return;
    }
    line.classList.add('is-done');
    line.hideTimer = setTimeout(() => {
      line.hidden = true;
      line.classList.remove('is-done');
    }, PROGRESS_FADE_MS);
  }

  Object.assign(CF, { buildProgressLine, updateProgressLine });
})(window.CF);
