// Sample-photo regression checks for P1Hunt Card Finisher.
//
// How to run (it needs the page served over http so it can fetch samples/):
//   1. In this folder:  python -m http.server 8765
//   2. Open http://localhost:8765/index.html and keep the tab visible (hidden tabs pause
//      rendering).
//   3. Paste this whole file into the browser console. It prints a PASS/FAIL table and resolves
//      to { passed, results }. Takes ~20 s.
//      Or load it as a script (the page's Content Security Policy blocks eval, but allows its
//      own files):
//        document.head.append(Object.assign(document.createElement('script'),
//          { src: 'tests/sample-regression.js' }))
//      then await window.__regression.
//
// The ground truth below is hand-placed card corners (source px, TL TR BR BL). Detection is held
// photo by photo to its measured baseline (R1, explained in tests/README.md).
window.__regression = (async () => {
  'use strict';
  const app = window.__straightener;
  const engine = window.CardEngine;
  const CF = window.CF;
  if (!app || !engine) {
    throw new Error('Open index.html first — window.__straightener / CardEngine not found.');
  }
  const { Mat3, Quad } = engine;
  try {
    localStorage.clear();
  } catch (error) { /* storage unavailable */ }

  const CARD_ASPECT = 63.5 / 88.9;
  // The IMG_ photos were placed on 2026-10-24; the numbered set on 2026-10-31, in the app with
  // Save edits.
  const GROUND_TRUTH = {
    IMG_9060: [[253, 260], [1275.5, 261], [1254, 1534], [305.5, 1535]],
    IMG_9074: [[388.5, 546], [1110, 545], [1104, 1520], [402.5, 1522.5]],
    IMG_9075: [[488, 563], [998, 565], [982, 1246], [491, 1246]],
    IMG_9136: [[274, 593], [1167, 591], [1151, 1770], [306, 1774]],
    IMG_9142: [[127, 500], [1246, 515], [1221, 1265], [163, 1248]],
    IMG_9216: [[445.5, 627], [1146, 633], [1112, 1505], [466.5, 1501.5]],
    '01_chrome_flat_black': [[426.2, 529.5], [1081.2, 530.7], [1119.7, 1428.1], [415, 1433]],
    '02_black_flat_black': [[297.5, 446.6], [1000.5, 442.1], [1061.9, 1397.6], [312.3, 1420.9]],
    '03_chrome_flat_busy': [[385.1, 373.8], [1024.5, 333.4], [1101.8, 1218], [423.4, 1260.8]],
    '04_red_angle_busy': [[355.3, 418.9], [981.5, 398.4], [1105.4, 1173.4], [391.4, 1211.4]],
    '05_sapphire_flat_black': [[382, 505.7], [1264.1, 512.3], [1294.6, 1115.2], [355.2, 1111.2]],
    '06_chrome_flat_white': [[413.7, 557.9], [1035.4, 566.8], [1014.1, 1413.5], [409.4, 1403.2]],
    '07_dark_flat_black': [[319.1, 594.2], [1113.8, 573.3], [1143.1, 1125.8], [313.9, 1145.3]],
    '08_silver_stand_busy': [[693.5, 682.2], [1110.8, 684.6], [1103, 1270.5], [686.5, 1268.6]],
    '09_silver_stand_white': [[426, 433.2], [1025, 439.2], [1005.5, 1263.5], [425.4, 1256.2]],
    '10_sapphire_flat_busy': [[426.2, 496.7], [981.3, 495.3], [1006.3, 1253.7], [417, 1257.7]],
    '11_any_flatglare_black': [[440.3, 553.3], [954.7, 549.1], [978.1, 1261.7], [439.1, 1272.1]],
    '12_blackred_stand_busy': [[544.8, 762.6], [1018.8, 764.7], [1018.2, 1434.6], [539.9, 1432.6]],
  };
  // Each photo's detection baseline: the top pick's error and the best of the three candidates'
  // error, % of the image diagonal (desktop Chrome, 2026-10-31). A baseline moves down in the
  // change that improves it; raising one needs the maintainer's agreement.
  const BASELINE = {
    IMG_9060: { top: 2.48, best: 0.49 },
    IMG_9074: { top: 1.80, best: 1.80 },
    IMG_9075: { top: 0.04, best: 0.04 },
    IMG_9136: { top: 0.46, best: 0.46 },
    IMG_9142: { top: 0.25, best: 0.25 },
    IMG_9216: { top: 0.09, best: 0.09 },
    '01_chrome_flat_black': { top: 0.00, best: 0.00 },
    '02_black_flat_black': { top: 0.24, best: 0.24 },
    '03_chrome_flat_busy': { top: 24.32, best: 24.32 },
    '04_red_angle_busy': { top: 6.29, best: 1.35 },
    '05_sapphire_flat_black': { top: 0.03, best: 0.03 },
    '06_chrome_flat_white': { top: 0.42, best: 0.42 },
    '07_dark_flat_black': { top: 1.75, best: 0.93 },
    '08_silver_stand_busy': { top: 1.16, best: 1.16 },
    '09_silver_stand_white': { top: 0.19, best: 0.19 },
    '10_sapphire_flat_busy': { top: 5.64, best: 1.60 },
    '11_any_flatglare_black': { top: 1.24, best: 1.24 },
    '12_blackred_stand_busy': { top: 0.36, best: 0.36 },
  };
  // Raw cards, counted on their own in the scoreboard: the weakest kind of shot.
  const RAW_CARDS = [
    '01_chrome_flat_black',
    '02_black_flat_black',
    '03_chrome_flat_busy',
    '04_red_angle_busy',
  ];
  // Held out of detection tuning: not looked at while tuning, checked once at the end, so a
  // change that only fits the photos it was tuned on shows up.
  const HELD_OUT = [
    '03_chrome_flat_busy',
    '07_dark_flat_black',
    '10_sapphire_flat_busy',
    '12_blackred_stand_busy',
  ];
  // A pick counts as found when its worst corner is within 1% of the diagonal.
  const WITHIN_PCT = 1;
  // How far a photo may drift above its baseline between runs.
  const SLACK_PCT = 0.25;
  // Above this the top pick is a different rectangle: reported, not gated, until a fix lands.
  const WRONG_SHAPE_PCT = 5;

  const results = [];
  const record = (name, pass, detail) => results.push({ name, pass: !!pass, detail });
  const wait = durationMs => new Promise(resolve => setTimeout(resolve, durationMs));
  const clone = value => JSON.parse(JSON.stringify(value));
  const blobs = {};

  // Opens a sample and waits for detection to finish.
  async function load(name) {
    blobs[name] = blobs[name] || await (await fetch(`samples/${name}.JPEG`)).blob();
    await app.openFile(blobs[name], `${name}.JPEG`);
    while (!app.app.detection.last || app.app.detection.message) await wait(50);
  }

  // A quad's worst corner error, as % of the image diagonal.
  function cornerErrorPct(quad, truth) {
    const errors = quad.map((point, i) => Math.hypot(
      point[0] - truth[i][0],
      point[1] - truth[i][1],
    ));
    const worst = Math.max(...errors);
    return worst / Math.hypot(app.app.img.width, app.app.img.height) * 100;
  }

  // Renders the current state at full resolution → its ImageData (the canvas is freed).
  async function renderPixels() {
    const { canvas } = await app.renderFull(clone(app.app.state));
    const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
    canvas.width = 0;
    return pixels;
  }

  // How many bytes differ between two pixel buffers, or −1 if their sizes differ.
  function differingBytes(first, second) {
    if (first.length !== second.length) return -1;
    let count = 0;
    for (let i = 0; i < first.length; i++) {
      if (first[i] !== second[i]) count++;
    }
    return count;
  }

  // The group a photo's top-pick baseline puts it in.
  function groupOf(baselinePct) {
    if (baselinePct < WITHIN_PCT) return 'within 1%';
    if (baselinePct <= WRONG_SHAPE_PCT) return 'near miss';
    return 'wrong shape, not gated';
  }

  // Whether a top pick still meets its group's rule: a photo within 1% stays within 1% and no
  // worse than its baseline + slack; a near miss gets no worse; a wrong shape isn't gated.
  function isTopPickHeld(topPct, baselinePct) {
    if (baselinePct > WRONG_SHAPE_PCT) return true;
    const isNoWorse = topPct <= baselinePct + SLACK_PCT;
    if (baselinePct < WITHIN_PCT) return isNoWorse && topPct < WITHIN_PCT;
    return isNoWorse;
  }

  /* ---- R1. Auto-detect accuracy (card), held photo by photo to its baseline ---- */
  const topPick = {};
  const bestOfThree = {};
  for (const name of Object.keys(GROUND_TRUTH)) {
    const baseline = BASELINE[name];
    if (!baseline) {
      record(`R1 ${name}`, false, 'no baseline in BASELINE');
      continue;
    }
    await load(name);
    const errors = app.app.detection.candidates.map(
      candidate => cornerErrorPct(candidate.corners, GROUND_TRUTH[name]),
    );
    topPick[name] = errors[0] ?? 99;
    bestOfThree[name] = Math.min(99, ...errors);
    // A best of 3 that is within 1% (one Candidate tap away) stays within 1%.
    const isBestHeld = baseline.best >= WITHIN_PCT || bestOfThree[name] < WITHIN_PCT;
    record(`R1 ${name} (${groupOf(baseline.top)})`,
      isTopPickHeld(topPick[name], baseline.top) && isBestHeld,
      `top ${topPick[name].toFixed(2)}% (baseline ${baseline.top}%), `
      + `best of 3 ${bestOfThree[name].toFixed(2)}% (baseline ${baseline.best}%)`);
  }
  // The scoreboard: how many photos are within 1%, reported every run and never a gate.
  const countWithin = (errors, names) => names.filter(name => errors[name] < WITHIN_PCT).length;
  const allNames = Object.keys(GROUND_TRUTH);
  const scoreboard = {
    topPick: `${countWithin(topPick, allNames)}/${allNames.length}`,
    bestOfThree: `${countWithin(bestOfThree, allNames)}/${allNames.length}`,
    rawCards: `${countWithin(topPick, RAW_CARDS)}/${RAW_CARDS.length}`,
    heldOut: `${countWithin(topPick, HELD_OUT)}/${HELD_OUT.length}`,
  };

  /* ---- R2 / R3. Flatten 100% and 0%, measured on exported pixels
    (IMG_9216, hand-placed corners) ---- */
  await load('IMG_9216');
  const degreesOf = (start, end) => (
    Math.atan2(end[1] - start[1], end[0] - start[0]) * 180 / Math.PI
  );
  // Exports at `strength`, then finds the card's corners in the pixels (by refinement from where
  // the geometry predicts them) and measures its shape.
  async function measureFlatten(strength) {
    app.commit(state => {
      state.corners = GROUND_TRUTH.IMG_9216.map(point => point.slice());
      state.strength = strength;
      state.aspect = { ratio: CARD_ASPECT, orientation: 'auto' };
      state.rotation = { quarter: 0, fine: 0, fillFrame: false };
      state.flip = { h: false, v: false };
      state.crop = { mode: 'fit', preset: 'free', ratio: null, swapped: false, rect: null };
      state.levels = null;
      state.export.longEdge = 0;
    });
    const { canvas, geometry } = await app.renderFull(clone(app.app.state));
    const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
    const toOutput = point => Mat3.apply(geometry.sourceToOutput, point[0], point[1]);
    const predicted = GROUND_TRUTH.IMG_9216.map(toOutput);
    const roi = {
      data: pixels.data,
      width: pixels.width,
      height: pixels.height,
      originX: 0,
      originY: 0,
      scale: 1,
    };
    const quad = engine.refineQuad(roi, predicted, { searchPx: 10 }).corners;
    canvas.width = 0;
    const sides = Quad.sides(quad);
    return {
      maxCornerDeviation: Math.max(...Quad.cornerAngles(quad).map(angle => Math.abs(angle - 90))),
      aspect: (sides.top + sides.bottom) / (sides.left + sides.right),
      top: degreesOf(quad[0], quad[1]),
      bottom: degreesOf(quad[3], quad[2]),
      mirror: Math.abs((90 - degreesOf(quad[0], quad[3])) + (90 - degreesOf(quad[1], quad[2]))),
    };
  }
  const flat = await measureFlatten(1);
  const aspectErrorPct = Math.abs(flat.aspect / CARD_ASPECT - 1) * 100;
  record('R2 Flatten 100%: corners 90° ± 0.5°', flat.maxCornerDeviation <= 0.5,
    `worst ${flat.maxCornerDeviation.toFixed(3)}° (v1.0 0.334°)`);
  record('R2 Flatten 100%: aspect 5:7 ± 0.5%', aspectErrorPct <= 0.5,
    `${aspectErrorPct.toFixed(3)}% (v1.0 0.087%)`);
  const squared = await measureFlatten(0);
  record('R3 Flatten 0%: top & bottom level within 0.3°',
    Math.abs(squared.top) <= 0.3 && Math.abs(squared.bottom) <= 0.3,
    `top ${squared.top.toFixed(3)}°, bottom ${squared.bottom.toFixed(3)}° (v1.0 0.031°, 0.239°)`);
  record('R3 Flatten 0%: sides mirror within 0.5°', squared.mirror <= 0.5,
    `${squared.mirror.toFixed(3)}° (v1.0 0.029°)`);

  /* ---- R4. Export size and JPEG quality ---- */
  await load('IMG_9216');
  app.commit(state => {
    state.crop = { mode: 'fit', preset: '1:1', ratio: 1, swapped: false, rect: null };
    state.export.longEdge = 0;
    state.export.format = 'jpeg';
  });
  const crop = engine.computeGeometry(app.app.state, {}).crop;
  // Renders and encodes as JPEG → { bytes, dims }.
  async function encodeJpeg(state, quality) {
    const { canvas } = await app.renderFull(state);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
    const dims = [canvas.width, canvas.height];
    canvas.width = 0;
    return { bytes: blob.size, dims };
  }
  const fullState = clone(app.app.state);
  const quality92 = await encodeJpeg(fullState, 0.92);
  const quality50 = await encodeJpeg(fullState, 0.5);
  const cropWidth = Math.round(crop.width);
  const cropHeight = Math.round(crop.height);
  record('R4 Export is full resolution when no resize is set',
    quality92.dims[0] === cropWidth && quality92.dims[1] === cropHeight,
    `${quality92.dims.join('×')} vs crop ${cropWidth}×${cropHeight}`);
  record('R4 JPEG quality is respected (0.92 file > 0.50 file)',
    quality92.bytes > quality50.bytes * 1.5,
    `${quality92.bytes} vs ${quality50.bytes} bytes`);
  const resizedState = clone(fullState);
  resizedState.export.longEdge = 600;
  const resized = await encodeJpeg(resizedState, 0.92);
  record('R4 Resize sets the long edge', Math.max(...resized.dims) === 600, resized.dims.join('×'));

  /* ---- R5. Levels: label white comes out neutral at whiteTarget (IMG_9136) ---- */
  await load('IMG_9136');
  // The v1.0 dropper reading of the PSA label.
  const labelLevels = { white: [210, 230.7, 226], black: null, whiteAt: [420, 230], blackAt: null };
  app.commit(state => {
    state.crop = { mode: 'full', preset: 'free', ratio: null, swapped: false, rect: null };
    state.levels = labelLevels;
    state.export.longEdge = 0;
  });
  {
    const { canvas, geometry } = await app.renderFull(clone(app.app.state));
    const label = Mat3.apply(geometry.sourceToOutput, 420, 230);
    const radius = 12;
    const patch = canvas.getContext('2d').getImageData(
      Math.round(label[0]) - radius, Math.round(label[1]) - radius, 2 * radius, 2 * radius,
    );
    const color = engine.meanColor(patch, CONFIG.levels.sampleTrim);
    canvas.width = 0;
    record('R5 Levels: picked label exports neutral at 245 ± 2',
      color.every(value => Math.abs(value - CONFIG.levels.whiteTarget) <= 2),
      `exported ${color.join(', ')} (v1.0 245.7, 244.7, 245.0)`);
  }

  /* ---- R6. The edits round trip is pixel-identical
    (rotation, flip, fill frame, bicubic, levels) ---- */
  app.commit(state => {
    state.rotation = { quarter: 1, fine: 2.3, fillFrame: true };
    state.flip = { h: true, v: false };
    state.crop = { mode: 'fit', preset: '1:1', ratio: 1, swapped: false, rect: null };
    state.export.interp = 'bicubic';
    state.levels = labelLevels;
  });
  {
    const before = (await renderPixels()).data;
    const saved = JSON.stringify(app.app.state);
    await load('IMG_9136');
    app.commit(state => {
      for (const key of Object.keys(state)) delete state[key];
      Object.assign(state, JSON.parse(saved));
    });
    const after = (await renderPixels()).data;
    const differing = differingBytes(before, after);
    record('R6 Save → reload → load edits exports pixel-identical', differing === 0,
      differing < 0 ? 'size mismatch' : `${differing} differing bytes of ${before.length}`);
  }

  /* ---- R7. Undo and redo, including the keyboard while a slider has focus ---- */
  await load('IMG_9216');
  app.setTab('rotate');
  {
    const fine = document.getElementById('fine');
    fine.focus();
    fine.value = 7.5;
    fine.dispatchEvent(new Event('input'));
    const pressKey = (key, shift) => fine.dispatchEvent(
      new KeyboardEvent('keydown', { key, ctrlKey: true, shiftKey: !!shift, bubbles: true }),
    );
    pressKey('z');
    const undone = app.app.state.rotation.fine;
    pressKey('z', true);
    const redone = app.app.state.rotation.fine;
    record('R7 Ctrl+Z / Shift+Ctrl+Z work while a slider has focus', undone === 0 && redone === 7.5,
      `after undo ${undone}, after redo ${redone}`);
  }
  app.setTab('perspective');

  /* ---- R8. The self-tests inside the Web Worker ---- */
  {
    const worker = await app.EngineWorker.call('selftest', {});
    const passedCount = worker.results.filter(result => result.pass).length;
    record('R8 Engine self-tests pass inside the Web Worker',
      worker.passed && !app.EngineWorker.failed,
      `${passedCount}/${worker.results.length}`);
  }

  /* ---- R9–R13. The Overlay step: compositing, opacity, resolution independence, remove,
     edits round trip ---- */
  {
    await load('IMG_9136');
    app.commit(state => {
      state.crop = {
        mode: 'fit',
        preset: '1:1',
        ratio: 1,
        swapped: false,
        orient: null,
        rect: null,
      };
      state.levels = null;
      state.export.longEdge = 0;
      state.export.format = 'png';
    });
    // A test logo 200×100: the left half opaque red, then a 50%-alpha blue band, then a fully
    // transparent strip.
    const logoCanvas = document.createElement('canvas');
    logoCanvas.width = 200;
    logoCanvas.height = 100;
    const logoContext = logoCanvas.getContext('2d');
    logoContext.fillStyle = 'rgb(255,0,0)';
    logoContext.fillRect(0, 0, 100, 100);
    logoContext.fillStyle = 'rgba(0,0,255,0.5)';
    logoContext.fillRect(100, 0, 80, 100);
    const logoBlob = await new Promise(resolve => logoCanvas.toBlob(resolve, 'image/png'));
    const logo = new File([logoBlob], 'test-logo.png', { type: 'image/png' });
    // The RGB at a fraction of the image's width and height.
    const colorAt = (img, fractionX, fractionY) => {
      const x = Math.round(fractionX * img.width);
      const y = Math.round(fractionY * img.height);
      const offset = (y * img.width + x) * 4;
      return [img.data[offset], img.data[offset + 1], img.data[offset + 2]];
    };
    const isNear = (first, second, tolerance) => first.every(
      (value, i) => Math.abs(value - second[i]) <= tolerance,
    );
    const blend = (under, over) => under.map((value, i) => Math.round(value * 0.5 + over[i] * 0.5));
    const base = await renderPixels();
    app.setTab('overlay');
    await CF.addOverlayFile(logo);
    app.commit(state => {
      state.overlay = Object.assign({}, state.overlay, { cx: 0.5, cy: 0.5, w: 0.4, opacity: 1 });
    });
    // The logo spans x 0.30–0.70, y 0.40–0.60 of the frame: red 0.30–0.50, blue 0.50–0.66,
    // transparent 0.66–0.70.
    const withOverlay = await renderPixels();
    const red = colorAt(withOverlay, 0.4, 0.5);
    const blueUnder = colorAt(base, 0.58, 0.5);
    const blue = colorAt(withOverlay, 0.58, 0.5);
    const clearUnder = colorAt(base, 0.68, 0.5);
    const clear = colorAt(withOverlay, 0.68, 0.5);
    const expectedBlue = blend(blueUnder, [0, 0, 255]);
    const isOutsideUntouched = isNear(colorAt(withOverlay, 0.1, 0.1), colorAt(base, 0.1, 0.1), 0)
      && isNear(colorAt(withOverlay, 0.9, 0.9), colorAt(base, 0.9, 0.9), 0);
    record('R9 Overlay composites with its alpha (opaque, 50%, transparent, outside)',
      isNear(red, [255, 0, 0], 2)
        && isNear(blue, expectedBlue, 4)
        && isNear(clear, clearUnder, 1)
        && isOutsideUntouched,
      `red ${red} · blue ${blue} (expected ≈${expectedBlue}) · `
      + `clear ${clear} vs photo ${clearUnder} · `
      + `outside untouched ${isOutsideUntouched}`);

    app.commit(state => {
      state.overlay.opacity = 0.5;
    });
    const halfOpacity = await renderPixels();
    const halfRed = colorAt(halfOpacity, 0.4, 0.5);
    const expectedHalf = blend(colorAt(base, 0.4, 0.5), [255, 0, 0]);
    record('R10 Overlay opacity 50% blends the opaque part half and half',
      isNear(halfRed, expectedHalf, 4),
      `${halfRed} (expected ≈${expectedHalf})`);
    app.commit(state => {
      state.overlay.opacity = 1;
    });

    // Resolution independence: the red span sits at the same fractions of the width at 1080 px
    // and at full size. Returns [start, end] of the red span along the middle row.
    const redSpan = img => {
      const y = Math.round(img.height * 0.5);
      const isRed = x => {
        const offset = (y * img.width + x) * 4;
        return img.data[offset] > 200 && img.data[offset + 1] < 40 && img.data[offset + 2] < 40;
      };
      const isReddish = x => {
        const offset = (y * img.width + x) * 4;
        return img.data[offset] > 200 && img.data[offset + 1] < 40;
      };
      let start = 0;
      while (start < img.width && !isRed(start)) start++;
      let end = start;
      while (end < img.width && isReddish(end)) end++;
      return [start / img.width, end / img.width];
    };
    const fullSpan = redSpan(withOverlay);
    app.commit(state => {
      state.export.longEdge = 1080;
    });
    const small = await renderPixels();
    const smallSpan = redSpan(small);
    const tolerance = 2 / small.width;
    const describeSpan = span => span.map(value => value.toFixed(4)).join('–');
    record('R11 Overlay lands in the same relative place at every export size',
      Math.abs(fullSpan[0] - smallSpan[0]) < tolerance
        && Math.abs(fullSpan[1] - smallSpan[1]) < tolerance,
      `red spans ${describeSpan(fullSpan)} at ${withOverlay.width}px and `
      + `${describeSpan(smallSpan)} at ${small.width}px`);
    app.commit(state => {
      state.export.longEdge = 0;
    });

    // An edits file round trip with the logo embedded, then Remove restores the exact
    // no-overlay export.
    const overlayImage = CF.overlayForEdits(app.app.state);
    const payload = Object.assign(clone(app.app.state), { overlayImage });
    app.commit(state => {
      state.overlay = null;
    });
    const editsFile = new File([JSON.stringify(payload)], 'IMG_9136-edits.json', {
      type: 'application/json',
    });
    await CF.loadEdits(editsFile);
    const reloaded = await renderPixels();
    const reloadDiff = differingBytes(reloaded.data, withOverlay.data);
    const embedded = payload.overlayImage
      ? Math.round(payload.overlayImage.data.length / 1024) + ' KB base64'
      : 'nothing';
    record('R12 Edits file with an embedded overlay rebuilds the export exactly',
      !!payload.overlayImage && reloadDiff === 0,
      reloadDiff < 0 ? 'size mismatch' : `${reloadDiff} differing bytes; embedded ${embedded}`);
    app.commit(state => {
      state.overlay = null;
    });
    const removed = await renderPixels();
    const removedDiff = differingBytes(removed.data, base.data);
    record('R13 Without an overlay the export is unchanged (AC3)', removedDiff === 0,
      `${removedDiff} differing bytes vs. the export before any overlay`);
    app.setTab('perspective');
  }

  /* ---- R14. Edits files and sessions are checked field by field:
    real edits pass unchanged ---- */
  {
    await load('IMG_9136');
    app.commit(state => {
      state.rotation = { quarter: 3, fine: -3.7, fillFrame: true };
      state.flip = { h: true, v: false };
      state.strength = 0.35;
      state.crop = {
        mode: 'manual',
        preset: 'free',
        ratio: null,
        swapped: false,
        orient: 'portrait',
        rect: { cx: 0.013, cy: -0.02, w: 0.41, h: 0.52 },
      };
      state.levels = {
        white: [234.6, 233.1, 220.4],
        black: [12.5, 9, 10.25],
        whiteAt: [812, 640],
        blackAt: null,
      };
      state.export = {
        format: 'webp',
        quality: 0.8,
        longEdge: 0,
        interp: 'bicubic',
        fill: 'transparent',
      };
    });
    const checked = CF.cleanState(app.app.state, app.app.img);
    const keys = Object.keys(app.app.state);
    const uncovered = keys.filter(key => !checked.fields.includes(key));
    let detail = `${keys.length} fields`;
    if (checked.invalid.length) detail = `reset: ${checked.invalid.join(', ')}`;
    if (uncovered.length) {
      detail = `no rule for: ${uncovered.join(', ')} (add one in CardEngine.sanitizeState)`;
    }
    record('R14 Edited state passes the edits-file check unchanged; every field has a rule',
      JSON.stringify(checked.state) === JSON.stringify(app.app.state)
        && !checked.invalid.length
        && !uncovered.length,
      detail);
  }

  /* ---- R15. Auto levels at the default framing: the white point is unchanged from 1.7, and
    the black point is near-neutral or absent (a colored black cast IMG_9074 yellow) ---- */
  {
    // Auto's white point in 1.7.0, at the default 1:1 fit-to-card crop.
    const RECORDED_WHITE = {
      IMG_9060: [242, 240, 225],
      IMG_9074: [234, 239, 227],
      IMG_9075: [242, 243, 235],
      IMG_9136: [240, 238, 225],
      IMG_9142: [242, 240, 234],
      IMG_9216: [246, 244, 227],
    };
    const whiteChanged = [];
    const coloredBlack = [];
    for (const name of Object.keys(RECORDED_WHITE)) {
      try {
        localStorage.clear();
      } catch (error) { /* storage unavailable */ }
      await load(name);
      CF.autoLevelsDraft();
      const { white, black } = CF.draftLevels();
      CF.discardLevels();
      const isSameWhite = white.every(
        (value, channel) => Math.abs(value - RECORDED_WHITE[name][channel]) <= 1,
      );
      if (!isSameWhite) whiteChanged.push(`${name} ${white.map(Math.round).join(',')}`);
      const spread = black ? Math.max(...black) - Math.min(...black) : 0;
      if (spread > CONFIG.levels.autoBlackMaxSpread) {
        coloredBlack.push(`${name} ${black.map(Math.round).join(',')}`);
      }
    }
    record('R15 Auto levels: white unchanged from 1.7 on every sample', !whiteChanged.length,
      whiteChanged.length ? whiteChanged.join('; ') : 'all 6 within 1');
    record('R15 Auto levels: black is near-neutral or absent on every sample',
      !coloredBlack.length,
      coloredBlack.length ? coloredBlack.join('; ') : 'all 6 near-neutral or none');
  }

  console.table(results.map(result => ({
    result: result.pass ? 'PASS' : 'FAIL',
    check: result.name,
    detail: result.detail,
  })));
  const passed = results.every(result => result.pass);
  const failedCount = results.filter(result => !result.pass).length;
  console.log(passed
    ? `All ${results.length} regression checks passed.`
    : `${failedCount} of ${results.length} checks FAILED.`);
  console.log(`R1 scoreboard, within 1%: top pick ${scoreboard.topPick}, `
    + `best of 3 ${scoreboard.bestOfThree}, raw cards ${scoreboard.rawCards}, `
    + `held out ${scoreboard.heldOut} (top pick).`);
  return { passed, results, scoreboard };
})();
