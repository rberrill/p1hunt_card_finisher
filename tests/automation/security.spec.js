// The security cases (tests/catalog/security.md): the page's security policy as the browser
// applies it, nothing leaving the device, what a link can set, edits files, a stored session,
// remembered preferences and stored logos checked before use, names shown as plain text, and
// no console error in normal use.
// Each test drives the app as a person would, through hand.tap and hand.drag (a finger on the
// phone targets, the mouse on the wide ones), and reads the app's state only to check a result.
// SEC-01, SEC-12 and SEC-13 are proven by node tests/selftest.js, so they have no test here.
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
  closeOptions,
  saveByDownload,
} = require('./support/app.js');
const {
  pickWith,
  waitForSaved,
  reloadToStart,
  resumeAs,
  toastNow,
  addLogo,
} = require('./support/start-and-session.js');
const { choiceButton, selectedChoices } = require('./support/export.js');
const { presetChip, selectedChips } = require('./support/crop.js');
const { chooseLogo, chooseBadLogo, oversizedPng } = require('./support/overlay.js');
const {
  PHOTO,
  startWith,
  watchConsole,
  watchRequests,
  watchPolicyRefusals,
  policyRefusals,
  editsPayload,
  textPayload,
  saveEditsFile,
  loadEditsFile,
  changeSavedRecord,
  storePrefsText,
} = require('./support/security-layout-speed.js');

// The start screen's promise, word for word.
const STAYS_ON_DEVICE = 'Everything stays on this device.';
// The console warning for settings a link sets that the app ignores, up to the names.
const IGNORED_WARNING = '[card-finisher] URL settings ignored (unknown, not a number / on-off '
  + 'setting, or outside its safe range):';
// The edits-file messages, word for word.
const RESET_WARNING = 'Some settings in these edits weren’t valid and were reset: ';
const TOO_LARGE = 'That file is too large to be a Card Finisher edits file.';
const NOT_JSON = 'That file isn’t valid JSON.';
const NOT_EDITS = 'That isn’t a Card Finisher edits file.';
const LOGO_LEFT_OUT = 'The overlay in these edits couldn’t be read, so it was left out.';
const SAVED_FOR = 'Edits were saved for “';
// The logo messages, word for word.
const NO_SIZE = 'That SVG has no width, height or viewBox, so it can’t be sized. '
  + 'Re-export it with a size.';
const CANT_READ = 'Couldn’t read that image. Try another PNG, WebP, JPG or SVG file.';
// The largest edits file the app reads, in bytes (CONFIG.export.editsMaxBytes, 8 MB).
const EDITS_MAX_BYTES = 8 * 1024 * 1024;
// The logo limit, 5 MB, and the base64 text that decodes to just over it.
const LOGO_MAX_BYTES = 5 * 1024 * 1024;
const OVER_LOGO_BASE64_LENGTH = Math.ceil((LOGO_MAX_BYTES + 1024) / 3) * 4;
// A logo file of 100,000 bytes, over a limit of 65,536 bytes set by a link, and the refusal.
const LOWERED_LOGO_TEST_BYTES = 100000;
const LOWERED_LIMIT_MESSAGE = 'That file is 0.1 MB. The overlay limit is 0.0625 MB.';
// A long name with markup in it: 70 characters of text, then a tag.
const MARKUP_NAME_START = '<b>bold</b> <img src=x onerror="window.testRan=1"> ';
// How long a name may be on the Resume card and in a message: 59 characters and an ellipsis.
const SHORT_NAME_LENGTH = 60;
// How long a reopened file's name may be: 199 characters and an ellipsis.
const KEPT_NAME_LENGTH = 200;
// How long a case waits for a message before reading what is shown, in ms.
const TOAST_WAIT_MS = 5000;
// How long a case waits to be sure nothing more happens, in ms.
const SETTLE_MS = 800;

// Opens Rotate and taps 90° right once.
async function turnRight(page, hand) {
  await goToStep(page, 'rotate', hand);
  await hand.tap(page.locator('#toolRotateRight'));
}

// The shown toast's text and kind, once it is up with text that starts `start`, or after
// TOAST_WAIT_MS whatever it shows then (the case's verdict then names what it found).
async function waitForToast(page, start) {
  await page.waitForFunction(text => {
    const toast = document.getElementById('toast');
    return !!toast && toast.classList.contains('is-shown')
      && toast.querySelector('.toast-text').textContent.startsWith(text);
  }, start, { timeout: TOAST_WAIT_MS }).catch(() => {});
  return toastNow(page);
}

/* ---------------- SEC-01 The page's security policy ---------------- */

test('SEC-01.2 The browser applies the policy: a script or a picture from elsewhere is refused '
  + '[phone]', async ({ page, check }) => {
  await watchPolicyRefusals(page);
  await openApp(page);
  await page.evaluate(() => {
    const script = document.createElement('script');
    script.textContent = 'window.testInlineRan = true;';
    document.body.append(script);
    const picture = document.createElement('img');
    picture.src = 'https://example.com/picture.png';
    document.body.append(picture);
  });
  await page.waitForFunction(() => window.testPolicyRefusals.length >= 2);
  await check('the script written into the page did not run', async () => {
    expect(await page.evaluate(() => window.testInlineRan)).toBeUndefined();
  });
  await check('the browser refused both: the script and the picture from another site',
    async () => {
      const directives = (await policyRefusals(page)).map(refusal => refusal.directive);
      expect(directives.some(directive => directive.startsWith('script-src'))).toBe(true);
      expect(directives.some(directive => directive.startsWith('img-src'))).toBe(true);
    });
});

/* ---------------- SEC-02 Nothing leaves the device ---------------- */

test('SEC-02.1 Opening, editing and exporting a photo sends nothing over the network [phone]',
  async ({ page, check }, testInfo) => {
    await openApp(page);
    await check(`the start screen reads "${STAYS_ON_DEVICE}"`, async () => {
      await expect(page.locator('#empty')).toContainText(STAYS_ON_DEVICE);
    });
    const requests = watchRequests(page);
    await openPhoto(page, PHOTO);
    const hand = handFor(page, testInfo);
    await turnRight(page, hand);
    await goToStep(page, 'export', hand);
    const saved = await saveByDownload(page, hand, 'No');
    await check('the photo was exported as IMG_9136-straight.jpg', async () => {
      expect(saved.name).toBe('IMG_9136-straight.jpg');
    });
    await check('no request went over the network after the page loaded', async () => {
      const overNetwork = requests.filter(address => /^(https?|wss?):/.test(address));
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
  await check(`the console warns: "${IGNORED_WARNING}" and names all five`, async () => {
    const warning = messages.find(message => message.text.startsWith(IGNORED_WARNING));
    expect(warning && warning.text).toBe(`${IGNORED_WARNING} crop.defaultPreset, export.format, `
      + 'storageKey, __proto__.polluted, crop.presets.0.label');
  });
  await goToStep(page, 'crop', hand);
  await check('Crop starts at 1:1, and the first preset still reads Free', async () => {
    expect(await selectedChips(page)).toEqual(['1:1']);
    await expect(presetChip(page, 'Free')).toBeVisible();
  });
  await goToStep(page, 'export', hand);
  await check('Export\'s Format is JPEG', async () => {
    expect(await selectedChoices(page, 'exportFormat')).toEqual(['JPEG']);
  });
  await check('nothing outside the settings was changed', async () => {
    const reached = await page.evaluate(() => ({
      polluted: ({}).polluted,
      storageKey: CONFIG.storageKey,
    }));
    expect(reached).toEqual({ polluted: undefined, storageKey: 'p1hunt.straightener.v1' });
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
  await check('the console warning names all four settings', async () => {
    const warning = messages.find(message => message.text.startsWith(IGNORED_WARNING));
    expect(warning && warning.text).toBe(`${IGNORED_WARNING} export.longEdge, maxOutputArea, `
      + 'overlay.maxBytes, export.editsMaxBytes');
  });
  await goToStep(page, 'export', hand);
  await check('Export\'s Size is 2000, the shipped default', async () => {
    expect(await selectedChoices(page, 'exportSize')).toEqual(['2000']);
  });
  await check('the caps are as shipped', async () => {
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
  await check('at Original the size line reads 1000 × 1000 px: the 1400 px crop is held to '
    + '1 MP', async () => {
    await expect(page.locator('#exportReadout')).toContainText('1000 × 1000 px');
  });
});

/* ---------------- SEC-05 A loaded edits file is checked field by field ---------------- */

test('SEC-05.1 A malformed field is reset and named, the rest is applied [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startWith(page, testInfo);
  await turnRight(page, hand);
  const edits = await saveEditsFile(page, hand);
  edits.levels = 'bright please';
  await closeOptions(page, hand, 'export');
  await goToStep(page, 'rotate', hand);
  await hand.tap(page.locator('#toolRotateLeft'));
  await check('the photo is upright again before loading', async () => {
    expect((await editState(page)).rotation.quarter).toBe(0);
  });
  await loadEditsFile(page, hand, editsPayload(edits));
  const shown = await waitForToast(page, RESET_WARNING);
  await check(`an amber warning reads "${RESET_WARNING}levels."`, async () => {
    expect(shown).toEqual({ text: `${RESET_WARNING}levels.`, kind: 'warn', isShown: true });
  });
  await check('the quarter turn from the file is applied, and no levels are set', async () => {
    const state = await editState(page);
    expect(state.rotation.quarter).toBe(1);
    expect(state.levels).toBeNull();
  });
});

/* ---------------- SEC-06 A bad edits file is refused before anything changes ---------------- */

test('SEC-06.1 A file too large, not JSON or not an edits file is refused, and nothing changes '
  + '[phone]', async ({ page, check }, testInfo) => {
  const hand = await startWith(page, testInfo);
  await turnRight(page, hand);
  const before = await editState(page);
  const bad = [
    { file: textPayload(' '.repeat(EDITS_MAX_BYTES + 1)), message: TOO_LARGE },
    { file: textPayload('{"version": 2, "corners": ['), message: NOT_JSON },
    { file: editsPayload({ version: 9, source: { width: 1, height: 1 }, corners: [] }),
      message: NOT_EDITS },
  ];
  for (const { file, message } of bad) {
    await loadEditsFile(page, hand, file);
    const shown = await waitForToast(page, message);
    await check(`a red message reads "${message}"; the edits are as they were`, async () => {
      expect(shown).toEqual({ text: message, kind: 'error', isShown: true });
      expect(await editState(page)).toEqual(before);
    });
  }
});

/* ---------------- SEC-07 A logo inside an edits file is checked ---------------- */

test('SEC-07.1 An edits file\'s logo of the wrong type or over 5 MB is left out [phone]',
  async ({ page, check }, testInfo) => {
    const hand = await startWith(page, testInfo);
    await goToStep(page, 'overlay', hand);
    await addLogo(page, hand, page.locator('#btnOverlayAdd'), 'icon.svg');
    const edits = await saveEditsFile(page, hand);
    await closeOptions(page, hand, 'export');
    await goToStep(page, 'overlay', hand);
    await hand.tap(page.locator('#toolOverlayRemove'));
    const wrongType = JSON.parse(JSON.stringify(edits));
    wrongType.overlayImage.type = 'image/gif';
    const tooLarge = JSON.parse(JSON.stringify(edits));
    tooLarge.overlayImage.data = 'A'.repeat(OVER_LOGO_BASE64_LENGTH);
    for (const [what, file] of [['a GIF', wrongType], ['over 5 MB', tooLarge]]) {
      await loadEditsFile(page, hand, editsPayload(file));
      const shown = await waitForToast(page, LOGO_LEFT_OUT);
      await check(`with a logo ${what}: an amber warning reads "${LOGO_LEFT_OUT}" and no logo `
        + 'is placed', async () => {
        expect(shown).toEqual({ text: LOGO_LEFT_OUT, kind: 'warn', isShown: true });
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
  await changeSavedRecord(page, 'edits', { 'state.crop': 'square please', tab: 'settings' });
  await reloadToStart(page);
  await resumeAs(page, hand, PHOTO);
  await check('the photo opens on Perspective, still turned a quarter right', async () => {
    await expect(page.locator('section[data-panel="perspective"]')).toHaveClass(/active/);
    expect((await editState(page)).rotation.quarter).toBe(1);
  });
  await goToStep(page, 'crop', hand);
  await check('Crop is back at 1:1', async () => {
    expect(await selectedChips(page)).toEqual(['1:1']);
  });
});

/* ---------------- SEC-09 Remembered preferences are checked before use ---------------- */

test('SEC-09.1 Malformed remembered preferences fall back to the defaults [phone]', async ({
  page,
  check,
}, testInfo) => {
  await storePrefsText(page, JSON.stringify({
    cropPreset: '<b>4:3</b>',
    export: { format: 'gif', quality: 7, longEdge: 'big', interp: 'nearest', fill: 'red' },
    cornerShots: 'many',
    pairOutput: 'both',
  }));
  const hand = await startWith(page, testInfo);
  await goToStep(page, 'crop', hand);
  await check('Crop starts at 1:1', async () => {
    expect(await selectedChips(page)).toEqual(['1:1']);
  });
  await goToStep(page, 'export', hand);
  await check('Export starts at 2000 and JPEG', async () => {
    expect(await selectedChoices(page, 'exportSize')).toEqual(['2000']);
    expect(await selectedChoices(page, 'exportFormat')).toEqual(['JPEG']);
  });
  await hand.tap(page.locator('#btnCornerShots'));
  await check('Corner shots starts on 1 sheet', async () => {
    expect(await selectedChoices(page, 'cornerOutput')).toEqual(['1 sheet']);
  });
});

test('SEC-09.2 Remembered preferences that aren\'t JSON are ignored [phone]', async ({
  page,
  check,
}, testInfo) => {
  await storePrefsText(page, '{"cropPreset": "4:3", export:');
  const hand = await startWith(page, testInfo);
  await goToStep(page, 'crop', hand);
  await check('Crop starts at 1:1, and no error is in the console', async () => {
    expect(await selectedChips(page)).toEqual(['1:1']);
    expect(check.consoleErrors()).toEqual([]);
  });
});

/* ---------------- SEC-10 What a logo file may be ---------------- */

// An SVG logo that states no size: no width, no height and no viewBox.
function unsizedSvg() {
  const markup = '<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"/></svg>';
  return { name: 'no-size.svg', mimeType: 'image/svg+xml', buffer: Buffer.from(markup) };
}

// An SVG logo with a script and an onload handler in it; each would set a mark on the page if
// it ran.
function svgWithScript() {
  const markup = '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100" '
    + 'onload="window.parent.testSvgRan = 1">'
    + '<script>window.parent.testSvgRan = 2;</script>'
    + '<rect width="200" height="100" fill="#e5322d"/></svg>';
  return { name: 'with-script.svg', mimeType: 'image/svg+xml', buffer: Buffer.from(markup) };
}

test('SEC-10.1 An SVG with no size is refused [phone]', async ({ page, check }, testInfo) => {
  const hand = await startWith(page, testInfo);
  await goToStep(page, 'overlay', hand);
  await chooseBadLogo(page, hand, page.locator('#btnOverlayAdd'), unsizedSvg());
  await check(`the line above the controls reads "${NO_SIZE}"; no logo is placed`, async () => {
    await expect(page.locator('#overlayStatus')).toHaveText(NO_SIZE);
    expect((await editState(page)).overlay).toBeNull();
  });
});

test('SEC-10.2 An SVG logo\'s script never runs [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startWith(page, testInfo);
  await goToStep(page, 'overlay', hand);
  await chooseLogo(page, hand, page.locator('#btnOverlayAdd'), svgWithScript());
  await page.waitForTimeout(SETTLE_MS);
  await check('the logo is placed on the photo', async () => {
    expect((await editState(page)).overlay).not.toBeNull();
  });
  await check('neither its script nor its onload handler ran', async () => {
    expect(await page.evaluate(() => window.testSvgRan)).toBeUndefined();
  });
});

test('SEC-10.3 With a lower limit from a link, the refusal names it [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startWith(page, testInfo, { address: 'index.html?overlay.maxBytes=65536' });
  await goToStep(page, 'overlay', hand);
  const logo = oversizedPng(LOWERED_LOGO_TEST_BYTES);
  await check('the hint above the controls says "up to 5 MB"', async () => {
    await expect(page.locator('section[data-panel="overlay"]')).toContainText('up to 5 MB');
  });
  await chooseBadLogo(page, hand, page.locator('#btnOverlayAdd'), logo);
  await check(`the line reads "${LOWERED_LIMIT_MESSAGE}"`, async () => {
    await expect(page.locator('#overlayStatus')).toHaveText(LOWERED_LIMIT_MESSAGE);
  });
});

/* ---------------- SEC-11 File names are shown as plain text, cut short ---------------- */

// A photo file whose name is markup, long enough to be cut: a copy of the case photo.
function photoWithMarkupName() {
  const name = `${MARKUP_NAME_START}${'x'.repeat(KEPT_NAME_LENGTH + 40)}.JPEG`;
  return { name, mimeType: 'image/jpeg', buffer: fs.readFileSync(samplePath(PHOTO)) };
}

test('SEC-11.1 A photo\'s name with markup shows as text on the Resume card, cut to 60 '
  + '[phone] [webkit]', async ({ page, check }, testInfo) => {
  await openApp(page);
  const hand = handFor(page, testInfo);
  const photo = photoWithMarkupName();
  await pickWith(page, hand, page.locator('#btnOpenEmpty'), photo);
  await page.waitForFunction(() => !!window.__straightener.app.geometry);
  await turnRight(page, hand);
  await waitForSaved(page, { quarter: 1 });
  await reloadToStart(page);
  const expected = `${photo.name.slice(0, SHORT_NAME_LENGTH - 1)}…`;
  await check(`the card reads the name as typed, cut to 60 characters: "${expected}"`, async () => {
    await expect(page.locator('#resumeName')).toHaveText(expected);
    expect(await page.locator('#resumeName').evaluate(el => el.children.length)).toBe(0);
  });
  await hand.tap(page.locator('#btnResume'));
  await page.waitForFunction(() => !!window.__straightener.app.geometry);
  await check('the photo opens turned a quarter right, and nothing the name holds has run',
    async () => {
      expect((await editState(page)).rotation.quarter).toBe(1);
      expect(await page.evaluate(() => window.testRan)).toBeUndefined();
    });
  await goToStep(page, 'export', hand);
  await openOptions(page, hand, 'export');
  const kept = `${photo.name.slice(0, KEPT_NAME_LENGTH - 1)}…`;
  await check('the source line in Export options ends with the name cut to 200 characters',
    async () => {
      const line = await page.locator('#sourceInfo').textContent();
      expect(line.endsWith(` · ${kept}`)).toBe(true);
    });
});

test('SEC-11.2 An edits file\'s name with markup shows as text in the warning, cut to 60 '
  + '[phone]', async ({ page, check }, testInfo) => {
  const hand = await startWith(page, testInfo);
  const edits = await saveEditsFile(page, hand);
  const name = `${MARKUP_NAME_START}${'y'.repeat(80)}.JPEG`;
  edits.source.name = name;
  await loadEditsFile(page, hand, editsPayload(edits));
  const shown = await waitForToast(page, SAVED_FOR);
  const cut = `${name.slice(0, SHORT_NAME_LENGTH - 1)}…`;
  await check(`an amber warning reads "Edits were saved for “${cut}”. Applied anyway — sizes `
    + 'match."', async () => {
    expect(shown.text).toBe(`${SAVED_FOR}${cut}”. Applied anyway — sizes match.`);
    expect(shown.kind).toBe('warn');
    const toastChildren = await page.locator('#toast .toast-text')
      .evaluate(el => el.children.length);
    expect(toastChildren).toBe(0);
  });
});

/* ---------------- SEC-14 No console error in normal use ---------------- */

test('SEC-14.1 A whole edit and export puts no error in the console [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  await watchPolicyRefusals(page);
  const hand = await startWith(page, testInfo);
  await turnRight(page, hand);
  await goToStep(page, 'crop', hand);
  await hand.tap(presetChip(page, '4:3'));
  await goToStep(page, 'levels', hand);
  await hand.tap(page.locator('#toolAutoLevels'));
  await hand.tap(page.locator('#btnApplyLevels'));
  await goToStep(page, 'overlay', hand);
  await addLogo(page, hand, page.locator('#btnOverlayAdd'), 'icon.svg');
  await goToStep(page, 'export', hand);
  const saved = await saveByDownload(page, hand, 'No');
  // Read before the first verdict: WebKit's screenshot adds a stylesheet of the tool's own,
  // which the policy refuses (support/case.js).
  const refusals = await policyRefusals(page);
  const errors = check.consoleErrors();
  await check('the photo was exported as IMG_9136-straight.jpg', async () => {
    expect(saved.name).toBe('IMG_9136-straight.jpg');
  });
  await check('no error is in the console, and the policy refused nothing', async () => {
    expect(errors).toEqual([]);
    expect(refusals).toEqual([]);
  });
});

/* ---------------- SEC-15 A logo from storage is checked before use ---------------- */

test('SEC-15.1 A stored logo of an unknown type is not offered [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startWith(page, testInfo);
  await goToStep(page, 'overlay', hand);
  await addLogo(page, hand, page.locator('#btnOverlayAdd'), 'icon.svg');
  await page.waitForFunction(async () => !!(await window.__straightener.Session.get('overlay')));
  await changeSavedRecord(page, 'overlay', { type: 'text/html' });
  await reloadToStart(page);
  await hand.tap(page.locator('#btnFresh'));
  await openPhoto(page, PHOTO);
  await goToStep(page, 'overlay', hand);
  await check('Use saved overlay is not shown; Add logo is', async () => {
    await expect(page.locator('#btnUseSaved')).toBeHidden();
    await expect(page.locator('#btnOverlayAdd')).toBeVisible();
  });
});

test('SEC-15.2 A stored logo whose bytes are damaged is refused when used [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startWith(page, testInfo);
  await goToStep(page, 'overlay', hand);
  await addLogo(page, hand, page.locator('#btnOverlayAdd'), 'apple-touch-icon.png');
  await page.waitForFunction(async () => !!(await window.__straightener.Session.get('overlay')));
  await page.evaluate(async () => {
    const Session = window.__straightener.Session;
    const record = await Session.get('overlay');
    record.buf = new TextEncoder().encode('Not a picture any more.').buffer;
    await Session.put('overlay', record);
  });
  await reloadToStart(page);
  await hand.tap(page.locator('#btnFresh'));
  await openPhoto(page, PHOTO);
  await goToStep(page, 'overlay', hand);
  await hand.tap(page.locator('#btnUseSaved'));
  await check(`the line above the controls reads "${CANT_READ}"; no logo is placed`,
    async () => {
      await expect(page.locator('#overlayStatus')).toHaveText(CANT_READ);
      expect((await editState(page)).overlay).toBeNull();
    });
});
