# Rotate

The second step: straightening the photo by a fine angle, quarter turns, flips and Fill frame.

## ROT-01 The angle

The line above the controls shows **Straighten** and the angle with one decimal, such as −3.5°, with a true minus sign and never −0.0°.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#rotateAngleText`, "Straighten"
- Source: `js/app/rotate.js` (`angleText`, `syncRotate`)
- Cases: none yet

## ROT-02 The Straighten ruler

Drag the ruler to straighten the photo, from −45° to +45° in 0.1° steps. It has a tick per degree, longer every fifth, and follows the finger one to one (11 px per degree; dragging right lowers the angle). One drag is one undo step.

- Risk: high
- Check: script, touch
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#fine`, `CONFIG.rotate.fineRangeDeg`, `CONFIG.rotate.fineStepDeg`, "Straighten angle in degrees"
- Source: `js/app/rotate.js` (`buildFineRuler`, `bindRotate`, `setFine`); `js/app/parts/ruler.js` (`buildRuler`, `buildRulerScale`, `bindRulerDrag`)
- Cases: none yet

## ROT-03 The angle's limits

However it is set, the angle is kept within ±45° and rounded to 0.1°.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.rotate.fineRangeDeg`, `CONFIG.rotate.fineStepDeg`
- Source: `js/app/rotate.js` (`setFine`)
- Cases: none yet

## ROT-04 Tap the angle to type it

The angle, with a pencil after it, is a button: tapping it puts a text box in its place, filled with the angle and selected, which brings up the number keypad on a phone.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#rotateAngle`, `#rotateAngleField`, "Type the angle", "Angle in degrees"
- Source: `js/app/rotate.js` (`buildStraightenLine`, `startTyping`, `bindTyping`)
- Cases: none yet

## ROT-05 ± and Done

While typing, **Reset** gives way to **±** and **Done**. **±** changes the sign of the typed angle and leaves the cursor at the end.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnAngleSign`, `#btnAngleDone`, "Change the sign"
- Source: `js/app/rotate.js` (`showTypingControls`, `toggleTypedSign`, `bindTyping`)
- Cases: none yet

## ROT-06 Save the typed angle

**Done** or Enter saves the typed angle as its own undo step, kept within ±45° and rounded to 0.1°.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnAngleDone`, `key:Enter`
- Source: `js/app/rotate.js` (`stopTyping`, `bindTyping`, `setFine`)
- Ruling: R1. An empty or unreadable entry keeps the old angle, with no undo step. The app differs today.
- Cases: none yet

## ROT-07 Close the box without saving

Escape, a tap anywhere else, choosing **Straighten** or **Flip**, or leaving the step closes the text box without saving.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `key:Escape`, `#rotateAngleField`
- Source: `js/app/rotate.js` (`bindTyping`, `setRotateMode`, `syncRotate`, `stopTyping`)
- Flag: to confirm. Tapping away from the box throws the typed angle away; only Done or Enter save it.
- Cases: none yet

## ROT-08 What the box accepts

The box accepts a hyphen or a true minus sign, a decimal comma and a trailing °. An empty or unreadable entry is read as 0.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#rotateAngleField`
- Source: `js/app/rotate.js` (`readTypedAngle`)
- Ruling: R1. An empty or unreadable entry keeps the old angle, with no undo step. The app differs today.
- Cases: none yet

## ROT-09 The angle rises above the keyboard

While the on-screen keyboard is up, the angle's line rises to sit on top of the keyboard, and a gap holds its place so the ruler doesn't move.

- Risk: medium
- Check: phone
- Layout: phone. On a wide screen the line stays where it is.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#rotateStraightenLine`, `#rotateLiftGap`
- Source: `js/app/rotate.js` (`placeTypingRow`, `bindTyping`)
- Cases: none yet

## ROT-10 Reset the angle

**Reset**, at the right of the angle's line, sets the angle to 0° as its own undo step. It is off at 0°.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnRotateReset`, "Angle to 0°"
- Source: `js/app/rotate.js` (`buildStraightenLine`, `bindRotate`, `syncRotate`)
- Flag: to confirm. This Reset sets only the angle, while **Reset rotation** in the options sheet also clears turns, flips and Fill frame; neither changes Grid.
- Cases: none yet

## ROT-11 Straighten

**Straighten** is the resting mode: it shows the angle and the ruler.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#toolStraighten`, `#rotateRulerRow`
- Source: `js/app/rotate.js` (`setRotateMode`, `bindRotate`, `syncRotate`)
- Cases: none yet

## ROT-12 Flip

**Flip** swaps in the Flip line (**Flip**, "as you see it on screen") and two buttons, **Horizontal** and **Vertical**.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#toolFlip`, `#rotateFlipLine`, "as you see it on screen"
- Source: `js/app/rotate.js` (`buildFlipLine`, `buildFlipRow`, `setRotateMode`, `syncRotate`)
- Cases: none yet

## ROT-13 Horizontal

**Horizontal** mirrors the photo left to right as seen on screen, as one undo step. The button is lit white while that flip is on.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnFlipHorizontal`, "Horizontal"
- Source: `js/app/rotate.js` (`flip`, `bindRotate`, `syncFlipButton`)
- Cases: none yet

## ROT-14 Vertical

**Vertical** mirrors the photo top to bottom as seen on screen, as one undo step. The button is lit white while that flip is on.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnFlipVertical`, "Vertical"
- Source: `js/app/rotate.js` (`flip`, `bindRotate`, `syncFlipButton`)
- Cases: none yet

## ROT-15 A flip mirrors what you see

A flip mirrors the picture exactly as it looks on screen: it reverses the sign of the straighten angle and the direction of any quarter turns, and mirrors a crop box drawn by hand.

- Risk: medium
- Check: script, saved file
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnFlipHorizontal`, `#btnFlipVertical`, "Flip mirrors the photo as you see it on screen."
- Source: `js/app/rotate.js` (`flip`)
- Flag: to confirm. A flip changes the sign of the angle shown: 3.0° reads −3.0° after **Horizontal**.
- Cases: none yet

## ROT-16 90° left

**90° left** turns the photo a quarter turn counterclockwise, as one undo step.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#toolRotateLeft`, "90° left", "Rotate 90° left"
- Source: `js/app/rotate.js` (`turn`, `bindRotate`)
- Cases: none yet

## ROT-17 90° right

**90° right** turns the photo a quarter turn clockwise, as one undo step.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#toolRotateRight`, "90° right", "Rotate 90° right"
- Source: `js/app/rotate.js` (`turn`, `bindRotate`)
- Cases: none yet

## ROT-18 A quarter turn carries the crop

A quarter turn takes a crop box drawn by hand round with the photo, so it stays on the same part of the picture, and switches the crop between portrait and landscape.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#toolRotateLeft`, `#toolRotateRight`
- Source: `js/app/rotate.js` (`turn`)
- Cases: none yet

## ROT-19 Fill frame

**Fill frame** zooms the crop in until a tilted photo leaves no empty corners. It is part of the edits, and each change is one undo step.

- Risk: medium
- Check: script, saved file
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#toolFillFrame`, "Fill frame: no empty corners", "Fill frame zooms in so a tilted photo leaves no empty corners."
- Source: `js/app/rotate.js` (`bindRotate`, `syncRotate`); `js/engine.js` (`placeCrop`, `shrinkToValid`)
- Cases: none yet

## ROT-20 Grid

**Grid** in the options sheet lays a 48 px grid over the photo, on this step only. It is on by default and never exported.

- Risk: low
- Check: eye
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#rotateGrid`, "Grid", `CONFIG.rotate.gridPx`, "The grid is a guide; it is never exported."
- Source: `js/app/rotate.js` (`bindRotate`, `syncRotate`); `js/app/view.js` (`drawRotateGuides`); `js/app/core.js` (the `app` object's defaults)
- Cases: none yet

## ROT-21 The crop shown on Rotate

On this step the crop shows as a dashed white box over the photo.

- Risk: low
- Check: eye
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: none
- Source: `js/app/view.js` (`drawRotateGuides`, `drawResult`)
- Cases: none yet

## ROT-22 Reset rotation

**Reset rotation** in the options sheet clears the quarter turns, the angle, **Fill frame** and both flips, as one undo step.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#rotateResetRow`, "Reset rotation"
- Source: `js/app/rotate.js` (`buildResetRow`); `js/app/shell.js` (`bindControls`, `resetStep`)
- Flag: to confirm. **Reset rotation** clears turns, flips and Fill frame as well as the angle, while **Reset** beside the angle clears only the angle; neither changes Grid.
- Cases: none yet

## ROT-23 Kept for the session

The Straighten or Flip mode and **Grid** stay as set when another photo is opened. They are not saved and are not undo steps.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#toolStraighten`, `#toolFlip`, `#rotateGrid`
- Source: `js/app/rotate.js` (`setRotateMode`, `bindRotate`); `js/app/core.js` (the `app` object's defaults)
- Flag: to confirm. They survive opening a new photo but not a reload.
- Cases: none yet
