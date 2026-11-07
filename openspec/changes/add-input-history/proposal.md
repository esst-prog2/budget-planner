## Why

The app only kept running totals for the current month: once an expense was added it could not be seen or taken back, and at the month change everything but the carry-over was wiped. Users want to see what they entered, fix mistakes, and look back at earlier months in an up-to-date report.

## What Changes

- Every expense is saved as an entry: date and time, category, amount and source (typed, imported from a statement, or saved before the history existed). A category's actual spending is the sum of its entries.
- A History section lists the entries of a chosen month, newest first. Entries of the current month can be deleted; totals, warnings and the report are recalculated. There is no editing: an amount is fixed by deleting and adding again.
- At the month change the finished month is kept (income, must-pays, plans and entries) instead of wiped. The carry-over is calculated as before. Past months cannot be changed, because their leftover has already been carried over.
- One Monthly report replaces the statement-only report: one column per saved month, actual / plan per category, total spending, income and must-pays, with over-plan cells in red. It updates whenever something is typed, deleted or imported.
- Statement import saves every purchase in the history of its own month, earlier months included. Only the current month's purchases change the budget. Transfers and money in are kept as month totals and listed in the report, not counted.
- Data saved before this change is kept: each category's total becomes one "before history" entry.

## Capabilities

### New Capabilities
- `input-history`: saving every expense as an entry, listing and deleting entries, keeping finished months, and the combined monthly report.

### Modified Capabilities
- `statement-report`: imported purchases are saved as history entries in their own month instead of a separate statement report; a deleted imported entry is not added again on a later import.

## Impact

- `app.js`: state gets `entries`, `pastMonths`, `transfers` and `moneyIn`; actuals are computed from entries.
- `statement.js`: the statement-only report (`buildReport`) is removed; money in gets its own transaction id.
- The old `budgetPlanner:v1:report` key is no longer read; it is left in storage untouched.
- Each entry stores no description, so no shop names or card details are saved.
