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
// The phone wireframe's grid, in drawing units. The phone is 240 units wide, as on the first
// request pages; a real 192 px control area is about 118 units at this scale.
const PHONE = {
  frameInset: 4,
  frameWidth: 232,
  frameRadius: 14,
  photoLeft: 10,
  photoWidth: 220,
  controlLeft: 14,
  controlWidth: 212,
  centerX: 120,
  cardWidth: 56,
  cardHeight: 80,
  rowHeight: 22,
  barHeight: 28,
  gap: 6,
};
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
// The Export step's action bar: [label, is it red, relative width].
const EXPORT_BAR = [['Export ▾', false, 64], ['Share', true, 66], ['Download', true, 70]];
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

// The phone's outline and the app header. height is the whole drawing's height.
function phoneFrame(height) {
  const frameHeight = height - 2 * PHONE.frameInset;
  return rect('frame', PHONE.frameInset, PHONE.frameInset, PHONE.frameWidth, frameHeight,
    ` rx="${PHONE.frameRadius}"`)
    + text(16, 30, 'P1', 'a')
    + text(34, 30, 'CARD FINISHER', 'h')
    + text(196, 30, '↶')
    + text(214, 30, '↷');
}

// The photo area from y down. inner replaces the default card outline in its middle.
function photo(y, height, inner) {
  const cardLeft = PHONE.centerX - PHONE.cardWidth / 2;
  const cardTop = y + (height - PHONE.cardHeight) / 2;
  return rect('fill', PHONE.photoLeft, y, PHONE.photoWidth, height)
    + (inner || rect('card', cardLeft, cardTop, PHONE.cardWidth, PHONE.cardHeight));
}

// The Export step's Format and Size dropdowns.
function selects(y) {
  const labelY = y + PHONE.rowHeight / 2 + BASELINE_PX;
  return rect('btn', 14, y, 102, PHONE.rowHeight)
    + text(22, labelY, 'JPEG ▾')
    + rect('btn', 122, y, 104, PHONE.rowHeight)
    + text(130, labelY, '2000 px ▾');
}

// The full-width More options bar: red with the chevron up when open.
function moreBar(y, isOpen, height = PHONE.rowHeight) {
  const labelY = y + height / 2 + BASELINE_PX;
  const labelClass = isOpen ? 'w' : '';
  return rect(isOpen ? 'btn-accent' : 'btn', PHONE.controlLeft, y, PHONE.controlWidth, height)
    + text(22, labelY, 'More options', labelClass)
    + text(212, labelY, isOpen ? '▴' : '▾', labelClass);
}

// The action bar at y, under a divider. items: [[label, isAccent, relativeWidth], …].
function actionBar(y, items) {
  const room = PHONE.controlWidth - PHONE.gap * (items.length - 1);
  const totalWeight = items.reduce((sum, item) => sum + item[2], 0);
  const dividerY = y - 8;
  const photoRight = PHONE.photoLeft + PHONE.photoWidth;
  let x = PHONE.controlLeft;
  let out = line('box', PHONE.photoLeft, dividerY, photoRight, dividerY);
  for (const [label, isAccent, weight] of items) {
    const width = room * weight / totalWeight;
    out += button(x, y, width, PHONE.barHeight, label, isAccent);
    x += width + PHONE.gap;
  }
  return out;
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
  EXPORT_BAR,
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
  photo,
  selects,
  moreBar,
  actionBar,
  scrim,
  dialog,
  impact,
  criteria,
  table,
  list,
  page,
  write,
};
