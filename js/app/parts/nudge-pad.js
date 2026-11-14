/* =====================================================================
   js/app/parts/nudge-pad.js: the Nudge pad part. A pill of arrow (or − +) keys. Holding a key
   repeats it: after CONFIG.nudge.delayMs, every CONFIG.nudge.repeatMs.
   Shell modules share one namespace, CF (created in core.js). Names from core are destructured
   below; anything from another module is called as CF.name. tests/selftest.js checks these
   boundaries.
   ===================================================================== */
(function (CF) {
  'use strict';
  const { makeEl } = CF;

  // Builds a pad. label: what it moves, for screen readers. keys: [{ value, icon, label }];
  // value is handed to the handler, icon is a name in CF.ICONS.
  function buildNudgePad({ id, label, keys }) {
    const buttons = keys.map(key => makeEl('button', {
      class: 'nudge-key',
      type: 'button',
      'data-key': key.value,
      'aria-label': key.label,
    }, CF.makeIcon(key.icon)));
    const attributes = { class: 'nudge-pad', id, role: 'group', 'aria-label': label };
    return makeEl('div', attributes, ...buttons);
  }

  // Turns every key on or off.
  function updateNudgePad(pad, { isDisabled }) {
    pad.querySelectorAll('.nudge-key').forEach(key => {
      key.disabled = !!isDisabled;
    });
  }

  // Calls onKey(value) when a key is pressed, and again while it is held. A touch on a key
  // doesn't start iOS's long-press selection or its callout menu.
  function bindNudgePad(pad, onKey) {
    let repeatTimer = 0;
    const stop = () => {
      clearTimeout(repeatTimer);
      clearInterval(repeatTimer);
    };
    pad.querySelectorAll('.nudge-key').forEach(key => {
      key.addEventListener('pointerdown', event => {
        event.preventDefault();
        stop();
        onKey(key.dataset.key);
        repeatTimer = setTimeout(() => {
          repeatTimer = setInterval(() => onKey(key.dataset.key), CONFIG.nudge.repeatMs);
        }, CONFIG.nudge.delayMs);
      });
      for (const type of ['pointerup', 'pointerleave', 'pointercancel']) {
        key.addEventListener(type, stop);
      }
      // A keyboard or a screen reader presses a key with a click, which has no pointerdown.
      key.addEventListener('click', event => {
        if (event.detail === 0) onKey(key.dataset.key);
      });
      key.addEventListener('contextmenu', event => event.preventDefault());
      key.addEventListener('touchstart', event => {
        if (event.cancelable) event.preventDefault();
      }, { passive: false });
    });
  }

  Object.assign(CF, { buildNudgePad, updateNudgePad, bindNudgePad });
})(window.CF);
