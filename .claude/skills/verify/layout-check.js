// Measures the layout in a headless browser at 390×844, 375×667 and 1280×800: the photo and
// control area on every step, and each of the fifteen parts against the plan's sizes.
//   node .claude/skills/verify/layout-check.js        (CHROME=<path> picks the browser)
// Exit code 0 = every check passed, 1 = a check failed, 2 = it could not run.
// The page-side measuring is in layout-probe.js.
'use strict';
const fs = require('fs');
const path = require('path');
const { serveFolder, openBrowser, reportChecks } = require('./browser.js');

const root = path.resolve(__dirname, '../../..');
const probe = fs.readFileSync(path.join(__dirname, 'layout-probe.js'), 'utf8');
const SIZES = [[390, 844], [375, 667], [1280, 800]];
// A touch target's least size, in CSS px.
const MIN_TARGET_PX = 44;
// The old layout's phone control area (until phase 2 replaces the shell) and the new one's.
const OLD_AREA_PX = 192;
const NEW_AREA_PX = 200;

const isTarget = touch => touch.width >= MIN_TARGET_PX && touch.height >= MIN_TARGET_PX;
const allEqual = values => values.every(value => value === values[0]);
const list = values => values.join(', ');

// Checks of the page on every step. The old layout is measured as it stands; `isNewShell` (a
// .control-area is mounted) switches to the plan's numbers.
function stepChecks(label, steps, isPhone) {
  const heights = steps.map(step => step.photoHeight);
  const areas = steps.map(step => step.areaHeight);
  const overflowing = steps.filter(step => step.areaOverflowPx > 0);
  const over = steps.filter(step => step.overPhoto.length);
  const checks = [
    [`${label}: no sideways scroll on any step`,
      steps.every(step => step.pageOverflowPx <= 0), ''],
    [`${label}: nothing over the photo`,
      !over.length, over.map(step => `${step.step}: ${list(step.overPhoto)}`).join('; ')],
  ];
  if (!isPhone) return checks;
  return checks.concat([
    [`${label}: photo the same height on every step`, allEqual(heights), `${list(heights)} px`],
    [`${label}: control area the same height on every step`,
      allEqual(areas) && [OLD_AREA_PX, NEW_AREA_PX].includes(areas[0]), `${list(areas)} px`],
    [`${label}: control area doesn't overflow`,
      !overflowing.length,
      overflowing.map(step => `${step.step} +${step.areaOverflowPx} px`).join('; ')],
    [`${label}: no clipped action-bar label`,
      steps.every(step => !step.clippedButtons), ''],
  ]);
}

// Checks of the shell parts against the plan's component inventory (section 5).
function shellChecks(label, shell, isPhone) {
  const toolWidths = shell.tools.map(tool => tool.width);
  const checks = [
    [`${label}: top bar is 48 px tall`, shell.topBar.height === 48, `${shell.topBar.height}`],
    [`${label}: top bar's icon buttons are 44 × 44 targets`,
      shell.iconButtons.every(isTarget), JSON.stringify(shell.iconButtons[0])],
    [`${label}: Front | Back is 112 × 36 with 44 px tall halves`,
      shell.sideSwitch.width === 112 && shell.sideSwitch.height === 36
        && shell.sideHalves.every(half => half.height >= MIN_TARGET_PX && half.width >= 54),
      JSON.stringify(shell.sideHalves[0])],
    [`${label}: the fullest top bar (paired and zoomed) fits`,
      shell.topBarUsedPx <= shell.topBar.width,
      `${shell.topBarUsedPx} of ${shell.topBar.width} px`],
    [`${label}: control area is 200 px with nothing overflowing`,
      shell.area.height === 200 && shell.areaSparePx >= 0,
      `${shell.area.height} px, ${shell.areaSparePx} px spare under the tool row`],
    [`${label}: rows are 44 and 70 px`,
      shell.labelRow.height === 44 && shell.toolRow.height === 70, ''],
    [`${label}: five tools are 70 px tall targets with whole labels`,
      shell.tools.every(tool => tool.height === 70 && tool.width >= MIN_TARGET_PX)
        && !shell.toolLabelsClipped,
      `${toolWidths[0]} px wide each`],
    [`${label}: grabber is a 44 px tall target`,
      shell.grabber.height >= MIN_TARGET_PX && shell.grabber.width >= MIN_TARGET_PX,
      JSON.stringify(shell.grabber)],
    [`${label}: nudge keys are 52 × 44`,
      shell.padKeys.every(key => key.width === 52 && key.height === 44), ''],
  ];
  if (!isPhone) return checks;
  const tabWidths = shell.tabs.map(tab => tab.width);
  return checks.concat([
    [`${label}: six tabs fit, each a 44 px target`,
      shell.tabsOverflowPx <= 0 && shell.tabs.every(isTarget),
      `widths ${list(tabWidths)} px; label ${shell.tabFontPx} px`],
    [`${label}: tabs are 52 px tall, the mark an 8 px dot`,
      shell.tabs.every(tab => tab.height === 52) && shell.tabMark.width === 8, ''],
  ]);
}

// Checks of the controls and the layers.
function partChecks(label, { controls, layers }, isPhone) {
  const checks = [
    [`${label}: status takes a 44 px row; its 36 px button is a 44 px target`,
      controls.status.height === 44 && controls.statusButton.height === 36
        && controls.statusButtonTouch.height >= MIN_TARGET_PX,
      JSON.stringify(controls.statusButtonTouch)],
    [`${label}: ruler is 44 px tall with a 6 × 28 pointer`,
      controls.ruler.height === 44 && controls.rulerPointer.width === 6
        && controls.rulerPointer.height === 28, ''],
    [`${label}: a 22 px drag on the ruler moves the value two units`,
      controls.rulerValueAfterDrag === -2 && controls.rulerEvents === 'input,change',
      `value ${controls.rulerValueAfterDrag}; events ${controls.rulerEvents}`],
    [`${label}: slider is 44 px tall and filled to its thumb`,
      controls.slider.height === 44 && controls.sliderFillPx > 0,
      `fill ${controls.sliderFillPx} of ${controls.slider.width} px at 60%`],
    [`${label}: buttons are 44 px (48 in a save row)`,
      controls.tallButton.height === 48 && controls.chip.height === 44, ''],
    [`${label}: segments are 44 px tall and at least 44 px wide`,
      controls.segmented.height === 44
        && controls.segments.every(segment => segment.width >= MIN_TARGET_PX)
        && controls.selectedSegment === 'white', ''],
    [`${label}: sheet is at most 470 px, at the bottom, rows at least 46 px`,
      layers.sheet.height <= 470 && layers.sheetBottomGapPx === 0
        && layers.rows.every(row => row.height >= 46),
      `${layers.sheet.height} px tall`],
    [`${label}: sheet's close button is a 44 px target; its progress line is 3 px`,
      isTarget(layers.closeTouch) && layers.progressLine.height === 3, ''],
    [`${label}: Tips opens in place; a tap outside closes the sheet`,
      layers.areTipsOpen && layers.sheetClosedByScrim, ''],
    [`${label}: alert card is 300 px wide, choices 48 px, Cancel 46 px`,
      layers.card.width === 300 && layers.choices.every(choice => choice.height === 48)
        && layers.cancel.height === 46 && layers.mainChoice === 'Yes', ''],
    [`${label}: a choice runs its action; a tap outside runs none`,
      layers.answerAfterYes === 'yes' && layers.answerAfterOutsideTap === 'none'
        && layers.cardHiddenAfter, ''],
    [`${label}: toast is at least 44 px tall, inset 16 px`,
      layers.toast.height >= MIN_TARGET_PX && layers.toastInsetPx === 16, ''],
  ];
  const chipDetail = `scrolls ${controls.chipRowScrollsPx} px`;
  if (isPhone) {
    checks.push([`${label}: chips are one sideways-scrolling row resting on the selected one`,
      controls.chipRowScrollsPx > 0 && controls.selectedChipVisible, chipDetail]);
  } else {
    checks.push([`${label}: chips wrap`, controls.chipRowScrollsPx === 0, chipDetail]);
  }
  return checks;
}

async function main() {
  const server = await serveFolder(root);
  const browser = await openBrowser();
  const checks = [];
  try {
    for (const [width, height] of SIZES) {
      const label = `${width}×${height}`;
      const isPhone = width <= 760;
      await browser.setViewport(width, height);
      await browser.navigate(`http://127.0.0.1:${server.port}/index.html`);
      await browser.evaluate(probe);
      const steps = await browser.evaluate('window.__layoutProbe.measureSteps()');
      checks.push(...stepChecks(label, steps, isPhone));
      const parts = await browser.evaluate('window.__layoutProbe.measureParts()');
      checks.push(...shellChecks(label, parts.shell, isPhone));
      checks.push(...partChecks(label, parts, isPhone));
      console.log(`${label}: photo ${steps[0].photoHeight} px, control area `
        + `${steps[0].areaHeight} px, tools ${parts.shell.tools[0].width} px wide`);
      await browser.evaluate('window.__straightener.Session.clear()');
    }
    await browser.send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
    });
    const reduced = await browser.evaluate('window.__layoutProbe.measureParts()');
    checks.push(['Reduced motion: only opacity may transition',
      reduced.pointerTransition === 'opacity', reduced.pointerTransition]);
    checks.push(['No console errors (CSP included)',
      !browser.errors.length, browser.errors.slice(0, 5).join(' | ')]);
  } finally {
    await browser.close();
    server.close();
  }
  return reportChecks(checks);
}

main()
  .catch(error => {
    console.error(error);
    return 2;
  })
  .then(code => process.exit(code));
