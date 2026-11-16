// The Crop step's cases (tests/catalog/crop.md): the size line, the presets and their row, how
// a preset reshapes a box drawn by hand, Fit to card, Swap, the crop following the card,
// moving and resizing the box, panning, how the crop looks, Reset crop and the remembered
// preset.
// Each test drives the app as a person would, through hand.tap and hand.drag (a finger on the
// phone targets, the mouse on the wide ones), and reads the app's state only to check a result.
'use strict';
const { test, expect } = require('./support/case.js');
const {
  openPhoto,
  goToStep,
  editState,
  openOptions,
  closeOptions,
  waitForStill,
  hasWhiteFill,
} = require('./support/app.js');
const {
  holdDragAt,
  releaseDrag,
  sendTouch,
  offsetBy,
} = require('./support/perspective.js');
const { crossTheCorners } = require('./support/export.js');
const { addBack, reloadToStart } = require('./support/start-and-session.js');
const {
  startOnCrop,
  presetChip,
  chipLabels,
  selectedChips,
  cropRect,
  frameSize,
  cardBox,
  cropHandleOnPage,
  viewNow,
  undoSteps,
  sizeLine,
  scrollPresetRow,
  isChipInView,
  rowScroll,
} = require('./support/crop.js');

// A second photo, for the cases that open another one: a Beckett slab on white.
const SECOND_PHOTO = 'IMG_9075.JPEG';
// A front and back pair: a raw portrait card's front and back, on white.
const PAIR_FRONT = '14_front_portrait_raw_white.JPEG';
const PAIR_BACK = '14_back_portrait_raw_white.JPEG';
// The preset labels while the crop stands upright (portrait) and lies on its side (landscape).
const PORTRAIT_LABELS = ['Free', 'Original', '1:1', '3:4', '4:5', '2:3', '9:16', '5:7 card'];
const LANDSCAPE_LABELS = ['Free', 'Original', '1:1', '4:3', '5:4', '3:2', '16:9', '7:5 card'];
// Two positions or sizes in the straightened picture match within this many of its px.
const POSITION_TOLERANCE_PX = 1;
// Two box shapes (width ÷ height) match within this.
const RATIO_TOLERANCE = 0.002;
// Two areas match within this share.
const AREA_TOLERANCE = 0.01;
// How far a drag moves the box or a handle, in CSS px.
const DRAG_PX = 40;
// How far the bottom-right handle is dragged in to make a smaller box first, so a move or a
// Swap has room in the picture, in CSS px.
const SHRINK_PX = 80;
// A drag long enough to run anything past the edge of the picture, in CSS px.
const FAR_PX = 2000;
// The least size of a box drawn by hand, in photo px (CONFIG.crop.minSizePx).
const MIN_SIZE_PX = 16;
// Fit to card's margin: a share of the card's longer side on each side
// (CONFIG.crop.fitPaddingPct, 8%).
const FIT_PADDING = 0.08;
// How far from a handle a press still grabs it, in CSS px (CONFIG.handle.hitRadius is 24); a
// press 12 px across and 12 px down is about 17 px away.
const NEAR_HANDLE_PX = 12;
// How far above the box's top edge a press lands to be outside it and its handles, in CSS px.
const OUTSIDE_BOX_PX = 60;
// The shapes of the presets used, width ÷ height.
const PORTRAIT_4_5 = 4 / 5;
const LANDSCAPE_5_4 = 5 / 4;
const CARD_5_7 = 5 / 7;
// How far the row of presets is scrolled back to its start with the wheel, in CSS px.
const ROW_BACK_PX = -1000;

// The crop's shape, width ÷ height.
const ratioOf = rect => rect.width / rect.height;

// Expects two numbers to be within `tolerance`.
function expectNear(actual, expected, tolerance = POSITION_TOLERANCE_PX) {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance);
}

// Expects two crop boxes to be the same within POSITION_TOLERANCE_PX.
function expectSameRect(actual, expected) {
  expectNear(actual.x, expected.x);
  expectNear(actual.y, expected.y);
  expectNear(actual.width, expected.width);
  expectNear(actual.height, expected.height);
}

// Drags the crop box from its middle by (dx, dy) CSS px.
async function dragBox(page, hand, dx, dy) {
  const middle = await cropHandleOnPage(page, 'middle');
  await hand.drag(middle, offsetBy(middle, dx, dy));
}

// Drags one of the box's handles by (dx, dy) CSS px.
async function dragHandle(page, hand, part, dx, dy) {
  const start = await cropHandleOnPage(page, part);
  await hand.drag(start, offsetBy(start, dx, dy));
}

// Taps Reset crop in Crop options (on a phone the sheet opens first and closes after).
async function resetCrop(page, hand) {
  await openOptions(page, hand, 'crop');
  await hand.tap(page.locator('#cropResetRow'));
  await closeOptions(page, hand, 'crop');
}

test('CRP-01.1 The size line follows the crop, and is empty while the corners cross [phone]',
  async ({ page, check }, testInfo) => {
    const hand = await startOnCrop(page, testInfo);
    await check('the line reads CROP, the crop\'s size and px: 1400 × 1400 px', async () => {
      await expect(page.locator('#cropLine')).toContainText('Crop');
      const rect = await cropRect(page);
      const size = `${Math.round(rect.width)} × ${Math.round(rect.height)}`;
      expect(await sizeLine(page)).toEqual({ size, isUnitShown: true });
      expect(size).toBe('1400 × 1400');
    });
    const corner = await cropHandleOnPage(page, 'se');
    const end = offsetBy(corner, -DRAG_PX, -DRAG_PX);
    await holdDragAt(page, hand, corner, end);
    await check('during a drag of the bottom-right handle the size is smaller and follows the box',
      async () => {
        const rect = await cropRect(page);
        const size = `${Math.round(rect.width)} × ${Math.round(rect.height)}`;
        expect((await sizeLine(page)).size).toBe(size);
        expect(rect.width).toBeLessThan(1400 - 1);
      });
    await releaseDrag(page, hand, end);
    await goToStep(page, 'perspective', hand);
    await crossTheCorners(page, hand);
    await goToStep(page, 'crop', hand);
    await check('with the corners crossed on Perspective, the line shows CROP with no size and '
      + 'no px', async () => {
      expect(await sizeLine(page)).toEqual({ size: '', isUnitShown: false });
    });
  });

test('CRP-02.1 Eight presets; the chosen one is white, one undo step a pick [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnCrop(page, testInfo);
  await check('eight presets in order: Free, Original, 1:1, 3:4, 4:5, 2:3, 9:16, 5:7 card; 1:1 '
    + 'is white', async () => {
    expect(await chipLabels(page)).toEqual(PORTRAIT_LABELS);
    expect(await selectedChips(page)).toEqual(['1:1']);
    expect(await hasWhiteFill(presetChip(page, '1:1'))).toBe(true);
    expect(await hasWhiteFill(presetChip(page, '4:5'))).toBe(false);
  });
  await hand.tap(presetChip(page, '4:5'));
  await check('4:5 is white instead of 1:1 and the box is 4:5', async () => {
    expect(await selectedChips(page)).toEqual(['4:5']);
    expect(await hasWhiteFill(presetChip(page, '4:5'))).toBe(true);
    expect(await hasWhiteFill(presetChip(page, '1:1'))).toBe(false);
    expectNear(ratioOf(await cropRect(page)), PORTRAIT_4_5, RATIO_TOLERANCE);
  });
  await hand.tap(page.locator('#btnUndo'));
  await check('one Undo goes back to 1:1 and greys Undo out', async () => {
    expect(await selectedChips(page)).toEqual(['1:1']);
    await expect(page.locator('#btnUndo')).toBeDisabled();
  });
});

test('CRP-03.1 The row of presets runs off the right edge, for a person to judge [phone]',
  async ({ page, check }, testInfo) => {
    await startOnCrop(page, testInfo);
    const row = page.locator('#cropPresets');
    await check('the row is wider than the screen and scrolls sideways with no scrollbar',
      async () => {
        const sizes = await row.evaluate(el => ({
          scrollWidth: el.scrollWidth,
          clientWidth: el.clientWidth,
          scrollbarWidth: getComputedStyle(el).scrollbarWidth,
          overflowX: getComputedStyle(el).overflowX,
        }));
        expect(sizes.scrollWidth).toBeGreaterThan(sizes.clientWidth);
        expect(sizes.scrollbarWidth).toBe('none');
        expect(sizes.overflowX).toBe('auto');
        const lastChip = await presetChip(page, '5:7 card').boundingBox();
        expect(lastChip.x + lastChip.width).toBeGreaterThan(page.viewportSize().width);
      });
    await waitForStill(page);
    await check.eye('one row of presets, the last one in view cut off by the right edge of the '
      + 'screen; no scrollbar under the row');
  });

test('CRP-03.2 On a wide screen every preset is in view [desktop]', async ({
  page,
  check,
}, testInfo) => {
  await startOnCrop(page, testInfo);
  const row = page.locator('#cropPresets');
  await check('the presets wrap onto more than one line inside the panel, with nothing to scroll',
    async () => {
      const layout = await row.evaluate(el => ({
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
        lineTops: [...new Set([...el.children].map(chip => Math.round(chip.offsetTop)))],
      }));
      expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth);
      expect(layout.lineTops.length).toBeGreaterThan(1);
      for (const label of PORTRAIT_LABELS) {
        await expect(presetChip(page, label)).toBeInViewport({ ratio: 1 });
      }
    });
});

test('CRP-04.1 The row rests on the chosen preset, and otherwise stays where it was scrolled '
  + '[phone]', async ({ page, check }, testInfo) => {
  const hand = await startOnCrop(page, testInfo);
  await hand.tap(presetChip(page, '5:7 card'));
  await scrollPresetRow(page, ROW_BACK_PX);
  await check('scrolled back to its start, the row shows Free first and 5:7 card is out of view',
    async () => {
      expect(await rowScroll(page)).toBe(0);
      expect(await isChipInView(page, '5:7 card')).toBe(false);
    });
  await hand.tap(page.locator('#toolFitToCard'));
  await check('Fit to card leaves the row where it was', async () => {
    expect(await rowScroll(page)).toBe(0);
  });
  await goToStep(page, 'rotate', hand);
  await goToStep(page, 'crop', hand);
  await check('back on Crop, the row rests with 5:7 card wholly in view', async () => {
    expect(await isChipInView(page, '5:7 card')).toBe(true);
  });
  await scrollPresetRow(page, ROW_BACK_PX);
  await hand.tap(page.locator('#toolSwap'));
  await check('scrolled to its start again, Swap renames the chosen preset 7:5 card and the row '
    + 'rests on it', async () => {
    expect(await selectedChips(page)).toEqual(['7:5 card']);
    expect(await isChipInView(page, '7:5 card')).toBe(true);
  });
});

test('CRP-05.1 Preset names follow the crop\'s orientation [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnCrop(page, testInfo);
  await check('with the card upright the names read 3:4, 4:5, 2:3, 9:16 and 5:7 card',
    async () => {
      expect(await chipLabels(page)).toEqual(PORTRAIT_LABELS);
    });
  await hand.tap(presetChip(page, '4:5'));
  await hand.tap(page.locator('#toolSwap'));
  await check('after Swap the crop lies on its side and the names read 4:3, 5:4, 3:2, 16:9 and '
    + '7:5 card; 5:4 is chosen', async () => {
    expect(await chipLabels(page)).toEqual(LANDSCAPE_LABELS);
    expect(await selectedChips(page)).toEqual(['5:4']);
  });
});

test('CRP-06.1 A preset reshapes a box drawn by hand around the same middle [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnCrop(page, testInfo);
  await dragBox(page, hand, DRAG_PX, 0);
  const drawn = await cropRect(page);
  await hand.tap(presetChip(page, '4:5'));
  await check('the box becomes 4:5, with the same middle and the same area', async () => {
    const reshaped = await cropRect(page);
    expectNear(ratioOf(reshaped), PORTRAIT_4_5, RATIO_TOLERANCE);
    expectNear(reshaped.centerX, drawn.centerX);
    expectNear(reshaped.centerY, drawn.centerY);
    const areaRatio = (reshaped.width * reshaped.height) / (drawn.width * drawn.height);
    expectNear(areaRatio, 1, AREA_TOLERANCE);
  });
});

test('CRP-06.2 A reshaped box too big for the picture shrinks to fit it [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnCrop(page, testInfo);
  const frame = await frameSize(page);
  await hand.tap(presetChip(page, 'Free'));
  await dragHandle(page, hand, 'nw', -FAR_PX, -FAR_PX);
  await dragHandle(page, hand, 'se', FAR_PX, FAR_PX);
  await check('with Free, the box drawn by hand covers the whole picture', async () => {
    expectSameRect(await cropRect(page), { x: 0, y: 0, ...frame });
  });
  await hand.tap(presetChip(page, '1:1'));
  await check('1:1 at the same area would be wider than the picture, so the square shrinks to '
    + 'the picture\'s width and stays inside it', async () => {
    const square = await cropRect(page);
    expect(Math.sqrt(frame.width * frame.height)).toBeGreaterThan(frame.width);
    expectNear(square.width, frame.width);
    expectNear(square.height, frame.width);
    expectNear(square.x, 0);
    expect(square.y).toBeGreaterThanOrEqual(0);
    expect(square.y + square.height).toBeLessThanOrEqual(frame.height + POSITION_TOLERANCE_PX);
  });
});

test('CRP-07.1 Fit to card puts the box back around the card, one undo step [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnCrop(page, testInfo);
  const fitted = await cropRect(page);
  const card = await cardBox(page);
  await check('the 1:1 box sits around the card: above and below it a margin of 8% of the '
    + 'card\'s height, and centered across it', () => {
    const margin = FIT_PADDING * Math.max(card.width, card.height);
    expectNear(card.y - fitted.y, margin);
    expectNear(fitted.y + fitted.height - card.y - card.height, margin);
    expectNear(fitted.centerX, card.x + card.width / 2);
  });
  await dragBox(page, hand, DRAG_PX, DRAG_PX);
  const dragged = await cropRect(page);
  await hand.tap(page.locator('#toolFitToCard'));
  await check('Fit to card puts the box back exactly around the card', async () => {
    expectSameRect(await cropRect(page), fitted);
  });
  await hand.tap(page.locator('#btnUndo'));
  await check('one Undo brings back the box drawn by hand', async () => {
    expectSameRect(await cropRect(page), dragged);
  });
});

test('CRP-07.2 Fit to card is never greyed out, and a tap that changes nothing adds no undo '
  + 'step [phone]', async ({ page, check }, testInfo) => {
  const hand = await startOnCrop(page, testInfo);
  const fitToCard = page.locator('#toolFitToCard');
  await check('with the box already around the card, Fit to card is live', async () => {
    await expect(fitToCard).toBeEnabled();
  });
  await hand.tap(fitToCard);
  await check('tapping it changes nothing and Undo stays greyed out', async () => {
    await expect(page.locator('#btnUndo')).toBeDisabled();
  });
  await dragBox(page, hand, DRAG_PX, 0);
  const dragged = await cropRect(page);
  await hand.tap(fitToCard);
  await hand.tap(fitToCard);
  await hand.tap(page.locator('#btnUndo'));
  await check('after a drag and two taps on Fit to card, one Undo brings back the dragged box',
    async () => {
      expectSameRect(await cropRect(page), dragged);
    });
});

test('CRP-08.1 Swap turns the crop between portrait and landscape, one undo step [phone]',
  async ({ page, check }, testInfo) => {
    const hand = await startOnCrop(page, testInfo);
    const swap = page.locator('#toolSwap');
    await check('with 1:1 chosen, Swap is greyed out', async () => {
      await expect(swap).toBeDisabled();
    });
    await hand.tap(presetChip(page, 'Free'));
    await check('with Free chosen, Swap is greyed out', async () => {
      await expect(swap).toBeDisabled();
    });
    await hand.tap(presetChip(page, '4:5'));
    await check('with 4:5 chosen, Swap is live', async () => {
      await expect(swap).toBeEnabled();
    });
    await hand.tap(swap);
    await check('Swap lays the box on its side: 5:4, wider than tall', async () => {
      expectNear(ratioOf(await cropRect(page)), LANDSCAPE_5_4, RATIO_TOLERANCE);
      expect(await selectedChips(page)).toEqual(['5:4']);
    });
    await hand.tap(page.locator('#btnUndo'));
    await check('one Undo stands it upright again: 4:5', async () => {
      expectNear(ratioOf(await cropRect(page)), PORTRAIT_4_5, RATIO_TOLERANCE);
      expect(await selectedChips(page)).toEqual(['4:5']);
    });
  });

test('CRP-08.2 Swap turns a box drawn by hand about its middle [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnCrop(page, testInfo);
  await hand.tap(presetChip(page, '4:5'));
  await dragHandle(page, hand, 'se', -SHRINK_PX, -SHRINK_PX);
  await dragBox(page, hand, DRAG_PX, 0);
  const drawn = await cropRect(page);
  await hand.tap(page.locator('#toolSwap'));
  await check('the box\'s width and height change places, around the same middle', async () => {
    const swapped = await cropRect(page);
    expectNear(swapped.width, drawn.height);
    expectNear(swapped.height, drawn.width);
    expectNear(swapped.centerX, drawn.centerX);
    expectNear(swapped.centerY, drawn.centerY);
  });
});

test('CRP-08.3 In a front and back pair, Swap adds no undo step [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnCrop(page, testInfo, { photo: PAIR_FRONT });
  await addBack(page, hand, PAIR_BACK);
  await goToStep(page, 'crop', hand);
  const stepsBefore = await undoSteps(page);
  await check('the back\'s crop is 5:7 card, upright', async () => {
    expect(await selectedChips(page)).toEqual(['5:7 card']);
    expectNear(ratioOf(await cropRect(page)), CARD_5_7, RATIO_TOLERANCE);
  });
  await hand.tap(page.locator('#toolSwap'));
  await check('Swap lays it on its side, 7:5 card, and adds no undo step', async () => {
    expect(await selectedChips(page)).toEqual(['7:5 card']);
    expectNear(ratioOf(await cropRect(page)), 1 / CARD_5_7, RATIO_TOLERANCE);
    expect(await undoSteps(page)).toBe(stepsBefore);
  });
});

// Turns the photo a quarter on the Rotate step with the tool `button`, then comes back to Crop.
async function turnOnRotate(page, hand, button) {
  await goToStep(page, 'rotate', hand);
  await hand.tap(page.locator(button));
  await goToStep(page, 'crop', hand);
}

test('CRP-09.1 The crop turns with the card [phone]', async ({ page, check }, testInfo) => {
  const hand = await startOnCrop(page, testInfo);
  await hand.tap(presetChip(page, '4:5'));
  await turnOnRotate(page, hand, '#toolRotateRight');
  await check('with the card on its side, the crop is 5:4, wider than tall', async () => {
    expect(await selectedChips(page)).toEqual(['5:4']);
    expectNear(ratioOf(await cropRect(page)), LANDSCAPE_5_4, RATIO_TOLERANCE);
  });
});

// Sets which way the card stands in Perspective options ('portrait' or 'landscape'), then comes
// back to Crop.
async function standCardOnPerspective(page, hand, value) {
  await goToStep(page, 'perspective', hand);
  await openOptions(page, hand, 'perspective');
  await hand.tap(page.locator(`#orientation .segment[data-value="${value}"]`));
  await closeOptions(page, hand, 'perspective');
  await goToStep(page, 'crop', hand);
}

test('CRP-09.2 Once Swap has chosen, the crop keeps its orientation when the card\'s changes '
  + '[phone]', async ({ page, check }, testInfo) => {
  const hand = await startOnCrop(page, testInfo);
  await hand.tap(presetChip(page, '4:5'));
  await hand.tap(page.locator('#toolSwap'));
  await check('Swap lays the crop on its side: 5:4', async () => {
    expect(await selectedChips(page)).toEqual(['5:4']);
  });
  await standCardOnPerspective(page, hand, 'landscape');
  await check('with the card set to Landscape on Perspective, the crop is still 5:4', async () => {
    expect(await selectedChips(page)).toEqual(['5:4']);
  });
  await standCardOnPerspective(page, hand, 'portrait');
  await check('with the card set to Portrait, the crop is still 5:4, as Swap chose', async () => {
    expect(await selectedChips(page)).toEqual(['5:4']);
    expectNear(ratioOf(await cropRect(page)), LANDSCAPE_5_4, RATIO_TOLERANCE);
  });
});

test('CRP-09.3 Swapping back to the card\'s orientation hands the crop back to the card [phone]',
  async ({ page, check }, testInfo) => {
    const hand = await startOnCrop(page, testInfo);
    await hand.tap(presetChip(page, '4:5'));
    await hand.tap(page.locator('#toolSwap'));
    await hand.tap(page.locator('#toolSwap'));
    await check('two Swaps: the crop is upright again, 4:5', async () => {
      expect(await selectedChips(page)).toEqual(['4:5']);
    });
    await standCardOnPerspective(page, hand, 'landscape');
    await check('with the card set to Landscape on Perspective, the crop follows it: 5:4',
      async () => {
        expect(await selectedChips(page)).toEqual(['5:4']);
        expectNear(ratioOf(await cropRect(page)), LANDSCAPE_5_4, RATIO_TOLERANCE);
      });
  });

test('CRP-09.4 A quarter turn keeps Swap\'s choice across the card [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnCrop(page, testInfo);
  await hand.tap(presetChip(page, '4:5'));
  await hand.tap(page.locator('#toolSwap'));
  await check('Swap lays the crop across the upright card: 5:4', async () => {
    expect(await selectedChips(page)).toEqual(['5:4']);
  });
  await turnOnRotate(page, hand, '#toolRotateRight');
  await check('the card turned on its side: the crop stands upright, 4:5, still across the card',
    async () => {
      expect(await selectedChips(page)).toEqual(['4:5']);
      expectNear(ratioOf(await cropRect(page)), PORTRAIT_4_5, RATIO_TOLERANCE);
    });
});

test('CRP-10.1 Dragging inside the box moves it, as one undo step [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnCrop(page, testInfo);
  await hand.tap(presetChip(page, '4:5'));
  await dragHandle(page, hand, 'se', -SHRINK_PX, -SHRINK_PX);
  const before = await cropRect(page);
  const { zoom } = await viewNow(page);
  await dragBox(page, hand, DRAG_PX, DRAG_PX / 2);
  await check('the box moved with the finger, 40 px right and 20 px down on screen, and kept '
    + 'its size', async () => {
    const after = await cropRect(page);
    expectNear(after.x - before.x, DRAG_PX / zoom);
    expectNear(after.y - before.y, DRAG_PX / 2 / zoom);
    expectNear(after.width, before.width);
    expectNear(after.height, before.height);
  });
  const steps = await undoSteps(page);
  await hand.tap(page.locator('#btnUndo'));
  await check('one Undo puts it back where it was', async () => {
    expectSameRect(await cropRect(page), before);
    expect(await undoSteps(page)).toBe(steps - 1);
  });
});

test('CRP-10.2 A moved box stops at the edge of the picture [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnCrop(page, testInfo);
  const before = await cropRect(page);
  await dragBox(page, hand, -FAR_PX, 0);
  await check('dragged far to the left, the box stops against the picture\'s left edge, the same '
    + 'size', async () => {
    const after = await cropRect(page);
    expectNear(after.x, 0);
    expectNear(after.y, before.y);
    expectNear(after.width, before.width);
  });
});

test('CRP-11.1 A press near a handle grabs it and resizes the box [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnCrop(page, testInfo);
  await hand.tap(presetChip(page, 'Free'));
  const before = await cropRect(page);
  const { zoom } = await viewNow(page);
  const corner = await cropHandleOnPage(page, 'se');
  const start = offsetBy(corner, NEAR_HANDLE_PX, NEAR_HANDLE_PX);
  await hand.drag(start, offsetBy(start, -DRAG_PX, -DRAG_PX));
  await check('pressed about 17 px from the bottom-right handle and dragged 40 px up and left, the '
    + 'right and bottom edges move in by 40 px on screen; the top-left corner stays', async () => {
    const after = await cropRect(page);
    expectNear(after.x, before.x);
    expectNear(after.y, before.y);
    expectNear(before.width - after.width, DRAG_PX / zoom);
    expectNear(before.height - after.height, DRAG_PX / zoom);
  });
});

test('CRP-11.2 The box is never smaller than 16 photo pixels [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnCrop(page, testInfo);
  await hand.tap(presetChip(page, 'Free'));
  const before = await cropRect(page);
  await dragHandle(page, hand, 'se', -FAR_PX, -FAR_PX);
  await check('the bottom-right handle dragged far past the top-left: the box is 16 × 16 px, its '
    + 'top-left corner where it was', async () => {
    const after = await cropRect(page);
    expectNear(after.width, MIN_SIZE_PX);
    expectNear(after.height, MIN_SIZE_PX);
    expectNear(after.x, before.x);
    expectNear(after.y, before.y);
    await expect(page.locator('#cropSize')).toHaveText(`${MIN_SIZE_PX} × ${MIN_SIZE_PX}`);
  });
});

test('CRP-11.3 A resized box stops at the edge of the picture [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnCrop(page, testInfo);
  await hand.tap(presetChip(page, 'Free'));
  const frame = await frameSize(page);
  const before = await cropRect(page);
  await dragHandle(page, hand, 'e', FAR_PX, 0);
  await check('the right-side handle dragged far right: the box\'s right edge stops at the '
    + 'picture\'s right edge; its height is unchanged', async () => {
    const after = await cropRect(page);
    expectNear(after.x + after.width, frame.width);
    expectNear(after.x, before.x);
    expectNear(after.height, before.height);
  });
});

test('CRP-12.1 A corner drag keeps the preset\'s shape, the opposite corner still [phone]',
  async ({ page, check }, testInfo) => {
    const hand = await startOnCrop(page, testInfo);
    await hand.tap(presetChip(page, '4:5'));
    const before = await cropRect(page);
    await dragHandle(page, hand, 'se', -DRAG_PX, -DRAG_PX);
    await check('the box is smaller, still 4:5, its top-left corner where it was', async () => {
      const after = await cropRect(page);
      expect(after.width).toBeLessThan(before.width - POSITION_TOLERANCE_PX);
      expectNear(ratioOf(after), PORTRAIT_4_5, RATIO_TOLERANCE);
      expectNear(after.x, before.x);
      expectNear(after.y, before.y);
    });
  });

test('CRP-12.2 A side drag keeps the preset\'s shape, centered on the other axis [phone]',
  async ({ page, check }, testInfo) => {
    const hand = await startOnCrop(page, testInfo);
    await hand.tap(presetChip(page, '4:5'));
    const before = await cropRect(page);
    await dragHandle(page, hand, 'e', -DRAG_PX, 0);
    await check('the box is narrower, still 4:5, its left edge where it was and its middle at '
      + 'the same height', async () => {
      const after = await cropRect(page);
      expect(after.width).toBeLessThan(before.width - POSITION_TOLERANCE_PX);
      expectNear(ratioOf(after), PORTRAIT_4_5, RATIO_TOLERANCE);
      expectNear(after.x, before.x);
      expectNear(after.centerY, before.centerY);
    });
  });

test('CRP-13.1 A drag makes the box one drawn by hand, as one undo step [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnCrop(page, testInfo);
  const fitted = await cropRect(page);
  await dragBox(page, hand, DRAG_PX, 0);
  const dragged = await cropRect(page);
  await hand.tap(page.locator('#btnUndo'));
  await check('one Undo takes back the whole drag, and greys Undo out', async () => {
    expectSameRect(await cropRect(page), fitted);
    await expect(page.locator('#btnUndo')).toBeDisabled();
  });
  await hand.tap(page.locator('#btnRedo'));
  await hand.tap(presetChip(page, '4:5'));
  await check('after Redo, 4:5 reshapes the box around where it was dragged to, not around the '
    + 'card: it is a box drawn by hand', async () => {
    const reshaped = await cropRect(page);
    expectNear(reshaped.centerX, dragged.centerX);
    expect(reshaped.centerX - fitted.centerX).toBeGreaterThan(POSITION_TOLERANCE_PX);
    expect((await editState(page)).crop.mode).toBe('manual');
  });
});

test('CRP-13.2 A drag the phone cancels puts the box back [phone]', async ({
  page,
  check,
}, testInfo) => {
  test.fail(true, 'BUG-060');
  const hand = await startOnCrop(page, testInfo);
  const before = await cropRect(page);
  const middle = await cropHandleOnPage(page, 'middle');
  const end = offsetBy(middle, DRAG_PX, 0);
  await holdDragAt(page, hand, middle, end);
  await check('the box follows the finger', async () => {
    expect((await cropRect(page)).x).toBeGreaterThan(before.x + POSITION_TOLERANCE_PX);
  });
  await sendTouch(page, '#view', 'pointercancel', end);
  await check('the box is back where it was before the drag; Undo is greyed out', async () => {
    expectSameRect(await cropRect(page), before);
    expect(await page.locator('#btnUndo').isDisabled()).toBe(true);
  });
});

test('CRP-14.1 A press outside the box moves the photo [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnCrop(page, testInfo);
  const before = await cropRect(page);
  const viewBefore = await viewNow(page);
  const top = await cropHandleOnPage(page, 'n');
  const start = offsetBy(top, 0, -OUTSIDE_BOX_PX);
  await hand.drag(start, offsetBy(start, 0, DRAG_PX));
  await check('the photo and the box moved 40 px down together; the box is the same part of the '
    + 'picture; Undo stays greyed out', async () => {
    const view = await viewNow(page);
    expectNear(view.panY - viewBefore.panY, DRAG_PX);
    expectSameRect(await cropRect(page), before);
    await expect(page.locator('#btnUndo')).toBeDisabled();
  });
});

test('CRP-15.1 How the crop looks, for a person to judge [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnCrop(page, testInfo);
  await waitForStill(page);
  await check.eye('outside the box the photo is dimmed; the box has a thin white outline, a '
    + 'white square at each corner and a smaller one at the middle of each side; no lines inside');
  const middle = await cropHandleOnPage(page, 'middle');
  const end = offsetBy(middle, DRAG_PX / 2, 0);
  await holdDragAt(page, hand, middle, end);
  await check.eye('while the box is dragged, two faint lines across and two down divide it into '
    + 'thirds');
  await releaseDrag(page, hand, end);
  await waitForStill(page);
  await check.eye('let go: the lines dividing the box have gone');
});

test('CRP-16.1 Reset crop puts a box drawn by hand back around the card, one undo step '
  + '[phone]', async ({ page, check }, testInfo) => {
  const hand = await startOnCrop(page, testInfo);
  const fitted = await cropRect(page);
  await dragBox(page, hand, DRAG_PX, DRAG_PX);
  const dragged = await cropRect(page);
  await resetCrop(page, hand);
  await check('the 1:1 box is back around the card', async () => {
    expectSameRect(await cropRect(page), fitted);
    expect(await selectedChips(page)).toEqual(['1:1']);
  });
  await hand.tap(page.locator('#btnUndo'));
  await check('one Undo brings back the box drawn by hand', async () => {
    expectSameRect(await cropRect(page), dragged);
  });
});

test('CRP-16.2 Reset crop keeps the preset in use [phone]', async ({
  page,
  check,
}, testInfo) => {
  test.fail(true, 'BUG-100');
  const hand = await startOnCrop(page, testInfo);
  await hand.tap(presetChip(page, '4:5'));
  const fitted = await cropRect(page);
  await dragBox(page, hand, DRAG_PX, DRAG_PX);
  await resetCrop(page, hand);
  await check('4:5 is still chosen, and the box is back around the card at 4:5', async () => {
    expect(await selectedChips(page)).toEqual(['4:5']);
    expectSameRect(await cropRect(page), fitted);
  });
});

test('CRP-16.3 In a front and back pair, Reset crop keeps 5:7 card [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnCrop(page, testInfo, { photo: PAIR_FRONT });
  await addBack(page, hand, PAIR_BACK);
  await goToStep(page, 'crop', hand);
  const fitted = await cropRect(page);
  await dragBox(page, hand, DRAG_PX, 0);
  await resetCrop(page, hand);
  await check('5:7 card is still the chosen preset and the only one live; the box is back '
    + 'around the card at 5:7', async () => {
    expect(await selectedChips(page)).toEqual(['5:7 card']);
    await expect(presetChip(page, '5:7 card')).toBeEnabled();
    await expect(presetChip(page, '1:1')).toBeDisabled();
    expectSameRect(await cropRect(page), fitted);
  });
});

test('CRP-17.1 The next photo starts with the last preset used [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnCrop(page, testInfo);
  await hand.tap(presetChip(page, '4:5'));
  await openPhoto(page, SECOND_PHOTO);
  await goToStep(page, 'crop', hand);
  await check('IMG_9075.JPEG opens with 4:5 chosen', async () => {
    expect(await selectedChips(page)).toEqual(['4:5']);
    expectNear(ratioOf(await cropRect(page)), PORTRAIT_4_5, RATIO_TOLERANCE);
  });
});

test('CRP-17.2 The last preset is remembered after a reload [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startOnCrop(page, testInfo);
  await hand.tap(presetChip(page, '4:5'));
  await check('4:5 is chosen', async () => {
    expect(await selectedChips(page)).toEqual(['4:5']);
  });
  await reloadToStart(page);
  await openPhoto(page, SECOND_PHOTO);
  await goToStep(page, 'crop', hand);
  await check('after a reload, IMG_9075.JPEG opens with 4:5 chosen', async () => {
    expect(await selectedChips(page)).toEqual(['4:5']);
  });
});

test('CRP-17.3 Reset crop leaves the remembered preset as it was [phone]', async ({
  page,
  check,
}, testInfo) => {
  test.fail(true, 'BUG-100');
  const hand = await startOnCrop(page, testInfo);
  await hand.tap(presetChip(page, '4:5'));
  await resetCrop(page, hand);
  await openPhoto(page, SECOND_PHOTO);
  await goToStep(page, 'crop', hand);
  await check('IMG_9075.JPEG opens with 4:5 chosen', async () => {
    expect(await selectedChips(page)).toEqual(['4:5']);
  });
});
