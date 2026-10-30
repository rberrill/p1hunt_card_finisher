# Behavior and layout checks

Run the rows for the areas a change touches; run them all for a release. "Phone" means 390×844 (and 375×667 for layout rows) with touch emulation.

## Layout (phone)

| Check | Pass when |
|---|---|
| No sideways scroll | `document.documentElement.scrollWidth <= innerWidth` on every step |
| Photo area the same on every step | `#stage` height identical across all six steps (545 px at 390×844 since 1.3) |
| Control area doesn't scroll with More closed | each visible `.controls`: `scrollHeight <= clientHeight`, including with a status line showing |
| Action bar fits | no button has `scrollWidth > clientWidth`; the bar's bottom is inside the safe area |
| Header is one row | header height matches a single button row |
| Nothing over the photo | no element other than the open step menu intersects `#stage` |
| More options | opening it expands the control area; switching steps closes it and the photo returns to full size |
| Step menu | lists all six steps and marks the current one; closes on a pick or an outside tap; the Levels entry and the step button show a dot while Levels has an unapplied draft |
| iOS long-press guards | computed `-webkit-touch-callout: none` and `user-select: none` on the photo, handles and nudge buttons; form fields still selectable |

## Layout (desktop and the 760 px switch)

| Check | Pass when |
|---|---|
| Header tabs, side panel | tabs visible, step menu button hidden, every More section open |
| Crop presets | all presets and Swap visible, wrapping onto more lines (no hidden overflow) |
| Resize across 760 px | narrow: tabs hide, step menu appears, More closes, nudge strip shows; wide: back again |

## Behavior

| Area | Check | Pass when |
|---|---|---|
| Load | 4032×3024 photo | preview in well under 1 s |
| Load | `?selftest=1` | toast reads `main n/n, worker n/n`, all passing |
| Perspective | drag a corner | loupe shows; mini preview updates live; one undo step per drag |
| Perspective | phone: drag on the right half, then the left half | loupe pins top-left, then top-right; never under the finger |
| Perspective | phone: double-tap a handle twice | zooms 6× centered on it, then back to fit |
| Perspective | phone: ▶ three times, then Undo | one screen pixel per tap; loupe stays up between taps and for 4 s; one Undo restores the handle and hides the loupe |
| Perspective | Preview, try a drag, Corners | corrected card fills the photo; handles locked; back to corners |
| Rotate | Ctrl+Z / Shift+Ctrl+Z with a slider focused | undo and redo work (also R7) |
| Crop | portrait card, tap 5:4 | chip reads 4:5, box portrait, labels 3:4 · 4:5 · 2:3 · 9:16 · 5:7 card |
| Crop | Swap, pick 3:2, Swap | landscape labels, 3:2 stays landscape, second Swap back to portrait (2:3) |
| Crop | rotate 90° (or orientation Landscape), back to Crop | crop and labels switch to landscape |
| Levels | White, then hold on the photo | loupe with a sampling circle; "W" marker after release; swatch fills |
| Levels | a light spot as the black point | rejected: "too light to be a black point" |
| Levels | pick, go to Export without applying | dot on Levels; Export warns; the exported file has no levels |
| Levels | Auto, Apply, hold the photo, release; Clear, Apply | hold shows without levels; Clear + Apply leaves none |
| Overlay | add a test logo, drag, pinch, tap each of the nine rings | stays fully inside; a still tap snaps; a drag on a ring moves; rings hide during gestures |
| Overlay | other steps | the logo shows only on Overlay and Export |
| Export | WebP where it can't encode | falls back to PNG with a notice |
| Export | stubbed share: Share | button shown; the shared `File` has the right name and type; the app stays on Export with edits intact |
| Export | stubbed share refused (`NotAllowedError`) | button becomes **Share now**; any edit cancels it |
| Export | no `navigator.share` / no `ClipboardItem` | Share and Copy hidden, not greyed; Download is the main button |
| Session | edit (with an unapplied Levels draft), reload, Resume | same photo, edits, step and draft; corners not moved by detection |
| Session | reload, Start fresh, reload | no prompt the second time |
| Security | `?crop.presets.0.label=<b>x</b>` | first chip still reads Free; console notes the ignored setting |
| Security | whole run | zero CSP errors in `read_console_messages` |
