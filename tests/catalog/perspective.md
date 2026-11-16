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
- Cases: none yet

## PER-02 Fallback corners when nothing is found

If that first search finds no card, the corners rest on a centered rectangle 20% in from each edge of the photo, and no pop-up message appears. The line above the controls reads "Nothing detected. Drag the corners into place."

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.defaultInsetPct`, "Nothing detected. Drag the corners into place."
- Source: `js/app/state.js` (`insetCorners`, `defaultState`, `runDetect`); `js/app/perspective.js` (`perspectiveStatus`)
- Cases: none yet

## PER-03 A newer search wins

If a new search for the card starts before an older one finishes, or a front and back pair switches sides meanwhile, the older search's result is thrown away.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: none
- Source: `js/app/state.js` (`runDetect`)
- Cases: none yet

## PER-04 The corner outline

The four corners are joined by a white line over a dark halo. While the corners cross or fold inward, the line is red and dashed instead.

- Risk: medium
- Check: eye
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.colors.quad`, `CONFIG.colors.quadHalo`, `CONFIG.colors.quadInvalid`, `CONFIG.handle.lineWidth`
- Source: `js/app/view.js` (`drawSource`)
- Cases: none yet

## PER-05 Edge guide lines

Faint dashed lines extend each of the four edges across the whole photo, for lining up against long card edges.

- Risk: low
- Check: eye
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.colors.extend`
- Source: `js/app/view.js` (`drawEdgeExtensions`)
- Cases: none yet

## PER-06 The eight handles

Eight handles stay the same size on screen at any zoom: a ring with a center dot on each corner, and a small square at the middle of each edge. The selected handle is red and slightly larger.

- Risk: low
- Check: eye
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.handle.cornerRadius`, `CONFIG.handle.edgeSize`, `CONFIG.colors.handleSelected`
- Source: `js/app/view.js` (`drawHandles`)
- Cases: none yet

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
- Cases: none yet

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
- Cases: none yet

## PER-09 Pressing a handle selects it

Pressing a handle selects it, so the arrow buttons and the keyboard's arrow keys then move that handle.

- Risk: medium
- Check: script, touch
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#perspectiveLine`, `CONFIG.colors.handleSelected`
- Source: `js/app/input.js` (`stepGesture`); `js/app/perspective.js` (`bindPerspective`)
- Cases: none yet

## PER-10 The magnifier while dragging

While a handle is dragged, a round magnifier shows the full-resolution photo around it at 4 times the current zoom, with the outline, a crosshair and a white rim. It is 150 px across, and never wider than 42% of the photo area.

- Risk: medium
- Check: eye
- Layout: both. It is placed by pointer type: with touch or a pen it is pinned to the top corner on the side away from the finger; with a mouse it sits up and to the right of the cursor, and drops below it near the top edge.
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.loupeZoom`, `CONFIG.loupeSize`, `CONFIG.loupeMaxFrac`, `CONFIG.loupeOffset`
- Source: `js/app/view.js` (`drawLoupe`, `loupeRadius`, `loupeCenter`, `drawCrosshair`, `drawLoupeRim`)
- Cases: none yet

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
- Cases: none yet

## PER-12 The selected handle's name

At rest, the line above the controls reads **Nudge** and the selected handle's name, from **Corner 1 of 4** to **Edge 4 of 4**. It updates after a press on a handle or a key press.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#perspectiveLine`, "Corner ", "Edge "
- Source: `js/app/perspective.js` (`handleName`, `syncPerspectiveReadouts`, `bindPerspective`)
- Cases: none yet

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
- Cases: none yet

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
- Cases: none yet

## PER-15 Hold an arrow to repeat

Holding an arrow button repeats it after 350 ms, every 60 ms, until the finger lifts, slides off or is cancelled. Nudges less than 0.9 s apart, held or tapped, are one undo step.

- Risk: medium
- Check: script, touch
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.nudge.delayMs`, `CONFIG.nudge.repeatMs`, "The arrows nudge the selected handle. Hold one to repeat."
- Source: `js/app/parts/nudge-pad.js` (`bindNudgePad`); `js/app/perspective.js` (`bindHandleNudge`); `js/app/state.js` (`commit`, `History.push`)
- Cases: none yet

## PER-16 Next handle

**Next handle** selects the next of the eight handles, the four corners and then the four edges, and wraps back to the first.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnNextHandle`, "Next handle", "Select the next handle"
- Source: `js/app/perspective.js` (`buildNudgeRow`, `bindHandleNudge`)
- Cases: none yet

## PER-17 The magnifier after a nudge

After a press on an arrow button or **Next handle**, the magnifier shows on the selected handle for 4 seconds. Pressing anything else, or changing step, hides it.

- Risk: low
- Check: eye
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.nudge.loupeMs`
- Source: `js/app/perspective.js` (`bindHandleNudge`); `js/app/view.js` (`drawSource`); `js/app/shell.js` (`setTab`, `bindNavigation`)
- Cases: none yet

## PER-18 Nudge

**Nudge** is the resting mode: it shows the selected handle's name, the arrow buttons and **Next handle**.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#toolNudge`, `#perspectiveNudgeRow`
- Source: `js/app/perspective.js` (`bindPerspectiveTools`, `syncPerspective`)
- Cases: none yet

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
- Cases: none yet

## PER-20 The Flatten slider

The slider runs from 0 to 100%, and starts at 100%: 0% squares the card up but keeps the camera's depth, 100% is a flat 5:7 rectangle. The photo updates while sliding, and one slide is one undo step (slides less than 0.9 s apart merge).

- Risk: high
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#strength`, `CONFIG.perspective.strength`, "100% is a flat 5:7 rectangle, like a scan."
- Source: `js/app/perspective.js` (`bindFlattenSlider`, `syncFlattenValue`); `js/engine.js` (`computeGeometry`)
- Cases: none yet

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
- Cases: none yet

## PER-22 Snap

**Snap** turns snapping to detected edges on and off. It starts off.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#toolSnap`, "Snap handles to detected edges"
- Source: `js/app/perspective.js` (`bindPerspectiveTools`, `syncPerspective`); `js/app/core.js` (the `app` object's defaults)
- Cases: none yet

## PER-23 Snap a corner

With **Snap** on, a dragged corner jumps to the nearest point where two roughly square detected lines cross, when one is within 18 screen px.

- Risk: medium
- Check: script, touch
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.snapRadiusPx`, `#toolSnap`
- Source: `js/app/input.js` (`moveHandle`, `snapPoint`); `js/app/state.js` (`buildSnapTargets`)
- Cases: none yet

## PER-24 Snap an edge

With **Snap** on, a dragged edge jumps onto the nearest detected line that runs within 3° of it, when one is within 18 screen px.

- Risk: medium
- Check: script, touch
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.snapRadiusPx`, `#toolSnap`
- Source: `js/app/input.js` (`moveHandle`, `snapEdge`); `js/app/state.js` (`buildSnapTargets`)
- Cases: none yet

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
- Cases: none yet

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
- Cases: none yet

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
- Cases: none yet

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
- Cases: none yet

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
- Cases: none yet

## PER-30 A drag while armed pans

While Tap to find card is armed, a drag pans the photo and never grabs a handle.

- Risk: low
- Check: script, touch
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnFindCard`
- Source: `js/app/input.js` (`stepGesture`, `onPointerMove`)
- Cases: none yet

## PER-31 Cancel

**Cancel**, beside "Tap the card in the photo.", disarms Tap to find card in one tap.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#perspectiveStatusAction`, "Cancel", "Tap the card in the photo."
- Source: `js/app/perspective.js` (`bindPerspective`, `perspectiveStatus`)
- Cases: none yet

## PER-32 Card orientation

Under **Card orientation** in the options sheet, **Auto**, **Portrait** and **Landscape** set which way the flattened card stands, as one undo step. The control keeps its 44 px height in the sheet.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#orientation`, "Card orientation", "Portrait", "Landscape"
- Source: `js/app/perspective.js` (`buildPerspectiveSheet`, `bindPerspective`, `syncPerspective`); `js/app/parts/segmented-control.js` (`buildSegmented`, `bindSegmented`)
- Cases: none yet

## PER-33 Reset perspective

**Reset perspective** in the options sheet puts the corners back on the best candidate (or on the centered rectangle when there is none), Flatten back to 100% and Card orientation back to **Auto**, as one undo step.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnResetPerspective`, "Reset perspective"
- Source: `js/app/perspective.js` (`buildPerspectiveSheet`); `js/app/shell.js` (`bindControls`, `resetStep`)
- Cases: none yet

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
- Cases: none yet

## PER-35 The Result picture

A small live **Result** picture of the corrected card sits in the side panel, across its width, and updates during drags.

- Risk: low
- Check: script
- Layout: wide. A phone doesn't show it.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#mini`, "Result", `CONFIG.thumbMaxPx`
- Source: `js/app/view.js` (`requestMini`, `drawMini`); `index.html` (the `.perspective-result` block)
- Cases: none yet

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
- Cases: none yet

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
- Cases: none yet

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
- Cases: none yet

## PER-39 Detection finds the card, not its holder

Detection puts the corners on the card's own outer edge, not on the slab, stand, one-touch or case around it. Each sample photo is held to its own baseline, measured against hand-placed corners: no photo that works today may get worse.

- Risk: high
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.detect.wArea`, `CONFIG.detect.retryConfidence`, `CONFIG.detect.refine`
- Source: `js/engine.js` (`detect`, `detectionPass`, `refineQuad`); the measured baselines live today in `tests/sample-regression.js` (`GROUND_TRUTH`, `BASELINE`, `HELD_OUT`)
- Cases: none yet
