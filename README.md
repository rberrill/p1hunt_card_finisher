# P1Hunt Card Finisher

Straighten, crop and color-correct photos of trading cards, including cards in one-touches, toploaders and graded slabs, so they're ready for a listing or a post.

It's a single web page that runs entirely in your browser. **Your photos never leave your device**: no uploads, no accounts, no server, no analytics, and no third-party scripts. See [SECURITY.md](SECURITY.md) for what's stored on your device and how to report a problem.

**Use it here: [rberrill.github.io/p1hunt_card_finisher](https://rberrill.github.io/p1hunt_card_finisher/)**

## What it does

Six steps, in order:

1. **Perspective.** Finds the card's four corners automatically, even inside a case or slab, and corrects the camera angle.
   - **Flatten** slider: 100% gives a flat 5:7 card, as if scanned; 0% squares it up but keeps some depth.
   - Drag corners or edges, with a magnifier that stays clear of your finger.
   - Double-tap a handle to zoom in on it; on phones, arrow buttons nudge it a pixel at a time.
   - **Candidate n/3** tries the next-best detection when the first pick catches a stand or case edge.
   - Corners on the wrong card? **Tap to find card** (under More options), then tap the card: detection runs again around that spot.
2. **Rotate.** 90° turns, flips, and fine rotation in 0.1° steps.
3. **Crop.** Free, Original, 1:1, 4:3, 5:4, 3:2, 16:9 and 5:7 card. Presets follow the card's orientation (a portrait card gets 4:5, 2:3, 9:16…), and **Swap** flips them. **Fit to card** frames the card with a little padding.
4. **Levels.** Set a white point (and optionally a black point) by tapping the image, or start from **Auto**. Press and hold the photo to compare before and after. Changes stay a draft until you **Apply** them.
5. **Overlay.** Add your logo or watermark (PNG, WebP, JPG or SVG, up to 5 MB) on top of the photo. Drag it, resize it with a corner or a pinch, nudge it, tap a ring on the photo to snap it to a corner, the middle of a side, or the center, and set its opacity. Transparent logos keep their soft edges. Your last logo is remembered in the browser, so next time it's one tap: **Use saved overlay**.
6. **Export.** JPEG, PNG or WebP at 1080, 2000 or 3000 px on the long edge, or original size.
   - Where the browser supports it, **Share** opens the share sheet; on iPhone, Save Image puts the result straight into Photos.
   - **Download** saves the file. **Copy** puts it on the clipboard where supported (it's hidden otherwise).
   - Exports are rendered from the full-resolution original.
   - Once the photo is exported, **Next card →** opens the next photo, with the same crop and export settings.

Also:
- **Undo / redo** (50 steps).
- **Resume:** the last photo and its edits are kept on your device, so if the page reloads or the tab closes, you can pick up where you left off.
- **Save / load edits** as a small JSON file (with the overlay logo embedded). Reopening the same photo and loading its edits gives an identical export.
- **Phone-first layout,** which also works on desktop.

## Using it

- **Hosted:** [rberrill.github.io/p1hunt_card_finisher](https://rberrill.github.io/p1hunt_card_finisher/) (GitHub Pages). This is the recommended way on a phone: the Share button needs HTTPS, which Pages provides.
- **From disk:** download the repository (Code → Download ZIP), unzip it, and open `index.html` in a current browser (tested in Chrome on desktop and Safari on iPhone). It makes no network requests.
- **Local server:** from this folder, run the command below and open `http://localhost:8765/index.html`. The sample-photo tests need this.

  ```bash
  python -m http.server 8765
  ```

Load a photo with **Open**, drag and drop, or paste. JPEG, PNG and WebP work everywhere. HEIC opens in Safari only; in other browsers, save the photo as JPEG first.

### Keyboard shortcuts

| Key | Action |
|---|---|
| Ctrl/Cmd+Z | Undo |
| Shift+Ctrl/Cmd+Z or Ctrl/Cmd+Y | Redo |
| 1 – 6 | Go to a step |
| F | Fit the photo to the screen |
| Tab / Shift+Tab | Perspective: select the next / previous handle |
| Arrow keys | Perspective: nudge the selected handle 1 px (Shift: 10 px) |
| C (hold) | Levels: compare without levels |
| Arrow keys, + / − | Overlay: move the logo (Shift: bigger steps), make it larger / smaller; the mouse wheel also resizes it |

Pinch or scroll to zoom; drag empty space to pan.

## How it's built

- Plain static files with no dependencies and no build step:
  - `index.html` (markup)
  - `css/app.css`
  - `js/config.js` (settings)
  - `js/engine.js` (image engine)
  - `js/app/` (interface: ten small modules on one shared namespace)
- The scripts are classic scripts on relative paths, so the app works from disk, from `localhost`, or from any folder on a static host.
- The image engine is pure functions with no access to the page. Corner detection runs in a Web Worker so the interface stays responsive.
- Every edit is a small state object, and the export is rendered from it in one resampling pass from the original photo. The work is done in bands to keep memory low on phones.
- Output is capped at 16.7 MP (the iOS Safari canvas limit), so a full-frame 48 MP export is downscaled; cropped exports usually aren't.
- Tunable settings live in `js/config.js`. Number and on/off settings can be overridden in the URL, for example `?detect.cannyHigh=90`; anything else in a link is ignored.
- A Content Security Policy lets only the site's own files run, and the code never builds HTML from text. `node tests/selftest.js` enforces both.

### Options for tinkering

| URL parameter | Effect |
|---|---|
| `?selftest=1` | Runs the engine self-tests in the page and in the worker |
| `?debug=1` | Opens the detection tuning panel and overlay (or press the backtick key) |

## Tests

| Command or file | What it checks |
|---|---|
| `node tests/selftest.js` | Engine self-tests (geometry, detection on a synthetic card, levels math, overlay placement, checks on links and edits files) plus structural checks: the engine never touches the page, asset links carry the current version, the interface modules only reach each other through their shared namespace, no code builds HTML from text, and the page keeps its Content Security Policy |
| `tests/sample-regression.js` | Corner detection and export checks against the photos in `samples/`. Serve the folder locally, open the app, paste the file into the browser console, and it prints a pass/fail table |

## Known limitations

- Detection is tuned on a small set of photos. It can pick a stand or case edge over the card, and on a raw card it can pick a frame printed inside the card or lose the card's outline on a busy mat; the next candidate or a quick drag fixes it. Its confidence score doesn't reliably flag wrong picks.
- Auto levels can be fooled by strongly colored backdrops, and white picks on foil or reflections give wrong results.
- No batch processing, background removal or glare correction.

## Changes

See [CHANGELOG.md](CHANGELOG.md).

## License

GNU General Public License v3.0. See [LICENSE](LICENSE).
