## 1. Project scaffolding

- [x] 1.1 Create `index.html`, `style.css`, and `app.js` and verify the page loads in a browser with no console errors
- [x] 1.2 Lay out page sections for income/must-pays, category planning, expense recording, and category summary, and verify each section renders

## 2. Data layer (state + storage)

- [x] 2.1 Implement a state object matching design.md's schema (`month`, `income`, `mustPays`, `categories`) and verify it round-trips through `JSON.stringify`/`JSON.parse`
- [x] 2.2 Implement load/save functions against `localStorage` key `budgetPlanner:v1`, initializing a fresh empty month when no saved state exists, and verify state persists across a manual page refresh
- [x] 2.3 Implement a "current month" helper returning `YYYY-MM` and verify it matches today's real date

## 3. Budget setup (income, must-pays, remaining, category plans)

- [x] 3.1 Implement the income input bound to `state.income` and verify entering a value updates and persists it
- [x] 3.2 Implement the three must-pay inputs (rent, phone, transport) bound to `state.mustPays` and verify each updates and persists independently
- [x] 3.3 Implement the "left to plan" calculation and display (income minus the sum of must-pays) and verify it shows 481 for income 1200, rent 650, phone 20, transport 49 (matches the README example)
- [x] 3.4 Render the six fixed flexible categories (food, clothes, gym, subscriptions, going out, other) with no add/remove controls, and verify exactly six categories appear with no way to create a new one
- [x] 3.5 Implement a plan-amount input per flexible category, starting empty, bound to `state.categories[x].plan`, and verify entering a value updates and persists only that category's plan

## 4. Expense tracking (record, display, warning)

- [x] 4.1 Implement an expense-entry form with a category dropdown (the six fixed categories) and an amount field, and verify submitting adds the amount to the chosen category's actual total
- [x] 4.2 Verify recording an expense against "other" behaves identically to any other category (no special-case matching logic, per design.md)
- [x] 4.3 Implement the per-category display (name, plan, actual, and a progress bar showing actual as a proportion of plan, capped visually at 100%) and verify it renders correctly for a category with 0 actual, partial actual, and actual over plan
- [x] 4.4 Implement the over-plan warning ("`<Category>`: `<amount>` over plan") and verify it appears for food with plan 200, actual 190, plus a new 25 expense, showing "Food: 15 over plan" (matches the README example), and stays hidden while actual is less than or equal to plan

## 5. Monthly reset

- [x] 5.1 On page load, compare the stored `state.month` to the real current `YYYY-MM` and verify no reset happens when they match
- [x] 5.2 When they differ, compute leftover as income minus the sum of must-pays minus the sum of all six categories' actual spending, and verify the calculation against a manual example, including a case where leftover is negative
- [x] 5.3 Start a new state for the new month: must-pays and all six categories reset to empty, income set to the computed leftover, month set to the new `YYYY-MM`, and verify a simulated month change (e.g. by editing the stored month value) produces exactly this result
- [x] 5.4 Save the new month's state to `localStorage` immediately after reset and verify it persists across a subsequent refresh

## 6. End-to-end verification

- [x] 6.1 Walk through the full README Demo flow manually (enter income 1200 and must-pays rent 650/phone 20/transport 49, see 481 left, set flexible plans including food 200, record a 25 food expense pushing it to 215) and verify the warning "Food: 15 over plan" appears exactly as described
- [x] 6.2 Open the page directly from the filesystem (or a static file server) with no build step and verify all features above work without any backend
