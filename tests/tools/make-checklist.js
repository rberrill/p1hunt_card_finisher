// Writes the phone checklist for the build being tested: tests/checklists/<version>_<commit>.md.
//   node tests/tools/make-checklist.js          Part A: what changed since the last checklist
//   node tests/tools/make-checklist.js --all    Part A: every phone case in the catalog
// Part A is generated, never written from memory: it holds the [phone] cases of every
// capability whose catalog entry was added or changed since the last checklist was committed.
// Part B is the fixed main flow: the journeys in tests/catalog/journeys.md.
// The first checklist, or one made with --all, holds every phone case.
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, '../..');
const catalogDir = path.join(root, 'tests/catalog');
const checklistDir = path.join(root, 'tests/checklists');
const JOURNEYS = 'journeys.md';
// Catalog files that hold no capabilities.
const NOT_AREAS = new Set(['README.md', 'rulings.md', 'wording.md', 'retired.md']);
const ENTRY_HEADING = /^## ([A-Z]+-\d+) (.+)$/;
const CASE_HEADING = /^### ([A-Z]+-\d+\.\d+) (.+?)\s+\[([^\]]+)\]\s*$/;
const RESULT_LINE = 'Result: ☐ pass   ☐ fail   Failed at row: ____   What happened:';

// Runs git in the repository and returns its trimmed output, or '' when it fails.
function git(args) {
  try {
    return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
  } catch (error) {
    return '';
  }
}

// Splits a catalog file's text into its entries: { id, name, text, cases: [{ id, mark, text }] }.
function readEntries(text) {
  const entries = [];
  let entry = null;
  let testCase = null;
  for (const line of text.split(/\r?\n/)) {
    const heading = line.match(ENTRY_HEADING);
    const caseHeading = line.match(CASE_HEADING);
    if (heading) {
      entry = { id: heading[1], name: heading[2], lines: [], cases: [] };
      entries.push(entry);
      testCase = null;
    } else if (caseHeading && entry) {
      testCase = { id: caseHeading[1], mark: caseHeading[3], lines: [] };
      entry.cases.push(testCase);
    }
    if (entry) entry.lines.push(line);
    if (testCase) testCase.lines.push(line);
  }
  return entries.map(item => ({
    id: item.id,
    name: item.name,
    text: item.lines.join('\n').trim(),
    cases: item.cases.map(one => ({ ...one, text: one.lines.join('\n').trim() })),
  }));
}

// The catalog's area files, by name.
function areaFiles() {
  return fs.readdirSync(catalogDir)
    .filter(name => name.endsWith('.md') && !NOT_AREAS.has(name))
    .sort();
}

// The commit of the last checklist, or '' when there is none.
function lastChecklistCommit() {
  return git(['log', '-1', '--format=%H', '--', 'tests/checklists']);
}

// Each entry's text as it was at a commit, by ID. Empty when the file did not exist then.
function entriesAt(commit, name) {
  const text = git(['show', `${commit}:tests/catalog/${name}`]);
  return new Map(readEntries(text).map(entry => [entry.id, entry.text]));
}

// The entries of one area file that are new or changed since a commit; all when commit is ''.
function changedEntries(name, commit) {
  const entries = readEntries(fs.readFileSync(path.join(catalogDir, name), 'utf8'));
  if (!commit) return entries;
  const before = entriesAt(commit, name);
  return entries.filter(entry => before.get(entry.id) !== entry.text);
}

// One case as it appears in the checklist: its text, then a line for the result.
function caseBlock(testCase) {
  return `${testCase.text.replace(/^### /, '#### ')}\n\n${RESULT_LINE}\n`;
}

// The phone cases of a list of entries, as checklist text, with a count.
function phoneCases(entries) {
  const cases = entries.flatMap(entry => entry.cases.filter(one => one.mark === 'phone'));
  return { count: cases.length, text: cases.map(caseBlock).join('\n') };
}

// What is being tested: the version and the short commit.
function buildInfo() {
  const config = fs.readFileSync(path.join(root, 'js/config.js'), 'utf8');
  const version = (config.match(/appVersion:\s*'([^']+)'/) || [])[1];
  return { version, commit: git(['rev-parse', '--short', 'HEAD']) };
}

// The whole checklist's text.
function checklistText(build, since, partA, changedIds, partB) {
  const sinceText = since
    ? `capabilities added or changed since the last checklist (commit ${since.slice(0, 7)})`
    : 'every phone case in the catalog';
  return [
    `# Phone checklist: ${build.version}, commit ${build.commit}`,
    '',
    'Run on a real iPhone, on the test site: https://rberrill.github.io/p1hunt_card_finisher_uat/',
    '',
    '**First, the right build.** Open the site, open a photo, tap **Export**, tap the small',
    'tab with an up arrow above the controls, and read the line near the end of the panel:',
    `it must read **Card Finisher ${build.version}**. If it doesn't, stop: the site holds`,
    'another build.',
    '',
    '| Tester | Date | iPhone and iOS version |',
    '| --- | --- | --- |',
    '| | | |',
    '',
    `## Part A: new and changed (${partA.count} cases)`,
    '',
    `The phone cases of ${sinceText}.`,
    changedIds.length ? `Changed capabilities: ${changedIds.join(', ')}.` : '',
    '',
    partA.count ? partA.text : 'Nothing changed that needs a phone.',
    '',
    `## Part B: the main flow (${partB.count} cases)`,
    '',
    partB.text,
    '',
    '## Result',
    '',
    '☐ Pass: every case passed   ☐ Fail: list the failed cases here',
    '',
  ].join('\n');
}

const isAll = process.argv.includes('--all');
const since = isAll ? '' : lastChecklistCommit();
const changed = areaFiles()
  .filter(name => name !== JOURNEYS)
  .flatMap(name => changedEntries(name, since));
const journeys = readEntries(fs.readFileSync(path.join(catalogDir, JOURNEYS), 'utf8'));
const build = buildInfo();
const changedIds = since ? changed.map(entry => entry.id) : [];
const text = checklistText(build, since, phoneCases(changed), changedIds, phoneCases(journeys));
fs.mkdirSync(checklistDir, { recursive: true });
const file = path.join(checklistDir, `${build.version}_${build.commit}.md`);
fs.writeFileSync(file, text);
console.log(`Wrote ${path.relative(root, file)}`);
