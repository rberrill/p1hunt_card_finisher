// Runs the CardEngine self-tests straight from js/engine.js in Node — no dependencies, no build.
//   node tests/selftest.js
// Exit code 0 = everything passed, 1 = a test failed or the engine broke a structural rule.
'use strict';
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const engine = read('js/engine.js');

let failed = 0;
const report = (pass, name, detail) => { if (!pass) failed++; console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  |  ' + detail : ''}`); };

// Structural rule: the engine runs unchanged in a Web Worker, so it may not touch the DOM.
const refs = (engine.match(/\b(window|document)\b/g) || []).length;
report(refs === 0, 'Engine has no window/document references', `${refs} found`);

// Cache-busting: every ?v= on index.html's asset links must equal CONFIG.appVersion.
const version = (read('js/config.js').match(/appVersion:\s*'([^']+)'/) || [])[1];
const links = [...read('index.html').matchAll(/(?:href|src)="([^"]+\.(?:css|js))(?:\?v=([^"]*))?"/g)];
const stale = links.filter(m => m[2] !== version).map(m => `${m[1]}?v=${m[2] || '(none)'}`);
report(version && links.length && !stale.length, 'Asset links carry ?v=<appVersion>', stale.length ? `appVersion ${version}; mismatched: ${stale.join(', ')}` : `${links.length} links at ${version}`);

new Function(engine)(); // defines globalThis.CardEngine
const t0 = Date.now();
const result = globalThis.CardEngine.selfTest();
for (const r of result.results) report(r.pass, r.name, r.detail);

const total = result.results.length + 2;
console.log(`\n${total - failed}/${total} passed in ${Date.now() - t0} ms`);
process.exit(failed ? 1 : 0);
