# Question cards

The one card the app uses for a question that must be answered before going on: Upscale, Unpair and New photo.

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
- Cases: none yet

## QCD-02 Close without answering

**Cancel**, a tap outside the card or Escape closes the card, and nothing runs.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnPromptCancel`, `#pairPrompt`, `key:Escape`
- Source: `js/app/parts/alert-card.js` (`buildAlertCard`, `hideAlert`); `js/app/input.js` (`onKeyDown`)
- Cases: none yet

## QCD-03 A choice closes the card, then runs

A choice closes the card first and then runs. The expected answer (the Upscale question's **Yes**) is red; a pair's questions have no red choice.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnPromptFirst`, `#btnPromptSecond`
- Source: `js/app/parts/alert-card.js` (`answerAlert`, `updateAlertCard`)
- Cases: none yet

## QCD-04 Keyboard focus

When the card shows, the keyboard focus moves to its first choice; Tab and Shift+Tab stay inside the card; when it closes, the focus goes back to the control that asked, if that control is still there and live.

- Risk: low
- Check: script
- Layout: both, with a keyboard.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnPromptFirst`, `key:Tab`
- Source: `js/app/parts/alert-card.js` (`showAlert`); `js/app/input.js` (`keepTabInPrompt`); `js/app/pair.js` (`promptCard`, `showPrompt`)
- Cases: none yet

## QCD-05 Nothing else acts while a card is up

While a card is up, no keyboard shortcut acts except Escape, and the top bar, the side panel and the step tabs take no click and no focus.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#topBarHost`, `#tabBarHost`, `#panel`, `key:Escape`
- Source: `js/app/input.js` (`onKeyDown`); `js/app/pair.js` (`setBarsInert`, `showPrompt`, `promptCard`)
- Cases: none yet

## QCD-06 The dim behind the card

What is behind the card is dimmed.

- Risk: low
- Check: eye
- Layout: both. On a phone the whole screen dims and the card is centered between the top bar and the controls; on a wide screen only the photo dims, and the side panel stays readable.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#pairPrompt`, `.alert-layer`
- Source: `css/app.css` (the alert card part's rules, and the phone block)
- Cases: none yet

## QCD-07 Over an open sheet

On a phone the card sits above an open sheet and doesn't close it.

- Risk: low
- Check: script
- Layout: phone. A wide screen lists the sheets in the side panel.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#pairPrompt`, `.sheet-layer`
- Source: `css/app.css` (the alert card part's rules); `js/app/pair.js` (`showPrompt`)
- Cases: none yet

## QCD-08 Taken down when it no longer applies

A pair's own card (Unpair, New photo) is taken down if the pair ends while it is up; any photo that comes in takes down whatever card is up.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#pairPrompt`, `#btnUnpair`, "End the pair, or replace the side you’re on?"
- Source: `js/app/pair.js` (`syncPair`, `receivePhoto`, `hidePrompt`)
- Cases: none yet

## QCD-09 The card fades in and out

The card fades and scales in and out; a card on its way out takes no touch. Under reduced motion it only fades, briefly.

- Risk: low
- Check: eye
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#pairPrompt`, `.alert-card`
- Source: `js/app/parts/alert-card.js` (`showAlert`, `hideAlert`, `hideAlertWhenFaded`); `css/app.css` (the alert card part's rules)
- Cases: none yet

## QCD-10 A card survives a resize, a rotation and a screen update

A card that is up stays up, with its question and choices, when the window is resized, the phone is turned to landscape and back, or the screen updates behind it; its choices still answer.

- Risk: medium
- Check: script
- Layout: both. Turning a phone to a landscape width over 760 px switches to the wide layout, where the card dims only the photo; turning it back restores the phone layout.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#pairPrompt`, `#btnPromptFirst`, `#btnPromptCancel`
- Source: `js/app/parts/alert-card.js` (`showAlert`, `answerAlert`); `js/app/pair.js` (`syncPair`); `js/app/shell.js` (`placeLayout`)
- Cases: none yet
