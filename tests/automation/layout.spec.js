// The layout cases (tests/catalog/layout.md): the switch between the phone and wide layouts, the
// fixed heights on the phone, the side panel on a wide screen, the safe areas and the browser's
// bars as far as a script can see them, touch target sizes, what covers the photo, the step
// tabs on a small phone, Export's options, reduced motion, the brand look, turning the phone,
// sideways scrolling and cut-off labels.
// Each test drives the app as a person would, through hand.tap and hand.drag (a finger on the
// phone targets, the mouse on the wide ones), and reads the app's state and the page's
// measurements only to check a result.
// LAY-04.1, LAY-05.1, LAY-12.1, LAY-13.1 and LAY-14.2 need a real iPhone, so they have no test.
'use strict';
const { test, expect } = require('./support/case.js');
const {
  goToStep,
  middleOf,
  openOptions,
  closeOptions,
  saveByDownload,
  waitForStill,
  hasWhiteFill,
} = require('./support/app.js');
const { pinchAt } = require('./support/perspective.js');
const {
  startWith,
  smallTargets,
  overThePhoto,
  cutOffLabels,
  sidewaysScrollPx,
  partHeights,
  stepTabsPlace,
} = require('./support/security-layout-speed.js');

// The six steps, in order.
const STEPS = ['perspective', 'rotate', 'crop', 'levels', 'overlay', 'export'];
// The phone layout's fixed heights, in CSS px (css/app.css: --top-bar-height and the rest).
const PHONE_TOP_BAR_PX = 48;
const CONTROLS_PX = 200;
const TABS_PX = 52;
// The wide layout's top bar and side panel, in CSS px.
const WIDE_TOP_BAR_PX = 56;
const SIDE_PANEL_PX = 380;
// The widest window that gets the phone layout, in CSS px.
const PHONE_MAX_WIDTH = 760;
// The window sizes the cases switch between.
const PHONE_SIZE = { width: 390, height: 844 };
const WIDE_SIZE = { width: 1280, height: 800 };
const LANDSCAPE_PHONE = { width: 844, height: 390 };
// A phone window with Safari's bars showing, in CSS px: shorter than the full screen.
const BARS_SHOWN_HEIGHT = 700;
// The grabber's target: 88 × 44 CSS px.
const GRABBER_WIDTH_PX = 88;
const GRABBER_HEIGHT_PX = 44;
// The step tabs' label size on a narrow phone, in CSS px.
const SMALL_LABEL_PX = '11px';
// The brand's red, as the browser reports a color.
const BRAND_RED = 'rgb(229, 50, 45)';
// The page's dark color, which the browser's own bar takes (the theme-color meta).
const THEME_COLOR = '#161618';
// How far into a slide a sheet is looked at, in ms: well inside a 280 ms slide.
const MID_SLIDE_MS = 60;

// Opens each step in turn by its tab and runs `look(step)` on it. Returns what each look
// returned, by step.
async function onEveryStep(page, hand, look) {
  const seen = {};
  for (const step of STEPS) {
    await goToStep(page, step, hand);
    await waitForStill(page);
    seen[step] = await look(step);
  }
  return seen;
}

// The steps whose list is not empty, with their lists.
const nonEmpty = seen => Object.fromEntries(
  Object.entries(seen).filter(([, list]) => list.length),
);

// Waits until the layout has followed a window size: the step tabs are where the width says.
async function resizeTo(page, size) {
  await page.setViewportSize(size);
  const place = size.width <= PHONE_MAX_WIDTH ? 'bottom' : 'top bar';
  await page.waitForFunction(wanted => {
    const tabs = document.querySelector('.tab-bar');
    return (tabs.closest('#topBarSteps') ? 'top bar' : 'bottom') === wanted;
  }, place);
  await waitForStill(page);
}

// Whether a step's options are shown: open (a phone's sheet up, or listed in the side panel).
function areOptionsShown(page, step) {
  return page.evaluate(id => {
    const layer = document.getElementById(id);
    return !layer.hidden && window.CF.isSheetOpen(layer);
  }, `${step}Sheet`);
}

// The view's zoom and whether it is the fitted one.
function viewNow(page) {
  return page.evaluate(() => {
    const view = window.CF.currentView();
    return { zoom: view.zoom, isFitted: view.auto !== false };
  });
}

/* ---------------- LAY-01 The layout follows the window's width ---------------- */

test('LAY-01.1 760 px and narrower is the phone layout, wider the wide one [desktop] [webkit]',
  async ({ page, check }, testInfo) => {
    await startWith(page, testInfo);
    await resizeTo(page, { width: PHONE_MAX_WIDTH, height: WIDE_SIZE.height });
    await check('at 760 px: the step tabs are a row along the bottom', async () => {
      expect(await stepTabsPlace(page)).toBe('bottom');
      const heights = await partHeights(page);
      expect(heights.tabs).toBe(TABS_PX);
    });
    await resizeTo(page, { width: PHONE_MAX_WIDTH + 1, height: WIDE_SIZE.height });
    await check('at 761 px: the step tabs are in the top bar and the side panel is 380 px',
      async () => {
        expect(await stepTabsPlace(page)).toBe('top bar');
        const panel = await page.locator('#panel').boundingBox();
        expect(panel.width).toBe(SIDE_PANEL_PX);
      });
  });

test('LAY-01.2 Going wide lists the options in the panel; going narrow closes the sheets '
  + '[desktop]', async ({ page, check }, testInfo) => {
  await page.setViewportSize(PHONE_SIZE);
  const hand = await startWith(page, testInfo);
  await goToStep(page, 'rotate', hand);
  await openOptions(page, hand, 'rotate');
  await check('on the phone layout, Rotate options open as a sheet', async () => {
    expect(await areOptionsShown(page, 'rotate')).toBe(true);
  });
  await resizeTo(page, WIDE_SIZE);
  await check('wide: every step\'s options are shown in the side panel, Rotate\'s among them',
    async () => {
      for (const step of STEPS) expect(await areOptionsShown(page, step), step).toBe(true);
      await expect(page.locator('#rotateGrid')).toBeVisible();
    });
  await resizeTo(page, PHONE_SIZE);
  await check('narrow again: no options sheet is open', async () => {
    for (const step of STEPS) expect(await areOptionsShown(page, step), step).toBe(false);
  });
});

test('LAY-01.3 A phone turned sideways, 844 px wide, gets the wide layout [desktop]', async ({
  page,
  check,
}, testInfo) => {
  await page.setViewportSize(LANDSCAPE_PHONE);
  await startWith(page, testInfo);
  await check('at 844 × 390 the step tabs are in the top bar, with the 380 px side panel',
    async () => {
      expect(await stepTabsPlace(page)).toBe('top bar');
      expect((await page.locator('#panel').boundingBox()).width).toBe(SIDE_PANEL_PX);
    });
});

/* ---------------- LAY-02 Phone: fixed heights ---------------- */

test('LAY-02.1 The phone\'s parts keep their heights on every step [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startWith(page, testInfo);
  const seen = await onEveryStep(page, hand, () => partHeights(page));
  const photoHeight = PHONE_SIZE.height - PHONE_TOP_BAR_PX - CONTROLS_PX - TABS_PX;
  await check(`on all six steps: top bar 48 px, photo ${photoHeight} px, controls 200 px, step `
    + 'tabs 52 px', async () => {
    for (const [step, heights] of Object.entries(seen)) {
      expect(heights, step).toEqual({
        topBar: PHONE_TOP_BAR_PX,
        photo: photoHeight,
        controls: CONTROLS_PX,
        tabs: TABS_PX,
        app: PHONE_SIZE.height,
      });
    }
  });
});

/* ---------------- LAY-03 Wide: the photo beside a side panel ---------------- */

test('LAY-03.1 The side panel is 380 px and its content as wide on every step [desktop] '
  + '[webkit]', async ({ page, check }, testInfo) => {
  const hand = await startWith(page, testInfo);
  const seen = await onEveryStep(page, hand, () => page.evaluate(() => {
    const panel = document.getElementById('panel');
    const section = panel.querySelector('section.active');
    return {
      panel: Math.round(panel.getBoundingClientRect().width),
      content: Math.round(section.getBoundingClientRect().width),
      scrolls: panel.scrollHeight > panel.clientHeight,
      topBar: Math.round(document.querySelector('.top-bar').getBoundingClientRect().height),
    };
  }));
  await check('the top bar is 56 px and holds the step tabs', async () => {
    expect(await stepTabsPlace(page)).toBe('top bar');
    expect(Object.values(seen).map(look => look.topBar)).toEqual(STEPS.map(() => WIDE_TOP_BAR_PX));
  });
  await check('the panel is 380 px on every step, and its content one width on all six',
    async () => {
      const widths = Object.values(seen).map(look => look.content);
      expect(Object.values(seen).map(look => look.panel)).toEqual(STEPS.map(() => SIDE_PANEL_PX));
      expect(new Set(widths).size, `content widths ${widths.join(', ')}`).toBe(1);
    });
  await check('the panel scrolls on at least one step, where its content is taller', async () => {
    expect(Object.values(seen).some(look => look.scrolls)).toBe(true);
  });
});

test('LAY-03.2 The top bar\'s right-hand buttons come in a different order on each layout '
  + '[both]', async ({ page, check }, testInfo) => {
  const isPhone = testInfo.project.name.includes('phone');
  await startWith(page, testInfo);
  if (isPhone) {
    const view = await page.locator('#view').boundingBox();
    await pinchAt(page, { x: view.x + view.width / 2, y: view.y + view.height / 2 }, 60, 180);
    await page.locator('#btnFit').waitFor({ state: 'visible' });
  }
  const order = await page.evaluate(() => ['btnFit', 'btnUndo', 'btnRedo']
    .map(id => ({ id, left: document.getElementById(id).getBoundingClientRect().left }))
    .sort((first, second) => first.left - second.left)
    .map(button => button.id));
  const expected = isPhone ? ['btnFit', 'btnUndo', 'btnRedo'] : ['btnUndo', 'btnRedo', 'btnFit'];
  const words = isPhone ? 'Fit to screen, Undo, Redo' : 'Undo, Redo, Fit to screen';
  await check(`from left to right: ${words}`, async () => {
    expect(order).toEqual(expected);
  });
});

/* ---------------- LAY-04 Space kept clear of the iPhone's corners and notch ---------------- */

test('LAY-04.2 The page is laid out under the whole screen, with no padding where there are '
  + 'no unsafe edges [phone] [webkit]', async ({ page, check }, testInfo) => {
  await startWith(page, testInfo);
  const layout = await page.evaluate(() => {
    const viewport = document.querySelector('meta[name="viewport"]').content;
    const app = getComputedStyle(document.getElementById('app'));
    const box = document.getElementById('app').getBoundingClientRect();
    return {
      coversScreen: /viewport-fit=cover/.test(viewport),
      padding: [app.paddingTop, app.paddingRight, app.paddingBottom, app.paddingLeft],
      box: [box.left, box.top, box.width, box.height],
    };
  });
  await check('the page asks to cover the whole screen, notch included', async () => {
    expect(layout.coversScreen).toBe(true);
  });
  await check('with no unsafe edges, the app has no padding and fills the window', async () => {
    expect(layout.padding).toEqual(['0px', '0px', '0px', '0px']);
    expect(layout.box).toEqual([0, 0, PHONE_SIZE.width, PHONE_SIZE.height]);
  });
});

/* ---------------- LAY-05 The app fills the screen as Safari's bars come and go ---------- */

test('LAY-05.2 The app fills the window as its height changes, and the page never scrolls '
  + '[phone] [webkit]', async ({ page, check }, testInfo) => {
  await startWith(page, testInfo);
  const fill = () => page.evaluate(() => {
    const box = document.getElementById('app').getBoundingClientRect();
    const root = document.documentElement;
    return {
      app: [box.top, box.height],
      window: innerHeight,
      scrollsDown: root.scrollHeight - innerHeight,
    };
  });
  const full = await fill();
  await page.setViewportSize({ width: PHONE_SIZE.width, height: BARS_SHOWN_HEIGHT });
  await page.waitForFunction(height => {
    const box = document.getElementById('app').getBoundingClientRect();
    return Math.round(box.height) === height;
  }, BARS_SHOWN_HEIGHT);
  const shorter = await fill();
  await check('the app fills the window exactly at 844 px tall and at 700 px tall', async () => {
    expect(full.app).toEqual([0, PHONE_SIZE.height]);
    expect(shorter.app).toEqual([0, BARS_SHOWN_HEIGHT]);
  });
  await check('at both heights the page has nothing to scroll', async () => {
    expect([full.scrollsDown, shorter.scrollsDown]).toEqual([0, 0]);
  });
});

/* ---------------- LAY-06 Every touch control is at least 44 px ---------------- */

test('LAY-06.1 Every control on every step and in every options sheet is at least 44 px '
  + '[phone] [webkit]', async ({ page, check }, testInfo) => {
  const hand = await startWith(page, testInfo);
  const onScreen = await onEveryStep(page, hand, () => smallTargets(page));
  await check('on the six steps no control under 44 × 44 px', async () => {
    expect(nonEmpty(onScreen)).toEqual({});
  });
  const inSheets = {};
  for (const step of STEPS) {
    await goToStep(page, step, hand);
    await openOptions(page, hand, step);
    await waitForStill(page);
    inSheets[step] = await smallTargets(page, `#${step}Sheet`);
    await closeOptions(page, hand, step);
  }
  await check('in the six options sheets no control under 44 × 44 px', async () => {
    expect(nonEmpty(inSheets)).toEqual({});
  });
});

test('LAY-06.2 The tab that opens the options takes a touch 88 × 44 px [phone] [webkit]',
  async ({ page, check }, testInfo) => {
    const hand = await startWith(page, testInfo);
    const seen = await onEveryStep(page, hand, step => page.evaluate(id => {
      const grabber = document.getElementById(id);
      const box = grabber.getBoundingClientRect();
      // In each 1 px column across the target, how many CSS px a touch lands on it, from well
      // above its tab to well inside the controls (a strip above the tab counts too).
      const heights = [];
      for (let x = Math.ceil(box.left); x < box.right; x++) {
        let height = 0;
        for (let y = Math.floor(box.top) - 40; y < box.bottom + 20; y++) {
          const found = document.elementFromPoint(x + 0.5, y + 0.5);
          if (found && grabber.contains(found)) height++;
        }
        heights.push(height);
      }
      return { columns: heights.length, shortest: Math.min(...heights) };
    }, `${step}AreaGrabber`));
    await check('on all six steps the tab takes touches over 88 px across, each column at '
      + 'least 44 px tall', async () => {
      for (const [step, strip] of Object.entries(seen)) {
        expect(strip.columns, step).toBe(GRABBER_WIDTH_PX);
        expect(strip.shortest, step).toBeGreaterThanOrEqual(GRABBER_HEIGHT_PX);
      }
    });
  });

/* ---------------- LAY-07 Nothing covers the photo unless you asked for it ---------------- */

test('LAY-07.1 Nothing covers the photo on any step [both]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startWith(page, testInfo);
  const seen = await onEveryStep(page, hand, () => overThePhoto(page));
  await check('on all six steps nothing lies over the photo but its own tab', async () => {
    expect(nonEmpty(seen)).toEqual({});
  });
});

test('LAY-07.2 A message over the photo lets touches through [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startWith(page, testInfo);
  await goToStep(page, 'export', hand);
  await saveByDownload(page, hand, 'No');
  const toast = page.locator('#toast');
  await expect(toast).toHaveClass(/is-shown/);
  const middle = await middleOf(toast.locator('.toast-text'));
  await check('a message "Exported …" shows over the photo\'s bottom edge', async () => {
    await expect(toast).toContainText('Exported ');
  });
  const under = await page.evaluate(point => {
    const found = document.elementFromPoint(point.x, point.y);
    return found ? found.id || found.className : '';
  }, middle);
  await check('a touch on the message lands on the photo under it', async () => {
    expect(under).toBe('view');
  });
});

/* ---------------- LAY-08 The six step tabs fit on a small phone ---------------- */

test('LAY-08.1 On a 375 px phone the six step tabs fit one row at 11 px [small]', async ({
  page,
  check,
}, testInfo) => {
  await startWith(page, testInfo);
  const tabs = await page.locator('.step-tab').evaluateAll(elements => elements.map(tab => {
    const label = tab.querySelector('.step-tab-label');
    const box = tab.getBoundingClientRect();
    return {
      top: Math.round(box.top),
      right: box.right,
      fontSize: getComputedStyle(label).fontSize,
      isCut: label.scrollWidth > label.clientWidth,
    };
  }));
  await check('six tabs on one row, inside the 375 px window', async () => {
    expect(tabs).toHaveLength(STEPS.length);
    expect(new Set(tabs.map(tab => tab.top)).size).toBe(1);
    expect(Math.max(...tabs.map(tab => tab.right))).toBeLessThanOrEqual(375);
  });
  await check('every label is 11 px and none is cut', async () => {
    expect(tabs.map(tab => tab.fontSize)).toEqual(STEPS.map(() => SMALL_LABEL_PX));
    expect(tabs.filter(tab => tab.isCut)).toEqual([]);
  });
});

/* ---------------- LAY-09 Export's options fit without scrolling ---------------- */

test('LAY-09.1 Export options show down to Tips without scrolling [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startWith(page, testInfo);
  await goToStep(page, 'export', hand);
  await openOptions(page, hand, 'export');
  await waitForStill(page);
  const fit = await page.evaluate(() => {
    const body = document.querySelector('#exportSheet .sheet-body');
    const tips = document.getElementById('exportTips').getBoundingClientRect();
    const bodyBox = body.getBoundingClientRect();
    return {
      overflowPx: body.scrollHeight - body.clientHeight,
      isTipsInside: tips.top >= bodyBox.top && tips.bottom <= bodyBox.bottom + 0.5,
    };
  });
  await check('the Tips row shows whole, and the sheet has nothing to scroll', async () => {
    expect(fit.isTipsInside).toBe(true);
    expect(fit.overflowPx).toBeLessThanOrEqual(0);
  });
});

/* ---------------- LAY-10 Reduced motion ---------------- */

// Where a sheet is a moment after its grabber is tapped: its offset down from its resting
// place, in CSS px (0 at rest).
async function sheetOffsetMidSlide(page, hand, step) {
  await hand.tap(page.locator(`#${step}AreaGrabber`));
  await page.waitForTimeout(MID_SLIDE_MS);
  return page.evaluate(id => {
    const sheet = document.querySelector(`#${id} .sheet`);
    return Math.round(new DOMMatrix(getComputedStyle(sheet).transform).m42);
  }, `${step}Sheet`);
}

test('LAY-10.1 Under reduced motion a sheet jumps to its place and the pill doesn\'t slide '
  + '[phone]', async ({ page, check }, testInfo) => {
  const hand = await startWith(page, testInfo);
  await goToStep(page, 'rotate', hand);
  await waitForStill(page);
  const slidingOffset = await sheetOffsetMidSlide(page, hand, 'rotate');
  await check('with motion: 60 ms after the tap, the sheet is still sliding up', async () => {
    expect(slidingOffset).toBeGreaterThan(0);
  });
  await closeOptions(page, hand, 'rotate');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const reducedOffset = await sheetOffsetMidSlide(page, hand, 'rotate');
  await check('with reduced motion: 60 ms after the tap, the sheet is already in its place',
    async () => {
      expect(reducedOffset).toBe(0);
    });
  const still = await page.evaluate(() => {
    const thumb = document.querySelector('.segment-thumb');
    const pointer = document.querySelector('.ruler-pointer');
    return {
      thumb: thumb ? getComputedStyle(thumb).transitionProperty : 'none',
      pointer: getComputedStyle(pointer).transitionProperty,
    };
  });
  await check('the two-part switches\' pill and the ruler\'s pointer change only by fading',
    async () => {
      expect(['none', 'opacity']).toContain(still.thumb);
      expect(['none', 'opacity']).toContain(still.pointer);
    });
});

/* ---------------- LAY-11 The brand look ---------------- */

test('LAY-11.1 The brand look, for a person to judge [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startWith(page, testInfo);
  await goToStep(page, 'export', hand);
  await waitForStill(page);
  await check.eye('Export on the phone: matte black and white; Download red; the selected Size '
    + '(2000) and Format (JPEG) solid white; no gradients, no amber, no italics, no F1 marks');
  await goToStep(page, 'crop', hand);
  await waitForStill(page);
  await check.eye('Crop on the phone: the selected preset (1:1) a solid white chip; every other '
    + 'control dark gray with white text; nothing red but a main action');
});

test('LAY-11.2 No gradient anywhere, Download red and the selected size white [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startWith(page, testInfo);
  await goToStep(page, 'export', hand);
  // The saved logo's thumbnail sits on a checkerboard (to show see-through parts), drawn with
  // a hard-edged conic gradient that shows as flat squares: the one gradient in the stylesheet.
  const gradients = await page.evaluate(() => [...document.querySelectorAll('*')]
    .filter(element => /gradient/.test(getComputedStyle(element).backgroundImage))
    .map(element => element.id || element.className)
    .filter(name => name !== 'overlayThumb'));
  await check('no element has a gradient, but for the checkerboard behind the saved logo',
    async () => {
      expect(gradients).toEqual([]);
    });
  await check('Download is the brand\'s red, and the selected Size is a solid white fill',
    async () => {
      const red = await page.locator('#btnDownload')
        .evaluate(element => getComputedStyle(element).backgroundColor);
      expect(red).toBe(BRAND_RED);
      expect(await hasWhiteFill(page.locator('#exportSize .segment[aria-pressed="true"]')))
        .toBe(true);
    });
});

/* ---------------- LAY-13 Safari's toolbar keeps its dark color ---------------- */

test('LAY-13.2 An open sheet is placed against the app, never fixed to the screen [phone] '
  + '[webkit]', async ({ page, check }, testInfo) => {
  const hand = await startWith(page, testInfo);
  const positions = {};
  for (const step of STEPS) {
    await goToStep(page, step, hand);
    await openOptions(page, hand, step);
    positions[step] = await page.locator(`#${step}Sheet`)
      .evaluate(element => getComputedStyle(element).position);
    await closeOptions(page, hand, step);
  }
  await hand.tap(page.locator('#btnCornerShots'));
  positions.cornerShots = await page.locator('#cornerShotsSheet')
    .evaluate(element => getComputedStyle(element).position);
  await check('every options sheet and the Corner shots sheet is placed absolutely, not fixed',
    async () => {
      expect(Object.values(positions)).toEqual(Object.keys(positions).map(() => 'absolute'));
    });
  await check(`the browser's color is the page's dark ${THEME_COLOR}`, async () => {
    const color = await page.locator('meta[name="theme-color"]').getAttribute('content');
    expect(color).toBe(THEME_COLOR);
  });
});

/* ---------------- LAY-14 Turning the phone and back restores the layout ---------------- */

test('LAY-14.1 Sideways and back, the layout is as it was [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startWith(page, testInfo);
  await goToStep(page, 'rotate', hand);
  await waitForStill(page);
  const before = { heights: await partHeights(page), view: await viewNow(page) };
  await resizeTo(page, LANDSCAPE_PHONE);
  await check('sideways (844 × 390): the wide layout, step tabs in the top bar', async () => {
    expect(await stepTabsPlace(page)).toBe('top bar');
  });
  await resizeTo(page, PHONE_SIZE);
  await page.waitForFunction(() => window.CF.currentView().auto !== false);
  const after = { heights: await partHeights(page), view: await viewNow(page) };
  await check('upright again: the same heights, the step tabs along the bottom, the photo '
    + 'fitted as before', async () => {
    expect(await stepTabsPlace(page)).toBe('bottom');
    expect(after.heights).toEqual(before.heights);
    expect(after.view.isFitted).toBe(true);
    expect(after.view.zoom).toBeCloseTo(before.view.zoom, 6);
  });
});

/* ---------------- LAY-15 The page never scrolls sideways ---------------- */

// The body of LAY-15.1 and LAY-15.2: no sideways scroll on any step, and on the phone the
// crop presets' row scrolls inside itself.
async function noSidewaysScroll(page, check, testInfo) {
  const hand = await startWith(page, testInfo);
  const seen = await onEveryStep(page, hand, () => sidewaysScrollPx(page));
  await check('on all six steps the page doesn\'t scroll sideways', async () => {
    expect(Object.values(seen).filter(overflow => overflow > 0)).toEqual([]);
  });
  if (!testInfo.project.name.includes('desktop')) {
    await goToStep(page, 'crop', hand);
    await check('the row of crop presets is wider than the screen and scrolls inside itself',
      async () => {
        const row = await page.locator('#cropPresets').evaluate(element => ({
          content: element.scrollWidth,
          shown: element.clientWidth,
          style: getComputedStyle(element).overflowX,
        }));
        expect(row.content).toBeGreaterThan(row.shown);
        expect(row.style).toBe('auto');
        expect(await sidewaysScrollPx(page)).toBeLessThanOrEqual(0);
      });
  }
}

test('LAY-15.1 No step scrolls the page sideways [both] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  await noSidewaysScroll(page, check, testInfo);
});

test('LAY-15.2 No step scrolls the page sideways on a 375 px phone [small]', async ({
  page,
  check,
}, testInfo) => {
  await noSidewaysScroll(page, check, testInfo);
});

/* ---------------- LAY-16 No button label is cut off ---------------- */

// The body of LAY-16.1 and LAY-16.2: no label cut off on any step.
async function noCutLabels(page, check, testInfo) {
  const hand = await startWith(page, testInfo);
  const seen = await onEveryStep(page, hand, () => cutOffLabels(page));
  await check('on all six steps no button\'s label is cut off', async () => {
    expect(nonEmpty(seen)).toEqual({});
  });
}

test('LAY-16.1 No button label is cut off on any step [both] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  await noCutLabels(page, check, testInfo);
});

test('LAY-16.2 No button label is cut off on a 375 px phone [small]', async ({
  page,
  check,
}, testInfo) => {
  await noCutLabels(page, check, testInfo);
});
