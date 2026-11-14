---
paths:
  - "css/**/*.css"
---

# CSS rules (`css/app.css`)

- Phone rules live in the `@media (max-width: 760px)` block at the end of the file. **Phone-only behaviors** (the sideways chip scroller, the tab bar, the sheet) **must stay inside it**: a scroller rule outside it once hid half the Crop presets on desktop.
- **The 1.10 redesign is being built in phases** (CLAUDE.md, "The 1.10 redesign"). The rules below are the agreed layout (Rich, 2026-11-14). The old layout's rules (`.controls { height: 192px }`, `details.more`, `.action-bar`, `.step-menu`) are deleted step by step as each phase converts its part; never add to them.
- The phone control area is 200 px on every step, in three rows: a 44 px label row, a 44 px control row and a 70 px tool row (Export uses four rows in the same 200 px). The photo never changes size between steps, and the area does not scroll: what doesn't fit goes in the step's sheet. Measure it after a layout change (photo 524 px tall at 390×844).
- Options live in a sheet over the lower half of the photo, opened from the grabber on the control area's top edge (the grabber straddles the edge, so the area stays 200 px). A sheet never resizes the photo; it is at most about 470 px tall and scrolls inside when its content is taller. On desktop the same options are always open, inline in the 380 px panel.
- **Colors:** matte black, white and one red for the single main action on a screen. Amber only on a warning; no green. Selected is a solid white fill (a mode, a chip, a segment); a switch that is on has a white ring. Use the tokens in `:root` (they mirror `CONFIG.theme`), never a literal color in a rule.
- **Motion:** only `transform` and `opacity` animate, between 80 and 280 ms; anything that tracks a finger has no easing. Every transition has a `prefers-reduced-motion` answer: travel and scaling go, short fades stay, progress still moves. (The timings and easings are Claude's calls in the plan, accepted with it.)
- Nothing blocks the photo, except a temporary flyout the user opens or an alert they must answer before they can go on (the rule in CLAUDE.md).
- **Section boxes** (`.section-box`, old layout only, until phase 4 converts Export): darker than the panel, never lighter. Box only a section whose buttons save something other than the main export.
- A part's rules sit under its own banner comment, named as in the plan's component inventory (top bar, tab bar, adjustment line, status, ruler, slider, tool, action button, chip, segmented control, nudge pad, sheet, alert card, toast, progress line). A step's own rules sit under that step's banner. Edit only your own banner's block.
- Tap targets are ≥ 44 px; respect the safe-area padding (`viewport-fit=cover`).
- After any layout change, check 390×844, 375×667 and 1280×800 (the `verify` skill). Claude's verification practice since 1.3, not a rule Rich set; the sizes are his iPhone, the smallest common iPhone and a laptop.
