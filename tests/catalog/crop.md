# Crop

The third step: framing the corrected card with a preset shape or a box drawn by hand.

Most cases use IMG_9136.JPEG from samples/, a PSA slab whose card stands upright; with the default **1:1** the crop is 1400 × 1400 px. The crop box's handles are the eight white squares on its corners and the middles of its sides.

## CRP-01 The crop's size

The line above the controls reads **Crop**, the crop's size in pixels (such as 2000 × 2000) and **px**. It updates during a drag, and is empty while the corners are crossed.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#cropSize`, `#cropUnit`, "Crop"
- Source: `js/app/crop.js` (`buildCropLine`, `syncCropReadout`); `js/app/shell.js` (`syncReadouts`)
- Cases: 1

### CRP-01.1 The size line follows the crop, and is empty while the corners cross   [auto: phone]
Before you start:
- Device and browser: any; a phone-width window (drag with a finger)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Crop step (tap **Crop** in the step bar), nothing changed yet

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the line above the presets | It reads CROP, then 1400 × 1400, then px |
| 2 | Put a finger on the bottom-right handle and drag it 40 px up and to the left, without lifting | While the finger moves, the size gets smaller with the box, matching it |
| 3 | Lift the finger, then tap **Perspective** in the step bar | The Perspective step shows |
| 4 | Drag the top-left corner ring past the bottom-right one, so the outline crosses itself | The outline is crossed |
| 5 | Tap **Crop** in the step bar | The line reads CROP with no size and no px |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## CRP-02 The presets

Eight presets: **Free**, **Original**, **1:1**, **4:3**, **5:4**, **3:2**, **16:9** and **5:7 card**. The selected one is white, and picking one is one undo step.

- Risk: high
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#cropPresets`, `.preset-chip`, `CONFIG.crop.presets`, "5:7 card"
- Source: `js/app/crop.js` (`buildPresetRow`, `bindCrop`, `pickCropPreset`, `syncCrop`); `js/app/parts/chip.js` (`buildChip`, `updateChip`)
- Cases: 1

### CRP-02.1 Eight presets; the chosen one is white, one undo step a pick   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Crop step, nothing changed yet (**Undo** at the top right is greyed out), in a private window (so no preset is remembered)

With the card upright, the shapes read tall first (CRP-05).

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the row of presets (on a phone, swipe it to see them all) | Eight, in order: **Free**, **Original**, **1:1**, **3:4**, **4:5**, **2:3**, **9:16**, **5:7 card**; **1:1** is solid white, the others are not |
| 2 | Tap **4:5** | **4:5** is white instead of **1:1**; the box is 4 wide to 5 tall |
| 3 | Tap **Undo** (the arrow curving left, at the top right) | **1:1** is white again; **Undo** is greyed out |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## CRP-03 The row of presets scrolls sideways

The presets sit in one row that scrolls sideways with no scrollbar and runs off the right edge, so it reads as scrollable.

- Risk: low
- Check: eye
- Layout: phone. On a wide screen the presets wrap onto more lines instead.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#cropPresets`, `.chip-row`
- Source: `js/app/parts/chip.js` (`buildChipRow`); `css/app.css` (`.chip-row` in the phone block)
- Cases: 2

### CRP-03.1 The row of presets runs off the right edge, for a person to judge   [eye]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Crop step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the row of presets | One row, wider than the screen; the last preset in view is cut off by the right edge of the screen; no scrollbar under the row |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### CRP-03.2 On a wide screen every preset is in view   [auto: desktop]
Before you start:
- Device and browser: a computer; a wide window, 1280 × 800 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Crop step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the presets in the side panel | All eight are in view, on more than one line, with nothing to scroll |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## CRP-04 The row rests on the selected preset

The row rests scrolled to the selected preset when the step opens, and when the selection or its label changes; in between it stays where it was scrolled.

- Risk: low
- Check: script
- Layout: phone. On a wide screen every preset is in view, so there is nothing to scroll.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#cropPresets`, `.preset-chip`
- Source: `js/app/crop.js` (`restPresetRow`, `syncCrop`); `js/app/parts/chip.js` (`revealSelectedChip`)
- Cases: 1

### CRP-04.1 The row rests on the chosen preset, and otherwise stays where it was scrolled   [auto: phone]
Before you start:
- Device and browser: a phone-width window (the script swipes the row with the mouse wheel)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Crop step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Swipe the row of presets to its end and tap **5:7 card** | **5:7 card** is white |
| 2 | Swipe the row back to its start | **Free** is first and **5:7 card** is out of view |
| 3 | Tap **Fit to card** in the row of tools | The row stays at its start |
| 4 | Tap **Rotate** in the step bar, then **Crop** | The row rests with **5:7 card** wholly in view |
| 5 | Swipe the row back to its start, then tap **Swap** | The chosen preset now reads **7:5 card**, and the row rests with it wholly in view |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## CRP-05 Preset names follow the orientation

Preset names follow the crop's orientation: **4:3** or **3:4**, **5:7 card** or **7:5 card**, and so on.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#cropPresets`, "5:7 card"
- Source: `js/app/state.js` (`cropLabel`); `js/app/crop.js` (`syncCrop`)
- Cases: 1

### CRP-05.1 Preset names follow the crop's orientation   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Crop step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Read the presets | **Free**, **Original**, **1:1**, **3:4**, **4:5**, **2:3**, **9:16**, **5:7 card** |
| 2 | Tap **4:5**, then **Swap** in the row of tools | The crop lies on its side, and the presets read **Free**, **Original**, **1:1**, **4:3**, **5:4**, **3:2**, **16:9**, **7:5 card**; **5:4** is white |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## CRP-06 A preset reshapes a box drawn by hand

Picking a preset reshapes a crop box drawn by hand to the new shape, keeping its center and area, and shrinks it if needed to stay inside the frame.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#cropPresets`
- Source: `js/app/crop.js` (`pickCropPreset`); `js/app/input.js` (`setCropAbsolute`)
- Cases: 2

### CRP-06.1 A preset reshapes a box drawn by hand around the same middle   [auto: phone]
Before you start:
- Device and browser: any; a phone-width window (drag with a finger) or a wide window (drag with the mouse)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Crop step, **1:1** chosen

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Drag the box from its middle 40 px to the right, and let go | The box moves right as far as the picture allows |
| 2 | Tap **4:5** | The box becomes 4 wide to 5 tall, with the same middle and the same area as the square before (within 1%) |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### CRP-06.2 A reshaped box too big for the picture shrinks to fit it   [auto: phone]
Before you start:
- Device and browser: any; a phone-width window (drag with a finger)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Crop step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Free** | **Free** is white |
| 2 | Drag the top-left handle far up and to the left, past the picture's corner; then the bottom-right handle far down and to the right | The box covers the whole picture |
| 3 | Tap **1:1** | A square of the same area would be wider than the picture, so the box is a square exactly as wide as the picture, inside it |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

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
- Cases: 2

### CRP-07.1 Fit to card puts the box back around the card, one undo step   [auto: phone]
Flag: to confirm. Written to today's behavior.

Before you start:
- Device and browser: any; a phone-width window (drag with a finger) or a wide window (drag with the mouse)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Crop step, **1:1** chosen, nothing changed yet

The padding is 8% of the card's longer side (its height here) on each side; the shorter way the box widens to the preset's shape.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the box | It sits around the card: above and below the card a margin of 8% of the card's height, and the card centered across it |
| 2 | Drag the box from its middle 40 px right and 40 px down, and let go | The box has moved |
| 3 | Tap **Fit to card** in the row of tools | The box is back exactly where it was in row 1 |
| 4 | Tap **Undo** (the arrow curving left, at the top right) | The box is back where it was dragged |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### CRP-07.2 Fit to card is never greyed out, and a tap that changes nothing adds no undo step   [auto: phone]
Flag: to confirm. Written to today's behavior.

Before you start:
- Device and browser: any; a phone-width window (drag with a finger) or a wide window (drag with the mouse)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Crop step, nothing changed yet (**Undo** at the top right is greyed out)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at **Fit to card** in the row of tools | It is not greyed out, though the box is already around the card |
| 2 | Tap **Fit to card** | Nothing changes; **Undo** is still greyed out |
| 3 | Drag the box from its middle 40 px to the right, and let go | The box has moved |
| 4 | Tap **Fit to card** twice | The box is back around the card |
| 5 | Tap **Undo** once | The box is back where it was dragged: the second tap added no undo step |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

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
- Cases: 3

### CRP-08.1 Swap turns the crop between portrait and landscape, one undo step   [auto: phone]
Flag: to confirm. Written to today's behavior.

Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Crop step, **1:1** chosen

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at **Swap** in the row of tools | It is greyed out |
| 2 | Tap **Free** | **Swap** is still greyed out |
| 3 | Tap **4:5** | **Swap** is no longer greyed out |
| 4 | Tap **Swap** | The box lies on its side, 5 wide to 4 tall; **5:4** is white |
| 5 | Tap **Undo** (the arrow curving left, at the top right) | The box stands upright again, 4:5 |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### CRP-08.2 Swap turns a box drawn by hand about its middle   [auto: phone]
Flag: to confirm. Written to today's behavior.

Before you start:
- Device and browser: any; a phone-width window (drag with a finger) or a wide window (drag with the mouse)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Crop step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **4:5** | The box is 4 wide to 5 tall |
| 2 | Drag the bottom-right handle 80 px up and to the left, and let go; then drag the box from its middle 40 px to the right | A smaller box, moved to the right |
| 3 | Tap **Swap** | The box's width and height have changed places, around the same middle |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### CRP-08.3 In a front and back pair, Swap adds no undo step   [auto: phone]
Flag: to confirm. Written to today's behavior.

Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: the front open, paired with the back (on Export, **Add back**, then choose the back), the back on screen

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Crop** in the step bar; note whether **Undo** (the arrow curving left, at the top right) is greyed out | **5:7 card** is white and the box stands upright |
| 2 | Tap **Swap** | **7:5 card** is white and the box lies on its side; **Undo** is as it was in row 1: Swap added no undo step |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## CRP-09 The crop follows the card's orientation

The crop's orientation follows the card as it ends up after Perspective and Rotate, unless **Swap** chose one. Swapping back to the card's own orientation hands it back to the card.

- Risk: high
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#toolSwap`, `#cropPresets`
- Source: `js/app/state.js` (`cardOrient`, `cropOrient`, `alignCrop`, `stateChanged`); `js/app/crop.js` (`swapCrop`)
- Cases: 4

### CRP-09.1 The crop turns with the card   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Crop step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **4:5** | The box is 4 wide to 5 tall |
| 2 | Tap **Rotate** in the step bar, then **90° right**, then **Crop** | The card lies on its side and so does the crop: **5:4** is white and the box is wider than tall |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### CRP-09.2 Once Swap has chosen, the crop keeps its orientation when the card's changes   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Crop step

Set the card's orientation: tap **Perspective** in the step bar, open **Perspective options** (on a phone, the **Options** tab, the tab with an up arrow on the top edge of the controls; on a wide screen they are always shown), tap **Landscape** or **Portrait** under CARD ORIENTATION, close the options, then tap **Crop**.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **4:5**, then **Swap** | The crop lies on its side: **5:4** is white |
| 2 | Set the card's orientation to **Landscape** | Back on Crop, **5:4** is still white |
| 3 | Set the card's orientation to **Portrait** | Back on Crop, **5:4** is still white and the box is wider than tall, as Swap chose |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### CRP-09.3 Swapping back to the card's orientation hands the crop back to the card   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Crop step

Set the card's orientation as in CRP-09.2.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **4:5**, then **Swap** twice | The crop stands upright again: **4:5** is white |
| 2 | Set the card's orientation to **Landscape** | Back on Crop, the crop follows the card: **5:4** is white and the box is wider than tall |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### CRP-09.4 A quarter turn keeps Swap's choice across the card   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Crop step

A quarter turn on Rotate turns the crop with the photo (ROT-18), so a crop Swap laid across the card stays across it.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **4:5**, then **Swap** | The crop lies across the upright card: **5:4** is white |
| 2 | Tap **Rotate** in the step bar, then **90° right**, then **Crop** | The card lies on its side and the crop stands upright, still across it: **4:5** is white |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## CRP-10 Move the box

Drag inside the crop box to move it. It stays inside the frame.

- Risk: high
- Check: script, touch
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: "Drag inside the box to move it, and its handles to resize."
- Source: `js/app/input.js` (`hitCrop`, `stepGesture`, `dragCrop`)
- Cases: 2

### CRP-10.1 Dragging inside the box moves it, as one undo step   [auto: phone, webkit]
Before you start:
- Device and browser: an iPhone, or a phone-width window (drag with a finger)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Crop step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **4:5**, then drag the bottom-right handle 80 px up and to the left | A smaller box, with room around it |
| 2 | Drag the box from its middle 40 px right and 20 px down, and let go | The box moved with the finger, 40 px right and 20 px down on screen, and kept its size |
| 3 | Tap **Undo** (the arrow curving left, at the top right) | The box is back where it was before row 2 |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### CRP-10.2 A moved box stops at the edge of the picture   [auto: phone]
Before you start:
- Device and browser: any; a phone-width window (drag with a finger)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Crop step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Drag the box from its middle far to the left, past the edge of the screen, and let go | The box stops against the picture's left edge, at the same height and the same size |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## CRP-11 Resize the box

Drag one of the eight handles (four corners, four sides; a press within 24 px counts) to resize the box. It stays at least 16 photo pixels wide and high, and inside the frame.

- Risk: high
- Check: script, touch
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.handle.hitRadius`, `CONFIG.crop.minSizePx`, "Drag inside the box to move it, and its handles to resize."
- Source: `js/app/input.js` (`cropHandles`, `hitCrop`, `dragCrop`)
- Cases: 3

### CRP-11.1 A press near a handle grabs it and resizes the box   [auto: phone, webkit]
Before you start:
- Device and browser: an iPhone, or a phone-width window (drag with a finger)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Crop step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Free** | **Free** is white |
| 2 | Put a finger 12 px right of and 12 px below the bottom-right handle (about 17 px from it, outside the box), drag 40 px up and to the left, and let go | The right and bottom edges moved in by 40 px on screen; the top-left corner has not moved |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### CRP-11.2 The box is never smaller than 16 photo pixels   [auto: phone]
Before you start:
- Device and browser: any; a phone-width window (drag with a finger)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Crop step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Free** | **Free** is white |
| 2 | Drag the bottom-right handle far up and to the left, well past the top-left handle, and let go | The box is as small as it gets: the line reads CROP 16 × 16 px, and its top-left corner has not moved |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### CRP-11.3 A resized box stops at the edge of the picture   [auto: phone]
Before you start:
- Device and browser: any; a phone-width window (drag with a finger)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Crop step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Free** | **Free** is white |
| 2 | Drag the handle at the middle of the right side far to the right, past the edge of the screen, and let go | The box's right edge stops at the picture's right edge; its left edge and its height have not changed |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## CRP-12 A resize keeps the preset's shape

With a preset that has a shape, a resize keeps it: the opposite corner or side stays put, and a side handle keeps the box centered on the other axis.

- Risk: medium
- Check: script, touch
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.crop.presets`
- Source: `js/app/input.js` (`dragCrop`, `anchorAlong`, `roomAlong`, `startAlong`)
- Cases: 2

### CRP-12.1 A corner drag keeps the preset's shape, the opposite corner still   [auto: phone]
Before you start:
- Device and browser: any; a phone-width window (drag with a finger) or a wide window (drag with the mouse)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Crop step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **4:5** | The box is 4 wide to 5 tall |
| 2 | Drag the bottom-right handle 40 px up and to the left, and let go | The box is smaller and still 4:5; its top-left corner has not moved |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### CRP-12.2 A side drag keeps the preset's shape, centered on the other axis   [auto: phone]
Before you start:
- Device and browser: any; a phone-width window (drag with a finger) or a wide window (drag with the mouse)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Crop step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **4:5** | The box is 4 wide to 5 tall |
| 2 | Drag the handle at the middle of the right side 40 px to the left, and let go | The box is narrower and shorter, still 4:5; its left edge has not moved, and its middle is at the same height as before |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

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
- Cases: 2

### CRP-13.1 A drag makes the box one drawn by hand, as one undo step   [auto: phone]
Before you start:
- Device and browser: any; a phone-width window (drag with a finger) or a wide window (drag with the mouse)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Crop step, **1:1** chosen, nothing changed yet (**Undo** at the top right is greyed out)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Drag the box from its middle 40 px to the right, and let go | The box moves right |
| 2 | Tap **Undo** (the arrow curving left, at the top right) | The whole drag is undone: the box is back around the card; **Undo** is greyed out |
| 3 | Tap **Redo** (the arrow curving right, beside Undo), then **4:5** | The box becomes 4:5 around where it was dragged to, not around the card's middle: it is a box drawn by hand |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### CRP-13.2 A drag the phone cancels puts the box back   [auto: phone]
Written to ruling R8; it fails until that is built (BUG-060).

Before you start:
- Device and browser: an iPhone, Safari (the script uses a phone-width window and has the browser cancel the touch)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Crop step, nothing changed yet (**Undo** at the top right is greyed out)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Put a finger in the middle of the box and drag it 40 px right, without lifting | The box follows the finger |
| 2 | Without lifting that finger, swipe down from the top-right corner of the screen with another, so the phone opens Control Center and takes the touch | Control Center opens |
| 3 | Close Control Center | The box is back where it was before the drag; **Undo** is greyed out |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## CRP-14 A press outside the box pans

A press outside the box and its handles pans the view.

- Risk: low
- Check: script, touch
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: none
- Source: `js/app/input.js` (`stepGesture`, `panGesture`, `onPointerMove`)
- Cases: 1

### CRP-14.1 A press outside the box moves the photo   [auto: phone]
Before you start:
- Device and browser: any; a phone-width window (drag with a finger)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Crop step, nothing changed yet (**Undo** at the top right is greyed out)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Put a finger on the dimmed photo 60 px above the middle of the box's top edge, drag 40 px down, and let go | The photo and the box move 40 px down together; the box covers the same part of the picture; **Undo** is still greyed out |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## CRP-15 How the crop looks

Everything outside the crop is dimmed. The box has a white outline and eight white square handles, the corner ones larger; lines dividing it into thirds show only while the box is dragged.

- Risk: low
- Check: eye
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.colors.dim`, `CONFIG.colors.thirds`
- Source: `js/app/view.js` (`drawCropGuides`)
- Cases: 1

### CRP-15.1 How the crop looks, for a person to judge   [eye]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px (drag with a finger)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Crop step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the photo | Outside the box the photo is dimmed; the box has a thin white outline, a white square at each corner and a smaller one at the middle of each side; no lines inside the box |
| 2 | Put a finger in the middle of the box and drag it 20 px right, without lifting | Two faint lines across and two down divide the box into thirds |
| 3 | Lift the finger | The lines dividing the box have gone |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

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
- Cases: 3

### CRP-16.1 Reset crop puts a box drawn by hand back around the card, one undo step   [auto: phone]
Before you start:
- Device and browser: any; a phone-width window (drag with a finger) or a wide window (drag with the mouse)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Crop step, **1:1** chosen, nothing changed yet

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Drag the box from its middle 40 px right and 40 px down, and let go | The box has moved |
| 2 | Open **Crop options**: on a phone, tap the **Options** tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls | **Reset crop** shows |
| 3 | Tap **Reset crop**, then close the options (on a phone, the **×** at their top right) | The 1:1 box is back around the card, as it was at the start |
| 4 | Tap **Undo** (the arrow curving left, at the top right) | The box is back where it was dragged |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### CRP-16.2 Reset crop keeps the preset in use   [auto: phone]
Written to ruling R4; it fails until that is built (BUG-100).

Before you start:
- Device and browser: any; a phone-width window (drag with a finger) or a wide window (drag with the mouse)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Crop step

Choosing a preset makes it the remembered one (CRP-17).

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **4:5** | The box is 4:5 around the card |
| 2 | Drag the box from its middle 40 px right and 40 px down, and let go | The box has moved |
| 3 | Open **Crop options**, tap **Reset crop**, then close the options | **4:5** is still white, and the box is back around the card at 4:5, as in row 1 |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### CRP-16.3 In a front and back pair, Reset crop keeps 5:7 card   [auto: phone]
Before you start:
- Device and browser: any; a phone-width window (drag with a finger) or a wide window (drag with the mouse)
- Build: the build under test
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: the front open, paired with the back (on Export, **Add back**, then choose the back), the back on screen

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Crop** in the step bar | **5:7 card** is white and the only preset not greyed out |
| 2 | Drag the box from its middle 40 px to the right, and let go | The box has moved |
| 3 | Open **Crop options**, tap **Reset crop**, then close the options | **5:7 card** is still white and the only preset not greyed out; the box is back around the card at 5:7, as in row 1 |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

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
- Cases: 3

### CRP-17.1 The next photo starts with the last preset used   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window, in a private window
- Build: the build under test
- Photos: IMG_9136.JPEG and IMG_9075.JPEG from samples/
- Starting screen: IMG_9136.JPEG open, on the Crop step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **4:5** | **4:5** is white |
| 2 | Tap **Open** (the folder at the top left) and choose IMG_9075.JPEG, then tap **Crop** in the step bar | **4:5** is white and the box is 4:5 |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### CRP-17.2 The last preset is remembered after a reload   [auto: phone, webkit]
Before you start:
- Device and browser: any; a phone-width or a wide window, in a private window
- Build: the build under test
- Photos: IMG_9136.JPEG and IMG_9075.JPEG from samples/
- Starting screen: IMG_9136.JPEG open, on the Crop step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **4:5** | **4:5** is white |
| 2 | Reload the page | The start screen shows |
| 3 | Open IMG_9075.JPEG (with **Open photo**), then tap **Crop** in the step bar | **4:5** is white |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### CRP-17.3 Reset crop leaves the remembered preset as it was   [auto: phone]
Written to ruling R4; it fails until that is built (BUG-100).

Before you start:
- Device and browser: any; a phone-width or a wide window, in a private window
- Build: the build under test
- Photos: IMG_9136.JPEG and IMG_9075.JPEG from samples/
- Starting screen: IMG_9136.JPEG open, on the Crop step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **4:5** | **4:5** is white |
| 2 | Open **Crop options**, tap **Reset crop**, then close the options | The crop is back around the card |
| 3 | Tap **Open** (the folder at the top left) and choose IMG_9075.JPEG, then tap **Crop** in the step bar | **4:5** is white |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.
