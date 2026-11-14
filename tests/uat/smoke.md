# Release smoke test (master)

One pass per device that finishes a real listing: a card, its back, its logo and its corner sheet. Each device takes a different card down a different path, so between them the two passes touch every step and every feature once. It runs **twice** per release, with both results recorded in the same tables in the version's `tests/UAT-X.Y.md`:

1. **Pre-release**, on the dev build: desktop on `http://localhost:8765/index.html`, phone over the LAN (`http://<PC-LAN-address>:8765/index.html`). Plain HTTP on the phone hides Share and Copy, so rows marked **(HTTPS)** come already marked ➖ in the Pre-release column; skip them.
2. **Live**, on https://rberrill.github.io/p1hunt_card_finisher/ right after the release is pushed. This confirms the deploy landed and runs the (HTTPS) rows. A fail here means a rollback (see the `release` skill).

The `uat` skill copies these tables into each version's script; edit this master, not the copies. Every row is a quick yes or no, and each builds on the row above it. The phone pass leans on what only a real iPhone shows (touch, long-press, the share sheet, Safari's memory and layout); the desktop pass on what needs a keyboard, the console and the saved files opened.

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
