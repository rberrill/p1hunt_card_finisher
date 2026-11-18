# The Upscale question

The question asked before saving a file smaller than the chosen size, and what each answer does, for a single photo, a pair and the corner shots.

The single-photo cases use 01_chrome_flat_black.JPEG, whose crop at its own resolution is 1074 × 1074 px, under every size but **Original**; its card is found the same way in every browser. The pair cases use 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG; their sizes are as Chromium finds the cards (WebKit finds the front's card slightly smaller).

The question shows in the question box: the box that appears over the dimmed photo with a question and two or three buttons.

## UPS-01 Asked for a small single photo

For a single photo, **Download**, **Share** and **Copy** first ask **Upscale to {Size} px?** when a size is chosen and the saved file's long edge would be smaller than it.

- Risk: high
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#pairPrompt`, "Upscale to ", "The crop is "
- Source: `js/app/export.js` (`doExport`, `offeredUpscale`, `askUpscale`)
- Cases: 1

### UPS-01.1 Download, Share and Copy each ask first, naming the size and the crop   [auto: phone]
Before you start:
- Device and browser: a phone-width window, in a browser that shows **Share** and **Copy** on Export (Safari on an iPhone does, on the UAT site). In the automated case a stand-in for the share sheet makes **Share** show
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step, **2000** selected

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Download** | The question box (the box over the dimmed photo with a question and buttons) asks "Upscale to 2000 px?" and reads "The crop is 1074 × 1074 px at the photo’s resolution." |
| 2 | Tap **Cancel** | The question box closes |
| 3 | Tap **Share** | The question box asks "Upscale to 2000 px?" and reads "The crop is 1074 × 1074 px at the photo’s resolution." |
| 4 | Tap **Cancel** | The question box closes |
| 5 | Tap **Copy** | The question box asks "Upscale to 2000 px?" and reads "The crop is 1074 × 1074 px at the photo’s resolution." |
| 6 | Tap **Cancel** | The question box closes |
| 7 | Tap **1080** | **1080** is selected (white) |
| 8 | Tap **Download** | The question box asks "Upscale to 1080 px?" and reads "The crop is 1074 × 1074 px at the photo’s resolution." |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## UPS-02 Yes

**Yes** saves at the chosen size, resampled bicubic whatever Interpolation says, and sharpened before the logo is drawn.

- Risk: high
- Check: script, saved file
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnPromptFirst`, `CONFIG.upscale.sharpenSigma`, `CONFIG.upscale.sharpenAmount`, `CONFIG.upscale.sharpenThreshold`
- Source: `js/app/export.js` (`renderFull`, `exportGeometry`, `upscaleRenderState`, `sharpenUpscaled`, `sharpenOptions`)
- Cases: 3

EXP-36.2 (in `export.md`) shows that an upscale is bicubic whatever Interpolation says.

### UPS-02.1 Yes saves the photo at the chosen size   [auto: phone, webkit]
Before you start:
- Device and browser: any; a phone-width window, with downloads saved to a folder you can open
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step, **2000** selected

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Download** | The question box (the box over the dimmed photo with a question and buttons) asks "Upscale to 2000 px?" |
| 2 | Tap **Yes** | The question box closes and a file of 2000 × 2000 px is saved; a message begins "Photo downloaded: 2000 × 2000 px in" |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot, and the saved file.

### UPS-02.2 Yes sharpens the enlarged photo   [auto: phone]
Before you start:
- Device and browser: any; a phone-width window, with downloads saved to a folder you can open and a way to compare two files byte for byte
- Build: the build under test, opened twice: first as it is, then with `?upscale.sharpenAmount=0` added to its address (index.html?upscale.sharpenAmount=0), which turns the sharpening off
- Browser data: none for this site at the start (a private window, or the site's data cleared). The app keeps the open photo and its edits on the device, so the second opening offers to resume them
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open in the build as it is, on the Export step, **2000** selected

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Download** | The question box (the box over the dimmed photo with a question and buttons) asks "Upscale to 2000 px?" |
| 2 | Tap **Yes** | File A, of 2000 × 2000 px, is saved |
| 3 | Wait two seconds, then open the build with `?upscale.sharpenAmount=0` added to its address | The start screen asks "Resume 01_chrome_flat_black.JPEG?", with **Resume** and **Start fresh** |
| 4 | Tap **Resume** | The photo opens on the Export step, with **2000** selected |
| 5 | Tap **Download** | The question box asks "Upscale to 2000 px?" |
| 6 | Tap **Yes** | File B, of 2000 × 2000 px, is saved |
| 7 | Compare files A and B | They differ: only A was sharpened |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot, and the saved files.

### UPS-02.3 The logo goes on after the sharpening   [auto: phone]
Before you start:
- Device and browser: any; a phone-width window, with downloads saved to a folder you can open and an image editor that compares pixels
- Build: the build under test, opened twice: first as it is, then with `?upscale.sharpenAmount=0` added to its address (index.html?upscale.sharpenAmount=0), which turns the sharpening off
- Browser data: none for this site at the start (a private window, or the site's data cleared). The app keeps the open photo and its edits, logo included, on the device, so the second opening offers to resume them
- Photo: 01_chrome_flat_black.JPEG from samples/; the logo app-icon-logo.png from tests/fixtures/ (the app's icon: an opaque square with a drawing in it)
- Starting screen: the photo open in the build as it is, on the Overlay step, no logo

"Add the logo": tap **Add logo** (the red button under the photo), then choose app-icon-logo.png in the file picker.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Add the logo | The logo shows in the middle of the photo |
| 2 | Tap **Export** in the step tabs (the six tabs along the bottom) | The Export step shows, with **2000** selected |
| 3 | Tap **PNG** | **PNG** is selected (white) |
| 4 | Tap **Download** | The question box (the box over the dimmed photo with a question and buttons) asks "Upscale to 2000 px?" |
| 5 | Tap **Yes** | PNG file A, of 2000 × 2000 px, is saved, with the logo in its middle |
| 6 | Wait two seconds, then open the build with `?upscale.sharpenAmount=0` added to its address | The start screen asks "Resume 01_chrome_flat_black.JPEG?", with **Resume** and **Start fresh** |
| 7 | Tap **Resume** | The photo opens on the Export step, the logo in its middle, **PNG** selected |
| 8 | Tap **Download** | The question box asks "Upscale to 2000 px?" |
| 9 | Tap **Yes** | PNG file B, of 2000 × 2000 px, is saved |
| 10 | Compare files A and B, pixel by pixel | Inside the logo (leaving out a 4 px border at its edges, where it blends with the photo) every pixel is the same in both; in the photo away from it, they differ |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot, and the saved files.

## UPS-03 No, and Cancel

**No** saves at the real size; **Cancel**, a tap outside the question box or Escape saves nothing.

- Risk: medium
- Check: script, saved file
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnPromptSecond`, `#btnPromptCancel`, `key:Escape`
- Source: `js/app/export.js` (`askUpscale`); `js/app/parts/alert-card.js` (`answerAlert`, `hideAlert`)
- Cases: 3

### UPS-03.1 No saves the photo at its own size   [auto: phone]
Before you start:
- Device and browser: any; a phone-width window, with downloads saved to a folder you can open
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step, **2000** selected

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Download** | The question box (the box over the dimmed photo with a question and buttons) asks "Upscale to 2000 px?" |
| 2 | Tap **No** | The question box closes and a file of 1074 × 1074 px is saved; a message begins "Photo downloaded: 1074 × 1074 px in" |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot, and the saved file.

### UPS-03.2 Cancel and a tap outside the question box save nothing   [auto: phone]
Before you start:
- Device and browser: a phone-width window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step, **2000** selected

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Download** | The question box (the box over the dimmed photo with a question and buttons) asks "Upscale to 2000 px?" |
| 2 | Tap **Cancel** | The question box closes; nothing is saved, and no progress line runs along the top edge of the controls |
| 3 | Tap **Download** | The question box asks "Upscale to 2000 px?" again |
| 4 | Tap the dimmed screen above the question box | The question box closes; nothing is saved |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### UPS-03.3 Escape closes the question and saves nothing   [auto: desktop]
Before you start:
- Device and browser: a wide window with a keyboard
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step, **2000** selected

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Click **Download** | The question box (the box over the dimmed photo with a question and buttons) asks "Upscale to 2000 px?" |
| 2 | Press Escape | The question box closes; nothing is saved |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## UPS-04 When it isn't asked

The question is never asked for **Original**, nor when the file is already at or over the chosen size, nor whenever **Yes** would not save a bigger file than **No**: when a link turns `export.allowUpscale` on, or a canvas cap leaves no room to enlarge (ruling R37).

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: 1.10.0
- Anchors: `#exportSize`, `CONFIG.export.allowUpscale`
- Source: `js/app/export.js` (`offeredUpscale`, `isUpscaleBigger`); `js/app/pair.js` (`pairUpscaleOffer`)
- Ruling: R37, widened 16 November. The Upscale question is asked only when **Yes** would save a bigger file than **No**, so not with upscaling already switched on from a link, nor where a canvas cap leaves no room to enlarge. The app does this since 1.10.0.
- Cases: 4

### UPS-04.1 Original never asks   [auto: phone]
Before you start:
- Device and browser: any; a phone-width window, with downloads saved to a folder you can open
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Original** | **Original** is selected (white) |
| 2 | Tap **Download** | No question box (the box over the dimmed photo with a question and buttons) shows; a file of 1074 × 1074 px is saved |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### UPS-04.2 A crop already over the size isn't asked about   [auto: phone]
Before you start:
- Device and browser: any; a phone-width window, with downloads saved to a folder you can open
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/ (its crop is 1400 × 1400 px)
- Starting screen: the photo open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **1080** | **1080** is selected (white) |
| 2 | Tap **Download** | No question box (the box over the dimmed photo with a question and buttons) shows; a file of 1080 × 1080 px is saved |
| 3 | Tap **2000** | **2000** is selected |
| 4 | Tap **Download** | The question box asks "Upscale to 2000 px?" |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### UPS-04.3 With upscaling on from a link, there is no question   [auto: phone]
Before you start:
- Device and browser: any; a phone-width window, with downloads saved to a folder you can open
- Build: the build under test, opened with `?export.allowUpscale=1` (index.html?export.allowUpscale=1)
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step, **2000** selected

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Download** | No question box (the box over the dimmed photo with a question and buttons) shows; a file of 2000 × 2000 px is saved |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### UPS-04.4 With upscaling on from a link, a size the canvas limit holds back isn't asked about either   [auto: phone]
Before you start:
- Device and browser: any; a phone-width window, with downloads saved to a folder you can open
- Build: the build under test, opened with `?export.allowUpscale=1&export.longEdge=12000` (index.html?export.allowUpscale=1&export.longEdge=12000): the output would be 12000 px, and the 16.7 MP canvas limit holds it at 4096 px
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Download** | No question box (the box over the dimmed photo with a question and buttons) shows; a file of 4096 × 4096 px is saved |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## UPS-05 A pair saved Together

For a pair saved **Together**, it is asked when the joined image's long edge is under the chosen size; **Yes** fits that long edge to exactly the size. Where a canvas cap leaves no room to enlarge the joined image, no question is asked (ruling R37).

- Risk: medium
- Check: script, saved file
- Layout: both
- Added: 1.10 baseline
- Changed: 1.10.0
- Anchors: `#pairOutput`, "The image is ", " px at the photos’ resolution."
- Source: `js/app/pair.js` (`pairUpscaleOffer`, `togetherLayout`, `encodeTogether`); `js/app/export.js` (`isUpscaleBigger`); `js/engine.js` (`pairLayout`)
- Ruling: R37, widened 16 November. The Upscale question is asked only when **Yes** would save a bigger file than **No**: where a canvas cap leaves no room to enlarge the joined image, no question is asked. The app does this since 1.10.0. Only a link that lowers a cap brings this about with the sample photos.
- Cases: 2

### UPS-05.1 Together asks about the joined image, and Yes fits its long edge to the size   [auto: phone]
Before you start:
- Device and browser: a phone-width window, with downloads saved to a folder you can open
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: a pair: open the front, tap **Export**, tap **Add back** and choose the back. Then tap **Export**; **Together** and **2000** selected

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Download** | The question box (the box over the dimmed photo with a question and buttons) asks "Upscale to 2000 px?" and reads "The image is 1583 × 1100 px at the photos’ resolution." |
| 2 | Tap **Yes** | One file, 14_front_portrait_raw_white-pair.jpg, is saved: 2000 px wide and about 1390 px tall (within 2 px), the joined image's long edge fitted to 2000 px |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot, and the saved file.

### UPS-05.2 Where a canvas cap leaves no room to enlarge the joined image, no question is asked   [auto: phone]
Before you start:
- Device and browser: a phone-width window, with downloads saved to a folder you can open
- Build: the build under test, opened with `?maxOutputArea=2500000` (index.html?maxOutputArea=2500000), which caps a saved image at 2.5 MP: more than the joined image's 1.74 MP, less than the 2.78 MP it would be at 2000 px
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: a pair, as in UPS-05.1, on the Export step; **Together** and **2000** selected

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Download** | No question box (the box over the dimmed photo with a question and buttons) shows; one file, 14_front_portrait_raw_white-pair.jpg, is saved at 1583 × 1100 px |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot, and the saved file.

## UPS-06 A pair saved Separately

For a pair saved **Separately**, it is asked when either side's file is under the chosen size, and names only the side **Yes** would upscale (both when it would upscale both); **Yes** gives each side that size, and a side already there is not sharpened. Where a canvas cap leaves no room to enlarge either side's file, no question is asked (ruling R37).

- Risk: medium
- Check: script, saved file
- Layout: both
- Added: 1.10 baseline
- Changed: 1.10.0
- Anchors: `#pairOutput`, "The front is ", " px and the back ", " px at the photo’s resolution."
- Source: `js/app/pair.js` (`pairUpscaleOffer`, `separatelyUpscaleText`, `encodeSeparately`, `renderSideInto`); `js/app/export.js` (`isUpscaleBigger`)
- Ruling: R50. The question names only the side **Yes** would upscale ("The front is W × H px at the photo’s resolution.", approved wording, tests/catalog/wording.md); both only when both are under the size. The app does this since 1.10.0. R37, widened 16 November. The Upscale question is asked only when **Yes** would save a bigger file than **No**. The app does this since 1.10.0.
- Cases: 3

### UPS-06.1 Separately names both sides, and Yes gives each the size   [auto: phone]
Before you start:
- Device and browser: a phone-width window, with downloads saved to a folder you can open
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: a pair, as in UPS-05.1, on the Export step; **Separately** and **2000** selected

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Download** | The question box (the box over the dimmed photo with a question and buttons) asks "Upscale to 2000 px?" and reads "The front is 748 × 1047 px and the back 785 × 1100 px at the photos’ resolution." |
| 2 | Tap **Yes** | Two files are saved, 14_front_portrait_raw_white-front.jpg and 14_back_portrait_raw_white-back.jpg, each 2000 px tall |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot, and the saved files.

### UPS-06.2 A side already at the size is saved the same after Yes as after No   [auto: phone]
Before you start:
- Device and browser: a phone-width window, with downloads saved to a folder you can open and a way to compare two files byte for byte
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: a pair, as in UPS-05.1, on the Export step; **Separately** selected

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **1080** | **1080** is selected (white) |
| 2 | Tap **Download** | The question box (the box over the dimmed photo with a question and buttons) asks "Upscale to 1080 px?" and reads "The front is 748 × 1047 px at the photo’s resolution.": the front, 1047 px tall, is under 1080 px; the back is not |
| 3 | Tap **No** | Two files are saved: the front 748 × 1047 px, the back 1080 px tall |
| 4 | Tap **Download** | The question box asks "Upscale to 1080 px?" again |
| 5 | Tap **Yes** | Two more files are saved: the front now 1080 px tall; the back byte for byte the same as after **No** |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot, and the saved files.

### UPS-06.3 Where the canvas limit leaves no room to enlarge either side, no question is asked   [auto: phone]
Before you start:
- Device and browser: a phone-width window, with downloads saved to a folder you can open
- Build: the build under test, opened with `?export.allowUpscale=1&export.longEdge=12000` (index.html?export.allowUpscale=1&export.longEdge=12000): each side's file would be 12000 px tall, and the 16.7 MP canvas limit holds it at 4846 px
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: a pair, as in UPS-05.1, on the Export step; **Separately** selected

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Download** | No question box (the box over the dimmed photo with a question and buttons) shows; two files are saved, 14_front_portrait_raw_white-front.jpg and 14_back_portrait_raw_white-back.jpg, each 3461 × 4846 px |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot, and the saved files.

## UPS-07 Corner shots

For corner shots it is asked when the file (the sheet, or each photo) would be under 2000 px; **Yes** makes the file exactly 2000 px, bicubic and sharpened.

- Risk: medium
- Check: script, saved file
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.cornerShots.upscaleTargetPx`, "Each corner is", "The sheet is"
- Source: `js/app/corner-shots.js` (`saveCornerShots`, `filePx`, `upscaledTilePx`, `renderAndSave`, `renderShot`); `js/engine.js` (`cornerSheetTilePx`)
- Cases: 4

### UPS-07.1 For the sheet it names the sheet's size, and Yes saves a 2000 px sheet   [auto: phone, webkit]
Before you start:
- Device and browser: any; a phone-width window, with downloads saved to a folder you can open
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/ (its sheet is 314 × 314 px)
- Starting screen: the photo open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Corner shots** in the bottom row of buttons | The Corner shots sheet rises, with **1 sheet** selected (white) |
| 2 | Tap **Download corners** | The question box (the box over the dimmed photo with a question and buttons) asks "Upscale to 2000 px?" and reads "The sheet is 314 px at the photo’s resolution." |
| 3 | Tap **Yes** | One file of exactly 2000 × 2000 px is saved; a message begins "Corner sheet downloaded: 2000 × 2000 px in" |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot, and the saved file.

### UPS-07.2 For four photos it names each corner's size, and Yes saves four 2000 px photos   [auto: phone]
Before you start:
- Device and browser: any; a phone-width window, with downloads saved to a folder you can open
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/ (each corner is 156 px)
- Starting screen: the photo open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Corner shots** in the bottom row of buttons | The Corner shots sheet rises, with **1 sheet** selected (white) |
| 2 | Tap **4 photos** | **4 photos** is selected |
| 3 | Tap **Download corners** | The question box (the box over the dimmed photo with a question and buttons) asks "Upscale to 2000 px?" and reads "Each corner is 156 px at the photo’s resolution." |
| 4 | Tap **Yes** | Four files of 2000 × 2000 px are saved |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot, and the saved files.

### UPS-07.3 An upscaled sheet is bicubic whatever Interpolation says   [auto: phone]
Before you start:
- Device and browser: any; a phone-width window, with downloads saved to a folder you can open and a way to compare two files byte for byte
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step

"Save the sheet enlarged": tap **Corner shots** in the bottom row of buttons, tap **Download corners**, then tap **Yes** in the question box that asks "Upscale to 2000 px?".

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Corner shots** in the bottom row of buttons | The Corner shots sheet rises, with **1 sheet** selected (white) |
| 2 | Tap **Download corners** | The question box (the box over the dimmed photo with a question and buttons) asks "Upscale to 2000 px?" |
| 3 | Tap **Yes** | Sheet A, of 2000 × 2000 px, is saved |
| 4 | Tap the **×** at the Corner shots sheet's top right | The sheet goes down |
| 5 | Tap the options tab (the small tab with an up arrow on the top edge of the controls) | **Export options** rise; the **Interpolation** row reads Bilinear |
| 6 | Tap the **Interpolation** row | A list offers **Bilinear** and **Bicubic (sharper, slower)** |
| 7 | Choose **Bicubic (sharper, slower)** | The row reads Bicubic |
| 8 | Tap the **×** at the top right of **Export options** | The options go down |
| 9 | Save the sheet enlarged | Sheet B, of 2000 × 2000 px, is saved |
| 10 | Compare sheets A and B | They are the same, byte for byte: both were enlarged bicubic |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot, and the saved files.

### UPS-07.4 An upscaled sheet is sharpened   [auto: phone]
Before you start:
- Device and browser: any; a phone-width window, with downloads saved to a folder you can open and a way to compare two files byte for byte
- Build: the build under test, opened twice: first as it is, then with `?upscale.sharpenAmount=0` added to its address (index.html?upscale.sharpenAmount=0), which turns the sharpening off
- Browser data: none for this site at the start (a private window, or the site's data cleared). The app keeps the open photo and its edits on the device, so the second opening offers to resume them
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open in the build as it is, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Corner shots** in the bottom row of buttons | The Corner shots sheet rises, with **1 sheet** selected (white) |
| 2 | Tap **Download corners** | The question box (the box over the dimmed photo with a question and buttons) asks "Upscale to 2000 px?" |
| 3 | Tap **Yes** | Sheet A, of 2000 × 2000 px, is saved |
| 4 | Wait two seconds, then open the build with `?upscale.sharpenAmount=0` added to its address | The start screen asks "Resume 01_chrome_flat_black.JPEG?", with **Resume** and **Start fresh** |
| 5 | Tap **Resume** | The photo opens on the Export step |
| 6 | Tap **Corner shots** | The Corner shots sheet rises, with **1 sheet** selected |
| 7 | Tap **Download corners** | The question box asks "Upscale to 2000 px?" |
| 8 | Tap **Yes** | Sheet B, of 2000 × 2000 px, is saved |
| 9 | Compare sheets A and B | They differ: only A was sharpened |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot, and the saved files.

## UPS-08 Over the open Corner shots sheet

On a phone, the question for corner shots sits above the open Corner shots sheet.

- Risk: low
- Check: script
- Layout: phone. A wide screen lists the sheet in the side panel, and the question box sits over the photo.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#pairPrompt`, `#cornerShotsSheet`
- Source: `css/app.css` (the alert card part's rules); `js/app/pair.js` (`showPrompt`)
- Cases: 1

### UPS-08.1 The question sits above the open Corner shots sheet   [auto: phone]
Before you start:
- Device and browser: a phone-width window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Corner shots** in the bottom row of buttons | The Corner shots sheet rises |
| 2 | Tap **Download corners** | The question box (the box over the dimmed photo with a question and buttons) asks "Upscale to 2000 px?" in front of the Corner shots sheet: the whole box shows, and the sheet behind it is dimmed |
| 3 | Tap **Yes** | The question box closes and the sheet is still open, with **Download corners** in view |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## UPS-09 The answer is for one export

The answer counts for one export only: it isn't stored, isn't part of the edits, and isn't asked again for **Share now**.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnShare`, "Share now"
- Source: `js/app/export.js` (`doExport`, `sharePending`)
- Cases: 3

### UPS-09.1 After Yes, the next Download asks again, and Undo has nothing to undo   [auto: phone]
Before you start:
- Device and browser: a phone-width window, with downloads saved to a folder you can open
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/, freshly opened
- Starting screen: the photo open, on the Export step, **2000** selected, **Undo** (the arrow curving left, at the top right) greyed out

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Download** | The question box (the box over the dimmed photo with a question and buttons) asks "Upscale to 2000 px?" |
| 2 | Tap **Yes** | A file of 2000 × 2000 px is saved; **Undo** is still greyed out |
| 3 | Tap **Download** | The question box asks "Upscale to 2000 px?" again |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### UPS-09.2 Share now shares the upscaled photo without asking again   [auto: phone]
Script only
Stand-in: a script stands in for the share sheet and refuses the first share, as Safari does when a share comes too long after the tap. A person can't make a browser refuse, and no case uses a desktop browser's own share sheet.

Before you start:
- Device and browser: a phone-width window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step, **2000** selected

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Share** | The question box (the box over the dimmed photo with a question and buttons) asks "Upscale to 2000 px?" |
| 2 | Tap **Yes** | The share is refused; the red button reads **Share now** |
| 3 | Tap **Share now** | No question is asked; the share sheet is handed the same 2000 × 2000 px file again |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### UPS-09.3 After Yes and a reload, the resumed photo asks again   [auto: phone]
Before you start:
- Device and browser: a phone-width window, with downloads saved to a folder you can open
- Build: the build under test
- Browser data: none for this site at the start (a private window, or the site's data cleared). The app keeps the open photo and its edits on the device, so the reload offers to resume them; the case checks that the answer is not kept with them
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step, **2000** selected

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Download** | The question box (the box over the dimmed photo with a question and buttons) asks "Upscale to 2000 px?" |
| 2 | Tap **Yes** | A file of 2000 × 2000 px is saved |
| 3 | Wait two seconds, then reload the page | The start screen asks "Resume 01_chrome_flat_black.JPEG?", with **Resume** and **Start fresh** |
| 4 | Tap **Resume** | The photo opens on the Export step, with **2000** selected |
| 5 | Tap **Download** | The question box asks "Upscale to 2000 px?" again: the **Yes** was neither stored nor kept with the edits |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## UPS-10 Copy after an answer

After **Yes** or **No**, **Copy** still reaches the clipboard within the tap that answered.

- Risk: medium
- Check: phone
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnCopy`, `#btnPromptFirst`
- Source: `js/app/parts/alert-card.js` (`answerAlert`); `js/app/export.js` (`runExport`, `Exporter.copy`)
- Cases: 2

### UPS-10.1 On an iPhone, Copy after Yes or No reaches the clipboard   [phone]
Waiting on find-out Q-03: where iOS shows a picture's pixel size. Rows 4 and 9 gain the steps that read the pasted picture's size (2000 × 2000 px after **Yes**, 1074 × 1074 px after **No**) once Rich has seen where it shows.

Before you start:
- Device and browser: an iPhone, Safari
- Build: the build under test on the UAT site, https://rberrill.github.io/p1hunt_card_finisher_uat/ (HTTPS; over plain HTTP **Copy** is hidden)
- Browser data: none for this site (a private tab, or the site's data cleared in Settings › Safari)
- Photo: 01_chrome_flat_black.JPEG from samples/ (AirDrop it to the phone or save it to Photos first)
- Starting screen: the photo open, on the Export step, **2000** selected

"Paste into a new note": open the Notes app, tap the new-note button (the square with a pencil, at the bottom right), touch and hold in the empty note, and tap **Paste**.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Copy** | The question box (the box over the dimmed photo with a question and buttons) asks "Upscale to 2000 px?" |
| 2 | Tap **Yes** | The question box closes; a message reads "Photo copied (PNG)." and no message about permission shows |
| 3 | Paste into a new note | The straightened card is pasted into the note |
| 4 | (Waiting on Q-03) Read the pasted picture's size | 2000 × 2000 px |
| 5 | Go back to Safari | The app shows, on the Export step |
| 6 | Tap **Copy** | The question box asks "Upscale to 2000 px?" |
| 7 | Tap **No** | The question box closes; a message reads "Photo copied (PNG)." |
| 8 | Paste into a new note | The straightened card is pasted into the note |
| 9 | (Waiting on Q-03) Read the pasted picture's size | 1074 × 1074 px |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot (press the side button and volume up together).

### UPS-10.2 Copy after Yes puts the enlarged photo on the clipboard   [auto: phone]
Before you start:
- Device and browser: a phone-width window, in a browser that lets the case read the clipboard back (the automated case runs in Chromium only)
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step, **2000** selected

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Copy** | The question box (the box over the dimmed photo with a question and buttons) asks "Upscale to 2000 px?" |
| 2 | Tap **Yes** | A message reads "Photo copied (PNG)."; the clipboard holds a PNG of 2000 × 2000 px |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.
