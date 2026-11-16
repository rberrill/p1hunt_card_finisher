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
- Starting screen: the photo open, on the Levels step (tap **Levels** in the step bar), nothing changed yet (**Undo** at the top right is greyed out)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at **Discard**, at the left of the line above the controls | It is greyed out; there is no dot on the **Levels** tab |
| 2 | Tap **Auto** in the row of tools | The photo changes (its whites brighten and its darks deepen); **Discard** is no longer greyed out; a white dot sits on the **Levels** tab |
| 3 | Tap **Discard** | The photo looks as it did before Auto; both swatches (the small circles in **Pick white** and **Pick black**) are empty again; **Discard** and **Apply** are greyed out; the dot has gone; **Undo** is still greyed out |

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
- Starting screen: the photo open, on the Levels step, nothing changed yet (**Undo** at the top right is greyed out)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at **Apply**, the red button at the right of the line above the controls | It is greyed out |
| 2 | Tap **Auto** in the row of tools | The photo changes; **Apply** is no longer greyed out |
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

Perspective's **Preview** is PER-27.4 and the saved file EXP-32.2.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Crop** in the step bar | The Crop step shows the photo; note how it looks |
| 2 | Tap **Levels**, then **Auto** in the row of tools | The photo changes |
| 3 | Tap **Crop** | The photo looks as it did in row 1, without Auto's change; a white dot sits on the **Levels** tab |
| 4 | Tap **Levels** | The photo shows Auto's change again |

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

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Auto** in the row of tools, then **Apply** | **Apply** and **Discard** are greyed out; no dot on the **Levels** tab |
| 2 | Tap **Auto** again | Auto sets the same points as before: **Apply** and **Discard** stay greyed out, and no dot shows |

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
- Flag: to confirm. Escape never disarms the color picker.
- Cases: 2

### LEV-05.1 Pick white arms the picker, and a second tap disarms it   [auto: phone]
Flag: to confirm. Written to today's behavior.

Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Pick white** | **Pick white** is selected (solid white); the line between **Discard** and **Apply** reads "Tap something white" |
| 2 | Tap **Pick white** again | **Pick white** is no longer white; the line reads "Pick white, or try Auto" |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### LEV-05.2 Escape leaves Pick white armed   [auto: desktop]
Flag: to confirm. Written to today's behavior: Escape does not disarm the picker.

Before you start:
- Device and browser: a computer with a keyboard; a wide window
- Build: the build under test
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Click **Pick white** | **Pick white** is selected; the line reads "Tap something white" |
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

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Pick black** | **Pick black** is selected (solid white); the line reads "Tap something black" |
| 2 | Tap **Pick white** | **Pick white** is selected instead, **Pick black** is not; the line reads "Tap something white" |
| 3 | Tap **Pick black**, then **Pick black** again | Neither is selected; the line reads "Pick white, or try Auto" |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## LEV-07 The color swatches

A small swatch leads each pick button: dashed and empty until set, then the picked color. Its tooltip reads "Not set" or "RGB" and the three values.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#swatchWhite`, `#swatchBlack`, "Not set", "RGB "
- Source: `js/app/levels.js` (`buildPickRow`, `syncLevels`); `js/app/parts/segmented-control.js` (`buildSwatch`, `updateSwatch`)
- Cases: 1

### LEV-07.1 The swatches read Not set, then the picked color   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window (on a phone, read a tooltip in a desktop browser's developer tools, or skip that part)
- Build: the build under test
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step, no levels set

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the small circles at the left of **Pick white** and **Pick black** | Both are dashed and empty; each one's tooltip reads "Not set" |
| 2 | Tap **Pick white**, then the white background just left of the slab, halfway down | The white swatch is filled with that white; its tooltip reads "RGB" and three values within 3 of 225, 226, 217; the black swatch still reads "Not set" |
| 3 | Tap **Pick black**, then the card's dark background, up and to the left of the driver's head | The black swatch is filled with that dark grey; its tooltip reads "RGB" and three values within 3 of 67, 65, 68 |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## LEV-08 Aim and pick

With a pick armed, a press on the photo aims, and the color is taken where the finger or pointer lifts. The photo doesn't pan.

- Risk: high
- Check: script, touch
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: "Tap something white", "Tap something black", `CONFIG.levels.sampleRadiusPx`
- Source: `js/app/input.js` (`stepGesture`, `onPointerMove`, `endGesture`); `js/app/levels.js` (`pickAt`)
- Ruling: R8. A second finger cancels the pick and leaves the color picker armed. The app differs today.
- Flag: to confirm. While a pick is armed one finger can't pan, and the color is taken where the finger lifts, not where it pressed.
- Cases: 2

### LEV-08.1 The color is taken where the finger lifts, and the photo does not move   [auto: phone, webkit]
Flag: to confirm. Written to today's behavior.

Before you start:
- Device and browser: an iPhone, or a phone-width window (drag with a finger)
- Build: the build under test
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step, no levels set

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Pick white** | **Pick white** is selected |
| 2 | Put a finger on the white background just left of the slab, slide it onto the card's dark background, up and to the left of the driver's head, and lift it there | The white swatch shows the dark grey where the finger lifted (within 3 of 67, 65, 68), not the white where it pressed; the photo has not moved under the finger |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### LEV-08.2 A second finger cancels the pick and leaves the picker armed   [auto: phone]
Written to ruling R8; it fails until that is built (BUG-101).

Before you start:
- Device and browser: an iPhone, or a phone-width window with touch
- Build: the build under test
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step, no levels set

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Pick white** | **Pick white** is selected; the line reads "Tap something white" |
| 2 | Put one finger on the white background just left of the slab, then a second finger on the photo 80 px to its right; lift the second finger, then the first | No white point is set: the white swatch still reads "Not set" |
| 3 | Look at the picks and the line | **Pick white** is still selected and the line still reads "Tap something white" |

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

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Pick white**, then put a finger on the white background just left of the slab and slide it 10 px down, without lifting | A round magnifier in the top right corner of the photo area shows that spot 4 times larger, with a small white circle (the patch the pick reads) in its middle and a white rim |
| 2 | Lift the finger | The magnifier goes; the white swatch is filled |
| 3 | Tap **Pick white**, then put a finger on the white background just right of the slab and slide it 10 px down, without lifting | The magnifier is in the top left corner of the photo area |
| 4 | Lift the finger | The magnifier goes |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### LEV-09.2 The picker's magnifier beside the mouse, for a person to judge   [eye]
Before you start:
- Device and browser: a computer with a mouse; a wide window, 1280 × 800 px
- Build: the build under test
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step, no levels set

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Click **Pick white**, then press the mouse button on the white background just left of the slab and move 10 px down, without letting go | A round magnifier up and to the right of the pointer shows that spot 4 times larger, with a small white circle in its middle and a white rim |
| 2 | Let go | The magnifier goes |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## LEV-10 How a pick samples the photo

A pick averages a small patch of the full-resolution photo under the point (4 screen px in radius, never less than 4 photo px), leaving out the darkest and the brightest quarter of its pixels.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.levels.sampleRadiusPx`, `CONFIG.levels.sampleTrim`
- Source: `js/app/levels.js` (`pickAt`); `js/engine.js` (`meanColor`)
- Cases: 2

### LEV-10.1 A pick leaves out the darkest and brightest pixels of its patch   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step, no levels set

The reference color is worked out from the photo file itself: the square patch of the full-size photo reaching 4 screen px (about 9 photo px on a phone) each way from the point, with the half of its pixels farthest in brightness from the patch's middle brightness left out, averaged in linear light. (The code keeps the half nearest the median; for an even patch that is the same as leaving out the darkest and the brightest quarter.) The script does this in the page; a person can do it in an image editor.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Work out the reference color, and the plain mean of the same patch, at the card's left edge, halfway down | They differ by more than 4 in at least one channel: the patch takes in the card and the slab around it |
| 2 | Tap **Pick white**, then that spot | The white swatch's tooltip gives the reference color, each value within 1, not the plain mean |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### LEV-10.2 A pick reads at least 4 photo pixels around the point   [auto: phone]
Before you start:
- Device and browser: any; a phone-width window
- Build: the build under test
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the app opened from a link that ends `index.html?levels.sampleRadiusPx=1` (a sampling circle of 1 screen px), the photo open, on the Levels step, no levels set

The reference colors are worked out as in LEV-10.1, for a patch reaching 4 photo px each way, and for one reaching 1 screen px (about 2.3 photo px on a phone).

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Work out both reference colors at the card's left edge, halfway down | 1 screen px is under 4 photo px, and the two colors differ by more than 1 in at least one channel |
| 2 | Tap **Pick white**, then that spot | The white swatch's tooltip gives the 4 photo px color, each value within 1 |

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

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Pick white**, then the white background just left of the slab, halfway down | The white swatch shows the background's white (within 3 of 225, 226, 217) |
| 2 | Look at the spot you tapped | A small ring labelled W marks it (how it looks is LEV-13.1) |
| 3 | Look at the picks and the line above them | Neither pick is selected; the line reads "Hold the photo to compare"; **Apply** is no longer greyed out |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## LEV-12 A pick that can't work

A pick that can't work shows a warning and leaves the color picker armed: a spot outside the photo; a white not at least 20 brighter than the black point; a black brighter than 100 (on a scale of 0 to 255); a black not at least 20 darker than the white point. A tap on the dark area around the visible picture, where the step hides the rest of the photo, is ignored and leaves the picker armed.

- Risk: medium
- Check: script, touch
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: "That spot is outside the photo.", "That spot is darker than the black point. Pick something brighter.", "That spot is too light to be a black point. ", `CONFIG.levels.maxBlackLuma`
- Source: `js/app/levels.js` (`pickAt`, `pickProblem`)
- Ruling: R38. A tap outside the visible picture is ignored and the pick stays armed. The app differs today.
- Cases: 5

### LEV-12.1 A tap outside the photo warns and stays armed   [auto: phone]
Before you start:
- Device and browser: any; a phone-width window (drag with a finger)
- Build: the build under test
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step, no levels set and no pick selected

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Drag the middle of the photo 200 px to the right | The photo moves 200 px right; the empty area past its left edge shows at the left of the photo area |
| 2 | Tap **Pick white**, then that empty area, 15 px in from the left edge of the photo area | A warning reads "That spot is outside the photo." |
| 3 | Look at the picks, the line and the white swatch | **Pick white** is still selected, the line still reads "Tap something white", and the white swatch still reads "Not set" |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### LEV-12.2 A black pick on something light warns and stays armed   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step, no levels set

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Pick black**, then the white background just left of the slab, halfway down | A warning reads "That spot is too light to be a black point. Pick something dark, or skip the black point." |
| 2 | Look at the picks, the line and the black swatch | **Pick black** is still selected, the line still reads "Tap something black", and the black swatch still reads "Not set" |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### LEV-12.3 A white pick no brighter than the black point warns and stays armed   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step, no levels set

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Pick black**, then the card's dark background, up and to the left of the driver's head | The black swatch shows that dark grey |
| 2 | Tap **Pick white**, then the same dark spot | A warning reads "That spot is darker than the black point. Pick something brighter." |
| 3 | Look at the picks, the line and the white swatch | **Pick white** is still selected, the line still reads "Tap something white", and the white swatch still reads "Not set" |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### LEV-12.4 A black pick no darker than the white point warns and stays armed   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step, no levels set

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Pick white**, then the card's dark background, up and to the left of the driver's head | The white swatch shows that dark grey: with no black point set, any white pick works |
| 2 | Tap **Pick black**, then the same dark spot | A warning reads "That spot is brighter than the white point. Pick something darker." |
| 3 | Look at the picks, the line and the black swatch | **Pick black** is still selected, the line still reads "Tap something black", and the black swatch still reads "Not set" |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### LEV-12.5 A tap on the empty area below the picture is ignored and the pick stays armed   [auto: phone]
Written to ruling R38; it fails until that is built (BUG-230). On the Levels step the photo shows only inside the crop; the dark area around it hides the rest of the photo, and a tap there must not take a color from it.

Before you start:
- Device and browser: any; a phone-width window
- Build: the build under test
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step, no levels set

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Pick white** | **Pick white** is selected and the line reads "Tap something white" |
| 2 | Tap the dark empty area 40 px below the middle of the picture's bottom edge | The white swatch still reads "Not set" |
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

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Pick white**, then the white background just left of the slab, halfway down | The white swatch is filled |
| 2 | Tap **Pick black**, then the card's dark background, up and to the left of the driver's head | A small black and white ring labelled W sits on the white background left of the slab, and one labelled B on the card's dark background. Each letter is white with a dark outline round it, and the W can be read easily on the white background |
| 3 | Press and hold the middle of the photo | The picture shows without levels, the **Before levels** badge at its top left, and no W or B ring |
| 4 | Let go, then tap **Auto** in the row of tools | No W or B ring on the photo |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### LEV-13.2 The W on a white spot has a dark outline   [auto: phone]
Written to ruling R39; it fails until that is built (BUG-231).

Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with the developer tools open
- Build: the build under test
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step, no levels set

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Pick white**, then the white background just left of the slab, halfway down | The white swatch shows the background's white (within 3 of 225, 226, 217) |
| 2 | Tap **Pick black**, then the card's dark background, up and to the left of the driver's head | The black swatch shows that dark grey (within 3 of 67, 65, 68) |
| 3 | Zoom a screenshot in on the B, just above and to the right of its ring | The B's white letter is there |
| 4 | Zoom the screenshot in on the W in the same place beside its ring | Dark pixels outline the white W: at least 20 device pixels around the letter are darker than a brightness of 96 (on 0 to 255) |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, the zoomed screenshot.

## LEV-14 Auto

**Auto** estimates the white and black points from the framed photo into the draft and removes the pick marks; with no clear black it sets the white point only. A pop-up says which it set.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#toolAutoLevels`, "Auto set white and black points. Check them, then Apply.", "Auto set the white point (no clear black). Check it, then Apply.", `CONFIG.levels.autoBlackMaxSpread`
- Source: `js/app/levels.js` (`autoLevelsDraft`, `renderSmall`); `js/engine.js` (`autoLevels`)
- Flag: to confirm. Auto shows a pop-up when it works, though arming a pick shows none; when it fails, "Couldn’t estimate levels from this image." gives no next step.
- Cases: 3

### LEV-14.1 Auto sets both points, says so, and removes the pick marks   [auto: phone]
Flag: to confirm. Written to today's behavior: a pop-up for Auto, none for a pick.

Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step, no levels set

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Pick white** | No pop-up |
| 2 | Tap the white background just left of the slab, halfway down | The white swatch is filled and a W ring marks the spot |
| 3 | Tap **Auto** in the row of tools | A pop-up reads "Auto set white and black points. Check them, then Apply." |
| 4 | Look at the swatches, **Apply** and the photo | Both swatches are filled; **Apply** is no longer greyed out; the W ring has gone |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### LEV-14.2 With no clear black, Auto sets the white point only   [auto: phone]
Flag: to confirm. Written to today's behavior.

Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: 13_front_landscape_onetouch_labeled_white.JPEG from samples/ (a card in a labelled one-touch on white, with no neutral black)
- Starting screen: the photo open, on the Levels step, no levels set

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Auto** in the row of tools | A pop-up reads "Auto set the white point (no clear black). Check it, then Apply." |
| 2 | Look at the swatches | The white swatch is filled; the black swatch still reads "Not set" |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### LEV-14.3 Auto on a picture with nothing to go on warns, with no next step   [auto: phone]
Flag: to confirm. Written to today's behavior: the warning says what went wrong but not what to do.

Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: a plain white PNG picture, 1200 × 1600 px, every pixel 255, 255, 255 (any image editor can make one; the script draws it)
- Starting screen: the picture open, on the Levels step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Auto** in the row of tools | A warning reads "Couldn’t estimate levels from this image." |
| 2 | Look at the swatches and **Apply** | Both swatches still read "Not set"; **Apply** is greyed out |

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

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at **Clear** in the row of tools | It is greyed out |
| 2 | Tap **Auto**, then **Pick white** | **Clear** is no longer greyed out; **Pick white** is selected |
| 3 | Tap **Clear** | Both swatches read "Not set"; neither pick is selected; the photo looks as it did before Auto; **Clear** and **Apply** are greyed out |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### LEV-15.2 Clear, then Apply, removes applied levels as one undo step   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step, no levels applied

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Auto**, then **Apply** | The photo shows Auto's levels; **Apply** is greyed out |
| 2 | Tap **Clear** in the row of tools | The photo shows without levels; **Apply** is no longer greyed out |
| 3 | Tap **Apply** | The photo stays without levels; **Apply** is greyed out |
| 4 | Tap **Undo** (the arrow curving left, at the top right) | Auto's levels are back on the photo |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## LEV-16 Hold to compare

With no pick armed, press and hold the photo for 250 ms without moving to see it with no levels; letting go ends it. The view doesn't pan meanwhile.

- Risk: medium
- Check: script, touch
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.levels.compareHoldMs`, "Hold the photo to compare"
- Source: `js/app/input.js` (`panGesture`, `onPointerMove`, `endGesture`); `js/app/levels.js` (`setCompare`)
- Ruling: R9. Holding does nothing when there is no draft and no applied levels. R10. A press that showed the comparison never also counts as a tap. The app differs today.
- Cases: 3

### LEV-16.1 Holding the photo shows it with no levels until it is let go   [auto: phone, webkit]
Before you start:
- Device and browser: an iPhone, or a phone-width window with touch
- Build: the build under test
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step, no levels set; note how the photo looks

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Auto** in the row of tools | The photo changes |
| 2 | Press and hold the middle of the photo, still, for half a second | After a quarter of a second the photo looks as it did before Auto |
| 3 | Let go | Auto's change is back; the photo has not moved |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### LEV-16.2 With no levels, holding the photo does nothing   [auto: phone]
Written to ruling R9; it fails until that is built (BUG-102).

Before you start:
- Device and browser: an iPhone, or a phone-width window with touch
- Build: the build under test
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step, no levels set and none applied

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Press and hold the middle of the photo, still, for half a second, then let go | Nothing changes: there is no comparison (no **Before levels** badge) |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### LEV-16.3 A press that showed the comparison is not also a tap   [auto: phone]
Written to ruling R10; it fails until that is built (BUG-103).

Before you start:
- Device and browser: an iPhone, or a phone-width window with touch
- Build: the build under test
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step, no levels set

A double tap on the photo fits it to the screen; a single tap does nothing. The script times the press exactly; by hand, aim for just over a quarter of a second.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Auto** in the row of tools | The photo changes |
| 2 | Put two fingers on the middle of the photo, 100 px apart, and spread them to 200 px | The photo zooms in; **Fit** shows in the top bar |
| 3 | Press the middle of the photo until the comparison shows, and lift at once (under 0.3 seconds in all) | The comparison showed (the **Before levels** badge) |
| 4 | Straight away, tap the same place once | The photo stays zoomed in: the press and the tap were not a double tap |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## LEV-17 The Before levels badge

While comparing, a badge reading **Before levels** shows at the top left of the photo.

- Risk: low
- Check: eye
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: "Before levels"
- Source: `js/app/levels.js` (`drawCompareBadge`, `drawLevelsOverlay`, `setCompare`)
- Ruling: R9. With no draft and no applied levels there is no comparison, so no badge. The app differs today.
- Flag: to confirm. The badge fades in over 80 ms even when the device asks for reduced motion.
- Cases: 3

### LEV-17.1 The Before levels badge, for a person to judge   [eye]
Flag: to confirm. Written to today's behavior.

Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step, no levels set

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Auto** in the row of tools | The photo changes |
| 2 | Press and hold the middle of the photo | A dark badge at the top left of the photo area reads "Before levels" in white |
| 3 | Let go | The badge goes |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### LEV-17.2 The badge fades in even when the device asks for less motion   [auto: phone]
Flag: to confirm. Written to today's behavior.

Before you start:
- Device and browser: a phone-width window, with reduced motion asked for (on an iPhone, Settings > Accessibility > Motion > Reduce Motion; the script emulates it)
- Build: the build under test
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step, no levels set

The fade lasts 80 ms; the script records the badge frame by frame.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Auto** in the row of tools | The photo changes |
| 2 | Press and hold the middle of the photo | The **Before levels** badge fades in: in at least one frame its text is part-way between nothing and full white |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### LEV-17.3 With no levels there is no badge   [auto: phone]
Written to ruling R9; it fails until that is built (BUG-102).

Before you start:
- Device and browser: an iPhone, or a phone-width window with touch
- Build: the build under test
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step, no levels set and none applied

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Press and hold the middle of the photo for half a second | No **Before levels** badge |

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

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Auto** in the row of tools, then **Pick white** | **Pick white** is selected |
| 2 | Tap **Crop** in the step bar | The Crop step shows; a white dot sits on the **Levels** tab |
| 3 | Tap **Levels** | Neither pick is selected; the line reads "Hold the photo to compare"; **Apply** is no longer greyed out; Auto's points are still in the swatches |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### LEV-18.2 Leaving the step ends a comparison   [auto: desktop]
Before you start:
- Device and browser: a computer with a keyboard; a wide window
- Build: the build under test
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step, no levels set

The keys 1 to 6 choose the steps, and holding C compares (KEY entries).

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Click **Auto** in the row of tools | The photo changes |
| 2 | Press and hold C | The photo shows without levels, with the **Before levels** badge |
| 3 | Still holding C, press 3 | The Crop step shows; the comparison has ended |
| 4 | Still holding C, press 4 | The Levels step shows the photo with Auto's levels, not the comparison |
| 5 | Let go of C | Nothing changes |

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

An unapplied change not carrying over is STA-18.2.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Auto** in the row of tools, then **Apply** | The levels are applied; **Apply** is greyed out |
| 2 | Tap **Open** (the folder at the top left) and choose 14_front_portrait_raw_white.JPEG | The new photo opens on the Perspective step |
| 3 | Tap **Levels** in the step bar | Both swatches read "Not set"; **Apply**, **Discard** and **Clear** are greyed out; there is no dot on the **Levels** tab |

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
- Device and browser: any; a phone-width or a wide window, in a private window
- Build: the build under test
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step, no levels set

A draft alone coming back is STA-07.2; each side of a pair keeping its own is PAIR-07.1 and PAIR-40.1.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Auto** in the row of tools, then **Apply**; note the white swatch's tooltip | The levels are applied |
| 2 | Tap **Pick white**, then the white background just left of the slab, halfway down | The white swatch shows a different white; **Apply** is no longer greyed out; a white dot sits on the **Levels** tab |
| 3 | Wait two seconds, then reload the page | The card offers "Resume IMG_9075.JPEG?" |
| 4 | Tap **Resume** | The photo opens on the Levels step, with the white picked in row 2, **Apply** not greyed out and the dot on the **Levels** tab |
| 5 | Tap **Discard** | The white swatch shows Auto's white noted in row 1: the applied levels came back too |

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

The saved file's color at a spot is read as the pick reads the photo (LEV-10.1), from a patch of 6 px each way.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Pick white**, then the white background just left of the slab, halfway down | The white swatch is filled |
| 2 | Tap **Pick black**, then the card's dark background, up and to the left of the driver's head | The black swatch is filled |
| 3 | Tap **Apply** | Both points are applied |
| 4 | Tap **Export** in the step bar, then **Download** | A question card asks "Upscale to 2000 px?" |
| 5 | Tap **No** | A file named IMG_9075-straight.jpg is saved |
| 6 | Open the file and read the color where the white was picked | 245, 245, 245, each within 4 |
| 7 | Read the color where the black was picked | 8, 8, 8, each within 4 |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot, and the saved file.

### LEV-21.2 Levels never change the logo   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window, with downloads saved to a folder you can open
- Build: the build under test
- Photo: IMG_9075.JPEG from samples/
- Logo: icon.svg from the app's icons/ folder (a red P and a white 1 on matte black)
- Starting screen: the photo open, on the Levels step, no levels set, no logo

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Overlay** in the step bar, then **Add logo**, and choose icon.svg | The logo sits in the middle of the picture |
| 2 | Tap **Export**, then **Download**; answer **No** to "Upscale to 2000 px?" | A first file is saved |
| 3 | Tap **Levels**; tap **Pick white**, then the card's dark background, up and to the left of the driver's head; tap **Apply** | The whole photo brightens strongly: that dark grey is now the white |
| 4 | Tap **Export**, then **Download**; answer **No** | A second file is saved |
| 5 | Open both files and read the color of the card's dark background | First file: within 4 of 67, 65, 68; second file: 245, 245, 245, each within 4 |
| 6 | Read the logo's matte black, the red of its P and the white of its 1 in both files | The same in both files (each value within 4), and the logo's own colors: 22, 22, 24; 229, 50, 45; 255, 255, 255 (each within 10) |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot, and the two files.

## LEV-22 The one-line instruction

The instruction between **Discard** and **Apply** reads "Pick white, or try Auto", "Tap something white" or "Tap something black" while a pick is armed, or "Hold the photo to compare" while there are levels to compare against. Screen readers announce it, it is rewritten only when it changes, and it can't be tapped.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#levelsHint`, "Pick white, or try Auto", "Hold the photo to compare"
- Source: `js/app/levels.js` (`buildLevelsLine`, `levelsHint`, `syncLevels`); `css/app.css` (`.levels-hint`)
- Cases: 1

### LEV-22.1 The instruction between Discard and Apply   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window (the announcing and the rewrites are read with a browser's developer tools)
- Build: the build under test
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step, no levels set

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the line between **Discard** and **Apply** | It reads "Pick white, or try Auto"; it is a status line that screen readers announce, and taps go through it |
| 2 | Tap **Pick white** | It reads "Tap something white" |
| 3 | Tap **Pick black** | It reads "Tap something black" |
| 4 | Tap **Pick black** again, then **Auto** in the row of tools | It reads "Hold the photo to compare"; its words have been written four times since row 1 |
| 5 | Tap **Auto** again | It still reads "Hold the photo to compare", and has not been written again |
| 6 | Tap **Clear** | It reads "Pick white, or try Auto" |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## LEV-23 The sheet is the tips

The options sheet, titled **Levels tips**, holds only the tips: no options, no Tips row and no reset.

- Risk: low
- Check: script
- Layout: both. On a wide screen the tips show in the side panel, followed by the keyboard help under **Tips and keys**.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#levelsSheet`, "Levels tips", "Tips and keys"
- Source: `js/app/levels.js` (`buildLevelsSheet`)
- Flag: to confirm. On a wide screen the Levels section shows two tips headings, "Levels tips" and "Tips and keys".
- Cases: 2

### LEV-23.1 The options sheet is the tips alone   [auto: phone]
Flag: to confirm. Written to today's behavior; the two headings show only on a wide screen (LEV-23.2).

Before you start:
- Device and browser: any; a phone-width window
- Build: the build under test
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap the **Options** tab (the tab with an up arrow on the top edge of the controls) | A sheet titled "Levels tips" rises, with three tips: "White: tap a grading label or the card’s white border; avoid foil and reflections. Black is optional.", "Auto estimates both from the framed image; colored backdrops can fool it, so check the result." and "Hold the photo to compare with no levels. Clear, then Apply, removes levels."; no options, no switches, no Tips row, no reset and no keyboard help |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### LEV-23.2 On a wide screen the tips are followed by the keyboard help   [auto: desktop]
Flag: to confirm. Written to today's behavior: two headings.

Before you start:
- Device and browser: a computer; a wide window
- Build: the build under test
- Photo: IMG_9075.JPEG from samples/
- Starting screen: the photo open, on the Levels step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the side panel under the controls | LEVELS TIPS with the three tips of LEV-23.1, then TIPS AND KEYS with "Hold C, or press and hold the photo, to compare." |

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
- Starting screen: the photo open, on the Levels step, nothing changed yet (**Undo** at the top right is greyed out)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Pick white**, then the white background just left of the slab | The white swatch is filled; **Undo** is still greyed out |
| 2 | Tap **Pick black**, then the card's dark background, up and to the left of the driver's head | The black swatch is filled; **Undo** is still greyed out |
| 3 | Tap **Auto**, **Clear**, then **Auto** again in the row of tools | **Undo** is still greyed out |
| 4 | Press and hold the middle of the photo, then let go | The comparison shows and ends; **Undo** is still greyed out |
| 5 | Tap **Discard** | **Undo** is still greyed out |
| 6 | Tap **Auto**, then **Apply** | **Undo** is no longer greyed out |
| 7 | Tap **Undo** (the arrow curving left, at the top right) | The levels are gone; **Undo** is greyed out again |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.
