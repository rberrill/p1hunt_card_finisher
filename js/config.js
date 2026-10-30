/* =====================================================================
   CONFIG: every tunable lives here. Loaded first, as a classic script (global CONFIG).
   URL params override number and on/off keys: ?detect.cannyHigh=90&debug=1
   (?selftest=1 runs the self-tests). The key names are part of those links, so they don't
   change; js/engine.js mirrors some of them in its *_DEFAULTS.
   ===================================================================== */
const CONFIG = {
  // See CHANGELOG.md.
  appVersion: '1.7.0-dev.2',
  debug: false,
  // Long side of the in-memory preview copy (and of the warped preview).
  previewMaxPx: 2048,
  // Long side of the copy used for the live mini preview while dragging.
  thumbMaxPx: 720,
  historyLimit: 50,
  // Fallback corners when detection fails: a centered rectangle inset this much.
  defaultInsetPct: 20,
  // Corners closer than this (source px) are rejected.
  minCornerDistPx: 8,
  // Long-side clamp for the perspective frame and the export.
  maxOutputPx: 12000,
  // 16.7 MP: iOS Safari's canvas area limit, applied everywhere for parity.
  maxOutputArea: 16777216,
  // The perspective frame extends at most this many card sizes beyond the card.
  maxBoundsFactor: 3,
  // Height of the 0% (squared-up) shape: 'preserveEdges' | 'meanEdge' | 'visual'.
  squareUpHeight: 'preserveEdges',

  handle: { cornerRadius: 11, edgeSize: 10, hitRadius: 24, lineWidth: 2 },
  colors: {
    quad: '#e5322d',
    quadInvalid: '#ffb02e',
    handle: '#ffffff',
    handleSelected: '#e5322d',
    extend: 'rgba(255,255,255,0.22)',
    grid: 'rgba(255,255,255,0.18)',
    thirds: 'rgba(255,255,255,0.45)',
    dim: 'rgba(0,0,0,0.55)',
    seed: '#3fb950',
  },
  theme: {
    bg: '#161618',
    panel: '#1f1f22',
    panel2: '#2a2a2e',
    line: '#3a3a40',
    text: '#e8e8ea',
    muted: '#9c9ca4',
    accent: '#e5322d',
    stage: '#2b2b2b',
  },
  // The handle loupe: magnification, size and offset (CSS px); on touch screens at most
  // loupeMaxFrac of the photo width.
  loupeZoom: 4,
  loupeSize: 150,
  loupeOffset: 96,
  loupeMaxFrac: 0.42,
  // Double-tap a handle: zoom to this many times the fit-to-screen scale.
  handleZoom: 6,
  // The on-screen nudge pad: hold delay, repeat rate, and how long the loupe stays after the
  // last nudge.
  nudge: { delayMs: 350, repeatMs: 60, loupeMs: 4000 },
  // Snap-to-edge distance, in screen px.
  snapRadiusPx: 18,

  // The default Flatten %: 0 = squared-up trapezoid, 100 = flat rectangle.
  perspective: { strength: 100 },
  // The physical card size in mm; it sets the 100% shape (5:7).
  card: { w: 63.5, h: 88.9 },

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
    // The listing default (decided 2026-10-24).
    defaultPreset: '1:1',
    fitPaddingPct: 8,
    minSizePx: 16,
  },
  export: {
    // The listing default: 1:1 · 2000 px · JPEG 0.92.
    format: 'jpeg',
    quality: 0.92,
    longEdge: 2000,
    // 0 = original.
    longEdgePresets: [1080, 2000, 3000, 0],
    // 'bilinear' | 'bicubic'.
    interp: 'bilinear',
    // 'transparent' or a #rrggbb color.
    fill: '#ffffff',
    // Never upsample a small crop up to longEdge.
    allowUpscale: false,
    suffix: '-straight',
    // Show a Share button (the share sheet: Save Image, AirDrop…) where the browser can share
    // files. Browsers only allow that on secure pages (HTTPS or localhost).
    share: true,
    // Output pixels per warp band (the memory budget on phones).
    bandPx: 2097152,
    // The most source pixels read for one band.
    maxBandSrcPx: 6000000,
    // Larger files aren't read as edits (a 5 MB logo is ~6.7 MB in base64).
    editsMaxBytes: 8 * 1024 * 1024,
  },

  // Detection. js/engine.js's DETECT_DEFAULTS mirror the engine's keys (tests/selftest.js
  // checks they match).
  detect: {
    // Long side of the detection copy.
    workingSize: 1000,
    // Sub-pixel refinement on the full-resolution photo, reading at most refineMaxPx pixels.
    refine: true,
    refineMaxPx: 8000000,
    // Edges: Gaussian blur, then Sobel per color channel (colorEdges) and Canny hysteresis
    // thresholds on the gradient magnitude.
    blurSigma: 1.6,
    colorEdges: true,
    cannyLow: 20,
    cannyHigh: 55,
    // Hough lines: angle resolution; each edge pixel votes only within ± houghGradWinDeg of its
    // own gradient; a line needs houghThreshold votes; at most houghMaxLines are kept; peaks
    // within mergeAngleDeg and mergeRhoPx are one line.
    angleStepDeg: 0.5,
    houghGradWinDeg: 6,
    houghThreshold: 45,
    houghMaxLines: 48,
    mergeAngleDeg: 2,
    mergeRhoPx: 6,
    // Quads: opposite sides differ in angle by at most maxPerspectiveDeg; the two side pairs
    // are within perpTolDeg of perpendicular; opposite sides are at least minSideFrac of the
    // short image side apart; the area is between minAreaFrac and maxAreaFrac of the image;
    // corners may lie edgeMarginFrac of the long side outside the image.
    maxPerspectiveDeg: 25,
    perpTolDeg: 30,
    minSideFrac: 0.08,
    minAreaFrac: 0.03,
    maxAreaFrac: 0.9,
    edgeMarginFrac: 0.02,
    // Scoring: edge support counts edges within supportRadiusPx, skipping cornerTrim of each
    // side at both ends (rounded corners); aspect errors under aspectDeadband (log scale) are
    // free, then fall off with aspectTol; corner angles fall off with angleTolDeg.
    supportRadiusPx: 2,
    cornerTrim: 0.12,
    aspectDeadband: 0.06,
    aspectTol: 0.10,
    angleTolDeg: 22,
    // Fallback focal length ÷ long side for perspective-corrected aspect scoring; ~0.75 for
    // iPhone 1×, ~2–3 for 2× / 3× or cropped shots.
    focalFactor: 2.5,
    // Score weights. Negative wArea = prefer the inner of nested, equally strong quads, so the
    // card wins over a slab window, one-touch recess or the case's outer edge.
    wSupport: 1.0,
    wAspect: 0.4,
    wAngle: 0.35,
    wCenter: 0.25,
    wArea: -0.45,
    // A quad that misses the seed scores this much; candidates whose corners all lie within
    // dupCornerFrac of the diagonal are one; keep maxCandidates; below minConfidence the status
    // line asks you to check the corners.
    seedMissFactor: 0.3,
    dupCornerFrac: 0.02,
    maxCandidates: 3,
    minConfidence: 0.5,
    // Refinement: search ± refineSearchWorkingPx (working px) along each side's normal at
    // refineSamples points, after a refineBlur blur; points weaker than refineMinGrad are
    // dropped, and the line fit keeps points within refineInlierPx.
    refineSearchWorkingPx: 3,
    refineSamples: 48,
    refineBlur: 1.0,
    refineMinGrad: 6,
    refineInlierPx: 1.5,
  },

  levels: {
    // The white pick lands here (not 255, so brighter holo highlights don't clip).
    whiteTarget: 245,
    // The black pick lands here (not 0, so shadow detail isn't crushed).
    blackTarget: 8,
    // The dropper patch radius in screen px (the circle in the loupe); zoom in for finer picks.
    sampleRadiusPx: 4,
    // The dropper ignores this share of the darkest and brightest pixels in the patch (text,
    // glare specks).
    sampleTrim: 0.25,
    // Black picks brighter than this (0–255) are rejected as a mistake.
    maxBlackLuma: 100,
    // Auto analyses the framed image at this long side.
    autoSamplePx: 600,
    // Auto: the brightest and darkest % of pixels; pixels at autoClipAt or above are clipped and
    // not used for white.
    autoWhitePct: 1,
    autoBlackPct: 0.5,
    autoClipAt: 250,
    // Press and hold the photo this long (without moving) to compare with no levels.
    compareHoldMs: 250,
  },

  // Session restore: the last photo and its edits are kept on this device (IndexedDB) so a
  // reload, a navigation or iOS closing the tab can be resumed. Nothing leaves the device.
  session: { enabled: true, dbName: 'p1hunt-finisher', saveDelayMs: 400 },

  // The Overlay step (a logo). Placement defaults live in CardEngine.OVERLAY_DEFAULTS.
  overlay: {
    // The file size limit.
    maxBytes: 5 * 1024 * 1024,
    // Raster overlays are decoded at most this long side (phone memory).
    maxPx: 4096,
    // SVGs are rasterized at this long side, so they stay crisp at export size.
    svgPx: 2048,
    // The arrow step as % of the photo width (Shift: bigger).
    nudgePct: 0.5,
    nudgeShiftPct: 5,
    // − and + change the width by this factor.
    sizeStep: 1.05,
    // The snap rings sit this far (screen px) in from the photo's corners.
    hotSpotInset: 28,
  },

  keys: {
    undo: 'mod+z',
    redo: 'mod+shift+z',
    redoAlt: 'mod+y',
    debug: '`',
    fit: 'f',
    compare: 'c',
    cycleHandle: 'Tab',
    nudge: 1,
    nudgeShift: 10,
  },
  storageKey: 'p1hunt.straightener.v1',
};

/* Safe ranges for URL overrides, [min, max] by dotted key. These settings size canvases,
   buffers or loops, so an extreme value from a link could break the app or run a phone out of
   memory. Memory and size caps can only be lowered (max = the shipped value). Unlisted numbers
   take any finite value. tests/selftest.js checks every key exists in CONFIG with its default
   inside the range. */
const CONFIG_LIMITS = {
  previewMaxPx: [512, 2048],
  thumbMaxPx: [240, 720],
  historyLimit: [1, 200],
  maxOutputPx: [1000, 12000],
  maxOutputArea: [1000000, 16777216],
  maxBoundsFactor: [1, 3],
  loupeZoom: [1, 16],
  loupeSize: [60, 400],
  handleZoom: [1, 20],
  'nudge.delayMs': [100, 2000],
  'nudge.repeatMs': [20, 1000],
  'nudge.loupeMs': [0, 20000],
  'export.longEdge': [0, 12000],
  'export.bandPx': [65536, 2097152],
  'export.maxBandSrcPx': [1000000, 6000000],
  'export.editsMaxBytes': [65536, 8388608],
  'overlay.maxBytes': [65536, 5242880],
  'overlay.maxPx': [256, 4096],
  'overlay.svgPx': [256, 2048],
  'detect.workingSize': [300, 2000],
  'detect.refineMaxPx': [1000000, 8000000],
  'detect.angleStepDeg': [0.1, 5],
  'detect.houghMaxLines': [4, 96],
  'detect.maxCandidates': [1, 10],
  'levels.autoSamplePx': [100, 2000],
  'session.saveDelayMs': [50, 10000],
};
