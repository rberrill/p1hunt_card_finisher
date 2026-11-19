# Photo view

How the photo sits on screen: fitting, zooming and panning with fingers, the mouse and the wheel, what is drawn under and around the photo, and how sharp it is.

## VIEW-01 The photo starts fitted

Each view of the photo starts fitted to the photo area, with 24 px of space around it (36 px on Crop). Rotate and Crop each fit the straightened photo their own way, whichever was opened first, and so does **Fit to screen** on Crop after a zoom kept from Rotate.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: 1.10.0
- Anchors: `#view`, `#btnFit`
- Source: `js/app/view.js` (`fitView`, `currentView`, `fitCurrent`)
- Ruling: R90. Each step fits its own way, whatever came before. The app does this since 1.10.0.
- Cases: 4

### VIEW-01.1 The photo opens fitted, with 24 px around it   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo just opened, on the Perspective step

The photo area is the space between the top bar and the controls (the block of buttons and sliders under the photo).

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the photo | It is as large as fits: 24 px from the photo area's left and right edges, and centered top to bottom |
| 2 | Tap **Rotate** in the step tabs (the six tabs Perspective to Export, along the bottom) | The straightened photo is as large as fits, 24 px from the photo area's edges on its tighter side, and centered on the other |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### VIEW-01.2 Crop opened first leaves 36 px, and Rotate then fits its own 24 px   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo just opened, on the Perspective step

The photo area is the space between the top bar and the controls (the block of buttons and sliders under the photo).

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Crop** in the step tabs (the six tabs Perspective to Export, along the bottom) | The photo is 36 px from the photo area's edges on its tighter side |
| 2 | Tap **Rotate** in the step tabs | The straightened photo is 24 px from the edges on its tighter side, and centered on the other |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### VIEW-01.3 Rotate opened first leaves 24 px, and Crop then fits its own 36 px   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo just opened, on the Perspective step

The photo area is the space between the top bar and the controls (the block of buttons and sliders under the photo).

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Rotate** in the step tabs (the six tabs Perspective to Export, along the bottom) | The straightened photo is 24 px from the photo area's edges on its tighter side |
| 2 | Tap **Crop** in the step tabs | The photo is 36 px from the edges on its tighter side, and centered on the other |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### VIEW-01.4 After a zoom kept from Rotate, Fit to screen on Crop leaves 36 px, and Rotate then fits its own 24 px   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo just opened, on the Perspective step

The photo area is the space between the top bar and the controls (the block of buttons and sliders under the photo).

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Rotate** in the step tabs (the six tabs Perspective to Export, along the bottom) | The straightened photo is 24 px from the photo area's edges on its tighter side |
| 2 | Put two fingers on the middle of the photo, 100 px apart side by side, spread them to 200 px apart and lift them | The photo zooms in to twice its fitted size; **Fit to screen** (four corner brackets) shows in the top bar |
| 3 | Tap **Crop** in the step tabs | The photo is zoomed exactly as it was on Rotate; **Fit to screen** still shows |
| 4 | Tap **Fit to screen** | The photo is 36 px from the edges on its tighter side, and centered on the other; **Fit to screen** has gone |
| 5 | Tap **Rotate** in the step tabs | The straightened photo is 24 px from the edges on its tighter side, and centered on the other |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## VIEW-02 Each step keeps its own zoom

Zoom and pan are kept separately for four views: Perspective's photo; the corrected photo (Rotate, Crop and Perspective's **Preview**); the cropped photo (Levels, Overlay and Export); and a pair's joined preview on Export, which is fitted again each time **Together** is chosen.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#view`, `#btnFit`
- Source: `js/app/view.js` (`currentView`, `togetherView`, `viewKey`); `js/app/pair.js` (`setPairOutput`)
- Ruling: R53. A pair's joined preview is fitted again when **Together** or **Separately** is chosen: the picture changes shape. The app already does this.
- Cases: 2

### VIEW-02.1 Perspective keeps its zoom; Rotate and Crop share theirs   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo just opened, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Put two fingers on the middle of the photo, 100 px apart side by side, spread them to 200 px apart and lift them | The photo zooms in to twice its fitted size |
| 2 | Tap **Rotate** in the step tabs (the six tabs Perspective to Export, along the bottom) | Rotate's photo is fitted, not zoomed |
| 3 | Put two fingers on the middle of the photo, 100 px apart side by side, spread them to 300 px apart and lift them | The photo zooms in to three times its fitted size, more than Perspective's did |
| 4 | Tap **Crop** in the step tabs | The photo is zoomed exactly as it was on Rotate |
| 5 | Tap **Perspective** in the step tabs | The photo is zoomed exactly as it was left in row 1 |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### VIEW-02.2 A pair's joined preview is fitted again each time Together is chosen   [auto: phone]

Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: a pair: open the front, tap **Export**, tap **Add back** and choose the back. The back is open on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Export** in the step tabs (the six tabs Perspective to Export, along the bottom) | The two cards show side by side, fitted, with **Together** chosen beside the size line (the line that gives the saved picture's size in px and its format) |
| 2 | Put two fingers on the middle of the photo, 100 px apart side by side, spread them to 200 px apart and lift them | The joined picture of both cards zooms in |
| 3 | Tap **Separately** | Only the back shows, fitted, not zoomed |
| 4 | Tap **Together** | The two cards show side by side again, fitted: the zoom from row 2 is gone |

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
- Ruling: R91. Zoom is kept on Perspective and on Rotate and Crop, and dropped on Levels, Overlay and Export. The app already does this.
- Cases: 3

### VIEW-03.1 A fitted photo refits when the window changes size; a zoomed one stays   [auto: desktop]
Before you start:
- Device and browser: a wide window, 1280 × 800 px, whose size you can set, with a mouse wheel
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo just opened, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Make the window 1000 × 600 px | The photo is smaller, still as large as fits the smaller photo area |
| 2 | Put the pointer on the middle of the photo and roll the wheel four notches away from you | The photo zooms in |
| 3 | Make the window 1280 × 800 px again | The photo stays at the same zoom, not refitted |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### VIEW-03.2 A fitted photo refits after an edit; a zoomed one stays   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo just opened, on the Rotate step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **90° right** | The photo turns, and is as large as fits again, now lying on its side |
| 2 | Put two fingers on the middle of the photo, 100 px apart side by side, spread them to 200 px apart and lift them | The photo zooms in |
| 3 | Tap **90° right** | The photo turns; the zoom is the same as before the turn |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### VIEW-03.3 Levels' zoom is dropped when the step is opened again; Perspective's is kept   [auto: phone]

Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo just opened, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Put two fingers on the middle of the photo, 100 px apart side by side, spread them to 200 px apart and lift them | The photo zooms in |
| 2 | Tap **Levels** in the step tabs (the six tabs Perspective to Export, along the bottom) | Levels shows the cropped photo, fitted |
| 3 | Put two fingers on the middle of the photo, 100 px apart side by side, spread them to 200 px apart and lift them | It zooms in |
| 4 | Tap **Rotate** in the step tabs | The straightened photo shows, with STRAIGHTEN in the line above the controls (the one line of text at the top of the block of buttons and sliders under the photo) |
| 5 | Tap **Levels** in the step tabs | The cropped photo is fitted again: Levels' zoom was dropped |
| 6 | Tap **Perspective** in the step tabs | The photo is still zoomed as it was left in row 1 |

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
- Ruling: R84. On Overlay the photo is locked: with no logo placed, every touch and the wheel do nothing. The app already does this.
- Cases: 2

### VIEW-04.1 Two fingers zoom the photo about the point between them   [auto: phone, webkit]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo just opened, on the Perspective step, fitted

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Put two fingers on the middle of the photo, 100 px apart side by side, spread them to 200 px apart and lift them | The photo is twice as large; the part of the photo that was midway between the fingers is still in the middle of the photo area, where they were |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### VIEW-04.2 On Overlay with no logo, two fingers do nothing   [auto: phone]

Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Overlay step, no logo added

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Put two fingers on the middle of the photo, 100 px apart side by side, spread them to 200 px apart and lift them | The photo does not zoom or move |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## VIEW-05 A second finger turns a drag into a pinch

Putting a second finger down during a one-finger drag ends that drag, keeping what it did, and starts a pinch. A press that aims an armed Levels pick is cancelled instead: no color is taken, and the pick stays armed.

- Risk: medium
- Check: script, touch
- Layout: both, by touch
- Added: 1.10 baseline
- Changed: 1.10.0
- Anchors: `#view`
- Source: `js/app/input.js` (`onPointerDown`, `startPinch`, `endGesture`)
- Ruling: R8. A second finger while a Levels pick is armed cancels that press without picking, and the pick stays armed. The app does this since 1.10.0.
- Cases: 2

### VIEW-05.1 A second finger ends a corner drag, keeping it, and zooms   [auto: phone, webkit]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo just opened, on the Perspective step (**Undo**, the arrow curving left near the right end of the top bar, greyed out)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Put a finger on the top-left corner ring and drag it 30 px left, without lifting | The corner follows the finger |
| 2 | Keeping it there, put a second finger on the photo 100 px to the right of the first | The photo does not move or change size; the corner stays where the first finger left it |
| 3 | Move the two fingers apart, each 50 px outward | The photo zooms in |
| 4 | Lift both fingers | The corner is where the first finger left it in row 1: 30 px left of where it started, at the size the photo had then |
| 5 | Tap **Undo** | The corner is back where it started; **Undo** is greyed out: the drag was one undo step |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### VIEW-05.2 A second finger while a Levels pick is armed cancels the press   [auto: phone]

Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step, no levels set

The color patch is the small square beside **Pick white** that shows the color picked; it is dashed and empty until a white point is set.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Pick white** | **Pick white** is selected |
| 2 | Put a finger on the white background left of the slab, halfway down, and hold it there | The color patch is still dashed and empty |
| 3 | Keeping it there, put a second finger on the photo 80 px to the right of the first | The color patch is still dashed and empty; **Pick white** is still selected |
| 4 | Lift the second finger | The color patch is still dashed and empty; **Pick white** is still selected |
| 5 | Lift the first finger | The color patch is still dashed and empty; **Pick white** is still selected |

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
- Device and browser: a phone-width window, 390 × 844 px, with touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo just opened, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Put two fingers on the middle of the photo, 100 px apart side by side, and spread them to 160 px apart, without lifting | The photo zooms in |
| 2 | Keeping both down, put a third finger on the photo 100 px below the middle | The photo does not change |
| 3 | Move the third finger 80 px down | The photo does not change |
| 4 | Lift all three fingers | The photo stays as it was after row 1 |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### VIEW-06.2 The finger left after a pinch does nothing until it lifts   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo just opened, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Put two fingers on the middle of the photo, 100 px apart side by side, and spread them to 160 px apart, without lifting | The photo zooms in |
| 2 | Lift the right-hand finger | The photo stays as it is |
| 3 | Move the finger still down 60 px to the right | The photo does not move |
| 4 | Lift that finger | The photo stays as it is |
| 5 | With one finger, drag the photo's top-left area (40 px in from the photo area's left edge and 60 px down from its top) 60 px to the right, and let go | The photo moves 60 px to the right |

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
- Ruling: R84. On Overlay the photo is locked: with no logo placed, every touch and the wheel do nothing. The app already does this.
- Cases: 2

### VIEW-07.1 The wheel zooms about the cursor, faster with Ctrl, and the page doesn't scroll   [auto: desktop]
Before you start:
- Device and browser: a wide window, 1280 × 800 px, with a mouse wheel
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo just opened, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Put the pointer on the card's top-left corner and roll the wheel one notch away from you | The photo grows about 16%; the card's corner is still under the pointer; the page itself has not scrolled |
| 2 | Hold Ctrl and roll the wheel one notch away from you | The photo grows about 2.7 times: much faster than without Ctrl |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### VIEW-07.2 On Overlay with no logo, the wheel does nothing   [auto: desktop]

Before you start:
- Device and browser: a wide window, 1280 × 800 px, with a mouse wheel
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Overlay step, no logo added

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Put the pointer on the middle of the photo and roll the wheel one notch away from you | The photo does not zoom |

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
Script only
Stand-in: the script reads the zoom (how many screen pixels one pixel of the photo covers) from the app after each roll. On screen a person sees the photo stop growing or shrinking, but can't measure where it stops: the photo is drawn smoothed, so its pixels never show as squares to count.

Before you start:
- Device and browser: a wide window, 1280 × 800 px, with a mouse wheel
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo just opened, on the Perspective step, fitted (one photo pixel covers about a third of a screen pixel)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Put the pointer on the middle of the photo and roll the wheel 40 notches away from you | The zoom is 64: one photo pixel covers 64 × 64 screen pixels |
| 2 | Roll the wheel one more notch away from you | The zoom is still 64: the photo does not grow |
| 3 | Roll the wheel 70 notches toward you | The zoom is 0.01: 100 × 100 photo pixels share one screen pixel, and the photo is a speck |
| 4 | Roll the wheel one more notch toward you | The zoom is still 0.01: the photo does not shrink |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## VIEW-09 Drag to pan

Dragging an empty part of the photo moves it. A press that moves 4 px or less is not a drag: it leaves the photo exactly as it was, still fitted if it was fitted. Past 4 px the photo follows the finger from where it was pressed. The cases prove a 60 px drag, a tap that wobbles by 2 px and a drag that starts with a 2 px move.

- Risk: high
- Check: script, touch
- Layout: both. Not on Overlay.
- Added: 1.10 baseline
- Changed: 1.10.0
- Anchors: `#view`
- Source: `js/app/input.js` (`panGesture`, `onPointerMove`, `DRAG_THRESHOLD_PX`)
- Ruling: R84. On Overlay the photo is locked: with no logo placed, every touch and the wheel do nothing. The app already does this.
- Cases: 3

### VIEW-09.1 Dragging an empty part of the photo moves it   [auto: phone, webkit]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo just opened, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Drag the photo's top-left area (40 px in from the photo area's left edge and 60 px down from its top, away from every handle) 60 px right and 40 px down, and let go | The photo, outline and all, has moved 60 px right and 40 px down, at the same size; the corners are on the same points of the card; **Fit to screen** (four corner brackets) shows in the top bar |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### VIEW-09.2 On Overlay with no logo, a drag does nothing   [auto: phone]

Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Overlay step, no logo added

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Drag the middle of the photo 60 px right and 40 px down, and let go | The photo does not move |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### VIEW-09.3 A tap that wobbles by 2 px moves nothing; a drag that goes on past 4 px moves the photo   [auto: phone]
Script only
Stand-in: the script puts a dispatched finger down and moves it exactly 2 px. No person can hold a finger's wobble to 2 px.

Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo just opened, on the Perspective step

The photo area is the space between the top bar and the controls (the block of buttons and sliders under the photo). The crop box is the outlined square on the photo on the Crop step, with a handle on each corner and the middle of each side.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Crop** in the step tabs (the six tabs Perspective to Export, along the bottom) | The photo is 36 px from the photo area's edges on its tighter side; **Fit to screen** (four corner brackets) is not in the top bar |
| 2 | Put one finger on the photo area's top-left (40 px in from its left edge and 60 px down from its top, above the crop box and away from its handles), slide it 2 px right and lift it | The photo has not moved or changed size; **Fit to screen** is still not in the top bar |
| 3 | Tap **Rotate** in the step tabs | The straightened photo is 24 px from the edges on its tighter side, and centered on the other |
| 4 | Tap **Crop** in the step tabs | The photo is 36 px from the edges on its tighter side, and centered on the other |
| 5 | Put one finger on the same place, slide it 2 px right and keep it down | The photo has not moved or changed size; **Fit to screen** is still not in the top bar |
| 6 | Slide the finger on, to 30 px right and 20 px down of where it went down, and lift it | The photo has moved 30 px right and 20 px down, at the same size; **Fit to screen** shows in the top bar |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## VIEW-10 Double tap to fit

A double tap or double click on an empty part of the photo fits it again: two quick taps (each under 300 ms) within 320 ms and 24 px of each other. It does nothing on Overlay (where a gesture moves the logo), or while Tap to find card or a Levels pick is armed. On Levels, a press that showed the comparison is not a tap, however short it was.

- Risk: medium
- Check: script, touch, phone (the [phone] case: on a real iPhone, Safari leaves the double tap to the app)
- Layout: both
- Added: 1.10 baseline
- Changed: 1.10.0
- Anchors: `#view`, `#btnFindCard`
- Source: `js/app/input.js` (`onPointerUp`, `checkDoubleTap`); `js/app/view.js` (`fitCurrent`)
- Ruling: R10. On Levels, a press that showed the before-and-after compare is never a tap. The app does this since 1.10.0.
- Cases: 7

### VIEW-10.1 A double tap fits the photo again   [auto: phone, webkit]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo just opened, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Put two fingers on the middle of the photo, 100 px apart side by side, spread them to 200 px apart and lift them | The photo zooms in; **Fit to screen** (four corner brackets) shows in the top bar |
| 2 | Tap twice quickly on the middle of the photo, away from every handle | The photo is back at its fitted size and place; **Fit to screen** has gone |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### VIEW-10.2 Two taps too slow or too far apart don't fit   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo just opened, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Put two fingers on the middle of the photo, 100 px apart side by side, spread them to 200 px apart and lift them | The photo zooms in |
| 2 | Tap the middle of the photo once | The photo stays zoomed in |
| 3 | Half a second later, tap the same place again | The photo stays zoomed in: two taps half a second apart are not a double tap |
| 4 | Half a second later, tap the middle of the photo again | The photo stays zoomed in |
| 5 | Straight away, tap 40 px to the right of it | The photo stays zoomed in: two quick taps 40 px apart are not a double tap |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### VIEW-10.3 A double tap does nothing while a Levels pick is armed   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step, no levels set

The color patch is the small square beside **Pick white** that shows the color picked; it is dashed and empty until a white point is set.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Put two fingers on the white background left of the slab, halfway down, 100 px apart side by side, spread them to 200 px apart and lift them | The photo zooms in; the white background is still in the photo area |
| 2 | Tap **Pick white** | **Pick white** is selected |
| 3 | Tap twice quickly on the white background left of the slab, halfway down | The color patch fills with the background's off-white (red, green and blue each within 3 of 225, 226, 217); the photo stays zoomed in |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### VIEW-10.4 A double tap does nothing while Tap to find card is armed   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo just opened, on the Perspective step

The controls are the block of buttons and sliders under the photo; the line above the controls is the one line of text at their top. The options tab is the small tab with an up arrow on the top edge of the controls; it has no words on it.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Put two fingers on the middle of the photo, 100 px apart side by side, spread them to 200 px apart and lift them | The photo zooms in |
| 2 | Tap the options tab | PERSPECTIVE OPTIONS rise over the photo, with **Tap to find card** among them |
| 3 | Tap **Tap to find card** | The options close; the line above the controls reads "Tap the card in the photo." |
| 4 | Tap twice quickly on the middle of the card | The card is found: the line above the controls reads **Nudge** Corner 1 of 4 again, with "Confidence" and a percentage at its right; the photo stays zoomed in |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### VIEW-10.5 A press that showed Levels' compare doesn't count toward a double tap   [auto: phone]
Script only
Stand-in: the script presses with a dispatched finger, lifts it the moment the comparison shows (under 0.3 s in all) and taps again at once. No person can time a press between 0.25 and 0.3 s.

Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step, no levels set

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Auto** | A white dot shows on the **Levels** tab in the step tabs (the six tabs Perspective to Export, along the bottom) |
| 2 | Put two fingers on the middle of the photo, 100 px apart side by side, spread them to 200 px apart and lift them | The photo zooms in |
| 3 | Press the middle of the photo until the comparison shows, and lift at once (under 0.3 seconds in all) | The comparison started, and the press lasted under 0.3 seconds in all |
| 4 | Straight away, tap the same place once | The photo stays zoomed in: the press and the tap were not a double tap |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### VIEW-10.6 On Overlay a double tap moves nothing and adds no undo step   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Logo: blue-disc.png from tests/fixtures/ (a blue disc on a see-through square)
- Starting screen: the photo open, on the Overlay step, blue-disc.png added with **Add logo** (in the middle of the photo)

The rings are the nine small circles drawn on the photo on this step, where a tap snaps the logo.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap twice quickly on the photo a quarter of the way in from its left edge and a quarter of the way up from its bottom, away from the logo and the rings | The logo stays where it was, at the same size; the photo does not move or change size |
| 2 | Tap **Undo** (the arrow curving left, near the right end of the top bar) | The logo goes, and **Undo** is greyed out: adding the logo was the only undo step, and the double tap added none |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### VIEW-10.7 On an iPhone, a double tap fits the photo and Safari doesn't zoom the page   [phone]
Before you start:
- Device and browser: an iPhone, Safari
- Build: the UAT site, https://rberrill.github.io/p1hunt_card_finisher_uat/
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/ (AirDrop it to the phone or save it to Photos first)
- Starting screen: the photo open, on the Perspective step, the whole photo fitting the photo area

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Put two fingers on the middle of the photo and spread them apart | The photo zooms in; **Fit to screen** (four corner brackets) shows in the top bar |
| 2 | Double tap the middle of the photo, away from every handle, quickly with one finger | The photo is back at its fitted size and place; **Fit to screen** has gone; the top bar, the controls (the block of buttons and sliders under the photo) and the step tabs (the six tabs Perspective to Export, along the bottom) stay their usual size: Safari has not zoomed the page |
| 3 | Double tap the middle of the photo again | The photo stays fitted, and the page stays its usual size |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screen recording.

## VIEW-11 Sharp when zoomed in on Perspective

Zoomed in further than the on-screen copy's resolution, Perspective draws the part in view from the full-resolution photo, so fine detail at the card's corners stays sharp.

- Risk: medium
- Check: eye, script (a script checks that the part in view is drawn from the full-resolution photo)
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.previewMaxPx`, `#view`
- Source: `js/app/view.js` (`drawSourceImage`, `drawPhotoRegion`)
- Cases: 1

### VIEW-11.1 Zoomed far in on Perspective, the card's corner is sharp, for a person to judge   [eye]
Before you start:
- Device and browser: a wide window, 1280 × 800 px, with a mouse wheel
- Build: the build under test, opened with `?previewMaxPx=512` at the end of its address. The app then keeps its on-screen copy of the photo at 512 px on its long side, a quarter of this photo's 2048 px; at the usual setting the copy is as large as this photo, and the two drawings can't be told apart
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo just opened, on the Perspective step, fitted

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Put the pointer on the card's top-left corner and roll the wheel 16 notches away from you | The photo is about 11 times the size it had when it fitted, and the card's corner is still under the pointer. One photo pixel now covers about 4 × 4 screen pixels; one pixel of the on-screen copy would cover about 15 × 15 |
| 2 | Look at the card's corner and its printed edge, around the pointer | They are crisp: each edge goes from dark to light within about 4 screen pixels, not a soft blur about 15 screen pixels wide. A script also checks that this part is drawn from the full-resolution photo, not from the copy |

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
- Device and browser: a phone-width window, 390 × 844 px, with touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Rotate step, **Fill outside photo** at its starting White

The controls are the block of buttons and sliders under the photo; the line above the controls is the one line of text at their top. The options tab is the small tab with an up arrow on the top edge of the controls; it has no words on it.

Type the angle 10: tap the angle (**0.0°**, at the right of the line above the controls), type 10 in the text box that takes its place, and tap **Done**.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Type the angle 10 | The photo is tilted 10°; the four triangles between its edges and the frame's are white |
| 2 | Tap **Export** in the step tabs (the six tabs Perspective to Export, along the bottom) | Export's controls show, with **Download** |
| 3 | Tap the options tab | EXPORT OPTIONS rise over the photo; **Fill outside photo** reads White |
| 4 | Choose **Transparent** for **Fill outside photo** | **Fill outside photo** reads Transparent |
| 5 | Tap **Close** (the cross at the top right of the options) | The options close |
| 6 | Tap **Rotate** in the step tabs | The four triangles show a grey checkerboard of two greys |

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
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Rotate step, the crop at its starting 1:1

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the photo | The whole straightened photo, taller than wide, with the square crop drawn as a dashed box on it |
| 2 | Tap **Levels** in the step tabs (the six tabs Perspective to Export, along the bottom) | Only the square inside the crop shows, filling the width of the photo area |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## VIEW-14 Photo replaced by a message when the corners are wrong

While the corners cross or fold inward, every step after Perspective shows "Fix the corners in Perspective first." in the photo area instead of the photo, and Perspective's **Preview** shows "Fix the corners first." With a pair open, Export names the side to fix instead: "Fix the back’s corners in Perspective first." (MSG-82 has the front's words, the words for both sides, and Separately.)

- Risk: medium
- Check: eye
- Layout: both
- Added: 1.10 baseline
- Changed: 1.10.0
- Anchors: "Fix the corners in Perspective first.", "Fix the corners first.", "’s corners in Perspective first.", `#view`
- Source: `js/app/view.js` (`draw`, `fixCornersWords`, `drawTogether`, `drawMessage`); `js/app/pair.js` (`pairFixWords`)
- Ruling: R82. On Perspective itself the words read "Fix the corners first." (approved wording, tests/catalog/wording.md); elsewhere they stay "Fix the corners in Perspective first." The app does this since 1.10.0. R98. The photo area names the side too, "Fix the back’s corners in Perspective first." (or the front’s); "Fix the corners of both sides in Perspective first." only when both sides' corners are invalid. With a pair open on Export, the line under the photo names the side to fix in the same words whichever side is open ("Fix the back’s corners in Perspective first.", the front’s, or "Fix the corners of both sides in Perspective first."), so the photo area and the line always say the same (wording approved by Rich, tests/catalog/wording.md). The app does this since 1.10.0.
- Cases: 3

### VIEW-14.1 With the corners crossed, the later steps show a message, for a person to judge   [eye]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Drag the top-left corner ring past the bottom-right one, and let go | The outline crosses itself |
| 2 | Tap **Rotate** in the step tabs (the six tabs Perspective to Export, along the bottom) | No photo; in the middle of the photo area, in grey, "Fix the corners in Perspective first." |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### VIEW-14.2 Preview with the corners crossed asks to fix them, for a person to judge   [eye]

Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Drag the top-left corner ring past the bottom-right one, and let go | The outline crosses itself |
| 2 | Tap **Preview** | No photo; in the middle of the photo area, in grey, "Fix the corners first." |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### VIEW-14.3 A pair's joined preview with one side's corners crossed, for a person to judge   [eye]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: a pair: open the front, tap **Export**, tap **Add back** and choose the back. The back is open on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Drag the top-left corner ring past the bottom-right one, and let go | The outline crosses itself |
| 2 | Tap **Export** in the step tabs (the six tabs Perspective to Export, along the bottom) | **Together** is chosen; no photo; in the middle of the photo area, in grey, "Fix the back’s corners in Perspective first." |

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
- Device and browser: a wide window, 1280 × 800 px, with a mouse
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo just opened, on the Perspective step

The line above the controls is the one line of text at the top of the panel at the right.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Move the mouse over an empty part of the photo, away from every handle | The pointer is an open hand |
| 2 | Press the button there and, holding it, move the mouse 10 px right and 10 px down | The hand is closed |
| 3 | Let go of the button | The pointer is an open hand again |
| 4 | Move the mouse onto the top-left corner ring | The pointer is the four-way move arrow |
| 5 | Click **Tap to find card** in the panel at the right | The line above the controls reads "Tap the card in the photo." |
| 6 | Move the mouse onto the middle of the photo | The pointer is a crosshair |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### VIEW-15.2 On Crop the pointer moves the box inside it and resizes on a handle   [auto: desktop]
Before you start:
- Device and browser: a wide window, 1280 × 800 px, with a mouse
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Crop step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Move the mouse into the middle of the crop box | The pointer is the four-way move arrow |
| 2 | Move it onto the crop box's top-left corner | The pointer is a diagonal resize arrow (top-left to bottom-right) |
| 3 | Move it onto the middle of the box's right side | The pointer is a left-right resize arrow |
| 4 | Move it 40 px above the middle of the box's top side, on the photo | The pointer is an open hand |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### VIEW-15.3 A crosshair while a Levels pick is armed   [auto: desktop]
Before you start:
- Device and browser: a wide window, 1280 × 800 px, with a mouse
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Move the mouse onto the middle of the photo | The pointer is an open hand |
| 2 | Click **Pick white** | **Pick white** is selected |
| 3 | Move the mouse back over the photo, 5 px right and 5 px down of its middle | The pointer is a crosshair |

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
- Device and browser: a wide window, 1280 × 800 px, with a mouse
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo just opened, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Right-click the middle of the photo | No menu opens (the browser's own menu is held back) |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### VIEW-16.2 Clicking the photo gives it the focus, with no focus ring   [auto: desktop, webkit]
Before you start:
- Device and browser: a wide window, 1280 × 800 px, with a mouse and a keyboard
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo just opened, then **Rotate** clicked in the top bar

The focus is the control the keyboard acts on; a ring shows where it is when it came from the keyboard.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Press Tab three times | A white ring, 2 px wide, is drawn around a control |
| 2 | Click an empty part of the photo (its top-left area, away from the card) | The photo has the focus (its name, read by a screen reader, is "Photo editing canvas"); no ring is drawn around it |

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
- Build: the UAT site, https://rberrill.github.io/p1hunt_card_finisher_uat/
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/ (AirDrop it to the phone or save it to Photos first)
- Starting screen: the photo open, on the Rotate step

The controls are the block of buttons and sliders under the photo; the line above the controls is the one line of text at their top.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Put two fingers on the photo and spread them apart | The photo zooms; the page itself (the top bar, the controls) stays the same size |
| 2 | Put two fingers on the top bar and spread them apart | The page doesn't zoom |
| 3 | Press and hold the photo for two seconds | No text is selected; no magnifier and no menu (Copy, Look Up) appears |
| 4 | Press and hold the word STRAIGHTEN, in the line above the controls, for two seconds | No text is selected; no magnifier and no menu appears |
| 5 | Tap the angle (**0.0°**, at the right of the line above the controls) | A text box takes its place, and the keyboard rises |
| 6 | Press and hold in the text box for two seconds | Safari's own text tools for a text box appear (a magnifier over the text, a menu with Paste, or both), as in any text field |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screen recording.

### VIEW-17.2 The page cancels the pinch zoom and text selection, but not in a text box   [auto: phone, webkit]
Script only
Stand-in: the script sends the page the events Safari sends when a pinch zoom or a text selection starts, and reads whether the page cancels them. On a computer no finger or mouse makes a browser send Safari's pinch event, and nothing on screen shows whether an event was cancelled; on a real iPhone this is VIEW-17.1.

Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Rotate step

The line above the controls is the one line of text at the top of the block of buttons and sliders under the photo.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Send the photo a pinch-zoom start (Safari's gesture start) | The page cancels it |
| 2 | Send a text selection start on the word STRAIGHTEN, in the line above the controls | The page cancels it |
| 3 | Tap the angle (**0.0°**, at the right of the line above the controls) | A text box takes its place |
| 4 | Send a text selection start in the text box | The page lets it go ahead |

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
Script only
Stand-in: the script reads the size, in device pixels, of the drawing behind the photo area. Nothing on screen shows how many pixels the drawing has.

Before you start:
- Device and browser: a phone-width window, 390 × 844 px, at an iPhone's density (3 device pixels per CSS pixel)
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Measure the photo area and the drawing in it | The photo area is 390 × 544 CSS px; the drawing is 1170 × 1632 pixels: three to each CSS pixel |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### VIEW-18.2 On a denser screen the drawing stops at 3 pixels per CSS pixel   [auto: phone]
Script only
Stand-in: the script makes the browser report 4 device pixels per CSS pixel, a density no iPhone has, and reads the size, in device pixels, of the drawing behind the photo area. Nothing on screen shows how many pixels the drawing has.

Before you start:
- Device and browser: a phone-width window, 390 × 844 px, at 4 device pixels per CSS pixel
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Measure the photo area and the drawing in it | The photo area is 390 × 544 CSS px; the drawing is 1170 × 1632 pixels: three to each CSS pixel, not four |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.
