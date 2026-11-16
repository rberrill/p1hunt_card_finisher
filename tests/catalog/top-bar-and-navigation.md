# Top bar and navigation

The top bar (Open, Undo, Redo, Fit), the six step tabs, each step's options sheet, and the shared pieces every step's controls are built from (messages in place of a step's top line, the progress line, tool tiles).

## TOP-01 Open from the top bar

The folder button in the top bar (tooltip **Open photo**) opens the file picker for a new photo.

- Risk: high
- Check: script
- Layout: both. On a phone it is an icon only; on a wide screen it is a pill with the icon and **Open**.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnOpen`, "Open photo", `#fileInput`
- Source: `js/app/parts/top-bar.js` (`buildTopBar`, `buildIconButton`); `js/app/shell.js` (`bindNavigation`, `pickPhoto`)
- Cases: none yet

## TOP-02 Undo

**Undo** (tooltip "Undo (Ctrl/Cmd+Z)") takes back the last edit. It is dimmed when there is nothing to undo.

- Risk: high
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnUndo`, "Undo (Ctrl/Cmd+Z)", `CONFIG.keys.undo`
- Source: `js/app/parts/top-bar.js` (`buildTopBar`, `updateTopBar`); `js/app/shell.js` (`bindNavigation`, `syncUI`); `js/app/state.js` (`undo`)
- Ruling: R17. While an export runs, **Undo** is dimmed with the save buttons. The app differs today.
- Cases: none yet

## TOP-03 Redo

**Redo** (tooltip "Redo (Shift+Ctrl/Cmd+Z)") puts back the last undone edit. It is dimmed when there is nothing to redo.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnRedo`, "Redo (Shift+Ctrl/Cmd+Z)", `CONFIG.keys.redo`
- Source: `js/app/parts/top-bar.js` (`buildTopBar`, `updateTopBar`); `js/app/shell.js` (`bindNavigation`, `syncUI`); `js/app/state.js` (`redo`)
- Ruling: R17. While an export runs, **Redo** is dimmed with the save buttons. The app differs today.
- Flag: to confirm. The tooltip names only Shift+Ctrl/Cmd+Z, though Ctrl/Cmd+Y also redoes.
- Cases: none yet

## TOP-04 What makes an undo step

Every edit is one undo step. A change that leaves the edits exactly as they were records nothing, and a new edit clears what **Redo** could put back.

- Risk: high
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnUndo`, `#btnRedo`
- Source: `js/app/state.js` (`commit`, `History.push`)
- Cases: none yet

## TOP-05 Quick repeats are one undo step

Repeats of the same control within 900 ms (sliding a slider, holding a nudge) are merged into one undo step.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnUndo`
- Source: `js/app/state.js` (`History.push`, `commit`)
- Cases: none yet

## TOP-06 Undo goes back 50 steps

The undo history holds 50 steps; the oldest is dropped when a new one is added.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.historyLimit`, `#btnUndo`
- Source: `js/app/state.js` (`History.push`)
- Cases: none yet

## TOP-07 A drag on the photo is one undo step

Dragging something on the photo (a corner, an edge, the crop box, the logo) is one undo step, recorded when the finger lifts.

- Risk: medium
- Check: script, touch
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#view`, `#btnUndo`
- Source: `js/app/input.js` (`onPointerUp`, `endGesture`); `js/app/state.js` (`commitFrom`)
- Ruling: R8. A drag the browser cancels puts things back as they were, with no undo step. The app differs today.
- Cases: none yet

## TOP-08 What Undo covers

Undo covers the edits only: corners, Flatten, card orientation, rotation, flips, crop, applied levels, the logo's placement and the export settings. It does not cover zoom, the step, the selected handle, **Snap**, **Grid**, Levels' unapplied change, or the corner-shots and pair output choices.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnUndo`, `#toolSnap`, `#rotateGrid`
- Source: `js/app/state.js` (`defaultState`, `undo`, `redo`)
- Cases: none yet

## TOP-09 Fit to screen

**Fit to screen** (tooltip "Fit to screen (F)") puts the current step's photo back to its fitted size and place.

- Risk: medium
- Check: script
- Layout: both. On a phone it shows only while the photo is zoomed or panned; on a wide screen it always shows, dimmed until a photo is open.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnFit`, "Fit to screen (F)", `CONFIG.keys.fit`
- Source: `js/app/parts/top-bar.js` (`buildTopBar`, `updateTopBar`); `js/app/shell.js` (`syncFitButton`, `bindNavigation`); `js/app/view.js` (`fitCurrent`)
- Cases: none yet

## TOP-10 The six step tabs

Six step tabs, in order: **Perspective**, **Rotate**, **Crop**, **Levels**, **Overlay**, **Export**. The current one is marked.

- Risk: high
- Check: script
- Layout: both. On a phone they run along the bottom, an icon over each name, the current one white and bold; on a wide screen they are text pills in the top bar, the current one solid white.
- Added: 1.10 baseline
- Changed: none
- Anchors: `.step-tab`, `#tabBarHost`, `#topBarSteps`
- Source: `js/app/parts/tab-bar.js` (`buildTabBar`, `updateTabBar`); `js/app/shell.js` (`STEPS`, `placeLayout`)
- Cases: none yet

## TOP-11 Switch steps

Tapping a step tab opens that step; only its controls show. The tabs are dimmed and do nothing until a photo is open.

- Risk: high
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `.step-tab`, `#panel`
- Source: `js/app/shell.js` (`bindNavigation`, `setTab`, `syncUI`)
- Ruling: R17. While an export runs the step tabs stay live. The app already does this.
- Cases: none yet

## TOP-12 The Levels mark

While Levels has a change that hasn't been applied, a white dot shows on the **Levels** tab, whichever step is open.

- Risk: medium
- Check: script
- Layout: both. On a phone the dot sits beside the icon; on a wide screen it follows the name, and is dark when Levels is the selected tab.
- Added: 1.10 baseline
- Changed: none
- Anchors: `.step-tab-mark`
- Source: `js/app/parts/tab-bar.js` (`buildTabBar`, `updateTabBar`); `js/app/shell.js` (`syncUI`)
- Cases: none yet

## TOP-13 What a step change resets

Changing step closes any open options sheet, disarms Levels' picker and compare (when leaving Levels), cancels Tap to find card, hides the nudge magnifier, clears Overlay's file error (when leaving Overlay) and saves the edits shortly after.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `.step-tab`, `#btnFindCard`, `.sheet-layer`
- Source: `js/app/shell.js` (`setTab`, `closeSheets`)
- Flag: to confirm. Perspective's **Preview** stays on across step changes, though Tap to find card, the picker and compare are cleared.
- Cases: none yet

## TOP-14 Controls with no photo

With no photo open, every control in the step panel is disabled, and a disabled control shows at 38% opacity.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#panel`, `.tool`, `.action-button`
- Source: `js/app/shell.js` (`syncUI`); `css/app.css` (the shared button rules)
- Cases: none yet

## TOP-15 Top bar order

The top bar's controls run in a fixed order.

- Risk: low
- Check: script
- Layout: both. On a phone: Open, the Front and Back switch, **Unpair**, **Fit to screen**, **Undo**, **Redo**. On a wide screen: the app's name, **Open**, the steps, the Front and Back switch, **Unpair**, **Undo**, **Redo**, **Fit to screen**.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnOpen`, `#sideSwitch`, `#btnUnpair`, `#btnFit`
- Source: `js/app/parts/top-bar.js` (`buildTopBar`); `css/app.css` (the shell's wide block)
- Flag: to confirm. **Fit to screen** comes before **Undo** and **Redo** on a phone but after them on a wide screen.
- Cases: none yet

## TOP-16 App name and version

The top bar shows the app icon and **Card Finisher**; hovering it shows "Version" and the app's version.

- Risk: low
- Check: script
- Layout: wide. Not shown on a phone.
- Added: 1.10 baseline
- Changed: none
- Anchors: `.top-bar-brand`, "Card Finisher", "Version ", `CONFIG.appVersion`
- Source: `js/app/parts/top-bar.js` (`buildBrand`); `js/app/main.js` (`init`)
- Cases: none yet

## TOP-17 The top bar fits every wide width

The top bar fits at every wide width, with a pair open too. At 1119 px wide and under, the app's name and Open's label go; at 899 px and under, the app icon goes too and the gaps tighten. Nothing overlaps.

- Risk: medium
- Check: script
- Layout: wide
- Added: 1.10 baseline
- Changed: none
- Anchors: `.top-bar-brand`, `.icon-button-label`, `#topBarSteps`
- Source: `css/app.css` (the top bar's narrower-wide blocks)
- Cases: none yet

## TOP-18 Open a step's options

A tab with an up arrow sits on the top edge of the controls, over the bottom of the photo (named **Options** to a screen reader). A tap on it opens the step's options sheet.

- Risk: high
- Check: script, touch. The tab's exact look (80 px wide, rising 24 px over the photo, in the panel's color, outlined on its top and sides, with a 16 × 8 px up arrow) is measurable by a script, not left to the eye.
- Layout: phone
- Added: 1.10 baseline
- Changed: none
- Anchors: `.grabber`, "Options", `.handle-tab`
- Source: `js/app/parts/adjustment-line.js` (`buildControlArea`); `js/app/parts/sheet.js` (`buildHandleTab`, `bindSheetHandle`, `openSheet`); `js/app/shell.js` (`bindNavigation`, `currentSheet`)
- Cases: none yet

## TOP-19 Drag the options sheet open or closed

Dragging the tab with the up arrow upward pulls the sheet up under the finger. Let go past a third of the way and it opens, short of that it drops back. An open sheet dragged down past a third closes. A drag the browser cancels puts the sheet back as it was.

- Risk: medium
- Check: script, touch
- Layout: phone
- Added: 1.10 baseline
- Changed: none
- Anchors: `.grabber`, `.sheet-layer`, `.sheet-grabber`
- Source: `js/app/parts/sheet.js` (`bindSheetHandle`, `dragTo`, `settleSheet`, `sheetTravelPx`)
- Cases: none yet

## TOP-20 The arrow flattens as the sheet rises

The tab's up arrow flattens into a flat bar as the sheet rises (flat at 40% of the way) and stays a flat bar while the sheet is open. While a sheet is up, only the sheet's own tab shows.

- Risk: low
- Check: script, eye. The two resting shapes and the hidden second tab are measurable; the flattening during a drag needs an eye.
- Layout: phone
- Added: 1.10 baseline
- Changed: none
- Anchors: `.handle-glyph`, `.handle-arm`, `.sheet-grabber`
- Source: `js/app/parts/sheet.js` (`shapeGlyph`, `clearGlyph`, `dragTo`); `css/app.css` (the sheet and the shell's phone block)
- Cases: none yet

## TOP-21 A handle under the options tab wins

A press on the options tab that lands on something drawn on the photo (a Perspective corner or edge handle, a crop handle, the logo's corner or a snap ring) goes to the photo, not the sheet.

- Risk: medium
- Check: script, touch
- Layout: phone
- Added: 1.10 baseline
- Changed: none
- Anchors: `.grabber`, `#view`
- Source: `js/app/shell.js` (`bindNavigation`); `js/app/input.js` (`hitsPhotoControl`)
- Cases: none yet

## TOP-22 Controls under the options tab take the tap

Where a control in a step's top line (a button, a slider, **Size** and **Format** on Export, Rotate's angle) lies under the options tab's 88 × 44 px touch area, the control takes the tap, and the tab's touch area reaches further over the photo instead.

- Risk: medium
- Check: script, touch
- Layout: phone
- Added: 1.10 baseline
- Changed: none
- Anchors: `.grabber`, `#exportChoices`, `#rotateAngle`, `.label-row`
- Source: `css/app.css` (the adjustment line, Export's phone block, the shell's phone block)
- Cases: none yet

## TOP-23 The open sheet covers part of the photo

An open options sheet covers the lower part of the photo and is at most 470 px tall; taller content scrolls inside it. The photo does not resize.

- Risk: medium
- Check: script
- Layout: phone
- Added: 1.10 baseline
- Changed: none
- Anchors: `.sheet-layer`, `.sheet-body`, `#view`
- Source: `js/app/parts/sheet.js` (`buildSheet`); `css/app.css` (the sheet)
- Cases: none yet

## TOP-24 Focus moves into an opened sheet

Opening a sheet moves keyboard focus to its close button. A closed sheet is hidden once its slide down ends.

- Risk: low
- Check: script
- Layout: phone
- Added: 1.10 baseline
- Changed: none
- Anchors: `.sheet-close`, `.sheet-layer`
- Source: `js/app/parts/sheet.js` (`openSheet`, `closeSheet`, `hideWhenSettled`)
- Cases: none yet

## TOP-25 Close a sheet with its close button

The cross at the top right of a sheet (named **Close**) closes it.

- Risk: medium
- Check: script
- Layout: phone
- Added: 1.10 baseline
- Changed: none
- Anchors: `.sheet-close`, "Close"
- Source: `js/app/parts/sheet.js` (`buildSheet`, `closeSheet`)
- Cases: none yet

## TOP-26 Close a sheet by tapping outside it

A tap on the dimmed area outside an open sheet closes it; the press must begin on the dimmed area.

- Risk: medium
- Check: script, touch
- Layout: phone
- Added: 1.10 baseline
- Changed: none
- Anchors: `.sheet-scrim`
- Source: `js/app/parts/sheet.js` (`buildSheet`, `closeSheet`)
- Cases: none yet

## TOP-27 Close a sheet from its top edge

Dragging down on an open sheet's tab or title, or tapping either, closes it.

- Risk: low
- Check: script, touch
- Layout: phone
- Added: 1.10 baseline
- Changed: none
- Anchors: `.sheet-grabber`, `.sheet-header`
- Source: `js/app/parts/sheet.js` (`buildSheet`, `bindSheetHandle`)
- Flag: to confirm. A plain tap on an open sheet's title closes the sheet.
- Cases: none yet

## TOP-28 Sheets close by themselves

An open sheet also closes on a step change, when **Tap to find card** is armed, when **Corner shots** opens its own sheet, and when the window narrows to the phone layout.

- Risk: low
- Check: script
- Layout: phone
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnFindCard`, `#btnCornerShots`, `.sheet-layer`
- Source: `js/app/shell.js` (`setTab`, `closeSheets`, `placeLayout`); `js/app/perspective.js` (`bindPerspective`); `js/app/corner-shots.js` (`openCornerShots`)
- Cases: none yet

## TOP-29 The dim behind a sheet

The dim behind an open sheet covers the whole app, the top bar included.

- Risk: low
- Check: script
- Layout: phone
- Added: 1.10 baseline
- Changed: none
- Anchors: `.sheet-scrim`, `.sheet-layer`, `#topBarHost`
- Source: `css/app.css` (the sheet, the shell's phone block)
- Cases: none yet

## TOP-30 Options always open on a wide screen

On a wide screen every step's options are always open, listed in the side panel under the step's controls, with no options tab, dim or close button. The sheet's title shows as a grey heading (none where the options are only tips, as on Overlay).

- Risk: medium
- Check: script
- Layout: wide
- Added: 1.10 baseline
- Changed: none
- Anchors: `.sheet-layer`, "Perspective options", "Export options", `#panel`
- Source: `js/app/shell.js` (`placeLayout`); `css/app.css` (the shell's wide block)
- Cases: none yet

## TOP-31 Tips

A **Tips** row in a step's options opens that step's tips in place, under the row; another tap closes them.

- Risk: low
- Check: script
- Layout: both. On a phone the row opens and closes the tips; on a wide screen the row is hidden and the tips are always open.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#perspectiveTips`, `#rotateTips`, `#cropTips`, `#exportTips`
- Source: `js/app/parts/sheet.js` (`buildTipsRow`, `buildTipHint`); `css/app.css` (the shell's wide block)
- Cases: none yet

## TOP-32 Keyboard help

Each step's keyboard help sits in its own block under **Tips and keys** (just **Tips** on a step without keys). Tips that only apply to touch are left out.

- Risk: low
- Check: script
- Layout: wide. A phone shows no keyboard help.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Tips and keys", `.sheet-keys`, `.is-phone-only`
- Source: `js/app/parts/sheet.js` (`buildTipsRow`); `js/app/levels.js` (`buildLevelsSheet`); `css/app.css` (the shell's wide block)
- Flag: to confirm. On a wide screen Levels shows two tips headings, "Levels tips" and "Tips and keys".
- Cases: none yet

## TOP-33 Messages in place of a step's top line

While a step has a message to show, it takes the place of the step's top line (the name and value): an icon for its kind (grey for information, amber for a warning, red for an error), at most two lines of text, and at most one small button.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#perspectiveStatus`, `#perspectiveStatusAction`, `#overlayStatus`, `.status-line`
- Source: `js/app/parts/status.js` (`buildStatus`, `updateStatus`)
- Flag: to confirm. Any message hides Perspective's confidence figure, and some messages give nothing to act on ("Detecting…", the clamp notice).
- Cases: none yet

## TOP-34 The progress line

While an export or the corner shots render, a 3 px red line grows from left to right along the top edge of the controls, or of the open sheet; screen readers read it as a progress bar. It fades out when the work ends.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `.progress-line`, `.is-done`
- Source: `js/app/parts/progress-line.js` (`buildProgressLine`, `updateProgressLine`, `endProgressLine`)
- Cases: none yet

## TOP-35 The three kinds of tool

The tiles along the bottom of each step's controls come in three kinds that look different: a mode fills white while it is selected, an action flashes for 150 ms when tapped, and a switch shows **On** or **Off** in its corner.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `.tool-mode`, `.tool-switch`, `.tool-state`, `.is-flashing`
- Source: `js/app/parts/tool.js` (`buildTool`, `updateTool`, `flashTool`)
- Cases: none yet

## TOP-36 Mode changes and step changes fade

Tapping a mode tile lights it at once and swaps the controls above it with a short fade; tapping the mode already selected does nothing. Changing step fades the new step's controls in.

- Risk: low
- Check: eye
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#toolNudge`, `#toolFlatten`, `.is-leaving`, `.is-arriving`
- Source: `js/app/parts/adjustment-line.js` (`swapLine`, `fadeInControlArea`); `js/app/perspective.js` (`bindPerspectiveTools`); `js/app/rotate.js` (`setRotateMode`)
- Flag: to confirm. With **Preview** on, Perspective's two mode tiles are dimmed, so the swap can't be reached then.
- Cases: none yet

## TOP-37 Hover fills

With a mouse (or any pointer that can hover), tools, buttons, presets, two-part switches, step tabs and sheet rows take a fill while the pointer is over them; a dimmed control and a selected one don't change.

- Risk: low
- Check: eye
- Layout: both, with a mouse only. **Open**'s pill fill on hover is wide only.
- Added: 1.10 baseline
- Changed: none
- Anchors: `.tool`, `.step-tab`, `.sheet-row`, `#btnOpen`
- Source: `css/app.css` (the shell's hover block)
- Cases: none yet
