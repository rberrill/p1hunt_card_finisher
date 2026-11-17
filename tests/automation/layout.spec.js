// The layout cases (tests/catalog/layout.md): the switch between the phone and wide layouts, the
// fixed heights on the phone, the side panel on a wide screen, the safe areas and the browser's
// bars as far as a script can see them, touch target sizes, what covers the photo, the step
// tabs on a small phone, Export's options, reduced motion, the brand's colors, turning the
// phone, sideways scrolling and cut-off labels.
// Each test drives the app as a person would, through hand.tap (a finger on the phone targets,
// the mouse on the wide ones) and, where the browser itself must take the touch (a held
// ruler or slider, a swipe on the row of presets), through Chromium's own touch input. It reads
// the app's state and the page's measurements only to check a result.
// LAY-04.1, LAY-05.1, LAY-12.1, LAY-13.1 and LAY-14.2 need a real iPhone, so they have no test.
'use strict';
const { test, expect } = require('./support/case.js');
const {
  goToStep,
  openOptions,
  closeOptions,
  waitForStill,
  hasWhiteFill,
} = require('./support/app.js');
const {
  startWith,
  smallTargets,
  overThePhoto,
  cutOffLabels,
  sidewaysScrollPx,
  partHeights,
  stepTabsPlace,
  tapDownload,
  answerForFile,
} = require('./support/security-layout-speed.js');
const { makePair, sideButton } = require('./support/front-and-back.js');
const { swipePresetRow, rowScroll } = require('./support/crop.js');
const {
  holdFinger,
  recordSheetFrames,
  recordPillFrames,
  framesRecorded,
  pillSlides,
  isBetween,
  knobMiddle,
  knobHeightPx,
  screenDifference,
  recordProgress,
  progressRecorded,
} = require('./support/layout.js');

// The six steps, in order, and their names on the step tabs.
const STEPS = ['perspective', 'rotate', 'crop', 'levels', 'overlay', 'export'];
const STEP_NAMES = {
  perspective: 'Perspective',
  rotate: 'Rotate',
  crop: 'Crop',
  levels: 'Levels',
  overlay: 'Overlay',
  export: 'Export',
};
// Each step's options sheet's title, as the screen shows it (in capitals).
const SHEET_TITLES = {
  perspective: 'PERSPECTIVE OPTIONS',
  rotate: 'ROTATE OPTIONS',
  crop: 'CROP OPTIONS',
  levels: 'LEVELS TIPS',
  overlay: 'OVERLAY OPTIONS',
  export: 'EXPORT OPTIONS',
};
// The phone layout's fixed heights, in CSS px (css/app.css: --top-bar-height and the rest).
const PHONE_TOP_BAR_PX = 48;
const CONTROLS_PX = 200;
const TABS_PX = 52;
// The wide layout's top bar and side panel, and the panel's content in Chrome (the panel less
// the room it keeps for its scroll bar; WebKit keeps none), in CSS px.
const WIDE_TOP_BAR_PX = 56;
const SIDE_PANEL_PX = 380;
const PANEL_CONTENT_PX = 369;
// The steps whose side panel scrolls at 1280 × 800 (their options are taller than the window).
const SCROLLING_PANELS = ['perspective', 'export'];
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
// The step tabs' label size on a narrow phone, in CSS px, and that window's width.
const SMALL_LABEL_PX = '11px';
const SMALL_WIDTH_PX = 375;
// The brand's red, as the browser reports a color.
const BRAND_RED = 'rgb(229, 50, 45)';
// The page's dark color, which the browser's own bar takes (the theme-color meta).
const THEME_COLOR = '#161618';
// The Straighten ruler's pointer at rest and held, in CSS px (css/app.css, the ruler part).
const POINTER_REST_PX = 28;
const POINTER_HELD_PX = 36;
// A slider's knob at rest and held, across, in CSS px (css/app.css, the slider part), and how
// far a knob measured from a screenshot may be from it (anti-aliased edges).
const KNOB_REST_PX = 22;
const KNOB_HELD_PX = 30;
const KNOB_TOLERANCE_PX = 1.5;
// How long a held or lifted finger waits before the pointer or knob is measured, in ms: past
// its 100 ms growth or shrink (the knob's isn't one the page can wait on: the browser draws it).
const HOLD_SETTLE_MS = 300;
// A link that makes the export work in small bands of rows (the lowest the link may set), so
// its progress line takes many steps; and how many steps between 0 and 1 count as moving.
const SMALL_BANDS_LINK = 'index.html?export.bandPx=65536';
const PROGRESS_STEPS_MIN = 3;
// The share of the screen's pixels that may differ before a screen counts as changed (a
// thousandth: a redraw's stray anti-aliased pixels, never a control or a sheet).
const SCREEN_CHANGE_MAX = 0.001;
// Export's progress line on the control area (js/app/export.js draws on it).
const EXPORT_PROGRESS_ID = 'exportAreaProgress';

// Starts on the Perspective step, where the photo opens, and visits each step in `steps` in
// turn: Perspective as it is, every other by tapping its tab. Runs `visit(step)` on each, at
// rest.
async function onEveryStep(page, hand, visit, steps = STEPS) {
  for (const step of steps) {
    if (step !== 'perspective') await goToStep(page, step, hand);
    await waitForStill(page);
    await visit(step);
  }
}

// What a row's check says for a step: the first row looks at Perspective as the case starts;
// every other row taps a step tab first.
function rowFor(step, result) {
  return step === 'perspective' ? result : `after tapping ${STEP_NAMES[step]}: ${result}`;
}

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

// The page's spare height and width, in CSS px: how much taller and wider it is than the
// window (0 when it has nothing to scroll).
function spareSize(page) {
  return page.evaluate(() => ({
    height: document.documentElement.scrollHeight - innerHeight,
    width: document.documentElement.scrollWidth - innerWidth,
  }));
}

// The whole screen as a picture, to tell whether anything on it changed.
function screenNow(page) {
  return page.screenshot();
}

/* ---------------- LAY-01 The layout follows the window's width ---------------- */

test('LAY-01.1 760 px and narrower is the phone layout, wider the wide one [desktop] [webkit]',
  async ({ page, check }, testInfo) => {
    await startWith(page, testInfo);
    await resizeTo(page, { width: PHONE_MAX_WIDTH, height: WIDE_SIZE.height });
    await check('at 760 px: the step tabs are a 52 px row along the bottom', async () => {
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
  await check('ROTATE OPTIONS rise as a sheet over the photo', async () => {
    expect(await areOptionsShown(page, 'rotate')).toBe(true);
    expect(await stepTabsPlace(page)).toBe('bottom');
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
  const photoHeight = PHONE_SIZE.height - PHONE_TOP_BAR_PX - CONTROLS_PX - TABS_PX;
  const expected = {
    topBar: PHONE_TOP_BAR_PX,
    photo: photoHeight,
    controls: CONTROLS_PX,
    tabs: TABS_PX,
    app: PHONE_SIZE.height,
  };
  await onEveryStep(page, hand, async step => {
    const result = step === 'perspective'
      ? `top bar 48 px, photo ${photoHeight} px, controls 200 px, step tabs 52 px: 844 px in all`
      : `the same four heights: 48, ${photoHeight}, 200 and 52 px`;
    await check(rowFor(step, result), async () => {
      expect(await partHeights(page)).toEqual(expected);
    });
  });
});

/* ---------------- LAY-03 Wide: the photo beside a side panel ---------------- */

// The side panel now: its width, its content's width and whether it scrolls.
function sidePanel(page) {
  return page.evaluate(() => {
    const panel = document.getElementById('panel');
    const section = panel.querySelector('section.active');
    return {
      width: Math.round(panel.getBoundingClientRect().width),
      content: Math.round(section.getBoundingClientRect().width),
      scrolls: panel.scrollHeight > panel.clientHeight,
    };
  });
}

test('LAY-03.1 The side panel is 380 px and its content as wide on every step [desktop] '
  + '[webkit]', async ({ page, check }, testInfo) => {
  const hand = await startWith(page, testInfo);
  await check('the top bar is 56 px tall, with the step tabs in it', async () => {
    expect(await stepTabsPlace(page)).toBe('top bar');
    const topBar = await page.locator('.top-bar').boundingBox();
    expect(Math.round(topBar.height)).toBe(WIDE_TOP_BAR_PX);
  });
  const firstPanel = await sidePanel(page);
  await onEveryStep(page, hand, async step => {
    const scrolls = SCROLLING_PANELS.includes(step);
    const content = step === 'perspective'
      ? 'its content 369 px in Chrome (the room kept for the scroll bar differs by browser)'
      : 'its content as wide as on Perspective';
    const scrolling = scrolls ? 'scrolls' : 'doesn\'t scroll';
    const result = `the panel is 380 px wide, ${content}; the panel ${scrolling}`;
    await check(rowFor(step, result), async () => {
      expect(await sidePanel(page)).toEqual({
        width: SIDE_PANEL_PX,
        content: firstPanel.content,
        scrolls,
      });
      if (testInfo.project.name.startsWith('chromium')) {
        expect(firstPanel.content).toBe(PANEL_CONTENT_PX);
      }
    });
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
  await check('the viewport setting holds viewport-fit=cover: the page is laid out under the '
    + 'whole screen', async () => {
    expect(layout.coversScreen).toBe(true);
  });
  await check('the app has no padding on any side and fills the window, 390 × 844 px from its '
    + 'top-left', async () => {
    expect(layout.padding).toEqual(['0px', '0px', '0px', '0px']);
    expect(layout.box).toEqual([0, 0, PHONE_SIZE.width, PHONE_SIZE.height]);
  });
});

/* ---------------- LAY-05 The app fills the screen as Safari's bars come and go ---------- */

// Where the app is: its top and its height, in CSS px.
function appBox(page) {
  return page.evaluate(() => {
    const box = document.getElementById('app').getBoundingClientRect();
    return [box.top, box.height];
  });
}

test('LAY-05.2 The app fills the window as its height changes, and the page never scrolls '
  + '[phone] [webkit]', async ({ page, check }, testInfo) => {
  await startWith(page, testInfo);
  await check('the app fills the window from the top, 844 px tall', async () => {
    expect(await appBox(page)).toEqual([0, PHONE_SIZE.height]);
  });
  await check('the page\'s spare height is 0', async () => {
    expect((await spareSize(page)).height).toBe(0);
  });
  await page.setViewportSize({ width: PHONE_SIZE.width, height: BARS_SHOWN_HEIGHT });
  await page.waitForFunction(height => {
    const box = document.getElementById('app').getBoundingClientRect();
    return Math.round(box.height) === height;
  }, BARS_SHOWN_HEIGHT);
  await check('the app fills the window again, from the top, 700 px tall', async () => {
    expect(await appBox(page)).toEqual([0, BARS_SHOWN_HEIGHT]);
  });
  await check('the page\'s spare height is 0 at 700 px too', async () => {
    expect((await spareSize(page)).height).toBe(0);
  });
});

/* ---------------- LAY-06 Every touch control is at least 44 px ---------------- */

test('LAY-06.1 Every control on every step is at least 44 px [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startWith(page, testInfo);
  await onEveryStep(page, hand, async step => {
    await check(rowFor(step, 'every control on the screen is at least 44 × 44 px'), async () => {
      expect(await smallTargets(page)).toEqual([]);
    });
  });
});

// In each 1 px column across a step's grabber, how many CSS px a touch lands on it, from well
// above its tab to well inside the controls (a strip above the tab counts too). Returns
// { columns, shortest }.
function grabberStrip(page, step) {
  return page.evaluate(id => {
    const grabber = document.getElementById(id);
    const box = grabber.getBoundingClientRect();
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
  }, `${step}AreaGrabber`);
}

test('LAY-06.2 The tab that opens the options takes a touch 88 × 44 px [phone] [webkit]',
  async ({ page, check }, testInfo) => {
    const hand = await startWith(page, testInfo);
    await onEveryStep(page, hand, async step => {
      const result = 'the options tab takes touches over 88 px across, and at least 44 px down '
        + 'in every column';
      await check(rowFor(step, result), async () => {
        const strip = await grabberStrip(page, step);
        expect(strip.columns).toBe(GRABBER_WIDTH_PX);
        expect(strip.shortest).toBeGreaterThanOrEqual(GRABBER_HEIGHT_PX);
      });
    });
  });

test('LAY-06.3 Every control in every options sheet is at least 44 px [phone] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startWith(page, testInfo);
  for (const step of STEPS) {
    await goToStep(page, step, hand);
    await openOptions(page, hand, step);
    await waitForStill(page);
    const title = SHEET_TITLES[step];
    await check(`every control in ${title} is at least 44 × 44 px`, async () => {
      expect(await areOptionsShown(page, step)).toBe(true);
      const shown = await page.locator(`#${step}Sheet .sheet-title`).textContent();
      expect(shown.toUpperCase()).toBe(title);
      expect(await smallTargets(page, `#${step}Sheet`)).toEqual([]);
    });
    await closeOptions(page, hand, step);
  }
});

/* ---------------- LAY-07 Nothing covers the photo unless you asked for it ---------------- */

test('LAY-07.1 Nothing covers the photo on any step [both]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startWith(page, testInfo);
  await onEveryStep(page, hand, async step => {
    const result = 'nothing lies over the photo but, on a phone, the options tab';
    await check(rowFor(step, result), async () => {
      expect(await overThePhoto(page)).toEqual([]);
    });
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
    expect(Math.max(...tabs.map(tab => tab.right))).toBeLessThanOrEqual(SMALL_WIDTH_PX);
  });
  await check('every label is 11 px text and none is cut short', async () => {
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
  await check('EXPORT OPTIONS show every row down to Tips whole; nothing is cut off at the '
    + 'bottom, so the sheet has nothing to scroll', async () => {
    expect(fit.isTipsInside).toBe(true);
    expect(fit.overflowPx).toBeLessThanOrEqual(0);
  });
});

/* ---------------- LAY-10 Reduced motion ---------------- */

// Taps `control` while recording the frames of a step's sheet. Returns the frames.
async function sheetFramesAfter(page, hand, step, control) {
  await recordSheetFrames(page, step);
  await hand.tap(control);
  return framesRecorded(page);
}

test('LAY-10.1 Under reduced motion an options sheet is in its place at once [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startWith(page, testInfo);
  await goToStep(page, 'rotate', hand);
  await waitForStill(page);
  const grabber = page.locator('#rotateAreaGrabber');
  const rising = await sheetFramesAfter(page, hand, 'rotate', grabber);
  await check('ROTATE OPTIONS slide up from the bottom of the screen', async () => {
    const shown = rising.filter(frame => frame.isShown);
    expect(shown.some(frame => frame.offsetPx > 0)).toBe(true);
    expect(shown[shown.length - 1].offsetPx).toBe(0);
  });
  await waitForStill(page);
  const close = page.locator('#rotateSheet .sheet-close');
  const falling = await sheetFramesAfter(page, hand, 'rotate', close);
  await page.locator('#rotateSheet').waitFor({ state: 'hidden' });
  await check('the sheet slides down out of sight', async () => {
    expect(falling.some(frame => frame.isShown && frame.offsetPx > 0)).toBe(true);
    expect(await page.locator('#rotateSheet').isHidden()).toBe(true);
  });
  await waitForStill(page);
  const before = await screenNow(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await check('with reduced motion turned on, nothing on the screen changes', async () => {
    expect(await screenDifference(page, before, await screenNow(page)))
      .toBeLessThanOrEqual(SCREEN_CHANGE_MAX);
  });
  const reduced = await sheetFramesAfter(page, hand, 'rotate', grabber);
  await check('ROTATE OPTIONS are in their place at once, with no slide; only the dimming over '
    + 'the photo fades in', async () => {
    const shown = reduced.filter(frame => frame.isShown);
    expect(shown.map(frame => frame.offsetPx)).toEqual(shown.map(() => 0));
    const finalDimming = shown[shown.length - 1].dimming;
    expect(shown.some(frame => frame.dimming > 0 && frame.dimming < finalDimming)).toBe(true);
  });
});

test('LAY-10.2 Under reduced motion the Front and Back pill jumps [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await makePair(page, testInfo);
  await waitForStill(page);
  await recordPillFrames(page);
  await hand.tap(sideButton(page, 'front'));
  const sliding = await framesRecorded(page);
  const slides = await pillSlides(page);
  await check('the pill slides from Back to Front: the browser runs a slide across on it, and '
    + 'it ends on Front', async () => {
    expect(slides).toContain('transform');
    expect(sliding[sliding.length - 1]).toBe(0);
  });
  await page.waitForFunction(() => {
    const app = window.__straightener.app;
    return app.pair.current === 'front' && !app.isSwitching && app.detection.message === '';
  });
  await waitForStill(page);
  const before = await screenNow(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await check('with reduced motion turned on, nothing on the screen changes', async () => {
    expect(await screenDifference(page, before, await screenNow(page)))
      .toBeLessThanOrEqual(SCREEN_CHANGE_MAX);
  });
  await recordPillFrames(page);
  await hand.tap(sideButton(page, 'back'));
  const jumping = await framesRecorded(page);
  const jumps = await pillSlides(page);
  await check('the pill jumps: no slide is run on it, and in every frame it is wholly on Front '
    + 'or wholly on Back, never between', async () => {
    expect(jumps).toEqual([]);
    expect(jumping.filter(isBetween)).toEqual([]);
    expect(jumping[jumping.length - 1]).toBe(1);
  });
});

// The Straighten ruler's pointer's height on the page, in CSS px.
function pointerHeight(page) {
  return page.locator('#rotateArea .ruler-pointer').evaluate(pointer => (
    Math.round(pointer.getBoundingClientRect().height)
  ));
}

test('LAY-10.3 Under reduced motion the Straighten ruler\'s pointer doesn\'t grow when held '
  + '[phone]', async ({ page, check }, testInfo) => {
  const hand = await startWith(page, testInfo);
  await goToStep(page, 'rotate', hand);
  await waitForStill(page);
  const ruler = await page.locator('#rotateArea .ruler').boundingBox();
  const middle = { x: ruler.x + ruler.width / 2, y: ruler.y + ruler.height / 2 };
  let lift = await holdFinger(page, middle);
  await page.waitForTimeout(HOLD_SETTLE_MS);
  await check('held: the pointer grows to 36 px tall', async () => {
    expect(await pointerHeight(page)).toBe(POINTER_HELD_PX);
  });
  await lift();
  await waitForStill(page);
  await check('let go: the pointer is 28 px tall again', async () => {
    expect(await pointerHeight(page)).toBe(POINTER_REST_PX);
  });
  const before = await screenNow(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await check('with reduced motion turned on, nothing on the screen changes', async () => {
    expect(await screenDifference(page, before, await screenNow(page)))
      .toBeLessThanOrEqual(SCREEN_CHANGE_MAX);
  });
  lift = await holdFinger(page, middle);
  await page.waitForTimeout(HOLD_SETTLE_MS);
  await check('held with reduced motion: the pointer stays 28 px tall', async () => {
    expect(await page.locator('#rotateArea .ruler').getAttribute('class')).toContain('is-held');
    expect(await pointerHeight(page)).toBe(POINTER_REST_PX);
  });
  await lift();
});

test('LAY-10.4 Under reduced motion a slider\'s knob doesn\'t grow when held [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startWith(page, testInfo);
  await hand.tap(page.locator('#toolFlatten'));
  const slider = page.locator('#strength');
  await slider.waitFor({ state: 'visible' });
  await waitForStill(page);
  await check('the Flatten slider shows at 100%, its knob at the right end, 22 px across',
    async () => {
      expect(await slider.inputValue()).toBe('100');
      expect(await knobHeightPx(page, slider)).toBeCloseTo(KNOB_REST_PX, 0);
    });
  const knob = await knobMiddle(slider);
  let lift = await holdFinger(page, knob);
  await page.waitForTimeout(HOLD_SETTLE_MS);
  await check('held: the knob grows to 30 px across', async () => {
    const heightPx = await knobHeightPx(page, slider);
    expect(Math.abs(heightPx - KNOB_HELD_PX)).toBeLessThanOrEqual(KNOB_TOLERANCE_PX);
  });
  await lift();
  await page.waitForTimeout(HOLD_SETTLE_MS);
  await check('let go: the knob is 22 px across again', async () => {
    const heightPx = await knobHeightPx(page, slider);
    expect(Math.abs(heightPx - KNOB_REST_PX)).toBeLessThanOrEqual(KNOB_TOLERANCE_PX);
  });
  const before = await screenNow(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await check('with reduced motion turned on, nothing on the screen changes', async () => {
    expect(await screenDifference(page, before, await screenNow(page)))
      .toBeLessThanOrEqual(SCREEN_CHANGE_MAX);
  });
  lift = await holdFinger(page, knob);
  await page.waitForTimeout(HOLD_SETTLE_MS);
  await check('held with reduced motion: the knob stays 22 px across', async () => {
    expect(await page.locator('#perspectiveArea .slider').getAttribute('class'))
      .toContain('is-held');
    const heightPx = await knobHeightPx(page, slider);
    expect(Math.abs(heightPx - KNOB_REST_PX)).toBeLessThanOrEqual(KNOB_TOLERANCE_PX);
  });
  await lift();
});

test('LAY-10.5 Under reduced motion the export\'s progress line still moves [phone]', async ({
  page,
  check,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const hand = await startWith(page, testInfo, { address: SMALL_BANDS_LINK });
  await goToStep(page, 'export', hand);
  await waitForStill(page);
  const { question, downloading } = await tapDownload(page, hand);
  await check('the question box asks "Upscale to 2000 px?"', async () => {
    expect(question).toBe('Upscale to 2000 px?');
  });
  await recordProgress(page, EXPORT_PROGRESS_ID);
  await answerForFile(page, hand, 'Yes', downloading);
  await expect(page.locator('#toast')).toContainText('Exported 2000 × 2000 px');
  const changes = await progressRecorded(page);
  await check('a thin red line on the top edge of the controls grows from left to right in '
    + 'several steps, then goes; a message begins "Exported 2000 × 2000 px"', async () => {
    const shown = changes.filter(change => !change.isHidden).map(change => change.scale);
    const between = [...new Set(shown.filter(scale => scale > 0 && scale < 1))];
    expect(between.length).toBeGreaterThanOrEqual(PROGRESS_STEPS_MIN);
    expect(shown).toEqual([...shown].sort((first, second) => first - second));
    expect(changes[changes.length - 1].isHidden).toBe(true);
    await expect(page.locator('#toast')).toContainText('Exported 2000 × 2000 px');
  });
});

/* ---------------- LAY-11 The brand's colors ---------------- */

test('LAY-11.1 The brand\'s colors, for a person to judge [phone]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startWith(page, testInfo);
  await goToStep(page, 'export', hand);
  await waitForStill(page);
  await check.eye('Export on the phone: Download is red with white text; the chosen Size (2000) '
    + 'and Format (JPEG) are solid white with dark text; the other Size and Format choices are '
    + 'dark gray with white text; behind the photo and the controls is black');
  await goToStep(page, 'crop', hand);
  await waitForStill(page);
  await check.eye('Crop on the phone: the chosen preset (1:1) is a solid white chip with dark '
    + 'text; the other presets are dark gray chips with white text');
});

test('LAY-11.2 Download is the brand\'s red and the chosen size and format white [phone]',
  async ({ page, check }, testInfo) => {
    const hand = await startWith(page, testInfo);
    await goToStep(page, 'export', hand);
    await check('Download\'s background is the brand\'s red, #e5322d', async () => {
      const red = await page.locator('#btnDownload')
        .evaluate(element => getComputedStyle(element).backgroundColor);
      expect(red).toBe(BRAND_RED);
    });
    await check('the chosen Size (2000) is a solid white fill', async () => {
      const chosen = page.locator('#exportSize .segment[aria-pressed="true"]');
      await expect(chosen).toHaveText('2000');
      expect(await hasWhiteFill(chosen)).toBe(true);
    });
    await check('the chosen Format (JPEG) is a solid white fill', async () => {
      const chosen = page.locator('#exportFormat .segment[aria-pressed="true"]');
      await expect(chosen).toHaveText('JPEG');
      expect(await hasWhiteFill(chosen)).toBe(true);
    });
  });

/* ---------------- LAY-13 Safari's toolbar keeps its dark color ---------------- */

// The computed position of an element, by its id.
function positionOf(page, id) {
  return page.locator(`#${id}`).evaluate(element => getComputedStyle(element).position);
}

test('LAY-13.2 An open sheet is placed against the app, never fixed to the screen [phone] '
  + '[webkit]', async ({ page, check }, testInfo) => {
  const hand = await startWith(page, testInfo);
  for (const step of STEPS) {
    await goToStep(page, step, hand);
    await openOptions(page, hand, step);
    await check(`${STEP_NAMES[step]}'s sheet: its layer's position is absolute, not fixed`,
      async () => {
        expect(await areOptionsShown(page, step)).toBe(true);
        expect(await positionOf(page, `${step}Sheet`)).toBe('absolute');
      });
    await closeOptions(page, hand, step);
  }
  await hand.tap(page.locator('#btnCornerShots'));
  await check('the Corner shots sheet rises', async () => {
    await page.waitForFunction(() => {
      return window.CF.isSheetOpen(document.getElementById('cornerShotsSheet'));
    });
  });
  await check('the Corner shots sheet\'s layer is placed absolutely', async () => {
    expect(await positionOf(page, 'cornerShotsSheet')).toBe('absolute');
  });
  await check(`the page's theme color is the page's dark gray, ${THEME_COLOR}`, async () => {
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
  await check('upright again: top bar 48 px, photo 544 px, controls 200 px, step tabs 52 px '
    + 'along the bottom, the photo fitted at the same size as before', async () => {
    expect(await stepTabsPlace(page)).toBe('bottom');
    expect(after.heights).toEqual(before.heights);
    expect(after.view.isFitted).toBe(true);
    expect(after.view.zoom).toBeCloseTo(before.view.zoom, 6);
  });
});

/* ---------------- LAY-15 The page never scrolls sideways ---------------- */

// The rows of LAY-15.1 and LAY-15.2 that check a step: the page's spare width is 0 on each of
// `steps` in turn.
async function checkSpareWidths(page, check, hand, steps) {
  await onEveryStep(page, hand, async step => {
    const result = 'the page\'s spare width is 0';
    const row = step === 'perspective' ? result : `check ${STEP_NAMES[step]}: ${result}`;
    await check(row, async () => {
      expect((await spareSize(page)).width).toBe(0);
    });
  }, steps);
}

// The rows of LAY-15.2 and LAY-15.3 on the Crop step: a swipe on the row of presets scrolls the
// row inside itself, and the page still has nothing to scroll sideways.
async function swipeThePresets(page, check) {
  const scrolledBefore = await rowScroll(page);
  await swipePresetRow(page, 'left');
  await check('the row of presets moves inside itself: presets further along come into view',
    async () => {
      expect(await rowScroll(page)).toBeGreaterThan(scrolledBefore);
    });
  await check('the page\'s spare width is 0: the top bar, the photo and the step tabs haven\'t '
    + 'moved sideways', async () => {
    expect(await sidewaysScrollPx(page)).toBe(0);
    expect(await page.evaluate(() => window.scrollX)).toBe(0);
  });
}

test('LAY-15.1 No step scrolls the page sideways [both] [webkit]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startWith(page, testInfo);
  await checkSpareWidths(page, check, hand, STEPS);
});

test('LAY-15.2 No step scrolls the page sideways on a 375 px phone [small]', async ({
  page,
  check,
}, testInfo) => {
  const hand = await startWith(page, testInfo);
  const cropLast = ['perspective', 'rotate', 'levels', 'overlay', 'export', 'crop'];
  await checkSpareWidths(page, check, hand, cropLast);
  await swipeThePresets(page, check);
});

test('LAY-15.3 On a phone the row of presets scrolls inside itself, not the page [phone]',
  async ({ page, check }, testInfo) => {
    const hand = await startWith(page, testInfo);
    await goToStep(page, 'crop', hand);
    await waitForStill(page);
    await swipeThePresets(page, check);
  });

/* ---------------- LAY-16 No button label is cut off ---------------- */

// The body of LAY-16.1 and LAY-16.2: no label cut off on any step.
async function noCutLabels(page, check, testInfo) {
  const hand = await startWith(page, testInfo);
  await onEveryStep(page, hand, async step => {
    await check(rowFor(step, 'every button\'s label is whole'), async () => {
      expect(await cutOffLabels(page)).toEqual([]);
    });
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
