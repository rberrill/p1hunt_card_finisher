# Drop and paste

Bringing a photo or a logo in by dragging a file onto the app or pasting an image.

The files these cases drop or paste, other than the sample photos in `samples/`, are in `tests/fixtures/`: notes.txt (one line of text, "Notes about the card."), card.HEIC (a stand-in: a short text file named like a HEIC photo), green-logo.png (400 × 400 px, solid pure green) and blue-disc.png (400 × 400 px, see-through but for a pure blue disc).

## DND-01 Drop a photo to open it

Drop an image file on the photo area to open it. Of several files dropped, the first image or HEIC file is used; anything else is ignored. While a pair is open, the app first asks **New photo** or to replace the side you are on.

- Risk: medium
- Check: script
- Layout: both. The cases use a computer: whether an iPhone lets a person drag a photo from Photos into Safari at all is find-out item Q-05.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#stage`, `.drag-over`
- Source: `js/app/adapters.js` (`ImageSource.bindDrop`, `ImageSource.isHeic`), `js/app/main.js` (`bindPhotoInput`), `js/app/pair.js` (`receivePhoto`)
- Cases: 5

### DND-01.1 A photo dropped on the photo area opens   [auto: desktop]
Before you start:
- Device and browser: a computer with a mouse; a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/, in a file browser beside the app
- Starting screen: the start screen, with no photo open

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the photo area | The start screen, with **Open photo** and no photo |
| 2 | Drag IMG_9136.JPEG from the file browser onto the photo area and let go | The photo opens on the Perspective step |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### DND-01.2 Of several files dropped, the first picture opens   [auto: desktop]
Before you start:
- Device and browser: a computer with a mouse; a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Files: notes.txt from tests/fixtures/ (one line of text), then IMG_9075.JPEG and IMG_9136.JPEG from samples/, copied into one folder and selected together in that order in a file browser beside the app
- Starting screen: the start screen, with no photo open

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Drag the three files together onto the photo area and let go | IMG_9075.JPEG opens: the first picture, the text file passed over |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### DND-01.3 A HEIC file is taken by its name   [auto: desktop]
Before you start:
- Device and browser: a computer with a mouse; a wide window, in a browser that can't open HEIC (Chrome or Edge)
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Files: notes.txt and card.HEIC from tests/fixtures/ (card.HEIC is a stand-in: a short text file named like a HEIC photo), selected together in a file browser beside the app
- Starting screen: the start screen, with no photo open

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Drag the two files together onto the photo area and let go | A red message reads "This browser can’t open HEIC. Save the photo as JPEG first (Safari opens HEIC directly).": card.HEIC was taken, by its name |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### DND-01.4 A dropped file that isn't a picture is ignored   [auto: desktop]
Before you start:
- Device and browser: a computer with a mouse; a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- File: notes.txt from tests/fixtures/ (one line of text), in a file browser beside the app
- Starting screen: the start screen, with no photo open

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Drag notes.txt onto the photo area and let go | Nothing happens: no message, the start screen stays, and the browser doesn't open the file |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### DND-01.5 While a pair is open, a dropped photo asks New photo or Replace back   [auto: desktop]
Before you start:
- Device and browser: a computer with a mouse; a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/; IMG_9136.JPEG from samples/ in a file browser beside the app
- Starting screen: the front open, with the back added by **Add back** on the Export step; the back is open

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the top bar | **Front** / **Back** shows |
| 2 | Drag IMG_9136.JPEG onto the photo area and let go | The question box (the box over the dimmed photo with a question and two or three buttons) asks "New photo": "End the pair, or replace the side you’re on?", with **New photo** and **Replace back** |
| 3 | Click **New photo** | IMG_9136.JPEG opens on its own; **Front** / **Back** is gone from the top bar |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## DND-02 The drop outline

While a file is dragged over the photo area, a white dashed outline shows with the caption **Drop to open**, or **Drop to add as the logo** on the Overlay step with a photo open. It goes when the file leaves or is dropped.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `.drag-over`, `"Drop to open"`, `"Drop to add as the logo"`
- Source: `js/app/adapters.js` (`ImageSource.bindDrop`), `css/app.css` (`.stage.drag-over`)
- Cases: 2

### DND-02.1 A file held over the photo area shows the outline and Drop to open   [auto: desktop]
Before you start:
- Device and browser: a computer with a mouse; a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: IMG_9136.JPEG from samples/; IMG_9075.JPEG from samples/ in a file browser beside the app
- Starting screen: IMG_9136.JPEG open, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the photo area | No outline |
| 2 | Drag IMG_9075.JPEG over the photo area and hold it there | A white dashed outline, 2 px, just inside the photo area, with "Drop to open" near its foot |
| 3 | Drag it back off the photo area without letting go, then let go over the file browser | The outline goes; IMG_9136.JPEG is still open |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### DND-02.2 On Overlay the outline says Drop to add as the logo, and goes on the drop   [auto: desktop]
Before you start:
- Device and browser: a computer with a mouse; a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Logo: green-logo.png from tests/fixtures/ (400 × 400 px, solid pure green), in a file browser beside the app
- Starting screen: the photo open, on the Overlay step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Drag green-logo.png over the photo area and hold it there | The white dashed outline, with "Drop to add as the logo" |
| 2 | Let go | The outline goes, and the green logo shows on the photo |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## DND-03 Paste an image to open it

Paste an image anywhere on the page (Ctrl+V or Cmd+V, or the browser's Paste) to open it, named "pasted-photo". A paste with no image in it is left to the browser.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `"pasted-photo"`
- Source: `js/app/adapters.js` (`ImageSource.bindPaste`), `js/app/main.js` (`bindPhotoInput`)
- Cases: 2

### DND-03.1 A pasted picture opens as a photo named pasted-photo   [auto: desktop]
Before you start:
- Device and browser: a computer with a keyboard and a mouse; a wide window, in a browser that can paste images (the automated case runs in Chromium only), with downloads saved to a folder you can open
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/, opened in an image viewer and copied with its Copy, so the picture is on the clipboard
- Starting screen: the start screen, with no photo open

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Press Ctrl+V (Cmd+V on a Mac) | The card photo opens on the Perspective step |
| 2 | Click **Export** in the step tabs (the six tabs Perspective to Export, in the top bar) | The Export step shows, with Export options under the controls |
| 3 | Click **Save edits** in Export options | A file named pasted-photo-edits.json is saved: the photo is named pasted-photo |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### DND-03.2 A paste with no picture in it is left to the browser   [auto: desktop]
Before you start:
- Device and browser: a computer with a keyboard and a mouse; a wide window, in a browser that lets a page read pasted text (the automated case runs in Chromium only)
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Clipboard: the text 7, copied from any text
- Starting screen: the photo open, on the Rotate step, the angle at 0.0°

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Click the angle (**0.0°**, with a pencil after it) | A text box takes its place, with 0.0 in it, selected |
| 2 | Press Ctrl+V (Cmd+V on a Mac) | The box shows 7: the browser pasted the text; IMG_9136.JPEG is still open |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## DND-04 On the Overlay step, a dropped or pasted image becomes the logo

On the Overlay step with a photo open, a dropped or pasted image is added as the logo instead of opening as a photo. Dropped or pasted while a logo is placed, it replaces that logo and takes its position, width and opacity, as **Replace logo** does. In a pair it becomes the logo of the side you are on, with no question. While an export runs it is refused, with the warning a photo gets then: **Wait for the export to finish, then open the photo.**

- Risk: medium
- Check: script
- Layout: both. The cases use a computer: whether an iPhone lets a person drag a picture into Safari at all is find-out item Q-05.
- Added: 1.10 baseline
- Changed: 1.10.0
- Anchors: `"Drop to add as the logo"`, `#overlayInput`, `"Wait for the export to finish, then open the photo."`
- Source: `js/app/main.js` (`bindPhotoInput`), `js/app/overlay.js` (`addOverlayFile`, `place`), `js/app/pair.js` (`receivePhoto`)
- Ruling: R18. A logo dropped or pasted on Overlay while one is placed is a replacement: it takes the old logo's position, width and opacity (a new logo of another shape keeps the old one's center and width, then is clamped inside the crop). The app does this since 1.10.0. R19. Each logo added is its own undo step, even two within 900 ms, and a dropped logo is accepted by its file extension, as the logo picker does. The app differs today. R32. While an export is running a dropped or pasted logo is refused, with the message a dropped photo gets. The app does this since 1.10.0.
- Cases: 8

### DND-04.1 On Overlay, a dropped picture becomes the logo   [auto: desktop]
Before you start:
- Device and browser: a computer with a mouse; a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Logo: green-logo.png from tests/fixtures/ (400 × 400 px, solid pure green), in a file browser beside the app
- Starting screen: the photo open, on the Overlay step, with no logo

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Drag green-logo.png onto the photo area and let go | The green logo shows on the photo; IMG_9136.JPEG is still open, on the Overlay step |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### DND-04.2 On Overlay, a pasted picture becomes the logo   [auto: desktop]
Before you start:
- Device and browser: a computer with a keyboard; a wide window, in a browser that can paste images (the automated case runs in Chromium only)
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Logo: green-logo.png from tests/fixtures/ (400 × 400 px, solid pure green), opened in an image viewer and copied with its Copy
- Starting screen: the photo open, on the Overlay step, with no logo

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Press Ctrl+V (Cmd+V on a Mac) | The green logo shows on the photo; IMG_9136.JPEG is still open |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### DND-04.3 In a pair, a dropped logo goes to the side you're on, with no question   [auto: desktop]
Before you start:
- Device and browser: a computer with a mouse; a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Logo: green-logo.png from tests/fixtures/ (400 × 400 px, solid pure green), in a file browser beside the app
- Starting screen: the front open, with the back added by **Add back**; the back is open, on the Overlay step, with no logo

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Drag green-logo.png onto the photo area and let go | The logo shows on the back; no question box (a box over the dimmed photo with a question) shows |
| 2 | Click **Front** in the top bar | The front has no logo |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### DND-04.4 Two logos dropped within 0.9 s are two undo steps   [auto: desktop]
Written to ruling R19; it fails until that is built (BUG-080).
Script only
Stand-in: the script drops the second logo less than 0.9 s after the first has been added, and measures the gap between the two; dragging two files one after the other from a file browser takes a person longer than that.

Before you start:
- Device and browser: a computer with a mouse; a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Logos: blue-disc.png and green-logo.png from tests/fixtures/, in a file browser beside the app
- Starting screen: the photo open, on the Overlay step, with no logo

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Drag blue-disc.png onto the photo area and let go | The blue disc is the logo |
| 2 | At once, drag green-logo.png onto the photo area and let go | The green square is the logo, added less than 0.9 s after the blue disc |
| 3 | Click **Undo** (the arrow curving left, at the top right) | The blue disc is the logo again |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### DND-04.5 A dropped logo is taken by its name, as the logo picker takes it   [auto: desktop]
Written to ruling R19; it fails until that is built (BUG-191).
Script only
Stand-in: the script drops green-logo.png with no file type, only its name saying PNG, as some systems hand a dragged file over. A file browser on a computer gives a PNG its type, so a person can't drop one without it.

Before you start:
- Device and browser: a computer with a mouse; a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Logo: green-logo.png from tests/fixtures/ (400 × 400 px, solid pure green), handed over with no file type
- Starting screen: the photo open, on the Overlay step, with no logo

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Drop green-logo.png, with no file type, onto the photo area | The green logo shows on the photo |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### DND-04.6 During an export, a dropped logo is refused   [auto: desktop]
Script only
Stand-in: an export here lasts well under a second, too short for a person to change step and drop a file while it runs, so the script holds the export open until the drop has been checked, then lets it finish.

Before you start:
- Device and browser: a computer with a mouse; a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Logo: green-logo.png from tests/fixtures/ (400 × 400 px, solid pure green), in a file browser beside the app
- Starting screen: the photo open, on the Export step, with **2000** selected under Size and no logo

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Click **Download** | The question box (the box over the dimmed photo with a question and two or three buttons) asks "Upscale to 2000 px?" |
| 2 | Click **No** | The export runs: a progress line crosses the top edge of the controls |
| 3 | While it runs, click **Overlay** in the step tabs (the six tabs Perspective to Export, in the top bar) | The Overlay step shows |
| 4 | Still while it runs, drag green-logo.png onto the photo area and let go | No logo is added, and an amber message reads "Wait for the export to finish, then open the photo." |
| 5 | Wait for the export to finish | IMG_9136.JPEG is still the photo open, with no logo |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### DND-04.7 During an export, a pasted logo is refused   [auto: desktop]
Script only
Stand-in: an export here lasts well under a second, too short for a person to change step and paste while it runs, so the script holds the export open until the paste has been checked, then lets it finish.

Before you start:
- Device and browser: a computer with a keyboard and a mouse; a wide window, in a browser that can paste images (the automated case runs in Chromium only)
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Logo: green-logo.png from tests/fixtures/ (400 × 400 px, solid pure green), opened in an image viewer and copied with its Copy
- Starting screen: the photo open, on the Export step, with **2000** selected under Size and no logo

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Click **Download** | The question box (the box over the dimmed photo with a question and two or three buttons) asks "Upscale to 2000 px?" |
| 2 | Click **No** | The export runs: a progress line crosses the top edge of the controls |
| 3 | While it runs, click **Overlay** in the step tabs (the six tabs Perspective to Export, in the top bar) | The Overlay step shows |
| 4 | Still while it runs, press Ctrl+V (Cmd+V on a Mac) | No logo is added, and an amber message reads "Wait for the export to finish, then open the photo." |
| 5 | Wait for the export to finish | IMG_9136.JPEG is still the photo open, with no logo |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### DND-04.8 A logo dropped while one is placed takes its place, width and opacity   [auto: desktop]
Before you start:
- Device and browser: a computer with a mouse; a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Logos: blue-disc.png (400 × 400 px, a pure blue disc on a see-through square) and green-logo.png (400 × 400 px, solid pure green) from tests/fixtures/, in a file browser beside the app
- Starting screen: the photo open, on the Overlay step, with no logo

"Change the logo": in the controls (the block of buttons and sliders in the panel at the right), click **Move right** (the right arrow in the left-hand pad) ten times, click **Larger** (**+** in the right-hand pad) three times, then slide the OPACITY slider's knob from the right end to the middle.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Drag blue-disc.png onto the photo area and let go | The blue disc is the logo, in the middle of the photo, a quarter of its width, with OPACITY at 100% |
| 2 | Change the logo | The disc's middle is 55% of the way across the photo (5% of the photo's width right of the middle), it is 28.9% of the photo's width (a quarter, times 1.05 three times), and OPACITY reads about 50% |
| 3 | Drag green-logo.png onto the photo area and let go | The green square is the logo, where the disc was: its middle 55% of the way across, as far down as the disc's, 28.9% of the photo's width, at the same opacity |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## DND-05 A photo arriving while the app is busy is refused

A photo dropped or pasted while an export runs is refused with a warning, **Wait for the export to finish, then open the photo.** A photo dropped while a pair's side is opening is refused with a warning of its own, **Wait for the other side to open, then open the photo.** The case here is a switch; the back's first opening after **Add back** gets the same warning (PAIR-09.5). A logo dropped or pasted on the Overlay step during an export is refused as a photo is (DND-04).

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: 1.10.0
- Anchors: `"Wait for the export to finish, then open the photo."`, `"Wait for the other side to open, then open the photo."`
- Source: `js/app/pair.js` (`receivePhoto`), `js/app/main.js` (`bindPhotoInput`)
- Ruling: R13. While a side is opening the warning reads "Wait for the other side to open, then open the photo." (approved wording, tests/catalog/wording.md); the export wording stays for an export. The app does this since 1.10.0. R32. While an export is running a dropped or pasted logo is refused, with the message a dropped photo gets. The app does this since 1.10.0.
- Cases: 3

### DND-05.1 A photo dropped during an export is refused   [auto: desktop]
Script only
Stand-in: an export here lasts well under a second, too short for a person to drop a file while it runs, so the script holds the export open until the drop has been checked, then lets it finish.

Before you start:
- Device and browser: a computer with a mouse; a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: IMG_9136.JPEG from samples/; IMG_9075.JPEG from samples/ in a file browser beside the app
- Starting screen: IMG_9136.JPEG open, on the Export step, with **2000** selected under Size

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Click **Download** | The question box (the box over the dimmed photo with a question and two or three buttons) asks "Upscale to 2000 px?" |
| 2 | Click **No** | The export runs: a progress line crosses the top edge of the controls |
| 3 | While it runs, drag IMG_9075.JPEG onto the photo area and let go | An amber message reads "Wait for the export to finish, then open the photo." |
| 4 | Wait for the export to finish | IMG_9136.JPEG is still the photo open |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### DND-05.2 A photo pasted during an export is refused   [auto: desktop]
Script only
Stand-in: an export here lasts well under a second, too short for a person to paste while it runs, so the script holds the export open until the paste has been checked, then lets it finish.

Before you start:
- Device and browser: a computer with a keyboard and a mouse; a wide window, in a browser that can paste images (the automated case runs in Chromium only)
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: IMG_9136.JPEG from samples/; IMG_9075.JPEG from samples/, opened in an image viewer and copied with its Copy
- Starting screen: IMG_9136.JPEG open, on the Export step, with **2000** selected under Size

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Click **Download** | The question box (the box over the dimmed photo with a question and two or three buttons) asks "Upscale to 2000 px?" |
| 2 | Click **No** | The export runs: a progress line crosses the top edge of the controls |
| 3 | While it runs, press Ctrl+V (Cmd+V on a Mac) | An amber message reads "Wait for the export to finish, then open the photo." |
| 4 | Wait for the export to finish | IMG_9136.JPEG is still the photo open |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### DND-05.3 A photo dropped while a side is opening gets the side's own warning   [auto: desktop]
Script only
Stand-in: a side opens in well under a second, too short for a person to drop a file while it does, so the script holds the front's opening until the drop has been checked, then lets it finish.

Before you start:
- Device and browser: a computer with a mouse; a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/; IMG_9136.JPEG from samples/ in a file browser beside the app
- Starting screen: the front open, with the back added by **Add back**; the back is open

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Click **Front** in the top bar | The front starts to open: **Front** / **Back** is greyed out while it does |
| 2 | While it opens, drag IMG_9136.JPEG onto the photo area and let go | An amber message reads "Wait for the other side to open, then open the photo." |
| 3 | Wait for the front to open | The front is open; IMG_9136.JPEG replaced neither side |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## DND-06 A file dropped outside the photo is ignored

A file dropped anywhere but the photo area (the side panel, the top bar) shows the no-drop cursor and is ignored: the browser does not open it in place of the app, so the edits are not lost.

- Risk: medium
- Check: script
- Layout: wide. The cases use the wide layout's side panel; whether an iPhone lets a person drag a file into Safari at all is find-out item Q-05.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#panel`, `#topBarHost`
- Source: `js/app/main.js` (`bindStrayDrop`)
- Cases: 1

### DND-06.1 A file dropped outside the photo area is ignored   [auto: desktop]
Before you start:
- Device and browser: a computer with a mouse; a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: IMG_9136.JPEG from samples/; IMG_9075.JPEG from samples/ in a file browser beside the app
- Starting screen: IMG_9136.JPEG open, on the Rotate step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Drag IMG_9075.JPEG over the side panel and let go | The pointer shows the no-drop cursor; nothing opens, and the browser doesn't open the file in place of the app |
| 2 | Drag IMG_9075.JPEG over the top bar and let go | The same: the no-drop cursor, and nothing opens |
| 3 | Look at the app | IMG_9136.JPEG is still open on Rotate, its edits as they were |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.
