---
paths:
  - "samples/**"
  - "tests/sample-regression.js"
---

# Sample photos and the regression script

- The repo is public. **A new sample photo must have no GPS location**: strip EXIF location before adding it. `tests/selftest.js` fails if any sample has a GPS block.
- Sample files use an uppercase `.JPEG` extension; the script fetches `samples/${name}.JPEG`.
- A new sample needs hand-placed corners in `GROUND_TRUTH` (source px, TL TR BR BL) and a baseline in `RECORDED`, and a row in the baseline table in `tests/README.md`.
- Regression thresholds are the v1.0 acceptance bar. Loosen one only with Rich's agreement, and say why in the commit.
- The script must stay loadable as a plain `<script>` (it sets `window.__regression`), because the page's CSP blocks `eval`.
