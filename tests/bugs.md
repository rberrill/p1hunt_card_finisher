# Bugs

Defects that a test run has confirmed, one row each. A row is added when a failure is confirmed as a defect, and updated in the commit that fixes it. The case named is the one that fails without the fix.

Evidence for an open bug is kept on the tester's machine under `tests/runs/kept/<ID>/`; it is not committed.

| ID | Case | Found in | What happens | Status |
| --- | --- | --- | --- | --- |
| BUG-001 | STA-22 (case to be written) | 1.10.0-dev.16, commit 6386686 | With a photo open, choosing a file the app can't read shows "Couldn’t read that file as an image." and leaves the photo on screen, but from then on its edits are not saved: after a reload, **Resume** brings the photo back without them. Seen with a script in Chromium: a quarter turn made after the failed open was gone after Resume; the same turn without the failed open was kept. The cause, read from the code: `openFile` in `js/app/state.js` raises the load counter before decoding, and the autosave in `js/app/adapters.js` only saves for the current counter. | Open |
| BUG-002 | ROT-06.3, ROT-08.3 | 1.10.0-dev.16 | Ruling R1 is not built yet: **Done** on an empty or unreadable typed angle sets the angle to 0.0° as an undo step, instead of keeping the old angle with no undo step. | Open |
