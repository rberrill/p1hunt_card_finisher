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
- Cases: none yet

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
- Cases: none yet

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
- Cases: none yet

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
- Cases: none yet

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
- Cases: none yet

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
- Cases: none yet

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
- Cases: none yet

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
- Cases: none yet

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
- Cases: none yet
