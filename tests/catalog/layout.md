# Phone and wide layouts, safe areas, motion

How the screen is arranged on a phone and on a wide screen, how it fits the iPhone's edges and bars, and how things move.

## LAY-01 The layout follows the window's width

The layout is chosen by the window's width alone: 760 px and narrower is the phone layout, wider is the wide layout. It switches live as the window is resized: the row of step tabs moves between the bottom of the screen and the top bar, every options sheet closes on going to the phone layout, and every step's options open inside the side panel on going wide.

- Risk: medium
- Check: script
- Layout: both. This entry is the switch between the two.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#tabBarHost`, `#topBarSteps`, `.sheet-layer`, `#panel`
- Source: `js/app/main.js` (`init`), `js/app/shell.js` (`placeLayout`, `closeSheets`)
- Ruling: R70. A phone on its side wider than 760 px gets the wide layout. The app already does this.
- Cases: 3

### LAY-01.1 760 px and narrower is the phone layout, wider the wide one   [auto: desktop, webkit]
Before you start:
- Device and browser: a desktop browser whose window can be resized, or its developer tools' responsive mode
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Make the window 760 px wide | The step tabs (the six tabs Perspective to Export) are a 52 px row along the bottom: the phone layout |
| 2 | Make the window 761 px wide | The step tabs move into the top bar, and a 380 px side panel holds the controls: the wide layout |

Pass: every row's result is seen.
On a fail, record: the row number, the window's width, a screenshot.

### LAY-01.2 Going wide lists the options in the panel; going narrow closes the sheets   [auto: desktop]
Before you start:
- Device and browser: a desktop browser whose window can be resized, set to 390 × 844 px
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Rotate step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap the options tab (the small tab with an up arrow on the top edge of the controls, the block of buttons under the photo) | ROTATE OPTIONS rise as a sheet over the photo |
| 2 | Make the window 1280 × 800 px | The sheet is gone; every step's options are listed in the side panel, Rotate's (with **Grid**) under its controls |
| 3 | Make the window 390 × 844 px again | No options sheet is open |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### LAY-01.3 A phone turned sideways, 844 px wide, gets the wide layout   [auto: desktop]
Before you start:
- Device and browser: a desktop browser's responsive mode at 844 × 390 px (an iPhone on its side)
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the screen | The step tabs (the six tabs Perspective to Export) are in the top bar, and the controls are in a 380 px side panel: the wide layout |

Pass: every row's result is seen.
On a fail, record: a screenshot.

## LAY-02 Phone: fixed heights, so the photo never changes size

On the phone the screen is, from the top: a 48 px top bar, the photo, a 200 px block of controls in three rows, and a 52 px row of six step tabs. The block of controls is the same height on every step, so the photo stays the same size when you change step.

- Risk: high
- Check: script
- Layout: phone. The wide layout has no block of controls under the photo (LAY-03).
- Added: 1.10 baseline
- Changed: none
- Anchors: `.top-bar`, `.control-area`, `.tab-bar`, `#view`
- Source: `css/app.css` (the top bar, adjustment line and tab bar parts, and the phone block)
- Cases: 1

### LAY-02.1 The phone's parts keep their heights on every step   [auto: phone, webkit]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with the developer tools open to measure
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step

The four parts, from the top: the top bar, the photo, the controls (the block of buttons and sliders under the photo) and the step tabs (the six tabs Perspective to Export, along the bottom).

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Measure the four parts' heights | Top bar 48 px, photo 544 px, controls 200 px, step tabs 52 px: 844 px in all |
| 2 | Tap **Rotate** in the step tabs | The same four heights: 48, 544, 200 and 52 px |
| 3 | Tap **Crop** in the step tabs | The same four heights |
| 4 | Tap **Levels** in the step tabs | The same four heights |
| 5 | Tap **Overlay** in the step tabs | The same four heights |
| 6 | Tap **Export** in the step tabs | The same four heights |

Pass: every row's result is seen.
On a fail, record: the row number, the step, the heights measured.

## LAY-03 Wide: the photo beside a side panel

On a wide screen the photo is on the left and a 380 px side panel on the right holds the step's controls and its options; the panel scrolls when its content is taller than the window. The top bar is 56 px and holds the step tabs. The panel's content is equally wide on every step, whether or not it scrolls.

- Risk: medium
- Check: script
- Layout: wide. The phone stacks the photo over the controls instead (LAY-02).
- Added: 1.10 baseline
- Changed: none
- Anchors: `#panel`, `#topBarSteps`, `.top-bar`
- Source: `css/app.css` (the wide block: `.panel`, `.top-bar`)
- Cases: 1

The order of the top bar's buttons on each layout is TOP-15.1.

### LAY-03.1 The side panel is 380 px and its content as wide on every step   [auto: desktop, webkit]
Before you start:
- Device and browser: a desktop browser, 1280 × 800 px, with the developer tools open to measure
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step

The side panel is the column at the right that holds the step's controls and options; its content is the block inside it, measured without the panel's scroll bar.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Measure the top bar | 56 px tall, with the step tabs (the six tabs Perspective to Export) in it |
| 2 | Measure the side panel and its content | The panel is 380 px wide; its content is 369 px in Chrome (the room the panel keeps for its scroll bar differs by browser; in Safari the content is 379 px); the content is taller than the window, so the panel scrolls |
| 3 | Click **Rotate** in the step tabs | The panel is 380 px wide, its content as wide as on Perspective; the panel doesn't scroll |
| 4 | Click **Crop** in the step tabs | The panel is 380 px wide, its content as wide as on Perspective; the panel doesn't scroll |
| 5 | Click **Levels** in the step tabs | The panel is 380 px wide, its content as wide as on Perspective; the panel doesn't scroll |
| 6 | Click **Overlay** in the step tabs | The panel is 380 px wide, its content as wide as on Perspective; the panel doesn't scroll |
| 7 | Click **Export** in the step tabs | The panel is 380 px wide, its content as wide as on Perspective; the panel scrolls, and its content is no narrower for it |

Pass: every row's result is seen.
On a fail, record: the row number, the step, the widths measured.

## LAY-04 Space kept clear of the iPhone's rounded corners and notch

On an iPhone the app keeps clear of the screen's unsafe edges: padding at the top, left and right of the whole app, and at the bottom of the step tabs, the options sheets, the tuning panel and the question box.

- Risk: medium
- Check: phone
- Layout: phone. Only an iPhone (or a device with a notch) has unsafe edges; elsewhere the padding is zero.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#app`, `.tab-bar`, `.sheet`, `.alert-layer`
- Source: `index.html` (the viewport meta, `viewport-fit=cover`), `css/app.css` (`#app`, the tab bar, sheet and alert card parts, `#debugPanel` in the phone block)
- Cases: 2

### LAY-04.1 The app keeps clear of an iPhone's notch and rounded corners   [phone]
Before you start:
- Device and browser: an iPhone with a notch or Dynamic Island, Safari, with rotation lock off
- Build: the UAT site, https://rberrill.github.io/p1hunt_card_finisher_uat/
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from your photos (copied from samples/)
- Starting screen: the photo open, on the Perspective step, the phone upright

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the top bar | The folder icon at its left (**Open photo**), **Undo** and **Redo** sit below the notch and clear of the rounded corners |
| 2 | Look at the step tabs (the six tabs Perspective to Export, along the bottom) | They sit above the home indicator (the bar at the screen's bottom edge), which doesn't cross their labels |
| 3 | Tap the options tab (the small tab with an up arrow on the top edge of the controls, the block of buttons under the photo) | PERSPECTIVE OPTIONS rise; the sheet's last row sits above the home indicator |
| 4 | Tap the **×** at the options' top right | The options go down |
| 5 | Turn the phone on its side | Nothing is under the notch at the side; the top bar's buttons stay clear of the rounded corners |

Pass: every row's result is seen.
On a fail, record: the row number, a screenshot.

### LAY-04.2 The page is laid out under the whole screen, with no padding where there are no unsafe edges   [auto: phone, webkit]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with no notch (a desktop browser), with the developer tools open
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Read the page's viewport setting (the viewport meta in its head) | It holds viewport-fit=cover: the page is laid out under the whole screen, notch included |
| 2 | Measure the app (the element that holds the whole screen) | It has no padding on any side and fills the window, 390 × 844 px from its top-left |

Pass: every row's result is seen.
On a fail, record: the row number, what you measured.

## LAY-05 The app fills the screen as Safari's bars come and go

On an iPhone the app fills exactly the visible screen as Safari's address bar and toolbar show and hide, and the page never bounces or rubber-bands when dragged at its edges.

- Risk: high
- Check: phone
- Layout: phone. A desktop browser has no bars that come and go.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#app`
- Source: `css/app.css` (`html, body`, `#app`)
- Cases: 2

### LAY-05.1 The app fills the screen as Safari's bars come and go   [phone]
Waiting on find-out Q-04: which action makes Safari's bars hide and show every time, on a page that never scrolls. Row 2 gains that action once Rich has seen it on the phone; until then the case can't be run.

Before you start:
- Device and browser: an iPhone, Safari, with its address bar at the bottom
- Build: the UAT site, https://rberrill.github.io/p1hunt_card_finisher_uat/
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from your photos (copied from samples/)
- Starting screen: the photo open, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the bottom of the screen | The step tabs (the six tabs Perspective to Export) sit just above Safari's bar, with no gap and nothing hidden behind it |
| 2 | (Waiting on Q-04) Make Safari's bars shrink | The app follows: the step tabs stay just above the bar, and the photo grows to fill the space |
| 3 | Put a finger on the top bar and drag it quickly 200 px down | The page doesn't move or bounce, and nothing shows behind it |
| 4 | Put a finger on the step tabs and drag it quickly 200 px up | The page doesn't move or bounce, and nothing shows behind it |

Pass: every row's result is seen.
On a fail, record: the row number, a screen recording (Control Center, the Screen Recording button).

### LAY-05.2 The app fills the window as its height changes, and the page never scrolls   [auto: phone, webkit]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, whose height can be changed (a desktop browser's responsive mode), with the developer tools open on the Console
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step

Read the page's spare height: in the Console, type `document.documentElement.scrollHeight - innerHeight` and press Enter. 0 means the page is no taller than the window, so it has nothing to scroll.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Measure the app (the element that holds the whole screen) | It fills the window from the top, 844 px tall |
| 2 | Read the page's spare height | 0 |
| 3 | Make the window 700 px tall, as when Safari shows its bars | The app fills it again, from the top, 700 px tall |
| 4 | Read the page's spare height | 0 |

Pass: every row's result is seen.
On a fail, record: the row number, the heights measured.

## LAY-06 Every touch control is at least 44 px

Every control you can touch on the phone is at least 44 px in both directions. The tab above the controls that opens the options sheet has a target of 88 × 44 px.

- Risk: medium
- Check: script
- Layout: phone. On a wide screen a few top-bar controls are 36 px (LAY-03); a mouse does not need the larger target.
- Added: 1.10 baseline
- Changed: none
- Anchors: `.grabber`, `.icon-button`, `.step-tab`, `.nudge-key`
- Source: `css/app.css` (the top bar, tab bar, adjustment line, tool, slider, chip, segmented control, nudge pad and sheet parts)
- Cases: 3

### LAY-06.1 Every control on every step is at least 44 px   [auto: phone, webkit]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with the developer tools open to measure
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step

A control's size here is how far a touch still lands on it, across and down through its middle, counting a larger touch area drawn around it. A switch takes its touch through its whole row; a slider or ruler through its track. A preset chip partly scrolled out of its row is not measured.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Measure every control on the screen | Each is at least 44 × 44 px |
| 2 | Tap **Rotate** in the step tabs (the six tabs Perspective to Export, along the bottom) | Every control now on the screen is at least 44 × 44 px |
| 3 | Tap **Crop** in the step tabs | Every control on the screen is at least 44 × 44 px |
| 4 | Tap **Levels** in the step tabs | Every control on the screen is at least 44 × 44 px |
| 5 | Tap **Overlay** in the step tabs | Every control on the screen is at least 44 × 44 px |
| 6 | Tap **Export** in the step tabs | Every control on the screen is at least 44 × 44 px |

Pass: every row's result is seen.
On a fail, record: the row number, the step, the control and its size.

### LAY-06.2 The tab that opens the options takes a touch 88 × 44 px   [auto: phone, webkit]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with the developer tools open to measure
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step

The options tab is the small tab with an up arrow on the top edge of the controls (the block of buttons under the photo). Measure where a touch lands on it: it takes touches over 88 px across, and in every column across at least 44 px down. On Rotate and Export part of it rises above the tab, where the controls take the touch below.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Measure where a touch lands on the options tab | 88 px across, and at least 44 px down in every column |
| 2 | Tap **Rotate** in the step tabs (the six tabs Perspective to Export, along the bottom) | The options tab measures the same: 88 px across, at least 44 px down |
| 3 | Tap **Crop** in the step tabs | The same: 88 px across, at least 44 px down |
| 4 | Tap **Levels** in the step tabs | The same: 88 px across, at least 44 px down |
| 5 | Tap **Overlay** in the step tabs | The same: 88 px across, at least 44 px down |
| 6 | Tap **Export** in the step tabs | The same: 88 px across, at least 44 px down |

Pass: every row's result is seen.
On a fail, record: the row number, the step, the size measured.

### LAY-06.3 Every control in every options sheet is at least 44 px   [auto: phone, webkit]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with the developer tools open to measure
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step

A control is measured as in LAY-06.1. Measure a step's options: tap the step in the step tabs (the six tabs Perspective to Export, along the bottom), tap the options tab (the small tab with an up arrow on the top edge of the controls), measure every control in the sheet that rises, then tap the **×** at the sheet's top right.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Measure Perspective's options | Every control in PERSPECTIVE OPTIONS is at least 44 × 44 px |
| 2 | Measure Rotate's options | Every control in ROTATE OPTIONS is at least 44 × 44 px |
| 3 | Measure Crop's options | Every control in CROP OPTIONS is at least 44 × 44 px |
| 4 | Measure Levels' options | Every control in LEVELS TIPS (Levels' sheet holds its tips) is at least 44 × 44 px |
| 5 | Measure Overlay's options | Every control in OVERLAY OPTIONS is at least 44 × 44 px |
| 6 | Measure Export's options | Every control in EXPORT OPTIONS is at least 44 × 44 px |

Pass: every row's result is seen.
On a fail, record: the row number, the control and its size.

## LAY-07 Nothing covers the photo unless you asked for it

Nothing sits over the photo except an options sheet you opened or a question you must answer. A message shown over the photo's bottom edge never takes a touch, so the photo under it still works.

- Risk: medium
- Check: script
- Layout: both. On a wide screen the options are in the side panel, so only a question box covers the photo.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#toast`, `.sheet-layer`, `.alert-layer`, `#pairPrompt`
- Source: `js/app/parts/toast.js` (`buildToast`), `js/app/core.js` (`toast`, `placeToast`), `css/app.css` (the toast, sheet and alert card parts)
- Cases: 1

That a message over the photo lets a touch through to the photo is MSG-04.1.

### LAY-07.1 Nothing covers the photo on any step   [auto: both]
Before you start:
- Device and browser: a phone-width window (390 × 844 px) or a wide one (1280 × 800 px)
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step

The step tabs are the six tabs Perspective to Export: along the bottom on a phone, in the top bar on a wide screen. On a phone the options tab (the small tab with an up arrow on the top edge of the controls) rises over the photo's bottom edge; that is the only thing allowed over it.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the photo | Nothing lies over it but, on a phone, the options tab |
| 2 | Tap **Rotate** in the step tabs | Nothing lies over the photo but, on a phone, the options tab |
| 3 | Tap **Crop** in the step tabs | Nothing lies over the photo but, on a phone, the options tab |
| 4 | Tap **Levels** in the step tabs | Nothing lies over the photo but, on a phone, the options tab |
| 5 | Tap **Overlay** in the step tabs | Nothing lies over the photo but, on a phone, the options tab |
| 6 | Tap **Export** in the step tabs | Nothing lies over the photo but, on a phone, the options tab |

Pass: every row's result is seen.
On a fail, record: the row number, the step, what covers the photo, a screenshot.

## LAY-08 The six step tabs fit on a small phone

On screens narrower than 390 px the step tabs' labels drop to 11 px, and all six still fit on one row without being cut.

- Risk: low
- Check: script
- Layout: phone. On a wide screen the step tabs are in the top bar (LAY-03).
- Added: 1.10 baseline
- Changed: none
- Anchors: `.step-tab`, `.step-tab-label`
- Source: `css/app.css` (the `max-width: 389px` block)
- Cases: 1

### LAY-08.1 On a 375 px phone the six step tabs fit one row at 11 px   [auto: small]
Before you start:
- Device and browser: a narrow phone window, 375 × 667 px (an iPhone SE), with the developer tools open to measure
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the step tabs (the six tabs Perspective to Export, along the bottom) | Six tabs on one row, inside the 375 px window |
| 2 | Measure their labels | Each is 11 px text, and none is cut short |

Pass: every row's result is seen.
On a fail, record: the row number, a screenshot.

## LAY-09 Export's options fit without scrolling

On the phone, Export's options sheet shows everything down to its **Tips** row without scrolling.

- Risk: low
- Check: script
- Layout: phone. On a wide screen the options are listed in the side panel, which scrolls (LAY-03).
- Added: 1.10 baseline
- Changed: none
- Anchors: `#exportSheet`, `"Export options"`, `"Tips"`
- Source: `css/app.css` (the Export step's phone block), `js/app/export-controls.js` (`buildExportControls`)
- Cases: 1

### LAY-09.1 Export options show down to Tips without scrolling   [auto: phone, webkit]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap the options tab (the small tab with an up arrow on the top edge of the controls, the block of buttons under the photo) | EXPORT OPTIONS rise and show every row down to **Tips** whole; nothing in the sheet is cut off at its bottom, so it has nothing to scroll |

Pass: every row's result is seen.
On a fail, record: the last row you can see, a screenshot.

## LAY-10 Reduced motion

When the device asks for reduced motion, animations stop and only fades are kept: options sheets and the logo jump to their place instead of sliding, the two-part switch's white pill jumps, and the Straighten ruler's pointer and the sliders' knobs don't grow when held. Progress still moves. The **Before levels** badge on Levels keeps its short fade.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `.sheet-layer`, `.segment-thumb`, `.ruler-pointer`, `.progress-line`, `"Before levels"`
- Source: `css/app.css` (the reduced motion block and each part's own), `js/app/parts/adjustment-line.js` (`isMotionReduced`), `js/app/parts/progress-line.js` (`updateProgressLine`), `js/app/overlay.js` (`aimRings`, `overlaySpotTap`)
- Ruling: R71. Under reduced motion the **Before levels** badge still fades, the snap rings don't, and one fade is 60 ms. The app already does this.
- Cases: 5

That the logo jumps to a tapped ring under reduced motion is OVL-22.2; that the **Before levels** badge keeps its fade is LEV-17.2; that a question box only fades is QCD-09.1.

To turn reduced motion on or off in a desktop browser: in the developer tools, open the Rendering panel and set "Emulate CSS media feature prefers-reduced-motion" to "reduce" (on) or "No emulation" (off).

### LAY-10.1 Under reduced motion an options sheet is in its place at once   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with the developer tools open
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Rotate step, reduced motion off

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap the options tab (the small tab with an up arrow on the top edge of the controls, the block of buttons under the photo) | ROTATE OPTIONS slide up from the bottom of the screen |
| 2 | Tap the **×** at the options' top right | The sheet slides down out of sight |
| 3 | Turn reduced motion on | Nothing on the screen changes |
| 4 | Tap the options tab | ROTATE OPTIONS are in their place at once, with no slide; only the dimming over the photo fades in |

Pass: every row's result is seen.
On a fail, record: the row number, a screen recording.

### LAY-10.2 Under reduced motion the Front and Back pill jumps   [auto: phone]
Script only
Stand-in: nothing is replaced, but the pill's slide lasts less than a fifth of a second, too short to tell by eye from a jump, and the page is busy opening the other side while it runs. The script notes whether the browser starts a slide on the pill, and records where the pill is in every frame the page draws.

Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with the developer tools open
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: a pair: open the front, tap **Export** in the step tabs (the six tabs Perspective to Export, along the bottom), tap **Add back** and choose the back. The back is open, and **Back** has the white pill (the solid white fill on the chosen half of **Front** / **Back** in the top bar); reduced motion off

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Front** in the top bar | The pill slides from **Back** to **Front**: the browser runs a slide across on it, and it ends on **Front** |
| 2 | Turn reduced motion on | Nothing on the screen changes |
| 3 | Tap **Back** in the top bar | The pill jumps: no slide is run on it, and in every frame it is wholly on **Front** or wholly on **Back**, never between |

Pass: every row's result is seen.
On a fail, record: the row number, a screen recording.

### LAY-10.3 Under reduced motion the Straighten ruler's pointer doesn't grow when held   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with the developer tools open to measure
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Rotate step, reduced motion off

The Straighten ruler is the scale of ticks under **STRAIGHTEN**; its pointer is the white upright bar in its middle, 28 px tall at rest.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Put a finger on the middle of the ruler and hold it there without moving | The pointer grows to 36 px tall |
| 2 | Lift the finger | The pointer is 28 px tall again |
| 3 | Turn reduced motion on | Nothing on the screen changes |
| 4 | Put a finger on the middle of the ruler and hold it there without moving | The pointer stays 28 px tall |

Pass: every row's result is seen.
On a fail, record: the row number, the pointer's height, a screenshot.

### LAY-10.4 Under reduced motion a slider's knob doesn't grow when held   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with the developer tools open to measure
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step, reduced motion off

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Flatten** | The Flatten slider shows under the photo, at 100%: its white knob at the right end, 22 px across |
| 2 | Put a finger on the knob and hold it there without moving | The knob grows to 30 px across |
| 3 | Lift the finger | The knob is 22 px across again |
| 4 | Turn reduced motion on | Nothing on the screen changes |
| 5 | Put a finger on the knob and hold it there without moving | The knob stays 22 px across |

Pass: every row's result is seen.
On a fail, record: the row number, the knob's size, a screenshot.

### LAY-10.5 Under reduced motion the export's progress line still moves   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with the developer tools open
- Build: the build under test, opened with `?export.bandPx=65536` (index.html?export.bandPx=65536), which makes the app save the picture in small bands of rows, so a save takes about a second
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Export step, reduced motion on

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Download** | The question box (the box over the dimmed photo with a question and two buttons) asks "Upscale to 2000 px?" |
| 2 | Tap **Yes** | A thin red line on the top edge of the controls (the block of buttons under the photo) grows from left to right in several steps, then goes; a message over the photo begins "Photo downloaded: 2000 × 2000 px" |

Pass: every row's result is seen.
On a fail, record: the row number, a screen recording.

## LAY-11 The brand's colors

The app's agreed colors: the P1Hunt red (#e5322d) on its main actions, a solid white fill on the chosen choice, and white text on matte black and dark gray elsewhere.

- Risk: medium
- Check: eye
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.theme.accent`, `CONFIG.theme.warn`, `CONFIG.theme.ink`, `CONFIG.theme.page`
- Source: `css/app.css` (`:root`), `js/config.js` (`CONFIG.theme`), `js/app/core.js` (the theme written to the page at load)
- Ruling: R43. The brand lines are guidance for new design, and a design Rich has agreed stands; so no case here holds the app to the brand lines (the checkerboard behind the saved logo's thumbnail is drawn with a gradient function, and stands). The app already does this. The six colors of the old layout left in the settings, and the comments that still say "one red", are code to tidy in the fix pass, not a behavior: no case checks them.
- Cases: 2

### LAY-11.1 The brand's colors, for a person to judge   [eye]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the Export step | **Download** is red with white text; the chosen Size (**2000**) and Format (**JPEG**) are solid white with dark text; the other Size and Format choices are dark gray with white text; behind the photo and the controls is black |
| 2 | Tap **Crop** in the step tabs (the six tabs Perspective to Export, along the bottom) | The chosen preset (**1:1**) is a solid white chip with dark text; the other presets are dark gray chips with white text |

Pass: every row's result is seen.
On a fail, record: the row number, a screenshot.

### LAY-11.2 Download is the brand's red and the chosen size and format white   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with the developer tools open
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Read **Download**'s background color | The brand's red, #e5322d |
| 2 | Read the chosen Size's (**2000**) background color | A solid white fill: each of red, green and blue above 230 (the app's white is #f2f2f3) |
| 3 | Read the chosen Format's (**JPEG**) background color | A solid white fill: each of red, green and blue above 230 |

Pass: every row's result is seen.
On a fail, record: the row number, the element and its background.

## LAY-12 Motion on a real phone

On a real iPhone the options sheet follows the finger as it is dragged, the two-part switch's white pill slides, and question boxes fade in and out.

- Risk: low
- Check: phone
- Layout: phone
- Added: 1.10 baseline
- Changed: none
- Anchors: `.sheet-layer`, `.alert-layer`, `.segment-thumb`
- Source: `js/app/parts/sheet.js` (`bindSheetHandle`, `openSheet`, `closeSheet`), `js/app/parts/alert-card.js` (`showAlert`, `hideAlert`), `js/app/parts/segmented-control.js` (`buildSegmented`)
- Cases: 1

### LAY-12.1 The sheet, the pill and the question box move on a real phone   [phone]
Before you start:
- Device and browser: an iPhone, Safari, with Reduce Motion off (Settings, Accessibility, Motion)
- Build: the UAT site, https://rberrill.github.io/p1hunt_card_finisher_uat/
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from your photos (copied from samples/)
- Starting screen: a pair: open the front, tap **Export** in the step tabs (the six tabs Perspective to Export, along the bottom), tap **Add back** and choose the back. The back is open, on the Perspective step, and **Back** has the white pill (the solid white fill on the chosen half of **Front** / **Back** in the top bar)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Put a finger on the options tab (the small tab with an up arrow on the top edge of the controls, the block of buttons under the photo) and drag it slowly up about 200 px, without lifting | The sheet's top edge stays under the finger all the way up |
| 2 | Lift the finger | The sheet rises the rest of the way and stays open, titled PERSPECTIVE OPTIONS |
| 3 | Tap the **×** at the sheet's top right | The sheet slides down out of sight |
| 4 | Tap **Front** in the top bar | The white pill slides across from **Back** to **Front**: you see it pass between them |
| 5 | Tap **Unpair** (beside **Front** / **Back**) | The question box (the box over the dimmed photo with a question and buttons), titled "Unpair", fades in: it grows clear over a moment, not all at once |
| 6 | Tap **Cancel** | The question box fades out over a moment; **Front** / **Back** still shows in the top bar |

Pass: every row's result is seen.
On a fail, record: the row number, a screen recording (Control Center, the Screen Recording button).

## LAY-13 Safari's toolbar keeps its dark color

On an iPhone, Safari's toolbar at the bottom of the screen stays the page's dark color while an options sheet rises, is open or closes, and while a question box is up. (It once turned red, taking its color from a red button on a rising sheet.)

- Risk: medium
- Check: phone
- Layout: phone. Only iPhone Safari colors its toolbar from the page.
- Added: 1.10 baseline
- Changed: none
- Anchors: `.sheet-layer`, `.alert-layer`, `#cornerShotsSheet`, `#pairPrompt`
- Source: `css/app.css` (the sheet part: the sheet's layer is placed against the app, never fixed to the screen), `index.html` (the theme-color meta), `js/app/parts/sheet.js` (`openSheet`)
- Cases: 2

### LAY-13.1 Safari's toolbar stays dark as sheets and question boxes come and go   [phone]
Before you start:
- Device and browser: an iPhone with iOS 26, Safari, its address bar at the bottom
- Build: the UAT site, https://rberrill.github.io/p1hunt_card_finisher_uat/
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from your photos (copied from samples/)
- Starting screen: the photo open, on the Export step

Safari's toolbar is its own bar at the bottom of the screen, with the address in it.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap the options tab (the small tab with an up arrow on the top edge of the controls, the block of buttons under the photo) | EXPORT OPTIONS rise; Safari's toolbar stays the page's dark gray while they rise and once they are open |
| 2 | Tap the **×** at the options' top right | The options go down; the toolbar stays dark gray |
| 3 | Tap **Corner shots** | The Corner shots sheet rises; the toolbar stays dark gray, never red |
| 4 | Tap the **×** at the Corner shots sheet's top right | The sheet goes down; the toolbar stays dark gray |
| 5 | Tap **Download** | The question box (the box over the dimmed photo with a question and buttons) asks "Upscale to 2000 px?"; the toolbar stays dark gray |
| 6 | Tap **Cancel** | The question box goes; the toolbar stays dark gray |

Pass: every row's result is seen.
On a fail, record: the row number, a screenshot showing the toolbar.

### LAY-13.2 An open sheet is placed against the app, never fixed to the screen   [auto: phone, webkit]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with the developer tools open
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step

A sheet fixed to the screen gives Safari a color to take for its toolbar as it rises; one placed against the app doesn't (LAY-13.1 is the real check).

Read a step's sheet: tap the step in the step tabs (the six tabs Perspective to Export, along the bottom), tap the options tab (the small tab with an up arrow on the top edge of the controls), and in the developer tools read the computed position of the sheet's layer (the element that holds the sheet and the dimming behind it); then tap the **×** at the sheet's top right.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Read Perspective's sheet | Its position is absolute, not fixed |
| 2 | Read Rotate's sheet | Absolute |
| 3 | Read Crop's sheet | Absolute |
| 4 | Read Levels' sheet | Absolute |
| 5 | Read Overlay's sheet | Absolute |
| 6 | Read Export's sheet | Absolute |
| 7 | Tap **Corner shots** | The Corner shots sheet rises |
| 8 | Read the computed position of the Corner shots sheet's layer | Absolute |
| 9 | Read the page's theme color (the theme-color meta in its head) | #161618, the page's dark gray |

Pass: every row's result is seen.
On a fail, record: the row number, the sheet and its position.

## LAY-14 Turning the phone and back restores the layout

Turning the phone to landscape and back to portrait brings the layout back as it was: the photo, the controls and the step tabs in their places, at their sizes, with the photo refitted. The layout is chosen by width (LAY-01), so a landscape phone wider than 760 px shows the wide layout until it is turned back.

- Risk: medium
- Check: script, phone
- Layout: phone. A script checks it by resizing to 844 × 390 and back to 390 × 844; a real iPhone confirms the turn itself.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#tabBarHost`, `#topBarSteps`, `#view`, `.control-area`
- Source: `js/app/main.js` (`init`), `js/app/shell.js` (`placeLayout`), `js/app/view.js` (`resizeCanvas`)
- Ruling: R70. A phone on its side wider than 760 px gets the wide layout. The app already does this.
- Cases: 2

### LAY-14.1 Sideways and back, the layout is as it was   [auto: phone, webkit]
Before you start:
- Device and browser: a desktop browser's responsive mode at 390 × 844 px
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Rotate step, fitted to the screen

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Make the window 844 × 390 px | The wide layout: the step tabs (the six tabs Perspective to Export) in the top bar |
| 2 | Make the window 390 × 844 px again | The phone layout as before: top bar 48 px, photo 544 px, controls 200 px, step tabs 52 px along the bottom, the photo fitted at the same size as before |

Pass: every row's result is seen.
On a fail, record: the row number, the heights measured, a screenshot.

### LAY-14.2 Turning a real iPhone and back restores the layout   [phone]
Before you start:
- Device and browser: an iPhone with Face ID (any iPhone but an SE: on its side it is more than 760 px wide), Safari, with rotation lock off
- Build: the UAT site, https://rberrill.github.io/p1hunt_card_finisher_uat/
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from your photos (copied from samples/)
- Starting screen: the photo open, on the Rotate step, the phone upright

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Turn the phone on its side | The wide layout: the step tabs (the six tabs Perspective to Export) in the top bar, the controls in a side panel at the right, and the photo fitted to its new space |
| 2 | Turn the phone upright again | The top bar, the photo, the controls (the block of buttons under the photo) and the step tabs along the bottom are back in their places and sizes; the photo is fitted; nothing is cut off |

Pass: every row's result is seen.
On a fail, record: the row number, a screenshot.

## LAY-15 The page never scrolls sideways

On every step, at any window size, the page itself never scrolls sideways. (The row of crop presets scrolls sideways inside itself on the phone; the page does not.)

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#app`, `.chip-row`
- Source: `css/app.css` (`#app`, `.stage`, the phone block's `.chip-row`)
- Cases: 3

### LAY-15.1 No step scrolls the page sideways   [auto: both, webkit]
Before you start:
- Device and browser: a phone-width window (390 × 844 px) or a wide one (1280 × 800 px), with the developer tools open on the Console
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step

Read the page's spare width: in the Console, type `document.documentElement.scrollWidth - innerWidth` and press Enter. 0 means the page is no wider than the window, so it has nothing to scroll sideways. Check a step: tap it in the step tabs (the six tabs Perspective to Export: along the bottom on a phone, in the top bar on a wide screen), then read the page's spare width.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Read the page's spare width | 0 |
| 2 | Check Rotate | 0 |
| 3 | Check Crop | 0 |
| 4 | Check Levels | 0 |
| 5 | Check Overlay | 0 |
| 6 | Check Export | 0 |

Pass: every row's result is seen.
On a fail, record: the row number, the step, the number printed.

### LAY-15.2 No step scrolls the page sideways on a 375 px phone   [auto: small]
Before you start:
- Device and browser: a narrow phone window, 375 × 667 px (an iPhone SE), with touch, and the developer tools open on the Console
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step

Read the page's spare width: in the Console, type `document.documentElement.scrollWidth - innerWidth` and press Enter. 0 means the page is no wider than the window, so it has nothing to scroll sideways. Check a step: tap it in the step tabs (the six tabs Perspective to Export, along the bottom), then read the page's spare width.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Read the page's spare width | 0 |
| 2 | Check Rotate | 0 |
| 3 | Check Levels | 0 |
| 4 | Check Overlay | 0 |
| 5 | Check Export | 0 |
| 6 | Check Crop | 0 |
| 7 | Put a finger on the row of presets (**Free**, **1:1** and the rest, under the photo) and swipe it to the left | The row moves inside itself: presets further along come into view |
| 8 | Read the page's spare width | 0: the top bar, the photo and the step tabs haven't moved sideways |

Pass: every row's result is seen.
On a fail, record: the row number, the step, the number printed, a screenshot.

### LAY-15.3 On a phone the row of presets scrolls inside itself, not the page   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with touch, and the developer tools open on the Console
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Crop step

Read the page's spare width: in the Console, type `document.documentElement.scrollWidth - innerWidth` and press Enter. 0 means the page is no wider than the window, so it has nothing to scroll sideways.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Put a finger on the row of presets (**Free**, **1:1** and the rest, under the photo) and swipe it to the left | The row moves inside itself: presets further along come into view |
| 2 | Read the page's spare width | 0: the top bar, the photo and the step tabs haven't moved sideways |

Pass: every row's result is seen.
On a fail, record: the row number, the number printed, a screenshot.

## LAY-16 No button label is cut off

No button's label is cut off or overflows its button, in the block of controls under the photo, the side panel, the step tabs or the top bar, on every step, at the phone and wide sizes.

- Risk: medium
- Check: script
- Layout: both. The top bar drops its name and **Open**'s label on narrower wide screens on purpose (an icon stays); that is not a cut-off label.
- Added: 1.10 baseline
- Changed: none
- Anchors: `.action-label`, `.step-tab-label`, `.icon-button-label`
- Source: `js/app/parts/action-button.js` (`buildActionButton`), `js/app/parts/tab-bar.js` (`buildTabBar`), `js/app/parts/top-bar.js` (`buildTopBar`), `css/app.css`
- Cases: 2

### LAY-16.1 No button label is cut off on any step   [auto: both, webkit]
Before you start:
- Device and browser: a phone-width window (390 × 844 px) or a wide one (1280 × 800 px)
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step

A label left out on purpose is not cut off: on a wide screen narrower than 1120 px, the top bar drops the app's name and **Open**'s label, keeping its icon. A label is whole when none of it ends cut, with an ellipsis or outside its button. The step tabs are the six tabs Perspective to Export: along the bottom on a phone, in the top bar on a wide screen. The controls are the block of buttons under the photo (on a wide screen, in the panel at the right).

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Read every button's label in the top bar, the step tabs and the controls | Each is whole |
| 2 | Tap **Rotate** in the step tabs | Every label is whole |
| 3 | Tap **Crop** in the step tabs | Every label is whole |
| 4 | Tap **Levels** in the step tabs | Every label is whole |
| 5 | Tap **Overlay** in the step tabs | Every label is whole |
| 6 | Tap **Export** in the step tabs | Every label is whole |

Pass: every row's result is seen.
On a fail, record: the row number, the step, the label, a screenshot.

### LAY-16.2 No button label is cut off on a 375 px phone   [auto: small]
Before you start:
- Device and browser: a narrow phone window, 375 × 667 px (an iPhone SE)
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step

A label is whole when none of it ends cut, with an ellipsis or outside its button. The step tabs are the six tabs Perspective to Export, along the bottom; the controls are the block of buttons under the photo.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Read every button's label in the top bar, the step tabs and the controls | Each is whole |
| 2 | Tap **Rotate** in the step tabs | Every label is whole |
| 3 | Tap **Crop** in the step tabs | Every label is whole |
| 4 | Tap **Levels** in the step tabs | Every label is whole |
| 5 | Tap **Overlay** in the step tabs | Every label is whole |
| 6 | Tap **Export** in the step tabs | Every label is whole |

Pass: every row's result is seen.
On a fail, record: the row number, the step, the label, a screenshot.
