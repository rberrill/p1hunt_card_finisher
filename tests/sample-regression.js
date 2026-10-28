// Sample-photo regression checks for P1Hunt Card Finisher.
//
// How to run (needs the page served over http so it can fetch samples/):
//   1. In this folder:  python -m http.server 8765
//   2. Open http://localhost:8765/index.html and keep the tab visible (hidden tabs pause rendering).
//   3. Paste this whole file into the browser console. It prints a PASS/FAIL table and resolves
//      to { passed, results }. Takes ~20 s.
//
// Ground truth below is hand-placed card corners (source px, TL TR BR BL) from 2026-10-24.
// Thresholds are the v1.0 acceptance bar; "recorded" values are what v1.0 measured.
(async () => {
  'use strict';
  const S = window.__straightener, E = window.CardEngine, M3 = E.M3;
  if (!S || !E) throw new Error('Open index.html first — window.__straightener / CardEngine not found.');
  try { localStorage.clear(); } catch (e) { /* ignore */ }

  const GT = {
    IMG_9060: [[253, 260], [1275.5, 261], [1254, 1534], [305.5, 1535]],
    IMG_9074: [[388.5, 546], [1110, 545], [1104, 1520], [402.5, 1522.5]],
    IMG_9075: [[488, 563], [998, 565], [982, 1246], [491, 1246]],
    IMG_9136: [[274, 593], [1167, 591], [1151, 1770], [306, 1774]],
    IMG_9142: [[127, 500], [1246, 515], [1221, 1265], [163, 1248]],
    IMG_9216: [[445.5, 627], [1146, 633], [1112, 1505], [466.5, 1501.5]],
  };
  // v1.0 recorded top-1 error, % of image diagonal.
  const RECORDED = { IMG_9060: 2.48, IMG_9074: 1.80, IMG_9075: 0.04, IMG_9136: 0.46, IMG_9142: 0.25, IMG_9216: 0.09 };

  const results = [];
  const rec = (name, pass, detail) => results.push({ name, pass: !!pass, detail });
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const blobs = {};
  const load = async name => {
    blobs[name] = blobs[name] || await (await fetch(`samples/${name}.JPEG`)).blob();
    await S.openFile(blobs[name], `${name}.JPEG`);
    while (!S.app.detection.last || S.app.detection.msg) await wait(50);
  };
  const cornerErrPct = (q, gt) => Math.max(...q.map((p, i) => Math.hypot(p[0] - gt[i][0], p[1] - gt[i][1]))) / Math.hypot(S.app.img.width, S.app.img.height) * 100;

  // ---- R1. Auto-detect accuracy (Card) ----
  const top1 = {}, best3 = {};
  for (const name of Object.keys(GT)) {
    await load(name);
    const errs = S.app.detection.candidates.map(c => cornerErrPct(c.corners, GT[name]));
    top1[name] = errs[0] ?? 99; best3[name] = Math.min(99, ...errs);
    rec(`R1 ${name}: top-1 no worse than v1.0 + 0.25`, top1[name] <= RECORDED[name] + 0.25, `top-1 ${top1[name].toFixed(2)}% (v1.0 ${RECORDED[name]}%), best of 3 ${best3[name].toFixed(2)}%`);
  }
  const n1 = Object.values(top1).filter(v => v < 1).length, n3 = Object.values(best3).filter(v => v < 1).length;
  rec('R1 top-1 within 1% of diagonal on ≥ 4 of 6', n1 >= 4, `${n1}/6`);
  rec('R1 best-of-3 within 1% of diagonal on ≥ 5 of 6', n3 >= 5, `${n3}/6`);

  // ---- R2/R3. Flatten 100% and 0%, measured on exported pixels (IMG_9216, hand-placed corners) ----
  await load('IMG_9216');
  const measure = async strength => {
    S.commit(s => {
      s.corners = GT.IMG_9216.map(p => p.slice()); s.strength = strength; s.aspect = { ratio: 63.5 / 88.9, orientation: 'auto' };
      s.rotation = { quarter: 0, fine: 0, fillFrame: false }; s.flip = { h: false, v: false };
      s.crop = { mode: 'fit', preset: 'free', ratio: null, swapped: false, rect: null }; s.levels = null; s.export.longEdge = 0;
    });
    const { canvas, geo } = await S.renderFull(JSON.parse(JSON.stringify(S.app.state)));
    const d = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
    const predicted = GT.IMG_9216.map(p => M3.apply(geo.Mout, p[0], p[1]));
    const q = E.refineQuad({ data: d.data, width: d.width, height: d.height, ox: 0, oy: 0, scale: 1 }, predicted, { searchPx: 10 }).corners;
    canvas.width = 0;
    const deg = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI, s = E.Quad.sides(q);
    return { maxCornerDev: Math.max(...E.Quad.angles(q).map(a => Math.abs(a - 90))), aspect: (s.top + s.bottom) / (s.left + s.right),
      top: deg(q[0], q[1]), bottom: deg(q[3], q[2]), mirror: Math.abs((90 - deg(q[0], q[3])) + (90 - deg(q[1], q[2]))) };
  };
  const f = await measure(1), aspErr = Math.abs(f.aspect / (63.5 / 88.9) - 1) * 100;
  rec('R2 Flatten 100%: corners 90° ± 0.5°', f.maxCornerDev <= 0.5, `worst ${f.maxCornerDev.toFixed(3)}° (v1.0 0.334°)`);
  rec('R2 Flatten 100%: aspect 5:7 ± 0.5%', aspErr <= 0.5, `${aspErr.toFixed(3)}% (v1.0 0.087%)`);
  const sq = await measure(0);
  rec('R3 Flatten 0%: top & bottom level within 0.3°', Math.abs(sq.top) <= 0.3 && Math.abs(sq.bottom) <= 0.3, `top ${sq.top.toFixed(3)}°, bottom ${sq.bottom.toFixed(3)}° (v1.0 0.031°, 0.239°)`);
  rec('R3 Flatten 0%: sides mirror within 0.5°', sq.mirror <= 0.5, `${sq.mirror.toFixed(3)}° (v1.0 0.029°)`);

  // ---- R4. Export size and JPEG quality ----
  await load('IMG_9216');
  S.commit(s => { s.crop = { mode: 'fit', preset: '1:1', ratio: 1, swapped: false, rect: null }; s.export.longEdge = 0; s.export.format = 'jpeg'; });
  const g4 = E.computeGeometry(S.app.state, {});
  const enc = async (st, q) => { const { canvas } = await S.renderFull(st); const b = await new Promise(r => canvas.toBlob(r, 'image/jpeg', q)); const dims = [canvas.width, canvas.height]; canvas.width = 0; return { bytes: b.size, dims }; };
  const st4 = JSON.parse(JSON.stringify(S.app.state));
  const q92 = await enc(st4, 0.92), q50 = await enc(st4, 0.5);
  rec('R4 Export is full resolution when no resize is set', q92.dims[0] === Math.round(g4.crop.w) && q92.dims[1] === Math.round(g4.crop.h), `${q92.dims.join('×')} vs crop ${Math.round(g4.crop.w)}×${Math.round(g4.crop.h)}`);
  rec('R4 JPEG quality is respected (0.92 file > 0.50 file)', q92.bytes > q50.bytes * 1.5, `${q92.bytes} vs ${q50.bytes} bytes`);
  const st600 = JSON.parse(JSON.stringify(st4)); st600.export.longEdge = 600;
  const r600 = await enc(st600, 0.92);
  rec('R4 Resize sets the long edge', Math.max(...r600.dims) === 600, r600.dims.join('×'));

  // ---- R5. Levels: label white comes out neutral at whiteTarget (IMG_9136) ----
  await load('IMG_9136');
  const lv5 = { white: [210, 230.7, 226], black: null, whiteAt: [420, 230], blackAt: null }; // v1.0 dropper reading of the PSA label
  S.commit(s => { s.crop = { mode: 'full', preset: 'free', ratio: null, swapped: false, rect: null }; s.levels = lv5; s.export.longEdge = 0; });
  {
    const { canvas, geo } = await S.renderFull(JSON.parse(JSON.stringify(S.app.state)));
    const p = M3.apply(geo.Mout, 420, 230), R = 12;
    const c = E.meanColor(canvas.getContext('2d').getImageData(Math.round(p[0]) - R, Math.round(p[1]) - R, 2 * R, 2 * R), CONFIG.levels.sampleTrim);
    canvas.width = 0;
    rec('R5 Levels: picked label exports neutral at 245 ± 2', c.every(v => Math.abs(v - CONFIG.levels.whiteTarget) <= 2), `exported ${c.join(', ')} (v1.0 245.7, 244.7, 245.0)`);
  }

  // ---- R6. Edits round-trip is pixel-identical (rotation, flip, fill frame, bicubic, levels) ----
  S.commit(s => {
    s.rotation = { quarter: 1, fine: 2.3, fillFrame: true }; s.flip = { h: true, v: false };
    s.crop = { mode: 'fit', preset: '1:1', ratio: 1, swapped: false, rect: null }; s.export.interp = 'bicubic'; s.levels = lv5;
  });
  const pixels = async () => { const { canvas } = await S.renderFull(JSON.parse(JSON.stringify(S.app.state))); const d = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data; canvas.width = 0; return d; };
  const before = await pixels(), json = JSON.stringify(S.app.state);
  await load('IMG_9136');
  S.commit(s => { const o = JSON.parse(json); for (const k of Object.keys(s)) delete s[k]; Object.assign(s, o); });
  const after = await pixels();
  let diff = before.length === after.length ? 0 : -1;
  if (diff === 0) for (let i = 0; i < before.length; i++) if (before[i] !== after[i]) diff++;
  rec('R6 Save → reload → load edits exports pixel-identical', diff === 0, diff < 0 ? 'size mismatch' : `${diff} differing bytes of ${before.length}`);

  // ---- R7. Undo/redo, including keyboard while a slider has focus ----
  await load('IMG_9216');
  S.setTab('rotate');
  const fine = document.getElementById('fine');
  fine.focus(); fine.value = 7.5; fine.dispatchEvent(new Event('input'));
  const k = (key, shift) => fine.dispatchEvent(new KeyboardEvent('keydown', { key, ctrlKey: true, shiftKey: !!shift, bubbles: true }));
  k('z'); const undone = S.app.state.rotation.fine; k('z', true); const redone = S.app.state.rotation.fine;
  rec('R7 Ctrl+Z / Shift+Ctrl+Z work while a slider has focus', undone === 0 && redone === 7.5, `after undo ${undone}, after redo ${redone}`);
  S.setTab('perspective');

  // ---- R8. Self-tests inside the Web Worker ----
  const w = await S.EngineWorker.call('selftest', {});
  rec('R8 Engine self-tests pass inside the Web Worker', w.passed && !S.EngineWorker.failed, `${w.results.filter(r => r.pass).length}/${w.results.length}`);

  console.table(results.map(r => ({ result: r.pass ? 'PASS' : 'FAIL', check: r.name, detail: r.detail })));
  const passed = results.every(r => r.pass);
  console.log(passed ? `All ${results.length} regression checks passed.` : `${results.filter(r => !r.pass).length} of ${results.length} checks FAILED.`);
  return { passed, results };
})();
