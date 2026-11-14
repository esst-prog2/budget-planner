// server.js on a free port with its data file in a temporary folder.

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { createServer } = require('../server');

async function startServer() {
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'budget-server-'));
  const dataFile = path.join(folder, 'budget-data.csv');
  const server = createServer({ root: path.join(__dirname, '..'), dataFile });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const request = (url, options) => fetch(base + url, options);
  const stop = () => new Promise((resolve) => server.close(resolve));
  return { folder, dataFile, request, stop };
}

const save = (text, number, page = 'p1') => ({
  method: 'PUT', body: text, headers: { 'X-Page': page, 'X-Save-Number': String(number) },
});

test('the budget is saved to the file and read back', async (t) => {
  const s = await startServer();
  t.after(s.stop);
  assert.strictEqual((await s.request('/api/data')).status, 404);
  assert.strictEqual((await s.request('/api/data', save('first', 1))).status, 200);
  assert.strictEqual(fs.readFileSync(s.dataFile, 'utf8'), 'first');
  assert.strictEqual(await (await s.request('/api/data')).text(), 'first');
});

test('a save that arrives after a newer one does not undo it', async (t) => {
  const s = await startServer();
  t.after(s.stop);
  await s.request('/api/data', save('newer', 2));
  await s.request('/api/data', save('older', 1));
  assert.strictEqual(fs.readFileSync(s.dataFile, 'utf8'), 'newer');
  // Another tab counts on its own.
  await s.request('/api/data', save('other tab', 1, 'p2'));
  assert.strictEqual(fs.readFileSync(s.dataFile, 'utf8'), 'other tab');
});

test('an unreadable file is kept as a copy next to the budget', async (t) => {
  const s = await startServer();
  t.after(s.stop);
  const response = await s.request('/api/data/unreadable', { method: 'PUT', body: '{broken' });
  const name = await response.text();
  assert.match(name, /^budget-data\.unreadable-\d{8}-\d{6}\.csv$/);
  assert.strictEqual(fs.readFileSync(path.join(s.folder, name), 'utf8'), '{broken');
});

test('serves the app, but not the data, hidden files or folders above it', async (t) => {
  const s = await startServer();
  t.after(s.stop);
  const home = await s.request('/');
  assert.strictEqual(home.status, 200);
  assert.match(await home.text(), /Budget Planner/);
  assert.strictEqual((await s.request('/app.js')).status, 200);
  for (const url of ['/budget-data.csv', '/.git/config', '/..%2fREADME.md', '/%2e%2e/x.js', '/test/server.test.js']) {
    assert.strictEqual((await s.request(url)).status, 404, url);
  }
});

test('a request for another host name is refused', async (t) => {
  const s = await startServer();
  t.after(s.stop);
  const http = require('http');
  const port = Number(new URL((await s.request('/')).url).port);
  const status = await new Promise((resolve, reject) => {
    http.get({ host: '127.0.0.1', port, path: '/api/data', headers: { Host: 'evil.example' } }, (res) => {
      res.resume();
      resolve(res.statusCode);
    }).on('error', reject);
  });
  assert.strictEqual(status, 403);
});
