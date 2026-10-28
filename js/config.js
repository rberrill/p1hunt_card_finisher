/* =====================================================================
   CONFIG — every tunable lives here. Loaded first, as a classic script (global CONFIG).
   URL params override any key:  ?detect.cannyHigh=90&debug=1  ·  ?selftest=1 runs self-tests
   ===================================================================== */
const CONFIG = {
  appVersion: '1.4.0-dev',         // see CHANGELOG.md
  debug: false,
  previewMaxPx: 2048,          // long side of the in-memory preview copy (and of the warped preview)
  thumbMaxPx: 720,             // long side of the copy used for the live mini preview while dragging
  historyLimit: 50,
  defaultInsetPct: 20,         // fallback corners when detection fails: centered rect inset this much
  minCornerDistPx: 8,          // corners closer than this (source px) are rejected
  maxOutputPx: 12000,          // long-side clamp for the perspective frame and the export
  maxOutputArea: 16777216,     // 16.7 MP: iOS Safari's canvas area limit, applied everywhere for parity
  maxBoundsFactor: 3,          // perspective frame extends at most this many card-sizes beyond the card
  squareUpHeight: 'preserveEdges', // height of the 0% (squared-up) shape: 'preserveEdges' | 'meanEdge' | 'visual'

  handle: { cornerRadius: 11, edgeSize: 10, hitRadius: 24, lineWidth: 2 },
  colors: { quad: '#e5322d', quadInvalid: '#ffb02e', handle: '#ffffff', handleSelected: '#e5322d', extend: 'rgba(255,255,255,0.22)', grid: 'rgba(255,255,255,0.18)', thirds: 'rgba(255,255,255,0.45)', dim: 'rgba(0,0,0,0.55)', seed: '#3fb950' },
  theme: { bg: '#161618', panel: '#1f1f22', panel2: '#2a2a2e', line: '#3a3a40', text: '#e8e8ea', muted: '#9c9ca4', accent: '#e5322d', stage: '#2b2b2b' },
  loupeZoom: 4, loupeSize: 150, loupeOffset: 96, loupeMaxFrac: 0.42, // touch loupe: at most this share of the photo width
  handleZoom: 6,               // double-tap a handle: zoom to this many times the fit-to-screen scale
  nudge: { delayMs: 350, repeatMs: 60, loupeMs: 4000 }, // on-screen nudge pad: hold delay, repeat rate, loupe time after the last nudge
  snapRadiusPx: 18,            // screen px

  perspective: { strength: 100 }, // default Flatten %: 0 = squared-up trapezoid, 100 = flat rectangle
  card: { w: 63.5, h: 88.9 },      // physical card size in mm; sets the 100% shape (5:7)

  rotate: { fineRangeDeg: 45, fineStepDeg: 0.1, gridPx: 48 },
  crop: {
    presets: [
      { id: 'free', label: 'Free', ratio: null },
      { id: 'original', label: 'Original', ratio: 'original' },
      { id: '1:1', label: '1:1', ratio: 1 },
      { id: '4:3', label: '4:3', ratio: 4 / 3 },
      { id: '5:4', label: '5:4', ratio: 5 / 4 },
      { id: '3:2', label: '3:2', ratio: 3 / 2 },
      { id: '16:9', label: '16:9', ratio: 16 / 9 },
      { id: '5:7', label: '5:7 card', ratio: 5 / 7 },
    ],
    defaultPreset: '1:1',       // listing default (decided 2026-10-24)
    fitPaddingPct: 8,
    minSizePx: 16,
  },
  export: {
    format: 'jpeg', quality: 0.92, longEdge: 2000,   // listing default: 1:1 · 2000 px · JPEG 0.92
    longEdgePresets: [1080, 2000, 3000, 0],          // 0 = original
    interp: 'bilinear',          // 'bilinear' | 'bicubic'
    fill: '#ffffff',             // 'transparent' or a #rrggbb color
    allowUpscale: false,         // never upsample a small crop up to longEdge
    suffix: '-straight',
    share: true,                 // show a Share button (share sheet: Save Image, AirDrop…) where the browser can share files.
                                 // Browsers only allow that on secure pages (HTTPS or localhost).
    bandPx: 2097152,             // output pixels per warp band (memory budget on phones)
    maxBandSrcPx: 6000000,       // max source pixels read for one band
  },

  detect: {
    workingSize: 1000,           // long side of the detection copy
    refine: true, refineMaxPx: 8000000,
    blurSigma: 1.6, colorEdges: true, cannyLow: 20, cannyHigh: 55,
    angleStepDeg: 0.5, houghGradWinDeg: 6, houghThreshold: 45, houghMaxLines: 48, mergeAngleDeg: 2, mergeRhoPx: 6,
    maxPerspectiveDeg: 25, perpTolDeg: 30, minSideFrac: 0.08, minAreaFrac: 0.03, maxAreaFrac: 0.9, edgeMarginFrac: 0.02,
    supportRadiusPx: 2, cornerTrim: 0.12, aspectDeadband: 0.06, aspectTol: 0.10, angleTolDeg: 22,
    focalFactor: 2.5,            // fallback focal length ÷ long side for perspective-corrected aspect scoring; ~0.75 for iPhone 1×, ~2–3 for 2×/3× or cropped shots
    // Score weights. Negative wArea = prefer the inner of nested, equally strong quads, so the
    // card wins over a slab window, one-touch recess or the case's outer edge.
    wSupport: 1.0, wAspect: 0.4, wAngle: 0.35, wCenter: 0.25, wArea: -0.45,
    seedMissFactor: 0.3, dupCornerFrac: 0.02, maxCandidates: 3, minConfidence: 0.5,
    refineSearchWorkingPx: 3, refineSamples: 48, refineBlur: 1.0, refineMinGrad: 6, refineInlierPx: 1.5,
    // Opt-in fallback detector (decided 2026-10-24). Official pinned build, ~10 MB; loaded only when enabled.
    opencv: { enabled: false, url: 'https://docs.opencv.org/4.9.0/opencv.js', cannyLow: 40, cannyHigh: 120, approxEps: 0.02 },
  },

  levels: {
    whiteTarget: 245,            // the white pick lands here (not 255, so brighter holo highlights don't clip)
    blackTarget: 8,              // the black pick lands here (not 0, so shadow detail isn't crushed)
    sampleRadiusPx: 4,           // dropper patch radius in screen px (the circle in the loupe); zoom in for finer picks
    sampleTrim: 0.25,            // dropper ignores this fraction of darkest + brightest pixels in the patch (text, glare specks)
    maxBlackLuma: 100,           // black picks brighter than this (0–255) are rejected as a mistake
    autoSamplePx: 600,           // Auto analyses the framed image at this long side
    autoWhitePct: 1, autoBlackPct: 0.5, autoClipAt: 250, // Auto: brightest/darkest % of pixels; ignore clipped ones for white
    compareHoldMs: 250,          // press and hold the photo this long (without moving) to compare with no levels
  },

  // Session restore: the last photo and its edits are kept on this device (IndexedDB) so a reload,
  // a navigation or iOS closing the tab can be resumed. Nothing leaves the device.
  session: { enabled: true, dbName: 'p1hunt-finisher', saveDelayMs: 400 },

  keys: { undo: 'mod+z', redo: 'mod+shift+z', redoAlt: 'mod+y', debug: '`', fit: 'f', compare: 'c', cycleHandle: 'Tab', nudge: 1, nudgeShift: 10 },
  storageKey: 'p1hunt.straightener.v1',
};
