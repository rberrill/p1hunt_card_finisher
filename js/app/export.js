/* =====================================================================
   js/app/export.js — Full-resolution banded render, Download / Share / Copy (Exporter), save/load edits.
   Shell modules share one namespace, CF (created in core.js). Names from core are
   destructured below; anything from another module is called as CF.name.
   tests/selftest.js checks these boundaries.
   ===================================================================== */
(function (CF) {
  'use strict';
  const { E, M3, $, clone, shortText, nextFrame, makeCanvas, ctx2d, app, geoCfg, toast } = CF;

  /* =====================================================================
     EXPORT — full-resolution render in row bands, then encode via Exporter.
     ===================================================================== */
  const Exporter = {
    download(blob, filename) {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = filename;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 60000);
    },
    // Share sheet (Save Image, AirDrop…): keeps the app open, where a download on iOS Safari replaces
    // the page with the file. Only offered when the browser can share image files (secure pages only).
    canShare() {
      if (!CONFIG.export.share || !navigator.share || !navigator.canShare) return false;
      try { return navigator.canShare({ files: [new File([new Blob()], 'test.jpg', { type: 'image/jpeg' })] }); } catch (e) { return false; }
    },
    canCopy: () => !!(navigator.clipboard && navigator.clipboard.write && window.ClipboardItem),
    // Safari requires the ClipboardItem to be created synchronously in the gesture with a Promise.
    copy(blobPromise) { return navigator.clipboard.write([new ClipboardItem({ 'image/png': blobPromise })]); },
  };
  const MIME = { jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
  const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
  const toBlob = (c, type, q) => new Promise((res, rej) => c.toBlob(b => b ? res(b) : rej(new Error('Encoding failed (image too large for this browser?)')), type, q));

  // Source-space bounding box of an output row band (projective maps send lines to lines,
  // so the band's 4 corners bound its preimage unless it straddles the horizon).
  function bandSourceBox(Minv, outW, y0, y1, W, H) {
    const pts = [], n = 8;
    for (let i = 0; i <= n; i++) for (const y of [y0, y1]) pts.push([outW * i / n, y]);
    for (const x of [0, outW]) for (let i = 1; i < n; i++) pts.push([x, y0 + (y1 - y0) * i / n]);
    let x0 = Infinity, ya = Infinity, x1 = -Infinity, yb = -Infinity, any = false;
    for (const p of pts) {
      if (M3.w(Minv, p[0], p[1]) <= 1e-12) { x0 = 0; ya = 0; x1 = W; yb = H; any = true; continue; }
      const q = M3.apply(Minv, p[0], p[1]); any = true;
      x0 = Math.min(x0, q[0]); ya = Math.min(ya, q[1]); x1 = Math.max(x1, q[0]); yb = Math.max(yb, q[1]);
    }
    const m = 3; // bicubic needs 2 px of neighbors
    x0 = Math.max(0, Math.floor(x0) - m); ya = Math.max(0, Math.floor(ya) - m);
    x1 = Math.min(W, Math.ceil(x1) + m); yb = Math.min(H, Math.ceil(yb) + m);
    return any && x1 > x0 && yb > ya ? { x0, y0: ya, x1, y1: yb } : null;
  }

  // render(sourceImage, state) at full resolution → canvas. Deterministic for a given state.
  async function renderFull(st, onProgress) {
    const g = E.computeGeometry(st, geoCfg());
    if (!g.ok) throw new Error(g.reason);
    const W = st.source.width, H = st.source.height, outW = g.out.w, outH = g.out.h, Minv = g.MoutInv;
    const fill = CF.fillRGBA(st.export.format === 'jpeg' && st.export.fill === 'transparent' ? '#ffffff' : st.export.fill);
    const out = makeCanvas(outW, outH), octx = ctx2d(out);
    const lut = E.levelsLUT(st.levels, CONFIG.levels);
    const reg = makeCanvas(1, 1), rctx = ctx2d(reg, true);
    let bandH = Math.max(8, Math.floor(CONFIG.export.bandPx / outW)), y = 0;
    while (y < outH) {
      const bh = Math.min(bandH, outH - y);
      const box = bandSourceBox(Minv, outW, y, y + bh, W, H);
      const band = new ImageData(outW, bh);
      if (box) {
        // Local sampling density: source px covered by one output px at the band center.
        const c0 = M3.apply(Minv, outW / 2, y + bh / 2), cx = M3.apply(Minv, outW / 2 + 1, y + bh / 2), cy = M3.apply(Minv, outW / 2, y + bh / 2 + 1);
        const dens = Math.sqrt(Math.max(1e-9, E.V.dist(c0, cx) * E.V.dist(c0, cy)));
        // When shrinking a lot, let the browser's area-filtered resampler pre-shrink the region
        // first (a mip level), since bilinear alone only reads 4 texels and aliases.
        const r = isFinite(dens) && dens > 1.5 ? Math.min(1, 1.25 / dens) : 1;
        const sw = box.x1 - box.x0, sh = box.y1 - box.y0;
        if (sw * sh * r * r > CONFIG.export.maxBandSrcPx && bandH > 8) { bandH = Math.max(8, bandH >> 1); continue; }
        const rw = Math.max(1, Math.round(sw * r)), rh = Math.max(1, Math.round(sh * r)), rx = rw / sw, ry = rh / sh;
        reg.width = rw; reg.height = rh;
        rctx.imageSmoothingEnabled = true; rctx.imageSmoothingQuality = 'high';
        rctx.drawImage(app.img.el, box.x0, box.y0, sw, sh, 0, 0, rw, rh);
        const src = rctx.getImageData(0, 0, rw, rh);
        if (lut) E.applyLUT(src, lut); // levels are per-pixel, so applying before the warp leaves the fill color untouched
        const M = M3.chain(M3.scale(rx, ry), M3.translate(-box.x0, -box.y0), Minv);
        E.warp(band, src, M, { fill, interp: st.export.interp, rowOffset: y, bounds: [-box.x0 * rx, -box.y0 * ry, (W - box.x0) * rx, (H - box.y0) * ry] });
      } else {
        const d = band.data; for (let i = 0; i < d.length; i += 4) { d[i] = fill[0]; d[i + 1] = fill[1]; d[i + 2] = fill[2]; d[i + 3] = fill[3]; }
      }
      octx.putImageData(band, 0, y);
      y += bh;
      onProgress && onProgress(y / outH);
      await nextFrame();
    }
    reg.width = reg.height = 0;
    CF.compositeOverlay(octx, st, outW, outH); // the overlay goes on last, before encoding (no levels on it)
    return { canvas: out, geo: g };
  }

  async function doExport(kind) {
    if (!app.img || app.exporting) return;
    const st = clone(app.state);
    const fmt = kind === 'copy' ? 'image/png' : MIME[st.export.format];
    const prog = $('progress'), bar = prog.firstElementChild;
    app.exporting = true; prog.hidden = false; bar.style.width = '0%'; CF.syncReadouts();
    const t0 = performance.now();
    const work = renderFull(st, f => { bar.style.width = Math.round(f * 100) + '%'; })
      .then(async ({ canvas }) => {
        // JPEG can't hold alpha; flatten onto white so transparent fill doesn't turn black.
        if (fmt === 'image/jpeg' && st.export.fill === 'transparent') {
          const c2 = makeCanvas(canvas.width, canvas.height), x = ctx2d(c2);
          x.fillStyle = '#fff'; x.fillRect(0, 0, c2.width, c2.height); x.drawImage(canvas, 0, 0); canvas.width = 0; canvas = c2;
        }
        const blob = await toBlob(canvas, fmt, st.export.format === 'png' ? undefined : st.export.quality);
        canvas.width = canvas.height = 0; // free the big buffer now (matters on iOS)
        return blob;
      });
    try {
      if (kind === 'copy') {
        await Exporter.copy(work);
        toast('Copied to clipboard (PNG).');
      } else {
        const blob = await work;
        const ext = EXT[blob.type] || 'png';
        if (blob.type !== fmt) toast(`${st.export.format.toUpperCase()} isn’t supported by this browser — saved as ${ext.toUpperCase()}.`, 'warn', 5000);
        const base = (st.source.name || 'photo').replace(/\.[^.]+$/, '');
        const secs = ((performance.now() - t0) / 1000).toFixed(1);
        const name = `${base}${CONFIG.export.suffix}.${ext}`, done = `Exported ${app.geo.out.w} × ${app.geo.out.h} px in ${secs} s.`;
        if (kind === 'download') { CF.Session.flush(); Exporter.download(blob, name); toast(done); }
        else {
          const how = await shareFile(new File([blob], name, { type: blob.type }));
          if (how === 'pending') toast(done + ' Tap Share now to open the share sheet.', '', 6000);
          else if (how === 'shared') toast(done);
        }
      }
    } catch (e) {
      console.error(e); toast((kind === 'copy' ? 'Copy failed: ' : 'Export failed: ') + e.message, 'err', 6000);
    } finally {
      app.exporting = false; prog.hidden = true; CF.syncReadouts();
    }
  }

  // Opens the share sheet for a finished file. Returns 'shared', 'cancelled', 'pending' or 'failed'.
  // 'pending': the browser refused because the tap was too long ago (a slow export), so the Share
  // button becomes "Share now" and a fresh tap opens the sheet. Any edit cancels it.
  async function shareFile(file) {
    try { await navigator.share({ files: [file] }); app.pendingSave = null; return 'shared'; }
    catch (e) {
      if (e.name === 'AbortError') return 'cancelled';
      if (e.name === 'NotAllowedError' && !app.pendingSave) { app.pendingSave = file; return 'pending'; }
      app.pendingSave = null; toast('Share failed: ' + e.message, 'err', 6000); return 'failed';
    } finally { CF.syncReadouts(); }
  }

  /* ---------- save / load edits (the serializable edit state) ---------- */
  function saveEdits() {
    if (!app.state) return;
    // The overlay image travels inside the edits file, so loading it rebuilds the export exactly.
    const data = Object.assign(clone(app.state), { overlayImage: CF.overlayForEdits(app.state) || undefined });
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    CF.Session.flush(); Exporter.download(blob, (app.state.source.name || 'photo').replace(/\.[^.]+$/, '') + '-edits.json');
  }
  // The file is untrusted: its size is checked before reading, and the fields the messages below show
  // (source name and size) before they're used. Everything else goes through cleanState.
  const isObj = x => x !== null && typeof x === 'object' && !Array.isArray(x);
  const isDim = x => Number.isInteger(x) && x > 0;
  async function loadEdits(file) {
    if (file.size > CONFIG.export.editsMaxBytes) { toast('That file is too large to be a Card Finisher edits file.', 'err'); return; }
    let st;
    try { st = JSON.parse(await file.text()); } catch (e) { toast('That file isn’t valid JSON.', 'err'); return; }
    if (!isObj(st) || ![1, 2].includes(st.version) || !isObj(st.source) || !isDim(st.source.width) || !isDim(st.source.height) || !Array.isArray(st.corners)) {
      toast('That isn’t a Card Finisher edits file.', 'err'); return;
    }
    if (st.version === 1) {
      // v1 had separate Square up / Flatten modes and a Card/Case target; square up = 0% flatten.
      if (st.mode === 'square') st.strength = 0;
      st.aspect = CF.cardAspect(st.aspect && st.aspect.orientation);
      delete st.mode; delete st.target; st.version = 2;
    }
    if (!app.img) { toast('Open the matching photo first, then load its edits.', 'warn', 5000); return; }
    if (isObj(st.crop) && st.crop.orient === undefined) {
      const r = st.crop.ratio === 'original' ? st.source.width / st.source.height : st.crop.ratio;
      st.crop.orient = r && r !== 1 ? ((st.crop.swapped ? 1 / r : r) < 1 ? 'portrait' : 'landscape') : null;
    }
    if (st.source.width !== app.img.width || st.source.height !== app.img.height) {
      toast(`These edits are for a ${st.source.width}×${st.source.height} photo; this one is ${app.img.width}×${app.img.height}.`, 'err', 6000); return;
    }
    if (st.source.name !== app.img.name) toast(`Edits were saved for “${shortText(st.source.name) || 'another photo'}”. Applied anyway — sizes match.`, 'warn', 5000);
    // Only well-formed fields are used; anything else in the file falls back to the default.
    const clean = CF.cleanState(st, app.img), next = clean.state;
    if (clean.invalid.length) toast(`Some settings in these edits weren’t valid and were reset: ${clean.invalid.join(', ')}.`, 'warn', 6000);
    next.overlayImage = st.overlayImage;
    if (!(await CF.overlayFromEdits(next))) { toast('The overlay in these edits couldn’t be read, so it was left out.', 'warn', 5000); next.overlay = null; }
    CF.commit(s => { for (const k of Object.keys(s)) delete s[k]; Object.assign(s, next); });
  }

  Object.assign(CF, { Exporter, renderFull, doExport, shareFile, saveEdits, loadEdits });
})(window.CF);
