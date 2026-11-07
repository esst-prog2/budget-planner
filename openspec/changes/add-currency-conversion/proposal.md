## Why

The budget is planned in forints, but money is also spent in other currencies: the bank statement is in tögrög (MNT), and euros and dollars are common for international students. Until now these amounts were added to the budget as if they were forints.

## What Changes

- The budget is in HUF. An "Exchange rates" section lets the user type how many HUF one MNT, EUR and USD is worth. Rates are not fetched online; the app still makes no network calls.
- A typed expense gets a currency choice (HUF, MNT, EUR, USD). Income, must-pays and plans stay in HUF.
- Each entry keeps its own amount and currency. Its HUF value is always worked out with the current rate, so changing a rate updates every month, past months included.
- Statement purchases, transfers and money in are converted from MNT.
- An expense in a currency without a rate is not added, and the user is told to enter the rate. Imported entries without a rate are saved and counted as 0 until the rate is typed, with a warning naming the missing rate.
- **Explicitly excluded:** other currencies for income, must-pays and plans; fetching rates online; rates per date.

## Capabilities

### New Capabilities
- `currency-conversion`: typing exchange rates, choosing an expense's currency, and converting entries and statement totals into HUF with the current rate.

### Modified Capabilities
- `input-history`: an entry stores its currency, and the history shows the HUF value with the original amount, e.g. "4000 (10 EUR)".
- `statement-report`: statement amounts are treated as MNT and converted.

## Impact

- `app.js`: state gets `rates`; entries get `currency`; actual amounts are HUF values worked out from entries and rates.
- `statement.js`: `STATEMENT_CURRENCY` ('MNT').
- Data saved before this change: statement entries are read as MNT, all other amounts as HUF.
- The carry-over is still worked out once, at the month change, with the rates of that day; a later rate change does not alter it.
