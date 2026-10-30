---
paths:
  - "js/app/**/*.js"
---

# Shell module rules (`js/app/`)

`tests/selftest.js` enforces the first six.

- Each module is `(function (CF) { … })(window.CF)`. Core names are destructured at the top: `const { app, els, … } = CF;`.
- Anything from another module is called as `CF.name`. Each module ends with `Object.assign(CF, { …exports })`.
- No top-level name may be declared in two modules.
- Only globals in the `GLOBALS` list in `tests/selftest.js`. When you use a new browser API, add it there.
- **Never build HTML from strings:** no `innerHTML` / `outerHTML` / `insertAdjacentHTML` / `document.write` / `eval` / `new Function` / string timers. Build with `CF.h(tag, attrs, ...children)`; set text with `textContent`. Setting `el.style.x` is fine.
- A new module needs a `<script src="js/app/name.js?v=…">` in `index.html`, after `core.js` and before `main.js`.
- Shared state goes on `app`, never in a top-level `let` shared across modules.
- Untrusted input (edits files, IndexedDB, localStorage) goes through `CF.cleanState` (`CardEngine.sanitizeState`).
- Keep `window.__straightener` (the test hook) and `CONFIG.storageKey` unchanged.
- Touch first: every feature works by touch alone, with ≥ 44 px targets. Keyboard shortcuts are extras.

## Where things are (load order)

- **`core.js`**: creates `CF`; URL overrides of `CONFIG`; theme; `$`, `h`, `els`, `clone`, `nextFrame`, `makeCanvas`, `ctx2d`; the `app` state object; `geoCfg`; `toast`.
- **`adapters.js`**: `ImageSource`, `EngineWorker` (builds the worker), `Detector` (the native swap point), `Prefs`, `Session` (`get` / `put` / `del`; `clear()` keeps the saved logo).
- **`state.js`**: state defaults and `History` (`commit` / `commitFrom` / undo); crop orientation and `stateChanged` (which auto-aligns it); `openFile` (with resume) and `runDetect`.
- **`view.js`**: views, zoom and pan; every draw (source, loupe, debug, result); the mini preview.
- **`levels.js`**: draft, apply, discard; Auto; the dropper; compare; the levels overlays.
- **`overlay.js`**: image decode and validation (SVG via `viewBox`) into an `images` map keyed by byte hash, kept out of the edit state so undo stays small; the saved logo (`Session` keys `'overlay'`, `'photoOverlay'`); embed / restore for edits files; `compositeOverlay` for export; on-screen drawing, handles and gestures (`ovMove` / `ovResize` / `ovPinch`); `syncOverlay`.
- **`input.js`**: pointer, wheel and keyboard; handle and crop dragging and snapping. On the Overlay step everything routes to `overlay.js`.
- **`ui.js`**: `setTab` and the step menu; `buildControls` / `bindControls` (every button handler); `syncUI` / `syncReadouts`; the debug panel; the resume prompt.
- **`export.js`**: `Exporter`, `renderFull`, `doExport`, `shareFile`, edits save and load.
- **`main.js`**: the layout switch, the self-test runner, `init` (events, `window.__straightener`). Calls `init()` last.
