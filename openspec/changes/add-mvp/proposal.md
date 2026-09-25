## Why

Right now budget-planner is only a README describing an idea. Students (especially international students juggling rent, phone, transport, and everyday spending) have no working tool yet to see what's left after must-pay bills, plan the rest, and get warned when they overspend a category. This change builds the first working version so the app can actually be used and demoed.

## What Changes

- Add a browser-only web page (HTML/CSS/JS) with no backend server.
- Persist all data in the browser's `localStorage` — no login, no database, no cross-device sync.
- Let the user enter one month's income and three fixed must-pay expenses (rent, phone, transport), and show what's left to plan.
- Let the user manually enter a plan amount for each of six fixed flexible categories: food, clothes, gym, subscriptions, going out, and other. No auto-suggested amounts, no user-created categories.
- Let the user record actual expenses against a category; anything that doesn't match one of the five named flexible categories goes into "other".
- Show planned vs. actual spending per category as text plus a progress bar, with a warning when actual spending passes the plan (e.g. "Food: 15 over plan").
- Automatically start a fresh month when the real-world month changes, carrying any leftover money from the previous month into the new month's income.
- **Explicitly excluded from this change** (tracked for later, not built now): multiple currencies, real savings goals, user-created categories, push notifications, planning for future one-off events, duplicate-income-entry detection, smarter/weighted suggested category amounts, pre-filling must-pay amounts from the previous month.
- **Note:** this supersedes the README's "Demo" section wording where it describes the app suggesting category amounts (e.g. "food 200, going out 80") — in this version those fields start empty and the user fills them in.

## Capabilities

### New Capabilities
- `budget-setup`: entering monthly income and the three must-pay expenses, computing what's left to plan, and manually entering plan amounts for the six fixed flexible categories.
- `expense-tracking`: recording actual expenses against a category (falling back to "other" when unmatched), and showing planned-vs-actual per category as text plus a progress bar, including the over-plan warning.
- `monthly-reset`: automatically detecting a new calendar month and starting it fresh, carrying the previous month's leftover money into the new month's income.

### Modified Capabilities
(none — this is a greenfield project with no existing specs)

## Impact

- Affected code: none exists yet; this creates the entire app from scratch as a static, dependency-free web page.
- No backend, API, or database is introduced — all state lives in the browser via `localStorage`.
- No changes to `openspec/config.yaml` are needed.
