# Journeys

Whole listings, start to finish, on a real iPhone. These are the main flow of every phone checklist: one card taken from Photos to a shared picture in a Safari tab, then a short pass from the home screen icon. They add confidence across steps; each capability they touch has its own cases elsewhere.

## FLOW-01 Finish a card in a Safari tab

A card photo is opened from Photos, straightened, turned, cropped, color-corrected, given a logo and shared to Photos, all by touch in a Safari tab.

- Risk: high
- Check: phone
- Layout: phone
- Added: 1.10 baseline
- Changed: none
- Anchors: none
- Source: the whole app; no single file
- Cases: 3

### FLOW-01.1 Open a card and frame it   [phone]
Before you start:
- Device and browser: an iPhone, Safari, a normal tab (not a private one)
- Build: the test site, https://rberrill.github.io/p1hunt_card_finisher_uat/
- Photo: one of your own photos of a card, in Photos
- Browser data: whatever is there; this case does not depend on it
- Starting screen: the app's start screen. If a box offers to resume a photo, tap **Start fresh** first

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Open photo** | iOS offers Photo Library, Take Photo and Choose File |
| 2 | Tap Photo Library and choose the card photo | The photo fills the area above the controls; four round handles sit on or near the card's corners; six step tabs run along the bottom, with **Perspective** lit |
| 3 | Look at the bottom of the screen | All six step tabs are fully visible above Safari's own bar and the home indicator; no label is cut off |
| 4 | Drag one handle onto its corner of the card | The handle follows your finger; a magnified view of the corner shows at the top of the photo, away from your finger; no iOS magnifier or menu appears |
| 5 | Tap **Rotate** in the step tabs | The **Rotate** tab is lit; a ruler shows under the words **Straighten**; the photo is the same height as before |
| 6 | Drag the ruler a little to one side | The picture tilts as you drag, and the angle beside **Straighten** changes from 0.0° |
| 7 | Tap **Crop** in the step tabs | A row of shapes (Free, Original, 1:1 …) shows, running off the right edge of the screen |
| 8 | Swipe that row to the left and tap **5:7 card** | **5:7 card** turns white and the box on the photo takes the shape of a card |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### FLOW-01.2 Correct the color and add a logo   [phone]
Before you start:
- Device and browser: an iPhone, Safari
- Build: the test site, https://rberrill.github.io/p1hunt_card_finisher_uat/
- Photo: the card photo from FLOW-01.1, still open
- Logo: any PNG picture in Photos to use as a logo
- Browser data: whatever is there
- Starting screen: the photo open on the **Crop** step, as FLOW-01.1 leaves it

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Levels** in the step tabs | **Pick white**, **Pick black**, **Auto** and **Clear** show; **Apply** is greyed out |
| 2 | Tap **Auto** | The picture's colors change; a short message says what Auto set; **Apply** turns red; a white dot shows on the **Levels** tab |
| 3 | Press and hold on the picture for a second, then let go | While held, the picture shows as it was before, with the words **Before levels**; on letting go the corrected picture returns; no iOS magnifier or menu appears |
| 4 | Tap **Apply** | The white dot leaves the **Levels** tab; **Apply** is greyed out again |
| 5 | Tap **Overlay** in the step tabs | **Add logo** shows in red (with **Use saved overlay** beside it if a logo was saved before) |
| 6 | Tap **Add logo** and choose the PNG from Photos | The logo sits in the middle of the picture; nine small rings show on the picture |
| 7 | Put two fingers on the logo and pinch them together | The logo gets smaller; the picture behind it does not move or zoom |
| 8 | Tap the ring in the bottom right corner of the picture | The logo jumps to the bottom right corner, fully inside the picture |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### FLOW-01.3 Share the finished card to Photos   [phone]
Before you start:
- Device and browser: an iPhone, Safari
- Build: the test site, https://rberrill.github.io/p1hunt_card_finisher_uat/
- Photo: the card photo from FLOW-01.2, still open, with its logo
- Browser data: whatever is there
- Starting screen: the photo open on the **Overlay** step, as FLOW-01.2 leaves it

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Export** in the step tabs | Sizes (**1080**, **2000**, **3000**, **Original**) and formats (**JPEG**, **PNG**, **WebP**) show in one row; under them **Share** in red, **Download** and **Copy**; no label is cut off |
| 2 | Tap the small tab with an up arrow on the top edge of the controls | A panel titled **Export options** rises over the lower part of the picture; near its end a line reads "Card Finisher" and a version that contains "dev" |
| 3 | Tap the **×** at the top right of the panel | The panel goes down |
| 4 | Tap **Original** in the row of sizes | **Original** turns white (at this size the app never asks about upscaling) |
| 5 | Tap **Share** | The iOS share sheet opens, showing one picture |
| 6 | Tap Save Image in the share sheet | The share sheet closes; the app is still on **Export** with the picture unchanged; **Next card** shows in white in the bottom row |
| 7 | Open the Photos app and look at the newest picture | It is the card as the app showed it: straightened, cropped to a card's shape, with the logo in the bottom right corner |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## FLOW-02 Use the app from the home screen icon

Added to the home screen, the app opens full screen under its own icon, fits between the notch and the home indicator, and saves a picture. It starts empty: an app on the home screen keeps its own storage, apart from Safari's.

- Risk: high
- Check: phone
- Layout: phone
- Added: 1.10 baseline
- Changed: none
- Anchors: none
- Source: `index.html` (the icon and title links); the whole app
- Cases: 1

### FLOW-02.1 Open, edit and save from the home screen   [phone]
Before you start:
- Device and browser: an iPhone. The test site, https://rberrill.github.io/p1hunt_card_finisher_uat/, added to the home screen once (in Safari: the Share button, then Add to Home Screen)
- Photo: one of your own photos of a card, in Photos
- Browser data: whatever the home screen app holds
- Starting screen: the iPhone's home screen. The app was last left with no photo to resume (tap **Start fresh** in it once beforehand)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the app's icon on the home screen | A red P and a white 1 on a black tile; not a picture of the page |
| 2 | Tap the icon | The app opens full screen, with no Safari address bar |
| 3 | Tap **Open photo**, then Photo Library, and choose the card photo | The photo opens with four handles on or near the card's corners |
| 4 | Look at the top and the bottom of the screen | The top bar's buttons are below the notch or island and fully visible; the step tabs are above the home indicator and fully visible |
| 5 | Tap **Export** in the step tabs | The sizes, the formats, **Share**, **Download** and **Copy** show, none cut off |
| 6 | Tap **Original** in the row of sizes | **Original** turns white |
| 7 | Tap **Share** | The iOS share sheet opens, showing one picture |
| 8 | Tap Save Image | The share sheet closes and the app is still on **Export** |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.
