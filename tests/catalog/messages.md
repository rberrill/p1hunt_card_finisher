# Messages

Every message the app shows: the short messages over the photo, the lines that take the row above the controls, the notes under Export's size line, the question boxes, the text drawn on the photo, the tips, the names screen readers hear and what the app writes to the console.

## MSG-01 One message at a time over the photo

Short messages appear as a pill over the bottom edge of the photo, one at a time. A new message takes the place of the one showing at once, while the old one fades out beneath it.

- Risk: medium
- Check: script
- Layout: both. On a phone the pill spans the width less 16 px each side, 36 px above the photo's bottom edge; on a wide screen it is centered 20 px up, as wide as its text up to 460 px.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#toast`, `.toast-message`, `.is-ghost`
- Source: `js/app/core.js` (`toast`, `fadeOutCopy`, `mountToast`); `js/app/parts/toast.js` (`buildToast`, `updateToast`)
- Cases: 2

### MSG-01.1 A new message takes the place of the one showing at once   [auto: phone]
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site at the start (a private window, or the site's data cleared). The app keeps the open photo on the device, so the reload offers to resume it
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo opened with **Open photo**, **Levels** tapped in the step tabs, two seconds' wait so it is kept on the device, then the page reloaded: the start screen offers **Resume**

"Resumed where you left off." is the information message these rows use: it shows once **Resume** has reopened the photo, and stays 3 seconds.

Rows 2 and 3 come within those 3 seconds.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Resume** | The photo opens on the Levels step, and "Resumed where you left off." shows over the photo |
| 2 | Tap **Pick black** | **Pick black** is selected (a white fill); the message is still up |
| 3 | At once, tap the white background just left of the slab, halfway down | "That spot is too light to be a black point. Pick something dark, or skip the black point." takes its place at once, the first fading out beneath it; one message shows |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### MSG-01.2 The message sits over the photo's bottom edge   [auto: both]
Before you start:
- Device and browser: a phone-width window (390 × 844, touch) or a wide window (1280 × 800, a mouse)
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Pick black** | **Pick black** is selected (a white fill) |
| 2 | Tap the white background just left of the slab, halfway down | on a phone the message spans the photo area less 16 px each side, its bottom 36 px above the photo area's bottom edge; on a wide screen the message is centered, its bottom 20 px above the photo area's bottom edge, at most 460 px wide |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-02 How long a message stays

A message stays 3 seconds when it is information, 5 seconds when it is a warning and 6 seconds when it is an error, unless the message sets its own time.

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#toast`, `.is-shown`
- Source: `js/app/core.js` (`toast`, `hideToast`)
- Cases: 1

### MSG-02.1 Information stays 3 s, a warning 5 s and an error 6 s   [auto: phone]
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site at the start (a private window, or the site's data cleared). The app keeps the open photo on the device, so the reload offers to resume it
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo opened with **Open photo**, **Levels** tapped in the step tabs, two seconds' wait so it is kept on the device, then the page reloaded: the start screen offers **Resume**
- File: notes.json from tests/fixtures/ (a line of text, not JSON)
- A stopwatch. Each time is from the moment the message shows to the moment it has gone. The script allows 50 ms early to 0.4 s late; by stopwatch allow half a second either way.

Load notes.json: tap the options tab (the small tab with an up arrow on the top edge of the controls); in the sheet that rises, EXPORT OPTIONS, tap **Load edits**; choose notes.json in the file picker.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Resume**, and time the message that shows once the photo is open | "Resumed where you left off." stays 3 s |
| 2 | Tap **Pick black** | **Pick black** is selected (a white fill) |
| 3 | Tap the white background just left of the slab, halfway down, and time the message | "That spot is too light to be a black point. Pick something dark, or skip the black point." stays 5 s |
| 4 | Tap **Export** in the step tabs (the six tabs along the bottom) | The Export step's controls show |
| 5 | Load notes.json, and time the message | "That file isn’t valid JSON." stays 6 s |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-03 Three kinds of message

Information is a white pill with no icon; a warning is amber with a triangle; an error is red with a circle.

- Risk: low
- Check: script, eye
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: `.is-warn`, `.is-error`, `.toast-icon`
- Source: `js/app/parts/toast.js` (`updateToast`); `css/app.css` (the toast part)
- Cases: 2

### MSG-03.1 Information is white, a warning amber with a triangle, an error red with a circle   [auto: phone]
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site at the start (a private window, or the site's data cleared). The app keeps the open photo on the device, so the reload offers to resume it
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo opened with **Open photo**, **Levels** tapped in the step tabs, two seconds' wait so it is kept on the device, then the page reloaded: the start screen offers **Resume**
- File: notes.json from tests/fixtures/ (a line of text, not JSON)

Load notes.json: tap the options tab (the small tab with an up arrow on the top edge of the controls); in the sheet that rises, EXPORT OPTIONS, tap **Load edits**; choose notes.json in the file picker.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Resume** | Once the photo is open, "Resumed where you left off." is a white pill with no icon |
| 2 | Tap **Pick black** | **Pick black** is selected (a white fill) |
| 3 | Tap the white background just left of the slab, halfway down | "That spot is too light to be a black point. Pick something dark, or skip the black point." is amber, led by a triangle |
| 4 | Tap **Export** in the step tabs (the six tabs along the bottom) | The Export step's controls show |
| 5 | Load notes.json | "That file isn’t valid JSON." is red, led by a circle |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### MSG-03.2 The three kinds of message, for a person to judge   [eye]
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site at the start (a private window, or the site's data cleared). The app keeps the open photo on the device, so the reload offers to resume it
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo opened with **Open photo**, **Levels** tapped in the step tabs, two seconds' wait so it is kept on the device, then the page reloaded: the start screen offers **Resume**
- File: notes.json from tests/fixtures/ (a line of text, not JSON)

Load notes.json: tap the options tab (the small tab with an up arrow on the top edge of the controls); in the sheet that rises, EXPORT OPTIONS, tap **Load edits**; choose notes.json in the file picker.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Resume** | Once the photo is open, a white pill with dark bold text and no icon, over the photo's bottom edge |
| 2 | Tap **Pick black** | **Pick black** is selected (a white fill) |
| 3 | Tap the white background just left of the slab, halfway down | an amber pill led by a dark triangle with an exclamation mark, its text readable against the amber |
| 4 | Tap **Export** in the step tabs (the six tabs along the bottom) | The Export step's controls show |
| 5 | Load notes.json | A red message shows, just above the open sheet |
| 6 | Close the sheet with its cross (×) | a red pill led by a circle with an exclamation mark, over the photo's bottom edge, its text white and readable against the red |

Pass: every row's result is seen.
On a fail, record: what differs from the description, the screenshot.

## MSG-04 Messages never block a touch

Touches pass through a message to the photo beneath it. A long message is cut to three lines with an ellipsis, and a screen reader announces each message without interrupting.

- Risk: medium
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#toast`, `.toast-text`
- Source: `js/app/parts/toast.js` (`buildToast`); `css/app.css` (the toast part)
- Cases: 3

### MSG-04.1 A drag that starts on a message moves the photo beneath it   [auto: phone]
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site at the start (a private window, or the site's data cleared). The app keeps the open photo on the device, so the reload offers to resume it
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo opened with **Open photo**, **Levels** tapped in the step tabs, two seconds' wait so it is kept on the device, then the page reloaded: the start screen offers **Resume**

"Resumed where you left off." is the information message these rows use: it shows once **Resume** has reopened the photo, and stays 3 seconds.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Resume** | Once the photo is open, "Resumed where you left off." shows over the photo: the message covers the point the drag starts from |
| 2 | At once, drag from the middle of the message 60 px to the right | the photo moves 60 px to the right, as a drag on the photo does |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### MSG-04.2 A long message is cut to three lines   [auto: phone]
Script only
Stand-in: no photo or control makes card detection fail, so the script makes the detector report an error a paragraph long before the tap; a person can't make the app show a message that long.

Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Perspective step

Arm Tap to find card: tap the options tab (the small tab with an up arrow on the top edge of the controls); in the sheet that rises, PERSPECTIVE OPTIONS, tap **Tap to find card** (the sheet closes).

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Arm Tap to find card | the line above the controls reads "Tap the card in the photo." |
| 2 | Tap the middle of the photo | the message over the photo shows three lines of text, the rest cut off |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### MSG-04.3 A message is announced without interrupting   [auto: phone]
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site at the start (a private window, or the site's data cleared). The app keeps the open photo on the device, so the reload offers to resume it
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo opened with **Open photo**, **Levels** tapped in the step tabs, two seconds' wait so it is kept on the device, then the page reloaded: the start screen offers **Resume**; a screen reader on

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Resume** | Once the photo is open, the screen reader reads "Resumed where you left off." once it has finished what it was saying, without cutting it off |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-05 A message rides above an open sheet

While an options sheet is open on a phone, the message sits just above the sheet's top edge instead of over the photo. It moves when a sheet opens or closes and when the window is resized.

- Risk: medium
- Check: script
- Layout: phone. A wide screen lists the options in the side panel, so the message always sits over the photo.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#toast`, `.sheet-layer`, `.toast-message`
- Source: `js/app/core.js` (`placeToast`, `toastLiftPx`)
- Cases: 1

### MSG-05.1 A message rides above an open sheet   [auto: phone]
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Pick black** | **Pick black** is selected (a white fill) |
| 2 | Tap the white background just left of the slab, halfway down | the message's bottom is 36 px above the photo area's bottom edge |
| 3 | Tap the options tab (the small tab with an up arrow on the top edge of the controls) | with LEVELS TIPS open, the message's bottom is 36 px above the sheet's top edge |
| 4 | Close the sheet with its cross (×) | with the sheet closed, the message is back 36 px above the photo area's bottom edge |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-06 "Loading…"

An information message, "Loading…", appears when any photo starts opening (Open, **Next card**, **Add back**, drop, paste, **Resume**, **Replace front** or **Replace back**) and is taken down when the photo shows.

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Loading…"
- Source: `js/app/state.js` (`openFile`)
- Ruling: R75. A busy line is allowed while the app works, and all three wordings stay ("Loading…", "Opening the front…", "Detecting…"). The app already does this.
- Cases: 1

### MSG-06.1 "Loading…" shows while a photo opens   [auto: phone]
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the start screen

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Open photo** on the start screen and choose the photo | "Loading…" shows, white, while the photo opens |
| 2 | Wait for the photo | once the photo shows, "Loading…" has gone |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-07 A HEIC photo the browser can't open

An error message, for 6 seconds, when the browser can't decode a HEIC photo: "This browser can’t open HEIC. Save the photo as JPEG first (Safari opens HEIC directly)." It also shows when a pair's other side is such a photo and **Front** or **Back** is tapped.

- Risk: medium
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "This browser can’t open HEIC. Save the photo as JPEG first", "(Safari opens HEIC directly)."
- Source: `js/app/adapters.js` (`ImageSource.load`, `ImageSource.isHeic`); `js/app/state.js` (`openFile`); `js/app/pair.js` (`switchSide`)
- Cases: 1

### MSG-07.1 A HEIC photo the browser can't open   [auto: phone]
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: card.HEIC from tests/fixtures/ (a line of text named like a HEIC photo: no browser decodes it; in Chromium a real HEIC photo gives the same message)
- Starting screen: the start screen
- A stopwatch. The time is from the moment the message shows to the moment it has gone. The script allows 50 ms early to 0.4 s late; by stopwatch allow half a second either way.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Open photo** on the start screen and choose card.HEIC | a red message reads "This browser can’t open HEIC. Save the photo as JPEG first (Safari opens HEIC directly)." |
| 2 | Time the message | it stays 6 s |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-08 A file that isn't a photo

An error message, for 6 seconds, when any other file can't be decoded as a photo: "Couldn’t read that file as an image." It also shows when a pair's other side can't be decoded after a tap on **Front** or **Back**.

- Risk: medium
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Couldn’t read that file as an image."
- Source: `js/app/adapters.js` (`ImageSource.load`); `js/app/state.js` (`openFile`); `js/app/pair.js` (`switchSide`)
- Cases: 1

### MSG-08.1 A file that isn't a photo   [auto: phone]
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: not-a-photo.JPEG from tests/fixtures/ (a line of text named like a photo)
- Starting screen: the start screen

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Open photo** on the start screen and choose not-a-photo.JPEG | a red message reads "Couldn’t read that file as an image." |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-09 "Resumed where you left off."

An information message, "Resumed where you left off.", after **Resume**, when the stored photo is the same size as the saved edits. When the sizes differ, the photo opens with fresh edits and an amber warning: "Full edit history could not be restored, your photo has been opened fresh."

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: 1.10.0
- Anchors: "Resumed where you left off.", "Full edit history could not be restored, your photo has been opened fresh.", `#btnResume`
- Source: `js/app/state.js` (`openFile`); `js/app/start-screen.js` (`resumeSession`)
- Ruling: R23. When the saved edits don't fit the stored photo, an amber warning reads "Full edit history could not be restored, your photo has been opened fresh." (wording approved by Rich, tests/catalog/wording.md). The app does this since 1.10.0.
- Cases: 2

### MSG-09.1 Resume says it resumed   [auto: phone]
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo opened once, then the page reloaded: the start screen offers **Resume**

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Resume** | a white message reads "Resumed where you left off." |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### MSG-09.2 Edits that don't fit the photo say it was opened fresh   [auto: phone]
Script only
Stand-in: the saved edits are kept inside the browser, where no control or file can change them; the script changes the photo width they were saved for to one pixel more than the photo's.

Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo opened once, then the page reloaded: the start screen offers **Resume**; the saved edits' photo width is 1537 px, where the photo is 1536 px wide

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Resume** | one amber warning reads "Full edit history could not be restored, your photo has been opened fresh." |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-11 "Detection failed: …"

An error message, for 6 seconds, when detection throws: "Detection failed: " followed by the error's own text. An error from the background worker arrives as its whole stack trace.

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Detection failed: "
- Source: `js/app/state.js` (`runDetect`); `js/app/adapters.js` (`EngineWorker.call`)
- Ruling: R24. The message reads "Detection failed.", with no advice, and the error's detail always goes to the console (wording approved by Rich, tests/catalog/wording.md). The app differs today.
- Cases: 1

### MSG-11.1 A failed search says "Detection failed."   [auto: phone]
Written to ruling R24, with Rich's approved wording; it fails until that is built (BUG-051).
Script only
Stand-in: no photo or control makes card detection fail, so the script makes the detector report an error ("Stand-in failure 4417") before the tap.

Before you start:
- Device and browser: a phone-width window (390 × 844), touch, with the developer tools' console open
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Perspective step

Arm Tap to find card: tap the options tab (the small tab with an up arrow on the top edge of the controls); in the sheet that rises, PERSPECTIVE OPTIONS, tap **Tap to find card** (the sheet closes).

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Arm Tap to find card | the line above the controls reads "Tap the card in the photo." |
| 2 | Tap the middle of the photo | A red message reads "Detection failed." |
| 3 | Read the console | The failure's own words, "Stand-in failure 4417", are written to the console as an error |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-12 "The saved photo is gone."

A warning, for 5 seconds, when **Resume** is tapped and the stored photo is missing or not usable: "The saved photo is gone. Open it again."

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "The saved photo is gone. Open it again.", `#btnResume`
- Source: `js/app/start-screen.js` (`resumeSession`)
- Cases: 1

### MSG-12.1 Resume after the saved photo has gone   [auto: phone]
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo opened once, then the page reloaded: the start screen offers **Resume**

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Open the app in a second tab of the same browser | the second tab's start screen offers **Resume** and **Start fresh** too |
| 2 | In the second tab, tap **Start fresh** | **Resume** and **Start fresh** go from the second tab |
| 3 | Back in the first tab, tap **Resume** | an amber warning reads "The saved photo is gone. Open it again." |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-13 "Couldn’t resume: …"

An error message, for 6 seconds, when anything else fails during **Resume**: "Couldn’t resume: " followed by the error's own text.

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Couldn’t resume: ", `#btnResume`
- Source: `js/app/start-screen.js` (`resumeSession`)
- Ruling: R24. The message reads "Couldn’t resume.", with no advice, and the error's detail always goes to the console (wording approved by Rich, tests/catalog/wording.md). The app differs today.
- Cases: 1

### MSG-13.1 A Resume that fails says "Couldn’t resume."   [auto: phone]
Written to ruling R24, with Rich's approved wording; it fails until that is built (BUG-051).
Before you start:
- Device and browser: Chrome in a phone-width window (390 × 844), touch, with the developer tools open
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo opened once, then the page reloaded: the start screen offers **Resume** and **Start fresh**; then the site's data cleared with the developer tools' **Clear site data** (Application tab, Storage), without reloading, so **Resume** still shows

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Resume** | a red message reads "Couldn’t resume." |
| 2 | Read the developer tools' console | the browser's own error is written there as an error |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-14 The self-test result

Opening the app with `?selftest` in its link runs the engine's self-tests and shows "Self-tests: main {passed}/{total}, worker {passed}/{total}" (or "…, worker unavailable") for 8 seconds: white when every test passes, red when any fails.

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Self-tests: main ", ", worker unavailable"
- Source: `js/app/main.js` (`runSelfTests`, `init`)
- Ruling: R28. `?selftest=0` means off: no self-tests and no message. The app differs today.
- Cases: 2

### MSG-14.1 The self-test result, from a link   [auto: phone]
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: none
- Starting screen: the app opened from a link ending ?selftest
- A stopwatch. The time is from the moment the message shows to the moment it has gone. The script allows 50 ms early to 0.4 s late; by stopwatch allow half a second either way.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Wait for the start screen | a white message reads "Self-tests: main N/N, worker N/N", every test passed |
| 2 | Time the message | it stays 8 s |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### MSG-14.2 A link with selftest=0 runs no self-tests   [auto: phone]
Written to ruling R28; it fails until that is built (BUG-171).
Before you start:
- Device and browser: a phone-width window (390 × 844), touch, with the developer tools' console open
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: none
- Starting screen: the app opened from a link ending ?selftest=0

Self-tests that run write a group headed "[card-finisher] self-tests (main thread)" to the console.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Wait 3 s on the start screen | no message starting "Self-tests:" shows over the start screen |
| 2 | Read the console | it has no "[card-finisher] self-tests" group: no self-tests ran |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-15 "Couldn’t estimate levels from this image."

A warning, for 5 seconds, when **Auto** on Levels finds no white point, or the corners are invalid: "Couldn’t estimate levels from this image."

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Couldn’t estimate levels from this image.", `#toolAutoLevels`
- Source: `js/app/levels.js` (`autoLevelsDraft`, `renderSmall`)
- Ruling: R64. This message explains a result that would otherwise look like a fault, so it needs no next step. The app already does this.
- Cases: 1

### MSG-15.1 Auto with nothing to go on   [auto: phone]
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: plain-white.png from tests/fixtures/ (a plain white picture, 1200 × 1600 px)
- Starting screen: the picture open, on the Levels step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Auto** | an amber warning reads "Couldn’t estimate levels from this image." |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-16 Auto set both points

An information message when **Auto** finds both points: "Auto set white and black points. Check them, then Apply."

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Auto set white and black points. Check them, then Apply.", `#toolAutoLevels`
- Source: `js/app/levels.js` (`autoLevelsDraft`)
- Ruling: R73. Auto's pop-up when it works goes, as a pick shows none; its failure message stays. The app differs today.
- Cases: 1

### MSG-16.1 Auto sets both points, with no message   [auto: phone]
Written to ruling R73; it fails until that is built (BUG-286).

Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Auto** | The color patches of **Pick white** and **Pick black** (the small marks at their left that show the color picked) are filled: Auto set both points |
| 2 | Wait three seconds | No message has shown over the photo since **Auto** was tapped |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-17 Auto set the white point only

An information message when **Auto** finds a white point but no clear black: "Auto set the white point (no clear black). Check it, then Apply."

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Auto set the white point (no clear black). Check it, then Apply.", `#toolAutoLevels`
- Source: `js/app/levels.js` (`autoLevelsDraft`)
- Ruling: R73. Auto's pop-up when it works goes, as a pick shows none; its failure message stays. The app differs today.
- Cases: 1

### MSG-17.1 Auto sets the white point only, with no message   [auto: phone]
Written to ruling R73; it fails until that is built (BUG-286).

Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 13_front_landscape_onetouch_labeled_white.JPEG from samples/
- Starting screen: the photo open, on the Levels step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Auto** | The color patch of **Pick white** (the small mark at its left that shows the color picked) is filled, and the one of **Pick black** is still dashed and empty: Auto set the white point only |
| 2 | Wait three seconds | No message has shown over the photo since **Auto** was tapped |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-18 "That spot is outside the photo."

A warning, for 5 seconds, when an armed **Pick white** or **Pick black** is released off the photo: "That spot is outside the photo." The pick stays armed.

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "That spot is outside the photo.", `#levelsPicks`
- Source: `js/app/levels.js` (`pickAt`)
- Cases: 1

### MSG-18.1 A pick off the photo   [auto: phone]
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Drag the photo 200 px to the right | the empty area past the photo's left edge shows |
| 2 | Tap **Pick white** | **Pick white** is selected (a white fill) |
| 3 | Find the point 15 px in from the photo area's left edge, halfway down | the point near the photo area's left edge is past the photo's own edge |
| 4 | Tap that point | an amber warning reads "That spot is outside the photo."; Pick white stays selected |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-19 A white pick darker than the black point

A warning, for 5 seconds, when a **Pick white** spot is not at least 20 brightness levels above the black point: "That spot is darker than the black point. Pick something brighter." The pick stays armed.

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "That spot is darker than the black point. Pick something brighter.", `#levelsPicks`
- Source: `js/app/levels.js` (`pickProblem`, `pickAt`)
- Cases: 1

### MSG-19.1 A white pick darker than the black point   [auto: phone]
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Pick black** | **Pick black** is selected (a white fill) |
| 2 | Tap the card’s dark background, up and to the left of the driver’s head | the color patch beside **Pick black** (the small square that shows the color picked) fills with a dark grey |
| 3 | Tap **Pick white** | **Pick white** is selected (a white fill) |
| 4 | Tap the same spot | an amber warning reads "That spot is darker than the black point. Pick something brighter."; **Pick white** stays selected |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-20 A black pick that is too light

A warning, for 5 seconds, when a **Pick black** spot is brighter than the black-point limit (100 of 255): "That spot is too light to be a black point. Pick something dark, or skip the black point." The pick stays armed.

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "That spot is too light to be a black point. ", "Pick something dark, or skip the black point.", `CONFIG.levels.maxBlackLuma`
- Source: `js/app/levels.js` (`pickProblem`, `pickAt`)
- Cases: 1

### MSG-20.1 A black pick that is too light   [auto: phone]
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Pick black** | **Pick black** is selected (a white fill) |
| 2 | Tap the white background just left of the slab, halfway down | an amber warning reads "That spot is too light to be a black point. Pick something dark, or skip the black point."; **Pick black** stays selected |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-21 A black pick brighter than the white point

A warning, for 5 seconds, when a **Pick black** spot is not at least 20 brightness levels below the white point: "That spot is brighter than the white point. Pick something darker." The pick stays armed.

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "That spot is brighter than the white point. Pick something darker.", `#levelsPicks`
- Source: `js/app/levels.js` (`pickProblem`, `pickAt`)
- Cases: 1

### MSG-21.1 A black pick brighter than the white point   [auto: phone]
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Pick white** | **Pick white** is selected (a white fill) |
| 2 | Tap the card’s dark background, up and to the left of the driver’s head | the color patch beside **Pick white** (the small square that shows the color picked) fills with a dark grey |
| 3 | Tap **Pick black** | **Pick black** is selected (a white fill) |
| 4 | Tap the same spot | an amber warning reads "That spot is brighter than the white point. Pick something darker."; **Pick black** stays selected |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-22 "Exported … px in … s." for a single photo

An information message after a single photo's **Download**, or after **Share** finishes or waits for **Share now**: "Exported {width} × {height} px in {seconds} s." After **Yes** on the Upscale question it gives the upscaled size.

- Risk: medium
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Exported ", `#btnDownload`, `#btnShare`
- Source: `js/app/export.js` (`deliverExport`, `toastSaved`)
- Ruling: R79. The finished message says what was saved and how, in the approved form "THING ACTION: SIZE in N s." (tests/catalog/wording.md): "Photo downloaded: W × H px in N s." or "Photo shared: W × H px in N s.". The app differs today.
- Cases: 2

### MSG-22.1 A single photo's Download says what it saved   [auto: phone]
Written to ruling R79, in the wording Rich approved; it fails until that is built (BUG-290).
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step, with **2000** selected

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Download** | The question box (the box over the dimmed photo with a question and buttons) asks "Upscale to 2000 px?" |
| 2 | Tap **No** | One file is saved: 01_chrome_flat_black-straight.jpg, 1074 × 1074 px |
| 3 | Read the message over the photo | A white message reads "Photo downloaded: 1074 × 1074 px in N s.", N the seconds the export took, to one decimal place |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### MSG-22.2 A single photo's Share says what it shared   [auto: phone]
Written to ruling R79, in the wording Rich approved; it fails until that is built (BUG-290).
Script only
Stand-in: no case uses a desktop browser's own share sheet (Rich, 2026-11-15); the page gets a stand-in share sheet that takes the file and closes at once, as **Save Image** does on an iPhone.

Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step, with **2000** selected

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Share** | The question box (the box over the dimmed photo with a question and buttons) asks "Upscale to 2000 px?" |
| 2 | Tap **No** | The share sheet is handed one file, 01_chrome_flat_black-straight.jpg |
| 3 | Read the message over the photo | A white message reads "Photo shared: 1074 × 1074 px in N s.", N the seconds the export took, to one decimal place |

## MSG-23 "Exported the Together image in … s."

An information message after a pair's **Download** or **Share** with **Together** chosen: "Exported the Together image in {seconds} s."

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "the Together image", `#pairOutput`
- Source: `js/app/pair.js` (`deliverPair`); `js/app/export.js` (`toastSaved`)
- Ruling: R79. The finished message says what was saved and how, in the approved form "THING ACTION: SIZE in N s." (tests/catalog/wording.md): "Front and back downloaded: …" or "Front and back shared: …", the size the joined image's. The app differs today.
- Cases: 1

### MSG-23.1 A pair's Together Download says so   [auto: phone]
Written to ruling R79, in the wording Rich approved; it fails until that is built (BUG-290).
The approved words give the size as SIZE without saying how a pair writes it; the case checks the words before and after it.
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: the pair made: the front opened, then on Export **Add back** and the back chosen; the back open on Perspective; then the Export step, with **Together** and **2000** selected

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Download** | The question box (the box over the dimmed photo with a question and buttons) asks "Upscale to 2000 px?" |
| 2 | Tap **No** | One file is saved: 14_front_portrait_raw_white-pair.jpg, 1583 × 1100 px |
| 3 | Read the message over the photo | A white message begins "Front and back downloaded: ", gives the size, and ends "in N s.", N the seconds the export took, to one decimal place |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-24 "Exported the front and back in … s."

An information message after a pair's **Download** or **Share** with **Separately** chosen: "Exported the front and back in {seconds} s."

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "the front and back", `#pairOutput`
- Source: `js/app/pair.js` (`deliverPair`); `js/app/export.js` (`toastSaved`)
- Ruling: R79. The finished message says what was saved and how, in the approved form "THING ACTION: SIZE in N s." (tests/catalog/wording.md): "Front and back downloaded: …" or "Front and back shared: …". The app differs today.
- Cases: 1

### MSG-24.1 A pair's Separately Download says so   [auto: phone]
Written to ruling R79, in the wording Rich approved; it fails until that is built (BUG-290).
The approved words give the size as SIZE without saying how two files write it; the case checks the words before and after it.
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: the pair made: the front opened, then on Export **Add back** and the back chosen; the back open on Perspective; then the Export step, with **Together** and **2000** selected

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Separately** | **Separately** is selected (a white fill) |
| 2 | Tap **Download** | The question box (the box over the dimmed photo with a question and buttons) asks "Upscale to 2000 px?" |
| 3 | Tap **No** | Two files are saved: 14_front_portrait_raw_white-front.jpg and 14_back_portrait_raw_white-back.jpg |
| 4 | Read the message over the photo | A white message begins "Front and back downloaded: ", gives the size, and ends "in N s.", N the seconds the export took, to one decimal place |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-25 "Saved the corner sheet in … s."

An information message after **Download corners** or **Share corners** with **1 sheet** chosen: "Saved the corner sheet in {seconds} s.", or after **Yes** on the Upscale question "Saved the corner sheet at 2000 px in {seconds} s."

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "the corner sheet", `#btnCornerDownload`, `#btnCornerShare`, `CONFIG.cornerShots.upscaleTargetPx`
- Source: `js/app/corner-shots.js` (`deliverCornerShots`); `js/app/export.js` (`toastSaved`)
- Ruling: R79. The finished message says what was saved and how, in the approved form "THING ACTION: SIZE in N s.": here "Corner sheet downloaded: …" or "Corner sheet shared: …". The app differs today.
- Cases: 1

### MSG-25.1 Download corners with 1 sheet says so   [auto: phone]
Written to ruling R79, in the wording Rich approved; it fails until that is built (BUG-290).
The approved words give the size as SIZE without saying how a sheet writes it; the case checks the words before and after it.

Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open from a link ending ?cornerShots.upscaleTargetPx=0 (no Upscale question for corner shots), on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Corner shots** | The Corner shots sheet rises |
| 2 | Tap **1 sheet** | **1 sheet** is selected (a white fill) |
| 3 | Tap **Download corners** | One file is saved: 01_chrome_flat_black-corners.jpg; no question box asks first |
| 4 | Read the message | A white message begins "Corner sheet downloaded: ", gives the size, and ends "in N s.", N the seconds it took, to one decimal place |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-26 "Saved 4 corner shots in … s."

An information message after **Download corners** or **Share corners** with **4 photos** chosen: "Saved 4 corner shots in {seconds} s.", or after **Yes** on the Upscale question "Saved 4 corner shots at 2000 px in {seconds} s."

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: " corner shots", `#btnCornerDownload`, `#btnCornerShare`, `CONFIG.cornerShots.upscaleTargetPx`
- Source: `js/app/corner-shots.js` (`deliverCornerShots`); `js/app/export.js` (`toastSaved`)
- Ruling: R79. The finished message says what was saved and how, in the approved form "THING ACTION: SIZE in N s.": here "4 corner photos downloaded: …" or "4 corner photos shared: …". The app differs today.
- Cases: 1

### MSG-26.1 Download corners with 4 photos says so   [auto: phone]
Written to ruling R79, in the wording Rich approved; it fails until that is built (BUG-290).
The approved words give the size as SIZE without saying how four photos write it; the case checks the words before and after it.

Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open from a link ending ?cornerShots.upscaleTargetPx=0 (no Upscale question for corner shots), on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Corner shots** | The Corner shots sheet rises |
| 2 | Tap **4 photos** | **4 photos** is selected (a white fill) |
| 3 | Tap **Download corners** | Four files are saved: 01_chrome_flat_black-corner-tl.jpg, -corner-tr.jpg, -corner-bl.jpg and -corner-br.jpg |
| 4 | Read the message | A white message begins "4 corner photos downloaded: ", gives the size, and ends "in N s.", N the seconds it took, to one decimal place |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-27 The format the browser couldn't save

When the browser saves another format than the one chosen (Safari has no WebP encoder), the finished-export message gains a sentence, "{CHOSEN} isn’t supported by this browser, so it was saved as {SAVED}." (for example WEBP and PNG), and shows as an amber warning for 6 seconds. It applies to the main export, a pair and corner shots.

- Risk: medium
- Check: script; phone (Safari's own fallback, MSG-27.2)
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: " isn’t supported by this browser, so it was saved as ", `#exportFormat`
- Source: `js/app/export.js` (`fallbackNote`, `toastSaved`)
- Ruling: R64. This message explains a result that would otherwise look like a fault, so it needs no next step. The app already does this.
- Cases: 2

### MSG-27.1 A format the browser couldn't save is named   [auto: phone]
The first sentence is the finished message (MSG-22) in ruling R79's words. Until R79 is built (BUG-290) it reads "Exported 1074 × 1074 px in N s.", which this case also accepts: its subject is the sentence added, and MSG-22.1 holds the words.
Script only
Stand-in: Chromium can save WebP, so the script makes it hand back a PNG when asked for WebP, as Safari does. On a real iPhone, where Safari can't save WebP, this is MSG-27.2.

Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step, with **2000** selected
- A stopwatch. The time is from the moment the message shows to the moment it has gone. The script allows 50 ms early to 0.4 s late; by stopwatch allow half a second either way.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **WebP** | **WebP** is selected (a white fill) |
| 2 | Tap **Download** | The question box (the box over the dimmed photo with a question and buttons) asks "Upscale to 2000 px?" |
| 3 | Tap **No** | One file is saved, and it is a PNG: 01_chrome_flat_black-straight.png |
| 4 | Read the message over the photo | An amber warning reads "Photo downloaded: 1074 × 1074 px in N s. WEBP isn’t supported by this browser, so it was saved as PNG." |
| 5 | Time the message | It stays 6 s |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### MSG-27.2 On an iPhone, a WebP export is saved as PNG and the message says so   [phone]
The first sentence is the finished message (MSG-22) in ruling R79's words. Until R79 is built (BUG-290) it reads "Exported 1074 × 1074 px in N s.", which this case also accepts: its subject is the sentence added, and MSG-22.1 holds the words.

Before you start:
- Device and browser: an iPhone, Safari
- Build: the build under test at the UAT site, https://rberrill.github.io/p1hunt_card_finisher_uat/
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/ (AirDrop it to the phone or save it to Photos first)
- Starting screen: the photo open, on the Export step, with **2000** selected

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **WebP** | **WebP** is selected (a white fill) |
| 2 | Tap **Download** | A question box (the box over the dimmed photo with a question and buttons) asks "Upscale to 2000 px?" |
| 3 | Tap **No** | An amber message over the photo reads "Photo downloaded: 1074 × 1074 px in N s. WEBP isn’t supported by this browser, so it was saved as PNG.", N the seconds the export took; Safari asks whether to download 01_chrome_flat_black-straight.png: the name ends .png, not .webp |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot (press the side button and volume up together).

## MSG-28 "Tap Share now to open the share sheet."

When the browser refuses to share because the tap was too long ago (a slow export), the finished-export message gains "Tap Share now to open the share sheet." and stays 6 seconds (white, or amber with MSG-27's sentence). Tapping **Share now** takes it down.

- Risk: low
- Check: script; phone (a real refusal after a slow export, MSG-28.2)
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Tap Share now to open the share sheet.", `#btnShare`, `#btnCornerShare`
- Source: `js/app/export.js` (`toastSaved`, `sharePending`); `js/app/corner-shots.js` (`shareCornerShots`)
- Ruling: R78. A message may say "Tap" on a wide screen. The app already does this.
- Cases: 2

### MSG-28.1 A refused share says to tap Share now   [auto: phone]
The words before "Tap Share now…" are the finished message's (MSG-22), which ruling R79 rewords; R79 doesn't say how the message reads while the share waits, so this case reads only the size, the time and the sentence added.
Script only
Stand-in: Safari refuses a share that starts too long after the tap, but an export of a sample photo is too quick for that, and no case uses a desktop browser's own share sheet; the script gives the page a stand-in share sheet that refuses the first share as Safari does and finishes every later one at once. On a real iPhone this is MSG-28.2.

Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step, with **2000** selected

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Share** | The question box (the box over the dimmed photo with a question and buttons) asks "Upscale to 2000 px?" |
| 2 | Tap **No** | A white message gives the saved size, 1074 × 1074 px, and the seconds it took, then reads "Tap Share now to open the share sheet."; the red button reads **Share now** |
| 3 | Tap **Share now** | The message goes at once, well before its 6 s are up |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### MSG-28.2 On an iPhone, a slow export says to tap Share now   [phone]
The words before "Tap Share now…" are the finished message's (MSG-22), which ruling R79 rewords; R79 doesn't say how the message reads while the share waits, so this case reads only the size, the time and the sentence added.
Waiting on find-out Q-09: which photo is slow enough to save at **Original** that Safari refuses the share. The photo below is filled in from Rich's answer; until then the case can't be run.

Before you start:
- Device and browser: an iPhone, Safari
- Build: the build under test at the UAT site, https://rberrill.github.io/p1hunt_card_finisher_uat/ (HTTPS; over plain HTTP the Share button is hidden)
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: the photo Q-09 names, in Photos
- Starting screen: the photo open, on the Export step, with **Original** selected (Original never asks to upscale)
- A stopwatch, started when the message shows

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Share** (red, first in the row of three buttons) | A thin red line runs along the top edge of the controls (the block of buttons under the photo); no share sheet rises |
| 2 | Wait for the line to finish | A white message over the photo gives the saved size (W × H px) and the seconds it took, then reads "Tap Share now to open the share sheet."; the red button reads **Share now** |
| 3 | Within 3 s of the message showing, tap **Share now** | The message goes at once; the share sheet rises |
| 4 | Tap the **×** at the share sheet's top right | The share sheet closes; no message is over the photo |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screen recording (Control Center, the Screen Recording button).

## MSG-29 "Copied to clipboard (PNG)."

An information message after **Copy** puts a single photo, or a pair's Together image, on the clipboard: "Copied to clipboard (PNG)."

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Copied to clipboard (PNG).", `#btnCopy`
- Source: `js/app/export.js` (`runExport`); `js/app/pair.js` (`runPairExport`)
- Ruling: R79. Copy reads "Photo copied (PNG).", and for a pair's joined image "Front and back copied (PNG)." (approved wording, tests/catalog/wording.md). The app differs today.
- Cases: 2

### MSG-29.1 Copy says what it put on the clipboard   [auto: phone]
Written to ruling R79, in the wording Rich approved; it fails until that is built (BUG-290).
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step, with **2000** selected; the page allowed to use the clipboard

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Copy** | The question box (the box over the dimmed photo with a question and buttons) asks "Upscale to 2000 px?" |
| 2 | Tap **No** | A white message reads "Photo copied (PNG)."; the clipboard holds a 1074 × 1074 px picture |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### MSG-29.2 A pair's Copy says it copied the front and back   [auto: phone]
Written to ruling R79, in the wording Rich approved; it fails until that is built (BUG-290).

Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: the pair made: the front opened, then on Export **Add back** and the back chosen; the back open on Perspective; then the Export step, with **Together** selected; the page allowed to use the clipboard

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Original** | **Original** is selected (a white fill): at the photos' own resolution no question box asks first |
| 2 | Tap **Copy** | A white message reads "Front and back copied (PNG)." |

## MSG-30 "Copy failed: …"

An error message, for 6 seconds, when anything fails during **Copy**: "Copy failed: " followed by the error's own text.

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Copy failed: ", `#btnCopy`
- Source: `js/app/export.js` (`runExport`); `js/app/pair.js` (`runPairExport`)
- Ruling: R24. The message reads "Copy failed.", with no advice, and the error's detail always goes to the console (wording approved by Rich, tests/catalog/wording.md). The app differs today.
- Cases: 1

### MSG-30.1 A failed Copy says "Copy failed."   [auto: phone]
Written to ruling R24, with Rich's approved wording; it fails until that is built (BUG-051).
Script only
Stand-in: a person can't make the browser refuse the clipboard to the page on purpose, so the script makes every clipboard write fail with "Stand-in failure 4417", as a browser that blocks the page does.

Before you start:
- Device and browser: a phone-width window (390 × 844), touch, with the developer tools' console open
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step, with **2000** selected

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Copy** | The question box (the box over the dimmed photo with a question and buttons) asks "Upscale to 2000 px?" |
| 2 | Tap **No** | A red message reads "Copy failed." |
| 3 | Read the console | The failure's own words, "Stand-in failure 4417", are written to the console as an error |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-31 "Export failed: …"

An error message, for 6 seconds, when **Download** or **Share** fails, or when working out a pair's Upscale question fails: "Export failed: " followed by the error's text. The app's own texts that can follow are "Encoding failed (image too large for this browser?)", "The overlay image isn’t loaded. Open the Overlay step and add it again.", MSG-47's photo-not-loaded text, and a corner fault of a pair's waiting side, with the engine's dash kept.

- Risk: medium
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Export failed: ", "Encoding failed (image too large for this browser?)", "The overlay image isn’t loaded. Open the Overlay step and add it again."
- Source: `js/app/export.js` (`runExport`, `toBlob`, `exportGeometry`, `renderWarped`); `js/app/overlay.js` (`compositeOverlay`); `js/app/pair.js` (`exportPair`, `runPairExport`, `renderSideInto`)
- Ruling: R24. The message reads "Export failed.", with no advice, and the error's detail always goes to the console, which today misses a failed pair Upscale question (wording approved by Rich, tests/catalog/wording.md). The app differs today.
- Cases: 1

### MSG-31.1 A failed Download says "Export failed."   [auto: phone]
Written to ruling R24, with Rich's approved wording; it fails until that is built (BUG-051).
Script only
Stand-in: no control makes the browser fail to encode, so the script makes it hand back no file, as a canvas too big for it does.

Before you start:
- Device and browser: a phone-width window (390 × 844), touch, with the developer tools' console open
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step, with **2000** selected

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Download** | The question box (the box over the dimmed photo with a question and buttons) asks "Upscale to 2000 px?" |
| 2 | Tap **No** | A red message reads "Export failed." |
| 3 | Read the console | The failure's own words, "Encoding failed (image too large for this browser?)", are written to the console as an error |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-32 "Share failed: …"

An error message, for 6 seconds, when the share sheet fails for any reason other than the user cancelling it or a refusal that **Share now** can finish: "Share failed: " followed by the error's text. It covers the main export, a pair, corner shots and **Share now**; nothing is written to the console.

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Share failed: ", `#btnShare`
- Source: `js/app/export.js` (`shareFiles`)
- Ruling: R24. The message reads "Share failed.", with no advice, and the error's detail always goes to the console (wording approved by Rich, tests/catalog/wording.md). The app differs today.
- Cases: 1

### MSG-32.1 A failed share says "Share failed."   [auto: phone]
Written to ruling R24, with Rich's approved wording; it fails until that is built (BUG-051).
Script only
Stand-in: no case uses a desktop browser's own share sheet, and a real one can't be made to fail on purpose, so the script gives the page a stand-in share sheet that fails with "The stand-in share sheet failed".

Before you start:
- Device and browser: a phone-width window (390 × 844), touch, with the developer tools' console open
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step, with **2000** selected

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Share** | The question box (the box over the dimmed photo with a question and buttons) asks "Upscale to 2000 px?" |
| 2 | Tap **No** | A red message reads "Share failed." |
| 3 | Read the console | The failure's own words, "The stand-in share sheet failed", are written to the console as an error |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-33 An edits file that is too large

An error message, for 6 seconds, when **Load edits** is given a file over 8 MB: "That file is too large to be a Card Finisher edits file."

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "That file is too large to be a Card Finisher edits file.", `#btnLoadEdits`, `CONFIG.export.editsMaxBytes`
- Source: `js/app/export.js` (`loadEdits`)
- Cases: 1

### MSG-33.1 An edits file over 8 MB   [auto: phone]
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Edits file: big-edits.json, any file larger than 8 MB (8,388,608 bytes) renamed to end .json; it is too large to keep in tests/fixtures/, so the script makes its own, 8 MB and one byte of spaces
- Starting screen: the photo open, on the Export step

The named actions:
- Open Export options: tap the options tab (the small tab with an up arrow on the top edge of the controls); EXPORT OPTIONS rise from the bottom.
- Load the edits file F: open Export options, tap **Load edits**, then choose F in the file picker.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Load the edits file big-edits.json | A red message reads "That file is too large to be a Card Finisher edits file." |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-34 An edits file that isn't JSON

An error message, for 6 seconds, when **Load edits** is given a file that can't be read as JSON: "That file isn’t valid JSON."

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "That file isn’t valid JSON.", `#btnLoadEdits`
- Source: `js/app/export.js` (`loadEdits`)
- Cases: 1

### MSG-34.1 An edits file that isn't JSON   [auto: phone]
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Edits file: notes.json from tests/fixtures/ (one line of text, "These are notes, not edits.")
- Starting screen: the photo open, on the Export step

The named actions:
- Open Export options: tap the options tab (the small tab with an up arrow on the top edge of the controls); EXPORT OPTIONS rise from the bottom.
- Load the edits file F: open Export options, tap **Load edits**, then choose F in the file picker.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Load the edits file notes.json | A red message reads "That file isn’t valid JSON." |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-35 A file that isn't an edits file

An error message, for 6 seconds, when **Load edits** is given JSON of the wrong shape or version: "That isn’t a Card Finisher edits file."

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "That isn’t a Card Finisher edits file.", `#btnLoadEdits`
- Source: `js/app/export.js` (`loadEdits`, `looksLikeEdits`)
- Cases: 1

### MSG-35.1 JSON that isn't an edits file   [auto: phone]
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Edits file: list.json from tests/fixtures/ (a JSON shopping list, `{"shopping":["tape","sleeves"]}`)
- Starting screen: the photo open, on the Export step

The named actions:
- Open Export options: tap the options tab (the small tab with an up arrow on the top edge of the controls); EXPORT OPTIONS rise from the bottom.
- Load the edits file F: open Export options, tap **Load edits**, then choose F in the file picker.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Load the edits file list.json | A red message reads "That isn’t a Card Finisher edits file." |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-36 Edits loaded with no photo open

A warning, for 5 seconds, when an edits file is loaded with no photo open: "Open the matching photo first, then load its edits." **Load edits** is dimmed until a photo is open, so the buttons can't reach it; only a file handed straight to the hidden edits picker can.

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Open the matching photo first, then load its edits.", `#editsInput`
- Source: `js/app/export.js` (`loadEdits`); `js/app/shell.js` (`syncUI`)
- Cases: 1

### MSG-36.1 Edits with no photo open   [auto: phone]
Script only
Stand-in: **Load edits** is greyed out with no photo open, so no button reaches this; the script hands the file straight to the hidden edits picker.

Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: none
- Edits file: 01_chrome_flat_black-turned-edits.json from tests/fixtures/: 01_chrome_flat_black.JPEG's edits after **90° right** on Rotate, as **Save edits** saves them (the photo's name "01_chrome_flat_black.JPEG", its size 1536 × 2048 px, `"quarter": 1`)
- Starting screen: the start screen

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Hand 01_chrome_flat_black-turned-edits.json straight to the edits picker | An amber warning reads "Open the matching photo first, then load its edits."; the start screen stays |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-37 Edits for a photo of another size

An error message, for 6 seconds, when the edits file was saved for a photo of another size; nothing is applied: "These edits are for a {width}×{height} photo; this one is {width}×{height}."

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "These edits are for a ", " photo; this one is "
- Source: `js/app/export.js` (`loadEdits`)
- Ruling: R58. Every message writes sizes "W × H" and "N px", with spaces. The app differs today.
- Cases: 1

### MSG-37.1 Edits for a photo of another size   [auto: phone]
Written to ruling R58; it fails until that is built (BUG-282).

Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/ (1498 × 2098 px)
- Edits file: 01_chrome_flat_black-turned-edits.json from tests/fixtures/: 01_chrome_flat_black.JPEG's edits after **90° right** on Rotate, as **Save edits** saves them (the photo's name "01_chrome_flat_black.JPEG", its size 1536 × 2048 px, `"quarter": 1`)
- Starting screen: the photo open, upright, on the Export step

The named actions:
- Open Export options: tap the options tab (the small tab with an up arrow on the top edge of the controls); EXPORT OPTIONS rise from the bottom.
- Load the edits file F: open Export options, tap **Load edits**, then choose F in the file picker.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Load the edits file 01_chrome_flat_black-turned-edits.json | A red message reads "These edits are for a 1536 × 2048 photo; this one is 1498 × 2098." |
| 2 | Look at the photo | It is still upright: nothing was applied |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-38 Edits saved for a file of another name

A warning, for 5 seconds, when the edits file's photo name differs but the size matches; the edits are applied: "Edits were saved for “{name}”. Applied anyway — sizes match." The name is cut to 60 characters, or reads "another photo" when the file has none.

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Edits were saved for “", "Applied anyway — sizes match.", "another photo"
- Source: `js/app/export.js` (`loadEdits`); `js/app/core.js` (`shortText`)
- Ruling: R12. Load edits shows one amber message with a line for each part that applies, instead of up to three messages that replace each other before they can be read: "Edits loaded.", "Saved for “NAME”; sizes match.", "Reset, not valid: LIST.", "Logo left out; it couldn’t be read." (wording approved by Rich, tests/catalog/wording.md). The app differs today. R48. The approved lines apply to every load with a problem, one problem or more: "Edits loaded." plus each line that applies. The app differs today.
- Cases: 2

### MSG-38.1 Edits saved for a file of another name   [auto: phone]
Written to rulings R12 and R48, in the wording Rich approved; it fails until that is built (BUG-190).

Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Edits file: 01_chrome_flat_black-another-name-edits.json from tests/fixtures/: 01_chrome_flat_black.JPEG's edits after **90° right** on Rotate, as **Save edits** saves them (the photo's name "01_chrome_flat_black.JPEG", its size 1536 × 2048 px, `"quarter": 1`), changed in a text editor so that `"name": "01_chrome_flat_black.JPEG"` reads `"name": "another-card.JPEG"`
- Starting screen: the photo open, upright, on the Export step

The named actions:
- Open Export options: tap the options tab (the small tab with an up arrow on the top edge of the controls); EXPORT OPTIONS rise from the bottom.
- Load the edits file F: open Export options, tap **Load edits**, then choose F in the file picker.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Load the edits file 01_chrome_flat_black-another-name-edits.json | One amber message shows, and no other comes after it; its lines read "Edits loaded." and "Saved for “another-card.JPEG”; sizes match.", in that order |
| 2 | Look at the photo | It is turned a quarter clockwise: the edits were applied |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### MSG-38.2 Three problems in one edits file make one warning   [auto: phone]
Written to ruling R12, in the wording Rich approved; it fails until that is built (BUG-190).

Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Edits file: 01_chrome_flat_black-three-problems-edits.json from tests/fixtures/: 01_chrome_flat_black.JPEG's edits after **90° right** on Rotate, as **Save edits** saves them (the photo's name "01_chrome_flat_black.JPEG", its size 1536 × 2048 px, `"quarter": 1`), changed in a text editor: `"name": "01_chrome_flat_black.JPEG"` reads `"name": "another-card.JPEG"`; the whole `"crop": { … }` setting, from `"crop": {` to its closing `}`, reads `"crop": "the whole card"`; and `"overlay": null` reads `"overlay": { "id": "gif-logo", "aspect": 1, "cx": 0.5, "cy": 0.5, "w": 0.25, "opacity": 1 }`, and after the export settings this is added: `"overlayImage": { "id": "gif-logo", "type": "image/gif", "name": "logo.gif", "data": "R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" }` (a one-pixel GIF, a type a logo can't be)
- Starting screen: the photo open, upright, on the Export step

The named actions:
- Open Export options: tap the options tab (the small tab with an up arrow on the top edge of the controls); EXPORT OPTIONS rise from the bottom.
- Load the edits file F: open Export options, tap **Load edits**, then choose F in the file picker.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Load the edits file 01_chrome_flat_black-three-problems-edits.json | One amber message shows, and no other comes after it |
| 2 | Read the message | Its lines read "Edits loaded.", "Saved for “another-card.JPEG”; sizes match.", "Reset, not valid: crop." and "Logo left out; it couldn’t be read.", in that order |
| 3 | Look at the photo | It is turned a quarter clockwise, with no logo: the rest was applied |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot or a screen recording.

## MSG-39 Settings in the edits file that were reset

A warning, for 6 seconds, when some fields of the edits file weren't valid and fell back to their defaults: "Some settings in these edits weren’t valid and were reset: {fields}." The fields are a comma list of their names.

- Risk: medium
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Some settings in these edits weren’t valid and were reset: "
- Source: `js/app/export.js` (`loadEdits`)
- Ruling: R12. Load edits shows one amber message with a line for each part that applies, instead of up to three messages that replace each other before they can be read: "Edits loaded.", "Saved for “NAME”; sizes match.", "Reset, not valid: LIST.", "Logo left out; it couldn’t be read." (wording approved by Rich, tests/catalog/wording.md). The app differs today. R48. The approved lines apply to every load with a problem, one problem or more: "Edits loaded." plus each line that applies. The app differs today.
- Cases: 1

### MSG-39.1 Settings in the edits file that were reset   [auto: phone]
Written to rulings R12 and R48, in the wording Rich approved; it fails until that is built (BUG-190).

Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Edits file: 01_chrome_flat_black-crop-as-words-edits.json from tests/fixtures/: 01_chrome_flat_black.JPEG's edits after **90° right** on Rotate, as **Save edits** saves them (the photo's name "01_chrome_flat_black.JPEG", its size 1536 × 2048 px, `"quarter": 1`), changed in a text editor so that the whole `"crop": { … }` setting, from `"crop": {` to its closing `}`, reads `"crop": "the whole card"`
- Starting screen: the photo open, upright, on the Export step

The named actions:
- Open Export options: tap the options tab (the small tab with an up arrow on the top edge of the controls); EXPORT OPTIONS rise from the bottom.
- Load the edits file F: open Export options, tap **Load edits**, then choose F in the file picker.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Load the edits file 01_chrome_flat_black-crop-as-words-edits.json | One amber message shows; its lines read "Edits loaded." and "Reset, not valid: crop.", in that order |
| 2 | Look at the photo | It is turned a quarter clockwise: the rest of the file was applied |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-40 A logo in the edits file that can't be read

A warning, for 5 seconds, when the logo inside the edits file is missing or unusable; the edits are applied without it: "The overlay in these edits couldn’t be read, so it was left out."

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "The overlay in these edits couldn’t be read, so it was left out."
- Source: `js/app/export.js` (`loadEdits`); `js/app/overlay.js` (`overlayFromEdits`)
- Ruling: R12. Load edits shows one amber message with a line for each part that applies, instead of up to three messages that replace each other before they can be read: "Edits loaded.", "Saved for “NAME”; sizes match.", "Reset, not valid: LIST.", "Logo left out; it couldn’t be read." (wording approved by Rich, tests/catalog/wording.md). The app differs today. R48. The approved lines apply to every load with a problem, one problem or more: "Edits loaded." plus each line that applies. The app differs today. R59. The logo's line says "Logo" (approved wording). The app differs today.
- Cases: 1

### MSG-40.1 A logo in the edits file that can't be read   [auto: phone]
Written to rulings R12, R48 and R59, in the wording Rich approved; it fails until that is built (BUG-190).

Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Edits file: 01_chrome_flat_black-gif-logo-edits.json from tests/fixtures/: 01_chrome_flat_black.JPEG's edits after **90° right** on Rotate, as **Save edits** saves them (the photo's name "01_chrome_flat_black.JPEG", its size 1536 × 2048 px, `"quarter": 1`), changed in a text editor: `"overlay": null` reads `"overlay": { "id": "gif-logo", "aspect": 1, "cx": 0.5, "cy": 0.5, "w": 0.25, "opacity": 1 }`, and after the export settings this is added: `"overlayImage": { "id": "gif-logo", "type": "image/gif", "name": "logo.gif", "data": "R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" }` (a one-pixel GIF, a type a logo can't be)
- Starting screen: the photo open, upright, on the Export step

The named actions:
- Open Export options: tap the options tab (the small tab with an up arrow on the top edge of the controls); EXPORT OPTIONS rise from the bottom.
- Load the edits file F: open Export options, tap **Load edits**, then choose F in the file picker.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Load the edits file 01_chrome_flat_black-gif-logo-edits.json | One amber message shows; its lines read "Edits loaded." and "Logo left out; it couldn’t be read.", in that order |
| 2 | Look at the photo | It is turned a quarter clockwise, with no logo: the rest was applied |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-41 "CONFIG copied."

An information message after **Copy CONFIG** in the detection tuning panel puts the settings on the clipboard: "CONFIG copied."

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "CONFIG copied.", `#debugCopy`
- Source: `js/app/debug-panel.js` (`buildDebugPanel`)
- Cases: 1

### MSG-41.1 Copy CONFIG says it copied   [auto: desktop]
Before you start:
- Device and browser: a wide window (1280 × 800), a mouse (the tuning panel is a developer's tool; on a phone it covers the start screen)
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the app opened from a link ending ?debug, then the photo opened with **Open photo** on the start screen: the photo open on the Perspective step, the Detection tuning panel showing; the page allowed to use the clipboard

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Click **Copy CONFIG** in the tuning panel | A white message reads "CONFIG copied." |
| 2 | Paste into any text editor | The pasted text starts "const CONFIG = ": the clipboard holds the settings |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-42 "Clipboard blocked — CONFIG printed to the console."

A warning, for 5 seconds, when **Copy CONFIG** can't reach the clipboard and prints the settings to the console instead: "Clipboard blocked — CONFIG printed to the console."

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Clipboard blocked — CONFIG printed to the console.", `#debugCopy`
- Source: `js/app/debug-panel.js` (`buildDebugPanel`)
- Ruling: R60. The blocked-clipboard message is two sentences, in the same words: "Clipboard blocked. CONFIG printed to the console." The app differs today.
- Cases: 1

### MSG-42.1 Copy CONFIG with the clipboard blocked   [auto: desktop]
Written to ruling R60; it fails until that is built (BUG-284).
Script only
Stand-in: a person can't make the browser refuse the clipboard to the page on purpose, so the script makes every clipboard write fail, as a browser that blocks the page does.

Before you start:
- Device and browser: a wide window (1280 × 800), a mouse (the tuning panel is a developer's tool; on a phone it covers the start screen), with the developer tools' console open
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the app opened from a link ending ?debug, then the photo opened with **Open photo** on the start screen: the photo open on the Perspective step, the Detection tuning panel showing

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Click **Copy CONFIG** in the tuning panel | An amber warning reads "Clipboard blocked. CONFIG printed to the console." |
| 2 | Read the console | It holds the settings, starting "const CONFIG = " |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-43 A logo that can't be kept in the browser

A warning, for 5 seconds, when a logo is added but the browser won't store it for the next photo: "This overlay works on this photo, but it can’t be saved in this browser."

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "This overlay works on this photo, but it can’t be saved in this browser."
- Source: `js/app/overlay.js` (`saveToBrowser`)
- Ruling: R59. Messages say "logo" where they said "overlay"; button names are not touched. The app differs today. R64. This message explains a result that would otherwise look like a fault, so it needs no next step. The app already does this.
- Cases: 1

### MSG-43.1 A logo the browser won't keep   [auto: phone]
Written to ruling R59; it fails until that is built (BUG-283).
Script only
Stand-in: a person can't make the browser refuse to store one thing on purpose, so the script makes the device refuse to store the logo, as a full disk would.

Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/; the logo icon.svg from icons/ (the app's own icon)
- Starting screen: the photo open, on the Overlay step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Add logo** and choose icon.svg | The logo goes on the middle of the photo; an amber warning reads "This logo works on this photo, but it can’t be saved in this browser." |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-44 "Opening the front…" and "Opening the back…"

An information message while the other side of a pair is decoded after a tap on **Front** or **Back** (or when **Keep front** or **Keep back** keeps the side not on screen): "Opening the front…" or "Opening the back…". It is taken down when that side shows.

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Opening the ", `#sideSwitch`
- Source: `js/app/pair.js` (`switchSide`)
- Ruling: R75. A busy line is allowed while the app works, and all three wordings stay ("Loading…", "Opening the front…", "Detecting…"). The app already does this.
- Cases: 1

### MSG-44.1 "Opening the front…" while the front opens   [auto: phone]
Script only
Stand-in: a front opens in tens of milliseconds, too fast to read the message, so the script holds its opening until row 1 is seen.

Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: the pair made: the front opened, then on Export **Add back** and the back chosen; the back open on Perspective

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Front** in the top bar | A white message reads "Opening the front…" while the front opens |
| 2 | Wait for the front | Once the front shows, the message has gone |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-45 "Unpaired. The front is a single photo now."

An information message after **Keep front** or **Keep back** in the Unpair question box: "Unpaired. The front is a single photo now." or "Unpaired. The back is a single photo now."

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: 1.10.0
- Anchors: "Unpaired. The ", " is a single photo now.", `#btnUnpair`
- Source: `js/app/pair.js` (`unpair`)
- Ruling: R25. The kept side's photo is stored before the message shows, so a reload at that moment resumes the right photo. The app does this since 1.10.0.
- Cases: 1

### MSG-45.1 Unpair says which side is kept   [auto: phone]
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: the pair made: the front opened, then on Export **Add back** and the back chosen; the back open on Perspective

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Unpair** (beside **Front** / **Back** in the top bar) | The question box (the box over the dimmed photo with a question and buttons) asks "Unpair" |
| 2 | Tap **Keep front** | A white message reads "Unpaired. The front is a single photo now."; **Front** / **Back** has gone from the top bar |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-46 "Wait for the export to finish, then open the photo."

A warning, for 5 seconds, when a photo arrives (picker, drop or paste) while an export runs: "Wait for the export to finish, then open the photo." The same message shows while a side switch or the back's first opening is under way, when no export runs.

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Wait for the export to finish, then open the photo."
- Source: `js/app/pair.js` (`receivePhoto`)
- Ruling: R13. During a side switch the warning reads "Wait for the other side to open, then open the photo."; during an export the wording stays (wording approved by Rich, tests/catalog/wording.md). The app differs today.
- Cases: 2

### MSG-46.1 A photo opened during an export is refused   [auto: phone]
Script only
Stand-in: an export of a sample photo takes under a second, too quick to open a photo in the middle of it, so the script holds each encoding back 3 s, as on a slow phone.

Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/, then IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Export step, with **2000** selected; each image takes 3 s to encode

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Download** | The question box (the box over the dimmed photo with a question and buttons) asks "Upscale to 2000 px?" |
| 2 | Tap **No** | A thin red line runs along the top edge of the controls: the export is running |
| 3 | Tap **Open** (the folder at the top left; on a phone it has no label) and choose IMG_9136.JPEG | An amber warning reads "Wait for the export to finish, then open the photo."; 01_chrome_flat_black.JPEG stays open |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### MSG-46.2 A photo opened while a side opens is refused with its own words   [auto: phone]
Written to ruling R13, in the wording Rich approved; it fails until that is built (BUG-031).
Script only
Stand-in: a side opens in tens of milliseconds, too fast to open a photo in the middle of it, so the script holds the front's opening until row 2 is done.

Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/; then IMG_9136.JPEG from samples/
- Starting screen: the pair made: the front opened, then on Export **Add back** and the back chosen; the back open on Perspective

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Front** in the top bar | "Opening the front…" shows over the photo |
| 2 | Tap **Open** (the folder at the top left; on a phone it has no label) and choose IMG_9136.JPEG | An amber warning reads "Wait for the other side to open, then open the photo." |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-47 The photo isn't loaded after a pair's export

A warning, for 8 seconds, when the open side's photo can't be decoded again after a pair's export, after two tries: "The photo isn’t loaded after the last export. Tap Front or Back to switch sides, then switch back."

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "The photo isn’t loaded after the last export. ", "Tap Front or Back to switch sides, then switch back."
- Source: `js/app/pair.js` (`runPairExport`, `reloadOpenPhoto`); `js/app/export.js` (`renderWarped`)
- Ruling: R78. A message may say "Tap" on a wide screen. The app already does this. R49. A message whose fix the app knows keeps its advice. The app already does this.
- Cases: 1

### MSG-47.1 The photo isn't loaded after a pair's export   [auto: phone]
Script only
Stand-in: the back can be read again after an export on any device a person has to hand, so the script makes every read of the back fail after the export, as under memory pressure on an iPhone.

Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: the pair made: the front opened, then on Export **Add back** and the back chosen; the back open on Perspective; then the Export step, with **Together** and **Original** selected (Original never asks to upscale)
- A stopwatch. The time is from the moment the message shows to the moment it has gone. The script allows 50 ms early to 0.4 s late; by stopwatch allow half a second either way.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Download** | One file is saved: 14_front_portrait_raw_white-pair.jpg |
| 2 | Wait for the export to end | An amber warning reads "The photo isn’t loaded after the last export. Tap Front or Back to switch sides, then switch back." |
| 3 | Time the message | It stays 8 s |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-48 "The saved pair wasn’t valid, so it was reset."

A warning, for 6 seconds, after **Resume** when the stored pair or its other photo couldn't be rebuilt; the open side resumes on its own: "The saved pair wasn’t valid, so it was reset. This photo resumed on its own." It replaces "Resumed where you left off." at once.

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "The saved pair wasn’t valid, so it was reset. ", "This photo resumed on its own."
- Source: `js/app/pair.js` (`restorePair`, `finishResume`)
- Cases: 1

### MSG-48.1 A saved pair that couldn't be rebuilt   [auto: phone]
Script only
Stand-in: the pair's record is kept inside the browser, where no control or file can change it; the script damages it, as a failed write could.

Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: the pair made: the front opened, then on Export **Add back** and the back chosen; the back open on Perspective; the pair saved, then its stored record damaged and the page reloaded: the start screen offers **Resume**

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Resume** | An amber warning reads "The saved pair wasn’t valid, so it was reset. This photo resumed on its own.", in place of "Resumed where you left off." at once |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-49 Corner shots that can't be made

An error message, for 5 seconds, when **Share corners** or **Download corners** is tapped and the engine can't make the corner shots. It carries the engine's reason: "The card is too small for corner shots." or, for a frame the engine can't invert, "Transform is not invertible."

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "The card is too small for corner shots.", `#btnCornerShare`, `#btnCornerDownload`
- Source: `js/app/corner-shots.js` (`saveCornerShots`, `renderAndSave`); `js/engine.js` (`cornerShots`)
- Ruling: R20. When corner shots can't be made, both save buttons are dimmed and the size line ends "· the card is too small" when that is the reason, "· fix the corners in Perspective first" for any other (wording approved by Rich, tests/catalog/wording.md). The app differs today. R80. This error stays 6 seconds, as other errors do. The app differs today (the time is set in `saveCornerShots` and `renderAndSave`). No case times it: once R20 is built both save buttons are dimmed whenever the engine refuses, so no control can raise the message.
- Cases: 1

### MSG-49.1 Corner shots that can't be made can't be saved   [auto: phone]
Written to ruling R20, in the wording Rich approved; it fails until that is built (BUG-120). Once the buttons are greyed out the message itself can no longer be raised.
Script only
Stand-in: no photo or control makes the engine refuse a card with valid corners, so the script makes it refuse; and no case uses a desktop browser's own share sheet, so the page gets a stand-in share sheet, which shows **Share corners**.

Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step; the engine refusing corner shots with "The card is too small for corner shots."

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Corner shots** | The corner size line reads "Sheet · the card is too small"; **Share corners** and **Download corners** are greyed out (shown dim and not answering a tap) |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-50 "Corner shots failed: …"

An error message, for 6 seconds, when anything fails while corner shots are rendered or saved: "Corner shots failed: " followed by the error's own text.

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Corner shots failed: "
- Source: `js/app/corner-shots.js` (`renderAndSave`)
- Ruling: R24. The message reads "Corner shots failed.", with no advice, and the error's detail always goes to the console (wording approved by Rich, tests/catalog/wording.md). The app differs today.
- Cases: 1

### MSG-50.1 Failed corner shots say "Corner shots failed."   [auto: phone]
Written to ruling R24, with Rich's approved wording; it fails until that is built (BUG-051).
Script only
Stand-in: no control makes the browser fail to encode, so the script makes it hand back no file, as a canvas too big for it does.

Before you start:
- Device and browser: a phone-width window (390 × 844), touch, with the developer tools' console open
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open from a link ending ?cornerShots.upscaleTargetPx=0 (no Upscale question for corner shots), on the Export step, with **2000** selected

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Corner shots** | The Corner shots sheet rises |
| 2 | Tap **Download corners** | A red message reads "Corner shots failed." |
| 3 | Read the console | The failure's own words, "Encoding failed (image too large for this browser?)", are written to the console as an error |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-51 "Tap the card in the photo." with Cancel

While **Tap to find card** is armed, the row above Perspective's controls reads "Tap the card in the photo." with a grey information icon and a **Cancel** button that disarms it. Changing step or side disarms it too.

- Risk: medium
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Tap the card in the photo.", `#perspectiveStatus`, `#perspectiveStatusAction`, `#btnFindCard`
- Source: `js/app/perspective.js` (`perspectiveStatus`, `bindPerspective`, `syncPerspectiveReadouts`); `js/app/parts/status.js` (`updateStatus`)
- Cases: 1

### MSG-51.1 Tap to find card's line, with Cancel   [auto: phone]
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Perspective step

Arm Tap to find card: tap the options tab (the small tab with an up arrow on the top edge of the controls); in the sheet that rises, PERSPECTIVE OPTIONS, tap **Tap to find card** (the sheet closes).

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Drag the top-left corner handle 40 px to the right | The outline's top-left corner sits 40 px right of the card's corner |
| 2 | Arm Tap to find card | The line above the controls reads "Tap the card in the photo." with a grey information icon and **Cancel** at its right |
| 3 | Tap **Cancel** | The line above the controls reads NUDGE and "Corner 1 of 4" |
| 4 | Tap the middle of the photo | No corner moves: the top-left corner stays 40 px right of the card's corner (an armed Tap to find card would have put it back on the card) |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-52 Corners that cross or fold inward

When the corners cross or fold inward, the row above Perspective's controls reads "Corners cross or fold inward. Drag them back into a convex shape." with a red error icon. The engine words it with a dash, and Perspective rewrites it as two sentences.

- Risk: medium
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Corners cross or fold inward", `#perspectiveStatus`
- Source: `js/app/perspective.js` (`perspectiveStatus`, `asSentences`); `js/engine.js` (`Quad.validate`)
- Cases: 1

### MSG-52.1 Corners that cross   [auto: phone]
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Drag the top-left corner handle past the bottom-right one | the line above the controls reads "Corners cross or fold inward. Drag them back into a convex shape." with a red error icon |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-53 Two corners too close together

When two corners are closer than 8 photo pixels, the row above Perspective's controls reads "Two corners are too close together." with a red error icon.

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Two corners are too close together.", `#perspectiveStatus`, `CONFIG.minCornerDistPx`
- Source: `js/app/perspective.js` (`perspectiveStatus`); `js/engine.js` (`Quad.validate`)
- Cases: 1

### MSG-53.1 Two corners too close together   [auto: phone]
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Drag the top-right corner handle onto the top-left one | the line above the controls reads "Two corners are too close together." with a red error icon |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-54 The other corner faults

For the engine's remaining faults ("Corners are missing or invalid.", "Could not solve the perspective for these corners.", "Crop is empty." and "Transform is not invertible.") the row above Perspective's controls reads "Fix the corners first." with a red error icon. The engine's own words go to the browser's console.

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: 1.10.0
- Anchors: "Fix the corners first.", "Corners are missing or invalid.", "Could not solve the perspective for these corners.", "Crop is empty.", "Transform is not invertible."
- Source: `js/app/perspective.js` (`perspectiveStatus`, `faultText`, `logGeometryNote`); `js/engine.js` (`Quad.validate`, `computeGeometry`)
- Ruling: R81. The screen shows "Fix the corners in Perspective first." (on Perspective itself, "Fix the corners first.", R82) in place of the engine's words, which go to the console. The app does this since 1.10.0.
- Cases: 1

### MSG-54.1 The engine's other corner faults   [auto: phone]
Script only
Stand-in: no control brings these faults about, so the script makes the engine report each in turn.

Before you start:
- Device and browser: a phone-width window (390 × 844), touch, with the browser's developer tools open on the Console
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Have the engine report "Corners are missing or invalid." | The line above the controls reads "Fix the corners first." with a red error icon; the Console holds "Corners are missing or invalid." |
| 2 | Have the engine report "Could not solve the perspective for these corners." | The line above the controls reads "Fix the corners first." with a red error icon; the Console holds "Could not solve the perspective for these corners." |
| 3 | Have the engine report "Crop is empty." | The line above the controls reads "Fix the corners first." with a red error icon; the Console holds "Crop is empty." |
| 4 | Have the engine report "Transform is not invertible." | The line above the controls reads "Fix the corners first." with a red error icon; the Console holds "Transform is not invertible." |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-55 "Detecting…"

While a detection runs, the row above Perspective's controls reads "Detecting…" with a grey information icon.

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Detecting…", `#perspectiveStatus`
- Source: `js/app/state.js` (`runDetect`); `js/app/perspective.js` (`perspectiveStatus`)
- Ruling: R75. A busy line is allowed while the app works, and all three wordings stay ("Loading…", "Opening the front…", "Detecting…"). The app already does this.
- Cases: 1

### MSG-55.1 "Detecting…" while a search runs   [auto: phone]

Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the start screen

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Open photo** on the start screen and choose 01_chrome_flat_black.JPEG | For a moment, before the corner handles show on the card, the line above the controls reads "Detecting…" with a grey information icon |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-56 "Low confidence (…%). Check the corners."

When the detected card in use scores under 50% confidence, the row above Perspective's controls reads "Low confidence ({percent}%). Check the corners." with an amber warning icon. It goes once the corners are moved by hand, by a drag or with the arrow buttons, and stays away until detection runs again, even if **Undo** puts the corners back.

- Risk: medium
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: 1.10.0
- Anchors: "Low confidence (", "%). Check the corners.", `CONFIG.detect.minConfidence`
- Source: `js/app/perspective.js` (`perspectiveStatus`, `syncPerspectiveReadouts`); `js/app/state.js` (`noteDetectedCorners`)
- Ruling: R7. The warning clears after the first corner move, by drag or nudge. Once a move has cleared the message it stays away until detection runs again, even if Undo puts the corners back. The app does this since 1.10.0.
- Cases: 1

### MSG-56.1 Low confidence   [auto: phone]
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open from a link ending ?detect.minConfidence=1 (every result counts as low), on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Read the line above the controls | the line above the controls reads "Low confidence (99%). Check the corners." with an amber warning icon |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-57 "Nothing detected. Drag the corners into place."

After a detection run finds no card, the row above Perspective's controls reads "Nothing detected. Drag the corners into place." with an amber warning icon. Nothing else says so: no pop-up shows, whether the search ran on opening the photo or the user started it (**Tap to find card**, or **Re-detect** in the tuning panel). It goes once the corners are moved by hand, by a drag or with the arrow buttons, and stays away until detection runs again, even if **Undo** puts the corners back.

- Risk: medium
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: 1.10.0
- Anchors: "Nothing detected. Drag the corners into place.", `#perspectiveStatus`
- Source: `js/app/perspective.js` (`perspectiveStatus`); `js/app/state.js` (`runDetect`, `noteDetectedCorners`)
- Ruling: R7. The warning clears after the first corner move, by drag or nudge. Once a move has cleared the message it stays away until detection runs again, even if Undo puts the corners back. The app does this since 1.10.0. R77. When a search the user started finds no card, only the line above the controls says so ("Nothing detected. Drag the corners into place."); the pop-up goes. The app does this since 1.10.0.
- Cases: 3

### MSG-57.1 Nothing detected   [auto: phone]

Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: plain-grey.png from tests/fixtures/ (a plain grey picture, 1200 × 1600 px, with no card in it)
- Starting screen: the start screen

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Open photo** on the start screen and choose plain-grey.png | The picture opens on the Perspective step; the line above the controls reads "Nothing detected. Drag the corners into place." with an amber warning icon |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### MSG-57.2 A search that finds no card says so in the line alone   [auto: phone]

Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: plain-grey.png from tests/fixtures/ (a plain grey picture, 1200 × 1600 px, with no card in it)
- Starting screen: the start screen

Arm Tap to find card: tap the options tab (the small tab with an up arrow on the top edge of the controls); in the sheet that rises, PERSPECTIVE OPTIONS, tap **Tap to find card** (the sheet closes).

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Open photo** on the start screen and choose plain-grey.png | The picture opens on the Perspective step; the line above the controls reads "Nothing detected. Drag the corners into place."; no message shows over the picture |
| 2 | Arm Tap to find card | the line above the controls reads "Tap the card in the photo." |
| 3 | Tap the middle of the picture | the line above the controls reads "Nothing detected. Drag the corners into place." |
| 4 | Wait five seconds | No message has shown over the picture since the tap |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### MSG-57.3 Re-detect in the tuning panel that finds no card shows no message   [auto: desktop]

Before you start:
- Device and browser: a wide window (1280 × 800), a mouse (the tuning panel is a developer's tool; on a phone it covers the start screen)
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: plain-grey.png from tests/fixtures/ (a plain grey picture, 1200 × 1600 px, with no card in it)
- Starting screen: the app opened from a link ending ?debug: the start screen, with the Detection tuning panel showing

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Click **Open photo** on the start screen and choose plain-grey.png | The picture opens; the Detection tuning panel still shows; no message shows over the picture |
| 2 | Click **Re-detect** in the tuning panel | The search runs again and ends; the line above the controls still reads "Nothing detected. Drag the corners into place." |
| 3 | Wait five seconds | No message has shown over the picture since the click |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-58 "Corrected frame clamped to 12000 px on the long side." in the console

When the perspective-corrected frame would be larger than the 12000 px cap, the app writes "[card-finisher] Corrected frame clamped to 12000 px on the long side." to the browser's console, once while it lasts. Nothing on screen says so: the row above Perspective's controls shows no message for it.

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: 1.10.0
- Anchors: "Corrected frame clamped to ", " px on the long side.", `CONFIG.maxOutputPx`
- Source: `js/app/perspective.js` (`logGeometryNote`, `perspectiveStatus`)
- Ruling: R76. The line goes; the fact goes to the console. The app does this since 1.10.0.
- Cases: 1

### MSG-58.1 A corrected frame over the cap is noted in the console only   [auto: phone]

Before you start:
- Device and browser: a phone-width window (390 × 844), touch, with the browser's developer tools open on the Console
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open from a link ending ?maxOutputPx=1000, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Read the line above the controls | It holds no message: it reads NUDGE and "Corner 1 of 4" |
| 2 | Read the Console | One line reads "[card-finisher] Corrected frame clamped to 1000 px on the long side." |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-59 A logo file of a type that isn't supported

On Overlay, when the picked, dropped or pasted file isn't PNG, WebP, JPEG or SVG (by its type or its name), the row above the controls reads "That file type isn’t supported. Use PNG, WebP, JPG or SVG." with a red error icon. It stays until a logo is added, the step is left or the logo next changes.

- Risk: medium
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "That file type isn’t supported. Use PNG, WebP, JPG or SVG.", `#overlayStatus`, `#btnOverlayAdd`
- Source: `js/app/overlay.js` (`addOverlayFile`, `imageTypeOf`, `setMessage`, `syncOverlay`); `js/app/shell.js` (`setTab`)
- Cases: 1

### MSG-59.1 A logo file of a type that isn't supported   [auto: phone]
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/; logo.gif from tests/fixtures/ (a one-pixel GIF)
- Starting screen: the photo open, on the Overlay step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Add logo** and choose logo.gif | The line above the controls reads "That file type isn’t supported. Use PNG, WebP, JPG or SVG." with a red error icon |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-60 A logo file over the size limit

On Overlay, when the logo file is larger than the limit, the row above the controls reads "That file is {size} MB. The overlay limit is 5 MB." with a red error icon. The limit shown follows the setting, so a link that lowers it shows the lower figure.

- Risk: medium
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: " MB. The overlay limit is ", `#overlayStatus`, `CONFIG.overlay.maxBytes`
- Source: `js/app/overlay.js` (`addOverlayFile`, `setMessage`, `syncOverlay`)
- Ruling: R59. Messages say "logo" where they said "overlay"; button names are not touched. The app differs today.
- Cases: 1

### MSG-60.1 A logo file over the size limit   [auto: phone]
Written to ruling R59; it fails until that is built (BUG-283).

Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Logo: big-logo.png, a file of exactly 6 MB (6,291,456 bytes) whose name ends .png; it is too large to keep in tests/fixtures/, so make one (in Windows PowerShell `[IO.File]::WriteAllBytes("$PWD\big-logo.png", [byte[]]::new(6291456))`, on a Mac `mkfile 6m big-logo.png`); the script makes its own, of zero bytes
- Starting screen: the photo open, on the Overlay step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Add logo** and choose big-logo.png | The line above the controls reads "That file is 6.0 MB. The logo limit is 5 MB." with a red error icon |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-61 A logo image that can't be read

On Overlay, when a logo file can't be decoded, or **Use saved overlay** can't read the stored logo, the row above the controls reads "Couldn’t read that image. Try another PNG, WebP, JPG or SVG file." with a red error icon.

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Couldn’t read that image. Try another PNG, WebP, JPG or SVG file.", `#overlayStatus`, `#btnUseSaved`
- Source: `js/app/overlay.js` (`addOverlayFile`, `useSaved`, `setMessage`)
- Cases: 1

### MSG-61.1 A logo image that can't be read   [auto: phone]
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/; not-a-logo.png from tests/fixtures/ (a line of text, "This is a line of text, not a picture.", named like a PNG)
- Starting screen: the photo open, on the Overlay step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Add logo** and choose not-a-logo.png | The line above the controls reads "Couldn’t read that image. Try another PNG, WebP, JPG or SVG file." with a red error icon |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-62 An SVG logo with no size

On Overlay, when an SVG logo has no width, height or viewBox, the row above the controls reads "That SVG has no width, height or viewBox, so it can’t be sized. Re-export it with a size." with a red error icon.

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "That SVG has no width, height or viewBox, so it can’t be sized. ", "Re-export it with a size.", `#overlayStatus`
- Source: `js/app/overlay.js` (`svgSize`, `decodeSvg`, `addOverlayFile`)
- Cases: 1

### MSG-62.1 An SVG logo with no size   [auto: phone]
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/; unsized.svg from tests/fixtures/ (an SVG with no width, height or viewBox: `<svg xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#000"/></svg>`)
- Starting screen: the photo open, on the Overlay step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Add logo** and choose unsized.svg | The line above the controls reads "That SVG has no width, height or viewBox, so it can’t be sized. Re-export it with a size." with a red error icon |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-63 Preview's two lines

With **Preview** on, the row above Perspective's controls reads "Preview" (in capitals) and "The corrected card. Handles are hidden.", and the controls row reads "Pinch to zoom, drag to pan. Tap Preview again for the corners."

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#perspectivePreviewLine`, `#perspectivePreviewRow`, "The corrected card. Handles are hidden.", "Pinch to zoom, drag to pan. Tap Preview again for the corners."
- Source: `js/app/perspective.js` (`buildPerspectiveControls`, `syncPerspective`, `syncPerspectiveReadouts`)
- Cases: 1

### MSG-63.1 Preview's two lines   [auto: phone]
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Preview** | the line above the controls reads PREVIEW and "The corrected card. Handles are hidden."; the controls row reads "Pinch to zoom, drag to pan. Tap Preview again for the corners." |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-64 Flip's line

With **Flip** chosen on Rotate, the row above the controls reads "Flip" (in capitals) and "as you see it on screen".

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#rotateFlipLine`, "as you see it on screen", `#toolFlip`
- Source: `js/app/rotate.js` (`buildFlipLine`, `syncRotate`)
- Cases: 1

### MSG-64.1 Flip's line   [auto: phone]
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Rotate step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Flip** | the line above the controls reads FLIP and "as you see it on screen" |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-65 "Pair: 5:7 only"

While a pair is open, Crop's size line ends with "Pair: 5:7 only" at its right.

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Pair: 5:7 only", `#cropPairNote`
- Source: `js/app/crop.js` (`buildCropLine`, `syncCrop`)
- Cases: 1

### MSG-65.1 "Pair: 5:7 only" on Crop   [auto: phone]
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: the pair made: the front opened, then on Export **Add back** and the back chosen; the back open on Perspective

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Crop** in the step tabs (the six tabs along the bottom) | The size line ends with "Pair: 5:7 only" at its right |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-66 "Pick white, or try Auto"

On Levels, between **Discard** and **Apply**, the instruction reads "Pick white, or try Auto" when no pick is armed and the photo shows no levels.

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Pick white, or try Auto", `#levelsHint`
- Source: `js/app/levels.js` (`levelsHint`, `syncLevels`)
- Cases: 1

### MSG-66.1 "Pick white, or try Auto"   [auto: phone]
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Read the row above the controls | between Discard and Apply the instruction reads "Pick white, or try Auto" |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-67 "Tap something white"

On Levels, while **Pick white** is armed, the instruction reads "Tap something white". It stays as long as the pick is armed, and no message pops up.

- Risk: medium
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Tap something white", `#levelsHint`, `#levelsPicks`
- Source: `js/app/levels.js` (`levelsHint`, `syncLevels`, `armDropper`)
- Cases: 1

### MSG-67.1 "Tap something white" while Pick white is armed   [auto: phone]
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Pick white** | the instruction reads "Tap something white", and no message pops up |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-68 "Tap something black"

On Levels, while **Pick black** is armed, the instruction reads "Tap something black".

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Tap something black", `#levelsHint`, `#levelsPicks`
- Source: `js/app/levels.js` (`levelsHint`, `syncLevels`, `armDropper`)
- Cases: 1

### MSG-68.1 "Tap something black" while Pick black is armed   [auto: phone]
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Pick black** | the instruction reads "Tap something black" |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-69 "Hold the photo to compare"

On Levels, when the photo shows levels (unapplied or applied) and no pick is armed, the instruction reads "Hold the photo to compare".

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Hold the photo to compare", `#levelsHint`
- Source: `js/app/levels.js` (`levelsHint`, `syncLevels`)
- Cases: 1

### MSG-69.1 "Hold the photo to compare" once the photo shows levels   [auto: phone]
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Auto** | the instruction reads "Hold the photo to compare" |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-70 Overlay's hint with no logo placed

On Overlay with no logo placed and no file error, the row above the controls reads "Add a logo or watermark: PNG, WebP, JPG or SVG, up to 5 MB."

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Add a logo or watermark: PNG, WebP, JPG or SVG, up to 5 MB.", `#overlayHintLine`, `CONFIG.overlay.maxBytes`
- Source: `js/app/overlay.js` (`buildOverlayControls`, `syncOverlay`)
- Ruling: R11. With invalid corners, **Add logo**, **Use saved overlay** and **Replace logo** are dimmed and this row reads "Fix the corners in Perspective first." The app differs today. R83. The hint gives the logo size limit in force, which a link can lower. The app differs today.
- Cases: 1

### MSG-70.1 Overlay's hint with no logo placed   [auto: phone]
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Overlay step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Read the line above the controls | the line above the controls reads "Add a logo or watermark: PNG, WebP, JPG or SVG, up to 5 MB." |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-71 Export's unapplied-levels note

Under Export's size line, with an amber warning mark, while Levels has changes not yet applied: "Levels has unapplied changes; export uses the applied levels."

- Risk: medium
- Check: script
- Layout: both. A phone shows one note at a time, in the order unapplied levels, canvas limit, JPEG; a wide screen lists them all. None shows while the corners are invalid.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Levels has unapplied changes; export uses the applied levels.", `#exportMessage`, `.export-note`
- Source: `js/app/export-controls.js` (`exportNotes`, `buildNote`, `syncExportReadouts`)
- Cases: 1

### MSG-71.1 Export's note for unapplied levels   [auto: phone]
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Auto** | A white dot shows on the **Levels** tab: the levels are not applied yet |
| 2 | Tap **Export** in the step tabs (the six tabs along the bottom) | Under the size line, led by the amber warning mark: "Levels has unapplied changes; export uses the applied levels." |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-72 Export's canvas-limit note

Under Export's size line, with an amber warning mark, when the output (or a pair's Together image) is scaled down to fit the canvas area limit: "Clamped to fit the 16.8 MP canvas limit." The figure is worked out from the limit and rounded, so today it reads 16.8; for a pair saved **Separately** only the open side is checked.

- Risk: low
- Check: script
- Layout: both. A phone shows one note at a time, in the order unapplied levels, canvas limit, JPEG; a wide screen lists them all. None shows while the corners are invalid.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Clamped to fit the ", " MP canvas limit.", `#exportMessage`, `CONFIG.maxOutputArea`
- Source: `js/app/export-controls.js` (`exportNotes`, `syncExportReadouts`); `js/app/pair.js` (`pairReadout`, `togetherLayout`)
- Ruling: R14 and R15. The note reads "Scaled down to fit the 16.7 MP limit." (16.7 MP, rounded down). For a pair saved Separately it shows when either side is scaled down, and names the side when it is not the one on screen: "The front is scaled down to fit the 16.7 MP limit." (or "The back…"), or "Both sides are scaled down to fit the 16.7 MP limit." (wording approved by Rich, tests/catalog/wording.md). The app differs today. R64. This message explains a result that would otherwise look like a fault, so it needs no next step. The app already does this. R47. The note gives the limit in force: 1 MP under `?maxOutputArea=1000000`, 16.7 MP normally. The app differs today.
- Cases: 2

### MSG-72.1 The canvas-limit note says 16.7 MP   [auto: phone]
Written to rulings R14 and R15, in the wording Rich approved; it fails until that is built (BUG-011).

Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open from a link ending ?export.longEdge=12000&export.allowUpscale=1, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Read the note under the size line | Under the size line, led by the amber warning mark: "Scaled down to fit the 16.7 MP limit." |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### MSG-72.2 With Separately, the note also covers the side not on screen   [auto: phone]
Written to ruling R14, in the wording Rich approved; it fails until that is built (BUG-012).

Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG (front) and 14_back_portrait_raw_white.JPEG (back) from samples/
- Starting screen: the app opened from a link ending ?maxOutputArea=1000000 (a 1 MP limit); the pair made: IMG_9136.JPEG opened, then on Export **Add back** and 14_back_portrait_raw_white.JPEG chosen; the back open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Original** | **Original** is selected (a white fill) |
| 2 | Tap **Separately** | **Separately** is selected (a white fill) |
| 3 | Read the note under the size line | With the back on screen, one amber note reads "The front is scaled down to fit the 1 MP limit.", the approved words with the limit in force, which this case's link lowers to 1 MP (ruling R47) |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-73 Export's JPEG transparency note

Under Export's size line, with an amber warning mark, when Format is **JPEG** and **Fill outside photo** is Transparent: "JPEG has no transparency; empty areas will be white."

- Risk: low
- Check: script
- Layout: both. A phone shows one note at a time, in the order unapplied levels, canvas limit, JPEG; a wide screen lists them all. None shows while the corners are invalid.
- Added: 1.10 baseline
- Changed: none
- Anchors: "JPEG has no transparency; empty areas will be white.", `#exportMessage`, `#exportFormat`
- Source: `js/app/export-controls.js` (`exportNotes`, `syncExportReadouts`)
- Ruling: R16. **Copy** with JPEG and a Transparent fill copies a PNG with white corners, as this note and **Download** say. The app already does this.
- Cases: 1

### MSG-73.1 Export's JPEG transparency note   [auto: phone]
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step, with **JPEG** selected

Make the fill transparent: tap the options tab (the small tab with an up arrow on the top edge of the controls); in EXPORT OPTIONS choose Transparent in **Fill outside photo**; close the options with their cross (×).

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Make the fill transparent | Under the size line, led by the amber warning mark: "JPEG has no transparency; empty areas will be white." |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-74 "the card is too small" on Corner shots

In the Corner shots sheet, when the engine can't make corner shots for any reason, the size line reads "Sheet · the card is too small" or "4 photos · the card is too small", and **Share corners** and **Download corners** stay live.

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "the card is too small", `#cornerReadout`
- Source: `js/app/corner-shots.js` (`readout`, `syncCornerShots`, `currentShots`)
- Ruling: R20. Both save buttons are dimmed, and the size line ends "· the card is too small" when that is the reason, "· fix the corners in Perspective first" for any other (wording approved by Rich, tests/catalog/wording.md). The app differs today.
- Cases: 1

### MSG-74.1 Corner shots that can't be made give the real reason   [auto: phone]
Written to ruling R20, in the wording Rich approved; it fails until that is built (BUG-120).
Script only
Stand-in: no photo or control makes the engine refuse a card with valid corners, so the script makes it refuse; and no case uses a desktop browser's own share sheet, so the page gets a stand-in share sheet, which shows **Share corners**.

Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step; the engine refusing corner shots with "Transform is not invertible."

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Corner shots** | The corner size line reads "Sheet · fix the corners in Perspective first"; **Share corners** and **Download corners** are greyed out (shown dim and not answering a tap) |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-75 The Upscale question for a single photo

When **Download**, **Share** or **Copy** would save a crop whose long edge is under the chosen Size, the question box (the box over the dimmed photo with a question and buttons) asks "Upscale to {Size} px?" with "The crop is {width} × {height} px at the photo’s resolution.", **Yes** (red), **No** and **Cancel**.

- Risk: medium
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Upscale to ", "The crop is ", `#pairPrompt`, `#btnPromptFirst`
- Source: `js/app/export.js` (`askUpscale`, `offeredUpscale`, `doExport`); `js/app/pair.js` (`showPrompt`); `js/app/parts/alert-card.js` (`showAlert`)
- Cases: 1

### MSG-75.1 The Upscale question for a single photo   [auto: phone]
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step, with **2000** selected

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Download** | The question box (the box over the dimmed photo with a question and buttons) asks "Upscale to 2000 px?" and reads "The crop is 1074 × 1074 px at the photo’s resolution.", with **Yes** in red, **No** and **Cancel** |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-76 The Upscale question for a pair's Together image

For a pair with **Together** chosen, or a pair's **Copy**, when the joined image's long edge is under the chosen Size, the question box's text reads "The image is {width} × {height} px at the photos’ resolution."

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "The image is ", " px at the photos’ resolution.", `#pairPrompt`
- Source: `js/app/pair.js` (`pairUpscaleOffer`, `exportPair`); `js/app/export.js` (`askUpscale`)
- Cases: 1

### MSG-76.1 The Upscale question for a pair's Together image   [auto: phone]
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: the pair made: the front opened, then on Export **Add back** and the back chosen; the back open on Perspective; then the Export step, with **Together** and **2000** selected

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Download** | The question box (the box over the dimmed photo with a question and buttons) asks "Upscale to 2000 px?" and reads "The image is 1583 × 1100 px at the photos’ resolution." |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-77 The Upscale question for a pair saved Separately

For a pair with **Separately** chosen, when either side's file would be under the chosen Size, the question box's text reads "The front is {width} × {height} px and the back {width} × {height} px at the photos’ resolution."

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "The front is ", " px and the back ", `#pairPrompt`
- Source: `js/app/pair.js` (`pairUpscaleOffer`, `exportPair`); `js/app/export.js` (`askUpscale`)
- Ruling: R50. The question names only the side **Yes** would upscale ("The front is W × H px at the photo’s resolution.", approved wording, tests/catalog/wording.md); both sides only when both are under the size. The app differs today: it names both whenever either is under.
- Cases: 2

### MSG-77.1 The Upscale question for a pair saved Separately   [auto: phone]
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: the pair made: the front opened, then on Export **Add back** and the back chosen; the back open on Perspective; then the Export step, with **Together** and **2000** selected

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Separately** | **Separately** is selected (a white fill) |
| 2 | Tap **Download** | The question box (the box over the dimmed photo with a question and buttons) asks "Upscale to 2000 px?" and reads "The front is 748 × 1047 px and the back 785 × 1100 px at the photos’ resolution." |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### MSG-77.2 With one side over the size, the question names only the other   [auto: phone]
Written to ruling R50, in the wording Rich approved; it fails until that is built (BUG-280).

Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: the pair made: the front opened, then on Export **Add back** and the back chosen; the back open on Perspective; then the Export step, with **Together** and **2000** selected

At **1080** the front's card, 748 × 1047 px, is under the size; the back's, 785 × 1100 px, is over it and is scaled down, so **Yes** would upscale the front only.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Separately** | **Separately** is selected (a white fill) |
| 2 | Tap **1080** | **1080** is selected (a white fill) |
| 3 | Tap **Download** | The question box asks "Upscale to 1080 px?" and reads "The front is 748 × 1047 px at the photo’s resolution.": the back isn't named |

## MSG-78 The Upscale question for corner shots

When a corner file would be under 2000 px, **Share corners** and **Download corners** ask "Upscale to 2000 px?" with "The sheet is {size} px at the photo’s resolution." or "Each corner is {size} px at the photo’s resolution." The question box lies above the open Corner shots sheet.

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "The sheet is", "Each corner is", " px at the photo’s resolution.", `CONFIG.cornerShots.upscaleTargetPx`
- Source: `js/app/corner-shots.js` (`saveCornerShots`); `js/app/export.js` (`askUpscale`)
- Cases: 1

### MSG-78.1 The Upscale question for corner shots   [auto: phone]
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Corner shots** | The Corner shots sheet rises, with **1 sheet** selected |
| 2 | Tap **Download corners** | The question box (the box over the dimmed photo with a question and buttons), above the open sheet, asks "Upscale to 2000 px?" and reads "The sheet is 314 px at the photo’s resolution." |
| 3 | Tap **Cancel** | The question box goes; the sheet stays open |
| 4 | Tap **4 photos** | **4 photos** is selected (a white fill) |
| 5 | Tap **Download corners** | The question box asks "Upscale to 2000 px?" and reads "Each corner is 156 px at the photo’s resolution." |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-79 The Unpair question box

**Unpair** in the top bar asks, in the question box, "Unpair" with "Keep one side as a single photo.", **Keep front** and **Keep back** (neither is red) and **Cancel**.

- Risk: medium
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Keep one side as a single photo.", "Keep front", "Keep back", `#btnUnpair`
- Source: `js/app/pair.js` (`askUnpair`, `showPrompt`)
- Cases: 1

### MSG-79.1 The Unpair question box   [auto: phone]
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: the pair made: the front opened, then on Export **Add back** and the back chosen; the back open on Perspective

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Unpair** (beside **Front** / **Back** in the top bar) | The question box (the box over the dimmed photo with a question and buttons) asks "Unpair" and reads "Keep one side as a single photo.", with **Keep front**, **Keep back** (neither red) and **Cancel** |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-80 The New photo question box

Open, drop or paste while a pair is open asks, in the question box, "New photo" with "End the pair, or replace the side you’re on?", **New photo**, **Replace front** or **Replace back** (the side on screen) and **Cancel**. **Next card** and **Add back** don't ask.

- Risk: medium
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "End the pair, or replace the side you’re on?", "Replace ", `#pairPrompt`, `#btnPromptSecond`
- Source: `js/app/pair.js` (`receivePhoto`, `showPrompt`)
- Ruling: R65. The New photo question's title and its first button both read **New photo**. The app already does this.
- Cases: 1

### MSG-80.1 The New photo question box   [auto: phone]

Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/; then IMG_9136.JPEG from samples/
- Starting screen: the pair made: the front opened, then on Export **Add back** and the back chosen; the back open on Perspective

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Open** (the folder at the top left; on a phone it has no label) and choose IMG_9136.JPEG | The question box (the box over the dimmed photo with a question and buttons) asks "New photo" and reads "End the pair, or replace the side you’re on?", with **New photo**, **Replace back** and **Cancel** |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-81 "Fix the corners in Perspective first." on the photo

When the corners are invalid, "Fix the corners in Perspective first." is drawn in grey at the center of the photo area in place of the picture, on every step after Perspective. Perspective's corner view keeps the photo; what its **Preview** reads is VIEW-14's.

- Risk: medium
- Check: eye
- Layout: both.
- Added: 1.10 baseline
- Changed: 1.10.0
- Anchors: "Fix the corners in Perspective first.", "Fix the corners first."
- Source: `js/app/view.js` (`draw`, `drawMessage`)
- Ruling: R82. On Perspective itself the words read "Fix the corners first." (approved wording, tests/catalog/wording.md); elsewhere they stay "Fix the corners in Perspective first." The app does this since 1.10.0.
- Cases: 1

### MSG-81.1 "Fix the corners in Perspective first." on the photo, for a person to judge   [eye]

Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Drag the top-left corner handle past the bottom-right one | The corner lines cross |
| 2 | Tap **Rotate** in the step tabs (the six tabs along the bottom) | In place of the photo, grey text centered in the photo area reads "Fix the corners in Perspective first."; no picture is drawn |

Pass: every row's result is seen.
On a fail, record: what differs from the description, the screenshot.

## MSG-82 "Fix the corners of both sides in Perspective first." on the photo

On Export for a pair with **Together** chosen, when either side's corners are invalid, "Fix the corners of both sides in Perspective first." is drawn in grey in place of the joined image.

- Risk: low
- Check: eye
- Layout: both.
- Added: 1.10 baseline
- Changed: 1.10.0
- Anchors: "Fix the corners of both sides in Perspective first.", "’s corners in Perspective first."
- Source: `js/app/view.js` (`drawTogether`, `drawMessage`); `js/app/export-controls.js` (`syncExportReadouts`); `js/app/pair.js` (`waitingSideToFix`)
- Ruling: R26. With the waiting side's corners invalid, Export's size line reads "Fix the back’s corners in Perspective first." (or "Fix the front’s corners…") and **Share**, **Download** and **Copy** are dimmed (wording approved by Rich, tests/catalog/wording.md). The app does this since 1.10.0.
- Cases: 2

### MSG-82.1 "Fix the corners of both sides in Perspective first." on the joined image, for a person to judge   [eye]
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: the pair made: the front opened, then on Export **Add back** and the back chosen; the back open on Perspective

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Drag the back's top-left corner handle past its bottom-right one | The corner lines cross |
| 2 | Tap **Export** in the step tabs (the six tabs along the bottom) | With **Together** selected, grey text centered in the photo area reads "Fix the corners of both sides in Perspective first."; no joined image is drawn |

Pass: every row's result is seen.
On a fail, record: what differs from the description, the screenshot.

### MSG-82.2 With the waiting side's corners crossed, Export names the side to fix   [auto: phone]
Script only
Stand-in: no case uses a desktop browser's own share sheet, so the page gets a stand-in share sheet, which shows **Share**.

Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: the pair made: the front opened, then on Export **Add back** and the back chosen; the back open on Perspective

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Drag the back's top-left corner handle past its bottom-right one | The corner lines cross |
| 2 | Tap **Front** in the top bar | The front opens on the Perspective step |
| 3 | Tap **Export** in the step tabs (the six tabs along the bottom) | The size line reads "Fix the back’s corners in Perspective first."; **Share**, **Download** and **Copy** are greyed out (shown dim and not answering a tap) |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-83 Perspective's tips

**Tips** in "Perspective options" opens four paragraphs in place: dragging and double-tapping handles, "The arrows nudge the selected handle. Hold one to repeat.", what Flatten's 0% and 100% do, and "Corners on the wrong card? Tap to find card, then tap the card."

- Risk: low
- Check: script
- Layout: both. A wide screen lists the tips always open under "Tips and keys" and leaves out the first, which is about touch.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#perspectiveTips`, "The arrows nudge the selected handle. Hold one to repeat.", "Corners on the wrong card? Tap to find card, then tap the card."
- Source: `js/app/perspective.js` (`buildPerspectiveSheet`); `js/app/parts/sheet.js` (`buildTipsRow`, `buildTipHint`)
- Cases: 1

### MSG-83.1 Perspective's tips   [auto: phone]
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap the options tab (the small tab with an up arrow on the top edge of the controls) | PERSPECTIVE OPTIONS rise from the bottom |
| 2 | Tap **Tips** | Four paragraphs open in place, in this order: "Drag a corner or the middle of an edge. Double tap a handle to zoom in on it; double tap again to zoom out.", "The arrows nudge the selected handle. Hold one to repeat.", "Flatten: 0% squares the card up but keeps the camera’s depth. 100% is a flat 5:7 rectangle, like a scan." and "Corners on the wrong card? Tap to find card, then tap the card." |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-84 Rotate's tips

**Tips** in "Rotate options" opens four paragraphs: the ruler and the typed angle ("Drag the ruler to straighten, or tap the angle to type it."), **Fill frame**, **Flip**, and "The grid is a guide; it is never exported."

- Risk: low
- Check: script
- Layout: both. A wide screen lists the tips always open under "Tips and keys".
- Added: 1.10 baseline
- Changed: none
- Anchors: `#rotateTips`, "Drag the ruler to straighten, or tap the angle to type it.", "The grid is a guide; it is never exported."
- Source: `js/app/rotate.js` (`buildRotateControls`); `js/app/parts/sheet.js` (`buildTipsRow`)
- Cases: 1

### MSG-84.1 Rotate's tips   [auto: phone]
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Rotate step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap the options tab (the small tab with an up arrow on the top edge of the controls) | ROTATE OPTIONS rise from the bottom |
| 2 | Tap **Tips** | Four paragraphs open in place, in this order: "Drag the ruler to straighten, or tap the angle to type it.", "Fill frame zooms in so a tilted photo leaves no empty corners.", "Flip mirrors the photo as you see it on screen." and "The grid is a guide; it is never exported." |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-85 Crop's tip

**Tips** in "Crop options" opens one paragraph: "Drag inside the box to move it, and its handles to resize."

- Risk: low
- Check: script
- Layout: both. A wide screen lists the tip always open under "Tips and keys".
- Added: 1.10 baseline
- Changed: none
- Anchors: `#cropTips`, "Drag inside the box to move it, and its handles to resize."
- Source: `js/app/crop.js` (`buildCropControls`); `js/app/parts/sheet.js` (`buildTipsRow`)
- Cases: 1

### MSG-85.1 Crop's tip   [auto: phone]
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Crop step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap the options tab (the small tab with an up arrow on the top edge of the controls) | CROP OPTIONS rise from the bottom |
| 2 | Tap **Tips** | One paragraph opens in place: "Drag inside the box to move it, and its handles to resize." |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-86 Levels' tips

Levels' sheet, titled "Levels tips", is its tips: three paragraphs on picking white and black, what **Auto** does, and "Hold the photo to compare with no levels. Clear, then Apply, removes levels."

- Risk: low
- Check: script
- Layout: both. A wide screen lists the paragraphs inline and adds the keyboard help under its own "Tips and keys" heading.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#levelsSheet`, "Levels tips", "Hold the photo to compare with no levels. Clear, then Apply, removes levels."
- Source: `js/app/levels.js` (`buildLevelsSheet`)
- Ruling: R74. On a wide screen Levels shows one heading, "Tips and keys", holding the tips then the keys. The app differs today.
- Cases: 1

### MSG-86.1 Levels' tips   [auto: phone]
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap the options tab (the small tab with an up arrow on the top edge of the controls) | A sheet titled LEVELS TIPS rises, holding three paragraphs, in this order: "White: tap a grading label or the card’s white border; avoid foil and reflections. Black is optional.", "Auto estimates both from the framed image; colored backdrops can fool it, so check the result." and "Hold the photo to compare with no levels. Clear, then Apply, removes levels." |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-87 Overlay's tips

**Tips** in "Overlay options" opens four paragraphs: the rings, dragging and pinching, "On this step the photo stays framed as set in Crop.", the logo kept in the browser, and "Delete saved leaves the logo on this photo."

- Risk: low
- Check: script
- Layout: both. A wide screen lists the tips always open under "Tips and keys" and leaves out the first, which is about touch.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#overlayTips`, "On this step the photo stays framed as set in Crop.", "Delete saved leaves the logo on this photo."
- Source: `js/app/overlay.js` (`buildOverlayControls`); `js/app/parts/sheet.js` (`buildTipsRow`, `buildTipHint`)
- Cases: 1

### MSG-87.1 Overlay's tips   [auto: phone]
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Overlay step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap the options tab (the small tab with an up arrow on the top edge of the controls) | OVERLAY OPTIONS rise from the bottom |
| 2 | Tap **Tips** | Four paragraphs open in place, in this order: "Tap a ring to snap the logo to that corner, side or the center. Drag to move it; drag a corner or pinch to resize.", "On this step the photo stays framed as set in Crop.", "Your last logo is kept in this browser for the next photo." and "Delete saved leaves the logo on this photo." |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-88 Export's tips

**Tips** in "Export options" opens three paragraphs: "Share’s Save Image puts the photo in Photos.", what **Original** does, and "Next card shows once these edits are exported." Today a fourth says what an edits file is; ruling R61 takes it away, since the hint under **Save edits** and **Load edits** says it (MSG-89).

- Risk: low
- Check: script
- Layout: both. A wide screen lists the tips always open under "Tips" and leaves out the first (and the fourth, while there is one).
- Added: 1.10 baseline
- Changed: none
- Anchors: `#exportTips`, "Share’s Save Image puts the photo in Photos.", "Next card shows once these edits are exported."
- Source: `js/app/export-controls.js` (`buildExportControls`); `js/app/parts/sheet.js` (`buildTipsRow`, `buildTipHint`)
- Ruling: R62. The Next card tip need not mention the wait while **Share now** is pending. The app already does this. R61. Export's last tip, which nearly repeats the hint under **Save edits** and **Load edits**, goes; the hint stays. The app differs today.
- Cases: 1

### MSG-88.1 Export's tips   [auto: phone]
Written to ruling R61; it fails until that is built (BUG-285).

Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap the options tab (the small tab with an up arrow on the top edge of the controls) | EXPORT OPTIONS rise from the bottom |
| 2 | Tap **Tips** | Three paragraphs open in place, in this order: "Share’s Save Image puts the photo in Photos.", "Original keeps the crop at the photo’s own resolution and never upscales." and "Next card shows once these edits are exported."; none says "An edits file is small." |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-89 The hints in the Corner shots and Export sheets

The Corner shots sheet says "Close-ups of the card’s four corners, at the photo’s own resolution, with this photo’s levels and no overlay." Under **Save edits** and **Load edits**, Export's options say "A small JSON file. Re-open the same photo, load it, and the export is identical.", led in bold by "Saves the side you’re on." while a pair is open.

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Close-ups of the card’s four corners", "A small JSON file. Re-open the same photo, load it, and the export is identical.", `#editsPairHint`
- Source: `js/app/corner-shots.js` (`buildCornerShotsControls`); `js/app/export-controls.js` (`buildEditsGroup`); `js/app/pair.js` (`syncPair`)
- Ruling: R61. The hint under **Save edits** and **Load edits** stays; Export's last tip, which nearly repeats it, goes. The app differs today.
- Cases: 3

### MSG-89.1 The Corner shots sheet's hint   [auto: phone]
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Corner shots** | The Corner shots sheet rises and reads "Close-ups of the card’s four corners, at the photo’s own resolution, with this photo’s levels and no overlay." |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### MSG-89.2 The hint under the edits buttons   [auto: phone]
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap the options tab (the small tab with an up arrow on the top edge of the controls) | EXPORT OPTIONS rise from the bottom; under **Save edits** and **Load edits**: "A small JSON file. Re-open the same photo, load it, and the export is identical." |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### MSG-89.3 With a pair open, the edits hint says which side it saves   [auto: phone]

Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: the pair made: the front opened, then on Export **Add back** and the back chosen; the back open on Perspective; then the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap the options tab (the small tab with an up arrow on the top edge of the controls) | EXPORT OPTIONS rise from the bottom; under **Save edits** and **Load edits** the hint reads "Saves the side you’re on. A small JSON file. Re-open the same photo, load it, and the export is identical.", its first sentence in bold |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-90 Keyboard help on a wide screen

Under the heading "Tips and keys", each step except Export adds one paragraph of keyboard help, such as Rotate's "F fits; 1 to 6 change step." and Crop's "Shift keeps the aspect in Free."

- Risk: low
- Check: script
- Layout: wide. A phone hides the keyboard help.
- Added: 1.10 baseline
- Changed: none
- Anchors: `.sheet-keys`, "Tips and keys", "F fits; 1 to 6 change step.", "Shift keeps the aspect in Free."
- Source: `js/app/parts/sheet.js` (`buildTipsRow`); `js/app/levels.js` (`buildLevelsSheet`); `js/app/perspective.js` (`buildPerspectiveSheet`); `js/app/overlay.js` (`buildOverlayControls`)
- Ruling: R54. The help line needn't say the photo needs the focus first. R68. Perspective's help may say "arrows" for the on-screen pad and for the keys. The app already does this.
- Cases: 1

### MSG-90.1 Keyboard help on a wide screen   [auto: desktop]

Before you start:
- Device and browser: a wide window (1280 × 800), a mouse and keyboard
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Rotate step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Read the panel at the right, under "Tips and keys" | On Rotate, the keyboard help reads "F fits; 1 to 6 change step." |
| 2 | Click **Crop** in the top bar | On Crop, under "Tips and keys": "Shift keeps the aspect in Free." |
| 3 | Click **Export** in the top bar | On Export there is no keyboard help |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-91 Names for screen readers, and tooltips

Every control without visible text has a name a screen reader announces: **Open photo**, **Unpair**, **Fit to screen**, **Undo**, **Redo**, "Options" for the tab with the up arrow above the controls, "Close" on a sheet, the nudge keys, the corner thumbnails and "Close tuning". Labelled controls show a tooltip on hover, such as "Undo (Ctrl/Cmd+Z)".

- Risk: low
- Check: script
- Layout: both. Tooltips show only with a mouse; on a wide screen the Open button also shows the word "Open".
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnOpen`, `#btnFit`, "Fit to screen (F)", "Redo (Shift+Ctrl/Cmd+Z)"
- Source: `js/app/parts/top-bar.js` (`buildTopBar`, `buildIconButton`); `js/app/parts/adjustment-line.js` (`buildControlArea`); `js/app/parts/sheet.js` (`buildSheet`); `js/app/perspective.js` (`buildNudgeRow`); `js/app/corner-shots.js` (`buildThumbnails`); `js/app/debug-panel.js` (`buildDebugPanel`)
- Ruling: R66. **Redo**'s tooltip names only Shift+Ctrl/Cmd+Z. The app already does this.
- Cases: 4

### MSG-91.1 Controls without words have names for screen readers   [auto: phone]
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Rotate step, zoomed in by spreading two fingers apart on the photo, so that a third button shows at the right of the top bar, beside the two arrows; then a screen reader turned on (with VoiceOver, swipe right to move to the next control and double-tap to press it)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Move through the top bar's buttons | They are named "Open photo", "Fit to screen", "Undo" and "Redo" |
| 2 | Move to the options tab (the small tab with an up arrow on the top edge of the controls) | It is named "Options" |
| 3 | Press the options tab | ROTATE OPTIONS rise from the bottom |
| 4 | Move to the cross (×) at the sheet's top right | It is named "Close" |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### MSG-91.2 Tooltips on a wide screen   [auto: desktop]
Before you start:
- Device and browser: a wide window (1280 × 800), a mouse and keyboard
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Rotate step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Hover over **Undo**, **Redo** and **Fit**, in turn | Undo's tooltip reads "Undo (Ctrl/Cmd+Z)", Redo's "Redo (Shift+Ctrl/Cmd+Z)" and Fit's "Fit to screen (F)" |
| 2 | Look at the Open button | the Open button shows the word "Open" |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### MSG-91.3 The nudge keys, Close tuning and the corner thumbnails have names   [auto: desktop]
Before you start:
- Device and browser: a wide window (1280 × 800), a mouse (the tuning panel is a developer's tool; on a phone it covers the start screen)
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the app opened from a link ending ?debug, then the photo opened with **Open photo** on the start screen: the photo open on the Perspective step, the Detection tuning panel showing; a screen reader on

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Move through the four arrow keys under **Nudge** | They are named "Nudge left", "Nudge up", "Nudge down" and "Nudge right" |
| 2 | Move to the tuning panel's close button (×) | It is named "Close tuning" |
| 3 | Click **Export** in the top bar | The Export step's controls show |
| 4 | Click **Corner shots** | The four corner thumbnails show |
| 5 | Move through the four thumbnails | They are named "Top-left corner", "Top-right corner", "Bottom-left corner" and "Bottom-right corner" |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### MSG-91.4 Unpair has a name   [auto: phone]
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: the pair made: the front opened, then on Export **Add back** and the back chosen; the back open on Perspective; a screen reader on

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Move to the button beside **Front** / **Back** in the top bar | Unpair, beside Front / Back, is named Unpair |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-92 What the app writes to the console

The console shows the version at start, each photo's load time and each side switch's time, and warns about link settings it ignored, a session or pair that couldn't be saved or restored, a photo not reloaded after a pair's export, and the background worker falling back to the main thread.

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "[card-finisher] URL settings ignored", "[card-finisher] Web Worker unavailable, running on main thread:", "[card-finisher] session photo not saved:", "loaded + previewed in"
- Source: `js/app/main.js` (`init`); `js/app/core.js` (the link settings, at load); `js/app/state.js` (`openFile`); `js/app/adapters.js` (`EngineWorker.fail`, `Session.savePhoto`, `Session.flush`); `js/app/pair.js` (`switchSide`, `savePairSession`, `restorePair`, `reloadOpenPhoto`)
- Cases: 4

### MSG-92.1 The console shows the version and each photo's load time   [auto: phone]
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the start screen, the developer tools' console open

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Read the console | It reads "[card-finisher] vX.Y.Z", with the build's version |
| 2 | Tap **Open photo** on the start screen and choose 01_chrome_flat_black.JPEG | Then "[card-finisher] 01_chrome_flat_black.JPEG: 1536×2048 loaded + previewed in N ms", N the milliseconds it took |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### MSG-92.2 The console warns about link settings it ignored   [auto: phone]
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: none
- Starting screen: the app opened from a link ending ?nonsense=1, the developer tools' console open

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Read the console | the console warns "[card-finisher] URL settings ignored …", naming nonsense |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### MSG-92.3 The console warns when the photo couldn't be saved   [auto: phone]
Script only
Stand-in: a person can't make the browser refuse to store one thing on purpose, so the script makes the device refuse to store the photo, as a full disk would.

Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the start screen, the developer tools' console open

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Open photo** on the start screen and choose 01_chrome_flat_black.JPEG | The photo opens; the console warns "[card-finisher] session photo not saved:" |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### MSG-92.4 The console warns when the background worker falls back   [auto: phone]
Script only
Stand-in: every browser the app supports can start a background worker, so the script takes the browser's background workers away before the app loads.

Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the start screen, the developer tools' console open

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Open photo** on the start screen and choose 01_chrome_flat_black.JPEG | The console warns "[card-finisher] Web Worker unavailable, running on main thread:"; the photo still opens with its corner handles on the card |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.
