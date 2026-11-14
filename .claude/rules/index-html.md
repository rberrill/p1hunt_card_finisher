---
paths:
  - "index.html"
---

# `index.html` rules

`tests/selftest.js` enforces all of these.

- The Content Security Policy `<meta>` stays **before any stylesheet or script**, with `default-src 'none'`, `script-src 'self'`, `style-src 'self'`, `base-uri 'none'`, and no `unsafe-*`, wildcards or other hosts. The engine worker's `blob:` is the one exception.
- Nothing inline: no `<script>` without `src`, no `style="…"`, no `on…="…"` handlers. Styles go in `css/app.css`.
- Classic `<script src>` only, never `type="module"` (modules fail from `file://`). Relative paths only: no leading slash, no host.
- Every asset link (scripts, styles and the `icons/` links) carries `?v=<appVersion>` matching `CONFIG.appVersion` in `js/config.js`, and its file must exist. `set-version.js` changes them together.
- The icons are drawn from `icons/icon.svg`; after changing it, regenerate `favicon.ico` and `apple-touch-icon.png` with `node archive/tools/make-icons.js` (local; it drives Chrome).
- Script order: `js/config.js` → `js/engine.js` → `js/app/core.js` → … → `js/app/main.js`. The parts (`js/app/parts/*.js`, `icon.js` first) load together, before `shell.js` and the step modules.
- During the 1.10 redesign each step has a marked section (`<section data-panel="…">`, and from phase 2 its host in the control area). Edit only your own step's section.
