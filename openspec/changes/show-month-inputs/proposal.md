## Why

Every month is saved, but for a past month the app showed only its expenses (History) and totals (Monthly report). The income, carry-over, each must-pay and each plan entered for that month could not be looked at again.

## What Changes

- Picking a month in History shows "What you entered for <month>": carried over, income, rent, phone, transport, left to plan, each category as spent / plan (red when over), spending, and what was left ("Left at month end", or "Left so far" for this month).
- Past months are read-only, as before. This month's table follows what is typed.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
(none — shows data already saved; the change sets `skip_specs: true`)

## Impact

- `app.js` (`renderMonthInputs`), `index.html`, `style.css` (the report table style is shared), `test-support/fake-browser.js`, `test/history.test.js`.
- No change to `budget-data.csv` or its format.
