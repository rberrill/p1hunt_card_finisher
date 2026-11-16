# The catalog

Everything the app can do, and the test cases that prove it, in one place. One file per area. Each capability is an entry; its test cases sit under it. A capability with no case under it is not covered, and a case cannot exist without a capability.

This folder is the only list. It is checked against the code by `node tests/selftest.js`. The check works both ways: an anchor that is no longer in the code fails, and so does an element id or a message in the code that no entry claims. A new control or message cannot be added without an entry for it.

## Areas

| Code | File | Area |
|---|---|---|
| STA | `start-and-session.md` | Start screen, opening a photo, Resume, autosave |
| TOP | `top-bar-and-navigation.md` | Top bar, steps, options sheets |
| VIEW | `photo-view.md` | Zoom, pan, fit, the loupe |
| PER | `perspective.md` | Perspective |
| ROT | `rotate.md` | Rotate |
| CRP | `crop.md` | Crop |
| LEV | `levels.md` | Levels |
| OVL | `overlay.md` | Overlay (logo) |
| EXP | `export.md` | Export |
| CNR | `corner-shots.md` | Corner shots |
| UPS | `upscale-question.md` | The Upscale question |
| QCD | `question-cards.md` | Question cards |
| PAIR | `front-and-back.md` | Front and back pairs |
| EDT | `edits-files.md` | Save edits and Load edits |
| DND | `drop-and-paste.md` | Drop and paste |
| KEY | `keyboard.md` | Keyboard |
| MSG | `messages.md` | Every message the app shows |
| STO | `storage-and-settings.md` | What is remembered |
| DEV | `links-and-developer.md` | Settings from a link, self-tests, the tuning panel |
| SEC | `security.md` | Untrusted input and the security policy |
| LAY | `layout.md` | Phone and wide layouts, safe areas, motion |
| PERF | `speed.md` | How long things take |
| FLOW | `journeys.md` | Whole listings, start to finish |

## A capability entry

```markdown
## ROT-04 Type an exact angle

Tap the angle beside **Straighten** to type a number of degrees; **Done** or Enter turns the photo to it.

- Risk: high
- Check: script
- Layout: both. On a phone the row lifts above the keyboard, with **±** and **Done**.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#rotateAngle`, `#rotateAngleField`, `#btnAngleDone`, `#btnAngleSign`
- Source: `js/app/rotate.js` (`readTypedAngle`, `commitTypedAngle`)
- Ruling: R1. An empty or unreadable entry keeps the old angle, with no undo step. The app differs today.
- Cases: none yet
```

**The heading** is the ID and a short name. IDs are an area code and a number, and are never reused. A retired entry moves to `retired.md` with the version and the reason.

**The description** is one to three plain sentences: what a person can do or what the app does. Name controls exactly as the screen does, in bold. No element ids or function names here.

**The fields**, in this order, all required:

| Field | Values |
|---|---|
| Risk | `high`, `medium` or `low`: how likely it is to break and how much that would hurt a listing |
| Check | How it can be verified. One of: `script` (a browser script decides), `script, touch` (the script needs touch input), `script, saved file` (the verdict needs the saved file inspected), `source` (a check on the code alone), `eye` (a script captures a screenshot and a person judges it), `phone` (it needs a real iPhone). Several may be listed when a capability has parts, the main one first; a note after a `;` or in brackets says which part needs which |
| Limit | Speed entries only: the longest the operation may take, with its unit, or `to be measured` until Rich has approved a number |
| Layout | `both`, `phone` or `wide`, then any difference between the two in a sentence |
| Added | The version it first shipped in. `1.10 baseline` for everything present when the catalog was first written |
| Changed | The version it last changed in, or `none` |
| Anchors | What ties the entry to the code, so a script can tell when either moves. See below. `none` only when the capability has no id, text, setting or key of its own |
| Source | The file and the function names. No line numbers: they drift |
| Ruling | Only when Rich has ruled on its behavior: the ruling's number, what it says, and whether the app differs today |
| Flag | Only for behavior that is consistent but may surprise: `to confirm`, and a sentence saying what |
| Cases | `none yet`, until its cases are written under it |

## Anchors

An anchor is something in the code that a script can find. Use the most specific ones the capability has.

| Kind | Written as | It must match |
|---|---|---|
| A control or element | `` `#btnDownload` `` | An id the app creates: the exact id string in `index.html` or `js/app/` |
| A message or label | `` "Nothing detected. Drag the corners into place." `` | The exact text in the code. For a message built with values in it, the longest fixed part, such as `"Upscale to "` |
| A setting | `` `CONFIG.export.quality` `` | A key in `js/config.js` |
| A keyboard key | `` `key:F` `` | A key the app listens for |
| A style hook | `` `.preset-chip` `` | A class the code or the stylesheet uses, only when there is no id |
| A value the app keeps | `` `app.loadDurationMs` `` | A name in the code, written as the code writes it. For the few entries about what the app records or exposes |
| A check in the selftest | `` "Privacy: sample photos carry no GPS location" `` | The check's name in `tests/selftest.js`, for entries that a source check proves |

## A test case

Cases are written to the language standard: a capable person who has never seen the app can run one and reach the same verdict as anyone else.

1. Plain words. No internal names, request numbers or element ids. Define a term where it is first used.
2. Each case stands alone. Its preconditions name the device, the browser, the build, the starting screen, and the photo by file name and folder.
3. One action per step.
4. Name controls exactly as the screen does, in bold. A control with no visible text is named by its tooltip and described once.
5. Every step has a result you can see or measure. Quote messages word for word. Give numbers with units.
6. One verdict: the case passes only if every result is seen. No "if", no "may", no "note how long".
7. Say what to record on a fail.
8. Ten steps at most.
9. US spelling, matching the app.

```markdown
### ROT-04.1 A typed angle turns the photo   [auto: all]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Rotate step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | <one action> | <one observable result> |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.
```

**A case for both layouts.** A case marked `[auto: all]` runs on a phone and on a wide screen, so a step that differs says both, once: "Open **Rotate options**: on a phone, tap the **Options** tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls."

**A named action.** When several steps always go together, a case may define them once above its table and then use the name as one step: "Type the angle N: tap the angle, type N, tap **Done**." The definition names every control; the step still has one result.

**A flag.** A case under an entry with `Flag: to confirm` carries the line `Flag: to confirm` under its title, with a sentence saying it is written to what the app does today.

**A ruling the app doesn't meet yet.** The case is written to the ruling. Under its title it says "Written to ruling R<n>; it fails until that is built (BUG-0NN)", and the bug is a row in `tests/bugs.md`.

**An eye case** may also hold results a script decides; only the rows that need a person's judgment are left to the eye. The description given to the judge says exactly what to look for.

The mark after the title says who decides: `[auto: …]` (a script), `[eye]` (a script saves the screenshot, a person judges it) `[phone]` (a person, on a real iPhone) or `[source]` (a check on the code itself, run by `node tests/selftest.js`; the case names the check and what it must print, and has no browser test).

**Where an automated case runs.** A case runs only where its verdict could come out differently (Rich, 2026-11-15):

| Mark | Runs in |
| --- | --- |
| `[auto: phone]` | Chromium at phone size (390 × 844, touch). The default: the phone is the primary use |
| `[auto: both]` | Chromium at phone size and at desktop size (1280 × 800). For a capability whose wide layout behaves differently (its Layout field says so) |
| `[auto: desktop]` | Chromium at desktop size only. For a keyboard, a mouse wheel, drop, paste, or a wide-only capability |
| `, webkit` added to any of those | WebKit as well as Chromium. Only where the browser engine could change the answer: layout measurements, saved files and image encoding, storage and Resume, the file input, the engine worker, gestures |
| `[auto: small]` | Chromium at 375 × 667, for the few cases about a narrow phone |
| `[auto: all]` | The same as `[auto: both, webkit]` |

A plain-logic case (tap a control, the state changes) is `[auto: phone]`. Before a release, one switch runs every case in WebKit too.

An `auto` or `eye` case has exactly one test in `tests/automation/` whose title starts with its ID.
