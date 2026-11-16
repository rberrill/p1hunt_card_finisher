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
- Cases: none yet

## KEY-02 Redo from the keyboard

Shift+Ctrl+Z (Shift+Cmd+Z on a Mac), or Ctrl+Y (Cmd+Y), redoes, as **Redo** does.

- Risk: medium
- Check: script
- Layout: both. Needs a keyboard.
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.keys.redo`, `CONFIG.keys.redoAlt`, `#btnRedo`, `"Redo (Shift+Ctrl/Cmd+Z)"`
- Source: `js/app/input.js` (`onKeyDown`, `keyMatches`)
- Flag: to confirm. **Redo**'s tooltip names only Shift+Ctrl/Cmd+Z, though Ctrl/Cmd+Y also works.
- Cases: none yet

## KEY-03 Undo and redo keys work from any control

The undo and redo keys still undo and redo the app's edits while a slider, a switch or the typed angle has focus. Only the tuning panel's fields keep the browser's own text undo.

- Risk: low
- Check: script
- Layout: both. Needs a keyboard.
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.keys.undo`, `#rotateAngleField`, `#quality`, `#debugPanel`
- Source: `js/app/input.js` (`onKeyDown`)
- Cases: none yet

## KEY-04 Shortcuts stay out of the way of typing

The other shortcuts do nothing while you type in a field, or while Ctrl, Cmd or Alt is held.

- Risk: low
- Check: script
- Layout: both. Needs a keyboard.
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.keys.fit`, `CONFIG.keys.debug`, `#rotateAngleField`
- Source: `js/app/input.js` (`onKeyDown`)
- Cases: none yet

## KEY-05 Number keys go to a step

With a photo open, the keys 1 to 6 go to Perspective, Rotate, Crop, Levels, Overlay and Export.

- Risk: medium
- Check: script
- Layout: both. Needs a keyboard.
- Added: 1.10 baseline
- Changed: none
- Anchors: `key:1`, `key:6`, `.step-tab`
- Source: `js/app/input.js` (`onPhotoKey`), `js/app/shell.js` (`setTab`)
- Cases: none yet

## KEY-06 F fits the photo to the screen

With a photo open, F fits the current view to the screen, as **Fit to screen** does.

- Risk: low
- Check: script
- Layout: both. Needs a keyboard.
- Added: 1.10 baseline
- Changed: none
- Anchors: `key:F`, `CONFIG.keys.fit`, `#btnFit`, `"Fit to screen (F)"`
- Source: `js/app/input.js` (`onPhotoKey`)
- Cases: none yet

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
- Cases: none yet

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
- Cases: none yet

## KEY-09 The photo's keyboard focus ring

The photo shows a 2 px white ring when the keyboard brought focus to it, and none after a click or a touch.

- Risk: low
- Check: script
- Layout: wide. Needs a keyboard.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#view`, `.is-keyboard-focus`
- Source: `js/app/input.js` (`onPointerDown`, `stepHandleByTab`), `css/app.css` (`#view:focus-visible`)
- Cases: none yet

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
- Cases: none yet

## KEY-11 Arrow keys move the logo

On Overlay, the arrow keys move the logo by 0.5% of the photo's width, or 5% with Shift.

- Risk: low
- Check: script
- Layout: both. Needs a keyboard.
- Added: 1.10 baseline
- Changed: none
- Anchors: `key:ArrowRight`, `CONFIG.overlay.nudgePct`, `CONFIG.overlay.nudgeShiftPct`
- Source: `js/app/overlay.js` (`overlayKey`, `nudge`)
- Cases: none yet

## KEY-12 Plus and minus size the logo

On Overlay, + (or =) makes the logo 5% bigger and − (or _) 5% smaller.

- Risk: low
- Check: script
- Layout: both. Needs a keyboard.
- Added: 1.10 baseline
- Changed: none
- Anchors: `key:+`, `key:=`, `key:-`, `CONFIG.overlay.sizeStep`
- Source: `js/app/overlay.js` (`overlayKey`, `nudge`)
- Cases: none yet

## KEY-13 Shift keeps a Free crop's shape

With the **Free** crop preset, holding Shift while dragging the crop box (from the press or at any point during the drag) keeps its shape.

- Risk: low
- Check: script, touch
- Layout: both. Needs a keyboard and a mouse.
- Added: 1.10 baseline
- Changed: none
- Anchors: `key:Shift`, `"Free"`
- Source: `js/app/input.js` (`onPointerDown`, `stepGesture`, `dragCrop`)
- Cases: none yet

## KEY-14 Escape cancels a question

Escape cancels an open question card, as its Cancel does.

- Risk: medium
- Check: script
- Layout: both. Needs a keyboard.
- Added: 1.10 baseline
- Changed: none
- Anchors: `key:Escape`, `#pairPrompt`
- Source: `js/app/input.js` (`onKeyDown`), `js/app/pair.js` (`hidePrompt`)
- Cases: none yet

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
- Cases: none yet

## KEY-16 Backtick opens the tuning panel

The backtick key (`` ` ``) opens and closes the tuning panel, with or without a photo open.

- Risk: low
- Check: script
- Layout: both. Needs a keyboard.
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.keys.debug`, `#debugPanel`
- Source: `js/app/input.js` (`onKeyDown`), `js/app/debug-panel.js` (`toggleDebugPanel`)
- Cases: none yet

## KEY-17 Every control shows where keyboard focus is

Every control shows a 2 px white ring when it has keyboard focus.

- Risk: low
- Check: eye
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `.action-button`, `.preset-chip`, `.segment`, `.switch`
- Source: `css/app.css` (the focus rules before the top bar part)
- Cases: none yet

## KEY-18 Focused controls take their own keys

A focused control takes its own keys: the arrow keys move the Straighten ruler and the sliders, and Enter or Space on an on-screen arrow nudges once.

- Risk: low
- Check: script
- Layout: both. Needs a keyboard.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#fine`, `.slider`, `.nudge-key`
- Source: `js/app/parts/ruler.js` (`buildRuler`), `js/app/parts/slider.js` (`buildSlider`), `js/app/parts/nudge-pad.js` (`bindNudgePad`)
- Cases: none yet
