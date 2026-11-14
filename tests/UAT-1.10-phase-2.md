# P1Hunt Card Finisher 1.10, phase 2: UAT script

Phase 2 of the 1.10 redesign: the new shell (top bar, control area with its grabber and options sheet, tab bar, start screen, the desktop frame) and the rebuilt Perspective and Rotate. Run on the dev build, desktop and iPhone: the cases below, then the smoke test. The redesign is released once, after phase 6, so this script has no Live column and no After deploy section.

- **Version under test:** `1.10.0-dev.7` or later. Desktop: the console's first line reads `[card-finisher] v1.10.0-dev.N`. Phone: the last line of Export's options sheet.
- **Automated tests first:** `node tests/selftest.js` and `tests/sample-regression.js` must both pass (see `tests/README.md`). Claude runs these, plus the `verify` skill's layout, subfolder and `file://` checks, before handing over a build.
- **IDs** are the permanent IDs from `tests/uat/catalog.md` (`D` Desktop, `P` Phone, `E` Environments, then section.row). 🆕 marks a case for behavior new in this phase; ✏️ a case whose behavior changed in this phase. Unmarked rows are connected cases, copied from the catalog unchanged.
- **One row per behavior, on one device.** A behavior is tested once, on the device that can judge it best; the rest is shared out so both devices exercise every feature. Each row is one flow with one verdict.
- **Recording:** mark each row ✅ pass, ❌ fail or ➖ skipped. For a fail, write what happened in Notes; a screenshot helps.

| Tester | Date | Device / browser | Build (commit or "working copy") |
|---|---|---|---|
| Rich | | Desktop Chrome + iPhone Safari | |

---

## Scope

**New in phase 2:**
- **The phone's shell.** A top bar (Open, Undo, Redo; Fit only while zoomed or panned), the photo, a 200 px control area with a grabber, and a six-step tab bar; the header, step menu, "next step →" buttons and More options bar are gone (P1.2 ✏️, P1.3 ✏️, P1.7 🆕, P2.6 🆕). The unapplied-Levels dot moves to the Levels tab (P2.3 ✏️).
- **Options sheets.** Tap the grabber or drag it up to open the step's options over the lower half of the photo; drag down, tap outside, ✕ or Escape closes it (P2.7 🆕, P2.8 🆕, D2.5 🆕). Crop, Levels, Overlay and Export keep their old controls, and their old More options content is in their sheet for now (P2.9 🆕); Fill outside photo has moved to Export's.
- **Start screen.** No bars on the phone until a photo is open, the app icon, and the Resume card with its thumbnail (P1.1 ✏️, P1.6 🆕, D1.1 ✏️, D1.8 🆕).
- **Desktop frame.** The steps as a pill in the top bar with the app's name and Open, Fit always shown, a 380 px panel with the options inline and the Result preview on Perspective, and a white drop outline that says what a drop does (D1.2 ✏️, D1.4 ✏️, D1.6 🆕, D1.7 🆕, D2.1 ✏️, D2.2 ✏️, D2.3 🆕, D2.4 🆕).
- **Perspective rebuilt.** Label row, control row and tool row (Nudge, Flatten, Candidate, Snap, Preview); status messages in the label row, Tap to find card's Cancel, the new options sheet and Tips (D3.5–D3.8 ✏️, D3.10 ✏️, D3.11–D3.13 🆕, P3.4 ✏️, P3.5 ✏️, P3.7 ✏️, P3.11–P3.15 ✏️, P3.16–P3.18 🆕).
- **Rotate rebuilt.** The Straighten ruler, a typed angle that lifts above the phone's keyboard with ± and Done, Flip as a mode, 90° left and right, Fill frame as a switch, and the options sheet (D4.1 ✏️, D4.2 ✏️, D4.3 🆕, D4.4 🆕, P4.1–P4.4 ✏️, P4.5 🆕).
- **Rich's note:** in a Safari tab, the tab bar and the grabber against Safari's own bar at the bottom (P1.8 🆕).

**Connected:**
- P1.4 (turning the phone): every layout rule changed.
- D3.2, P3.1 (the loupe and the Result preview): the photo area and the panel around them are new.
- D3.3 (arrow keys), P3.3 (double-tap zoom): their handlers moved into the rebuilt step, and Fit now appears while zoomed.
- D3.9, P3.8 (undo of a corner drag and of a burst of nudges): Undo moved to the top bar.
- D12.1, P12.1, P11.12 (Resume brings back the photo, the step and, for a pair, the side): the start screen and the step switching are new.

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

### Desktop
*Setup: no photo open.*

| ID | Test | Steps | Expected | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| D1.1 ✏️ | Start screen and Open | Open the page, then **Open** `IMG_9136` | The top bar shows the app's name, the six steps dimmed and an **Open** button; the start screen shows the app icon over "Finish a card photo"; the photo then loads and the steps light up |  |  |
| D1.2 ✏️ | Drag and drop | Drag a photo file over the photo area, then drop it | While it's over the area, a white dashed outline reads "Drop to open"; the photo loads |  |  |
| D1.4 ✏️ | Wide layout | Look at the screen with a photo open | The top bar holds the app's name, the steps as one pill, **Open**, **Fit**, Undo and Redo; a 380 px panel on the right holds the step's controls with its options listed under them (no grabber, no sheet); no tab bar at the bottom |  |  |
| D1.6 🆕 | Drop on an open photo | With a photo open, drag `IMG_9060` over the photo, then drop it | The same white outline and "Drop to open" over the photo; `IMG_9060` replaces it and opens on Perspective |  |  |
| D1.7 🆕 | Drop outline on Overlay | Go to Overlay, drag a PNG logo over the photo, then drop it | The outline reads "Drop to add as the logo"; the PNG becomes the logo and the photo stays |  |  |
| D1.8 🆕 | Resume card for a pair | Open the 14 pair (`14_front_…`, then Export → **Add back** with `14_back_…`), reload | The start screen's Resume card has a drawn thumbnail of two cards, reads "Last photo · just now" over "Resume 14_front_… + 14_back_…?", with **Resume** in red and **Start fresh** beside it |  |  |

### Phone
*Setup: no photo open.*

| ID | Test | Steps | Expected | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| P1.1 ✏️ | Start screen and Open | Open the page, look, then tap **Open photo** and choose a photo from Photos | No top bar or tab bar on the start screen: the app icon, "Finish a card photo" and a red **Open photo**. While it loads, "Loading…" sits at the bottom of the photo area; then the bars arrive and the corners are detected |  |  |
| P1.2 ✏️ | Phone layout | Look at the screen | Top bar (Open on the left, Undo and Redo on the right, no Fit), the photo, the control area with a grabber pill on its top edge, then the tab bar with six steps. Nothing overlaps the photo |  |  |
| P1.3 ✏️ | Every step fits | Tap each of the six tabs in turn | The photo is the same height on every step; the tab you're on is lit; no tab label or button text is cut off; the tab bar clears the home indicator. On Crop, Levels, Overlay and Export the control area scrolls for now |  |  |
| P1.4 | Turn the phone | Rotate to landscape and back | Nothing breaks; the layout recovers |  |  |
| P1.6 🆕 | Resume card | Edit the photo, wait a few minutes, reload the page | The Resume card has a drawn thumbnail, reads "Last photo · N min ago" over "Resume <name>?", with **Resume** in red, **Start fresh** beside it and **Open photo** below in grey; still no bars |  |  |
| P1.7 🆕 | Fit in the top bar | **Resume**, pinch to zoom in, tap **Fit** | **Fit** appears in the top bar once the photo is zoomed or panned; the tap fits the photo and **Fit** goes again |  |  |
| P1.8 🆕 | Safari's bar | In a Safari tab with its address bar at the bottom, look at the tab bar and the grabber, then tap each tab and the grabber | Safari's floating bar covers neither: every tab and the grabber take the tap on the first try, and their labels are readable. If they collide, note how much is hidden (the fallback is more bottom padding, at the photo's expense) |  |  |

---

## 2. Navigation

### Desktop
*Setup: a photo open.*

| ID | Test | Steps | Expected | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| D2.1 ✏️ | Steps and number keys | Look at the steps in the top bar, then press 1 to 6 | Perspective, Rotate, Crop, Levels, Overlay, Export, in that order; each key opens its step and the pill marks it |  |  |
| D2.2 ✏️ | Narrow and wide | Narrow the window below 760 px, then widen it again | Narrow: the steps move to a tab bar at the bottom, the panel goes, the control area sits under the photo with a grabber, and **Fit** shows only while zoomed. Wide: the pill and the panel come back, the options listed inline |  |  |
| D2.3 🆕 | Undo and Redo in the top bar | On Rotate click the angle, type `2` and press Enter, press 3 for Crop, click Undo, then Redo; then press Ctrl+Z and Ctrl+Y | Redo is dimmed until you undo. Undo takes the 2° back and Redo restores it, from Crop; the keys do the same |  |  |
| D2.4 🆕 | Fit on desktop | Look at the top bar, zoom in with the mouse wheel, click **Fit**; zoom again and press F | **Fit** is shown at all times on desktop; both fit the photo to the screen |  |  |
| D2.5 🆕 | Escape closes the sheet | Narrow the window below 760 px, click the grabber, then press Escape | The step's options sheet opens, then closes |  |  |

### Phone
*Setup: a photo open.*

| ID | Test | Steps | Expected | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| P2.3 ✏️ | Unapplied Levels dot | Make a Levels change without Apply, then tap other tabs | A dot on the Levels tab, on every step |  |  |
| P2.6 🆕 | Tab bar | From Perspective, tap **Crop**, then **Rotate** | One tap opens each step; the tab you're on is lit and the others dim |  |  |
| P2.7 🆕 | Grabber opens the sheet | On Perspective, tap the grabber; close the sheet with ✕; then drag the grabber up slowly and stop halfway | Both open "Perspective options" over the lower half of the photo, with the top of the photo still in view. While dragging, the sheet rises from the control area's top edge under your finger and there is one grabber on screen, never two. On Export the grabber is whole, not cut off |  |  |
| P2.8 🆕 | The sheet closes | Open the sheet and drag it down; open it and tap the photo above it; open it and tap ✕ | Each closes it; the tap on the photo moves no corner |  |  |
| P2.9 🆕 | Every step has its options | On each of the six steps, open the sheet and scroll it | Each opens with that step's title. Perspective's and Rotate's are new (rows P3.13, P4.5); Crop, Levels, Overlay and Export hold their old More options content, and Export's now includes **Fill outside photo** |  |  |

---

## 3. Perspective

### Desktop
*Setup: `IMG_9136` open on Perspective. Perspective's options are listed in the panel under its controls.*

| ID | Test | Steps | Expected | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| D3.2 | Drag a corner | Drag a corner handle | The handle follows the mouse; the loupe sits up-right of the cursor; the Result mini-preview updates live |  |  |
| D3.3 | Arrow-key nudge | Click a handle, press the arrow keys, then Shift+arrows | It moves 1 px per press, then 10 px |  |  |
| D3.5 ✏️ | Invalid shape | Drag one corner across the opposite edge | The outline turns dashed red and the label row reads "Corners cross or fold inward. Drag them back into a convex shape." with a red icon; nothing breaks |  |  |
| D3.6 ✏️ | Candidate | Open `IMG_9060`, click the **Candidate** tool until it reads 2/3 | The tool shows which candidate you're on and the confidence at the right of the label row updates; the 2nd candidate is the card (the 1st catches the stand edge) |  |  |
| D3.7 ✏️ | Find card arms | Open `IMG_9136`. In the panel's options click **Tap to find card**, move the mouse over the photo, then drag the photo | The label row reads "Tap the card in the photo." with a **Cancel** button, and the cursor is a crosshair; the drag pans without moving the corners or cancelling |  |  |
| D3.8 ✏️ | Click finds the card | Drag a corner well off the card, click **Tap to find card**, then click the card | The corners land back on the card at once; the label row is back to Nudge with the confidence, and nothing is drawn where you clicked |  |  |
| D3.9 | One Undo | Ctrl+Z | The corners go back to where you dragged them |  |  |
| D3.10 ✏️ | Cancel | Click **Tap to find card**, then **Cancel** in the label row, then click the photo | One click on Cancel removes the prompt; the click on the photo moves no corner |  |  |
| D3.11 🆕 | Nothing detected | Open a photo with no card in it (a plain desk or wall) | Corners start inset; the label row reads "Nothing detected. Drag the corners into place." with an amber icon; **Candidate** is dimmed |  |  |
| D3.12 🆕 | No card found | Click **Tap to find card**, then click the empty photo | An amber toast: "No card-shaped edges found. Drag the corners into place, or tap to find card and tap the card again."; the corners don't move |  |  |
| D3.13 🆕 | Keys in the tips | Open **Tips and keys** in the panel's options | Perspective's four tips, then its keyboard keys (arrows and Shift+arrows nudge, Tab and Shift+Tab pick the handle) |  |  |

### Phone
*Setup: a photo open on Perspective.*

| ID | Test | Steps | Expected | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| P3.1 | Loupe away from the finger | Drag a corner with your finger on the right half of the photo, then on the left half | The loupe pins to the top-left, then the top-right; never under your finger |  |  |
| P3.3 | Double-tap zoom | Double-tap a corner, then double-tap it again | Zooms 6× with the corner centered, then back to fit |  |  |
| P3.4 ✏️ | Nudge taps | Look at the control area, then tap ▶ three times, a second or two apart | The **Nudge** tool is lit; the label row reads "Nudge · Corner 1 of 4" with the confidence at its right; the arrows and **Next handle** share the row below. The handle moves a little each tap; the loupe stays up between taps and for about 4 s after the last |  |  |
| P3.5 ✏️ | Loupe hides on other touch | Tap ▲, then within 4 s tap the **Flatten** tool | The loupe hides immediately |  |  |
| P3.7 ✏️ | Next handle | Tap **Nudge**, then **Next handle** repeatedly | The label row counts through Corner 1 to 4 of 4 and Edge 1 to 4 of 4, with the loupe showing each |  |  |
| P3.8 | Nudges undo together | Make a burst of nudges, then tap Undo once | The whole burst undoes in one step |  |  |
| P3.11 ✏️ | Flatten | Tap the **Flatten** tool, then slide from 100% to 0% | Flatten lights and Nudge goes dark; the label row reads "Flatten 100%" over a slider. While sliding, the value, the tool's own figure and the shape follow: a flat 5:7 rectangle at 100%, a symmetric trapezoid at 0% |  |  |
| P3.12 ✏️ | Preview and back | Tap the **Preview** switch, try to drag a handle, then tap **Preview** again | Preview reads On: the corrected card fills the photo, the handles are hidden and don't move, Nudge and Flatten dim, and the label row says how to get back. The second tap brings the handles back, draggable |  |  |
| P3.13 ✏️ | Options sheet | Open the sheet with the grabber | "Perspective options": **Tap to find card**, Card orientation (Auto, Portrait, Landscape), **Reset perspective**, Developer → Debug overlay, and **Tips**. No Snap and no Fill outside photo |  |  |
| P3.14 ✏️ | Find card on the phone | In the sheet tap **Tap to find card**, wait a few seconds, then pinch and drag the photo | The sheet closes; "Tap the card in the photo." with **Cancel** takes the label row and stays; the photo zooms and pans without moving the corners |  |  |
| P3.15 ✏️ | Tap finds the card | Tap **Fit**, drag a corner well off the card, tap **Tap to find card** in the sheet, then tap the card | The corners land back on the card at once, with no other button to press, and the prompt goes |  |  |
| P3.16 🆕 | Snap | Tap the **Snap** tool, drag a corner slowly across the card's edge; tap **Snap** again and repeat | Snap reads On with a white ring and the handle catches on the detected edge; Off, it moves freely |  |  |
| P3.17 🆕 | Tips | Open the sheet, tap **Tips**, then tap it again | The four Perspective tips unfold in place and the sheet grows; the second tap folds them. No keyboard keys are listed |  |  |
| P3.18 🆕 | Detecting in the label row | Open another photo and watch the control area | "Detecting…" takes the label row while detection runs (slow over the LAN), then Nudge and the confidence come back |  |  |

---

## 4. Rotate

### Desktop
*Setup: a photo open on Rotate. Rotate's options are listed in the panel under its controls.*

| ID | Test | Steps | Expected | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| D4.1 ✏️ | Type an angle | Click the angle in the label row, type `-2.5`, press Enter | The angle is underlined with a pencil; the photo rotates −2.5° and the ruler moves to match |  |  |
| D4.2 ✏️ | Flip H and V | Click the **Flip** tool, then **Horizontal**, then **Vertical**, then each again | The label row reads "Flip · as you see it on screen". Each button lights while its flip is on: left to right, then top to bottom, as seen on screen; the second clicks undo them |  |  |
| D4.3 🆕 | Grid switch | In the options turn **Grid** off, then on | The grid hides and returns; the dashed crop outline stays throughout |  |  |
| D4.4 🆕 | Reset rotation | Set a fine angle and a flip, then click **Reset rotation** in the options | The angle is back to 0.0° and the flip is off |  |  |

### Phone
*Setup: a photo open on Rotate.*

| ID | Test | Steps | Expected | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| P4.1 ✏️ | Quarter turns | Tap the **90° left** tool, then **90° right** | Each tool flashes and the photo turns a quarter that way |  |  |
| P4.2 ✏️ | Ruler and Reset | Drag the ruler both ways, then tap **Reset** in the label row | The scale slides under a fixed pointer that grows while you hold it; the value and the photo follow live, with a grid. Reset puts it at 0.0° and dims |  |  |
| P4.3 ✏️ | Type an angle | Tap the angle, type `3.5`, tap **±**, then **Done** | The number pad opens and the label row lifts above it with **±** and **Done**; ± makes it −3.5; Done closes the keyboard, the photo turns −3.5° and the label row is back in place |  |  |
| P4.4 ✏️ | Fill frame | With a fine angle set, tap the **Fill frame** tool, then tap it again | On: it reads On with a white ring and no empty corners show. Off: the empty corners return |  |  |
| P4.5 🆕 | Options sheet | Open the sheet, tap **Tips** | "Rotate options": **Grid**, **Reset rotation** and **Tips**; the four Rotate tips unfold in place |  |  |

---

## 11. Front and back

### Desktop

No cases in this phase.

### Phone
*Setup: in Photos, the 14 pair (a raw card's front and back) and the 13 pair (a landscape card), full-size originals if you have them, else the AirDropped copies.*

| ID | Test | Steps | Expected | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| P11.12 | Closed tab resumes the pair | Pair two photos, swipe Safari away, reopen, **Resume** | The prompt names both photos; both sides come back, on the side and step you left (AC18) |  |  |

---

## 12. Session restore

### Desktop
*Setup: a photo open.*

| ID | Test | Steps | Expected | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| D12.1 ✏️ | Resume | Edit on several steps, leave a Levels change unapplied, reload, **Resume** | The start screen's card reads "Last photo · just now" over "Resume <name>?" with **Resume** and **Start fresh**; Resume brings back the same photo, edits and step, the corners unmoved, the Levels change still unapplied with its dot, and no "reset" notice |  |  |

### Phone
*Setup: a photo open.*

| ID | Test | Steps | Expected | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| P12.1 | Closed tab | Edit a photo and place a logo, swipe Safari away, reopen the page, **Resume** | The Resume prompt appears; the photo, edits, step and logo all come back |  |  |

---

## Smoke test

Run on both devices after the sections above. Copied from `tests/uat/smoke.md`, re-cut to the new layout (✏️: the steps changed, the verdict didn't). There is no Live column: the redesign is released once, after phase 6.

### Desktop
*Setup: Chrome with DevTools open on the Console tab, in a window wider than 760 px. The 14 pair from `samples/` (`14_front_portrait_raw_white`, `14_back_portrait_raw_white`) and a transparent PNG logo to hand. When a Download or Copy asks **Upscale to 2000 px?**, answer **No**.*

| ID | Test | Steps | Expected | Pre-release (dev.7) | Notes |
|---|---|---|---|---|---|
| SD1 | Right build | Open the page; look at the tab, the console and the logo's tooltip | The tab shows the P1 icon; the console's version line and the tooltip read the version under test (`-dev` pre-release) |  |  |
| SD2 | Drop and detect | Drag `14_front_portrait_raw_white` onto the page | It loads with four corners on or near the card |  |  |
| SD3 | Corner by mouse and keys | Drag a corner onto the card's corner, press an arrow key twice, then Ctrl+Z | The loupe sits up-right of the cursor and the Result preview updates; the keys nudge the handle; Ctrl+Z moves it back |  |  |
| SD4 ✏️ | Rotate | Press 2, click the angle and type `1.5`, then Enter | Rotate opens; the photo turns 1.5°, with a grid |  |  |
| SD5 | Crop | Press 3, click 5:4 | The chip reads 4:5 and the box is portrait (it follows the card) |  |  |
| SD6 | Levels | Press 4, **Auto**, hold **C**, then **Apply** | The colors adjust; C shows the photo without levels; Apply clears the dot |  |  |
| SD7 | Overlay | Press 5, **Add logo** with the PNG, click the bottom-right ring | The logo snaps to the bottom-right corner, inside the photo |  |  |
| SD8 | Download | Press 6, **Download**, open the file | `<name>-straight.jpg`; the crop, rotation, levels and logo match the screen; **Next card →** shows |  |  |
| SD9 | Copy | **Copy**, paste into another app | The image pastes |  |  |
| SD10 ✏️ | Edits round trip | In the side panel, **Save edits**; reload, **Start fresh**; open the same photo, go to Export, **Load edits**, **Download** | The second file looks identical to SD8's, logo included |  |  |
| SD11 ✏️ | Add back | **Add back**, choose `14_back_portrait_raw_white` | It opens on Perspective; the top bar shows **Front / Back** with Back lit, and the Unpair icon beside it |  |  |
| SD12 | Pair export | Go to Export, look at the photo area; choose **Separately**, **Download** | The preview joins both cards, front on the left; two files arrive, `-front` (with the logo) and `-back` |  |  |
| SD13 | Corner shots | In the side panel's **Corner shots** box choose **4 photos**, **Download corners** | Four close-up files, `-corner-tl`, `-tr`, `-br`, `-bl`, with no logo |  |  |
| SD14 | Resume the pair | Reload, **Resume** | The prompt names both photos; both sides come back, on the side and step you left |  |  |
| SD15 ✏️ | Narrow window | Narrow the window below 760 px, then widen it | The tab bar at the bottom replaces the top bar's step pill; widening brings the pill back |  |  |
| SD16 | Clean console | Look at the console | No red errors (CSP or otherwise) from the whole pass |  |  |

### Phone
*Setup: iPhone Safari; clear the LAN address's website data in Safari's settings (Advanced → Website Data) first, so no cached build runs. In Photos: a slabbed card's front and back, shot the same way up. A logo saved from an earlier run (or a PNG to upload). If Safari shows a downloaded image in the tab, go Back and tap **Resume**.*

| ID | Test | Steps | Expected | Pre-release (dev.7) | Notes |
|---|---|---|---|---|---|
| SP1 ✏️ | Open and detect | **Open**, choose the slab's front | It loads and the corners sit on the card; top bar, photo, control area and tab bar, with nothing over the photo and no button text cut off |  |  |
| SP2 | Long-press and drag | Press and hold a corner for 2 s, then drag it | No iOS magnifier or callout; the loupe pins to the top corner away from your finger |  |  |
| SP3 | Nudge and Undo | Tap ▶ twice, then Undo | The handle moves and the loupe stays up; one Undo takes both taps back |  |  |
| SP4 ✏️ | Tab bar and Rotate | Tap **Rotate** in the tab bar, drag the Straighten ruler | Rotate opens, its tab lit; the photo rotates, with a grid |  |  |
| SP5 ✏️ | Crop | Tap **Crop** in the tab bar, swipe the preset row, tap 5:4 | The chip reads 4:5 and the box is portrait; the photo is the same height as on Rotate |  |  |
| SP6 ✏️ | Levels | Tap **Levels**, **Auto**, press and hold the photo, then **Apply** | The colors adjust; the hold shows the photo without levels, with no magnifier; Apply clears the dot |  |  |
| SP7 ✏️ | Overlay | Tap **Overlay**, **Use saved overlay** (or **Add logo**), pinch on the logo, tap the bottom-right ring | The logo resizes while the photo stays still, then snaps to the corner |  |  |
| SP8 ✏️ | Right build | Tap **Export**, tap the grabber to open its options sheet, scroll to its end | The last line reads the version under test (`-dev` pre-release); the Source line above it gives the photo's real pixel size |  |  |
| SP9 ✏️ | Download with upscale | Close the sheet with **✕**, **Download**; if it asks **Upscale to 2000 px?**, tap **Yes** | The image has the crop, levels and logo as on screen; no crash |  |  |
| SP10 | Next card | Look under the readout (after Back and **Resume** if Safari showed the image) | On Export with every edit intact; **Next card →** sits beside **Add back** |  |  |
| SP11 ✏️ | Add back | **Add back**, choose the slab's back | It opens on Perspective with corners on the card; the top bar fits **Front / Back** and the Unpair icon in one row |  |  |
| SP12 ✏️ | Corner sheet | Go to Export, tap **Corner shots**, **1 sheet**, **Download corners** (answer **No** if asked) | Export's options sheet opens at the Corner shots box; a 2×2 sheet of this side's corners downloads, with no logo |  |  |
| SP13 ✏️ | Pair preview and Download | Drag the sheet down to close it; with **Together** chosen, **Download** (answer **No** if asked) | The photo area shows both sides, front first; one joined image downloads, the logo on the front only |  |  |
| SP14 | (HTTPS) Share to Photos | **Share** → Save Image, then open it in Photos | The joined image is in Photos and matches the screen; Safari is still on Export with every edit intact | ➖ |  |
| SP15 | Resume after closing | Swipe Safari away, reopen the page, **Resume** | The prompt names both photos; both sides and their edits come back |  |  |
| SP16 ✏️ | Unpair | Tap the Unpair icon, **Keep front** | A card over the dimmed photo asks which side to keep; the front stays as a single photo with its edits |  |  |

---

## Sign-off

| Area | Desktop | Phone | Blocking issues |
|---|---|---|---|
| 1. Start and layout | | | |
| 2. Navigation | | | |
| 3. Perspective | | | |
| 4. Rotate | | | |
| 11. Front and back | ➖ | | |
| 12. Session restore | | | |
| Smoke test (pre-release) | | | |

**Decision (phase 2, 1.10.0-dev.7, 2026-11-14):** ☑ Phase 2 passed, start phase 3 ☐ Fix first (Rich)

**Previous: phase 1 (1.10.0-dev.2):** the smoke test on desktop and iPhone.
