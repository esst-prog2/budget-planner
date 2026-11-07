## 1. Reading the statement

- [x] 1.1 Unzip the .xlsx with the browser's DecompressionStream and read the shared strings and first sheet, and verify the real statement gives the same totals as its own total row
- [x] 1.2 Find the header row and turn each dated row into a transaction, and verify title and total rows are skipped

## 2. Sorting and report

- [x] 2.1 Sort into money in, transfers and spending; categorize spending by shop-name keywords, and verify GYM inside LA'GYMA'NYOS is not a gym
- [x] 2.2 Build monthly totals and show them in a table that scrolls sideways on a phone

## 3. Planner

- [x] 3.1 Add this month's spending to the actual amounts once per transaction, and verify a second import adds nothing
- [x] 3.2 Keep the report after a reload and show a message for an unreadable file

## 4. Verification

- [x] 4.1 Tests in `test/statement.test.js` with a made-up statement built in memory
- [x] 4.2 Import a made-up statement in Chrome on a separate local address and compare the table with the expected totals
