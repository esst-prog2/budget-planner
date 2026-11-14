# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

The app: plain HTML, CSS and JavaScript with a small Node server (`server.js`), no dependencies, no build step. The promo page in `docs/`: plain HTML and CSS served by GitHub Pages as-is (user's choice, 2026-11-14).

## Users

International students in Budapest. Their scholarship or part-time salary comes in forints, while family aid and savings arrive in another currency (Mongolian tögrög, euros or dollars); rent, food and transport are paid in forints. Their job: know during the month, in forints, how much is left and where it went, instead of adding three currencies up at month end with a googled rate.

Also reading the promo page: the course teacher and classmates (Advanced Programming, ELTE, 2026). The page talks to the student.

## Product Purpose

Budget Planner is a monthly forint budget for one student: incomes in their own currencies (a scholarship or salary in forints, family aid in tögrög, euros or dollars), three must-pays (rent, phone, transport), a plan per category, expenses typed or imported from a bank statement, and a warning the moment a category goes over its plan. Success: the student sees overspending as it happens, not after the money is gone.

## Positioning

Every amount in MNT, EUR or USD is converted to forints at today's rate (fetched online, or the student's own bank rate), and a whole Mongolian bank deposit statement (.xlsx, in tögrög) is read in the browser and sorted by shop into Food, Going out, Unknown and the rest, one month per column. Each month keeps the rates it ended with. Ordinary budget apps assume one currency and one country's banks.

## Operating Context

- Runs on the student's own computer: `node server.js`, then http://127.0.0.1:8765. `node server.js --demo` starts an empty demo budget on port 8766.
- Data lives in one file, `budget-data.csv`, that opens in Excel.
- Input: the deposit statement .xlsx the bank exports (Mongolian headers: Огноо, Орлого, Зарлага, Гүйлгээний утга).
- Rates: open.er-api.com, free and keyless, updated daily; only the code "HUF" is sent.

## Capabilities and Constraints

- Budget in HUF. Incomes and expenses in HUF, MNT, EUR, USD, converted at the month's rate.
- Seven fixed categories: Food, Clothes, Gym, Subscriptions, Going out, Other, Unknown.
- History of every expense with date and time; current-month entries can be deleted; past months are read-only and show what was entered.
- Monthly report: one column per month, spending against plan, transfers and money in kept apart, the rate each month used.
- Not built: custom categories, savings goals, notifications, must-pays or plans in other currencies, historical rates for past months.
- Privacy: nothing leaves the computer except the rate request; the statement file is never uploaded, only date, category and amount of each purchase are saved.

## Brand Commitments

- Name: Budget Planner.
- Nothing personal on public surfaces: no real budget numbers, statements, names or account details. The promo page is published from `docs/` only.
- "Rates By Exchange Rate API" attribution wherever rates are shown or promoted.

## Evidence on Hand

- `demo/sample-statement.xlsx`: a made-up statement in the real bank format, 30 transactions, August to November 2026 (written by `demo/make-sample-statement.js`).
- `demo/screenshots/01-…11-*.png`: the README demo walked in the real app with live rates and sample data only.
- 73 automated tests (`node --test`).
- Approved promo page copy: `design/promo-page.md`.
- No users, testimonials, downloads or press exist; none may be invented.

## Product Principles

1. Forints are the truth: every number the student sees is in forints, with the original amount beside it.
2. Warn while it still helps: the over-plan warning appears the moment it happens.
3. The student's data stays on their computer.
4. Only claim what the app does today; demo data is labelled as sample.
5. No dependencies: anyone can run it from a clone with Node alone.
