// Spike (issue #3): does a real month of spending fit the six categories?
//
// Usage: node spike/count-categories.js <file.csv>
//
// One row per flexible-spending transaction, with a header row:
//   category,amount,guessed
// category: food, clothes, gym, subscriptions, going out, other
// guessed:  yes/no — "yes" if you were unsure which category it belonged in
// The amount column is optional; without it only counts are reported.
// Comma or semicolon separators both work (Excel in Hungarian uses ";" and "12,50").

const fs = require('fs');

const CATEGORIES = ['food', 'clothes', 'gym', 'subscriptions', 'goingOut', 'other'];

function normaliseCategory(raw) {
  const key = raw.trim().toLowerCase().replace(/[\s_-]+/g, '');
  if (key === 'goingout') return 'goingOut';
  return CATEGORIES.includes(key) ? key : null;
}

function parseGuessed(raw) {
  const value = (raw || '').trim().toLowerCase();
  if (['yes', 'y', 'true', '1'].includes(value)) return true;
  if (['no', 'n', 'false', '0', ''].includes(value)) return false;
  return null;
}

function percent(part, whole) {
  return whole === 0 ? '0.0%' : `${((part / whole) * 100).toFixed(1)}%`;
}

const file = process.argv[2];
if (!file) {
  console.error('Usage: node spike/count-categories.js <file.csv>');
  process.exit(1);
}

const lines = fs.readFileSync(file, 'utf8').replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim() !== '');
const separator = lines[0].includes(';') ? ';' : ',';
const header = lines[0].split(separator).map((h) => h.trim().toLowerCase());
const col = { category: header.indexOf('category'), amount: header.indexOf('amount'), guessed: header.indexOf('guessed') };
if (col.category === -1) {
  console.error('The header row needs a "category" column.');
  process.exit(1);
}
const hasAmounts = col.amount !== -1;

const counts = Object.fromEntries(CATEGORIES.map((c) => [c, 0]));
const money = Object.fromEntries(CATEGORIES.map((c) => [c, 0]));
let guessed = 0;
const errors = [];

lines.slice(1).forEach((line, i) => {
  const cells = line.split(separator);
  const rowNumber = i + 2;
  const category = normaliseCategory(cells[col.category] || '');
  if (!category) {
    errors.push(`row ${rowNumber}: unknown category "${(cells[col.category] || '').trim()}"`);
    return;
  }
  let amount = 0;
  if (hasAmounts) {
    const raw = (cells[col.amount] || '').trim().replace(/\s/g, '');
    amount = Number(separator === ';' ? raw.replace(',', '.') : raw);
    if (!Number.isFinite(amount) || amount < 0) {
      errors.push(`row ${rowNumber}: bad amount "${cells[col.amount]}"`);
      return;
    }
  }
  const isGuess = col.guessed === -1 ? false : parseGuessed(cells[col.guessed]);
  if (isGuess === null) {
    errors.push(`row ${rowNumber}: guessed should be yes or no, got "${cells[col.guessed]}"`);
    return;
  }
  counts[category] += 1;
  money[category] += amount;
  if (isGuess) guessed += 1;
});

if (errors.length > 0) {
  console.error(`Fix these ${errors.length} row(s) first:\n  ${errors.join('\n  ')}`);
  process.exit(1);
}

const totalCount = CATEGORIES.reduce((sum, c) => sum + counts[c], 0);
const totalMoney = CATEGORIES.reduce((sum, c) => sum + money[c], 0);

console.log(`Transactions: ${totalCount}`);
console.log('');
console.log('Category        items   share of items' + (hasAmounts ? '   share of money' : ''));
CATEGORIES.forEach((c) => {
  const row = `${c.padEnd(14)}  ${String(counts[c]).padStart(5)}   ${percent(counts[c], totalCount).padStart(14)}`;
  console.log(hasAmounts ? `${row}   ${percent(money[c], totalMoney).padStart(14)}` : row);
});
console.log('');
console.log(`Other, share of items: ${percent(counts.other, totalCount)} (${counts.other} of ${totalCount})`);
if (hasAmounts) console.log(`Other, share of money: ${percent(money.other, totalMoney)}`);
console.log(`Guessed items:         ${guessed} of ${totalCount}`);
