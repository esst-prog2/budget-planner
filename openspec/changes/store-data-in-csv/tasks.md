## 1. CSV file

- [x] 1.1 `csv-data.js`: write and read the whole budget as CSV (quoting, Excel BOM, a file that is not a budget); verify with `test/csv-storage.test.js`
- [x] 1.2 `server.js`: serve the app on 127.0.0.1:8765, read and write `budget-data.csv` safely, keep unreadable files, refuse other host names; verify with `test/server.test.js`

## 2. App

- [x] 2.1 Load from and save to the server; move localStorage data into the file on first run; warn when the file is unreadable, the server is not running or a save fails; verify with `node --test` (all earlier tests still pass)
- [x] 2.2 Make the first `budget-data.csv` from the budget saved in the browser and commit it
