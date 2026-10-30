---
paths:
  - "index.html"
---

# `index.html` rules

`tests/selftest.js` enforces all of these.

- The Content Security Policy `<meta>` stays **before any stylesheet or script**, with `default-src 'none'`, `script-src 'self'`, `style-src 'self'`, `base-uri 'none'`, and no `unsafe-*`, wildcards or other hosts. The engine worker's `blob:` is the one exception.
- Nothing inline: no `<script>` without `src`, no `style="…"`, no `on…="…"` handlers. Styles go in `css/app.css`.
- Classic `<script src>` only, never `type="module"` (modules fail from `file://`). Relative paths only: no leading slash, no host.
- Every asset link carries `?v=<appVersion>` matching `CONFIG.appVersion` in `js/config.js`. Change them together.
- Script order: `js/config.js` → `js/engine.js` → `js/app/core.js` → … → `js/app/main.js`.
