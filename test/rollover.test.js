// Rollover tests: run with `node --test` from the project root.
//
// app.js is a plain browser script, so each test runs the real file with a
// fake localStorage, a fake document, and a clock frozen on a chosen month.

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const APP_SOURCE = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const STORAGE_KEY = 'budgetPlanner:v1';

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

// Opens the app on `today` (e.g. '2026-10-02') with `saved` as the stored data.
function openApp(today, saved) {
  const store = {};
  if (saved) store[STORAGE_KEY] = JSON.stringify(saved);
  const localStorage = {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => { store[key] = value; },
  };

  const elements = {};
  const document = {
    getElementById: (id) => elements[id] || (elements[id] = fakeElement()),
    createElement: () => fakeElement(),
  };

  const frozenNow = new Date(`${today}T12:00:00`);
  class FrozenDate extends Date {
    constructor(...args) { super(...(args.length ? args : [frozenNow])); }
  }

  new Function('localStorage', 'document', 'Date', APP_SOURCE)(localStorage, document, FrozenDate);

  return {
    saved: () => JSON.parse(store[STORAGE_KEY]),
    shown: (id) => document.getElementById(id).textContent,
    type: (id, value) => document.getElementById(id).handlers.input({ target: { value } }),
  };
}

function categories(spent = {}) {
  const keys = ['food', 'clothes', 'gym', 'subscriptions', 'goingOut', 'other'];
  return Object.fromEntries(keys.map((k) => [k, { plan: 0, actual: spent[k] || 0 }]));
}

const MUST_PAYS = { rent: 650, phone: 20, transport: 49 }; // 719 in total

test('same month: nothing is reset', () => {
  const app = openApp('2026-10-15', {
    month: '2026-10', carryOver: 50, income: 1200, mustPays: MUST_PAYS, categories: categories({ food: 10 }),
  });
  const state = app.saved();
  assert.strictEqual(state.month, '2026-10');
  assert.strictEqual(state.carryOver, 50);
  assert.strictEqual(state.income, 1200);
  assert.deepStrictEqual(state.mustPays, MUST_PAYS);
  assert.strictEqual(state.categories.food.actual, 10);
});

test('new month: leftover becomes the carry-over and everything else is empty', () => {
  const app = openApp('2026-10-01', {
    month: '2026-09', carryOver: 0, income: 1200, mustPays: MUST_PAYS,
    categories: categories({ food: 200, goingOut: 100 }),
  });
  const state = app.saved();
  // 1200 - 719 - 300 = 181
  assert.strictEqual(state.month, '2026-10');
  assert.strictEqual(state.carryOver, 181);
  assert.strictEqual(state.income, 0);
  assert.deepStrictEqual(state.mustPays, { rent: 0, phone: 0, transport: 0 });
  assert.deepStrictEqual(state.categories, categories());
  assert.strictEqual(app.shown('carry-over'), '181');
});

test('entering the new income keeps the carry-over', () => {
  const app = openApp('2026-10-01', {
    month: '2026-09', carryOver: 0, income: 1200, mustPays: MUST_PAYS, categories: categories({ food: 300 }),
  });
  app.type('income-input', '1200');
  const state = app.saved();
  assert.strictEqual(state.income, 1200);
  assert.strictEqual(state.carryOver, 181);
  assert.strictEqual(app.shown('left-to-plan'), '1381');
});

test('carry-over keeps rolling forward across months', () => {
  const app = openApp('2026-10-01', {
    month: '2026-09', carryOver: 181, income: 1200, mustPays: MUST_PAYS, categories: categories({ food: 300 }),
  });
  // 181 + 1200 - 719 - 300 = 362
  assert.strictEqual(app.saved().carryOver, 362);
});

test('overspending carries over as a negative amount, not clamped at zero', () => {
  const app = openApp('2026-10-01', {
    month: '2026-09', carryOver: 0, income: 500, mustPays: MUST_PAYS, categories: categories({ food: 100 }),
  });
  // 500 - 719 - 100 = -319
  assert.strictEqual(app.saved().carryOver, -319);
  assert.strictEqual(app.shown('left-to-plan'), '-319');
});

test('skipped months: one leftover from the last saved month, then jump to today', () => {
  const app = openApp('2026-12-05', {
    month: '2026-09', carryOver: 0, income: 1200, mustPays: MUST_PAYS, categories: categories({ food: 300 }),
  });
  const state = app.saved();
  assert.strictEqual(state.month, '2026-12');
  assert.strictEqual(state.carryOver, 181);
});

test('year change: December rolls into January', () => {
  const app = openApp('2027-01-01', {
    month: '2026-12', carryOver: 0, income: 1000, mustPays: MUST_PAYS, categories: categories(),
  });
  const state = app.saved();
  assert.strictEqual(state.month, '2027-01');
  assert.strictEqual(state.carryOver, 281);
});

test('data saved before the carry-over existed still rolls over', () => {
  const app = openApp('2026-10-01', {
    month: '2026-09', income: 1200, mustPays: MUST_PAYS, categories: categories({ food: 300 }),
  });
  assert.strictEqual(app.saved().carryOver, 181);
});
