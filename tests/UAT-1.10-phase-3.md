# P1Hunt Card Finisher 1.10, phase 3: UAT script

Phase 3 of the 1.10 redesign: Crop, Levels and Overlay rebuilt in the new layout (label row, control row and tool row in the control area, with each step's options sheet). Run on the dev build, desktop and iPhone: the cases below, then the smoke test. The redesign is released once, after phase 6, so this script has no Live column and no After deploy section.

- **Version under test:** `1.10.0-dev.8` or later. Desktop: the console's first line reads `[card-finisher] v1.10.0-dev.N`. Phone: the last line of Export's options sheet.
- **Automated tests first:** `node tests/selftest.js` and `tests/sample-regression.js` must both pass (see `tests/README.md`). Claude runs these, plus the `verify` skill's layout, subfolder and `file://` checks, before handing over a build.
- **IDs** are the permanent IDs from `tests/uat/catalog.md` (`D` Desktop, `P` Phone, `E` Environments, then section.row). 🆕 marks a case for behavior new in this phase; ✏️ a case whose behavior, or the controls its steps go through, changed in this phase. Unmarked rows are connected cases, copied from the catalog unchanged.
- **One row per behavior, on one device.** A behavior is tested once, on the device that can judge it best; the rest is shared out so both devices exercise every feature. Each row is one flow with one verdict.
- **Recording:** mark each row ✅ pass, ❌ fail or ➖ skipped. For a fail, write what happened in Notes; a screenshot helps.

| Tester | Date | Device / browser | Build (commit or "working copy") |
|---|---|---|---|
| Rich | | Desktop Chrome + iPhone Safari | |

---

## Scope

**New in phase 3:**
- **Crop rebuilt.** The crop's size in the label row; the eight presets in one row that runs off the right edge and rests on the selected preset (they wrap on desktop); Fit to card and Swap as tools; "Crop options" with Reset crop and Tips (D5.1 ✏️, D5.3 ✏️, D5.4 ✏️, D5.7 🆕, D5.8 🆕, P5.1–P5.3 ✏️, P5.4 🆕, P5.5 🆕). While paired the other presets dim and the label row says "Pair: 5:7 only" (P11.3 ✏️).
- **Levels rebuilt.** Discard and Apply in the label row with a one-line instruction between them; Pick white and Pick black with their swatches; Auto and Clear as tools (D6.1 ✏️, P6.1–P6.3 ✏️, P6.5 ✏️). An armed pick's instruction stays in the label row and its toast is gone (P6.9 🆕). The sheet is "Levels tips" (P6.10 🆕, D6.5 🆕). The unapplied mark is a white dot on the Levels tab (P2.3 ✏️).
- **Overlay rebuilt.** With no logo: a hint line, Use saved overlay with its thumbnail when one is saved, and Add logo in red (D7.13 ✏️, P7.1 ✏️). With a logo: Opacity in the label row, the move and size pads in one row, and four tools, Replace logo, Reset, Remove and Delete saved (D7.1 ✏️, P7.2 ✏️, P7.7 ✏️, P7.11 ✏️, P7.13 ✏️, P7.14 ✏️). File errors take the label row (D7.4 ✏️, D7.5 ✏️). Delete saved is a tool that doesn't ask first and leaves this photo's logo (D7.15 ✏️, P7.18 🆕). "Overlay options" holds only Tips (P7.19 🆕, D7.18 🆕).
- **The shell.** Crop, Levels and Overlay no longer scroll and their sheets are new; Export keeps its old controls and its old sheet until phase 4 (P1.3 ✏️, P2.9 ✏️).

**Connected:**
- D5.2, D5.5, D5.6 (the crop follows the card): the presets and their labels are rebuilt.
- D11.5, P11.4 (Swap for a pair, ✏️ because Swap is now a tool): it turns both sides and isn't an undo step.
- D6.3, D6.4, P6.6–P6.8, D12.1 (the Levels draft: Undo, a new photo, Discard, Clear, the warning on Export, Resume): Apply, Discard and Clear moved.
- D6.2, P6.4 (hold to compare): the label row now names it.
- D7.14, D7.16, D7.17, P7.16, P12.1 (the saved overlay: used, kept by Start fresh, a private window, a closed tab, Resume): its offer and Delete saved moved.
- P7.8 ✏️, P7.9 (the snap rings) and P5.2 ✏️ (the crop handles): the bottom ring and the bottom handle sit close to the grabber, and a touch that starts on the photo must not open the sheet.
- D7.6–D7.8, D11.22 (drop and paste of a logo; elsewhere a photo; no question while paired): Overlay's step is rebuilt.
- D7.2, D7.9, D7.10, P7.3–P7.6, P7.10 ✏️, P7.12, P7.15 (the rest of Overlay: Replace logo, the keys and wheel, the gestures, undo per gesture, where the logo shows): their controls and handlers moved with the step.
- D7.11 (Levels don't touch the logo): both steps are rebuilt.
- D13.6 (a lowered size cap): the rejection now takes the label row with no logo placed.

**Not in this phase:** D7.3, D7.12 and P7.17, whose verdict is the exported or shared file; they run with Export (phase 4 and the release script).

**Full run:** triggered, because the redesign touches every module, but the plan puts it at phase 6 (the release script). Not run in this phase.

**(HTTPS) rows:** none in this phase.

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

## 1. Start and layout

Open a photo first: in the catalog this row follows the rows that open one.

### Desktop

No cases in this phase.

### Phone
*Setup: no photo open.*

| ID | Test | Steps | Expected | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| P1.3 ✏️ | Every step fits | Tap each of the six tabs in turn | The photo is the same height on every step; the tab you're on is lit; no tab label or button text is cut off; the tab bar clears the home indicator. Only on Export does the control area still scroll, for now |  |  |

---

## 2. Navigation

### Desktop

No cases in this phase.

### Phone
*Setup: a photo open.*

| ID | Test | Steps | Expected | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| P2.3 ✏️ | Unapplied Levels dot | Make a Levels change without Apply, then tap other tabs | A white dot on the Levels tab, on every step |  |  |
| P2.9 ✏️ | Every step has its options | On each of the six steps, open the sheet and scroll it | Each opens with that step's title: Perspective options, Rotate options, Crop options, Levels tips, Overlay options, Export options. Export's still holds its old More options content, with **Fill outside photo**; the others are rows P3.13, P4.5, P5.5, P6.10 and P7.19 |  |  |

---

## 5. Crop

### Desktop
*Setup: a portrait card (`IMG_9136`) open on Crop. Crop's options are listed in the panel under its controls.*

| ID | Test | Steps | Expected | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| D5.1 ✏️ | Presets | Look at the panel, then click each preset | The label row reads "Crop" and the box's size in px. All eight presets show at once, wrapping onto more lines, with **Fit to card** and **Swap** as tools under them; each click reshapes the box, fills that preset white and updates the size |  |  |
| D5.2 | Portrait card, portrait crops | Click 5:4 | The chip reads **4:5** and the box is portrait; labels read 3:4 · 4:5 · 2:3 · 9:16 · 5:7 card |  |  |
| D5.3 ✏️ | Swap | Click the **Swap** tool, pick 3:2, then click **Swap** again | Landscape, with labels 4:3 · 5:4 · 3:2 · 16:9 · 7:5 card; 3:2 stays landscape; the second Swap gives portrait 2:3 |  |  |
| D5.4 ✏️ | Swap is off at 1:1 and Free | Pick 1:1, then Free, then Original | The **Swap** tool is dimmed for 1:1 and Free, and back for Original |  |  |
| D5.5 | Rotation turns the crop | On Rotate, **90° right**, go back to Crop, then Undo | The crop and labels switch to landscape with the card; Undo makes them portrait again |  |  |
| D5.6 | Orientation setting | On Perspective, orientation **Landscape** in the side panel, then Crop | The crop and labels are landscape |  |  |
| D5.7 🆕 | Reset crop | Pick 3:2, drag the box off the card and resize it, click **Reset crop** in the panel's options, then press Ctrl+Z | Reset puts the crop back to 1:1, fitted to the card; Ctrl+Z brings your 3:2 box back |  |  |
| D5.8 🆕 | Keys in the tips | Look at **Tips and keys** in the panel's options | Crop's tip (drag inside the box to move it, its handles to resize), then its key: Shift keeps the aspect while you drag a Free crop |  |  |

### Phone
*Setup: a portrait card open on Crop.*

| ID | Test | Steps | Expected | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| P5.1 ✏️ | Preset row scrolls | Look at the control area, then swipe the preset row sideways | The label row reads "Crop" and the box's size in px. The presets are one row that runs off the right edge, with a chip cut off there; the swipe reveals all eight, ending at **5:7 card**. **Fit to card** and **Swap** are tools in the row below and stay in view; the control area itself doesn't scroll |  |  |
| P5.2 ✏️ | Move and resize the box | Drag inside the box with your finger, drag a corner handle, then drag the handle in the middle of the box's bottom edge | It moves, then resizes, and the size in the label row follows. The drag from the bottom handle resizes the box, even close to the grabber, and doesn't open the options sheet |  |  |
| P5.3 ✏️ | Fit to card | Drag the box off the card, then tap the **Fit to card** tool | The box fits the card again, with padding, at the current aspect |  |  |
| P5.4 🆕 | The row rests on the selected preset | Swipe to the end of the row and tap **5:7 card**, swipe the row back to its start, tap the **Rotate** tab, then the **Crop** tab | 5:7 card fills white. Back on Crop the row is scrolled to it again, without a swipe |  |  |
| P5.5 🆕 | Options sheet | Open the sheet with the grabber, tap **Tips** | "Crop options": **Reset crop** and **Tips**; Crop's one tip unfolds in place, with no keyboard keys listed |  |  |

---

## 6. Levels

### Desktop
*Setup: `IMG_9136` open on Levels, no levels applied. Levels' tips are listed in the panel under its controls.*

| ID | Test | Steps | Expected | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| D6.1 ✏️ | Light black point rejected | Click **Pick black**, then click something light | An amber toast: "That spot is too light to be a black point. Pick something dark, or skip the black point."; the black swatch stays empty and the photo doesn't change. The pick stays armed (the line still reads "Tap something black"), so a click on something dark picks it |  |  |
| D6.2 | C key compare | Click **Auto**, then hold the **C** key | The image shows without levels while held, then returns |  |  |
| D6.3 | Undo and Redo | **Apply**, Undo, then Redo | One Undo removes the levels; Redo brings them back |  |  |
| D6.4 | Levels don't carry over | With levels applied, open a new photo | The new photo has no levels |  |  |
| D6.5 🆕 | Tips in the panel | Look under Levels' tools in the panel | Levels' three tips are listed there, with nothing to open, followed by its key: hold C, or press and hold the photo, to compare |  |  |

### Phone
*Setup: a photo open on Levels, no levels applied.*

| ID | Test | Steps | Expected | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| P6.1 ✏️ | Levels layout | Look at the control area | The label row holds **Discard**, the line "Pick white, or try Auto" and **Apply** in red, both buttons dimmed. Under it **Pick white** and **Pick black**, each with an empty swatch; then the tools **Auto** and **Clear**, Clear dimmed. All of it is in view: the control area doesn't scroll |  |  |
| P6.2 ✏️ | Auto | Tap **Auto** | The image changes and a toast says what Auto set; the swatches fill in; **Discard** and **Apply** light up; the line now reads "Hold the photo to compare"; a white dot on the Levels tab |  |  |
| P6.3 ✏️ | White pick by touch | Tap **Pick white**, touch and hold the card's white border, move slightly, then lift | **Pick white** fills white while it's armed. A loupe with a sampling circle while held; the pick lands where you lift: a W ring marks the spot, the swatch takes its color and Pick white is no longer armed |  |  |
| P6.4 | Hold to compare | Press and hold the photo still, release, then drag the photo | The photo shows without levels while held, with no magnifier or callout; the drag pans without comparing |  |  |
| P6.5 ✏️ | Apply | Tap **Apply** in the label row | The dot leaves the Levels tab; **Apply** and **Discard** dim; the swatches stay filled |  |  |
| P6.6 | Discard | Make a change, then **Discard** | The draft is dropped; applied levels are unchanged |  |  |
| P6.7 | Clear and Apply | **Clear**, then **Apply** | Levels removed; original colors |  |  |
| P6.8 | Unapplied warning on Export | Make a change without Apply, go to Export | Export warns that levels are unapplied |  |  |
| P6.9 🆕 | The armed instruction stays | Back on Levels, tap **Pick black**, wait about 5 s without touching the photo, tap **Pick white**, then tap **Pick white** again | The label row reads "Tap something black" for as long as that pick is armed, then "Tap something white"; no toast appears over the photo at any point. The last tap disarms the pick and the line it replaced comes back |  |  |
| P6.10 🆕 | Tips sheet | Tap the grabber | The sheet is titled "Levels tips" and shows the three Levels tips at once: no options and no Tips row to open. No keyboard keys are listed |  |  |

---

## 7. Overlay

### Desktop
*Setup: a photo open on Overlay, no logo yet. Overlay's options are listed in the panel under its controls.*

| ID | Test | Steps | Expected | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| D7.1 ✏️ | Add a PNG | Click **Add logo** (in red) with a transparent PNG | The logo appears centered at about ¼ of the photo width, its shape kept. The hint and **Add logo** give way to the Opacity slider, the move and size pads, and four tools: **Replace logo**, **Reset**, **Remove** and **Delete saved** (AC4, AC9) |  |  |
| D7.2 | JPG and WebP | **Replace logo** with the JPG, then with the WebP | Each replaces the logo |  |  |
| D7.4 ✏️ | Not an image | **Replace logo** with the renamed text file, then with the corrupt image | Each time the reason takes the label row, with a red icon, where the Opacity slider was; the current logo is unchanged (AC5) |  |  |
| D7.5 ✏️ | Over 5 MB | **Replace logo** with the file over 5 MB | Rejected; the label row reads "That file is N MB. The overlay limit is 5 MB." (AC6) |  |  |
| D7.6 | Drop adds a logo here | Drag a PNG onto the photo | It becomes the logo |  |  |
| D7.7 | Drop elsewhere opens a photo | Go to Crop, drag a PNG onto the photo | It opens as a new photo (then reopen your photo and return to Overlay) |  |  |
| D7.8 | Paste adds a logo | Copy an image, press Ctrl+V | It becomes the logo |  |  |
| D7.9 | Arrow keys move | Press the arrow keys, then Shift+arrows | The logo moves in small, then bigger steps |  |  |
| D7.10 | Keys and wheel resize | Press + and −, then scroll the mouse wheel | The logo resizes; the photo doesn't zoom |  |  |
| D7.11 | Levels don't touch the logo | Apply a Levels white pick, return to Overlay | The logo's colors are unchanged (Q3) |  |  |
| D7.13 ✏️ | Saved logo is offered, not applied | Place a logo bottom-right at 60%, open a different photo, go to Overlay | Not added. The panel shows the hint line, the logo's thumbnail beside **Use saved overlay**, and **Add logo** in red; **Delete saved** is the only tool (AC20, Q7) |  |  |
| D7.14 | Use saved overlay | Click **Use saved overlay** | Applied bottom-right at 60%, the last-used settings (AC20, Q8) |  |  |
| D7.15 ✏️ | Delete saved | With that logo placed, click the **Delete saved** tool, then open a new photo and go to Overlay | It doesn't ask first. The logo stays on the current photo and **Delete saved** dims; the new photo is offered none, just the hint and **Add logo** (AC21, Q9) |  |  |
| D7.16 | Start fresh keeps the logo | Save a logo again, reload, **Start fresh**, open a new photo | The saved logo is still offered |  |  |
| D7.17 | Private window | In a private window, add a logo | It works on the photo; a notice says it can't be saved in this browser (AC22) |  |  |
| D7.18 🆕 | Keys in the tips | Look at **Tips and keys** in the panel's options | Overlay's three tips, then its keys: the arrows move the logo (Shift for bigger steps), + and − resize it, and the wheel resizes it too |  |  |

### Phone
*Setup: a photo open on Overlay, no logo yet. The PNG logo is in Photos or Files.*

| ID | Test | Steps | Expected | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| P7.1 ✏️ | Overlay layout | Look at the screen | The photo is the same height as on other steps. The control area holds the hint "Add a logo or watermark: PNG, WebP, JPG or SVG, up to 5 MB." and **Add logo** in red (if a logo is saved: its thumbnail and **Use saved overlay** beside **Add logo** in one row, and **Delete saved** as the one tool under them); no text is cut off and nothing scrolls (AC2) |  |  |
| P7.2 ✏️ | Add a logo | **Add logo**, choose the PNG | The logo appears centered at about ¼ of the photo width, with nine rings on the photo. The control area now holds Opacity with its slider and %, the move pad beside the − + pad, and four tools (**Replace logo**, **Reset**, **Remove**, **Delete saved**), all in view at once with no label cut off (AC4, AC9) |  |  |
| P7.3 | Drag the logo | Drag starting on the logo, then starting on empty photo | The logo moves both times; the photo doesn't pan (AC10, Q5) |  |  |
| P7.4 | Stays inside | Drag the logo far past an edge | It stops with the whole logo inside the photo (AC10) |  |  |
| P7.5 | Corner resize | Drag a corner handle | Resizes with the shape locked (AC11) |  |  |
| P7.6 | Pinch | Pinch with both fingers on the logo, then on empty photo | The logo resizes both times; the photo stays still (AC13) |  |  |
| P7.7 ✏️ | Move and size pads | Tap ◀ ▲ ▼ ▶ and − +, then hold one | The two pads share one row. Small steps; the buttons are easy to hit; holding repeats (AC14) |  |  |
| P7.8 ✏️ | Snap rings | Tap each of the nine rings (corners, side middles, center), then Undo | The logo jumps to each spot with a small margin; the three bottom rings take the tap without opening the options sheet; Undo puts it back one snap (AC15) |  |  |
| P7.9 | Rings and drags | Drag the logo, then start a drag on a ring | The rings are hidden during a drag; a drag from a ring moves the logo without snapping |  |  |
| P7.10 ✏️ | Crop change keeps the place | Go to Crop, pick a different preset (4:5 if it was 1:1), return | The logo keeps its relative place, fully inside (Q1) |  |  |
| P7.11 ✏️ | Opacity | Slide **Opacity** in the label row | The logo fades live and the % at the end of the row follows (AC16) |  |  |
| P7.12 | One undo per gesture | Undo after a slide, a drag and a pinch | Each undoes as one step |  |  |
| P7.13 ✏️ | Reset | Tap the **Reset** tool | Back to center, ¼ width, 100% (AC18) |  |  |
| P7.14 ✏️ | Remove and Undo | Tap the **Remove** tool, then Undo | The logo is gone from this photo and the control area is back to the hint, **Use saved overlay** and **Add logo**; Undo brings the logo and its controls back (AC17) |  |  |
| P7.15 | Only on Overlay and Export | Look at Perspective, Rotate, Crop and Levels | The logo doesn't show there (Q4) |  |  |
| P7.16 | Saved logo survives closing | With a logo placed, swipe Safari away, reopen the app, start a new photo, go to Overlay | The saved logo is offered with **Use saved overlay** (AC19) |  |  |
| P7.18 🆕 | Delete saved from the offer | With the saved logo offered but not used (as P7.16 leaves it), look at the tools, then tap **Delete saved** | **Delete saved** is the only tool. It doesn't ask first: the thumbnail and **Use saved overlay** go, leaving the hint and **Add logo** |  |  |
| P7.19 🆕 | Options sheet | Open the sheet with the grabber, tap **Tips** | "Overlay options" holds only **Tips**; the three Overlay tips unfold in place, with no keyboard keys listed |  |  |

---

## 11. Front and back

These rows are taken out of the catalog's sequence, so on each device pair the 14 photos first (open the front, Export → **Add back**, choose the back). D11.22's **Cancel** then has nothing to cancel: skip it.

### Desktop
*Setup: the 14 pair (`14_front_portrait_raw_white`, `14_back_portrait_raw_white`), `13_front_landscape_onetouch_labeled_white` as a third photo, and a transparent PNG logo.*

| ID | Test | Steps | Expected | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| D11.5 ✏️ | Swap isn't an undo step | On Crop, click the **Swap** tool, then press Ctrl+Z | The crop stays landscape (AC8) |  |  |
| D11.22 | Drop on Overlay adds a logo | **Cancel**. On Overlay, drag a PNG onto the photo | It becomes the logo, with no question (AC17) |  |  |

### Phone
*Setup: in Photos, the 14 pair (a raw card's front and back) and the 13 pair (a landscape card), full-size originals if you have them, else the AirDropped copies.*

| ID | Test | Steps | Expected | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| P11.3 ✏️ | Crop is locked to 5:7 | Go to Crop, then tap another preset | Every preset but **5:7 card** is dimmed and the tap picks nothing; the row rests scrolled to 5:7 card, and the label row reads "Pair: 5:7 only" beside the size (AC7) |  |  |
| P11.4 ✏️ | Swap turns both sides | Tap the **Swap** tool, then tap **Front** | Both sides are landscape (AC8) |  |  |

---

## 12. Session restore

### Desktop
*Setup: a photo open.*

| ID | Test | Steps | Expected | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| D12.1 | Resume | Edit on several steps, leave a Levels change unapplied, reload, **Resume** | The start screen's card reads "Last photo · just now" over "Resume <name>?" with **Resume** and **Start fresh**; Resume brings back the same photo, edits and step, the corners unmoved, the Levels change still unapplied with its dot, and no "reset" notice |  |  |

### Phone
*Setup: a photo open.*

| ID | Test | Steps | Expected | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| P12.1 | Closed tab | Edit a photo and place a logo, swipe Safari away, reopen the page, **Resume** | The Resume prompt appears; the photo, edits, step and logo all come back |  |  |

---

## 13. Security

### Desktop
*Setup: DevTools open on the Console tab. These use harmless test text. The safe ranges themselves are tested by `tests/selftest.js`; these rows check the app acts on them.*

| ID | Test | Steps | Expected | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| D13.6 | A link can lower a cap | Open `SITE?overlay.maxBytes=524288`, open a photo, go to Overlay, **Add logo** with `samples/IMG_9136.JPEG` | Rejected; the message names a 0.5 MB limit |  |  |

### Phone

No cases in this phase.

---

## Smoke test

Run on both devices after the sections above. Copied from `tests/uat/smoke.md`. No row changed in this phase: its Crop, Levels and Overlay rows name only controls that keep their names (the presets, Auto, Apply, Add logo, Use saved overlay, the rings), so there is no ✏️ here. There is no Live column: the redesign is released once, after phase 6.

### Desktop
*Setup: Chrome with DevTools open on the Console tab, in a window wider than 760 px. The 14 pair from `samples/` (`14_front_portrait_raw_white`, `14_back_portrait_raw_white`) and a transparent PNG logo to hand. When a Download or Copy asks **Upscale to 2000 px?**, answer **No**.*

| ID | Test | Steps | Expected | Pre-release (dev.8) | Notes |
|---|---|---|---|---|---|
| SD1 | Right build | Open the page; look at the tab, the console and the logo's tooltip | The tab shows the P1 icon; the console's version line and the tooltip read the version under test (`-dev` pre-release) |  |  |
| SD2 | Drop and detect | Drag `14_front_portrait_raw_white` onto the page | It loads with four corners on or near the card |  |  |
| SD3 | Corner by mouse and keys | Drag a corner onto the card's corner, press an arrow key twice, then Ctrl+Z | The loupe sits up-right of the cursor and the Result preview updates; the keys nudge the handle; Ctrl+Z moves it back |  |  |
| SD4 | Rotate | Press 2, click the angle and type `1.5`, then Enter | Rotate opens; the photo turns 1.5°, with a grid |  |  |
| SD5 | Crop | Press 3, click 5:4 | The chip reads 4:5 and the box is portrait (it follows the card) |  |  |
| SD6 | Levels | Press 4, **Auto**, hold **C**, then **Apply** | The colors adjust; C shows the photo without levels; Apply clears the dot |  |  |
| SD7 | Overlay | Press 5, **Add logo** with the PNG, click the bottom-right ring | The logo snaps to the bottom-right corner, inside the photo |  |  |
| SD8 | Download | Press 6, **Download**, open the file | `<name>-straight.jpg`; the crop, rotation, levels and logo match the screen; **Next card →** shows |  |  |
| SD9 | Copy | **Copy**, paste into another app | The image pastes |  |  |
| SD10 | Edits round trip | In the side panel, **Save edits**; reload, **Start fresh**; open the same photo, go to Export, **Load edits**, **Download** | The second file looks identical to SD8's, logo included |  |  |
| SD11 | Add back | **Add back**, choose `14_back_portrait_raw_white` | It opens on Perspective; the top bar shows **Front / Back** with Back lit, and the Unpair icon beside it |  |  |
| SD12 | Pair export | Go to Export, look at the photo area; choose **Separately**, **Download** | The preview joins both cards, front on the left; two files arrive, `-front` (with the logo) and `-back` |  |  |
| SD13 | Corner shots | In the side panel's **Corner shots** box choose **4 photos**, **Download corners** | Four close-up files, `-corner-tl`, `-tr`, `-br`, `-bl`, with no logo |  |  |
| SD14 | Resume the pair | Reload, **Resume** | The prompt names both photos; both sides come back, on the side and step you left |  |  |
| SD15 | Narrow window | Narrow the window below 760 px, then widen it | The tab bar at the bottom replaces the top bar's step pill; widening brings the pill back |  |  |
| SD16 | Clean console | Look at the console | No red errors (CSP or otherwise) from the whole pass |  |  |

### Phone
*Setup: iPhone Safari; clear the LAN address's website data in Safari's settings (Advanced → Website Data) first, so no cached build runs. In Photos: a slabbed card's front and back, shot the same way up. A logo saved from an earlier run (or a PNG to upload). If Safari shows a downloaded image in the tab, go Back and tap **Resume**.*

| ID | Test | Steps | Expected | Pre-release (dev.8) | Notes |
|---|---|---|---|---|---|
| SP1 | Open and detect | **Open**, choose the slab's front | It loads and the corners sit on the card; top bar, photo, control area and tab bar, with nothing over the photo and no button text cut off |  |  |
| SP2 | Long-press and drag | Press and hold a corner for 2 s, then drag it | No iOS magnifier or callout; the loupe pins to the top corner away from your finger |  |  |
| SP3 | Nudge and Undo | Tap ▶ twice, then Undo | The handle moves and the loupe stays up; one Undo takes both taps back |  |  |
| SP4 | Tab bar and Rotate | Tap **Rotate** in the tab bar, drag the Straighten ruler | Rotate opens, its tab lit; the photo rotates, with a grid |  |  |
| SP5 | Crop | Tap **Crop** in the tab bar, swipe the preset row, tap 5:4 | The chip reads 4:5 and the box is portrait; the photo is the same height as on Rotate |  |  |
| SP6 | Levels | Tap **Levels**, **Auto**, press and hold the photo, then **Apply** | The colors adjust; the hold shows the photo without levels, with no magnifier; Apply clears the dot |  |  |
| SP7 | Overlay | Tap **Overlay**, **Use saved overlay** (or **Add logo**), pinch on the logo, tap the bottom-right ring | The logo resizes while the photo stays still, then snaps to the corner |  |  |
| SP8 | Right build | Tap **Export**, tap the grabber to open its options sheet, scroll to its end | The last line reads the version under test (`-dev` pre-release); the Source line above it gives the photo's real pixel size |  |  |
| SP9 | Download with upscale | Close the sheet with **✕**, **Download**; if it asks **Upscale to 2000 px?**, tap **Yes** | The image has the crop, levels and logo as on screen; no crash |  |  |
| SP10 | Next card | Look under the readout (after Back and **Resume** if Safari showed the image) | On Export with every edit intact; **Next card →** sits beside **Add back** |  |  |
| SP11 | Add back | **Add back**, choose the slab's back | It opens on Perspective with corners on the card; the top bar fits **Front / Back** and the Unpair icon in one row |  |  |
| SP12 | Corner sheet | Go to Export, tap **Corner shots**, **1 sheet**, **Download corners** (answer **No** if asked) | Export's options sheet opens at the Corner shots box; a 2×2 sheet of this side's corners downloads, with no logo |  |  |
| SP13 | Pair preview and Download | Drag the sheet down to close it; with **Together** chosen, **Download** (answer **No** if asked) | The photo area shows both sides, front first; one joined image downloads, the logo on the front only |  |  |
| SP14 | (HTTPS) Share to Photos | **Share** → Save Image, then open it in Photos | The joined image is in Photos and matches the screen; Safari is still on Export with every edit intact | ➖ |  |
| SP15 | Resume after closing | Swipe Safari away, reopen the page, **Resume** | The prompt names both photos; both sides and their edits come back |  |  |
| SP16 | Unpair | Tap the Unpair icon, **Keep front** | A card over the dimmed photo asks which side to keep; the front stays as a single photo with its edits |  |  |

---

## Sign-off

| Area | Desktop | Phone | Blocking issues |
|---|---|---|---|
| 1. Start and layout | ➖ |  | |
| 2. Navigation | ➖ |  | |
| 5. Crop |  |  | |
| 6. Levels |  |  | |
| 7. Overlay |  |  | |
| 11. Front and back |  |  | |
| 12. Session restore |  |  | |
| 13. Security |  | ➖ | |
| Smoke test (pre-release) | | | |

**Decision (phase 3):** ☐ Phase 3 passed, start phase 4 ☐ Fix first

**Previous: phase 2 (1.10.0-dev.7):** passed.
