---
paths:
  - "css/**/*.css"
---

# CSS rules (`css/app.css`)

- Phone rules live in the `@media (max-width: 760px)` block at the end of the file. **Phone-only behaviors** (the sideways chip scroller, the step menu button) **must stay inside it**: a scroller rule outside it once hid half the Crop presets on desktop.
- The phone control area is `.controls { height: 184px }` on every step, so the photo never changes size between steps. Opening More options expands it; check that nothing scrolls with More closed, even with a status line showing.
- Nothing floats over the photo. The only exception is the step menu while it's open.
- Tap targets are ≥ 44 px; respect the safe-area padding (`viewport-fit=cover`).
- After any layout change, check 390×844, 375×667 and 1280×800 (the `verify` skill).
