/* =====================================================================
   js/app/parts/sheet.js: the Sheet part. A step's options, the Corner shots and the Levels
   tips: a panel that rises over the lower half of the photo, above a dimmed backdrop. A tap on
   the backdrop or on its close button closes it, and so does a drag down on its top edge; a
   drag up on a grabber opens it, following the finger. Closed, it rests (unseen but for its
   tab) with its top edge on the control area's, so it rises from where the grabber is and
   takes its place. The grabber and the sheet carry the same tab (buildHandleTab), whose up
   chevron flattens into a pill as the sheet rises. It never resizes the photo. On a wide
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
  // How long the sheet takes to close, in ms (css/app.css, .sheet-layer). Its hidden attribute
  // is set when the slide ends (its transitionend); this long after the close, plus a margin,
  // as a fallback, for a close with nothing to slide (a sheet dragged down to its rest).
  const SHEET_CLOSE_MS = 200;
  const SHEET_CLOSE_FALLBACK_MS = SHEET_CLOSE_MS + 100;
  // A dragged sheet is fully opaque once it has risen this far, in CSS px.
  const SHEET_FADE_PX = 24;
  // The tab's chevron is a flat pill once the sheet has risen this fraction of its travel.
  const GLYPH_FLAT_FRACTION = 0.4;
  // The left arm of the tab's glyph in its two poses (the right arm mirrors it): its center's
  // offset from the glyph's center in CSS px, its angle, and the scale of its 20 x 5 px bar.
  // The chevron is about 16 x 8 px with a 2 px stroke; the pill 36 x 5 px. css/app.css draws
  // the same two poses at rest (.handle-arm); these are for a drag, which sits in between.
  const CHEVRON_POSE = { offsetPx: -4, angleDeg: -45, scaleX: 0.57, scaleY: 0.4 };
  const PILL_POSE = { offsetPx: -8, angleDeg: 0, scaleX: 1, scaleY: 1 };

  // Builds the handle's tab: an 80 px tab that rises 24 px above an edge, with a glyph of two
  // arms (an up chevron, or a pill once its sheet is open). The control area's grabber and
  // every sheet's own grabber hold one, so the two read as the same handle. Returns the tab.
  function buildHandleTab() {
    return makeEl('span', { class: 'handle-tab', 'aria-hidden': 'true' },
      makeEl('span', { class: 'handle-glyph' },
        makeEl('span', { class: 'handle-arm is-left' }),
        makeEl('span', { class: 'handle-arm is-right' })));
  }

  // Poses a sheet's glyph part of the way from chevron (flatFraction 0) to pill (1), with no
  // easing, under a finger. The glyph fades to the pill's lighter color as the arms flatten
  // (css/app.css reads --glyph-flat), as one group, so the overlapping arms show no seam.
  function shapeGlyph(layer, flatFraction) {
    const fraction = Math.min(1, Math.max(0, flatFraction));
    const mix = (start, end) => start + (end - start) * fraction;
    for (const arm of layer.querySelectorAll('.sheet-grabber .handle-arm')) {
      const side = arm.classList.contains('is-right') ? -1 : 1;
      const offsetPx = side * mix(CHEVRON_POSE.offsetPx, PILL_POSE.offsetPx);
      const angleDeg = side * mix(CHEVRON_POSE.angleDeg, PILL_POSE.angleDeg);
      const scaleX = mix(CHEVRON_POSE.scaleX, PILL_POSE.scaleX);
      const scaleY = mix(CHEVRON_POSE.scaleY, PILL_POSE.scaleY);
      arm.style.transform =
        `translateX(${offsetPx}px) rotate(${angleDeg}deg) scale(${scaleX}, ${scaleY})`;
    }
    layer.querySelector('.sheet-grabber .handle-glyph').style.setProperty('--glyph-flat', fraction);
  }

  // Hands a sheet's glyph back to its classes: chevron while closed, pill while open.
  function clearGlyph(layer) {
    for (const arm of layer.querySelectorAll('.sheet-grabber .handle-arm')) {
      arm.style.transform = '';
    }
    layer.querySelector('.sheet-grabber .handle-glyph').style.removeProperty('--glyph-flat');
  }

  // Builds a closed sheet: a layer holding the backdrop and the panel (its grabber with the
  // tab, a title row with the close button, a progress line on its top edge, then `content`).
  // Returns the layer.
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
      makeEl('div', { class: 'sheet-grabber' }, buildHandleTab()),
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
    cancelHide(layer);
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
    hideWhenSettled(layer);
    layer.dispatchEvent(new Event('sheetclose'));
  }

  // Hides a closing sheet once its slide has ended, on the sheet's own transitionend: a timer
  // started at the tap fired a frame early (the slide starts on the next frame), so the last
  // stretch was never drawn and the tab jumped to the control area's. Under reduced motion the
  // slide is a delayed jump, which ends the same way. A fallback timer covers a close with
  // nothing to slide. openSheet and a new drag cancel both (cancelHide).
  function hideWhenSettled(layer) {
    cancelHide(layer);
    const sheet = layer.querySelector('.sheet');
    const hide = () => {
      cancelHide(layer);
      if (!isSheetOpen(layer)) layer.hidden = true;
    };
    layer.onSlideEnd = event => {
      if (event.target === sheet && event.propertyName === 'transform') hide();
    };
    // A sheet dragged down to its rest has nothing to slide: it is hidden at once.
    const isSliding = sheet.getAnimations().some(slide => slide.transitionProperty === 'transform');
    if (!isSliding) {
      hide();
      return;
    }
    sheet.addEventListener('transitionend', layer.onSlideEnd);
    layer.closeTimer = setTimeout(hide, SHEET_CLOSE_FALLBACK_MS);
  }

  // Stops a pending hide (hideWhenSettled): the sheet is opening again, or under a finger.
  function cancelHide(layer) {
    clearTimeout(layer.closeTimer);
    if (!layer.onSlideEnd) return;
    layer.querySelector('.sheet').removeEventListener('transitionend', layer.onSlideEnd);
    layer.onSlideEnd = null;
  }

  // How far the sheet travels between closed and open, in CSS px. Closed, its top edge rests
  // on the control area's top edge (css/app.css, --sheet-rest), so this is less than its height.
  // Measured by trying both positions with the motion off; nothing is painted in between.
  function sheetTravelPx(layer) {
    const sheet = layer.querySelector('.sheet');
    const wasOpen = isSheetOpen(layer);
    layer.classList.add('is-dragging');
    sheet.style.transform = '';
    layer.classList.remove('is-open');
    const closedTop = sheet.getBoundingClientRect().top;
    layer.classList.add('is-open');
    const openTop = sheet.getBoundingClientRect().top;
    layer.classList.toggle('is-open', wasOpen);
    return closedTop - openTop;
  }

  // Shows the sheet raised by `openFraction` (0 closed, 1 open) of its travel under a finger:
  // no easing. It fades in over its first few pixels, as it takes the control area's place,
  // all but its tab (css/app.css reads --sheet-fade), which stands in for the area's from the
  // start. The tab's chevron flattens as it rises.
  function dragTo(layer, openFraction, travelPx) {
    const fraction = Math.min(1, Math.max(0, openFraction));
    const sheet = layer.querySelector('.sheet');
    layer.classList.add('is-dragging');
    sheet.style.transform = `translateY(${(1 - fraction) * travelPx}px)`;
    sheet.style.setProperty('--sheet-fade', Math.min(1, fraction * travelPx / SHEET_FADE_PX));
    layer.querySelector('.sheet-scrim').style.opacity = fraction;
    shapeGlyph(layer, fraction / GLYPH_FLAT_FRACTION);
  }

  // Hands the sheet back to its classes after a drag.
  function clearDrag(layer) {
    layer.classList.remove('is-dragging');
    const sheet = layer.querySelector('.sheet');
    sheet.style.transform = '';
    sheet.style.removeProperty('--sheet-fade');
    layer.querySelector('.sheet-scrim').style.opacity = '';
    clearGlyph(layer);
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

  // Lets Enter and Space on `handle`, a button (the control area's grabber), open its sheet
  // (ruling R33): the browser turns either key into a click that no pointer made, whose detail
  // is 0. A tap's own click (detail 1 or more) is left alone, since its pointerup has already
  // acted. An open sheet stays open: Escape closes it. Only for a button: a sheet's own top
  // edge is not one, and a click with no pointer that reaches it (Enter on the Close button
  // inside it, bubbling up) must not reopen the sheet that click is closing.
  function bindHandleKeys(handle, getLayer) {
    handle.addEventListener('click', event => {
      if (event.detail !== 0) return;
      const layer = getLayer();
      if (layer && !isSheetOpen(layer)) openSheet(layer);
    });
  }

  // Lets `handle` open or close a sheet. getLayer() names the sheet when the press starts (null
  // for none). A tap toggles it; a drag follows the finger (up opens, down closes) and, when
  // the finger lifts, settles open past a third of the way and closed short of it. While it is
  // pressed the handle has the class is-pressed (its tab fills, css/app.css). Where the handle
  // is a button, Enter and Space open the sheet too (bindHandleKeys).
  function bindSheetHandle(handle, getLayer) {
    if (handle.tagName === 'BUTTON') bindHandleKeys(handle, getLayer);
    let press = null;
    handle.addEventListener('pointerdown', event => {
      const layer = getLayer();
      if (!layer) return;
      handle.setPointerCapture(event.pointerId);
      handle.classList.add('is-pressed');
      press = { layer, startY: event.clientY, wasOpen: isSheetOpen(layer), travelPx: 0 };
    });
    handle.addEventListener('pointermove', event => {
      if (!press) return;
      const dy = event.clientY - press.startY;
      if (!press.travelPx && Math.abs(dy) < TAP_SLOP_PX) return;
      if (!press.travelPx) {
        cancelHide(press.layer);
        press.layer.hidden = false;
        press.travelPx = sheetTravelPx(press.layer);
      }
      const start = press.wasOpen ? 1 : 0;
      dragTo(press.layer, start - dy / press.travelPx, press.travelPx);
    });
    const end = event => {
      handle.classList.remove('is-pressed');
      if (!press) return;
      const { layer, startY, wasOpen, travelPx } = press;
      press = null;
      // A cancelled press (the browser took the gesture) puts the sheet back as it was.
      if (event.type === 'pointercancel') {
        if (!travelPx) return;
        settleSheet(layer, wasOpen);
        return;
      }
      if (!travelPx) {
        if (wasOpen) closeSheet(layer);
        else openSheet(layer);
        return;
      }
      const moved = (startY - event.clientY) / travelPx;
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
  // tips: one per paragraph, each a string or { text, isPhoneOnly }; a phone-only tip (a touch
  // gesture, say) gets `is-phone-only`, which css/app.css hides on a wide screen. keys: the
  // step's keyboard help, one string per paragraph, shown on a wide screen only, where the tips
  // are always open under the heading "Tips and keys" ("Tips" for a step with no keys;
  // css/app.css hides the row there). When every tip is phone-only and there are no keys, the
  // whole group is phone-only, so no heading stands alone. Returns the row and its tips in one
  // element.
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
    const heading = keys.length ? 'Tips and keys' : 'Tips';
    const body = makeEl('div', { class: 'sheet-tips', hidden: true },
      makeEl('h3', { class: 'sheet-heading sheet-tips-heading' }, heading),
      ...tips.map(buildTipHint),
      ...keyHints);
    const setOpen = isOpen => {
      row.setAttribute('aria-expanded', String(isOpen));
      body.hidden = !isOpen;
      chevron.replaceChildren(CF.makeIcon(isOpen ? 'up' : 'right', SHEET_SMALL_ICON_PX));
    };
    row.addEventListener('click', () => setOpen(body.hidden));
    setOpen(false);
    const isAllPhoneOnly = !keys.length && tips.every(tip => tip.isPhoneOnly === true);
    return makeEl('div', {
      class: isAllPhoneOnly ? 'sheet-tips-group is-phone-only' : 'sheet-tips-group',
    },
    buildSheetList(row),
    body);
  }

  // One tip's paragraph: `tip` is a string, or { text, isPhoneOnly } for a tip the wide layout
  // hides (class `is-phone-only`).
  function buildTipHint(tip) {
    if (typeof tip === 'string') return buildSheetHint(tip);
    const hint = buildSheetHint(tip.text);
    if (tip.isPhoneOnly === true) hint.classList.add('is-phone-only');
    return hint;
  }

  Object.assign(CF, {
    buildSheet,
    openSheet,
    closeSheet,
    isSheetOpen,
    bindSheetHandle,
    buildHandleTab,
    updateSheet,
    buildSheetHeading,
    buildSheetHint,
    buildSheetList,
    buildSheetRow,
    buildSwitchRow,
    buildTipsRow,
  });
})(window.CF);
