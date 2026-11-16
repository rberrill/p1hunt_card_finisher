# Untrusted input and the security policy

How the app treats what comes from outside it (links, files, storage), the page's security policy, and what the public code may not contain.

## SEC-01 The page's security policy

The page carries a strict content security policy, before any style or script: nothing is allowed by default; scripts and styles come only from the app's own files; the image engine's worker comes from the page itself; images only from the app's files and the page's own photos; no base address and no form posting; and the page sends no referrer.

- Risk: high
- Check: source
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `"default-src 'none'"`, `"script-src 'self'"`, `"style-src 'self'"`, `"base-uri 'none'"`
- Source: `index.html` (the policy and referrer metas), `tests/selftest.js` (the security check)
- Cases: none yet

## SEC-02 Nothing leaves the device

Once the page's own files have loaded, opening, editing and exporting a photo make no network request: the photo never leaves the device.

- Risk: high
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `"connect-src 'self'"`, `"Everything stays on this device."`
- Source: `index.html` (the policy meta)
- Cases: none yet

## SEC-03 A link can set only number and on/off settings

A link can set only settings that already exist and are numbers or on/off. Text, lists and groups of settings can't be set from a link, and a name such as `__proto__` is refused.

- Risk: high
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.storageKey`, `CONFIG.crop.defaultPreset`, `"URL settings ignored (unknown, not a number / on-off setting, "`
- Source: `js/engine.js` (`applyConfigOverrides`), `js/app/core.js` (the link overrides at load)
- Cases: none yet

## SEC-04 Size and memory limits can only be lowered from a link

The 44 settings that size images, memory or loops each have a safe range. A link can lower a cap but never raise it, and a value outside the range is rejected.

- Risk: high
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.maxOutputArea`, `CONFIG.export.longEdge`, `CONFIG.overlay.maxBytes`, `CONFIG.detect.workingSize`
- Source: `js/config.js` (`CONFIG_LIMITS`), `js/engine.js` (`applyConfigOverrides`)
- Cases: none yet

## SEC-05 A loaded edits file is checked field by field

When **Load edits** reads a file, every field is checked; a malformed field is reset to its default and never applied, and a warning names the fields that were reset.

- Risk: high
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnLoadEdits`, `"Some settings in these edits weren’t valid and were reset: "`
- Source: `js/app/export.js` (`loadEdits`), `js/app/state.js` (`cleanState`), `js/engine.js` (`sanitizeState`)
- Cases: none yet

## SEC-06 A bad edits file is refused before anything changes

An edits file over 8 MB, one that isn't valid JSON, or one that isn't a Card Finisher edits file (wrong shape or version) is refused with a message, before anything is applied.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.export.editsMaxBytes`, `"That file is too large to be a Card Finisher edits file."`, `"That file isn’t valid JSON."`, `"That isn’t a Card Finisher edits file."`
- Source: `js/app/export.js` (`loadEdits`, `looksLikeEdits`)
- Cases: none yet

## SEC-07 A logo inside an edits file is checked

A logo carried inside an edits file must be a PNG, WebP, JPEG or SVG, and at most 5 MB once decoded; otherwise it is left out with a warning.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.overlay.maxBytes`, `"The overlay in these edits couldn’t be read, so it was left out."`
- Source: `js/app/overlay.js` (`overlayFromEdits`, `register`)
- Cases: none yet

## SEC-08 A stored session is checked on Resume

On **Resume**, the stored session is checked like an edits file: its edits are cleaned, its step must be a real step, the stored photo's size must match the photo, and a malformed pair is dropped with a warning while the open side resumes on its own.

- Risk: high
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnResume`, `"The saved pair wasn’t valid, so it was reset. "`, `"[card-finisher] pair not restored:"`
- Source: `js/app/state.js` (`openFile`, `restoreLevelsDraft`), `js/app/start-screen.js` (`resumeSession`), `js/app/pair.js` (`restorePair`, `isPairRecord`, `finishResume`)
- Ruling: R23. A Resume whose stored size doesn't match opens the photo fresh with the amber warning "Couldn’t restore your edits, so the photo was opened fresh." The app differs today. New wording, to be approved by Rich.
- Cases: none yet

## SEC-09 Remembered preferences are checked before use

Remembered preferences are checked like an edits file before they are used; an unknown or malformed value falls back to the default.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.storageKey`, `CONFIG.cornerShots.output`, `CONFIG.pair.output`
- Source: `js/app/state.js` (`newState`, `cleanState`), `js/app/corner-shots.js` (`storedOutput`), `js/app/pair.js` (`storedPairOutput`)
- Cases: none yet

## SEC-10 What a logo file may be

A logo file must be a PNG, WebP, JPEG or SVG of at most 5 MB, and an SVG must state its size (a width and height, or a viewBox). It is only ever drawn as a picture, never run as part of the page.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `"That file type isn’t supported. Use PNG, WebP, JPG or SVG."`, `"That SVG has no width, height or viewBox, so it can’t be sized. "`, `" MB. The overlay limit is "`, `CONFIG.overlay.maxBytes`
- Source: `js/app/overlay.js` (`imageTypeOf`, `addOverlayFile`, `decodeSvg`, `svgSize`, `register`)
- Flag: to confirm. The Overlay step's hint always says "up to 5 MB", though a link can lower the limit, and the refusal then names the lower one.
- Cases: none yet

## SEC-11 File names are shown as plain text, cut short

Names from photos and edits files are shown only as plain text, never as markup, and cut to 60 characters where they appear (the Resume card, the edits-file warning). A name kept for a reopened file is cut to 200 characters.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#resumeName`, `"Edits were saved for “"`
- Source: `js/app/core.js` (`shortText`), `js/app/start-screen.js` (`resumeName`, `resumeSession`), `js/app/export.js` (`loadEdits`), `js/app/pair.js` (`restorePair`)
- Cases: none yet

## SEC-12 No HTML is built from text

The app never builds HTML from text anywhere: no markup strings, no `eval`, no code in strings. The self-test scans the code for it.

- Risk: high
- Check: source
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `"Security: no HTML-string sinks or eval in js/ (build DOM with CF.makeEl)"`
- Source: `tests/selftest.js` (the security check), `js/app/core.js` (`makeEl`)
- Cases: none yet

## SEC-13 Nothing private in the public files

The published files hold no private network address or local drive path, and the sample photos carry no GPS location. The self-test checks both.

- Risk: medium
- Check: source
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `"Privacy: sample photos carry no GPS location"`, `"Privacy: no private network addresses or local paths in published files"`
- Source: `tests/selftest.js` (`hasGps`, the privacy check)
- Cases: none yet

## SEC-14 No console error in normal use

Opening a photo, working through every step and exporting it puts no error in the browser's console (and the security policy blocks nothing).

- Risk: high
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: none
- Source: every module; `js/app/main.js` (`init`)
- Cases: none yet

## SEC-15 A logo from storage is checked before use

A logo read back from the device's storage (the saved logo, this photo's logo, or a pair's other side's logo) is checked like a logo file: it must be a known image type with its bytes intact, or it is skipped.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnUseSaved`, `CONFIG.session.dbName`
- Source: `js/app/overlay.js` (`register`, `setSaved`, `ensureOverlayImage`, `restoreOverlayRecord`)
- Cases: none yet
