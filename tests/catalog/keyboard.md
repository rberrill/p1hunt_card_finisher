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
- Browser data: none for this site (a private window, or the site's data cleared)
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
Script only
Stand-in: an export here lasts well under a second, too short for a person to press a key while it runs, so the script holds the export open until the key has been pressed and its result read, then lets it finish.

Before you start:
- Device and browser: a computer with a keyboard and a mouse; a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Export step, with **JPEG** selected under Format

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Click **PNG** | **PNG** is selected |
| 2 | Click **Download** | The question box (the box over the dimmed photo with a question and two or three buttons) asks "Upscale to 2000 px?" |
| 3 | Click **No** | The export runs: a progress line crosses the top edge of the controls |
| 4 | While it runs, press Ctrl+Z (Cmd+Z on a Mac) | **PNG** is still selected |

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
- Ruling: R32. The undo and redo keys do nothing while an export is running. The app differs today. R66. **Redo**'s tooltip names only Shift+Ctrl/Cmd+Z. The app already does this.
- Cases: 2

### KEY-02.1 Shift+Ctrl+Z and Ctrl+Y redo   [auto: desktop]

Before you start:
- Device and browser: a computer with a keyboard and a mouse; a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Rotate step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Hold the pointer over **Redo** (the arrow curving right, at the top right) | Its tooltip reads "Redo (Shift+Ctrl/Cmd+Z)" |
| 2 | Click **90° right** | The photo turns a quarter clockwise |
| 3 | Press Ctrl+Z (Cmd+Z on a Mac) | The photo is upright; **Redo** is no longer greyed out |
| 4 | Press Shift+Ctrl+Z (Shift+Cmd+Z on a Mac) | The photo turns a quarter clockwise again |
| 5 | Press Ctrl+Z | The photo is upright again |
| 6 | Press Ctrl+Y (Cmd+Y on a Mac) | The photo is turned a quarter again; **Redo** is greyed out |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### KEY-02.2 During an export, the redo keys do nothing   [auto: desktop]
Written to ruling R32; it fails until that is built (BUG-193).
Script only
Stand-in: an export here lasts well under a second, too short for a person to press a key while it runs, so the script holds the export open until both keys have been pressed and their results read, then lets it finish.

Before you start:
- Device and browser: a computer with a keyboard and a mouse; a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Export step, with **JPEG** selected under Format

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Click **PNG** | **PNG** is selected |
| 2 | Click **Undo** (the arrow curving left, at the top right) | **JPEG** is selected, and **Redo** is no longer greyed out |
| 3 | Click **Download** | The question box (the box over the dimmed photo with a question and two or three buttons) asks "Upscale to 2000 px?" |
| 4 | Click **No** | The export runs: a progress line crosses the top edge of the controls |
| 5 | While it runs, press Shift+Ctrl+Z (Shift+Cmd+Z on a Mac) | **JPEG** is still selected |
| 6 | Still while it runs, press Ctrl+Y (Cmd+Y on a Mac) | **JPEG** is still selected |

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
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Rotate step, the angle at 0.0° and **Fill frame** Off

The named action:
- Type the angle 5: click the angle (**0.0°**, with a pencil after it), type 5, press Enter.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Click **Fill frame** | It reads On, and keeps the keyboard focus |
| 2 | Press Ctrl+Z (Cmd+Z on a Mac) | **Fill frame** reads Off |
| 3 | Type the angle 5 | The angle reads 5.0° and the photo turns |
| 4 | Click the angle again | The angle box opens again showing 5.0, with the focus |
| 5 | Press Ctrl+Z | The photo goes back to 0.0° |
| 6 | Click **Export** in the step tabs (the six tabs Perspective to Export, in the top bar) | The Export step shows, with **Quality** at 92% in Export options under the controls |
| 7 | Click the middle of the **Quality** slider | **Quality** reads 75%, and the slider has the focus |
| 8 | Press Ctrl+Z | **Quality** reads 92% again |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### KEY-03.2 In the tuning panel's fields, Ctrl+Z is the browser's own   [auto: desktop]
Before you start:
- Device and browser: a computer with a keyboard and a mouse; a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Rotate step

The named action:
- Add a 5 to the field: press End, then type 5.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Click **90° right** | The photo is turned a quarter clockwise |
| 2 | Press the backtick key (`` ` ``) | The tuning panel opens |
| 3 | Click the first number field in the panel | A text cursor shows in the field |
| 4 | Add a 5 to the field | The field reads its number with a 5 after it |
| 5 | Press Ctrl+Z (Cmd+Z on a Mac) | The field reads its first number again; the photo is still turned a quarter |

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
- Cases: 3

### KEY-04.1 The shortcuts do nothing while typing, or with Alt held   [auto: desktop]
Before you start:
- Device and browser: a computer with a keyboard and a mouse with a wheel; a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Rotate step, fitted to the photo area

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Roll the mouse wheel away from you over the middle of the photo | The photo zooms in, to more than one and a half times its fitted size |
| 2 | Click the angle (**0.0°**, with a pencil after it) | A text box takes its place, with 0.0 in it, selected |
| 3 | Type 3 | The box shows 3; the step is still Rotate (3 alone goes to Crop) |
| 4 | Type f | The box shows 3f; the photo is still zoomed in (f alone fits it to the photo area) |
| 5 | Press Escape | The box closes; the angle reads 0.0° |
| 6 | Press Alt+3 (Option+3 on a Mac) | The step is still Rotate |
| 7 | Press 3 | The Crop step shows |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### KEY-04.2 The shortcuts do nothing with Ctrl held   [auto: desktop]
Before you start:
- Device and browser: a computer with a keyboard; a wide window, the app in the browser's only tab (in a browser with more tabs, Ctrl+3 goes to the third)
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Rotate step, the tuning panel closed

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Press Ctrl+` (the Control key with the backtick key, on a Mac too) | The tuning panel stays closed |
| 2 | Press Ctrl+3 (the Control key with 3, on a Mac too) | The step is still Rotate |
| 3 | Press the backtick key (`` ` ``) alone | The tuning panel opens |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### KEY-04.3 On a Mac, the shortcuts do nothing with Cmd held   [auto: desktop]
Before you start:
- Device and browser: a Mac with a keyboard; a wide window, the app in the browser's only tab (in a browser with more tabs, Cmd+3 goes to the third)
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Rotate step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Press Cmd+3 | The step is still Rotate |
| 2 | Press 3 alone | The Crop step shows |

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
- Device and browser: a computer with a keyboard and a mouse; a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the start screen, with no photo open

Each step's tab is in the step tabs, the six tabs Perspective to Export in the top bar; the open step's tab is selected (a solid white fill).

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Press 6 | Nothing happens: the start screen stays |
| 2 | Click **Open photo** and choose IMG_9136.JPEG | The photo opens on Perspective |
| 3 | Press 2 | The Rotate step shows, its tab selected |
| 4 | Press 3 | The Crop step shows, its tab selected |
| 5 | Press 4 | The Levels step shows, its tab selected |
| 6 | Press 5 | The Overlay step shows, its tab selected |
| 7 | Press 6 | The Export step shows, its tab selected |
| 8 | Press 1 | The Perspective step shows, its tab selected |

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
- Browser data: none for this site (a private window, or the site's data cleared)
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

On the Levels step, holding C shows the photo without levels, with the **Before levels** badge; letting go, or the window losing focus, ends the comparison. While the photo on screen shows no levels, holding C starts no comparison.

- Risk: low
- Check: script
- Layout: both. Needs a keyboard.
- Added: 1.10 baseline
- Changed: 1.10.0
- Anchors: `key:C`, `CONFIG.keys.compare`, `"Before levels"`
- Source: `js/app/input.js` (`onPhotoKey`), `js/app/main.js` (`bindWindowEvents`), `js/app/levels.js` (`setCompare`, `hasLevelsToCompare`)
- Ruling: R9. C compares only while the photo on screen shows levels: with no draft and no applied levels, or with levels applied and **Clear** tapped but not applied, it does nothing. The app does this since 1.10.0.
- Cases: 2

### KEY-07.1 Holding C on Levels shows the photo before levels   [auto: desktop]
Before you start:
- Device and browser: a computer with a keyboard and a mouse; a wide window, with a second window open beside the browser (any app)
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step, with no levels

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Click **Auto** | The photo is brighter |
| 2 | Click **Apply** | **Apply** and **Discard** are greyed out; the photo stays brighter |
| 3 | Hold C down | The photo shows as it was before levels, with the **Before levels** badge at the top left |
| 4 | Let go of C | The photo is brighter again, and the badge goes |
| 5 | Hold C down again | The **Before levels** badge shows again |
| 6 | Still holding C, click the other window, so the browser loses focus | The comparison ends: the photo is brighter again, with no badge |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### KEY-07.2 With no levels, holding C does nothing   [auto: desktop]
Before you start:
- Device and browser: a computer with a keyboard; a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step, with no levels set and none applied

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Hold C down for half a second | No comparison starts: no **Before levels** badge shows |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## KEY-08 Tab steps through the Perspective handles

On Perspective, while the photo has the keyboard focus, Tab and Shift+Tab step through the eight handles (the four corners, then the four edges) and leave the photo after the last handle (Tab) or before the first (Shift+Tab). Tab or Shift+Tab into the photo keeps the handle that is selected: Corner 1 of 4 when a photo opens. With focus anywhere else, Tab moves between controls as usual. While **Preview** is on, the handles are hidden and Tab steps through none of them: it moves the focus on from the photo.

- Risk: medium
- Check: script
- Layout: wide. Needs a keyboard.
- Added: 1.10 baseline
- Changed: 1.10.0
- Anchors: `key:Tab`, `#view`, `.is-keyboard-focus`
- Source: `js/app/input.js` (`onPhotoKey`, `stepHandleByTab`, `onCanvasFocus`)
- Ruling: R2. While Preview is on, the keys do nothing to the handles. The app does this since 1.10.0. R54. Tab or Shift+Tab into the photo keeps the handle selected before, and the keyboard help needn't say the photo needs the focus first. The app already does this.
- Cases: 3

### KEY-08.1 Tab steps through the eight handles once the photo has the focus   [auto: desktop]

Before you start:
- Device and browser: a computer with a keyboard and a mouse; a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the app opened afresh, then IMG_9136.JPEG opened with **Open photo**; it opens on Perspective. Nothing else clicked

The line above the controls (the one line of text at the top of the controls) names the selected handle: Corner 1 of 4 to Corner 4 of 4, then Edge 1 of 4 to Edge 4 of 4.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Press Tab nine times | The focus passes **Open**, the six steps and **Fit to screen**, and lands on the photo; the line reads Corner 1 of 4 |
| 2 | Press Tab four more times | The line reads Edge 1 of 4; the photo still has the focus |
| 3 | Press Tab three more times | The line reads Edge 4 of 4, the last handle |
| 4 | Press Tab once more | The focus leaves the photo for **Nudge left** |
| 5 | Press Shift+Tab | The focus is back on the photo; the line still reads Edge 4 of 4 |
| 6 | Press Shift+Tab | The line reads Edge 3 of 4; the photo still has the focus |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### KEY-08.2 While Preview is on, Tab doesn't step through the handles   [auto: desktop]
Before you start:
- Device and browser: a computer with a keyboard and a mouse; a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step; the line above the controls (the one line of text at the top of the controls) reads Corner 1 of 4

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Click **Preview** | It reads On: the corrected card shows, with no handles |
| 2 | Click the photo area 20 px in from its top-left corner | The photo has the focus |
| 3 | Press Tab | The focus moves from the photo to **Candidate**, which shows a white ring |
| 4 | Click **Preview** again | It reads Off; the line reads Corner 1 of 4, the handle that was selected before row 1 |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### KEY-08.3 Shift+Tab steps back through the handles and leaves before the first   [auto: desktop]

Before you start:
- Device and browser: a computer with a keyboard and a mouse; a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the app opened afresh, then IMG_9136.JPEG opened with **Open photo**; it opens on Perspective. Nothing else clicked

The line above the controls (the one line of text at the top of the controls) names the selected handle.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Press Tab nine times | The focus lands on the photo; the line reads Corner 1 of 4 |
| 2 | Press Tab | The line reads Corner 2 of 4 |
| 3 | Press Shift+Tab | The line reads Corner 1 of 4; the photo still has the focus |
| 4 | Press Shift+Tab | The focus leaves the photo for **Fit to screen** in the top bar |
| 5 | Press Tab | The focus is back on the photo; the line still reads Corner 1 of 4 |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## KEY-09 The photo's keyboard focus ring

The photo shows a 2 px white ring when the keyboard brought focus to it, and none when a click or a touch brought it. Once the keyboard has put the ring there, a click on the photo leaves it: the ring means the keyboard is acting on the photo.

- Risk: low
- Check: script
- Layout: wide. Needs a keyboard.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#view`, `.is-keyboard-focus`
- Source: `js/app/input.js` (`onPointerDown`, `stepHandleByTab`), `css/app.css` (`#view:focus-visible`)
- Ruling: R41. After Tab puts the ring on the photo, a click on the photo leaves the ring, which means the keyboard is acting on the photo. The app already does this. (The code's comment that says otherwise is to be corrected.)
- Cases: 2

### KEY-09.1 The photo shows a white ring when the keyboard brings the focus, not a click   [auto: desktop, webkit]
Before you start:
- Device and browser: a computer with a keyboard and a mouse; a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
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
Ruling R41: the ring stays, as it does today (the photo had the focus already, so the browser keeps it marked as keyboard focus).

Before you start:
- Device and browser: a computer with a keyboard and a mouse; a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Click the photo area 20 px in from its top-left corner | The photo has the focus, with no ring |
| 2 | Press Shift+Tab | The focus moves to **Fit to screen** |
| 3 | Press Tab | The photo has the focus, with a 2 px white ring just inside its edge |
| 4 | Click the photo area 20 px in from its top-left corner again | The ring stays |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## KEY-10 Arrow keys nudge a Perspective handle

On Perspective, the arrow keys move the selected handle by 1 photo pixel, or 10 with Shift; a side's handle moves the side straight in or out. Repeated presses make one undo step. While **Preview** is on, the handles are hidden and the arrow keys move none of them.

- Risk: medium
- Check: script
- Layout: both. Needs a keyboard.
- Added: 1.10 baseline
- Changed: 1.10.0
- Anchors: `key:ArrowLeft`, `key:ArrowUp`, `CONFIG.keys.nudge`, `CONFIG.keys.nudgeShift`
- Source: `js/app/input.js` (`onPhotoKey`, `moveHandleBy`)
- Ruling: R2. While Preview is on, the keys do nothing to the handles. The app does this since 1.10.0. R67. An arrow key moves a corner 1 photo pixel (10 with Shift) with no magnifier; the on-screen arrows move it 1 screen pixel and show the magnifier. The app already does this.
- Cases: 2

### KEY-10.1 The arrow keys move the selected handle; a side moves straight; one undo step   [auto: desktop]

Before you start:
- Device and browser: a computer with a keyboard and a mouse; a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step, Corner 1 of 4 (top left) selected

The line above the controls (the one line of text at the top of the controls) names the selected handle.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Press Tab until the photo has the focus | The line reads Corner 1 of 4 |
| 2 | Press → (the right arrow key) | The top-left corner moves 1 photo pixel right |
| 3 | Press Shift+↓ | The top-left corner moves 10 photo pixels down |
| 4 | Click **Undo** (the arrow curving left, at the top right) | One Undo takes both presses back; **Undo** is greyed out |
| 5 | Click the photo area 20 px in from its top-left corner | The photo has the focus; the line still reads Corner 1 of 4 |
| 6 | Press Tab four times | The line reads Edge 1 of 4: the top edge |
| 7 | Press Shift+↑ | The top edge moves out, straight up, both its corners with it; the bottom corners don't move |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### KEY-10.2 While Preview is on, the arrow keys don't move the handle   [auto: desktop]
Before you start:
- Device and browser: a computer with a keyboard and a mouse; a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step, Corner 1 of 4 selected

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Click **Preview** | It reads On |
| 2 | Press → (the right arrow key) three times | The corrected card doesn't change, and **Undo** (the arrow curving left, at the top right) is still greyed out |
| 3 | Click **Preview** again | It reads Off; the corners are where they were before row 1 |

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
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Logo: green-logo.png from tests/fixtures/ (400 × 400 px, solid pure green)
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
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Logo: green-logo.png from tests/fixtures/ (400 × 400 px, solid pure green)
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
- Check: script
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
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Crop step

The named actions (the right edge's handle is the bar at the middle of the crop box's right edge):
- Shift-drag the right edge: hold Shift down, drag the right edge's handle 60 px to the left, let go of the mouse, then let go of Shift.
- Drag the right edge and press Shift halfway: drag the right edge's handle 30 px to the left, press Shift and keep it down, drag 30 px further, let go of the mouse, then let go of Shift.
- Drag the right edge: drag the right edge's handle 60 px to the left with no key held, and let go.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Click **Free** | **Free** is selected |
| 2 | Shift-drag the right edge | The box is smaller and the same shape |
| 3 | Drag the right edge and press Shift halfway | The box is smaller again, still the same shape |
| 4 | Drag the right edge | The box gets narrower: its shape changes |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## KEY-14 Escape cancels a question

Escape cancels an open question box, as its Cancel does.

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
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Export step, with **2000** selected under Size

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Click **Download** | The question box (the box over the dimmed photo with a question and two or three buttons) asks "Upscale to 2000 px?" |
| 2 | Press Escape | The question box closes, and no file is saved to the downloads folder |

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
- Ruling: R69. Escape closes a phone sheet and nothing else: not **Tap to find card**, not a Levels pick. The app already does this.
- Cases: 1

### KEY-15.1 In the phone layout, Escape closes an options sheet but leaves a pick armed   [auto: phone]
It runs at phone size, though it needs a keyboard: the options sheets are only in the phone layout (on a wide screen the options are always open in the side panel, with nothing to close).

Before you start:
- Device and browser: a computer with a keyboard and a mouse, the browser window made 760 px wide or narrower so the app shows its phone layout (the step tabs along the bottom)
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Rotate step

The options tab is the small tab with an up arrow on the top edge of the controls (the block of buttons and sliders under the photo).

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Click the options tab | ROTATE OPTIONS rise from the bottom |
| 2 | Press Escape | They close |
| 3 | Click **Levels** in the step tabs (the six tabs Perspective to Export, along the bottom) | The Levels step shows |
| 4 | Click **Pick white** | **Pick white** is selected |
| 5 | Click the options tab | The Levels tips rise from the bottom |
| 6 | Press Escape | The tips close; **Pick white** is still selected |

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
- Browser data: none for this site (a private window, or the site's data cleared)
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
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Export step

The named action:
- Tab to X on step S: click S in the step tabs (the six tabs Perspective to Export, in the top bar), click the photo area 20 px in from its top-left corner, then press Tab until X has the focus.

A script also measures each ring (2 px, solid, the app's white); the judge looks at the screenshot.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tab to **Download** on Export | A 2 px white ring around **Download**, clear of its neighbors |
| 2 | Tab to the Size choice **1080** on Export | A 2 px white ring around **1080**, clear of the choices beside it |
| 3 | Tab to the **Free** preset on Crop | A 2 px white ring around **Free** |
| 4 | Tab to **Fill frame** on Rotate | A 2 px white ring around **Fill frame** |
| 5 | Tab to the Straighten ruler on Rotate | A 2 px white ring around the ruler |

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
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Rotate step, the angle at 0.0°

The named action:
- Tab to X: click the photo area 20 px in from its top-left corner, then press Tab until X has the focus (a white ring shows around it).

The step tabs are the six tabs Perspective to Export, in the top bar. The line above the controls is the one line of text at the top of the controls.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tab to the Straighten ruler | A white ring shows around the ruler |
| 2 | Press → (the right arrow key) | The angle moves by 0.1° |
| 3 | Click **Export** in the step tabs | The Export step shows |
| 4 | Tab to **Quality** | A white ring shows around **Quality** |
| 5 | Press ← | **Quality** reads 91% |
| 6 | Click **Perspective** in the step tabs | The Perspective step shows |
| 7 | Tab to **Nudge right** (the right arrow under the line above the controls) | The line above the controls reads Edge 4 of 4: on the way, Tab stepped through the photo's eight handles to the last, the left edge |
| 8 | Press Enter | The left edge moves right once |
| 9 | Press Space | It moves right once more |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.
