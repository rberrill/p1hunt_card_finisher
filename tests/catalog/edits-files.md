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
- Cases: none yet

## EDT-02 The logo travels in the file

When a logo is placed and loaded, the edits file holds the logo image itself.

- Risk: medium
- Check: script, saved file
- Layout: both. No difference.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnSaveEdits`, `#btnOverlayAdd`
- Source: `js/app/export.js` (`saveEdits`), `js/app/overlay.js` (`overlayForEdits`)
- Cases: none yet

## EDT-03 What the file leaves out

The edits file does not hold the photo, unapplied Levels changes, the Together / Separately choice, the corner-shots output choice, or a pair and its other side.

- Risk: low
- Check: script, saved file
- Layout: both. No difference.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnSaveEdits`, `#pairOutput`, `#cornerOutput`
- Source: `js/app/export.js` (`saveEdits`), `js/app/adapters.js` (`Prefs.save`)
- Cases: none yet

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
- Cases: none yet

## EDT-05 Files that are not edits files

A file over 8 MB, a file that is not JSON, and a JSON file that is not an edits file (it needs version 1 or 2, the photo's size and the corners) are refused with an error message, and nothing changes.

- Risk: medium
- Check: script
- Layout: both. No difference.
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.export.editsMaxBytes`, "That file is too large to be a Card Finisher edits file.", "That file isn’t valid JSON.", "That isn’t a Card Finisher edits file."
- Source: `js/app/export.js` (`loadEdits`, `looksLikeEdits`)
- Cases: none yet

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
- Cases: none yet

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
- Cases: none yet

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
- Cases: none yet

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
- Cases: none yet

## EDT-10 Loading is one undo step

Loading an edits file is one undo step; loading a file identical to the current edits changes nothing and adds no undo step.

- Risk: medium
- Check: script
- Layout: both. No difference.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnLoadEdits`, `#btnUndo`
- Source: `js/app/export.js` (`loadEdits`), `js/app/state.js` (`commit`)
- Cases: none yet

## EDT-11 Older edits files

Older edits files are brought up to date on loading: version 1's Square up becomes Flatten 0%, its Card / Case target is dropped, and a file from before the crop followed the card gets its crop orientation from its swap setting.

- Risk: medium
- Check: script
- Layout: both. No difference.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnLoadEdits`
- Source: `js/app/export.js` (`upgradeEdits`)
- Cases: none yet

## EDT-12 Round trip

Open the same photo again, load its edits file, and the export is pixel-identical to the one made before.

- Risk: high
- Check: script, saved file
- Layout: both. No difference.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnSaveEdits`, `#btnLoadEdits`, "A small JSON file. Re-open the same photo, load it, and the export is identical."
- Source: `js/app/export.js` (`saveEdits`, `loadEdits`, `renderFull`)
- Cases: none yet

## EDT-13 A loaded logo is this photo's logo

A logo loaded from an edits file is stored as this photo's logo for Resume; it does not become the saved logo offered by **Use saved overlay**.

- Risk: low
- Check: script
- Layout: both. No difference.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnUseSaved`, "Use saved overlay", `#btnResume`
- Source: `js/app/overlay.js` (`overlayFromEdits`)
- Cases: none yet

## EDT-14 Edits files in a pair

In a pair, **Save edits** saves the side you are on. Loading into a side applies the pair's rules again (the 5:7 lock in the pair's orientation) and copies the loaded export settings to the other side.

- Risk: medium
- Check: script
- Layout: both. No difference.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Saves the side you’re on. ", `#editsPairHint`, `#btnSaveEdits`, `#btnLoadEdits`
- Source: `js/app/export.js` (`saveEdits`, `loadEdits`), `js/app/pair.js` (`applyPairRules`), `js/app/state.js` (`stateChanged`)
- Cases: none yet

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
- Cases: none yet
