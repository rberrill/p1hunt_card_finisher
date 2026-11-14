/* =====================================================================
   js/app/parts/top-bar.js: the Top bar part. Open on the left; Front | Back with Unpair beside
   it in the center while a pair is open; Fit (on the phone only while the photo is zoomed or
   panned), Undo and Redo on the right. Every button is an icon in a 44 px target. On a wide
   screen it also shows the app's name, Open's label and the steps (the tab bar, moved into
   its steps slot by shell.js), and Fit always shows.
   Shell modules share one namespace, CF (created in core.js). Names from core are destructured
   below; anything from another module is called as CF.name. tests/selftest.js checks these
   boundaries.
   ===================================================================== */
(function (CF) {
  'use strict';
  const { makeEl } = CF;

  // The app icon beside the name on a wide screen, in CSS px (the desktop frames draw it at 26).
  const BRAND_ICON_PX = 26;

  // An icon-only button: label is its name for screen readers, title its tooltip. shownLabel:
  // text shown beside the icon on a wide screen only (Open).
  function buildIconButton({ id, icon, label, title, isHidden, shownLabel }) {
    return makeEl('button', {
      class: 'icon-button',
      id,
      type: 'button',
      title: title || label,
      'aria-label': label,
      hidden: isHidden,
    },
    CF.makeIcon(icon),
    shownLabel && makeEl('span', { class: 'icon-button-label' }, shownLabel));
  }

  // The app's icon and name, shown on a wide screen only.
  function buildBrand() {
    return makeEl('span', { class: 'top-bar-brand' },
      makeEl('img', {
        src: `icons/icon.svg?v=${CONFIG.appVersion}`,
        alt: '',
        width: BRAND_ICON_PX,
        height: BRAND_ICON_PX,
      }),
      'Card Finisher');
  }

  // Builds the bar. Its controls keep the ids the old header used (btnOpen, btnUndo, btnRedo,
  // btnFit, sideSwitch, btnUnpair), so their handlers bind as before. The steps slot
  // (topBarSteps) is empty until shell.js moves the tab bar into it on a wide screen.
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
      buildBrand(),
      buildIconButton({ id: 'btnOpen', icon: 'open', label: 'Open photo', shownLabel: 'Open' }),
      makeEl('div', { class: 'top-bar-steps', id: 'topBarSteps' }),
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
