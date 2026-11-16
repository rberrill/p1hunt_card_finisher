# Overlay (logo)

Placing a logo or watermark on the framed photo: adding it, moving and sizing it, the saved logo, and how it goes into the saved file.

## OVL-01 Add a logo

Tap **Add logo** (red) to pick a PNG, WebP, JPEG or SVG file to place on the photo as a logo.

- Risk: high
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnOverlayAdd`, `#overlayInput`, "Add a logo or watermark: PNG, WebP, JPG or SVG, up to 5 MB."
- Source: `js/app/overlay.js` (`buildAddRow`, `bindOverlayControls`, `addOverlayFile`); `index.html` (the logo's file input)
- Flag: to confirm. The hint above the button always says "up to 5 MB", while the error for a file that is too big uses the real limit, which a link can lower.
- Cases: none yet

## OVL-02 Which files can be a logo

A logo file is accepted by its file type, or else by its name's extension. A PNG, WebP or JPEG over 4096 px is scaled down, an SVG is drawn 2048 px on its long side, and transparency is kept, so an SVG logo stays sharp in a full-size export.

- Risk: medium
- Check: script; script, saved file (an SVG logo stays sharp in a full-size export)
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.overlay.maxPx`, `CONFIG.overlay.svgPx`, "That file type isn’t supported. Use PNG, WebP, JPG or SVG."
- Source: `js/app/overlay.js` (`imageTypeOf`, `decode`, `decodeSvg`, `svgSize`, `register`)
- Cases: none yet

## OVL-03 Where a new logo lands

A newly added logo lands in the center of the frame, a quarter of its width, at 100% opacity, as one undo step.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnOverlayAdd`, `#overlayOpacityValue`
- Source: `js/app/overlay.js` (`place`, `defaultPlacement`); `js/engine.js` (`OVERLAY_DEFAULTS`)
- Ruling: R19. Each logo add is its own undo step, however quickly two come (and a dropped logo is accepted by its extension, as the picker accepts it). The app differs today.
- Cases: none yet

## OVL-04 Use the saved logo

While a logo is saved in this browser, its thumbnail and **Use saved overlay** show beside **Add logo**. The button places the saved logo at its last position, size and opacity, as one undo step; the saved logo is never applied by itself.

- Risk: high
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnUseSaved`, `#overlayThumb`, "Use saved overlay"
- Source: `js/app/overlay.js` (`useSaved`, `loadSavedOverlay`, `setSaved`, `syncOverlay`)
- Cases: none yet

## OVL-05 The pads take the add buttons' place

Once a logo is placed, **Add logo** and the saved logo give way to the move pad and the size pad.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#overlayAddRow`, `#overlayPadRow`, `#overlayMovePad`, `#overlaySizePad`
- Source: `js/app/overlay.js` (`buildPadRow`, `syncOverlay`)
- Cases: none yet

## OVL-06 Opacity

With a logo placed, the **Opacity** slider above the pads sets the logo's opacity from 0 to 100%, live, with the percent beside it. One slide is one undo step.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#overlayOpacity`, `#overlayOpacityValue`, `#overlayOpacityLine`
- Source: `js/app/overlay.js` (`buildOpacityLine`, `bindOpacitySlider`, `syncOverlay`)
- Cases: none yet

## OVL-07 Move pad

Each of the move pad's four arrow keys (**Move left**, **Move up**, **Move down**, **Move right**) moves the logo by 0.5% of the frame's width; holding a key repeats. Presses less than 0.9 s apart make one undo step.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#overlayMovePad`, `CONFIG.overlay.nudgePct`, `CONFIG.nudge.repeatMs`
- Source: `js/app/overlay.js` (`nudge`, `adjust`, `bindOverlayControls`); `js/app/parts/nudge-pad.js` (`bindNudgePad`)
- Cases: none yet

## OVL-08 Size pad

The size pad's **−** key (**Smaller**) shrinks the logo by a factor of 1.05 and its **+** key (**Larger**) grows it by 1.05; holding a key repeats. Presses less than 0.9 s apart, on either pad, make one undo step.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#overlaySizePad`, `CONFIG.overlay.sizeStep`
- Source: `js/app/overlay.js` (`nudge`, `adjust`, `bindOverlayControls`); `js/app/parts/nudge-pad.js` (`bindNudgePad`)
- Cases: none yet

## OVL-09 Replace logo

**Replace logo** opens the file picker; the new logo lands at the starting place (centered, a quarter of the width, 100%) and becomes the saved logo.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#toolOverlayReplace`, "Choose another logo"
- Source: `js/app/overlay.js` (`bindOverlayControls`, `addOverlayFile`, `place`, `saveToBrowser`)
- Ruling: R18. The replacement logo takes the old logo's position, width and opacity. The app differs today.
- Cases: none yet

## OVL-10 Reset

**Reset** centers the logo at a quarter of the frame's width and 100% opacity, as one undo step.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#toolOverlayReset`, "Center the logo at its first size, at 100%"
- Source: `js/app/overlay.js` (`resetPlacement`)
- Cases: none yet

## OVL-11 Remove

**Remove** takes the logo off this photo, as one undo step; the logo saved in the browser stays.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#toolOverlayRemove`, "Take the logo off this photo"
- Source: `js/app/overlay.js` (`removeOverlay`)
- Ruling: R22. Remove leaves this photo's logo in storage, so Undo still brings it back after a reload and Resume. The app already does this.
- Cases: none yet

## OVL-12 Delete saved

**Delete saved** clears the logo stored in this browser only; a logo placed on the photo stays.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#toolOverlayDeleteSaved`, "Delete the logo saved in this browser", "Delete saved leaves the logo on this photo."
- Source: `js/app/overlay.js` (`deleteSaved`)
- Cases: none yet

## OVL-13 Which tools show

The bottom row of buttons is hidden with no logo placed and none saved. It holds **Delete saved** alone while a saved logo is only offered, and **Replace logo**, **Reset**, **Remove** and **Delete saved** with a logo placed. **Delete saved** is dimmed when nothing is saved.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#overlayTools`, `#toolOverlayDeleteSaved`, `#toolOverlayReplace`
- Source: `js/app/overlay.js` (`syncOverlayTools`)
- Cases: none yet

## OVL-14 A logo file that can't be used

A file that can't be used puts a red message in place of the hint or **Opacity**. It clears when a logo is added or removed, the step is left, the logo's placement changes, or a pair switches side; a failed add leaves the current logo as it was.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#overlayStatus`, "Couldn’t read that image. Try another PNG, WebP, JPG or SVG file.", " MB. The overlay limit is "
- Source: `js/app/overlay.js` (`setMessage`, `addOverlayFile`, `overlayStateChanged`, `syncOverlay`); `js/app/shell.js` (`setTab`); `js/app/pair.js` (`applySide`)
- Cases: none yet

## OVL-15 The photo is locked on this step

On the Overlay step the photo is locked: every press, pinch and wheel turn acts on the logo, and the photo can't be panned or zoomed.

- Risk: medium
- Check: script, touch
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: "On this step the photo stays framed as set in Crop."
- Source: `js/app/input.js` (`onPointerDown`, `onWheel`); `js/app/overlay.js` (`overlayPointerDown`)
- Flag: to confirm. With no logo placed, every touch and the wheel do nothing on this step.
- Cases: none yet

## OVL-16 Drag to move the logo

Dragging anywhere on the photo, except on one of the logo's corner handles, moves the logo, as one undo step.

- Risk: high
- Check: script, touch
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: "Tap a ring to snap the logo to that corner, side or the center."
- Source: `js/app/overlay.js` (`overlayPointerDown`, `gesturePlacement`, `overlayPointerMove`); `js/app/input.js` (`onPointerDown`, `onPointerMove`, `onPointerUp`)
- Cases: none yet

## OVL-17 Drag a corner to resize

A press within 24 px of one of the logo's corner handles, then a drag, resizes the logo with its shape kept and the opposite corner fixed, never narrower than 8 px. A corner handle wins over a ring under it.

- Risk: medium
- Check: script, touch
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.handle.hitRadius`, "drag a corner or pinch to resize."
- Source: `js/app/overlay.js` (`hitCorner`, `overlayPointerDown`, `gesturePlacement`); `js/engine.js` (`clampOverlay`)
- Cases: none yet

## OVL-18 Pinch to resize

A two-finger pinch resizes and moves the logo; if one finger lifts, the other carries on moving it. The whole gesture is one undo step.

- Risk: medium
- Check: script, touch
- Layout: both, on a touch screen.
- Added: 1.10 baseline
- Changed: none
- Anchors: "drag a corner or pinch to resize."
- Source: `js/app/overlay.js` (`overlayPointerDown`, `gesturePlacement`, `overlayPinchEnded`)
- Cases: none yet

## OVL-19 Nine snap rings

Nine rings sit on the photo, at the four corners, the four side middles and the center, 28 px in from the frame's edges.

- Risk: low
- Check: eye
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.overlay.hotSpotInset`
- Source: `js/app/overlay.js` (`hotSpots`, `drawHotSpots`)
- Cases: none yet

## OVL-20 Tap a ring to snap

A still tap on a ring snaps the logo there, 3% of the frame's width in from the edges (the center ring centers it), as one undo step; the edits hold the snapped place at once.

- Risk: high
- Check: script, touch
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: "Tap a ring to snap the logo to that corner, side or the center."
- Source: `js/app/overlay.js` (`hitSpot`, `overlaySpotTap`); `js/engine.js` (`snapOverlay`)
- Cases: none yet

## OVL-21 A drag that starts on a ring moves

A drag that starts on a ring moves the logo as any other drag does; it doesn't snap.

- Risk: low
- Check: script, touch
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: none
- Source: `js/app/overlay.js` (`overlayPointerDown`, `overlayPointerMove`)
- Cases: none yet

## OVL-22 Rings fade and the logo glides

The rings fade out while a gesture runs and back in after it; a tapped ring lights for 180 ms while the logo glides to its snapped place. Under reduced motion the logo jumps there.

- Risk: low
- Check: eye
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: none
- Source: `js/app/overlay.js` (`aimRings`, `ringAlphaAt`, `areRingsWanted`, `drawnPlacement`, `litSpotAt`)
- Flag: to confirm. Under reduced motion the rings appear and go with no fade, while the Levels compare badge keeps its short fade.
- Cases: none yet

## OVL-23 Box and corner handles

A dashed white box and four white corner handles surround the logo, on the Overlay step only.

- Risk: low
- Check: eye
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: none
- Source: `js/app/overlay.js` (`drawOverlayPreview`, `overlayCorners`)
- Cases: none yet

## OVL-24 The logo shows on Overlay and Export

The logo is drawn on the photo, at its opacity, on the Overlay and Export steps only.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: none
- Source: `js/app/overlay.js` (`drawOverlayPreview`); `js/app/view.js` (`drawResult`)
- Cases: none yet

## OVL-25 The logo stays inside the crop

The logo is always kept wholly inside the crop: shrunk if it can't fit, then pulled in, and again whenever the crop changes.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: none
- Source: `js/app/overlay.js` (`effective`, `setPlacement`); `js/engine.js` (`clampOverlay`)
- Cases: none yet

## OVL-26 The mouse wheel resizes the logo

With a mouse, turning the wheel over the photo resizes the logo.

- Risk: low
- Check: script
- Layout: wide. It needs a mouse wheel, which a phone doesn't have.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Arrows move the logo (Shift for bigger steps); + and − resize it; the wheel resizes too."
- Source: `js/app/overlay.js` (`overlayWheel`); `js/app/input.js` (`onWheel`)
- Cases: none yet

## OVL-27 The mouse cursor

With a mouse on the Overlay step, the cursor shows resize arrows over a corner handle, a pointing hand over a ring, a move cursor elsewhere, and the plain arrow with no logo placed.

- Risk: low
- Check: script
- Layout: wide. It needs a mouse.
- Added: 1.10 baseline
- Changed: none
- Anchors: none
- Source: `js/app/overlay.js` (`overlayCursor`); `js/app/input.js` (`hoverCursor`)
- Cases: none yet

## OVL-28 The saved logo is kept up to date

Adding a logo by the button, a drop or a paste makes it the saved logo. While the placed logo is the saved one, its position, size and opacity are saved again 400 ms after each change.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.session.saveDelayMs`, "This overlay works on this photo, but it can’t be saved in this browser."
- Source: `js/app/overlay.js` (`addOverlayFile`, `saveToBrowser`, `overlayStateChanged`)
- Flag: to confirm. When the logo can't be stored, the message says so but gives no next step.
- Cases: none yet

## OVL-29 The logo goes on last in the saved file

In the saved file the logo is drawn last: Levels and the upscale sharpening never touch it, and it sits at the same place relative to the crop at every Size.

- Risk: high
- Check: script, saved file
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: "The overlay image isn’t loaded. Open the Overlay step and add it again."
- Source: `js/app/overlay.js` (`compositeOverlay`); `js/app/export.js` (`renderFull`)
- Cases: none yet

## OVL-30 The logo's place is part of the edits

The logo's placement is part of the edits: it can be undone, and it is kept per photo, per side of a pair, in the saved session and in edits files.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: none
- Source: `js/app/state.js` (`defaultState`, `commit`); `js/app/overlay.js` (`overlayForEdits`, `overlayFromEdits`); `js/engine.js` (`sanitizeState`)
- Cases: none yet

## OVL-31 With invalid corners

With invalid corners, picking a file with **Add logo** or **Replace logo** does nothing and says nothing. **Use saved overlay** still places the saved logo in the edits, as one undo step, though nothing is drawn: the pads and tools appear and the pads do nothing.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnOverlayAdd`, `#btnUseSaved`, `#toolOverlayReplace`
- Source: `js/app/overlay.js` (`addOverlayFile`, `useSaved`, `place`, `setPlacement`, `syncOverlay`)
- Ruling: R11. With invalid corners, **Add logo**, **Use saved overlay** and **Replace logo** are dimmed and the line above the controls reads "Fix the corners in Perspective first." The app differs today.
- Cases: none yet

## OVL-32 Overlay options

The Overlay sheet, **Overlay options**, holds only the tips.

- Risk: low
- Check: script
- Layout: both. On a phone it is a sheet opened from the tab with the up arrow above the controls; on a wide screen it is always shown in the side panel, with the tips in place of the sheet's title.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#overlaySheet`, `#overlayTips`, "Overlay options"
- Source: `js/app/overlay.js` (`buildOverlayControls`)
- Cases: none yet
