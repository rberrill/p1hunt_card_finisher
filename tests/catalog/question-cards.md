# Question cards

The question box: the one box the app uses for a question that must be answered before going on (Upscale, Unpair and New photo). It appears over the dimmed photo with a question and two or three buttons.

The single-photo cases use 01_chrome_flat_black.JPEG, whose crop (1074 × 1074 px) is under 2000 px, so **Download** asks the Upscale question. The pair cases use 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG.

Words these cases use, besides those in the catalog's README:
- **Open 01_chrome_flat_black.JPEG** (a named action): tap **Open** (the folder at the top left; on a phone it has no label), then choose 01_chrome_flat_black.JPEG in the file picker.

## QCD-01 One shared question box

Every question shows in the same box over the photo: a title, one line of text, two choices side by side and **Cancel** beneath them.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#pairPrompt`, `#btnPromptFirst`, `#btnPromptSecond`, `#btnPromptCancel`
- Source: `js/app/parts/alert-card.js` (`buildAlertCard`, `updateAlertCard`, `showAlert`); `js/app/pair.js` (`promptCard`, `showPrompt`)
- Ruling: R65. The New photo question's title and its first button both read **New photo**. The app already does this.
- Cases: 2

### QCD-01.1 The Upscale question: a title, a line, two choices side by side and Cancel beneath   [auto: phone]
Before you start:
- Device and browser: a phone-width window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step, **2000** selected

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Download** | The question box (the box over the dimmed photo with a question and buttons) shows, titled "Upscale to 2000 px?", with one line, "The crop is 1074 × 1074 px at the photo’s resolution." |
| 2 | Look at its buttons | **Yes** and **No** side by side, the same height, **Yes** on the left; **Cancel** beneath them, as wide as the two together |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### QCD-01.2 The pair's questions come in the same question box   [auto: phone]

Before you start:
- Device and browser: a phone-width window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG, and 01_chrome_flat_black.JPEG, from samples/
- Starting screen: a pair: open the front, tap **Export**, tap **Add back** and choose the back. The back is open on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Unpair** (beside **Front** / **Back** in the top bar) | The question box (the box over the dimmed photo with a question and buttons) shows, titled "Unpair", with one line, "Keep one side as a single photo."; **Keep front** and **Keep back** side by side, **Cancel** beneath them |
| 2 | Tap **Cancel** | The question box closes |
| 3 | Open 01_chrome_flat_black.JPEG | The question box shows, titled "New photo", with one line, "End the pair, or replace the side you’re on?"; **New photo** and **Replace back** side by side, **Cancel** beneath them |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## QCD-02 Close without answering

**Cancel**, a tap outside the question box or Escape closes it, and nothing runs.

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
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG, and 01_chrome_flat_black.JPEG, from samples/
- Starting screen: a pair, as in QCD-01.2; the back open

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Open 01_chrome_flat_black.JPEG | The question box (the box over the dimmed photo with a question and buttons) asks "New photo" |
| 2 | Tap **Cancel** | The question box closes; **Front** / **Back** is still in the top bar, **Back** in white, and the back is on screen |
| 3 | Open 01_chrome_flat_black.JPEG | The question box asks "New photo" again |
| 4 | Tap the dimmed screen above the question box | The question box closes; the pair is still open, the back on screen, and 01_chrome_flat_black.JPEG was not opened |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### QCD-02.2 Escape closes the question box and keeps the pair   [auto: desktop]
Before you start:
- Device and browser: a wide window with a keyboard
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: a pair, as in QCD-01.2; the back open

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Click **Unpair** | The question box (the box over the dimmed photo with a question and buttons) asks "Unpair" |
| 2 | Press Escape | The question box closes; **Front** / **Back** is still in the top bar, **Back** in white |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## QCD-03 A choice closes the question box, then runs

A choice closes the question box first and then runs. The expected answer (the Upscale question's **Yes**) is red; a pair's questions have no red choice.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnPromptFirst`, `#btnPromptSecond`
- Source: `js/app/parts/alert-card.js` (`answerAlert`, `updateAlertCard`)
- Cases: 2

### QCD-03.1 Yes is red, and closes the question box before the file is saved   [auto: phone]
Before you start:
- Device and browser: a phone-width window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step, **2000** selected

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Download** | The question box (the box over the dimmed photo with a question and buttons) asks "Upscale to 2000 px?"; **Yes** is red (P1Hunt red, #e5322d), **No** is not |
| 2 | Tap **Yes** | The question box closes first; then the file is saved |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### QCD-03.2 The pair's questions have no red choice   [auto: phone]
Before you start:
- Device and browser: a phone-width window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG, and 01_chrome_flat_black.JPEG, from samples/
- Starting screen: a pair, as in QCD-01.2; the back open

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Unpair** | The question box (the box over the dimmed photo with a question and buttons) asks "Unpair"; neither **Keep front** nor **Keep back** is red |
| 2 | Tap **Cancel** | The question box closes |
| 3 | Open 01_chrome_flat_black.JPEG | The question box asks "New photo"; neither **New photo** nor **Replace back** is red |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## QCD-04 Keyboard focus

When the question box shows, the keyboard focus moves to its first choice; Tab and Shift+Tab stay inside the box; when it closes, the focus goes back to the control that asked, as long as that control is still there and live.

- Risk: low
- Check: script
- Layout: both, with a keyboard.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnPromptFirst`, `key:Tab`
- Source: `js/app/parts/alert-card.js` (`showAlert`); `js/app/input.js` (`keepTabInPrompt`); `js/app/pair.js` (`promptCard`, `showPrompt`)
- Cases: 1

### QCD-04.1 The focus starts on the first choice, stays in the question box, and goes back to Download   [auto: desktop]
Before you start:
- Device and browser: a wide window with a keyboard
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step, **2000** selected

The focus is the control the keyboard acts on, drawn with a ring.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Click **Download** | The question box (the box over the dimmed photo with a question and buttons) asks "Upscale to 2000 px?"; the focus is on **Yes** |
| 2 | Press Tab | The focus moves to **No** |
| 3 | Press Tab | The focus moves to **Cancel** |
| 4 | Press Tab | The focus goes back to **Yes**, not to anything behind the question box |
| 5 | Press Shift+Tab | The focus goes to **Cancel** |
| 6 | Press Escape | The question box closes, and the focus is back on **Download** |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## QCD-05 Nothing else acts while a question box is up

While a question box is up, no keyboard shortcut acts except Escape, and the top bar, the side panel and the step tabs take no click and no focus.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#topBarHost`, `#tabBarHost`, `#panel`, `key:Escape`
- Source: `js/app/input.js` (`onKeyDown`); `js/app/pair.js` (`setBarsInert`, `showPrompt`, `promptCard`)
- Cases: 2

### QCD-05.1 On a wide screen, shortcuts, the top bar and the panel do nothing while the question box is up   [auto: desktop]
Before you start:
- Device and browser: a wide window with a keyboard and a mouse
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step, **2000** and **JPEG** selected

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Click **PNG** | **PNG** is selected |
| 2 | Click **Download** | The question box (the box over the dimmed photo with a question and buttons) asks "Upscale to 2000 px?" over the photo; the panel at the right stays uncovered |
| 3 | Press Ctrl+Z | Nothing changes: **PNG** is still selected, and the question box is still up |
| 4 | Press 2 (the shortcut for the Rotate step) | Still on Export, and the question box is still up |
| 5 | Click **Rotate** in the top bar | Still on Export, and the question box is still up |
| 6 | Click **JPEG** in the panel | **PNG** is still selected, and the question box is still up |
| 7 | Press Escape | The question box closes |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### QCD-05.2 On a phone, a tap on the top bar or the step tabs only reaches the dim   [auto: phone]
Before you start:
- Device and browser: a phone-width window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step, **2000** and **JPEG** selected

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **PNG** | **PNG** is selected, and **Undo** (the arrow curving left, at the top right) is live |
| 2 | Tap **Download** | The question box (the box over the dimmed photo with a question and buttons) asks "Upscale to 2000 px?"; the whole screen behind it is dimmed |
| 3 | Tap where **Undo** shows, through the dim | The question box closes, as for any tap outside it; **PNG** is still selected |
| 4 | Tap **Download** | The question box asks "Upscale to 2000 px?" again |
| 5 | Tap where **Rotate** shows in the step tabs (the six tabs along the bottom), through the dim | The question box closes; the app is still on the Export step |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## QCD-06 The dim behind the question box

What is behind the question box is dimmed.

- Risk: low
- Check: eye
- Layout: both. On a phone the whole screen dims and the question box is centered between the top bar and the controls; on a wide screen only the photo dims, and the side panel stays readable.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#pairPrompt`, `.alert-layer`
- Source: `css/app.css` (the alert card part's rules, and the phone block)
- Cases: 1

### QCD-06.1 The dim and the question box's place, for a person to judge   [eye]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, and a wide window, 1280 × 800 px
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step, **2000** selected

Rows 1 and 3 are measured; rows 2 and 4 are for a person to judge from the screenshot.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | On the phone-width window, tap **Download** | The question box (the box over the dimmed photo with a question and buttons) shows; the dim covers the whole window, top bar and step tabs included; the box's middle is halfway between the top bar's lower edge and the controls' upper edge (within 2 px) |
| 2 | Look at the screen | Everything behind the question box is evenly darker; the box is light enough to read at once |
| 3 | On the wide window, click **Download** | The dim covers only the photo; the question box is centered on the photo; the side panel is not covered |
| 4 | Look at the screen | The photo is darker behind the question box; the top bar and the side panel are as bright as before and can be read |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## QCD-07 Over an open sheet

On a phone the question box sits above an open sheet and doesn't close it.

- Risk: low
- Check: script
- Layout: phone. A wide screen lists the sheets in the side panel.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#pairPrompt`, `.sheet-layer`
- Source: `css/app.css` (the alert card part's rules); `js/app/pair.js` (`showPrompt`)
- Cases: 1

UPS-08.1 shows the question box in front of the Corner shots sheet, and the sheet still open after **Yes**.

### QCD-07.1 Cancel in a question box over an open sheet leaves the sheet open   [auto: phone]
Before you start:
- Device and browser: a phone-width window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Corner shots** in the bottom row of buttons | The Corner shots sheet rises |
| 2 | Tap **Download corners** | The question box (the box over the dimmed photo with a question and buttons) asks "Upscale to 2000 px?" in front of the sheet |
| 3 | Tap **Cancel** | The question box closes; the Corner shots sheet is still open, and nothing is saved |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## QCD-08 Taken down when it no longer applies

A pair's own question (Unpair, New photo) is taken down when the pair ends while it is up; any photo that comes in takes down whatever question is up.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#pairPrompt`, `#btnUnpair`, "End the pair, or replace the side you’re on?"
- Source: `js/app/pair.js` (`syncPair`, `receivePhoto`, `hidePrompt`)
- Cases: 2

No control can end a pair while its question is up (the question box takes every tap, and every key but Escape), so the first half can't be brought about today; the cases cover the second.

### QCD-08.1 A photo pasted while the Upscale question is up takes it down and opens   [auto: desktop]
Before you start:
- Device and browser: a wide window with a keyboard, in a browser that can paste images (the automated case runs in Chromium only)
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/; IMG_9136.JPEG copied as an image (as an image viewer's Copy does)
- Starting screen: the photo open, on the Export step, **2000** selected

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Click **Download** | The question box (the box over the dimmed photo with a question and buttons) asks "Upscale to 2000 px?" |
| 2 | Press Ctrl+V | The question box goes, nothing is saved, and the pasted photo opens on the Perspective step |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### QCD-08.2 A photo pasted while Unpair is asked replaces it with the New photo question   [auto: desktop]
Before you start:
- Device and browser: a wide window with a keyboard, in a browser that can paste images (the automated case runs in Chromium only)
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/; IMG_9136.JPEG copied as an image
- Starting screen: a pair, as in QCD-01.2; the back open

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Click **Unpair** | The question box (the box over the dimmed photo with a question and buttons) asks "Unpair" |
| 2 | Press Ctrl+V | The Unpair question goes, and the question box asks "New photo": "End the pair, or replace the side you’re on?" |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## QCD-09 The question box fades in and out

The question box fades and scales in and out; a box on its way out takes no touch. Under reduced motion it only fades, briefly.

- Risk: low
- Check: eye; script (the fade's timing, and a touch while it fades out)
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#pairPrompt`, `.alert-card`
- Source: `js/app/parts/alert-card.js` (`showAlert`, `hideAlert`, `hideAlertWhenFaded`); `css/app.css` (the alert card part's rules)
- Cases: 2

### QCD-09.1 A closing question box takes no touch, and reduced motion only fades it   [auto: phone]
Script only
Stand-in: nothing is replaced. The fades last a fifth of a second or less, too short to time by eye or to tap inside by hand, so the script reads each fade's timing from the page and taps within the fade out; it turns reduced motion on by emulating the system setting.

Before you start:
- Device and browser: a phone-width window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step, **2000** selected, the system's reduced-motion setting off

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Download** | The question box (the box over the dimmed photo with a question and buttons) fades in over 180 ms, growing slightly as it comes |
| 2 | Tap **Cancel** | The question box starts to fade out, over 120 ms, and takes no more touches |
| 3 | Within those 120 ms, tap where **Yes** was | The tap reaches nothing in the question box: no file is saved |
| 4 | Turn on the system's reduced-motion setting | Nothing changes on screen |
| 5 | Tap **Download** | The question box only fades in, over 100 ms, at its full size from the start |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### QCD-09.2 The question box fading in, for a person to judge   [eye]
Script only
Stand-in: nothing is replaced. The fade lasts 180 ms, too short to see half way, so the script stops it 90 ms in and saves a picture of the screen for a person to judge, then lets it finish.

Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step, **2000** selected

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Download**; the script stops the fade half way and takes the picture | In the picture, the question box (the box over the dimmed photo with a question and buttons) and its words are partly see-through and slightly smaller than at rest, centered where it will settle; the dim behind it is partly in |
| 2 | Let the fade finish | The question box is solid, at full size, and the dim is even |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## QCD-10 A question box survives a resize, a rotation and a screen update

A question box that is up stays up, with its question and choices, when the window is resized, the phone is turned to landscape and back, or the screen updates behind it; its choices still answer.

- Risk: medium
- Check: script; phone (a real iPhone turned)
- Layout: both. Turning a phone to a landscape width over 760 px switches to the wide layout, where the question box dims only the photo; turning it back restores the phone layout.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#pairPrompt`, `#btnPromptFirst`, `#btnPromptCancel`
- Source: `js/app/parts/alert-card.js` (`showAlert`, `answerAlert`); `js/app/pair.js` (`syncPair`); `js/app/shell.js` (`placeLayout`)
- Cases: 2

### QCD-10.1 The question box stays up through a change of layout and back, and still answers   [auto: both]
Before you start:
- Device and browser: two windows whose size can be set, such as a desktop browser's device mode: a phone-width one, 390 × 844 px, that can be turned to 844 × 390 px; and a wide one, 1280 × 800 px, that can be narrowed to 700 px
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 01_chrome_flat_black.JPEG from samples/
- Starting screen: the photo open, on the Export step, **2000** selected

Run the rows once in each window.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Download** (on the wide window, click it) | The question box (the box over the dimmed photo with a question and buttons) asks "Upscale to 2000 px?"; on the phone-width window the dim covers the whole window, on the wide one only the photo |
| 2 | Turn the phone-width window to 844 × 390 px (narrow the wide window to 700 px) | The layout changes: at 844 px the controls move to a panel at the right and the dim covers only the photo; at 700 px the step tabs move to the bottom and the dim covers the whole window. The question box is still up, asking "Upscale to 2000 px?", with **Yes**, **No** and **Cancel** |
| 3 | Turn the window back to 390 × 844 px (widen the wide window to 1280 px) | The layout changes back, and the dim with it, as in row 1; the question box is still up, with the same question |
| 4 | Tap **No** | The question box closes, and a file of 1074 × 1074 px is saved |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### QCD-10.2 On an iPhone, the question box stays up when the phone is turned   [phone]
Before you start:
- Device and browser: an iPhone, Safari, with Portrait Orientation Lock off (in Control Center)
- Build: the build under test on the UAT site, https://rberrill.github.io/p1hunt_card_finisher_uat/
- Browser data: none for this site (a private tab, or the site's data cleared in Settings › Safari)
- Photo: 01_chrome_flat_black.JPEG from samples/ (AirDrop it to the phone or save it to Photos first)
- Starting screen: the photo open, on the Export step, **2000** selected, the phone upright

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Download** | The question box (the box over the dimmed photo with a question and buttons) asks "Upscale to 2000 px?" |
| 2 | Turn the phone on its side | The page turns; the question box is still up, asking "Upscale to 2000 px?", and the whole box, **Cancel** included, is on screen |
| 3 | Turn the phone upright again | The page turns back; the question box is still up, with the same question |
| 4 | Tap **Cancel** | The question box closes, and the Export step shows |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot (press the side button and volume up together).
