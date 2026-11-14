// The demo's made-up statement, demo/sample-statement.xlsx: it must stay
// readable by the app and show what the demo says it shows.

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { makeXlsx } = require('../test-support/make-xlsx');
const { readStatement } = require('../statement');
const { openApp } = require('../test-support/fake-browser');
const { makeRows } = require('../demo/make-sample-statement');

const FILE = path.join(__dirname, '..', 'demo', 'sample-statement.xlsx');

test('the committed sample statement is the one the script makes', () => {
  assert.ok(fs.readFileSync(FILE).equals(makeXlsx(makeRows())), 'run: node demo/make-sample-statement.js');
});

test('the sample statement has 30 transactions from August to November, in Food, Going out and Unknown', async () => {
  const transactions = await readStatement(fs.readFileSync(FILE));
  assert.strictEqual(transactions.length, 30);
  assert.deepStrictEqual([...new Set(transactions.map((t) => t.month))], ['2026-08', '2026-09', '2026-10', '2026-11']);
  const count = (kind, category) => transactions.filter((t) => t.kind === kind && t.category === category).length;
  assert.strictEqual(count('spending', 'food'), 8);
  assert.strictEqual(count('spending', 'goingOut'), 7);
  assert.strictEqual(count('spending', 'unknown'), 6);
  assert.strictEqual(count('spending', 'other'), 2);
  assert.strictEqual(transactions.filter((t) => t.kind === 'transfer').length, 2);
  assert.strictEqual(transactions.filter((t) => t.kind === 'in').length, 5);
});

test('importing the sample statement fills the report with one column per month from August', async () => {
  const app = await openApp({ today: '2026-12-01' });
  app.setRate('MNT', '0.11');
  await app.importFile(fs.readFileSync(FILE));
  assert.match(app.shown('statement-status'), /^Read 30 transactions \(2026-08 to 2026-11\)\./);
  const rows = app.reportRows();
  assert.deepStrictEqual(rows[0], ['', '2026-08', '2026-09', '2026-10', '2026-11', '2026-12']);
  // August's food: 42000 + 55300 MNT at 0.11 HUF.
  assert.strictEqual(rows.find((r) => r[0] === 'Food')[1], '10703');
});
