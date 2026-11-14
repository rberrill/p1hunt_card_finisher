/* =====================================================================
   js/app/parts/toast.js: the Toast part. A short message over the bottom edge of the photo (or
   just above an open sheet). It never takes a touch. The kinds differ by color, icon and
   wording, so none relies on color alone: info is white, a warning amber with a triangle, an
   error red with a circle.
   Shell modules share one namespace, CF (created in core.js). Names from core are destructured
   below; anything from another module is called as CF.name. tests/selftest.js checks these
   boundaries.
   ===================================================================== */
(function (CF) {
  'use strict';
  const { makeEl } = CF;

  // The toast icon, in CSS px.
  const TOAST_ICON_PX = 20;
  const TOAST_ICONS = { warn: 'warning', error: 'error' };

  // Builds an empty toast.
  function buildToast(id) {
    return makeEl('div', { class: 'toast-message', id, role: 'status', 'aria-live': 'polite' },
      makeEl('span', { class: 'toast-icon' }),
      makeEl('span', { class: 'toast-text' }));
  }

  // Sets the toast's message and whether it shows; a value left out stays as it is.
  // kind: '' (info) | 'warn' | 'error', the same names core's toast() takes.
  function updateToast(toastEl, { text, kind, isShown }) {
    if (text !== undefined) toastEl.querySelector('.toast-text').textContent = text;
    if (kind !== undefined) {
      toastEl.classList.toggle('is-warn', kind === 'warn');
      toastEl.classList.toggle('is-error', kind === 'error');
      const icon = TOAST_ICONS[kind];
      toastEl.querySelector('.toast-icon').replaceChildren(
        ...(icon ? [CF.makeIcon(icon, TOAST_ICON_PX)] : []),
      );
    }
    if (isShown !== undefined) toastEl.classList.toggle('is-shown', !!isShown);
  }

  Object.assign(CF, { buildToast, updateToast });
})(window.CF);
