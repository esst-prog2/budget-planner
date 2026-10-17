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

## 2. Correctness: bugs and edge cases

Looked at: every calculation and input handler in `app.js`. Each suspected bug was first reproduced by running the real `app.js` with a fake browser, before changing anything.

| Finding | Action |
| --- | --- |
| Negative amounts were accepted: typing `-500` as income stored -500 (`min="0"` only limits the spinner, not typing). Same for must-pays, plans and `1e999` (Infinity, saved as `null`) | Fixed: one `parseAmount` helper; anything that is not a positive finite number counts as 0 |
| Floating-point drift: plan 0.6, expenses 0.1 + 0.2 + 0.3 gave 0.6000000000000001 and a red "Food: 0 over plan" while exactly on plan | Fixed: amounts and the leftover are rounded to cents (`roundCents`) |
| Saved data with any field missing (older version, hand edit) crashed the app on load (`Cannot read properties of undefined (reading 'rent')`), leaving an empty page | Fixed: `normaliseState` copies saved data onto a fresh state; missing or broken fields become 0 |
| The new month is detected only when the page is opened; a tab left open across the month change keeps the old month until reload | Not changed: the spec says "when the user opens the app". Known limitation |

## 3. Spec conformance

Looked at: `app.js` against the three specs in `openspec/changes/add-mvp/specs/`, plus `design.md` and `README.md`.

| Finding | Action |
| --- | --- |
| Code matches every spec requirement checked: left to plan (481 example), six fixed categories with empty plans, "Food: 15 over plan" wording, carry-over formula, skipped months, negative leftover | None needed |
| `design.md` state schema and leftover formula left out the carried-over amount added in HW4 | Fixed: `carryOver` added to both |
| README still described the early idea: the app "suggests" plan amounts (spec: starts empty), "sends notifications" (it shows an in-app warning), leftover goes "into savings" (it is carried over); open questions already decided; "Other" missing from the category list; no instructions to run the app or tests | Fixed: those facts corrected, a "Run it" section added; the rest of the wording kept |
| `tasks.md` 3.3 describes left to plan without the carry-over | Not changed: it records what was done at the time; the spec is the source of truth |
| The two README/spec examples (481 left, "Food: 15 over plan") had no automated test | Moved to review 4 |

## 4. Tests

Looked at: `test/rollover.test.js`, `test/full-month.test.js`, `test/full-month-planted.csv`, and what the specs require.

| Finding | Action |
| --- | --- |
| The fake browser (fake element, fake `localStorage`, fake `document`) was copied into both test files | Fixed: moved to `test-support/fake-browser.js` (outside `test/`, so `node --test` does not count it as a test file); both files use it, their test cases unchanged |
| The fake `appendChild` threw children away, so nothing in the spending summary was ever checked; the over-plan warning, the main feature, had no test | Fixed: the fake keeps children; tests can read the warnings on screen |
| The README/spec examples (481 left to plan, "Food: 15 over plan") had no automated test | Fixed: `test/budget.test.js`, plus "no warning when exactly on plan" |
| The three bugs from review 2 had no regression tests | Fixed: one test each in `test/budget.test.js` |

Red/green check: against the pre-review `app.js` (from `main`) the three regression tests fail and the three spec tests pass (those features already worked). With the warning switched off in `app.js`, the "Food: 15 over plan" test fails. With the reviewed `app.js`, `node --test` passes 17 of 17 (8 rollover + 3 full-month + 6 budget).
