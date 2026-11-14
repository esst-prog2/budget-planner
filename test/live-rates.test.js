// Today's exchange rates, fetched online (faked here), and one set of rates per
// month: this month follows today's, a finished month keeps the rates it ended with.

const test = require('node:test');
const assert = require('node:assert');
const { openApp } = require('../test-support/fake-browser');
const { CSV_COLUMNS } = require('../csv-data');

const TODAY = { MNT: 0.0914, EUR: 365, USD: 330.5 };

const row = (app, label) => app.reportRows().find((r) => r[0] === label);

test('today\'s rates fill the rate boxes, say where they are from, and convert this month', async () => {
  const app = await openApp({ today: '2026-11-14', liveRates: TODAY });
  assert.strictEqual(app.saved().rates.MNT, 0.0914);
  assert.strictEqual(app.saved().rates.EUR, 365);
  assert.strictEqual(app.saved().ratesDate, '2026-11-14');
  assert.strictEqual(app.shown('rates-status'), "Today's rates, 14 Nov 2026, from Exchange Rate API.");
  app.addExpense('food', 10, 'EUR');
  assert.strictEqual(app.saved().categories.food.actual, 3650);
});

test('a typed rate wins over today\'s, and clearing the box goes back to today\'s', async () => {
  const app = await openApp({ today: '2026-11-14', liveRates: TODAY });
  app.addExpense('food', 1000, 'MNT');
  app.setRate('MNT', '0.09');
  assert.strictEqual(app.saved().categories.food.actual, 90);
  assert.match(app.shown('rates-status'), /Your own rate for MNT; clear the box to use today's rate\./);

  // The typed rate is kept on the next visit, even though today's differs.
  const again = await openApp({ today: '2026-11-14', csv: app.csv(), liveRates: TODAY });
  assert.strictEqual(again.saved().rates.MNT, 0.09);

  again.setRate('MNT', '');
  assert.strictEqual(again.saved().rates.MNT, 0.0914);
  assert.strictEqual(again.saved().categories.food.actual, 91.4);
  assert.deepStrictEqual(again.saved().typedRates, []);
});

test('offline, the saved rates are used and the user is told from which day', async () => {
  const online = await openApp({ today: '2026-11-14', liveRates: TODAY });
  const app = await openApp({ today: '2026-11-15', csv: online.csv() });
  assert.strictEqual(app.saved().rates.MNT, 0.0914);
  assert.strictEqual(app.shown('rates-status'),
    "Today's rates could not be fetched; the rates from 14 Nov 2026 are used.");
});

test('offline with no rates ever fetched, the user is asked to type them', async () => {
  const app = await openApp({ today: '2026-11-15' });
  assert.strictEqual(app.shown('rates-status'),
    "Today's rates could not be fetched (are you online?); type the rates yourself.");
  assert.strictEqual(app.saved().rates.MNT, 0);
});

test('a finished month keeps the rate it ended with; the new month follows today\'s', async () => {
  const october = await openApp({ today: '2026-10-20', liveRates: { MNT: 0.1, EUR: 400, USD: 360 }, liveRatesDay: '2026-10-20' });
  october.addExpense('food', 1000, 'MNT');
  const app = await openApp({ today: '2026-11-14', csv: october.csv(), liveRates: { MNT: 0.12, EUR: 365, USD: 330 } });
  app.addExpense('food', 1000, 'MNT');
  // October: 1000 x 0.1 = 100; November: 1000 x 0.12 = 120.
  assert.deepStrictEqual(row(app, 'Food'), ['Food', '100', '120']);
  assert.deepStrictEqual(row(app, '1 MNT in HUF'), ['1 MNT in HUF', '0.1', '0.12']);
  // A rate typed for this month does not change October either.
  app.setRate('MNT', '0.2');
  assert.deepStrictEqual(row(app, 'Food'), ['Food', '100', '200']);
});

test('a rate typed last month is not kept as typed: the new month takes today\'s', async () => {
  const october = await openApp({ today: '2026-10-20', liveRates: TODAY, liveRatesDay: '2026-10-20' });
  october.setRate('MNT', '0.09');
  const app = await openApp({ today: '2026-11-14', csv: october.csv(), liveRates: TODAY });
  assert.strictEqual(app.saved().rates.MNT, 0.0914);
  assert.strictEqual(app.saved().pastMonths[0].rates.MNT, 0.09);
});

test('a file saved with one rate for every month gives that rate to each month, as typed', async () => {
  const header = CSV_COLUMNS.join(',');
  const csv = [
    header,
    'current,2026-11,,,,,,,',
    'rate,,MNT,0.11,,,,,',
    'month,2026-10,income,0,,,,,',
    'entry,2026-10,,,2026-10-05 10:00:00,food,1000,MNT,statement',
    'month,2026-11,income,500,,,,,',
    'entry,2026-11,,,2026-11-05 10:00:00,food,2000,MNT,statement',
    '',
  ].join('\r\n');
  const app = await openApp({ today: '2026-11-14', csv, liveRates: TODAY });
  const state = app.saved();
  assert.strictEqual(state.rates.MNT, 0.11);
  assert.strictEqual(state.pastMonths[0].rates.MNT, 0.11);
  assert.deepStrictEqual(state.typedRates, ['MNT']);
  assert.deepStrictEqual(row(app, 'Food'), ['Food', '110', '220']);
});

test('the rates request sends nothing about the budget', async () => {
  // The fake service answers only its fixed address: anything added to it
  // (a query, a path) would not match and the rates would not arrive.
  const app = await openApp({ today: '2026-11-14', liveRates: TODAY });
  assert.strictEqual(app.saved().ratesDate, '2026-11-14');
});
