/* =====================================================================
   js/app/parts/action-button.js: the Action button part. A pill with a label and an optional
   icon. One red button per screen (the main action); white is the next thing to do.
   Shell modules share one namespace, CF (created in core.js). Names from core are destructured
   below; anything from another module is called as CF.name. tests/selftest.js checks these
   boundaries.
   ===================================================================== */
(function (CF) {
  'use strict';
  const { makeEl } = CF;

  // The icon inside a button, in CSS px.
  const BUTTON_ICON_PX = 18;
  const BUTTON_LOOKS = ['main', 'next', 'quiet'];

  // Builds a button.
  //   look     'main' (red: the screen's one main action), 'next' (white), 'quiet' (a lighter
  //            grey, on a card) or none
  //   size     'small' (36 px, in a status or the typed-angle bar), 'tall' (48 px, Export's save
  //            row and cards) or none (44 px)
  //   isWide   it shares the row's spare width
  function buildActionButton({ id, label, icon, look, size, isWide, title }) {
    const classes = ['action-button'];
    if (look) classes.push(`is-${look}`);
    if (size) classes.push(`is-${size}`);
    if (isWide) classes.push('is-wide');
    return makeEl('button', { class: classes.join(' '), id, type: 'button', title },
      icon && CF.makeIcon(icon, BUTTON_ICON_PX),
      makeEl('span', { class: 'action-label' }, label));
  }

  // Updates a button; a value left out stays as it is. look: '' clears it.
  function updateActionButton(button, { label, isDisabled, isHidden, look }) {
    if (label !== undefined) button.querySelector('.action-label').textContent = label;
    if (isDisabled !== undefined) button.disabled = !!isDisabled;
    if (isHidden !== undefined) button.hidden = !!isHidden;
    if (look !== undefined) {
      for (const name of BUTTON_LOOKS) button.classList.toggle(`is-${name}`, name === look);
    }
  }

  Object.assign(CF, { buildActionButton, updateActionButton });
})(window.CF);
