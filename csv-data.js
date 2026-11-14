// The whole budget as one CSV file (budget-data.csv), one value per row, so it
// opens in Excel. Used by the browser (index.html) and by the tests.
//
//   type,month,key,value,time,category,amount,currency,source
//   current,2026-11,,,,,,,            the month on screen; every other month is past
//   ratesdate,,,2026-11-14,,,,,       the day of the last rates fetched online
//   rate,2026-11,MNT,0.0914,,,,,      HUF for one unit, per month; "typed" in the
//                                     last column when the user typed it
//                                     (older files: no month, one rate for all)
//   month,2026-11,income,300000,,,,,  also carryOver, rent, phone, transport, transfers, moneyIn
//   plan,2026-11,food,80000,,,,,
//   actual,2026-11,food,90000,,,,,    for reading only; recomputed from the entries on load
//   entry,2026-11,,,2026-11-05 12:00:00,food,90000,HUF,typed
//   imported,2026-11,<statement transaction id>,,,,,,

const CSV_COLUMNS = ['type', 'month', 'key', 'value', 'time', 'category', 'amount', 'currency', 'source'];
const MONTH_FIELDS = ['carryOver', 'income', 'transfers', 'moneyIn'];
const MUST_PAY_FIELDS = ['rent', 'phone', 'transport'];

// Quotes a cell only when it has to: a comma, a quote or a line break.
function csvCell(value) {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function stateToCsv(state) {
  const rows = [CSV_COLUMNS];
  const row = (values) => rows.push(CSV_COLUMNS.map((column) => values[column]));
  row({ type: 'current', month: state.month });
  if (state.ratesDate) row({ type: 'ratesdate', value: state.ratesDate });
  [...state.pastMonths, state].forEach((record) => {
    const { month } = record;
    Object.keys(record.rates).forEach((code) => row({
      type: 'rate', month, key: code, value: record.rates[code],
      source: record === state && (state.typedRates || []).includes(code) ? 'typed' : '',
    }));
    MONTH_FIELDS.forEach((key) => row({ type: 'month', month, key, value: record[key] }));
    MUST_PAY_FIELDS.forEach((key) => row({ type: 'month', month, key, value: record.mustPays[key] }));
    Object.keys(record.categories).forEach((key) => {
      row({ type: 'plan', month, key, value: record.categories[key].plan });
      row({ type: 'actual', month, key, value: record.categories[key].actual });
    });
    record.entries.forEach((entry) => row({ type: 'entry', month, ...entry }));
    record.importedIds.forEach((id) => row({ type: 'imported', month, key: id }));
  });
  return rows.map((cells) => cells.map(csvCell).join(',')).join('\r\n') + '\r\n';
}

// Splits CSV text into rows of cells; quoted cells may hold commas, quotes and
// line breaks. Returns null when a quote is never closed.
function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i += 1; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i += 1;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += c;
  }
  if (quoted) return null;
  if (cell !== '' || row.length > 0) { row.push(cell); rows.push(row); }
  return rows.filter((cells) => cells.some((value) => value !== ''));
}

// An empty cell stays missing, so the app's own checks turn it into 0.
function csvNumber(text) {
  return text === '' ? undefined : Number(text);
}

// The saved budget in the same shape the app keeps it in, or null when the
// text is not a budget file (e.g. the header is missing). Broken values are
// left for the app to correct, as with any saved data.
function csvToState(text) {
  const rows = parseCsv(text.replace(/^﻿/, ''));
  if (!rows || rows.length === 0 || rows[0].join(',') !== CSV_COLUMNS.join(',')) return null;
  const records = {};
  let current = null;
  let ratesDate = '';
  // Older files kept one rate for every month, in rows without a month.
  const legacyRates = {};
  let hasLegacyRates = false;
  const typed = {};
  const recordFor = (month) => {
    if (!records[month]) {
      records[month] = { month, mustPays: {}, categories: {}, entries: [], importedIds: [] };
    }
    return records[month];
  };
  rows.slice(1).forEach((cells) => {
    const r = Object.fromEntries(CSV_COLUMNS.map((column, i) => [column, cells[i] || '']));
    if (r.type === 'current') { current = r.month; recordFor(r.month); return; }
    if (r.type === 'ratesdate') { ratesDate = r.value; return; }
    if (r.type === 'rate' && !r.month) { legacyRates[r.key] = csvNumber(r.value); hasLegacyRates = true; return; }
    if (!r.month) return;
    const record = recordFor(r.month);
    if (r.type === 'month') {
      if (MUST_PAY_FIELDS.includes(r.key)) record.mustPays[r.key] = csvNumber(r.value);
      else if (MONTH_FIELDS.includes(r.key)) record[r.key] = csvNumber(r.value);
    } else if (r.type === 'plan' || r.type === 'actual') {
      record.categories[r.key] = record.categories[r.key] || {};
      record.categories[r.key][r.type] = csvNumber(r.value);
    } else if (r.type === 'entry') {
      record.entries.push({
        time: r.time || null, category: r.category, amount: csvNumber(r.amount), currency: r.currency, source: r.source,
      });
    } else if (r.type === 'imported') {
      record.importedIds.push(r.key);
    } else if (r.type === 'rate') {
      record.rates = record.rates || {};
      record.rates[r.key] = csvNumber(r.value);
      if (r.source === 'typed') typed[r.month] = [...(typed[r.month] || []), r.key];
    }
  });
  const months = Object.keys(records).sort();
  if (months.length === 0) return null;
  // Without a "current" row the latest month is the one on screen.
  const shown = current || months[months.length - 1];
  const state = {
    ...records[shown],
    pastMonths: months.filter((month) => month !== shown).map((month) => records[month]),
    ratesDate,
  };
  if (hasLegacyRates) {
    // The one rate was typed by the user and applied to every month; the app
    // gives it to months without their own (typedRates left out means "typed").
    state.rates = { ...legacyRates, ...(state.rates || {}) };
  } else {
    state.typedRates = typed[shown] || [];
  }
  return state;
}

if (typeof module !== 'undefined') {
  module.exports = { CSV_COLUMNS, stateToCsv, csvToState, parseCsv };
}
