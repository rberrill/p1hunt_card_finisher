# Save edits and Load edits

Saving a photo's edits to a small file and loading them back onto the same photo, including what the file holds, what is refused, and how older files and pairs are handled.

The edits files and logos these cases load are in `tests/fixtures/`. Each was saved from the app and, where a case says so, changed in a text editor; the case quotes the change.

## EDT-01 Save edits

**Save edits** downloads the photo's edits as a readable JSON file named after the photo with **-edits.json** added.

- Risk: high
- Check: script, saved file; phone (Safari's download of the file)
- Layout: both. On a phone the button is in Export's options sheet, opened from the tab with the up arrow above the controls; on a wide screen it is listed in the side panel.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnSaveEdits`, "Save edits", "-edits.json"
- Source: `js/app/export.js` (`saveEdits`, `exportBaseName`), `js/app/export-controls.js` (`buildEditsGroup`, `bindExport`)
- Cases: 2

### EDT-01.1 Save edits saves a readable file named for the photo   [auto: phone, webkit]
Before you start:
- Device and browser: any; a phone-width or a wide window, with downloads saved to a folder you can open
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/ (1498 × 2098 px)
- Starting screen: the photo open, on the Rotate step

The named actions:
- Open Export options: on a phone, tap the options tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls.
- Close Export options: on a phone, tap the **×** at their top right; on a wide screen there is nothing to close.
- Save the edits: open Export options, tap **Save edits**, then close Export options.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **90° right** | The photo turns a quarter clockwise |
| 2 | Tap **Export** in the step tabs (the six tabs Perspective to Export: along the bottom on a phone, in the top bar on a wide screen) | The Export step shows, with **Download** |
| 3 | Save the edits | A file named IMG_9136-edits.json is saved |
| 4 | Open the file in a text editor | It is plain text, one setting to a line, and its first setting reads `"version": 2` |
| 5 | Find `"source"` in the file | Under it: `"name": "IMG_9136.JPEG"`, `"width": 1498` and `"height": 2098` |
| 6 | Find `"rotation"` in the file | Under it: `"quarter": 1` |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot, and the edits file.

### EDT-01.2 On an iPhone, Save edits puts the file in Files   [phone]
Before you start:
- Device and browser: an iPhone, Safari
- Build: the build under test at the UAT site, https://rberrill.github.io/p1hunt_card_finisher_uat/
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/ (AirDrop it to the phone or save it to Photos first)
- Starting screen: the photo open, on the Export step

Safari keeps downloads in the Files app, in the folder Settings › Safari › Downloads names (Downloads, unless it was changed).

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap the options tab (the small tab with an up arrow on the top edge of the controls) | Export options rise, with **Save edits** and **Load edits** |
| 2 | Tap **Save edits** | Safari asks whether to download IMG_9136-edits.json |
| 3 | Tap **Download** in Safari's question | Safari's question goes; the photo is still open on the Export step, with Export options up |
| 4 | Open the Files app, then Safari's downloads folder | IMG_9136-edits.json is there |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot (press the side button and volume up together).

## EDT-02 The logo travels in the file

When a logo is placed and loaded, the edits file holds the logo image itself.

- Risk: medium
- Check: script, saved file
- Layout: both. No difference.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnSaveEdits`, `#btnOverlayAdd`
- Source: `js/app/export.js` (`saveEdits`), `js/app/overlay.js` (`overlayForEdits`)
- Cases: 1

### EDT-02.1 The edits file holds the logo picture itself   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window, with downloads saved to a folder you can open
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Logo: green-logo.png from tests/fixtures/ (400 × 400 px, solid pure green)
- Starting screen: the photo open, on the Overlay step

The named actions:
- Open Export options: on a phone, tap the options tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls.
- Close Export options: on a phone, tap the **×** at their top right; on a wide screen there is nothing to close.
- Save the edits: open Export options, tap **Save edits**, then close Export options.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Add logo** and choose green-logo.png | The green square shows on the photo |
| 2 | Tap **Export** in the step tabs (the six tabs Perspective to Export: along the bottom on a phone, in the top bar on a wide screen) | The Export step shows, with the green square on the photo |
| 3 | Save the edits | A file named IMG_9136-edits.json is saved |
| 4 | Find `"overlayImage"` near the end of the file, opened in a text editor | It names green-logo.png, of the type image/png, and holds the logo's bytes as a long run of letters and digits (base64) that decodes to green-logo.png exactly |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot, and the edits file.

## EDT-03 What the file leaves out

The edits file does not hold the photo, unapplied Levels changes, the Together / Separately choice, the corner-shots output choice, or a pair and its other side.

- Risk: low
- Check: script, saved file
- Layout: both. No difference.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnSaveEdits`, `#pairOutput`, `#cornerOutput`
- Source: `js/app/export.js` (`saveEdits`), `js/app/adapters.js` (`Prefs.save`)
- Cases: 2

### EDT-03.1 The file leaves out the photo, unapplied levels and the corner-shots choice   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window, with downloads saved to a folder you can open
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Levels step, with no levels set

The named actions:
- Open Export options: on a phone, tap the options tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls.
- Close Export options: on a phone, tap the **×** at their top right; on a wide screen there is nothing to close.
- Save the edits: open Export options, tap **Save edits**, then close Export options.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Auto** | The photo brightens; a white dot shows on the **Levels** tab: the levels wait for **Apply** |
| 2 | Tap **Export** in the step tabs (the six tabs Perspective to Export: along the bottom on a phone, in the top bar on a wide screen) | The Export step shows, with **Corner shots** |
| 3 | Tap **Corner shots** | Corner shots shows **4 photos** and **1 sheet** (on a phone, in a sheet that rises over the photo) |
| 4 | Tap **4 photos** | **4 photos** is selected (a solid white fill) |
| 5 | Close Corner shots: on a phone, tap the **×** at its top right; on a wide screen there is nothing to close | The Export step's **Download** shows (on a phone, the Corner shots sheet has gone) |
| 6 | Save the edits | A file named IMG_9136-edits.json is saved, under 10 KB: the photo is not in it |
| 7 | Find the levels line in the file, opened in a text editor | It reads `"levels": null`: the unapplied levels are not in it |
| 8 | Search the file for the word photos | It is nowhere in the file: the corner-shots choice is not in it |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot, and the edits file.

### EDT-03.2 In a pair the file leaves out the other side and Together or Separately   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window, with downloads saved to a folder you can open
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: the front open, with the back added by **Add back** on the Export step; the back is open

The named actions:
- Open Export options: on a phone, tap the options tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls.
- Close Export options: on a phone, tap the **×** at their top right; on a wide screen there is nothing to close.
- Save the edits: open Export options, tap **Save edits**, then close Export options.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Export** in the step tabs (the six tabs Perspective to Export: along the bottom on a phone, in the top bar on a wide screen) | The Export step shows **Together** and **Separately** beside the size line |
| 2 | Tap **Separately** | **Separately** is selected |
| 3 | Save the edits | A file named 14_back_portrait_raw_white-edits.json is saved |
| 4 | Search the file for the words front, separately, together and pair | None of them is in the file: neither the other side nor the choice is in it |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot, and the edits file.

## EDT-04 Load edits

**Load edits** opens a file picker for a .json file.

- Risk: high
- Check: script; phone (choosing the file from Files on an iPhone)
- Layout: both. On a phone the button is in Export's options sheet; on a wide screen it is listed in the side panel.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnLoadEdits`, `#editsInput`, "Load edits"
- Source: `js/app/export-controls.js` (`buildEditsGroup`, `bindExport`), `js/app/shell.js` (`syncUI`)
- Ruling: R17. While an export runs, Load edits is dimmed with the save buttons (as are Size, Format, the options sheet's settings, Undo, Redo and Add back); the tab bar stays live. The app differs today.
- Cases: 3

### EDT-04.1 Load edits opens a picker for one .json file and applies it   [auto: phone, webkit]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Rotate step

The named actions:
- Open Export options: on a phone, tap the options tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls.
- Close Export options: on a phone, tap the **×** at their top right; on a wide screen there is nothing to close.
- Save the edits: open Export options, tap **Save edits**, then close Export options.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **90° right** | The photo turns a quarter clockwise |
| 2 | Tap **Export** in the step tabs (the six tabs Perspective to Export: along the bottom on a phone, in the top bar on a wide screen) | The Export step shows |
| 3 | Save the edits | A file named IMG_9136-edits.json is saved |
| 4 | Tap **Undo** (the arrow curving left, at the top right) | The photo is upright again |
| 5 | Open Export options | **Load edits** shows |
| 6 | Tap **Load edits** | A file picker opens for one file, offering only .json files |
| 7 | Choose IMG_9136-edits.json | The photo turns a quarter clockwise again |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### EDT-04.2 While an export runs, Load edits is dimmed and the step tabs stay live   [auto: phone]
Script only
Stand-in: an export here lasts well under a second, too short for a person to look at the controls while it runs, so the script records them at the moment the export starts.
Written to ruling R17; it fails until that is built (BUG-013).

Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Download** | The question box (the box over the dimmed photo with a question and two or three buttons) asks "Upscale to 2000 px?" |
| 2 | Tap **No** | The export runs: a progress line crosses the top edge of the controls |
| 3 | Look at the step tabs (the six tabs Perspective to Export) as the export starts | They are live, none greyed out |
| 4 | Look at **Load edits** in Export options as the export starts | **Load edits** is greyed out |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### EDT-04.3 On an iPhone, Load edits takes an edits file from Files   [phone]
Before you start:
- Device and browser: an iPhone, Safari
- Build: the build under test at the UAT site, https://rberrill.github.io/p1hunt_card_finisher_uat/
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/ (AirDrop it to the phone or save it to Photos first)
- Edits file: IMG_9136-turned-edits.json from tests/fixtures/ (IMG_9136.JPEG's edits after **90° right**), saved in the iPhone's Files app first, in a folder you will find again
- Starting screen: the photo open, upright, on the Export step

Find the edits file: in what the iPhone offers, choose to browse files (not the photo library), then open the folder IMG_9136-turned-edits.json was saved in.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap the options tab (the small tab with an up arrow on the top edge of the controls) | Export options rise, with **Load edits** |
| 2 | Tap **Load edits** | The iPhone offers where to choose a file from |
| 3 | Find the edits file | IMG_9136-turned-edits.json is listed, not greyed out |
| 4 | Tap IMG_9136-turned-edits.json | The file browser closes, and the photo is turned a quarter clockwise |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot (press the side button and volume up together).

## EDT-05 Files that are not edits files

A file over 8 MB, a file that is not JSON, and a JSON file that is not an edits file (it needs version 1 or 2, the photo's size and the corners) are refused with an error message, and nothing changes.

- Risk: medium
- Check: script
- Layout: both. No difference.
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.export.editsMaxBytes`, "That file is too large to be a Card Finisher edits file.", "That file isn’t valid JSON.", "That isn’t a Card Finisher edits file."
- Source: `js/app/export.js` (`loadEdits`, `looksLikeEdits`)
- Cases: 3

### EDT-05.1 A file over 8 MB is refused before it is read   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Edits file: IMG_9136-large-edits.json, made from IMG_9136-turned-edits.json in tests/fixtures/ (this photo's edits after **90° right**): in a text editor, add spaces after its last closing brace until the file is larger than 8 MB (8,388,608 bytes); it is still valid JSON. It is too large to keep with the fixtures; the script makes its own copy the same way
- Starting screen: the photo open, upright, on the Export step, with **Undo** (the arrow curving left, at the top right) and **Redo** (the arrow curving right) both greyed out

The named actions:
- Open Export options: on a phone, tap the options tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls.
- Close Export options: on a phone, tap the **×** at their top right; on a wide screen there is nothing to close.
- Load the edits file F: open Export options, tap **Load edits**, choose F in the file picker, then close Export options.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Load the edits file IMG_9136-large-edits.json | A red message reads "That file is too large to be a Card Finisher edits file." |
| 2 | Look at the photo, **Undo** and **Redo** | Nothing has changed: the photo is upright, and **Undo** and **Redo** are still greyed out |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### EDT-05.2 A file that isn't JSON is refused   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- File: notes.json from tests/fixtures/: one line of plain text, "These are notes, not edits."
- Starting screen: the photo open, upright, on the Export step, with **Undo** (the arrow curving left, at the top right) and **Redo** (the arrow curving right) both greyed out

The named actions:
- Open Export options: on a phone, tap the options tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls.
- Close Export options: on a phone, tap the **×** at their top right; on a wide screen there is nothing to close.
- Load the edits file F: open Export options, tap **Load edits**, choose F in the file picker, then close Export options.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Load the edits file notes.json | A red message reads "That file isn’t valid JSON." |
| 2 | Look at the photo, **Undo** and **Redo** | Nothing has changed: the photo is upright, and **Undo** and **Redo** are still greyed out |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### EDT-05.3 JSON that isn't an edits file is refused   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Files, from tests/fixtures/, each IMG_9136-turned-edits.json (this photo's edits after **90° right**) changed in a text editor: IMG_9136-version-3-edits.json (`"version": 2` changed to `"version": 3`); IMG_9136-no-corners-edits.json (the `"corners"` setting and its four pairs of numbers taken out); IMG_9136-width-as-text-edits.json (`"width": 1498` changed to `"width": "1498"`)
- Starting screen: the photo open, upright, on the Export step, with **Undo** (the arrow curving left, at the top right) and **Redo** (the arrow curving right) both greyed out

The named actions:
- Open Export options: on a phone, tap the options tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls.
- Close Export options: on a phone, tap the **×** at their top right; on a wide screen there is nothing to close.
- Load the edits file F: open Export options, tap **Load edits**, choose F in the file picker, then close Export options.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Load the edits file IMG_9136-version-3-edits.json | A red message reads "That isn’t a Card Finisher edits file."; the photo is still upright, and **Undo** and **Redo** still greyed out |
| 2 | Load the edits file IMG_9136-no-corners-edits.json | The same red message shows again; the photo is still upright, and **Undo** and **Redo** still greyed out |
| 3 | Load the edits file IMG_9136-width-as-text-edits.json | The same red message shows again; the photo is still upright, and **Undo** and **Redo** still greyed out |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## EDT-06 Edits for a photo of another size

Edits saved for a photo whose pixel size differs from the open photo's are refused with an error message naming both sizes.

- Risk: medium
- Check: script
- Layout: both. No difference.
- Added: 1.10 baseline
- Changed: none
- Anchors: "These edits are for a "
- Source: `js/app/export.js` (`loadEdits`)
- Flag: to confirm. The message writes the sizes with no spaces (4032×3024), where the rest of the app writes 4032 × 3024.
- Cases: 1

### EDT-06.1 Edits for a photo of another size are refused, naming both sizes   [auto: phone]
Flag: to confirm. Written to today's behavior: the message writes the sizes with no spaces.

Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9075.JPEG from samples/ (1536 × 2048 px); edits file: IMG_9136-turned-edits.json from tests/fixtures/ (saved from IMG_9136.JPEG, 1498 × 2098 px, after **90° right**)
- Starting screen: IMG_9075.JPEG open, upright, on the Export step, with **Undo** (the arrow curving left, at the top right) and **Redo** (the arrow curving right) both greyed out

The named actions:
- Open Export options: on a phone, tap the options tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls.
- Close Export options: on a phone, tap the **×** at their top right; on a wide screen there is nothing to close.
- Load the edits file F: open Export options, tap **Load edits**, choose F in the file picker, then close Export options.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Load the edits file IMG_9136-turned-edits.json | A red message reads "These edits are for a 1498×2098 photo; this one is 1536×2048." |
| 2 | Look at the photo, **Undo** and **Redo** | Nothing has changed: the photo is upright, and **Undo** and **Redo** are still greyed out |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## EDT-07 Edits for a differently named photo

Edits saved for a photo with another name but the same pixel size are applied, with a warning that names the photo they were saved for.

- Risk: low
- Check: script
- Layout: both. No difference.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Edits were saved for “", "Applied anyway — sizes match."
- Source: `js/app/export.js` (`loadEdits`)
- Ruling: R12. Load edits shows one combined warning of up to three short lines, instead of up to three messages that replace each other. The app differs today. Wording approved by Rich (tests/catalog/wording.md).
- Flag: to confirm. The message joins its two parts with a dash ("Applied anyway — sizes match."), where other messages use two sentences.
- Cases: 2

### EDT-07.1 Edits for another photo of the same size are applied with a warning   [auto: phone]
Flag: to confirm. Written to today's behavior: the message joins its two parts with a dash.

Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9060.JPEG from samples/ (1498 × 2098 px); edits file: IMG_9136-turned-edits.json from tests/fixtures/ (saved from IMG_9136.JPEG, also 1498 × 2098 px, after **90° right**)
- Starting screen: IMG_9060.JPEG open, upright, on the Export step

The named actions:
- Open Export options: on a phone, tap the options tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls.
- Close Export options: on a phone, tap the **×** at their top right; on a wide screen there is nothing to close.
- Load the edits file F: open Export options, tap **Load edits**, choose F in the file picker, then close Export options.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Load the edits file IMG_9136-turned-edits.json | An amber message reads "Edits were saved for “IMG_9136.JPEG”. Applied anyway — sizes match." |
| 2 | Look at the photo | It is turned a quarter clockwise: the edits were applied |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### EDT-07.2 Another photo's name and a damaged setting give one warning   [auto: phone]
Written to ruling R12, in the wording Rich approved; it fails until that is built (BUG-190).

Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9060.JPEG from samples/ (1498 × 2098 px)
- Edits file: IMG_9136-quality-7-edits.json from tests/fixtures/: IMG_9136.JPEG's edits after **90° right**, changed in a text editor so that `"quality": 0.92` reads `"quality": 7`
- Starting screen: IMG_9060.JPEG open, on the Export step

The named actions:
- Open Export options: on a phone, tap the options tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls.
- Close Export options: on a phone, tap the **×** at their top right; on a wide screen there is nothing to close.
- Load the edits file F: open Export options, tap **Load edits**, choose F in the file picker, then close Export options.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Load the edits file IMG_9136-quality-7-edits.json | One amber message shows, and no other message comes after it |
| 2 | Read the message | Its lines read "Edits loaded.", "Saved for “IMG_9136.JPEG”; sizes match." and "Reset, not valid: export.", in that order |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot or a screen recording.

## EDT-08 Damaged settings in the file

Settings in the file that are not valid are reset to their defaults and named in a warning; the rest of the file is applied.

- Risk: medium
- Check: script
- Layout: both. No difference.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Some settings in these edits weren’t valid and were reset: "
- Source: `js/app/export.js` (`loadEdits`), `js/app/state.js` (`cleanState`), `js/engine.js` (`sanitizeState`)
- Ruling: R12. Load edits shows one combined warning of up to three short lines, instead of up to three messages that replace each other. The app differs today. Wording approved by Rich (tests/catalog/wording.md). R42. One damaged value resets its whole settings group (one bad Quality resets every export setting), and the warning names the group: a damaged file is untrusted. The app already does this.
- Cases: 2

### EDT-08.1 A damaged setting is reset and named; the rest is applied   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Edits file: IMG_9136-quality-7-edits.json from tests/fixtures/: this photo's edits after **90° right**, changed in a text editor so that `"quality": 0.92` reads `"quality": 7` (Quality runs from 0.5 to 1)
- Starting screen: the photo open, upright, on the Export step

The named actions:
- Open Export options: on a phone, tap the options tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls.
- Close Export options: on a phone, tap the **×** at their top right; on a wide screen there is nothing to close.
- Load the edits file F: open Export options, tap **Load edits**, choose F in the file picker, then close Export options.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Load the edits file IMG_9136-quality-7-edits.json | An amber message reads "Some settings in these edits weren’t valid and were reset: export." |
| 2 | Look at the photo | It is turned a quarter clockwise: the rest of the file was applied |
| 3 | Open Export options | **Quality** reads 92%: the export settings are back to their defaults |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### EDT-08.2 A damaged setting and an unreadable logo give one warning   [auto: phone]
Written to ruling R12, in the wording Rich approved; it fails until that is built (BUG-190).

Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Edits file: IMG_9136-quality-7-gif-logo-edits.json from tests/fixtures/: this photo's edits after **90° right**, changed in a text editor: `"quality": 0.92` reads `"quality": 7`, `"overlay": null` reads `"overlay": { "id": "gif-logo", "aspect": 1, "cx": 0.5, "cy": 0.5, "w": 0.25, "opacity": 1 }`, and after it is added `"overlayImage": { "id": "gif-logo", "type": "image/gif", "name": "logo.gif", "data": "R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" }` (a one-pixel GIF, a type a logo can't be, in the middle of the photo)
- Starting screen: the photo open, on the Export step

The named actions:
- Open Export options: on a phone, tap the options tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls.
- Close Export options: on a phone, tap the **×** at their top right; on a wide screen there is nothing to close.
- Load the edits file F: open Export options, tap **Load edits**, choose F in the file picker, then close Export options.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Load the edits file IMG_9136-quality-7-gif-logo-edits.json | One amber message shows, and no other message comes after it |
| 2 | Read the message | Its lines read "Edits loaded.", "Reset, not valid: export." and "Overlay left out; it couldn’t be read.", in that order |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot or a screen recording.

## EDT-09 The logo in a loaded file

A logo in the file must be a known image type and at most 5 MB (or the lower limit a link sets), or it is left out with a warning. A logo placement with no image in the file keeps the logo only if that image is already loaded in the app; otherwise it is left out with the same warning.

- Risk: medium
- Check: script
- Layout: both. No difference.
- Added: 1.10 baseline
- Changed: none
- Anchors: "The overlay in these edits couldn’t be read, so it was left out.", `CONFIG.overlay.maxBytes`
- Source: `js/app/overlay.js` (`overlayFromEdits`), `js/app/export.js` (`loadEdits`)
- Ruling: R12. Load edits shows one combined warning of up to three short lines, instead of up to three messages that replace each other. The app differs today. Wording approved by Rich (tests/catalog/wording.md).
- Flag: to confirm. The warning says "overlay" where the Overlay step's buttons say "logo".
- Cases: 6

### EDT-09.1 A logo of a type a logo can't be is left out with a warning   [auto: phone]
Flag: to confirm. Written to today's behavior: the warning says "overlay".

Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Edits file: IMG_9136-gif-logo-edits.json from tests/fixtures/: this photo's edits after **90° right**, changed in a text editor: `"overlay": null` reads `"overlay": { "id": "gif-logo", "aspect": 1, "cx": 0.5, "cy": 0.5, "w": 0.25, "opacity": 1 }`, and after it is added `"overlayImage": { "id": "gif-logo", "type": "image/gif", "name": "logo.gif", "data": "R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" }` (a one-pixel GIF, a type a logo can't be, in the middle of the photo)
- Starting screen: the photo open, upright, on the Export step

The named actions:
- Open Export options: on a phone, tap the options tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls.
- Close Export options: on a phone, tap the **×** at their top right; on a wide screen there is nothing to close.
- Load the edits file F: open Export options, tap **Load edits**, choose F in the file picker, then close Export options.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Load the edits file IMG_9136-gif-logo-edits.json | An amber message reads "The overlay in these edits couldn’t be read, so it was left out." |
| 2 | Look at the photo | It is turned a quarter clockwise, with no logo: the rest was applied |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### EDT-09.2 A logo over 5 MB is left out with a warning   [auto: phone]
Flag: to confirm. Written to today's behavior: the warning says "overlay".

Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Edits file: IMG_9136-big-logo-edits.json, made from IMG_9136-gif-logo-edits.json in tests/fixtures/ in a text editor: `"type": "image/gif"` changed to `"type": "image/png"`, and the text in quotes after `"data": ` replaced by the base64 text of any file between 5.2 MB and 5.9 MB (made with `base64 -w 0 FILE` on Linux, or `base64 -i FILE` on a Mac). The whole file stays under 8 MB. The script makes its own copy, with 5.5 MB of zero bytes as the logo
- Starting screen: the photo open, upright, on the Export step

The named actions:
- Open Export options: on a phone, tap the options tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls.
- Close Export options: on a phone, tap the **×** at their top right; on a wide screen there is nothing to close.
- Load the edits file F: open Export options, tap **Load edits**, choose F in the file picker, then close Export options.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Load the edits file IMG_9136-big-logo-edits.json | An amber message reads "The overlay in these edits couldn’t be read, so it was left out." |
| 2 | Look at the photo | It is turned a quarter clockwise, with no logo: the rest was applied |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### EDT-09.3 A link's lower logo limit leaves a larger logo out   [auto: phone]
Flag: to confirm. Written to today's behavior: the warning says "overlay".

Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Logo: noisy-logo.png from tests/fixtures/: a PNG of 165 × 165 px of random colors, 81,928 bytes (80 KB)
- Starting screen: the photo open, on the Overlay step

The named actions:
- Open Export options: on a phone, tap the options tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls.
- Close Export options: on a phone, tap the **×** at their top right; on a wide screen there is nothing to close.
- Save the edits: open Export options, tap **Save edits**, then close Export options.
- Load the edits file F: open Export options, tap **Load edits**, choose F in the file picker, then close Export options.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Add logo** and choose noisy-logo.png | The logo shows on the photo |
| 2 | Tap **Export** in the step tabs (the six tabs Perspective to Export: along the bottom on a phone, in the top bar on a wide screen) | The Export step shows, with the logo on the photo |
| 3 | Save the edits | A file named IMG_9136-edits.json is saved |
| 4 | Go to the build's address with `?overlay.maxBytes=65536` added to it (a logo limit of 64 KB) | The start screen offers "Resume IMG_9136.JPEG?" |
| 5 | Tap **Start fresh** | The offer to resume goes |
| 6 | Tap **Open photo** and choose IMG_9136.JPEG | The photo opens, with no logo |
| 7 | Tap **Export** in the step tabs | The Export step shows |
| 8 | Load the edits file IMG_9136-edits.json (the one saved in row 3) | An amber message reads "The overlay in these edits couldn’t be read, so it was left out."; no logo shows |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### EDT-09.4 A logo placement with no picture keeps a logo the app already has   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Logo: green-logo.png from tests/fixtures/ (400 × 400 px, solid pure green)
- Edits file: IMG_9136-logo-placement-only-edits.json from tests/fixtures/: this photo's edits with green-logo.png added, saved, then changed in a text editor to take out the `"overlayImage"` setting (the logo's picture); its `"overlay"` placement is left in
- Starting screen: the photo open, on the Overlay step, with green-logo.png added by **Add logo**

The named actions:
- Open Export options: on a phone, tap the options tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls.
- Close Export options: on a phone, tap the **×** at their top right; on a wide screen there is nothing to close.
- Load the edits file F: open Export options, tap **Load edits**, choose F in the file picker, then close Export options.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Remove** | The logo goes from the photo |
| 2 | Tap **Export** in the step tabs (the six tabs Perspective to Export: along the bottom on a phone, in the top bar on a wide screen) | The Export step shows, with no logo on the photo |
| 3 | Load the edits file IMG_9136-logo-placement-only-edits.json | The green logo is back on the photo, with no message |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### EDT-09.5 A logo placement with no picture, the logo not loaded, is left out   [auto: phone]
Flag: to confirm. Written to today's behavior: the warning says "overlay".

Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Edits file: IMG_9136-logo-placement-only-edits.json from tests/fixtures/ (as in EDT-09.4: a green logo's placement, without its picture)
- Starting screen: the page just opened, the photo open with **Open photo**, on the Export step; no logo added since the page opened

The named actions:
- Open Export options: on a phone, tap the options tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls.
- Close Export options: on a phone, tap the **×** at their top right; on a wide screen there is nothing to close.
- Load the edits file F: open Export options, tap **Load edits**, choose F in the file picker, then close Export options.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Load the edits file IMG_9136-logo-placement-only-edits.json | An amber message reads "The overlay in these edits couldn’t be read, so it was left out." |
| 2 | Look at the photo | No logo shows on it |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### EDT-09.6 Another photo's name, a damaged setting and an unreadable logo give one warning   [auto: phone]
Written to ruling R12, in the wording Rich approved; it fails until that is built (BUG-190).

Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9060.JPEG from samples/ (1498 × 2098 px, the size of IMG_9136.JPEG)
- Edits file: IMG_9136-quality-7-gif-logo-edits.json from tests/fixtures/ (as in EDT-08.2: IMG_9136.JPEG's edits after **90° right**, with `"quality": 7` and a one-pixel GIF as the logo)
- Starting screen: IMG_9060.JPEG open, on the Export step

The named actions:
- Open Export options: on a phone, tap the options tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls.
- Close Export options: on a phone, tap the **×** at their top right; on a wide screen there is nothing to close.
- Load the edits file F: open Export options, tap **Load edits**, choose F in the file picker, then close Export options.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Load the edits file IMG_9136-quality-7-gif-logo-edits.json | One amber message shows, and no other message comes after it |
| 2 | Read the message | Its lines read "Edits loaded.", "Saved for “IMG_9136.JPEG”; sizes match.", "Reset, not valid: export." and "Overlay left out; it couldn’t be read.", in that order |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot or a screen recording.

## EDT-10 Loading is one undo step

Loading an edits file is one undo step; loading a file identical to the current edits changes nothing and adds no undo step.

- Risk: medium
- Check: script
- Layout: both. No difference.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnLoadEdits`, `#btnUndo`
- Source: `js/app/export.js` (`loadEdits`), `js/app/state.js` (`commit`)
- Cases: 1

### EDT-10.1 Loading is one undo step; loading the same edits again adds none   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Edits file: IMG_9136-turned-2-degrees-edits.json from tests/fixtures/: this photo's edits after **90° right** and an angle of 2° typed on Rotate (`"quarter": 1` and `"fine": 2` under `"rotation"`)
- Starting screen: the photo open, upright, on the Export step, with **Undo** (the arrow curving left, at the top right) and **Redo** (the arrow curving right) both greyed out

The named actions:
- Open Export options: on a phone, tap the options tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls.
- Close Export options: on a phone, tap the **×** at their top right; on a wide screen there is nothing to close.
- Load the edits file F: open Export options, tap **Load edits**, choose F in the file picker, then close Export options.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Load the edits file IMG_9136-turned-2-degrees-edits.json | The photo is turned a quarter and tilted 2°; **Undo** is no longer greyed out |
| 2 | Tap **Undo** | Both are taken back at once: the photo is upright, not tilted, and **Undo** is greyed out |
| 3 | Tap **Redo** | The photo is turned a quarter and tilted 2° again |
| 4 | Load the edits file IMG_9136-turned-2-degrees-edits.json again | The photo does not move |
| 5 | Tap **Undo** | The photo is upright, not tilted, and **Undo** is greyed out: the second load added no step |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## EDT-11 Older edits files

Older edits files are brought up to date on loading: version 1's Square up becomes Flatten 0%, its Card / Case target (which the app no longer has) is ignored, and a file from before the crop followed the card gets its crop orientation from its swap setting.

- Risk: medium
- Check: script
- Layout: both. No difference.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnLoadEdits`
- Source: `js/app/export.js` (`upgradeEdits`)
- Cases: 2

### EDT-11.1 A version 1 file's Square up becomes Flatten 0%   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Edits file: IMG_9136-version-1-edits.json from tests/fixtures/: this photo's edits, changed in a text editor to read as version 1 wrote them: `"version": 2` reads `"version": 1`, and `"mode": "square"` (Square up) and `"target": "case"` are added at the end; `"strength": 1` (Flatten 100%) is left as it was
- Starting screen: the photo open, on the Export step

The named actions:
- Open Export options: on a phone, tap the options tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls.
- Close Export options: on a phone, tap the **×** at their top right; on a wide screen there is nothing to close.
- Load the edits file F: open Export options, tap **Load edits**, choose F in the file picker, then close Export options.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Load the edits file IMG_9136-version-1-edits.json | No message shows: the file, with its Case target, is taken |
| 2 | Tap **Perspective** in the step tabs (the six tabs Perspective to Export: along the bottom on a phone, in the top bar on a wide screen) | The Perspective step shows, with **Flatten** in the row of tools |
| 3 | Look at **Flatten** | It reads 0% |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### EDT-11.2 A file from before the crop followed the card takes its swap setting   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/ (the card stands upright)
- Edits file: IMG_9136-older-crop-edits.json from tests/fixtures/: this photo's edits, given in a text editor the crop an older file has: the 5:4 preset, not swapped, with no `"orient"` setting (`"crop": { "mode": "fit", "preset": "5:4", "ratio": 1.25, "swapped": false, "rect": null }`)
- Starting screen: the photo open, on the Export step; the size line (on Export, the line that gives the saved picture's size in px and its format) reads Output 1400 × 1400 px · JPEG · full crop, not upscaled

The named actions:
- Open Export options: on a phone, tap the options tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls.
- Close Export options: on a phone, tap the **×** at their top right; on a wide screen there is nothing to close.
- Load the edits file F: open Export options, tap **Load edits**, choose F in the file picker, then close Export options.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Load the edits file IMG_9136-older-crop-edits.json | The size line reads Output 1520 × 1216 px · JPEG · full crop, not upscaled: wider than tall |
| 2 | Tap **Crop** in the step tabs (the six tabs Perspective to Export: along the bottom on a phone, in the top bar on a wide screen) | **5:4** is selected and the box is wider than tall, 5 wide to 4 high, though the card is upright |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## EDT-12 Round trip

Open the same photo again, load its edits file, and the export is pixel-identical to the one made before.

- Risk: high
- Check: script, saved file
- Layout: both. No difference.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnSaveEdits`, `#btnLoadEdits`, "A small JSON file. Re-open the same photo, load it, and the export is identical."
- Source: `js/app/export.js` (`saveEdits`, `loadEdits`, `renderFull`)
- Cases: 1

### EDT-12.1 Re-opened with its edits file, the photo exports the same file   [auto: phone, webkit]
Before you start:
- Device and browser: any; a phone-width or a wide window, with downloads saved to a folder you can open
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Edits file: IMG_9136-round-trip-edits.json from tests/fixtures/: this photo's edits saved from the app after an angle of 3° typed on Rotate, **4:5** on Crop, **Auto** and **Apply** on Levels, and green-logo.png (tests/fixtures/) added on Overlay; the logo is inside the file
- Starting screen: the photo open, on the Export step

The named actions:
- Open Export options: on a phone, tap the options tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls.
- Close Export options: on a phone, tap the **×** at their top right; on a wide screen there is nothing to close.
- Save the edits: open Export options, tap **Save edits**, then close Export options.
- Load the edits file F: open Export options, tap **Load edits**, choose F in the file picker, then close Export options.
- Download without upscaling: tap **Download**, then **No** in the question box (the box over the dimmed photo with a question and two or three buttons) that asks "Upscale to 2000 px?".

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Load the edits file IMG_9136-round-trip-edits.json | The photo is tilted 3°, cropped 4:5 (taller than wide), brighter, with the green logo on it |
| 2 | Download without upscaling | A file named IMG_9136-straight.jpg is saved |
| 3 | Save the edits | A file named IMG_9136-edits.json is saved |
| 4 | Reload the page | The start screen offers "Resume IMG_9136.JPEG?" |
| 5 | Tap **Start fresh** | The offer to resume goes |
| 6 | Tap **Open photo** and choose IMG_9136.JPEG | The photo opens with no edits: not tilted, no logo |
| 7 | Tap **Export** in the step tabs (the six tabs Perspective to Export: along the bottom on a phone, in the top bar on a wide screen) | The Export step shows |
| 8 | Load the edits file IMG_9136-edits.json (the one saved in row 3) | The edits come back: tilted 3°, 4:5, brighter, with the green logo |
| 9 | Download without upscaling | A second IMG_9136-straight.jpg is saved, the same as the first byte for byte |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot, and both files.

## EDT-13 A loaded logo is this photo's logo

A logo loaded from an edits file is stored as this photo's logo for Resume; it does not become the saved logo offered by **Use saved overlay**.

- Risk: low
- Check: script
- Layout: both. No difference.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnUseSaved`, "Use saved overlay", `#btnResume`
- Source: `js/app/overlay.js` (`overlayFromEdits`)
- Cases: 1

### EDT-13.1 A loaded logo is kept for Resume but is not the saved logo   [auto: phone, webkit]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared), so no logo is saved in this browser
- Photo: IMG_9136.JPEG from samples/
- Edits file: IMG_9136-green-logo-edits.json from tests/fixtures/: this photo's edits saved from the app with green-logo.png (tests/fixtures/) added; the logo is inside the file
- Starting screen: the photo open, on the Export step

The named actions:
- Open Export options: on a phone, tap the options tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls.
- Close Export options: on a phone, tap the **×** at their top right; on a wide screen there is nothing to close.
- Load the edits file F: open Export options, tap **Load edits**, choose F in the file picker, then close Export options.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Load the edits file IMG_9136-green-logo-edits.json | The green logo is on the photo |
| 2 | Tap **Overlay** in the step tabs (the six tabs Perspective to Export: along the bottom on a phone, in the top bar on a wide screen) | The Overlay step shows the green logo, with **Remove** in the row of tools |
| 3 | Tap **Remove** | The logo goes; **Add logo** shows, and no **Use saved overlay**: the loaded logo didn't become the saved logo |
| 4 | Tap **Undo** (the arrow curving left, at the top right) | The green logo is back |
| 5 | Wait two seconds, then reload the page | The start screen offers "Resume IMG_9136.JPEG?" |
| 6 | Tap **Resume** | The photo opens on Overlay with the green logo on it |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## EDT-14 Edits files in a pair

In a pair, **Save edits** saves the side you are on. Loading into a side applies the pair's rules again (the 5:7 lock in the pair's orientation) and copies the loaded export settings to the other side.

- Risk: medium
- Check: script
- Layout: both. No difference.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Saves the side you’re on. ", `#editsPairHint`, `#btnSaveEdits`, `#btnLoadEdits`
- Source: `js/app/export.js` (`saveEdits`, `loadEdits`), `js/app/pair.js` (`applyPairRules`), `js/app/state.js` (`stateChanged`)
- Cases: 3

### EDT-14.1 In a pair, Save edits saves the side you're on   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window, with downloads saved to a folder you can open
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: the front open, with the back added by **Add back** on the Export step; the back is open

The named actions:
- Open Export options: on a phone, tap the options tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls.
- Close Export options: on a phone, tap the **×** at their top right; on a wide screen there is nothing to close.
- Save the edits: open Export options, tap **Save edits**, then close Export options.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Export** in the step tabs (the six tabs Perspective to Export: along the bottom on a phone, in the top bar on a wide screen) | The Export step shows; **Back** is selected in the top bar |
| 2 | Save the edits | A file named 14_back_portrait_raw_white-edits.json is saved, naming that photo after `"name":` |
| 3 | Tap **Front** in the top bar | The front shows, still on the Export step, with **Front** selected |
| 4 | Save the edits | A file named 14_front_portrait_raw_white-edits.json is saved, naming that photo after `"name":` |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### EDT-14.2 Loading into one side gives the other side the file's export settings   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Edits file: 14_back_portrait_raw_white-png-1080-edits.json from tests/fixtures/: the back's edits saved in a pair, changed in a text editor so that `"format": "jpeg"` reads `"format": "png"` and `"longEdge": 2000` reads `"longEdge": 1080`
- Starting screen: the front open, with the back added by **Add back**; the back is open, on the Export step, at **JPEG** and **2000**

The named actions:
- Open Export options: on a phone, tap the options tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls.
- Close Export options: on a phone, tap the **×** at their top right; on a wide screen there is nothing to close.
- Load the edits file F: open Export options, tap **Load edits**, choose F in the file picker, then close Export options.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Load the edits file 14_back_portrait_raw_white-png-1080-edits.json | On the back, **PNG** and **1080** are selected |
| 2 | Tap **Front** in the top bar | The front shows, still on the Export step, with **PNG** and **1080** selected too |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### EDT-14.3 A single photo's edits loaded into a side keep the 5:7 lock   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: the front open on its own, on the Export step, its crop **1:1** (the first-time choice)

The named actions:
- Open Export options: on a phone, tap the options tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls.
- Close Export options: on a phone, tap the **×** at their top right; on a wide screen there is nothing to close.
- Save the edits: open Export options, tap **Save edits**, then close Export options.
- Load the edits file F: open Export options, tap **Load edits**, choose F in the file picker, then close Export options.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Save the edits | A file named 14_front_portrait_raw_white-edits.json is saved, with `"preset": "1:1"` under `"crop"` |
| 2 | Tap **Add back** and choose 14_back_portrait_raw_white.JPEG | The back opens; **Front** and **Back** show in the top bar |
| 3 | Tap **Front** in the top bar | The front shows, with **Front** selected |
| 4 | Tap **Export** in the step tabs (the six tabs Perspective to Export: along the bottom on a phone, in the top bar on a wide screen) | The Export step shows |
| 5 | Load the edits file 14_front_portrait_raw_white-edits.json (the one saved in row 1) | No message shows |
| 6 | Tap **Crop** in the step tabs | **5:7 card** is selected and the box is taller than wide: the file's 1:1 was not taken |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## EDT-15 The Edits group

Export's options sheet has an **Edits** heading with **Save edits** and **Load edits** side by side and a hint under them; while paired the hint starts with **Saves the side you’re on.**

- Risk: low
- Check: script
- Layout: both. On a phone the group is in the sheet opened from the tab with the up arrow above the controls; on a wide screen the options are listed in the side panel.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#exportSheet`, `#exportEditsRow`, `#editsPairHint`, "Export options"
- Source: `js/app/export-controls.js` (`buildEditsGroup`, `buildEditsButton`), `js/app/pair.js` (`syncPair`)
- Flag: to confirm. The hint says nearly the same as Export's last tip ("An edits file is small. Re-open the same photo, load it, and the export is identical."), and on a phone both show.
- Cases: 2

### EDT-15.1 Export options group Save edits and Load edits under Edits, with a hint   [auto: both]
Flag: to confirm. Written to today's behavior: the hint repeats most of Export's last tip.

Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Export step

The named actions:
- Open Export options: on a phone, tap the options tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Open Export options | An **Edits** heading shows |
| 2 | Look under it | **Save edits** and **Load edits** side by side, the same size, **Save edits** on the left |
| 3 | Look under the two buttons | The hint "A small JSON file. Re-open the same photo, load it, and the export is identical." |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### EDT-15.2 While paired, the hint starts with "Saves the side you're on."   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: the front open, with the back added by **Add back**; the back is open

The named actions:
- Open Export options: on a phone, tap the options tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Export** in the step tabs (the six tabs Perspective to Export: along the bottom on a phone, in the top bar on a wide screen) | The Export step shows |
| 2 | Open Export options | The Edits group shows |
| 3 | Read the hint under **Save edits** and **Load edits** | It starts with **Saves the side you’re on.** in bold, then "A small JSON file." |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.
