# Front and back pairs

Pairing a card's front and back: Add back, switching sides, Unpair, the 5:7 lock, the shared export settings, saving the pair Together or Separately, and bringing a pair back with Resume.

## PAIR-01 Add back

On Export, **Add back** keeps the open photo as the front, with its edits and undo history, and opens the picked photo as the back, which starts like any new photo.

- Risk: high
- Check: script
- Layout: both. On a phone it sits in Export's bottom row; on a wide screen in the same row of the side panel.
- Added: 1.10 baseline
- Changed: 1.10.0
- Anchors: `#btnAddBack`, "Keep this photo as the front and open the back", `#fileInput`
- Source: `js/app/pair.js` (`startPair`, `receivePhoto`, `bindPair`), `js/app/export-controls.js` (`buildMoreRow`, `syncExportLock`)
- Ruling: R17. While an export runs, Add back is dimmed with the save buttons (as are Size, Format, the options sheet's settings, Load edits, Undo and Redo); the tab bar stays live. The app does this since 1.10.0.
- Cases: 2

### PAIR-01.1 Add back keeps the front and opens the back   [auto: phone, webkit]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: the front open on its own, on the Rotate step, the angle at 0.0°

Type the angle N: tap the angle (**0.0°**, with a pencil after it), type N, tap **Done**.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Type the angle 2 | The angle reads 2.0° |
| 2 | Tap **Export** in the step tabs | The Export step shows **Add back** in its bottom row |
| 3 | Tap **Add back** | The photo picker opens |
| 4 | Choose 14_back_portrait_raw_white.JPEG | The back opens on the Perspective step; **Front** / **Back** shows in the middle of the top bar with **Back** in white; **Undo** (the arrow curving left, at the top right) is greyed out |
| 5 | Tap **Rotate** in the step tabs | The back's angle reads 0.0°: it starts like any new photo |
| 6 | Tap **Front** in the top bar | The front opens on Rotate; its angle reads 2.0° |
| 7 | Tap **Undo** | The angle reads 0.0°: the front kept its undo history |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### PAIR-01.2 Add back is dimmed while an export runs   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 14_front_portrait_raw_white.JPEG from samples/
- Starting screen: the photo open on its own, on the Export step, Size **Original** selected

An export takes well under a second, so watch the bottom row closely, or record the screen and step through it.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the bottom row | **Add back** is there and can be tapped |
| 2 | Tap **Download** | While the progress line runs along the top edge of the controls, **Add back** is greyed out with **Download** |
| 3 | Wait for the file to arrive | **Add back** can be tapped again |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## PAIR-02 The pair takes the front's orientation

The pair's orientation is the front's crop orientation at the moment **Add back** is tapped, and the front's crop becomes 5:7, fitted to the card.

- Risk: medium
- Check: script
- Layout: both. No difference.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnAddBack`, "5:7 card"
- Source: `js/app/pair.js` (`startPair`, `lockOtherCrop`, `lockCrop`), `js/app/state.js` (`cropOrient`)
- Cases: 2

### PAIR-02.1 A portrait front makes a portrait pair, cropped 5:7 to the card   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: the front open on its own, on the Crop step, with the **1:1** preset selected (white) and the crop box square

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Export** in the step tabs | The Export step shows **Add back** |
| 2 | Tap **Add back** | The photo picker opens |
| 3 | Choose 14_back_portrait_raw_white.JPEG | The back opens; **Front** / **Back** shows in the top bar |
| 4 | Tap **Crop** in the step tabs | The back's crop box is upright (taller than wide), 5 wide to 7 high; **5:7 card** is selected |
| 5 | Tap **Front** in the top bar | The front opens on Crop: its preset is now **5:7 card**, the box upright, 5 wide to 7 high, and fitted around the card |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### PAIR-02.2 A landscape front makes a landscape pair   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 13_front_landscape_onetouch_labeled_white.JPEG and 13_back_landscape_onetouch_labeled_white.JPEG from samples/
- Starting screen: the front open on its own, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Add back** | The photo picker opens |
| 2 | Choose 13_back_landscape_onetouch_labeled_white.JPEG | The back opens; **Front** / **Back** shows in the top bar |
| 3 | Tap **Crop** in the step tabs | The back's crop box is wider than tall, 7 wide to 5 high; the selected preset reads **7:5 card** |
| 4 | Tap **Front** in the top bar | The front's crop box is also 7 wide to 5 high, under **7:5 card** |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## PAIR-03 A back that can't be opened leaves no pair

If the photo picked for the back can't be opened, nothing changes: the front stays a single photo and there is no pair.

- Risk: low
- Check: script
- Layout: both. No difference.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnAddBack`, "Couldn’t read that file as an image."
- Source: `js/app/pair.js` (`startPair`), `js/app/state.js` (`openFile`)
- Cases: 1

### PAIR-03.1 A back that can't be read leaves the front on its own   [auto: phone, webkit]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 14_front_portrait_raw_white.JPEG from samples/
- File: not-a-photo.JPEG from tests/fixtures/ (a line of text, named like a photo)
- Starting screen: the photo open on its own, its crop preset **1:1** (the first-time choice), on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Add back** | The photo picker opens |
| 2 | Choose not-a-photo.JPEG | A message reads "Couldn’t read that file as an image."; the front stays on screen |
| 3 | Look at the top bar | There is no **Front** / **Back** and no **Unpair** |
| 4 | Look at the bottom row of Export | **Add back** is still there |
| 5 | Tap **Crop** in the step tabs | The preset is still **1:1**: the front's crop was not changed to 5:7 |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## PAIR-04 The Front and Back switch

While paired, a **Front** / **Back** switch sits in the center of the top bar on every step. The white fill moves to the tapped side at the tap, before that side has opened.

- Risk: high
- Check: script
- Layout: both. On a wide screen the top bar also holds the steps; the switch is in its center on both.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#sideSwitch`, "Front", "Back"
- Source: `js/app/parts/top-bar.js` (`buildTopBar`, `updateTopBar`), `js/app/pair.js` (`setSwitching`, `syncPair`, `bindPair`)
- Cases: 1

### PAIR-04.1 Front / Back is on every step, and its white moves at the tap   [auto: both]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: a pair: open the front, tap **Export**, tap **Add back** and choose the back. The back is open on the Perspective step

A side opens in a fraction of a second, so for row 7 watch the switch closely, or record the screen and step through it.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the middle of the top bar | **Front** / **Back**, with a white fill behind **Back** |
| 2 | Tap **Rotate** in the step tabs | **Front** / **Back** is still in the middle of the top bar, **Back** in white |
| 3 | Tap **Crop** | The same |
| 4 | Tap **Levels** | The same |
| 5 | Tap **Overlay** | The same |
| 6 | Tap **Export** | The same |
| 7 | Tap **Front** | The white fill moves to **Front** straight away, while the back's picture is still on screen and "Opening the front…" shows over it |
| 8 | Wait a moment | The front's picture replaces the back's; **Front** stays white |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## PAIR-05 Switching keeps the step

Switching sides keeps the step you are on: Crop on the back opens Crop on the front.

- Risk: medium
- Check: script
- Layout: both. No difference.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#sideSwitch`
- Source: `js/app/pair.js` (`switchSide`)
- Cases: 1

### PAIR-05.1 Switching sides stays on the step you are on   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: a pair: open the front, tap **Export**, tap **Add back** and choose the back. The back is open on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Crop** in the step tabs | The back's Crop step |
| 2 | Tap **Front** in the top bar | The front opens on the Crop step |
| 3 | Tap **Levels** in the step tabs | The front's Levels step |
| 4 | Tap **Back** in the top bar | The back opens on the Levels step |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## PAIR-06 A side that can't be read changes nothing

The other side's photo is read before the open one is let go, so if it can't be read, an error message shows and everything stays as it was.

- Risk: medium
- Check: script
- Layout: both. No difference.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#sideSwitch`, "Couldn’t read that file as an image."
- Source: `js/app/pair.js` (`switchSide`), `js/app/adapters.js` (`ImageSource.load`)
- Cases: 1

### PAIR-06.1 A side that can't be read leaves the open side as it was   [auto: phone]
Script only
Stand-in: no control spoils a side's kept photo, so the script replaces the front's kept copy of its photo with bytes that aren't an image, as a photo deleted or damaged on the device would be.
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: a pair: open the front, tap **Export**, tap **Add back** and choose the back. The back is open, on the Rotate step, its angle at 0.0°; the front's kept photo can't be read

Type the angle N: tap the angle (**0.0°**, with a pencil after it), type N, tap **Done**.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Type the angle 2 | The angle reads 2.0° |
| 2 | Tap **Front** in the top bar | A message reads "Couldn’t read that file as an image."; **Back** stays white; the back stays on screen, its angle at 2.0° |
| 3 | Look at the top bar | **Front** / **Back** and **Unpair** can be tapped (not greyed out) |
| 4 | Tap **Undo** (the arrow curving left, at the top right) | The angle reads 0.0°: the back's undo history is as it was |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## PAIR-07 Each side keeps its own work

Each side keeps its own edits, undo history, unapplied Levels changes and the dot on the Levels tab, its exported mark, its zoom, its selected corner and its detection results across switches.

- Risk: high
- Check: script
- Layout: both. No difference.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#sideSwitch`, `#btnUndo`, `#btnRedo`
- Source: `js/app/pair.js` (`captureSide`, `applySide`, `switchSide`)
- Cases: 3

### PAIR-07.1 Each side keeps its own edits, Levels changes and selected corner   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: a pair: open the front, tap **Export**, tap **Add back** and choose the back. The back is open on the Perspective step

Type the angle N: tap the angle (**0.0°**, with a pencil after it), type N, tap **Done**. The selected corner is the one whose round handle has a red ring.

This case covers the edits, the undo history, the unapplied Levels changes with the dot on the Levels tab, and the selected corner; the zoom and the detection results are PAIR-07.2 and PAIR-07.3, and the exported mark is PAIR-34.1.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Front** in the top bar | The front opens on Perspective; the top-left corner is selected |
| 2 | Tap **Next handle** (under the nudge pad) | The top-right corner is selected |
| 3 | Tap **Rotate** in the step tabs | The front's Rotate step; the angle reads 0.0° |
| 4 | Type the angle 2 | The angle reads 2.0° |
| 5 | Tap **Levels** in the step tabs | The Levels step, with no dot on its tab; **Discard** and **Apply** are greyed out |
| 6 | Tap **Auto** | **Discard** and **Apply** are no longer greyed out, and a white dot appears on the **Levels** tab |
| 7 | Tap **Back** in the top bar | The back opens on Levels with no dot on the tab; **Discard** and **Apply** are greyed out; **Undo** (the arrow curving left, at the top right) is greyed out |
| 8 | Tap **Front** | The front opens on Levels: **Discard** and **Apply** are no longer greyed out, and the dot is back |
| 9 | Tap **Perspective** in the step tabs | The top-right corner is still the selected one |
| 10 | Tap **Rotate** in the step tabs | The angle reads 2.0° |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### PAIR-07.2 Each side keeps its own zoom   [auto: phone]
Before you start:
- Device and browser: a phone, or a phone-width window with touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: a pair: open the front, tap **Export**, tap **Add back** and choose the back. The back is open on the Perspective step, fitted to the photo area

Zoom in: put two fingers on the photo and spread them apart. **Fit** is the icon button in the top bar whose tooltip reads "Fit to screen (F)"; on a phone it shows only while the photo is zoomed or panned.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the top bar | There is no **Fit** |
| 2 | Zoom in on the photo | The back's photo grows; **Fit** appears in the top bar |
| 3 | Tap **Front** in the top bar | The front opens fitted to the photo area; **Fit** has gone |
| 4 | Tap **Back** in the top bar | The back opens as large as it was left; **Fit** is back in the top bar |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### PAIR-07.3 Each side keeps its own detection results   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: a pair: open the front, tap **Export**, tap **Add back** and choose the back. The back is open on the Perspective step

**Candidate** is the tool in Perspective's tool row that steps through the shapes detection found; it shows which one is in use, such as 1/3. The confidence is at the right of the line above the controls (the one line of text at the top of the controls), such as Confidence 97%.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at **Candidate** and the line above the controls | **Candidate** reads 1/3; the line reads Confidence 97% |
| 2 | Tap **Candidate** | The corners move to another shape; **Candidate** reads 2/3 and the line gives a lower confidence: Confidence 87% (88% in some browsers, which shrink the photo slightly differently) |
| 3 | Tap **Front** in the top bar | The front opens on Perspective: **Candidate** reads 1/3 and the line Confidence 99%, the front's own |
| 4 | Tap **Back** in the top bar | The back opens with **Candidate** at 2/3 and the confidence row 2 gave; its corners are on the second shape, as row 2 left them |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## PAIR-08 A switch clears what was in progress

A switch turns off Tap to find card, an armed white or black pick, the before-levels comparison and Preview, clears Overlay's file error, and drops a share waiting for **Share now**.

- Risk: low
- Check: script
- Layout: both. No difference.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnFindCard`, `#toolPreview`, "Share now"
- Source: `js/app/pair.js` (`applySide`)
- Cases: 4

### PAIR-08.1 A switch turns off Tap to find card, Preview and an armed pick   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: a pair: open the front, tap **Export**, tap **Add back** and choose the back. The back is open on the Perspective step

This case covers Tap to find card, Preview and an armed pick; the before-levels comparison is PAIR-08.2, Overlay's file error PAIR-08.3 and a share waiting for **Share now** PAIR-08.4.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Open **Perspective options**: on a phone, tap the options tab (the small tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls | **Tap to find card** is listed |
| 2 | Tap **Tap to find card** | The line above the controls (the one line of text at the top of the controls) reads "Tap the card in the photo." with **Cancel** |
| 3 | Tap **Front** in the top bar | The front opens on Perspective; "Tap the card in the photo." has gone |
| 4 | Tap **Preview** in the tool row | **Preview** reads On; the photo shows the straightened card, with no corner handles |
| 5 | Tap **Back** | The back opens with **Preview** off and its corner handles showing |
| 6 | Tap **Levels** in the step tabs | The back's Levels step |
| 7 | Tap **Pick white** | **Pick white** is selected (white) |
| 8 | Tap **Front** | The front opens on Levels with neither **Pick white** nor **Pick black** selected |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### PAIR-08.2 A switch ends the before-levels comparison   [auto: desktop]
Before you start:
- Device and browser: a wide window with a keyboard and a mouse
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: a pair: open the front, click **Export**, click **Add back** and choose the back. The back is open on the Levels step

Holding the C key on Levels shows the photo without its Levels changes, with a **Before levels** badge on it, until the key is let go.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Click **Auto** | The back's whites turn brighter; a white dot appears on the **Levels** tab |
| 2 | Press and hold C | The photo goes back to how it was before **Auto**, with a **Before levels** badge on it |
| 3 | Still holding C, click **Front** in the top bar | The front opens on Levels with no **Before levels** badge |
| 4 | Let go of C | The front is unchanged |
| 5 | Click **Back** in the top bar | The back opens with its brighter whites from **Auto** and no **Before levels** badge |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### PAIR-08.3 A switch clears Overlay's file message   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- File: notes.txt from tests/fixtures/ (a line of text)
- Starting screen: a pair: open the front, tap **Export**, tap **Add back** and choose the back. The back is open on the Overlay step, with no logo

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Add logo** | The file picker opens |
| 2 | Choose notes.txt | The line above the controls (the one line of text at the top of the controls) reads "That file type isn’t supported. Use PNG, WebP, JPG or SVG." |
| 3 | Tap **Front** in the top bar | The front opens on Overlay; the message has gone |
| 4 | Tap **Back** in the top bar | The back opens on Overlay; the message is not back |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### PAIR-08.4 A switch drops a share waiting for Share now   [auto: phone]
Script only
Stand-in: a script stands in for the share sheet and refuses the first share, as Safari does when the export took too long after the tap; no person can make a browser refuse on cue, and no case uses a desktop browser's own share sheet.
Before you start:
- Device and browser: a phone-width window, in a browser that can share files on a secure page
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: a pair: open the front, tap **Export**, tap **Add back** and choose the back. The back is open; tap **Export**, and tap Size **Original**. **Together** is selected

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Share** | No share sheet; a message ends "Tap Share now to open the share sheet."; **Share** reads **Share now** |
| 2 | Tap **Front** in the top bar | The front opens on Export; the button reads **Share** again |
| 3 | Tap **Share** | The progress line runs again (a new export), and the share sheet is handed one file: 14_front_portrait_raw_white-pair.jpg |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## PAIR-09 Busy while a side opens or an export runs

**Front** / **Back** and **Unpair** are dimmed while an export runs or a side is opening. While a side is opening (a switch, or the back's first opening after **Add back**), **Share**, **Download**, **Copy**, **Together** / **Separately** and the corner-shots save buttons are dimmed too. A photo opened while a side is opening, in a switch or in the back's first opening, is refused with a warning of its own: **Wait for the other side to open, then open the photo.**

- Risk: medium
- Check: script
- Layout: both. On a phone the Corner shots sheet covers the top bar while it is open, so its save buttons can be seen greyed out during a switch only on a wide screen, where Corner shots is listed in the side panel.
- Added: 1.10 baseline
- Changed: 1.10.0
- Anchors: `#sideSwitch`, `#btnUnpair`, `#btnDownload`, `#btnShare`, `#btnCornerDownload`, "Wait for the other side to open, then open the photo."
- Source: `js/app/pair.js` (`setSwitching`, `startPair`, `switchSide`, `syncPair`, `receivePhoto`), `js/app/export-controls.js` (`syncSaveButtons`), `js/app/corner-shots.js` (`syncCornerShots`), `js/app/export.js` (`doExport`)
- Ruling: R13. A photo opened while a side is opening says "Wait for the other side to open, then open the photo." (approved wording); the export wording stays for a running export. The app does this since 1.10.0.
- Cases: 5

### PAIR-09.1 While a side opens, the switch and save controls are greyed out   [auto: phone]
Before you start:
- Device and browser: a phone-width window, in a browser that can share files and copy images on a secure page (an iPhone's Safari on the UAT site; the automated test puts a stand-in for the share sheet in the page)
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: a pair: open the front, tap **Export**, tap **Add back** and choose the back. The back is open on the Perspective step

A side opens in a fraction of a second, so for row 2 watch closely, or record the screen and step through it. The corner shots' save buttons are PAIR-09.4.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Export** in the step tabs | **Front** / **Back**, **Unpair**, **Share**, **Download**, **Copy** and **Together** / **Separately** can all be tapped |
| 2 | Tap **Front** in the top bar | While "Opening the front…" shows, all of them are greyed out |
| 3 | Wait for the front to open | All of them can be tapped again |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### PAIR-09.2 During a pair's export, Front / Back and Unpair are greyed out   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: a pair: open the front, tap **Export**, tap **Add back** and choose the back. The back is open; tap **Export**, and tap Size **Original**

An export takes about a second, so watch the top bar closely, or record the screen and step through it.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the top bar and the size line | **Front** / **Back**, **Unpair** and **Together** / **Separately** can be tapped |
| 2 | Tap **Download** | While the progress line runs along the top edge of the controls, **Front** / **Back**, **Unpair** and **Together** / **Separately** are greyed out |
| 3 | Wait for the file to arrive | All of them can be tapped again |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### PAIR-09.3 A photo opened while a side opens is refused with its own message   [auto: phone]
Script only
Stand-in: the front opens in tens of milliseconds, too fast for a person to choose a photo in between, so the script holds the front's opening until row 3 is done.
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG, 14_back_portrait_raw_white.JPEG and IMG_9136.JPEG from samples/
- Starting screen: a pair: open the front, tap **Export**, tap **Add back** and choose the back. The back is open on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Front** in the top bar | "Opening the front…" shows |
| 2 | Tap **Open** (the folder at the top left) | The photo picker opens |
| 3 | Choose IMG_9136.JPEG | An amber warning reads "Wait for the other side to open, then open the photo." |
| 4 | Wait for the front to open | The front is open; **Front** / **Back** is still in the top bar; IMG_9136.JPEG was not opened |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### PAIR-09.4 On a wide screen, a switch greys out the corner shots' save buttons   [auto: desktop]
Before you start:
- Device and browser: a wide window with a mouse, in a browser that can share files on a secure page (the automated test puts a stand-in for the share sheet in the page)
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: a pair: open the front, click **Export**, click **Add back** and choose the back. The back is open on the Export step

A side opens in a fraction of a second, so for row 2 watch closely, or record the screen and step through it.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Click **Corner shots** in the side panel | The side panel shows the Corner shots part, with **Share corners** and **Download corners**; both can be clicked |
| 2 | Click **Front** in the top bar | While "Opening the front…" shows, **Share corners** and **Download corners** are greyed out |
| 3 | Wait for the front to open | **Share corners** and **Download corners** can be clicked again |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### PAIR-09.5 A photo opened while the back first opens is refused with the side's message   [auto: phone]
Script only
Stand-in: the back opens in tens of milliseconds, too fast for a person to choose a photo in between, so the script holds the back's opening until row 4 is done.
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG, 14_back_portrait_raw_white.JPEG and IMG_9136.JPEG from samples/
- Starting screen: 14_front_portrait_raw_white.JPEG open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Add back** and choose 14_back_portrait_raw_white.JPEG | The back starts to open: **Front** / **Back** shows in the top bar, greyed out |
| 2 | Tap **Open** (the folder at the top left) | The photo picker opens |
| 3 | Choose IMG_9136.JPEG | An amber warning reads "Wait for the other side to open, then open the photo." |
| 4 | Look at the photo | The front is still the photo on screen |
| 5 | Wait for the back to open | The back is open; **Front** / **Back** is still in the top bar; IMG_9136.JPEG was not opened |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## PAIR-10 The Unpair button

An **Unpair** button (an icon, tooltip "Unpair (keep one side)") sits beside **Front** / **Back**, only while paired.

- Risk: medium
- Check: script
- Layout: both. No difference.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnUnpair`, "Unpair (keep one side)"
- Source: `js/app/parts/top-bar.js` (`buildTopBar`, `updateTopBar`), `js/app/pair.js` (`bindPair`, `syncPair`)
- Cases: 1

### PAIR-10.1 Unpair shows only while a pair is open   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: the front open on its own, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the middle of the top bar | There is no **Front** / **Back** and no **Unpair** |
| 2 | Tap **Add back** | The photo picker opens |
| 3 | Choose 14_back_portrait_raw_white.JPEG | **Unpair** (an icon of a link broken in two) sits beside **Front** / **Back**; its tooltip (or its name to a screen reader) reads "Unpair (keep one side)" |
| 4 | Tap **Unpair** | The question box (the box over the dimmed photo with a question and its buttons) asks which side to keep |
| 5 | Tap **Keep back** | The question box closes; **Unpair** and **Front** / **Back** have gone |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## PAIR-11 Unpair asks which side to keep

**Unpair** asks in a question box over the photo: **Keep front**, **Keep back** or **Cancel**. Keeping the side that isn't open switches to it first.

- Risk: high
- Check: script
- Layout: both. On a phone the question box's backdrop covers the bars; on a wide screen only the photo is dimmed and the bars stay readable but take no input.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#pairPrompt`, "Keep one side as a single photo.", "Keep front", "Keep back"
- Source: `js/app/pair.js` (`askUnpair`, `unpair`, `switchSide`, `showPrompt`)
- Cases: 2

### PAIR-11.1 Unpair asks which side to keep, and Cancel keeps the pair   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: a pair: open the front, tap **Export**, tap **Add back** and choose the back. The back is open on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Unpair** (beside **Front** / **Back**) | A question box over the dimmed photo, titled "Unpair", reads "Keep one side as a single photo." with **Keep front**, **Keep back** and **Cancel** |
| 2 | Tap **Cancel** | The question box closes; **Front** / **Back** is still in the top bar, **Back** in white, and the back is on screen |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### PAIR-11.2 Keeping the side that isn't open switches to it first   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: a pair: open the front, tap **Export**, tap **Add back** and choose the back. The back is open on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Unpair** | The question box asks: **Keep front**, **Keep back**, **Cancel** |
| 2 | Tap **Keep front** | The front's picture replaces the back's (the colorful front of the card); a message reads "Unpaired. The front is a single photo now." |
| 3 | Look at the top bar | **Front** / **Back** and **Unpair** have gone |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## PAIR-12 After Unpair

After **Unpair** the kept side is a single photo: its crop stays 5:7, the crop presets unlock, the pair's stored records are deleted, and Resume brings back the kept side's photo.

- Risk: high
- Check: script
- Layout: both. No difference.
- Added: 1.10 baseline
- Changed: 1.10.0
- Anchors: `#btnUnpair`, "Unpaired. The ", `#btnResume`
- Source: `js/app/pair.js` (`unpair`, `clearPairSession`), `js/app/crop.js` (`pickCropPreset`, `syncCrop`)
- Ruling: R25. Unpair waits until the kept side's photo is stored before saying "Unpaired", so a reload straight after resumes the kept side. The app does this since 1.10.0.
- Cases: 2

### PAIR-12.1 Unpair leaves a single photo, and Resume brings it back   [auto: phone, webkit]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: a pair: open the front, tap **Export**, tap **Add back** and choose the back. The back is open on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Unpair** | The question box asks: **Keep front**, **Keep back**, **Cancel** |
| 2 | Tap **Keep back** | A message reads "Unpaired. The back is a single photo now."; **Front** / **Back** has gone |
| 3 | Tap **Crop** in the step tabs | **5:7 card** is still selected, every other preset can be tapped, and the line above the presets no longer reads "Pair: 5:7 only" |
| 4 | Wait two seconds, then reload the page | The start screen offers **Resume**, naming only 14_back_portrait_raw_white.JPEG, with no second photo's name after it |
| 5 | Tap **Resume** | The back opens on its own, on Crop, under **5:7 card**; there is no **Front** / **Back** |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### PAIR-12.2 A reload straight after Unpair resumes the kept side   [auto: phone, webkit]
Script only
Stand-in: the script holds every write to the browser's storage half a second, as on a busy phone, and reloads the page the moment the message shows; a person can't slow storage, and the result of a reload by hand depends on how quickly the browser stores the photo.
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: a pair: open the front, tap **Export**, tap **Add back** and choose the back. The back is open on the Perspective step

Written to ruling R25.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Unpair** | The question box asks: **Keep front**, **Keep back**, **Cancel** |
| 2 | Tap **Keep front** | A message reads "Unpaired. The front is a single photo now." |
| 3 | Reload the page the moment that message shows | The start screen offers **Resume**, naming 14_front_portrait_raw_white.JPEG |
| 4 | Tap **Resume** | The front opens on its own (the colorful front of the card), with no **Front** / **Back** |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## PAIR-13 Opening a photo while paired asks first

**Open**, a dropped photo or a pasted photo while paired asks in a question box: **New photo**, **Replace front** or **Replace back** (the side you are on), or **Cancel**.

- Risk: high
- Check: script
- Layout: both. On a phone the question box's backdrop covers the bars; on a wide screen only the photo is dimmed.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#pairPrompt`, "End the pair, or replace the side you’re on?", `#btnPromptFirst`, `#btnPromptSecond`
- Source: `js/app/pair.js` (`receivePhoto`, `showPrompt`), `js/app/main.js` (`bindPhotoInput`)
- Ruling: R65. The New photo question's title and its first button both read **New photo**. The app already does this.
- Cases: 1

### PAIR-13.1 Open while paired asks: New photo, or replace the side you are on   [auto: phone]

Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG, 14_back_portrait_raw_white.JPEG and IMG_9136.JPEG from samples/
- Starting screen: a pair: open the front, tap **Export**, tap **Add back** and choose the back. The back is open on the Perspective step

Dropping or pasting a photo asks the same question; those are covered under Drop and paste.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Open** (the folder at the top left) | The photo picker opens |
| 2 | Choose IMG_9136.JPEG | A question box over the dimmed photo, titled "New photo", reads "End the pair, or replace the side you’re on?" with **New photo**, **Replace back** and **Cancel** |
| 3 | Tap **Cancel** | The question box closes; the back is still on screen with **Front** / **Back** in the top bar |
| 4 | Tap **Front** in the top bar | The front opens |
| 5 | Tap **Open** | The photo picker opens |
| 6 | Choose IMG_9136.JPEG | The same question box, its middle button now reading **Replace front** |
| 7 | Tap **Cancel** | The question box closes; the front is still on screen, still paired |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## PAIR-14 New photo ends the pair

**New photo** ends the pair and opens the photo as a single photo; if it can't be read, the pair stays.

- Risk: medium
- Check: script
- Layout: both. No difference.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnPromptFirst`, "New photo"
- Source: `js/app/pair.js` (`openSingle`, `clearPairSession`)
- Cases: 2

### PAIR-14.1 New photo ends the pair and opens the photo on its own   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG, 14_back_portrait_raw_white.JPEG and IMG_9136.JPEG from samples/
- Starting screen: a pair: open the front, tap **Export**, tap **Add back** and choose the back. The back is open on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Open** (the folder at the top left) | The photo picker opens |
| 2 | Choose IMG_9136.JPEG | A question box over the dimmed photo asks: **New photo**, **Replace back**, **Cancel** |
| 3 | Tap **New photo** | IMG_9136.JPEG opens on Perspective; **Front** / **Back** and **Unpair** have gone |
| 4 | Tap **Export** in the step tabs | **Add back** is in the bottom row: this is a single photo |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### PAIR-14.2 New photo with a file that can't be read keeps the pair   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- File: not-a-photo.JPEG from tests/fixtures/ (a line of text, named like a photo)
- Starting screen: a pair: open the front, tap **Export**, tap **Add back** and choose the back. The back is open on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Open** (the folder at the top left) | The photo picker opens |
| 2 | Choose not-a-photo.JPEG | A question box over the dimmed photo asks: **New photo**, **Replace back**, **Cancel** |
| 3 | Tap **New photo** | A message reads "Couldn’t read that file as an image." |
| 4 | Look at the top bar | **Front** / **Back** is still there, **Back** in white; the back is on screen |
| 5 | Tap **Front** | The front opens: the pair is whole |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## PAIR-15 Replace the side you are on

**Replace front** or **Replace back** replaces the open side's photo, with fresh edits, and keeps the pair.

- Risk: medium
- Check: script
- Layout: both. No difference.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnPromptSecond`, "Replace "
- Source: `js/app/pair.js` (`replaceSide`, `savePairSession`)
- Cases: 1

### PAIR-15.1 Replace back opens the new photo as the back, with fresh edits   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG, 14_back_portrait_raw_white.JPEG and IMG_9136.JPEG from samples/
- Starting screen: a pair: open the front, tap **Export**, tap **Add back** and choose the back. The back is open, on the Rotate step, its angle at 0.0°

Type the angle N: tap the angle (**0.0°**, with a pencil after it), type N, tap **Done**.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Type the angle 2 | The angle reads 2.0° |
| 2 | Tap **Open** (the folder at the top left) | The photo picker opens |
| 3 | Choose IMG_9136.JPEG | A question box over the dimmed photo asks: **New photo**, **Replace back**, **Cancel** |
| 4 | Tap **Replace back** | IMG_9136.JPEG opens on Perspective as the back: **Front** / **Back** is still in the top bar with **Back** in white; **Undo** is greyed out |
| 5 | Tap **Rotate** in the step tabs | The angle reads 0.0°: the new back starts fresh |
| 6 | Tap **Crop** in the step tabs | **5:7 card** is selected and the line reads "Pair: 5:7 only" |
| 7 | Tap **Front** in the top bar | The front opens as it was |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## PAIR-16 Next card after a pair's export

**Next card** after a pair's export opens the picked photo as a single photo without asking.

- Risk: medium
- Check: script
- Layout: both. No difference.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnNextCard`, "Open the next photo"
- Source: `js/app/pair.js` (`receivePhoto`, `openSingle`), `js/app/export-controls.js` (`bindExport`), `js/app/shell.js` (`pickPhoto`)
- Cases: 1

### PAIR-16.1 Next card after a pair's export opens the photo without asking   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG, 14_back_portrait_raw_white.JPEG and IMG_9136.JPEG from samples/
- Starting screen: a pair: open the front, tap **Export**, tap **Add back** and choose the back. The back is open; tap **Export**, and tap Size **Original**

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Download** | One file arrives; **Next card** (white, its tooltip "Open the next photo") shows in the bottom row |
| 2 | Tap **Next card** | The photo picker opens |
| 3 | Choose IMG_9136.JPEG | IMG_9136.JPEG opens on its own, with no question asked; **Front** / **Back** has gone |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## PAIR-17 Add back is hidden while paired

**Add back** is hidden while a pair is open.

- Risk: low
- Check: script
- Layout: both. No difference.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnAddBack`
- Source: `js/app/export-controls.js` (`syncExportReadouts`)
- Cases: 1

### PAIR-17.1 Add back hides while paired and comes back after Unpair   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: a pair: open the front, tap **Export**, tap **Add back** and choose the back. The back is open on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Export** in the step tabs | The bottom row holds **Corner shots** but no **Add back** |
| 2 | Tap **Front** in the top bar | The front's Export: still no **Add back** |
| 3 | Tap **Unpair** | The question box asks: **Keep front**, **Keep back**, **Cancel** |
| 4 | Tap **Keep front** | **Add back** is back in the bottom row |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## PAIR-18 Both sides locked to 5:7

Both sides are locked to the 5:7 crop in the pair's one orientation. The lock is applied again after every change, so neither Undo nor a loaded edits file can break it; a box drawn by hand more than 1% off 5:7 goes back to fit the card.

- Risk: high
- Check: script
- Layout: both. No difference.
- Added: 1.10 baseline
- Changed: none
- Anchors: "5:7 card", `#cropPresets`
- Source: `js/app/pair.js` (`applyPairRules`, `lockCrop`), `js/app/state.js` (`stateChanged`)
- Cases: 2

### PAIR-18.1 Undo can't take a side out of the 5:7 lock   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: the front open on its own, on the Crop step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap the **3:4** preset | **3:4** is selected; the crop box is 3 wide to 4 high |
| 2 | Tap **Export** in the step tabs | The Export step shows **Add back** |
| 3 | Tap **Add back** | The photo picker opens |
| 4 | Choose 14_back_portrait_raw_white.JPEG | The back opens; **Front** / **Back** shows in the top bar |
| 5 | Tap **Front** in the top bar | The front opens on Perspective, the step the back was on |
| 6 | Tap **Crop** in the step tabs | **5:7 card** is selected |
| 7 | Tap **Undo** (the arrow curving left, at the top right) | **5:7 card** is still selected and the box is still 5 wide to 7 high: undoing the 3:4 pick did not undo the lock |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### PAIR-18.2 An edits file with a hand-drawn square crop can't break the lock   [auto: phone, webkit]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Edits file: pair-front-square-crop-edits.json from tests/fixtures/: edits saved with **Save edits** from 14_front_portrait_raw_white.JPEG on its own, turned 3.0° on Rotate, with its square **1:1** crop box dragged 30 px down by hand (in the file: `"fine": 3` and `"mode": "manual"`, `"preset": "1:1"`)
- Starting screen: a pair: open the front, tap **Export**, tap **Add back** and choose the back, then tap **Front** in the top bar and **Export** in the step tabs. The front is open on Export, its angle at 0.0°

Open **Export options**: on a phone, tap the options tab (the small tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls. Close them: on a phone, tap the × at the top right of the sheet; on a wide screen they stay shown.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Open **Export options** | **Save edits** and **Load edits** show |
| 2 | Tap **Load edits** | The file picker opens |
| 3 | Choose pair-front-square-crop-edits.json | The options stay open, with no red message |
| 4 | Close **Export options** | The options are closed on a phone; on a wide screen, nothing changes |
| 5 | Tap **Rotate** in the step tabs | The angle reads 3.0°: the file's edits were loaded |
| 6 | Tap **Crop** in the step tabs | **5:7 card** is selected and the box is 5 wide to 7 high, fitted around the card: the file's square box was dropped |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## PAIR-19 Crop shows the lock

On Crop while paired only the selected **5:7 card** preset is enabled (it reads **7:5 card** for a landscape pair), and the line above the presets reads **Pair: 5:7 only** at its right.

- Risk: medium
- Check: script
- Layout: both. On a phone the row of presets scrolls sideways; on a wide screen it wraps.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Pair: 5:7 only", `#cropPairNote`, `#cropPresets`
- Source: `js/app/crop.js` (`buildCropLine`, `pickCropPreset`, `syncCrop`)
- Cases: 1

### PAIR-19.1 On Crop only 5:7 card can be tapped, under "Pair: 5:7 only"   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: a pair: open the front, tap **Export**, tap **Add back** and choose the back. The back is open on the Perspective step

The landscape label, **7:5 card**, is checked in PAIR-02.2.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Crop** in the step tabs | **5:7 card** is selected; every other preset (Free, Original, 1:1, 3:4, 4:5, 2:3, 9:16) is greyed out; the line above the presets reads "Pair: 5:7 only" at its right |
| 2 | Tap **1:1** | Nothing changes: **5:7 card** stays selected |
| 3 | Tap **Front** in the top bar | The front's Crop step shows the same: only **5:7 card**, and "Pair: 5:7 only" |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## PAIR-20 Swap turns both sides

**Swap** while paired turns both sides' crops between portrait and landscape, and is not an undo step: tapping **Swap** again turns them back.

- Risk: medium
- Check: script
- Layout: both. No difference.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#toolSwap`
- Source: `js/app/pair.js` (`swapPair`, `lockOtherCrop`), `js/app/crop.js` (`bindCrop`)
- Ruling: Rich's settled decision (front and back pairs): **Swap** is an undo step for a single photo but not in a pair. The app already does this.
- Cases: 1

### PAIR-20.1 Swap turns both sides, and Undo doesn't turn them back   [auto: phone]

Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: a pair: open the front, tap **Export**, tap **Add back** and choose the back. The back is open, on the Rotate step, its angle at 0.0°

Type the angle N: tap the angle (**0.0°**, with a pencil after it), type N, tap **Done**.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Type the angle 2 | The angle reads 2.0° |
| 2 | Tap **Crop** in the step tabs | **5:7 card**; the box is upright |
| 3 | Tap **Swap** | The box lies down, 7 wide to 5 high; the preset reads **7:5 card** |
| 4 | Tap **Undo** (the arrow curving left, at the top right) | The box is still 7 wide to 5 high |
| 5 | Tap **Rotate** in the step tabs | The angle reads 0.0°: Undo took back the angle, not the Swap |
| 6 | Tap **Front** in the top bar | The front opens on Rotate |
| 7 | Tap **Crop** in the step tabs | The front's box is 7 wide to 5 high too |
| 8 | Tap **Swap** | The front's box is upright again, 5 wide to 7 high |
| 9 | Tap **Back** in the top bar | The back's box is upright again too |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## PAIR-21 Shared export settings

The export settings (**Size**, **Format**, **Quality**, **Interpolation** and **Fill outside photo**) are shared: a change on the open side is copied to the other.

- Risk: medium
- Check: script
- Layout: both. On a phone Quality, Interpolation and Fill are in Export's options sheet; on a wide screen they are listed in the side panel.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#exportSize`, `#exportFormat`, `#quality`, `#interp`, `#fill`
- Source: `js/app/pair.js` (`applyPairRules`), `js/app/shell.js` (`resetStep`)
- Ruling: R63. **Reset export settings** leaves Together / Separately and the corner-shots output as they are, and in a pair resets both sides. The app already does this.
- Cases: 3

### PAIR-21.1 Size, Format and Separately chosen on one side are the other side's too   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: a pair: open the front, tap **Export**, tap **Add back** and choose the back. The back is open; tap **Export**. Size reads **2000**, Format **JPEG**, and **Together** is selected

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Separately** | **Separately** is selected |
| 2 | Tap Size **1080** | **1080** is selected |
| 3 | Tap Format **WebP** | **WebP** is selected |
| 4 | Tap **Front** in the top bar | The front's Export: Size **1080**, Format **WebP** and **Separately** are selected |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### PAIR-21.2 The options' settings changed on one side are the other side's too   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: a pair: open the front, tap **Export**, tap **Add back** and choose the back. The back is open; tap **Export**

Open **Export options**: on a phone, tap the options tab (the small tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls. Close them: on a phone, tap the × at the top right of the sheet (the options cover the top bar while open); on a wide screen they stay shown. Choose X in a list: tap the list's row, then pick X in the list that opens.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Open **Export options** | Quality reads 92%, Interpolation **Bilinear**, Fill outside photo **White** |
| 2 | Drag the Quality slider's knob all the way to the left | Quality reads 50% |
| 3 | Choose **Bicubic (sharper, slower)** in **Interpolation** | The row reads **Bicubic** |
| 4 | Choose **Black** in **Fill outside photo** | The row reads **Black** |
| 5 | Close **Export options** | On a phone the options close and the top bar shows **Front** / **Back** |
| 6 | Tap **Front** in the top bar | The front opens on Export |
| 7 | Open **Export options** | The front's options read 50%, **Bicubic**, **Black** |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### PAIR-21.3 Reset export settings on one side resets both, and keeps Separately   [auto: phone]

Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: a pair: open the front, tap **Export**, tap **Add back** and choose the back. The back is open; tap **Export**, then **Separately**, Size **1080** and Format **WebP**

Open **Export options**: on a phone, tap the options tab (the small tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls. Close them: on a phone, tap the × at the top right of the sheet; on a wide screen they stay shown.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Open **Export options** | **Reset export settings** is among the options |
| 2 | Tap **Reset export settings** | Quality reads 92%, Interpolation **Bilinear**, Fill outside photo **White** |
| 3 | Close **Export options** | Size **2000** and Format **JPEG** are selected; **Separately** is still selected |
| 4 | Tap **Front** in the top bar | The front's Export shows the same: Size **2000**, Format **JPEG**, **Separately** |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## PAIR-22 The lock is never remembered

The pair's 5:7 lock never becomes the remembered crop preset; after Unpair the remembered preset stays as it was until a preset is picked.

- Risk: medium
- Check: script
- Layout: both. No difference.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#cropPresets`, `CONFIG.storageKey`, `CONFIG.crop.defaultPreset`
- Source: `js/app/adapters.js` (`Prefs.save`), `js/app/state.js` (`openFile`), `js/app/crop.js` (`pickCropPreset`)
- Cases: 1

### PAIR-22.1 The next photo after a pair starts with the preset picked before it   [auto: phone, webkit]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG, 14_back_portrait_raw_white.JPEG and IMG_9136.JPEG from samples/
- Starting screen: the front open on its own, on the Crop step

Add the back: tap **Add back**, and choose 14_back_portrait_raw_white.JPEG in the photo picker. Open IMG_9136.JPEG: tap **Open** (the folder at the top left), and choose IMG_9136.JPEG in the photo picker.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap the **3:4** preset | **3:4** is selected |
| 2 | Tap **Export** in the step tabs | The Export step shows **Add back** |
| 3 | Add the back | The back opens; **Front** / **Back** shows in the top bar |
| 4 | Tap **Crop** in the step tabs | **5:7 card** is selected |
| 5 | Tap **Unpair** | The question box asks: **Keep front**, **Keep back**, **Cancel** |
| 6 | Tap **Keep back** | "Unpaired. The back is a single photo now."; the crop is still **5:7 card** |
| 7 | Open IMG_9136.JPEG | IMG_9136.JPEG opens on its own, with no question asked |
| 8 | Tap **Crop** in the step tabs | **3:4** is selected: the app remembered 3:4, never the pair's 5:7 |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## PAIR-23 One side's Undo stays on that side

**Undo** and **Redo** on one side never change the other side, apart from the shared export settings.

- Risk: medium
- Check: script
- Layout: both. No difference.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnUndo`, `#btnRedo`, `#sideSwitch`
- Source: `js/app/pair.js` (`captureSide`, `applySide`, `applyPairRules`), `js/app/state.js` (`undo`, `redo`)
- Cases: 1

### PAIR-23.1 Undo and Redo on the back leave the front alone   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: a pair: open the front, tap **Export**, tap **Add back** and choose the back. The back is open on the Perspective step

Type the angle N: tap the angle (**0.0°**, with a pencil after it), type N, tap **Done**.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Front** in the top bar | The front opens on Perspective |
| 2 | Tap **Rotate** in the step tabs | The front's angle reads 0.0° |
| 3 | Type the angle 2 | The angle reads 2.0° |
| 4 | Tap **Back** | The back opens on Rotate; its angle reads 0.0° |
| 5 | Type the angle 5 | The angle reads 5.0° |
| 6 | Tap **Undo** (the arrow curving left, at the top right) | The back's angle reads 0.0° |
| 7 | Tap **Redo** (the arrow curving right, beside Undo) | The back's angle reads 5.0° |
| 8 | Tap **Undo** | The back's angle reads 0.0° |
| 9 | Tap **Front** | The front's angle still reads 2.0° |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## PAIR-24 Each side keeps its own logo

Each side keeps its own logo and its placement, in the Together preview and in the saved files.

- Risk: medium
- Check: script, saved file
- Layout: both. No difference.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnOverlayAdd`, `#toolOverlayReplace`, `#sideSwitch`
- Source: `js/app/pair.js` (`renderSideInto`, `drawPreviewSides`, `savePairSession`), `js/app/overlay.js` (`compositeOverlay`)
- Cases: 1

### PAIR-24.1 A logo on the back is saved on the back's half only   [auto: phone, webkit]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/; the logo icons/icon.svg from the app's own folder
- Starting screen: a pair: open the front, tap **Export**, tap **Add back** and choose the back. The back is open; tap **Export**, Size **Original** and Format **PNG**. **Together** is selected

How the logo shows in the Together preview is judged in PAIR-38.1.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Download** | One file, 14_front_portrait_raw_white-pair.png, arrives |
| 2 | Tap **Overlay** in the step tabs | The back's Overlay step, with **Add logo** and no logo on the photo |
| 3 | Tap **Add logo** | The file picker opens |
| 4 | Choose icon.svg | The logo appears on the back |
| 5 | Tap **Front** in the top bar | The front's Overlay step, with **Add logo** and no logo |
| 6 | Tap **Export** in the step tabs | The front's Export step, **Together** selected |
| 7 | Tap **Download** | A second -pair.png file arrives |
| 8 | Compare the two files | The left half (the front) is the same in both, pixel for pixel; the right half (the back) differs where the logo is |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## PAIR-25 Together or Separately

While paired, a **Together** / **Separately** control sits beside the size line on Export. The choice is remembered (Together until one is picked) and the control is dimmed while an export runs or a side is opening.

- Risk: high
- Check: script
- Layout: both. On a phone, while a note shows, the note takes the size line's place beside the control; on a wide screen both stay.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#pairOutput`, "Together", "Separately", `CONFIG.pair.output`
- Source: `js/app/export-controls.js` (`buildReadoutRow`, `syncExportControls`, `syncSaveButtons`), `js/app/pair.js` (`storedPairOutput`, `setPairOutput`), `js/app/adapters.js` (`Prefs.save`)
- Cases: 1

### PAIR-25.1 Together or Separately is remembered across a reload   [auto: phone, webkit]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: a pair: open the front, tap **Export**, tap **Add back** and choose the back, in a browser where no pair was made before. The back is open on the Perspective step

The control greys out while a side opens (PAIR-09.1) and while an export runs (PAIR-09.2).

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Export** in the step tabs | **Together** / **Separately** sits beside the size line, **Together** in white |
| 2 | Tap **Separately** | **Separately** is white; the size line now gives two sizes joined by + |
| 3 | Wait two seconds, then reload the page | The start screen offers **Resume** |
| 4 | Tap **Resume** | The back opens on Export, with **Back** in white |
| 5 | Look beside the size line | **Separately** is still selected |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## PAIR-26 The Together image

Together saves one joined image: portrait cards side by side with the front on the left, landscape cards stacked with the front on top, a gap of 0.8% in the fill color between them and no outer margin. Each side is at its own export size (a smaller side is centered in its half) with its own logo.

- Risk: high
- Check: script, saved file
- Layout: both. No difference.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Together", `CONFIG.pair.gutterPct`, `#btnDownload`
- Source: `js/app/pair.js` (`togetherLayout`, `encodeTogether`, `renderSideInto`, `togetherFile`), `js/engine.js` (`pairLayout`)
- Cases: 2

### PAIR-26.1 Together puts portrait cards side by side, the front on the left   [auto: phone, webkit]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: a pair: open the front, tap **Export**, tap **Add back** and choose the back. The back is open; tap **Export**, and tap Size **Original**. Fill outside photo is **White**

The two sides are detected at slightly different sizes, so one card is smaller than the other.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Separately** | **Separately** is selected |
| 2 | Tap **Download** | Two files: the front's and the back's, each at its own size |
| 3 | Tap **Together** | **Together** is selected |
| 4 | Tap **Download** | One file, 14_front_portrait_raw_white-pair.jpg |
| 5 | Measure it | Its height is the taller card's; its width is twice the wider card's plus a gap of 0.8% of that twice-width, rounded to whole pixels |
| 6 | Look at it | The front is on the left and the back on the right, each at the size of its own file from row 2; the gap between them is white |
| 7 | Look at the smaller card's half | The smaller card sits in the middle of its half, with white around it |
| 8 | Look at the outer edges | No margin: the larger card's edges are the image's edges |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### PAIR-26.2 Together stacks landscape cards, the front on top   [auto: phone, webkit]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 13_front_landscape_onetouch_labeled_white.JPEG and 13_back_landscape_onetouch_labeled_white.JPEG from samples/
- Starting screen: a pair: open the front, tap **Export**, tap **Add back** and choose the back. The back is open; tap **Export**, and tap Size **Original**. Fill outside photo is **White**

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Separately** | **Separately** is selected |
| 2 | Tap **Download** | Two files: the front's and the back's |
| 3 | Tap **Together** | **Together** is selected |
| 4 | Tap **Download** | One file, 13_front_landscape_onetouch_labeled_white-pair.jpg |
| 5 | Measure it | Its width is the wider card's; its height is twice the taller card's plus a gap of 0.8% of that twice-height, rounded to whole pixels |
| 6 | Look at it | The front is on top and the back below, each at the size of its own file from row 2; the gap between them is white |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## PAIR-27 A Together image over the size limit

A Together image larger than the browser's canvas limits scales both sides down by the same factor, and a note says so: "Scaled down to fit the 16.7 MP limit.", with the limit in force.

- Risk: low
- Check: script, saved file
- Layout: both. No difference.
- Added: 1.10 baseline
- Changed: 1.10.0
- Anchors: `CONFIG.maxOutputArea`, `CONFIG.maxOutputPx`, "Scaled down to fit the ", " MP limit."
- Source: `js/app/pair.js` (`togetherLayout`, `pairReadout`), `js/engine.js` (`pairLayout`, `pairScale`), `js/app/export-controls.js` (`exportNotes`, `clampNote`, `limitMegapixels`)
- Ruling: R15. The note reads "Scaled down to fit the N MP limit." (approved wording; N the limit in millions of pixels, rounded down to a tenth). The app does this since 1.10.0. R47. The note gives the limit in force: 1 MP under `?maxOutputArea=1000000`, 16.7 MP normally. The app does this since 1.10.0.
- Cases: 1

### PAIR-27.1 A Together image over the canvas limit scales both cards down alike   [auto: phone, webkit]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test, opened with `?maxOutputArea=1000000` added to its address (index.html?maxOutputArea=1000000), which lowers the canvas limit to 1 MP (1,000,000 pixels)
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: a pair: open the front, tap **Export**, tap **Add back** and choose the back. Then tap **Export**, and tap Size **Original**

Each card alone is under 1 MP; the two side by side are over it.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Separately** | The size line gives the front's and the back's sizes, each under 1,000,000 pixels, with no note |
| 2 | Tap **Together** | The size line gives one size of at most 1,000,000 pixels, with the shape (width over height) of the two cards side by side; a note reads "Scaled down to fit the 1 MP limit.", the approved words with the limit in force, which this case's link lowers to 1 MP (ruling R47) |
| 3 | Tap **Download** | One file, at the size the line gave |
| 4 | Look at it | Both cards are in it, shrunk by the same factor: each keeps its shape, and the gap between them is white |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## PAIR-28 Separately saves two files

Separately saves two files, each identical to that side's own export.

- Risk: high
- Check: script, saved file
- Layout: both. No difference.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Separately", `#btnDownload`
- Source: `js/app/pair.js` (`encodeSeparately`, `renderSideInto`)
- Cases: 2

### PAIR-28.1 Separately saves the front exactly as its own export   [auto: phone, webkit]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: the front open on its own, on the Crop step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap the **5:7 card** preset | **5:7 card** is selected |
| 2 | Tap **Export** in the step tabs | The Export step |
| 3 | Tap Size **Original** | **Original** is selected |
| 4 | Tap **Download** | One file, 14_front_portrait_raw_white-straight.jpg: the front on its own |
| 5 | Tap **Add back** | The photo picker opens |
| 6 | Choose 14_back_portrait_raw_white.JPEG | The back opens; **Front** / **Back** shows in the top bar |
| 7 | Tap **Export** in the step tabs | The back's Export step, Size **Original** |
| 8 | Tap **Separately** | **Separately** is selected |
| 9 | Tap **Download** | Two files, 14_front_portrait_raw_white-front.jpg and 14_back_portrait_raw_white-back.jpg |
| 10 | Compare the front's file with the file from row 4 | They are the same size and the same, pixel for pixel |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### PAIR-28.2 Separately saves the back exactly as its own export   [auto: phone, webkit]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: a pair: open the front, tap **Export**, tap **Add back** and choose the back. The back is open; tap **Export**, Size **Original**, and **Separately**

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Download** | Two files, 14_front_portrait_raw_white-front.jpg and 14_back_portrait_raw_white-back.jpg |
| 2 | Tap **Unpair** | The question box asks: **Keep front**, **Keep back**, **Cancel** |
| 3 | Tap **Keep back** | The back is a single photo: **Front** / **Back** has gone |
| 4 | Tap **Download** | One file, 14_back_portrait_raw_white-straight.jpg: the back on its own |
| 5 | Compare it with the back's file from row 1 | They are the same size and the same, pixel for pixel |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## PAIR-29 Pair file names

Together's file is named after the front photo with **-pair** added; Separately's are the front photo's name with **-front** and the back photo's name with **-back**, each with the format's extension.

- Risk: medium
- Check: script, saved file
- Layout: both. No difference.
- Added: 1.10 baseline
- Changed: none
- Anchors: "-pair.", `#btnDownload`
- Source: `js/app/pair.js` (`togetherFile`, `encodeSeparately`), `js/app/export.js` (`exportBaseName`)
- Cases: 1

### PAIR-29.1 The pair's files are named after the front and the back   [auto: phone, webkit]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: a pair: open the front, tap **Export**, tap **Add back** and choose the back. The back is open; tap **Export**, Size **Original** and Format **PNG**

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Download** (with **Together** selected) | One file: 14_front_portrait_raw_white-pair.png |
| 2 | Tap **Separately** | **Separately** is selected |
| 3 | Tap **Download** | Two files: 14_front_portrait_raw_white-front.png and 14_back_portrait_raw_white-back.png |
| 4 | Tap Format **JPEG** | **JPEG** is selected |
| 5 | Tap **Download** | Two files: 14_front_portrait_raw_white-front.jpg and 14_back_portrait_raw_white-back.jpg |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## PAIR-30 Downloading a pair

**Download** saves one file for Together, and two downloads 250 ms apart for Separately.

- Risk: medium
- Check: script, saved file
- Layout: both. No difference.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnDownload`, "the Together image", "the front and back"
- Source: `js/app/pair.js` (`deliverPair`)
- Cases: 1

### PAIR-30.1 Download saves one file for Together and two, a moment apart, for Separately   [auto: phone, webkit]
The finished message is in ruling R79's words. Until R79 is built (BUG-290) the app writes today's ("Exported the Together image in N s." and "Exported the front and back in N s."), which this case also accepts: it reads only that each save finished, and MSG-23.1 and MSG-24.1 holds the words.
Script only
Stand-in: nothing is replaced; the two files are a quarter of a second apart, too close to time by eye, so the script notes when each download starts. On a real iPhone, PAIR-31.1.

Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: a pair: open the front, tap **Export**, tap **Add back** and choose the back. The back is open; tap **Export**, and tap Size **Original**

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Download** (with **Together** selected) | One file arrives; a message begins "Front and back downloaded: " and ends "in N s." (N, a number of seconds) |
| 2 | Tap **Separately** | **Separately** is selected |
| 3 | Tap **Download** | Two files arrive, the second at least a quarter of a second after the first; a message begins "Front and back downloaded: " and ends "in N s." |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## PAIR-31 Both downloads arrive on an iPhone

On an iPhone, both of Separately's downloads arrive.

- Risk: medium
- Check: phone
- Layout: phone. iPhone Safari only.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnDownload`
- Source: `js/app/pair.js` (`deliverPair`)
- Cases: 1

### PAIR-31.1 Both of Separately's downloads arrive on an iPhone   [phone]
The finished message is in ruling R79's words. Until R79 is built (BUG-290) the app writes today's ("Exported the front and back in N s."), which this case also accepts: it reads only that the save finished, and MSG-24.1 holds the words.
Before you start:
- Device and browser: an iPhone, Safari
- Build: the build under test at the UAT site, https://rberrill.github.io/p1hunt_card_finisher_uat/
- Browser data: none for this site (a private tab, or the site's data cleared in Settings › Safari)
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/ (AirDrop them to the phone or save them to Photos first)
- Starting screen: a pair: open the front, tap **Export**, tap **Add back** and choose the back. The back is open; tap **Export**, Size **Original**, and **Separately**

At **Original** no question box asks to upscale. Safari's downloads go to the folder named in Settings › Safari › Downloads (Downloads, in iCloud Drive, unless it was changed). That the files are named and timed right is checked by script in PAIR-29.1 and PAIR-30.1; this case is about Safari keeping both.

Accept Safari's downloads (a named action): each time Safari asks whether to download a file, tap **Download**, until it asks no more.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Download** (grey, beside the red **Share**) | A message over the photo begins "Front and back downloaded: " |
| 2 | Accept Safari's downloads | Safari asks nothing more |
| 3 | Look at the app | The pair is still open on Export, with **Next card** in white in the bottom row |
| 4 | Open the Files app and go to the downloads folder | Two new files are there: 14_front_portrait_raw_white-front.jpg and 14_back_portrait_raw_white-back.jpg |
| 5 | Tap 14_back_portrait_raw_white-back.jpg | It opens: the back of the card, straightened and cropped to the card |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, how many times Safari asked, a screenshot (press the side button and volume up together).

## PAIR-32 Sharing a pair

**Share** opens one share sheet holding the one file (Together) or both files (Separately).

- Risk: medium
- Check: phone; script
- Layout: both. Share shows only on a secure page whose browser can share files.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnShare`
- Source: `js/app/pair.js` (`deliverPair`), `js/app/export.js` (`shareExport`, `shareFiles`)
- Cases: 2

### PAIR-32.1 Share opens one share sheet with the pair's file or files   [phone]
The finished message is in ruling R79's words. Until R79 is built (BUG-290) the app writes today's ("Exported the Together image in N s." and "Exported the front and back in N s."), which this case also accepts: it reads only that each share finished, and MSG-23.1 and MSG-24.1 holds the words.
Waiting on find-out Q-08: what the top of the iPhone's share sheet shows for shared pictures (a small picture of each, their names). Rows 1 and 4 gain those words once Rich has seen it on the phone.

Before you start:
- Device and browser: an iPhone, Safari
- Build: the build under test at the UAT site, https://rberrill.github.io/p1hunt_card_finisher_uat/ (HTTPS; over plain HTTP the Share button is hidden)
- Browser data: none for this site (a private tab, or the site's data cleared in Settings › Safari)
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/ (AirDrop them to the phone or save them to Photos first)
- Starting screen: a pair: open the front, tap **Export**, tap **Add back** and choose the back. The back is open; tap **Export**, and tap Size **Original**. **Together** is selected

At **Original** no question box asks to upscale. The share sheet is the iPhone's panel of ways to send or save a file (AirDrop, Messages, Save Image…).

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Share** (red, first in the row of three buttons) | A thin red line runs along the top edge of the controls (the block of buttons under the photo), then the share sheet rises from the bottom of the screen |
| 2 | Tap **Save Image** | The share sheet closes; a message over the photo begins "Front and back shared: " |
| 3 | Tap **Separately** | **Separately** is selected (white) |
| 4 | Tap **Share** | One share sheet rises |
| 5 | Tap **Save 2 Images** | The share sheet closes; a message begins "Front and back shared: " |
| 6 | Open the Photos app | The three newest pictures are the joined image (the front on the left, the back on the right), then the front alone and the back alone |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot (press the side button and volume up together).

### PAIR-32.2 Share hands over one file for Together and both for Separately   [auto: phone]
Script only
Stand-in: no person can see the names of the files a share sheet is handed, and no case uses a desktop browser's own share sheet, so the script gives the page a stand-in share sheet that records what it is handed and finishes the share at once. The real sheet is PAIR-32.1.

Before you start:
- Device and browser: a phone-width window (390 × 844), touch, with the stand-in share sheet
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: a pair: open the front, tap **Export**, tap **Add back** and choose the back. The back is open; tap **Export**, and tap Size **Original**

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the row of three buttons under the size line | **Share** is the red button, beside **Download** |
| 2 | Tap **Share** (with **Together** selected) | One share sheet, with one file: 14_front_portrait_raw_white-pair.jpg |
| 3 | Tap **Separately** | **Separately** is selected |
| 4 | Tap **Share** | One share sheet, with two files: 14_front_portrait_raw_white-front.jpg and 14_back_portrait_raw_white-back.jpg |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## PAIR-33 Copying a pair

**Copy** puts the Together image on the clipboard as PNG. It is hidden while Separately is chosen.

- Risk: medium
- Check: script
- Layout: both. Copy shows only on a secure page whose browser can copy images.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnCopy`, "Copied to clipboard (PNG)."
- Source: `js/app/pair.js` (`runPairExport`, `encodeTogether`), `js/app/export.js` (`doExport`), `js/app/export-controls.js` (`syncSaveButtons`)
- Cases: 1

### PAIR-33.1 Copy puts the Together image on the clipboard, and hides for Separately   [auto: phone]
The message is in ruling R79's words. Until R79 is built (BUG-290) the app writes today's ("Copied to clipboard (PNG)."), which this case also accepts: it reads only that the copy finished, and MSG-29.2 holds the words.
Before you start:
- Device and browser: a phone-width window, in a browser that can copy images on a secure page
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: a pair: open the front, tap **Export**, tap **Add back** and choose the back. The back is open; tap **Export**, and tap Size **Original**

The automated test puts a stand-in for the clipboard in the page, which records the image it is given. By hand, paste into any app that takes images.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Copy** (with **Together** selected) | A message reads "Front and back copied (PNG)." |
| 2 | Paste the clipboard into an app that takes images | A PNG image the size the size line gives: the two cards side by side |
| 3 | Tap **Separately** | **Copy** is no longer in the save row |
| 4 | Tap **Together** | **Copy** is back |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## PAIR-34 When a pair counts as exported

A pair counts as exported for both sides' edits together with the Together / Separately choice; changing either side, or the choice, hides **Next card**.

- Risk: medium
- Check: script
- Layout: both. No difference.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnNextCard`, `#pairOutput`
- Source: `js/app/pair.js` (`pairKey`, `isPairExported`, `markPairExported`), `js/app/export-controls.js` (`syncNextCard`)
- Cases: 1

### PAIR-34.1 Next card shows while both sides and the output choice are as exported   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: a pair: open the front, tap **Export**, tap **Add back** and choose the back. The back is open; tap **Export**, and tap Size **Original**

Type the angle N: tap the angle (**0.0°**, with a pencil after it), type N, tap **Done**.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the bottom row | No **Next card** |
| 2 | Tap **Download** (with **Together** selected) | The file arrives; **Next card** shows |
| 3 | Tap **Front** in the top bar | The front's Export: **Next card** still shows |
| 4 | Tap **Separately** | **Next card** goes: Separately hasn't been saved |
| 5 | Tap **Together** | **Next card** is back |
| 6 | Tap **Rotate** in the step tabs | The front's Rotate step; the angle reads 0.0° |
| 7 | Type the angle 2 | The angle reads 2.0° |
| 8 | Tap **Export** in the step tabs | No **Next card**: the front has changed since the export |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## PAIR-35 One full-size photo in memory at a time

A pair's export holds one full-resolution photo at a time: the open side is rendered and let go, the other side is read, used and closed, then the open side is read again.

- Risk: high
- Check: script; phone
- Layout: both. No difference; the memory limit that makes it matter is the iPhone's.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnDownload`, `#btnShare`
- Source: `js/app/pair.js` (`forEachSidePhoto`, `reloadOpenPhoto`)
- Cases: 2

### PAIR-35.1 A pair's export never holds two full-size photos at once   [auto: phone]
Script only
Stand-in: nothing is replaced. A person can't see how many full-size photos the app holds, so the script counts them as the app reads and lets go of each. On a real iPhone, PAIR-35.2.

Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: a pair: open the front, tap **Export**, tap **Add back** and choose the back. The back is open; tap **Export**, and tap Size **Original**

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Download** (with **Together** selected) | One file arrives. All through the export, at most one full-size photo is held: the back's is let go before the front's is read, and the front's before the back's is read again |
| 2 | Look at what the app holds once the export has finished | The back's full-size photo, and nothing else |
| 3 | Tap **Separately** | **Separately** is selected |
| 4 | Tap **Download** | Two files arrive; again at most one full-size photo is held at a time, and the back's is held again at the end |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### PAIR-35.2 A pair of the iPhone's largest photos exports without the page reloading   [phone]
The finished message is in ruling R79's words. Until R79 is built (BUG-290) the app writes today's ("Exported the Together image in N s." and "Exported the front and back in N s."), which this case also accepts: it reads only that each save finished, and MSG-23.1 and MSG-24.1 holds the words.
Before you start:
- Device and browser: an iPhone, Safari
- Build: the build under test at the UAT site, https://rberrill.github.io/p1hunt_card_finisher_uat/
- Browser data: none for this site (a private tab, or the site's data cleared in Settings › Safari)
- Photos: two photos of one card, its front and its back, taken with the iPhone's main camera at its highest resolution setting, held upright, with the card filling at least half the photo's height, in Photos
- Starting screen: a pair: open the front, tap **Export**, tap **Add back** and choose the back. The back is open; tap **Export**, and tap Size **Original**. **Together** is selected

At **Original** no question box asks to upscale. The open side's photo is let go during the export and read again at its end; had it not been read again, an amber warning would begin "The photo isn’t loaded after the last export." (PAIR-36.1).

Accept Safari's downloads (a named action): each time Safari asks whether to download a file, tap **Download**, until it asks no more.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Download** (grey, beside the red **Share**) | A thin red line runs along the top edge of the controls (the block of buttons under the photo), then a message over the photo begins "Front and back downloaded: "; the page did not reload or go blank |
| 2 | Accept Safari's downloads | Safari asks nothing more; the back is on screen, on Export, with **Next card** in white in the bottom row and no amber warning |
| 3 | Tap **Separately** | **Separately** is selected (white) |
| 4 | Tap **Download** | The red line runs again, then a message begins "Front and back downloaded: "; the page did not reload or go blank |
| 5 | Accept Safari's downloads | Safari asks nothing more; the back is on screen, on Export, with **Next card** in white and no amber warning |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, the iPhone model, a screen recording (Control Center, the Screen Recording button).

## PAIR-36 The open photo can't be read again after an export

If the open side's photo can't be read again after a pair's export (two tries), a warning says so and how to get it back. The screen keeps drawing from the smaller copies, and every full-size save refuses until a side switch.

- Risk: low
- Check: script
- Layout: both. No difference.
- Added: 1.10 baseline
- Changed: none
- Anchors: "The photo isn’t loaded after the last export. ", "Tap Front or Back to switch sides, then switch back."
- Source: `js/app/pair.js` (`reloadOpenPhoto`, `runPairExport`), `js/app/export.js` (`renderWarped`)
- Cases: 1

### PAIR-36.1 When the open photo can't be read again, saving waits for a side switch   [auto: phone]
Script only
Stand-in: from row 1 until row 4, the script makes every read of the back's photo fail, as a read under memory pressure on an iPhone can; no person can make a read fail on cue.

Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: a pair: open the front, tap **Export**, tap **Add back** and choose the back. The back is open; tap **Export**, and tap Size **Original**

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Download** | The file arrives; then an amber warning reads "The photo isn’t loaded after the last export. Tap Front or Back to switch sides, then switch back." |
| 2 | Look at the photo | The joined image is still drawn on screen |
| 3 | Tap **Download** | No file: a red message begins "Export failed" (the rest of its words are ruling R24's, checked under Messages, MSG-31) |
| 4 | Tap **Front** in the top bar (the back's photo can be read again from now on) | The front opens |
| 5 | Tap **Back** in the top bar | The back opens |
| 6 | Tap **Download** | The file arrives: 14_front_portrait_raw_white-pair.jpg |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## PAIR-37 The pair's size line

On Export the size line reads **W × H px · FORMAT** for Together, and **front W × H + back W × H px · FORMAT** for Separately. With Separately, when the side not on screen is scaled down to fit the size limit, a note names it: "The back is scaled down to fit the 16.7 MP limit." (or the front), with the limit in force.

- Risk: medium
- Check: script
- Layout: both. On a phone, while a note shows, the note takes the size line's place; on a wide screen the size line stays.
- Added: 1.10 baseline
- Changed: 1.10.0
- Anchors: `#exportReadout`, `#exportMessage`, `#pairOutput`, "’s corners in Perspective first.", " is scaled down to fit the ", " MP limit."
- Source: `js/app/export-controls.js` (`syncExportReadouts`, `syncExportReadout`, `exportNotes`, `clampNote`, `limitMegapixels`), `js/app/pair.js` (`pairReadout`, `togetherLayout`, `waitingSideToFix`)
- Ruling: R14. For a pair saved Separately, the clamp note shows if either side is scaled down, and names that side when it is not the one on screen: "The back is scaled down to fit the 16.7 MP limit." (or "The front…"; "Both sides are scaled down to fit the 16.7 MP limit." when both are; approved wording). The app does this since 1.10.0. R26. When the waiting side's corners are invalid, the line reads "Fix the back’s corners in Perspective first." (or "Fix the front’s corners…"; approved wording) and Share, Download and Copy are dimmed. The app does this since 1.10.0. R47. The note gives the limit in force: 1 MP under `?maxOutputArea=1000000`, 16.7 MP normally. The app does this since 1.10.0.
- Cases: 3

### PAIR-37.1 The size line gives the joined size, or the front's and the back's   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: a pair: open the front, tap **Export**, tap **Add back** and choose the back. The back is open; tap **Export**, and tap Size **Original**

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the size line (with **Together** selected) | It reads "W × H px · JPEG": the joined image's width and height in pixels, W in bold with H |
| 2 | Tap **Separately** | It reads "W × H + W × H px · JPEG": the front's size, then the back's |
| 3 | Tap Format **PNG** | The line ends "px · PNG" |
| 4 | Tap **Together** | The joined size again: twice the wider card plus the gap across, the taller card's height, "px · PNG" |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### PAIR-37.2 Separately warns when the side not on screen is scaled down   [auto: phone]
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test, opened with `?maxOutputArea=1000000` added to its address (index.html?maxOutputArea=1000000), which lowers the limit to 1 MP (1,000,000 pixels), the lowest a link may set
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: a pair: open the front, tap **Export**, tap **Add back** and choose the back. The back is open on the Perspective step

Each card on its own is under 1 MP at **Original** (PAIR-27.1). Rows 1 and 2 draw the back's outline larger, so at **Original** the back is over the limit and scaled down, and the front is not. A corner's handle is the round handle on that corner of the outline. On a phone, while a note shows beside **Together** / **Separately**, the note takes the size line's place.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Drag the top-left corner's handle about 60 px up and to the left, and let go | The handle sits outside the card, up and to the left of its corner |
| 2 | Drag the bottom-right corner's handle about 60 px down and to the right, and let go | The handle sits outside the card, down and to the right of its corner: the outline is larger than the card |
| 3 | Tap **Front** in the top bar | The front opens on Perspective, with **Front** in white |
| 4 | Tap **Export** in the step tabs | The Export step, with **Together** selected |
| 5 | Tap Size **Original** | **Original** is selected |
| 6 | Tap **Separately** | **Separately** is selected, and beside it one note reads "The back is scaled down to fit the 1 MP limit.", the approved words with the limit in force, which this case's link lowers to 1 MP (ruling R47) |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### PAIR-37.3 When the other side's corners are crossed, the line says which side to fix   [auto: phone]
Before you start:
- Device and browser: a phone-width window (390 × 844), touch, in a browser that can share files and copy images on a secure page (an iPhone's Safari on the UAT site; the automated test puts a stand-in for the share sheet in the page)
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: a pair: open the front, tap **Export**, tap **Add back** and choose the back. The back is open on the Perspective step

A corner's handle is the round handle on that corner of the outline; the line above the controls is the one line of text at the top of the controls (the block of buttons under the photo).

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Drag the top-left corner's handle down and to the right, past the bottom-right corner, and let go | The corner lines cross; the line above the controls reads "Corners cross or fold inward. Drag them back into a convex shape." |
| 2 | Tap **Front** in the top bar | The front opens on Perspective, its picture replacing the back's; the "Opening the front…" message goes |
| 3 | Tap **Export** in the step tabs | The size line reads "Fix the back’s corners in Perspective first."; **Share**, **Download** and **Copy** are greyed out |
| 4 | Tap **Download** | Nothing is saved, and no message beginning "Export failed" shows |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## PAIR-38 The Together preview

While Together is chosen, Export shows the joined image as it will be saved (each side's levels and logo, and a checkerboard where the fill is transparent); with Separately it shows the side you are on.

- Risk: medium
- Check: eye
- Layout: both. No difference.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Fix the corners of both sides in Perspective first.", `CONFIG.pair.previewMaxPx`, `#pairOutput`
- Source: `js/app/pair.js` (`isTogetherShown`, `togetherPreview`, `drawPreviewSides`, `renderPreviewSide`), `js/app/view.js` (`drawTogether`)
- Cases: 1

### PAIR-38.1 The Together preview, for a person to judge   [eye]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/; the logo icons/icon.svg from the app's own folder
- Starting screen: a pair: open the front, tap **Export**, tap **Add back** and choose the back. The back is open on the Perspective step; **Together** is selected

What the saved files hold is checked by script in PAIR-24.1 and PAIR-26.1; this case is about what the screen shows before saving. Two named actions:
- Add the logo: tap **Overlay** in the step tabs (the six tabs Perspective to Export along the bottom), tap **Add logo**, and choose icon.svg in the file picker.
- Set the fill to Transparent: tap the options tab (the small tab with an up arrow on the top edge of the controls, the block of buttons under the photo), tap the **Fill outside photo** row, choose **Transparent** in the list it opens, and close the options with the **×** at their top right.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Add the logo | The logo appears on the back |
| 2 | Tap **Front** in the top bar | The front opens on the Overlay step, with no logo |
| 3 | Tap **Levels** in the step tabs | The front's Levels step |
| 4 | Tap **Auto** | The front's whites turn brighter, and a white dot shows on the **Levels** tab |
| 5 | Tap **Apply** | **Apply** is greyed out and the dot on the **Levels** tab goes |
| 6 | Tap **Export** in the step tabs | The photo area shows one joined image: the front on the left with its brighter levels and no logo, the back on the right with the logo where it was placed, a thin white gap between them, nothing else around them |
| 7 | Set the fill to Transparent | The gap between the cards and the space around the smaller card show a grey checkerboard instead of white |
| 8 | Tap **Separately** | The photo area shows the front alone (the side you are on), framed by its crop, with no back beside it |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## PAIR-39 The Together preview's own zoom

The Together preview has its own zoom and pan, which fit the screen again when the image's size or the Together / Separately choice changes.

- Risk: low
- Check: script
- Layout: both. On a phone **Fit** shows only while zoomed or panned; on a wide screen it always shows.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnFit`, `#pairOutput`
- Source: `js/app/view.js` (`togetherView`, `viewKey`), `js/app/pair.js` (`setPairOutput`)
- Cases: 1

### PAIR-39.1 The Together preview zooms on its own and fits again when it changes   [auto: both]
Before you start:
- Device and browser: any; a phone-width window (zoom with two fingers) or a wide window (zoom with the mouse wheel)
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: a pair: open the front, tap **Export**, tap **Add back** and choose the back. The back is open on the Perspective step; **Together** is selected

Zoom in: on a phone, put two fingers on the image and spread them apart; on a wide screen, point at the image and roll the mouse wheel away from you. **Fit** is the icon button in the top bar whose tooltip reads "Fit to screen (F)".

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Export** in the step tabs | The joined image fits the photo area; on a phone there is no **Fit** in the top bar, on a wide screen **Fit** is there |
| 2 | Zoom in on the image | The image grows; on a phone **Fit** appears in the top bar |
| 3 | Tap **Separately** | The back alone, fitted to the photo area: the zoom was the joined image's own; on a phone **Fit** goes |
| 4 | Tap **Together** | The joined image fits the photo area again, as in row 1 |
| 5 | Zoom in on the image | The image grows |
| 6 | Tap **Fit** | The joined image fits the photo area again |
| 7 | Zoom in on the image | The image grows |
| 8 | Tap **Crop** in the step tabs | The back's Crop step, its box upright under **5:7 card** |
| 9 | Tap **Swap** | The box lies down, 7 wide to 5 high, under **7:5 card** |
| 10 | Tap **Export** in the step tabs | The two cards now lie down, one above the other, and the joined image fits the photo area: its new size was fitted afresh |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## PAIR-40 The pair is stored for Resume

The pair is stored for Resume: the open side as for any photo, plus the waiting side's photo, edits, unapplied Levels changes, step and logo, the side that was open, the orientation and whether it was exported.

- Risk: high
- Check: script
- Layout: both. No difference.
- Added: 1.10 baseline
- Changed: 1.10.0
- Anchors: `CONFIG.session.enabled`, `CONFIG.session.saveDelayMs`
- Source: `js/app/pair.js` (`savePairSession`, `savePairSoon`); `js/app/overlay.js` (`keepPhotoOverlayStored`)
- Ruling: R35. After Resume the photo exports as it looked: when a switch opens a side whose logo is neither the stored photo's logo nor the saved one, it becomes the stored photo's logo. The app does this since 1.10.0.
- Cases: 2

### PAIR-40.1 Resume brings back the waiting side's edits, Levels changes, logo and the pair's orientation   [auto: phone, webkit]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/; the logo icons/icon.svg from the app's own folder
- Starting screen: a pair: open the front, tap **Export**, tap **Add back** and choose the back, then tap **Front** in the top bar and **Rotate** in the step tabs. The front is open on the Rotate step, its angle at 0.0°

Whether the side that was open comes back with its own work is PAIR-41.1; this case is about the side that was waiting. Four named actions:
- Type the angle N: tap the angle (**0.0°**, with a pencil after it), type N, tap **Done**.
- Lay the crop down: tap **Crop** in the step tabs (the six tabs Perspective to Export), then **Swap**.
- Add the logo: tap **Overlay** in the step tabs, tap **Add logo**, and choose icon.svg in the file picker.
- Auto levels: tap **Levels** in the step tabs, then **Auto**.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Type the angle 3 | The angle reads 3.0° |
| 2 | Lay the crop down | The box lies down, 7 wide to 5 high, under **7:5 card** |
| 3 | Add the logo | The logo appears on the front |
| 4 | Auto levels | **Discard** and **Apply** are no longer greyed out, and a white dot is on the **Levels** tab |
| 5 | Tap **Back** in the top bar | The back opens on Levels, with no dot on the tab |
| 6 | Wait two seconds, then reload the page | The start screen offers **Resume**, naming 14_front_portrait_raw_white.JPEG + 14_back_portrait_raw_white.JPEG |
| 7 | Tap **Resume** | The back opens on Levels, with **Back** in white |
| 8 | Tap **Front** in the top bar | The front opens on Levels: **Discard** and **Apply** are not greyed out, and the dot is on the **Levels** tab |
| 9 | Tap **Rotate** in the step tabs | The angle reads 3.0° |
| 10 | Tap **Overlay** in the step tabs | The logo is on the front, and the card lies down, 7 wide to 5 high |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### PAIR-40.2 With a different logo on each side, Resume brings back the open side's logo   [auto: phone, webkit]
Before you start:
- Device and browser: any; a phone-width or a wide window, with downloads saved to a folder you can open
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/; the logos icons/icon.svg and icons/apple-touch-icon.png from the app's own folder
- Starting screen: a pair: open the front, tap **Export**, tap **Add back** and choose the back. The back is open; tap **Export**, Size **Original** and Format **PNG**, then tap **Front** in the top bar and **Overlay** in the step tabs (the six tabs Perspective to Export). The front is open on the Overlay step, with **Add logo** and no logo on the photo; **Together** is selected on Export

One named action:
- Add the logo NAME: tap **Add logo** and choose NAME in the file picker.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Add the logo icon.svg | The app icon appears on the front |
| 2 | Tap **Back** in the top bar | The back's Overlay step, with **Add logo** and no logo on the photo |
| 3 | Add the logo apple-touch-icon.png | The other picture appears on the back |
| 4 | Tap **Front** in the top bar | The front's Overlay step, with the app icon on the photo |
| 5 | Tap **Export** in the step tabs | The front's Export step, **Together** selected |
| 6 | Tap **Download** | One file, 14_front_portrait_raw_white-pair.png, arrives |
| 7 | Wait two seconds, then reload the page | The start screen offers **Resume**, naming 14_front_portrait_raw_white.JPEG + 14_back_portrait_raw_white.JPEG |
| 8 | Tap **Resume** | The front opens on Export, with **Front** in white |
| 9 | Tap **Download** | A second -pair.png file arrives, with no message about a logo |
| 10 | Compare the two files | They are the same, pixel for pixel |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot, and the two files.

## PAIR-41 Resume brings the pair back

**Resume** rebuilds the waiting side first, then opens the side that was open. The waiting side comes back with no undo history, and **Next card** shows again if the pair had been exported.

- Risk: high
- Check: script
- Layout: both. No difference.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnResume`, `#resumeName`, `#btnNextCard`
- Source: `js/app/pair.js` (`restorePair`, `restoredSide`, `finishResume`), `js/app/start-screen.js` (`resumeSession`)
- Cases: 1

### PAIR-41.1 Resume opens the side that was open, and the waiting side without undo history   [auto: phone, webkit]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: a pair: open the front, tap **Export**, tap **Add back** and choose the back, then tap **Front** in the top bar and **Rotate** in the step tabs. The front is open on the Rotate step, its angle at 0.0°

Type the angle N: tap the angle (**0.0°**, with a pencil after it), type N, tap **Done**. Which photo is read first can't be seen: the automated test also checks, at row 8, that the waiting side's photo (the front's) is read before the open side's.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Type the angle 2 | The angle reads 2.0°; **Undo** (the arrow curving left, at the top right) can be tapped |
| 2 | Tap **Back** in the top bar | The back opens on Rotate |
| 3 | Tap **Export** in the step tabs | The back's Export step |
| 4 | Tap Size **Original** | **Original** is selected |
| 5 | Tap **Download** | The file arrives; **Next card** shows in the bottom row |
| 6 | Wait two seconds, then reload the page | The start screen offers **Resume**, naming 14_front_portrait_raw_white.JPEG + 14_back_portrait_raw_white.JPEG |
| 7 | Tap **Resume** | The back opens on Export, with **Back** in white |
| 8 | Look at the bottom row | **Next card** shows: the pair's export was remembered |
| 9 | Tap **Front** in the top bar | The front opens on Export; **Undo** is greyed out: the front came back without its undo history |
| 10 | Tap **Rotate** in the step tabs | The angle reads 2.0° |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## PAIR-42 A damaged stored pair

A stored pair that is damaged or doesn't match its photo is dropped, and the open side resumes alone with a warning.

- Risk: low
- Check: script
- Layout: both. No difference.
- Added: 1.10 baseline
- Changed: none
- Anchors: "The saved pair wasn’t valid, so it was reset. ", "This photo resumed on its own."
- Source: `js/app/pair.js` (`restorePair`, `isPairRecord`, `restoredSide`, `finishResume`)
- Cases: 2

### PAIR-42.1 A damaged stored pair is dropped, and the open side resumes alone   [auto: phone, webkit]
Script only
Stand-in: no control can damage what the browser stores, so the script replaces the waiting side's (the front's) stored edits with a word, as a damaged record would hold.

Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: a pair: open the front, tap **Export**, tap **Add back** and choose the back. The back is open on the Perspective step; two seconds later, the front's stored edits are damaged

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Reload the page | The start screen offers **Resume** |
| 2 | Tap **Resume** | The back opens on its own; a warning reads "The saved pair wasn’t valid, so it was reset. This photo resumed on its own." |
| 3 | Look at the top bar | There is no **Front** / **Back** and no **Unpair** |
| 4 | Wait two seconds, then reload the page | **Resume** names only 14_back_portrait_raw_white.JPEG: the damaged pair was deleted |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### PAIR-42.2 A stored pair whose photo doesn't match its edits is dropped   [auto: phone, webkit]
Script only
Stand-in: no control can change what the browser stores, so the script replaces the waiting side's (the front's) stored photo with IMG_9136.JPEG, a photo of another size, so it no longer matches its edits.

Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG, 14_back_portrait_raw_white.JPEG and IMG_9136.JPEG from samples/
- Starting screen: a pair: open the front, tap **Export**, tap **Add back** and choose the back. The back is open on the Perspective step; two seconds later, the front's stored photo is replaced

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Reload the page | The start screen offers **Resume** |
| 2 | Tap **Resume** | The back (14_back_portrait_raw_white.JPEG) opens on its own; a warning reads "The saved pair wasn’t valid, so it was reset. This photo resumed on its own." |
| 3 | Tap **Export** in the step tabs | **Add back** is in the bottom row: the back is a single photo |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## PAIR-43 Detection for a resumed side

A side brought back by Resume has no detection results, so the first switch to it runs detection quietly, keeping its corners where they are.

- Risk: low
- Check: script
- Layout: both. No difference.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#toolCandidate`, `#sideSwitch`
- Source: `js/app/pair.js` (`switchSide`), `js/app/state.js` (`runDetect`)
- Cases: 1

### PAIR-43.1 The first switch to a resumed side finds its card but leaves its corners alone   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: a pair: open the front, tap **Export**, tap **Add back** and choose the back. The back is open on the Perspective step

**Candidate** is the tool in Perspective's tool row that steps through the shapes detection found; it is greyed out until detection has found more than one.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Front** in the top bar | The front opens on Perspective; **Candidate** can be tapped |
| 2 | Drag the top-left corner's handle 40 px to the left, and let go | The handle sits 40 px left of the card's corner |
| 3 | Tap **Back** in the top bar | The back opens on Perspective |
| 4 | Wait two seconds, then reload the page | The start screen offers **Resume**, naming 14_front_portrait_raw_white.JPEG + 14_back_portrait_raw_white.JPEG |
| 5 | Tap **Resume** | The back opens on Perspective, with **Back** in white |
| 6 | Tap **Front** in the top bar | The front opens on Perspective; within a second **Candidate** can be tapped again; the top-left handle is still 40 px left of the card's corner; **Undo** (the arrow curving left, at the top right) is greyed out |
| 7 | Tap **Candidate** | The corners jump to another shape detection found: detection ran for the front |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.
