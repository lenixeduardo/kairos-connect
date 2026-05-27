// KairOS Connect — servidor local (sem dependências externas)
const http  = require('http');
const fs    = require('fs');
const path  = require('path');
const { exec } = require('child_process');

const PORT = parseInt(process.env.PORT || '3000', 10);
const DIST = path.join(__dirname, 'dist');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.ico':  'image/x-icon',
  '.json': 'application/json',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
};

function openBrowser(url) {
  const cmd =
    process.platform === 'win32'  ? `start "" "${url}"` :
    process.platform === 'darwin' ? `open "${url}"` :
                                    `xdg-open "${url}"`;
  exec(cmd);
}

http.createServer((req, res) => {
  const urlPath = req.url.split('?')[0];
  let file = path.normalize(path.join(DIST, urlPath));

  if (!file.startsWith(DIST)) { res.writeHead(403); res.end(); return; }

  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    file = path.join(DIST, 'index.html');
  }

  const type = MIME[path.extname(file)] || 'application/octet-stream';
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': type });
    res.end(data);
  });

}).listen(PORT, '127.0.0.1', () => {
  const url = `http://localhost:${PORT}`;
  console.log('');
  console.log('  ╔══════════════════════════════════════╗');
  console.log('  ║                                      ║');
  console.log('  ║   KairOS Connect  ●  Iniciado        ║');
  console.log('  ║                                      ║');
  console.log(`  ║   Acesse: ${url}      ║`);
  console.log('  ║   Ctrl+C para encerrar               ║');
  console.log('  ║                                      ║');
  console.log('  ╚══════════════════════════════════════╝');
  console.log('');
  setTimeout(() => openBrowser(url), 800);
});
