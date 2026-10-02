2026-09-25 — Set up AGENTS.md with the planning-log rule and CLAUDE.md pointing to it — decided by: user
2026-09-25 — Installed Node.js LTS and OpenSpec CLI 1.13.0, ran `openspec init` — decided by: user
2026-09-25 — Configured OpenSpec for the Claude Code tool (`--tools claude`) — decided by: agent
2026-09-25 — MVP: leftover income at month-end rolls into next month's income, instead of vanishing or going into a separate savings bucket — decided by: user
2026-09-25 — MVP: spending shown as text plus a progress bar per category — decided by: user
2026-09-25 — MVP: exactly six fixed categories (food, clothes, gym, subscriptions, going out, other); no user-created categories; unmatched expenses go to "Other" — decided by: user
2026-09-25 — MVP: built as a simple web page (HTML/CSS/JS), not a CLI or desktop app — decided by: user
2026-09-25 — MVP: data persisted in browser localStorage only, no backend/server — decided by: user
2026-09-25 — MVP: flexible category plan amounts are entered manually by the user; no auto-suggested amounts (supersedes the README Demo section's wording) — decided by: user
2026-09-25 — Duplicate-income-entry detection is out of MVP scope, deferred to a later change — decided by: user
2026-09-25 — Named the OpenSpec change "add-mvp" and split it into three capabilities: budget-setup, expense-tracking, monthly-reset — decided by: agent
2026-09-25 — Design: negative leftover carries into the next month unclamped (not floored at zero), shown plainly to the user — decided by: agent
2026-09-25 — Backlog for later weeks (not built this term): multiple currencies, real savings goals, custom categories, push notifications, planning future one-off events, duplicate-income confirmation, smarter category suggestions, pre-filled must-pays from the previous month — decided by: user
2026-10-02 — Spike (issue #3, branch hw4-spike): question is whether a real month of my own spending (all of September, bank statement plus reconstructed cash) fits the six fixed categories — decided by: user
2026-10-02 — Spike answer criterion: the share of flexible September spending that lands in "Other" plus the count of items I had to guess at; if about a third or more lands in Other, six fixed categories is the wrong design. Only counts and shares go in the log, no amounts or merchant names — decided by: user
2026-10-02 — Spike counting script in Node.js at spike/count-categories.js (reads a CSV of category, amount, guessed; prints Other share by items and by money, plus the guessed count); real statement data kept in gitignored spike/*-private.csv — decided by: agent
2026-10-02 — Rollover fix: spec was right, app.js was wrong (pre-filling the income field with the leftover let typing the new salary wipe it out). Leftover is now kept as a separate carry-over amount, shown under income and added to income in "left to plan" and in the next leftover — decided by: agent
2026-10-02 — Rollover tests in test/rollover.test.js using Node's built-in test runner (`node --test`, no dependencies); they run the real app.js with a fake browser and a frozen clock, 8 cases covering same month, new month, typing new income, multi-month carry-over, negative leftover, skipped months, year change, and old saved data — decided by: agent
