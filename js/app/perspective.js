/* =====================================================================
   js/app/perspective.js: the Perspective step's controls: the nudge pad, Candidate,
   Tap to find card, Flatten, orientation, Snap, the status line and the detection readout.
   Shell modules share one namespace, CF (created in core.js). Names from core are
   destructured below; anything from another module is called as CF.name.
   tests/selftest.js checks these boundaries.
   ===================================================================== */
(function (CF) {
  'use strict';
  const { byId, clone, app } = CF;

  // The on-screen nudge pad (phones): one screen pixel per step, never less than one source
  // pixel; hold to repeat.
  function bindHandleNudge() {
    let nudgeTimer = 0;
    let loupeTimer = 0;
    const flashLoupe = () => {
      app.nudgeLoupeUntil = performance.now() + CONFIG.nudge.loupeMs;
      CF.requestRender();
      clearTimeout(loupeTimer);
      loupeTimer = setTimeout(CF.requestRender, CONFIG.nudge.loupeMs + 50);
    };
    const nudgeStep = direction => {
      const view = CF.currentView();
      if (!view || app.tab !== 'perspective' || app.previewMode) return;
      const step = Math.max(1, 1 / view.zoom);
      const [dx, dy] = [direction[0] * step, direction[1] * step];
      CF.commit(state => CF.moveHandleBy(state, app.selected, dx, dy), 'nudge');
      flashLoupe();
    };
    const stop = () => {
      clearTimeout(nudgeTimer);
      clearInterval(nudgeTimer);
    };
    document.querySelectorAll('[data-nudge]').forEach(button => {
      button.addEventListener('pointerdown', event => {
        event.preventDefault();
        stop();
        if (button.dataset.nudge === 'cycle') {
          app.selected = (app.selected + 1) % 8;
          flashLoupe();
          return;
        }
        const direction = button.dataset.nudge.split(',').map(Number);
        nudgeStep(direction);
        nudgeTimer = setTimeout(() => {
          nudgeTimer = setInterval(() => nudgeStep(direction), CONFIG.nudge.repeatMs);
        }, CONFIG.nudge.delayMs);
      });
      for (const type of ['pointerup', 'pointerleave', 'pointercancel']) {
        button.addEventListener(type, stop);
      }
      button.addEventListener('contextmenu', event => event.preventDefault());
    });
  }

  function bindPerspective() {
    byId('btnNext').onclick = () => {
      const count = app.detection.candidates.length;
      if (count) CF.useCandidate((app.detection.index + 1) % count);
    };
    // Arms (or cancels) Find card: the next still tap on the photo finds the card there. On
    // phones, More options closes so the whole photo is there to tap; the status line prompts
    // until the tap.
    byId('btnFindCard').onclick = () => {
      app.findMode = !app.findMode;
      if (app.findMode && CF.phoneLayout.matches) CF.collapseMore();
      CF.syncUI();
    };
    // Strength updates live while sliding (geometry only); one undo step per slide.
    const strength = byId('strength');
    let strengthBefore = null;
    strength.oninput = () => {
      if (!strengthBefore) strengthBefore = clone(app.state);
      app.state.strength = strength.value / 100;
      byId('strengthValue').textContent = strength.value + '%';
      CF.liveChanged();
    };
    strength.onchange = () => {
      if (strengthBefore) CF.commitFrom(strengthBefore, 'strength');
      strengthBefore = null;
    };
    CF.bindSegment('orientation', value => CF.commit(state => {
      state.aspect.orientation = value;
    }));
    byId('snap').onchange = event => {
      app.snap = event.target.checked;
    };
    byId('debugOverlay').onchange = event => {
      app.debugOverlay = event.target.checked;
      const hasDebugData = app.detection.last && app.detection.last.debug;
      if (app.debugOverlay && !hasDebugData) CF.runDetect();
      CF.requestRender();
    };
    byId('fill').onchange = event => {
      const fill = event.target.value === 'custom' ? byId('fillColor').value : event.target.value;
      CF.commit(state => {
        state.export.fill = fill;
      });
    };
    byId('fillColor').oninput = event => {
      byId('fill').value = 'custom';
      CF.commit(state => {
        state.export.fill = event.target.value;
      }, 'fill');
    };
  }

  function syncPerspective(state) {
    CF.setSegment('orientation', state.aspect.orientation);
    const strengthPercent = Math.round(state.strength * 100);
    byId('strength').value = strengthPercent;
    byId('strengthValue').textContent = strengthPercent + '%';
    byId('snap').checked = app.snap;
    byId('debugOverlay').checked = app.debugOverlay;
    const fill = state.export.fill;
    const isPreset = ['transparent', '#ffffff', '#000000'].includes(fill);
    byId('fill').value = isPreset ? fill : 'custom';
    if (!isPreset) byId('fillColor').value = fill;
    byId('btnFindCard').setAttribute('aria-pressed', String(app.findMode));
    const count = app.detection.candidates.length;
    byId('btnNext').disabled = count < 2;
    const label = count > 1 ? `Candidate ${app.detection.index + 1}/${count}` : 'Candidate';
    byId('btnNext').textContent = label;
  }

  // The Perspective status line: only what needs action (detection details live under More).
  function perspectiveStatus(geometry, candidate) {
    const count = app.detection.candidates.length;
    if (app.findMode) return 'Tap the card in the photo.';
    if (geometry && !geometry.ok) return geometry.reason;
    if (app.detection.message) return app.detection.message;
    if (candidate && candidate.confidence < CONFIG.detect.minConfidence) {
      return `Low confidence (${Math.round(candidate.confidence * 100)}%) — check the corners.`;
    }
    if (!count && app.img && app.detection.last) {
      return 'Nothing detected — drag the corners into place.';
    }
    if (geometry && geometry.perspective.isClamped) {
      return `Corrected frame clamped to ${CONFIG.maxOutputPx}px on the long side.`;
    }
    return '';
  }

  // The detection readout (under More options) and the status line.
  function syncPerspectiveReadouts() {
    const geometry = app.geometry;
    const count = app.detection.candidates.length;
    const candidate = count ? app.detection.candidates[app.detection.index] : null;
    const candidateInfo = candidate
      ? `Candidate ${app.detection.index + 1}/${count} · `
        + `confidence ${Math.round(candidate.confidence * 100)}%`
      : '';
    byId('detectInfo').textContent = app.detection.message || candidateInfo;
    const status = byId('perspectiveStatus');
    status.className = 'status' + (geometry && !geometry.ok ? ' error' : '');
    status.textContent = perspectiveStatus(geometry, candidate);
  }

  Object.assign(CF, {
    bindHandleNudge,
    bindPerspective,
    syncPerspective,
    syncPerspectiveReadouts,
  });
})(window.CF);
