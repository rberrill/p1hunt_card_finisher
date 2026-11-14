# P1Hunt Card Finisher: working notes for Claude

A static web app that straightens, crops and color-corrects phone photos of trading cards (F1 Topps Chrome in practice), including cards in one-touches, toploaders and graded slabs, ready for listings and posts. Pipeline: **Perspective → Rotate → Crop → Levels → Overlay → Export**. Live at https://rberrill.github.io/p1hunt_card_finisher/ (public repo `rberrill/p1hunt_card_finisher`, GPL-3.0).

- **Who uses it:** Rich, mostly on his iPhone (Safari). The phone is the primary device and desktop is secondary.
- **Phase two (not started):** an installable PWA, then Capacitor store apps with camera capture, save to Photos and native rectangle detection. Phase one is built so phase two is mostly additive. It would be 2.0.

## How we work

1. **Agree before building.** When Rich describes a feature or a batch of changes, reply with a proposal:
   - what changes, how, open questions and gaps in the ACs;
   - its new UAT cases, the connected catalog cases it could affect, and whether a full UAT run is triggered (the `uat` skill).

   When he asks for it as a document, the `feature-request` skill writes it: a Markdown file in `../../feature-requests/` and a request page in Claude, with a description, purpose, impact, drawn wireframes and acceptance criteria (Rich, 2026-11-10).

   Don't edit code until he agrees the full set. Small, clear bug reports with steps can be fixed straight away (Claude's working habit, not a rule Rich set).
2. **Write for the reviewer.** Code is read more than it's run: whole-word names, one statement per line, lines of 100 characters at most, a comment on every function. The detail is in `.claude/rules/code-style.md` (it loads with any code file). Apply it to everything you touch, and don't add to the debt.
3. **Build, then verify yourself** with the `verify` skill. Report measured results, not assumptions. The only thing a browser can't check is the real iOS share sheet.
4. **UAT** (the `uat` skill) has three files, all in the repo (Rich, 2026-11-13):
   - **the catalog** of every case, by feature: each behavior has one row, on one device (the phone for touch, iOS and Safari; desktop for keyboard, DevTools and opened files; the rest shared out), and nothing the automated tests already prove (Rich, 2026-11-10);
   - **the release smoke test:** each device finishes a real listing down a different path;
   - **each version's script:** its new and connected cases plus the smoke test.

   Rich runs the version script on the dev build before release: desktop on `localhost`, iPhone over the LAN on plain HTTP. Pages only serves the `release` branch, so the smoke test and any (HTTPS) rows (the phone's Share and Copy) run again on the live site right after deploy.
5. **Release only on Rich's go-ahead.** He runs `/release X.Y.Z`, which tags `main` and moves the `release` branch (the live site) to the tag.
6. **Record as you go:**
   - user-visible changes in `CHANGELOG.md` under `## [X.Y.0] - Unreleased`;
   - decisions, and files changed in the background, in `../../decision-log.md` (dated, newest first, with the *why*);
   - the "Waiting on" line in `CLAUDE.local.md`.

**Rich's preferences:**
- Direct feedback; push back when something is wrong.
- Simplicity over features: he removed case detection, Square up mode and the Before button when they didn't earn their place.
- No messages a user can't act on (such as "needs HTTPS").
- Nothing blocks the photo, except a temporary flyout the user opens or an alert they must answer before they can go on.

**Brand:** matte black, white, and P1Hunt red (`#e5322d`, kept for the single main action on a screen), bold upright type, flat shapes, no gradients, no italics. Amber only on a warning; no green. Selected is a solid white fill (Rich, 2026-11-14). Inspired by F1, never its trademarks: no F1, FIA, team or driver logos or marks in the app or the docs.

## Hard constraints (still binding)

- **Plain static files:** no build step, no npm, no frameworks, zero runtime dependencies, nothing loaded from another site. Must work from `file://`, `localhost` and a Pages subfolder. Classic `<script src>` on relative paths, with `?v=<appVersion>` on every asset link.
- Everything stays in the browser; no image is ever uploaded.
- **Non-destructive:** the original is never modified. All edits live in one serializable state object, and export is `render(source, state)` from full resolution. Edits files round-trip pixel-identically (R6).
- **Engine / shell split:** `js/engine.js` is pure and runs in a Web Worker; the shell (`js/app/`) talks to adapters (`ImageSource`, `Detector`, `Exporter`, `Session`) so native versions can swap in. The rules in `.claude/rules/` load when you touch those files.
- **Touch first:** everything works by touch alone, with ≥ 44 px targets and safe-area padding. Keyboard shortcuts are extras.
- **Phone memory:** preview from downscaled copies, export in row bands, output capped at 16.7 MP (the iOS canvas limit).
- Every tunable lives in `CONFIG`, overridable from the URL (numbers and on/off only). A setting that sizes canvases, memory or loops gets a range in `CONFIG_LIMITS`; a link can lower a cap, never raise it.
- **Security:**
  - Never build HTML from strings.
  - Keep the strict CSP.
  - Untrusted input (links, edits files, IndexedDB, localStorage) goes through `applyConfigOverrides` / `sanitizeState`. A new state field needs a rule there.
  - `tests/selftest.js` enforces what it can.
  - Before checking out an outside contributor's branch, read its diff to `.claude/` and `tests/`: the hooks run that code without asking.
- **Public repo:** nothing personal or machine-specific in committed files (addresses, local paths, names beyond Rich's). That goes in `CLAUDE.local.md`. Selftest checks for addresses, paths and sample-photo GPS.
- Keep the internal names `storageKey: 'p1hunt.straightener.v1'` and `window.__straightener`; renaming them breaks saved settings and the tests.

## Settled product decisions (don't relitigate without Rich)

- **The card is the only target.** No case or slab detection; the detector prefers the inner of nested quads. Flatten 0% replaced Square up.
- **Default export:** 1:1 fit to card, 2000 px, JPEG 0.92. No HEIC decoder (Safari decodes natively).
- **The 1.10 redesign** (Rich, 2026-11-14; the agreed build plan, its 41 answers and the approved wording are in the decision log). It is built on `main` in six phases, each with its own UAT, and released once as 1.10.0. Until a phase lands, the code still has the old layout for that part. No capability is added or removed. The stack stays plain static files, with `ui.js` split into one file per part; no type checks, so npm stays out.
- **Phone layout:**
  - Top bar, photo, a 200 px control area in three rows (label row, control row, tool row), then a six-step tab bar. The area is the same on every step, so the photo never changes size. No bars before a photo is open. The step menu, the "next step →" buttons and the More options bar are gone.
  - Top bar: Open (always an icon) on the left; Front | Back with Unpair beside it in the center while paired; Undo and Redo on the right; Fit only while the photo is zoomed or panned.
  - One adjustment at a time: one adjustment line and one row of tools. A tool is a mode (it swaps the line; white fill when selected), an action (it does one thing) or a switch (white ring and On).
  - Everyday things in place, the rest in the step's options sheet: it covers about the lower half of the photo, opens from the grabber on the control area's top edge (drag up or tap; the grabber straddles the edge) and closes on a tap outside. The photo doesn't resize. Each sheet has a Tips row that opens in place (Levels' sheet is its tips); keyboard help is desktop only.
  - Status messages take the label row, and appear only when actionable. Export progress is a line on the top edge of the control area or the open sheet. The toast keeps its place over the photo's bottom edge, and rides above an open sheet.
  - The debug panel sits above the control area.
- **Desktop layout:** steps in the top bar, a 380 px right-hand panel, options always open inline, Fit always in the bar, keyboard help under "Tips and keys". Same parts as the phone, arranged differently.
- **Perspective:** Nudge is the resting line; Flatten is a mode (one more tap, Rich's choice); Candidate is an action; Snap and Preview are switches. The confidence readout is always at the right of the label row.
- **Rotate:** the Straighten ruler is the resting line, with Reset; Flip is a mode (Horizontal / Vertical); 90° left and right are actions; Fill frame is a switch; Grid is in the sheet. A typed angle lifts the label row above the keyboard, with ± and Done.
- **Crop:** one sideways-scrolling row of presets, cut off at the right edge so it reads as scrollable, resting scrolled to the selected preset; Fit to card and Swap are tools.
- **Levels:** picks edit a draft until Apply, and levels never carry over between photos (Rich). Discard and Apply sit in the label row with a one-line instruction between them, which stays while a pick is armed (no toast); Auto and Clear are tools; the unapplied mark is a white dot on the Levels tab. White at 245 and black at 8 in linear light, and Auto's black from near-neutral darks only, are Claude's calls, accepted in UAT (1.0, 1.8).
- **Export:** four rows: Size and Format (one tap each); the readout and any note; Share, Download, Copy; then Add back, Corner shots and Next card. Quality, Interpolation, Fill outside photo, the edits files and the source line are in its sheet.
- **Next card:** shown on Export only while the current edits are exported (Rich), in Export's bottom row, in white; the note stays visible beside it. **Add back** always shows there while unpaired.
- **Tap to find card** (Perspective's sheet): the row, then a tap on the card, runs detection at once. The armed status carries a one-tap Cancel. No Detect or Clear seed button, no marker, no Find card button on other statuses; the tapped point is used for that run only.
- **Crop orientation follows the card** (after Perspective + Rotate); Swap overrides it. Claude's design for a bug Rich found, accepted in UAT (1.3.2).
- **Fill outside photo** is in Export's sheet, with the other export settings.
- **Share / Copy:** both need a secure page, so they're *hidden* where unavailable, never greyed out; Copy is also hidden for a pair set to Separately. Download is always shown and is a plain download.
- **Session restore:** the last photo and its edits are kept in IndexedDB, and the app asks Resume / Start fresh instead of resuming automatically.
- **Overlay:**
  - Placement `{id, aspect, cx, cy, w, opacity}` is relative to the final crop and clamped fully inside. The engine owns the maths.
  - It's composited last (Levels never touches it) and shows only on Overlay and Export.
  - Opacity takes the label row, the move and size pads the control row; Replace logo, Reset and Remove are tools. Delete saved overlay is in the sheet.
  - On that step the photo is locked: gestures move the logo. Nine snap rings sit on the photo (corners, side middles, center); a still tap snaps and a drag moves.
  - Drop and paste add a logo there; elsewhere they open a photo.
  - The saved logo is offered with "Use saved overlay", not auto-applied. Delete clears storage only. (That Start fresh keeps it is Claude's call, accepted in UAT.)
  - Edits files embed the logo.
- **Corner shots** (its own sheet, from the Corner shots button on Export, with the progress line on its top edge): a 2×2 sheet (the default; 1:1, no outer margin, since eBay bans added borders) or four photos, Share + Download as for the main export. Each is a square framed like the export (same tilt), at the photo's real resolution, with levels and never the overlay. No quality warning: the readout shows the size and the user decides. When the file (the sheet, or each photo) would be under 2000 px, Download and Share ask **Upscale to 2000 px?** (Yes / No) on a card over the photo; Yes renders the tiles so the file is exactly 2000 px, bicubic, with an unsharp mask (Rich, 2026-11-01). The output choice is a preference, not edit state.
- **Upscale question on the main export** (Rich, 2026-11-01): Download, Share and Copy ask **Upscale to <Size> px?** when the saved file's long edge would be under the chosen Size: a single photo's crop (Yes renders at the Size, bicubic, sharpened before the overlay), a pair's Together image (Yes fits its long edge to exactly the Size) or either of Separately's files (Yes gives each the Size). Original never asks; the answer is per export, not edit state. The sharpen settings are shared (`CONFIG.upscale`).
- **Front + back pairs** (Add back on Export; the last new feature of version 1):
  - Front | Back sits in the center of the top bar on every step, with Unpair beside it; switching keeps the step you're on. Unpair asks Keep front / Keep back; Open, drop and paste ask New photo / Replace side; both on a Resume-style card over the dimmed photo (a tap outside cancels). Next card after the pair's export doesn't ask.
  - Both sides are locked to 5:7; Swap turns both and isn't an undo step; export settings are shared; the 5:7 lock never becomes the remembered preset. Crop's label row says "Pair: 5:7 only".
  - Together = the two exports joined (portrait side by side, landscape stacked, front first, the corner sheet's divider, no margin, size per card, each side's own logo), or Separately; a one-tap two-part control beside the readout, and a preference. Export previews Together. One full-resolution photo in memory at a time.
- **Versioning:** SemVer by user-visible change. Process and tooling changes don't bump the major.

## Map

| Where | What |
|---|---|
| `index.html`, `css/`, `js/` | The app. Rules for each load from `.claude/rules/` when you open the files |
| `icons/` | The app icon: `icon.svg` is the source of the `.ico` and the touch icon (see the `index.html` rule) |
| `docs/architecture.md` | Engine, shell, adapters, coordinate frames, memory budget, edits-file format |
| `tests/README.md` | How to run the tests, what each guards, the detection baseline |
| `.claude/skills/` | `verify` (end-to-end checks), `uat` (Rich's acceptance script), `release` (Rich-triggered), `feature-request` (a request's Markdown file and its page) |
| `.claude/hooks/` | SessionStart: project state. Stop: runs selftest when app code changed |
| `CHANGELOG.md`, `README.md`, `SECURITY.md` | Public docs (see `.claude/rules/public-docs.md`) |
| `tests/uat/` (catalog, smoke), `tests/UAT-X.Y.md` | Rich's manual acceptance tests (the `uat` skill) |
| `archive/`, `CLAUDE.local.md`, `tests/uat/edits-over-8mb.json` | Local only (gitignored) |

**Branches:**
- `main` holds all work. Commit and push it as you go; that never changes the live site.
- `release` is what Pages serves. Never commit to it. Only the `release` skill moves it, and only to a release tag (rollback moves it back one tag). A GitHub ruleset blocks deleting or force-pushing it; Rich is the bypass for rollback.
- `fix/<name>`, from the live tag, is only for a hotfix while `main` has unreleased work.
- Releases are annotated tags on `main` (`vX.Y.Z`). Moving `release` needs Rich's go-ahead.
- GitHub rulesets block deleting or force-pushing `main`, and moving or deleting a pushed `v*` tag.
- Commits end with the `Co-Authored-By` trailer.

## Keeping this current

Claude maintains these files without being asked. Each kind of fact has one home:

| Kind of fact | Home |
|---|---|
| True in every session | this file |
| True for one area of the code | that area's `.claude/rules/` file |
| A multi-step procedure | a skill |
| This machine, or personal | `CLAUDE.local.md` |
| What changed, for users | `CHANGELOG.md` |
| Why we decided it | `../../decision-log.md` |
| How a release was verified | the release's annotated tag message (`git show vX.Y.Z`) |
| What's current (version, what's unreleased, what's blocked and on whom) | Not this file. At the start of every session a script shows Claude the branch, last release, version and the CHANGELOG's unreleased entries; what's blocked is under **Waiting on** in `CLAUDE.local.md` |

- When Rich settles a product decision, add one line under "Settled product decisions" and log the detail in the decision-log.
- **A rule needs a source.** A line in this file, a rule file or a skill that constrains the product or the process needs a decision of Rich's behind it (a decision-log entry). Claude's own build calls, habits and heuristics are marked as Claude's, so no later session takes them for his (Rich, 2026-10-31, after finding a "nothing scrolls" rule he never set).
- When something trips us up, fix the cause if you can (as with the preview port). Otherwise add one line to the nearest rule, skill or `CLAUDE.local.md`.
- Don't record test counts or per-version history in docs; they drift. Prune stale lines instead of appending. Keep this file short (Claude's target: about 120 lines).
- Mention any change to these files in the closing message.
