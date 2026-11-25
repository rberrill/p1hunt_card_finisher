# Untrusted input and the security policy

How the app treats what comes from outside it (links, files, storage), the page's security policy, and what the public code may not contain.

The edits files and logos these cases load are in `tests/fixtures/`. Each edits file was saved from the app and changed in a text editor; the case quotes the change.

## SEC-01 The page's security policy

The page carries a strict content security policy, before any style or script: nothing is allowed by default; scripts and styles come only from the app's own files; the image engine's worker comes from the page itself; images only from the app's files and the page's own photos; no base address and no form posting; and the page sends no referrer.

- Risk: high
- Check: source
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `"default-src 'none'"`, `"script-src 'self'"`, `"style-src 'self'"`, `"base-uri 'none'"`
- Source: `index.html` (the policy and referrer metas), `tests/selftest.js` (the security check)
- Cases: 2

### SEC-01.1 The self-test finds the strict policy before any style or script   [source]
Before you start:
- Device: a computer with Node installed
- Build: the build under test, as files in the repository folder
- Browser data: not used; the case runs in a terminal, not a browser
- Starting screen: a terminal open in the repository folder

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Run `node tests/selftest.js` | It prints its checks, one per line, and ends with a count of checks passed |
| 2 | Find the line that starts "Security: index.html has a strict CSP" | It reads "PASS  Security: index.html has a strict CSP and nothing inline or off-site", followed by the number of policy rules it found |

Pass: every row's result is seen.
On a fail, record: the row number and the whole line the self-test printed for the check.

### SEC-01.2 The browser applies the policy: a script or a picture from elsewhere is refused   [auto: phone]
Before you start:
- Device and browser: Chrome or Edge on a computer, in a phone-width window, 390 × 844 px, with the developer tools open on the Console
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Starting screen: the start screen

Each row types one line into the Console and presses Enter. The lines add a script and a picture to the page, as an attacker's text would try to; the page's security policy must refuse both.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Type `const s = document.createElement('script'); s.textContent = 'window.testInlineRan = true'; document.body.append(s)` | A red error in the Console names the policy rule "script-src 'self'": the script was blocked |
| 2 | Type `window.testInlineRan` | The Console answers undefined: the script did not run |
| 3 | Type `const p = document.createElement('img'); p.src = 'https://example.com/picture.png'; document.body.append(p)` | A red error in the Console names the policy rule "img-src 'self' blob: data:": the picture was blocked |

Pass: every row's result is seen.
On a fail, record: the row number, what the Console printed, a screenshot.

## SEC-02 Nothing leaves the device

Once the page's own files have loaded, opening, editing and exporting a photo make no network request: the photo never leaves the device.

- Risk: high
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `"connect-src 'self'"`, `"Everything stays on this device."`
- Source: `index.html` (the policy meta)
- Cases: 1

### SEC-02.1 Opening, editing and exporting a photo sends nothing over the network   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with the browser's developer tools open on the Network tab
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the start screen, with the page fully loaded; then clear the Network tab's list

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the start screen | It reads "Open, drop, or paste a photo." and "Everything stays on this device." |
| 2 | Tap **Open photo** and choose the photo | The photo opens on the Perspective step, with the corner outline on the card's edges |
| 3 | Tap **Rotate** in the step tabs (the six tabs Perspective to Export, along the bottom) | The Rotate step shows, with **90° right** |
| 4 | Tap **90° right** | The photo turns a quarter right |
| 5 | Tap **Export** in the step tabs | The Export step shows, with **Download** |
| 6 | Tap **Download** | The question box (the box over the dimmed photo with a question and three buttons) asks "Upscale to 2000 px?" |
| 7 | Tap **No** | IMG_9136-straight.jpg is saved |
| 8 | Look at the Network tab | No request went over the network since the list was cleared: every address listed, if any, starts with blob: or data:, which stay on the device |

Pass: every row's result is seen.
On a fail, record: the row number, the address of any request in the Network tab, a screenshot.

## SEC-03 A link can set only number and on/off settings

A link can set only settings that already exist and are numbers or on/off. Text, lists and groups of settings can't be set from a link, and a name such as `__proto__` is refused.

- Risk: high
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.storageKey`, `CONFIG.crop.defaultPreset`, `"URL settings ignored (unknown, not a number / on-off setting, "`
- Source: `js/engine.js` (`applyConfigOverrides`), `js/app/core.js` (the link overrides at load)
- Cases: 1

### SEC-03.1 A link can't set text or reach past the settings   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with the browser's developer tools open on the Console
- Build: the build under test, opened with the link index.html?crop.defaultPreset=4:3&export.format=png&storageKey=elsewhere&__proto__.polluted=1&crop.presets.0.label=Hacked
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo opened with **Open photo**, on the Perspective step

The page leaves the app's table of settings open to the Console under the name CONFIG; row 5 reads one setting from it.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the Console | A warning reads "[card-finisher] URL settings ignored (unknown, not a number / on-off setting, or outside its safe range): crop.defaultPreset, export.format, storageKey, __proto__.polluted, crop.presets.0.label" |
| 2 | Tap **Crop** in the step tabs (the six tabs Perspective to Export, along the bottom) | **1:1** is the selected preset, and the first preset still reads **Free** |
| 3 | Tap **Export** in the step tabs | **JPEG** is the selected Format |
| 4 | In the Console, type `({}).polluted` and press Enter | The Console answers undefined: nothing was added to every object |
| 5 | In the Console, type `CONFIG.storageKey` and press Enter | The Console answers 'p1hunt.straightener.v1', the key as shipped |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## SEC-04 Size and memory limits can only be lowered from a link

The settings that size images, memory or loops each have a safe range. A link can lower a cap but never raise it, and a value outside the range is rejected.

- Risk: high
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.maxOutputArea`, `CONFIG.export.longEdge`, `CONFIG.overlay.maxBytes`, `CONFIG.detect.workingSize`
- Source: `js/config.js` (`CONFIG_LIMITS`), `js/engine.js` (`applyConfigOverrides`)
- Cases: 2

### SEC-04.1 A link can't raise a size cap or go outside its range   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with the browser's developer tools open on the Console
- Build: the build under test, opened with the link index.html?export.longEdge=20000&maxOutputArea=50000000&overlay.maxBytes=10000000&export.editsMaxBytes=100 (the first three above their caps, the last below its range)
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo opened with **Open photo**, on the Perspective step

The page leaves the app's table of settings open to the Console under the name CONFIG; row 3 reads three settings from it.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the Console | A warning reads "[card-finisher] URL settings ignored (unknown, not a number / on-off setting, or outside its safe range): export.longEdge, maxOutputArea, overlay.maxBytes, export.editsMaxBytes" |
| 2 | Tap **Export** in the step tabs (the six tabs Perspective to Export, along the bottom) | **2000** is the selected Size, the shipped default |
| 3 | In the Console, type `[CONFIG.maxOutputArea, CONFIG.overlay.maxBytes, CONFIG.export.editsMaxBytes]` and press Enter | The Console answers [16777216, 5242880, 8388608]: the caps as shipped |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### SEC-04.2 A link can lower a size cap   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test, opened with the link index.html?maxOutputArea=1000000 (a 1 MP cap, under the 16.7 MP shipped)
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/ (its 1:1 crop is 1400 × 1400 px)
- Starting screen: the photo open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Original** under Size | The size line (the line that gives the saved picture's size in px and its format) starts "Output 1000 × 1000 px": the crop is held to 1 MP |

Pass: every row's result is seen.
On a fail, record: what the size line reads, a screenshot.

## SEC-05 A loaded edits file is checked field by field

When **Load edits** reads a file, every field is checked; a malformed field is reset to its default and never applied, and a warning names the fields that were reset.

- Risk: high
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: 1.10.0
- Anchors: `#btnLoadEdits`, `"Reset, not valid: "`
- Source: `js/app/export.js` (`loadEdits`), `js/app/state.js` (`cleanState`), `js/engine.js` (`sanitizeState`)
- Ruling: R12. One combined warning, up to three short lines (WORDING). Rich, 2026-11-18: the message stays the warning's usual 5 seconds, however many lines it has. Rich, 2026-11-18: on a phone, choosing an edits file closes Export's options sheet, so the message has the whole photo area. The app does this since 1.10.0. R48. They apply to every load: "Edits loaded." plus each line that applies. A load with no problem shows "Edits loaded." alone, as a white information message (Rich, 2026-11-17). The app does this since 1.10.0.
- Cases: 1

### SEC-05.1 A malformed field is reset and named, the rest is applied   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Edits file: IMG_9136-levels-as-words-edits.json from tests/fixtures/: this photo's edits after **90° right** (IMG_9136-turned-edits.json), changed in a text editor so that `"levels": null` reads `"levels": "bright please"`, a value the app can't use for its levels
- Starting screen: the photo open, upright, on the Export step

The named actions:
- Open Export options: tap the options tab (the small tab with an up arrow on the top edge of the controls, the block of buttons under the photo).
- Load the edits file F: open Export options, tap **Load edits**, then choose F in the file picker.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Load the edits file IMG_9136-levels-as-words-edits.json | One amber message shows; its lines read "Edits loaded." and "Reset, not valid: levels.", in that order |
| 2 | Look at the photo | It is turned a quarter right: the file's other edits were applied |
| 3 | Tap **Levels** in the step tabs (the six tabs Perspective to Export, along the bottom) | **Clear** and **Apply** are greyed out (shown dim and not answering a tap), and there is no dot on the **Levels** tab: no levels are set |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## SEC-06 A bad edits file is refused before anything changes

An edits file over 8 MB, one that isn't valid JSON, or one that isn't a Card Finisher edits file (wrong shape or version) is refused with a message, before anything is applied.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.export.editsMaxBytes`, `"That file is too large to be a Card Finisher edits file."`, `"That file isn’t valid JSON."`, `"That isn’t a Card Finisher edits file."`
- Source: `js/app/export.js` (`loadEdits`, `looksLikeEdits`)
- Cases: 1

### SEC-06.1 A file too large, not JSON or not an edits file is refused, and nothing changes   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Files:
  - IMG_9136-large-edits.json, made from IMG_9136-turned-edits.json in tests/fixtures/ (this photo's edits after **90° right**): in a text editor, add spaces after its last closing brace until the file is larger than 8 MB (8,388,608 bytes). It is too large to keep with the fixtures; the script makes its own copy the same way
  - notes.json from tests/fixtures/: one line of plain text, "These are notes, not edits."
  - IMG_9136-version-3-edits.json from tests/fixtures/: IMG_9136-turned-edits.json with `"version": 2` changed to `"version": 3`, a version the app doesn't know
- Starting screen: the photo open and turned a quarter right (on Rotate, **90° right**), on the Export step

The named actions:
- Open Export options: tap the options tab (the small tab with an up arrow on the top edge of the controls, the block of buttons under the photo).
- Load the edits file F: open Export options, tap **Load edits**, then choose F in the file picker.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Load the edits file IMG_9136-large-edits.json | A red message reads "That file is too large to be a Card Finisher edits file."; the photo is still turned a quarter right |
| 2 | Load the edits file notes.json | A red message reads "That file isn’t valid JSON."; the photo is still turned a quarter right |
| 3 | Load the edits file IMG_9136-version-3-edits.json | A red message reads "That isn’t a Card Finisher edits file."; the photo is still turned a quarter right |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## SEC-07 A logo inside an edits file is checked

A logo carried inside an edits file must be a PNG, WebP, JPEG or SVG, and at most 5 MB once decoded; otherwise it is left out with a warning.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: 1.10.0
- Anchors: `CONFIG.overlay.maxBytes`, `"Logo left out; it couldn’t be read."`
- Source: `js/app/overlay.js` (`overlayFromEdits`, `register`), `js/app/export.js` (`loadEdits`)
- Ruling: R12. One combined warning, up to three short lines (WORDING). Rich, 2026-11-18: the message stays the warning's usual 5 seconds, however many lines it has. Rich, 2026-11-18: on a phone, choosing an edits file closes Export's options sheet, so the message has the whole photo area. The app does this since 1.10.0. R48. They apply to every load: "Edits loaded." plus each line that applies. A load with no problem shows "Edits loaded." alone, as a white information message (Rich, 2026-11-17). The app does this since 1.10.0. R59. Messages say "logo"; R12's line becomes "Logo left out; it couldn’t be read." Button names are not touched. The app does this since 1.10.0.
- Cases: 1

### SEC-07.1 An edits file's logo of the wrong type or over 5 MB is left out   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Files:
  - IMG_9136-gif-logo-edits.json from tests/fixtures/: this photo's edits after **90° right**, changed in a text editor: `"overlay": null` reads `"overlay": { "id": "gif-logo", "aspect": 1, "cx": 0.5, "cy": 0.5, "w": 0.25, "opacity": 1 }`, and after it is added `"overlayImage": { "id": "gif-logo", "type": "image/gif", "name": "logo.gif", "data": "R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" }` (a one-pixel GIF, a type a logo can't be)
  - IMG_9136-big-logo-edits.json, made from IMG_9136-gif-logo-edits.json in a text editor: `"type": "image/gif"` changed to `"type": "image/png"`, and the text in quotes after `"data": ` replaced by the base64 text of any file between 5.2 MB and 5.9 MB (made with `base64 -w 0 FILE` on Linux, or `base64 -i FILE` on a Mac). The whole file stays under 8 MB. It is too large to keep with the fixtures; the script makes its own copy, with 5.5 MB of zero bytes as the logo
- Starting screen: the photo open, upright, on the Export step, with no logo

The named actions:
- Open Export options: tap the options tab (the small tab with an up arrow on the top edge of the controls, the block of buttons under the photo).
- Load the edits file F: open Export options, tap **Load edits**, then choose F in the file picker.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Load the edits file IMG_9136-gif-logo-edits.json | One amber message shows; its lines read "Edits loaded." and "Logo left out; it couldn’t be read.", in that order |
| 2 | Look at the photo | It is turned a quarter right, with no logo on it |
| 3 | Load the edits file IMG_9136-big-logo-edits.json | The same amber message shows, its lines reading "Edits loaded." and "Logo left out; it couldn’t be read.", in that order |
| 4 | Look at the photo | It is still turned a quarter right, with no logo on it |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## SEC-08 A stored session is checked on Resume

On **Resume**, the stored session is checked like an edits file: its edits are cleaned, its step must be a real step, the stored photo's size must match the photo (when it doesn't, the photo opens with fresh edits and an amber warning), and a malformed pair is dropped with a warning while the open side resumes on its own.

- Risk: high
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: 1.10.0
- Anchors: `#btnResume`, `"The saved pair wasn’t valid, so it was reset. "`, `"[card-finisher] pair not restored:"`
- Source: `js/app/state.js` (`openFile`, `restoreLevelsDraft`), `js/app/start-screen.js` (`resumeSession`), `js/app/pair.js` (`restorePair`, `isPairRecord`, `finishResume`)
- Ruling: R23. A Resume whose stored size doesn't match opens the photo fresh with an amber warning, in the wording Rich approved: "Full edit history could not be restored, your photo has been opened fresh." Its case is STA-08.1. The app does this since 1.10.0.
- Cases: 1

### SEC-08.1 Resume cleans a damaged field and an unknown step   [auto: phone, webkit]
Script only
Stand-in: no control changes the edits the app has saved on the device, so the script rewrites two of their values, as a damaged saved record would hold them. This case is run by the script alone.

Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Browser data: none for this site at the start (a private window, or the site's data cleared). The app keeps the open photo and its edits on the device, so the reload offers to resume them
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open on the Rotate step, turned a quarter right with **90° right**, then two seconds' wait, so the turn is saved

A stored size that doesn't match the photo is STA-08.1; a damaged stored pair is PAIR-42.1.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | The script changes the crop saved with the edits to the words "square please" | The saved edits hold that crop |
| 2 | The script changes the step saved with the edits to "settings", a step the app doesn't have | The saved edits hold the step "settings" |
| 3 | Reload the page | The start screen offers **Resume** |
| 4 | Tap **Resume** | The photo opens on the Perspective step, still turned a quarter right |
| 5 | Tap **Crop** in the step tabs (the six tabs Perspective to Export, along the bottom) | **1:1** is the selected preset: the damaged crop was reset |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## SEC-09 Remembered preferences are checked before use

Remembered preferences are checked like an edits file before they are used; an unknown or malformed value falls back to the default.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.storageKey`, `CONFIG.cornerShots.output`, `CONFIG.pair.output`
- Source: `js/app/state.js` (`newState`, `cleanState`), `js/app/corner-shots.js` (`storedOutput`), `js/app/pair.js` (`storedPairOutput`)
- Cases: 2

### SEC-09.1 Malformed remembered preferences fall back to the defaults   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with the browser's developer tools open on the Console
- Build: the build under test
- Browser data: the remembered preferences only, which row 1 writes (start from a private window, or with the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the start screen

Row 1 writes preferences the app doesn't know into the browser's storage, under the key the app keeps them in: crop preset "<b>4:3</b>", format "gif", quality 7, size "big", interpolation "nearest", fill "red" and corner shots "many".

| # | Do this | You should see |
| --- | --- | --- |
| 1 | In the Console, type `localStorage.setItem('p1hunt.straightener.v1', '{"cropPreset":"<b>4:3</b>","export":{"format":"gif","quality":7,"longEdge":"big","interp":"nearest","fill":"red"},"cornerShots":"many"}')` and press Enter | The Console answers undefined |
| 2 | Reload the page | The start screen shows, with **Open photo** |
| 3 | Tap **Open photo** and choose the photo | The photo opens on the Perspective step |
| 4 | Tap **Crop** in the step tabs (the six tabs Perspective to Export, along the bottom) | **1:1** is the selected preset |
| 5 | Tap **Export** in the step tabs | **2000** is the selected Size and **JPEG** the selected Format |
| 6 | Tap **Corner shots** | The Corner shots sheet opens with **1 sheet** selected |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### SEC-09.2 Remembered preferences that aren't JSON are ignored   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with the browser's developer tools open on the Console
- Build: the build under test
- Browser data: the remembered preferences only, which row 1 writes (start from a private window, or with the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the start screen

| # | Do this | You should see |
| --- | --- | --- |
| 1 | In the Console, type `localStorage.setItem('p1hunt.straightener.v1', '{"cropPreset": "4:3", export:')` and press Enter | The Console answers undefined: text that can't be read is stored as the preferences |
| 2 | Reload the page | The start screen shows, and the Console holds no error |
| 3 | Tap **Open photo** and choose the photo | The photo opens on the Perspective step, and the Console still holds no error |
| 4 | Tap **Crop** in the step tabs (the six tabs Perspective to Export, along the bottom) | **1:1** is the selected preset, not 4:3 |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## SEC-10 What a logo file may be

A logo file must be a PNG, WebP, JPEG or SVG of at most 5 MB, and an SVG must state its size (a width and height, or a viewBox). It is only ever drawn as a picture, never run as part of the page.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: 1.10.0
- Anchors: `"That file type isn’t supported. Use PNG, WebP, JPG or SVG."`, `"That SVG has no width, height or viewBox, so it can’t be sized. "`, `" MB. The logo limit is "`, `CONFIG.overlay.maxBytes`
- Source: `js/app/overlay.js` (`imageTypeOf`, `addOverlayFile`, `overlayHint`, `logoLimitText`, `decodeSvg`, `svgSize`, `register`)
- Ruling: R83. The hint gives the logo size limit in force, which a link can lower. Rich, 2026-11-18: a limit under 1 MB reads in KB ("up to 64 KB."), and one of 1 MB or more in MB with at most one decimal ("5 MB", "1.5 MB"), in the hint and in the too-big refusal alike. The app does this since 1.10.0. R59. Messages say "logo" where they said "overlay"; button names are not touched. The app does this since 1.10.0.
- Cases: 3

### SEC-10.1 An SVG with no size is refused   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Logo: unsized.svg from tests/fixtures/: a text file that reads `<svg xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#000"/></svg>`, with no width, height or viewBox on the `<svg>`
- Starting screen: the photo open, on the Overlay step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Add logo** and choose unsized.svg | The line above the controls (the one line of text at the top of the block of buttons under the photo) reads "That SVG has no width, height or viewBox, so it can’t be sized. Re-export it with a size." in red |
| 2 | Look at the photo | No logo is on it |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### SEC-10.2 An SVG logo's script never runs   [auto: phone, webkit]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with the browser's developer tools open on the Console
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Logo: svg-with-script.svg from tests/fixtures/: a 200 × 100 red rectangle whose `<svg>` carries `onload="window.parent.testSvgRan = 1"` and holds `<script>window.parent.testSvgRan = 2;</script>`
- Starting screen: the photo open, on the Overlay step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Add logo** and choose svg-with-script.svg | A red rectangle is placed on the photo |
| 2 | Wait a second, then type `window.testSvgRan` in the Console and press Enter | The Console answers undefined: neither the script nor the onload handler ran |

Pass: every row's result is seen.
On a fail, record: the row number, what the Console printed, a screenshot.

### SEC-10.3 With a lower limit from a link, the hint and the refusal name it   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test, opened with the link index.html?overlay.maxBytes=65536 (a 64 KB logo limit)
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Logo: noisy-logo.png from tests/fixtures/: a PNG of 165 × 165 px of random colors, 81,928 bytes (80 KB), over the 64 KB limit
- Starting screen: the photo open, on the Overlay step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Read the line above the controls (the one line of text at the top of the block of buttons under the photo) | It reads "Add a logo or watermark: PNG, WebP, JPG or SVG, up to 64 KB.": the limit the link set, not 5 MB |
| 2 | Tap **Add logo** and choose noisy-logo.png | The line reads "That file is 0.1 MB. The logo limit is 64 KB." in red |
| 3 | Look at the photo | No logo is on it |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## SEC-11 File names are shown as plain text, cut short

Names from photos and edits files are shown only as plain text, never as markup, and cut to 60 characters where they appear (the Resume card, the edits-file warning). A name kept for a reopened file is cut to 200 characters. In the edits-file warning a line break or a direction mark in the name shows as a space, so a name can't add a line to the message or turn its words round.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: 1.10.0
- Anchors: `#resumeName`, `"”; sizes match."`, `.toast-line`
- Source: `js/app/core.js` (`shortText`), `js/app/start-screen.js` (`resumeName`, `resumeSession`), `js/app/export.js` (`loadEdits`, `shownEditsName`), `js/app/parts/toast.js` (`setToastLines`), `js/app/pair.js` (`restorePair`)
- Ruling: R12. One combined warning, up to three short lines (WORDING). Rich, 2026-11-18: the message stays the warning's usual 5 seconds, however many lines it has. Rich, 2026-11-18: on a phone, choosing an edits file closes Export's options sheet, so the message has the whole photo area. The app does this since 1.10.0. R48. They apply to every load: "Edits loaded." plus each line that applies. A load with no problem shows "Edits loaded." alone, as a white information message (Rich, 2026-11-17). The app does this since 1.10.0.
- Cases: 3

### SEC-11.1 A photo's name with markup shows as text on the Resume card, cut to 60   [auto: phone, webkit]
Before you start:
- Device and browser: a Mac or a Linux computer (Windows doesn't allow `<`, `>` or `"` in a file name), a phone-width window, 390 × 844 px, with the browser's developer tools open on the Console
- Build: the build under test
- Browser data: none for this site at the start (a private window, or the site's data cleared). The app keeps the open photo and its edits on the device, so the reload offers to resume them
- Photo: a copy of IMG_9136.JPEG from samples/, renamed `<b>bold</b> <img src=x onerror="window.testRan=1"> ` followed by 240 letters x and .JPEG (a name of 296 characters). It can't be kept with the fixtures, since a Windows computer can't hold that name; the script hands the photo to the picker under this name
- Starting screen: the start screen

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Open photo** and choose the renamed copy | The photo opens on the Perspective step |
| 2 | Tap **Rotate** in the step tabs (the six tabs Perspective to Export, along the bottom) | The Rotate step shows, with **90° right** |
| 3 | Tap **90° right**, then wait two seconds | The photo turns a quarter right |
| 4 | Reload the page | The Resume card (the box on the start screen with **Resume**) reads "Resume <b>bold</b> <img src=x onerror="window.testRan=1"> xxxxxxxx…?": the name's first 59 characters as typed, tags and all, then "…"; the whole name is in the same bold type, and no picture shows |
| 5 | Tap **Resume** | The photo opens turned a quarter right |
| 6 | In the Console, type `window.testRan` and press Enter | The Console answers undefined: nothing the name holds has run |
| 7 | Tap **Export** in the step tabs | The Export step shows |
| 8 | Tap the options tab (the small tab with an up arrow on the top edge of the controls, the block of buttons under the photo) | Export options rise; the source line at their foot ends with the name's first 199 characters and "…": the name kept for the reopened file is cut to 200 characters |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### SEC-11.2 An edits file's name with markup shows as text in the warning, cut to 60   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with the browser's developer tools open on the Console
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Edits file: IMG_9136-markup-name-edits.json from tests/fixtures/: this photo's edits after **90° right** (IMG_9136-turned-edits.json), changed in a text editor so that `"name": "IMG_9136.JPEG"` under `"source"` reads `"name": "<b>bold</b> <img src=x onerror=\"window.testRan=1\"> ` followed by 80 letters y and `.JPEG"`
- Starting screen: the photo open, upright, on the Export step

The named actions:
- Open Export options: tap the options tab (the small tab with an up arrow on the top edge of the controls, the block of buttons under the photo).
- Load the edits file F: open Export options, tap **Load edits**, then choose F in the file picker.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Load the edits file IMG_9136-markup-name-edits.json | One amber message shows; its lines read "Edits loaded." and "Saved for “<b>bold</b> <img src=x onerror="window.testRan=1"> yyyyyyyy…”; sizes match.": the name's first 59 characters as typed, tags and all, then "…"; nothing in it is bold, and no picture shows |
| 2 | In the Console, type `window.testRan` and press Enter | The Console answers undefined: nothing the name holds has run |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### SEC-11.3 A line break or a direction mark in an edits file's name can't forge a line of the warning   [auto: phone, webkit]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Edits file: IMG_9136-forged-line-name-edits.json from tests/fixtures/: this photo's edits after **90° right** (IMG_9136-turned-edits.json), changed in a text editor so that `"name": "IMG_9136.JPEG"` under `"source"` reads `"name": "card\nLogo left out; it couldn’t be read.\u202e"`, typed as shown: in such a file `\n` stands for a line break, and `\u202e` for a mark that makes the text after it run from right to left
- Starting screen: the photo open, upright, on the Export step

The named actions:
- Open Export options: tap the options tab (the small tab with an up arrow on the top edge of the controls, the block of buttons under the photo).
- Load the edits file F: open Export options, tap **Load edits**, then choose F in the file picker.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Load the edits file IMG_9136-forged-line-name-edits.json | One amber message shows, with two lines and no more: "Edits loaded." and "Saved for “card Logo left out; it couldn’t be read. ”; sizes match."; the whole name is on the second line, and no line starts "Logo left out" |
| 2 | Read the end of the second line | It ends "read. ”; sizes match.", reading left to right: a space stands where the name's direction mark was |
| 3 | Look at the photo | It is turned a quarter right: the file's edits were applied |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## SEC-12 No HTML is built from text

The app never builds HTML from text anywhere: no markup strings, no `eval`, no code in strings. The self-test scans the code for it.

- Risk: high
- Check: source
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `"Security: no HTML-string sinks or eval in js/ (build DOM with CF.makeEl)"`
- Source: `tests/selftest.js` (the security check), `js/app/core.js` (`makeEl`)
- Cases: 1

### SEC-12.1 The self-test finds no HTML built from text   [source]
Before you start:
- Device: a computer with Node installed
- Build: the build under test, as files in the repository folder
- Browser data: not used; the case runs in a terminal, not a browser
- Starting screen: a terminal open in the repository folder

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Run `node tests/selftest.js` | It prints its checks, one per line, and ends with a count of checks passed |
| 2 | Find the line that starts "Security: no HTML-string sinks" | It reads "PASS  Security: no HTML-string sinks or eval in js/ (build DOM with CF.makeEl)", followed by the number of files found clean |

Pass: every row's result is seen.
On a fail, record: the row number and the whole line the self-test printed for the check, with any file it names.

## SEC-13 Nothing private in the public files

The published files hold no private network address or local drive path, and the sample photos carry no GPS location. The self-test checks both.

- Risk: medium
- Check: source
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `"Privacy: sample photos carry no GPS location"`, `"Privacy: no private network addresses or local paths in published files"`
- Source: `tests/selftest.js` (`hasGps`, the privacy check)
- Cases: 1

### SEC-13.1 The self-test finds nothing private in the public files   [source]
Before you start:
- Device: a computer with Node installed
- Build: the build under test, as files in the repository folder
- Browser data: not used; the case runs in a terminal, not a browser
- Starting screen: a terminal open in the repository folder

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Run `node tests/selftest.js` | It prints its checks, one per line, and ends with a count of checks passed |
| 2 | Find the line that starts "Privacy: sample photos" | It reads "PASS  Privacy: sample photos carry no GPS location", followed by the number of photos checked |
| 3 | Find the line that starts "Privacy: no private network addresses" | It reads "PASS  Privacy: no private network addresses or local paths in published files", followed by the number of files found clean |

Pass: every row's result is seen.
On a fail, record: the row number and the whole line the self-test printed, with any file it names.

## SEC-14 No console error in normal use

Opening a photo, working through every step and exporting it puts no error in the browser's console (and the security policy blocks nothing).

- Risk: high
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: none
- Source: every module; `js/app/main.js` (`init`)
- Cases: 1

### SEC-14.1 A whole edit and export puts no error in the console   [auto: phone, webkit]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with the browser's developer tools open on the Console
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/; logo: icons/icon.svg from the repository
- Starting screen: the photo open, on the Perspective step

The named actions (the step tabs are the six tabs Perspective to Export, along the bottom):
- Turn the photo: tap **Rotate** in the step tabs, then **90° right**.
- Crop to 4:3: tap **Crop** in the step tabs, then the **4:3** preset.
- Apply Auto levels: tap **Levels** in the step tabs, then **Auto**, then **Apply**.
- Add the logo: tap **Overlay** in the step tabs, then **Add logo**, and choose icon.svg in the file picker.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Turn the photo | The photo turns a quarter right |
| 2 | Crop to 4:3 | **4:3** is the selected preset |
| 3 | Apply Auto levels | The photo's colors change, and there is no dot on the **Levels** tab: the levels are applied |
| 4 | Add the logo | The app's icon is placed on the photo |
| 5 | Tap **Export** in the step tabs | The Export step shows, with **Download** |
| 6 | Tap **Download** | The question box (the box over the dimmed photo with a question and three buttons) asks "Upscale to 2000 px?" |
| 7 | Tap **No** | IMG_9136-straight.jpg is saved |
| 8 | Look at the Console | It holds no error, and no message that the security policy refused something |

Pass: every row's result is seen.
On a fail, record: the row number, the Console's error, a screenshot.

## SEC-15 A logo from storage is checked before use

A logo read back from the device's storage (the saved logo, this photo's logo, or a pair's other side's logo) is checked like a logo file: it must be a known image type with its bytes intact, or it is skipped.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnUseSaved`, `CONFIG.session.dbName`
- Source: `js/app/overlay.js` (`register`, `setSaved`, `ensureOverlayImage`, `restoreOverlayRecord`)
- Cases: 2

### SEC-15.1 A stored logo of an unknown type is not offered   [auto: phone]
Script only
Stand-in: no control changes the saved logo the app keeps on the device, so the script changes its stored type, as a damaged saved record would hold it. This case is run by the script alone.

Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Browser data: none for this site at the start (a private window, or the site's data cleared); adding icon.svg in the starting screen saved it in this browser as the saved logo, and the open photo is kept for Resume
- Photo: IMG_9136.JPEG from samples/; logo: icons/icon.svg from the repository
- Starting screen: the photo open on the Overlay step, icon.svg added with **Add logo**

| # | Do this | You should see |
| --- | --- | --- |
| 1 | The script changes the type stored with the saved logo to text/html | The saved logo's record holds the type text/html |
| 2 | Reload the page | The start screen offers **Resume** |
| 3 | Tap **Start fresh** | The start screen, with no Resume card |
| 4 | Tap **Open photo** and choose the photo | The photo opens on the Perspective step |
| 5 | Tap **Overlay** in the step tabs (the six tabs Perspective to Export, along the bottom) | **Add logo** shows; **Use saved overlay** does not: the stored logo was skipped |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### SEC-15.2 A stored logo whose bytes are damaged is refused when used   [auto: phone]
Script only
Stand-in: no control changes the saved logo the app keeps on the device, so the script replaces its stored bytes with a line of text, as a damaged saved record would hold. This case is run by the script alone.

Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Browser data: none for this site at the start (a private window, or the site's data cleared); adding apple-touch-icon.png in the starting screen saved it in this browser as the saved logo, and the open photo is kept for Resume
- Photo: IMG_9136.JPEG from samples/; logo: icons/apple-touch-icon.png from the repository
- Starting screen: the photo open on the Overlay step, apple-touch-icon.png added with **Add logo**

| # | Do this | You should see |
| --- | --- | --- |
| 1 | The script replaces the saved logo's stored bytes with the text "Not a picture any more.", its type left as PNG | The saved logo's record holds those 23 bytes |
| 2 | Reload the page | The start screen offers **Resume** |
| 3 | Tap **Start fresh** | The start screen, with no Resume card |
| 4 | Tap **Open photo** and choose the photo | The photo opens on the Perspective step |
| 5 | Tap **Overlay** in the step tabs (the six tabs Perspective to Export, along the bottom) | **Use saved overlay** shows |
| 6 | Tap **Use saved overlay** | The line above the controls (the one line of text at the top of the block of buttons under the photo) reads "Couldn’t read that image. Try another PNG, WebP, JPG or SVG file." in red |
| 7 | Look at the photo | No logo is on it |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.
