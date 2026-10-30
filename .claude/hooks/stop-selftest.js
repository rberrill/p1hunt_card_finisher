// Stop hook: when app code or tests have uncommitted changes, run node tests/selftest.js before Claude
// finishes a turn. A failure blocks the stop (exit 2) and sends the failing checks back to Claude.
'use strict';
const { execFileSync, spawnSync } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '../..');
let input = '';
process.stdin.on('data', d => { input += d; });
process.stdin.on('end', () => {
  let hook = {};
  try { hook = JSON.parse(input || '{}'); } catch (e) { /* no input */ }
  if (hook.stop_hook_active) process.exit(0); // already blocked once this turn; don't loop

  let changed = '';
  try { changed = execFileSync('git', ['status', '--porcelain', '--', 'js', 'css', 'tests', 'index.html'], { cwd: root, encoding: 'utf8' }); }
  catch (e) { process.exit(0); } // not a git checkout; nothing to compare
  if (!changed.trim()) process.exit(0);

  const run = spawnSync(process.execPath, [path.join(root, 'tests', 'selftest.js')], { cwd: root, encoding: 'utf8' });
  if (run.status === 0) process.exit(0);
  const fails = (run.stdout || '').split('\n').filter(l => l.startsWith('FAIL')).join('\n');
  process.stderr.write(`node tests/selftest.js failed after this turn's changes:\n${fails || run.stderr || run.stdout}\nFix it, or say why the change deliberately moved that behavior and update the test.\n`);
  process.exit(2);
});
