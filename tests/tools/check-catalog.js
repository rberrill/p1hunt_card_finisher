// Checks the catalog (tests/catalog/) against its own rules and against the code:
// every entry is well formed, every ID is unique and sits in its area's file, every anchor
// exists in the code, and every automated case has exactly one test.
//   node tests/tools/check-catalog.js          prints the problems and the coverage
// tests/selftest.js runs the same checks. The format is described in tests/catalog/README.md.
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Each area's code and its file, as in the README's table.
const AREAS = {
  STA: 'start-and-session.md',
  TOP: 'top-bar-and-navigation.md',
  VIEW: 'photo-view.md',
  PER: 'perspective.md',
  ROT: 'rotate.md',
  CRP: 'crop.md',
  LEV: 'levels.md',
  OVL: 'overlay.md',
  EXP: 'export.md',
  CNR: 'corner-shots.md',
  UPS: 'upscale-question.md',
  QCD: 'question-cards.md',
  PAIR: 'front-and-back.md',
  EDT: 'edits-files.md',
  DND: 'drop-and-paste.md',
  KEY: 'keyboard.md',
  MSG: 'messages.md',
  STO: 'storage-and-settings.md',
  DEV: 'links-and-developer.md',
  SEC: 'security.md',
  LAY: 'layout.md',
  PERF: 'speed.md',
  FLOW: 'journeys.md',
};
const REQUIRED_FIELDS = [
  'Risk', 'Check', 'Layout', 'Added', 'Changed', 'Anchors', 'Source', 'Cases',
];
const RISKS = ['high', 'medium', 'low'];
const CHECK_KINDS = ['script', 'touch', 'saved file', 'source', 'eye', 'phone'];
const ENTRY_HEADING = /^## ([A-Z]+-\d+) (.+)$/;
const CASE_HEADING = /^### ([A-Z]+-\d+\.\d+) (.+?)\s+\[(auto: [a-z, ]+|eye|phone)\]\s*$/;
const FIELD_LINE = /^- ([A-Z][a-z]+): (.*)$/;
// A test's title starts with its case ID: test('ROT-04.1 A typed angle…', …).
const TEST_TITLE = /\btest\(\s*['"`]([A-Z]+-\d+(?:\.\d+)?[a-z]?)\b/g;
// The trial cases that proved the tooling have no catalog entry; they go when real cases land.
const TRIAL_PREFIX = 'SPK-';

// Every file under a folder with one of the given extensions, as full paths.
function filesUnder(folder, extensions) {
  if (!fs.existsSync(folder)) return [];
  return fs.readdirSync(folder, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(folder, entry.name);
    if (entry.isDirectory()) return filesUnder(file, extensions);
    return extensions.includes(path.extname(entry.name)) ? [file] : [];
  });
}

// Reads one catalog file into its entries: { id, name, file, fields, cases }.
function readEntries(file) {
  const entries = [];
  let entry = null;
  let isInCode = false;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (line.startsWith('```')) isInCode = !isInCode;
    if (isInCode) continue;
    const heading = line.match(ENTRY_HEADING);
    const caseHeading = line.match(CASE_HEADING);
    const field = line.match(FIELD_LINE);
    if (heading) {
      const name = path.basename(file);
      entry = { id: heading[1], name: heading[2], file: name, fields: {}, cases: [] };
      entries.push(entry);
    } else if (caseHeading && entry) {
      entry.cases.push({ id: caseHeading[1], title: caseHeading[2], mark: caseHeading[3] });
    } else if (field && entry && !entry.cases.length) {
      entry.fields[field[1]] = field[2].trim();
    }
  }
  return entries;
}

// The anchors written in an entry's Anchors field: `code spans` and "quoted text".
function anchorsOf(entry) {
  const text = entry.fields.Anchors || '';
  const spans = [...text.matchAll(/`([^`]+)`/g)].map(match => match[1]);
  const quoted = [...text.replace(/`[^`]*`/g, '').matchAll(/"([^"]+)"/g)].map(match => match[1]);
  return { spans, quoted };
}

// What the code holds, read once: the app's text, its settings and its stylesheet.
function readCode(root) {
  const scripts = filesUnder(path.join(root, 'js'), ['.js'])
    .map(file => fs.readFileSync(file, 'utf8'))
    .join('\n');
  const markup = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const styles = fs.readFileSync(path.join(root, 'css/app.css'), 'utf8');
  const context = {};
  const config = fs.readFileSync(path.join(root, 'js/config.js'), 'utf8');
  vm.runInNewContext(`${config};this.CONFIG = CONFIG;`, context);
  return { scripts, markup, styles, config: context.CONFIG };
}

// True when a CONFIG.a.b anchor names a key that exists.
function hasSetting(config, dottedName) {
  let value = config;
  for (const key of dottedName.split('.').slice(1)) {
    if (value === null || typeof value !== 'object' || !(key in value)) return false;
    value = value[key];
  }
  return true;
}

// True when a code-span anchor exists in the code. kind is read from how it is written.
function spanExists(code, span) {
  const everything = `${code.scripts}\n${code.markup}\n${code.styles}`;
  if (span.startsWith('#')) {
    const id = span.slice(1);
    return new RegExp(`['"\`]${id}['"\`]|id="${id}"`).test(`${code.scripts}\n${code.markup}`);
  }
  if (span.startsWith('CONFIG.')) return hasSetting(code.config, span);
  if (span.startsWith('key:')) {
    const key = span.slice('key:'.length);
    return new RegExp(`['"\`]${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"\`]`, 'i')
      .test(code.scripts);
  }
  if (span.startsWith('.')) return everything.includes(span.slice(1));
  return everything.includes(span);
}

// The problems with one entry's own fields.
function fieldProblems(entry) {
  const problems = [];
  const where = `${entry.id} (${entry.file})`;
  for (const name of REQUIRED_FIELDS) {
    if (!entry.fields[name]) problems.push(`${where}: no ${name} field`);
  }
  if (entry.fields.Risk && !RISKS.includes(entry.fields.Risk)) {
    problems.push(`${where}: Risk is "${entry.fields.Risk}"`);
  }
  const kinds = (entry.fields.Check || '').split(/[.;(]/)[0].split(',').map(kind => kind.trim());
  if (entry.fields.Check && !kinds.every(kind => CHECK_KINDS.includes(kind))) {
    problems.push(`${where}: Check is "${entry.fields.Check}"`);
  }
  const area = entry.id.split('-')[0];
  if (AREAS[area] !== entry.file) problems.push(`${where}: this ID belongs in ${AREAS[area]}`);
  return problems;
}

// The problems with one entry's anchors: each must exist in the code.
function anchorProblems(entry, code) {
  const { spans, quoted } = anchorsOf(entry);
  const everything = `${code.scripts}\n${code.markup}\n${code.styles}`;
  const missingSpans = spans.filter(span => !spanExists(code, span));
  const missingText = quoted.filter(text => !everything.includes(text));
  return [...missingSpans, ...missingText]
    .map(anchor => `${entry.id}: anchor not found in the code: ${anchor}`);
}

// The problems between cases and tests: one test for each automated case, no test without one.
function testProblems(entries, root) {
  const titles = filesUnder(path.join(root, 'tests/automation'), ['.js'])
    .flatMap(file => [...fs.readFileSync(file, 'utf8').matchAll(TEST_TITLE)])
    .map(match => match[1])
    .filter(id => !id.startsWith(TRIAL_PREFIX));
  const cases = entries.flatMap(entry => entry.cases);
  const automated = cases
    .filter(testCase => testCase.mark !== 'phone')
    .map(testCase => testCase.id);
  const problems = [];
  for (const id of automated) {
    const count = titles.filter(title => title === id).length;
    if (count !== 1) problems.push(`${id}: ${count} tests have this ID; there must be one`);
  }
  for (const title of titles) {
    if (!cases.some(testCase => testCase.id === title)) {
      problems.push(`${title}: a test with no case in the catalog`);
    }
  }
  return problems;
}

// Runs every check. Returns the problems and the coverage counts.
function checkCatalog(root) {
  const folder = path.join(root, 'tests/catalog');
  const entries = Object.values(AREAS)
    .map(name => path.join(folder, name))
    .filter(file => fs.existsSync(file))
    .flatMap(readEntries);
  const code = readCode(root);
  const seen = new Set();
  const duplicates = [];
  for (const entry of entries) {
    if (seen.has(entry.id)) duplicates.push(`${entry.id}: this ID is used twice`);
    seen.add(entry.id);
  }
  const problems = [
    ...duplicates,
    ...entries.flatMap(fieldProblems),
    ...entries.flatMap(entry => anchorProblems(entry, code)),
    ...testProblems(entries, root),
  ];
  const covered = entries.filter(entry => entry.cases.length).length;
  return { problems, entries: entries.length, covered };
}

if (require.main === module) {
  const result = checkCatalog(path.resolve(__dirname, '../..'));
  for (const problem of result.problems) console.log(`FAIL  ${problem}`);
  console.log(`\n${result.entries} capabilities, ${result.covered} with at least one case, `
    + `${result.problems.length} problems`);
  process.exit(result.problems.length ? 1 : 0);
}

module.exports = { checkCatalog };
