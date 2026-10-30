// A minimal JavaScript tokenizer for tests/selftest.js (no dependencies): identifiers,
// punctuation, numbers, and opaque string / template / regex / comment spans. Template ${...}
// expressions are tokenized as code. Written for this codebase's style; it is not a full
// JavaScript parser.
//
// A token is { type: 'id' | 'punct' | 'num' | 'str' | 'comment', value (id and punct only),
// start, end } (character offsets). A punct token that opens or closes a ${...} has tpl: true.
'use strict';

// After these keywords a `/` starts a regex, not a division.
const KEYWORDS_BEFORE_EXPRESSION = new Set([
  'return', 'typeof', 'case', 'do', 'else', 'in', 'of', 'new', 'delete', 'void', 'throw',
  'instanceof', 'yield', 'await',
]);
// After these punctuators a `/` starts a regex.
const PUNCTUATION_BEFORE_REGEX = new Set([
  '(', ',', '=', ':', '[', '!', '&', '|', '?', '{', '}', ';',
  '+', '-', '*', '%', '<', '>', '~', '^',
]);

const isPunct = (token, value) => token && token.type === 'punct' && token.value === value;
// Words that can come before an object-literal method's name.
const MODIFIERS = ['async', 'get', 'set'];
// Words that end a const / let / var statement's list of declarators.
const DECLARATION_ENDERS = ['const', 'let', 'var', 'function', 'return', 'if', 'for'];
const withoutComments = tokens => tokens.filter(token => token.type !== 'comment');

function tokenize(source) {
  const tokens = [];
  let position = 0;
  // The brace depth at which each open ${ resumes its template.
  const templateDepths = [];
  let braceDepth = 0;

  // The last token that isn't a comment, or null.
  const lastCodeToken = () => {
    for (let k = tokens.length - 1; k >= 0; k--) {
      if (tokens[k].type !== 'comment') return tokens[k];
    }
    return null;
  };

  // Template text from `start` (just after a ` or a closing }) to the closing ` or the next ${.
  function scanTemplateText(start) {
    let end = position;
    while (end < source.length) {
      if (source[end] === '\\') {
        end += 2;
        continue;
      }
      if (source[end] === '`') {
        tokens.push({ type: 'str', start, end: end + 1 });
        position = end + 1;
        return;
      }
      if (source[end] === '$' && source[end + 1] === '{') {
        tokens.push({ type: 'str', start, end: end + 2 });
        position = end + 2;
        templateDepths.push(braceDepth);
        braceDepth++;
        tokens.push({ type: 'punct', value: '{', start: end + 1, end: end + 2, tpl: true });
        return;
      }
      end++;
    }
    throw new Error('unterminated template at ' + start);
  }

  function scanQuotedString(quote) {
    let end = position + 1;
    while (source[end] !== quote) {
      if (source[end] === '\\') end++;
      if (source[end] === '\n') throw new Error('newline in string at ' + position);
      end++;
    }
    tokens.push({ type: 'str', start: position, end: end + 1 });
    position = end + 1;
  }

  function scanRegex() {
    let end = position + 1;
    let isInClass = false;
    while (true) {
      const char = source[end];
      if (char === '\\') {
        end += 2;
        continue;
      }
      if (char === '[') isInClass = true;
      else if (char === ']') isInClass = false;
      else if (char === '/' && !isInClass) break;
      else if (char === '\n' || char === undefined) throw new Error('bad regex at ' + position);
      end++;
    }
    end++;
    while (/[a-z]/.test(source[end])) end++;
    tokens.push({ type: 'str', start: position, end });
    position = end;
  }

  // Pushes a token for source[position, end) and moves past it.
  function pushSpan(type, end, value) {
    const token = value === undefined
      ? { type, start: position, end }
      : { type, value, start: position, end };
    tokens.push(token);
    position = end;
  }

  while (position < source.length) {
    const char = source[position];
    const next = source[position + 1];
    if (/\s/.test(char)) {
      position++;
      continue;
    }
    if (char === '/' && next === '/') {
      const lineEnd = source.indexOf('\n', position);
      pushSpan('comment', lineEnd < 0 ? source.length : lineEnd);
      continue;
    }
    if (char === '/' && next === '*') {
      pushSpan('comment', source.indexOf('*/', position + 2) + 2);
      continue;
    }
    if (char === '"' || char === "'") {
      scanQuotedString(char);
      continue;
    }
    if (char === '`') {
      const start = position;
      position++;
      scanTemplateText(start);
      continue;
    }
    if (char === '/') {
      const previous = lastCodeToken();
      const isRegex = !previous
        || (previous.type === 'punct' && PUNCTUATION_BEFORE_REGEX.has(previous.value))
        || (previous.type === 'id' && KEYWORDS_BEFORE_EXPRESSION.has(previous.value));
      if (isRegex) {
        scanRegex();
        continue;
      }
    }
    if (/[A-Za-z_$]/.test(char)) {
      let end = position + 1;
      while (/[\w$]/.test(source[end] || '')) end++;
      pushSpan('id', end, source.slice(position, end));
      continue;
    }
    if (/[0-9]/.test(char) || (char === '.' && /[0-9]/.test(next))) {
      let end = position + 1;
      while (/[\w.]/.test(source[end] || '')) end++;
      pushSpan('num', end);
      continue;
    }
    if (char === '.' && next === '.' && source[position + 2] === '.') {
      pushSpan('punct', position + 3, '...');
      continue;
    }
    if (char === '{') {
      braceDepth++;
      pushSpan('punct', position + 1, char);
      continue;
    }
    if (char === '}') {
      braceDepth--;
      const closesTemplateExpression = templateDepths.length
        && templateDepths[templateDepths.length - 1] === braceDepth;
      if (closesTemplateExpression) {
        templateDepths.pop();
        tokens.push({ type: 'punct', value: '}', start: position, end: position + 1, tpl: true });
        const start = position;
        position++;
        scanTemplateText(start);
        continue;
      }
      pushSpan('punct', position + 1, char);
      continue;
    }
    pushSpan('punct', position + 1, char);
  }
  return tokens;
}

// Declarations at bracket depth `atDepth` (0 = the file's top level; 2 = inside
// `(function (CF) { ... })`): function NAME, async function NAME,
// const / let / var NAME[, NAME = ...].
// Returns [{ name, kind }].
function topLevelDecls(tokens, atDepth = 0) {
  const names = [];
  let depth = 0;
  let isInDeclaration = false;
  const code = withoutComments(tokens);
  for (let k = 0; k < code.length; k++) {
    const token = code[k];
    const next = code[k + 1];
    if (token.type === 'punct') {
      if ('{(['.includes(token.value)) {
        depth++;
      } else if ('})]'.includes(token.value)) {
        depth--;
      } else if (depth === atDepth && token.value === ';') {
        isInDeclaration = false;
      } else if (depth === atDepth && isInDeclaration && token.value === ',') {
        const isAnotherBinding = next && next.type === 'id' && isPunct(code[k + 2], '=');
        if (isAnotherBinding) names.push({ name: next.value, kind: 'binding' });
      }
      continue;
    }
    if (depth !== atDepth || token.type !== 'id') continue;
    const isNamed = next && next.type === 'id';
    if (token.value === 'function' && isNamed) {
      names.push({ name: next.value, kind: 'function' });
      isInDeclaration = false;
    } else if (['const', 'let', 'var'].includes(token.value) && isNamed) {
      names.push({ name: next.value, kind: token.value });
      isInDeclaration = true;
    }
  }
  return names;
}

// The index of the token that closes the parenthesis opened at `open`.
function closingParen(code, open) {
  let depth = 0;
  let k = open;
  for (; k < code.length; k++) {
    if (isPunct(code[k], '(')) depth++;
    else if (isPunct(code[k], ')') && --depth === 0) break;
  }
  return k;
}

// Classifies each identifier use: returns [{ tok, prev, next, encl, shorthand }] for code
// identifiers, leaving out property names (after a dot), object-literal keys and method names.
// encl is the innermost open bracket; shorthand marks `{ name }` in an object literal.
function idUses(tokens) {
  const code = withoutComments(tokens);
  const brackets = [];
  const uses = [];
  for (let k = 0; k < code.length; k++) {
    const token = code[k];
    if (token.type === 'punct') {
      if ('{(['.includes(token.value)) brackets.push(token.value);
      else if ('})]'.includes(token.value)) brackets.pop();
      continue;
    }
    if (token.type !== 'id') continue;
    const prev = code[k - 1];
    const next = code[k + 1];
    // A property access.
    if (isPunct(prev, '.')) continue;
    const encl = brackets[brackets.length - 1];
    const prevValue = prev && prev.type === 'punct' ? prev.value : null;
    const nextValue = next && next.type === 'punct' ? next.value : null;
    const startsEntry = prevValue === '{' || prevValue === ',';
    // An object-literal key.
    if (encl === '{' && startsEntry && nextValue === ':') continue;
    // A method definition in an object literal: name ( ... ) {
    // (optionally after async / get / set).
    const isAfterModifier = prev && prev.type === 'id' && MODIFIERS.includes(prev.value);
    if (encl === '{' && nextValue === '(' && (startsEntry || isAfterModifier)) {
      if (isPunct(code[closingParen(code, k + 1) + 1], '{')) continue;
    }
    const shorthand = encl === '{' && startsEntry && (nextValue === ',' || nextValue === '}');
    uses.push({ tok: token, prev, next, encl, shorthand });
  }
  return uses;
}

// Every name declared anywhere in the file (any scope): const / let / var names and
// destructuring patterns, function names and parameters, arrow parameters, catch parameters.
// Scope-blind on purpose.
const KEYWORDS = new Set((
  'break case catch class const continue debugger default delete do else export extends false '
  + 'finally for function if import in instanceof let new null of return super switch this '
  + 'throw true try typeof var void while with yield async await get set static'
).split(' '));

function declaredNames(tokens) {
  const code = withoutComments(tokens);
  const names = new Set();

  // Collects the bindings of a parameter list or pattern starting at an opening bracket: the
  // names that aren't keys, properties, member or call expressions, or default values.
  // Returns the index of the closing bracket.
  const collectPattern = open => {
    let depth = 0;
    let k = open;
    for (; k < code.length; k++) {
      const token = code[k];
      if (token.type === 'punct') {
        if ('({['.includes(token.value)) depth++;
        else if (')}]'.includes(token.value) && --depth === 0) break;
        continue;
      }
      if (token.type !== 'id' || KEYWORDS.has(token.value)) continue;
      const prev = code[k - 1];
      const next = code[k + 1];
      const isNotBinding = isPunct(prev, '.')
        || isPunct(next, ':')
        || isPunct(next, '.')
        || isPunct(next, '(')
        || isPunct(prev, '=');
      if (!isNotBinding) names.add(token.value);
    }
    return k;
  };

  // The further declarators of a const / let / var at `start`: , NAME = … and , [pattern] = …
  // at the same depth, until the ;.
  const collectFurtherDeclarators = start => {
    let depth = 0;
    for (let k = start; k < code.length; k++) {
      const token = code[k];
      if (token.type === 'id') {
        const endsDeclaration = DECLARATION_ENDERS.includes(token.value);
        if (depth === 0 && endsDeclaration) break;
        continue;
      }
      if (token.type !== 'punct') continue;
      if ('({['.includes(token.value)) {
        depth++;
        continue;
      }
      if (')}]'.includes(token.value)) {
        if (--depth < 0) break;
        continue;
      }
      if (depth !== 0) continue;
      if (token.value === ';') break;
      if (token.value !== ',') continue;
      const next = code[k + 1];
      const afterNext = code[k + 2];
      const isNamedDeclarator = next && next.type === 'id'
        && (isPunct(afterNext, '=') || isPunct(afterNext, ',') || isPunct(afterNext, ';'));
      if (isNamedDeclarator) {
        names.add(next.value);
      } else if (isPunct(next, '[') || isPunct(next, '{')) {
        const end = collectPattern(k + 1);
        if (isPunct(code[end + 1], '=')) k = end;
      }
    }
  };

  for (let k = 0; k < code.length; k++) {
    const token = code[k];
    const next = code[k + 1];
    if (token.type === 'id' && ['const', 'let', 'var'].includes(token.value)) {
      if (next && next.type === 'id') names.add(next.value);
      else if (isPunct(next, '{') || isPunct(next, '[')) collectPattern(k + 1);
      collectFurtherDeclarators(k + 2);
    } else if (token.type === 'id' && token.value === 'function') {
      let paramsAt = k + 1;
      if (code[paramsAt] && code[paramsAt].type === 'id') {
        names.add(code[paramsAt].value);
        paramsAt++;
      }
      if (isPunct(code[paramsAt], '(')) collectPattern(paramsAt);
    } else if (token.type === 'id' && token.value === 'catch' && isPunct(next, '(')
      && isPunct(code[k - 1], '}')) {
      // try { } catch (error), not promise.catch(...).
      collectPattern(k + 1);
    } else if (isPunct(token, '=') && isPunct(next, '>')) {
      // An arrow: its parameters are just before =>.
      const prev = code[k - 1];
      if (prev && prev.type === 'id') {
        names.add(prev.value);
      } else if (isPunct(prev, ')')) {
        let depth = 0;
        let open = k - 1;
        for (; open >= 0; open--) {
          if (isPunct(code[open], ')')) depth++;
          else if (isPunct(code[open], '(') && --depth === 0) break;
        }
        collectPattern(open);
      }
    } else if (token.type === 'id' && !KEYWORDS.has(token.value) && isPunct(next, '(') && k > 0) {
      // Object-literal method shorthand: name(params) { → the params are bindings.
      const prev = code[k - 1];
      const startsEntry = isPunct(prev, '{')
        || isPunct(prev, ',')
        || MODIFIERS.includes(prev.value);
      if (isPunct(code[closingParen(code, k + 1) + 1], '{') && startsEntry) collectPattern(k + 1);
    }
  }
  return names;
}

// Bare identifiers used but not declared anywhere in the file: globals (or bugs).
function freeNames(tokens) {
  const declared = declaredNames(tokens);
  const free = new Set();
  for (const use of idUses(tokens)) {
    const name = use.tok.value;
    if (!KEYWORDS.has(name) && !declared.has(name)) free.add(name);
  }
  return free;
}

module.exports = { tokenize, topLevelDecls, idUses, declaredNames, freeNames };
