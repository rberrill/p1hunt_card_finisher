/* =====================================================================
   js/app/ui.js — Step tabs and step menu, control building/binding, syncUI and readouts, the debug panel, the resume prompt.
   Shell modules share one namespace, CF (created in core.js). Names from core are
   destructured below; anything from another module is called as CF.name.
   tests/selftest.js checks these boundaries.
   ===================================================================== */
(function (CF) {
  'use strict';
  const { E, $, els, clone, app, toast } = CF;

  /* ---------- tabs + panel binding ---------- */
  function setTab(tab) {
    app.tab = tab;
    els.root.dataset.tab = tab;
    document.querySelectorAll('.tab').forEach(b => b.setAttribute('aria-selected', String(b.dataset.tab === tab)));
    document.querySelectorAll('section[data-panel]').forEach(s => s.classList.toggle('active', s.dataset.panel === tab));
    els.canvas.style.cursor = '';
    if (tab === 'export' || tab === 'levels') app.views.export = null;
    if (tab !== 'levels') { app.dropper = null; app.compare = false; }
    app.nudgeLoupeUntil = 0; closeStepMenu(); CF.Session.saveSoon();
    if (CF.phoneLayout.matches) collapseMore();
    syncUI(); CF.requestRender(); CF.requestMini();
  }

  function bindSeg(name, onPick) {
    document.querySelectorAll(`[data-seg="${name}"] button`).forEach(b => b.addEventListener('click', () => onPick(b.dataset.v)));
  }
  function setSeg(name, val) { document.querySelectorAll(`[data-seg="${name}"] button`).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === val))); }

  const STEPS = { perspective: 'Perspective', rotate: 'Rotate', crop: 'Crop', levels: 'Levels', export: 'Export' };

  // Step menu (phones): lists the five steps above the action bar.
  function openStepMenu(btn) {
    const m = $('stepMenu');
    m.innerHTML = Object.keys(STEPS).map((t, i) =>
      `<button role="menuitem" data-goto="${t}"${t === app.tab ? ' aria-current="step"' : ''}${t === 'levels' && app.levelsPending ? ' class="pending"' : ''}><span class="n">${i + 1}</span>${STEPS[t]}</button>`).join('');
    m.hidden = false; btn.setAttribute('aria-expanded', 'true');
  }
  function closeStepMenu() {
    $('stepMenu').hidden = true;
    document.querySelectorAll('[data-stepmenu]').forEach(b => b.setAttribute('aria-expanded', 'false'));
  }
  // "More options" expands the control area on phones.
  function collapseMore() { document.querySelectorAll('details.more').forEach(d => { d.open = false; }); els.panel.classList.remove('expanded'); }

  function buildControls() {
    $('cropChips').innerHTML = CONFIG.crop.presets.map(p => `<button class="chip" data-crop="${p.id}">${p.label}</button>`).join('')
      + '<button class="chip" id="btnSwap" title="Swap portrait / landscape">⇄ Swap</button>';
    $('size').innerHTML = CONFIG.export.longEdgePresets.map(n => `<option value="${n}">${n ? n + ' px' : 'Original size'}</option>`).join('');
    // Phones: each action bar starts with the step menu button.
    document.querySelectorAll('section[data-panel] .actionbar').forEach(bar => {
      const tab = bar.closest('section').dataset.panel;
      bar.insertAdjacentHTML('afterbegin', `<button class="btn stepbtn" data-stepmenu aria-haspopup="menu" aria-expanded="false" title="Go to a step">${STEPS[tab]} ▾</button>`);
    });
    $('fine').min = $('fineNum').min = -CONFIG.rotate.fineRangeDeg; $('fine').max = $('fineNum').max = CONFIG.rotate.fineRangeDeg;
    $('fine').step = $('fineNum').step = CONFIG.rotate.fineStepDeg;
  }

  function bindControls() {
    document.querySelectorAll('.tab').forEach(b => b.addEventListener('click', () => app.img && setTab(b.dataset.tab)));
    $('btnOpen').onclick = $('btnOpenEmpty').onclick = () => els.fileInput.click();
    $('btnResume').onclick = resumeSession;
    $('btnFresh').onclick = () => { CF.Session.clear(); hideResume(); };
    $('btnUndo').onclick = CF.undo; $('btnRedo').onclick = CF.redo; $('btnFit').onclick = CF.fitCurrent;
    document.querySelectorAll('[data-next]').forEach(b => b.addEventListener('click', () => setTab(b.dataset.next)));
    document.querySelectorAll('[data-stepmenu]').forEach(b => b.addEventListener('click', () => { if ($('stepMenu').hidden) openStepMenu(b); else closeStepMenu(); }));
    $('stepMenu').addEventListener('click', e => { const b = e.target.closest('[data-goto]'); if (b) { closeStepMenu(); setTab(b.dataset.goto); } });
    document.addEventListener('pointerdown', e => {
      if (!e.target.closest('#stepMenu, [data-stepmenu]')) closeStepMenu();
      // The nudge loupe stays up between nudges; touching anything else hides it.
      if (app.nudgeLoupeUntil && !e.target.closest('[data-nudge]')) { app.nudgeLoupeUntil = 0; CF.requestRender(); }
    }, true);
    document.querySelectorAll('details.more').forEach(d => d.addEventListener('toggle', () => {
      if (CF.phoneLayout.matches) els.panel.classList.toggle('expanded', !!document.querySelector('section.active details.more[open]'));
    }));
    $('btnPreview').onclick = () => { app.previewMode = !app.previewMode; app.views.result = null; syncUI(); CF.requestRender(); };

    // On-screen nudge pad (phones): one screen pixel per step, never less than one source pixel; hold to repeat.
    let nudgeTimer = 0, loupeTimer = 0;
    const flashLoupe = () => {
      app.nudgeLoupeUntil = performance.now() + CONFIG.nudge.loupeMs; CF.requestRender();
      clearTimeout(loupeTimer); loupeTimer = setTimeout(CF.requestRender, CONFIG.nudge.loupeMs + 50);
    };
    const nudgeStep = d => {
      const v = CF.currentView();
      if (!v || app.tab !== 'perspective' || app.previewMode) return;
      const n = Math.max(1, 1 / v.z);
      CF.commit(s => CF.moveHandleBy(s, app.selected, d[0] * n, d[1] * n), 'nudge');
      flashLoupe();
    };
    document.querySelectorAll('[data-nudge]').forEach(b => {
      const stop = () => { clearTimeout(nudgeTimer); clearInterval(nudgeTimer); };
      b.addEventListener('pointerdown', e => {
        e.preventDefault(); stop();
        if (b.dataset.nudge === 'cycle') { app.selected = (app.selected + 1) % 8; flashLoupe(); return; }
        const d = b.dataset.nudge.split(',').map(Number);
        nudgeStep(d);
        nudgeTimer = setTimeout(() => { nudgeTimer = setInterval(() => nudgeStep(d), CONFIG.nudge.repeatMs); }, CONFIG.nudge.delayMs);
      });
      for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) b.addEventListener(ev, stop);
      b.addEventListener('contextmenu', e => e.preventDefault());
    });

    // Perspective
    $('btnDetect').onclick = () => CF.runDetect();
    $('btnNext').onclick = () => { const n = app.detection.candidates.length; if (n) CF.useCandidate((app.detection.index + 1) % n); };
    $('btnSeed').onclick = () => { app.seedMode = !app.seedMode; syncUI(); if (app.seedMode) toast('Tap inside the card.'); };
    $('btnClearSeed').onclick = () => { app.detection.seed = null; app.seedMode = false; syncUI(); CF.requestRender(); };
    // Strength updates live while sliding (geometry only); one undo step per slide.
    const str = $('strength');
    let strengthBefore = null;
    str.oninput = () => {
      if (!strengthBefore) strengthBefore = clone(app.state);
      app.state.strength = str.value / 100; $('strengthVal').textContent = str.value + '%'; CF.liveChanged();
    };
    str.onchange = () => { if (strengthBefore) CF.commitFrom(strengthBefore, 'strength'); strengthBefore = null; };
    bindSeg('orientation', v => CF.commit(s => { s.aspect.orientation = v; }));
    $('snap').onchange = e => { app.snap = e.target.checked; };
    $('debugOverlay').onchange = e => { app.debugOverlay = e.target.checked; if (app.debugOverlay && !(app.detection.last && app.detection.last.debug)) CF.runDetect(); CF.requestRender(); };
    $('fill').onchange = e => { const v = e.target.value === 'custom' ? $('fillColor').value : e.target.value; CF.commit(s => { s.export.fill = v; }); };
    $('fillColor').oninput = e => { $('fill').value = 'custom'; CF.commit(s => { s.export.fill = e.target.value; }, 'fill'); };

    // Rotate
    const turn = d => CF.commit(s => {
      s.rotation.quarter = (s.rotation.quarter + d + 4) % 4;
      // Keep a manual crop on the same content: rotate its center/size by the same quarter turn.
      if (s.crop.rect) { const r = s.crop.rect; s.crop.rect = d > 0 ? { cx: -r.cy, cy: r.cx, w: r.h, h: r.w } : { cx: r.cy, cy: -r.cx, w: r.h, h: r.w }; }
      if (s.crop.ratio && s.crop.ratio !== 1) s.crop.swapped = !s.crop.swapped;
      if (s.crop.orient) s.crop.orient = s.crop.orient === 'portrait' ? 'landscape' : 'portrait';
    });
    $('btnRotL').onclick = () => turn(-1); $('btnRotR').onclick = () => turn(1);
    // Screen-space flips. The pipeline flips before rotating, and reflect·Rot(θ) = Rot(−θ)·reflect,
    // so a flip "as seen" = toggle the flip bit and negate the rotation.
    const flip = axis => CF.commit(s => {
      s.flip[axis] = !s.flip[axis];
      s.rotation.quarter = (4 - s.rotation.quarter) % 4; s.rotation.fine = -s.rotation.fine || 0;
      if (s.crop.rect) { if (axis === 'h') s.crop.rect.cx = -s.crop.rect.cx; else s.crop.rect.cy = -s.crop.rect.cy; }
    });
    $('btnFlipH').onclick = () => flip('h'); $('btnFlipV').onclick = () => flip('v');
    const setFine = v => CF.commit(s => { s.rotation.fine = Math.round(Math.max(-CONFIG.rotate.fineRangeDeg, Math.min(CONFIG.rotate.fineRangeDeg, v)) * 10) / 10; }, 'fine');
    $('fine').oninput = e => setFine(+e.target.value);
    $('fineNum').onchange = e => setFine(+e.target.value || 0);
    $('btnFineZero').onclick = () => setFine(0);
    $('fillFrame').onchange = e => CF.commit(s => { s.rotation.fillFrame = e.target.checked; });
    $('showGrid').onchange = e => { app.showGrid = e.target.checked; CF.requestRender(); };

    // Crop
    $('cropChips').addEventListener('click', e => {
      const b = e.target.closest('[data-crop]'); if (!b) return;
      CF.commit(s => {
        const prevAbs = app.geo && app.geo.ok ? { ...app.geo.crop } : null;
        s.crop.preset = b.dataset.crop; s.crop.ratio = CF.presetRatio(b.dataset.crop);
        s.crop.swapped = false; CF.alignCrop(s, app.geo); // the box swap is handled by the reshape below
        if (s.crop.mode === 'manual' && prevAbs && s.crop.ratio) {
          // Re-shape the manual box to the new aspect, same center and area.
          const r = E.cropRatio(s.crop, s.source.width, s.source.height), A = prevAbs.w * prevAbs.h;
          let w = Math.sqrt(A * r), h = Math.sqrt(A / r);
          const k = Math.min(1, app.geo.R.w / w, app.geo.R.h / h); w *= k; h *= k;
          const cx = Math.min(Math.max(prevAbs.x + prevAbs.w / 2, w / 2), app.geo.R.w - w / 2), cy = Math.min(Math.max(prevAbs.y + prevAbs.h / 2, h / 2), app.geo.R.h - h / 2);
          CF.setCropAbs({ x: cx - w / 2, y: cy - h / 2, w, h });
        }
      });
    });
    $('btnSwap').onclick = () => CF.commit(s => {
      const next = CF.cropOrient(s, app.geo) === 'portrait' ? 'landscape' : 'portrait';
      s.crop.orient = next === CF.cardOrient(app.geo) ? null : next;
      s.crop.swapped = !s.crop.swapped;
      if (s.crop.mode === 'manual' && s.crop.rect) { const r = s.crop.rect; s.crop.rect = { cx: r.cx, cy: r.cy, w: r.h, h: r.w }; }
    });
    $('btnFit2Card').onclick = () => CF.commit(s => { s.crop.mode = 'fit'; s.crop.rect = null; });

    // Levels
    $('btnAutoLevels').onclick = CF.autoLevelsDraft;
    const arm = which => { app.dropper = app.dropper === which ? null : which; syncUI(); if (app.dropper) toast(`Tap the image where it should be ${which}.`); };
    $('btnPickWhite').onclick = () => arm('white');
    $('btnPickBlack').onclick = () => arm('black');
    $('btnClearLevels').onclick = () => { app.dropper = null; CF.setDraft(d => { d.white = d.whiteAt = d.black = d.blackAt = null; }); };
    $('btnApplyLevels').onclick = CF.applyLevels;
    $('btnDiscardLevels').onclick = CF.discardLevels;

    // Export
    $('format').onchange = e => CF.commit(s => { s.export.format = e.target.value; });
    const ql = $('quality');
    ql.oninput = () => CF.commit(s => { s.export.quality = +ql.value; }, 'quality');
    $('size').onchange = e => CF.commit(s => { s.export.longEdge = +e.target.value || 0; });
    $('interp').onchange = e => CF.commit(s => { s.export.interp = e.target.value; });
    $('btnDownload').onclick = () => CF.doExport('download');
    $('btnShare').onclick = () => app.pendingSave ? CF.shareFile(app.pendingSave) : CF.doExport('share');
    // Share is the main action where the browser supports it; Download stays as a plain download.
    if (CF.Exporter.canShare()) { $('btnShare').hidden = false; $('btnDownload').classList.remove('primary'); }
    // Copy needs the image clipboard (secure pages only); hide it rather than show a dead button.
    $('btnCopy').hidden = !CF.Exporter.canCopy();
    $('btnCopy').onclick = () => CF.doExport('copy');
    $('btnListing').onclick = () => CF.commit(s => {
      s.crop = { mode: 'fit', preset: '1:1', ratio: 1, swapped: false, orient: null, rect: null };
      s.export.format = 'jpeg'; s.export.quality = 0.92; s.export.longEdge = 2000;
      if (s.export.fill === 'transparent') s.export.fill = '#ffffff';
    });
    $('btnSaveEdits').onclick = CF.saveEdits;
    $('btnLoadEdits').onclick = () => els.editsInput.click();
    els.editsInput.addEventListener('change', () => { const f = els.editsInput.files[0]; els.editsInput.value = ''; if (f) CF.loadEdits(f); });

    document.querySelectorAll('[data-reset]').forEach(b => b.addEventListener('click', () => resetStep(b.dataset.reset)));
  }

  function resetStep(step) {
    CF.commit(s => {
      if (step === 'perspective') {
        const c = app.detection.candidates[0];
        s.corners = c ? c.corners.map(p => p.slice()) : CF.insetCorners(s.source.width, s.source.height);
        s.strength = CONFIG.perspective.strength / 100;
        s.aspect = CF.cardAspect(); s.squareUpHeight = CONFIG.squareUpHeight;
      } else if (step === 'rotate') { s.rotation = { quarter: 0, fine: 0, fillFrame: false }; s.flip = { h: false, v: false }; }
      else if (step === 'crop') s.crop = CF.cropDefaults(null);
      else if (step === 'export') {
        const x = CONFIG.export;
        s.export = { format: x.format, quality: x.quality, longEdge: x.longEdge, interp: x.interp, fill: x.fill };
      }
    });
  }

  function syncUI() {
    const has = !!app.img, s = app.state;
    els.root.classList.toggle('has-img', has);
    els.root.classList.toggle('previewing', !!app.previewMode && app.tab === 'perspective');
    $('btnPreview').setAttribute('aria-pressed', String(!!app.previewMode));
    $('btnPreview').querySelector('span').textContent = app.previewMode ? 'Corners' : 'Preview';
    $('btnUndo').disabled = !CF.History.undo.length; $('btnRedo').disabled = !CF.History.redo.length;
    $('btnFit').disabled = !has;
    document.querySelectorAll('.tab').forEach(b => { b.disabled = !has; });
    document.querySelectorAll('.panel button, .panel select, .panel input').forEach(x => { x.disabled = !has; });
    if (!s) return;
    setSeg('orientation', s.aspect.orientation); $('format').value = s.export.format;
    $('strength').value = Math.round(s.strength * 100); $('strengthVal').textContent = Math.round(s.strength * 100) + '%';
    $('snap').checked = app.snap; $('debugOverlay').checked = app.debugOverlay;
    const fill = s.export.fill, known = ['transparent', '#ffffff', '#000000'].includes(fill);
    $('fill').value = known ? fill : 'custom'; if (!known) $('fillColor').value = fill;
    $('btnSeed').setAttribute('aria-pressed', String(app.seedMode));
    $('btnClearSeed').disabled = !app.detection.seed;
    const n = app.detection.candidates.length;
    $('btnNext').disabled = n < 2;
    $('btnNext').textContent = n > 1 ? `Candidate ${app.detection.index + 1}/${n}` : 'Candidate';
    $('fine').value = s.rotation.fine; $('fineNum').value = s.rotation.fine;
    $('fillFrame').checked = !!s.rotation.fillFrame; $('showGrid').checked = app.showGrid;
    const orient = CF.cropOrient(s, app.geo);
    document.querySelectorAll('[data-crop]').forEach(b => {
      b.setAttribute('aria-pressed', String(b.dataset.crop === s.crop.preset));
      b.textContent = CF.cropLabel(CONFIG.crop.presets.find(p => p.id === b.dataset.crop), orient);
    });
    $('btnSwap').disabled = !s.crop.ratio || s.crop.ratio === 1;
    $('quality').value = s.export.quality; $('qualityVal').textContent = Math.round(s.export.quality * 100) + '%';
    $('qualityRow').hidden = s.export.format === 'png';
    $('size').value = String(s.export.longEdge || 0);
    $('interp').value = s.export.interp;
    syncLevels();
    syncReadouts();
  }

  function syncLevels() {
    const s = app.state;
    if (app.levelsPending && JSON.stringify(app.levelsDraft) === JSON.stringify(s.levels || null)) { app.levelsPending = false; app.levelsDraft = null; }
    const lv = CF.draftLevels() || {};
    const sw = (id, c) => {
      const e = $(id), rgb = c && c.map(Math.round).join(', ');
      e.style.background = c ? `rgb(${rgb})` : ''; e.classList.toggle('unset', !c); e.title = c ? `RGB ${rgb}` : 'Not set';
    };
    sw('swWhite', lv.white); sw('swBlack', lv.black);
    $('btnPickWhite').setAttribute('aria-pressed', String(app.dropper === 'white'));
    $('btnPickBlack').setAttribute('aria-pressed', String(app.dropper === 'black'));
    $('btnClearLevels').disabled = !lv.white && !lv.black;
    $('btnApplyLevels').disabled = $('btnDiscardLevels').disabled = !app.levelsPending;
    // No "unapplied" message: the step's dot and the enabled Apply button say it.
    document.querySelector('[data-tab="levels"]').classList.toggle('pending', app.levelsPending);
    els.root.classList.toggle('levels-pending', app.levelsPending);
  }

  function syncReadouts() {
    const s = app.state, g = app.geo; if (!s) return;
    $('btnShare').querySelector('span').textContent = app.pendingSave ? 'Share now' : 'Share';
    // Perspective: detection details live under More; the status line only shows what needs action.
    const n = app.detection.candidates.length, c = n ? app.detection.candidates[app.detection.index] : null;
    $('detectInfo').textContent = app.detection.msg || (c ? `Candidate ${app.detection.index + 1}/${n} · confidence ${Math.round(c.confidence * 100)}%` : '');
    const ps = $('perspStatus');
    ps.className = 'status' + (g && !g.ok ? ' err' : '');
    ps.textContent = g && !g.ok ? g.reason
      : app.detection.msg ? app.detection.msg
      : c && c.confidence < CONFIG.detect.minConfidence ? `Low confidence (${Math.round(c.confidence * 100)}%) — check the corners.`
      : !n && app.img && app.detection.last ? 'Nothing detected — drag the corners into place.'
      : g && g.P.clamped ? `Corrected frame clamped to ${CONFIG.maxOutputPx}px on the long side.` : '';
    if (!g || !g.ok) { $('cropReadout').textContent = ''; $('exportReadout').textContent = ''; $('exportMsg').textContent = ''; $('btnDownload').disabled = $('btnShare').disabled = $('btnCopy').disabled = true; return; }
    $('cropReadout').innerHTML = `Crop <b>${Math.round(g.crop.w)} × ${Math.round(g.crop.h)}</b> px`;
    const small = s.export.longEdge && g.out.scale >= 1 && Math.max(g.crop.w, g.crop.h) < s.export.longEdge;
    $('exportReadout').innerHTML = `Output <b>${g.out.w} × ${g.out.h}</b> px · ${s.export.format.toUpperCase()}` + (small ? ' · full crop, not upscaled' : '');
    const em = $('exportMsg'), notes = [];
    if (g.out.clamped) notes.push(`Clamped to fit the ${Math.round(CONFIG.maxOutputArea / 1e6 * 10) / 10} MP canvas limit.`);
    if (s.export.format === 'jpeg' && s.export.fill === 'transparent') notes.push('JPEG has no transparency; empty areas will be white.');
    if (app.levelsPending) notes.push('Levels has unapplied changes; the export uses the applied levels only.');
    em.className = 'status'; em.textContent = notes.join(' ');
    $('btnDownload').disabled = !!app.exporting; $('btnShare').disabled = !!app.exporting && !app.pendingSave; $('btnCopy').disabled = !!app.exporting;
  }

  /* ---------- debug tuning panel (?debug=1 or the ` key) ---------- */
  function toggleDebugPanel(force) {
    const p = els.debugPanel, show = force !== undefined ? force : p.hidden;
    p.hidden = !show;
    if (show) { buildDebugPanel(); if (!app.debugOverlay) { app.debugOverlay = true; syncUI(); if (app.img) CF.runDetect(); } }
  }
  let redetectTimer = 0;
  function buildDebugPanel() {
    const p = els.debugPanel, d = CONFIG.detect;
    const rows = Object.keys(d).filter(k => typeof d[k] === 'number' || typeof d[k] === 'boolean').map(k => typeof d[k] === 'boolean'
      ? `<label>${k}<input type="checkbox" data-k="${k}" ${d[k] ? 'checked' : ''}></label>`
      : `<label>${k}<input type="number" data-k="${k}" value="${d[k]}" step="any"></label>`).join('');
    p.innerHTML = `<div class="row" style="justify-content:space-between"><b>Detection tuning</b><button class="btn" id="dbgClose" style="min-height:32px">×</button></div>
      <div class="row"><button class="btn" id="dbgCopy" style="min-height:36px">Copy CONFIG</button><button class="btn" id="dbgRun" style="min-height:36px">Re-detect</button></div>
      ${rows}<pre id="dbgInfo"></pre>`;
    p.querySelector('#dbgClose').onclick = () => toggleDebugPanel(false);
    p.querySelector('#dbgRun').onclick = () => CF.runDetect();
    p.querySelector('#dbgCopy').onclick = async () => {
      const text = 'const CONFIG = ' + JSON.stringify(CONFIG, null, 2) + ';\n';
      try { await navigator.clipboard.writeText(text); toast('CONFIG copied.'); }
      catch (e) { console.log(text); toast('Clipboard blocked — CONFIG printed to the console.', 'warn'); }
    };
    p.querySelectorAll('input[data-k]').forEach(inp => inp.addEventListener('input', () => {
      const k = inp.dataset.k;
      CONFIG.detect[k] = inp.type === 'checkbox' ? inp.checked : Number(inp.value);
      clearTimeout(redetectTimer); redetectTimer = setTimeout(() => CF.runDetect(), 350);
    }));
    updateDebugPanel();
  }
  function updateDebugPanel() {
    const info = els.debugPanel.querySelector('#dbgInfo'); if (!info) return;
    const last = app.detection.last; if (!last) { info.textContent = ''; return; }
    const t = last.timing || {};
    info.textContent = `round trip ${Math.round(app.detection.ms || 0)} ms (analyze ${Math.round(t.analyze)} ms, quads ${Math.round(t.quads)} ms)\n` +
      `${t.lines} lines → ${t.quadCount} quads\n` + app.detection.candidates.map((c, i) =>
        `#${i + 1} score ${c.score.toFixed(3)} conf ${(c.confidence * 100).toFixed(0)}% sup ${c.parts.support.toFixed(2)} min ${c.parts.supMin.toFixed(2)} asp ${c.parts.aspect.toFixed(2)} ang ${c.parts.angle.toFixed(2)} area ${(c.parts.areaFrac * 100).toFixed(1)}% refined ${c.refined ? c.refined.map(Number).join('') : '-'}`).join('\n');
  }

  /* ---------- resume prompt (start screen) ---------- */
  function ago(t) {
    const m = Math.round((Date.now() - t) / 60000);
    return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`;
  }
  async function offerResume() {
    const rec = await CF.Session.peek();
    if (!rec || app.img) return;
    $('resumeName').textContent = rec.name; $('resumeWhen').textContent = '(' + ago(rec.savedAt) + ')';
    $('resume').hidden = false; $('btnOpenEmpty').classList.remove('primary');
  }
  function hideResume() { $('resume').hidden = true; $('btnOpenEmpty').classList.add('primary'); }
  async function resumeSession() {
    hideResume();
    try {
      const [photo, edits] = await Promise.all([CF.Session.loadPhoto(), CF.Session.peek()]);
      if (!photo) { toast('The saved photo is gone. Open it again.', 'warn', 5000); return; }
      await CF.openFile(new File([photo.buf], photo.name, { type: photo.type }), photo.name, edits);
    } catch (e) { console.error(e); toast('Couldn’t resume: ' + e.message, 'err', 6000); }
  }

  Object.assign(CF, { setTab, STEPS, closeStepMenu, collapseMore, buildControls, bindControls, syncUI, syncReadouts, toggleDebugPanel, updateDebugPanel, offerResume, resumeSession });
})(window.CF);
