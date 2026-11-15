/* =====================================================================
   js/app/parts/alert-card.js: the Alert card part. A question the user must answer before going
   on (Upscale, Unpair, New photo or Replace side): a card centered over the dimmed photo with
   two choices and Cancel. A tap outside the card cancels. The card lies above an open sheet.
   Shell modules share one namespace, CF (created in core.js). Names from core are destructured
   below; anything from another module is called as CF.name. tests/selftest.js checks these
   boundaries.
   ===================================================================== */
(function (CF) {
  'use strict';
  const { makeEl } = CF;

  // How long the card and its dim take to fade out, in ms (css/app.css, .alert-card; motion
  // M9). The layer is hidden when the card's fade ends, or this long after, plus a margin, as a
  // fallback (under reduced motion the fade is 100 ms).
  const ALERT_OUT_MS = 120;
  const ALERT_HIDE_FALLBACK_MS = ALERT_OUT_MS + 80;

  // True while a card is up (shown and not leaving). Read this, not `hidden`: a closing card
  // stays in the page, faded and taking no touch, for its 120 ms fade.
  const isAlertOpen = layer => layer.classList.contains('is-open');

  // Builds a hidden card. Its two choice buttons and Cancel are bound once, here; what a choice
  // does comes with each question (showAlert). buttonIds: { first, second, cancel }, the ids
  // of the two choices and of Cancel, each optional.
  function buildAlertCard(id, buttonIds = {}) {
    const titleId = id && `${id}Title`;
    const choices = [buttonIds.first, buttonIds.second].map(buttonId => CF.buildActionButton({
      id: buttonId,
      label: '',
      look: 'quiet',
      size: 'tall',
      isWide: true,
    }));
    const cancel = makeEl('button', {
      class: 'alert-cancel',
      id: buttonIds.cancel,
      type: 'button',
    }, 'Cancel');
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

  // Asks a question: shows the card and puts the focus on its first choice. The dim and the
  // card fade in (css/app.css). choices: two of { label, isMain, action }; the chosen one's
  // action runs after the card closes. Cancel, a tap outside and hideAlert run nothing.
  function showAlert(layer, { title, text, choices }) {
    cancelAlertHide(layer);
    updateAlertCard(layer, { title, text, choices });
    layer.alertActions = choices.map(choice => choice.action);
    layer.hidden = false;
    // Read a layout value so the faded-out state is drawn before the class change fades it in.
    layer.getBoundingClientRect();
    layer.classList.add('is-open');
    layer.querySelector('.alert-choices .action-button').focus({ preventScroll: true });
  }

  // Closes the card without an answer, and tells its listeners with an `alertclose` event on
  // the layer, at once. (A choice closes it the same way, before its action runs.) The card
  // fades out and the layer is hidden after. Nothing happens when the card isn't up.
  function hideAlert(layer) {
    if (!isAlertOpen(layer)) return;
    layer.classList.remove('is-open');
    layer.alertActions = null;
    hideAlertWhenFaded(layer);
    layer.dispatchEvent(new Event('alertclose'));
  }

  // Sets `hidden` on a closing card's layer when the card's fade ends, or after a fallback.
  function hideAlertWhenFaded(layer) {
    cancelAlertHide(layer);
    const card = layer.querySelector('.alert-card');
    const hide = () => {
      cancelAlertHide(layer);
      if (!isAlertOpen(layer)) layer.hidden = true;
    };
    layer.onFadeEnd = event => {
      if (event.target === card && event.propertyName === 'opacity') hide();
    };
    card.addEventListener('transitionend', layer.onFadeEnd);
    layer.hideTimer = setTimeout(hide, ALERT_HIDE_FALLBACK_MS);
  }

  // Stops a pending hide: a new question is going up on the same card.
  function cancelAlertHide(layer) {
    clearTimeout(layer.hideTimer);
    if (!layer.onFadeEnd) return;
    layer.querySelector('.alert-card').removeEventListener('transitionend', layer.onFadeEnd);
    layer.onFadeEnd = null;
  }

  // A choice was tapped: close the card, then run that choice's action, in the same tap (Copy
  // must reach the clipboard while the tap still counts as the user's).
  function answerAlert(layer, choiceIndex) {
    const action = layer.alertActions && layer.alertActions[choiceIndex];
    hideAlert(layer);
    if (action) action();
  }

  Object.assign(CF, { buildAlertCard, updateAlertCard, showAlert, hideAlert, isAlertOpen });
})(window.CF);
