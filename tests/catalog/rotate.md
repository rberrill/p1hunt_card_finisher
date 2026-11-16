# Rotate

The second step: straightening the photo by a fine angle, quarter turns, flips and Fill frame.

## ROT-01 The angle

The line above the controls shows **Straighten** and the angle with one decimal, such as −3.5°, with a true minus sign and never −0.0°.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#rotateAngleText`, "Straighten"
- Source: `js/app/rotate.js` (`angleText`, `syncRotate`)
- Cases: 1

### ROT-01.1 The angle reads with one decimal and a true minus sign   [auto: all]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Rotate step (tap **Rotate** in the step bar)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the line above the ruler | It reads STRAIGHTEN, then 0.0° with a pencil after it |
| 2 | Tap the angle (**0.0°**) | A text box takes the angle's place, with 0.0 in it, selected |
| 3 | Type -3.5 | The box shows -3.5 |
| 4 | Tap **Done** | The angle reads −3.5°: one decimal, and a long minus sign (−), not a short hyphen (-) |
| 5 | Tap the angle (**−3.5°**) | The text box opens, with −3.5 in it, selected |
| 6 | Type -0.04 | The box shows -0.04 |
| 7 | Tap **Done** | The angle reads 0.0°, with no minus sign |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## ROT-02 The Straighten ruler

Drag the ruler to straighten the photo, from −45° to +45° in 0.1° steps. It has a tick per degree, longer every fifth, and follows the finger one to one (11 px per degree; dragging right lowers the angle). One drag is one undo step.

- Risk: high
- Check: script, touch
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#fine`, `CONFIG.rotate.fineRangeDeg`, `CONFIG.rotate.fineStepDeg`, "Straighten angle in degrees"
- Source: `js/app/rotate.js` (`buildFineRuler`, `bindRotate`, `setFine`); `js/app/parts/ruler.js` (`buildRuler`, `buildRulerScale`, `bindRulerDrag`)
- Cases: 2

### ROT-02.1 Dragging the ruler turns the photo, one undo step per drag   [auto: all]
Before you start:
- Device and browser: any; a phone-width window (drag with a finger) or a wide window (drag with the mouse)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Rotate step, the angle at 0.0°

The ruler is the row of ticks under the angle. A drag starts on the ruler and moves sideways only.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Drag the ruler 22 px (two ticks) to the left, and let go | The angle reads 2.0°; the photo has turned 2° clockwise |
| 2 | Drag the ruler 11 px (one tick) to the left, and let go | The angle reads 3.0° |
| 3 | Tap **Undo** (the arrow curving left, at the top right) | The angle reads 2.0°: only the second drag is undone |
| 4 | Tap **Undo** again | The angle reads 0.0° |
| 5 | Drag the ruler 33 px (three ticks) to the right, and let go | The angle reads −3.0° |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### ROT-02.2 The ruler's scale, for a person to judge   [eye]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Rotate step, the angle at 0.0°

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the ruler | Short ticks, one per degree, and a taller tick every fifth; a white upright pointer in the middle stands on a tall tick |
| 2 | Drag the ruler 22 px (two ticks) to the left, and let go | The angle reads 2.0°; the scale has slid left, and the pointer stands on the second short tick to the right of a tall tick |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## ROT-03 The angle's limits

However it is set, the angle is kept within ±45° and rounded to 0.1°.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.rotate.fineRangeDeg`, `CONFIG.rotate.fineStepDeg`
- Source: `js/app/rotate.js` (`setFine`)
- Cases: 1

### ROT-03.1 The angle stays within ±45° and is rounded to 0.1°   [auto: all]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Rotate step, the angle at 0.0°

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap the angle (**0.0°**) | A text box takes the angle's place, with 0.0 in it, selected |
| 2 | Type 50 | The box shows 50 |
| 3 | Tap **Done** | The angle reads 45.0° |
| 4 | Tap the angle (**45.0°**) | The text box opens, with 45.0 in it, selected |
| 5 | Type 2.36 | The box shows 2.36 |
| 6 | Tap **Done** | The angle reads 2.4° |
| 7 | Drag the ruler 500 px to the left (well past its end), and let go | The angle reads 45.0° |
| 8 | Drag the ruler 1000 px to the right, and let go | The angle reads −45.0° |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## ROT-04 Tap the angle to type it

The angle, with a pencil after it, is a button: tapping it puts a text box in its place, filled with the angle and selected, which brings up the number keypad on a phone.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#rotateAngle`, `#rotateAngleField`, "Type the angle", "Angle in degrees"
- Source: `js/app/rotate.js` (`buildStraightenLine`, `startTyping`, `bindTyping`)
- Cases: 1

### ROT-04.1 Tapping the angle opens a box to type it in   [auto: all]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Rotate step, the angle at 0.0°

The number keypad on a real iPhone is checked in ROT-09.1.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap the angle (**0.0°**, with a pencil after it; its tooltip reads "Type the angle") | A text box takes the angle's place, with 0.0 in it, selected |
| 2 | Type -3.5 | The box shows -3.5 |
| 3 | Tap **Done** | The angle reads −3.5° |
| 4 | Tap the angle (**−3.5°**) | A text box takes its place, with −3.5 in it, all of it selected (highlighted); the pencil has gone |
| 5 | Type 1 | The box shows only 1: the typing replaced the whole angle |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## ROT-05 ± and Done

While typing, **Reset** gives way to **±** and **Done**. **±** changes the sign of the typed angle and leaves the cursor at the end.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnAngleSign`, `#btnAngleDone`, "Change the sign"
- Source: `js/app/rotate.js` (`showTypingControls`, `toggleTypedSign`, `bindTyping`)
- Cases: 1

### ROT-05.1 ± changes the sign of the typed angle and Done saves it   [auto: all]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Rotate step, the angle at 0.0°

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the right end of the line above the ruler | **Reset** is there; there is no **±** and no **Done** |
| 2 | Tap the angle (**0.0°**) | A text box takes the angle's place; **±** and **Done** take Reset's place |
| 3 | Type 3.5 | The box shows 3.5 |
| 4 | Tap **±** (its tooltip reads "Change the sign") | The box shows −3.5, with the cursor after the 5 |
| 5 | Type 2 | The box shows −3.52: the 2 went at the end |
| 6 | Tap **±** | The box shows 3.52 |
| 7 | Tap **Done** | The angle reads 3.5°; **Reset** is back, and **±** and **Done** have gone |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## ROT-06 Save the typed angle

**Done** or Enter saves the typed angle as its own undo step, kept within ±45° and rounded to 0.1°.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnAngleDone`, `key:Enter`
- Source: `js/app/rotate.js` (`stopTyping`, `bindTyping`, `setFine`)
- Ruling: R1. An empty or unreadable entry keeps the old angle, with no undo step. The app differs today.
- Cases: 3

### ROT-06.1 Done saves the typed angle as one undo step   [auto: all]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Rotate step, the angle at 0.0°, nothing changed yet (**Undo** at the top right is greyed out)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap the angle (**0.0°**) | A text box takes the angle's place, with 0.0 in it, selected |
| 2 | Type 7.5 | The box shows 7.5 |
| 3 | Tap **Done** | The angle reads 7.5°; the photo has turned 7.5° clockwise |
| 4 | Tap **Undo** (the arrow curving left, at the top right) | The angle reads 0.0°; **Undo** is greyed out again |
| 5 | Tap **Redo** (the arrow curving right, beside Undo) | The angle reads 7.5° |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### ROT-06.2 Enter saves the typed angle   [auto: desktop]
Before you start:
- Device and browser: a computer with a keyboard; a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Rotate step, the angle at 0.0°

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Click the angle (**0.0°**) | A text box takes the angle's place, with 0.0 in it, selected |
| 2 | Type 4 | The box shows 4 |
| 3 | Press Enter | The box closes; the angle reads 4.0° |
| 4 | Click **Undo** (the arrow curving left, at the top right) | The angle reads 0.0° |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### ROT-06.3 Done on an empty box keeps the angle   [auto: all]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Rotate step, the angle at 0.0°, nothing changed yet

Written to ruling R1; it fails until R1 is built (BUG-002).

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap the angle (**0.0°**) | A text box takes the angle's place, with 0.0 in it, selected |
| 2 | Type 5 | The box shows 5 |
| 3 | Tap **Done** | The angle reads 5.0° |
| 4 | Tap the angle (**5.0°**) | The text box opens, with 5.0 in it, selected |
| 5 | Press the delete key (Backspace on a keyboard, ⌫ on a phone's keypad) | The box is empty |
| 6 | Tap **Done** | The angle still reads 5.0° |
| 7 | Tap **Undo** (the arrow curving left, at the top right) | The angle reads 0.0°: the empty Done added no undo step |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## ROT-07 Close the box without saving

Escape, a tap anywhere else, choosing **Straighten** or **Flip**, or leaving the step closes the text box without saving.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `key:Escape`, `#rotateAngleField`
- Source: `js/app/rotate.js` (`bindTyping`, `setRotateMode`, `syncRotate`, `stopTyping`)
- Flag: to confirm. Tapping away from the box throws the typed angle away; only Done or Enter save it.
- Cases: 4

### ROT-07.1 Escape closes the box without saving   [auto: desktop]
Flag: to confirm. Written to today's behavior.

Before you start:
- Device and browser: a computer with a keyboard; a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Rotate step, the angle at 0.0°, nothing changed yet (**Undo** at the top right is greyed out)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Click the angle (**0.0°**) | A text box takes the angle's place, with 0.0 in it, selected |
| 2 | Type 9 | The box shows 9 |
| 3 | Press Escape | The box closes; the angle reads 0.0°; **Undo** is still greyed out |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### ROT-07.2 A tap on the photo closes the box without saving   [auto: all]
Flag: to confirm. Written to today's behavior: the typed 9 is thrown away.

Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Rotate step, the angle at 0.0°, nothing changed yet (**Undo** at the top right is greyed out)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap the angle (**0.0°**) | A text box takes the angle's place, with 0.0 in it, selected |
| 2 | Type 9 | The box shows 9 |
| 3 | Tap the middle of the photo | The box closes; the angle reads 0.0°; **Undo** is still greyed out |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### ROT-07.3 Choosing Flip or Straighten closes the box without saving   [auto: all]
Flag: to confirm. Written to today's behavior: the typed 9 is thrown away.

Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Rotate step, the angle at 0.0°, nothing changed yet (**Undo** at the top right is greyed out)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap the angle (**0.0°**) | A text box takes the angle's place, with 0.0 in it, selected |
| 2 | Type 9 | The box shows 9 |
| 3 | Tap **Flip** in the row of tools | The line above reads FLIP and "as you see it on screen" |
| 4 | Tap **Straighten** in the row of tools | The line reads STRAIGHTEN and 0.0° |
| 5 | Tap the angle (**0.0°**) | The text box opens, with 0.0 in it, selected |
| 6 | Type 9 | The box shows 9 |
| 7 | Tap **Straighten** in the row of tools | The box closes; the angle reads 0.0°; **Undo** is still greyed out |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### ROT-07.4 Leaving the step closes the box without saving   [auto: all]
Flag: to confirm. Written to today's behavior: the typed 9 is thrown away.

Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Rotate step, the angle at 0.0°, nothing changed yet (**Undo** at the top right is greyed out)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap the angle (**0.0°**) | A text box takes the angle's place, with 0.0 in it, selected |
| 2 | Type 9 | The box shows 9 |
| 3 | Tap **Crop** in the step bar | The Crop step shows |
| 4 | Tap **Rotate** in the step bar | The box is closed; the angle reads 0.0°; **Undo** is still greyed out |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## ROT-08 What the box accepts

The box accepts a hyphen or a true minus sign, a decimal comma and a trailing °. An empty or unreadable entry is read as 0.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#rotateAngleField`
- Source: `js/app/rotate.js` (`readTypedAngle`)
- Ruling: R1. An empty or unreadable entry keeps the old angle, with no undo step. The app differs today.
- Cases: 3

### ROT-08.1 The box accepts a hyphen or a true minus sign   [auto: all]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Rotate step, the angle at 0.0°

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap the angle (**0.0°**) | A text box takes the angle's place, with 0.0 in it, selected |
| 2 | Type -2.5, with a hyphen (the short dash on a keyboard) | The box shows -2.5 |
| 3 | Tap **Done** | The angle reads −2.5° |
| 4 | Tap the angle (**−2.5°**) | The text box opens, with −2.5 in it, selected |
| 5 | Type −4 with a true minus sign (copy it from here: −) | The box shows −4 |
| 6 | Tap **Done** | The angle reads −4.0° |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### ROT-08.2 The box accepts a decimal comma and a degree sign   [auto: all]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Rotate step, the angle at 0.0°

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap the angle (**0.0°**) | A text box takes the angle's place, with 0.0 in it, selected |
| 2 | Type 1,5 (with a comma) | The box shows 1,5 |
| 3 | Tap **Done** | The angle reads 1.5° |
| 4 | Tap the angle (**1.5°**) | The text box opens, with 1.5 in it, selected |
| 5 | Type 6° (with the degree sign; copy it from here: °) | The box shows 6° |
| 6 | Tap **Done** | The angle reads 6.0° |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### ROT-08.3 An unreadable entry keeps the angle   [auto: all]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Rotate step, the angle at 0.0°, nothing changed yet

Written to ruling R1; it fails until R1 is built (BUG-002).

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap the angle (**0.0°**) | A text box takes the angle's place, with 0.0 in it, selected |
| 2 | Type 5 | The box shows 5 |
| 3 | Tap **Done** | The angle reads 5.0° |
| 4 | Tap the angle (**5.0°**) | The text box opens, with 5.0 in it, selected |
| 5 | Type abc | The box shows abc |
| 6 | Tap **Done** | The angle still reads 5.0° |
| 7 | Tap **Undo** (the arrow curving left, at the top right) | The angle reads 0.0°: abc added no undo step |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## ROT-09 The angle rises above the keyboard

While the on-screen keyboard is up, the angle's line rises to sit on top of the keyboard, and a gap holds its place so the ruler doesn't move.

- Risk: medium
- Check: phone
- Layout: phone. On a wide screen the line stays where it is.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#rotateStraightenLine`, `#rotateLiftGap`
- Source: `js/app/rotate.js` (`placeTypingRow`, `bindTyping`)
- Cases: 2

### ROT-09.1 The angle's line rises above the keypad on an iPhone   [phone]
Before you start:
- Device and browser: an iPhone, Safari
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/ (AirDrop it to the phone or save it to Photos first)
- Starting screen: the photo open, on the Rotate step, the angle at 0.0°

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap the angle (**0.0°**, with a pencil after it) | A text box takes its place with 0.0 selected, and the number keypad comes up: digits and a decimal point, no minus key |
| 2 | Look at the STRAIGHTEN line | It sits directly on top of the keypad, with the box, **±** and **Done** in it, nothing hidden behind the keypad |
| 3 | Look at the ruler | It has not moved: it is where it was before you tapped, with an empty band above it where the line was |
| 4 | Type 2 | The box shows 2 |
| 5 | Tap **±** | The box shows −2; the keypad stays up |
| 6 | Tap **Done** | The keypad goes down; the line is back in its place above the ruler, and the angle reads −2.0° |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot (press the side button and volume up together).

### ROT-09.2 On a wide screen the line stays in place while typing   [auto: desktop]
Before you start:
- Device and browser: a computer; a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Rotate step, the angle at 0.0°

The script checks only the wide screen; a phone's keypad is ROT-09.1.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Note where the STRAIGHTEN line and the ruler are | The line is at the top of the panel on the right, with the ruler under it |
| 2 | Click the angle (**0.0°**) | A text box takes the angle's place; the line and the ruler stay exactly where they were, with no gap opening between them |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## ROT-10 Reset the angle

**Reset**, at the right of the angle's line, sets the angle to 0° as its own undo step. It is off at 0°.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnRotateReset`, "Angle to 0°"
- Source: `js/app/rotate.js` (`buildStraightenLine`, `bindRotate`, `syncRotate`)
- Flag: to confirm. This Reset sets only the angle, while **Reset rotation** in the options sheet also clears turns, flips and Fill frame; neither changes Grid.
- Cases: 1

### ROT-10.1 Reset sets the angle to 0° as one undo step   [auto: all]
Flag: to confirm. Written to today's behavior: Reset leaves the quarter turn.

Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Rotate step, the angle at 0.0°

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at **Reset**, at the right end of the line above the ruler | It is greyed out (its tooltip reads "Angle to 0°") |
| 2 | Tap **90° right** in the row of tools | The photo lies on its side, wider than tall |
| 3 | Tap the angle (**0.0°**) | A text box takes the angle's place, with 0.0 in it, selected |
| 4 | Type 4 | The box shows 4 |
| 5 | Tap **Done** | The angle reads 4.0°; **Reset** is no longer greyed out |
| 6 | Tap **Reset** | The angle reads 0.0° and **Reset** is greyed out again; the photo still lies on its side |
| 7 | Tap **Undo** (the arrow curving left, at the top right) | The angle reads 4.0° |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## ROT-11 Straighten

**Straighten** is the resting mode: it shows the angle and the ruler.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#toolStraighten`, `#rotateRulerRow`
- Source: `js/app/rotate.js` (`setRotateMode`, `bindRotate`, `syncRotate`)
- Cases: 1

### ROT-11.1 Straighten is the resting mode   [auto: all]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Rotate step for the first time since the page was loaded

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the row of tools and the lines above it | **Straighten** is selected (a solid white button) and **Flip** is not; above them are the STRAIGHTEN line and the ruler |
| 2 | Tap **Flip** | **Flip** is selected instead of **Straighten**; the ruler has gone |
| 3 | Tap **Straighten** | **Straighten** is selected again; the STRAIGHTEN line and the ruler are back |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## ROT-12 Flip

**Flip** swaps in the Flip line (**Flip**, "as you see it on screen") and two buttons, **Horizontal** and **Vertical**.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#toolFlip`, `#rotateFlipLine`, "as you see it on screen"
- Source: `js/app/rotate.js` (`buildFlipLine`, `buildFlipRow`, `setRotateMode`, `syncRotate`)
- Cases: 1

### ROT-12.1 Flip shows its line and the Horizontal and Vertical buttons   [auto: all]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Rotate step, with **Straighten** selected

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Flip** in the row of tools | The line above reads FLIP and "as you see it on screen", in place of STRAIGHTEN and the angle |
| 2 | Look under that line | Two buttons, **Horizontal** and **Vertical**, neither of them white; no ruler |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## ROT-13 Horizontal

**Horizontal** mirrors the photo left to right as seen on screen, as one undo step. The button is lit white while that flip is on.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnFlipHorizontal`, "Horizontal"
- Source: `js/app/rotate.js` (`flip`, `bindRotate`, `syncFlipButton`)
- Cases: 1

### ROT-13.1 Horizontal mirrors the photo left to right   [auto: all]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Rotate step, nothing changed yet (**Undo** at the top right is greyed out)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Flip** in the row of tools | **Horizontal** and **Vertical** show, neither of them white |
| 2 | Tap **Horizontal** | The photo is mirrored left to right: the grading label is still at the top but its writing reads backwards; **Horizontal** is solid white |
| 3 | Tap **Undo** (the arrow curving left, at the top right) | The photo is as it was, the label reading normally; **Horizontal** is no longer white; **Undo** is greyed out |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## ROT-14 Vertical

**Vertical** mirrors the photo top to bottom as seen on screen, as one undo step. The button is lit white while that flip is on.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnFlipVertical`, "Vertical"
- Source: `js/app/rotate.js` (`flip`, `bindRotate`, `syncFlipButton`)
- Cases: 1

### ROT-14.1 Vertical mirrors the photo top to bottom   [auto: all]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Rotate step, nothing changed yet (**Undo** at the top right is greyed out)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Flip** in the row of tools | **Horizontal** and **Vertical** show, neither of them white |
| 2 | Tap **Vertical** | The photo is mirrored top to bottom: the grading label is now at the bottom, its writing upside down; **Vertical** is solid white |
| 3 | Tap **Undo** (the arrow curving left, at the top right) | The photo is as it was, the label at the top; **Vertical** is no longer white; **Undo** is greyed out |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## ROT-15 A flip mirrors what you see

A flip mirrors the picture exactly as it looks on screen: it reverses the sign of the straighten angle and the direction of any quarter turns, and mirrors a crop box drawn by hand.

- Risk: medium
- Check: script, saved file
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnFlipHorizontal`, `#btnFlipVertical`, "Flip mirrors the photo as you see it on screen."
- Source: `js/app/rotate.js` (`flip`)
- Flag: to confirm. A flip changes the sign of the angle shown: 3.0° reads −3.0° after **Horizontal**.
- Cases: 4

### ROT-15.1 Horizontal mirrors a tilted, turned photo as seen   [auto: all]
Flag: to confirm. Written to today's behavior: the angle shown changes sign.

Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Rotate step, the angle at 0.0°

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap the angle (**0.0°**) | A text box takes the angle's place, with 0.0 in it, selected |
| 2 | Type 3 | The box shows 3 |
| 3 | Tap **Done** | The angle reads 3.0° |
| 4 | Tap **90° right** in the row of tools | The photo lies on its side, its top edge at the right |
| 5 | Take a screenshot | You have the picture as it looks now |
| 6 | Tap **Flip**, then **Horizontal** | The picture is the screenshot's mirror image left to right: what was at the left is at the right, at the same height, with the same tilt mirrored |
| 7 | Tap **Straighten** | The angle reads −3.0° |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### ROT-15.2 Vertical mirrors a tilted, turned photo as seen   [auto: all]
Flag: to confirm. Written to today's behavior: the angle shown changes sign.

Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Rotate step, the angle at 0.0°

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap the angle (**0.0°**) | A text box takes the angle's place, with 0.0 in it, selected |
| 2 | Type 3 | The box shows 3 |
| 3 | Tap **Done** | The angle reads 3.0° |
| 4 | Tap **90° right** in the row of tools | The photo lies on its side, its top edge at the right |
| 5 | Take a screenshot | You have the picture as it looks now |
| 6 | Tap **Flip**, then **Vertical** | The picture is the screenshot's mirror image top to bottom: what was at the top is at the bottom, at the same distance from the left, with the same tilt mirrored |
| 7 | Tap **Straighten** | The angle reads −3.0° |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### ROT-15.3 A flip mirrors a crop box drawn by hand   [auto: all]
Before you start:
- Device and browser: any; a phone-width window (drag with a finger) or a wide window (drag with the mouse)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Rotate step, nothing changed yet

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Crop** in the step bar | The Crop step shows a crop box around the card |
| 2 | Tap **3:4** in the row of sizes | The box becomes an upright rectangle, narrower than tall, centered on the card |
| 3 | Drag the box from its middle 30 px to the right, and let go | The box has moved to the right of the card's middle |
| 4 | Tap **Rotate** in the step bar | A dashed box shows the crop, to the right of the card's middle |
| 5 | Tap **Flip**, then **Horizontal** | The photo is mirrored, and the dashed box with it: it is now as far left of the card's middle as it was right, over the same part of the card |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### ROT-15.4 The saved picture is mirrored too   [auto: all]
Before you start:
- Device and browser: any; a phone-width or a wide window, with downloads saved to a folder you can open
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Rotate step, nothing changed yet

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Export** in the step bar | The Export step shows **Download** |
| 2 | Tap **Download** | A question card asks "Upscale to 2000 px?" |
| 3 | Tap **No** | A file named IMG_9136-straight.jpg is saved |
| 4 | Tap **Rotate** in the step bar | The Rotate step shows |
| 5 | Tap **Flip**, then **Horizontal** | The photo is mirrored left to right |
| 6 | Tap **Export** in the step bar | The Export step shows |
| 7 | Tap **Download** | The same question card asks "Upscale to 2000 px?" |
| 8 | Tap **No** | A second file is saved |
| 9 | Open the two files side by side | The second is the first one mirrored left to right, the same size |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot, and the two files.

## ROT-16 90° left

**90° left** turns the photo a quarter turn counterclockwise, as one undo step.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#toolRotateLeft`, "90° left", "Rotate 90° left"
- Source: `js/app/rotate.js` (`turn`, `bindRotate`)
- Cases: 1

### ROT-16.1 90° left turns the photo a quarter turn counterclockwise   [auto: all]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Rotate step, nothing changed yet (**Undo** at the top right is greyed out)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **90° left** in the row of tools | The photo lies on its side, wider than tall, its top edge (the grading label) at the left |
| 2 | Tap **Undo** (the arrow curving left, at the top right) | The photo stands upright again, the label at the top; **Undo** is greyed out |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## ROT-17 90° right

**90° right** turns the photo a quarter turn clockwise, as one undo step.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#toolRotateRight`, "90° right", "Rotate 90° right"
- Source: `js/app/rotate.js` (`turn`, `bindRotate`)
- Cases: 1

### ROT-17.1 90° right turns the photo a quarter turn clockwise   [auto: all]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Rotate step, nothing changed yet (**Undo** at the top right is greyed out)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **90° right** in the row of tools | The photo lies on its side, wider than tall, its top edge (the grading label) at the right |
| 2 | Tap **Undo** (the arrow curving left, at the top right) | The photo stands upright again, the label at the top; **Undo** is greyed out |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## ROT-18 A quarter turn carries the crop

A quarter turn takes a crop box drawn by hand round with the photo, so it stays on the same part of the picture, and switches the crop between portrait and landscape.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#toolRotateLeft`, `#toolRotateRight`
- Source: `js/app/rotate.js` (`turn`)
- Cases: 1

### ROT-18.1 A quarter turn carries a crop box drawn by hand   [auto: all]
Before you start:
- Device and browser: any; a phone-width window (drag with a finger) or a wide window (drag with the mouse)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Rotate step, nothing changed yet

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Crop** in the step bar | The Crop step shows a crop box around the card |
| 2 | Tap **3:4** in the row of sizes | The box becomes an upright rectangle, narrower than tall |
| 3 | Drag the box from its middle 30 px down, and let go | The box has moved down the card |
| 4 | Tap **Rotate** in the step bar | A dashed box shows the crop, over the lower part of the card |
| 5 | Tap **90° right** in the row of tools | The photo lies on its side, and the dashed box has turned with it: wider than tall now, over the same part of the card as before |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## ROT-19 Fill frame

**Fill frame** zooms the crop in until a tilted photo leaves no empty corners. It is part of the edits, and each change is one undo step.

- Risk: medium
- Check: script, saved file
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#toolFillFrame`, "Fill frame: no empty corners", "Fill frame zooms in so a tilted photo leaves no empty corners."
- Source: `js/app/rotate.js` (`bindRotate`, `syncRotate`); `js/engine.js` (`placeCrop`, `shrinkToValid`)
- Cases: 2

### ROT-19.1 Fill frame leaves no empty corners in the saved image   [auto: all]
Before you start:
- Device and browser: any; a phone-width or a wide window, with downloads saved to a folder you can open
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Rotate step, the angle at 0.0°, **Fill frame** reading Off; in Export's options, **Fill outside photo** is White (the default)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap the angle (**0.0°**) | A text box takes the angle's place, with 0.0 in it, selected |
| 2 | Type 10 | The box shows 10 |
| 3 | Tap **Done** | The angle reads 10.0°; inside the dashed box, white wedges show at two corners where the tilted photo ends |
| 4 | Tap **Fill frame** in the row of tools | It reads On; the dashed box is smaller, with photo in all four of its corners |
| 5 | Tap **Export** in the step bar | The Export step shows **Download** |
| 6 | Tap **Download** | A question card asks "Upscale to 2000 px?" |
| 7 | Tap **No** | A file named IMG_9136-straight.jpg is saved |
| 8 | Open the file and look at its four corners | Each corner shows the photo; none is plain white |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot, and the saved file.

### ROT-19.2 Fill frame is a switch, and each change is one undo step   [auto: all]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Rotate step, nothing changed yet (**Undo** at the top right is greyed out)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at **Fill frame** in the row of tools | It reads Off |
| 2 | Tap **Fill frame** | It reads On; the dashed box gets smaller |
| 3 | Tap **Undo** (the arrow curving left, at the top right) | **Fill frame** reads Off; the dashed box is its old size; **Undo** is greyed out |
| 4 | Tap **Redo** (the arrow curving right, beside Undo) | **Fill frame** reads On |
| 5 | Tap **Fill frame** | It reads Off |
| 6 | Tap **Undo** | **Fill frame** reads On: only the last tap was undone |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## ROT-20 Grid

**Grid** in the options sheet lays a 48 px grid over the photo, on this step only. It is on by default and never exported.

- Risk: low
- Check: eye
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#rotateGrid`, "Grid", `CONFIG.rotate.gridPx`, "The grid is a guide; it is never exported."
- Source: `js/app/rotate.js` (`bindRotate`, `syncRotate`); `js/app/view.js` (`drawRotateGuides`); `js/app/core.js` (the `app` object's defaults)
- Cases: 2

### ROT-20.1 The grid, for a person to judge   [eye]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Rotate step for the first time since the page was loaded

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the photo | Faint lines in squares of about 48 px cover the whole photo area; the middle of the grid sits on the middle of the picture |
| 2 | Tap **Crop** in the step bar | No grid lines on the Crop step |
| 3 | Tap **Rotate** in the step bar | The grid is back |
| 4 | Tap the **Options** tab (the tab with an up arrow on the top edge of the controls) | **Rotate options** rise from the bottom; **Grid** is switched on |
| 5 | Tap the **Grid** switch | It switches off |
| 6 | Tap the **×** at the top right of Rotate options | The options go down; no grid lines on the photo, and the dashed box is still there |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### ROT-20.2 The grid is never exported   [auto: all]
Before you start:
- Device and browser: any; a phone-width or a wide window, with downloads saved to a folder you can open
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Rotate step, with **Grid** on (the default)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Export** in the step bar, then **Download** | A question card asks "Upscale to 2000 px?" |
| 2 | Tap **No** | A file named IMG_9136-straight.jpg is saved, with no grid lines in it |
| 3 | Tap **Rotate** in the step bar | The photo shows with the grid over it |
| 4 | Open **Rotate options**: on a phone, tap the **Options** tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls | The **Grid** switch is on |
| 5 | Tap the **Grid** switch | It switches off; the grid lines go |
| 6 | Tap **Export** in the step bar, then **Download** | The same question card asks "Upscale to 2000 px?" |
| 7 | Tap **No** | A second file is saved |
| 8 | Open the two files side by side | They are the same picture, pixel for pixel |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot, and the two files.

## ROT-21 The crop shown on Rotate

On this step the crop shows as a dashed white box over the photo.

- Risk: low
- Check: eye
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: none
- Source: `js/app/view.js` (`drawRotateGuides`, `drawResult`)
- Cases: 1

### ROT-21.1 The crop on Rotate, for a person to judge   [eye]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Rotate step, the angle at 0.0°

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the photo | A dashed white square around the card in its holder |
| 2 | Tap the angle (**0.0°**) | A text box takes the angle's place, with 0.0 in it, selected |
| 3 | Type 10 | The box shows 10 |
| 4 | Tap **Done** | The angle reads 10.0°; the photo is tilted, and the dashed square stays square to the screen, around the card |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## ROT-22 Reset rotation

**Reset rotation** in the options sheet clears the quarter turns, the angle, **Fill frame** and both flips, as one undo step.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#rotateResetRow`, "Reset rotation"
- Source: `js/app/rotate.js` (`buildResetRow`); `js/app/shell.js` (`bindControls`, `resetStep`)
- Flag: to confirm. **Reset rotation** clears turns, flips and Fill frame as well as the angle, while **Reset** beside the angle clears only the angle; neither changes Grid.
- Cases: 2

### ROT-22.1 Reset rotation clears turns, angle, flips and Fill frame in one step   [auto: all]
Flag: to confirm. Written to today's behavior.

Before you start:
- Device and browser: any; a phone-width window (drag with a finger) or a wide window (drag with the mouse)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Rotate step, nothing changed yet

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Drag the ruler 66 px (six ticks) to the left, and let go | The angle reads 6.0° |
| 2 | Tap **90° right** in the row of tools | The photo lies on its side |
| 3 | Tap **Fill frame** | It reads On |
| 4 | Tap **Flip**, then **Horizontal** | The photo is mirrored; **Horizontal** is solid white |
| 5 | Open **Rotate options**: on a phone, tap the **Options** tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls | **Grid** and **Reset rotation** show |
| 6 | Tap **Reset rotation** | The photo stands upright, level and not mirrored |
| 7 | Close the options with the **×** at their top right (on a wide screen there is nothing to close) | **Fill frame** reads Off; **Horizontal** is not white |
| 8 | Tap **Straighten** | The angle reads 0.0° |
| 9 | Tap **Undo** (the arrow curving left, at the top right) | Everything comes back at once: the photo on its side and mirrored, **Fill frame** On, and the angle reading −6.0° (the flip changed its sign, see ROT-15) |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### ROT-22.2 Reset rotation leaves Grid as it is   [auto: all]
Flag: to confirm. Written to today's behavior.

Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Rotate step, with **Grid** on (the default)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Open **Rotate options**: on a phone, tap the **Options** tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls | The **Grid** switch is on |
| 2 | Tap the **Grid** switch | It switches off |
| 3 | Tap **Reset rotation** | The **Grid** switch is still off |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## ROT-23 Kept for the session

The Straighten or Flip mode and **Grid** stay as set when another photo is opened. They are not saved and are not undo steps.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#toolStraighten`, `#toolFlip`, `#rotateGrid`
- Source: `js/app/rotate.js` (`setRotateMode`, `bindRotate`); `js/app/core.js` (the `app` object's defaults)
- Flag: to confirm. They survive opening a new photo but not a reload.
- Cases: 2

### ROT-23.1 Flip and Grid stay as set for the next photo   [auto: all]
Flag: to confirm. Written to today's behavior.

Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photos: IMG_9136.JPEG and IMG_9075.JPEG from samples/
- Starting screen: IMG_9136.JPEG open, on the Rotate step for the first time since the page was loaded, nothing changed yet (**Undo** at the top right is greyed out)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Flip** in the row of tools | **Flip** is selected (solid white); **Undo** stays greyed out |
| 2 | Open **Rotate options**: on a phone, tap the **Options** tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls | The **Grid** switch is on |
| 3 | Tap the **Grid** switch, then close the options (on a phone, the **×** at their top right) | Grid is off: no grid lines on the photo; **Undo** stays greyed out |
| 4 | Tap **Open** (the folder at the top left; on a phone it has no label) and choose IMG_9075.JPEG | The new photo opens |
| 5 | Tap **Rotate** in the step bar | **Flip** is selected, with the FLIP line; no grid lines on the photo |
| 6 | Open **Rotate options** | The **Grid** switch is off |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### ROT-23.2 Flip and Grid are not kept after a reload   [auto: all]
Flag: to confirm. Written to today's behavior.

Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Rotate step for the first time since the page was loaded

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Flip** in the row of tools | **Flip** is selected (solid white) |
| 2 | Open **Rotate options**: on a phone, tap the **Options** tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls | The **Grid** switch is on |
| 3 | Tap the **Grid** switch, then close the options (on a phone, the **×** at their top right) | Grid is off: no grid lines on the photo |
| 4 | Wait two seconds, then reload the page | The start screen offers to resume IMG_9136.JPEG, with **Resume** and **Start fresh** |
| 5 | Tap **Resume** | The photo opens |
| 6 | Tap **Rotate** in the step bar | **Straighten** is selected, with the STRAIGHTEN line and the ruler; grid lines show over the photo |
| 7 | Open **Rotate options** | The **Grid** switch is on |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.
