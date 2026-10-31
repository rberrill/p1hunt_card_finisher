---
paths:
  - "samples/**"
  - "tests/sample-regression.js"
---

# Sample photos and the regression script

- The repo is public. **A new sample photo must have no GPS location**: strip EXIF location before adding it. `tests/selftest.js` fails if any sample has a GPS block.
- Sample files sit in `samples/` itself (the GPS check doesn't look in subfolders) with an uppercase `.JPEG` extension; the script fetches `samples/${name}.JPEG`.
- A new sample needs Rich's hand-placed corners in `GROUND_TRUTH` (source px, TL TR BR BL; he places them in the app and sends the Save edits files), its measured top-pick and best-of-3 errors in `BASELINE`, and a row in the table in `tests/README.md`. His edits files are kept in `archive/sample-corners/`.
- R1 holds each photo to its own baseline by group (within 1% / near miss / wrong shape, in `tests/README.md`). Lower a baseline in the change that improves it. Raise one, or loosen any threshold, only with Rich's agreement, and say why in the commit.
- When tuning detection, don't look at the `HELD_OUT` photos until the end; report the scoreboard before and after.
- The script must stay loadable as a plain `<script>` (it sets `window.__regression`), because the page's CSP blocks `eval`.
