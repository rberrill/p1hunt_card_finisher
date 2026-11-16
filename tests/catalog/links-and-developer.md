# Settings from a link, self-tests, the tuning panel

What a link can change, the self-tests a link can run, the detection tuning panel, and the hook automated tests use.

## DEV-01 A link can change a setting

A link can change one of the app's settings by its dotted name, such as `?detect.cannyHigh=90`. Only settings that already exist and are a number or on/off can be changed.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.detect.cannyHigh`, `"URL settings ignored (unknown, not a number / on-off setting, "`
- Source: `js/app/core.js` (the link overrides at load), `js/engine.js` (`applyConfigOverrides`)
- Cases: none yet

## DEV-02 On/off settings and the undo limit from a link

The on/off settings a link can turn on or off are: session saving, the Share button, upscaling small crops, detection's fine refinement and color edges. The undo history's length takes 1 to 200 steps.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.session.enabled`, `CONFIG.export.share`, `CONFIG.export.allowUpscale`, `CONFIG.detect.refine`, `CONFIG.historyLimit`
- Source: `js/config.js` (`CONFIG`, `CONFIG_LIMITS`), `js/engine.js` (`applyConfigOverrides`)
- Cases: none yet

## DEV-03 A rejected link setting is reported in the console only

A setting in a link that doesn't exist, isn't a number or on/off, or is out of its range is ignored, and named in a warning in the browser's console. Nothing shows on screen.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `"URL settings ignored (unknown, not a number / on-off setting, "`, `"or outside its safe range):"`
- Source: `js/app/core.js` (the link overrides at load)
- Cases: none yet

## DEV-04 `?debug` turns on the developer view

A link with `?debug` (any value but `0` or `false`) opens the tuning panel at start, turns the **Debug overlay** on, and logs each detection's timing in the console.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.debug`, `#debugPanel`, `#debugOverlay`, `"[card-finisher] detect"`
- Source: `js/app/core.js` (the `debug` link setting), `js/app/main.js` (`init`), `js/app/state.js` (`runDetect`)
- Cases: none yet

## DEV-05 `?selftest` runs the engine self-tests

A link with `?selftest` runs the engine's self-tests on the page and in the background worker, prints both result tables in the console, and shows a message with both counts (**Self-tests: main …, worker …**), red if any failed. The results are also kept on the page for a script to read.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `"Self-tests: main "`, `", worker unavailable"`, `"[card-finisher] self-tests (main thread)"`, `"[card-finisher] self-tests (Web Worker)"`
- Source: `js/app/main.js` (`runSelfTests`, `init`), `js/engine.js` (`selfTest`)
- Ruling: R28. `?selftest=0` means off: the self-tests do not run. The app differs today.
- Cases: none yet

## DEV-06 The detection tuning panel

The **Detection tuning** panel has a field for each number and on/off setting of detection. Changing a field takes effect at once and re-runs detection 350 ms after the last change.

- Risk: low
- Check: script
- Layout: both. Phone: full width, just above the controls under the photo, at most 40% of the screen's height. Wide: at the top right, left of the side panel.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#debugPanel`, `"Detection tuning"`, `CONFIG.detect.cannyLow`
- Source: `js/app/debug-panel.js` (`toggleDebugPanel`, `buildDebugPanel`), `css/app.css` (`#debugPanel`)
- Ruling: R29. The tuning panel's fields may take values outside the safe ranges a link is held to; it is a tuning tool. The app already does this.
- Flag: to confirm. On the phone with no photo open, the panel floats over the start screen.
- Cases: none yet

## DEV-07 The tuning panel's buttons

The panel has a close button (tooltip **Close tuning**), **Copy CONFIG**, which copies all the settings to the clipboard (or prints them in the console if the clipboard is blocked), and **Re-detect**, which runs detection again.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#debugClose`, `#debugCopy`, `#debugRun`, `"Clipboard blocked — CONFIG printed to the console."`
- Source: `js/app/debug-panel.js` (`buildDebugPanel`)
- Flag: to confirm. The blocked-clipboard message joins its two parts with a dash, where the app's other messages use two sentences.
- Cases: none yet

## DEV-08 The tuning panel's detection report

Under its fields the panel shows the last detection's timings (round trip, analyze, quads), how many lines and shapes it found, and each candidate's score, confidence and shape figures.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#debugInfo`, `"round trip "`
- Source: `js/app/debug-panel.js` (`updateDebugPanel`)
- Cases: none yet

## DEV-09 Opening the tuning panel turns the debug overlay on

Opening the tuning panel turns the **Debug overlay** on. If it was off and a photo is open, detection runs again so the panel's report fills in.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#debugPanel`, `#debugOverlay`, `CONFIG.keys.debug`
- Source: `js/app/debug-panel.js` (`toggleDebugPanel`)
- Ruling: R3. Turning the debug overlay on leaves the corners alone and only draws. The app differs today.
- Cases: none yet

## DEV-10 The test hook

The page exposes a hook for automated tests, `window.__straightener`, with the app's state and these calls: open a file, run detection, render the full export, change step, commit, undo, redo, report a change, and the worker, detector, drawing, session, resume, share and export parts.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `window.__straightener`
- Source: `js/app/main.js` (`init`)
- Cases: none yet
