# P1Hunt Card Finisher 1.10, phase 4: UAT script

Phase 4 of the 1.10 redesign: Export rebuilt in four rows with its options sheet, Corner shots in a sheet of its own, the progress line, the question card, the edits files in Export's sheet, and the toasts restyled. Run on the dev build, desktop and iPhone: the cases below, then the smoke test. The redesign is released once, after phase 6, so this script has no Live column and no After deploy section.

- **Version under test:** `1.10.0-dev.10` or later. Desktop: the console's first line reads `[card-finisher] v1.10.0-dev.N`. Phone: the line above **Tips** in Export's options sheet.
- **Automated tests first:** `node tests/selftest.js` and `tests/sample-regression.js` must both pass (see `tests/README.md`). Claude runs these, plus the `verify` skill's layout, subfolder and `file://` checks, before handing over a build.
- **IDs** are the permanent IDs from `tests/uat/catalog.md` (`D` Desktop, `P` Phone, `E` Environments, then section.row). 🆕 marks a case for behavior new in this phase; ✏️ a case whose behavior, or the controls its steps go through, changed in this phase. Unmarked rows are connected cases, copied from the catalog unchanged.
- **One row per behavior, on one device.** A behavior is tested once, on the device that can judge it best; the rest is shared out so both devices exercise every feature. Each row is one flow with one verdict.
- **Recording:** mark each row ✅ pass, ❌ fail or ➖ skipped. For a fail, write what happened in Notes; a screenshot helps.

| Tester | Date | Device / browser | Build (commit or "working copy") |
|---|---|---|---|
| Rich | | Desktop Chrome + iPhone Safari | |

---

## Scope

**New in phase 4** (the plan's frame beside its rows):
- **Export in four rows.** Size and Format, one tap each (E1 to E3: P8.1 ✏️, D8.1 ✏️, D8.2 ✏️); the readout, with any note on a second line beside an amber mark, which no longer hides Add back (E4: P8.5 ✏️, and the other two notes, P8.7 ✏️ and P8.19 🆕); Share, Download and Copy; then Add back, Corner shots and, once the edits are exported, Next card in white (E6: P8.3 ✏️, P8.4 ✏️, D8.7 ✏️, D8.8 ✏️). The done message is a white toast (D8.4 ✏️).
- **The plan's note for this phase:** Export's Size and Format row, seven parts in one row, checked at 375 px wide (D8.13 🆕, in the browser's 375 px view, where `localhost` also shows Share and Copy at phone width). If your phone is 375 px wide, P8.1 is the same check of that row on the real thing.
- **Progress.** A thin red line on the top edge of the control area while an export runs, the save buttons dimmed (E5: P8.17 🆕), and on the Corner shots sheet's top edge while it saves (CS4: P9.4 ✏️).
- **Export's options sheet.** Quality, Interpolation, Fill outside photo, the edits files, Reset export settings, the source line and version, and Tips (E11: P8.10 ✏️, P8.18 🆕, D8.14 🆕, D8.11 ✏️, P2.9 ✏️). With it, Export stops scrolling (P1.3 ✏️).
- **Corner shots in its own sheet** (CS1 to CS3, CS5: P9.1 ✏️, P9.3 ✏️, P9.8 🆕, D9.8 ✏️, D9.9 ✏️).
- **On a wide screen** Export's options and Corner shots are both listed in the panel, each under its own heading (DT6: D8.12 🆕, D9.1 ✏️).
- **The question card.** "Upscale to N px?" with Yes in red, No and Cancel, for a single photo (U1: D10.1 ✏️, D10.3 ✏️, P10.1 ✏️), a pair Together (U2: D11.23 ✏️, P11.14 ✏️), a pair Separately (U3: D11.24), and from Corner shots, where the card sits above the open sheet (U4, U5: P10.6 ✏️, D10.9 ✏️, D10.11 ✏️). Unpair's and Open's questions use the same card with two neutral choices (P11.8 ✏️, P11.10 ✏️, D11.21 ✏️).
- **Edits files in Export's sheet.** Save and Load side by side (ED1: P8.9 ✏️); a load is one undo step, with a warning when the file was saved under another name (ED2: D8.15 🆕); the paired hint (ED3: D11.16 ✏️); a file for another size is refused (ED4: D8.16 🆕).
- **Toasts.** A white pill for information, amber with a triangle for a warning, red with a circle for an error, on three lines at most (T1, T2, T4: P1.9 🆕; T3 and the desktop place, DT10: D1.9 🆕). A toast sits just above an open sheet (P9.3 ✏️).
- **A pair on Export.** Together / Separately is a one-tap control beside the readout (D11.7 ✏️, D11.10 ✏️, P11.5 ✏️, P11.7 ✏️), and Copy is hidden for Separately (D11.25 🆕).

**No row:** E10 (an export that fails) and CS6 (a card too small for corner shots). Neither can be produced by hand: the overlay-not-loaded error needs a stub, and corners small enough to fail are invalid first, which turns the save buttons off. The red toast they use is D1.9's and D8.16's.

**Connected:**
- D8.5, D9.10, D10.4, D10.5, D11.14, D11.15 (Share and Copy on desktop): `localhost` counts as secure, so they run now. The phone's are the (HTTPS) rows below.
- E15.1 ✏️ (plain HTTP hides Share and Copy; frames E8 and CS3): the save row and the Corner shots sheet are rebuilt.
- P8.8 ✏️ (the format fallback; frame E9): the message is now a warning toast.
- D10.1, D10.4, D10.5, D10.9 (the Upscale question from Download, Copy, Share and the corner buttons): all callers use the new card. The rest of section 10 runs with them.
- D13.7 to D13.10 and the smoke test's SD10 (edits files: crafted files through Load edits, and the round trip): Load edits and its messages moved.
- D11.7 to D11.25, P11.5 to P11.11, P11.14 (a pair's export, its questions and the output control): the rows that touch the card and Together / Separately.
- P8.5 ✏️ (the Levels note on Export): reworded, and it no longer takes Add back's row.
- D8.10, P8.2 (Resume of an exported photo): Next card moved.
- D8.6, D8.9, P8.6, P8.11 (remembered settings, Next card's picker, the source line): Export's controls are rebuilt around them.
- D9.2 to D9.7, P9.2 (the corner files and thumbnails): they are reached through the new sheet or the panel's section.
- D7.3, D7.12 (the logo in the exported file), held over from phase 3.

**Full run:** triggered, because the redesign touches every module, but the plan puts it at phase 6 (the release script). Not run in this phase.

**(HTTPS) rows:** P7.17, P8.12 to P8.16 (P8.15 is the "Share now" frame, E7), P9.5 to P9.7, P10.7, P10.8, P11.16 to P11.18 and the smoke test's SP14. The phone tests over plain HTTP, so they come marked ➖; they run on the live site after the one release, from phase 6's script.

---

## Setup

UAT runs on the **dev build** before release. GitHub Pages only serves the `release` branch, so there is no HTTPS copy until the release is deployed.

- **Desktop:** in the project folder run `python -m http.server 8765 --bind 0.0.0.0`, then open `http://localhost:8765/index.html` in Chrome, in a window wider than 760 px, with DevTools open on the Console tab. Browsers treat `localhost` as secure, so Share and Copy work on desktop. `SITE` in a row means that address. Have ready from `samples/`: `IMG_9136.JPEG` (PSA slab), `IMG_9060.JPEG` (one-touch on a stand), the pair `14_front_portrait_raw_white.JPEG` + `14_back_…` (a raw portrait card on white) and the pair `13_front_landscape_onetouch_labeled_white.JPEG` + `13_back_…` (a landscape card in a labelled one-touch).
- **Phone:** with the same server running (the PC's Wi-Fi set to Private), open `http://<PC-LAN-address>:8765/index.html` in Safari. First clear the LAN address's website data in Safari's settings (Advanced → Website Data), so no cached build runs; closing the tab isn't enough. Over the LAN, detection runs much slower than on the live site (about 13–20 s on an iPhone instead of under 1 s); wait for "Detecting…" to clear and judge the result, not the speed. Have in Photos: a few of your own card photos (one in a slab, one raw, one 48 MP if you have it) and the 13 and 14 pairs, as full-size originals if you still have them (the sample copies are 3 MP), otherwise AirDropped.
- **(HTTPS) rows:** plain HTTP hides Share and Copy on the phone. Rows whose Test starts with **(HTTPS)** come already marked ➖: skip them before release, and run them on the live site right after deploy (the version script's "After deploy" section).
- **The upscale question:** when a crop is under the chosen Size (every sample photo's is), Download, Share and Copy first ask **Upscale to N px?**, and the corner buttons ask the same. Answer **No** unless the row says otherwise.
- **Safari and Download:** over the LAN, **Download** may show the image in the tab. Go Back and tap **Resume** to carry on; rows don't repeat this.
- **Overlay files:** a transparent PNG logo (a watermark with soft edges is ideal) on both devices; on desktop also a JPG, a WebP, an SVG, a text file renamed to `.png`, a corrupt image, and an image over 5 MB.

---

## 1. Start and layout

Open a photo first: in the catalog these rows follow the rows that open one.

### Desktop
*Setup: no photo open.*

| ID | Test | Steps | Expected | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| D1.9 🆕 | Toast on desktop | With a photo open on Crop, drag the text file renamed to `.png` (from the Overlay files) onto the photo and drop it | A red toast with a circle icon, "Couldn’t read that file as an image.", at the bottom center of the photo, narrower than the photo area and not over the panel; it goes after a few seconds and the open photo stays |  |  |

### Phone
*Setup: no photo open.*

| ID | Test | Steps | Expected | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| P1.3 ✏️ | Every step fits | Tap each of the six tabs in turn | The photo is the same height on every step; the tab you're on is lit; no tab label or button text is cut off; the tab bar clears the home indicator. The control area doesn't scroll on any step |  |  |
| P1.9 🆕 | Toasts | Reload and tap **Resume**; then on Levels tap **Pick black** and tap the card's white border | "Resumed where you left off." in a white pill with black text, gone after about 3 s; then the too-light warning in amber with a triangle, which stays longer. Each sits at the bottom of the photo, just above the control area, on three lines at most with no word cut off |  |  |

---

## 2. Navigation

### Desktop

No cases in this phase.

### Phone
*Setup: a photo open.*

| ID | Test | Steps | Expected | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| P2.9 ✏️ | Every step has its options | On each of the six steps, open the sheet and scroll it | Each opens with that step's title: Perspective options, Rotate options, Crop options, Levels tips, Overlay options, Export options. What each holds is in rows P3.13, P4.5, P5.5, P6.10, P7.19 and P8.10 |  |  |

---

## 7. Overlay

Held over from phase 3: the verdict of these rows is the exported or shared file. On desktop add a logo first (**Add logo** with the PNG).

### Desktop
*Setup: a photo open on Overlay, no logo yet. Overlay's options are listed in the panel under its controls.*

| ID | Test | Steps | Expected | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| D7.3 | SVG stays sharp | **Replace logo** with the SVG, resize it large, export at Original and open the file | The logo's edges are sharp |  |  |
| D7.12 | Export with the logo | Set a semi-transparent logo; export as JPEG, PNG and WebP; open the files | Each is one flat image; the logo matches the preview in place, size, opacity and soft edges (AC8, AC23) |  |  |

### Phone
*Setup: a photo open on Overlay, no logo yet. The PNG logo is in Photos or Files.*

| ID | Test | Steps | Expected | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| P7.17 | (HTTPS) Share with the logo | Set a semi-transparent logo, **Share** → Save Image | The saved photo in Photos includes the logo, matching the preview | ➖ |  |

---

## 8. Export

### Desktop
*Setup: `IMG_9136` straightened and cropped, on Export. Export's options and Corner shots are listed in the panel under Export's controls, each under its own heading.*

| ID | Test | Steps | Expected | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| D8.1 ✏️ | Defaults | In a private window (no remembered settings), open a photo and go to Export | **2000** and **JPEG** are the white parts of the Size and Format controls; the readout shows the size and format |  |  |
| D8.2 ✏️ | Readout follows settings | Click **PNG**, then **1080**, then **JPEG** | One click each, and the readout updates each time; with PNG, Quality leaves the panel's Export options, and it is back with JPEG |  |  |
| D8.3 ✏️ | Not upscaled | Click **2000**, with a crop smaller than 2000 px (any crop of a sample photo is) | The readout says "full crop, not upscaled" |  |  |
| D8.4 ✏️ | Download | Click **Download**, open the file | `<name>-straight.jpg`; its crop, rotation and levels match the screen; a white toast gives the exported size and the time it took |  |  |
| D8.5 | Copy | **Copy**, then paste into another app | A PNG of the result pastes |  |  |
| D8.6 | Settings remembered | Reload and open a new photo | Export format, size and crop preset are remembered |  |  |
| D8.7 ✏️ | Next card after Copy | Open a new photo, go to Export, **Copy** | **Next card →** appears in Export's bottom row, in white, beside **Add back** and **Corner shots** |  |  |
| D8.8 ✏️ | Next card follows Undo | Click another Size, then Ctrl+Z | **Next card →** goes, then is back (the edits match the export again) |  |  |
| D8.9 | Cancel the picker | Click **Next card →**, then cancel the picker | Still on Export with the same photo, and **Next card →** still showing |  |  |
| D8.10 | Resume keeps Next card | Reload, **Resume** | Back on Export with **Next card →** showing |  |  |
| D8.11 ✏️ | Source and version lines | Open `14_front_portrait_raw_white`, go to Export, look under **Reset export settings** in the panel's Export options | A Source line gives the photo as the app received it (its pixel size and megapixels, `image/jpeg`, file size and name, matching the file); under it a muted line reads "Card Finisher" and the version from the logo tooltip |  |  |
| D8.12 🆕 | Options in the panel | Look at the panel under Export's four rows | Two headings, both always open, with no grabber and no sheet: **Corner shots** (section 9) and **Export options**. Export options lists Quality, Interpolation, Fill outside photo, **Save edits** and **Load edits** with their hint, **Reset export settings**, the Source line and the version, then Export's four tips under **Tips and keys** |  |  |
| D8.13 🆕 | Export at 375 px | In DevTools turn on the device toolbar and set the width to 375 px, reload, open a photo, go to Export | Size and Format share one row: all seven parts are whole, none wrapped or cut off, and each takes a click on the first try. Under the readout, **Share** in red, **Download** and **Copy** fit one row with their labels whole; nothing scrolls sideways |  |  |
| D8.14 🆕 | Reset export settings | Click **PNG** and **3000**, set Interpolation to Bicubic and Fill outside photo to Black, then click **Reset export settings** in the panel's Export options | Back to **2000** and **JPEG**, with Quality 92%, Bilinear and White; the readout follows |  |  |
| D8.15 🆕 | Load edits saved under another name | On `IMG_9136` click **Save edits**. Open `IMG_9060` (the same pixel size), go to Export, **Load edits** with that file, then press Ctrl+Z | An amber toast with a triangle: "Edits were saved for “IMG_9136.JPEG”. Applied anyway — sizes match."; the corners, crop and export settings are the saved ones. One Ctrl+Z takes the whole load back |  |  |
| D8.16 🆕 | Edits for another photo | Open `14_front_portrait_raw_white` (a different pixel size), go to Export, **Load edits** with `IMG_9136`'s file | A red toast with a circle: "These edits are for a 1498×2098 photo; this one is 1536×2048."; nothing on the photo changes |  |  |

### Phone
*Setup: a photo straightened and cropped, on Export. Over the LAN the save row holds **Download** alone (E15.1).*

| ID | Test | Steps | Expected | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| P8.1 ✏️ | Size and Format in one tap | Look at the control area, then tap **PNG**, **Original**, and **JPEG** and **2000** again | Four rows, all in view at once, with nothing to scroll and the photo the same height as on Overlay: Size (1080, 2000, 3000, Original) and Format (JPEG, PNG, WebP) in one row; the readout; the save row; **Add back** and **Corner shots**. No label is cut off. Each tap fills that part white at once, with no iOS picker, and the readout follows |  |  |
| P8.2 | Download and back | **Download**; if Safari shows the image, go Back and tap **Resume** | A plain download; the session comes back on Export |  |  |
| P8.3 ✏️ | Next card shows after an export | Open a new photo and go to Export; look; then **Download** | Before: **Add back** and **Corner shots** share the bottom row. After: a white toast gives the exported size and time, and **Next card →** joins the row in white, all three labels whole |  |  |
| P8.4 ✏️ | Hidden after an edit | Tap another Size | **Next card →** goes; **Add back** and **Corner shots** stay where they were |  |  |
| P8.5 ✏️ | A note keeps the row | Leave a Levels change unapplied, go to Export, look, then **Download** | Under the readout, with an amber mark: "Levels has unapplied changes; export uses the applied levels." **Add back** and **Corner shots** stay in the bottom row; after the Download **Next card →** joins them and the note is still there |  |  |
| P8.6 | Next card opens a new photo | Tap **Next card →**, choose a raw card photo | iOS offers Photo Library, Take Photo and Choose File; the photo opens on Perspective with the corners on the card, no levels, and the same crop preset and size as before |  |  |
| P8.7 ✏️ | 48 MP is capped | Open a 48 MP photo, tap **Original**, then **Download** | A note under the readout, with the amber mark, says the output is clamped to the 16.7 MP canvas limit; the file is capped at 16.7 MP |  |  |
| P8.8 ✏️ | WebP falls back | Tap **WebP** and **Download** | A PNG. The toast after it is amber with a triangle: "Exported … WEBP isn’t supported by this browser, so it was saved as PNG.", on three lines at most with no word cut off, and it stays for a few seconds. If Safari saves a `.webp` instead, it encodes WebP now: mark ➖ and say so in Notes |  |  |
| P8.9 ✏️ | Save edits | Tap the grabber to open Export's options sheet, **Save edits** | **Save edits** and **Load edits** sit side by side under an Edits heading, their hint under them; the JSON file downloads |  |  |
| P8.10 ✏️ | Options sheet | Open the options sheet, scroll to its end, tap **Tips** | "Export options": Quality with its slider and %, Interpolation, Fill outside photo, Edits, **Reset export settings**, the Source line, then "Card Finisher" and the version, and **Tips**; the four Export tips unfold in place, with no keyboard keys listed. Corner shots isn't in this sheet |  |  |
| P8.11 | Source line | Open a 12 MP photo from Photos, go to Export, open the options sheet, look above the version line | The Source line gives 3024 × 4032 px (12.2 MP) and `image/jpeg`: the picker keeps every pixel and converts HEIC to JPEG |  |  |
| P8.12 | (HTTPS) Share to Photos | **Share** at 2000 px, then Save Image | The share sheet opens and the image lands in Photos; the app is still on Export with every edit intact | ➖ |  |
| P8.13 | (HTTPS) Cancel sharing | Open a new photo, go to Export, **Share**, then tap outside the sheet | The sheet closes; nothing is saved; no **Next card →** | ➖ |  |
| P8.14 | (HTTPS) Next card after Share | **Share** → Save Image | **Next card →** appears | ➖ |  |
| P8.15 ✏️ | (HTTPS) Share a full-size photo | **Share** at Original with a full-size iPhone photo (12 MP or 48 MP); if the red button reads **Share now** and a toast says to tap it, tap it | Completes without crashing and the image lands in Photos; note how long it took | ➖ |  |
| P8.16 | (HTTPS) Copy | **Copy**, paste into another app | The image pastes | ➖ |  |
| P8.17 🆕 | Progress line | Open a full-size photo (12 MP or more), go to Export, tap **Original**, then **Download** | While it exports, a thin red line grows along the control area's top edge and the save row dims; both clear when the file is saved |  |  |
| P8.18 🆕 | Pickers in the sheet | In the options sheet tap **Interpolation** and choose Bicubic; tap **Fill outside photo** and choose Black; then choose **Custom…**, tap the **Custom color** row that appears under it, and pick a colour | Each row opens an iOS picker: Bilinear and Bicubic; Transparent, White, Black and Custom…. The row then shows the choice (Fill with a swatch of its colour). With Custom… chosen a **Custom color** row shows under Fill; it opens the iOS colour picker and the swatch takes the colour |  |  |
| P8.19 🆕 | Transparent with JPEG | With **JPEG** chosen, set **Fill outside photo** to Transparent, close the sheet, look, then tap **PNG** | Under the readout, with the amber mark: "JPEG has no transparency; empty areas will be white."; with PNG the note goes |  |  |

---

## 9. Corner shots

AC numbers here refer to the Corner Shots Request page in Claude.

### Desktop
*Setup: `14_front_portrait_raw_white` (a raw card: a slab's corners don't make a condition photo), on Export. Corner shots is listed in the panel under its own heading.*

| ID | Test | Steps | Expected | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| D9.1 ✏️ | Corner shots in the panel | In a private window (no remembered settings), open the photo, go to Export, click **Corner shots** | The panel scrolls so the whole **Corner shots** section is in view under its heading: four thumbnails, **4 photos / 1 sheet** with 1 sheet chosen, a readout giving the sheet's size and each corner's in px, **Share corners** in red, **Download corners** and the hint (AC1, AC6, AC9) |  |  |
| D9.2 | 1 sheet download | **Download corners**, open the file | `<name>-corners.jpg`: TL TR over BL BR, a thin divider in the fill colour, no text; the photo runs to all four outer edges, with no border (AC9) |  |  |
| D9.3 | 4 photos download | **4 photos**, **Download corners** | Four files, `-corner-tl`, `-tr`, `-br`, `-bl` (Chrome may ask once to allow several downloads) (AC8) |  |  |
| D9.4 | Labels follow rotate and flip | Turn 90° and flip on Rotate, then download the sheet | Its top-left tile is the main export's top-left corner (AC3) |  |  |
| D9.5 | Same look as the export | Apply Auto levels and a fine tilt, then download the sheet and the main export | Each tile matches the same corner of the main export, tilt and colours included (AC2, AC4) |  |  |
| D9.6 | No overlay | Place a logo over a corner on Overlay, then download the sheet | No tile shows the logo (AC4) |  |  |
| D9.7 | Past the photo's edge | Drag a corner handle to the photo's edge on Perspective, then download the sheet | The area past the photo is the export fill colour (AC5) |  |  |
| D9.8 ✏️ | Not an export | Open a new photo, go to Export, download the corner sheet | A white toast says the corner sheet was saved; no **Next card →** joins Export's bottom row (AC11) |  |  |
| D9.9 ✏️ | Choice remembered | Choose **4 photos**, reload, **Start fresh**, open a photo, go to Export, look at the panel's **Corner shots** section | **4 photos** is still chosen (AC10) |  |  |
| D9.10 | Share four files | **4 photos**, **Share corners** | One share dialog holding four images (AC8) |  |  |

### Phone
*Setup: `14_front_portrait_raw_white` open (the full-size original from Photos if you have it), on Export.*

| ID | Test | Steps | Expected | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| P9.1 ✏️ | Corner shots opens its own sheet | Tap **Corner shots**, look, then tap the photo above the sheet | A sheet titled "Corner shots" rises over the lower part of the photo: four thumbnails, **4 photos / 1 sheet**, a readout, **Download corners** in red across the sheet (no Share over the LAN) and the hint. None of Export's options are in it. The tap on the photo closes it (AC1) |  |  |
| P9.2 | Thumbnails follow edits | Turn 90° on Rotate, then back to Export → **Corner shots** | The thumbnails show the new corners (AC13) |  |  |
| P9.3 ✏️ | 1 sheet Download | **1 sheet**, **Download corners** | The 2×2 sheet downloads; a white toast, "Saved the corner sheet in N s.", sits just above the open sheet, not behind it (AC9) |  |  |
| P9.4 ✏️ | Large photo | Open the largest photo you have (48 MP if you have one), go to Export → **Corner shots**, download the sheet | While it saves, a thin red line grows along the sheet's top edge and **Download corners** dims; it completes without a crash (AC12) |  |  |
| P9.5 | (HTTPS) Share the sheet | **1 sheet**, **Share corners**, Save Image | The sheet lands in Photos (AC9) | ➖ |  |
| P9.6 | (HTTPS) Share four to Photos | **4 photos**, **Share corners**, then Save 4 Images | All four land in Photos (AC8) | ➖ |  |
| P9.7 | (HTTPS) Share now after a slow render | **4 photos** on a full-size photo, **Share corners**; if **Share now** shows, tap it | The share sheet opens with four images (AC8) | ➖ |  |
| P9.8 🆕 | 4 photos in the sheet | In the Corner shots sheet tap **4 photos**, close the sheet with ✕, then tap **Corner shots** again | The readout changes from the sheet's size to "4 photos" and each photo's size in px; reopened, **4 photos** is still chosen |  |  |

---

## 10. Upscale question

### Desktop
*Setup: `14_front_portrait_raw_white` on Export at JPEG, 2000; its crop is under 2000 px, so the readout says "full crop, not upscaled".*

| ID | Test | Steps | Expected | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| D10.1 ✏️ | Download asks | Click **Download** | A card centered over the dimmed photo: **Upscale to 2000 px?**, "The crop is W × H px at the photo's resolution.", **Yes** in red, **No** and **Cancel**; the panel beside it stays readable |  |  |
| D10.2 | Yes upscales the export | **Yes**, open the file | The long edge is exactly 2000 px, visibly crisper than the real-size export at 100 %, with no bright or dark rim along the card's edge; the toast gives the 2000 px size; **Next card →** shows |  |  |
| D10.3 ✏️ | No and Cancel | **Download**, **No**; **Download**, **Cancel**; then **Download** and click the dimmed photo outside the card | No saves the file at the readout's size; Cancel and the click outside each close the card, and nothing downloads |  |  |
| D10.4 | Copy asks too | **Copy**, **Yes**, paste into another app | The same card; a PNG with a 2000 px long edge pastes |  |  |
| D10.5 | Share asks too | **Share**, **Yes** | The same card; the share dialog gets the 2000 px file |  |  |
| D10.6 ✏️ | Follows the Size | Click **3000**, **Download** | The card says **Upscale to 3000 px?**; **Yes** gives a 3000 px long edge |  |  |
| D10.7 ✏️ | No card when it isn't needed | Click **Original**, **Download**; then click a Size smaller than the crop's long edge (the readout no longer says "not upscaled"), **Download** | No card either time; the files are the full crop, then the chosen Size on the long edge |  |  |
| D10.8 ✏️ | The card stays through a resize | **Download** at 2000, then resize the window | The card stays up; **Yes** still exports |  |  |
| D10.9 ✏️ | Corners ask too | In the panel's Corner shots section click **Download corners** | The same kind of card: **Upscale to 2000 px?** with the line "The sheet is N px at the photo's resolution." |  |  |
| D10.10 | Yes upscales the sheet | **Yes**, open the file | The sheet is exactly 2000 px square, visibly crisper than the real-size sheet at 100 %, with no rim along the card's edge |  |  |
| D10.11 ✏️ | 4 photos upscale each | **4 photos**, **Download corners**, look, then **Yes** | The card's line names each corner's size ("Each corner is N px at the photo's resolution."); four files, each 2000 px square |  |  |
| D10.12 | No corner card at the target | Open `SITE?cornerShots.upscaleTargetPx=100`, open a photo, **Download corners** | No card; the sheet downloads at the real size |  |  |
| D10.13 | Sharpening can be turned off | Open `SITE?upscale.sharpenAmount=0`, open the photo, **Download**, **Yes** | A 2000 px file that is softer than D10.2's at 100 % |  |  |

### Phone
*Setup: a photo whose crop is under 2000 px (the readout says "full crop, not upscaled"; `14_front_portrait_raw_white` AirDropped always is), on Export.*

| ID | Test | Steps | Expected | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| P10.1 ✏️ | Download asks | **Download**, then tap the dimmed photo outside the card | A card over the dimmed photo: **Upscale to 2000 px?**, the crop's real size, **Yes** in red, **No** and **Cancel**; the control area below doesn't move. The tap outside closes it and nothing is saved |  |  |
| P10.2 | Yes upscales the export | **Download**, **Yes** | Completes without a crash; the toast gives a 2000 px size; note the time |  |  |
| P10.3 | The export is crisp | Save that image to Photos and look at it at 100 % | A 2000 px long edge, crisper than the real-size export, no rim along the card's edge |  |  |
| P10.4 | No keeps the real size | **Download**, **No** | The file is the readout's size |  |  |
| P10.5 | Rotating keeps the card | **Download**, turn the phone sideways and back | The card stays up; **Yes** still exports |  |  |
| P10.6 ✏️ | Corners: Yes | Tap **Corner shots**, **Download corners**, look, then **Yes** | The card sits above the open Corner shots sheet, whole and readable, and gives the sheet's real size; Yes completes without a crash and the sheet is 2000 px square and crisp; note the time |  |  |
| P10.7 | (HTTPS) Share asks too | **Share**, **Yes**, Save Image | The same card; the 2000 px image lands in Photos | ➖ |  |
| P10.8 | (HTTPS) Copy asks too | **Copy**, **Yes**, paste into another app | The same card; a 2000 px image pastes | ➖ |  |

---

## 11. Front and back

AC numbers here refer to the Front + Back Pairing page in Claude. These rows are taken out of the catalog's sequence, so on each device pair the 14 photos first (open the front, Export → **Add back**, choose the back). On the phone, P11.5's "**Swap** back" has nothing to swap: skip it. D11.18 and D11.22 aren't phase 4 cases; they are here so the rows after them start from the right place.

### Desktop
*Setup: the 14 pair (`14_front_portrait_raw_white`, `14_back_portrait_raw_white`), `13_front_landscape_onetouch_labeled_white` as a third photo, and a transparent PNG logo.*

| ID | Test | Steps | Expected | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| D11.7 ✏️ | Output control and preview | Go to Export | A two-part **Together / Separately** control beside the readout, Together in white; the readout gives the joined image's size and the format; no **Add back** in the bottom row; the photo area shows both cards, front on the left, a thin line in the fill colour between them, no border (AC10, AC11, AC13) |  |  |
| D11.8 | Together download | **Download**, open the file | One `<front>-pair.jpg` at the readout's size, matching the preview (AC11) |  |  |
| D11.9 | Landscape stacks | On Crop, **Swap**; on Export, **Download** | The front is on top and the back below (AC11) |  |  |
| D11.10 ✏️ | Separately | **Swap** back. Click **Separately**, **Download**, open both files | `<front>-front.jpg` and `<back>-back.jpg` (Chrome may ask once to allow several downloads), each with its side's framing and levels as on screen (AC12) |  |  |
| D11.11 | Logo on one side only | Add a logo on the back's Overlay step; choose Together; **Download** | The logo is on the back's half only (AC11) |  |  |
| D11.12 | Format applies to both | Choose PNG on the back, click **Front**, go to Export | PNG is chosen there too (AC10) |  |  |
| D11.13 | Next card follows both sides | Choose JPEG, **Download**; then click **Back**, drag the Straighten ruler on Rotate, go to Export | **Next card →** shows after the Download, and is gone after the edit to the other side (AC16) |  |  |
| D11.14 | Copy the Together image | **Copy**, paste into another app | The joined image pastes (AC14) |  |  |
| D11.15 | Share both files | Choose Separately, **Share** | One share dialog holding both images (AC14) |  |  |
| D11.16 ✏️ | Save edits saves this side | In the panel's Export options, read the hint under **Save edits** and **Load edits**, then **Save edits** | The hint starts "Saves the side you're on."; the file is the back's (AC20) |  |  |
| D11.17 | Keep front | On the back, click the Unpair icon, **Keep front**, then go to Crop | The front, as a single photo framed 5:7; **Front / Back** and the Unpair icon are gone from the top bar; every preset can be picked again (AC6) |  |  |
| D11.18 | Remembered preset unchanged | Open a new photo, go to Crop | It starts at the preset you used before pairing, not 5:7 (AC7) |  |  |
| D11.19 | Replace the side | Pair the 14 photos again, **Open** `13_front_landscape_onetouch_labeled_white`, **Replace back** | The third photo is now the back; the front is unchanged (AC17) |  |  |
| D11.20 | New photo ends the pair | **Open** another photo, **New photo** | It opens as a single photo; no **Front / Back** in the top bar (AC17) |  |  |
| D11.21 ✏️ | Drop asks | Pair again, drag a photo onto the photo area | A card over the dimmed photo, titled **New photo**, asks **New photo · Replace back · Cancel**, neither choice in red (AC17) |  |  |
| D11.22 | Drop on Overlay adds a logo | **Cancel**. On Overlay, drag a PNG onto the photo | It becomes the logo, with no question (AC17) |  |  |
| D11.23 ✏️ | Upscale: Together | Choose Together and **2000**, **Download**, **Yes**, open the file | The card says "The image is W × H px at the photos' resolution."; the file's long edge is exactly 2000 px, both sides enlarged alike with the gutter between them |  |  |
| D11.24 | Upscale: Separately | Choose Separately, **Download**, **Yes** | The card gives both sides' sizes; `-front` and `-back` each have a 2000 px long edge |  |  |
| D11.25 🆕 | Copy hides for Separately | With **Separately** chosen, look at the save row, then click **Together** | Separately: **Share** and **Download** only, with no **Copy** (a clipboard holds one image). Together: **Copy** is back |  |  |

### Phone
*Setup: in Photos, the 14 pair (a raw card's front and back) and the 13 pair (a landscape card), full-size originals if you have them, else the AirDropped copies.*

| ID | Test | Steps | Expected | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| P11.5 ✏️ | Export fits | **Swap** back. Go to Export | The Size and Format row as for a single photo; a two-part **Together / Separately** control beside the readout, Together in white, with both labels and the readout whole; no **Add back**, so **Corner shots** has the bottom row; the photo area shows the joined image, front on the left, the same height as on other steps (AC10, AC13) |  |  |
| P11.6 | Together Download | **Download** | One joined image, `<front>-pair` (AC11) |  |  |
| P11.7 ✏️ | Separately Download | Tap **Separately**, **Download** | Note whether both files arrive; Safari may show only the first (AC12) |  |  |
| P11.8 ✏️ | Unpair asks on a card | Tap the Unpair icon beside **Front / Back**, then tap the dimmed photo outside the card | A card over the dimmed photo, titled **Unpair**, asks **Keep front · Keep back · Cancel**, with neither choice in red; the controls below don't move; the tap outside closes it, still paired (AC6) |  |  |
| P11.9 | Keep the back | Tap the Unpair icon, **Keep back** | The back, as a single photo; **Front / Back** is gone from the top bar (AC6) |  |  |
| P11.10 ✏️ | Open asks | Pair the 14 photos again, **Open** `13_front_landscape_onetouch_labeled_white` | A card over the dimmed photo, titled **New photo**, asks **New photo · Replace back · Cancel**, with neither choice in red (AC17) |  |  |
| P11.11 | Next card after the pair's export | **Cancel**, **Download**, then **Next card →**, choose a photo | It opens as a single photo without asking (AC16) |  |  |
| P11.14 ✏️ | Upscale: Together | Pair the 14 photos, choose Together and **2000**, **Download**, **Yes** | The card asks **Upscale to 2000 px?**, **Yes** in red, with the joined image's size; Yes completes without a crash; note the time |  |  |
| P11.16 | (HTTPS) Share Together to Photos | Choose Together, **Share**, Save Image | The joined image lands in Photos (AC14) | ➖ |  |
| P11.17 | (HTTPS) Share both sides | Choose Separately, **Share**, Save 2 Images | Both land in Photos (AC14) | ➖ |  |
| P11.18 | (HTTPS) Share now after a slow render | At Original size, **Share**; if **Share now** shows, tap it | The share sheet opens with the pair's files (AC14) | ➖ |  |

---

## 13. Security

### Desktop
*Setup: DevTools open on the Console tab. These use harmless test text. The safe ranges themselves are tested by `tests/selftest.js`; these rows check the app acts on them.*

| ID | Test | Steps | Expected | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| D13.7 | A crafted edits file is cleaned | **Save edits**, change `"format": "jpeg"` to `"format": "<b>x</b>"` in a text editor, **Load edits** | A notice says some settings were reset (export); the readout shows JPEG, no bold text |  |  |
| D13.8 | Oversized edits file | With a photo open, **Load edits** with `tests/uat/edits-over-8mb.json` | A red message says the file is too large to be an edits file |  |  |
| D13.9 | Malformed photo size | In a saved edits file change `"width"` to `"abc"`, **Load edits** | A red message: "That isn't a Card Finisher edits file." |  |  |
| D13.10 | Malformed crop | Change the whole `"crop": { … }` to `"crop": "x"`, **Load edits** | The edits load with a notice that crop was reset |  |  |

### Phone

No cases in this phase.

---

## 15. Environments

| ID | Test | Steps | Expected | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| E15.1 ✏️ | Plain HTTP hides Share and Copy | On the phone, open the LAN address (`http://<PC-LAN-address>:8765`), finish a photo, look at Export's save row, then tap **Corner shots** | No Share or Copy button, on Export or in the Corner shots sheet, and no gap or greyed button where they would be; **Download** on Export and **Download corners** in the sheet are the red buttons, each across its row |  |  |

---

## Smoke test

Run on both devices after the sections above. Copied from `tests/uat/smoke.md`. ✏️ marks the rows whose steps go through Export's new controls, the Corner shots sheet or the pair's output control. There is no Live column: the redesign is released once, after phase 6.

### Desktop
*Setup: Chrome with DevTools open on the Console tab, in a window wider than 760 px. The 14 pair from `samples/` (`14_front_portrait_raw_white`, `14_back_portrait_raw_white`) and a transparent PNG logo to hand. When a Download or Copy asks **Upscale to 2000 px?**, answer **No**.*

| ID | Test | Steps | Expected | Pre-release (dev.10) | Notes |
|---|---|---|---|---|---|
| SD1 | Right build | Open the page; look at the tab, the console and the logo's tooltip | The tab shows the P1 icon; the console's version line and the tooltip read the version under test (`-dev` pre-release) |  |  |
| SD2 | Drop and detect | Drag `14_front_portrait_raw_white` onto the page | It loads with four corners on or near the card |  |  |
| SD3 | Corner by mouse and keys | Drag a corner onto the card's corner, press an arrow key twice, then Ctrl+Z | The loupe sits up-right of the cursor and the Result preview updates; the keys nudge the handle; Ctrl+Z moves it back |  |  |
| SD4 | Rotate | Press 2, click the angle and type `1.5`, then Enter | Rotate opens; the photo turns 1.5°, with a grid |  |  |
| SD5 | Crop | Press 3, click 5:4 | The chip reads 4:5 and the box is portrait (it follows the card) |  |  |
| SD6 | Levels | Press 4, **Auto**, hold **C**, then **Apply** | The colors adjust; C shows the photo without levels; Apply clears the dot |  |  |
| SD7 | Overlay | Press 5, **Add logo** with the PNG, click the bottom-right ring | The logo snaps to the bottom-right corner, inside the photo |  |  |
| SD8 ✏️ | Download | Press 6, **Download**, open the file | `<name>-straight.jpg`; the crop, rotation, levels and logo match the screen; **Next card →** joins Export's bottom row in white |  |  |
| SD9 | Copy | **Copy**, paste into another app | The image pastes |  |  |
| SD10 ✏️ | Edits round trip | In the panel's Export options, **Save edits**; reload, **Start fresh**; open the same photo, go to Export, **Load edits**, **Download** | The second file looks identical to SD8's, logo included |  |  |
| SD11 | Add back | **Add back**, choose `14_back_portrait_raw_white` | It opens on Perspective; the top bar shows **Front / Back** with Back lit, and the Unpair icon beside it |  |  |
| SD12 ✏️ | Pair export | Go to Export, look at the photo area; click **Separately** beside the readout, **Download** | The preview joins both cards, front on the left; **Copy** leaves the save row; two files arrive, `-front` (with the logo) and `-back` |  |  |
| SD13 ✏️ | Corner shots | In the panel's **Corner shots** section click **4 photos**, **Download corners** | Four close-up files, `-corner-tl`, `-tr`, `-br`, `-bl`, with no logo |  |  |
| SD14 | Resume the pair | Reload, **Resume** | The prompt names both photos; both sides come back, on the side and step you left |  |  |
| SD15 | Narrow window | Narrow the window below 760 px, then widen it | The tab bar at the bottom replaces the top bar's step pill; widening brings the pill back |  |  |
| SD16 | Clean console | Look at the console | No red errors (CSP or otherwise) from the whole pass |  |  |

### Phone
*Setup: iPhone Safari; clear the LAN address's website data in Safari's settings (Advanced → Website Data) first, so no cached build runs. In Photos: a slabbed card's front and back, shot the same way up. A logo saved from an earlier run (or a PNG to upload). If Safari shows a downloaded image in the tab, go Back and tap **Resume**.*

| ID | Test | Steps | Expected | Pre-release (dev.10) | Notes |
|---|---|---|---|---|---|
| SP1 | Open and detect | **Open**, choose the slab's front | It loads and the corners sit on the card; top bar, photo, control area and tab bar, with nothing over the photo and no button text cut off |  |  |
| SP2 | Long-press and drag | Press and hold a corner for 2 s, then drag it | No iOS magnifier or callout; the loupe pins to the top corner away from your finger |  |  |
| SP3 | Nudge and Undo | Tap ▶ twice, then Undo | The handle moves and the loupe stays up; one Undo takes both taps back |  |  |
| SP4 | Tab bar and Rotate | Tap **Rotate** in the tab bar, drag the Straighten ruler | Rotate opens, its tab lit; the photo rotates, with a grid |  |  |
| SP5 | Crop | Tap **Crop** in the tab bar, swipe the preset row, tap 5:4 | The chip reads 4:5 and the box is portrait; the photo is the same height as on Rotate |  |  |
| SP6 | Levels | Tap **Levels**, **Auto**, press and hold the photo, then **Apply** | The colors adjust; the hold shows the photo without levels, with no magnifier; Apply clears the dot |  |  |
| SP7 | Overlay | Tap **Overlay**, **Use saved overlay** (or **Add logo**), pinch on the logo, tap the bottom-right ring | The logo resizes while the photo stays still, then snaps to the corner |  |  |
| SP8 ✏️ | Right build | Tap **Export**, tap the grabber to open its options sheet, scroll to its end | Export's four rows fit the control area with nothing cut off. In the sheet the line above **Tips** reads the version under test (`-dev` pre-release); the Source line above it gives the photo's real pixel size |  |  |
| SP9 ✏️ | Download with upscale | Close the sheet with **✕**, **Download**; if a card asks **Upscale to 2000 px?**, tap **Yes** | The image has the crop, levels and logo as on screen; no crash |  |  |
| SP10 ✏️ | Next card | Look at Export's bottom row (after Back and **Resume** if Safari showed the image) | On Export with every edit intact; **Next card →** sits in white beside **Add back** and **Corner shots** |  |  |
| SP11 | Add back | **Add back**, choose the slab's back | It opens on Perspective with corners on the card; the top bar fits **Front / Back** and the Unpair icon in one row |  |  |
| SP12 ✏️ | Corner sheet | Go to Export, tap **Corner shots**, **1 sheet**, **Download corners** (answer **No** if asked) | The Corner shots sheet opens over the lower part of the photo; a 2×2 sheet of this side's corners downloads, with no logo, and the toast that says so sits above the sheet |  |  |
| SP13 ✏️ | Pair preview and Download | Drag the sheet down to close it; with **Together** white beside the readout, **Download** (answer **No** if asked) | The photo area shows both sides, front first; one joined image downloads, the logo on the front only |  |  |
| SP14 | (HTTPS) Share to Photos | **Share** → Save Image, then open it in Photos | The joined image is in Photos and matches the screen; Safari is still on Export with every edit intact | ➖ |  |
| SP15 | Resume after closing | Swipe Safari away, reopen the page, **Resume** | The prompt names both photos; both sides and their edits come back |  |  |
| SP16 | Unpair | Tap the Unpair icon, **Keep front** | A card over the dimmed photo asks which side to keep; the front stays as a single photo with its edits |  |  |

---

## Sign-off

| Area | Desktop | Phone | Blocking issues |
|---|---|---|---|
| 1. Start and layout |  |  | |
| 2. Navigation | ➖ |  | |
| 7. Overlay |  | ➖ | |
| 8. Export |  |  | |
| 9. Corner shots |  |  | |
| 10. Upscale question |  |  | |
| 11. Front and back |  |  | |
| 13. Security |  | ➖ | |
| 15. Environments | ➖ |  | |
| Smoke test (pre-release) | | | |

**Decision (phase 4, 1.10.0-dev.N, date):** ☐ Phase 4 passed, start phase 5 ☐ Fix first

**Previous: phase 3 (1.10.0-dev.9):** passed.
