// The test fixture every automated case uses. It gives a case `check`, which records one
// verdict: it runs an assertion, saves a screenshot of the page at that moment and writes a
// line for results.json.
//   await check('the angle reads 2.5 degrees', async () => { await expect(...).toHaveText(...); });
//   await check.eye('the question card, for a person to judge');
//   expect(check.consoleErrors()).toEqual([]);
// A case that ends without a single verdict fails, so a test can't pass by doing nothing.
'use strict';
const fs = require('fs');
const path = require('path');
const base = require('@playwright/test');
const { runFolder } = require('./run-folder.js');

const root = path.resolve(__dirname, '../../..');
const runDir = runFolder(root);

// A file-name-safe version of a description: lower case, hyphens, at most 60 characters.
function slug(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
}

// JPEG quality of an evidence screenshot, 0 to 100.
const SCREENSHOT_QUALITY = 80;
// How much of a failure's message goes into the results file.
const FOUND_MAX_LENGTH = 400;

// An error's message on one line, without terminal color codes, cut to a readable length.
function firstLine(error) {
  // eslint-disable-next-line no-control-regex
  const plain = String(error.message || error).replace(/\u001b\[[0-9;]*m/g, '');
  return plain.split('\n').map(line => line.trim()).filter(Boolean).join(' / ')
    .slice(0, FOUND_MAX_LENGTH);
}

// Waits until no transition or animation with an end is still running on the page.
function waitForStill(page) {
  return page.waitForFunction(() => document.getAnimations().every(animation => {
    const hasEnd = animation.effect.getComputedTiming().endTime !== Infinity;
    return animation.playState !== 'running' || !hasEnd;
  })).catch(() => {});
}

// How a case run ended, for the results file. A case marked test.fail(true, 'BUG-0NN') that
// fails is a known defect, not a failure; if it passes, the defect is fixed and the mark is
// stale, which Playwright reports as a failure.
function outcomeOf(testInfo) {
  const mark = testInfo.annotations.find(annotation => annotation.type === 'fail');
  const bug = mark && mark.description ? mark.description : '';
  if (testInfo.expectedStatus !== 'failed') return { status: testInfo.status, bug };
  const status = testInfo.status === 'failed' ? 'known defect' : 'fixed, remove the mark';
  return { status, bug };
}

// Builds the recorder for one case in one browser target. kind: 'auto' (the assertion
// decides) or 'eye' (a person judges the screenshot).
function makeRecorder(page, testInfo, verdicts, errors) {
  const caseId = testInfo.title.split(' ')[0];
  const folder = path.join(runDir, 'evidence', caseId, testInfo.project.name);
  return async (description, kind, assertion) => {
    const step = String(verdicts.length + 1).padStart(2, '0');
    let failure = null;
    try {
      if (assertion) await assertion();
    } catch (error) {
      failure = error;
    }
    const name = `${step}_${slug(description)}${failure ? '_FAIL' : ''}.jpg`;
    const file = path.join(folder, name);
    // The screenshot is a JPEG in CSS pixels: a PNG of a photo is about 0.5 MB, and a phone's
    // 3x density would triple its size.
    // In WebKit, Playwright's screenshot adds a stylesheet of its own, which the app's
    // security policy refuses with a console error. That error is the tool's, not the app's,
    // so anything logged while the screenshot is taken is dropped.
    // A screenshot for a person to judge is taken with the screen at rest, not mid-fade.
    if (kind === 'eye') await waitForStill(page);
    const errorsBefore = errors.length;
    const shot = { path: file, scale: 'css', type: 'jpeg', quality: SCREENSHOT_QUALITY };
    await page.screenshot(shot).catch(() => {});
    errors.length = errorsBefore;
    let status = kind === 'eye' ? 'eye' : 'pass';
    if (failure) status = 'fail';
    verdicts.push({
      step: Number(step),
      expected: description,
      status,
      found: failure ? firstLine(failure) : '',
      screenshot: path.relative(runDir, file).replace(/\\/g, '/'),
    });
    if (failure) throw failure;
  };
}

// Writes this case's verdicts where the reporter collects them.
function writeResult(testInfo, verdicts) {
  const caseId = testInfo.title.split(' ')[0];
  const folder = path.join(runDir, 'results');
  fs.mkdirSync(folder, { recursive: true });
  const result = {
    caseId,
    title: testInfo.title,
    target: testInfo.project.name,
    ...outcomeOf(testInfo),
    durationMs: Math.round(testInfo.duration),
    verdicts,
  };
  const file = path.join(folder, `${caseId}__${testInfo.project.name}.json`);
  fs.writeFileSync(file, JSON.stringify(result, null, 2));
}

const test = base.test.extend({
  check: async ({ page }, use, testInfo) => {
    const verdicts = [];
    const errors = [];
    page.on('console', message => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', error => errors.push(String(error)));
    const record = makeRecorder(page, testInfo, verdicts, errors);
    const check = (description, assertion) => record(description, 'auto', assertion);
    check.eye = description => record(description, 'eye', null);
    // Every console error and failed script since the page was created.
    check.consoleErrors = () => errors.slice();
    await use(check);
    writeResult(testInfo, verdicts);
    if (!verdicts.length && testInfo.status === 'passed') {
      throw new Error('This case reached no verdict: it must call check() at least once.');
    }
  },
});

module.exports = { test, expect: base.expect, runDir, root };
