---
paths:
  - "css/**/*.css"
---

# CSS rules (`css/app.css`)

- Phone rules live in the `@media (max-width: 760px)` block at the end of the file. **Phone-only behaviors** (the sideways chip scroller, the step menu button) **must stay inside it**: a scroller rule outside it once hid half the Crop presets on desktop.
- The phone control area is `.controls { height: 192px }` on every step, so the photo never changes size between steps (Rich's 1.3 decision: a fixed area holding the everyday controls, with the rest under More options, which expands it). The area scrolls when its contents are taller, and that's fine; the goal is short, readable, intuitive controls, not a ban on scrolling. Perspective with a status line is the tallest case: measure it after a layout change so the everyday controls still fit.
- Nothing blocks the photo, except a temporary flyout the user opens or an alert they must answer before they can go on (the rule in CLAUDE.md).
- **Section boxes** (`.section-box`) are darker than the panel, never lighter: buttons, dropdowns and segmented controls are already the lighter grey (`--panel2`) and vanish on it. Box only a section whose buttons save something other than the main export.
- Tap targets are ≥ 44 px; respect the safe-area padding (`viewport-fit=cover`).
- After any layout change, check 390×844, 375×667 and 1280×800 (the `verify` skill).
