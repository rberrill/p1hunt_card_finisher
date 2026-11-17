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
Written to ruling R5, which keeps what the app does today.

Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Browser data: none for this site at the start (a private window, or the site's data cleared); row 1 makes PNG the remembered Format, and row 2 makes it JPEG again
- Photos: IMG_9136.JPEG and IMG_9075.JPEG from samples/
- Starting screen: IMG_9136.JPEG open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **PNG** under Format | **PNG** is selected |
| 2 | Tap **Undo** (the arrow curving left, at the top right) | **JPEG** is selected again |
| 3 | Tap **Open** (the folder at the top left; on a phone it has no label) and choose IMG_9075.JPEG | IMG_9075.JPEG opens on the Perspective step |
| 4 | Tap **Export** in the step tabs (the six tabs Perspective to Export, along the bottom) | **JPEG** is selected: the Undo changed the remembered Format too |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### STO-01.2 Reset crop leaves the remembered preset for after a reload   [auto: phone, webkit]
Written to ruling R4; it fails until that is built (BUG-100).

Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Browser data: none for this site at the start (a private window, or the site's data cleared), so no preset is remembered; row 1 makes **4:5** the remembered preset. The app also keeps the open photo and its edits on the device, so the reload offers to resume them
- Photos: IMG_9136.JPEG and IMG_9075.JPEG from samples/
- Starting screen: IMG_9136.JPEG open, on the Crop step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **4:5** in the row of presets | **4:5** is selected |
| 2 | Tap the options tab (the small tab with an up arrow on the top edge of the controls, the block of buttons under the photo) | Crop options rise, with **Reset crop** |
| 3 | Tap **Reset crop** | **4:5** is still selected: the crop went back to the remembered preset |
| 4 | Wait two seconds, then reload the page | The start screen offers **Resume** |
| 5 | Tap **Start fresh** | The start screen, with no Resume card |
| 6 | Tap **Open photo** and choose IMG_9075.JPEG | IMG_9075.JPEG opens on the Perspective step |
| 7 | Tap **Crop** in the step tabs (the six tabs Perspective to Export, along the bottom) | **4:5** is selected: the remembered preset is still the one chosen before Reset crop |

Pass: every row's result is seen.
On a fail, record: the row number, the preset that is selected, a screenshot.

### STO-01.3 When preferences can't be saved, the app carries on without a message   [auto: phone]
Script only
Stand-in: a person can't make a browser refuse to store the preferences on demand, so the script makes every write to the browser's local storage fail, as a full disk would.

Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with the browser's developer tools open on the Console
- Build: the build under test
- Browser data: none for this site, and none can be stored in local storage (the script makes every write fail)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **PNG** under Format | **PNG** is selected, and no message shows over the photo |
| 2 | Tap **Download** | The question box (the box over the dimmed photo with a question and two buttons) asks "Upscale to 2000 px?" |
| 3 | Tap **No** | IMG_9136-straight.png is saved |
| 4 | Look at the Console | It holds no error |

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
- Ruling: R22. **Remove** leaves this photo's logo in storage, so Undo after Resume can bring it back. The app already does this. R31. A failed open (a file the app can't read) changes nothing: the photo that is open keeps being saved. The app differs today (BUG-001; its case is STA-22.3).
- Cases: 2

### STO-02.1 A pair with a logo keeps all six records on the device   [auto: phone, webkit]
Before you start:
- Device and browser: Chrome, in a phone-width window, 390 × 844 px, with the developer tools open on Application, at IndexedDB, database p1hunt-finisher, store session
- Build: the build under test
- Browser data: none for this site at the start (a private window, or the site's data cleared). The case is about what the app keeps on the device: the pair's photos and edits, and the logo added in row 2
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/; logo: icons/icon.svg from the repository
- Starting screen: a pair: the front opened with **Open photo**, then **Export** in the step tabs, **Add back** and the back chosen; the back is open

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Overlay** in the step tabs (the six tabs Perspective to Export, along the bottom) | The Overlay step shows, with **Add logo** |
| 2 | Tap **Add logo** and choose icon.svg | The logo is placed on the back |
| 3 | Wait two seconds, then refresh the store session in the developer tools | It holds six records: edits, overlay, pair, pairPhoto, photo and photoOverlay |
| 4 | Click the edits record | Its name is 14_back_portrait_raw_white.JPEG, and the overlay in its state is not null: it holds the logo |

Pass: every row's result is seen.
On a fail, record: the row number, the records listed, a screenshot.

### STO-02.2 Remove leaves this photo's logo stored   [auto: phone]
Written to ruling R22, which keeps what the app does today: Undo after a Resume can bring the logo back (STA-10.2).

Before you start:
- Device and browser: Chrome, in a phone-width window, 390 × 844 px, with the developer tools open on Application, at IndexedDB, database p1hunt-finisher, store session
- Build: the build under test
- Browser data: none for this site at the start (a private window, or the site's data cleared). The case is about what the app keeps on the device: the photo, its edits, and the logo added in row 1
- Photo: IMG_9136.JPEG from samples/; logo: icons/icon.svg from the repository
- Starting screen: the photo open, on the Overlay step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Add logo** and choose icon.svg | The logo is placed |
| 2 | Tap **Remove** | The logo is gone from the photo |
| 3 | Wait two seconds, refresh the store session in the developer tools and click the edits record | The overlay in its state is null: the edits hold no logo |
| 4 | Click the photoOverlay record | It is still there, named icon.svg |

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
- Browser data: none for this site at the start (a private window, or the site's data cleared); adding the logo in row 1 saves it in this browser as the saved logo, and the change in row 2 is saved with it. The app also keeps the open photo and its edits on the device, so the reload offers to resume them
- Photos: IMG_9136.JPEG and IMG_9075.JPEG from samples/; logo: icons/icon.svg from the repository
- Starting screen: IMG_9136.JPEG open, on the Overlay step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Add logo** and choose icon.svg | The logo is placed, a quarter of the crop's width |
| 2 | Tap **Larger** (the + in the size pad) once, then wait two seconds | The logo grows a little, to 1.05 times its width |
| 3 | Reload the page | The start screen offers **Resume** |
| 4 | Tap **Start fresh** | The start screen, with no Resume card |
| 5 | Tap **Open photo** and choose IMG_9075.JPEG | IMG_9075.JPEG opens on the Perspective step |
| 6 | Tap **Overlay** in the step tabs (the six tabs Perspective to Export, along the bottom) | No logo is on the photo; **Use saved overlay** is offered |
| 7 | Tap **Use saved overlay** | The logo is placed at 1.05 times a quarter of the crop's width: the size it was last used at |

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
- Ruling: R89. Snap, Grid, **Debug overlay** and the Perspective and Rotate modes carry over to a new photo, but not over a reload. The app already does this.
- Cases: 4

That Snap and Flatten go back to their start after a reload is STA-18.9, and that they stay as set for a new photo, STA-18.8.

### STO-04.1 A reload forgets Debug overlay and Grid   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Browser data: none for this site at the start (a private window, or the site's data cleared). The app keeps the open photo and its edits on the device, so the reload offers to resume them; the case checks that Debug overlay and Grid are not kept with them
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step

The named actions (the options tab is the small tab with an up arrow on the top edge of the controls, the block of buttons under the photo):
- Turn Debug overlay on: tap the options tab, tap **Debug overlay**, then tap the **×** at the top right of the options.
- Turn Grid off: tap the options tab, tap **Grid**, then tap the **×** at the top right of the options.
- Reload and resume: wait two seconds, reload the page, then tap **Resume**.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Turn Debug overlay on | Detection's lines are drawn over the photo |
| 2 | Tap **Rotate** in the step tabs (the six tabs Perspective to Export, along the bottom) | The Rotate step shows, with the grid over the photo |
| 3 | Turn Grid off | The grid goes |
| 4 | Reload and resume | The photo opens on the Rotate step, with the grid over it again |
| 5 | Tap the options tab | Rotate options rise, with **Grid** on |
| 6 | Tap the **×** at the top right of the options | The options close |
| 7 | Tap **Perspective** in the step tabs | The Perspective step shows, with no detection lines over the photo |
| 8 | Tap the options tab | Perspective options rise, with **Debug overlay** off |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### STO-04.2 Grid and Debug overlay carry over to a new photo in the same visit   [auto: phone]

Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: IMG_9136.JPEG and IMG_9075.JPEG from samples/
- Starting screen: IMG_9136.JPEG open, on the Perspective step

The named actions (the options tab is the small tab with an up arrow on the top edge of the controls, the block of buttons under the photo):
- Turn Debug overlay on: tap the options tab, tap **Debug overlay**, then tap the **×** at the top right of the options.
- Turn Grid off: tap the options tab, tap **Grid**, then tap the **×** at the top right of the options.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Turn Debug overlay on | Detection's lines are drawn over the photo |
| 2 | Tap **Rotate** in the step tabs (the six tabs Perspective to Export, along the bottom) | The Rotate step shows, with the grid over the photo |
| 3 | Turn Grid off | The grid goes |
| 4 | Tap **Open** (the folder at the top left; on a phone it has no label) and choose IMG_9075.JPEG | IMG_9075.JPEG opens on the Perspective step, with detection's lines drawn over it |
| 5 | Tap **Rotate** in the step tabs | The Rotate step shows, with no grid over the photo: **Grid** is still off |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### STO-04.3 A reload forgets the chosen modes, the zoom and the undo history   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with touch
- Build: the build under test
- Browser data: none for this site at the start (a private window, or the site's data cleared). The app keeps the open photo and its edits on the device, so the reload offers to resume them; the case checks that the modes, the zoom and the undo history are not kept with them
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Perspective step

The named action:
- Reload and resume: wait two seconds, reload the page, then tap **Resume**.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Flatten** | **Flatten** is selected (a solid white button); the line above the controls (the one line of text at the top of the controls) reads FLATTEN and 100% |
| 2 | Tap **Rotate** in the step tabs (the six tabs Perspective to Export, along the bottom) | The Rotate step shows, with the Straighten ruler |
| 3 | Tap **90° right** | The photo turns a quarter right; **Undo** (the arrow curving left, at the top right) is no longer greyed out (shown dim and not answering a tap) |
| 4 | Tap **Flip** | **Flip** is selected (a solid white button) instead of **Straighten**; **Horizontal** and **Vertical** show in place of the ruler |
| 5 | Put two fingers on the middle of the photo, 60 px apart side by side, spread them to 180 px apart and lift them | The photo is zoomed in |
| 6 | Reload and resume | The photo opens on the Rotate step, turned a quarter right and fitted to the screen, not zoomed |
| 7 | Look at the controls | **Straighten** is selected, not **Flip**, and its ruler shows |
| 8 | Look at **Undo** | It is greyed out: the undo history was not kept |
| 9 | Tap **Perspective** in the step tabs | **Nudge** is selected, not **Flatten** |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### STO-04.4 A reload forgets the answer to the Upscale question   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Browser data: none for this site at the start (a private window, or the site's data cleared). The app keeps the open photo and its edits on the device, so the reload offers to resume them; the case checks that the answer to the Upscale question is not kept with them
- Photo: IMG_9136.JPEG from samples/ (its 1:1 crop is 1400 × 1400 px, under the 2000 px Size)
- Starting screen: the photo open, on the Export step, with **2000** the selected Size

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Download** | The question box (the box over the dimmed photo with a question and two buttons) asks "Upscale to 2000 px?" |
| 2 | Tap **Yes** | IMG_9136-straight.jpg is saved, 2000 × 2000 px |
| 3 | Wait two seconds, then reload the page | The start screen offers **Resume** |
| 4 | Tap **Resume** | The photo opens on the Export step |
| 5 | Tap **Download** | The question box asks "Upscale to 2000 px?" again: the Yes was not kept |
| 6 | Tap **No** | IMG_9136-straight.jpg is saved, 1400 × 1400 px |

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
- Build: the build under test, served from a subfolder: with the test server running (`node tests/automation/support/serve.js 8770` in the repository folder), http://127.0.0.1:8770/p1hunt_card_finisher/index.html, which serves the folder there as GitHub Pages does
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the start screen

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the Network tab | Every file the page asked for came from the subfolder (its address has /p1hunt_card_finisher/ in it), and none failed |
| 2 | Tap **Open photo** and choose the photo | The photo opens on the Perspective step, with the corner outline on the card's edges |
| 3 | Tap **Export** in the step tabs (the six tabs Perspective to Export, along the bottom) | The Export step shows, with **Download** |
| 4 | Tap **Download** | The question box (the box over the dimmed photo with a question and two buttons) asks "Upscale to 2000 px?" |
| 5 | Tap **No** | IMG_9136-straight.jpg is saved |

Pass: every row's result is seen.
On a fail, record: the row number, any failed address, a screenshot.

### STO-05.2 The app works opened from disk   [auto: disk]
Before you start:
- Device and browser: Chrome or Edge on a computer, with the developer tools open on the Console and Network tabs
- Build: the build under test, opened by double-clicking index.html in the repository folder (an address that starts file://)
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the start screen

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Click **Open photo** and choose the photo | The photo opens on the Perspective step, with the corner outline on the card's edges |
| 2 | Click **Export** in the step tabs (the six tabs Perspective to Export, in the top bar) | The Export step shows, with **Download** |
| 3 | Click **Download** | The question box (the box over the dimmed photo with a question and two buttons) asks "Upscale to 2000 px?" |
| 4 | Click **No** | IMG_9136-straight.jpg is saved |
| 5 | Look at the Console and the Network tab | No error and no warning that the worker is unavailable; nothing was asked of a server: every address starts with file:, blob: or data: |

Pass: every row's result is seen.
On a fail, record: the row number, the Console's text, a screenshot.

### STO-05.3 Without a worker the engine runs on the page   [auto: phone, webkit]
Script only
Stand-in: a person can't stop a browser from starting a background worker, so the script makes starting one fail with "Stand-in: workers are blocked", as a browser that refuses workers would.

Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with the browser's developer tools open on the Console
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the start screen

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the Console | One warning reads "[card-finisher] Web Worker unavailable, running on main thread: Stand-in: workers are blocked" |
| 2 | Tap **Open photo** and choose the photo | The photo opens on the Perspective step, with the corner outline on the card's edges |
| 3 | Tap **Export** in the step tabs (the six tabs Perspective to Export, along the bottom) | The Export step shows, with **Download** |
| 4 | Tap **Download** | The question box (the box over the dimmed photo with a question and two buttons) asks "Upscale to 2000 px?" |
| 5 | Tap **Yes** | IMG_9136-straight.jpg is saved at 2000 × 2000 px: the sharpening ran on the page too |

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
- Browser data: not used; the case runs in a terminal, not a browser
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
- Device and browser: a phone-width window, 390 × 844 px, with the browser's developer tools open on the Console
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Starting screen: the start screen

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the browser's tab | It reads **P1Hunt Card Finisher** |
| 2 | In the Console, type `document.querySelector('meta[name="theme-color"]').content` and press Enter | The Console answers '#161618', the app's dark gray |
| 3 | Open a new tab at the page's address with index.html replaced by icons/favicon.ico | The app's icon shows |
| 4 | Open a new tab at the page's address with index.html replaced by icons/icon.svg | The app's icon shows |

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
- Build: the test site, https://rberrill.github.io/p1hunt_card_finisher_uat/
- Browser data: none for this site (the site's data cleared in Settings › Safari), in an ordinary tab
- Starting screen: the start screen; the test site not yet on the home screen

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap Safari's Share button | The share sheet opens |
| 2 | Tap **Add to Home Screen** (scroll the sheet's list down to it) | The sheet that opens shows the app's icon beside its name |
| 3 | Tap **Add** | The home screen shows the app's icon, sharp, not a picture of the page |

Pass: every row's result is seen.
On a fail, record: the row number, a screenshot of the home screen.

### STO-08.2 The home-screen icon is a 180 px PNG   [auto: phone]
Before you start:
- Device and browser: Chrome or Edge on a computer, in a phone-width window, 390 × 844 px
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Starting screen: the start screen

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Open a new tab at the page's address with index.html replaced by icons/apple-touch-icon.png (the home-screen icon the page's head names) | The icon shows, and the tab's title reads "apple-touch-icon.png (180×180)": a PNG of 180 × 180 px |

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
Script only
Stand-in: nothing is replaced, but no person can see which work the page hands its background worker; the script notes each call the page hands it.

Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with the browser's developer tools open on the Console
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the start screen

That the self-tests run in the worker is DEV-05.1.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Open photo** and choose the photo | The photo opens with the corner outline on the card's edges; the worker was handed the detection |
| 2 | Tap **Export** in the step tabs (the six tabs Perspective to Export, along the bottom) | The Export step shows, with **Download** |
| 3 | Tap **Download** | The question box (the box over the dimmed photo with a question and two buttons) asks "Upscale to 2000 px?" |
| 4 | Tap **Yes** | IMG_9136-straight.jpg is saved; the worker was handed the sharpening |
| 5 | Look at the Console | No warning that the worker is unavailable |

Pass: every row's result is seen.
On a fail, record: the row number, the Console's text, a screenshot.
