# Changelog

All notable changes to P1Hunt Card Finisher are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html). The version is shown in the logo tooltip and logged to the browser console.

## [1.4.0] - Unreleased

### Changed
- The code is split out of the single `index.html` into `css/app.css`, `js/config.js`, `js/engine.js`, and nine interface modules in `js/app/`. There are no behavior changes. It still has no build step or dependencies, and still works opened from disk.
- `tests/selftest.js` also checks module boundaries: every cross-module name goes through the shared namespace, and no module uses an undeclared name.
- Asset links carry the app version (`?v=`), so browsers pick up new files right after a release.

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
