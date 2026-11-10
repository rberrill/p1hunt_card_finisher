---
name: uat
description: Maintain Rich's manual acceptance tests - the catalog of every case, the release smoke test, and each version's UAT script (new and connected cases + smoke). Use when proposing or building a feature or behavior change, when starting a version, and at release.
---

# UAT: catalog, smoke test, version script

All three files are local only (gitignored), so they may hold the LAN address.

**Where it runs.** GitHub Pages only serves the `release` branch, so there is no HTTPS copy of a build before release.
- **Before release:** Rich runs the version script on the dev build: desktop Chrome on `localhost` (treated as secure, so Share and Copy work there) and iPhone Safari over the LAN on plain HTTP (Share and Copy hidden).
- **A fresh dev number for every changed build.** Before handing Rich a build whose code changed since he last tested, bump the dev number (`node .claude/skills/release/set-version.js X.Y.0-dev.N`, N + 1). The asset links' `?v=` then changes, so the phone can't mix cached old scripts with new ones (it happened in 1.7). Say the new number in the handover so he can check the console or the logo tooltip.
- **After release:** once the release is pushed, he re-runs the smoke test and any **(HTTPS)** rows on the live site.

| File | What it is | Run |
|---|---|---|
| `tests/uat/catalog.md` | Every test case, by feature, with permanent IDs. The master | Only as a full run (see triggers) |
| `tests/uat/smoke.md` | One pass per device that finishes a real listing (card, back, logo, corner sheet), a different path on each. The master | Every release: pre-release on the dev build, then live after deploy |
| `tests/UAT-X.Y.md` | This version's new and connected cases, the smoke test, the after-deploy check, the sign-off | Every release |

The rules below are Rich's (2026-11-10, replacing the mirrored tables of 2026-10-30) unless marked as Claude's.

## Shared structure

- **Feature sections in pipeline order:** 1 Start and layout · 2 Navigation · 3 Perspective · 4 Rotate · 5 Crop · 6 Levels · 7 Overlay · 8 Export · 9 Corner shots · 10 Upscale question · 11 Front and back · 12 Session restore · 13 Security · 14 Real-use run · 15 Environments. A new feature gets a new section in pipeline order (renumber the later sections and their IDs in the catalog).
- **Each section** has a `### Desktop` and a `### Phone` table, each opened by one italic *Setup:* line. If a device has no cases, say so in one line. Environments is a single table.
- **Columns:** `| ID | Test | Steps | Expected | Result | Notes |`.
- **IDs are permanent:** a device letter (`D`, `P`, `E`), then section.row, e.g. `P5.2`. A new case takes the next free number in its catalog table; a retired ID isn't reused. The version script uses catalog IDs, so gaps are normal. Smoke IDs are `SD1…` and `SP1…`. (The catalog was renumbered on 2026-11-10; older IDs refer to `archive/uat-catalog-before-2026-11-10.md`.)

## Which behaviors get a row, and on which device

**A behavior gets one row, on one device.** Never mirror a row to the other device. Pick the device in this order:

1. **Phone only**, when the verdict needs a real iPhone: touch (drag, pinch, long-press, double-tap, the nudge strips), iOS and Safari behavior (pickers, the keyboard, the share sheet, Download → Back → Resume, a swiped-away tab, switching apps), memory (48 MP, large pairs), whether a layout fits by eye, the home-screen icon.
2. **Desktop only**, when it needs a keyboard, a mouse wheel, drop, paste, the wide or narrow window, DevTools or a crafted link or file, a private window, or the saved file opened and inspected (its name, pixel size, contents; several files from one click).
3. **Either device:** share these out so each device exercises every feature. Look at the section's two tables and give the row to the device with less of that feature. (How the current rows were shared: crop preset and Swap logic, pair rules and file checks on desktop; the Levels draft, the Next card row and the pair's questions on phone.)

**No row for what the automated tests prove.** If `tests/selftest.js`, `tests/sample-regression.js` (R1–R15) or a `verify` check in `checks.md` already proves a behavior, and a real device adds nothing to the verdict, it has no catalog row; add or keep the automated check instead. Examples already dropped: the edits round trip (R6), the logo's place at every size (R11), slider undo (R7), detection on the samples (R1), Auto's colour (R15), each link's safe range (selftest), `file://` (verify step 5). `verify`'s phone is Chrome emulation, not Safari, so a behavior that only WebKit could break keeps its phone row. Accepted risk (Rich, 2026-11-10): an either-device row run on desktop is never run on WebKit unless the smoke test touches it.

**No row for a removal.** "X is gone" is checked in the version that removes it and doesn't enter the catalog.

## Writing test cases

- **One flow, one verdict.** A row is a few steps on one feature and an Expected you judge at the end; it may name the two or three things you see along that flow (the card opens *and* reads the right size). Never put unrelated features in one row (Rich's complaint of 2026-10-30), and split a row when half of it could fail without the other half meaning anything. A whole lifecycle goes in one row when its steps only make sense together (arm, click, disarm); it is split where a step is its own feature (Undo after it).
- Rows build on the rows above them in the same table; name the row when one depends on a specific other ("softer than D10.2's").
- **Test** is a short name for the behavior. **Expected** should be visible without DevTools, except in Security (Claude's habit, so Rich can judge a row on the phone; not a rule he set).
- Cite AC and question numbers when a feature has them (`(AC14, Q5)`).
- Things every row would otherwise repeat go once in Setup (the upscale question's default answer, Safari showing a download in the tab).
- **(HTTPS) rows:** start the Test cell with `(HTTPS)` only when the row needs the phone's Share sheet or Copy. There is no HTTPS before release, so their Result (and the smoke test's Pre-release cell) is pre-filled with ➖; Rich skips them and runs them after deploy. An (HTTPS) row left ➖ after deploy is closed with that version; never carry it into the next version's script. If a row only needs the exported file, use **Download** instead, so it runs before release.

## In a feature proposal (before building)

List in the proposal, for Rich to agree along with the ACs:
1. **New cases:** the rows the feature needs, each on its one device, and what goes to an automated check instead of a row.
2. **Connected cases:** the catalog rows the change could affect, with one line each on why. Look across features: Levels → "Levels don't touch the logo" (Overlay), the unapplied warning (Export), the unapplied draft on Resume (Session restore).
3. **Full-run trigger:** say whether one applies:
   - the change touches every module (a refactor, security hardening, a dependency, the engine's render or export pipeline, `css/app.css` layout rules);
   - phase two (PWA);
   - three releases without a full run.

   Rich decides.

## Version script `tests/UAT-X.Y.md`

1. **Header:** the version under test; "automated tests first" (`tests/README.md`; no counts); the ID and recording conventions; a tester table.
2. **Scope:** a short list of the new behavior with its row IDs; connected cases and why; whether a full run was triggered and why. Keep it to what the tester needs: the history of changes during UAT belongs in the decision log, not here. There is no separate index of new rows; the 🆕 markers are the index.
3. **Setup**, copied from the catalog.
4. **Feature sections:** only the sections with rows this version. New rows are marked 🆕, rows whose behavior changed ✏️; connected rows are copied from the catalog unchanged. For a full run, copy every catalog section.
   **Write the catalog in the same step.** Every 🆕 row goes into its catalog table (without the marker, with an empty Result, and ➖ for (HTTPS) rows) at the moment it goes into the script; a ✏️ row replaces its catalog row, and a retired row is deleted from the catalog. The catalog is the master, so it is never behind the script. If a row changes during UAT, change it in both.
5. **Smoke test:** the Desktop and Phone tables copied from `tests/uat/smoke.md`, with **Pre-release** and **Live** result columns.
6. **After deploy:**
   - re-run the smoke test on the live site (Live column);
   - list this version's (HTTPS) rows by ID, or say there are none;
   - the line `☐ Keep ☐ Roll back`.
7. **Sign-off:**
   - a row per included section, plus "Smoke test (pre-release)" and "Smoke test (live)", with Desktop / Phone / Blocking issues columns;
   - the decision line `☐ Ship ☐ Fix first`, decided on the pre-release results;
   - the previous release's one-line result.

**Start a version:** create the file with the header, an empty Scope ("none yet"), Setup, the smoke test and the after-deploy section. Move the previous version's file to `archive/`.

## The smoke test

- **A real listing, not a tour.** Each device finishes a card the way Rich would: every step, a logo, the export, the back, the corner sheet, a resume. Each row builds on the one before, so a break anywhere stops the pass.
- **Two different paths.** The phone takes a slab from Photos by touch, with Together, the 1-sheet corners, the upscale Yes, the share sheet and a swiped-away tab. Desktop takes a sample pair by drop, keys and mouse, with Separately, the 4-photo corners, the edits round trip and the console. A feature with two modes has one on each device.
- **A new user-facing feature joins the smoke test** in the version that ships it, on the device where it is riskier, by widening an existing row where it can.
- About 16 rows per device is Claude's size, not Rich's; if it grows past that, propose what to drop.

## At release (the `release` skill calls this)

- Record Rich's sign-off and decision.
- **Check the catalog:** every 🆕 and ✏️ row in the script is already in the catalog, worded the same (they went in with the script). Fix any drift; if the release drops a feature, delete its rows from the catalog.
- If a smoke row found a real regression, or a step stops making sense, update `tests/uat/smoke.md` too.
