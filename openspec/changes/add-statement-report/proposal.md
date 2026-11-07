## Why

Typing every expense by hand is the step that gets skipped. The bank already lists every card payment, so reading its deposit statement (.xlsx) gives a categorized report of past months and fills in this month's actual spending without retyping.

## What Changes

- Add a statement file picker to the page. The .xlsx file is read in the browser only (no server, nothing uploaded, no libraries).
- Sort each transaction: money in, transfers to people or own accounts, and spending (purchases, QPay/Happy Pay payments, bank fees). Only spending counts.
- Put spending into the six categories by shop-name keywords; anything not matched goes to "other".
- Show a report with one column per month: spending per category and in total, plus transfers out and money in, listed but not counted.
- Add this month's spending to the planner's actual amounts, once per transaction, even if the same statement is imported again. Earlier months are only shown in the report.
- **Explicitly excluded:** choosing a category per transaction by hand, currency conversion (the statement is treated as the budget's currency), statement formats of other banks.

## Capabilities

### New Capabilities
- `statement-report`: importing a bank statement, sorting and categorizing its transactions, showing the monthly report and feeding this month's spending into the planner.

### Modified Capabilities
(none — recording expenses by hand works as before)

## Impact

- New `statement.js` (reading the .xlsx, sorting, report), loaded before `app.js`.
- The saved state gets `importedIds`, the transactions already added this month; the report's monthly totals are saved under `budgetPlanner:v1:report`. No single transactions are stored.
- Real statements stay local: `*.xlsx` is in `.gitignore`; the tests build a made-up statement in memory.
