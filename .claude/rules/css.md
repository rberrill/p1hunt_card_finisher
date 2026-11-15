---
paths:
  - "css/**/*.css"
---

# CSS rules (`css/app.css`)

- Phone rules live in the `@media (max-width: 760px)` block at the end of the file. **Phone-only behaviors** (the sideways chip scroller, the tab bar, the sheet) **must stay inside it**: a scroller rule outside it once hid half the Crop presets on desktop.
- **The 1.10 redesign is being built in phases** (CLAUDE.md, "The 1.10 redesign"). The rules below are the agreed layout (Rich, 2026-11-14). Every step is converted; what is left of the old stylesheet (`.btn`, `.row`, the number inputs) serves only the debug panel. Never add to it.
- The phone control area is 200 px on every step, in three rows: a 44 px label row, a 44 px control row and a 70 px tool row (Export uses four rows in the same 200 px). The photo never changes size between steps, and the area does not scroll: what doesn't fit goes in the step's sheet. Measure it after a layout change: the photo is 544 px tall at 390×844 in a browser, which has no safe area (the plan's frames draw 524 with 20 px for it; a home-screen app gives 463, frame FC1). Claude's reading of frame K1, 2026-11-14.
- **Nothing that rises from the screen's bottom edge is `position: fixed`.** iOS 26 Safari colors its own bar from what a fixed element shows at that edge at the moment it appears, so a sheet starting its rise with a red button there turned the bar red (Rich's UAT, 2026-11-14). A sheet's layer is `position: absolute` against `#app`, cut at its edges.
- Options live in a sheet over the lower half of the photo, opened from the grabber on the control area's top edge: a tab that rises 24 px over the photo as an overlay, so the area stays 200 px and the photo keeps its size (Rich, 2026-11-15). The open sheet carries the same tab; there is never a second one on screen. A sheet never resizes the photo; it is at most about 470 px tall and scrolls inside when its content is taller. On desktop the same options are always open, inline in the 380 px panel.
- **Colors:** matte black, white and one red for the single main action on a screen. Amber only on a warning; no green. Selected is a solid white fill (a mode, a chip, a segment); a switch that is on has a white ring. Use the tokens in `:root` (they mirror `CONFIG.theme`), never a literal color in a rule.
- **Motion:** only `transform` and `opacity` animate, between 80 and 280 ms; anything that tracks a finger has no easing. Every transition has a `prefers-reduced-motion` answer: travel and scaling go, short fades stay, progress still moves. (The timings and easings are Claude's calls in the plan, accepted with it.)
- Nothing blocks the photo, except a temporary flyout the user opens or an alert they must answer before they can go on (the rule in CLAUDE.md).
- A part's rules sit under its own banner comment, named as in the plan's component inventory (top bar, tab bar, adjustment line, status, ruler, slider, tool, action button, chip, segmented control, nudge pad, sheet, alert card, toast, progress line). A step's own rules sit under that step's banner. Edit only your own banner's block.
- Tap targets are ≥ 44 px; respect the safe-area padding (`viewport-fit=cover`).
- After any layout change, check 390×844, 375×667 and 1280×800 (the `verify` skill). Claude's verification practice since 1.3, not a rule Rich set; the sizes are his iPhone, the smallest common iPhone and a laptop.
