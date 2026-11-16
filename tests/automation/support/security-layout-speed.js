// Helpers for the security, storage, links and developer, layout and speed cases
// (tests/catalog/security.md, storage-and-settings.md, links-and-developer.md, layout.md,
// speed.md): the browser's console and network as a case sees them, edits files saved and
// loaded through the app's own buttons, records the app keeps on the device, what covers the
// photo, controls too small to touch, cut-off labels, and the times the speed cases record.
// They drive the app as a person would and read its state only to check a result.
'use strict';
const fs = require('fs');
const path = require('path');
const { openApp, openPhoto, handFor, goToStep, openOptions } = require('./app.js');
const { pickWith } = require('./start-and-session.js');
const { runDir } = require('./case.js');

// The photo most cases use: a PSA slab, 1498 × 2098 px.
const PHOTO = 'IMG_9136.JPEG';
// The smallest touch target, in CSS px (Apple's guideline, the catalog's LAY-06).
const TOUCH_MIN_PX = 44;
// How far touchSize walks out from a control's middle, in CSS px: past any target worth
// measuring.
const TOUCH_REACH_MAX_PX = 60;
// The storage key the app keeps its preferences under (CONFIG.storageKey).
const PREFS_KEY = 'p1hunt.straightener.v1';

// Opens the app (at `address`, which may carry settings from a link) with a photo. Returns the
// hand for this target.
async function startWith(page, testInfo, { photo = PHOTO, address } = {}) {
  await openApp(page, address);
  await openPhoto(page, photo);
  return handFor(page, testInfo);
}

// Records every console message from now on, as { type, text }. Returns the live list.
function watchConsole(page) {
  const messages = [];
  page.on('console', message => messages.push({ type: message.type(), text: message.text() }));
  return messages;
}

// Records every network request from now on, by its address. Returns the live list.
function watchRequests(page) {
  const addresses = [];
  page.on('request', request => addresses.push(request.url()));
  return addresses;
}

// Records every security policy refusal in the page, from before the app loads, in
// window.testPolicyRefusals: { directive, blocked }.
async function watchPolicyRefusals(page) {
  await page.addInitScript(() => {
    window.testPolicyRefusals = [];
    document.addEventListener('securitypolicyviolation', event => {
      window.testPolicyRefusals.push({
        directive: event.violatedDirective,
        blocked: event.blockedURI,
      });
    });
  });
}

// The refusals watchPolicyRefusals has seen.
function policyRefusals(page) {
  return page.evaluate(() => window.testPolicyRefusals);
}

// A file payload for the edits picker, holding `edits` as JSON text.
function editsPayload(edits, name = 'IMG_9136-edits.json') {
  return { name, mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(edits)) };
}

// A file payload for the edits picker whose text is `text` as it is.
function textPayload(text, name = 'IMG_9136-edits.json') {
  return { name, mimeType: 'application/json', buffer: Buffer.from(text) };
}

// Goes to the Export step, unless it is open already (its options sheet may then cover the
// step tabs).
async function goToExport(page, hand) {
  const tab = await page.evaluate(() => window.__straightener.app.tab);
  if (tab !== 'export') await goToStep(page, 'export', hand);
}

// On the Export step, opens Export options and taps Save edits. Returns the saved edits file,
// read as JSON.
async function saveEditsFile(page, hand) {
  await goToExport(page, hand);
  await openOptions(page, hand, 'export');
  const downloading = page.waitForEvent('download');
  await hand.tap(page.locator('#btnSaveEdits'));
  const download = await downloading;
  return JSON.parse(fs.readFileSync(await download.path(), 'utf8'));
}

// On the Export step, opens Export options, taps Load edits and chooses `file` (a payload).
async function loadEditsFile(page, hand, file) {
  await goToExport(page, hand);
  await openOptions(page, hand, 'export');
  await pickWith(page, hand, page.locator('#btnLoadEdits'), file);
}

// Changes a record saved on the device ('edits', 'overlay', 'photoOverlay' and so on): each key
// of `changes` is a dotted path in the record ('state.crop', 'tab') and its value the new
// value. There is no way to do this from the app's screen; it stands in for a record damaged or
// written by something else.
function changeSavedRecord(page, key, changes) {
  return page.evaluate(async ({ recordKey, newValues }) => {
    const Session = window.__straightener.Session;
    const record = await Session.get(recordKey);
    for (const [dottedPath, value] of Object.entries(newValues)) {
      const names = dottedPath.split('.');
      const last = names.pop();
      const holder = names.reduce((object, name) => object[name], record);
      holder[last] = value;
    }
    await Session.put(recordKey, record);
  }, { recordKey: key, newValues: changes });
}

// Stores `text` as the app's remembered preferences before the app loads, as a damaged or
// foreign value in the browser's local storage would be.
async function storePrefsText(page, text) {
  await page.addInitScript(({ key, value }) => {
    if (!sessionStorage.getItem('testPrefsStored')) {
      localStorage.setItem(key, value);
      sessionStorage.setItem('testPrefsStored', '1');
    }
  }, { key: PREFS_KEY, value: text });
}

// The app's remembered preferences, read from local storage, or null.
function storedPrefs(page) {
  return page.evaluate(key => JSON.parse(localStorage.getItem(key)), PREFS_KEY);
}

// Makes the browser's local storage refuse every write, before the app loads, as private
// browsing or a full disk does.
async function refusePrefsStorage(page) {
  await page.addInitScript(() => {
    Storage.prototype.setItem = function refuseWrite() {
      throw new DOMException('Stand-in: the storage is full', 'QuotaExceededError');
    };
  });
}

// The controls a finger can touch on screen now, too small to touch: those under 44 px across
// or down. A control counts when it shows whole in the window and isn't cut by a row that
// scrolls (a preset chip half out of its row is reached by scrolling it in). A range input
// counts through its track (the ruler or slider wrapped around it), and a switch through the
// row it sits in, which take the touch.
// Only controls inside `within` (a selector; the whole app by default) count. Returns
// [{ name, width, height }].
function smallTargets(page, within = '#app') {
  return page.evaluate(({ minPx, reachMax, container }) => {
    const isShown = element => {
      const box = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return box.width > 0 && box.height > 0 && style.visibility !== 'hidden';
    };
    // True when every ancestor that clips shows the whole box.
    const isWhole = element => {
      const box = element.getBoundingClientRect();
      if (box.left < 0 || box.top < 0 || box.right > innerWidth || box.bottom > innerHeight) {
        return false;
      }
      for (let parent = element.parentElement; parent; parent = parent.parentElement) {
        if (getComputedStyle(parent).overflow === 'visible') continue;
        const clip = parent.getBoundingClientRect();
        const isInside = box.left >= clip.left - 0.5
          && box.right <= clip.right + 0.5
          && box.top >= clip.top - 0.5
          && box.bottom <= clip.bottom + 0.5;
        if (!isInside) return false;
      }
      return true;
    };
    // A switch inside a row's label takes its touch through the whole row.
    const targetOf = element => {
      if (element.type === 'range') return element.closest('.ruler, .slider') || element;
      return element.closest('label') || element;
    };
    // How far a touch from the control's middle still lands on it, in CSS px: { width,
    // height }, counting a larger hit area drawn by a pseudo-element. Null when a touch at
    // its middle lands on something else.
    const measure = element => {
      const box = element.getBoundingClientRect();
      const middleX = box.left + box.width / 2;
      const middleY = box.top + box.height / 2;
      const hits = (x, y) => {
        const found = document.elementFromPoint(x, y);
        return !!found && (found === element || element.contains(found));
      };
      const reach = (dx, dy) => {
        let distance = 0;
        while (distance < reachMax
          && hits(middleX + dx * (distance + 1), middleY + dy * (distance + 1))) {
          distance++;
        }
        return distance;
      };
      if (!hits(middleX, middleY)) return null;
      return {
        width: reach(-1, 0) + reach(1, 0) + 1,
        height: reach(0, -1) + reach(0, 1) + 1,
      };
    };
    const selector = 'button, input, select, [role="switch"], .segment, .step-tab';
    const controls = [...document.querySelectorAll(selector)]
      .filter(element => element.closest(container))
      .map(targetOf)
      .filter((element, index, all) => all.indexOf(element) === index)
      .filter(element => isShown(element) && isWhole(element));
    return controls.map(element => ({
      name: element.id || element.getAttribute('aria-label') || element.textContent.trim()
        || element.className,
      size: measure(element),
    })).filter(({ size }) => !size || size.width < minPx || size.height < minPx)
      .map(({ name, size }) => ({
        name,
        width: size ? size.width : 0,
        height: size ? size.height : 0,
      }));
  }, { minPx: TOUCH_MIN_PX, reachMax: TOUCH_REACH_MAX_PX, container: within });
}

// What shows over the photo's area now, other than the photo itself, its own messages and the
// grabber's tab (which rises over the photo's bottom edge by design): the id or class of each
// element whose visible box overlaps the photo by more than a pixel.
function overThePhoto(page) {
  return page.evaluate(() => {
    const stage = document.getElementById('stage');
    const photo = stage.getBoundingClientRect();
    const isShown = element => {
      const box = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return box.width > 0 && box.height > 0 && style.visibility !== 'hidden'
        && style.opacity !== '0';
    };
    // The part of an element's box that shows: cut to every ancestor that clips.
    const visibleBox = element => {
      const box = element.getBoundingClientRect();
      let { left, top, right, bottom } = box;
      for (let parent = element.parentElement; parent; parent = parent.parentElement) {
        if (getComputedStyle(parent).overflow === 'visible') continue;
        const clip = parent.getBoundingClientRect();
        left = Math.max(left, clip.left);
        top = Math.max(top, clip.top);
        right = Math.min(right, clip.right);
        bottom = Math.min(bottom, clip.bottom);
      }
      return right > left && bottom > top ? { left, top, right, bottom } : null;
    };
    const found = [];
    document.querySelectorAll('#app *, #debugPanel').forEach(element => {
      const isOwn = stage.contains(element)
        || element.contains(stage)
        || element.closest('.grabber');
      if (isOwn || !isShown(element)) return;
      const box = visibleBox(element);
      if (!box) return;
      const overlapsAcross = box.left < photo.right - 1 && box.right > photo.left + 1;
      const overlapsDown = box.top < photo.bottom - 1 && box.bottom > photo.top + 1;
      if (overlapsAcross && overlapsDown) {
        found.push(element.id || element.getAttribute('class') || element.tagName);
      }
    });
    return found;
  });
}

// The labels on screen that don't fit their box: buttons, their labels, the step tabs' and
// the top bar's labels whose text is wider than the room it has. Returns [{ name, needPx,
// havePx }].
function cutOffLabels(page) {
  return page.evaluate(() => {
    const selector = 'button, .action-label, .step-tab-label, .icon-button-label';
    const isShown = element => {
      const box = element.getBoundingClientRect();
      return box.width > 0 && box.height > 0 && getComputedStyle(element).visibility !== 'hidden';
    };
    return [...document.querySelectorAll(selector)]
      .filter(element => element.closest('#app') && isShown(element))
      .filter(element => element.scrollWidth > element.clientWidth)
      .map(element => ({
        name: element.id || element.textContent.trim() || element.className,
        needPx: element.scrollWidth,
        havePx: element.clientWidth,
      }));
  });
}

// How far the page scrolls sideways, in CSS px: 0 when it doesn't.
function sidewaysScrollPx(page) {
  return page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
}

// The height of each part of the screen, rounded to the CSS px: the top bar, the photo, the
// open step's block of controls, the step tabs and the whole app.
function partHeights(page) {
  return page.evaluate(() => {
    const height = selector => {
      const element = document.querySelector(selector);
      return element ? Math.round(element.getBoundingClientRect().height) : 0;
    };
    return {
      topBar: height('.top-bar'),
      photo: height('#stage'),
      controls: height('section.active .control-area'),
      tabs: height('.tab-bar'),
      app: height('#app'),
    };
  });
}

// Where the step tabs are: 'bottom' (their own row under the controls, the phone layout) or
// 'top bar' (inside the top bar, the wide layout).
function stepTabsPlace(page) {
  return page.evaluate(() => {
    const tabs = document.querySelector('.tab-bar');
    return tabs.closest('#topBarSteps') ? 'top bar' : 'bottom';
  });
}

// Notes, from before the app loads, the time of every tap on a button and of every file
// download, in performance.now() ms: window.testTaps gets { button, atMs } (the button's id,
// or its text when it has none) and window.testDownloadsAtMs each download's time. A download
// is the app clicking a link of its own, which is left out of the taps.
async function watchTapsAndDownloads(page) {
  await page.addInitScript(() => {
    window.testTaps = [];
    window.testDownloadsAtMs = [];
    document.addEventListener('click', event => {
      const button = event.target.closest && event.target.closest('button');
      if (!button) return;
      window.testTaps.push({
        button: button.id || button.textContent.trim(),
        atMs: performance.now(),
      });
    }, true);
    const click = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function noteDownload() {
      if (this.download) window.testDownloadsAtMs.push(performance.now());
      return click.call(this);
    };
  });
}

// The time from the last tap on `button` (an id, or a button's text) to the download after
// it, in ms (see watchTapsAndDownloads).
function tapToDownloadMs(page, button) {
  return page.evaluate(name => {
    const taps = window.testTaps.filter(tap => tap.button === name);
    const tapMs = taps[taps.length - 1].atMs;
    const downloadMs = window.testDownloadsAtMs.find(atMs => atMs >= tapMs);
    return downloadMs - tapMs;
  }, button);
}

// Records a time a speed case measured, in ms, for the report: a line in the run folder's
// timings.jsonl and a note on the case's result.
function recordTiming(testInfo, what, durationMs) {
  const line = JSON.stringify({
    caseId: testInfo.title.split(' ')[0],
    target: testInfo.project.name,
    what,
    durationMs: Math.round(durationMs),
    repeat: testInfo.repeatEachIndex,
  });
  fs.mkdirSync(runDir, { recursive: true });
  fs.appendFileSync(path.join(runDir, 'timings.jsonl'), line + '\n');
  const description = `${what}: ${Math.round(durationMs)} ms`;
  testInfo.annotations.push({ type: 'measured', description });
}

module.exports = {
  PHOTO,
  TOUCH_MIN_PX,
  PREFS_KEY,
  startWith,
  watchConsole,
  watchRequests,
  watchPolicyRefusals,
  policyRefusals,
  editsPayload,
  textPayload,
  saveEditsFile,
  loadEditsFile,
  changeSavedRecord,
  storePrefsText,
  storedPrefs,
  refusePrefsStorage,
  smallTargets,
  overThePhoto,
  cutOffLabels,
  sidewaysScrollPx,
  partHeights,
  stepTabsPlace,
  watchTapsAndDownloads,
  tapToDownloadMs,
  recordTiming,
};
