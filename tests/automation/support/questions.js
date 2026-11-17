// Helpers for the Upscale question and Question card cases
// (tests/automation/upscale-question.spec.js, question-cards.spec.js), on top of
// support/corner-shots.js: a tap that brings up the question box and the row's verdict on it,
// a choice on Export and its verdict, the Interpolation row, and reopening the build to Resume.
// Like support/app.js, they act through the app's controls and read its state (through
// window.__straightener and CF) only to wait for a result or to check one.
'use strict';
const { expect } = require('@playwright/test');
const { openApp, hasWhiteFill, openOptions, closeOptions } = require('./app.js');
const { choiceButton, selectedChoices, waitForQuestion } = require('./export.js');
const {
  questionButton,
  expectQuestion,
  isQuestionUp,
  isCornerSheetOpen,
  openCornerSheet,
  closeCornerSheet,
} = require('./corner-shots.js');

// The definition of the question box the first row of a case gives, as the README words it.
const QUESTION_BOX = 'the question box (the box over the dimmed photo with a question and '
  + 'buttons)';
// The Interpolation choices, as its list offers them.
const INTERPOLATIONS = ['Bilinear', 'Bicubic (sharper, slower)'];

// Taps `control` once no question box is up and records the row's verdict: the question box
// asks `title` (and, when given, reads `text`). description: the row's result in its own words.
// The box is polled for within expect's own time limit, so a question that never comes fails
// the row rather than running the test out of time.
async function askAndCheck(page, hand, check, control, description, title, text = null) {
  await waitForQuestion(page, false);
  await hand.tap(control);
  await check(description, async () => {
    await expect.poll(() => isQuestionUp(page)).toBe(true);
    await expectQuestion(page, title, text);
  });
}

// Taps one of the question box's buttons by its label and records the row's verdict that the
// box has closed (`then` checks anything more the row says).
async function answerAndCheckClosed(page, hand, check, label, description,
  then = async () => {}) {
  await hand.tap(questionButton(page, label));
  await waitForQuestion(page, false);
  await check(description, async () => {
    expect(await isQuestionUp(page)).toBe(false);
    await then();
  });
}

// Taps a choice on Export by its label (in the row `groupId`: 'exportSize', 'exportFormat',
// 'cornerOutput') and records the verdict that it alone is selected, with the white fill.
async function chooseAndCheck(page, hand, check, groupId, label) {
  const choice = choiceButton(page, groupId, label);
  await hand.tap(choice);
  await check(`${label} is selected (white)`, async () => {
    expect(await selectedChoices(page, groupId)).toEqual([label]);
    expect(await hasWhiteFill(choice)).toBe(true);
  });
}

// Taps Corner shots on Export and records the verdict that the sheet has risen, with
// `selected` ('1 sheet' or '4 photos') selected when it is given.
async function openCornerSheetAndCheck(page, hand, check, selected = null) {
  await openCornerSheet(page, hand);
  const withChoice = selected ? `, with ${selected} selected` : '';
  await check(`the Corner shots sheet rises${withChoice}`, async () => {
    expect(await isCornerSheetOpen(page)).toBe(true);
    if (selected) expect(await selectedChoices(page, 'cornerOutput')).toEqual([selected]);
  });
}

// Taps the × of the Corner shots sheet and records the verdict that it has gone down.
async function closeCornerSheetAndCheck(page, hand, check) {
  await closeCornerSheet(page, hand);
  await check('the sheet goes down', async () => {
    expect(await isCornerSheetOpen(page)).toBe(false);
  });
}

// Sets Interpolation to Bicubic as a person does, recording each row's verdict: the options
// tab (Export options rise, the row reads Bilinear), a tap on the row (its list offers both
// choices: the list is the system's own, which no script can see open, so its choices are read
// from the row), the choice (the row reads Bicubic), and the × (the options go down).
async function setBicubicAndCheck(page, hand, check) {
  const value = page.locator('#interpValue');
  await openOptions(page, hand, 'export');
  await check('Export options rise; the Interpolation row reads Bilinear', async () => {
    await expect(page.locator('#exportSheet .sheet-body')).toBeVisible();
    await expect(value).toHaveText('Bilinear');
  });
  await check(`a list offers ${INTERPOLATIONS.join(' and ')}`, async () => {
    expect(await page.locator('#interp option').allTextContents()).toEqual(INTERPOLATIONS);
  });
  await page.locator('#interp').selectOption({ label: INTERPOLATIONS[1] });
  await check('the row reads Bicubic', async () => {
    await expect(value).toHaveText('Bicubic');
  });
  await closeOptions(page, hand, 'export');
  await check('the options go down', async () => {
    await expect(page.locator('#exportSheet')).toBeHidden();
  });
}

// Waits until the open photo's edits, as they are now, are kept on the device (what a person's
// "wait two seconds" gives time for), so that opening the build again offers them.
function waitForEditsKept(page) {
  return page.waitForFunction(async () => {
    const app = window.__straightener.app;
    const record = await window.__straightener.Session.peek();
    const isSameState = !!record && JSON.stringify(record.state) === JSON.stringify(app.state);
    return isSameState && record.tab === app.tab;
  });
}

// Waits for the edits to be kept, opens the build again at `address` (a reload when it is
// null) and records the row's verdict: the start screen asks "Resume `name`?", with Resume and
// Start fresh.
async function reopenAndCheck(page, check, address, name) {
  await waitForEditsKept(page);
  if (address) {
    await openApp(page, address);
  } else {
    await page.reload();
    await page.waitForFunction(() => !!window.__straightener);
  }
  await check(`the start screen asks "Resume ${name}?", with Resume and Start fresh`,
    async () => {
      await expect(page.locator('#btnResume')).toBeVisible();
      await expect(page.locator('#btnFresh')).toBeVisible();
      await expect(page.locator('#resumeName')).toHaveText(name);
    });
}

// Taps Resume and records the row's verdict: the photo opens on the Export step (`then`
// checks anything more the row says).
async function resumeAndCheck(page, hand, check, description, then = async () => {}) {
  await hand.tap(page.locator('#btnResume'));
  await page.waitForFunction(() => {
    const app = window.__straightener.app;
    return !!app.img && !!app.geometry && app.tab === 'export';
  });
  await check(description, async () => {
    await expect(page.locator('#btnResume')).toBeHidden();
    expect(await page.evaluate(() => window.__straightener.app.tab)).toBe('export');
    await then();
  });
}

module.exports = {
  QUESTION_BOX,
  askAndCheck,
  answerAndCheckClosed,
  chooseAndCheck,
  openCornerSheetAndCheck,
  closeCornerSheetAndCheck,
  setBicubicAndCheck,
  waitForEditsKept,
  reopenAndCheck,
  resumeAndCheck,
};
