# Changelog

All notable changes to P1Hunt Card Finisher are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html). The version is shown in the logo tooltip and logged to the browser console.

## [1.8.0] - Unreleased

### Added
- **Next card →** on the Export step. Once the photo is exported (Download, Copy or a finished Share), it opens the photo picker for the next card. The new photo starts as one opened with **Open**: the same crop preset and export settings, no levels, and your saved logo offered. The button hides again if you change anything that would change the exported image. While it shows, it takes the place of any export note (such as the unapplied-levels warning), which comes back with your next change.

### Changed
- On the Perspective step, **Tap to seed** is now **Tap to find card**, and it takes two taps: the button, then the card. Detection runs as soon as you tap the card, and one Undo puts the corners back. The **Detect** and **Clear seed** buttons are gone, and no marker is left on the photo. While it's waiting for your tap you can still drag and pinch the photo; tap the button again to cancel.
- Tests: twelve more sample photos (raw cards, flat on dark and busy mats, cards on stands) with hand-placed corners. The detection check now holds every photo to its own measured baseline, so nothing that detects well today can quietly break, and it prints a scoreboard of how many photos are found. Nothing in the app changes.

### Fixed
- Corner detection now finds cards with faint edges, such as a black card on a black mat. When the first pick looks doubtful, detection takes a second, more sensitive look at the edges and keeps whichever result it's more sure of. Photos it already detected confidently are unchanged.
- **Auto** on the Levels step could give the whole photo a color cast when the darkest part of the photo was strongly colored, such as a blue slab label (which turned the photo yellow). Auto's black point now uses only near-neutral dark areas, and sets no black point when there are none. Its white point is unchanged.

## [1.7.0] - 2026-10-30

### Added
- Contributor docs: `docs/architecture.md` (how the app is built, the edits-file format) and `tests/README.md` (how to run the tests and what each one guards).
- Two privacy checks in `node tests/selftest.js`: sample photos may not carry a GPS location, and the published files may not contain private network addresses or local paths.
- The project's Claude Code setup is now in the repository (`CLAUDE.md`, `.claude/`): path-scoped rules, the verify / UAT / release workflows, and hooks. It doesn't change the app.
- A check in `node tests/selftest.js` that the engine's built-in defaults match `CONFIG`.

### Changed
- The code was rewritten for readability: whole-word names, one statement per line, short lines, and a comment on every function, following a written code style (`.claude/rules/code-style.md`) that `node tests/selftest.js` now checks. Nothing you see in the app changes; exports are pixel-identical to before.
- The Overlay step's button reads **Add logo** (then **Replace logo**) instead of **Upload**. Nothing is ever uploaded; the logo stays on your device.

### Fixed
- On the Overlay step, an empty "saved logo" thumbnail (a broken image next to **Use saved overlay**) no longer shows when no logo has been saved.

### Security
- Links can no longer lift the app's safety limits. URL settings that size images, memory or work (the preview size, the 16.7 MP export cap, the 5 MB logo limit and others) only accept values inside a safe range, and memory and size caps can only be lowered. Before this, a crafted link could make the app look broken or run a phone out of memory.
- Edits files are size-checked (8 MB at most) before they're read, and the photo name and size they carry are checked before any message shows them. Long names are cut short in messages and in the Resume prompt. A malformed crop in an edits file now gives the usual "reset" notice instead of failing silently.

## [1.6.0] - 2026-10-28

A security and best-practices release. No new features.

### Security
- Links can no longer inject content or load scripts. URL settings now accept only existing number and on/off settings (for example `?detect.cannyHigh=90`); text, lists and anything else in a link is ignored. Before this, a crafted link could add markup to the page or load a script from elsewhere.
- Edits files are checked field by field before they're used. A malformed field is reset to its default (with a notice) and unknown fields are ignored. Before this, a crafted edits file could add markup to the Export step. The same checks apply to resumed sessions and remembered settings, and an embedded logo has the same type and 5 MB limits as an upload.
- The interface no longer builds HTML from text; controls and readouts are created as page elements.
- A Content Security Policy allows only the site's own scripts and styles, with the engine worker as the one `blob:` exception, so even a future mistake can't run outside code. A no-referrer policy is set too.
- `SECURITY.md`: what's stored on your device and how to report a problem privately.

### Removed
- The **Listing preset** button on the Export step. It repeated what the Crop step and the size setting already do. A new photo still starts at 1:1, fit to card, 2000 px, JPEG 0.92.
- The optional OpenCV.js detector (`?detect.opencv.enabled=1`). It was off by default, little used, and the app's only outside resource. The app now has no external dependencies at all.

### Changed
- Tests: two new engine self-tests (link settings, edits-file checks), two new structural checks (no HTML-from-text or eval in the code; a strict Content Security Policy with nothing inline or off-site), and regression R14 (real edits pass the edits-file check unchanged, and every state field has a rule). The regression script can also be loaded as a script, since the policy blocks `eval`.

## [1.5.0] - 2026-10-28

### Added
- **Overlay** step, between Levels and Export: put a logo or watermark on the photo.
  - Upload a PNG, WebP, JPG or SVG (up to 5 MB), or drop or paste one while on the step. Transparency is kept.
  - It starts centered at a quarter of the photo width. Drag it, resize it with a corner handle or a pinch, use the on-screen arrows and − +, or tap one of nine rings on the photo to snap it to a corner, the middle of a side, or the center. Opacity is adjustable.
  - On this step the photo stays framed as in Crop: every touch goes to the logo.
  - Placement is stored relative to the final cropped photo, so the logo lands in the same spot at every export size, and stays inside the photo if the crop changes.
  - The logo is merged into the exported image (and Share / Copy), after Levels, which never changes its colors.
  - The last logo and its last-used placement are kept in the browser. On the next photo, **Use saved overlay** applies it in one tap; **Delete saved overlay** forgets it.
  - Edits files include the logo, so loading one rebuilds the export exactly.
- Regression checks for the overlay: compositing with alpha, opacity, resolution independence, edits round-trip, and an unchanged export without an overlay.

### Changed
- Start fresh (on the resume prompt) clears the photo session only; the saved logo stays.
- Line endings are kept as LF on every OS (`.gitattributes`).

## [1.4.0] - 2026-10-28

### Changed
- The code is split out of the single `index.html` into `css/app.css`, `js/config.js`, `js/engine.js`, and nine interface modules in `js/app/`. There are no behavior changes. It still has no build step or dependencies, and still works opened from disk.
- `tests/selftest.js` also checks module boundaries: every cross-module name goes through the shared namespace, and no module uses an undeclared name.
- Asset links carry the app version (`?v=`), so browsers pick up new files right after a release.
- **Copy** is hidden where the browser can't copy images to the clipboard (pages not on HTTPS), instead of showing as a greyed-out button. On those pages Export shows just Download, matching how Share already behaved.

### Fixed
- On wide screens (desktop), the Crop step showed only the first few aspect presets. The phone-only sideways-scrolling row also applied there, with no visible scrollbar. Presets now wrap onto more lines on wide screens and still scroll sideways on phones.

## [1.3.3] - 2026-10-28

### Added
- **Share** button on Export, with the share-sheet icon. It appears only where the browser can share files, which requires HTTPS. On iPhone, Save Image puts the export straight into Photos without leaving the app.

### Changed
- **Download** is always a plain download on every device. It's the main button when Share isn't available.
- Saving edits always downloads the JSON file.

## [1.3.2] - 2026-10-28

### Changed
- Crop presets follow the card's orientation after Perspective and Rotate. A portrait card gets portrait crops, and the preset labels show the ratio in use (4:5, 2:3, 9:16, 5:7 card; or 5:4, 3:2, 16:9, 7:5 card).
- **Swap** switches to the other orientation and keeps it across presets; swapping back follows the card again.
- Edits files record the crop orientation. Files saved by earlier versions load with the orientation they were saved with.

## [1.3.1] - 2026-10-28

### Added
- **Resume:** the last photo and its edits (including an unapplied Levels draft and the current step) are kept on the device. After a reload or a closed tab, the start screen offers **Resume** or **Start fresh**. Nothing is uploaded.

### Fixed
- On iOS Safari, exporting replaced the app with the image, and going back lost all edits.

## [1.3.0] - 2026-10-28

### Changed
- Phone layout: every step uses the same layout (photo, a fixed-height control area, then the action bar), so the photo no longer changes size between steps and is larger than before.
- The bottom tab bar is replaced by a step menu: the first action-bar button (e.g. `Crop ▾`) lists all five steps.
- Each step shows only its everyday controls; the rest are under **More options**, which expands the control area. Hints moved there too, and status messages appear only when something needs attention.
- Levels is a single row: **Auto · White · Black · Clear**, with the picked colors shown in the buttons. One Clear resets both points; Clear then Apply removes levels.
- Compare is now press and hold on the photo (or hold C).
- Export format and size are dropdowns; quality moved to More options. The output readout notes when a small crop isn't upscaled.
- Nudge arrows are ordered ▲ ▼ ◀ ▶, and the magnifier stays up for 4 s after the last nudge. Touching anything else hides it.

### Removed
- The separate Clear buttons for white and black, "Remove levels", and the "unapplied changes" message. The step's dot and the Apply button show unapplied changes.

## [1.2.0] - 2026-10-26

### Added
- **Preview** button: shows the corrected card full-size.
- Double-tap a handle to zoom in on it; double-tap again to fit.
- On-screen nudge arrows for phones, with hold-to-repeat.
- Per-step action bar with a next-step button (Rotate →, Crop →…).
- **More options** sections for less-used controls.

### Changed
- Phone-first layout: one-row header, step tabs in a bottom bar, and a shorter controls panel for a bigger photo.
- On touch screens, the magnifier pins to the top corner away from your finger instead of sitting under it.
- "Next candidate" is now **Candidate n/3**.

### Fixed
- On iOS, pressing and holding a handle started text selection and the magnifier bubble.

## [1.1.0] - 2026-10-24

### Changed
- Renamed from "Card Photo Straightener" to **P1Hunt Card Finisher**. No behavior changes.

## [1.0.0] - 2026-10-24

### Added
- Automatic card corner detection, with a **Candidate** button for the next-best pick, an optional tap-to-seed hint and an optional OpenCV.js detector.
- Perspective correction with a **Flatten** slider (squared-up to fully flat 5:7).
- Rotate: 90° turns, flips and fine rotation.
- Crop with aspect presets and **Fit to card**.
- **Levels**: white and black droppers, Auto, compare, and a draft that's applied on demand.
- Export to JPEG, PNG or WebP at preset sizes, rendered from the full-resolution original; copy to clipboard.
- Undo / redo, save / load edits, keyboard shortcuts, and settings remembered between visits.
- Engine self-tests and sample-photo regression tests.
