# Architecture

How P1Hunt Card Finisher is put together. For what it does and how to use it, see the [README](../README.md); for how it's tested, see [tests/README.md](../tests/README.md).

## Principles

- **Plain static files.** No build step, no npm, no frameworks, and nothing loaded from another site. It runs from `file://`, `localhost` or a static host in a subfolder.
- **Classic scripts on relative paths.** `<script src>` only (ES modules fail from `file://` in Chrome), and every asset link carries `?v=<appVersion>` for cache-busting.
- **Everything stays in the browser.** No image is ever uploaded.
- **Non-destructive.** The original photo is never modified. Every edit lives in one serializable state object, and the export is `render(source, state)` from full resolution.

## File layout

| Path | Role |
|---|---|
| `index.html` | Markup only, with a Content Security Policy `<meta>` before any asset |
| `css/app.css` | All styles; phone rules in the `@media (max-width: 760px)` block at the end |
| `js/config.js` | `CONFIG`: every tunable, commented in place. Loaded first |
| `js/engine.js` | `CardEngine`: pure functions, wrapped in `function CardEngineModule(G)` |
| `js/app/*.js` | The shell: ten modules sharing the `CF` namespace, loaded in order `core → adapters → state → view → levels → overlay → input → ui → export → main` |
| `tests/` | Node and browser tests (see [tests/README.md](../tests/README.md)) |
| `samples/` | Six real photos with hand-placed ground truth for the regression test |

## Engine and shell

**Engine (`js/engine.js`).** Pure functions over `ImageData`, typed arrays and plain objects, with no `window` or `document`, so the same code runs on the main thread and in a Web Worker. The worker is built from `CardEngineModule.toString()` in a Blob, because browsers block file-based workers from `file://`.

- **Math:** 3×3 matrices, Gaussian elimination with partial pivoting, Hartley-normalized homography, quad utilities, perspective-corrected aspect (Zhang & He 2007).
- **Image I/O:** grayscale, separable Gaussian blur, Sobel, bilinear sampling.
- **Detection:** per-channel edges → Canny → gradient-gated Hough → line pairs → scored quads → full-resolution sub-pixel edge refinement. Of nested, equally strong rectangles it prefers the inner one (the card inside a case).
- **Render pipeline:** `computeGeometry(state)` gives every transform; `warp()` does inverse-mapped bilinear or bicubic sampling.
- **Levels:** linear-light LUTs, a robust patch mean, the Auto estimate.
- **Overlay:** `overlayRect`, `clampOverlay`, `snapOverlay`.
- **Untrusted input:** `applyConfigOverrides` (URL settings, kept inside `CONFIG_LIMITS` from `js/config.js`) and `sanitizeState` (edits files, Resume, stored settings).
- **Self-tests**, run by `tests/selftest.js` and by the app with `?selftest=1`.

**Shell (`js/app/`).** Each module is `(function (CF) { … })(window.CF)`, takes core names with `const { … } = CF;`, calls other modules as `CF.name`, and ends with `Object.assign(CF, { … })`. Elements are built with `CF.h(tag, attrs, ...children)`; HTML is never built from strings.

## Adapters (swap points for native apps)

| Adapter | Today | Planned native replacement |
|---|---|---|
| `ImageSource` | File picker, drag-and-drop, paste; EXIF orientation via `createImageBitmap(…, {imageOrientation:'from-image'})` | Camera, photo library |
| `Detector.detect(imageData, options) → [{corners, confidence}]` | JS detector in the worker (main-thread fallback) | Apple Vision / ML Kit, same return shape |
| `Exporter` | Download, share sheet, image clipboard | Save to Photos |
| `Session` | IndexedDB (last photo, its edits, the saved logo) | Native storage |

## Coordinate frames

`S` (source px) —H→ `P` (perspective-corrected) —flip, then rotate→ `R` (rotated frame) —crop + scale→ `O` (output). Export composes these into one matrix, so the full-resolution photo is resampled exactly once. The overlay is placed relative to the final crop and composited last, after Levels.

## Memory budget

- **Preview:** a 2048 px copy; a 720 px copy for the live mini-preview; a 1000 px copy for detection.
- **Export:** row bands of about 2 MP; each band reads at most 6 MP of the source. Output is capped at 16.7 MP (iOS Safari's canvas limit).
- **Levels in export:** the LUT is applied to each band's source pixels before the warp, so the fill color is never recolored.

## Edits file format

**Save edits** writes the whole edit state as JSON; loading it with the same photo exports a pixel-identical result.

```jsonc
{
  "version": 2,                                   // schema version (1 still loads)
  "source": { "name": "IMG_9216.JPEG", "width": 1536, "height": 2048 },
  "corners": [[445.5,627],[1146,633],[1112,1505],[466.5,1501.5]], // TL, TR, BR, BL in source px
  "strength": 1,                                  // Flatten 0–1
  "aspect": { "ratio": 0.714286, "orientation": "auto" },
  "squareUpHeight": "preserveEdges",
  "rotation": { "quarter": 0, "fine": 0, "fillFrame": false },
  "flip": { "h": false, "v": false },
  "crop": { "mode": "fit", "preset": "1:1", "ratio": 1, "swapped": false, "orient": null, "rect": null },
  "levels": { "white": [210,230.7,226], "black": null, "whiteAt": [420,230], "blackAt": null }, // or null
  "overlay": { "id": "…", "aspect": 2.4, "cx": 0.8, "cy": 0.9, "w": 0.25, "opacity": 0.6 },  // or null
  "export": { "format": "jpeg", "quality": 0.92, "longEdge": 2000, "interp": "bilinear", "fill": "#ffffff" },
  "overlayImage": { "id": "…", "type": "image/png", "name": "logo.png", "data": "<base64>" }      // only with an overlay
}
```

- `crop.mode`: `fit` (around the card), `manual` (`rect` relative to the frame center, in units of its long side), or `full`. `crop.orient` is `null` to follow the card.
- Loading checks every field (`sanitizeState`): malformed fields reset to their defaults with a notice, and unknown fields are dropped. A photo of a different size is refused.

## What's stored on the device

See [SECURITY.md](../SECURITY.md). In short: the last photo and its edits and the saved logo in IndexedDB (`p1hunt-finisher`), and remembered export and crop choices in localStorage (`p1hunt.straightener.v1`).
