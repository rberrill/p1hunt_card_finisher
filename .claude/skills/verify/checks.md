# Behavior and layout checks

The sections follow Rich's UAT catalog (`tests/uat/catalog.md`), so a failure here points to the catalog rows it would break. Those rows are the connected cases to add to the version's UAT. A behavior these checks prove has no catalog row unless a real iPhone adds something to the verdict (the `uat` skill), so a check dropped from here needs a catalog row in its place. Run the sections a change touches; run them all for a release. Rows marked (scripted) are measured by `layout-check.js`; the rest are driven by hand or with `browser.js`. "Phone" means 390×844 (and 375×667 for layout rows) with touch emulation; "Desktop" means 1280×800.

## 1. Start and layout

| Device | Check | Pass when |
|---|---|---|
| Both | Load a 4032×3024 photo | preview in well under 1 s |
| Both | `?selftest=1` | toast reads `main n/n, worker n/n`, all passing |
| Desktop | Wide layout | steps in the top bar, no tab bar or grabber, every step's options listed inline in the panel (on Export: Corner shots, then Export options) |
| Phone | No sideways scroll | `document.documentElement.scrollWidth <= innerWidth` on every step |
| Phone | Photo area the same on every step (scripted) | `#stage` height identical across all six steps: 544 px at 390×844 in a browser (no safe area; the frames draw 524 with 20 px for it) |
| Phone | Control area (scripted) | `.control-area` is 200 px on every step with nothing overflowing, including with a status showing |
| Phone | Tap targets (scripted for the parts) | every control is a 44 px target at 375 px wide, counting a small control's larger hit area (`touchSize` in `layout-probe.js`) |
| Both | The fifteen parts (scripted) | each part builds, has the plan's sizes (section 5) and behaves: the ruler's drag, the sheet's close, the alert card's choices |
| Both | Reduced motion (scripted) | with `prefers-reduced-motion`, only opacity transitions |
| Phone | Labels fit (scripted) | no button in a control area has `scrollWidth > clientWidth`; the tab bar's bottom is inside the safe area |
| Phone | The sheet is the control area's drawer | drag the grabber's tab up and stop: the sheet's top edge is under the finger with the tab on it, it rose from the control area's top edge (not from the bottom of the screen), and exactly one tab shows at every moment; the chevron is flat by 40% of the travel and comes back after a spring-back; the open sheet's tab drags it closed |
| Phone | Nothing blocks the photo (scripted) | with no sheet open and no alert waiting on an answer, no element intersects `#stage` (the grabber's tab rises 24 px over the photo's bottom edge by design, and the toast sits 12 px above it) |

## 2. Navigation

| Device | Check | Pass when |
|---|---|---|
| Desktop | Resize across 760 px | narrow: the tab bar and the grabber show, the steps leave the top bar, sheets close; wide: back again |
| Phone | Tab bar | six tabs, the current one selected; a tap changes step and closes an open sheet; a white dot on the Levels tab while Levels has an unapplied draft |
| Phone | Options sheet | the grabber (tap or drag up) opens the step's sheet over the photo; the photo keeps its size; a tap outside, ✕, Escape or a step change closes it |

## 3. Perspective

| Device | Check | Pass when |
|---|---|---|
| Both | Drag a corner | loupe shows; mini preview updates live; one undo step per drag |
| Phone | Drag on the right half, then the left half | loupe pins top-left, then top-right; never under the finger |
| Phone | Double-tap a handle twice | zooms 6× centered on it, then back to fit |
| Phone | ▶ three times, then Undo | one screen pixel per tap; loupe stays up between taps and for 4 s; one Undo restores the handle and hides the loupe |
| Phone | iOS long-press guards | computed `-webkit-touch-callout: none` and `user-select: none` on the photo, handles and nudge buttons; form fields still selectable |
| Both | Preview, try a drag, Corners | corrected card fills the photo; handles locked; back to corners |

## 4. Rotate

| Device | Check | Pass when |
|---|---|---|
| Desktop | Ctrl+Z / Shift+Ctrl+Z with a slider focused | undo and redo work (also R7) |

## 5. Crop

| Device | Check | Pass when |
|---|---|---|
| Desktop | Crop presets | all presets and Swap visible, wrapping onto more lines (no hidden overflow) |
| Phone | Crop presets | one row that scrolls sideways; the control area doesn't scroll |
| Both | Portrait card, tap 5:4 | chip reads 4:5, box portrait, labels 3:4 · 4:5 · 2:3 · 9:16 · 5:7 card |
| Both | Swap, pick 3:2, Swap | landscape labels; 3:2 stays landscape; second Swap back to portrait (2:3) |
| Both | Rotate 90° (or orientation Landscape), back to Crop | crop and labels switch to landscape |

## 6. Levels

| Device | Check | Pass when |
|---|---|---|
| Both | White, then hold on the photo | loupe with a sampling circle; "W" marker after release; swatch fills |
| Both | A light spot as the black point | rejected: "too light to be a black point" |
| Both | Pick, go to Export without applying | dot on Levels; Export warns; the exported file has no levels |
| Both | Auto, Apply, hold the photo, release; Clear, Apply | hold shows without levels; Clear + Apply leaves none |

## 7. Overlay

| Device | Check | Pass when |
|---|---|---|
| Both | Add a test logo, drag, resize (pinch on phone), tap each of the nine rings | stays fully inside; a still tap snaps; a drag on a ring moves; rings hide during gestures |
| Both | Other steps | the logo shows only on Overlay and Export |
| Phone | Overlay layout | same photo height and control-area rules as section 1 |

## 8. Export, 9. Corner shots, 10. Upscale question

| Device | Check | Pass when |
|---|---|---|
| Both | WebP where it can't encode (stub `toBlob` to answer WebP with PNG) | a `.png` file; the final toast is the warning "… WEBP isn’t supported by this browser, so it was saved as PNG." and stays up past 3 s, on Download, a finished Share, Share now, a pair's Separately and the corner sheet; a JPEG export's toast is unchanged |
| Both | Stubbed share: Share | button shown; the shared `File` has the right name and type; the app stays on Export with edits intact |
| Both | Stubbed share refused (`NotAllowedError`) | button becomes **Share now**; any edit cancels it |
| Both | No `navigator.share` / no `ClipboardItem` | Share and Copy hidden, not greyed; Download is the main button |
| Both | Corner shots (capture `CF.Exporter.download`) | sheet: one `-corners` file, 2×2 at 2 × size + 1 gutter, photo to the outer edges; photos: four `-corner-tl/tr/br/bl` files; a full-crop logo appears in the main export but no corner; Next card unchanged; stubbed Share gets all four, refusal gives **Share now**, an edit cancels it |
| Phone | Corner shots sheet | the Corner shots button opens `cornerShotsSheet` over the photo; the control area stays 200 px and the photo its height; the progress line runs on the sheet's top edge while it saves and both save buttons are disabled; the Saved toast sits 12 px above the sheet; no page scroll sideways |
| Both | Upscale card | with corners under 2000 px, Download corners shows the card (title, real size, Yes / No / Cancel); Yes gives a 2000 px `-corners` file (992 px tiles, 16 px gutter) and, on 4 photos, four 2000 px files; No gives the real-size file; a click outside gives nothing; `cornerShots.upscaleTargetPx=100` skips the card; stubbed Share after Yes gets the 4032 px file |
| Both | Upscale card (main export) | with a crop under the Size, Download, Share (unhide the button and stub `navigator.share`) and Copy (stub `CF.Exporter.copy`) show the card (title with the Size, the crop's size, Yes / No / Cancel); Yes gives a file with the Size on its long edge and the toast its size, No the real size, a click outside nothing; Size 3000 asks for 3000, Original never asks; `upscale.sharpenAmount=0` applies; `CF.syncUI()` and a resize leave the card up; a pair (`CF.receivePhoto(file, name, 'addBack')`): Together's joined image fits the Size exactly, Separately's files each get it, Copy copies the joined image, Size 1080 with a bigger joined image gives no card |
| Both | Export's rows | the control area is 200 px in four rows (44, 44, 48, 44) in every state: ready, a note, three notes, Share now, exported with Next card, a pair with Together \| Separately, Share hidden; no text in the readout row is cut (the phone shows the first note only, drops the readout's "not upscaled" tail while a note shows, and in a pair gives the note the readout's place; a wide screen shows every note); one tap changes Size and Format; each choice is a 44 px target at 375 and the grabber's tap strip is still 44 px tall; the options sheet shows everything down to Tips without a scroll; the progress line runs on the control area's top edge during an export |
| Both | The question card over a sheet | asked from Corner shots, the Upscale card sits above the open sheet, which stays open; Cancel, a tap outside and Escape save nothing; while any card is up the top bar, the panel and the tab bar are `inert` (a real click on a step or a control does nothing, and Tab stays out of them) |
| Both | Toasts | info white with no icon, warning amber with a triangle, error red with a circle; at most three lines; 12 px above the photo's bottom edge on the phone, or above an open sheet; bottom center and at most 460 px wide on a wide screen |

## 11. Front and back

| Device | Check | Pass when |
|---|---|---|
| Phone | Paired header on every step (Preview shows on Perspective) | every header target ≥ 44 px and the last ends inside `innerWidth`, at 390 and 375 px |
| Both | Add back (`CF.receivePhoto(file, name, 'addBack')`) | back opens on Perspective at 5:7 in the front's orientation; the front's crop is 5:7 fit; chip and ⨯ show |
| Both | Switch sides | lands on the same step, with that side's own edits and Undo; `app.switchDurationMs` logged |
| Both | Crop while paired | only 5:7 enabled; Swap turns both sides' crops and adds no undo step; a quarter turn keeps the orientation |
| Both | Together and Separately (capture `CF.Exporter.download`) | one `-pair` file at the readout's size, front left (portrait) or top (landscape); two `-front` / `-back` files, each byte-identical to `renderFull` + `encodeCanvas` of that side |
| Both | Logo on one side | it appears only in that side's half of the Together image |
| Both | Stubbed share | one sheet with every file; refusal gives **Share now**; an edit cancels it; Next card only after the chosen output is saved |
| Both | Unpair and New photo questions | a card centered over the dimmed photo, buttons ≥ 44 px; the control area and photo height unchanged; a tap outside or Escape cancels; shortcuts don't reach the photo behind it |
| Both | Resume a pair (with a logo on the waiting side) | the prompt names both photos; both sides, the side and step come back; Together exports without a missing-logo error |
| Both | Crafted `pair` record (`orient: '<b>x</b>'`) | resumes the open side alone with the "reset" notice; the record is cleared |
| Desktop | Reload fails after a pair export (wrap `CF.ImageSource.load` to reject the next two calls for the open side's file, then Download Together) | the file is still delivered; a warn toast says the photo isn't loaded and to switch sides; `app.img.el` is null; Download then refuses with the same message; switching sides and back restores `app.img.el` and the export works |

## 12. Session restore

| Device | Check | Pass when |
|---|---|---|
| Both | Edit (with an unapplied Levels draft), reload, Resume | same photo, edits, step and draft; corners not moved by detection |
| Both | Reload, Start fresh, reload | no prompt the second time |

## 13. Security

| Device | Check | Pass when |
|---|---|---|
| Desktop | `?crop.presets.0.label=<b>x</b>` | first chip still reads Free; the console notes the ignored setting |
| Both | Whole run | zero CSP errors in `read_console_messages` |
