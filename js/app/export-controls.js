/* =====================================================================
   js/app/export-controls.js: the Export step. Its control area, in four rows (Size and Format;
   the readout, any note and, for a pair, Together | Separately; Share, Download and Copy; Add
   back, Corner shots and Next card), and its options sheet (Quality, Interpolation, Fill
   outside photo, the edits files, Reset, the source line and the version, Tips).
   Shell modules share one namespace, CF (created in core.js). Names from core are
   destructured below; anything from another module is called as CF.name.
   tests/selftest.js checks these boundaries.
   ===================================================================== */
(function (CF) {
  'use strict';
  const { byId, makeEl, elements, app } = CF;

  // The step's tips (the plan's approved wording, 14 November). Export has no keyboard help
  // (frame DT6).
  const EXPORT_TIPS = [
    'Share’s Save Image puts the photo in Photos.',
    'Original keeps the crop at the photo’s own resolution and never upscales.',
    'Next card shows once these edits are exported.',
    'An edits file is small. Re-open the same photo, load it, and the export is identical.',
  ];
  const EXPORT_FORMATS = [
    { value: 'jpeg', label: 'JPEG' },
    { value: 'png', label: 'PNG' },
    { value: 'webp', label: 'WebP' },
  ];
  const EXPORT_INTERPOLATIONS = [
    { value: 'bilinear', label: 'Bilinear' },
    { value: 'bicubic', label: 'Bicubic (sharper, slower)', shortLabel: 'Bicubic' },
  ];
  // Fill outside photo's fixed choices; any other color is Custom.
  const FILL_PRESETS = [
    { value: 'transparent', label: 'Transparent' },
    { value: '#ffffff', label: 'White' },
    { value: '#000000', label: 'Black' },
  ];
  // The fill picker's last choice: it opens the color input.
  const FILL_CUSTOM = { value: 'custom', label: 'Custom…' };
  const PAIR_OUTPUT_CHOICES = [
    { value: 'together', label: 'Together' },
    { value: 'separately', label: 'Separately' },
  ];
  // Icon sizes in CSS px: the note's warning mark and a picker row's chevron (frame E4, E11).
  const NOTE_ICON_PX = 15;
  const PICKER_ICON_PX = 16;

  // True once Custom… is picked in the fill picker, until a fixed choice is. It keeps the
  // Custom color row up while the custom color still equals a fixed one (white, at first).
  // Only this module reads it; it is not edit state.
  let isFillCustom = false;

  /* ---------- building the control area ---------- */
  // Builds Export's control area and options sheet into its section, ahead of the Corner shots
  // group that corner-shots.js builds its own sheet around (the shell's contract).
  function buildExportControls() {
    const section = document.querySelector('section[data-panel="export"]');
    const area = CF.buildControlArea('exportArea',
      buildChoiceRow(),
      buildReadoutRow(),
      buildSaveRow(),
      buildMoreRow());
    const sheet = CF.buildSheet({ id: 'exportSheet', title: 'Export options' },
      CF.buildSheetList(buildQualityRow(), buildInterpolationRow(), ...buildFillRows()),
      ...buildEditsGroup(),
      CF.buildSheetList(buildExportResetRow()),
      buildInfoLines(),
      CF.buildTipsRow('exportTips', EXPORT_TIPS));
    section.prepend(area, sheet);
  }

  // The first row: Size and Format, one tap each. Size's choices come from CONFIG (0 = the
  // original size).
  function buildChoiceRow() {
    const sizes = CONFIG.export.longEdgePresets.map(pixels => ({
      value: String(pixels),
      label: pixels ? String(pixels) : 'Original',
    }));
    return CF.buildControlRow('exportChoices',
      CF.buildSegmented({
        id: 'exportSize',
        label: 'Size (long edge)',
        options: sizes,
        isFitted: true,
        isDense: true,
      }),
      CF.buildSegmented({
        id: 'exportFormat',
        label: 'Format',
        options: EXPORT_FORMATS,
        isFitted: true,
        isDense: true,
      }));
  }

  // The second row: the readout with any note under it (the amber mark leads the note), and
  // Together | Separately at the right while a pair is open.
  function buildReadoutRow() {
    const notes = makeEl('div', { class: 'export-notes', id: 'exportMessage', hidden: true });
    const pairOutput = CF.buildSegmented({
      id: 'pairOutput',
      label: 'Pair output',
      options: PAIR_OUTPUT_CHOICES,
      isFitted: true,
      isDense: true,
    });
    pairOutput.hidden = true;
    return CF.buildControlRow('exportReadoutRow',
      makeEl('div', { class: 'export-readout-column' },
        makeEl('span', { class: 'export-readout', id: 'exportReadout' }),
        notes),
      pairOutput);
  }

  // The third row: the three ways to save. Share is the red main action where the browser can
  // share files; where it can't, syncSaveButtons hides it and Download takes the red.
  function buildSaveRow() {
    return CF.buildControlRow('exportSaveRow',
      CF.buildActionButton({
        id: 'btnShare',
        label: 'Share',
        icon: 'share',
        look: 'main',
        size: 'tall',
        isWide: true,
        title: 'Share or save the image (Save Image puts it in Photos)',
      }),
      CF.buildActionButton({
        id: 'btnDownload',
        label: 'Download',
        icon: 'download',
        size: 'tall',
      }),
      CF.buildActionButton({ id: 'btnCopy', label: 'Copy', icon: 'copy', size: 'tall' }));
  }

  // The bottom row: Add back (while unpaired), Corner shots, and Next card in white once the
  // current edits are exported.
  function buildMoreRow() {
    const nextCard = CF.buildActionButton({
      id: 'btnNextCard',
      label: 'Next card',
      icon: 'next',
      look: 'next',
      isWide: true,
      title: 'Open the next photo',
    });
    nextCard.hidden = true;
    return CF.buildControlRow('exportMoreRow',
      CF.buildActionButton({
        id: 'btnAddBack',
        label: 'Add back',
        isWide: true,
        title: 'Keep this photo as the front and open the back',
      }),
      CF.buildActionButton({
        id: 'btnCornerShots',
        label: 'Corner shots',
        isWide: true,
        title: "Close-ups of the card's four corners",
      }),
      nextCard);
  }

  /* ---------- building the options sheet ---------- */
  // Quality: its slider and percent in one row; hidden for PNG, which has no quality.
  function buildQualityRow() {
    return makeEl('div', { class: 'sheet-row export-quality-row', id: 'qualityRow' },
      makeEl('span', { class: 'sheet-row-label' }, 'Quality'),
      CF.buildSlider({ id: 'quality', min: 0.5, max: 1, step: 0.01, label: 'Quality' }),
      makeEl('b', { class: 'export-quality-value', id: 'qualityValue' }));
  }

  // A sheet row that shows its current value (in a span with id `${id}Value`) and a chevron,
  // and opens the phone's own picker: `control`, a native <select> or color input, is laid
  // over the whole row, unseen, so a tap anywhere on the row opens it. lead: an element shown
  // before the value (Fill's swatch).
  function buildPickerRow({ id, label, lead, isHidden }, control) {
    control.classList.add('export-picker');
    return makeEl('div', { class: 'sheet-row export-picker-row', id: `${id}Row`, hidden: isHidden },
      makeEl('span', { class: 'sheet-row-label' }, label),
      makeEl('span', { class: 'sheet-row-detail' },
        lead,
        makeEl('span', { id: `${id}Value` }),
        CF.makeIcon('right', PICKER_ICON_PX)),
      control);
  }

  // A native <select> with these choices ([{ value, label }]).
  function buildSelect(id, label, choices) {
    return makeEl('select', { id, 'aria-label': label },
      choices.map(choice => makeEl('option', {
        value: choice.value,
        'data-short': choice.shortLabel,
      }, choice.label)));
  }

  // Interpolation: Bilinear or Bicubic.
  function buildInterpolationRow() {
    const label = 'Interpolation';
    return buildPickerRow({ id: 'interp', label },
      buildSelect('interp', label, EXPORT_INTERPOLATIONS));
  }

  // Fill outside photo (D12: it is export state, so it lives with Export's options): the
  // picker row with a swatch of the color, and under it, while the fill is a custom color, a
  // row that opens the color input again.
  function buildFillRows() {
    const label = 'Fill outside photo';
    const colorInput = makeEl('input', {
      type: 'color',
      id: 'fillColor',
      value: '#ffffff',
      'aria-label': 'Custom fill color',
    });
    return [
      buildPickerRow({
        id: 'fill',
        label,
        lead: makeEl('span', { class: 'export-fill-swatch', id: 'fillSwatch' }),
      }, buildSelect('fill', label, FILL_PRESETS.concat(FILL_CUSTOM))),
      buildPickerRow({ id: 'fillColor', label: 'Custom color', isHidden: true }, colorInput),
    ];
  }

  // The edits files: the heading, Save edits and Load edits side by side, and the hint, which
  // leads with which side is saved while a pair is open (pair.js shows #editsPairHint).
  function buildEditsGroup() {
    return [
      CF.buildSheetHeading('Edits'),
      CF.buildControlRow('exportEditsRow',
        buildEditsButton('btnSaveEdits', 'Save edits', 'save'),
        buildEditsButton('btnLoadEdits', 'Load edits', 'open')),
      CF.buildSheetHint(
        makeEl('b', { id: 'editsPairHint', hidden: true }, 'Saves the side you’re on. '),
        'A small JSON file. Re-open the same photo, load it, and the export is identical.'),
    ];
  }

  // One of the two edits buttons, which share their row's width.
  function buildEditsButton(id, label, icon) {
    return CF.buildActionButton({ id, label, icon, isWide: true });
  }

  // Reset export settings: the shell's step reset binds every [data-reset] button.
  function buildExportResetRow() {
    const row = CF.buildSheetRow({
      id: 'exportResetRow',
      icon: 'rotateLeft',
      label: 'Reset export settings',
      isDanger: true,
    });
    row.dataset.reset = 'export';
    return row;
  }

  // The photo as received and the version, for bug reports: phones have no tooltip or
  // console. The source line shows what the picker handed over (iOS may transcode or resize);
  // main.js writes the version.
  function buildInfoLines() {
    return CF.buildSheetHint(
      makeEl('span', { class: 'export-info-line', id: 'sourceInfo' }),
      makeEl('span', { class: 'export-info-line', id: 'versionInfo' }));
  }

  /* ---------- binding ---------- */
  // Fill outside photo: a fixed choice sets it; Custom… sets the color input's color and opens
  // the input, and the input sets the color as it is dragged (one undo step).
  function bindFill() {
    byId('fill').onchange = event => {
      const choice = event.target.value;
      isFillCustom = choice === FILL_CUSTOM.value;
      const fill = isFillCustom ? byId('fillColor').value : choice;
      CF.commit(state => {
        state.export.fill = fill;
      });
      // A commit that changes nothing (Custom… while the color is already this one) doesn't
      // sync, and the Custom color row must still show.
      syncFill(app.state.export.fill);
      if (isFillCustom) openColorInput();
    };
    byId('fillColor').oninput = event => {
      isFillCustom = true;
      CF.commit(state => {
        state.export.fill = event.target.value;
      }, 'fill');
    };
  }

  // Opens the color input's picker after Custom… is picked. A browser may refuse outside a
  // tap; the Custom color row is then the way in, so a refusal needs no message.
  function openColorInput() {
    const input = byId('fillColor');
    try {
      if (input.showPicker) input.showPicker();
      else input.click();
    } catch (error) {
      // Refused: nothing to undo, and nothing the user could act on.
      return;
    }
  }

  // Size, Format, Quality, Interpolation and, for a pair, Together | Separately.
  function bindExportSettings() {
    CF.bindSegmented(byId('exportSize'), value => CF.commit(state => {
      state.export.longEdge = +value || 0;
    }));
    CF.bindSegmented(byId('exportFormat'), value => CF.commit(state => {
      state.export.format = value;
    }));
    const quality = byId('quality');
    quality.oninput = () => CF.commit(state => {
      state.export.quality = +quality.value;
    }, 'quality');
    byId('interp').onchange = event => CF.commit(state => {
      state.export.interp = event.target.value;
    });
    CF.bindSegmented(byId('pairOutput'), value => CF.setPairOutput(value));
  }

  // Binds the step's controls once, at start-up. (Add back is bound by pair.js, Reset by the
  // shell.)
  function bindExport() {
    bindFill();
    bindExportSettings();
    byId('btnDownload').onclick = () => CF.doExport('download');
    byId('btnShare').onclick = () => {
      if (app.pendingSave) CF.sharePending();
      else CF.doExport('share');
    };
    byId('btnCopy').onclick = () => CF.doExport('copy');
    // Next card opens the photo picker, like Open; the new photo starts as any other does. After
    // a pair's export it starts a single photo without asking.
    byId('btnNextCard').onclick = () => CF.pickPhoto('next');
    byId('btnCornerShots').onclick = () => CF.openCornerShots();
    byId('btnSaveEdits').onclick = CF.saveEdits;
    byId('btnLoadEdits').onclick = () => elements.editsInput.click();
    elements.editsInput.addEventListener('change', () => {
      const file = elements.editsInput.files[0];
      elements.editsInput.value = '';
      if (file) CF.loadEdits(file);
    });
  }

  /* ---------- syncing ---------- */
  // Writes the fill into its rows: the picker's choice, the swatch (checkered for
  // Transparent), and the Custom color row, which shows while the fill is a custom color.
  function syncFill(fill) {
    const preset = FILL_PRESETS.find(choice => choice.value === fill);
    const colorInput = byId('fillColor');
    // A custom color that equals a fixed one (white, when Custom… is first picked) stays
    // Custom until the fill changes some other way (an undo, another photo).
    if (isFillCustom && fill !== colorInput.value) isFillCustom = false;
    const isCustom = !preset || isFillCustom;
    byId('fill').value = isCustom ? FILL_CUSTOM.value : fill;
    byId('fillValue').textContent = isCustom ? 'Custom' : preset.label;
    const swatch = byId('fillSwatch');
    const isTransparent = fill === 'transparent';
    swatch.classList.toggle('is-transparent', isTransparent);
    swatch.style.backgroundColor = isTransparent ? '' : fill;
    byId('fillColorRow').hidden = !isCustom;
    if (!isCustom) return;
    colorInput.value = fill;
    byId('fillColorValue').textContent = fill;
  }

  // Writes the state into the controls: the selected Size and Format, Quality (hidden for
  // PNG), Interpolation, the fill, and Together | Separately, which shows only while paired.
  function syncExportControls(state) {
    CF.updateSegmented(byId('exportSize'), state.export.longEdge || 0);
    CF.updateSegmented(byId('exportFormat'), state.export.format);
    CF.updateSlider(byId('quality').parentElement, { value: state.export.quality });
    byId('qualityValue').textContent = Math.round(state.export.quality * 100) + '%';
    byId('qualityRow').hidden = state.export.format === 'png';
    const interp = byId('interp');
    interp.value = state.export.interp;
    const chosen = interp.selectedOptions[0];
    byId('interpValue').textContent = chosen ? chosen.dataset.short || chosen.textContent : '';
    syncFill(state.export.fill);
    byId('pairOutput').hidden = !app.pair;
    CF.updateSegmented(byId('pairOutput'), app.pairOutput);
  }

  // The export notes: why the output isn't what you might expect, one string each. The phone
  // has room for one at a time, so they come in the order to deal with them: the next shows
  // once the first is gone. pairLayout: the Together layout when a pair is saved Together (its
  // cap replaces the open side's).
  function exportNotes(state, geometry, pairLayout) {
    const notes = [];
    if (app.levelsPending) {
      notes.push('Levels has unapplied changes; export uses the applied levels.');
    }
    const isClamped = pairLayout ? pairLayout.scale < 1 : geometry.output.isClamped;
    if (isClamped) {
      const megapixels = Math.round(CONFIG.maxOutputArea / 1e6 * 10) / 10;
      notes.push(`Clamped to fit the ${megapixels} MP canvas limit.`);
    }
    if (state.export.format === 'jpeg' && state.export.fill === 'transparent') {
      notes.push('JPEG has no transparency; empty areas will be white.');
    }
    return notes;
  }

  // One note: white text led by the amber warning mark (frame E4).
  function buildNote(text) {
    return makeEl('span', { class: 'export-note' },
      CF.makeIcon('warning', NOTE_ICON_PX),
      makeEl('span', { class: 'export-note-text' }, text));
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

  // The source line in the options sheet.
  function syncSourceInfo() {
    byId('sourceInfo').textContent = sourceInfo();
  }

  // The save row. Share and Copy are hidden where they can't work, never greyed: Share needs a
  // browser that shares files (Download is then the red one, and grows), Copy the image
  // clipboard, and Copy also goes for a pair set to Separately (two files can't be copied).
  // All three are off while the corners are invalid or an export runs; Share stays on while it
  // reads "Share now", which is the tap that finishes a slow export's share.
  function syncSaveButtons(isValid) {
    const canShare = CF.Exporter.canShare();
    const isSeparately = !!app.pair && app.pairOutput === 'separately';
    // Busy: an export runs, or a pair's other photo is being opened.
    const isBusy = !!app.exporting || !!app.isSwitching;
    // Together | Separately waits too: the export under way keeps the output it began with.
    byId('pairOutput').querySelectorAll('.segment').forEach(segment => {
      segment.disabled = isBusy;
    });
    CF.updateActionButton(byId('btnShare'), {
      label: app.pendingSave ? 'Share now' : 'Share',
      isHidden: !canShare,
      isDisabled: !isValid || (isBusy && !app.pendingSave),
    });
    const download = byId('btnDownload');
    CF.updateActionButton(download, {
      look: canShare ? '' : 'main',
      isDisabled: !isValid || isBusy,
    });
    download.classList.toggle('is-wide', !canShare);
    CF.updateActionButton(byId('btnCopy'), {
      isHidden: !CF.Exporter.canCopy() || isSeparately,
      isDisabled: !isValid || isBusy,
    });
  }

  // The readout, the notes under it, the save row and Add back. A note hides no button: it is
  // the readout row's second line, and stays beside Next card after an export. (On the phone,
  // css/app.css shows one note at a time, and beside a pair's Together | Separately gives the
  // note the readout's place until it is dealt with.)
  function syncExportReadouts() {
    const state = app.state;
    const geometry = app.geometry;
    const isValid = !!geometry && geometry.ok;
    syncSaveButtons(isValid);
    byId('btnAddBack').hidden = !!app.pair;
    const noteList = byId('exportMessage');
    if (!isValid) {
      byId('exportReadout').textContent = '';
      noteList.replaceChildren();
      noteList.hidden = true;
      return;
    }
    const pairLayout = syncExportReadout(state, geometry);
    const notes = exportNotes(state, geometry, pairLayout);
    noteList.replaceChildren(...notes.map(buildNote));
    noteList.hidden = !notes.length;
  }

  // The output readout: the size and format, or for a pair the choice and its size. Returns the
  // Together layout when a pair is saved Together, else null.
  function syncExportReadout(state, geometry) {
    const { crop, output } = geometry;
    const format = state.export.format.toUpperCase();
    if (app.pair) {
      const pair = CF.pairReadout();
      const size = makeEl('b', null, pair.size);
      // The control beside it says Together or Separately, so the readout doesn't (frame F9).
      byId('exportReadout').replaceChildren(size, ` px · ${format}`);
      return pair.layout;
    }
    const longEdge = state.export.longEdge;
    const isSmall = longEdge && output.scale >= 1 && Math.max(crop.width, crop.height) < longEdge;
    // The tail gives way on the phone while a note shows: the row holds one readout line then.
    const tail = makeEl('span', { class: 'export-readout-tail' }, ' · full crop, not upscaled');
    const outputSize = makeEl('b', null, `${output.width} × ${output.height}`);
    byId('exportReadout').replaceChildren(
      'Output ',
      outputSize,
      ` px · ${format}`,
      isSmall ? tail : '',
    );
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
    buildExportControls,
    bindExport,
    syncExportControls,
    syncSourceInfo,
    syncExportReadouts,
    syncNextCard,
  });
})(window.CF);
