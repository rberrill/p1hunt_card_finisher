# How long things take

How long the operations a listing waits on take, each timed on its own so a slowdown shows.

The automated cases hold each time to the limit ruling R44 gives: three times the median of five runs on the development PC, measured on 16 November 2026. The phone cases measure the same operations on a real iPhone; they have no limit yet, and Rich sets one from what they measure.

## PERF-01 A photo's preview appears

From choosing a photo to seeing it on screen, ready to edit.

- Risk: medium
- Check: script; phone (the time on a real iPhone)
- Limit: 1,250 ms (ruling R44)
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `app.loadDurationMs`, `" loaded + previewed in "`, `"Loading…"`
- Source: `js/app/state.js` (`openFile`)
- Cases: 2

### PERF-01.1 A 15 MP photo is on screen   [auto: phone]
Limit (ruling R44): 1,250 ms, three times the median of five runs on the development PC (407 ms).
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with the developer tools open on the Console
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136-15MP.JPEG, a copy of IMG_9136.JPEG from samples/ enlarged 2.2 times to 3296 × 4616 px (15.2 MP, a phone camera's size). To make it: in any image editor, resize IMG_9136.JPEG to 3296 × 4616 px and save it as a JPEG at quality 85 under that name. The automated test makes its own copy the same way
- Starting screen: the start screen

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Open photo** | The file picker opens |
| 2 | Choose IMG_9136-15MP.JPEG | The photo is on screen, on the Perspective step, ready to edit |
| 3 | Read the Console's line that starts "[card-finisher] IMG_9136-15MP.JPEG" | It reads "[card-finisher] IMG_9136-15MP.JPEG: 3296×4616 loaded + previewed in N ms", and N is at most 1,250 |

Pass: every row's result is seen.
On a fail, record: N, and the machine and browser it ran on.

### PERF-01.2 A 15 MP photo on a real iPhone, timed   [phone]
Limit: none yet. This case measures the time on a real iPhone, and Rich sets the limit from it.
Before you start:
- Device and browser: an iPhone, Safari, and a stopwatch in your other hand (the Clock app on a second phone, or a watch)
- Build: the UAT site, https://rberrill.github.io/p1hunt_card_finisher_uat/
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136-15MP.JPEG, made as PERF-01.1 describes and saved in the iPhone's Photos
- Starting screen: the start screen

Time the opening: start the stopwatch the moment "Loading…" shows on the screen, and stop it the moment the photo shows.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Open photo** | A menu offers Photo Library, Take Photo and Choose File |
| 2 | Tap **Photo Library** | Your photos show |
| 3 | Tap IMG_9136-15MP and time the opening | The photo is on screen, on the Perspective step; the stopwatch shows the time, in seconds |

Pass: every row's result is seen. Write down the stopwatch's time to a tenth of a second, and the iPhone's model and iOS version: Rich sets the limit from it.
On a fail, record: the row number, a screen recording (Control Center, the Screen Recording button).

## PERF-02 Detection finishes

From the start of finding the card to the corners being placed.

- Risk: medium
- Check: script; phone (the time on a real iPhone)
- Limit: 8,750 ms (ruling R44)
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `app.detection.durationMs`, `"Detecting…"`, `"round trip "`
- Source: `js/app/state.js` (`runDetect`), `js/app/adapters.js` (`JSDetector.detect`), `js/app/debug-panel.js` (`updateDebugPanel`)
- Cases: 2

### PERF-02.1 Detection on a 15 MP photo finishes   [auto: desktop]
Limit (ruling R44): 8,750 ms, three times the median of five runs on the development PC (2,903 ms).
Before you start:
- Device and browser: a wide window, 1280 × 800 px. (In a phone-width window the Detection tuning panel covers **Open photo** on the start screen; detection's time doesn't depend on the window's width.)
- Build: the build under test, opened with the link index.html?debug=1, which shows the Detection tuning panel (a panel of detection settings, with the last detection's time below them)
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136-15MP.JPEG, the 15.2 MP copy of IMG_9136.JPEG that PERF-01.1 describes
- Starting screen: the start screen, with the Detection tuning panel at the right

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Click **Open photo** | The file picker opens |
| 2 | Choose IMG_9136-15MP.JPEG | The photo opens; the four round handles move onto the card's corners |
| 3 | Read the first line of the text below the Detection tuning panel's settings | It starts "round trip N ms", and N, from the start of finding the card to the corners being placed, is at most 8,750 |

Pass: every row's result is seen.
On a fail, record: N, and the machine and browser it ran on.

### PERF-02.2 Detection on a 15 MP photo on a real iPhone, timed   [phone]
Limit: none yet. This case measures the time on a real iPhone, and Rich sets the limit from it.
Before you start:
- Device and browser: an iPhone, Safari, and a stopwatch in your other hand (the Clock app on a second phone, or a watch)
- Build: the UAT site, https://rberrill.github.io/p1hunt_card_finisher_uat/ (not the computer over the home network, where detection on the iPhone is many times slower)
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136-15MP.JPEG, made as PERF-01.1 describes and saved in the iPhone's Photos
- Starting screen: the start screen

The line above the controls is the one line of text at the top of the block of buttons under the photo. Time the detection: start the stopwatch the moment that line reads "Detecting…", and stop it the moment it reads NUDGE Corner 1 of 4 again.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Open photo** | A menu offers Photo Library, Take Photo and Choose File |
| 2 | Tap **Photo Library** | Your photos show |
| 3 | Tap IMG_9136-15MP and time the detection | The four round handles sit on the card's corners; the stopwatch shows the time, in seconds |

Pass: every row's result is seen. Write down the stopwatch's time to a tenth of a second, and the iPhone's model and iOS version: Rich sets the limit from it.
On a fail, record: the row number, a screen recording (Control Center, the Screen Recording button).

## PERF-03 Switching sides in a pair

From tapping the other side in **Front** | **Back** to that side being on screen, ready to edit.

- Risk: medium
- Check: script
- Limit: 500 ms (ruling R44)
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `app.switchDurationMs`, `#sideSwitch`, `"[card-finisher] switched to the "`
- Source: `js/app/pair.js` (`switchSide`)
- Cases: 1

### PERF-03.1 Switching sides in a pair   [auto: phone]
Limit (ruling R44): 500 ms, three times the median of five runs on the development PC (152 ms).
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with the developer tools open on the Console
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: a pair: open the front, tap **Export** in the step tabs (the six tabs Perspective to Export, along the bottom), tap **Add back** and choose the back. The back is open, and **Back** has the white pill (the solid white fill on the chosen half of **Front** / **Back** in the top bar)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Front** in the top bar | The front is on screen, ready to edit; **Front** has the white pill |
| 2 | Read the Console's line that starts "[card-finisher] switched" | It reads "[card-finisher] switched to the front in N ms", and N is at most 500 |

Pass: every row's result is seen.
On a fail, record: N, and the machine and browser it ran on.

## PERF-04 An export at Size 1080

From tapping **Download** with Size **1080** to the file being saved. The finished message gives the time.

- Risk: medium
- Check: script
- Limit: 500 ms (ruling R44)
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#exportSize`, `#btnDownload`, `CONFIG.export.longEdgePresets`, `"Exported "`
- Source: `js/app/export.js` (`doExport`, `runExport`, `deliverExport`)
- Cases: 1

### PERF-04.1 An export at Size 1080   [auto: phone]
The finished message is in ruling R79's words. Until R79 is built (BUG-290) the app writes today's ("Exported W × H px in N s."), which this case also accepts: it reads only the time it gives, and MSG-22.1 holds the words.
Limit (ruling R44): 500 ms (0.5 s), three times the median of five runs on the development PC (163 ms).
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, on a computer whose file browser shows a picture's size
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136-15MP.JPEG, the 15.2 MP copy of IMG_9136.JPEG that PERF-01.1 describes (its 1:1 crop, about 3080 px, is over every Size but Original, so no Upscale question is asked)
- Starting screen: the photo open, on the Export step

The finished message shows over the bottom of the photo when the file is saved: "Photo downloaded: W × H px in N s.", where N is the time from the tap on **Download** to the file, in seconds to a tenth.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **1080** under Size | **1080** has the solid white fill |
| 2 | Tap **Download** | No question box comes up; IMG_9136-15MP-straight.jpg is saved; the finished message reads "Photo downloaded: 1080 × 1080 px in N s." |
| 3 | In the file browser, read the saved file's size (on Windows: right-click it, **Properties**, **Details**, Dimensions) | 1080 × 1080 |
| 4 | Compare the finished message's N with the limit in seconds | N is at most 0.5 |

Pass: every row's result is seen.
On a fail, record: the row number, N, and the machine and browser it ran on.

## PERF-05 An export at Size 2000

From tapping **Download** with Size **2000** (the default) to the file being saved. The finished message gives the time.

- Risk: medium
- Check: script
- Limit: 950 ms (ruling R44)
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#exportSize`, `#btnDownload`, `CONFIG.export.longEdge`, `"Exported "`
- Source: `js/app/export.js` (`doExport`, `runExport`, `deliverExport`)
- Cases: 1

### PERF-05.1 An export at Size 2000   [auto: phone]
The finished message is in ruling R79's words. Until R79 is built (BUG-290) the app writes today's ("Exported W × H px in N s."), which this case also accepts: it reads only the time it gives, and MSG-22.1 holds the words.
Limit (ruling R44): 950 ms (0.95 s), three times the median of five runs on the development PC (308 ms).
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, on a computer whose file browser shows a picture's size
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136-15MP.JPEG, the 15.2 MP copy of IMG_9136.JPEG that PERF-01.1 describes
- Starting screen: the photo open, on the Export step

The finished message shows over the bottom of the photo when the file is saved: "Photo downloaded: W × H px in N s.", where N is the time from the tap on **Download** to the file, in seconds to a tenth.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **2000** under Size | **2000** has the solid white fill |
| 2 | Tap **Download** | No question box comes up; IMG_9136-15MP-straight.jpg is saved; the finished message reads "Photo downloaded: 2000 × 2000 px in N s." |
| 3 | In the file browser, read the saved file's size (on Windows: right-click it, **Properties**, **Details**, Dimensions) | 2000 × 2000 |
| 4 | Compare the finished message's N with the limit in seconds | N is at most 0.95 |

Pass: every row's result is seen.
On a fail, record: the row number, N, and the machine and browser it ran on.

## PERF-06 An export at Size 3000

From tapping **Download** with Size **3000** to the file being saved. The finished message gives the time.

- Risk: medium
- Check: script
- Limit: 1,650 ms (ruling R44)
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#exportSize`, `#btnDownload`, `CONFIG.export.longEdgePresets`, `"Exported "`
- Source: `js/app/export.js` (`doExport`, `runExport`, `deliverExport`)
- Cases: 1

### PERF-06.1 An export at Size 3000   [auto: phone]
The finished message is in ruling R79's words. Until R79 is built (BUG-290) the app writes today's ("Exported W × H px in N s."), which this case also accepts: it reads only the time it gives, and MSG-22.1 holds the words.
Limit (ruling R44): 1,650 ms (1.65 s), three times the median of five runs on the development PC (544 ms).
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, on a computer whose file browser shows a picture's size
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136-15MP.JPEG, the 15.2 MP copy of IMG_9136.JPEG that PERF-01.1 describes
- Starting screen: the photo open, on the Export step

The finished message shows over the bottom of the photo when the file is saved: "Photo downloaded: W × H px in N s.", where N is the time from the tap on **Download** to the file, in seconds to a tenth.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **3000** under Size | **3000** has the solid white fill |
| 2 | Tap **Download** | No question box comes up; IMG_9136-15MP-straight.jpg is saved; the finished message reads "Photo downloaded: 3000 × 3000 px in N s." |
| 3 | In the file browser, read the saved file's size (on Windows: right-click it, **Properties**, **Details**, Dimensions) | 3000 × 3000 |
| 4 | Compare the finished message's N with the limit in seconds | N is at most 1.65 |

Pass: every row's result is seen.
On a fail, record: the row number, N, and the machine and browser it ran on.

## PERF-07 An export at Size Original

From tapping **Download** with Size **Original** to the file being saved, at the photo's full resolution. The finished message gives the time.

- Risk: medium
- Check: script
- Limit: 1,650 ms (ruling R44)
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#exportSize`, `#btnDownload`, `"Original"`, `"Exported "`
- Source: `js/app/export.js` (`doExport`, `runExport`, `deliverExport`, `renderFull`)
- Cases: 1

### PERF-07.1 An export at Size Original   [auto: phone]
The finished message is in ruling R79's words. Until R79 is built (BUG-290) the app writes today's ("Exported W × H px in N s."), which this case also accepts: it reads only the time it gives, and MSG-22.1 holds the words.
Limit (ruling R44): 1,650 ms (1.65 s), three times the median of five runs on the development PC (548 ms).
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, on a computer whose file browser shows a picture's size
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136-15MP.JPEG, the 15.2 MP copy of IMG_9136.JPEG that PERF-01.1 describes
- Starting screen: the photo open, on the Export step

The finished message shows over the bottom of the photo when the file is saved: "Photo downloaded: W × H px in N s.", where N is the time from the tap on **Download** to the file, in seconds to a tenth. The size line is the line on Export that gives the saved picture's size in px and its format.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Original** under Size | **Original** has the solid white fill; the size line reads "Output W × H px · JPEG", with W and H each over 3,000 (the crop at the photo's full resolution, about 3080 × 3080) |
| 2 | Tap **Download** | No question box comes up; IMG_9136-15MP-straight.jpg is saved; the finished message reads "Photo downloaded: W × H px in N s.", with the size line's W × H |
| 3 | In the file browser, read the saved file's size (on Windows: right-click it, **Properties**, **Details**, Dimensions) | The size line's W × H |
| 4 | Compare the finished message's N with the limit in seconds | N is at most 1.65 |

Pass: every row's result is seen.
On a fail, record: the row number, W × H, N, and the machine and browser it ran on.

## PERF-08 An upscaled export

From answering **Yes** to the Upscale question to the enlarged, sharpened file being saved.

- Risk: medium
- Check: script
- Limit: 4,750 ms (ruling R44)
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `"Upscale to "`, `CONFIG.upscale.sharpenSigma`, `"Exported "`
- Source: `js/app/export.js` (`askUpscale`, `offeredUpscale`, `runExport`, `sharpenUpscaled`)
- Cases: 1

### PERF-08.1 An upscaled export   [auto: phone]
The finished message is in ruling R79's words. Until R79 is built (BUG-290) the app writes today's ("Exported W × H px in N s."), which this case also accepts: it reads only the time it gives, and MSG-22.1 holds the words.
Limit (ruling R44): 4,750 ms (4.75 s), three times the median of five runs on the development PC (1,576 ms).
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, on a computer whose file browser shows a picture's size
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/ (its 1:1 crop is 1400 × 1400 px)
- Starting screen: the photo open, on the Export step, **2000** selected under Size (the default)

The finished message shows over the bottom of the photo when the file is saved: "Photo downloaded: W × H px in N s.", where N is the time from the tap on **Yes** to the file, in seconds to a tenth. This case times the enlarging and sharpening; UPS-02.2 proves the sharpening itself.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Download** | The question box (the box over the dimmed photo with a question and buttons) asks "Upscale to 2000 px?" |
| 2 | Tap **Yes** | IMG_9136-straight.jpg is saved; the finished message reads "Photo downloaded: 2000 × 2000 px in N s." |
| 3 | In the file browser, read the saved file's size (on Windows: right-click it, **Properties**, **Details**, Dimensions) | 2000 × 2000 |
| 4 | Compare the finished message's N with the limit in seconds | N is at most 4.75 |

Pass: every row's result is seen.
On a fail, record: the row number, N, and the machine and browser it ran on.

## PERF-09 A full-size Share on the phone

On an iPhone, from tapping **Share** with Size **Original** to the share sheet opening.

- Risk: medium
- Check: phone
- Limit: to be measured
- Layout: phone. Share shows only on a secure page, so this runs on the UAT site.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnShare`, `"Share now"`, `"Original"`
- Source: `js/app/export.js` (`doExport`, `runExport`, `deliverExport`, `shareExport`, `shareFiles`, `sharePending`)
- Cases: 2

### PERF-09.1 A Share at Original on a real iPhone, timed   [phone]
The finished message is in ruling R79's words. Until R79 is built (BUG-290) the app writes today's ("Exported W × H px in N s."), which this case also accepts: it reads only the time it gives, and MSG-22.2 holds the words.
Limit: none yet. This case measures the time on a real iPhone, and Rich sets the limit from it.
Before you start:
- Device and browser: an iPhone, Safari
- Build: the UAT site, https://rberrill.github.io/p1hunt_card_finisher_uat/ (a secure page, so **Share** shows)
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from your photos (copied from samples/)
- Starting screen: the photo open, on the Export step

The size line is the line on Export that gives the saved picture's size in px and its format. The finished message shows over the bottom of the photo once the picture is shared: "Photo shared: W × H px in N s.", where N is the time from the tap on **Share** to the share sheet being asked to open, in seconds to a tenth.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Original** under Size | **Original** has the solid white fill; the size line reads "Output W × H px · JPEG" |
| 2 | Tap **Share** | The iPhone's share sheet rises from the bottom of the screen |
| 3 | Tap **Save Image** in the share sheet | The share sheet closes; the finished message reads "Photo shared: W × H px in N s.", with the size line's W × H |

Pass: every row's result is seen. Write down N, and the iPhone's model and iOS version: Rich sets the limit from it.
On a fail, record: the row number, a screen recording (Control Center, the Screen Recording button).

### PERF-09.2 A Share at Original that needs Share now, timed   [phone]
The words before "Tap Share now…" are the finished message's, which ruling R79 rewords (BUG-290); R79 doesn't say how the message reads while the share waits, so this case reads only the size, the time and the sentence added.
Waiting on find-out Q-09: which photo makes Safari refuse the share after a slow save, so that the red **Share** button turns to **Share now**. The case names that photo once Rich has found it; until then it can't be run.
Limit: none yet. This case measures the time on a real iPhone, and Rich sets the limit from it.
Before you start:
- Device and browser: an iPhone, Safari
- Build: the UAT site, https://rberrill.github.io/p1hunt_card_finisher_uat/ (a secure page, so **Share** shows)
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: the photo find-out Q-09 names, in your photos
- Starting screen: the photo open, on the Export step

The size line is the line on Export that gives the saved picture's size in px and its format. Here the finished message shows over the bottom of the photo when the picture is ready, before the share sheet: it gives the size (W × H px) and the time, N s, then reads "Tap Share now to open the share sheet.", where N is the time from the tap on **Share**, in seconds to a tenth.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Original** under Size | **Original** has the solid white fill; the size line reads "Output W × H px · JPEG" |
| 2 | Tap **Share** | A thin red line on the top edge of the controls grows from left to right; then the red button reads **Share now**, and the finished message gives the size line's W × H and the time, then reads "Tap Share now to open the share sheet." |
| 3 | Tap **Share now** | The iPhone's share sheet rises from the bottom of the screen |
| 4 | Tap **Save Image** in the share sheet | The share sheet closes; **Share now** reads **Share** again |

Pass: every row's result is seen. Write down N, and the iPhone's model and iOS version: Rich sets the limit from it.
On a fail, record: the row number, a screen recording (Control Center, the Screen Recording button).
