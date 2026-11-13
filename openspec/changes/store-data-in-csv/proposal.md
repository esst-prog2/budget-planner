## Why

The budget lived only in one browser's localStorage: it could not be opened in Excel, was lost with the site data, and was split by how the app was opened (file:// and 127.0.0.1:8765 each had their own copy). The data should be in one file that can be read and kept in Git.

## What Changes

- All data (every month's income, must-pays, plans, expenses, imported purchases and statement ids, and the exchange rates) is saved in `budget-data.csv`, one value per row.
- A small Node server (`server.js`, no dependencies) serves the app on 127.0.0.1:8765 and reads and writes the file. Every change writes the whole file at once; a late save never overwrites a newer one.
- The first time there is no file, the budget in localStorage is moved into it. An unreadable file is copied to `budget-data.unreadable-<date>.csv` before a new one is started; without the server, the app says how to start it and saves nothing.
- `budget-data.csv` is committed to the repository (the user's choice; the repository is public).

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
(none — where the data is kept changes, not what the app does; the change sets `skip_specs: true`)

## Impact

- New: `server.js`, `csv-data.js`, `budget-data.csv`, `test/csv-storage.test.js`, `test/server.test.js`.
- Changed: `app.js` (loading and saving), `index.html`, `test-support/fake-browser.js` (fake server; `openApp` now waits for loading), the existing tests (`await openApp`), README "Run it".
