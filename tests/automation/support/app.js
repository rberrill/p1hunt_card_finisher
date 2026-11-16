// Helpers that drive the app the way a person would: open the page, choose a photo, go to a
// step, drag on the photo. They read the app's state only through its test hook,
// window.__straightener, and through CF.
'use strict';
const path = require('path');

const root = path.resolve(__dirname, '../../..');
// How many moves a drag is split into, so the app sees a drag and not a jump.
const DRAG_MOVES = 8;
// How long a photo may take to open and be detected before the case gives up.
const OPEN_TIMEOUT_MS = 20000;

// The full path of a sample photo.
const samplePath = name => path.join(root, 'samples', name);

// Opens the app and waits until its test hook is there.
async function openApp(page, address = 'index.html') {
  await page.goto(address);
  await page.waitForFunction(() => !!window.__straightener);
}

// Chooses a sample photo through the app's own file input and waits until it is open and
// detection has finished.
async function openPhoto(page, name) {
  await page.setInputFiles('#fileInput', samplePath(name));
  try {
    await page.waitForFunction(() => {
      // detection.running counts the runs started (it never goes back down); a run that has
      // finished clears detection.message.
      const app = window.__straightener.app;
      const isDetected = app.detection.running > 0 && app.detection.message === '';
      return !!app.img && !!app.geometry && isDetected;
    }, null, { timeout: OPEN_TIMEOUT_MS });
  } catch (error) {
    const seen = await page.evaluate(() => {
      const app = window.__straightener.app;
      return JSON.stringify({
        hasPhoto: !!app.img,
        hasGeometry: !!app.geometry,
        detectionsRunning: app.detection.running,
        candidates: app.detection.candidates.length,
        message: app.detection.message,
      });
    });
    throw new Error(`The photo ${name} did not finish opening. The app's state: ${seen}`);
  }
}

// Goes to a step by clicking its tab (the tab bar on a phone, the top bar on a wide screen).
async function goToStep(page, step) {
  await page.locator(`[data-step="${step}"]:visible`).first().click();
  await page.waitForFunction(wanted => window.__straightener.app.tab === wanted, step);
}

// A copy of the app's edit state.
function editState(page) {
  return page.evaluate(() => JSON.parse(JSON.stringify(window.__straightener.app.state)));
}

// Where a corner handle is on the page, in CSS pixels. index: 0 to 3, top-left first.
function cornerOnPage(page, index) {
  return page.evaluate(cornerIndex => {
    const app = window.__straightener.app;
    const [x, y] = window.CF.toScreen(window.CF.currentView(), app.state.corners[cornerIndex]);
    const box = document.getElementById('view').getBoundingClientRect();
    return { x: box.left + x, y: box.top + y };
  }, index);
}

// Drags with the mouse from one page point to another.
async function mouseDrag(page, start, end) {
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y, { steps: DRAG_MOVES });
  await page.mouse.up();
}

// Drags with one finger from one page point to another, by dispatching touch pointer events
// on the photo. They are not trusted events, which the app does not check.
async function touchDrag(page, start, end) {
  await page.evaluate(({ from, target, moves }) => {
    const canvas = document.getElementById('view');
    const send = (type, x, y) => canvas.dispatchEvent(new PointerEvent(type, {
      pointerId: 7,
      pointerType: 'touch',
      isPrimary: true,
      clientX: x,
      clientY: y,
      bubbles: true,
      cancelable: true,
      buttons: type === 'pointerup' ? 0 : 1,
    }));
    send('pointerdown', from.x, from.y);
    for (let i = 1; i <= moves; i++) {
      const fraction = i / moves;
      send(
        'pointermove',
        from.x + (target.x - from.x) * fraction,
        from.y + (target.y - from.y) * fraction,
      );
    }
    send('pointerup', target.x, target.y);
  }, { from: start, target: end, moves: DRAG_MOVES });
}

// Answers the question card (Upscale to N px?, Unpair, New photo) if one is showing.
async function answerQuestion(page, answer) {
  const card = page.locator('#pairPrompt');
  if (await card.isVisible().catch(() => false)) {
    await card.getByRole('button', { name: answer, exact: true }).click();
  }
}

module.exports = {
  root,
  samplePath,
  openApp,
  openPhoto,
  goToStep,
  editState,
  cornerOnPage,
  mouseDrag,
  touchDrag,
  answerQuestion,
};
