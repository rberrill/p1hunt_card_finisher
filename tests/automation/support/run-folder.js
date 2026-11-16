// Names this run's folder: tests/runs/<date>_<time>_<version>_<commit>[-dirty].
// Playwright loads the configuration once in the main process and again in every worker, so
// the name is worked out once and handed on through the environment.
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ENVIRONMENT_KEY = 'CARD_FINISHER_RUN_DIR';

// Runs a git command in the repository and returns its trimmed output, or '' if it fails.
function git(root, args) {
  try {
    return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
  } catch (error) {
    return '';
  }
}

// The app's version, read from js/config.js.
function appVersion(root) {
  const config = fs.readFileSync(path.join(root, 'js/config.js'), 'utf8');
  return (config.match(/appVersion:\s*'([^']+)'/) || [])[1] || 'unknown';
}

// What was tested: the version, the short commit, and whether the files differ from it.
function buildInfo(root) {
  const commit = git(root, ['rev-parse', '--short', 'HEAD']) || 'nocommit';
  const isDirty = git(root, ['status', '--porcelain', '--', 'js', 'css', 'index.html']) !== '';
  return { version: appVersion(root), commit, isDirty };
}

// A sortable local time stamp: 2026-11-16_143205.
function timeStamp(date) {
  const pad = number => String(number).padStart(2, '0');
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  return `${day}_${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

// This run's folder, the same in the main process and in every worker.
function runFolder(root) {
  if (process.env[ENVIRONMENT_KEY]) return process.env[ENVIRONMENT_KEY];
  const { version, commit, isDirty } = buildInfo(root);
  const name = `${timeStamp(new Date())}_${version}_${commit}${isDirty ? '-dirty' : ''}`;
  const folder = path.join(root, 'tests', 'runs', name);
  process.env[ENVIRONMENT_KEY] = folder;
  return folder;
}

module.exports = { runFolder, buildInfo };
