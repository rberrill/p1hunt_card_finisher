// SessionStart hook: prints where the project stands, so no one has to keep it by hand. The output is
// added to Claude's context: branch, last release tag, appVersion, uncommitted files, and the CHANGELOG's
// Unreleased section.
'use strict';
const { execFileSync } = require('child_process');
const fs = require('fs'), path = require('path');

const root = path.resolve(__dirname, '../..');
const git = (...args) => { try { return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).replace(/\s+$/, ''); } catch (e) { return ''; } };
const read = f => { try { return fs.readFileSync(path.join(root, f), 'utf8'); } catch (e) { return ''; } };

const version = (read('js/config.js').match(/appVersion:\s*'([^']+)'/) || [])[1] || '?';
const changelog = read('CHANGELOG.md');
const m = changelog.match(/^## \[([^\]]+)\] - Unreleased\s*\n([\s\S]*?)(?=^## \[)/m);
const dirty = git('status', '--porcelain').split('\n').filter(Boolean);

console.log([
  `Project state (from git and CHANGELOG):`,
  `- Branch: ${git('rev-parse', '--abbrev-ref', 'HEAD') || '?'}; last release tag: ${git('describe', '--tags', '--abbrev=0') || 'none'}; appVersion: ${version}`,
  `- Uncommitted files: ${dirty.length ? dirty.length + ' (' + dirty.slice(0, 6).map(l => l.slice(3)).join(', ') + (dirty.length > 6 ? ', …' : '') + ')' : 'none'}`,
  m ? `- CHANGELOG [${m[1]}] - Unreleased: ${m[2].trim() ? '\n' + m[2].trim() : 'nothing yet'}` : '- CHANGELOG: no Unreleased section',
].join('\n'));
