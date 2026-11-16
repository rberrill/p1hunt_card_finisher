// The Question card cases (tests/catalog/question-cards.md): the one card for the Upscale,
// Unpair and New photo questions, how it closes, its red choice, keyboard focus, what it blocks,
// the dim, an open sheet under it, when it is taken down, its fade, and a change of layout.
// Each test drives the app as a person would, through hand.tap (a finger on the phone targets,
// the mouse on the wide ones), the keyboard and the clipboard, and reads the app's state only to
// check a result.
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
  openCornerSheet,
  isCornerSheetOpen,
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
// How far down the page a tap on the dimmed screen above the card lands, in CSS px.
const ABOVE_CARD_Y_PX = 150;
// How close two page positions must be, in CSS px.
const PLACE_TOLERANCE_PX = 2;
// The card's fade in, normal and under reduced motion, in seconds as the browser writes it;
// and the moment of the fade in, in ms, at which QCD-09.2 stops it for its picture.
const FADE_IN = '0.18s';
const REDUCED_FADE = '0.1s';
const HALF_FADE_MS = 90;
// The window sizes QCD-10.1 turns to and back from, in CSS px: a phone turned to landscape (over
// 760 px wide, so the wide layout), and a wide window narrowed to a phone's layout.
const PHONE_LANDSCAPE = { width: 844, height: 390 };
const NARROW_DESKTOP = { width: 700, height: 800 };

// The card's title, its line and its three buttons' labels, as the screen shows them.
async function cardWords(page) {
  const card = questionCard(page);
  return {
    title: (await card.locator('.alert-title').textContent()).trim(),
    text: (await card.locator('.alert-text').textContent()).trim(),
    buttons: (await card.locator('button').allTextContents()).map(label => label.trim()),
  };
}

// Where the card's three buttons are: { first, second, cancel } as page boxes, once the card
// has finished growing in.
async function cardButtonPlaces(page) {
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

// The background color of one of the card's buttons, as the browser writes it.
const backgroundOf = locator => locator.evaluate(el => getComputedStyle(el).backgroundColor);

// True when one of the card's buttons has the red main look.
const isRed = async locator => (await backgroundOf(locator)) === P1HUNT_RED;

// Taps Download on Export and waits for the Upscale question.
async function askToUpscale(page, hand) {
  await waitForQuestion(page, false);
  await hand.tap(page.locator('#btnDownload'));
  await waitForQuestion(page, true);
}

// Chooses a photo with Open while paired, which asks the New photo question.
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

// Records, from before the app loads, the order in which a question card closes and a file
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
  await check(`a card over the photo, titled "${ASK_2000}", with one line, "${CROP_TEXT}"`,
    async () => {
      expect(await cardWords(page)).toEqual({
        title: ASK_2000,
        text: CROP_TEXT,
        buttons: ['Yes', 'No', 'Cancel'],
      });
    });
  await check('Yes and No side by side, the same height; Cancel beneath, as wide as both',
    async () => {
      expectChoicesLaidOut(await cardButtonPlaces(page));
    });
});

test('QCD-01.2 The pair\'s questions come on the same card [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await makePair(page, testInfo, PORTRAIT_PAIR);
  await hand.tap(page.locator('#btnUnpair'));
  await waitForQuestion(page, true);
  await check(`the card, titled "Unpair", reads "${UNPAIR_TEXT}"; Keep front, Keep back side by `
    + 'side, Cancel beneath', async () => {
    expect(await cardWords(page)).toEqual({
      title: 'Unpair',
      text: UNPAIR_TEXT,
      buttons: ['Keep front', 'Keep back', 'Cancel'],
    });
    expectChoicesLaidOut(await cardButtonPlaces(page));
  });
  await hand.tap(questionButton(page, 'Cancel'));
  await waitForQuestion(page, false);
  await check('Cancel closes the card', async () => {
    expect(await isQuestionUp(page)).toBe(false);
  });
  await openWhilePaired(page, hand);
  await check(`the card, titled "New photo", reads "${NEW_PHOTO_TEXT}"; New photo, Replace back `
    + 'side by side, Cancel beneath', async () => {
    expect(await cardWords(page)).toEqual({
      title: 'New photo',
      text: NEW_PHOTO_TEXT,
      buttons: ['New photo', 'Replace back', 'Cancel'],
    });
    expectChoicesLaidOut(await cardButtonPlaces(page));
  });
});

test('QCD-02.1 Cancel and a tap outside leave the pair and open nothing [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await makePair(page, testInfo, PORTRAIT_PAIR);
  await openWhilePaired(page, hand);
  await check('the card asks "New photo"', async () => {
    await expectQuestion(page, 'New photo', NEW_PHOTO_TEXT);
  });
  await hand.tap(questionButton(page, 'Cancel'));
  await waitForQuestion(page, false);
  await check('Cancel closes the card; still paired, Back in white, the back on screen',
    async () => {
      expect(await onScreen(page)).toEqual({ name: PORTRAIT_PAIR.back, side: 'back' });
      await expect(sideButton(page, 'back')).toHaveAttribute('aria-pressed', 'true');
    });
  await openWhilePaired(page, hand);
  await check('Open asks "New photo" again', async () => {
    await expectQuestion(page, 'New photo');
  });
  await page.touchscreen.tap(page.viewportSize().width / 2, ABOVE_CARD_Y_PX);
  await waitForQuestion(page, false);
  // A moment for anything the tap might have started.
  await page.waitForTimeout(NOTHING_SAVED_WAIT_MS);
  await check('a tap on the dim closes the card; still paired, and the chosen photo isn\'t open',
    async () => {
      expect(await onScreen(page)).toEqual({ name: PORTRAIT_PAIR.back, side: 'back' });
    });
});

test('QCD-02.2 Escape closes the card and keeps the pair [desktop]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await makePair(page, testInfo, PORTRAIT_PAIR);
  await hand.tap(page.locator('#btnUnpair'));
  await check('the card asks "Unpair"', async () => {
    await expectQuestion(page, 'Unpair', UNPAIR_TEXT);
  });
  await page.keyboard.press('Escape');
  await waitForQuestion(page, false);
  await check('Escape closes the card; Front / Back is still there, Back in white', async () => {
    expect(await onScreen(page)).toEqual({ name: PORTRAIT_PAIR.back, side: 'back' });
    await expect(sideButton(page, 'back')).toHaveAttribute('aria-pressed', 'true');
  });
});

test('QCD-03.1 Yes is red, and closes the card before the file is saved [phone]', async ({
  page,
  check,
}, testInfo) => {
  await recordCloseAndSave(page);
  const hand = await startOnExport(page, testInfo);
  await askToUpscale(page, hand);
  await check(`the card asks "${ASK_2000}"; Yes is P1Hunt red, No is not`, async () => {
    expect(await isRed(page.locator('#btnPromptFirst'))).toBe(true);
    expect(await isRed(page.locator('#btnPromptSecond'))).toBe(false);
  });
  const collector = collectDownloads(page);
  await hand.tap(questionButton(page, 'Yes'));
  await downloadsArrived(page, collector, 1);
  collector.stop();
  await check('the card closes first, then the file is saved', async () => {
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
  await check('Unpair: neither Keep front nor Keep back is red', async () => {
    expect(await isRed(page.locator('#btnPromptFirst'))).toBe(false);
    expect(await isRed(page.locator('#btnPromptSecond'))).toBe(false);
  });
  await hand.tap(questionButton(page, 'Cancel'));
  await waitForQuestion(page, false);
  await openWhilePaired(page, hand);
  await check('New photo: neither New photo nor Replace back is red', async () => {
    await expectQuestion(page, 'New photo');
    expect(await isRed(page.locator('#btnPromptFirst'))).toBe(false);
    expect(await isRed(page.locator('#btnPromptSecond'))).toBe(false);
  });
});

// The id of the element that has the keyboard focus.
const focusedId = page => page.evaluate(() => document.activeElement.id);

test('QCD-04.1 The focus starts on the first choice, stays in the card, and goes back to '
  + 'Download [desktop]', async ({ page, check }, testInfo) => {
  const hand = await startOnExport(page, testInfo);
  await askToUpscale(page, hand);
  await check(`the card asks "${ASK_2000}"; the focus is on Yes`, async () => {
    expect(await focusedId(page)).toBe('btnPromptFirst');
  });
  await page.keyboard.press('Tab');
  await check('Tab moves the focus to No', async () => {
    expect(await focusedId(page)).toBe('btnPromptSecond');
  });
  await page.keyboard.press('Tab');
  await check('Tab moves the focus to Cancel', async () => {
    expect(await focusedId(page)).toBe('btnPromptCancel');
  });
  await page.keyboard.press('Tab');
  await check('Tab takes the focus back to Yes, not behind the card', async () => {
    expect(await focusedId(page)).toBe('btnPromptFirst');
  });
  await page.keyboard.press('Shift+Tab');
  await check('Shift+Tab takes the focus to Cancel', async () => {
    expect(await focusedId(page)).toBe('btnPromptCancel');
  });
  await page.keyboard.press('Escape');
  await waitForQuestion(page, false);
  await check('Escape closes the card, and the focus is back on Download', async () => {
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

test('QCD-05.1 On a wide screen, shortcuts, the top bar and the panel do nothing while the card '
  + 'is up [desktop]', async ({ page, check }, testInfo) => {
  const hand = await startOnExport(page, testInfo);
  await hand.tap(choiceButton(page, 'exportFormat', 'PNG'));
  await check('PNG is selected', async () => {
    expect(await selectedChoices(page, 'exportFormat')).toEqual(['PNG']);
  });
  await askToUpscale(page, hand);
  await check(`the card asks "${ASK_2000}" over the photo; the panel isn't covered`, async () => {
    await expectQuestion(page, ASK_2000);
    const layer = await boxOf(questionCard(page));
    const panel = await boxOf(page.locator('#panel'));
    expect(layer.x + layer.width).toBeLessThanOrEqual(panel.x + PLACE_TOLERANCE_PX);
  });
  await page.keyboard.press('Control+z');
  await check('Ctrl+Z changes nothing: PNG is still selected and the card is up', async () => {
    expect(await selectedChoices(page, 'exportFormat')).toEqual(['PNG']);
    expect(await isQuestionUp(page)).toBe(true);
  });
  await page.keyboard.press('2');
  await check('2 changes nothing: still on Export, the card up', async () => {
    expect(await stepNow(page)).toBe('export');
    expect(await isQuestionUp(page)).toBe(true);
  });
  await clickAt(page, page.locator('#topBarHost [data-step="rotate"]'));
  await check('a click on Rotate in the top bar changes nothing: still on Export, the card up',
    async () => {
      expect(await stepNow(page)).toBe('export');
      expect(await isQuestionUp(page)).toBe(true);
    });
  await clickAt(page, choiceButton(page, 'exportFormat', 'JPEG'));
  await check('a click on JPEG in the panel changes nothing: PNG is still selected, the card up',
    async () => {
      expect(await selectedChoices(page, 'exportFormat')).toEqual(['PNG']);
      expect(await isQuestionUp(page)).toBe(true);
    });
  await page.keyboard.press('Escape');
  await waitForQuestion(page, false);
  await check('Escape closes the card', async () => {
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
    await check(`the card asks "${ASK_2000}"; the dim covers the whole screen`, async () => {
      const layer = await boxOf(questionCard(page));
      expect(layer).toEqual({ x: 0, y: 0, ...page.viewportSize() });
    });
    await tapAt(page, page.locator('#btnUndo'));
    await waitForQuestion(page, false);
    await check('a tap where Undo shows closes the card; PNG is still selected', async () => {
      expect(await selectedChoices(page, 'exportFormat')).toEqual(['PNG']);
    });
    await askToUpscale(page, hand);
    await tapAt(page, page.locator('#tabBarHost [data-step="rotate"]'));
    await waitForQuestion(page, false);
    await check('a tap where Rotate shows closes the card; still on the Export step', async () => {
      expect(await stepNow(page)).toBe('export');
    });
  });

test('QCD-06.1 The dim and the card\'s place, for a person to judge [both]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnExport(page, testInfo);
  await askToUpscale(page, hand);
  await waitForStill(page);
  const card = await boxOf(page.locator('#pairPrompt .alert-card'));
  const layer = await boxOf(questionCard(page));
  const cardMiddleY = card.y + card.height / 2;
  if (hand.isTouch) {
    const topBar = await boxOf(page.locator('#topBarHost'));
    const controls = await boxOf(page.locator('#exportArea'));
    await check('the dim covers the whole window; the card is halfway between the top bar and '
      + 'the controls', async () => {
      expect(layer).toEqual({ x: 0, y: 0, ...page.viewportSize() });
      const halfway = (topBar.y + topBar.height + controls.y) / 2;
      expect(Math.abs(cardMiddleY - halfway)).toBeLessThan(PLACE_TOLERANCE_PX);
    });
    await check.eye('everything behind the card evenly darker; the card light enough to read');
    return;
  }
  const stage = await boxOf(page.locator('#stage'));
  const panel = await boxOf(page.locator('#panel'));
  await check('the dim covers only the photo, the card centered on it; the panel not covered',
    async () => {
      expect(layer).toEqual(stage);
      expect(Math.abs(cardMiddleY - (stage.y + stage.height / 2))).toBeLessThan(PLACE_TOLERANCE_PX);
      expect(layer.x + layer.width).toBeLessThanOrEqual(panel.x + PLACE_TOLERANCE_PX);
    });
  await check.eye('the photo darker behind the card; the top bar and the side panel as bright '
    + 'as before and readable');
});

test('QCD-07.1 Cancel on a card over an open sheet leaves the sheet open [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnExport(page, testInfo);
  await openCornerSheet(page, hand);
  await check('the Corner shots sheet rises', async () => {
    expect(await isCornerSheetOpen(page)).toBe(true);
  });
  const collector = collectDownloads(page);
  await hand.tap(page.locator('#btnCornerDownload'));
  await waitForQuestion(page, true);
  await check(`the card asks "${ASK_2000}" in front of the sheet`, async () => {
    await expectQuestion(page, ASK_2000);
  });
  await hand.tap(questionButton(page, 'Cancel'));
  await waitForQuestion(page, false);
  const count = await downloadsAfterWait(page, collector, NOTHING_SAVED_WAIT_MS);
  collector.stop();
  await check('Cancel closes the card; the sheet is still open, and nothing is saved', async () => {
    expect(await isCornerSheetOpen(page)).toBe(true);
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
  await check(`the card asks "${ASK_2000}"`, async () => {
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
  await check('the card goes, nothing is saved, and the pasted photo opens on Perspective',
    async () => {
      expect(await isQuestionUp(page)).toBe(false);
      expect(count).toBe(0);
      expect(await stepNow(page)).toBe('perspective');
    });
});

test('QCD-08.2 A photo pasted while Unpair is asked replaces it with the New photo question '
  + '[desktop]', async ({ page, context, browserName, check }, testInfo) => {
  const hand = await makePair(page, testInfo, PORTRAIT_PAIR);
  await copyPhotoFirst(page, context, browserName);
  await hand.tap(page.locator('#btnUnpair'));
  await check('the card asks "Unpair"', async () => {
    await expectQuestion(page, 'Unpair', UNPAIR_TEXT);
  });
  await page.keyboard.press('Control+v');
  await check(`the card now asks "New photo": "${NEW_PHOTO_TEXT}"`, async () => {
    await expect(questionCard(page).locator('.alert-title')).toHaveText('New photo');
    await expectQuestion(page, 'New photo', NEW_PHOTO_TEXT);
  });
});

// The card's look as the browser computes it now: its transition's properties and durations,
// its transform, the layer's pointer events and whether it is hidden or open.
function cardLook(page) {
  return page.evaluate(() => {
    const layer = document.getElementById('pairPrompt');
    const card = layer.querySelector('.alert-card');
    const cardStyle = getComputedStyle(card);
    return {
      properties: cardStyle.transitionProperty,
      durations: cardStyle.transitionDuration,
      transform: cardStyle.transform,
      pointerEvents: getComputedStyle(layer).pointerEvents,
      isHidden: layer.hidden,
      isOpen: window.CF.isAlertOpen(layer),
    };
  });
}

test('QCD-09.1 A closing card takes no touch, and reduced motion only fades it [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnExport(page, testInfo);
  await askToUpscale(page, hand);
  const opening = await cardLook(page);
  await check('the card fades in over 180 ms, growing as it comes', async () => {
    expect(opening.properties).toBe('opacity, transform');
    expect(opening.durations).toBe(`${FADE_IN}, ${FADE_IN}`);
  });
  const yesPlace = await boxOf(page.locator('#btnPromptFirst'));
  const collector = collectDownloads(page);
  await hand.tap(questionButton(page, 'Cancel'));
  const closing = await cardLook(page);
  await page.touchscreen.tap(yesPlace.x + yesPlace.width / 2, yesPlace.y + yesPlace.height / 2);
  const count = await downloadsAfterWait(page, collector, NOTHING_SAVED_WAIT_MS);
  collector.stop();
  await check('while it fades out the card takes no touch: the tap on Yes saves nothing',
    async () => {
      expect(closing).toMatchObject({ isOpen: false, pointerEvents: 'none' });
      expect(count).toBe(0);
    });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await check('with reduced motion on, nothing changes on screen', async () => {
    expect(await isQuestionUp(page)).toBe(false);
  });
  await askToUpscale(page, hand);
  const reduced = await cardLook(page);
  await check('under reduced motion the card only fades in, over 100 ms, at full size',
    async () => {
      expect(reduced.durations.split(', ').every(duration => duration === REDUCED_FADE))
        .toBe(true);
      expect(reduced.transform).toBe('none');
    });
});

test('QCD-09.2 The card fading in, for a person to judge [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnExport(page, testInfo);
  await hand.tap(page.locator('#btnDownload'));
  // The fade is stopped half way so the picture shows it; a person sees it pass in 180 ms.
  await page.evaluate(stopAtMs => {
    for (const animation of document.getAnimations()) {
      animation.pause();
      animation.currentTime = stopAtMs;
    }
  }, HALF_FADE_MS);
  await check.eye('the card and its words partly see-through and slightly smaller than at rest, '
    + 'centered where it will settle; the dim partly in');
  await page.evaluate(() => {
    for (const animation of document.getAnimations()) animation.play();
  });
  await check.eye('the card solid, at full size; the dim even');
});

test('QCD-10.1 The card stays up through a change of layout and back, and still answers [both]',
  async ({ page, check }, testInfo) => {
    const hand = await startOnExport(page, testInfo);
    const startSize = page.viewportSize();
    await askToUpscale(page, hand);
    await check(`the card asks "${ASK_2000}"`, async () => {
      await expectQuestion(page, ASK_2000);
    });
    await page.setViewportSize(hand.isTouch ? PHONE_LANDSCAPE : NARROW_DESKTOP);
    await check('after the layout changes the card is still up, with the same question',
      async () => {
        expect(await isQuestionUp(page)).toBe(true);
        expect((await cardWords(page)).buttons).toEqual(['Yes', 'No', 'Cancel']);
        await expect(questionCard(page).locator('.alert-title')).toHaveText(ASK_2000);
      });
    await page.setViewportSize(startSize);
    await check('back in the first layout the card is still up, with the same question',
      async () => {
        expect(await isQuestionUp(page)).toBe(true);
        await expect(questionCard(page).locator('.alert-title')).toHaveText(ASK_2000);
      });
    const collector = collectDownloads(page);
    await hand.tap(questionButton(page, 'No'));
    const [saved] = await downloadsArrived(page, collector, 1);
    collector.stop();
    await check(`No closes the card and a ${CROP_PX} × ${CROP_PX} px file is saved`, async () => {
      expect(await isQuestionUp(page)).toBe(false);
      expect(await imageSize(page, saved.file)).toEqual([CROP_PX, CROP_PX]);
    });
  });
