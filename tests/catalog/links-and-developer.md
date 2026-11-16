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
- Cases: 1

That a link can't set text, lists or anything outside the settings is SEC-03.1.

### DEV-01.1 A link sets a number setting   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test, opened with the link index.html?export.longEdge=1080
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the start screen

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Open photo**, choose the photo, then tap **Export** in the step bar | **1080** is the selected Size, where the shipped default is 2000 |

Pass: every row's result is seen.
On a fail, record: the Size that is selected, a screenshot.

## DEV-02 On/off settings and the undo limit from a link

The on/off settings a link can turn on or off are: session saving, the Share button, upscaling small crops, detection's fine refinement and color edges. The undo history's length takes 1 to 200 steps.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.session.enabled`, `CONFIG.export.share`, `CONFIG.export.allowUpscale`, `CONFIG.detect.refine`, `CONFIG.historyLimit`
- Source: `js/config.js` (`CONFIG`, `CONFIG_LIMITS`), `js/engine.js` (`applyConfigOverrides`)
- Cases: 3

Turning session saving off from a link is STA-17.1, and upscaling on, EXP-04.3.

### DEV-02.1 A link turns the Share button off, with 0 or false only   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, in a browser that can share files (a secure page on an iPhone; the automated test gives the page a stand-in share sheet), with the developer tools open on the Console
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the start screen, opened with the link index.html?export.share=0

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Open photo**, choose the photo, then tap **Export** in the step bar | **Share** is not shown; **Download** is |
| 2 | Open the link index.html?export.share=no, open the photo again and tap **Export** | The Console warns "[card-finisher] URL settings ignored (unknown, not a number / on-off setting, or outside its safe range): export.share", and **Share** is shown |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### DEV-02.2 A link sets the undo history's length   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test, opened with the link index.html?historyLimit=2
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Rotate step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **90° right** three times | The photo has turned three quarters |
| 2 | Tap **Undo** twice | The photo is turned one quarter right, and **Undo** is greyed out: only two steps were kept |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### DEV-02.3 An undo length outside 1 to 200 is ignored   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with the developer tools open on the Console
- Build: the build under test
- Starting screen: none; the case opens two links

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Open the link index.html?historyLimit=0 | The Console warns "[card-finisher] URL settings ignored (unknown, not a number / on-off setting, or outside its safe range): historyLimit" |
| 2 | Open the link index.html?historyLimit=201 | The same warning again |
| 3 | In the Console, read CONFIG.historyLimit | 50, the shipped length |

Pass: every row's result is seen.
On a fail, record: the row number, the Console's text.

## DEV-03 A rejected link setting is reported in the console only

A setting in a link that doesn't exist, isn't a number or on/off, or is out of its range is ignored, and named in a warning in the browser's console. Nothing shows on screen.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `"URL settings ignored (unknown, not a number / on-off setting, "`, `"or outside its safe range):"`
- Source: `js/app/core.js` (the link overrides at load)
- Cases: 1

### DEV-03.1 Rejected link settings are named in the console, and nothing shows   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with the developer tools open on the Console
- Build: the build under test, opened with the link index.html?nope=1&crop.presets=x&historyLimit=500&detect.cannyHigh=90
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the start screen; then open the photo

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the Console | One warning, in the warning color, reads "[card-finisher] URL settings ignored (unknown, not a number / on-off setting, or outside its safe range): nope, crop.presets, historyLimit" |
| 2 | Look at the screen | No message shows about the link |
| 3 | In the Console, read CONFIG.detect.cannyHigh | 90: the good setting in the same link was applied |

Pass: every row's result is seen.
On a fail, record: the row number, the Console's text, a screenshot.

## DEV-04 `?debug` turns on the developer view

A link with `?debug` (any value but `0` or `false`) opens the tuning panel at start, turns the **Debug overlay** on, and logs each detection's timing in the console.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.debug`, `#debugPanel`, `#debugOverlay`, `"[card-finisher] detect"`
- Source: `js/app/core.js` (the `debug` link setting), `js/app/main.js` (`init`), `js/app/state.js` (`runDetect`)
- Cases: 2

### DEV-04.1 ?debug opens the tuning panel, turns Debug overlay on and logs each detection   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with the developer tools open on the Console
- Build: the build under test, opened with the link index.html?debug (no value)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the start screen

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the screen | The **Detection tuning** panel is open |
| 2 | Tap **Open photo** and choose the photo | The Console logs a line that starts "[card-finisher] detect" |
| 3 | Open **Perspective options** | **Debug overlay** is on |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### DEV-04.2 ?debug=0 and ?debug=false leave the developer view off   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with the developer tools open on the Console
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: none; the case opens two links

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Open the link index.html?debug=0 and open the photo | No tuning panel; **Debug overlay** in **Perspective options** is off; no "[card-finisher] detect" line in the Console |
| 2 | Open the link index.html?debug=false and open the photo | The same |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

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
- Cases: 2

### DEV-05.1 ?selftest runs the self-tests on the page and in the worker   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with the developer tools open on the Console
- Build: the build under test
- Starting screen: none

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Open the link index.html?selftest | A message over the screen reads "Self-tests: main N/N, worker N/N", the same N four times, not in red |
| 2 | Look at the Console | Two groups, "[card-finisher] self-tests (main thread)" and "[card-finisher] self-tests (Web Worker)", each with a table of results |

Pass: every row's result is seen.
On a fail, record: the row number, the message's text, the Console's tables.

### DEV-05.2 ?selftest=0 runs no self-tests   [auto: phone]
Written to ruling R28; it fails until that is built (BUG-171).
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with the developer tools open on the Console
- Build: the build under test
- Starting screen: none

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Open the link index.html?selftest=0 and wait a second | No "Self-tests" message shows, and the Console holds no self-test tables |

Pass: every row's result is seen.
On a fail, record: the message's text, a screenshot.

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
- Cases: 3

### DEV-06.1 The panel has a field per detection setting and detects again after a change   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test, opened with the link index.html?debug=1
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, the **Detection tuning** panel showing

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Scroll through the panel's fields | One field for each number and on/off setting of detection, named as in js/config.js (workingSize first, refineInlierPx last) |
| 2 | Clear **cannyHigh** and type 70 | The setting is 70 at once (CONFIG.detect.cannyHigh in the Console); detection has not run yet |
| 3 | Wait a second | Detection has run once, about 0.35 s after the last keystroke: the report under the fields has changed |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### DEV-06.2 Where the panel sits   [auto: both, webkit]
Flag: to confirm. Written to what the app does today: on a phone with no photo open, the panel floats over the start screen.
Before you start:
- Device and browser: a phone-width window (390 × 844 px) or a wide one (1280 × 800 px)
- Build: the build under test, opened with the link index.html?debug=1
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the start screen

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the screen | On a phone, the panel floats over the start screen |
| 2 | Open the photo | On a phone, the panel spans the window less 8 px each side, its bottom 8 px above the controls, at most 40% of the window's height. On a wide screen, it is 64 px from the top and 8 px left of the 380 px side panel |

Pass: every row's result is seen.
On a fail, record: the row number, the panel's position, a screenshot.

### DEV-06.3 A field takes a value a link could not   [auto: phone]
Written to ruling R29, which keeps what the app does today: the panel is a tuning tool.
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with the developer tools open on the Console
- Build: the build under test, opened with the link index.html?debug=1
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, the panel showing

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Clear **workingSize** and type 2500 | CONFIG.detect.workingSize reads 2500, over the 2000 a link is held to |

Pass: every row's result is seen.
On a fail, record: the value read, a screenshot.

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
- Cases: 3

### DEV-07.1 Re-detect runs detection, and Close tuning closes the panel   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test, opened with the link index.html?debug=1
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, the panel showing

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Re-detect** | Detection runs once more: the report's round trip time changes |
| 2 | Tap **Close tuning** (the × at the panel's top right) | The panel closes; **Debug overlay** stays on |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### DEV-07.2 Copy CONFIG copies every setting   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, in a browser allowed to use the clipboard, and a text editor
- Build: the build under test, opened with the link index.html?debug=1
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, the panel showing

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Copy CONFIG** | A message reads "CONFIG copied." |
| 2 | Paste into the text editor | `const CONFIG = ` and every setting, as JSON spread over lines, ending `};` |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### DEV-07.3 With the clipboard blocked, CONFIG goes to the console   [auto: phone]
Flag: to confirm. Written to what the app does today: the message joins its two parts with a dash.
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with the developer tools open on the Console, in a browser that refuses to write to the clipboard. A person can arrange this in the browser's site settings; the automated test makes the clipboard refuse
- Build: the build under test, opened with the link index.html?debug=1
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, the panel showing

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Copy CONFIG** | An amber message reads "Clipboard blocked — CONFIG printed to the console." |
| 2 | Look at the Console | It holds `const CONFIG = {` and the settings |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## DEV-08 The tuning panel's detection report

Under its fields the panel shows the last detection's timings (round trip, analyze, quads), how many lines and shapes it found, and each candidate's score, confidence and shape figures.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#debugInfo`, `"round trip "`
- Source: `js/app/debug-panel.js` (`updateDebugPanel`)
- Cases: 1

### DEV-08.1 The panel reports the last detection   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test, opened with the link index.html?debug=1
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, the panel showing

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Scroll to the report under the fields | Its first line reads "round trip N ms (analyze N ms, quads N ms)" |
| 2 | Read the second line | "N lines → N quads" |
| 3 | Read the lines after it | One per candidate (as many as Candidate offers), each "#n score … conf …% sup … min … asp … ang … area …% refined …" |

Pass: every row's result is seen.
On a fail, record: the row number, the report's text.

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
- Cases: 2

### DEV-09.1 The backtick key opens the panel, turns Debug overlay on and fills the report   [auto: desktop]
Before you start:
- Device and browser: a desktop browser, 1280 × 800 px, with a keyboard
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step, **Debug overlay** off

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Click the photo, then press the backtick key (`) | The **Detection tuning** panel opens; **Debug overlay** turns on; detection runs again |
| 2 | Read the panel's report | It starts "round trip " |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### DEV-09.2 Opening the panel leaves corners placed by hand alone   [auto: desktop]
Written to ruling R3; it fails until that is built (BUG-211).
Before you start:
- Device and browser: a desktop browser, 1280 × 800 px, with a keyboard
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step, **Debug overlay** off

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Drag the top-left corner handle 40 px down and right | The corner moves off the card |
| 2 | Click the photo, then press the backtick key (`) | The panel opens and **Debug overlay** turns on; the top-left corner stays where it was dragged |

Pass: every row's result is seen.
On a fail, record: the row number, where the corner went, a screenshot.

## DEV-10 The test hook

The page exposes a hook for automated tests, `window.__straightener`, with the app's state and these calls: open a file, run detection, render the full export, change step, commit, undo, redo, report a change, and the worker, detector, drawing, session, resume, share and export parts.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `window.__straightener`
- Source: `js/app/main.js` (`init`)
- Cases: 1

### DEV-10.1 The page offers the test hook with its state and calls   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with the developer tools open on the Console
- Build: the build under test
- Starting screen: the start screen

| # | Do this | You should see |
| --- | --- | --- |
| 1 | In the Console, read `window.__straightener` | An object holding `app` (the app's state) |
| 2 | Read its other names | Functions openFile, runDetect, renderFull, setTab, commit, undo, redo and stateChanged, and the parts EngineWorker, Detector, draw, Session, resumeSession, shareFile and Exporter |

Pass: every row's result is seen.
On a fail, record: the row number, the names missing.
