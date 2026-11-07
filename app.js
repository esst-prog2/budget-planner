const STORAGE_KEY = 'budgetPlanner:v1';
// Saved text that could not be read is moved here instead of being overwritten.
const BACKUP_KEY = 'budgetPlanner:v1:unreadable';
// Monthly totals from the last imported bank statement (no single transactions).
const REPORT_KEY = 'budgetPlanner:v1:report';

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

function getCurrentMonthStr() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
}

function makeEmptyCategories() {
  const categories = {};
  CATEGORY_ORDER.forEach((key) => {
    categories[key] = { plan: 0, actual: 0 };
  });
  return categories;
}

function makeEmptyState(month) {
  return {
    month,
    carryOver: 0,
    income: 0,
    mustPays: { rent: 0, phone: 0, transport: 0 },
    categories: makeEmptyCategories(),
    // Statement transactions already added to this month's actual spending.
    importedIds: [],
  };
}

// Money is kept in whole cents so that 0.1 + 0.2 adds up to exactly 0.3.
function roundCents(value) {
  return Math.round(value * 100) / 100;
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

// Copies saved data onto a fresh state, so a missing or broken field becomes 0
// instead of crashing the app.
function normaliseState(parsed) {
  const state = makeEmptyState(typeof parsed.month === 'string' ? parsed.month : getCurrentMonthStr());
  state.carryOver = numberOr(parsed.carryOver, 0);
  state.income = numberOr(parsed.income, 0);
  const mustPays = parsed.mustPays || {};
  Object.keys(state.mustPays).forEach((key) => {
    state.mustPays[key] = numberOr(mustPays[key], 0);
  });
  const categories = parsed.categories || {};
  CATEGORY_ORDER.forEach((key) => {
    const saved = categories[key] || {};
    state.categories[key] = { plan: numberOr(saved.plan, 0), actual: numberOr(saved.actual, 0) };
  });
  if (Array.isArray(parsed.importedIds)) {
    state.importedIds = parsed.importedIds.filter((id) => typeof id === 'string');
  }
  return state;
}

// Set by loadState when the saved data could not be read.
let loadProblem = false;

function loadState() {
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
    loadProblem = true;
    return makeEmptyState(getCurrentMonthStr());
  }
  return normaliseState(parsed);
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// The report can always be made again by importing the statement, so an
// unreadable one is simply not shown.
function loadReport() {
  try {
    const report = JSON.parse(localStorage.getItem(REPORT_KEY));
    return Array.isArray(report) ? report : [];
  } catch (err) {
    return [];
  }
}

function sumMustPays(state) {
  return state.mustPays.rent + state.mustPays.phone + state.mustPays.transport;
}

function computeLeftover(state) {
  const mustPayTotal = sumMustPays(state);
  const actualTotal = CATEGORY_ORDER.reduce((sum, key) => sum + state.categories[key].actual, 0);
  return roundCents(state.carryOver + state.income - mustPayTotal - actualTotal);
}

function checkAndResetMonth(state) {
  const current = getCurrentMonthStr();
  if (state.month === current) {
    return state;
  }
  const leftover = computeLeftover(state);
  const newState = makeEmptyState(current);
  newState.carryOver = leftover;
  saveState(newState);
  return newState;
}

let state = checkAndResetMonth(loadState());
saveState(state);

function numOrEmpty(value) {
  return value ? String(value) : '';
}

function renderMonth() {
  document.getElementById('current-month').textContent = state.month;
}

function renderLoadWarning() {
  const warning = document.getElementById('load-warning');
  warning.hidden = !loadProblem;
  warning.textContent = loadProblem
    ? `Your saved budget could not be read, so an empty month was started. The old data is kept in this browser's localStorage under "${BACKUP_KEY}".`
    : '';
}

function renderIncomeAndMustPays() {
  document.getElementById('carry-over').textContent = formatAmount(state.carryOver);
  document.getElementById('income-input').value = numOrEmpty(state.income);
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

function appendRow(table, cells, className) {
  const row = document.createElement('tr');
  if (className) row.className = className;
  cells.forEach((text, i) => {
    const cell = document.createElement(i === 0 ? 'th' : 'td');
    cell.textContent = text;
    row.appendChild(cell);
  });
  table.appendChild(row);
}

// One column per month: spending per category, then transfers and money in,
// which are listed but not counted as spending.
function renderReport(report) {
  const table = document.getElementById('statement-report');
  table.innerHTML = '';
  if (report.length === 0) return;
  appendRow(table, ['', ...report.map((m) => m.month)], 'report-head');
  CATEGORY_ORDER.forEach((key) => {
    appendRow(table, [CATEGORY_LABELS[key], ...report.map((m) => formatAmount(m.categories[key] || 0))]);
  });
  appendRow(table, ['Spending', ...report.map((m) => formatAmount(m.spending))], 'report-total');
  appendRow(table, ['Transfers out (not counted)', ...report.map((m) => formatAmount(m.transfers))], 'report-aside');
  appendRow(table, ['Money in (not counted)', ...report.map((m) => formatAmount(m.moneyIn))], 'report-aside');
}

function renderAll() {
  renderLoadWarning();
  renderMonth();
  renderIncomeAndMustPays();
  renderLeftToPlan();
  renderCategoryPlanInputs();
  renderExpenseCategoryOptions();
  renderCategorySummary();
  renderReport(loadReport());
}

// Income and the three must-pays: typing saves the amount and updates "left to plan".
const AMOUNT_INPUTS = {
  'income-input': (amount) => { state.income = amount; },
  'rent-input': (amount) => { state.mustPays.rent = amount; },
  'phone-input': (amount) => { state.mustPays.phone = amount; },
  'transport-input': (amount) => { state.mustPays.transport = amount; },
};
Object.entries(AMOUNT_INPUTS).forEach(([id, store]) => {
  document.getElementById(id).addEventListener('input', (e) => {
    store(parseAmount(e.target.value));
    saveState(state);
    renderLeftToPlan();
  });
});

document.getElementById('add-expense-btn').addEventListener('click', () => {
  const category = document.getElementById('expense-category').value;
  const amountInput = document.getElementById('expense-amount');
  const amount = parseAmount(amountInput.value);
  if (amount <= 0) {
    return;
  }
  state.categories[category].actual = roundCents(state.categories[category].actual + amount);
  saveState(state);
  amountInput.value = '';
  renderCategorySummary();
});

// Shows the statement's report and adds this month's purchases and fees to the
// actual spending; a transaction that was already added is skipped.
function importStatement(transactions) {
  const report = buildReport(transactions);
  let added = 0;
  transactions.forEach((tx) => {
    const id = transactionId(tx);
    if (tx.kind !== 'spending' || tx.month !== state.month || state.importedIds.includes(id)) return;
    state.categories[tx.category].actual = roundCents(state.categories[tx.category].actual + tx.moneyOut);
    state.importedIds.push(id);
    added += 1;
  });
  saveState(state);
  localStorage.setItem(REPORT_KEY, JSON.stringify(report));
  renderCategorySummary();
  renderReport(report);

  const months = report.map((m) => m.month);
  const read = `Read ${transactions.length} transactions (${months[0]} to ${months[months.length - 1]}).`;
  document.getElementById('statement-status').textContent = added > 0
    ? `${read} Added ${added} purchases from ${state.month} to this month's actual spending.`
    : `${read} Nothing new from ${state.month} to add to this month's actual spending.`;
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

renderAll();
