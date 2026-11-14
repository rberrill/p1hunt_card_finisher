# P1Hunt Card Finisher 1.10: UAT script

This version's acceptance test, run on the dev build before release: the new and connected cases below, then the smoke test, on desktop and on iPhone. After the release is pushed, the smoke test and the (HTTPS) rows run again on the live site.

- **Version under test:** the logo tooltip (desktop) or the last line of Export → More options (phone) reads `1.10.0` (dev builds: `1.10.0-dev.N`; this build is `1.10.0-dev.1`).
- **Automated tests first:** `node tests/selftest.js` and `tests/sample-regression.js` must both pass (see `tests/README.md`). Claude runs these, plus the layout, subfolder and `file://` checks, before handing over a build.
- **IDs** are the permanent IDs from `tests/uat/catalog.md` (`D` Desktop, `P` Phone, `E` Environments, then section.row). 🆕 marks a case for behavior new in this version; ✏️ a case whose behavior changed in this version.
- **One row per behavior, on one device.** A behavior is tested once, on the device that can judge it best; the rest is shared out so both devices exercise every feature. Each row is one flow with one verdict.
- **Recording:** mark each row ✅ pass, ❌ fail or ➖ skipped. For a fail, write what happened in Notes; a screenshot helps.

| Tester | Date | Device / browser | Build (commit or "working copy") |
|---|---|---|---|
| Rich | | Desktop Chrome + iPhone Safari | |

---

## Scope

**Fixed in 1.10:**
- **The format-fallback notice is seen.** When the browser can't save the chosen format (WebP on Safari), the notice was replaced at once by the "Exported…" toast. It is now part of that toast, on Download, Share, a pair's export and the corner shots (P8.8 ✏️).

**Connected:** none. The desktop browser encodes WebP, so the row is on the phone; `verify` checks every path with the encoder stubbed.

**Full run:** not triggered yet (1.9 was a full run).

---

## Setup

UAT runs on the **dev build** before release. GitHub Pages only serves the `release` branch, so there is no HTTPS copy until the release is deployed.

- **Desktop:** in the project folder run `python -m http.server 8765 --bind 0.0.0.0`, then open `http://localhost:8765/index.html` in Chrome, in a window wider than 760 px, with DevTools open on the Console tab. Browsers treat `localhost` as secure, so Share and Copy work on desktop. `SITE` in a row means that address. Have ready from `samples/`: `IMG_9136.JPEG` (PSA slab), `IMG_9060.JPEG` (one-touch on a stand), the pair `14_front_portrait_raw_white.JPEG` + `14_back_…` (a raw portrait card on white) and the pair `13_front_landscape_onetouch_labeled_white.JPEG` + `13_back_…` (a landscape card in a labelled one-touch).
- **Phone:** with the same server running (the PC's Wi-Fi set to Private), open `http://<PC-LAN-address>:8765/index.html` in Safari. First clear the LAN address's website data in Safari's settings (Advanced → Website Data), so no cached build runs; closing the tab isn't enough. Over the LAN, detection runs much slower than on the live site (about 13–20 s on an iPhone instead of under 1 s); wait for "Detecting…" to clear and judge the result, not the speed. Have in Photos: a few of your own card photos (one in a slab, one raw, one 48 MP if you have it) and the 13 and 14 pairs, as full-size originals if you still have them (the sample copies are 3 MP), otherwise AirDropped.
- **(HTTPS) rows:** plain HTTP hides Share and Copy on the phone. Rows whose Test starts with **(HTTPS)** come already marked ➖: skip them before release, and run them on the live site right after deploy (the version script's "After deploy" section).
- **The upscale question:** when a crop is under the chosen Size (every sample photo's is), Download, Share and Copy first ask **Upscale to N px?**, and the corner buttons ask the same. Answer **No** unless the row says otherwise.
- **Safari and Download:** over the LAN, **Download** may show the image in the tab. Go Back and tap **Resume** to carry on; rows don't repeat this.
- **Overlay files:** a transparent PNG logo (a watermark with soft edges is ideal) on both devices; on desktop also a JPG, a WebP, an SVG, a text file renamed to `.png`, a corrupt image, and an image over 5 MB.

---

## 8. Export

### Desktop

No cases this version.

### Phone
*Setup: a photo straightened and cropped, on Export.*

| ID | Test | Steps | Expected | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| P8.8 ✏️ | WebP falls back | Choose WebP and **Download** | A PNG; the toast after it reads "Exported … WEBP isn’t supported by this browser, so it was saved as PNG." in the warning colour, for a few seconds. If Safari saves a `.webp` instead, it encodes WebP now: mark ➖ and say so in Notes |  |  |

---

## Smoke test

Run on both devices after the sections above (**Pre-release** column), and again on the live site right after deploy (**Live** column). Copied from `tests/uat/smoke.md`.

### Desktop
*Setup: Chrome with DevTools open on the Console tab, in a window wider than 760 px. The 14 pair from `samples/` (`14_front_portrait_raw_white`, `14_back_portrait_raw_white`) and a transparent PNG logo to hand. When a Download or Copy asks **Upscale to 2000 px?**, answer **No**.*

| ID | Test | Steps | Expected | Pre-release | Live | Notes |
|---|---|---|---|---|---|---|
| SD1 | Right build | Open the page; look at the tab, the console and the logo's tooltip | The tab shows the P1 icon; the console's version line and the tooltip read the version under test (`-dev` pre-release) |  |  |  |
| SD2 | Drop and detect | Drag `14_front_portrait_raw_white` onto the page | It loads with four corners on or near the card |  |  |  |
| SD3 | Corner by mouse and keys | Drag a corner onto the card's corner, press an arrow key twice, then Ctrl+Z | The loupe sits up-right of the cursor and the Result preview updates; the keys nudge the handle; Ctrl+Z moves it back |  |  |  |
| SD4 | Rotate | Press 2, type `1.5` in the degrees box | Rotate opens; the photo turns 1.5°, with a grid |  |  |  |
| SD5 | Crop | Press 3, click 5:4 | The chip reads 4:5 and the box is portrait (it follows the card) |  |  |  |
| SD6 | Levels | Press 4, **Auto**, hold **C**, then **Apply** | The colors adjust; C shows the photo without levels; Apply clears the dot |  |  |  |
| SD7 | Overlay | Press 5, **Add logo** with the PNG, click the bottom-right ring | The logo snaps to the bottom-right corner, inside the photo |  |  |  |
| SD8 | Download | Press 6, **Download**, open the file | `<name>-straight.jpg`; the crop, rotation, levels and logo match the screen; **Next card →** shows |  |  |  |
| SD9 | Copy | **Copy**, paste into another app | The image pastes |  |  |  |
| SD10 | Edits round trip | More options → **Save edits**; reload, **Start fresh**; open the same photo, go to Export, **Load edits**, **Download** | The second file looks identical to SD8's, logo included |  |  |  |
| SD11 | Add back | **Add back**, choose `14_back_portrait_raw_white` | It opens on Perspective; the header shows **Front / Back** with Back lit, then **×** |  |  |  |
| SD12 | Pair export | Go to Export, look at the photo area; choose **Separately**, **Download** | The preview joins both cards, front on the left; two files arrive, `-front` (with the logo) and `-back` |  |  |  |
| SD13 | Corner shots | In the side panel's **Corner shots** box choose **4 photos**, **Download corners** | Four close-up files, `-corner-tl`, `-tr`, `-br`, `-bl`, with no logo |  |  |  |
| SD14 | Resume the pair | Reload, **Resume** | The prompt names both photos; both sides come back, on the side and step you left |  |  |  |
| SD15 | Narrow window | Narrow the window below 760 px, then widen it | The step menu button replaces the tabs; widening brings them back |  |  |  |
| SD16 | Clean console | Look at the console | No red errors (CSP or otherwise) from the whole pass |  |  |  |

### Phone
*Setup: iPhone Safari; clear the LAN address's website data in Safari's settings (Advanced → Website Data) first, so no cached build runs. In Photos: a slabbed card's front and back, shot the same way up. A logo saved from an earlier run (or a PNG to upload). If Safari shows a downloaded image in the tab, go Back and tap **Resume**.*

| ID | Test | Steps | Expected | Pre-release | Live | Notes |
|---|---|---|---|---|---|---|
| SP1 | Open and detect | **Open**, choose the slab's front | It loads and the corners sit on the card; header, photo, control area and action bar, with nothing over the photo and no button text cut off |  |  |  |
| SP2 | Long-press and drag | Press and hold a corner for 2 s, then drag it | No iOS magnifier or callout; the loupe pins to the top corner away from your finger |  |  |  |
| SP3 | Nudge and Undo | Tap ▶ twice, then Undo | The handle moves and the loupe stays up; one Undo takes both taps back |  |  |  |
| SP4 | Step menu and Rotate | Tap the step button, pick **Rotate**, drag the Fine slider | The menu closes on Rotate; the photo rotates, with a grid |  |  |  |
| SP5 | Crop | **Crop →**, swipe the preset row, tap 5:4 | The chip reads 4:5 and the box is portrait; the photo is the same height as on Rotate |  |  |  |
| SP6 | Levels | **Levels →**, **Auto**, press and hold the photo, then **Apply** | The colors adjust; the hold shows the photo without levels, with no magnifier; Apply clears the dot |  |  |  |
| SP7 | Overlay | **Overlay →**, **Use saved overlay** (or **Add logo**), pinch on the logo, tap the bottom-right ring | The logo resizes while the photo stays still, then snaps to the corner |  |  |  |
| SP8 | Right build | **Export →**, open More options, scroll to its end | The last line reads the version under test (`-dev` pre-release); the Source line above it gives the photo's real pixel size |  |  |  |
| SP9 | Download with upscale | Close More options, **Download**; if it asks **Upscale to 2000 px?**, tap **Yes** | The image has the crop, levels and logo as on screen; no crash |  |  |  |
| SP10 | Next card | Look under the readout (after Back and **Resume** if Safari showed the image) | On Export with every edit intact; **Next card →** sits beside **Add back** |  |  |  |
| SP11 | Add back | **Add back**, choose the slab's back | It opens on Perspective with corners on the card; the header fits **Front / Back** and **×** in one row |  |  |  |
| SP12 | Corner sheet | Go to Export, tap **Corner shots**, **1 sheet**, **Download corners** (answer **No** if asked) | More options opens at the Corner shots box; a 2×2 sheet of this side's corners downloads, with no logo |  |  |  |
| SP13 | Pair preview and Download | Close More options; with **Together** chosen, **Download** (answer **No** if asked) | The photo area shows both sides, front first; one joined image downloads, the logo on the front only |  |  |  |
| SP14 | (HTTPS) Share to Photos | **Share** → Save Image, then open it in Photos | The joined image is in Photos and matches the screen; Safari is still on Export with every edit intact | ➖ |  |  |
| SP15 | Resume after closing | Swipe Safari away, reopen the page, **Resume** | The prompt names both photos; both sides and their edits come back |  |  |  |
| SP16 | Unpair | Tap **×**, **Keep front** | A card over the dimmed photo asks which side to keep; the front stays as a single photo with its edits |  |  |  |

---

## After deploy

On https://rberrill.github.io/p1hunt_card_finisher/, right after the release is pushed:

1. Run the smoke test again and fill in its **Live** column. SD1 and SP8 must show the released version, not `-dev`.
2. Run this version's **(HTTPS)** rows: none yet.
3. Record the result below. A fail means a rollback (the `release` skill), then a fix release.

**Live check (v1.10.0, date):** ☐ Keep  ☐ Roll back

---

## Sign-off

| Area | Desktop | Phone | Blocking issues |
|---|---|---|---|
| 8. Export | ➖ | | |
| Smoke test (pre-release) | | | |
| Smoke test (live) | | | |

**Decision (v1.10.0, date):** ☐ Ship (tag `main` and move `release`)  ☐ Fix first

**Previous: v1.9.0, 2026-11-10:** shipped after a full run of its version script and the
pre-release smoke test passed on desktop and iPhone, and kept after the live check (see
`archive/UAT-1.9.md`).
