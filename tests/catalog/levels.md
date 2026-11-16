# Levels

The fourth step: setting the white and black points by picking them on the photo or with Auto, as a draft that only Apply makes real.

## LEV-01 Discard

**Discard** throws away the unapplied changes. It is off unless there are some.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnDiscardLevels`, "Discard", "Drop the unapplied changes"
- Source: `js/app/levels.js` (`discardLevels`, `buildLevelsLine`, `syncLevels`)
- Cases: none yet

## LEV-02 Apply

**Apply** (red) applies the pending changes to the photo as one undo step. It is off unless there are some.

- Risk: high
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnApplyLevels`, "Apply", "Apply these levels to the photo"
- Source: `js/app/levels.js` (`applyLevels`, `buildLevelsLine`, `syncLevels`)
- Cases: none yet

## LEV-03 The draft shows only on Levels

Picks, **Auto** and **Clear** change a draft that only the Levels step shows. Every other step, Perspective's **Preview** and the saved file use the applied levels.

- Risk: high
- Check: script, saved file
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnApplyLevels`, `.step-tab-mark`
- Source: `js/app/levels.js` (`draftLevels`, `levelsShown`, `setDraft`); `js/app/view.js` (`drawResult`)
- Cases: none yet

## LEV-04 A draft equal to the applied levels is not pending

A draft that equals the applied levels is not pending: **Apply** and **Discard** stay off, and the Levels tab shows no dot.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `.step-tab-mark`, `#btnApplyLevels`, `#btnDiscardLevels`
- Source: `js/app/levels.js` (`setDraft`, `syncLevels`); `js/app/parts/tab-bar.js` (`updateTabBar`)
- Cases: none yet

## LEV-05 Pick white

**Pick white** arms the color picker for the white point: the button shows as selected, and the line between **Discard** and **Apply** reads "Tap something white". Tapping it again disarms.

- Risk: high
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#levelsPicks`, "Pick white", "Tap something white"
- Source: `js/app/levels.js` (`buildPickRow`, `armDropper`, `levelsHint`, `syncLevels`)
- Flag: to confirm. Escape never disarms the color picker.
- Cases: none yet

## LEV-06 Pick black

**Pick black** arms the color picker for the black point, which is optional; the line reads "Tap something black". Tapping it again disarms.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#levelsPicks`, "Pick black", "Tap something black"
- Source: `js/app/levels.js` (`buildPickRow`, `armDropper`, `levelsHint`, `syncLevels`)
- Cases: none yet

## LEV-07 The color swatches

A small swatch leads each pick button: dashed and empty until set, then the picked color. Its tooltip reads "Not set" or "RGB" and the three values.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#swatchWhite`, `#swatchBlack`, "Not set", "RGB "
- Source: `js/app/levels.js` (`buildPickRow`, `syncLevels`); `js/app/parts/segmented-control.js` (`buildSwatch`, `updateSwatch`)
- Cases: none yet

## LEV-08 Aim and pick

With a pick armed, a press on the photo aims, and the color is taken where the finger or pointer lifts. The photo doesn't pan.

- Risk: high
- Check: script, touch
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: "Tap something white", "Tap something black", `CONFIG.levels.sampleRadiusPx`
- Source: `js/app/input.js` (`stepGesture`, `onPointerMove`, `endGesture`); `js/app/levels.js` (`pickAt`)
- Ruling: R8. A second finger cancels the pick and leaves the color picker armed. The app differs today.
- Flag: to confirm. While a pick is armed one finger can't pan, and the color is taken where the finger lifts, not where it pressed.
- Cases: none yet

## LEV-09 The picker's magnifier

While pressing, a round magnifier shows the screen at 4 times (so with the levels being shown), with the sample circle in the middle.

- Risk: low
- Check: eye
- Layout: both. It is placed by pointer type, as Perspective's magnifier is: pinned to a top corner for touch, beside the cursor for a mouse.
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.loupeZoom`, `CONFIG.loupeSize`, `CONFIG.levels.sampleRadiusPx`
- Source: `js/app/levels.js` (`drawScreenLoupe`, `drawLevelsOverlay`); `js/app/view.js` (`loupeCenter`, `loupeRadius`)
- Cases: none yet

## LEV-10 How a pick samples the photo

A pick averages a small patch of the full-resolution photo under the point (4 screen px in radius, never less than 4 photo px), leaving out the darkest and the brightest quarter of its pixels.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.levels.sampleRadiusPx`, `CONFIG.levels.sampleTrim`
- Source: `js/app/levels.js` (`pickAt`); `js/engine.js` (`meanColor`)
- Cases: none yet

## LEV-11 A pick that works

A pick that works sets the point, marks where it was taken and disarms the color picker.

- Risk: medium
- Check: script, touch
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#swatchWhite`, `#swatchBlack`, `#levelsPicks`
- Source: `js/app/levels.js` (`pickAt`, `setDraft`)
- Cases: none yet

## LEV-12 A pick that can't work

A pick that can't work shows a warning and leaves the color picker armed: a spot outside the photo; a white not at least 20 brighter than the black point; a black brighter than 100 (on a scale of 0 to 255); a black not at least 20 darker than the white point.

- Risk: medium
- Check: script, touch
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: "That spot is outside the photo.", "That spot is darker than the black point. Pick something brighter.", "That spot is too light to be a black point. ", `CONFIG.levels.maxBlackLuma`
- Source: `js/app/levels.js` (`pickAt`, `pickProblem`)
- Cases: none yet

## LEV-13 Pick marks

A ring labelled **W** or **B** marks where each point was picked (Auto's points have none). The marks hide while comparing.

- Risk: low
- Check: eye
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: "W", "B"
- Source: `js/app/levels.js` (`drawPickMarker`, `drawLevelsOverlay`)
- Cases: none yet

## LEV-14 Auto

**Auto** estimates the white and black points from the framed photo into the draft and removes the pick marks; with no clear black it sets the white point only. A pop-up says which it set.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#toolAutoLevels`, "Auto set white and black points. Check them, then Apply.", "Auto set the white point (no clear black). Check it, then Apply.", `CONFIG.levels.autoBlackMaxSpread`
- Source: `js/app/levels.js` (`autoLevelsDraft`, `renderSmall`); `js/engine.js` (`autoLevels`)
- Flag: to confirm. Auto shows a pop-up when it works, though arming a pick shows none; when it fails, "Couldn’t estimate levels from this image." gives no next step.
- Cases: none yet

## LEV-15 Clear

**Clear** makes a draft with neither point and disarms the color picker; with levels applied, **Apply** then removes them. It is off when neither point is set.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#toolClearLevels`, "Clear", "Clear both points (Apply to remove applied levels)"
- Source: `js/app/levels.js` (`clearLevelsDraft`, `syncLevels`)
- Cases: none yet

## LEV-16 Hold to compare

With no pick armed, press and hold the photo for 250 ms without moving to see it with no levels; letting go ends it. The view doesn't pan meanwhile.

- Risk: medium
- Check: script, touch
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.levels.compareHoldMs`, "Hold the photo to compare"
- Source: `js/app/input.js` (`panGesture`, `onPointerMove`, `endGesture`); `js/app/levels.js` (`setCompare`)
- Ruling: R9. Holding does nothing when there is no draft and no applied levels. R10. A press that showed the comparison never also counts as a tap. The app differs today.
- Cases: none yet

## LEV-17 The Before levels badge

While comparing, a badge reading **Before levels** shows at the top left of the photo.

- Risk: low
- Check: eye
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: "Before levels"
- Source: `js/app/levels.js` (`drawCompareBadge`, `drawLevelsOverlay`, `setCompare`)
- Ruling: R9. With no draft and no applied levels there is no comparison, so no badge. The app differs today.
- Flag: to confirm. The badge fades in over 80 ms even when the device asks for reduced motion.
- Cases: none yet

## LEV-18 Leaving the step

Leaving the Levels step disarms the color picker and ends any comparison. The draft is kept.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#levelsPicks`, "Before levels"
- Source: `js/app/shell.js` (`setTab`)
- Cases: none yet

## LEV-19 Levels never carry over

A newly opened photo starts with no levels and no draft.

- Risk: high
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `.step-tab-mark`, `#btnApplyLevels`
- Source: `js/app/state.js` (`defaultState`, `resetPhotoState`, `openFile`)
- Cases: none yet

## LEV-20 The draft comes back on Resume

An unapplied draft is saved with the session and comes back on Resume. In a front and back pair each side keeps its own.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `.step-tab-mark`, "Resumed where you left off.", `CONFIG.session.enabled`
- Source: `js/app/adapters.js` (`Session.snapshot`); `js/app/state.js` (`restoreLevelsDraft`, `openFile`); `js/app/pair.js` (`captureSide`, `applySide`)
- Cases: none yet

## LEV-21 Where the picked points land

In the saved file the picked white comes out at 245 and the black at 8, worked out in linear light.

- Risk: medium
- Check: script, saved file
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.levels.whiteTarget`, `CONFIG.levels.blackTarget`
- Source: `js/engine.js` (`levelsLut`)
- Cases: none yet

## LEV-22 The one-line instruction

The instruction between **Discard** and **Apply** reads "Pick white, or try Auto", "Tap something white" or "Tap something black" while a pick is armed, or "Hold the photo to compare" while there are levels to compare against. Screen readers announce it, it is rewritten only when it changes, and it can't be tapped.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#levelsHint`, "Pick white, or try Auto", "Hold the photo to compare"
- Source: `js/app/levels.js` (`buildLevelsLine`, `levelsHint`, `syncLevels`); `css/app.css` (`.levels-hint`)
- Cases: none yet

## LEV-23 The sheet is the tips

The options sheet, titled **Levels tips**, holds only the tips: no options, no Tips row and no reset.

- Risk: low
- Check: script
- Layout: both. On a wide screen the tips show in the side panel, followed by the keyboard help under **Tips and keys**.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#levelsSheet`, "Levels tips", "Tips and keys"
- Source: `js/app/levels.js` (`buildLevelsSheet`)
- Flag: to confirm. On a wide screen the Levels section shows two tips headings, "Levels tips" and "Tips and keys".
- Cases: none yet

## LEV-24 Only Apply is an undo step

Only **Apply** adds an undo step. Arming a pick, the picks themselves, **Auto**, **Clear**, **Discard** and comparing do not.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnApplyLevels`, `#btnUndo`
- Source: `js/app/levels.js` (`setDraft`, `applyLevels`, `discardLevels`)
- Cases: none yet
