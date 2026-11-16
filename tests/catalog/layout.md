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
- Cases: none yet

## LAY-02 Phone: fixed heights, so the photo never changes size

On the phone the screen is, from the top: a 48 px top bar, the photo, a 200 px block of controls in three rows, and a 52 px row of six step tabs. The block of controls is the same height on every step, so the photo stays the same size when you change step.

- Risk: high
- Check: script
- Layout: phone. The wide layout has no block of controls under the photo (LAY-03).
- Added: 1.10 baseline
- Changed: none
- Anchors: `.top-bar`, `.control-area`, `.tab-bar`, `#view`
- Source: `css/app.css` (the top bar, adjustment line and tab bar parts, and the phone block)
- Cases: none yet

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
- Cases: none yet

## LAY-04 Space kept clear of the iPhone's rounded corners and notch

On an iPhone the app keeps clear of the screen's unsafe edges: padding at the top, left and right of the whole app, and at the bottom of the step tabs, the options sheets, the tuning panel and the question card.

- Risk: medium
- Check: phone
- Layout: phone. Only an iPhone (or a device with a notch) has unsafe edges; elsewhere the padding is zero.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#app`, `.tab-bar`, `.sheet`, `.alert-layer`
- Source: `index.html` (the viewport meta, `viewport-fit=cover`), `css/app.css` (`#app`, the tab bar, sheet and alert card parts, `#debugPanel` in the phone block)
- Cases: none yet

## LAY-05 The app fills the screen as Safari's bars come and go

On an iPhone the app fills exactly the visible screen as Safari's address bar and toolbar show and hide, and the page never bounces or rubber-bands when dragged at its edges.

- Risk: high
- Check: phone
- Layout: phone. A desktop browser has no bars that come and go.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#app`
- Source: `css/app.css` (`html, body`, `#app`)
- Cases: none yet

## LAY-06 Every touch control is at least 44 px

Every control you can touch on the phone is at least 44 px in both directions. The tab above the controls that opens the options sheet has a target of 88 × 44 px.

- Risk: medium
- Check: script
- Layout: phone. On a wide screen a few top-bar controls are 36 px (LAY-03); a mouse does not need the larger target.
- Added: 1.10 baseline
- Changed: none
- Anchors: `.grabber`, `.icon-button`, `.step-tab`, `.nudge-key`
- Source: `css/app.css` (the top bar, tab bar, adjustment line, tool, slider, chip, segmented control, nudge pad and sheet parts)
- Cases: none yet

## LAY-07 Nothing covers the photo unless you asked for it

Nothing sits over the photo except an options sheet you opened or a question you must answer. A message shown over the photo's bottom edge never takes a touch, so the photo under it still works.

- Risk: medium
- Check: script
- Layout: both. On a wide screen the options are in the side panel, so only a question card covers the photo.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#toast`, `.sheet-layer`, `.alert-layer`, `#pairPrompt`
- Source: `js/app/parts/toast.js` (`buildToast`), `js/app/core.js` (`toast`, `placeToast`), `css/app.css` (the toast, sheet and alert card parts)
- Cases: none yet

## LAY-08 The six step tabs fit on a small phone

On screens narrower than 390 px the step tabs' labels drop to 11 px, and all six still fit on one row without being cut.

- Risk: low
- Check: script
- Layout: phone. On a wide screen the step tabs are in the top bar (LAY-03).
- Added: 1.10 baseline
- Changed: none
- Anchors: `.step-tab`, `.step-tab-label`
- Source: `css/app.css` (the `max-width: 389px` block)
- Cases: none yet

## LAY-09 Export's options fit without scrolling

On the phone, Export's options sheet shows everything down to its **Tips** row without scrolling.

- Risk: low
- Check: script
- Layout: phone. On a wide screen the options are listed in the side panel, which scrolls (LAY-03).
- Added: 1.10 baseline
- Changed: none
- Anchors: `#exportSheet`, `"Export options"`, `"Tips"`
- Source: `css/app.css` (the Export step's phone block), `js/app/export-controls.js` (`buildExportControls`)
- Cases: none yet

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
- Cases: none yet

## LAY-11 The brand look

The app looks like P1Hunt: matte black and white, red for main actions, a solid white fill for the selected thing, amber only on a warning, and flat shapes with no gradients.

- Risk: medium
- Check: eye
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.theme.accent`, `CONFIG.theme.warn`, `CONFIG.theme.ink`, `CONFIG.theme.page`
- Source: `css/app.css` (`:root`), `js/config.js` (`CONFIG.theme`), `js/app/core.js` (the theme written to the page at load)
- Flag: to confirm. `CONFIG.theme` still holds six colors of the old layout whose page colors are no longer used, and some comments still say "one red" after the brand rule changed.
- Cases: none yet

## LAY-12 Motion feels right on a real phone

On a real iPhone the options sheet follows the finger as it is dragged, the two-part switches' white pill slides, question cards fade in and out, and nothing stutters.

- Risk: low
- Check: phone
- Layout: phone
- Added: 1.10 baseline
- Changed: none
- Anchors: `.sheet-layer`, `.alert-layer`, `.segment-thumb`
- Source: `js/app/parts/sheet.js` (`bindSheetHandle`, `openSheet`, `closeSheet`), `js/app/parts/alert-card.js` (`showAlert`, `hideAlert`), `js/app/parts/segmented-control.js` (`buildSegmented`)
- Cases: none yet

## LAY-13 Safari's toolbar keeps its dark color

On an iPhone, Safari's toolbar at the bottom of the screen stays the page's dark color while an options sheet rises, is open or closes, and while a question card is up. (It once turned red, taking its color from a red button on a rising sheet.)

- Risk: medium
- Check: phone
- Layout: phone. Only iPhone Safari colors its toolbar from the page.
- Added: 1.10 baseline
- Changed: none
- Anchors: `.sheet-layer`, `.alert-layer`, `#cornerShotsSheet`, `#pairPrompt`
- Source: `css/app.css` (the sheet part: the sheet's layer is placed against the app, never fixed to the screen), `index.html` (the theme-color meta), `js/app/parts/sheet.js` (`openSheet`)
- Cases: none yet

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
- Cases: none yet

## LAY-15 The page never scrolls sideways

On every step, at any window size, the page itself never scrolls sideways. (The row of crop presets scrolls sideways inside itself on the phone; the page does not.)

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#app`, `.chip-row`
- Source: `css/app.css` (`#app`, `.stage`, the phone block's `.chip-row`)
- Cases: none yet

## LAY-16 No button label is cut off

No button's label is cut off or overflows its button, in the block of controls under the photo, the side panel, the step tabs or the top bar, on every step, at the phone and wide sizes.

- Risk: medium
- Check: script
- Layout: both. The top bar drops its name and **Open**'s label on narrower wide screens on purpose (an icon stays); that is not a cut-off label.
- Added: 1.10 baseline
- Changed: none
- Anchors: `.action-label`, `.step-tab-label`, `.icon-button-label`
- Source: `js/app/parts/action-button.js` (`buildActionButton`), `js/app/parts/tab-bar.js` (`buildTabBar`), `js/app/parts/top-bar.js` (`buildTopBar`), `css/app.css`
- Cases: none yet
