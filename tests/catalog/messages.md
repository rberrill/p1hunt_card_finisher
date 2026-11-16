# Messages

Every message the app shows: the short messages over the photo, the lines that take the row above the controls, the notes under Export's size line, the question cards, the text drawn on the photo, the tips, the names screen readers hear and what the app writes to the console.

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
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Auto** | "Auto set white and black points. Check them, then Apply." shows over the photo |
| 2 | Tap **Pick black** | Pick black is selected; the message is still up |
| 3 | Tap the white background just left of the slab, halfway down | "That spot is too light to be a black point. Pick something dark, or skip the black point." takes its place at once, the first fading out beneath it; one message shows |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### MSG-01.2 The message sits over the photo's bottom edge   [auto: both]
Before you start:
- Device and browser: a phone-width window (390 × 844, touch) or a wide window (1280 × 800, a mouse)
- Build: the build under test
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Pick black** | Pick black is selected |
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
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step
- notes.json is any short text file that is not JSON.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Auto** and time the message | "Auto set white and black points. Check them, then Apply." stays 3 s |
| 2 | Tap **Pick black**, then the white background just left of the slab, halfway down, and time the message | "That spot is too light to be a black point. Pick something dark, or skip the black point." stays 5 s |
| 3 | Go to Export, open **Export options** (the tab with the up arrow above the controls) and tap **Load edits** | a file picker opens |
| 4 | Choose notes.json, a text file of notes, and time the message | "That file isn’t valid JSON." stays 6 s |

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
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Auto** | "Auto set white and black points. Check them, then Apply." is a white pill with no icon |
| 2 | Tap **Pick black**, then the white background just left of the slab, halfway down | "That spot is too light to be a black point. Pick something dark, or skip the black point." is amber, led by a triangle |
| 3 | Go to Export, open **Export options**, tap **Load edits** and choose notes.json, a text file of notes | "That file isn’t valid JSON." is red, led by a circle |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### MSG-03.2 The three kinds of message, for a person to judge   [eye]
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Auto** | a white pill with dark bold text and no icon, over the photo's bottom edge |
| 2 | Tap **Pick black**, then the white background just left of the slab, halfway down | an amber pill led by a dark triangle with an exclamation mark, its text readable against the amber |
| 3 | Go to Export, open **Export options**, tap **Load edits**, choose notes.json, a text file of notes, and close the options | a red pill led by a circle with an exclamation mark, its text white and readable against the red |

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
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Auto** | the message covers the point the drag starts from |
| 2 | At once, drag from the middle of the message 60 px to the right | the photo moves 60 px to the right, as a drag on the photo does |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### MSG-04.2 A long message is cut to three lines   [auto: phone]
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Perspective step
- Stand-in: no photo makes card detection fail, so the script makes the detector report an error before the tap. Its error is a paragraph long.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Open **Perspective options** and tap **Tap to find card** | the line above the controls reads "Tap the card in the photo." |
| 2 | Tap the middle of the photo | the message shows three lines of text, the rest cut off |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### MSG-04.3 A message is announced without interrupting   [auto: phone]
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | With a screen reader on, tap **Auto** | the message is a polite status: read out when the screen reader is free |

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
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Pick black**, then the white background just left of the slab, halfway down | the message's bottom is 36 px above the photo area's bottom edge |
| 2 | Open the Levels tips (the tab with the up arrow above the controls) | with Levels tips open, the message's bottom is 36 px above the sheet's top edge |
| 3 | Close the sheet with its **×** | with the sheet closed, the message is back 36 px above the photo area's bottom edge |

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
- Flag: to confirm. Three different words say the app is busy: "Loading…" here, "Opening the front…" for a side switch and "Detecting…" on Perspective.
- Cases: 1

### MSG-06.1 "Loading…" shows while a photo opens   [auto: phone]
Flag: to confirm. Written to what the app does today: three different words say the app is busy ("Loading…", "Opening the front…", "Detecting…").
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the start screen

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Open photo** and choose the photo | "Loading…" shows, white, while the photo opens |
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
- Photo: card.HEIC, a HEIC file the browser can't decode (in Chromium any HEIC photo)
- Starting screen: the start screen

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Open photo** and choose card.HEIC | a red message reads "This browser can’t open HEIC. Save the photo as JPEG first (Safari opens HEIC directly)." |
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
- Photo: not-a-photo.JPEG, a text file named like a photo
- Starting screen: the start screen

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Open photo** and choose not-a-photo.JPEG | a red message reads "Couldn’t read that file as an image." |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-09 "Resumed where you left off."

An information message, "Resumed where you left off.", after **Resume**, when the stored photo is the same size as the saved edits. When the sizes differ, the photo opens with fresh edits and no message.

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Resumed where you left off.", `#btnResume`
- Source: `js/app/state.js` (`openFile`); `js/app/start-screen.js` (`resumeSession`)
- Ruling: R23. When the saved edits don't fit the stored photo, an amber warning says the edits couldn't be restored and the photo was opened fresh. New wording, to be approved by Rich. The app differs today.
- Cases: 2

### MSG-09.1 Resume says it resumed   [auto: phone]
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo opened once, then the page reloaded: the start screen offers **Resume**

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Resume** | a white message reads "Resumed where you left off." |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### MSG-09.2 Edits that don't fit the photo say it was opened fresh   [auto: phone]
Written to ruling R23; it fails until that is built (BUG-050). The warning's words wait for Rich's approval, so the case checks that one amber warning shows.
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo opened once, then the page reloaded: the start screen offers **Resume**, with the saved edits' photo width changed to one more pixel
- Stand-in: no control changes the saved edits; the script changes the width they were saved for.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Resume** | an amber warning says the edits couldn't be restored and the photo was opened fresh |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-10 "No card-shaped edges found."

A warning, for 5 seconds, when a detection the user started finds nothing: "No card-shaped edges found. Drag the corners into place, or tap to find card and tap the card again." The user starts one with **Tap to find card**, by turning on **Debug overlay**, or from the tuning panel (opening it, **Re-detect**, or a changed setting); detection on opening a photo never shows it.

- Risk: medium
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "No card-shaped edges found.", "Drag the corners into place, or tap to find card and tap the card again."
- Source: `js/app/state.js` (`runDetect`); `js/app/perspective.js` (`bindPerspective`); `js/app/debug-panel.js` (`toggleDebugPanel`, `buildDebugPanel`)
- Ruling: R3. Turning on **Debug overlay** only draws; it runs no detection and leaves the corners alone. The app differs today.
- Flag: to confirm. The row above the controls says "Nothing detected. Drag the corners into place." at the same time, so one condition shows in two wordings; the message also says "tap" on a desktop.
- Cases: 1

### MSG-10.1 A search that finds no card says so   [auto: phone]
Flag: to confirm. Written to what the app does today: the line above the controls says "Nothing detected. Drag the corners into place." at the same time, and the message says "tap" on a desktop too.
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Photo: a plain grey picture, 1200 × 1600 px, with no card in it
- Starting screen: the picture open, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Open **Perspective options** and tap **Tap to find card** | the line above the controls reads "Tap the card in the photo." |
| 2 | Tap the middle of the picture | an amber warning reads "No card-shaped edges found. Drag the corners into place, or tap to find card and tap the card again." |
| 3 | Time the message | it stays 5 s |

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
- Ruling: R24. A fixed sentence with a next step replaces the raw error text, and the detail always goes to the console. New wording, to be approved by Rich. The app differs today.
- Cases: 1

### MSG-11.1 A failed search names no raw error   [auto: phone]
Written to ruling R24; it fails until that is built (BUG-051). The sentence waits for Rich's approval, so the case checks that the error's own words stay out of it.
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Perspective step
- Stand-in: no photo makes card detection fail, so the script makes the detector report an error before the tap.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Open **Perspective options** and tap **Tap to find card** | the line above the controls reads "Tap the card in the photo." |
| 2 | Tap the middle of the photo | the error's own words are written to the console |
| 3 | Read the message | a red message gives a fixed sentence with a next step, without the error's own words |

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
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo opened once, then the page reloaded: the start screen offers **Resume**

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Open the app in a second tab and tap **Start fresh** there | in the second tab, Start fresh takes the card away |
| 2 | Back in the first tab, tap **Resume** | an amber warning reads "The saved photo is gone. Open it again." |

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
- Ruling: R24. A fixed sentence with a next step replaces the raw error text, and the detail always goes to the console. New wording, to be approved by Rich. The app differs today.
- Cases: 1

### MSG-13.1 A Resume that fails names no raw error   [auto: phone]
Written to ruling R24; it fails until that is built (BUG-051). The sentence waits for Rich's approval.
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo opened once, then the page reloaded: the start screen offers **Resume**; then the site's data cleared with the developer tools' **Clear site data**, the card still showing

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Resume** | a red message gives a fixed sentence with a next step, without the browser's error |

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
- Photo: none
- Starting screen: the app opened from a link ending ?selftest

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Wait for the start screen | a white message reads "Self-tests: main N/N, worker N/N", every test passed |
| 2 | Time the message | it stays 8 s |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### MSG-14.2 A link with selftest=0 runs no self-tests   [auto: phone]
Written to ruling R28; it fails until that is built (BUG-171).
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Photo: none
- Starting screen: the app opened from a link ending ?selftest=0

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Wait 3 s on the start screen | no self-test message shows, and no self-tests run |

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
- Flag: to confirm. The message gives no next step.
- Cases: 1

### MSG-15.1 Auto with nothing to go on   [auto: phone]
Flag: to confirm. Written to what the app does today: the message gives no next step.
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Photo: a plain white picture, 1200 × 1600 px
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
- Flag: to confirm. Auto confirms itself with a message, while arming a pick shows none by design.
- Cases: 1

### MSG-16.1 Auto sets both points   [auto: phone]
Flag: to confirm. Written to what the app does today: Auto confirms itself with a message, while arming a pick shows none.
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Auto** | a white message reads "Auto set white and black points. Check them, then Apply." |

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
- Flag: to confirm. Auto confirms itself with a message, while arming a pick shows none by design.
- Cases: 1

### MSG-17.1 Auto sets the white point only   [auto: phone]
Flag: to confirm. Written to what the app does today: Auto confirms itself with a message, while arming a pick shows none.
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Photo: 13_front_landscape_onetouch_labeled_white.JPEG from samples/
- Starting screen: the photo open, on the Levels step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Auto** | a white message reads "Auto set the white point (no clear black). Check it, then Apply." |

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
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Drag the photo 200 px to the right | the empty area past the photo's left edge shows |
| 2 | Tap **Pick white** | Pick white is selected |
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
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Pick black**, then the card’s dark background, up and to the left of the driver’s head | the black swatch fills with a dark grey |
| 2 | Tap **Pick white**, then the same spot | an amber warning reads "That spot is darker than the black point. Pick something brighter."; Pick white stays selected |

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
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Pick black**, then the white background just left of the slab, halfway down | an amber warning reads "That spot is too light to be a black point. Pick something dark, or skip the black point."; Pick black stays selected |

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
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Pick white**, then the card’s dark background, up and to the left of the driver’s head | the white swatch fills with a dark grey |
| 2 | Tap **Pick black**, then the same spot | an amber warning reads "That spot is brighter than the white point. Pick something darker."; Pick black stays selected |

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
- Cases: 1

### MSG-22.1 A single photo's Download says what it saved   [auto: phone]
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Download**, then **No** on the Upscale question | the file is saved |
| 2 | Read the message and the saved file's size | a white message reads "Exported W × H px in N s.", with the saved file's size |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-23 "Exported the Together image in … s."

An information message after a pair's **Download** or **Share** with **Together** chosen: "Exported the Together image in {seconds} s."

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "the Together image", `#pairOutput`
- Source: `js/app/pair.js` (`deliverPair`); `js/app/export.js` (`toastSaved`)
- Cases: 1

### MSG-23.1 A pair's Together Download says so   [auto: phone]
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Photo: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: the pair made: the front opened, then on Export **Add back** and the back chosen; the back open on Perspective; then the Export step, **Together** chosen

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Download**, then **No** on the Upscale question | one file is saved |
| 2 | Read the message | a white message reads "Exported the Together image in N s." |

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
- Cases: 1

### MSG-24.1 A pair's Separately Download says so   [auto: phone]
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Photo: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: the pair made: the front opened, then on Export **Add back** and the back chosen; the back open on Perspective; then the Export step, **Together** chosen

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Separately** | Separately is selected |
| 2 | Tap **Download**, then **No** on the Upscale question | two files are saved |
| 3 | Read the message | a white message reads "Exported the front and back in N s." |

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
- Flag: to confirm. Corner shots say "Saved", while the main export and a pair say "Exported".
- Cases: 1

### MSG-25.1 Download corners with 1 sheet says so   [auto: phone]
Flag: to confirm. Written to what the app does today: corner shots say "Saved", while the main export and a pair say "Exported".
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open from a link ending ?cornerShots.upscaleTargetPx=0 (no Upscale question for corner shots), on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Corner shots**, then **1 sheet** | the Corner shots sheet is open, 1 sheet selected |
| 2 | Tap **Download corners** | one file is saved |
| 3 | Read the message | a white message reads "Saved the corner sheet in N s." |

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
- Flag: to confirm. Corner shots say "Saved", while the main export and a pair say "Exported".
- Cases: 1

### MSG-26.1 Download corners with 4 photos says so   [auto: phone]
Flag: to confirm. Written to what the app does today: corner shots say "Saved", while the main export and a pair say "Exported".
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open from a link ending ?cornerShots.upscaleTargetPx=0 (no Upscale question for corner shots), on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Corner shots**, then **4 photos** | the Corner shots sheet is open, 4 photos selected |
| 2 | Tap **Download corners** | four files are saved |
| 3 | Read the message | a white message reads "Saved 4 corner shots in N s." |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-27 The format the browser couldn't save

When the browser saves another format than the one chosen (Safari has no WebP encoder), the finished-export message gains a sentence, "{CHOSEN} isn’t supported by this browser, so it was saved as {SAVED}." (for example WEBP and PNG), and shows as an amber warning for 6 seconds. It applies to the main export, a pair and corner shots.

- Risk: medium
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: " isn’t supported by this browser, so it was saved as ", `#exportFormat`
- Source: `js/app/export.js` (`fallbackNote`, `toastSaved`)
- Flag: to confirm. The sentence says what happened after the fact and gives no next step.
- Cases: 1

### MSG-27.1 A format the browser couldn't save is named   [auto: phone]
Flag: to confirm. Written to what the app does today: the sentence says what happened after the fact and gives no next step.
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step, in a browser that can't save WebP (Safari)
- Stand-in: Chromium can save WebP, so the script makes it hand back a PNG when asked for WebP, as Safari does.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **WebP** | WebP is selected |
| 2 | Tap **Download**, then **No** on the Upscale question | the file is a PNG; an amber warning reads "Exported W × H px in N s. WEBP isn’t supported by this browser, so it was saved as PNG." |
| 3 | Time the message | it stays 6 s |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-28 "Tap Share now to open the share sheet."

When the browser refuses to share because the tap was too long ago (a slow export), the finished-export message gains "Tap Share now to open the share sheet." and stays 6 seconds (white, or amber with MSG-27's sentence). Tapping **Share now** takes it down.

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Tap Share now to open the share sheet.", `#btnShare`, `#btnCornerShare`
- Source: `js/app/export.js` (`toastSaved`, `sharePending`); `js/app/corner-shots.js` (`shareCornerShots`)
- Flag: to confirm. The message says "Tap" on a desktop too.
- Cases: 1

### MSG-28.1 A refused share says to tap Share now   [auto: phone]
Flag: to confirm. Written to what the app does today: the message says "Tap" on a desktop too.
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step; the browser refuses the first share because the tap was too long ago
- Stand-in: a script stands in for the share sheet and refuses the first share, as a browser does after a slow export (no case uses a desktop browser's own share sheet).

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Share**, then **No** on the Upscale question | a white message reads "Exported W × H px in N s. Tap Share now to open the share sheet."; Share reads Share now |
| 2 | Tap **Share now** | the message goes at once |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-29 "Copied to clipboard (PNG)."

An information message after **Copy** puts a single photo, or a pair's Together image, on the clipboard: "Copied to clipboard (PNG)."

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Copied to clipboard (PNG).", `#btnCopy`
- Source: `js/app/export.js` (`runExport`); `js/app/pair.js` (`runPairExport`)
- Cases: 1

### MSG-29.1 Copy says what it put on the clipboard   [auto: phone]
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step; the page allowed to use the clipboard

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Copy**, then **No** on the Upscale question | a white message reads "Copied to clipboard (PNG)." |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-30 "Copy failed: …"

An error message, for 6 seconds, when anything fails during **Copy**: "Copy failed: " followed by the error's own text.

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Copy failed: ", `#btnCopy`
- Source: `js/app/export.js` (`runExport`); `js/app/pair.js` (`runPairExport`)
- Ruling: R24. A fixed sentence with a next step replaces the raw error text, and the detail always goes to the console. New wording, to be approved by Rich. The app differs today.
- Cases: 1

### MSG-30.1 A failed Copy names no raw error   [auto: phone]
Written to ruling R24; it fails until that is built (BUG-051).
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step
- Stand-in: the script makes the clipboard refuse every write, as a browser that blocks the page does.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Copy**, then **No** on the Upscale question | the error's own words are written to the console |
| 2 | Read the message | a red message gives a fixed sentence with a next step, without the error's own words |

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
- Ruling: R24. A fixed sentence with a next step replaces the raw error text, and the detail always goes to the console (today a failed pair Upscale question is not logged). New wording, to be approved by Rich. The app differs today.
- Cases: 1

### MSG-31.1 A failed Download names no raw error   [auto: phone]
Written to ruling R24; it fails until that is built (BUG-051).
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step
- Stand-in: no control makes the browser fail to encode, so the script makes it hand back no file, as a canvas too big for it does.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Download**, then **No** on the Upscale question | the error's own words are written to the console |
| 2 | Read the message | a red message gives a fixed sentence with a next step, without the error's own words |

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
- Ruling: R24. A fixed sentence with a next step replaces the raw error text, and the detail always goes to the console. New wording, to be approved by Rich. The app differs today.
- Cases: 1

### MSG-32.1 A failed share names no raw error   [auto: phone]
Written to ruling R24; it fails until that is built (BUG-051).
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step; the share sheet fails with an error of its own
- Stand-in: a script stands in for the share sheet and fails with "The stand-in share sheet failed".

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Share**, then **No** on the Upscale question | the error's own words are written to the console |
| 2 | Read the message | a red message gives a fixed sentence with a next step, without the error's own words |

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
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Open **Export options** (the tab with the up arrow above the controls) and tap **Load edits** | a file picker opens |
| 2 | Choose big-edits.json, a file of 8 MB and one byte | a red message reads "That file is too large to be a Card Finisher edits file." |

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
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Open **Export options** (the tab with the up arrow above the controls) and tap **Load edits** | a file picker opens |
| 2 | Choose notes.json, a text file of notes | a red message reads "That file isn’t valid JSON." |

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
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Open **Export options** (the tab with the up arrow above the controls) and tap **Load edits** | a file picker opens |
| 2 | Choose list.json, a JSON shopping list | a red message reads "That isn’t a Card Finisher edits file." |

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
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Photo: card-edits.json, an edits file
- Starting screen: the start screen
- Stand-in: **Load edits** is greyed out with no photo open, so no button reaches this; the script hands the file to the hidden picker.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Hand card-edits.json straight to the edits picker | an amber warning reads "Open the matching photo first, then load its edits."; the start screen stays |

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
- Flag: to confirm. This message writes sizes as "W×H" with no spaces; every other message and readout writes "W × H".
- Cases: 1

### MSG-37.1 Edits for a photo of another size   [auto: phone]
Flag: to confirm. Written to what the app does today: the sizes are written "W×H" with no spaces.
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/, then IMG_9136.JPEG from samples/
- Starting screen: the photo open; on Rotate **90° right** tapped; on Export, in **Export options**, **Save edits** tapped (card-edits.json saved, the quarter turn in it); the options closed and **Undo** tapped, so the photo is upright
- 01_chrome_flat_black.JPEG is 1536 × 2048 px.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Open IMG_9136.JPEG with **Open photo** and go to Export | the slab photo is open |
| 2 | Open **Export options** (the tab with the up arrow above the controls) and tap **Load edits** and choose card-edits.json | a red message reads "These edits are for a 1536×2048 photo; this one is 1498×2098."; the photo stays upright |

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
- Ruling: R12. Load edits shows one combined warning of up to three short lines, instead of up to three messages that replace each other before they can be read. New wording, to be approved by Rich. The app differs today.
- Flag: to confirm. This message uses an em dash where most messages use two sentences.
- Cases: 2

### MSG-38.1 Edits saved for a file of another name   [auto: phone]
Written to ruling R12; its combined warning's words wait for Rich's approval, so the case checks the warning's kind and what it is about, not its words.
Flag: to confirm. Written to what the app does today: the message uses an em dash where most use two sentences.
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open; on Rotate **90° right** tapped; on Export, in **Export options**, **Save edits** tapped (card-edits.json saved, the quarter turn in it); the options closed and **Undo** tapped, so the photo is upright; in card-edits.json the photo's name changed to another-card.JPEG

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Open **Export options** (the tab with the up arrow above the controls) and tap **Load edits** and choose card-edits.json | the edits are applied (the photo turns a quarter right); one amber warning says they were saved for another-card.JPEG |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### MSG-38.2 Three problems in one edits file make one warning   [auto: phone]
Written to ruling R12; it fails until that is built (BUG-190). The warning's words wait for Rich's approval.
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open; on Rotate **90° right** tapped; on Export, in **Export options**, **Save edits** tapped (card-edits.json saved, the quarter turn in it); the options closed and **Undo** tapped, so the photo is upright; in card-edits.json the photo's name changed to another-card.JPEG, the crop setting replaced by words, and a logo added that no browser can read

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Open **Export options** (the tab with the up arrow above the controls) and tap **Load edits** and choose card-edits.json | the edits are applied, and one amber warning, of up to three short lines, covers all three problems |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-39 Settings in the edits file that were reset

A warning, for 6 seconds, when some fields of the edits file weren't valid and fell back to their defaults: "Some settings in these edits weren’t valid and were reset: {fields}." The fields are a comma list of their names.

- Risk: medium
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Some settings in these edits weren’t valid and were reset: "
- Source: `js/app/export.js` (`loadEdits`)
- Ruling: R12. Load edits shows one combined warning of up to three short lines, instead of up to three messages that replace each other before they can be read. New wording, to be approved by Rich. The app differs today.
- Cases: 1

### MSG-39.1 Settings in the edits file that were reset   [auto: phone]
Written to ruling R12; its combined warning's words wait for Rich's approval, so the case checks the warning's kind and what it is about, not its words.
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open; on Rotate **90° right** tapped; on Export, in **Export options**, **Save edits** tapped (card-edits.json saved, the quarter turn in it); the options closed and **Undo** tapped, so the photo is upright; in card-edits.json the crop setting replaced by words

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Open **Export options** (the tab with the up arrow above the controls) and tap **Load edits** and choose card-edits.json | the edits are applied with the crop as it was before; an amber warning says the crop setting was reset |

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
- Ruling: R12. Load edits shows one combined warning of up to three short lines, instead of up to three messages that replace each other before they can be read. New wording, to be approved by Rich. The app differs today.
- Cases: 1

### MSG-40.1 A logo in the edits file that can't be read   [auto: phone]
Written to ruling R12; its combined warning's words wait for Rich's approval, so the case checks the warning's kind and what it is about, not its words.
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open; on Rotate **90° right** tapped; on Export, in **Export options**, **Save edits** tapped (card-edits.json saved, the quarter turn in it); the options closed and **Undo** tapped, so the photo is upright; in card-edits.json a logo added that no browser can read

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Open **Export options** (the tab with the up arrow above the controls) and tap **Load edits** and choose card-edits.json | the edits are applied with no logo; an amber warning says the logo couldn't be read |

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

### MSG-41.1 Copy CONFIG says it copied   [auto: phone]
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open from a link ending ?debug, the Detection tuning panel showing, on the Perspective step; the page allowed to use the clipboard

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Copy CONFIG** | a white message reads "CONFIG copied."; the clipboard holds the settings |

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
- Flag: to confirm. This message uses an em dash where most messages use two sentences.
- Cases: 1

### MSG-42.1 Copy CONFIG with the clipboard blocked   [auto: phone]
Flag: to confirm. Written to what the app does today: the message uses an em dash where most use two sentences.
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open from a link ending ?debug, the Detection tuning panel showing, on the Perspective step
- Stand-in: the script makes the clipboard refuse every write, as a browser that blocks the page does.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Copy CONFIG** | an amber warning reads "Clipboard blocked — CONFIG printed to the console."; the console holds the settings |

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
- Flag: to confirm. The message says "overlay" where the buttons say "logo", and it gives no next step.
- Cases: 1

### MSG-43.1 A logo the browser won't keep   [auto: phone]
Flag: to confirm. Written to what the app does today: the message says "overlay" where the buttons say "logo", and gives no next step.
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/; the logo icon.svg from icons/
- Starting screen: the photo open, on the Overlay step; the browser refuses to store the logo
- Stand-in: the script makes the device refuse to store the logo, as a full disk would.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Add logo** and choose icon.svg | the logo goes on the photo; an amber warning reads "This overlay works on this photo, but it can’t be saved in this browser." |

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
- Flag: to confirm. Three different words say the app is busy: "Loading…", "Opening the front…" here and "Detecting…" on Perspective.
- Cases: 1

### MSG-44.1 "Opening the front…" while the front opens   [auto: phone]
Flag: to confirm. Written to what the app does today: three different words say the app is busy.
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Photo: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: the pair made: the front opened, then on Export **Add back** and the back chosen; the back open on Perspective
- Stand-in: a front opens in tens of milliseconds, so the script holds its opening until row 1 is seen.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Front** in the top bar | a white message reads "Opening the front…" while the front opens |
| 2 | Wait for the front | once the front shows, the message has gone |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-45 "Unpaired. The front is a single photo now."

An information message after **Keep front** or **Keep back** on the Unpair card: "Unpaired. The front is a single photo now." or "Unpaired. The back is a single photo now."

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Unpaired. The ", " is a single photo now.", `#btnUnpair`
- Source: `js/app/pair.js` (`unpair`)
- Ruling: R25. The kept side's photo is stored before the message shows, so a reload at that moment resumes the right photo. The app differs today.
- Cases: 1

### MSG-45.1 Unpair says which side is kept   [auto: phone]
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Photo: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: the pair made: the front opened, then on Export **Add back** and the back chosen; the back open on Perspective

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Unpair**, then **Keep front** | a white message reads "Unpaired. The front is a single photo now." |

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
- Ruling: R13. During a side switch the warning says to wait for the other side to open (proposed: "Wait for the other side to open, then open the photo."); during an export the wording stays. New wording, to be approved by Rich. The app differs today.
- Cases: 2

### MSG-46.1 A photo opened during an export is refused   [auto: phone]
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/, then IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Export step; each image takes 3 s to encode
- Stand-in: an export takes under a second here, so the script holds each encoding back 3 s, as on a slow phone.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Download**, then **No** on the Upscale question | the export starts |
| 2 | While it runs, tap **Open photo** and choose IMG_9136.JPEG | an amber warning reads "Wait for the export to finish, then open the photo."; the photo stays |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### MSG-46.2 A photo opened while a side opens is refused with its own words   [auto: phone]
Written to ruling R13; it fails until that is built (BUG-031). The new words wait for Rich's approval, so the case checks that the export's words are not used.
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Photo: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/; then IMG_9136.JPEG from samples/
- Starting screen: the pair made: the front opened, then on Export **Add back** and the back chosen; the back open on Perspective
- Stand-in: the script holds the front's opening until row 2 is done.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Front** in the top bar | "Opening the front…" shows |
| 2 | While the front opens, tap **Open photo** and choose IMG_9136.JPEG | an amber warning says to wait for the other side to open, not for the export |

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
- Flag: to confirm. The message says "Tap" on a desktop too.
- Cases: 1

### MSG-47.1 The photo isn't loaded after a pair's export   [auto: phone]
Flag: to confirm. Written to what the app does today: the message says "Tap" on a desktop too.
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Photo: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: the pair made: the front opened, then on Export **Add back** and the back chosen; the back open on Perspective; then the Export step, **Original** chosen
- Stand-in: every read of the back is made to fail, as under memory pressure on an iPhone.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Download** | the file is saved |
| 2 | Wait for the export to end | an amber warning reads "The photo isn’t loaded after the last export. Tap Front or Back to switch sides, then switch back." |
| 3 | Time the message | it stays 8 s |

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
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Photo: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: the pair made: the front opened, then on Export **Add back** and the back chosen; the back open on Perspective; the pair saved, then its stored record damaged and the page reloaded: the start screen offers **Resume**
- Stand-in: no control damages a stored record; the script does, as a failed write could.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Resume** | an amber warning reads "The saved pair wasn’t valid, so it was reset. This photo resumed on its own.", in place of "Resumed where you left off." at once |

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
- Ruling: R20. When corner shots can't be made, the readout gives the real reason and both save buttons are dimmed. The app differs today.
- Flag: to confirm. This error stays 5 seconds, while every other error stays 6.
- Cases: 1

### MSG-49.1 Corner shots that can't be made can't be saved   [auto: phone]
Written to ruling R20; it fails until that is built (BUG-120). Once the buttons are greyed out the message itself can no longer be raised.
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step; the engine refusing corner shots ("The card is too small for corner shots.")
- Stand-in: no photo or control makes the engine refuse a card with valid corners, so the script makes it refuse.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Corner shots** | Download corners and Share corners are greyed out |

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
- Ruling: R24. A fixed sentence with a next step replaces the raw error text, and the detail always goes to the console. New wording, to be approved by Rich. The app differs today.
- Cases: 1

### MSG-50.1 Failed corner shots name no raw error   [auto: phone]
Written to ruling R24; it fails until that is built (BUG-051).
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open from a link ending ?cornerShots.upscaleTargetPx=0 (no Upscale question for corner shots), on the Export step
- Stand-in: no control makes the browser fail to encode, so the script makes it hand back no file, as a canvas too big for it does.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Corner shots**, then **Download corners** | the error's own words are written to the console |
| 2 | Read the message | a red message gives a fixed sentence with a next step, without the error's own words |

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
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Open **Perspective options** and tap **Tap to find card** | the line above the controls reads "Tap the card in the photo." with a grey information icon and Cancel |
| 2 | Tap **Cancel** | Cancel takes the line away; Tap to find card is no longer armed |

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
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Drag the top-right corner handle onto the top-left one | the line above the controls reads "Two corners are too close together." with a red error icon |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-54 The other corner faults

For the engine's remaining faults the row above Perspective's controls shows, with a red error icon, "Corners are missing or invalid.", "Could not solve the perspective for these corners.", "Crop is empty." or "Transform is not invertible."

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Corners are missing or invalid.", "Could not solve the perspective for these corners.", "Crop is empty.", "Transform is not invertible."
- Source: `js/app/perspective.js` (`perspectiveStatus`); `js/engine.js` (`Quad.validate`, `computeGeometry`)
- Flag: to confirm. These state a fault with no action to take, and "Could not" is written out where other messages say "Couldn’t".
- Cases: 1

### MSG-54.1 The engine's other corner faults   [auto: phone]
Flag: to confirm. Written to what the app does today: these state a fault with no action to take, and "Could not" is written out.
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Perspective step
- Stand-in: no control brings these faults about, so the script makes the engine report each in turn.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Have the engine report "Corners are missing or invalid." | the line above the controls reads "Corners are missing or invalid." with a red error icon |
| 2 | Have the engine report "Could not solve the perspective for these corners." | the line above the controls reads "Could not solve the perspective for these corners." with a red error icon |
| 3 | Have the engine report "Crop is empty." | the line above the controls reads "Crop is empty." with a red error icon |
| 4 | Have the engine report "Transform is not invertible." | the line above the controls reads "Transform is not invertible." with a red error icon |

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
- Flag: to confirm. The line takes the row though there is nothing to act on, and three different words say the app is busy ("Loading…", "Opening the front…", "Detecting…").
- Cases: 1

### MSG-55.1 "Detecting…" while a search runs   [auto: phone]
Flag: to confirm. Written to what the app does today: the line takes the row though there is nothing to act on.
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the app open, no photo

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Open the photo with **Open photo** | for a moment the line above the controls reads "Detecting…" with a grey information icon |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-56 "Low confidence (…%). Check the corners."

When the detected card in use scores under 50% confidence, the row above Perspective's controls reads "Low confidence ({percent}%). Check the corners." with an amber warning icon. Today it stays until another detection runs.

- Risk: medium
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Low confidence (", "%). Check the corners.", `CONFIG.detect.minConfidence`
- Source: `js/app/perspective.js` (`perspectiveStatus`, `syncPerspectiveReadouts`)
- Ruling: R7. The warning clears after the first corner move, by drag or nudge. The app differs today.
- Cases: 1

### MSG-56.1 Low confidence   [auto: phone]
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open from a link ending ?detect.minConfidence=1 (every result counts as low), on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Read the line above the controls | the line above the controls reads "Low confidence (99%). Check the corners." with an amber warning icon |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-57 "Nothing detected. Drag the corners into place."

After a detection run finds no card, the row above Perspective's controls reads "Nothing detected. Drag the corners into place." with an amber warning icon. Today it stays until another detection runs.

- Risk: medium
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Nothing detected. Drag the corners into place.", `#perspectiveStatus`
- Source: `js/app/perspective.js` (`perspectiveStatus`)
- Ruling: R7. The warning clears after the first corner move, by drag or nudge. The app differs today.
- Flag: to confirm. After a search the user started, the message "No card-shaped edges found…" shows at the same time, so one condition shows in two wordings.
- Cases: 1

### MSG-57.1 Nothing detected   [auto: phone]
Flag: to confirm. Written to what the app does today: after a search the user started, "No card-shaped edges found…" shows at the same time.
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Photo: a plain grey picture, 1200 × 1600 px, with no card in it
- Starting screen: the picture open, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Read the line above the controls | the line above the controls reads "Nothing detected. Drag the corners into place." with an amber warning icon |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-58 "Corrected frame clamped to 12000px on the long side."

When the perspective-corrected frame would be larger than the 12000 px cap, the row above Perspective's controls reads "Corrected frame clamped to 12000px on the long side." with a grey information icon.

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Corrected frame clamped to ", "px on the long side.", `CONFIG.maxOutputPx`
- Source: `js/app/perspective.js` (`perspectiveStatus`)
- Flag: to confirm. The line takes the row though there is nothing to act on, and writes "12000px" with no space where everything else writes "2000 px".
- Cases: 1

### MSG-58.1 A corrected frame over the cap   [auto: phone]
Flag: to confirm. Written to what the app does today: "1000px" has no space, and the line takes the row though there is nothing to act on.
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open from a link ending ?maxOutputPx=1000, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Read the line above the controls | the line above the controls reads "Corrected frame clamped to 1000px on the long side." with a grey information icon |

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
- Photo: 01_chrome_flat_black.JPEG from samples/; logo.gif, a one-pixel GIF
- Starting screen: the photo open, on the Overlay step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Add logo** and choose logo.gif | the line above the controls reads "That file type isn’t supported. Use PNG, WebP, JPG or SVG." with a red error icon |

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
- Flag: to confirm. The message says "overlay" where the buttons say "logo".
- Cases: 1

### MSG-60.1 A logo file over the size limit   [auto: phone]
Flag: to confirm. Written to what the app does today: the message says "overlay" where the buttons say "logo".
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/; big-logo.png, a 6 MB file named like a PNG
- Starting screen: the photo open, on the Overlay step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Add logo** and choose big-logo.png | the line above the controls reads "That file is 6.0 MB. The overlay limit is 5 MB." with a red error icon |

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
- Photo: 01_chrome_flat_black.JPEG from samples/; not-a-logo.png, a text file named like a PNG
- Starting screen: the photo open, on the Overlay step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Add logo** and choose not-a-logo.png | the line above the controls reads "Couldn’t read that image. Try another PNG, WebP, JPG or SVG file." with a red error icon |

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
- Photo: 01_chrome_flat_black.JPEG from samples/; unsized.svg, an SVG with no width, height or viewBox
- Starting screen: the photo open, on the Overlay step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Add logo** and choose unsized.svg | the line above the controls reads "That SVG has no width, height or viewBox, so it can’t be sized. Re-export it with a size." with a red error icon |

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
- Photo: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: the pair made: the front opened, then on Export **Add back** and the back chosen; the back open on Perspective

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Go to Crop | the size line ends with "Pair: 5:7 only" at its right |

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
- Ruling: R11. With invalid corners, **Add logo**, **Use saved overlay** and **Replace logo** are dimmed and this row reads "Fix the corners in Perspective first." The app differs today.
- Flag: to confirm. The hint always says 5 MB, though a link can lower the limit, which the size error (MSG-60) does follow.
- Cases: 1

### MSG-70.1 Overlay's hint with no logo placed   [auto: phone]
Flag: to confirm. Written to what the app does today: the hint always says 5 MB, though a link can lower the limit.
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
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
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Auto**, and do not tap Apply | the white dot shows on the Levels tab |
| 2 | Go to Export | under the size line, led by the amber warning mark: "Levels has unapplied changes; export uses the applied levels." |

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
- Ruling: R14. For a pair saved Separately the note shows when either side is clamped, and names the side when it is not the one on screen. New wording, to be approved by Rich. R15. The note shows 16.7 MP, rounded down. The app differs today.
- Flag: to confirm. The note informs but gives no next step.
- Cases: 2

### MSG-72.1 The canvas-limit note says 16.7 MP   [auto: phone]
Written to ruling R15; it fails until that is built (BUG-011).
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open from a link ending ?export.longEdge=12000&export.allowUpscale=1, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Read the note under the size line | under the size line, led by the amber warning mark: "Clamped to fit the 16.7 MP canvas limit." |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### MSG-72.2 With Separately, the note also covers the side not on screen   [auto: phone]
Written to ruling R14; it fails until that is built (BUG-012). The note's words wait for Rich's approval, so the case checks that a note shows and names the front.
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Photo: IMG_9136.JPEG (front) and 14_back_portrait_raw_white.JPEG (back) from samples/
- Starting screen: the pair made from a link ending ?maxOutputArea=1000000; the back open, on Export

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Original**, then **Separately** | the size line gives both sides' sizes |
| 2 | Read the note under the size line | with the back on screen, a note under the size line says the front was scaled down to fit the canvas limit, naming the front |

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
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step, JPEG chosen

| # | Do this | You should see |
| --- | --- | --- |
| 1 | In **Export options**, set **Fill outside photo** to Transparent and close the options | under the size line, led by the amber warning mark: "JPEG has no transparency; empty areas will be white." |

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
- Ruling: R20. The size line gives the real reason, and both save buttons are dimmed. The app differs today.
- Cases: 1

### MSG-74.1 Corner shots that can't be made give the real reason   [auto: phone]
Written to ruling R20; it fails until that is built (BUG-120). The line's words for the reason wait for Rich's approval.
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step; the engine refusing corner shots with "Transform is not invertible."
- Stand-in: no photo or control makes the engine refuse a card with valid corners, so the script makes it refuse.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Corner shots** | the size line gives the real reason, not "the card is too small"; Download corners is greyed out |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-75 The Upscale question for a single photo

When **Download**, **Share** or **Copy** would save a crop whose long edge is under the chosen Size, a card over the photo asks "Upscale to {Size} px?" with "The crop is {width} × {height} px at the photo’s resolution.", **Yes** (red), **No** and **Cancel**.

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
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step, 2000 chosen

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Download** | a card over the photo asks "Upscale to 2000 px?" and reads "The crop is W × H px at the photo’s resolution.", with Yes in red, No and Cancel |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-76 The Upscale question for a pair's Together image

For a pair with **Together** chosen, or a pair's **Copy**, when the joined image's long edge is under the chosen Size, the card's text reads "The image is {width} × {height} px at the photos’ resolution."

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
- Photo: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: the pair made: the front opened, then on Export **Add back** and the back chosen; the back open on Perspective; then the Export step, **Together** chosen, 2000 chosen

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Download** | the card reads "The image is W × H px at the photos’ resolution." |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-77 The Upscale question for a pair saved Separately

For a pair with **Separately** chosen, when either side's file would be under the chosen Size, the card's text reads "The front is {width} × {height} px and the back {width} × {height} px at the photos’ resolution."

- Risk: low
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "The front is ", " px and the back ", `#pairPrompt`
- Source: `js/app/pair.js` (`pairUpscaleOffer`, `exportPair`); `js/app/export.js` (`askUpscale`)
- Cases: 1

### MSG-77.1 The Upscale question for a pair saved Separately   [auto: phone]
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Photo: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: the pair made: the front opened, then on Export **Add back** and the back chosen; the back open on Perspective; then the Export step, **Together** chosen, 2000 chosen

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Separately** | Separately is selected |
| 2 | Tap **Download** | the card reads "The front is W × H px and the back W × H px at the photos’ resolution." |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-78 The Upscale question for corner shots

When a corner file would be under 2000 px, **Share corners** and **Download corners** ask "Upscale to 2000 px?" with "The sheet is {size} px at the photo’s resolution." or "Each corner is {size} px at the photo’s resolution." The card lies above the open Corner shots sheet.

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
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Corner shots**, then **Download corners** | with 1 sheet, a card above the open sheet asks "Upscale to 2000 px?" and reads "The sheet is N px at the photo’s resolution." |
| 2 | Tap **Cancel**, then **4 photos**, then **Download corners** | with 4 photos, it reads "Each corner is N px at the photo’s resolution." |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-79 The Unpair card

**Unpair** in the top bar asks, on a card over the photo, "Unpair" with "Keep one side as a single photo.", **Keep front** and **Keep back** (neither is red) and **Cancel**.

- Risk: medium
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Keep one side as a single photo.", "Keep front", "Keep back", `#btnUnpair`
- Source: `js/app/pair.js` (`askUnpair`, `showPrompt`)
- Cases: 1

### MSG-79.1 The Unpair card   [auto: phone]
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Photo: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: the pair made: the front opened, then on Export **Add back** and the back chosen; the back open on Perspective

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Unpair** | a card over the photo asks "Unpair" and reads "Keep one side as a single photo.", with Keep front, Keep back (neither red) and Cancel |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-80 The New photo card

Open, drop or paste while a pair is open asks, on a card over the photo, "New photo" with "End the pair, or replace the side you’re on?", **New photo**, **Replace front** or **Replace back** (the side on screen) and **Cancel**. **Next card** and **Add back** don't ask.

- Risk: medium
- Check: script
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "End the pair, or replace the side you’re on?", "Replace ", `#pairPrompt`, `#btnPromptSecond`
- Source: `js/app/pair.js` (`receivePhoto`, `showPrompt`)
- Flag: to confirm. The card's title and its first button both read "New photo".
- Cases: 1

### MSG-80.1 The New photo card   [auto: phone]
Flag: to confirm. Written to what the app does today: the card's title and its first button both read "New photo".
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Photo: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/; then IMG_9136.JPEG from samples/
- Starting screen: the pair made: the front opened, then on Export **Add back** and the back chosen; the back open on Perspective

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Open photo** and choose IMG_9136.JPEG | a card over the photo asks "New photo" and reads "End the pair, or replace the side you’re on?", with New photo, Replace back and Cancel |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-81 "Fix the corners in Perspective first." on the photo

When the corners are invalid, "Fix the corners in Perspective first." is drawn in grey at the center of the photo area in place of the picture, on every step except Perspective's corner view.

- Risk: medium
- Check: eye
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Fix the corners in Perspective first."
- Source: `js/app/view.js` (`draw`, `drawMessage`)
- Flag: to confirm. It also shows on Perspective itself while **Preview** is on.
- Cases: 1

### MSG-81.1 "Fix the corners in Perspective first." on the photo, for a person to judge   [eye]
Flag: to confirm. Written to what the app does today: the text also shows on Perspective while **Preview** is on.
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Drag the top-left corner handle past the bottom-right one | the corner lines cross |
| 2 | Go to Rotate | in place of the photo, grey text centered in the photo area reads "Fix the corners in Perspective first."; no picture is drawn |

Pass: every row's result is seen.
On a fail, record: what differs from the description, the screenshot.

## MSG-82 "Fix the corners of both sides in Perspective first." on the photo

On Export for a pair with **Together** chosen, when either side's corners are invalid, "Fix the corners of both sides in Perspective first." is drawn in grey in place of the joined image.

- Risk: low
- Check: eye
- Layout: both.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Fix the corners of both sides in Perspective first."
- Source: `js/app/view.js` (`drawTogether`, `drawMessage`)
- Ruling: R26. With the waiting side's corners invalid, the row under Export's size names the side to fix (proposed: "Fix the back’s corners in Perspective first.") and **Share**, **Download** and **Copy** are dimmed. New wording, to be approved by Rich. The app differs today.
- Cases: 2

### MSG-82.1 "Fix the corners of both sides in Perspective first." on the joined image, for a person to judge   [eye]
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Photo: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: the pair made: the front opened, then on Export **Add back** and the back chosen; the back open on Perspective

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Drag the back's top-left corner handle past its bottom-right one | the corner lines cross |
| 2 | Go to Export | with Together chosen, grey text centered in the photo area reads "Fix the corners of both sides in Perspective first."; no joined image is drawn |

Pass: every row's result is seen.
On a fail, record: what differs from the description, the screenshot.

### MSG-82.2 With the waiting side's corners crossed, Export names the side to fix   [auto: phone]
Written to ruling R26; it fails until that is built (BUG-034). The row's words wait for Rich's approval, so the case checks that it names the back.
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Photo: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: the pair made: the front opened, then on Export **Add back** and the back chosen; the back open on Perspective

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Drag the back's top-left corner handle past its bottom-right one | the corner lines cross |
| 2 | Tap **Front** in the top bar, then go to Export | the row under the size line names the back as the side to fix in Perspective; Share, Download and Copy are greyed out |

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
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Open **Perspective options** (the tab with the up arrow above the controls) | the options rise from the bottom |
| 2 | Tap **Tips** | four paragraphs open in place, in this order: dragging and double-tapping handles, the arrows, Flatten, and Tap to find card |

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
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Rotate step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Open **Rotate options** (the tab with the up arrow above the controls) | the options rise from the bottom |
| 2 | Tap **Tips** | four paragraphs open in place: the ruler and the typed angle, Fill frame, Flip and the grid |

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
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Crop step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Open **Crop options** (the tab with the up arrow above the controls) | the options rise from the bottom |
| 2 | Tap **Tips** | one paragraph opens in place: "Drag inside the box to move it, and its handles to resize." |

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
- Flag: to confirm. A wide screen shows two tips headings on Levels, "Levels tips" and "Tips and keys".
- Cases: 1

### MSG-86.1 Levels' tips   [auto: phone]
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Open the Levels sheet (the tab with the up arrow above the controls) | a sheet titled "Levels tips" holds three paragraphs: picking white and black, Auto, and holding the photo to compare |

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
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Overlay step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Open **Overlay options** (the tab with the up arrow above the controls) | the options rise from the bottom |
| 2 | Tap **Tips** | four paragraphs open in place: the rings and gestures, the photo framed as set in Crop, the logo kept in the browser, and Delete saved |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## MSG-88 Export's tips

**Tips** in "Export options" opens four paragraphs: "Share’s Save Image puts the photo in Photos.", what **Original** does, "Next card shows once these edits are exported." and what an edits file is.

- Risk: low
- Check: script
- Layout: both. A wide screen lists the tips always open under "Tips" and leaves out the first and the fourth.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#exportTips`, "Share’s Save Image puts the photo in Photos.", "Next card shows once these edits are exported."
- Source: `js/app/export-controls.js` (`buildExportControls`); `js/app/parts/sheet.js` (`buildTipsRow`, `buildTipHint`)
- Flag: to confirm. The tip says **Next card** shows once the edits are exported, but it is also held back while **Share now** waits; and the fourth tip nearly repeats the Edits hint (MSG-89).
- Cases: 1

### MSG-88.1 Export's tips   [auto: phone]
Flag: to confirm. Written to what the app does today: Next card is also held back while **Share now** waits, and the fourth tip nearly repeats the Edits hint.
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Open **Export options** (the tab with the up arrow above the controls) | the options rise from the bottom |
| 2 | Tap **Tips** | four paragraphs open in place: Save Image, Original, Next card and the edits file |

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
- Flag: to confirm. The Edits hint nearly repeats Export's fourth tip.
- Cases: 3

### MSG-89.1 The Corner shots sheet's hint   [auto: phone]
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Corner shots** | the sheet reads "Close-ups of the card’s four corners, at the photo’s own resolution, with this photo’s levels and no overlay." |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### MSG-89.2 The hint under the edits buttons   [auto: phone]
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Open **Export options** | under Save edits and Load edits: "A small JSON file. Re-open the same photo, load it, and the export is identical." |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### MSG-89.3 With a pair open, the edits hint says which side it saves   [auto: phone]
Flag: to confirm. Written to what the app does today: the Edits hint nearly repeats Export's fourth tip.
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Photo: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: the pair made: the front opened, then on Export **Add back** and the back chosen; the back open on Perspective; then the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Open **Export options** | the hint reads "Saves the side you’re on. A small JSON file. Re-open the same photo, load it, and the export is identical.", its first sentence in bold |

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
- Flag: to confirm. Perspective's help says "Tab selects the next handle" without saying the photo must have the keyboard focus first, and "arrows" means the on-screen pad in one tip and the keys in the next line.
- Cases: 1

### MSG-90.1 Keyboard help on a wide screen   [auto: desktop]
Flag: to confirm. Written to what the app does today: Perspective's help says "Tab selects the next handle" without saying the photo needs the focus, and "arrows" means two things.
Before you start:
- Device and browser: a wide window (1280 × 800), a mouse and keyboard
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Rotate step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Read the panel's tips | on Rotate, under "Tips and keys": "F fits; 1 to 6 change step." |
| 2 | Go to Crop | on Crop, under "Tips and keys": "Shift keeps the aspect in Free." |
| 3 | Go to Export | on Export there is no keyboard help |

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
- Flag: to confirm. Redo's tooltip names only Shift+Ctrl/Cmd+Z, though Ctrl/Cmd+Y also works.
- Cases: 4

### MSG-91.1 Controls without words have names for screen readers   [auto: phone]
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Rotate step; a screen reader on

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Move through the top bar's icon buttons | the top bar's icon buttons are named Open photo, Fit to screen, Undo and Redo |
| 2 | Move to the tab with the up arrow above the controls, open it, and move to the sheet's close button | the tab with the up arrow above the controls is named Options, and the options sheet's close button Close |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### MSG-91.2 Tooltips on a wide screen   [auto: desktop]
Flag: to confirm. Written to what the app does today: Redo's tooltip names only Shift+Ctrl/Cmd+Z, though Ctrl/Cmd+Y also works.
Before you start:
- Device and browser: a wide window (1280 × 800), a mouse and keyboard
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Rotate step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Hover over **Undo**, **Redo** and **Fit**, in turn | Undo's tooltip reads "Undo (Ctrl/Cmd+Z)", Redo's "Redo (Shift+Ctrl/Cmd+Z)" and Fit's "Fit to screen (F)" |
| 2 | Look at the Open button | the Open button shows the word "Open" |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### MSG-91.3 The nudge keys, Close tuning and the corner thumbnails have names   [auto: phone]
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open from a link ending ?debug, the Detection tuning panel showing, on the Perspective step; a screen reader on

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Move through the four arrow keys under **Nudge** | the four arrow keys under Nudge are named Nudge left, Nudge up, Nudge down and Nudge right |
| 2 | Move to the tuning panel's close button (×) | the tuning panel's close button is named Close tuning |
| 3 | Go to Export, tap **Corner shots** and move through the four thumbnails | the four thumbnails are named Top-left corner, Top-right corner, Bottom-left corner and Bottom-right corner |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### MSG-91.4 Unpair has a name   [auto: phone]
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
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
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the start screen, the developer tools' console open

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Read the console | the console reads "[card-finisher] vX.Y.Z" at start, with the build's version |
| 2 | Open the photo | then "[card-finisher] 01_chrome_flat_black.JPEG: W×H loaded + previewed in N ms" |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### MSG-92.2 The console warns about link settings it ignored   [auto: phone]
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Photo: none
- Starting screen: the app opened from a link ending ?nonsense=1, the developer tools' console open

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Read the console | the console warns "[card-finisher] URL settings ignored …", naming nonsense |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### MSG-92.3 The console warns when the photo couldn't be saved   [auto: phone]
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the start screen, the developer tools' console open; the device refusing to store the photo
- Stand-in: the script makes the device refuse to store the photo, as a full disk would.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Open the photo | the console warns "[card-finisher] session photo not saved:" |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### MSG-92.4 The console warns when the background worker falls back   [auto: phone]
Before you start:
- Device and browser: a phone-width window (390 × 844), touch
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the start screen, the developer tools' console open; a browser that can't start background workers
- Stand-in: the script takes away the browser's background workers.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Open the photo | the console warns "[card-finisher] Web Worker unavailable, running on main thread:"; the photo still opens with its card found |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.
