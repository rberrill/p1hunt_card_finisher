# Save edits and Load edits

Saving a photo's edits to a small file and loading them back onto the same photo, including what the file holds, what is refused, and how older files and pairs are handled.

## EDT-01 Save edits

**Save edits** downloads the photo's edits as a readable JSON file named after the photo with **-edits.json** added.

- Risk: high
- Check: script, saved file
- Layout: both. On a phone the button is in Export's options sheet, opened from the tab with the up arrow above the controls; on a wide screen it is listed in the side panel.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnSaveEdits`, "Save edits", "-edits.json"
- Source: `js/app/export.js` (`saveEdits`, `exportBaseName`), `js/app/export-controls.js` (`buildEditsGroup`, `bindExport`)
- Cases: 1

### EDT-01.1 Save edits saves a readable file named for the photo   [auto: phone, webkit]
Before you start:
- Device and browser: any; a phone-width or a wide window, with downloads saved to a folder you can open
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/ (1498 × 2098 px)
- Starting screen: the photo open, on the Rotate step

The named actions:
- Open Export options: on a phone, tap the **Options** tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls.
- Close Export options: on a phone, tap the **×** at their top right; on a wide screen there is nothing to close.
- Save the edits: open Export options, tap **Save edits**, then close Export options.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **90° right** | The photo turns a quarter clockwise |
| 2 | Tap **Export** in the step bar, and save the edits | A file named IMG_9136-edits.json is saved |
| 3 | Open the file in a text editor | It is plain text, one setting to a line, and its first setting reads `"version": 2` |
| 4 | Read its source and rotation settings | It names IMG_9136.JPEG, a width of 1498 and a height of 2098, and a quarter turn of 1 |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot, and the edits file.

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
- Photo: IMG_9136.JPEG from samples/
- Logo: green-logo.png, made for the case: a PNG of 400 × 400 px, solid pure green
- Starting screen: the photo open, on the Overlay step

The named actions:
- Open Export options: on a phone, tap the **Options** tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls.
- Close Export options: on a phone, tap the **×** at their top right; on a wide screen there is nothing to close.
- Save the edits: open Export options, tap **Save edits**, then close Export options.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Add logo** and choose green-logo.png | The green square shows on the photo |
| 2 | Tap **Export** in the step bar, and save the edits | A file named IMG_9136-edits.json is saved |
| 3 | Open the file in a text editor and find `"overlayImage"` near its end | It names green-logo.png, of the type image/png, and holds the logo's bytes as a long run of letters and digits (base64) that decodes to green-logo.png exactly |

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
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Levels step, with no levels set

The named actions:
- Open Export options: on a phone, tap the **Options** tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls.
- Close Export options: on a phone, tap the **×** at their top right; on a wide screen there is nothing to close.
- Save the edits: open Export options, tap **Save edits**, then close Export options.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Auto** | The photo brightens; a white dot shows on the **Levels** tab: the levels wait for **Apply** |
| 2 | Tap **Export** in the step bar, tap **Corner shots**, then **4 photos** | **4 photos** is selected |
| 3 | Close Corner shots (on a phone, tap the **×** at its top right), and save the edits | A file named IMG_9136-edits.json is saved, under 10 KB: the photo is not in it |
| 4 | Open the file in a text editor and find its levels line | It reads `"levels": null`: the unapplied levels are not in it |
| 5 | Search the file for the word photos | It is nowhere in the file: the corner-shots choice is not in it |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot, and the edits file.

### EDT-03.2 In a pair the file leaves out the other side and Together or Separately   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window, with downloads saved to a folder you can open
- Build: the build under test
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: the front open, with the back added by **Add back** on the Export step; the back is open

The named actions:
- Open Export options: on a phone, tap the **Options** tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls.
- Close Export options: on a phone, tap the **×** at their top right; on a wide screen there is nothing to close.
- Save the edits: open Export options, tap **Save edits**, then close Export options.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Export** in the step bar, then **Separately** beside the size line | **Separately** is selected |
| 2 | Save the edits | A file named 14_back_portrait_raw_white-edits.json is saved |
| 3 | Search the file for the words front, separately, together and pair | None of them is in the file: neither the other side nor the choice is in it |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot, and the edits file.

## EDT-04 Load edits

**Load edits** opens a file picker for a .json file.

- Risk: high
- Check: script
- Layout: both. On a phone the button is in Export's options sheet; on a wide screen it is listed in the side panel.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnLoadEdits`, `#editsInput`, "Load edits"
- Source: `js/app/export-controls.js` (`buildEditsGroup`, `bindExport`), `js/app/shell.js` (`syncUI`)
- Ruling: R17. While an export runs, Load edits is dimmed with the save buttons (as are Size, Format, the options sheet's settings, Undo, Redo and Add back); the tab bar stays live. The app differs today.
- Cases: 2

### EDT-04.1 Load edits opens a picker for one .json file and applies it   [auto: phone, webkit]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Rotate step

The named actions:
- Open Export options: on a phone, tap the **Options** tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls.
- Close Export options: on a phone, tap the **×** at their top right; on a wide screen there is nothing to close.
- Save the edits: open Export options, tap **Save edits**, then close Export options.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **90° right** | The photo turns a quarter clockwise |
| 2 | Tap **Export** in the step bar, and save the edits | A file named IMG_9136-edits.json is saved |
| 3 | Tap **Undo** (the arrow curving left, at the top right) | The photo is upright again |
| 4 | Open Export options and tap **Load edits** | A file picker opens for one file, offering only .json files |
| 5 | Choose IMG_9136-edits.json | The photo turns a quarter clockwise again |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### EDT-04.2 While an export runs, Load edits is dimmed and the step tabs stay live   [auto: phone]
Written to ruling R17; it fails until that is built (BUG-013).

Before you start:
- Device and browser: any; a phone-width or a wide window. The automated case records the screen at the moment the export begins
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Export step

The named actions:
- Open Export options: on a phone, tap the **Options** tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Download**, then **No** on "Upscale to 2000 px?" | The export runs; a progress line crosses the top edge of the controls |
| 2 | While it runs, look at the step tabs | They are live, none greyed out |
| 3 | While it runs, open Export options and look at **Load edits** | **Load edits** is greyed out |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

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
- Photo: IMG_9136.JPEG from samples/
- Edits file: IMG_9136-edits.json, saved from this photo after **90° right**, then made larger than 8 MB (8,388,608 bytes) in a text editor by adding spaces after its last closing brace, so it is still valid JSON
- Starting screen: the photo open, on the Export step, turned a quarter (**90° right**), then **Undo**, so the photo is upright and **Redo** is lit

The named actions:
- Open Export options: on a phone, tap the **Options** tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls.
- Close Export options: on a phone, tap the **×** at their top right; on a wide screen there is nothing to close.
- Load the edits file F: open Export options, tap **Load edits**, choose F in the file picker, then close Export options.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Load the edits file IMG_9136-edits.json | A red message reads "That file is too large to be a Card Finisher edits file." |
| 2 | Look at the photo and **Redo** | Nothing has changed: the photo is upright and **Redo** is still lit |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### EDT-05.2 A file that isn't JSON is refused   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- File: IMG_9136-edits.json, made for the case: one line of plain text, "These are notes about a card, not an edits file."
- Starting screen: the photo open, on the Export step

The named actions:
- Open Export options: on a phone, tap the **Options** tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls.
- Close Export options: on a phone, tap the **×** at their top right; on a wide screen there is nothing to close.
- Load the edits file F: open Export options, tap **Load edits**, choose F in the file picker, then close Export options.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Load the edits file IMG_9136-edits.json | A red message reads "That file isn’t valid JSON." |
| 2 | Look at the photo, **Undo** and **Redo** | Nothing has changed |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### EDT-05.3 JSON that isn't an edits file is refused   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Files: three copies of IMG_9136-edits.json, saved from this photo, each changed in a text editor: bad-1-edits.json with `"version": 3`; bad-2-edits.json with the `"corners"` setting taken out; bad-3-edits.json with the width written as text, `"width": "1498"`
- Starting screen: the photo open, on the Export step

The named actions:
- Open Export options: on a phone, tap the **Options** tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls.
- Close Export options: on a phone, tap the **×** at their top right; on a wide screen there is nothing to close.
- Load the edits file F: open Export options, tap **Load edits**, choose F in the file picker, then close Export options.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Load the edits file bad-1-edits.json | A red message reads "That isn’t a Card Finisher edits file."; nothing changes |
| 2 | Load the edits file bad-2-edits.json | The same red message shows again; nothing changes |
| 3 | Load the edits file bad-3-edits.json | The same red message shows again; nothing changes |

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
- Photos: IMG_9136.JPEG (1498 × 2098 px) and IMG_9075.JPEG (1536 × 2048 px) from samples/
- Starting screen: IMG_9136.JPEG open, on the Export step

The named actions:
- Open Export options: on a phone, tap the **Options** tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls.
- Close Export options: on a phone, tap the **×** at their top right; on a wide screen there is nothing to close.
- Save the edits: open Export options, tap **Save edits**, then close Export options.
- Load the edits file F: open Export options, tap **Load edits**, choose F in the file picker, then close Export options.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Save the edits | A file named IMG_9136-edits.json is saved |
| 2 | Tap **Open** (the folder at the top left), choose IMG_9075.JPEG, then tap **Export** in the step bar | IMG_9075.JPEG opens |
| 3 | Load the edits file IMG_9136-edits.json | A red message reads "These edits are for a 1498×2098 photo; this one is 1536×2048." |
| 4 | Look at the photo, **Undo** and **Redo** | Nothing has changed |

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
- Ruling: R12. Load edits shows one combined warning of up to three short lines, instead of up to three messages that replace each other. The app differs today. New wording, to be approved by Rich.
- Flag: to confirm. The message joins its two parts with a dash ("Applied anyway — sizes match."), where other messages use two sentences.
- Cases: 2

### EDT-07.1 Edits for another photo of the same size are applied with a warning   [auto: phone]
Flag: to confirm. Written to today's behavior: the message joins its two parts with a dash.

Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photos: IMG_9136.JPEG and IMG_9060.JPEG from samples/ (both 1498 × 2098 px)
- Starting screen: IMG_9136.JPEG open, on the Rotate step

The named actions:
- Open Export options: on a phone, tap the **Options** tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls.
- Close Export options: on a phone, tap the **×** at their top right; on a wide screen there is nothing to close.
- Save the edits: open Export options, tap **Save edits**, then close Export options.
- Load the edits file F: open Export options, tap **Load edits**, choose F in the file picker, then close Export options.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **90° right**, tap **Export** in the step bar, and save the edits | A file named IMG_9136-edits.json is saved |
| 2 | Tap **Open** (the folder at the top left), choose IMG_9060.JPEG, then tap **Export** in the step bar | IMG_9060.JPEG opens, upright |
| 3 | Load the edits file IMG_9136-edits.json | An amber message reads "Edits were saved for “IMG_9136.JPEG”. Applied anyway — sizes match." |
| 4 | Look at the photo | It is turned a quarter clockwise: the edits were applied |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### EDT-07.2 Another photo's name and a damaged setting give one warning   [auto: phone]
Written to ruling R12; it fails until that is built (BUG-190). The wording is to be approved by Rich, so the case checks what the warning says, not its words.

Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photos: IMG_9136.JPEG and IMG_9060.JPEG from samples/ (both 1498 × 2098 px)
- Edits file: IMG_9136-edits.json, saved from IMG_9136.JPEG after **90° right**, then changed in a text editor so that `"quality": 0.92` reads `"quality": 7`
- Starting screen: IMG_9060.JPEG open, on the Export step

The named actions:
- Open Export options: on a phone, tap the **Options** tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls.
- Close Export options: on a phone, tap the **×** at their top right; on a wide screen there is nothing to close.
- Load the edits file F: open Export options, tap **Load edits**, choose F in the file picker, then close Export options.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Load the edits file IMG_9136-edits.json | One amber warning shows, and no other message comes after it |
| 2 | Read the warning | It says, in short lines, both that the edits were saved for IMG_9136.JPEG and that the export settings were reset |

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
- Ruling: R12. Load edits shows one combined warning of up to three short lines, instead of up to three messages that replace each other. The app differs today. New wording, to be approved by Rich.
- Cases: 2

### EDT-08.1 A damaged setting is reset and named; the rest is applied   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Edits file: IMG_9136-edits.json, saved from this photo after **90° right**, then changed in a text editor so that `"quality": 0.92` reads `"quality": 7` (Quality runs from 0.5 to 1)
- Starting screen: the photo open, on the Export step, upright

The named actions:
- Open Export options: on a phone, tap the **Options** tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls.
- Close Export options: on a phone, tap the **×** at their top right; on a wide screen there is nothing to close.
- Load the edits file F: open Export options, tap **Load edits**, choose F in the file picker, then close Export options.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Load the edits file IMG_9136-edits.json | An amber message reads "Some settings in these edits weren’t valid and were reset: export." |
| 2 | Look at the photo | It is turned a quarter clockwise: the rest of the file was applied |
| 3 | Open Export options and look at **Quality** | It reads 92%: the export settings are back to their defaults |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### EDT-08.2 A damaged setting and an unreadable logo give one warning   [auto: phone]
Written to ruling R12; it fails until that is built (BUG-190). The wording is to be approved by Rich, so the case checks what the warning says, not its words.

Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Edits file: IMG_9136-edits.json, saved from this photo after **90° right**, then changed in a text editor: `"quality": 7` in place of 0.92, and a logo of the GIF type (a type a logo can't be) with its placement in the middle of the photo
- Starting screen: the photo open, on the Export step

The named actions:
- Open Export options: on a phone, tap the **Options** tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls.
- Close Export options: on a phone, tap the **×** at their top right; on a wide screen there is nothing to close.
- Load the edits file F: open Export options, tap **Load edits**, choose F in the file picker, then close Export options.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Load the edits file IMG_9136-edits.json | One amber warning shows, and no other message comes after it |
| 2 | Read the warning | It says, in short lines, both that the export settings were reset and that the logo (overlay) was left out |

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
- Ruling: R12. Load edits shows one combined warning of up to three short lines, instead of up to three messages that replace each other. The app differs today. New wording, to be approved by Rich.
- Flag: to confirm. The warning says "overlay" where the Overlay step's buttons say "logo".
- Cases: 6

### EDT-09.1 A logo of a type a logo can't be is left out with a warning   [auto: phone]
Flag: to confirm. Written to today's behavior: the warning says "overlay".

Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Edits file: IMG_9136-edits.json, saved from this photo after **90° right**, then given a logo in a text editor: a GIF picture (a type a logo can't be), placed in the middle of the photo
- Starting screen: the photo open, on the Export step, upright

The named actions:
- Open Export options: on a phone, tap the **Options** tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls.
- Close Export options: on a phone, tap the **×** at their top right; on a wide screen there is nothing to close.
- Load the edits file F: open Export options, tap **Load edits**, choose F in the file picker, then close Export options.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Load the edits file IMG_9136-edits.json | An amber message reads "The overlay in these edits couldn’t be read, so it was left out." |
| 2 | Look at the photo | It is turned a quarter clockwise, with no logo: the rest was applied |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### EDT-09.2 A logo over 5 MB is left out with a warning   [auto: phone]
Flag: to confirm. Written to today's behavior: the warning says "overlay".

Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Edits file: IMG_9136-edits.json, saved from this photo after **90° right**, then given a logo in a text editor: a PNG of 5.5 MB, placed in the middle of the photo. The whole file stays under 8 MB
- Starting screen: the photo open, on the Export step, upright

The named actions:
- Open Export options: on a phone, tap the **Options** tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls.
- Close Export options: on a phone, tap the **×** at their top right; on a wide screen there is nothing to close.
- Load the edits file F: open Export options, tap **Load edits**, choose F in the file picker, then close Export options.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Load the edits file IMG_9136-edits.json | An amber message reads "The overlay in these edits couldn’t be read, so it was left out." |
| 2 | Look at the photo | It is turned a quarter clockwise, with no logo: the rest was applied |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### EDT-09.3 A link's lower logo limit leaves a larger logo out   [auto: phone]
Flag: to confirm. Written to today's behavior: the warning says "overlay".

Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: noisy-logo.png, made for the case: a PNG of 200 × 200 px of random colors, about 160 KB
- Starting screen: the photo open, on the Overlay step

The named actions:
- Open Export options: on a phone, tap the **Options** tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls.
- Close Export options: on a phone, tap the **×** at their top right; on a wide screen there is nothing to close.
- Save the edits: open Export options, tap **Save edits**, then close Export options.
- Load the edits file F: open Export options, tap **Load edits**, choose F in the file picker, then close Export options.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Add logo** and choose noisy-logo.png | The logo shows on the photo |
| 2 | Tap **Export** in the step bar, and save the edits | A file named IMG_9136-edits.json is saved |
| 3 | Open the app again with `?overlay.maxBytes=65536` added to its address (a logo limit of 64 KB), open IMG_9136.JPEG, and tap **Export** | The photo opens with no logo |
| 4 | Load the edits file IMG_9136-edits.json | An amber message reads "The overlay in these edits couldn’t be read, so it was left out."; no logo shows |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### EDT-09.4 A logo placement with no picture keeps a logo the app already has   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: green-logo.png, made for the case: a PNG of 400 × 400 px, solid pure green
- Starting screen: the photo open, on the Overlay step, with green-logo.png added by **Add logo**; its edits saved as IMG_9136-edits.json, then copied as placement-only-edits.json with the `"overlayImage"` setting (the logo's picture) taken out in a text editor

The named actions:
- Open Export options: on a phone, tap the **Options** tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls.
- Close Export options: on a phone, tap the **×** at their top right; on a wide screen there is nothing to close.
- Load the edits file F: open Export options, tap **Load edits**, choose F in the file picker, then close Export options.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Remove** | The logo goes from the photo |
| 2 | Tap **Export** in the step bar, and load the edits file placement-only-edits.json | The green logo is back on the photo, with no message |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### EDT-09.5 A logo placement with no picture, the logo not loaded, is left out   [auto: phone]
Flag: to confirm. Written to today's behavior: the warning says "overlay".

Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: green-logo.png, made for the case: a PNG of 400 × 400 px, solid pure green
- Starting screen: as for EDT-09.4: green-logo.png added, the edits saved and copied as placement-only-edits.json with the logo's picture taken out

The named actions:
- Open Export options: on a phone, tap the **Options** tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls.
- Close Export options: on a phone, tap the **×** at their top right; on a wide screen there is nothing to close.
- Load the edits file F: open Export options, tap **Load edits**, choose F in the file picker, then close Export options.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Reload the page, tap **Start fresh**, open IMG_9136.JPEG and tap **Export** | The photo opens with no logo |
| 2 | Load the edits file placement-only-edits.json | An amber message reads "The overlay in these edits couldn’t be read, so it was left out."; no logo shows |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### EDT-09.6 Another photo's name, a damaged setting and an unreadable logo give one warning   [auto: phone]
Written to ruling R12; it fails until that is built (BUG-190). The wording is to be approved by Rich, so the case checks what the warning says, not its words.

Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photos: IMG_9136.JPEG and IMG_9060.JPEG from samples/ (both 1498 × 2098 px)
- Edits file: IMG_9136-edits.json, saved from IMG_9136.JPEG after **90° right**, then changed in a text editor: `"quality": 7` in place of 0.92, and a logo of the GIF type placed in the middle of the photo
- Starting screen: IMG_9060.JPEG open, on the Export step

The named actions:
- Open Export options: on a phone, tap the **Options** tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls.
- Close Export options: on a phone, tap the **×** at their top right; on a wide screen there is nothing to close.
- Load the edits file F: open Export options, tap **Load edits**, choose F in the file picker, then close Export options.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Load the edits file IMG_9136-edits.json | One amber warning shows, and no other message comes after it |
| 2 | Read the warning | It says, in up to three short lines, that the edits were saved for IMG_9136.JPEG, that the export settings were reset and that the logo (overlay) was left out |

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
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Rotate step

**Undo** is the arrow curving left at the top right; **Redo** the arrow curving right.

The named actions:
- Open Export options: on a phone, tap the **Options** tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls.
- Close Export options: on a phone, tap the **×** at their top right; on a wide screen there is nothing to close.
- Save the edits: open Export options, tap **Save edits**, then close Export options.
- Load the edits file F: open Export options, tap **Load edits**, choose F in the file picker, then close Export options.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **90° right**, then tap the angle, type 2 and tap **Done** | The photo is turned a quarter, and the angle reads 2.0° |
| 2 | Tap **Export** in the step bar, and save the edits | A file named IMG_9136-edits.json is saved |
| 3 | Tap **Undo** twice | The photo is upright at 0.0°; **Undo** is greyed out |
| 4 | Load the edits file IMG_9136-edits.json | The photo is turned a quarter, at 2.0° |
| 5 | Tap **Undo** once | Both are taken back: upright, at 0.0°; **Undo** is greyed out |
| 6 | Tap **Redo**, then load the edits file IMG_9136-edits.json again | The photo stays turned a quarter, at 2.0° |
| 7 | Tap **Undo** once | Upright, at 0.0°, and **Undo** is greyed out: the second load added no step |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## EDT-11 Older edits files

Older edits files are brought up to date on loading: version 1's Square up becomes Flatten 0%, its Card / Case target is dropped, and a file from before the crop followed the card gets its crop orientation from its swap setting.

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
- Photo: IMG_9136.JPEG from samples/
- Edits file: IMG_9136-edits.json, saved from this photo, then changed in a text editor to read as version 1 wrote it: `"version": 1`, `"mode": "square"` (Square up), `"target": "case"`, and `"strength": 1` (Flatten 100%)
- Starting screen: the photo open, on the Export step

The named actions:
- Open Export options: on a phone, tap the **Options** tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls.
- Close Export options: on a phone, tap the **×** at their top right; on a wide screen there is nothing to close.
- Load the edits file F: open Export options, tap **Load edits**, choose F in the file picker, then close Export options.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Load the edits file IMG_9136-edits.json | No message shows |
| 2 | Tap **Perspective** in the step bar and look at **Flatten** in the tools | It reads 0% |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### EDT-11.2 A file from before the crop followed the card takes its swap setting   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/ (the card stands upright)
- Edits file: IMG_9136-edits.json, saved from this photo, then given in a text editor the crop an older file has: the 5:4 preset, not swapped, with no `"orient"` setting (`"crop": { "mode": "fit", "preset": "5:4", "ratio": 1.25, "swapped": false, "rect": null }`)
- Starting screen: the photo open, on the Export step

The named actions:
- Open Export options: on a phone, tap the **Options** tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls.
- Close Export options: on a phone, tap the **×** at their top right; on a wide screen there is nothing to close.
- Load the edits file F: open Export options, tap **Load edits**, choose F in the file picker, then close Export options.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Load the edits file IMG_9136-edits.json | The crop changes |
| 2 | Tap **Crop** in the step bar | **5:4** is selected and the box is wider than tall, 5 wide to 4 high, though the card is upright |

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
- Photo: IMG_9136.JPEG from samples/
- Logo: green-logo.png, made for the case: a PNG of 400 × 400 px, solid pure green
- Starting screen: the photo open, on the Rotate step

The named actions:
- Open Export options: on a phone, tap the **Options** tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls.
- Close Export options: on a phone, tap the **×** at their top right; on a wide screen there is nothing to close.
- Save the edits: open Export options, tap **Save edits**, then close Export options.
- Load the edits file F: open Export options, tap **Load edits**, choose F in the file picker, then close Export options.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap the angle, type 3 and tap **Done**; on **Crop** tap **4:5**; on **Levels** tap **Auto**, then **Apply**; on **Overlay** tap **Add logo** and choose green-logo.png | The photo is at 3.0°, cropped 4:5, with levels applied and the green logo on it |
| 2 | Tap **Export** in the step bar, then **Download**, then **No** | A file named IMG_9136-straight.jpg is saved |
| 3 | Save the edits | A file named IMG_9136-edits.json is saved |
| 4 | Reload the page, tap **Start fresh**, open IMG_9136.JPEG and tap **Export** | The photo opens with no edits: 0.0°, no logo |
| 5 | Load the edits file IMG_9136-edits.json | The edits come back: 3.0°, 4:5, the levels and the green logo |
| 6 | Tap **Download**, then **No** | A second IMG_9136-straight.jpg is saved, the same as the first byte for byte |

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
- Device and browser: any; a phone-width or a wide window, in a private window so that no logo is saved in this browser
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: green-logo.png, made for the case: a PNG of 400 × 400 px, solid pure green
- Starting screen: the photo open, on the Overlay step

The named actions:
- Open Export options: on a phone, tap the **Options** tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls.
- Close Export options: on a phone, tap the **×** at their top right; on a wide screen there is nothing to close.
- Save the edits: open Export options, tap **Save edits**, then close Export options.
- Load the edits file F: open Export options, tap **Load edits**, choose F in the file picker, then close Export options.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Add logo**, choose green-logo.png, tap **Export** in the step bar and save the edits | A file named IMG_9136-edits.json is saved |
| 2 | Tap **Overlay** in the step bar, then **Delete saved**, then **Remove** | No logo on the photo; **Add logo** shows, and no **Use saved overlay** |
| 3 | Reload the page, tap **Start fresh**, open IMG_9136.JPEG, tap **Export**, and load the edits file IMG_9136-edits.json | The green logo is on the photo |
| 4 | Tap **Overlay** in the step bar, then **Remove** | **Add logo** shows, and still no **Use saved overlay**: the loaded logo didn't become the saved logo |
| 5 | Tap **Undo** (the arrow curving left, at the top right) | The green logo is back |
| 6 | Wait a second, reload the page, and tap **Resume** | The photo opens on Overlay with the green logo on it |

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
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: the front open, with the back added by **Add back** on the Export step; the back is open

The named actions:
- Open Export options: on a phone, tap the **Options** tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls.
- Close Export options: on a phone, tap the **×** at their top right; on a wide screen there is nothing to close.
- Save the edits: open Export options, tap **Save edits**, then close Export options.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Export** in the step bar | **Back** is selected in the top bar |
| 2 | Save the edits | A file named 14_back_portrait_raw_white-edits.json is saved, naming that photo |
| 3 | Tap **Front** in the top bar, tap **Export**, and save the edits | A file named 14_front_portrait_raw_white-edits.json is saved, naming that photo |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### EDT-14.2 Loading into one side gives the other side the file's export settings   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: the front open, with the back added by **Add back**; the back is open, on the Export step, at **JPEG** and **2000**
- Edits file: 14_back_portrait_raw_white-edits.json, saved from the back, then changed in a text editor to `"format": "png"` and `"longEdge": 1080`

The named actions:
- Open Export options: on a phone, tap the **Options** tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls.
- Close Export options: on a phone, tap the **×** at their top right; on a wide screen there is nothing to close.
- Load the edits file F: open Export options, tap **Load edits**, choose F in the file picker, then close Export options.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Load the edits file 14_back_portrait_raw_white-edits.json | On the back, **PNG** and **1080** are selected |
| 2 | Tap **Front** in the top bar, then **Export** in the step bar | On the front too, **PNG** and **1080** are selected |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### EDT-14.3 A single photo's edits loaded into a side keep the 5:7 lock   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: the front open on its own, on the Export step, its crop **1:1** (the first-time choice)

The named actions:
- Open Export options: on a phone, tap the **Options** tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls.
- Close Export options: on a phone, tap the **×** at their top right; on a wide screen there is nothing to close.
- Save the edits: open Export options, tap **Save edits**, then close Export options.
- Load the edits file F: open Export options, tap **Load edits**, choose F in the file picker, then close Export options.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Save the edits | A file named 14_front_portrait_raw_white-edits.json is saved, with the 1:1 crop |
| 2 | Tap **Add back** and choose 14_back_portrait_raw_white.JPEG | The back opens; **Front** / **Back** shows in the top bar |
| 3 | Tap **Front** in the top bar, tap **Export**, and load the edits file 14_front_portrait_raw_white-edits.json | The edits load with no message |
| 4 | Tap **Crop** in the step bar | **5:7 card** is selected and the box is taller than wide: the file's 1:1 was not taken |

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
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Export step

The named actions:
- Open Export options: on a phone, tap the **Options** tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls.

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
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: the front open, with the back added by **Add back**; the back is open

The named actions:
- Open Export options: on a phone, tap the **Options** tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Export** in the step bar and open Export options | The Edits group shows |
| 2 | Read the hint under **Save edits** and **Load edits** | It starts with **Saves the side you’re on.** in bold, then "A small JSON file." |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.
