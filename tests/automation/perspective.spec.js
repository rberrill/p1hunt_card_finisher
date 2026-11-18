// The Perspective step's cases (tests/catalog/perspective.md): detection on open, the corner
// outline and its handles, dragging, the magnifier, Nudge and the arrows, Flatten, Candidate,
// Snap, Preview, Tap to find card, Card orientation, Reset perspective, the Debug overlay, the
// Result picture, the line's messages, and detection's accuracy on every sample photo.
// Each test drives the app as a person would, through the hand (a finger on the phone targets,
// the mouse on the wide ones), and reads the app's state only to check a result.
'use strict';
const { test, expect } = require('./support/case.js');
const {
  openApp,
  openPhoto,
  samplePath,
  goToStep,
  editState,
  handFor,
  openOptions,
  closeOptions,
  waitForStill,
  hasWhiteFill,
  waitInPage,
  viewNow,
  waitForDetection,
} = require('./support/app.js');
const {
  PHOTO,
  startOnPerspective,
  fixturePicture,
  startOnFixture,
  openPicture,
  handleOnPage,
  offsetBy,
  cornersNow,
  zoomNow,
  fittedZoom,
  tapAt,
  doubleTapAt,
  pressAt,
  pinchAt,
  middleColor,
  sendTouch,
  holdDragAt,
  releaseDrag,
  recordStatuses,
  readStatuses,
  holdNextSearch,
  releaseSearch,
  recordSearchPoints,
  readSearchPoints,
  pressButton,
  releaseButton,
  recordCornerMoveTimes,
  readCornerMoveTimes,
  handleName,
} = require('./support/perspective.js');
const {
  GROUND_TRUTH,
  BASELINE,
  RAW_CARDS,
  HELD_OUT,
  WITHIN_PCT,
  cornerErrorPct,
  groupOf,
  isTopPickHeld,
  isBestHeld,
} = require('./support/detection-baselines.js');
const {
  PORTRAIT_PAIR,
  makePair,
  addBack,
  sideButton,
  switchTo,
} = require('./support/front-and-back.js');

// The plain picture with no card in it (tests/fixtures/plain-grey.png, 1200 × 1600 px) and
// its fallback corners, 20% in from each edge (CONFIG.defaultInsetPct).
const BLANK_FIXTURE = 'plain-grey.png';
const BLANK_INSET_CORNERS = [[240, 320], [960, 320], [960, 1280], [240, 1280]];
// A second photo, opened after the first.
const SECOND_PHOTO = 'IMG_9075.JPEG';
const NOTHING_DETECTED = 'Nothing detected. Drag the corners into place.';
const CROSSED = 'Corners cross or fold inward. Drag them back into a convex shape.';
// Handle indices: the corners top-left first, clockwise, then the middles of the top, right,
// bottom and left edges.
const TOP_LEFT = 0;
const TOP_RIGHT = 1;
const BOTTOM_RIGHT = 2;
const BOTTOM_LEFT = 3;
const TOP_EDGE = 4;
const LEFT_EDGE = 7;
// How close two screen positions must be, in CSS px; and two photo positions, in photo px.
const SCREEN_TOLERANCE_PX = 1;
const PHOTO_TOLERANCE_PX = 0.01;
// How long the case waits for a search that it expects to have been thrown away.
const SEARCH_SETTLE_MS = 2000;
// A double tap on a handle zooms to this many times the fitted size (CONFIG.handleZoom), and
// the magnifier is never wider than this share of the photo area (CONFIG.loupeMaxFrac).
const HANDLE_ZOOM = 6;
const MAGNIFIER_MAX_FRACTION = 0.42;
// How close a measured zoom must be to the expected one, as a fraction of it.
const ZOOM_TOLERANCE = 0.01;
// Half the slider knob's width at rest, in CSS px (SLIDER_THUMB_PX in js/app/parts/slider.js).
const SLIDER_KNOB_HALF_PX = 11;
// The drag in the Snap cases, in CSS px: within CONFIG.snapRadiusPx (18) of where it starts.
const SNAP_DRAG = { x: 10, y: 6 };
// A snap line must run within this angle of the dragged edge (SNAP_PARALLEL_DEG in
// js/app/input.js).
const SNAP_PARALLEL_DEG = 3;

// The four corners on the page, in CSS px.
async function cornersOnPage(page) {
  const corners = [];
  for (let index = TOP_LEFT; index <= BOTTOM_LEFT; index++) {
    corners.push(await handleOnPage(page, index));
  }
  return corners;
}

// The worst corner's error against the photo's hand-placed corners, % of its diagonal.
async function errorAgainstTruth(page, name) {
  const { corners, source } = await editState(page);
  return cornerErrorPct(corners, GROUND_TRUTH[name], source.width, source.height);
}

// Expects two lists of [x, y] photo points to match within PHOTO_TOLERANCE_PX.
function expectSameCorners(actual, expected) {
  expect(actual).toHaveLength(expected.length);
  actual.forEach((point, index) => {
    expect(Math.abs(point[0] - expected[index][0])).toBeLessThan(PHOTO_TOLERANCE_PX);
    expect(Math.abs(point[1] - expected[index][1])).toBeLessThan(PHOTO_TOLERANCE_PX);
  });
}

// The message in the line above the controls, or '' when the line shows none.
const statusLine = page => page.locator('#perspectiveStatus');

// Expects the line above the controls to show this message.
async function expectStatus(page, text) {
  await expect(statusLine(page)).toBeVisible();
  await expect(statusLine(page).locator('.status-text')).toHaveText(text);
}

// Drags the top-left corner over to the right of and below the top-right one, so the outline
// crosses itself.
async function crossTheCorners(page, hand) {
  const topLeft = await handleOnPage(page, TOP_LEFT);
  const topRight = await handleOnPage(page, TOP_RIGHT);
  await hand.drag(topLeft, offsetBy(topRight, 40, 40));
}

test('PER-01.1 Opening a photo puts the corners on the card, with no undo step [phone] '
  + '[webkit]', async ({ page, check }) => {
  await openApp(page);
  await recordStatuses(page);
  await openPhoto(page, PHOTO);
  await check('for a moment the line above the controls reads "Detecting…"', async () => {
    expect(await readStatuses(page)).toContain('Detecting…');
  });
  await check('the corners sit on the card\'s own corners, within 1% of the diagonal', async () => {
    expect(await errorAgainstTruth(page, 'IMG_9136')).toBeLessThan(WITHIN_PCT);
  });
  await check('the line reads NUDGE and Corner 1 of 4, with Confidence at its right', async () => {
    const line = page.locator('#perspectiveLine');
    await expect(line.locator('.line-label')).toHaveText('Nudge');
    await expect(line.locator('.line-value')).toHaveText('Corner 1 of 4');
    await expect(line.locator('.line-readout')).toHaveText(/^Confidence \d+%$/);
  });
  await check('Undo is greyed out', async () => {
    await expect(page.locator('#btnUndo')).toBeDisabled();
  });
});

test('PER-02.1 A picture with no card gets the centered rectangle and a line, not a pop-up '
  + '[phone]', async ({ page, check }, testInfo) => {
  await startOnFixture(page, testInfo, BLANK_FIXTURE);
  await check('the outline is a rectangle a fifth in from each edge', async () => {
    expectSameCorners(await cornersNow(page), BLANK_INSET_CORNERS);
  });
  await check('no pop-up message is showing', async () => {
    await expect(page.locator('#toast')).not.toHaveClass(/is-shown/);
  });
  await check(`the line reads "${NOTHING_DETECTED}"`, async () => {
    await expectStatus(page, NOTHING_DETECTED);
  });
});

test('PER-03.1 A second photo opened during the search keeps its own corners [phone]', async ({
  page,
  check,
}) => {
  await openApp(page);
  const blank = fixturePicture(BLANK_FIXTURE);
  await recordStatuses(page);
  await page.setInputFiles('#fileInput', samplePath(PHOTO));
  await page.waitForFunction(() => {
    const app = window.__straightener.app;
    return !!app.img && app.detection.message === 'Detecting…';
  });
  // The first search's record, kept to check afterwards that its result was never stored.
  await page.evaluate(() => {
    window.testFirstSearch = window.__straightener.app.detection;
  });
  await check('the photo opens and the line above the controls reads "Detecting…"', async () => {
    expect(await editState(page)).toHaveProperty('source.name', PHOTO);
    expect(await readStatuses(page)).toContain('Detecting…');
  });
  await openPicture(page, blank);
  await check('the grey picture opens, while the first search was still running', async () => {
    expect(await editState(page)).toHaveProperty('source.name', blank.name);
    expect(await page.evaluate(() => window.testFirstSearch.message)).toBe('Detecting…');
  });
  await page.waitForTimeout(SEARCH_SETTLE_MS);
  await check('the first search\'s result was thrown away: the outline is the rectangle a fifth '
    + 'in from each edge', async () => {
    expect(await page.evaluate(() => window.testFirstSearch.last)).toBeNull();
    expectSameCorners(await cornersNow(page), BLANK_INSET_CORNERS);
  });
  await check(`the line reads "${NOTHING_DETECTED}"`, async () => {
    await expectStatus(page, NOTHING_DETECTED);
  });
});

// Waits until a pair's `side` is open. Unlike switchTo it doesn't wait for the side's search
// to finish: in PER-03.2 the side left behind has a search that never reports back.
function waitForSideOpen(page, side) {
  return page.waitForFunction(wanted => {
    const app = window.__straightener.app;
    return !!app.pair && app.pair.current === wanted && !app.isSwitching;
  }, side);
}

test('PER-03.2 A search still running when a pair switches sides is thrown away [phone]',
  async ({ page, check }, testInfo) => {
    test.fail(true, 'BUG-241');
    const hand = handFor(page, testInfo);
    await openApp(page);
    await openPhoto(page, PORTRAIT_PAIR.front);
    const frontCorners = await cornersNow(page);
    await addBack(page, hand, PORTRAIT_PAIR.back);
    const backMiddle = await cardMiddle(page);
    const topLeft = await handleOnPage(page, TOP_LEFT);
    await hand.drag(topLeft, offsetBy(topLeft, 40, 40));
    await check('that corner is off the back card\'s corner', async () => {
      expectMovedBy(await handleOnPage(page, TOP_LEFT), topLeft, 40, 40);
    });
    const dragged = await cornersNow(page);
    await openOptions(page, hand, 'perspective');
    await check('Tap to find card shows', async () => {
      await expect(page.locator('#btnFindCard')).toBeVisible();
    });
    await tapFindCard(page, hand);
    await check(`the line reads "${FIND_PROMPT}"`, async () => {
      await expectStatus(page, FIND_PROMPT);
    });
    await holdNextSearch(page);
    await tapAt(page, hand, backMiddle);
    await check('the line reads "Detecting…"', async () => {
      await expectStatus(page, 'Detecting…');
    });
    await hand.tap(sideButton(page, 'front'));
    await waitForSideOpen(page, 'front');
    await check('the front opens on Perspective, its corners on the front card', async () => {
      await expect(page.locator('#perspectiveArea')).toBeVisible();
      expectSameCorners(await cornersNow(page), frontCorners);
    });
    await releaseSearch(page);
    await page.waitForTimeout(SEARCH_SETTLE_MS);
    await check('the front\'s corners have not moved', async () => {
      expectSameCorners(await cornersNow(page), frontCorners);
    });
    await hand.tap(sideButton(page, 'back'));
    await waitForSideOpen(page, 'back');
    await check('the back opens; its top-left corner is still where it was dragged in row 1: the '
      + 'search\'s result was thrown away', async () => {
      expectSameCorners(await cornersNow(page), dragged);
    });
    await check('the line above the controls reads the normal Nudge line, NUDGE and Corner 1 of '
      + '4, not "Detecting…"', async () => {
      expect(await isNudgeLineNow(page)).toBe(true);
    });
  });

test('PER-04.1 The corner outline, white or red and dashed, for a person to judge [phone]',
  async ({ page, check }, testInfo) => {
    const hand = await startOnPerspective(page, testInfo);
    await check.eye('a thin solid white line with a dark halo along it, clear over both the '
      + 'light label and the dark parts of the photo');
    await crossTheCorners(page, hand);
    await check.eye('the outline crosses itself; the whole line is red and dashed, with no halo');
    await check(`the line reads "${CROSSED}"`, async () => {
      await expectStatus(page, CROSSED);
    });
  });

test('PER-05.1 The edge guide lines, for a person to judge [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnPerspective(page, testInfo);
  await check.eye('each edge carries on past both its corners as a faint dashed white line, to '
    + 'the edges of the photo and no further');
  const topLeft = await handleOnPage(page, TOP_LEFT);
  await hand.drag(topLeft, offsetBy(topLeft, 0, 40));
  await check('the top-left corner has moved 40 px down', async () => {
    const moved = await handleOnPage(page, TOP_LEFT);
    expect(Math.abs(moved.y - topLeft.y - 40)).toBeLessThan(SCREEN_TOLERANCE_PX);
  });
  await check.eye('the top and left dashed lines have turned with the two edges that moved, and '
    + 'still run to the photo\'s edges');
});

test('PER-06.1 The eight handles, for a person to judge [desktop]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnPerspective(page, testInfo);
  await check.eye('a ring with a center dot on each corner, a small white square at the middle '
    + 'of each edge; the top-left ring red and a little larger than the others');
  const next = page.locator('#btnNextHandle');
  for (let press = 0; press < 4; press++) await hand.tap(next);
  await check('the line reads Edge 1 of 4', async () => {
    await expect(page.locator('#perspectiveLine .line-value')).toHaveText('Edge 1 of 4');
  });
  const viewBox = await page.locator('#view').boundingBox();
  await tapAt(page, hand, { x: viewBox.x + 20, y: viewBox.y + 20 });
  await check.eye('no magnifier; the top edge\'s square is red and a little larger than the other '
    + 'squares; no ring is red');
  const middle = { x: viewBox.x + viewBox.width / 2, y: viewBox.y + viewBox.height / 2 };
  const fitted = await zoomNow(page);
  await page.mouse.move(middle.x, middle.y);
  for (let notch = 0; notch < 3; notch++) await page.mouse.wheel(0, -100);
  await page.waitForFunction(zoom => window.CF.currentView().zoom > zoom, fitted);
  await check('the photo has zoomed in', async () => {
    expect(await zoomNow(page)).toBeGreaterThan(fitted);
  });
  await waitForStill(page);
  await check.eye('zoomed in: the rings and squares are the same size on screen as before');
});

// Expects a point on the page to have moved by (dx, dy) CSS px from `from`.
function expectMovedBy(point, from, dx, dy) {
  expect(Math.abs(point.x - from.x - dx)).toBeLessThan(SCREEN_TOLERANCE_PX);
  expect(Math.abs(point.y - from.y - dy)).toBeLessThan(SCREEN_TOLERANCE_PX);
}

// The button under Nudge's line that moves the selected handle one way: 'left', 'up', 'down'
// or 'right'.
function arrowButton(page, direction) {
  const keys = { left: '-1,0', up: '0,-1', down: '0,1', right: '1,0' };
  return page.locator(`#perspectiveNudge .nudge-key[data-key="${keys[direction]}"]`);
}

// How many times the arrow cases tap an arrow in a row: enough that the move (one screen
// pixel a tap) is easy to see.
const ARROW_TAPS = 10;

// Taps the arrow button for `direction` `times` times in a row, as quickly as a person would.
async function tapArrow(page, hand, direction, times) {
  for (let tap = 0; tap < times; tap++) await hand.tap(arrowButton(page, direction));
}

test('PER-07.1 Dragging a corner moves it, as one undo step [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnPerspective(page, testInfo);
  const before = await cornersOnPage(page);
  const start = before[TOP_RIGHT];
  await hand.drag(start, offsetBy(start, 30, 20));
  await check('that corner has moved 30 px right and 20 px down; the other three have not moved',
    async () => {
      const after = await cornersOnPage(page);
      expectMovedBy(after[TOP_RIGHT], start, 30, 20);
      for (const index of [TOP_LEFT, BOTTOM_RIGHT, BOTTOM_LEFT]) {
        expectMovedBy(after[index], before[index], 0, 0);
      }
    });
  await hand.tap(page.locator('#btnUndo'));
  await check('the corner is back where it was; Undo is greyed out again', async () => {
    expectMovedBy(await handleOnPage(page, TOP_RIGHT), start, 0, 0);
    await expect(page.locator('#btnUndo')).toBeDisabled();
  });
});

// PER-07.2's presses, in ring widths from the middle of a corner ring: just outside the ring
// (within CONFIG.handle.hitRadius, 24 px), and well beyond that reach.
const RING_NEAR = 0.75;
const RING_FAR = 1.5;

test('PER-07.2 A press within reach of a corner grabs it; further away it moves the photo '
  + '[phone] [webkit]', async ({ page, check }, testInfo) => {
  const hand = await startOnPerspective(page, testInfo);
  const topLeft = await handleOnPage(page, TOP_LEFT);
  const ringWidthPx = 2 * await page.evaluate(() => CONFIG.handle.cornerRadius);
  const near = offsetBy(topLeft, -RING_NEAR * ringWidthPx, 0);
  await hand.drag(near, offsetBy(near, 0, 30));
  await check('the top-left corner has moved 30 px down', async () => {
    expectMovedBy(await handleOnPage(page, TOP_LEFT), topLeft, 0, 30);
  });
  await hand.tap(page.locator('#btnUndo'));
  await check('the corner is back where it was', async () => {
    expectMovedBy(await handleOnPage(page, TOP_LEFT), topLeft, 0, 0);
  });
  const cornersBefore = await cornersNow(page);
  const pagePointsBefore = await cornersOnPage(page);
  const far = offsetBy(topLeft, -RING_FAR * ringWidthPx, 0);
  await hand.drag(far, offsetBy(far, 0, 30));
  await check('the whole photo, outline and all, has moved 30 px down; every corner is still on '
    + 'the same point of the card', async () => {
    expectSameCorners(await cornersNow(page), cornersBefore);
    const pagePointsAfter = await cornersOnPage(page);
    pagePointsAfter.forEach((point, index) => {
      expectMovedBy(point, pagePointsBefore[index], 0, 30);
    });
  });
});

test('PER-07.3 Where a corner and an edge square are both in reach, the corner wins [phone] '
  + '[webkit]',
  async ({ page, check }, testInfo) => {
    const hand = await startOnPerspective(page, testInfo);
    const topLeft = await handleOnPage(page, TOP_LEFT);
    const topRight = await handleOnPage(page, TOP_RIGHT);
    await hand.drag(topRight, offsetBy(topLeft, 30, 0));
    const square = await handleOnPage(page, TOP_EDGE);
    await check('the top edge is 30 px long, with its square midway', async () => {
      expectMovedBy(await handleOnPage(page, TOP_RIGHT), topLeft, 30, 0);
      expectMovedBy(square, topLeft, 15, 0);
    });
    const before = await cornersOnPage(page);
    await hand.drag(square, offsetBy(square, 0, 30));
    await check('one of the two top corners has moved 30 px down and the other has not: the '
      + 'edge did not slide as a whole', async () => {
      const after = await cornersOnPage(page);
      const movedDown = [TOP_LEFT, TOP_RIGHT]
        .map(index => Math.round(after[index].y - before[index].y))
        .sort((first, second) => first - second);
      expect(movedDown).toEqual([0, 30]);
      expectMovedBy(after[BOTTOM_LEFT], before[BOTTOM_LEFT], 0, 0);
    });
  });

// The body of PER-07.4 and PER-08.2: a finger drags a handle 40 px (a corner to the left, an
// edge down) and the browser cancels the touch before it lifts. By ruling R8 the handle goes
// back, with no undo step. label: what moved, for the results.
async function checkCancelledDrag(page, check, testInfo, handleIndex, label) {
  const hand = await startOnPerspective(page, testInfo);
  const cornersBefore = await cornersNow(page);
  const start = await handleOnPage(page, handleIndex);
  const isEdge = handleIndex >= TOP_EDGE;
  const end = isEdge ? offsetBy(start, 0, 40) : offsetBy(start, -40, 0);
  await holdDragAt(page, hand, start, end);
  await check(`the ${label} follows the finger`, async () => {
    expectMovedBy(await handleOnPage(page, handleIndex), end, 0, 0);
  });
  await sendTouch(page, '#view', 'pointercancel', end);
  await check(`the ${label} is back where it was before the drag; Undo is greyed out`, async () => {
    expectSameCorners(await cornersNow(page), cornersBefore);
    expect(await page.locator('#btnUndo').isDisabled()).toBe(true);
  });
}

test('PER-07.4 A drag the browser cancels puts the corner back [phone]', async ({
  page,
  check,
}, testInfo) => {
  await checkCancelledDrag(page, check, testInfo, TOP_RIGHT, 'corner');
});

// How each of the two top corners moved, in photo px: [[dx, dy], [dx, dy]].
function topCornerMoves(before, after) {
  return [TOP_LEFT, TOP_RIGHT].map(index => [
    after[index][0] - before[index][0],
    after[index][1] - before[index][1],
  ]);
}

test('PER-08.1 Dragging an edge\'s square slides the whole edge, as one undo step [phone] '
  + '[webkit]', async ({ page, check }, testInfo) => {
  const hand = await startOnPerspective(page, testInfo);
  const before = await cornersNow(page);
  const zoom = await zoomNow(page);
  const square = await handleOnPage(page, TOP_EDGE);
  await hand.drag(square, offsetBy(square, 20, 30));
  await check('both top corners moved down by the same amount, square to the edge; the bottom '
    + 'corners have not moved', async () => {
    const after = await cornersNow(page);
    const [leftMove, rightMove] = topCornerMoves(before, after);
    expectSameCorners([rightMove], [leftMove]);
    const edgeX = before[TOP_RIGHT][0] - before[TOP_LEFT][0];
    const edgeY = before[TOP_RIGHT][1] - before[TOP_LEFT][1];
    const edgeLength = Math.hypot(edgeX, edgeY);
    const alongEdge = (leftMove[0] * edgeX + leftMove[1] * edgeY) / edgeLength;
    expect(Math.abs(alongEdge)).toBeLessThan(PHOTO_TOLERANCE_PX);
    // The drag's part square to the edge (its normal points down for a left-to-right edge).
    const squarePx = (20 * -edgeY + 30 * edgeX) / edgeLength;
    const movedPx = Math.hypot(leftMove[0], leftMove[1]) * zoom;
    expect(Math.abs(movedPx - squarePx)).toBeLessThan(SCREEN_TOLERANCE_PX);
    expectSameCorners(after.slice(BOTTOM_RIGHT), before.slice(BOTTOM_RIGHT));
  });
  await hand.tap(page.locator('#btnUndo'));
  await check('the top edge is back where it was; Undo is greyed out again', async () => {
    expectSameCorners(await cornersNow(page), before);
    await expect(page.locator('#btnUndo')).toBeDisabled();
  });
});

test('PER-08.2 An edge drag the browser cancels puts the edge back [phone]', async ({
  page,
  check,
}, testInfo) => {
  await checkCancelledDrag(page, check, testInfo, TOP_EDGE, 'top edge');
});

test('PER-09.1 A tapped handle is the one the arrow buttons move [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnPerspective(page, testInfo);
  await tapAt(page, hand, await handleOnPage(page, BOTTOM_RIGHT));
  await check('the line reads Corner 3 of 4', async () => {
    await expect(handleName(page)).toHaveText('Corner 3 of 4');
  });
  const before = await cornersNow(page);
  const zoom = await zoomNow(page);
  const stepPx = Math.max(1, 1 / zoom);
  await tapArrow(page, hand, 'right', ARROW_TAPS);
  await check('the bottom-right corner has moved about 10 px right (one screen pixel a tap); the '
    + 'top-left corner has not moved', async () => {
    const after = await cornersNow(page);
    const movedPx = after[BOTTOM_RIGHT][0] - before[BOTTOM_RIGHT][0];
    expect(Math.abs(movedPx - ARROW_TAPS * stepPx)).toBeLessThan(PHOTO_TOLERANCE_PX);
    expect(Math.abs(movedPx * zoom - ARROW_TAPS)).toBeLessThan(SCREEN_TOLERANCE_PX);
    expectSameCorners([after[TOP_LEFT]], [before[TOP_LEFT]]);
  });
});

test('PER-09.2 A clicked handle is the one the keyboard\'s arrow keys move [desktop]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnPerspective(page, testInfo);
  await tapAt(page, hand, await handleOnPage(page, BOTTOM_RIGHT));
  await check('the line reads Corner 3 of 4', async () => {
    await expect(handleName(page)).toHaveText('Corner 3 of 4');
  });
  const before = await cornersNow(page);
  await page.keyboard.press('ArrowLeft');
  await check('the bottom-right corner moves left by one pixel of the photo; the top-left has '
    + 'not moved', async () => {
    const after = await cornersNow(page);
    const movedPx = after[BOTTOM_RIGHT][0] - before[BOTTOM_RIGHT][0];
    expect(Math.abs(movedPx + 1)).toBeLessThan(PHOTO_TOLERANCE_PX);
    expectSameCorners([after[TOP_LEFT]], [before[TOP_LEFT]]);
  });
});

test('PER-10.1 The magnifier under a finger, for a person to judge [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnPerspective(page, testInfo);
  const bottomLeft = await handleOnPage(page, BOTTOM_LEFT);
  await holdDragAt(page, hand, bottomLeft, offsetBy(bottomLeft, 30, 0));
  await check.eye('a round magnifier 150 px across in the top right corner of the photo area: '
    + 'the photo around the corner, 4 times larger, with the outline, a crosshair and a white rim');
  await releaseDrag(page, hand, offsetBy(bottomLeft, 30, 0));
  await check.eye('the finger lifted: no magnifier');
  const bottomRight = await handleOnPage(page, BOTTOM_RIGHT);
  await holdDragAt(page, hand, bottomRight, offsetBy(bottomRight, -30, 0));
  await check.eye('the magnifier is in the top left corner of the photo area');
  await releaseDrag(page, hand, offsetBy(bottomRight, -30, 0));
  await check.eye('the finger lifted: no magnifier');
});

// PER-10.2 drags a corner to this far below the top edge of the photo area, in CSS px.
const NEAR_TOP_PX = 10;

test('PER-10.2 The magnifier beside the mouse, for a person to judge [desktop]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnPerspective(page, testInfo);
  const bottomLeft = await handleOnPage(page, BOTTOM_LEFT);
  await holdDragAt(page, hand, bottomLeft, offsetBy(bottomLeft, 30, 0));
  await check.eye('a round magnifier 150 px across, up and to the right of the pointer, with the '
    + 'photo around the corner 4 times larger, the outline, a crosshair and a white rim');
  await releaseDrag(page, hand);
  await check.eye('the button let go: no magnifier');
  const topLeft = await handleOnPage(page, TOP_LEFT);
  const viewBox = await page.locator('#view').boundingBox();
  const nearTop = { x: topLeft.x, y: viewBox.y + NEAR_TOP_PX };
  await holdDragAt(page, hand, topLeft, nearTop);
  await check.eye('near the top of the photo area, the magnifier sits below and to the right of '
    + 'the pointer');
  await releaseDrag(page, hand);
  await check.eye('the button let go: no magnifier');
});

test('PER-10.3 The magnifier is never wider than 42% of the photo area, for a person to judge '
  + '[phone]', async ({ page, check }, testInfo) => {
  const hand = await startOnPerspective(page, testInfo, { address: 'index.html?loupeSize=400' });
  const bottomLeft = await handleOnPage(page, BOTTOM_LEFT);
  await holdDragAt(page, hand, bottomLeft, offsetBy(bottomLeft, 30, 0));
  await check('the magnifier is about 164 px across (42% of the photo area), not 400 px',
    async () => {
      const sizes = await page.evaluate(() => ({
        acrossPx: window.CF.loupeRadius() * 2,
        photoAreaPx: document.getElementById('view').getBoundingClientRect().width,
      }));
      const widestPx = sizes.photoAreaPx * MAGNIFIER_MAX_FRACTION;
      expect(Math.abs(sizes.acrossPx - widestPx)).toBeLessThan(SCREEN_TOLERANCE_PX);
    });
  await check.eye('a magnifier about 164 px across, well under half the photo area\'s width');
  await releaseDrag(page, hand, offsetBy(bottomLeft, 30, 0));
  await check.eye('the finger lifted: no magnifier');
});

test('PER-11.1 A double tap on a handle zooms in on it, and another zooms back out [phone] '
  + '[webkit]',
  async ({ page, check }, testInfo) => {
    const hand = await startOnPerspective(page, testInfo);
    const fitted = await fittedZoom(page);
    await doubleTapAt(page, hand, await handleOnPage(page, TOP_LEFT));
    await page.waitForFunction(zoom => window.CF.currentView().zoom > zoom * 2, fitted);
    await check('the photo zooms in to 6 times its fitted size, with that corner in the middle '
      + 'of the photo area', async () => {
      expect(Math.abs(await zoomNow(page) / fitted - HANDLE_ZOOM)).toBeLessThan(ZOOM_TOLERANCE);
      const box = await page.locator('#view').boundingBox();
      const middle = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
      expectMovedBy(await handleOnPage(page, TOP_LEFT), middle, 0, 0);
    });
    await doubleTapAt(page, hand, await handleOnPage(page, TOP_LEFT));
    await page.waitForFunction(zoom => window.CF.currentView().zoom < zoom * 2, fitted);
    await check('the whole photo fits the photo area again', async () => {
      expect(Math.abs(await zoomNow(page) / fitted - 1)).toBeLessThan(ZOOM_TOLERANCE);
    });
  });

test('PER-12.1 The line names the handle last tapped [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnPerspective(page, testInfo);
  await check('the line reads NUDGE, then Corner 1 of 4', async () => {
    await expect(page.locator('#perspectiveLine .line-label')).toHaveText('Nudge');
    await expect(handleName(page)).toHaveText('Corner 1 of 4');
  });
  await tapAt(page, hand, await handleOnPage(page, BOTTOM_LEFT));
  await check('the line reads Corner 4 of 4', async () => {
    await expect(handleName(page)).toHaveText('Corner 4 of 4');
  });
  await tapAt(page, hand, await handleOnPage(page, LEFT_EDGE));
  await check('the line reads Edge 4 of 4', async () => {
    await expect(handleName(page)).toHaveText('Edge 4 of 4');
  });
  await tapAt(page, hand, await handleOnPage(page, TOP_EDGE));
  await check('the line reads Edge 1 of 4', async () => {
    await expect(handleName(page)).toHaveText('Edge 1 of 4');
  });
});

test('PER-12.2 The line follows the Tab key [desktop]', async ({ page, check }, testInfo) => {
  const hand = await startOnPerspective(page, testInfo);
  const viewBox = await page.locator('#view').boundingBox();
  await tapAt(page, hand, { x: viewBox.x + 20, y: viewBox.y + 20 });
  await check('the line reads Corner 1 of 4', async () => {
    await expect(handleName(page)).toHaveText('Corner 1 of 4');
  });
  await page.keyboard.press('Tab');
  await check('the line reads Corner 2 of 4', async () => {
    await expect(handleName(page)).toHaveText('Corner 2 of 4');
  });
  await page.keyboard.press('Tab');
  await check('the line reads Corner 3 of 4', async () => {
    await expect(handleName(page)).toHaveText('Corner 3 of 4');
  });
});

// The confidence readout at the right of the line above the controls.
const confidence = page => page.locator('#perspectiveLine .line-readout');

// The value Candidate shows in place of its icon, such as 2/3.
const candidateNumber = page => page.locator('#toolCandidate .tool-value');

// The detected candidates' corners, best first.
function candidateCorners(page) {
  return page.evaluate(() => window.__straightener.app.detection.candidates
    .map(candidate => candidate.corners));
}

test('PER-13.1 Confidence shows at the right of the line, except in Preview [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnPerspective(page, testInfo);
  await check('the line reads Confidence 99% at its right', async () => {
    await expect(confidence(page)).toHaveText('Confidence 99%');
  });
  await hand.tap(page.locator('#toolFlatten'));
  await check('the line reads FLATTEN 100%, still with Confidence 99%', async () => {
    await expect(page.locator('#perspectiveLine .line-label')).toHaveText('Flatten');
    await expect(handleName(page)).toHaveText('100%');
    await expect(confidence(page)).toHaveText('Confidence 99%');
  });
  await hand.tap(page.locator('#toolPreview'));
  await check('the line reads PREVIEW and "The corrected card. Handles are hidden.", with no '
    + 'confidence', async () => {
    const previewLine = page.locator('#perspectivePreviewLine');
    await expect(previewLine).toBeVisible();
    await expect(previewLine).toContainText('The corrected card. Handles are hidden.');
    await expect(page.locator('#perspectiveLine')).toBeHidden();
  });
  await hand.tap(page.locator('#toolPreview'));
  await check('the line reads FLATTEN 100% with Confidence 99% again', async () => {
    await expect(handleName(page)).toHaveText('100%');
    await expect(confidence(page)).toHaveText('Confidence 99%');
  });
});

test('PER-13.2 Moving a corner by hand clears the confidence, and Undo brings it back [phone]',
  async ({ page, check }, testInfo) => {
    const hand = await startOnPerspective(page, testInfo);
    await check('the line reads Confidence 99%', async () => {
      await expect(confidence(page)).toHaveText('Confidence 99%');
    });
    const topRight = await handleOnPage(page, TOP_RIGHT);
    await hand.drag(topRight, offsetBy(topRight, 30, 0));
    await check('no confidence shows at the right of the line', async () => {
      expectMovedBy(await handleOnPage(page, TOP_RIGHT), topRight, 30, 0);
      await expect(page.locator('#perspectiveLine')).toBeVisible();
      await expect(confidence(page)).toHaveText('');
    });
    await hand.tap(page.locator('#btnUndo'));
    await check('the corner is back, and the line reads Confidence 99% again', async () => {
      expectMovedBy(await handleOnPage(page, TOP_RIGHT), topRight, 0, 0);
      await expect(confidence(page)).toHaveText('Confidence 99%');
    });
  });

test('PER-13.3 Undo and Reset perspective bring back the confidence of the corners they '
  + 'restore [phone]', async ({ page, check }, testInfo) => {
  const hand = await startOnPerspective(page, testInfo);
  const candidates = await candidateCorners(page);
  await hand.tap(page.locator('#toolCandidate'));
  await check('Candidate reads 2/3, and the line reads Confidence 100%', async () => {
    await expect(candidateNumber(page)).toHaveText('2/3');
    await expect(confidence(page)).toHaveText('Confidence 100%');
  });
  await hand.tap(page.locator('#btnUndo'));
  await check('the corners are back on the first candidate, and the line reads Confidence 99%',
    async () => {
      expectSameCorners(await cornersNow(page), candidates[0]);
      await expect(confidence(page)).toHaveText('Confidence 99%');
    });
  await hand.tap(page.locator('#toolCandidate'));
  await check('Candidate reads 2/3 again, with Confidence 100%', async () => {
    await expect(candidateNumber(page)).toHaveText('2/3');
    await expect(confidence(page)).toHaveText('Confidence 100%');
  });
  await openOptions(page, hand, 'perspective');
  await check('Reset perspective shows', async () => {
    await expect(page.locator('#btnResetPerspective')).toBeVisible();
  });
  await hand.tap(page.locator('#btnResetPerspective'));
  await check('the corners are back on the first candidate, and the line reads Confidence 99%',
    async () => {
      expectSameCorners(await cornersNow(page), candidates[0]);
      await expect(confidence(page)).toHaveText('Confidence 99%');
    });
});

test('PER-13.4 With nothing detected, the line shows no confidence [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnFixture(page, testInfo, BLANK_FIXTURE);
  await check(`the line reads "${NOTHING_DETECTED}"`, async () => {
    await expectStatus(page, NOTHING_DETECTED);
  });
  await hand.tap(arrowButton(page, 'right'));
  await check('the message has gone: the line reads NUDGE and Corner 1 of 4, with nothing at its '
    + 'right end (no Confidence)', async () => {
    await expectNudgeLine(page);
    await expect(handleName(page)).toHaveText('Corner 1 of 4');
    await expect(confidence(page)).toHaveText('');
  });
});

// How far the top-left corner is from `start`, in photo px: [dx, dy].
async function topLeftMovedFrom(page, start) {
  const [corner] = await cornersNow(page);
  return [corner[0] - start[0], corner[1] - start[1]];
}

// Expects a move in photo px to be (dx, dy) within PHOTO_TOLERANCE_PX.
function expectMove(move, dx, dy) {
  expect(Math.abs(move[0] - dx)).toBeLessThan(PHOTO_TOLERANCE_PX);
  expect(Math.abs(move[1] - dy)).toBeLessThan(PHOTO_TOLERANCE_PX);
}

// PER-14.1 opens the app with a link that makes a double tap on a handle zoom to 20 times the
// fitted size (the most CONFIG_LIMITS allows), where one photo pixel is several screen pixels.
const DEEP_HANDLE_ZOOM = 20;
const DEEP_ZOOM_LINK = `index.html?handleZoom=${DEEP_HANDLE_ZOOM}`;

test('PER-14.1 Each arrow button moves the handle one screen pixel, never less than one photo '
  + 'pixel [phone]', async ({ page, check }, testInfo) => {
  const hand = await startOnPerspective(page, testInfo, { address: DEEP_ZOOM_LINK });
  const [start] = await cornersNow(page);
  const fitted = await zoomNow(page);
  const tenScreenPx = ARROW_TAPS * Math.max(1, 1 / fitted);
  const presses = [
    ['right', [tenScreenPx, 0], 'the top-left corner has moved 10 px right on the screen'],
    ['down', [tenScreenPx, tenScreenPx], 'it has moved 10 px down'],
    ['left', [0, tenScreenPx], 'it has moved 10 px left'],
    ['up', [0, 0], 'it has moved 10 px up, back where it started'],
  ];
  for (const [direction, [dx, dy], expected] of presses) {
    await tapArrow(page, hand, direction, ARROW_TAPS);
    await check(expected, async () => {
      expectMove(await topLeftMovedFrom(page, start), dx, dy);
    });
  }
  await doubleTapAt(page, hand, await handleOnPage(page, TOP_LEFT));
  await page.waitForFunction(zoom => window.CF.currentView().zoom > zoom * 2, fitted);
  const zoomed = await zoomNow(page);
  const zoomedFrom = await handleOnPage(page, TOP_LEFT);
  await check('the photo zooms in to 20 times its fitted size, with that corner in the middle of '
    + 'the photo area: one pixel of the photo is now about 4.6 px on the screen', async () => {
    expect(Math.abs(zoomed / fitted - DEEP_HANDLE_ZOOM)).toBeLessThan(ZOOM_TOLERANCE);
    const box = await page.locator('#view').boundingBox();
    const middle = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    expectMovedBy(zoomedFrom, middle, 0, 0);
    expect(zoomed).toBeGreaterThan(1);
  });
  await tapArrow(page, hand, 'right', ARROW_TAPS);
  await check('the corner has moved about 46 px right on the screen: ten pixels of the photo, '
    + 'one a tap, not ten screen pixels', async () => {
    expectMove(await topLeftMovedFrom(page, start), ARROW_TAPS, 0);
    expectMovedBy(await handleOnPage(page, TOP_LEFT), zoomedFrom, ARROW_TAPS * zoomed, 0);
  });
});

// True while the magnifier shown after a nudge is up.
function isNudgeMagnifierUp(page) {
  return page.evaluate(() => window.__straightener.app.nudgeLoupeUntil > performance.now());
}

test('PER-14.2 The keyboard\'s arrow keys move one photo pixel, or ten with Shift, with no '
  + 'magnifier [desktop]', async ({ page, check }, testInfo) => {
  const hand = await startOnPerspective(page, testInfo);
  const [start] = await cornersNow(page);
  const stepPx = 1 / await zoomNow(page);
  await hand.tap(arrowButton(page, 'right'));
  await check('the corner moves one screen pixel (about three photo pixels) right, and a round '
    + 'magnifier shows it', async () => {
    expectMove(await topLeftMovedFrom(page, start), stepPx, 0);
    expect(await isNudgeMagnifierUp(page)).toBe(true);
  });
  const viewBox = await page.locator('#view').boundingBox();
  await tapAt(page, hand, { x: viewBox.x + 20, y: viewBox.y + 20 });
  await check('the magnifier goes', async () => {
    expect(await isNudgeMagnifierUp(page)).toBe(false);
  });
  await page.keyboard.press('ArrowRight');
  await check('the corner moves right by one pixel of the photo; no magnifier shows', async () => {
    expectMove(await topLeftMovedFrom(page, start), stepPx + 1, 0);
    expect(await isNudgeMagnifierUp(page)).toBe(false);
  });
  await page.keyboard.press('Shift+ArrowRight');
  await check('the corner moves right by ten pixels of the photo; no magnifier shows', async () => {
    expectMove(await topLeftMovedFrom(page, start), stepPx + 11, 0);
    expect(await isNudgeMagnifierUp(page)).toBe(false);
  });
});

// The selector of the right arrow button, for a held press.
const RIGHT_ARROW = '#perspectiveNudge .nudge-key[data-key="1,0"]';
// A held arrow starts repeating after CONFIG.nudge.delayMs (350 ms), every
// CONFIG.nudge.repeatMs (60 ms, about 16 steps a second): its second step comes about 410 ms
// after the first. PER-15.1 checks that gap is between FIRST_REPEAT_MIN_MS (the delay, less a
// frame for reading the corner once a frame) and FIRST_REPEAT_MAX_MS, and that the repeats
// come no faster than REPEATS_PER_SECOND_MAX; a slow machine may be slower, never faster.
const FIRST_REPEAT_MIN_MS = 330;
const FIRST_REPEAT_MAX_MS = 700;
const KEEP_HOLDING_MS = 2000;
const HELD_MOVE_MIN_PX = 25;
const REPEATS_PER_SECOND_MAX = 20;
// How long PER-15.1 watches the corner after the arrow is let go, in ms.
const STOP_WATCH_MS = 200;
const STILL_WAIT_MS = 500;

// How many arrow steps the top-left corner has moved right of `start` (photo px).
async function stepsRightOf(page, start, stepPx) {
  const [dx] = await topLeftMovedFrom(page, start);
  return Math.round(dx / stepPx);
}

test('PER-15.1 Holding an arrow repeats it until it is let go, as one undo step [phone]',
  async ({ page, check }, testInfo) => {
    const hand = await startOnPerspective(page, testInfo);
    const [start] = await cornersNow(page);
    const zoom = await zoomNow(page);
    const stepPx = Math.max(1, 1 / zoom);
    await recordCornerMoveTimes(page);
    const pressed = await pressButton(page, hand, RIGHT_ARROW);
    await check('at once a round magnifier shows the top-left corner, which has taken one step '
      + 'right; for about 0.4 seconds it moves no further', async () => {
      expect(await stepsRightOf(page, start, stepPx)).toBe(1);
      expect(await isNudgeMagnifierUp(page)).toBe(true);
      await page.waitForTimeout(FIRST_REPEAT_MAX_MS);
      const [firstStep, secondStep] = await readCornerMoveTimes(page);
      expect(secondStep - firstStep).toBeGreaterThanOrEqual(FIRST_REPEAT_MIN_MS);
      expect(secondStep - firstStep).toBeLessThan(FIRST_REPEAT_MAX_MS);
    });
    await page.waitForTimeout(KEEP_HOLDING_MS);
    await check('the corner glides steadily right, one screen pixel a step, about 16 steps a '
      + 'second: more than 25 px from where it started', async () => {
      const [movedPx] = await topLeftMovedFrom(page, start);
      expect(movedPx * zoom).toBeGreaterThan(HELD_MOVE_MIN_PX);
      const times = await readCornerMoveTimes(page);
      const repeats = times.length - 2;
      const perSecond = repeats * 1000 / (times[times.length - 1] - times[1]);
      expect(perSecond).toBeLessThan(REPEATS_PER_SECOND_MAX);
    });
    await releaseButton(page, hand, RIGHT_ARROW, pressed);
    const stepsAtRelease = await stepsRightOf(page, start, stepPx);
    await page.waitForTimeout(STOP_WATCH_MS);
    await check('the corner stops', async () => {
      expect(await stepsRightOf(page, start, stepPx)).toBe(stepsAtRelease);
    });
    await page.waitForTimeout(STILL_WAIT_MS);
    await check('the corner has not moved since row 3', async () => {
      expect(await stepsRightOf(page, start, stepPx)).toBe(stepsAtRelease);
    });
    await hand.tap(page.locator('#btnUndo'));
    await check('the corner is back where it started; Undo is greyed out: the whole hold was one '
      + 'undo step', async () => {
      expectMove(await topLeftMovedFrom(page, start), 0, 0);
      await expect(page.locator('#btnUndo')).toBeDisabled();
    });
  });

// How long PER-15.2 waits between its two runs of taps: longer than the 0.9 s that merges.
const BETWEEN_RUNS_MS = 1500;

test('PER-15.2 Taps on the arrows less than 0.9 seconds apart are one undo step [phone]',
  async ({ page, check }, testInfo) => {
    const hand = await startOnPerspective(page, testInfo);
    const [start] = await cornersNow(page);
    const stepPx = Math.max(1, 1 / await zoomNow(page));
    await tapArrow(page, hand, 'right', ARROW_TAPS);
    await check('the top-left corner has moved 10 px right', async () => {
      expect(await stepsRightOf(page, start, stepPx)).toBe(ARROW_TAPS);
    });
    await page.waitForTimeout(BETWEEN_RUNS_MS);
    await check('the corner stays where it is', async () => {
      expect(await stepsRightOf(page, start, stepPx)).toBe(ARROW_TAPS);
    });
    await tapArrow(page, hand, 'right', ARROW_TAPS);
    await check('it has moved 20 px right in all', async () => {
      expect(await stepsRightOf(page, start, stepPx)).toBe(2 * ARROW_TAPS);
    });
    await hand.tap(page.locator('#btnUndo'));
    await check('it is 10 px right of where it started: only the second ten taps were undone',
      async () => {
        expect(await stepsRightOf(page, start, stepPx)).toBe(ARROW_TAPS);
      });
    await hand.tap(page.locator('#btnUndo'));
    await check('it is back where it started, and Undo is greyed out: the first ten quick taps '
      + 'were one step', async () => {
      expectMove(await topLeftMovedFrom(page, start), 0, 0);
      await expect(page.locator('#btnUndo')).toBeDisabled();
    });
  });

test('PER-15.3 Sliding off a held arrow stops the repeat [desktop]', async ({
  page,
  check,
}, testInfo) => {
  await startOnPerspective(page, testInfo);
  const [start] = await cornersNow(page);
  const stepPx = 1 / await zoomNow(page);
  const arrow = await page.locator(RIGHT_ARROW).boundingBox();
  const middle = { x: arrow.x + arrow.width / 2, y: arrow.y + arrow.height / 2 };
  await page.mouse.move(middle.x, middle.y);
  await page.mouse.down();
  await page.waitForTimeout(600);
  await check('the corner moved, and kept moving while held', async () => {
    expect(await stepsRightOf(page, start, stepPx)).toBeGreaterThan(1);
  });
  await page.mouse.move(middle.x, middle.y - 100);
  const stepsWhenOff = await stepsRightOf(page, start, stepPx);
  await page.waitForTimeout(500);
  await check('off the arrow, the corner stopped moving', async () => {
    expect(await stepsRightOf(page, start, stepPx)).toBe(stepsWhenOff);
  });
  await page.mouse.up();
  await check('after letting go, it has not moved since', async () => {
    expect(await stepsRightOf(page, start, stepPx)).toBe(stepsWhenOff);
  });
});

test('PER-16.1 Next handle steps through the eight handles and wraps [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnPerspective(page, testInfo);
  const next = page.locator('#btnNextHandle');
  const rounds = [
    ['Corner 2 of 4', 'Corner 3 of 4', 'Corner 4 of 4'],
    ['Edge 1 of 4', 'Edge 2 of 4', 'Edge 3 of 4', 'Edge 4 of 4'],
    ['Corner 1 of 4'],
  ];
  for (const names of rounds) {
    const seen = [];
    for (let press = 0; press < names.length; press++) {
      await hand.tap(next);
      seen.push(await handleName(page).textContent());
    }
    await check(names.join(', '), async () => {
      expect(seen).toEqual(names);
    });
  }
});

test('PER-17.1 The magnifier after a nudge, for a person to judge [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnPerspective(page, testInfo);
  await hand.tap(arrowButton(page, 'right'));
  await check('a magnifier shows the top-left corner', async () => {
    expect(await isNudgeMagnifierUp(page)).toBe(true);
  });
  await check.eye('a round magnifier on the top-left corner, in the top right of the photo area');
  await page.waitForTimeout(5000);
  await check('five seconds later the magnifier has gone', async () => {
    expect(await isNudgeMagnifierUp(page)).toBe(false);
  });
  await check.eye('no magnifier');
  await hand.tap(page.locator('#btnNextHandle'));
  await check('the line reads Corner 2 of 4, and the magnifier shows', async () => {
    await expect(handleName(page)).toHaveText('Corner 2 of 4');
    expect(await isNudgeMagnifierUp(page)).toBe(true);
  });
  await check.eye('the magnifier shows the top-right corner, in the top left of the photo area');
  await hand.tap(page.locator('#toolSnap'));
  await check('Snap makes the magnifier go at once', async () => {
    expect(await isNudgeMagnifierUp(page)).toBe(false);
  });
  await check.eye('no magnifier');
  await hand.tap(arrowButton(page, 'right'));
  await check('the right arrow shows the magnifier again', async () => {
    expect(await isNudgeMagnifierUp(page)).toBe(true);
  });
  await goToStep(page, 'rotate', hand);
  await goToStep(page, 'perspective', hand);
  await check('back on Perspective, no magnifier shows', async () => {
    expect(await isNudgeMagnifierUp(page)).toBe(false);
  });
  await check.eye('back on Perspective: no magnifier');
});

test('PER-18.1 Nudge is the resting mode, with the handle\'s name, the arrows and Next handle '
  + '[phone]', async ({ page, check }, testInfo) => {
  const hand = await startOnPerspective(page, testInfo);
  const nudge = page.locator('#toolNudge');
  const flatten = page.locator('#toolFlatten');
  const nudgeRow = page.locator('#perspectiveNudgeRow');
  await check('Nudge is selected; the line reads NUDGE and Corner 1 of 4, with the arrows and '
    + 'Next handle under it', async () => {
    await expect.poll(() => hasWhiteFill(nudge)).toBe(true);
    await expect(page.locator('#perspectiveLine .line-label')).toHaveText('Nudge');
    await expect(handleName(page)).toHaveText('Corner 1 of 4');
    await expect(nudgeRow).toBeVisible();
    await expect(page.locator('#btnNextHandle')).toBeVisible();
  });
  await hand.tap(flatten);
  await check('Flatten is selected instead; the arrows and Next handle have gone', async () => {
    await expect.poll(() => hasWhiteFill(flatten)).toBe(true);
    await expect.poll(() => hasWhiteFill(nudge)).toBe(false);
    await expect(nudgeRow).toBeHidden();
  });
  await hand.tap(nudge);
  await check('Nudge is selected again, with its line, the arrows and Next handle', async () => {
    await expect.poll(() => hasWhiteFill(nudge)).toBe(true);
    await expect(handleName(page)).toHaveText('Corner 1 of 4');
    await expect(nudgeRow).toBeVisible();
  });
});

test('PER-19.1 Flatten shows its line and slider, and its button shows the percentage [phone]',
  async ({ page, check }, testInfo) => {
    const hand = await startOnPerspective(page, testInfo);
    const flatten = page.locator('#toolFlatten');
    await check('the Flatten button shows 100% where the other buttons show an icon', async () => {
      await expect(flatten.locator('.tool-value')).toHaveText('100%');
      await expect(flatten.locator('.tool-glyph')).toBeHidden();
      await expect(page.locator('#toolNudge .tool-glyph')).toBeVisible();
    });
    await hand.tap(flatten);
    await check('Flatten is selected; the line reads FLATTEN and 100%, with the slider\'s knob at '
      + 'the right end under it', async () => {
      await expect.poll(() => hasWhiteFill(flatten)).toBe(true);
      await expect(page.locator('#perspectiveLine .line-label')).toHaveText('Flatten');
      await expect(handleName(page)).toHaveText('100%');
      await expect(page.locator('#perspectiveFlattenRow')).toBeVisible();
      await expect(page.locator('#strength')).toHaveValue('100');
    });
  });

// A card's short side over its long side: 5:7.
const CARD_ASPECT = 5 / 7;
// How far a measured angle may be from the expected one, in degrees, and an aspect from 5:7,
// as a fraction of it. Flatten 0% leans each side of IMG_9136's card about 1°.
const ANGLE_TOLERANCE_DEG = 0.1;
const ASPECT_TOLERANCE = 0.005;
const LEAN_MIN_DEG = 0.5;

// The corrected card's shape: the angles of its four sides (degrees: 0 is level, 90 is
// upright) and its width over its height.
function cardShape(page) {
  return page.evaluate(() => {
    const quad = window.__straightener.app.geometry.cardPerspective;
    const angleDeg = (start, end) => Math.atan2(end[1] - start[1], end[0] - start[0])
      * 180 / Math.PI;
    const length = (start, end) => Math.hypot(end[0] - start[0], end[1] - start[1]);
    const widths = length(quad[0], quad[1]) + length(quad[3], quad[2]);
    const heights = length(quad[0], quad[3]) + length(quad[1], quad[2]);
    return {
      topDeg: angleDeg(quad[0], quad[1]),
      bottomDeg: angleDeg(quad[3], quad[2]),
      leftDeg: angleDeg(quad[0], quad[3]),
      rightDeg: angleDeg(quad[1], quad[2]),
      aspect: widths / heights,
    };
  });
}

// Where the Flatten slider's track is tapped: its far left end or its middle (page px).
async function sliderPoint(page, place) {
  const box = await page.locator('#strength').boundingBox();
  const x = place === 'left' ? box.x + 2 : box.x + box.width / 2;
  return { x, y: box.y + box.height / 2 };
}

// The Flatten percentage the line above the controls shows.
const flattenValue = page => page.locator('#perspectiveLine .line-value');

// Chromium only: in Playwright's WebKit a tap on the slider's track sends "input" but no
// "change", so no undo step is made (PER-20.4 checks Safari on an iPhone).
test('PER-20.1 Flatten at 100% is a flat 5:7 card, at 0% a squared-up trapezoid, one undo '
  + 'step [phone]', async ({ page, check }, testInfo) => {
  const hand = await startOnPerspective(page, testInfo);
  await hand.tap(page.locator('#toolFlatten'));
  await check('the line reads FLATTEN 100%, with the slider\'s knob at its right end', async () => {
    await expect(flattenValue(page)).toHaveText('100%');
    await expect(page.locator('#strength')).toHaveValue('100');
  });
  await hand.tap(page.locator('#toolPreview'));
  await check('the corrected card is an upright 5:7 rectangle with square corners', async () => {
    const shape = await cardShape(page);
    expect(Math.abs(shape.topDeg)).toBeLessThan(ANGLE_TOLERANCE_DEG);
    expect(Math.abs(shape.bottomDeg)).toBeLessThan(ANGLE_TOLERANCE_DEG);
    expect(Math.abs(shape.leftDeg - 90)).toBeLessThan(ANGLE_TOLERANCE_DEG);
    expect(Math.abs(shape.rightDeg - 90)).toBeLessThan(ANGLE_TOLERANCE_DEG);
    expect(Math.abs(shape.aspect / CARD_ASPECT - 1)).toBeLessThan(ASPECT_TOLERANCE);
  });
  await hand.tap(page.locator('#toolPreview'));
  await check('the slider shows again, its knob at the right end', async () => {
    await expect(page.locator('#strength')).toBeVisible();
  });
  await tapAt(page, hand, await sliderPoint(page, 'left'));
  await check('the knob is at the left end; the line and the Flatten button read 0%', async () => {
    await expect(page.locator('#strength')).toHaveValue('0');
    await expect(flattenValue(page)).toHaveText('0%');
    await expect(page.locator('#toolFlatten .tool-value')).toHaveText('0%');
  });
  await hand.tap(page.locator('#toolPreview'));
  await check('the corrected card\'s top and bottom are level, its sides lean: a trapezoid',
    async () => {
      const shape = await cardShape(page);
      expect(Math.abs(shape.topDeg)).toBeLessThan(ANGLE_TOLERANCE_DEG);
      expect(Math.abs(shape.bottomDeg)).toBeLessThan(ANGLE_TOLERANCE_DEG);
      expect(Math.abs(shape.leftDeg - 90)).toBeGreaterThan(LEAN_MIN_DEG);
      expect(Math.abs(shape.rightDeg - 90)).toBeGreaterThan(LEAN_MIN_DEG);
    });
  await hand.tap(page.locator('#toolPreview'));
  await check('the slider shows again, its knob at the left end', async () => {
    await expect(page.locator('#strength')).toBeVisible();
    await expect(page.locator('#strength')).toHaveValue('0');
  });
  await hand.tap(page.locator('#btnUndo'));
  await check('Undo: the line reads FLATTEN 100% and Undo is greyed out', async () => {
    await expect(flattenValue(page)).toHaveText('100%');
    await expect(page.locator('#btnUndo')).toBeDisabled();
  });
});

test('PER-20.2 Two changes to Flatten less than 0.9 seconds apart are one undo step [phone]',
  async ({ page, check }, testInfo) => {
    const hand = await startOnPerspective(page, testInfo);
    await hand.tap(page.locator('#toolFlatten'));
    await check('the line reads FLATTEN 100%', async () => {
      await expect(flattenValue(page)).toHaveText('100%');
    });
    await tapAt(page, hand, await sliderPoint(page, 'middle'));
    await check('the line reads FLATTEN 50%', async () => {
      await expect(flattenValue(page)).toHaveText('50%');
    });
    await tapAt(page, hand, await sliderPoint(page, 'left'));
    await check('the line reads FLATTEN 0%', async () => {
      await expect(flattenValue(page)).toHaveText('0%');
    });
    await hand.tap(page.locator('#btnUndo'));
    await check('Undo: FLATTEN 100% and Undo greyed out; the two were one step', async () => {
      await expect(flattenValue(page)).toHaveText('100%');
      await expect(page.locator('#btnUndo')).toBeDisabled();
    });
  });

// A fingerprint of the Result picture's pixels, to tell when it changes.
function resultPicture(page) {
  return page.evaluate(() => {
    const canvas = document.getElementById('mini');
    const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
    let total = 0;
    for (let i = 0; i < pixels.length; i += 7) total = (total * 31 + pixels[i]) % 1000000007;
    return total;
  });
}

test('PER-20.3 The corrected card updates while the slider moves [desktop]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnPerspective(page, testInfo);
  await hand.tap(page.locator('#toolFlatten'));
  await check('the slider shows, its knob at the right end', async () => {
    await expect(page.locator('#strength')).toHaveValue('100');
  });
  const pictureBefore = await resultPicture(page);
  const box = await page.locator('#strength').boundingBox();
  const knob = { x: box.x + box.width - SLIDER_KNOB_HALF_PX, y: box.y + box.height / 2 };
  await page.mouse.move(knob.x, knob.y);
  await page.mouse.down();
  await page.mouse.move(box.x + 1, knob.y, { steps: 8 });
  await check('before letting go, the line reads FLATTEN 0% and the Result picture has changed',
    async () => {
      await expect(flattenValue(page)).toHaveText('0%');
      await expect.poll(() => resultPicture(page)).not.toBe(pictureBefore);
    });
  await page.mouse.up();
  await check('after letting go, the line still reads FLATTEN 0%', async () => {
    await expect(flattenValue(page)).toHaveText('0%');
  });
  await hand.tap(page.locator('#btnUndo'));
  await check('Undo: the line reads FLATTEN 100%; the whole slide was one step', async () => {
    await expect(flattenValue(page)).toHaveText('100%');
    await expect(page.locator('#btnUndo')).toBeDisabled();
  });
});

test('PER-21.1 Candidate steps through the three candidates and wraps, one undo step a tap '
  + '[phone]', async ({ page, check }, testInfo) => {
  const hand = await startOnPerspective(page, testInfo);
  const candidates = await candidateCorners(page);
  await check('Candidate shows 1/3 in place of an icon', async () => {
    await expect(candidateNumber(page)).toHaveText('1/3');
    await expect(page.locator('#toolCandidate .tool-glyph')).toBeHidden();
  });
  const steps = [
    ['2/3', 1, 'it reads 2/3, and the corners move to the second candidate'],
    ['3/3', 2, 'it reads 3/3, and the corners move to the third'],
    ['1/3', 0, 'it reads 1/3, and the corners are back on the first'],
  ];
  for (const [number, index, expected] of steps) {
    await hand.tap(page.locator('#toolCandidate'));
    await check(expected, async () => {
      await expect(candidateNumber(page)).toHaveText(number);
      expectSameCorners(await cornersNow(page), candidates[index]);
    });
  }
  await hand.tap(page.locator('#btnUndo'));
  await check('Undo puts the corners back on the third candidate', async () => {
    expectSameCorners(await cornersNow(page), candidates[2]);
  });
});

test('PER-21.2 With fewer than two candidates, Candidate is off [phone]', async ({
  page,
  check,
}, testInfo) => {
  await startOnFixture(page, testInfo, BLANK_FIXTURE);
  await check('Candidate is greyed out and shows its icon, with no number', async () => {
    const candidate = page.locator('#toolCandidate');
    await expect(candidate).toBeDisabled();
    await expect(candidate.locator('.tool-glyph')).toBeVisible();
    await expect(candidateNumber(page)).toBeHidden();
  });
});

test('PER-21.3 Moving a corner by hand clears the candidate number; Undo brings it back, and '
  + 'Candidate then starts from the first [phone]', async ({ page, check }, testInfo) => {
  const hand = await startOnPerspective(page, testInfo);
  const candidates = await candidateCorners(page);
  await check('Candidate shows 1/3', async () => {
    await expect(candidateNumber(page)).toHaveText('1/3');
  });
  const topRight = await handleOnPage(page, TOP_RIGHT);
  await hand.drag(topRight, offsetBy(topRight, 30, 0));
  await check('Candidate shows no number', async () => {
    expectMovedBy(await handleOnPage(page, TOP_RIGHT), topRight, 30, 0);
    await expect(page.locator('#toolCandidate')).toBeVisible();
    await expect(candidateNumber(page)).toBeHidden();
  });
  await hand.tap(page.locator('#btnUndo'));
  await check('the corner is back, and Candidate shows 1/3 again', async () => {
    expectMovedBy(await handleOnPage(page, TOP_RIGHT), topRight, 0, 0);
    await expect(candidateNumber(page)).toHaveText('1/3');
  });
  await hand.tap(page.locator('#toolCandidate'));
  await check('Candidate reads 2/3, and the corners move to the second candidate', async () => {
    await expect(candidateNumber(page)).toHaveText('2/3');
    expectSameCorners(await cornersNow(page), candidates[1]);
  });
  const secondTopRight = await handleOnPage(page, TOP_RIGHT);
  await hand.drag(secondTopRight, offsetBy(secondTopRight, 30, 0));
  await check('Candidate shows no number again', async () => {
    expectMovedBy(await handleOnPage(page, TOP_RIGHT), secondTopRight, 30, 0);
    await expect(candidateNumber(page)).toBeHidden();
  });
  await hand.tap(page.locator('#toolCandidate'));
  await check('Candidate reads 1/3, not 3/3: the corners are on the first candidate, the best '
    + 'pick', async () => {
    await expect(candidateNumber(page)).toHaveText('1/3');
    expectSameCorners(await cornersNow(page), candidates[0]);
  });
});

test('PER-21.4 Undo and Reset perspective bring back the number of the candidate they '
  + 'restore [phone]', async ({ page, check }, testInfo) => {
  const hand = await startOnPerspective(page, testInfo);
  const candidates = await candidateCorners(page);
  await hand.tap(page.locator('#toolCandidate'));
  await check('Candidate reads 2/3', async () => {
    await expect(candidateNumber(page)).toHaveText('2/3');
  });
  await hand.tap(page.locator('#btnUndo'));
  await check('the corners are back on the first candidate, and Candidate reads 1/3', async () => {
    expectSameCorners(await cornersNow(page), candidates[0]);
    await expect(candidateNumber(page)).toHaveText('1/3');
  });
  await hand.tap(page.locator('#toolCandidate'));
  await check('Candidate reads 2/3', async () => {
    await expect(candidateNumber(page)).toHaveText('2/3');
  });
  await openOptions(page, hand, 'perspective');
  await check('Reset perspective shows', async () => {
    await expect(page.locator('#btnResetPerspective')).toBeVisible();
  });
  await hand.tap(page.locator('#btnResetPerspective'));
  await check('the corners are back on the first candidate, and Candidate reads 1/3', async () => {
    expectSameCorners(await cornersNow(page), candidates[0]);
    await expect(candidateNumber(page)).toHaveText('1/3');
  });
});

test('PER-22.1 Snap starts off and switches on and off, with no undo step [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnPerspective(page, testInfo);
  const snap = page.locator('#toolSnap');
  await check('Snap\'s corner reads Off', async () => {
    await expect(snap.locator('.tool-state')).toHaveText('Off');
    await expect(snap).toHaveAttribute('aria-pressed', 'false');
  });
  await hand.tap(snap);
  await check('Snap reads On; Undo is still greyed out', async () => {
    await expect(snap.locator('.tool-state')).toHaveText('On');
    await expect(snap).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#btnUndo')).toBeDisabled();
  });
  await hand.tap(snap);
  await check('Snap reads Off again', async () => {
    await expect(snap.locator('.tool-state')).toHaveText('Off');
  });
});

// Two detected lines cross "roughly square" when the cosine of the angle between them is at
// most this: 60° to 120° apart.
const SQUARE_COSINE_MAX = 0.5;

// Where Snap should put the top-left corner after a drag of (dx, dy) CSS px: the nearest point
// where two roughly square detected lines cross, worked out here from the lines themselves,
// within CONFIG.snapRadiusPx screen px of where the drag alone would leave it, or null when
// there is none. Returns { unsnapped, snapped } in photo px.
function expectedCornerSnap(page, dx, dy) {
  return page.evaluate(({ moveX, moveY, cosineMax }) => {
    const app = window.__straightener.app;
    const zoom = window.CF.currentView().zoom;
    const corner = app.state.corners[0];
    const unsnapped = [corner[0] + moveX / zoom, corner[1] + moveY / zoom];
    const lines = app.detection.snapLines;
    let snapped = null;
    let bestDistance = CONFIG.snapRadiusPx / zoom;
    for (let i = 0; i < lines.length; i++) {
      for (let j = i + 1; j < lines.length; j++) {
        const first = lines[i];
        const second = lines[j];
        const cosine = first.normalX * second.normalX + first.normalY * second.normalY;
        if (Math.abs(cosine) > cosineMax) continue;
        // Each line is the points p with normal · p = offset; solve the two for p.
        const determinant = first.normalX * second.normalY - first.normalY * second.normalX;
        const crossing = [
          (first.offset * second.normalY - second.offset * first.normalY) / determinant,
          (first.normalX * second.offset - second.normalX * first.offset) / determinant,
        ];
        const distance = Math.hypot(crossing[0] - unsnapped[0], crossing[1] - unsnapped[1]);
        if (distance < bestDistance) {
          bestDistance = distance;
          snapped = crossing;
        }
      }
    }
    return { unsnapped, snapped };
  }, { moveX: dx, moveY: dy, cosineMax: SQUARE_COSINE_MAX });
}

// Taps the Debug overlay switch in the open options and waits for the search it starts.
async function tapDebugSwitch(page, hand) {
  await hand.tap(page.locator('#debugOverlay'));
  await page.waitForFunction(() => {
    const detection = window.__straightener.app.detection;
    return detection.message === '' && !!detection.last && !!detection.last.debug;
  });
}

// True when the lines detection found are drawn: the Debug overlay is on and has lines.
function areDetectedLinesDrawn(page) {
  return page.evaluate(() => {
    const app = window.__straightener.app;
    const hasDebug = !!app.detection.last && !!app.detection.last.debug;
    return app.debugOverlay && hasDebug && app.detection.snapLines.length > 0;
  });
}

// The first rows of PER-23.1 and PER-24.1: the options opened, the Debug overlay switched on,
// the options closed, so the detected lines show; then Snap switched on.
async function showLinesAndSnap(page, hand, check) {
  await openOptions(page, hand, 'perspective');
  await check('Debug overlay shows under Developer', async () => {
    await expect(page.locator('#debugOverlay')).toBeVisible();
  });
  await tapDebugSwitch(page, hand);
  await check('it is on', async () => {
    await expect(page.locator('#debugOverlay')).toBeChecked();
  });
  await closeOptions(page, hand, 'perspective');
  await check('thin yellow lines run across the photo: the lines detection found', async () => {
    expect(await areDetectedLinesDrawn(page)).toBe(true);
    if (await isPhoneLayout(page)) await expect(page.locator('#perspectiveSheet')).toBeHidden();
  });
  await hand.tap(page.locator('#toolSnap'));
  await check('Snap reads On', async () => {
    await expect(page.locator('#toolSnap .tool-state')).toHaveText('On');
  });
}

test('PER-23.1 With Snap on, a dragged corner lands where two detected lines cross [phone] '
  + '[webkit]', async ({ page, check }, testInfo) => {
  const hand = await startOnPerspective(page, testInfo);
  await showLinesAndSnap(page, hand, check);
  const [start] = await cornersNow(page);
  const expected = await expectedCornerSnap(page, SNAP_DRAG.x, SNAP_DRAG.y);
  const topLeft = await handleOnPage(page, TOP_LEFT);
  await hand.drag(topLeft, offsetBy(topLeft, SNAP_DRAG.x, SNAP_DRAG.y));
  await check('the corner does not stop 10 px right and 6 px down: it jumps onto the nearest '
    + 'point where two yellow lines cross', async () => {
    expect(expected.snapped).not.toBeNull();
    const [corner] = await cornersNow(page);
    expectSameCorners([corner], [expected.snapped]);
    expect(Math.hypot(corner[0] - expected.unsnapped[0], corner[1] - expected.unsnapped[1]))
      .toBeGreaterThan(PHOTO_TOLERANCE_PX);
  });
  await hand.tap(page.locator('#btnUndo'));
  await check('the corner is back where it was', async () => {
    expectSameCorners([(await cornersNow(page))[0]], [start]);
  });
  await hand.tap(page.locator('#toolSnap'));
  await check('Snap reads Off', async () => {
    await expect(page.locator('#toolSnap .tool-state')).toHaveText('Off');
  });
  await hand.drag(topLeft, offsetBy(topLeft, SNAP_DRAG.x, SNAP_DRAG.y));
  await check('the corner stops exactly 10 px right and 6 px down of where it was', async () => {
    expectMovedBy(await handleOnPage(page, TOP_LEFT), topLeft, SNAP_DRAG.x, SNAP_DRAG.y);
  });
});

// The top edge's middle and how far it is from the nearest detected line that runs within 3°
// of the edge (photo px), or Infinity when no line runs that way.
function topEdgeGapToLine(page) {
  return page.evaluate(parallelDeg => {
    const app = window.__straightener.app;
    const [start, end] = app.state.corners;
    const length = Math.hypot(end[0] - start[0], end[1] - start[1]);
    const normal = [-(end[1] - start[1]) / length, (end[0] - start[0]) / length];
    const middle = [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2];
    const minAlignment = Math.cos(parallelDeg * Math.PI / 180);
    let gap = Infinity;
    for (const line of app.detection.snapLines) {
      const alignment = Math.abs(line.normalX * normal[0] + line.normalY * normal[1]);
      if (alignment < minAlignment) continue;
      const lineGap = Math.abs(line.normalX * middle[0] + line.normalY * middle[1] - line.offset);
      gap = Math.min(gap, lineGap);
    }
    return gap;
  }, SNAP_PARALLEL_DEG);
}

test('PER-24.1 With Snap on, a dragged edge lands on a detected line [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnPerspective(page, testInfo);
  await showLinesAndSnap(page, hand, check);
  const before = await cornersNow(page);
  const square = await handleOnPage(page, TOP_EDGE);
  await hand.drag(square, offsetBy(square, 0, 10));
  await check('the top edge lies exactly along a yellow line that runs the same way as the edge',
    async () => {
      expect(await topEdgeGapToLine(page)).toBeLessThan(PHOTO_TOLERANCE_PX);
    });
  await hand.tap(page.locator('#btnUndo'));
  await check('the edge is back where it was', async () => {
    expectSameCorners(await cornersNow(page), before);
  });
  await hand.tap(page.locator('#toolSnap'));
  await check('Snap reads Off', async () => {
    await expect(page.locator('#toolSnap .tool-state')).toHaveText('Off');
  });
  const [topLeft, topRight] = await cornersOnPage(page);
  const edgeLength = Math.hypot(topRight.x - topLeft.x, topRight.y - topLeft.y);
  // The edge's normal on the page (down for a left-to-right edge), and the drag's part along it.
  const normalX = -(topRight.y - topLeft.y) / edgeLength;
  const normalY = (topRight.x - topLeft.x) / edgeLength;
  const alongNormalPx = 10 * normalY;
  const squareBefore = await handleOnPage(page, TOP_EDGE);
  await hand.drag(squareBefore, offsetBy(squareBefore, 0, 10));
  await check('the top edge stops exactly 10 px lower than it was', async () => {
    const squareAfter = await handleOnPage(page, TOP_EDGE);
    expectMovedBy(squareAfter, squareBefore, normalX * alongNormalPx, normalY * alongNormalPx);
  });
});

// True when a press at this page point would grab a handle drawn on the photo.
function isHandleAt(page, point) {
  return page.evaluate(({ x, y }) => window.CF.hitsPhotoControl(x, y), point);
}

// Preview's switch: its corner reads On or Off.
const previewState = page => page.locator('#toolPreview .tool-state');

test('PER-25.1 Preview shows the corrected card and its two lines [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnPerspective(page, testInfo);
  const topLeft = await handleOnPage(page, TOP_LEFT);
  await hand.tap(page.locator('#toolPreview'));
  await check('Preview reads On; the corrected card shows, with no outline and no handles',
    async () => {
      await expect(previewState(page)).toHaveText('On');
      expect(await page.evaluate(() => window.__straightener.app.previewMode)).toBe(true);
      expect(await isHandleAt(page, topLeft)).toBe(false);
    });
  await check('the lines read PREVIEW, "The corrected card. Handles are hidden." and "Pinch to '
    + 'zoom, drag to pan. Tap Preview again for the corners."', async () => {
    const previewLine = page.locator('#perspectivePreviewLine');
    await expect(previewLine.locator('.line-label')).toHaveText('Preview');
    await expect(previewLine).toContainText('The corrected card. Handles are hidden.');
    await expect(page.locator('#perspectivePreviewRow'))
      .toHaveText('Pinch to zoom, drag to pan. Tap Preview again for the corners.');
  });
  await hand.tap(page.locator('#toolPreview'));
  await check('Preview reads Off; the photo, outline and handles are back, with NUDGE and '
    + 'Corner 1 of 4', async () => {
    await expect(previewState(page)).toHaveText('Off');
    expect(await isHandleAt(page, topLeft)).toBe(true);
    await expect(page.locator('#perspectiveLine .line-label')).toHaveText('Nudge');
    await expect(handleName(page)).toHaveText('Corner 1 of 4');
  });
});

test('PER-25.2 Preview with crossed corners, for a person to judge [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnPerspective(page, testInfo);
  await crossTheCorners(page, hand);
  await check.eye('the outline crosses itself, red and dashed');
  await hand.tap(page.locator('#toolPreview'));
  // Ruling R82's words; the judge fails this until it is built (BUG-292).
  await check.eye('the photo area is empty except for grey text in its middle: "Fix the corners '
    + 'first."');
  await check(`the line reads "${CROSSED}"`, async () => {
    await expectStatus(page, CROSSED);
  });
});

test('PER-26.1 While Preview is on, the modes are off and a drag moves the corrected card '
  + '[phone] [webkit]', async ({ page, check }, testInfo) => {
  const hand = await startOnPerspective(page, testInfo);
  const corners = await cornersNow(page);
  const topLeft = await handleOnPage(page, TOP_LEFT);
  await hand.tap(page.locator('#toolPreview'));
  await check('Nudge and Flatten are greyed out and not white; no arrows, Next handle or slider',
    async () => {
      for (const tool of ['#toolNudge', '#toolFlatten']) {
        await expect(page.locator(tool)).toBeDisabled();
        await expect.poll(() => hasWhiteFill(page.locator(tool))).toBe(false);
      }
      await expect(page.locator('#perspectiveNudgeRow')).toBeHidden();
      await expect(page.locator('#perspectiveFlattenRow')).toBeHidden();
    });
  const viewBefore = await viewNow(page);
  await hand.drag(topLeft, offsetBy(topLeft, 0, 30));
  await check('the corrected card moves 30 px down with the drag', async () => {
    const viewAfter = await viewNow(page);
    expect(Math.abs(viewAfter.panY - viewBefore.panY - 30)).toBeLessThan(SCREEN_TOLERANCE_PX);
    expect(viewAfter.zoom).toBe(viewBefore.zoom);
  });
  await hand.tap(page.locator('#toolPreview'));
  await check('the corners are where they were, and Undo is still greyed out', async () => {
    expectSameCorners(await cornersNow(page), corners);
    await expect(page.locator('#btnUndo')).toBeDisabled();
  });
});

test('PER-26.2 While Preview is on, a pinch zooms the corrected card [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnPerspective(page, testInfo);
  const corners = await cornersNow(page);
  await hand.tap(page.locator('#toolPreview'));
  await check('the corrected card fills the photo area', async () => {
    await expect(previewState(page)).toHaveText('On');
  });
  const viewBefore = await viewNow(page);
  const box = await page.locator('#view').boundingBox();
  await pinchAt(page, { x: box.x + box.width / 2, y: box.y + box.height / 2 }, 100, 200);
  await check('the card zooms in to twice its size', async () => {
    const viewAfter = await viewNow(page);
    expect(Math.abs(viewAfter.zoom / viewBefore.zoom - 2)).toBeLessThan(ZOOM_TOLERANCE);
  });
  await hand.tap(page.locator('#toolPreview'));
  await check('the corners have not moved, and Undo is greyed out', async () => {
    expectSameCorners(await cornersNow(page), corners);
    await expect(page.locator('#btnUndo')).toBeDisabled();
  });
});

test('PER-26.3 While Preview is on, the arrow keys and Tab do nothing [desktop]', async ({
  page,
  check,
}, testInfo) => {
  test.fail(true, 'BUG-062');
  const hand = await startOnPerspective(page, testInfo);
  const corners = await cornersNow(page);
  await hand.tap(page.locator('#toolPreview'));
  await check('the corrected card shows, with no handles', async () => {
    await expect(previewState(page)).toHaveText('On');
  });
  const box = await page.locator('#view').boundingBox();
  await tapAt(page, hand, { x: box.x + box.width / 2, y: box.y + box.height / 2 });
  await check('a click on the card changes nothing', async () => {
    expectSameCorners(await cornersNow(page), corners);
  });
  for (let press = 0; press < 3; press++) await page.keyboard.press('ArrowRight');
  await check('three presses of the right arrow key change nothing; Undo is still greyed out',
    async () => {
      expectSameCorners(await cornersNow(page), corners);
      expect(await page.locator('#btnUndo').isDisabled()).toBe(true);
    });
  await page.keyboard.press('Tab');
  await check('Tab changes nothing', async () => {
    expect(await page.evaluate(() => window.__straightener.app.selected)).toBe(TOP_LEFT);
  });
  await hand.tap(page.locator('#toolPreview'));
  await check('the corners are where they were, Corner 1 of 4, Undo greyed out', async () => {
    expectSameCorners(await cornersNow(page), corners);
    await expect(handleName(page)).toHaveText('Corner 1 of 4');
    await expect(page.locator('#btnUndo')).toBeDisabled();
  });
});

test('PER-27.1 Preview turns off at a change of step [phone]', async ({
  page,
  check,
}, testInfo) => {
  test.fail(true, 'BUG-294');
  const hand = await startOnPerspective(page, testInfo);
  await hand.tap(page.locator('#toolPreview'));
  await check('Preview reads On', async () => {
    await expect(previewState(page)).toHaveText('On');
  });
  await goToStep(page, 'rotate', hand);
  await check('the Rotate step shows', async () => {
    await expect(page.locator('#rotateArea')).toBeVisible();
  });
  await goToStep(page, 'perspective', hand);
  // A plain reading, so the known defect fails at once.
  const isPreviewOn = await page.evaluate(() => window.__straightener.app.previewMode);
  await check('Preview reads Off, the line reads NUDGE, and the photo shows with its outline and '
    + 'handles', async () => {
    expect(isPreviewOn).toBe(false);
    await expect(previewState(page)).toHaveText('Off');
    await expect(page.locator('#perspectiveLine .line-label')).toHaveText('Nudge');
    expect(await isHandleAt(page, await handleOnPage(page, TOP_LEFT))).toBe(true);
  });
});

test('PER-27.2 Preview turns off when another photo opens [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnPerspective(page, testInfo);
  await hand.tap(page.locator('#toolPreview'));
  await check('Preview reads On', async () => {
    await expect(previewState(page)).toHaveText('On');
  });
  await openPhoto(page, SECOND_PHOTO);
  await check('the new photo opens with its outline and handles; Preview reads Off; the line '
    + 'reads NUDGE', async () => {
    await expect(previewState(page)).toHaveText('Off');
    await expect(page.locator('#perspectiveLine .line-label')).toHaveText('Nudge');
    expect(await isHandleAt(page, await handleOnPage(page, TOP_LEFT))).toBe(true);
  });
});

test('PER-27.3 Preview turns off when a pair switches sides [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await makePair(page, testInfo, PORTRAIT_PAIR);
  await check('the back opens on Perspective, with Front and Back in the top bar', async () => {
    await expect(page.locator('#sideSwitch')).toBeVisible();
    await expect(page.locator('#perspectiveArea')).toBeVisible();
  });
  await hand.tap(page.locator('#toolPreview'));
  await check('Preview reads On', async () => {
    await expect(previewState(page)).toHaveText('On');
  });
  await switchTo(page, hand, 'front');
  await check('the front opens on Perspective with its handles; Preview reads Off', async () => {
    await expect(previewState(page)).toHaveText('Off');
    expect(await isHandleAt(page, await handleOnPage(page, TOP_LEFT))).toBe(true);
  });
});

// The most any colour channel of two middleColor readings differs (0 to 255).
const colorChange = (first, second) => Math.max(...first.map((value, i) => Math.abs(value
  - second[i])));
// Levels' Auto on IMG_9136 brightens the middle of the picture by more than this; a redraw of
// the same picture changes it by less.
const LEVELS_CHANGE_MIN = 2;

test('PER-27.4 Preview shows the applied levels, not an unapplied draft [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnPerspective(page, testInfo);
  const colorsBefore = await previewColorsThenOff(page, hand, check);
  const apply = page.locator('#btnApplyLevels');
  const levelsMark = page.locator('[data-step="levels"]:visible .step-tab-mark');
  await goToLevelsForAuto(page, hand, check);
  await waitForStill(page);
  const levelsBefore = await middleColor(page);
  await hand.tap(page.locator('#toolAutoLevels'));
  await check('the photo brightens: an unapplied draft, with Apply lit in the line above the '
    + 'controls and a white dot on the Levels tab', async () => {
    await expect.poll(async () => colorChange(await middleColor(page), levelsBefore))
      .toBeGreaterThan(LEVELS_CHANGE_MIN);
    await expect(apply).toBeEnabled();
    await expect(levelsMark).toBeVisible();
  });
  await backToPerspectiveThenPreview(page, hand, check);
  await check('the corrected card shows with the colors noted in row 1, not the draft\'s',
    async () => {
      expect(colorChange(await middleColor(page), colorsBefore)).toBeLessThan(LEVELS_CHANGE_MIN);
    });
});

test('PER-27.5 Preview shows levels once they are applied [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnPerspective(page, testInfo);
  const colorsBefore = await previewColorsThenOff(page, hand, check);
  const apply = page.locator('#btnApplyLevels');
  const levelsMark = page.locator('[data-step="levels"]:visible .step-tab-mark');
  await goToLevelsForAuto(page, hand, check);
  await hand.tap(page.locator('#toolAutoLevels'));
  await check('Apply is lit in the line above the controls', async () => {
    await expect(apply).toBeEnabled();
  });
  await hand.tap(apply);
  await check('the white dot on the Levels tab has gone, and Apply is greyed out', async () => {
    await expect(levelsMark).toBeHidden();
    await expect(apply).toBeDisabled();
  });
  await backToPerspectiveThenPreview(page, hand, check);
  await check('the corrected card shows the applied, brighter colors', async () => {
    await expect.poll(async () => colorChange(await middleColor(page), colorsBefore))
      .toBeGreaterThan(LEVELS_CHANGE_MIN);
  });
});

// PER-27.4 and PER-27.5's rows 1 and 2: Preview on, its colors noted, then off again so the
// step change that follows doesn't depend on ruling R88. Returns the colors.
async function previewColorsThenOff(page, hand, check) {
  await hand.tap(page.locator('#toolPreview'));
  await waitForStill(page);
  const colors = await middleColor(page);
  await check('the corrected card shows; note its colors', async () => {
    await expect(previewState(page)).toHaveText('On');
  });
  await hand.tap(page.locator('#toolPreview'));
  await check('it reads Off; the outline and handles show', async () => {
    await expect(previewState(page)).toHaveText('Off');
    expect(await isHandleAt(page, await handleOnPage(page, TOP_LEFT))).toBe(true);
  });
  return colors;
}

// PER-27.4 and PER-27.5's step to Levels.
async function goToLevelsForAuto(page, hand, check) {
  await goToStep(page, 'levels', hand);
  await check('the Levels step shows, with Auto among its buttons', async () => {
    await expect(page.locator('#levelsArea')).toBeVisible();
    await expect(page.locator('#toolAutoLevels')).toBeVisible();
  });
}

// PER-27.4 and PER-27.5's way back: Perspective, where Preview reads Off, then Preview on.
async function backToPerspectiveThenPreview(page, hand, check) {
  await goToStep(page, 'perspective', hand);
  await check('the Perspective step shows, Preview reading Off', async () => {
    await expect(previewState(page)).toHaveText('Off');
  });
  await hand.tap(page.locator('#toolPreview'));
  await waitForStill(page);
}

const FIND_PROMPT = 'Tap the card in the photo.';

// True while the app lays out for a phone (the options open as a sheet over the photo).
function isPhoneLayout(page) {
  return page.evaluate(() => window.CF.phoneLayout.matches);
}

// Taps Tap to find card in the open options, which arms it. On a phone the options close as it
// arms; a person waits until they have slid away before tapping the photo, and so does this:
// while the sheet is still leaving, a tap on the photo lands on the sheet's layer instead.
async function tapFindCard(page, hand) {
  await hand.tap(page.locator('#btnFindCard'));
  if (await isPhoneLayout(page)) {
    await page.locator('#perspectiveSheet').waitFor({ state: 'hidden' });
  }
}

// Opens Perspective's options and arms Tap to find card (tapFindCard).
async function armFindCard(page, hand) {
  await openOptions(page, hand, 'perspective');
  await tapFindCard(page, hand);
}

// The middle of the card's outline on the page, in CSS px.
async function cardMiddle(page) {
  const corners = await cornersOnPage(page);
  return {
    x: corners.reduce((sum, corner) => sum + corner.x, 0) / corners.length,
    y: corners.reduce((sum, corner) => sum + corner.y, 0) / corners.length,
  };
}

// Waits until a search started by a find tap has finished and the app is disarmed.
function waitForFind(page) {
  return page.waitForFunction(() => {
    const app = window.__straightener.app;
    return !app.findMode && app.detection.message === '';
  });
}

// Expects the line above the controls to be back at rest: NUDGE and a handle's name.
async function expectNudgeLine(page) {
  await expect(statusLine(page)).toBeHidden();
  await expect(page.locator('#perspectiveLine .line-label')).toHaveText('Nudge');
}

test('PER-28.1 Tap to find card arms and disarms [both]', async ({ page, check }, testInfo) => {
  const hand = await startOnPerspective(page, testInfo);
  const isPhone = await isPhoneLayout(page);
  const findCard = page.locator('#btnFindCard');
  await openOptions(page, hand, 'perspective');
  await check('the first row reads Tap to find card, with "then tap the card"', async () => {
    await expect(findCard).toContainText('Tap to find card');
    await expect(findCard).toContainText('then tap the card');
  });
  await hand.tap(findCard);
  await check('the line reads "Tap the card in the photo." with Cancel; on a phone the options '
    + 'have closed, on a wide screen the row shows as pressed', async () => {
    await expectStatus(page, FIND_PROMPT);
    await expect(page.locator('#perspectiveStatusAction')).toHaveText('Cancel');
    if (isPhone) await expect(page.locator('#perspectiveSheet')).toBeHidden();
    else await expect(findCard).toHaveAttribute('aria-pressed', 'true');
  });
  await openOptions(page, hand, 'perspective');
  await check('Tap to find card is shown as pressed', async () => {
    await expect(findCard).toBeVisible();
    await expect(findCard).toHaveAttribute('aria-pressed', 'true');
  });
  await hand.tap(findCard);
  await check('it is no longer pressed, and the line reads NUDGE and Corner 1 of 4', async () => {
    await expect(findCard).toHaveAttribute('aria-pressed', 'false');
    await expectNudgeLine(page);
    await expect(handleName(page)).toHaveText('Corner 1 of 4');
  });
});

test('PER-28.2 Escape closes the options but leaves Tap to find card armed [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnPerspective(page, testInfo);
  await openOptions(page, hand, 'perspective');
  await check('Perspective options rise from the bottom', async () => {
    await expect(page.locator('#btnFindCard')).toBeVisible();
  });
  await hand.tap(page.locator('#btnFindCard'));
  await check(`the options close, and the line reads "${FIND_PROMPT}"`, async () => {
    await expect(page.locator('#perspectiveSheet')).toBeHidden();
    await expectStatus(page, FIND_PROMPT);
  });
  await openOptions(page, hand, 'perspective');
  await check('the options rise; Tap to find card is shown as pressed', async () => {
    await expect(page.locator('#btnFindCard')).toHaveAttribute('aria-pressed', 'true');
  });
  await page.keyboard.press('Escape');
  await check(`the options close; the line still reads "${FIND_PROMPT}"`, async () => {
    await expect(page.locator('#perspectiveSheet')).toBeHidden();
    await expectStatus(page, FIND_PROMPT);
  });
});

// The body of PER-29.1 and PER-29.2: the top-left corner is dragged off the card, Tap to find
// card is armed, and the card is pressed for holdMs (0: a quick tap). Returns the hand and the
// corners as dragged.
async function findAfterDrag(page, check, testInfo, holdMs) {
  const hand = await startOnPerspective(page, testInfo);
  const topLeft = await handleOnPage(page, TOP_LEFT);
  await hand.drag(topLeft, offsetBy(topLeft, 40, 40));
  await check('that corner is now off the card\'s corner', async () => {
    expect(await errorAgainstTruth(page, 'IMG_9136')).toBeGreaterThan(WITHIN_PCT);
  });
  const dragged = await cornersNow(page);
  await openOptions(page, hand, 'perspective');
  await check('Tap to find card shows', async () => {
    await expect(page.locator('#btnFindCard')).toBeVisible();
  });
  await tapFindCard(page, hand);
  await check(`the line reads "${FIND_PROMPT}"`, async () => {
    await expectStatus(page, FIND_PROMPT);
  });
  const middle = await cardMiddle(page);
  await (holdMs ? pressAt(page, hand, middle, holdMs) : tapAt(page, hand, middle));
  await waitForFind(page);
  await check('all four corners land on the card\'s own corners, and the line reads NUDGE again',
    async () => {
      expect(await errorAgainstTruth(page, 'IMG_9136')).toBeLessThan(WITHIN_PCT);
      await expectNudgeLine(page);
    });
  return { hand, dragged };
}

test('PER-29.1 A tap on the card finds it, as one undo step, and disarms [phone] [webkit]',
  async ({ page, check }, testInfo) => {
    const { hand, dragged } = await findAfterDrag(page, check, testInfo, 0);
    await hand.tap(page.locator('#btnUndo'));
    await check('Undo puts the top-left corner back where it was dragged', async () => {
      expectSameCorners(await cornersNow(page), dragged);
    });
  });

// How long PER-29.2's press is held still, in ms: longer than a tap (300 ms).
const LONG_PRESS_MS = 1000;

test('PER-29.2 A long, still press on the card finds it too [phone]', async ({
  page,
  check,
}, testInfo) => {
  await findAfterDrag(page, check, testInfo, LONG_PRESS_MS);
});

test('PER-29.3 A find tap on a picture with no card leaves the corners [phone]',
  async ({ page, check }, testInfo) => {
    const hand = await startOnFixture(page, testInfo, BLANK_FIXTURE);
    const corners = await cornersNow(page);
    await openOptions(page, hand, 'perspective');
    await check('Tap to find card shows', async () => {
      await expect(page.locator('#btnFindCard')).toBeVisible();
    });
    await tapFindCard(page, hand);
    await check(`the line reads "${FIND_PROMPT}"`, async () => {
      await expectStatus(page, FIND_PROMPT);
    });
    await tapAt(page, hand, await cardMiddle(page));
    await waitForFind(page);
    await check(`the line above the controls reads "${NOTHING_DETECTED}"`, async () => {
      await expectStatus(page, NOTHING_DETECTED);
    });
    await check('the corners have not moved, and Undo is still greyed out', async () => {
      expectSameCorners(await cornersNow(page), corners);
      await expect(page.locator('#btnUndo')).toBeDisabled();
    });
  });

// Where a point of the photo (source px) is on the page, in CSS px.
function photoPointOnPage(page, point) {
  return page.evaluate(photoPoint => {
    const [x, y] = window.CF.toScreen(window.CF.currentView(), photoPoint);
    const box = document.getElementById('view').getBoundingClientRect();
    return { x: box.left + x, y: box.top + y };
  }, point);
}

test('PER-29.4 The tapped point steers that one search and is not kept [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnPerspective(page, testInfo);
  await recordSearchPoints(page);
  await openOptions(page, hand, 'perspective');
  await check('Tap to find card shows', async () => {
    await expect(page.locator('#btnFindCard')).toBeVisible();
  });
  await tapFindCard(page, hand);
  await check(`the line reads "${FIND_PROMPT}"`, async () => {
    await expectStatus(page, FIND_PROMPT);
  });
  const middle = await cardMiddle(page);
  await tapAt(page, hand, middle);
  await waitForFind(page);
  await check('the corners land on the card, and the line reads NUDGE again; the search was '
    + 'handed the tapped point', async () => {
    expect(await errorAgainstTruth(page, 'IMG_9136')).toBeLessThan(WITHIN_PCT);
    await expectNudgeLine(page);
    const points = await readSearchPoints(page);
    expect(points).toHaveLength(1);
    expect(points[0]).not.toBeNull();
    expectMovedBy(await photoPointOnPage(page, points[0]), middle, 0, 0);
  });
  await openOptions(page, hand, 'perspective');
  await check('Debug overlay shows under DEVELOPER, off', async () => {
    await expect(debugSwitch(page)).toBeVisible();
    await expect(debugSwitch(page)).not.toBeChecked();
  });
  await tapDebugSwitch(page, hand);
  await check('it is on, and a new search runs; it is handed no point: the point tapped in row 3 '
    + 'was not kept', async () => {
    await expect(debugSwitch(page)).toBeChecked();
    expect(await readSearchPoints(page)).toEqual([expect.anything(), null]);
  });
});

test('PER-30.1 While armed, a drag from a corner moves the photo, not the corner [phone] '
  + '[webkit]', async ({ page, check }, testInfo) => {
  const hand = await startOnPerspective(page, testInfo);
  await openOptions(page, hand, 'perspective');
  await check('Tap to find card shows', async () => {
    await expect(page.locator('#btnFindCard')).toBeVisible();
  });
  await tapFindCard(page, hand);
  await check(`the line reads "${FIND_PROMPT}"`, async () => {
    await expectStatus(page, FIND_PROMPT);
  });
  const corners = await cornersNow(page);
  const pagePointsBefore = await cornersOnPage(page);
  await hand.drag(pagePointsBefore[TOP_LEFT], offsetBy(pagePointsBefore[TOP_LEFT], 0, 40));
  await check('the whole photo has moved 40 px down; every corner is on the same point of the '
    + 'card', async () => {
    expectSameCorners(await cornersNow(page), corners);
    const pagePointsAfter = await cornersOnPage(page);
    pagePointsAfter.forEach((point, index) => {
      expectMovedBy(point, pagePointsBefore[index], 0, 40);
    });
  });
  await check(`the line still reads "${FIND_PROMPT}"`, async () => {
    await expectStatus(page, FIND_PROMPT);
  });
});

test('PER-31.1 Cancel disarms Tap to find card in one tap [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnPerspective(page, testInfo);
  const corners = await cornersNow(page);
  await openOptions(page, hand, 'perspective');
  await check('Tap to find card shows', async () => {
    await expect(page.locator('#btnFindCard')).toBeVisible();
  });
  await tapFindCard(page, hand);
  await check(`the line reads "${FIND_PROMPT}", with Cancel`, async () => {
    await expectStatus(page, FIND_PROMPT);
    await expect(page.locator('#perspectiveStatusAction')).toHaveText('Cancel');
  });
  await hand.tap(page.locator('#perspectiveStatusAction'));
  await check('the line reads NUDGE and Corner 1 of 4', async () => {
    await expectNudgeLine(page);
    await expect(handleName(page)).toHaveText('Corner 1 of 4');
  });
  await recordStatuses(page);
  await tapAt(page, hand, await cardMiddle(page));
  await page.waitForTimeout(SEARCH_SETTLE_MS);
  await check('nothing happens: no "Detecting…", the corners stay, Undo is still greyed out',
    async () => {
      expect(await readStatuses(page)).toEqual([]);
      expectSameCorners(await cornersNow(page), corners);
      await expect(page.locator('#btnUndo')).toBeDisabled();
    });
});

// One of Card orientation's three choices: 'auto', 'portrait' or 'landscape'.
const orientationChoice = (page, value) => page.locator(
  `#orientation .segment[data-value="${value}"]`,
);

// Whether the corrected card is wider than tall ('landscape') or not ('portrait'), and its
// short side over its long side.
async function cardStands(page) {
  const shape = await cardShape(page);
  const isWide = shape.aspect > 1;
  return {
    way: isWide ? 'landscape' : 'portrait',
    ratio: isWide ? 1 / shape.aspect : shape.aspect,
  };
}

// Taps Preview and checks which way the corrected card stands: 'landscape' (7 wide to 5
// tall) or 'portrait' (5 wide to 7 tall). `expected` is the row's result.
async function previewShows(page, hand, check, way, expected) {
  await hand.tap(page.locator('#toolPreview'));
  await check(expected, async () => {
    await expect(previewState(page)).toHaveText('On');
    const stands = await cardStands(page);
    expect(stands.way).toBe(way);
    expect(Math.abs(stands.ratio / CARD_ASPECT - 1)).toBeLessThan(ASPECT_TOLERANCE);
  });
}

// Taps Preview again and checks the photo and its handles are back.
async function previewOff(page, hand, check) {
  await hand.tap(page.locator('#toolPreview'));
  await check('the photo and its handles are back', async () => {
    await expect(previewState(page)).toHaveText('Off');
    expect(await isHandleAt(page, await handleOnPage(page, TOP_LEFT))).toBe(true);
  });
}

// Closes the options with their Close button (the phone layout).
async function closeOrientationOptions(page, hand, check) {
  await closeOptions(page, hand, 'perspective');
  await check('the options have gone, and the whole photo shows', async () => {
    await expect(page.locator('#perspectiveSheet')).toBeHidden();
  });
}

// Taps one of Card orientation's choices and checks it is selected, as an undo step.
async function chooseOrientation(page, hand, check, value, name) {
  await hand.tap(orientationChoice(page, value));
  await check(`${name} is selected instead; Undo is no longer greyed out`, async () => {
    await expect(orientationChoice(page, value)).toHaveAttribute('aria-pressed', 'true');
    await expect(orientationChoice(page, 'auto')).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('#btnUndo')).toBeEnabled();
  });
}

// Opens the options and checks Auto is selected under CARD ORIENTATION.
async function expectAutoSelected(page, hand, check, expected) {
  await openOptions(page, hand, 'perspective');
  await check(expected, async () => {
    await expect(orientationChoice(page, 'auto')).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(() => hasWhiteFill(orientationChoice(page, 'auto'))).toBe(true);
  });
}

test('PER-32.1 Landscape turns an upright card on its side, as one undo step [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnPerspective(page, testInfo);
  await expectAutoSelected(page, hand, check, 'under CARD ORIENTATION, Auto is selected (white)');
  await chooseOrientation(page, hand, check, 'landscape', 'Landscape');
  await closeOrientationOptions(page, hand, check);
  await previewShows(page, hand, check, 'landscape',
    'the corrected card is wider than tall, 7 wide to 5 tall');
  await previewOff(page, hand, check);
  await hand.tap(page.locator('#btnUndo'));
  await check('Undo is greyed out: Landscape was one undo step', async () => {
    await expect(page.locator('#btnUndo')).toBeDisabled();
  });
  await previewShows(page, hand, check, 'portrait',
    'the corrected card stands upright again, 5 wide to 7 tall');
  await previewOff(page, hand, check);
  await expectAutoSelected(page, hand, check, 'Auto is selected again');
});

// A card photographed lying on its side, in a one-touch holder.
const SIDEWAYS_PHOTO = '13_front_landscape_onetouch_labeled_white.JPEG';

test('PER-32.3 Portrait stands a sideways card upright, as one undo step [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnPerspective(page, testInfo, { photo: SIDEWAYS_PHOTO });
  await previewShows(page, hand, check, 'landscape',
    'the corrected card is wider than tall, 7 wide to 5 tall: with Auto, it follows the card');
  await previewOff(page, hand, check);
  await expectAutoSelected(page, hand, check, 'under CARD ORIENTATION, Auto is selected (white)');
  await chooseOrientation(page, hand, check, 'portrait', 'Portrait');
  await closeOrientationOptions(page, hand, check);
  await previewShows(page, hand, check, 'portrait',
    'the corrected card stands upright, 5 wide to 7 tall');
  await previewOff(page, hand, check);
  await hand.tap(page.locator('#btnUndo'));
  await check('Undo is greyed out: Portrait was one undo step', async () => {
    await expect(page.locator('#btnUndo')).toBeDisabled();
  });
  await previewShows(page, hand, check, 'landscape',
    'the corrected card is wider than tall again, 7 wide to 5 tall');
});

// The height every control row keeps, in CSS px (the 44 px touch target).
const CONTROL_HEIGHT_PX = 44;

test('PER-32.2 Card orientation keeps its 44 px height in the options [phone] [webkit]',
  async ({ page, check }, testInfo) => {
    const hand = await startOnPerspective(page, testInfo);
    await openOptions(page, hand, 'perspective');
    await check('Perspective options rise from the bottom', async () => {
      await expect(page.locator('#orientation')).toBeVisible();
    });
    await check('the Auto / Portrait / Landscape control is 44 px tall', async () => {
      const box = await page.locator('#orientation').boundingBox();
      expect(Math.abs(box.height - CONTROL_HEIGHT_PX)).toBeLessThan(SCREEN_TOLERANCE_PX);
    });
  });

// The reset rows' look: bold text (css/app.css, .sheet-row.is-danger) and an icon in the
// brand's red, #e5322d (--accent).
const BOLD_WEIGHT = 700;
const BRAND_RED = 'rgb(229, 50, 45)';

test('PER-33.1 Reset perspective restores the corners, Flatten and orientation in one undo '
  + 'step [phone]', async ({ page, check }, testInfo) => {
  const hand = await startOnPerspective(page, testInfo);
  const candidates = await candidateCorners(page);
  const topLeft = await handleOnPage(page, TOP_LEFT);
  await hand.drag(topLeft, offsetBy(topLeft, 40, 40));
  await check('that corner is off the card\'s corner', async () => {
    expectMovedBy(await handleOnPage(page, TOP_LEFT), topLeft, 40, 40);
  });
  const dragged = await cornersNow(page);
  await hand.tap(page.locator('#toolFlatten'));
  await check('the line reads FLATTEN 100%', async () => {
    await expect(flattenValue(page)).toHaveText('100%');
  });
  await tapAt(page, hand, await sliderPoint(page, 'left'));
  await check('the line reads FLATTEN 0%', async () => {
    await expect(flattenValue(page)).toHaveText('0%');
  });
  await openOptions(page, hand, 'perspective');
  await check('Reset perspective shows, in bold with a red icon', async () => {
    const reset = page.locator('#btnResetPerspective');
    await expect(reset).toBeVisible();
    const look = await reset.evaluate(row => ({
      weight: Number(getComputedStyle(row).fontWeight),
      iconColor: getComputedStyle(row.querySelector('.icon')).color,
    }));
    expect(look.weight).toBeGreaterThanOrEqual(BOLD_WEIGHT);
    expect(look.iconColor).toBe(BRAND_RED);
  });
  await hand.tap(orientationChoice(page, 'landscape'));
  await check('Landscape is selected', async () => {
    await expect(orientationChoice(page, 'landscape')).toHaveAttribute('aria-pressed', 'true');
  });
  await hand.tap(page.locator('#btnResetPerspective'));
  await check('Auto is selected again, the line reads FLATTEN 100%, and the corners are back on '
    + 'the card', async () => {
    await expect(orientationChoice(page, 'auto')).toHaveAttribute('aria-pressed', 'true');
    await expect(flattenValue(page)).toHaveText('100%');
    expectSameCorners(await cornersNow(page), candidates[0]);
  });
  await closeOptions(page, hand, 'perspective');
  await check('on a phone the options have gone', async () => {
    if (await isPhoneLayout(page)) await expect(page.locator('#perspectiveSheet')).toBeHidden();
  });
  await hand.tap(page.locator('#btnUndo'));
  await check('the line reads FLATTEN 0%, and the top-left corner is where it was dragged in '
    + 'row 1', async () => {
    await expect(flattenValue(page)).toHaveText('0%');
    expectSameCorners(await cornersNow(page), dragged);
  });
  await openOptions(page, hand, 'perspective');
  await check('Landscape is selected: the one Undo brought back all three', async () => {
    await expect(orientationChoice(page, 'landscape')).toHaveAttribute('aria-pressed', 'true');
  });
});

test('PER-33.2 With no candidate, Reset perspective puts the corners on the centered rectangle '
  + '[phone]', async ({ page, check }, testInfo) => {
  const hand = await startOnFixture(page, testInfo, BLANK_FIXTURE);
  const topLeft = await handleOnPage(page, TOP_LEFT);
  await hand.drag(topLeft, offsetBy(topLeft, 40, 40));
  await check('that corner has moved', async () => {
    expectMovedBy(await handleOnPage(page, TOP_LEFT), topLeft, 40, 40);
  });
  await openOptions(page, hand, 'perspective');
  await check('Reset perspective shows', async () => {
    await expect(page.locator('#btnResetPerspective')).toBeVisible();
  });
  await hand.tap(page.locator('#btnResetPerspective'));
  await check('the outline is the rectangle a fifth in from each edge again', async () => {
    expectSameCorners(await cornersNow(page), BLANK_INSET_CORNERS);
  });
});

// The Debug overlay switch in Perspective's options.
const debugSwitch = page => page.locator('#debugOverlay');

test('PER-34.1 The Debug overlay\'s drawing, for a person to judge [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnPerspective(page, testInfo);
  await openOptions(page, hand, 'perspective');
  await check('Perspective options rise; under DEVELOPER the Debug overlay switch is off',
    async () => {
      await expect(debugSwitch(page)).toBeVisible();
      await expect(debugSwitch(page)).not.toBeChecked();
    });
  await hand.tap(debugSwitch(page));
  await check('it is on', async () => {
    await expect(debugSwitch(page)).toBeChecked();
  });
  await waitForDetection(page);
  await closeOptions(page, hand, 'perspective');
  await check.eye('cyan dots tracing the edges found; thin yellow lines right across the photo '
    + 'along the strongest edges; magenta outlines of the scored shapes, the best one thicker, '
    + 'the first eight labelled #1, #2… with a score and a percentage');
  await openOptions(page, hand, 'perspective');
  await check('Perspective options rise; the Debug overlay switch is on', async () => {
    await expect(debugSwitch(page)).toBeVisible();
    await expect(debugSwitch(page)).toBeChecked();
  });
  await hand.tap(debugSwitch(page));
  await check('it is off', async () => {
    await expect(debugSwitch(page)).not.toBeChecked();
  });
  await closeOptions(page, hand, 'perspective');
  await check.eye('the cyan, yellow and magenta drawing has gone; the white outline and its '
    + 'handles are as before');
});

test('PER-34.2 The Debug overlay switch leaves corners placed by hand where they are [phone]',
  async ({ page, check }, testInfo) => {
    test.fail(true, 'BUG-063');
    const hand = await startOnPerspective(page, testInfo);
    const topLeft = await handleOnPage(page, TOP_LEFT);
    await hand.drag(topLeft, offsetBy(topLeft, 40, 40));
    await check('that corner has moved 40 px right and 40 px down, off the card\'s corner',
      async () => {
        expectMovedBy(await handleOnPage(page, TOP_LEFT), topLeft, 40, 40);
      });
    const dragged = await cornersNow(page);
    await openOptions(page, hand, 'perspective');
    await check('Debug overlay shows under DEVELOPER, off', async () => {
      await expect(debugSwitch(page)).toBeVisible();
      await expect(debugSwitch(page)).not.toBeChecked();
    });
    await hand.tap(debugSwitch(page));
    await check('it is on', async () => {
      await expect(debugSwitch(page)).toBeChecked();
    });
    await waitForDetection(page);
    await closeOptions(page, hand, 'perspective');
    await check('the top-left corner ring is still where it was dragged in row 1', async () => {
      expectSameCorners(await cornersNow(page), dragged);
    });
  });

// The size of the Result picture and of the space inside its block's margins, in CSS px.
function resultPictureSize(page) {
  return page.evaluate(() => {
    const picture = document.getElementById('mini');
    const block = picture.parentElement;
    const style = getComputedStyle(block);
    const innerWidth = block.clientWidth
      - parseFloat(style.paddingLeft)
      - parseFloat(style.paddingRight);
    const box = picture.getBoundingClientRect();
    return { width: box.width, height: box.height, innerWidth };
  });
}

// The Result picture's height in CSS px (css/app.css, .perspective-result .mini).
const RESULT_HEIGHT_PX = 150;

test('PER-35.1 The Result picture runs across the side panel and follows a drag [desktop] '
  + '[webkit]', async ({ page, check }, testInfo) => {
  const hand = await startOnPerspective(page, testInfo);
  await check('under the heading RESULT, the picture runs the panel\'s full width inside its '
    + 'margins, and is 150 px tall', async () => {
    await expect(page.locator('.perspective-result .sheet-heading')).toHaveText('Result');
    await expect(page.locator('#mini')).toBeVisible();
    const size = await resultPictureSize(page);
    expect(Math.abs(size.width - size.innerWidth)).toBeLessThan(SCREEN_TOLERANCE_PX);
    expect(Math.abs(size.height - RESULT_HEIGHT_PX)).toBeLessThan(SCREEN_TOLERANCE_PX);
  });
  const pictureBefore = await resultPicture(page);
  const topLeft = await handleOnPage(page, TOP_LEFT);
  const end = offsetBy(topLeft, 40, 40);
  await holdDragAt(page, hand, topLeft, end);
  await check('before letting go, the Result picture has changed with the corner', async () => {
    await expect.poll(() => resultPicture(page)).not.toBe(pictureBefore);
  });
  const pictureAtEnd = await resultPicture(page);
  await releaseDrag(page, hand, end);
  await check('after letting go, the Result picture still shows the card as at the end of the '
    + 'drag', async () => {
    expectMovedBy(await handleOnPage(page, TOP_LEFT), topLeft, 40, 40);
    await expect.poll(() => resultPicture(page)).toBe(pictureAtEnd);
  });
});

test('PER-35.2 A phone shows no Result picture [phone]', async ({ page, check }, testInfo) => {
  const hand = await startOnPerspective(page, testInfo);
  await check('no RESULT heading and no small picture of the corrected card', async () => {
    await expect(page.locator('.perspective-result')).toBeHidden();
    await expect(page.locator('#mini')).toBeHidden();
  });
  await openOptions(page, hand, 'perspective');
  await check('Perspective options rise, with no RESULT heading or picture in them', async () => {
    await expect(page.locator('#perspectiveSheet .sheet-close')).toBeVisible();
    await expect(page.locator('#perspectiveSheet .sheet-heading').first()).toBeVisible();
    const resultHeading = page.locator('#perspectiveSheet .sheet-heading', { hasText: /^Result$/ });
    await expect(resultHeading).toHaveCount(0);
    await expect(page.locator('#mini')).toBeHidden();
  });
});

const LOW_CONFIDENCE = 'Low confidence (99%). Check the corners.';
const CLAMPED = 'Corrected frame clamped to 1000px on the long side.';
// Links that make IMG_9136's 99% confidence count as low, and that clamp its corrected frame.
const LOW_CONFIDENCE_LINK = 'index.html?detect.minConfidence=1';
const CLAMPED_LINK = 'index.html?maxOutputPx=1000';
const LOW_CONFIDENCE_AND_CLAMPED_LINK = 'index.html?detect.minConfidence=1&maxOutputPx=1000';

// True when the line above the controls is back at rest (no message; NUDGE and a handle's
// name), read once: the known-defect cases compare without waiting.
async function isNudgeLineNow(page) {
  const isStatusHidden = await statusLine(page).isHidden();
  const label = await page.locator('#perspectiveLine .line-label').textContent();
  const name = await handleName(page).textContent();
  return isStatusHidden && label === 'Nudge' && name === 'Corner 1 of 4';
}

test('PER-36.1 Tap to find card\'s prompt takes the line over the crossed-corners message '
  + '[phone]', async ({ page, check }, testInfo) => {
  const hand = await startOnPerspective(page, testInfo);
  await crossTheCorners(page, hand);
  await check(`the line reads "${CROSSED}"`, async () => {
    await expectStatus(page, CROSSED);
  });
  await openOptions(page, hand, 'perspective');
  await check('Tap to find card shows', async () => {
    await expect(page.locator('#btnFindCard')).toBeVisible();
  });
  await tapFindCard(page, hand);
  await check(`the line reads "${FIND_PROMPT}", with Cancel at its right`, async () => {
    await expectStatus(page, FIND_PROMPT);
    await expect(page.locator('#perspectiveStatusAction')).toHaveText('Cancel');
  });
  await hand.tap(page.locator('#perspectiveStatusAction'));
  await check(`the line reads "${CROSSED}" again`, async () => {
    await expectStatus(page, CROSSED);
  });
});

test('PER-36.2 The crossed-corners message takes the line over low confidence [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnPerspective(page, testInfo, { address: LOW_CONFIDENCE_LINK });
  await check(`the line reads "${LOW_CONFIDENCE}"`, async () => {
    await expectStatus(page, LOW_CONFIDENCE);
  });
  await crossTheCorners(page, hand);
  await check(`the line reads "${CROSSED}"`, async () => {
    await expectStatus(page, CROSSED);
  });
});

test('PER-36.3 Low confidence clears once a corner is dragged [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnPerspective(page, testInfo, { address: LOW_CONFIDENCE_LINK });
  await check(`the line reads "${LOW_CONFIDENCE}"`, async () => {
    await expectStatus(page, LOW_CONFIDENCE);
  });
  const topLeft = await handleOnPage(page, TOP_LEFT);
  await hand.drag(topLeft, offsetBy(topLeft, 20, 0));
  await check('the corner has moved; the message has gone: the line reads NUDGE and Corner 1 of 4',
    async () => {
      expectMovedBy(await handleOnPage(page, TOP_LEFT), topLeft, 20, 0);
      await expectNudgeLine(page);
      await expect(handleName(page)).toHaveText('Corner 1 of 4');
    });
});

test('PER-36.4 "Nothing detected" clears once a corner is nudged with an arrow [phone]',
  async ({ page, check }, testInfo) => {
    const hand = await startOnFixture(page, testInfo, BLANK_FIXTURE);
    await check(`the line reads "${NOTHING_DETECTED}"`, async () => {
      await expectStatus(page, NOTHING_DETECTED);
    });
    const [start] = await cornersNow(page);
    const stepPx = Math.max(1, 1 / await zoomNow(page));
    await hand.tap(arrowButton(page, 'right'));
    await check('a round magnifier shows the top-left corner (the arrow moved it one screen '
      + 'pixel), and the message has gone: the line reads NUDGE and Corner 1 of 4', async () => {
      expectMove(await topLeftMovedFrom(page, start), stepPx, 0);
      expect(await isNudgeMagnifierUp(page)).toBe(true);
      await expectNudgeLine(page);
      await expect(handleName(page)).toHaveText('Corner 1 of 4');
    });
  });

test('PER-36.5 A clamped corrected frame is not reported in the line [phone]', async ({
  page,
  check,
}, testInfo) => {
  test.fail(true, 'BUG-288');
  await startOnPerspective(page, testInfo, { address: CLAMPED_LINK });
  // A plain reading, so the known defect fails at once.
  const isShown = await statusLine(page).isVisible();
  const text = await statusLine(page).locator('.status-text').textContent();
  await check(`it holds no message about the corrected frame: it doesn't read "${CLAMPED}"`,
    () => {
      expect(isShown && /Corrected frame/.test(text)).toBe(false);
    });
});

test('PER-36.6 Low confidence takes the line over a clamped frame [phone]', async ({
  page,
  check,
}, testInfo) => {
  await startOnPerspective(page, testInfo, { address: LOW_CONFIDENCE_AND_CLAMPED_LINK });
  await check(`the line reads "${LOW_CONFIDENCE}", not the clamped-frame message`, async () => {
    await expectStatus(page, LOW_CONFIDENCE);
  });
});

// The messages recordStatuses has seen since the find tap: the prompt it starts on left out.
async function statusesAfterTap(page) {
  return (await readStatuses(page)).filter(text => text !== FIND_PROMPT);
}

test('PER-36.7 The crossed-corners message takes the line over "Detecting…" [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnPerspective(page, testInfo);
  const middle = await cardMiddle(page);
  await crossTheCorners(page, hand);
  await check(`the line reads "${CROSSED}"`, async () => {
    await expectStatus(page, CROSSED);
  });
  await openOptions(page, hand, 'perspective');
  await check('Tap to find card shows', async () => {
    await expect(page.locator('#btnFindCard')).toBeVisible();
  });
  await tapFindCard(page, hand);
  await check(`the line reads "${FIND_PROMPT}"`, async () => {
    await expectStatus(page, FIND_PROMPT);
  });
  await recordStatuses(page);
  await tapAt(page, hand, middle);
  await waitForFind(page);
  await check('while the search runs, the line reads the crossed-corners message and never '
    + '"Detecting…"; then the corners land on the card and the line reads NUDGE and Corner 1 of 4',
  async () => {
    expect(await statusesAfterTap(page)).toEqual([CROSSED]);
    expect(await errorAgainstTruth(page, 'IMG_9136')).toBeLessThan(WITHIN_PCT);
    await expectNudgeLine(page);
    await expect(handleName(page)).toHaveText('Corner 1 of 4');
  });
});

test('PER-36.8 "Detecting…" takes the line over low confidence [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnPerspective(page, testInfo, { address: LOW_CONFIDENCE_LINK });
  await check(`the line reads "${LOW_CONFIDENCE}"`, async () => {
    await expectStatus(page, LOW_CONFIDENCE);
  });
  await openOptions(page, hand, 'perspective');
  await check('Tap to find card shows', async () => {
    await expect(page.locator('#btnFindCard')).toBeVisible();
  });
  await tapFindCard(page, hand);
  await check(`the line reads "${FIND_PROMPT}"`, async () => {
    await expectStatus(page, FIND_PROMPT);
  });
  await recordStatuses(page);
  await tapAt(page, hand, await cardMiddle(page));
  await waitForFind(page);
  await check('for a moment the line reads "Detecting…", in place of the low-confidence '
    + `message; then it reads "${LOW_CONFIDENCE}" again`, async () => {
    expect(await statusesAfterTap(page)).toEqual(['Detecting…', LOW_CONFIDENCE]);
    await expectStatus(page, LOW_CONFIDENCE);
  });
});

test('PER-36.9 "Nothing detected" takes the line over a clamped frame [phone]', async ({
  page,
  check,
}, testInfo) => {
  await startOnFixture(page, testInfo, BLANK_FIXTURE, CLAMPED_LINK);
  await check(`the line reads "${NOTHING_DETECTED}", not the clamped-frame message`, async () => {
    expect(await page.evaluate(() => window.__straightener.app.geometry.perspective.isClamped))
      .toBe(true);
    await expectStatus(page, NOTHING_DETECTED);
  });
});

test('PER-36.10 Once a move has cleared Low confidence, Undo doesn\'t bring it back; a new '
  + 'search does [phone]', async ({ page, check }, testInfo) => {
  const hand = await startOnPerspective(page, testInfo, { address: LOW_CONFIDENCE_LINK });
  await check(`the line reads "${LOW_CONFIDENCE}"`, async () => {
    await expectStatus(page, LOW_CONFIDENCE);
  });
  const topLeft = await handleOnPage(page, TOP_LEFT);
  await hand.drag(topLeft, offsetBy(topLeft, 20, 0));
  await check('the message has gone: the line reads NUDGE and Corner 1 of 4, with nothing at its '
    + 'right end (no Confidence)', async () => {
    expectMovedBy(await handleOnPage(page, TOP_LEFT), topLeft, 20, 0);
    await expectNudgeLine(page);
    await expect(handleName(page)).toHaveText('Corner 1 of 4');
    await expect(confidence(page)).toHaveText('');
  });
  await hand.tap(page.locator('#btnUndo'));
  await check('the corner is back; the message stays away: the line reads NUDGE and Corner 1 of '
    + '4, now with Confidence 99% at its right', async () => {
    expectMovedBy(await handleOnPage(page, TOP_LEFT), topLeft, 0, 0);
    await expect(confidence(page)).toHaveText('Confidence 99%');
    await expectNudgeLine(page);
    await expect(handleName(page)).toHaveText('Corner 1 of 4');
  });
  await openOptions(page, hand, 'perspective');
  await check('Tap to find card shows', async () => {
    await expect(page.locator('#btnFindCard')).toBeVisible();
  });
  await tapFindCard(page, hand);
  await check(`the line reads "${FIND_PROMPT}"`, async () => {
    await expectStatus(page, FIND_PROMPT);
  });
  await tapAt(page, hand, await cardMiddle(page));
  await waitForFind(page);
  await check(`once the search ends, the line reads "${LOW_CONFIDENCE}" again`, async () => {
    await expectStatus(page, LOW_CONFIDENCE);
  });
});

test('PER-36.11 Once a move has cleared "Nothing detected", Undo doesn\'t bring it back '
  + '[phone]', async ({ page, check }, testInfo) => {
  const hand = await startOnFixture(page, testInfo, BLANK_FIXTURE);
  await check(`the line reads "${NOTHING_DETECTED}"`, async () => {
    await expectStatus(page, NOTHING_DETECTED);
  });
  await hand.tap(arrowButton(page, 'right'));
  await check('the message has gone: the line reads NUDGE and Corner 1 of 4', async () => {
    await expectNudgeLine(page);
    await expect(handleName(page)).toHaveText('Corner 1 of 4');
  });
  await hand.tap(page.locator('#btnUndo'));
  await check('the outline is the centered rectangle again and Undo is greyed out; the message '
    + 'stays away: the line still reads NUDGE and Corner 1 of 4', async () => {
    expectSameCorners(await cornersNow(page), BLANK_INSET_CORNERS);
    await expect(page.locator('#btnUndo')).toBeDisabled();
    await expectNudgeLine(page);
    await expect(handleName(page)).toHaveText('Corner 1 of 4');
  });
});

// Sets what PER-37 keeps for the session: Flatten, Snap on and the Debug overlay on, checking
// each as it goes.
async function setSessionTools(page, hand, check) {
  await hand.tap(page.locator('#toolFlatten'));
  await check('Flatten is selected', async () => {
    await expect.poll(() => hasWhiteFill(page.locator('#toolFlatten'))).toBe(true);
  });
  await hand.tap(page.locator('#toolSnap'));
  await check('Snap reads On', async () => {
    await expect(page.locator('#toolSnap .tool-state')).toHaveText('On');
  });
  await openOptions(page, hand, 'perspective');
  await check('the Debug overlay switch is off', async () => {
    await expect(debugSwitch(page)).not.toBeChecked();
  });
  await tapDebugSwitch(page, hand);
  await check('it is on', async () => {
    await expect(debugSwitch(page)).toBeChecked();
  });
  await closeOptions(page, hand, 'perspective');
  await check('thin yellow lines run across the photo', async () => {
    expect(await areDetectedLinesDrawn(page)).toBe(true);
  });
}

test('PER-37.1 Flatten, Snap and Debug overlay stay as set for the next photo [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnPerspective(page, testInfo);
  await setSessionTools(page, hand, check);
  await openPhoto(page, SECOND_PHOTO);
  await check('the new photo opens on the Perspective step', async () => {
    await expect(page.locator('#perspectiveArea')).toBeVisible();
  });
  await check('Flatten is selected, with the line FLATTEN 100% above; Snap reads On', async () => {
    await expect.poll(() => hasWhiteFill(page.locator('#toolFlatten'))).toBe(true);
    await expect(page.locator('#perspectiveLine .line-label')).toHaveText('Flatten');
    await expect(flattenValue(page)).toHaveText('100%');
    await expect(page.locator('#toolSnap .tool-state')).toHaveText('On');
  });
  await openOptions(page, hand, 'perspective');
  await check('the Debug overlay switch is on', async () => {
    await expect(debugSwitch(page)).toBeChecked();
  });
});

test('PER-37.2 Flatten, Snap and Debug overlay are not kept after a reload [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnPerspective(page, testInfo);
  await setSessionTools(page, hand, check);
  // A person would wait a moment; the script waits until the photo is saved for Resume.
  await waitInPage(page, async name => {
    const record = await window.__straightener.Session.peek();
    return !!record && record.name === name;
  }, PHOTO);
  await page.reload();
  await page.waitForFunction(() => !!window.__straightener);
  await check('the start screen offers to resume IMG_9136.JPEG', async () => {
    await expect(page.locator('#btnResume')).toBeVisible();
    await expect(page.locator('#resumeName')).toHaveText(PHOTO);
  });
  await hand.tap(page.locator('#btnResume'));
  await page.waitForFunction(() => !!window.__straightener.app.geometry);
  await check('the photo opens on the Perspective step', async () => {
    await expect(page.locator('#perspectiveArea')).toBeVisible();
  });
  await check('Nudge is selected, with the line NUDGE above; Snap reads Off', async () => {
    await expect.poll(() => hasWhiteFill(page.locator('#toolNudge'))).toBe(true);
    await expect(page.locator('#perspectiveLine .line-label')).toHaveText('Nudge');
    await expect(page.locator('#toolSnap .tool-state')).toHaveText('Off');
  });
  await openOptions(page, hand, 'perspective');
  await check('the Debug overlay switch is off', async () => {
    await expect(debugSwitch(page)).not.toBeChecked();
  });
});

test('PER-38.1 Selecting, Next handle, Flatten, Snap, Preview and Tap to find card add no undo '
  + 'step [phone]', async ({ page, check }, testInfo) => {
  const hand = await startOnPerspective(page, testInfo);
  const undo = page.locator('#btnUndo');
  await check('Undo is greyed out: the search on opening was not an undo step', async () => {
    await expect(undo).toBeDisabled();
  });
  await tapAt(page, hand, await handleOnPage(page, BOTTOM_RIGHT));
  await check('the line reads Corner 3 of 4; Undo is still greyed out', async () => {
    await expect(handleName(page)).toHaveText('Corner 3 of 4');
    await expect(undo).toBeDisabled();
  });
  await hand.tap(page.locator('#btnNextHandle'));
  await check('the line reads Corner 4 of 4; Undo is still greyed out', async () => {
    await expect(handleName(page)).toHaveText('Corner 4 of 4');
    await expect(undo).toBeDisabled();
  });
  await hand.tap(page.locator('#toolFlatten'));
  await check('Flatten is selected; Undo is still greyed out', async () => {
    await expect.poll(() => hasWhiteFill(page.locator('#toolFlatten'))).toBe(true);
    await expect(undo).toBeDisabled();
  });
  const switches = [
    ['#toolSnap', 'On', 'Snap reads On'],
    ['#toolPreview', 'On', 'Preview reads On'],
    ['#toolPreview', 'Off', 'Preview reads Off'],
  ];
  for (const [tool, state, expected] of switches) {
    await hand.tap(page.locator(tool));
    await check(`${expected}; Undo is still greyed out`, async () => {
      await expect(page.locator(`${tool} .tool-state`)).toHaveText(state);
      await expect(undo).toBeDisabled();
    });
  }
  await openOptions(page, hand, 'perspective');
  await check('Tap to find card shows', async () => {
    await expect(page.locator('#btnFindCard')).toBeVisible();
  });
  await tapFindCard(page, hand);
  await check(`the line reads "${FIND_PROMPT}"; Undo is still greyed out`, async () => {
    await expectStatus(page, FIND_PROMPT);
    await expect(undo).toBeDisabled();
  });
  await hand.tap(page.locator('#perspectiveStatusAction'));
  await check('the line reads FLATTEN 100%; Undo is still greyed out', async () => {
    await expect(page.locator('#perspectiveLine .line-label')).toHaveText('Flatten');
    await expect(flattenValue(page)).toHaveText('100%');
    await expect(undo).toBeDisabled();
  });
});

test('PER-38.2 The Debug overlay switch adds no undo step after a hand-placed corner [phone]',
  async ({ page, check }, testInfo) => {
    test.fail(true, 'BUG-063');
    const hand = await startOnPerspective(page, testInfo);
    const candidates = await candidateCorners(page);
    const undo = page.locator('#btnUndo');
    const topLeft = await handleOnPage(page, TOP_LEFT);
    await hand.drag(topLeft, offsetBy(topLeft, 40, 40));
    await check('that corner has moved; Undo is no longer greyed out', async () => {
      expectMovedBy(await handleOnPage(page, TOP_LEFT), topLeft, 40, 40);
      await expect(undo).toBeEnabled();
    });
    await openOptions(page, hand, 'perspective');
    await check('Debug overlay shows under DEVELOPER, off', async () => {
      await expect(debugSwitch(page)).toBeVisible();
      await expect(debugSwitch(page)).not.toBeChecked();
    });
    await hand.tap(debugSwitch(page));
    await waitForDetection(page);
    await check('it is on', async () => {
      await expect(debugSwitch(page)).toBeChecked();
    });
    await closeOptions(page, hand, 'perspective');
    await check('on a phone the options have gone', async () => {
      if (await isPhoneLayout(page)) await expect(page.locator('#perspectiveSheet')).toBeHidden();
    });
    await hand.tap(undo);
    await check('the top-left corner is back on the card\'s corner, and Undo is greyed out: the '
      + 'drag was the only undo step', async () => {
      expectSameCorners(await cornersNow(page), candidates[0]);
      expect(await undo.isDisabled()).toBe(true);
    });
  });

// How long PER-39.1 may take: it opens all 22 sample photos, about a second each.
const ACCURACY_TIMEOUT_MS = 240000;
// The error recorded when a photo has no candidate at all, as R1 records it (%).
const NO_CANDIDATE_PCT = 99;
// Photos known to miss their rules, by browser engine, each with its bug. They play the part
// test.fail plays for a whole case, photo by photo, so the other photos stay gated: a listed
// photo must miss, and the case fails the moment it is found again.
const KNOWN_SLIPS = {
  chromium: {
    '02_black_flat_black': 'BUG-065',
  },
  webkit: {
    'IMG_9216': 'BUG-240',
    '02_black_flat_black': 'BUG-065',
    '07_dark_flat_black': 'BUG-240',
  },
};

// Opens one sample through the app's file input, as Open does, and measures its detection
// against the hand-placed corners: the corners as they landed (the top pick), then after each
// tap on Candidate until it has shown each of its numbers. Returns { name, sawDetecting,
// topPct, bestPct, confidences }, the errors in % of the diagonal.
async function measureDetection(page, hand, name) {
  await page.evaluate(() => {
    window.testStatuses = [];
  });
  await openPhoto(page, `${name}.JPEG`);
  const sawDetecting = (await readStatuses(page)).includes('Detecting…')
    && await page.evaluate(() => window.__straightener.app.detection.message === '');
  const confidences = await page.evaluate(() => window.__straightener.app.detection.candidates
    .map(candidate => Math.round(candidate.confidence * 100)));
  const errors = confidences.length ? [await errorAgainstTruth(page, name)] : [];
  for (let tap = 1; tap < confidences.length; tap++) {
    await hand.tap(page.locator('#toolCandidate'));
    errors.push(await errorAgainstTruth(page, name));
  }
  return {
    name,
    sawDetecting,
    topPct: errors.length ? errors[0] : NO_CANDIDATE_PCT,
    bestPct: Math.min(NO_CANDIDATE_PCT, ...errors),
    confidences,
  };
}

// A table of the measured errors next to the baselines, and the scoreboard R1 prints: how many
// photos each pick finds within 1%, all of them, the raw cards and the held-out photos.
function accuracyReport(measured) {
  const rows = measured.map(photo => {
    const baseline = BASELINE[photo.name];
    return `| ${photo.name} | ${groupOf(baseline.top)} | ${photo.topPct.toFixed(2)}% `
      + `(${baseline.top}%) | ${photo.bestPct.toFixed(2)}% (${baseline.best}%) `
      + `| ${photo.confidences.join(', ')} |`;
  });
  const countWithin = (names, field) => measured
    .filter(photo => names.includes(photo.name) && photo[field] < WITHIN_PCT).length;
  const allNames = measured.map(photo => photo.name);
  const scoreboard = [
    `top pick ${countWithin(allNames, 'topPct')}/${allNames.length}`,
    `best of 3 ${countWithin(allNames, 'bestPct')}/${allNames.length}`,
    `raw cards ${countWithin(RAW_CARDS, 'topPct')}/${RAW_CARDS.length}`,
    `held out ${countWithin(HELD_OUT, 'topPct')}/${HELD_OUT.length}`,
  ].join(', ');
  return [
    '| Photo | Group | Top pick (baseline) | Best of 3 (baseline) | Confidence % |',
    '| --- | --- | --- | --- | --- |',
    ...rows,
    '',
    `Within 1%: ${scoreboard}`,
  ].join('\n');
}

test('PER-39.1 Every sample photo is detected within its own baseline [desktop] [webkit]',
  async ({ page, check, browserName }, testInfo) => {
    test.setTimeout(ACCURACY_TIMEOUT_MS);
    await openApp(page);
    const hand = handFor(page, testInfo);
    await recordStatuses(page);
    const measured = [];
    for (const name of Object.keys(GROUND_TRUTH)) {
      measured.push(await measureDetection(page, hand, name));
    }
    const report = accuracyReport(measured);
    await testInfo.attach('detection-accuracy.md', { body: report, contentType: 'text/markdown' });
    console.log(`${browserName}\n${report}`);
    // Every photo gets its verdict, so a run shows each one that slipped, not just the first.
    const failures = [];
    const knownSlips = KNOWN_SLIPS[browserName];
    for (const photo of measured) {
      const baseline = BASELINE[photo.name];
      const isHeld = isTopPickHeld(photo.topPct, baseline.top)
        && isBestHeld(photo.bestPct, baseline.best);
      const bug = knownSlips[photo.name];
      const measuredText = `${photo.name} (${groupOf(baseline.top)}): "Detecting…" came and went; `
        + `top pick ${photo.topPct.toFixed(2)}% against ${baseline.top}%, best of 3 `
        + `${photo.bestPct.toFixed(2)}% against ${baseline.best}%`;
      const expected = bug
        ? `${measuredText}; a known defect (${bug}), so it misses its rules until that is fixed`
        : `${measuredText}, within its rules`;
      await check(expected, async () => {
        expect(photo.sawDetecting).toBe(true);
        expect(isHeld, bug ? `${bug} is fixed: remove it from KNOWN_SLIPS` : '').toBe(!bug);
      }).catch(error => failures.push(error));
    }
    expect(failures.map(String)).toEqual([]);
  });
