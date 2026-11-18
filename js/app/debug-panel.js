/* =====================================================================
   js/app/debug-panel.js: the detection tuning panel (?debug=1 or the ` key).
   Shell modules share one namespace, CF (created in core.js). Names from core are
   destructured below; anything from another module is called as CF.name.
   tests/selftest.js checks these boundaries.
   ===================================================================== */
(function (CF) {
  'use strict';
  const { makeEl, elements, app, toast } = CF;

  // The debug panel re-runs detection this long after the last change to a setting.
  const REDETECT_DELAY_MS = 350;

  // Shows or hides the panel (force: true or false, or left out to flip it). Showing it builds
  // it afresh and turns the debug overlay on. That only draws: the search it starts, for what
  // the overlay shows, leaves the corners where they are (ruling R3).
  function toggleDebugPanel(force) {
    const panel = elements.debugPanel;
    const show = force !== undefined ? force : panel.hidden;
    panel.hidden = !show;
    if (!show) return;
    buildDebugPanel();
    if (!app.debugOverlay) {
      app.debugOverlay = true;
      CF.syncUI();
      if (app.img) CF.detectForDebugOverlay();
    }
  }

  let redetectTimer = 0;
  // One field per number or on/off setting in CONFIG.detect; editing one re-runs detection.
  // The heading row (title and close), the two actions, the fields, then the last run's scores.
  function buildDebugPanel() {
    const panel = elements.debugPanel;
    const settings = CONFIG.detect;
    const isTunable = key => ['number', 'boolean'].includes(typeof settings[key]);
    const keys = Object.keys(settings).filter(isTunable);
    const rows = keys.map(key => makeEl('label', null, key, typeof settings[key] === 'boolean'
      ? makeEl('input', { type: 'checkbox', 'data-key': key, checked: settings[key] })
      : makeEl('input', { type: 'number', 'data-key': key, value: settings[key], step: 'any' })));
    // Built from the parts: Action buttons at their small size, and an icon button to close.
    const button = (id, label) => CF.buildActionButton({ id, label, size: 'small', isWide: true });
    panel.replaceChildren(
      makeEl('div', { class: 'debug-head' },
        makeEl('h2', { class: 'debug-title' }, 'Detection tuning'),
        CF.buildIconButton({ id: 'debugClose', icon: 'close', label: 'Close tuning' })),
      makeEl('div', { class: 'debug-actions' },
        button('debugCopy', 'Copy CONFIG'),
        button('debugRun', 'Re-detect')),
      ...rows,
      makeEl('pre', { id: 'debugInfo' }),
    );
    panel.querySelector('#debugClose').onclick = () => toggleDebugPanel(false);
    panel.querySelector('#debugRun').onclick = () => CF.runDetect();
    panel.querySelector('#debugCopy').onclick = async () => {
      const text = 'const CONFIG = ' + JSON.stringify(CONFIG, null, 2) + ';\n';
      try {
        await navigator.clipboard.writeText(text);
        toast('CONFIG copied.');
      } catch (error) {
        console.log(text);
        toast('Clipboard blocked — CONFIG printed to the console.', 'warn');
      }
    };
    const onSettingChanged = input => () => {
      const key = input.dataset.key;
      CONFIG.detect[key] = input.type === 'checkbox' ? input.checked : Number(input.value);
      clearTimeout(redetectTimer);
      redetectTimer = setTimeout(() => CF.runDetect(), REDETECT_DELAY_MS);
    };
    panel.querySelectorAll('input[data-key]').forEach(input => {
      input.addEventListener('input', onSettingChanged(input));
    });
    updateDebugPanel();
  }

  // The last detection's timing and each candidate's score parts.
  function updateDebugPanel() {
    const info = elements.debugPanel.querySelector('#debugInfo');
    if (!info) return;
    const last = app.detection.last;
    if (!last) {
      info.textContent = '';
      return;
    }
    const timing = last.timing || {};
    const header = `round trip ${Math.round(app.detection.durationMs || 0)} ms `
      + `(analyze ${Math.round(timing.analyze)} ms, quads ${Math.round(timing.quads)} ms)\n`
      + `${timing.lines} lines → ${timing.quadCount} quads\n`;
    const describe = (candidate, i) => {
      const parts = candidate.parts;
      const refined = candidate.refined ? candidate.refined.map(Number).join('') : '-';
      const confidence = (candidate.confidence * 100).toFixed(0);
      return `#${i + 1} score ${candidate.score.toFixed(3)} conf ${confidence}%`
        + ` sup ${parts.support.toFixed(2)} min ${parts.supportMin.toFixed(2)}`
        + ` asp ${parts.aspect.toFixed(2)} ang ${parts.angle.toFixed(2)}`
        + ` area ${(parts.areaFrac * 100).toFixed(1)}% refined ${refined}`;
    };
    info.textContent = header + app.detection.candidates.map(describe).join('\n');
  }

  Object.assign(CF, {
    toggleDebugPanel,
    updateDebugPanel,
  });
})(window.CF);
