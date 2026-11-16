# What is remembered

What the app keeps on the device between visits, what it forgets, and how the page itself loads and identifies itself.

## STO-01 Preferences are remembered

The app remembers your crop preset, the export settings (Format, Quality, Size, Interpolation, Fill outside photo), the Corner shots output and a pair's Together or Separately, and opens the next photo with them. They are saved in the browser's local storage after every change to the edits; if saving fails (private browsing, storage full) the app carries on without a message.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.storageKey`, `CONFIG.crop.defaultPreset`, `CONFIG.export.longEdge`, `CONFIG.export.format`
- Source: `js/app/adapters.js` (`Prefs.load`, `Prefs.save`), `js/app/state.js` (`stateChanged`, `exportDefaults`, `cropDefaults`)
- Ruling: R4. **Reset crop** goes back to the remembered preset and leaves the remembered preset unchanged. The app differs today. R5. Undoing an export setting also rewrites the remembered setting. The app already does this.
- Cases: 3

That the next photo starts from the settings used last, after a reload too, is STA-19.2; a pair's Together or Separately is PAIR-25.1.

### STO-01.1 Undoing a Format change also changes the remembered Format   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, in a private window so that nothing is remembered on this device
- Build: the build under test
- Photos: IMG_9136.JPEG and IMG_9075.JPEG from samples/
- Starting screen: IMG_9136.JPEG open, on the Export step

Written to ruling R5, which keeps what the app does today.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **PNG** under Format | **PNG** is selected |
| 2 | Tap **Undo** (the arrow curving left, at the top right) | **JPEG** is selected again |
| 3 | Tap **Open** (the folder at the top left) and choose IMG_9075.JPEG, then tap **Export** in the step bar | IMG_9075.JPEG opens with **JPEG** selected: the Undo changed the remembered Format too |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### STO-01.2 Reset crop leaves the remembered preset for after a reload   [auto: phone, webkit]
Written to ruling R4; it fails until that is built (BUG-100).
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, in a private window so that nothing is remembered on this device
- Build: the build under test
- Photos: IMG_9136.JPEG and IMG_9075.JPEG from samples/
- Starting screen: IMG_9136.JPEG open, on the Crop step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **4:5** in the row of sizes | **4:5** is selected |
| 2 | Open **Crop options** (the tab with an up arrow on the top edge of the controls) and tap **Reset crop** | The crop box goes back to its starting place |
| 3 | Wait two seconds, reload the page and tap **Start fresh** | The start screen, with no Resume card |
| 4 | Tap **Open photo**, choose IMG_9075.JPEG, then tap **Crop** in the step bar | **4:5** is selected: the remembered preset is the one chosen before Reset crop |

Pass: every row's result is seen.
On a fail, record: the row number, the preset that is selected, a screenshot.

### STO-01.3 When preferences can't be saved, the app carries on without a message   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, whose browser refuses to store anything (as private browsing on some browsers or a full disk does). A person can arrange this with a full disk; the automated test makes every write to the browser's storage fail
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **PNG** under Format | **PNG** is selected, and no message shows over the photo |
| 2 | Tap **Download** and answer **No** to "Upscale to 2000 px?" | IMG_9136-straight.png is saved, and no error shows (in the console either) |

Pass: every row's result is seen.
On a fail, record: the row number, any message shown, a screenshot.

## STO-02 The session is kept on the device

The open photo and its edits are kept in the browser's database on this device: the photo, its edits, a pair and its other photo, the saved logo, and this photo's logo. This is what **Resume** brings back.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.session.dbName`, `CONFIG.session.saveDelayMs`, `#btnResume`
- Source: `js/app/adapters.js` (`Session.savePhoto`, `Session.flush`, `Session.snapshot`, `Session.put`), `js/app/pair.js` (`savePairSession`), `js/app/overlay.js` (`place`)
- Ruling: R22. **Remove** leaves this photo's logo in storage, so Undo after Resume can bring it back. The app already does this.
- Cases: 2

### STO-02.1 A pair with a logo keeps all six records on the device   [auto: phone, webkit]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with the browser's developer tools open on the storage panel (Application in Chrome, Storage in Safari)
- Build: the build under test
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/; logo: icons/icon.svg from the repository
- Starting screen: a pair: open the front, tap **Export**, tap **Add back** and choose the back

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Overlay**, then **Add logo**, and choose icon.svg; wait two seconds | The logo is placed on the back |
| 2 | Look at the database p1hunt-finisher, store session | It holds six records: photo, edits, photoOverlay, overlay, pair and pairPhoto |
| 3 | Look at the edits record | It names 14_back_portrait_raw_white.JPEG, and its edits hold the logo |

Pass: every row's result is seen.
On a fail, record: the row number, the records listed, a screenshot.

### STO-02.2 Remove leaves this photo's logo stored   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with the browser's developer tools open on the storage panel
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/; logo: icons/icon.svg from the repository
- Starting screen: the photo open, on the Overlay step

Written to ruling R22, which keeps what the app does today: Undo after a Resume can bring the logo back (STA-10.2).

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Add logo** and choose icon.svg | The logo is placed |
| 2 | Tap **Remove**; wait two seconds | The logo is gone from the photo, and the stored edits hold no logo |
| 3 | Look at the database p1hunt-finisher, store session | The photoOverlay record is still there, holding icon.svg |

Pass: every row's result is seen.
On a fail, record: the row number, the records listed, a screenshot.

## STO-03 The saved logo outlives a reload and Start fresh

The saved logo, with the position, size and opacity it was last used at, survives a reload and **Start fresh**; it is offered with **Use saved overlay**, not placed by itself.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnFresh`, `#btnUseSaved`, `"Use saved overlay"`
- Source: `js/app/overlay.js` (`saveToBrowser`, `loadSavedOverlay`, `overlayStateChanged`, `useSaved`), `js/app/adapters.js` (`Session.clear`)
- Cases: 1

That Start fresh keeps the saved logo is also STA-13.2; where Use saved overlay places it, OVL-04.1.

### STO-03.1 The saved logo comes back after Start fresh, at the size it was last used   [auto: phone, webkit]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photos: IMG_9136.JPEG and IMG_9075.JPEG from samples/; logo: icons/icon.svg from the repository
- Starting screen: IMG_9136.JPEG open, on the Overlay step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Add logo** and choose icon.svg | The logo is placed, a quarter of the crop's width |
| 2 | Tap **Larger** (+) once; wait two seconds | The logo grows a little (1.05 times) |
| 3 | Reload the page and tap **Start fresh** | The start screen, with no Resume card |
| 4 | Tap **Open photo**, choose IMG_9075.JPEG, then tap **Overlay** in the step bar | No logo is on the photo; **Use saved overlay** is offered |
| 5 | Tap **Use saved overlay** | The logo is placed at 1.05 times a quarter of the crop's width: the size it was last used at |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## STO-04 What a reload forgets

A reload forgets Snap, Grid, **Debug overlay**, the chosen mode on Perspective and Rotate, the zoom, the undo history and any answer to the Upscale question.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#debugOverlay`, `#rotateGrid`, `#btnUndo`
- Source: `js/app/core.js` (`app`), `js/app/state.js` (`History`), `js/app/adapters.js` (`Session.snapshot`)
- Flag: to confirm. Snap, Grid, **Debug overlay** and the Perspective and Rotate modes carry over to a new photo opened in the same visit, but not across a reload.
- Cases: 2

That Snap and Flatten go back to their start after a reload is STA-18.9, and that they stay as set for a new photo, STA-18.8.

### STO-04.1 A reload forgets Grid, Debug overlay, the modes, the zoom and the undo history   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Open **Perspective options** (the tab with an up arrow on the top edge of the controls), turn **Debug overlay** on and close the options | Detection's lines are drawn over the photo |
| 2 | Tap **Flatten** | **Flatten** is chosen (white) and its line shows |
| 3 | Tap **Rotate** in the step bar, then **90° right** | The photo turns a quarter right; **Undo** is lit |
| 4 | Open **Rotate options**, turn **Grid** off and close the options | The grid goes |
| 5 | Tap **Flip**, then pinch outwards on the photo | **Flip** is chosen; the photo is zoomed in |
| 6 | Wait two seconds, reload the page and tap **Resume** | The photo opens on Rotate, turned a quarter right, fitted to the screen; **Undo** is greyed out; the Straighten ruler shows, not Flip |
| 7 | Open **Rotate options** | **Grid** is on |
| 8 | Tap **Perspective** in the step bar and open **Perspective options** | **Debug overlay** is off, and **Nudge** is chosen, not **Flatten** |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### STO-04.2 Grid and Debug overlay carry over to a new photo in the same visit   [auto: phone]
Flag: to confirm. Written to what the app does today: these settings last for the visit, not for one photo.
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photos: IMG_9136.JPEG and IMG_9075.JPEG from samples/
- Starting screen: IMG_9136.JPEG open, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Open **Perspective options**, turn **Debug overlay** on and close the options | Detection's lines are drawn over the photo |
| 2 | Tap **Rotate** in the step bar, open **Rotate options**, turn **Grid** off and close the options | The grid goes |
| 3 | Tap **Open** (the folder at the top left) and choose IMG_9075.JPEG | IMG_9075.JPEG opens with **Debug overlay** still on and **Grid** still off |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## STO-05 Runs from a file, a local server or a subfolder

The app runs the same whether opened as a file on disk, from a local server or from a subfolder of a website: every asset path is relative, and the image engine runs in a background worker built inside the page, falling back to the page itself if the worker can't start.

- Risk: high
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `"worker-src blob:"`, `"Web Worker unavailable, running on main thread:"`
- Source: `index.html` (the script and style links), `js/app/adapters.js` (`EngineWorker.init`, `EngineWorker.fail`, `EngineWorker.local`)
- Cases: 3

### STO-05.1 The app works from a website's subfolder   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with the browser's developer tools open on the Network tab
- Build: the build under test, served from a subfolder: http://127.0.0.1:8770/p1hunt_card_finisher/index.html when the test server runs (it serves the folder there as GitHub Pages does), or the live site
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the start screen

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the Network tab | Every file the page asked for came from the subfolder, and none failed |
| 2 | Tap **Open photo** and choose the photo | It opens with its corners found |
| 3 | Tap **Export**, then **Download**, and answer **No** to "Upscale to 2000 px?" | IMG_9136-straight.jpg is saved |

Pass: every row's result is seen.
On a fail, record: the row number, any failed address, a screenshot.

### STO-05.2 The app works opened from disk   [auto: disk]
Before you start:
- Device and browser: a desktop browser, with the developer tools open on the Console and Network tabs
- Build: the build under test, opened by double-clicking index.html in the repository folder (an address that starts file://)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the start screen

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Click **Open photo** and choose the photo | It opens with its corners found |
| 2 | Click **Export**, then **Download**, and answer **No** to "Upscale to 2000 px?" | IMG_9136-straight.jpg is saved |
| 3 | Look at the Console and the Network tab | No error and no warning that the worker is unavailable; nothing was asked of a server |

Pass: every row's result is seen.
On a fail, record: the row number, the Console's text, a screenshot.

### STO-05.3 Without a worker the engine runs on the page   [auto: phone, webkit]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with the browser's developer tools open on the Console, in a browser that can't start a background worker. A person can't arrange this by hand; the automated test makes starting a worker fail with "Stand-in: workers are blocked"
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the start screen

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the Console | One warning reads "[card-finisher] Web Worker unavailable, running on main thread: Stand-in: workers are blocked" |
| 2 | Tap **Open photo** and choose the photo | It opens with its corners found |
| 3 | Tap **Export**, then **Download**, and answer **Yes** to "Upscale to 2000 px?" | IMG_9136-straight.jpg is saved at 2000 × 2000 px: the sharpening ran on the page too |

Pass: every row's result is seen.
On a fail, record: the row number, the Console's text, a screenshot.

## STO-06 A new version is never served from the cache

Every script, style and icon link in the page carries the app's version, so a new version is loaded fresh, never served from the browser's cache.

- Risk: medium
- Check: source
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.appVersion`, `"Asset links carry ?v=<appVersion>"`
- Source: `index.html`, `js/config.js` (`CONFIG.appVersion`), `tests/selftest.js` (the cache-busting check)
- Cases: 1

### STO-06.1 The self-test finds every asset link carrying the version   [source]
Before you start:
- Device: a computer with Node installed
- Build: the build under test, as files in the repository folder
- Starting screen: a terminal open in the repository folder

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Run `node tests/selftest.js` | It prints its checks, one per line, and ends with a count of checks passed |
| 2 | Find the line that starts "Asset links carry" | It reads "PASS  Asset links carry ?v=<appVersion>", followed by the number of links and the version, which is the version in js/config.js |
| 3 | Find the line that starts "Every linked asset file exists" | It reads "PASS  Every linked asset file exists", followed by the same number of files |

Pass: every row's result is seen.
On a fail, record: the row number and the whole line the self-test printed, with any link it names.

## STO-07 Page title, theme color and icons

The browser tab reads **P1Hunt Card Finisher**, the browser's own color is the app's dark gray, and the tab shows the app's icon (a favicon and an SVG icon).

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `"P1Hunt Card Finisher"`, `"icons/favicon.ico"`, `"icons/icon.svg"`
- Source: `index.html` (the head)
- Cases: 1

### STO-07.1 The tab reads P1Hunt Card Finisher and shows the app's icons   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with the browser's developer tools open
- Build: the build under test
- Starting screen: the start screen

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the browser's tab | It reads **P1Hunt Card Finisher**; in the page's head the theme color is #161618 |
| 2 | Open icons/favicon.ico and icons/icon.svg from the page's head in a new tab | Each shows the app's icon |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## STO-08 The home-screen icon

Added to the iPhone's home screen, the app shows its own 180 px icon.

- Risk: low
- Check: phone
- Layout: phone. Only iOS uses the home-screen icon.
- Added: 1.10 baseline
- Changed: none
- Anchors: `"icons/apple-touch-icon.png"`
- Source: `index.html` (the head)
- Cases: 2

### STO-08.1 The home-screen icon on an iPhone   [phone]
Before you start:
- Device and browser: an iPhone, Safari
- Build: the live site, https://rberrill.github.io/p1hunt_card_finisher/
- Starting screen: the start screen; the app not yet on the home screen

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap Safari's share button, then **Add to Home Screen** | The sheet that opens shows the app's icon beside its name |
| 2 | Tap **Add** | The home screen shows the app's icon, sharp, not a screenshot of the page |

Pass: every row's result is seen.
On a fail, record: the row number, a screenshot of the home screen.

### STO-08.2 The home-screen icon is a 180 px PNG   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with the browser's developer tools open
- Build: the build under test
- Starting screen: the start screen

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Open the page's home-screen icon (icons/apple-touch-icon.png, named in its head) in a new tab | A PNG picture of 180 × 180 px |

Pass: every row's result is seen.
On a fail, record: the picture's type and size.

## STO-09 The image engine really runs in its worker

In normal use the image engine (detection, sharpening, the self-tests) runs in its background worker, not on the page: the worker starts, answers, and the app has not fallen back to the page.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `"Web Worker unavailable, running on main thread:"`, `", worker unavailable"`
- Source: `js/app/adapters.js` (`EngineWorker.init`, `EngineWorker.call`, `EngineWorker.fail`), `js/app/main.js` (`runSelfTests`)
- Cases: 1

### STO-09.1 Detection and sharpening run in the worker   [auto: phone, webkit]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with the browser's developer tools open on the Console. The automated test notes each call the page hands its worker
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the start screen

That the self-tests run in the worker is DEV-05.1.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Open photo** and choose the photo | It opens with its corners found; the worker was handed the detection |
| 2 | Tap **Export**, then **Download**, and answer **Yes** to "Upscale to 2000 px?" | The file is saved; the worker was handed the sharpening |
| 3 | Look at the Console | No warning that the worker is unavailable |

Pass: every row's result is seen.
On a fail, record: the row number, the Console's text, a screenshot.
