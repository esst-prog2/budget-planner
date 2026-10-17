// Budget setup and expense tests: run with `node --test` from the project root.
//
// The first tests are the README/spec examples; the rest guard the bugs found
// in the HW6 correctness review (REVIEW.md, section 2).

const test = require('node:test');
const assert = require('node:assert');
const { openApp, categories } = require('../test-support/fake-browser');

function enterReadmeMustPays(app) {
  app.type('income-input', '1200');
  app.type('rent-input', '650');
  app.type('phone-input', '20');
  app.type('transport-input', '49');
}

test('spec: income 1200 and must-pays 650 + 20 + 49 leave 481 to plan', () => {
  const app = openApp();
  enterReadmeMustPays(app);
  assert.strictEqual(app.shown('left-to-plan'), '481');
});

test('spec: food plan 200, spent 190, a 25 expense warns "Food: 15 over plan"', () => {
  const app = openApp();
  app.plan('food', '200');
  app.addExpense('food', 190);
  assert.deepStrictEqual(app.warnings(), []);
  app.addExpense('food', 25);
  assert.deepStrictEqual(app.warnings(), ['Food: 15 over plan']);
});

test('no warning when spending is exactly on plan', () => {
  const app = openApp();
  app.plan('goingOut', '50');
  app.addExpense('goingOut', 50);
  assert.deepStrictEqual(app.warnings(), []);
});

test('cents add up exactly: 0.1 + 0.2 + 0.3 against a plan of 0.6 is not over plan', () => {
  const app = openApp();
  app.plan('food', '0.6');
  ['0.1', '0.2', '0.3'].forEach((amount) => app.addExpense('food', amount));
  assert.strictEqual(app.saved().categories.food.actual, 0.6);
  assert.deepStrictEqual(app.warnings(), []);
});

test('negative or non-numeric amounts count as 0', () => {
  const app = openApp();
  app.type('income-input', '-500');
  app.type('rent-input', 'abc');
  app.plan('food', '-20');
  app.addExpense('food', -30);
  const state = app.saved();
  assert.strictEqual(state.income, 0);
  assert.strictEqual(state.mustPays.rent, 0);
  assert.strictEqual(state.categories.food.plan, 0);
  assert.strictEqual(state.categories.food.actual, 0);
});

test('saved data with missing fields loads instead of crashing', () => {
  const app = openApp({ today: '2026-10-15', saved: { month: '2026-10', income: 1200 } });
  const state = app.saved();
  assert.strictEqual(state.income, 1200);
  assert.deepStrictEqual(state.mustPays, { rent: 0, phone: 0, transport: 0 });
  assert.deepStrictEqual(state.categories, categories());
  assert.strictEqual(app.shown('left-to-plan'), '1200');
});
