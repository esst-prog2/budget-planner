## 1. README

- [x] 1.1 Rewrite the README "Demo" section as the new path, in three to six present-tense sentences with the real filename `customer-deposit-statement-excel.xlsx`, the screens it passes through (Exchange rates, Monthly report, History) and the numbers 300,000 / 130,000 / 170000 / 80,000 / 90,000 / "Food: 10000 over plan" / 215; verify by counting the sentences and checking every quoted screen text against the app
- [x] 1.2 Leave "How we would know it works" (481, "Food: 15 over plan") unchanged and verify `node --test` still passes

## 2. Check the path

- [x] 2.1 Walk the new demo in Chrome on a separate local address with the real statement and verify each sentence matches what the screen shows (170000 left, the warning, 215 transactions, a column per month from 2026-08, the warning gone after deleting the 90,000 entry), then put the test data back
