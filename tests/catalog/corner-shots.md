# Corner shots

Close-ups of the card's four corners, saved as one 2×2 sheet or as four photos, from the Corner shots button on Export.

The cases use 01_chrome_flat_black.JPEG, a raw card on a dark mat: its card is found the same way in every browser, and the light card on the dark mat shows where each corner sits. (14_front_portrait_raw_white.JPEG's card is found slightly differently in WebKit, which changes the corner shots' size.) Most cases open the build with `?cornerShots.upscaleTargetPx=0` added to its address, which turns off the Upscale question for corner shots; the question itself has its own cases, under The Upscale question (UPS).

Words these cases use, besides those in the catalog's README:
- **the corner size line**: the line of text under **4 photos** and **1 sheet** in the Corner shots sheet.
- **Save the corners** (a named action): with the Corner shots sheet closed, tap **Corner shots** in the bottom row of buttons on Export, tap **Download corners**, wait for the file, then tap the **×** at the sheet's top right. The sheet goes down again.

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
- Browser data: none for this site (a private window, or the site's data cleared)
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
- Browser data: none for this site (a private window, or the site's data cleared)
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
- Check: eye; script (the background, and no logo)
- Layout: both. On a phone they are drawn while the sheet is open; on a wide screen whenever Export is the step.
- Added: 1.10 baseline
- Changed: none
- Anchors: `.corner-thumbs`, "Top-left corner", `CONFIG.theme.stage`
- Source: `js/app/corner-shots.js` (`areThumbsShown`, `requestThumbs`, `drawThumbs`, `drawThumb`)
- Cases: 3

### CNR-02.1 The thumbnails show each corner, with the applied levels   [eye]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step

Rows 1 and 7 are for a person to judge from the screenshot; the script checks the others.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Corner shots** in the bottom row of buttons | Four square close-ups in a row, left to right: the card's top-left, top-right, bottom-left and bottom-right corners. In each, the dark mat shows along the two outer sides, and the card's corner sits about a third of the way in from them |
| 2 | Tap the **×** at the sheet's top right | The sheet goes down |
| 3 | Tap **Levels** in the step tabs (the six tabs along the bottom) | The Levels step shows, with **Auto** among its tools |
| 4 | Tap **Auto** | **Apply** is no longer greyed out |
| 5 | Tap **Apply** | **Apply** and **Discard** are greyed out |
| 6 | Tap **Export** in the step tabs | The Export step shows |
| 7 | Tap **Corner shots** | The four close-ups show the same corners with the brighter, higher-contrast look Auto gave the photo |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### CNR-02.2 While the corners are invalid, the thumbnails show only the background   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Perspective step

Set the fill to Transparent (a named action): tap the **Fill outside photo** row, then **Transparent** in the list it opens.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Drag the top-left corner handle (the round handle on the card's top-left corner) down and to the right, past the bottom-right handle, and let go | The outline crosses itself; the line above the controls (the one line of text at the top of the controls, the block of buttons and sliders under the photo) reads "Corners cross or fold inward. Drag them back into a convex shape." |
| 2 | Tap **Export** in the step tabs (the six tabs along the bottom) | The Export step shows |
| 3 | Tap **Corner shots** in the bottom row of buttons | Each of the four close-ups is plain white, the fill, with no part of the photo |
| 4 | Tap the **×** at the sheet's top right | The sheet goes down |
| 5 | Tap the options tab (the small tab with an up arrow on the top edge of the controls) | **Export options** rise; the **Fill outside photo** row reads White |
| 6 | Set the fill to Transparent | The **Fill outside photo** row reads Transparent |
| 7 | Tap the **×** at the top right of **Export options** | The options go down |
| 8 | Tap **Corner shots** | Each close-up is plain dark gray (#2b2b2b), the app's background |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### CNR-02.3 The thumbnails never show the logo   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/; the logo green-logo.png from tests/fixtures/ (a solid green square)
- Starting screen: the photo open, on the Export step, no logo

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Corner shots** in the bottom row of buttons | Four close-ups of the card's corners |
| 2 | Tap the **×** at the sheet's top right | The sheet goes down |
| 3 | Tap **Overlay** in the step tabs (the six tabs along the bottom) | The Overlay step shows, with **Add logo** |
| 4 | Tap **Add logo** | The file picker opens |
| 5 | Choose green-logo.png | A green square shows in the middle of the photo |
| 6 | Tap the top-left ring (the white ring with a dot near the photo's top-left corner) | The green square moves to the photo's top-left corner, over the card's top-left corner |
| 7 | Tap **Export** in the step tabs | The Export step shows, the green square still at the top left of the photo |
| 8 | Tap **Corner shots** | The four close-ups are the same as in row 1: there is no green square in the top-left one |

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
- Device and browser: any; a phone-width window
- Build: the build under test
- Browser data: none for this site at the start (a private window, or the site's data cleared). The case has the app remember **4 photos**, and checks it is still chosen after a reload
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Corner shots** in the bottom row of buttons | **1 sheet** is selected (white), and the corner size line (under **4 photos** and **1 sheet**) begins "Sheet" |
| 2 | Tap **4 photos** | **4 photos** is selected, and the corner size line begins "4 photos" |
| 3 | Wait two seconds, then reload the page | The start screen asks "Resume 01_chrome_flat_black.JPEG?", with **Resume** and **Start fresh** |
| 4 | Tap **Start fresh** | The question goes; **Open photo** shows and no photo is open |
| 5 | Tap **Open photo** | The file picker opens |
| 6 | Choose 01_chrome_flat_black.JPEG | The photo opens on the Perspective step |
| 7 | Tap **Export** in the step tabs (the six tabs along the bottom) | The Export step shows |
| 8 | Tap **Corner shots** | **4 photos** is still selected |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### CNR-03.2 Changing the choice drops the files waiting for Share now   [auto: phone]
Script only
Stand-in: a script stands in for the share sheet and refuses the first share, as Safari does when a share comes too long after the tap. A person can't make a browser refuse, and no case uses a desktop browser's own share sheet.

Before you start:
- Device and browser: a phone-width window
- Build: the build under test, opened with `?cornerShots.upscaleTargetPx=0` (index.html?cornerShots.upscaleTargetPx=0)
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Corner shots** in the bottom row of buttons | The Corner shots sheet rises, with **1 sheet** selected |
| 2 | Tap **Share corners** | The share is refused, and the red button now reads **Share now** |
| 3 | Tap **4 photos** | The red button reads **Share corners** again |
| 4 | Tap **Share corners** | The share sheet is handed four photos, named 01_chrome_flat_black-corner-tl.jpg, -tr, -br and -bl, not the sheet |

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
- Ruling: R20. The line gives the real reason the corner shots can't be made, ending "· the card is too small" when that is the reason and "· fix the corners in Perspective first" for any other, and both save buttons are dimmed. The app differs today: it reads "· the card is too small" for any reason, and both buttons stay live.
- Cases: 3

### CNR-04.1 The size line gives the sheet's or each photo's size, and the format   [auto: phone]
Before you start:
- Device and browser: any; a phone-width window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Corner shots** in the bottom row of buttons | The corner size line (under **4 photos** and **1 sheet**) reads "Sheet 314 × 314 px · 156 px corners · JPEG" |
| 2 | Tap **4 photos** | It reads "4 photos · 156 × 156 px · JPEG" |
| 3 | Tap the **×** at the sheet's top right | The sheet goes down |
| 4 | Tap **PNG** | **PNG** is selected |
| 5 | Tap **Corner shots** | The corner size line reads "4 photos · 156 × 156 px · PNG" |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### CNR-04.2 While the corners are invalid, the size line is empty   [auto: phone]
Before you start:
- Device and browser: any; a phone-width window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Drag the top-left corner handle (the round handle on the card's top-left corner) down and to the right, past the bottom-right handle, and let go | The outline crosses itself; the line above the controls (the one line of text at the top of the controls, the block of buttons and sliders under the photo) reads "Corners cross or fold inward. Drag them back into a convex shape." |
| 2 | Tap **Export** in the step tabs (the six tabs along the bottom) | The Export step shows |
| 3 | Tap **Corner shots** in the bottom row of buttons | The corner size line (under **4 photos** and **1 sheet**) is empty |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### CNR-04.3 When the corner shots can't be made, the line gives the real reason   [auto: phone]
Script only
Stand-in: no photo and no control makes the corner shots impossible for a card whose corners are valid, so the script makes the engine refuse them with "Transform is not invertible."
Written to ruling R20; it fails until R20 is built (BUG-120).

Before you start:
- Device and browser: any; a phone-width window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Corner shots** in the bottom row of buttons | The corner size line (under **4 photos** and **1 sheet**) reads "Sheet · fix the corners in Perspective first" |
| 2 | Tap **4 photos** | It reads "4 photos · fix the corners in Perspective first" |

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
- Build: the build under test on the UAT site, https://rberrill.github.io/p1hunt_card_finisher_uat/ (HTTPS; over plain HTTP **Share corners** is hidden)
- Browser data: none for this site (a private tab, or the site's data cleared in Settings › Safari)
- Photo: 01_chrome_flat_black.JPEG from samples/ (AirDrop it to the phone or save it to Photos first)
- Starting screen: the photo open, on the Export step

The Upscale question is asked at every save in this case: the sheet is 314 px and each corner 156 px, both under 2000 px.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Corner shots** in the bottom row of buttons | The Corner shots sheet rises, with **Share corners** in red and **Download corners** beside it |
| 2 | Tap **Share corners** | The question box (the box over the dimmed photo with a question and buttons) asks "Upscale to 2000 px?" |
| 3 | Tap **No** | A thin red line runs along the sheet's top edge, then the share sheet rises with one picture, the 2 × 2 sheet of corners |
| 4 | Tap **Save Image** | The share sheet closes; a message begins "Corner sheet shared: " |
| 5 | Tap **4 photos** | **4 photos** is selected (white) |
| 6 | Tap **Share corners** | The question box asks "Upscale to 2000 px?" |
| 7 | Tap **No** | The share sheet rises with four pictures, one per corner |
| 8 | Tap **Save 4 Images** | The share sheet closes; a message begins "4 corner photos shared: " |
| 9 | Open the Photos app | The four corner pictures are the newest in the library, after the sheet |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot (press the side button and volume up together).

### CNR-05.2 Share corners hands the share sheet the corner sheet   [auto: phone]
Script only
Stand-in: a script stands in for the share sheet and records the files it is handed; no case uses a desktop browser's own share sheet (the iPhone's is CNR-05.1).

Before you start:
- Device and browser: a phone-width window
- Build: the build under test, opened with `?cornerShots.upscaleTargetPx=0` (index.html?cornerShots.upscaleTargetPx=0)
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Corner shots** in the bottom row of buttons | **Share corners** shows in red, and **Download corners** beside it is not red |
| 2 | Tap **Share corners** | The share sheet is handed one JPEG file, 01_chrome_flat_black-corners.jpg; a message begins "Corner sheet shared: " |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### CNR-05.3 Where the browser can't share files, Share corners is hidden   [auto: phone]
Script only
Stand-in: the script takes the browser's share feature away before the page opens, as in a browser that has none; the browsers the cases run in all have one.

Before you start:
- Device and browser: a phone-width window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Corner shots** in the bottom row of buttons | There is no **Share corners**; **Download corners** shows |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### CNR-05.4 Share corners appears once the browser can share, as Share does   [auto: phone]
Script only
Stand-in: a script stands in for the browser's share feature: it says it can't share files when the page opens, and says it can once row 2 is done. No browser changes its answer while a page is open in a way a person can arrange.
Written to ruling R21; it fails until R21 is built (BUG-121).

Before you start:
- Device and browser: a phone-width window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Corner shots** in the bottom row of buttons | There is no **Share corners** |
| 2 | Tap the **×** at the sheet's top right | The sheet goes down |
| 3 | Tap **PNG** (now that the browser can share) | **Share** shows on Export |
| 4 | Tap **Corner shots** | **Share corners** shows too |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## CNR-06 Download corners

**Download corners** is always shown; it is red when **Share corners** is hidden.

- Risk: high
- Check: script, saved file; phone (Safari's download)
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnCornerDownload`, "Download corners"
- Source: `js/app/corner-shots.js` (`bindCornerShots`, `deliverCornerShots`)
- Cases: 3

### CNR-06.1 Download corners saves the corner sheet as a plain download   [auto: phone, webkit]
Before you start:
- Device and browser: any; a phone-width window, with downloads saved to a folder you can open
- Build: the build under test, opened with `?cornerShots.upscaleTargetPx=0` (index.html?cornerShots.upscaleTargetPx=0)
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Corner shots** in the bottom row of buttons | **Download corners** shows |
| 2 | Tap **Download corners** | One file is saved, a JPEG of 314 × 314 px; a message begins "Corner sheet downloaded: " |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot, and the saved file.

### CNR-06.2 Without Share corners, Download corners is the red one   [auto: phone]
Script only
Stand-in: the script takes the browser's share feature away before the page opens, as in a browser that has none; the browsers the cases run in all have one.

Before you start:
- Device and browser: a phone-width window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Corner shots** in the bottom row of buttons | **Download corners** is red and runs the whole width of the sheet |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### CNR-06.3 On an iPhone, Download corners saves the sheet to Files   [phone]
Before you start:
- Device and browser: an iPhone, Safari
- Build: the build under test on the UAT site, https://rberrill.github.io/p1hunt_card_finisher_uat/
- Browser data: none for this site (a private tab, or the site's data cleared in Settings › Safari)
- Photo: 01_chrome_flat_black.JPEG from samples/ (AirDrop it to the phone or save it to Photos first)
- Starting screen: the photo open, on the Export step

The Upscale question is asked in this case: the sheet is 314 px, under 2000 px. Safari's downloads go to the folder named in Settings › Safari › Downloads (Downloads, in iCloud Drive, unless it was changed).

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Corner shots** in the bottom row of buttons | The Corner shots sheet rises, with **1 sheet** selected and **Download corners** shown |
| 2 | Tap **Download corners** | The question box (the box over the dimmed photo with a question and buttons) asks "Upscale to 2000 px?" |
| 3 | Tap **No** | A message begins "Corner sheet downloaded: "; Safari asks whether to download 01_chrome_flat_black-corners.jpg |
| 4 | Tap **Download** in Safari's question | Safari's question closes |
| 5 | Open the Files app and go to the downloads folder | 01_chrome_flat_black-corners.jpg is there |
| 6 | Tap 01_chrome_flat_black-corners.jpg | It opens: one square picture of the card's four corners, two over two |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot (press the side button and volume up together).

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
Script only
Stand-in: a script stands in for the share sheet and refuses the first share, as Safari does when a share comes too long after the tap. A person can't make a browser refuse, and no case uses a desktop browser's own share sheet.

Before you start:
- Device and browser: a phone-width window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Corner shots** in the bottom row of buttons | The Corner shots sheet rises, with **1 sheet** selected |
| 2 | Tap **Share corners** | The question box (the box over the dimmed photo with a question and buttons) asks "Upscale to 2000 px?": the sheet is 314 px |
| 3 | Tap **No** | The share is refused; the red button reads **Share now** |
| 4 | Tap **Share now** | No question is asked; the share sheet is handed the same file, 01_chrome_flat_black-corners.jpg, and the button reads **Share corners** again |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### CNR-07.2 Share now stays live while an export runs   [auto: desktop]
Script only
Stand-in: a script stands in for the share sheet and refuses the first share, as Safari does when a share comes too long after the tap. The export lasts well under a second here, too short to watch, so the script records the buttons as it begins.

Before you start:
- Device and browser: a wide window, 1280 × 800 px
- Build: the build under test, opened with `?cornerShots.upscaleTargetPx=0` (index.html?cornerShots.upscaleTargetPx=0)
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Click **Share corners** in the Corner shots section | The share is refused; the button reads **Share now** |
| 2 | Click **Download** (the main export) | The question box (the box over the dimmed photo with a question and buttons) asks "Upscale to 2000 px?": the crop is 1074 px |
| 3 | Click **No** | While the thin red line runs, **Share now** stays live and **Download corners** is greyed out |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### CNR-07.3 An edit drops a waiting Share now   [auto: phone]
Script only
Stand-in: a script stands in for the share sheet and refuses the first share, as Safari does when a share comes too long after the tap. A person can't make a browser refuse, and no case uses a desktop browser's own share sheet.

Before you start:
- Device and browser: a phone-width window
- Build: the build under test, opened with `?cornerShots.upscaleTargetPx=0` (index.html?cornerShots.upscaleTargetPx=0)
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Corner shots** in the bottom row of buttons | The Corner shots sheet rises |
| 2 | Tap **Share corners** | The share is refused; the red button reads **Share now** |
| 3 | Tap the **×** at the sheet's top right | The sheet goes down |
| 4 | Tap **PNG** | **PNG** is selected |
| 5 | Tap **Corner shots** | The red button reads **Share corners** |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### CNR-07.4 A corner-shots Share now doesn't hide Next card   [auto: phone]
Script only
Stand-in: a script stands in for the share sheet and refuses the first share, as Safari does when a share comes too long after the tap. A person can't make a browser refuse, and no case uses a desktop browser's own share sheet.

Before you start:
- Device and browser: a phone-width window
- Build: the build under test, opened with `?cornerShots.upscaleTargetPx=0` (index.html?cornerShots.upscaleTargetPx=0)
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Download** | The question box (the box over the dimmed photo with a question and buttons) asks "Upscale to 2000 px?": the crop is 1074 px |
| 2 | Tap **No** | A file is saved, and **Next card** shows in white |
| 3 | Tap **Corner shots** in the bottom row of buttons | The Corner shots sheet rises |
| 4 | Tap **Share corners** | The share is refused; the red button reads **Share now** |
| 5 | Tap the **×** at the sheet's top right | **Next card** still shows |

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
- Ruling: R20. The line gives the real reason the corner shots can't be made, ending "· the card is too small" when that is the reason and "· fix the corners in Perspective first" for any other, and both save buttons are dimmed. The app differs today: it reads "· the card is too small" for any reason, and both buttons stay live.
- Cases: 4

### CNR-08.1 Invalid corners dim Share corners and Download corners   [auto: phone]
Before you start:
- Device and browser: a phone-width window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Drag the top-left corner handle (the round handle on the card's top-left corner) down and to the right, past the bottom-right handle, and let go | The outline crosses itself; the line above the controls (the one line of text at the top of the controls, the block of buttons and sliders under the photo) reads "Corners cross or fold inward. Drag them back into a convex shape." |
| 2 | Tap **Export** in the step tabs (the six tabs along the bottom) | The Export step shows |
| 3 | Tap **Corner shots** in the bottom row of buttons | **Share corners** and **Download corners** are greyed out |
| 4 | Tap **Download corners** | Nothing is saved |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### CNR-08.2 For a card too small for corner shots, both buttons are dimmed   [auto: phone]
Script only
Stand-in: no photo and no control makes the card too small for corner shots, so the script makes the engine refuse them with "The card is too small for corner shots."
Written to ruling R20; it fails until R20 is built (BUG-120).

Before you start:
- Device and browser: a phone-width window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Corner shots** in the bottom row of buttons | The corner size line (under **4 photos** and **1 sheet**) reads "Sheet · the card is too small", and **Share corners** and **Download corners** are greyed out |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### CNR-08.3 While the corner shots are saved, both buttons are dimmed   [auto: phone]
Script only
Stand-in: nothing is replaced; the sheet is saved in well under a second here, too short to watch, so the script records the buttons as the save begins.

Before you start:
- Device and browser: a phone-width window
- Build: the build under test, opened with `?cornerShots.upscaleTargetPx=0` (index.html?cornerShots.upscaleTargetPx=0)
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Corner shots** in the bottom row of buttons | The Corner shots sheet rises |
| 2 | Tap **Download corners** | While the thin red line runs on the sheet's top edge, **Share corners** and **Download corners** are greyed out |
| 3 | Wait for the file to be saved | Both buttons are live again |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### CNR-08.4 While a pair's other side opens, both buttons are dimmed   [auto: phone]
Script only
Stand-in: a side opens in tens of milliseconds, too short to act in, so the script holds the front's opening until row 2 is seen.

Before you start:
- Device and browser: a phone-width window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: a pair, the back open on the Export step (open the front, tap **Export**, tap **Add back** and choose the back)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Front** in the top bar | A message reads "Opening the front…" |
| 2 | Tap **Corner shots** in the bottom row of buttons | The Corner shots sheet rises while the front is still opening; **Share corners** and **Download corners** are greyed out |
| 3 | Wait for the front to open | Both buttons are live |

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
- Device and browser: any; a phone-width window, with downloads saved to a folder you can open and an image editor that shows the pixel position under the pointer
- Build: the build under test, opened with `?cornerShots.upscaleTargetPx=0` (index.html?cornerShots.upscaleTargetPx=0)
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Original** | **Original** is selected |
| 2 | Tap **Download** | A file of 1074 × 1074 px is saved, with no question first |
| 3 | Open the file in the image editor and, on the row of pixels 322 px from the top (30% of the way down), note where the light card begins on the left and where it ends on the right | The two points are about 660 px apart (within 15 px): the card's width |
| 4 | Tap **Corner shots** in the bottom row of buttons | The Corner shots sheet rises |
| 5 | Tap **4 photos** | The corner size line (under **4 photos** and **1 sheet**) reads "4 photos · 156 × 156 px · JPEG": a quarter of the card's width from row 3, within 10% (the shots and the export are made at slightly different scales) |
| 6 | Tap **Download corners** | Four square files of 156 × 156 px are saved |
| 7 | Open each file and find where the light card begins on the dark mat | In the top-left shot the card's corner is 30% of the side in from the left and the top (47 px, within 5 px); in the top-right shot 30% in from the right and the top; in the bottom-right shot from the right and the bottom; in the bottom-left shot from the left and the bottom |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot, and the saved files.

### CNR-09.2 A link can cap the shots' size   [auto: phone]
Before you start:
- Device and browser: any; a phone-width window, with downloads saved to a folder you can open
- Build: the build under test, opened with `?cornerShots.maxPx=100&cornerShots.upscaleTargetPx=0` (index.html?cornerShots.maxPx=100&cornerShots.upscaleTargetPx=0)
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Corner shots** in the bottom row of buttons | The Corner shots sheet rises, with **1 sheet** selected |
| 2 | Tap **4 photos** | The corner size line (under **4 photos** and **1 sheet**) reads "4 photos · 100 × 100 px · JPEG" |
| 3 | Tap **Download corners** | Four files of 100 × 100 px are saved |

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
- Device and browser: any; a phone-width window, with downloads saved to a folder you can open and an image editor that shows the pixel position under the pointer
- Build: the build under test, opened with `?cornerShots.upscaleTargetPx=0` (index.html?cornerShots.upscaleTargetPx=0)
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step (**Fill outside photo** is White, as it starts)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Corner shots** in the bottom row of buttons | The Corner shots sheet rises, with **1 sheet** selected |
| 2 | Tap **Download corners** | One file of 314 × 314 px is saved: two 156 px tiles and a 2 px gap (0.8% of 312 px) each way |
| 3 | Tap **4 photos** | **4 photos** is selected |
| 4 | Tap **Download corners** | Four files of 156 × 156 px are saved |
| 5 | Compare the sheet's four tiles with the four photos | The top-left tile is the -tl photo, the top-right tile -tr, the bottom-left tile -bl and the bottom-right tile -br |
| 6 | Look at the two pixel rows and columns between the tiles | They are white, the fill |
| 7 | Look at the sheet's outer edges | They are the dark mat of the photo, with no white margin |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot, and the saved files.

## CNR-11 Four photos

With **4 photos**, **Download corners** saves four files, 250 ms apart, and **Share corners** puts all four in one share sheet.

- Risk: medium
- Check: script, saved file; phone (Safari's downloads)
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnCornerDownload`, "4 photos"
- Source: `js/app/corner-shots.js` (`encodePhotos`, `deliverCornerShots`, `shareCornerShots`)
- Cases: 3

### CNR-11.1 One tap of Download corners saves four files, a quarter of a second apart   [auto: phone, webkit]
Script only
Stand-in: nothing is replaced; the files are a quarter of a second apart, too close to time by eye, so the script notes when each download starts.

Before you start:
- Device and browser: any; a phone-width window, with downloads saved to a folder you can open
- Build: the build under test, opened with `?cornerShots.upscaleTargetPx=0` (index.html?cornerShots.upscaleTargetPx=0)
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Corner shots** in the bottom row of buttons | The Corner shots sheet rises, with **1 sheet** selected |
| 2 | Tap **4 photos** | **4 photos** is selected |
| 3 | Tap **Download corners** once | Four files arrive, in the order top-left, top-right, bottom-right, bottom-left, each at least 200 ms after the one before (they are started 250 ms apart); a message begins "4 corner photos downloaded: " |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot, and the saved files.

### CNR-11.2 Share corners puts all four photos in one share sheet   [auto: phone]
Script only
Stand-in: a script stands in for the share sheet and records the files it is handed; no case uses a desktop browser's own share sheet (the iPhone's is CNR-05.1).

Before you start:
- Device and browser: a phone-width window
- Build: the build under test, opened with `?cornerShots.upscaleTargetPx=0` (index.html?cornerShots.upscaleTargetPx=0)
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Corner shots** in the bottom row of buttons | The Corner shots sheet rises, with **1 sheet** selected |
| 2 | Tap **4 photos** | **4 photos** is selected |
| 3 | Tap **Share corners** once | The share sheet is handed once, with four JPEG files: the -tl, -tr, -br and -bl shots |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### CNR-11.3 On an iPhone, Download corners saves all four photos to Files   [phone]
Before you start:
- Device and browser: an iPhone, Safari
- Build: the build under test on the UAT site, https://rberrill.github.io/p1hunt_card_finisher_uat/
- Browser data: none for this site (a private tab, or the site's data cleared in Settings › Safari)
- Photo: 01_chrome_flat_black.JPEG from samples/ (AirDrop it to the phone or save it to Photos first)
- Starting screen: the photo open, on the Export step

The Upscale question is asked in this case: each corner is 156 px, under 2000 px. Safari's downloads go to the folder named in Settings › Safari › Downloads (Downloads, in iCloud Drive, unless it was changed).

Accept Safari's downloads (a named action): each time Safari asks whether to download a file, tap **Download**, until it asks no more.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Corner shots** in the bottom row of buttons | The Corner shots sheet rises |
| 2 | Tap **4 photos** | **4 photos** is selected (white) |
| 3 | Tap **Download corners** | The question box (the box over the dimmed photo with a question and buttons) asks "Upscale to 2000 px?" |
| 4 | Tap **No** | A message begins "4 corner photos downloaded: " |
| 5 | Accept Safari's downloads | Safari asks nothing more |
| 6 | Open the Files app and go to the downloads folder | Four new files are there: 01_chrome_flat_black-corner-tl.jpg, -corner-tr.jpg, -corner-br.jpg and -corner-bl.jpg |
| 7 | Tap 01_chrome_flat_black-corner-tl.jpg | It opens: a square close-up of the card's top-left corner |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, how many times Safari asked, a screenshot (press the side button and volume up together).

## CNR-12 The export settings carry over

The format, Quality and fill follow the Export settings; the applied levels are in, and the logo never is.

- Risk: high
- Check: script, saved file
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#exportFormat`, `#quality`, `#fill`
- Source: `js/app/corner-shots.js` (`renderAndSave`, `renderShot`, `encodeSheet`); `js/app/export.js` (`renderWarped`, `encodeCanvas`)
- Cases: 4

### CNR-12.1 The sheet is saved in the format chosen on Export   [auto: phone, webkit]
Before you start:
- Device and browser: any; a phone-width window, with downloads saved to a folder you can open
- Build: the build under test, opened with `?cornerShots.upscaleTargetPx=0` (index.html?cornerShots.upscaleTargetPx=0)
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step

**Save the corners** is the named action defined at the top of this file: **Corner shots**, **Download corners**, then the sheet's **×**.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **PNG** | **PNG** is selected |
| 2 | Save the corners | A PNG file is saved, 01_chrome_flat_black-corners.png, of 314 × 314 px |
| 3 | Tap **WebP** | **WebP** is selected |
| 4 | Save the corners | A WebP file is saved, 01_chrome_flat_black-corners.webp |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot, and the saved files.

### CNR-12.2 A lower Quality gives a smaller sheet   [auto: phone, webkit]
Before you start:
- Device and browser: any; a phone-width window, with downloads saved to a folder you can open
- Build: the build under test, opened with `?cornerShots.upscaleTargetPx=0` (index.html?cornerShots.upscaleTargetPx=0)
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step

**Save the corners** is the named action defined at the top of this file: **Corner shots**, **Download corners**, then the sheet's **×**.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap the options tab (the small tab with an up arrow on the top edge of the controls) | **Export options** rise; the **Quality** row reads 92% |
| 2 | Drag the **Quality** slider's knob all the way to the right, and let go | The **Quality** row reads 100% |
| 3 | Tap the **×** at the top right of **Export options** | The options go down |
| 4 | Save the corners | A JPEG sheet is saved |
| 5 | Tap the options tab | **Export options** rise; the **Quality** row reads 100% |
| 6 | Drag the **Quality** slider's knob all the way to the left, and let go | The **Quality** row reads 50% |
| 7 | Tap the **×** at the top right of **Export options** | The options go down |
| 8 | Save the corners | A second JPEG sheet is saved, of the same size in px as the first and a smaller file |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot, and the saved files.

### CNR-12.3 Applied levels are in the shots, unapplied ones are not   [auto: phone]
Before you start:
- Device and browser: any; a phone-width window, with downloads saved to a folder you can open and a way to compare two files byte for byte
- Build: the build under test, opened with `?cornerShots.upscaleTargetPx=0` (index.html?cornerShots.upscaleTargetPx=0)
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step

**Save the corners** is the named action defined at the top of this file: **Corner shots**, **Download corners**, then the sheet's **×**.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Save the corners | Sheet A is saved |
| 2 | Tap **Levels** in the step tabs (the six tabs along the bottom) | The Levels step shows, with **Auto** among its tools |
| 3 | Tap **Auto** | **Apply** is no longer greyed out |
| 4 | Tap **Export** in the step tabs | The Export step shows |
| 5 | Save the corners | Sheet B is saved, byte for byte the same as sheet A: the levels not yet applied are not in it |
| 6 | Tap **Levels** in the step tabs | The Levels step shows, **Apply** still live |
| 7 | Tap **Apply** | **Apply** and **Discard** are greyed out |
| 8 | Tap **Export** in the step tabs | The Export step shows |
| 9 | Save the corners | Sheet C is saved, and it differs from sheet A |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot, and the saved files.

### CNR-12.4 The logo is never in the shots   [auto: phone]
Before you start:
- Device and browser: any; a phone-width window, with downloads saved to a folder you can open and a way to compare two files byte for byte
- Build: the build under test, opened with `?cornerShots.upscaleTargetPx=0` (index.html?cornerShots.upscaleTargetPx=0)
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/; the logo green-logo.png from tests/fixtures/ (a solid green square)
- Starting screen: the photo open, on the Export step, no logo

**Save the corners** is the named action defined at the top of this file: **Corner shots**, **Download corners**, then the sheet's **×**.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Save the corners | Sheet A is saved |
| 2 | Tap **Overlay** in the step tabs (the six tabs along the bottom) | The Overlay step shows, with **Add logo** |
| 3 | Tap **Add logo** | The file picker opens |
| 4 | Choose green-logo.png | A green square shows in the middle of the photo |
| 5 | Tap the top-left ring (the white ring with a dot near the photo's top-left corner) | The green square moves to the photo's top-left corner, over the card's top-left corner |
| 6 | Tap **Export** in the step tabs | The Export step shows, the green square still at the top left of the photo |
| 7 | Save the corners | Sheet B is saved, byte for byte the same as sheet A: the logo is not in its top-left tile |

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
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Corner shots** in the bottom row of buttons | The Corner shots sheet rises, with **1 sheet** selected |
| 2 | Tap **Download corners** | A file named 01_chrome_flat_black-corners.jpg is saved |
| 3 | Tap **4 photos** | **4 photos** is selected |
| 4 | Tap **Download corners** | Four files are saved: 01_chrome_flat_black-corner-tl.jpg, -corner-tr.jpg, -corner-br.jpg and -corner-bl.jpg |

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
Script only
Stand-in: nothing is replaced; the four shots are made in well under a second here, too short to watch the line, so the script records every value the line is set to.

Before you start:
- Device and browser: a phone-width window
- Build: the build under test, opened with `?cornerShots.upscaleTargetPx=0` (index.html?cornerShots.upscaleTargetPx=0)
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Corner shots** in the bottom row of buttons | The Corner shots sheet rises, with **1 sheet** selected |
| 2 | Tap **4 photos** | **4 photos** is selected |
| 3 | Tap **Download corners** | The thin red line on the sheet's top edge starts at the left, grows to the full width once and never shrinks back on the way, though four files are made |
| 4 | Wait for the four files | The line has gone |

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
Script only
Stand-in: a script stands in for the share sheet and finishes every share, as the iPhone's does after **Save Image**; no case uses a desktop browser's own share sheet.

Before you start:
- Device and browser: a phone-width window
- Build: the build under test, opened with `?cornerShots.upscaleTargetPx=0` (index.html?cornerShots.upscaleTargetPx=0)
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step, no **Next card** shown

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Corner shots** in the bottom row of buttons | The Corner shots sheet rises |
| 2 | Tap **Download corners** | The corner sheet is saved |
| 3 | Tap the **×** at the sheet's top right | The sheet goes down; there is no **Next card** |
| 4 | Tap **Corner shots** | The Corner shots sheet rises |
| 5 | Tap **Share corners** | The share sheet is handed the corner sheet, and finishes |
| 6 | Tap the **×** at the sheet's top right | The sheet goes down; there is no **Next card** |
| 7 | Tap **Download** | The question box (the box over the dimmed photo with a question and buttons) asks "Upscale to 2000 px?": the crop is 1074 px |
| 8 | Tap **No** | The photo is saved, and **Next card** shows |

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
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: a pair, the back open on the Export step (open the front, tap **Export**, tap **Add back** and choose the back)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Corner shots** in the bottom row of buttons | The corner size line (under **4 photos** and **1 sheet**) reads "Sheet 306 × 306 px · 152 px corners · JPEG" |
| 2 | Tap **Download corners** | A file named 14_back_portrait_raw_white-corners.jpg is saved, of 306 × 306 px |
| 3 | Tap the **×** at the sheet's top right | The sheet goes down |
| 4 | Tap **Front** in the top bar | **Front** is selected (white) and the front's photo shows |
| 5 | Tap **Corner shots** | The corner size line reads "Sheet 290 × 290 px · 144 px corners · JPEG" |
| 6 | Tap **Download corners** | A file named 14_front_portrait_raw_white-corners.jpg is saved, of 290 × 290 px |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot, and the saved files.
