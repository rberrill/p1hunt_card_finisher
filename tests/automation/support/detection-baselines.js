// Detection's measured accuracy on the sample photos, and the rules it is held to (the catalog's
// PER-39; tests/README.md, "Detection (R1)"). The data is copied unchanged from
// tests/sample-regression.js, which still carries its own copy: a baseline that moves must move
// in both until the regression script is retired.
'use strict';

// Hand-placed card corners, in source px, top-left first, clockwise. The IMG_ photos were
// placed on 2026-10-24, the numbered set on 2026-10-31 and the front + back pairs (13, 14) on
// 2026-11-01, in the app with Save edits.
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
  '13_front_landscape_onetouch_labeled_white': [
    [475.6, 447.4], [1439, 458.7], [1427.2, 1144.3], [474.2, 1128.1],
  ],
  '13_back_landscape_onetouch_labeled_white': [
    [514.8, 450.4], [1512.7, 438.6], [1507.8, 1148.2], [530.7, 1151.1],
  ],
  '14_front_portrait_raw_white': [
    [415.3, 603.3], [1093.7, 611.8], [1054.5, 1509.5], [430.3, 1498.2],
  ],
  '14_back_portrait_raw_white': [[405.2, 480.1], [1116.6, 489.1], [1079.6, 1449], [415, 1438.2]],
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
  '13_front_landscape_onetouch_labeled_white': { top: 2.28, best: 2.28 },
  '13_back_landscape_onetouch_labeled_white': { top: 2.57, best: 2.57 },
  '14_front_portrait_raw_white': { top: 3.79, best: 2.29 },
  '14_back_portrait_raw_white': { top: 2.07, best: 2.07 },
};

// Raw cards, counted on their own in the scoreboard: the weakest kind of shot.
const RAW_CARDS = [
  '01_chrome_flat_black',
  '02_black_flat_black',
  '03_chrome_flat_busy',
  '04_red_angle_busy',
  '14_front_portrait_raw_white',
  '14_back_portrait_raw_white',
];

// Held out of detection tuning: not looked at while tuning, checked once at the end, so a
// change that only fits the photos it was tuned on shows up.
const HELD_OUT = [
  '03_chrome_flat_busy',
  '07_dark_flat_black',
  '10_sapphire_flat_busy',
  '12_blackred_stand_busy',
  '14_back_portrait_raw_white',
];

// A pick counts as found when its worst corner is within 1% of the diagonal.
const WITHIN_PCT = 1;
// How far a photo may drift above its baseline between runs.
const SLACK_PCT = 0.25;
// Above this the top pick is a different rectangle: reported, not gated, until a fix lands.
const WRONG_SHAPE_PCT = 5;

// A quad's error against the hand-placed corners: its worst corner's distance, as % of the
// image diagonal. quad and truth: four [x, y] in source px; width, height: the photo's px.
function cornerErrorPct(quad, truth, width, height) {
  const errors = quad.map((point, i) => Math.hypot(point[0] - truth[i][0], point[1] - truth[i][1]));
  return Math.max(...errors) / Math.hypot(width, height) * 100;
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

// Whether a best of three still meets its rule: one within 1% (one Candidate tap away) stays
// within 1%.
function isBestHeld(bestPct, baselineBestPct) {
  return baselineBestPct >= WITHIN_PCT || bestPct < WITHIN_PCT;
}

module.exports = {
  GROUND_TRUTH,
  BASELINE,
  RAW_CARDS,
  HELD_OUT,
  WITHIN_PCT,
  SLACK_PCT,
  WRONG_SHAPE_PCT,
  cornerErrorPct,
  groupOf,
  isTopPickHeld,
  isBestHeld,
};
