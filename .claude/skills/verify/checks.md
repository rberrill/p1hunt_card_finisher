# Behavior and layout checks

The sections match Rich's UAT catalog (`tests/uat/catalog.md`), so a failure here points to the catalog rows it would break. Those rows are the connected cases to add to the version's UAT. Run the sections a change touches; run them all for a release. "Phone" means 390×844 (and 375×667 for layout rows) with touch emulation; "Desktop" means 1280×800.

## 1. Start and layout

| Device | Check | Pass when |
|---|---|---|
| Both | Load a 4032×3024 photo | preview in well under 1 s |
| Both | `?selftest=1` | toast reads `main n/n, worker n/n`, all passing |
| Desktop | Wide layout | tabs visible, step menu button hidden, every More section open |
| Phone | No sideways scroll | `document.documentElement.scrollWidth <= innerWidth` on every step |
| Phone | Photo area the same on every step | `#stage` height identical across all six steps (545 px at 390×844 since 1.3) |
| Phone | Control area doesn't scroll with More closed | each visible `.controls`: `scrollHeight <= clientHeight`, including with a status line showing |
| Phone | Action bar fits | no button has `scrollWidth > clientWidth`; the bar's bottom is inside the safe area |
| Phone | Header is one row | header height matches a single button row |
| Phone | Nothing over the photo | no element other than the open step menu intersects `#stage` |

## 2. Navigation

| Device | Check | Pass when |
|---|---|---|
| Desktop | Resize across 760 px | narrow: tabs hide, step menu appears, More closes, nudge strip shows; wide: back again |
| Both | → buttons from Perspective | walks all six steps; Levels' button reads Overlay → |
| Phone | Step menu | lists all six steps and marks the current one; closes on a pick or an outside tap; a dot on the Levels entry and the step button while Levels has an unapplied draft |
| Phone | More options | opening it expands the control area; switching steps closes it and the photo returns to full size |

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

## 8. Export

| Device | Check | Pass when |
|---|---|---|
| Both | WebP where it can't encode | falls back to PNG with a notice |
| Both | Stubbed share: Share | button shown; the shared `File` has the right name and type; the app stays on Export with edits intact |
| Both | Stubbed share refused (`NotAllowedError`) | button becomes **Share now**; any edit cancels it |
| Both | No `navigator.share` / no `ClipboardItem` | Share and Copy hidden, not greyed; Download is the main button |

## 9. Session restore

| Device | Check | Pass when |
|---|---|---|
| Both | Edit (with an unapplied Levels draft), reload, Resume | same photo, edits, step and draft; corners not moved by detection |
| Both | Reload, Start fresh, reload | no prompt the second time |

## 10. Security

| Device | Check | Pass when |
|---|---|---|
| Desktop | `?crop.presets.0.label=<b>x</b>` | first chip still reads Free; the console notes the ignored setting |
| Both | Whole run | zero CSP errors in `read_console_messages` |
