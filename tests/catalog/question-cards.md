# Question cards

The one card the app uses for a question that must be answered before going on: Upscale, Unpair and New photo.

The single-photo cases use 01_chrome_flat_black.JPEG, whose crop (1074 × 1074 px) is under 2000 px, so **Download** asks the Upscale question. The pair cases use 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG.

## QCD-01 One shared card

Every question shows on the same card over the photo: a title, one line of text, two choices side by side and **Cancel** beneath them.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#pairPrompt`, `#btnPromptFirst`, `#btnPromptSecond`, `#btnPromptCancel`
- Source: `js/app/parts/alert-card.js` (`buildAlertCard`, `updateAlertCard`, `showAlert`); `js/app/pair.js` (`promptCard`, `showPrompt`)
- Flag: to confirm. The New photo card's title and its first choice both read "New photo".
- Cases: 2

### QCD-01.1 The Upscale question: a title, a line, two choices side by side and Cancel beneath   [auto: phone]
Before you start:
- Device and browser: a phone-width window
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step, **2000** selected

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Download** | A card over the photo, titled "Upscale to 2000 px?", with one line, "The crop is 1074 × 1074 px at the photo’s resolution." |
| 2 | Look at its buttons | **Yes** and **No** side by side, the same height, **Yes** on the left; **Cancel** beneath them, as wide as the two together |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### QCD-01.2 The pair's questions come on the same card   [auto: phone]
Flag: to confirm. Written to today's behavior: the New photo card's title and its first choice both read "New photo".

Before you start:
- Device and browser: a phone-width window
- Build: the build under test
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG, and 01_chrome_flat_black.JPEG, from samples/
- Starting screen: a pair: open the front, tap **Export**, tap **Add back** and choose the back. The back is open on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Unpair** (beside **Front** / **Back** in the top bar) | The card, titled "Unpair", with one line, "Keep one side as a single photo."; **Keep front** and **Keep back** side by side, **Cancel** beneath them |
| 2 | Tap **Cancel** | The card closes |
| 3 | Tap **Open** (the folder at the top left) and choose 01_chrome_flat_black.JPEG | The card, titled "New photo", with one line, "End the pair, or replace the side you’re on?"; **New photo** and **Replace back** side by side, **Cancel** beneath them |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## QCD-02 Close without answering

**Cancel**, a tap outside the card or Escape closes the card, and nothing runs.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnPromptCancel`, `#pairPrompt`, `key:Escape`
- Source: `js/app/parts/alert-card.js` (`buildAlertCard`, `hideAlert`); `js/app/input.js` (`onKeyDown`)
- Cases: 2

UPS-03.2 and UPS-03.3 show the same for the Upscale question: nothing is saved.

### QCD-02.1 Cancel and a tap outside leave the pair and open nothing   [auto: phone]
Before you start:
- Device and browser: a phone-width window
- Build: the build under test
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG, and 01_chrome_flat_black.JPEG, from samples/
- Starting screen: a pair, as in QCD-01.2; the back open

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Open** and choose 01_chrome_flat_black.JPEG | The card asks "New photo" |
| 2 | Tap **Cancel** | The card closes; **Front** / **Back** is still in the top bar, **Back** in white, and the back is on screen |
| 3 | Tap **Open** and choose 01_chrome_flat_black.JPEG again | The card asks "New photo" |
| 4 | Tap the dimmed screen above the card | The card closes; the pair is still open, the back on screen, and 01_chrome_flat_black.JPEG was not opened |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### QCD-02.2 Escape closes the card and keeps the pair   [auto: desktop]
Before you start:
- Device and browser: a wide window with a keyboard
- Build: the build under test
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: a pair, as in QCD-01.2; the back open

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Click **Unpair** | The card asks "Unpair" |
| 2 | Press Escape | The card closes; **Front** / **Back** is still in the top bar, **Back** in white |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## QCD-03 A choice closes the card, then runs

A choice closes the card first and then runs. The expected answer (the Upscale question's **Yes**) is red; a pair's questions have no red choice.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnPromptFirst`, `#btnPromptSecond`
- Source: `js/app/parts/alert-card.js` (`answerAlert`, `updateAlertCard`)
- Cases: 2

### QCD-03.1 Yes is red, and closes the card before the file is saved   [auto: phone]
Before you start:
- Device and browser: a phone-width window
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step, **2000** selected

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Download** | The card asks "Upscale to 2000 px?"; **Yes** is red (P1Hunt red, #e5322d), **No** is not |
| 2 | Tap **Yes** | The card closes first; then the file is saved |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### QCD-03.2 The pair's questions have no red choice   [auto: phone]
Before you start:
- Device and browser: a phone-width window
- Build: the build under test
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG, and 01_chrome_flat_black.JPEG, from samples/
- Starting screen: a pair, as in QCD-01.2; the back open

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Unpair** | The card asks "Unpair"; neither **Keep front** nor **Keep back** is red |
| 2 | Tap **Cancel**, tap **Open** and choose 01_chrome_flat_black.JPEG | The card asks "New photo"; neither **New photo** nor **Replace back** is red |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## QCD-04 Keyboard focus

When the card shows, the keyboard focus moves to its first choice; Tab and Shift+Tab stay inside the card; when it closes, the focus goes back to the control that asked, if that control is still there and live.

- Risk: low
- Check: script
- Layout: both, with a keyboard.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnPromptFirst`, `key:Tab`
- Source: `js/app/parts/alert-card.js` (`showAlert`); `js/app/input.js` (`keepTabInPrompt`); `js/app/pair.js` (`promptCard`, `showPrompt`)
- Cases: 1

### QCD-04.1 The focus starts on the first choice, stays in the card, and goes back to Download   [auto: desktop]
Before you start:
- Device and browser: a wide window with a keyboard
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step, **2000** selected

The focus is the control the keyboard acts on, drawn with a ring.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Click **Download** | The card asks "Upscale to 2000 px?"; the focus is on **Yes** |
| 2 | Press Tab | The focus moves to **No** |
| 3 | Press Tab | The focus moves to **Cancel** |
| 4 | Press Tab | The focus goes back to **Yes**, not to anything behind the card |
| 5 | Press Shift+Tab | The focus goes to **Cancel** |
| 6 | Press Escape | The card closes, and the focus is back on **Download** |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## QCD-05 Nothing else acts while a card is up

While a card is up, no keyboard shortcut acts except Escape, and the top bar, the side panel and the step tabs take no click and no focus.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#topBarHost`, `#tabBarHost`, `#panel`, `key:Escape`
- Source: `js/app/input.js` (`onKeyDown`); `js/app/pair.js` (`setBarsInert`, `showPrompt`, `promptCard`)
- Cases: 2

### QCD-05.1 On a wide screen, shortcuts, the top bar and the panel do nothing while the card is up   [auto: desktop]
Before you start:
- Device and browser: a wide window with a keyboard and a mouse
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step, **2000** and **JPEG** selected

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Click **PNG** | **PNG** is selected |
| 2 | Click **Download** | The card asks "Upscale to 2000 px?" over the photo; the panel stays readable |
| 3 | Press Ctrl+Z | Nothing changes: **PNG** is still selected, and the card is still up |
| 4 | Press 2 (the shortcut for the Rotate step) | Still on Export, and the card is still up |
| 5 | Click **Rotate** in the top bar | Still on Export, and the card is still up |
| 6 | Click **JPEG** in the panel | **PNG** is still selected, and the card is still up |
| 7 | Press Escape | The card closes |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### QCD-05.2 On a phone, a tap on the top bar or the step tabs only reaches the dim   [auto: phone]
Before you start:
- Device and browser: a phone-width window
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step, **2000** and **JPEG** selected

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **PNG** | **PNG** is selected, and **Undo** (the arrow curving left, at the top right) is live |
| 2 | Tap **Download** | The card asks "Upscale to 2000 px?"; the whole screen behind it is dimmed |
| 3 | Tap where **Undo** shows, through the dim | The card closes, as for any tap outside it; **PNG** is still selected |
| 4 | Tap **Download**, then tap where **Rotate** shows in the step bar, through the dim | The card closes; the app is still on the Export step |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## QCD-06 The dim behind the card

What is behind the card is dimmed.

- Risk: low
- Check: eye
- Layout: both. On a phone the whole screen dims and the card is centered between the top bar and the controls; on a wide screen only the photo dims, and the side panel stays readable.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#pairPrompt`, `.alert-layer`
- Source: `css/app.css` (the alert card part's rules, and the phone block)
- Cases: 1

### QCD-06.1 The dim and the card's place, for a person to judge   [eye]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, and a wide window, 1280 × 800 px
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step, **2000** selected

Rows 1 and 3 are measured; rows 2 and 4 are for a person to judge from the screenshot.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | On the phone-width window, tap **Download** | The dim covers the whole window, top bar and tab bar included; the card's middle is halfway between the top bar's lower edge and the controls' upper edge (within 2 px) |
| 2 | Look at the screen | Everything behind the card is evenly darker; the card is light enough to read at once |
| 3 | On the wide window, click **Download** | The dim covers only the photo; the card is centered on the photo; the side panel is not covered |
| 4 | Look at the screen | The photo is darker behind the card; the top bar and the side panel are as bright as before and can be read |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## QCD-07 Over an open sheet

On a phone the card sits above an open sheet and doesn't close it.

- Risk: low
- Check: script
- Layout: phone. A wide screen lists the sheets in the side panel.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#pairPrompt`, `.sheet-layer`
- Source: `css/app.css` (the alert card part's rules); `js/app/pair.js` (`showPrompt`)
- Cases: 1

UPS-08.1 shows the card in front of the Corner shots sheet, and the sheet still open after **Yes**.

### QCD-07.1 Cancel on a card over an open sheet leaves the sheet open   [auto: phone]
Before you start:
- Device and browser: a phone-width window
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Corner shots** | The Corner shots sheet rises |
| 2 | Tap **Download corners** | The card asks "Upscale to 2000 px?" in front of the sheet |
| 3 | Tap **Cancel** | The card closes; the Corner shots sheet is still open, and nothing is saved |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## QCD-08 Taken down when it no longer applies

A pair's own card (Unpair, New photo) is taken down if the pair ends while it is up; any photo that comes in takes down whatever card is up.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#pairPrompt`, `#btnUnpair`, "End the pair, or replace the side you’re on?"
- Source: `js/app/pair.js` (`syncPair`, `receivePhoto`, `hidePrompt`)
- Cases: 2

No control can end a pair while its card is up (the card takes every tap, and every key but Escape), so the first half can't be brought about today; the cases cover the second.

### QCD-08.1 A photo pasted while the Upscale question is up takes it down and opens   [auto: desktop]
Before you start:
- Device and browser: a wide window with a keyboard, in a browser that can paste images (the automated case runs in Chromium only)
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/; IMG_9136.JPEG copied as an image (as an image viewer's Copy does)
- Starting screen: the photo open, on the Export step, **2000** selected

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Click **Download** | The card asks "Upscale to 2000 px?" |
| 2 | Press Ctrl+V | The card goes, nothing is saved, and the pasted photo opens on the Perspective step |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### QCD-08.2 A photo pasted while Unpair is asked replaces it with the New photo question   [auto: desktop]
Before you start:
- Device and browser: a wide window with a keyboard, in a browser that can paste images (the automated case runs in Chromium only)
- Build: the build under test
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/; IMG_9136.JPEG copied as an image
- Starting screen: a pair, as in QCD-01.2; the back open

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Click **Unpair** | The card asks "Unpair" |
| 2 | Press Ctrl+V | The Unpair question goes, and the card asks "New photo": "End the pair, or replace the side you’re on?" |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## QCD-09 The card fades in and out

The card fades and scales in and out; a card on its way out takes no touch. Under reduced motion it only fades, briefly.

- Risk: low
- Check: eye
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#pairPrompt`, `.alert-card`
- Source: `js/app/parts/alert-card.js` (`showAlert`, `hideAlert`, `hideAlertWhenFaded`); `css/app.css` (the alert card part's rules)
- Cases: 2

### QCD-09.1 A closing card takes no touch, and reduced motion only fades it   [auto: phone]
Before you start:
- Device and browser: a phone-width window; for row 4, the system's reduced-motion setting on (in the automated case, emulated)
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step, **2000** selected

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Download** | The card fades in over 180 ms, growing slightly as it comes |
| 2 | Tap **Cancel**, and at once tap where **Yes** was | The card fades out over 120 ms; the second tap reaches nothing on it: no file is saved |
| 3 | Turn on reduced motion | Nothing changes on screen |
| 4 | Tap **Download** | The card only fades in, over 100 ms, at its full size from the start |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### QCD-09.2 The card fading in, for a person to judge   [eye]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step, **2000** selected

The automated case stops the fade 90 ms in (half way), to take the picture.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Download** and look at the card half way through its fade | The card and its words are partly see-through and slightly smaller than at rest, centered where it will settle; the dim behind it is partly in |
| 2 | Let the fade finish | The card is solid, at full size, and the dim is even |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## QCD-10 A card survives a resize, a rotation and a screen update

A card that is up stays up, with its question and choices, when the window is resized, the phone is turned to landscape and back, or the screen updates behind it; its choices still answer.

- Risk: medium
- Check: script
- Layout: both. Turning a phone to a landscape width over 760 px switches to the wide layout, where the card dims only the photo; turning it back restores the phone layout.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#pairPrompt`, `#btnPromptFirst`, `#btnPromptCancel`
- Source: `js/app/parts/alert-card.js` (`showAlert`, `answerAlert`); `js/app/pair.js` (`syncPair`); `js/app/shell.js` (`placeLayout`)
- Cases: 1

### QCD-10.1 The card stays up through a change of layout and back, and still answers   [auto: both]
Before you start:
- Device and browser: on a phone, a phone-width window (390 × 844 px) that can turn to landscape (844 × 390 px); on a wide screen, a 1280 × 800 px window that can be narrowed to 700 px
- Build: the build under test
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step, **2000** selected

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Download** | The card asks "Upscale to 2000 px?" |
| 2 | Turn the phone to landscape (on a wide screen, narrow the window to 700 px) | The layout changes; the card is still up, asking "Upscale to 2000 px?" with **Yes**, **No** and **Cancel** |
| 3 | Turn the phone back to portrait (on a wide screen, widen the window to 1280 px again) | The layout changes back; the card is still up, with the same question |
| 4 | Tap **No** | The card closes, and a file of 1074 × 1074 px is saved |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.
