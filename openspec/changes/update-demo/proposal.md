## Why

The README's Demo section still describes the first week's version: income 1,200, 481 left, "Food: 15 over plan". Since then the app has gained the bank statement import, the input history, the monthly report and HUF conversion, and 1,200 is not a realistic amount in forints. The demo on 1 or 8 December is the last chance to change what is shown, and the audience scores the program, so the demo should walk through what the program now does.

## What Changes

- Rewrite the README "Demo" section (section 1) as the path shown in the final presentation: five minutes of screenshots, not a live run.
- The typed budget uses real numbers from October (PLANNING_LOG.md, 2026-10-09): income 300,000 HUF and must-pays of 130,000 leave 170,000 to plan; a 90,000 grocery shop against a food plan of 80,000 shows "Food: 10000 over plan".
- The demo then imports the real statement, `customer-deposit-statement-excel.xlsx` (MNT), after typing the MNT rate under "Exchange rates": 215 transactions, one report column per month from August, tögrög converted to forints and sorted into categories.
- It ends in History: deleting the 90,000 entry clears the warning and updates the report at once.
- Kept as they are: the README examples in "How we would know it works" (481, "Food: 15 over plan") and their tests; they stay the checked examples of the rules.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
(none — only the README's description of the demo changes; no behavior changes, so the change sets `skip_specs: true`)

## Impact

- `README.md`: the Demo section only.
- No code, tests or saved data change.
- The real statement stays out of Git (`*.xlsx` is ignored). The app's screens show dates, categories and amounts, never the name, account or card numbers in the file, so only screenshots of the Excel file itself would need blurring.
- The path was replayed in the test browser with the real statement for screenshots taken in November and in December: the numbers above hold in both; only the import message's split between "this month" and "earlier months" differs, so the demo does not quote it.
- Found when walking the path in Chrome: the screenshots must start from empty saved data, or a carry-over from earlier use is added to the 170000 (the test address showed 170266). And in November the imported Unknown purchases add an "Unknown … over plan" warning that stays, so the demo says the *Food* warning disappears, which holds in November and December.
