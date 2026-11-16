# Rulings

Rich's decisions on how the app should behave where its behavior was in question (15 November 2026). A catalog entry that a ruling changes carries its number in a Ruling field.

**FIX** means the app differs today: the entry's cases are written to the ruling and fail until the app is changed, test first. **AS-IS** means today's behavior is intended. **WORDING** means new on-screen text that Rich approves before it is built.

| # | Behavior in question | Ruling |
| --- | --- | --- |
| R1 | Typed angle empty/garbage + Done sets 0° | FIX: keep the old angle, no undo step (like cancel) |
| R2 | Arrow keys/Tab move hidden corners during Preview | FIX: keys do nothing while Preview is on |
| R3 | Debug overlay switch re-detects and moves hand-placed corners | FIX: leaves corners alone; only draws |
| R4 | Reset crop → 1:1 and remembers 1:1 | FIX: reset to the remembered preset; remembered preset unchanged |
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
| R23 | Resume with size mismatch silently opens fresh | FIX: amber "Couldn’t restore your edits, so the photo was opened fresh." (WORDING) |
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
