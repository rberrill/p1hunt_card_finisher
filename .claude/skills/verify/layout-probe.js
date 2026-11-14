// Runs in the app's page (layout-check.js loads it through the DevTools Protocol): measures the
// layout on every step and builds each of the fifteen parts to measure it against the plan's
// component inventory. It sets window.__layoutProbe = { measureSteps, measureParts }.
'use strict';
(() => {
  const CF = window.CF;
  const wait = durationMs => new Promise(resolve => setTimeout(resolve, durationMs));
  const rectOf = el => el.getBoundingClientRect();
  const round = value => Math.round(value * 10) / 10;
  // The top bar's side padding, both sides together (css/app.css, .top-bar).
  const TOP_BAR_PADDING_PX = 8;
  const isShown = el => {
    const rect = rectOf(el);
    return rect.width > 0 && rect.height > 0 && getComputedStyle(el).visibility !== 'hidden';
  };

  // How far a touch target reaches from an element's center, in CSS px, counting a larger hit
  // area drawn by a pseudo-element: walks outwards while the point still lands on the element.
  function touchSize(el) {
    const rect = rectOf(el);
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const hits = (x, y) => {
      const found = document.elementFromPoint(x, y);
      return !!found && (found === el || el.contains(found));
    };
    const reach = (dx, dy) => {
      let distance = 0;
      while (distance < 60 && hits(centerX + dx * (distance + 1), centerY + dy * (distance + 1))) {
        distance++;
      }
      return distance;
    };
    if (!hits(centerX, centerY)) return { width: 0, height: 0 };
    return { width: reach(-1, 0) + reach(1, 0) + 1, height: reach(0, -1) + reach(0, 1) + 1 };
  }

  // Opens a sample photo and waits for detection to settle.
  async function openSample(name) {
    const blob = await (await fetch(`samples/${name}.JPEG`)).blob();
    const file = new File([blob], `${name}.JPEG`, { type: 'image/jpeg' });
    await window.__straightener.openFile(file);
    const detection = window.__straightener.app.detection;
    for (let attempt = 0; attempt < 100 && (detection.running || !detection.last); attempt++) {
      await wait(100);
    }
    await wait(300);
  }

  // Elements outside the photo area that overlap it (nothing may, unless a sheet or a card is
  // open). The grabber is allowed: its pill straddles the control area's top edge by design.
  function overPhoto() {
    const stage = document.getElementById('stage');
    const photo = rectOf(stage);
    const found = [];
    document.querySelectorAll('#app *').forEach(el => {
      const isOwn = stage.contains(el) || el.contains(stage) || el.closest('.grabber');
      if (isOwn || !isShown(el)) return;
      const rect = rectOf(el);
      const overlapsX = rect.left < photo.right - 1 && rect.right > photo.left + 1;
      const overlapsY = rect.top < photo.bottom - 1 && rect.bottom > photo.top + 1;
      if (overlapsX && overlapsY) found.push(el.id || el.className || el.tagName);
    });
    return found;
  }

  // On every step: the photo's height, the control area's height and whether it overflows, any
  // sideways page scroll, and anything over the photo. Works on the old layout (.controls) and
  // on the new one (.control-area).
  async function measureSteps() {
    await openSample('IMG_9136');
    const steps = [];
    for (const step of Object.keys(CF.STEPS)) {
      window.__straightener.setTab(step);
      await wait(120);
      const area = document.querySelector('.control-area')
        || document.querySelector('section.active .controls');
      const bar = document.querySelector('section.active .action-bar');
      const clipped = bar
        ? [...bar.querySelectorAll('.btn')].filter(el => el.scrollWidth > el.clientWidth).length
        : 0;
      steps.push({
        step,
        photoHeight: round(rectOf(document.getElementById('stage')).height),
        areaHeight: round(rectOf(area).height),
        areaOverflowPx: area.scrollHeight - area.clientHeight,
        pageOverflowPx: document.documentElement.scrollWidth - window.innerWidth,
        overPhoto: overPhoto(),
        clippedButtons: clipped,
      });
    }
    window.__straightener.setTab('perspective');
    return steps;
  }

  // A host the width of the window, over the page, to build parts in.
  function makeHost() {
    const host = CF.makeEl('div', { id: 'layoutProbeHost' });
    host.style.cssText = 'position:fixed;left:0;top:0;right:0;z-index:99;background:#0b0b0c';
    document.body.append(host);
    return host;
  }

  const size = el => {
    const rect = rectOf(el);
    return { width: round(rect.width), height: round(rect.height) };
  };

  // The control area with Perspective's line, a pad and five tools: the fullest three-row case.
  function buildSampleArea() {
    const tools = [
      { kind: 'mode', label: 'Nudge', icon: 'nudge' },
      { kind: 'mode', label: 'Flatten', icon: 'flatten' },
      { kind: 'action', label: 'Candidate', icon: 'candidate' },
      { kind: 'switch', label: 'Snap', icon: 'snap' },
      { kind: 'switch', label: 'Preview', icon: 'preview' },
    ].map(CF.buildTool);
    CF.updateTool(tools[0], { isOn: true });
    CF.updateTool(tools[1], { valueText: '100%' });
    CF.updateTool(tools[3], { isOn: true });
    const line = CF.buildAdjustmentLine({ name: 'Nudge' });
    const confidence = ['Confidence ', CF.makeEl('b', null, '87%')];
    CF.updateAdjustmentLine(line, { value: 'Corner 1 of 4', readout: confidence });
    const pad = CF.buildNudgePad({
      label: 'Nudge',
      keys: ['left', 'up', 'down', 'right'].map(name => ({ value: name, icon: name, label: name })),
    });
    const next = CF.buildActionButton({ label: 'Next handle', icon: 'right', isWide: true });
    const area = CF.makeEl('div', { class: 'control-area' },
      CF.makeEl('button', { class: 'grabber', type: 'button', 'aria-label': 'Options' }),
      line,
      CF.buildControlRow(null, pad, next),
      CF.buildToolRow(null, ...tools));
    return { area, line, pad, next, tools };
  }

  // Sizes of the shell parts: the top bar at its fullest (paired and zoomed), the tab bar, and
  // the control area.
  function measureShellParts(host) {
    const bar = CF.buildTopBar();
    CF.updateTopBar(bar, { canUndo: true, canRedo: false, isFitShown: true, pairSide: 'front' });
    const tabs = CF.buildTabBar();
    CF.updateTabBar(tabs, { current: 'levels', hasLevelsMark: true });
    const sample = buildSampleArea();
    host.append(bar, CF.makeEl('div', { class: 'probe-gap' }), sample.area, tabs);
    host.querySelector('.probe-gap').style.height = '40px';
    const barButtons = [...bar.querySelectorAll('.icon-button')].filter(isShown);
    const stepTabs = [...tabs.querySelectorAll('.step-tab')];
    const areaRect = rectOf(sample.area);
    const lowest = Math.max(...[...sample.area.children].map(el => rectOf(el).bottom));
    return {
      topBar: size(bar),
      topBarUsedPx: round(barButtons.length * rectOf(barButtons[0]).width
        + rectOf(bar.querySelector('#sideSwitch')).width + TOP_BAR_PADDING_PX),
      iconButtons: barButtons.map(touchSize),
      sideSwitch: size(bar.querySelector('#sideSwitch')),
      sideHalves: [...bar.querySelectorAll('#sideSwitch .segment')].map(touchSize),
      tabBarHeight: size(tabs).height,
      tabs: stepTabs.map(touchSize),
      tabsOverflowPx: round(rectOf(stepTabs[5]).right - rectOf(tabs).right),
      tabFontPx: parseFloat(getComputedStyle(stepTabs[0]).fontSize),
      tabMark: size(tabs.querySelector('.step-tab-mark')),
      area: size(sample.area),
      areaSparePx: round(areaRect.bottom - lowest),
      labelRow: size(sample.line),
      toolRow: size(sample.area.querySelector('.tool-row')),
      tools: sample.tools.map(size),
      toolLabelsClipped: sample.tools.filter(tool => tool.scrollWidth > tool.clientWidth).length,
      grabber: touchSize(sample.area.querySelector('.grabber')),
      padKeys: [...sample.pad.querySelectorAll('.nudge-key')].map(touchSize),
      nextButton: size(sample.next),
    };
  }

  // Sizes and behavior of the controls: status, ruler, slider, buttons, chips, segments.
  function measureControls(host) {
    const status = CF.buildStatus('probeStatus');
    const warning = { kind: 'warn', text: 'Low confidence (42%). Check the corners.' };
    CF.updateStatus(status, { ...warning, actionLabel: 'Cancel' });
    const ruler = CF.buildRuler({ id: 'probeFine', min: -45, max: 45, step: 0.1, label: 'Angle' });
    const slider = CF.buildSlider({ id: 'probeSlider', min: 0, max: 100, step: 1, label: 'x' });
    CF.updateSlider(slider, 60);
    const share = { label: 'Share', icon: 'share', look: 'main', size: 'tall' };
    const main = CF.buildActionButton(share);
    const chips = ['Free', 'Original', '1:1', '3:4', '4:5', '2:3', '9:16', '5:7 card']
      .map(label => CF.buildChip({ label, value: label }));
    CF.updateChip(chips[6], { isOn: true });
    const chipRow = CF.buildChipRow(null, ...chips);
    const picks = CF.buildSegmented({
      label: 'Pick',
      options: [{ value: 'white', label: 'Pick white' }, { value: 'black', label: 'Pick black' }],
    });
    CF.updateSegmented(picks, 'white');
    const area = CF.makeEl('div', { class: 'control-area' },
      status, CF.buildControlRow(null, ruler), CF.buildControlRow(null, slider),
      CF.buildControlRow(null, main), chipRow, CF.buildControlRow(null, picks));
    area.style.height = 'auto';
    host.append(area);
    CF.revealSelectedChip(chipRow);
    // A drag of two ticks to the right lowers the value by two units and fires input, change.
    const events = [];
    const input = ruler.querySelector('input');
    input.addEventListener('input', () => events.push('input'));
    input.addEventListener('change', () => events.push('change'));
    const rulerRect = rectOf(ruler);
    const fire = (type, x) => ruler.dispatchEvent(new PointerEvent(type, {
      bubbles: true,
      pointerId: 1,
      clientX: x,
      clientY: rulerRect.top + 22,
    }));
    ruler.setPointerCapture = () => {};
    fire('pointerdown', rulerRect.left + 100);
    fire('pointermove', rulerRect.left + 122);
    fire('pointerup', rulerRect.left + 122);
    const chipRect = rectOf(chips[6]);
    return {
      status: size(status),
      statusButton: size(status.querySelector('.action-button')),
      statusButtonTouch: touchSize(status.querySelector('.action-button')),
      ruler: size(ruler),
      rulerPointer: size(ruler.querySelector('.ruler-pointer')),
      rulerValueAfterDrag: Number(input.value),
      rulerEvents: events.join(','),
      slider: size(slider),
      sliderFillPx: round(rectOf(slider.querySelector('.slider-fill')).width),
      tallButton: size(main),
      chip: size(chips[0]),
      chipRowScrollsPx: chipRow.scrollWidth - chipRow.clientWidth,
      selectedChipVisible: chipRect.left >= rectOf(chipRow).left - 1
        && chipRect.right <= rectOf(chipRow).right + 1,
      segmented: size(picks),
      segments: [...picks.querySelectorAll('.segment')].map(size),
      selectedSegment: picks.querySelector('[aria-pressed="true"]').dataset.value,
    };
  }

  // The layers: a sheet with rows, an alert card, a toast and a progress line.
  function measureLayers(host) {
    const tips = CF.buildTipsRow('probeTips', ['One tip.', 'Another tip.']);
    const sheet = CF.buildSheet({ id: 'probeSheet', title: 'Rotate options' },
      CF.buildSheetList(
        CF.buildSwitchRow({ id: 'probeGrid', icon: 'grid', label: 'Grid' }),
        CF.buildSheetRow({ icon: 'rotateLeft', label: 'Reset rotation', isDanger: true }),
      ),
      tips);
    const card = CF.buildAlertCard('probeAlert');
    const toastEl = CF.buildToast('probeToast');
    CF.updateToast(toastEl, { text: 'The saved photo is gone.', kind: 'warn', isShown: true });
    const stageLike = CF.makeEl('div', { class: 'probe-stage' }, toastEl);
    stageLike.style.cssText = 'position:relative;height:120px';
    host.append(stageLike, sheet, card);
    let closedCount = 0;
    sheet.addEventListener('sheetclose', () => closedCount++);
    CF.openSheet(sheet);
    CF.updateSheet(sheet, { progress: 0.5 });
    const panel = sheet.querySelector('.sheet');
    const rows = [...sheet.querySelectorAll('.sheet-row')];
    const sheetSizes = {
      sheet: size(panel),
      sheetBottomGapPx: round(window.innerHeight - rectOf(panel).bottom),
      rows: rows.map(size),
      closeTouch: touchSize(sheet.querySelector('.sheet-close')),
      switchSize: size(sheet.querySelector('.switch')),
      progressLine: size(sheet.querySelector('.progress-line')),
    };
    tips.querySelector('button').click();
    const areTipsOpen = !tips.querySelector('.sheet-tips').hidden;
    sheet.querySelector('.sheet-scrim').click();
    let answer = 'none';
    const choices = [
      { label: 'Yes', isMain: true, action: () => { answer = 'yes'; } },
      { label: 'No', action: () => { answer = 'no'; } },
    ];
    const question = { title: 'Upscale to 2000 px?', text: 'The crop is 994 × 994 px.', choices };
    CF.showAlert(card, question);
    const cardSizes = {
      card: size(card.querySelector('.alert-card')),
      choices: [...card.querySelectorAll('.alert-choices .action-button')].map(size),
      cancel: size(card.querySelector('.alert-cancel')),
      mainChoice: card.querySelector('.is-main .action-label').textContent,
    };
    card.querySelector('.is-main').click();
    const answerAfterYes = answer;
    answer = 'none';
    CF.showAlert(card, question);
    card.click();
    return {
      ...sheetSizes,
      areTipsOpen,
      sheetClosedByScrim: sheet.hidden && closedCount === 1,
      ...cardSizes,
      answerAfterYes,
      answerAfterOutsideTap: answer,
      cardHiddenAfter: card.hidden,
      toast: size(toastEl),
      toastInsetPx: round(rectOf(toastEl).left - rectOf(stageLike).left),
    };
  }

  // Builds every part, measures it and removes it again.
  async function measureParts() {
    const host = makeHost();
    try {
      const shell = measureShellParts(host);
      host.replaceChildren();
      const controls = measureControls(host);
      host.replaceChildren();
      const layers = measureLayers(host);
      const pointer = CF.buildRuler({ id: 'probeMotion', min: -5, max: 5, step: 1, label: 'x' });
      host.append(pointer);
      const motion = getComputedStyle(pointer.querySelector('.ruler-pointer')).transitionProperty;
      return { shell, controls, layers, pointerTransition: motion };
    } finally {
      host.remove();
    }
  }

  window.__layoutProbe = { measureSteps, measureParts };
})();
