# Browser recipes (preview pane)

- **Servers:** `straightener` serves this folder on 8766. `subfolder` serves the parent folder on 8771, which mimics Pages' `/p1hunt_card_finisher/` subfolder URL. Rich's own LAN server uses 8765, so the preview avoids it.
- **Fresh assets:** the `?v=` doesn't change during development, so the browser may serve stale JS or CSS. Before navigating, run `fetch(url, {cache: 'reload'})` for each asset link in `index.html`.
- **Hidden pane:** rendering pauses. Shim it first: `window.requestAnimationFrame = f => setTimeout(() => f(performance.now()), 16)`. `__straightener.draw()` forces a render.
- **Load a sample:** `const b = await (await fetch('samples/IMG_9136.JPEG')).blob(); await __straightener.openFile(new File([b], 'IMG_9136.JPEG', {type: 'image/jpeg'}))`. The extension is uppercase `.JPEG`.
- **Regression:** `document.head.append(Object.assign(document.createElement('script'), {src: 'tests/sample-regression.js'}))`, then `await window.__regression`. The CSP blocks `eval` in the page, so `javascript_tool` can't paste the file in.
- **Overlay test logo:** draw on a canvas, `toBlob`, then on the Overlay step call `CF.addOverlayFile(new File([blob], 'logo.png', {type: 'image/png'}))`. Afterwards, `Session.del('overlay')` as well as `Session.clear()`, which keeps the saved logo.
- **Share:** the preview browser has no `navigator.share`. Stub it: `navigator.canShare = () => true; navigator.share = async d => { window.__shared = d; }`. Then check that the Share button shows, that it receives a `File` of the right type and name, and the cancel (`AbortError`) and refused (`NotAllowedError` → **Share now**) paths.
- **Phone emulation:** `resize_window` with `mobile` (or any width under 768) also emulates touch and a mobile user agent. Reload after switching so the layout's load-time checks re-run. Clicks still arrive as mouse events; drive touch-only paths (pinch, double-tap) with dispatched `PointerEvent`s with `pointerType: 'touch'`.
- **Screenshots:** they sometimes come back tiled or stale. Retake once before trusting one.
