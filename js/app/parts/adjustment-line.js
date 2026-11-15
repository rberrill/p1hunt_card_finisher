/* =====================================================================
   js/app/parts/adjustment-line.js: the Adjustment line part. The control area shows one
   adjustment at a time: a label row (its name, its value, and a readout at the right) above a
   control row (its slider, ruler or pad), with the step's tool row under them. Two short
   motions belong to it (the plan's M3 and M7): a mode tap swaps the line with a fade, and a
   step change fades the new step's rows in.
   Shell modules share one namespace, CF (created in core.js). Names from core are destructured
   below; anything from another module is called as CF.name. tests/selftest.js checks these
   boundaries.
   ===================================================================== */
(function (CF) {
  'use strict';
  const { makeEl } = CF;

  // M3 (the plan's motion section): the old line fades out over this long before the new one
  // replaces it and rises in (100 ms, the `line-in` keyframes in css/app.css).
  const LINE_LEAVE_MS = 60;
  // The control area of each line swap still waiting for its old line to fade, with its timer,
  // so a second mode tap inside the 60 ms replaces the first instead of stacking.
  const pendingSwaps = new Map();
  // The phone's "reduce motion" setting. Motion that is a timed redraw or JS sequence (not a
  // CSS transition the stylesheet's reduced-motion rule already answers) checks it.
  const reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');

  // True while the phone or computer asks for reduced motion.
  function isMotionReduced() {
    return reducedMotionQuery.matches;
  }

  // Builds the control area: the 200 px block under the photo that holds a step's rows. Its
  // grabber (id `${id}Grabber`), a tab with an up chevron on its top edge (the Sheet part's
  // buildHandleTab), opens the step's sheet, and its progress line (id `${id}Progress`) runs
  // along its top edge during an export. The caller binds the grabber.
  function buildControlArea(id, ...children) {
    const area = makeEl('div', { class: 'control-area', id },
      makeEl('button', {
        class: 'grabber',
        id: id && `${id}Grabber`,
        type: 'button',
        'aria-label': 'Options',
        'aria-haspopup': 'dialog',
      }, CF.buildHandleTab()),
      CF.buildProgressLine(id && `${id}Progress`),
      ...children);
    area.addEventListener('animationend', endAreaAnimation);
    area.addEventListener('animationcancel', endAreaAnimation);
    return area;
  }

  // Takes a finished (or cancelled) arrival or line-in animation's class off again, so the next
  // one can start. Both bubble up to the control area from its rows.
  function endAreaAnimation(event) {
    if (event.animationName === 'area-in') event.currentTarget.classList.remove('is-arriving');
    if (event.animationName === 'line-in') event.target.classList.remove('is-entering');
  }

  // The label and control rows on screen in a control area. A status in the label row's place
  // is left out: it says the same before and after a mode tap, so it doesn't blink.
  function shownLineRows(area) {
    const selector = ':scope > .label-row:not(.status-line), :scope > .control-row';
    return [...area.querySelectorAll(selector)].filter(row => !row.hidden);
  }

  // M3: swaps the adjustment line after a mode tap. The rows on screen fade out over 60 ms, then
  // applySwap() (the step's own sync, which hides and shows its rows) runs and the rows now
  // shown rise 6 px and fade in over 100 ms. The caller lights the tapped tool before calling,
  // so the white fill moves at the tap. Under reduced motion the swap is instant. Only a mode
  // tap comes here; a sync from undo, a step change or a resume swaps at once, as before.
  function swapLine(area, applySwap) {
    const pending = pendingSwaps.get(area);
    if (pending) clearTimeout(pending);
    pendingSwaps.delete(area);
    const leaving = pending
      ? [...area.querySelectorAll(':scope > .is-leaving')]
      : shownLineRows(area);
    if (isMotionReduced()) {
      leaving.forEach(row => row.classList.remove('is-leaving'));
      applySwap();
      return;
    }
    leaving.forEach(row => {
      row.classList.remove('is-entering');
      row.classList.add('is-leaving');
    });
    pendingSwaps.set(area, setTimeout(() => {
      pendingSwaps.delete(area);
      leaving.forEach(row => row.classList.remove('is-leaving'));
      applySwap();
      shownLineRows(area).forEach(row => restartClass(row, 'is-entering'));
    }, LINE_LEAVE_MS));
  }

  // M7: fades a step's control rows in over 120 ms after a step change (the `area-in`
  // keyframes). The grabber and the progress line don't fade; the tab bar changed at once.
  function fadeInControlArea(area) {
    // An area hidden before its fade's first frame gets no animationend, so its class would
    // stay: every other area's goes now.
    document.querySelectorAll('.control-area.is-arriving').forEach(other => {
      if (other !== area) other.classList.remove('is-arriving');
    });
    if (!area || isMotionReduced()) return;
    restartClass(area, 'is-arriving');
  }

  // Adds an animation class, restarting the animation if the class was already there.
  function restartClass(el, className) {
    el.classList.remove(className);
    // Reading a layout value makes the browser see the removal, so the animation starts over.
    void el.offsetWidth;
    el.classList.add(className);
  }

  // Builds a label row: the adjustment's name in small capitals, its value in bold, then a
  // readout pushed to the right. Extra children (a text button such as Reset) follow the value.
  function buildAdjustmentLine({ id, name }, ...extras) {
    return makeEl('div', { class: 'label-row', id },
      makeEl('span', { class: 'line-label' }, name),
      makeEl('span', { class: 'line-value' }),
      makeEl('span', { class: 'line-spacer' }),
      makeEl('span', { class: 'line-readout' }),
      ...extras);
  }

  // Updates a label row; a value left out stays as it is. readout: text, or a list of text and
  // elements (such as 'Confidence ' and a bold number).
  function updateAdjustmentLine(line, { name, value, readout }) {
    if (name !== undefined) line.querySelector('.line-label').textContent = name;
    if (value !== undefined) line.querySelector('.line-value').textContent = value;
    if (readout !== undefined) {
      line.querySelector('.line-readout').replaceChildren(...[].concat(readout));
    }
  }

  // A label row built from the caller's own children (Levels' Discard, hint and Apply).
  function buildLabelRow(id, ...children) {
    return makeEl('div', { class: 'label-row', id }, ...children);
  }

  // The row under the label row: the adjustment's own control.
  function buildControlRow(id, ...children) {
    return makeEl('div', { class: 'control-row', id }, ...children);
  }

  // The row of tools at the bottom of the control area: up to five.
  function buildToolRow(id, ...tools) {
    return makeEl('div', { class: 'tool-row', id }, ...tools);
  }

  // A plain text button in a label row (Reset).
  function buildTextButton({ id, label, title }) {
    return makeEl('button', { class: 'text-button', id, type: 'button', title }, label);
  }

  Object.assign(CF, {
    isMotionReduced,
    swapLine,
    fadeInControlArea,
    buildControlArea,
    buildAdjustmentLine,
    updateAdjustmentLine,
    buildLabelRow,
    buildControlRow,
    buildToolRow,
    buildTextButton,
  });
})(window.CF);
