/* =====================================================================
   js/app/parts/tab-bar.js: the Tab bar part. The six steps along the bottom of the phone, each
   an icon over its name; the current one is white and bold. Levels carries a white dot while
   its draft is unapplied.
   Shell modules share one namespace, CF (created in core.js). Names from core are destructured
   below; anything from another module is called as CF.name. tests/selftest.js checks these
   boundaries.
   ===================================================================== */
(function (CF) {
  'use strict';
  const { makeEl } = CF;

  // A tab's icon, in CSS px.
  const TAB_ICON_PX = 20;
  // Each step's icon (a name in CF.ICONS).
  const STEP_ICONS = {
    perspective: 'perspective',
    rotate: 'rotateRight',
    crop: 'crop',
    levels: 'levels',
    overlay: 'overlay',
    export: 'share',
  };

  // Builds the bar: one tab per step in CF.STEPS, in order. A tab's step is in data-step.
  function buildTabBar() {
    const tabs = Object.keys(CF.STEPS).map(step => makeEl('button', {
      class: 'step-tab',
      type: 'button',
      role: 'tab',
      'data-step': step,
      'aria-selected': 'false',
    },
    CF.makeIcon(STEP_ICONS[step], TAB_ICON_PX),
    makeEl('span', { class: 'step-tab-label' }, CF.STEPS[step]),
    step === 'levels' && makeEl('span', { class: 'step-tab-mark', hidden: true })));
    return makeEl('nav', { class: 'tab-bar', role: 'tablist', 'aria-label': 'Steps' }, ...tabs);
  }

  // Updates the bar; a value left out stays as it is.
  //   current         the step that is open
  //   isDisabled      no photo yet
  //   hasLevelsMark   Levels has an unapplied draft
  function updateTabBar(bar, { current, isDisabled, hasLevelsMark }) {
    bar.querySelectorAll('.step-tab').forEach(tab => {
      if (current !== undefined) {
        tab.setAttribute('aria-selected', String(tab.dataset.step === current));
      }
      if (isDisabled !== undefined) tab.disabled = !!isDisabled;
    });
    if (hasLevelsMark !== undefined) {
      bar.querySelector('.step-tab-mark').hidden = !hasLevelsMark;
    }
  }

  Object.assign(CF, { buildTabBar, updateTabBar });
})(window.CF);
