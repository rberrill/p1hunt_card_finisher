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
- Cases: none yet

## STA-02 Open a photo from the start screen

**Open photo** on the start screen opens the system's file picker for one image (any image type, plus .heic and .heif). The same file can be picked twice in a row and opens both times.

- Risk: high
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnOpenEmpty`, `#fileInput`, "Open photo"
- Source: `js/app/shell.js` (`pickPhoto`, `bindNavigation`); `js/app/adapters.js` (`ImageSource.bindPicker`); `js/app/main.js` (`bindPhotoInput`)
- Cases: none yet

## STA-03 No working controls before a photo

Before a photo is open, nothing that needs a photo is offered.

- Risk: medium
- Check: script
- Layout: both. On a phone there is no top bar, no controls and no step tabs at all; on a wide screen the top bar shows with the step tabs and **Fit to screen** dimmed, and the side panel's step sections are hidden.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#topBarHost`, `#tabBarHost`, `#panel`, `#btnFit`
- Source: `css/app.css` (the shell's phone and wide blocks); `js/app/shell.js` (`syncUI`, `syncFitButton`)
- Flag: to confirm. On a phone with no photo open, the backtick key still opens the detection tuning panel, which floats over the start screen.
- Cases: none yet

## STA-04 The Resume card

When the page loads and a whole saved session (the photo and its edits) is on this device, a card on the start screen offers **Resume** or **Start fresh**. The app never resumes by itself, and the card goes away when a photo is opened any other way.

- Risk: high
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#resume`, `#btnResume`, `#btnFresh`
- Source: `js/app/start-screen.js` (`offerResume`, `hideResume`); `js/app/adapters.js` (`Session.peek`); `js/app/main.js` (`init`); `js/app/state.js` (`openFile`)
- Ruling: R27. The Resume card is not a question card: it has no fade, does not keep Tab inside it and does not return focus. The app already does this.
- Cases: none yet

## STA-05 What the Resume card says

The card reads "Last photo · " with how long ago (just now, n min ago, n h ago or n d ago; left out if the saved time is unreadable), and "Resume" with the photo's name and a question mark. A long name is cut to 60 characters; with no name it says "your last photo"; a front and back pair reads as the front's name, " + ", the back's name. The small picture is a drawn card outline (two for a pair), never the photo itself.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#resumeWhen`, `#resumeName`, `#resumeThumb`, "Last photo · ", "your last photo"
- Source: `js/app/start-screen.js` (`offerResume`, `timeAgo`, `resumeName`); `js/app/core.js` (`shortText`)
- Cases: none yet

## STA-06 Which start button is red

While the Resume card shows, **Resume** is the red button and **Open photo** is not. When the card goes, **Open photo** is red again.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnResume`, `#btnOpenEmpty`, `.is-main`
- Source: `js/app/start-screen.js` (`offerResume`, `hideResume`)
- Cases: none yet

## STA-07 Resume where you left off

**Resume** reopens the saved photo with its edits, on the step that was open, with any unapplied Levels change, and with the photo still marked as exported if it was (so **Next card** shows again). A front and back pair comes back as a pair. The message "Resumed where you left off." shows.

- Risk: high
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnResume`, "Resumed where you left off.", `#btnNextCard`
- Source: `js/app/start-screen.js` (`resumeSession`); `js/app/state.js` (`openFile`, `restoreLevelsDraft`); `js/app/pair.js` (`restorePair`, `finishResume`)
- Cases: none yet

## STA-08 Resume when the saved size doesn't match

Resume applies the saved edits only if the saved width and height match the photo as decoded. Otherwise the photo opens with fresh edits, with no message, and the fresh edits replace the saved ones.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnResume`, "Resumed where you left off."
- Source: `js/app/state.js` (`openFile`)
- Ruling: R23. A size mismatch shows an amber message, "Couldn’t restore your edits, so the photo was opened fresh." The app differs today. New wording, to be approved by Rich.
- Cases: none yet

## STA-09 Resume keeps the saved corners

After a resume, card detection still runs, but only to fill the **Candidate** choices and the snap targets; it never moves the resumed corners.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnResume`, `#toolCandidate`
- Source: `js/app/state.js` (`openFile`, `runDetect`)
- Cases: none yet

## STA-10 Resume brings back the logo

A resumed photo that had a logo gets its logo image back: from the logo stored with that photo, else from the saved logo when it is the same one.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnResume`, "The overlay image isn’t loaded. Open the Overlay step and add it again."
- Source: `js/app/overlay.js` (`ensureOverlayImage`); `js/app/state.js` (`openFile`)
- Ruling: R22. **Remove** leaves the photo's logo in storage, so Undo after a resume can bring it back. The app already does this.
- Cases: none yet

## STA-11 Resume with the saved photo missing

If the saved photo is gone when **Resume** is tapped, an amber message says "The saved photo is gone. Open it again." The start screen stays, with the Resume card hidden.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnResume`, "The saved photo is gone. Open it again."
- Source: `js/app/start-screen.js` (`resumeSession`)
- Cases: none yet

## STA-12 Resume fails for another reason

If Resume fails for any other reason, a red message shows "Couldn’t resume: " followed by the browser's error text, and the error is logged to the console.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnResume`, "Couldn’t resume: "
- Source: `js/app/start-screen.js` (`resumeSession`)
- Ruling: R24. The message is a fixed sentence with a next step, and the error's detail always goes to the console. The app differs today. New wording, to be approved by Rich.
- Cases: none yet

## STA-13 Start fresh

**Start fresh** deletes the saved session (the photo, its logo, a pair's other side and its photo, and the edits) and hides the card. The saved logo and every remembered preference stay.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnFresh`, `#resume`, `CONFIG.session.dbName`
- Source: `js/app/start-screen.js` (`bindStartScreen`, `hideResume`); `js/app/adapters.js` (`Session.clear`)
- Cases: none yet

## STA-14 Edits are saved as you go

The edits (the photo's name and size, the edits, any unapplied Levels change, the open step, whether it was exported, and the time) are saved on the device 400 ms after the last change or step change.

- Risk: high
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.session.saveDelayMs`, `CONFIG.session.enabled`
- Source: `js/app/adapters.js` (`Session.snapshot`, `Session.saveSoon`, `Session.flush`); `js/app/state.js` (`stateChanged`); `js/app/shell.js` (`setTab`)
- Cases: none yet

## STA-15 Edits are saved at once when leaving

The edits are saved straight away when the page is hidden or left (switching apps, closing the tab), and just before any download (the export, corner shots, a pair, **Save edits**).

- Risk: high
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnDownload`, `#btnCornerDownload`, `#btnSaveEdits`, `CONFIG.session.enabled`
- Source: `js/app/main.js` (`bindWindowEvents`); `js/app/export.js` (`deliverExport`, `saveEdits`); `js/app/corner-shots.js` (`deliverCornerShots`); `js/app/pair.js` (`deliverPair`)
- Cases: none yet

## STA-16 The photo itself is saved once

The original file (its bytes, type and name) is saved once for each newly opened photo; the edits are not saved until it has been.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.session.dbName`, "[card-finisher] session photo not saved:"
- Source: `js/app/adapters.js` (`Session.savePhoto`, `Session.saveSoon`); `js/app/state.js` (`openFile`)
- Cases: none yet

## STA-17 Saving is best-effort

Where the browser has no on-device database, or `session.enabled` is turned off by a link, nothing is saved and no Resume card ever shows. A failed save is only logged to the console; the user sees nothing.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.session.enabled`, "[card-finisher] session edits not saved:", "[card-finisher] session photo not saved:"
- Source: `js/app/adapters.js` (`Session.enabled`, `Session.savePhoto`, `Session.flush`, `Session.peek`)
- Cases: none yet

## STA-18 A new photo starts clean

A newly opened photo starts on Perspective with fresh edits. The undo history, every view's zoom, the detection results, Levels' unapplied change, the picker for Levels, the before-and-after compare, Preview, Tap to find card and the exported mark are all cleared, and the first corner handle is selected.

- Risk: high
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#btnUndo`, `#btnFindCard`, `#toolCandidate`
- Source: `js/app/state.js` (`openFile`, `resetPhotoState`); `js/app/shell.js` (`setTab`)
- Flag: to confirm. **Snap**, **Grid**, **Debug overlay** and the chosen mode on Perspective (Nudge or Flatten) and Rotate (Straighten or Flip) carry over to a new photo, but not over a reload.
- Cases: none yet

## STA-19 A new photo starts from the remembered settings

A new photo's crop preset and export settings start from the ones last used (remembered on this device); with none remembered they are 1:1, JPEG, quality 0.92, 2000 px, bilinear and a white fill.

- Risk: high
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.crop.defaultPreset`, `CONFIG.export.format`, `CONFIG.export.longEdge`, `CONFIG.storageKey`
- Source: `js/app/state.js` (`newState`, `defaultState`, `cropDefaults`, `exportDefaults`); `js/app/adapters.js` (`Prefs.load`)
- Cases: none yet

## STA-20 A photo opens upright

A photo opens the right way up, following the orientation the camera recorded in the file.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#fileInput`, `#btnOpenEmpty`
- Source: `js/app/adapters.js` (`ImageSource.load`)
- Cases: none yet

## STA-21 HEIC photos

A HEIC photo opens where the browser can decode it (Safari). Where it can't, a red message says "This browser can’t open HEIC. Save the photo as JPEG first (Safari opens HEIC directly)."

- Risk: medium
- Check: phone, script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#fileInput`, "This browser can’t open HEIC. Save the photo as JPEG first "
- Source: `js/app/adapters.js` (`ImageSource.load`, `ImageSource.isHeic`); `js/app/state.js` (`openFile`)
- Cases: none yet

## STA-22 A file that isn't a readable image

Opening a file that can't be read as an image shows the red message "Couldn’t read that file as an image." The photo that was open, if any, stays as it was.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#fileInput`, "Couldn’t read that file as an image."
- Source: `js/app/state.js` (`openFile`); `js/app/adapters.js` (`ImageSource.load`)
- Cases: none yet

## STA-23 Two photos opened quickly

If a second photo is opened before the first has finished loading, only the last one opens.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: "Loading…", `#fileInput`
- Source: `js/app/state.js` (`openFile`)
- Cases: none yet

## STA-24 A 48 MP phone photo

A 48 MP iPhone photo opens and stays usable: the screen works from smaller copies (2048 px for the photo on screen, 720 px for the live preview while dragging, 1000 px for card detection), and only the export reads the full photo.

- Risk: high
- Check: phone, script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `CONFIG.previewMaxPx`, `CONFIG.thumbMaxPx`, `CONFIG.detect.workingSize`
- Source: `js/app/state.js` (`makeCopies`); `js/app/adapters.js` (`scaledCopy`)
- Cases: none yet

## STA-25 Cancelling the file picker

Closing the file picker without choosing a file changes nothing, whichever button opened it (**Open photo**, **Next card** or **Add back**): the open photo, its edits and the pair stay as they were.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `#fileInput`, `#btnOpen`, `#btnNextCard`, `#btnAddBack`
- Source: `js/app/shell.js` (`pickPhoto`); `js/app/adapters.js` (`ImageSource.bindPicker`); `js/app/main.js` (`bindPhotoInput`)
- Cases: none yet

## STA-26 What the iPhone picker hands over

On an iPhone, **Open photo** offers Photo Library, Take Photo and Choose File, and the photo that arrives has every pixel of the original (a 12 MP photo stays 12 MP), with a HEIC photo arriving as a JPEG. This is iOS's behavior, but the file types the app asks for decide it.

- Risk: medium
- Check: phone
- Layout: phone. iPhone Safari only.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#fileInput`, `#btnOpenEmpty`, `#btnOpen`
- Source: `index.html` (the photo file input's accepted types); `js/app/adapters.js` (`ImageSource.load`)
- Cases: none yet
