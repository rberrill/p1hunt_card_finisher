/* =====================================================================
   js/app/parts/sheet.js: the Sheet part. A step's options, the Corner shots and the Levels
   tips: a panel that rises over the lower half of the photo, above a dimmed backdrop. A tap on
   the backdrop or on its close button closes it. It never resizes the photo.
   Shell modules share one namespace, CF (created in core.js). Names from core are destructured
   below; anything from another module is called as CF.name. tests/selftest.js checks these
   boundaries.
   ===================================================================== */
(function (CF) {
  'use strict';
  const { makeEl } = CF;

  // Icon sizes in CSS px: a row's leading icon, its chevron, and the close button's cross.
  const SHEET_ROW_ICON_PX = 18;
  const SHEET_SMALL_ICON_PX = 16;

  // Builds a closed sheet: a layer holding the backdrop and the panel (its grabber, a title row
  // with the close button, a progress line on its top edge, then `content`). Returns the layer.
  function buildSheet({ id, title }, ...content) {
    const titleId = id && `${id}Title`;
    const close = makeEl('button', {
      class: 'sheet-close',
      type: 'button',
      'aria-label': 'Close',
    }, CF.makeIcon('close', SHEET_SMALL_ICON_PX));
    const layer = makeEl('div', { class: 'sheet-layer', id, hidden: true },
      makeEl('div', { class: 'sheet-scrim' }),
      makeEl('div', {
        class: 'sheet',
        role: 'dialog',
        'aria-modal': 'true',
        'aria-labelledby': titleId,
      },
      CF.buildProgressLine(id && `${id}Progress`),
      makeEl('div', { class: 'sheet-grabber' }),
      makeEl('div', { class: 'sheet-header' },
        makeEl('h2', { class: 'sheet-title', id: titleId }, title),
        close),
      makeEl('div', { class: 'sheet-body' }, ...content)));
    close.addEventListener('click', () => closeSheet(layer));
    layer.querySelector('.sheet-scrim').addEventListener('click', () => closeSheet(layer));
    return layer;
  }

  // Opens a sheet.
  function openSheet(layer) {
    layer.hidden = false;
  }

  // Closes a sheet, and tells its listeners with a `sheetclose` event on the layer.
  function closeSheet(layer) {
    if (layer.hidden) return;
    layer.hidden = true;
    layer.dispatchEvent(new Event('sheetclose'));
  }

  // Updates a sheet; a value left out stays as it is. progress: 0 to 1, or null for none.
  function updateSheet(layer, { title, progress }) {
    if (title !== undefined) layer.querySelector('.sheet-title').textContent = title;
    if (progress !== undefined) {
      CF.updateProgressLine(layer.querySelector('.progress-line'), progress);
    }
  }

  // A small heading above a group in a sheet.
  function buildSheetHeading(text) {
    return makeEl('h3', { class: 'sheet-heading' }, text);
  }

  // A paragraph of small grey text in a sheet.
  function buildSheetHint(...content) {
    return makeEl('p', { class: 'sheet-hint' }, ...content);
  }

  // A rounded group of rows.
  function buildSheetList(...rows) {
    return makeEl('div', { class: 'sheet-list' }, ...rows);
  }

  // A row that does something when tapped. detail: grey text at its right end (it gets a
  // chevron, since such a row leads somewhere). isDanger: bold with a red icon (the resets).
  function buildSheetRow({ id, icon, label, detail, isDanger }) {
    return makeEl('button', {
      class: isDanger ? 'sheet-row is-danger' : 'sheet-row',
      id,
      type: 'button',
    },
    makeEl('span', { class: 'sheet-row-label' },
      icon && CF.makeIcon(icon, SHEET_ROW_ICON_PX),
      label),
    detail && makeEl('span', { class: 'sheet-row-detail' },
      detail,
      CF.makeIcon('right', SHEET_SMALL_ICON_PX)));
  }

  // A row with an on / off switch: a checkbox with this id, drawn as a switch. The caller binds
  // its `change` event and sets `checked`.
  function buildSwitchRow({ id, icon, label }) {
    return makeEl('label', { class: 'sheet-row' },
      makeEl('span', { class: 'sheet-row-label' },
        icon && CF.makeIcon(icon, SHEET_ROW_ICON_PX),
        label),
      makeEl('input', { class: 'switch', type: 'checkbox', role: 'switch', id }));
  }

  // The Tips row: a tap opens the tips in place, under the row; another tap closes them.
  // tips: one string per paragraph. Returns the row and its tips in one element.
  function buildTipsRow(id, tips) {
    const chevron = makeEl('span', { class: 'sheet-row-detail' });
    const row = makeEl('button', {
      class: 'sheet-row',
      id,
      type: 'button',
      'aria-expanded': 'false',
    },
    makeEl('span', { class: 'sheet-row-label' }, CF.makeIcon('tips', SHEET_ROW_ICON_PX), 'Tips'),
    chevron);
    const body = makeEl('div', { class: 'sheet-tips', hidden: true },
      ...tips.map(tip => buildSheetHint(tip)));
    const setOpen = isOpen => {
      row.setAttribute('aria-expanded', String(isOpen));
      body.hidden = !isOpen;
      chevron.replaceChildren(CF.makeIcon(isOpen ? 'up' : 'right', SHEET_SMALL_ICON_PX));
    };
    row.addEventListener('click', () => setOpen(body.hidden));
    setOpen(false);
    return makeEl('div', { class: 'sheet-tips-group' }, buildSheetList(row), body);
  }

  Object.assign(CF, {
    buildSheet,
    openSheet,
    closeSheet,
    updateSheet,
    buildSheetHeading,
    buildSheetHint,
    buildSheetList,
    buildSheetRow,
    buildSwitchRow,
    buildTipsRow,
  });
})(window.CF);
