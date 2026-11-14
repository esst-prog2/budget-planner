// Input history and monthly report tests: run with `node --test` from the project root.
//
// The clock is frozen at noon on the chosen day, so a typed expense is saved
// with the time "<day> 12:00:00".

const test = require('node:test');
const assert = require('node:assert');
const { openApp, categories } = require('../test-support/fake-browser');

const MUST_PAYS = { rent: 650, phone: 20, transport: 49 }; // 719 in total

test('a typed expense is saved with its time, category, amount and source, newest first', async () => {
  const app = await openApp({ today: '2026-11-15' });
  app.addExpense('food', 25);
  app.addExpense('goingOut', 12.5);
  assert.deepStrictEqual(app.historyRows(), [
    ['2026-11-15 12:00:00', 'Going out', '12.50', 'typed', 'Delete'],
    ['2026-11-15 12:00:00', 'Food', '25', 'typed', 'Delete'],
  ]);
  assert.deepStrictEqual(app.saved().entries, [
    { time: '2026-11-15 12:00:00', category: 'food', amount: 25, currency: 'HUF', source: 'typed' },
    { time: '2026-11-15 12:00:00', category: 'goingOut', amount: 12.5, currency: 'HUF', source: 'typed' },
  ]);
});

test('deleting an entry recalculates the totals, the warning and the report', async () => {
  const app = await openApp({ today: '2026-11-15' });
  app.plan('food', '200');
  app.addExpense('food', 190);
  app.addExpense('food', 25);
  const foodCell = () => app.reportRows().find((r) => r[0] === 'Food')[1];
  const foodClass = () => app.reportClasses()[app.reportRows().findIndex((r) => r[0] === 'Food')][1];
  assert.deepStrictEqual(app.warnings(), ['Food: 15 over plan']);
  assert.strictEqual(foodCell(), '215 / 200');
  assert.strictEqual(foodClass(), 'over');

  app.deleteHistoryRow(0); // the 25, newest
  assert.strictEqual(app.saved().categories.food.actual, 190);
  assert.deepStrictEqual(app.warnings(), []);
  assert.strictEqual(foodCell(), '190 / 200');
  assert.strictEqual(foodClass(), '');
  assert.deepStrictEqual(app.historyRows(), [['2026-11-15 12:00:00', 'Food', '190', 'typed', 'Delete']]);
});

test('at the month change the finished month is kept and can be looked at, but not changed', async () => {
  const app = await openApp({ today: '2026-11-02', saved: {
    month: '2026-10', carryOver: 0, income: 1200, mustPays: MUST_PAYS, categories: categories(),
    entries: [
      { time: '2026-10-03 09:00:00', category: 'food', amount: 200, source: 'typed' },
      { time: '2026-10-20 18:30:00', category: 'goingOut', amount: 100, source: 'typed' },
    ],
  } });
  const state = app.saved();
  // 1200 - 719 - 300 = 181, as before the history existed.
  assert.strictEqual(state.carryOver, 181);
  assert.deepStrictEqual(state.entries, []);
  assert.deepStrictEqual(state.pastMonths.map((m) => m.month), ['2026-10']);
  assert.strictEqual(state.pastMonths[0].entries.length, 2);

  app.showHistoryMonth('2026-10');
  assert.deepStrictEqual(app.historyRows(), [
    ['2026-10-20 18:30:00', 'Going out', '100', 'typed'],
    ['2026-10-03 09:00:00', 'Food', '200', 'typed'],
  ]);
  assert.match(app.historyNotes()[0], /cannot be deleted/);

  const rows = app.reportRows();
  const row = (label) => rows.find((r) => r[0] === label);
  assert.deepStrictEqual(rows[0], ['', '2026-10', '2026-11']);
  assert.deepStrictEqual(row('Spending'), ['Spending', '300', '0']);
  assert.deepStrictEqual(row('Income'), ['Income', '1200', '0']);
  assert.deepStrictEqual(row('Must-pays'), ['Must-pays', '719', '0']);
});

test('past months pile up in order, one per month change', async () => {
  const app = await openApp({ today: '2026-12-01', saved: {
    month: '2026-11', income: 500, categories: categories({ food: 50 }),
    pastMonths: [{ month: '2026-10', income: 400, categories: categories({ gym: 30 }) }],
  } });
  assert.deepStrictEqual(app.saved().pastMonths.map((m) => m.month), ['2026-10', '2026-11']);
  assert.deepStrictEqual(app.reportRows()[0], ['', '2026-10', '2026-11', '2026-12']);
});

test('spending saved before the history existed shows as one deletable entry per category', async () => {
  const app = await openApp({ today: '2026-11-15', saved: {
    month: '2026-11', income: 1200, categories: categories({ food: 40, gym: 15 }),
  } });
  assert.deepStrictEqual(app.historyRows(), [
    ['—', 'Food', '40', 'before history', 'Delete'],
    ['—', 'Gym', '15', 'before history', 'Delete'],
  ]);
  app.deleteHistoryRow(1); // Gym
  assert.strictEqual(app.saved().categories.gym.actual, 0);
  assert.strictEqual(app.saved().categories.food.actual, 40);
});

test('an old month saved before the history existed keeps its totals after the month change', async () => {
  const app = await openApp({ today: '2026-11-02', saved: {
    month: '2026-10', income: 1200, mustPays: MUST_PAYS, categories: categories({ food: 300 }),
  } });
  const october = app.saved().pastMonths[0];
  assert.strictEqual(october.categories.food.actual, 300);
  assert.deepStrictEqual(october.entries, [{ time: null, category: 'food', amount: 300, currency: 'HUF', source: 'earlier' }]);
  assert.strictEqual(app.saved().carryOver, 181);
});

test('a month with nothing recorded says so', async () => {
  const app = await openApp({ today: '2026-11-15' });
  assert.deepStrictEqual(app.historyRows(), []);
  assert.deepStrictEqual(app.historyNotes(), ['No expenses recorded in this month.']);
});

test('in the report, only spending over a plan that was set is red', async () => {
  const app = await openApp({ today: '2026-11-15' });
  app.plan('food', '100');
  app.addExpense('food', 150);
  app.addExpense('gym', 30); // no gym plan
  const classOf = (label) => app.reportClasses()[app.reportRows().findIndex((r) => r[0] === label)][1];
  assert.strictEqual(classOf('Food'), 'over');
  assert.strictEqual(classOf('Gym'), '');
});
