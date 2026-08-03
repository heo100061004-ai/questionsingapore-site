const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const root = process.cwd();
const logPath = process.env.QS_SERVER_LOG || path.join(os.tmpdir(), 'qs-local-server.log');

function log(message) {
  try {
    fs.appendFileSync(logPath, `${new Date().toISOString()} ${message}\n`, 'utf8');
  } catch (error) {
    // Ignore logging failures so the server can still start.
  }
}

process.on('uncaughtException', (error) => {
  log(`uncaughtException: ${error && error.stack ? error.stack : error}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  log(`unhandledRejection: ${reason && reason.stack ? reason.stack : reason}`);
  process.exit(1);
});

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.txt': 'text/plain; charset=utf-8'
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');

  if (url.pathname === '/api/chatbot') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', async () => {
      try {
        const chatbotHandler = require('./api/chatbot');
        const parsed = body ? JSON.parse(body) : {};
        const request = { method: req.method, body: parsed, headers: req.headers };
        const response = {
          statusCode: 200,
          headers: {},
          status(code) {
            this.statusCode = code;
            return this;
          },
          json(payload) {
            this.headers['Content-Type'] = 'application/json; charset=utf-8';
            res.writeHead(this.statusCode, this.headers);
            res.end(JSON.stringify(payload));
          }
        };
        await chatbotHandler(request, response);
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: false, message: error.message }));
      }
    });
    return;
  }

  const pathname = url.pathname === '/' ? '/index.html' : url.pathname;
  const filePath = path.join(root, pathname);
  if (!filePath.startsWith(root)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });
});

const port = Number(process.env.PORT || 8000);
server.on('error', (error) => {
  log(`server error: ${error && error.stack ? error.stack : error}`);
});

server.listen(port, '0.0.0.0', () => {
  log(`Local server running at http://127.0.0.1:${port}`);
});
