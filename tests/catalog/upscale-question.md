# The Upscale question

The question asked before saving a file smaller than the chosen size, and what each answer does, for a single photo, a pair and the corner shots.

## UPS-01 Asked for a small single photo

For a single photo, **Download**, **Share** and **Copy** first ask **Upscale to {Size} px?** when a size is chosen and the saved file's long edge would be smaller than it.

- Risk: high
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#pairPrompt`, "Upscale to ", "The crop is "
- Source: `js/app/export.js` (`doExport`, `offeredUpscale`, `askUpscale`)
- Cases: none yet

## UPS-02 Yes

**Yes** saves at the chosen size, resampled bicubic whatever Interpolation says, and sharpened before the logo is drawn.

- Risk: high
- Check: script, saved file
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnPromptFirst`, `CONFIG.upscale.sharpenSigma`, `CONFIG.upscale.sharpenAmount`, `CONFIG.upscale.sharpenThreshold`
- Source: `js/app/export.js` (`renderFull`, `exportGeometry`, `upscaleRenderState`, `sharpenUpscaled`, `sharpenOptions`)
- Cases: none yet

## UPS-03 No, and Cancel

**No** saves at the real size; **Cancel**, a tap outside the card or Escape saves nothing.

- Risk: medium
- Check: script, saved file
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnPromptSecond`, `#btnPromptCancel`, `key:Escape`
- Source: `js/app/export.js` (`askUpscale`); `js/app/parts/alert-card.js` (`answerAlert`, `hideAlert`)
- Cases: none yet

## UPS-04 When it isn't asked

The question is never asked for **Original**, nor when the file is already at or over the chosen size, nor when a link turns `export.allowUpscale` on.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#exportSize`, `CONFIG.export.allowUpscale`
- Source: `js/app/export.js` (`offeredUpscale`); `js/app/pair.js` (`pairUpscaleOffer`)
- Cases: none yet

## UPS-05 A pair saved Together

For a pair saved **Together**, it is asked when the joined image's long edge is under the chosen size; **Yes** fits that long edge to exactly the size, unless that would pass a canvas cap.

- Risk: medium
- Check: script, saved file
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#pairOutput`, "The image is ", " px at the photos’ resolution."
- Source: `js/app/pair.js` (`pairUpscaleOffer`, `togetherLayout`, `encodeTogether`); `js/engine.js` (`pairLayout`)
- Cases: none yet

## UPS-06 A pair saved Separately

For a pair saved **Separately**, it is asked when either side's file is under the chosen size; **Yes** gives each side that size, and a side already there is not sharpened.

- Risk: medium
- Check: script, saved file
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#pairOutput`, "The front is ", " px and the back "
- Source: `js/app/pair.js` (`pairUpscaleOffer`, `encodeSeparately`, `renderSideInto`)
- Cases: none yet

## UPS-07 Corner shots

For corner shots it is asked when the file (the sheet, or each photo) would be under 2000 px; **Yes** makes the file exactly 2000 px, bicubic and sharpened.

- Risk: medium
- Check: script, saved file
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.cornerShots.upscaleTargetPx`, "Each corner is", "The sheet is"
- Source: `js/app/corner-shots.js` (`saveCornerShots`, `filePx`, `upscaledTilePx`, `renderAndSave`, `renderShot`); `js/engine.js` (`cornerSheetTilePx`)
- Cases: none yet

## UPS-08 Over the open Corner shots sheet

On a phone, the question for corner shots sits above the open Corner shots sheet.

- Risk: low
- Check: script
- Layout: phone. A wide screen lists the sheet in the side panel, and the card sits over the photo.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#pairPrompt`, `#cornerShotsSheet`
- Source: `css/app.css` (the alert card part's rules); `js/app/pair.js` (`showPrompt`)
- Cases: none yet

## UPS-09 The answer is for one export

The answer counts for one export only: it isn't stored, isn't part of the edits, and isn't asked again for **Share now**.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnShare`, "Share now"
- Source: `js/app/export.js` (`doExport`, `sharePending`)
- Cases: none yet

## UPS-10 Copy after an answer

After **Yes** or **No**, **Copy** still reaches the clipboard within the tap that answered.

- Risk: medium
- Check: phone
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnCopy`, `#btnPromptFirst`
- Source: `js/app/parts/alert-card.js` (`answerAlert`); `js/app/export.js` (`runExport`, `Exporter.copy`)
- Cases: none yet
