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
- Cases: none yet

## EXP-02 No size selected for an unlisted long edge

When the edits hold a long edge that isn't one of the four sizes (from an edits file), none of the size choices is selected.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#exportSize`
- Source: `js/app/export-controls.js` (`syncExportControls`); `js/app/parts/segmented-control.js` (`updateSegmented`)
- Cases: none yet

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
- Cases: none yet

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
- Cases: none yet

## EXP-05 Nothing shown while the corners are invalid

While the corners are invalid, the size line is blank and no notes show.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#exportReadout`, `#exportMessage`
- Source: `js/app/export-controls.js` (`syncExportReadouts`)
- Cases: none yet

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
- Cases: none yet

## EXP-07 A note never hides a button

A note sits under the size line and never covers a button; after an export it stays in view beside **Next card**.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#exportMessage`, `#btnNextCard`
- Source: `js/app/export-controls.js` (`syncExportReadouts`)
- Cases: none yet

## EXP-08 Share

**Share** (red) renders the photo, then opens the system share sheet with the file or files.

- Risk: high
- Check: phone, script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnShare`, "Share or save the image (Save Image puts it in Photos)"
- Source: `js/app/export-controls.js` (`bindExport`); `js/app/export.js` (`doExport`, `deliverExport`, `shareExport`, `shareFiles`)
- Cases: none yet

## EXP-09 Save Image puts the photo in Photos

On an iPhone, **Save Image** in the share sheet puts the photo in Photos.

- Risk: high
- Check: phone
- Layout: phone. It is the iPhone's own share sheet.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Share’s Save Image puts the photo in Photos."
- Source: `js/app/export.js` (`shareFiles`)
- Cases: none yet

## EXP-10 Share is hidden where it can't work

**Share** is hidden, never dimmed, where the browser can't share files (it needs a secure page), or where a link turns `export.share` off.

- Risk: high
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnShare`, `CONFIG.export.share`
- Source: `js/app/export.js` (`Exporter.canShare`); `js/app/export-controls.js` (`syncSaveButtons`)
- Cases: none yet

## EXP-11 Download

**Download** is always shown and saves the file as a plain download; it turns red and wider when **Share** is hidden.

- Risk: high
- Check: script, saved file
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnDownload`
- Source: `js/app/export-controls.js` (`bindExport`, `syncSaveButtons`); `js/app/export.js` (`Exporter.download`, `deliverExport`)
- Cases: none yet

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
- Cases: none yet

## EXP-13 Copy is hidden where it can't work

**Copy** is hidden where the browser can't put images on the clipboard, and for a pair set to **Separately**.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnCopy`, `#pairOutput`
- Source: `js/app/export.js` (`Exporter.canCopy`); `js/app/export-controls.js` (`syncSaveButtons`)
- Cases: none yet

## EXP-14 The save buttons are dimmed when they can't run

**Share**, **Download** and **Copy** are dimmed while the corners are invalid, an export runs, or a pair's other side is opening.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnShare`, `#btnDownload`, `#btnCopy`
- Source: `js/app/export-controls.js` (`syncSaveButtons`)
- Cases: none yet

## EXP-15 Share now

If the browser refuses to share because the tap was too long ago (a slow export), the finished files are kept and **Share** reads **Share now**, live even while the rest is busy; tapping it shares them without rendering again.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnShare`, "Share now", " Tap Share now to open the share sheet."
- Source: `js/app/export.js` (`shareFiles`, `shareExport`, `sharePending`); `js/app/export-controls.js` (`bindExport`, `syncSaveButtons`)
- Cases: none yet

## EXP-16 An edit drops a waiting Share now

Any edit, or switching a pair's side, drops the files waiting for **Share now**, and the button reads **Share** again.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnShare`
- Source: `js/app/state.js` (`stateChanged`); `js/app/pair.js` (`applySide`)
- Cases: none yet

## EXP-17 A cancelled share

Cancelling the share sheet shows no message and doesn't count as exported.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnShare`, `#btnNextCard`
- Source: `js/app/export.js` (`shareFiles`, `shareExport`, `toastSaved`)
- Cases: none yet

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
- Cases: none yet

## EXP-19 Add back

**Add back** shows in the bottom row while the photo isn't part of a pair.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnAddBack`, "Keep this photo as the front and open the back"
- Source: `js/app/export-controls.js` (`buildMoreRow`, `syncExportReadouts`); `js/app/pair.js` (`bindPair`)
- Cases: none yet

## EXP-20 The Corner shots button

**Corner shots** brings the corner shots into view.

- Risk: medium
- Check: script
- Layout: both. On a phone it closes any other sheet and opens the Corner shots sheet. On a wide screen it scrolls the side panel to the Corner shots section only if the section isn't wholly in view, and moves the keyboard focus to its output choice.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnCornerShots`, `#cornerShotsSheet`, `#cornerOutput`
- Source: `js/app/corner-shots.js` (`openCornerShots`); `js/app/export-controls.js` (`bindExport`)
- Cases: none yet

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
- Cases: none yet

## EXP-22 What counts as exported

A Download (counted just before it starts), a completed Share and a completed Copy count as exported. A cancelled or failed share, corner shots and Save edits don't.

- Risk: high
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnNextCard`
- Source: `js/app/export.js` (`markExported`, `deliverExport`, `runExport`, `shareExport`)
- Cases: none yet

## EXP-23 Exported survives Resume

After a reload and **Resume**, edits that were exported still count as exported, so **Next card** shows.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnNextCard`, "Resumed where you left off."
- Source: `js/app/adapters.js` (`Session.snapshot`); `js/app/state.js` (`openFile`)
- Cases: none yet

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
- Cases: none yet

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
- Cases: none yet

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
- Cases: none yet

## EXP-27 A custom fill color

**Custom…** opens the color picker. A **Custom color** row with the color's hex value shows only while the fill is a custom color (even one that equals White, until the fill changes some other way); dragging the color is one undo step.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#fillColor`, `#fillColorRow`, `#fillColorValue`, "Custom color"
- Source: `js/app/export-controls.js` (`bindFill`, `openColorInput`, `syncFill`)
- Cases: none yet

## EXP-28 Where the fill is used

The fill paints the area outside the photo, the gap between a pair's two sides and the gap between the corner sheet's tiles; a JPEG with a Transparent fill is flattened onto white.

- Risk: medium
- Check: script, saved file
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#fill`, `CONFIG.export.fill`
- Source: `js/app/export.js` (`renderWarped`, `flattenOnWhite`, `encodeCanvas`); `js/app/corner-shots.js` (`encodeSheet`); `js/app/pair.js` (`encodeTogether`)
- Cases: none yet

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
- Cases: none yet

## EXP-30 The source line

**Export options** show the photo as the picker handed it over: **Source W × H px (MP) · type · MB · name**.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#sourceInfo`, "unknown type"
- Source: `js/app/export-controls.js` (`sourceInfo`, `syncSourceInfo`)
- Cases: none yet

## EXP-31 The version line

**Export options** show **Card Finisher** and the app's version.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#versionInfo`, "Card Finisher "
- Source: `js/app/export-controls.js` (`buildInfoLines`); `js/app/main.js` (`init`)
- Cases: none yet

## EXP-32 Rendered from the original photo

The saved file is rendered from the original full-resolution photo, with the applied levels and then the logo; the original is never changed.

- Risk: high
- Check: script, saved file
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: "Levels has unapplied changes; export uses the applied levels."
- Source: `js/app/export.js` (`renderFull`, `renderWarped`, `warpBand`)
- Cases: none yet

## EXP-33 The size rule

The long edge is fitted to the chosen size and never enlarged unless the Upscale answer is Yes; **Original** keeps the crop at the photo's own resolution.

- Risk: high
- Check: script, saved file
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.export.longEdge`, `CONFIG.export.allowUpscale`, "Original keeps the crop at the photo’s own resolution and never upscales."
- Source: `js/engine.js` (`outputSize`, `computeGeometry`); `js/app/export.js` (`exportGeometry`)
- Cases: none yet

## EXP-34 Output caps

The saved photo is at most 12000 px on its long side and 16,777,216 px in area; anything larger is scaled down.

- Risk: medium
- Check: script, saved file
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.maxOutputPx`, `CONFIG.maxOutputArea`
- Source: `js/engine.js` (`outputSize`)
- Cases: none yet

## EXP-35 A 48 MP photo on an iPhone

A 48 MP photo saves at **Original** and at **3000** on an iPhone without the page reloading, because it is rendered a band of rows at a time.

- Risk: high
- Check: phone
- Layout: phone. It is about the iPhone's memory.
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.export.bandPx`, `CONFIG.export.maxBandSrcPx`
- Source: `js/app/export.js` (`renderWarped`, `isRegionTooBig`)
- Cases: none yet

## EXP-36 Interpolation in the saved file

The saved photo is resampled with the chosen Interpolation; an upscale is always bicubic.

- Risk: low
- Check: script, saved file
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#interp`, `CONFIG.export.interp`
- Source: `js/app/export.js` (`upscaleRenderState`, `warpBand`)
- Cases: none yet

## EXP-37 The file name

The saved file is named **{photo name}-straight.jpg** (or .png, .webp), with "photo" as the name when the photo has none and "pasted-photo" for a pasted photo.

- Risk: medium
- Check: script, saved file
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.export.suffix`, "pasted-photo"
- Source: `js/app/export.js` (`exportBaseName`, `deliverExport`); `js/app/adapters.js` (`bindPaste`, `ImageSource.load`)
- Cases: none yet

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
- Cases: none yet

## EXP-39 The progress line

While a save runs, a progress line shows along the top edge of the Corner shots sheet for corner shots; for the main export it shows on the phone's open sheet, or else along the top edge of the open step's controls.

- Risk: low
- Check: script
- Layout: both. On a wide screen the sheets listed in the side panel don't count as open, so the main export's line is on the controls' top edge.
- Added: 1.10 baseline
- Changed: none
- Anchors: `.progress-line`, `#cornerShotsSheet`, `#exportArea`
- Source: `js/app/export.js` (`progressLine`, `runWithProgress`); `js/app/parts/progress-line.js` (`updateProgressLine`)
- Cases: none yet

## EXP-40 Corner shots before Export options

Export has two sets of options, **Corner shots** and **Export options**, in that order.

- Risk: low
- Check: script
- Layout: both. On a wide screen Corner shots is listed above Export options in the side panel; on a phone they are two separate sheets.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#cornerShotsSheet`, `#exportSheet`, "Export options"
- Source: `js/app/corner-shots.js` (`buildCornerShotsControls`); `js/app/export-controls.js` (`buildExportControls`)
- Cases: none yet
