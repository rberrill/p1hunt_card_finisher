# Corner shots

Close-ups of the card's four corners, saved as one 2×2 sheet or as four photos, from the Corner shots button on Export.

The cases use 01_chrome_flat_black.JPEG, a raw card on a dark mat: its card is found the same way in every browser, and the light card on the dark mat shows where each corner sits. (14_front_portrait_raw_white.JPEG's card is found slightly differently in WebKit, which changes the corner shots' size.) Most cases open the build with `?cornerShots.upscaleTargetPx=0` added to its address, which turns off the Upscale question for corner shots; the question itself is in `upscale-question.md`.

## CNR-01 The Corner shots sheet

Corner shots have their own sheet, titled **Corner shots**, which closes like any other sheet.

- Risk: medium
- Check: script
- Layout: both. On a phone the **Corner shots** button on Export opens it; on a wide screen it is a section of the side panel, always open.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#cornerShotsSheet`, `#btnCornerShots`, "Close-ups of the card’s four corners"
- Source: `js/app/corner-shots.js` (`buildCornerShotsControls`, `openCornerShots`)
- Cases: 2

### CNR-01.1 On a phone, the Corner shots sheet opens and closes like any other sheet   [auto: phone]
Before you start:
- Device and browser: a phone-width window
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step, no sheet open

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Corner shots** in the bottom row of buttons | A sheet titled CORNER SHOTS rises over the photo; its last line reads "Close-ups of the card’s four corners, at the photo’s own resolution, with this photo’s levels and no overlay." |
| 2 | Tap the **×** at the sheet's top right | The sheet goes down |
| 3 | Tap **Corner shots** | The sheet rises again |
| 4 | Drag the tab on the sheet's top edge (the dark tab with a short bar in it) 300 px down, and let go | The sheet goes down |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### CNR-01.2 On a wide screen, Corner shots is a section of the panel, always open   [auto: desktop]
Before you start:
- Device and browser: a wide window, 1280 × 800 px
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the panel on the right, below the buttons | A section titled CORNER SHOTS shows four close-ups, **4 photos** and **1 sheet**, a size line and **Download corners**, with no **×** to close it |
| 2 | Click **Corner shots** in the bottom row of buttons | The section is still shown, in the same place, and nothing rises over the photo |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## CNR-02 Four live thumbnails

Four thumbnails (top-left, top-right, bottom-left, bottom-right) show each corner as it will be framed, with the applied levels and no logo, on the export fill, or on the app's dark gray when the fill is Transparent. While the corners are invalid or the card is too small, they show only that background.

- Risk: medium
- Check: eye
- Layout: both. On a phone they are drawn while the sheet is open; on a wide screen whenever Export is the step.
- Added: 1.10 baseline
- Changed: none
- Anchors: `.corner-thumbs`, "Top-left corner", `CONFIG.theme.stage`
- Source: `js/app/corner-shots.js` (`areThumbsShown`, `requestThumbs`, `drawThumbs`, `drawThumb`)
- Cases: 1

### CNR-02.1 The thumbnails show each corner, and only the background while the corners are invalid   [eye]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step, **Fill outside photo** White

Rows 1 and 2 are for a person to judge from the screenshot; rows 4 and 6 are measured.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Corner shots** | Four square close-ups in a row, left to right: the card's top-left, top-right, bottom-left and bottom-right corners. In each, the dark mat shows along the two outer sides, and the card's corner sits about a third of the way in from them |
| 2 | Close the sheet (the **×** at its top right), tap **Levels** in the step bar, tap **Auto**, tap **Apply**, tap **Export** and tap **Corner shots** | The four close-ups show the same corners with the brighter, higher-contrast look Auto gave the photo |
| 3 | Close the sheet, tap **Perspective** in the step bar, and drag the top-left corner handle past the bottom-right one | The outline crosses itself |
| 4 | Tap **Export**, then **Corner shots** | Each of the four close-ups is plain white, with no part of the photo |
| 5 | Close the sheet; open **Export options** (the **Options** tab on the top edge of the controls), set **Fill outside photo** to Transparent and close them | The swatch shows the see-through checks |
| 6 | Tap **Corner shots** | Each close-up is plain dark gray (#2b2b2b), the app's background |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## CNR-03 Four photos or one sheet

**4 photos** or **1 sheet** picks what is saved. The choice is remembered (the default is 1 sheet), and changing it drops files waiting for **Share now**.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#cornerOutput`, `CONFIG.cornerShots.output`, "4 photos", "1 sheet"
- Source: `js/app/corner-shots.js` (`storedOutput`, `setOutput`, `bindCornerShots`)
- Cases: 2

### CNR-03.1 1 sheet is the first choice, and 4 photos is remembered after a reload   [auto: phone, webkit]
Before you start:
- Device and browser: any; a phone-width window. The browser's site data for the app cleared, so nothing is remembered
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Corner shots** | **1 sheet** is selected (white), and the size line begins "Sheet" |
| 2 | Tap **4 photos** | **4 photos** is selected, and the size line begins "4 photos" |
| 3 | Reload the page, tap **Open** (the folder at the top left) and choose 01_chrome_flat_black.JPEG | The photo opens on the Perspective step |
| 4 | Tap **Export**, then **Corner shots** | **4 photos** is still selected |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### CNR-03.2 Changing the choice drops the files waiting for Share now   [auto: phone]
Before you start:
- Device and browser: a phone-width window. In the automated case, a stand-in for the share sheet refuses the first share, as Safari does when a share comes too long after the tap
- Build: the build under test, opened with `?cornerShots.upscaleTargetPx=0` (index.html?cornerShots.upscaleTargetPx=0)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step, **1 sheet** chosen in Corner shots

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Corner shots**, then **Share corners** | The share is refused, and the red button now reads **Share now** |
| 2 | Tap **4 photos** | The red button reads **Share corners** again |
| 3 | Tap **Share corners** | The share sheet opens with four photos, named 01_chrome_flat_black-corner-tl.jpg, -tr, -br and -bl, not the sheet |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## CNR-04 The size line

A line reads **4 photos · N × N px · FORMAT** or **Sheet W × H px · N px corners · FORMAT**; it is empty while the corners are invalid. When the corner shots can't be sized for any other reason, it reads **Sheet · the card is too small** or **4 photos · the card is too small**.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#cornerReadout`, " px corners · ", " · the card is too small"
- Source: `js/app/corner-shots.js` (`readout`, `syncCornerShots`)
- Ruling: R20. The line gives the real reason the corner shots can't be made, and both save buttons are dimmed. The app differs today.
- Cases: 3

### CNR-04.1 The size line gives the sheet's or each photo's size, and the format   [auto: phone]
Before you start:
- Device and browser: any; a phone-width window
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step, **JPEG** selected, **1 sheet** chosen in Corner shots

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Corner shots** and read the line under **4 photos** and **1 sheet** | It reads "Sheet 314 × 314 px · 156 px corners · JPEG" |
| 2 | Tap **4 photos** | It reads "4 photos · 156 × 156 px · JPEG" |
| 3 | Close the sheet (the **×** at its top right), tap **PNG**, then tap **Corner shots** | It reads "4 photos · 156 × 156 px · PNG" |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### CNR-04.2 While the corners are invalid, the size line is empty   [auto: phone]
Before you start:
- Device and browser: any; a phone-width window
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Drag the top-left corner handle past the bottom-right one | The outline crosses itself |
| 2 | Tap **Export**, then **Corner shots** | The line under **4 photos** and **1 sheet** is empty |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### CNR-04.3 When the corner shots can't be made, the line gives the real reason   [auto: phone]
Written to ruling R20; it fails until R20 is built (BUG-120).

Before you start:
- Device and browser: any; a phone-width window
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step, with the corner shots impossible to frame for a reason other than the card's size (the engine says "Transform is not invertible.")

No photo and no control can bring this about today; the automated case makes the engine refuse.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Corner shots** and read the line under **4 photos** and **1 sheet** | A line that says the corner shots can't be framed (the reason the engine gave), not "Sheet · the card is too small" |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## CNR-05 Share corners

**Share corners** (red) opens one share sheet with the file or files; it is hidden where the browser can't share files.

- Risk: medium
- Check: phone, script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnCornerShare`, "Share corners", "Share the corner shots (Save Image puts them in Photos)"
- Source: `js/app/corner-shots.js` (`bindCornerShots`, `saveCornerShots`, `shareCornerShots`)
- Ruling: R21. Corner shots check again whether Share can show each time the screen updates, as Export does. The app differs today.
- Cases: 4

### CNR-05.1 Share corners opens the iPhone's share sheet with the sheet, or all four photos   [phone]
Before you start:
- Device and browser: an iPhone, Safari
- Build: the build under test on the live site (HTTPS; over plain HTTP **Share corners** is hidden)
- Photo: 01_chrome_flat_black.JPEG from samples/ (AirDrop it to the phone or save it to Photos first)
- Starting screen: the photo open, on the Export step, **1 sheet** chosen in Corner shots

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Corner shots** | The Corner shots sheet rises, with **Share corners** in red and **Download corners** beside it |
| 2 | Tap **Share corners** | A question card asks "Upscale to 2000 px?" |
| 3 | Tap **No** | A thin red line runs along the sheet's top edge, then the share sheet rises with one picture, the 2 × 2 sheet of corners |
| 4 | Tap **Save Image** | The share sheet closes; a message reads "Saved the corner sheet in" and a time |
| 5 | Tap **4 photos**, then **Share corners**, then **No** | The share sheet rises with four pictures, one per corner |
| 6 | Tap **Save 4 Images** | The share sheet closes; a message reads "Saved 4 corner shots in" and a time; the Photos app shows the four new pictures |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot (press the side button and volume up together).

### CNR-05.2 Share corners hands the share sheet the corner sheet   [auto: phone]
Before you start:
- Device and browser: a phone-width window. In the automated case, a stand-in for the share sheet records what it is given; no real share sheet opens
- Build: the build under test, opened with `?cornerShots.upscaleTargetPx=0` (index.html?cornerShots.upscaleTargetPx=0)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step, **1 sheet** chosen in Corner shots

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Corner shots** | **Share corners** shows in red, and **Download corners** beside it is not red |
| 2 | Tap **Share corners** | The share sheet opens with one JPEG file, 01_chrome_flat_black-corners.jpg; a message begins "Saved the corner sheet in" |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### CNR-05.3 Where the browser can't share files, Share corners is hidden   [auto: phone]
Before you start:
- Device and browser: a phone-width window, in a browser that can't share files (in the automated case, the browser's share feature is taken away)
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Corner shots** | There is no **Share corners**; **Download corners** shows |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### CNR-05.4 Share corners appears once the browser can share, as Share does   [auto: phone]
Written to ruling R21; it fails until R21 is built (BUG-121).

Before you start:
- Device and browser: a phone-width window, in a browser that can't share files when the page opens and can a moment later (in the automated case, a stand-in share feature that starts off and is switched on)
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step, **1 sheet** chosen in Corner shots

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Corner shots** | There is no **Share corners** |
| 2 | Close the sheet (the **×** at its top right), let the browser share files, then tap **PNG** (which updates the screen) | **Share** shows on Export |
| 3 | Tap **Corner shots** | **Share corners** shows too |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## CNR-06 Download corners

**Download corners** is always shown; it is red when **Share corners** is hidden.

- Risk: high
- Check: script, saved file
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnCornerDownload`, "Download corners"
- Source: `js/app/corner-shots.js` (`bindCornerShots`, `deliverCornerShots`)
- Cases: 2

### CNR-06.1 Download corners saves the corner sheet as a plain download   [auto: phone, webkit]
Before you start:
- Device and browser: any; a phone-width window, with downloads saved to a folder you can open
- Build: the build under test, opened with `?cornerShots.upscaleTargetPx=0` (index.html?cornerShots.upscaleTargetPx=0)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step, **JPEG** selected, **1 sheet** chosen in Corner shots

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Corner shots** | **Download corners** shows |
| 2 | Tap **Download corners** | One file is saved, a JPEG of 314 × 314 px; a message begins "Saved the corner sheet in" |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot, and the saved file.

### CNR-06.2 Without Share corners, Download corners is the red one   [auto: phone]
Before you start:
- Device and browser: a phone-width window, in a browser that can't share files (in the automated case, the browser's share feature is taken away)
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Corner shots** | **Download corners** is red and runs the whole width of the sheet |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## CNR-07 Share now for corner shots

After a slow render the share button reads **Share now**: it stays live while the rest is busy, shares the files already made, and any edit cancels it.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnCornerShare`, "Share now"
- Source: `js/app/corner-shots.js` (`shareCornerShots`, `syncCornerShots`, `bindCornerShots`); `js/app/state.js` (`stateChanged`)
- Ruling: R21. Next card stays independent of corner shots: a corner-shots Share now doesn't hide it. The app already does this.
- Cases: 4

### CNR-07.1 Share now shares the files already made, without asking again   [auto: phone]
Before you start:
- Device and browser: a phone-width window. In the automated case, a stand-in for the share sheet refuses the first share, as Safari does when a share comes too long after the tap
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step, **1 sheet** chosen in Corner shots

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Corner shots**, then **Share corners** | A question card asks "Upscale to 2000 px?" |
| 2 | Tap **No** | The share is refused; the red button reads **Share now** |
| 3 | Tap **Share now** | No question is asked; the share sheet opens with the same file, 01_chrome_flat_black-corners.jpg, and the button reads **Share corners** again |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### CNR-07.2 Share now stays live while an export runs   [auto: desktop]
Before you start:
- Device and browser: a wide window, 1280 × 800 px. In the automated case, a stand-in for the share sheet refuses the first share
- Build: the build under test, opened with `?cornerShots.upscaleTargetPx=0` (index.html?cornerShots.upscaleTargetPx=0)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step, **2000** selected

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Click **Share corners** in the Corner shots section | The share is refused; the button reads **Share now** |
| 2 | Click **Download** (the main export), then **No** when it asks to upscale | While the thin red line runs, **Share now** stays live and **Download corners** is greyed out |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### CNR-07.3 An edit drops a waiting Share now   [auto: phone]
Before you start:
- Device and browser: a phone-width window. In the automated case, a stand-in for the share sheet refuses the first share
- Build: the build under test, opened with `?cornerShots.upscaleTargetPx=0` (index.html?cornerShots.upscaleTargetPx=0)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step, **JPEG** selected

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Corner shots**, then **Share corners** | The share is refused; the red button reads **Share now** |
| 2 | Close the sheet (the **×** at its top right), tap **PNG**, then tap **Corner shots** | The red button reads **Share corners** |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### CNR-07.4 A corner-shots Share now doesn't hide Next card   [auto: phone]
Before you start:
- Device and browser: a phone-width window. In the automated case, a stand-in for the share sheet refuses the first share
- Build: the build under test, opened with `?cornerShots.upscaleTargetPx=0` (index.html?cornerShots.upscaleTargetPx=0)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Download**, then **No** when it asks to upscale | A file is saved, and **Next card** shows in white |
| 2 | Tap **Corner shots**, then **Share corners** | The share is refused; the red button reads **Share now** |
| 3 | Close the sheet (the **×** at its top right) | **Next card** still shows |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## CNR-08 When the buttons are dimmed

Both buttons are dimmed while the corners are invalid, an export runs, or a pair's other side is opening. For a card too small for corner shots they stay live, and a tap says why.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnCornerShare`, `#btnCornerDownload`, "The card is too small for corner shots."
- Source: `js/app/corner-shots.js` (`syncCornerShots`, `saveCornerShots`); `js/engine.js` (`cornerShots`)
- Ruling: R20. The line gives the real reason the corner shots can't be made, and both save buttons are dimmed. The app differs today.
- Cases: 4

### CNR-08.1 Invalid corners dim Share corners and Download corners   [auto: phone]
Before you start:
- Device and browser: a phone-width window
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Drag the top-left corner handle past the bottom-right one | The outline crosses itself |
| 2 | Tap **Export**, then **Corner shots** | **Share corners** and **Download corners** are greyed out |
| 3 | Tap **Download corners** | Nothing is saved |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### CNR-08.2 For a card too small for corner shots, both buttons are dimmed   [auto: phone]
Written to ruling R20; it fails until R20 is built (BUG-120).

Before you start:
- Device and browser: a phone-width window
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step, with the card too small for corner shots (the engine says "The card is too small for corner shots.")

No photo and no control can bring this about today; the automated case makes the engine refuse.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Corner shots** | **Share corners** and **Download corners** are greyed out |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### CNR-08.3 While the corner shots are saved, both buttons are dimmed   [auto: phone]
Before you start:
- Device and browser: a phone-width window
- Build: the build under test, opened with `?cornerShots.upscaleTargetPx=0` (index.html?cornerShots.upscaleTargetPx=0)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Corner shots**, then **Download corners**, and watch the buttons while the thin red line runs | **Share corners** and **Download corners** are greyed out |
| 2 | Wait for the file to be saved | Both buttons are live again |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### CNR-08.4 While a pair's other side opens, both buttons are dimmed   [auto: phone]
Before you start:
- Device and browser: a phone-width window. In the automated case the side's photo is held while it opens, so the moment can be seen
- Build: the build under test
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: a pair: open the front, tap **Export**, tap **Add back** and choose the back. Then tap **Export**

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Front** in the top bar, then at once **Corner shots** | The Corner shots sheet rises while the front is still opening; **Share corners** and **Download corners** are greyed out |
| 2 | Wait for the front to open | Both buttons are live |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## CNR-09 How each shot is framed

Each shot is a square, a quarter of the card's short edge on a side, with the card's corner 30% of the square in from its two outer edges. It is framed like the export (the same tilt), at the photo's own resolution up to 2000 px.

- Risk: high
- Check: script, saved file
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.cornerShots.sizeFraction`, `CONFIG.cornerShots.insetFraction`, `CONFIG.cornerShots.maxPx`
- Source: `js/engine.js` (`cornerShots`, `cornerSquare`)
- Cases: 2

### CNR-09.1 Each shot is a quarter of the card's width, with the card's corner 30% in   [auto: phone, webkit]
Before you start:
- Device and browser: any; a phone-width window, with downloads saved to a folder you can open and an image editor that reads pixel positions
- Build: the build under test, opened with `?cornerShots.upscaleTargetPx=0` (index.html?cornerShots.upscaleTargetPx=0)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Original**, then **Download** | A file of 1074 × 1074 px is saved; a third of the way down, the card is about 660 px wide (within 15 px; measure from the mat to the mat) |
| 2 | Tap **Corner shots**, then **4 photos** | The size line reads "4 photos · 156 × 156 px · JPEG": a quarter of the card's width, within 10% (a shot is at the resolution of the card's least detailed corner, the export at the crop's most detailed part) |
| 3 | Tap **Download corners** | Four square files of 156 × 156 px are saved |
| 4 | Open each file and find where the light card begins on the dark mat | In the top-left shot the card's corner is 30% of the side in from the left and the top (47 px, within 5 px); in the top-right shot 30% in from the right and the top; in the bottom-right shot from the right and the bottom; in the bottom-left shot from the left and the bottom |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot, and the saved files.

### CNR-09.2 A link can cap the shots' size   [auto: phone]
Before you start:
- Device and browser: any; a phone-width window, with downloads saved to a folder you can open
- Build: the build under test, opened with `?cornerShots.maxPx=100&cornerShots.upscaleTargetPx=0` (index.html?cornerShots.maxPx=100&cornerShots.upscaleTargetPx=0)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step, **4 photos** chosen in Corner shots

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Corner shots** | The size line reads "4 photos · 100 × 100 px · JPEG" |
| 2 | Tap **Download corners** | Four files of 100 × 100 px are saved |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot, and the saved files.

## CNR-10 The sheet

The sheet is one square image, top-left and top-right over bottom-left and bottom-right, with a gap between the tiles of 0.8% of two tiles' width, in the export fill, and no outer margin.

- Risk: high
- Check: script, saved file
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.cornerShots.gutterPct`, "1 sheet"
- Source: `js/app/corner-shots.js` (`encodeSheet`); `js/engine.js` (`cornerSheetLayout`)
- Cases: 1

### CNR-10.1 The sheet holds the four shots in reading order, a 2 px white gap between them and no margin   [auto: phone, webkit]
Before you start:
- Device and browser: any; a phone-width window, with downloads saved to a folder you can open and an image editor that reads pixel positions
- Build: the build under test, opened with `?cornerShots.upscaleTargetPx=0` (index.html?cornerShots.upscaleTargetPx=0)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step, **Fill outside photo** White, **1 sheet** chosen in Corner shots

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Corner shots**, then **Download corners** | One file of 314 × 314 px is saved: two 156 px tiles and a 2 px gap (0.8% of 312 px) each way |
| 2 | Tap **4 photos**, then **Download corners** | Four files of 156 × 156 px are saved |
| 3 | Compare the sheet's four tiles with the four photos | The top-left tile is the -tl photo, the top-right tile -tr, the bottom-left tile -bl and the bottom-right tile -br |
| 4 | Look at the two pixel rows and columns between the tiles | They are white, the fill |
| 5 | Look at the sheet's outer edges | They are the dark mat of the photo, with no white margin |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot, and the saved files.

## CNR-11 Four photos

With **4 photos**, **Download corners** saves four files, 250 ms apart, and **Share corners** puts all four in one share sheet.

- Risk: medium
- Check: script, saved file
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnCornerDownload`, "4 photos"
- Source: `js/app/corner-shots.js` (`encodePhotos`, `deliverCornerShots`, `shareCornerShots`)
- Cases: 2

### CNR-11.1 One tap of Download corners saves four files, a quarter of a second apart   [auto: phone, webkit]
Before you start:
- Device and browser: any; a phone-width window, with downloads saved to a folder you can open
- Build: the build under test, opened with `?cornerShots.upscaleTargetPx=0` (index.html?cornerShots.upscaleTargetPx=0)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step, **4 photos** chosen in Corner shots

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Corner shots**, then **Download corners** once | Four files arrive, in the order top-left, top-right, bottom-right, bottom-left, each about 250 ms after the one before (at least 200 ms); a message begins "Saved 4 corner shots in" |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot, and the saved files.

### CNR-11.2 Share corners puts all four photos in one share sheet   [auto: phone]
Before you start:
- Device and browser: a phone-width window. In the automated case, a stand-in for the share sheet records what it is given
- Build: the build under test, opened with `?cornerShots.upscaleTargetPx=0` (index.html?cornerShots.upscaleTargetPx=0)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step, **4 photos** chosen in Corner shots

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Corner shots**, then **Share corners** once | One share sheet opens, with four JPEG files: the -tl, -tr, -br and -bl shots |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## CNR-12 The export settings carry over

The format, Quality and fill follow the Export settings; the applied levels are in, and the logo never is.

- Risk: high
- Check: script, saved file
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#exportFormat`, `#quality`, `#fill`
- Source: `js/app/corner-shots.js` (`renderAndSave`, `renderShot`, `encodeSheet`); `js/app/export.js` (`renderWarped`, `encodeCanvas`)
- Cases: 3

### CNR-12.1 The sheet is saved in the format chosen on Export   [auto: phone, webkit]
Before you start:
- Device and browser: any; a phone-width window, with downloads saved to a folder you can open
- Build: the build under test, opened with `?cornerShots.upscaleTargetPx=0` (index.html?cornerShots.upscaleTargetPx=0)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step, **1 sheet** chosen in Corner shots

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **PNG** | **PNG** is selected |
| 2 | Tap **Corner shots**, then **Download corners** | A PNG file is saved, 01_chrome_flat_black-corners.png, of 314 × 314 px |
| 3 | Close the sheet, tap **WebP**, tap **Corner shots**, then **Download corners** | A WebP file is saved, 01_chrome_flat_black-corners.webp |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot, and the saved files.

### CNR-12.2 A lower Quality gives a smaller sheet   [auto: phone, webkit]
Before you start:
- Device and browser: any; a phone-width window, with downloads saved to a folder you can open
- Build: the build under test, opened with `?cornerShots.upscaleTargetPx=0` (index.html?cornerShots.upscaleTargetPx=0)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step, **JPEG** selected, **1 sheet** chosen in Corner shots

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Open **Export options**, drag **Quality** to its right end, and close them | **Quality** reads 100% |
| 2 | Tap **Corner shots**, then **Download corners** | A JPEG sheet is saved |
| 3 | Close the sheet, open **Export options**, drag **Quality** to its left end, and close them | **Quality** reads 50% |
| 4 | Tap **Corner shots**, then **Download corners** | A second JPEG sheet is saved, of the same size in px and a smaller file than the first |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot, and the saved files.

### CNR-12.3 Applied levels are in the shots, unapplied ones and the logo never are   [auto: phone]
Before you start:
- Device and browser: any; a phone-width window, with downloads saved to a folder you can open and a way to compare two files byte for byte
- Build: the build under test, opened with `?cornerShots.upscaleTargetPx=0` (index.html?cornerShots.upscaleTargetPx=0)
- Photo: 01_chrome_flat_black.JPEG from samples/; the logo icons/apple-touch-icon.png from the repository
- Starting screen: the photo open, on the Export step, **1 sheet** chosen in Corner shots, no logo

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Corner shots**, then **Download corners** | Sheet A is saved |
| 2 | Close the sheet; tap **Levels**, then **Auto** (don't apply it); tap **Export**, **Corner shots** and **Download corners** | Sheet B is saved, byte for byte the same as sheet A: unapplied levels are not in it |
| 3 | Close the sheet; tap **Levels**, then **Apply**; tap **Export**, **Corner shots** and **Download corners** | Sheet C is saved, and it differs from sheet A |
| 4 | Close the sheet; tap **Overlay**, tap **Add logo** and choose apple-touch-icon.png | The logo shows in the middle of the photo |
| 5 | Tap **Export**, **Corner shots** and **Download corners** | Sheet D is saved, byte for byte the same as sheet C: the logo is not in it |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot, and the saved files.

## CNR-13 File names

The sheet is saved as **{photo}-corners.{ext}**, and the four photos as **{photo}-corner-tl**, **-tr**, **-br** and **-bl**.

- Risk: medium
- Check: script, saved file
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: "-corners.", "-corner-"
- Source: `js/app/corner-shots.js` (`encodeSheet`, `encodePhotos`); `js/engine.js` (`CORNER_LABELS`)
- Cases: 1

### CNR-13.1 The sheet and the photos are named for the photo and their corner   [auto: phone, webkit]
Before you start:
- Device and browser: any; a phone-width window, with downloads saved to a folder you can open
- Build: the build under test, opened with `?cornerShots.upscaleTargetPx=0` (index.html?cornerShots.upscaleTargetPx=0)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step, **JPEG** selected, **1 sheet** chosen in Corner shots

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Corner shots**, then **Download corners** | A file named 01_chrome_flat_black-corners.jpg is saved |
| 2 | Tap **4 photos**, then **Download corners** | Four files are saved: 01_chrome_flat_black-corner-tl.jpg, -corner-tr.jpg, -corner-br.jpg and -corner-bl.jpg |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## CNR-14 Progress

A progress line along the top edge of the Corner shots sheet runs once over all four shots.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#cornerShotsSheet`, `.progress-line`
- Source: `js/app/corner-shots.js` (`renderShot`, `renderAndSave`); `js/app/export.js` (`runWithProgress`)
- Cases: 1

### CNR-14.1 The line runs once from start to end over the four photos   [auto: phone]
Before you start:
- Device and browser: a phone-width window
- Build: the build under test, opened with `?cornerShots.upscaleTargetPx=0` (index.html?cornerShots.upscaleTargetPx=0)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step, **4 photos** chosen in Corner shots

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Corner shots**, then **Download corners**, and watch the thin red line on the sheet's top edge | It starts at the left, grows to the full width once and never shrinks back on the way, though four files are made |
| 2 | Wait for the four files | The line has gone |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## CNR-15 Corner shots never bring Next card

Saving corner shots never counts the edits as exported, so it never brings **Next card**.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnNextCard`, `#btnCornerDownload`
- Source: `js/app/corner-shots.js` (`saveCornerShots`, `deliverCornerShots`)
- Cases: 1

### CNR-15.1 Neither Download corners nor a finished Share corners brings Next card   [auto: phone]
Before you start:
- Device and browser: a phone-width window. In the automated case, a stand-in for the share sheet finishes every share
- Build: the build under test, opened with `?cornerShots.upscaleTargetPx=0` (index.html?cornerShots.upscaleTargetPx=0)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step, no **Next card** shown

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Corner shots**, then **Download corners**, and close the sheet | The corner sheet is saved; there is no **Next card** |
| 2 | Tap **Corner shots**, then **Share corners**, and close the sheet | The share sheet opens with the corner sheet and finishes; there is no **Next card** |
| 3 | Tap **Download**, then **No** when it asks to upscale | The photo is saved, and **Next card** shows |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## CNR-16 Corner shots in a pair

In a front and back pair, the corner shots are of the side that is open.

- Risk: medium
- Check: script, saved file
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnCornerDownload`, `#sideSwitch`
- Source: `js/app/corner-shots.js` (`currentShots`, `renderAndSave`)
- Cases: 1

### CNR-16.1 In a pair, the corner shots are of the side on screen   [auto: phone]
Before you start:
- Device and browser: a phone-width window, with downloads saved to a folder you can open
- Build: the build under test, opened with `?cornerShots.upscaleTargetPx=0` (index.html?cornerShots.upscaleTargetPx=0)
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: a pair: open the front, tap **Export**, tap **Add back** and choose the back. Then tap **Export**; **1 sheet** chosen in Corner shots

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Corner shots** | The size line reads "Sheet 306 × 306 px · 152 px corners · JPEG" |
| 2 | Tap **Download corners** | A file named 14_back_portrait_raw_white-corners.jpg is saved, of 306 × 306 px |
| 3 | Close the sheet, tap **Front** in the top bar, then **Corner shots** | The size line reads "Sheet 290 × 290 px · 144 px corners · JPEG" |
| 4 | Tap **Download corners** | A file named 14_front_portrait_raw_white-corners.jpg is saved, of 290 × 290 px |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot, and the saved files.
