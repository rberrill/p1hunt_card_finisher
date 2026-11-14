/* =====================================================================
   js/app/parts/status.js: the Status part. A message the user can act on. It takes the place of
   the step's label row while it shows: an icon (grey for info, amber for a warning, red for an
   error), up to two lines of text and, for some, one small button.
   Shell modules share one namespace, CF (created in core.js). Names from core are destructured
   below; anything from another module is called as CF.name. tests/selftest.js checks these
   boundaries.
   ===================================================================== */
(function (CF) {
  'use strict';
  const { makeEl } = CF;

  // The status icon, in CSS px.
  const STATUS_ICON_PX = 20;
  const STATUS_ICONS = { info: 'info', warn: 'warning', error: 'error' };

  // Builds a hidden status row. Its button (for a message with an action) has the id
  // `${id}Action`; the caller binds it.
  function buildStatus(id) {
    return makeEl('div', { class: 'label-row status-line', id, role: 'status', hidden: true },
      makeEl('span', { class: 'status-icon' }),
      makeEl('span', { class: 'status-text' }),
      CF.buildActionButton({ id: id && `${id}Action`, label: '', size: 'small' }));
  }

  // Shows a message, or hides the row when text is empty. Each call states the whole message
  // (unlike the other parts' updates, nothing carries over). kind: 'info' | 'warn' | 'error'.
  // actionLabel names the button; without it the button is hidden. Returns true while shown, so
  // the step can hide the label row it replaces.
  function updateStatus(status, { kind = 'info', text, actionLabel }) {
    const isShown = !!text;
    status.hidden = !isShown;
    if (!isShown) return false;
    for (const name of Object.keys(STATUS_ICONS)) {
      status.classList.toggle(`is-${name}`, name === kind);
    }
    status.querySelector('.status-icon').replaceChildren(
      CF.makeIcon(STATUS_ICONS[kind] || STATUS_ICONS.info, STATUS_ICON_PX),
    );
    status.querySelector('.status-text').textContent = text;
    const action = status.querySelector('.action-button');
    CF.updateActionButton(action, { label: actionLabel || '', isHidden: !actionLabel });
    return true;
  }

  Object.assign(CF, { buildStatus, updateStatus });
})(window.CF);
