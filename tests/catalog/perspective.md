# Perspective

The first step: finding the card, placing its four corners by hand or by detection, and flattening it.

## PER-01 Detection on open

When a photo opens, the app looks for the card by itself and moves the four corners onto the best match it finds. This first move is not an undo step.

- Risk: high
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: "Detecting…", `CONFIG.detect.workingSize`, `CONFIG.detect.maxCandidates`
- Source: `js/app/state.js` (`openFile`, `runDetect`); `js/engine.js` (`detect`)
- Cases: 1

### PER-01.1 Opening a photo puts the corners on the card, with no undo step   [auto: phone, webkit]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/ (a card in a clear graded slab)
- Starting screen: the start screen, with no photo open

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Open** (the folder at the top left; on a phone it has no label) and choose IMG_9136.JPEG | The photo opens on the Perspective step, and for a moment the line above the controls reads "Detecting…" |
| 2 | Wait until "Detecting…" has gone, and look at the white outline over the photo | Its four corners sit on the card's own corners, inside the slab, not on the slab's edge |
| 3 | Look at the line above the controls | It reads NUDGE and Corner 1 of 4, with Confidence and a percentage at its right |
| 4 | Look at **Undo** (the arrow curving left, at the top right) | It is greyed out: the corners' first move is not an undo step |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## PER-02 Fallback corners when nothing is found

If that first search finds no card, the corners rest on a centered rectangle 20% in from each edge of the photo, and no pop-up message appears. The line above the controls reads "Nothing detected. Drag the corners into place."

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.defaultInsetPct`, "Nothing detected. Drag the corners into place."
- Source: `js/app/state.js` (`insetCorners`, `defaultState`, `runDetect`); `js/app/perspective.js` (`perspectiveStatus`)
- Cases: 1

### PER-02.1 A picture with no card gets the centered rectangle and a line, not a pop-up   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: blank.png, a plain mid-grey picture 1200 × 1600 px with no card in it (make one in any image editor; the script draws its own)
- Starting screen: the start screen, with no photo open

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Open** (the folder at the top left; on a phone it has no label) and choose blank.png | The grey picture opens on the Perspective step |
| 2 | Look at the white outline over the picture | It is a rectangle centered on the picture, a fifth of the picture's width in from each side and a fifth of its height in from the top and the bottom |
| 3 | Look over the picture's bottom edge | No pop-up message is showing |
| 4 | Look at the line above the controls | It reads "Nothing detected. Drag the corners into place." |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## PER-03 A newer search wins

If a new search for the card starts before an older one finishes, or a front and back pair switches sides meanwhile, the older search's result is thrown away.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: none
- Source: `js/app/state.js` (`runDetect`)
- Cases: 1

### PER-03.1 A second photo opened during the search keeps its own corners   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photos: IMG_9136.JPEG from samples/, and blank.png, a plain mid-grey picture 1200 × 1600 px with no card in it (the script draws its own)
- Starting screen: the start screen, with no photo open

The search takes about half a second, so a person rarely beats it; the script opens the second picture while the first search is still running, and checks that it was.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Open** (the folder at the top left; on a phone it has no label) and choose IMG_9136.JPEG | The photo opens and the line above the controls reads "Detecting…" |
| 2 | While it still reads "Detecting…", tap **Open** and choose blank.png | The grey picture opens |
| 3 | Wait two seconds | The first search's result was thrown away: the outline on the grey picture is the rectangle a fifth in from each edge, not the card found in IMG_9136.JPEG |
| 4 | Look at the line above the controls | It reads "Nothing detected. Drag the corners into place." |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## PER-04 The corner outline

The four corners are joined by a white line over a dark halo. While the corners cross or fold inward, the line is red and dashed instead.

- Risk: medium
- Check: eye
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.colors.quad`, `CONFIG.colors.quadHalo`, `CONFIG.colors.quadInvalid`, `CONFIG.handle.lineWidth`
- Source: `js/app/view.js` (`drawSource`)
- Cases: 1

### PER-04.1 The corner outline, white or red and dashed, for a person to judge   [eye]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px (drag with a finger)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step, nothing changed yet

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the outline joining the four corners | A thin solid white line with a dark band along it (a halo), clear over both the light label and the dark parts of the photo |
| 2 | Drag the top-left corner ring to 40 px right of and 40 px below the top-right corner ring, and let go | The outline now crosses itself, and the whole line is red and dashed, with no halo |
| 3 | Look at the line above the controls | It reads "Corners cross or fold inward. Drag them back into a convex shape." |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## PER-05 Edge guide lines

Faint dashed lines extend each of the four edges across the whole photo, for lining up against long card edges.

- Risk: low
- Check: eye
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.colors.extend`
- Source: `js/app/view.js` (`drawEdgeExtensions`)
- Cases: 1

### PER-05.1 The edge guide lines, for a person to judge   [eye]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px (drag with a finger)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step, nothing changed yet

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the photo outside the white outline | Each of the four edges carries on past both its corners as a faint, dashed white line, all the way to the edges of the photo, and no further |
| 2 | Drag the top-left corner ring 40 px down, and let go | The top and left dashed lines have turned with the two edges that moved, and still run to the photo's edges |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## PER-06 The eight handles

Eight handles stay the same size on screen at any zoom: a ring with a center dot on each corner, and a small square at the middle of each edge. The selected handle is red and slightly larger.

- Risk: low
- Check: eye
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.handle.cornerRadius`, `CONFIG.handle.edgeSize`, `CONFIG.colors.handleSelected`
- Source: `js/app/view.js` (`drawHandles`)
- Cases: 1

### PER-06.1 The eight handles, for a person to judge   [eye]
Before you start:
- Device and browser: a computer with a mouse; a wide window, 1280 × 800 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step, nothing changed yet

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the outline | A ring with a dot in its middle on each corner and a small white square at the middle of each edge; the top-left ring is red and a little larger than the other rings |
| 2 | Click **Next handle** (under the line above the controls) four times | The line reads Edge 1 of 4 |
| 3 | Click an empty part of the photo, away from the outline | The round magnifier goes; the square at the middle of the top edge is red and a little larger than the other squares, and no ring is red |
| 4 | Scroll the mouse wheel up over the middle of the photo, three notches | The photo zooms in; the rings and squares are the same size on screen as in row 3 |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## PER-07 Drag a corner

Drag a corner handle to move that corner. A press counts when it lands within 24 px of the handle; where a corner and an edge handle are both in reach, the corner wins.

- Risk: high
- Check: script, touch
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.handle.hitRadius`, "Drag a corner or the middle of an edge."
- Source: `js/app/input.js` (`hitHandle`, `stepGesture`, `moveHandle`, `endGesture`)
- Ruling: R8. A cancelled drag puts the corner back, with no undo step. The app differs today.
- Cases: 4

### PER-07.1 Dragging a corner moves it, as one undo step   [auto: phone, webkit]
Before you start:
- Device and browser: any; a phone-width window (drag with a finger) or a wide window (drag with the mouse)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step, nothing changed yet (**Undo** at the top right is greyed out)

The handles are the ring on each corner of the white outline and the small square at the middle of each edge.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Drag the top-right corner ring 30 px right and 20 px down, and let go | That corner has moved 30 px right and 20 px down; the other three corners have not moved |
| 2 | Tap **Undo** (the arrow curving left, at the top right) | The corner is back where it was; **Undo** is greyed out again |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### PER-07.2 A press within reach of a corner grabs it; further away it moves the photo   [auto: phone, webkit]
Before you start:
- Device and browser: any; a phone-width window (drag with a finger) or a wide window (drag with the mouse)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step, nothing changed yet

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Press 16 px to the left of the middle of the top-left corner ring, drag 30 px down, and let go | The top-left corner has moved 30 px down |
| 2 | Tap **Undo** (the arrow curving left, at the top right) | The corner is back where it was |
| 3 | Press 30 px to the left of the middle of the top-left corner ring, drag 30 px down, and let go | The whole photo, outline and all, has moved 30 px down; every corner is still on the same point of the card |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### PER-07.3 Where a corner and an edge square are both in reach, the corner wins   [auto: phone, webkit]
Before you start:
- Device and browser: any; a phone-width window (drag with a finger) or a wide window (drag with the mouse)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step, nothing changed yet

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Drag the top-right corner ring left until it is 30 px to the right of the top-left ring, and let go | The top edge is 30 px long, with its square midway between the two rings |
| 2 | Press on that square, drag 30 px down, and let go | One of the two top corners (the one nearer the press) has moved 30 px down and the other has not: the edge did not slide as a whole |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### PER-07.4 A drag the phone cancels puts the corner back   [auto: phone]
Written to ruling R8; it fails until that is built (BUG-060).

Before you start:
- Device and browser: an iPhone, Safari (the script uses a phone-width window and has the browser cancel the touch)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step, nothing changed yet (**Undo** at the top right is greyed out)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Put a finger on the top-right corner ring and drag it 40 px left, without lifting | The corner follows the finger |
| 2 | Without lifting that finger, swipe down from the top-right corner of the screen with another, so the phone opens Control Center and takes the touch | Control Center opens |
| 3 | Close Control Center | The corner is back where it was before the drag; **Undo** (the arrow curving left, at the top right) is greyed out |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## PER-08 Drag an edge

Drag the square at the middle of an edge to slide the whole edge in or out without turning it; both of its corners move with it.

- Risk: high
- Check: script, touch
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.handle.edgeSize`, `CONFIG.handle.hitRadius`
- Source: `js/app/input.js` (`hitHandle`, `moveHandle`, `edgeNormal`, `moveEdge`, `endGesture`)
- Ruling: R8. A cancelled drag puts the edge back, with no undo step. The app differs today.
- Cases: 2

### PER-08.1 Dragging an edge's square slides the whole edge, as one undo step   [auto: phone, webkit]
Before you start:
- Device and browser: any; a phone-width window (drag with a finger) or a wide window (drag with the mouse)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step, nothing changed yet (**Undo** at the top right is greyed out)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Drag the small square at the middle of the top edge 30 px down and 20 px right, and let go | Both top corners have moved down by the same amount, about 30 px, square to the edge, and not sideways; the edge keeps its slope; the bottom corners have not moved |
| 2 | Tap **Undo** (the arrow curving left, at the top right) | The top edge is back where it was; **Undo** is greyed out again |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### PER-08.2 An edge drag the phone cancels puts the edge back   [auto: phone]
Written to ruling R8; it fails until that is built (BUG-060).

Before you start:
- Device and browser: an iPhone, Safari (the script uses a phone-width window and has the browser cancel the touch)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step, nothing changed yet (**Undo** at the top right is greyed out)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Put a finger on the small square at the middle of the top edge and drag it 40 px down, without lifting | The top edge follows the finger |
| 2 | Without lifting that finger, swipe down from the top-right corner of the screen with another, so the phone opens Control Center and takes the touch | Control Center opens |
| 3 | Close Control Center | The top edge is back where it was before the drag; **Undo** (the arrow curving left, at the top right) is greyed out |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## PER-09 Pressing a handle selects it

Pressing a handle selects it, so the arrow buttons and the keyboard's arrow keys then move that handle.

- Risk: medium
- Check: script, touch
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#perspectiveLine`, `CONFIG.colors.handleSelected`
- Source: `js/app/input.js` (`stepGesture`); `js/app/perspective.js` (`bindPerspective`)
- Cases: 2

### PER-09.1 A tapped handle is the one the arrow buttons move   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step, nothing changed yet

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap the bottom-right corner ring (a quick tap, without dragging) | The line above the controls reads Corner 3 of 4 |
| 2 | Tap the right arrow (→) under that line | The bottom-right corner moves right by a hair; the top-left corner has not moved |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### PER-09.2 A clicked handle is the one the keyboard's arrow keys move   [auto: desktop]
Before you start:
- Device and browser: a computer with a keyboard and a mouse; a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step, nothing changed yet

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Click the bottom-right corner ring (without dragging) | The line above the controls reads Corner 3 of 4 |
| 2 | Press the left arrow key (←) | The bottom-right corner moves left by one pixel of the photo; the top-left corner has not moved |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## PER-10 The magnifier while dragging

While a handle is dragged, a round magnifier shows the full-resolution photo around it at 4 times the current zoom, with the outline, a crosshair and a white rim. It is 150 px across, and never wider than 42% of the photo area.

- Risk: medium
- Check: eye
- Layout: both. It is placed by pointer type: with touch or a pen it is pinned to the top corner on the side away from the finger; with a mouse it sits up and to the right of the cursor, and drops below it near the top edge.
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.loupeZoom`, `CONFIG.loupeSize`, `CONFIG.loupeMaxFrac`, `CONFIG.loupeOffset`
- Source: `js/app/view.js` (`drawLoupe`, `loupeRadius`, `loupeCenter`, `drawCrosshair`, `drawLoupeRim`)
- Cases: 3

### PER-10.1 The magnifier under a finger, for a person to judge   [eye]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px (drag with a finger)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step, nothing changed yet

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Put a finger on the bottom-left corner ring and drag it 30 px right, without lifting | A round magnifier 150 px across sits in the top right corner of the photo area, away from the finger: the photo around that corner, 4 times larger, with the outline, a crosshair in its middle and a white rim |
| 2 | Lift the finger | The magnifier goes |
| 3 | Put a finger on the bottom-right corner ring and drag it 30 px left, without lifting | The magnifier is in the top left corner of the photo area |
| 4 | Lift the finger | The magnifier goes |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### PER-10.2 The magnifier beside the mouse, for a person to judge   [eye]
Before you start:
- Device and browser: a computer with a mouse; a wide window, 1280 × 800 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step, nothing changed yet

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Press on the bottom-left corner ring and drag it 30 px right, keeping the button down | A round magnifier 150 px across sits up and to the right of the pointer, with the photo around that corner 4 times larger, the outline, a crosshair and a white rim |
| 2 | Let go | The magnifier goes |
| 3 | Press on the top-left corner ring and drag it 100 px up, keeping the button down | Near the top of the photo area the magnifier sits below and to the right of the pointer instead |
| 4 | Let go | The magnifier goes |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### PER-10.3 The magnifier is never wider than 42% of the photo area, for a person to judge   [eye]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px (drag with a finger)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the app opened with a link ending `?loupeSize=400` (a setting that asks for a magnifier 400 px across), the photo open on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Put a finger on the bottom-left corner ring and drag it 30 px right, without lifting | The magnifier is about 164 px across (42% of the 390 px photo area), not 400 px; it fills well under half the photo area's width |
| 2 | Lift the finger | The magnifier goes |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## PER-11 Double tap a handle to zoom

Double tap a handle to zoom to 6 times the fitted size, centered on that handle. Double tap a handle again while zoomed in past twice the fitted size to go back to the fitted view.

- Risk: medium
- Check: script, touch
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.handleZoom`, "Double tap a handle to zoom in on it"
- Source: `js/app/input.js` (`checkHandleDoubleTap`, `zoomToHandle`, `onPointerUp`)
- Flag: to confirm. The second tap only has to land on the same handle within 350 ms, a longer window than the 300 ms each tap may last, with no limit on how far it is from the first.
- Cases: 1

### PER-11.1 A double tap on a handle zooms in on it, and another zooms back out   [auto: phone, webkit]
Flag: to confirm. Written to today's behavior.

Before you start:
- Device and browser: any; a phone-width window (tap with a finger) or a wide window (click with the mouse)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step, the whole photo fitting the photo area

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Double tap the top-left corner ring (on a wide screen, double-click it) | The photo zooms in to 6 times the size it had when it fitted, with that corner in the middle of the photo area |
| 2 | Double tap the same ring again | The whole photo fits the photo area again |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## PER-12 The selected handle's name

At rest, the line above the controls reads **Nudge** and the selected handle's name, from **Corner 1 of 4** to **Edge 4 of 4**. It updates after a press on a handle or a key press.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#perspectiveLine`, "Corner ", "Edge "
- Source: `js/app/perspective.js` (`handleName`, `syncPerspectiveReadouts`, `bindPerspective`)
- Cases: 2

### PER-12.1 The line names the handle last tapped   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step, nothing changed yet

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the line above the controls | It reads NUDGE, then Corner 1 of 4 |
| 2 | Tap the bottom-left corner ring (a quick tap, without dragging) | The line reads Corner 4 of 4 |
| 3 | Tap the small square at the middle of the left edge | The line reads Edge 4 of 4 |
| 4 | Tap the small square at the middle of the top edge | The line reads Edge 1 of 4 |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### PER-12.2 The line follows the Tab key   [auto: desktop]
Before you start:
- Device and browser: a computer with a keyboard and a mouse; a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step, nothing changed yet

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Click an empty part of the photo, away from the outline | The line above the controls reads Corner 1 of 4 |
| 2 | Press Tab | The line reads Corner 2 of 4 |
| 3 | Press Tab again | The line reads Corner 3 of 4 |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## PER-13 Confidence

At the right of that line, **Confidence** and a percentage say how sure detection is of the candidate in use. It is empty when nothing was detected, and hidden while a message or Preview's text takes the line.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: "Confidence", `#perspectiveLine`
- Source: `js/app/perspective.js` (`syncPerspectiveReadouts`)
- Ruling: R6. Once the corners are moved by hand the confidence is cleared; Undo and Reset perspective bring back the right one. The app differs today.
- Flag: to confirm. Any message in that line, and Preview, hides the confidence, so it is not always on screen.
- Cases: 3

### PER-13.1 Confidence shows at the right of the line, except in Preview   [auto: phone]
Flag: to confirm. Written to today's behavior: Preview hides the confidence.

Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step, nothing changed yet

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the right end of the line above the controls | It reads Confidence 99% |
| 2 | Tap **Flatten** in the row of tools | The line reads FLATTEN 100%, still with Confidence 99% at its right |
| 3 | Tap **Preview** in the row of tools | The line reads PREVIEW and "The corrected card. Handles are hidden.", with no confidence |
| 4 | Tap **Preview** again | The line reads FLATTEN 100% with Confidence 99% again |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### PER-13.2 Moving a corner by hand clears the confidence, and Undo brings it back   [auto: phone]
Written to ruling R6; it fails until that is built (BUG-061).

Before you start:
- Device and browser: any; a phone-width window (drag with a finger) or a wide window (drag with the mouse)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step, nothing changed yet

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the right end of the line above the controls | It reads Confidence 99% |
| 2 | Drag the top-right corner ring 30 px right, and let go | No confidence shows at the right of the line |
| 3 | Tap **Undo** (the arrow curving left, at the top right) | The corner is back, and the line reads Confidence 99% again |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### PER-13.3 Undo and Reset perspective bring back the confidence of the corners they restore   [auto: phone]
Written to ruling R6; it fails until that is built (BUG-061).

Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/ (detection finds three candidates: 99%, 100% and 99%)
- Starting screen: the photo open, on the Perspective step, nothing changed yet

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Candidate** in the row of tools | It reads 2/3, and the line reads Confidence 100% |
| 2 | Tap **Undo** (the arrow curving left, at the top right) | The corners are back on the first candidate, and the line reads Confidence 99% |
| 3 | Tap **Candidate** again | It reads 2/3, and the line reads Confidence 100% |
| 4 | Open **Perspective options**: on a phone, tap the **Options** tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls | **Reset perspective** shows |
| 5 | Tap **Reset perspective** | The corners are back on the first candidate, and the line reads Confidence 99% |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## PER-14 The arrow buttons

Four arrow buttons move the selected handle one screen pixel per press, and never less than one photo pixel.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#perspectiveNudge`, "Nudge the selected handle", "Nudge left"
- Source: `js/app/perspective.js` (`buildNudgeRow`, `bindHandleNudge`); `js/app/parts/nudge-pad.js` (`bindNudgePad`); `js/app/input.js` (`moveHandleBy`)
- Flag: to confirm. The on-screen arrows move one screen pixel and show the magnifier, while the keyboard's arrow keys move one photo pixel (10 with Shift) and show none.
- Cases: 2

### PER-14.1 Each arrow button moves the handle one screen pixel, never less than one photo pixel   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step, the whole photo fitting the photo area, the line above the controls reading Corner 1 of 4

The four arrow buttons sit under the line above the controls, left of **Next handle**. With the whole photo fitted, one screen pixel is several pixels of the photo.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap the right arrow (→) | The top-left corner moves one screen pixel right |
| 2 | Tap the down arrow (↓) | It moves one screen pixel down |
| 3 | Tap the left arrow (←) | It moves one screen pixel left |
| 4 | Tap the up arrow (↑) | It moves one screen pixel up, back where it started |
| 5 | Double tap the top-left corner ring (on a wide screen, double-click it) | The photo zooms in to 6 times its fitted size, so one pixel of the photo is now more than one screen pixel |
| 6 | Tap the right arrow (→) | The corner moves right by exactly one pixel of the photo |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### PER-14.2 The keyboard's arrow keys move one photo pixel, or ten with Shift, with no magnifier   [auto: desktop]
Flag: to confirm. Written to today's behavior: the keys and the on-screen arrows move by different amounts, and only the on-screen arrows show the magnifier.

Before you start:
- Device and browser: a computer with a keyboard and a mouse; a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step, the whole photo fitting the photo area, the line above the controls reading Corner 1 of 4

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Click the right arrow (→) under the line above the controls | The top-left corner moves one screen pixel (about three pixels of the photo) right, and a round magnifier shows it |
| 2 | Click an empty part of the photo, away from the outline | The magnifier goes |
| 3 | Press the right arrow key (→) | The corner moves right by one pixel of the photo; no magnifier shows |
| 4 | Hold Shift and press the right arrow key | The corner moves right by ten pixels of the photo; no magnifier shows |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## PER-15 Hold an arrow to repeat

Holding an arrow button repeats it after 350 ms, every 60 ms, until the finger lifts, slides off or is cancelled. Nudges less than 0.9 s apart, held or tapped, are one undo step.

- Risk: medium
- Check: script, touch
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.nudge.delayMs`, `CONFIG.nudge.repeatMs`, "The arrows nudge the selected handle. Hold one to repeat."
- Source: `js/app/parts/nudge-pad.js` (`bindNudgePad`); `js/app/perspective.js` (`bindHandleNudge`); `js/app/state.js` (`commit`, `History.push`)
- Cases: 3

### PER-15.1 Holding an arrow repeats it until it is let go, as one undo step   [auto: phone]
Before you start:
- Device and browser: any; a phone-width window (hold with a finger) or a wide window (hold the mouse button)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step, the whole photo fitting the photo area, nothing changed yet (**Undo** at the top right is greyed out)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Press and hold the right arrow (→) under the line above the controls for one second, then let go | The top-left corner moves one step at once, then after about a third of a second keeps moving about 16 steps a second while held: at least 6 steps in all |
| 2 | Wait half a second | The corner has stopped |
| 3 | Tap **Undo** (the arrow curving left, at the top right) | The corner is back where it started; **Undo** is greyed out |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### PER-15.2 Taps on the arrows less than 0.9 seconds apart are one undo step   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step, the whole photo fitting the photo area, nothing changed yet

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap the right arrow (→) twice, quickly | The top-left corner has moved two screen pixels right |
| 2 | Wait a second and a half, then tap the right arrow once more | It has moved three screen pixels right in all |
| 3 | Tap **Undo** (the arrow curving left, at the top right) | It is two screen pixels right of where it started: only the last tap was undone |
| 4 | Tap **Undo** again | It is back where it started: the two quick taps were one step |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### PER-15.3 Sliding off a held arrow stops the repeat   [auto: desktop]
Before you start:
- Device and browser: a computer with a mouse; a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step, the whole photo fitting the photo area

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Press and hold the mouse button on the right arrow (→) under the line above the controls | The top-left corner moves, and after about a third of a second keeps moving |
| 2 | Keeping the button down, move the pointer 100 px up, off the arrow | The corner stops moving |
| 3 | Wait half a second, then let go | The corner has not moved since row 2 |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## PER-16 Next handle

**Next handle** selects the next of the eight handles, the four corners and then the four edges, and wraps back to the first.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnNextHandle`, "Next handle", "Select the next handle"
- Source: `js/app/perspective.js` (`buildNudgeRow`, `bindHandleNudge`)
- Cases: 1

### PER-16.1 Next handle steps through the eight handles and wraps   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step, the line above the controls reading Corner 1 of 4

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Next handle** three times, reading the line after each tap | Corner 2 of 4, Corner 3 of 4, Corner 4 of 4 |
| 2 | Tap **Next handle** four more times, reading the line after each tap | Edge 1 of 4, Edge 2 of 4, Edge 3 of 4, Edge 4 of 4 |
| 3 | Tap **Next handle** once more | Corner 1 of 4 |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## PER-17 The magnifier after a nudge

After a press on an arrow button or **Next handle**, the magnifier shows on the selected handle for 4 seconds. Pressing anything else, or changing step, hides it.

- Risk: low
- Check: eye
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.nudge.loupeMs`
- Source: `js/app/perspective.js` (`bindHandleNudge`); `js/app/view.js` (`drawSource`); `js/app/shell.js` (`setTab`, `bindNavigation`)
- Cases: 1

### PER-17.1 The magnifier after a nudge, for a person to judge   [eye]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step, the line above the controls reading Corner 1 of 4

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap the right arrow (→) under the line above the controls | A round magnifier shows the top-left corner, in the top right corner of the photo area |
| 2 | Wait five seconds without touching anything | The magnifier has gone (it stays 4 seconds) |
| 3 | Tap **Next handle** | The line reads Corner 2 of 4, and the magnifier shows the top-right corner, in the top left corner of the photo area |
| 4 | Tap **Snap** in the row of tools | The magnifier goes at once |
| 5 | Tap the right arrow again | The magnifier shows the top-right corner |
| 6 | Tap **Rotate** in the step bar, then **Perspective** | Back on Perspective, no magnifier shows |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## PER-18 Nudge

**Nudge** is the resting mode: it shows the selected handle's name, the arrow buttons and **Next handle**.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#toolNudge`, `#perspectiveNudgeRow`
- Source: `js/app/perspective.js` (`bindPerspectiveTools`, `syncPerspective`)
- Cases: 1

### PER-18.1 Nudge is the resting mode, with the handle's name, the arrows and Next handle   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step for the first time since the page was loaded

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the row of tools and the lines above it | **Nudge** is selected (a solid white button); above it the line reads NUDGE and Corner 1 of 4, and under that are the four arrow buttons and **Next handle** |
| 2 | Tap **Flatten** | **Flatten** is selected instead of **Nudge**; the arrows and **Next handle** have gone |
| 3 | Tap **Nudge** | **Nudge** is selected again; the line reads NUDGE and Corner 1 of 4, with the arrows and **Next handle** under it |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## PER-19 Flatten

**Flatten** swaps in the Flatten line (**Flatten** and its percentage) and its slider. The **Flatten** button shows the percentage where the other buttons show an icon.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#toolFlatten`, `#perspectiveFlattenRow`
- Source: `js/app/perspective.js` (`bindPerspectiveTools`, `syncPerspective`, `syncFlattenValue`)
- Flag: to confirm. The **Flatten** button never shows its icon, because it always has a percentage to show.
- Cases: 1

### PER-19.1 Flatten shows its line and slider, and its button shows the percentage   [auto: phone]
Flag: to confirm. Written to today's behavior: the **Flatten** button shows 100% in place of an icon, even while it is not selected.

Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step, with **Nudge** selected

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the **Flatten** button in the row of tools | It shows 100% above its name, where the other buttons show an icon |
| 2 | Tap **Flatten** | **Flatten** is selected (a solid white button); the line above reads FLATTEN and 100%, and a slider under it has its knob at the right end |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## PER-20 The Flatten slider

The slider runs from 0 to 100%, and starts at 100%: 0% squares the card up but keeps the camera's depth, 100% is a flat 5:7 rectangle. The photo updates while sliding, and one slide is one undo step (slides less than 0.9 s apart merge).

- Risk: high
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#strength`, `CONFIG.perspective.strength`, "100% is a flat 5:7 rectangle, like a scan."
- Source: `js/app/perspective.js` (`bindFlattenSlider`, `syncFlattenValue`); `js/engine.js` (`computeGeometry`)
- Cases: 4

### PER-20.1 Flatten at 100% is a flat 5:7 card, at 0% a squared-up trapezoid, one undo step   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step, nothing changed yet (**Undo** at the top right is greyed out)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Flatten** in the row of tools | The line above reads FLATTEN 100%, with the slider's knob at its right end |
| 2 | Tap **Preview** | The corrected card is an upright rectangle, 5 wide to 7 tall, with square corners |
| 3 | Tap **Preview** again | The slider shows again, its knob at the right end |
| 4 | Tap the slider's track at its far left end | The knob is at the left end; the line and the **Flatten** button read 0% |
| 5 | Tap **Preview** | The corrected card's top and bottom edges are level, but its sides lean in a little toward the bottom: a trapezoid, not a rectangle |
| 6 | Tap **Preview** again | The slider shows again, its knob at the left end |
| 7 | Tap **Undo** (the arrow curving left, at the top right) | The line reads FLATTEN 100% and **Undo** is greyed out: the change was one undo step |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### PER-20.2 Two changes to Flatten less than 0.9 seconds apart are one undo step   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step, nothing changed yet (**Undo** at the top right is greyed out)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Flatten** in the row of tools | The line above reads FLATTEN 100% |
| 2 | Tap the middle of the slider's track | The line reads FLATTEN 50% |
| 3 | At once, tap the slider's track at its far left end | The line reads FLATTEN 0% |
| 4 | Tap **Undo** (the arrow curving left, at the top right) | The line reads FLATTEN 100% and **Undo** is greyed out: the two quick changes were one undo step |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### PER-20.3 The corrected card updates while the slider moves   [auto: desktop]
Before you start:
- Device and browser: a computer with a mouse; a wide window (the **Result** picture shows in the side panel)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step, nothing changed yet

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Click **Flatten** in the row of tools | The slider shows, its knob at the right end |
| 2 | Press on the knob and drag it to the left end of the track, keeping the button down | Before you let go, the line reads FLATTEN 0% and the **Result** picture has changed |
| 3 | Let go | The line still reads FLATTEN 0% |
| 4 | Click **Undo** (the arrow curving left, at the top right) | The line reads FLATTEN 100%: the whole slide was one undo step |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### PER-20.4 On an iPhone, a slide of the Flatten knob is one undo step   [phone]
Before you start:
- Device and browser: an iPhone, Safari
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/ (AirDrop it to the phone or save it to Photos first)
- Starting screen: the photo open, on the Perspective step, nothing changed yet (**Undo** at the top right is greyed out)

Playwright's WebKit sends no "change" when the slider's track is tapped, so the automated cases run this slider in Chromium only; this case checks Safari itself.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Flatten** in the row of tools | The line above reads FLATTEN 100%, with the slider's knob at its right end |
| 2 | Drag the knob to the left end of the track, and lift the finger | The line reads FLATTEN 0%; **Undo** is no longer greyed out |
| 3 | Tap **Undo** | The line reads FLATTEN 100% and **Undo** is greyed out again |
| 4 | Tap the slider's track halfway along | Either the knob jumps there and the line reads about 50%, with **Undo** no longer greyed out, or the knob does not move at all and **Undo** stays greyed out; record which |
| 5 | Tap **Undo** if it is not greyed out | The line reads FLATTEN 100% |

Pass: rows 1 to 3 are seen, and in row 4 the line and **Undo** agree (the value changed and Undo lit, or neither).
On a fail, record: the row number, what you saw instead, a screenshot.

## PER-21 Candidate

**Candidate** moves the corners to the next detected candidate, wrapping round, as one undo step, and shows which one is in use, such as **1/3**. At most three candidates are kept; with fewer than two the button is off.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#toolCandidate`, "Try the next detected candidate", `CONFIG.detect.maxCandidates`
- Source: `js/app/perspective.js` (`bindPerspectiveTools`, `syncPerspective`); `js/app/state.js` (`useCandidate`)
- Ruling: R6. Once the corners are moved by hand the count is cleared; Undo and Reset perspective bring back the right number. The app differs today.
- Cases: 4

### PER-21.1 Candidate steps through the three candidates and wraps, one undo step a tap   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/ (detection keeps three candidates)
- Starting screen: the photo open, on the Perspective step, nothing changed yet

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at **Candidate** in the row of tools | It shows 1/3 in place of an icon |
| 2 | Tap **Candidate** | It reads 2/3, and the corners move to the second candidate |
| 3 | Tap **Candidate** | It reads 3/3, and the corners move to the third |
| 4 | Tap **Candidate** | It reads 1/3, and the corners are back on the first |
| 5 | Tap **Undo** (the arrow curving left, at the top right) | The corners are back on the third candidate: each tap was one undo step |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### PER-21.2 With fewer than two candidates, Candidate is off   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: blank.png, a plain mid-grey picture 1200 × 1600 px with no card in it (the script draws its own)
- Starting screen: the picture open, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at **Candidate** in the row of tools | It is greyed out and shows its icon, with no number |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### PER-21.3 Moving a corner by hand clears the candidate number, and Undo brings it back   [auto: phone]
Written to ruling R6; it fails until that is built (BUG-061).

Before you start:
- Device and browser: any; a phone-width window (drag with a finger) or a wide window (drag with the mouse)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step, nothing changed yet

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at **Candidate** in the row of tools | It shows 1/3 |
| 2 | Drag the top-right corner ring 30 px right, and let go | **Candidate** shows no number |
| 3 | Tap **Undo** (the arrow curving left, at the top right) | The corner is back, and **Candidate** shows 1/3 again |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### PER-21.4 Undo and Reset perspective bring back the number of the candidate they restore   [auto: phone]
Written to ruling R6; it fails until that is built (BUG-061).

Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step, nothing changed yet

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Candidate** in the row of tools | It reads 2/3 |
| 2 | Tap **Undo** (the arrow curving left, at the top right) | The corners are back on the first candidate, and **Candidate** reads 1/3 |
| 3 | Tap **Candidate** | It reads 2/3 |
| 4 | Open **Perspective options**: on a phone, tap the **Options** tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls | **Reset perspective** shows |
| 5 | Tap **Reset perspective** | The corners are back on the first candidate, and **Candidate** reads 1/3 |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## PER-22 Snap

**Snap** turns snapping to detected edges on and off. It starts off.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#toolSnap`, "Snap handles to detected edges"
- Source: `js/app/perspective.js` (`bindPerspectiveTools`, `syncPerspective`); `js/app/core.js` (the `app` object's defaults)
- Cases: 1

### PER-22.1 Snap starts off and switches on and off, with no undo step   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step for the first time since the page was loaded, nothing changed yet (**Undo** at the top right is greyed out)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at **Snap** in the row of tools | Its corner reads Off |
| 2 | Tap **Snap** | It reads On, with a white ring; **Undo** is still greyed out |
| 3 | Tap **Snap** again | It reads Off |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## PER-23 Snap a corner

With **Snap** on, a dragged corner jumps to the nearest point where two roughly square detected lines cross, when one is within 18 screen px.

- Risk: medium
- Check: script, touch
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.snapRadiusPx`, `#toolSnap`
- Source: `js/app/input.js` (`moveHandle`, `snapPoint`); `js/app/state.js` (`buildSnapTargets`)
- Cases: 1

### PER-23.1 With Snap on, a dragged corner lands where two detected lines cross   [auto: phone, webkit]
Before you start:
- Device and browser: any; a phone-width window (drag with a finger) or a wide window (drag with the mouse)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step, nothing changed yet

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Open **Perspective options**: on a phone, tap the **Options** tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls | **Debug overlay** shows under Developer |
| 2 | Tap the **Debug overlay** switch, then close the options (on a phone, the **×** at their top right) | Thin yellow lines run across the photo: the lines detection found |
| 3 | Tap **Snap** in the row of tools | It reads On |
| 4 | Drag the top-left corner ring 10 px right and 6 px down, and let go | The corner does not stop 10 px right and 6 px down: it jumps onto the nearest point where two yellow lines cross |
| 5 | Tap **Undo** (the arrow curving left, at the top right) | The corner is back where it was |
| 6 | Tap **Snap** | It reads Off |
| 7 | Drag the top-left corner ring 10 px right and 6 px down again, and let go | The corner stops exactly 10 px right and 6 px down of where it was |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## PER-24 Snap an edge

With **Snap** on, a dragged edge jumps onto the nearest detected line that runs within 3° of it, when one is within 18 screen px.

- Risk: medium
- Check: script, touch
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.snapRadiusPx`, `#toolSnap`
- Source: `js/app/input.js` (`moveHandle`, `snapEdge`); `js/app/state.js` (`buildSnapTargets`)
- Cases: 1

### PER-24.1 With Snap on, a dragged edge lands on a detected line   [auto: phone, webkit]
Before you start:
- Device and browser: any; a phone-width window (drag with a finger) or a wide window (drag with the mouse)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step, nothing changed yet

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Open **Perspective options**: on a phone, tap the **Options** tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls | **Debug overlay** shows under Developer |
| 2 | Tap the **Debug overlay** switch, then close the options (on a phone, the **×** at their top right) | Thin yellow lines run across the photo: the lines detection found |
| 3 | Tap **Snap** in the row of tools | It reads On |
| 4 | Drag the small square at the middle of the top edge 10 px down, and let go | The top edge lies exactly along a yellow line that runs the same way as the edge |
| 5 | Tap **Undo** (the arrow curving left, at the top right) | The edge is back where it was |
| 6 | Tap **Snap** | It reads Off |
| 7 | Drag the same square 10 px down again, and let go | The top edge stops exactly 10 px lower than it was |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## PER-25 Preview

**Preview** shows the corrected card in place of the photo and its handles. The line above the controls reads **Preview** and "The corrected card. Handles are hidden.", and the row under it "Pinch to zoom, drag to pan. Tap Preview again for the corners."

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#toolPreview`, "Show the corrected card", "The corrected card. Handles are hidden.", "Pinch to zoom, drag to pan. Tap Preview again for the corners."
- Source: `js/app/perspective.js` (`buildPerspectiveControls`, `bindPerspectiveTools`, `syncPerspective`, `syncPerspectiveReadouts`); `js/app/view.js` (`draw`)
- Flag: to confirm. With the corners crossed, Preview shows "Fix the corners in Perspective first." although the user is already on Perspective.
- Cases: 2

### PER-25.1 Preview shows the corrected card and its two lines   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step, with **Nudge** selected

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Preview** in the row of tools | It reads On; the photo area shows the corrected card, filling it, with no outline and no handles |
| 2 | Look at the lines above the row of tools | The top one reads PREVIEW and "The corrected card. Handles are hidden."; the one under it reads "Pinch to zoom, drag to pan. Tap Preview again for the corners." |
| 3 | Tap **Preview** again | It reads Off; the photo, its outline and handles are back, with the line NUDGE and Corner 1 of 4 |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### PER-25.2 Preview with crossed corners, for a person to judge   [eye]
Flag: to confirm. Written to today's behavior: the photo area asks to fix the corners in Perspective, the step already open.

Before you start:
- Device and browser: a phone-width window, 390 × 844 px (drag with a finger)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step, nothing changed yet

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Drag the top-left corner ring to 40 px right of and 40 px below the top-right corner ring, and let go | The outline crosses itself and turns red and dashed |
| 2 | Tap **Preview** in the row of tools | The photo area is empty except for grey text in its middle: "Fix the corners in Perspective first." |
| 3 | Look at the line above the controls | It reads "Corners cross or fold inward. Drag them back into a convex shape." |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## PER-26 What Preview locks

While Preview is on, **Nudge** and **Flatten** are off, the arrow buttons and the slider are hidden, the handles can't be grabbed, and dragging or pinching pans and zooms the corrected card.

- Risk: medium
- Check: script, touch
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#toolPreview`, `#toolNudge`, `#toolFlatten`, `#perspectivePreviewRow`
- Source: `js/app/perspective.js` (`syncPerspective`, `bindHandleNudge`); `js/app/input.js` (`stepGesture`, `hitsPhotoControl`)
- Ruling: R2. The keyboard's arrow keys and Tab do nothing while Preview is on. The app differs today.
- Flag: to confirm. While Preview is on both mode buttons are off, so the Nudge or Flatten mode can't change until Preview is turned off.
- Cases: 3

### PER-26.1 While Preview is on, the modes are off and a drag moves the corrected card   [auto: phone, webkit]
Flag: to confirm. Written to today's behavior: **Nudge** and **Flatten** are both greyed out while Preview is on.

Before you start:
- Device and browser: any; a phone-width window (drag with a finger) or a wide window (drag with the mouse)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step, with **Nudge** selected, nothing changed yet (**Undo** at the top right is greyed out)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Note where the top-left corner ring is, then tap **Preview** in the row of tools | **Nudge** and **Flatten** are greyed out and neither is white; the arrows, **Next handle** and the slider are not shown |
| 2 | Drag from where the top-left ring was, 30 px down, and let go | The corrected card moves 30 px down with the drag |
| 3 | Tap **Preview** again | The corners are where they were before row 1, and **Undo** is still greyed out |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### PER-26.2 While Preview is on, a pinch zooms the corrected card   [auto: phone]
Before you start:
- Device and browser: a phone (pinch with two fingers); the script uses a phone-width window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step, nothing changed yet

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Preview** in the row of tools | The corrected card fills the photo area |
| 2 | Put two fingers 100 px apart on the middle of the card and spread them to 200 px apart | The card zooms in to twice its size |
| 3 | Tap **Preview** again | The corners have not moved, and **Undo** (the arrow curving left, at the top right) is greyed out |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### PER-26.3 While Preview is on, the arrow keys and Tab do nothing   [auto: desktop]
Written to ruling R2; it fails until that is built (BUG-062).

Before you start:
- Device and browser: a computer with a keyboard and a mouse; a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step, the line above the controls reading Corner 1 of 4, nothing changed yet (**Undo** at the top right is greyed out)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Click **Preview** in the row of tools | The corrected card shows, with no handles |
| 2 | Click the middle of the corrected card | Nothing changes |
| 3 | Press the right arrow key (→) three times | Nothing changes, and **Undo** is still greyed out |
| 4 | Press Tab | Nothing changes |
| 5 | Click **Preview** again | The corners are where they were, the line reads Corner 1 of 4, and **Undo** is still greyed out |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## PER-27 Preview's levels, and when it turns off

Preview shows the applied levels, not an unapplied Levels draft. It stays on when you change step, and turns off for a new photo or a switch to the other side of a pair.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#toolPreview`
- Source: `js/app/levels.js` (`levelsShown`, `previewCanvas`); `js/app/state.js` (`resetPhotoState`); `js/app/pair.js` (`applySide`)
- Flag: to confirm. Preview stays on across step changes, although Tap to find card, the color picker and compare are all cleared then.
- Cases: 4

### PER-27.1 Preview stays on after a change of step   [auto: phone]
Flag: to confirm. Written to today's behavior.

Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Preview** in the row of tools | It reads On; the corrected card shows |
| 2 | Tap **Rotate** in the step bar | The Rotate step shows |
| 3 | Tap **Perspective** in the step bar | **Preview** still reads On, the line reads PREVIEW, and the corrected card shows with no handles |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### PER-27.2 Preview turns off when another photo opens   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photos: IMG_9136.JPEG and IMG_9075.JPEG from samples/
- Starting screen: IMG_9136.JPEG open, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Preview** in the row of tools | It reads On |
| 2 | Tap **Open** (the folder at the top left; on a phone it has no label) and choose IMG_9075.JPEG | The new photo opens on Perspective with its outline and handles; **Preview** reads Off and the line reads NUDGE |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### PER-27.3 Preview turns off when a pair switches sides   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: the front open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Add back** and choose 14_back_portrait_raw_white.JPEG | The back opens on Perspective, with **Front** and **Back** in the top bar |
| 2 | Tap **Preview** in the row of tools | It reads On |
| 3 | Tap **Front** in the top bar | The front opens on Perspective with its outline and handles; **Preview** reads Off |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### PER-27.4 Preview shows the applied levels, not an unapplied draft   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step, no levels applied

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Preview** in the row of tools | The corrected card shows; note its colors |
| 2 | Tap **Levels** in the step bar, then **Auto** in its row of tools | The photo brightens: an unapplied draft, with **Apply** in the line above |
| 3 | Tap **Perspective** in the step bar | The corrected card shows with the colors noted in row 1, not the draft's |
| 4 | Tap **Levels**, then **Apply** | The levels are applied |
| 5 | Tap **Perspective** | The corrected card now shows the applied, brighter colors |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## PER-28 Arm Tap to find card

In the options sheet, **Tap to find card** (with "then tap the card" under it) arms the app to find the card where you tap next; tapping it again disarms. Until the tap, the line above the controls reads "Tap the card in the photo."

- Risk: medium
- Check: script
- Layout: both. On a phone the sheet closes as it arms, leaving the whole photo to tap; on a wide screen the row stays and shows as pressed.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnFindCard`, "Tap to find card", "then tap the card", "Tap the card in the photo."
- Source: `js/app/perspective.js` (`buildPerspectiveSheet`, `bindPerspective`, `syncPerspective`, `perspectiveStatus`); `js/app/shell.js` (`closeSheets`)
- Flag: to confirm. Escape closes the sheet on a phone but never disarms Tap to find card.
- Cases: 2

### PER-28.1 Tap to find card arms and disarms   [auto: both]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Open **Perspective options**: on a phone, tap the **Options** tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls | The first row reads **Tap to find card**, with "then tap the card" at its right |
| 2 | Tap **Tap to find card** | The line above the controls reads "Tap the card in the photo.", with **Cancel** at its right. On a phone the options have closed, leaving the whole photo; on a wide screen the row stays, shown as pressed |
| 3 | On a phone, open **Perspective options** again (on a wide screen they are still shown) | **Tap to find card** is shown as pressed |
| 4 | Tap **Tap to find card** again | It is no longer pressed, and the line above the controls reads NUDGE and Corner 1 of 4 |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### PER-28.2 Escape closes the options but leaves Tap to find card armed   [auto: phone]
Flag: to confirm. Written to today's behavior.

Before you start:
- Device and browser: a phone-width window with a keyboard (an iPad with a keyboard, or a computer's window made narrow)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap the **Options** tab (the tab with an up arrow on the top edge of the controls) | **Perspective options** rise from the bottom |
| 2 | Tap **Tap to find card** | The options close, and the line above the controls reads "Tap the card in the photo." |
| 3 | Tap the **Options** tab again | The options rise; **Tap to find card** is shown as pressed |
| 4 | Press Escape | The options close; the line still reads "Tap the card in the photo." |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## PER-29 The find tap

While armed, a still tap on the photo, however long it is held, searches for the card at that point, moves the corners as one undo step and disarms. The point is used for that search only. If nothing is found, the corners stay and a pop-up says "No card-shaped edges found. Drag the corners into place, or tap to find card and tap the card again."

- Risk: high
- Check: script, touch
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnFindCard`, `CONFIG.detect.seedMissFactor`, "No card-shaped edges found. "
- Source: `js/app/input.js` (`stepGesture`, `onPointerUp`); `js/app/state.js` (`findCardAt`, `runDetect`)
- Flag: to confirm. On a photo with no card, the pop-up "No card-shaped edges found…" and the line "Nothing detected. Drag the corners into place." show at the same time.
- Cases: 3

### PER-29.1 A tap on the card finds it, as one undo step, and disarms   [auto: phone, webkit]
Before you start:
- Device and browser: any; a phone-width window (tap with a finger) or a wide window (click with the mouse)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step, nothing changed yet

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Drag the top-left corner ring 40 px right and 40 px down, and let go | That corner is now off the card's corner |
| 2 | Open **Perspective options**: on a phone, tap the **Options** tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls | **Tap to find card** shows |
| 3 | Tap **Tap to find card** | The line above the controls reads "Tap the card in the photo." |
| 4 | Tap the middle of the card once, without moving | All four corners land on the card's own corners, and the line reads NUDGE again: it is no longer armed |
| 5 | Tap **Undo** (the arrow curving left, at the top right) | The top-left corner is back where you dragged it in row 1: the find was one undo step |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### PER-29.2 A long, still press on the card finds it too   [auto: phone]
Before you start:
- Device and browser: any; a phone-width window (press with a finger) or a wide window (hold the mouse button)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step, nothing changed yet

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Drag the top-left corner ring 40 px right and 40 px down, and let go | That corner is now off the card's corner |
| 2 | Open **Perspective options**: on a phone, tap the **Options** tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls | **Tap to find card** shows |
| 3 | Tap **Tap to find card** | The line above the controls reads "Tap the card in the photo." |
| 4 | Press the middle of the card and hold it still for a full second, then lift | All four corners land on the card's own corners, and the line reads NUDGE again |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### PER-29.3 A find tap on a picture with no card leaves the corners, with a pop-up   [auto: phone]
Flag: to confirm. Written to today's behavior: the pop-up and the line's own message show at the same time.

Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: blank.png, a plain mid-grey picture 1200 × 1600 px with no card in it (the script draws its own)
- Starting screen: the picture open, on the Perspective step, nothing changed yet (**Undo** at the top right is greyed out)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Open **Perspective options**: on a phone, tap the **Options** tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls | **Tap to find card** shows |
| 2 | Tap **Tap to find card** | The line above the controls reads "Tap the card in the photo." |
| 3 | Tap the middle of the picture once, without moving | A pop-up over the picture's bottom edge reads "No card-shaped edges found. Drag the corners into place, or tap to find card and tap the card again." and, at the same time, the line above the controls reads "Nothing detected. Drag the corners into place." |
| 4 | Look at the outline and at **Undo** | The corners have not moved, and **Undo** is still greyed out |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## PER-30 A drag while armed pans

While Tap to find card is armed, a drag pans the photo and never grabs a handle.

- Risk: low
- Check: script, touch
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnFindCard`
- Source: `js/app/input.js` (`stepGesture`, `onPointerMove`)
- Cases: 1

### PER-30.1 While armed, a drag from a corner moves the photo, not the corner   [auto: phone, webkit]
Before you start:
- Device and browser: any; a phone-width window (drag with a finger) or a wide window (drag with the mouse)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Open **Perspective options**: on a phone, tap the **Options** tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls | **Tap to find card** shows |
| 2 | Tap **Tap to find card** | The line above the controls reads "Tap the card in the photo." |
| 3 | Drag from the top-left corner ring 40 px down, and let go | The whole photo, outline and all, has moved 40 px down; every corner is still on the same point of the card |
| 4 | Look at the line above the controls | It still reads "Tap the card in the photo." |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## PER-31 Cancel

**Cancel**, beside "Tap the card in the photo.", disarms Tap to find card in one tap.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#perspectiveStatusAction`, "Cancel", "Tap the card in the photo."
- Source: `js/app/perspective.js` (`bindPerspective`, `perspectiveStatus`)
- Cases: 1

### PER-31.1 Cancel disarms Tap to find card in one tap   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step, nothing changed yet (**Undo** at the top right is greyed out)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Open **Perspective options**: on a phone, tap the **Options** tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls | **Tap to find card** shows |
| 2 | Tap **Tap to find card** | The line above the controls reads "Tap the card in the photo.", with **Cancel** at its right |
| 3 | Tap **Cancel** | The line reads NUDGE and Corner 1 of 4 |
| 4 | Tap the middle of the card once, without moving | Nothing happens: no "Detecting…", the corners stay, and **Undo** is still greyed out |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## PER-32 Card orientation

Under **Card orientation** in the options sheet, **Auto**, **Portrait** and **Landscape** set which way the flattened card stands, as one undo step. The control keeps its 44 px height in the sheet.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#orientation`, "Card orientation", "Portrait", "Landscape"
- Source: `js/app/perspective.js` (`buildPerspectiveSheet`, `bindPerspective`, `syncPerspective`); `js/app/parts/segmented-control.js` (`buildSegmented`, `bindSegmented`)
- Cases: 2

### PER-32.1 Landscape and Portrait set which way the card stands, one undo step each   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/ (an upright card)
- Starting screen: the photo open, on the Perspective step, nothing changed yet (**Undo** at the top right is greyed out)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Open **Perspective options**: on a phone, tap the **Options** tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls | Under CARD ORIENTATION, **Auto** is selected (white) |
| 2 | Tap **Landscape** | **Landscape** is selected instead |
| 3 | Close the options (on a phone, the **×** at their top right; on a wide screen there is nothing to close), then tap **Preview** in the row of tools | The corrected card is wider than tall, 7 wide to 5 tall |
| 4 | Tap **Preview** again | The photo and its handles are back |
| 5 | Tap **Undo** (the arrow curving left, at the top right) | **Undo** is greyed out: Landscape was one undo step |
| 6 | Open **Perspective options** | **Auto** is selected again |
| 7 | Tap **Portrait** | **Portrait** is selected, and the corrected card stands upright, 5 wide to 7 tall |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### PER-32.2 Card orientation keeps its 44 px height in the options   [auto: phone, webkit]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap the **Options** tab (the tab with an up arrow on the top edge of the controls) | **Perspective options** rise from the bottom |
| 2 | Measure the **Auto** / **Portrait** / **Landscape** control under CARD ORIENTATION | It is 44 px tall |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## PER-33 Reset perspective

**Reset perspective** in the options sheet puts the corners back on the best candidate (or on the centered rectangle when there is none), Flatten back to 100% and Card orientation back to **Auto**, as one undo step.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnResetPerspective`, "Reset perspective"
- Source: `js/app/perspective.js` (`buildPerspectiveSheet`); `js/app/shell.js` (`bindControls`, `resetStep`)
- Cases: 2

### PER-33.1 Reset perspective restores the corners, Flatten and orientation in one undo step   [auto: phone]
Before you start:
- Device and browser: any; a phone-width window (drag with a finger) or a wide window (drag with the mouse)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step, nothing changed yet

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Drag the top-left corner ring 40 px right and 40 px down, and let go | That corner is off the card's corner |
| 2 | Tap **Flatten** in the row of tools | The line above reads FLATTEN 100% |
| 3 | Tap the slider's track at its far left end | The line reads FLATTEN 0% |
| 4 | Open **Perspective options**: on a phone, tap the **Options** tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls | **Reset perspective** shows, in red |
| 5 | Tap **Landscape** under CARD ORIENTATION | **Landscape** is selected |
| 6 | Tap **Reset perspective** | **Auto** is selected again, the line reads FLATTEN 100%, and the top-left corner is back on the card's corner |
| 7 | Close the options (on a phone, the **×** at their top right; on a wide screen there is nothing to close) | The options are closed |
| 8 | Tap **Undo** (the arrow curving left, at the top right) | All three come back at once: the line reads FLATTEN 0%, the top-left corner is where you dragged it, and the options show **Landscape** |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### PER-33.2 With no candidate, Reset perspective puts the corners on the centered rectangle   [auto: phone]
Before you start:
- Device and browser: any; a phone-width window (drag with a finger) or a wide window (drag with the mouse)
- Build: the build under test
- Photo: blank.png, a plain mid-grey picture 1200 × 1600 px with no card in it (the script draws its own)
- Starting screen: the picture open, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Drag the top-left corner ring 40 px right and 40 px down, and let go | That corner has moved |
| 2 | Open **Perspective options**: on a phone, tap the **Options** tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls | **Reset perspective** shows |
| 3 | Tap **Reset perspective** | The outline is the rectangle a fifth of the picture's width and height in from each edge again |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## PER-34 Debug overlay

Under **Developer** in the options sheet, the **Debug overlay** switch draws the edge map, the detected lines and the scored candidates over the photo.

- Risk: low
- Check: eye
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#debugOverlay`, "Debug overlay", "Developer"
- Source: `js/app/perspective.js` (`buildPerspectiveSheet`, `bindPerspective`); `js/app/view.js` (`drawDebug`, `edgeMapCanvas`, `drawSnapLines`, `drawDebugQuads`)
- Ruling: R3. The switch leaves the corners alone and only draws. The app differs today.
- Cases: 2

### PER-34.1 The Debug overlay's drawing, for a person to judge   [eye]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step, nothing changed yet

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap the **Options** tab (the tab with an up arrow on the top edge of the controls) | **Perspective options** rise; under DEVELOPER the **Debug overlay** switch is off |
| 2 | Tap the **Debug overlay** switch | It is on |
| 3 | Close the options with the **×** at their top right | Drawn over the photo: cyan dots tracing the edges detection found; thin yellow lines running right across the photo along the strongest edges; and magenta outlines of the shapes detection scored, the best one drawn thicker, each of the first eight labelled near its top-left corner with #1, #2 and so on, a score and a percentage |
| 4 | Tap the **Options** tab, tap the **Debug overlay** switch, then close the options with the **×** | The cyan, yellow and magenta drawing has gone; the white outline and its handles are as before |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### PER-34.2 The Debug overlay switch leaves corners placed by hand where they are   [auto: phone]
Written to ruling R3; it fails until that is built (BUG-063).

Before you start:
- Device and browser: any; a phone-width window (drag with a finger) or a wide window (drag with the mouse)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step, nothing changed yet

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Drag the top-left corner ring 40 px right and 40 px down, and let go | That corner has moved 40 px right and 40 px down, off the card's corner |
| 2 | Open **Perspective options**: on a phone, tap the **Options** tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls | **Debug overlay** shows under DEVELOPER, off |
| 3 | Tap the **Debug overlay** switch | It is on |
| 4 | Close the options (on a phone, the **×** at their top right; on a wide screen there is nothing to close), and look at the top-left corner ring | It is still where you dragged it in row 1 |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## PER-35 The Result picture

A small live **Result** picture of the corrected card sits in the side panel, across its width, and updates during drags.

- Risk: low
- Check: script
- Layout: wide. A phone doesn't show it.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#mini`, "Result", `CONFIG.thumbMaxPx`
- Source: `js/app/view.js` (`requestMini`, `drawMini`); `index.html` (the `.perspective-result` block)
- Cases: 2

### PER-35.1 The Result picture runs across the side panel and follows a drag   [auto: desktop, webkit]
Before you start:
- Device and browser: a computer with a mouse; a wide window, 1280 × 800 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step, nothing changed yet

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the side panel, under the row of tools | Under the heading RESULT, a picture of the corrected card runs the panel's full width inside its margins, and is 150 px tall |
| 2 | Press on the top-left corner ring and drag it 40 px right and 40 px down, keeping the button down | Before you let go, the **Result** picture has changed with the corner |
| 3 | Let go | The **Result** picture still shows the card as it was at the end of the drag |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### PER-35.2 A phone shows no Result picture   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the controls under the photo | No RESULT heading and no small picture of the corrected card |
| 2 | Tap the **Options** tab (the tab with an up arrow on the top edge of the controls) | **Perspective options** rise, with no RESULT heading and no small picture of the corrected card in them |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## PER-36 Which message shows

The line above the controls shows at most one message, in this order: Tap to find card armed, crossed corners, "Detecting…", low confidence, nothing detected, then the corrected frame clamped to 12000 px.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#perspectiveStatus`, "Detecting…", "Low confidence (", "Corrected frame clamped to "
- Source: `js/app/perspective.js` (`perspectiveStatus`, `asSentences`, `syncPerspectiveReadouts`)
- Ruling: R7. "Low confidence" and "Nothing detected" clear after the first corner move, by drag or with the arrow buttons. The app differs today.
- Flag: to confirm. Messages the user can't act on take the line, such as "Detecting…" and "Corrected frame clamped to 12000px on the long side." (written without a space before px).
- Cases: 6

None of the sample photos is found with low confidence, so the cases that need it open the app with a link setting that counts any confidence under 100% as low, and the one that needs a clamped frame with a setting that lowers the largest corrected frame to 1000 px.

### PER-36.1 Tap to find card's prompt takes the line over the crossed-corners message   [auto: phone]
Before you start:
- Device and browser: any; a phone-width window (drag with a finger) or a wide window (drag with the mouse)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step, nothing changed yet

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Drag the top-left corner ring to 40 px right of and 40 px below the top-right corner ring, and let go | The line above the controls reads "Corners cross or fold inward. Drag them back into a convex shape." |
| 2 | Open **Perspective options**: on a phone, tap the **Options** tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls | **Tap to find card** shows |
| 3 | Tap **Tap to find card** | The line reads "Tap the card in the photo.", with **Cancel** at its right |
| 4 | Tap **Cancel** | The line reads "Corners cross or fold inward. Drag them back into a convex shape." again |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### PER-36.2 The crossed-corners message takes the line over low confidence   [auto: phone]
Before you start:
- Device and browser: any; a phone-width window (drag with a finger) or a wide window (drag with the mouse)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/ (detection is 99% sure of it)
- Starting screen: the app opened with a link ending `?detect.minConfidence=1` (a setting that counts any confidence under 100% as low), the photo open on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the line above the controls | It reads "Low confidence (99%). Check the corners." |
| 2 | Drag the top-left corner ring to 40 px right of and 40 px below the top-right corner ring, and let go | The line reads "Corners cross or fold inward. Drag them back into a convex shape." |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### PER-36.3 Low confidence clears once a corner is dragged   [auto: phone]
Written to ruling R7; it fails until that is built (BUG-064).

Before you start:
- Device and browser: any; a phone-width window (drag with a finger) or a wide window (drag with the mouse)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/ (detection is 99% sure of it)
- Starting screen: the app opened with a link ending `?detect.minConfidence=1` (a setting that counts any confidence under 100% as low), the photo open on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the line above the controls | It reads "Low confidence (99%). Check the corners." |
| 2 | Drag the top-left corner ring 20 px right, and let go | The message has gone: the line reads NUDGE and Corner 1 of 4 |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### PER-36.4 "Nothing detected" clears once a corner is nudged with an arrow   [auto: phone]
Written to ruling R7; it fails until that is built (BUG-064).

Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: blank.png, a plain mid-grey picture 1200 × 1600 px with no card in it (the script draws its own)
- Starting screen: the picture open, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the line above the controls | It reads "Nothing detected. Drag the corners into place." |
| 2 | Tap the right arrow (→) under that line | The top-left corner moves right by a hair, and the message has gone: the line reads NUDGE and Corner 1 of 4 |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### PER-36.5 A clamped corrected frame is reported in the line   [auto: phone]
Flag: to confirm. Written to today's behavior: the message is one the user can't act on, and it has no space before px.

Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the app opened with a link ending `?maxOutputPx=1000` (a setting that makes the largest corrected frame 1000 px on its long side), the photo open on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the line above the controls | It reads "Corrected frame clamped to 1000px on the long side." |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### PER-36.6 Low confidence takes the line over a clamped frame   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/ (detection is 99% sure of it)
- Starting screen: the app opened with a link ending `?detect.minConfidence=1&maxOutputPx=1000` (two settings: any confidence under 100% counts as low, and the largest corrected frame is 1000 px on its long side), the photo open on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the line above the controls | It reads "Low confidence (99%). Check the corners.", not the clamped-frame message |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## PER-37 Kept for the session

The Nudge or Flatten mode, **Snap** and **Debug overlay** stay as set when another photo is opened, but are not saved.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#toolNudge`, `#toolSnap`, `#debugOverlay`
- Source: `js/app/perspective.js` (`bindPerspectiveTools`, `bindPerspective`); `js/app/core.js` (the `app` object's defaults)
- Flag: to confirm. They survive opening a new photo but not a reload.
- Cases: 2

### PER-37.1 Flatten, Snap and Debug overlay stay as set for the next photo   [auto: phone]
Flag: to confirm. Written to today's behavior.

Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photos: IMG_9136.JPEG and IMG_9075.JPEG from samples/
- Starting screen: IMG_9136.JPEG open, on the Perspective step for the first time since the page was loaded

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Flatten** in the row of tools | **Flatten** is selected (a solid white button) |
| 2 | Tap **Snap** | It reads On |
| 3 | Open **Perspective options**: on a phone, tap the **Options** tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls | The **Debug overlay** switch is off |
| 4 | Tap the **Debug overlay** switch, then close the options (on a phone, the **×** at their top right) | Thin yellow lines run across the photo |
| 5 | Tap **Open** (the folder at the top left; on a phone it has no label) and choose IMG_9075.JPEG | The new photo opens on the Perspective step |
| 6 | Look at the row of tools | **Flatten** is selected, with the line FLATTEN 100% above; **Snap** reads On |
| 7 | Open **Perspective options** | The **Debug overlay** switch is on |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### PER-37.2 Flatten, Snap and Debug overlay are not kept after a reload   [auto: phone]
Flag: to confirm. Written to today's behavior.

Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step for the first time since the page was loaded

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Flatten** in the row of tools | **Flatten** is selected (a solid white button) |
| 2 | Tap **Snap** | It reads On |
| 3 | Open **Perspective options**: on a phone, tap the **Options** tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls | The **Debug overlay** switch is off |
| 4 | Tap the **Debug overlay** switch, then close the options (on a phone, the **×** at their top right) | Thin yellow lines run across the photo |
| 5 | Wait two seconds, then reload the page | The start screen offers to resume IMG_9136.JPEG, with **Resume** and **Start fresh** |
| 6 | Tap **Resume** | The photo opens on the Perspective step |
| 7 | Look at the row of tools | **Nudge** is selected, with the line NUDGE above; **Snap** reads Off |
| 8 | Open **Perspective options** | The **Debug overlay** switch is off |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## PER-38 What is not an undo step

Selecting a handle, **Next handle**, changing mode, **Snap**, **Preview**, arming **Tap to find card**, **Debug overlay** and the search on opening add no undo step.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnUndo`, `#btnNextHandle`, `#toolSnap`, `#toolPreview`
- Source: `js/app/perspective.js` (`bindHandleNudge`, `bindPerspectiveTools`, `bindPerspective`); `js/app/state.js` (`runDetect`)
- Ruling: R3. The Debug overlay switch leaves the corners alone, so it never adds an undo step. The app differs today.
- Cases: 2

### PER-38.1 Selecting, Next handle, Flatten, Snap, Preview and Tap to find card add no undo step   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step, nothing changed yet

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at **Undo** (the arrow curving left, at the top right) | It is greyed out: the search for the card on opening was not an undo step |
| 2 | Tap the bottom-right corner ring (a quick tap, without dragging) | The line above the controls reads Corner 3 of 4; **Undo** is still greyed out |
| 3 | Tap **Next handle** | The line reads Corner 4 of 4; **Undo** is still greyed out |
| 4 | Tap **Flatten** in the row of tools | **Flatten** is selected; **Undo** is still greyed out |
| 5 | Tap **Snap** | It reads On; **Undo** is still greyed out |
| 6 | Tap **Preview** | It reads On; **Undo** is still greyed out |
| 7 | Tap **Preview** again | It reads Off; **Undo** is still greyed out |
| 8 | Open **Perspective options**: on a phone, tap the **Options** tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls | **Tap to find card** shows |
| 9 | Tap **Tap to find card** | The line reads "Tap the card in the photo."; **Undo** is still greyed out |
| 10 | Tap **Cancel** at the right of that line | The line reads FLATTEN 100%; **Undo** is still greyed out |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### PER-38.2 The Debug overlay switch adds no undo step after a hand-placed corner   [auto: phone]
Written to ruling R3; it fails until that is built (BUG-063).

Before you start:
- Device and browser: any; a phone-width window (drag with a finger) or a wide window (drag with the mouse)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step, nothing changed yet (**Undo** at the top right is greyed out)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Drag the top-left corner ring 40 px right and 40 px down, and let go | That corner has moved; **Undo** (the arrow curving left, at the top right) is no longer greyed out |
| 2 | Open **Perspective options**: on a phone, tap the **Options** tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls | **Debug overlay** shows under DEVELOPER, off |
| 3 | Tap the **Debug overlay** switch, then close the options (on a phone, the **×** at their top right) | The switch was on as the options closed |
| 4 | Tap **Undo** | The top-left corner is back on the card's corner, and **Undo** is greyed out: the drag was the only undo step |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## PER-39 Detection finds the card, not its holder

Detection puts the corners on the card's own outer edge, not on the slab, stand, one-touch or case around it. Each sample photo is held to its own baseline, measured against hand-placed corners: no photo that works today may get worse.

- Risk: high
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.detect.wArea`, `CONFIG.detect.retryConfidence`, `CONFIG.detect.refine`
- Source: `js/engine.js` (`detect`, `detectionPass`, `refineQuad`); the measured baselines live today in `tests/sample-regression.js` (`GROUND_TRUTH`, `BASELINE`, `HELD_OUT`), copied unchanged into `tests/automation/support/detection-baselines.js`
- Cases: 1

### PER-39.1 Every sample photo is detected within its own baseline   [auto: desktop]
One photo is a known defect (BUG-065): in the browser the automated cases run in, the card in 02_black_flat_black.JPEG is not found. The script expects that one photo to miss until the bug is fixed, and holds every other photo to its rules.

Before you start:
- Device and browser: a computer; a wide window, 1280 × 800 px
- Build: the build under test
- Photos: the 22 sample photos in samples/ listed in tests/README.md under "Detection (R1)", each with its hand-placed corners and its two baselines (top pick and best of 3)
- Starting screen: the start screen, with no photo open

A photo's **error** for a set of four corners: measure how far each corner is from the hand-placed one, take the largest of the four, and divide it by the length of the photo's diagonal, as a percentage. Its **group** comes from its top-pick baseline: **within 1%** (under 1%), **near miss** (1% to 5%) or **wrong shape** (over 5%).

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Open** (the folder at the top left) and choose the first photo in the list | The photo opens on the Perspective step, and "Detecting…" comes and goes |
| 2 | Work out the error of the corners as they landed (the top pick) | Within 1%: under 1%, and at most 0.25 points above its baseline. Near miss: at most 0.25 points above its baseline. Wrong shape: write it down; it is not held to a limit |
| 3 | Tap **Candidate** in the row of tools until it has shown each of its numbers once, working out the error at each | Where the photo's best-of-3 baseline is under 1%, the smallest of these errors (the best of 3) is under 1% |
| 4 | Repeat rows 1 to 3 for each of the other 21 photos | Every photo meets its rules in rows 2 and 3 |

Pass: every row's result is seen.
On a fail, record: the photo's name, its top-pick and best-of-3 errors next to its two baselines, and a screenshot.
