// Runs tests/sample-regression.js (R1 to R15) in a headless browser and prints its table.
//   node .claude/skills/verify/regression-check.js        (CHROME=<path> picks the browser)
// Exit code 0 = every check passed, 1 = a check failed, 2 = it could not run.
'use strict';
const path = require('path');
const { serveFolder, openBrowser } = require('./browser.js');

const root = path.resolve(__dirname, '../../..');
// Loads the regression script into the page (the CSP allows the site's own files) and waits
// for its result.
const RUN_REGRESSION = `(async () => {
  document.head.append(Object.assign(document.createElement('script'), {
    src: 'tests/sample-regression.js',
  }));
  while (!window.__regression) await new Promise(resolve => setTimeout(resolve, 100));
  const outcome = await window.__regression;
  return { passed: outcome.passed, results: outcome.results, scoreboard: outcome.scoreboard };
})()`;

async function main() {
  const server = await serveFolder(root);
  const browser = await openBrowser();
  try {
    await browser.setViewport(1280, 800);
    await browser.navigate(`http://127.0.0.1:${server.port}/index.html`);
    const outcome = await browser.evaluate(RUN_REGRESSION);
    for (const result of outcome.results) {
      console.log(`${result.pass ? 'PASS' : 'FAIL'}  ${result.name}  |  ${result.detail}`);
    }
    const passedCount = outcome.results.filter(result => result.pass).length;
    console.log(`\n${passedCount}/${outcome.results.length} passed`);
    console.log('R1 scoreboard: ' + JSON.stringify(outcome.scoreboard));
    if (browser.errors.length) {
      console.log('Console errors: ' + browser.errors.slice(0, 5).join(' | '));
    }
    return outcome.passed && !browser.errors.length ? 0 : 1;
  } finally {
    await browser.close();
    server.close();
  }
}

main()
  .catch(error => {
    console.error(error);
    return 2;
  })
  .then(code => process.exit(code));
