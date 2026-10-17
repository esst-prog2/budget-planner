const STORAGE_KEY = 'budgetPlanner:v1';

const CATEGORY_ORDER = ['food', 'clothes', 'gym', 'subscriptions', 'goingOut', 'other'];
const CATEGORY_LABELS = {
  food: 'Food',
  clothes: 'Clothes',
  gym: 'Gym',
  subscriptions: 'Subscriptions',
  goingOut: 'Going out',
  other: 'Other',
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
  return state;
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return makeEmptyState(getCurrentMonthStr());
  }
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return makeEmptyState(getCurrentMonthStr());
    }
    return normaliseState(parsed);
  } catch (err) {
    return makeEmptyState(getCurrentMonthStr());
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function computeLeftover(state) {
  const mustPayTotal = state.mustPays.rent + state.mustPays.phone + state.mustPays.transport;
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

function renderIncomeAndMustPays() {
  document.getElementById('carry-over').textContent = state.carryOver.toFixed(2).replace(/\.00$/, '');
  document.getElementById('income-input').value = numOrEmpty(state.income);
  document.getElementById('rent-input').value = numOrEmpty(state.mustPays.rent);
  document.getElementById('phone-input').value = numOrEmpty(state.mustPays.phone);
  document.getElementById('transport-input').value = numOrEmpty(state.mustPays.transport);
}

function renderLeftToPlan() {
  const mustPayTotal = state.mustPays.rent + state.mustPays.phone + state.mustPays.transport;
  const left = state.carryOver + state.income - mustPayTotal;
  document.getElementById('left-to-plan').textContent = left.toFixed(2).replace(/\.00$/, '');
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
    amounts.textContent = `${actual.toFixed(2).replace(/\.00$/, '')} / ${plan.toFixed(2).replace(/\.00$/, '')}`;
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
      const over = (actual - plan).toFixed(2).replace(/\.00$/, '');
      warning.textContent = `${CATEGORY_LABELS[key]}: ${over} over plan`;
      row.appendChild(warning);
    }

    container.appendChild(row);
  });
}

function renderAll() {
  renderMonth();
  renderIncomeAndMustPays();
  renderLeftToPlan();
  renderCategoryPlanInputs();
  renderExpenseCategoryOptions();
  renderCategorySummary();
}

document.getElementById('income-input').addEventListener('input', (e) => {
  state.income = parseAmount(e.target.value);
  saveState(state);
  renderLeftToPlan();
});

document.getElementById('rent-input').addEventListener('input', (e) => {
  state.mustPays.rent = parseAmount(e.target.value);
  saveState(state);
  renderLeftToPlan();
});

document.getElementById('phone-input').addEventListener('input', (e) => {
  state.mustPays.phone = parseAmount(e.target.value);
  saveState(state);
  renderLeftToPlan();
});

document.getElementById('transport-input').addEventListener('input', (e) => {
  state.mustPays.transport = parseAmount(e.target.value);
  saveState(state);
  renderLeftToPlan();
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

renderAll();
