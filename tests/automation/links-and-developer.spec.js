// The links and developer cases (tests/catalog/links-and-developer.md): settings from a link,
// the console warning for a rejected one, ?debug, ?selftest, the detection tuning panel and its
// buttons and report, and the test hook.
// Each test drives the app as a person would, through hand.tap and hand.drag (a finger on the
// phone targets, the mouse on the wide ones), and reads the app's state only to check a result.
// What a case has a person type into the Console, the test runs in the page.
'use strict';
const { test, expect } = require('./support/case.js');
const {
  openApp,
  goToStep,
  editState,
  handFor,
  openOptions,
  cornerOnPage,
  waitForDetection,
  waitForEditsKept,
} = require('./support/app.js');
const { toastNow } = require('./support/start-and-session.js');
const { installShareStandIn, selectedChoices } = require('./support/export.js');
const {
  PHOTO,
  startWith,
  openWith,
  dropPhoto,
  stepShown,
  watchConsole,
  linesStarting,
} = require('./support/security-layout-speed.js');

// The console warning for settings a link sets that the app ignores, up to the names.
const IGNORED_WARNING = '[card-finisher] URL settings ignored (unknown, not a number / on-off '
  + 'setting, or outside its safe range):';
// The start of the console line ?debug writes after each detection.
const DETECT_LOG = '[card-finisher] detect';
// The self-tests' console groups and the start of their message.
const MAIN_TABLE = '[card-finisher] self-tests (main thread)';
const WORKER_TABLE = '[card-finisher] self-tests (Web Worker)';
const SELF_TESTS = 'Self-tests: main ';
// The tuning panel's messages after Copy CONFIG.
const COPIED = 'CONFIG copied.';
// The blocked-clipboard message, in ruling R60's words.
const CLIPBOARD_BLOCKED = 'Clipboard blocked. CONFIG printed to the console.';
// How long a case waits for a message or a change, in ms.
const WAIT_MS = 5000;
// How long the panel waits after the last change to a field before detecting again, in ms
// (REDETECT_DELAY_MS in js/app/debug-panel.js), and how long a case waits past it ("wait a
// second").
const REDETECT_DELAY_MS = 350;
const PAST_REDETECT_MS = REDETECT_DELAY_MS + 650;
// How long DEV-05.2 waits for self-tests that must not run ("wait a second"), in ms.
const SELFTEST_WAIT_MS = 1000;
// The tuning panel's largest height on the phone, as a fraction of the window's: with a photo
// open, and on the start screen.
const PHONE_PANEL_MAX_FRACTION = 0.4;
const PHONE_START_PANEL_MAX_FRACTION = 0.25;
// The wide layout's side panel width, the panel's distance from the window's top, and the gap
// the tuning panel keeps from the window's or the side panel's edge, in CSS px.
const SIDE_PANEL_PX = 380;
const PANEL_TOP_PX = 64;
const PANEL_GAP_PX = 8;
// How far a corner is dragged by hand, in CSS px; how far it must move to count as moved off
// the card, and how close it must stay to count as not moved, in photo px.
const DRAG_PX = 40;
const MOVED_MIN_PX = 20;
const SAME_CORNER_PX = 0.5;
// The undo history's length as shipped.
const HISTORY_LIMIT = 50;
// The calls the test hook offers, as the catalog's DEV-10 lists them.
const HOOK_CALLS = [
  'openFile',
  'runDetect',
  'renderFull',
  'setTab',
  'commit',
  'undo',
  'redo',
  'stateChanged',
];
const HOOK_PARTS = ['EngineWorker', 'Detector', 'draw', 'Session', 'resumeSession', 'shareFile',
  'Exporter'];

// The number of times detection has run for the open photo.
function detectionRuns(page) {
  return page.evaluate(() => window.__straightener.app.detection.running);
}

// Waits until a detection run after the first `runsBefore` has started and finished.
async function waitForNextDetection(page, runsBefore) {
  await page.waitForFunction(runs => window.__straightener.app.detection.running > runs,
    runsBefore, { timeout: WAIT_MS });
  await waitForDetection(page);
}

// True when the lines detection found are drawn: the Debug overlay is on, and the last search
// left it lines and the data for the rest of its drawing.
function areDetectedLinesDrawn(page) {
  return page.evaluate(() => {
    const app = window.__straightener.app;
    const hasDebug = !!app.detection.last && !!app.detection.last.debug;
    return app.debugOverlay && hasDebug && app.detection.snapLines.length > 0;
  });
}

// The tuning panel's field for a detection setting.
const panelField = (page, key) => page.locator(`#debugPanel input[data-key="${key}"]`);

// Selects the value in a tuning panel field and types `text` over it, key by key.
async function typeInField(page, key, text) {
  const field = panelField(page, key);
  await field.selectText();
  await field.pressSequentially(text);
}

// The detection settings that are a number or on/off, in the order js/config.js has them.
function tunableKeys(page) {
  return page.evaluate(() => Object.keys(CONFIG.detect)
    .filter(key => ['number', 'boolean'].includes(typeof CONFIG.detect[key])));
}

// Waits until the toast shows `text`, or WAIT_MS has passed; the case's verdict then reads it.
function waitForToastText(page, text) {
  return page.waitForFunction(wanted => {
    const toast = document.getElementById('toast');
    return !!toast && toast.querySelector('.toast-text').textContent === wanted;
  }, text, { timeout: WAIT_MS }).catch(() => {});
}

/* ---------------- DEV-01 A link can change a setting ---------------- */

test('DEV-01.1 A link sets a number setting [phone]', async ({ page, check }, testInfo) => {
  const hand = await startWith(page, testInfo, { address: 'index.html?export.longEdge=1080' });
  await goToStep(page, 'export', hand);
  await check('1080 is the selected Size, where the shipped default is 2000', async () => {
    expect(await selectedChoices(page, 'exportSize')).toEqual(['1080']);
  });
});

/* ---------------- DEV-02 On/off settings and the undo limit from a link ---------------- */

test('DEV-02.1 A link turns the Share button off, with 0 or false only [phone]', async ({
  page,
  check,
}, testInfo) => {
  await installShareStandIn(page, 'share');
  const messages = watchConsole(page);
  await openApp(page, 'index.html?export.share=0');
  const hand = handFor(page, testInfo);
  await openWith(page, hand, page.locator('#btnOpenEmpty'), PHOTO);
  await check('the photo opens on the Perspective step', async () => {
    expect(await stepShown(page)).toBe('perspective');
  });
  await goToStep(page, 'export', hand);
  await check('Download shows; Share does not', async () => {
    await expect(page.locator('#btnDownload')).toBeVisible();
    await expect(page.locator('#btnShare')).toBeHidden();
  });
  const before = messages.length;
  await openApp(page, 'index.html?export.share=no');
  await check(`the Console warns "${IGNORED_WARNING} export.share"`, async () => {
    const warnings = linesStarting(messages.slice(before), IGNORED_WARNING);
    expect(warnings.map(message => message.text)).toEqual([`${IGNORED_WARNING} export.share`]);
  });
  await openWith(page, hand, page.locator('#btnOpenEmpty'), PHOTO);
  await check('the photo opens on the Perspective step', async () => {
    expect(await stepShown(page)).toBe('perspective');
  });
  await goToStep(page, 'export', hand);
  await check('Share shows beside Download: "no" did not turn it off', async () => {
    await expect(page.locator('#btnShare')).toBeVisible();
    await expect(page.locator('#btnDownload')).toBeVisible();
  });
});

test('DEV-02.2 A link sets the undo history\'s length [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startWith(page, testInfo, { address: 'index.html?historyLimit=2' });
  await goToStep(page, 'rotate', hand);
  for (let turn = 0; turn < 3; turn++) await hand.tap(page.locator('#toolRotateRight'));
  await check('the photo has turned three quarters right', async () => {
    expect((await editState(page)).rotation.quarter).toBe(3);
  });
  await hand.tap(page.locator('#btnUndo'));
  await check('the photo is turned two quarters: upside down', async () => {
    expect((await editState(page)).rotation.quarter).toBe(2);
  });
  await hand.tap(page.locator('#btnUndo'));
  await check('the photo is turned one quarter right, and Undo is greyed out: only two steps '
    + 'were kept', async () => {
    expect((await editState(page)).rotation.quarter).toBe(1);
    await expect(page.locator('#btnUndo')).toBeDisabled();
  });
});

test('DEV-02.3 An undo length outside 1 to 200 is ignored [phone]', async ({
  page,
  check,
}) => {
  const messages = watchConsole(page);
  const warning = `${IGNORED_WARNING} historyLimit`;
  await openApp(page, 'index.html?historyLimit=0');
  await check(`the Console warns "${warning}"`, async () => {
    const warnings = linesStarting(messages, IGNORED_WARNING);
    expect(warnings.map(message => message.text)).toEqual([warning]);
  });
  await openApp(page, 'index.html?historyLimit=201');
  await check('the same warning again', async () => {
    const warnings = linesStarting(messages, IGNORED_WARNING);
    expect(warnings.map(message => message.text)).toEqual([warning, warning]);
  });
  await check(`CONFIG.historyLimit answers ${HISTORY_LIMIT}, the shipped length`, async () => {
    expect(await page.evaluate(() => CONFIG.historyLimit)).toBe(HISTORY_LIMIT);
  });
});

/* ---------------- DEV-03 A rejected link setting is reported in the console only -------- */

test('DEV-03.1 Rejected link settings are named in the console, and nothing shows [phone]',
  async ({ page, check }) => {
    const messages = watchConsole(page);
    await openApp(page, 'index.html?nope=1&crop.presets=x&historyLimit=500&detect.cannyHigh=90');
    await check(`one warning, in the warning color, reads "${IGNORED_WARNING} nope, `
      + 'crop.presets, historyLimit"', async () => {
      const warnings = linesStarting(messages, IGNORED_WARNING);
      expect(warnings.map(message => message.text))
        .toEqual([`${IGNORED_WARNING} nope, crop.presets, historyLimit`]);
      expect(warnings[0].type).toBe('warning');
    });
    await check('the start screen, with no message about the link', async () => {
      await expect(page.locator('#btnOpenEmpty')).toBeVisible();
      expect((await toastNow(page)).isShown).toBe(false);
    });
    await check('CONFIG.detect.cannyHigh answers 90: the good setting was applied', async () => {
      expect(await page.evaluate(() => CONFIG.detect.cannyHigh)).toBe(90);
    });
  });

/* ---------------- DEV-04 ?debug turns on the developer view ---------------- */

test('DEV-04.1 ?debug opens the tuning panel, turns Debug overlay on and logs each detection '
  + '[phone]', async ({ page, check }, testInfo) => {
  const messages = watchConsole(page);
  await openApp(page, 'index.html?debug');
  await check('the Detection tuning panel is open', async () => {
    await expect(page.locator('#debugPanel')).toBeVisible();
    await expect(page.locator('#debugPanel')).toContainText('Detection tuning');
  });
  const hand = handFor(page, testInfo);
  await dropPhoto(page, PHOTO);
  await check(`the photo opens, and the Console logs a line that starts "${DETECT_LOG}"`,
    async () => {
      expect(await stepShown(page)).toBe('perspective');
      expect(linesStarting(messages, DETECT_LOG).length).toBeGreaterThan(0);
    });
  await openOptions(page, hand, 'perspective');
  await check('Perspective options rise, with Debug overlay on', async () => {
    await expect(page.locator('#perspectiveSheet label:has(#debugOverlay)')).toBeVisible();
    await expect(page.locator('#debugOverlay')).toBeChecked();
  });
});

test('DEV-04.2 ?debug=0 and ?debug=false leave the developer view off [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = handFor(page, testInfo);
  for (const value of ['0', 'false']) {
    const messages = watchConsole(page);
    await openApp(page, `index.html?debug=${value}`);
    await check(`with debug=${value}: the start screen, with no tuning panel`, async () => {
      await expect(page.locator('#btnOpenEmpty')).toBeVisible();
      await expect(page.locator('#debugPanel')).toBeHidden();
    });
    await openWith(page, hand, page.locator('#btnOpenEmpty'), PHOTO);
    await check(`with debug=${value}: the photo opens; the Console has no line that starts `
      + `"${DETECT_LOG}"`, async () => {
      expect(await stepShown(page)).toBe('perspective');
      expect(linesStarting(messages, DETECT_LOG)).toEqual([]);
    });
    await openOptions(page, hand, 'perspective');
    await check(`with debug=${value}: Perspective options rise, with Debug overlay off`,
      async () => {
        await expect(page.locator('#perspectiveSheet label:has(#debugOverlay)')).toBeVisible();
        await expect(page.locator('#debugOverlay')).not.toBeChecked();
      });
  }
});

/* ---------------- DEV-05 ?selftest runs the engine self-tests ---------------- */

test('DEV-05.1 ?selftest runs the self-tests on the page and in the worker [phone]', async ({
  page,
  check,
}) => {
  const messages = watchConsole(page);
  await openApp(page, 'index.html?selftest');
  await page.waitForFunction(() => !!window.__selftest);
  const results = await page.evaluate(() => {
    const count = run => `${run.results.filter(result => result.pass).length}`
      + `/${run.results.length}`;
    return { main: count(window.__selftest.main), worker: count(window.__selftest.worker) };
  });
  const message = `${SELF_TESTS}${results.main}, worker ${results.worker}`;
  await check(`a message reads "${message}", the same N four times, not in red`, async () => {
    const shown = await toastNow(page);
    expect(shown.text).toBe(message);
    expect(shown.kind).toBe('');
    const [passed, total] = results.main.split('/');
    expect(passed).toBe(total);
    expect(results.worker).toBe(results.main);
  });
  await check('the Console holds both result groups', async () => {
    const texts = messages.map(entry => entry.text);
    expect(texts).toContain(MAIN_TABLE);
    expect(texts).toContain(WORKER_TABLE);
  });
});

test('DEV-05.2 ?selftest=0 runs no self-tests [phone]', async ({ page, check }) => {
  const messages = watchConsole(page);
  await openApp(page, 'index.html?selftest=0');
  await page.waitForTimeout(SELFTEST_WAIT_MS);
  const ran = await page.evaluate(() => !!window.__selftest);
  const shown = await toastNow(page);
  await check('no "Self-tests" message shows, and the Console holds no self-test tables',
    async () => {
      expect(shown.isShown && shown.text.startsWith(SELF_TESTS)).toBe(false);
      const texts = messages.map(entry => entry.text);
      expect(texts).not.toContain(MAIN_TABLE);
      expect(texts).not.toContain(WORKER_TABLE);
      expect(ran).toBe(false);
    });
});

/* ---------------- DEV-06 The detection tuning panel ---------------- */

test('DEV-06.1 The panel has a field per detection setting, and a change detects again '
  + '[phone]', async ({ page, check }, testInfo) => {
  const messages = watchConsole(page);
  await startWith(page, testInfo, { address: 'index.html?debug=1' });
  await waitForDetection(page);
  const keys = await tunableKeys(page);
  await check('one field for each number and on/off setting of detection, in js/config.js\'s '
    + 'order: workingSize first, refineInlierPx last', async () => {
    const fields = await page.locator('#debugPanel input[data-key]')
      .evaluateAll(inputs => inputs.map(input => input.dataset.key));
    expect(fields).toEqual(keys);
    expect([fields[0], fields[fields.length - 1]]).toEqual(['workingSize', 'refineInlierPx']);
  });
  const logsBefore = linesStarting(messages, DETECT_LOG).length;
  const runsBefore = await detectionRuns(page);
  await typeInField(page, 'cannyHigh', '70');
  await check('the field reads 70', async () => {
    await expect(panelField(page, 'cannyHigh')).toHaveValue('70');
  });
  await check('CONFIG.detect.cannyHigh answers 70: the setting took the field\'s value',
    async () => {
      expect(await page.evaluate(() => CONFIG.detect.cannyHigh)).toBe(70);
    });
  await waitForNextDetection(page, runsBefore);
  await check(`a new line that starts "${DETECT_LOG}" shows after the typing: detection ran `
    + 'again', async () => {
    await expect.poll(() => linesStarting(messages, DETECT_LOG).length, { timeout: WAIT_MS })
      .toBeGreaterThan(logsBefore);
  });
});

test('DEV-06.2 Where the panel sits [both] [webkit]', async ({ page, check }, testInfo) => {
  const isPhone = testInfo.project.name.includes('phone');
  await openApp(page, 'index.html?debug=1');
  const startBoxes = await page.evaluate(() => {
    const open = document.getElementById('btnOpenEmpty').getBoundingClientRect();
    const onTop = document.elementFromPoint(open.left + open.width / 2, open.top + open.height / 2);
    return {
      panel: document.getElementById('debugPanel').getBoundingClientRect().toJSON(),
      open: open.toJSON(),
      side: document.getElementById('panel').getBoundingClientRect().toJSON(),
      isOpenCovered: !!onTop && !!onTop.closest('#debugPanel'),
      width: innerWidth,
      height: innerHeight,
    };
  });
  await check('the panel shows, and no part of it is over Open photo. On a phone, the window\'s '
    + 'width less 8 px a side, 8 px above the window\'s bottom edge, at most 25% of the height; '
    + 'on a wide screen, 64 px from the top and 8 px from the window\'s right edge, over the '
    + 'empty side panel', () => {
    const { panel, open, side, width, height } = startBoxes;
    expect(panel.height).toBeGreaterThan(0);
    expect(overlaps(panel, open)).toBe(false);
    expect(startBoxes.isOpenCovered).toBe(false);
    if (isPhone) {
      expect(panel.left).toBe(PANEL_GAP_PX);
      expect(panel.right).toBe(width - PANEL_GAP_PX);
      expect(height - panel.bottom).toBe(PANEL_GAP_PX);
      expect(panel.height).toBeLessThanOrEqual(height * PHONE_START_PANEL_MAX_FRACTION);
    } else {
      expect(panel.top).toBe(PANEL_TOP_PX);
      expect(width - panel.right).toBe(PANEL_GAP_PX);
      expect(side.width).toBe(SIDE_PANEL_PX);
      expect(panel.left).toBeGreaterThanOrEqual(side.left);
    }
  });
  await dropPhoto(page, PHOTO);
  const boxes = await page.evaluate(() => {
    const box = selector => document.querySelector(selector).getBoundingClientRect().toJSON();
    return {
      panel: box('#debugPanel'),
      controls: box('section.active .control-area'),
      side: box('#panel'),
      width: innerWidth,
      height: innerHeight,
    };
  });
  await check('on a phone, the window\'s width less 8 px a side, 8 px above the controls, at '
    + 'most 40% of the height; on a wide screen, 64 px from the top and 8 px left of the 380 px '
    + 'side panel', async () => {
    if (isPhone) {
      expect(boxes.panel.left).toBe(PANEL_GAP_PX);
      expect(boxes.panel.right).toBe(boxes.width - PANEL_GAP_PX);
      expect(boxes.controls.top - boxes.panel.bottom).toBe(PANEL_GAP_PX);
      expect(boxes.panel.height).toBeLessThanOrEqual(boxes.height * PHONE_PANEL_MAX_FRACTION);
    } else {
      expect(boxes.side.width).toBe(SIDE_PANEL_PX);
      expect(boxes.side.left - boxes.panel.right).toBe(PANEL_GAP_PX);
      expect(boxes.panel.top).toBe(PANEL_TOP_PX);
    }
  });
});

// True when two boxes ({ left, top, right, bottom }, CSS px) share any area.
function overlaps(first, second) {
  const isApartSideways = first.right <= second.left || second.right <= first.left;
  const isApartUpDown = first.bottom <= second.top || second.bottom <= first.top;
  return !isApartSideways && !isApartUpDown;
}

test('DEV-06.3 A field takes a value a link could not [phone]', async ({
  page,
  check,
}, testInfo) => {
  await startWith(page, testInfo, { address: 'index.html?debug=1' });
  await typeInField(page, 'workingSize', '2500');
  await check('the field reads 2500', async () => {
    await expect(panelField(page, 'workingSize')).toHaveValue('2500');
  });
  await check('CONFIG.detect.workingSize answers 2500, over the 2000 a link is held to',
    async () => {
      expect(await page.evaluate(() => CONFIG.detect.workingSize)).toBe(2500);
    });
});

test('DEV-06.4 Detection runs once, 0.35 s after the last change [phone]', async ({
  page,
  check,
}, testInfo) => {
  await startWith(page, testInfo, { address: 'index.html?debug=1' });
  await waitForDetection(page);
  const runsBefore = await detectionRuns(page);
  await typeInField(page, 'cannyHigh', '70');
  const atOnce = {
    setting: await page.evaluate(() => CONFIG.detect.cannyHigh),
    runs: await detectionRuns(page),
  };
  await check('the setting is 70 at once, and detection has not run again yet', async () => {
    expect(atOnce).toEqual({ setting: 70, runs: runsBefore });
  });
  await page.waitForTimeout(PAST_REDETECT_MS);
  await check('detection has run exactly once more', async () => {
    expect(await detectionRuns(page)).toBe(runsBefore + 1);
  });
});

test('DEV-06.5 On a phone, the panel leaves the Resume box clear [phone]', async ({
  page,
  check,
}, testInfo) => {
  await startWith(page, testInfo);
  await waitForEditsKept(page);
  await openApp(page, 'index.html?debug=1');
  await page.locator('#resume').waitFor({ state: 'visible' });
  await check(`the start screen offers "Resume ${PHOTO}?" with Resume and Start fresh, and the `
    + 'Detection tuning panel shows', async () => {
    await expect(page.locator('#resume .resume-name')).toHaveText(`Resume ${PHOTO}?`);
    await expect(page.locator('#btnResume')).toBeVisible();
    await expect(page.locator('#btnFresh')).toBeVisible();
    await expect(page.locator('#debugPanel')).toBeVisible();
  });
  const boxes = await page.evaluate(() => {
    const box = id => document.getElementById(id).getBoundingClientRect().toJSON();
    return { panel: box('debugPanel'), resume: box('resume'), open: box('btnOpenEmpty') };
  });
  await check('no part of the tuning panel is over the Resume box or Open photo', () => {
    expect(boxes.panel.height).toBeGreaterThan(0);
    expect(overlaps(boxes.panel, boxes.resume), 'the Resume box is covered').toBe(false);
    expect(overlaps(boxes.panel, boxes.open), 'Open photo is covered').toBe(false);
  });
});

/* ---------------- DEV-07 The tuning panel's buttons ---------------- */

test('DEV-07.1 Re-detect runs detection, and Close tuning closes the panel [phone]', async ({
  page,
  check,
}, testInfo) => {
  const messages = watchConsole(page);
  const hand = await startWith(page, testInfo, { address: 'index.html?debug=1' });
  await waitForDetection(page);
  const runsBefore = await detectionRuns(page);
  const logsBefore = linesStarting(messages, DETECT_LOG).length;
  await hand.tap(page.locator('#debugRun'));
  await waitForNextDetection(page, runsBefore);
  // A second line, were there one, would come with a second run; wait as long as one waits.
  await page.waitForTimeout(REDETECT_DELAY_MS);
  await check(`one new line that starts "${DETECT_LOG}" shows in the Console: detection ran once `
    + 'more', async () => {
    await expect.poll(() => linesStarting(messages, DETECT_LOG).length, { timeout: WAIT_MS })
      .toBe(logsBefore + 1);
    expect(await detectionRuns(page)).toBe(runsBefore + 1);
  });
  await hand.tap(page.locator('#debugClose'));
  await check('the panel closes; detection\'s lines are still drawn: Debug overlay stays on',
    async () => {
      await expect(page.locator('#debugPanel')).toBeHidden();
      expect(await page.locator('#debugOverlay').isChecked()).toBe(true);
    });
});

test('DEV-07.2 Copy CONFIG copies every setting [phone]', async ({
  page,
  context,
  browserName,
  check,
}, testInfo) => {
  test.skip(browserName !== 'chromium', 'Only Chromium lets a test use the clipboard');
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const hand = await startWith(page, testInfo, { address: 'index.html?debug=1' });
  await hand.tap(page.locator('#debugCopy'));
  await waitForToastText(page, COPIED);
  await check(`a message reads "${COPIED}"`, async () => {
    expect((await toastNow(page)).text).toBe(COPIED);
  });
  await check('the clipboard holds "const CONFIG = " and every setting, as JSON spread over '
    + 'lines, ending "};"', async () => {
    // The system's clipboard may end lines with a carriage return as well.
    const copied = (await page.evaluate(() => navigator.clipboard.readText()))
      .replace(/\r\n/g, '\n');
    const expected = await page.evaluate(
      () => `const CONFIG = ${JSON.stringify(CONFIG, null, 2)};\n`,
    );
    expect(copied).toBe(expected);
  });
});

test('DEV-07.3 With the clipboard blocked, CONFIG goes to the console [phone]', async ({
  page,
  check,
}, testInfo) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: () => Promise.reject(new Error('Stand-in: the clipboard is blocked')) },
    });
  });
  const messages = watchConsole(page);
  const hand = await startWith(page, testInfo, { address: 'index.html?debug=1' });
  await hand.tap(page.locator('#debugCopy'));
  await page.locator('#toast.is-shown').waitFor({ timeout: WAIT_MS });
  await check(`an amber message reads "${CLIPBOARD_BLOCKED}"`, async () => {
    const shown = await toastNow(page);
    expect(shown.text).toBe(CLIPBOARD_BLOCKED);
    expect({ kind: shown.kind, isShown: shown.isShown }).toEqual({ kind: 'warn', isShown: true });
  });
  await check('the Console holds "const CONFIG = {" and the settings', async () => {
    const printed = linesStarting(messages, 'const CONFIG = {');
    expect(printed).toHaveLength(1);
    const settings = await page.evaluate(() => JSON.stringify(CONFIG, null, 2));
    expect(printed[0].text).toBe(`const CONFIG = ${settings};\n`);
  });
});

/* ---------------- DEV-08 The tuning panel's detection report ---------------- */

test('DEV-08.1 The panel reports the last detection [phone]', async ({
  page,
  check,
}, testInfo) => {
  await startWith(page, testInfo, { address: 'index.html?debug=1' });
  await waitForDetection(page);
  const report = await page.locator('#debugInfo').textContent();
  const lines = report.split('\n');
  await check('the first line reads "round trip N ms (analyze N ms, quads N ms)"', async () => {
    expect(lines[0]).toMatch(/^round trip \d+ ms \(analyze \d+ ms, quads \d+ ms\)$/);
  });
  await check('the second reads "N lines → N quads"', async () => {
    expect(lines[1]).toMatch(/^\d+ lines → \d+ quads$/);
  });
  await check('then one line per candidate, as many as Candidate offers, each with its score, '
    + 'confidence and shape figures', async () => {
    const candidates = await page.evaluate(
      () => window.__straightener.app.detection.candidates.length,
    );
    const candidateLines = lines.slice(2);
    expect(candidateLines).toHaveLength(candidates);
    for (const line of candidateLines) {
      expect(line).toMatch(
        /^#\d score [\d.]+ conf \d+% sup [\d.]+ min [\d.]+ asp [\d.]+ ang .* area [\d.]+% refined/,
      );
    }
  });
});

/* ---------------- DEV-09 Opening the tuning panel turns the debug overlay on ------------ */

test('DEV-09.1 The backtick key opens the panel, turns Debug overlay on and fills the report '
  + '[desktop]', async ({ page, check }, testInfo) => {
  await startWith(page, testInfo);
  await waitForDetection(page);
  const runsBefore = await detectionRuns(page);
  await page.keyboard.press('`');
  await check('the Detection tuning panel opens', async () => {
    await expect(page.locator('#debugPanel')).toBeVisible();
    await expect(page.locator('#debugPanel')).toContainText('Detection tuning');
  });
  await waitForNextDetection(page, runsBefore);
  await check('Debug overlay in Perspective\'s options is on, and detection\'s lines are drawn',
    async () => {
      await expect(page.locator('#perspectiveSheet label:has(#debugOverlay)')).toBeVisible();
      await expect(page.locator('#debugOverlay')).toBeChecked();
      expect(await areDetectedLinesDrawn(page)).toBe(true);
    });
  await check('the panel\'s report starts "round trip ": detection ran again and filled it in',
    async () => {
      await expect(page.locator('#debugInfo')).toHaveText(/^round trip /);
      expect(await detectionRuns(page)).toBe(runsBefore + 1);
    });
});

test('DEV-09.2 Opening the panel leaves corners placed by hand alone and adds no undo step '
  + '[desktop]', async ({ page, check }, testInfo) => {
  const hand = await startWith(page, testInfo);
  await waitForDetection(page);
  const undo = page.locator('#btnUndo');
  const found = (await editState(page)).corners[0];
  const start = await cornerOnPage(page, 0);
  await hand.drag(start, { x: start.x + DRAG_PX, y: start.y + DRAG_PX });
  const dragged = (await editState(page)).corners[0];
  await check('the top-left corner moves off the card; Undo is no longer greyed out', async () => {
    expect(Math.hypot(dragged[0] - found[0], dragged[1] - found[1]))
      .toBeGreaterThan(MOVED_MIN_PX);
    await expect(undo).toBeEnabled();
  });
  const runsBefore = await detectionRuns(page);
  await page.keyboard.press('`');
  await waitForNextDetection(page, runsBefore);
  await check('the panel opens, and Debug overlay turns on', async () => {
    await expect(page.locator('#debugPanel')).toBeVisible();
    await expect(page.locator('#debugOverlay')).toBeChecked();
  });
  const after = (await editState(page)).corners[0];
  await check('the top-left corner stays where it was dragged', async () => {
    expect(Math.abs(after[0] - dragged[0])).toBeLessThan(SAME_CORNER_PX);
    expect(Math.abs(after[1] - dragged[1])).toBeLessThan(SAME_CORNER_PX);
  });
  await hand.tap(undo);
  const undone = (await editState(page)).corners[0];
  await check('the top-left corner is back on the card\'s corner, and Undo is greyed out: the '
    + 'drag was the only undo step', async () => {
    expect(Math.abs(undone[0] - found[0])).toBeLessThan(SAME_CORNER_PX);
    expect(Math.abs(undone[1] - found[1])).toBeLessThan(SAME_CORNER_PX);
    expect(await undo.isDisabled()).toBe(true);
  });
});

/* ---------------- DEV-10 The test hook ---------------- */

test('DEV-10.1 The page offers the test hook with its state and calls [phone]', async ({
  page,
  check,
}) => {
  await openApp(page);
  const hook = await page.evaluate(() => {
    const straightener = window.__straightener;
    return Object.fromEntries(Object.keys(straightener)
      .map(name => [name, typeof straightener[name]]));
  });
  await check('typeof window.__straightener.app answers \'object\': the hook holds the app\'s '
    + 'state', async () => {
    expect(hook.app).toBe('object');
  });
  await check('Object.keys(window.__straightener) holds every call and part the case lists',
    async () => {
      for (const name of HOOK_CALLS) expect(hook[name], name).toBe('function');
      for (const name of HOOK_PARTS) expect(hook[name], name).toBeDefined();
    });
});
