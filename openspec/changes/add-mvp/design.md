## Context

See proposal.md - Why. The project has no existing code yet; this is a greenfield build. The three specs (`budget-setup`, `expense-tracking`, `monthly-reset`) define required behavior; this document covers how a static, dependency-free web page implements them using only `localStorage`.

## Goals / Non-Goals

**Goals:**
- A single static web page (HTML/CSS/JS) that satisfies all three specs, runnable by opening the file or serving it as static content — no build step, no server.
- All state for the current month kept in `localStorage`, surviving page refreshes and browser restarts on the same machine.

**Non-Goals:**
- Any backend, API, database, authentication, or cross-device sync.
- Any of the backlog items already listed in proposal.md (multi-currency, real savings goals, custom categories, notifications, etc.).

## Decisions

**No framework, no build step.**
Plain HTML + CSS + vanilla JS in a handful of files. Alternative considered: a frontend framework (React/Vue) — rejected as unnecessary weight for six fixed categories and a handful of forms; a framework would add tooling (bundler, npm scripts) with no real benefit at this scale.

**Single JSON object in `localStorage` as the entire data model.**
One key (e.g. `budgetPlanner:v1`) holds one JSON object describing the current month only:
```
{
  "month": "2026-09",
  "income": 1200,
  "mustPays": { "rent": 650, "phone": 20, "transport": 49 },
  "categories": {
    "food":          { "plan": 200, "actual": 190 },
    "clothes":       { "plan": 0,   "actual": 0 },
    "gym":           { "plan": 0,   "actual": 0 },
    "subscriptions": { "plan": 0,   "actual": 0 },
    "goingOut":      { "plan": 0,   "actual": 0 },
    "other":         { "plan": 0,   "actual": 0 }
  }
}
```
Alternative considered: one localStorage entry per field — rejected, adds complexity for no benefit since the app only ever shows one month at a time and there is no history feature in this version. The `v1` suffix on the key leaves room to version the schema later without a migration script existing yet.

**Category selection is a fixed dropdown, not free-text matching.**
Recording an expense means picking one of the six fixed categories from a list; "falls back to Other" (per `expense-tracking`) means the user picks "Other" themselves when nothing else fits — there is no text-matching or auto-categorization logic to build.

**Month-change check runs on page load, not on a timer.**
On load, compare the stored `month` to the real current `YYYY-MM`. If they differ, compute leftover from the stored month and start a new month object (see `monthly-reset` spec). No background timers or scheduled jobs — the page only runs while a tab is open, and there is no notification feature this term that would need one.

**Leftover carries through unclamped, including if negative.**
Leftover = income − must-pays − sum of actual spending across all six flexible categories. If the user overspent past their income, leftover is negative and next month's starting income is reduced accordingly, displayed plainly. Alternative considered: clamping leftover at zero — rejected for now, since hiding an overspend would misrepresent the user's real financial position; this can be revisited after trying it.

## Risks / Trade-offs

- [Risk] `localStorage` is per-browser, per-device: clearing site data or switching browsers loses all budget history. → Mitigation: acceptable per proposal.md's explicit exclusion of cross-device sync; an export/import feature could be added later if needed.
- [Risk] If the user doesn't open the app for more than one calendar month, multiple months are "skipped." → Mitigation: treat the most recently saved month as "the previous month" for a single leftover calculation, then jump straight to the real current month; skipped months in between are not synthesized or shown.
- [Risk] No undo/confirmation when recording an expense or changing a plan amount. → Mitigation: acceptable for this version; not a stated requirement.

## Migration Plan

Not applicable — this is the first version with no existing users or data. The `v1` suffix on the `localStorage` key is reserved for a future migration step if the schema changes later.

## Open Questions

- Exact visual styling of the progress bar (colors, threshold shading) is a presentation detail to finalize during implementation; it does not change any spec behavior.
