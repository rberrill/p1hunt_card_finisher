---
name: verify
description: Verify a Card Finisher change end to end before calling it done - Node selftest, the browser sample regression, phone and desktop layout and behavior checks, the Pages-style subfolder and file:// runs. Use after any change to js/, css/, index.html or tests/, before a commit, and as the release preflight.
---

# Verify a change

Rich runs UAT only after this passes, so it must cover everything a browser can check, phone layout included. The one thing it can't check is the real iOS share sheet. Test the Share code path with a stubbed `navigator.share`; the real sheet is Rich's UAT.

## Pick the scope

| Changed | Run |
|---|---|
| Docs or Claude files only | `node tests/selftest.js` (privacy check) |
| `js/engine.js` | 1, 2, 5 |
| `js/app/`, `index.html` | 1, 2, 3 (the touched areas), 4, 5 |
| `css/` or anything that moves layout | 1, 3 at all three sizes |
| Release preflight | Everything |

## Steps

1. **Node:** `node tests/selftest.js`. All checks pass.
2. **Sample regression:** `preview_start` with `straightener` (port 8766). Refresh the assets (the `?v=` doesn't change during development; see [browser-recipes.md](browser-recipes.md)), load `tests/sample-regression.js` as a script, and await `window.__regression`. All checks pass.
3. **Behavior and layout:** work through the relevant rows of [checks.md](checks.md) at **390×844**, then **375×667** when layout changed, then **1280×800**. Measure (`scrollWidth`, `getBoundingClientRect`); don't eyeball. Screenshot once per size as proof, retaking any that come back tiled or stale.
4. **Subfolder:** `preview_start` with `subfolder` (port 8771) and open `http://127.0.0.1:8771/p1hunt-photo-straightener/index.html`. It loads styled, opens a sample, and has no 404s in `read_network_requests`.
5. **`file://`:** `node .claude/skills/verify/file-protocol-check.js`. All checks pass.
6. **Clean up:** `__straightener.Session.clear()`, `__straightener.Session.del('overlay')`, `localStorage.clear()`, and `resize_window` with preset `desktop`.

## Report

Give a short table of what ran and the measured result of each check, with counts from the output. Say plainly what wasn't covered: always the real share sheet, plus anything skipped by the scope above. If a check fails, fix the cause, or say why the change deliberately moved that behavior and update the test in the same change.
