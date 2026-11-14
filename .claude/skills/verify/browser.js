// A headless Chrome or Edge driven over the DevTools Protocol, and a static file server, for the
// scripted checks in this folder (no dependencies; Node 22 or later for its WebSocket).
//   const { serveFolder, openBrowser } = require('./browser.js');
// CHROME=<path> picks the browser.
'use strict';
const { spawn } = require('child_process');
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');

const BROWSER_PATHS = [
  process.env.CHROME,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/opt/pw-browsers/chromium',
];
const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.json': 'application/json',
};
const sleep = durationMs => new Promise(resolve => setTimeout(resolve, durationMs));

// Serves `root` on a free local port. `prefix` mounts it under a subfolder ('/sub'), as GitHub
// Pages does. Resolves to { port, requests (every path asked for, with its status), close }.
function serveFolder(root, prefix = '') {
  const requests = [];
  const server = http.createServer((request, response) => {
    const urlPath = decodeURIComponent(request.url.split('?')[0]);
    const isInside = urlPath.startsWith(prefix + '/');
    const relative = isInside ? urlPath.slice(prefix.length) : '';
    const file = path.join(root, relative.endsWith('/') ? relative + 'index.html' : relative);
    const isServable = isInside && file.startsWith(root) && fs.existsSync(file)
      && fs.statSync(file).isFile();
    requests.push({ path: urlPath, status: isServable ? 200 : 404 });
    if (!isServable) {
      response.writeHead(404);
      response.end('not found');
      return;
    }
    const type = CONTENT_TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream';
    response.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' });
    fs.createReadStream(file).pipe(response);
  });
  return new Promise(resolve => {
    server.listen(0, '127.0.0.1', () => resolve({
      port: server.address().port,
      requests,
      close: () => server.close(),
    }));
  });
}

// The first page target of the browser's DevTools endpoint, retrying while it starts.
async function findPage(port) {
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

// Collects console errors and uncaught exceptions from DevTools Protocol events.
function recordError(message, errors) {
  const { method, params } = message;
  if (method === 'Runtime.exceptionThrown') {
    const details = params.exceptionDetails;
    errors.push(details.exception ? details.exception.description : details.text);
  }
  if (method === 'Runtime.consoleAPICalled' && params.type === 'error') {
    errors.push(params.args.map(arg => arg.value || arg.description).join(' '));
  }
  if (method === 'Log.entryAdded' && params.entry.level === 'error') errors.push(params.entry.text);
}

// Starts the browser and connects to its first page. Resolves to a session:
//   send(method, params)          a DevTools Protocol command
//   evaluate(expression)          runs it in the page (awaiting a promise) and returns its value
//   setViewport(width, height)    resizes; under 768 px wide it also emulates touch and a phone
//   navigate(url)                 loads the page and waits for its load event
//   errors                        console errors and exceptions so far (CSP included)
//   close()                       stops the browser and removes its profile
async function openBrowser() {
  const executable = BROWSER_PATHS.find(candidate => candidate && fs.existsSync(candidate));
  if (!executable) throw new Error('No Chrome or Edge found; set CHROME=<path>.');
  const port = 9300 + Math.floor(Math.random() * 500);
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'cf-check-'));
  const isRoot = typeof process.getuid === 'function' && process.getuid() === 0;
  const browser = spawn(executable, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    '--no-first-run',
    '--no-default-browser-check',
    // Chrome refuses to start as root with its sandbox (a container's only user is root).
    ...(isRoot ? ['--no-sandbox'] : []),
    'about:blank',
  ], { stdio: 'ignore' });
  const page = await findPage(port);
  if (!page) {
    browser.kill();
    throw new Error('The browser did not start.');
  }
  const socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.onopen = resolve;
    socket.onerror = reject;
  });
  let lastId = 0;
  const pending = new Map();
  const errors = [];
  let onLoad = null;
  socket.onmessage = event => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      pending.get(message.id)(message);
      pending.delete(message.id);
      return;
    }
    if (message.method === 'Page.loadEventFired' && onLoad) onLoad();
    recordError(message, errors);
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    pending.set(++lastId, message => {
      if (message.error) reject(new Error(`${method}: ${message.error.message}`));
      else resolve(message.result || {});
    });
    socket.send(JSON.stringify({ id: lastId, method, params }));
  });
  for (const domain of ['Runtime', 'Log', 'Page']) await send(`${domain}.enable`);

  const evaluate = async expression => {
    const response = await send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (response.exceptionDetails) {
      const details = response.exceptionDetails;
      throw new Error(details.exception ? details.exception.description : details.text);
    }
    return response.result.value;
  };
  const setViewport = async (width, height) => {
    const isPhone = width < 768;
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: isPhone ? 2 : 1,
      mobile: isPhone,
    });
    await send('Emulation.setTouchEmulationEnabled', { enabled: isPhone });
  };
  const navigate = async url => {
    const loaded = new Promise(resolve => {
      onLoad = resolve;
    });
    await send('Page.navigate', { url });
    await loaded;
    onLoad = null;
  };
  const close = async () => {
    socket.close();
    browser.kill();
    await sleep(300);
    try {
      fs.rmSync(profile, { recursive: true, force: true });
    } catch (error) { /* the browser may still hold it; it's in the temp folder */ }
  };
  return { send, evaluate, setViewport, navigate, errors, close };
}

// Prints PASS / FAIL lines for [name, pass, detail] checks; returns the exit code (0 = all pass).
function reportChecks(checks) {
  for (const [name, pass, detail] of checks) {
    console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  |  ' + detail : ''}`);
  }
  const failedCount = checks.filter(check => !check[1]).length;
  console.log(failedCount
    ? `\n${failedCount} of ${checks.length} FAILED`
    : `\n${checks.length}/${checks.length} passed`);
  return failedCount ? 1 : 0;
}

module.exports = { serveFolder, openBrowser, reportChecks, sleep };
