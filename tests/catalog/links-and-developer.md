# Settings from a link, self-tests, the tuning panel

What a link can change, the self-tests a link can run, the detection tuning panel, and the hook automated tests use.

Several cases read a setting in the browser's Console. The page leaves the app's table of settings open to the Console under the name CONFIG: typing `CONFIG.historyLimit` and pressing Enter answers with that setting's value.

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
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Export** in the step tabs (the six tabs Perspective to Export, along the bottom) | **1080** is the selected Size, where the shipped default is 2000 |

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
Script only
Stand-in: **Share** shows only in a browser that can share files, and no case uses a desktop browser's own share feature, so the script gives the page a stand-in share feature that says it can share files.

Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with the developer tools open on the Console
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the start screen, opened with the link index.html?export.share=0

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Open photo** and choose the photo | The photo opens on the Perspective step |
| 2 | Tap **Export** in the step tabs (the six tabs Perspective to Export, along the bottom) | **Download** shows; **Share** does not |
| 3 | Open the link index.html?export.share=no | The Console warns "[card-finisher] URL settings ignored (unknown, not a number / on-off setting, or outside its safe range): export.share" |
| 4 | Tap **Open photo** and choose the photo | The photo opens on the Perspective step |
| 5 | Tap **Export** in the step tabs | **Share** shows beside **Download**: "no" did not turn it off |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### DEV-02.2 A link sets the undo history's length   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test, opened with the link index.html?historyLimit=2
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Rotate step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **90° right** three times | The photo has turned three quarters right: its top is at the left |
| 2 | Tap **Undo** (the arrow curving left, at the top right) | The photo is turned two quarters: upside down |
| 3 | Tap **Undo** again | The photo is turned one quarter right, and **Undo** is greyed out (shown dim and not answering a tap): only two steps were kept |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### DEV-02.3 An undo length outside 1 to 200 is ignored   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with the developer tools open on the Console
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Starting screen: none; the case opens two links

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Open the link index.html?historyLimit=0 | The Console warns "[card-finisher] URL settings ignored (unknown, not a number / on-off setting, or outside its safe range): historyLimit" |
| 2 | Open the link index.html?historyLimit=201 | The same warning again |
| 3 | In the Console, type `CONFIG.historyLimit` and press Enter | The Console answers 50, the shipped length |

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
- Browser data: none for this site (a private window, or the site's data cleared)
- Starting screen: the start screen

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the Console | One warning, in the warning color, reads "[card-finisher] URL settings ignored (unknown, not a number / on-off setting, or outside its safe range): nope, crop.presets, historyLimit" |
| 2 | Look at the screen | The start screen, with no message about the link |
| 3 | In the Console, type `CONFIG.detect.cannyHigh` and press Enter | The Console answers 90: the good setting in the same link was applied |

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
- Device and browser: a computer, a phone-width window, 390 × 844 px, with the developer tools open on the Console
- Build: the build under test, opened with the link index.html?debug (no value)
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/, in a file browser beside the window
- Starting screen: the start screen

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the screen | The **Detection tuning** panel is open |
| 2 | Drag IMG_9136.JPEG from the file browser onto the start screen, above the tuning panel, and let go | The photo opens, and the Console logs a line that starts "[card-finisher] detect" |
| 3 | Tap the options tab (the small tab with an up arrow on the top edge of the controls, the block of buttons under the photo) | Perspective options rise, with **Debug overlay** on |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### DEV-04.2 ?debug=0 and ?debug=false leave the developer view off   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with the developer tools open on the Console
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: none; the case opens two links

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Open the link index.html?debug=0 | The start screen, with no tuning panel |
| 2 | Tap **Open photo** and choose the photo | The photo opens; the Console has no line that starts "[card-finisher] detect" |
| 3 | Tap the options tab (the small tab with an up arrow on the top edge of the controls, the block of buttons under the photo) | Perspective options rise, with **Debug overlay** off |
| 4 | Open the link index.html?debug=false | The start screen, with no tuning panel |
| 5 | Tap **Open photo** and choose the photo | The photo opens; the Console has no line that starts "[card-finisher] detect" |
| 6 | Tap the options tab | Perspective options rise, with **Debug overlay** off |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## DEV-05 `?selftest` runs the engine self-tests

A link with `?selftest` runs the engine's self-tests on the page and in the background worker, prints both result tables in the console, and shows a message with both counts (**Self-tests: main …, worker …**), red if any failed. The results are also kept on the page for a script to read. A link with `?selftest=0` runs none.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: 1.10.0
- Anchors: `"Self-tests: main "`, `", worker unavailable"`, `"[card-finisher] self-tests (main thread)"`, `"[card-finisher] self-tests (Web Worker)"`
- Source: `js/app/main.js` (`runSelfTests`, `init`), `js/engine.js` (`selfTest`)
- Ruling: R28. `?selftest=0` means off: the self-tests do not run. The app does this since 1.10.0.
- Cases: 2

### DEV-05.1 ?selftest runs the self-tests on the page and in the worker   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with the developer tools open on the Console
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Starting screen: none

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Open the link index.html?selftest | A message over the screen reads "Self-tests: main N/N, worker N/N", the same N four times, not in red |
| 2 | Look at the Console | Two groups, "[card-finisher] self-tests (main thread)" and "[card-finisher] self-tests (Web Worker)", each with a table of results |

Pass: every row's result is seen.
On a fail, record: the row number, the message's text, the Console's tables.

### DEV-05.2 ?selftest=0 runs no self-tests   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with the developer tools open on the Console
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
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
- Layout: both. Phone: full width, just above the controls under the photo, at most 40% of the screen's height; on the start screen, at the bottom of the screen, at most 25% of its height, with the start screen's words and buttons above it. Wide: at the top right, left of the side panel; on the start screen, over the empty side panel.
- Added: 1.10 baseline
- Changed: 1.10.0
- Anchors: `#debugPanel`, `"Detection tuning"`, `CONFIG.detect.cannyLow`
- Source: `js/app/debug-panel.js` (`toggleDebugPanel`, `buildDebugPanel`), `css/app.css` (`#debugPanel`, and `.start-screen` while the panel shows on a phone)
- Ruling: R29. The tuning panel's fields may take values outside the safe ranges a link is held to; it is a tuning tool. The app already does this. R51. On the start screen the tuning panel never covers **Open photo** or the Resume box. The app does this since 1.10.0.
- Cases: 5

### DEV-06.1 The panel has a field per detection setting, and a change detects again   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with the developer tools open on the Console
- Build: the build under test, opened with the link index.html?debug=1
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, the **Detection tuning** panel showing

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Scroll through the panel's fields | One field for each number and on/off setting of detection, named as in js/config.js under `detect`, in the same order: workingSize first, refineInlierPx last |
| 2 | Select the value in **cannyHigh** and type 70 | The field reads 70 |
| 3 | In the Console, type `CONFIG.detect.cannyHigh` and press Enter | The Console answers 70: the setting took the field's value |
| 4 | Look at the Console's lines above | A new line that starts "[card-finisher] detect" shows after the typing: detection ran again |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### DEV-06.2 Where the panel sits   [auto: both, webkit]
Before you start:
- Device and browser: a computer, a phone-width window (390 × 844 px) or a wide one (1280 × 800 px)
- Build: the build under test, opened with the link index.html?debug=1
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/, in a file browser beside the window
- Starting screen: the start screen

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the screen | The panel shows, and no part of it is over **Open photo**. On a phone, it spans the window less 8 px each side, its bottom 8 px above the window's bottom edge, at most 25% of the window's height. On a wide screen, it is 64 px from the top and 8 px from the window's right edge, over the empty side panel |
| 2 | Drag IMG_9136.JPEG from the file browser onto the start screen, away from the tuning panel, and let go | The photo opens. On a phone, the panel spans the window less 8 px each side, its bottom 8 px above the controls, at most 40% of the window's height. On a wide screen, it is 64 px from the top and 8 px left of the 380 px side panel |

Pass: every row's result is seen.
On a fail, record: the row number, the panel's position, a screenshot.

### DEV-06.3 A field takes a value a link could not   [auto: phone]
Written to ruling R29, which keeps what the app does today: the panel is a tuning tool.

Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with the developer tools open on the Console
- Build: the build under test, opened with the link index.html?debug=1
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, the panel showing

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Select the value in **workingSize** and type 2500 | The field reads 2500 |
| 2 | In the Console, type `CONFIG.detect.workingSize` and press Enter | The Console answers 2500, over the 2000 a link is held to |

Pass: every row's result is seen.
On a fail, record: the row number, the value read, a screenshot.

### DEV-06.4 Detection runs once, 0.35 s after the last change   [auto: phone]
Script only
Stand-in: nothing is replaced, but no person can type two keys and look within 0.35 s, nor time a detection; the script types 70 into **cannyHigh** as two quick keystrokes and counts the detection runs at the moment the typing ends and a second later.

Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test, opened with the link index.html?debug=1
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, the panel showing, detection finished

| # | Do this | You should see |
| --- | --- | --- |
| 1 | The script selects the value in **cannyHigh** and types 70, two keystrokes in quick succession | The setting is 70 at once, and detection has not run again yet |
| 2 | Wait a second | Detection has run exactly once more |

Pass: every row's result is seen.
On a fail, record: the row number, the count of detection runs.

### DEV-06.5 On a phone, the panel leaves the Resume box clear   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Browser data: none for this site at the start (a private window, or the site's data cleared). The app keeps the open photo on the device, so opening the build again offers to resume it
- Photo: IMG_9136.JPEG from samples/
- Starting screen: IMG_9136.JPEG opened with **Open photo**, then two seconds' wait, so it is kept on the device

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Go to the build's address with `?debug=1` added to it (index.html?debug=1) | The start screen offers "Resume IMG_9136.JPEG?" with **Resume** and **Start fresh**, and the **Detection tuning** panel shows |
| 2 | Look at the Resume box (the box that holds **Resume** and **Start fresh**) and at **Open photo** under it | No part of the tuning panel is over the Resume box or **Open photo** |

Pass: every row's result is seen.
On a fail, record: the row number, the panel's position, a screenshot.

## DEV-07 The tuning panel's buttons

The panel has a close button (tooltip **Close tuning**), **Copy CONFIG**, which copies all the settings to the clipboard (or prints them in the console if the clipboard is blocked, and says "Clipboard blocked. CONFIG printed to the console."), and **Re-detect**, which runs detection again.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: 1.10.0
- Anchors: `#debugClose`, `#debugCopy`, `#debugRun`, `"Clipboard blocked. CONFIG printed to the console."`
- Source: `js/app/debug-panel.js` (`buildDebugPanel`)
- Ruling: R60. The blocked-clipboard message is two sentences: "Clipboard blocked. CONFIG printed to the console." The app does this since 1.10.0.
- Cases: 3

### DEV-07.1 Re-detect runs detection, and Close tuning closes the panel   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with the developer tools open on the Console
- Build: the build under test, opened with the link index.html?debug=1
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, the panel showing, detection finished

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Re-detect** | One new line that starts "[card-finisher] detect" shows in the Console: detection ran once more |
| 2 | Tap **Close tuning** (the × at the panel's top right) | The panel closes; detection's lines are still drawn over the photo: **Debug overlay** stays on |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### DEV-07.2 Copy CONFIG copies every setting   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, in a browser allowed to use the clipboard, and a text editor
- Build: the build under test, opened with the link index.html?debug=1
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, the panel showing

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Copy CONFIG** | A message reads "CONFIG copied." |
| 2 | Paste into the text editor | `const CONFIG = ` and every setting, as JSON spread over lines, ending `};` |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### DEV-07.3 With the clipboard blocked, CONFIG goes to the console   [auto: phone]
Script only
Stand-in: a person can't make the browser refuse the clipboard to the page on purpose, so the script makes every clipboard write fail, as a browser that blocks the page does.

Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with the developer tools open on the Console
- Build: the build under test, opened with the link index.html?debug=1
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, the panel showing

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Copy CONFIG** | An amber message reads "Clipboard blocked. CONFIG printed to the console." |
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
- Browser data: none for this site (a private window, or the site's data cleared)
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

Opening the tuning panel turns the **Debug overlay** on. If it was off and a photo is open, detection runs again, so the overlay has its lines to draw and the panel its report, and corners placed by hand stay where they are, with no undo step added.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: 1.10.0
- Anchors: `#debugPanel`, `#debugOverlay`, `CONFIG.keys.debug`
- Source: `js/app/debug-panel.js` (`toggleDebugPanel`); `js/app/state.js` (`detectForDebugOverlay`)
- Ruling: R3. Opening the panel, which turns the debug overlay on, leaves corners placed by hand where they are and adds no undo step. The app does this since 1.10.0.
- Cases: 2

### DEV-09.1 The backtick key opens the panel, turns Debug overlay on and fills the report   [auto: desktop]
Before you start:
- Device and browser: a desktop browser, 1280 × 800 px, with a keyboard
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step, **Debug overlay** off (Perspective's options are always shown under the controls at the right on a wide screen)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Press the backtick key (`) | The **Detection tuning** panel opens |
| 2 | Look at **Debug overlay** in Perspective's options | It is on, and detection's lines are drawn over the photo |
| 3 | Read the panel's report, under its fields | It starts "round trip ": detection ran again and filled it in |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### DEV-09.2 Opening the panel leaves corners placed by hand alone and adds no undo step   [auto: desktop]
Before you start:
- Device and browser: a desktop browser, 1280 × 800 px, with a keyboard and a mouse
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step, **Debug overlay** off

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Drag the top-left corner handle 40 px down and right | The corner moves off the card; **Undo** (the arrow curving left, at the top right) is no longer greyed out |
| 2 | Press the backtick key (`) | The panel opens, and **Debug overlay** turns on |
| 3 | Look at the top-left corner | It stays where it was dragged |
| 4 | Click **Undo** | The top-left corner is back on the card's corner, and **Undo** is greyed out: the drag was the only undo step |

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
- Browser data: none for this site (a private window, or the site's data cleared)
- Starting screen: the start screen

| # | Do this | You should see |
| --- | --- | --- |
| 1 | In the Console, type `typeof window.__straightener.app` and press Enter | The Console answers 'object': the hook holds the app's state |
| 2 | Type `Object.keys(window.__straightener)` and press Enter | The list holds openFile, runDetect, renderFull, setTab, commit, undo, redo and stateChanged, and EngineWorker, Detector, draw, Session, resumeSession, shareFile and Exporter |

Pass: every row's result is seen.
On a fail, record: the row number, the names missing.
