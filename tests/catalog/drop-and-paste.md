# Drop and paste

Bringing a photo or a logo in by dragging a file onto the app or pasting an image.

## DND-01 Drop a photo to open it

Drop an image file on the photo area to open it. Of several files dropped, the first image or HEIC file is used; anything else is ignored. While a pair is open, the app first asks **New photo** or to replace the side you are on.

- Risk: medium
- Check: script
- Layout: both. In practice a desktop; a phone has no drag and drop of files.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#stage`, `.drag-over`
- Source: `js/app/adapters.js` (`ImageSource.bindDrop`, `ImageSource.isHeic`), `js/app/main.js` (`bindPhotoInput`), `js/app/pair.js` (`receivePhoto`)
- Cases: none yet

## DND-02 The drop outline

While a file is dragged over the photo area, a white dashed outline shows with the caption **Drop to open**, or **Drop to add as the logo** on the Overlay step with a photo open. It goes when the file leaves or is dropped.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `.drag-over`, `"Drop to open"`, `"Drop to add as the logo"`
- Source: `js/app/adapters.js` (`ImageSource.bindDrop`), `css/app.css` (`.stage.drag-over`)
- Cases: none yet

## DND-03 Paste an image to open it

Paste an image anywhere on the page (Ctrl+V or Cmd+V, or the browser's Paste) to open it, named "pasted-photo". A paste with no image in it is left to the browser.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `"pasted-photo"`
- Source: `js/app/adapters.js` (`ImageSource.bindPaste`), `js/app/main.js` (`bindPhotoInput`)
- Cases: none yet

## DND-04 On the Overlay step, a dropped or pasted image becomes the logo

On the Overlay step with a photo open, a dropped or pasted image is added as the logo instead of opening as a photo. In a pair it becomes the logo of the side you are on, with no question.

- Risk: medium
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `"Drop to add as the logo"`, `#overlayInput`
- Source: `js/app/main.js` (`bindPhotoInput`), `js/app/overlay.js` (`addOverlayFile`, `place`)
- Ruling: R19. Each logo added is its own undo step, even two within 900 ms, and a dropped logo is accepted by its file extension, as the logo picker does. The app differs today. R32. While an export is running a dropped or pasted logo is refused, with the message a dropped photo gets. The app differs today.
- Cases: none yet

## DND-05 A photo arriving while the app is busy is refused

A photo opened, dropped or pasted while an export runs or a pair's side is opening is refused with a warning, **Wait for the export to finish, then open the photo.** On the Overlay step a dropped or pasted image goes to the logo instead (DND-04), and is not refused.

- Risk: low
- Check: script
- Layout: both
- Added: 1.10 baseline
- Changed: none
- Anchors: `"Wait for the export to finish, then open the photo."`
- Source: `js/app/pair.js` (`receivePhoto`)
- Ruling: R13. While a side is opening the warning reads "Wait for the other side to open, then open the photo."; the export wording stays for an export. The app differs today. New wording, to be approved by Rich.
- Cases: none yet

## DND-06 A file dropped outside the photo is ignored

A file dropped anywhere but the photo area (the side panel, the top bar) shows the no-drop cursor and is ignored: the browser does not open it in place of the app, so the edits are not lost.

- Risk: medium
- Check: script
- Layout: wide. A phone has no drag and drop of files.
- Added: 1.10 baseline
- Changed: none
- Anchors: `#panel`, `#topBarHost`
- Source: `js/app/main.js` (`bindStrayDrop`)
- Cases: none yet
