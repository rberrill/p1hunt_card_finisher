/* =====================================================================
   js/app/parts/tool.js: the Tool part. A tile in a step's tool row. There are three kinds, and
   each looks different: a mode swaps the adjustment line (white fill while selected), an action
   does one thing, and a switch flips a setting (white ring and On).
   Shell modules share one namespace, CF (created in core.js). Names from core are destructured
   below; anything from another module is called as CF.name. tests/selftest.js checks these
   boundaries.
   ===================================================================== */
(function (CF) {
  'use strict';
  const { makeEl } = CF;

  // Builds a tool. kind: 'mode' | 'action' | 'switch'; icon: a name in CF.ICONS. A mode or a
  // switch carries aria-pressed; a switch also shows On or Off in its corner.
  function buildTool({ id, kind, label, icon, title }) {
    const isAction = kind === 'action';
    return makeEl('button', {
      class: `tool tool-${kind}`,
      id,
      type: 'button',
      title,
      'aria-pressed': !isAction && 'false',
    },
    kind === 'switch' && makeEl('span', { class: 'tool-state' }, 'Off'),
    makeEl('span', { class: 'tool-glyph' }, CF.makeIcon(icon)),
    makeEl('span', { class: 'tool-value', hidden: true }),
    makeEl('span', { class: 'tool-label' }, label));
  }

  // Updates a tool; a value left out stays as it is.
  //   isOn         a mode's line is showing, or a switch is on
  //   isDisabled   it can't be used now
  //   valueText    shown in place of the icon ('100%', '1/3'); '' brings the icon back
  function updateTool(tool, { isOn, isDisabled, valueText }) {
    if (isOn !== undefined && tool.hasAttribute('aria-pressed')) {
      tool.setAttribute('aria-pressed', String(!!isOn));
      const state = tool.querySelector('.tool-state');
      if (state) state.textContent = isOn ? 'On' : 'Off';
    }
    if (isDisabled !== undefined) tool.disabled = !!isDisabled;
    if (valueText !== undefined) {
      const value = tool.querySelector('.tool-value');
      value.textContent = valueText;
      value.hidden = !valueText;
      tool.querySelector('.tool-glyph').hidden = !!valueText;
    }
  }

  Object.assign(CF, { buildTool, updateTool });
})(window.CF);
