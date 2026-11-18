// The security cases (tests/catalog/security.md): the page's security policy as the browser
// applies it, nothing leaving the device, what a link can set, edits files, a stored session,
// remembered preferences and stored logos checked before use, names shown as plain text, and
// no console error in normal use.
// Each test drives the app as a person would, through hand.tap and hand.drag (a finger on the
// phone targets, the mouse on the wide ones), and reads the app's state only to check a result.
// What a case has a person type into the Console, the test runs in the page; what a Script
// only case's script changes in storage, the test changes the same way. The files a case names
// are the committed ones in tests/fixtures/; a file too large to commit is made here from the
// fixture the case names, as the case tells a person to make it.
// SEC-01.1, SEC-12 and SEC-13 are proven by node tests/selftest.js, so they have no test here.
'use strict';
const fs = require('fs');
const { test, expect } = require('./support/case.js');
const {
  samplePath,
  openApp,
  openPhoto,
  goToStep,
  editState,
  handFor,
  openOptions,
  RULED_EDITS_LINES,
} = require('./support/app.js');
const {
  pickWith,
  waitForPhoto,
  waitForSaved,
  reloadToStart,
  resumeAs,
  addLogo,
  storedRecord,
} = require('./support/start-and-session.js');
const { loadEdits, recordMessages, messagesSoFar } = require('./support/edits-drop-keys.js');
const {
  fixtureFile,
  fixturePath,
  fixtureEdits,
  toastShownLines,
} = require('./support/edits-files.js');
const { choiceButton, selectedChoices } = require('./support/export.js');
const { presetChip, chipLabels, selectedChips } = require('./support/crop.js');
const { fixtureLogo, chooseLogo, chooseBadLogo } = require('./support/overlay.js');
const { statusNow } = require('./support/messages.js');
const { levelsDot } = require('./support/levels.js');
const { waitInPage } = require('./support/front-and-back.js');
const {
  PHOTO,
  startWith,
  openWith,
  stepShown,
  isOnFoundCard,
  tapDownload,
  answerForFile,
  writePrefsNow,
  watchConsole,
  watchRequests,
  watchPolicyRefusals,
  policyRefusals,
  textPayload,
  changeSavedRecord,
} = require('./support/security-layout-speed.js');

// The start screen's words, word for word.
const OPEN_PROMPT = 'Open, drop, or paste a photo.';
const STAYS_ON_DEVICE = 'Everything stays on this device.';
// The console warning for settings a link sets that the app ignores, up to the names.
const IGNORED_WARNING = '[card-finisher] URL settings ignored (unknown, not a number / on-off '
  + 'setting, or outside its safe range):';
// The policy rules a refused script and a refused picture are reported under.
const SCRIPT_RULE = 'script-src \'self\'';
const IMAGE_RULE = 'img-src \'self\' blob: data:';
// The Upscale question for the default Size.
const UPSCALE_QUESTION = 'Upscale to 2000 px?';
// The edits-file messages, word for word.
const TOO_LARGE = 'That file is too large to be a Card Finisher edits file.';
const NOT_JSON = 'That file isn’t valid JSON.';
const NOT_EDITS = 'That isn’t a Card Finisher edits file.';
// The message a photo shows while it opens.
const LOADING = 'Loading…';
// The logo messages and the Overlay step's hint, word for word.
const NO_SIZE = 'That SVG has no width, height or viewBox, so it can’t be sized. '
  + 'Re-export it with a size.';
const CANT_READ = 'Couldn’t read that image. Try another PNG, WebP, JPG or SVG file.';
// Ruling R83: the hint gives the limit in force, and a limit under 1 MB reads in KB, in the
// hint and in the refusal alike. A link of 65536 bytes sets 64 KB.
const LOWERED_LIMIT_HINT = 'Add a logo or watermark: PNG, WebP, JPG or SVG, up to 64 KB.';
// Ruling R59: messages say "logo".
const LOWERED_LIMIT_MESSAGE = 'That file is 0.1 MB. The logo limit is 64 KB.';
// The files in tests/fixtures/ the cases name (each described in its case).
const TURNED = 'IMG_9136-turned-edits.json';
const LEVELS_AS_WORDS = 'IMG_9136-levels-as-words-edits.json';
const NOTES = 'notes.json';
const VERSION_3 = 'IMG_9136-version-3-edits.json';
const GIF_LOGO = 'IMG_9136-gif-logo-edits.json';
const MARKUP_NAME = 'IMG_9136-markup-name-edits.json';
const FORGED_LINE_NAME = 'IMG_9136-forged-line-name-edits.json';
const UNSIZED_SVG = 'unsized.svg';
const SVG_WITH_SCRIPT = 'svg-with-script.svg';
const NOISY_LOGO = 'noisy-logo.png';
// The largest edits file the app reads, in bytes (CONFIG.export.editsMaxBytes, 8 MB), and a
// logo of 5.5 MB: over the logo limit of 5 MB and, written into a file, still under 8 MB.
const EDITS_MAX_BYTES = 8 * 1024 * 1024;
const OVER_LOGO_LIMIT_BYTES = 5.5 * 1024 * 1024;
// The start of a name with markup in it (51 characters), as the cases write it.
const MARKUP_NAME_START = '<b>bold</b> <img src=x onerror="window.testRan=1"> ';
// How many letters x follow it in SEC-11.1's photo name (a name of 296 characters).
const NAME_LETTERS = 240;
// How long a name may be on the Resume card and in a message: 59 characters and an ellipsis.
const SHORT_NAME_LENGTH = 60;
// How long a reopened file's name may be: 199 characters and an ellipsis.
const KEPT_NAME_LENGTH = 200;
// The text a damaged saved logo holds in place of its bytes, and its length in bytes.
const DAMAGED_LOGO_TEXT = 'Not a picture any more.';
const DAMAGED_LOGO_BYTES = 23;
// How long a case waits for a message or a change, in ms.
const WAIT_MS = 10000;
// How long a case waits to be sure nothing more happens, in ms ("wait a second").
const SETTLE_MS = 1000;

// Opens Rotate and taps 90° right once, then waits for the quarter turn.
async function turnRight(page, hand) {
  await goToStep(page, 'rotate', hand);
  await hand.tap(page.locator('#toolRotateRight'));
  await page.waitForFunction(() => window.__straightener.app.state.rotation.quarter === 1);
}

// The number of messages the toast has shown since the page opened (see recordMessages).
const messageCount = async page => (await messagesSoFar(page)).length;

// Waits for the first message the toast shows after the first `before` of them, other than
// the "Loading…" a photo shows while it opens, and returns it: { text, kind }.
async function messageAfter(page, before) {
  await page.waitForFunction(({ count, loading }) => window.testMessages.slice(count)
    .some(message => message.text !== loading), { count: before, loading: LOADING },
  { timeout: WAIT_MS });
  const messages = (await messagesSoFar(page)).slice(before);
  return messages.find(message => message.text !== LOADING);
}

// Waits for the message a loaded edits file shows after the first `before` messages, and
// checks it (rulings R12 and R48): one amber message, and the lines it shows are `lines`, each
// on a line of its own, in order, with none cut off.
async function expectLoadWarning(page, before, lines) {
  const shown = await messageAfter(page, before);
  expect(shown.kind).toBe('warn');
  expect(await toastShownLines(page)).toEqual({ lines, isCut: false });
}

// Runs one verdict with `check`, then drops any security policy refusal its screenshot
// caused: in WebKit, Playwright's screenshot adds a stylesheet of its own, which the policy
// refuses (support/case.js drops the console error it logs the same way).
async function checkDroppingShotRefusals(page, check, description, assertion) {
  const before = (await policyRefusals(page)).length;
  await check(description, assertion);
  await page.evaluate(count => {
    window.testPolicyRefusals.length = count;
  }, before);
}

// The quarter turns the photo has, once the edits a loaded file brings have been applied.
async function quarterAfterLoad(page, quarter) {
  await page.waitForFunction(
    wanted => window.__straightener.app.state.rotation.quarter === wanted,
    quarter,
    { timeout: WAIT_MS },
  ).catch(() => {});
  return (await editState(page)).rotation.quarter;
}

// Taps Download, answers No to the Upscale question and waits for the file. Returns the name
// the app gave it.
async function downloadAnsweringNo(page, hand) {
  const { downloading } = await tapDownload(page, hand);
  return (await answerForFile(page, hand, 'No', downloading)).name;
}

/* ---------------- SEC-01 The page's security policy ---------------- */

test('SEC-01.2 The browser applies the policy: a script or a picture from elsewhere is refused '
  + '[phone]', async ({ page, check }) => {
  await watchPolicyRefusals(page);
  const messages = watchConsole(page);
  await openApp(page);
  await page.evaluate(() => {
    const script = document.createElement('script');
    script.textContent = 'window.testInlineRan = true';
    document.body.append(script);
  });
  await waitInPage(page, () => window.testPolicyRefusals.length >= 1);
  await check(`a red error in the Console names the policy rule "${SCRIPT_RULE}": the script was `
    + 'blocked', async () => {
    const errors = messages.filter(message => message.type === 'error'
      && message.text.includes(SCRIPT_RULE));
    expect(errors).toHaveLength(1);
    const directives = (await policyRefusals(page)).map(refusal => refusal.directive);
    // Chromium reports the rule a script element breaks as script-src-elem.
    expect(directives.map(directive => directive.startsWith('script-src'))).toEqual([true]);
  });
  await check('the Console answers undefined: the script did not run', async () => {
    expect(await page.evaluate(() => window.testInlineRan)).toBeUndefined();
  });
  await page.evaluate(() => {
    const picture = document.createElement('img');
    picture.src = 'https://example.com/picture.png';
    document.body.append(picture);
  });
  await waitInPage(page, () => window.testPolicyRefusals.length >= 2);
  await check(`a red error in the Console names the policy rule "${IMAGE_RULE}": the picture was `
    + 'blocked', async () => {
    const errors = messages.filter(message => message.type === 'error'
      && message.text.includes(IMAGE_RULE));
    expect(errors).toHaveLength(1);
    const refusals = await policyRefusals(page);
    expect(refusals[1].directive.startsWith('img-src')).toBe(true);
    expect(refusals[1].blocked).toBe('https://example.com/picture.png');
  });
});

/* ---------------- SEC-02 Nothing leaves the device ---------------- */

test('SEC-02.1 Opening, editing and exporting a photo sends nothing over the network [phone]',
  async ({ page, check }, testInfo) => {
    await openApp(page);
    await check(`the start screen reads "${OPEN_PROMPT}" and "${STAYS_ON_DEVICE}"`, async () => {
      await expect(page.locator('#empty')).toContainText(OPEN_PROMPT);
      await expect(page.locator('#empty')).toContainText(STAYS_ON_DEVICE);
    });
    const requests = watchRequests(page);
    const hand = handFor(page, testInfo);
    await openWith(page, hand, page.locator('#btnOpenEmpty'), PHOTO);
    await check('the photo opens on the Perspective step, with the corner outline on the card\'s '
      + 'edges', async () => {
      expect(await stepShown(page)).toBe('perspective');
      expect(await isOnFoundCard(page)).toBe(true);
    });
    await goToStep(page, 'rotate', hand);
    await check('the Rotate step shows, with 90° right', async () => {
      await expect(page.locator('#toolRotateRight')).toBeVisible();
    });
    await hand.tap(page.locator('#toolRotateRight'));
    await check('the photo turns a quarter right', async () => {
      expect(await quarterAfterLoad(page, 1)).toBe(1);
    });
    await goToStep(page, 'export', hand);
    await check('the Export step shows, with Download', async () => {
      await expect(page.locator('#btnDownload')).toBeVisible();
    });
    const { question, downloading } = await tapDownload(page, hand);
    await check(`the question box asks "${UPSCALE_QUESTION}"`, async () => {
      expect(question).toBe(UPSCALE_QUESTION);
    });
    const saved = await answerForFile(page, hand, 'No', downloading);
    await check('IMG_9136-straight.jpg is saved', async () => {
      expect(saved.name).toBe('IMG_9136-straight.jpg');
    });
    await check('no request went over the network since the list was cleared: every address, '
      + 'if any, starts with blob: or data:', async () => {
      const overNetwork = requests.filter(address => !/^(blob|data):/.test(address));
      expect(overNetwork).toEqual([]);
    });
  });

/* ---------------- SEC-03 A link can set only number and on/off settings ---------------- */

test('SEC-03.1 A link can\'t set text or reach past the settings [phone]', async ({
  page,
  check,
}, testInfo) => {
  const messages = watchConsole(page);
  const link = 'index.html?crop.defaultPreset=4:3&export.format=png'
    + '&storageKey=elsewhere&__proto__.polluted=1&crop.presets.0.label=Hacked';
  const hand = await startWith(page, testInfo, { address: link });
  const names = 'crop.defaultPreset, export.format, storageKey, __proto__.polluted, '
    + 'crop.presets.0.label';
  await check(`a warning reads "${IGNORED_WARNING} ${names}"`, async () => {
    const warnings = messages.filter(message => message.text.startsWith(IGNORED_WARNING));
    expect(warnings.map(message => message.text)).toEqual([`${IGNORED_WARNING} ${names}`]);
  });
  await goToStep(page, 'crop', hand);
  await check('1:1 is the selected preset, and the first preset still reads Free', async () => {
    expect(await selectedChips(page)).toEqual(['1:1']);
    expect((await chipLabels(page))[0]).toBe('Free');
  });
  await goToStep(page, 'export', hand);
  await check('JPEG is the selected Format', async () => {
    expect(await selectedChoices(page, 'exportFormat')).toEqual(['JPEG']);
  });
  await check('({}).polluted is undefined: nothing was added to every object', async () => {
    expect(await page.evaluate(() => ({}).polluted)).toBeUndefined();
  });
  await check('CONFIG.storageKey is \'p1hunt.straightener.v1\', the key as shipped', async () => {
    expect(await page.evaluate(() => CONFIG.storageKey)).toBe('p1hunt.straightener.v1');
  });
});

/* ---------------- SEC-04 Size and memory limits can only be lowered ---------------- */

test('SEC-04.1 A link can\'t raise a size cap or go outside its range [phone]', async ({
  page,
  check,
}, testInfo) => {
  const messages = watchConsole(page);
  const link = 'index.html?export.longEdge=20000&maxOutputArea=50000000'
    + '&overlay.maxBytes=10000000&export.editsMaxBytes=100';
  const hand = await startWith(page, testInfo, { address: link });
  const names = 'export.longEdge, maxOutputArea, overlay.maxBytes, export.editsMaxBytes';
  await check(`a warning reads "${IGNORED_WARNING} ${names}"`, async () => {
    const warnings = messages.filter(message => message.text.startsWith(IGNORED_WARNING));
    expect(warnings.map(message => message.text)).toEqual([`${IGNORED_WARNING} ${names}`]);
  });
  await goToStep(page, 'export', hand);
  await check('2000 is the selected Size, the shipped default', async () => {
    expect(await selectedChoices(page, 'exportSize')).toEqual(['2000']);
  });
  await check('the Console answers [16777216, 5242880, 8388608]: the caps as shipped', async () => {
    const caps = await page.evaluate(() => [
      CONFIG.maxOutputArea,
      CONFIG.overlay.maxBytes,
      CONFIG.export.editsMaxBytes,
    ]);
    expect(caps).toEqual([16777216, 5242880, 8388608]);
  });
});

test('SEC-04.2 A link can lower a size cap [phone]', async ({ page, check }, testInfo) => {
  const hand = await startWith(page, testInfo, { address: 'index.html?maxOutputArea=1000000' });
  await goToStep(page, 'export', hand);
  await hand.tap(choiceButton(page, 'exportSize', 'Original'));
  await check('the size line starts "Output 1000 × 1000 px": the crop is held to 1 MP',
    async () => {
      expect(await selectedChoices(page, 'exportSize')).toEqual(['Original']);
      const line = (await page.locator('#exportReadout').textContent()).trim();
      expect(line.startsWith('Output 1000 × 1000 px')).toBe(true);
    });
});

/* ---------------- SEC-05 A loaded edits file is checked field by field ---------------- */

test('SEC-05.1 A malformed field is reset and named, the rest is applied [phone]', async ({
  page,
  check,
}, testInfo) => {
  await recordMessages(page);
  const hand = await startWith(page, testInfo);
  await goToStep(page, 'export', hand);
  const before = await messageCount(page);
  await loadEdits(page, hand, fixtureFile(LEVELS_AS_WORDS));
  const lines = [RULED_EDITS_LINES.loaded, RULED_EDITS_LINES.reset('levels')];
  await check(`one amber message shows; its lines read "${lines[0]}" and "${lines[1]}", in that `
    + 'order', async () => {
    await expectLoadWarning(page, before, lines);
  });
  await check('the photo is turned a quarter right: the file\'s other edits were applied',
    async () => {
      expect(await quarterAfterLoad(page, 1)).toBe(1);
    });
  await goToStep(page, 'levels', hand);
  await check('Clear and Apply are greyed out, and there is no dot on the Levels tab: no levels '
    + 'are set', async () => {
    await expect(page.locator('#toolClearLevels')).toBeDisabled();
    await expect(page.locator('#btnApplyLevels')).toBeDisabled();
    await expect(levelsDot(page)).toBeHidden();
    expect((await editState(page)).levels).toBeNull();
  });
});

/* ---------------- SEC-06 A bad edits file is refused before anything changes ---------------- */

// IMG_9136-large-edits.json as the case tells a person to make it: IMG_9136-turned-edits.json
// with spaces after its last closing brace until the file is larger than 8 MB.
function largeEditsFile() {
  const text = fs.readFileSync(fixturePath(TURNED), 'utf8');
  const padded = text + ' '.repeat(EDITS_MAX_BYTES + 1 - Buffer.byteLength(text));
  return textPayload(padded, 'IMG_9136-large-edits.json');
}

test('SEC-06.1 A file too large, not JSON or not an edits file is refused, and nothing changes '
  + '[phone]', async ({ page, check }, testInfo) => {
  await recordMessages(page);
  const hand = await startWith(page, testInfo);
  await turnRight(page, hand);
  await goToStep(page, 'export', hand);
  const before = await editState(page);
  const files = [
    { file: largeEditsFile(), message: TOO_LARGE },
    { file: fixtureFile(NOTES), message: NOT_JSON },
    { file: fixtureFile(VERSION_3), message: NOT_EDITS },
  ];
  for (const { file, message } of files) {
    const count = await messageCount(page);
    await loadEdits(page, hand, file, { isRefused: true });
    const shown = await messageAfter(page, count);
    await check(`loading ${file.name}: a red message reads "${message}"; the photo is still `
      + 'turned a quarter right', async () => {
      expect(shown).toEqual({ text: message, kind: 'error' });
      const now = await editState(page);
      expect(now.rotation.quarter).toBe(1);
      expect(now).toEqual(before);
    });
  }
});

/* ---------------- SEC-07 A logo inside an edits file is checked ---------------- */

// IMG_9136-big-logo-edits.json as the case tells a person to make it: IMG_9136-gif-logo-
// edits.json with the logo's type made PNG and its data replaced by a 5.5 MB file's base64.
function bigLogoEditsFile() {
  const edits = fixtureEdits(GIF_LOGO);
  edits.overlayImage.type = 'image/png';
  edits.overlayImage.data = Buffer.alloc(OVER_LOGO_LIMIT_BYTES).toString('base64');
  return textPayload(JSON.stringify(edits, null, 2), 'IMG_9136-big-logo-edits.json');
}

test('SEC-07.1 An edits file\'s logo of the wrong type or over 5 MB is left out [phone]',
  async ({ page, check }, testInfo) => {
    await recordMessages(page);
    const hand = await startWith(page, testInfo);
    await goToStep(page, 'export', hand);
    const files = [fixtureFile(GIF_LOGO), bigLogoEditsFile()];
    const lines = [RULED_EDITS_LINES.loaded, RULED_EDITS_LINES.logoLeftOut];
    for (const file of files) {
      const count = await messageCount(page);
      await loadEdits(page, hand, file);
      await check(`loading ${file.name}: one amber message shows, its lines reading "${lines[0]}" `
        + `and "${lines[1]}", in that order`, async () => {
        await expectLoadWarning(page, count, lines);
      });
      await check('the photo is turned a quarter right, with no logo on it', async () => {
        expect(await quarterAfterLoad(page, 1)).toBe(1);
        expect((await editState(page)).overlay).toBeNull();
      });
    }
  });

/* ---------------- SEC-08 A stored session is checked on Resume ---------------- */

test('SEC-08.1 Resume cleans a damaged field and an unknown step [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startWith(page, testInfo);
  await turnRight(page, hand);
  await waitForSaved(page, { quarter: 1, tab: 'rotate' });
  await changeSavedRecord(page, 'edits', { 'state.crop': 'square please' });
  await check('the saved edits hold the crop "square please"', async () => {
    expect((await storedRecord(page, 'edits')).state.crop).toBe('square please');
  });
  await changeSavedRecord(page, 'edits', { tab: 'settings' });
  await check('the saved edits hold the step "settings"', async () => {
    expect((await storedRecord(page, 'edits')).tab).toBe('settings');
  });
  await reloadToStart(page);
  await check('the start screen offers Resume', async () => {
    await expect(page.locator('#btnResume')).toBeVisible();
  });
  await resumeAs(page, hand, PHOTO);
  await check('the photo opens on the Perspective step, still turned a quarter right',
    async () => {
      expect(await stepShown(page)).toBe('perspective');
      await expect(page.locator('section[data-panel="perspective"]')).toHaveClass(/active/);
      expect((await editState(page)).rotation.quarter).toBe(1);
    });
  await goToStep(page, 'crop', hand);
  await check('1:1 is the selected preset: the damaged crop was reset', async () => {
    expect(await selectedChips(page)).toEqual(['1:1']);
  });
});

/* ---------------- SEC-09 Remembered preferences are checked before use ---------------- */

// The preferences SEC-09.1 has a person type into the Console, as text.
const UNKNOWN_PREFS = '{"cropPreset":"<b>4:3</b>","export":{"format":"gif","quality":7,'
  + '"longEdge":"big","interp":"nearest","fill":"red"},"cornerShots":"many"}';

test('SEC-09.1 Malformed remembered preferences fall back to the defaults [phone]', async ({
  page,
  check,
}, testInfo) => {
  await openApp(page);
  const hand = handFor(page, testInfo);
  const stored = await writePrefsNow(page, UNKNOWN_PREFS);
  await check('the Console answers undefined: the values are stored', async () => {
    expect(stored).toBe(UNKNOWN_PREFS);
  });
  await reloadToStart(page);
  await check('the start screen shows, with Open photo', async () => {
    await expect(page.locator('#btnOpenEmpty')).toBeVisible();
  });
  await openWith(page, hand, page.locator('#btnOpenEmpty'), PHOTO);
  await check('the photo opens on the Perspective step', async () => {
    expect(await stepShown(page)).toBe('perspective');
  });
  await goToStep(page, 'crop', hand);
  await check('1:1 is the selected preset', async () => {
    expect(await selectedChips(page)).toEqual(['1:1']);
  });
  await goToStep(page, 'export', hand);
  await check('2000 is the selected Size and JPEG the selected Format', async () => {
    expect(await selectedChoices(page, 'exportSize')).toEqual(['2000']);
    expect(await selectedChoices(page, 'exportFormat')).toEqual(['JPEG']);
  });
  await hand.tap(page.locator('#btnCornerShots'));
  await check('the Corner shots sheet opens with 1 sheet selected', async () => {
    await expect(page.locator('#cornerShotsSheet')).toBeVisible();
    expect(await selectedChoices(page, 'cornerOutput')).toEqual(['1 sheet']);
  });
});

test('SEC-09.2 Remembered preferences that aren\'t JSON are ignored [phone]', async ({
  page,
  check,
}, testInfo) => {
  await openApp(page);
  const hand = handFor(page, testInfo);
  const text = '{"cropPreset": "4:3", export:';
  const stored = await writePrefsNow(page, text);
  await check('the Console answers undefined: text that can\'t be read is stored as the '
    + 'preferences', async () => {
    expect(stored).toBe(text);
  });
  await reloadToStart(page);
  await check('the start screen shows, and the Console holds no error', async () => {
    await expect(page.locator('#btnOpenEmpty')).toBeVisible();
    expect(check.consoleErrors()).toEqual([]);
  });
  await openWith(page, hand, page.locator('#btnOpenEmpty'), PHOTO);
  await check('the photo opens on the Perspective step, and the Console still holds no error',
    async () => {
      expect(await stepShown(page)).toBe('perspective');
      expect(check.consoleErrors()).toEqual([]);
    });
  await goToStep(page, 'crop', hand);
  await check('1:1 is the selected preset, not 4:3', async () => {
    expect(await selectedChips(page)).toEqual(['1:1']);
  });
});

/* ---------------- SEC-10 What a logo file may be ---------------- */

// True when no logo is on the photo: none in the edits and none drawn.
function hasNoLogo(page) {
  return page.evaluate(() => !window.__straightener.app.state.overlay);
}

test('SEC-10.1 An SVG with no size is refused [phone]', async ({ page, check }, testInfo) => {
  const hand = await startWith(page, testInfo);
  await goToStep(page, 'overlay', hand);
  await chooseBadLogo(page, hand, page.locator('#btnOverlayAdd'), fixtureLogo(UNSIZED_SVG));
  await check(`the line above the controls reads "${NO_SIZE}" in red`, async () => {
    const status = await statusNow(page, 'overlayStatus');
    expect({ text: status.text, kind: status.kind }).toEqual({ text: NO_SIZE, kind: 'error' });
  });
  await check('no logo is on the photo', async () => {
    expect(await hasNoLogo(page)).toBe(true);
  });
});

test('SEC-10.2 An SVG logo\'s script never runs [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startWith(page, testInfo);
  await goToStep(page, 'overlay', hand);
  await chooseLogo(page, hand, page.locator('#btnOverlayAdd'), fixtureLogo(SVG_WITH_SCRIPT));
  await check('a red rectangle is placed on the photo', async () => {
    const overlay = (await editState(page)).overlay;
    expect(overlay).not.toBeNull();
    expect(overlay.aspect).toBeCloseTo(2, 3);
  });
  await page.waitForTimeout(SETTLE_MS);
  await check('window.testSvgRan is undefined: neither the script nor the onload handler ran',
    async () => {
      expect(await page.evaluate(() => window.testSvgRan)).toBeUndefined();
    });
});

test('SEC-10.3 With a lower limit from a link, the hint and the refusal name it [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startWith(page, testInfo, { address: 'index.html?overlay.maxBytes=65536' });
  await goToStep(page, 'overlay', hand);
  await check(`the line above the controls reads "${LOWERED_LIMIT_HINT}": the limit the link `
    + 'set (64 KB), not 5 MB', async () => {
    await expect(page.locator('#overlayHintLine')).toBeVisible();
    expect(await page.locator('#overlayHintLine').textContent()).toBe(LOWERED_LIMIT_HINT);
  });
  await chooseBadLogo(page, hand, page.locator('#btnOverlayAdd'), fixtureLogo(NOISY_LOGO));
  await check(`the line reads "${LOWERED_LIMIT_MESSAGE}" in red`, async () => {
    await expect(page.locator('#overlayStatus .status-text')).toHaveText(LOWERED_LIMIT_MESSAGE);
    expect((await statusNow(page, 'overlayStatus')).kind).toBe('error');
  });
  await check('no logo is on the photo', async () => {
    expect(await hasNoLogo(page)).toBe(true);
  });
});

/* ---------------- SEC-11 File names are shown as plain text, cut short ---------------- */

// SEC-11.1's photo: a copy of the case photo named with markup, 296 characters long. Windows
// can't hold this name, so the copy is made here.
function photoWithMarkupName() {
  const name = `${MARKUP_NAME_START}${'x'.repeat(NAME_LETTERS)}.JPEG`;
  return { name, mimeType: 'image/jpeg', buffer: fs.readFileSync(samplePath(PHOTO)) };
}

test('SEC-11.1 A photo\'s name with markup shows as text on the Resume card, cut to 60 '
  + '[phone] [webkit]', async ({ page, check }, testInfo) => {
  await openApp(page);
  const hand = handFor(page, testInfo);
  const photo = photoWithMarkupName();
  await pickWith(page, hand, page.locator('#btnOpenEmpty'), photo);
  await waitForPhoto(page, photo.name);
  await check('the photo opens on the Perspective step', async () => {
    expect(await stepShown(page)).toBe('perspective');
  });
  await goToStep(page, 'rotate', hand);
  await check('the Rotate step shows, with 90° right', async () => {
    await expect(page.locator('#toolRotateRight')).toBeVisible();
  });
  await hand.tap(page.locator('#toolRotateRight'));
  await waitForSaved(page, { quarter: 1 });
  await check('the photo turns a quarter right', async () => {
    expect((await editState(page)).rotation.quarter).toBe(1);
  });
  await reloadToStart(page);
  const cut = `${photo.name.slice(0, SHORT_NAME_LENGTH - 1)}…`;
  await check(`the Resume card reads "Resume ${cut}?", tags as typed, no picture`, async () => {
    await expect(page.locator('#resume .resume-name')).toHaveText(`Resume ${cut}?`);
    expect(await page.locator('#resumeName').evaluate(el => el.children.length)).toBe(0);
    expect(await page.locator('#resume .resume-name img').count()).toBe(0);
  });
  // The reopened photo keeps its name cut to 200 characters.
  const kept = `${photo.name.slice(0, KEPT_NAME_LENGTH - 1)}…`;
  await resumeAs(page, hand, kept);
  await check('the photo opens turned a quarter right', async () => {
    expect((await editState(page)).rotation.quarter).toBe(1);
  });
  await check('window.testRan is undefined: nothing the name holds has run', async () => {
    expect(await page.evaluate(() => window.testRan)).toBeUndefined();
  });
  await goToStep(page, 'export', hand);
  await check('the Export step shows', async () => {
    expect(await stepShown(page)).toBe('export');
  });
  await openOptions(page, hand, 'export');
  await check('Export options rise; the source line ends with the name\'s first 199 characters '
    + 'and "…"', async () => {
    const line = await page.locator('#sourceInfo').textContent();
    expect(line.endsWith(` · ${kept}`)).toBe(true);
  });
});

test('SEC-11.2 An edits file\'s name with markup shows as text in the warning, cut to 60 '
  + '[phone]', async ({ page, check }, testInfo) => {
  await recordMessages(page);
  const hand = await startWith(page, testInfo);
  await goToStep(page, 'export', hand);
  const before = await messageCount(page);
  await loadEdits(page, hand, fixtureFile(MARKUP_NAME));
  const name = fixtureEdits(MARKUP_NAME).source.name;
  const cut = `${name.slice(0, SHORT_NAME_LENGTH - 1)}…`;
  const lines = [RULED_EDITS_LINES.loaded, RULED_EDITS_LINES.savedFor(cut)];
  await check(`one amber message shows; its lines read "${lines[0]}" and "${lines[1]}"; nothing `
    + 'in it is bold, and no picture shows', async () => {
    await expectLoadWarning(page, before, lines);
    // No element in the message may be one the name's markup made.
    const markup = await page.locator('#toast .toast-text').locator('b, img').count();
    expect(markup).toBe(0);
  });
  await check('window.testRan is undefined: nothing the name holds has run', async () => {
    expect(await page.evaluate(() => window.testRan)).toBeUndefined();
  });
});

// The name in IMG_9136-forged-line-name-edits.json as a message may show it: a space where its
// line break was and another where its direction mark was.
const FORGED_NAME_SHOWN = 'card Logo left out; it couldn’t be read. ';
// The characters a name may not bring into a message: control characters, the line and
// paragraph separators, and the marks that change the direction text runs in.
const UNSAFE_CHARACTERS = /[\u0000-\u001f\u007f\u2028\u2029\u202a-\u202e\u2066-\u2069]/;

test('SEC-11.3 A line break or a direction mark in an edits file\'s name can\'t forge a line '
  + 'of the warning [phone] [webkit]', async ({ page, check }, testInfo) => {
  await recordMessages(page);
  const hand = await startWith(page, testInfo);
  await goToStep(page, 'export', hand);
  const before = await messageCount(page);
  await loadEdits(page, hand, fixtureFile(FORGED_LINE_NAME));
  const lines = [RULED_EDITS_LINES.loaded, RULED_EDITS_LINES.savedFor(FORGED_NAME_SHOWN)];
  await check(`one amber message shows, with two lines and no more: "${lines[0]}" and `
    + `"${lines[1]}"; the whole name is on the second line, and no line starts "Logo left out"`,
  async () => {
    await expectLoadWarning(page, before, lines);
  });
  await check('the second line ends "read. ”; sizes match.", reading left to right: a space '
    + 'stands where the name\'s direction mark was', async () => {
    const written = await page.locator('#toast .toast-text')
      .evaluate(el => [...el.children].map(line => line.textContent));
    expect(written).toEqual(lines);
    expect(written.some(line => UNSAFE_CHARACTERS.test(line))).toBe(false);
  });
  await check('the photo is turned a quarter right: the file\'s edits were applied', async () => {
    expect(await quarterAfterLoad(page, 1)).toBe(1);
  });
});

/* ---------------- SEC-14 No console error in normal use ---------------- */

test('SEC-14.1 A whole edit and export puts no error in the console [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  await watchPolicyRefusals(page);
  const hand = await startWith(page, testInfo);
  const verdict = (description, assertion) => checkDroppingShotRefusals(
    page,
    check,
    description,
    assertion,
  );
  await turnRight(page, hand);
  await verdict('the photo turns a quarter right', async () => {
    expect((await editState(page)).rotation.quarter).toBe(1);
  });
  await goToStep(page, 'crop', hand);
  await hand.tap(presetChip(page, '4:3'));
  await verdict('4:3 is the selected preset', async () => {
    expect(await selectedChips(page)).toEqual(['4:3']);
  });
  const lookBefore = await editState(page);
  await goToStep(page, 'levels', hand);
  await hand.tap(page.locator('#toolAutoLevels'));
  await hand.tap(page.locator('#btnApplyLevels'));
  await verdict('the photo\'s colors change, and there is no dot on the Levels tab: the levels '
    + 'are applied', async () => {
    expect(lookBefore.levels).toBeNull();
    expect((await editState(page)).levels).not.toBeNull();
    await expect(levelsDot(page)).toBeHidden();
  });
  await goToStep(page, 'overlay', hand);
  await addLogo(page, hand, page.locator('#btnOverlayAdd'), 'icon.svg');
  await verdict('the app\'s icon is placed on the photo', async () => {
    expect((await editState(page)).overlay).not.toBeNull();
  });
  await goToStep(page, 'export', hand);
  await verdict('the Export step shows, with Download', async () => {
    await expect(page.locator('#btnDownload')).toBeVisible();
  });
  const { question, downloading } = await tapDownload(page, hand);
  await verdict(`the question box asks "${UPSCALE_QUESTION}"`, async () => {
    expect(question).toBe(UPSCALE_QUESTION);
  });
  const saved = await answerForFile(page, hand, 'No', downloading);
  // Read before the next verdict, whose screenshot would add the tool's own refusal.
  const refusals = await policyRefusals(page);
  const errors = check.consoleErrors();
  await check('IMG_9136-straight.jpg is saved', async () => {
    expect(saved.name).toBe('IMG_9136-straight.jpg');
  });
  await check('the Console holds no error, and no message that the security policy refused '
    + 'something', async () => {
    expect(errors).toEqual([]);
    expect(refusals).toEqual([]);
  });
});

/* ---------------- SEC-15 A logo from storage is checked before use ---------------- */

// Waits until the saved logo is stored on the device, as adding a logo stores it.
function waitForSavedLogo(page) {
  return waitInPage(page, async () => !!(await window.__straightener.Session.get('overlay')));
}

// From the start screen after a reload: taps Start fresh, then opens the case photo with Open
// photo. Each is a row of the case, checked with `check`.
async function startFreshAndOpen(page, hand, check) {
  await check('the start screen offers Resume', async () => {
    await expect(page.locator('#btnResume')).toBeVisible();
  });
  await hand.tap(page.locator('#btnFresh'));
  await check('the start screen, with no Resume card', async () => {
    await expect(page.locator('#resume')).toBeHidden();
    await expect(page.locator('#btnOpenEmpty')).toBeVisible();
  });
  await openWith(page, hand, page.locator('#btnOpenEmpty'), PHOTO);
  await check('the photo opens on the Perspective step', async () => {
    expect(await stepShown(page)).toBe('perspective');
  });
}

test('SEC-15.1 A stored logo of an unknown type is not offered [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startWith(page, testInfo);
  await goToStep(page, 'overlay', hand);
  await addLogo(page, hand, page.locator('#btnOverlayAdd'), 'icon.svg');
  await waitForSavedLogo(page);
  await changeSavedRecord(page, 'overlay', { type: 'text/html' });
  await check('the saved logo\'s record holds the type text/html', async () => {
    expect((await storedRecord(page, 'overlay')).type).toBe('text/html');
  });
  await reloadToStart(page);
  await startFreshAndOpen(page, hand, check);
  await goToStep(page, 'overlay', hand);
  await check('Add logo shows; Use saved overlay does not: the stored logo was skipped',
    async () => {
      await expect(page.locator('#btnOverlayAdd')).toBeVisible();
      await expect(page.locator('#btnUseSaved')).toBeHidden();
    });
});

test('SEC-15.2 A stored logo whose bytes are damaged is refused when used [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startWith(page, testInfo);
  await goToStep(page, 'overlay', hand);
  await addLogo(page, hand, page.locator('#btnOverlayAdd'), 'apple-touch-icon.png');
  await waitForSavedLogo(page);
  await page.evaluate(async text => {
    const Session = window.__straightener.Session;
    const record = await Session.get('overlay');
    record.buf = new TextEncoder().encode(text).buffer;
    await Session.put('overlay', record);
  }, DAMAGED_LOGO_TEXT);
  await check(`the saved logo's record holds those ${DAMAGED_LOGO_BYTES} bytes`, async () => {
    const record = await storedRecord(page, 'overlay');
    expect(record.buf).toEqual({ bytes: DAMAGED_LOGO_BYTES });
    expect(record.type).toBe('image/png');
  });
  await reloadToStart(page);
  await startFreshAndOpen(page, hand, check);
  await goToStep(page, 'overlay', hand);
  await check('Use saved overlay shows', async () => {
    await expect(page.locator('#btnUseSaved')).toBeVisible();
  });
  await hand.tap(page.locator('#btnUseSaved'));
  await page.locator('#overlayStatus .status-text').filter({ hasText: CANT_READ })
    .waitFor({ timeout: WAIT_MS }).catch(() => {});
  await check(`the line above the controls reads "${CANT_READ}" in red`, async () => {
    const status = await statusNow(page, 'overlayStatus');
    expect({ text: status.text, kind: status.kind }).toEqual({ text: CANT_READ, kind: 'error' });
  });
  await check('no logo is on the photo', async () => {
    expect(await hasNoLogo(page)).toBe(true);
  });
});
