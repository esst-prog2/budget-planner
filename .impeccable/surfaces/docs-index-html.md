---
version: 1
slug: "docs-index-html"
primary_target: "docs/index.html"
related_targets: ["docs/style.css","docs/rates.js"]
---

# Surface brief: promo page (docs/index.html)

Scope: the public GitHub Pages promo page for Budget Planner. Mode: Persuade. Code-led build (no image generation).
Audience and job: international students in Budapest, Mongolian students first; understand the forint budget that converts their home currency, then run it from a clone. Teacher and classmates also read it.
Action: copy the three-line `node server.js --demo` command (working form), plus the repository link.
Proof: today's real MNT/EUR/USD rates on the page; the real app in demo screenshots (sample data).
Constraints: plain HTML/CSS/minimal JS in docs/; nothing personal; no real-looking ID data; Exchange Rate API attribution; copy from design/promo-page.md (73 tests). Full brief: design/promo-page-brief.md.
Memorable moment: three entry stamps pressing today's rates onto the visa page.
Open: byline (none unless the user adds a name).

## Direction contract

THESIS: Your money crosses the border with you: the page is one passport, and every currency enters as a stamp that reads in forints. It refuses the fintech landing (headline beside a laptop, three feature cards).

OWN-WORLD: Navy cover leather (#1C2B4A) as the ground between spreads; pale security paper pages (#EEF0EA) with authored green guilloche linework; rubber-stamp inks in violet, red and green, multiplied onto the paper with a rough edge; one laminated residence card; expanded grotesque capitals for document headings, a mono for the machine-readable line, rates and the command.

STORY: The visitor sees their own currencies stamped as forints today, reads the problem (adding three currencies up at month end), walks one month in five spreads of the real app, learns their data stays on their computer, and copies the command.

FIRST VIEWPORT: One open spread centred on the navy cover. Left page: the product name "Budget Planner" as the headline at display scale (user change, 2026-11-14), a subline naming money from home in tögrög, euros or dollars and spending in forints, the primary "Try it in 2 minutes" button and "See a month in it", holder fields and an MRZ line spelling only the product. Right page: three tilted entry stamps, ₮ → Ft, € → Ft, $ → Ft, with today's rates and date, and the attribution link.

FORM: Passport and Residence Card, Impeccable's pick (grounded list position 1), chosen over the rolled direction; seed:4a59c1c63ad37c0f. Signature interaction: the stamps press once when the live rates arrive (still for reduced motion); the Copy button on the command.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
