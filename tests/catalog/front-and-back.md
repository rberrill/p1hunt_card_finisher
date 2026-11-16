# Front and back pairs

Pairing a card's front and back: Add back, switching sides, Unpair, the 5:7 lock, the shared export settings, saving the pair Together or Separately, and bringing a pair back with Resume.

## PAIR-01 Add back

On Export, **Add back** keeps the open photo as the front, with its edits and undo history, and opens the picked photo as the back, which starts like any new photo.

- Risk: high
- Check: script
- Layout: both. On a phone it sits in Export's bottom row; on a wide screen in the same row of the side panel.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnAddBack`, "Keep this photo as the front and open the back", `#fileInput`
- Source: `js/app/pair.js` (`startPair`, `receivePhoto`, `bindPair`), `js/app/export-controls.js` (`buildMoreRow`)
- Ruling: R17. While an export runs, Add back is dimmed with the save buttons (as are Size, Format, the options sheet's settings, Load edits, Undo and Redo); the tab bar stays live. The app differs today.
- Cases: none yet

## PAIR-02 The pair takes the front's orientation

The pair's orientation is the front's crop orientation at the moment **Add back** is tapped, and the front's crop becomes 5:7, fitted to the card.

- Risk: medium
- Check: script
- Layout: both. No difference.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnAddBack`, "5:7 card"
- Source: `js/app/pair.js` (`startPair`, `lockOtherCrop`, `lockCrop`), `js/app/state.js` (`cropOrient`)
- Cases: none yet

## PAIR-03 A back that can't be opened leaves no pair

If the photo picked for the back can't be opened, nothing changes: the front stays a single photo and there is no pair.

- Risk: low
- Check: script
- Layout: both. No difference.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnAddBack`, "Couldn’t read that file as an image."
- Source: `js/app/pair.js` (`startPair`), `js/app/state.js` (`openFile`)
- Cases: none yet

## PAIR-04 The Front and Back switch

While paired, a **Front** / **Back** switch sits in the center of the top bar on every step. The white fill moves to the tapped side at the tap, before that side has opened.

- Risk: high
- Check: script
- Layout: both. On a wide screen the top bar also holds the steps; the switch is in its center on both.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#sideSwitch`, "Front", "Back"
- Source: `js/app/parts/top-bar.js` (`buildTopBar`, `updateTopBar`), `js/app/pair.js` (`setSwitching`, `syncPair`, `bindPair`)
- Cases: none yet

## PAIR-05 Switching keeps the step

Switching sides keeps the step you are on: Crop on the back opens Crop on the front.

- Risk: medium
- Check: script
- Layout: both. No difference.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#sideSwitch`
- Source: `js/app/pair.js` (`switchSide`)
- Cases: none yet

## PAIR-06 A side that can't be read changes nothing

The other side's photo is read before the open one is let go, so if it can't be read, an error message shows and everything stays as it was.

- Risk: medium
- Check: script
- Layout: both. No difference.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#sideSwitch`, "Couldn’t read that file as an image."
- Source: `js/app/pair.js` (`switchSide`), `js/app/adapters.js` (`ImageSource.load`)
- Cases: none yet

## PAIR-07 Each side keeps its own work

Each side keeps its own edits, undo history, unapplied Levels changes and the dot on the Levels tab, its exported mark, its zoom, its selected corner and its detection results across switches.

- Risk: high
- Check: script
- Layout: both. No difference.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#sideSwitch`, `#btnUndo`, `#btnRedo`
- Source: `js/app/pair.js` (`captureSide`, `applySide`, `switchSide`)
- Cases: none yet

## PAIR-08 A switch clears what was in progress

A switch turns off Tap to find card, an armed white or black pick, the before-levels comparison and Preview, clears Overlay's file error, and drops a share waiting for **Share now**.

- Risk: low
- Check: script
- Layout: both. No difference.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnFindCard`, `#toolPreview`, "Share now"
- Source: `js/app/pair.js` (`applySide`)
- Cases: none yet

## PAIR-09 Busy while a side opens or an export runs

**Front** / **Back** and **Unpair** are dimmed while an export runs or a side is opening. While a side is opening (a switch, or the back's first opening after **Add back**), **Share**, **Download**, **Copy**, **Together** / **Separately** and the corner-shots save buttons are dimmed too, and a photo opened then is refused with a message.

- Risk: medium
- Check: script
- Layout: both. No difference.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#sideSwitch`, `#btnUnpair`, `#btnDownload`, "Wait for the export to finish, then open the photo."
- Source: `js/app/pair.js` (`setSwitching`, `startPair`, `switchSide`, `syncPair`, `receivePhoto`), `js/app/export-controls.js` (`syncSaveButtons`), `js/app/corner-shots.js` (`syncCornerShots`), `js/app/export.js` (`doExport`)
- Ruling: R13. A photo opened while a side is opening says "Wait for the other side to open, then open the photo."; the export wording stays for a running export. The app differs today. New wording, to be approved by Rich.
- Cases: none yet

## PAIR-10 The Unpair button

An **Unpair** button (an icon, tooltip "Unpair (keep one side)") sits beside **Front** / **Back**, only while paired.

- Risk: medium
- Check: script
- Layout: both. No difference.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnUnpair`, "Unpair (keep one side)"
- Source: `js/app/parts/top-bar.js` (`buildTopBar`, `updateTopBar`), `js/app/pair.js` (`bindPair`, `syncPair`)
- Cases: none yet

## PAIR-11 Unpair asks which side to keep

**Unpair** asks on a card over the photo: **Keep front**, **Keep back** or **Cancel**. Keeping the side that isn't open switches to it first.

- Risk: high
- Check: script
- Layout: both. On a phone the card's backdrop covers the bars; on a wide screen only the photo is dimmed and the bars stay readable but take no input.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#pairPrompt`, "Keep one side as a single photo.", "Keep front", "Keep back"
- Source: `js/app/pair.js` (`askUnpair`, `unpair`, `switchSide`, `showPrompt`)
- Cases: none yet

## PAIR-12 After Unpair

After **Unpair** the kept side is a single photo: its crop stays 5:7, the crop presets unlock, the pair's stored records are deleted, and Resume brings back the kept side's photo.

- Risk: high
- Check: script
- Layout: both. No difference.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnUnpair`, "Unpaired. The ", `#btnResume`
- Source: `js/app/pair.js` (`unpair`, `clearPairSession`), `js/app/crop.js` (`pickCropPreset`, `syncCrop`)
- Ruling: R25. Unpair waits until the kept side's photo is stored before saying "Unpaired", so a reload straight after resumes the kept side. The app differs today.
- Cases: none yet

## PAIR-13 Opening a photo while paired asks first

**Open**, a dropped photo or a pasted photo while paired asks on a card: **New photo**, **Replace front** or **Replace back** (the side you are on), or **Cancel**.

- Risk: high
- Check: script
- Layout: both. On a phone the card's backdrop covers the bars; on a wide screen only the photo is dimmed.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#pairPrompt`, "End the pair, or replace the side you’re on?", `#btnPromptFirst`, `#btnPromptSecond`
- Source: `js/app/pair.js` (`receivePhoto`, `showPrompt`), `js/app/main.js` (`bindPhotoInput`)
- Flag: to confirm. The card's title and its first button both read **New photo**.
- Cases: none yet

## PAIR-14 New photo ends the pair

**New photo** ends the pair and opens the photo as a single photo; if it can't be read, the pair stays.

- Risk: medium
- Check: script
- Layout: both. No difference.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnPromptFirst`, "New photo"
- Source: `js/app/pair.js` (`openSingle`, `clearPairSession`)
- Cases: none yet

## PAIR-15 Replace the side you are on

**Replace front** or **Replace back** replaces the open side's photo, with fresh edits, and keeps the pair.

- Risk: medium
- Check: script
- Layout: both. No difference.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnPromptSecond`, "Replace "
- Source: `js/app/pair.js` (`replaceSide`, `savePairSession`)
- Cases: none yet

## PAIR-16 Next card after a pair's export

**Next card** after a pair's export opens the picked photo as a single photo without asking.

- Risk: medium
- Check: script
- Layout: both. No difference.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnNextCard`, "Open the next photo"
- Source: `js/app/pair.js` (`receivePhoto`, `openSingle`), `js/app/export-controls.js` (`bindExport`), `js/app/shell.js` (`pickPhoto`)
- Cases: none yet

## PAIR-17 Add back is hidden while paired

**Add back** is hidden while a pair is open.

- Risk: low
- Check: script
- Layout: both. No difference.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnAddBack`
- Source: `js/app/export-controls.js` (`syncExportReadouts`)
- Cases: none yet

## PAIR-18 Both sides locked to 5:7

Both sides are locked to the 5:7 crop in the pair's one orientation. The lock is applied again after every change, so neither Undo nor a loaded edits file can break it; a box drawn by hand more than 1% off 5:7 goes back to fit the card.

- Risk: high
- Check: script
- Layout: both. No difference.
- Added: 1.10 baseline
- Changed: none
- Anchors: "5:7 card", `#cropPresets`
- Source: `js/app/pair.js` (`applyPairRules`, `lockCrop`), `js/app/state.js` (`stateChanged`)
- Cases: none yet

## PAIR-19 Crop shows the lock

On Crop while paired only the selected **5:7 card** preset is enabled (it reads **7:5 card** for a landscape pair), and the line above the presets reads **Pair: 5:7 only** at its right.

- Risk: medium
- Check: script
- Layout: both. On a phone the row of presets scrolls sideways; on a wide screen it wraps.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Pair: 5:7 only", `#cropPairNote`, `#cropPresets`
- Source: `js/app/crop.js` (`buildCropLine`, `pickCropPreset`, `syncCrop`)
- Cases: none yet

## PAIR-20 Swap turns both sides

**Swap** while paired turns both sides' crops between portrait and landscape, and is not an undo step: tapping **Swap** again turns them back.

- Risk: medium
- Check: script
- Layout: both. No difference.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#toolSwap`
- Source: `js/app/pair.js` (`swapPair`, `lockOtherCrop`), `js/app/crop.js` (`bindCrop`)
- Flag: to confirm. Swap is an undo step for a single photo but not in a pair, so Undo after a pair's Swap doesn't turn the crop back.
- Cases: none yet

## PAIR-21 Shared export settings

The export settings (**Size**, **Format**, **Quality**, **Interpolation** and **Fill outside photo**) are shared: a change on the open side is copied to the other.

- Risk: medium
- Check: script
- Layout: both. On a phone Quality, Interpolation and Fill are in Export's options sheet; on a wide screen they are listed in the side panel.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#exportSize`, `#exportFormat`, `#quality`, `#interp`, `#fill`
- Source: `js/app/pair.js` (`applyPairRules`), `js/app/shell.js` (`resetStep`)
- Flag: to confirm. **Reset export settings** on one side resets both sides' export settings, and leaves Together / Separately as it was.
- Cases: none yet

## PAIR-22 The lock is never remembered

The pair's 5:7 lock never becomes the remembered crop preset; after Unpair the remembered preset stays as it was until a preset is picked.

- Risk: medium
- Check: script
- Layout: both. No difference.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#cropPresets`, `CONFIG.storageKey`, `CONFIG.crop.defaultPreset`
- Source: `js/app/adapters.js` (`Prefs.save`), `js/app/state.js` (`openFile`), `js/app/crop.js` (`pickCropPreset`)
- Cases: none yet

## PAIR-23 One side's Undo stays on that side

**Undo** and **Redo** on one side never change the other side, apart from the shared export settings.

- Risk: medium
- Check: script
- Layout: both. No difference.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnUndo`, `#btnRedo`, `#sideSwitch`
- Source: `js/app/pair.js` (`captureSide`, `applySide`, `applyPairRules`), `js/app/state.js` (`undo`, `redo`)
- Cases: none yet

## PAIR-24 Each side keeps its own logo

Each side keeps its own logo and its placement, in the Together preview and in the saved files.

- Risk: medium
- Check: script, saved file
- Layout: both. No difference.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnOverlayAdd`, `#toolOverlayReplace`, `#sideSwitch`
- Source: `js/app/pair.js` (`renderSideInto`, `drawPreviewSides`, `savePairSession`), `js/app/overlay.js` (`compositeOverlay`)
- Cases: none yet

## PAIR-25 Together or Separately

While paired, a **Together** / **Separately** control sits beside the size line on Export. The choice is remembered (Together until one is picked) and the control is dimmed while an export runs or a side is opening.

- Risk: high
- Check: script
- Layout: both. On a phone, while a note shows, the note takes the size line's place beside the control; on a wide screen both stay.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#pairOutput`, "Together", "Separately", `CONFIG.pair.output`
- Source: `js/app/export-controls.js` (`buildReadoutRow`, `syncExportControls`, `syncSaveButtons`), `js/app/pair.js` (`storedPairOutput`, `setPairOutput`), `js/app/adapters.js` (`Prefs.save`)
- Cases: none yet

## PAIR-26 The Together image

Together saves one joined image: portrait cards side by side with the front on the left, landscape cards stacked with the front on top, a gap of 0.8% in the fill color between them and no outer margin. Each side is at its own export size (a smaller side is centered in its half) with its own logo.

- Risk: high
- Check: script, saved file
- Layout: both. No difference.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Together", `CONFIG.pair.gutterPct`, `#btnDownload`
- Source: `js/app/pair.js` (`togetherLayout`, `encodeTogether`, `renderSideInto`, `togetherFile`), `js/engine.js` (`pairLayout`)
- Cases: none yet

## PAIR-27 A Together image over the size limit

A Together image larger than the browser's canvas limits scales both sides down by the same factor.

- Risk: low
- Check: script, saved file
- Layout: both. No difference.
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.maxOutputArea`, `CONFIG.maxOutputPx`
- Source: `js/app/pair.js` (`togetherLayout`), `js/engine.js` (`pairLayout`, `pairScale`)
- Cases: none yet

## PAIR-28 Separately saves two files

Separately saves two files, each identical to that side's own export.

- Risk: high
- Check: script, saved file
- Layout: both. No difference.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Separately", `#btnDownload`
- Source: `js/app/pair.js` (`encodeSeparately`, `renderSideInto`)
- Cases: none yet

## PAIR-29 Pair file names

Together's file is named after the front photo with **-pair** added; Separately's are the front photo's name with **-front** and the back photo's name with **-back**, each with the format's extension.

- Risk: medium
- Check: script, saved file
- Layout: both. No difference.
- Added: 1.10 baseline
- Changed: none
- Anchors: "-pair.", `#btnDownload`
- Source: `js/app/pair.js` (`togetherFile`, `encodeSeparately`), `js/app/export.js` (`exportBaseName`)
- Cases: none yet

## PAIR-30 Downloading a pair

**Download** saves one file for Together, and two downloads 250 ms apart for Separately.

- Risk: medium
- Check: script, saved file
- Layout: both. No difference.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnDownload`, "the Together image", "the front and back"
- Source: `js/app/pair.js` (`deliverPair`)
- Cases: none yet

## PAIR-31 Both downloads arrive on an iPhone

On an iPhone, both of Separately's downloads arrive.

- Risk: medium
- Check: phone
- Layout: phone. iPhone Safari only.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnDownload`
- Source: `js/app/pair.js` (`deliverPair`)
- Cases: none yet

## PAIR-32 Sharing a pair

**Share** opens one share sheet holding the one file (Together) or both files (Separately).

- Risk: medium
- Check: phone; script
- Layout: both. Share shows only on a secure page whose browser can share files.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnShare`
- Source: `js/app/pair.js` (`deliverPair`), `js/app/export.js` (`shareExport`, `shareFiles`)
- Cases: none yet

## PAIR-33 Copying a pair

**Copy** puts the Together image on the clipboard as PNG. It is hidden while Separately is chosen.

- Risk: medium
- Check: script
- Layout: both. Copy shows only on a secure page whose browser can copy images.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnCopy`, "Copied to clipboard (PNG)."
- Source: `js/app/pair.js` (`runPairExport`, `encodeTogether`), `js/app/export.js` (`doExport`), `js/app/export-controls.js` (`syncSaveButtons`)
- Cases: none yet

## PAIR-34 When a pair counts as exported

A pair counts as exported for both sides' edits together with the Together / Separately choice; changing either side, or the choice, hides **Next card**.

- Risk: medium
- Check: script
- Layout: both. No difference.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnNextCard`, `#pairOutput`
- Source: `js/app/pair.js` (`pairKey`, `isPairExported`, `markPairExported`), `js/app/export-controls.js` (`syncNextCard`)
- Cases: none yet

## PAIR-35 One full-size photo in memory at a time

A pair's export holds one full-resolution photo at a time: the open side is rendered and let go, the other side is read, used and closed, then the open side is read again.

- Risk: high
- Check: script; phone
- Layout: both. No difference; the memory limit that makes it matter is the iPhone's.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnDownload`, `#btnShare`
- Source: `js/app/pair.js` (`forEachSidePhoto`, `reloadOpenPhoto`)
- Cases: none yet

## PAIR-36 The open photo can't be read again after an export

If the open side's photo can't be read again after a pair's export (two tries), a warning says so and how to get it back. The screen keeps drawing from the smaller copies, and every full-size save refuses until a side switch.

- Risk: low
- Check: script
- Layout: both. No difference.
- Added: 1.10 baseline
- Changed: none
- Anchors: "The photo isn’t loaded after the last export. ", "Tap Front or Back to switch sides, then switch back."
- Source: `js/app/pair.js` (`reloadOpenPhoto`, `runPairExport`), `js/app/export.js` (`renderWarped`)
- Cases: none yet

## PAIR-37 The pair's size line

On Export the size line reads **W × H px · FORMAT** for Together, and **front W × H + back W × H px · FORMAT** for Separately.

- Risk: medium
- Check: script
- Layout: both. On a phone, while a note shows, the note takes the size line's place; on a wide screen the size line stays.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#exportReadout`, `#exportMessage`, `#pairOutput`
- Source: `js/app/export-controls.js` (`syncExportReadout`, `exportNotes`), `js/app/pair.js` (`pairReadout`, `togetherLayout`)
- Ruling: R14. For a pair saved Separately, the clamp note shows if either side is scaled down, and names that side when it is not the one on screen. R26. When the waiting side's corners are invalid, the line names the side to fix ("Fix the back’s corners in Perspective first.") and Share, Download and Copy are dimmed. The app differs today. New wording, to be approved by Rich.
- Cases: none yet

## PAIR-38 The Together preview

While Together is chosen, Export shows the joined image as it will be saved (each side's levels and logo, and a checkerboard where the fill is transparent); with Separately it shows the side you are on.

- Risk: medium
- Check: eye
- Layout: both. No difference.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Fix the corners of both sides in Perspective first.", `CONFIG.pair.previewMaxPx`, `#pairOutput`
- Source: `js/app/pair.js` (`isTogetherShown`, `togetherPreview`, `drawPreviewSides`, `renderPreviewSide`), `js/app/view.js` (`drawTogether`)
- Cases: none yet

## PAIR-39 The Together preview's own zoom

The Together preview has its own zoom and pan, which fit the screen again when the image's size or the Together / Separately choice changes.

- Risk: low
- Check: script
- Layout: both. On a phone **Fit** shows only while zoomed or panned; on a wide screen it always shows.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnFit`, `#pairOutput`
- Source: `js/app/view.js` (`togetherView`, `viewKey`), `js/app/pair.js` (`setPairOutput`)
- Cases: none yet

## PAIR-40 The pair is stored for Resume

The pair is stored for Resume: the open side as for any photo, plus the waiting side's photo, edits, unapplied Levels changes, step and logo, the side that was open, the orientation and whether it was exported.

- Risk: high
- Check: script
- Layout: both. No difference.
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.session.enabled`, `CONFIG.session.saveDelayMs`
- Source: `js/app/pair.js` (`savePairSession`, `savePairSoon`)
- Cases: none yet

## PAIR-41 Resume brings the pair back

**Resume** rebuilds the waiting side first, then opens the side that was open. The waiting side comes back with no undo history, and **Next card** shows again if the pair had been exported.

- Risk: high
- Check: script
- Layout: both. No difference.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnResume`, `#resumeName`, `#btnNextCard`
- Source: `js/app/pair.js` (`restorePair`, `restoredSide`, `finishResume`), `js/app/start-screen.js` (`resumeSession`)
- Cases: none yet

## PAIR-42 A damaged stored pair

A stored pair that is damaged or doesn't match its photo is dropped, and the open side resumes alone with a warning.

- Risk: low
- Check: script
- Layout: both. No difference.
- Added: 1.10 baseline
- Changed: none
- Anchors: "The saved pair wasn’t valid, so it was reset. ", "This photo resumed on its own."
- Source: `js/app/pair.js` (`restorePair`, `isPairRecord`, `restoredSide`, `finishResume`)
- Cases: none yet

## PAIR-43 Detection for a resumed side

A side brought back by Resume has no detection results, so the first switch to it runs detection quietly, keeping its corners where they are.

- Risk: low
- Check: script
- Layout: both. No difference.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#toolCandidate`, `#sideSwitch`
- Source: `js/app/pair.js` (`switchSide`), `js/app/state.js` (`runDetect`)
- Cases: none yet
