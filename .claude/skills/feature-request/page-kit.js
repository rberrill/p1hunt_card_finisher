// Builders for P1Hunt feature-request pages (the feature-request skill): the SVG parts the
// wireframes and diagrams are drawn from, the page's sections, and the files a page script writes.
//   const kit = require('<this folder>/page-kit.js');
//   kit.write(outputFolder, 'photo-queue', kit.page({ ... }));
// Not app code: it runs in Node on the author's machine and builds a document, so it assembles
// HTML as text. Every label drawn in a drawing passes through escapeHtml; section prose is the
// author's own HTML.
'use strict';
const fs = require('fs');
const path = require('path');

const PAGE_CSS = fs.readFileSync(path.join(__dirname, 'page.css'), 'utf8');
// The three faces the request pages use. Google Fonts is the only font host a page may load.
const FONTS_URL = 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500'
  + '&amp;family=IBM+Plex+Sans:wght@400;600&amp;family=Saira+Condensed:wght@600;700'
  + '&amp;display=swap';
// Half the cap height of the drawings' 10 px text: added to a box's middle to centre a label.
const BASELINE_PX = 3.5;
// A diagram node's text rows, measured from the node's top.
const NODE_TITLE_Y = 16;
const NODE_FIRST_LINE_Y = 30;
const NODE_LINE_STEP = 11;
// The phone wireframe's grid, in drawing units. The phone is 240 units wide for a 390 px
// screen, so a unit is about 1.6 px. The heights are the app's own (css/app.css): the top bar
// 48 px, the control area 200 px, a label or control row 44 px, the tool row 70 px, the tab
// bar 52 px, the grabber's tab 80 × 24 px.
const PHONE = {
  height: 519,
  frameInset: 4,
  frameWidth: 232,
  frameRadius: 14,
  // The inside of the frame, which the bars and the control area span.
  left: 5,
  width: 230,
  photoLeft: 10,
  photoWidth: 220,
  centerX: 120,
  cardWidth: 56,
  cardHeight: 80,
  topBarHeight: 30,
  controlHeight: 123,
  tabBarHeight: 32,
  // Inside the control area: its side padding, and each row's top and height.
  pad: 10,
  labelRowTop: 4,
  controlRowTop: 33,
  toolRowTop: 66,
  rowHeight: 27,
  toolRowHeight: 43,
  gap: 3,
  tabWidth: 49,
  tabHeight: 15,
  toolRadius: 7,
};
// Export's control area has four rows of its own: each row's top and height.
const EXPORT_ROWS = {
  choicesTop: 4,
  readoutTop: 36,
  actionsTop: 62,
  actionsHeight: 30,
  bottomTop: 94,
  sizeWidth: 124,
};
// The six steps, as the tab bar words them.
const STEPS = ['Perspective', 'Rotate', 'Crop', 'Levels', 'Overlay', 'Export'];
// A question card over the dimmed photo.
const DIALOG = {
  left: 24,
  width: 192,
  padding: 12,
  titleY: 22,
  headerHeight: 32,
  noteHeight: 14,
  buttonHeight: 26,
  buttonStep: 32,
  cancelHeight: 26,
  // The space under the last button when there is no Cancel line.
  bottomPad: 6,
  outlinePad: 3,
};
const LEGEND = '<div class="legend"><span><i></i>New in this request</span></div>';

/* ---------- text helpers ---------- */

// Makes a label safe to place in markup.
function escapeHtml(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// One decimal place is enough for a drawing and keeps the markup short.
function rounded(value) {
  return Math.round(value * 10) / 10;
}

/* ---------- SVG parts (coordinates in the drawing's own units) ---------- */

// A rectangle. extra is raw attribute text, such as ' rx="2"'.
function rect(className, x, y, width, height, extra = '') {
  return `<rect class="${className}" x="${rounded(x)}" y="${rounded(y)}" `
    + `width="${rounded(width)}" height="${rounded(height)}"${extra}/>`;
}

// A straight line from (startX, startY) to (endX, endY).
function line(className, startX, startY, endX, endY) {
  return `<line class="${className}" x1="${rounded(startX)}" y1="${rounded(startY)}" `
    + `x2="${rounded(endX)}" y2="${rounded(endY)}"/>`;
}

// One line of text with its baseline at y. className: 'm' muted, 'a' accent, 'c' centred, …
function text(x, y, label, className = '') {
  const classAttribute = className ? ` class="${className}"` : '';
  return `<text${classAttribute} x="${rounded(x)}" y="${rounded(y)}">${escapeHtml(label)}</text>`;
}

// Several lines of text, stepPx apart.
function textLines(x, y, labels, className = '', stepPx = 12) {
  return labels.map((label, i) => text(x, y + i * stepPx, label, className)).join('');
}

// A closed shape through points: [[x, y], …].
function polygon(className, points) {
  const list = points.map(point => point.map(rounded).join(',')).join(' ');
  return `<polygon class="${className}" points="${list}"/>`;
}

// A circle centred on (x, y).
function circle(className, x, y, radius) {
  return `<circle class="${className}" cx="${rounded(x)}" cy="${rounded(y)}" r="${radius}"/>`;
}

// A button with its label centred. isAccent draws the app's red primary button.
function button(x, y, width, height, label, isAccent = false) {
  return rect(isAccent ? 'btn-accent' : 'btn', x, y, width, height)
    + text(x + width / 2, y + height / 2 + BASELINE_PX, label, isAccent ? 'w c' : 'c');
}

// A diagram node: a title and up to three muted lines under it. className: 'node' (exists
// today), 'node-new' (added by the request) or 'node-mute' (context, unchanged).
function node(x, y, width, height, title, lines = [], className = 'node') {
  const titleY = lines.length ? y + NODE_TITLE_Y : y + height / 2 + BASELINE_PX;
  const centerX = x + width / 2;
  return rect(className, x, y, width, height, ' rx="2"')
    + text(centerX, titleY, title, 't c')
    + lines.map((label, i) => (
      text(centerX, y + NODE_FIRST_LINE_Y + i * NODE_LINE_STEP, label, 'm c')
    )).join('');
}

// A connector through points, with an arrowhead at its end. className: 'flow', 'flow-new' or
// 'flow-mute', matching the node classes.
function arrow(points, className = 'flow') {
  const headId = { flow: 'ah', 'flow-new': 'ahn', 'flow-mute': 'ahm' }[className];
  const list = points.map(point => point.map(rounded).join(',')).join(' ');
  return `<polyline class="${className}" points="${list}" marker-end="url(#${headId})"/>`;
}

// Wraps drawing parts in an <svg> of the given size. label is what a screen reader hears.
function drawing(width, height, label, body) {
  return `<svg class="wf" viewBox="0 0 ${width} ${height}" role="img" `
    + `aria-label="${escapeHtml(label)}">${body}</svg>`;
}

// A drawing in its bordered plate with a caption. plateClass: '' (a phone), 'wide' or 'full'
// (a diagram that may scroll sideways on a phone).
function figure(drawingHtml, caption, plateClass = '') {
  const classes = plateClass ? `plate ${plateClass}` : 'plate';
  return `<figure><div class="${classes}">${drawingHtml}</div>`
    + `<figcaption>${caption}</figcaption></figure>`;
}

// The arrowheads, defined once per page and shared by every drawing on it.
function arrowheadDefinitions() {
  const marker = (id, className) => (
    `<marker id="${id}" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" `
    + `orient="auto-start-reverse"><path class="${className}" d="M0 0 L8 4 L0 8 z"/></marker>`
  );
  return '<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">'
    + `<defs>${marker('ah', 'ahp')}${marker('ahn', 'ahp-new')}${marker('ahm', 'ahp-mute')}</defs>`
    + '</svg>';
}

/* ---------- phone wireframe parts ---------- */

// The phone's outline. height is the whole drawing's height. The bars are parts of their own,
// because the app shows none before a photo is open.
function phoneFrame(height = PHONE.height) {
  const frameHeight = height - 2 * PHONE.frameInset;
  return rect('frame', PHONE.frameInset, PHONE.frameInset, PHONE.frameWidth, frameHeight,
    ` rx="${PHONE.frameRadius}"`);
}

// Where the parts sit in a phone drawing of this height, top to bottom: the top bar, the
// photo, the control area and the tab bar. → { photoTop, photoHeight, controlTop, tabBarTop }
function phoneLayout(height = PHONE.height) {
  const photoTop = PHONE.left + PHONE.topBarHeight + 1;
  const tabBarTop = height - PHONE.left - PHONE.tabBarHeight;
  const controlTop = tabBarTop - PHONE.controlHeight;
  return { photoTop, photoHeight: controlTop - photoTop, controlTop, tabBarTop };
}

// A rounded control with its label centred. state: '' (resting), 'selected' (the solid white
// fill of a chosen mode or choice), 'on' (a switch that is on: a white ring), 'accent' (the
// red main action) or 'quiet' (greyed out). radius defaults to a full pill. isSmall draws the
// label in the small face, for a control whose words are small in the app.
function pill(x, y, width, height, label, state = '', radius = height / 2, isSmall = false) {
  const boxClass = { selected: 'btn-on', on: 'btn-ring', accent: 'btn-accent' }[state] || 'btn';
  const labelClass = { selected: 'inv c', accent: 'w c', quiet: 'm c' }[state] || 'c';
  return rect(boxClass, x, y, width, height, ` rx="${rounded(radius)}"`)
    + text(x + width / 2, y + height / 2 + BASELINE_PX, label,
      isSmall ? `${labelClass} s` : labelClass);
}

// A row of pills from x across width, sized by weight. items: [[label, state, weight], …];
// state as for pill, weight 1 when left out.
function pillRow(x, y, width, height, items, radius) {
  const room = width - PHONE.gap * (items.length - 1);
  const totalWeight = items.reduce((sum, item) => sum + (item[2] || 1), 0);
  let left = x;
  let out = '';
  for (const [label, state, weight] of items) {
    const itemWidth = room * (weight || 1) / totalWeight;
    out += pill(left, y, itemWidth, height, label, state, radius);
    left += itemWidth + PHONE.gap;
  }
  return out;
}

// A one-tap choice: every label on one pill, the chosen one filled white.
function segmented(x, y, width, height, labels, chosen) {
  const weights = labels.map(label => label.length + 2);
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  let left = x;
  let out = rect('btn', x, y, width, height, ` rx="${rounded(height / 2)}"`);
  labels.forEach((label, i) => {
    const itemWidth = width * weights[i] / totalWeight;
    const middleY = y + height / 2 + BASELINE_PX;
    if (label === chosen) {
      out += pill(left, y, itemWidth, height, label, 'selected', height / 2, true);
    } else {
      out += text(left + itemWidth / 2, middleY, label, 'c s');
    }
    left += itemWidth;
  });
  return out;
}

// The top bar: Open at the left, Undo and Redo at the right. pair: 'Front' or 'Back' draws
// Front | Back with Unpair beside it, as while a pair is open. isZoomed adds Fit, which the
// phone shows only while the photo is zoomed or panned.
function topBar({ pair = '', isZoomed = false } = {}) {
  const top = PHONE.left;
  const bottom = top + PHONE.topBarHeight;
  const middleY = top + PHONE.topBarHeight / 2 + BASELINE_PX;
  const folder = [[14, 15], [19, 15], [21, 17], [27, 17], [27, 26], [14, 26]];
  let out = line('box', PHONE.left, bottom, PHONE.left + PHONE.width, bottom)
    + polygon('flow', folder)
    + text(204, middleY, '↶', 'c')
    + text(222, middleY, '↷', 'c');
  if (pair) {
    out += segmented(60, top + 6, 72, 18, ['Front', 'Back'], pair)
      + pill(135, top + 6, 36, 18, 'Unpair');
  }
  if (isZoomed) out += pill(174, top + 6, 20, 18, 'Fit');
  return out;
}

// The photo area from y down. inner replaces the default card outline in its middle.
function photo(y, height, inner) {
  const cardLeft = PHONE.centerX - PHONE.cardWidth / 2;
  const cardTop = y + (height - PHONE.cardHeight) / 2;
  return rect('fill', PHONE.photoLeft, y, PHONE.photoWidth, height)
    + (inner || rect('card', cardLeft, cardTop, PHONE.cardWidth, PHONE.cardHeight));
}

// The tab that opens a sheet, centred on x with its bottom edge at y: an up chevron while the
// sheet is down, a pill while it is up.
function handleTab(x, y, isSheetOpen = false) {
  const left = x - PHONE.tabWidth / 2;
  const middleY = y - PHONE.tabHeight / 2;
  const mark = isSheetOpen
    ? line('flow', x - 6, middleY, x + 6, middleY)
    : `<polyline class="flow" points="${x - 5},${middleY + 2} ${x},${middleY - 2} `
      + `${x + 5},${middleY + 2}"/>`;
  return rect('panel', left, y - PHONE.tabHeight, PHONE.tabWidth, PHONE.tabHeight + 1,
    ' rx="6"') + mark;
}

// The control area's panel with its top at y, and the grabber's tab over the photo's bottom
// edge. rows is what sits in it: labelRow + controlRow + toolRow, or exportRows, or parts of
// the author's own placed with PHONE's row tops. hasGrabber: false for a step with no sheet.
function controlArea(y, rows = '', hasGrabber = true) {
  return rect('panel', PHONE.left, y, PHONE.width, PHONE.controlHeight)
    + (hasGrabber ? handleTab(PHONE.centerX, y) : '')
    + rows;
}

// The label row of the control area at y: the adjustment's name, its value, and a readout or
// a short note at the right (all optional). A status message takes this row in the app.
function labelRow(y, name, value = '', readout = '') {
  const baselineY = y + PHONE.labelRowTop + PHONE.rowHeight / 2 + BASELINE_PX;
  const left = PHONE.left + PHONE.pad;
  const right = PHONE.left + PHONE.width - PHONE.pad;
  const nameWidth = name ? name.length * 6.6 + 6 : 0;
  return (name ? text(left, baselineY, name, 't') : '')
    + (value ? text(left + nameWidth, baselineY, value, 'h') : '')
    + (readout ? text(right, baselineY, readout, 'm e') : '');
}

// The control row of the control area at y, as pills. items: [[label, state, weight], …].
function controlRow(y, items) {
  const left = PHONE.left + PHONE.pad;
  const width = PHONE.width - 2 * PHONE.pad;
  return pillRow(left, y + PHONE.controlRowTop, width, PHONE.rowHeight, items);
}

// The tool row of the control area at y. tools: [[label, state, isSwitch], …]; state
// 'selected' is the mode in use and 'on' a switch that is on. A switch carries a small On or
// Off in its corner.
function toolRow(y, tools) {
  const left = PHONE.left + PHONE.pad;
  const width = PHONE.width - 2 * PHONE.pad;
  const top = y + PHONE.toolRowTop;
  const toolWidth = (width - PHONE.gap * (tools.length - 1)) / tools.length;
  let out = '';
  tools.forEach(([label, state, isSwitch], i) => {
    const toolLeft = left + i * (toolWidth + PHONE.gap);
    const middleX = toolLeft + toolWidth / 2;
    // The label sits low in the tool, under where the app draws its icon.
    out += pill(toolLeft, top, toolWidth, PHONE.toolRowHeight, '', state, PHONE.toolRadius)
      + rect('box', middleX - 5, top + 9, 10, 10, ' rx="2"')
      + text(middleX, top + 33, label, state === 'selected' ? 'inv c s' : 'c s');
    if (isSwitch || state === 'on') {
      out += text(toolLeft + toolWidth - 4, top + 11, state === 'on' ? 'On' : 'Off', 'tab e');
    }
  });
  return out;
}

// Export's four rows in the control area at y: Size and Format, the readout (or the note
// that takes its place), Share, Download and Copy, then the bottom row. bottom: the labels of
// the last row (Add back and Corner shots; Next card once the edits are exported).
function exportRows(y, { size = '2000', format = 'JPEG', readout = '', bottom } = {}) {
  const left = PHONE.left + PHONE.pad;
  const width = PHONE.width - 2 * PHONE.pad;
  const formatLeft = left + EXPORT_ROWS.sizeWidth + 2 * PHONE.gap;
  const formatWidth = width - EXPORT_ROWS.sizeWidth - 2 * PHONE.gap;
  const choicesTop = y + EXPORT_ROWS.choicesTop;
  const sizes = ['1080', '2000', '3000', 'Original'];
  const lastRow = (bottom || ['Add back', 'Corner shots']).map(label => [label, '']);
  const actions = [['Share', 'accent', 6], ['Download', '', 6], ['Copy', '', 4]];
  return segmented(left, choicesTop, EXPORT_ROWS.sizeWidth, PHONE.rowHeight, sizes, size)
    + segmented(formatLeft, choicesTop, formatWidth, PHONE.rowHeight,
      ['JPEG', 'PNG', 'WebP'], format)
    + text(left, y + EXPORT_ROWS.readoutTop + 13, readout, 'm')
    + pillRow(left, y + EXPORT_ROWS.actionsTop, width, EXPORT_ROWS.actionsHeight, actions)
    + pillRow(left, y + EXPORT_ROWS.bottomTop, width, PHONE.rowHeight, lastRow);
}

// The six-step tab bar with its top at y. selected is the step's name as the bar words it.
function tabBar(y, selected) {
  const weights = STEPS.map(step => step.length + 3);
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  let left = PHONE.left;
  let out = line('box', PHONE.left, y, PHONE.left + PHONE.width, y);
  STEPS.forEach((step, i) => {
    const tabWidth = PHONE.width * weights[i] / totalWeight;
    const middleX = left + tabWidth / 2;
    const isSelected = step === selected;
    out += rect(isSelected ? 'btn-on' : 'box', middleX - 4, y + 6, 8, 8, ' rx="1.5"')
      + text(middleX, y + 25, step, isSelected ? 'tab sel c' : 'tab c');
    left += tabWidth;
  });
  return out;
}

// A sheet that has risen over the photo, from y to the bottom of a phone drawing of this
// height: it covers the control area and the tab bar, as the step's options sheet and the
// Corner shots sheet do. title is drawn as the sheet's heading, with × to close it; body is
// the author's rows, placed from about y + 30.
function sheet(y, title, body = '', height = PHONE.height) {
  const bottom = height - PHONE.left;
  const closeX = PHONE.left + PHONE.width - PHONE.pad - 7;
  return rect('panel', PHONE.left, y, PHONE.width, bottom - y,
    ` rx="${PHONE.frameRadius - 1}"`)
    + handleTab(PHONE.centerX, y, true)
    + text(PHONE.left + PHONE.pad, y + 19, title, 't')
    + circle('btn', closeX, y + 15, 7)
    + text(closeX, y + 15 + BASELINE_PX, '×', 'c')
    + body;
}

// Dims everything inside the phone frame, as the app does behind a question card.
function scrim(height) {
  const inset = PHONE.frameInset + 1;
  return rect('scrim', inset, inset, PHONE.frameWidth - 2, height - 2 * inset,
    ` rx="${PHONE.frameRadius - 1}"`);
}

// A question card with its top at y: a title, an optional muted note, stacked buttons (the
// first is the red one) and a text Cancel (pass cancelLabel '' for none). Outlined as new.
function dialog(y, title, buttons, note = '', cancelLabel = 'Cancel') {
  const noteHeight = note ? DIALOG.noteHeight : 0;
  const buttonsTop = y + DIALOG.headerHeight + noteHeight;
  const buttonsHeight = buttons.length * DIALOG.buttonStep;
  const cancelHeight = cancelLabel ? DIALOG.cancelHeight : DIALOG.bottomPad;
  const height = DIALOG.headerHeight + noteHeight + buttonsHeight + cancelHeight;
  const innerLeft = DIALOG.left + DIALOG.padding;
  const innerWidth = DIALOG.width - 2 * DIALOG.padding;
  let out = rect('card', DIALOG.left, y, DIALOG.width, height)
    + rect('new', DIALOG.left - DIALOG.outlinePad, y - DIALOG.outlinePad,
      DIALOG.width + 2 * DIALOG.outlinePad, height + 2 * DIALOG.outlinePad)
    + text(innerLeft, y + DIALOG.titleY, title, 'h');
  if (note) out += text(innerLeft, y + DIALOG.titleY + DIALOG.noteHeight, note, 'm');
  buttons.forEach((label, i) => {
    const top = buttonsTop + i * DIALOG.buttonStep;
    out += button(innerLeft, top, innerWidth, DIALOG.buttonHeight, label, i === 0);
  });
  if (cancelLabel) {
    const cancelY = buttonsTop + buttonsHeight + DIALOG.padding;
    out += text(DIALOG.left + DIALOG.width / 2, cancelY, cancelLabel, 'c m');
  }
  return out;
}

/* ---------- page parts ---------- */

// The Impact grid. rows: [[key, html], …].
function impact(rows) {
  const cells = rows.map(([key, value]) => `<div class="k">${key}</div><div>${value}</div>`);
  return `<div class="impact">${cells.join('')}</div>`;
}

// The numbered acceptance criteria. rows: [[boldLead, html, optionalTag], …]; AC numbers are
// the rows' positions, so a removed criterion stays as a row saying so.
function criteria(rows) {
  const items = rows.map(([lead, body, tag], i) => {
    const tagHtml = tag ? `<span class="tag">${tag}</span>` : '';
    return `<li><span class="id">AC${i + 1}</span>`
      + `<span><b>${lead}</b> ${body}${tagHtml}</span></li>`;
  });
  return `<ol class="acs">${items.join('')}</ol>`;
}

// A table. kind: 'ids' styles the first column as case IDs, 'decisions' bolds it.
function table(head, rows, kind = '') {
  const cellHtml = (cell, i) => (
    i === 0 && kind === 'ids' ? `<td class="id">${cell}</td>` : `<td>${cell}</td>`
  );
  const tableClass = kind === 'decisions' ? ' class="decisions"' : '';
  return `<div class="table-wrap"><table${tableClass}><thead><tr>`
    + head.map(label => `<th>${label}</th>`).join('')
    + '</tr></thead><tbody>'
    + rows.map(row => `<tr>${row.map(cellHtml).join('')}</tr>`).join('')
    + '</tbody></table></div>';
}

// A bulleted or numbered list of html items.
function list(items, isOrdered = false, className = '') {
  const tagName = isOrdered ? 'ol' : 'ul';
  const classAttribute = className ? ` class="${className}"` : '';
  const itemsHtml = items.map(item => `<li>${item}</li>`).join('');
  return `<${tagName}${classAttribute}>${itemsHtml}</${tagName}>`;
}

/**
 * page({ title, eyebrow, heading, lede, chips, sections, footer }) → the page's HTML, ready to
 * publish as an Artifact (no doctype or <html>; the publisher adds them). chips[0] is the status
 * chip. sections: [[name, html], …], numbered in order. footer names the request's .md file.
 */
function page({ title, eyebrow, heading, lede, chips, sections, footer }) {
  const sectionsHtml = sections.map(([name, html], i) => {
    const number = String(i + 1).padStart(2, '0');
    return `<section>\n<h2><span class="num">${number}</span>${name}</h2>\n${html}\n</section>`;
  }).join('\n\n');
  const chipsHtml = chips.map((chip, i) => (
    `<span class="chip${i === 0 ? ' status' : ''}">${chip}</span>`
  )).join('');
  return [
    `<title>${title}</title>`,
    '<meta name="claude:viewport-fit-sides" content="cover">',
    `<link rel="stylesheet" href="${FONTS_URL}">`,
    `<style>\n${PAGE_CSS}</style>`,
    arrowheadDefinitions(),
    '<div class="page">',
    '<header class="top">',
    `<div class="eyebrow">P1Hunt Card Finisher · ${eyebrow}</div>`,
    `<h1>${heading}</h1>`,
    `<p class="lede">${lede}</p>`,
    `<div class="meta">${chipsHtml}</div>`,
    '</header>',
    '',
    sectionsHtml,
    '',
    `<footer>${footer} · P1Hunt/feature-requests</footer>`,
    '</div>',
    '',
  ].join('\n');
}

// A dark-theme sheet of the page's figures, two to a row, for the one look before publishing.
function figureSheet(html) {
  const figures = html.match(/<figure>[\s\S]*?<\/figure>/g) || [];
  const head = html.slice(0, html.indexOf('<div class="page">'));
  const placed = figures.map(figureHtml => (
    figureHtml.includes('plate full')
      ? figureHtml.replace('<figure>', '<figure style="grid-column:1/-1">')
      : figureHtml
  ));
  return '<!doctype html><html data-theme="dark"><head><meta charset="utf-8"></head><body>'
    + head
    + '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));'
    + 'gap:16px;padding:16px">'
    + placed.join('')
    + '</div></body></html>';
}

// Writes <name>.html (the page to publish) and figures-<name>.html (its figure sheet) into
// folder, and prints the page's size.
function write(folder, name, html) {
  fs.writeFileSync(path.join(folder, `${name}.html`), html);
  fs.writeFileSync(path.join(folder, `figures-${name}.html`), figureSheet(html));
  const figureCount = (html.match(/<figure>/g) || []).length;
  console.log(`${name}: ${(html.length / 1024).toFixed(1)} KB, ${figureCount} figures`);
}

module.exports = {
  PHONE,
  EXPORT_ROWS,
  STEPS,
  LEGEND,
  escapeHtml,
  rect,
  line,
  text,
  textLines,
  polygon,
  circle,
  button,
  node,
  arrow,
  drawing,
  figure,
  phoneFrame,
  phoneLayout,
  pill,
  pillRow,
  segmented,
  topBar,
  photo,
  handleTab,
  controlArea,
  labelRow,
  controlRow,
  toolRow,
  exportRows,
  tabBar,
  sheet,
  scrim,
  dialog,
  impact,
  criteria,
  table,
  list,
  page,
  write,
};
