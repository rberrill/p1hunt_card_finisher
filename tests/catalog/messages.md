# Messages

Every message the app shows: the short messages over the photo, the lines that take the row above the controls, the notes under Export's size line, the question cards, the text drawn on the photo, the tips, the names screen readers hear and what the app writes to the console.

## MSG-01 One message at a time over the photo

Short messages appear as a pill over the bottom edge of the photo, one at a time. A new message takes the place of the one showing at once, while the old one fades out beneath it.

- Risk: medium
- Check: script
- Layout: both. On a phone the pill spans the width less 16 px each side, 36 px above the photo's bottom edge; on a wide screen it is centered 20 px up, as wide as its text up to 460 px.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#toast`, `.toast-message`, `.is-ghost`
- Source: `js/app/core.js` (`toast`, `fadeOutCopy`, `mountToast`); `js/app/parts/toast.js` (`buildToast`, `updateToast`)
- Cases: none yet

## MSG-02 How long a message stays

A message stays 3 seconds when it is information, 5 seconds when it is a warning and 6 seconds when it is an error, unless the message sets its own time.

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#toast`, `.is-shown`
- Source: `js/app/core.js` (`toast`, `hideToast`)
- Cases: none yet

## MSG-03 Three kinds of message

Information is a white pill with no icon; a warning is amber with a triangle; an error is red with a circle.

- Risk: low
- Check: script, eye
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: `.is-warn`, `.is-error`, `.toast-icon`
- Source: `js/app/parts/toast.js` (`updateToast`); `css/app.css` (the toast part)
- Cases: none yet

## MSG-04 Messages never block a touch

Touches pass through a message to the photo beneath it. A long message is cut to three lines with an ellipsis, and a screen reader announces each message without interrupting.

- Risk: medium
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#toast`, `.toast-text`
- Source: `js/app/parts/toast.js` (`buildToast`); `css/app.css` (the toast part)
- Cases: none yet

## MSG-05 A message rides above an open sheet

While an options sheet is open on a phone, the message sits just above the sheet's top edge instead of over the photo. It moves when a sheet opens or closes and when the window is resized.

- Risk: medium
- Check: script
- Layout: phone. A wide screen lists the options in the side panel, so the message always sits over the photo.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#toast`, `.sheet-layer`, `.toast-message`
- Source: `js/app/core.js` (`placeToast`, `toastLiftPx`)
- Cases: none yet

## MSG-06 "Loading…"

An information message, "Loading…", appears when any photo starts opening (Open, **Next card**, **Add back**, drop, paste, **Resume**, **Replace front** or **Replace back**) and is taken down when the photo shows.

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Loading…"
- Source: `js/app/state.js` (`openFile`)
- Flag: to confirm. Three different words say the app is busy: "Loading…" here, "Opening the front…" for a side switch and "Detecting…" on Perspective.
- Cases: none yet

## MSG-07 A HEIC photo the browser can't open

An error message, for 6 seconds, when the browser can't decode a HEIC photo: "This browser can’t open HEIC. Save the photo as JPEG first (Safari opens HEIC directly)." It also shows when a pair's other side is such a photo and **Front** or **Back** is tapped.

- Risk: medium
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "This browser can’t open HEIC. Save the photo as JPEG first", "(Safari opens HEIC directly)."
- Source: `js/app/adapters.js` (`ImageSource.load`, `ImageSource.isHeic`); `js/app/state.js` (`openFile`); `js/app/pair.js` (`switchSide`)
- Cases: none yet

## MSG-08 A file that isn't a photo

An error message, for 6 seconds, when any other file can't be decoded as a photo: "Couldn’t read that file as an image." It also shows when a pair's other side can't be decoded after a tap on **Front** or **Back**.

- Risk: medium
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Couldn’t read that file as an image."
- Source: `js/app/adapters.js` (`ImageSource.load`); `js/app/state.js` (`openFile`); `js/app/pair.js` (`switchSide`)
- Cases: none yet

## MSG-09 "Resumed where you left off."

An information message, "Resumed where you left off.", after **Resume**, when the stored photo is the same size as the saved edits. When the sizes differ, the photo opens with fresh edits and no message.

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Resumed where you left off.", `#btnResume`
- Source: `js/app/state.js` (`openFile`); `js/app/start-screen.js` (`resumeSession`)
- Ruling: R23. When the saved edits don't fit the stored photo, an amber warning says the edits couldn't be restored and the photo was opened fresh. New wording, to be approved by Rich. The app differs today.
- Cases: none yet

## MSG-10 "No card-shaped edges found."

A warning, for 5 seconds, when a detection the user started finds nothing: "No card-shaped edges found. Drag the corners into place, or tap to find card and tap the card again." The user starts one with **Tap to find card**, by turning on **Debug overlay**, or from the tuning panel (opening it, **Re-detect**, or a changed setting); detection on opening a photo never shows it.

- Risk: medium
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "No card-shaped edges found.", "Drag the corners into place, or tap to find card and tap the card again."
- Source: `js/app/state.js` (`runDetect`); `js/app/perspective.js` (`bindPerspective`); `js/app/debug-panel.js` (`toggleDebugPanel`, `buildDebugPanel`)
- Ruling: R3. Turning on **Debug overlay** only draws; it runs no detection and leaves the corners alone. The app differs today.
- Flag: to confirm. The row above the controls says "Nothing detected. Drag the corners into place." at the same time, so one condition shows in two wordings; the message also says "tap" on a desktop.
- Cases: none yet

## MSG-11 "Detection failed: …"

An error message, for 6 seconds, when detection throws: "Detection failed: " followed by the error's own text. An error from the background worker arrives as its whole stack trace.

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Detection failed: "
- Source: `js/app/state.js` (`runDetect`); `js/app/adapters.js` (`EngineWorker.call`)
- Ruling: R24. A fixed sentence with a next step replaces the raw error text, and the detail always goes to the console. New wording, to be approved by Rich. The app differs today.
- Cases: none yet

## MSG-12 "The saved photo is gone."

A warning, for 5 seconds, when **Resume** is tapped and the stored photo is missing or not usable: "The saved photo is gone. Open it again."

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "The saved photo is gone. Open it again.", `#btnResume`
- Source: `js/app/start-screen.js` (`resumeSession`)
- Cases: none yet

## MSG-13 "Couldn’t resume: …"

An error message, for 6 seconds, when anything else fails during **Resume**: "Couldn’t resume: " followed by the error's own text.

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Couldn’t resume: ", `#btnResume`
- Source: `js/app/start-screen.js` (`resumeSession`)
- Ruling: R24. A fixed sentence with a next step replaces the raw error text, and the detail always goes to the console. New wording, to be approved by Rich. The app differs today.
- Cases: none yet

## MSG-14 The self-test result

Opening the app with `?selftest` in its link runs the engine's self-tests and shows "Self-tests: main {passed}/{total}, worker {passed}/{total}" (or "…, worker unavailable") for 8 seconds: white when every test passes, red when any fails.

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Self-tests: main ", ", worker unavailable"
- Source: `js/app/main.js` (`runSelfTests`, `init`)
- Ruling: R28. `?selftest=0` means off: no self-tests and no message. The app differs today.
- Cases: none yet

## MSG-15 "Couldn’t estimate levels from this image."

A warning, for 5 seconds, when **Auto** on Levels finds no white point, or the corners are invalid: "Couldn’t estimate levels from this image."

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Couldn’t estimate levels from this image.", `#toolAutoLevels`
- Source: `js/app/levels.js` (`autoLevelsDraft`, `renderSmall`)
- Flag: to confirm. The message gives no next step.
- Cases: none yet

## MSG-16 Auto set both points

An information message when **Auto** finds both points: "Auto set white and black points. Check them, then Apply."

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Auto set white and black points. Check them, then Apply.", `#toolAutoLevels`
- Source: `js/app/levels.js` (`autoLevelsDraft`)
- Flag: to confirm. Auto confirms itself with a message, while arming a pick shows none by design.
- Cases: none yet

## MSG-17 Auto set the white point only

An information message when **Auto** finds a white point but no clear black: "Auto set the white point (no clear black). Check it, then Apply."

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Auto set the white point (no clear black). Check it, then Apply.", `#toolAutoLevels`
- Source: `js/app/levels.js` (`autoLevelsDraft`)
- Flag: to confirm. Auto confirms itself with a message, while arming a pick shows none by design.
- Cases: none yet

## MSG-18 "That spot is outside the photo."

A warning, for 5 seconds, when an armed **Pick white** or **Pick black** is released off the photo: "That spot is outside the photo." The pick stays armed.

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "That spot is outside the photo.", `#levelsPicks`
- Source: `js/app/levels.js` (`pickAt`)
- Cases: none yet

## MSG-19 A white pick darker than the black point

A warning, for 5 seconds, when a **Pick white** spot is not at least 20 brightness levels above the black point: "That spot is darker than the black point. Pick something brighter." The pick stays armed.

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "That spot is darker than the black point. Pick something brighter.", `#levelsPicks`
- Source: `js/app/levels.js` (`pickProblem`, `pickAt`)
- Cases: none yet

## MSG-20 A black pick that is too light

A warning, for 5 seconds, when a **Pick black** spot is brighter than the black-point limit (100 of 255): "That spot is too light to be a black point. Pick something dark, or skip the black point." The pick stays armed.

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "That spot is too light to be a black point. ", "Pick something dark, or skip the black point.", `CONFIG.levels.maxBlackLuma`
- Source: `js/app/levels.js` (`pickProblem`, `pickAt`)
- Cases: none yet

## MSG-21 A black pick brighter than the white point

A warning, for 5 seconds, when a **Pick black** spot is not at least 20 brightness levels below the white point: "That spot is brighter than the white point. Pick something darker." The pick stays armed.

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "That spot is brighter than the white point. Pick something darker.", `#levelsPicks`
- Source: `js/app/levels.js` (`pickProblem`, `pickAt`)
- Cases: none yet

## MSG-22 "Exported … px in … s." for a single photo

An information message after a single photo's **Download**, or after **Share** finishes or waits for **Share now**: "Exported {width} × {height} px in {seconds} s." After **Yes** on the Upscale question it gives the upscaled size.

- Risk: medium
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Exported ", `#btnDownload`, `#btnShare`
- Source: `js/app/export.js` (`deliverExport`, `toastSaved`)
- Cases: none yet

## MSG-23 "Exported the Together image in … s."

An information message after a pair's **Download** or **Share** with **Together** chosen: "Exported the Together image in {seconds} s."

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "the Together image", `#pairOutput`
- Source: `js/app/pair.js` (`deliverPair`); `js/app/export.js` (`toastSaved`)
- Cases: none yet

## MSG-24 "Exported the front and back in … s."

An information message after a pair's **Download** or **Share** with **Separately** chosen: "Exported the front and back in {seconds} s."

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "the front and back", `#pairOutput`
- Source: `js/app/pair.js` (`deliverPair`); `js/app/export.js` (`toastSaved`)
- Cases: none yet

## MSG-25 "Saved the corner sheet in … s."

An information message after **Download corners** or **Share corners** with **1 sheet** chosen: "Saved the corner sheet in {seconds} s.", or after **Yes** on the Upscale question "Saved the corner sheet at 2000 px in {seconds} s."

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "the corner sheet", `#btnCornerDownload`, `#btnCornerShare`, `CONFIG.cornerShots.upscaleTargetPx`
- Source: `js/app/corner-shots.js` (`deliverCornerShots`); `js/app/export.js` (`toastSaved`)
- Flag: to confirm. Corner shots say "Saved", while the main export and a pair say "Exported".
- Cases: none yet

## MSG-26 "Saved 4 corner shots in … s."

An information message after **Download corners** or **Share corners** with **4 photos** chosen: "Saved 4 corner shots in {seconds} s.", or after **Yes** on the Upscale question "Saved 4 corner shots at 2000 px in {seconds} s."

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: " corner shots", `#btnCornerDownload`, `#btnCornerShare`, `CONFIG.cornerShots.upscaleTargetPx`
- Source: `js/app/corner-shots.js` (`deliverCornerShots`); `js/app/export.js` (`toastSaved`)
- Flag: to confirm. Corner shots say "Saved", while the main export and a pair say "Exported".
- Cases: none yet

## MSG-27 The format the browser couldn't save

When the browser saves another format than the one chosen (Safari has no WebP encoder), the finished-export message gains a sentence, "{CHOSEN} isn’t supported by this browser, so it was saved as {SAVED}." (for example WEBP and PNG), and shows as an amber warning for 6 seconds. It applies to the main export, a pair and corner shots.

- Risk: medium
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: " isn’t supported by this browser, so it was saved as ", `#exportFormat`
- Source: `js/app/export.js` (`fallbackNote`, `toastSaved`)
- Flag: to confirm. The sentence says what happened after the fact and gives no next step.
- Cases: none yet

## MSG-28 "Tap Share now to open the share sheet."

When the browser refuses to share because the tap was too long ago (a slow export), the finished-export message gains "Tap Share now to open the share sheet." and stays 6 seconds (white, or amber with MSG-27's sentence). Tapping **Share now** takes it down.

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Tap Share now to open the share sheet.", `#btnShare`, `#btnCornerShare`
- Source: `js/app/export.js` (`toastSaved`, `sharePending`); `js/app/corner-shots.js` (`shareCornerShots`)
- Flag: to confirm. The message says "Tap" on a desktop too.
- Cases: none yet

## MSG-29 "Copied to clipboard (PNG)."

An information message after **Copy** puts a single photo, or a pair's Together image, on the clipboard: "Copied to clipboard (PNG)."

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Copied to clipboard (PNG).", `#btnCopy`
- Source: `js/app/export.js` (`runExport`); `js/app/pair.js` (`runPairExport`)
- Cases: none yet

## MSG-30 "Copy failed: …"

An error message, for 6 seconds, when anything fails during **Copy**: "Copy failed: " followed by the error's own text.

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Copy failed: ", `#btnCopy`
- Source: `js/app/export.js` (`runExport`); `js/app/pair.js` (`runPairExport`)
- Ruling: R24. A fixed sentence with a next step replaces the raw error text, and the detail always goes to the console. New wording, to be approved by Rich. The app differs today.
- Cases: none yet

## MSG-31 "Export failed: …"

An error message, for 6 seconds, when **Download** or **Share** fails, or when working out a pair's Upscale question fails: "Export failed: " followed by the error's text. The app's own texts that can follow are "Encoding failed (image too large for this browser?)", "The overlay image isn’t loaded. Open the Overlay step and add it again.", MSG-47's photo-not-loaded text, and a corner fault of a pair's waiting side, with the engine's dash kept.

- Risk: medium
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Export failed: ", "Encoding failed (image too large for this browser?)", "The overlay image isn’t loaded. Open the Overlay step and add it again."
- Source: `js/app/export.js` (`runExport`, `toBlob`, `exportGeometry`, `renderWarped`); `js/app/overlay.js` (`compositeOverlay`); `js/app/pair.js` (`exportPair`, `runPairExport`, `renderSideInto`)
- Ruling: R24. A fixed sentence with a next step replaces the raw error text, and the detail always goes to the console (today a failed pair Upscale question is not logged). New wording, to be approved by Rich. The app differs today.
- Cases: none yet

## MSG-32 "Share failed: …"

An error message, for 6 seconds, when the share sheet fails for any reason other than the user cancelling it or a refusal that **Share now** can finish: "Share failed: " followed by the error's text. It covers the main export, a pair, corner shots and **Share now**; nothing is written to the console.

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Share failed: ", `#btnShare`
- Source: `js/app/export.js` (`shareFiles`)
- Ruling: R24. A fixed sentence with a next step replaces the raw error text, and the detail always goes to the console. New wording, to be approved by Rich. The app differs today.
- Cases: none yet

## MSG-33 An edits file that is too large

An error message, for 6 seconds, when **Load edits** is given a file over 8 MB: "That file is too large to be a Card Finisher edits file."

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "That file is too large to be a Card Finisher edits file.", `#btnLoadEdits`, `CONFIG.export.editsMaxBytes`
- Source: `js/app/export.js` (`loadEdits`)
- Cases: none yet

## MSG-34 An edits file that isn't JSON

An error message, for 6 seconds, when **Load edits** is given a file that can't be read as JSON: "That file isn’t valid JSON."

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "That file isn’t valid JSON.", `#btnLoadEdits`
- Source: `js/app/export.js` (`loadEdits`)
- Cases: none yet

## MSG-35 A file that isn't an edits file

An error message, for 6 seconds, when **Load edits** is given JSON of the wrong shape or version: "That isn’t a Card Finisher edits file."

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "That isn’t a Card Finisher edits file.", `#btnLoadEdits`
- Source: `js/app/export.js` (`loadEdits`, `looksLikeEdits`)
- Cases: none yet

## MSG-36 Edits loaded with no photo open

A warning, for 5 seconds, when an edits file is loaded with no photo open: "Open the matching photo first, then load its edits." **Load edits** is dimmed until a photo is open, so the buttons can't reach it; only a file handed straight to the hidden edits picker can.

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Open the matching photo first, then load its edits.", `#editsInput`
- Source: `js/app/export.js` (`loadEdits`); `js/app/shell.js` (`syncUI`)
- Cases: none yet

## MSG-37 Edits for a photo of another size

An error message, for 6 seconds, when the edits file was saved for a photo of another size; nothing is applied: "These edits are for a {width}×{height} photo; this one is {width}×{height}."

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "These edits are for a ", " photo; this one is "
- Source: `js/app/export.js` (`loadEdits`)
- Flag: to confirm. This message writes sizes as "W×H" with no spaces; every other message and readout writes "W × H".
- Cases: none yet

## MSG-38 Edits saved for a file of another name

A warning, for 5 seconds, when the edits file's photo name differs but the size matches; the edits are applied: "Edits were saved for “{name}”. Applied anyway — sizes match." The name is cut to 60 characters, or reads "another photo" when the file has none.

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Edits were saved for “", "Applied anyway — sizes match.", "another photo"
- Source: `js/app/export.js` (`loadEdits`); `js/app/core.js` (`shortText`)
- Ruling: R12. Load edits shows one combined warning of up to three short lines, instead of up to three messages that replace each other before they can be read. New wording, to be approved by Rich. The app differs today.
- Flag: to confirm. This message uses an em dash where most messages use two sentences.
- Cases: none yet

## MSG-39 Settings in the edits file that were reset

A warning, for 6 seconds, when some fields of the edits file weren't valid and fell back to their defaults: "Some settings in these edits weren’t valid and were reset: {fields}." The fields are a comma list of their names.

- Risk: medium
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Some settings in these edits weren’t valid and were reset: "
- Source: `js/app/export.js` (`loadEdits`)
- Ruling: R12. Load edits shows one combined warning of up to three short lines, instead of up to three messages that replace each other before they can be read. New wording, to be approved by Rich. The app differs today.
- Cases: none yet

## MSG-40 A logo in the edits file that can't be read

A warning, for 5 seconds, when the logo inside the edits file is missing or unusable; the edits are applied without it: "The overlay in these edits couldn’t be read, so it was left out."

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "The overlay in these edits couldn’t be read, so it was left out."
- Source: `js/app/export.js` (`loadEdits`); `js/app/overlay.js` (`overlayFromEdits`)
- Ruling: R12. Load edits shows one combined warning of up to three short lines, instead of up to three messages that replace each other before they can be read. New wording, to be approved by Rich. The app differs today.
- Cases: none yet

## MSG-41 "CONFIG copied."

An information message after **Copy CONFIG** in the detection tuning panel puts the settings on the clipboard: "CONFIG copied."

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "CONFIG copied.", `#debugCopy`
- Source: `js/app/debug-panel.js` (`buildDebugPanel`)
- Cases: none yet

## MSG-42 "Clipboard blocked — CONFIG printed to the console."

A warning, for 5 seconds, when **Copy CONFIG** can't reach the clipboard and prints the settings to the console instead: "Clipboard blocked — CONFIG printed to the console."

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Clipboard blocked — CONFIG printed to the console.", `#debugCopy`
- Source: `js/app/debug-panel.js` (`buildDebugPanel`)
- Flag: to confirm. This message uses an em dash where most messages use two sentences.
- Cases: none yet

## MSG-43 A logo that can't be kept in the browser

A warning, for 5 seconds, when a logo is added but the browser won't store it for the next photo: "This overlay works on this photo, but it can’t be saved in this browser."

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "This overlay works on this photo, but it can’t be saved in this browser."
- Source: `js/app/overlay.js` (`saveToBrowser`)
- Flag: to confirm. The message says "overlay" where the buttons say "logo", and it gives no next step.
- Cases: none yet

## MSG-44 "Opening the front…" and "Opening the back…"

An information message while the other side of a pair is decoded after a tap on **Front** or **Back** (or when **Keep front** or **Keep back** keeps the side not on screen): "Opening the front…" or "Opening the back…". It is taken down when that side shows.

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Opening the ", `#sideSwitch`
- Source: `js/app/pair.js` (`switchSide`)
- Flag: to confirm. Three different words say the app is busy: "Loading…", "Opening the front…" here and "Detecting…" on Perspective.
- Cases: none yet

## MSG-45 "Unpaired. The front is a single photo now."

An information message after **Keep front** or **Keep back** on the Unpair card: "Unpaired. The front is a single photo now." or "Unpaired. The back is a single photo now."

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Unpaired. The ", " is a single photo now.", `#btnUnpair`
- Source: `js/app/pair.js` (`unpair`)
- Ruling: R25. The kept side's photo is stored before the message shows, so a reload at that moment resumes the right photo. The app differs today.
- Cases: none yet

## MSG-46 "Wait for the export to finish, then open the photo."

A warning, for 5 seconds, when a photo arrives (picker, drop or paste) while an export runs: "Wait for the export to finish, then open the photo." The same message shows while a side switch or the back's first opening is under way, when no export runs.

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Wait for the export to finish, then open the photo."
- Source: `js/app/pair.js` (`receivePhoto`)
- Ruling: R13. During a side switch the warning says to wait for the other side to open (proposed: "Wait for the other side to open, then open the photo."); during an export the wording stays. New wording, to be approved by Rich. The app differs today.
- Cases: none yet

## MSG-47 The photo isn't loaded after a pair's export

A warning, for 8 seconds, when the open side's photo can't be decoded again after a pair's export, after two tries: "The photo isn’t loaded after the last export. Tap Front or Back to switch sides, then switch back."

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "The photo isn’t loaded after the last export. ", "Tap Front or Back to switch sides, then switch back."
- Source: `js/app/pair.js` (`runPairExport`, `reloadOpenPhoto`); `js/app/export.js` (`renderWarped`)
- Flag: to confirm. The message says "Tap" on a desktop too.
- Cases: none yet

## MSG-48 "The saved pair wasn’t valid, so it was reset."

A warning, for 6 seconds, after **Resume** when the stored pair or its other photo couldn't be rebuilt; the open side resumes on its own: "The saved pair wasn’t valid, so it was reset. This photo resumed on its own." It replaces "Resumed where you left off." at once.

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "The saved pair wasn’t valid, so it was reset. ", "This photo resumed on its own."
- Source: `js/app/pair.js` (`restorePair`, `finishResume`)
- Cases: none yet

## MSG-49 Corner shots that can't be made

An error message, for 5 seconds, when **Share corners** or **Download corners** is tapped and the engine can't make the corner shots. It carries the engine's reason: "The card is too small for corner shots." or, for a frame the engine can't invert, "Transform is not invertible."

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "The card is too small for corner shots.", `#btnCornerShare`, `#btnCornerDownload`
- Source: `js/app/corner-shots.js` (`saveCornerShots`, `renderAndSave`); `js/engine.js` (`cornerShots`)
- Ruling: R20. When corner shots can't be made, the readout gives the real reason and both save buttons are dimmed. The app differs today.
- Flag: to confirm. This error stays 5 seconds, while every other error stays 6.
- Cases: none yet

## MSG-50 "Corner shots failed: …"

An error message, for 6 seconds, when anything fails while corner shots are rendered or saved: "Corner shots failed: " followed by the error's own text.

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Corner shots failed: "
- Source: `js/app/corner-shots.js` (`renderAndSave`)
- Ruling: R24. A fixed sentence with a next step replaces the raw error text, and the detail always goes to the console. New wording, to be approved by Rich. The app differs today.
- Cases: none yet

## MSG-51 "Tap the card in the photo." with Cancel

While **Tap to find card** is armed, the row above Perspective's controls reads "Tap the card in the photo." with a grey information icon and a **Cancel** button that disarms it. Changing step or side disarms it too.

- Risk: medium
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Tap the card in the photo.", `#perspectiveStatus`, `#perspectiveStatusAction`, `#btnFindCard`
- Source: `js/app/perspective.js` (`perspectiveStatus`, `bindPerspective`, `syncPerspectiveReadouts`); `js/app/parts/status.js` (`updateStatus`)
- Cases: none yet

## MSG-52 Corners that cross or fold inward

When the corners cross or fold inward, the row above Perspective's controls reads "Corners cross or fold inward. Drag them back into a convex shape." with a red error icon. The engine words it with a dash, and Perspective rewrites it as two sentences.

- Risk: medium
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Corners cross or fold inward", `#perspectiveStatus`
- Source: `js/app/perspective.js` (`perspectiveStatus`, `asSentences`); `js/engine.js` (`Quad.validate`)
- Cases: none yet

## MSG-53 Two corners too close together

When two corners are closer than 8 photo pixels, the row above Perspective's controls reads "Two corners are too close together." with a red error icon.

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Two corners are too close together.", `#perspectiveStatus`, `CONFIG.minCornerDistPx`
- Source: `js/app/perspective.js` (`perspectiveStatus`); `js/engine.js` (`Quad.validate`)
- Cases: none yet

## MSG-54 The other corner faults

For the engine's remaining faults the row above Perspective's controls shows, with a red error icon, "Corners are missing or invalid.", "Could not solve the perspective for these corners.", "Crop is empty." or "Transform is not invertible."

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Corners are missing or invalid.", "Could not solve the perspective for these corners.", "Crop is empty.", "Transform is not invertible."
- Source: `js/app/perspective.js` (`perspectiveStatus`); `js/engine.js` (`Quad.validate`, `computeGeometry`)
- Flag: to confirm. These state a fault with no action to take, and "Could not" is written out where other messages say "Couldn’t".
- Cases: none yet

## MSG-55 "Detecting…"

While a detection runs, the row above Perspective's controls reads "Detecting…" with a grey information icon.

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Detecting…", `#perspectiveStatus`
- Source: `js/app/state.js` (`runDetect`); `js/app/perspective.js` (`perspectiveStatus`)
- Flag: to confirm. The line takes the row though there is nothing to act on, and three different words say the app is busy ("Loading…", "Opening the front…", "Detecting…").
- Cases: none yet

## MSG-56 "Low confidence (…%). Check the corners."

When the detected card in use scores under 50% confidence, the row above Perspective's controls reads "Low confidence ({percent}%). Check the corners." with an amber warning icon. Today it stays until another detection runs.

- Risk: medium
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Low confidence (", "%). Check the corners.", `CONFIG.detect.minConfidence`
- Source: `js/app/perspective.js` (`perspectiveStatus`, `syncPerspectiveReadouts`)
- Ruling: R7. The warning clears after the first corner move, by drag or nudge. The app differs today.
- Cases: none yet

## MSG-57 "Nothing detected. Drag the corners into place."

After a detection run finds no card, the row above Perspective's controls reads "Nothing detected. Drag the corners into place." with an amber warning icon. Today it stays until another detection runs.

- Risk: medium
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Nothing detected. Drag the corners into place.", `#perspectiveStatus`
- Source: `js/app/perspective.js` (`perspectiveStatus`)
- Ruling: R7. The warning clears after the first corner move, by drag or nudge. The app differs today.
- Flag: to confirm. After a search the user started, the message "No card-shaped edges found…" shows at the same time, so one condition shows in two wordings.
- Cases: none yet

## MSG-58 "Corrected frame clamped to 12000px on the long side."

When the perspective-corrected frame would be larger than the 12000 px cap, the row above Perspective's controls reads "Corrected frame clamped to 12000px on the long side." with a grey information icon.

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Corrected frame clamped to ", "px on the long side.", `CONFIG.maxOutputPx`
- Source: `js/app/perspective.js` (`perspectiveStatus`)
- Flag: to confirm. The line takes the row though there is nothing to act on, and writes "12000px" with no space where everything else writes "2000 px".
- Cases: none yet

## MSG-59 A logo file of a type that isn't supported

On Overlay, when the picked, dropped or pasted file isn't PNG, WebP, JPEG or SVG (by its type or its name), the row above the controls reads "That file type isn’t supported. Use PNG, WebP, JPG or SVG." with a red error icon. It stays until a logo is added, the step is left or the logo next changes.

- Risk: medium
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "That file type isn’t supported. Use PNG, WebP, JPG or SVG.", `#overlayStatus`, `#btnOverlayAdd`
- Source: `js/app/overlay.js` (`addOverlayFile`, `imageTypeOf`, `setMessage`, `syncOverlay`); `js/app/shell.js` (`setTab`)
- Cases: none yet

## MSG-60 A logo file over the size limit

On Overlay, when the logo file is larger than the limit, the row above the controls reads "That file is {size} MB. The overlay limit is 5 MB." with a red error icon. The limit shown follows the setting, so a link that lowers it shows the lower figure.

- Risk: medium
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: " MB. The overlay limit is ", `#overlayStatus`, `CONFIG.overlay.maxBytes`
- Source: `js/app/overlay.js` (`addOverlayFile`, `setMessage`, `syncOverlay`)
- Flag: to confirm. The message says "overlay" where the buttons say "logo".
- Cases: none yet

## MSG-61 A logo image that can't be read

On Overlay, when a logo file can't be decoded, or **Use saved overlay** can't read the stored logo, the row above the controls reads "Couldn’t read that image. Try another PNG, WebP, JPG or SVG file." with a red error icon.

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Couldn’t read that image. Try another PNG, WebP, JPG or SVG file.", `#overlayStatus`, `#btnUseSaved`
- Source: `js/app/overlay.js` (`addOverlayFile`, `useSaved`, `setMessage`)
- Cases: none yet

## MSG-62 An SVG logo with no size

On Overlay, when an SVG logo has no width, height or viewBox, the row above the controls reads "That SVG has no width, height or viewBox, so it can’t be sized. Re-export it with a size." with a red error icon.

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "That SVG has no width, height or viewBox, so it can’t be sized. ", "Re-export it with a size.", `#overlayStatus`
- Source: `js/app/overlay.js` (`svgSize`, `decodeSvg`, `addOverlayFile`)
- Cases: none yet

## MSG-63 Preview's two lines

With **Preview** on, the row above Perspective's controls reads "Preview" (in capitals) and "The corrected card. Handles are hidden.", and the controls row reads "Pinch to zoom, drag to pan. Tap Preview again for the corners."

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#perspectivePreviewLine`, `#perspectivePreviewRow`, "The corrected card. Handles are hidden.", "Pinch to zoom, drag to pan. Tap Preview again for the corners."
- Source: `js/app/perspective.js` (`buildPerspectiveControls`, `syncPerspective`, `syncPerspectiveReadouts`)
- Cases: none yet

## MSG-64 Flip's line

With **Flip** chosen on Rotate, the row above the controls reads "Flip" (in capitals) and "as you see it on screen".

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#rotateFlipLine`, "as you see it on screen", `#toolFlip`
- Source: `js/app/rotate.js` (`buildFlipLine`, `syncRotate`)
- Cases: none yet

## MSG-65 "Pair: 5:7 only"

While a pair is open, Crop's size line ends with "Pair: 5:7 only" at its right.

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Pair: 5:7 only", `#cropPairNote`
- Source: `js/app/crop.js` (`buildCropLine`, `syncCrop`)
- Cases: none yet

## MSG-66 "Pick white, or try Auto"

On Levels, between **Discard** and **Apply**, the instruction reads "Pick white, or try Auto" when no pick is armed and the photo shows no levels.

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Pick white, or try Auto", `#levelsHint`
- Source: `js/app/levels.js` (`levelsHint`, `syncLevels`)
- Cases: none yet

## MSG-67 "Tap something white"

On Levels, while **Pick white** is armed, the instruction reads "Tap something white". It stays as long as the pick is armed, and no message pops up.

- Risk: medium
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Tap something white", `#levelsHint`, `#levelsPicks`
- Source: `js/app/levels.js` (`levelsHint`, `syncLevels`, `armDropper`)
- Cases: none yet

## MSG-68 "Tap something black"

On Levels, while **Pick black** is armed, the instruction reads "Tap something black".

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Tap something black", `#levelsHint`, `#levelsPicks`
- Source: `js/app/levels.js` (`levelsHint`, `syncLevels`, `armDropper`)
- Cases: none yet

## MSG-69 "Hold the photo to compare"

On Levels, when the photo shows levels (unapplied or applied) and no pick is armed, the instruction reads "Hold the photo to compare".

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Hold the photo to compare", `#levelsHint`
- Source: `js/app/levels.js` (`levelsHint`, `syncLevels`)
- Cases: none yet

## MSG-70 Overlay's hint with no logo placed

On Overlay with no logo placed and no file error, the row above the controls reads "Add a logo or watermark: PNG, WebP, JPG or SVG, up to 5 MB."

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Add a logo or watermark: PNG, WebP, JPG or SVG, up to 5 MB.", `#overlayHintLine`, `CONFIG.overlay.maxBytes`
- Source: `js/app/overlay.js` (`buildOverlayControls`, `syncOverlay`)
- Ruling: R11. With invalid corners, **Add logo**, **Use saved overlay** and **Replace logo** are dimmed and this row reads "Fix the corners in Perspective first." The app differs today.
- Flag: to confirm. The hint always says 5 MB, though a link can lower the limit, which the size error (MSG-60) does follow.
- Cases: none yet

## MSG-71 Export's unapplied-levels note

Under Export's size line, with an amber warning mark, while Levels has changes not yet applied: "Levels has unapplied changes; export uses the applied levels."

- Risk: medium
- Check: script
- Layout: both. A phone shows one note at a time, in the order unapplied levels, canvas limit, JPEG; a wide screen lists them all. None shows while the corners are invalid.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Levels has unapplied changes; export uses the applied levels.", `#exportMessage`, `.export-note`
- Source: `js/app/export-controls.js` (`exportNotes`, `buildNote`, `syncExportReadouts`)
- Cases: none yet

## MSG-72 Export's canvas-limit note

Under Export's size line, with an amber warning mark, when the output (or a pair's Together image) is scaled down to fit the canvas area limit: "Clamped to fit the 16.8 MP canvas limit." The figure is worked out from the limit and rounded, so today it reads 16.8; for a pair saved **Separately** only the open side is checked.

- Risk: low
- Check: script
- Layout: both. A phone shows one note at a time, in the order unapplied levels, canvas limit, JPEG; a wide screen lists them all. None shows while the corners are invalid.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Clamped to fit the ", " MP canvas limit.", `#exportMessage`, `CONFIG.maxOutputArea`
- Source: `js/app/export-controls.js` (`exportNotes`, `syncExportReadouts`); `js/app/pair.js` (`pairReadout`, `togetherLayout`)
- Ruling: R14. For a pair saved Separately the note shows when either side is clamped, and names the side when it is not the one on screen. New wording, to be approved by Rich. R15. The note shows 16.7 MP, rounded down. The app differs today.
- Flag: to confirm. The note informs but gives no next step.
- Cases: none yet

## MSG-73 Export's JPEG transparency note

Under Export's size line, with an amber warning mark, when Format is **JPEG** and **Fill outside photo** is Transparent: "JPEG has no transparency; empty areas will be white."

- Risk: low
- Check: script
- Layout: both. A phone shows one note at a time, in the order unapplied levels, canvas limit, JPEG; a wide screen lists them all. None shows while the corners are invalid.
- Added: 1.10 baseline
- Changed: none
- Anchors: "JPEG has no transparency; empty areas will be white.", `#exportMessage`, `#exportFormat`
- Source: `js/app/export-controls.js` (`exportNotes`, `syncExportReadouts`)
- Ruling: R16. **Copy** with JPEG and a Transparent fill copies a PNG with white corners, as this note and **Download** say. The app already does this.
- Cases: none yet

## MSG-74 "the card is too small" on Corner shots

In the Corner shots sheet, when the engine can't make corner shots for any reason, the size line reads "Sheet · the card is too small" or "4 photos · the card is too small", and **Share corners** and **Download corners** stay live.

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "the card is too small", `#cornerReadout`
- Source: `js/app/corner-shots.js` (`readout`, `syncCornerShots`, `currentShots`)
- Ruling: R20. The size line gives the real reason, and both save buttons are dimmed. The app differs today.
- Cases: none yet

## MSG-75 The Upscale question for a single photo

When **Download**, **Share** or **Copy** would save a crop whose long edge is under the chosen Size, a card over the photo asks "Upscale to {Size} px?" with "The crop is {width} × {height} px at the photo’s resolution.", **Yes** (red), **No** and **Cancel**.

- Risk: medium
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Upscale to ", "The crop is ", `#pairPrompt`, `#btnPromptFirst`
- Source: `js/app/export.js` (`askUpscale`, `offeredUpscale`, `doExport`); `js/app/pair.js` (`showPrompt`); `js/app/parts/alert-card.js` (`showAlert`)
- Cases: none yet

## MSG-76 The Upscale question for a pair's Together image

For a pair with **Together** chosen, or a pair's **Copy**, when the joined image's long edge is under the chosen Size, the card's text reads "The image is {width} × {height} px at the photos’ resolution."

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "The image is ", " px at the photos’ resolution.", `#pairPrompt`
- Source: `js/app/pair.js` (`pairUpscaleOffer`, `exportPair`); `js/app/export.js` (`askUpscale`)
- Cases: none yet

## MSG-77 The Upscale question for a pair saved Separately

For a pair with **Separately** chosen, when either side's file would be under the chosen Size, the card's text reads "The front is {width} × {height} px and the back {width} × {height} px at the photos’ resolution."

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "The front is ", " px and the back ", `#pairPrompt`
- Source: `js/app/pair.js` (`pairUpscaleOffer`, `exportPair`); `js/app/export.js` (`askUpscale`)
- Cases: none yet

## MSG-78 The Upscale question for corner shots

When a corner file would be under 2000 px, **Share corners** and **Download corners** ask "Upscale to 2000 px?" with "The sheet is {size} px at the photo’s resolution." or "Each corner is {size} px at the photo’s resolution." The card lies above the open Corner shots sheet.

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "The sheet is", "Each corner is", " px at the photo’s resolution.", `CONFIG.cornerShots.upscaleTargetPx`
- Source: `js/app/corner-shots.js` (`saveCornerShots`); `js/app/export.js` (`askUpscale`)
- Cases: none yet

## MSG-79 The Unpair card

**Unpair** in the top bar asks, on a card over the photo, "Unpair" with "Keep one side as a single photo.", **Keep front** and **Keep back** (neither is red) and **Cancel**.

- Risk: medium
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Keep one side as a single photo.", "Keep front", "Keep back", `#btnUnpair`
- Source: `js/app/pair.js` (`askUnpair`, `showPrompt`)
- Cases: none yet

## MSG-80 The New photo card

Open, drop or paste while a pair is open asks, on a card over the photo, "New photo" with "End the pair, or replace the side you’re on?", **New photo**, **Replace front** or **Replace back** (the side on screen) and **Cancel**. **Next card** and **Add back** don't ask.

- Risk: medium
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "End the pair, or replace the side you’re on?", "Replace ", `#pairPrompt`, `#btnPromptSecond`
- Source: `js/app/pair.js` (`receivePhoto`, `showPrompt`)
- Flag: to confirm. The card's title and its first button both read "New photo".
- Cases: none yet

## MSG-81 "Fix the corners in Perspective first." on the photo

When the corners are invalid, "Fix the corners in Perspective first." is drawn in grey at the center of the photo area in place of the picture, on every step except Perspective's corner view.

- Risk: medium
- Check: eye
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Fix the corners in Perspective first."
- Source: `js/app/view.js` (`draw`, `drawMessage`)
- Flag: to confirm. It also shows on Perspective itself while **Preview** is on.
- Cases: none yet

## MSG-82 "Fix the corners of both sides in Perspective first." on the photo

On Export for a pair with **Together** chosen, when either side's corners are invalid, "Fix the corners of both sides in Perspective first." is drawn in grey in place of the joined image.

- Risk: low
- Check: eye
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Fix the corners of both sides in Perspective first."
- Source: `js/app/view.js` (`drawTogether`, `drawMessage`)
- Ruling: R26. With the waiting side's corners invalid, the row under Export's size names the side to fix (proposed: "Fix the back’s corners in Perspective first.") and **Share**, **Download** and **Copy** are dimmed. New wording, to be approved by Rich. The app differs today.
- Cases: none yet

## MSG-83 Perspective's tips

**Tips** in "Perspective options" opens four paragraphs in place: dragging and double-tapping handles, "The arrows nudge the selected handle. Hold one to repeat.", what Flatten's 0% and 100% do, and "Corners on the wrong card? Tap to find card, then tap the card."

- Risk: low
- Check: script
- Layout: both. A wide screen lists the tips always open under "Tips and keys" and leaves out the first, which is about touch.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#perspectiveTips`, "The arrows nudge the selected handle. Hold one to repeat.", "Corners on the wrong card? Tap to find card, then tap the card."
- Source: `js/app/perspective.js` (`buildPerspectiveSheet`); `js/app/parts/sheet.js` (`buildTipsRow`, `buildTipHint`)
- Cases: none yet

## MSG-84 Rotate's tips

**Tips** in "Rotate options" opens four paragraphs: the ruler and the typed angle ("Drag the ruler to straighten, or tap the angle to type it."), **Fill frame**, **Flip**, and "The grid is a guide; it is never exported."

- Risk: low
- Check: script
- Layout: both. A wide screen lists the tips always open under "Tips and keys".
- Added: 1.10 baseline
- Changed: none
- Anchors: `#rotateTips`, "Drag the ruler to straighten, or tap the angle to type it.", "The grid is a guide; it is never exported."
- Source: `js/app/rotate.js` (`buildRotateControls`); `js/app/parts/sheet.js` (`buildTipsRow`)
- Cases: none yet

## MSG-85 Crop's tip

**Tips** in "Crop options" opens one paragraph: "Drag inside the box to move it, and its handles to resize."

- Risk: low
- Check: script
- Layout: both. A wide screen lists the tip always open under "Tips and keys".
- Added: 1.10 baseline
- Changed: none
- Anchors: `#cropTips`, "Drag inside the box to move it, and its handles to resize."
- Source: `js/app/crop.js` (`buildCropControls`); `js/app/parts/sheet.js` (`buildTipsRow`)
- Cases: none yet

## MSG-86 Levels' tips

Levels' sheet, titled "Levels tips", is its tips: three paragraphs on picking white and black, what **Auto** does, and "Hold the photo to compare with no levels. Clear, then Apply, removes levels."

- Risk: low
- Check: script
- Layout: both. A wide screen lists the paragraphs inline and adds the keyboard help under its own "Tips and keys" heading.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#levelsSheet`, "Levels tips", "Hold the photo to compare with no levels. Clear, then Apply, removes levels."
- Source: `js/app/levels.js` (`buildLevelsSheet`)
- Flag: to confirm. A wide screen shows two tips headings on Levels, "Levels tips" and "Tips and keys".
- Cases: none yet

## MSG-87 Overlay's tips

**Tips** in "Overlay options" opens four paragraphs: the rings, dragging and pinching, "On this step the photo stays framed as set in Crop.", the logo kept in the browser, and "Delete saved leaves the logo on this photo."

- Risk: low
- Check: script
- Layout: both. A wide screen lists the tips always open under "Tips and keys" and leaves out the first, which is about touch.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#overlayTips`, "On this step the photo stays framed as set in Crop.", "Delete saved leaves the logo on this photo."
- Source: `js/app/overlay.js` (`buildOverlayControls`); `js/app/parts/sheet.js` (`buildTipsRow`, `buildTipHint`)
- Cases: none yet

## MSG-88 Export's tips

**Tips** in "Export options" opens four paragraphs: "Share’s Save Image puts the photo in Photos.", what **Original** does, "Next card shows once these edits are exported." and what an edits file is.

- Risk: low
- Check: script
- Layout: both. A wide screen lists the tips always open under "Tips" and leaves out the first and the fourth.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#exportTips`, "Share’s Save Image puts the photo in Photos.", "Next card shows once these edits are exported."
- Source: `js/app/export-controls.js` (`buildExportControls`); `js/app/parts/sheet.js` (`buildTipsRow`, `buildTipHint`)
- Flag: to confirm. The tip says **Next card** shows once the edits are exported, but it is also held back while **Share now** waits; and the fourth tip nearly repeats the Edits hint (MSG-89).
- Cases: none yet

## MSG-89 The hints in the Corner shots and Export sheets

The Corner shots sheet says "Close-ups of the card’s four corners, at the photo’s own resolution, with this photo’s levels and no overlay." Under **Save edits** and **Load edits**, Export's options say "A small JSON file. Re-open the same photo, load it, and the export is identical.", led in bold by "Saves the side you’re on." while a pair is open.

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Close-ups of the card’s four corners", "A small JSON file. Re-open the same photo, load it, and the export is identical.", `#editsPairHint`
- Source: `js/app/corner-shots.js` (`buildCornerShotsControls`); `js/app/export-controls.js` (`buildEditsGroup`); `js/app/pair.js` (`syncPair`)
- Flag: to confirm. The Edits hint nearly repeats Export's fourth tip.
- Cases: none yet

## MSG-90 Keyboard help on a wide screen

Under the heading "Tips and keys", each step except Export adds one paragraph of keyboard help, such as Rotate's "F fits; 1 to 6 change step." and Crop's "Shift keeps the aspect in Free."

- Risk: low
- Check: script
- Layout: wide. A phone hides the keyboard help.
- Added: 1.10 baseline
- Changed: none
- Anchors: `.sheet-keys`, "Tips and keys", "F fits; 1 to 6 change step.", "Shift keeps the aspect in Free."
- Source: `js/app/parts/sheet.js` (`buildTipsRow`); `js/app/levels.js` (`buildLevelsSheet`); `js/app/perspective.js` (`buildPerspectiveSheet`); `js/app/overlay.js` (`buildOverlayControls`)
- Flag: to confirm. Perspective's help says "Tab selects the next handle" without saying the photo must have the keyboard focus first, and "arrows" means the on-screen pad in one tip and the keys in the next line.
- Cases: none yet

## MSG-91 Names for screen readers, and tooltips

Every control without visible text has a name a screen reader announces: **Open photo**, **Unpair**, **Fit to screen**, **Undo**, **Redo**, "Options" for the tab with the up arrow above the controls, "Close" on a sheet, the nudge keys, the corner thumbnails and "Close tuning". Labelled controls show a tooltip on hover, such as "Undo (Ctrl/Cmd+Z)".

- Risk: low
- Check: script
- Layout: both. Tooltips show only with a mouse; on a wide screen the Open button also shows the word "Open".
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnOpen`, `#btnFit`, "Fit to screen (F)", "Redo (Shift+Ctrl/Cmd+Z)"
- Source: `js/app/parts/top-bar.js` (`buildTopBar`, `buildIconButton`); `js/app/parts/adjustment-line.js` (`buildControlArea`); `js/app/parts/sheet.js` (`buildSheet`); `js/app/perspective.js` (`buildNudgeRow`); `js/app/corner-shots.js` (`buildThumbnails`); `js/app/debug-panel.js` (`buildDebugPanel`)
- Flag: to confirm. Redo's tooltip names only Shift+Ctrl/Cmd+Z, though Ctrl/Cmd+Y also works.
- Cases: none yet

## MSG-92 What the app writes to the console

The console shows the version at start, each photo's load time and each side switch's time, and warns about link settings it ignored, a session or pair that couldn't be saved or restored, a photo not reloaded after a pair's export, and the background worker falling back to the main thread.

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "[card-finisher] URL settings ignored", "[card-finisher] Web Worker unavailable, running on main thread:", "[card-finisher] session photo not saved:", "loaded + previewed in"
- Source: `js/app/main.js` (`init`); `js/app/core.js` (the link settings, at load); `js/app/state.js` (`openFile`); `js/app/adapters.js` (`EngineWorker.fail`, `Session.savePhoto`, `Session.flush`); `js/app/pair.js` (`switchSide`, `savePairSession`, `restorePair`, `reloadOpenPhoto`)
- Cases: none yet
