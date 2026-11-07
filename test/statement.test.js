// Bank statement import and report tests: run with `node --test` from the project root.
//
// The statement is a made-up one built in memory (test-support/make-xlsx.js),
// laid out like the real deposit statement: a title block, a header row,
// one row per transaction and a total row at the end.

const test = require('node:test');
const assert = require('node:assert');
const { makeXlsx } = require('../test-support/make-xlsx');
const { openApp } = require('../test-support/fake-browser');
const { readStatement, buildReport, categoryFor } = require('../statement');

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

test('shop names pick the category; everything unknown is Other', () => {
  assert.strictEqual(categoryFor('CB - POS Purchase CBA GO:RO:G CSEMEGE.BUDAPEST'), 'food');
  assert.strictEqual(categoryFor('P10 - Purchase CBAPRIMACORVIN - CBA PRI\'MA CORVIN'), 'food');
  assert.strictEqual(categoryFor('P10 - Purchase 3 - DECATHLON NYUGATI TE\'R'), 'clothes');
  assert.strictEqual(categoryFor('BURGER KING EMKE / BUDAPEST'), 'goingOut');
  // GYM inside LA'GYMA'NYOS is not a gym.
  assert.strictEqual(categoryFor("LA'GYMA'NYOS CAMPUS / BUDAPEST"), 'other');
  assert.strictEqual(categoryFor('13148888:POS Normal Purchase'), 'other');
});

test('report per month: spending by category, transfers and money in kept apart', async () => {
  const report = buildReport(await readStatement(STATEMENT));
  assert.deepStrictEqual(report.map((m) => m.month), ['2026-10', '2026-11']);
  const [october, november] = report;
  // October: food 120, other 45 -> 165; the 300 sent to a person is a transfer.
  assert.deepStrictEqual(october.categories, { food: 120, clothes: 0, gym: 0, subscriptions: 0, goingOut: 0, other: 45 });
  assert.strictEqual(october.spending, 165);
  assert.strictEqual(october.transfers, 300);
  assert.strictEqual(october.moneyIn, 1000);
  // November: food 80 + 50.5 = 130.5, clothes 25, other 30 + 0.25 fee = 30.25 -> 185.75.
  assert.deepStrictEqual(november.categories, { food: 130.5, clothes: 25, gym: 0, subscriptions: 0, goingOut: 0, other: 30.25 });
  assert.strictEqual(november.spending, 185.75);
  assert.strictEqual(november.transfers, 0);
  assert.strictEqual(november.moneyIn, 500);
});

test('import adds only this month\'s purchases and fees to the actual spending', async () => {
  const app = openApp({ today: '2026-11-15' });
  app.plan('food', '100');
  app.plan('clothes', '50');
  app.plan('other', '50');
  app.addExpense('food', 10);
  await app.importFile(STATEMENT);

  const state = app.saved();
  // 10 typed by hand + 130.5 from the statement.
  assert.strictEqual(state.categories.food.actual, 140.5);
  assert.strictEqual(state.categories.clothes.actual, 25);
  assert.strictEqual(state.categories.other.actual, 30.25);
  // October is in the report only, so nothing from it lands in November.
  assert.strictEqual(state.categories.goingOut.actual, 0);
  assert.deepStrictEqual(app.warnings(), ['Food: 40.50 over plan']);
  assert.strictEqual(app.shown('statement-status'),
    'Read 10 transactions (2026-10 to 2026-11). Added 5 purchases from 2026-11 to this month\'s actual spending.');
});

test('importing the same statement twice does not count it twice', async () => {
  const app = openApp({ today: '2026-11-15' });
  await app.importFile(STATEMENT);
  await app.importFile(STATEMENT);
  assert.strictEqual(app.saved().categories.food.actual, 130.5);
  assert.match(app.shown('statement-status'), /Nothing new from 2026-11/);
});

test('the report table shows one column per month and is saved for the next visit', async () => {
  const app = openApp({ today: '2026-11-15' });
  await app.importFile(STATEMENT);
  const rows = app.reportRows();
  assert.deepStrictEqual(rows[0], ['', '2026-10', '2026-11']);
  assert.deepStrictEqual(rows[1], ['Food', '120', '130.50']);
  assert.deepStrictEqual(rows.find((r) => r[0] === 'Spending'), ['Spending', '165', '185.75']);
  assert.deepStrictEqual(rows.find((r) => r[0].startsWith('Transfers')), ['Transfers out (not counted)', '300', '0']);
  const saved = JSON.parse(app.storedAll()['budgetPlanner:v1:report']);
  assert.strictEqual(saved.length, 2);
});

test('a file that is not a statement changes nothing and says so', async () => {
  const app = openApp({ today: '2026-11-15' });
  app.addExpense('food', 10);
  await app.importFile(Buffer.from('not a spreadsheet'));
  assert.strictEqual(app.saved().categories.food.actual, 10);
  assert.match(app.shown('statement-status'), /could not be read/);
  assert.deepStrictEqual(app.reportRows(), []);
});
