// A static file server for the test run: serves the repository's folder on 127.0.0.1.
//   node serve.js <port>
// It also serves the same files under /p1hunt_card_finisher/, the way GitHub Pages serves the
// app from a subfolder. No dependencies.
'use strict';
const fs = require('fs');
const http = require('http');
const path = require('path');

const root = path.resolve(__dirname, '../../..');
const port = Number(process.argv[2]) || 8770;
const SUBFOLDER = '/p1hunt_card_finisher/';

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
};

// The file a request path names, or null when it points outside the repository's folder.
function fileFor(requestPath) {
  let relative = decodeURIComponent(requestPath.split('?')[0]);
  if (relative.startsWith(SUBFOLDER)) relative = relative.slice(SUBFOLDER.length - 1);
  if (relative.endsWith('/')) relative += 'index.html';
  const file = path.join(root, relative);
  return file.startsWith(root) ? file : null;
}

http.createServer((request, response) => {
  const file = fileFor(request.url);
  if (!file || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    response.writeHead(404);
    response.end('Not found');
    return;
  }
  const type = CONTENT_TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream';
  response.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  fs.createReadStream(file).pipe(response);
}).listen(port, '127.0.0.1');
