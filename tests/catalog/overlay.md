# Overlay (logo)

Placing a logo or watermark on the framed photo: adding it, moving and sizing it, the saved logo, and how it goes into the saved file.

## OVL-01 Add a logo

Tap **Add logo** (red) to pick a PNG, WebP, JPEG or SVG file to place on the photo as a logo.

- Risk: high
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnOverlayAdd`, `#overlayInput`, "Add a logo or watermark: PNG, WebP, JPG or SVG, up to 5 MB."
- Source: `js/app/overlay.js` (`buildAddRow`, `bindOverlayControls`, `addOverlayFile`); `index.html` (the logo's file input)
- Flag: to confirm. The hint above the button always says "up to 5 MB", while the error for a file that is too big uses the real limit, which a link can lower.
- Cases: 2

### OVL-01.1 Add logo picks a file and places it   [auto: phone, webkit]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, in a private window so that no logo is saved in this browser
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: logo.png, made for the case: a PNG of 400 × 400 px, see-through except for a pure blue disc that fills it edge to edge
- Starting screen: the photo open, on the Overlay step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the controls | The line above them reads "Add a logo or watermark: PNG, WebP, JPG or SVG, up to 5 MB."; the red **Add logo** button shows; no logo is on the photo |
| 2 | Tap **Add logo** | The system's file picker opens; it lets you pick one file only, and it offers PNG, WebP, JPG and SVG pictures |
| 3 | Choose logo.png | The blue disc shows in the middle of the photo; the line above the controls now reads OPACITY with a slider and 100% |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### OVL-01.2 The hint still says 5 MB when a link lowers the limit   [auto: phone]
Flag: to confirm. Written to today's behavior: the hint gives 5 MB while the message for a file that is too big gives the real limit.

Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test, opened from a link that ends `index.html?overlay.maxBytes=1048576` (a logo limit of 1 MB)
- Photo: IMG_9136.JPEG from samples/
- Logo: big-logo.png, any file of exactly 2 MB (2,097,152 bytes) whose name ends .png
- Starting screen: the photo open, on the Overlay step, no logo placed

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the line above the controls | It reads "Add a logo or watermark: PNG, WebP, JPG or SVG, up to 5 MB." |
| 2 | Tap **Add logo** and choose big-logo.png | A red message takes the line's place: "That file is 2.0 MB. The overlay limit is 1 MB."; no logo is on the photo |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## OVL-02 Which files can be a logo

A logo file is accepted by its file type, or else by its name's extension. A PNG, WebP or JPEG over 4096 px is scaled down, an SVG is drawn 2048 px on its long side, and transparency is kept, so an SVG logo stays sharp in a full-size export.

- Risk: medium
- Check: script; script, saved file (an SVG logo stays sharp in a full-size export)
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.overlay.maxPx`, `CONFIG.overlay.svgPx`, "That file type isn’t supported. Use PNG, WebP, JPG or SVG."
- Source: `js/app/overlay.js` (`imageTypeOf`, `decode`, `decodeSvg`, `svgSize`, `register`)
- Cases: 6

### OVL-02.1 PNG, JPEG, WebP and SVG logos are each placed   [auto: phone, webkit]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logos, made for the case: logo.png (400 × 400 px, see-through except for a pure blue disc); logo.jpg (300 × 100 px, pure green); logo.webp (200 × 400 px, see-through except for a pure blue oval); logo.svg (width 200, height 100, its left half black and its right half white)
- Starting screen: the photo open, on the Overlay step, no logo placed

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Add logo** and choose logo.png | A blue disc shows on the photo, in a square box |
| 2 | Tap **Replace logo** in the row of tools and choose logo.jpg | A green box takes its place, three times as wide as it is high |
| 3 | Tap **Replace logo** and choose logo.webp | A blue oval takes its place, in a box half as wide as it is high |
| 4 | Tap **Replace logo** and choose logo.svg | A black and white box takes its place, twice as wide as it is high |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### OVL-02.2 A logo file with no picture type is taken by its name   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: logo.png as in OVL-01.1, handed to the app with no picture type of its own (the script sends it as a plain file of bytes; only its name says it is a PNG)
- Starting screen: the photo open, on the Overlay step, no logo placed

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Add logo** and choose logo.png | The blue disc shows on the photo, with no message |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### OVL-02.3 A GIF is refused   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: logo.gif, any GIF picture
- Starting screen: the photo open, on the Overlay step, no logo placed

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Add logo** and choose logo.gif | A red message takes the place of the hint: "That file type isn’t supported. Use PNG, WebP, JPG or SVG."; no logo is on the photo |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### OVL-02.4 An SVG logo stays sharp in a large export   [auto: phone, webkit]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: logo.svg, made for the case: width 200, height 100, viewBox 0 0 200 100, its left half black and its right half white
- Starting screen: the photo open, on the Overlay step, no logo placed

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Add logo** and choose logo.svg | The logo shows in the middle of the photo: its left half black, its right half white |
| 2 | Hold **Larger** (the **+** key, right of the arrows) for about 2.5 s | The logo grows to the photo's full width and stops |
| 3 | Tap **Export** in the step bar, then **PNG**, then **3000** | The size line gives 3000 px |
| 4 | Tap **Download**, and **Yes** to **Upscale to 3000 px?** | A PNG of 3000 × 3000 px is saved |
| 5 | Open the file and zoom in on the middle of the logo, where black meets white | The edge is sharp: at most 2 px of gray between the black and the white |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### OVL-02.5 A logo's see-through parts stay see-through in the saved file   [auto: phone, webkit]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: logo.png as in OVL-01.1 (a blue disc on a see-through square)
- Starting screen: the photo open, on the Overlay step, no logo placed

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Export** in the step bar, then **Download** (answer **No** if asked to upscale) | A first file is saved, with no logo |
| 2 | Tap **Overlay**, then **Add logo**, and choose logo.png | The blue disc shows in the middle of the photo |
| 3 | Tap **Export**, then **Download** (answer **No** if asked) | A second file is saved |
| 4 | Compare the two files just inside the top-left corner of the logo's square, outside the disc | That corner shows the photo, the same as in the first file; inside the disc the second file is blue |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### OVL-02.6 A logo larger than the cap is scaled down to it   [auto: phone]
The app scales a logo over 4096 px down to 4096 px, which the saved file can't show; a link lowers the cap to 256 px so that the scaling shows as a soft edge.

Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: split.png, made for the case: a PNG of 2048 × 1024 px, its left half black and its right half white
- Starting screen: the photo open, on the Overlay step, no logo placed

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Add logo**, choose split.png, then hold **Larger** (the **+** key, right of the arrows) for about 2.5 s | The logo grows to the photo's full width and stops |
| 2 | Tap **Export**, **PNG**, **3000**, then **Download** and **Yes** to upscaling | In the saved file, across the logo's middle, the black turns white within 2 px |
| 3 | Open the app from a link that ends `index.html?overlay.maxPx=256`, open IMG_9136.JPEG and go to Overlay | The photo is open on the Overlay step, with no logo |
| 4 | Repeat rows 1 and 2 | In this file the same edge is soft: 5 px of gray or more |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## OVL-03 Where a new logo lands

A newly added logo lands in the center of the frame, a quarter of its width, at 100% opacity, as one undo step.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnOverlayAdd`, `#overlayOpacityValue`
- Source: `js/app/overlay.js` (`place`, `defaultPlacement`); `js/engine.js` (`OVERLAY_DEFAULTS`)
- Ruling: R19. Each logo add is its own undo step, however quickly two come (and a dropped logo is accepted by its extension, as the picker accepts it). The app differs today.
- Cases: 2

### OVL-03.1 A new logo lands in the middle, a quarter wide, at 100%   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: logo.png as in OVL-01.1
- Starting screen: the photo open, on the Overlay step, no logo placed

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Add logo** and choose logo.png | The logo's middle is on the middle of the photo, its width a quarter of the photo's; the line above the controls reads OPACITY 100% |
| 2 | Tap **Undo** (the arrow curving left, at the top right) once | The logo is gone and **Add logo** shows again |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### OVL-03.2 Two logos added within 0.9 s are two undo steps   [auto: phone]
Written to ruling R19; it fails until that is built (BUG-080).

Before you start:
- Device and browser: a phone-width window, 390 × 844 px (only a script is quick enough to add two logos within 0.9 s)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logos: logo.png as in OVL-01.1; green.png, made for the case: a PNG of 400 × 400 px, pure green
- Starting screen: the photo open, on the Overlay step, no logo placed

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Add logo**, choose logo.png, then at once tap **Replace logo** and choose green.png, all within 0.9 s | The green square has taken the blue disc's place |
| 2 | Tap **Undo** | The blue disc is back |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## OVL-04 Use the saved logo

While a logo is saved in this browser, its thumbnail and **Use saved overlay** show beside **Add logo**. The button places the saved logo at its last position, size and opacity, as one undo step; the saved logo is never applied by itself.

- Risk: high
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnUseSaved`, `#overlayThumb`, "Use saved overlay"
- Source: `js/app/overlay.js` (`useSaved`, `loadSavedOverlay`, `setSaved`, `syncOverlay`)
- Cases: 1

### OVL-04.1 Use saved overlay places the saved logo where it was last   [auto: phone, webkit]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, in a private window so that no logo is saved in this browser yet
- Build: the build under test
- Photos: IMG_9136.JPEG and IMG_9075.JPEG from samples/
- Logo: logo.png as in OVL-01.1
- Starting screen: IMG_9136.JPEG open, on the Overlay step, no logo placed

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Add logo** and choose logo.png | The blue disc shows in the middle of the photo |
| 2 | Tap **Move right** (the right arrow in the left-hand pad) twice, then **Larger** (**+**) once | The logo moves a little right and grows a little |
| 3 | Wait a second, tap **Open** (the folder at the top left) and choose IMG_9075.JPEG | IMG_9075.JPEG opens on the Perspective step |
| 4 | Tap **Overlay** in the step bar | No logo is on the photo; a thumbnail of the blue disc and **Use saved overlay** show beside **Add logo** |
| 5 | Tap **Use saved overlay** | The blue disc shows as far right of the middle and as large as it was on the first photo; OPACITY reads 100% |
| 6 | Tap **Undo** once | The logo is gone; **Use saved overlay** shows again |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## OVL-05 The pads take the add buttons' place

Once a logo is placed, **Add logo** and the saved logo give way to the move pad and the size pad.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#overlayAddRow`, `#overlayPadRow`, `#overlayMovePad`, `#overlaySizePad`
- Source: `js/app/overlay.js` (`buildPadRow`, `syncOverlay`)
- Cases: 1

### OVL-05.1 The pads take the place of Add logo   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: logo.png as in OVL-01.1
- Starting screen: the photo open, on the Overlay step, no logo placed

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the row of controls | **Add logo** shows; no arrow pad |
| 2 | Tap **Add logo** and choose logo.png | **Add logo** is gone; in its place a pad of four arrows on the left and a pad with **−** and **+** on the right |
| 3 | Tap **Remove** in the row of tools | The pads are gone; **Add logo** shows again, with **Use saved overlay** beside it |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## OVL-06 Opacity

With a logo placed, the **Opacity** slider above the pads sets the logo's opacity from 0 to 100%, live, with the percent beside it. One slide is one undo step.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#overlayOpacity`, `#overlayOpacityValue`, `#overlayOpacityLine`
- Source: `js/app/overlay.js` (`buildOpacityLine`, `bindOpacitySlider`, `syncOverlay`)
- Cases: 1

### OVL-06.1 Opacity changes the logo as the slider moves, one undo step a slide   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px (slide with a finger)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: logo.png as in OVL-01.1
- Starting screen: the photo open, on the Overlay step, logo.png added (in the middle, OPACITY 100%)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Put a finger on the OPACITY slider's knob, at the right end, and slide it to the middle without lifting | The value beside it reads about 50%, and already the photo shows through the disc |
| 2 | Lift the finger | The value stays where it was |
| 3 | Tap **Undo** once | OPACITY reads 100% and the disc is solid blue again |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## OVL-07 Move pad

Each of the move pad's four arrow keys (**Move left**, **Move up**, **Move down**, **Move right**) moves the logo by 0.5% of the frame's width; holding a key repeats. Presses less than 0.9 s apart make one undo step.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#overlayMovePad`, `CONFIG.overlay.nudgePct`, `CONFIG.nudge.repeatMs`
- Source: `js/app/overlay.js` (`nudge`, `adjust`, `bindOverlayControls`); `js/app/parts/nudge-pad.js` (`bindNudgePad`)
- Cases: 3

### OVL-07.1 Each arrow of the move pad moves the logo 0.5% of the photo's width   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: logo.png as in OVL-01.1
- Starting screen: the photo open, on the Overlay step, logo.png added (in the middle)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Move right** (the right arrow in the left-hand pad) | The logo moves right by 0.5% of the photo's width, its size kept |
| 2 | Tap **Move left** | It moves back |
| 3 | Tap **Move down** | It moves down by 0.5% of the photo's width |
| 4 | Tap **Move up** | It moves back |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### OVL-07.2 Quick presses on the move pad are one undo step   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: logo.png as in OVL-01.1
- Starting screen: the photo open, on the Overlay step, logo.png added (in the middle)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Within 0.9 s, tap **Move right**, **Move right**, then **Move down** | The logo has moved right and down |
| 2 | Tap **Undo** once | The logo is back in the middle |
| 3 | Tap **Move right**, wait a second, tap **Move right** again, then tap **Undo** | Only the second move is taken back: the logo is one step right of the middle |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### OVL-07.3 Holding a move key keeps moving the logo   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: logo.png as in OVL-01.1
- Starting screen: the photo open, on the Overlay step, logo.png added (in the middle)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Hold **Move right** down for 1 s, then lift | The logo keeps moving while it is held: at least six steps right in all |
| 2 | Tap **Undo** once | The logo is back in the middle |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## OVL-08 Size pad

The size pad's **−** key (**Smaller**) shrinks the logo by a factor of 1.05 and its **+** key (**Larger**) grows it by 1.05; holding a key repeats. Presses less than 0.9 s apart, on either pad, make one undo step.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#overlaySizePad`, `CONFIG.overlay.sizeStep`
- Source: `js/app/overlay.js` (`nudge`, `adjust`, `bindOverlayControls`); `js/app/parts/nudge-pad.js` (`bindNudgePad`)
- Cases: 3

### OVL-08.1 Larger and Smaller change the width by 1.05   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: logo.png as in OVL-01.1
- Starting screen: the photo open, on the Overlay step, logo.png added (in the middle)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Larger** (**+** in the right-hand pad) | The logo is 1.05 times as wide and as high, its middle where it was |
| 2 | Tap **Smaller** (**−**) | It is its first size again |
| 3 | Tap **Smaller** again | It is 1.05 times smaller than at first |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### OVL-08.2 Holding Larger keeps growing the logo   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: logo.png as in OVL-01.1
- Starting screen: the photo open, on the Overlay step, logo.png added (in the middle)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Hold **Larger** down for 1 s, then lift | The logo keeps growing while it is held: at least six steps of 1.05 in all |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### OVL-08.3 Quick presses on both pads are one undo step   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: logo.png as in OVL-01.1
- Starting screen: the photo open, on the Overlay step, logo.png added (in the middle)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Within 0.9 s, tap **Move right**, then **Larger** | The logo moves right and grows |
| 2 | Tap **Undo** once | Both are taken back: the logo is in the middle, a quarter of the photo's width |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## OVL-09 Replace logo

**Replace logo** opens the file picker; the new logo lands at the starting place (centered, a quarter of the width, 100%) and becomes the saved logo.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#toolOverlayReplace`, "Choose another logo"
- Source: `js/app/overlay.js` (`bindOverlayControls`, `addOverlayFile`, `place`, `saveToBrowser`)
- Ruling: R18. The replacement logo takes the old logo's position, width and opacity. The app differs today.
- Cases: 2

### OVL-09.1 A replacement logo takes the old one's place, width and opacity   [auto: phone]
Written to ruling R18; it fails until that is built (BUG-081).

Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logos: logo.png as in OVL-01.1; green.png, a PNG of 400 × 400 px, pure green
- Starting screen: the photo open, on the Overlay step, logo.png added (in the middle)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Move right** twice and **Larger** once, then slide OPACITY to the middle | The blue disc is right of the middle, larger, and OPACITY reads about 50% |
| 2 | Wait a second, tap **Replace logo** and choose green.png | The green square takes the disc's place: as far right, as wide, and at the same opacity |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### OVL-09.2 The replacement becomes the saved logo   [auto: phone, webkit]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, in a private window so that no logo is saved in this browser yet
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logos: logo.png as in OVL-01.1; green.png, a PNG of 400 × 400 px, pure green
- Starting screen: the photo open, on the Overlay step, logo.png added

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Wait a second, tap **Replace logo** and choose green.png | The file picker opens; the green square takes the blue disc's place |
| 2 | Tap **Remove** | The logo is gone; the thumbnail beside **Use saved overlay** is the green square |
| 3 | Tap **Use saved overlay** | The green square is placed on the photo |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## OVL-10 Reset

**Reset** centers the logo at a quarter of the frame's width and 100% opacity, as one undo step.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#toolOverlayReset`, "Center the logo at its first size, at 100%"
- Source: `js/app/overlay.js` (`resetPlacement`)
- Cases: 1

### OVL-10.1 Reset puts the logo back in the middle, a quarter wide, at 100%   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: logo.png as in OVL-01.1
- Starting screen: the photo open, on the Overlay step, logo.png added (in the middle)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Move right** twice and **Larger** once, then slide OPACITY to the middle | The logo is right of the middle, larger, and OPACITY reads about 50% |
| 2 | Wait a second, then tap **Reset** in the row of tools | The logo is in the middle of the photo, a quarter of its width; OPACITY reads 100% |
| 3 | Tap **Undo** once | The moved, larger, fainter logo is back |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## OVL-11 Remove

**Remove** takes the logo off this photo, as one undo step; the logo saved in the browser stays.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#toolOverlayRemove`, "Take the logo off this photo"
- Source: `js/app/overlay.js` (`removeOverlay`)
- Ruling: R22. Remove leaves this photo's logo in storage, so Undo still brings it back after a reload and Resume. The app already does this.
- Cases: 1

### OVL-11.1 Remove takes the logo off this photo and keeps the saved one   [auto: phone]
That **Undo** still brings it back after a reload and **Resume** (ruling R22) is proved in STA-10.2.

Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: logo.png as in OVL-01.1
- Starting screen: the photo open, on the Overlay step, logo.png added

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Remove** in the row of tools | The disc is gone from the photo; **Add logo** shows, with the disc's thumbnail and **Use saved overlay** beside it |
| 2 | Tap **Undo** once | The disc is back where it was |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## OVL-12 Delete saved

**Delete saved** clears the logo stored in this browser only; a logo placed on the photo stays.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#toolOverlayDeleteSaved`, "Delete the logo saved in this browser", "Delete saved leaves the logo on this photo."
- Source: `js/app/overlay.js` (`deleteSaved`)
- Cases: 1

### OVL-12.1 Delete saved forgets the saved logo and leaves the one on the photo   [auto: phone, webkit]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, in a private window so that no logo is saved in this browser yet
- Build: the build under test
- Photos: IMG_9136.JPEG and IMG_9075.JPEG from samples/
- Logo: logo.png as in OVL-01.1
- Starting screen: IMG_9136.JPEG open, on the Overlay step, logo.png added a second ago

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Delete saved** in the row of tools | The disc stays on the photo; **Delete saved** is greyed out |
| 2 | Tap **Remove** | **Add logo** shows alone: no thumbnail, no **Use saved overlay** |
| 3 | Reload the page, open IMG_9075.JPEG and tap **Overlay** in the step bar | No saved logo is offered: **Add logo** alone, and no row of tools |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## OVL-13 Which tools show

The bottom row of buttons is hidden with no logo placed and none saved. It holds **Delete saved** alone while a saved logo is only offered, and **Replace logo**, **Reset**, **Remove** and **Delete saved** with a logo placed. **Delete saved** is dimmed when nothing is saved.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#overlayTools`, `#toolOverlayDeleteSaved`, `#toolOverlayReplace`
- Source: `js/app/overlay.js` (`syncOverlayTools`)
- Cases: 1

### OVL-13.1 The row of tools shows the tools that can act   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, in a private window so that no logo is saved in this browser
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: logo.png as in OVL-01.1
- Starting screen: the photo open, on the Overlay step, no logo placed

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look under **Add logo** | No row of tools |
| 2 | Tap **Add logo** and choose logo.png | A row of tools: **Replace logo**, **Reset**, **Remove** and **Delete saved**, none greyed out |
| 3 | Tap **Remove** | **Delete saved** alone |
| 4 | Tap **Use saved overlay**, then **Delete saved** | All four tools again, **Delete saved** greyed out |
| 5 | Tap **Remove** | No row of tools |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## OVL-14 A logo file that can't be used

A file that can't be used puts a red message in place of the hint or **Opacity**. It clears when a logo is added or removed, the step is left, the logo's placement changes, or a pair switches side; a failed add leaves the current logo as it was.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#overlayStatus`, "Couldn’t read that image. Try another PNG, WebP, JPG or SVG file.", " MB. The overlay limit is "
- Source: `js/app/overlay.js` (`setMessage`, `addOverlayFile`, `overlayStateChanged`, `syncOverlay`); `js/app/shell.js` (`setTab`); `js/app/pair.js` (`applySide`)
- Cases: 4

### OVL-14.1 A file that isn't a picture gets a red message in place of the hint   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logos: not-a-logo.png, a text file renamed to end in .png; logo.png as in OVL-01.1
- Starting screen: the photo open, on the Overlay step, no logo placed

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Add logo** and choose not-a-logo.png | A red message takes the hint's place: "Couldn’t read that image. Try another PNG, WebP, JPG or SVG file."; no logo |
| 2 | Tap **Add logo** and choose logo.png | The message has gone; the disc shows, with OPACITY above the controls |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### OVL-14.2 A file over 5 MB is refused and the logo stays   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logos: logo.png as in OVL-01.1; big-logo.png, any file of exactly 6 MB (6,291,456 bytes) whose name ends .png
- Starting screen: the photo open, on the Overlay step, logo.png added

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Replace logo** and choose big-logo.png | A red message takes OPACITY's place: "That file is 6.0 MB. The overlay limit is 5 MB."; the disc stays as it was |
| 2 | Tap **Move right** | The disc moves; the message has gone and OPACITY shows again |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### OVL-14.3 The message goes when the logo is removed or the step is left   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logos: logo.png as in OVL-01.1; not-a-logo.png, a text file renamed to end in .png
- Starting screen: the photo open, on the Overlay step, logo.png added

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Replace logo** and choose not-a-logo.png | A red message reads "Couldn’t read that image. Try another PNG, WebP, JPG or SVG file." |
| 2 | Tap **Remove** | The message has gone; the hint shows |
| 3 | Tap **Add logo** and choose not-a-logo.png | The same red message shows |
| 4 | Tap **Export** in the step bar, then **Overlay** | The message has gone; the hint shows |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### OVL-14.4 The message goes when a pair switches side   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Logo: not-a-logo.png, a text file renamed to end in .png
- Starting screen: a pair: the front opened, then the back added with **Add back** on Export; the back is open

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Overlay** in the step bar, then **Add logo**, and choose not-a-logo.png | On the back's Overlay step a red message reads "Couldn’t read that image. Try another PNG, WebP, JPG or SVG file." |
| 2 | Tap **Front** in the top bar | The front's Overlay step shows the hint and no message |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## OVL-15 The photo is locked on this step

On the Overlay step the photo is locked: every press, pinch and wheel turn acts on the logo, and the photo can't be panned or zoomed.

- Risk: medium
- Check: script, touch
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: "On this step the photo stays framed as set in Crop."
- Source: `js/app/input.js` (`onPointerDown`, `onWheel`); `js/app/overlay.js` (`overlayPointerDown`)
- Flag: to confirm. With no logo placed, every touch and the wheel do nothing on this step.
- Cases: 3

### OVL-15.1 A drag and a pinch on the photo move the logo, not the photo   [auto: phone, webkit]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px (drag and pinch with fingers)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: logo.png as in OVL-01.1
- Starting screen: the photo open, on the Overlay step, logo.png added

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Drag a finger 60 px right and 40 px down, starting on the photo's lower left, away from the logo and the rings | The logo moves 60 px right; the photo doesn't move |
| 2 | Pinch two fingers apart on the photo's lower left | The logo grows; the photo doesn't zoom |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### OVL-15.2 With no logo placed, a drag and a pinch do nothing   [auto: phone]
Flag: to confirm. Written to today's behavior: with no logo, touches on the photo do nothing on this step.

Before you start:
- Device and browser: a phone-width window, 390 × 844 px (drag and pinch with fingers)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Overlay step, no logo placed

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Drag a finger 60 px right and 40 px down on the photo | The photo doesn't move; nothing new to undo |
| 2 | Pinch two fingers apart on the photo | The photo doesn't zoom; nothing new to undo |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### OVL-15.3 The mouse wheel never zooms the photo here   [auto: desktop]
Flag: to confirm. Written to today's behavior: with no logo, the wheel does nothing on this step.

Before you start:
- Device and browser: a computer with a mouse; a wide window, 1280 × 800 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: logo.png as in OVL-01.1
- Starting screen: the photo open, on the Overlay step, no logo placed

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Point at the photo and roll the wheel away from you | Nothing changes: the photo doesn't zoom |
| 2 | Click **Add logo**, choose logo.png, then roll the wheel over the photo again | The photo still doesn't zoom |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## OVL-16 Drag to move the logo

Dragging anywhere on the photo, except on one of the logo's corner handles, moves the logo, as one undo step.

- Risk: high
- Check: script, touch
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: "Tap a ring to snap the logo to that corner, side or the center."
- Source: `js/app/overlay.js` (`overlayPointerDown`, `gesturePlacement`, `overlayPointerMove`); `js/app/input.js` (`onPointerDown`, `onPointerMove`, `onPointerUp`)
- Cases: 2

### OVL-16.1 Dragging the logo moves it, one undo step   [auto: phone, webkit]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px (drag with a finger)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: logo.png as in OVL-01.1
- Starting screen: the photo open, on the Overlay step, logo.png added (in the middle)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Put a finger on the disc, left of its middle ring, drag 60 px right and 40 px down, and lift | The logo moves with the finger, 60 px right and 40 px down, its size kept |
| 2 | Tap **Undo** once | The logo is back in the middle |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### OVL-16.2 A drag away from the logo moves it too   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px (drag with a finger)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: logo.png as in OVL-01.1
- Starting screen: the photo open, on the Overlay step, logo.png added (in the middle)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Drag a finger 40 px left and 60 px up, starting on the photo's lower left, away from the logo and the rings | The logo moves 40 px left and 60 px up |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## OVL-17 Drag a corner to resize

A press within 24 px of one of the logo's corner handles, then a drag, resizes the logo with its shape kept and the opposite corner fixed, never narrower than 8 px. A corner handle wins over a ring under it.

- Risk: medium
- Check: script, touch
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.handle.hitRadius`, "drag a corner or pinch to resize."
- Source: `js/app/overlay.js` (`hitCorner`, `overlayPointerDown`, `gesturePlacement`); `js/engine.js` (`clampOverlay`)
- Cases: 3

### OVL-17.1 Dragging a corner resizes the logo, its shape and the far corner kept   [auto: phone, webkit]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px (drag with a finger)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: logo.png as in OVL-01.1
- Starting screen: the photo open, on the Overlay step, logo.png added (in the middle)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Drag the logo's bottom-right handle (the white square on its corner) 40 px right and 20 px down | The logo is 40 px wider and 40 px higher, still square; its top-left corner hasn't moved |
| 2 | Tap **Undo** once | The logo is its first size |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### OVL-17.2 A corner drag never makes the logo narrower than 8 px   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px (drag with a finger)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: logo.png as in OVL-01.1
- Starting screen: the photo open, on the Overlay step, logo.png added (in the middle)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Drag the bottom-right handle up and left, 80 px past the top-left handle | The logo shrinks to a speck 8 px of the photo wide (under 3 px on the screen), its top-left corner where it was |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### OVL-17.3 A corner handle near a ring wins over the ring   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px (tap and drag with a finger)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: logo.png as in OVL-01.1
- Starting screen: the photo open, on the Overlay step, logo.png added (in the middle)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap the top-left ring | The logo snaps to the photo's top-left corner; its top-left handle is just inside the ring |
| 2 | Put a finger halfway between that handle and the ring (within 24 px of both), drag 20 px right and 20 px down, and lift | The logo is resized, smaller, its bottom-right corner where it was: the handle took the press, not the ring |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## OVL-18 Pinch to resize

A two-finger pinch resizes and moves the logo; if one finger lifts, the other carries on moving it. The whole gesture is one undo step.

- Risk: medium
- Check: script, touch
- Layout: both, on a touch screen.
- Added: 1.10 baseline
- Changed: none
- Anchors: "drag a corner or pinch to resize."
- Source: `js/app/overlay.js` (`overlayPointerDown`, `gesturePlacement`, `overlayPinchEnded`)
- Cases: 2

### OVL-18.1 A pinch resizes the logo, one undo step   [auto: phone, webkit]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px (pinch with two fingers)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: logo.png as in OVL-01.1
- Starting screen: the photo open, on the Overlay step, logo.png added (in the middle)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Put two fingers 40 px apart on the logo's middle and spread them to 100 px apart | The logo is 2.5 times as wide, its middle where it was |
| 2 | Tap **Undo** once | The logo is its first size |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### OVL-18.2 After one finger lifts, the other moves the logo on   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px (two fingers)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: logo.png as in OVL-01.1
- Starting screen: the photo open, on the Overlay step, logo.png added (in the middle)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Put two fingers on the logo, spread them apart, and lift the right one | The logo is larger |
| 2 | Without lifting the left finger, slide it 60 px right, then lift it | The logo moves 60 px right with the finger, its size kept |
| 3 | Tap **Undo** once | The whole gesture is taken back: the logo is its first size, in the middle |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## OVL-19 Nine snap rings

Nine rings sit on the photo, at the four corners, the four side middles and the center, 28 px in from the frame's edges.

- Risk: low
- Check: eye
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.overlay.hotSpotInset`
- Source: `js/app/overlay.js` (`hotSpots`, `drawHotSpots`)
- Cases: 1

### OVL-19.1 Nine rings on the photo, for a person to judge   [eye]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: logo.png as in OVL-01.1
- Starting screen: the photo open, on the Overlay step, logo.png added (in the middle)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the framed photo | Nine white rings, each with a dot in it: at the four corners, the middles of the four sides and the center, each the same small distance in from the edges; the center ring sits on the middle of the logo |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## OVL-20 Tap a ring to snap

A still tap on a ring snaps the logo there, 3% of the frame's width in from the edges (the center ring centers it), as one undo step; the edits hold the snapped place at once.

- Risk: high
- Check: script, touch
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: "Tap a ring to snap the logo to that corner, side or the center."
- Source: `js/app/overlay.js` (`hitSpot`, `overlaySpotTap`); `js/engine.js` (`snapOverlay`)
- Cases: 2

### OVL-20.1 Tapping a corner ring snaps the logo there at once, one undo step   [auto: phone, webkit]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px (tap with a finger)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: logo.png as in OVL-01.1
- Starting screen: the photo open, on the Overlay step, logo.png added (in the middle)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap the top-right ring | The logo glides to the top-right corner; its top and right edges end 3% of the photo's width in from the top and right (the edits hold that place at once, before the glide ends) |
| 2 | Tap **Undo** once | The logo is back in the middle |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### OVL-20.2 The bottom ring and the center ring   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px (tap with a finger)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: logo.png as in OVL-01.1
- Starting screen: the photo open, on the Overlay step, logo.png added (in the middle)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap the ring at the middle of the bottom edge | The logo is centered across the photo, its bottom edge 3% of the photo's width up from the bottom |
| 2 | Tap the center ring | The logo is in the middle of the photo again |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## OVL-21 A drag that starts on a ring moves

A drag that starts on a ring moves the logo as any other drag does; it doesn't snap.

- Risk: low
- Check: script, touch
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: none
- Source: `js/app/overlay.js` (`overlayPointerDown`, `overlayPointerMove`)
- Cases: 1

### OVL-21.1 A drag that starts on a ring moves the logo   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px (drag with a finger)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: logo.png as in OVL-01.1
- Starting screen: the photo open, on the Overlay step, logo.png added (in the middle)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Put a finger on the ring at the middle of the left edge, drag 60 px right, and lift | The logo moves 60 px right; it doesn't snap to the left |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## OVL-22 Rings fade and the logo glides

The rings fade out while a gesture runs and back in after it; a tapped ring lights for 180 ms while the logo glides to its snapped place. Under reduced motion the logo jumps there.

- Risk: low
- Check: eye
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: none
- Source: `js/app/overlay.js` (`aimRings`, `ringAlphaAt`, `areRingsWanted`, `drawnPlacement`, `litSpotAt`)
- Flag: to confirm. Under reduced motion the rings appear and go with no fade, while the Levels compare badge keeps its short fade.
- Cases: 2

### OVL-22.1 The rings fade during a drag, for a person to judge   [eye]
The ring lit by a tap lasts 180 ms, too short for a screenshot; it is left to a person on a phone.

Before you start:
- Device and browser: a phone-width window, 390 × 844 px (drag with a finger)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: logo.png as in OVL-01.1
- Starting screen: the photo open, on the Overlay step, logo.png added (in the middle)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Put a finger on the disc and drag 60 px right and 40 px down, and hold it there | The logo follows the finger; no rings show on the photo; the logo's dashed box and four handles do |
| 2 | Lift the finger and wait half a second | The nine rings are back |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### OVL-22.2 Under reduced motion a tapped ring moves the logo at once   [auto: phone]
Flag: to confirm. Written to today's behavior: the logo jumps, and the rings appear and go with no fade (not checked here), while the Levels compare badge keeps its short fade.

Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with the device set to reduce motion
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: logo.png as in OVL-01.1
- Starting screen: the photo open, on the Overlay step, logo.png added (in the middle)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap the bottom-right ring | In the very next frame the logo is already in the bottom-right corner, with no glide |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## OVL-23 Box and corner handles

A dashed white box and four white corner handles surround the logo, on the Overlay step only.

- Risk: low
- Check: eye
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: none
- Source: `js/app/overlay.js` (`drawOverlayPreview`, `overlayCorners`)
- Cases: 1

### OVL-23.1 The logo's box and handles, for a person to judge   [eye]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: logo.png as in OVL-01.1
- Starting screen: the photo open, on the Overlay step, logo.png added (in the middle)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the logo | A dashed white box around the blue disc, and a small white square handle on each of its four corners |
| 2 | Tap **Export** in the step bar | The blue disc alone: no box, no handles and no rings |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## OVL-24 The logo shows on Overlay and Export

The logo is drawn on the photo, at its opacity, on the Overlay and Export steps only.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: none
- Source: `js/app/overlay.js` (`drawOverlayPreview`); `js/app/view.js` (`drawResult`)
- Cases: 2

### OVL-24.1 The logo shows on Overlay and Export only   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: logo.png as in OVL-01.1
- Starting screen: the photo open, on the Overlay step, logo.png added

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the photo | The blue disc shows |
| 2 | Tap **Perspective** in the step bar | No logo shows |
| 3 | Tap **Rotate** | No logo shows |
| 4 | Tap **Crop** | No logo shows |
| 5 | Tap **Levels** | No logo shows |
| 6 | Tap **Export** | The blue disc shows again |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### OVL-24.2 The logo is drawn at its opacity   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px (slide with a finger)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: logo.png as in OVL-01.1
- Starting screen: the photo open, on the Overlay step, logo.png added

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Slide OPACITY all the way left | It reads 0% |
| 2 | Tap **Export** in the step bar | No logo shows on the photo |
| 3 | Tap **Overlay**, slide OPACITY to the middle (about 50%), then tap **Export** | The disc shows as the photo and blue mixed in that proportion |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## OVL-25 The logo stays inside the crop

The logo is always kept wholly inside the crop: shrunk if it can't fit, then pulled in, and again whenever the crop changes.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: none
- Source: `js/app/overlay.js` (`effective`, `setPlacement`); `js/engine.js` (`clampOverlay`)
- Cases: 2

### OVL-25.1 A logo dragged off the side stops at the edge   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px (drag with a finger)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: logo.png as in OVL-01.1
- Starting screen: the photo open, on the Overlay step, logo.png added (in the middle)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Drag the disc right, to 120 px past the photo's right edge, and lift | The logo's right edge stops on the photo's right edge |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### OVL-25.2 The logo is shrunk to fit, and again when the crop changes   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: tall.png, made for the case: a PNG of 100 × 400 px, see-through except for a blue oval
- Starting screen: the photo open, on the Crop step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **5:7 card**, then **Overlay** in the step bar | The photo is framed taller than wide, with no logo |
| 2 | Tap **Add logo**, choose tall.png, then hold **Larger** for 1 s | The logo grows until it is as high as the framed photo, then stops |
| 3 | Tap **Crop**, then **1:1**, then **Overlay** | The logo is smaller: still as high as the framed photo, and wholly inside it |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## OVL-26 The mouse wheel resizes the logo

With a mouse, turning the wheel over the photo resizes the logo.

- Risk: low
- Check: script
- Layout: wide. It needs a mouse wheel, which a phone doesn't have.
- Added: 1.10 baseline
- Changed: none
- Anchors: "Arrows move the logo (Shift for bigger steps); + and − resize it; the wheel resizes too."
- Source: `js/app/overlay.js` (`overlayWheel`); `js/app/input.js` (`onWheel`)
- Cases: 1

### OVL-26.1 The mouse wheel resizes the logo   [auto: desktop]
Before you start:
- Device and browser: a computer with a mouse; a wide window, 1280 × 800 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: logo.png as in OVL-01.1
- Starting screen: the photo open, on the Overlay step, logo.png added (in the middle)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Point at the photo's lower left and roll the wheel one notch away from you | The logo grows |
| 2 | At once, roll it two notches toward you | The logo is a little smaller than at first |
| 3 | Wait a second, then click **Undo** once | The logo is its first size: the three rolls were one undo step |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## OVL-27 The mouse cursor

With a mouse on the Overlay step, the cursor shows resize arrows over a corner handle, a pointing hand over a ring, a move cursor elsewhere, and the plain arrow with no logo placed.

- Risk: low
- Check: script
- Layout: wide. It needs a mouse.
- Added: 1.10 baseline
- Changed: none
- Anchors: none
- Source: `js/app/overlay.js` (`overlayCursor`); `js/app/input.js` (`hoverCursor`)
- Cases: 1

### OVL-27.1 The mouse cursor shows what a press would do   [auto: desktop]
Before you start:
- Device and browser: a computer with a mouse; a wide window, 1280 × 800 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: logo.png as in OVL-01.1
- Starting screen: the photo open, on the Overlay step, logo.png added (in the middle)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Point at the logo's bottom-right handle | A diagonal resize arrow, top-left to bottom-right |
| 2 | Point at its top-right handle | The other diagonal resize arrow |
| 3 | Point at the top-left ring | A pointing hand |
| 4 | Point at the photo's lower left, away from the logo and the rings | The move cursor (four arrows) |
| 5 | Click **Remove**, then point at the photo again | The plain arrow |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## OVL-28 The saved logo is kept up to date

Adding a logo by the button, a drop or a paste makes it the saved logo. While the placed logo is the saved one, its position, size and opacity are saved again 400 ms after each change.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.session.saveDelayMs`, "This overlay works on this photo, but it can’t be saved in this browser."
- Source: `js/app/overlay.js` (`addOverlayFile`, `saveToBrowser`, `overlayStateChanged`)
- Flag: to confirm. When the logo can't be stored, the message says so but gives no next step.
- Cases: 3

### OVL-28.1 A change to the saved logo's place is saved 0.4 s later   [auto: phone, webkit]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, in a private window so that no logo is saved in this browser yet; the script watches what the app stores
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: logo.png as in OVL-01.1
- Starting screen: the photo open, on the Overlay step, no logo placed

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Add logo** and choose logo.png | The logo is saved in the browser as the saved logo, in the middle |
| 2 | Wait a second, then tap **Move right** | The new place is saved as the saved logo's 0.4 s after the tap, once, and not before |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### OVL-28.2 A logo the browser won't keep still goes on the photo   [auto: phone]
Flag: to confirm. Written to today's behavior: the warning says the logo can't be saved but gives no next step.

Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with the browser refusing to store the saved logo (the script stands in a full storage; on a phone, nearly full storage)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: logo.png as in OVL-01.1
- Starting screen: the photo open, on the Overlay step, no logo placed

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Add logo** and choose logo.png | The disc shows on the photo; an amber warning reads "This overlay works on this photo, but it can’t be saved in this browser." |
| 2 | Tap **Remove** | **Add logo** shows, with no **Use saved overlay** |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### OVL-28.3 After Delete saved, moving the logo saves nothing   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px; the script watches what the app stores
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: logo.png as in OVL-01.1
- Starting screen: the photo open, on the Overlay step, logo.png added a second ago

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Delete saved**, then **Move right**, and wait a second | The logo has moved; nothing has been saved as the saved logo since **Delete saved**, and none is stored |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## OVL-29 The logo goes on last in the saved file

In the saved file the logo is drawn last: Levels and the upscale sharpening never touch it, and it sits at the same place relative to the crop at every Size.

- Risk: high
- Check: script, saved file
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: "The overlay image isn’t loaded. Open the Overlay step and add it again."
- Source: `js/app/overlay.js` (`compositeOverlay`); `js/app/export.js` (`renderFull`)
- Cases: 3

### OVL-29.1 Levels never change the logo in the saved file   [auto: phone, webkit]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: green.png, made for the case: a PNG of 400 × 400 px, pure green
- Starting screen: the photo open, on the Overlay step, no logo placed

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Add logo** and choose green.png | The green square shows in the middle |
| 2 | Tap **Export**, **PNG**, **2000**, then **Download** (answer **No** if asked to upscale) | A first PNG is saved |
| 3 | Tap **Levels**, then **Auto**, then **Apply** | Levels are applied; **Apply** is greyed out again |
| 4 | Tap **Export**, then **Download** (answer **No** if asked) | In the second PNG the photo beside the logo is lighter or darker than in the first; the logo is the same pure green (0, 255, 0) in both |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### OVL-29.2 The upscale's sharpening never touches the logo   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: greys.png, made for the case: a PNG of 400 × 400 px, its left half gray 100 and its right half gray 150 (0 to 255)
- Starting screen: the photo open, on the Overlay step, no logo placed

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Add logo** and choose greys.png | The two-gray square shows in the middle |
| 2 | Tap **Export**, **PNG**, **3000**, then **Download** and **Yes** to **Upscale to 3000 px?** | A PNG of 3000 × 3000 px is saved |
| 3 | Look across the logo's middle in the file | No px is darker than gray 100 or lighter than gray 150: no sharpening halo along the edge between the two grays |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### OVL-29.3 The logo keeps its place in the photo at every Size   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: green.png as in OVL-29.1
- Starting screen: the photo open, on the Overlay step, no logo placed

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Add logo**, choose green.png, then tap the bottom-right ring | The green square sits in the bottom-right corner |
| 2 | Tap **Export**, **PNG**, **1080**, then **Download** | A PNG 1080 px wide is saved |
| 3 | Tap **Original**, then **Download** | A larger PNG is saved |
| 4 | Compare where the green square is in the two files | It takes the same share of the image, in the same place, within a pixel |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## OVL-30 The logo's place is part of the edits

The logo's placement is part of the edits: it can be undone, and it is kept per photo, per side of a pair, in the saved session and in edits files.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: none
- Source: `js/app/state.js` (`defaultState`, `commit`); `js/app/overlay.js` (`overlayForEdits`, `overlayFromEdits`); `js/engine.js` (`sanitizeState`)
- Cases: 2

### OVL-30.1 Undo and Redo move the logo; a new photo has none placed   [auto: phone]
The logo kept in the saved session is proved in STA-10.1, in an edits file in EDT-02, and per side of a pair also in PAIR-24.1.

Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photos: IMG_9136.JPEG and IMG_9075.JPEG from samples/
- Logo: logo.png as in OVL-01.1
- Starting screen: IMG_9136.JPEG open, on the Overlay step, logo.png added (in the middle)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Move right**, wait a second, then tap **Undo** | The logo is back in the middle |
| 2 | Tap **Redo** (the arrow curving right) | It moves right again |
| 3 | Tap **Open**, choose IMG_9075.JPEG, then tap **Overlay** | No logo is placed on this photo; **Use saved overlay** is offered |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### OVL-30.2 Each side of a pair keeps its own logo place   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Logo: logo.png as in OVL-01.1
- Starting screen: a pair: the front opened, then the back added with **Add back** on Export; the back is open

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Overlay**, **Add logo**, choose logo.png, then tap the top-left ring | The logo sits top-left on the back |
| 2 | Tap **Front** in the top bar | The front's Overlay step, with no logo placed |
| 3 | Tap **Use saved overlay**, wait a second, then tap the bottom-right ring | The logo sits bottom-right on the front |
| 4 | Tap **Back** | The back's logo is still top-left |
| 5 | Tap **Front** | The front's logo is still bottom-right |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## OVL-31 With invalid corners

With invalid corners, picking a file with **Add logo** or **Replace logo** does nothing and says nothing. **Use saved overlay** still places the saved logo in the edits, as one undo step, though nothing is drawn: the pads and tools appear and the pads do nothing.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnOverlayAdd`, `#btnUseSaved`, `#toolOverlayReplace`
- Source: `js/app/overlay.js` (`addOverlayFile`, `useSaved`, `place`, `setPlacement`, `syncOverlay`)
- Ruling: R11. With invalid corners, **Add logo**, **Use saved overlay** and **Replace logo** are dimmed and the line above the controls reads "Fix the corners in Perspective first." The app differs today.
- Cases: 2

### OVL-31.1 With crossed corners Add logo and Use saved overlay are greyed out   [auto: phone]
Written to ruling R11; it fails until that is built (BUG-082).

Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: logo.png as in OVL-01.1
- Starting screen: the photo open, on the Overlay step, logo.png added, then taken off with **Remove** (so it is saved and offered)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Perspective**, and drag the top-left corner ring past the bottom-right one | The outline crosses itself and turns red |
| 2 | Tap **Overlay** | **Add logo** and **Use saved overlay** are greyed out; the line above the controls reads "Fix the corners in Perspective first." |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### OVL-31.2 With crossed corners Replace logo is greyed out   [auto: phone]
Written to ruling R11; it fails until that is built (BUG-082).

Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: logo.png as in OVL-01.1
- Starting screen: the photo open, on the Overlay step, logo.png added

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Perspective**, and drag the top-left corner ring past the bottom-right one | The outline crosses itself and turns red |
| 2 | Tap **Overlay** | **Replace logo** is greyed out; the line above the controls reads "Fix the corners in Perspective first." |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## OVL-32 Overlay options

The Overlay sheet, **Overlay options**, holds only the tips.

- Risk: low
- Check: script
- Layout: both. On a phone it is a sheet opened from the tab with the up arrow above the controls; on a wide screen it is always shown in the side panel, with the tips in place of the sheet's title.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#overlaySheet`, `#overlayTips`, "Overlay options"
- Source: `js/app/overlay.js` (`buildOverlayControls`)
- Cases: 1

### OVL-32.1 Overlay options hold only the tips   [auto: both]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px, or a wide window, 1280 × 800 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Overlay step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | On a phone, tap the tab with the up arrow on the top edge of the controls | The sheet **Overlay options** rises, holding one row, **Tips** |
| 2 | On a phone, tap **Tips** | It opens in place: "Tap a ring to snap the logo to that corner, side or the center. Drag to move it; drag a corner or pinch to resize.", "On this step the photo stays framed as set in Crop.", "Your last logo is kept in this browser for the next photo." and "Delete saved leaves the logo on this photo." |
| 3 | On a wide screen, look under the controls in the side panel | The heading TIPS AND KEYS, with no **Overlay options** title and no **Tips** row; under it the last three tips of row 2 (not the one about rings) and "Arrows move the logo (Shift for bigger steps); + and − resize it; the wheel resizes too." |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.
