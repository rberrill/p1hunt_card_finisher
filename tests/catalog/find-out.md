# Find out on the phone

Things only a real iPhone can settle, that a test case is waiting on. Nobody guesses them: each goes on the next phone checklist as Part C, Rich records what he sees, and the answer is then written into the case it settles and the item is taken off this list.

An item is not a test: it has no pass or fail. It says what to do, what to write down, and which case is waiting.

To add one: give it the next number, say exactly what to do and what to record, and name the case. To close one: write the answer into the case (and a ruling, if the answer is a decision), then delete the item here.

## Q-01 A tap on the Flatten slider's track

- Waiting: PER-20.4
- Do: open a card photo, tap **Flatten** on Perspective, then tap once on the slider's track well away from its knob (do not drag).
- Write down: whether the knob jumps to where you tapped or stays put; and whether **Undo** is then lit. The answer becomes PER-20.4's rows for that tap (and, if the knob jumps but **Undo** stays greyed out, a question for Rich: that tap would be a change with no undo step).

## Q-02 Which iPhone photos are 48 MP

- Waiting: EXP-35.1, STA-24.1
- Do: take a photo with the main camera at its highest resolution setting, open it in the app, tap **Export**, open the options (the small tab with an up arrow above the controls) and read the line that starts "Source".
- Write down: the iPhone model, the camera setting used, and the size and megapixels the Source line gives.

## Q-03 Where iOS shows a picture's pixel size

- Waiting: UPS-10.1, STA-26.2
- Do: save a picture from the app to Photos. In Photos, open it and swipe up (or tap the ⓘ button). Then, on the UAT site, open 01_chrome_flat_black.JPEG, tap **Export**, **Copy** and **No** in the question box, open Notes, start a new note and paste; touch and hold the pasted picture, and look through what Notes offers (UPS-10.1 needs to read the size of a picture copied from the app).
- Write down: whether the pixel size (for example 2000 × 2000) is shown in Photos, and its exact place; and whether Notes shows a pasted picture's pixel size anywhere, and the steps that reach it (or that it doesn't, so UPS-10.1 saves the pasted picture to Photos and reads it there).

## Q-04 Making Safari's bars show and hide

- Waiting: LAY-05.1
- Do: with a photo open in a Safari tab, try each of these and watch Safari's own bars: turn the phone sideways and back; tap the "aA" or page button and choose Hide Toolbar; drag down from the top of the screen.
- Write down: which of them, if any, makes Safari's bars hide or change size, so the case can use one that works every time.

## Q-05 Dragging a photo from Photos into Safari

- Waiting: DND-01, DND-04
- Do: with the app open in Safari and Photos open in Slide Over or by starting a drag in Photos and switching apps with another finger, try to drop a photo onto the app.
- Write down: whether an iPhone lets you do this at all; and if it does, what the app does with the photo.

## Q-06 A photo saved to Files keeps its HEIC name

- Waiting: STA-21.1
- Do: in Photos, share a photo taken by the iPhone to Save to Files. Open the Files app and look at the saved file's name.
- Write down: the file name's ending (.HEIC, .JPG or other).

## Q-07 Editing stored values in Chrome's developer tools

- Waiting: STA-05.5, STA-08.1, STA-08.2, SEC-08.1, SEC-15.1, SEC-15.2
- Do (on the computer, not the phone): in Chrome, open the app, open a photo, open developer tools, Application, IndexedDB, and click a stored value.
- Write down: whether a value can be edited in place, or only refreshed and deleted.

## Q-08 What the top of the share sheet shows for a picture

- Waiting: EXP-08.2, PAIR-32.1
- Do: open IMG_9136.JPEG in the app on the UAT site, tap **Export**, **2000**, **Share**, then **No** in the question box. Look at the top of the share sheet before choosing anything, then close it with its **×**. Then make a pair: open 14_front_portrait_raw_white.JPEG, tap **Export**, **Add back** and choose 14_back_portrait_raw_white.JPEG; tap **Export**, **Original**, **Separately** and **Share**, and look at the top of the share sheet again before closing it.
- Write down: what the top of the share sheet shows: a small picture of the straightened card or not, and the file's name (IMG_9136-straight.jpg) or not, word for word. For the pair: whether it shows two pictures, and the names (14_front_portrait_raw_white-front.jpg, 14_back_portrait_raw_white-back.jpg) or a count such as "2 Images", word for word.

## Q-09 Which photo makes Safari refuse a share after a slow save

- Waiting: EXP-15.3, MSG-28.2, PERF-09.2
- Do: open the largest photo you have (a 48 MP one, from an iPhone that takes them) in the app on the UAT site, tap **Export**, **Original**, then **Share**. Do it three times, with a reload between.
- Write down: the photo (its name, and the size the source line in **Export options** gives); each time, whether the share sheet rose by itself or the red button changed to **Share now** with a message ending "Tap Share now to open the share sheet."; and the seconds the message gives.

## Q-10 A tap on Flip, Straighten or a step tab while the angle is typed

- Waiting: ROT-07.3, ROT-07.4
- Do: on the UAT site, open IMG_9136.JPEG and tap **Rotate**. Tap the angle (**0.0°**), type 9 on the keypad, then tap **Flip** in the row of tools; tap **Straighten** and read the angle. Tap the angle again, type 3, tap **Straighten** and read the angle. Tap the angle again, type 5, tap **Crop** in the step tabs, then **Rotate**, and read the angle.
- Write down: for each of the three taps (**Flip**, **Straighten**, **Crop**), whether the button could be tapped at all with the keypad up, or the keypad covers it; and where it could, whether the box closed and the angle read afterward (9.0°, 3.0° and 5.0° mean the typed angle was saved; the angle from before means it was thrown away).
