// Serves the app and keeps the budget in budget-data.csv: `node server.js`,
// then open http://127.0.0.1:8765. No dependencies; Node.js 18 or newer.
//
//   GET  /api/data             the CSV file, or 404 while there is none
//   PUT  /api/data             replaces it with the request body
//   PUT  /api/data/unreadable  keeps a copy of a file the app could not read

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT) || 8765;
// Only this computer can reach the server, so nobody else can read the budget.
const HOST = '127.0.0.1';
const MAX_BODY = 10 * 1024 * 1024;

const STATIC_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
};

function send(res, status, body, type = 'text/plain; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY) {
        reject(new Error('too large'));
        req.destroy();
      } else {
        chunks.push(chunk);
      }
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

// Written to a temporary file first, then renamed, so a crash halfway never
// leaves a half-written budget.
function writeFileSafely(file, text) {
  const temp = `${file}.tmp`;
  fs.writeFileSync(temp, text, 'utf8');
  fs.renameSync(temp, file);
}

function timestamp() {
  return new Date().toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15);
}

// root: the folder with index.html; dataFile: where the budget is kept.
function createServer({ root = __dirname, dataFile = path.join(__dirname, 'budget-data.csv') } = {}) {
  // The newest save number written for each open page; an older save that
  // arrives late is skipped instead of undoing a newer one.
  const newestSave = new Map();

  return http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    // A web page on another address must not reach the budget by pointing its
    // own name at this computer.
    if (!/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(req.headers.host || '')) return send(res, 403, 'forbidden');
    try {
      if (url.pathname === '/api/data' && req.method === 'GET') {
        if (!fs.existsSync(dataFile)) return send(res, 404, 'no budget saved yet');
        return send(res, 200, fs.readFileSync(dataFile, 'utf8'), 'text/csv; charset=utf-8');
      }
      if (url.pathname === '/api/data' && req.method === 'PUT') {
        const text = await readBody(req);
        const page = req.headers['x-page'];
        const number = Number(req.headers['x-save-number']);
        if (page && Number.isFinite(number)) {
          if (number <= (newestSave.get(page) || 0)) return send(res, 200, 'skipped: a newer save was written');
          newestSave.set(page, number);
        }
        writeFileSafely(dataFile, text);
        return send(res, 200, 'saved');
      }
      if (url.pathname === '/api/data/unreadable' && req.method === 'PUT') {
        const text = await readBody(req);
        const name = `${path.basename(dataFile, '.csv')}.unreadable-${timestamp()}.csv`;
        writeFileSafely(path.join(path.dirname(dataFile), name), text);
        return send(res, 200, name);
      }
      if (req.method !== 'GET') return send(res, 405, 'not allowed');

      // The app's own files only: no folders above it, no data files, no .git.
      const name = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname.slice(1));
      const type = STATIC_TYPES[path.extname(name)];
      const file = path.join(root, name);
      if (!type || name.includes('..') || name.split(/[\\/]/).some((part) => part.startsWith('.'))
        || path.dirname(file) !== path.resolve(root) || !fs.existsSync(file)) {
        return send(res, 404, 'not found');
      }
      return send(res, 200, fs.readFileSync(file), type);
    } catch (err) {
      return send(res, err.message === 'too large' ? 413 : 500, 'could not save the budget');
    }
  });
}

if (require.main === module) {
  createServer().listen(PORT, HOST, () => {
    console.log(`Budget Planner: http://${HOST}:${PORT}  (data in budget-data.csv; Ctrl+C to stop)`);
  });
}

module.exports = { createServer };
