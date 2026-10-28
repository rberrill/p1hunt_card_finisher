// Runs the CardEngine self-tests straight from index.html in Node — no dependencies, no build.
//   node tests/selftest.js
// Exit code 0 = everything passed, 1 = a test failed or the engine block broke a structural rule.
'use strict';
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const block = html.match(/<script id="card-engine">([\s\S]*?)<\/script>/);
if (!block) { console.error('FAIL  CardEngine <script id="card-engine"> block not found'); process.exit(1); }

let failed = 0;
const report = (pass, name, detail) => { if (!pass) failed++; console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  |  ' + detail : ''}`); };

// Structural rule: the engine runs unchanged in a Web Worker, so it may not touch the DOM.
const refs = (block[1].match(/\b(window|document)\b/g) || []).length;
report(refs === 0, 'Engine block has no window/document references', `${refs} found`);

new Function(block[1])(); // defines globalThis.CardEngine
const t0 = Date.now();
const result = globalThis.CardEngine.selfTest();
for (const r of result.results) report(r.pass, r.name, r.detail);

console.log(`\n${result.results.length + 1 - failed}/${result.results.length + 1} passed in ${Date.now() - t0} ms`);
process.exit(failed ? 1 : 0);
