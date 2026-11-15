---
paths:
  - "js/app/**/*.js"
---

# Shell module rules (`js/app/`)

`tests/selftest.js` enforces the first six.

- Modules live in `js/app/` and, for the fifteen parts, `js/app/parts/`. Each module is `(function (CF) { … })(window.CF)`. Core names are destructured at the top: `const { app, elements, … } = CF;` (plain names only; the check reads that line).
- Anything from another module is called as `CF.name`. Each module ends with `Object.assign(CF, { …exports })`.
- No top-level name may be declared in two modules.
- Only globals in the `GLOBALS` list in `tests/selftest.js`. When you use a new browser API, add it there.
- **Never build HTML from strings:** no `innerHTML` / `outerHTML` / `insertAdjacentHTML` / `document.write` / `eval` / `new Function` / string timers. Build with `CF.makeEl(tag, attributes, ...children)`; set text with `textContent`. Setting `el.style.x` is fine.
- A new module needs a `<script src="js/app/name.js?v=…">` in `index.html`, after `core.js` and before `main.js` (a part: `js/app/parts/name.js`, with the other parts).
- Shared state goes on `app`, never in a top-level `let` shared across modules.
- Untrusted input (edits files, IndexedDB, localStorage) goes through `CF.cleanState` (`CardEngine.sanitizeState`).
- Keep `window.__straightener` (the test hook) and `CONFIG.storageKey` unchanged.
- Touch first: every feature works by touch alone, with ≥ 44 px targets. Keyboard shortcuts are extras.

## Where things are (load order)

- **`core.js`**: creates `CF`; URL overrides of `CONFIG`; theme; `Mat3` / `Vec2` / `Quad` (from `CardEngine`), `FULL_CIRCLE`, `byId`, `makeEl`, `elements`, `clone`, `shortText`, `nextFrame`, `makeCanvas`, `context2d`; the `app` state object; `geometryConfig`; `toast` / `hideToast` (one toast element, built by the Toast part and mounted in the stage; it rides above an open sheet).
- **`adapters.js`**: `ImageSource`, `EngineWorker` (builds the worker), `Detector` (the native swap point), `Prefs`, `Session` (`get` / `put` / `del`; `clear()` keeps the saved logo).
- **`state.js`**: state defaults and `History` (`commit` / `commitFrom` / undo); crop orientation and `stateChanged` (which auto-aligns it); `openFile` (with resume) and `runDetect`.
- **`view.js`**: views, zoom and pan; every draw (source, loupe, debug, result); the mini preview.
- **`levels.js`**: draft, apply, discard; Auto; the dropper; compare; the levels overlays; the Levels step's controls (`buildLevelsControls`, `bindLevels`, `syncLevels`).
- **`overlay.js`**: image decode and validation (SVG via `viewBox`) into an `images` map keyed by byte hash, kept out of the edit state so undo stays small; the saved logo (`Session` keys `'overlay'`, `'photoOverlay'`); embed / restore for edits files; `compositeOverlay` for export; on-screen drawing, handles and gestures (`overlayMove` / `overlayResize` / `overlayPinch`); the Overlay step's controls (`buildOverlayControls`, `bindOverlayControls`, `syncOverlay`).
- **`input.js`**: pointer, wheel and keyboard; handle and crop dragging and snapping; `hitsPhotoControl` (the grabber asks it, so a handle under its target wins the drag). On the Overlay step everything routes to `overlay.js`.
- **`parts/`**: the fifteen parts of the 1.10 layout, one module each (see "The parts" below), and `parts/icon.js` (`ICONS`, `makeIcon`, `makeSvgEl`).
- **`shell.js`**: `STEPS`, `setTab`; the top bar and the tab bar (`elements.topBar`, `elements.tabBar`); `placeLayout` (the phone and wide arrangements); each step's options sheet: the grabber and `closeSheets`; `syncFitButton`; `buildControls` / `bindControls` / `syncUI` / `syncReadouts`, which call each step's own build, bind and sync functions; `pickPhoto`; the step resets.
- **`start-screen.js`**: the Resume prompt (`offerResume`, `resumeSession`).
- **`debug-panel.js`**: the detection tuning panel.
- **`perspective.js`**, **`rotate.js`**, **`crop.js`**: each step's controls: its build, bind and sync functions and its readouts. (Levels' and Overlay's are in `levels.js` and `overlay.js`.)
- **`export.js`**: `Exporter`, `renderFull` and the banded `renderWarped` it shares with corner shots, `encodeCanvas`, `runWithProgress` (draws on the progress line of the host it is given, else the phone's open sheet, else the open step's control area), `askUpscale`, `doExport`, `shareFiles` / `shareFile`, edits save and load.
- **`export-controls.js`**: the Export step's controls (`buildExportControls`, `bindExport`, `syncExportControls`): its four rows (Size and Format; the readout, the notes and a pair's Together | Separately; Share / Download / Copy; Add back, Corner shots, Next card) and its options sheet (Quality, Interpolation, Fill outside photo, the edits buttons, the source line).
- **`corner-shots.js`**: Corner shots, a sheet of its own in Export's section (`cornerShotsSheet`, built by `buildCornerShotsControls`, opened by `openCornerShots`): the sheet / photos preference, rendering through `renderWarped`, Share and Download, the live thumbnails.
- **`pair.js`**: front + back pairs (`app.pair`): Add back, switching sides (the open side lives in `app.*`, the other in `app.pair.other`; while a side or the back opens, `app.isSwitching` is set and the switch, Unpair, the save buttons and Together | Separately are off), Unpair, the question card (`showPrompt` / `hidePrompt`, on the Alert card part; the Upscale question uses it too), the photo prompt (`receivePhoto` handles every incoming photo), the pair's rules (`applyPairRules`, called by `stateChanged`), Together / Separately export, the Together preview, and the `pair` / `pairPhoto` session records.
- **`main.js`**: the layout switch, the self-test runner, `init` (events, `window.__straightener`). Calls `init()` last.

## A step's contract with the shell (Claude's build call, 1.10 phase 2)

- **Its section** of `index.html` (`<section data-panel="step">`, under its `==== step: … ====` comment) holds exactly one control area built with `CF.buildControlArea('<step>Area', …rows)` and one options sheet built with `CF.buildSheet({ id: '<step>Sheet', title }, …)`, both appended by the step's `build<Step>Controls()` (called by `CF.buildControls` before any binding). The shell binds the grabber, opens and closes the sheet, closes it on a step change and on Escape, and lists it inline on a wide screen. Corner shots is the one extra sheet: it sits in Export's section and opens from its button.
- **Its rules** in `css/app.css` go under a `/* ---- step: <Step> ---- */` banner inside THE 1.10 SHELL section; phone-only rules inside that section's phone block, wide-only inside its wide block.

## The parts (`js/app/parts/`)

Fifteen parts build every screen of the 1.10 layout (the plan's component inventory; Rich, 2026-11-14). The names, the function shapes and the class names below are Claude's build calls.

- **One module per part**, with its rules under its own banner in `css/app.css`. A part exports a `build…` function, which returns an element and attaches only the part's own behavior (hold to repeat, the ruler's drag, a sheet's close), and an `update…` function, which writes values into it. A value left out of an update stays as it is.
- **A step composes parts; it doesn't restyle them.** The step's module builds its control area and its sheet from parts, binds their events and syncs them from the state. If a part can't do what a step needs, the part changes (through the lead), not the step.
- **State is in attributes**, so CSS and screen readers agree: `aria-pressed` (a mode or switch tool, a chip, a segment), `aria-selected` (a tab), `disabled`, `hidden`. Looks are `is-…` classes (`is-main`, `is-tall`, `is-warn`).
- **Motion belongs to the parts** (Claude's build, 1.10 phase 6, from the plan's sequences M1 to M13): a part animates itself through classes it sets (`is-open`, `is-dragging`, `is-held`, `is-leaving`, `is-entering`, `is-arriving`, `is-done`, `is-ghost`), only with `transform` and `opacity`. Things drawn on the canvas (Overlay's rings and snap, the compare badge) are timed redraws: the state is committed at once and only the drawing is animated. Ask `CF.isMotionReduced()` before any timed sequence in JS.
- **Fixed heights are tokens** in `:root` (`--top-bar-height`, `--control-area-height`, `--tab-bar-height`); use them, not the numbers.
- **Class names are whole words** (the wireframes' `tb`, `ca`, `lr` are `top-bar`, `control-area`, `label-row`).

| Part | Module | Functions | Classes |
|---|---|---|---|
| Top bar | `top-bar.js` | `buildTopBar`, `updateTopBar`, `buildIconButton` | `.top-bar`, `.top-bar-center`, `.icon-button` |
| Tab bar | `tab-bar.js` | `buildTabBar`, `updateTabBar` | `.tab-bar`, `.step-tab` (`data-step`), `.step-tab-mark` |
| Adjustment line | `adjustment-line.js` | `buildControlArea` (with its grabber and progress line), `buildAdjustmentLine`, `updateAdjustmentLine`, `buildLabelRow`, `buildControlRow`, `buildToolRow`, `buildTextButton`, `swapLine` (a mode tap's line swap), `fadeInControlArea` (a step change), `isMotionReduced` | `.control-area`, `.grabber`, `.label-row`, `.control-row`, `.tool-row`, `.line-label`, `.line-value`, `.line-readout`, `.text-button` |
| Status | `status.js` | `buildStatus`, `updateStatus` | `.status-line` |
| Ruler | `ruler.js` | `buildRuler`, `updateRuler` | `.ruler` (wraps the range input; Rotate's keeps the id `fine`) |
| Slider | `slider.js` | `buildSlider`, `updateSlider` | `.slider` (wraps a range input; `is-held` while pressed) |
| Tool | `tool.js` | `buildTool`, `updateTool` | `.tool`, `.tool-mode`, `.tool-action`, `.tool-switch` |
| Action button | `action-button.js` | `buildActionButton`, `updateActionButton` | `.action-button` (`is-main`, `is-next`, `is-quiet`, `is-small`, `is-tall`, `is-wide`) |
| Chip | `chip.js` | `buildChip`, `updateChip`, `buildChipRow`, `revealSelectedChip` | `.chip-row`, `.preset-chip` (`data-value`) |
| Segmented control | `segmented-control.js` | `buildSegmented` (`isSliding`: a white pill slides between two equal halves, the side switch), `updateSegmented`, `bindSegmented`, `buildSwatch`, `updateSwatch` | `.segmented-control` (`is-fitted`, `is-dense`, `is-compact`), `.segment` (`data-value`), `.segment-swatch` |
| Nudge pad | `nudge-pad.js` | `buildNudgePad`, `updateNudgePad`, `bindNudgePad` | `.nudge-pad`, `.nudge-key` (`data-key`) |
| Sheet | `sheet.js` | `buildSheet`, `openSheet` (fires `sheetopen`), `closeSheet` (fires `sheetclose`), `isSheetOpen`, `bindSheetHandle` (tap or drag a handle), `buildHandleTab` (the grabber's tab with its chevron; the control area's grabber and every sheet hold one), `updateSheet`, `buildSheetList`, `buildSheetRow`, `buildSwitchRow`, `buildTipsRow`, `buildSheetHeading`, `buildSheetHint` | `.sheet-layer`, `.sheet`, `.handle-tab`, `.sheet-list`, `.sheet-row`, `.switch`, `.sheet-hint` |
| Alert card | `alert-card.js` | `buildAlertCard` (optional ids for its three buttons), `updateAlertCard`, `showAlert`, `hideAlert` (fires `alertclose`), `isAlertOpen` (read this, not the layer's `hidden`, which stays false through the fade-out) | `.alert-layer`, `.alert-card` |
| Toast | `toast.js` | `buildToast`, `updateToast` | `.toast-message` (`is-warn`, `is-error`, `is-shown`) |
| Progress line | `progress-line.js` | `buildProgressLine`, `updateProgressLine` | `.progress-line` |

Every step, and the debug panel, is built from the parts.
