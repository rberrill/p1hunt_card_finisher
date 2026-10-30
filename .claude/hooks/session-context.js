// SessionStart hook: prints where the project stands, so no one has to keep it by hand. The
// output is added to Claude's context: the branch, the last release tag, appVersion, uncommitted
// files, and the CHANGELOG's Unreleased section.
'use strict';
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');

// A git command's output, trimmed, or '' if it fails.
function git(...args) {
  try {
    return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).replace(/\s+$/, '');
  } catch (error) {
    return '';
  }
}

function read(file) {
  try {
    return fs.readFileSync(path.join(root, file), 'utf8');
  } catch (error) {
    return '';
  }
}

const version = (read('js/config.js').match(/appVersion:\s*'([^']+)'/) || [])[1] || '?';
// The CHANGELOG's Unreleased heading → [version] and its notes, up to the next version heading.
const UNRELEASED = /^## \[([^\]]+)\] - Unreleased\s*\n([\s\S]*?)(?=^## \[)/m;
const unreleased = read('CHANGELOG.md').match(UNRELEASED);
const dirtyFiles = git('status', '--porcelain')
  .split('\n')
  .filter(Boolean)
  .map(line => line.slice(3));

const branch = git('rev-parse', '--abbrev-ref', 'HEAD') || '?';
const lastTag = git('describe', '--tags', '--abbrev=0') || 'none';
const shownFiles = dirtyFiles.slice(0, 6).join(', ') + (dirtyFiles.length > 6 ? ', …' : '');
const uncommitted = dirtyFiles.length ? `${dirtyFiles.length} (${shownFiles})` : 'none';
let changelog = '- CHANGELOG: no Unreleased section';
if (unreleased) {
  const notes = unreleased[2].trim();
  const body = notes ? '\n' + notes : 'nothing yet';
  changelog = `- CHANGELOG [${unreleased[1]}] - Unreleased: ${body}`;
}

console.log([
  'Project state (from git and CHANGELOG):',
  `- Branch: ${branch}; last release tag: ${lastTag}; appVersion: ${version}`,
  `- Uncommitted files: ${uncommitted}`,
  changelog,
].join('\n'));
