# Tests

Two automated layers. Run both before treating any change as done. A failure is a regression unless the change deliberately moved that behavior; then update the test in the same change. Pass counts come from the test output; they aren't recorded here.

## `node tests/selftest.js` (Node, no dependencies, under a second)

Exit code 0 means everything passed.

| Group | What it guards |
|---|---|
| Engine purity | `js/engine.js` has no `window` / `document`, so it runs unchanged in a Web Worker |
| Cache-busting | Every `?v=` asset link in `index.html` equals `CONFIG.appVersion` |
| Module boundaries | `js/app/` modules all load (`core` first, `main` last); no name declared twice; cross-module names go through `CF`; only known globals (the `GLOBALS` list, extended when the shell uses a new browser API); every `CF` name is exported |
| Security | No HTML-string sinks, `eval`, `new Function` or string timers in `js/`; `index.html` has a strict CSP before any asset and nothing inline or off-site |
| Privacy | No GPS location in `samples/` photos; no private network addresses or local drive paths in the published text files |
| CONFIG consistency | The engine's built-in defaults (`DETECT_DEFAULTS`, `GEOMETRY_DEFAULTS`, `LEVELS_DEFAULTS`) match `CONFIG`; every `CONFIG_LIMITS` key is a `CONFIG` number with its default in range |
| Code style | The parts of `.claude/rules/code-style.md` a tokenizer can check (`tests/style-check.js`): lines of at most 100 characters, no one- or two-letter names outside the allowed list, one statement per line, one declaration per `const` / `let` / `var` |
| Engine self-tests | Geometry (homography round trip, Flatten 0% and 100%, perspective-corrected aspect, degenerate quads, the rotate/flip/crop pipeline, identity warp), detection (synthetic card, sub-pixel refinement), Levels (pick targets, robust dropper, Auto), Overlay (placement, snap margins), untrusted input (URL overrides and their safe ranges, edits-file checks) |

The engine self-tests also run in the app with `?selftest=1`, on the main thread and inside the worker; the toast reads `main n/n, worker n/n`.

## `tests/sample-regression.js` (browser, about 20 s)

1. Serve this folder: `python -m http.server 8765`, then open `http://localhost:8765/index.html` and keep the tab visible (hidden tabs pause rendering).
2. Paste the file into the DevTools console, or load it as a script (the page's CSP blocks `eval` but allows its own files):
   `document.head.append(Object.assign(document.createElement('script'), { src: 'tests/sample-regression.js' }))`, then `await window.__regression`.
3. It prints a PASS/FAIL table. It leaves a session and remembered settings behind; clear them afterwards.

| ID | Check |
|---|---|
| R1 | Detection on each sample is no worse than the baseline below (+0.25 points); top-1 within 1% of the diagonal on ≥ 4 of 6; best of 3 within 1% on ≥ 5 of 6 |
| R2 | Flatten 100% on exported pixels: corners 90° ± 0.5°, aspect 5:7 ± 0.5% |
| R3 | Flatten 0%: top and bottom level within 0.3°, sides mirror within 0.5° |
| R4 | Export is full resolution with no resize; JPEG quality is respected; resize sets the long edge |
| R5 | A Levels white pick on the PSA label exports neutral at 245 ± 2 |
| R6 | Save → reload → load edits exports pixel-identical |
| R7 | Ctrl+Z / Shift+Ctrl+Z work while a slider has focus |
| R8 | Engine self-tests pass inside the Web Worker |
| R9–R13 | Overlay: alpha compositing, 50% opacity, same relative place at every export size, edits file with an embedded logo rebuilds exactly, no overlay leaves the export unchanged |
| R14 | Real edits pass the edits-file check unchanged, and every state field has a rule in `sanitizeState` |

### Detection baseline (v1.0, desktop Chrome)

Error = worst corner distance ÷ image diagonal. The ground-truth corners are embedded in the script.

| Sample | Shot | Top pick | Best of 3 |
|---|---|---|---|
| IMG_9060 | One-touch on a stand | 2.48% | 0.49% (2nd candidate; the stand edge outranks the card) |
| IMG_9074 | Beckett slab on a stand | 1.80% | 1.80% (the card edge is nearly invisible beside a rail) |
| IMG_9075 | Beckett slab on white | 0.04% | 0.04% |
| IMG_9136 | PSA slab | 0.46% | 0.46% |
| IMG_9142 | CGC slab, landscape card, on a stand | 0.25% | 0.25% |
| IMG_9216 | Toploader on a stand | 0.09% | 0.09% |

## Bugs that became tests

| Bug | Guard |
|---|---|
| Keyboard undo ignored while a slider had focus | R7 |
| The dropper averaged label text into the white pick, so the true white clipped | Engine self-test "Dropper ignores text inside a white patch" |
| A module lost a `const` during the 1.4 split and only failed when that path ran | "No undeclared names" check |
| Auto levels stores fractions; a whole-number rule would have reset it on load | R14 |

## Adding a sample photo

Strip location data first. The privacy check fails on any JPEG in `samples/` with a GPS block. Add its hand-placed corners to `GROUND_TRUTH` and a baseline to `RECORDED` in `sample-regression.js`. Use an uppercase `.JPEG` extension; the script assumes it.
