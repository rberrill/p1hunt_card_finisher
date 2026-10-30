// Sets CONFIG.appVersion in js/config.js and every ?v= asset link in index.html to one version.
//   node .claude/skills/release/set-version.js 1.7.0        (or 1.8.0-dev, 1.8.0-dev.2)
// A dev build's number goes up whenever a changed build goes to the phone, so every ?v= changes
// and the browser can't mix cached files with new ones.
'use strict';
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../..');
const version = process.argv[2];
if (!/^\d+\.\d+\.\d+(-dev(\.\d+)?)?$/.test(version || '')) {
  console.error('Usage: set-version.js X.Y.Z, X.Y.Z-dev or X.Y.Z-dev.N');
  process.exit(1);
}

// Replaces every match of `pattern` in a repository file; stops if there are none.
function replaceIn(file, pattern, replacement) {
  const filePath = path.join(root, file);
  const source = fs.readFileSync(filePath, 'utf8');
  const count = (source.match(pattern) || []).length;
  if (!count) {
    console.error(`${file}: nothing to change`);
    process.exit(1);
  }
  fs.writeFileSync(filePath, source.replace(pattern, replacement));
  console.log(`${file}: ${count} change${count > 1 ? 's' : ''}`);
}

replaceIn('js/config.js', /(appVersion:\s*')[^']+(')/g, `$1${version}$2`);
replaceIn('index.html', /((?:href|src)="[^"]+\.(?:css|js))\?v=[^"]*"/g, `$1?v=${version}"`);
console.log(`Version ${version}. Run node tests/selftest.js to confirm.`);
