// Income in several currencies: each income is its own entry (a scholarship in
// HUF, family aid in MNT, EUR or USD), converted at the month's rate and added up.

const test = require('node:test');
const assert = require('node:assert');
const { openApp } = require('../test-support/fake-browser');
const { CSV_COLUMNS } = require('../csv-data');

const RATES = { MNT: 0.1, EUR: 400, USD: 360 };

test('a scholarship in HUF and family aid in MNT and EUR add up to the month\'s income', async () => {
  const app = await openApp({ today: '2026-11-14', liveRates: RATES });
  app.addIncome(120000, 'HUF', 'Scholarship');
  app.addIncome(500000, 'MNT', 'Family');
  app.addIncome(100, 'EUR', 'Grandma');
  // 120000 + 500000 x 0.1 + 100 x 400 = 210000.
  assert.strictEqual(app.saved().income, 210000);
  assert.strictEqual(app.shown('income-total'), '210000');
  assert.strictEqual(app.shown('left-to-plan'), '210000');
  assert.deepStrictEqual(app.incomeRows(), [
    ['Scholarship', '120000', 'Delete'],
    ['Family', '50000 (500000 MNT)', 'Delete'],
    ['Grandma', '40000 (100 EUR)', 'Delete'],
  ]);
});

test('an income in a currency without a rate is not added, and the user is told why', async () => {
  const app = await openApp({ today: '2026-11-14' });
  app.addIncome(200, 'USD', 'Uncle');
  assert.strictEqual(app.saved().income, 0);
  assert.deepStrictEqual(app.incomeRows(), []);
  assert.strictEqual(app.shown('income-message'),
    'Enter the USD rate under "Exchange rates" first; the income was not added.');
});

test('deleting an income lowers the total and what is left to plan', async () => {
  const app = await openApp({ today: '2026-11-14', liveRates: RATES });
  app.addIncome(120000, 'HUF', 'Scholarship');
  app.addIncome(500000, 'MNT', 'Family');
  app.deleteIncome(0);
  assert.strictEqual(app.saved().income, 50000);
  assert.strictEqual(app.shown('left-to-plan'), '50000');
});

test('a new rate re-converts this month\'s income; a finished month keeps its own', async () => {
  const october = await openApp({ today: '2026-10-20', liveRates: RATES, liveRatesDay: '2026-10-20' });
  october.addIncome(1000000, 'MNT', 'Family');
  const app = await openApp({ today: '2026-11-14', csv: october.csv(), liveRates: { ...RATES, MNT: 0.12 } });
  app.addIncome(1000000, 'MNT', 'Family');
  const row = app.reportRows().find((r) => r[0] === 'Income');
  // October 1000000 x 0.1; November 1000000 x 0.12.
  assert.deepStrictEqual(row, ['Income', '100000', '120000']);
});

test('incomes are saved in the CSV, names with commas included, and come back', async () => {
  const app = await openApp({ today: '2026-11-14', liveRates: RATES });
  app.addIncome(120000, 'HUF', 'Scholarship, Stipendium Hungaricum');
  app.addIncome(300, 'USD', 'Family');
  assert.match(app.csv(), /^income,2026-11,"Scholarship, Stipendium Hungaricum",,2026-11-14 12:00:00,,120000,HUF,\r$/m);
  const again = await openApp({ today: '2026-11-14', csv: app.csv(), liveRates: RATES });
  assert.deepStrictEqual(again.saved().incomes, app.saved().incomes);
  assert.strictEqual(again.saved().income, 228000);
});

test('income saved as one number (older files and browser data) becomes one HUF income', async () => {
  const fromBrowser = await openApp({ today: '2026-11-14', saved: { month: '2026-11', income: 1000000 } });
  assert.deepStrictEqual(fromBrowser.saved().incomes,
    [{ time: null, label: '', amount: 1000000, currency: 'HUF' }]);
  assert.deepStrictEqual(fromBrowser.incomeRows(), [['Income', '1000000', 'Delete']]);

  const csv = [CSV_COLUMNS.join(','), 'current,2026-11,,,,,,,', 'month,2026-11,income,300000,,,,,', ''].join('\r\n');
  const fromFile = await openApp({ today: '2026-11-14', csv });
  assert.strictEqual(fromFile.saved().income, 300000);
  assert.strictEqual(fromFile.saved().incomes.length, 1);
});

test('a past month in the history lists its incomes', async () => {
  const october = await openApp({ today: '2026-10-20', liveRates: RATES, liveRatesDay: '2026-10-20' });
  october.addIncome(120000, 'HUF', 'Scholarship');
  october.addIncome(500000, 'MNT', 'Family');
  const app = await openApp({ today: '2026-11-14', csv: october.csv(), liveRates: RATES });
  app.showHistoryMonth('2026-10');
  const inputs = app.monthInputs();
  assert.strictEqual(inputs.Income, '170000');
  assert.strictEqual(inputs['  Scholarship'], '120000');
  assert.strictEqual(inputs['  Family'], '50000 (500000 MNT)');
});
