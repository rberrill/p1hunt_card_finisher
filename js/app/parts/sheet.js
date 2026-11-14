/* =====================================================================
   js/app/parts/sheet.js: the Sheet part. A step's options, the Corner shots and the Levels
   tips: a panel that rises over the lower half of the photo, above a dimmed backdrop. A tap on
   the backdrop or on its close button closes it, and so does a drag down on its top edge; a
   drag up on a grabber opens it, following the finger. It never resizes the photo. On a wide
   screen css/app.css shows it inline instead, always open.
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
  // A drag past this fraction of the sheet's height opens (or closes) it when the finger lifts;
  // a shorter one springs back (the plan's motion M1).
  const SHEET_SETTLE_FRACTION = 1 / 3;
  // A press that moves less than this, in CSS px, is a tap.
  const TAP_SLOP_PX = 6;
  // How long the sheet takes to close, in ms (css/app.css, .sheet-layer); its hidden attribute
  // is set once the slide has finished.
  const SHEET_CLOSE_MS = 200;

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
    // A tap outside closes it, but only a tap that began on the backdrop: the click that ends
    // the grabber tap which opened the sheet lands on the new backdrop and must not close it.
    const scrim = layer.querySelector('.sheet-scrim');
    let isPressOnScrim = false;
    scrim.addEventListener('pointerdown', () => {
      isPressOnScrim = true;
    });
    scrim.addEventListener('click', () => {
      if (isPressOnScrim) closeSheet(layer);
      isPressOnScrim = false;
    });
    // A drag down on the sheet's top edge (its grabber and title row) closes it.
    for (const edge of layer.querySelectorAll('.sheet-grabber, .sheet-header')) {
      bindSheetHandle(edge, () => layer);
    }
    return layer;
  }

  // True while a sheet is open or opening.
  const isSheetOpen = layer => layer.classList.contains('is-open');

  // Opens a sheet: it slides up and the backdrop fades in (css/app.css), then the focus moves
  // to its close button. Tells its listeners with a `sheetopen` event on the layer.
  function openSheet(layer) {
    clearTimeout(layer.closeTimer);
    layer.hidden = false;
    // Read a layout value so the closed position is drawn before the class change animates it.
    layer.getBoundingClientRect();
    clearDrag(layer);
    layer.classList.add('is-open');
    layer.querySelector('.sheet-close').focus({ preventScroll: true });
    layer.dispatchEvent(new Event('sheetopen'));
  }

  // Closes a sheet: it slides down, then is hidden; tells its listeners with a `sheetclose`
  // event on the layer.
  function closeSheet(layer) {
    if (!isSheetOpen(layer)) return;
    clearDrag(layer);
    layer.classList.remove('is-open');
    clearTimeout(layer.closeTimer);
    layer.closeTimer = setTimeout(() => {
      if (!isSheetOpen(layer)) layer.hidden = true;
    }, SHEET_CLOSE_MS);
    layer.dispatchEvent(new Event('sheetclose'));
  }

  // Shows the sheet raised by `openFraction` (0 closed, 1 open) under a finger: no easing.
  function dragTo(layer, openFraction) {
    const fraction = Math.min(1, Math.max(0, openFraction));
    const sheet = layer.querySelector('.sheet');
    layer.classList.add('is-dragging');
    sheet.style.transform = `translateY(${(1 - fraction) * 100}%)`;
    layer.querySelector('.sheet-scrim').style.opacity = fraction;
  }

  // Hands the sheet back to its classes after a drag.
  function clearDrag(layer) {
    layer.classList.remove('is-dragging');
    layer.querySelector('.sheet').style.transform = '';
    layer.querySelector('.sheet-scrim').style.opacity = '';
  }

  // Ends a drag with the sheet open or closed, sliding from where the finger left it.
  // closeSheet only acts on an open sheet, so a drag that leaves it closed marks it open first.
  function settleSheet(layer, shouldOpen) {
    if (shouldOpen) {
      openSheet(layer);
      return;
    }
    layer.classList.add('is-open');
    closeSheet(layer);
  }

  // Lets `handle` open or close a sheet. getLayer() names the sheet when the press starts (null
  // for none). A tap toggles it; a drag follows the finger (up opens, down closes) and, when
  // the finger lifts, settles open past a third of the way and closed short of it.
  function bindSheetHandle(handle, getLayer) {
    let press = null;
    handle.addEventListener('pointerdown', event => {
      const layer = getLayer();
      if (!layer) return;
      handle.setPointerCapture(event.pointerId);
      press = { layer, startY: event.clientY, wasOpen: isSheetOpen(layer), heightPx: 0 };
    });
    handle.addEventListener('pointermove', event => {
      if (!press) return;
      const dy = event.clientY - press.startY;
      if (!press.heightPx && Math.abs(dy) < TAP_SLOP_PX) return;
      if (!press.heightPx) {
        clearTimeout(press.layer.closeTimer);
        press.layer.hidden = false;
        press.heightPx = press.layer.querySelector('.sheet').getBoundingClientRect().height;
      }
      const start = press.wasOpen ? 1 : 0;
      dragTo(press.layer, start - dy / press.heightPx);
    });
    const end = event => {
      if (!press) return;
      const { layer, startY, wasOpen, heightPx } = press;
      press = null;
      // A cancelled press (the browser took the gesture) puts the sheet back as it was.
      if (event.type === 'pointercancel') {
        if (!heightPx) return;
        settleSheet(layer, wasOpen);
        return;
      }
      if (!heightPx) {
        if (wasOpen) closeSheet(layer);
        else openSheet(layer);
        return;
      }
      const moved = (startY - event.clientY) / heightPx;
      const shouldOpen = wasOpen ? moved > -SHEET_SETTLE_FRACTION : moved > SHEET_SETTLE_FRACTION;
      settleSheet(layer, shouldOpen);
    };
    handle.addEventListener('pointerup', end);
    handle.addEventListener('pointercancel', end);
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
  // tips: one string per paragraph. keys: the step's keyboard help, one string per paragraph,
  // shown on a wide screen only, where the tips are always open under the heading "Tips and
  // keys" (css/app.css hides the row there). Returns the row and its tips in one element.
  function buildTipsRow(id, tips, keys = []) {
    const chevron = makeEl('span', { class: 'sheet-row-detail' });
    const row = makeEl('button', {
      class: 'sheet-row',
      id,
      type: 'button',
      'aria-expanded': 'false',
    },
    makeEl('span', { class: 'sheet-row-label' }, CF.makeIcon('tips', SHEET_ROW_ICON_PX), 'Tips'),
    chevron);
    const keyHints = keys.map(key => {
      const hint = buildSheetHint(key);
      hint.classList.add('sheet-keys');
      return hint;
    });
    const body = makeEl('div', { class: 'sheet-tips', hidden: true },
      makeEl('h3', { class: 'sheet-heading sheet-tips-heading' }, 'Tips and keys'),
      ...tips.map(tip => buildSheetHint(tip)),
      ...keyHints);
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
    isSheetOpen,
    bindSheetHandle,
    updateSheet,
    buildSheetHeading,
    buildSheetHint,
    buildSheetList,
    buildSheetRow,
    buildSwitchRow,
    buildTipsRow,
  });
})(window.CF);
