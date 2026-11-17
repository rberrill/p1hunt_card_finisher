// The Question card cases (tests/catalog/question-cards.md): the one question box for the
// Upscale, Unpair and New photo questions, how it closes, its red choice, keyboard focus, what it
// blocks, the dim, an open sheet under it, when it is taken down, its fade, and a change of
// layout.
// Each test drives the app as a person would, through hand.tap (a finger on the phone targets,
// the mouse on the wide ones), the keyboard and the clipboard, and reads the app's state only to
// check a result.
// Every row of a case has its own check, in order, described in the row's own words.
'use strict';
const { test, expect } = require('./support/case.js');
const { samplePath, waitForStill } = require('./support/app.js');
const {
  choiceButton,
  selectedChoices,
  copyPhotoToClipboard,
  waitForQuestion,
} = require('./support/export.js');
const {
  PORTRAIT_PAIR,
  makePair,
  chooseInPicker,
  openSide,
  sideButton,
} = require('./support/front-and-back.js');
const {
  CORNER_PHOTO,
  startOnExport,
  questionCard,
  questionButton,
  expectQuestion,
  isQuestionUp,
  imageSize,
  collectDownloads,
  downloadsAfterWait,
  downloadsArrived,
  boxOf,
} = require('./support/corner-shots.js');
const {
  QUESTION_BOX,
  askAndCheck,
  answerAndCheckClosed,
  openCornerSheetAndCheck,
} = require('./support/questions.js');

const ASK_2000 = 'Upscale to 2000 px?';
const CROP_TEXT = 'The crop is 1074 × 1074 px at the photo’s resolution.';
const UNPAIR_TEXT = 'Keep one side as a single photo.';
const NEW_PHOTO_TEXT = 'End the pair, or replace the side you’re on?';
// The case photo's crop at its own resolution, in px.
const CROP_PX = 1074;
// The photo pasted in QCD-08, and the name the app gives a pasted photo.
const PASTED_PHOTO = 'IMG_9136.JPEG';
const PASTED_NAME = 'pasted-photo';
// P1Hunt red (CONFIG.theme.accent, #e5322d), as the browser writes a background color.
const P1HUNT_RED = 'rgb(229, 50, 45)';
// How long a case waits to be sure a tap saved nothing, in ms.
const NOTHING_SAVED_WAIT_MS = 1500;
// How far down the page a tap on the dimmed screen above the question box lands, in CSS px.
const ABOVE_BOX_Y_PX = 150;
// How close two page positions must be, in CSS px.
const PLACE_TOLERANCE_PX = 2;
// The question box's fade in and out, and the fade in under reduced motion, in seconds as the
// browser writes them; and the moment of the fade in, in ms, at which QCD-09.2 stops it for its
// picture.
const FADE_IN = '0.18s';
const FADE_OUT = '0.12s';
const REDUCED_FADE = '0.1s';
const HALF_FADE_MS = 90;
// The window sizes QCD-10.1 turns to and back from, in CSS px: a phone turned to landscape (over
// 760 px wide, so the wide layout), and a wide window narrowed to a phone's layout.
const PHONE_LANDSCAPE = { width: 844, height: 390 };
const NARROW_DESKTOP = { width: 700, height: 800 };
// The first row's words for the question box, with its definition.
const FIRST_ASK = `${QUESTION_BOX} asks "${ASK_2000}"`;

// The Download button on Export.
const downloadButton = page => page.locator('#btnDownload');

// The question box's title, its line and its three buttons' labels, as the screen shows them.
async function boxWords(page) {
  const box = questionCard(page);
  return {
    title: (await box.locator('.alert-title').textContent()).trim(),
    text: (await box.locator('.alert-text').textContent()).trim(),
    buttons: (await box.locator('button').allTextContents()).map(label => label.trim()),
  };
}

// Where the question box's three buttons are: { first, second, cancel } as page boxes, once the
// box has finished growing in.
async function buttonPlaces(page) {
  await waitForStill(page);
  return {
    first: await boxOf(page.locator('#btnPromptFirst')),
    second: await boxOf(page.locator('#btnPromptSecond')),
    cancel: await boxOf(page.locator('#btnPromptCancel')),
  };
}

// Expects the two choices side by side, the same height, the first on the left, and Cancel
// beneath them, as wide as the two together.
function expectChoicesLaidOut(places) {
  const { first, second, cancel } = places;
  expect(Math.abs(first.y - second.y)).toBeLessThan(PLACE_TOLERANCE_PX);
  expect(Math.abs(first.height - second.height)).toBeLessThan(PLACE_TOLERANCE_PX);
  expect(first.x + first.width).toBeLessThanOrEqual(second.x);
  expect(cancel.y).toBeGreaterThanOrEqual(first.y + first.height);
  expect(Math.abs(cancel.x - first.x)).toBeLessThan(PLACE_TOLERANCE_PX);
  const choicesRight = second.x + second.width;
  expect(Math.abs(cancel.x + cancel.width - choicesRight)).toBeLessThan(PLACE_TOLERANCE_PX);
}

// The background color of one of the question box's buttons, as the browser writes it.
const backgroundOf = locator => locator.evaluate(el => getComputedStyle(el).backgroundColor);

// True when one of the question box's buttons has the red main look.
const isRed = async locator => (await backgroundOf(locator)) === P1HUNT_RED;

// Taps Download on Export and waits for the Upscale question.
async function askToUpscale(page, hand) {
  await waitForQuestion(page, false);
  await hand.tap(downloadButton(page));
  await waitForQuestion(page, true);
}

// Open 01_chrome_flat_black.JPEG, the cases' named action, while paired: Open, then the photo
// in the picker, which asks the New photo question.
async function openWhilePaired(page, hand) {
  await chooseInPicker(page, hand, page.locator('#btnOpen'), CORNER_PHOTO);
  await waitForQuestion(page, true);
}

// The name of the photo on screen and which side of a pair is open (null when none).
async function onScreen(page) {
  return {
    name: await page.evaluate(() => window.__straightener.app.state.source.name),
    side: await openSide(page),
  };
}

// The verdict that the pair is still open, the back on screen and Back in white.
async function expectBackStillOpen(page) {
  expect(await onScreen(page)).toEqual({ name: PORTRAIT_PAIR.back, side: 'back' });
  await expect(sideButton(page, 'back')).toHaveAttribute('aria-pressed', 'true');
}

// Records, from before the app loads, the order in which a question box closes and a file
// download starts, in window.testOrder ('closed' and 'saved').
async function recordCloseAndSave(page) {
  await page.addInitScript(() => {
    window.testOrder = [];
    // alertclose doesn't bubble, so it is caught on its way down.
    document.addEventListener('alertclose', () => window.testOrder.push('closed'), true);
    document.addEventListener('click', event => {
      const link = event.target;
      if (link instanceof HTMLAnchorElement && link.download) window.testOrder.push('saved');
    }, true);
  });
}

test('QCD-01.1 The Upscale question: a title, a line, two choices side by side and Cancel '
  + 'beneath [phone]', async ({ page, check }, testInfo) => {
  const hand = await startOnExport(page, testInfo);
  await askToUpscale(page, hand);
  await check(`${QUESTION_BOX} shows, titled "${ASK_2000}", with one line, "${CROP_TEXT}"`,
    async () => {
      expect(await boxWords(page)).toEqual({
        title: ASK_2000,
        text: CROP_TEXT,
        buttons: ['Yes', 'No', 'Cancel'],
      });
    });
  await check('Yes and No side by side, the same height, Yes on the left; Cancel beneath, as wide '
    + 'as both', async () => {
    expectChoicesLaidOut(await buttonPlaces(page));
  });
});

test('QCD-01.2 The pair\'s questions come in the same question box [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await makePair(page, testInfo, PORTRAIT_PAIR);
  await hand.tap(page.locator('#btnUnpair'));
  await waitForQuestion(page, true);
  await check(`${QUESTION_BOX} shows, titled "Unpair", with one line, "${UNPAIR_TEXT}"; Keep `
    + 'front and Keep back side by side, Cancel beneath them', async () => {
    expect(await boxWords(page)).toEqual({
      title: 'Unpair',
      text: UNPAIR_TEXT,
      buttons: ['Keep front', 'Keep back', 'Cancel'],
    });
    expectChoicesLaidOut(await buttonPlaces(page));
  });
  await answerAndCheckClosed(page, hand, check, 'Cancel', 'the question box closes');
  await openWhilePaired(page, hand);
  await check(`the question box shows, titled "New photo", with one line, "${NEW_PHOTO_TEXT}"; `
    + 'New photo and Replace back side by side, Cancel beneath them', async () => {
    expect(await boxWords(page)).toEqual({
      title: 'New photo',
      text: NEW_PHOTO_TEXT,
      buttons: ['New photo', 'Replace back', 'Cancel'],
    });
    expectChoicesLaidOut(await buttonPlaces(page));
  });
});

test('QCD-02.1 Cancel and a tap outside leave the pair and open nothing [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await makePair(page, testInfo, PORTRAIT_PAIR);
  await openWhilePaired(page, hand);
  await check(`${QUESTION_BOX} asks "New photo"`, async () => {
    await expectQuestion(page, 'New photo', NEW_PHOTO_TEXT);
  });
  await answerAndCheckClosed(page, hand, check, 'Cancel', 'the question box closes; Front / Back '
    + 'is still in the top bar, Back in white, and the back is on screen', async () => {
    await expectBackStillOpen(page);
  });
  await openWhilePaired(page, hand);
  await check('the question box asks "New photo" again', async () => {
    await expectQuestion(page, 'New photo');
  });
  await page.touchscreen.tap(page.viewportSize().width / 2, ABOVE_BOX_Y_PX);
  await waitForQuestion(page, false);
  // A moment for anything the tap might have started.
  await page.waitForTimeout(NOTHING_SAVED_WAIT_MS);
  await check('the question box closes; the pair is still open, the back on screen, and '
    + '01_chrome_flat_black.JPEG was not opened', async () => {
    expect(await isQuestionUp(page)).toBe(false);
    await expectBackStillOpen(page);
  });
});

test('QCD-02.2 Escape closes the question box and keeps the pair [desktop]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await makePair(page, testInfo, PORTRAIT_PAIR);
  await askAndCheck(page, hand, check, page.locator('#btnUnpair'),
    `${QUESTION_BOX} asks "Unpair"`, 'Unpair', UNPAIR_TEXT);
  await page.keyboard.press('Escape');
  await waitForQuestion(page, false);
  await check('the question box closes; Front / Back is still in the top bar, Back in white',
    async () => {
      expect(await isQuestionUp(page)).toBe(false);
      await expectBackStillOpen(page);
    });
});

test('QCD-03.1 Yes is red, and closes the question box before the file is saved [phone]',
  async ({ page, check }, testInfo) => {
    await recordCloseAndSave(page);
    const hand = await startOnExport(page, testInfo);
    await askToUpscale(page, hand);
    await check(`${FIRST_ASK}; Yes is red (P1Hunt red, #e5322d), No is not`, async () => {
      await expectQuestion(page, ASK_2000);
      expect(await isRed(page.locator('#btnPromptFirst'))).toBe(true);
      expect(await isRed(page.locator('#btnPromptSecond'))).toBe(false);
    });
    const collector = collectDownloads(page);
    await hand.tap(questionButton(page, 'Yes'));
    await downloadsArrived(page, collector, 1);
    collector.stop();
    await check('the question box closes first; then the file is saved', async () => {
      expect(await page.evaluate(() => window.testOrder)).toEqual(['closed', 'saved']);
    });
  });

test('QCD-03.2 The pair\'s questions have no red choice [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await makePair(page, testInfo, PORTRAIT_PAIR);
  await hand.tap(page.locator('#btnUnpair'));
  await waitForQuestion(page, true);
  await check(`${QUESTION_BOX} asks "Unpair"; neither Keep front nor Keep back is red`,
    async () => {
      await expectQuestion(page, 'Unpair');
      expect(await isRed(page.locator('#btnPromptFirst'))).toBe(false);
      expect(await isRed(page.locator('#btnPromptSecond'))).toBe(false);
    });
  await answerAndCheckClosed(page, hand, check, 'Cancel', 'the question box closes');
  await openWhilePaired(page, hand);
  await check('the question box asks "New photo"; neither New photo nor Replace back is red',
    async () => {
      await expectQuestion(page, 'New photo');
      expect(await isRed(page.locator('#btnPromptFirst'))).toBe(false);
      expect(await isRed(page.locator('#btnPromptSecond'))).toBe(false);
    });
});

// The id of the element that has the keyboard focus.
const focusedId = page => page.evaluate(() => document.activeElement.id);

test('QCD-04.1 The focus starts on the first choice, stays in the question box, and goes back '
  + 'to Download [desktop]', async ({ page, check }, testInfo) => {
  const hand = await startOnExport(page, testInfo);
  await askToUpscale(page, hand);
  await check(`${FIRST_ASK}; the focus is on Yes`, async () => {
    await expectQuestion(page, ASK_2000);
    expect(await focusedId(page)).toBe('btnPromptFirst');
  });
  await page.keyboard.press('Tab');
  await check('the focus moves to No', async () => {
    expect(await focusedId(page)).toBe('btnPromptSecond');
  });
  await page.keyboard.press('Tab');
  await check('the focus moves to Cancel', async () => {
    expect(await focusedId(page)).toBe('btnPromptCancel');
  });
  await page.keyboard.press('Tab');
  await check('the focus goes back to Yes, not to anything behind the question box', async () => {
    expect(await focusedId(page)).toBe('btnPromptFirst');
  });
  await page.keyboard.press('Shift+Tab');
  await check('the focus goes to Cancel', async () => {
    expect(await focusedId(page)).toBe('btnPromptCancel');
  });
  await page.keyboard.press('Escape');
  await waitForQuestion(page, false);
  await check('the question box closes, and the focus is back on Download', async () => {
    expect(await focusedId(page)).toBe('btnDownload');
  });
});

// Clicks the middle of an element with the mouse, at its place on the page, as a person does:
// the click lands on whatever is on top there.
async function clickAt(page, locator) {
  const box = await boxOf(locator);
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
}

// Taps the middle of an element with a finger, at its place on the page: the tap lands on
// whatever is on top there.
async function tapAt(page, locator) {
  const box = await boxOf(locator);
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
}

// The step the app is on.
const stepNow = page => page.evaluate(() => window.__straightener.app.tab);

test('QCD-05.1 On a wide screen, shortcuts, the top bar and the panel do nothing while the '
  + 'question box is up [desktop]', async ({ page, check }, testInfo) => {
  const hand = await startOnExport(page, testInfo);
  await hand.tap(choiceButton(page, 'exportFormat', 'PNG'));
  await check('PNG is selected', async () => {
    expect(await selectedChoices(page, 'exportFormat')).toEqual(['PNG']);
  });
  await askToUpscale(page, hand);
  await check(`${FIRST_ASK} over the photo; the panel at the right stays uncovered`, async () => {
    await expectQuestion(page, ASK_2000);
    const layer = await boxOf(questionCard(page));
    const panel = await boxOf(page.locator('#panel'));
    expect(layer.x + layer.width).toBeLessThanOrEqual(panel.x + PLACE_TOLERANCE_PX);
  });
  await page.keyboard.press('Control+z');
  await check('nothing changes: PNG is still selected, and the question box is still up',
    async () => {
      expect(await selectedChoices(page, 'exportFormat')).toEqual(['PNG']);
      expect(await isQuestionUp(page)).toBe(true);
    });
  await page.keyboard.press('2');
  await check('still on Export, and the question box is still up', async () => {
    expect(await stepNow(page)).toBe('export');
    expect(await isQuestionUp(page)).toBe(true);
  });
  await clickAt(page, page.locator('#topBarHost [data-step="rotate"]'));
  await check('a click on Rotate in the top bar: still on Export, and the question box is still '
    + 'up', async () => {
    expect(await stepNow(page)).toBe('export');
    expect(await isQuestionUp(page)).toBe(true);
  });
  await clickAt(page, choiceButton(page, 'exportFormat', 'JPEG'));
  await check('a click on JPEG in the panel: PNG is still selected, and the question box is '
    + 'still up', async () => {
    expect(await selectedChoices(page, 'exportFormat')).toEqual(['PNG']);
    expect(await isQuestionUp(page)).toBe(true);
  });
  await page.keyboard.press('Escape');
  await waitForQuestion(page, false);
  await check('the question box closes', async () => {
    expect(await isQuestionUp(page)).toBe(false);
  });
});

test('QCD-05.2 On a phone, a tap on the top bar or the step tabs only reaches the dim [phone]',
  async ({ page, check }, testInfo) => {
    const hand = await startOnExport(page, testInfo);
    await hand.tap(choiceButton(page, 'exportFormat', 'PNG'));
    await check('PNG is selected, and Undo is live', async () => {
      expect(await selectedChoices(page, 'exportFormat')).toEqual(['PNG']);
      await expect(page.locator('#btnUndo')).toBeEnabled();
    });
    await askToUpscale(page, hand);
    await check(`${FIRST_ASK}; the whole screen behind it is dimmed`, async () => {
      await expectQuestion(page, ASK_2000);
      const layer = await boxOf(questionCard(page));
      expect(layer).toEqual({ x: 0, y: 0, ...page.viewportSize() });
    });
    await tapAt(page, page.locator('#btnUndo'));
    await waitForQuestion(page, false);
    await check('the question box closes, as for any tap outside it; PNG is still selected',
      async () => {
        expect(await isQuestionUp(page)).toBe(false);
        expect(await selectedChoices(page, 'exportFormat')).toEqual(['PNG']);
      });
    await askAndCheck(page, hand, check, downloadButton(page),
      `the question box asks "${ASK_2000}" again`, ASK_2000);
    await tapAt(page, page.locator('#tabBarHost [data-step="rotate"]'));
    await waitForQuestion(page, false);
    await check('the question box closes; the app is still on the Export step', async () => {
      expect(await isQuestionUp(page)).toBe(false);
      expect(await stepNow(page)).toBe('export');
    });
  });

test('QCD-06.1 The dim and the question box\'s place, for a person to judge [both]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnExport(page, testInfo);
  await askToUpscale(page, hand);
  await waitForStill(page);
  const box = await boxOf(page.locator('#pairPrompt .alert-card'));
  const layer = await boxOf(questionCard(page));
  const boxMiddleY = box.y + box.height / 2;
  if (hand.isTouch) {
    const topBar = await boxOf(page.locator('#topBarHost'));
    const controls = await boxOf(page.locator('#exportArea'));
    await check(`${QUESTION_BOX} shows; the dim covers the whole window, top bar and step tabs `
      + 'included; the box\'s middle is halfway between the top bar and the controls',
    async () => {
      expect(layer).toEqual({ x: 0, y: 0, ...page.viewportSize() });
      const halfway = (topBar.y + topBar.height + controls.y) / 2;
      expect(Math.abs(boxMiddleY - halfway)).toBeLessThan(PLACE_TOLERANCE_PX);
    });
    await check.eye('everything behind the question box evenly darker; the box light enough to '
      + 'read at once');
    return;
  }
  const stage = await boxOf(page.locator('#stage'));
  const panel = await boxOf(page.locator('#panel'));
  await check('the dim covers only the photo; the question box is centered on the photo; the '
    + 'side panel is not covered', async () => {
    expect(layer).toEqual(stage);
    expect(Math.abs(boxMiddleY - (stage.y + stage.height / 2))).toBeLessThan(PLACE_TOLERANCE_PX);
    expect(layer.x + layer.width).toBeLessThanOrEqual(panel.x + PLACE_TOLERANCE_PX);
  });
  await check.eye('the photo darker behind the question box; the top bar and the side panel as '
    + 'bright as before and readable');
});

test('QCD-07.1 Cancel in a question box over an open sheet leaves the sheet open [phone]',
  async ({ page, check }, testInfo) => {
    const hand = await startOnExport(page, testInfo);
    await openCornerSheetAndCheck(page, hand, check);
    const collector = collectDownloads(page);
    await askAndCheck(page, hand, check, page.locator('#btnCornerDownload'),
      `${FIRST_ASK} in front of the sheet`, ASK_2000);
    await hand.tap(questionButton(page, 'Cancel'));
    await waitForQuestion(page, false);
    const count = await downloadsAfterWait(page, collector, NOTHING_SAVED_WAIT_MS);
    collector.stop();
    await check('the question box closes; the Corner shots sheet is still open, and nothing is '
      + 'saved', async () => {
      expect(await isQuestionUp(page)).toBe(false);
      expect(await page.evaluate(() => window.CF.isSheetOpen(
        document.getElementById('cornerShotsSheet'),
      ))).toBe(true);
      expect(count).toBe(0);
    });
  });

// Lets the case read and write the clipboard (Chromium only), and copies a sample photo to it
// as an image viewer's Copy does.
async function copyPhotoFirst(page, context, browserName) {
  test.skip(browserName !== 'chromium', 'Only Chromium lets a test write images to the clipboard');
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await copyPhotoToClipboard(page, samplePath(PASTED_PHOTO));
}

test('QCD-08.1 A photo pasted while the Upscale question is up takes it down and opens '
  + '[desktop]', async ({ page, context, browserName, check }, testInfo) => {
  const hand = await startOnExport(page, testInfo);
  await copyPhotoFirst(page, context, browserName);
  await askToUpscale(page, hand);
  await check(FIRST_ASK, async () => {
    await expectQuestion(page, ASK_2000);
  });
  const collector = collectDownloads(page);
  await page.keyboard.press('Control+v');
  await page.waitForFunction(name => {
    const app = window.__straightener.app;
    return app.state.source.name === name && app.detection.message === '';
  }, PASTED_NAME);
  const count = await downloadsAfterWait(page, collector, NOTHING_SAVED_WAIT_MS);
  collector.stop();
  await check('the question box goes, nothing is saved, and the pasted photo opens on the '
    + 'Perspective step', async () => {
    expect(await isQuestionUp(page)).toBe(false);
    expect(count).toBe(0);
    expect(await stepNow(page)).toBe('perspective');
  });
});

test('QCD-08.2 A photo pasted while Unpair is asked replaces it with the New photo question '
  + '[desktop]', async ({ page, context, browserName, check }, testInfo) => {
  const hand = await makePair(page, testInfo, PORTRAIT_PAIR);
  await copyPhotoFirst(page, context, browserName);
  await askAndCheck(page, hand, check, page.locator('#btnUnpair'),
    `${QUESTION_BOX} asks "Unpair"`, 'Unpair', UNPAIR_TEXT);
  await page.keyboard.press('Control+v');
  await check(`the Unpair question goes, and the question box asks "New photo": `
    + `"${NEW_PHOTO_TEXT}"`, async () => {
    await expect(questionCard(page).locator('.alert-title')).toHaveText('New photo');
    await expectQuestion(page, 'New photo', NEW_PHOTO_TEXT);
  });
});

// The question box's look as the browser computes it now: its transition's properties and
// durations, its transform, the layer's pointer events and whether it is hidden or open.
function boxLook(page) {
  return page.evaluate(() => {
    const layer = document.getElementById('pairPrompt');
    const box = layer.querySelector('.alert-card');
    const boxStyle = getComputedStyle(box);
    return {
      properties: boxStyle.transitionProperty,
      durations: boxStyle.transitionDuration,
      transform: boxStyle.transform,
      pointerEvents: getComputedStyle(layer).pointerEvents,
      isHidden: layer.hidden,
      isOpen: window.CF.isAlertOpen(layer),
    };
  });
}

// Records, at each touch from now on, whether the question box's layer was still shown (fading
// out) at that moment, in window.testTouchesWhileShown.
function recordTouchesWhileShown(page) {
  return page.evaluate(() => {
    window.testTouchesWhileShown = [];
    window.addEventListener('pointerdown', () => {
      const layer = document.getElementById('pairPrompt');
      window.testTouchesWhileShown.push(!layer.hidden);
    }, true);
  });
}

test('QCD-09.1 A closing question box takes no touch, and reduced motion only fades it '
  + '[phone]', async ({ page, check }, testInfo) => {
  const hand = await startOnExport(page, testInfo);
  await hand.tap(downloadButton(page));
  const opening = await boxLook(page);
  await waitForQuestion(page, true);
  await check(`${QUESTION_BOX} fades in over 180 ms, growing slightly as it comes`, async () => {
    expect(opening.properties).toBe('opacity, transform');
    expect(opening.durations).toBe(`${FADE_IN}, ${FADE_IN}`);
    expect(opening.transform).not.toBe('none');
  });
  const yesPlace = await boxOf(page.locator('#btnPromptFirst'));
  const collector = collectDownloads(page);
  await recordTouchesWhileShown(page);
  await hand.tap(questionButton(page, 'Cancel'));
  const closing = await boxLook(page);
  await page.touchscreen.tap(yesPlace.x + yesPlace.width / 2, yesPlace.y + yesPlace.height / 2);
  await check('the question box starts to fade out, over 120 ms, and takes no more touches',
    async () => {
      expect(closing).toMatchObject({ isOpen: false, isHidden: false, pointerEvents: 'none' });
      expect(closing.durations.split(', ')).toContain(FADE_OUT);
    });
  const count = await downloadsAfterWait(page, collector, NOTHING_SAVED_WAIT_MS);
  collector.stop();
  await check('the tap within the fade out reaches nothing in the question box: no file is saved',
    async () => {
      const touches = await page.evaluate(() => window.testTouchesWhileShown);
      expect(touches).toEqual([true, true]);
      expect(count).toBe(0);
    });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await check('with reduced motion on, nothing changes on screen', async () => {
    expect(await isQuestionUp(page)).toBe(false);
    await expect(page.locator('#pairPrompt')).toBeHidden();
  });
  await askToUpscale(page, hand);
  const reduced = await boxLook(page);
  await check('the question box only fades in, over 100 ms, at its full size from the start',
    async () => {
      expect(reduced.durations.split(', ').every(duration => duration === REDUCED_FADE))
        .toBe(true);
      expect(reduced.transform).toBe('none');
    });
});

test('QCD-09.2 The question box fading in, for a person to judge [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnExport(page, testInfo);
  await hand.tap(downloadButton(page));
  // The fade is stopped half way so the picture shows it; a person sees it pass in 180 ms.
  await page.evaluate(stopAtMs => {
    for (const animation of document.getAnimations()) {
      animation.pause();
      animation.currentTime = stopAtMs;
    }
  }, HALF_FADE_MS);
  await check.eye('in the picture, the question box and its words partly see-through and '
    + 'slightly smaller than at rest, centered where it will settle; the dim partly in');
  await page.evaluate(() => {
    for (const animation of document.getAnimations()) animation.play();
  });
  await check.eye('the question box solid, at full size; the dim even');
});

// The verdict on the layout as it is now, for QCD-10.1. In the wide layout the controls are in
// the panel at the right of the photo and the dim covers only the photo; in the phone layout the
// step tabs are along the bottom and the dim covers the whole window.
async function expectLayout(page, isWide) {
  const layer = await boxOf(questionCard(page));
  if (isWide) {
    const stage = await boxOf(page.locator('#stage'));
    const panel = await boxOf(page.locator('#panel'));
    expect(layer).toEqual(stage);
    expect(panel.x).toBeGreaterThanOrEqual(stage.x + stage.width - PLACE_TOLERANCE_PX);
    return;
  }
  const size = page.viewportSize();
  expect(layer).toEqual({ x: 0, y: 0, ...size });
  const tabs = page.locator('#tabBarHost');
  await expect(tabs).toBeVisible();
  const tabsBox = await boxOf(tabs);
  expect(tabsBox.y + tabsBox.height).toBeGreaterThan(size.height - PLACE_TOLERANCE_PX);
}

// The verdict that the question box is still up, asking the Upscale question with its three
// buttons.
async function expectStillAsking(page) {
  expect(await isQuestionUp(page)).toBe(true);
  expect(await boxWords(page)).toEqual({
    title: ASK_2000,
    text: CROP_TEXT,
    buttons: ['Yes', 'No', 'Cancel'],
  });
}

test('QCD-10.1 The question box stays up through a change of layout and back, and still '
  + 'answers [both]', async ({ page, check }, testInfo) => {
  const hand = await startOnExport(page, testInfo);
  const startSize = page.viewportSize();
  const isWideAtStart = !hand.isTouch;
  await askToUpscale(page, hand);
  await check(`${FIRST_ASK}; on the phone-width window the dim covers the whole window, on the `
    + 'wide one only the photo', async () => {
    await expectQuestion(page, ASK_2000);
    await expectLayout(page, isWideAtStart);
  });
  await page.setViewportSize(hand.isTouch ? PHONE_LANDSCAPE : NARROW_DESKTOP);
  await waitForStill(page);
  await check('the layout changes (at 844 px the controls in a panel at the right and the dim '
    + 'over the photo only; at 700 px the step tabs at the bottom and the dim over the whole '
    + 'window); the question box is still up, with Yes, No and Cancel', async () => {
    await expectLayout(page, !isWideAtStart);
    await expectStillAsking(page);
  });
  await page.setViewportSize(startSize);
  await waitForStill(page);
  await check('the layout changes back, and the dim with it; the question box is still up, with '
    + 'the same question', async () => {
    await expectLayout(page, isWideAtStart);
    await expectStillAsking(page);
  });
  const collector = collectDownloads(page);
  await hand.tap(questionButton(page, 'No'));
  const [saved] = await downloadsArrived(page, collector, 1);
  collector.stop();
  await check(`the question box closes, and a file of ${CROP_PX} × ${CROP_PX} px is saved`,
    async () => {
      expect(await isQuestionUp(page)).toBe(false);
      expect(await imageSize(page, saved.file)).toEqual([CROP_PX, CROP_PX]);
    });
});
