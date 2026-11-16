# Crop

The third step: framing the corrected card with a preset shape or a box drawn by hand.

## CRP-01 The crop's size

The line above the controls reads **Crop**, the crop's size in pixels (such as 2000 × 2000) and **px**. It updates during a drag, and is empty while the corners are crossed.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#cropSize`, `#cropUnit`, "Crop"
- Source: `js/app/crop.js` (`buildCropLine`, `syncCropReadout`); `js/app/shell.js` (`syncReadouts`)
- Cases: none yet

## CRP-02 The presets

Eight presets: **Free**, **Original**, **1:1**, **4:3**, **5:4**, **3:2**, **16:9** and **5:7 card**. The selected one is white, and picking one is one undo step.

- Risk: high
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#cropPresets`, `.preset-chip`, `CONFIG.crop.presets`, "5:7 card"
- Source: `js/app/crop.js` (`buildPresetRow`, `bindCrop`, `pickCropPreset`, `syncCrop`); `js/app/parts/chip.js` (`buildChip`, `updateChip`)
- Cases: none yet

## CRP-03 The row of presets scrolls sideways

The presets sit in one row that scrolls sideways with no scrollbar and runs off the right edge, so it reads as scrollable.

- Risk: low
- Check: eye
- Layout: phone. On a wide screen the presets wrap onto more lines instead.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#cropPresets`, `.chip-row`
- Source: `js/app/parts/chip.js` (`buildChipRow`); `css/app.css` (`.chip-row` in the phone block)
- Cases: none yet

## CRP-04 The row rests on the selected preset

The row rests scrolled to the selected preset when the step opens, and when the selection or its label changes; in between it stays where it was scrolled.

- Risk: low
- Check: script
- Layout: phone. On a wide screen every preset is in view, so there is nothing to scroll.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#cropPresets`, `.preset-chip`
- Source: `js/app/crop.js` (`restPresetRow`, `syncCrop`); `js/app/parts/chip.js` (`revealSelectedChip`)
- Cases: none yet

## CRP-05 Preset names follow the orientation

Preset names follow the crop's orientation: **4:3** or **3:4**, **5:7 card** or **7:5 card**, and so on.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#cropPresets`, "5:7 card"
- Source: `js/app/state.js` (`cropLabel`); `js/app/crop.js` (`syncCrop`)
- Cases: none yet

## CRP-06 A preset reshapes a box drawn by hand

Picking a preset reshapes a crop box drawn by hand to the new shape, keeping its center and area, and shrinks it if needed to stay inside the frame.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#cropPresets`
- Source: `js/app/crop.js` (`pickCropPreset`); `js/app/input.js` (`setCropAbsolute`)
- Cases: none yet

## CRP-07 Fit to card

**Fit to card** puts the crop back around the card at the chosen preset, with 8% padding, dropping any box drawn by hand (one undo step).

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#toolFitToCard`, "Fit to card", "Put the crop back around the card", `CONFIG.crop.fitPaddingPct`
- Source: `js/app/crop.js` (`fitCropToCard`, `bindCrop`); `js/engine.js` (`cropInRotated`, `fitCrop`)
- Flag: to confirm. **Fit to card** is never off and responds to a tap even when nothing changes; a second tap adds no undo step.
- Cases: none yet

## CRP-08 Swap

**Swap** turns the crop between portrait and landscape, a box drawn by hand included, as one undo step. It is off for **Free** and **1:1**.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#toolSwap`, "Swap", "Swap portrait / landscape"
- Source: `js/app/crop.js` (`swapCrop`, `bindCrop`, `syncCrop`)
- Flag: to confirm. **Swap** is an undo step for a single photo but not in a front and back pair.
- Cases: none yet

## CRP-09 The crop follows the card's orientation

The crop's orientation follows the card as it ends up after Perspective and Rotate, unless **Swap** chose one. Swapping back to the card's own orientation hands it back to the card.

- Risk: high
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#toolSwap`, `#cropPresets`
- Source: `js/app/state.js` (`cardOrient`, `cropOrient`, `alignCrop`, `stateChanged`); `js/app/crop.js` (`swapCrop`)
- Cases: none yet

## CRP-10 Move the box

Drag inside the crop box to move it. It stays inside the frame.

- Risk: high
- Check: script, touch
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: "Drag inside the box to move it, and its handles to resize."
- Source: `js/app/input.js` (`hitCrop`, `stepGesture`, `dragCrop`)
- Cases: none yet

## CRP-11 Resize the box

Drag one of the eight handles (four corners, four sides; a press within 24 px counts) to resize the box. It stays at least 16 photo pixels wide and high, and inside the frame.

- Risk: high
- Check: script, touch
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.handle.hitRadius`, `CONFIG.crop.minSizePx`, "Drag inside the box to move it, and its handles to resize."
- Source: `js/app/input.js` (`cropHandles`, `hitCrop`, `dragCrop`)
- Cases: none yet

## CRP-12 A resize keeps the preset's shape

With a preset that has a shape, a resize keeps it: the opposite corner or side stays put, and a side handle keeps the box centered on the other axis.

- Risk: medium
- Check: script, touch
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.crop.presets`
- Source: `js/app/input.js` (`dragCrop`, `anchorAlong`, `roomAlong`, `startAlong`)
- Cases: none yet

## CRP-13 A drag makes the crop hand-drawn

Any drag of the box makes the crop hand-drawn, and the whole drag is one undo step.

- Risk: medium
- Check: script, touch
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnUndo`, `#toolFitToCard`
- Source: `js/app/input.js` (`setCropAbsolute`, `endGesture`); `js/app/state.js` (`commitFrom`)
- Ruling: R8. A cancelled drag puts the box back, with no undo step. The app differs today.
- Cases: none yet

## CRP-14 A press outside the box pans

A press outside the box and its handles pans the view.

- Risk: low
- Check: script, touch
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: none
- Source: `js/app/input.js` (`stepGesture`, `panGesture`, `onPointerMove`)
- Cases: none yet

## CRP-15 How the crop looks

Everything outside the crop is dimmed. The box has a white outline and eight white square handles, the corner ones larger; lines dividing it into thirds show only while the box is dragged.

- Risk: low
- Check: eye
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.colors.dim`, `CONFIG.colors.thirds`
- Source: `js/app/view.js` (`drawCropGuides`)
- Cases: none yet

## CRP-16 Reset crop

**Reset crop** in the options sheet puts the crop back around the card at the default preset, **1:1**, as one undo step. In a front and back pair the 5:7 lock is applied again.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#cropResetRow`, "Reset crop", `CONFIG.crop.defaultPreset`
- Source: `js/app/crop.js` (`buildCropResetRow`); `js/app/shell.js` (`resetStep`); `js/app/state.js` (`cropDefaults`); `js/app/pair.js` (`applyPairRules`)
- Ruling: R4. Reset crop goes back to the remembered preset and leaves the remembered preset unchanged. The app differs today.
- Cases: none yet

## CRP-17 The last preset is remembered

The last preset used is remembered on this device and used for the next photo.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.crop.defaultPreset`, `CONFIG.storageKey`
- Source: `js/app/adapters.js` (`Prefs.load`, `Prefs.save`); `js/app/state.js` (`cropDefaults`, `newState`)
- Ruling: R4. Reset crop leaves the remembered preset unchanged. The app differs today.
- Cases: none yet
