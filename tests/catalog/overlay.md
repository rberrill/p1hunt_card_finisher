# Overlay (logo)

Placing a logo or watermark on the framed photo: adding it, moving and sizing it, the saved logo, and how it goes into the saved file.

The logos the cases use are in `tests/fixtures/`: blue-disc.png (400 × 400 px, see-through except for a pure blue disc that fills it edge to edge), green-logo.png (400 × 400 px, pure green), overlay-green-wide.jpg (300 × 100 px, pure green), overlay-blue-oval.webp (200 × 400 px, see-through except for a pure blue oval), overlay-tall-oval.png (100 × 400 px, see-through except for a pure blue oval), overlay-split.svg (width 200, height 100, viewBox 0 0 200 100, its left half black and its right half white), overlay-split-2048.png (2048 × 1024 px, its left half black and its right half white), overlay-greys.png (400 × 400 px, its left half gray 100 and its right half gray 150, on a scale of 0 to 255), overlay-dark-and-light-grays.png (400 × 400 px, its left half gray 30 and its right half gray 220), not-a-logo.png (a line of text, named like a PNG) and logo.gif (a GIF of one see-through pixel).

## OVL-01 Add a logo

Tap **Add logo** (red) to pick a PNG, WebP, JPEG or SVG file to place on the photo as a logo. The line above it names the file types and the size limit in force: 5 MB, or the lower limit a link sets, in KB when it is under 1 MB.

- Risk: high
- Check: script; phone (the iPhone's own file menu)
- Layout: both
- Added: 1.10 baseline
- Changed: 1.10.0
- Anchors: `#btnOverlayAdd`, `#overlayInput`, "Add a logo or watermark: PNG, WebP, JPG or SVG, up to "
- Source: `js/app/overlay.js` (`buildAddRow`, `overlayHint`, `logoLimitText`, `bindOverlayControls`, `addOverlayFile`); `index.html` (the logo's file input)
- Ruling: R83. The hint gives the logo size limit in force, which a link can lower. Rich, 2026-11-18: a limit under 1 MB reads in KB ("up to 64 KB."), and one of 1 MB or more in MB with at most one decimal ("5 MB", "1.5 MB"), in the hint and in the too-big refusal alike. The app does this since 1.10.0.
- Cases: 4

### OVL-01.1 Add logo picks a file and places it   [auto: phone, webkit]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: blue-disc.png from tests/fixtures/ (a blue disc on a see-through square)
- Starting screen: the photo open, on the Overlay step
- Browser data: none for this site (a private window, or the site's data cleared)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the controls (the block of buttons and sliders under the photo) | The line above them (the one line of text at the top of the controls) reads "Add a logo or watermark: PNG, WebP, JPG or SVG, up to 5 MB."; the red **Add logo** button shows; no logo is on the photo |
| 2 | Tap **Add logo** | The system's file picker opens; it lets you pick one file only, and it offers PNG, WebP, JPG and SVG pictures |
| 3 | Choose blue-disc.png | The blue disc shows in the middle of the photo; the line above the controls now reads OPACITY with a slider and 100% |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### OVL-01.2 The hint gives the lower limit a link sets   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test, opened from a link that ends `index.html?overlay.maxBytes=1048576` (a logo limit of 1 MB)
- Photo: IMG_9136.JPEG from samples/
- Logo: big-logo.png, a file of exactly 2 MB (2,097,152 bytes) whose name ends .png: make one by renaming any file of that size (it is too big to keep in tests/fixtures/; the script makes its own)
- Starting screen: the photo open, on the Overlay step, no logo placed
- Browser data: none for this site (a private window, or the site's data cleared)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the line above the controls (the one line of text at the top of the block of buttons under the photo) | It reads "Add a logo or watermark: PNG, WebP, JPG or SVG, up to 1 MB.": the limit the link set |
| 2 | Tap **Add logo** | The file picker opens |
| 3 | Choose big-logo.png | A red message takes the line's place: "That file is 2.0 MB. The logo limit is 1 MB."; no logo is on the photo |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### OVL-01.3 On an iPhone a logo comes from Photos, and an SVG from Files   [phone]
Before you start:
- Device and browser: an iPhone, Safari
- Build: the UAT site, https://rberrill.github.io/p1hunt_card_finisher_uat/
- Photo: IMG_9136.JPEG from your photos (copied from samples/)
- Logos: blue-disc.png from tests/fixtures/, saved to Photos; overlay-split.svg from tests/fixtures/, saved to Files (On My iPhone or iCloud Drive). An SVG can't be kept in Photos
- Starting screen: the photo open, on the Overlay step, no logo placed
- Browser data: none for this site (a private window, or the site's data cleared)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Add logo** (the red button under the photo) | A menu rises from the bottom of the screen; among its choices are Photo Library and Choose File |
| 2 | Tap Photo Library | Your photos open |
| 3 | Choose the picture of the blue disc | The photos close; the blue disc shows in the middle of the photo |
| 4 | Tap **Replace logo** in the row of tools (the bottom row of buttons under the photo) | The same menu rises |
| 5 | Tap Choose File | Files opens |
| 6 | Choose overlay-split.svg | Files closes; a box twice as wide as it is high takes the disc's place, its left half black and its right half white |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screen recording.

### OVL-01.4 The limit reads in KB under 1 MB, and in MB to one decimal from 1 MB   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test, opened from a link that ends `index.html?overlay.maxBytes=100000` (a logo limit of 100,000 bytes, which is 97.66 KB)
- Photo: IMG_9136.JPEG from samples/
- Logo: big-logo.png, a file of exactly 2 MB (2,097,152 bytes) whose name ends .png: make one by renaming any file of that size (it is too big to keep in tests/fixtures/; the script makes its own)
- Starting screen: the photo open, on the Overlay step, no logo placed
- Browser data: none for this site (a private window, or the site's data cleared)

"The line above the controls" is the one line of text at the top of the block of buttons under the photo. "Add F": tap **Add logo** (the red button under the photo), then choose the file F in the file picker.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the line above the controls | It reads "Add a logo or watermark: PNG, WebP, JPG or SVG, up to 98 KB." |
| 2 | Add big-logo.png | A red message takes the line's place: "That file is 2.0 MB. The logo limit is 98 KB."; no logo is on the photo |
| 3 | A second or more later, go to the build's address with `?overlay.maxBytes=1572864` added to it (a logo limit of 1.5 MB) | The start screen asks "Resume IMG_9136.JPEG?", with **Resume** and **Start fresh** |
| 4 | Tap **Start fresh** | The question goes; **Open photo** shows |
| 5 | Tap **Open photo** and choose IMG_9136.JPEG | IMG_9136.JPEG opens on the Perspective step |
| 6 | Tap **Overlay** in the step tabs (the six tabs Perspective to Export, along the bottom) | The line above the controls reads "Add a logo or watermark: PNG, WebP, JPG or SVG, up to 1.5 MB." |
| 7 | Add big-logo.png | A red message takes the line's place: "That file is 2.0 MB. The logo limit is 1.5 MB."; no logo is on the photo |

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
- Cases: 7

### OVL-02.1 PNG, JPEG, WebP and SVG logos are each placed   [auto: phone, webkit]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logos, from tests/fixtures/: blue-disc.png; overlay-green-wide.jpg; overlay-blue-oval.webp; overlay-split.svg
- Starting screen: the photo open, on the Overlay step, no logo placed
- Browser data: none for this site (a private window, or the site's data cleared)

"Add F": tap **Add logo** (the red button under the photo), then choose the file F in the file picker. "Replace with F": tap **Replace logo** in the row of tools (the bottom row of buttons under the photo), then choose F.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Add blue-disc.png | A blue disc shows on the photo, in a square box |
| 2 | Replace with overlay-green-wide.jpg | A green box takes its place, three times as wide as it is high |
| 3 | Replace with overlay-blue-oval.webp | A blue oval takes its place, in a box half as wide as it is high |
| 4 | Replace with overlay-split.svg | A black and white box takes its place, twice as wide as it is high |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### OVL-02.2 A logo file with no picture type is taken by its name   [auto: phone]
Script only
Stand-in: the script hands the app blue-disc.png as a plain file of bytes, with no picture type of its own, so that only its name says it is a PNG. Some systems hand files over this way, but a person can't choose to.

Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: blue-disc.png from tests/fixtures/, with no picture type
- Starting screen: the photo open, on the Overlay step, no logo placed
- Browser data: none for this site (a private window, or the site's data cleared)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Add logo** (the red button under the photo) | The file picker opens |
| 2 | Choose blue-disc.png | The blue disc shows on the photo, with no message |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### OVL-02.3 A GIF is refused   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: logo.gif from tests/fixtures/
- Starting screen: the photo open, on the Overlay step, no logo placed
- Browser data: none for this site (a private window, or the site's data cleared)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Add logo** (the red button under the photo) | The file picker opens |
| 2 | Choose logo.gif | A red message takes the place of the hint in the line above the controls (the one line of text at the top of the block of buttons): "That file type isn’t supported. Use PNG, WebP, JPG or SVG."; no logo is on the photo |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### OVL-02.4 An SVG logo stays sharp in a large export   [auto: phone, webkit]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: overlay-split.svg from tests/fixtures/ (its left half black, its right half white)
- Starting screen: the photo open, on the Overlay step, no logo placed
- Browser data: none for this site (a private window, or the site's data cleared)

"Add F": tap **Add logo** (the red button under the photo), then choose the file F in the file picker.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Add overlay-split.svg | The logo shows in the middle of the photo: its left half black, its right half white |
| 2 | Hold **Larger** (the **+** key, right of the arrows) for about 2.5 s | The logo grows to the photo's full width and stops |
| 3 | Tap **Export** in the step tabs (the six tabs Perspective to Export, along the bottom) | The Export step shows |
| 4 | Tap **PNG** | PNG is selected |
| 5 | Tap **3000** | 3000 is selected; the size line (the line that gives the saved picture's size in px and its format) reads "Output", the crop's own size, then "px · PNG · full crop, not upscaled" |
| 6 | Tap **Download** | The question box (the box that appears over the dimmed photo with a question and two buttons) asks "Upscale to 3000 px?" |
| 7 | Tap **Yes** | A PNG of 3000 × 3000 px is saved |
| 8 | Open the file and zoom in on the middle of the logo, where black meets white | The edge is sharp: at most 2 px of gray between the black and the white |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### OVL-02.5 A logo's see-through parts stay see-through in the saved file   [auto: phone, webkit]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: blue-disc.png from tests/fixtures/ (a blue disc on a see-through square)
- Starting screen: the photo open, on the Overlay step, no logo placed
- Browser data: none for this site (a private window, or the site's data cleared)

"Save the photo": tap **Export** in the step tabs (the six tabs Perspective to Export, along the bottom), then tap **Download**. "Add F": tap **Add logo** (the red button under the photo), then choose the file F in the file picker.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Save the photo | The question box (the box that appears over the dimmed photo with a question and two buttons) asks "Upscale to 2000 px?" |
| 2 | Tap **No** | A first file is saved, with no logo |
| 3 | Tap **Overlay** in the step tabs | The Overlay step shows, with no logo |
| 4 | Add blue-disc.png | The blue disc shows in the middle of the photo |
| 5 | Save the photo | The question box asks "Upscale to 2000 px?" |
| 6 | Tap **No** | A second file is saved |
| 7 | Compare the two files just inside the top-left corner of the logo's square, outside the disc | That corner shows the photo, the same as in the first file; inside the disc the second file is blue |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### OVL-02.6 A large PNG logo stays sharp in a large export   [auto: phone, webkit]
The twin of OVL-02.7: the same logo with no cap lowered, to show the edge the cap softens.

Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: overlay-split-2048.png from tests/fixtures/ (2048 × 1024 px, its left half black and its right half white)
- Starting screen: the photo open, on the Overlay step, no logo placed
- Browser data: none for this site (a private window, or the site's data cleared)

"Add F": tap **Add logo** (the red button under the photo), then choose the file F in the file picker. "Save a PNG at 3000": tap **Export** in the step tabs (the six tabs Perspective to Export, along the bottom), tap **PNG**, tap **3000**, then tap **Download**.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Add overlay-split-2048.png | The logo shows in the middle of the photo: its left half black, its right half white |
| 2 | Hold **Larger** (the **+** key, right of the arrows) for about 2.5 s | The logo grows to the photo's full width and stops |
| 3 | Save a PNG at 3000 | The question box (the box that appears over the dimmed photo with a question and two buttons) asks "Upscale to 3000 px?" |
| 4 | Tap **Yes** | A PNG is saved; in it, across the logo's middle, the black turns white within 2 px |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### OVL-02.7 A logo larger than the cap is scaled down to it   [auto: phone, webkit]
The app scales a logo over 4096 px down to 4096 px, which the saved file can't show; a link lowers the cap to 256 px so that the scaling shows as a soft edge. OVL-02.6 is the same case with no cap lowered.

Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test, opened from a link that ends `index.html?overlay.maxPx=256` (a cap of 256 px)
- Photo: IMG_9136.JPEG from samples/
- Logo: overlay-split-2048.png from tests/fixtures/ (2048 × 1024 px, its left half black and its right half white)
- Starting screen: the photo open, on the Overlay step, no logo placed
- Browser data: none for this site (a private window, or the site's data cleared)

"Add F": tap **Add logo** (the red button under the photo), then choose the file F in the file picker. "Save a PNG at 3000": tap **Export** in the step tabs (the six tabs Perspective to Export, along the bottom), tap **PNG**, tap **3000**, then tap **Download**.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Add overlay-split-2048.png | The logo shows in the middle of the photo: its left half black, its right half white |
| 2 | Hold **Larger** (the **+** key, right of the arrows) for about 2.5 s | The logo grows to the photo's full width and stops |
| 3 | Save a PNG at 3000 | The question box (the box that appears over the dimmed photo with a question and two buttons) asks "Upscale to 3000 px?" |
| 4 | Tap **Yes** | A PNG is saved; in it, across the logo's middle, the edge between black and white is soft: 5 px of gray or more |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## OVL-03 Where a new logo lands

A newly added logo lands in the center of the frame, a quarter of its width, at 100% opacity, as one undo step. Each logo added is an undo step of its own, even two added within 0.9 s.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: 1.10.0
- Anchors: `#btnOverlayAdd`, `#overlayOpacityValue`
- Source: `js/app/overlay.js` (`place`, `defaultPlacement`); `js/engine.js` (`OVERLAY_DEFAULTS`)
- Ruling: R19. Each add is its own undo step; a drop accepts by extension like the picker (the drops are DND-01 and DND-04). The app does this since 1.10.0.
- Cases: 2

### OVL-03.1 A new logo lands in the middle, a quarter wide, at 100%   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: blue-disc.png from tests/fixtures/
- Starting screen: the photo open, on the Overlay step, no logo placed
- Browser data: none for this site (a private window, or the site's data cleared)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Add logo** (the red button under the photo) | The file picker opens |
| 2 | Choose blue-disc.png | The logo's middle is on the middle of the photo, its width a quarter of the photo's; the line above the controls (the one line of text at the top of the block of buttons under the photo) reads OPACITY 100% |
| 3 | Tap **Undo** (the arrow curving left, at the top right) once | The logo is gone and **Add logo** shows again |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### OVL-03.2 Two logos added within 0.9 s are two undo steps   [auto: phone]
Script only
Stand-in: the script adds the two logos through the file picker less than 0.9 s apart, and measures the gap between the two; a person can't open the picker and choose a file twice that fast.

Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logos: blue-disc.png and green-logo.png from tests/fixtures/
- Starting screen: the photo open, on the Overlay step, no logo placed
- Browser data: none for this site (a private window, or the site's data cleared)

"Add then replace, quickly": tap **Add logo** (the red button under the photo), choose blue-disc.png, tap **Replace logo** in the row of tools (the bottom row of buttons under the photo) and choose green-logo.png, so that the second logo is added less than 0.9 s after the first.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Add then replace, quickly | The green square has taken the blue disc's place, added less than 0.9 s after it |
| 2 | Tap **Undo** (the arrow curving left, at the top right) | The blue disc is back |

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
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photos: IMG_9136.JPEG and IMG_9075.JPEG from samples/
- Logo: blue-disc.png from tests/fixtures/
- Starting screen: IMG_9136.JPEG open, on the Overlay step, no logo placed
- Browser data: none for this site at the start (a private window, or the site's data cleared); adding the logo in row 1 saves it in this browser as the saved logo, and the changes in row 2 are saved with it

"Add F": tap **Add logo** (the red button under the photo), then choose the file F in the file picker. "Move and grow": tap **Move right** (the right arrow in the left-hand pad) ten times, then **Larger** (**+** in the right-hand pad) three times. "Open F": tap **Open** (the folder at the top left), then choose the file F.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Add blue-disc.png | The blue disc shows in the middle of the photo |
| 2 | Move and grow | The logo has moved right by a fifth of its first width, and grown by about a sixth |
| 3 | A second or more later, open IMG_9075.JPEG | IMG_9075.JPEG opens on the Perspective step |
| 4 | Tap **Overlay** in the step tabs (the six tabs Perspective to Export, along the bottom) | No logo is on the photo; a thumbnail of the blue disc and **Use saved overlay** show beside **Add logo** |
| 5 | Tap **Use saved overlay** | The blue disc shows as far right of the middle and as large as it was on the first photo; OPACITY reads 100% |
| 6 | Tap **Undo** (the arrow curving left, at the top right) once | The logo is gone; **Use saved overlay** shows again |

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
- Logo: blue-disc.png from tests/fixtures/
- Starting screen: the photo open, on the Overlay step, no logo placed
- Browser data: none for this site at the start (a private window, or the site's data cleared); adding the logo in the case saves it in this browser as the saved logo

"Add F": tap **Add logo** (the red button under the photo), then choose the file F in the file picker.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the controls (the block of buttons and sliders under the photo) | **Add logo** shows; no arrow pad |
| 2 | Add blue-disc.png | **Add logo** is gone; in its place a pad of four arrows on the left and a pad with **−** and **+** on the right |
| 3 | Tap **Remove** in the row of tools (the bottom row of buttons under the photo) | The pads are gone; **Add logo** shows again, with **Use saved overlay** beside it |

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
- Logo: blue-disc.png from tests/fixtures/
- Starting screen: the photo open, on the Overlay step, blue-disc.png added (in the middle, OPACITY 100%)
- Browser data: none for this site (a private window, or the site's data cleared)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Put a finger on the OPACITY slider's knob, at the right end, and slide it to the middle without lifting | The value beside it reads about 50%, and already the photo shows through the disc |
| 2 | Lift the finger | The value stays where it was |
| 3 | Tap **Undo** (the arrow curving left, at the top right) once | OPACITY reads 100% and the disc is solid blue again |

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
A logo a quarter of the photo wide moves a fiftieth of its own width per tap, too little to see, so each row taps ten times: a fifth of the logo's width.

Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: blue-disc.png from tests/fixtures/
- Starting screen: the photo open, on the Overlay step, blue-disc.png added (in the middle, a quarter of the photo's width)
- Browser data: none for this site (a private window, or the site's data cleared)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Move right** (the right arrow in the left-hand pad) ten times | The logo has moved right by a fifth of its own width (5% of the photo's width), its size kept |
| 2 | Tap **Move left** ten times | It is back in the middle |
| 3 | Tap **Move down** ten times | It has moved down by a fifth of its own width |
| 4 | Tap **Move up** ten times | It is back in the middle |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### OVL-07.2 Quick presses on the move pad are one undo step   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: blue-disc.png from tests/fixtures/
- Starting screen: the photo open, on the Overlay step, blue-disc.png added (in the middle)
- Browser data: none for this site (a private window, or the site's data cleared)

"Ten quick taps": tap **Move right** (the right arrow in the left-hand pad) ten times, less than 0.9 s between one tap and the next.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Ten quick taps | The logo has moved right by a fifth of its own width |
| 2 | Tap **Undo** (the arrow curving left, at the top right) once | The logo is back in the middle: all ten taps are taken back |
| 3 | Ten quick taps | The logo has moved right by a fifth of its width again |
| 4 | A second or more after the last tap, ten quick taps | It has moved right by two fifths of its width in all |
| 5 | Tap **Undo** once | Only the second ten are taken back: the logo is a fifth of its width right of the middle |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### OVL-07.3 Holding a move key keeps moving the logo   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: blue-disc.png from tests/fixtures/
- Starting screen: the photo open, on the Overlay step, blue-disc.png added (in the middle)
- Browser data: none for this site (a private window, or the site's data cleared)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Hold **Move right** (the right arrow in the left-hand pad) down for 1 s, then lift | The logo keeps moving while it is held, and ends at least an eighth of its own width right of the middle |
| 2 | Tap **Undo** (the arrow curving left, at the top right) once | The logo is back in the middle |

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
- Logo: blue-disc.png from tests/fixtures/
- Starting screen: the photo open, on the Overlay step, blue-disc.png added (in the middle)
- Browser data: none for this site (a private window, or the site's data cleared)

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
- Logo: blue-disc.png from tests/fixtures/
- Starting screen: the photo open, on the Overlay step, blue-disc.png added (in the middle)
- Browser data: none for this site (a private window, or the site's data cleared)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Hold **Larger** (**+** in the right-hand pad) down for 1 s, then lift | The logo keeps growing while it is held: at least six steps of 1.05 in all, so about a third wider |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### OVL-08.3 Quick presses on both pads are one undo step   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: blue-disc.png from tests/fixtures/
- Starting screen: the photo open, on the Overlay step, blue-disc.png added (in the middle)
- Browser data: none for this site (a private window, or the site's data cleared)

"Move then grow, quickly": tap **Move right** (the right arrow in the left-hand pad), then **Larger** (**+** in the right-hand pad), within 0.9 s.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Move then grow, quickly | The logo moves right and grows |
| 2 | Tap **Undo** (the arrow curving left, at the top right) once | Both are taken back: the logo is in the middle, a quarter of the photo's width |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## OVL-09 Replace logo

**Replace logo** opens the file picker; the new logo takes the old one's position, width and opacity, and becomes the saved logo. A new logo of another shape keeps the old one's middle and width, and is pulled inside the photo's edge where it would cross it. A logo dropped or pasted while one is placed does the same (DND-04.8).

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: 1.10.0
- Anchors: `#toolOverlayReplace`, "Choose another logo"
- Source: `js/app/overlay.js` (`bindOverlayControls`, `addOverlayFile`, `place`, `setPlacement`, `saveToBrowser`); `js/engine.js` (`clampOverlay`)
- Ruling: R18. The replacement logo takes the old logo's position, width and opacity; a new logo of another shape keeps the old one's center and width, then is clamped inside the crop; a logo dropped or pasted on Overlay while one is placed is a replacement and does the same. The app does this since 1.10.0.
- Cases: 3

### OVL-09.1 A replacement logo takes the old one's place, width and opacity   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logos: blue-disc.png and green-logo.png from tests/fixtures/
- Starting screen: the photo open, on the Overlay step, blue-disc.png added (in the middle)
- Browser data: none for this site (a private window, or the site's data cleared)

"Change the logo": tap **Move right** (the right arrow in the left-hand pad) ten times, tap **Larger** (**+** in the right-hand pad) three times, then slide the OPACITY slider's knob from the right end to the middle. "Replace with F": tap **Replace logo** in the row of tools (the bottom row of buttons under the photo), then choose the file F in the file picker.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Change the logo | The blue disc is right of the middle, larger, and OPACITY reads about 50% |
| 2 | A second or more later, replace with green-logo.png | The green square takes the disc's place: as far right, as wide, and at the same opacity |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### OVL-09.2 The replacement becomes the saved logo   [auto: phone, webkit]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logos: blue-disc.png and green-logo.png from tests/fixtures/
- Starting screen: the photo open, on the Overlay step, blue-disc.png added a second or more ago
- Browser data: none for this site at the start (a private window, or the site's data cleared); adding blue-disc.png in the starting screen saved it in this browser as the saved logo

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Replace logo** in the row of tools (the bottom row of buttons under the photo) | The file picker opens |
| 2 | Choose green-logo.png | The green square takes the blue disc's place |
| 3 | Tap **Remove** | The logo is gone; the thumbnail beside **Use saved overlay** is the green square |
| 4 | Tap **Use saved overlay** | The green square is placed on the photo |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### OVL-09.3 A replacement of another shape keeps the old middle and width, pulled inside the photo's edge   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logos, from tests/fixtures/: blue-disc.png (square); overlay-green-wide.jpg (three times as wide as it is high); overlay-blue-oval.webp (twice as high as it is wide)
- Starting screen: the photo open, on the Overlay step, framed as a square (the 1:1 crop it opens with), blue-disc.png added (in the middle, a quarter of the photo's width)
- Browser data: none for this site (a private window, or the site's data cleared)

"Replace with F": tap **Replace logo** in the row of tools (the bottom row of buttons under the photo), then choose the file F in the file picker. Places are given as a share of the framed photo: across from its left edge, down from its top edge.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap the bottom-right ring (a white circle with a dot in it, near the photo's bottom-right corner) | The disc goes to the bottom-right corner: its middle is 84.5% across and 84.5% down, its right and bottom edges 3% of the photo's width in from the photo's |
| 2 | Replace with overlay-green-wide.jpg | A green box three times as wide as it is high, a quarter of the photo's width as the disc was, its middle where the disc's was: 84.5% across and 84.5% down |
| 3 | Replace with overlay-blue-oval.webp | A blue oval in a box a quarter of the photo's width and half its height, its middle still 84.5% across. Kept 84.5% down it would cross the photo's bottom edge, so it is pulled up: its bottom edge is on the photo's bottom edge and its middle is 75% down |

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
- Logo: blue-disc.png from tests/fixtures/
- Starting screen: the photo open, on the Overlay step, blue-disc.png added (in the middle)
- Browser data: none for this site (a private window, or the site's data cleared)

"Change the logo": tap **Move right** (the right arrow in the left-hand pad) ten times, tap **Larger** (**+** in the right-hand pad) three times, then slide the OPACITY slider's knob from the right end to the middle.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Change the logo | The logo is right of the middle, larger, and OPACITY reads about 50% |
| 2 | A second or more later, tap **Reset** in the row of tools (the bottom row of buttons under the photo) | The logo is in the middle of the photo, a quarter of its width; OPACITY reads 100% |
| 3 | Tap **Undo** (the arrow curving left, at the top right) once | The moved, larger, fainter logo is back |

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
- Logo: blue-disc.png from tests/fixtures/
- Starting screen: the photo open, on the Overlay step, blue-disc.png added
- Browser data: none for this site at the start (a private window, or the site's data cleared); adding blue-disc.png in the starting screen saved it in this browser as the saved logo

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Remove** in the row of tools (the bottom row of buttons under the photo) | The disc is gone from the photo; **Add logo** shows, with the disc's thumbnail and **Use saved overlay** beside it |
| 2 | Tap **Undo** (the arrow curving left, at the top right) once | The disc is back where it was |

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
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photos: IMG_9136.JPEG and IMG_9075.JPEG from samples/
- Logo: blue-disc.png from tests/fixtures/
- Starting screen: IMG_9136.JPEG open, on the Overlay step, blue-disc.png added a second or more ago
- Browser data: none for this site at the start (a private window, or the site's data cleared); adding blue-disc.png in the starting screen saved it in this browser as the saved logo, and the open photo is kept for Resume

"Open F": tap **Open photo**, then choose the file F in the file picker.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Delete saved** in the row of tools (the bottom row of buttons under the photo) | The disc stays on the photo; **Delete saved** is greyed out |
| 2 | Tap **Remove** | **Add logo** shows alone: no thumbnail, no **Use saved overlay** |
| 3 | Reload the page | The start screen asks "Resume IMG_9136.JPEG?", with **Resume** and **Start fresh** |
| 4 | Tap **Start fresh** | The question goes; **Open photo** shows |
| 5 | Open IMG_9075.JPEG | IMG_9075.JPEG opens on the Perspective step |
| 6 | Tap **Overlay** in the step tabs (the six tabs Perspective to Export, along the bottom) | No saved logo is offered: **Add logo** alone, and no row of tools |

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
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: blue-disc.png from tests/fixtures/
- Starting screen: the photo open, on the Overlay step, no logo placed
- Browser data: none for this site at the start (a private window, or the site's data cleared), so no logo is saved; adding the logo in row 2 saves it in this browser

"Add F": tap **Add logo** (the red button under the photo), then choose the file F in the file picker. The row of tools is the bottom row of buttons under the photo.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look under **Add logo** | No row of tools |
| 2 | Add blue-disc.png | A row of tools: **Replace logo**, **Reset**, **Remove** and **Delete saved**, none greyed out |
| 3 | Tap **Remove** | **Delete saved** alone |
| 4 | Tap **Use saved overlay** | All four tools again, none greyed out |
| 5 | Tap **Delete saved** | All four tools, **Delete saved** greyed out |
| 6 | Tap **Remove** | No row of tools |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## OVL-14 A logo file that can't be used

A file that can't be used puts a red message in place of the hint or **Opacity**. It clears when a logo is added or removed, the step is left, the logo's placement changes, or a pair switches side; a failed add leaves the current logo as it was.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: 1.10.0
- Anchors: `#overlayStatus`, "Couldn’t read that image. Try another PNG, WebP, JPG or SVG file.", " MB. The logo limit is "
- Source: `js/app/overlay.js` (`setMessage`, `addOverlayFile`, `overlayStateChanged`, `syncOverlay`); `js/app/shell.js` (`setTab`); `js/app/pair.js` (`applySide`)
- Ruling: R59. Messages say "logo" where they said "overlay"; button names are not touched. The app does this since 1.10.0.
- Cases: 4

### OVL-14.1 A file that isn't a picture gets a red message in place of the hint   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logos: not-a-logo.png (a text file named like a PNG) and blue-disc.png, from tests/fixtures/
- Starting screen: the photo open, on the Overlay step, no logo placed
- Browser data: none for this site (a private window, or the site's data cleared)

"Add F": tap **Add logo** (the red button under the photo), then choose the file F in the file picker.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Add not-a-logo.png | A red message takes the hint's place in the line above the controls (the one line of text at the top of the block of buttons under the photo): "Couldn’t read that image. Try another PNG, WebP, JPG or SVG file."; no logo |
| 2 | Add blue-disc.png | The message has gone; the disc shows, with OPACITY in the line above the controls |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### OVL-14.2 A file over 5 MB is refused and the logo stays   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logos: blue-disc.png from tests/fixtures/; big-logo.png, a file of exactly 6 MB (6,291,456 bytes) whose name ends .png: make one by renaming any file of that size (it is too big to keep in tests/fixtures/; the script makes its own)
- Starting screen: the photo open, on the Overlay step, blue-disc.png added
- Browser data: none for this site (a private window, or the site's data cleared)

"Replace with F": tap **Replace logo** in the row of tools (the bottom row of buttons under the photo), then choose the file F in the file picker.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Replace with big-logo.png | A red message takes OPACITY's place: "That file is 6.0 MB. The logo limit is 5 MB."; the disc stays as it was |
| 2 | Tap **Move right** (the right arrow in the left-hand pad) | The disc moves; the message has gone and OPACITY shows again |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### OVL-14.3 The message goes when the logo is removed or the step is left   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logos: blue-disc.png and not-a-logo.png (a text file named like a PNG), from tests/fixtures/
- Starting screen: the photo open, on the Overlay step, blue-disc.png added
- Browser data: none for this site (a private window, or the site's data cleared)

"Add F": tap **Add logo** (the red button under the photo), then choose the file F in the file picker. "Replace with F": tap **Replace logo** in the row of tools (the bottom row of buttons under the photo), then choose F.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Replace with not-a-logo.png | A red message reads "Couldn’t read that image. Try another PNG, WebP, JPG or SVG file." |
| 2 | Tap **Remove** in the row of tools | The message has gone; the hint shows |
| 3 | Add not-a-logo.png | The same red message shows |
| 4 | Tap **Export** in the step tabs (the six tabs Perspective to Export, along the bottom) | The Export step shows |
| 5 | Tap **Overlay** in the step tabs | The message has gone; the hint shows |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### OVL-14.4 The message goes when a pair switches side   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Logo: not-a-logo.png from tests/fixtures/ (a text file named like a PNG)
- Starting screen: a pair: the front opened, then the back added with **Add back** on Export; the back is open
- Browser data: none for this site (a private window, or the site's data cleared)

"Add F": tap **Add logo** (the red button under the photo), then choose the file F in the file picker.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Overlay** in the step tabs (the six tabs Perspective to Export, along the bottom) | The back's Overlay step, with the hint |
| 2 | Add not-a-logo.png | A red message reads "Couldn’t read that image. Try another PNG, WebP, JPG or SVG file." |
| 3 | Tap **Front** in the top bar | The front's Overlay step shows the hint and no message |

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
- Ruling: R84. On Overlay the photo is locked: with no logo placed, every touch and the wheel do nothing. The app already does this.
- Cases: 3

### OVL-15.1 A drag and a pinch on the photo move the logo, not the photo   [auto: phone, webkit]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px (drag and pinch with fingers)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: blue-disc.png from tests/fixtures/
- Starting screen: the photo open, on the Overlay step, blue-disc.png added
- Browser data: none for this site (a private window, or the site's data cleared)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Drag a finger 60 px right and 40 px down, starting on the photo's lower left, away from the logo and the rings | The logo moves 60 px right and 40 px down; the photo doesn't move |
| 2 | Pinch two fingers apart on the photo's lower left | The logo grows; the photo doesn't zoom |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### OVL-15.2 With no logo placed, a drag and a pinch do nothing   [auto: phone]

Before you start:
- Device and browser: a phone-width window, 390 × 844 px (drag and pinch with fingers)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the photo open, on the Overlay step, no logo placed; **Undo** (the arrow curving left, at the top right) greyed out
- Browser data: none for this site (a private window, or the site's data cleared)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Drag a finger 60 px right and 40 px down on the photo | The photo stays where it was, at the same size; **Undo** is still greyed out |
| 2 | Pinch two fingers apart on the photo | The photo doesn't zoom: it stays at the same size; **Undo** is still greyed out |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### OVL-15.3 The mouse wheel never zooms the photo here   [auto: desktop]

Before you start:
- Device and browser: a computer with a mouse; a wide window, 1280 × 800 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: blue-disc.png from tests/fixtures/
- Starting screen: the photo open, on the Overlay step, no logo placed
- Browser data: none for this site (a private window, or the site's data cleared)

"Add F": click **Add logo** (the red button in the panel at the right), then choose the file F in the file dialog.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Point at the photo and roll the wheel away from you | Nothing changes: the photo doesn't zoom |
| 2 | Add blue-disc.png | The blue disc shows in the middle of the photo |
| 3 | Point at the photo's lower left and roll the wheel away from you again | The photo still doesn't zoom |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## OVL-16 Drag to move the logo

Dragging anywhere on the photo, except on one of the logo's corner handles, moves the logo, as one undo step.

- Risk: high
- Check: script, touch
- Layout: both
- Added: 1.10 baseline
- Changed: 1.10.0
- Anchors: "Tap a ring to snap the logo to that corner, side or the center."
- Source: `js/app/overlay.js` (`overlayPointerDown`, `gesturePlacement`, `overlayPointerMove`); `js/app/input.js` (`onPointerDown`, `onPointerMove`, `onPointerUp`, `onPointerCancel`)
- Ruling: R8. A cancelled drag puts the logo back, with no undo step. The app does this since 1.10.0.
- Cases: 3

### OVL-16.1 Dragging the logo moves it, one undo step   [auto: phone, webkit]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px (drag with a finger)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: blue-disc.png from tests/fixtures/
- Starting screen: the photo open, on the Overlay step, blue-disc.png added (in the middle)
- Browser data: none for this site (a private window, or the site's data cleared)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Put a finger on the disc, left of its middle ring, drag 60 px right and 40 px down, and lift | The logo moves with the finger, 60 px right and 40 px down, its size kept |
| 2 | Tap **Undo** (the arrow curving left, at the top right) once | The logo is back in the middle |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### OVL-16.2 A drag away from the logo moves it too   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px (drag with a finger)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: blue-disc.png from tests/fixtures/
- Starting screen: the photo open, on the Overlay step, blue-disc.png added (in the middle)
- Browser data: none for this site (a private window, or the site's data cleared)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Drag a finger 40 px left and 60 px up, starting on the photo's lower left, away from the logo and the rings | The logo moves 40 px left and 60 px up |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### OVL-16.3 A logo drag the browser cancels puts the logo back   [auto: phone]
Script only
Stand-in: the script sends the browser's "touch cancelled" signal in the middle of the drag, with the finger still down, as an iPhone does when Control Center takes the touch. A person can't make a browser on a computer cancel a touch.

Adding the logo is itself one undo step, so **Undo** is not greyed out before the drag; row 3 shows the cancelled drag added no step of its own.

Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with touch
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: blue-disc.png from tests/fixtures/
- Starting screen: the photo open, on the Overlay step, blue-disc.png added (in the middle)
- Browser data: none for this site (a private window, or the site's data cleared)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Put a finger on the disc, left of its middle ring, and drag 60 px right and 40 px down, without lifting | The logo follows the finger, 60 px right and 40 px down |
| 2 | The browser cancels the touch, with the finger still down (the stand-in) | The logo is back in the middle, where it was before the drag |
| 3 | Tap **Undo** (the arrow curving left, at the top right) once | The logo is gone and **Add logo** shows again: the one undo step is the one adding the logo made |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## OVL-17 Drag a corner to resize

A press within 24 px of one of the logo's corner handles, then a drag, resizes the logo with its shape kept and the opposite corner fixed, never narrower than 8 px. A corner handle wins over a ring under it.

- Risk: medium
- Check: script, touch
- Layout: both
- Added: 1.10 baseline
- Changed: 1.10.0
- Anchors: `CONFIG.handle.hitRadius`, "drag a corner or pinch to resize."
- Source: `js/app/overlay.js` (`hitCorner`, `overlayPointerDown`, `gesturePlacement`); `js/app/input.js` (`onPointerCancel`); `js/engine.js` (`clampOverlay`)
- Ruling: R8. A cancelled corner drag puts the logo back as it was, with no undo step. The app does this since 1.10.0.
- Cases: 3

### OVL-17.1 Dragging a corner resizes the logo, its shape and the far corner kept   [auto: phone, webkit]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px (drag with a finger)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: blue-disc.png from tests/fixtures/
- Starting screen: the photo open, on the Overlay step, blue-disc.png added (in the middle)
- Browser data: none for this site (a private window, or the site's data cleared)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Drag the logo's bottom-right handle (the white square on its corner) 40 px right and 20 px down | The logo is 40 px wider and 40 px higher, still square; its top-left corner hasn't moved |
| 2 | Tap **Undo** (the arrow curving left, at the top right) once | The logo is its first size |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### OVL-17.2 A corner drag never makes the logo narrower than 8 px   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px (drag with a finger)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: blue-disc.png from tests/fixtures/
- Starting screen: the photo open, on the Overlay step, blue-disc.png added (in the middle)
- Browser data: none for this site (a private window, or the site's data cleared)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Drag the bottom-right handle up and left, 80 px past the top-left handle | The logo shrinks to a speck 8 px of the photo wide (under 3 px on the screen), its top-left corner where it was |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### OVL-17.3 A corner handle near a ring wins over the ring   [auto: phone]
After a snap to the top-left ring, the logo's top-left handle (a white square) sits between the ring and the photo's corner, touching the ring: a press there is within reach of both.

Before you start:
- Device and browser: a phone-width window, 390 × 844 px (tap and drag with a finger)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: blue-disc.png from tests/fixtures/
- Starting screen: the photo open, on the Overlay step, blue-disc.png added (in the middle)
- Browser data: none for this site (a private window, or the site's data cleared)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap the top-left ring (a white circle with a dot in it, near the photo's top-left corner) | The logo snaps to the photo's top-left corner; its top-left handle sits between the ring and the photo's corner, touching the ring |
| 2 | Put a finger where the handle touches the ring, drag 20 px right and 20 px down, and lift | The logo is resized, smaller, its bottom-right corner where it was: the handle took the press, not the ring |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## OVL-18 Pinch to resize

A two-finger pinch resizes and moves the logo; if one finger lifts, the other carries on moving it. The whole gesture is one undo step.

- Risk: medium
- Check: script, touch; phone (Safari's own page zoom)
- Layout: both, on a touch screen.
- Added: 1.10 baseline
- Changed: 1.10.0
- Anchors: "drag a corner or pinch to resize."
- Source: `js/app/overlay.js` (`overlayPointerDown`, `gesturePlacement`, `overlayPinchEnded`); `js/app/input.js` (`onPointerCancel`)
- Ruling: R8. A cancelled pinch puts the logo back as it was, with no undo step. The app does this since 1.10.0.
- Cases: 3

### OVL-18.1 A pinch resizes the logo, one undo step   [auto: phone, webkit]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px (pinch with two fingers)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: blue-disc.png from tests/fixtures/
- Starting screen: the photo open, on the Overlay step, blue-disc.png added (in the middle)
- Browser data: none for this site (a private window, or the site's data cleared)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Put two fingers 40 px apart on the logo's middle and spread them to 100 px apart | The logo is 2.5 times as wide, its middle where it was |
| 2 | Tap **Undo** (the arrow curving left, at the top right) once | The logo is its first size |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### OVL-18.2 After one finger lifts, the other moves the logo on   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px (two fingers)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: blue-disc.png from tests/fixtures/
- Starting screen: the photo open, on the Overlay step, blue-disc.png added (in the middle)
- Browser data: none for this site (a private window, or the site's data cleared)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Put two fingers on the logo, spread them apart, and lift the right one | The logo is larger |
| 2 | Without lifting the left finger, slide it 60 px right, then lift it | The logo moves 60 px right with the finger, its size kept |
| 3 | Tap **Undo** (the arrow curving left, at the top right) once | The whole gesture is taken back: the logo is its first size, in the middle |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### OVL-18.3 On an iPhone a pinch on the logo never zooms the page   [phone]
Before you start:
- Device and browser: an iPhone, Safari
- Build: the UAT site, https://rberrill.github.io/p1hunt_card_finisher_uat/
- Photo: IMG_9136.JPEG from your photos (copied from samples/)
- Logo: blue-disc.png from tests/fixtures/, saved to Photos
- Starting screen: the photo open, on the Overlay step, blue-disc.png added (in the middle)
- Browser data: none for this site (a private window, or the site's data cleared)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Put two fingers close together on the logo and spread them apart | The logo grows; the page itself (the top bar, the buttons under the photo and the step tabs along the bottom) stays the same size |
| 2 | Put two fingers apart on the logo and pinch them together | The logo shrinks; the page doesn't zoom out |
| 3 | Pinch two fingers apart on the photo's lower left, away from the logo | The logo grows; the page doesn't zoom |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screen recording.

## OVL-19 Nine snap rings

Nine rings sit on the photo, at the four corners, the four side middles and the center, 28 px in from the frame's edges.

- Risk: low
- Check: eye; script (the rings' places)
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.overlay.hotSpotInset`
- Source: `js/app/overlay.js` (`hotSpots`, `drawHotSpots`)
- Cases: 1

### OVL-19.1 Nine rings on the photo, for a person to judge   [eye]
The places in row 2 are measured by the script, on the screen in CSS px: at each place 28 px in, it finds a ring's white dot, with the ring's dark outline 12.5 px to its left. A person can measure them on the screenshot.

Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: blue-disc.png from tests/fixtures/
- Starting screen: the photo open, on the Overlay step, blue-disc.png added (in the middle)
- Browser data: none for this site (a private window, or the site's data cleared)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the framed photo | Nine white rings, each with a dot in it: at the four corners, the middles of the four sides and the center, each the same small distance in from the edges; the center ring sits on the middle of the logo |
| 2 | Measure from each ring's dot to the framed photo's edges | Each corner ring's dot is 28 px in from both edges by its corner; each side ring's dot is 28 px in from its edge and midway along it; the center ring's dot is on the frame's middle |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## OVL-20 Tap a ring to snap

A still tap on a ring snaps the logo there, 3% of the frame's width in from the edges (the center ring centers it), as one undo step. The logo glides there on screen (OVL-22); **Undo** and a file saved straight after the tap already have the new place.

- Risk: high
- Check: script, touch
- Layout: both
- Added: 1.10 baseline
- Changed: 1.10.0
- Anchors: "Tap a ring to snap the logo to that corner, side or the center."
- Source: `js/app/overlay.js` (`hitSpot`, `overlaySpotTap`); `js/app/input.js` (`onPointerCancel`); `js/engine.js` (`snapOverlay`)
- Ruling: R8. A press on a ring that the browser cancels does not snap the logo, and makes no undo step. The app does this since 1.10.0.
- Cases: 2

### OVL-20.1 Tapping a corner ring snaps the logo there, one undo step   [auto: phone, webkit]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px (tap with a finger)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: blue-disc.png from tests/fixtures/
- Starting screen: the photo open, on the Overlay step, blue-disc.png added (in the middle)
- Browser data: none for this site (a private window, or the site's data cleared)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap the top-right ring (a white circle with a dot in it, near the photo's top-right corner) | The logo goes to the top-right corner; its top and right edges end 3% of the photo's width in from the top and right |
| 2 | Tap **Undo** (the arrow curving left, at the top right) once | The logo is back in the middle |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### OVL-20.2 The bottom ring and the center ring   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px (tap with a finger)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: blue-disc.png from tests/fixtures/
- Starting screen: the photo open, on the Overlay step, blue-disc.png added (in the middle)
- Browser data: none for this site (a private window, or the site's data cleared)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap the ring at the middle of the bottom edge (a white circle with a dot in it) | The logo is centered across the photo, its bottom edge 3% of the photo's width up from the bottom |
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
- Logo: blue-disc.png from tests/fixtures/
- Starting screen: the photo open, on the Overlay step, blue-disc.png added (in the middle)
- Browser data: none for this site (a private window, or the site's data cleared)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Put a finger on the ring at the middle of the left edge (a white circle with a dot in it), drag 60 px right, and lift | The logo moves 60 px right; it doesn't snap to the left |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## OVL-22 Rings fade and the logo glides

The rings fade out while a gesture runs and back in after it; a tapped ring lights for 180 ms while the logo glides to its snapped place. Under reduced motion the logo jumps there.

- Risk: low
- Check: eye; script (the glide); phone (the lit ring)
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: none
- Source: `js/app/overlay.js` (`aimRings`, `ringAlphaAt`, `areRingsWanted`, `drawnPlacement`, `litSpotAt`)
- Ruling: R71. Under reduced motion the **Before levels** badge still fades, the snap rings don't, and one fade is 60 ms. The app already does this.
- Cases: 4

### OVL-22.1 The rings fade during a drag, for a person to judge   [eye]
The ring lit by a tap lasts 180 ms, too short for a screenshot; it is checked on an iPhone in OVL-22.3.

Before you start:
- Device and browser: a phone-width window, 390 × 844 px (drag with a finger)
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: blue-disc.png from tests/fixtures/
- Starting screen: the photo open, on the Overlay step, blue-disc.png added (in the middle)
- Browser data: none for this site (a private window, or the site's data cleared)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Put a finger on the disc and drag 60 px right and 40 px down, and hold it there | The logo follows the finger; no rings show on the photo; the logo's dashed box and four handles do |
| 2 | Lift the finger and wait half a second | The nine rings are back |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### OVL-22.2 Under reduced motion a tapped ring moves the logo at once   [auto: phone]
Script only
Stand-in: the script sets the browser to reduce motion and reads the picture the app draws in the frame right after the tap; a person can't see a single frame (about a sixtieth of a second).


Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with the browser set to reduce motion
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: blue-disc.png from tests/fixtures/
- Starting screen: the photo open, on the Overlay step, blue-disc.png added (in the middle)
- Browser data: none for this site (a private window, or the site's data cleared)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap the bottom-right ring (a white circle with a dot in it, near the photo's bottom-right corner) | In the very next frame the logo is already in the bottom-right corner, with no glide |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### OVL-22.3 On an iPhone a tapped ring lights up as the logo glides to it   [phone]
Before you start:
- Device and browser: an iPhone, Safari, with Reduce Motion off (Settings, Accessibility, Motion)
- Build: the UAT site, https://rberrill.github.io/p1hunt_card_finisher_uat/
- Photo: IMG_9136.JPEG from your photos (copied from samples/)
- Logo: blue-disc.png from tests/fixtures/, saved to Photos
- Starting screen: the photo open, on the Overlay step, blue-disc.png added (in the middle)
- Browser data: none for this site (a private window, or the site's data cleared)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap the top-right ring (a white circle with a dot in it, near the photo's top-right corner) | The ring flashes brighter, filled with white, and the logo glides to the top-right corner in about a fifth of a second; it doesn't jump |
| 2 | Tap the center ring | The center ring flashes the same way, and the logo glides back to the middle |
| 3 | Put a finger on the logo and drag it slowly to the left without lifting | The nine rings fade out as the finger moves |
| 4 | Lift the finger | The rings fade back in |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screen recording.

### OVL-22.4 A tapped ring glides the logo there, not at once   [auto: phone]
Script only
Stand-in: the script reads the picture the app draws in the frame right after the tap; a person can't see a single frame (about a sixtieth of a second).

Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with motion not reduced
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: blue-disc.png from tests/fixtures/
- Starting screen: the photo open, on the Overlay step, blue-disc.png added (in the middle)
- Browser data: none for this site (a private window, or the site's data cleared)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap the bottom-right ring (a white circle with a dot in it, near the photo's bottom-right corner) | In the very next frame the logo is still on its way: the place where it will sit doesn't show the blue disc yet |
| 2 | Wait half a second | The blue disc sits in the bottom-right corner |

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
- Logo: blue-disc.png from tests/fixtures/
- Starting screen: the photo open, on the Overlay step, blue-disc.png added (in the middle)
- Browser data: none for this site (a private window, or the site's data cleared)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the logo | A dashed white box around the blue disc, and a small white square handle on each of its four corners |
| 2 | Tap **Export** in the step tabs (the six tabs Perspective to Export, along the bottom) | The blue disc alone: no box, no handles and no rings |

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
- Logo: blue-disc.png from tests/fixtures/
- Starting screen: the photo open, on the Overlay step, blue-disc.png added
- Browser data: none for this site (a private window, or the site's data cleared)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the photo | The blue disc shows |
| 2 | Tap **Perspective** in the step tabs (the six tabs Perspective to Export, along the bottom) | No logo shows |
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
- Logo: blue-disc.png from tests/fixtures/
- Starting screen: the photo open, on the Overlay step, blue-disc.png added
- Browser data: none for this site (a private window, or the site's data cleared)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Slide the OPACITY slider's knob all the way left | It reads 0% |
| 2 | Tap **Export** in the step tabs (the six tabs Perspective to Export, along the bottom) | No logo shows on the photo |
| 3 | Tap **Overlay** in the step tabs | The Overlay step shows; OPACITY reads 0% |
| 4 | Slide the knob to the middle | OPACITY reads about 50% |
| 5 | Tap **Export** | The disc shows half see-through: the photo shows through it, tinted blue, neither solid blue nor the photo alone |

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
- Logo: blue-disc.png from tests/fixtures/
- Starting screen: the photo open, on the Overlay step, blue-disc.png added (in the middle)
- Browser data: none for this site (a private window, or the site's data cleared)

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
- Logo: overlay-tall-oval.png from tests/fixtures/ (100 × 400 px, see-through except for a blue oval)
- Starting screen: the photo open, on the Crop step
- Browser data: none for this site (a private window, or the site's data cleared)

"Add F": tap **Add logo** (the red button under the photo), then choose the file F in the file picker.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **5:7 card** | The crop box is taller than wide |
| 2 | Tap **Overlay** in the step tabs (the six tabs Perspective to Export, along the bottom) | The photo is framed taller than wide, with no logo |
| 3 | Add overlay-tall-oval.png | The tall oval shows in the middle |
| 4 | Hold **Larger** (**+** in the right-hand pad) for 1 s | The logo grows until it is as high as the framed photo, then stops |
| 5 | Tap **Crop** in the step tabs | The Crop step shows |
| 6 | Tap **1:1** | 1:1 is selected; the crop box is square |
| 7 | Tap **Overlay** in the step tabs | The logo is smaller: still as high as the framed photo, and wholly inside it |

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
- Logo: blue-disc.png from tests/fixtures/
- Starting screen: the photo open, on the Overlay step, blue-disc.png added (in the middle)
- Browser data: none for this site (a private window, or the site's data cleared)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Point at the photo's lower left and roll the wheel one notch away from you | The logo grows |
| 2 | At once, roll it two notches toward you | The logo is a little smaller than at first |
| 3 | A second or more later, click **Undo** (the arrow curving left, at the top right) once | The logo is its first size: the three rolls were one undo step |

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
- Logo: blue-disc.png from tests/fixtures/
- Starting screen: the photo open, on the Overlay step, blue-disc.png added (in the middle)
- Browser data: none for this site (a private window, or the site's data cleared)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Point at the logo's bottom-right handle (the white square on its corner) | A diagonal resize arrow, top-left to bottom-right |
| 2 | Point at its top-right handle | The other diagonal resize arrow |
| 3 | Point at the top-left ring (a white circle with a dot in it) | A pointing hand |
| 4 | Point at the photo's lower left, away from the logo and the rings | The move cursor (four arrows) |
| 5 | Click **Remove** (in the bottom row of buttons in the panel at the right) | The logo is gone from the photo |
| 6 | Point at the photo's lower left again | The plain arrow |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## OVL-28 The saved logo is kept up to date

Adding a logo by the button, a drop or a paste makes it the saved logo. While the placed logo is the saved one, its position, size and opacity are saved again 100 ms after each change.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: 1.10.0
- Anchors: `CONFIG.session.saveDelayMs`, "This logo works on this photo, but it can’t be saved in this browser."
- Source: `js/app/overlay.js` (`addOverlayFile`, `saveToBrowser`, `overlayStateChanged`)
- Ruling: R64. This message explains a result that would otherwise look like a fault, so it needs no next step. The app already does this. R59. Messages say "logo" where they said "overlay"; button names are not touched. The app does this since 1.10.0. R36. Changes are saved sooner (about 0.1 s after each); the saved logo's position, size and opacity share that wait. The app does this since 1.10.0.
- Cases: 4

### OVL-28.1 A change to the saved logo's place is kept in the browser   [auto: phone, webkit]
The page is reloaded so that what **Use saved overlay** places comes from what the browser stored, not from what the open page remembers.

Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photos: IMG_9136.JPEG and IMG_9075.JPEG from samples/
- Logo: blue-disc.png from tests/fixtures/
- Starting screen: IMG_9136.JPEG open, on the Overlay step, no logo placed
- Browser data: none for this site at the start (a private window, or the site's data cleared); adding the logo in row 1 saves it in this browser as the saved logo, and the move in row 2 is saved with it

"Add F": tap **Add logo** (the red button under the photo), then choose the file F in the file picker. "Open F": tap **Open photo**, then choose the file F in the file picker.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Add blue-disc.png | The blue disc shows in the middle of the photo |
| 2 | A second or more later, tap **Move right** (the right arrow in the left-hand pad) ten times | The logo has moved right by a fifth of its own width |
| 3 | A second or more later, reload the page | The start screen asks "Resume IMG_9136.JPEG?", with **Resume** and **Start fresh** |
| 4 | Tap **Start fresh** | The question goes; **Open photo** shows |
| 5 | Open IMG_9075.JPEG | IMG_9075.JPEG opens on the Perspective step |
| 6 | Tap **Overlay** in the step tabs (the six tabs Perspective to Export, along the bottom) | No logo is on the photo; the disc's thumbnail and **Use saved overlay** show beside **Add logo** |
| 7 | Tap **Use saved overlay** | The blue disc shows a fifth of its width right of the middle, where it was moved to on the first photo |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### OVL-28.2 A logo the browser won't keep still goes on the photo   [auto: phone]
Script only
Stand-in: the script makes the browser refuse to store the saved logo, as a full storage would; a person can't make a browser's storage refuse on demand.


Before you start:
- Device and browser: a phone-width window, 390 × 844 px, with the browser refusing to store the saved logo
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: blue-disc.png from tests/fixtures/
- Starting screen: the photo open, on the Overlay step, no logo placed
- Browser data: none for this site, and none can be stored as the saved logo

"Add F": tap **Add logo** (the red button under the photo), then choose the file F in the file picker.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Add blue-disc.png | The disc shows on the photo; an amber warning reads "This logo works on this photo, but it can’t be saved in this browser." |
| 2 | Tap **Remove** in the row of tools (the bottom row of buttons under the photo) | **Add logo** shows, with no **Use saved overlay** |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### OVL-28.3 After Delete saved, moving the logo saves nothing   [auto: phone]
The page is reloaded so that what is offered comes from what the browser stored, not from what the open page remembers.

Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photos: IMG_9136.JPEG and IMG_9075.JPEG from samples/
- Logo: blue-disc.png from tests/fixtures/
- Starting screen: IMG_9136.JPEG open, on the Overlay step, blue-disc.png added a second or more ago
- Browser data: none for this site at the start (a private window, or the site's data cleared); adding blue-disc.png in the starting screen saved it in this browser as the saved logo

"Open F": tap **Open photo**, then choose the file F in the file picker.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Delete saved** in the row of tools (the bottom row of buttons under the photo) | The disc stays on the photo; **Delete saved** is greyed out |
| 2 | Tap **Move right** (the right arrow in the left-hand pad) ten times | The logo has moved right by a fifth of its own width |
| 3 | A second or more later, reload the page | The start screen asks "Resume IMG_9136.JPEG?", with **Resume** and **Start fresh** |
| 4 | Tap **Start fresh** | The question goes; **Open photo** shows |
| 5 | Open IMG_9075.JPEG | IMG_9075.JPEG opens on the Perspective step |
| 6 | Tap **Overlay** in the step tabs (the six tabs Perspective to Export, along the bottom) | No saved logo is offered: **Add logo** alone, with no thumbnail and no **Use saved overlay** |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### OVL-28.4 A change to the saved logo's place is stored 0.1 s later, once   [auto: phone, webkit]
Script only
Stand-in: the script records each time the app stores the saved logo in the browser, and when; a person can't see a save, or time one to a tenth of a second. What the save brings back after a reload is OVL-28.1.

Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: blue-disc.png from tests/fixtures/
- Starting screen: the photo open, on the Overlay step, no logo placed
- Browser data: none for this site at the start (a private window, or the site's data cleared); adding the logo in row 1 stores it in this browser as the saved logo

"Add F": tap **Add logo** (the red button under the photo), then choose the file F in the file picker.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Add blue-disc.png | The logo is stored in the browser as the saved logo, in the middle |
| 2 | A second or more later, tap **Move right** (the right arrow in the left-hand pad) | The new place is stored as the saved logo's once, 0.1 s after the tap and not before |

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
The logo is a dark gray and a light gray, which the levels Auto sets on this photo would change (gray 30 to black, gray 220 lighter); a pure color such as pure green comes through any levels unchanged, so it could not show the difference. This case is also where Levels' own check that levels never reach the logo lives (LEV-21.2 was retired into it).

Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: overlay-dark-and-light-grays.png from tests/fixtures/ (400 × 400 px, its left half gray 30 and its right half gray 220, on a scale of 0 to 255)
- Starting screen: the photo open, on the Overlay step, no logo placed
- Browser data: none for this site (a private window, or the site's data cleared)

"Add F": tap **Add logo** (the red button under the photo), then choose the file F in the file picker. "Save a PNG at 2000": tap **Export** in the step tabs (the six tabs Perspective to Export, along the bottom), tap **PNG**, tap **2000**, then tap **Download**.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Add overlay-dark-and-light-grays.png | The two-gray square shows in the middle |
| 2 | Save a PNG at 2000 | The question box (the box that appears over the dimmed photo with a question and two buttons) asks "Upscale to 2000 px?" |
| 3 | Tap **No** | A first PNG is saved |
| 4 | Tap **Levels** in the step tabs | The Levels step shows |
| 5 | Tap **Auto** | A white dot shows on the **Levels** tab: levels are set but not applied |
| 6 | Tap **Apply** | The dot on the **Levels** tab has gone; **Apply** is greyed out |
| 7 | Save a PNG at 2000 | The question box asks "Upscale to 2000 px?" |
| 8 | Tap **No** | A second PNG is saved |
| 9 | Compare the two PNGs at the photo just left of the logo, and in the middle of each half of the logo | Beside the logo the second PNG is lighter than the first; the logo's halves are gray 30 and gray 220 in both, to within 1 |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### OVL-29.2 The upscale's sharpening never touches the logo   [auto: phone, webkit]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: overlay-greys.png from tests/fixtures/ (400 × 400 px, its left half gray 100 and its right half gray 150, on a scale of 0 to 255)
- Starting screen: the photo open, on the Overlay step, no logo placed
- Browser data: none for this site (a private window, or the site's data cleared)

"Add F": tap **Add logo** (the red button under the photo), then choose the file F in the file picker. "Save a PNG at 3000": tap **Export** in the step tabs (the six tabs Perspective to Export, along the bottom), tap **PNG**, tap **3000**, then tap **Download**.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Add overlay-greys.png | The two-gray square shows in the middle |
| 2 | Save a PNG at 3000 | The question box (the box that appears over the dimmed photo with a question and two buttons) asks "Upscale to 3000 px?" |
| 3 | Tap **Yes** | A PNG of 3000 × 3000 px is saved |
| 4 | Look across the logo's middle in the file | No px is more than 6 darker than gray 100 or more than 6 lighter than gray 150: no sharpening halo along the edge between the two grays (the browser's own enlarging of the logo strays up to 4; the photo's sharpening, put on the logo, would stray 11 or more) |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### OVL-29.3 The logo keeps its place in the photo at every Size   [auto: phone, webkit]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: green-logo.png from tests/fixtures/ (400 × 400 px, pure green)
- Starting screen: the photo open, on the Overlay step, no logo placed
- Browser data: none for this site (a private window, or the site's data cleared)

"Add F": tap **Add logo** (the red button under the photo), then choose the file F in the file picker. "Save a PNG at 1080": tap **Export** in the step tabs (the six tabs Perspective to Export, along the bottom), tap **PNG**, tap **1080**, then tap **Download**.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Add green-logo.png | The green square shows in the middle |
| 2 | Tap the bottom-right ring (a white circle with a dot in it, near the photo's bottom-right corner) | The green square sits in the bottom-right corner |
| 3 | Save a PNG at 1080 | A PNG 1080 px wide is saved, with no question asked |
| 4 | Tap **Original** | Original is selected |
| 5 | Tap **Download** | A larger PNG is saved, with no question asked |
| 6 | Compare where the green square is in the two files | It takes the same share of the image, in the same place, within a pixel |

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
- Logo: blue-disc.png from tests/fixtures/
- Starting screen: IMG_9136.JPEG open, on the Overlay step, blue-disc.png added (in the middle)
- Browser data: none for this site at the start (a private window, or the site's data cleared); adding blue-disc.png in the starting screen saved it in this browser as the saved logo

"Open F": tap **Open** (the folder at the top left), then choose the file F in the file picker.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Move right** (the right arrow in the left-hand pad) ten times | The logo has moved right by a fifth of its own width |
| 2 | Tap **Undo** (the arrow curving left, at the top right) | The logo is back in the middle |
| 3 | Tap **Redo** (the arrow curving right) | It has moved right by a fifth of its width again |
| 4 | Open IMG_9075.JPEG | IMG_9075.JPEG opens on the Perspective step |
| 5 | Tap **Overlay** in the step tabs (the six tabs Perspective to Export, along the bottom) | No logo is placed on this photo; **Use saved overlay** is offered |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### OVL-30.2 Each side of a pair keeps its own logo place   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Logo: blue-disc.png from tests/fixtures/
- Starting screen: a pair: the front opened, then the back added with **Add back** on Export; the back is open
- Browser data: none for this site at the start (a private window, or the site's data cleared); adding the logo on the back in row 2 saves it in this browser as the saved logo, which the front then uses

"Add F": tap **Add logo** (the red button under the photo), then choose the file F in the file picker.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Overlay** in the step tabs (the six tabs Perspective to Export, along the bottom) | The back's Overlay step, with no logo |
| 2 | Add blue-disc.png | The logo shows in the middle of the back |
| 3 | Tap the top-left ring (a white circle with a dot in it, near the photo's top-left corner) | The logo sits top-left on the back |
| 4 | Tap **Front** in the top bar | The front's Overlay step, with no logo placed |
| 5 | Tap **Use saved overlay** | The logo shows on the front |
| 6 | Tap the bottom-right ring | The logo sits bottom-right on the front |
| 7 | Tap **Back** in the top bar | The back's logo is still top-left |
| 8 | Tap **Front** | The front's logo is still bottom-right |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## OVL-31 With invalid corners

With invalid corners, **Add logo**, **Use saved overlay** and **Replace logo** are greyed out, and the line above the controls reads "Fix the corners in Perspective first." Once the corners are valid again the three buttons work and the line goes.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: 1.10.0
- Anchors: `#btnOverlayAdd`, `#btnUseSaved`, `#toolOverlayReplace`, "Fix the corners in Perspective first."
- Source: `js/app/overlay.js` (`syncOverlay`, `syncOverlayTools`)
- Ruling: R11. With invalid corners, **Add logo**, **Use saved overlay** and **Replace logo** are dimmed and the line above the controls reads "Fix the corners in Perspective first." The app does this since 1.10.0.
- Cases: 2

### OVL-31.1 With crossed corners Add logo and Use saved overlay are greyed out   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: blue-disc.png from tests/fixtures/
- Starting screen: the photo open, on the Overlay step, blue-disc.png added, then taken off with **Remove** (so it is saved and offered)
- Browser data: the saved logo only, blue-disc.png, saved by adding it in the starting screen (start from a private window, or with the site's data cleared)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Perspective** in the step tabs (the six tabs Perspective to Export, along the bottom) | The Perspective step shows the card's outline, with a ring on each corner |
| 2 | Drag the top-left corner ring past the bottom-right one | The outline crosses itself and turns red |
| 3 | Tap **Overlay** in the step tabs | **Add logo** and **Use saved overlay** are greyed out; the line above the controls (the one line of text at the top of the block of buttons under the photo) reads "Fix the corners in Perspective first." |
| 4 | Tap **Perspective** in the step tabs | The Perspective step shows, the outline still crossed and red |
| 5 | Tap **Undo** in the top bar | The outline is back around the card, no longer crossed or red |
| 6 | Tap **Overlay** in the step tabs | **Add logo** and **Use saved overlay** are live again (not greyed out); the line above the controls reads "Add a logo or watermark: PNG, WebP, JPG or SVG, up to 5 MB." |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### OVL-31.2 With crossed corners Replace logo is greyed out   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Photo: IMG_9136.JPEG from samples/
- Logo: blue-disc.png from tests/fixtures/
- Starting screen: the photo open, on the Overlay step, blue-disc.png added
- Browser data: none for this site (a private window, or the site's data cleared)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Perspective** in the step tabs (the six tabs Perspective to Export, along the bottom) | The Perspective step shows the card's outline, with a ring on each corner |
| 2 | Drag the top-left corner ring past the bottom-right one | The outline crosses itself and turns red |
| 3 | Tap **Overlay** in the step tabs | **Replace logo** is greyed out; the line above the controls (the one line of text at the top of the block of buttons under the photo) reads "Fix the corners in Perspective first." |
| 4 | Tap **Perspective** in the step tabs | The Perspective step shows, the outline still crossed and red |
| 5 | Tap **Undo** in the top bar | The outline is back around the card, no longer crossed or red |
| 6 | Tap **Overlay** in the step tabs | **Replace logo** is live again (not greyed out); the line above the controls reads OPACITY with its slider and 100%; the disc is on the photo |

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
- Browser data: none for this site (a private window, or the site's data cleared)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | On a phone, tap the options tab (the small tab with an up arrow on the top edge of the controls, the block of buttons under the photo) | The sheet **Overlay options** rises, holding one row, **Tips** |
| 2 | On a phone, tap **Tips** | It opens in place: "Tap a ring to snap the logo to that corner, side or the center. Drag to move it; drag a corner or pinch to resize.", "On this step the photo stays framed as set in Crop.", "Your last logo is kept in this browser for the next photo." and "Delete saved leaves the logo on this photo." |
| 3 | On a wide screen, look under the controls in the side panel | The heading TIPS AND KEYS, with no **Overlay options** title and no **Tips** row; under it the last three tips of row 2 (not the one about rings) and "Arrows move the logo (Shift for bigger steps); + and − resize it; the wheel resizes too." |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.
