// The budget is saved in budget-data.csv by server.js (`node server.js`).
const DATA_URL = '/api/data';
// A data file that could not be read is copied here before it is overwritten.
const BACKUP_URL = '/api/data/unreadable';
// Before the CSV file the budget was kept in the browser under this key; it is
// moved into the file the first time the app runs without one.
const STORAGE_KEY = 'budgetPlanner:v1';
// Saved text that could not be read is moved here instead of being overwritten.
const BACKUP_KEY = 'budgetPlanner:v1:unreadable';

const CATEGORY_ORDER = ['food', 'clothes', 'gym', 'subscriptions', 'goingOut', 'other', 'unknown'];
const CATEGORY_LABELS = {
  food: 'Food',
  clothes: 'Clothes',
  gym: 'Gym',
  subscriptions: 'Subscriptions',
  goingOut: 'Going out',
  other: 'Other',
  unknown: 'Unknown',
};
// The budget is kept in HUF. An expense in another currency keeps its own
// amount and is converted with the rate the user typed, always the current one.
const BASE_CURRENCY = 'HUF';
const CURRENCIES = ['HUF', 'MNT', 'EUR', 'USD'];

// Where a history entry came from; "earlier" is spending saved before the
// history existed, kept as one entry per category.
const SOURCE_LABELS = {
  typed: 'typed',
  statement: 'statement',
  earlier: 'before history',
};

// Money is kept in whole cents so that 0.1 + 0.2 adds up to exactly 0.3.
function roundCents(value) {
  return Math.round(value * 100) / 100;
}

function getCurrentMonthStr() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
}

// Local date and time as "2026-11-15 12:00:00", the same form the statement uses.
function getNowStr() {
  const d = new Date();
  const two = (n) => String(n).padStart(2, '0');
  return `${getCurrentMonthStr()}-${two(d.getDate())} ${two(d.getHours())}:${two(d.getMinutes())}:${two(d.getSeconds())}`;
}

function makeEmptyCategories() {
  const categories = {};
  CATEGORY_ORDER.forEach((key) => {
    categories[key] = { plan: 0, actual: 0 };
  });
  return categories;
}

// One month of the budget. The current month is the state itself; finished
// months are kept in state.pastMonths.
function makeEmptyMonth(month) {
  return {
    month,
    carryOver: 0,
    // Money coming in this month: { time, label, amount, currency }, e.g. a
    // scholarship in HUF and family aid in MNT. income is their total in HUF.
    incomes: [],
    income: 0,
    mustPays: { rent: 0, phone: 0, transport: 0 },
    categories: makeEmptyCategories(),
    // Every expense of the month; each category's actual is the sum of its entries.
    entries: [],
    // Statement transactions already saved in this month.
    importedIds: [],
    // From imported statements: money sent to people or own accounts, and
    // money in. Shown in the report, not counted as spending.
    transfers: 0,
    moneyIn: 0,
    // HUF for one unit of each other currency, 0 while unknown. Each month has
    // its own: this month follows today's rates, a finished month keeps the
    // rates it ended with, so its totals do not change afterwards.
    rates: { MNT: 0, EUR: 0, USD: 0 },
  };
}

function makeEmptyState(month) {
  // typedRates: this month's currencies whose rate the user typed; those are
  // not replaced by today's rates. ratesDate: the day of the last rates fetched.
  return { ...makeEmptyMonth(month), pastMonths: [], typedRates: [], ratesDate: '' };
}

// The currencies that need a rate.
const RATE_CODES = CURRENCIES.filter((code) => code !== BASE_CURRENCY);

// Reads a rate the user typed; unlike money it is not rounded to cents
// (1 MNT is about a tenth of a forint).
function parseRate(text) {
  const value = parseFloat(text);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function rateOf(currency, rates) {
  return currency === BASE_CURRENCY ? 1 : rates[currency] || 0;
}

// The amount in HUF, or 0 while the currency has no rate yet.
function toHuf(amount, currency, rates) {
  return roundCents(amount * rateOf(currency, rates));
}

// Reads an amount the user typed; anything that is not a positive number counts as 0.
function parseAmount(text) {
  const value = parseFloat(text);
  return Number.isFinite(value) && value > 0 ? roundCents(value) : 0;
}

// Shows an amount with cents only when it has some: 481, but 12.5 -> 12.50.
function formatAmount(value) {
  return value.toFixed(2).replace(/\.00$/, '');
}

function numberOr(value, fallback) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

// The month's income and each category's actual spending in HUF, from its
// entries at the month's rates.
function recomputeTotals(record) {
  record.income = roundCents(record.incomes.reduce((sum, income) => sum + toHuf(income.amount, income.currency, record.rates), 0));
  CATEGORY_ORDER.forEach((key) => {
    const entries = record.entries.filter((entry) => entry.category === key);
    const total = entries.reduce((sum, entry) => sum + toHuf(entry.amount, entry.currency, record.rates), 0);
    record.categories[key].actual = roundCents(total);
  });
}

function isIncome(income) {
  return income && typeof income.amount === 'number' && Number.isFinite(income.amount) && income.amount > 0;
}

function isEntry(entry) {
  return entry && CATEGORY_ORDER.includes(entry.category)
    && typeof entry.amount === 'number' && Number.isFinite(entry.amount) && entry.amount > 0;
}

// A rate that is a positive number, else the fallback's, else 0.
function readRates(saved, fallback = {}) {
  const rates = {};
  RATE_CODES.forEach((code) => {
    const value = (saved || {})[code];
    rates[code] = numberOr(value, 0) > 0 ? value : numberOr(fallback[code], 0);
  });
  return rates;
}

// Copies one saved month onto a fresh one, so a missing or broken field becomes
// 0 instead of crashing the app. A month saved without rates (before each month
// had its own) gets fallbackRates, the rates that were used for every month then.
function normaliseMonth(parsed, fallbackMonth, fallbackRates) {
  const record = makeEmptyMonth(typeof parsed.month === 'string' ? parsed.month : fallbackMonth);
  record.rates = readRates(parsed.rates, fallbackRates);
  record.carryOver = numberOr(parsed.carryOver, 0);
  if (Array.isArray(parsed.incomes)) {
    record.incomes = parsed.incomes.filter(isIncome).map((income) => ({
      time: typeof income.time === 'string' ? income.time : null,
      label: typeof income.label === 'string' ? income.label.slice(0, 40) : '',
      amount: roundCents(income.amount),
      currency: CURRENCIES.includes(income.currency) ? income.currency : BASE_CURRENCY,
    }));
  } else if (numberOr(parsed.income, 0) > 0) {
    // Saved when income was one number in HUF: it becomes one entry.
    record.incomes = [{ time: null, label: '', amount: roundCents(parsed.income), currency: BASE_CURRENCY }];
  }
  const mustPays = parsed.mustPays || {};
  Object.keys(record.mustPays).forEach((key) => {
    record.mustPays[key] = numberOr(mustPays[key], 0);
  });
  const categories = parsed.categories || {};
  CATEGORY_ORDER.forEach((key) => {
    record.categories[key].plan = numberOr((categories[key] || {}).plan, 0);
  });
  if (Array.isArray(parsed.entries)) {
    record.entries = parsed.entries.filter(isEntry).map((entry) => ({
      time: typeof entry.time === 'string' ? entry.time : null,
      category: entry.category,
      amount: roundCents(entry.amount),
      // Saved before currencies existed: statement amounts were in the
      // statement's currency, everything else in HUF.
      currency: CURRENCIES.includes(entry.currency) ? entry.currency
        : entry.source === 'statement' ? STATEMENT_CURRENCY : BASE_CURRENCY,
      source: SOURCE_LABELS[entry.source] ? entry.source : 'typed',
    }));
  } else {
    // Saved before the history existed: each category total becomes one entry.
    CATEGORY_ORDER.forEach((key) => {
      const actual = numberOr((categories[key] || {}).actual, 0);
      if (actual > 0) {
        record.entries.push({ time: null, category: key, amount: actual, currency: BASE_CURRENCY, source: 'earlier' });
      }
    });
  }
  if (Array.isArray(parsed.importedIds)) {
    record.importedIds = parsed.importedIds.filter((id) => typeof id === 'string');
  }
  record.transfers = numberOr(parsed.transfers, 0);
  record.moneyIn = numberOr(parsed.moneyIn, 0);
  return record;
}

const byMonth = (a, b) => a.month.localeCompare(b.month);

function normaliseState(parsed) {
  const state = { ...makeEmptyState(getCurrentMonthStr()), ...normaliseMonth(parsed, getCurrentMonthStr()) };
  if (Array.isArray(parsed.pastMonths)) {
    state.pastMonths = parsed.pastMonths
      .filter((m) => m && typeof m === 'object' && typeof m.month === 'string')
      .map((m) => normaliseMonth(m, m.month, state.rates))
      .sort(byMonth);
  }
  if (Array.isArray(parsed.typedRates)) {
    state.typedRates = parsed.typedRates.filter((code) => RATE_CODES.includes(code) && state.rates[code] > 0);
  } else {
    // Saved before rates were fetched: every rate there was typed by the user.
    state.typedRates = RATE_CODES.filter((code) => state.rates[code] > 0);
  }
  state.ratesDate = typeof parsed.ratesDate === 'string' ? parsed.ratesDate : '';
  fillMissingRates(state);
  allMonthsOf(state).forEach(recomputeTotals);
  return state;
}

function allMonthsOf(budget) {
  return [...budget.pastMonths, budget].sort(byMonth);
}

// A finished month that never had a rate for a currency (e.g. one added by an
// imported statement before any rate was known) takes this month's rate, once,
// and keeps it.
function fillMissingRates(budget) {
  budget.pastMonths.forEach((record) => {
    RATE_CODES.forEach((code) => {
      if (!(record.rates[code] > 0) && budget.rates[code] > 0) record.rates[code] = budget.rates[code];
    });
  });
}

// Why the saved budget was not loaded, shown above the app; '' when it was.
let loadProblem = '';
// False until the saved budget is loaded, and while the server cannot be
// reached: nothing is saved then, so the file is never overwritten with an empty month.
let canSave = false;

// The budget saved before the CSV file, in this browser.
function loadFromBrowser() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return makeEmptyState(getCurrentMonthStr());
  }
  let parsed = null;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    // Handled below, the same way as valid JSON that is not a budget object.
  }
  if (!parsed || typeof parsed !== 'object') {
    // Keep the old text so the numbers can still be recovered by hand.
    localStorage.setItem(BACKUP_KEY, raw);
    loadProblem = `Your saved budget could not be read, so an empty month was started. The old data is kept in this browser's localStorage under "${BACKUP_KEY}".`;
    return makeEmptyState(getCurrentMonthStr());
  }
  return normaliseState(parsed);
}

// Reads budget-data.csv from the server. Without the file, the budget saved in
// this browser is loaded instead and will be written to the file.
async function loadState() {
  let response;
  try {
    response = await fetch(DATA_URL, { cache: 'no-store' });
  } catch (err) {
    response = null;
  }
  if (response && response.status === 404) {
    canSave = true;
    return loadFromBrowser();
  }
  if (!response || !response.ok) {
    loadProblem = 'The budget is saved in budget-data.csv by the server, which is not running. Start it with "node server.js" and open http://127.0.0.1:8765. Nothing you type here is saved.';
    return makeEmptyState(getCurrentMonthStr());
  }
  const text = await response.text();
  const parsed = csvToState(text);
  if (parsed) {
    canSave = true;
    return normaliseState(parsed);
  }
  // Copy the unreadable file first; only once the copy is safe may it be overwritten.
  try {
    const backup = await fetch(BACKUP_URL, { method: 'PUT', headers: { 'Content-Type': 'text/csv' }, body: text });
    if (!backup.ok) throw new Error(`backup failed: ${backup.status}`);
    const kept = await backup.text();
    canSave = true;
    loadProblem = `budget-data.csv could not be read, so an empty month was started. The old file is kept as ${kept}.`;
  } catch (err) {
    loadProblem = 'budget-data.csv could not be read, and a copy of it could not be made, so it is left as it is. Nothing you type here is saved.';
  }
  return makeEmptyState(getCurrentMonthStr());
}

// Each save sends the whole budget with a growing number; the server skips one
// that arrives after a later one, so the file always ends with the newest data.
const PAGE_ID = Math.random().toString(36).slice(2);
let saveNumber = 0;
let lastAnswered = 0;

function showSaveProblem(text) {
  const warning = document.getElementById('save-warning');
  warning.hidden = !text;
  warning.textContent = text;
}

function saveState(state) {
  if (!canSave) return;
  saveNumber += 1;
  const number = saveNumber;
  const answered = (problem) => {
    if (number < lastAnswered) return;
    lastAnswered = number;
    showSaveProblem(problem);
  };
  fetch(DATA_URL, {
    method: 'PUT',
    headers: { 'Content-Type': 'text/csv', 'X-Page': PAGE_ID, 'X-Save-Number': String(number) },
    body: stateToCsv(state),
  })
    .then((response) => {
      if (!response.ok) throw new Error(`save failed: ${response.status}`);
      answered('');
    })
    .catch(() => answered('Your last change could not be saved to budget-data.csv. Is "node server.js" still running?'));
}

function sumMustPays(record) {
  return record.mustPays.rent + record.mustPays.phone + record.mustPays.transport;
}

function sumActuals(record) {
  return roundCents(CATEGORY_ORDER.reduce((sum, key) => sum + record.categories[key].actual, 0));
}

function computeLeftover(state) {
  return roundCents(state.carryOver + state.income - sumMustPays(state) - sumActuals(state));
}

// A new month starts empty with the leftover carried over; the finished month
// is kept in the history with the rates it ended with. The new month starts
// from those rates until today's are fetched; a rate typed last month is not
// kept as typed, so today's rate replaces it.
function checkAndResetMonth(state) {
  const current = getCurrentMonthStr();
  if (state.month === current) {
    return state;
  }
  const { pastMonths, typedRates, ratesDate, ...finished } = state;
  const newState = makeEmptyState(current);
  newState.carryOver = computeLeftover(state);
  newState.pastMonths = [...pastMonths.filter((m) => m.month !== finished.month), finished].sort(byMonth);
  newState.rates = { ...finished.rates };
  newState.ratesDate = ratesDate;
  saveState(newState);
  return newState;
}

// Empty until the saved budget is loaded (see the end of this file).
let state = makeEmptyState(getCurrentMonthStr());

// Today's rates once fetched ({ MNT, EUR, USD } in HUF), or null; set to true
// in liveRatesFailed when they could not be fetched.
let liveRates = null;
let liveRatesFailed = false;

// The month shown in the history; the current one until another is picked.
let historyMonth = state.month;

function allMonths() {
  return [...state.pastMonths, state].sort(byMonth);
}

function numOrEmpty(value) {
  return value ? String(value) : '';
}

function renderMonth() {
  document.getElementById('current-month').textContent = state.month;
}

function renderLoadWarning() {
  const warning = document.getElementById('load-warning');
  warning.hidden = !loadProblem;
  warning.textContent = loadProblem;
}

// This month's incomes, in the order they were added, each deletable.
function renderIncomes() {
  const list = document.getElementById('income-list');
  list.innerHTML = '';
  state.incomes.forEach((income, index) => {
    const row = document.createElement('div');
    row.className = 'history-row income-row';
    appendSpan(row, income.label || 'Income', 'history-category');
    appendSpan(row, amountText(income, state.rates), 'history-amount');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'delete-btn';
    button.textContent = 'Delete';
    button.setAttribute('aria-label', `Delete income ${income.label || ''} ${amountText(income, state.rates)}`.replace('  ', ' '));
    button.addEventListener('click', () => deleteIncome(index));
    row.appendChild(button);
    list.appendChild(row);
  });
  document.getElementById('income-total').textContent = formatAmount(state.income);
}

function renderIncomeAndMustPays() {
  document.getElementById('carry-over').textContent = formatAmount(state.carryOver);
  document.getElementById('rent-input').value = numOrEmpty(state.mustPays.rent);
  document.getElementById('phone-input').value = numOrEmpty(state.mustPays.phone);
  document.getElementById('transport-input').value = numOrEmpty(state.mustPays.transport);
}

function renderLeftToPlan() {
  const left = state.carryOver + state.income - sumMustPays(state);
  document.getElementById('left-to-plan').textContent = formatAmount(left);
}

function renderCategoryPlanInputs() {
  const container = document.getElementById('category-plan-list');
  container.innerHTML = '';
  CATEGORY_ORDER.forEach((key) => {
    const row = document.createElement('div');
    row.className = 'category-plan-row';

    const label = document.createElement('label');
    label.textContent = CATEGORY_LABELS[key];
    label.setAttribute('for', `plan-${key}`);

    const input = document.createElement('input');
    input.type = 'number';
    input.min = '0';
    input.step = '0.01';
    input.placeholder = '0';
    input.id = `plan-${key}`;
    input.value = numOrEmpty(state.categories[key].plan);
    input.addEventListener('input', () => {
      state.categories[key].plan = parseAmount(input.value);
      saveState(state);
      renderCategorySummary();
      renderHistory();
      renderReport();
    });

    row.appendChild(label);
    row.appendChild(input);
    container.appendChild(row);
  });
}

function renderExpenseCategoryOptions() {
  const select = document.getElementById('expense-category');
  select.innerHTML = '';
  CATEGORY_ORDER.forEach((key) => {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = CATEGORY_LABELS[key];
    select.appendChild(option);
  });
}

function renderCurrencyOptions(id) {
  const select = document.getElementById(id);
  select.innerHTML = '';
  CURRENCIES.forEach((code) => {
    const option = document.createElement('option');
    option.value = code;
    option.textContent = code;
    select.appendChild(option);
  });
  select.value = BASE_CURRENCY;
}

// "14 Nov 2026" from "2026-11-14".
function formatDay(day) {
  const [y, m, d] = day.split('-').map(Number);
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d} ${names[m - 1]} ${y}`;
}

// Where this month's rates come from: today's, the last ones fetched, or typed.
function ratesStatusText() {
  const parts = [];
  if (liveRates) {
    parts.push(`Today's rates, ${formatDay(state.ratesDate)}, from Exchange Rate API.`);
  } else if (liveRatesFailed) {
    parts.push(state.ratesDate
      ? `Today's rates could not be fetched; the rates from ${formatDay(state.ratesDate)} are used.`
      : "Today's rates could not be fetched (are you online?); type the rates yourself.");
  }
  if (state.typedRates.length > 0) {
    parts.push(`Your own rate for ${state.typedRates.join(' and ')}; clear the box to use today's rate.`);
  }
  return parts.join(' ');
}

function renderRates() {
  RATE_CODES.forEach((code) => {
    document.getElementById(`rate-${code}`).value = numOrEmpty(state.rates[code]);
  });
  document.getElementById('rates-status').textContent = ratesStatusText();
}

// Entries (and statement totals) in a currency without a rate count as 0, so
// the user is told which rate is missing instead of the money quietly vanishing.
function renderRateWarning() {
  const missing = {};
  allMonths().forEach((record) => {
    [...record.incomes, ...record.entries].forEach((entry) => {
      if (rateOf(entry.currency, record.rates) === 0) missing[entry.currency] = (missing[entry.currency] || 0) + 1;
    });
    if ((record.transfers > 0 || record.moneyIn > 0) && rateOf(STATEMENT_CURRENCY, record.rates) === 0) {
      missing[STATEMENT_CURRENCY] = missing[STATEMENT_CURRENCY] || 0;
    }
  });
  const codes = Object.keys(missing);
  const parts = codes.map((code) => (missing[code] > 0 ? `${missing[code]} entries in ${code}` : `statement totals in ${code}`));
  const warning = document.getElementById('rate-warning');
  warning.hidden = codes.length === 0;
  warning.textContent = codes.length === 0 ? ''
    : `Not counted yet: ${parts.join(', ')}. Enter the ${codes.join(' and ')} rate under "Exchange rates".`;
}

function renderCategorySummary() {
  const container = document.getElementById('category-summary-list');
  container.innerHTML = '';
  CATEGORY_ORDER.forEach((key) => {
    const { plan, actual } = state.categories[key];
    const row = document.createElement('div');
    row.className = 'category-summary-row';

    const header = document.createElement('div');
    header.className = 'summary-header';
    const name = document.createElement('span');
    name.textContent = CATEGORY_LABELS[key];
    const amounts = document.createElement('span');
    amounts.textContent = `${formatAmount(actual)} / ${formatAmount(plan)}`;
    header.appendChild(name);
    header.appendChild(amounts);

    const track = document.createElement('div');
    track.className = 'progress-track';
    const fill = document.createElement('div');
    const percent = plan > 0 ? (actual / plan) * 100 : (actual > 0 ? 100 : 0);
    fill.className = 'progress-fill' + (actual > plan ? ' over' : '');
    fill.style.width = Math.min(100, Math.max(0, percent)) + '%';
    track.appendChild(fill);

    row.appendChild(header);
    row.appendChild(track);

    if (actual > plan) {
      const warning = document.createElement('p');
      warning.className = 'warning';
      const over = formatAmount(actual - plan);
      warning.textContent = `${CATEGORY_LABELS[key]}: ${over} over plan`;
      row.appendChild(warning);
    }

    container.appendChild(row);
  });
}

// "2640" for HUF; "2640 (24000 MNT)" for another currency; "? (24000 MNT)"
// while that currency has no rate. Converted at the rates of the entry's month.
function amountText(entry, rates) {
  if (entry.currency === BASE_CURRENCY) return formatAmount(entry.amount);
  const huf = rateOf(entry.currency, rates) > 0 ? formatAmount(toHuf(entry.amount, entry.currency, rates)) : '?';
  return `${huf} (${formatAmount(entry.amount)} ${entry.currency})`;
}

function appendSpan(parent, text, className) {
  const span = document.createElement('span');
  span.className = className;
  span.textContent = text;
  parent.appendChild(span);
}

// Everything entered for the chosen month, as it was saved: income, carry-over,
// each must-pay, each category's plan against its spending, and what was left.
function renderMonthInputs(record) {
  const title = document.getElementById('history-inputs-title');
  title.textContent = record === state ? `What you entered for ${record.month} (this month)` : `What you entered for ${record.month}`;
  const table = document.getElementById('history-inputs');
  table.innerHTML = '';
  appendRow(table, ['Carried over', formatAmount(record.carryOver)]);
  appendRow(table, ['Income', formatAmount(record.income)]);
  record.incomes.forEach((income) => {
    appendRow(table, [`  ${income.label || 'Income'}`, amountText(income, record.rates)], 'report-aside');
  });
  appendRow(table, ['Rent', formatAmount(record.mustPays.rent)]);
  appendRow(table, ['Phone', formatAmount(record.mustPays.phone)]);
  appendRow(table, ['Transport', formatAmount(record.mustPays.transport)]);
  const leftToPlan = roundCents(record.carryOver + record.income - sumMustPays(record));
  appendRow(table, ['Left to plan', formatAmount(leftToPlan)], 'report-total');
  CATEGORY_ORDER.forEach((key) => {
    const { plan, actual } = record.categories[key];
    appendRow(table, [`${CATEGORY_LABELS[key]} (spent / plan)`, planCell(actual, plan)]);
  });
  const planned = roundCents(CATEGORY_ORDER.reduce((sum, key) => sum + record.categories[key].plan, 0));
  appendRow(table, ['Spending', planCell(sumActuals(record), planned)], 'report-total');
  const left = computeLeftover(record);
  appendRow(table, [record === state ? 'Left so far' : 'Left at month end',
    { text: formatAmount(left), className: left < 0 ? 'over' : '' }], 'report-total');
}

// The chosen month's inputs and expenses, newest first. Only the current
// month's can be deleted: a past month's leftover has already been carried over.
function renderHistory() {
  const select = document.getElementById('history-month');
  select.innerHTML = '';
  allMonths().reverse().forEach((record) => {
    const option = document.createElement('option');
    option.value = record.month;
    option.textContent = record.month === state.month ? `${record.month} (this month)` : record.month;
    select.appendChild(option);
  });
  select.value = historyMonth;

  const record = allMonths().find((m) => m.month === historyMonth) || state;
  renderMonthInputs(record);
  const list = document.getElementById('history-list');
  list.innerHTML = '';
  if (record !== state) {
    const note = document.createElement('p');
    note.className = 'hint';
    note.textContent = 'Past months are kept as they were, so their entries cannot be deleted.';
    list.appendChild(note);
  }
  if (record.entries.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'hint';
    empty.textContent = 'No expenses recorded in this month.';
    list.appendChild(empty);
    return;
  }
  // Newest first (the later entry first within the same second). Entries saved
  // before the history have no time; they come last, in category order.
  const withIndex = record.entries.map((entry, index) => ({ entry, index }));
  const timed = withIndex.filter(({ entry }) => entry.time)
    .sort((a, b) => b.entry.time.localeCompare(a.entry.time) || b.index - a.index);
  const order = [...timed, ...withIndex.filter(({ entry }) => !entry.time)];
  order.forEach(({ entry, index }) => {
    const row = document.createElement('div');
    row.className = 'history-row';
    appendSpan(row, entry.time || '—', 'history-time');
    appendSpan(row, CATEGORY_LABELS[entry.category], 'history-category');
    appendSpan(row, amountText(entry, record.rates), 'history-amount');
    appendSpan(row, SOURCE_LABELS[entry.source], 'history-source');
    if (record === state) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'delete-btn';
      button.textContent = 'Delete';
      button.setAttribute('aria-label', `Delete ${CATEGORY_LABELS[entry.category]} ${amountText(entry, record.rates)}`);
      button.addEventListener('click', () => deleteEntry(index));
      row.appendChild(button);
    }
    list.appendChild(row);
  });
}

// Each cell is a text, or { text, className } for a cell that needs a style.
function appendRow(table, cells, className) {
  const row = document.createElement('tr');
  if (className) row.className = className;
  cells.forEach((cell, i) => {
    const element = document.createElement(i === 0 ? 'th' : 'td');
    element.textContent = typeof cell === 'string' ? cell : cell.text;
    if (cell.className) element.className = cell.className;
    row.appendChild(element);
  });
  table.appendChild(row);
}

// Actual spending, with the plan after a slash when there is one; red when
// over that plan. Without a plan (e.g. a month known only from a statement)
// nothing is red, or whole months would be.
function planCell(actual, plan) {
  return {
    text: plan > 0 ? `${formatAmount(actual)} / ${formatAmount(plan)}` : formatAmount(actual),
    className: plan > 0 && actual > plan ? 'over' : '',
  };
}

// One column per month, from everything saved: typed and imported expenses,
// plans, income and must-pays. Statement transfers and money in are listed
// but not counted as spending.
function renderReport() {
  const months = allMonths();
  const table = document.getElementById('monthly-report');
  table.innerHTML = '';
  appendRow(table, ['', ...months.map((m) => m.month)], 'report-head');
  CATEGORY_ORDER.forEach((key) => {
    appendRow(table, [CATEGORY_LABELS[key], ...months.map((m) => planCell(m.categories[key].actual, m.categories[key].plan))]);
  });
  const planned = (m) => roundCents(CATEGORY_ORDER.reduce((sum, key) => sum + m.categories[key].plan, 0));
  appendRow(table, ['Spending', ...months.map((m) => planCell(sumActuals(m), planned(m)))], 'report-total');
  appendRow(table, ['Income', ...months.map((m) => formatAmount(m.income))]);
  appendRow(table, ['Must-pays', ...months.map((m) => formatAmount(sumMustPays(m)))]);
  if (months.some((m) => m.transfers > 0 || m.moneyIn > 0)) {
    const huf = (amount, m) => formatAmount(toHuf(amount, STATEMENT_CURRENCY, m.rates));
    appendRow(table, ['Transfers out (statement, not counted)', ...months.map((m) => huf(m.transfers, m))], 'report-aside');
    appendRow(table, ['Money in (statement, not counted)', ...months.map((m) => huf(m.moneyIn, m))], 'report-aside');
  }
  // The rate each month was converted at, for every currency that was used.
  RATE_CODES.filter((code) => months.some((m) => m.entries.some((entry) => entry.currency === code)
    || (code === STATEMENT_CURRENCY && (m.transfers > 0 || m.moneyIn > 0)))).forEach((code) => {
    appendRow(table, [`1 ${code} in HUF`, ...months.map((m) => (m.rates[code] > 0 ? String(m.rates[code]) : '?'))], 'report-aside');
  });
}

// Everything that shows converted amounts: income, left to plan, the summary,
// the history and the report.
function renderSpending() {
  renderIncomes();
  renderLeftToPlan();
  renderRateWarning();
  renderCategorySummary();
  renderHistory();
  renderReport();
}

function renderAll() {
  renderLoadWarning();
  renderMonth();
  renderIncomeAndMustPays();
  renderLeftToPlan();
  renderCategoryPlanInputs();
  renderExpenseCategoryOptions();
  renderCurrencyOptions('expense-currency');
  renderCurrencyOptions('income-currency');
  renderRates();
  renderSpending();
}

function deleteEntry(index) {
  state.entries.splice(index, 1);
  recomputeTotals(state);
  saveState(state);
  renderSpending();
}

function deleteIncome(index) {
  state.incomes.splice(index, 1);
  recomputeTotals(state);
  saveState(state);
  renderSpending();
}

document.getElementById('add-income-btn').addEventListener('click', () => {
  const labelInput = document.getElementById('income-label');
  const amountInput = document.getElementById('income-amount');
  const amount = parseAmount(amountInput.value);
  const currency = document.getElementById('income-currency').value;
  const message = document.getElementById('income-message');
  if (amount <= 0) {
    return;
  }
  if (rateOf(currency, state.rates) === 0) {
    message.textContent = `Enter the ${currency} rate under "Exchange rates" first; the income was not added.`;
    return;
  }
  message.textContent = '';
  state.incomes.push({ time: getNowStr(), label: labelInput.value.trim().slice(0, 40), amount, currency });
  recomputeTotals(state);
  saveState(state);
  labelInput.value = '';
  amountInput.value = '';
  renderSpending();
});

// The three must-pays: typing saves the amount and updates "left to plan".
const AMOUNT_INPUTS = {
  'rent-input': (amount) => { state.mustPays.rent = amount; },
  'phone-input': (amount) => { state.mustPays.phone = amount; },
  'transport-input': (amount) => { state.mustPays.transport = amount; },
};
Object.entries(AMOUNT_INPUTS).forEach(([id, store]) => {
  document.getElementById(id).addEventListener('input', (e) => {
    store(parseAmount(e.target.value));
    saveState(state);
    renderLeftToPlan();
    renderHistory();
    renderReport();
  });
});

document.getElementById('add-expense-btn').addEventListener('click', () => {
  const category = document.getElementById('expense-category').value;
  const amountInput = document.getElementById('expense-amount');
  const amount = parseAmount(amountInput.value);
  const currency = document.getElementById('expense-currency').value;
  const message = document.getElementById('expense-message');
  if (amount <= 0) {
    return;
  }
  if (rateOf(currency, state.rates) === 0) {
    message.textContent = `Enter the ${currency} rate under "Exchange rates" first; the expense was not added.`;
    return;
  }
  message.textContent = '';
  state.entries.push({ time: getNowStr(), category, amount, currency, source: 'typed' });
  recomputeTotals(state);
  saveState(state);
  amountInput.value = '';
  historyMonth = state.month;
  renderSpending();
});

// A typed rate is this month's own rate and is not replaced by today's; it
// re-converts this month only, since finished months keep their rates.
// Clearing the box goes back to today's rate when it has been fetched.
RATE_CODES.forEach((code) => {
  document.getElementById(`rate-${code}`).addEventListener('input', (e) => {
    const typed = parseRate(e.target.value);
    state.typedRates = state.typedRates.filter((c) => c !== code);
    if (typed > 0) {
      state.rates[code] = typed;
      state.typedRates.push(code);
    } else {
      state.rates[code] = liveRates ? liveRates[code] : 0;
    }
    fillMissingRates(state);
    allMonths().forEach(recomputeTotals);
    saveState(state);
    document.getElementById('rates-status').textContent = ratesStatusText();
    renderSpending();
  });
});

document.getElementById('history-month').addEventListener('change', (e) => {
  historyMonth = e.target.value;
  renderHistory();
});

// The saved month a statement transaction belongs to; an earlier month the
// app has not seen yet is added to the history.
function monthRecord(month) {
  if (month === state.month) return state;
  let record = state.pastMonths.find((m) => m.month === month);
  if (!record) {
    // An earlier month first seen in a statement is converted at this month's rates.
    record = makeEmptyMonth(month);
    record.rates = { ...state.rates };
    state.pastMonths.push(record);
    state.pastMonths.sort(byMonth);
  }
  return record;
}

// Saves every statement transaction in its own month: purchases and fees as
// history entries, transfers and money in as totals. Only this month's
// purchases change the budget; a transaction already saved is skipped, even
// if its entry was deleted since.
function importStatement(transactions) {
  const status = document.getElementById('statement-status');
  if (transactions.length === 0) {
    status.textContent = 'No transactions were found in this statement. Nothing was changed.';
    return;
  }
  let addedNow = 0;
  let addedEarlier = 0;
  let addedAside = 0;
  transactions.forEach((tx) => {
    const record = monthRecord(tx.month);
    if (record.importedIds.includes(tx.id)) return;
    record.importedIds.push(tx.id);
    if (tx.kind === 'in') {
      record.moneyIn = roundCents(record.moneyIn + tx.moneyIn);
      addedAside += 1;
    } else if (tx.kind === 'transfer') {
      record.transfers = roundCents(record.transfers + tx.moneyOut);
      addedAside += 1;
    } else {
      record.entries.push({
        time: tx.time, category: tx.category, amount: tx.moneyOut, currency: STATEMENT_CURRENCY, source: 'statement',
      });
      if (record === state) addedNow += 1;
      else addedEarlier += 1;
    }
  });
  allMonths().forEach(recomputeTotals);
  saveState(state);
  renderSpending();

  const months = [...new Set(transactions.map((tx) => tx.month))].sort();
  const parts = [`Read ${transactions.length} transactions (${months[0]} to ${months[months.length - 1]}).`];
  if (addedNow + addedEarlier > 0) {
    parts.push(`Added ${addedNow} purchases to this month and ${addedEarlier} to earlier months in the history.`);
  }
  if (addedAside > 0) parts.push(`Added ${addedAside} transfers or money in to the report.`);
  if (parts.length === 1) parts.push('Nothing new: this statement was already imported.');
  status.textContent = parts.join(' ');
}

document.getElementById('statement-input').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return undefined;
  const status = document.getElementById('statement-status');
  status.textContent = 'Reading the statement…';
  // Returned so the tests can wait for it; the browser ignores it.
  return file.arrayBuffer()
    .then(readStatement)
    .then(importStatement)
    .catch(() => {
      status.textContent = 'This file could not be read as a bank statement (.xlsx). Nothing was changed.';
    });
});

// Today's rates come from Exchange Rate API's free service: no key, updated
// once a day. The request carries only the currency code HUF, never the budget.
const RATES_URL = 'https://open.er-api.com/v6/latest/HUF';

// { rates: { MNT, EUR, USD } in HUF for one unit, day: '2026-11-14' }, or null
// when the rates could not be fetched (offline, or an unexpected answer).
async function fetchLiveRates() {
  try {
    const response = await fetch(RATES_URL, { cache: 'no-store' });
    if (!response.ok) throw new Error(`rates: ${response.status}`);
    const data = await response.json();
    if (data.result !== 'success') throw new Error('rates: no success');
    const rates = {};
    RATE_CODES.forEach((code) => {
      // The service gives units per forint; the app keeps forints per unit.
      const perHuf = data.rates[code];
      if (!(typeof perHuf === 'number' && perHuf > 0)) throw new Error(`rates: no ${code}`);
      rates[code] = Number((1 / perHuf).toPrecision(6));
    });
    const day = new Date(data.time_last_update_unix * 1000).toISOString().slice(0, 10);
    return { rates, day };
  } catch (err) {
    return null;
  }
}

// Today's rates replace this month's, except the ones the user typed.
// Without them, the saved rates stay as they are.
function applyLiveRates(live) {
  if (!live) {
    liveRatesFailed = true;
    renderRates();
    return;
  }
  liveRates = live.rates;
  state.ratesDate = live.day;
  RATE_CODES.forEach((code) => {
    if (!state.typedRates.includes(code)) state.rates[code] = live.rates[code];
  });
  fillMissingRates(state);
  allMonths().forEach(recomputeTotals);
  saveState(state);
  renderRates();
  renderSpending();
}

// Loads the saved budget, starts a new month if one has begun, and writes the
// result to the file (the first time, the budget moved from the browser).
// The page is drawn before today's rates arrive, so it never waits for them.
// Kept so the tests can wait for it.
const started = loadState().then((loaded) => {
  state = checkAndResetMonth(loaded);
  saveState(state);
  historyMonth = state.month;
  renderAll();
}).then(fetchLiveRates).then(applyLiveRates);
