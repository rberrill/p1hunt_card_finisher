// Playwright reporter: when a run ends, gathers every case's verdicts into results.json and
// writes summary.md (the build, the environment, a pass and fail table), then deletes old run
// folders beyond the newest ten. Folders under runs/kept/ are never deleted.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { runFolder, buildInfo } = require('./run-folder.js');

const root = path.resolve(__dirname, '../../..');
const RUNS_TO_KEEP = 10;
const BYTES_PER_MB = 1048576;

// Every file under a folder, as full paths.
function filesUnder(folder) {
  if (!fs.existsSync(folder)) return [];
  return fs.readdirSync(folder, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(folder, entry.name);
    return entry.isDirectory() ? filesUnder(file) : [file];
  });
}

// The cases' result files, read and sorted by case then target.
function readResults(runDir) {
  return filesUnder(path.join(runDir, 'results'))
    .map(file => JSON.parse(fs.readFileSync(file, 'utf8')))
    .sort((first, second) => (first.caseId + first.target).localeCompare(
      second.caseId + second.target,
    ));
}

// One Markdown table line per case and target.
function resultLines(results) {
  return results.map(result => {
    const eyeCount = result.verdicts.filter(verdict => verdict.status === 'eye').length;
    const failed = result.verdicts.find(verdict => verdict.status === 'fail');
    const detail = failed ? `step ${failed.step}: ${failed.found}` : '';
    const note = [result.bug, detail].filter(Boolean).join(' ');
    const verdictText = `${result.verdicts.length}${eyeCount ? ` (${eyeCount} to judge)` : ''}`;
    return `| ${result.caseId} | ${result.target} | ${result.status} | ${verdictText} `
      + `| ${(result.durationMs / 1000).toFixed(1)} s | ${note.replace(/\|/g, '/')} |`;
  });
}

// The whole summary file's text.
function summaryText(runDir, results, wallClockMs) {
  const { version, commit, isDirty } = buildInfo(root);
  const knownCount = results.filter(result => result.status === 'known defect').length;
  const failedCount = results
    .filter(result => result.status !== 'passed' && result.status !== 'known defect').length;
  const screenshots = filesUnder(path.join(runDir, 'evidence'));
  const megabytes = filesUnder(runDir)
    .reduce((total, file) => total + fs.statSync(file).size, 0) / BYTES_PER_MB;
  const playwrightVersion = require('@playwright/test/package.json').version;
  return [
    `# Test run ${path.basename(runDir)}`,
    '',
    `- **Build:** ${version}, commit ${commit}${isDirty ? ' with uncommitted changes' : ''}`,
    `- **Result:** ${results.length - failedCount - knownCount} passed, ${failedCount} failed, `
      + `${knownCount} known defects, of ${results.length} case runs`,
    `- **Time:** ${(wallClockMs / 1000).toFixed(1)} s wall clock`,
    `- **Evidence:** ${screenshots.length} screenshots; the run folder is `
      + `${megabytes.toFixed(1)} MB`,
    `- **Environment:** Playwright ${playwrightVersion}, Node ${process.version}, `
      + `${os.type()} ${os.release()}`,
    '',
    '| Case | Target | Result | Verdicts | Time | Failure |',
    '| --- | --- | --- | --- | --- | --- |',
    ...resultLines(results),
    '',
  ].join('\n');
}

// Deletes the oldest run folders, keeping the newest ten and everything under kept/.
function pruneRuns(runsDir) {
  const runs = fs.readdirSync(runsDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && entry.name !== 'kept')
    .map(entry => entry.name)
    .sort();
  for (const name of runs.slice(0, Math.max(0, runs.length - RUNS_TO_KEEP))) {
    fs.rmSync(path.join(runsDir, name), { recursive: true, force: true });
  }
}

class RunReporter {
  // Notes when the run started.
  onBegin() {
    this.startedAt = Date.now();
  }

  // Writes results.json and summary.md, then prunes old runs.
  onEnd() {
    const runDir = runFolder(root);
    if (!fs.existsSync(runDir)) return;
    const results = readResults(runDir);
    fs.writeFileSync(path.join(runDir, 'results.json'), JSON.stringify(results, null, 2));
    const summary = summaryText(runDir, results, Date.now() - this.startedAt);
    fs.writeFileSync(path.join(runDir, 'summary.md'), summary);
    pruneRuns(path.dirname(runDir));
    console.log(`\nRun folder: ${runDir}`);
  }
}

module.exports = RunReporter;
