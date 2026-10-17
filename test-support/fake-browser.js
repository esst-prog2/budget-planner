// Shared by the tests: runs the real app.js with a fake localStorage, a fake
// document, and (optionally) a clock frozen on a chosen day.

const fs = require('fs');
const path = require('path');

const APP_SOURCE = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const STORAGE_KEY = 'budgetPlanner:v1';
const CATEGORY_KEYS = ['food', 'clothes', 'gym', 'subscriptions', 'goingOut', 'other'];

function fakeElement(register) {
  return {
    // Elements the app creates and gives an id can be found by getElementById.
    set id(id) { if (register) register(id, this); },
    value: '',
    textContent: '',
    className: '',
    style: {},
    handlers: {},
    children: [],
    // The app clears a list with `innerHTML = ''` before drawing it again.
    set innerHTML(html) { if (html === '') this.children = []; },
    addEventListener(type, handler) { this.handlers[type] = handler; },
    appendChild(child) { this.children.push(child); },
    setAttribute() {},
  };
}

// Opens the app with `saved` as the stored data. `today` (e.g. '2026-10-02')
// freezes the clock; without it the real date is used.
function openApp({ today, saved } = {}) {
  const store = {};
  if (saved) store[STORAGE_KEY] = JSON.stringify(saved);
  const localStorage = {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => { store[key] = value; },
  };

  const elements = {};
  const document = {
    getElementById: (id) => elements[id] || (elements[id] = fakeElement()),
    createElement: () => fakeElement((id, element) => { elements[id] = element; }),
  };

  let FakeDate = Date;
  if (today) {
    const frozenNow = new Date(`${today}T12:00:00`);
    FakeDate = class extends Date {
      constructor(...args) { super(...(args.length ? args : [frozenNow])); }
    };
  }

  new Function('localStorage', 'document', 'Date', APP_SOURCE)(localStorage, document, FakeDate);

  const byId = (id) => document.getElementById(id);
  return {
    saved: () => JSON.parse(store[STORAGE_KEY]),
    shown: (id) => byId(id).textContent,
    type: (id, value) => byId(id).handlers.input({ target: { value } }),
    plan(category, value) {
      const input = byId(`plan-${category}`);
      input.value = value;
      input.handlers.input();
    },
    addExpense(category, amount) {
      byId('expense-category').value = category;
      byId('expense-amount').value = String(amount);
      byId('add-expense-btn').handlers.click();
    },
    // The texts of the red over-plan warnings currently on the screen.
    warnings: () => byId('category-summary-list').children
      .flatMap((row) => row.children)
      .filter((child) => child.className === 'warning')
      .map((child) => child.textContent),
  };
}

function categories(spent = {}) {
  return Object.fromEntries(CATEGORY_KEYS.map((k) => [k, { plan: 0, actual: spent[k] || 0 }]));
}

module.exports = { openApp, categories };
