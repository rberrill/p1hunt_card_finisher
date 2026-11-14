/* =====================================================================
   js/app/parts/top-bar.js: the Top bar part. Open on the left; Front | Back with Unpair beside
   it in the center while a pair is open; Fit (only while the photo is zoomed or panned), Undo
   and Redo on the right. Every button is an icon in a 44 px target.
   Shell modules share one namespace, CF (created in core.js). Names from core are destructured
   below; anything from another module is called as CF.name. tests/selftest.js checks these
   boundaries.
   ===================================================================== */
(function (CF) {
  'use strict';
  const { makeEl } = CF;

  // An icon-only button: label is its name for screen readers, title its tooltip.
  function buildIconButton({ id, icon, label, title, isHidden }) {
    return makeEl('button', {
      class: 'icon-button',
      id,
      type: 'button',
      title: title || label,
      'aria-label': label,
      hidden: isHidden,
    }, CF.makeIcon(icon));
  }

  // Builds the bar. Its controls keep the ids the old header used (btnOpen, btnUndo, btnRedo,
  // btnFit, sideSwitch, btnUnpair), so their handlers bind as before.
  function buildTopBar() {
    const sideSwitch = CF.buildSegmented({
      id: 'sideSwitch',
      label: 'Card side',
      isCompact: true,
      options: [
        { value: 'front', label: 'Front' },
        { value: 'back', label: 'Back' },
      ],
    });
    sideSwitch.hidden = true;
    return makeEl('header', { class: 'top-bar' },
      buildIconButton({ id: 'btnOpen', icon: 'open', label: 'Open photo' }),
      makeEl('div', { class: 'top-bar-center' },
        sideSwitch,
        buildIconButton({
          id: 'btnUnpair',
          icon: 'unpair',
          label: 'Unpair',
          title: 'Unpair (keep one side)',
          isHidden: true,
        })),
      buildIconButton({
        id: 'btnFit',
        icon: 'fit',
        label: 'Fit to screen',
        title: 'Fit to screen (F)',
        isHidden: true,
      }),
      buildIconButton({ id: 'btnUndo', icon: 'undo', label: 'Undo', title: 'Undo (Ctrl/Cmd+Z)' }),
      buildIconButton({
        id: 'btnRedo',
        icon: 'redo',
        label: 'Redo',
        title: 'Redo (Shift+Ctrl/Cmd+Z)',
      }));
  }

  // Updates the bar; a value left out stays as it is.
  //   canUndo, canRedo   whether there is a step to undo or redo
  //   isFitShown         the photo is zoomed or panned (on a wide screen Fit always shows)
  //   pairSide           'front' | 'back' while a pair is open, null otherwise
  //   isSwitchDisabled   a side switch or an export is running
  function updateTopBar(bar, { canUndo, canRedo, isFitShown, pairSide, isSwitchDisabled }) {
    const find = selector => bar.querySelector(selector);
    if (canUndo !== undefined) find('#btnUndo').disabled = !canUndo;
    if (canRedo !== undefined) find('#btnRedo').disabled = !canRedo;
    if (isFitShown !== undefined) find('#btnFit').hidden = !isFitShown;
    if (pairSide !== undefined) {
      find('#sideSwitch').hidden = !pairSide;
      find('#btnUnpair').hidden = !pairSide;
      CF.updateSegmented(find('#sideSwitch'), pairSide);
    }
    if (isSwitchDisabled !== undefined) {
      bar.querySelectorAll('#sideSwitch .segment, #btnUnpair').forEach(control => {
        control.disabled = !!isSwitchDisabled;
      });
    }
  }

  Object.assign(CF, { buildIconButton, buildTopBar, updateTopBar });
})(window.CF);
