// Node checks, no dependencies: engine purity, asset cache-busting, shell module boundaries,
// security and privacy rules, CONFIG consistency, code style, and the CardEngine self-tests
// (from js/engine.js).
//   node tests/selftest.js
// Exit code 0 = everything passed, 1 = a test failed or the code broke a structural rule.
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { tokenize, topLevelDecls, idUses, freeNames, declaredNames } = require('./jstok.js');
const { checkStyle } = require('./style-check.js');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const engine = read('js/engine.js');

let failedCount = 0;
let ranCount = 0;
function report(pass, name, detail) {
  ranCount++;
  if (!pass) failedCount++;
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  |  ' + detail : ''}`);
}

// Structural rule: the engine runs unchanged in a Web Worker, so it may not touch the DOM.
{
  const references = (engine.match(/\b(window|document)\b/g) || []).length;
  report(references === 0, 'Engine has no window/document references', `${references} found`);
}

// Cache-busting: every ?v= on index.html's asset links must equal CONFIG.appVersion, and every
// linked file (scripts, styles, icons) must exist.
{
  const version = (read('js/config.js').match(/appVersion:\s*'([^']+)'/) || [])[1];
  const ASSET_LINK = /(?:href|src)="([^"]+\.(?:css|js|svg|png|ico))(?:\?v=([^"]*))?"/g;
  const markup = read('index.html').replace(/<!--[\s\S]*?-->/g, '');
  const links = [...markup.matchAll(ASSET_LINK)];
  const stale = links
    .filter(match => match[2] !== version)
    .map(match => `${match[1]}?v=${match[2] || '(none)'}`);
  const detail = stale.length
    ? `appVersion ${version}; mismatched: ${stale.join(', ')}`
    : `${links.length} links at ${version}`;
  report(version && links.length && !stale.length, 'Asset links carry ?v=<appVersion>', detail);
  const missing = links
    .map(match => match[1])
    .filter(file => !fs.existsSync(path.join(root, file)));
  report(!missing.length, 'Every linked asset file exists',
    missing.length ? `missing: ${missing.join(', ')}` : `${links.length} files`);
}

// Shell module boundaries (js/app/*.js share the CF namespace; see the header of each module).
{
  const html = read('index.html');
  const order = [...html.matchAll(/<script src="js\/app\/([\w-]+)\.js\?/g)].map(match => match[1]);
  const onDisk = fs.readdirSync(path.join(root, 'js/app'))
    .filter(file => file.endsWith('.js'))
    .map(file => file.slice(0, -3))
    .sort();
  const scripts = [...html.matchAll(/<script src="([^"?]+)/g)].map(match => match[1]);
  const isBefore = (first, second) => scripts.indexOf(first) < scripts.indexOf(second);
  const isOrderOk = order[0] === 'core'
    && order[order.length - 1] === 'main'
    && [...order].sort().join() === onDisk.join()
    && isBefore('js/config.js', 'js/engine.js')
    && isBefore('js/engine.js', 'js/app/core.js');
  report(isOrderOk, 'App modules: all loaded, config → engine → core … main', order.join(' → '));

  // The names listed between the braces of the first match of `pattern`.
  const listedNames = (source, pattern) => new Set(
    ((source.match(pattern) || [])[1] || '').split(',').map(name => name.trim()).filter(Boolean),
  );
  const modules = {};
  for (const name of order) {
    const source = read(`js/app/${name}.js`);
    const tokens = tokenize(source);
    const imports = listedNames(source, /const \{([^}]*)\} = CF;/);
    const cfReferences = new Set();
    tokens.forEach((token, k) => {
      const isCfMember = token.value === 'CF' && tokens[k + 1] && tokens[k + 1].value === '.'
        && tokens[k + 2] && tokens[k + 2].type === 'id';
      if (isCfMember) cfReferences.add(tokens[k + 2].value);
    });
    modules[name] = {
      declarations: topLevelDecls(tokens, 2)
        .map(declaration => declaration.name)
        .filter(declared => declared !== 'CF'),
      imports,
      exports: listedNames(source, /Object\.assign\(CF, \{([^}]*)\}\);/),
      cfReferences,
      uses: idUses(tokens).map(use => use.tok.value),
      locals: new Set([...declaredNames(tokens)].filter(declared => !imports.has(declared))),
    };
  }

  // Where each top-level name is declared.
  const home = {};
  const duplicates = [];
  for (const name of order) {
    for (const declared of modules[name].declarations) {
      if (home[declared]) duplicates.push(`${declared} (${home[declared]}, ${name})`);
      else home[declared] = name;
    }
  }
  report(!duplicates.length, 'App modules: no name declared in two modules',
    duplicates.length ? duplicates.join(', ') : `${Object.keys(home).length} names`);

  const bareUses = [];
  const badExports = [];
  let checkedCount = 0;
  for (const name of order) {
    const info = modules[name];
    for (const used of info.uses) {
      const owner = home[used];
      // A local of the same name is fine.
      if (!owner || owner === name || info.locals.has(used)) continue;
      checkedCount++;
      if (owner === 'core' && info.imports.has(used)) continue;
      bareUses.push(`${name} uses ${owner}.${used} without CF`);
    }
    for (const exported of info.exports) {
      if (info.declarations.includes(exported)) continue;
      badExports.push(`${name} exports undeclared ${exported}`);
    }
  }
  const boundaryProblems = [...new Set([...bareUses, ...badExports])];
  report(!boundaryProblems.length, 'App modules: cross-module names go through CF',
    boundaryProblems.length
      ? boundaryProblems.slice(0, 8).join('; ')
      : `${checkedCount} uses checked`);

  // Names a module uses but never declares or imports must be real globals. A name missing from
  // its module (such as a dropped `const`) would otherwise only throw when that code path runs.
  // Add to this list when the shell starts using a new browser API or app global.
  const GLOBALS = new Set((
    'Array ArrayBuffer Blob CONFIG CONFIG_LIMITS CardEngine CardEngineModule ClipboardItem '
    + 'Date Error '
    + 'File Image ImageData Infinity JSON Map Math Number Object Promise ResizeObserver String URL '
    + 'URLSearchParams Uint8Array Uint8ClampedArray Worker clearInterval clearTimeout console '
    + 'DOMParser XMLSerializer TextDecoder atob btoa parseFloat '
    + 'createImageBitmap document indexedDB isFinite localStorage location matchMedia navigator '
    + 'parseInt performance requestAnimationFrame setInterval setTimeout undefined window'
  ).split(' '));
  const unknown = [];
  for (const name of order) {
    for (const free of freeNames(tokenize(read(`js/app/${name}.js`)))) {
      if (!GLOBALS.has(free)) unknown.push(`${name}: ${free}`);
    }
  }
  report(!unknown.length, 'App modules: no undeclared names (only known globals)',
    unknown.length ? unknown.join(', ') : `${GLOBALS.size} globals allowed`);

  const exported = new Set(order.flatMap(name => [...modules[name].exports]));
  const missing = [];
  for (const name of order) {
    for (const referenced of [...modules[name].cfReferences, ...modules[name].imports]) {
      if (!exported.has(referenced)) missing.push(`${name} → CF.${referenced}`);
    }
  }
  report(!missing.length, 'App modules: every CF name is exported by a module',
    missing.length ? missing.join(', ') : `${exported.size} exports`);
}

// Security rules (1.6). Untrusted text (file names, edits files, links) must never become markup
// or code: no HTML-string sinks or eval anywhere in js/, and index.html keeps a strict Content
// Security Policy with no inline script, style or event-handler attributes and no off-site assets.
{
  const appFiles = fs.readdirSync(path.join(root, 'js/app'))
    .filter(file => file.endsWith('.js'))
    .map(file => `js/app/${file}`);
  const files = ['js/config.js', 'js/engine.js', ...appFiles];
  const SINKS = new RegExp([
    /\.(?:inner|outer)HTML\s*=/.source,
    /insertAdjacentHTML/.source,
    /document\.write/.source,
    /\beval\s*\(/.source,
    /new Function\b/.source,
    /createElement\(\s*['"]script/.source,
    /setTimeout\(\s*['"`]/.source,
    /setInterval\(\s*['"`]/.source,
  ].join('|'));
  const hits = [];
  for (const file of files) {
    read(file).split('\n').forEach((line, i) => {
      if (SINKS.test(line.replace(/\/\/.*$/, ''))) hits.push(`${file}:${i + 1}`);
    });
  }
  report(!hits.length, 'Security: no HTML-string sinks or eval in js/ (build DOM with CF.makeEl)',
    hits.length ? hits.join(', ') : `${files.length} files clean`);

  // The markup only, comments removed.
  const body = read('index.html').replace(/<!--[\s\S]*?-->/g, '');
  const CSP_META = /<meta http-equiv="Content-Security-Policy" content="([^"]+)">/;
  const csp = (body.match(CSP_META) || [])[1] || '';
  const firstAsset = Math.min(...['<link rel="stylesheet"', '<script']
    .map(tag => body.indexOf(tag))
    .filter(index => index >= 0));
  const problems = [];
  if (!csp) {
    problems.push('no CSP meta tag');
  } else {
    if (body.indexOf('Content-Security-Policy') > firstAsset) {
      problems.push('CSP comes after the first stylesheet/script');
    }
    if (/unsafe-|https?:|\*/.test(csp)) {
      problems.push('CSP allows unsafe-*, wildcards or other hosts');
    }
    const required = [
      "default-src 'none'",
      "script-src 'self'",
      "style-src 'self'",
      "base-uri 'none'",
    ];
    for (const directive of required) {
      if (!csp.includes(directive)) problems.push(`CSP lacks ${directive}`);
    }
  }
  if (/<script(?![^>]*\bsrc=)[^>]*>/.test(body)) problems.push('inline <script>');
  if (/\sstyle="/.test(body)) problems.push('style="" attribute');
  if (/\son[a-z]+="/i.test(body)) problems.push('on…="" handler attribute');
  if (/(?:src|href)="(?:https?:)?\/\//.test(body)) problems.push('off-site asset');
  report(!problems.length, 'Security: index.html has a strict CSP and nothing inline or off-site',
    problems.length ? problems.join('; ') : csp.split(';').length + ' CSP directives');
}

// True when a JPEG has a GPS block: walks the segments to the EXIF IFD0 and looks for the GPS
// pointer (tag 0x8825).
function hasGps(bytes) {
  const START_OF_SCAN = 0xDA;
  const APP1 = 0xE1;
  const GPS_POINTER_TAG = 0x8825;
  for (let i = 2; i + 4 < bytes.length && bytes[i] === 0xFF && bytes[i + 1] !== START_OF_SCAN;) {
    const isExif = bytes[i + 1] === APP1 && bytes.toString('latin1', i + 4, i + 8) === 'Exif';
    if (isExif) {
      const tiffStart = i + 10;
      const isLittleEndian = bytes.toString('latin1', tiffStart, tiffStart + 2) === 'II';
      const read16 = offset => (
        isLittleEndian ? bytes.readUInt16LE(offset) : bytes.readUInt16BE(offset)
      );
      const read32 = offset => (
        isLittleEndian ? bytes.readUInt32LE(offset) : bytes.readUInt32BE(offset)
      );
      const firstDirectory = tiffStart + read32(tiffStart + 4);
      for (let entry = 0; entry < read16(firstDirectory); entry++) {
        if (read16(firstDirectory + 2 + entry * 12) === GPS_POINTER_TAG) return true;
      }
    }
    i += 2 + bytes.readUInt16BE(i + 2);
  }
  return false;
}

// Privacy rules (1.7). The repository is public: sample photos may not carry a GPS location, and
// the published text files may not contain private network addresses or local drive paths
// (those belong in the gitignored CLAUDE.local.md).
{
  const photos = fs.readdirSync(path.join(root, 'samples')).filter(file => /\.jpe?g$/i.test(file));
  const located = photos.filter(file => hasGps(fs.readFileSync(path.join(root, 'samples', file))));
  report(photos.length && !located.length, 'Privacy: sample photos carry no GPS location',
    located.length ? located.join(', ') : `${photos.length} photos checked`);

  const walk = folder => {
    if (!fs.existsSync(path.join(root, folder))) return [];
    return fs.readdirSync(path.join(root, folder), { withFileTypes: true })
      .flatMap(entry => {
        const file = `${folder}/${entry.name}`;
        return entry.isDirectory() ? walk(file) : [file];
      });
  };
  // Gitignored, local-only files are left out.
  const isLocalOnly = file => /^tests\/(?:UAT-|uat\/)|^\.claude\/settings\.local\.json$/.test(file);
  const published = [
    'README.md',
    'CHANGELOG.md',
    'SECURITY.md',
    'CLAUDE.md',
    'index.html',
    ...['css', 'docs', 'js', 'tests', '.claude'].flatMap(walk),
  ]
    .filter(file => /\.(?:md|js|json|html|css)$/.test(file) && fs.existsSync(path.join(root, file)))
    .filter(file => !isLocalOnly(file));
  const PRIVATE = new RegExp([
    /\b10(?:\.\d{1,3}){3}\b/.source,
    /\b192\.168(?:\.\d{1,3}){2}\b/.source,
    /\b172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2}\b/.source,
    /(?<!\w)[A-Za-z]:[\\/]{1,2}(?:Users|P1HUNT)\b/.source,
  ].join('|'), 'i');
  const leaks = [];
  for (const file of published) {
    read(file).split('\n').forEach((line, i) => {
      if (PRIVATE.test(line)) leaks.push(`${file}:${i + 1}`);
    });
  }
  report(!leaks.length, 'Privacy: no private network addresses or local paths in published files',
    leaks.length ? leaks.join(', ') : `${published.length} files clean`);
}

// Defines globalThis.CardEngine.
new Function(engine)();

// CONFIG consistency (1.7). The engine's built-in defaults (used when no settings are passed, as
// in these Node tests) must match CONFIG, and every CONFIG_LIMITS key must name a CONFIG number
// whose default is in range.
{
  const context = {};
  const exposeConfig = ';this.CONFIG = CONFIG; this.CONFIG_LIMITS = CONFIG_LIMITS;';
  vm.runInNewContext(read('js/config.js') + exposeConfig, context);
  const config = context.CONFIG;
  const engineApi = globalThis.CardEngine;
  const geometry = {
    maxOutputPx: config.maxOutputPx,
    maxOutputArea: config.maxOutputArea,
    maxBoundsFactor: config.maxBoundsFactor,
    minCornerDistPx: config.minCornerDistPx,
    fitPaddingPct: config.crop.fitPaddingPct,
    allowUpscale: config.export.allowUpscale,
  };
  const pairs = [
    ['DETECT_DEFAULTS', engineApi.DETECT_DEFAULTS, config.detect],
    ['GEOMETRY_DEFAULTS', engineApi.GEOMETRY_DEFAULTS, geometry],
    ['LEVELS_DEFAULTS', engineApi.LEVELS_DEFAULTS, config.levels],
  ];
  const drift = pairs.flatMap(([name, defaults, configured]) => Object.keys(defaults)
    .filter(key => JSON.stringify(defaults[key]) !== JSON.stringify(configured[key]))
    .map(key => `${name}.${key} ${defaults[key]} vs CONFIG ${configured[key]}`));
  report(!drift.length, 'CONFIG: the engine defaults match CONFIG',
    drift.length ? drift.join('; ') : 'detect, geometry and levels');

  const valueAt = dottedKey => dottedKey
    .split('.')
    .reduce((object, key) => object && object[key], config);
  const badLimits = Object.entries(context.CONFIG_LIMITS)
    .filter(([key, [low, high]]) => {
      const value = valueAt(key);
      return typeof value !== 'number' || !(low <= value && value <= high);
    })
    .map(([key]) => key);
  const limitCount = Object.keys(context.CONFIG_LIMITS).length;
  report(!badLimits.length,
    'CONFIG: every URL limit names a CONFIG number with its default in range',
    badLimits.length ? badLimits.join(', ') : `${limitCount} limits`);
}

// Code style (.claude/rules/code-style.md): the rules a tokenizer can check.
for (const [rule, problems] of Object.entries(checkStyle(root))) {
  const detail = problems.length ? problems.slice(0, 8).join(', ') : '';
  report(!problems.length, `Code style: ${rule}`, detail);
}

{
  const startTime = Date.now();
  const result = globalThis.CardEngine.selfTest();
  for (const test of result.results) report(test.pass, test.name, test.detail);
  console.log(`\n${ranCount - failedCount}/${ranCount} passed in ${Date.now() - startTime} ms`);
}
process.exit(failedCount ? 1 : 0);
