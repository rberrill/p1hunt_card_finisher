---
name: uat
description: Maintain Rich's manual acceptance tests - the catalog of every case, the release smoke test, and each version's UAT script (new and connected cases + smoke). Use when proposing or building a feature or behavior change, when starting a version, and at release.
---

# UAT: catalog, smoke test, version script

All three files are local only (gitignored), so they may hold the LAN address. Rich runs the version script on desktop Chrome and iPhone Safari, on the live HTTPS site, before every release.

| File | What it is | Run |
|---|---|---|
| `tests/uat/catalog.md` | Every test case, by feature, with permanent IDs. The master | Only as a full run (see triggers) |
| `tests/uat/smoke.md` | One quick pass per device touching every step, leaning on iPhone-only risks. The master | Every release, copied into the version script |
| `tests/UAT-X.Y.md` | This version's new and connected cases, then the smoke test, then the sign-off | Every release |

## Shared structure

- **Feature sections in pipeline order:** 1 Start and layout · 2 Navigation · 3 Perspective · 4 Rotate · 5 Crop · 6 Levels · 7 Overlay · 8 Export · 9 Session restore · 10 Security · 11 Real-use run · 12 Environments. A new feature gets a new section in pipeline order (renumber the later sections and their IDs in the catalog).
- **Each section** has a `### Desktop` and a `### Phone` table, each opened by one italic *Setup:* line. If a device has no cases, say so in one line. Section 12 is a single table.
- **Columns:** `| ID | Test | Steps | Expected | Result | Notes |`.
- **IDs are permanent:** a device letter (`D`, `P`, `E`), then section.row, e.g. `P5.4`. A new case takes the next free number in its catalog table; a retired ID isn't reused. The version script uses catalog IDs, so gaps are normal. Smoke IDs are `SD1…` and `SP1…`.

## Writing test cases

- **One behavior per row.** Steps may set things up, but Expected is a single outcome to judge. If Expected reads "…; then…" or covers two features, split the row. Rows may build on the rows above them in the same table; name the row when it depends on a specific one ("After P8.4, …").
- **Test** is a short name for the behavior. **Expected** must be visible without DevTools, except in Security.
- **Both devices:** a behavior that applies to both gets a row in each table, with that device's steps and outcome.
- **One device:** device-only behavior (keyboard, wheel, drag-and-drop, paste; pinch, nudge strip, iOS long-press, share sheet) goes only in that device's table.
- Cite AC and question numbers when a feature has them (`(AC14, Q5)`). Mark share rows `(HTTPS)`.

## In a feature proposal (before building)

List in the proposal, for Rich to agree along with the ACs:
1. **New cases:** the rows the feature needs, per device.
2. **Connected cases:** the catalog rows the change could affect, with one line each on why. Look across features: Levels → "Levels don't touch the logo" (Overlay), the unapplied warning (Export), the unapplied draft on Resume (Session restore).
3. **Full-run trigger:** say whether one applies:
   - the change touches every module (a refactor, security hardening, a dependency, the engine's render or export pipeline, `css/app.css` layout rules);
   - phase two (PWA);
   - three releases without a full run.

   Rich decides.

## Version script `tests/UAT-X.Y.md`

1. **Header:** the version under test; "automated tests first" (`tests/README.md`; no counts); the ID and recording conventions; a tester table.
2. **Scope:** new behavior; connected cases and why; whether a full run was triggered and why.
3. **New in X.Y**, at the lead: an `ID | Test | Section` table of every 🆕 row.
4. **Setup**, copied from the catalog.
5. **Feature sections:** only the sections with rows this version. New rows are marked 🆕; connected rows are copied from the catalog unchanged. For a full run, copy every catalog section.
6. **Smoke test:** the Desktop and Phone tables copied from `tests/uat/smoke.md`.
7. **Sign-off:** a row per included section plus "Smoke test" (Desktop / Phone / Blocking issues); the decision line `☐ Ship ☐ Fix first`; the previous release's one-line result.

**Start a version:** create the file with the header, an empty Scope ("none yet"), Setup and the smoke test, and move the previous version's file to `archive/`.

## At release (the `release` skill calls this)

- Record Rich's sign-off and decision.
- **Merge into the catalog:** add each 🆕 row (without the marker) to its catalog table; replace changed rows; delete retired ones.
- If a smoke row found a real regression, or a step stops making sense, update `tests/uat/smoke.md` too.
- Keep the smoke test at about 15 rows per device: one per step plus the iPhone-only risks. If it grows, propose what to drop.
