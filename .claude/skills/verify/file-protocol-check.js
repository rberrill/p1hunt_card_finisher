// Opens index.html straight from disk (file://) in headless Chrome or Edge and checks that the
// app still works there: no request leaves file:/blob:/data:, the stylesheet applies, the engine
// worker runs, the self-tests pass on the main thread and in the worker, and the console has no
// errors (CSP included).
//   node .claude/skills/verify/file-protocol-check.js        (CHROME=<path> picks the browser)
// Exit code 0 = pass, 1 = a check failed, 2 = no browser or it didn't start.
'use strict';
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { pathToFileURL } = require('url');

const root = path.resolve(__dirname, '../../..');
const BROWSER_PATHS = [
  process.env.CHROME,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
];
const executable = BROWSER_PATHS.find(candidate => candidate && fs.existsSync(candidate));
if (!executable) {
  console.error('No Chrome or Edge found; set CHROME=<path>.');
  process.exit(2);
}

const port = 9300 + Math.floor(Math.random() * 500);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'cf-file-check-'));
const target = pathToFileURL(path.join(root, 'index.html')).href + '?selftest=1';
const browser = spawn(executable, [
  '--headless=new',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profile}`,
  '--no-first-run',
  '--no-default-browser-check',
  'about:blank',
], { stdio: 'ignore' });
const sleep = durationMs => new Promise(resolve => setTimeout(resolve, durationMs));

// Runs in the page once the self-tests have finished: their counts, and whether the worker and
// the stylesheet are working.
const PAGE_SUMMARY = `(() => {
  const selftest = window.__selftest || {};
  const count = run => {
    if (!run) return 'none';
    return run.results.filter(test => test.pass).length + '/' + run.results.length;
  };
  return {
    main: count(selftest.main),
    worker: count(selftest.worker),
    passed: !!(selftest.main && selftest.main.passed && selftest.worker && selftest.worker.passed),
    workerFailed: !window.__straightener || window.__straightener.EngineWorker.failed,
    styled: getComputedStyle(document.body).margin === '0px',
  };
})()`;

// The first page target of the browser's DevTools endpoint, retrying while it starts.
async function findPage() {
  for (let attempt = 0; attempt < 50; attempt++) {
    try {
      const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      const page = targets.find(candidate => candidate.type === 'page');
      if (page) return page;
    } catch (error) {
      await sleep(200);
    }
  }
  return null;
}

// Collects console errors and network requests from DevTools Protocol events.
function recordEvent(message, requests, errors) {
  const { method, params } = message;
  if (method === 'Network.requestWillBeSent') requests.push(params.request.url);
  if (method === 'Runtime.exceptionThrown') errors.push(params.exceptionDetails.text);
  if (method === 'Runtime.consoleAPICalled' && params.type === 'error') {
    errors.push(params.args.map(arg => arg.value || arg.description).join(' '));
  }
  if (method === 'Log.entryAdded' && params.entry.level === 'error') errors.push(params.entry.text);
}

async function main() {
  const page = await findPage();
  if (!page) {
    console.error('The browser did not start.');
    return 2;
  }

  const socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.onopen = resolve;
    socket.onerror = reject;
  });
  let lastId = 0;
  const pending = new Map();
  const requests = [];
  const errors = [];
  socket.onmessage = event => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      pending.get(message.id)(message.result || {});
      pending.delete(message.id);
      return;
    }
    recordEvent(message, requests, errors);
  };
  const send = (method, params = {}) => new Promise(resolve => {
    pending.set(++lastId, resolve);
    socket.send(JSON.stringify({ id: lastId, method, params }));
  });
  const evaluate = async expression => {
    const response = await send('Runtime.evaluate', { expression, returnByValue: true });
    return (response.result || {}).value;
  };

  for (const domain of ['Network', 'Runtime', 'Log', 'Page']) await send(`${domain}.enable`);
  await send('Page.navigate', { url: target });
  let hasSelftest = null;
  for (let attempt = 0; attempt < 100 && !hasSelftest; attempt++) {
    await sleep(200);
    hasSelftest = await evaluate('window.__selftest ? true : null');
  }
  const summary = await evaluate(PAGE_SUMMARY) || {};
  socket.close();

  const offsite = requests.filter(url => !/^(file|blob|data):/.test(url));
  const checks = [
    ['Self-tests ran', !!hasSelftest, hasSelftest ? '' : 'window.__selftest never appeared'],
    ['Self-tests pass on main thread and in the worker', summary.passed,
      `main ${summary.main}, worker ${summary.worker}`],
    ['Engine worker running (not failed over)', summary.workerFailed === false,
      `failed: ${summary.workerFailed}`],
    ['Stylesheet applied', summary.styled, ''],
    ['No requests outside file:/blob:/data:', !offsite.length,
      offsite.length ? offsite.join(', ') : `${requests.length} local requests`],
    ['No console errors (CSP included)', !errors.length, errors.slice(0, 5).join(' | ')],
  ];
  for (const [name, pass, detail] of checks) {
    console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  |  ' + detail : ''}`);
  }
  return checks.every(check => check[1]) ? 0 : 1;
}

main()
  .catch(error => {
    console.error(error);
    return 2;
  })
  .then(async code => {
    browser.kill();
    await sleep(500);
    try {
      fs.rmSync(profile, { recursive: true, force: true });
    } catch (error) { /* the browser may still hold it; it's in the temp folder */ }
    process.exit(code);
  });
