# Tests

Two automated layers. Run both before treating any change as done. A failure is a regression unless the change deliberately moved that behavior; then update the test in the same change. Pass counts come from the test output; they aren't recorded here.

## `node tests/selftest.js` (Node, no dependencies, under a second)

Exit code 0 means everything passed.

| Group | What it guards |
|---|---|
| Engine purity | `js/engine.js` has no `window` / `document`, so it runs unchanged in a Web Worker |
| Cache-busting | Every `?v=` asset link in `index.html` (scripts, styles, icons) equals `CONFIG.appVersion`, and every linked file exists |
| Module boundaries | `js/app/` modules all load (`core` first, `main` last); no name declared twice; cross-module names go through `CF`; only known globals (the `GLOBALS` list, extended when the shell uses a new browser API); every `CF` name is exported |
| Security | No HTML-string sinks, `eval`, `new Function` or string timers in `js/`; `index.html` has a strict CSP before any asset and nothing inline or off-site |
| Privacy | No GPS location in `samples/` photos; no private network addresses or local drive paths in the published text files |
| CONFIG consistency | The engine's built-in defaults (`DETECT_DEFAULTS`, `GEOMETRY_DEFAULTS`, `LEVELS_DEFAULTS`) match `CONFIG`; every `CONFIG_LIMITS` key is a `CONFIG` number with its default in range |
| Code style | The parts of `.claude/rules/code-style.md` a tokenizer can check (`tests/style-check.js`): lines of at most 100 characters, no one- or two-letter names outside the allowed list, one statement per line, one declaration per `const` / `let` / `var` |
| Engine self-tests | Geometry (homography round trip, Flatten 0% and 100%, perspective-corrected aspect, degenerate quads, the rotate/flip/crop pipeline, identity warp), detection (synthetic card, sub-pixel refinement, a faint card found by the second pass), Levels (pick targets, robust dropper, Auto, Auto ignoring colored darks), Overlay (placement, snap margins), untrusted input (URL overrides and their safe ranges, edits-file checks) |

The engine self-tests also run in the app with `?selftest=1`, on the main thread and inside the worker; the toast reads `main n/n, worker n/n`.

## `tests/sample-regression.js` (browser, about 20 s)

1. Serve this folder: `python -m http.server 8765`, then open `http://localhost:8765/index.html` and keep the tab visible (hidden tabs pause rendering).
2. Paste the file into the DevTools console, or load it as a script (the page's CSP blocks `eval` but allows its own files):
   `document.head.append(Object.assign(document.createElement('script'), { src: 'tests/sample-regression.js' }))`, then `await window.__regression`.
3. It prints a PASS/FAIL table. It leaves a session and remembered settings behind; clear them afterwards.

| ID | Check |
|---|---|
| R1 | Detection on each sample is held to its own baseline (below): no photo that works today may break |
| R2 | Flatten 100% on exported pixels: corners 90° ± 0.5°, aspect 5:7 ± 0.5% |
| R3 | Flatten 0%: top and bottom level within 0.3°, sides mirror within 0.5° |
| R4 | Export is full resolution with no resize; JPEG quality is respected; resize sets the long edge |
| R5 | A Levels white pick on the PSA label exports neutral at 245 ± 2 |
| R6 | Save → reload → load edits exports pixel-identical |
| R7 | Ctrl+Z / Shift+Ctrl+Z work while a slider has focus |
| R8 | Engine self-tests pass inside the Web Worker |
| R9–R13 | Overlay: alpha compositing, 50% opacity, same relative place at every export size, edits file with an embedded logo rebuilds exactly, no overlay leaves the export unchanged |
| R14 | Real edits pass the edits-file check unchanged, and every state field has a rule in `sanitizeState` |
| R15 | Auto levels at the default framing: the white point matches 1.7 on every sample, and the black point is near-neutral or absent |

### Detection (R1)

Error = worst corner distance ÷ image diagonal. A pick is **found** when its error is under 1%. The hand-placed corners and each photo's baseline (`GROUND_TRUTH`, `BASELINE`) are in the script.

Each photo is in a group, set by its top pick's baseline:

| Group | Top-pick baseline | Rule |
|---|---|---|
| Within 1% | under 1% | Stays under 1%, and no worse than its baseline + 0.25 points |
| Near miss | 1% to 5% | No worse than its baseline + 0.25 points |
| Wrong shape | over 5% (the top pick is a different rectangle) | Reported, not gated |

Any photo whose best of 3 is under 1% (one Candidate tap away) stays under 1%.

When a change improves a photo, lower its baseline in the same change; it moves into the better group and is held to that from then on. Raising a baseline needs the maintainer's agreement.

The run also prints a **scoreboard** that never fails: how many photos are found by the top pick and by the best of 3, raw cards on their own, and the held-out photos. The held-out photos (`HELD_OUT`) are not looked at while tuning detection and are checked once at the end, so a change that only fits the photos it was tuned on shows up.

| Sample | Shot | Top pick | Best of 3 | Group |
|---|---|---|---|---|
| IMG_9060 | One-touch on a stand | 2.48% | 0.49% | Near miss (the stand edge outranks the card) |
| IMG_9074 | Beckett slab on a stand | 1.80% | 1.80% | Near miss (the card edge is nearly invisible beside a rail) |
| IMG_9075 | Beckett slab on white | 0.04% | 0.04% | Within 1% |
| IMG_9136 | PSA slab | 0.46% | 0.46% | Within 1% |
| IMG_9142 | CGC slab, landscape card, on a stand | 0.25% | 0.25% | Within 1% |
| IMG_9216 | Toploader on a stand | 0.09% | 0.09% | Within 1% |
| 01_chrome_flat_black | Raw chrome card, flat on a black mat | 0.00% | 0.00% | Within 1% |
| 02_black_flat_black | Raw black card, flat on a black mat | 0.24% | 0.24% | Within 1% (found by the second, more sensitive pass) |
| 03_chrome_flat_busy | Raw chrome card, flat on a busy mat | 24.32% | 24.32% | Wrong shape (mat lines break up the card's outline). Held out |
| 04_red_angle_busy | Raw red card, steep angle, busy mat | 6.29% | 1.35% | Wrong shape (the printed frame inside the card) |
| 05_sapphire_flat_black | Landscape card in a toploader, black mat | 0.03% | 0.03% | Within 1% |
| 06_chrome_flat_white | Toploader, flat on white | 0.42% | 0.42% | Within 1% |
| 07_dark_flat_black | Landscape card in a toploader, black mat | 1.75% | 0.93% | Near miss (misses the bottom strip). Held out |
| 08_silver_stand_busy | Silver card in a toploader on a silver stand, busy background | 1.16% | 1.16% | Near miss (the card's bottom edge barely differs from the stand) |
| 09_silver_stand_white | Hard holder on a stand, white background | 0.19% | 0.19% | Within 1% |
| 10_sapphire_flat_busy | Hard holder, flat on a busy mat | 5.64% | 1.60% | Wrong shape (stops above the name bar). Held out |
| 11_any_flatglare_black | Graded slab with glare, black mat | 1.24% | 1.24% | Near miss |
| 12_blackred_stand_busy | Graded slab on a stand, busy background | 0.36% | 0.36% | Within 1%. Held out |

## Bugs that became tests

| Bug | Guard |
|---|---|
| Keyboard undo ignored while a slider had focus | R7 |
| The dropper averaged label text into the white pick, so the true white clipped | Engine self-test "Dropper ignores text inside a white patch" |
| A module lost a `const` during the 1.4 split and only failed when that path ran | "No undeclared names" check |
| Auto levels stores fractions; a whole-number rule would have reset it on load | R14 |

## Adding a sample photo

Strip location data first. The privacy check fails on any JPEG in `samples/` with a GPS block. Put the photo in `samples/` itself, not a subfolder (the privacy check only looks there), with an uppercase `.JPEG` extension; the script assumes it. Keep it full frame, as the phone took it.

To place its corners, open it in the app, drag the four corners onto the card's outer corners (the card, not its holder) and use **Save edits**; the file's `corners` go into `GROUND_TRUTH`. Run the regression once, put the measured top-pick and best-of-3 errors into `BASELINE`, and add a row to the table above. A new photo comes in at its measured baseline, so it never changes the rule for the others.
