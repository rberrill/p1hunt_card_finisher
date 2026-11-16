# Untrusted input and the security policy

How the app treats what comes from outside it (links, files, storage), the page's security policy, and what the public code may not contain.

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
- Starting screen: a terminal open in the repository folder

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Run `node tests/selftest.js` | It prints its checks, one per line, and ends with a count of checks passed |
| 2 | Find the line that starts "Security: index.html has a strict CSP" | It reads "PASS  Security: index.html has a strict CSP and nothing inline or off-site", followed by the number of policy rules it found |

Pass: every row's result is seen.
On a fail, record: the row number and the whole line the self-test printed for the check.

### SEC-01.2 The browser applies the policy: a script or a picture from elsewhere is refused   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with the browser's developer tools open on the Console
- Build: the build under test
- Starting screen: the start screen

A person can't add a script to the page by hand without the developer tools; the automated test writes both into the page.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | In the Console, add a script element to the page whose text sets a mark on the page | The mark is not set: the script did not run |
| 2 | Add a picture to the page whose address is on another site (https://example.com/picture.png) | The browser reports both as refused by the page's security policy: the script under its script rule, the picture under its image rule |

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
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the start screen, with the page fully loaded; then clear the Network tab's list

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the start screen | It reads "Open, drop, or paste a photo." and "Everything stays on this device." |
| 2 | Tap **Open photo** and choose the photo | The photo opens on Perspective with its corners found |
| 3 | Tap **Rotate** in the step bar, then **90° right** | The photo turns a quarter right |
| 4 | Tap **Export**, then **Download**, and answer **No** to "Upscale to 2000 px?" | IMG_9136-straight.jpg is saved |
| 5 | Look at the Network tab | No request to any address over the network was made since step 1 |

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
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the start screen; then open the photo

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the Console | A warning reads "[card-finisher] URL settings ignored (unknown, not a number / on-off setting, or outside its safe range): crop.defaultPreset, export.format, storageKey, __proto__.polluted, crop.presets.0.label" |
| 2 | Tap **Crop** in the step bar | **1:1** is the selected preset, and the first preset still reads **Free** |
| 3 | Tap **Export** in the step bar | **JPEG** is the selected Format |
| 4 | In the Console, read a new empty object's `polluted` and the app's storage key (CONFIG.storageKey) | The first is undefined; the second is p1hunt.straightener.v1: nothing outside the settings changed |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## SEC-04 Size and memory limits can only be lowered from a link

The 44 settings that size images, memory or loops each have a safe range. A link can lower a cap but never raise it, and a value outside the range is rejected.

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
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the start screen; then open the photo

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the Console | A warning reads "[card-finisher] URL settings ignored (unknown, not a number / on-off setting, or outside its safe range): export.longEdge, maxOutputArea, overlay.maxBytes, export.editsMaxBytes" |
| 2 | Tap **Export** in the step bar | **2000** is the selected Size, the shipped default |
| 3 | In the Console, read CONFIG.maxOutputArea, CONFIG.overlay.maxBytes and CONFIG.export.editsMaxBytes | 16777216, 5242880 and 8388608: the caps as shipped |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### SEC-04.2 A link can lower a size cap   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test, opened with the link index.html?maxOutputArea=1000000 (a 1 MP cap, under the 16.7 MP shipped)
- Photo: IMG_9136.JPEG from samples/ (its 1:1 crop is 1400 × 1400 px)
- Starting screen: the photo open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Original** under Size | The size line reads 1000 × 1000 px: the crop is held to 1 MP |

Pass: every row's result is seen.
On a fail, record: what the size line reads, a screenshot.

## SEC-05 A loaded edits file is checked field by field

When **Load edits** reads a file, every field is checked; a malformed field is reset to its default and never applied, and a warning names the fields that were reset.

- Risk: high
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnLoadEdits`, `"Some settings in these edits weren’t valid and were reset: "`
- Source: `js/app/export.js` (`loadEdits`), `js/app/state.js` (`cleanState`), `js/engine.js` (`sanitizeState`)
- Cases: 1

### SEC-05.1 A malformed field is reset and named, the rest is applied   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, and a text editor
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Rotate step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **90° right** | The photo turns a quarter right |
| 2 | Tap **Export**, open **Export options** (the tab with an up arrow on the top edge of the controls), then tap **Save edits** | IMG_9136-edits.json is saved |
| 3 | In the text editor, change the file's `"levels": null` to `"levels": "bright please"` and save it | The file now holds a value the app can't use for its levels |
| 4 | Close the options, tap **Rotate** and tap **90° left** | The photo is upright again |
| 5 | Tap **Export**, open **Export options**, tap **Load edits** and choose the changed file | An amber warning reads "Some settings in these edits weren’t valid and were reset: levels." |
| 6 | Look at the photo, and tap **Levels** in the step bar | The photo is turned a quarter right again (the file's other edits were applied), and no levels are set |

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
- Device and browser: a phone-width window, 390 × 844 px, and a text editor
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open and turned a quarter right (**Rotate**, **90° right**), on the Export step with **Export options** open
- Three files, each named IMG_9136-edits.json: one of 8,388,609 spaces (1 byte over 8 MB); one that reads `{"version": 2, "corners": [`; one that reads `{"version": 9, "source": {"width": 1, "height": 1}, "corners": []}`

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Load edits** and choose the 8 MB file | A red message reads "That file is too large to be a Card Finisher edits file."; the photo is still turned a quarter right |
| 2 | Tap **Load edits** and choose the file that ends `[` | A red message reads "That file isn’t valid JSON."; the photo is unchanged |
| 3 | Tap **Load edits** and choose the version 9 file | A red message reads "That isn’t a Card Finisher edits file."; the photo is unchanged |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## SEC-07 A logo inside an edits file is checked

A logo carried inside an edits file must be a PNG, WebP, JPEG or SVG, and at most 5 MB once decoded; otherwise it is left out with a warning.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.overlay.maxBytes`, `"The overlay in these edits couldn’t be read, so it was left out."`
- Source: `js/app/overlay.js` (`overlayFromEdits`, `register`)
- Cases: 1

### SEC-07.1 An edits file's logo of the wrong type or over 5 MB is left out   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, and a text editor
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/; logo: icons/icon.svg from the repository
- Starting screen: the photo open, on the Overlay step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Add logo** and choose icon.svg | The logo is placed on the photo |
| 2 | Tap **Export**, open **Export options**, tap **Save edits** | IMG_9136-edits.json is saved, with the logo inside it |
| 3 | Close the options, tap **Overlay**, then **Remove** | The logo is gone from the photo |
| 4 | Copy the edits file twice. In the first copy change `"type": "image/svg+xml"` under `overlayImage` to `"type": "image/gif"`; in the second replace the text of `data` under `overlayImage` with 6,990,508 letters A (a picture of just over 5 MB) | Two changed files |
| 5 | Tap **Export**, open **Export options**, tap **Load edits** and choose the first copy | An amber warning reads "The overlay in these edits couldn’t be read, so it was left out."; no logo is on the photo |
| 6 | Tap **Load edits** and choose the second copy | The same amber warning; no logo is on the photo |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## SEC-08 A stored session is checked on Resume

On **Resume**, the stored session is checked like an edits file: its edits are cleaned, its step must be a real step, the stored photo's size must match the photo, and a malformed pair is dropped with a warning while the open side resumes on its own.

- Risk: high
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnResume`, `"The saved pair wasn’t valid, so it was reset. "`, `"[card-finisher] pair not restored:"`
- Source: `js/app/state.js` (`openFile`, `restoreLevelsDraft`), `js/app/start-screen.js` (`resumeSession`), `js/app/pair.js` (`restorePair`, `isPairRecord`, `finishResume`)
- Ruling: R23. A Resume whose stored size doesn't match opens the photo fresh with the amber warning "Couldn’t restore your edits, so the photo was opened fresh." The app differs today. New wording, to be approved by Rich.
- Cases: 1

### SEC-08.1 Resume cleans a damaged field and an unknown step   [auto: phone, webkit]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open on the Rotate step, turned a quarter right (**90° right**); wait two seconds
- The stored edits are damaged: their crop is a word and their step is "settings". A person can't arrange this by hand; the automated test changes the stored record

A stored size that doesn't match the photo is STA-08.1; a damaged stored pair is PAIR-42.1.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Reload the page | The start screen offers **Resume** |
| 2 | Tap **Resume** | The photo opens on the Perspective step (not an unknown one), still turned a quarter right |
| 3 | Tap **Crop** in the step bar | **1:1** is the selected preset: the damaged crop was reset |

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
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- The remembered preferences hold values the app doesn't know: crop preset "<b>4:3</b>", format "gif", quality 7, size "big", interpolation "nearest", fill "red", corner shots "many" and pair output "both". A person can't arrange this by hand; the automated test writes them into the browser's storage before the page opens
- Starting screen: the start screen

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Open photo** and choose the photo, then tap **Crop** in the step bar | **1:1** is the selected preset |
| 2 | Tap **Export** in the step bar | **2000** is the selected Size and **JPEG** the selected Format |
| 3 | Tap **Corner shots** | The Corner shots sheet opens with **1 sheet** selected |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### SEC-09.2 Remembered preferences that aren't JSON are ignored   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with the browser's developer tools open on the Console
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- The remembered preferences are text that can't be read: `{"cropPreset": "4:3", export:`. The automated test writes it into the browser's storage before the page opens
- Starting screen: the start screen

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Open photo**, choose the photo, then tap **Crop** in the step bar | **1:1** is the selected preset, and the Console shows no error |

Pass: every row's result is seen.
On a fail, record: what you saw instead, a screenshot.

## SEC-10 What a logo file may be

A logo file must be a PNG, WebP, JPEG or SVG of at most 5 MB, and an SVG must state its size (a width and height, or a viewBox). It is only ever drawn as a picture, never run as part of the page.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `"That file type isn’t supported. Use PNG, WebP, JPG or SVG."`, `"That SVG has no width, height or viewBox, so it can’t be sized. "`, `" MB. The overlay limit is "`, `CONFIG.overlay.maxBytes`
- Source: `js/app/overlay.js` (`imageTypeOf`, `addOverlayFile`, `decodeSvg`, `svgSize`, `register`)
- Flag: to confirm. The Overlay step's hint always says "up to 5 MB", though a link can lower the limit, and the refusal then names the lower one.
- Cases: 3

### SEC-10.1 An SVG with no size is refused   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/; logo: no-size.svg, a text file that reads `<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"/></svg>`
- Starting screen: the photo open, on the Overlay step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Add logo** and choose no-size.svg | The line above the controls reads "That SVG has no width, height or viewBox, so it can’t be sized. Re-export it with a size." in red; no logo is placed |

Pass: every row's result is seen.
On a fail, record: what you saw instead, a screenshot.

### SEC-10.2 An SVG logo's script never runs   [auto: phone, webkit]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with the browser's developer tools open on the Console
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/; logo: with-script.svg, a 200 × 100 red rectangle whose `<svg>` carries `onload="window.parent.testSvgRan = 1"` and holds `<script>window.parent.testSvgRan = 2;</script>`
- Starting screen: the photo open, on the Overlay step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Add logo** and choose with-script.svg | A red rectangle is placed on the photo |
| 2 | Wait a second, then read `testSvgRan` in the Console | It is undefined: neither the script nor the onload handler ran |

Pass: every row's result is seen.
On a fail, record: the row number, what the Console printed, a screenshot.

### SEC-10.3 With a lower limit from a link, the refusal names it   [auto: phone]
Flag: to confirm. Written to what the app does today: the hint keeps saying 5 MB, and the refusal names the lower limit in MB with four decimals.
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test, opened with the link index.html?overlay.maxBytes=65536 (a 64 KB logo limit)
- Photo: IMG_9136.JPEG from samples/; logo: big-logo.png, a file of 100,000 bytes
- Starting screen: the photo open, on the Overlay step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Read the hint above the controls | It says "up to 5 MB" |
| 2 | Tap **Add logo** and choose big-logo.png | The line reads "That file is 0.1 MB. The overlay limit is 0.0625 MB." |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## SEC-11 File names are shown as plain text, cut short

Names from photos and edits files are shown only as plain text, never as markup, and cut to 60 characters where they appear (the Resume card, the edits-file warning). A name kept for a reopened file is cut to 200 characters.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#resumeName`, `"Edits were saved for “"`
- Source: `js/app/core.js` (`shortText`), `js/app/start-screen.js` (`resumeName`, `resumeSession`), `js/app/export.js` (`loadEdits`), `js/app/pair.js` (`restorePair`)
- Cases: 2

### SEC-11.1 A photo's name with markup shows as text on the Resume card, cut to 60   [auto: phone, webkit]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: a copy of IMG_9136.JPEG from samples/ named `<b>bold</b> <img src=x onerror="window.testRan=1"> ` followed by 240 letters x and .JPEG (a name of 296 characters). A computer may not allow these characters in a file name; the automated test hands the file to the picker under this name
- Starting screen: the start screen

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Open photo** and choose the copy | The photo opens |
| 2 | Tap **Rotate**, then **90° right**; wait two seconds | The photo turns a quarter right |
| 3 | Reload the page | The Resume card reads the name's first 59 characters as typed, tags and all, then "…"; nothing in it is bold or a picture |
| 4 | Tap **Resume** | The photo opens turned a quarter right, and nothing the name holds has run |
| 5 | Tap **Export** in the step bar and open **Export options** | The source line at the foot of the options ends with the name's first 199 characters and "…": the name kept for the reopened file is cut to 200 characters |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### SEC-11.2 An edits file's name with markup shows as text in the warning, cut to 60   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, and a text editor
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Export step with **Export options** open

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Save edits** | IMG_9136-edits.json is saved |
| 2 | In the text editor, change the file's `"name"` under `source` to `<b>bold</b> <img src=x onerror="window.testRan=1"> ` followed by 80 letters y and .JPEG | The file names a photo with markup in its name |
| 3 | Tap **Load edits** and choose the changed file | An amber warning reads "Edits were saved for “", the name's first 59 characters as typed and "…", then "”. Applied anyway — sizes match."; nothing in it is bold or a picture |

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
- Photo: IMG_9136.JPEG from samples/; logo: icons/icon.svg from the repository
- Starting screen: the photo open, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Rotate** in the step bar, then **90° right** | The photo turns a quarter right |
| 2 | Tap **Crop**, then the **4:3** preset | The crop box is 4:3 |
| 3 | Tap **Levels**, then **Auto**, then **Apply** | The photo's colors change and stay |
| 4 | Tap **Overlay**, then **Add logo**, and choose icon.svg | The logo is placed |
| 5 | Tap **Export**, then **Download**, and answer **No** to "Upscale to 2000 px?" | IMG_9136-straight.jpg is saved |
| 6 | Look at the Console | It holds no error, and no message that the security policy refused something |

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
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/; logo: icons/icon.svg from the repository
- Starting screen: the photo open on the Overlay step, icon.svg added with **Add logo** (it becomes the saved logo)
- The saved logo's stored type is then changed to text/html. A person can't arrange this by hand; the automated test changes the stored record

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Reload the page and tap **Start fresh** | The start screen, with no Resume card |
| 2 | Tap **Open photo**, choose the photo, then tap **Overlay** in the step bar | **Add logo** shows; **Use saved overlay** does not: the stored logo was skipped |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### SEC-15.2 A stored logo whose bytes are damaged is refused when used   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/; logo: icons/apple-touch-icon.png from the repository
- Starting screen: the photo open on the Overlay step, apple-touch-icon.png added with **Add logo**
- The saved logo's stored bytes are then replaced with a line of text, its type left as PNG. A person can't arrange this by hand; the automated test changes the stored record

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Reload the page and tap **Start fresh** | The start screen, with no Resume card |
| 2 | Tap **Open photo**, choose the photo, then tap **Overlay** in the step bar | **Use saved overlay** shows |
| 3 | Tap **Use saved overlay** | The line above the controls reads "Couldn’t read that image. Try another PNG, WebP, JPG or SVG file." in red; no logo is placed |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.
