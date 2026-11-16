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
- Cases: 2

### TOP-01.1 Open in the top bar opens a second photo   [auto: phone, webkit]
Before you start:
- Device and browser: a phone-width window
- Build: the build under test
- Photos: 01_chrome_flat_black.JPEG and IMG_9136.JPEG from samples/
- Starting screen: 01_chrome_flat_black.JPEG open, on the Rotate step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap the folder at the left of the top bar (tooltip "Open photo") | The device's photo picker opens |
| 2 | Choose IMG_9136.JPEG | IMG_9136.JPEG is on screen, on the Perspective step, with its corners on the card |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### TOP-01.2 Open is an icon on a phone and a pill with its name on a wide screen   [auto: both]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the left end of the top bar | On a phone: a folder icon alone, 44 × 44 px. On a wide screen: a rounded pill holding the folder icon and the word **Open** |
| 2 | Hold the pointer over it (a wide screen), or read its name with a screen reader (a phone) | Its name is "Open photo" |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

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
- Cases: 2

### TOP-02.1 Undo takes back the last edit and is greyed out when there is none   [auto: phone]
Before you start:
- Device and browser: a phone-width window
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo just opened, on the Rotate step (tap **Rotate** in the step bar)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at **Undo** (the arrow curving left, near the right end of the top bar) | It is greyed out; its name is "Undo" and its tooltip "Undo (Ctrl/Cmd+Z)" |
| 2 | Tap **90° right** | The photo turns a quarter turn clockwise; **Undo** is no longer greyed out |
| 3 | Tap **Undo** | The photo is back the right way up; **Undo** is greyed out again |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### TOP-02.2 Undo is greyed out while an export runs   [auto: phone]
Written to ruling R17; it fails until that is built (BUG-013).

Before you start:
- Device and browser: a phone-width window
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step, **2000** selected

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **1080** | **1080** is selected; **Undo** is live |
| 2 | Tap **Download**, and watch **Undo** while the red line runs along the top of the controls | **Undo** is greyed out for as long as the line runs |
| 3 | Wait for the file to be saved | **Undo** is live again |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

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
- Cases: 3

### TOP-03.1 Redo puts back what Undo took back, and is greyed out when there is none   [auto: phone]
Before you start:
- Device and browser: a phone-width window
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo just opened, on the Rotate step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at **Redo** (the arrow curving right, at the right end of the top bar) | It is greyed out; its name is "Redo" and its tooltip "Redo (Shift+Ctrl/Cmd+Z)" |
| 2 | Tap **90° right**, then **Undo** | The photo is the right way up; **Redo** is live |
| 3 | Tap **Redo** | The photo is turned a quarter turn clockwise again; **Redo** is greyed out |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### TOP-03.2 Redo is greyed out while an export runs   [auto: phone]
Written to ruling R17; it fails until that is built (BUG-013).

Before you start:
- Device and browser: a phone-width window
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step, **2000** selected

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **1080**, then **Undo** | **2000** is selected; **Redo** is live |
| 2 | Tap **Download**, and watch **Redo** while the red line runs along the top of the controls | **Redo** is greyed out for as long as the line runs |
| 3 | Wait for the file to be saved | **Redo** is live again |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### TOP-03.3 Ctrl+Y redoes too, though the tooltip names only Shift+Ctrl+Z   [auto: desktop]
Flag: to confirm. Written to today's behavior: the tooltip names only Shift+Ctrl/Cmd+Z, though Ctrl/Cmd+Y also redoes.

Before you start:
- Device and browser: a wide window with a keyboard and a mouse
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo just opened, on the Rotate step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Hold the mouse over **Redo** | The tooltip reads "Redo (Shift+Ctrl/Cmd+Z)", with no mention of Ctrl+Y |
| 2 | Click **90° right**, then **Undo** | The photo is the right way up; **Redo** is live |
| 3 | Press Ctrl+Y (Cmd+Y on a Mac) | The photo is turned a quarter turn clockwise again; **Redo** is greyed out |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## TOP-04 What makes an undo step

Every edit is one undo step. A change that leaves the edits exactly as they were records nothing, and a new edit clears what **Redo** could put back.

- Risk: high
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnUndo`, `#btnRedo`
- Source: `js/app/state.js` (`commit`, `History.push`)
- Cases: 2

### TOP-04.1 A change that changes nothing makes no undo step   [auto: phone]
Before you start:
- Device and browser: a phone-width window
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo just opened, on the Rotate step, the angle at 0.0° (**Undo** greyed out)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap the angle (**0.0°**) | A text box takes the angle's place |
| 2 | Type 0 and tap **Done** | The angle still reads 0.0°; **Undo** is still greyed out |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### TOP-04.2 A new edit clears what Redo could put back   [auto: phone]
Before you start:
- Device and browser: a phone-width window
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo just opened, on the Rotate step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **90° right**, then **Undo** | The photo is the right way up; **Redo** is live |
| 2 | Tap **90° left** | The photo turns a quarter turn counterclockwise; **Redo** is greyed out |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## TOP-05 Quick repeats are one undo step

Repeats of the same control within 900 ms (sliding a slider, holding a nudge) are merged into one undo step.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnUndo`
- Source: `js/app/state.js` (`History.push`, `commit`)
- Cases: 1

### TOP-05.1 Quick nudges are one undo step; a pause starts a new one   [auto: phone]
Before you start:
- Device and browser: a phone-width window
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo just opened, on the Perspective step; the line reads NUDGE Corner 1 of 4 (the top-left corner is selected)

The arrow buttons are the four arrows in the row under the line; **Nudge right** is the right-hand one.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Nudge right** three times, quickly (all three within half a second) | The top-left corner has moved right three times |
| 2 | Tap **Undo** once | The corner is back where it started; **Undo** is greyed out |
| 3 | Tap **Nudge right**, wait 1.5 seconds, and tap it again | The corner has moved right twice |
| 4 | Tap **Undo** once | The corner is one nudge right of where it started: only the second tap was undone |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## TOP-06 Undo goes back 50 steps

The undo history holds 50 steps; the oldest is dropped when a new one is added.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.historyLimit`, `#btnUndo`
- Source: `js/app/state.js` (`History.push`)
- Cases: 1

### TOP-06.1 Undo goes back 50 steps and no further   [auto: phone]
Before you start:
- Device and browser: a phone-width window
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo just opened, on the Rotate step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **90° right** 52 times | The photo is the right way up (52 quarter turns); **Undo** is live |
| 2 | Tap **Undo** 50 times | The photo is upside down: the state after the second quarter turn |
| 3 | Look at **Undo** | It is greyed out: the first two turns can't be undone |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

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
- Cases: 2

### TOP-07.1 A drag becomes an undo step when the finger lifts   [auto: phone, webkit]
Before you start:
- Device and browser: a phone-width window
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo just opened, on the Perspective step (**Undo** greyed out)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Put a finger on the top-left corner ring and drag it 40 px down, without lifting | The corner follows the finger; **Undo** is still greyed out |
| 2 | Lift the finger | **Undo** is live |
| 3 | Tap **Undo** once | The corner is back where it was; **Undo** is greyed out |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### TOP-07.2 A drag the phone cancels makes no undo step   [auto: phone]
Written to ruling R8; it fails until that is built (BUG-060).

Before you start:
- Device and browser: an iPhone, Safari (the script uses a phone-width window and has the browser cancel the touch)
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo just opened, on the Perspective step (**Undo** greyed out)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Put a finger on the top-left corner ring and drag it 40 px down, without lifting | The corner follows the finger |
| 2 | Without lifting that finger, swipe down from the top-right corner of the screen with another, so the phone opens Control Center and takes the touch | Control Center opens |
| 3 | Close Control Center | **Undo** is still greyed out, and the corner is back where it was |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## TOP-08 What Undo covers

Undo covers the edits only: corners, Flatten, card orientation, rotation, flips, crop, applied levels, the logo's placement and the export settings. It does not cover zoom, the step, the selected handle, **Snap**, **Grid**, Levels' unapplied change, or the corner-shots and pair output choices.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnUndo`, `#toolSnap`, `#rotateGrid`
- Source: `js/app/state.js` (`defaultState`, `undo`, `redo`)
- Cases: 2

### TOP-08.1 Zoom, steps, Snap, Grid and an unapplied Levels change make no undo step   [auto: phone]
Before you start:
- Device and browser: a phone-width window
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo just opened, on the Perspective step (**Undo** greyed out)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Spread two fingers apart on the photo | The photo zooms in; **Undo** is greyed out |
| 2 | Tap **Snap** | **Snap** reads On; **Undo** is greyed out |
| 3 | Tap **Rotate** in the step bar, open its options (the tab with an up arrow on the top edge of the controls) and turn **Grid** off | The grid lines go from the photo; **Undo** is greyed out |
| 4 | Close the options with the cross, tap **Levels**, then **Auto** | The photo's colors change and a white dot shows on the **Levels** tab; **Undo** is greyed out |
| 5 | Tap **Apply** | The dot goes; **Undo** is live |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### TOP-08.2 Undo takes back a flip, a crop and an export setting, newest first   [auto: phone]
Before you start:
- Device and browser: a phone-width window
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo just opened, on the Rotate step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Flip**, then **Horizontal** | The photo is mirrored left to right |
| 2 | Tap **Crop** in the step bar, then the **4:5** preset | **4:5** is selected |
| 3 | Tap **Export** in the step bar, then **3000** | **3000** is selected |
| 4 | Tap **Undo** | **2000** is selected again |
| 5 | Tap **Crop**, then **Undo** | **1:1** is selected again |
| 6 | Tap **Undo** | The photo is no longer mirrored; **Undo** is greyed out |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## TOP-09 Fit to screen

**Fit to screen** (tooltip "Fit to screen (F)") puts the current step's photo back to its fitted size and place.

- Risk: medium
- Check: script
- Layout: both. On a phone it shows only while the photo is zoomed or panned; on a wide screen it always shows, dimmed until a photo is open.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnFit`, "Fit to screen (F)", `CONFIG.keys.fit`
- Source: `js/app/parts/top-bar.js` (`buildTopBar`, `updateTopBar`); `js/app/shell.js` (`syncFitButton`, `bindNavigation`); `js/app/view.js` (`fitCurrent`)
- Cases: 2

### TOP-09.1 On a phone, Fit shows only while the photo is zoomed or moved, and fits it   [auto: phone]
Before you start:
- Device and browser: a phone-width window
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo just opened, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the top bar | There is no **Fit to screen** button (four corner brackets) |
| 2 | Spread two fingers apart on the photo | The photo zooms in; **Fit to screen** shows, left of **Undo** |
| 3 | Tap **Fit to screen** | The photo is back at its fitted size and place; **Fit to screen** has gone |
| 4 | Drag an empty part of the photo 60 px to the right | The photo moves; **Fit to screen** shows |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### TOP-09.2 On a wide screen, Fit always shows, greyed out until a photo is open   [auto: desktop]
Before you start:
- Device and browser: a wide window with a mouse
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the app just opened, no photo

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the right end of the top bar | **Fit to screen** shows, greyed out; its tooltip reads "Fit to screen (F)" |
| 2 | Open 01_chrome_flat_black.JPEG | **Fit to screen** is live |
| 3 | Roll the mouse wheel away from you over the photo | The photo zooms in |
| 4 | Click **Fit to screen** | The photo is back at its fitted size and place; **Fit to screen** still shows |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## TOP-10 The six step tabs

Six step tabs, in order: **Perspective**, **Rotate**, **Crop**, **Levels**, **Overlay**, **Export**. The current one is marked.

- Risk: high
- Check: script
- Layout: both. On a phone they run along the bottom, an icon over each name, the current one white and bold; on a wide screen they are text pills in the top bar, the current one solid white.
- Added: 1.10 baseline
- Changed: none
- Anchors: `.step-tab`, `#tabBarHost`, `#topBarSteps`
- Source: `js/app/parts/tab-bar.js` (`buildTabBar`, `updateTabBar`); `js/app/shell.js` (`STEPS`, `placeLayout`)
- Cases: 1

### TOP-10.1 The six step tabs, in order, with the current one marked   [auto: both]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo just opened, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the step tabs | Six tabs, in order: **Perspective**, **Rotate**, **Crop**, **Levels**, **Overlay**, **Export**. On a phone they run along the bottom of the screen, each an icon over its name. On a wide screen they are text in a rounded bar in the top bar, with no icons |
| 2 | Look at **Perspective** | On a phone its name is white and bold, the others grey. On a wide screen it is a solid white pill with dark text |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

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
- Cases: 3

### TOP-11.1 A step tab opens that step's controls only   [auto: phone]
Before you start:
- Device and browser: a phone-width window
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo just opened, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Rotate** in the step bar | **Rotate** is marked; the controls show STRAIGHTEN and the ruler; Perspective's controls have gone |
| 2 | Tap **Export** | **Export** is marked; the controls show the sizes and **Download**; Rotate's controls have gone |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### TOP-11.2 The step tabs are greyed out and do nothing with no photo open   [auto: desktop]
Before you start:
- Device and browser: a wide window with a mouse (a phone shows no step tabs before a photo is open)
- Build: the build under test
- Starting screen: the app just opened, no photo

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the step tabs in the top bar | All six are greyed out |
| 2 | Click **Export** | Nothing changes: **Perspective** is still the marked step |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### TOP-11.3 The step tabs stay live while an export runs   [auto: phone]
Before you start:
- Device and browser: a phone-width window
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Download**, and watch the step tabs while the red line runs along the top of the controls | No step tab is greyed out |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## TOP-12 The Levels mark

While Levels has a change that hasn't been applied, a white dot shows on the **Levels** tab, whichever step is open.

- Risk: medium
- Check: script
- Layout: both. On a phone the dot sits beside the icon; on a wide screen it follows the name, and is dark when Levels is the selected tab.
- Added: 1.10 baseline
- Changed: none
- Anchors: `.step-tab-mark`
- Source: `js/app/parts/tab-bar.js` (`buildTabBar`, `updateTabBar`); `js/app/shell.js` (`syncUI`)
- Cases: 2

### TOP-12.1 The Levels dot shows on every step until the change is applied   [auto: phone]
Before you start:
- Device and browser: a phone-width window
- Build: the build under test
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step, no levels set

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Auto** | A white dot shows beside the icon of the **Levels** tab |
| 2 | Tap **Export** in the step bar | The dot still shows on the **Levels** tab |
| 3 | Tap **Levels**, then **Apply** | The dot has gone |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### TOP-12.2 On a wide screen the dot follows the name, dark while Levels is selected   [auto: desktop]
Before you start:
- Device and browser: a wide window with a mouse
- Build: the build under test
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step, no levels set

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Click **Auto** | A dot shows right after the word **Levels** in its white pill; the dot is dark |
| 2 | Click **Export** in the top bar | The **Levels** tab is no longer white; its dot is white |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

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
- Cases: 4

### TOP-13.1 Changing step cancels Tap to find card   [auto: phone]
Before you start:
- Device and browser: a phone-width window
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Open the options (the tab with an up arrow on the top edge of the controls) and tap **Tap to find card** | The options close; the line reads "Tap the card in the photo." with **Cancel** |
| 2 | Tap **Rotate** in the step bar, then **Perspective** | The line reads NUDGE again; "Tap the card in the photo." has gone |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### TOP-13.2 Leaving Levels disarms the picker   [auto: phone]
Before you start:
- Device and browser: a phone-width window
- Build: the build under test
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Pick white** | **Pick white** is selected; the line reads "Tap something white" |
| 2 | Tap **Export** in the step bar, then **Levels** | Neither **Pick white** nor **Pick black** is selected |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### TOP-13.3 Changing step with a key closes the open options   [auto: phone]
Before you start:
- Device and browser: a phone-width window with a keyboard
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Rotate step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Open Rotate's options (the tab with an up arrow on the top edge of the controls) | The sheet titled ROTATE OPTIONS rises |
| 2 | Press 3 | The Crop step is open, and no sheet is open |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### TOP-13.4 Preview stays on across a step change   [auto: phone]
Flag: to confirm. Written to today's behavior: Perspective's **Preview** stays on when the step changes, though Tap to find card, the picker and compare are cleared.

Before you start:
- Device and browser: a phone-width window
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Preview** | **Preview** reads On; the corrected card shows with no handles |
| 2 | Tap **Rotate** in the step bar, then **Perspective** | **Preview** still reads On, and the corrected card still shows |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## TOP-14 Controls with no photo

With no photo open, every control in the step panel is disabled, and a disabled control shows at 38% opacity.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#panel`, `.tool`, `.action-button`
- Source: `js/app/shell.js` (`syncUI`); `css/app.css` (the shared button rules)
- Cases: 2

### TOP-14.1 With no photo, every control in the side panel is disabled   [auto: desktop]
Before you start:
- Device and browser: a wide window (a phone shows no controls before a photo is open)
- Build: the build under test
- Starting screen: the app just opened, no photo

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the side panel | No step's controls show |
| 2 | Check every button, slider, list and box in the panel (a script reads them) | Every one is disabled |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### TOP-14.2 A disabled control shows at 38% opacity   [auto: phone]
Before you start:
- Device and browser: a phone-width window
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo just opened, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at **Undo** and **Redo** in the top bar | Both are greyed out: drawn at 38% opacity |
| 2 | Tap **Snap** | **Undo** is still at 38%: Snap is not an edit. **Redo** is still at 38% |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

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
- Cases: 1

### TOP-15.1 The top bar's order on a phone and on a wide screen   [auto: both]
Flag: to confirm. Written to today's behavior: **Fit to screen** comes before **Undo** and **Redo** on a phone but after them on a wide screen.

Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: a pair: open the front, tap **Export**, tap **Add back** and choose the back. The back is open on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | On a phone, spread two fingers apart on the photo; on a wide screen, roll the mouse wheel away from you over it | The photo zooms in; **Fit to screen** shows |
| 2 | Read the top bar from left to right | On a phone: Open, **Front** / **Back**, **Unpair**, **Fit to screen**, **Undo**, **Redo**. On a wide screen: the app's icon and name, **Open**, the step tabs, **Front** / **Back**, **Unpair**, **Undo**, **Redo**, **Fit to screen** |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## TOP-16 App name and version

The top bar shows the app icon and **Card Finisher**; hovering it shows "Version" and the app's version.

- Risk: low
- Check: script
- Layout: wide. Not shown on a phone.
- Added: 1.10 baseline
- Changed: none
- Anchors: `.top-bar-brand`, "Card Finisher", "Version ", `CONFIG.appVersion`
- Source: `js/app/parts/top-bar.js` (`buildBrand`); `js/app/main.js` (`init`)
- Cases: 1

### TOP-16.1 The app's name, and its version on hover   [auto: desktop]
Before you start:
- Device and browser: a wide window, 1280 px wide, with a mouse
- Build: the build under test (its version is in Export options, at the foot: "Card Finisher" and the version)
- Starting screen: the app just opened

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the left end of the top bar | The app's icon, then **Card Finisher** |
| 2 | Hold the mouse over it | The tooltip reads "Version " and the build's version, such as Version 1.10.0 |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## TOP-17 The top bar fits every wide width

The top bar fits at every wide width, with a pair open too. At 1119 px wide and under, the app's name and Open's label go; at 899 px and under, the app icon goes too and the gaps tighten. Nothing overlaps.

- Risk: medium
- Check: script
- Layout: wide
- Added: 1.10 baseline
- Changed: none
- Anchors: `.top-bar-brand`, `.icon-button-label`, `#topBarSteps`
- Source: `css/app.css` (the top bar's narrower-wide blocks)
- Cases: 1

### TOP-17.1 The top bar fits from 1280 px down to 761 px, with a pair open   [auto: desktop, webkit]
Before you start:
- Device and browser: a wide window whose width you can set
- Build: the build under test
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: a pair, as in TOP-15.1; the back open, the window 1280 px wide

In each row, check that no two things in the top bar overlap and nothing runs past its right end.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the top bar at 1280 px | The app's icon and name, **Open** with its word, the steps, **Front** / **Back**, **Unpair**, **Undo**, **Redo**, **Fit to screen**; nothing overlaps |
| 2 | Make the window 1119 px wide | The name and the word **Open** have gone; the app's icon and Open's folder stay; nothing overlaps |
| 3 | Make the window 1000 px wide | As at 1119 px; nothing overlaps |
| 4 | Make the window 899 px wide | The app's icon has gone too; nothing overlaps |
| 5 | Make the window 761 px wide | Every control still shows; nothing overlaps or runs past the right end |

Pass: every row's result is seen.
On a fail, record: the row number, the window's width, what you saw instead, a screenshot.

## TOP-18 Open a step's options

A tab with an up arrow sits on the top edge of the controls, over the bottom of the photo (named **Options** to a screen reader). A tap on it opens the step's options sheet.

- Risk: high
- Check: script, touch. The tab's exact look (80 px wide, rising 24 px over the photo, in the panel's color, outlined on its top and sides, with a 16 × 8 px up arrow) is measurable by a script, not left to the eye.
- Layout: phone
- Added: 1.10 baseline
- Changed: none
- Anchors: `.grabber`, "Options", `.handle-tab`, `#perspectiveSheet`, `#rotateSheet`, `#cropSheet`
- Source: `js/app/parts/adjustment-line.js` (`buildControlArea`); `js/app/parts/sheet.js` (`buildHandleTab`, `bindSheetHandle`, `openSheet`); `js/app/shell.js` (`bindNavigation`, `currentSheet`)
- Ruling: R33. Enter and Space open the sheet from the tab, as on any button. The app differs today.
- Cases: 3

### TOP-18.1 Each step's options tab opens that step's sheet   [auto: phone]
Before you start:
- Device and browser: a phone-width window
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Perspective step

The options tab is the tab with an up arrow on the top edge of the controls, over the bottom of the photo. Close each sheet with the cross at its top right before the next row.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap the options tab | A sheet rises over the lower part of the photo, titled PERSPECTIVE OPTIONS |
| 2 | Tap **Rotate** in the step bar, then the options tab | The sheet is titled ROTATE OPTIONS |
| 3 | Do the same on **Crop** | CROP OPTIONS |
| 4 | Do the same on **Levels** | LEVELS TIPS |
| 5 | Do the same on **Overlay** | OVERLAY OPTIONS |
| 6 | Do the same on **Export** | EXPORT OPTIONS |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### TOP-18.2 The options tab's size, place and arrow   [auto: phone, webkit]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Measure the options tab | It is 80 px wide, centered across the screen, and rises 24 px over the photo from the top edge of the controls |
| 2 | Look at its color and outline | It is the controls' own color (#161618), with a 1 px outline (#4a4a52) on its top and sides and none along its foot |
| 3 | Measure its arrow | An up arrow about 16 px wide and 8 px tall, centered in the tab |
| 4 | Read its name with a screen reader | "Options" |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### TOP-18.3 Enter and Space on the options tab open the sheet   [auto: phone]
Written to ruling R33; it fails until that is built (BUG-150).

Before you start:
- Device and browser: a phone-width window with a keyboard (or an iPhone with a keyboard attached)
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Rotate step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Press Tab until the options tab (the tab with an up arrow on the top edge of the controls) has the focus ring | The options tab has the focus |
| 2 | Press Enter | The sheet titled ROTATE OPTIONS rises |
| 3 | Close it with the cross, press Tab until the options tab has the focus again, and press Space | The sheet rises again |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## TOP-19 Drag the options sheet open or closed

Dragging the tab with the up arrow upward pulls the sheet up under the finger. Let go past a third of the way and it opens, short of that it drops back. An open sheet dragged down past a third closes. A drag the browser cancels puts the sheet back as it was.

- Risk: medium
- Check: script, touch
- Layout: phone
- Added: 1.10 baseline
- Changed: none
- Anchors: `.grabber`, `.sheet-layer`, `.sheet-grabber`
- Source: `js/app/parts/sheet.js` (`bindSheetHandle`, `dragTo`, `settleSheet`, `sheetTravelPx`)
- Cases: 2

### TOP-19.1 A drag on the options tab pulls the sheet, and settles it by a third   [auto: phone, webkit]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Perspective step

The sheet's travel is how far its top edge moves between closed (on the top edge of the controls) and open: about 160 px for PERSPECTIVE OPTIONS.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Put a finger on the options tab (the tab with an up arrow on the top edge of the controls) and drag it up half the travel, without lifting | The sheet's top edge has come up with the finger, half way |
| 2 | Lift the finger | The sheet rises the rest of the way and is open |
| 3 | Drag the sheet's tab down a fifth of the travel, and let go | The sheet goes back up: it is still open |
| 4 | Drag the sheet's tab down half the travel, and let go | The sheet closes |
| 5 | Drag the options tab up a fifth of the travel, and let go | The sheet drops back: it is closed |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### TOP-19.2 A drag the phone cancels leaves the sheet as it was   [auto: phone]
Before you start:
- Device and browser: an iPhone, Safari (the script uses a phone-width window and has the browser cancel the touch)
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Perspective step, no sheet open

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Put a finger on the options tab and drag it up half the sheet's travel, without lifting | The sheet has come up half way |
| 2 | Without lifting that finger, swipe down from the top-right corner of the screen with another, so the phone opens Control Center and takes the touch | Control Center opens |
| 3 | Close Control Center | The sheet is closed, as it was before the drag |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## TOP-20 The arrow flattens as the sheet rises

The tab's up arrow flattens into a flat bar as the sheet rises (flat at 40% of the way) and stays a flat bar while the sheet is open. While a sheet is up, only the sheet's own tab shows.

- Risk: low
- Check: script, eye. The two resting shapes and the hidden second tab are measurable; the flattening during a drag needs an eye.
- Layout: phone
- Added: 1.10 baseline
- Changed: none
- Anchors: `.handle-glyph`, `.handle-arm`, `.sheet-grabber`
- Source: `js/app/parts/sheet.js` (`shapeGlyph`, `clearGlyph`, `dragTo`); `css/app.css` (the sheet and the shell's phone block)
- Cases: 2

### TOP-20.1 An up arrow on the closed tab, a flat bar on the open sheet's   [auto: phone, webkit]
Before you start:
- Device and browser: a phone-width window
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Rotate step, no sheet open

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the options tab (on the top edge of the controls) | It holds an up arrow, about 16 × 8 px |
| 2 | Tap it | The sheet rises; its own tab holds a flat bar about 36 × 5 px; the controls' tab can't be seen: only one tab shows |
| 3 | Close the sheet with the cross | The controls' tab shows again, with its up arrow |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### TOP-20.2 The arrow flattens as the sheet is dragged up, for a person to judge   [eye]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Perspective step, no sheet open

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Put a finger on the options tab and drag it up a fifth of the sheet's travel, without lifting | The tab's arrow is half flattened: its two arms slope at about 22° each, a shallow arrow |
| 2 | Keep dragging, to half the travel | The arrow is a flat bar |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## TOP-21 A handle under the options tab wins

A press on the options tab that lands on something drawn on the photo (a Perspective corner or edge handle, a crop handle, the logo's corner or a snap ring) goes to the photo, not the sheet.

- Risk: medium
- Check: script, touch
- Layout: phone
- Added: 1.10 baseline
- Changed: none
- Anchors: `.grabber`, `#view`
- Source: `js/app/shell.js` (`bindNavigation`); `js/app/input.js` (`hitsPhotoControl`)
- Cases: 1

### TOP-21.1 A corner under the options tab is dragged, and the sheet stays shut   [auto: phone, webkit]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Drag the bottom-left corner ring down and right until it sits on the options tab (the tab with an up arrow, over the bottom of the photo), 20 px left of the tab's middle and 12 px above the photo's bottom edge, and let go | The ring is over the tab |
| 2 | Press on the ring and drag it 60 px up, and let go | The corner has moved 60 px up with the finger; no sheet has opened |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## TOP-22 Controls under the options tab take the tap

Where a control in a step's top line (a button, a slider, **Size** and **Format** on Export, Rotate's angle) lies under the options tab's 88 × 44 px touch area, the control takes the tap, and the tab's touch area reaches further over the photo instead.

- Risk: medium
- Check: script, touch
- Layout: phone
- Added: 1.10 baseline
- Changed: none
- Anchors: `.grabber`, `#exportChoices`, `#rotateAngle`, `.label-row`, `.is-arriving`
- Source: `css/app.css` (the adjustment line, Export's phone block, the shell's phone block, the `area-in` fade); `js/app/parts/adjustment-line.js` (`fadeInControlArea`)
- Ruling: R40. The controls under the tab take the tap from the moment they are drawn, including the 0.1 s after a step change while they fade in. The app differs today: during the fade the tab is on top of them and takes their taps.
- Cases: 4

### TOP-22.1 Rotate's angle under the options tab takes the tap   [auto: phone, webkit]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Rotate step

The options tab's touch area is 88 px wide and 44 px tall, centered on the tab, so its foot reaches into the line under it, where the right end of the angle (**0.0°**) lies. Wait a moment after opening the step, until its controls have faded in: for about 0.1 s after a step change the tab is on top of them and takes their taps, a defect of its own (ruling R40, TOP-22.3), so this case tests the tab's touch area once the step has settled.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap the right end of the angle, where it lies under the options tab's touch area | A text box takes the angle's place; no sheet opens |
| 2 | Tap **Done**, then tap the options tab's touch area 35 px above the top edge of the controls (over the photo, above the tab) | The sheet titled ROTATE OPTIONS rises |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### TOP-22.2 Size and Format under the options tab take the tap   [auto: phone, webkit]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step, **2000** selected

Wait a moment after opening the step, until its controls have faded in: for about 0.1 s after a step change the tab is on top of them and takes their taps, a defect of its own (ruling R40, TOP-22.4), so this case tests the tab's touch area once the step has settled.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Original** near its top, where it lies under the options tab's touch area | **Original** is selected; no sheet opens |
| 2 | Tap the options tab's touch area 35 px above the top edge of the controls (over the photo) | The sheet titled EXPORT OPTIONS rises |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### TOP-22.3 Straight after a step change to Rotate, the angle under the options tab takes the tap   [auto: phone, webkit]
Written to ruling R40; it fails until that is built (BUG-232).

Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Crop step, which Rotate's step tab has just left (open Rotate, wait a moment, then tap **Crop** in the step bar)

The right end of Rotate's angle (**0.0°**) lies under the foot of the options tab's touch area, as in TOP-22.1. Rotate's controls fade in over 0.12 s after its step tab is tapped; the script makes the second tap of row 2 during that fade, which a quick person can do too.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Rotate** in the step bar | Rotate's controls fade in |
| 2 | At once, before they finish fading in (within 0.1 s), tap the right end of the angle where it lies under the options tab's touch area | A text box takes the angle's place; no sheet opens |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead (the sheet titled ROTATE OPTIONS rising is the defect), a screenshot.

### TOP-22.4 Straight after a step change to Export, Size under the options tab takes the tap   [auto: phone, webkit]
Written to ruling R40; it fails until that is built (BUG-232).

Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Crop step, which Export's step tab has just left (open Export, check **2000** is selected, wait a moment, then tap **Crop** in the step bar)

The top of **Original**, under Size, lies under the foot of the options tab's touch area, as in TOP-22.2. Export's controls fade in over 0.12 s after its step tab is tapped; the script makes the second tap of row 2 during that fade.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Export** in the step bar | Export's controls fade in |
| 2 | At once, before they finish fading in (within 0.1 s), tap **Original** near its top, where it lies under the options tab's touch area | **Original** is selected; no sheet opens |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead (the sheet titled EXPORT OPTIONS rising is the defect), a screenshot.

## TOP-23 The open sheet covers part of the photo

An open options sheet covers the lower part of the photo and is at most 470 px tall; taller content scrolls inside it. The photo does not resize.

- Risk: medium
- Check: script
- Layout: phone
- Added: 1.10 baseline
- Changed: none
- Anchors: `.sheet-layer`, `.sheet-body`, `#view`
- Source: `js/app/parts/sheet.js` (`buildSheet`); `css/app.css` (the sheet)
- Cases: 1

### TOP-23.1 An open sheet covers the lower photo, at most 470 px, and scrolls inside   [auto: phone, webkit]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Note the photo area's size, then open the options (the tab with an up arrow on the top edge of the controls) | The sheet covers the lower part of the photo; the photo area is the same size as before |
| 2 | Tap **Tips** in the sheet | The tips open under the row; the sheet is 470 px tall, no more |
| 3 | Swipe up inside the sheet | Its content scrolls inside it; the sheet itself stays where it is |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## TOP-24 Focus moves into an opened sheet

Opening a sheet moves keyboard focus to its close button. A closed sheet is hidden once its slide down ends.

- Risk: low
- Check: script
- Layout: phone
- Added: 1.10 baseline
- Changed: none
- Anchors: `.sheet-close`, `.sheet-layer`
- Source: `js/app/parts/sheet.js` (`openSheet`, `closeSheet`, `hideWhenSettled`)
- Cases: 1

### TOP-24.1 Opening a sheet puts the focus on its cross; a closed sheet is hidden   [auto: phone, webkit]
Before you start:
- Device and browser: a phone-width window with a mouse
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Rotate step

The focus is the control the keyboard acts on.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Click the options tab (the tab with an up arrow on the top edge of the controls) | The sheet titled ROTATE OPTIONS rises; the focus is on its cross (named **Close**) |
| 2 | Click the cross | The sheet slides down and, once it has stopped, is gone from the page |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## TOP-25 Close a sheet with its close button

The cross at the top right of a sheet (named **Close**) closes it.

- Risk: medium
- Check: script
- Layout: phone
- Added: 1.10 baseline
- Changed: none
- Anchors: `.sheet-close`, "Close"
- Source: `js/app/parts/sheet.js` (`buildSheet`, `closeSheet`)
- Cases: 1

### TOP-25.1 The cross closes the sheet   [auto: phone]
Before you start:
- Device and browser: a phone-width window
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Crop step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap the options tab (the tab with an up arrow on the top edge of the controls) | The sheet titled CROP OPTIONS rises, with a cross in a circle at its top right (named **Close**) |
| 2 | Tap the cross | The sheet closes; Crop's controls are there as before |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## TOP-26 Close a sheet by tapping outside it

A tap on the dimmed area outside an open sheet closes it; the press must begin on the dimmed area.

- Risk: medium
- Check: script, touch
- Layout: phone
- Added: 1.10 baseline
- Changed: none
- Anchors: `.sheet-scrim`
- Source: `js/app/parts/sheet.js` (`buildSheet`, `closeSheet`)
- Cases: 2

### TOP-26.1 A tap on the dimmed photo closes the sheet   [auto: phone]
Before you start:
- Device and browser: a phone-width window
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Rotate step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap the options tab (the tab with an up arrow on the top edge of the controls) | The sheet rises and the rest of the screen dims |
| 2 | Tap the dimmed photo, 150 px from the top of the screen | The sheet closes; the photo has not moved |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### TOP-26.2 The tap that opens a sheet doesn't close it again   [auto: phone, webkit]
Before you start:
- Device and browser: a phone-width window
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Rotate step

The tap lands on the tab, and the dim appears under the same finger as the sheet rises.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap the options tab once | The sheet rises |
| 2 | Wait one second | The sheet is still open |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

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
- Cases: 2

### TOP-27.1 A drag down on the sheet's tab or title closes it   [auto: phone]
Before you start:
- Device and browser: a phone-width window
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Open the options (the tab with an up arrow on the top edge of the controls) | The sheet titled PERSPECTIVE OPTIONS is open |
| 2 | Drag the sheet's own tab (with a flat bar, on its top edge) 120 px down, and let go | The sheet closes |
| 3 | Open the options again, drag the title PERSPECTIVE OPTIONS 120 px down, and let go | The sheet closes |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### TOP-27.2 A tap on the sheet's tab or title closes it   [auto: phone]
Flag: to confirm. Written to today's behavior: a plain tap on an open sheet's title closes the sheet.

Before you start:
- Device and browser: a phone-width window
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Open the options, then tap the sheet's own tab (with a flat bar, on its top edge) | The sheet closes |
| 2 | Open the options again, then tap the title PERSPECTIVE OPTIONS | The sheet closes |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## TOP-28 Sheets close by themselves

An open sheet also closes on a step change, when **Tap to find card** is armed, when **Corner shots** opens its own sheet, and when the window narrows to the phone layout.

- Risk: low
- Check: script
- Layout: phone
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnFindCard`, `#btnCornerShots`, `.sheet-layer`
- Source: `js/app/shell.js` (`setTab`, `closeSheets`, `placeLayout`); `js/app/perspective.js` (`bindPerspective`); `js/app/corner-shots.js` (`openCornerShots`)
- Cases: 2

### TOP-28.1 Tap to find card closes the sheet   [auto: phone]
Before you start:
- Device and browser: a phone-width window
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Open the options (the tab with an up arrow on the top edge of the controls) | The sheet titled PERSPECTIVE OPTIONS is open |
| 2 | Tap **Tap to find card** | The sheet closes, so the whole photo is there to tap; the line reads "Tap the card in the photo." |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### TOP-28.2 Narrowing a wide window to a phone's width closes the options   [auto: desktop]
Before you start:
- Device and browser: a wide window, 1280 px wide, whose width you can set
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Rotate step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the side panel | Rotate's options (ROTATE OPTIONS, **Grid**, **Reset rotation**) are listed under its controls |
| 2 | Make the window 390 px wide | The phone layout shows; no sheet is open, only the options tab on the top edge of the controls |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## TOP-29 The dim behind a sheet

The dim behind an open sheet covers the whole app, the top bar included.

- Risk: low
- Check: script
- Layout: phone
- Added: 1.10 baseline
- Changed: none
- Anchors: `.sheet-scrim`, `.sheet-layer`, `#topBarHost`
- Source: `css/app.css` (the sheet, the shell's phone block)
- Cases: 1

### TOP-29.1 The dim behind a sheet covers the top bar too   [auto: phone, webkit]
Before you start:
- Device and browser: a phone-width window
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Rotate step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **90° right** | The photo turns; **Undo** is live |
| 2 | Open the options (the tab with an up arrow on the top edge of the controls) | The dim covers the whole screen above the sheet, the top bar included |
| 3 | Tap where **Undo** is | The sheet closes; the photo is still turned: **Undo** did not act |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## TOP-30 Options always open on a wide screen

On a wide screen every step's options are always open, listed in the side panel under the step's controls, with no options tab, dim or close button. The sheet's title shows as a grey heading (none where the options are only tips, as on Overlay).

- Risk: medium
- Check: script
- Layout: wide
- Added: 1.10 baseline
- Changed: none
- Anchors: `.sheet-layer`, "Perspective options", "Export options", `#panel`
- Source: `js/app/shell.js` (`placeLayout`); `css/app.css` (the shell's wide block)
- Cases: 1

### TOP-30.1 On a wide screen each step's options are listed in the panel   [auto: desktop]
Before you start:
- Device and browser: a wide window, 1280 × 800 px
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the side panel | Under Perspective's controls: the grey heading PERSPECTIVE OPTIONS and its rows (**Tap to find card** first); no options tab, no dim, no cross |
| 2 | Click **Rotate**, **Crop** and **Export** in turn | Each lists its options under its controls, under a grey heading: ROTATE OPTIONS, CROP OPTIONS, EXPORT OPTIONS |
| 3 | Click **Overlay** | Its tips are listed under its controls with no OVERLAY OPTIONS heading |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## TOP-31 Tips

A **Tips** row in a step's options opens that step's tips in place, under the row; another tap closes them.

- Risk: low
- Check: script
- Layout: both. On a phone the row opens and closes the tips; on a wide screen the row is hidden and the tips are always open.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#perspectiveTips`, `#rotateTips`, `#cropTips`, `#exportTips`
- Source: `js/app/parts/sheet.js` (`buildTipsRow`, `buildTipHint`); `css/app.css` (the shell's wide block)
- Cases: 1

### TOP-31.1 Tips open in place on a phone, and are always open on a wide screen   [auto: both]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Rotate step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | On a phone, open the options (the tab with an up arrow on the top edge of the controls); on a wide screen, look under Rotate's controls | On a phone: a **Tips** row, the tips not shown. On a wide screen: no **Tips** row; the tips show, starting "Drag the ruler to straighten, or tap the angle to type it." |
| 2 | On a phone, tap **Tips** | The tips open under the row, starting "Drag the ruler to straighten, or tap the angle to type it." |
| 3 | On a phone, tap **Tips** again | The tips close |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

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
- Cases: 2

### TOP-32.1 Keyboard help under Tips and keys; touch-only tips left out   [auto: desktop]
Before you start:
- Device and browser: a wide window, 1280 × 800 px
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Rotate step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the foot of the side panel | A block headed TIPS AND KEYS: Rotate's tips, then "F fits; 1 to 6 change step." |
| 2 | Click **Perspective** | Its TIPS AND KEYS block has no tip about dragging a corner or double tapping a handle (a touch tip), and ends with its keys, starting "Drag corners or edge midpoints." |
| 3 | Click **Export** | Its block is headed TIPS (no keys), with no tip about Share's Save Image (a phone tip) |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### TOP-32.2 Levels shows two tips headings on a wide screen   [auto: desktop]
Flag: to confirm. Written to today's behavior: on a wide screen Levels shows two tips headings, "Levels tips" and "Tips and keys".

Before you start:
- Device and browser: a wide window, 1280 × 800 px
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Levels step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the side panel under Levels' controls | The heading LEVELS TIPS over the tips, then a second heading, TIPS AND KEYS, over "Hold C, or press and hold the photo, to compare." |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

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
- Cases: 2

### TOP-33.1 A message takes the line's place, its icon colored by kind   [auto: phone]
Before you start:
- Device and browser: a phone-width window
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/, and a plain grey picture with no card in it (any plain picture, 1200 × 1600 px)
- Starting screen: the plain picture open, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the line above the arrow buttons | It reads "Nothing detected. Drag the corners into place." with an amber warning icon (#e3b341) and no button; the NUDGE line has gone |
| 2 | Open 01_chrome_flat_black.JPEG, open the options and tap **Tap to find card** | The line reads "Tap the card in the photo." with a grey information icon and one small button, **Cancel** |
| 3 | Tap **Cancel**, then drag the top-left corner ring past the bottom-right one, and let go | The line reads a message about the corners, with a red error icon (#e5322d), in at most two lines |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### TOP-33.2 A message hides Perspective's confidence   [auto: phone]
Flag: to confirm. Written to today's behavior: any message hides Perspective's confidence figure, even one that gives nothing to act on.

Before you start:
- Device and browser: a phone-width window
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the line above the arrow buttons | NUDGE Corner 1 of 4, with "Confidence" and a percentage at its right |
| 2 | Open the options and tap **Tap to find card** | The line reads "Tap the card in the photo."; the confidence figure is not shown |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## TOP-34 The progress line

While an export or the corner shots render, a 3 px red line grows from left to right along the top edge of the controls, or of the open sheet; screen readers read it as a progress bar. It fades out when the work ends.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `.progress-line`, `.is-done`
- Source: `js/app/parts/progress-line.js` (`buildProgressLine`, `updateProgressLine`, `endProgressLine`)
- Cases: 2

### TOP-34.1 A red line runs along the top of the controls during an export   [auto: phone]
Before you start:
- Device and browser: a phone-width window
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Download**, and watch the top edge of the controls | A 3 px red line (#e5322d) runs along it from the left; a screen reader reads it as a progress bar |
| 2 | Wait for the file to be saved | The line fades out and is gone |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### TOP-34.2 The line runs along the top of the open Corner shots sheet   [auto: phone]
Before you start:
- Device and browser: a phone-width window
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Corner shots** | The Corner shots sheet rises |
| 2 | Tap **Download corners** (answer **No** if asked to upscale), and watch the sheet's top edge | The red line runs along the sheet's top edge, and nowhere else |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## TOP-35 The three kinds of tool

The tiles along the bottom of each step's controls come in three kinds that look different: a mode fills white while it is selected, an action flashes for 150 ms when tapped, and a switch shows **On** or **Off** in its corner.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `.tool-mode`, `.tool-switch`, `.tool-state`, `.is-flashing`
- Source: `js/app/parts/tool.js` (`buildTool`, `updateTool`, `flashTool`)
- Cases: 1

### TOP-35.1 A mode fills white, an action flashes, a switch reads On or Off   [auto: phone]
Before you start:
- Device and browser: a phone-width window
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Rotate step

The tools are the five tiles along the bottom of the controls.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at **Straighten** and **Fill frame** | **Straighten** is filled white (the selected mode); **Fill frame** reads Off in its top right corner |
| 2 | Tap **Flip** | **Flip** fills white and **Straighten** is no longer white |
| 3 | Tap **90° right** | It flashes a lighter shade for a moment (about 0.15 s), then is plain again |
| 4 | Tap **Fill frame** | Its corner reads On |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

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
- Cases: 2

### TOP-36.1 A mode tap swaps the line with a short fade, for a person to judge   [eye]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Flatten** | **Flatten** fills white at once; the arrow buttons fade out and the Flatten slider rises in, in about a sixth of a second |
| 2 | Tap **Flatten** again | Nothing moves or blinks |
| 3 | Tap **Rotate** in the step bar | Rotate's controls fade in |
| 4 | Look at the screen once still | Rotate's controls, with STRAIGHTEN and the ruler, fully shown |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### TOP-36.2 With Preview on, Nudge and Flatten are greyed out   [auto: phone]
Flag: to confirm. Written to today's behavior: with **Preview** on, Perspective's two mode tiles are greyed out, so the line can't be swapped.

Before you start:
- Device and browser: a phone-width window
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Preview** | **Preview** reads On; **Nudge** and **Flatten** are greyed out |
| 2 | Tap **Flatten** | Nothing changes: the line still reads PREVIEW |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## TOP-37 Hover fills

With a mouse (or any pointer that can hover), tools, buttons, presets, two-part switches, step tabs and sheet rows take a fill while the pointer is over them; a dimmed control and a selected one don't change.

- Risk: low
- Check: eye
- Layout: both, with a mouse only. **Open**'s pill fill on hover is wide only.
- Added: 1.10 baseline
- Changed: none
- Anchors: `.tool`, `.step-tab`, `.sheet-row`, `#btnOpen`
- Source: `css/app.css` (the shell's hover block)
- Cases: 1

### TOP-37.1 Controls take a fill under the mouse, for a person to judge   [eye]
Before you start:
- Device and browser: a wide window, 1280 × 800 px, with a mouse
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo just opened, on the Rotate step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Hold the mouse over **90° right** | It takes a lighter grey fill (#3a3a40) |
| 2 | Hold the mouse over **Straighten** (selected) | It stays solid white |
| 3 | Hold the mouse over **Redo** (greyed out) | It doesn't change |
| 4 | Hold the mouse over the **Crop** step tab | It takes the lighter grey fill |
| 5 | Hold the mouse over **Open** | Its pill turns the lighter grey |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.
