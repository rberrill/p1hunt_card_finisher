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
- Cases: 2

### VIEW-01.1 The photo opens fitted, with 24 px around it   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo just opened, on the Perspective step

The photo area is the space between the top bar and the controls.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the photo | It is as large as fits: 24 px from the photo area's left and right edges, and centered top to bottom |
| 2 | Tap **Rotate** in the step bar | The straightened photo is as large as fits, 24 px from the photo area's edges on its tighter side, and centered on the other |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### VIEW-01.2 Crop opened first leaves 36 px, and Rotate then keeps it   [auto: phone]
Flag: to confirm. Written to today's behavior: Rotate and Crop share one view, so the space around the photo depends on which of the two was opened first.

Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo just opened, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Crop** in the step bar | The photo is 36 px from the photo area's edges on its tighter side |
| 2 | Tap **Rotate** | The photo is still 36 px from the edges, not 24 |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## VIEW-02 Each step keeps its own zoom

Zoom and pan are kept separately for four views: Perspective's photo; the corrected photo (Rotate, Crop and Perspective's **Preview**); the cropped photo (Levels, Overlay and Export); and a pair's joined preview on Export.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#view`, `#btnFit`
- Source: `js/app/view.js` (`currentView`, `togetherView`, `viewKey`)
- Cases: 1

### VIEW-02.1 Perspective keeps its zoom; Rotate and Crop share theirs   [auto: phone]
Before you start:
- Device and browser: a phone-width window
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo just opened, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Spread two fingers apart on the photo | The photo zooms in |
| 2 | Tap **Rotate** in the step bar | Rotate's photo is fitted, not zoomed |
| 3 | Spread two fingers apart on the photo, further than in row 1 | The photo zooms in more than Perspective's did |
| 4 | Tap **Crop** | The photo is zoomed exactly as it was on Rotate |
| 5 | Tap **Perspective** | The photo is zoomed exactly as it was left in row 1 |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

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
- Cases: 3

### VIEW-03.1 A fitted photo refits when the window changes size; a zoomed one stays   [auto: desktop]
Before you start:
- Device and browser: a wide window, 1280 × 800 px, whose size you can set
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo just opened, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Make the window 1000 × 600 px | The photo is smaller, still as large as fits the smaller photo area |
| 2 | Roll the mouse wheel away from you over the photo | The photo zooms in |
| 3 | Make the window 1280 × 800 px again | The photo stays at the same zoom, not refitted |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### VIEW-03.2 A fitted photo refits after an edit; a zoomed one stays   [auto: phone]
Before you start:
- Device and browser: a phone-width window
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo just opened, on the Rotate step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **90° right** | The photo turns, and is as large as fits again, now lying on its side |
| 2 | Spread two fingers apart on the photo | The photo zooms in |
| 3 | Tap **90° right** | The photo turns; the zoom is the same as before the turn |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### VIEW-03.3 Levels' zoom is dropped when the step is opened again; Perspective's is kept   [auto: phone]
Flag: to confirm. Written to today's behavior: zoom on Levels, Overlay and Export is dropped each time one of them is opened, while Perspective's and Rotate and Crop's zoom is kept.

Before you start:
- Device and browser: a phone-width window
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo just opened, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Spread two fingers apart on the photo, then tap **Levels** in the step bar | Levels shows the cropped photo, fitted |
| 2 | Spread two fingers apart on the photo | It zooms in |
| 3 | Tap **Rotate**, then **Levels** | The cropped photo is fitted again: Levels' zoom was dropped |
| 4 | Tap **Perspective** | The photo is still zoomed as it was left in row 1 |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

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
- Cases: 2

### VIEW-04.1 Two fingers zoom the photo about the point between them   [auto: phone, webkit]
Before you start:
- Device and browser: a phone-width window
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo just opened, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Put two fingers 100 px apart, side by side, on the middle of the photo | Nothing changes yet |
| 2 | Spread them to 200 px apart, and lift both | The photo is twice as large; the part of the photo that was between the fingers is still between them |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### VIEW-04.2 On Overlay with no logo, two fingers do nothing   [auto: phone]
Flag: to confirm. Written to today's behavior: on Overlay the photo can't be zoomed or panned, and with no logo placed a touch does nothing.

Before you start:
- Device and browser: a phone-width window
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Overlay step, no logo added

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Spread two fingers from 100 px to 200 px apart on the middle of the photo | The photo does not zoom or move |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

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
- Cases: 2

### VIEW-05.1 A second finger ends a corner drag, keeping it, and zooms   [auto: phone, webkit]
Before you start:
- Device and browser: a phone-width window
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo just opened, on the Perspective step (**Undo** greyed out)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Put a finger on the top-left corner ring and drag it 30 px left, without lifting | The corner follows the finger |
| 2 | Put a second finger on the photo 100 px to the right of the first, and spread the two fingers 100 px further apart; lift both | The photo zooms in; the corner stayed where the first finger left it, 30 px left of where it started |
| 3 | Tap **Undo** | The corner is back where it started; **Undo** is greyed out: the drag was one undo step |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### VIEW-05.2 A second finger while a Levels pick is armed cancels the press   [auto: phone]
Written to ruling R8; it fails until that is built (BUG-101).

Before you start:
- Device and browser: a phone-width window
- Build: the build under test
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step, no levels set

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Pick white** | **Pick white** is selected |
| 2 | Put a finger on the white background, then a second finger 80 px to its right; lift the second, then the first | No white point is set; **Pick white** is still selected |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## VIEW-06 Extra and leftover fingers

A third finger is ignored. When one finger of a pinch lifts, the other does nothing until it lifts too.

- Risk: low
- Check: script, touch
- Layout: both, by touch
- Added: 1.10 baseline
- Changed: none
- Anchors: `#view`
- Source: `js/app/input.js` (`onPointerDown`, `onPointerMove`, `onPointerUp`)
- Cases: 2

### VIEW-06.1 A third finger is ignored   [auto: phone]
Before you start:
- Device and browser: a phone-width window
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo just opened, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Put two fingers on the photo, 100 px apart, and spread them to 160 px | The photo zooms in |
| 2 | Keeping both down, put a third finger on the photo and move it 80 px down | The photo does not change |
| 3 | Lift all three | The photo stays as it was after row 1 |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### VIEW-06.2 The finger left after a pinch does nothing until it lifts   [auto: phone]
Before you start:
- Device and browser: a phone-width window
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo just opened, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Put two fingers on the photo, 100 px apart, and spread them to 160 px | The photo zooms in |
| 2 | Lift one finger, and move the other 60 px to the right | The photo does not move |
| 3 | Lift it, then drag an empty part of the photo 60 px to the right with one finger | The photo moves 60 px to the right |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

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
- Cases: 2

### VIEW-07.1 The wheel zooms about the cursor, faster with Ctrl, and the page doesn't scroll   [auto: desktop]
Before you start:
- Device and browser: a wide window with a mouse wheel
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo just opened, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Put the pointer on the card's top-left corner and roll the wheel one notch away from you | The photo grows about 16%; the card's corner is still under the pointer; the page itself has not scrolled |
| 2 | Hold Ctrl and roll the wheel one notch away from you | The photo grows about 2.7 times: much faster than without Ctrl |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### VIEW-07.2 On Overlay with no logo, the wheel does nothing   [auto: desktop]
Flag: to confirm. Written to today's behavior: on Overlay the photo can't be zoomed or panned, and with no logo placed the wheel does nothing.

Before you start:
- Device and browser: a wide window with a mouse wheel
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Overlay step, no logo added

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Roll the wheel away from you over the photo | The photo does not zoom |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## VIEW-08 Zoom limits

Zoom stops at 0.01 and at 64 screen pixels per photo pixel.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#view`
- Source: `js/app/view.js` (`zoomAt`); `js/app/input.js` (`pinchView`)
- Cases: 1

### VIEW-08.1 Zoom stops at 64 times and at a hundredth   [auto: desktop]
Before you start:
- Device and browser: a wide window with a mouse wheel
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo just opened, on the Perspective step

The zoom is how many screen pixels one pixel of the photo covers.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Roll the wheel away from you, hard, several times | The photo stops growing when one of its pixels covers 64 × 64 screen pixels |
| 2 | Roll the wheel toward you, hard, several times | The photo stops shrinking when 100 of its pixels cover one screen pixel (a speck) |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

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
- Cases: 2

### VIEW-09.1 Dragging an empty part of the photo moves it   [auto: phone, webkit]
Before you start:
- Device and browser: a phone-width window
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo just opened, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Drag the photo's top-left area (away from every handle) 60 px right and 40 px down, and let go | The photo, outline and all, has moved 60 px right and 40 px down; the corners are on the same points of the card; **Fit to screen** shows in the top bar |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### VIEW-09.2 On Overlay with no logo, a drag does nothing   [auto: phone]
Flag: to confirm. Written to today's behavior: on Overlay the photo can't be zoomed or panned, and with no logo placed a touch does nothing.

Before you start:
- Device and browser: a phone-width window
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Overlay step, no logo added

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Drag the middle of the photo 60 px right and 40 px down, and let go | The photo does not move |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

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
- Cases: 5

### VIEW-10.1 A double tap fits the photo again   [auto: phone, webkit]
Before you start:
- Device and browser: a phone-width window
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo just opened, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Spread two fingers apart on the middle of the photo | The photo zooms in; **Fit to screen** shows |
| 2 | Tap twice quickly on the middle of the photo, away from every handle | The photo is back at its fitted size and place; **Fit to screen** has gone |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### VIEW-10.2 Two taps too slow or too far apart don't fit   [auto: phone]
Before you start:
- Device and browser: a phone-width window
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo just opened, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Spread two fingers apart on the middle of the photo | The photo zooms in |
| 2 | Tap the middle of the photo, wait half a second, and tap it again | The photo stays zoomed in |
| 3 | Tap the middle of the photo, then quickly tap 40 px to the right of it | The photo stays zoomed in |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### VIEW-10.3 A double tap does nothing while a Levels pick is armed   [auto: phone]
Before you start:
- Device and browser: a phone-width window
- Build: the build under test
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step, no levels set

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Spread two fingers apart around the white background left of the slab | The photo zooms in, the white background still in view |
| 2 | Tap **Pick white**, then tap twice quickly on the white background | A white point is set from the first tap; the photo stays zoomed in |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### VIEW-10.4 A double tap does nothing while Tap to find card is armed   [auto: phone]
Before you start:
- Device and browser: a phone-width window
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo just opened, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Spread two fingers apart on the middle of the photo | The photo zooms in |
| 2 | Open the options (the tab with an up arrow on the top edge of the controls) and tap **Tap to find card** | The line reads "Tap the card in the photo." |
| 3 | Tap twice quickly on the middle of the card | The card is searched for at the tap; the photo stays zoomed in |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### VIEW-10.5 A press that showed Levels' compare doesn't count toward a double tap   [auto: phone]
Written to ruling R10; it fails until that is built (BUG-103).

Before you start:
- Device and browser: a phone-width window
- Build: the build under test
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step, no levels set

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Auto**, then spread two fingers apart on the middle of the photo | The photo zooms in |
| 2 | Press the middle of the photo until the before-and-after compare shows (about a quarter of a second), lift, and at once tap the same place | The compare showed; the photo stays zoomed in |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## VIEW-11 Sharp when zoomed in on Perspective

Zoomed in further than the on-screen copy's resolution, Perspective draws the part in view from the full-resolution photo, so fine detail at the card's corners stays sharp.

- Risk: medium
- Check: eye
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.previewMaxPx`, `#view`
- Source: `js/app/view.js` (`drawSourceImage`, `drawPhotoRegion`)
- Cases: 1

### VIEW-11.1 Zoomed far in on Perspective, the card's corner is sharp, for a person to judge   [eye]
Before you start:
- Device and browser: a wide window, 1280 × 800 px, with a mouse wheel
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo just opened, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Put the pointer on the card's top-left corner and roll the wheel away from you until one pixel of the photo covers about 4 × 4 screen pixels | The card's corner and its printed edge are crisp, with single photo pixels visible as small squares, not a smooth blur |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## VIEW-12 What shows under the photo

On the steps after Perspective, the area around the photo inside the frame is the export's fill color (from **Fill outside photo**), or a grey checkerboard when the fill is Transparent.

- Risk: low
- Check: eye
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.export.fill`, `#fill`, "Fill outside photo", "Transparent"
- Source: `js/app/view.js` (`drawResult`, `underlayStyle`, `drawTogether`)
- Cases: 1

### VIEW-12.1 Around a tilted photo: the fill color, or a checkerboard, for a person to judge   [eye]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Rotate step, **Fill outside photo** at its starting White

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap the angle (**0.0°**), type 10 and tap **Done** | The photo is tilted 10°; the four triangles between its edges and the frame's are white |
| 2 | Tap **Export** in the step bar, open its options, set **Fill outside photo** to **Transparent**, close the options and tap **Rotate** | The four triangles show a grey checkerboard of two greys |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## VIEW-13 Cropped or whole

Levels, Overlay and Export show the photo cut to the crop; Rotate and Crop show the whole straightened frame.

- Risk: low
- Check: eye
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#view`
- Source: `js/app/view.js` (`drawResult`, `currentView`)
- Cases: 1

### VIEW-13.1 Rotate shows the whole frame; Levels shows only the crop, for a person to judge   [eye]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Rotate step, the crop at its starting 1:1

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the photo | The whole straightened photo, taller than wide, with the square crop drawn as a dashed box on it |
| 2 | Tap **Levels** in the step bar | Only the square inside the crop shows, filling the width of the photo area |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

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
- Cases: 3

### VIEW-14.1 With the corners crossed, the later steps show a message, for a person to judge   [eye]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Drag the top-left corner ring past the bottom-right one, and let go | The outline crosses itself |
| 2 | Tap **Rotate** in the step bar | No photo; in the middle of the photo area, in grey, "Fix the corners in Perspective first." |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### VIEW-14.2 Preview with the corners crossed sends you to Perspective, for a person to judge   [eye]
Flag: to confirm. Written to today's behavior: with **Preview** on, the message tells the user to go to Perspective while they are already on it.

Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Drag the top-left corner ring past the bottom-right one, and let go | The outline crosses itself |
| 2 | Tap **Preview** | No photo; in the middle of the photo area, in grey, "Fix the corners in Perspective first." |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### VIEW-14.3 A pair's joined preview with one side's corners crossed, for a person to judge   [eye]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: a pair: open the front, tap **Export**, tap **Add back** and choose the back. The back is open on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Drag the top-left corner ring past the bottom-right one, and let go | The outline crosses itself |
| 2 | Tap **Export** in the step bar, with **Together** chosen | No photo; in the middle of the photo area, in grey, "Fix the corners of both sides in Perspective first." |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## VIEW-15 The mouse pointer shows what a press would do

The mouse pointer is an open hand over the photo (closed while panning), a move pointer over a handle or inside the crop box, a resize arrow on a crop handle, and a crosshair while Tap to find card or a Levels pick is armed.

- Risk: low
- Check: script
- Layout: both, with a mouse only
- Added: 1.10 baseline
- Changed: none
- Anchors: `#view`, `#btnFindCard`
- Source: `js/app/input.js` (`hoverCursor`, `onPointerMove`, `onPointerUp`)
- Cases: 3

### VIEW-15.1 On Perspective the pointer is a hand, a move pointer on a handle, a crosshair to find the card   [auto: desktop]
Before you start:
- Device and browser: a wide window with a mouse
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo just opened, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Move the mouse over an empty part of the photo | The pointer is an open hand |
| 2 | Press the button there and move the mouse a little, holding the button | The hand is closed |
| 3 | Let go, and move the mouse onto the top-left corner ring | The pointer is the four-way move arrow |
| 4 | Click **Tap to find card** in the side panel, then move the mouse over the photo | The pointer is a crosshair |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### VIEW-15.2 On Crop the pointer moves the box inside it and resizes on a handle   [auto: desktop]
Before you start:
- Device and browser: a wide window with a mouse
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Crop step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Move the mouse into the middle of the crop box | The pointer is the four-way move arrow |
| 2 | Move it onto the crop box's top-left corner | The pointer is a diagonal resize arrow (top-left to bottom-right) |
| 3 | Move it onto the middle of the box's right side | The pointer is a left-right resize arrow |
| 4 | Move it outside the box, on the photo | The pointer is an open hand |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### VIEW-15.3 A crosshair while a Levels pick is armed   [auto: desktop]
Before you start:
- Device and browser: a wide window with a mouse
- Build: the build under test
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Move the mouse over the photo | The pointer is an open hand |
| 2 | Click **Pick white**, then move the mouse over the photo | The pointer is a crosshair |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## VIEW-16 No right-click menu; focus without a ring

A right click on the photo shows no menu. Pressing the photo gives it keyboard focus, without drawing a focus ring.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#view`, "Photo editing canvas", `.is-keyboard-focus`
- Source: `js/app/main.js` (`bindCanvasInput`); `js/app/input.js` (`onPointerDown`)
- Cases: 2

### VIEW-16.1 A right click on the photo opens no menu   [auto: desktop]
Before you start:
- Device and browser: a wide window with a mouse
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo just opened, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Right-click the photo | No menu opens (the browser's own menu is held back) |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### VIEW-16.2 Clicking the photo gives it the focus, with no focus ring   [auto: desktop, webkit]
Before you start:
- Device and browser: a wide window with a mouse and a keyboard
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo just opened, on the Rotate step

The focus is the control the keyboard acts on; a ring shows where it is when it came from the keyboard.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Press Tab a few times, so the focus ring shows on a control | A white ring is drawn around a control |
| 2 | Click the photo | The photo has the focus (its name, read by a screen reader, is "Photo editing canvas"); no ring is drawn around it |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## VIEW-17 The page never zooms or selects on iPhone

On iPhone a pinch on the photo never zooms the page itself, and a long press selects no text and shows no magnifier or callout, except in text fields.

- Risk: medium
- Check: phone, script
- Layout: phone. iPhone Safari.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#view`, `#app`
- Source: `js/app/main.js` (`bindCanvasInput`); `css/app.css` (the page's base rules)
- Cases: 2

### VIEW-17.1 On iPhone a pinch never zooms the page and a long press selects nothing   [phone]
Before you start:
- Device and browser: an iPhone, Safari
- Build: the build under test
- Photo: IMG_9136.JPEG from your photos (copied from samples/)
- Starting screen: the photo open, on the Rotate step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Pinch on the photo, spreading two fingers apart | The photo zooms; the page itself (the top bar, the controls) stays the same size |
| 2 | Pinch on the top bar | The page doesn't zoom |
| 3 | Press and hold the photo for two seconds | No text is selected; no magnifier and no menu (Copy, Look Up) appears |
| 4 | Press and hold the word STRAIGHTEN for two seconds | No text is selected; no magnifier and no menu appears |
| 5 | Tap the angle (**0.0°**), then press and hold in the text box | The text box's own magnifier or menu appears, as in any text field |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screen recording.

### VIEW-17.2 The page cancels the pinch zoom and text selection, but not in a text box   [auto: phone, webkit]
Before you start:
- Device and browser: a phone-width window (a script sends the browser's events)
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Rotate step

This checks the page's side of VIEW-17.1; how Safari draws it is checked there.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Send the page a pinch-zoom start (Safari's gesture start) | The page cancels it |
| 2 | Send a text selection start on the word STRAIGHTEN | The page cancels it |
| 3 | Tap the angle (**0.0°**) and send a text selection start in the text box | The page lets it go ahead |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## VIEW-18 Sharp on a phone screen

The photo is drawn at the screen's pixel density (at most 3 device pixels per CSS pixel), so it is sharp on a phone.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#view`
- Source: `js/app/view.js` (`resizeCanvas`)
- Cases: 2

### VIEW-18.1 The photo is drawn at the screen's pixel density   [auto: phone, webkit]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, at an iPhone's density (3 device pixels per CSS pixel)
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Measure the photo area and the picture drawn in it (a script reads the drawing's size) | The photo area is 390 × 544 CSS px; the drawing is 1170 × 1632 pixels: three to each CSS pixel |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### VIEW-18.2 On a denser screen the drawing stops at 3 pixels per CSS pixel   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, at 4 device pixels per CSS pixel
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Measure the photo area and the drawing in it | The photo area is 390 × 544 CSS px; the drawing is 1170 × 1632 pixels: three to each CSS pixel, not four |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.
