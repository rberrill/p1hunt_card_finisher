# How long things take

How long the operations a listing waits on take, each timed on its own so a slowdown shows.

## PERF-01 A photo's preview appears

From choosing a photo to seeing it on screen, ready to edit.

- Risk: medium
- Check: script
- Limit: to be measured, then proposed for Rich's approval
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `app.loadDurationMs`, `" loaded + previewed in "`, `"Loading…"`
- Source: `js/app/state.js` (`openFile`)
- Cases: 1

### PERF-01.1 A 15 MP photo is on screen   [auto: phone]
Limit: to be approved by Rich. Provisional: 1,250 ms, three times the median of five runs on the development PC (407 ms).
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with the developer tools open on the Console
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/, enlarged 2.2 times to 3296 × 4616 px (15.2 MP, a phone camera's size) and saved as a JPEG at quality 0.85, named IMG_9136-15MP.JPEG. The automated test makes this copy
- Starting screen: the start screen

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Open photo** and choose IMG_9136-15MP.JPEG | The photo is on screen, ready to edit |
| 2 | Read the Console's line "[card-finisher] IMG_9136-15MP.JPEG: 3296×4616 loaded + previewed in N ms" | N is at most the limit |

Pass: every row's result is seen.
On a fail, record: N, and the machine and browser it ran on.

## PERF-02 Detection finishes

From the start of finding the card to the corners being placed.

- Risk: medium
- Check: script
- Limit: to be measured, then proposed for Rich's approval
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `app.detection.durationMs`, `"Detecting…"`, `"round trip "`
- Source: `js/app/state.js` (`runDetect`), `js/app/adapters.js` (`JSDetector.detect`)
- Cases: 1

### PERF-02.1 Detection on a 15 MP photo finishes   [auto: phone]
Limit: to be approved by Rich. Provisional: 8,750 ms, three times the median of five runs on the development PC (2,903 ms).
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, opened with the link index.html?debug=1 to read the time
- Build: the build under test
- Photo: IMG_9136-15MP.JPEG, the 15.2 MP copy of IMG_9136.JPEG from samples/ that PERF-01.1 describes
- Starting screen: the start screen

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Open photo** and choose the photo | The card's corners are placed |
| 2 | Read the tuning panel's first line, "round trip N ms" | N, from the start of finding the card to the corners being placed, is at most the limit |

With the tuning panel open, detection also gathers what the panel draws, so a person's N can be a little over the automated test's, which runs without it.

Pass: every row's result is seen.
On a fail, record: N, and the machine and browser it ran on.

## PERF-03 Switching sides in a pair

From tapping the other side in **Front** | **Back** to that side being on screen, ready to edit.

- Risk: medium
- Check: script
- Limit: to be measured, then proposed for Rich's approval
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `app.switchDurationMs`, `#sideSwitch`, `"[card-finisher] switched to the "`
- Source: `js/app/pair.js` (`switchSide`)
- Cases: 1

### PERF-03.1 Switching sides in a pair   [auto: phone]
Limit: to be approved by Rich. Provisional: 500 ms, three times the median of five runs on the development PC (152 ms).
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with the developer tools open on the Console
- Build: the build under test
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: a pair: open the front, tap **Export**, tap **Add back** and choose the back

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Front** in the top bar | The front is on screen, ready to edit |
| 2 | Read the Console's line "[card-finisher] switched to the front in N ms" | N is at most the limit |

Pass: every row's result is seen.
On a fail, record: N, and the machine and browser it ran on.

## PERF-04 An export at Size 1080

From tapping **Download** with Size **1080** to the file being saved. The finished message gives the time.

- Risk: medium
- Check: script
- Limit: to be measured, then proposed for Rich's approval
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#exportSize`, `#btnDownload`, `CONFIG.export.longEdgePresets`, `"Exported "`
- Source: `js/app/export.js` (`doExport`, `runExport`, `deliverExport`)
- Cases: 1

### PERF-04.1 An export at Size 1080   [auto: phone]
Limit: to be approved by Rich. Provisional: 500 ms, three times the median of five runs on the development PC (163 ms).
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: IMG_9136-15MP.JPEG, the 15.2 MP copy of IMG_9136.JPEG from samples/ that PERF-01.1 describes (its 1:1 crop, about 3080 px, is over every Size but Original, so no Upscale question is asked)
- Starting screen: the photo open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **1080** under Size | **1080** is selected |
| 2 | Tap **Download** | IMG_9136-15MP-straight.jpg is saved with no question first; the message reads "Exported 1080 × 1080 px in N s." |
| 3 | Compare the time from the tap to the file with the limit (the message's N, in seconds, is that time) | It is at most the limit |

Pass: every row's result is seen.
On a fail, record: the time, and the machine and browser it ran on.

## PERF-05 An export at Size 2000

From tapping **Download** with Size **2000** (the default) to the file being saved. The finished message gives the time.

- Risk: medium
- Check: script
- Limit: to be measured, then proposed for Rich's approval
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#exportSize`, `#btnDownload`, `CONFIG.export.longEdge`, `"Exported "`
- Source: `js/app/export.js` (`doExport`, `runExport`, `deliverExport`)
- Cases: 1

### PERF-05.1 An export at Size 2000   [auto: phone]
Limit: to be approved by Rich. Provisional: 950 ms, three times the median of five runs on the development PC (308 ms).
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: IMG_9136-15MP.JPEG, the 15.2 MP copy of IMG_9136.JPEG from samples/ that PERF-01.1 describes
- Starting screen: the photo open, on the Export step, **2000** selected under Size (the default)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Download** | IMG_9136-15MP-straight.jpg is saved with no question first; the message reads "Exported 2000 × 2000 px in N s." |
| 2 | Compare the time from the tap to the file with the limit | It is at most the limit |

Pass: every row's result is seen.
On a fail, record: the time, and the machine and browser it ran on.

## PERF-06 An export at Size 3000

From tapping **Download** with Size **3000** to the file being saved. The finished message gives the time.

- Risk: medium
- Check: script
- Limit: to be measured, then proposed for Rich's approval
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#exportSize`, `#btnDownload`, `CONFIG.export.longEdgePresets`, `"Exported "`
- Source: `js/app/export.js` (`doExport`, `runExport`, `deliverExport`)
- Cases: 1

### PERF-06.1 An export at Size 3000   [auto: phone]
Limit: to be approved by Rich. Provisional: 1,650 ms, three times the median of five runs on the development PC (544 ms).
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: IMG_9136-15MP.JPEG, the 15.2 MP copy of IMG_9136.JPEG from samples/ that PERF-01.1 describes
- Starting screen: the photo open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **3000** under Size | **3000** is selected |
| 2 | Tap **Download** | IMG_9136-15MP-straight.jpg is saved with no question first; the message reads "Exported 3000 × 3000 px in N s." |
| 3 | Compare the time from the tap to the file with the limit | It is at most the limit |

Pass: every row's result is seen.
On a fail, record: the time, and the machine and browser it ran on.

## PERF-07 An export at Size Original

From tapping **Download** with Size **Original** to the file being saved, at the photo's full resolution. The finished message gives the time.

- Risk: medium
- Check: script
- Limit: to be measured, then proposed for Rich's approval
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#exportSize`, `#btnDownload`, `"Original"`, `"Exported "`
- Source: `js/app/export.js` (`doExport`, `runExport`, `deliverExport`, `renderFull`)
- Cases: 1

### PERF-07.1 An export at Size Original   [auto: phone]
Limit: to be approved by Rich. Provisional: 1,650 ms, three times the median of five runs on the development PC (548 ms).
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: IMG_9136-15MP.JPEG, the 15.2 MP copy of IMG_9136.JPEG from samples/ that PERF-01.1 describes
- Starting screen: the photo open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Original** under Size | **Original** is selected |
| 2 | Tap **Download** | IMG_9136-15MP-straight.jpg is saved at the crop's full resolution, with no question first |
| 3 | Compare the time from the tap to the file with the limit | It is at most the limit |

Pass: every row's result is seen.
On a fail, record: the time, and the machine and browser it ran on.

## PERF-08 An upscaled export

From answering **Yes** to the Upscale question to the enlarged, sharpened file being saved.

- Risk: medium
- Check: script
- Limit: to be measured, then proposed for Rich's approval
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `"Upscale to "`, `CONFIG.upscale.sharpenSigma`, `"Exported "`
- Source: `js/app/export.js` (`askUpscale`, `offeredUpscale`, `runExport`, `sharpenUpscaled`)
- Cases: 1

### PERF-08.1 An upscaled export   [auto: phone]
Limit: to be approved by Rich. Provisional: 4,750 ms, three times the median of five runs on the development PC (1,576 ms).
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/ (its 1:1 crop is 1400 × 1400 px)
- Starting screen: the photo open, on the Export step, **2000** selected under Size

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Download** | A card asks "Upscale to 2000 px?" |
| 2 | Tap **Yes** | IMG_9136-straight.jpg is saved, enlarged to 2000 × 2000 px and sharpened |
| 3 | Compare the time from the tap on **Yes** to the file with the limit | It is at most the limit |

Pass: every row's result is seen.
On a fail, record: the time, and the machine and browser it ran on.

## PERF-09 A full-size Share on the phone

On an iPhone, from tapping **Share** with Size **Original** to the share sheet opening.

- Risk: medium
- Check: phone
- Limit: to be measured, then proposed for Rich's approval
- Layout: phone. Share shows only on a secure page, so this runs on the live site.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnShare`, `"Share now"`, `"Original"`
- Source: `js/app/export.js` (`doExport`, `runExport`, `deliverExport`, `shareExport`, `shareFiles`)
- Cases: 1

### PERF-09.1 A full-size Share on the phone   [phone]
Limit: to be approved by Rich. Not yet measured: it needs a real iPhone on the live site.
Before you start:
- Device and browser: an iPhone, Safari, and a stopwatch (or a screen recording to time afterwards)
- Build: the live site, https://rberrill.github.io/p1hunt_card_finisher/ (Share shows only on a secure page)
- Photo: a photo of a card taken with the iPhone's camera, as it comes from the photo library (about 12 MP or more)
- Starting screen: the photo open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Original** under Size | **Original** is selected |
| 2 | Tap **Share** and start timing | A line along the top edge of the controls shows the export's progress |
| 3 | Stop timing when the share sheet opens (if the button turns to **Share now** first, tap it and stop timing when the sheet opens) | The share sheet shows the photo; the time is at most the limit once Rich has set one |

Pass: every row's result is seen.
On a fail, record: the time, whether **Share now** was needed, and the iPhone's model and iOS version.
