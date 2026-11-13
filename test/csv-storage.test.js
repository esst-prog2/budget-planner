// The budget is saved in budget-data.csv through the server: what is written,
// what is read back, and what happens when the file or the server is not right.

const test = require('node:test');
const assert = require('node:assert');
const { openApp } = require('../test-support/fake-browser');
const { stateToCsv, csvToState, CSV_COLUMNS } = require('../csv-data');

// A budget kept in the browser before the CSV file, with a past month, a
// statement purchase in MNT and statement ids that need quoting in CSV.
const BROWSER_BUDGET = {
  month: '2026-11',
  carryOver: -38000,
  income: 1000000,
  mustPays: { rent: 150000, phone: 12000, transport: 1000 },
  categories: { food: { plan: 40000 } },
  entries: [
    { time: '2026-11-03 09:15:00', category: 'food', amount: 5000, currency: 'HUF', source: 'typed' },
    { time: '2026-11-04 18:00:00', category: 'unknown', amount: 24000, currency: 'MNT', source: 'statement' },
  ],
  importedIds: ['2026-11-04 18:00:00|24000', 'a "quoted", id'],
  transfers: 100000,
  moneyIn: 0,
  pastMonths: [{
    month: '2026-10',
    income: 300000,
    entries: [{ time: null, category: 'gym', amount: 9000, currency: 'HUF', source: 'earlier' }],
  }],
  rates: { MNT: 0.11, EUR: 0, USD: 0 },
};

test('the budget kept in the browser moves into budget-data.csv when there is no file yet', async () => {
  const app = await openApp({ today: '2026-11-15', saved: BROWSER_BUDGET });
  const state = app.saved();
  assert.strictEqual(state.income, 1000000);
  assert.strictEqual(state.carryOver, -38000);
  assert.deepStrictEqual(state.mustPays, { rent: 150000, phone: 12000, transport: 1000 });
  assert.strictEqual(state.categories.food.plan, 40000);
  assert.deepStrictEqual(state.entries, BROWSER_BUDGET.entries);
  assert.deepStrictEqual(state.importedIds, BROWSER_BUDGET.importedIds);
  assert.strictEqual(state.categories.unknown.actual, 2640);
  assert.deepStrictEqual(state.pastMonths.map((m) => [m.month, m.income, m.entries.length]), [['2026-10', 300000, 1]]);
  assert.strictEqual(state.rates.MNT, 0.11);
  // The browser's copy is left as it was.
  assert.deepStrictEqual(JSON.parse(app.storedAll()['budgetPlanner:v1']), BROWSER_BUDGET);
});

test('reopening from budget-data.csv shows the same budget, history and report', async () => {
  const first = await openApp({ today: '2026-11-15', saved: BROWSER_BUDGET });
  first.addExpense('food', 2500);
  const again = await openApp({ today: '2026-11-15', csv: first.csv() });
  assert.deepStrictEqual(again.saved(), first.saved());
  assert.strictEqual(again.shown('left-to-plan'), formatLeft(first.saved()));
  assert.deepStrictEqual(again.historyRows(), first.historyRows());
  assert.deepStrictEqual(again.reportRows(), first.reportRows());
});

function formatLeft(state) {
  const { rent, phone, transport } = state.mustPays;
  return String(state.carryOver + state.income - rent - phone - transport);
}

test('with a budget-data.csv the browser\'s old copy is not used', async () => {
  const fromFile = await openApp({ today: '2026-11-15', saved: { month: '2026-11', income: 1200 } });
  const app = await openApp({ today: '2026-11-15', csv: fromFile.csv(), saved: BROWSER_BUDGET });
  assert.strictEqual(app.saved().income, 1200);
});

test('every change is written to the file at once', async () => {
  const app = await openApp({ today: '2026-11-15' });
  app.type('income-input', '300000');
  assert.strictEqual(app.saved().income, 300000);
  app.addExpense('food', 90000);
  assert.match(app.csv(), /^entry,2026-11,,,2026-11-15 12:00:00,food,90000,HUF,typed\r$/m);
});

test('a new month moves the finished one into the file\'s history', async () => {
  const october = await openApp({ today: '2026-10-20', saved: { month: '2026-10', income: 1000 } });
  october.addExpense('food', 300);
  const app = await openApp({ today: '2026-11-02', csv: october.csv() });
  const state = app.saved();
  assert.strictEqual(state.month, '2026-11');
  assert.strictEqual(state.carryOver, 700);
  assert.deepStrictEqual(state.pastMonths.map((m) => m.month), ['2026-10']);
});

test('an unreadable budget-data.csv is copied before it is replaced, and the user is told', async () => {
  const app = await openApp({ today: '2026-10-15', csv: 'not,a\nbudget' });
  assert.deepStrictEqual(app.backups(), ['not,a\nbudget']);
  assert.match(app.shown('load-warning'), /could not be read.*budget-data\.unreadable-20261015-120000\.csv/);
  assert.strictEqual(app.saved().income, 0);
});

test('if the copy cannot be made, the unreadable file is left as it is', async () => {
  const app = await openApp({ today: '2026-10-15', csv: '{broken', failBackup: true });
  app.type('income-input', '500');
  assert.strictEqual(app.csv(), '{broken');
  assert.match(app.shown('load-warning'), /left as it is/);
});

test('without the server the user is told how to start it, and nothing is saved', async () => {
  const app = await openApp({ today: '2026-10-15', server: false });
  app.type('income-input', '500');
  assert.match(app.shown('load-warning'), /node server\.js/);
  assert.strictEqual(app.csv(), null);
});

test('a failed save is shown until a later save works', async () => {
  const app = await openApp({ today: '2026-10-15', failSaves: true });
  app.type('income-input', '500');
  await app.settle();
  assert.match(app.shown('save-warning'), /could not be saved/);
});

test('CSV text: quotes, commas, a BOM from Excel, and a file that is not a budget', () => {
  const state = {
    month: '2026-11', carryOver: 0, income: 0, mustPays: { rent: 0, phone: 0, transport: 0 },
    categories: { food: { plan: 0, actual: 0 } }, entries: [], importedIds: ['a,"b"\nc'],
    transfers: 0, moneyIn: 0, pastMonths: [], rates: { MNT: 0 },
  };
  const text = stateToCsv(state);
  assert.ok(text.startsWith(`${CSV_COLUMNS.join(',')}\r\n`));
  assert.deepStrictEqual(csvToState(text).importedIds, ['a,"b"\nc']);
  assert.deepStrictEqual(csvToState(`﻿${text}`).importedIds, ['a,"b"\nc']);
  assert.strictEqual(csvToState('hello'), null);
  assert.strictEqual(csvToState(`${CSV_COLUMNS.join(',')}\r\n`), null);
  assert.strictEqual(csvToState(`${CSV_COLUMNS.join(',')}\r\nentry,"2026-11`), null);
});
