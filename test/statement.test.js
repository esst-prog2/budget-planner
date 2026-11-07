// Bank statement import and report tests: run with `node --test` from the project root.
//
// The statement is a made-up one built in memory (test-support/make-xlsx.js),
// laid out like the real deposit statement: a title block, a header row,
// one row per transaction and a total row at the end.

const test = require('node:test');
const assert = require('node:assert');
const { makeXlsx } = require('../test-support/make-xlsx');
const { openApp } = require('../test-support/fake-browser');
const { readStatement, categoryFor, sortTransaction } = require('../statement');

const HEADER = ['Огноо', 'Теллер', 'Орлого', 'Зарлага', 'Ханш', 'Харьцсан данс', null, 'Үлдэгдэл', 'Гүйлгээний утга'];
const tx = (time, moneyIn, moneyOut, description) => [time, '50', moneyIn, moneyOut, 1, null, null, 0, description];

const STATEMENT = makeXlsx([
  [null, null, null, 'Депозит дансны хуулга'],
  ['Харилцагч:', 'TEST USER'],
  [],
  HEADER,
  tx('2026-10-01 09:00:00', 1000, 0, 'tsalin'),
  tx('2026-10-02 10:00:00', 0, 120, 'P10 - Purchase 1 Нэр/Хаана: 1 - CBA PRIMA / BUDAPEST'),
  tx('2026-10-03 11:00:00', 0, 300, 'EB -Test-с илгээв'),
  tx('2026-10-04 12:00:00', 0, 45, "P10 - Purchase 2 Нэр/Хаана: 2 - LA'GYMA'NYOS CAMPUS / BUDAPEST"),
  tx('2026-11-02 10:00:00', 0, 80, 'CB - POS Purchase CBA GO:RO:G CSEMEGE.BUDAPEST'),
  tx('2026-11-03 10:00:00', 0, 50.5, 'CB - POS Purchase Manna ABC - Mazsa Food'),
  tx('2026-11-03 10:00:01', 0, 30, '13148888:POS Normal Purchase'),
  tx('2026-11-03 10:00:01', 0, 0.25, 'EB -И-БАНК ГҮЙЛГЭЭНИЙ ШИМТГЭЛ'),
  tx('2026-11-04 10:00:00', 0, 25, 'P10 - Purchase 3 Нэр/Хаана: 3 - DECATHLON / BUDAPEST'),
  tx('2026-11-05 10:00:00', 500, 0, 'Test-с шилжүүлэв'),
  ['Нийт:', null, 1500, 650.75],
]);

test('reads every dated row of the statement and skips the title and total rows', async () => {
  const transactions = await readStatement(STATEMENT);
  assert.strictEqual(transactions.length, 10);
  const sum = (key) => transactions.reduce((total, t) => total + t[key], 0);
  // Same as the statement's own total row: 1500 in, 650.75 out.
  assert.strictEqual(sum('moneyIn'), 1500);
  assert.strictEqual(sum('moneyOut'), 650.75);
});

test('shop names pick the category; a shop that is not recognised is Unknown', () => {
  assert.strictEqual(categoryFor('CB - POS Purchase CBA GO:RO:G CSEMEGE.BUDAPEST'), 'food');
  assert.strictEqual(categoryFor('P10 - Purchase CBAPRIMACORVIN - CBA PRI\'MA CORVIN'), 'food');
  assert.strictEqual(categoryFor('P10 - Purchase 3 - DECATHLON NYUGATI TE\'R'), 'clothes');
  assert.strictEqual(categoryFor('BURGER KING EMKE / BUDAPEST'), 'goingOut');
  // GYM inside LA'GYMA'NYOS is not a gym.
  assert.strictEqual(categoryFor("LA'GYMA'NYOS CAMPUS / BUDAPEST"), 'unknown');
  assert.strictEqual(categoryFor('13148888:POS Normal Purchase'), 'unknown');
});

test('bank fees are known, so they go to Other, not Unknown', () => {
  const fee = { moneyIn: 0, moneyOut: 100, description: 'EB -И-БАНК ГҮЙЛГЭЭНИЙ ШИМТГЭЛ' };
  assert.deepStrictEqual(sortTransaction(fee), { kind: 'spending', category: 'other' });
});

test('import adds this month\'s purchases and fees to the budget, earlier ones to the history', async () => {
  const app = openApp({ today: '2026-11-15' });
  app.plan('food', '100');
  app.plan('clothes', '50');
  app.plan('other', '50');
  app.plan('unknown', '50');
  app.addExpense('food', 10);
  await app.importFile(STATEMENT);

  const state = app.saved();
  // 10 typed by hand + 130.5 from the statement.
  assert.strictEqual(state.categories.food.actual, 140.5);
  assert.strictEqual(state.categories.clothes.actual, 25);
  assert.strictEqual(state.categories.other.actual, 0.25);
  assert.strictEqual(state.categories.unknown.actual, 30);
  assert.deepStrictEqual(app.warnings(), ['Food: 40.50 over plan']);
  // October is kept as its own month: food 120, unknown 45; it does not touch November.
  assert.deepStrictEqual(state.pastMonths.map((m) => m.month), ['2026-10']);
  assert.strictEqual(state.pastMonths[0].categories.food.actual, 120);
  assert.strictEqual(state.pastMonths[0].categories.unknown.actual, 45);
  assert.strictEqual(state.carryOver, 0);
  assert.strictEqual(app.shown('statement-status'),
    'Read 10 transactions (2026-10 to 2026-11). Added 5 purchases to this month and 2 to earlier months in the history.');
});

test('report per month: spending by category, transfers and money in kept apart', async () => {
  const app = openApp({ today: '2026-11-15' });
  await app.importFile(STATEMENT);
  const rows = app.reportRows();
  const row = (label) => rows.find((r) => r[0] === label);
  assert.deepStrictEqual(rows[0], ['', '2026-10', '2026-11']);
  // October: food 120, unknown 45 -> 165; the 300 sent to a person is a transfer.
  // November: food 80 + 50.5 = 130.5, clothes 25, other 0.25 fee, unknown 30 -> 185.75.
  assert.deepStrictEqual(row('Food'), ['Food', '120', '130.50']);
  assert.deepStrictEqual(row('Clothes'), ['Clothes', '0', '25']);
  assert.deepStrictEqual(row('Other'), ['Other', '0', '0.25']);
  assert.deepStrictEqual(row('Unknown'), ['Unknown', '45', '30']);
  assert.deepStrictEqual(row('Spending'), ['Spending', '165', '185.75']);
  assert.deepStrictEqual(row('Transfers out (statement, not counted)'), ['Transfers out (statement, not counted)', '300', '0']);
  assert.deepStrictEqual(row('Money in (statement, not counted)'), ['Money in (statement, not counted)', '1000', '500']);
});

test('importing the same statement twice does not count it twice', async () => {
  const app = openApp({ today: '2026-11-15' });
  await app.importFile(STATEMENT);
  await app.importFile(STATEMENT);
  const state = app.saved();
  assert.strictEqual(state.categories.food.actual, 130.5);
  assert.strictEqual(state.pastMonths[0].categories.food.actual, 120);
  assert.strictEqual(state.pastMonths[0].transfers, 300);
  assert.match(app.shown('statement-status'), /Nothing new/);
});

test('a deleted statement purchase does not come back when the statement is imported again', async () => {
  const app = openApp({ today: '2026-11-15' });
  await app.importFile(STATEMENT);
  // Newest first: the top row is the 25 Decathlon purchase of 2026-11-04.
  assert.deepStrictEqual(app.historyRows()[0], ['2026-11-04 10:00:00', 'Clothes', '25', 'statement', 'Delete']);
  app.deleteHistoryRow(0);
  await app.importFile(STATEMENT);
  assert.strictEqual(app.saved().categories.clothes.actual, 0);
});

test('the report is kept for the next visit', async () => {
  const app = openApp({ today: '2026-11-15' });
  await app.importFile(STATEMENT);
  const again = openApp({ today: '2026-11-15', saved: app.saved() });
  assert.deepStrictEqual(again.reportRows(), app.reportRows());
});

test('a file that is not a statement changes nothing and says so', async () => {
  const app = openApp({ today: '2026-11-15' });
  app.addExpense('food', 10);
  await app.importFile(Buffer.from('not a spreadsheet'));
  assert.strictEqual(app.saved().categories.food.actual, 10);
  assert.match(app.shown('statement-status'), /could not be read/);
  assert.deepStrictEqual(app.reportRows()[0], ['', '2026-11']);
});
