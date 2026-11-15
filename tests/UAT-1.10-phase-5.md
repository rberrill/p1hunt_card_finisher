# P1Hunt Card Finisher 1.10, phase 5: UAT script

Phase 5 of the 1.10 redesign: front and back pairs. Front / Back and Unpair in the top bar on every step, the 5:7 lock and its label, Together / Separately on Export, the pair's questions on the card, and Resume of a pair. Run on the dev build, desktop and iPhone: the cases below, then the smoke test. The redesign is released once, after phase 6, so this script has no Live column and no After deploy section.

- **Version under test:** `1.10.0-dev.13` or later. Desktop: the console's first line reads `[card-finisher] v1.10.0-dev.N`. Phone: the line above **Tips** in Export's options sheet.
- **Automated tests first:** `node tests/selftest.js` and `tests/sample-regression.js` must both pass (see `tests/README.md`). Claude runs these, plus the `verify` skill's layout, subfolder and `file://` checks, before handing over a build.
- **IDs** are the permanent IDs from `tests/uat/catalog.md` (`D` Desktop, `P` Phone, `E` Environments, then section.row). 🆕 marks a case added in this phase; ✏️ a case whose steps or Expected were rewritten in this phase to match the plan's frames. Unmarked rows are copied from the catalog unchanged: the pair's existing cases in section 11, and the connected cases in the other sections.
- **One row per behavior, on one device.** A behavior is tested once, on the device that can judge it best; the rest is shared out so both devices exercise every feature. Each row is one flow with one verdict.
- **Recording:** mark each row ✅ pass, ❌ fail or ➖ skipped. For a fail, write what happened in Notes; a screenshot helps.

| Tester | Date | Device / browser | Build (commit or "working copy") |
|---|---|---|---|
| Rich | | Desktop Chrome + iPhone Safari | |

---

## Scope

**New in phase 5** (the plan's frame beside its rows; section 11 is run whole):
- **Add back** is always in Export's bottom row while unpaired, and opens the picker; the open photo becomes the front (F1: D11.1, with P8.3 and P8.5 for the row itself).
- **The back opens on Perspective**, with **Front / Back** in the center of the top bar, Back lit, and the Unpair icon beside it; the front's crop became 5:7 (F2: D11.2, D11.3, P11.1).
- **The switch is in the same place on every step** and keeps the step you're on (F3: P11.2 ✏️). While the other side loads, a toast shows and the switch is dim (F8: P11.2 ✏️).
- **The 5:7 lock.** Every other preset is dim and the label row reads "Pair: 5:7 only" (F4: P11.3); the lock never becomes the remembered preset (D11.17, D11.18). **Swap** turns both sides and isn't an undo step (F5: P11.4, D11.5).
- **Each side keeps its own edits:** its Levels draft, with the tab's dot for the side you're on (F6: P11.19 🆕, D11.6), its logo (F7: D11.11 ✏️) and its undo (D11.4).
- **Export previews Together:** portrait side by side (F9: D11.7, D11.8, P11.5, P11.6 ✏️), landscape stacked, front first (F10: D11.9, P11.13).
- **Separately** is one tap: two files, both sizes in the readout, and no Copy (F12: D11.10, D11.12, D11.25, P11.7 ✏️).
- **During a pair's export** the switch dims with the save buttons (F13: P11.15 ✏️).
- **Next card** shows once both sides are exported in the chosen output, and opens a single photo without asking (F14: D11.13 ✏️, P11.6 ✏️, P11.11).
- **Unpair** is one tap on the icon, then **Keep front / Keep back** on a card, neither in red; a tap outside, Cancel or Escape keeps the pair (F15, F16: P11.8, P11.9, D11.17, D11.26 🆕).
- **A new photo while paired** asks **New photo / Replace front** (or **back**), naming the side you're on: from Open (F17: P11.10, D11.19, D11.20), from a drop, with the same outline as for a single photo (DT8: D11.21 ✏️), and from a paste (D1: D11.27 🆕). On Overlay a drop or a paste becomes the logo, with no question (D11.22, D11.27 🆕).
- **The Upscale question for a pair** is asked once: Together names the joined image's size (U2: D11.23, P11.14), Separately both sides' sizes (U3: D11.24 ✏️).
- **On a wide screen** Front / Back and Unpair sit just before Undo, and a question is a centered card over the dimmed photo while the panel stays readable (DT7: D11.26 🆕).

**Frame D1 is drawn on a phone, but its row is on desktop** (D11.27): an iPhone has no way to paste into the page without a keyboard. The same card on the phone is P11.10's.

**No F11:** the plan's frames skip that number.

**Connected:**
- **One photo in memory** across switches and exports. What a tester can see of it: nothing breaks after several switches and exports of a full-size pair on the phone (P11.15 ✏️, P11.20 🆕).
- **Resume of a pair:** the card (D1.8), both sides, the side and the step (P11.12, and the smoke test's SD14 and SP15), Start fresh (D12.4) and a crafted pair record (D13.11).
- **Session restore** for a single photo (D12.1 to D12.3, P12.1, P12.2, D8.10): a pair saves through the same store.
- **Every incoming photo** goes through the pair's code, paired or not: paste and drop for a single photo (D1.3, D1.6), the logo routes on Overlay (D7.6 to D7.8), and **Next card →** (D8.7, D8.9, P8.6).
- **The question card:** a single photo's Upscale question uses it too (D10.1, D10.3, P10.1), and Safari's bar must stay dark while a card is up (P11.21 🆕).
- **D11.14, D11.15** (Copy and Share on desktop): `localhost` counts as secure, so they run now. **D11.16** (the Save edits hint while paired; frame ED3) runs with the section.

**Full run:** triggered, because the redesign touches every module, but the plan puts it at phase 6 (the release script). Not run in this phase.

**(HTTPS) rows:** P11.16 to P11.18 and the smoke test's SP14. The phone tests over plain HTTP, so they come marked ➖; they run on the live site after the one release, from phase 6's script.

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

Connected: every photo that comes in goes through the pair's code, paired or not, and the Resume card names a pair.

### Desktop
*Setup: no photo open.*

| ID | Test | Steps | Expected | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| D1.3 | Paste | Copy an image, then press Ctrl+V on the page | It loads |  |  |
| D1.6 | Drop on an open photo | With a photo open, drag `IMG_9060` over the photo, then drop it | The same white outline and "Drop to open" over the photo; `IMG_9060` replaces it and opens on Perspective |  |  |
| D1.8 | Resume card for a pair | Open the 14 pair (`14_front_…`, then Export → **Add back** with `14_back_…`), reload | The start screen's Resume card has a drawn thumbnail of two cards, reads "Last photo · just now" over "Resume 14_front_… + 14_back_…?", with **Resume** in red and **Start fresh** beside it |  |  |

### Phone

No cases in this phase.

---

## 7. Overlay

Connected: a drop or a paste is a logo on Overlay and a photo everywhere else. Run these with a single photo, before pairing.

### Desktop
*Setup: a photo open on Overlay, no logo yet. Overlay's options are listed in the panel under its controls.*

| ID | Test | Steps | Expected | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| D7.6 | Drop adds a logo here | Drag a PNG onto the photo | It becomes the logo |  |  |
| D7.7 | Drop elsewhere opens a photo | Go to Crop, drag a PNG onto the photo | It opens as a new photo (then reopen your photo and return to Overlay) |  |  |
| D7.8 | Paste adds a logo | Copy an image, press Ctrl+V | It becomes the logo |  |  |

### Phone

No cases in this phase.

---

## 8. Export

Connected: **Add back** in the bottom row (frame F1), and **Next card →**, which opens through the same picker.

### Desktop
*Setup: `IMG_9136` straightened and cropped, on Export. Export's options and Corner shots are listed in the panel under Export's controls, each under its own heading.*

| ID | Test | Steps | Expected | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| D8.7 | Next card after Copy | Open a new photo, go to Export, **Copy** | **Next card →** appears in Export's bottom row, in white, beside **Add back** and **Corner shots** |  |  |
| D8.9 | Cancel the picker | Click **Next card →**, then cancel the picker | Still on Export with the same photo, and **Next card →** still showing |  |  |
| D8.10 | Resume keeps Next card | Reload, **Resume** | Back on Export with **Next card →** showing |  |  |

### Phone
*Setup: a photo straightened and cropped, on Export. Over the LAN the save row holds **Download** alone (E15.1).*

| ID | Test | Steps | Expected | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| P8.3 | Next card shows after an export | Open a new photo and go to Export; look; then **Download** | Before: **Add back** and **Corner shots** share the bottom row. After: a white toast gives the exported size and time, and **Next card →** joins the row in white, all three labels whole |  |  |
| P8.5 | A note keeps the row | Leave a Levels change unapplied, go to Export, look, then **Download** | Under the readout, with an amber mark: "Levels has unapplied changes; export uses the applied levels." **Add back** and **Corner shots** stay in the bottom row; after the Download **Next card →** joins them and the note is still there |  |  |
| P8.6 | Next card opens a new photo | Tap **Next card →**, choose a raw card photo | iOS offers Photo Library, Take Photo and Choose File; the photo opens on Perspective with the corners on the card, no levels, and the same crop preset and size as before |  |  |

---

## 10. Upscale question

Connected: a single photo's question is asked on the same card as the pair's. The pair's own (U2, U3) are D11.23, D11.24 and P11.14.

### Desktop
*Setup: `14_front_portrait_raw_white` on Export at JPEG, 2000; its crop is under 2000 px, so the readout says "full crop, not upscaled".*

| ID | Test | Steps | Expected | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| D10.1 | Download asks | Click **Download** | A card centered over the dimmed photo: **Upscale to 2000 px?**, "The crop is W × H px at the photo’s resolution.", **Yes** in red, **No** and **Cancel**; the panel beside it stays readable |  |  |
| D10.3 | No and Cancel | **Download**, **No**; **Download**, **Cancel**; then **Download** and click the dimmed photo outside the card | No saves the file at the readout's size; Cancel and the click outside each close the card, and nothing downloads |  |  |

### Phone
*Setup: a photo whose crop is under 2000 px (the readout says "full crop, not upscaled"; `14_front_portrait_raw_white` AirDropped always is), on Export.*

| ID | Test | Steps | Expected | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| P10.1 | Download asks | **Download**, then tap the dimmed photo outside the card | A card over the dimmed photo: **Upscale to 2000 px?**, the crop's real size, **Yes** in red, **No** and **Cancel**; the control area below doesn't move. The tap outside closes it and nothing is saved |  |  |

---

## 11. Front and back

AC numbers here refer to the Front + Back Pairing page in Claude. The whole section, in the catalog's order, so each row carries on from the one above it.

### Desktop
*Setup: the 14 pair (`14_front_portrait_raw_white`, `14_back_portrait_raw_white`), `13_front_landscape_onetouch_labeled_white` as a third photo, and a transparent PNG logo.*

| ID | Test | Steps | Expected | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| D11.1 | Add back opens the picker | Open `14_front_portrait_raw_white`, go to Export, click **Add back**, then cancel the picker | The picker opens and nothing downloads; after the cancel it's the same photo's Export, with no **Front / Back** in the top bar and the crop unchanged (AC2) |  |  |
| D11.2 | The back starts like a new photo | **Add back** again and choose `14_back_portrait_raw_white` | It opens on Perspective with the corners on the card and no levels; the top bar shows **Front / Back** with Back lit white, and the Unpair icon beside it (AC3, AC4) |  |  |
| D11.3 | The front became 5:7 | Go to Crop, click **Front** | The front, also on Crop, with its box 5:7 and fitted to the card (AC2, AC5) |  |  |
| D11.4 | Undo is per side | Rotate the front 1°, click **Back**, press Ctrl+Z | The back's last change is undone; the front keeps its 1° (AC5) |  |  |
| D11.5 | Swap isn't an undo step | On Crop, click the **Swap** tool, then press Ctrl+Z | The crop stays landscape (AC8) |  |  |
| D11.6 | Edits stay separate | **Swap** back. On the back, **Auto** levels and **Apply**, then click **Front** | The front has no levels (AC9) |  |  |
| D11.7 | Output control and preview | Go to Export | A two-part **Together / Separately** control beside the readout, Together in white; the readout gives the joined image's size and the format; no **Add back** in the bottom row; the photo area shows both cards, front on the left, a thin line in the fill colour between them, no border (AC10, AC11, AC13) |  |  |
| D11.8 | Together download | **Download**, open the file | One `<front>-pair.jpg` at the readout's size, matching the preview (AC11) |  |  |
| D11.9 | Landscape stacks | On Crop, **Swap**; on Export, **Download** | The front is on top and the back below (AC11) |  |  |
| D11.10 | Separately | **Swap** back. Click **Separately**, **Download**, open both files | `<front>-front.jpg` and `<back>-back.jpg` (Chrome may ask once to allow several downloads), each with its side's framing and levels as on screen (AC12) |  |  |
| D11.11 ✏️ | Each side has its own logo | Add a logo on the back's Overlay step, click **Front** and look; then choose Together and **Download** | The front opens on Overlay too, with no logo placed (the saved one is only offered); in the file the logo is on the back's half only (AC11) |  |  |
| D11.12 | Format applies to both | Choose PNG on the back, click **Front**, go to Export | PNG is chosen there too (AC10) |  |  |
| D11.13 ✏️ | Next card follows both sides and the output | Choose JPEG, **Download**; click **Separately**, then **Together**; then click **Back**, drag the Straighten ruler on Rotate, go to Export | **Next card →** shows after the Download, goes with Separately (that output isn't exported yet) and is back with Together; it is gone after the edit to the other side (AC16) |  |  |
| D11.14 | Copy the Together image | **Copy**, paste into another app | The joined image pastes (AC14) |  |  |
| D11.15 | Share both files | Choose Separately, **Share** | One share dialog holding both images (AC14) |  |  |
| D11.16 | Save edits saves this side | In the panel's Export options, read the hint under **Save edits** and **Load edits**, then **Save edits** | The hint starts "Saves the side you're on."; the file is the back's (AC20) |  |  |
| D11.17 | Keep front | On the back, click the Unpair icon, **Keep front**, then go to Crop | The front, as a single photo framed 5:7; **Front / Back** and the Unpair icon are gone from the top bar; every preset can be picked again (AC6) |  |  |
| D11.18 | Remembered preset unchanged | Open a new photo, go to Crop | It starts at the preset you used before pairing, not 5:7 (AC7) |  |  |
| D11.19 | Replace the side | Pair the 14 photos again, **Open** `13_front_landscape_onetouch_labeled_white`, **Replace back** | The third photo is now the back; the front is unchanged (AC17) |  |  |
| D11.20 | New photo ends the pair | **Open** another photo, **New photo** | It opens as a single photo; no **Front / Back** in the top bar (AC17) |  |  |
| D11.21 ✏️ | Drop asks | Pair again, drag a photo over the photo area, then drop it | While it's over the photo, the white dashed outline reads "Drop to open", as for a single photo. Dropped, a card over the dimmed photo, titled **New photo**, asks **New photo · Replace back · Cancel**, neither choice in red (AC17) |  |  |
| D11.22 | Drop on Overlay adds a logo | **Cancel**. On Overlay, drag a PNG onto the photo | It becomes the logo, with no question (AC17) |  |  |
| D11.23 | Upscale: Together | Choose Together and **2000**, **Download**, **Yes**, open the file | The card says "The image is W × H px at the photos’ resolution."; the file's long edge is exactly 2000 px, both sides enlarged alike with the gutter between them |  |  |
| D11.24 ✏️ | Upscale: Separately | Choose Separately, **Download**, look, then **Yes** | One card for both files, asked once: "The front is W × H px and the back W × H px at the photos’ resolution."; `-front` and `-back` each have a 2000 px long edge |  |  |
| D11.25 | Copy hides for Separately | With **Separately** chosen, look at the save row, then click **Together** | Separately: **Share** and **Download** only, with no **Copy** (a clipboard holds one image). Together: **Copy** is back |  |  |
| D11.26 🆕 | A pair on a wide screen | Go to Crop and look at the top bar; click the Unpair icon, look, click **Swap** in the panel, then press Escape | The top bar reads, left to right: the app's name, **Open**, the steps, then **Front / Back** and the Unpair icon just before Undo, Redo and **Fit**. The card (**Unpair**, "Keep one side as a single photo.", **Keep front · Keep back · Cancel**) is centered over the dimmed photo; the panel beside it isn't dimmed and stays readable, but the click on Swap does nothing; Escape closes the card, still paired (AC6) |  |  |
| D11.27 🆕 | Paste asks, naming the side | Click **Front** and go to Rotate. Copy an image, press Ctrl+V; **Cancel**; then go to Overlay and press Ctrl+V again | On Rotate the same card asks **New photo · Replace front · Cancel**: Replace names the side you're on. On Overlay the pasted image becomes the front's logo, with no question (AC17) |  |  |

### Phone
*Setup: in Photos, the 14 pair (a raw card's front and back) and the 13 pair (a landscape card), full-size originals if you have them, else the AirDropped copies.*

| ID | Test | Steps | Expected | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| P11.1 | Top bar fits | Open `14_front_portrait_raw_white`, go to Export, **Add back**, choose `14_back_portrait_raw_white`; look at the top bar on Perspective, then pinch to zoom the photo | Open, **Front / Back**, the Unpair icon, Undo and Redo in one row; zoomed, Fit joins them, still in one row; nothing cut off (AC4) |  |  |
| P11.2 ✏️ | Switch on every step | Tap **Front**; go to Rotate and tap **Back**; then switch again on Crop and on Levels, watching the photo as each switch starts | **Front / Back** sits in the center of the top bar on every step, and each tap opens the other side on the step you were on. While that side loads, a white toast reads "Opening the back…" (or "front") and the switch and the Unpair icon are dim; both clear once it is up (with the 3 MP copies it may be too quick to see). Note how long a switch takes (judge speed on the live site; over the LAN it is slower) (AC5) |  |  |
| P11.3 | Crop is locked to 5:7 | Go to Crop, then tap another preset | Every preset but **5:7 card** is dimmed and the tap picks nothing; the row rests scrolled to 5:7 card, and the label row reads "Pair: 5:7 only" beside the size (AC7) |  |  |
| P11.4 | Swap turns both sides | Tap the **Swap** tool, then tap **Front** | Both sides are landscape (AC8) |  |  |
| P11.5 | Export fits | **Swap** back. Go to Export | The Size and Format row as for a single photo; a two-part **Together / Separately** control beside the readout, Together in white, with both labels and the readout whole (while Levels has an unapplied draft its note takes the readout's place there, whole, until the draft is applied or discarded); no **Add back**, so **Corner shots** has the bottom row; the photo area shows the joined image, front on the left, the same height as on other steps (AC10, AC13) |  |  |
| P11.6 ✏️ | Together Download | **Download** | One joined image, `<front>-pair`; a white toast reads "Exported the Together image in N s." and **Next card →** joins **Corner shots** in the bottom row, in white (AC11, AC16) |  |  |
| P11.7 ✏️ | Separately Download | Tap **Separately**, look at the readout, then **Download** | The readout gives both sides' sizes (W × H + W × H px and the format), whole, beside the control; **Next card →** goes until this output is exported. Note whether both files arrive; Safari may show only the first (AC12) |  |  |
| P11.8 | Unpair asks on a card | Tap the Unpair icon beside **Front / Back**, then tap the dimmed photo outside the card | A card over the dimmed photo, titled **Unpair**, asks **Keep front · Keep back · Cancel**, with neither choice in red; the controls below don't move; the tap outside closes it, still paired (AC6) |  |  |
| P11.9 | Keep the back | Tap the Unpair icon, **Keep back** | The back, as a single photo; **Front / Back** is gone from the top bar (AC6) |  |  |
| P11.10 | Open asks | Pair the 14 photos again, **Open** `13_front_landscape_onetouch_labeled_white` | A card over the dimmed photo, titled **New photo**, asks **New photo · Replace back · Cancel**, with neither choice in red (AC17) |  |  |
| P11.11 | Next card after the pair's export | **Cancel**, **Download**, then **Next card →**, choose a photo | It opens as a single photo without asking (AC16) |  |  |
| P11.12 | Closed tab resumes the pair | Pair two photos, swipe Safari away, reopen, **Resume** | The prompt names both photos; both sides come back, on the side and step you left (AC18) |  |  |
| P11.13 | A landscape pair stacks without Swap | Pair the 13 photos, go to Export | The joined preview is stacked, front on top, both sides 7:5: the crop follows the card (AC11) |  |  |
| P11.14 | Upscale: Together | Pair the 14 photos, choose Together and **2000**, **Download**, **Yes** | The card asks **Upscale to 2000 px?**, **Yes** in red, with the joined image's size; Yes completes without a crash; note the time |  |  |
| P11.15 ✏️ | Large pair | Pair your two largest photos (48 MP if you have them), Together at Original size, **Download** | While it exports, a thin red line grows along the control area's top edge, and **Front / Back**, the Unpair icon and the save row are dim; all clear when the file is saved. It completes without a crash (AC19) |  |  |
| P11.16 | (HTTPS) Share Together to Photos | Choose Together, **Share**, Save Image | The joined image lands in Photos (AC14) | ➖ |  |
| P11.17 | (HTTPS) Share both sides | Choose Separately, **Share**, Save 2 Images | Both land in Photos (AC14) | ➖ |  |
| P11.18 | (HTTPS) Share now after a slow render | At Original size, **Share**; if **Share now** shows, tap it | The share sheet opens with the pair's files (AC14) | ➖ |  |
| P11.19 🆕 | Levels draft is per side | With a pair open, go to Levels on the back, tap **Auto** (no Apply), tap **Front**, then **Back** | Front: no dot on the Levels tab, **Discard** and **Apply** dim, its colors unchanged. Back again: its draft is still there, with the dot and both buttons lit. The dot is for the side you're on (AC9) |  |  |
| P11.20 🆕 | Switches and exports in a row | With your two largest photos paired (as in P11.15), tap **Back**, **Front**, **Back**; **Download** again; tap **Separately**, **Download**; then tap **Front** | Every switch opens the right side with its own edits, and each export completes. Safari never reloads the page, and no amber toast says the photo isn't loaded: one full-size photo is held at a time (AC19) |  |  |
| P11.21 🆕 | Safari's bar keeps its color under a question | In a Safari tab with a pair open, tap the Unpair icon and look at Safari's address bar at the bottom; **Cancel**; on Export tap **Download** and, if a card asks **Upscale to N px?**, look again; **Cancel** | Safari's bar stays dark, as on every other screen, with each card up. It never turns red or lighter |  |  |

---

## 12. Session restore

### Desktop
*Setup: a photo open.*

| ID | Test | Steps | Expected | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| D12.1 | Resume | Edit on several steps, leave a Levels change unapplied, reload, **Resume** | The start screen's card reads "Last photo · just now" over "Resume <name>?" with **Resume** and **Start fresh**; Resume brings back the same photo, edits and step, the corners unmoved, the Levels change still unapplied with its dot, and no "reset" notice |  |  |
| D12.2 | Start fresh | Reload, **Start fresh**, reload again | No prompt the second time |  |  |
| D12.3 | Latest photo wins | Open photo A and edit it, open photo B, reload | The prompt names photo B |  |  |
| D12.4 | A pair's Start fresh clears both | Pair two photos, reload (the prompt reads "Resume <front> + <back>?"), **Start fresh**, reload again | No prompt the second time (AC18) |  |  |

### Phone
*Setup: a photo open.*

| ID | Test | Steps | Expected | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| P12.1 | Closed tab | Edit a photo and place a logo, swipe Safari away, reopen the page, **Resume** | The Resume prompt appears; the photo, edits, step and logo all come back |  |  |
| P12.2 | Switching apps | Edit a photo, switch to Photos for a minute, come back | Either still open as you left it, or the Resume prompt restores it |  |  |

---

## 13. Security

### Desktop
*Setup: DevTools open on the Console tab. These use harmless test text. The safe ranges themselves are tested by `tests/selftest.js`; these rows check the app acts on them.*

| ID | Test | Steps | Expected | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| D13.11 | A crafted pair record is reset | Pair two photos. DevTools → Application → IndexedDB → `p1hunt-finisher` → `session` → `pair`: change `orient` to `<b>x</b>`; reload, **Resume** | The open side resumes alone, with a notice that the saved pair was reset (AC21) |  |  |

### Phone

No cases in this phase.

---

## Smoke test

Run on both devices after the sections above. Copied from `tests/uat/smoke.md`, unchanged in this phase. The pair is rows SD11, SD12 and SD14 on desktop and SP11 to SP16 on the phone. There is no Live column: the redesign is released once, after phase 6.

### Desktop
*Setup: Chrome with DevTools open on the Console tab, in a window wider than 760 px. The 14 pair from `samples/` (`14_front_portrait_raw_white`, `14_back_portrait_raw_white`) and a transparent PNG logo to hand. When a Download or Copy asks **Upscale to 2000 px?**, answer **No**.*

| ID | Test | Steps | Expected | Pre-release (dev.13) | Notes |
|---|---|---|---|---|---|
| SD1 | Right build | Open the page; look at the tab, the console and the logo's tooltip | The tab shows the P1 icon; the console's version line and the tooltip read the version under test (`-dev` pre-release) |  |  |
| SD2 | Drop and detect | Drag `14_front_portrait_raw_white` onto the page | It loads with four corners on or near the card |  |  |
| SD3 | Corner by mouse and keys | Drag a corner onto the card's corner, press an arrow key twice, then Ctrl+Z | The loupe sits up-right of the cursor and the Result preview updates; the keys nudge the handle; Ctrl+Z moves it back |  |  |
| SD4 | Rotate | Press 2, click the angle and type `1.5`, then Enter | Rotate opens; the photo turns 1.5°, with a grid |  |  |
| SD5 | Crop | Press 3, click 5:4 | The chip reads 4:5 and the box is portrait (it follows the card) |  |  |
| SD6 | Levels | Press 4, **Auto**, hold **C**, then **Apply** | The colors adjust; C shows the photo without levels; Apply clears the dot |  |  |
| SD7 | Overlay | Press 5, **Add logo** with the PNG, click the bottom-right ring | The logo snaps to the bottom-right corner, inside the photo |  |  |
| SD8 | Download | Press 6, **Download**, open the file | `<name>-straight.jpg`; the crop, rotation, levels and logo match the screen; **Next card →** joins Export's bottom row in white |  |  |
| SD9 | Copy | **Copy**, paste into another app | The image pastes |  |  |
| SD10 | Edits round trip | In the panel's Export options, **Save edits**; reload, **Start fresh**; open the same photo, go to Export, **Load edits**, **Download** | The second file looks identical to SD8's, logo included |  |  |
| SD11 | Add back | **Add back**, choose `14_back_portrait_raw_white` | It opens on Perspective; the top bar shows **Front / Back** with Back lit, and the Unpair icon beside it |  |  |
| SD12 | Pair export | Go to Export, look at the photo area; click **Separately** beside the readout, **Download** | The preview joins both cards, front on the left; **Copy** leaves the save row; two files arrive, `-front` (with the logo) and `-back` |  |  |
| SD13 | Corner shots | In the panel's **Corner shots** section click **4 photos**, **Download corners** | Four close-up files, `-corner-tl`, `-tr`, `-br`, `-bl`, with no logo |  |  |
| SD14 | Resume the pair | Reload, **Resume** | The prompt names both photos; both sides come back, on the side and step you left |  |  |
| SD15 | Narrow window | Narrow the window below 760 px, then widen it | The tab bar at the bottom replaces the top bar's step pill; widening brings the pill back |  |  |
| SD16 | Clean console | Look at the console | No red errors (CSP or otherwise) from the whole pass |  |  |

### Phone
*Setup: iPhone Safari; clear the LAN address's website data in Safari's settings (Advanced → Website Data) first, so no cached build runs. In Photos: a slabbed card's front and back, shot the same way up. A logo saved from an earlier run (or a PNG to upload). If Safari shows a downloaded image in the tab, go Back and tap **Resume**.*

| ID | Test | Steps | Expected | Pre-release (dev.13) | Notes |
|---|---|---|---|---|---|
| SP1 | Open and detect | **Open**, choose the slab's front | It loads and the corners sit on the card; top bar, photo, control area and tab bar, with nothing over the photo and no button text cut off |  |  |
| SP2 | Long-press and drag | Press and hold a corner for 2 s, then drag it | No iOS magnifier or callout; the loupe pins to the top corner away from your finger |  |  |
| SP3 | Nudge and Undo | Tap ▶ twice, then Undo | The handle moves and the loupe stays up; one Undo takes both taps back |  |  |
| SP4 | Tab bar and Rotate | Tap **Rotate** in the tab bar, drag the Straighten ruler | Rotate opens, its tab lit; the photo rotates, with a grid |  |  |
| SP5 | Crop | Tap **Crop** in the tab bar, swipe the preset row, tap 5:4 | The chip reads 4:5 and the box is portrait; the photo is the same height as on Rotate |  |  |
| SP6 | Levels | Tap **Levels**, **Auto**, press and hold the photo, then **Apply** | The colors adjust; the hold shows the photo without levels, with no magnifier; Apply clears the dot |  |  |
| SP7 | Overlay | Tap **Overlay**, **Use saved overlay** (or **Add logo**), pinch on the logo, tap the bottom-right ring | The logo resizes while the photo stays still, then snaps to the corner |  |  |
| SP8 | Right build | Tap **Export**, tap the grabber to open its options sheet | Export's four rows fit the control area with nothing cut off. In the sheet the line above **Tips** reads the version under test (`-dev` pre-release); the Source line above it gives the photo's real pixel size |  |  |
| SP9 | Download with upscale | Close the sheet with **✕**, **Download**; if a card asks **Upscale to 2000 px?**, tap **Yes** | The image has the crop, levels and logo as on screen; no crash |  |  |
| SP10 | Next card | Look at Export's bottom row (after Back and **Resume** if Safari showed the image) | On Export with every edit intact; **Next card →** sits in white beside **Add back** and **Corner shots** |  |  |
| SP11 | Add back | **Add back**, choose the slab's back | It opens on Perspective with corners on the card; the top bar fits **Front / Back** and the Unpair icon in one row |  |  |
| SP12 | Corner sheet | Go to Export, tap **Corner shots**, **1 sheet**, **Download corners** (answer **No** if asked) | The Corner shots sheet opens over the lower part of the photo; a 2×2 sheet of this side's corners downloads, with no logo, and the toast that says so sits above the sheet |  |  |
| SP13 | Pair preview and Download | Drag the sheet down to close it; with **Together** white beside the readout, **Download** (answer **No** if asked) | The photo area shows both sides, front first; one joined image downloads, the logo on the front only |  |  |
| SP14 | (HTTPS) Share to Photos | **Share** → Save Image, then open it in Photos | The joined image is in Photos and matches the screen; Safari is still on Export with every edit intact | ➖ |  |
| SP15 | Resume after closing | Swipe Safari away, reopen the page, **Resume** | The prompt names both photos; both sides and their edits come back |  |  |
| SP16 | Unpair | Tap the Unpair icon, **Keep front** | A card over the dimmed photo asks which side to keep; the front stays as a single photo with its edits |  |  |

---

## Sign-off

| Area | Desktop | Phone | Blocking issues |
|---|---|---|---|
| 1. Start and layout |  | ➖ | |
| 7. Overlay |  | ➖ | |
| 8. Export |  |  | |
| 10. Upscale question |  |  | |
| 11. Front and back |  |  | |
| 12. Session restore |  |  | |
| 13. Security |  | ➖ | |
| Smoke test (pre-release) | | | |

**Decision (phase 5):** ☐ Phase 5 passed ☐ Fix first

**Previous: phase 4 (1.10.0-dev.12):** passed.
