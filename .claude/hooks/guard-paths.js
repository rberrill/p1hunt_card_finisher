// PreToolUse hook for Edit and Write, used by the agents in .claude/agents/ to keep each to
// its own files. Blocks the edit (exit 2) when the file is outside what the agent may change.
//   node guard-paths.js --deny js css index.html     nothing under these may be edited
//   node guard-paths.js --only tests/bugs.md         only files under these may be edited
// Paths are relative to the repository. It guards the edit tools only: an agent's brief still
// says what it may touch, since a shell command could write a file too.
'use strict';
const path = require('path');

const root = path.resolve(__dirname, '../..');
const mode = process.argv[2];
const listed = process.argv.slice(3);

// True when a repository-relative file is one of the listed paths or inside one.
function isListed(relative) {
  return listed.some(item => relative === item || relative.startsWith(`${item}/`));
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
  const file = hook.tool_input && hook.tool_input.file_path;
  if (!file) process.exit(0);
  const relative = path.relative(root, path.resolve(root, file)).split(path.sep).join('/');
  // Files outside the repository (a scratchpad) are not this guard's business.
  if (relative.startsWith('..')) process.exit(0);
  const isAllowed = mode === '--only' ? isListed(relative) : !isListed(relative);
  if (isAllowed) process.exit(0);
  process.stderr.write(
    `This agent may not edit ${relative}. Report what needs changing there instead.\n`,
  );
  process.exit(2);
});
