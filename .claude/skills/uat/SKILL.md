---
name: uat
description: Write or update Rich's manual UAT script (tests/UAT-X.Y.md) - add test cases for every new or changed behavior in the right feature section, for desktop and phone, start a new version's script. Use whenever a feature or behavior change is agreed or built.
---

# UAT script

Rich runs the **whole** script on desktop Chrome and iPhone Safari before every release, on the live HTTPS site. `tests/UAT-X.Y.md` is local only (gitignored), so it may hold the LAN address.

## Layout of `tests/UAT-X.Y.md`

1. **Header:** the version under test; "automated tests first" (point to `tests/README.md`; no pass counts); the ID and recording conventions; a tester table.
2. **New in X.Y**, at the lead. It has two parts:
   - **New behavior:** a short list of what changed.
   - **New test cases:** a table of `ID | Test | Section` for every 🆕 row.
3. **Setup:** the hosted site, the local alternative, phone prep, and the files the tests need.
4. **Feature sections**, numbered in pipeline order:
   1 Start and layout · 2 Navigation · 3 Perspective · 4 Rotate · 5 Crop · 6 Levels · 7 Overlay · 8 Export · 9 Session restore · 10 Security · 11 Real-use run · 12 Environments.
   - Each section has a `### Desktop` table and a `### Phone` table, each opened by one italic *Setup:* line.
   - If a device has no cases in a section, say so in one line; don't drop the heading.
   - Section 12 is a single table, run once.
   - A new feature gets a new section in pipeline order. Renumber the later sections, their IDs and the sign-off.
5. **Sign-off:** one row per section, with Desktop / Phone / Blocking issues columns; the decision line `☐ Ship ☐ Fix first`; the previous release's one-line result.

## Writing test cases

- Columns: `| ID | Test | Steps | Expected | Result | Notes |`.
- **IDs:** a device letter (`D`, `P`, `E`), then section.row, e.g. `P5.4`. Rows are numbered within each table. Desktop and phone versions of a test don't need matching numbers.
- **One behavior per row.** Steps may set things up, but Expected is a single outcome to judge. If Expected reads "…; then…" or covers two features, split the row.
- Rows run top to bottom, so a row may build on the rows above it in the same table. Say so when it depends on a specific earlier row ("After P8.4, …").
- **Test** is a short name for the behavior ("Swap holds across presets"). **Expected** must be visible without DevTools, except in Security.
- **Both devices:** a behavior that applies to both gets a row in each table, with that device's steps and outcome (click vs tap, loupe up-right vs pinned away from the finger).
- **One device:** device-only behavior (keyboard shortcuts, wheel, drag-and-drop, paste; pinch, nudge strip, iOS long-press, share sheet) goes only in that device's table.
- Cite the spec's AC and question numbers when a feature has them (`(AC14, Q5)`). Mark share rows `(HTTPS)`.
- **New cases:** mark the row's Test cell with `🆕`, put it in its feature section, and add it to the "New test cases" table at the top.
- **Changed behavior:** edit the existing row in place.
- **Removed behavior:** delete its rows, and add one 🆕 row confirming it's gone.

## Start a version

Copy the previous `tests/UAT-X.Y.md` to the new version's file, then:
- clear every Result and Notes cell;
- remove every 🆕 marker;
- reset "New in X.Y" to "none yet";
- reset the sign-off, keeping only the last release's line;
- move the old file to `archive/`.

## At release (the `release` skill calls this)

Record Rich's sign-off and decision. Nothing moves: new cases already live in their sections.

If a full run starts taking much over an hour, suggest pruning to Rich: rows the `verify` checks fully cover and that carry no device-specific risk. Don't prune without his OK.
