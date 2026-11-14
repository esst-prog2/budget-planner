# Process

One row per step, added with that step's commit (rule in AGENTS.md).

| Date | Step | What the tool did | What I decided |
|---|---|---|---|
| 2026-11-14 | Set up this log | Added the process-log rule to AGENTS.md, created PROCESS.md and logged the decision in PLANNING_LOG.md. | After each step from now on: commit, and add a row here with the step, what the tool did and what I decided. |
| 2026-11-14 | Demo screenshots | Ran the README demo with `node server.js --demo` in a headless Chrome (own empty profile) and saved 11 screenshots in demo/screenshots/: 170000 left to plan, "Food: 10000 over plan", 30 transactions imported with report columns from 2026-08, the Food warning gone after deleting the typed 90000, and a past month's inputs. Only the made-up sample data is shown. | Commit the screenshots and push. |
| 2026-11-14 | Install tools for the promo page (assignment step 2) | Installed Bun 1.4.4 with the official installer and gstack v1.99.4.0 (git clone into ~/.claude/skills/gstack, `./setup --no-browser` with the optional hooks off); setup still registered one Stop hook for its session timeline. Checked the Impeccable install steps on impeccable.style. | Install Bun and gstack; I install Impeccable myself with `/plugin`. Publish the page from the repository root (to be revisited: the root index.html is the app). |
