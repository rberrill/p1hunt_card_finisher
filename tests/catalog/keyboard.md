# Keyboard

Keyboard shortcuts and keyboard focus. Everything here also works by touch; the keys are extras.

## KEY-01 Undo from the keyboard

Ctrl+Z (Cmd+Z on a Mac) undoes the last edit, as **Undo** does.

- Risk: medium
- Check: script
- Layout: both. Needs a keyboard.
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.keys.undo`, `#btnUndo`, `"Undo (Ctrl/Cmd+Z)"`
- Source: `js/app/input.js` (`onKeyDown`, `keyMatches`)
- Ruling: R32. The undo and redo keys do nothing while an export is running. The app differs today.
- Cases: 2

### KEY-01.1 Ctrl+Z undoes the last edit   [auto: desktop]
Before you start:
- Device and browser: a computer with a keyboard and a mouse; a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Rotate step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Hold the pointer over **Undo** (the arrow curving left, at the top right) | Its tooltip reads "Undo (Ctrl/Cmd+Z)" |
| 2 | Click **90° right** | The photo turns a quarter clockwise |
| 3 | Press Ctrl+Z (Cmd+Z on a Mac) | The photo is upright again; **Undo** is greyed out |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### KEY-01.2 During an export, Ctrl+Z does nothing   [auto: desktop]
Written to ruling R32; it fails until that is built (BUG-193).

Before you start:
- Device and browser: a computer with a keyboard and a mouse; a wide window. A real export is too quick to act in; the automated case holds it open until the key is checked
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Export step, at **JPEG**

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Click **PNG** | **PNG** is selected |
| 2 | Click **Download**, then **No** on "Upscale to 2000 px?" | The export runs |
| 3 | While it runs, press Ctrl+Z (Cmd+Z on a Mac) | **PNG** is still selected |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## KEY-02 Redo from the keyboard

Shift+Ctrl+Z (Shift+Cmd+Z on a Mac), or Ctrl+Y (Cmd+Y), redoes, as **Redo** does.

- Risk: medium
- Check: script
- Layout: both. Needs a keyboard.
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.keys.redo`, `CONFIG.keys.redoAlt`, `#btnRedo`, `"Redo (Shift+Ctrl/Cmd+Z)"`
- Source: `js/app/input.js` (`onKeyDown`, `keyMatches`)
- Ruling: R32. The undo and redo keys do nothing while an export is running. The app differs today.
- Flag: to confirm. **Redo**'s tooltip names only Shift+Ctrl/Cmd+Z, though Ctrl/Cmd+Y also works.
- Cases: 2

### KEY-02.1 Shift+Ctrl+Z and Ctrl+Y redo   [auto: desktop]
Flag: to confirm. Written to today's behavior: the tooltip names only Shift+Ctrl/Cmd+Z.

Before you start:
- Device and browser: a computer with a keyboard and a mouse; a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Rotate step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Hold the pointer over **Redo** (the arrow curving right, at the top right) | Its tooltip reads "Redo (Shift+Ctrl/Cmd+Z)" |
| 2 | Click **90° right**, then press Ctrl+Z (Cmd+Z on a Mac) | The photo is upright; **Redo** is lit |
| 3 | Press Shift+Ctrl+Z (Shift+Cmd+Z on a Mac) | The photo turns a quarter clockwise again |
| 4 | Press Ctrl+Z, then Ctrl+Y (Cmd+Y on a Mac) | The photo is turned a quarter again; **Redo** is greyed out |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### KEY-02.2 During an export, the redo keys do nothing   [auto: desktop]
Written to ruling R32; it fails until that is built (BUG-193).

Before you start:
- Device and browser: a computer with a keyboard and a mouse; a wide window. A real export is too quick to act in; the automated case holds it open until the keys are checked
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Export step, at **JPEG**

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Click **PNG**, then **Undo** (the arrow curving left, at the top right) | **JPEG** is selected and **Redo** is lit |
| 2 | Click **Download**, then **No** on "Upscale to 2000 px?" | The export runs |
| 3 | While it runs, press Shift+Ctrl+Z, then Ctrl+Y (Shift+Cmd+Z and Cmd+Y on a Mac) | **JPEG** is still selected |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## KEY-03 Undo and redo keys work from any control

The undo and redo keys still undo and redo the app's edits while a slider, a switch or the typed angle has focus. Only the tuning panel's fields keep the browser's own text undo.

- Risk: low
- Check: script
- Layout: both. Needs a keyboard.
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.keys.undo`, `#rotateAngleField`, `#quality`, `#debugPanel`
- Source: `js/app/input.js` (`onKeyDown`)
- Cases: 2

### KEY-03.1 The undo key undoes the app's edit from a switch, a slider or the typed angle   [auto: desktop]
Before you start:
- Device and browser: a computer with a keyboard and a mouse; a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Rotate step, the angle at 0.0° and **Fill frame** Off

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Click **Fill frame** | It reads On, and keeps the keyboard focus |
| 2 | Press Ctrl+Z (Cmd+Z on a Mac) | **Fill frame** reads Off |
| 3 | Click the angle, type 5, press Enter, then click the angle again | The angle box opens again showing 5.0, with the focus |
| 4 | Press Ctrl+Z | The photo goes back to 0.0° |
| 5 | Click **Export** in the step bar, then click the middle of the **Quality** slider | **Quality** reads 75%, and the slider has the focus |
| 6 | Press Ctrl+Z | **Quality** reads 92% again |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### KEY-03.2 In the tuning panel's fields, Ctrl+Z is the browser's own   [auto: desktop]
Before you start:
- Device and browser: a computer with a keyboard and a mouse; a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Rotate step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Click **90° right**, then press the backtick key (`` ` ``) | The photo is turned a quarter; the tuning panel opens |
| 2 | Click the first number field in the panel, press End and type 5 | The field reads its number with a 5 after it |
| 3 | Press Ctrl+Z (Cmd+Z on a Mac) | The field reads its first number again; the photo is still turned a quarter |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## KEY-04 Shortcuts stay out of the way of typing

The other shortcuts do nothing while you type in a field, or while Ctrl, Cmd or Alt is held.

- Risk: low
- Check: script
- Layout: both. Needs a keyboard.
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.keys.fit`, `CONFIG.keys.debug`, `#rotateAngleField`
- Source: `js/app/input.js` (`onKeyDown`)
- Cases: 1

### KEY-04.1 The shortcuts do nothing while typing, or with Alt held   [auto: desktop]
Before you start:
- Device and browser: a computer with a keyboard and a mouse; a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Rotate step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Click the angle (with a pencil after it) and type 3 | The box shows 3; the step is still Rotate (3 alone goes to Crop) |
| 2 | Type f | The box shows 3f; nothing else happens (f alone fits the photo) |
| 3 | Press Escape, then Alt+3 (Option+3 on a Mac) | The box has closed; the step is still Rotate |
| 4 | Press 3 | The Crop step shows |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## KEY-05 Number keys go to a step

With a photo open, the keys 1 to 6 go to Perspective, Rotate, Crop, Levels, Overlay and Export.

- Risk: medium
- Check: script
- Layout: both. Needs a keyboard.
- Added: 1.10 baseline
- Changed: none
- Anchors: `key:1`, `key:6`, `.step-tab`
- Source: `js/app/input.js` (`onPhotoKey`), `js/app/shell.js` (`setTab`)
- Cases: 1

### KEY-05.1 The keys 1 to 6 go to the six steps   [auto: desktop]
Before you start:
- Device and browser: a computer with a keyboard; a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the start screen, with no photo open

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Press 6 | Nothing happens: the start screen stays |
| 2 | Open IMG_9136.JPEG with **Open photo** | The photo opens on Perspective |
| 3 | Press 2, 3, 4, 5 and 6 in turn | Each goes to its step, its tab selected in the step bar: Rotate, Crop, Levels, Overlay, Export |
| 4 | Press 1 | The Perspective step shows |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## KEY-06 F fits the photo to the screen

With a photo open, F fits the current view to the screen, as **Fit to screen** does.

- Risk: low
- Check: script
- Layout: both. Needs a keyboard.
- Added: 1.10 baseline
- Changed: none
- Anchors: `key:F`, `CONFIG.keys.fit`, `#btnFit`, `"Fit to screen (F)"`
- Source: `js/app/input.js` (`onPhotoKey`)
- Cases: 1

### KEY-06.1 F fits the photo to the screen   [auto: desktop]
Before you start:
- Device and browser: a computer with a keyboard and a mouse with a wheel; a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Rotate step, fitted to the photo area

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Hold the pointer over **Fit to screen** in the top bar | Its tooltip reads "Fit to screen (F)" |
| 2 | Roll the mouse wheel away from you over the middle of the photo | The photo zooms in, to more than one and a half times its fitted size |
| 3 | Press F | The whole photo fits the photo area again |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## KEY-07 Hold C to compare on Levels

On the Levels step, holding C shows the photo without levels, with the **Before levels** badge; letting go, or the window losing focus, ends the comparison.

- Risk: low
- Check: script
- Layout: both. Needs a keyboard.
- Added: 1.10 baseline
- Changed: none
- Anchors: `key:C`, `CONFIG.keys.compare`, `"Before levels"`
- Source: `js/app/input.js` (`onPhotoKey`), `js/app/main.js` (`bindWindowEvents`), `js/app/levels.js` (`setCompare`)
- Ruling: R9. Holding C does nothing when the photo has no levels, applied or unapplied. The app differs today.
- Cases: 2

### KEY-07.1 Holding C on Levels shows the photo before levels   [auto: desktop]
Before you start:
- Device and browser: a computer with a keyboard and a mouse; a wide window
- Build: the build under test
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step, with no levels

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Click **Auto**, then **Apply** | The levels are applied: the photo is brighter |
| 2 | Hold C down | The photo shows without levels, with the **Before levels** badge at the top left |
| 3 | Let go of C | The levels are back and the badge goes |
| 4 | Hold C down again, and while holding it click another window, so the browser loses focus | The comparison ends: the levels are back |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### KEY-07.2 With no levels, holding C does nothing   [auto: desktop]
Written to ruling R9; it fails until that is built (BUG-102).

Before you start:
- Device and browser: a computer with a keyboard; a wide window
- Build: the build under test
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step, with no levels set and none applied

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Hold C down for half a second | No comparison starts: no **Before levels** badge shows |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## KEY-08 Tab steps through the Perspective handles

On Perspective, Tab into the photo selects the first of the eight handles (Shift+Tab the last). While the photo has focus, Tab and Shift+Tab step through the handles, then leave the photo for the next control. With focus anywhere else, Tab moves between controls as usual.

- Risk: medium
- Check: script
- Layout: wide. Needs a keyboard.
- Added: 1.10 baseline
- Changed: none
- Anchors: `key:Tab`, `#view`, `.is-keyboard-focus`
- Source: `js/app/input.js` (`onPhotoKey`, `stepHandleByTab`, `onCanvasFocus`)
- Ruling: R2. While Preview is on, the keys do nothing to the handles. The app differs today.
- Flag: to confirm. The wide keyboard help says Tab selects the next handle without saying the photo must have focus first; on a fresh page Tab goes to the top bar.
- Cases: 2

### KEY-08.1 Tab steps through the eight handles once the photo has the focus   [auto: desktop]
Flag: to confirm. Written to today's behavior: from a fresh page, Tab reaches the photo only after the top bar.

Before you start:
- Device and browser: a computer with a keyboard; a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the app opened afresh, then IMG_9136.JPEG opened with **Open photo**; it opens on Perspective. Nothing else clicked

The line above the controls names the selected handle: Corner 1 of 4 to Corner 4 of 4, then Edge 1 of 4 to Edge 4 of 4.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Press Tab nine times | The focus passes **Open**, the six steps and **Fit to screen**, and lands on the photo; the line reads Corner 1 of 4 |
| 2 | Press Tab four more times | The line reads Edge 1 of 4; the photo still has the focus |
| 3 | Press Tab three more times | The line reads Edge 4 of 4, the last handle |
| 4 | Press Tab once more | The focus leaves the photo for **Nudge left** |
| 5 | Press Shift+Tab twice | The focus is back on the photo, and the line reads Edge 3 of 4 |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### KEY-08.2 While Preview is on, Tab doesn't step through the handles   [auto: desktop]
Written to ruling R2; it fails until that is built (BUG-062).

Before you start:
- Device and browser: a computer with a keyboard and a mouse; a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Click **Preview** | It reads On: the corrected card shows, with no handles |
| 2 | Press Tab until the photo has the focus, then press Tab once more | The selected handle doesn't change, and the focus moves on from the photo |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## KEY-09 The photo's keyboard focus ring

The photo shows a 2 px white ring when the keyboard brought focus to it, and none after a click or a touch.

- Risk: low
- Check: script
- Layout: wide. Needs a keyboard.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#view`, `.is-keyboard-focus`
- Source: `js/app/input.js` (`onPointerDown`, `stepHandleByTab`), `css/app.css` (`#view:focus-visible`)
- Cases: 2

### KEY-09.1 The photo shows a white ring when the keyboard brings the focus, not a click   [auto: desktop, webkit]
Before you start:
- Device and browser: a computer with a keyboard and a mouse; a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Click the photo area 20 px in from its top-left corner | The photo has the focus, with no ring |
| 2 | Press Shift+Tab | The focus moves to **Fit to screen** |
| 3 | Press Tab | The focus is back on the photo, with a 2 px white ring just inside its edge |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### KEY-09.2 After Tab, a click on the photo leaves the ring   [auto: desktop, webkit]
Flag: to confirm. Written to today's behavior: the entry and the code's own note say no ring after a click, but a click on the photo while the keyboard's ring shows leaves the ring (the photo had the focus already, so the browser keeps it marked as keyboard focus).

Before you start:
- Device and browser: a computer with a keyboard and a mouse; a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Click the photo area 20 px in from its top-left corner, press Shift+Tab, then Tab | The photo has the focus, with the 2 px white ring |
| 2 | Click the photo area 20 px in from its top-left corner again | The ring stays |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## KEY-10 Arrow keys nudge a Perspective handle

On Perspective, the arrow keys move the selected handle by 1 photo pixel, or 10 with Shift; a side's handle moves the side straight in or out. Repeated presses make one undo step.

- Risk: medium
- Check: script
- Layout: both. Needs a keyboard.
- Added: 1.10 baseline
- Changed: none
- Anchors: `key:ArrowLeft`, `key:ArrowUp`, `CONFIG.keys.nudge`, `CONFIG.keys.nudgeShift`
- Source: `js/app/input.js` (`onPhotoKey`, `moveHandleBy`)
- Ruling: R2. While Preview is on, the keys do nothing to the handles. The app differs today.
- Flag: to confirm. An arrow key moves a corner by 1 photo pixel with no magnifier, while the on-screen arrows move it by 1 screen pixel and show the magnifier.
- Cases: 2

### KEY-10.1 The arrow keys move the selected handle; a side moves straight; one undo step   [auto: desktop]
Flag: to confirm. Written to today's behavior: the keys move whole photo pixels, with no magnifier.

Before you start:
- Device and browser: a computer with a keyboard and a mouse; a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step, Corner 1 of 4 (top left) selected

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Press Tab until the photo has the focus | The line reads Corner 1 of 4 |
| 2 | Press → (the right arrow key), then Shift+↓ | The top-left corner moves 1 photo pixel right and 10 down |
| 3 | Click **Undo** (the arrow curving left, at the top right) | One Undo takes both presses back; **Undo** is greyed out |
| 4 | Click the photo area 20 px in from its top-left corner, then press Tab four times | The line reads Edge 1 of 4: the top edge |
| 5 | Press Shift+↑ | The top edge moves out, straight up, both its corners with it; the bottom corners don't move |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### KEY-10.2 While Preview is on, the arrow keys don't move the handle   [auto: desktop]
Written to ruling R2; it fails until that is built (BUG-062).

Before you start:
- Device and browser: a computer with a keyboard and a mouse; a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step, Corner 1 of 4 selected

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Click **Preview** | It reads On |
| 2 | Press → (the right arrow key) three times | The corners haven't moved |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## KEY-11 Arrow keys move the logo

On Overlay, the arrow keys move the logo by 0.5% of the photo's width, or 5% with Shift.

- Risk: low
- Check: script
- Layout: both. Needs a keyboard.
- Added: 1.10 baseline
- Changed: none
- Anchors: `key:ArrowRight`, `CONFIG.overlay.nudgePct`, `CONFIG.overlay.nudgeShiftPct`
- Source: `js/app/overlay.js` (`overlayKey`, `nudge`)
- Cases: 1

### KEY-11.1 On Overlay, the arrow keys move the logo   [auto: desktop]
Before you start:
- Device and browser: a computer with a keyboard and a mouse; a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: green-logo.png, made for the case: a PNG of 400 × 400 px, solid pure green
- Starting screen: the photo open, on the Overlay step, with green-logo.png added by **Add logo**

The framed photo is the photo as cropped, where the logo sits.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the logo | It sits in the middle of the framed photo |
| 2 | Press → (the right arrow key) | It moves right by 0.5% of the framed photo's width |
| 3 | Press Shift+← | It moves left by 5% of the width |
| 4 | Press ↓ | It moves down by 0.5% of the width |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## KEY-12 Plus and minus size the logo

On Overlay, + (or =) makes the logo 5% bigger and − (or _) 5% smaller.

- Risk: low
- Check: script
- Layout: both. Needs a keyboard.
- Added: 1.10 baseline
- Changed: none
- Anchors: `key:+`, `key:=`, `key:-`, `CONFIG.overlay.sizeStep`
- Source: `js/app/overlay.js` (`overlayKey`, `nudge`)
- Cases: 1

### KEY-12.1 On Overlay, plus and minus size the logo   [auto: desktop]
Before you start:
- Device and browser: a computer with a keyboard and a mouse; a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: green-logo.png, made for the case: a PNG of 400 × 400 px, solid pure green
- Starting screen: the photo open, on the Overlay step, with green-logo.png added by **Add logo**

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Press + | The logo is 5% wider |
| 2 | Press = | It is 5% wider again |
| 3 | Press − (the minus key) | It is 5% smaller |
| 4 | Press _ (Shift and the minus key) | It is 5% smaller again: back to its first size |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## KEY-13 Shift keeps a Free crop's shape

With the **Free** crop preset, holding Shift while dragging the crop box (from the press or at any point during the drag) keeps its shape.

- Risk: low
- Check: script, touch
- Layout: both. Needs a keyboard and a mouse.
- Added: 1.10 baseline
- Changed: none
- Anchors: `key:Shift`, `"Free"`
- Source: `js/app/input.js` (`onPointerDown`, `stepGesture`, `dragCrop`)
- Cases: 1

### KEY-13.1 Shift keeps a Free crop's shape   [auto: desktop]
Before you start:
- Device and browser: a computer with a keyboard and a mouse; a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Crop step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Click **Free** | **Free** is selected |
| 2 | Hold Shift, drag the handle on the crop box's right edge 60 px to the left, let go, then let go of Shift | The box is smaller and the same shape |
| 3 | Drag the right edge 60 px to the left again, pressing Shift halfway through the drag; let go, then let go of Shift | Still the same shape |
| 4 | Drag the right edge 60 px to the left with no Shift | The box gets narrower: its shape changes |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## KEY-14 Escape cancels a question

Escape cancels an open question card, as its Cancel does.

- Risk: medium
- Check: script
- Layout: both. Needs a keyboard.
- Added: 1.10 baseline
- Changed: none
- Anchors: `key:Escape`, `#pairPrompt`
- Source: `js/app/input.js` (`onKeyDown`), `js/app/pair.js` (`hidePrompt`)
- Cases: 1

### KEY-14.1 Escape cancels a question   [auto: desktop]
Before you start:
- Device and browser: a computer with a keyboard and a mouse; a wide window, with downloads saved to a folder you can open
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Export step, at **2000**

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Click **Download** | A card asks "Upscale to 2000 px?" |
| 2 | Press Escape | The card closes and no file is saved |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## KEY-15 Escape closes an options sheet

On the phone layout, Escape closes an open options sheet.

- Risk: low
- Check: script
- Layout: phone. On a wide screen the options are always open in the side panel.
- Added: 1.10 baseline
- Changed: none
- Anchors: `key:Escape`, `.sheet-layer`
- Source: `js/app/input.js` (`onKeyDown`), `js/app/shell.js` (`closeSheets`)
- Flag: to confirm. Escape closes a sheet on the phone layout only, and never disarms **Tap to find card** or a Levels pick.
- Cases: 1

### KEY-15.1 On a phone, Escape closes an options sheet but leaves a pick armed   [auto: phone]
Flag: to confirm. Written to today's behavior: Escape closes the sheet but leaves **Pick white** armed.

Before you start:
- Device and browser: a phone-width window with a keyboard (an iPad with a keyboard, or a computer's window made narrow)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Rotate step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap the **Options** tab (the tab with an up arrow on the top edge of the controls) | Rotate options rise |
| 2 | Press Escape | They close |
| 3 | Tap **Levels** in the step bar, tap **Pick white**, then tap the **Options** tab | **Pick white** is selected; the Levels tips are open |
| 4 | Press Escape | The tips close; **Pick white** is still selected |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## KEY-16 Backtick opens the tuning panel

The backtick key (`` ` ``) opens and closes the tuning panel, with or without a photo open.

- Risk: low
- Check: script
- Layout: both. Needs a keyboard.
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.keys.debug`, `#debugPanel`
- Source: `js/app/input.js` (`onKeyDown`), `js/app/debug-panel.js` (`toggleDebugPanel`)
- Cases: 1

### KEY-16.1 The backtick opens and closes the tuning panel over a photo   [auto: desktop]
Before you start:
- Device and browser: a computer with a keyboard; a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step, the tuning panel closed

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Press the backtick key (`` ` ``) | The tuning panel opens |
| 2 | Press it again | The tuning panel closes |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## KEY-17 Every control shows where keyboard focus is

Every control shows a 2 px white ring when it has keyboard focus.

- Risk: low
- Check: eye
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `.action-button`, `.preset-chip`, `.segment`, `.switch`
- Source: `css/app.css` (the focus rules before the top bar part)
- Cases: 1

### KEY-17.1 Every kind of control shows a white ring when it has the keyboard focus   [eye]
Before you start:
- Device and browser: a computer with a keyboard and a mouse; a wide window, 1280 × 800 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Export step

Each row: click the photo area 20 px in from its top-left corner, then press Tab until the control named has the focus. A script also measures the ring (2 px, solid, the app's white); the judge looks at the screenshot.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | On Export, Tab to **Download** | A 2 px white ring around **Download**, clear of its neighbors |
| 2 | On Export, Tab to the Size choice **1080** | A 2 px white ring around **1080**, clear of the choices beside it |
| 3 | On Crop, Tab to the **Free** preset | A 2 px white ring around **Free** |
| 4 | On Rotate, Tab to **Fill frame** | A 2 px white ring around **Fill frame** |
| 5 | On Rotate, Tab to the Straighten ruler | A 2 px white ring around the ruler |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## KEY-18 Focused controls take their own keys

A focused control takes its own keys: the arrow keys move the Straighten ruler and the sliders, and Enter or Space on an on-screen arrow nudges once.

- Risk: low
- Check: script
- Layout: both. Needs a keyboard.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#fine`, `.slider`, `.nudge-key`
- Source: `js/app/parts/ruler.js` (`buildRuler`), `js/app/parts/slider.js` (`buildSlider`), `js/app/parts/nudge-pad.js` (`bindNudgePad`)
- Cases: 1

### KEY-18.1 A focused control takes its own keys   [auto: desktop]
Before you start:
- Device and browser: a computer with a keyboard and a mouse; a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Rotate step, the angle at 0.0°

Each Tab row starts by clicking the photo area 20 px in from its top-left corner.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tab to the Straighten ruler and press → (the right arrow key) | The angle moves by 0.1° |
| 2 | Click **Export** in the step bar, Tab to **Quality**, and press ← | **Quality** reads 91% |
| 3 | Click **Perspective** in the step bar, Tab to **Nudge right** (the right arrow under the line), and press Enter | The selected corner moves right once |
| 4 | Press Space | It moves right once more |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.
