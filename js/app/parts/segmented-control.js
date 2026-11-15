/* =====================================================================
   js/app/parts/segmented-control.js: the Segmented control part. A row of choices where one (or
   none) is selected, in white: Size, Format, Pick white / black, Card orientation, 4 photos /
   1 sheet, Together / Separately, and Front | Back as a compact one.
   Shell modules share one namespace, CF (created in core.js). Names from core are destructured
   below; anything from another module is called as CF.name. tests/selftest.js checks these
   boundaries.
   ===================================================================== */
(function (CF) {
  'use strict';
  const { makeEl } = CF;

  // Builds a control.
  //   label      what it chooses, for screen readers
  //   options    [{ value, label, lead }]; lead is an element shown before the label (a swatch)
  //   isFitted   each choice is as wide as its label, instead of sharing the row evenly
  //   isDense    smaller labels and tighter sides, where two controls share a row (Export's
  //              Size and Format)
  //   isCompact  the 36 px size, for the top bar
  //   isSliding  the white fill is one pill that slides to the tapped choice (M8: 180 ms).
  //              Only for choices of equal width (Front | Back): a pill that changed width as
  //              it slid would animate a size, which the motion rules don't allow.
  function buildSegmented({ id, label, options, isFitted, isDense, isCompact, isSliding }) {
    const classes = ['segmented-control'];
    if (isFitted) classes.push('is-fitted');
    if (isDense) classes.push('is-dense');
    if (isCompact) classes.push('is-compact');
    if (isSliding) classes.push('is-sliding');
    const segments = options.map(option => makeEl('button', {
      class: 'segment',
      type: 'button',
      'data-value': option.value,
      'aria-pressed': 'false',
    }, option.lead, option.label));
    return makeEl('div', {
      class: classes.join(' '),
      id,
      role: 'group',
      'aria-label': label,
    }, isSliding && makeEl('span', { class: 'segment-thumb', 'aria-hidden': 'true' }),
    ...segments);
  }

  // Selects the choice with this value; null (or a value no choice has) selects none. A
  // sliding control also takes the choice's position in data-index, which places its pill.
  function updateSegmented(control, value) {
    let selectedIndex = -1;
    control.querySelectorAll('.segment').forEach((segment, index) => {
      const isSelected = segment.dataset.value === String(value);
      segment.setAttribute('aria-pressed', String(isSelected));
      if (isSelected) selectedIndex = index;
    });
    if (!control.classList.contains('is-sliding')) return;
    if (selectedIndex < 0) delete control.dataset.index;
    else control.dataset.index = String(selectedIndex);
  }

  // Calls onPick(value) when a choice is tapped. The caller decides what that selects.
  function bindSegmented(control, onPick) {
    control.addEventListener('click', event => {
      const segment = event.target.closest('.segment');
      if (segment && !segment.disabled) onPick(segment.dataset.value);
    });
  }

  // A round swatch to lead a choice's label (Levels' picks): dashed and empty until a color
  // is picked.
  function buildSwatch(id) {
    return makeEl('span', { class: 'segment-swatch', id });
  }

  // Fills a swatch with a picked color ([red, green, blue], 0 to 255), or empties it (null).
  function updateSwatch(swatch, color) {
    const rgb = color && color.map(Math.round).join(', ');
    swatch.style.background = color ? `rgb(${rgb})` : '';
    swatch.classList.toggle('is-set', !!color);
    swatch.title = color ? `RGB ${rgb}` : 'Not set';
  }

  Object.assign(CF, {
    buildSegmented,
    updateSegmented,
    bindSegmented,
    buildSwatch,
    updateSwatch,
  });
})(window.CF);
