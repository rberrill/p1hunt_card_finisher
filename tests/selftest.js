// Node checks, no dependencies: engine purity, asset cache-busting, shell module boundaries,
// and the CardEngine self-tests (from js/engine.js).
//   node tests/selftest.js
// Exit code 0 = everything passed, 1 = a test failed or the engine broke a structural rule.
'use strict';
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const engine = read('js/engine.js');

let failed = 0, ran = 0;
const report = (pass, name, detail) => { ran++; if (!pass) failed++; console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  |  ' + detail : ''}`); };

// Structural rule: the engine runs unchanged in a Web Worker, so it may not touch the DOM.
const refs = (engine.match(/\b(window|document)\b/g) || []).length;
report(refs === 0, 'Engine has no window/document references', `${refs} found`);

// Cache-busting: every ?v= on index.html's asset links must equal CONFIG.appVersion.
const version = (read('js/config.js').match(/appVersion:\s*'([^']+)'/) || [])[1];
const links = [...read('index.html').matchAll(/(?:href|src)="([^"]+\.(?:css|js))(?:\?v=([^"]*))?"/g)];
const stale = links.filter(m => m[2] !== version).map(m => `${m[1]}?v=${m[2] || '(none)'}`);
report(version && links.length && !stale.length, 'Asset links carry ?v=<appVersion>', stale.length ? `appVersion ${version}; mismatched: ${stale.join(', ')}` : `${links.length} links at ${version}`);

// Shell module boundaries (js/app/*.js share the CF namespace; see the header of each module).
{
  const { tokenize, topLevelDecls, idUses, freeNames, declaredNames } = require('./jstok.js');
  const html = read('index.html');
  const order = [...html.matchAll(/<script src="js\/app\/([\w-]+)\.js\?/g)].map(m => m[1]);
  const onDisk = fs.readdirSync(path.join(root, 'js/app')).filter(f => f.endsWith('.js')).map(f => f.slice(0, -3)).sort();
  const scripts = [...html.matchAll(/<script src="([^"?]+)/g)].map(m => m[1]);
  const orderOk = order[0] === 'core' && order[order.length - 1] === 'main' && [...order].sort().join() === onDisk.join()
    && scripts.indexOf('js/config.js') < scripts.indexOf('js/engine.js') && scripts.indexOf('js/engine.js') < scripts.indexOf('js/app/core.js');
  report(orderOk, 'App modules: all loaded, config → engine → core … main', order.join(' → '));

  const mods = {};
  for (const m of order) {
    const src = read(`js/app/${m}.js`), toks = tokenize(src);
    const decls = topLevelDecls(toks, 2).map(d => d.name).filter(n => n !== 'CF');
    const imports = new Set(((src.match(/const \{([^}]*)\} = CF;/) || [])[1] || '').split(',').map(s => s.trim()).filter(Boolean));
    const exports = new Set(((src.match(/Object\.assign\(CF, \{([^}]*)\}\);/) || [])[1] || '').split(',').map(s => s.trim()).filter(Boolean));
    const cfRefs = new Set(); toks.forEach((t, k) => { if (t.value === 'CF' && toks[k + 1] && toks[k + 1].value === '.' && toks[k + 2] && toks[k + 2].type === 'id') cfRefs.add(toks[k + 2].value); });
    mods[m] = { decls, imports, exports, cfRefs, uses: idUses(toks).map(u => u.tok.value), locals: new Set([...declaredNames(toks)].filter(n => !imports.has(n))) };
  }
  const home = {}, dupes = [];
  for (const m of order) for (const n of mods[m].decls) { if (home[n]) dupes.push(`${n} (${home[n]}, ${m})`); else home[n] = m; }
  report(!dupes.length, 'App modules: no name declared in two modules', dupes.length ? dupes.join(', ') : `${Object.keys(home).length} names`);

  const bare = [], badExport = [];
  let checked = 0;
  for (const m of order) {
    for (const n of mods[m].uses) {
      const h = home[n]; if (!h || h === m || mods[m].locals.has(n)) continue; // a local of the same name is fine
      checked++;
      if (!(h === 'core' && mods[m].imports.has(n))) bare.push(`${m} uses ${h}.${n} without CF`);
    }
    for (const n of mods[m].exports) if (!mods[m].decls.includes(n)) badExport.push(`${m} exports undeclared ${n}`);
  }
  report(!bare.length && !badExport.length, 'App modules: cross-module names go through CF', bare.length || badExport.length ? [...new Set([...bare, ...badExport])].slice(0, 8).join('; ') : `${checked} uses checked`);

  // Names a module uses but never declares or imports must be real globals. A name missing from its
  // module (e.g. a dropped `const E = …`) would otherwise only throw when that code path runs.
  // Add to this list when the shell starts using a new browser API or app global.
  const GLOBALS = new Set(('Array Blob CONFIG CardEngine CardEngineModule ClipboardItem Date Error File Image ImageData Infinity JSON Map Math ' +
    'Number Object Promise ResizeObserver String URL URLSearchParams Uint8Array Uint8ClampedArray Worker clearInterval clearTimeout console ' +
    'DOMParser XMLSerializer TextDecoder atob btoa parseFloat ' +
    'createImageBitmap document indexedDB isFinite localStorage location matchMedia navigator parseInt performance ' +
    'requestAnimationFrame setInterval setTimeout undefined window').split(' '));
  const unknown = [];
  for (const m of order) for (const n of freeNames(tokenize(read(`js/app/${m}.js`)))) if (!GLOBALS.has(n)) unknown.push(`${m}: ${n}`);
  report(!unknown.length, 'App modules: no undeclared names (only known globals)', unknown.length ? unknown.join(', ') : `${GLOBALS.size} globals allowed`);

  const exported = new Set(order.flatMap(m => [...mods[m].exports]));
  const missing = [];
  for (const m of order) for (const n of [...mods[m].cfRefs, ...mods[m].imports]) if (!exported.has(n)) missing.push(`${m} → CF.${n}`);
  report(!missing.length, 'App modules: every CF name is exported by a module', missing.length ? missing.join(', ') : `${exported.size} exports`);
}

new Function(engine)(); // defines globalThis.CardEngine
const t0 = Date.now();
const result = globalThis.CardEngine.selfTest();
for (const r of result.results) report(r.pass, r.name, r.detail);

console.log(`\n${ran - failed}/${ran} passed in ${Date.now() - t0} ms`);
process.exit(failed ? 1 : 0);
