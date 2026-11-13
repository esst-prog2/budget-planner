// Shared by the tests: runs the real app.js with a fake server (the CSV file),
// a fake localStorage, a fake document, and (optionally) a clock frozen on a
// chosen day.

const fs = require('fs');
const path = require('path');
const { csvToState } = require('../csv-data');

// In the order of index.html; `started` lets openApp wait until the budget is loaded.
const APP_SOURCE = ['statement.js', 'csv-data.js', 'app.js']
  .map((file) => fs.readFileSync(path.join(__dirname, '..', file), 'utf8'))
  .join('\n') + '\nreturn started;';
const STORAGE_KEY = 'budgetPlanner:v1';
const CATEGORY_KEYS = ['food', 'clothes', 'gym', 'subscriptions', 'goingOut', 'other', 'unknown'];

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

function fakeResponse(status, text) {
  return Promise.resolve({ ok: status >= 200 && status < 300, status, text: async () => text });
}

// Opens the app; resolves once the saved budget is loaded.
// - csv: the text of budget-data.csv; without it there is no file yet.
// - saved: the budget kept in the browser before the CSV file (a string is
//   stored as it is, to fake text that is not valid JSON).
// - server: false when the server is not running.
// - failSaves / failBackup: the server answers saves / the backup with an error.
// `today` (e.g. '2026-10-02') freezes the clock; without it the real date is used.
async function openApp({ today, saved, csv, server = true, failSaves = false, failBackup = false } = {}) {
  const store = {};
  if (saved) store[STORAGE_KEY] = typeof saved === 'string' ? saved : JSON.stringify(saved);
  const localStorage = {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => { store[key] = value; },
  };

  let file = csv === undefined ? null : csv;
  const backups = [];
  const fetch = (url, options = {}) => {
    if (!server) return Promise.reject(new TypeError('Failed to fetch'));
    const method = options.method || 'GET';
    if (url === '/api/data' && method === 'GET') return file === null ? fakeResponse(404, '') : fakeResponse(200, file);
    if (url === '/api/data' && method === 'PUT') {
      if (failSaves) return fakeResponse(500, '');
      file = options.body;
      return fakeResponse(200, 'saved');
    }
    if (url === '/api/data/unreadable' && method === 'PUT') {
      if (failBackup) return fakeResponse(500, '');
      backups.push(options.body);
      return fakeResponse(200, 'budget-data.unreadable-20261015-120000.csv');
    }
    return fakeResponse(404, '');
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

  await new Function('localStorage', 'document', 'Date', 'fetch', APP_SOURCE)(localStorage, document, FakeDate, fetch);
  // Lets the answers to the first saves arrive.
  await new Promise((resolve) => setImmediate(resolve));

  const byId = (id) => document.getElementById(id);
  return {
    // The budget as read back from budget-data.csv.
    saved: () => csvToState(file),
    // The text of budget-data.csv; null while there is none.
    csv: () => file,
    // Copies of unreadable files the server was asked to keep.
    backups: () => [...backups],
    // Lets the answers to the saves so far arrive.
    settle: () => new Promise((resolve) => setImmediate(resolve)),
    // Every text stored in the browser, by key, to check nothing the user saved went missing.
    storedAll: () => ({ ...store }),
    shown: (id) => byId(id).textContent,
    type: (id, value) => byId(id).handlers.input({ target: { value } }),
    plan(category, value) {
      const input = byId(`plan-${category}`);
      input.value = value;
      input.handlers.input();
    },
    // currency is left as the app set it (HUF) unless given.
    addExpense(category, amount, currency) {
      byId('expense-category').value = category;
      byId('expense-amount').value = String(amount);
      if (currency) byId('expense-currency').value = currency;
      byId('add-expense-btn').handlers.click();
    },
    // Types `value` as the HUF rate for one unit of `code` (MNT, EUR or USD).
    setRate(code, value) {
      const input = byId(`rate-${code}`);
      input.value = value;
      input.handlers.input({ target: input });
    },
    // Picks `bytes` in the statement file input; resolves once it is imported.
    importFile: (bytes) => byId('statement-input').handlers.change({
      target: { files: [{ arrayBuffer: async () => bytes }] },
    }),
    // The monthly report table as rows of cell texts.
    reportRows: () => byId('monthly-report').children
      .map((row) => row.children.map((cell) => cell.textContent)),
    // The class of each report cell, e.g. 'over' for a red one.
    reportClasses: () => byId('monthly-report').children
      .map((row) => row.children.map((cell) => cell.className)),
    // Picks a month in the history.
    showHistoryMonth: (month) => byId('history-month').handlers.change({ target: { value: month } }),
    // The history rows as [time, category, amount, source(, 'Delete')].
    historyRows: () => byId('history-list').children
      .filter((child) => child.className === 'history-row')
      .map((row) => row.children.map((cell) => cell.textContent)),
    historyNotes: () => byId('history-list').children
      .filter((child) => child.className === 'hint')
      .map((child) => child.textContent),
    // Clicks Delete on the history row at `index` (0 is the top row).
    deleteHistoryRow(index) {
      const row = byId('history-list').children.filter((child) => child.className === 'history-row')[index];
      row.children.find((child) => child.className === 'delete-btn').handlers.click();
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
