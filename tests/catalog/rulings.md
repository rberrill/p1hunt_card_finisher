# Rulings

Rich's decisions on how the app should behave where its behavior was in question (15 November 2026). A catalog entry that a ruling changes carries its number in a Ruling field.

**FIX** means the app differs today: the entry's cases are written to the ruling and fail until the app is changed, test first. **AS-IS** means today's behavior is intended. **WORDING** means new on-screen text that Rich approves before it is built.

| # | Behavior in question | Ruling |
| --- | --- | --- |
| R1 | Typed angle empty/garbage + Done sets 0° | FIX: keep the old angle, no undo step (like cancel) |
| R2 | Arrow keys/Tab move hidden corners during Preview | FIX: keys do nothing while Preview is on |
| R3 | Debug overlay switch re-detects and moves hand-placed corners | FIX: leaves corners alone; only draws |
| R4 | Reset crop → 1:1 and remembers 1:1 | FIX: reset to the remembered preset; remembered preset unchanged. On a side kept after Unpair, whose crop is still the pair's 5:7, Reset crop also goes to the remembered preset (Rich, 2026-11-17) |
| R5 | Undo of an export setting rewrites the remembered setting | AS-IS |
| R6 | Candidate n/3 + confidence stale after Undo/Reset/drag | FIX: clear number+confidence when hand-moved; Undo/Reset restore the right number |
| R7 | Low confidence / Nothing detected never clears | FIX: clears after first corner move (drag or nudge) |
| R8 | Cancelled pointer commits drag; 2nd finger during pick sets point | FIX: cancelled drag reverts with no undo step; 2nd finger cancels the pick, stays armed |
| R9 | Compare badge with no levels | FIX: hold/C does nothing when no draft and no applied levels |
| R10 | 250–300 ms press is both compare and a tap | FIX: a press that showed compare is never a tap |
| R11 | Overlay buttons live but no-op with invalid corners | FIX: dim the three buttons; label row reads "Fix the corners in Perspective first." |
| R12 | Load edits: up to 3 toasts overwrite each other | FIX: one combined warning, up to three short lines (WORDING) |
| R13 | "Wait for the export to finish…" during a side switch | FIX: "Wait for the other side to open, then open the photo." during a switch (WORDING); export wording kept |
| R14 | Clamp note for pair Separately checks only open side | FIX: show if either side clamped; name the side when not on screen (WORDING) |
| R15 | Note says 16.8 MP; docs say 16.7 | FIX: screen shows 16.7 MP (round down) |
| R16 | Copy + JPEG + Transparent → white corners in PNG | AS-IS (matches the on-screen note and Download) |
| R17 | Controls live during export | FIX: dim Size, Format, sheet settings, Load edits, Undo, Redo, Add back with the save buttons; tab bar stays live |
| R18 | Replace logo resets placement | FIX: replacement takes old position, width, opacity |
| R19 | Two adds <900 ms = one undo; drop needs image/ MIME | FIX both: each add its own undo step; drop accepts by extension like the picker |
| R20 | Corner readout always "the card is too small"; buttons live | FIX: real reason; both save buttons dimmed |
| R21 | Corner shots checks Share once; Share now vs Next card | FIX: corner shots re-checks share availability each sync; Next card stays independent of corner shots (AS-IS) |
| R22 | Remove leaves photoOverlay in storage | AS-IS (needed for Undo after Resume); test Undo-after-Resume |
| R23 | Resume with size mismatch silently opens fresh | FIX: amber "Full edit history could not be restored, your photo has been opened fresh." (Rich's words; wording.md) |
| R24 | Raw error text in six toasts; two not logged | FIX: fixed sentence + next step; detail always to console (six lines of WORDING) |
| R25 | Unpair save not awaited | FIX: await the save before "Unpaired"; automated case reloads immediately |
| R26 | Pair readout with invalid waiting side (not reproduced) | FIX/SPEC: readout row names the side to fix ("Fix the back’s corners in Perspective first."), Share/Download/Copy dimmed (WORDING) |
| R27 | Resume card: no Tab trap/fade | AS-IS |
| R28 | ?selftest=0 runs tests | FIX: =0 means off |
| R29 | Tuning panel bypasses CONFIG_LIMITS | AS-IS (tuning tool) |
| R30 | allowUpscale link still shows "not upscaled" tail | FIX: tail goes when upscaling is on |
| R31 | A failed open (unreadable file) stops autosave for the photo that is open (BUG-001, reproduced by script) | FIX: a failed open changes nothing; the open photo keeps being saved |
| R32 | Undo/redo keys and a dropped or pasted logo get past ruling 17 during an export | FIX: both are blocked until the export ends; the logo is refused with the dropped-photo message |
| R33 | The options tab on the phone layout ignores Enter and Space | FIX: Enter and Space open the sheet |
| R34 | In Playwright's Chromium 158 detection misses the card in 02_black_flat_black (18.5% against a 0.24% baseline); Chrome 157 finds it, so a small decoding difference flips it (BUG-065) | FIX before 1.10.0: detection is made robust for this photo in both browsers; no baseline is raised |
| R35 | Replace logo, Undo, reload, Resume: the logo Undo brought back is no longer stored, and the export fails | FIX: whatever logo Undo can bring back stays stored, so after Resume the photo exports as it looked |
| R36 | The save made as the page closes isn't guaranteed to land, so an edit made under 0.4 s before closing can be lost | FIX: save sooner after each change (about 0.1 s), with the save on close kept as a backstop |
| R37 | From a link that switches upscaling on, the Upscale question states the wrong crop size and Yes saves the same file as No | FIX, widened 16 November: the Upscale question is asked only when Yes would save a bigger file than No, wherever it is asked from (a single photo, a pair, corner shots). That covers upscaling already switched on by a link, and a size cap that leaves no room to upscale |
| R38 | On Levels, a pick tapped in the empty space around the visible picture sets a point from the hidden part of the photo | FIX: a tap outside the visible picture is ignored and the pick stays armed |
| R39 | The W and B marks of a pick are white letters, barely visible on a white spot | FIX: a white letter with a dark outline, as the corner outline is drawn |
| R40 | For about 0.1 s after a step change, the options tab is on top of the controls under it (Rotate's angle; Export's Size and Format) and takes their taps | FIX: the controls under the tab take the tap from the moment they are drawn |
| R41 | After Tab puts the focus ring on the photo, a mouse click on the photo leaves the ring | AS-IS: the ring means the keyboard is acting on the photo; the code comment that says otherwise is to be corrected |
| R42 | One damaged value in an edits file resets its whole settings group | AS-IS: a damaged file is untrusted, and the warning names the group |
| R43 | The checkerboard behind the saved-logo thumbnail is built with a gradient function, against "no gradients" | AS-IS. The brand lines are guidance for new design; a design Rich has agreed stands and is not flagged |
| R44 | Speed limits for the automated cases | Three times the median measured on 16 November: photo on screen 1.25 s, detection 8.75 s, pair switch 0.5 s, export at 1080 0.5 s, at 2000 0.95 s, at 3000 and Original 1.65 s, upscaled export 4.75 s |
| R45 | With a pair open, switching sides while the back is still detecting leaves "Detecting…" on the back for good | FIX: switching away never leaves a stale message; the search finishes quietly. Its result moves the corners only if no corner on that side was moved by hand; otherwise the hand-placed corners stay and the result becomes the candidates to cycle through |
| R46 | Two photos land worse in WebKit than their Chrome detection baselines (BUG-240) | Decided after the detection fix (R34): until then the test lists them as known WebKit misses and fails if any other photo slips |
| R47 | Under a link that lowers the size limit, which number the "Scaled down to fit the N MP limit." note gives | The limit in force (1 MP under `?maxOutputArea=1000000`; 16.7 MP normally) |
| R48 | Whether R12's approved Load edits lines apply to a load with one problem | They apply to every load: "Edits loaded." plus each line that applies. A load with no problem shows "Edits loaded." alone, as a white information message (Rich, 2026-11-17) |
| R49 | R24's short error lines give no next step, against "no messages a user can't act on" | The six short lines stand for failures the app can't explain. A message whose fix the app knows keeps its advice ("The photo isn’t loaded after the last export. Tap Front or Back to switch sides, then switch back.") |
| R50 | For a pair saved Separately, the Upscale question quotes a side that is being scaled down as if at its own resolution | FIX: the question names only the side Yes would upscale ("The front is W × H px at the photo’s resolution."); both only when both are under the size |
| R51 | With `?debug` on a phone-width screen and no photo open, the tuning panel covers Open photo and the Resume box | FIX: the panel never covers them on the start screen |
| R52 | On a phone-width screen, Tab moves the keyboard out of an open options sheet | AS-IS |
| R53 | A pair's joined preview loses its zoom when Together or Separately is chosen | AS-IS: the picture changes shape, so it is fitted again |
| R54 | Tab into the photo keeps the handle selected before; the help line doesn't say the photo needs the focus first | AS-IS, behavior and help line both |
| R55 | Pick white and Pick black read the half of the tapped patch's pixels nearest its median brightness | AS-IS (Claude's design, accepted by Rich) |
| R56 | A handle's double tap has a 0.35 s window and no distance limit | AS-IS |
| R57 | Fit to card is never dimmed, and a tap that changes nothing adds no undo step | AS-IS |
| R58 | One message writes sizes "4032×3024" and another "12000px" | FIX: "W × H" and "N px" in every message |
| R59 | Messages say "overlay" where the Overlay step's buttons say "logo" | FIX: messages say "logo"; R12's line becomes "Logo left out; it couldn’t be read." Button names are not touched |
| R60 | The blocked-clipboard message joins its parts with a dash | FIX: two sentences, same words |
| R61 | Export's last tip nearly repeats the hint under Save edits and Load edits | FIX: the tip goes, the hint stays |
| R62 | Export's Next card tip doesn't mention the wait while Share now is pending | AS-IS |
| R63 | Reset export settings leaves Together / Separately and the corner-shots output, and resets both sides of a pair | AS-IS |
| R64 | Four messages give no next step: the format fallback, "Couldn’t estimate levels from this image.", the size-limit note, the logo that can't be saved in this browser | AS-IS: each explains a result that would otherwise look like a fault |
| R65 | The New photo question's title and first button both read "New photo" | AS-IS |
| R66 | Redo's tooltip names only Shift+Ctrl/Cmd+Z | AS-IS |
| R67 | Arrow keys move a corner 1 photo pixel with no magnifier; the on-screen arrows 1 screen pixel with it | AS-IS |
| R68 | Perspective's help says "arrows" for the pad and for the keys | AS-IS |
| R69 | Escape closes a phone sheet and nothing else (not Tap to find card, not a Levels pick) | AS-IS |
| R70 | A phone on its side wider than 760 px gets the wide layout | AS-IS |
| R71 | Under reduced motion the Before levels badge still fades, the snap rings don't, and one fade is 60 ms | AS-IS |
| R72 | While a Levels pick is armed one finger can't pan, and the color is taken where the finger lifts | AS-IS |
| R73 | Auto shows a pop-up when it works, though a pick shows none | FIX: Auto's success pop-up goes; its failure message stays |
| R74 | On a wide screen Levels shows two tips headings | FIX: one heading, "Tips and keys", holding the tips then the keys |
| R75 | "Loading…", "Opening the front…" and "Detecting…" take the row above the controls with nothing to act on | AS-IS: a busy line is allowed while the app works; all three wordings stay |
| R76 | Perspective shows "Corrected frame clamped to 12000px on the long side." | FIX: the line goes; the fact goes to the console |
| R77 | When a search the user started finds no card, a pop-up and the row above the controls both say so | FIX: only the row's "Nothing detected. Drag the corners into place." shows |
| R78 | Some messages say "Tap" on a wide screen | AS-IS |
| R79 | Corner shots say "Saved", the main export and a pair "Exported" | FIX (Rich: the message says what was exported and how): "THING ACTION: SIZE in N s." THING is "Photo", "Front and back", "Corner sheet" or "4 corner photos"; ACTION is "downloaded" or "shared". Copy reads "Photo copied (PNG)." (a pair's joined image: "Front and back copied (PNG)."). Rich, 2026-11-17: for a pair saved Separately SIZE is both files', front first ("748 × 1047 px and 771 × 1080 px"); for four corner photos it is one size and "each" ("1000 × 1000 px each"); while a refused share waits for **Share now**, ACTION is "ready" ("Photo ready: SIZE in N s. Tap Share now to open the share sheet.") |
| R80 | "The card is too small for corner shots." stays 5 s where other errors stay 6 | RETIRED by R20 (Rich, 2026-11-17): once both save buttons are dimmed nothing can show the message, so the R20 fix removes it and its entry moves to retired.md |
| R81 | Four engine faults reach the screen in raw words ("Corners are missing or invalid." and three more) | FIX: the screen shows "Fix the corners in Perspective first."; the raw words go to the console |
| R82 | "Fix the corners in Perspective first." shows on Perspective itself | FIX: on Perspective it reads "Fix the corners first." |
| R83 | Overlay's hint always says "up to 5 MB", though a link can lower the limit | FIX: the hint gives the limit in force |
| R84 | On Overlay with no logo placed, every touch and the wheel do nothing | AS-IS: the photo is locked on that step |
| R85 | A message in the row above the controls, and Preview, hide Perspective's confidence figure | AS-IS |
| R86 | Flatten never shows its icon, only its percentage | AS-IS |
| R87 | While Preview is on, Nudge and Flatten are dimmed | AS-IS |
| R88 | Preview stays on across a step change | FIX: a step change turns Preview off |
| R89 | Snap, Grid, Debug overlay and the Perspective and Rotate modes carry over to a new photo but not a reload | AS-IS |
| R90 | Crop's fitted size depends on whether Rotate or Crop was opened first | FIX: each step fits its own way, whatever came before |
| R91 | Zoom is kept on Perspective and on Rotate and Crop, and dropped on Levels, Overlay and Export | AS-IS |
| R92 | A tap away from a typed angle throws it away | FIX: a tap away saves it, as Done and Enter do |
| R93 | Reset beside the angle clears only the angle; Reset rotation clears the whole step | AS-IS |
| R94 | A flip changes the sign of the angle shown | AS-IS |
| R95 | Fit comes before Undo and Redo on a phone, after them on a wide screen | AS-IS |
| R96 | A tap on an open sheet's title closes it | AS-IS |
