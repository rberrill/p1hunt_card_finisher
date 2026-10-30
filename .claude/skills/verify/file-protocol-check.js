// Opens index.html straight from disk (file://) in headless Chrome or Edge and checks that the app still
// works there: no request leaves file:/blob:/data:, the stylesheet applies, the engine worker runs, the
// self-tests pass on the main thread and in the worker, and the console has no errors (CSP included).
//   node .claude/skills/verify/file-protocol-check.js        (CHROME=<path> picks the browser)
// Exit code 0 = pass, 1 = a check failed, 2 = no browser or it didn't start.
'use strict';
const { spawn } = require('child_process');
const fs = require('fs'), os = require('os'), path = require('path');
const { pathToFileURL } = require('url');

const root = path.resolve(__dirname, '../../..');
const exe = [process.env.CHROME,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome', '/usr/bin/chromium'].find(p => p && fs.existsSync(p));
if (!exe) { console.error('No Chrome or Edge found; set CHROME=<path>.'); process.exit(2); }

const port = 9300 + Math.floor(Math.random() * 500);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'cf-file-check-'));
const target = pathToFileURL(path.join(root, 'index.html')).href + '?selftest=1';
const browser = spawn(exe, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
  '--no-first-run', '--no-default-browser-check', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  let page;
  for (let i = 0; i < 50 && !page; i++) {
    try { page = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(t => t.type === 'page'); }
    catch (e) { await sleep(200); }
  }
  if (!page) { console.error('The browser did not start.'); return 2; }

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let id = 0; const pending = new Map(), requests = [], errors = [];
  ws.onmessage = ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result || {}); pending.delete(m.id); return; }
    if (m.method === 'Network.requestWillBeSent') requests.push(m.params.request.url);
    if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.text);
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push(m.params.args.map(a => a.value || a.description).join(' '));
    if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') errors.push(m.params.entry.text);
  };
  const send = (method, params = {}) => new Promise(res => { pending.set(++id, res); ws.send(JSON.stringify({ id, method, params })); });
  const evaluate = async expr => ((await send('Runtime.evaluate', { expression: expr, returnByValue: true })).result || {}).value;

  for (const d of ['Network', 'Runtime', 'Log', 'Page']) await send(`${d}.enable`);
  await send('Page.navigate', { url: target });
  let st = null;
  for (let i = 0; i < 100 && !st; i++) { await sleep(200); st = await evaluate('window.__selftest ? true : null'); }
  const r = await evaluate(`(() => { const s = window.__selftest || {}, n = x => x ? x.results.filter(t => t.pass).length + '/' + x.results.length : 'none';
    return { main: n(s.main), worker: n(s.worker), passed: !!(s.main && s.main.passed && s.worker && s.worker.passed),
      workerFailed: !window.__straightener || window.__straightener.EngineWorker.failed,
      styled: getComputedStyle(document.body).margin === '0px' }; })()`) || {};
  ws.close();

  const offsite = requests.filter(u => !/^(file|blob|data):/.test(u));
  const checks = [
    ['Self-tests ran', !!st, st ? '' : 'window.__selftest never appeared'],
    ['Self-tests pass on main thread and in the worker', r.passed, `main ${r.main}, worker ${r.worker}`],
    ['Engine worker running (not failed over)', r.workerFailed === false, `failed: ${r.workerFailed}`],
    ['Stylesheet applied', r.styled, ''],
    ['No requests outside file:/blob:/data:', !offsite.length, offsite.length ? offsite.join(', ') : `${requests.length} local requests`],
    ['No console errors (CSP included)', !errors.length, errors.slice(0, 5).join(' | ')],
  ];
  for (const [name, pass, detail] of checks) console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  |  ' + detail : ''}`);
  return checks.every(c => c[1]) ? 0 : 1;
}

main().catch(e => { console.error(e); return 2; }).then(async code => {
  browser.kill();
  await sleep(500);
  try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) { /* the browser may still hold it; it's in the temp folder */ }
  process.exit(code);
});
