---
name: uat
description: Write or update Rich's manual UAT script (tests/UAT-X.Y.md) - add steps for every new or changed behavior, start a new version's script, fold the new part into the core at release. Use whenever a feature or behavior change is agreed or built.
---

# UAT script

Rich runs the **whole** script on desktop and iPhone Safari before every release, on the live HTTPS site. `tests/UAT-X.Y.md` is local only (gitignored), so it may hold the LAN address.

## Layout of `tests/UAT-X.Y.md`

1. **Header:** the version under test; "automated tests first" (point to `tests/README.md`; no pass counts); how to record results (✅ pass, ❌ fail, ➖ skipped); a tester table.
2. **Setup:** the hosted site (preferred), plus desktop and phone LAN setup.
3. **Core:** Part A Desktop, Part B Phone, then one part per feature area (C Overlay, D Security, …). This is the regression suite.
4. **New in X.Y:** steps for this version's new and changed behavior. It goes last before sign-off, so Rich can run it first if he wants.
5. **Sign-off:** an area table (Desktop / Phone / Blocking issues), the decision line `☐ Ship ☐ Fix first`, and the previous release's one-line result.

## Writing steps

- Use tables: `| # | Steps | Expected | Result | Notes |`. IDs are `<part><section>.<n>` (e.g. `C3.7`); new ones are `N1.1`, `N1.2`, ….
- One action per row. **Expected** must be something Rich can see without DevTools, unless the step is in the Security part.
- Cite the spec's AC numbers and Rich's question numbers when a feature has them (`(AC14, Q5)`).
- Give anything touch-related a phone row. Mark share steps `(HTTPS)`.
- Behavior that changed: edit the core step in place; don't add a duplicate. Behavior that was removed: delete its steps, and add one New row confirming it's gone.

## Start a version

Copy the previous `tests/UAT-X.Y.md` to the new version's file, then:
- clear every Result and Notes cell;
- reset the sign-off and keep only the last release's line;
- empty the New part;
- move the old file to `archive/`.

## At release (the `release` skill calls this)

Move each New row into the core part it belongs to, renumber within that part only, and record Rich's sign-off.

If a full run starts taking much over an hour, suggest pruning to Rich: rows the `verify` checks fully cover and that carry no device-specific risk. Don't prune without his OK.
