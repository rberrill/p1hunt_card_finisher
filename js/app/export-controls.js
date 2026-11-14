/* =====================================================================
   js/app/export-controls.js: the Export step's controls: format, size, quality and
   interpolation, Share / Download / Copy, Next card, the readout, the notes and the source line.
   Shell modules share one namespace, CF (created in core.js). Names from core are
   destructured below; anything from another module is called as CF.name.
   tests/selftest.js checks these boundaries.
   ===================================================================== */
(function (CF) {
  'use strict';
  const { byId, makeEl, elements, app } = CF;

  // The gap left above the Corner shots group when its button scrolls to it, so the box's top
  // edge doesn't sit flush against the control area's edge.
  const CORNER_SCROLL_MARGIN_PX = 8;

  // The Size dropdown's options, from CONFIG (0 = the original size).
  function buildSizeOptions() {
    byId('size').replaceChildren(...CONFIG.export.longEdgePresets.map(
      pixels => makeEl('option', { value: pixels }, pixels ? pixels + ' px' : 'Original size'),
    ));
  }

  // The Corner shots button on Export: opens More options and scrolls its Corner shots group to
  // the top of the control area. On the phone, opening More options expands the panel in its
  // toggle handler, so the scroll waits for that event and measures the new layout.
  async function showCornerShots() {
    const group = byId('cornerShots');
    const more = group.closest('details');
    if (!more.open) {
      const toggled = new Promise(resolve => {
        more.addEventListener('toggle', resolve, { once: true });
      });
      more.open = true;
      await toggled;
    }
    const controls = group.closest('.controls');
    const offsetPx = group.getBoundingClientRect().top - controls.getBoundingClientRect().top;
    controls.scrollTop += offsetPx - CORNER_SCROLL_MARGIN_PX;
  }

  function bindExport() {
    byId('format').onchange = event => CF.commit(state => {
      state.export.format = event.target.value;
    });
    const quality = byId('quality');
    quality.oninput = () => CF.commit(state => {
      state.export.quality = +quality.value;
    }, 'quality');
    byId('size').onchange = event => CF.commit(state => {
      state.export.longEdge = +event.target.value || 0;
    });
    byId('interp').onchange = event => CF.commit(state => {
      state.export.interp = event.target.value;
    });
    byId('btnDownload').onclick = () => CF.doExport('download');
    byId('btnShare').onclick = () => {
      if (app.pendingSave) CF.sharePending();
      else CF.doExport('share');
    };
    // Next card opens the photo picker, like Open; the new photo starts as any other does. After
    // a pair's export it starts a single photo without asking.
    byId('btnNextCard').onclick = () => CF.pickPhoto('next');
    byId('btnCornerShots').onclick = showCornerShots;
    // Share is the main action where the browser supports it; Download stays a plain download.
    if (CF.Exporter.canShare()) {
      byId('btnShare').hidden = false;
      byId('btnDownload').classList.remove('primary');
    }
    // Copy needs the image clipboard (secure pages only); hide it rather than show a dead button.
    byId('btnCopy').hidden = !CF.Exporter.canCopy();
    byId('btnCopy').onclick = () => CF.doExport('copy');
    byId('btnSaveEdits').onclick = CF.saveEdits;
    byId('btnLoadEdits').onclick = () => elements.editsInput.click();
    elements.editsInput.addEventListener('change', () => {
      const file = elements.editsInput.files[0];
      elements.editsInput.value = '';
      if (file) CF.loadEdits(file);
    });
  }

  function syncExportControls(state) {
    byId('format').value = state.export.format;
    byId('quality').value = state.export.quality;
    byId('qualityValue').textContent = Math.round(state.export.quality * 100) + '%';
    byId('qualityRow').hidden = state.export.format === 'png';
    byId('size').value = String(state.export.longEdge || 0);
    byId('interp').value = state.export.interp;
  }

  // The export notes: why the output isn't what you might expect. pairLayout: the Together
  // layout when a pair is saved Together (its cap replaces the open side's).
  function exportNotes(state, geometry, pairLayout) {
    const notes = [];
    const isClamped = pairLayout ? pairLayout.scale < 1 : geometry.output.isClamped;
    if (isClamped) {
      const megapixels = Math.round(CONFIG.maxOutputArea / 1e6 * 10) / 10;
      notes.push(`Clamped to fit the ${megapixels} MP canvas limit.`);
    }
    if (state.export.format === 'jpeg' && state.export.fill === 'transparent') {
      notes.push('JPEG has no transparency; empty areas will be white.');
    }
    if (app.levelsPending) {
      notes.push('Levels has unapplied changes; the export uses the applied levels only.');
    }
    return notes.join(' ');
  }

  // The photo as the app received it: pixels, type, bytes and name. What the picker handed over,
  // which on iOS can differ from what Photos stores (transcoded, resized), so it's on screen for
  // bug reports. Returns '' with no photo.
  function sourceInfo() {
    const img = app.img;
    const file = app.file;
    if (!img || !file) return '';
    const megabytes = (file.size / 1048576).toFixed(1);
    const megapixels = (img.width * img.height / 1000000).toFixed(1);
    return `Source ${img.width} × ${img.height} px (${megapixels} MP) · `
      + `${file.type || 'unknown type'} · ${megabytes} MB · ${file.name || 'unnamed'}`;
  }

  // The source line under More options.
  function syncSourceInfo() {
    byId('sourceInfo').textContent = sourceInfo();
  }

  // The Share label, the readout, the notes and the row under them; the save buttons are off
  // while the corners are invalid or an export runs.
  function syncExportReadouts() {
    const state = app.state;
    const geometry = app.geometry;
    byId('btnShare').querySelector('span').textContent = app.pendingSave ? 'Share now' : 'Share';
    const exportButtons = ['btnDownload', 'btnShare', 'btnCopy'].map(byId);
    if (!geometry || !geometry.ok) {
      byId('exportReadout').textContent = '';
      byId('exportMessage').textContent = '';
      exportButtons.forEach(button => {
        button.disabled = true;
      });
      return;
    }
    const pairLayout = syncExportReadout(state, geometry);
    // The phone control area holds one row here: a note, or Add back with Corner shots or Next
    // card. A note shows until the export (it was on screen when the photo was exported), then
    // Next card takes its place until the next edit (on wide screens too, so both layouts behave
    // the same). Add back and Corner shots show when no note needs the row; Next card replaces
    // Corner shots, which is only a way to find the group under More options.
    const notes = exportNotes(state, geometry, pairLayout);
    const isNextCardShown = !byId('btnNextCard').hidden;
    const message = byId('exportMessage');
    message.className = 'status';
    message.textContent = isNextCardShown ? '' : notes;
    byId('btnAddBack').hidden = !!app.pair || (!isNextCardShown && !!notes);
    byId('btnCornerShots').hidden = isNextCardShown || !!notes;
    byId('btnDownload').disabled = !!app.exporting;
    byId('btnShare').disabled = !!app.exporting && !app.pendingSave;
    byId('btnCopy').disabled = !!app.exporting;
  }

  // The output readout: the size and format, or for a pair the choice and its size. Returns the
  // Together layout when a pair is saved Together, else null.
  function syncExportReadout(state, geometry) {
    const { crop, output } = geometry;
    const format = state.export.format.toUpperCase();
    if (app.pair) {
      const pair = CF.pairReadout();
      const size = makeEl('b', null, pair.size);
      byId('exportReadout').replaceChildren(`${pair.label} · `, size, ` px · ${format}`);
      return pair.layout;
    }
    const longEdge = state.export.longEdge;
    const isSmall = longEdge && output.scale >= 1 && Math.max(crop.width, crop.height) < longEdge;
    const details = ` px · ${format}` + (isSmall ? ' · full crop, not upscaled' : '');
    const outputSize = makeEl('b', null, `${output.width} × ${output.height}`);
    byId('exportReadout').replaceChildren('Output ', outputSize, details);
    return null;
  }

  // Next card shows only once the current edits are exported (for a pair, both sides in the
  // chosen output), so it never offers to leave unexported work behind, and not while a share
  // waits for its second tap.
  function syncNextCard(state) {
    const isExported = app.pair
      ? CF.isPairExported()
      : app.exportedState === JSON.stringify(state);
    const isShown = isExported && !app.pendingSave;
    byId('btnNextCard').hidden = !isShown;
  }

  Object.assign(CF, {
    buildSizeOptions,
    bindExport,
    syncExportControls,
    syncSourceInfo,
    syncExportReadouts,
    syncNextCard,
  });
})(window.CF);
