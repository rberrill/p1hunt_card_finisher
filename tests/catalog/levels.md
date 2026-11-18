# Levels

The fourth step: setting the white and black points by picking them on the photo or with Auto, as a draft that only Apply makes real.

The pick cases use IMG_9075.JPEG from samples/, a graded card in a clear slab on a white background. On the Levels step the photo shows framed by the crop, and its spots are named as a person sees them: the white background just left of the slab, halfway down (about 225, 226, 217); the same just right of the slab; and the card's dark background, up and to the left of the driver's head (about 67, 65, 68).

## LEV-01 Discard

**Discard** throws away the unapplied changes. It is off unless there are some.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnDiscardLevels`, "Discard", "Drop the unapplied changes"
- Source: `js/app/levels.js` (`discardLevels`, `buildLevelsLine`, `syncLevels`)
- Cases: 1

### LEV-01.1 Discard drops the unapplied changes   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step (tap **Levels** in the step tabs: the six tabs Perspective to Export, along the bottom on a phone, in the top bar on a wide screen), nothing changed yet (**Undo** at the top right is greyed out: shown dim and not answering a tap)
- Browser data: none for this site (a private window, or the site's data cleared)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at **Discard**, at the left of the line above the controls (the controls: the block of buttons under the photo, or on a wide screen the panel at the right; the line is the one line of text at their top) | It is greyed out; there is no dot on the **Levels** tab |
| 2 | Tap **Auto**, at the bottom of the controls | The photo changes (its whites brighten and its darks deepen); **Discard** is no longer greyed out; a white dot sits on the **Levels** tab |
| 3 | Tap **Discard** | The photo looks as it did before Auto; both color patches (the small marks at the left of **Pick white** and **Pick black** that show the color picked) are dashed and empty again; **Discard** and **Apply** are greyed out; the dot has gone; **Undo** is still greyed out |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## LEV-02 Apply

**Apply** (red) applies the pending changes to the photo as one undo step. It is off unless there are some.

- Risk: high
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnApplyLevels`, "Apply", "Apply these levels to the photo"
- Source: `js/app/levels.js` (`applyLevels`, `buildLevelsLine`, `syncLevels`)
- Cases: 1

### LEV-02.1 Apply makes the changes part of the photo as one undo step   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step, nothing changed yet (**Undo** at the top right is greyed out: shown dim and not answering a tap)
- Browser data: none for this site (a private window, or the site's data cleared)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at **Apply**, the red button at the right of the line above the controls (the controls: the block of buttons under the photo, or on a wide screen the panel at the right; the line is the one line of text at their top) | It is greyed out |
| 2 | Tap **Auto**, at the bottom of the controls | The photo changes; **Apply** is no longer greyed out |
| 3 | Tap **Apply** | The photo keeps Auto's look; **Apply** and **Discard** are greyed out; there is no dot on the **Levels** tab; **Undo** is no longer greyed out |
| 4 | Tap **Undo** (the arrow curving left, at the top right) | The photo looks as it did before Auto; **Undo** is greyed out again |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## LEV-03 The draft shows only on Levels

Picks, **Auto** and **Clear** change a draft that only the Levels step shows. Every other step, Perspective's **Preview** and the saved file use the applied levels.

- Risk: high
- Check: script, saved file
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnApplyLevels`, `.step-tab-mark`
- Source: `js/app/levels.js` (`draftLevels`, `levelsShown`, `setDraft`); `js/app/view.js` (`drawResult`)
- Cases: 1

### LEV-03.1 The other steps show the applied levels, not the unapplied ones   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step, no levels applied
- Browser data: none for this site (a private window, or the site's data cleared)

Perspective's **Preview** is PER-27.4 and the saved file EXP-32.2. The step tabs are the six tabs Perspective to Export, along the bottom on a phone, in the top bar on a wide screen.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Crop** in the step tabs | The Crop step shows the whole photo, with the row of crop sizes under it; note how the photo's colors look |
| 2 | Tap **Levels** in the step tabs | The Levels step shows the photo framed by the crop; **Apply** is greyed out (shown dim and not answering a tap); note how the photo's colors look |
| 3 | Tap **Auto**, at the bottom of the controls (the block of buttons under the photo; on a wide screen, the panel at the right) | The photo's colors change from row 2 |
| 4 | Tap **Crop** | The photo looks as it did in row 1, without Auto's change; a white dot sits on the **Levels** tab |
| 5 | Tap **Levels** | The photo shows Auto's change again, as in row 3 |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## LEV-04 A draft equal to the applied levels is not pending

A draft that equals the applied levels is not pending: **Apply** and **Discard** stay off, and the Levels tab shows no dot.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `.step-tab-mark`, `#btnApplyLevels`, `#btnDiscardLevels`
- Source: `js/app/levels.js` (`setDraft`, `syncLevels`); `js/app/parts/tab-bar.js` (`updateTabBar`)
- Cases: 1

### LEV-04.1 Auto again after Apply leaves nothing to apply   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step, no levels applied
- Browser data: none for this site (a private window, or the site's data cleared)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Auto**, at the bottom of the controls (the block of buttons under the photo; on a wide screen, the panel at the right) | **Apply** is no longer greyed out (shown dim and not answering a tap); a white dot sits on the **Levels** tab |
| 2 | Tap **Apply** | **Apply** and **Discard** are greyed out; no dot on the **Levels** tab |
| 3 | Tap **Auto** again | Auto sets the same points as before: **Apply** and **Discard** stay greyed out, and no dot shows |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## LEV-05 Pick white

**Pick white** arms the color picker for the white point: the button shows as selected, and the line between **Discard** and **Apply** reads "Tap something white". Tapping it again disarms.

- Risk: high
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#levelsPicks`, "Pick white", "Tap something white"
- Source: `js/app/levels.js` (`buildPickRow`, `armDropper`, `levelsHint`, `syncLevels`)
- Ruling: R69. Escape closes a phone sheet and nothing else: not **Tap to find card**, not a Levels pick. The app already does this.
- Cases: 2

### LEV-05.1 Pick white arms the picker, and a second tap disarms it   [auto: phone]

Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step
- Browser data: none for this site (a private window, or the site's data cleared)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Pick white** | **Pick white** is selected (solid white); the line between **Discard** and **Apply** reads "Tap something white" |
| 2 | Tap **Pick white** again | **Pick white** is no longer white; the line reads "Pick white, or try Auto" |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### LEV-05.2 Escape leaves Pick white armed   [auto: desktop]

Before you start:
- Device and browser: a computer with a keyboard; a wide window
- Build: the build under test
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step
- Browser data: none for this site (a private window, or the site's data cleared)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Click **Pick white** | **Pick white** is selected; the line between **Discard** and **Apply** reads "Tap something white" |
| 2 | Press Escape | **Pick white** is still selected and the line still reads "Tap something white" |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## LEV-06 Pick black

**Pick black** arms the color picker for the black point, which is optional; the line reads "Tap something black". Tapping it again disarms.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#levelsPicks`, "Pick black", "Tap something black"
- Source: `js/app/levels.js` (`buildPickRow`, `armDropper`, `levelsHint`, `syncLevels`)
- Cases: 1

### LEV-06.1 Pick black arms the picker, takes over from Pick white, and disarms   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step
- Browser data: none for this site (a private window, or the site's data cleared)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Pick black** | **Pick black** is selected (solid white); the line between **Discard** and **Apply** reads "Tap something black" |
| 2 | Tap **Pick white** | **Pick white** is selected instead, **Pick black** is not; the line reads "Tap something white" |
| 3 | Tap **Pick black** | **Pick black** is selected, **Pick white** is not; the line reads "Tap something black" |
| 4 | Tap **Pick black** again | Neither is selected; the line reads "Pick white, or try Auto" |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## LEV-07 The color patches

A small color patch leads each pick button: dashed and empty until set, then the picked color. Its tooltip reads "Not set" or "RGB" and the three values.

- Risk: low
- Check: script
- Layout: both. A tooltip shows only where a mouse can rest on the patch, so the case runs on a wide screen.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#swatchWhite`, `#swatchBlack`, "Not set", "RGB "
- Source: `js/app/levels.js` (`buildPickRow`, `syncLevels`); `js/app/parts/segmented-control.js` (`buildSwatch`, `updateSwatch`)
- Cases: 1

### LEV-07.1 The color patches read Not set, then the picked color   [auto: desktop]
Before you start:
- Device and browser: a computer with a mouse; a wide window
- Build: the build under test
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step, no levels set
- Browser data: none for this site (a private window, or the site's data cleared)

The color patch is the small mark at the left of **Pick white** (or **Pick black**) that shows the color picked. Pick white at a spot: click **Pick white**, then click that spot on the photo; Pick black at a spot the same, with **Pick black**.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Rest the pointer on the color patch of **Pick white** | It is dashed and empty; its tooltip reads "Not set" |
| 2 | Rest the pointer on the color patch of **Pick black** | It is dashed and empty; its tooltip reads "Not set" |
| 3 | Pick white at the white background just left of the slab, halfway down | The color patch of **Pick white** is filled with that off-white |
| 4 | Rest the pointer on that color patch | Its tooltip reads "RGB" and three values, each within 3 of 225, 226, 217 |
| 5 | Rest the pointer on the color patch of **Pick black** | Its tooltip still reads "Not set" |
| 6 | Pick black at the card's dark background, up and to the left of the driver's head | The color patch of **Pick black** is filled with that dark grey |
| 7 | Rest the pointer on that color patch | Its tooltip reads "RGB" and three values, each within 3 of 67, 65, 68 |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## LEV-08 Aim and pick

With a pick armed, a press on the photo aims, and the color is taken where the finger or pointer lifts. The photo doesn't pan. A second finger put down during the press cancels it: no color is taken, and the pick stays armed.

- Risk: high
- Check: script, touch
- Layout: both
- Added: 1.10 baseline
- Changed: 1.10.0
- Anchors: "Tap something white", "Tap something black", `CONFIG.levels.sampleRadiusPx`
- Source: `js/app/input.js` (`stepGesture`, `onPointerMove`, `startPinch`, `endGesture`); `js/app/levels.js` (`pickAt`)
- Ruling: R8. A second finger cancels the pick and leaves the color picker armed. The app does this since 1.10.0. R72. While a pick is armed one finger can't pan, and the color is taken where the finger lifts. The app already does this.
- Cases: 2

### LEV-08.1 The color is taken where the finger lifts, and the photo does not move   [auto: phone, webkit]

Before you start:
- Device and browser: a phone, in its own browser
- Build: the build under test
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step, no levels set
- Browser data: none for this site (a private window, or the site's data cleared)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Pick white** | **Pick white** is selected (solid white) |
| 2 | Drag a finger from the white background just left of the slab to the card's dark background, up and to the left of the driver's head, and lift it there | The color patch at the left of **Pick white** (the small mark that shows the color picked) is filled with the dark grey where the finger lifted, not the white where it pressed; the photo has not moved under the finger |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### LEV-08.2 A second finger cancels the pick and leaves the picker armed   [auto: phone]

Before you start:
- Device and browser: a phone, in its own browser (two fingers on the screen)
- Build: the build under test
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step, no levels set
- Browser data: none for this site (a private window, or the site's data cleared)

The color patch is the small mark at the left of **Pick white** that shows the color picked.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Pick white** | **Pick white** is selected; the line between **Discard** and **Apply** reads "Tap something white" |
| 2 | Put one finger on the white background just left of the slab, and keep it there | The color patch is still dashed and empty |
| 3 | Put a second finger on the photo 80 px to the right of the first | The color patch is still dashed and empty |
| 4 | Lift the second finger | The color patch is still dashed and empty |
| 5 | Lift the first finger | The color patch is still dashed and empty: no white point is set |
| 6 | Look at the picks and the line | **Pick white** is still selected and the line still reads "Tap something white" |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## LEV-09 The picker's magnifier

While pressing, a round magnifier shows the screen at 4 times (so with the levels being shown), with the sample circle in the middle.

- Risk: low
- Check: eye
- Layout: both. It is placed by pointer type, as Perspective's magnifier is: pinned to a top corner for touch, beside the cursor for a mouse.
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.loupeZoom`, `CONFIG.loupeSize`, `CONFIG.levels.sampleRadiusPx`
- Source: `js/app/levels.js` (`drawScreenLoupe`, `drawLevelsOverlay`); `js/app/view.js` (`loupeCenter`, `loupeRadius`)
- Cases: 2

### LEV-09.1 The picker's magnifier under a finger, for a person to judge   [eye]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px (drag with a finger)
- Build: the build under test
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step, no levels set
- Browser data: none for this site (a private window, or the site's data cleared)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Pick white** | **Pick white** is selected (solid white) |
| 2 | Put a finger on the white background just left of the slab and slide it 10 px down, without lifting | A round magnifier in the top right corner of the photo area shows that spot 4 times larger, with a small white circle (the patch the pick reads) in its middle and a white rim |
| 3 | Lift the finger | The magnifier goes; the color patch at the left of **Pick white** (the small mark that shows the color picked) is filled |
| 4 | Tap **Pick white** | **Pick white** is selected |
| 5 | Put a finger on the white background just right of the slab and slide it 10 px down, without lifting | The magnifier is in the top left corner of the photo area |
| 6 | Lift the finger | The magnifier goes |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### LEV-09.2 The picker's magnifier beside the mouse, for a person to judge   [eye]
Before you start:
- Device and browser: a computer with a mouse; a wide window, 1280 × 800 px
- Build: the build under test
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step, no levels set
- Browser data: none for this site (a private window, or the site's data cleared)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Click **Pick white** | **Pick white** is selected (solid white) |
| 2 | Press the mouse button on the white background just left of the slab and move 10 px down, without letting go | A round magnifier up and to the right of the pointer shows that spot 4 times larger, with a small white circle in its middle and a white rim |
| 3 | Let go | The magnifier goes |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## LEV-10 How a pick samples the photo

A pick reads a small square patch of the full-resolution photo under the point (4 screen px each way, never less than 4 photo px). Of its pixels, only the half nearest the patch's middle brightness count, averaged in linear light; the other half is left out.

- Risk: low
- Check: script
- Layout: both. The color is read from the patch's tooltip, which needs a mouse, so the cases run on a wide screen.
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.levels.sampleRadiusPx`, `CONFIG.levels.sampleTrim`
- Source: `js/app/levels.js` (`pickAt`); `js/engine.js` (`meanColor`)
- Ruling: R55. A pick reads the half of the tapped patch's pixels nearest its median brightness (Claude's design, accepted by Rich). The app already does this.
- Cases: 2

### LEV-10.1 A pick reads the half of its patch nearest the middle brightness   [auto: desktop]

Before you start:
- Device and browser: a computer with a mouse; a wide window, 1280 × 800 px
- Build: the build under test
- Photo: levels-speckled-grey.png from tests/fixtures/ (120 × 160 px: grey 100, 100, 100, with 4 pixels in every 10 white, 255, 255, 255, in an even pattern of fine dots)
- Starting screen: the picture open, on the Levels step (the app says "Nothing detected. Drag the corners into place." on Perspective; leave the corners where they are)
- Browser data: none for this site (a private window, or the site's data cleared)

The picture shows about 6 times its size, so 4 screen px is under 1 picture px and the pick reads its least patch, 4 picture px each way: about 6 grey pixels in 10 and 4 white. The half of them nearest the middle brightness are all grey, so the pick reads grey 100. Leaving out the darkest and the brightest quarter instead would read about 166, and the plain mean of the patch is about 182. The color patch is the small mark at the left of **Pick white** that shows the color picked.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Click **Pick white** | **Pick white** is selected (solid white) |
| 2 | Click the middle of the picture | The color patch is filled with a mid grey |
| 3 | Rest the pointer on the color patch | Its tooltip reads "RGB 100, 100, 100" (each value within 1): the white dots were left out |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### LEV-10.2 A pick reads at least 4 photo pixels around the point   [auto: desktop]

Before you start:
- Device and browser: a computer with a mouse; a wide window, 1280 × 800 px
- Build: the build under test
- Photo: levels-small-white-square.png from tests/fixtures/ (120 × 160 px: grey 100, 100, 100, with a white square 4 px a side in its middle)
- Starting screen: the picture open, on the Levels step (the app says "Nothing detected. Drag the corners into place." on Perspective; leave the corners where they are)
- Browser data: none for this site (a private window, or the site's data cleared)

The picture shows about 6 times its size, so 4 screen px is under 1 picture px: a patch that size would hold only the white square. The least patch, 4 picture px each way, is 8 or 9 px a side, and the square is under a quarter of it, so the pick reads the grey around it. The color patch is the small mark at the left of **Pick white** that shows the color picked.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Click **Pick white** | **Pick white** is selected (solid white) |
| 2 | Click the middle of the small white square | The color patch is filled with a mid grey, not white |
| 3 | Rest the pointer on the color patch | Its tooltip reads "RGB 100, 100, 100" (each value within 1) |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## LEV-11 A pick that works

A pick that works sets the point, marks where it was taken and disarms the color picker.

- Risk: medium
- Check: script, touch
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#swatchWhite`, `#swatchBlack`, `#levelsPicks`
- Source: `js/app/levels.js` (`pickAt`, `setDraft`)
- Cases: 1

### LEV-11.1 A pick that works sets the point, marks the spot and disarms   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step, no levels set
- Browser data: none for this site (a private window, or the site's data cleared)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Pick white** | **Pick white** is selected (solid white) |
| 2 | Tap the white background just left of the slab, halfway down | The color patch at the left of **Pick white** (the small mark that shows the color picked) is filled with the background's off-white |
| 3 | Look at the spot you tapped | A small ring labelled W marks it (how it looks is LEV-13.1) |
| 4 | Look at the picks and the line between **Discard** and **Apply** | Neither pick is selected; the line reads "Hold the photo to compare"; **Apply** is no longer greyed out (shown dim and not answering a tap) |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## LEV-12 A pick that can't work

A pick that can't work shows a warning and leaves the color picker armed: a spot outside the photo; a white not at least 20 brighter than the black point; a black brighter than 100 (on a scale of 0 to 255); a black not at least 20 darker than the white point. A tap on the dark area around the visible picture, where the step hides the rest of the photo, is ignored, with no warning, and leaves the picker armed.

- Risk: medium
- Check: script, touch
- Layout: both
- Added: 1.10 baseline
- Changed: 1.10.0
- Anchors: "That spot is outside the photo.", "That spot is darker than the black point. Pick something brighter.", "That spot is too light to be a black point. ", "That spot is brighter than the white point. Pick something darker.", `CONFIG.levels.maxBlackLuma`
- Source: `js/app/levels.js` (`pickAt`, `isInCrop`, `pickProblem`)
- Ruling: R38. A tap outside the visible picture is ignored and the pick stays armed. The app does this since 1.10.0 where the tap is over the part of the photo the step hides; where it is past the photo's own edge it still warns (LEV-12.1).
- Cases: 5

### LEV-12.1 A tap outside the photo warns and stays armed   [auto: phone]
Before you start:
- Device and browser: any; a phone-width window (drag with a finger)
- Build: the build under test
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step, no levels set and no pick selected
- Browser data: none for this site (a private window, or the site's data cleared)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Drag the middle of the photo 200 px to the right | The photo moves 200 px right; the empty area past its left edge shows at the left of the photo area |
| 2 | Tap **Pick white** | **Pick white** is selected (solid white) |
| 3 | Tap that empty area, 15 px in from the left edge of the photo area | A warning reads "That spot is outside the photo." |
| 4 | Look at the picks, the line between **Discard** and **Apply**, and the color patch at the left of **Pick white** (the small mark that shows the color picked) | **Pick white** is still selected, the line still reads "Tap something white", and the color patch is still dashed and empty |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### LEV-12.2 A black pick on something light warns and stays armed   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step, no levels set
- Browser data: none for this site (a private window, or the site's data cleared)

Pick black at a spot: tap **Pick black**, then tap that spot on the photo.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Pick black at the white background just left of the slab, halfway down | A warning reads "That spot is too light to be a black point. Pick something dark, or skip the black point." |
| 2 | Look at the picks, the line between **Discard** and **Apply**, and the color patch at the left of **Pick black** (the small mark that shows the color picked) | **Pick black** is still selected, the line still reads "Tap something black", and the color patch is still dashed and empty |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### LEV-12.3 A white pick no brighter than the black point warns and stays armed   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step, no levels set
- Browser data: none for this site (a private window, or the site's data cleared)

Pick white at a spot: tap **Pick white**, then tap that spot on the photo; Pick black at a spot the same, with **Pick black**. The color patch is the small mark at the left of each pick button that shows the color picked.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Pick black at the card's dark background, up and to the left of the driver's head | The color patch of **Pick black** is filled with that dark grey |
| 2 | Pick white at the same dark spot | A warning reads "That spot is darker than the black point. Pick something brighter." |
| 3 | Look at the picks, the line between **Discard** and **Apply**, and the color patch of **Pick white** | **Pick white** is still selected, the line still reads "Tap something white", and the color patch is still dashed and empty |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### LEV-12.4 A black pick no darker than the white point warns and stays armed   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step, no levels set
- Browser data: none for this site (a private window, or the site's data cleared)

Pick white at a spot: tap **Pick white**, then tap that spot on the photo; Pick black at a spot the same, with **Pick black**. The color patch is the small mark at the left of each pick button that shows the color picked.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Pick white at the card's dark background, up and to the left of the driver's head | The color patch of **Pick white** is filled with that dark grey: with no black point set, any white pick works |
| 2 | Pick black at the same dark spot | A warning reads "That spot is brighter than the white point. Pick something darker." |
| 3 | Look at the picks, the line between **Discard** and **Apply**, and the color patch of **Pick black** | **Pick black** is still selected, the line still reads "Tap something black", and the color patch is still dashed and empty |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### LEV-12.5 A tap on the empty area below the picture is ignored and the pick stays armed   [auto: phone]

Before you start:
- Device and browser: any; a phone-width window
- Build: the build under test
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step, no levels set
- Browser data: none for this site (a private window, or the site's data cleared)

On the Levels step the photo shows only inside the crop; the dark area around it hides the rest of the photo, and a tap there takes no color from it.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Pick white** | **Pick white** is selected and the line between **Discard** and **Apply** reads "Tap something white" |
| 2 | Tap the dark empty area 40 px below the middle of the picture's bottom edge | The color patch at the left of **Pick white** (the small mark that shows the color picked) is still dashed and empty, and no warning shows |
| 3 | Look at the picks and the line | **Pick white** is still selected and the line still reads "Tap something white" |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## LEV-13 Pick marks

A ring labelled **W** or **B** marks where each point was picked (Auto's points have none). The marks hide while comparing.

- Risk: low
- Check: eye; script (whether the letter has a dark outline)
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: "W", "B"
- Source: `js/app/levels.js` (`drawPickMarker`, `drawLevelsOverlay`)
- Ruling: R39. The W and B are white letters with a dark outline, as the corner outline is drawn, so they can be read on a white spot. The app differs today.
- Cases: 2

### LEV-13.1 The pick marks, for a person to judge   [eye]
Written to ruling R39; until that is built, the judge fails row 2 by eye: the W is a plain white letter, hard to read on the white background (BUG-231). LEV-13.2 checks the outline by script.

Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step, no levels set
- Browser data: none for this site (a private window, or the site's data cleared)

Pick white at a spot: tap **Pick white**, then tap that spot on the photo; Pick black at a spot the same, with **Pick black**. The color patch is the small mark at the left of each pick button that shows the color picked.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Pick white at the white background just left of the slab, halfway down | The color patch of **Pick white** is filled |
| 2 | Pick black at the card's dark background, up and to the left of the driver's head | A small black and white ring labelled W sits on the white background left of the slab, and one labelled B on the card's dark background. Each letter is white with a dark outline round it, and the W can be read easily on the white background |
| 3 | Press and hold the middle of the photo | The picture shows without levels, the **Before levels** badge at its top left, and no W or B ring |
| 4 | Let go | The levels show again, with the W and B rings |
| 5 | Tap **Auto**, at the bottom of the controls (the block of buttons under the photo) | No W or B ring on the photo |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### LEV-13.2 The W on a white spot has a dark outline   [auto: phone]
Script only
Stand-in: the script reads the screen's pixels in a small box beside each letter and counts the dark ones. Whether at least 20 device pixels round a 12 px letter are dark can't be told by eye; LEV-13.1 is the same mark judged by a person.

Written to ruling R39; it fails until that is built (BUG-231).

Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step, no levels set
- Browser data: none for this site (a private window, or the site's data cleared)

Pick white at a spot: tap **Pick white**, then tap that spot on the photo; Pick black at a spot the same, with **Pick black**. The color patch is the small mark at the left of each pick button that shows the color picked.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Pick white at the white background just left of the slab, halfway down | The color patch of **Pick white** is filled with the background's white (within 3 of 225, 226, 217) |
| 2 | Pick black at the card's dark background, up and to the left of the driver's head | The color patch of **Pick black** is filled with that dark grey (within 3 of 67, 65, 68) |
| 3 | Read the screen just above and to the right of the B's ring | The B's white letter is there: at least 20 device pixels brighter than 200 (on 0 to 255) |
| 4 | Read the screen in the same place beside the W's ring | Dark pixels outline the white W: at least 20 device pixels around the letter are darker than a brightness of 96 (on 0 to 255) |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, the screenshot.

## LEV-14 Auto

**Auto** estimates the white and black points from the framed photo into the draft and removes the pick marks; with no clear black it sets the white point only. Today a pop-up says which it set; ruling R73 takes it away (MSG-16 and MSG-17 hold that).

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#toolAutoLevels`, "Auto set white and black points. Check them, then Apply.", "Auto set the white point (no clear black). Check it, then Apply.", `CONFIG.levels.autoBlackMaxSpread`
- Source: `js/app/levels.js` (`autoLevelsDraft`, `renderSmall`); `js/engine.js` (`autoLevels`)
- Ruling: R73. Auto's pop-up when it works goes, as a pick shows none; its failure message stays. The app differs today. R64. The failure message, "Couldn’t estimate levels from this image.", explains a result that would otherwise look like a fault, so it needs no next step. The app already does this.
- Cases: 3

### LEV-14.1 Auto sets both points and removes the pick marks   [auto: phone]
Whether Auto shows a pop-up is MSG-16.1's (ruling R73); this case doesn't look at it.

Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step, no levels set
- Browser data: none for this site (a private window, or the site's data cleared)

The color patch is the small mark at the left of **Pick white** or **Pick black** that shows the color picked.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Pick white** | No pop-up |
| 2 | Tap the white background just left of the slab, halfway down | The color patch of **Pick white** is filled and a W ring marks the spot |
| 3 | Tap **Auto**, at the bottom of the controls (the block of buttons under the photo; on a wide screen, the panel at the right) | Both color patches are filled |
| 4 | Look at **Apply** and the photo | **Apply** is no longer greyed out (shown dim and not answering a tap); the W ring has gone |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### LEV-14.2 With no clear black, Auto sets the white point only   [auto: phone]
Whether Auto shows a pop-up is MSG-17.1's (ruling R73); this case doesn't look at it.

Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: 13_front_landscape_onetouch_labeled_white.JPEG from samples/ (a card in a labelled one-touch on white, with no neutral black)
- Starting screen: the photo open, on the Levels step, no levels set
- Browser data: none for this site (a private window, or the site's data cleared)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Auto**, at the bottom of the controls (the block of buttons under the photo; on a wide screen, the panel at the right) | The color patch (the small mark at the left of **Pick white** that shows the color picked) of **Pick white** is filled |
| 2 | Look at the color patch of **Pick black** | It is still dashed and empty |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### LEV-14.3 Auto on a picture with nothing to go on warns, with no next step   [auto: phone]

Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: plain-white.png from tests/fixtures/ (1200 × 1600 px, every pixel white, 255, 255, 255)
- Starting screen: the picture open, on the Levels step
- Browser data: none for this site (a private window, or the site's data cleared)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Auto**, at the bottom of the controls (the block of buttons under the photo; on a wide screen, the panel at the right) | A warning reads "Couldn’t estimate levels from this image." |
| 2 | Look at the color patches (the small marks at the left of **Pick white** and **Pick black** that show the color picked) and **Apply** | Both color patches are still dashed and empty; **Apply** is greyed out (shown dim and not answering a tap) |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## LEV-15 Clear

**Clear** makes a draft with neither point and disarms the color picker; with levels applied, **Apply** then removes them. It is off when neither point is set.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#toolClearLevels`, "Clear", "Clear both points (Apply to remove applied levels)"
- Source: `js/app/levels.js` (`clearLevelsDraft`, `syncLevels`)
- Cases: 2

### LEV-15.1 Clear empties both points and disarms the picker   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step, no levels applied
- Browser data: none for this site (a private window, or the site's data cleared)

**Auto** and **Clear** are at the bottom of the controls (the block of buttons under the photo; on a wide screen, the panel at the right).

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at **Clear** | It is greyed out (shown dim and not answering a tap) |
| 2 | Tap **Auto** | **Clear** is no longer greyed out |
| 3 | Tap **Pick white** | **Pick white** is selected (solid white) |
| 4 | Tap **Clear** | Both color patches (the small marks at the left of **Pick white** and **Pick black** that show the color picked) are dashed and empty; neither pick is selected; the photo looks as it did before Auto; **Clear** and **Apply** are greyed out |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### LEV-15.2 Clear, then Apply, removes applied levels as one undo step   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step, no levels applied
- Browser data: none for this site (a private window, or the site's data cleared)

**Auto** and **Clear** are at the bottom of the controls (the block of buttons under the photo; on a wide screen, the panel at the right).

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Auto** | The photo changes |
| 2 | Tap **Apply** | The photo keeps Auto's look; **Apply** is greyed out (shown dim and not answering a tap) |
| 3 | Tap **Clear** | The photo shows without levels; **Apply** is no longer greyed out |
| 4 | Tap **Apply** | The photo stays without levels; **Apply** is greyed out |
| 5 | Tap **Undo** (the arrow curving left, at the top right) | Auto's levels are back on the photo |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## LEV-16 Hold to compare

With no pick armed, press and hold the photo for 250 ms without moving to see it with no levels; letting go ends it. The view doesn't pan meanwhile.

- Risk: medium
- Check: script, touch; phone (Safari's own long-press menu and magnifier)
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.levels.compareHoldMs`, "Hold the photo to compare"
- Source: `js/app/input.js` (`panGesture`, `onPointerMove`, `endGesture`); `js/app/levels.js` (`setCompare`)
- Ruling: R9. Holding does nothing when there is no draft and no applied levels. R10. A press that showed the comparison never also counts as a tap. The app differs today.
- Cases: 6

### LEV-16.1 Holding the photo shows it with no levels until it is let go   [auto: phone, webkit]
Before you start:
- Device and browser: a phone, in its own browser
- Build: the build under test
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step, no levels set; note how the photo looks
- Browser data: none for this site (a private window, or the site's data cleared)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Auto**, at the bottom of the controls (the block of buttons under the photo) | The photo changes |
| 2 | Press and hold the middle of the photo, still, for half a second | After a quarter of a second the photo looks as it did before Auto |
| 3 | Let go | Auto's change is back; the photo has not moved |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### LEV-16.2 With no levels, holding the photo does nothing   [auto: phone]
Written to ruling R9; it fails until that is built (BUG-102).

Before you start:
- Device and browser: a phone, in its own browser
- Build: the build under test
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step, no levels set and none applied
- Browser data: none for this site (a private window, or the site's data cleared)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Press and hold the middle of the photo, still, for half a second | There is no comparison: no **Before levels** badge at the top left of the photo area |
| 2 | Let go | Nothing changes: still no badge |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### LEV-16.3 A press that showed the comparison is not also a tap   [auto: phone]
Script only
Stand-in: the script presses with a dispatched finger, lifts it the moment the comparison shows (under 0.3 s in all) and taps again at once. No person can time a press between 0.25 and 0.3 s.

Written to ruling R10; it fails until that is built (BUG-103).

Before you start:
- Device and browser: a phone-width window with touch, 390 × 844 px
- Build: the build under test
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step, no levels set
- Browser data: none for this site (a private window, or the site's data cleared)

A double tap on the photo fits it to the screen; a single tap does nothing.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Auto**, at the bottom of the controls (the block of buttons under the photo) | The photo changes |
| 2 | Put two fingers on the middle of the photo, 100 px apart, and spread them to 200 px | The photo zooms in; **Fit** shows in the top bar |
| 3 | Press the middle of the photo until the comparison shows, and lift at once (under 0.3 seconds in all) | The comparison showed (the **Before levels** badge) |
| 4 | Straight away, tap the same place once | The photo stays zoomed in: the press and the tap were not a double tap |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### LEV-16.4 A press that moves pans the photo and shows no comparison   [auto: phone]
Before you start:
- Device and browser: a phone, in its own browser
- Build: the build under test
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step, no levels set
- Browser data: none for this site (a private window, or the site's data cleared)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Auto**, at the bottom of the controls (the block of buttons under the photo) | The photo changes |
| 2 | Put a finger on the middle of the photo and at once drag it slowly 60 px to the right over half a second, without lifting | The photo follows the finger to the right; it keeps Auto's look all the way, with no **Before levels** badge |
| 3 | Lift the finger | The photo stays 60 px to the right, with Auto's look |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### LEV-16.5 Moving the finger during the comparison does not pan   [auto: phone]
Before you start:
- Device and browser: a phone, in its own browser
- Build: the build under test
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step, no levels set
- Browser data: none for this site (a private window, or the site's data cleared)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Auto**, at the bottom of the controls (the block of buttons under the photo) | The photo changes |
| 2 | Press and hold the middle of the photo, still, for half a second | The photo looks as it did before Auto, with the **Before levels** badge at the top left of the photo area |
| 3 | Without lifting, slide the finger 60 px to the right | The photo does not move; the comparison stays |
| 4 | Lift the finger | Auto's change is back; the photo is where it was before row 2 |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### LEV-16.6 On an iPhone, holding the photo compares and brings up nothing of Safari's   [phone]
Before you start:
- Device and browser: an iPhone, Safari
- Build: the UAT site, https://rberrill.github.io/p1hunt_card_finisher_uat/
- Photo: IMG_9075.JPEG from samples/, saved to the iPhone's Photos or Files
- Starting screen: the photo open, on the Levels step, no levels set
- Browser data: none for this site (a private window, or the site's data cleared)

Safari's own long press brings up a menu (Copy, Share, Save to Photos), a text magnifier or a blue selection; none of them may take the press from the app.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Auto**, at the bottom of the controls (the block of buttons under the photo) | The photo changes |
| 2 | Put a finger on the middle of the photo and hold it still for two seconds | After a quarter of a second the photo looks as it did before Auto, with the **Before levels** badge at its top left; no menu, magnifier or selection from Safari appears, and the page does not zoom |
| 3 | Lift the finger | Auto's change is back; the badge has gone; nothing is selected and no menu is open |
| 4 | Tap **Pick white** | **Pick white** is selected (solid white) |
| 5 | Put a finger on the white background just left of the slab and hold it still for two seconds | The app's own round magnifier shows in the top right corner of the photo area; no menu, magnifier or selection from Safari appears |
| 6 | Lift the finger | The color patch at the left of **Pick white** (the small mark that shows the color picked) is filled; no menu is open |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot (press the side button and volume up together).

## LEV-17 The Before levels badge

While comparing, a badge reading **Before levels** shows at the top left of the photo.

- Risk: low
- Check: eye
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: "Before levels"
- Source: `js/app/levels.js` (`drawCompareBadge`, `drawLevelsOverlay`, `setCompare`)
- Ruling: R9. With no draft and no applied levels there is no comparison, so no badge. The app differs today. R71. Under reduced motion the **Before levels** badge still fades, the snap rings don't, and one fade is 60 ms. The app already does this.
- Cases: 3

### LEV-17.1 The Before levels badge, for a person to judge   [eye]

Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step, no levels set
- Browser data: none for this site (a private window, or the site's data cleared)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Auto**, at the bottom of the controls (the block of buttons under the photo) | The photo changes |
| 2 | Press and hold the middle of the photo | A dark badge at the top left of the photo area reads "Before levels" in white |
| 3 | Let go | The badge goes |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### LEV-17.2 The badge fades in even when the device asks for less motion   [auto: phone]
Script only
Stand-in: the script asks the browser for reduced motion and records the badge's brightness at every frame as it appears. The fade lasts 80 ms, too short for a person to see whether it is there.


Before you start:
- Device and browser: a phone-width window with touch, 390 × 844 px, with reduced motion asked for
- Build: the build under test
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step, no levels set
- Browser data: none for this site (a private window, or the site's data cleared)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Auto**, at the bottom of the controls (the block of buttons under the photo) | The photo changes |
| 2 | Press and hold the middle of the photo | The **Before levels** badge fades in: in at least one frame its text is part-way between nothing and full white |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### LEV-17.3 With no levels there is no badge   [auto: phone]
Written to ruling R9; it fails until that is built (BUG-102).

Before you start:
- Device and browser: a phone, in its own browser
- Build: the build under test
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step, no levels set and none applied
- Browser data: none for this site (a private window, or the site's data cleared)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Press and hold the middle of the photo for half a second | No **Before levels** badge at the top left of the photo area |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## LEV-18 Leaving the step

Leaving the Levels step disarms the color picker and ends any comparison. The draft is kept.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#levelsPicks`, "Before levels"
- Source: `js/app/shell.js` (`setTab`)
- Cases: 2

### LEV-18.1 Leaving the step disarms the picker and keeps the unapplied changes   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step, no levels set
- Browser data: none for this site (a private window, or the site's data cleared)

The step tabs are the six tabs Perspective to Export, along the bottom on a phone, in the top bar on a wide screen.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Auto**, at the bottom of the controls (the block of buttons under the photo; on a wide screen, the panel at the right) | Both color patches (the small marks at the left of **Pick white** and **Pick black** that show the color picked) are filled |
| 2 | Tap **Pick white** | **Pick white** is selected (solid white) |
| 3 | Tap **Crop** in the step tabs | The Crop step shows; a white dot sits on the **Levels** tab |
| 4 | Tap **Levels** | Neither pick is selected; the line between **Discard** and **Apply** reads "Hold the photo to compare"; **Apply** is not greyed out (shown dim and not answering a tap); both color patches still show Auto's points |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### LEV-18.2 Leaving the step ends a comparison   [auto: desktop]
Before you start:
- Device and browser: a computer with a keyboard; a wide window
- Build: the build under test
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step, no levels set
- Browser data: none for this site (a private window, or the site's data cleared)

The keys 1 to 6 choose the steps, Perspective to Export, and holding C on Levels shows the photo without levels.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Click **Auto**, at the bottom of the panel at the right | The photo changes |
| 2 | Press and hold C | The photo shows without levels, with the **Before levels** badge |
| 3 | Still holding C, press 3 | The Crop step shows, with no **Before levels** badge |
| 4 | Still holding C, press 4 | The Levels step shows the photo with Auto's levels, with no **Before levels** badge |
| 5 | Let go of C | Nothing changes: Auto's levels still show, with no badge |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## LEV-19 Levels never carry over

A newly opened photo starts with no levels and no draft.

- Risk: high
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `.step-tab-mark`, `#btnApplyLevels`
- Source: `js/app/state.js` (`defaultState`, `resetPhotoState`, `openFile`)
- Cases: 1

### LEV-19.1 A newly opened photo has no levels   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photos: IMG_9075.JPEG and 14_front_portrait_raw_white.JPEG from samples/
- Starting screen: IMG_9075.JPEG open, on the Levels step, no levels set
- Browser data: none for this site (a private window, or the site's data cleared)

An unapplied change not carrying over is STA-18.2.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Auto**, at the bottom of the controls (the block of buttons under the photo; on a wide screen, the panel at the right) | The photo changes; a white dot sits on the **Levels** tab |
| 2 | Tap **Apply** | **Apply** is greyed out (shown dim and not answering a tap); the dot has gone |
| 3 | Tap **Open** (the folder at the top left; on a phone it has no label) | The photo picker opens |
| 4 | Choose 14_front_portrait_raw_white.JPEG | The new photo opens on the Perspective step |
| 5 | Tap **Levels** in the step tabs (along the bottom on a phone, in the top bar on a wide screen) | Both color patches (the small marks at the left of **Pick white** and **Pick black** that show the color picked) are dashed and empty; **Apply**, **Discard** and **Clear** are greyed out; there is no dot on the **Levels** tab |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## LEV-20 The draft comes back on Resume

An unapplied draft is saved with the session and comes back on Resume. In a front and back pair each side keeps its own.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `.step-tab-mark`, "Resumed where you left off.", `CONFIG.session.enabled`
- Source: `js/app/adapters.js` (`Session.snapshot`); `js/app/state.js` (`restoreLevelsDraft`, `openFile`); `js/app/pair.js` (`captureSide`, `applySide`)
- Cases: 1

### LEV-20.1 Resume brings back unapplied changes on top of applied levels   [auto: phone, webkit]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step, no levels set
- Browser data: none for this site (a private window, or the site's data cleared)

A draft alone coming back is STA-07.2; each side of a pair keeping its own is PAIR-07.1 and PAIR-40.1. Pick white at a spot: tap **Pick white**, then tap that spot on the photo. The color patch is the small mark at the left of **Pick white** that shows the color picked.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Auto**, at the bottom of the controls (the block of buttons under the photo; on a wide screen, the panel at the right) | The photo changes; the color patch is filled with a near-white; a white dot sits on the **Levels** tab |
| 2 | Tap **Apply** | The dot on the **Levels** tab has gone; **Apply** is greyed out (shown dim and not answering a tap) |
| 3 | Pick white at the card's dark background, up and to the left of the driver's head | The whole photo brightens strongly; the color patch shows that dark grey; **Apply** is no longer greyed out; the dot is back |
| 4 | Reload the page, two seconds or more after row 3 | A box offers "Resume IMG_9075.JPEG?" |
| 5 | Tap **Resume** | The photo opens on the Levels step, brightened strongly as in row 3, with the dark grey in the color patch, **Apply** not greyed out and the dot on the **Levels** tab |
| 6 | Tap **Discard** | The photo is no longer brightened; the color patch shows the near-white of row 1 again; **Apply** is greyed out and the dot has gone |
| 7 | Look at **Clear**, at the bottom of the controls | It is not greyed out: Auto's levels, applied in row 2, came back too |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## LEV-21 Where the picked points land

In the saved file the picked white comes out at 245 and the black at 8, worked out in linear light.

- Risk: medium
- Check: script, saved file
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.levels.whiteTarget`, `CONFIG.levels.blackTarget`
- Source: `js/engine.js` (`levelsLut`)
- Cases: 2

### LEV-21.1 In the saved file the picked white is 245 and the picked black 8   [auto: phone, webkit]
Before you start:
- Device and browser: any; a phone-width or a wide window, with downloads saved to a folder you can open
- Build: the build under test
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step, no levels set; in Export, the default settings (2000, JPEG)
- Browser data: none for this site (a private window, or the site's data cleared)

Pick white at a spot: tap **Pick white**, then tap that spot on the photo; Pick black at a spot the same, with **Pick black**. The color patch is the small mark at the left of each pick button that shows the color picked. The saved file's color at a spot is the average color of a square 12 px a side centered on it, read in any image editor.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Pick white at the white background just left of the slab, halfway down | The color patch of **Pick white** is filled |
| 2 | Pick black at the card's dark background, up and to the left of the driver's head | The color patch of **Pick black** is filled |
| 3 | Tap **Apply** | **Apply** is greyed out (shown dim and not answering a tap); there is no dot on the **Levels** tab |
| 4 | Tap **Export** in the step tabs (along the bottom on a phone, in the top bar on a wide screen) | The Export step shows, with **Download** |
| 5 | Tap **Download** | A question box (the box over the dimmed photo, with a question and buttons) asks "Upscale to 2000 px?" |
| 6 | Tap **No** | A file named IMG_9075-straight.jpg is saved |
| 7 | Open the file and read the color where the white was picked | 245, 245, 245, each within 4 |
| 8 | Read the color where the black was picked | 8, 8, 8, each within 4 |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot, and the saved file.

### LEV-21.3 A grey between the points lands where linear light puts it   [auto: phone, webkit]
Before you start:
- Device and browser: any; a phone-width or a wide window, with downloads saved to a folder you can open
- Build: the build under test
- Photo: levels-two-greys.png from tests/fixtures/ (400 × 560 px: the left half grey 128, 128, 128, the right half grey 32, 32, 32)
- Starting screen: the picture open, on the Levels step (the app says "Nothing detected. Drag the corners into place." on Perspective; leave the corners where they are); in Export, the default settings (2000, JPEG)
- Browser data: none for this site (a private window, or the site's data cleared)

With the white point picked on grey 128 and placed at 245, every value is turned to linear light, scaled by the same factor (245 over 128 in linear light), and turned back, by the standard sRGB formula. Grey 32 then lands at 70. Scaling the stored values instead would put it at 61. Pick white at a spot: tap **Pick white**, then tap that spot on the photo. The color patch is the small mark at the left of **Pick white** that shows the color picked.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Pick white at the middle of the left half of the picture | The color patch of **Pick white** is filled with a mid grey; the left half turns near-white and the right half lightens to a dark grey |
| 2 | Tap **Apply** | **Apply** is greyed out (shown dim and not answering a tap); there is no dot on the **Levels** tab |
| 3 | Tap **Export** in the step tabs (along the bottom on a phone, in the top bar on a wide screen) | The Export step shows, with **Download** |
| 4 | Tap **Download** | A question box (the box over the dimmed photo, with a question and buttons) asks "Upscale to 2000 px?" |
| 5 | Tap **No** | A file named levels-two-greys-straight.jpg is saved |
| 6 | Open the file and read the color in the middle of its left half | 245, 245, 245, each within 3 |
| 7 | Read the color in the middle of its right half | 70, 70, 70, each within 3: not 61 |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot, and the saved file.

## LEV-22 The one-line instruction

The instruction between **Discard** and **Apply** reads "Pick white, or try Auto", "Tap something white" or "Tap something black" while a pick is armed, or "Hold the photo to compare" while there are levels to compare against. Screen readers announce it, it is rewritten only when it changes, and it can't be tapped.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#levelsHint`, "Pick white, or try Auto", "Hold the photo to compare"
- Source: `js/app/levels.js` (`buildLevelsLine`, `levelsHint`, `syncLevels`); `css/app.css` (`.levels-hint`)
- Cases: 2

### LEV-22.1 The instruction between Discard and Apply   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step, no levels set
- Browser data: none for this site (a private window, or the site's data cleared)

The instruction is the text in the line above the controls (the one line of text at the top of the block of buttons under the photo), between **Discard** and **Apply**. **Auto** and **Clear** are at the bottom of the controls.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the instruction | It reads "Pick white, or try Auto" |
| 2 | Tap **Pick white** | It reads "Tap something white" |
| 3 | Tap **Pick black** | It reads "Tap something black" |
| 4 | Tap **Pick black** again | It reads "Pick white, or try Auto" |
| 5 | Tap **Auto** | It reads "Hold the photo to compare" |
| 6 | Tap **Clear** | It reads "Pick white, or try Auto" |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### LEV-22.2 The instruction is announced, rewritten only when it changes, and lets taps through   [auto: phone]
Script only
Stand-in: the script reads the line's role for screen readers and the style that lets taps pass through it, and counts every time its words are written. None of these shows on screen.

Before you start:
- Device and browser: a phone-width window with touch, 390 × 844 px
- Build: the build under test
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step, no levels set
- Browser data: none for this site (a private window, or the site's data cleared)

The instruction is the text between **Discard** and **Apply**. **Auto** is at the bottom of the controls (the block of buttons under the photo).

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Read the instruction | It reads "Pick white, or try Auto"; screen readers are told it is a status line; taps pass through it |
| 2 | Tap **Pick white** | It reads "Tap something white"; its words have been written once since row 1 |
| 3 | Tap **Pick black** | It reads "Tap something black"; written twice since row 1 |
| 4 | Tap **Pick black** again | It reads "Pick white, or try Auto"; written three times |
| 5 | Tap **Auto** | It reads "Hold the photo to compare"; written four times |
| 6 | Tap **Auto** again | It still reads "Hold the photo to compare", and has not been written again: still four times |

Pass: every row's result is seen.
On a fail, record: the row number, what the script recorded instead.

## LEV-23 The sheet is the tips

The options sheet, titled **Levels tips**, holds only the tips: no options, no Tips row and no reset.

- Risk: low
- Check: script
- Layout: both. On a wide screen the tips show in the side panel, followed by the keyboard help under **Tips and keys**.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#levelsSheet`, "Levels tips", "Tips and keys"
- Source: `js/app/levels.js` (`buildLevelsSheet`)
- Ruling: R74. On a wide screen Levels shows one heading, "Tips and keys", holding the tips then the keys. The app differs today.
- Cases: 2

### LEV-23.1 The options sheet is the tips alone   [auto: phone]

Before you start:
- Device and browser: any; a phone-width window
- Build: the build under test
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step
- Browser data: none for this site (a private window, or the site's data cleared)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap the options tab (the small tab with an up arrow on the top edge of the controls, the block of buttons under the photo) | A sheet titled "Levels tips" rises, with three tips: "White: tap a grading label or the card’s white border; avoid foil and reflections. Black is optional.", "Auto estimates both from the framed image; colored backdrops can fool it, so check the result." and "Hold the photo to compare with no levels. Clear, then Apply, removes levels."; no options, no switches, no Tips row, no reset and no keyboard help |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### LEV-23.2 On a wide screen the tips are followed by the keyboard help   [auto: desktop]
How many headings show over them is TOP-32.2's (ruling R74); this case looks at the order only.

Before you start:
- Device and browser: a computer; a wide window
- Build: the build under test
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step
- Browser data: none for this site (a private window, or the site's data cleared)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the side panel under the controls | The three tips of LEV-23.1, then "Hold C, or press and hold the photo, to compare." under the heading TIPS AND KEYS |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## LEV-24 Only Apply is an undo step

Only **Apply** adds an undo step. Arming a pick, the picks themselves, **Auto**, **Clear**, **Discard** and comparing do not.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnApplyLevels`, `#btnUndo`
- Source: `js/app/levels.js` (`setDraft`, `applyLevels`, `discardLevels`)
- Cases: 1

### LEV-24.1 Only Apply adds an undo step   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step, nothing changed yet (**Undo** at the top right is greyed out: shown dim and not answering a tap)
- Browser data: none for this site (a private window, or the site's data cleared)

Pick white at a spot: tap **Pick white**, then tap that spot on the photo; Pick black at a spot the same, with **Pick black**. The color patch is the small mark at the left of each pick button that shows the color picked. **Auto** and **Clear** are at the bottom of the controls (the block of buttons under the photo; on a wide screen, the panel at the right).

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Pick white at the white background just left of the slab | The color patch of **Pick white** is filled; **Undo** is still greyed out |
| 2 | Pick black at the card's dark background, up and to the left of the driver's head | The color patch of **Pick black** is filled; **Undo** is still greyed out |
| 3 | Tap **Clear** | Both color patches are dashed and empty; **Undo** is still greyed out |
| 4 | Tap **Auto** | The photo changes; **Undo** is still greyed out |
| 5 | Press and hold the middle of the photo | The photo shows without levels, with the **Before levels** badge; **Undo** is still greyed out |
| 6 | Let go | Auto's levels show again; **Undo** is still greyed out |
| 7 | Tap **Discard** | The photo shows without levels; **Undo** is still greyed out |
| 8 | Tap **Auto** | **Apply** is no longer greyed out; **Undo** is still greyed out |
| 9 | Tap **Apply** | **Undo** is no longer greyed out |
| 10 | Tap **Undo** (the arrow curving left, at the top right) | The levels are gone; **Undo** is greyed out again |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.
