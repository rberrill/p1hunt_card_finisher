# Export

Saving the finished photo: its size and format, the export options, Share, Download and Copy, what counts as exported, and Next card.

## EXP-01 Choose the size

Tap **1080**, **2000**, **3000** or **Original** to set the long edge of the saved photo. Each change is one undo step.

- Risk: high
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#exportSize`, `CONFIG.export.longEdgePresets`, `CONFIG.export.longEdge`
- Source: `js/app/export-controls.js` (`buildChoiceRow`, `bindExportSettings`, `syncExportControls`)
- Ruling: R5. Undoing a change to an export setting also puts the remembered setting back. The app already does this.
- Cases: 1

### EXP-01.1 The size choices set the long edge, each one undo step   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test, with no settings remembered from before (a private window, or the site's data cleared)
- Photos: IMG_9136.JPEG and IMG_9075.JPEG from samples/
- Starting screen: IMG_9136.JPEG open, on the Export step (tap **Export** in the step bar)

The size line is the line of text under the **Size** and **Format** choices.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the size choices | **2000** is selected (a solid white button); the size line reads Output 1400 × 1400 px · JPEG · full crop, not upscaled |
| 2 | Tap **1080** | **1080** is selected instead; the size line reads Output 1080 × 1080 px · JPEG |
| 3 | Tap **3000** | **3000** is selected; the size line reads Output 1400 × 1400 px · JPEG · full crop, not upscaled |
| 4 | Tap **Original** | **Original** is selected; the size line reads Output 1400 × 1400 px · JPEG |
| 5 | Tap **Undo** (the arrow curving left, at the top right) | **3000** is selected again: one tap was one undo step |
| 6 | Tap **Undo** again | **1080** is selected again |
| 7 | Tap **Open** (the folder at the top left; on a phone it has no label) and choose IMG_9075.JPEG | The new photo opens |
| 8 | Tap **Export** in the step bar | **1080** is selected: the size the undo went back to is the one remembered |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## EXP-02 No size selected for an unlisted long edge

When the edits hold a long edge that isn't one of the four sizes (from an edits file), none of the size choices is selected.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#exportSize`
- Source: `js/app/export-controls.js` (`syncExportControls`); `js/app/parts/segmented-control.js` (`updateSegmented`)
- Cases: 1

### EXP-02.1 An edits file with a 1500 px long edge leaves no size selected   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Edits file: IMG_9136-edits.json, saved from this photo with **Save edits** (in **Export options**), then changed in a text editor so that its line `"longEdge": 2000` reads `"longEdge": 1500`
- Starting screen: the photo open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the size choices | **2000** is selected (a solid white button) |
| 2 | Open **Export options**: on a phone, tap the **Options** tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls | **Save edits** and **Load edits** show |
| 3 | Tap **Load edits** and choose IMG_9136-edits.json | None of **1080**, **2000**, **3000** and **Original** is selected |
| 4 | Look at the size line (under the Size and Format choices) | It reads Output 1400 × 1400 px · JPEG · full crop, not upscaled |
| 5 | Tap **1080** | **1080** is selected; the size line reads Output 1080 × 1080 px · JPEG |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot, and the edits file.

## EXP-03 Choose the format

Tap **JPEG**, **PNG** or **WebP** to set the saved file's format. Each change is one undo step.

- Risk: high
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#exportFormat`, `CONFIG.export.format`
- Source: `js/app/export-controls.js` (`buildChoiceRow`, `bindExportSettings`, `syncExportControls`)
- Ruling: R5. Undoing a change to an export setting also puts the remembered setting back. The app already does this.
- Cases: 1

### EXP-03.1 The format choices set the format, each one undo step   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test, with no settings remembered from before (a private window, or the site's data cleared)
- Photos: IMG_9136.JPEG and IMG_9075.JPEG from samples/
- Starting screen: IMG_9136.JPEG open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the format choices | **JPEG** is selected (a solid white button); the size line under the choices ends · JPEG · full crop, not upscaled |
| 2 | Tap **PNG** | **PNG** is selected instead; the size line reads Output 1400 × 1400 px · PNG · full crop, not upscaled |
| 3 | Tap **WebP** | **WebP** is selected; the size line reads Output 1400 × 1400 px · WEBP · full crop, not upscaled |
| 4 | Tap **Undo** (the arrow curving left, at the top right) | **PNG** is selected again: one tap was one undo step |
| 5 | Tap **Open** (the folder at the top left; on a phone it has no label) and choose IMG_9075.JPEG | The new photo opens |
| 6 | Tap **Export** in the step bar | **PNG** is selected: the format the undo went back to is the one remembered |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## EXP-04 The size line for a single photo

Under the size and format choices, a line reads **Output W × H px · FORMAT**, followed by **· full crop, not upscaled** when the crop is smaller than the chosen size.

- Risk: medium
- Check: script
- Layout: both. On a wide screen the line is always whole; on a phone the "full crop, not upscaled" part is dropped while a note shows under it.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#exportReadout`, `.export-readout-tail`, " · full crop, not upscaled"
- Source: `js/app/export-controls.js` (`syncExportReadout`); `css/app.css` (the phone rules for the Export notes)
- Ruling: R30. With upscaling turned on by a link, the "full crop, not upscaled" part goes. The app differs today.
- Cases: 3

### EXP-04.1 The size line gives the output size and format   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Export step, with **2000** and **JPEG** selected

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the size line, under the **Size** and **Format** choices | It reads Output 1400 × 1400 px · JPEG · full crop, not upscaled (the crop is smaller than 2000 px) |
| 2 | Tap **1080** | It reads Output 1080 × 1080 px · JPEG, with no "full crop, not upscaled" part |
| 3 | Tap **PNG** | It reads Output 1080 × 1080 px · PNG |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### EXP-04.2 While a note shows, a phone drops the "not upscaled" part   [auto: both]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Export step, with **2000** and **JPEG** selected and no note under the size line

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the size line, under the **Size** and **Format** choices | It reads Output 1400 × 1400 px · JPEG · full crop, not upscaled |
| 2 | Open **Export options**: on a phone, tap the **Options** tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls | **Fill outside photo** reads White |
| 3 | Tap **Fill outside photo** and choose **Transparent** | It reads Transparent |
| 4 | Close the options with the **×** at their top right (on a wide screen there is nothing to close) | A note under the size line reads "JPEG has no transparency; empty areas will be white." |
| 5 | Look at the size line | On a phone it reads Output 1400 × 1400 px · JPEG, without "· full crop, not upscaled"; on a wide screen it still reads Output 1400 × 1400 px · JPEG · full crop, not upscaled |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### EXP-04.3 With upscaling on from a link, the size line has no "not upscaled" part   [auto: phone]
Written to ruling R30; it fails until R30 is built (BUG-010).

Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test, opened with `?export.allowUpscale=1` added to its address (index.html?export.allowUpscale=1)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Export step, with **2000** selected

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the size line, under the **Size** and **Format** choices | It reads Output 2000 × 2000 px · JPEG, with no "full crop, not upscaled" part |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## EXP-05 Nothing shown while the corners are invalid

While the corners are invalid, the size line is blank and no notes show.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#exportReadout`, `#exportMessage`
- Source: `js/app/export-controls.js` (`syncExportReadouts`)
- Cases: 1

### EXP-05.1 Invalid corners blank the size line and its note   [auto: phone]
Before you start:
- Device and browser: any; a phone-width window (drag with a finger) or a wide window (drag with the mouse)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Open **Export options**: on a phone, tap the **Options** tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls | **Fill outside photo** reads White |
| 2 | Tap **Fill outside photo**, choose **Transparent**, then close the options (on a phone, the **×** at their top right) | The size line reads Output 1400 × 1400 px · JPEG…, and a note under it reads "JPEG has no transparency; empty areas will be white." |
| 3 | Tap **Perspective** in the step bar | The card's corners show as round handles joined by a white outline |
| 4 | Drag the top-left handle down and to the right, past the bottom-right handle, and let go | The outline crosses itself and turns red and dashed |
| 5 | Tap **Export** in the step bar | The size line is empty, and no note shows under it |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## EXP-06 Notes under the size line

Amber-marked notes under the size line explain an output you might not expect: **Levels has unapplied changes; export uses the applied levels.**, **Clamped to fit the 16.8 MP canvas limit.** and **JPEG has no transparency; empty areas will be white.**

- Risk: medium
- Check: script
- Layout: both. A phone shows one note at a time, in that order, the next once the first is dealt with; a wide screen shows them all.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#exportMessage`, "Levels has unapplied changes; export uses the applied levels.", "Clamped to fit the ", "JPEG has no transparency; empty areas will be white."
- Source: `js/app/export-controls.js` (`exportNotes`, `buildNote`, `syncExportReadouts`); `css/app.css` (the phone rules for the Export notes)
- Ruling: R15. The clamp note reads 16.7 MP, rounded down. The app differs today. R14. For a pair saved Separately, the clamp note shows if either side is clamped and names the side when it isn't the one on screen. The app differs today. New wording, to be approved by Rich.
- Flag: to confirm. The clamp note says what happened but gives no next step.
- Cases: 4

### EXP-06.1 A wide screen shows every note, each with an amber mark   [auto: desktop]
Flag: to confirm. Written to today's behavior: the clamp note gives no next step. Its number is EXP-06.3.

Before you start:
- Device and browser: a computer; a wide window
- Build: the build under test, opened with `?export.longEdge=12000&export.allowUpscale=1` added to its address, so the output is larger than the canvas limit
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Levels step (click **Levels** in the step bar)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Click **Auto** in the row of tools | A white dot shows on the **Levels** tab: the levels have changes not yet applied |
| 2 | Click **Export** in the step bar | Under the size line, two notes: "Levels has unapplied changes; export uses the applied levels.", then one that begins "Clamped to fit the" and ends "MP canvas limit." |
| 3 | In **Export options** (in the panel on the right), click **Fill outside photo** and choose **Transparent** | A third note follows them: "JPEG has no transparency; empty areas will be white." |
| 4 | Look at the start of each note | Each one is led by an amber warning mark (a triangle) |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### EXP-06.2 A phone shows one note at a time, in order   [auto: phone]
Flag: to confirm. Written to today's behavior: the clamp note gives no next step.

Before you start:
- Device and browser: a phone-width window
- Build: the build under test, opened with `?export.longEdge=12000&export.allowUpscale=1` added to its address, so the output is larger than the canvas limit
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Levels step (tap **Levels** in the step bar)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Auto** in the row of tools | A white dot shows on the **Levels** tab |
| 2 | Tap **Export** in the step bar | One note shows under the size line: "Levels has unapplied changes; export uses the applied levels." |
| 3 | Tap the **Options** tab (the tab with an up arrow on the top edge of the controls), choose **Transparent** under **Fill outside photo**, then tap the **×** at the options' top right | Still only the Levels note shows |
| 4 | Tap **Levels** in the step bar, then **Apply** | The white dot on the Levels tab goes |
| 5 | Tap **Export** in the step bar | One note shows: it begins "Clamped to fit the" and ends "MP canvas limit." |
| 6 | Tap **1080** | One note shows: "JPEG has no transparency; empty areas will be white." |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### EXP-06.3 The clamp note reads 16.7 MP   [auto: phone]
Flag: to confirm. The note's lack of a next step is today's behavior; its number is written to ruling R15.
Written to ruling R15; it fails until R15 is built (BUG-011).

Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test, opened with `?export.longEdge=12000&export.allowUpscale=1` added to its address, so the output is larger than the canvas limit
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the size line, under the **Size** and **Format** choices | It begins Output 4096 × 4096 px · JPEG: the output was scaled down to fit |
| 2 | Look at the note under it | It reads "Clamped to fit the 16.7 MP canvas limit." |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### EXP-06.4 For a pair saved Separately, a clamp on the other side shows a note   [auto: phone]
Flag: to confirm. The note's lack of a next step is today's behavior; when it shows is written to ruling R14.
Written to ruling R14; it fails until R14 is built (BUG-012).

Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test, opened with `?maxOutputArea=1000000` added to its address, which lowers the canvas limit to 1 MP
- Photos: IMG_9136.JPEG (the front) and 14_back_portrait_raw_white.JPEG (the back) from samples/
- Starting screen: IMG_9136.JPEG open, on the Export step, not part of a pair

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Original** | The size line reads Output 1000 × 1000 px · JPEG, and a note under it begins "Clamped to fit the" |
| 2 | Tap **Add back** and choose 14_back_portrait_raw_white.JPEG | The back opens; **Front** and **Back** show in the top bar, with **Back** selected |
| 3 | Tap **Export** in the step bar | **Together** and **Separately** show beside the size line |
| 4 | Tap **Separately** | **Separately** is selected |
| 5 | Look under the size line | A warning note says the front is scaled down to fit the canvas limit (its words are to be approved by Rich) |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## EXP-07 A note never hides a button

A note sits under the size line and never covers a button; after an export it stays in view beside **Next card**.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#exportMessage`, `#btnNextCard`
- Source: `js/app/export-controls.js` (`syncExportReadouts`)
- Cases: 1

### EXP-07.1 A note covers no button, before and after an export   [auto: phone, webkit]
Before you start:
- Device and browser: any; a phone-width or a wide window, with downloads saved to a folder you can open
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Open **Export options**: on a phone, tap the **Options** tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls | **Fill outside photo** reads White |
| 2 | Tap **Fill outside photo**, choose **Transparent**, then close the options (on a phone, the **×** at their top right) | A note under the size line reads "JPEG has no transparency; empty areas will be white." |
| 3 | Look at the note and the buttons below it | The whole note can be read, and it covers no part of **Share**, **Download**, **Copy**, **Add back** or **Corner shots** |
| 4 | Tap **Download** | A question card asks "Upscale to 2000 px?" |
| 5 | Tap **No** | A file is saved, and **Next card** shows in white in the bottom row |
| 6 | Look at the note and the buttons | The whole note can still be read, and it covers no part of any button, **Next card** included |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## EXP-08 Share

**Share** (red) renders the photo, then opens the system share sheet with the file or files.

- Risk: high
- Check: phone, script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnShare`, "Share or save the image (Save Image puts it in Photos)"
- Source: `js/app/export-controls.js` (`bindExport`); `js/app/export.js` (`doExport`, `deliverExport`, `shareExport`, `shareFiles`)
- Cases: 2

### EXP-08.1 Share hands the share sheet the finished photo   [auto: phone]
Before you start:
- Device and browser: a phone-width or a wide window, in a browser that can share files: Safari on an iPhone over HTTPS, or, for the script, a desktop browser given a stand-in share sheet that records what it is handed (no real share sheet opens)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Export step, with **2000** and **JPEG** selected

The share sheet is the system's panel of ways to send or save a file (AirDrop, Messages, Save Image…).

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the row of three buttons under the size line | **Share** is the first, in red, with its tooltip "Share or save the image (Save Image puts it in Photos)" |
| 2 | Tap **Share** | A question card asks "Upscale to 2000 px?" |
| 3 | Tap **No** | The share sheet opens with one file, IMG_9136-straight.jpg: a JPEG of 1400 × 1400 px |
| 4 | Finish the share (on an iPhone, tap **Save Image**) | A message over the photo begins "Exported 1400 × 1400 px in" |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### EXP-08.2 Share opens the iPhone's share sheet   [phone]
Before you start:
- Device and browser: an iPhone, Safari
- Build: the build under test on the live site (HTTPS; over plain HTTP the Share button is hidden)
- Photo: IMG_9136.JPEG from samples/ (AirDrop it to the phone or save it to Photos first)
- Starting screen: the photo open, on the Export step, with **2000** and **JPEG** selected

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Share** (red, first in the row of three buttons) | A question card asks "Upscale to 2000 px?" |
| 2 | Tap **No** | A thin red line runs along the top edge of the controls, then the share sheet rises, showing a small picture of the straightened card and the name IMG_9136-straight.jpg |
| 3 | Tap the **×** at the share sheet's top right | The share sheet closes; the app is on the Export step as before, with no message shown |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot (press the side button and volume up together).

## EXP-09 Save Image puts the photo in Photos

On an iPhone, **Save Image** in the share sheet puts the photo in Photos.

- Risk: high
- Check: phone
- Layout: phone. It is the iPhone's own share sheet.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Share’s Save Image puts the photo in Photos."
- Source: `js/app/export.js` (`shareFiles`)
- Cases: 1

### EXP-09.1 Save Image puts the photo in Photos   [phone]
Before you start:
- Device and browser: an iPhone, Safari
- Build: the build under test on the live site (HTTPS; over plain HTTP the Share button is hidden)
- Photo: IMG_9136.JPEG from samples/ (AirDrop it to the phone or save it to Photos first)
- Starting screen: the photo open, on the Export step, with **2000** and **JPEG** selected

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Open **Export options** (tap the **Options** tab, the tab with an up arrow on the top edge of the controls) and tap **Tips** | The tips include "Share’s Save Image puts the photo in Photos." |
| 2 | Close the options with the **×** at their top right | The options go down |
| 3 | Tap **Share** | A question card asks "Upscale to 2000 px?" |
| 4 | Tap **No** | The share sheet rises, showing the straightened card |
| 5 | Tap **Save Image** | The share sheet closes; a message over the photo begins "Exported 1400 × 1400 px in", and **Next card** shows in white |
| 6 | Open the Photos app and look at the newest photo | It is the straightened, square card, 1400 × 1400 px (swipe up on it to see the size) |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot (press the side button and volume up together).

## EXP-10 Share is hidden where it can't work

**Share** is hidden, never dimmed, where the browser can't share files (it needs a secure page), or where a link turns `export.share` off.

- Risk: high
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnShare`, `CONFIG.export.share`
- Source: `js/app/export.js` (`Exporter.canShare`); `js/app/export-controls.js` (`syncSaveButtons`)
- Cases: 2

### EXP-10.1 Where the browser can't share files, Share is hidden   [auto: phone]
Before you start:
- Device and browser: a phone-width or a wide window, in a browser that can't share files: Safari on an iPhone opening the build over plain HTTP (the computer's LAN address), or, for the script, a browser with file sharing taken away
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the row of buttons under the size line | There is no **Share** button, not even a greyed-out one: the row holds **Download** and **Copy** |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### EXP-10.2 A link with export.share=0 hides Share   [auto: phone]
Before you start:
- Device and browser: a phone-width or a wide window, in a browser that can share files: Safari on an iPhone over HTTPS, or, for the script, a desktop browser given a stand-in share sheet
- Build: the build under test, opened with `?export.share=0` added to its address (index.html?export.share=0)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the row of buttons under the size line | There is no **Share** button, not even a greyed-out one: the row holds **Download** and **Copy** |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## EXP-11 Download

**Download** is always shown and saves the file as a plain download; it turns red and wider when **Share** is hidden.

- Risk: high
- Check: script, saved file
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnDownload`
- Source: `js/app/export-controls.js` (`bindExport`, `syncSaveButtons`); `js/app/export.js` (`Exporter.download`, `deliverExport`)
- Cases: 2

### EXP-11.1 Download saves the photo as a plain download   [auto: phone, webkit]
Before you start:
- Device and browser: a phone-width or a wide window, in a browser that can share files (Safari on an iPhone over HTTPS, or, for the script, a desktop browser given a stand-in share sheet), with downloads saved to a folder you can open
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Export step, with **2000** and **JPEG** selected

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the row of buttons under the size line | **Download** shows, grey, beside the red **Share** |
| 2 | Tap **Download** | A question card asks "Upscale to 2000 px?" |
| 3 | Tap **No** | A file named IMG_9136-straight.jpg is saved, and a message over the photo begins "Exported 1400 × 1400 px in"; no share sheet opens |
| 4 | Open the saved file | It is a JPEG of 1400 × 1400 px showing the straightened card |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot, and the saved file.

### EXP-11.2 Without Share, Download is red and wider   [auto: phone, webkit]
Before you start:
- Device and browser: a phone-width or a wide window, in a browser that can't share files: Safari on an iPhone over plain HTTP, or, for the script, a browser with file sharing taken away
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the row of buttons under the size line | **Download** is red, and wider than **Copy** beside it |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## EXP-12 Copy

**Copy** puts the image on the clipboard as a PNG, whatever the format says.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnCopy`, "Copied to clipboard (PNG)."
- Source: `js/app/export.js` (`Exporter.copy`, `runExport`)
- Ruling: R16. With JPEG chosen and a Transparent fill, Copy gives a PNG whose empty areas are white, matching the note and Download. The app already does this.
- Cases: 2

### EXP-12.1 Copy puts a PNG on the clipboard though JPEG is chosen   [auto: phone]
Before you start:
- Device and browser: a computer, Chrome or Edge; a phone-width or a wide window (the script runs this in Chromium only: Playwright's WebKit can't read the clipboard back)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Export step, with **2000** and **JPEG** selected
- Something to paste into that shows an image's type and size (an image editor)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the row of buttons under the size line | **Copy** shows, last in the row |
| 2 | Tap **Copy** | A question card asks "Upscale to 2000 px?" |
| 3 | Tap **No** | A message over the photo reads "Copied to clipboard (PNG)." |
| 4 | Paste into the image editor | A PNG image of 1400 × 1400 px: the straightened card |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### EXP-12.2 With JPEG and a Transparent fill, Copy's empty areas are white   [auto: phone]
Before you start:
- Device and browser: a computer, Chrome or Edge; a phone-width or a wide window (the script runs this in Chromium only)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Rotate step (tap **Rotate** in the step bar), with **JPEG** selected on Export
- Something to paste into that shows transparency (an image editor that shows a checkerboard behind see-through areas)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap the angle (**0.0°**), type 10 and tap **Done** | The angle reads 10.0°; inside the dashed box, empty wedges show at two corners where the tilted photo ends |
| 2 | Tap **Export** in the step bar, open **Export options** (on a phone, the **Options** tab, the tab with an up arrow on the top edge of the controls; on a wide screen they are always shown), choose **Transparent** under **Fill outside photo**, and close the options (on a phone, the **×** at their top right) | The note "JPEG has no transparency; empty areas will be white." shows under the size line |
| 3 | Tap **Copy** | A question card asks "Upscale to 2000 px?" |
| 4 | Tap **No** | A message over the photo reads "Copied to clipboard (PNG)." |
| 5 | Paste into the image editor and look at the corners | The two corners the tilt left empty are solid white, and nothing in the image is see-through |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## EXP-13 Copy is hidden where it can't work

**Copy** is hidden where the browser can't put images on the clipboard, and for a pair set to **Separately**.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnCopy`, `#pairOutput`
- Source: `js/app/export.js` (`Exporter.canCopy`); `js/app/export-controls.js` (`syncSaveButtons`)
- Cases: 2

### EXP-13.1 Where the clipboard can't take images, Copy is hidden   [auto: phone]
Before you start:
- Device and browser: a phone-width or a wide window, in a browser whose clipboard can't take images (for the script, a browser with that taken away)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the row of buttons under the size line | There is no **Copy** button, not even a greyed-out one; **Download** shows |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### EXP-13.2 A pair set to Separately hides Copy   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photos: IMG_9136.JPEG (the front) and 14_back_portrait_raw_white.JPEG (the back) from samples/
- Starting screen: IMG_9136.JPEG open, on the Export step, not part of a pair

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the row of buttons under the size line | **Copy** shows |
| 2 | Tap **Add back** and choose 14_back_portrait_raw_white.JPEG | The back opens; **Front** and **Back** show in the top bar |
| 3 | Tap **Export** in the step bar | **Together** and **Separately** show beside the size line; **Copy** shows |
| 4 | Tap **Separately** | **Copy** is gone from the row, not even greyed out |
| 5 | Tap **Together** | **Copy** is back |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## EXP-14 The save buttons are dimmed when they can't run

**Share**, **Download** and **Copy** are dimmed while the corners are invalid, an export runs, or a pair's other side is opening.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnShare`, `#btnDownload`, `#btnCopy`
- Source: `js/app/export-controls.js` (`syncSaveButtons`)
- Cases: 2

### EXP-14.1 Invalid corners dim Share, Download and Copy   [auto: phone]
Before you start:
- Device and browser: a phone-width window (drag with a finger) or a wide window (drag with the mouse), in a browser that can share files (Safari on an iPhone over HTTPS, or, for the script, a desktop browser given a stand-in share sheet)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the row of buttons under the size line | **Share**, **Download** and **Copy** are live (not greyed out) |
| 2 | Tap **Perspective** in the step bar | The card's corners show as round handles joined by a white outline |
| 3 | Drag the top-left handle down and to the right, past the bottom-right handle, and let go | The outline crosses itself and turns red and dashed |
| 4 | Tap **Export** in the step bar | **Share**, **Download** and **Copy** are greyed out |
| 5 | Tap **Download** | Nothing is saved and no question card shows |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### EXP-14.2 Share, Download and Copy are dimmed while an export runs   [auto: phone]
Before you start:
- Device and browser: a phone-width or a wide window, in a browser that can share files (Safari on an iPhone over HTTPS, or, for the script, a desktop browser given a stand-in share sheet), with downloads saved to a folder you can open
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Export step, with **2000** selected

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Download** | A question card asks "Upscale to 2000 px?" |
| 2 | Tap **No**, and watch the buttons while the thin red progress line runs along the top edge of the controls | While it runs, **Share**, **Download** and **Copy** are greyed out |
| 3 | Wait for the file to be saved | A file named IMG_9136-straight.jpg is saved; **Share**, **Download** and **Copy** are live again |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## EXP-15 Share now

If the browser refuses to share because the tap was too long ago (a slow export), the finished files are kept and **Share** reads **Share now**, live even while the rest is busy; tapping it shares them without rendering again.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnShare`, "Share now", " Tap Share now to open the share sheet."
- Source: `js/app/export.js` (`shareFiles`, `shareExport`, `sharePending`); `js/app/export-controls.js` (`bindExport`, `syncSaveButtons`)
- Cases: 2

### EXP-15.1 A refused share leaves Share now, which shares the same file   [auto: phone]
Before you start:
- Device and browser: a phone-width or a wide window, in a browser whose share sheet refuses the first request, as Safari does when an export took too long after the tap (for the script, a desktop browser given a stand-in share sheet that refuses once)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Export step, with **2000** selected

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Share** | A question card asks "Upscale to 2000 px?" |
| 2 | Tap **No** | No share sheet opens; a message over the photo reads "Exported 1400 × 1400 px in N s. Tap Share now to open the share sheet." (N is the time it took); the red button reads **Share now** |
| 3 | Tap **Share now** | The share sheet opens at once with IMG_9136-straight.jpg, the same file: no progress line runs, nothing is rendered again |
| 4 | Finish the share | The red button reads **Share** again |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### EXP-15.2 Share now stays live while another save runs   [auto: phone]
Before you start:
- Device and browser: as for EXP-15.1, with downloads saved to a folder you can open
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Export step, with **2000** selected

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Share**, then **No** on the question card | The red button reads **Share now** |
| 2 | Tap **Download** | A question card asks "Upscale to 2000 px?" |
| 3 | Tap **No**, and watch the buttons while the thin red progress line runs along the top edge of the controls | **Download** and **Copy** are greyed out, while **Share now** stays live |
| 4 | Wait for the file to be saved | A file named IMG_9136-straight.jpg is saved; the red button still reads **Share now** |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## EXP-16 An edit drops a waiting Share now

Any edit, or switching a pair's side, drops the files waiting for **Share now**, and the button reads **Share** again.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnShare`
- Source: `js/app/state.js` (`stateChanged`); `js/app/pair.js` (`applySide`)
- Cases: 1

### EXP-16.1 An edit drops a waiting Share now   [auto: phone]
Before you start:
- Device and browser: as for EXP-15.1: a browser whose share sheet refuses the first request (for the script, a stand-in share sheet that refuses once)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Export step, with **2000** selected

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Share**, then **No** on the question card | The red button reads **Share now** |
| 2 | Tap **1080** | The red button reads **Share** again |
| 3 | Tap **Share** | The progress line runs (the photo is rendered again), then the share sheet opens with IMG_9136-straight.jpg, now 1080 × 1080 px |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## EXP-17 A cancelled share

Cancelling the share sheet shows no message and doesn't count as exported.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnShare`, `#btnNextCard`
- Source: `js/app/export.js` (`shareFiles`, `shareExport`, `toastSaved`)
- Cases: 1

### EXP-17.1 Cancelling the share sheet shows nothing and doesn't count   [auto: phone]
Before you start:
- Device and browser: a phone-width or a wide window, in a browser that can share files: Safari on an iPhone over HTTPS, or, for the script, a desktop browser given a stand-in share sheet that is cancelled at once
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Export step, with **2000** selected; **Next card** not showing

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Share** | A question card asks "Upscale to 2000 px?" |
| 2 | Tap **No** | The share sheet opens |
| 3 | Close the share sheet without choosing anything (on an iPhone, the **×** at its top right) | No message shows over the photo; **Next card** doesn't show; the red button still reads **Share** |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## EXP-18 One export at a time

Only one export runs at a time. While it runs, the save buttons, **Together** | **Separately**, **Front** | **Back**, **Unpair** and the corner-shot buttons are dimmed.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnDownload`, `#pairOutput`, `#btnUnpair`, `#btnCornerDownload`
- Source: `js/app/export.js` (`doExport`, `runWithProgress`); `js/app/export-controls.js` (`syncSaveButtons`); `js/app/corner-shots.js` (`syncCornerShots`); `js/app/pair.js` (`syncPair`)
- Ruling: R17. During an export, Size, Format, the options sheet's settings, Load edits, Undo, Redo and Add back are dimmed along with the save buttons; the step tabs stay live. The app differs today.
- Cases: 2

### EXP-18.1 While an export runs, the other save buttons are dimmed   [auto: phone]
Before you start:
- Device and browser: a phone-width or a wide window, in a browser that can share files (Safari on an iPhone over HTTPS, or, for the script, a desktop browser given a stand-in share sheet), with downloads saved to a folder you can open
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Export step, with **2000** selected; on a phone, the Corner shots sheet closed

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Download** | A question card asks "Upscale to 2000 px?" |
| 2 | Tap **No**, and watch while the thin red progress line runs along the top edge of the controls | **Share**, **Download** and **Copy** are greyed out; on a wide screen, **Share corners** and **Download corners** in the Corner shots section of the panel are greyed out too |
| 3 | Wait for the file to be saved | One file, IMG_9136-straight.jpg, is saved; every one of those buttons is live again |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### EXP-18.2 While an export runs, the settings are dimmed and the steps stay live   [auto: phone]
Written to ruling R17; it fails until R17 is built (BUG-013).

Before you start:
- Device and browser: a phone-width or a wide window, with downloads saved to a folder you can open
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Export step, with **2000** selected

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **1080**, then **3000** | **3000** is selected |
| 2 | Tap **Undo** (the arrow curving left, at the top right) | **1080** is selected; **Undo** and **Redo** are both live |
| 3 | Tap **Download**, and watch while the thin red progress line runs along the top edge of the controls | Greyed out: the Size and Format choices, **Undo**, **Redo**, **Add back**, and in **Export options** **Quality**, **Interpolation**, **Fill outside photo**, **Reset export settings** and **Load edits**. The step tabs (**Perspective** to **Export**) stay live |
| 4 | Wait for the file to be saved | A file is saved; everything is live again |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## EXP-19 Add back

**Add back** shows in the bottom row while the photo isn't part of a pair.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnAddBack`, "Keep this photo as the front and open the back"
- Source: `js/app/export-controls.js` (`buildMoreRow`, `syncExportReadouts`); `js/app/pair.js` (`bindPair`)
- Cases: 1

### EXP-19.1 Add back shows only while the photo isn't part of a pair   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photos: IMG_9136.JPEG (the front) and 14_back_portrait_raw_white.JPEG (the back) from samples/
- Starting screen: IMG_9136.JPEG open, on the Export step, not part of a pair

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the bottom row of buttons | **Add back** shows, with its tooltip "Keep this photo as the front and open the back" |
| 2 | Tap **Add back** and choose 14_back_portrait_raw_white.JPEG | The back opens; **Front** and **Back** show in the top bar, with **Unpair** beside them |
| 3 | Tap **Export** in the step bar | **Add back** is gone from the bottom row |
| 4 | Tap **Unpair** | A question card titled "Unpair" offers **Keep front** and **Keep back** |
| 5 | Tap **Keep back** | A message reads "Unpaired. The back is a single photo now."; **Front** and **Back** go from the top bar |
| 6 | Look at the bottom row of buttons | **Add back** shows again |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## EXP-20 The Corner shots button

**Corner shots** brings the corner shots into view.

- Risk: medium
- Check: script
- Layout: both. On a phone it closes any other sheet and opens the Corner shots sheet. On a wide screen it scrolls the side panel to the Corner shots section only if the section isn't wholly in view, and moves the keyboard focus to its output choice.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnCornerShots`, `#cornerShotsSheet`, `#cornerOutput`
- Source: `js/app/corner-shots.js` (`openCornerShots`); `js/app/export-controls.js` (`bindExport`)
- Cases: 2

### EXP-20.1 On a phone, Corner shots opens its sheet   [auto: phone]
Before you start:
- Device and browser: a phone-width window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Export step, no sheet open

While another sheet is open, its dimmed backdrop covers the buttons, so a tap on **Corner shots** first closes that sheet; this case starts with none open.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Corner shots** in the bottom row of buttons | The **Corner shots** sheet rises over the photo, with four close-ups of the card's corners, and **Export options** stay closed |
| 2 | Tap the dimmed photo above the sheet | The sheet goes down |
| 3 | Tap **Corner shots** again | The **Corner shots** sheet rises again |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### EXP-20.2 On a wide screen, Corner shots brings its section into view only when needed   [auto: desktop, webkit]
Before you start:
- Device and browser: a computer with a mouse; a wide window, 1280 × 800 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Export step, the panel on the right scrolled to its top

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the panel on the right | The **Corner shots** section shows whole, under the buttons |
| 2 | Click **Corner shots** in the bottom row of buttons | The panel doesn't move; the keyboard focus is on the selected choice in the Corner shots section (**1 sheet**) |
| 3 | Make the window 520 px tall | The bottom of the **Corner shots** section is cut off by the window's lower edge |
| 4 | Click **Corner shots** | The panel scrolls up just enough that the whole **Corner shots** section shows; the focus is on **1 sheet** |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## EXP-21 Next card

**Next card** (white) opens the photo picker for the next photo. It shows only while the current edits equal the last exported ones and no **Share now** is waiting; an edit hides it, and undoing back to the exported edits shows it again.

- Risk: high
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnNextCard`, "Next card shows once these edits are exported."
- Source: `js/app/export-controls.js` (`syncNextCard`, `bindExport`); `js/app/export.js` (`markExported`)
- Flag: to confirm. The tip says Next card shows once the edits are exported, but it is also held back while Share now waits.
- Cases: 2

### EXP-21.1 Next card shows once the edits are exported, and opens the picker   [auto: phone]
Flag: to confirm. Written to today's behavior.

Before you start:
- Device and browser: any; a phone-width or a wide window, with downloads saved to a folder you can open
- Build: the build under test
- Photos: IMG_9136.JPEG and IMG_9075.JPEG from samples/
- Starting screen: IMG_9136.JPEG open, on the Export step, with **2000** selected

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the bottom row of buttons | There is no **Next card** |
| 2 | Tap **Download**, then **No** on the question card | A file is saved; **Next card** shows in the bottom row, in white |
| 3 | Tap **1080** | **Next card** goes: these edits are not exported |
| 4 | Tap **Undo** (the arrow curving left, at the top right) | **2000** is selected again, and **Next card** is back |
| 5 | Tap **Next card** | The photo picker opens |
| 6 | Choose IMG_9075.JPEG | The new photo opens on the Perspective step |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### EXP-21.2 A waiting Share now holds Next card back, even for exported edits   [auto: phone]
Flag: to confirm. Written to today's behavior: the tip "Next card shows once these edits are exported." doesn't mention this.

Before you start:
- Device and browser: a phone-width or a wide window, in a browser whose share sheet refuses the first request, as Safari does when an export took too long after the tap (for the script, a stand-in share sheet that refuses once), with downloads saved to a folder you can open
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Export step, with **2000** selected

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Download**, then **No** on the question card | A file is saved; **Next card** shows |
| 2 | Tap **Share**, then **No** on the question card | The red button reads **Share now**, and **Next card** has gone |
| 3 | Tap **Share now** | The share sheet opens; once the share is done the button reads **Share** and **Next card** is back |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## EXP-22 What counts as exported

A Download (counted just before it starts), a completed Share and a completed Copy count as exported. A cancelled or failed share, corner shots and Save edits don't.

- Risk: high
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnNextCard`
- Source: `js/app/export.js` (`markExported`, `deliverExport`, `runExport`, `shareExport`)
- Cases: 3

A Download counting is EXP-21.1, a cancelled share EXP-17.1.

### EXP-22.1 Corner shots and Save edits don't count as exported; a finished Share does   [auto: phone]
Before you start:
- Device and browser: a phone-width or a wide window, in a browser that can share files (Safari on an iPhone over HTTPS, or, for the script, a desktop browser given a stand-in share sheet), with downloads saved to a folder you can open
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Export step, with **2000** selected; **Next card** not showing

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Corner shots** in the bottom row of buttons | The Corner shots sheet opens (on a wide screen, the Corner shots section of the panel) |
| 2 | Tap **Download corners**, then **No** if a question card asks to upscale | A file of corner shots is saved; **Next card** doesn't show |
| 3 | Open **Export options**: on a phone, tap the **Options** tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls | **Save edits** shows |
| 4 | Tap **Save edits** | A file named IMG_9136-edits.json is saved; **Next card** doesn't show |
| 5 | Close the options (on a phone, the **×** at their top right), then tap **Share** | A question card asks "Upscale to 2000 px?" |
| 6 | Tap **No**, and finish the share | **Next card** shows in white |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### EXP-22.2 A failed share doesn't count as exported   [auto: phone]
Before you start:
- Device and browser: a phone-width or a wide window, in a browser whose share sheet fails with an error (for the script, a stand-in share sheet that fails)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Export step, with **2000** selected; **Next card** not showing

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Share** | A question card asks "Upscale to 2000 px?" |
| 2 | Tap **No** | A red message reads "Share failed: " followed by the browser's reason; **Next card** doesn't show |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### EXP-22.3 A finished Copy counts as exported   [auto: phone]
Before you start:
- Device and browser: a computer, Chrome or Edge; a phone-width or a wide window (the script runs this in Chromium only, which lets it allow the clipboard)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Export step, with **2000** selected; **Next card** not showing

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Copy** | A question card asks "Upscale to 2000 px?" |
| 2 | Tap **No** | A message reads "Copied to clipboard (PNG)."; **Next card** shows in white |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## EXP-23 Exported survives Resume

After a reload and **Resume**, edits that were exported still count as exported, so **Next card** shows.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnNextCard`, "Resumed where you left off."
- Source: `js/app/adapters.js` (`Session.snapshot`); `js/app/state.js` (`openFile`)
- Cases: 1

### EXP-23.1 Exported edits still count after a reload and Resume   [auto: phone, webkit]
Before you start:
- Device and browser: any; a phone-width or a wide window, with downloads saved to a folder you can open
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Export step, with **2000** selected

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Download**, then **No** on the question card | A file is saved; **Next card** shows |
| 2 | Wait two seconds, then reload the page | The start screen offers to resume IMG_9136.JPEG, with **Resume** and **Start fresh** |
| 3 | Tap **Resume** | The photo opens on the Export step, and a message reads "Resumed where you left off." |
| 4 | Look at the bottom row of buttons | **Next card** shows in white |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## EXP-24 Quality

The **Quality** slider in **Export options** sets the JPEG or WebP quality from 50 to 100%; it is hidden when PNG is chosen. The saved file's size follows it: a lower Quality gives a smaller file.

- Risk: medium
- Check: script; script, saved file (the file size follows Quality)
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#quality`, `#qualityValue`, `#qualityRow`, `CONFIG.export.quality`
- Source: `js/app/export-controls.js` (`buildQualityRow`, `bindExportSettings`, `syncExportControls`); `js/app/export.js` (`encodeCanvas`)
- Ruling: R5. Undoing a change to an export setting also puts the remembered setting back. The app already does this.
- Cases: 2

### EXP-24.1 Quality goes from 50 to 100%, is hidden for PNG, and is one undo step   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test, with no settings remembered from before (a private window, or the site's data cleared)
- Photos: IMG_9136.JPEG and IMG_9075.JPEG from samples/
- Starting screen: IMG_9136.JPEG open, on the Export step, with **JPEG** selected

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Open **Export options**: on a phone, tap the **Options** tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls | The **Quality** row reads 92% |
| 2 | Drag the **Quality** slider all the way to the right | It reads 100% |
| 3 | Close the options (on a phone, the **×** at their top right), tap **PNG**, and open **Export options** again | There is no **Quality** row |
| 4 | Close the options, tap **JPEG**, and open **Export options** again | The **Quality** row is back, reading 100% |
| 5 | Drag the **Quality** slider all the way to the left | It reads 50% |
| 6 | Close the options (on a phone, the **×** at their top right; while they are up, the top bar can't be reached), tap **Undo** (the arrow curving left, at the top right), and open **Export options** again | Quality reads 100%: the drag was one undo step |
| 7 | Close the options, tap **Open** (the folder at the top left; on a phone it has no label) and choose IMG_9075.JPEG | The new photo opens |
| 8 | Tap **Export** in the step bar and open **Export options** | The **Quality** row reads 100%: the quality the undo went back to is the one remembered |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### EXP-24.2 A lower Quality gives a smaller file   [auto: phone, webkit]
Before you start:
- Device and browser: any; a phone-width or a wide window, with downloads saved to a folder you can open
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Export step, with **1080** and **JPEG** selected

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Download** | A file named IMG_9136-straight.jpg is saved, at Quality 92% |
| 2 | Open **Export options**: on a phone, tap the **Options** tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls | The **Quality** row reads 92% |
| 3 | Drag the **Quality** slider all the way to the left, then close the options (on a phone, the **×** at their top right) | It read 50% |
| 4 | Tap **Download** | A second file is saved |
| 5 | Compare the two files' sizes | The second, at 50%, is smaller than the first, at 92% |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot, and both files.

## EXP-25 Interpolation

The **Interpolation** row picks **Bilinear** or **Bicubic (sharper, slower)**; the row itself shows the short name, **Bicubic**.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#interp`, `#interpValue`, "Bicubic (sharper, slower)", `CONFIG.export.interp`
- Source: `js/app/export-controls.js` (`buildInterpolationRow`, `bindExportSettings`, `syncExportControls`)
- Ruling: R5. Undoing a change to an export setting also puts the remembered setting back. The app already does this.
- Cases: 1

### EXP-25.1 Interpolation picks Bilinear or Bicubic, one undo step each   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test, with no settings remembered from before (a private window, or the site's data cleared)
- Photos: IMG_9136.JPEG and IMG_9075.JPEG from samples/
- Starting screen: IMG_9136.JPEG open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Open **Export options**: on a phone, tap the **Options** tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls | The **Interpolation** row reads Bilinear |
| 2 | Tap the **Interpolation** row | A list offers **Bilinear** and **Bicubic (sharper, slower)** |
| 3 | Choose **Bicubic (sharper, slower)** | The row reads Bicubic |
| 4 | Close the options (on a phone, the **×** at their top right; while they are up, the top bar can't be reached), tap **Undo** (the arrow curving left, at the top right), and open **Export options** again | The **Interpolation** row reads Bilinear |
| 5 | Close the options, tap **Open** (the folder at the top left; on a phone it has no label) and choose IMG_9075.JPEG | The new photo opens |
| 6 | Tap **Export** in the step bar and open **Export options** | The **Interpolation** row reads Bilinear: the undo put the remembered choice back too |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## EXP-26 Fill outside photo

The **Fill outside photo** row, with a swatch of the color, picks **Transparent**, **White**, **Black** or **Custom…**; Transparent shows as a checkered swatch.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#fill`, `#fillSwatch`, `CONFIG.export.fill`, "Fill outside photo"
- Source: `js/app/export-controls.js` (`buildFillRows`, `bindFill`, `syncFill`)
- Ruling: R5. Undoing a change to an export setting also puts the remembered setting back. The app already does this.
- Cases: 1

### EXP-26.1 Fill outside photo picks a color and shows its swatch   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test, with no settings remembered from before (a private window, or the site's data cleared)
- Photos: IMG_9136.JPEG and IMG_9075.JPEG from samples/
- Starting screen: IMG_9136.JPEG open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Open **Export options**: on a phone, tap the **Options** tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls | **Fill outside photo** reads White, with a white round swatch before it |
| 2 | Tap the **Fill outside photo** row | A list offers **Transparent**, **White**, **Black** and **Custom…** |
| 3 | Choose **Transparent** | The row reads Transparent, with a checkered swatch |
| 4 | Tap the row again and choose **Black** | The row reads Black, with a black swatch |
| 5 | Close the options (on a phone, the **×** at their top right; while they are up, the top bar can't be reached), tap **Undo** (the arrow curving left, at the top right), and open **Export options** again | **Fill outside photo** reads Transparent again, with the checkered swatch |
| 6 | Close the options, tap **Open** (the folder at the top left; on a phone it has no label) and choose IMG_9075.JPEG | The new photo opens |
| 7 | Tap **Export** in the step bar and open **Export options** | **Fill outside photo** reads Transparent: the undo put the remembered fill back too |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## EXP-27 A custom fill color

**Custom…** opens the color picker. A **Custom color** row with the color's hex value shows only while the fill is a custom color (even one that equals White, until the fill changes some other way); dragging the color is one undo step.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#fillColor`, `#fillColorRow`, `#fillColorValue`, "Custom color"
- Source: `js/app/export-controls.js` (`bindFill`, `openColorInput`, `syncFill`)
- Cases: 1

### EXP-27.1 Custom… opens the color picker and shows the Custom color row   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Export step, **Fill outside photo** White

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Open **Export options**: on a phone, tap the **Options** tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls | **Fill outside photo** reads White; there is no **Custom color** row |
| 2 | Tap the **Fill outside photo** row and choose **Custom…** | The color picker opens; behind it, the row reads Custom, and a **Custom color** row under it reads #ffffff |
| 3 | In the color picker, drag to a red, then on to an orange, and close the picker | The **Custom color** row reads the orange's hex value (such as #ff8800), and the fill's swatch is that orange |
| 4 | Close the options (on a phone, the **×** at their top right; while they are up, the top bar can't be reached), tap **Undo** (the arrow curving left, at the top right), and open **Export options** again | **Fill outside photo** reads White again and the **Custom color** row is gone: the whole drag was one undo step |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## EXP-28 Where the fill is used

The fill paints the area outside the photo, the gap between a pair's two sides and the gap between the corner sheet's tiles; a JPEG with a Transparent fill is flattened onto white.

- Risk: medium
- Check: script, saved file
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#fill`, `CONFIG.export.fill`
- Source: `js/app/export.js` (`renderWarped`, `flattenOnWhite`, `encodeCanvas`); `js/app/corner-shots.js` (`encodeSheet`); `js/app/pair.js` (`encodeTogether`)
- Cases: 2

### EXP-28.1 The fill paints the empty corners, and a JPEG flattens Transparent onto white   [auto: phone, webkit]
Before you start:
- Device and browser: any; a phone-width or a wide window, with downloads saved to a folder you can open
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Rotate step (tap **Rotate** in the step bar)

Choose a fill: open **Export options** (on a phone, the **Options** tab, the tab with an up arrow on the top edge of the controls; on a wide screen they are always shown), tap **Fill outside photo**, choose the color, and close the options (on a phone, the **×** at their top right).

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap the angle (**0.0°**), type 10 and tap **Done** | The angle reads 10.0°; two corners of the dashed box are empty where the tilted photo ends |
| 2 | Tap **Export** in the step bar, then **1080** and **PNG** | The size line reads Output 1080 × 1080 px · PNG |
| 3 | Choose the fill Transparent, then tap **Download** | A file IMG_9136-straight.png is saved; in it, the two empty corners are see-through |
| 4 | Choose the fill Black, then tap **Download** | A second PNG is saved; the same two corners are solid black |
| 5 | Choose the fill Transparent, tap **JPEG**, then tap **Download** | A file IMG_9136-straight.jpg is saved; the same two corners are white |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot, and the saved files.

### EXP-28.2 The fill paints the gap between the corner sheet's tiles   [auto: phone, webkit]
Before you start:
- Device and browser: any; a phone-width or a wide window, with downloads saved to a folder you can open
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Export step, **Fill outside photo** White

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Open **Export options**: on a phone, tap the **Options** tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls | **Fill outside photo** reads White |
| 2 | Tap **Fill outside photo**, choose **Black**, then close the options (on a phone, the **×** at their top right) | The swatch is black |
| 3 | Tap **Corner shots** | The Corner shots sheet opens, with **1 sheet** selected |
| 4 | Tap **Download corners**, and **No** if a question card asks to upscale | A file of the four corners in a 2 × 2 sheet is saved |
| 5 | Open the file and look between the tiles | The lines between the four tiles, across and down the middle, are black |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot, and the saved file.

## EXP-29 Reset export settings

**Reset export settings** puts the format, Quality, size, Interpolation and fill back to JPEG, 92%, 2000, Bilinear and White, as one undo step.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#exportResetRow`, "Reset export settings", `CONFIG.export.quality`
- Source: `js/app/export-controls.js` (`buildExportResetRow`); `js/app/shell.js` (`resetStep`)
- Flag: to confirm. It leaves Together | Separately and the corner-shots output as they are, and in a pair it resets both sides.
- Cases: 1

### EXP-29.1 Reset export settings puts five settings back in one undo step   [auto: phone]
Flag: to confirm. Written to today's behavior: the corner shots' **4 photos** | **1 sheet** choice is left as it is.

Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Export step, with the settings at their defaults

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Open **Export options**: on a phone, tap the **Options** tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls; drag **Quality** all the way to the left, set **Interpolation** to **Bicubic (sharper, slower)** and **Fill outside photo** to **Black**, then close the options (on a phone, the **×** at their top right) | Quality read 50%, Interpolation Bicubic, the fill Black |
| 2 | Tap **1080**, then **PNG** | **1080** and **PNG** are selected |
| 3 | Tap **Corner shots**, choose **4 photos**, and close the Corner shots sheet (on a phone, the **×** at its top right) | **4 photos** was selected |
| 4 | Open **Export options** and tap **Reset export settings** | Quality reads 92%, Interpolation Bilinear, **Fill outside photo** White |
| 5 | Close the options and look at the choices | **2000** and **JPEG** are selected |
| 6 | Tap **Corner shots** | **4 photos** is still selected |
| 7 | Close the Corner shots sheet, then tap **Undo** (the arrow curving left, at the top right) | **1080** and **PNG** are selected again |
| 8 | Open **Export options** | Interpolation reads Bicubic and the fill Black (Quality is hidden for PNG) |
| 9 | Close the options, tap **JPEG**, and open **Export options** | Quality reads 50%: one undo brought all five settings back |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## EXP-30 The source line

**Export options** show the photo as the picker handed it over: **Source W × H px (MP) · type · MB · name**.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#sourceInfo`, "unknown type"
- Source: `js/app/export-controls.js` (`sourceInfo`, `syncSourceInfo`)
- Cases: 1

### EXP-30.1 The source line describes the photo as received   [auto: phone, webkit]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/ (1498 × 2098 px; note its size in MB, to one decimal, as 1 MB = 1,048,576 bytes)
- Starting screen: the photo open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Open **Export options**: on a phone, tap the **Options** tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls | Near the end, a line reads Source 1498 × 2098 px (3.1 MP) · image/jpeg · N MB · IMG_9136.JPEG, where N is the file's size in MB |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## EXP-31 The version line

**Export options** show **Card Finisher** and the app's version.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#versionInfo`, "Card Finisher "
- Source: `js/app/export-controls.js` (`buildInfoLines`); `js/app/main.js` (`init`)
- Cases: 1

### EXP-31.1 The version line names the app and its version   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test; note its version (in `js/config.js`, `appVersion`, such as 1.10.0-dev.16)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Open **Export options**: on a phone, tap the **Options** tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls | Under the source line, a line reads Card Finisher and the version, such as Card Finisher 1.10.0-dev.16 |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## EXP-32 Rendered from the original photo

The saved file is rendered from the original full-resolution photo, with the applied levels and then the logo; the original is never changed.

- Risk: high
- Check: script, saved file
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: "Levels has unapplied changes; export uses the applied levels."
- Source: `js/app/export.js` (`renderFull`, `renderWarped`, `warpBand`)
- Cases: 2

### EXP-32.1 The saved file doesn't depend on the preview's resolution   [auto: phone, webkit]
Before you start:
- Device and browser: any; a phone-width or a wide window, with downloads saved to a folder you can open
- Build: the build under test, opened twice: first as it is, then with `?previewMaxPx=512` added to its address, which makes the on-screen copy of the photo 512 px on its long side
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open in the build as it is, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Original**, then **Download** | A file IMG_9136-straight.jpg of 1400 × 1400 px is saved |
| 2 | Open **Export options** (on a phone, the **Options** tab, the tab with an up arrow on the top edge of the controls; on a wide screen they are always shown) and tap **Save edits** | A file IMG_9136-edits.json is saved |
| 3 | Open the build with `?previewMaxPx=512` added to its address (leave its offer to resume as it is), tap **Open** and choose IMG_9136.JPEG | The photo opens; on screen it looks softer |
| 4 | Tap **Export** in the step bar, open **Export options**, tap **Load edits** and choose IMG_9136-edits.json | **Original** is selected |
| 5 | Close the options (on a phone, the **×** at their top right) and tap **Download** | A second IMG_9136-straight.jpg of 1400 × 1400 px is saved |
| 6 | Compare the two files | They are the same, byte for byte: both were rendered from the full-resolution photo |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot, and both files.

### EXP-32.2 The saved file has the applied levels, not unapplied ones   [auto: phone, webkit]
Before you start:
- Device and browser: any; a phone-width or a wide window, with downloads saved to a folder you can open
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Export step, with **1080** selected and no levels

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Download** | A file IMG_9136-straight.jpg is saved |
| 2 | Tap **Levels** in the step bar, then **Auto** | The photo looks brighter; a white dot shows on the **Levels** tab |
| 3 | Tap **Export** in the step bar | A note reads "Levels has unapplied changes; export uses the applied levels." |
| 4 | Tap **Download** | A second file is saved, byte for byte the same as the first |
| 5 | Tap **Levels**, then **Apply** | The white dot goes |
| 6 | Tap **Export**, then **Download** | A third file is saved, and it differs from the first: the applied levels are in it |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot, and the three files.

## EXP-33 The size rule

The long edge is fitted to the chosen size and never enlarged unless the Upscale answer is Yes; **Original** keeps the crop at the photo's own resolution.

- Risk: high
- Check: script, saved file
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.export.longEdge`, `CONFIG.export.allowUpscale`, "Original keeps the crop at the photo’s own resolution and never upscales."
- Source: `js/engine.js` (`outputSize`, `computeGeometry`); `js/app/export.js` (`exportGeometry`)
- Cases: 1

### EXP-33.1 The long edge fits the size and is enlarged only on Yes   [auto: phone, webkit]
Before you start:
- Device and browser: any; a phone-width or a wide window, with downloads saved to a folder you can open
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/ (its crop is 1400 × 1400 px at the photo's own resolution)
- Starting screen: the photo open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **1080**, then **Download** | No question; the saved file is 1080 × 1080 px |
| 2 | Tap **3000**, then **Download** | A question card asks "Upscale to 3000 px?" |
| 3 | Tap **No** | The saved file is 1400 × 1400 px: not enlarged |
| 4 | Tap **Download**, then **Yes** on the question card | The saved file is 3000 × 3000 px |
| 5 | Tap **Original**, then **Download** | No question; the saved file is 1400 × 1400 px, the crop at the photo's own resolution |
| 6 | Open **Export options**: on a phone, tap the **Options** tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls; tap **Tips** if they are folded | A tip reads "Original keeps the crop at the photo’s own resolution and never upscales." |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot, and the saved files.

## EXP-34 Output caps

The saved photo is at most 12000 px on its long side and 16,777,216 px in area; anything larger is scaled down.

- Risk: medium
- Check: script, saved file
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.maxOutputPx`, `CONFIG.maxOutputArea`
- Source: `js/engine.js` (`outputSize`)
- Ruling: R37. With upscaling switched on from a link, the Upscale question is not asked. The app differs today.
- Cases: 2

The sample photos are too small to reach 12000 px on a side at their own resolution, and with upscaling on the area cap binds first, so EXP-34.2 lowers the side cap with a link to show the rule.

### EXP-34.1 The saved photo is at most 16,777,216 px in area   [auto: phone, webkit]
Written to ruling R37; it fails until R37 is built (BUG-142).

Before you start:
- Device and browser: any; a phone-width or a wide window, with downloads saved to a folder you can open
- Build: the build under test, opened with `?export.longEdge=12000&export.allowUpscale=1` added to its address, so the output would be 12000 × 12000 px
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the size line, under the **Size** and **Format** choices | It begins Output 4096 × 4096 px · JPEG |
| 2 | Tap **Download** | No question card: upscaling is already on, so a file is saved straight away |
| 3 | Open the saved file | It is 4096 × 4096 px: 16,777,216 px in area |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot, and the saved file.

### EXP-34.2 The saved photo's long side is capped   [auto: phone, webkit]
Before you start:
- Device and browser: any; a phone-width or a wide window, with downloads saved to a folder you can open
- Build: the build under test, opened with `?maxOutputPx=1000` added to its address, which lowers the side cap from 12000 to 1000 px
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Export step

The same cap keeps the straightened photo itself within 1000 px on its long side, so with this link the crop is 657 × 657 px; an upscale to 3000 px is what reaches the cap.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **3000** | The size line reads Output 657 × 657 px · JPEG · full crop, not upscaled |
| 2 | Tap **Download** | A question card asks "Upscale to 3000 px?" |
| 3 | Tap **Yes** | The saved file is 1000 × 1000 px: capped at 1000 px, not 3000 |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot, and the saved file.

## EXP-35 A 48 MP photo on an iPhone

A 48 MP photo saves at **Original** and at **3000** on an iPhone without the page reloading, because it is rendered a band of rows at a time.

- Risk: high
- Check: phone
- Layout: phone. It is about the iPhone's memory.
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.export.bandPx`, `CONFIG.export.maxBandSrcPx`
- Source: `js/app/export.js` (`renderWarped`, `isRegionTooBig`)
- Cases: 1

### EXP-35.1 A 48 MP photo saves at Original and at 3000 on an iPhone   [phone]
Before you start:
- Device and browser: an iPhone that takes 48 MP photos (iPhone 14 Pro or later), Safari
- Build: the build under test on the live site (HTTPS)
- Photo: a 48 MP photo of a card, taken with the camera set to 48 MP (Settings › Camera › Formats › Photo Mode: 48 MP, or Resolution Control on), in Photos
- Starting screen: the app open, no photo yet

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Open** and choose the 48 MP photo | The photo opens and its corners are found |
| 2 | Tap **Export** in the step bar and open **Export options** (the **Options** tab, the tab with an up arrow on the top edge of the controls) | The source line reads Source 8064 × 6048 px (48.8 MP), or 6048 × 8064 |
| 3 | Close the options and tap **Original** | The size line gives the crop's size at the photo's resolution |
| 4 | Tap **Share**, then **Save Image** | The progress line runs to the end, a message begins "Exported", and the page doesn't reload (the photo stays on screen, on the Export step) |
| 5 | Tap **3000**, then **Share**, then **No** if a question card asks to upscale, then **Save Image** | A message begins "Exported" and the page doesn't reload |
| 6 | Open the Photos app | The two newest photos are the straightened card, at the crop's full size and at 3000 px on the long side |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot (press the side button and volume up together).

## EXP-36 Interpolation in the saved file

The saved photo is resampled with the chosen Interpolation; an upscale is always bicubic.

- Risk: low
- Check: script, saved file
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#interp`, `CONFIG.export.interp`
- Source: `js/app/export.js` (`upscaleRenderState`, `warpBand`)
- Cases: 2

### EXP-36.1 Bicubic gives a different file from Bilinear   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window, with downloads saved to a folder you can open
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/ (its crop is 1400 × 1400 px at the photo's own resolution)
- Starting screen: the photo open, on the Export step, with **1080** and **JPEG** selected and **Interpolation** Bilinear

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Download** | No question; a file IMG_9136-straight.jpg of 1080 × 1080 px is saved |
| 2 | Open **Export options**: on a phone, tap the **Options** tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls | The **Interpolation** row reads Bilinear |
| 3 | Tap the **Interpolation** row, choose **Bicubic (sharper, slower)**, then close the options (on a phone, the **×** at their top right) | The row read Bicubic |
| 4 | Tap **Download** | A second file of 1080 × 1080 px is saved |
| 5 | Compare the two files | They differ: the second was resampled another way |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot, and both files.

### EXP-36.2 An upscale is bicubic whatever Interpolation says   [auto: phone, webkit]
Before you start:
- Device and browser: any; a phone-width or a wide window, with downloads saved to a folder you can open
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/ (its crop is 1400 × 1400 px at the photo's own resolution)
- Starting screen: the photo open, on the Export step, with **3000** and **JPEG** selected and **Interpolation** Bilinear

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Download** | A question card asks "Upscale to 3000 px?" |
| 2 | Tap **Yes** | A file IMG_9136-straight.jpg of 3000 × 3000 px is saved |
| 3 | Open **Export options**: on a phone, tap the **Options** tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls | The **Interpolation** row reads Bilinear |
| 4 | Tap the **Interpolation** row, choose **Bicubic (sharper, slower)**, then close the options (on a phone, the **×** at their top right) | The row read Bicubic |
| 5 | Tap **Download**, then **Yes** on the question card | A second file of 3000 × 3000 px is saved |
| 6 | Compare the two files | They are the same, byte for byte: both upscales were bicubic |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot, and both files.

## EXP-37 The file name

The saved file is named **{photo name}-straight.jpg** (or .png, .webp), with "photo" as the name when the photo has none and "pasted-photo" for a pasted photo.

- Risk: medium
- Check: script, saved file
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.export.suffix`, "pasted-photo"
- Source: `js/app/export.js` (`exportBaseName`, `deliverExport`); `js/app/adapters.js` (`bindPaste`, `ImageSource.load`)
- Cases: 2

No case opens a photo with no name: the picker, a drop and a paste all give one, so "photo" is only a fallback in the code.

### EXP-37.1 The saved file is named for the photo and the format   [auto: phone, webkit]
Before you start:
- Device and browser: any; a phone-width or a wide window, with downloads saved to a folder you can open
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Export step, with **1080** and **JPEG** selected

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Download** | A file named IMG_9136-straight.jpg is saved |
| 2 | Tap **PNG**, then **Download** | A file named IMG_9136-straight.png is saved |
| 3 | Tap **WebP**, then **Download** | A file named IMG_9136-straight.webp is saved |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot, and the saved files' names.

### EXP-37.2 A pasted photo saves as pasted-photo-straight.jpg   [auto: desktop]
Before you start:
- Device and browser: a computer with a keyboard, Chrome or Edge; a wide window, with downloads saved to a folder you can open
- Build: the build under test, with no photo open (if it offers to resume, click **Start fresh**)
- Photo: IMG_9136.JPEG from samples/, opened in an image viewer and copied as an image (in the viewer, Copy, or Ctrl+C)
- Starting screen: the start screen

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Press Ctrl+V | The card photo opens and its corners are found |
| 2 | Click **Export** in the step bar, then **1080** | **1080** is selected |
| 3 | Click **Download** | A file named pasted-photo-straight.jpg is saved |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot, and the saved file's name.

## EXP-38 Format fallback

When the browser can't encode the chosen format (WebP in Safari), the file is saved as a PNG with a .png name, and the done message says so.

- Risk: medium
- Check: phone
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: " isn’t supported by this browser, so it was saved as "
- Source: `js/app/export.js` (`extensionFor`, `fallbackNote`, `toastSaved`)
- Flag: to confirm. The fallback sentence says what happened but gives no next step.
- Cases: 2

Playwright's WebKit can save WebP (a probe on 16 November 2026: its canvas encoded image/webp), so only a real iPhone shows the fallback; EXP-38.2 proves the app's side with a browser made unable to save WebP.

### EXP-38.1 On an iPhone, WebP is saved as a PNG and the message says so   [phone]
Flag: to confirm. Written to today's behavior: the sentence gives no next step.

Before you start:
- Device and browser: an iPhone, Safari
- Build: the build under test on the live site (HTTPS)
- Photo: IMG_9136.JPEG from samples/ (AirDrop it to the phone or save it to Photos first)
- Starting screen: the photo open, on the Export step, with **1080** selected

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **WebP** | **WebP** is selected; the size line reads Output 1080 × 1080 px · WEBP |
| 2 | Tap **Share** | The share sheet rises, with a file named IMG_9136-straight.png |
| 3 | Tap **Save Image** | A message over the photo reads "Exported 1080 × 1080 px in N s. WEBP isn’t supported by this browser, so it was saved as PNG." (N is the time it took) |
| 4 | Open the Photos app and look at the newest photo | It is the straightened card, 1080 × 1080 px |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot (press the side button and volume up together).

### EXP-38.2 Where WebP can't be saved, Download saves a PNG and says so   [auto: phone]
Flag: to confirm. Written to today's behavior: the sentence gives no next step.

Before you start:
- Device and browser: any; a phone-width or a wide window, in a browser that can't save WebP (Safari, or, for the script, a browser whose WebP saving is taken away so that it hands back a PNG, as Safari does), with downloads saved to a folder you can open
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Export step, with **1080** selected

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **WebP** | **WebP** is selected; the size line reads Output 1080 × 1080 px · WEBP |
| 2 | Tap **Download** | A file named IMG_9136-straight.png is saved |
| 3 | Look at the message over the photo | It reads "Exported 1080 × 1080 px in N s. WEBP isn’t supported by this browser, so it was saved as PNG." (N is the time it took), marked as a warning |
| 4 | Open the saved file | It is a PNG of 1080 × 1080 px |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot, and the saved file.

## EXP-39 The progress line

While a save runs, a progress line shows along the top edge of the Corner shots sheet for corner shots; for the main export it shows on the phone's open sheet, or else along the top edge of the open step's controls.

- Risk: low
- Check: script
- Layout: both. On a wide screen the sheets listed in the side panel don't count as open, so the main export's line is on the controls' top edge.
- Added: 1.10 baseline
- Changed: none
- Anchors: `.progress-line`, `#cornerShotsSheet`, `#exportArea`
- Source: `js/app/export.js` (`progressLine`, `runWithProgress`); `js/app/parts/progress-line.js` (`updateProgressLine`)
- Cases: 2

On a phone, an open sheet's dimmed backdrop covers **Share**, **Download** and **Copy** (EXP-20.1), so a person can't start the main export with a sheet open; no case shows the main export's line on a sheet.

### EXP-39.1 The main export's line runs on the top edge of Export's controls   [auto: both]
Before you start:
- Device and browser: any; a phone-width or a wide window, with downloads saved to a folder you can open
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Export step, with **2000** selected; on a phone, no sheet open

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Download** | A question card asks "Upscale to 2000 px?" |
| 2 | Tap **No**, and watch the top edge of the controls (on a wide screen, the top of the panel on the right, which lists **Export options** too) | A thin red line runs along the top edge of the controls, and on no other edge |
| 3 | Wait for the file to be saved | A file named IMG_9136-straight.jpg is saved, and the line has gone |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### EXP-39.2 Corner shots' line runs on the top edge of the Corner shots sheet   [auto: phone]
Before you start:
- Device and browser: a phone-width window, with downloads saved to a folder you can open
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Export step, no sheet open

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Corner shots** | The **Corner shots** sheet rises over the photo |
| 2 | Tap **Download corners** (and **No** if a question card asks to upscale), and watch the sheet's top edge | A thin red line runs along the top edge of the **Corner shots** sheet, and none along the top edge of the controls under it |
| 3 | Wait for the file to be saved | A file of the four corners is saved, and the line has gone |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## EXP-40 Corner shots before Export options

Export has two sets of options, **Corner shots** and **Export options**, in that order.

- Risk: low
- Check: script
- Layout: both. On a wide screen Corner shots is listed above Export options in the side panel; on a phone they are two separate sheets.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#cornerShotsSheet`, `#exportSheet`, "Export options"
- Source: `js/app/corner-shots.js` (`buildCornerShotsControls`); `js/app/export-controls.js` (`buildExportControls`)
- Cases: 1

### EXP-40.1 Corner shots comes before Export options   [auto: both]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Export step, no sheet open; on a wide screen, the panel on the right scrolled to its top

| # | Do this | You should see |
| --- | --- | --- |
| 1 | On a phone, tap the **Options** tab (the tab with an up arrow on the top edge of the controls); on a wide screen, look down the panel on the right | On a phone, a sheet titled **Export options** rises, with no corner close-ups in it; on a wide screen, the panel lists a **Corner shots** section, with four close-ups of the card's corners, and below it **Export options** |
| 2 | On a phone, close the sheet with the **×** at its top right, then tap **Corner shots**; on a wide screen, click **Corner shots** | On a phone, a separate sheet titled **Corner shots** rises, with the four close-ups and no **Quality** row; on a wide screen, **Corner shots** is still listed above **Export options** |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.
