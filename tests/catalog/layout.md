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
- Flag: to confirm. A phone turned to landscape that is wider than 760 px (such as 844 × 390) gets the wide layout, with the side panel and no step tabs along the bottom.
- Cases: 3

### LAY-01.1 760 px and narrower is the phone layout, wider the wide one   [auto: desktop, webkit]
Before you start:
- Device and browser: a desktop browser whose window can be resized, or its developer tools' responsive mode
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Make the window 760 px wide | The step tabs are a 52 px row along the bottom: the phone layout |
| 2 | Make the window 761 px wide | The step tabs move into the top bar, and a 380 px side panel holds the controls: the wide layout |

Pass: every row's result is seen.
On a fail, record: the row number, the window's width, a screenshot.

### LAY-01.2 Going wide lists the options in the panel; going narrow closes the sheets   [auto: desktop]
Before you start:
- Device and browser: a desktop browser whose window can be resized, set to 390 × 844 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Rotate step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Open **Rotate options** (the tab with an up arrow on the top edge of the controls) | The options rise as a sheet over the photo |
| 2 | Make the window 1280 × 800 px | The sheet is gone; every step's options are listed in the side panel, Rotate's (with **Grid**) under its controls |
| 3 | Make the window 390 × 844 px again | No options sheet is open |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### LAY-01.3 A phone turned sideways, 844 px wide, gets the wide layout   [auto: desktop]
Flag: to confirm. Written to what the app does today: the layout follows the width alone, so a phone on its side shows the side panel and no step tabs along the bottom.
Before you start:
- Device and browser: a desktop browser's responsive mode at 844 × 390 px (an iPhone on its side)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the start screen; then open the photo

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the screen | The step tabs are in the top bar, and the controls are in a 380 px side panel: the wide layout |

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
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Measure the parts from the top | Top bar 48 px, photo 544 px, controls 200 px, step tabs 52 px: 844 px in all |
| 2 | Tap each of the other five steps in turn and measure again | The same four heights on every step: the photo never changes size |

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
- Flag: to confirm. The top bar's right-hand buttons come in a different order on each layout: **Fit to screen**, **Undo**, **Redo** on the phone; **Undo**, **Redo**, **Fit to screen** on a wide screen.
- Cases: 2

### LAY-03.1 The side panel is 380 px and its content as wide on every step   [auto: desktop, webkit]
Before you start:
- Device and browser: a desktop browser, 1280 × 800 px, with the developer tools open to measure
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Measure the top bar | 56 px tall, with the step tabs in it |
| 2 | Click each step in turn and measure the side panel and its content | The panel is 380 px wide on every step, and its content is one width on all six |
| 3 | Look for a step whose options are taller than the window | On at least one, the panel scrolls; its content is no narrower there |

Pass: every row's result is seen.
On a fail, record: the row number, the step, the widths measured.

### LAY-03.2 The top bar's right-hand buttons come in a different order on each layout   [auto: both]
Flag: to confirm. Written to what the app does today: **Fit to screen**, **Undo**, **Redo** on the phone; **Undo**, **Redo**, **Fit to screen** on a wide screen.
Before you start:
- Device and browser: a phone-width window (390 × 844 px) or a wide one (1280 × 800 px)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | On a phone, pinch outwards on the photo | **Fit to screen** (four corner marks) shows in the top bar |
| 2 | Read the top bar's right-hand buttons from left to right | Phone: **Fit to screen**, **Undo**, **Redo**. Wide: **Undo**, **Redo**, **Fit to screen** |

Pass: every row's result is seen.
On a fail, record: the order seen, a screenshot.

## LAY-04 Space kept clear of the iPhone's rounded corners and notch

On an iPhone the app keeps clear of the screen's unsafe edges: padding at the top, left and right of the whole app, and at the bottom of the step tabs, the options sheets, the tuning panel and the question card.

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
- Device and browser: an iPhone with a notch or Dynamic Island, Safari
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step, the phone upright

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the top bar | **Open**, **Undo** and **Redo** sit below the notch and clear of the rounded corners |
| 2 | Look at the step tabs | They sit above the home indicator, which doesn't cross their labels |
| 3 | Open **Perspective options** | The sheet's last row sits above the home indicator |
| 4 | Turn the phone on its side | Nothing is under the notch at the side; the top bar's buttons stay clear of the rounded corners |

Pass: every row's result is seen.
On a fail, record: the row number, a screenshot.

### LAY-04.2 The page is laid out under the whole screen, with no padding where there are no unsafe edges   [auto: phone, webkit]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with no notch (a desktop browser), with the developer tools open
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Read the page's viewport setting (the viewport meta in its head) | It holds viewport-fit=cover: the page is laid out under the whole screen, notch included |
| 2 | Measure the app | It has no padding on any side and fills the window, 390 × 844 px from its top-left |

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
Before you start:
- Device and browser: an iPhone, Safari, with its address bar at the bottom
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the bottom of the screen | The step tabs sit just above Safari's bar, with no gap and nothing hidden behind it |
| 2 | Tap the top of the screen and swipe, to make Safari shrink and grow its bars | The app follows: the step tabs stay just above the bar, and the photo grows or shrinks to fill the space |
| 3 | Drag down hard from the top bar, and up hard from the step tabs | The page doesn't move, bounce or show anything behind it |

Pass: every row's result is seen.
On a fail, record: the row number, a screen recording.

### LAY-05.2 The app fills the window as its height changes, and the page never scrolls   [auto: phone, webkit]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, whose height can be changed (a desktop browser's responsive mode)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Measure the app | It fills the window from the top, 844 px tall |
| 2 | Make the window 700 px tall, as when Safari shows its bars | The app fills it again, 700 px tall |
| 3 | Try to scroll the page at both heights | It has nothing to scroll |

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
- Cases: 2

### LAY-06.1 Every control on every step and in every options sheet is at least 44 px   [auto: phone, webkit]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with the developer tools open to measure
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step

A control's size here is how far a touch still lands on it, across and down through its middle, counting a larger touch area drawn around it. A switch takes its touch through its whole row; a slider or ruler through its track. A preset chip partly scrolled out of its row is not measured.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Measure every control on the screen | Each is at least 44 × 44 px |
| 2 | Tap each of the other five steps in turn and measure again | The same on every step |
| 3 | On each step, open its options and measure every control in the sheet | Each is at least 44 × 44 px |

Pass: every row's result is seen.
On a fail, record: the row number, the step, the control and its size.

### LAY-06.2 The tab that opens the options takes a touch 88 × 44 px   [auto: phone, webkit]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with the developer tools open to measure
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Measure where a touch lands on the options tab (the tab with an up arrow on the top edge of the controls) | It takes touches over 88 px across, and in every column across at least 44 px down (on Rotate and Export part of it rises above the tab, where the controls take the touch below) |
| 2 | Tap each of the other five steps in turn and measure again | The same on every step |

Pass: every row's result is seen.
On a fail, record: the row number, the step, the size measured.

## LAY-07 Nothing covers the photo unless you asked for it

Nothing sits over the photo except an options sheet you opened or a question you must answer. A message shown over the photo's bottom edge never takes a touch, so the photo under it still works.

- Risk: medium
- Check: script
- Layout: both. On a wide screen the options are in the side panel, so only a question card covers the photo.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#toast`, `.sheet-layer`, `.alert-layer`, `#pairPrompt`
- Source: `js/app/parts/toast.js` (`buildToast`), `js/app/core.js` (`toast`, `placeToast`), `css/app.css` (the toast, sheet and alert card parts)
- Cases: 2

### LAY-07.1 Nothing covers the photo on any step   [auto: both]
Before you start:
- Device and browser: a phone-width window (390 × 844 px) or a wide one (1280 × 800 px)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the photo | Nothing lies over it but, on a phone, the options tab rising over its bottom edge |
| 2 | Tap each of the other five steps in turn | The same on every step |

Pass: every row's result is seen.
On a fail, record: the row number, the step, what covers the photo, a screenshot.

### LAY-07.2 A message over the photo lets touches through   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Download** and answer **No** to "Upscale to 2000 px?" | A message starting "Exported " shows over the photo's bottom edge |
| 2 | While it shows, touch the middle of the message | The touch goes to the photo under it, not to the message |

Pass: every row's result is seen.
On a fail, record: the row number, a screenshot.

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
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the step tabs | Six tabs on one row, inside the 375 px window |
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
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Open **Export options** (the tab with an up arrow on the top edge of the controls) | The sheet shows every row down to **Tips** whole, and has nothing to scroll |

Pass: every row's result is seen.
On a fail, record: the last row you can see, a screenshot.

## LAY-10 Reduced motion

When the device asks for reduced motion, animations stop and only fades are kept: options sheets and the logo jump to their place instead of sliding, the two-part switches' white pill jumps, and the Straighten ruler's pointer and the sliders' thumbs don't grow when held. Progress still moves. The **Before levels** badge on Levels keeps its short fade.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `.sheet-layer`, `.segment-thumb`, `.ruler-pointer`, `"Before levels"`
- Source: `css/app.css` (the reduced motion block and each part's own), `js/app/parts/adjustment-line.js` (`isMotionReduced`), `js/app/parts/progress-line.js` (`updateProgressLine`), `js/app/overlay.js` (`aimRings`)
- Flag: to confirm. Under reduced motion the **Before levels** badge still fades in over 80 ms while the Overlay step's snap rings appear at once, and one transition (60 ms) is shorter than the 80 ms the motion rules set as the floor.
- Cases: 1

That the **Before levels** badge keeps its fade under reduced motion is LEV-17.2.

### LAY-10.1 Under reduced motion a sheet jumps to its place and the pill doesn't slide   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, whose reduced motion setting can be switched (on an iPhone: Settings, Accessibility, Motion, Reduce Motion; in a desktop browser's developer tools, the rendering emulation)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Rotate step, reduced motion off

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap the options tab (the tab with an up arrow on the top edge of the controls) | **Rotate options** slide up from the bottom |
| 2 | Close the options, turn reduced motion on, and tap the options tab again | The sheet is in its place at once, with no slide; only the dimming fades in |
| 3 | Look at the ruler's pointer and any two-part switch | Neither moves by sliding or growing; they change only by fading |

Pass: every row's result is seen.
On a fail, record: the row number, a screen recording.

## LAY-11 The brand look

The app looks like P1Hunt: matte black and white, red for main actions, a solid white fill for the selected thing, amber only on a warning, and flat shapes with no gradients.

- Risk: medium
- Check: eye
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.theme.accent`, `CONFIG.theme.warn`, `CONFIG.theme.ink`, `CONFIG.theme.page`
- Source: `css/app.css` (`:root`), `js/config.js` (`CONFIG.theme`), `js/app/core.js` (the theme written to the page at load)
- Ruling: R43. The checkerboard behind the saved logo's thumbnail on Overlay is drawn with a gradient function; it stands as an agreed exception to "no gradients". The brand lines are guidance for new design, and a design Rich has agreed stands. The app already does this.
- Flag: to confirm. `CONFIG.theme` still holds six colors of the old layout whose page colors are no longer used, and some comments still say "one red" after the brand rule changed.
- Cases: 2

### LAY-11.1 The brand look, for a person to judge   [eye]
Flag: to confirm. The settings still hold six colors of the old layout that the page no longer uses, and some comments still say "one red"; neither shows on screen, so this case judges what does.
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the Export step | Matte black and white; **Download** red; the selected Size (**2000**) and Format (**JPEG**) solid white; no gradients, no amber, no italics, no F1, team or driver marks |
| 2 | Tap **Crop** in the step bar | The selected preset (**1:1**) is a solid white chip; every other control is dark gray with white text; nothing is red but a main action |

Pass: every row's result is seen.
On a fail, record: the row number, a screenshot.

### LAY-11.2 No gradient anywhere, Download red and the selected size white   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with the developer tools open
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look through every element's background | None is a gradient, but for the checkerboard behind the saved logo's thumbnail on Overlay (hard-edged squares that show see-through parts), an agreed exception (ruling R43) |
| 2 | Read **Download**'s background and the selected Size's | **Download** is the brand's red, #e5322d; **2000** is a solid white fill |

Pass: every row's result is seen.
On a fail, record: the row number, the element and its background.

## LAY-12 Motion feels right on a real phone

On a real iPhone the options sheet follows the finger as it is dragged, the two-part switches' white pill slides, question cards fade in and out, and nothing stutters.

- Risk: low
- Check: phone
- Layout: phone
- Added: 1.10 baseline
- Changed: none
- Anchors: `.sheet-layer`, `.alert-layer`, `.segment-thumb`
- Source: `js/app/parts/sheet.js` (`bindSheetHandle`, `openSheet`, `closeSheet`), `js/app/parts/alert-card.js` (`showAlert`, `hideAlert`), `js/app/parts/segmented-control.js` (`buildSegmented`)
- Cases: 1

### LAY-12.1 Motion feels right on a real phone   [phone]
Before you start:
- Device and browser: an iPhone, Safari, with reduced motion off
- Build: the build under test
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: a pair: open the front, tap **Export**, tap **Add back** and choose the back

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Drag the options tab (the tab with an up arrow on the top edge of the controls) slowly up, then down a little, then let go | The sheet follows the finger without lag, then settles open |
| 2 | Tap **Front**, then **Back**, in the top bar | The white pill slides smoothly between the two halves |
| 3 | Tap **Unpair**, then tap outside the card | The question card fades in, then fades out |
| 4 | Do each of the above three times quickly | Nothing stutters or jumps |

Pass: every row's result is seen.
On a fail, record: the row number, a screen recording.

## LAY-13 Safari's toolbar keeps its dark color

On an iPhone, Safari's toolbar at the bottom of the screen stays the page's dark color while an options sheet rises, is open or closes, and while a question card is up. (It once turned red, taking its color from a red button on a rising sheet.)

- Risk: medium
- Check: phone
- Layout: phone. Only iPhone Safari colors its toolbar from the page.
- Added: 1.10 baseline
- Changed: none
- Anchors: `.sheet-layer`, `.alert-layer`, `#cornerShotsSheet`, `#pairPrompt`
- Source: `css/app.css` (the sheet part: the sheet's layer is placed against the app, never fixed to the screen), `index.html` (the theme-color meta), `js/app/parts/sheet.js` (`openSheet`)
- Cases: 2

### LAY-13.1 Safari's toolbar stays dark as sheets and cards come and go   [phone]
Before you start:
- Device and browser: an iPhone with iOS 26, Safari, its address bar at the bottom
- Build: the live site, https://rberrill.github.io/p1hunt_card_finisher/
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Open **Export options**, then close them | Safari's toolbar stays the page's dark gray while the sheet rises, is open and closes |
| 2 | Tap **Corner shots**, then close its sheet | The toolbar stays dark, never red |
| 3 | Tap **Download** to bring up "Upscale to 2000 px?", then **Cancel** | The toolbar stays dark while the card is up |

Pass: every row's result is seen.
On a fail, record: the row number, a screenshot showing the toolbar.

### LAY-13.2 An open sheet is placed against the app, never fixed to the screen   [auto: phone, webkit]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with the developer tools open
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step

A sheet fixed to the screen gives Safari a color to take for its toolbar as it rises; one placed against the app doesn't (LAY-13.1 is the real check).

| # | Do this | You should see |
| --- | --- | --- |
| 1 | On each step, open its options and read the sheet's position | Every sheet is placed absolutely, not fixed |
| 2 | On Export, tap **Corner shots** and read its sheet's position | Absolute, not fixed |
| 3 | Read the page's theme color (the theme-color meta in its head) | #161618, the page's dark gray |

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
- Flag: to confirm. A phone in landscape wider than 760 px gets the wide layout, with the side panel and no step tabs along the bottom.
- Cases: 2

### LAY-14.1 Sideways and back, the layout is as it was   [auto: phone, webkit]
Flag: to confirm. Written to what the app does today: sideways, at 844 px wide, the phone shows the wide layout.
Before you start:
- Device and browser: a desktop browser's responsive mode at 390 × 844 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Rotate step, fitted to the screen

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Make the window 844 × 390 px | The wide layout: step tabs in the top bar |
| 2 | Make the window 390 × 844 px again | The phone layout as before: top bar 48 px, photo 544 px, controls 200 px, step tabs 52 px along the bottom, the photo fitted at the same size as before |

Pass: every row's result is seen.
On a fail, record: the row number, the heights measured, a screenshot.

### LAY-14.2 Turning a real iPhone and back restores the layout   [phone]
Flag: to confirm. Written to what the app does today: an iPhone on its side wider than 760 px shows the wide layout.
Before you start:
- Device and browser: an iPhone, Safari, with rotation lock off
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Rotate step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Turn the phone on its side | The layout changes (on a phone wider than 760 px on its side, to the wide one, with the side panel) and the photo is fitted to its new space |
| 2 | Turn the phone upright again | The top bar, the photo, the controls and the step tabs are back in their places and sizes; the photo is fitted; nothing is cut off |

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
- Cases: 2

### LAY-15.1 No step scrolls the page sideways   [auto: both, webkit]
Before you start:
- Device and browser: a phone-width window (390 × 844 px) or a wide one (1280 × 800 px)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | On each step in turn, try to scroll the page sideways | It doesn't move on any step |
| 2 | On a phone, tap **Crop** in the step bar and swipe the row of presets sideways | The row scrolls inside itself (it is wider than the screen); the page stays put |

Pass: every row's result is seen.
On a fail, record: the row number, the step, a screenshot.

### LAY-15.2 No step scrolls the page sideways on a 375 px phone   [auto: small]
Before you start:
- Device and browser: a narrow phone window, 375 × 667 px (an iPhone SE)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | On each step in turn, try to scroll the page sideways | It doesn't move on any step |
| 2 | Tap **Crop** in the step bar and swipe the row of presets sideways | The row scrolls inside itself; the page stays put |

Pass: every row's result is seen.
On a fail, record: the row number, the step, a screenshot.

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
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step

A label left out on purpose is not cut off: on a wide screen narrower than 1120 px, the top bar drops the app's name and **Open**'s label, keeping its icon.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Read every button's label in the top bar, the step tabs and the controls | Each is whole: none ends cut, with an ellipsis or outside its button |
| 2 | Tap each of the other five steps in turn | The same on every step |

Pass: every row's result is seen.
On a fail, record: the row number, the step, the label, a screenshot.

### LAY-16.2 No button label is cut off on a 375 px phone   [auto: small]
Before you start:
- Device and browser: a narrow phone window, 375 × 667 px (an iPhone SE)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Read every button's label in the top bar, the step tabs and the controls | Each is whole |
| 2 | Tap each of the other five steps in turn | The same on every step |

Pass: every row's result is seen.
On a fail, record: the row number, the step, the label, a screenshot.
