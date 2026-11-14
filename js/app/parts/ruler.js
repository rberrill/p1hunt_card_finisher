/* =====================================================================
   js/app/parts/ruler.js: the Ruler part (Rotate's Straighten). A scale of ticks slides under a
   fixed pointer, one tick per unit and a longer one every fifth. A range input inside it holds
   the value, so the keyboard and screen readers work, and it keeps the id the tests use
   (`fine`). Dragging the scale sets the input and fires its `input` event, then `change` on
   release, exactly as dragging a slider would.
   Shell modules share one namespace, CF (created in core.js). Names from core are destructured
   below; anything from another module is called as CF.name. tests/selftest.js checks these
   boundaries.
   ===================================================================== */
(function (CF) {
  'use strict';
  const { makeEl } = CF;

  // The gap between two ticks, in CSS px. One tick is one unit of the value (one degree).
  const RULER_TICK_PX = 11;
  // The ruler fills its 44 px control row.
  const RULER_HEIGHT_PX = 44;
  // Every fifth tick is longer.
  const RULER_LONG_TICK_EVERY = 5;
  // A tick's top and bottom inside the 44 px row, in CSS px: [short, long].
  const RULER_TICK_TOP_PX = [17, 12];
  const RULER_TICK_BOTTOM_PX = [27, 32];

  // The scale: one line per whole unit from min to max, drawn once.
  function buildRulerScale(min, max) {
    const widthPx = (max - min) * RULER_TICK_PX + 2;
    const scale = CF.makeSvgEl('svg', {
      class: 'ruler-scale',
      width: widthPx,
      height: RULER_HEIGHT_PX,
      'aria-hidden': 'true',
    });
    for (let unit = min; unit <= max; unit++) {
      const isLong = unit % RULER_LONG_TICK_EVERY === 0;
      const x = (unit - min) * RULER_TICK_PX + 1;
      scale.append(CF.makeSvgEl('line', {
        class: isLong ? 'ruler-tick is-long' : 'ruler-tick',
        x1: x,
        x2: x,
        y1: RULER_TICK_TOP_PX[Number(isLong)],
        y2: RULER_TICK_BOTTOM_PX[Number(isLong)],
      }));
    }
    // The scale's zero (its `min` end plus -min ticks) sits under the pointer at value 0.
    scale.style.marginLeft = `${min * RULER_TICK_PX - 1}px`;
    return scale;
  }

  // Slides the scale so the input's value is under the pointer.
  function drawRuler(ruler) {
    const input = ruler.querySelector('input');
    const scale = ruler.querySelector('.ruler-scale');
    scale.style.transform = `translateX(${-input.value * RULER_TICK_PX}px)`;
  }

  // A drag on the ruler: the scale follows the finger one to one (no easing, no coasting), so
  // dragging right lowers the value. One `change` when the finger lifts.
  function bindRulerDrag(ruler, input) {
    let drag = null;
    const step = Number(input.step) || 1;
    ruler.addEventListener('pointerdown', event => {
      if (input.disabled) return;
      drag = { startX: event.clientX, startValue: Number(input.value) };
      ruler.setPointerCapture(event.pointerId);
      ruler.classList.add('is-held');
    });
    ruler.addEventListener('pointermove', event => {
      if (!drag) return;
      const raw = drag.startValue - (event.clientX - drag.startX) / RULER_TICK_PX;
      const stepped = Math.round(raw / step) * step;
      const value = Math.min(Number(input.max), Math.max(Number(input.min), stepped));
      if (value === Number(input.value)) return;
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    const end = () => {
      if (!drag) return;
      const hasMoved = Number(input.value) !== drag.startValue;
      drag = null;
      ruler.classList.remove('is-held');
      if (hasMoved) input.dispatchEvent(new Event('change', { bubbles: true }));
    };
    ruler.addEventListener('pointerup', end);
    ruler.addEventListener('pointercancel', end);
  }

  // Builds a ruler around a range input with this id; the caller binds the input's `input` and
  // `change` events. min and max are whole units; label is for screen readers.
  function buildRuler({ id, min, max, step, label }) {
    const input = makeEl('input', {
      class: 'ruler-input',
      type: 'range',
      id,
      min,
      max,
      step,
      // Starts at zero (or the nearest end): a range input's own default is its middle.
      value: Math.min(max, Math.max(min, 0)),
      'aria-label': label,
    });
    const ruler = makeEl('div', { class: 'ruler' },
      buildRulerScale(min, max),
      makeEl('span', { class: 'ruler-pointer' }),
      input);
    input.addEventListener('input', () => drawRuler(ruler));
    bindRulerDrag(ruler, input);
    drawRuler(ruler);
    return ruler;
  }

  // Shows `value` (in the input's own units).
  function updateRuler(ruler, value) {
    ruler.querySelector('input').value = value;
    drawRuler(ruler);
  }

  Object.assign(CF, { buildRuler, updateRuler });
})(window.CF);
