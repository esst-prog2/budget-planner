# Design brief: Budget Planner promo page

Made with `/impeccable shape` on 2026-11-14. Content: `design/promo-page.md` (approved). Product truth: `PRODUCT.md`.

## 1. Job and audience

- **Who arrives:** international students in Budapest, Mongolian students first, coming from a classmate's link, the course page or GitHub. They have their own money troubles: a scholarship in tögrög, rent in forints. The teacher and classmates read it too.
- **Mode:** Persuade. In a few seconds the visitor must know what this is (a forint budget that converts their home currency), why it matters (overspending shows up while it still helps), and what to do (run it from a clone in two minutes).

## 2. Outcome and proof

- **Primary action, in its working form:** the three-line command (`git clone …`, `cd budget-planner`, `node server.js --demo`) with a Copy button, plus a link to the repository. No sign-up, no download button: this is how the app is really installed.
- **Proof only this product has:** today's real MNT, EUR and USD rates on the page itself, from the same free service the app uses, with the date. Then the real app at work in the demo screenshots (sample data only, labelled as such).
- **Success:** a classmate understands in 10 seconds who it's for and what it does with currencies, and every claim can be checked in the app with the demo data.

## 3. Selected direction: Passport and Residence Card

Chosen on the decision page from a seeded roll (seed:4a59c1c63ad37c0f), as Impeccable's pick over the rolled direction (Painted Ger).

- **Thesis:** your money crosses the border with you. Each currency arrives as an entry stamp and leaves as forints.
- **World:** passport pages, entry stamps and the residence permit card. Passport navy covers, pale security paper with guilloche linework, rubber-stamp violet and red, one laminated card. Palette chips from the round: #1C2B4A navy, #6E8F7A guilloche green, #5B3F8C stamp violet, #B3322B stamp red, #EEF0EA security paper. Exact tokens and faces are decided at build.
- **One object, seen once:** the page *is* one passport, opened. The first viewport is a single open spread on one gutter. More content goes on the next spreads down the page, never extra passports or impossible folds.
- **First viewport:** the left page carries "Budget Planner", the headline "Your money speaks tögrög. Budapest charges in forints.", one line of subcopy and the primary action (jump to the command). The right page is a visa page with three entry stamps, ₮ → Ft, € → Ft, $ → Ft, each carrying today's rate and date, plus the line "Rates By Exchange Rate API".
- **Sequence down the page:**
  1. The problem, in a short entry on a page.
  2. "A month in it": five spreads, each pairing one screenshot with its caption in demo order: 01 left to plan, 02 over plan, 03 rates, 04/06 statement import and report, 08/10 history and a past month.
  3. "Your data stays on your computer", set as the residence card (the laminated card is the page's one card).
  4. "Try it yourself": the command block with Copy.
  5. "How it's built" and "What it doesn't do (yet)".
  6. Back cover: course credit, repository link, rate attribution.
- **Focal moment and motion:** the three stamps press onto the visa page once when the rates arrive. This is the page's single motion, and the stamps stay still for reduced-motion users.

## 4. Scope and boundaries

- **Build:** `docs/index.html`, `docs/style.css`, a small `docs/rates.js` (rates and Copy), and `docs/img/` holding copies of the demo screenshots it uses. Production-ready, static, served by GitHub Pages from `/docs`.
- **Untouched:** the app (`index.html`, `app.js`, `style.css` in the root) and its look. `design/` stays out of `docs/`.
- **Anti-goals:**
  - No real-looking identity document: no national emblems, coats of arms or a copied real passport design, and no machine-readable zone with a person's name or number. Any MRZ-style line spells only the product.
  - No real budget numbers, names or statements.
  - No invented users, testimonials or download counts.
  - Not the fintech template: no laptop mockup beside the headline over three feature cards.
  - Not the cream-paper-and-serif default.

## 5. States and ranges

- **Rates:**
  - Fetched: today's values and date.
  - Offline or the service is down: the last values written into the page at build time, with their date ("rates from 14 Nov 2026").
  - JavaScript off: the same static values. The stamp never shows an empty or zero rate.
- **Screenshots:** seven images at 1000 px wide; each opens full size when clicked or tapped.
- **Copy:** button gives "Copied" feedback; when clipboard access is refused, the command stays selectable text.
- **Copy length:** the headline is fixed. Captions are one or two sentences from the approved content.

## 6. Interaction and layout

- **Desktop:** spreads are two pages on a centred gutter.
- **Phone:** each spread becomes its pages stacked in reading order (left page, then right). The stamps stay legible at 390 px.
- **Hierarchy per spread:** page number and section label (passport style), headline, then the screenshot or content.
- **Keyboard and screen readers:** every action reachable by keyboard, visible focus, and real alt text for every screenshot describing what it shows.

## 7. Constraints and open decisions

- Plain HTML and CSS, minimal JavaScript, no frameworks and no build step. Fonts are self-hosted or a single web-font request, never the overused defaults.
- WCAG AA contrast, including text on guilloche.
- Required: the "Rates By Exchange Rate API" link. Copy comes from `design/promo-page.md`, with the test count updated to 73.
- **Open:**
  - Byline: none unless the user adds a name.
  - Faces and exact tokens are chosen at build, in this world's register.
