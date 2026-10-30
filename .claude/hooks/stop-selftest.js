// Stop hook: when app code or tests have uncommitted changes, runs node tests/selftest.js before
// Claude finishes a turn. A failure blocks the stop (exit 2) and sends the failing checks back to
// Claude.
'use strict';
const { execFileSync, spawnSync } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const WATCHED = ['js', 'css', 'tests', 'index.html'];

let input = '';
process.stdin.on('data', chunk => {
  input += chunk;
});
process.stdin.on('end', () => {
  let hook = {};
  try {
    hook = JSON.parse(input || '{}');
  } catch (error) { /* no input */ }
  // Already blocked once this turn; don't loop.
  if (hook.stop_hook_active) process.exit(0);

  let changed = '';
  try {
    const args = ['status', '--porcelain', '--', ...WATCHED];
    changed = execFileSync('git', args, { cwd: root, encoding: 'utf8' });
  } catch (error) {
    // Not a git checkout; nothing to compare.
    process.exit(0);
  }
  if (!changed.trim()) process.exit(0);

  const selftest = path.join(root, 'tests', 'selftest.js');
  const run = spawnSync(process.execPath, [selftest], { cwd: root, encoding: 'utf8' });
  if (run.status === 0) process.exit(0);
  const failures = (run.stdout || '')
    .split('\n')
    .filter(line => line.startsWith('FAIL'))
    .join('\n');
  const output = failures || run.stderr || run.stdout;
  process.stderr.write(
    `node tests/selftest.js failed after this turn's changes:\n${output}\n`
    + 'Fix it, or say why the change deliberately moved that behavior and update the test.\n',
  );
  process.exit(2);
});
