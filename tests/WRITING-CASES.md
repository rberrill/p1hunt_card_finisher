# Writing test cases and their tests

For whoever adds cases to the catalog and the Playwright tests that run them. Read first:

- `tests/catalog/README.md`: an entry's format, the language standard, the template, where a case runs.
- `tests/catalog/rulings.md`: Rich's rulings. FIX means the app differs today.
- `tests/README.md`, "Automated browser cases".
- `tests/catalog/rotate.md` and `tests/automation/rotate.spec.js`: the finished pilot. Copy its conventions: a start-up function per area, small step functions, a shared body for twin cases, each `check` description equal to the row's expected result.
- `tests/automation/support/app.js` and `case.js`: the shared helpers and the `check` fixture.
- `.claude/rules/code-style.md`: the test code must pass it.

## For every capability entry in your area

1. **Cases first, then tests,** entry by entry. Replace `- Cases: none yet` with `- Cases: N` and write the cases under the entry in the template. One verdict per case; split, don't bundle. Every entry ends with at least one case of its own.
2. **The language standard.** A capable person who has never seen the app can run the case. Controls named exactly as on screen, in bold; one action per step; a result you can see in every row; no jargon, element ids or function names; ten rows at most. Name the sample photo from `samples/`.
3. **Where it runs.** `[auto: phone]` is the default (Chromium, phone size). `[auto: both]` only where the entry's Layout field gives a difference this case touches. `[auto: desktop]` for keyboard, mouse wheel, drop, paste, hover or a wide-only capability. Add `, webkit` only where the engine could change the answer: layout measurements, saved files and encoding, storage and Resume, the file input, the worker, pointer gestures, focus. Avoid `[auto: all]`. An entry whose Check is `phone` gets a `[phone]` case (prose only, no test) plus an automated case for any part a script can prove. An `eye` entry gets an `[eye]` case, with an exact description of what the judge looks for.
4. **One test per automated or eye case,** in `tests/automation/<area file name>.spec.js`. Its title starts with the case ID and ends with the tags: `test('EXP-07.1 Download saves a JPEG [phone] [webkit]', …)`. An eye case's test is tagged for where it is captured.
5. **Drive the app as a person would:** the real controls, `setInputFiles` on the real inputs, real downloads. Every tap and drag goes through `handFor(page, testInfo)`; pass the hand to `goToStep`. Read the app's state (`window.__straightener`, `CF`) only to check a result, never to act when a control exists.
6. **Prove each test can fail:** break its action or its expectation once, see it fail, restore it. Never edit `js/`, `css/` or `index.html`, not even for a moment.
7. **A ruling the app doesn't meet.** Write the case to the ruling. Start its test with `test.fail(true, 'BUG-0NN')`, and run it once without the mark to confirm it fails for the reason the ruling gives. Where a known-defect check is a plain value comparison, compare without a retrying `expect`, so it fails fast. Where the ruling needs wording Rich hasn't approved, the case says "a warning that says <meaning>" and the test checks the behavior, not the words.
8. **A flag.** Under an entry with `Flag: to confirm`, write the case to today's behavior and put `Flag: to confirm` under its title.
9. **Something looks wrong and no ruling covers it.** Don't fix it and don't write the case to your own idea of right. Write it to today's behavior, flag it, and report it with evidence.
10. **Share.** No case or test exercises a desktop browser's real share feature (Rich, 2026-11-15). A stand-in for `navigator.share` and `navigator.canShare`, installed with `page.addInitScript`, may prove the app's side. The real share sheet is a `[phone]` case.
11. **A question card closing:** its layer's `hidden` lags by about 200 ms. Wait on `CF.isAlertOpen` or on visibility.

## What a review looks for

A second reader checks every new or changed case. The faults found most often in the first review:

- A result nobody can see ("no longer armed", "the levels are applied", "saved"): name what is on screen instead.
- A step a person can't do on the device the case names: a minus sign on the iPhone's number pad, a press placed 12 px from a handle, a value read from a tooltip on a phone.
- A test that can't fail for the reason the case gives: a photo too small to show the difference, an expected value taken from the app's own list, a check on an element that is always there (`toBeVisible` on a button that is only ever greyed out).
- A test that checks less than its rows say. Every row's result is checked, in order.
- A capability whose description names two things and whose cases prove one.
- A touch behavior with no `[phone]` case: anything where Safari's own gestures (double-tap zoom, the back swipe, the page pinch, the long-press menu) could take the touch from the app.

## When several writers work at once

- Edit only your own area's catalog file, spec file and `tests/automation/support/<area>.js`. Read the shared helpers; don't edit them, `tests/bugs.md` or the configuration. Say in your report which of your helpers should become shared.
- Use the bug numbers you were given, and write your rows, in the format of `tests/bugs.md`, to the file you were told. One row per defect, naming every case it makes fail.
- Run only your own spec, with your own port and run folder: `CARD_FINISHER_PORT=<port> CARD_FINISHER_RUN_DIR=<folder> npx playwright test automation/<file>.spec.js`.
- Finish with your spec passing (known defects pass through `test.fail`), nothing flaky when repeated, and `node tests/selftest.js` reporting no problem in your area.
