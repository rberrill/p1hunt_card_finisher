---
paths:
  - "js/**/*.js"
  - "tests/**/*.js"
  - ".claude/**/*.js"
  - "css/**/*.css"
  - "index.html"
---

# Code style: write for the reviewer

The test for every line is whether someone new to the codebase could review it without first
decoding it. Short code that needs decoding fails that test. These rules apply to new code and to
any code you touch.

`node tests/selftest.js` enforces the parts a tokenizer can see (`tests/style-check.js`): line
length, short names, one statement per line and one declaration per `const` / `let` / `var`. The
rest is for review.

## Names

- **Say what it is.** `quad`, `corners`, `options`, `overlay`, `levels`, `state`, `geometry`,
  `points`, `score`. Never `q`, `o`, `ov`, `lv`, `st`, `geo`, `pts`, `sc`.
- **One or two letters are allowed only for:**
  - `i`, `j`, `k`: integer loop indices, in loops short enough to see whole;
  - `x`, `y`, `z`, `dx`, `dy`: a coordinate and its delta;
  - `id`, `ok`: real words;
  - `el` (a DOM element, as in the abbreviations below);
  - `CF` (the shell's namespace), and `fs`, `os` and `vm` (Node's modules).
  Width and height are `width` and `height` (or `cropWidth`, `frameHeight`), never `w` / `h`.
- **Abbreviations:** only the ones listed here. Spell out everything else.
  `ctx` (a canvas 2D context), `el` (a DOM element), `img` (an image), `src` / `dst` (the two
  ends of a transform or copy), `rect` (rectangle), `lut` (lookup table), `rgb`, `max` / `min`.
- **Units go in the name** when a number could be in more than one: `radiusPx`, `angleDeg`,
  `angleRad`, `delayMs`, `insetPct` (0–100), `areaFrac` (0–1).
- **Coordinate frames** are spelled out, matching `docs/architecture.md`: `source`, `perspective`,
  `rotated`, `output`. A matrix is named for what it maps: `sourceToOutput`, `outputToSource`.
  A point or size says its frame when it isn't obvious: `cornersRotated`, `frameWidthPx`.
- **Booleans** read as yes/no questions: `isConvex`, `hasLogo`, `canShare`, `wasClamped`.
- **Functions** are verbs (`solveHomography`, `drawLoupe`), except pure getters named for what
  they return (`quadArea`, `cropRatio`).
- **Formula notation (engine only).** Where a function implements a published formula, its doc
  comment writes the formula, and the local names match its symbols (`k2`, `n3`, `u0`), those
  short names are allowed **inside that function only**. The comment lists them on a line
  starting `Formula names:`, which is what the style check reads. Everywhere else, spell it out.

## Case

| Kind | Case | Examples |
|---|---|---|
| Variables, functions, object keys | camelCase | `cropRect`, `drawResult` |
| Namespaces, classes, objects of methods | PascalCase | `CardEngine`, `Quad`, `Mat3`, `Session` |
| Module-level constant tables, defaults, limits | UPPER_SNAKE | `DETECT_DEFAULTS`, `BLOCKED_KEYS` |
| CSS classes and custom properties | kebab-case | `.step-number`, `--panel-bg` |
| HTML ids (JS handles) | camelCase | `stepMenu`, `btnOpen` |

In HTML and CSS, `btn` is allowed as the button class and id prefix (`.btn`, `btnShare`).

Acronyms are one word in camelCase: `levelsLut`, `toSrgb`, `parseSvg`, not `levelsLUT`.

## Layout

- **Lines are at most 100 characters**, comments included. The one exception is the Content
  Security Policy `<meta>` in `index.html`, which stays on one line.
- **One statement per line.** No `if (a) x(); if (b) y();` on one line, no `a = 1; b = 2;`.
  A guard clause that fits (`if (!quad) return null;`) stays on one line.
- **One declaration per `const` / `let`.** A destructure is one declaration.
- **Braces** on any `if` / `for` / `while` whose body doesn't fit on the same line.
- **When something doesn't fit, break it one item per line**, closing bracket on its own line:
  objects (one property per line, trailing comma), calls (one argument per line), and
  conditions (one `&&` / `||` operand per line, the operator leading).
- **No nested ternaries.** Use `clamp()`, a small named function, or `if` / `else`.
- **Functions fit on a screen** (about 50 lines). Longer ones split into named steps; the
  outer function then reads as the list of steps.
- **No magic numbers.** A tunable goes in `CONFIG`; a fixed constant gets a named
  `UPPER_SNAKE` const with a comment saying where it comes from (`CARD_ASPECT`, `TAN_22_5_DEG`).

## Comments

- **Every function has a comment** above it: what it does, what goes in and comes out, and the
  units and frame of any coordinates. Exported engine functions use `/** … */` with the
  signature, as `computeGeometry` and `detect` do now.
- **Comment why, not what.** The code says what; the comment says why it's done this way,
  what it guards against, or where the formula comes from.
- Section banners (`/* ==== DETECTION ==== */`) stay, one per section, listed in the file header.

## Hot loops

Pixel loops (`warp`, blur, Canny, Hough, Levels) run on full-resolution photos on a phone.
Keep them flat: no closures or array allocation per pixel. Long names cost nothing at run time.
A small helper called per pixel (`clampIndex`, `writeBicubic`) measured no slower, but measure
any change to these loops before and after: load each engine version in its own Node process and
compare medians of several runs. Timing both versions in one process, or in the browser, is too
noisy to trust (that once showed a 2× "slowdown" that wasn't there).

## Names you must not change

These are read from outside the code, so renaming them breaks saved data, links or tests:

- `CONFIG` keys (links in the wild set them) and `CONFIG_LIMITS` keys;
- edit-state fields and the edits-file format (`docs/architecture.md`), including
  overlay placement `{id, aspect, cx, cy, w, opacity}`;
- `storageKey`, IndexedDB and localStorage keys, `Session` keys (`'overlay'`, `'photoOverlay'`)
  and the fields of what they store (`{ buf, type, name }`, a saved logo's `settings`);
- the edits file's `overlayImage` (`{ id, type, name, data }`);
- `window.__straightener` and its members, `CardEngineModule`, the `CardEngine` global, `CF`.

Inside the code, a local name can differ from the stored key:
`const { w: widthFrac } = state.overlay;`.
