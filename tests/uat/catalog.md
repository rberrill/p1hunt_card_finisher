# UAT catalog (master)

Every acceptance test case for P1Hunt Card Finisher, by feature. It's the source the per-version scripts draw from; it isn't run as a whole except when a release triggers a full run (see the `uat` skill).

- **One row per behavior, on one device.** A behavior is tested once: on the phone when it needs real touch, iOS or Safari; on desktop when it needs a keyboard, a mouse, DevTools or the saved file opened; and behavior that is the same on both is shared out so each device exercises every feature. What the automated tests already prove (`tests/README.md`, the `verify` skill's `checks.md`) has no row here.
- **One flow, one verdict.** A row may take a few steps on one feature; its Expected is what you see at the end. A row's setup carries on from the rows above it in the same table unless it says otherwise.
- **IDs** are permanent: `D` = Desktop, `P` = Phone, `E` = Environments, then section.row (`P5.2` is Phone, Crop, row 2). A new case takes the next free number in its table; a retired case's ID isn't reused. The catalog was rebuilt and renumbered on 2026-11-10; IDs in older scripts and decision-log entries refer to `archive/uat-catalog-before-2026-11-10.md`.
- **References:** "AC" and "Q" numbers refer to the feature's request page in Claude (Overlay, Corner Shots, Front + Back Pairing) and Rich's answers to it.
- Results are recorded in the version's `tests/UAT-X.Y.md`, never here.

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
| D1.1 | Start screen and Open | Open the page, then **Open** `IMG_9136` | The start screen reads "Finish a card photo" with the step tabs disabled; the photo then loads |  |  |
| D1.2 | Drag and drop | Drag a photo file onto the photo area | It loads |  |  |
| D1.3 | Paste | Copy an image, then press Ctrl+V on the page | It loads |  |  |
| D1.4 | Wide layout | Look at the screen with a photo open | Tabs in the header; side panel on the right with every More options section open; action bar at the bottom of the panel; no step menu button |  |  |
| D1.5 | Tab icon | Look at the browser tab | It shows the app icon, a red P and a white 1 on black, sharp, with no blur or light edge |  |  |

### Phone
*Setup: no photo open.*

| ID | Test | Steps | Expected | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| P1.1 | Open from Photos | Open the page, tap **Open**, choose a photo from Photos | The start screen has an Open button; the photo loads and corners are detected |  |  |
| P1.2 | Phone layout | Look at the screen | Header (Open · Undo · Redo · Preview · Fit), photo, control area, action bar. No bottom tab bar; nothing overlaps the photo |  |  |
| P1.3 | Every step fits | Walk all six steps with the → buttons (Levels' reads **Overlay →**) | The photo is the same height on every step; no button text is cut off; the action bar clears the home indicator |  |  |
| P1.4 | Turn the phone | Rotate to landscape and back | Nothing breaks; the layout recovers |  |  |
| P1.5 | Home-screen icon | Safari's Share button → **Add to Home Screen**, then look at the home screen | The icon is the red P and white 1 on a full black tile, not a screenshot of the page |  |  |

---

## 2. Navigation

### Desktop
*Setup: a photo open.*

| ID | Test | Steps | Expected | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| D2.1 | Tabs and number keys | Look at the header tabs, then press 1 to 6 | Perspective, Rotate, Crop, Levels, Overlay, Export, in that order; each key opens its step |  |  |
| D2.2 | Narrow and wide | Narrow the window below 760 px, then widen it again | Narrow: the tabs hide, the step menu button appears, More options close and the nudge strip shows. Wide: the tabs return and the More options sections open |  |  |

### Phone
*Setup: a photo open.*

| ID | Test | Steps | Expected | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| P2.1 | Step menu | Tap the first action-bar button (e.g. `Perspective ▾`), then pick **Crop** | A menu of all six steps with the current one highlighted; the pick goes to Crop and closes the menu |  |  |
| P2.2 | Tap outside | Open the menu, then tap the photo | The menu closes; the step doesn't change |  |  |
| P2.3 | Unapplied Levels dot | Make a Levels change without Apply, go to another step, open the menu | A dot on the step button and on the Levels entry |  |  |
| P2.4 | More options button | On Perspective, look at **More options**, tap it, then tap it again | A full-width button, as tall as the buttons above it, with a chevron at its right end. Open, it turns red with the chevron up and the control area expands; the second tap shrinks it back |  |  |
| P2.5 | More closes on step change | Open More options, then switch steps | More closes and the photo returns to full size |  |  |

---

## 3. Perspective

### Desktop
*Setup: `IMG_9136` open on Perspective.*

| ID | Test | Steps | Expected | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| D3.1 | Detects the card in a slab | Look at the corners after loading | They sit on the card inside the slab, not the slab edge |  |  |
| D3.2 | Drag a corner | Drag a corner handle | The handle follows the mouse; the loupe sits up-right of the cursor; the Result mini-preview updates live |  |  |
| D3.3 | Arrow-key nudge | Click a handle, press the arrow keys, then Shift+arrows | It moves 1 px per press, then 10 px |  |  |
| D3.4 | Double-click zoom | Double-click a corner handle, then double-click it again | Zooms in with the corner centered, then back to fit |  |  |
| D3.5 | Invalid shape | Drag one corner across the opposite edge | A red status line explains the shape is invalid; nothing breaks |  |  |
| D3.6 | Candidate | Open `IMG_9060`, click **Candidate** until it reads 2/3 | The 2nd candidate is the card (the 1st catches the stand edge) |  |  |
| D3.7 | Find card arms | Open `IMG_9136`. In More options click **Tap to find card**, move the mouse over the photo, then drag the photo | The button shows as pressed, the status line reads "Tap the card in the photo." and the cursor is a crosshair; the drag pans without moving the corners or releasing the button |  |  |
| D3.8 | Click finds the card | Drag a corner well off the card, click **Tap to find card**, then click the card | The corners land back on the card at once; the button is no longer pressed, the prompt has gone and nothing is drawn where you clicked |  |  |
| D3.9 | One Undo | Ctrl+Z | The corners go back to where you dragged them |  |  |
| D3.10 | Cancel | Click **Tap to find card**, then click it again | It's no longer pressed and the prompt goes |  |  |

### Phone
*Setup: a photo open on Perspective.*

| ID | Test | Steps | Expected | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| P3.1 | Loupe away from the finger | Drag a corner with your finger on the right half of the photo, then on the left half | The loupe pins to the top-left, then the top-right; never under your finger |  |  |
| P3.2 | No iOS long-press | Press and hold a corner for 2 s, then drag | No text-selection magnifier, selection handles or callout menu; the drag works |  |  |
| P3.3 | Double-tap zoom | Double-tap a corner, then double-tap it again | Zooms 6× with the corner centered, then back to fit |  |  |
| P3.4 | Nudge taps | Look at the nudge strip (▲ ▼ ◀ ▶ then Next handle), then tap ▶ three times, a second or two apart | The handle moves a little each tap; the loupe stays up between taps and for about 4 s after the last |  |  |
| P3.5 | Loupe hides on other touch | Tap ▲, then within 4 s tap the Flatten slider | The loupe hides immediately |  |  |
| P3.6 | Hold to repeat | Hold ▼ | Repeats after a short delay; no magnifier or callout |  |  |
| P3.7 | Next handle | Tap **Next handle** repeatedly | The selection cycles through the 4 corners and 4 edges, with the loupe showing each |  |  |
| P3.8 | Nudges undo together | Make a burst of nudges, then tap Undo once | The whole burst undoes in one step |  |  |
| P3.9 | Pinch and pan | Pinch to zoom, then drag to pan | Smooth; the page itself doesn't zoom |  |  |
| P3.10 | Edge handle | Drag an edge-midpoint handle | The whole edge moves |  |  |
| P3.11 | Flatten slider | Move Flatten from 100% to 0% | The corrected shape goes from a flat 5:7 rectangle to a symmetric trapezoid |  |  |
| P3.12 | Preview and back | Tap **Preview**, try to drag a handle, then tap **Corners** | The corrected card fills the photo and the handles don't move; Corners brings them back, draggable |  |  |
| P3.13 | More options contents | Open More options | Tap to find card, confidence, orientation, snap, debug, fill, reset and hints are there |  |  |
| P3.14 | Find card on the phone | In More options tap **Tap to find card**, wait a few seconds, then pinch and drag the photo | More options closes and the photo is back to full size; "Tap the card in the photo." shows under Flatten and stays; the photo zooms and pans without moving the corners |  |  |
| P3.15 | Tap finds the card | Tap Fit, drag a corner well off the card, tap **Tap to find card** (in More options), then tap the card | The corners land back on the card at once, with no other button to press, and the prompt goes |  |  |

---

## 4. Rotate

### Desktop
*Setup: a photo open on Rotate.*

| ID | Test | Steps | Expected | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| D4.1 | Type an angle | Type `-2.5` in the degrees box | The photo rotates −2.5° and the slider moves to match |  |  |
| D4.2 | Flip H and V | More options: **Flip H**, then **Flip V** | Flips left to right, then top to bottom, as seen on screen |  |  |

### Phone
*Setup: a photo open on Rotate.*

| ID | Test | Steps | Expected | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| P4.1 | Quarter turns | Tap ⟲ 90°, then ⟳ 90° | Rotates a quarter turn each way |  |  |
| P4.2 | Fine slider and 0° | Drag the Fine slider, then tap **0°** | Rotates live, with a grid; 0° puts it back |  |  |
| P4.3 | Type an angle | Tap the degrees box and type a value | The keyboard opens and the value applies |  |  |
| P4.4 | Fill frame | Set a fine rotation, then More options: turn on **Fill frame** | No empty corners show |  |  |

---

## 5. Crop

### Desktop
*Setup: a portrait card (`IMG_9136`) open on Crop.*

| ID | Test | Steps | Expected | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| D5.1 | Presets | Look at the preset row, then click each preset | Every preset and **⇄ Swap** is visible, wrapping onto more lines; each click reshapes the box and highlights the preset |  |  |
| D5.2 | Portrait card, portrait crops | Click 5:4 | The chip reads **4:5** and the box is portrait; labels read 3:4 · 4:5 · 2:3 · 9:16 · 5:7 card |  |  |
| D5.3 | Swap | Click **⇄ Swap**, pick 3:2, then **⇄ Swap** again | Landscape, with labels 4:3 · 5:4 · 3:2 · 16:9 · 7:5 card; 3:2 stays landscape; the second Swap gives portrait 2:3 |  |  |
| D5.4 | Swap is off at 1:1 and Free | Pick 1:1, then Free | Swap is disabled for both |  |  |
| D5.5 | Rotation turns the crop | Rotate ⟳ 90°, go back to Crop, then Undo | The crop and labels switch to landscape with the card; Undo makes them portrait again |  |  |
| D5.6 | Orientation setting | On Perspective, orientation **Landscape** in the side panel, then Crop | The crop and labels are landscape |  |  |

### Phone
*Setup: a portrait card open on Crop.*

| ID | Test | Steps | Expected | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| P5.1 | Preset row scrolls | Swipe the aspect row sideways | It scrolls to reveal every preset and **⇄ Swap** at the end |  |  |
| P5.2 | Move and resize the box | Drag inside the box with your finger, then drag a handle | It moves, then resizes |  |  |
| P5.3 | Fit to card | Tap **Fit to card** | The box fits the card with padding at the current aspect |  |  |

---

## 6. Levels

### Desktop
*Setup: `IMG_9136` open on Levels, no levels applied.*

| ID | Test | Steps | Expected | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| D6.1 | Light black point rejected | Click **Black**, then click something light | Rejected with a message; nothing changes |  |  |
| D6.2 | C key compare | Click **Auto**, then hold the **C** key | The image shows without levels while held, then returns |  |  |
| D6.3 | Undo and Redo | **Apply**, Undo, then Redo | One Undo removes the levels; Redo brings them back |  |  |
| D6.4 | Levels don't carry over | With levels applied, open a new photo | The new photo has no levels |  |  |

### Phone
*Setup: a photo open on Levels, no levels applied.*

| ID | Test | Steps | Expected | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| P6.1 | One row | Look at the control area | **Auto · White · Black · Clear** on one line |  |  |
| P6.2 | Auto | Tap **Auto** | The image changes and the swatches fill in; Apply and Discard enable; a dot on the Levels tab |  |  |
| P6.3 | White pick by touch | Tap **White**, touch and hold the card's white border, move slightly, then lift | A loupe with a sampling circle while held; the pick lands where you lift |  |  |
| P6.4 | Hold to compare | Press and hold the photo still, release, then drag the photo | The photo shows without levels while held, with no magnifier or callout; the drag pans without comparing |  |  |
| P6.5 | Apply | Tap **Apply** | The dot clears; Apply and Discard disable |  |  |
| P6.6 | Discard | Make a change, then **Discard** | The draft is dropped; applied levels are unchanged |  |  |
| P6.7 | Clear and Apply | **Clear**, then **Apply** | Levels removed; original colors |  |  |
| P6.8 | Unapplied warning on Export | Make a change without Apply, go to Export | Export warns that levels are unapplied |  |  |

---

## 7. Overlay

### Desktop
*Setup: a photo open on Overlay, no logo yet.*

| ID | Test | Steps | Expected | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| D7.1 | Add a PNG | **Add logo** with a transparent PNG | The logo appears centered at about ¼ of the photo width, its shape kept; the button now reads **Replace logo** (AC4, AC9) |  |  |
| D7.2 | JPG and WebP | **Replace logo** with the JPG, then with the WebP | Each replaces the logo |  |  |
| D7.3 | SVG stays sharp | **Replace logo** with the SVG, resize it large, export at Original and open the file | The logo's edges are sharp |  |  |
| D7.4 | Not an image | **Replace logo** with the renamed text file, then with the corrupt image | A red status line each time; the current logo is unchanged (AC5) |  |  |
| D7.5 | Over 5 MB | **Replace logo** with the file over 5 MB | Rejected; the message names the 5 MB limit (AC6) |  |  |
| D7.6 | Drop adds a logo here | Drag a PNG onto the photo | It becomes the logo |  |  |
| D7.7 | Drop elsewhere opens a photo | Go to Crop, drag a PNG onto the photo | It opens as a new photo (then reopen your photo and return to Overlay) |  |  |
| D7.8 | Paste adds a logo | Copy an image, press Ctrl+V | It becomes the logo |  |  |
| D7.9 | Arrow keys move | Press the arrow keys, then Shift+arrows | The logo moves in small, then bigger steps |  |  |
| D7.10 | Keys and wheel resize | Press + and −, then scroll the mouse wheel | The logo resizes; the photo doesn't zoom |  |  |
| D7.11 | Levels don't touch the logo | Apply a Levels white pick, return to Overlay | The logo's colors are unchanged (Q3) |  |  |
| D7.12 | Export with the logo | Set a semi-transparent logo; export as JPEG, PNG and WebP; open the files | Each is one flat image; the logo matches the preview in place, size, opacity and soft edges (AC8, AC23) |  |  |
| D7.13 | Saved logo is offered, not applied | Place a logo bottom-right at 60%, open a different photo, go to Overlay | Not added; a thumbnail with **Use saved overlay** is shown (AC20, Q7) |  |  |
| D7.14 | Use saved overlay | Click **Use saved overlay** | Applied bottom-right at 60%, the last-used settings (AC20, Q8) |  |  |
| D7.15 | Delete saved overlay | **Delete saved overlay**, then open a new photo and go to Overlay | The thumbnail goes and the logo stays on the current photo; the new photo is offered none, just the hint and **Add logo** (AC21, Q9) |  |  |
| D7.16 | Start fresh keeps the logo | Save a logo again, reload, **Start fresh**, open a new photo | The saved logo is still offered |  |  |
| D7.17 | Private window | In a private window, add a logo | It works on the photo; a notice says it can't be saved in this browser (AC22) |  |  |

### Phone
*Setup: a photo open on Overlay, no logo yet. The PNG logo is in Photos or Files.*

| ID | Test | Steps | Expected | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| P7.1 | Overlay layout | Look at the screen | The photo is the same height as on other steps; **Add logo** shows with no text cut off (AC2) |  |  |
| P7.2 | Add a logo | **Add logo**, choose the PNG | The logo appears centered at about ¼ of the photo width; the button reads **Replace logo**, not cut off (AC4, AC9) |  |  |
| P7.3 | Drag the logo | Drag starting on the logo, then starting on empty photo | The logo moves both times; the photo doesn't pan (AC10, Q5) |  |  |
| P7.4 | Stays inside | Drag the logo far past an edge | It stops with the whole logo inside the photo (AC10) |  |  |
| P7.5 | Corner resize | Drag a corner handle | Resizes with the shape locked (AC11) |  |  |
| P7.6 | Pinch | Pinch with both fingers on the logo, then on empty photo | The logo resizes both times; the photo stays still (AC13) |  |  |
| P7.7 | Nudge and size buttons | Tap ▲ ▼ ◀ ▶ and − +, then hold one | Small steps; the buttons are easy to hit; holding repeats (AC14) |  |  |
| P7.8 | Snap rings | Tap each of the nine rings (corners, side middles, center), then Undo | The logo jumps to each spot with a small margin; Undo puts it back one snap (AC15) |  |  |
| P7.9 | Rings and drags | Drag the logo, then start a drag on a ring | The rings are hidden during a drag; a drag from a ring moves the logo without snapping |  |  |
| P7.10 | Crop change keeps the place | Go to Crop, change 1:1 to 4:5, return | The logo keeps its relative place, fully inside (Q1) |  |  |
| P7.11 | Opacity | Slide Opacity | The preview updates live; % shown (AC16) |  |  |
| P7.12 | One undo per gesture | Undo after a slide, a drag and a pinch | Each undoes as one step |  |  |
| P7.13 | Reset | Tap the grabber to open the options sheet, **Reset** | Back to center, ¼ width, 100% (AC18) |  |  |
| P7.14 | Remove and Undo | In the options sheet, **Remove overlay**, then Undo | The logo is gone from this photo; Undo brings it back (AC17) |  |  |
| P7.15 | Only on Overlay and Export | Look at Perspective, Rotate, Crop and Levels | The logo doesn't show there (Q4) |  |  |
| P7.16 | Saved logo survives closing | With a logo placed, swipe Safari away, reopen the app, start a new photo, go to Overlay | The saved logo is offered with **Use saved overlay** (AC19) |  |  |
| P7.17 | (HTTPS) Share with the logo | Set a semi-transparent logo, **Share** → Save Image | The saved photo in Photos includes the logo, matching the preview | ➖ |  |

---

## 8. Export

### Desktop
*Setup: `IMG_9136` straightened and cropped, on Export.*

| ID | Test | Steps | Expected | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| D8.1 | Defaults | In a private window (no remembered settings), open a photo and go to Export | JPEG, 2000 px; the readout shows the size and format |  |  |
| D8.2 | Readout follows settings | Choose PNG, then change the Size | The readout updates each time; with PNG, Quality (in the side panel's options) hides |  |  |
| D8.3 | Not upscaled | Make a crop smaller than 2000 px | The readout says "full crop, not upscaled" |  |  |
| D8.4 | Download | Click **Download**, open the file | A progress bar, then `<name>-straight.jpg`; its crop, rotation and levels match the screen |  |  |
| D8.5 | Copy | **Copy**, then paste into another app | A PNG of the result pastes |  |  |
| D8.6 | Settings remembered | Reload and open a new photo | Export format, size and crop preset are remembered |  |  |
| D8.7 | Next card after Copy | Open a new photo, go to Export, **Copy** | **Next card →** appears |  |  |
| D8.8 | Next card follows Undo | Change the Size dropdown, then Ctrl+Z | **Next card →** goes, then is back (the edits match the export again) |  |  |
| D8.9 | Cancel the picker | Click **Next card →**, then cancel the picker | Still on Export with the same photo, and **Next card →** still showing |  |  |
| D8.10 | Resume keeps Next card | Reload, **Resume** | Back on Export with **Next card →** showing |  |  |
| D8.11 | Source and version lines | Open `14_front_portrait_raw_white`, go to Export, look under **Reset export settings** in the side panel | A Source line gives the photo as the app received it (its pixel size and megapixels, `image/jpeg`, file size and name, matching the file); under it a muted line reads "Card Finisher" and the version from the logo tooltip |  |  |

### Phone
*Setup: a photo straightened and cropped, on Export.*

| ID | Test | Steps | Expected | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| P8.1 | Pickers | Tap the Format and Size dropdowns | iOS pickers open; the readout updates after choosing |  |  |
| P8.2 | Download and back | **Download**; if Safari shows the image, go Back and tap **Resume** | A plain download; the session comes back on Export |  |  |
| P8.3 | Next card shows after an export | Open a new photo and go to Export; look; then **Download** | Before: **Add back** and **Corner shots** share the row under the readout. After: **Next card →** is where **Corner shots** was, text whole |  |  |
| P8.4 | Hidden after an edit | Change the Size picker | **Next card →** goes and **Corner shots** is back in its place |  |  |
| P8.5 | A note takes the row | Leave a Levels change unapplied, go to Export, look, then **Download** | The warning has the row (no **Add back** or **Corner shots**); after the Download **Next card →** takes its place |  |  |
| P8.6 | Next card opens a new photo | Tap **Next card →**, choose a raw card photo | iOS offers Photo Library, Take Photo and Choose File; the photo opens on Perspective with the corners on the card, no levels, and the same crop preset and size as before |  |  |
| P8.7 | 48 MP is capped | Open a 48 MP photo, then **Download** at Original | Capped at 16.7 MP with a warning |  |  |
| P8.8 | WebP falls back | Choose WebP and **Download** | A PNG; the toast after it reads "Exported … WEBP isn’t supported by this browser, so it was saved as PNG." in the warning colour, for a few seconds. If Safari saves a `.webp` instead, it encodes WebP now: mark ➖ and say so in Notes |  |  |
| P8.9 | Save edits | Tap the grabber to open the options sheet, **Save edits** | The JSON file downloads |  |  |
| P8.10 | Options sheet look | Open the options sheet and scroll to its end | **Corner shots** and **Edits** each sit in their own dark box with rounded corners; Quality, Interpolation and **Reset export settings** don't; the last line reads "Card Finisher" and the version |  |  |
| P8.11 | Source line | Open a 12 MP photo from Photos, go to Export, open the options sheet, look above the version line | The Source line gives 3024 × 4032 px (12.2 MP) and `image/jpeg`: the picker keeps every pixel and converts HEIC to JPEG |  |  |
| P8.12 | (HTTPS) Share to Photos | **Share** at 2000 px, then Save Image | The share sheet opens and the image lands in Photos; the app is still on Export with every edit intact | ➖ |  |
| P8.13 | (HTTPS) Cancel sharing | Open a new photo, go to Export, **Share**, then tap outside the sheet | The sheet closes; nothing is saved; no **Next card →** | ➖ |  |
| P8.14 | (HTTPS) Next card after Share | **Share** → Save Image | **Next card →** appears | ➖ |  |
| P8.15 | (HTTPS) Share a full-size photo | **Share** at Original with a full-size iPhone photo (12 MP or 48 MP); if **Share now** shows instead of the sheet, tap it | Completes without crashing and the image lands in Photos; note how long it took | ➖ |  |
| P8.16 | (HTTPS) Copy | **Copy**, paste into another app | The image pastes | ➖ |  |

---

## 9. Corner shots

AC numbers here refer to the Corner Shots Request page in Claude.

### Desktop
*Setup: `14_front_portrait_raw_white` (a raw card: a slab's corners don't make a condition photo), on Export.*

| ID | Test | Steps | Expected | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| D9.1 | Corner shots group | In a private window (no remembered settings), open the photo, go to Export, click **Corner shots** | The side panel scrolls so the whole **Corner shots** box is in view: four thumbnails, **4 photos / 1 sheet** with 1 sheet chosen, a readout giving the sheet's size and each corner's in px, and **Share corners** above **Download corners** (AC1, AC6, AC9) |  |  |
| D9.2 | 1 sheet download | **Download corners**, open the file | `<name>-corners.jpg`: TL TR over BL BR, a thin divider in the fill colour, no text; the photo runs to all four outer edges, with no border (AC9) |  |  |
| D9.3 | 4 photos download | **4 photos**, **Download corners** | Four files, `-corner-tl`, `-tr`, `-br`, `-bl` (Chrome may ask once to allow several downloads) (AC8) |  |  |
| D9.4 | Labels follow rotate and flip | Turn 90° and flip on Rotate, then download the sheet | Its top-left tile is the main export's top-left corner (AC3) |  |  |
| D9.5 | Same look as the export | Apply Auto levels and a fine tilt, then download the sheet and the main export | Each tile matches the same corner of the main export, tilt and colours included (AC2, AC4) |  |  |
| D9.6 | No overlay | Place a logo over a corner on Overlay, then download the sheet | No tile shows the logo (AC4) |  |  |
| D9.7 | Past the photo's edge | Drag a corner handle to the photo's edge on Perspective, then download the sheet | The area past the photo is the export fill colour (AC5) |  |  |
| D9.8 | Not an export | Open a new photo, go to Export, download the corner sheet | No **Next card →**; **Corner shots** still shows beside **Add back** (AC11) |  |  |
| D9.9 | Choice remembered | Choose **4 photos**, reload, **Start fresh**, open a photo, go to Export, look at the side panel's **Corner shots** box | **4 photos** is still chosen (AC10) |  |  |
| D9.10 | Share four files | **4 photos**, **Share corners** | One share dialog holding four images (AC8) |  |  |

### Phone
*Setup: `14_front_portrait_raw_white` open (the full-size original from Photos if you have it), on Export.*

| ID | Test | Steps | Expected | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| P9.1 | Corner shots opens the group | Tap **Corner shots** | Export's options sheet opens with the **Corner shots** box at its top: four thumbnails, 4 photos / 1 sheet, a readout, and **Download corners** spanning the box on one line (no Share over the LAN) (AC1) |  |  |
| P9.2 | Thumbnails follow edits | Turn 90° on Rotate, then back to Export → **Corner shots** | The thumbnails show the new corners (AC13) |  |  |
| P9.3 | 1 sheet Download | **1 sheet**, **Download corners** | The 2×2 sheet downloads (AC9) |  |  |
| P9.4 | Large photo | Open the largest photo you have (48 MP if you have one), download the sheet | Completes without a crash (AC12) |  |  |
| P9.5 | (HTTPS) Share the sheet | **1 sheet**, **Share corners**, Save Image | The sheet lands in Photos (AC9) | ➖ |  |
| P9.6 | (HTTPS) Share four to Photos | **4 photos**, **Share corners**, then Save 4 Images | All four land in Photos (AC8) | ➖ |  |
| P9.7 | (HTTPS) Share now after a slow render | **4 photos** on a full-size photo, **Share corners**; if **Share now** shows, tap it | The share sheet opens with four images (AC8) | ➖ |  |

---

## 10. Upscale question

### Desktop
*Setup: `14_front_portrait_raw_white` on Export at JPEG, 2000 px; its crop is under 2000 px, so the readout says "full crop, not upscaled".*

| ID | Test | Steps | Expected | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| D10.1 | Download asks | Click **Download** | A card over the dimmed photo: **Upscale to 2000 px?**, "The crop is W × H px at the photo's resolution.", **Yes**, **No** and Cancel |  |  |
| D10.2 | Yes upscales the export | **Yes**, open the file | The long edge is exactly 2000 px, visibly crisper than the real-size export at 100 %, with no bright or dark rim along the card's edge; the toast gives the 2000 px size; **Next card →** shows |  |  |
| D10.3 | No and Cancel | **Download**, **No**; then **Download** and click outside the card | No saves the file at the readout's size; the click outside closes the card and nothing downloads |  |  |
| D10.4 | Copy asks too | **Copy**, **Yes**, paste into another app | The same card; a PNG with a 2000 px long edge pastes |  |  |
| D10.5 | Share asks too | **Share**, **Yes** | The same card; the share dialog gets the 2000 px file |  |  |
| D10.6 | Follows the Size | Choose 3000 px, **Download** | The card says **Upscale to 3000 px?**; **Yes** gives a 3000 px long edge |  |  |
| D10.7 | No card when it isn't needed | Choose Original, **Download**; then choose a Size smaller than the crop's long edge (the readout no longer says "not upscaled"), **Download** | No card either time; the files are the full crop, then the chosen Size on the long edge |  |  |
| D10.8 | The card stays through a resize | **Download** at 2000 px, then resize the window | The card stays up; **Yes** still exports |  |  |
| D10.9 | Corners ask too | Click **Download corners** | The same kind of card: **Upscale to 2000 px?** with a line giving the sheet's real size |  |  |
| D10.10 | Yes upscales the sheet | **Yes**, open the file | The sheet is exactly 2000 px square, visibly crisper than the real-size sheet at 100 %, with no rim along the card's edge |  |  |
| D10.11 | 4 photos upscale each | **4 photos**, **Download corners**, **Yes** | Four files, each 2000 px square |  |  |
| D10.12 | No corner card at the target | Open `SITE?cornerShots.upscaleTargetPx=100`, open a photo, **Download corners** | No card; the sheet downloads at the real size |  |  |
| D10.13 | Sharpening can be turned off | Open `SITE?upscale.sharpenAmount=0`, open the photo, **Download**, **Yes** | A 2000 px file that is softer than D10.2's at 100 % |  |  |

### Phone
*Setup: a photo whose crop is under 2000 px (the readout says "full crop, not upscaled"; `14_front_portrait_raw_white` AirDropped always is), on Export.*

| ID | Test | Steps | Expected | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| P10.1 | Download asks | **Download**, then tap outside the card | A card over the dimmed photo: **Upscale to 2000 px?**, the crop's real size, **Yes**, **No** and Cancel; the tap outside closes it and nothing is saved |  |  |
| P10.2 | Yes upscales the export | **Download**, **Yes** | Completes without a crash; the toast gives a 2000 px size; note the time |  |  |
| P10.3 | The export is crisp | Save that image to Photos and look at it at 100 % | A 2000 px long edge, crisper than the real-size export, no rim along the card's edge |  |  |
| P10.4 | No keeps the real size | **Download**, **No** | The file is the readout's size |  |  |
| P10.5 | Rotating keeps the card | **Download**, turn the phone sideways and back | The card stays up; **Yes** still exports |  |  |
| P10.6 | Corners: Yes | Tap **Corner shots**, **Download corners**, **Yes** | The card gives the sheet's real size; Yes completes without a crash and the sheet is 2000 px square and crisp; note the time |  |  |
| P10.7 | (HTTPS) Share asks too | **Share**, **Yes**, Save Image | The same card; the 2000 px image lands in Photos | ➖ |  |
| P10.8 | (HTTPS) Copy asks too | **Copy**, **Yes**, paste into another app | The same card; a 2000 px image pastes | ➖ |  |

---

## 11. Front and back

AC numbers here refer to the Front + Back Pairing page in Claude.

### Desktop
*Setup: the 14 pair (`14_front_portrait_raw_white`, `14_back_portrait_raw_white`), `13_front_landscape_onetouch_labeled_white` as a third photo, and a transparent PNG logo.*

| ID | Test | Steps | Expected | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| D11.1 | Add back opens the picker | Open `14_front_portrait_raw_white`, go to Export, click **Add back**, then cancel the picker | The picker opens and nothing downloads; after the cancel it's the same photo's Export, with no **Front / Back** in the top bar and the crop unchanged (AC2) |  |  |
| D11.2 | The back starts like a new photo | **Add back** again and choose `14_back_portrait_raw_white` | It opens on Perspective with the corners on the card and no levels; the top bar shows **Front / Back** with Back lit red, and the Unpair icon beside it (AC3, AC4) |  |  |
| D11.3 | The front became 5:7 | Go to Crop, click **Front** | The front, also on Crop, with its box 5:7 and fitted to the card (AC2, AC5) |  |  |
| D11.4 | Undo is per side | Rotate the front 1°, click **Back**, press Ctrl+Z | The back's last change is undone; the front keeps its 1° (AC5) |  |  |
| D11.5 | Swap isn't an undo step | On Crop, **⇄ Swap**, then press Ctrl+Z | The crop stays landscape (AC8) |  |  |
| D11.6 | Edits stay separate | **⇄ Swap** back. On the back, **Auto** levels and **Apply**, then click **Front** | The front has no levels (AC9) |  |  |
| D11.7 | Output dropdown and preview | Go to Export | A **Together / Separately** dropdown on its own line under Format and Size, Together chosen; the readout reads "Together · W × H px · JPEG"; the photo area shows both cards, front on the left, a thin line in the fill colour between them, no border (AC10, AC11, AC13) |  |  |
| D11.8 | Together download | **Download**, open the file | One `<front>-pair.jpg` at the readout's size, matching the preview (AC11) |  |  |
| D11.9 | Landscape stacks | On Crop, **⇄ Swap**; on Export, **Download** | The front is on top and the back below (AC11) |  |  |
| D11.10 | Separately | **⇄ Swap** back. Choose **Separately**, **Download**, open both files | `<front>-front.jpg` and `<back>-back.jpg` (Chrome may ask once to allow several downloads), each with its side's framing and levels as on screen (AC12) |  |  |
| D11.11 | Logo on one side only | Add a logo on the back's Overlay step; choose Together; **Download** | The logo is on the back's half only (AC11) |  |  |
| D11.12 | Format applies to both | Choose PNG on the back, click **Front**, go to Export | PNG is chosen there too (AC10) |  |  |
| D11.13 | Next card follows both sides | Choose JPEG, **Download**; then click **Back**, change the Fine rotation, go to Export | **Next card →** shows after the Download, and is gone after the edit to the other side (AC16) |  |  |
| D11.14 | Copy the Together image | **Copy**, paste into another app | The joined image pastes (AC14) |  |  |
| D11.15 | Share both files | Choose Separately, **Share** | One share dialog holding both images (AC14) |  |  |
| D11.16 | Save edits saves this side | In the side panel, read the Edits hint, then **Save edits** | The hint starts "Saves the side you're on."; the file is the back's (AC20) |  |  |
| D11.17 | Keep front | On the back, click the Unpair icon, **Keep front**, then go to Crop | The front, as a single photo framed 5:7; **Front / Back** and the Unpair icon are gone from the top bar; every preset can be picked again (AC6) |  |  |
| D11.18 | Remembered preset unchanged | Open a new photo, go to Crop | It starts at the preset you used before pairing, not 5:7 (AC7) |  |  |
| D11.19 | Replace the side | Pair the 14 photos again, **Open** `13_front_landscape_onetouch_labeled_white`, **Replace back** | The third photo is now the back; the front is unchanged (AC17) |  |  |
| D11.20 | New photo ends the pair | **Open** another photo, **New photo** | It opens as a single photo; no **Front / Back** in the top bar (AC17) |  |  |
| D11.21 | Drop asks | Pair again, drag a photo onto the photo area | A card over the dimmed photo asks **New photo · Replace back · Cancel** (AC17) |  |  |
| D11.22 | Drop on Overlay adds a logo | **Cancel**. On Overlay, drag a PNG onto the photo | It becomes the logo, with no question (AC17) |  |  |
| D11.23 | Upscale: Together | Choose Together and 2000 px, **Download**, **Yes**, open the file | The card says "The image is W × H px at the photos' resolution."; the file's long edge is exactly 2000 px, both sides enlarged alike with the gutter between them |  |  |
| D11.24 | Upscale: Separately | Choose Separately, **Download**, **Yes** | The card gives both sides' sizes; `-front` and `-back` each have a 2000 px long edge |  |  |

### Phone
*Setup: in Photos, the 14 pair (a raw card's front and back) and the 13 pair (a landscape card), full-size originals if you have them, else the AirDropped copies.*

| ID | Test | Steps | Expected | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| P11.1 | Top bar fits | Open `14_front_portrait_raw_white`, go to Export, **Add back**, choose `14_back_portrait_raw_white`; look at the top bar on Perspective, then pinch to zoom the photo | Open, **Front / Back**, the Unpair icon, Undo and Redo in one row; zoomed, Fit joins them, still in one row; nothing cut off (AC4) |  |  |
| P11.2 | Switch keeps the step | Tap **Front**, then **Back** and **Front** a few times | Each side opens on Perspective too; note how long a switch takes (judge speed on the live site; over the LAN it is slower) (AC5) |  |  |
| P11.3 | Crop is locked to 5:7 | Go to Crop | Only **5:7 card** can be picked (AC7) |  |  |
| P11.4 | Swap turns both sides | **⇄ Swap**, then tap **Front** | Both sides are landscape (AC8) |  |  |
| P11.5 | Export fits | **⇄ Swap** back. Go to Export | JPEG, 2000 px and Together in one row, labels whole; **Corner shots** fills the row under the readout; the photo area shows the joined image, front on the left, the same height as on other steps (AC10, AC13) |  |  |
| P11.6 | Together Download | **Download** | One joined image, `<front>-pair` (AC11) |  |  |
| P11.7 | Separately Download | Choose **Separately**, **Download** | Note whether both files arrive; Safari may show only the first (AC12) |  |  |
| P11.8 | Unpair asks on a card | Tap the Unpair icon beside **Front / Back**, then tap the dimmed photo outside the card | A card over the dimmed photo asks **Keep front · Keep back · Cancel**; the controls below don't move; the tap outside closes it, still paired (AC6) |  |  |
| P11.9 | Keep the back | Tap the Unpair icon, **Keep back** | The back, as a single photo; **Front / Back** is gone from the top bar (AC6) |  |  |
| P11.10 | Open asks | Pair the 14 photos again, **Open** `13_front_landscape_onetouch_labeled_white` | A card over the dimmed photo asks **New photo · Replace back · Cancel** (AC17) |  |  |
| P11.11 | Next card after the pair's export | **Cancel**, **Download**, then **Next card →**, choose a photo | It opens as a single photo without asking (AC16) |  |  |
| P11.12 | Closed tab resumes the pair | Pair two photos, swipe Safari away, reopen, **Resume** | The prompt names both photos; both sides come back, on the side and step you left (AC18) |  |  |
| P11.13 | A landscape pair stacks without Swap | Pair the 13 photos, go to Export | The joined preview is stacked, front on top, both sides 7:5: the crop follows the card (AC11) |  |  |
| P11.14 | Upscale: Together | Pair the 14 photos, choose Together and 2000 px, **Download**, **Yes** | The card asks **Upscale to 2000 px?** with the joined image's size; Yes completes without a crash; note the time |  |  |
| P11.15 | Large pair | Pair your two largest photos (48 MP if you have them), Together at Original size, **Download** | Completes without a crash (AC19) |  |  |
| P11.16 | (HTTPS) Share Together to Photos | Choose Together, **Share**, Save Image | The joined image lands in Photos (AC14) | ➖ |  |
| P11.17 | (HTTPS) Share both sides | Choose Separately, **Share**, Save 2 Images | Both land in Photos (AC14) | ➖ |  |
| P11.18 | (HTTPS) Share now after a slow render | At Original size, **Share**; if **Share now** shows, tap it | The share sheet opens with the pair's files (AC14) | ➖ |  |

---

## 12. Session restore

### Desktop
*Setup: a photo open.*

| ID | Test | Steps | Expected | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| D12.1 | Resume | Edit on several steps, leave a Levels change unapplied, reload, **Resume** | The start screen asks "Resume <name>? (just now)" with **Resume** and **Start fresh**; Resume brings back the same photo, edits and step, the corners unmoved, the Levels change still unapplied with its dot, and no "reset" notice |  |  |
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
| D13.1 | A link can't add text | Open `SITE?crop.presets.0.label=<b>HACKED</b>`, open a photo, go to Crop | The first chip still reads **Free** (no bold "HACKED"); the console says the URL setting was ignored |  |  |
| D13.2 | Number links still work | Open `SITE?detect.cannyHigh=90&debug=1` | The tuning panel shows cannyHigh **90** |  |  |
| D13.3 | Tuning panel | Open `SITE`, press the backtick key | The panel opens with its header, Copy CONFIG / Re-detect buttons and the settings list |  |  |
| D13.4 | No outside requests | Open `SITE?detect.opencv.enabled=1`, open a photo, watch DevTools → Network | Detection works as normal; no request to any other site |  |  |
| D13.5 | Out-of-range links are ignored | Open `SITE?previewMaxPx=0&maxOutputArea=1e12&export.bandPx=1e13&cornerShots.maxPx=5000&pair.gutterPct=50&detect.refineSamples=1e9&rotate.gridPx=0`, open `IMG_9136`, go to Rotate | The console lists all seven settings as ignored (outside the safe range); the photo is sharp, the corners are found as usual and the grid draws |  |  |
| D13.6 | A link can lower a cap | Open `SITE?overlay.maxBytes=524288`, open a photo, go to Overlay, **Add logo** with `samples/IMG_9136.JPEG` | Rejected; the message names a 0.5 MB limit |  |  |
| D13.7 | A crafted edits file is cleaned | **Save edits**, change `"format": "jpeg"` to `"format": "<b>x</b>"` in a text editor, **Load edits** | A notice says some settings were reset (export); the readout shows JPEG, no bold text |  |  |
| D13.8 | Oversized edits file | With a photo open, **Load edits** with `tests/uat/edits-over-8mb.json` | A red message says the file is too large to be an edits file |  |  |
| D13.9 | Malformed photo size | In a saved edits file change `"width"` to `"abc"`, **Load edits** | A red message: "That isn't a Card Finisher edits file." |  |  |
| D13.10 | Malformed crop | Change the whole `"crop": { … }` to `"crop": "x"`, **Load edits** | The edits load with a notice that crop was reset |  |  |
| D13.11 | A crafted pair record is reset | Pair two photos. DevTools → Application → IndexedDB → `p1hunt-finisher` → `session` → `pair`: change `orient` to `<b>x</b>`; reload, **Resume** | The open side resumes alone, with a notice that the saved pair was reset (AC21) |  |  |
| D13.12 | No CSP errors | Look at the console after running the desktop sections | No red "Content Security Policy" errors at any point |  |  |

### Phone
None; the phone runs the same code, and the smoke test shows nothing is missing or unstyled.

---

## 14. Real-use run

### Desktop
None; desktop use is covered by sections 1–13.

### Phone

| ID | Test | Steps | Expected | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| P14.1 | Three cards end to end | Finish three of your own card photos (slab, toploader, raw) as you would for a listing, one of them with its back and its corner sheet | Each takes under about a minute; note anything that felt slow, fiddly or hidden |  |  |
| P14.2 | Undo and Redo across steps | During that run, Undo and Redo across steps | Each restores the expected state |  |  |

---

## 15. Environments

Run once per release, not per device. Running from disk (`file://`) and from a Pages-style subfolder is checked by the `verify` skill.

| ID | Test | Steps | Expected | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| E15.1 | Plain HTTP hides Share and Copy | On the phone, open the LAN address (`http://<PC-LAN-address>:8765`) and finish a photo | No Share or Copy button, on Export or in Corner shots; Download is the main (red) button |  |  |
| E15.2 | HTTPS enforced | GitHub: **Settings → Pages** | **Enforce HTTPS** is on |  |  |
| E15.3 | Private vulnerability reporting | GitHub: **Settings → Code security** | **Private vulnerability reporting** is enabled (SECURITY.md points people there) |  |  |

---
