# Corner shots

Close-ups of the card's four corners, saved as one 2×2 sheet or as four photos, from the Corner shots button on Export.

## CNR-01 The Corner shots sheet

Corner shots have their own sheet, titled **Corner shots**, which closes like any other sheet.

- Risk: medium
- Check: script
- Layout: both. On a phone the **Corner shots** button on Export opens it; on a wide screen it is a section of the side panel, always open.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#cornerShotsSheet`, `#btnCornerShots`, "Close-ups of the card’s four corners"
- Source: `js/app/corner-shots.js` (`buildCornerShotsControls`, `openCornerShots`)
- Cases: none yet

## CNR-02 Four live thumbnails

Four thumbnails (top-left, top-right, bottom-left, bottom-right) show each corner as it will be framed, with the applied levels and no logo, on the export fill, or on the app's dark gray when the fill is Transparent. While the corners are invalid or the card is too small, they show only that background.

- Risk: medium
- Check: eye
- Layout: both. On a phone they are drawn while the sheet is open; on a wide screen whenever Export is the step.
- Added: 1.10 baseline
- Changed: none
- Anchors: `.corner-thumbs`, "Top-left corner", `CONFIG.theme.stage`
- Source: `js/app/corner-shots.js` (`areThumbsShown`, `requestThumbs`, `drawThumbs`, `drawThumb`)
- Cases: none yet

## CNR-03 Four photos or one sheet

**4 photos** or **1 sheet** picks what is saved. The choice is remembered (the default is 1 sheet), and changing it drops files waiting for **Share now**.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#cornerOutput`, `CONFIG.cornerShots.output`, "4 photos", "1 sheet"
- Source: `js/app/corner-shots.js` (`storedOutput`, `setOutput`, `bindCornerShots`)
- Cases: none yet

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
- Cases: none yet

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
- Cases: none yet

## CNR-06 Download corners

**Download corners** is always shown; it is red when **Share corners** is hidden.

- Risk: high
- Check: script, saved file
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnCornerDownload`, "Download corners"
- Source: `js/app/corner-shots.js` (`bindCornerShots`, `deliverCornerShots`)
- Cases: none yet

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
- Cases: none yet

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
- Cases: none yet

## CNR-09 How each shot is framed

Each shot is a square, a quarter of the card's short edge on a side, with the card's corner 30% of the square in from its two outer edges. It is framed like the export (the same tilt), at the photo's own resolution up to 2000 px.

- Risk: high
- Check: script, saved file
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.cornerShots.sizeFraction`, `CONFIG.cornerShots.insetFraction`, `CONFIG.cornerShots.maxPx`
- Source: `js/engine.js` (`cornerShots`, `cornerSquare`)
- Cases: none yet

## CNR-10 The sheet

The sheet is one square image, top-left and top-right over bottom-left and bottom-right, with a gap between the tiles of 0.8% of two tiles' width, in the export fill, and no outer margin.

- Risk: high
- Check: script, saved file
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.cornerShots.gutterPct`, "1 sheet"
- Source: `js/app/corner-shots.js` (`encodeSheet`); `js/engine.js` (`cornerSheetLayout`)
- Cases: none yet

## CNR-11 Four photos

With **4 photos**, **Download corners** saves four files, 250 ms apart, and **Share corners** puts all four in one share sheet.

- Risk: medium
- Check: script, saved file
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnCornerDownload`, "4 photos"
- Source: `js/app/corner-shots.js` (`encodePhotos`, `deliverCornerShots`, `shareCornerShots`)
- Cases: none yet

## CNR-12 The export settings carry over

The format, Quality and fill follow the Export settings; the applied levels are in, and the logo never is.

- Risk: high
- Check: script, saved file
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#exportFormat`, `#quality`, `#fill`
- Source: `js/app/corner-shots.js` (`renderAndSave`, `renderShot`, `encodeSheet`); `js/app/export.js` (`renderWarped`, `encodeCanvas`)
- Cases: none yet

## CNR-13 File names

The sheet is saved as **{photo}-corners.{ext}**, and the four photos as **{photo}-corner-tl**, **-tr**, **-br** and **-bl**.

- Risk: medium
- Check: script, saved file
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: "-corners.", "-corner-"
- Source: `js/app/corner-shots.js` (`encodeSheet`, `encodePhotos`); `js/engine.js` (`CORNER_LABELS`)
- Cases: none yet

## CNR-14 Progress

A progress line along the top edge of the Corner shots sheet runs once over all four shots.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#cornerShotsSheet`, `.progress-line`
- Source: `js/app/corner-shots.js` (`renderShot`, `renderAndSave`); `js/app/export.js` (`runWithProgress`)
- Cases: none yet

## CNR-15 Corner shots never bring Next card

Saving corner shots never counts the edits as exported, so it never brings **Next card**.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnNextCard`, `#btnCornerDownload`
- Source: `js/app/corner-shots.js` (`saveCornerShots`, `deliverCornerShots`)
- Cases: none yet

## CNR-16 Corner shots in a pair

In a front and back pair, the corner shots are of the side that is open.

- Risk: medium
- Check: script, saved file
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnCornerDownload`, `#sideSwitch`
- Source: `js/app/corner-shots.js` (`currentShots`, `renderAndSave`)
- Cases: none yet
