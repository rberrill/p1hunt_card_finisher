// Minimal JS tokenizer for tests/selftest.js (no dependencies): identifiers, punctuation, and opaque
// string / template / regex / comment spans. Template ${...} expressions are tokenized as code.
// Written for this codebase's style; it is not a full JavaScript parser.
'use strict';
const KW_BEFORE_EXPR = new Set(['return', 'typeof', 'case', 'do', 'else', 'in', 'of', 'new', 'delete', 'void', 'throw', 'instanceof', 'yield', 'await']);
const REGEX_AFTER = new Set(['(', ',', '=', ':', '[', '!', '&', '|', '?', '{', '}', ';', '+', '-', '*', '%', '<', '>', '~', '^']);
function tokenize(src) {
  const toks = []; let i = 0;
  const sig = () => { for (let k = toks.length - 1; k >= 0; k--) if (toks[k].type !== 'comment') return toks[k]; return null; };
  const tplDepth = []; let depth = 0; // brace depth at which each open ${ resumes its template
  function scanTemplateText(start) { // i points just after ` or }
    let j = i;
    while (j < src.length) {
      if (src[j] === '\\') { j += 2; continue; }
      if (src[j] === '`') { toks.push({ type: 'str', start, end: j + 1 }); i = j + 1; return; }
      if (src[j] === '$' && src[j + 1] === '{') { toks.push({ type: 'str', start, end: j + 2 }); i = j + 2; tplDepth.push(depth); depth++; toks.push({ type: 'punct', value: '{', start: j + 1, end: j + 2, tpl: true }); return; }
      j++;
    }
    throw new Error('unterminated template at ' + start);
  }
  while (i < src.length) {
    const c = src[i];
    if (/\s/.test(c)) { i++; continue; }
    if (c === '/' && src[i + 1] === '/') { const j = src.indexOf('\n', i); const e = j < 0 ? src.length : j; toks.push({ type: 'comment', start: i, end: e }); i = e; continue; }
    if (c === '/' && src[i + 1] === '*') { const e = src.indexOf('*/', i + 2) + 2; toks.push({ type: 'comment', start: i, end: e }); i = e; continue; }
    if (c === '"' || c === "'") { let j = i + 1; while (src[j] !== c) { if (src[j] === '\\') j++; if (src[j] === '\n') throw new Error('newline in string at ' + i); j++; } toks.push({ type: 'str', start: i, end: j + 1 }); i = j + 1; continue; }
    if (c === '`') { const s = i; i++; scanTemplateText(s); continue; }
    if (c === '/') {
      const p = sig();
      const isRegex = !p || (p.type === 'punct' && REGEX_AFTER.has(p.value)) || (p.type === 'id' && KW_BEFORE_EXPR.has(p.value));
      if (isRegex) {
        let j = i + 1, cls = false;
        while (true) { const d = src[j]; if (d === '\\') { j += 2; continue; } if (d === '[') cls = true; else if (d === ']') cls = false; else if (d === '/' && !cls) break; else if (d === '\n' || d === undefined) throw new Error('bad regex at ' + i); j++; }
        j++; while (/[a-z]/.test(src[j])) j++;
        toks.push({ type: 'str', start: i, end: j }); i = j; continue;
      }
    }
    if (/[A-Za-z_$]/.test(c)) { let j = i + 1; while (/[\w$]/.test(src[j] || '')) j++; toks.push({ type: 'id', value: src.slice(i, j), start: i, end: j }); i = j; continue; }
    if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(src[i + 1]))) { let j = i + 1; while (/[\w.]/.test(src[j] || '')) j++; toks.push({ type: 'num', start: i, end: j }); i = j; continue; }
    if (c === '.' && src[i + 1] === '.' && src[i + 2] === '.') { toks.push({ type: 'punct', value: '...', start: i, end: i + 3 }); i += 3; continue; }
    if (c === '{') { depth++; toks.push({ type: 'punct', value: c, start: i, end: i + 1 }); i++; continue; }
    if (c === '}') {
      depth--;
      if (tplDepth.length && tplDepth[tplDepth.length - 1] === depth) { tplDepth.pop(); toks.push({ type: 'punct', value: '}', start: i, end: i + 1, tpl: true }); const s = i; i++; scanTemplateText(s); continue; }
      toks.push({ type: 'punct', value: c, start: i, end: i + 1 }); i++; continue;
    }
    toks.push({ type: 'punct', value: c, start: i, end: i + 1 }); i++;
  }
  return toks;
}

// Declarations at bracket depth `at` (0 = file top level; 2 = inside `(function (CF) { ... })`):
// function NAME, async function NAME, const/let/var NAME[, NAME = ...].
function topLevelDecls(toks, at = 0) {
  const names = []; let depth = 0, inDecl = false;
  const code = toks.filter(t => t.type !== 'comment');
  for (let k = 0; k < code.length; k++) {
    const t = code[k];
    if (t.type === 'punct') {
      if ('{(['.includes(t.value)) depth++; else if ('})]'.includes(t.value)) depth--;
      else if (depth === at && t.value === ';') inDecl = false;
      else if (depth === at && inDecl && t.value === ',' && code[k + 1] && code[k + 1].type === 'id' && code[k + 2] && code[k + 2].value === '=') names.push({ name: code[k + 1].value, kind: 'binding' });
      continue;
    }
    if (depth !== at || t.type !== 'id') continue;
    if (t.value === 'function' && code[k + 1] && code[k + 1].type === 'id') { names.push({ name: code[k + 1].value, kind: 'function' }); inDecl = false; }
    else if ((t.value === 'const' || t.value === 'let' || t.value === 'var') && code[k + 1] && code[k + 1].type === 'id') { names.push({ name: code[k + 1].value, kind: t.value }); inDecl = true; }
  }
  return names;
}

// Classify each identifier use: returns [{tok, prev, next, encl}] for code identifiers (not property names).
function idUses(toks) {
  const code = toks.filter(t => t.type !== 'comment');
  const stack = []; const out = [];
  for (let k = 0; k < code.length; k++) {
    const t = code[k];
    if (t.type === 'punct') { if ('{(['.includes(t.value)) stack.push(t.value); else if ('})]'.includes(t.value)) stack.pop(); continue; }
    if (t.type !== 'id') continue;
    const prev = code[k - 1], next = code[k + 1];
    if (prev && prev.type === 'punct' && prev.value === '.' ) continue;           // property access
    const encl = stack[stack.length - 1];
    const prevV = prev && prev.type === 'punct' ? prev.value : null, nextV = next && next.type === 'punct' ? next.value : null;
    const isKey = encl === '{' && (prevV === '{' || prevV === ',') && nextV === ':';
    if (isKey) continue;                                                           // object literal key
    // Method definition in an object literal: name ( ... ) {   (optionally after async/get/set)
    if (encl === '{' && nextV === '(' && (prevV === '{' || prevV === ',' || (prev && prev.type === 'id' && ['async', 'get', 'set'].includes(prev.value)))) {
      let d = 0, j = k + 1;
      for (; j < code.length; j++) { const v = code[j].type === 'punct' ? code[j].value : null; if (v === '(') d++; else if (v === ')' && --d === 0) break; }
      const after = code[j + 1];
      if (after && after.type === 'punct' && after.value === '{') continue;
    }
    const shorthand = encl === '{' && (prevV === '{' || prevV === ',') && (nextV === ',' || nextV === '}');
    out.push({ tok: t, prev, next, encl, shorthand });
  }
  return out;
}
// Every name declared anywhere in the file (any scope): const/let/var names and destructuring patterns,
// function names and parameters, arrow parameters, catch parameters. Scope-blind on purpose.
const KEYWORDS = new Set(('break case catch class const continue debugger default delete do else export extends false finally for function if import in ' +
  'instanceof let new null of return super switch this throw true try typeof var void while with yield async await get set static').split(' '));
function declaredNames(toks) {
  const code = toks.filter(t => t.type !== 'comment'), out = new Set();
  const isP = (t, v) => t && t.type === 'punct' && t.value === v;
  // Collect identifiers of a parameter list or pattern starting at an opening bracket: names not used as keys or properties.
  const pattern = k => {
    const open = code[k].value, close = { '(': ')', '{': '}', '[': ']' }[open]; let d = 0, j = k;
    for (; j < code.length; j++) {
      const t = code[j];
      if (t.type === 'punct') { if ('({['.includes(t.value)) d++; else if (')}]'.includes(t.value) && --d === 0) break; continue; }
      if (t.type !== 'id' || KEYWORDS.has(t.value)) continue;
      const prev = code[j - 1], next = code[j + 1];
      if (isP(prev, '.') || isP(next, ':') || isP(next, '.') || isP(next, '(')) continue; // properties, keys, member/call expressions
      if (isP(prev, '=')) continue; // a default value, not a binding
      out.add(t.value);
    }
    return j;
  };
  for (let k = 0; k < code.length; k++) {
    const t = code[k], next = code[k + 1];
    if (t.type === 'id' && ['const', 'let', 'var'].includes(t.value)) {
      if (next && next.type === 'id') out.add(next.value); else if (next && (isP(next, '{') || isP(next, '['))) pattern(k + 1);
      // further declarators: , NAME =   at the same depth until ;
      let d = 0;
      for (let j = k + 2; j < code.length; j++) {
        const u = code[j];
        if (u.type === 'punct') { if ('({['.includes(u.value)) d++; else if (')}]'.includes(u.value)) { if (--d < 0) break; } else if (d === 0 && u.value === ';') break;
          else if (d === 0 && u.value === ',' && code[j + 1] && code[j + 1].type === 'id' && (isP(code[j + 2], '=') || isP(code[j + 2], ',') || isP(code[j + 2], ';'))) out.add(code[j + 1].value);
          else if (d === 0 && u.value === ',' && (isP(code[j + 1], '[') || isP(code[j + 1], '{'))) { const e = pattern(j + 1); if (isP(code[e + 1], '=')) { j = e; } } }
        else if (d === 0 && u.type === 'id' && ['const', 'let', 'var', 'function', 'return', 'if', 'for'].includes(u.value)) break;
      }
    } else if (t.type === 'id' && t.value === 'function') {
      let k2 = k + 1; if (code[k2] && code[k2].type === 'id') { out.add(code[k2].value); k2++; }
      if (isP(code[k2], '(')) pattern(k2);
    } else if (t.type === 'id' && t.value === 'catch' && isP(next, '(') && isP(code[k - 1], '}')) pattern(k + 1); // try { } catch (e), not promise.catch(...)
    else if (isP(t, '=') && isP(next, '>')) { // arrow: params are just before =>
      const p = code[k - 1];
      if (p && p.type === 'id') out.add(p.value);
      else if (isP(p, ')')) { let d = 0, j = k - 1; for (; j >= 0; j--) { if (isP(code[j], ')')) d++; else if (isP(code[j], '(') && --d === 0) break; } pattern(j); }
    } else if (t.type === 'id' && !KEYWORDS.has(t.value) && isP(next, '(') && k > 0) {
      // object-literal method shorthand: name(params) {  → params are bindings
      let d = 0, j = k + 1; for (; j < code.length; j++) { if (isP(code[j], '(')) d++; else if (isP(code[j], ')') && --d === 0) break; }
      if (isP(code[j + 1], '{') && (isP(code[k - 1], '{') || isP(code[k - 1], ',') || ['async', 'get', 'set'].includes(code[k - 1].value))) pattern(k + 1);
    }
  }
  return out;
}

// Bare identifiers used but not declared anywhere in the file: globals (or bugs).
function freeNames(toks) {
  const declared = declaredNames(toks), free = new Set();
  for (const u of idUses(toks)) { const n = u.tok.value; if (!KEYWORDS.has(n) && !declared.has(n)) free.add(n); }
  return free;
}
module.exports = { tokenize, topLevelDecls, idUses, declaredNames, freeNames };
