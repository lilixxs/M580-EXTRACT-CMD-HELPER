const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const entry = path.join(__dirname, '..', 'dist', 'index.html');
if (!fs.existsSync(entry)) throw new Error('Run npm run build before starting the test server');

http.createServer((request, response) => {
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(405, { Allow: 'GET, HEAD' });
    response.end();
    return;
  }
  const pathname = new URL(request.url, 'http://127.0.0.1').pathname;
  if (!['/', '/index.html'].includes(pathname)) {
    response.writeHead(404);
    response.end();
    return;
  }
  response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  response.end(request.method === 'HEAD' ? undefined : fs.readFileSync(entry));
}).listen(4173, '127.0.0.1', () => console.log('Test server: http://127.0.0.1:4173'));
