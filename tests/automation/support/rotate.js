// Helpers for the Rotate step's cases (tests/automation/rotate.spec.js): a finger that presses,
// moves and lifts in separate steps, so a case can look at the screen while the finger is still
// down (the shared touchDrag in app.js does a whole drag at once); where the ruler's ticks are;
// and a save that reports the question the app asked on the way.
'use strict';

// The pointer id of the held finger. Any number a real pointer is unlikely to have.
const HELD_POINTER_ID = 11;
// How many moves a held finger's slide is split into, so the app sees a drag and not a jump.
const SLIDE_MOVES = 8;
// How long to wait for the question box after Download before deciding none was asked.
const QUESTION_WAIT_MS = 3000;

// Sends one touch pointer event of `type` at a page point (CSS px) to the element `selector`
// names. While the finger is down, setPointerCapture is made to ignore this one dispatched
// pointer (the browser doesn't know it, so a real capture would throw); the events go to the
// element anyway, which is what capture is for. A pointerdown installs that, a pointerup
// removes it.
function sendFingerEvent(page, type, selector, point) {
  return page.evaluate(({ eventType, targetSelector, x, y, pointerId }) => {
    const element = document.querySelector(targetSelector);
    if (eventType === 'pointerdown') {
      const capture = Element.prototype.setPointerCapture;
      window.testHeldCapture = capture;
      Element.prototype.setPointerCapture = function captureUnlessHeld(capturedId) {
        if (capturedId !== pointerId) capture.call(this, capturedId);
      };
    }
    try {
      element.dispatchEvent(new PointerEvent(eventType, {
        pointerId,
        pointerType: 'touch',
        isPrimary: true,
        clientX: x,
        clientY: y,
        bubbles: true,
        cancelable: true,
        buttons: eventType === 'pointerup' ? 0 : 1,
      }));
    } finally {
      if (eventType === 'pointerup' && window.testHeldCapture) {
        Element.prototype.setPointerCapture = window.testHeldCapture;
        window.testHeldCapture = null;
      }
    }
  }, {
    eventType: type,
    targetSelector: selector,
    x: point.x,
    y: point.y,
    pointerId: HELD_POINTER_ID,
  });
}

// Puts a finger down on `selector` at a page point (CSS px) and leaves it there.
function pressFinger(page, selector, point) {
  return sendFingerEvent(page, 'pointerdown', selector, point);
}

// Slides the held finger from one page point (CSS px) to another in SLIDE_MOVES steps, without
// lifting it.
async function moveFinger(page, selector, start, end) {
  for (let i = 1; i <= SLIDE_MOVES; i++) {
    const fraction = i / SLIDE_MOVES;
    await sendFingerEvent(page, 'pointermove', selector, {
      x: start.x + (end.x - start.x) * fraction,
      y: start.y + (end.y - start.y) * fraction,
    });
  }
}

// Lifts the held finger at a page point (CSS px).
function liftFinger(page, selector, point) {
  return sendFingerEvent(page, 'pointerup', selector, point);
}

// Where the ruler's zero tick (the tall tick under the pointer at 0.0°) is on the page: the
// middle of its line, in CSS px. The scale draws one tick per degree from the ruler's minimum,
// so the zero tick is number -min.
function zeroTickOnPage(page, rulerSelector) {
  return page.evaluate(selector => {
    const ruler = document.querySelector(selector);
    const minimum = Number(ruler.querySelector('input').min);
    const tick = ruler.querySelectorAll('.ruler-tick')[-minimum];
    const box = tick.getBoundingClientRect();
    return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
  }, rulerSelector);
}

// Taps Download on the Export step, answers the question box with No when it is asked, and
// waits for the file. Returns { question, name, file }: the question box's title ('' when none
// was asked), the name the app gave the file and the path of the saved copy.
async function saveCopy(page, hand) {
  const downloading = page.waitForEvent('download');
  await hand.tap(page.locator('#btnDownload'));
  const title = page.locator('#pairPromptTitle');
  const isAsked = await title.waitFor({ state: 'visible', timeout: QUESTION_WAIT_MS })
    .then(() => true, () => false);
  const question = isAsked ? (await title.textContent()).trim() : '';
  if (isAsked) {
    await hand.tap(page.locator('#pairPrompt').getByRole('button', { name: 'No', exact: true }));
  }
  const download = await downloading;
  return { question, name: download.suggestedFilename(), file: await download.path() };
}

module.exports = {
  pressFinger,
  moveFinger,
  liftFinger,
  zeroTickOnPage,
  saveCopy,
};
