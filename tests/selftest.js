// Node checks, no dependencies: engine purity, asset cache-busting, shell module boundaries,
// security and privacy rules, and the CardEngine self-tests (from js/engine.js).
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
  const GLOBALS = new Set(('Array ArrayBuffer Blob CONFIG CardEngine CardEngineModule ClipboardItem Date Error File Image ImageData Infinity JSON Map Math ' +
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

// Security rules (1.6). Untrusted text (file names, edits files, links) must never become markup or
// code: no HTML-string sinks or eval anywhere in js/, and index.html keeps a strict Content Security Policy
// with no inline script, style or event-handler attributes and no off-site assets.
{
  const files = ['js/config.js', 'js/engine.js', ...fs.readdirSync(path.join(root, 'js/app')).filter(f => f.endsWith('.js')).map(f => `js/app/${f}`)];
  const SINKS = /\.(?:inner|outer)HTML\s*=|insertAdjacentHTML|document\.write|\beval\s*\(|new Function\b|createElement\(\s*['"]script|setTimeout\(\s*['"`]|setInterval\(\s*['"`]/;
  const hits = [];
  for (const f of files) read(f).split('\n').forEach((line, i) => { if (SINKS.test(line.replace(/\/\/.*$/, ''))) hits.push(`${f}:${i + 1}`); });
  report(!hits.length, 'Security: no HTML-string sinks or eval in js/ (build DOM with CF.h)', hits.length ? hits.join(', ') : `${files.length} files clean`);

  const body = read('index.html').replace(/<!--[\s\S]*?-->/g, ''); // markup only, comments removed
  const csp = (body.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)">/) || [])[1] || '';
  const first = Math.min(...['<link rel="stylesheet"', '<script'].map(t => body.indexOf(t)).filter(i => i >= 0));
  const problems = [];
  if (!csp) problems.push('no CSP meta tag');
  else {
    if (body.indexOf('Content-Security-Policy') > first) problems.push('CSP comes after the first stylesheet/script');
    if (/unsafe-|https?:|\*/.test(csp)) problems.push('CSP allows unsafe-*, wildcards or other hosts');
    for (const d of ["default-src 'none'", "script-src 'self'", "style-src 'self'", "base-uri 'none'"]) if (!csp.includes(d)) problems.push(`CSP lacks ${d}`);
  }
  if (/<script(?![^>]*\bsrc=)[^>]*>/.test(body)) problems.push('inline <script>');
  if (/\sstyle="/.test(body)) problems.push('style="" attribute');
  if (/\son[a-z]+="/i.test(body)) problems.push('on…="" handler attribute');
  if (/(?:src|href)="(?:https?:)?\/\//.test(body)) problems.push('off-site asset');
  report(!problems.length, 'Security: index.html has a strict CSP and nothing inline or off-site', problems.length ? problems.join('; ') : csp.split(';').length + ' CSP directives');
}

// Privacy rules (1.7). The repository is public: sample photos may not carry a GPS location, and the
// published text files may not contain private network addresses or local drive paths (those belong in
// the gitignored CLAUDE.local.md).
{
  const hasGps = b => { // walks the JPEG segments to the EXIF IFD0 and looks for the GPS pointer (tag 0x8825)
    for (let i = 2; i + 4 < b.length && b[i] === 0xFF && b[i + 1] !== 0xDA; i += 2 + b.readUInt16BE(i + 2)) {
      if (b[i + 1] !== 0xE1 || b.toString('latin1', i + 4, i + 8) !== 'Exif') continue;
      const t = i + 10, le = b.toString('latin1', t, t + 2) === 'II';
      const r16 = o => le ? b.readUInt16LE(o) : b.readUInt16BE(o), r32 = o => le ? b.readUInt32LE(o) : b.readUInt32BE(o);
      const ifd = t + r32(t + 4);
      for (let k = 0; k < r16(ifd); k++) if (r16(ifd + 2 + k * 12) === 0x8825) return true;
    }
    return false;
  };
  const photos = fs.readdirSync(path.join(root, 'samples')).filter(f => /\.jpe?g$/i.test(f));
  const located = photos.filter(f => hasGps(fs.readFileSync(path.join(root, 'samples', f))));
  report(photos.length && !located.length, 'Privacy: sample photos carry no GPS location', located.length ? located.join(', ') : `${photos.length} photos checked`);

  const walk = d => fs.existsSync(path.join(root, d)) ? fs.readdirSync(path.join(root, d), { withFileTypes: true })
    .flatMap(e => e.isDirectory() ? walk(`${d}/${e.name}`) : [`${d}/${e.name}`]) : [];
  const published = ['README.md', 'CHANGELOG.md', 'SECURITY.md', 'CLAUDE.md', 'index.html', ...['css', 'docs', 'js', 'tests', '.claude'].flatMap(walk)]
    .filter(f => /\.(?:md|js|json|html|css)$/.test(f) && fs.existsSync(path.join(root, f)))
    .filter(f => !/^tests\/UAT-|^\.claude\/settings\.local\.json$/.test(f)); // gitignored, local only
  const PRIVATE = /\b10(?:\.\d{1,3}){3}\b|\b192\.168(?:\.\d{1,3}){2}\b|\b172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2}\b|(?<!\w)[A-Za-z]:[\\/]{1,2}(?:Users|P1HUNT)\b/i;
  const leaks = [];
  for (const f of published) read(f).split('\n').forEach((line, i) => { if (PRIVATE.test(line)) leaks.push(`${f}:${i + 1}`); });
  report(!leaks.length, 'Privacy: no private network addresses or local paths in published files', leaks.length ? leaks.join(', ') : `${published.length} files clean`);
}

new Function(engine)(); // defines globalThis.CardEngine
const t0 = Date.now();
const result = globalThis.CardEngine.selfTest();
for (const r of result.results) report(r.pass, r.name, r.detail);

console.log(`\n${ran - failed}/${ran} passed in ${Date.now() - t0} ms`);
process.exit(failed ? 1 : 0);
