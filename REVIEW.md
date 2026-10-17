# HW6 review of the whole repository

Each review looks for one kind of problem across every file, not a diff.
One section per review: what was looked at, what was found, what was done.

## 1. Security and privacy

Looked at: `app.js`, `index.html`, `spike/count-categories.js`, `.gitignore`, and every file ever committed (`git log --all`).

| Finding | Action |
| --- | --- |
| Real bank data (`spike/*-private.csv`) was never committed; `.gitignore` covers all three local files (`git check-ignore`) | None needed |
| No network calls, no external scripts, no secrets; data stays in the browser's `localStorage` | None needed |
| `renderCategorySummary` built the summary header by pasting values into `innerHTML`. Today the values are constants and numbers, but the same pattern becomes an injection hole once custom categories (backlog) let the user type a name | Fixed: header spans are now built with `textContent` |
