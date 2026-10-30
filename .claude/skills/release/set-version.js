// Sets CONFIG.appVersion in js/config.js and every ?v= asset link in index.html to one version.
//   node .claude/skills/release/set-version.js 1.7.0        (or 1.8.0-dev)
'use strict';
const fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '../../..');
const v = process.argv[2];
if (!/^\d+\.\d+\.\d+(-dev)?$/.test(v || '')) { console.error('Usage: set-version.js X.Y.Z or X.Y.Z-dev'); process.exit(1); }

const edit = (file, re, to) => {
  const p = path.join(root, file), src = fs.readFileSync(p, 'utf8');
  const n = (src.match(re) || []).length;
  if (!n) { console.error(`${file}: nothing to change`); process.exit(1); }
  fs.writeFileSync(p, src.replace(re, to));
  console.log(`${file}: ${n} change${n > 1 ? 's' : ''}`);
};
edit('js/config.js', /(appVersion:\s*')[^']+(')/g, `$1${v}$2`);
edit('index.html', /((?:href|src)="[^"]+\.(?:css|js))\?v=[^"]*"/g, `$1?v=${v}"`);
console.log(`Version ${v}. Run node tests/selftest.js to confirm.`);
