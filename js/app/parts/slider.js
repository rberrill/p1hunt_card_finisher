/* =====================================================================
   js/app/parts/slider.js: the Slider part (Flatten, Opacity, Quality). A native range input,
   so the keyboard and screen readers work as usual, drawn with a white fill up to a round thumb
   that grows while it is held.
   Shell modules share one namespace, CF (created in core.js). Names from core are destructured
   below; anything from another module is called as CF.name. tests/selftest.js checks these
   boundaries.
   ===================================================================== */
(function (CF) {
  'use strict';
  const { makeEl } = CF;

  // The thumb's width at rest (css/app.css draws it this size): the fill ends at its center.
  const SLIDER_THUMB_PX = 22;

  // Draws the fill up to the thumb's center for the input's current value.
  function drawSliderFill(slider) {
    const input = slider.querySelector('input');
    const span = input.max - input.min;
    const fraction = span ? (input.value - input.min) / span : 0;
    const thumbOffsetPx = SLIDER_THUMB_PX * (0.5 - fraction);
    const fill = slider.querySelector('.slider-fill');
    fill.style.width = `calc(${fraction * 100}% + ${thumbOffsetPx}px)`;
  }

  // Builds a slider around a range input with this id; the caller binds the input's own `input`
  // and `change` events. label: what it sets, for screen readers.
  function buildSlider({ id, min, max, step, label }) {
    const input = makeEl('input', {
      type: 'range',
      id,
      min,
      max,
      step,
      // Starts at its low end: a range input's own default is its middle.
      value: min,
      'aria-label': label,
    });
    const slider = makeEl('span', { class: 'slider' },
      makeEl('span', { class: 'slider-fill' }),
      input);
    input.addEventListener('input', () => drawSliderFill(slider));
    drawSliderFill(slider);
    return slider;
  }

  // Shows `value` (in the input's own units).
  function updateSlider(slider, value) {
    slider.querySelector('input').value = value;
    drawSliderFill(slider);
  }

  Object.assign(CF, { buildSlider, updateSlider });
})(window.CF);
