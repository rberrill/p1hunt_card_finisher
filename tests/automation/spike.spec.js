// The spike: one case of each kind, to prove the stack before the catalog is written.
// These are throwaway cases with SPK ids; real cases take their ids from tests/catalog/.
'use strict';
const fs = require('fs');
const { pathToFileURL } = require('url');
const path = require('path');
const { test, expect } = require('./support/case.js');
const {
  root,
  openApp,
  openPhoto,
  goToStep,
  editState,
  cornerOnPage,
  mouseDrag,
  touchDrag,
  answerQuestion,
} = require('./support/app.js');

const PHOTO = 'IMG_9136.JPEG';
const STEPS = ['perspective', 'rotate', 'crop', 'levels', 'overlay', 'export'];
// How far the corner is dragged, in CSS pixels.
const DRAG_PX = 40;
const PHONE_CONTROL_AREA_PX = 200;

test('SPK-01 A control changes the photo and Undo takes it back [all]', async ({ page, check }) => {
  await openApp(page);
  await openPhoto(page, PHOTO);
  await goToStep(page, 'rotate');
  await page.locator('#toolRotateLeft').click();
  await check('90 degrees left turns the photo a quarter turn', async () => {
    expect((await editState(page)).rotation.quarter).not.toBe(0);
    await expect(page.locator('#btnUndo')).toBeEnabled();
  });
  await page.locator('#btnUndo').click();
  await check('Undo puts the photo back upright', async () => {
    expect((await editState(page)).rotation.quarter).toBe(0);
  });
  await check('no console error during the case', async () => {
    expect(check.consoleErrors()).toEqual([]);
  });
});

test('SPK-02 Dragging a corner handle moves that corner [all]', async ({ page, check }, info) => {
  await openApp(page);
  await openPhoto(page, PHOTO);
  const before = (await editState(page)).corners[0];
  const start = await cornerOnPage(page, 0);
  const end = { x: start.x + DRAG_PX, y: start.y + DRAG_PX };
  const isPhone = info.project.name.includes('phone');
  await (isPhone ? touchDrag(page, start, end) : mouseDrag(page, start, end));
  await check('the top-left corner moved down and right', async () => {
    const after = (await editState(page)).corners[0];
    expect(after[0]).toBeGreaterThan(before[0]);
    expect(after[1]).toBeGreaterThan(before[1]);
  });
  await check('the drag is one undo step', async () => {
    await page.locator('#btnUndo').click();
    expect((await editState(page)).corners[0]).toEqual(before);
  });
});

test('SPK-03 Download saves a JPEG of the size the app computed [all]', async ({ page, check }) => {
  await openApp(page);
  await openPhoto(page, PHOTO);
  await goToStep(page, 'export');
  const expected = await page.evaluate(() => window.__straightener.app.geometry.output);
  const downloading = page.waitForEvent('download');
  await page.locator('#btnDownload').click();
  await answerQuestion(page, 'No');
  const download = await downloading;
  const file = await download.path();
  await check('the file is named after the photo and ends -straight.jpg', async () => {
    expect(download.suggestedFilename()).toBe('IMG_9136-straight.jpg');
  });
  const size = await page.evaluate(async base64 => {
    const bytes = Uint8Array.from(atob(base64), character => character.charCodeAt(0));
    const bitmap = await createImageBitmap(new Blob([bytes], { type: 'image/jpeg' }));
    return { width: bitmap.width, height: bitmap.height };
  }, fs.readFileSync(file).toString('base64'));
  await check('the saved image has the pixel size the app computed', async () => {
    expect(size).toEqual({ width: expected.width, height: expected.height });
  });
  await check('Next card shows once the photo is exported', async () => {
    await expect(page.locator('#btnNextCard')).toBeVisible();
  });
});

test('SPK-04 The photo keeps its size on every step [all]', async ({ page, check }, info) => {
  await openApp(page);
  await openPhoto(page, PHOTO);
  const heights = [];
  const overflows = [];
  for (const step of STEPS) {
    await goToStep(page, step);
    heights.push(await page.evaluate(
      () => Math.round(document.getElementById('stage').getBoundingClientRect().height),
    ));
    overflows.push(await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    ));
  }
  await check('the photo area is the same height on all six steps', async () => {
    expect(new Set(heights).size, `heights ${heights.join(', ')}`).toBe(1);
  });
  await check('the page never scrolls sideways', async () => {
    expect(Math.max(...overflows)).toBeLessThanOrEqual(0);
  });
  if (info.project.name.includes('phone')) {
    await check('the control area is 200 px tall', async () => {
      const area = page.locator('.control-area:visible').first();
      expect(Math.round((await area.boundingBox()).height)).toBe(PHONE_CONTROL_AREA_PX);
    });
  }
});

test('SPK-04s Export fits a 375 px wide phone [small]', async ({ page, check }) => {
  await openApp(page);
  await openPhoto(page, PHOTO);
  await goToStep(page, 'export');
  await check('no button label in the control area is cut off', async () => {
    const clipped = await page.evaluate(() => [...document.querySelectorAll(
      '[data-panel="export"] .control-area button',
    )].filter(button => button.offsetParent && button.scrollWidth > button.clientWidth)
      .map(button => button.textContent.trim()));
    expect(clipped).toEqual([]);
  });
  await check('the page does not scroll sideways', async () => {
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test('SPK-05 The Upscale question, for a person to judge [all]', async ({ page, check }) => {
  await openApp(page);
  await openPhoto(page, PHOTO);
  await goToStep(page, 'export');
  await page.locator('#btnDownload').click();
  await check('a question card asks Upscale to 2000 px?', async () => {
    await expect(page.locator('#pairPrompt')).toBeVisible();
    await expect(page.locator('#pairPrompt')).toContainText('Upscale to 2000 px?');
  });
  await check.eye(
    'the card is centered over the dimmed photo, Yes is red, No and Cancel are not',
  );
});

test('SPK-06 Share hands the share sheet one JPEG file [all]', async ({ page, check }) => {
  // No desktop browser has a share sheet, so the page is given a stand-in that records what
  // the app hands over. The real sheet is a phone case.
  await page.addInitScript(() => {
    navigator.canShare = () => true;
    navigator.share = async data => {
      window.sharedByApp = data.files.map(file => ({ name: file.name, type: file.type }));
    };
  });
  await openApp(page);
  await openPhoto(page, PHOTO);
  await goToStep(page, 'export');
  await check('Share is shown when the browser can share files', async () => {
    await expect(page.locator('#btnShare')).toBeVisible();
  });
  await page.locator('#btnShare').click();
  await answerQuestion(page, 'No');
  await page.waitForFunction(() => !!window.sharedByApp);
  await check('the share sheet received one file, IMG_9136-straight.jpg', async () => {
    const shared = await page.evaluate(() => window.sharedByApp);
    expect(shared).toEqual([{ name: 'IMG_9136-straight.jpg', type: 'image/jpeg' }]);
  });
});

test('SPK-07 The app runs when opened from disk [disk]', async ({ page, check }) => {
  const requests = [];
  page.on('request', request => requests.push(request.url()));
  await openApp(page, pathToFileURL(path.join(root, 'index.html')).href);
  await openPhoto(page, PHOTO);
  await check('a photo opens and its corners are found', async () => {
    expect((await editState(page)).corners).toHaveLength(4);
  });
  await check('nothing was requested from another site', async () => {
    const outside = requests.filter(address => !/^(file|blob|data):/.test(address));
    expect(outside).toEqual([]);
  });
  await check('no console error', async () => {
    expect(check.consoleErrors()).toEqual([]);
  });
});
