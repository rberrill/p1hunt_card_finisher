# Photo view

How the photo sits on screen: fitting, zooming and panning with fingers, the mouse and the wheel, what is drawn under and around the photo, and how sharp it is.

## VIEW-01 The photo starts fitted

Each view of the photo starts fitted to the photo area, with 24 px of space around it (36 px on Crop).

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#view`, `#btnFit`
- Source: `js/app/view.js` (`fitView`, `currentView`)
- Flag: to confirm. Rotate and Crop share one view but ask for different space around it, so the fitted size on Crop depends on which of the two was opened first.
- Cases: none yet

## VIEW-02 Each step keeps its own zoom

Zoom and pan are kept separately for four views: Perspective's photo; the corrected photo (Rotate, Crop and Perspective's **Preview**); the cropped photo (Levels, Overlay and Export); and a pair's joined preview on Export.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#view`, `#btnFit`
- Source: `js/app/view.js` (`currentView`, `togetherView`, `viewKey`)
- Cases: none yet

## VIEW-03 When the view refits by itself

A view that is still fitted refits when the window changes size and after edits; a zoomed or panned view stays as it is. The cropped view (Levels, Overlay, Export) refits after every edit and each time one of those steps is opened.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#view`, `#btnFit`
- Source: `js/app/view.js` (`resizeCanvas`, `currentView`); `js/app/state.js` (`stateChanged`); `js/app/shell.js` (`setTab`)
- Flag: to confirm. Zoom on Levels, Overlay and Export is dropped each time one of them is opened, while Perspective's and Rotate and Crop's zoom is kept.
- Cases: none yet

## VIEW-04 Pinch to zoom

Two fingers on the photo zoom and pan it together, held at the point between the fingers.

- Risk: high
- Check: script, touch
- Layout: both, by touch. On Overlay a pinch sizes the logo instead.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#view`
- Source: `js/app/input.js` (`onPointerDown`, `startPinch`, `pinchView`, `onPointerMove`)
- Flag: to confirm. On Overlay the photo can't be zoomed or panned at all, and with no logo placed every touch and the wheel do nothing.
- Cases: none yet

## VIEW-05 A second finger turns a drag into a pinch

Putting a second finger down during a one-finger drag ends that drag, keeping what it did, and starts a pinch.

- Risk: medium
- Check: script, touch
- Layout: both, by touch
- Added: 1.10 baseline
- Changed: none
- Anchors: `#view`
- Source: `js/app/input.js` (`onPointerDown`, `startPinch`, `endGesture`)
- Ruling: R8. A second finger while a Levels pick is armed cancels that press without picking, and the pick stays armed. The app differs today.
- Cases: none yet

## VIEW-06 Extra and leftover fingers

A third finger is ignored. When one finger of a pinch lifts, the other does nothing until it lifts too.

- Risk: low
- Check: script, touch
- Layout: both, by touch
- Added: 1.10 baseline
- Changed: none
- Anchors: `#view`
- Source: `js/app/input.js` (`onPointerDown`, `onPointerMove`, `onPointerUp`)
- Cases: none yet

## VIEW-07 Wheel to zoom

The mouse wheel zooms about the cursor (faster with Ctrl held, which is what a trackpad pinch sends); the page itself does not scroll.

- Risk: medium
- Check: script
- Layout: both, in practice a wide screen. On Overlay the wheel sizes the logo instead.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#view`
- Source: `js/app/input.js` (`onWheel`); `js/app/view.js` (`zoomAt`); `js/app/main.js` (`bindCanvasInput`)
- Flag: to confirm. On Overlay the photo can't be zoomed or panned at all, and with no logo placed every touch and the wheel do nothing.
- Cases: none yet

## VIEW-08 Zoom limits

Zoom stops at 0.01 and at 64 screen pixels per photo pixel.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#view`
- Source: `js/app/view.js` (`zoomAt`); `js/app/input.js` (`pinchView`)
- Cases: none yet

## VIEW-09 Drag to pan

Dragging an empty part of the photo moves it.

- Risk: high
- Check: script, touch
- Layout: both. Not on Overlay.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#view`
- Source: `js/app/input.js` (`panGesture`, `onPointerMove`)
- Flag: to confirm. On Overlay the photo can't be zoomed or panned at all, and with no logo placed every touch and the wheel do nothing.
- Cases: none yet

## VIEW-10 Double tap to fit

A double tap or double click on an empty part of the photo fits it again: two quick taps (each under 300 ms) within 320 ms and 24 px of each other. It does nothing on Overlay, or while Tap to find card or a Levels pick is armed.

- Risk: medium
- Check: script, touch
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#view`, `#btnFindCard`
- Source: `js/app/input.js` (`onPointerUp`, `checkDoubleTap`); `js/app/view.js` (`fitCurrent`)
- Ruling: R10. On Levels, a press long enough to show the before-and-after compare never counts as a tap. The app differs today.
- Cases: none yet

## VIEW-11 Sharp when zoomed in on Perspective

Zoomed in further than the on-screen copy's resolution, Perspective draws the part in view from the full-resolution photo, so fine detail at the card's corners stays sharp.

- Risk: medium
- Check: eye
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.previewMaxPx`, `#view`
- Source: `js/app/view.js` (`drawSourceImage`, `drawPhotoRegion`)
- Cases: none yet

## VIEW-12 What shows under the photo

On the steps after Perspective, the area around the photo inside the frame is the export's fill color (from **Fill outside photo**), or a grey checkerboard when the fill is Transparent.

- Risk: low
- Check: eye
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.export.fill`, `#fill`, "Fill outside photo", "Transparent"
- Source: `js/app/view.js` (`drawResult`, `underlayStyle`, `drawTogether`)
- Cases: none yet

## VIEW-13 Cropped or whole

Levels, Overlay and Export show the photo cut to the crop; Rotate and Crop show the whole straightened frame.

- Risk: low
- Check: eye
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#view`
- Source: `js/app/view.js` (`drawResult`, `currentView`)
- Cases: none yet

## VIEW-14 Photo replaced by a message when the corners are wrong

While the corners cross or fold inward, every step after Perspective (and Perspective's **Preview**) shows "Fix the corners in Perspective first." in the photo area instead of the photo. A pair's joined preview on Export shows "Fix the corners of both sides in Perspective first."

- Risk: medium
- Check: eye
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: "Fix the corners in Perspective first.", "Fix the corners of both sides in Perspective first.", `#view`
- Source: `js/app/view.js` (`draw`, `drawTogether`, `drawMessage`)
- Flag: to confirm. With **Preview** on, the message tells the user to go to Perspective while they are already on it.
- Cases: none yet

## VIEW-15 The mouse pointer shows what a press would do

The mouse pointer is an open hand over the photo (closed while panning), a move pointer over a handle or inside the crop box, a resize arrow on a crop handle, and a crosshair while Tap to find card or a Levels pick is armed.

- Risk: low
- Check: script
- Layout: both, with a mouse only
- Added: 1.10 baseline
- Changed: none
- Anchors: `#view`, `#btnFindCard`
- Source: `js/app/input.js` (`hoverCursor`, `onPointerMove`, `onPointerUp`)
- Cases: none yet

## VIEW-16 No right-click menu; focus without a ring

A right click on the photo shows no menu. Pressing the photo gives it keyboard focus, without drawing a focus ring.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#view`, "Photo editing canvas", `.is-keyboard-focus`
- Source: `js/app/main.js` (`bindCanvasInput`); `js/app/input.js` (`onPointerDown`)
- Cases: none yet

## VIEW-17 The page never zooms or selects on iPhone

On iPhone a pinch on the photo never zooms the page itself, and a long press selects no text and shows no magnifier or callout, except in text fields.

- Risk: medium
- Check: phone, script
- Layout: phone. iPhone Safari.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#view`, `#app`
- Source: `js/app/main.js` (`bindCanvasInput`); `css/app.css` (the page's base rules)
- Cases: none yet

## VIEW-18 Sharp on a phone screen

The photo is drawn at the screen's pixel density (at most 3 device pixels per CSS pixel), so it is sharp on a phone.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#view`
- Source: `js/app/view.js` (`resizeCanvas`)
- Cases: none yet
