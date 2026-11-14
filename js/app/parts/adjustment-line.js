/* =====================================================================
   js/app/parts/adjustment-line.js: the Adjustment line part. The control area shows one
   adjustment at a time: a label row (its name, its value, and a readout at the right) above a
   control row (its slider, ruler or pad), with the step's tool row under them.
   Shell modules share one namespace, CF (created in core.js). Names from core are destructured
   below; anything from another module is called as CF.name. tests/selftest.js checks these
   boundaries.
   ===================================================================== */
(function (CF) {
  'use strict';
  const { makeEl } = CF;

  // Builds the control area: the 200 px block under the photo that holds a step's rows. Its
  // grabber (id `${id}Grabber`) opens the step's sheet, and its progress line (id
  // `${id}Progress`) runs along its top edge during an export. The caller binds the grabber.
  function buildControlArea(id, ...children) {
    return makeEl('div', { class: 'control-area', id },
      makeEl('button', {
        class: 'grabber',
        id: id && `${id}Grabber`,
        type: 'button',
        'aria-label': 'Options',
        'aria-haspopup': 'dialog',
      }),
      CF.buildProgressLine(id && `${id}Progress`),
      ...children);
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
    buildControlArea,
    buildAdjustmentLine,
    updateAdjustmentLine,
    buildLabelRow,
    buildControlRow,
    buildToolRow,
    buildTextButton,
  });
})(window.CF);
