# Start and session

The start screen, opening a photo, Resume and Start fresh, and how the open photo and its edits are kept on the device between visits.

## STA-01 The start screen

Until a photo is open, the photo area shows the app icon, **P1Hunt Card Finisher**, **Finish a card photo**, "Open, drop, or paste a photo." and "Everything stays on this device." It goes as soon as a photo opens.

- Risk: low
- Check: script
- Layout: both. On a phone it is the whole screen; on a wide screen the top bar shows above it.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#empty`, "Finish a card photo", "Open, drop, or paste a photo.", "Everything stays on this device."
- Source: `index.html` (the start screen); `js/app/state.js` (`openFile`)
- Cases: 1

### STA-01.1 The start screen shows until a photo opens   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window, in a private window so that no photo is saved on this device
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the app just opened

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the photo area | The app icon, then P1HUNT CARD FINISHER, the heading **Finish a card photo**, "Open, drop, or paste a photo." and "Everything stays on this device.", and the red **Open photo** button |
| 2 | Tap **Open photo** and choose IMG_9136.JPEG | The photo opens; the icon, the heading and the two lines have gone |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## STA-02 Open a photo from the start screen

**Open photo** on the start screen opens the system's file picker for one image (any image type, plus .heic and .heif). The same file can be picked twice in a row and opens both times.

- Risk: high
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnOpenEmpty`, `#fileInput`, "Open photo"
- Source: `js/app/shell.js` (`pickPhoto`, `bindNavigation`); `js/app/adapters.js` (`ImageSource.bindPicker`); `js/app/main.js` (`bindPhotoInput`)
- Cases: 2

### STA-02.1 Open photo asks for one image and opens it   [auto: phone, webkit]
Before you start:
- Device and browser: any; a phone-width or a wide window, in a private window so that no photo is saved on this device
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the start screen, with no photo open

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Open photo** | The system's file picker opens; it lets you pick one file only, and it offers image files, HEIC photos among them |
| 2 | Choose IMG_9136.JPEG | The photo opens on the Perspective step, with its four corner handles on the card |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### STA-02.2 The same photo can be chosen twice in a row   [auto: phone, webkit]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: IMG_9136.JPEG open, on the Perspective step, nothing changed yet (**Undo** at the top right is greyed out)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Rotate** in the step tabs (the six tabs Perspective to Export, along the bottom on a phone, in the top bar on a wide screen) | The Rotate step shows |
| 2 | Tap **90° right** in the row of tools | The photo lies on its side; **Undo** is no longer greyed out |
| 3 | Tap **Open** (the folder at the top left; on a phone it has no label) | The system's file picker opens |
| 4 | Choose IMG_9136.JPEG again | The photo opens again from the start: upright, on the Perspective step, **Undo** greyed out |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## STA-03 No working controls before a photo

Before a photo is open, nothing that needs a photo is offered.

- Risk: medium
- Check: script
- Layout: both. On a phone there is no top bar, no controls and no step tabs at all; on a wide screen the top bar shows with the step tabs and **Fit to screen** dimmed, and the side panel's step sections are hidden.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#topBarHost`, `#tabBarHost`, `#panel`, `#btnFit`
- Source: `css/app.css` (the shell's phone and wide blocks); `js/app/shell.js` (`syncUI`, `syncFitButton`)
- Ruling: R51. On the start screen the tuning panel never covers **Open photo** or the Resume box. The app differs today. The backtick key may still open it with no photo open.
- Cases: 3

### STA-03.1 On a phone, nothing but the start screen shows   [auto: phone]
Before you start:
- Device and browser: a phone-width window, 390 × 844 px
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: none
- Starting screen: the start screen, with no photo open

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the top of the screen | No top bar: no **Open**, **Undo** or **Redo** |
| 2 | Look at the bottom of the screen | No controls (the block of buttons under the photo) and no step tabs (the six tabs Perspective to Export): the start screen fills the screen |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### STA-03.2 On a wide screen, the steps and Fit are greyed out   [auto: desktop]
Before you start:
- Device and browser: a computer; a wide window, 1280 × 800 px
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: none
- Starting screen: the start screen, with no photo open

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the top bar | It shows **Open** and the six steps, **Perspective** to **Export**; the steps are greyed out, and so are **Fit to screen**, **Undo** and **Redo** |
| 2 | Look at the panel on the right of the photo area | No step's controls are in it |
| 3 | Click **Rotate** in the top bar | Nothing happens: the start screen stays and the panel stays empty |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### STA-03.3 The backtick key opens the tuning panel over the start screen   [auto: desktop]
Written to ruling R51: the panel may open with no photo open, and never covers **Open photo**. It fails until that is built (BUG-281): today the panel covers the button's right end.

Before you start:
- Device and browser: a computer with a keyboard; a wide window, 1280 × 800 px
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: none
- Starting screen: the start screen, with no photo open

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Press the backtick key (`` ` ``, left of 1) | The detection tuning panel opens, floating over the start screen, and leaves **Open photo** clear: no part of the panel is over the button |
| 2 | Press the backtick key again | The tuning panel closes; the start screen is as it was |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## STA-04 The Resume card

When the page loads and a whole saved session (the photo and its edits) is on this device, a card on the start screen offers **Resume** or **Start fresh**. The app never resumes by itself, and the card goes away when a photo is opened any other way.

- Risk: high
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#resume`, `#btnResume`, `#btnFresh`
- Source: `js/app/start-screen.js` (`offerResume`, `hideResume`); `js/app/adapters.js` (`Session.peek`); `js/app/main.js` (`init`); `js/app/state.js` (`openFile`)
- Ruling: R27. The Resume card is not a question box: it has no fade, does not keep Tab inside it and does not return focus. The app already does this.
- Cases: 3

### STA-04.1 After a reload the card offers Resume and never resumes by itself   [auto: phone, webkit]
Before you start:
- Device and browser: any; a phone-width or a wide window, in a private window so that no photo is saved on this device
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the app just opened

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at the start screen | No card above **Open photo**: nothing is offered to resume |
| 2 | Tap **Open photo** and choose IMG_9136.JPEG | The photo opens |
| 3 | Wait two seconds, then reload the page | The start screen shows a card with **Resume** and **Start fresh**; no photo is open |
| 4 | Wait five seconds | The start screen and its card are still there: the app has not opened the photo by itself |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### STA-04.2 The card goes when a photo is opened another way   [auto: phone, webkit]
Before you start:
- Device and browser: any; a phone-width or a wide window, in a private window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: IMG_9136.JPEG and IMG_9075.JPEG from samples/
- Starting screen: the start screen offering to resume IMG_9136.JPEG (open IMG_9136.JPEG, wait two seconds, reload the page)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Open photo** and choose IMG_9075.JPEG | IMG_9075.JPEG opens; the card has gone with the start screen |
| 2 | Wait two seconds, then reload the page | The card offers "Resume IMG_9075.JPEG?": the photo opened last |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### STA-04.3 The Tab key moves on out of the card   [auto: desktop, webkit]
Ruling R27: the card is not a question box, so it does not keep the Tab key inside it. The app already does this.

Before you start:
- Device and browser: a computer with a keyboard; a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the start screen offering to resume IMG_9136.JPEG (open it, wait two seconds, reload the page)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Press Tab until **Resume** has the focus ring | **Resume** has the focus |
| 2 | Press Tab | **Start fresh** has the focus |
| 3 | Press Tab | The focus has left the card: **Open photo**, under it, has the focus |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## STA-05 What the Resume card says

The card reads "Last photo · " with how long ago (just now, n min ago, n h ago or n d ago; left out if the saved time is unreadable), and "Resume" with the photo's name and a question mark. A long name is cut to 60 characters; with no name it says "your last photo"; a front and back pair reads as the front's name, " + ", the back's name. The small picture is a drawn card outline (two for a pair), never the photo itself.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#resumeWhen`, `#resumeName`, `#resumeThumb`, "Last photo · ", "your last photo"
- Source: `js/app/start-screen.js` (`offerResume`, `timeAgo`, `resumeName`); `js/app/core.js` (`shortText`)
- Cases: 5

### STA-05.1 The card names the photo and when it was saved   [auto: phone, webkit]
Before you start:
- Device and browser: any; a phone-width or a wide window, in a private window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the start screen, with no photo open

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Open photo** and choose IMG_9136.JPEG | The photo opens |
| 2 | Wait two seconds, then reload the page | The card's top line reads LAST PHOTO · JUST NOW, and under it "Resume IMG_9136.JPEG?" |
| 3 | Look at the small picture at the card's left | One drawn card outline, not the photo |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### STA-05.2 A long name is cut short   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window, in a private window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: a copy of IMG_9136.JPEG from samples/, renamed A-card-photo-whose-name-is-much-longer-than-the-resume-card-shows.JPEG (70 characters)
- Starting screen: the start screen, with no photo open

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Open photo** and choose the renamed copy | The photo opens |
| 2 | Wait two seconds, then reload the page | The card reads "Resume A-card-photo-whose-name-is-much-longer-than-the-resume-card…?": the first 59 characters of the name and an ellipsis (…), 60 in all |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### STA-05.3 A pair reads front + back, with two outlines   [auto: phone, webkit]
Before you start:
- Device and browser: any; a phone-width or a wide window, in a private window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: 14_front_portrait_raw_white.JPEG open (with **Open photo**), on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Export** in the step tabs (the six tabs Perspective to Export, along the bottom on a phone, in the top bar on a wide screen) | The Export step shows **Add back** |
| 2 | Tap **Add back** and choose 14_back_portrait_raw_white.JPEG | The back opens; **Front** and **Back** show in the top bar |
| 3 | Wait two seconds, then reload the page | The card reads "Resume 14_front_portrait_raw_white.JPEG + 14_back_portrait_raw_white.JPEG?" |
| 4 | Look at the small picture at the card's left | Two drawn card outlines, not the photos |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### STA-05.4 The card says how long ago the photo was saved   [auto: phone]
Before you start:
- Device and browser: a computer whose clock you may change; a phone-width or a wide window, in a private window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the start screen offering to resume IMG_9136.JPEG (open it, wait two seconds, reload the page), its top line reading LAST PHOTO · JUST NOW

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Set the computer's clock 5 minutes ahead | The computer's clock shows 5 minutes past the real time; the card still reads LAST PHOTO · JUST NOW |
| 2 | Reload the page | The card's top line reads LAST PHOTO · 5 MIN AGO |
| 3 | Set the clock 3 hours ahead of the real time | The computer's clock shows 3 hours past the real time |
| 4 | Reload the page | It reads LAST PHOTO · 3 H AGO |
| 5 | Set the clock 2 days ahead of the real time | The computer's clock shows 2 days past the real time |
| 6 | Reload the page | It reads LAST PHOTO · 2 D AGO |

Set the clock back to the real time when you finish.

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### STA-05.5 An unreadable saved time and name   [auto: phone]
Script only
Stand-in: no control changes the edits the app has saved on the device, so the script rewrites two of their values, as a saved record the app can no longer read as it wrote it would be. Whether a person could do the same in Chrome's developer tools is find-out item Q-07; until it is answered, this case is run by the script alone.
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the start screen offering to resume IMG_9136.JPEG (open it with **Open photo**, wait two seconds, reload the page)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | The script changes the time saved with the edits to the text "soon" | The saved edits hold the time "soon" |
| 2 | The script changes the photo name saved with the edits to the number 42 | The saved edits hold the name 42 |
| 3 | Reload the page | The card has no LAST PHOTO line, and reads "Resume your last photo?" |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## STA-06 Which start button is red

While the Resume card shows, **Resume** is the red button and **Open photo** is not. When the card goes, **Open photo** is red again.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnResume`, `#btnOpenEmpty`, `.is-main`
- Source: `js/app/start-screen.js` (`offerResume`, `hideResume`)
- Cases: 1

### STA-06.1 Resume is the red button while the card shows   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window, in a private window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the app just opened, with no card

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at **Open photo** | It is red |
| 2 | Tap **Open photo** and choose IMG_9136.JPEG | The photo opens |
| 3 | Wait two seconds, then reload the page | The card shows: **Resume** is red; **Start fresh** and **Open photo** are not |
| 4 | Tap **Start fresh** | The card goes, and **Open photo** is red again |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## STA-07 Resume where you left off

**Resume** reopens the saved photo with its edits, on the step that was open, with any unapplied Levels change, and with the photo still marked as exported if it was (so **Next card** shows again). A front and back pair comes back as a pair. The message "Resumed where you left off." shows.

- Risk: high
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnResume`, "Resumed where you left off.", `#btnNextCard`
- Source: `js/app/start-screen.js` (`resumeSession`); `js/app/state.js` (`openFile`, `restoreLevelsDraft`); `js/app/pair.js` (`restorePair`, `finishResume`)
- Cases: 4

### STA-07.1 Resume brings back the edits and the step   [auto: phone, webkit]
Before you start:
- Device and browser: any; a phone-width or a wide window, in a private window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: IMG_9136.JPEG open (with **Open photo**), on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Rotate** in the step tabs (the six tabs Perspective to Export, along the bottom on a phone, in the top bar on a wide screen) | The Rotate step shows |
| 2 | Tap **90° right** in the row of tools | The photo lies on its side |
| 3 | Tap **Crop** in the step tabs | The Crop step shows |
| 4 | Wait two seconds, then reload the page | The card offers "Resume IMG_9136.JPEG?" |
| 5 | Tap **Resume** | The photo opens on the Crop step, lying on its side, and the message "Resumed where you left off." shows |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### STA-07.2 Resume brings back an unapplied Levels change   [auto: phone, webkit]
Before you start:
- Device and browser: any; a phone-width or a wide window, in a private window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: IMG_9136.JPEG open (with **Open photo**), on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Levels** in the step tabs (the six tabs Perspective to Export, along the bottom on a phone, in the top bar on a wide screen) | The Levels step shows |
| 2 | Tap **Auto** in the row of tools | **Discard** and **Apply**, at the two ends of the line at the top of the controls (the block of buttons under the photo), are no longer greyed out, and a white dot sits on the **Levels** tab |
| 3 | Wait two seconds, then reload the page | The card offers "Resume IMG_9136.JPEG?" |
| 4 | Tap **Resume** | The photo opens on the Levels step with **Discard** and **Apply** not greyed out and the white dot on the **Levels** tab: the change is still waiting to be applied |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### STA-07.3 Resume brings back Next card after an export   [auto: phone, webkit]
Before you start:
- Device and browser: any; a phone-width or a wide window, in a private window, with downloads saved to a folder
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: IMG_9136.JPEG open (with **Open photo**), on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Export** in the step tabs (the six tabs Perspective to Export, along the bottom on a phone, in the top bar on a wide screen) | The Export step shows **Download**, and no **Next card** |
| 2 | Tap **Download** | A question box (the box over the dimmed photo with a question and buttons) asks "Upscale to 2000 px?" |
| 3 | Tap **No** | A file is saved, and **Next card** shows |
| 4 | Wait two seconds, then reload the page | The card offers "Resume IMG_9136.JPEG?" |
| 5 | Tap **Resume** | The photo opens on the Export step, with **Next card** showing |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### STA-07.4 A pair comes back as a pair   [auto: phone, webkit]
Before you start:
- Device and browser: any; a phone-width or a wide window, in a private window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: 14_front_portrait_raw_white.JPEG open (with **Open photo**), on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Add back** and choose 14_back_portrait_raw_white.JPEG | The back opens on the Perspective step; **Front** and **Back** show in the top bar, **Back** selected |
| 2 | Wait two seconds, then reload the page | The card offers both photos, front + back |
| 3 | Tap **Resume** | The back opens on the Perspective step; **Front** and **Back** show in the top bar with **Back** selected, and **Unpair** beside them |
| 4 | Tap **Front** in the top bar | The front photo shows, with **Front** selected |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## STA-08 Resume when the saved size doesn't match

Resume applies the saved edits only if the saved width and height match the photo as decoded. Otherwise the photo opens with fresh edits and an amber message, "Full edit history could not be restored, your photo has been opened fresh.", and the fresh edits replace the saved ones.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: 1.10.0
- Anchors: `#btnResume`, "Resumed where you left off.", "Full edit history could not be restored, your photo has been opened fresh."
- Source: `js/app/state.js` (`openFile`)
- Ruling: R23. A size mismatch shows the amber message "Full edit history could not be restored, your photo has been opened fresh." (wording approved by Rich, 16 November 2026). The app does this since 1.10.0.
- Cases: 2

### STA-08.1 A size mismatch says the photo was opened fresh   [auto: phone]
Script only
Stand-in: no control changes the size saved with the edits, and no sample photo decodes at a size other than its own, so the script changes the saved width by one pixel, as a photo that no longer decodes at the size it was saved with would be. Whether a person could do the same in Chrome's developer tools is find-out item Q-07; until it is answered, this case is run by the script alone.

Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/ (1498 × 2098 px)
- Starting screen: IMG_9136.JPEG opened with **Open photo**, turned with **90° right** on the Rotate step, two seconds waited and the page reloaded: the start screen offers to resume it

| # | Do this | You should see |
| --- | --- | --- |
| 1 | The script changes the width saved with the edits to 1499 | The saved edits hold the width 1499 |
| 2 | Tap **Resume** | The photo opens upright, on the Perspective step: the saved turn was not applied |
| 3 | Look at the message over the photo | An amber message reads "Full edit history could not be restored, your photo has been opened fresh." |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### STA-08.2 After a size mismatch the fresh edits replace the saved ones   [auto: phone, webkit]
Script only
Stand-in: as for STA-08.1, the script changes the width saved with the edits by one pixel; no control can, and whether Chrome's developer tools can is find-out item Q-07.

Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/ (1498 × 2098 px)
- Starting screen: as in STA-08.1: the start screen offering to resume IMG_9136.JPEG, turned with **90° right**

| # | Do this | You should see |
| --- | --- | --- |
| 1 | The script changes the width saved with the edits to 1499 | The saved edits hold the width 1499 |
| 2 | Tap **Resume** | The photo opens upright on the Perspective step, **Undo** greyed out |
| 3 | Wait two seconds, then reload the page | The card offers "Resume IMG_9136.JPEG?" again |
| 4 | Tap **Resume** | The photo opens upright, with "Resumed where you left off.": the fresh edits replaced the saved turn |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## STA-09 Resume keeps the saved corners

After a resume, card detection still runs, but only to fill the **Candidate** choices and the snap targets; it never moves the resumed corners.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnResume`, `#toolCandidate`
- Source: `js/app/state.js` (`openFile`, `runDetect`)
- Cases: 1

### STA-09.1 Resume keeps corners placed by hand   [auto: phone, webkit]
Before you start:
- Device and browser: any; a phone-width window (drag with a finger) or a wide window (drag with the mouse), in a private window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: IMG_9136.JPEG open (with **Open photo**), on the Perspective step, its four corner handles on the card

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Drag the top-left corner handle 40 px right and 40 px down, and let go | The handle sits inside the card, off its corner |
| 2 | Wait two seconds, then reload the page | The card offers "Resume IMG_9136.JPEG?" |
| 3 | Tap **Resume** | The photo opens with the top-left handle where you left it, inside the card |
| 4 | Look at **Candidate** in the row of tools, once the photo has settled | It reads 1/3: the card's outlines were found again; the handles have not moved |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## STA-10 Resume brings back the logo

A resumed photo that had a logo gets its logo image back: from the logo stored with that photo, else from the saved logo when it is the same one.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: 1.10.0
- Anchors: `#btnResume`, "The overlay image isn’t loaded. Open the Overlay step and add it again."
- Source: `js/app/overlay.js` (`ensureOverlayImage`, `keepPhotoOverlayStored`); `js/app/state.js` (`openFile`)
- Ruling: R22. **Remove** leaves the photo's logo in storage, so Undo after a resume can bring it back. The app already does this. R35. Whatever logo Undo can bring back stays stored, so after Resume the photo exports as it looked: a logo that Undo, a pair's side switch (PAIR-40.2) or **Delete saved** leaves on the photo, and that is neither the photo's stored logo nor the saved one, becomes the photo's stored logo. The app does this since 1.10.0.
- Cases: 5

To add a logo: on the Overlay step, tap **Add logo** (or **Replace logo** when a logo is on the photo) and choose the file. The logos are the app's own icons, from the icons/ folder of the build: icon.svg and apple-touch-icon.png.

### STA-10.1 Resume brings the logo back   [auto: phone, webkit]
Before you start:
- Device and browser: any; a phone-width or a wide window, in a private window, with downloads saved to a folder you can open
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/; logo: icons/icon.svg
- Starting screen: IMG_9136.JPEG open (with **Open photo**), on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Overlay** in the step tabs (the six tabs Perspective to Export, along the bottom on a phone, in the top bar on a wide screen) | The Overlay step shows **Add logo** |
| 2 | Add the logo icon.svg | The logo shows on the photo |
| 3 | Tap **Export** in the step tabs | The Export step shows **Download** |
| 4 | Tap **Download** | A question box (the box over the dimmed photo with a question and buttons) asks "Upscale to 2000 px?" |
| 5 | Tap **No** | A file named IMG_9136-straight.jpg is saved, with the logo in it |
| 6 | Wait two seconds, then reload the page | The card offers "Resume IMG_9136.JPEG?" |
| 7 | Tap **Resume** | The photo opens on the Export step |
| 8 | Tap **Download** | The question box asks "Upscale to 2000 px?" |
| 9 | Tap **No** | A second file is saved, with no message about the logo; it is the same picture as the first, logo and all |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### STA-10.2 Remove and Undo after a resume bring the logo back   [auto: phone, webkit]
Ruling R22: **Remove** leaves the photo's logo stored, so Undo after a resume can bring it back. The app already does this.

Before you start:
- Device and browser: any; a phone-width or a wide window, in a private window, with downloads saved to a folder
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/; logo: icons/icon.svg
- Starting screen: IMG_9136.JPEG open (with **Open photo**), on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Overlay** in the step tabs (the six tabs Perspective to Export, along the bottom on a phone, in the top bar on a wide screen) | The Overlay step shows **Add logo** |
| 2 | Add the logo icon.svg | The logo shows on the photo |
| 3 | Wait two seconds, then reload the page | The card offers "Resume IMG_9136.JPEG?" |
| 4 | Tap **Resume** | The photo opens on the Overlay step, with the logo |
| 5 | Tap **Remove** in the row of tools | The logo goes; **Add logo** shows |
| 6 | Tap **Undo** (the arrow curving left, at the top right) | The logo is back |
| 7 | Tap **Export** in the step tabs | The Export step shows **Download** |
| 8 | Tap **Download** | A question box (the box over the dimmed photo with a question and buttons) asks "Upscale to 2000 px?" |
| 9 | Tap **No** | A file named IMG_9136-straight.jpg is saved, with no message about the logo |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### STA-10.3 After a replaced logo is undone, Resume keeps the logo   [auto: phone, webkit]
Before you start:
- Device and browser: any; a phone-width or a wide window, in a private window, with downloads saved to a folder you can open
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/; logos: icons/icon.svg and icons/apple-touch-icon.png
- Starting screen: IMG_9136.JPEG open (with **Open photo**), on the Overlay step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Add the logo icon.svg | The app icon shows on the photo as the logo |
| 2 | Wait two seconds, then tap **Replace logo** and choose apple-touch-icon.png | The logo changes to the other picture |
| 3 | Tap **Undo** (the arrow curving left, at the top right) | The app icon is the logo again |
| 4 | Tap **Export** in the step tabs (the six tabs Perspective to Export, along the bottom on a phone, in the top bar on a wide screen) | The Export step shows **Download** |
| 5 | Tap **Download** | A question box (the box over the dimmed photo with a question and buttons) asks "Upscale to 2000 px?" |
| 6 | Tap **No** | A file named IMG_9136-straight.jpg is saved; the app icon is still the logo on the photo |
| 7 | Wait two seconds, then reload the page | The card offers "Resume IMG_9136.JPEG?" |
| 8 | Tap **Resume** | The photo opens on the Export step |
| 9 | Tap **Download** | The question box asks "Upscale to 2000 px?" |
| 10 | Tap **No** | A second file is saved, with no message about the logo; it is the same picture as the first, logo and all |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot, and the two files.

### STA-10.4 Resume falls back to the logo saved in the browser   [auto: phone, webkit]
Before you start:
- Device and browser: any; a phone-width or a wide window, in a private window, with downloads saved to a folder you can open
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/; logos: icons/apple-touch-icon.png and icons/icon.svg
- Starting screen: IMG_9136.JPEG open (with **Open photo**), on the Overlay step

The named actions:
- Open Export options: on a phone, tap the options tab (the tab with an up arrow on the top edge of the controls, the block of buttons under the photo); on a wide screen they are always shown under the controls.
- Close Export options: on a phone, tap the **×** at their top right; on a wide screen there is nothing to close.
- Save the edits: tap **Export** in the step tabs (the six tabs Perspective to Export, along the bottom on a phone, in the top bar on a wide screen), open Export options, tap **Save edits**, then close Export options.
- Load the edits: tap **Export** in the step tabs, open Export options, tap **Load edits** and choose the IMG_9136-edits.json you saved, then close Export options.

This order leaves the photo's own stored logo different from the one on the photo, which is then the logo saved in the browser.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Add the logo apple-touch-icon.png | It shows on the photo |
| 2 | Save the edits | A file named IMG_9136-edits.json is saved; the Export step shows |
| 3 | Tap **Overlay** in the step tabs | The Overlay step shows, with the logo |
| 4 | Wait two seconds, then tap **Replace logo** and choose icon.svg | The app icon is the logo now |
| 5 | Load the edits | The logo is apple-touch-icon.png again |
| 6 | Tap **Undo** (the arrow curving left, at the top right) | The app icon is the logo again |
| 7 | Wait two seconds, then reload the page | The card offers "Resume IMG_9136.JPEG?" |
| 8 | Tap **Resume** | The photo opens on the Export step |
| 9 | Tap **Download** | A question box (the box over the dimmed photo with a question and buttons) asks "Upscale to 2000 px?" |
| 10 | Tap **No** | A file named IMG_9136-straight.jpg is saved, with no message about the logo |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### STA-10.5 After Delete saved, Resume still brings the logo back   [auto: phone, webkit]
Before you start:
- Device and browser: any; a phone-width or a wide window, in a private window, with downloads saved to a folder you can open
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/; logos: icons/apple-touch-icon.png and icons/icon.svg
- Starting screen: IMG_9136.JPEG open (with **Open photo**). Tap **Export** in the step tabs (the six tabs Perspective to Export, along the bottom on a phone, in the top bar on a wide screen) and **Original** (at Original, **Download** asks no question). Tap **Overlay** in the step tabs, tap **Add logo** and choose apple-touch-icon.png. Save the edits (below), then tap **Overlay** again. The photo is on the Overlay step, with apple-touch-icon.png as its logo, and a file named IMG_9136-edits.json is saved

The named actions:
- Open Export options: on a phone, tap the options tab (the tab with an up arrow on the top edge of the controls, the block of buttons under the photo); on a wide screen they are always shown under the controls.
- Close Export options: on a phone, tap the **×** at their top right; on a wide screen there is nothing to close.
- Save the edits: tap **Export** in the step tabs, open Export options, tap **Save edits**, then close Export options.
- Load the edits: tap **Export** in the step tabs, open Export options, tap **Load edits** and choose the IMG_9136-edits.json you saved, then close Export options.

As in STA-10.4, rows 1 to 3 leave the logo on the photo kept only as the logo saved in the browser. **Delete saved** then removes that one.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Wait two seconds, then tap **Replace logo** and choose icon.svg | The app icon is the logo now |
| 2 | Load the edits | The logo is apple-touch-icon.png again |
| 3 | Tap **Undo** (the arrow curving left, at the top right) | The app icon is the logo again |
| 4 | Tap **Overlay** in the step tabs | The Overlay step shows, with the app icon as the logo and **Delete saved** in the row of tools |
| 5 | Tap **Delete saved** | **Delete saved** is greyed out (shown dim and not answering a tap); the app icon is still the logo |
| 6 | Tap **Export** in the step tabs | The Export step shows **Download** |
| 7 | Tap **Download** | A file named IMG_9136-straight.jpg is saved |
| 8 | Wait two seconds, then reload the page | The card offers "Resume IMG_9136.JPEG?" |
| 9 | Tap **Resume** | The photo opens on the Export step |
| 10 | Tap **Download** | A second file is saved, with no message about the logo; it is the same picture as the first, logo and all |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot, and the two files.

## STA-11 Resume with the saved photo missing

If the saved photo is gone when **Resume** is tapped, an amber message says "The saved photo is gone. Open it again." The start screen stays, with the Resume card hidden.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnResume`, "The saved photo is gone. Open it again."
- Source: `js/app/start-screen.js` (`resumeSession`)
- Cases: 1

### STA-11.1 Resume after the saved photo has gone   [auto: phone, webkit]
Before you start:
- Device and browser: any; a phone-width or a wide window, in a private window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: two tabs of the app in the same window, both on the start screen offering to resume IMG_9136.JPEG (open it in one, wait two seconds, reload it, then open the app in a second tab)

| # | Do this | You should see |
| --- | --- | --- |
| 1 | In the second tab, tap **Start fresh** | Its card goes |
| 2 | Go back to the first tab | Its start screen still offers "Resume IMG_9136.JPEG?" |
| 3 | Tap **Resume** | An amber message says "The saved photo is gone. Open it again."; the start screen stays, its card hidden, and no photo opens |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## STA-12 Resume fails for another reason

If Resume fails for any other reason, a red message shows "Couldn’t resume: " followed by the browser's error text, and the error is logged to the console.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnResume`, "Couldn’t resume: "
- Source: `js/app/start-screen.js` (`resumeSession`)
- Ruling: R24. The message is the fixed "Couldn’t resume." (wording approved by Rich, 16 November 2026: the short form, with no advice), and the error's detail always goes to the console. The app differs today.
- Cases: 1

### STA-12.1 Resume that fails names no browser error   [auto: desktop]
Written to ruling R24; it fails until that is built (BUG-051).

Before you start:
- Device and browser: a computer, Chrome or Edge; a wide window, in a private window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the start screen offering to resume IMG_9136.JPEG (open it, wait two seconds, reload the page), with the developer tools open at Application, Storage, and their Console showing

| # | Do this | You should see |
| --- | --- | --- |
| 1 | In the developer tools, click **Clear site data** | The site's stored data is cleared; the card still shows |
| 2 | Click **Resume** | A red message reads "Couldn’t resume." and nothing more: it does not quote the browser's error ("Failed to execute 'transaction' …") |
| 3 | Look at the Console | The browser's error is logged there |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## STA-13 Start fresh

**Start fresh** deletes the saved session (the photo, its logo, a pair's other side and its photo, and the edits) and hides the card. The saved logo and every remembered preference stay.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnFresh`, `#resume`, `CONFIG.session.dbName`
- Source: `js/app/start-screen.js` (`bindStartScreen`, `hideResume`); `js/app/adapters.js` (`Session.clear`)
- Cases: 2

### STA-13.1 Start fresh forgets the photo, its logo and a pair   [auto: phone, webkit]
Before you start:
- Device and browser: any; a phone-width or a wide window, in a private window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/; logo: icons/icon.svg
- Starting screen: 14_front_portrait_raw_white.JPEG open (with **Open photo**), on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Overlay** in the step tabs (the six tabs Perspective to Export, along the bottom on a phone, in the top bar on a wide screen) | The Overlay step shows **Add logo** |
| 2 | Tap **Add logo** and choose icon.svg | The logo shows on the front |
| 3 | Tap **Export** in the step tabs | The Export step shows **Add back** |
| 4 | Tap **Add back** and choose 14_back_portrait_raw_white.JPEG | The back opens; **Front** and **Back** show in the top bar |
| 5 | Wait two seconds, then reload the page | The card offers the front + the back |
| 6 | Tap **Start fresh** | The card goes. The script also reads the browser's storage: the front's photo and its edits, its logo, and the back with its photo are all gone from it |
| 7 | Reload the page | No card: nothing is offered to resume |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### STA-13.2 Start fresh keeps the saved logo and the remembered settings   [auto: phone, webkit]
Before you start:
- Device and browser: any; a phone-width or a wide window, in a private window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: IMG_9136.JPEG and IMG_9075.JPEG from samples/; logo: icons/icon.svg
- Starting screen: IMG_9136.JPEG open (with **Open photo**), on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Overlay** in the step tabs (the six tabs Perspective to Export, along the bottom on a phone, in the top bar on a wide screen) | The Overlay step shows **Add logo** |
| 2 | Tap **Add logo** and choose icon.svg | The logo shows on the photo |
| 3 | Tap **Crop** in the step tabs | The Crop step shows its row of sizes |
| 4 | Tap **3:4** in the row of sizes | **3:4** is selected (solid white) |
| 5 | Wait two seconds, then reload the page | The card offers "Resume IMG_9136.JPEG?" |
| 6 | Tap **Start fresh** | The card goes |
| 7 | Tap **Open photo** and choose IMG_9075.JPEG | IMG_9075.JPEG opens |
| 8 | Tap **Crop** in the step tabs | **3:4** is selected: the remembered size stayed |
| 9 | Tap **Overlay** in the step tabs | **Use saved overlay** is offered, beside the saved logo's small picture |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## STA-14 Edits are saved as you go

The edits (the photo's name and size, the edits, any unapplied Levels change, the open step, whether it was exported, and the time) are saved on the device 100 ms after the last change or step change.

- Risk: high
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: 1.10.0
- Anchors: `CONFIG.session.saveDelayMs`, `CONFIG.session.enabled`
- Source: `js/app/adapters.js` (`Session.snapshot`, `Session.saveSoon`, `Session.flush`); `js/app/state.js` (`stateChanged`); `js/app/shell.js` (`setTab`)
- Cases: 2

### STA-14.1 A change is saved 0.1 s after the last one   [auto: desktop, webkit]
Script only
Stand-in: nothing is replaced, but no person can time a save to a hundredth of a second, nor see the edits the app keeps in the browser's storage without developer tools; the script notes the moment of each click and of each save of the edits, and reads what was saved.
Before you start:
- Device and browser: a computer; a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: IMG_9136.JPEG open (with **Open photo**), on the Rotate step, a second after it opened

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Click **90° right** in the row of tools | The photo lies on its side; the edits are saved once, 0.10 to 0.25 s after the click, not sooner |
| 2 | The script reads the saved edits | They hold the photo's name and size (IMG_9136.JPEG, 1498 × 2098), the quarter turn to the right, the open step (Rotate), the mark that says the photo has not been exported, and the time of the save, within 5 s of the clock |
| 3 | Click **90° right** twice, the second click about 0.04 s after the first (the script makes the two clicks 0.02 to 0.09 s apart, inside the 0.1 s wait) | The edits are saved once, 0.10 to 0.25 s after the second click: nothing was saved after the first |
| 4 | Click **Crop** in the step tabs (the six tabs Perspective to Export, in the top bar on a wide screen) | The edits are saved once, 0.10 to 0.25 s after the click, with Crop as the open step |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### STA-14.2 A link can lengthen the wait before a save   [auto: phone]
Script only
Stand-in: nothing is replaced, but no person can time a save to a hundredth of a second; the script notes the moment of the tap and of each save of the edits.
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test, opened with ?session.saveDelayMs=1500 added to its address
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: IMG_9136.JPEG open (with **Open photo**), on the Rotate step, a second after it opened

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **90° right** in the row of tools | The photo lies on its side; the edits are saved once, 1.50 to 1.65 s after the tap, not sooner |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## STA-15 Edits are saved at once when leaving

The edits are saved straight away when the page is hidden or left (switching apps, closing the tab), and as any download starts, before the page does anything else (the export, corner shots, a pair, **Save edits**).

- Risk: high
- Check: script; phone (switching apps on an iPhone)
- Layout: both
- Added: 1.10 baseline
- Changed: 1.10.0
- Anchors: `#btnDownload`, `#btnCornerDownload`, `#btnSaveEdits`, `CONFIG.session.enabled`
- Source: `js/app/main.js` (`bindWindowEvents`); `js/app/export.js` (`deliverExport`, `saveEdits`); `js/app/corner-shots.js` (`deliverCornerShots`); `js/app/pair.js` (`deliverPair`)
- Ruling: R36. Edits are saved sooner after each change (about 0.1 s), with the save on close kept as a backstop. The app does this since 1.10.0.
- Cases: 5

### STA-15.2 A change survives switching apps on an iPhone   [phone]
Before you start:
- Device and browser: an iPhone, Safari
- Build: the build under test at the UAT site, https://rberrill.github.io/p1hunt_card_finisher_uat/
- Browser data: none for this site (the site's data cleared in Settings › Safari). Use an ordinary tab, not a private one: this case closes Safari
- Photo: IMG_9136.JPEG from samples/ (AirDrop it to the phone or save it to Photos first)
- Starting screen: IMG_9136.JPEG open, on the Rotate step

Open the app in a new tab (a named action): in Safari, open a new tab and go to the build's address.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **90° right** | The photo lies on its side |
| 2 | At once, swipe up from the bottom edge of the screen | The Home Screen shows |
| 3 | Swipe up from the bottom edge and hold, to open the app switcher | The app switcher shows Safari among the open apps |
| 4 | Swipe Safari up and off the screen | Safari is gone from the app switcher |
| 5 | Tap Safari on the Home Screen | Safari opens |
| 6 | Open the app in a new tab | The start screen offers "Resume IMG_9136.JPEG?" |
| 7 | Tap **Resume** | The photo opens on the Rotate step, lying on its side: the turn was kept |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot (press the side button and volume up together).

### STA-15.3 A change is saved within 0.2 s, before the tab can be closed   [auto: phone, webkit]
Script only
Stand-in: nothing is replaced, but no person can time a save to a tenth of a second; the script notes the moment of the tap and the moment the app hands the edits to the browser's storage.

Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: IMG_9136.JPEG open (with **Open photo**), on the Rotate step, a second after it opened

A save started as a tab closes isn't sure to reach the device, so a change must already be saved by the time a person could close the tab. The page is left open.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **90° right** in the row of tools | The photo lies on its side; the edits, with the turn, are saved within 0.2 s of the tap |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### STA-15.4 Every download saves the edits first   [auto: phone, webkit]
Script only
Stand-in: nothing is replaced, but the save and the download are a few thousandths of a second apart, so no person can see which came first; the script notes the moment each download starts and each save of the edits, and checks the save was made as the download started, before the page did anything else. A save that comes any later (the usual one, 0.1 s after a change, say) fails the case.
Before you start:
- Device and browser: any; a phone-width or a wide window, with downloads saved to a folder
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: IMG_9136.JPEG open (with **Open photo**), on the Export step, a second after it opened

Open Export options: on a phone, tap the options tab (the tab with an up arrow on the top edge of the controls, the block of buttons under the photo); on a wide screen they are always shown under the controls.
Close Export options: on a phone, tap the **×** at their top right; on a wide screen there is nothing to close.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Download** | A question box (the box over the dimmed photo with a question and buttons) asks "Upscale to 2000 px?" |
| 2 | Tap **No** | A file named IMG_9136-straight.jpg is saved; the edits, marked as exported, were saved as its download started |
| 3 | Open Export options | **Save edits** shows in them |
| 4 | Tap **Save edits** | A file named IMG_9136-edits.json is saved; the edits were saved as its download started |
| 5 | Close Export options | **Corner shots** shows in the bottom row of the controls |
| 6 | Tap **Corner shots** | The Corner shots sheet rises, with **Download corners** |
| 7 | Tap **Download corners** | The question box asks "Upscale to 2000 px?" |
| 8 | Tap **No** | The corner sheet is saved; the edits were saved as its download started |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### STA-15.5 A pair's download saves the edits first   [auto: phone, webkit]
Script only
Stand-in: as for STA-15.4, the script notes the moment the download starts and each save of the edits, and checks the save was made as the download started, before the page did anything else.
Before you start:
- Device and browser: any; a phone-width or a wide window, with downloads saved to a folder
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: 14_front_portrait_raw_white.JPEG and 14_back_portrait_raw_white.JPEG from samples/
- Starting screen: the two made a pair: the front opened with **Open photo**, then **Add back** on the Export step with the back; a second after the back opened

With these two photos the pair's joined picture is under 2000 px on its long side, so the question box always asks to upscale.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Export** in the step tabs (the six tabs Perspective to Export, along the bottom on a phone, in the top bar on a wide screen) | The Export step shows **Together** and **Separately** |
| 2 | Tap **Download** | A question box (the box over the dimmed photo with a question and buttons) asks "Upscale to 2000 px?" |
| 3 | Tap **No** | The pair's file is saved; the edits were saved as its download started, not 0.1 s later |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### STA-15.6 Hiding or leaving the page starts a save at once   [auto: phone, webkit]
Script only
Stand-in: the script tells the page it is hidden, then that it is being left, as switching apps and closing the tab would, but never closes it, so each save can be seen; it notes the moment of each save. No person can hide a page within a tenth of a second of a tap, nor see a save made as a tab closes.

Ruling R36 keeps this save as a backstop to the sooner save after each change. The link makes the usual wait before a save 1.5 s, so only the backstop can save within 0.1 s.

Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test, opened with ?session.saveDelayMs=1500 added to its address
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: IMG_9136.JPEG open (with **Open photo**), on the Rotate step, a second after it opened

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **90° right** in the row of tools | The photo lies on its side |
| 2 | At once (within 0.1 s), the script tells the page it is hidden, as switching to another tab does | The edits, with the turn, are saved within 0.1 s of it, long before the 1.5 s wait |
| 3 | The script tells the page it is shown again, then waits two seconds | The photo still lies on its side |
| 4 | Tap **90° right** again | The photo is upside down |
| 5 | At once, the script tells the page it is being left, as closing the tab does | The edits, with the second turn, are saved within 0.1 s of it |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## STA-16 The photo itself is saved once

The original file (its bytes, type and name) is saved once for each newly opened photo; the edits are not saved until it has been.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.session.dbName`, "[card-finisher] session photo not saved:"
- Source: `js/app/adapters.js` (`Session.savePhoto`, `Session.saveSoon`); `js/app/state.js` (`openFile`)
- Cases: 2

### STA-16.1 The photo itself is saved once   [auto: desktop, webkit]
Script only
Stand-in: nothing is replaced, but no person can count the writes to the browser's storage or see their order; the script notes each write as it is made and reads what was written.
Before you start:
- Device and browser: a computer; a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: IMG_9136.JPEG and IMG_9075.JPEG from samples/
- Starting screen: the start screen

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Click **Open photo** and choose IMG_9136.JPEG | The photo opens. The browser's storage holds the file: its 918,290 bytes, its type (image/jpeg) and its name, IMG_9136.JPEG; it was written once, before any edits were |
| 2 | Click **Rotate** in the step tabs (the six tabs Perspective to Export, in the top bar on a wide screen) | The Rotate step shows |
| 3 | Click **90° right** in the row of tools | The photo lies on its side; the edits are saved with the turn; the file is not written again |
| 4 | Click **90° left** | The photo is upright again; the edits are saved again; the file is still not written again |
| 5 | Click **Open** (the folder at the top left) and choose IMG_9075.JPEG | IMG_9075.JPEG opens; the stored file is now IMG_9075.JPEG, written once more |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### STA-16.2 No edits are saved until the photo is   [auto: phone]
Script only
Stand-in: no person can make a browser refuse to store one file; the script makes the browser's storage refuse the photo, as a full disk would.
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the start screen

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Open photo** and choose IMG_9136.JPEG | The photo opens; the browser's storage holds no photo |
| 2 | Tap **Rotate** in the step tabs (the six tabs Perspective to Export, along the bottom on a phone, in the top bar on a wide screen) | The Rotate step shows |
| 3 | Tap **90° right** in the row of tools, then wait a second | The photo lies on its side; no edits were saved |
| 4 | Reload the page | No card: nothing is offered to resume |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## STA-17 Saving is best-effort

Where the browser has no on-device database, or saving is turned off by a link (`?session.enabled=0`), nothing is saved and no Resume card ever shows. A failed save is only logged to the console; the user sees nothing.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.session.enabled`, "[card-finisher] session edits not saved:", "[card-finisher] session photo not saved:"
- Source: `js/app/adapters.js` (`Session.enabled`, `Session.savePhoto`, `Session.flush`, `Session.peek`)
- Cases: 3

### STA-17.1 A link can turn saving off   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window, in a private window
- Build: the build under test, opened with ?session.enabled=0 added to its address
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the start screen

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Open photo** and choose IMG_9136.JPEG | The photo opens |
| 2 | Tap **Rotate** in the step tabs (the six tabs Perspective to Export, along the bottom on a phone, in the top bar on a wide screen) | The Rotate step shows |
| 3 | Tap **90° right** in the row of tools, then wait two seconds | The photo lies on its side |
| 4 | Reload the page (the address still has ?session.enabled=0) | No card: nothing is offered to resume |
| 5 | Open the build without ?session.enabled=0 | No card either: nothing was saved |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### STA-17.2 Without an on-device database nothing is saved   [auto: phone, webkit]
Script only
Stand-in: no person can take a browser's on-device database (IndexedDB) away from one site, so the script removes it from the page before the app loads, as a browser without one would be.
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: the start screen

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Open photo** and choose IMG_9136.JPEG | The photo opens as usual, with no message |
| 2 | Tap **Rotate** in the step tabs (the six tabs Perspective to Export, along the bottom on a phone, in the top bar on a wide screen) | The Rotate step shows |
| 3 | Tap **90° right** in the row of tools, then wait two seconds | The photo lies on its side; no error in the console |
| 4 | Reload the page | No card: nothing is offered to resume |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### STA-17.3 A failed save shows the user nothing   [auto: phone]
Script only
Stand-in: no person can make a browser refuse to store one record; once the photo is stored, the script makes the browser's storage refuse every save of the edits, as a full disk would.
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: IMG_9136.JPEG open (with **Open photo**), on the Rotate step, its photo stored

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **90° right** in the row of tools, then wait a second | The photo lies on its side; no message shows over the photo |
| 2 | Look at the console | A warning starting "[card-finisher] session edits not saved:" |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## STA-18 A new photo starts clean

A newly opened photo starts on Perspective with fresh edits. The undo history, every view's zoom, the detection results, Levels' unapplied change, the picker for Levels, the before-and-after compare, Preview, Tap to find card and the exported mark are all cleared, and the first corner handle is selected. The compare has no case of its own: it lasts only while the photo or the C key is held, and the code also ends it whenever the step changes, so no person can carry one into a new photo.

- Risk: high
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnUndo`, `#btnFindCard`, `#toolCandidate`, `#levelsPicks`
- Source: `js/app/state.js` (`openFile`, `resetPhotoState`); `js/app/shell.js` (`setTab`)
- Ruling: R89. Snap, Grid, **Debug overlay** and the Perspective and Rotate modes carry over to a new photo, but not over a reload. The app already does this.
- Cases: 11

### STA-18.1 A new photo opens on Perspective with nothing to undo   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: IMG_9136.JPEG and IMG_9075.JPEG from samples/
- Starting screen: IMG_9136.JPEG open (with **Open photo**), on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Rotate** in the step tabs (the six tabs Perspective to Export, along the bottom on a phone, in the top bar on a wide screen) | The Rotate step shows |
| 2 | Tap **90° right** in the row of tools | The photo lies on its side |
| 3 | Tap **90° right** again | The photo is upside down |
| 4 | Tap **Undo** (the arrow curving left, at the top right) | The photo lies on its side again; **Redo** (the arrow curving right) is no longer greyed out |
| 5 | Tap **Open** (the folder at the top left; on a phone it has no label) and choose IMG_9075.JPEG | IMG_9075.JPEG opens upright, on the Perspective step, with **Undo** and **Redo** both greyed out |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### STA-18.2 A Levels change left unapplied does not carry over   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: IMG_9136.JPEG and IMG_9075.JPEG from samples/
- Starting screen: IMG_9136.JPEG open (with **Open photo**), on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Levels** in the step tabs (the six tabs Perspective to Export, along the bottom on a phone, in the top bar on a wide screen) | The Levels step shows |
| 2 | Tap **Auto** in the row of tools | **Discard** and **Apply**, at the two ends of the line at the top of the controls (the block of buttons under the photo), are no longer greyed out, and a white dot sits on the **Levels** tab |
| 3 | Tap **Open** (the folder at the top left; on a phone it has no label) and choose IMG_9075.JPEG | IMG_9075.JPEG opens on the Perspective step; no white dot on the **Levels** tab |
| 4 | Tap **Levels** in the step tabs | **Discard** and **Apply** are greyed out: nothing waits to be applied |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### STA-18.3 A new photo is not marked as exported   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window, with downloads saved to a folder
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: IMG_9136.JPEG and IMG_9075.JPEG from samples/
- Starting screen: IMG_9136.JPEG open (with **Open photo**), on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Export** in the step tabs (the six tabs Perspective to Export, along the bottom on a phone, in the top bar on a wide screen) | The Export step shows **Download**, and no **Next card** |
| 2 | Tap **Download** | A question box (the box over the dimmed photo with a question and buttons) asks "Upscale to 2000 px?" |
| 3 | Tap **No** | A file is saved, and **Next card** shows |
| 4 | Tap **Next card** and choose IMG_9075.JPEG | IMG_9075.JPEG opens on the Perspective step |
| 5 | Tap **Export** in the step tabs | No **Next card**: the new photo has not been exported |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### STA-18.4 A new photo opens fitted to the screen   [auto: phone]
Before you start:
- Device and browser: a phone, or a phone-width window, 390 × 844 px
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: IMG_9136.JPEG and IMG_9075.JPEG from samples/
- Starting screen: IMG_9136.JPEG open (with **Open photo**), on the Perspective step; no **Fit to screen** in the top bar

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Drag the photo from its top left corner 60 px down and to the right, well away from the handles | The photo moves with the finger; **Fit to screen** (the frame at the top right) shows in the top bar |
| 2 | Tap **Open** (the folder at the top left) and choose IMG_9075.JPEG | IMG_9075.JPEG opens fitted to the screen; **Fit to screen** has gone |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### STA-18.5 Preview is off for a new photo   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: IMG_9136.JPEG and IMG_9075.JPEG from samples/
- Starting screen: IMG_9136.JPEG open (with **Open photo**), on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Preview** in the row of tools | **Preview** is On; the line above the controls (the one line of text at the top of the controls, the block of buttons under the photo) reads PREVIEW and the corner handles are hidden |
| 2 | Tap **Open** (the folder at the top left; on a phone it has no label) and choose IMG_9075.JPEG | IMG_9075.JPEG opens with **Preview** Off, its corner handles showing and the line reading NUDGE |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### STA-18.6 The first corner is selected for a new photo   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: IMG_9136.JPEG and IMG_9075.JPEG from samples/
- Starting screen: IMG_9136.JPEG open (with **Open photo**), on the Perspective step; the line above the controls (the one line of text at the top of the controls, the block of buttons under the photo) reads NUDGE CORNER 1 OF 4

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Next handle** | The line reads NUDGE CORNER 2 OF 4 |
| 2 | Tap **Next handle** again | The line reads NUDGE CORNER 3 OF 4 |
| 3 | Tap **Open** (the folder at the top left; on a phone it has no label) and choose IMG_9075.JPEG | IMG_9075.JPEG opens; the line reads NUDGE CORNER 1 OF 4 |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### STA-18.7 Tap to find card is not left waiting for a new photo   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: IMG_9136.JPEG and IMG_9075.JPEG from samples/
- Starting screen: IMG_9136.JPEG open (with **Open photo**), on the Perspective step

Open Perspective options: on a phone, tap the options tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Open Perspective options | **Tap to find card** shows in them |
| 2 | Tap **Tap to find card** | On a phone the options close; the line above the controls (the one line of text at the top of the controls, the block of buttons under the photo) reads "Tap the card in the photo." with **Cancel** |
| 3 | Tap **Open** (the folder at the top left; on a phone it has no label) and choose IMG_9075.JPEG | IMG_9075.JPEG opens; the line reads NUDGE CORNER 1 OF 4, with no "Tap the card in the photo." and no **Cancel** |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### STA-18.8 Snap and Flatten stay as set for a new photo   [auto: phone]

Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: IMG_9136.JPEG and IMG_9075.JPEG from samples/
- Starting screen: IMG_9136.JPEG open (with **Open photo**), on the Perspective step, for the first time since the page was loaded: **Nudge** selected (solid white) and **Snap** Off

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Snap** in the row of tools | **Snap** is On |
| 2 | Tap **Flatten** in the row of tools | **Flatten** is selected; the line above the controls (the one line of text at the top of the controls, the block of buttons under the photo) reads FLATTEN |
| 3 | Tap **Open** (the folder at the top left; on a phone it has no label) and choose IMG_9075.JPEG | IMG_9075.JPEG opens with **Flatten** still selected, the line reading FLATTEN, and **Snap** still On |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### STA-18.9 Snap and Flatten go back to their start after a reload   [auto: phone]

Before you start:
- Device and browser: any; a phone-width or a wide window, in a private window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: IMG_9136.JPEG open (with **Open photo**), on the Perspective step, for the first time since the page was loaded: **Nudge** selected (solid white) and **Snap** Off

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Snap** in the row of tools | **Snap** is On |
| 2 | Tap **Flatten** in the row of tools | **Flatten** is selected; the line above the controls (the one line of text at the top of the controls, the block of buttons under the photo) reads FLATTEN |
| 3 | Wait two seconds, then reload the page | The card offers "Resume IMG_9136.JPEG?" |
| 4 | Tap **Resume** | The photo opens on the Perspective step with **Nudge** selected, the line reading NUDGE, and **Snap** Off |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### STA-18.10 The card outlines found are those of the new photo   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: IMG_9136.JPEG and IMG_9075.JPEG from samples/
- Starting screen: IMG_9136.JPEG open (with **Open photo**), on the Perspective step

**Candidate**, in the row of tools, shows which of the card outlines found in the photo the corner handles sit on, and how many were found.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Look at **Candidate** in the row of tools | It reads 1/3 |
| 2 | Tap **Candidate** | It reads 2/3; the corner handles move to the second outline |
| 3 | Tap **Open** (the folder at the top left; on a phone it has no label) and choose IMG_9075.JPEG | IMG_9075.JPEG opens; **Candidate** reads 1/3, with the corner handles on the first outline found in this photo |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### STA-18.11 Pick white is not left armed for a new photo   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: IMG_9136.JPEG and IMG_9075.JPEG from samples/
- Starting screen: IMG_9136.JPEG open (with **Open photo**), on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Levels** in the step tabs (the six tabs Perspective to Export, along the bottom on a phone, in the top bar on a wide screen) | The Levels step shows **Pick white** |
| 2 | Tap **Pick white** | **Pick white** is selected (solid white); the line between **Discard** and **Apply** reads "Tap something white" |
| 3 | Tap **Open** (the folder at the top left; on a phone it has no label) and choose IMG_9075.JPEG | IMG_9075.JPEG opens on the Perspective step |
| 4 | Tap **Levels** in the step tabs | **Pick white** is not selected; the line reads "Pick white, or try Auto" |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## STA-19 A new photo starts from the remembered settings

A new photo's crop preset and export settings start from the ones last used (remembered on this device); with none remembered they are 1:1, JPEG, quality 0.92, 2000 px, bilinear and a white fill.

- Risk: high
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.crop.defaultPreset`, `CONFIG.export.format`, `CONFIG.export.longEdge`, `CONFIG.storageKey`
- Source: `js/app/state.js` (`newState`, `defaultState`, `cropDefaults`, `exportDefaults`); `js/app/adapters.js` (`Prefs.load`)
- Cases: 3

Open Export options: on a phone, tap the options tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls. Close them: on a phone, tap the **×** at their top right; on a wide screen there is nothing to close.

### STA-19.1 With nothing remembered, a photo starts at 1:1, 2000 px, JPEG   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window, in a private window so that nothing is remembered on this device
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: IMG_9136.JPEG open (with **Open photo**), on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Crop** in the step tabs (the six tabs Perspective to Export, along the bottom on a phone, in the top bar on a wide screen) | **1:1** is selected (solid white) in the row of sizes |
| 2 | Tap **Export** in the step tabs | **2000** and **JPEG** are selected |
| 3 | Open Export options | **Quality** reads 92%, **Interpolation** reads Bilinear and **Fill outside photo** reads White |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### STA-19.2 The next photo starts from the crop size used last, after a reload too   [auto: phone, webkit]
Before you start:
- Device and browser: any; a phone-width or a wide window, in a private window so that nothing is remembered on this device
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: IMG_9136.JPEG and IMG_9075.JPEG from samples/
- Starting screen: IMG_9136.JPEG open (with **Open photo**), on the Perspective step

Start over with IMG_9075.JPEG (a named action): wait two seconds, reload the page, tap **Start fresh** on the start screen, then tap **Open photo** and choose IMG_9075.JPEG.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Crop** in the step tabs (the six tabs Perspective to Export, along the bottom on a phone, in the top bar on a wide screen) | **1:1** is selected (solid white) in the row of sizes |
| 2 | Tap **4:5** in the row of sizes | **4:5** is selected |
| 3 | Start over with IMG_9075.JPEG | IMG_9075.JPEG opens on the Perspective step |
| 4 | Tap **Crop** in the step tabs | **4:5** is selected |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### STA-19.3 The next photo starts from the export settings used last, after a reload too   [auto: phone, webkit]
Before you start:
- Device and browser: any; a phone-width or a wide window, in a private window so that nothing is remembered on this device
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: IMG_9136.JPEG and IMG_9075.JPEG from samples/
- Starting screen: IMG_9136.JPEG open (with **Open photo**), on the Perspective step

Start over with IMG_9075.JPEG (a named action): close Export options, wait two seconds, reload the page, tap **Start fresh** on the start screen, then tap **Open photo** and choose IMG_9075.JPEG.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Export** in the step tabs (the six tabs Perspective to Export, along the bottom on a phone, in the top bar on a wide screen) | **2000** and **JPEG** are selected |
| 2 | Tap **1080** | **1080** is selected |
| 3 | Tap **WebP** | **WebP** is selected |
| 4 | Open Export options | **Quality** reads 92% |
| 5 | Drag the **Quality** slider until it reads 80% | **Quality** reads 80% |
| 6 | Tap **Interpolation** and choose **Bicubic (sharper, slower)** | **Interpolation** reads Bicubic |
| 7 | Tap **Fill outside photo** and choose **Black** | **Fill outside photo** reads Black |
| 8 | Start over with IMG_9075.JPEG | IMG_9075.JPEG opens on the Perspective step |
| 9 | Tap **Export** in the step tabs | **1080** and **WebP** are selected |
| 10 | Open Export options | **Quality** reads 80%, **Interpolation** Bicubic and **Fill outside photo** Black |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## STA-20 A photo opens upright

A photo opens the right way up, following the orientation the camera recorded in the file.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#fileInput`, `#btnOpenEmpty`
- Source: `js/app/adapters.js` (`ImageSource.load`)
- Cases: 1

### STA-20.1 A photo marked as taken sideways opens turned the way it was taken   [auto: phone, webkit]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: IMG_9136.JPEG from samples/, and IMG_9136-sideways.JPEG: a copy of it whose orientation tag (the note a camera writes for how it was held) says "turned a quarter clockwise" (EXIF orientation 6). The script makes the copy; by hand, make it with exiftool: `exiftool -Orientation#=6 IMG_9136-sideways.JPEG`
- Starting screen: the start screen, with no photo open

Open Export options: tap **Export** in the step tabs (the six tabs Perspective to Export, along the bottom on a phone, in the top bar on a wide screen), then, on a phone, the options tab (the tab with an up arrow on the top edge of the controls); on a wide screen they are always shown under the controls. Close them: on a phone, tap the **×** at their top right.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Open photo** and choose IMG_9136.JPEG | The card stands upright |
| 2 | Open Export options | The line near their foot starts "Source 1498 × 2098 px" |
| 3 | Close Export options | The photo shows whole above the controls |
| 4 | Tap **Open** (the folder at the top left; on a phone it has no label) and choose IMG_9136-sideways.JPEG | The same card opens lying on its side, its top to the right: the picture turned a quarter clockwise |
| 5 | Open Export options | The line near their foot starts "Source 2098 × 1498 px" |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## STA-21 HEIC photos

A HEIC photo opens where the browser can decode it (Safari). Where it can't, a red message says "This browser can’t open HEIC. Save the photo as JPEG first (Safari opens HEIC directly)."

- Risk: medium
- Check: phone, script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#fileInput`, "This browser can’t open HEIC. Save the photo as JPEG first "
- Source: `js/app/adapters.js` (`ImageSource.load`, `ImageSource.isHeic`); `js/app/state.js` (`openFile`)
- Cases: 2

### STA-21.1 Safari on an iPhone opens a HEIC file   [phone]
Before you start:
- Device and browser: an iPhone, Safari
- Build: the build under test at the UAT site, https://rberrill.github.io/p1hunt_card_finisher_uat/
- Browser data: none for this site (a private tab, or the site's data cleared in Settings › Safari)
- Photo: a photo of a card saved in the Files app as a HEIC file: its name in Files ends in .HEIC. Whether Photos' Save to Files keeps that ending is find-out item Q-06; until it is answered, look at the name in Files before you start
- Starting screen: the start screen, with no photo open

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Open photo** | A menu offers Photo Library, Take Photo and Choose File |
| 2 | Tap **Choose File** | The Files app's picker opens |
| 3 | Tap the HEIC file | The photo opens on the Perspective step, with its corner handles on the card |
| 4 | Tap **Export** in the step tabs (the six tabs along the bottom, Perspective to Export) | The Export step shows **Download** |
| 5 | Tap the options tab (the small tab with an up arrow on the top edge of the controls, the block of buttons under the photo) | Export options rise; the line near their foot names the file's type as image/heic |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot (press the side button and volume up together).

### STA-21.2 A browser that can't open HEIC says so   [auto: phone]
Before you start:
- Device and browser: a computer, Chrome or Edge; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: card.HEIC from tests/fixtures/ (a line of text named like a HEIC photo: no browser decodes it, so the app takes it for a HEIC photo it can't open)
- Starting screen: the start screen, with no photo open

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Open photo** and choose card.HEIC | A red message says "This browser can’t open HEIC. Save the photo as JPEG first (Safari opens HEIC directly)."; the start screen stays and no photo opens |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## STA-22 A file that isn't a readable image

Opening a file that can't be read as an image shows the red message "Couldn’t read that file as an image." The photo that was open, if any, stays as it was.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: 1.10.0
- Anchors: `#fileInput`, "Couldn’t read that file as an image."
- Source: `js/app/state.js` (`openFile`); `js/app/adapters.js` (`ImageSource.load`)
- Ruling: R31. A failed open changes nothing: the photo that was open goes on being saved for Resume. The app does this from 1.10.0 (BUG-001, fixed; its case is STA-22.3).
- Cases: 3

The file that isn't an image: not-a-photo.JPEG from tests/fixtures/ (a line of text, named like a photo).

### STA-22.1 A file that isn't an image opens nothing   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- File: not-a-photo.JPEG from tests/fixtures/
- Starting screen: the start screen, with no photo open

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Open photo** and choose not-a-photo.JPEG | A red message says "Couldn’t read that file as an image."; the start screen stays and no photo opens |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### STA-22.2 A file that isn't an image leaves the open photo as it was   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/; file: not-a-photo.JPEG from tests/fixtures/
- Starting screen: IMG_9136.JPEG open (with **Open photo**), on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Rotate** in the step tabs (the six tabs Perspective to Export, along the bottom on a phone, in the top bar on a wide screen) | The Rotate step shows |
| 2 | Tap **90° right** in the row of tools | The photo lies on its side; **Undo** is no longer greyed out |
| 3 | Tap **Open** (the folder at the top left; on a phone it has no label) and choose not-a-photo.JPEG | A red message says "Couldn’t read that file as an image."; IMG_9136.JPEG stays on the Rotate step, lying on its side, with **Undo** still not greyed out |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### STA-22.3 After a failed open, the open photo's edits are still kept for Resume   [auto: phone, webkit]
Before you start:
- Device and browser: any; a phone-width or a wide window, in a private window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/; file: not-a-photo.JPEG from tests/fixtures/
- Starting screen: IMG_9136.JPEG open (with **Open photo**), on the Rotate step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Open** (the folder at the top left; on a phone it has no label) and choose not-a-photo.JPEG | A red message says "Couldn’t read that file as an image."; IMG_9136.JPEG stays open |
| 2 | Tap **90° right** in the row of tools | The photo lies on its side |
| 3 | Wait two seconds, then reload the page | The card offers "Resume IMG_9136.JPEG?" |
| 4 | Tap **Resume** | The photo opens on the Rotate step, lying on its side: the turn was kept |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## STA-23 Two photos opened quickly

If a second photo is opened before the first has finished loading, only the last one opens.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: "Loading…", `#fileInput`
- Source: `js/app/state.js` (`openFile`)
- Cases: 1

### STA-23.1 A photo chosen while another is loading is the one that opens   [auto: phone]
Script only
Stand-in: a sample photo opens in a fraction of a second, too quickly for a person to choose another while it loads, so the script holds back the first photo's loading by two seconds, as a large photo takes on a phone.
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photos: IMG_9136.JPEG and IMG_9075.JPEG from samples/
- Starting screen: the start screen, with no photo open

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Open photo** and choose IMG_9136.JPEG | The message "Loading…" shows over the start screen |
| 2 | While "Loading…" still shows, tap **Open photo** again and choose IMG_9075.JPEG | IMG_9075.JPEG opens |
| 3 | Wait three seconds | IMG_9075.JPEG is still the photo open: the first photo never showed |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## STA-24 A 48 MP phone photo

A 48 MP iPhone photo opens and stays usable: the screen works from smaller copies (2048 px for the photo on screen, 720 px for the live preview while dragging, 1000 px for card detection), and only the export reads the full photo.

- Risk: high
- Check: phone, script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.previewMaxPx`, `CONFIG.thumbMaxPx`, `CONFIG.detect.workingSize`
- Source: `js/app/state.js` (`makeCopies`); `js/app/adapters.js` (`scaledCopy`)
- Cases: 2

### STA-24.1 A 48 MP photo from the camera stays usable on an iPhone   [phone]
The finished message is in ruling R79's words. Until R79 is built (BUG-290) the app writes today's ("Exported W × H px in N s."), which this case also accepts: it reads only the size it gives, and MSG-22.1 holds the words.
Before you start:
- Device and browser: an iPhone whose main camera takes 48 MP photos, Safari. Which iPhones do, and at which camera setting, is find-out item Q-02; until it is answered, row 6 confirms the photo is 48 MP
- Build: the build under test at the UAT site, https://rberrill.github.io/p1hunt_card_finisher_uat/
- Browser data: none for this site (a private tab, or the site's data cleared in Settings › Safari)
- Photo: a photo of a card taken with the main camera at its highest resolution setting, held upright, with the card filling at least half the photo's height, in Photos
- Starting screen: the start screen, with no photo open

Accept Safari's downloads (a named action): each time Safari asks whether to download a file, tap **Download**, until it asks no more.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Open photo** | A menu offers Photo Library, Take Photo and Choose File |
| 2 | Tap **Photo Library** | Your photos show |
| 3 | Choose the photo | The photo opens on the Perspective step, with its corner handles on the card; the page did not reload or go blank |
| 4 | Drag a corner handle about a finger's width toward the middle of the card, and lift your finger | The handle moves with the finger and stays where you lifted it; the page did not reload or go blank |
| 5 | Tap **Export** in the step tabs (the six tabs along the bottom, Perspective to Export) | The Export step shows **Download** |
| 6 | Tap the options tab (the small tab with an up arrow on the top edge of the controls, the block of buttons under the photo) | Export options rise; the line near their foot starts "Source" and gives between 47 and 49 MP |
| 7 | Tap the **×** at the top right of Export options | They close; **Download** shows |
| 8 | Tap **Download** | No question box; a message over the photo begins "Photo downloaded: 2000 × 2000 px" |
| 9 | Accept Safari's downloads | Safari asks nothing more; the photo is still on screen, on Export; the page did not reload or go blank |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, the iPhone model, a screenshot (press the side button and volume up together).

### STA-24.2 A 48 MP photo is worked on from smaller copies   [auto: phone, webkit]
Script only
Stand-in: no person can see the size of the copies the app works from, so the script reads them. No 48 MP photo is in samples/, so the script enlarges IMG_9136.JPEG to about 48 MP (5842 × 8182 px) as the photo.
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136-48MP.JPEG: IMG_9136.JPEG enlarged to 5842 × 8182 px (the script makes it)
- Starting screen: the start screen, with no photo open

Open Export options: on a phone, tap the options tab (the tab with an up arrow on the top edge of the controls, the block of buttons under the photo); on a wide screen they are always shown under the controls.
Close Export options: on a phone, tap the **×** at their top right; on a wide screen there is nothing to close.

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Open photo** and choose IMG_9136-48MP.JPEG | The photo opens on the Perspective step, with its corner handles on the card; the copy on screen is 2048 px on its long side, the one for the live preview 720 px and the one for card detection 1000 px |
| 2 | Tap **Export** in the step tabs (the six tabs Perspective to Export, along the bottom on a phone, in the top bar on a wide screen) | The Export step shows **Download** |
| 3 | Open Export options | The line near their foot starts "Source 5842 × 8182 px (47.8 MP)" |
| 4 | Close Export options | **Download** shows in the controls |
| 5 | Tap **Download** | A file 2000 px on its long side is saved, with no question first |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## STA-25 Cancelling the file picker

Closing the file picker without choosing a file changes nothing, whichever button opened it (**Open photo**, **Next card** or **Add back**): the open photo, its edits and the pair stay as they were.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#fileInput`, `#btnOpen`, `#btnNextCard`, `#btnAddBack`
- Source: `js/app/shell.js` (`pickPhoto`); `js/app/adapters.js` (`ImageSource.bindPicker`); `js/app/main.js` (`bindPhotoInput`)
- Cases: 3

### STA-25.1 Cancelling Open keeps the photo and its edits   [auto: phone, webkit]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: IMG_9136.JPEG open (with **Open photo**), on the Perspective step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Rotate** in the step tabs (the six tabs Perspective to Export, along the bottom on a phone, in the top bar on a wide screen) | The Rotate step shows |
| 2 | Tap **90° right** in the row of tools | The photo lies on its side; **Undo** is no longer greyed out |
| 3 | Tap **Open** (the folder at the top left; on a phone it has no label) | The system's file picker opens |
| 4 | Close the picker without choosing a file (**Cancel**) | IMG_9136.JPEG is still open on the Rotate step, lying on its side, with **Undo** not greyed out; no message shows |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### STA-25.2 Cancelling Next card keeps the exported photo   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window, with downloads saved to a folder
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: IMG_9136.JPEG from samples/
- Starting screen: IMG_9136.JPEG open (with **Open photo**), on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Download** | A question box (the box over the dimmed photo with a question and buttons) asks "Upscale to 2000 px?" |
| 2 | Tap **No** | A file is saved, and **Next card** shows |
| 3 | Tap **Next card** | The system's file picker opens |
| 4 | Close the picker without choosing a file (**Cancel**) | IMG_9136.JPEG is still open on the Export step, with **Next card** showing |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

### STA-25.3 Cancelling Add back leaves the photo unpaired   [auto: phone]
Before you start:
- Device and browser: any; a phone-width or a wide window
- Build: the build under test
- Browser data: none for this site (a private window, or the site's data cleared)
- Photo: 14_front_portrait_raw_white.JPEG from samples/
- Starting screen: 14_front_portrait_raw_white.JPEG open (with **Open photo**), on the Export step

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Add back** | The system's file picker opens |
| 2 | Close the picker without choosing a file (**Cancel**) | The photo is still open on the Export step, with **Add back** showing and no **Front** or **Back** in the top bar |
| 3 | Tap **Open** (the folder at the top left; on a phone it has no label) and choose 14_front_portrait_raw_white.JPEG | It opens as a new photo, on the Perspective step, with no **Front** or **Back** in the top bar: the cancelled Add back left nothing waiting |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot.

## STA-26 What the iPhone picker hands over

On an iPhone, **Open photo** offers Photo Library, Take Photo and Choose File, and the photo that arrives has every pixel of the original (a 12 MP photo stays 12 MP), with a HEIC photo arriving as a JPEG. This is iOS's behavior, but the file types the app asks for decide it.

- Risk: medium
- Check: phone
- Layout: phone. iPhone Safari only.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#fileInput`, `#btnOpenEmpty`, `#btnOpen`
- Source: `index.html` (the photo file input's accepted types); `js/app/adapters.js` (`ImageSource.load`)
- Cases: 2

### STA-26.1 Open photo offers the photo library, the camera and files   [phone]
Before you start:
- Device and browser: an iPhone, Safari
- Build: the build under test at the UAT site, https://rberrill.github.io/p1hunt_card_finisher_uat/
- Browser data: none for this site (a private tab, or the site's data cleared in Settings › Safari)
- Photo: none needed
- Starting screen: the start screen, with no photo open

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Open photo** | A menu offers Photo Library, Take Photo and Choose File |
| 2 | Tap **Take Photo** | The camera opens |
| 3 | Tap **Cancel** in the camera | The start screen shows as it was |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot (press the side button and volume up together).

### STA-26.2 A photo from the library arrives whole, as a JPEG   [phone]
Before you start:
- Device and browser: an iPhone, Safari
- Build: the build under test at the UAT site, https://rberrill.github.io/p1hunt_card_finisher_uat/
- Browser data: none for this site (a private tab, or the site's data cleared in Settings › Safari)
- Photo: a 12 MP photo of a card in the Photo Library, taken with the camera's usual setting (HEIC, the iPhone's default format). Note its size in pixels, such as 3024 × 4032, before you start; where Photos shows it is find-out item Q-03
- Starting screen: the start screen, with no photo open

| # | Do this | You should see |
| --- | --- | --- |
| 1 | Tap **Open photo** | A menu offers Photo Library, Take Photo and Choose File |
| 2 | Tap **Photo Library** | Your photos show |
| 3 | Choose the photo | The photo opens on the Perspective step |
| 4 | Tap **Export** in the step tabs (the six tabs along the bottom, Perspective to Export) | The Export step shows **Download** |
| 5 | Tap the options tab (the small tab with an up arrow on the top edge of the controls, the block of buttons under the photo) | Export options rise; the line near their foot reads "Source", the size you noted (such as 3024 × 4032 px, 12.2 MP), then image/jpeg |

Pass: every row's result is seen.
On a fail, record: the row number, what you saw instead, a screenshot (press the side button and volume up together).
