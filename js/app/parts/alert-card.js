/* =====================================================================
   js/app/parts/alert-card.js: the Alert card part. A question the user must answer before going
   on (Upscale, Unpair, New photo or Replace side): a card centered over the dimmed photo with
   two choices and Cancel. A tap outside the card cancels.
   Shell modules share one namespace, CF (created in core.js). Names from core are destructured
   below; anything from another module is called as CF.name. tests/selftest.js checks these
   boundaries.
   ===================================================================== */
(function (CF) {
  'use strict';
  const { makeEl } = CF;

  // Builds a hidden card. Its two choice buttons and Cancel are bound once, here; what a choice
  // does comes with each question (showAlert).
  function buildAlertCard(id) {
    const titleId = id && `${id}Title`;
    const choices = [0, 1].map(() => CF.buildActionButton({
      label: '',
      look: 'quiet',
      size: 'tall',
      isWide: true,
    }));
    const cancel = makeEl('button', { class: 'alert-cancel', type: 'button' }, 'Cancel');
    const layer = makeEl('div', {
      class: 'alert-layer',
      id,
      role: 'dialog',
      'aria-modal': 'true',
      'aria-labelledby': titleId,
      hidden: true,
    },
    makeEl('div', { class: 'alert-card' },
      makeEl('h2', { class: 'alert-title', id: titleId }),
      makeEl('p', { class: 'alert-text' }),
      makeEl('div', { class: 'alert-choices' }, ...choices),
      cancel));
    choices.forEach((button, i) => {
      button.addEventListener('click', () => answerAlert(layer, i));
    });
    cancel.addEventListener('click', () => hideAlert(layer));
    // The layer is the dimmed backdrop: a tap on it, outside the card, cancels.
    layer.addEventListener('click', event => {
      if (event.target === layer) hideAlert(layer);
    });
    return layer;
  }

  // Sets the card's words; a value left out stays as it is. choices: two of { label, isMain };
  // the main one is red (there may be none, when neither answer is the expected one).
  function updateAlertCard(layer, { title, text, choices }) {
    if (title !== undefined) layer.querySelector('.alert-title').textContent = title;
    if (text !== undefined) layer.querySelector('.alert-text').textContent = text;
    if (choices === undefined) return;
    layer.querySelectorAll('.alert-choices .action-button').forEach((button, i) => {
      CF.updateActionButton(button, {
        label: choices[i].label,
        look: choices[i].isMain ? 'main' : 'quiet',
      });
    });
  }

  // Asks a question: shows the card and puts the focus on its first choice.
  // choices: two of { label, isMain, action }; the chosen one's action runs after the card
  // closes. Cancel, a tap outside and hideAlert run nothing.
  function showAlert(layer, { title, text, choices }) {
    updateAlertCard(layer, { title, text, choices });
    layer.alertActions = choices.map(choice => choice.action);
    layer.hidden = false;
    layer.querySelector('.alert-choices .action-button').focus({ preventScroll: true });
  }

  // Closes the card without an answer.
  function hideAlert(layer) {
    layer.hidden = true;
    layer.alertActions = null;
  }

  // A choice was tapped: close the card, then run that choice's action.
  function answerAlert(layer, choiceIndex) {
    const action = layer.alertActions && layer.alertActions[choiceIndex];
    hideAlert(layer);
    if (action) action();
  }

  Object.assign(CF, { buildAlertCard, updateAlertCard, showAlert, hideAlert });
})(window.CF);
