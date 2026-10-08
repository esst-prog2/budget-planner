// Full-month test: run with `node --test` from the project root.
//
// Enters every row of test/full-month-planted.csv (a made-up month, cash
// included) through the app's "Add expense" button, then compares the category
// totals with the totals the user counted by hand. The expected numbers below
// come from that hand count, not from running the app.

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const APP_SOURCE = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const STORAGE_KEY = 'budgetPlanner:v1';

// Counted by hand by the user (see PLANNING_LOG.md, 2026-10-09).
const EXPECTED = {
  food: 13360,
  goingOut: 4500,
  gym: 60000,
  subscriptions: 20000,
  clothes: 15000,
  other: 13500,
};

function fakeElement() {
  return {
    value: '',
    textContent: '',
    innerHTML: '',
    className: '',
    style: {},
    handlers: {},
    addEventListener(type, handler) { this.handlers[type] = handler; },
    appendChild() {},
    setAttribute() {},
  };
}

function openEmptyApp() {
  const store = {};
  const localStorage = {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => { store[key] = value; },
  };
  const elements = {};
  const document = {
    getElementById: (id) => elements[id] || (elements[id] = fakeElement()),
    createElement: () => fakeElement(),
  };
  new Function('localStorage', 'document', APP_SOURCE)(localStorage, document);

  return {
    saved: () => JSON.parse(store[STORAGE_KEY]),
    addExpense(category, amount) {
      document.getElementById('expense-category').value = category;
      document.getElementById('expense-amount').value = String(amount);
      document.getElementById('add-expense-btn').handlers.click();
    },
  };
}

function readPlantedMonth() {
  const lines = fs.readFileSync(path.join(__dirname, 'full-month-planted.csv'), 'utf8')
    .trim().split(/\r?\n/).slice(1);
  return lines.map((line) => {
    const [category, amount, cash] = line.split(',');
    return { category, amount: Number(amount), cash: cash === 'yes' };
  });
}

test('planted month includes cash expenses', () => {
  assert.ok(readPlantedMonth().some((row) => row.cash));
});

test('a full month, cash included, lands in the categories counted by hand', () => {
  const app = openEmptyApp();
  readPlantedMonth().forEach((row) => app.addExpense(row.category, row.amount));

  const { categories } = app.saved();
  for (const [key, total] of Object.entries(EXPECTED)) {
    assert.strictEqual(categories[key].actual, total, `${key} total`);
  }
});

test('Other stays under the one-third line from the spike', () => {
  const app = openEmptyApp();
  readPlantedMonth().forEach((row) => app.addExpense(row.category, row.amount));

  const { categories } = app.saved();
  const total = Object.values(categories).reduce((sum, c) => sum + c.actual, 0);
  assert.ok(categories.other.actual / total < 1 / 3, 'Other share of money');
});
