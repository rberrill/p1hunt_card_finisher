---
paths:
  - "js/engine.js"
---

# Engine rules (`js/engine.js`)

- `CardEngine` is pure functions over `ImageData`, typed arrays and plain objects. **No `window` / `document`**, not even in comments, because the S0 check counts the words.
- The file is wrapped in `function CardEngineModule(G)`. The worker is built from `CardEngineModule.toString()` in a Blob, not loaded by URL, because Chrome blocks file-based workers from `file://`. Don't change this.
- The engine owns all geometry and maths the shell needs: `computeGeometry`, `overlayRect` / `clampOverlay` / `snapOverlay`, Levels LUTs. The shell calls them; it doesn't re-derive them.
- Untrusted input goes through `applyConfigOverrides` (own, existing number / boolean keys only) and `sanitizeState`. **A new state field needs a rule in `sanitizeState`**, or it is reset on load (regression R14 fails).
- New behavior gets a self-test in `selfTest()`. It runs in Node (`tests/selftest.js`), on the main thread, and in the worker (`?selftest=1`). Add a one-line row for it under "Engine self-tests" in `tests/README.md` if it opens a new area.
- Every tunable lives in `CONFIG` (`js/config.js`), never as a literal here.
