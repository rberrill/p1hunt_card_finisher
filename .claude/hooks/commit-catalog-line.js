// PreToolUse hook for Bash: when Claude runs `git commit` while app files (js/, css/,
// index.html) have changes, the commit message must carry a `Catalog:` line saying which
// catalog entries the change added, changed or retired, or `Catalog: none (why)`. Without it
// the command is blocked (exit 2) and the reason goes back to Claude. The catalog is part of
// finishing any change to the app (the `test` skill).
'use strict';
const { execFileSync } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const APP_FILES = ['js', 'css', 'index.html'];
const COMMIT_COMMAND = /\bgit\b[^\n;&|]*\bcommit\b/;
const CATALOG_LINE = /^\s*Catalog:\s*\S/m;

// The app files with staged or unstaged changes, as git's short status; '' when none or when
// this is not a git checkout.
function changedAppFiles() {
  try {
    const args = ['status', '--porcelain', '--', ...APP_FILES];
    return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
  } catch (error) {
    return '';
  }
}

let input = '';
process.stdin.on('data', chunk => {
  input += chunk;
});
process.stdin.on('end', () => {
  let hook = {};
  try {
    hook = JSON.parse(input || '{}');
  } catch (error) { /* no input */ }
  const command = (hook.tool_input && hook.tool_input.command) || '';
  if (!COMMIT_COMMAND.test(command)) process.exit(0);
  if (CATALOG_LINE.test(command)) process.exit(0);
  if (!changedAppFiles()) process.exit(0);
  process.stderr.write(
    'This commit changes app files, so its message needs a Catalog: line, for example\n'
    + '"Catalog: EXP-41 added; MSG-27 changed" or "Catalog: none (refactor, no behavior '
    + 'change)".\nUpdate tests/catalog/ first if the change needs it (the test skill).\n',
  );
  process.exit(2);
});
