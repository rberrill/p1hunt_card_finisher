# Sweep: follow-up list

Work a sweep found but may not do itself: a change to the app, to what a test case expects, to
a ruling, to a tool's code or to a record. Nothing here is agreed to be done. `/sweep followup`
walks through it with Rich, one item at a time (the `sweep` skill). An item is removed when it
is done, or when Rich says to drop it.

Each item says what was found, where, and what the next step would be.

## From the full sweep of 2026-11-25

### F-02 FLOW-01.3 expects a "dev" version

- Where: `tests/catalog/journeys.md`, FLOW-01.3 row 2: "a version that contains "dev""; also
  the examples "such as 1.10.0-dev.16" in `tests/catalog/export.md` (EXP-34's case).
- Found: the released build reads "Card Finisher 1.10.0", and no next `-dev` version is started
  after a release, so this main-flow row fails on the next phone checklist.
- Next step: a `case-writer` changes the row to expect the version given with the build.
  Before the next checklist is generated.

### F-04 Retire `rulings.md` as a live file

- Where: `CLAUDE.md` (step 4), `.claude/skills/test/SKILL.md`, `tests/WRITING-CASES.md`,
  `.claude/agents/case-writer.md`, `.claude/agents/fixer.md`, `tests/catalog/README.md`; the
  201 `Ruling:` fields in the catalog's entries.
- Found: Rich ruled on 2026-11-25 that `rulings.md` is a record of triage decisions and the
  catalog entries are the spec. The file is marked so, but those instructions still send
  workers to it as the authority, and its wording has drifted from the entries (R12 "up to
  three short lines" where four show; R49's corner-shots clause, which can't happen).
- Next step: a proposal for Rich to agree: where a new decision on behavior is written from now
  on, what the `Ruling:` fields become, and the rewording of each instruction file.

### F-05 Bug and future-state mentions in the catalog

- Where: lines that say "fails until", "The app differs today" or name a bug in
  `tests/catalog/photo-view.md`, `start-and-session.md`, `storage-and-settings.md` and the
  catalog's `README.md`; the `test.fail(true, 'BUG-0NN')` marks and PER-39's known-slips list.
- Found: Rich said on 2026-11-25 that a test says only what it tests: no deadline, no plan and
  no bug. Only PER-39's ruling line was changed. The marks that keep a run green while a bug is
  open rest on the opposite idea.
- Rich ruled on 2026-11-25 (`/sweep followup`): the marks too. A test says what failed; the
  run's report gives a pass count and a fail count; in triage each failure is checked against
  the bugs already reported, and one that is an accepted bug is closed there.
- Next step: a proposal for Rich to agree: the marks and PER-39's known-slips list removed,
  the catalog's bug sentences removed, what the run's summary shows, what triage does with a
  failure that is a known bug, and what a release preflight needs in place of "0 failed".

### F-07 Trim `CLAUDE.md`

- Where: `CLAUDE.md`, "Keep this file short (Claude's target: about 120 lines)"; it is about
  146 lines.
- Next step: propose, line by line, which settled product decisions the catalog already holds
  and could leave the file. Rich approves each.

### F-08 The six old color settings

- Where: `js/config.js`, "The six values above it (bg to muted) are the old layout's and go
  when its last rule does."; `tests/catalog/layout.md` (LAY-11), "code to tidy in the fix pass".
- Found: the fix pass is over; the values are still there and `css/app.css` still uses four.
- Next step: a change to the app, so it needs Rich's go-ahead: remove what is unused, and
  correct the two notes.

### F-10 Catalog work for a case-writer

Three kinds. A `case-writer` does each, then a `reviewer` reads it.

Wording that breaks the catalog's own standard, with no verdict changed:

- the sheet's close button is "the **×**" in `rotate.md`, `storage-and-settings.md`,
  `upscale-question.md` and `corner-shots.md`, and **Close** in `top-bar-and-navigation.md`
  and `photo-view.md`;
- **Open** against **Open photo** (`overlay.md`, `levels.md`, `rotate.md`, `crop.md`,
  `layout.md`), and **Fit** against **Fit to screen** (`levels.md`, LEV-16.3);
- TOP-03.3 and TOP-37.1 put Redo "at the right end of the top bar" on a wide screen;
- PAIR-07.1: Next handle is "under the nudge pad" (it is beside it);
- two actions in one row: ROT-23.1 row 5, LEV-16.7 row 5;
- "lit" used for two things in `rotate.md`; "a phone, in its own browser" on automated cases
  in `levels.md`; "the test site" for the UAT site in `storage-and-settings.md` (STO-08.1) and
  `journeys.md` (FLOW-02.1, which also has no Build line);
- Check fields that don't match their cases' marks: ROT-02, ROT-09, ROT-20, LEV-17;
- LAY-05's Ruling field comes before Risk; CRP-08's Ruling field has no number; CNR-12.1 to
  CNR-12.4 lean on a named action defined at the top of the file;
- LAY-06 cites LAY-03 for "36 px", which LAY-03 doesn't hold; EXP-20's Layout line and its
  case note disagree about what a tap on Corner shots does with another sheet open;
- PER-27.4 and PER-27.5 still hedge on whether a step change turns Preview off;
- "grey" and "labelled" against "US spelling" (the README's own term is "greyed out").

Entries that promise more than their cases prove:

- STA-21: "A HEIC photo opens where the browser can decode it (Safari)"; its phone case can no
  longer fail;
- ROT-06 to ROT-08: Rich's ruling that "3.5.2" is saved as 3.5 is not in the entries and no
  case types it;
- QCD-08: the first half of its description "can't be brought about today".

The same check written in two places (propose to Rich which copy stays, then retire the other):

- Messages against the home area: MSG-07.1 / STA-21.2, MSG-08.1 / STA-22.1, MSG-09.2 /
  STA-08.1, MSG-12.1 / STA-11.1, MSG-13.1 / STA-12.1, MSG-51.1 / PER-31.1, MSG-56.1 / PER-36.2,
  MSG-57.1 / PER-02.1, MSG-62.1 / SEC-10.1, MSG-63.1 / PER-25.1, MSG-72.1 / EXP-06.3,
  MSG-72.2 / EXP-06.4, MSG-74.1 / CNR-04.3, MSG-74.2 / CNR-08.2, MSG-82.2 / PAIR-37.3;
- Security against Edits files: SEC-05.1 / EDT-08.1, SEC-06.1 / EDT-05.1 to EDT-05.3,
  SEC-07.1 / EDT-09.1 and EDT-09.2;
- Export against Pairs and Start: EXP-13.2 / PAIR-33.1, EXP-16.2 / PAIR-08.4, EXP-18.2 /
  PAIR-01.2, EXP-19.1 / PAIR-17.1, EXP-23.1 / STA-07.3, STA-07.4 / PAIR-41.1;
- others: KEY-14.1 / UPS-03.3, UPS-09.3 / STO-04.4, TOP-13.2 / LEV-18.1, TOP-13.5 / LEV-18.2,
  TOP-13.7 / OVL-14.3, EXP-14.2 / EXP-18.1, LEV-14.2 inside LEV-14.5, LAY-15.3 inside LAY-15.2.
