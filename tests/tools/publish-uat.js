// Puts the current build on the UAT site: copies the files the app serves (index.html, css/,
// js/, icons/) into a local checkout of the UAT repository and commits them as one commit
// named for the version and the commit they came from. It does not push; the push is a
// separate step.
//   node tests/tools/publish-uat.js
// The UAT repository is p1hunt_card_finisher_uat, checked out beside this one. Its Pages site
// serves test builds over HTTPS, so a phone can run the cases that need a secure page before
// a release. The copy is byte for byte: nothing is built or changed.
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, '../..');
const UAT_REPOSITORY = 'p1hunt_card_finisher_uat';
const uatDir = path.resolve(root, '..', UAT_REPOSITORY);
// What the app serves. Tests, samples, docs and Claude's files are not part of a test build.
const APP_FILES = ['index.html', 'css', 'js', 'icons'];
// The licence travels with every copy of the code.
const LICENSE_FILE = 'LICENSE';
// Files the UAT repository keeps between builds.
const KEPT = new Set(['.git', 'README.md', '.nojekyll']);

const README = [
  '# Card Finisher: test builds',
  '',
  'This repository holds unreleased test builds of P1Hunt Card Finisher. Its site is for',
  'testing only and changes without notice.',
  '',
  'The app, its source and its releases are at',
  'https://github.com/rberrill/p1hunt_card_finisher, and the released app is at',
  'https://rberrill.github.io/p1hunt_card_finisher/.',
  '',
].join('\n');

// Runs git in a folder and returns its trimmed output.
function git(folder, args) {
  return execFileSync('git', args, { cwd: folder, encoding: 'utf8' }).trim();
}

// Stops with a message the person can act on.
function stop(message) {
  console.error(message);
  process.exit(1);
}

// The build being published: its version and the commit of this repository it comes from.
function currentBuild() {
  const config = fs.readFileSync(path.join(root, 'js/config.js'), 'utf8');
  const version = (config.match(/appVersion:\s*'([^']+)'/) || [])[1];
  const changed = git(root, ['status', '--porcelain', '--', ...APP_FILES]);
  if (changed) stop(`Commit the app's files first; these differ from the last commit:\n${changed}`);
  return { version, commit: git(root, ['rev-parse', '--short', 'HEAD']) };
}

// Replaces the UAT checkout's contents with the app's files.
function copyBuild() {
  for (const name of fs.readdirSync(uatDir)) {
    if (!KEPT.has(name)) fs.rmSync(path.join(uatDir, name), { recursive: true, force: true });
  }
  for (const name of APP_FILES) {
    fs.cpSync(path.join(root, name), path.join(uatDir, name), { recursive: true });
  }
  fs.copyFileSync(path.join(root, LICENSE_FILE), path.join(uatDir, LICENSE_FILE));
  fs.writeFileSync(path.join(uatDir, 'README.md'), README);
  // Tells GitHub Pages to serve the files as they are, without its site builder.
  fs.writeFileSync(path.join(uatDir, '.nojekyll'), '');
}

if (!fs.existsSync(path.join(uatDir, '.git'))) {
  stop(`No checkout of the UAT repository at ../${UAT_REPOSITORY}. Clone it there first.`);
}
const build = currentBuild();
copyBuild();
git(uatDir, ['add', '--all']);
if (!git(uatDir, ['status', '--porcelain'])) {
  console.log(`The UAT checkout already holds ${build.version} (${build.commit}).`);
  process.exit(0);
}
git(uatDir, ['commit', '--quiet', '-m', `${build.version} from main ${build.commit}`]);
console.log(`Committed ${build.version} from main ${build.commit} in ../${UAT_REPOSITORY}.`);
console.log('Push it to publish: git push origin main (in that folder).');
