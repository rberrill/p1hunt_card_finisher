// The links and developer cases (tests/catalog/links-and-developer.md): settings from a link,
// the console warning for a rejected one, ?debug, ?selftest, the detection tuning panel and its
// buttons and report, and the test hook.
// Each test drives the app as a person would, through hand.tap and hand.drag (a finger on the
// phone targets, the mouse on the wide ones), and reads the app's state only to check a result.
'use strict';
const { test, expect } = require('./support/case.js');
const {
  openApp,
  openPhoto,
  goToStep,
  editState,
  cornerOnPage,
} = require('./support/app.js');
const { toastNow } = require('./support/start-and-session.js');
const { installShareStandIn, selectedChoices } = require('./support/export.js');
const {
  startWith,
  watchConsole,
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
const CLIPBOARD_BLOCKED = 'Clipboard blocked — CONFIG printed to the console.';
// How long a case waits for a message before reading what is shown, in ms.
const TOAST_WAIT_MS = 5000;
// How long the panel waits after the last change to a field before detecting again, in ms
// (REDETECT_DELAY_MS in js/app/debug-panel.js), and how long a case waits past it.
const REDETECT_DELAY_MS = 350;
const PAST_REDETECT_MS = REDETECT_DELAY_MS + 550;
// The tuning panel's largest height on the phone, as a fraction of the window's.
const PHONE_PANEL_MAX_FRACTION = 0.4;
// The wide layout's side panel width and the gap the tuning panel keeps from it, in CSS px.
const SIDE_PANEL_PX = 380;
// How far a corner is dragged by hand, in CSS px.
const DRAG_PX = 40;
// How close a corner must be to count as not moved, in photo px.
const SAME_CORNER_PX = 0.5;
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

// Waits until no detection is running: the last run has cleared its message.
function waitForDetection(page) {
  return page.waitForFunction(() => window.__straightener.app.detection.message === '');
}

// The tuning panel's field for a detection setting.
const panelField = (page, key) => page.locator(`#debugPanel input[data-key="${key}"]`);

// The detection settings that are a number or on/off, which the panel gives a field each.
function tunableKeys(page) {
  return page.evaluate(() => Object.keys(CONFIG.detect)
    .filter(key => ['number', 'boolean'].includes(typeof CONFIG.detect[key])));
}

/* ---------------- DEV-01 A link can change a setting ---------------- */

test('DEV-01.1 A link sets a number setting [phone]', async ({ page, check }, testInfo) => {
  const hand = await startWith(page, testInfo, { address: 'index.html?export.longEdge=1080' });
  await goToStep(page, 'export', hand);
  await check('Export opens with 1080 selected under Size', async () => {
    expect(await selectedChoices(page, 'exportSize')).toEqual(['1080']);
  });
});

/* ---------------- DEV-02 On/off settings and the undo limit from a link ---------------- */

test('DEV-02.1 A link turns the Share button off, with 0 or false only [phone]', async ({
  page,
  check,
}, testInfo) => {
  await installShareStandIn(page, 'share');
  const hand = await startWith(page, testInfo, { address: 'index.html?export.share=0' });
  await goToStep(page, 'export', hand);
  await check('with export.share=0, Share is not shown; Download is', async () => {
    await expect(page.locator('#btnShare')).toBeHidden();
    await expect(page.locator('#btnDownload')).toBeVisible();
  });
  const messages = watchConsole(page);
  await openApp(page, 'index.html?export.share=no');
  await openPhoto(page, 'IMG_9136.JPEG');
  await goToStep(page, 'export', hand);
  await check('with export.share=no, the console warns and Share is shown', async () => {
    const warning = messages.find(message => message.text.startsWith(IGNORED_WARNING));
    expect(warning && warning.text).toBe(`${IGNORED_WARNING} export.share`);
    await expect(page.locator('#btnShare')).toBeVisible();
  });
});

test('DEV-02.2 A link sets the undo history\'s length [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startWith(page, testInfo, { address: 'index.html?historyLimit=2' });
  await goToStep(page, 'rotate', hand);
  for (let turn = 0; turn < 3; turn++) await hand.tap(page.locator('#toolRotateRight'));
  await hand.tap(page.locator('#btnUndo'));
  await hand.tap(page.locator('#btnUndo'));
  await check('after three quarter turns, two Undos leave one turn, and Undo is greyed out',
    async () => {
      expect((await editState(page)).rotation.quarter).toBe(1);
      await expect(page.locator('#btnUndo')).toBeDisabled();
    });
});

test('DEV-02.3 An undo length outside 1 to 200 is ignored [phone]', async ({
  page,
  check,
}, testInfo) => {
  const messages = watchConsole(page);
  await startWith(page, testInfo, { address: 'index.html?historyLimit=0' });
  await openApp(page, 'index.html?historyLimit=201');
  await check('the console warns about historyLimit for 0 and for 201', async () => {
    const warnings = messages.filter(message => message.text.startsWith(IGNORED_WARNING));
    expect(warnings.map(message => message.text))
      .toEqual([`${IGNORED_WARNING} historyLimit`, `${IGNORED_WARNING} historyLimit`]);
  });
  await check('the undo history keeps its 50 steps', async () => {
    expect(await page.evaluate(() => CONFIG.historyLimit)).toBe(50);
  });
});

/* ---------------- DEV-03 A rejected link setting is reported in the console only -------- */

test('DEV-03.1 Rejected link settings are named in the console, and nothing shows [phone]',
  async ({ page, check }, testInfo) => {
    const messages = watchConsole(page);
    await startWith(page, testInfo, {
      address: 'index.html?nope=1&crop.presets=x&historyLimit=500&detect.cannyHigh=90',
    });
    await check(`one warning reads "${IGNORED_WARNING} nope, crop.presets, historyLimit"`,
      async () => {
        const warnings = messages.filter(message => message.text.startsWith(IGNORED_WARNING));
        expect(warnings.map(message => message.text))
          .toEqual([`${IGNORED_WARNING} nope, crop.presets, historyLimit`]);
        expect(warnings[0].type).toBe('warning');
      });
    await check('no message shows on screen, and the good setting was applied', async () => {
      expect((await toastNow(page)).isShown).toBe(false);
      expect(await page.evaluate(() => CONFIG.detect.cannyHigh)).toBe(90);
    });
  });

/* ---------------- DEV-04 ?debug turns on the developer view ---------------- */

test('DEV-04.1 ?debug opens the tuning panel, turns Debug overlay on and logs each detection '
  + '[phone]', async ({ page, check }) => {
  const messages = watchConsole(page);
  await openApp(page, 'index.html?debug');
  await check('the Detection tuning panel is open at the start', async () => {
    await expect(page.locator('#debugPanel')).toBeVisible();
    await expect(page.locator('#debugPanel')).toContainText('Detection tuning');
  });
  await openPhoto(page, 'IMG_9136.JPEG');
  await check('Debug overlay is on, and the console logs the detection', async () => {
    expect(await page.locator('#debugOverlay').isChecked()).toBe(true);
    expect(messages.some(message => message.text.startsWith(DETECT_LOG))).toBe(true);
  });
});

test('DEV-04.2 ?debug=0 and ?debug=false leave the developer view off [phone]', async ({
  page,
  check,
}) => {
  for (const value of ['0', 'false']) {
    const messages = watchConsole(page);
    await openApp(page, `index.html?debug=${value}`);
    await openPhoto(page, 'IMG_9136.JPEG');
    await check(`with debug=${value}: no panel, Debug overlay off, no detection log`,
      async () => {
        await expect(page.locator('#debugPanel')).toBeHidden();
        expect(await page.locator('#debugOverlay').isChecked()).toBe(false);
        expect(messages.some(message => message.text.startsWith(DETECT_LOG))).toBe(false);
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
  await check(`a message reads "${message}", not red, with every test passed`, async () => {
    const shown = await toastNow(page);
    expect(shown.text).toBe(message);
    expect(shown.kind).toBe('');
    const [passed, total] = results.main.split('/');
    expect(passed).toBe(total);
    expect(results.worker).toBe(results.main);
  });
  await check('the console holds both result tables', async () => {
    const texts = messages.map(entry => entry.text);
    expect(texts).toContain(MAIN_TABLE);
    expect(texts).toContain(WORKER_TABLE);
  });
});

test('DEV-05.2 ?selftest=0 runs no self-tests [phone]', async ({ page, check }) => {
  test.fail(true, 'BUG-171');
  await openApp(page, 'index.html?selftest=0');
  await page.waitForTimeout(PAST_REDETECT_MS);
  const ran = await page.evaluate(() => !!window.__selftest);
  const shown = await toastNow(page);
  await check('no self-test message shows, and no self-tests ran', async () => {
    expect(shown.isShown && shown.text.startsWith(SELF_TESTS)).toBe(false);
    expect(ran).toBe(false);
  });
});

/* ---------------- DEV-06 The detection tuning panel ---------------- */

test('DEV-06.1 The panel has a field per detection setting and detects again after a change '
  + '[phone]', async ({ page, check }, testInfo) => {
  await startWith(page, testInfo, { address: 'index.html?debug=1' });
  await waitForDetection(page);
  const keys = await tunableKeys(page);
  await check('the panel has one field for each of the detection settings', async () => {
    const fields = await page.locator('#debugPanel input[data-key]')
      .evaluateAll(inputs => inputs.map(input => input.dataset.key));
    expect(fields).toEqual(keys);
  });
  const runsBefore = await detectionRuns(page);
  const field = panelField(page, 'cannyHigh');
  await field.fill('');
  await field.pressSequentially('70');
  await check('the setting takes the new value at once', async () => {
    expect(await page.evaluate(() => CONFIG.detect.cannyHigh)).toBe(70);
    expect(await detectionRuns(page)).toBe(runsBefore);
  });
  await page.waitForTimeout(PAST_REDETECT_MS);
  await check('detection runs once, after the typing stops', async () => {
    expect(await detectionRuns(page)).toBe(runsBefore + 1);
  });
});

test('DEV-06.2 Where the panel sits [both] [webkit]', async ({ page, check }, testInfo) => {
  const isPhone = testInfo.project.name.includes('phone');
  await openApp(page, 'index.html?debug=1');
  if (isPhone) {
    await check('with no photo open, the panel floats over the start screen', async () => {
      const covered = await page.evaluate(() => {
        const panel = document.getElementById('debugPanel').getBoundingClientRect();
        const start = document.getElementById('empty').getBoundingClientRect();
        return panel.top < start.bottom && panel.bottom > start.top;
      });
      expect(covered).toBe(true);
    });
  }
  await openPhoto(page, 'IMG_9136.JPEG');
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
  if (isPhone) {
    await check('on the phone: the window\'s width less 8 px a side, just above the controls, '
      + 'at most 40% of the height', async () => {
      expect(boxes.panel.left).toBe(8);
      expect(boxes.panel.right).toBe(boxes.width - 8);
      expect(boxes.controls.top - boxes.panel.bottom).toBe(8);
      expect(boxes.panel.height).toBeLessThanOrEqual(boxes.height * PHONE_PANEL_MAX_FRACTION);
    });
  } else {
    await check('on a wide screen: at the top right, 8 px left of the side panel', async () => {
      expect(boxes.side.width).toBe(SIDE_PANEL_PX);
      expect(boxes.side.left - boxes.panel.right).toBe(8);
      expect(boxes.panel.top).toBe(64);
    });
  }
});

test('DEV-06.3 A field takes a value a link could not [phone]', async ({
  page,
  check,
}, testInfo) => {
  await startWith(page, testInfo, { address: 'index.html?debug=1' });
  const field = panelField(page, 'workingSize');
  await field.fill('2500');
  await check('workingSize takes 2500, over the 2000 a link is held to', async () => {
    expect(await page.evaluate(() => CONFIG.detect.workingSize)).toBe(2500);
  });
});

/* ---------------- DEV-07 The tuning panel's buttons ---------------- */

test('DEV-07.1 Re-detect runs detection, and Close tuning closes the panel [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startWith(page, testInfo, { address: 'index.html?debug=1' });
  await waitForDetection(page);
  const runsBefore = await detectionRuns(page);
  await hand.tap(page.locator('#debugRun'));
  await waitForDetection(page);
  await check('Re-detect runs detection once more', async () => {
    expect(await detectionRuns(page)).toBe(runsBefore + 1);
  });
  await hand.tap(page.locator('#debugClose'));
  await check('Close tuning closes the panel; Debug overlay stays on', async () => {
    await expect(page.locator('#debugPanel')).toBeHidden();
    expect(await page.locator('#debugOverlay').isChecked()).toBe(true);
  });
});

test('DEV-07.2 Copy CONFIG copies every setting [phone]', async ({
  page,
  context,
  check,
}, testInfo) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const hand = await startWith(page, testInfo, { address: 'index.html?debug=1' });
  await hand.tap(page.locator('#debugCopy'));
  await page.waitForFunction(text => {
    const toast = document.getElementById('toast');
    return !!toast && toast.querySelector('.toast-text').textContent === text;
  }, COPIED, { timeout: TOAST_WAIT_MS }).catch(() => {});
  await check(`a message reads "${COPIED}"`, async () => {
    expect((await toastNow(page)).text).toBe(COPIED);
  });
  await check('the clipboard holds "const CONFIG = " and every setting', async () => {
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
  await page.waitForFunction(text => {
    const toast = document.getElementById('toast');
    return !!toast && toast.querySelector('.toast-text').textContent === text;
  }, CLIPBOARD_BLOCKED, { timeout: TOAST_WAIT_MS }).catch(() => {});
  await check(`an amber message reads "${CLIPBOARD_BLOCKED}"`, async () => {
    expect(await toastNow(page)).toEqual({ text: CLIPBOARD_BLOCKED, kind: 'warn', isShown: true });
  });
  await check('the console holds "const CONFIG = " and the settings', async () => {
    expect(messages.some(message => message.text.startsWith('const CONFIG = {'))).toBe(true);
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
  await check('the first line gives the round trip, analyze and quads times in ms', async () => {
    expect(lines[0]).toMatch(/^round trip \d+ ms \(analyze \d+ ms, quads \d+ ms\)$/);
  });
  await check('the second gives the lines and shapes found', async () => {
    expect(lines[1]).toMatch(/^\d+ lines → \d+ quads$/);
  });
  await check('then one line per candidate, with its score, confidence and shape figures',
    async () => {
      const candidates = await page.evaluate(
        () => window.__straightener.app.detection.candidates.length,
      );
      const candidateLines = lines.slice(2);
      expect(candidateLines).toHaveLength(candidates);
      for (const line of candidateLines) {
        expect(line).toMatch(/^#\d score [\d.]+ conf \d+% sup [\d.]+ min [\d.]+ asp [\d.]+ ang/);
      }
    });
});

/* ---------------- DEV-09 Opening the tuning panel turns the debug overlay on ------------ */

test('DEV-09.1 The backtick key opens the panel, turns Debug overlay on and fills the report '
  + '[desktop]', async ({ page, check }, testInfo) => {
  await startWith(page, testInfo);
  await waitForDetection(page);
  const runsBefore = await detectionRuns(page);
  await page.locator('#view').focus();
  await page.keyboard.press('`');
  await waitForDetection(page);
  await check('the panel opens with Debug overlay on, and detection ran again', async () => {
    await expect(page.locator('#debugPanel')).toBeVisible();
    expect(await page.locator('#debugOverlay').isChecked()).toBe(true);
    expect(await detectionRuns(page)).toBe(runsBefore + 1);
  });
  await check('the report under the fields is filled in', async () => {
    await expect(page.locator('#debugInfo')).toContainText('round trip ');
  });
});

test('DEV-09.2 Opening the panel leaves corners placed by hand alone [desktop]', async ({
  page,
  check,
}, testInfo) => {
  test.fail(true, 'BUG-211');
  const hand = await startWith(page, testInfo);
  await waitForDetection(page);
  const start = await cornerOnPage(page, 0);
  await hand.drag(start, { x: start.x + DRAG_PX, y: start.y + DRAG_PX });
  const dragged = (await editState(page)).corners[0];
  await page.locator('#view').focus();
  await page.keyboard.press('`');
  await waitForDetection(page);
  const after = (await editState(page)).corners[0];
  await check('the dragged corner stays where it was put', async () => {
    expect(Math.abs(after[0] - dragged[0])).toBeLessThan(SAME_CORNER_PX);
    expect(Math.abs(after[1] - dragged[1])).toBeLessThan(SAME_CORNER_PX);
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
  await check('window.__straightener holds the app\'s state', async () => {
    expect(hook.app).toBe('object');
  });
  await check('and every call and part the catalog lists', async () => {
    for (const name of HOOK_CALLS) expect(hook[name], name).toBe('function');
    for (const name of HOOK_PARTS) expect(hook[name], name).toBeDefined();
  });
});
