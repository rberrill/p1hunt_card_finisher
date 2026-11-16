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
- Cases: none yet

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
- Cases: none yet

## STO-03 The saved logo outlives a reload and Start fresh

The saved logo, with the position, size and opacity it was last used at, survives a reload and **Start fresh**; it is offered with **Use saved overlay**, not placed by itself.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnFresh`, `#btnUseSaved`, `"Use saved overlay"`
- Source: `js/app/overlay.js` (`saveToBrowser`, `loadSavedOverlay`, `overlayStateChanged`, `useSaved`), `js/app/adapters.js` (`Session.clear`)
- Cases: none yet

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
- Cases: none yet

## STO-05 Runs from a file, a local server or a subfolder

The app runs the same whether opened as a file on disk, from a local server or from a subfolder of a website: every asset path is relative, and the image engine runs in a background worker built inside the page, falling back to the page itself if the worker can't start.

- Risk: high
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `"worker-src blob:"`, `"Web Worker unavailable, running on main thread:"`
- Source: `index.html` (the script and style links), `js/app/adapters.js` (`EngineWorker.init`, `EngineWorker.fail`, `EngineWorker.local`)
- Cases: none yet

## STO-06 A new version is never served from the cache

Every script, style and icon link in the page carries the app's version, so a new version is loaded fresh, never served from the browser's cache.

- Risk: medium
- Check: source
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.appVersion`, `"Asset links carry ?v=<appVersion>"`
- Source: `index.html`, `js/config.js` (`CONFIG.appVersion`), `tests/selftest.js` (the cache-busting check)
- Cases: none yet

## STO-07 Page title, theme color and icons

The browser tab reads **P1Hunt Card Finisher**, the browser's own color is the app's dark gray, and the tab shows the app's icon (a favicon and an SVG icon).

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `"P1Hunt Card Finisher"`, `"icons/favicon.ico"`, `"icons/icon.svg"`
- Source: `index.html` (the head)
- Cases: none yet

## STO-08 The home-screen icon

Added to the iPhone's home screen, the app shows its own 180 px icon.

- Risk: low
- Check: phone
- Layout: phone. Only iOS uses the home-screen icon.
- Added: 1.10 baseline
- Changed: none
- Anchors: `"icons/apple-touch-icon.png"`
- Source: `index.html` (the head)
- Cases: none yet

## STO-09 The image engine really runs in its worker

In normal use the image engine (detection, sharpening, the self-tests) runs in its background worker, not on the page: the worker starts, answers, and the app has not fallen back to the page.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `"Web Worker unavailable, running on main thread:"`, `", worker unavailable"`
- Source: `js/app/adapters.js` (`EngineWorker.init`, `EngineWorker.call`, `EngineWorker.fail`), `js/app/main.js` (`runSelfTests`)
- Cases: none yet
