// Currency tests: run with `node --test` from the project root.
//
// The budget is in HUF. Rates are typed by the user as "1 <currency> = x HUF"
// and always the current rate is used, so changing one updates every month.

const test = require('node:test');
const assert = require('node:assert');
const { makeXlsx } = require('../test-support/make-xlsx');
const { openApp, categories } = require('../test-support/fake-browser');

const HEADER = ['Огноо', 'Теллер', 'Орлого', 'Зарлага', 'Ханш', 'Харьцсан данс', null, 'Үлдэгдэл', 'Гүйлгээний утга'];
const tx = (time, moneyIn, moneyOut, description) => [time, '50', moneyIn, moneyOut, 1, null, null, 0, description];

// Amounts in MNT: October food 1000 and a 3000 transfer; November food 500 + 250 and 2000 in.
const STATEMENT = makeXlsx([
  HEADER,
  tx('2026-10-02 10:00:00', 0, 1000, 'P10 - Purchase 1 - CBA PRIMA / BUDAPEST'),
  tx('2026-10-03 11:00:00', 0, 3000, 'EB -Test-с илгээв'),
  tx('2026-11-02 10:00:00', 0, 500, 'CB - POS Purchase CBA GO:RO:G CSEMEGE'),
  tx('2026-11-03 10:00:00', 0, 250, 'CB - POS Purchase SPAR 0172'),
  tx('2026-11-05 10:00:00', 2000, 0, 'tsalin'),
]);

test('a typed expense in EUR is converted to HUF and keeps its own amount', () => {
  const app = openApp({ today: '2026-11-15' });
  app.setRate('EUR', '400');
  app.plan('food', '5000');
  app.addExpense('food', 10, 'EUR');
  // 10 EUR x 400 = 4000 HUF, under the 5000 plan.
  assert.strictEqual(app.saved().categories.food.actual, 4000);
  assert.deepStrictEqual(app.warnings(), []);
  assert.deepStrictEqual(app.historyRows(), [['2026-11-15 12:00:00', 'Food', '4000 (10 EUR)', 'typed', 'Delete']]);
  assert.deepStrictEqual(app.saved().entries[0],
    { time: '2026-11-15 12:00:00', category: 'food', amount: 10, currency: 'EUR', source: 'typed' });
});

test('changing a rate re-converts every month, past months too', () => {
  const app = openApp({ today: '2026-11-15', saved: {
    month: '2026-11', categories: categories(), rates: { EUR: 400 },
    entries: [{ time: '2026-11-03 09:00:00', category: 'food', amount: 10, currency: 'EUR', source: 'typed' }],
    pastMonths: [{ month: '2026-10', categories: categories(),
      entries: [{ time: '2026-10-03 09:00:00', category: 'gym', amount: 20, currency: 'EUR', source: 'typed' }] }],
  } });
  const row = (label) => app.reportRows().find((r) => r[0] === label);
  assert.deepStrictEqual(row('Food'), ['Food', '0', '4000']);
  assert.deepStrictEqual(row('Gym'), ['Gym', '8000', '0']);

  app.setRate('EUR', '410');
  // 10 x 410 = 4100 and 20 x 410 = 8200.
  assert.strictEqual(app.saved().categories.food.actual, 4100);
  assert.deepStrictEqual(row('Food'), ['Food', '0', '4100']);
  assert.deepStrictEqual(row('Gym'), ['Gym', '8200', '0']);
});

test('statement amounts are converted from MNT, including transfers and money in', async () => {
  const app = openApp({ today: '2026-11-15' });
  app.setRate('MNT', '0.1');
  await app.importFile(STATEMENT);
  const row = (label) => app.reportRows().find((r) => r[0] === label);
  // October 1000 MNT -> 100 HUF; November 500 + 250 = 750 MNT -> 75 HUF.
  assert.deepStrictEqual(row('Food'), ['Food', '100', '75']);
  assert.strictEqual(app.saved().categories.food.actual, 75);
  // Transfers 3000 MNT -> 300 HUF; money in 2000 MNT -> 200 HUF.
  assert.deepStrictEqual(row('Transfers out (statement, not counted)'), ['Transfers out (statement, not counted)', '300', '0']);
  assert.deepStrictEqual(row('Money in (statement, not counted)'), ['Money in (statement, not counted)', '0', '200']);
  assert.deepStrictEqual(app.historyRows()[0], ['2026-11-03 10:00:00', 'Food', '25 (250 MNT)', 'statement', 'Delete']);
});

test('without a rate, imported amounts are not lost: they wait, with a warning, until the rate is typed', async () => {
  const app = openApp({ today: '2026-11-15' });
  await app.importFile(STATEMENT);
  assert.strictEqual(app.saved().categories.food.actual, 0);
  assert.strictEqual(app.shown('rate-warning'),
    'Not counted yet: 3 entries in MNT. Enter the MNT rate under "Exchange rates".');
  assert.deepStrictEqual(app.historyRows()[0], ['2026-11-03 10:00:00', 'Food', '? (250 MNT)', 'statement', 'Delete']);

  app.setRate('MNT', '0.1');
  assert.strictEqual(app.saved().categories.food.actual, 75);
  assert.strictEqual(app.shown('rate-warning'), '');
});

test('an expense in a currency with no rate is not added, and the user is told why', () => {
  const app = openApp({ today: '2026-11-15' });
  app.addExpense('food', 20, 'USD');
  assert.deepStrictEqual(app.saved().entries, []);
  assert.strictEqual(app.shown('expense-message'),
    'Enter the USD rate under "Exchange rates" first; the expense was not added.');
});

test('a rate keeps all its decimals and is saved for the next visit', () => {
  const app = openApp({ today: '2026-11-15' });
  app.setRate('MNT', '0.1087');
  app.addExpense('food', 1000, 'MNT');
  // 1000 x 0.1087 = 108.7, not 1000 x 0.11 = 110.
  assert.strictEqual(app.saved().categories.food.actual, 108.7);
  const again = openApp({ today: '2026-11-15', saved: app.saved() });
  assert.strictEqual(again.saved().rates.MNT, 0.1087);
  assert.strictEqual(again.saved().categories.food.actual, 108.7);
});

test('saved before currencies existed: statement entries were MNT, everything else HUF', () => {
  const app = openApp({ today: '2026-11-15', saved: {
    month: '2026-11', categories: categories(), rates: { MNT: 0.1 },
    entries: [
      { time: '2026-11-02 10:00:00', category: 'food', amount: 1000, source: 'statement' },
      { time: '2026-11-03 10:00:00', category: 'food', amount: 50, source: 'typed' },
    ],
  } });
  // 1000 MNT x 0.1 = 100, plus 50 HUF.
  assert.strictEqual(app.saved().categories.food.actual, 150);
  assert.deepStrictEqual(app.saved().entries.map((e) => e.currency), ['MNT', 'HUF']);
});
