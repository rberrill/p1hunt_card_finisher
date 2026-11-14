/* =====================================================================
   js/app/rotate.js: the Rotate step's controls: the fine angle, quarter turns, flips,
   Fill frame and the grid.
   Shell modules share one namespace, CF (created in core.js). Names from core are
   destructured below; anything from another module is called as CF.name.
   tests/selftest.js checks these boundaries.
   ===================================================================== */
(function (CF) {
  'use strict';
  const { byId, app } = CF;

  // Builds Rotate's controls. Until its parts are built (CF.buildControlArea, id rotateArea,
  // and CF.buildSheet, id rotateSheet), the shell hosts the step's old markup, whose fine-angle
  // slider and number box take their range from CONFIG here.
  function buildRotateControls() {
    const range = CONFIG.rotate.fineRangeDeg;
    for (const input of [byId('fine'), byId('fineNumber')]) {
      input.min = -range;
      input.max = range;
      input.step = CONFIG.rotate.fineStepDeg;
    }
  }

  // A quarter turn (direction +1 clockwise, −1 counterclockwise), keeping a manual crop on the
  // same content by turning its center and size with it.
  function turn(direction) {
    CF.commit(state => {
      state.rotation.quarter = (state.rotation.quarter + direction + 4) % 4;
      const rect = state.crop.rect;
      if (rect) {
        state.crop.rect = direction > 0
          ? { cx: -rect.cy, cy: rect.cx, w: rect.h, h: rect.w }
          : { cx: rect.cy, cy: -rect.cx, w: rect.h, h: rect.w };
      }
      if (state.crop.ratio && state.crop.ratio !== 1) state.crop.swapped = !state.crop.swapped;
      if (state.crop.orient) {
        state.crop.orient = state.crop.orient === 'portrait' ? 'landscape' : 'portrait';
      }
    });
  }

  // A flip as seen on screen. The pipeline flips before rotating, and reflect·Rot(θ) =
  // Rot(−θ)·reflect, so a flip "as seen" toggles the flip bit and negates the rotation.
  function flip(axis) {
    CF.commit(state => {
      state.flip[axis] = !state.flip[axis];
      state.rotation.quarter = (4 - state.rotation.quarter) % 4;
      state.rotation.fine = -state.rotation.fine || 0;
      if (!state.crop.rect) return;
      if (axis === 'h') state.crop.rect.cx = -state.crop.rect.cx;
      else state.crop.rect.cy = -state.crop.rect.cy;
    });
  }

  function bindRotate() {
    byId('btnRotateLeft').onclick = () => turn(-1);
    byId('btnRotateRight').onclick = () => turn(1);
    byId('btnFlipH').onclick = () => flip('h');
    byId('btnFlipV').onclick = () => flip('v');
    const range = CONFIG.rotate.fineRangeDeg;
    const setFine = degrees => CF.commit(state => {
      state.rotation.fine = Math.round(Math.max(-range, Math.min(range, degrees)) * 10) / 10;
    }, 'fine');
    byId('fine').oninput = event => setFine(+event.target.value);
    byId('fineNumber').onchange = event => setFine(+event.target.value || 0);
    byId('btnFineZero').onclick = () => setFine(0);
    byId('fillFrame').onchange = event => CF.commit(state => {
      state.rotation.fillFrame = event.target.checked;
    });
    byId('showGrid').onchange = event => {
      app.showGrid = event.target.checked;
      CF.requestRender();
    };
  }

  // The fine angle in both fields, and the two toggles.
  function syncRotate(state) {
    byId('fine').value = state.rotation.fine;
    byId('fineNumber').value = state.rotation.fine;
    byId('fillFrame').checked = !!state.rotation.fillFrame;
    byId('showGrid').checked = app.showGrid;
  }

  Object.assign(CF, {
    buildRotateControls,
    bindRotate,
    syncRotate,
  });
})(window.CF);
