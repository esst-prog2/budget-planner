---
name: Budget Planner promo page
description: One passport, opened. Every currency enters as a stamp that reads in forints.
colors:
  cover: "#1c2b4a"
  cover-deep: "#142039"
  foil: "#c9a85a"
  on-cover: "#e7ecf5"
  on-cover-soft: "#aab6ca"
  paper: "#eef0ea"
  paper-band: "#e2e7de"
  ink: "#18202f"
  ink-soft: "#364254"
  label: "#4a6352"
  guilloche: "#6e8f7a"
  stamp-violet: "#5b3f8c"
  stamp-red: "#b3322b"
  stamp-green: "#2f6b4f"
typography:
  display:
    fontFamily: "Archivo, Arial Narrow, sans-serif"
    fontSize: "clamp(2.8rem, 5.6vw, 5.2rem)"
    fontWeight: 850
    lineHeight: 1.02
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Archivo, Arial Narrow, sans-serif"
    fontSize: "clamp(1.6rem, 2.5vw, 2.2rem)"
    fontWeight: 800
    lineHeight: 1.08
    letterSpacing: "-0.01em"
    fontVariation: "'wdth' 112"
  title:
    fontFamily: "Archivo, Arial Narrow, sans-serif"
    fontSize: "clamp(1.45rem, 2.2vw, 1.9rem)"
    fontWeight: 800
    lineHeight: 1.1
    fontVariation: "'wdth' 112"
  document-caps:
    fontFamily: "Archivo, Arial Narrow, sans-serif"
    fontSize: "0.9rem"
    fontWeight: 700
    letterSpacing: "0.2em"
    fontVariation: "'wdth' 125"
  body:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "0.72rem"
    fontWeight: 650
    letterSpacing: "0.14em"
  mono:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.88em"
    fontWeight: 400
rounded:
  code: "4px"
  shot: "6px"
  button: "8px"
  command: "10px"
  page: "14px"
  stamp: "16px"
  card: "18px"
spacing:
  gutter: "16px"
  page-pad: "clamp(24px, 4vw, 64px)"
  page-gap: "1.1rem"
  spread-gap: "clamp(48px, 7vw, 96px)"
components:
  button-primary:
    backgroundColor: "{colors.cover}"
    textColor: "{colors.on-cover}"
    rounded: "{rounded.button}"
    padding: "0.85rem 1.35rem"
  button-primary-hover:
    backgroundColor: "{colors.stamp-violet}"
    textColor: "{colors.on-cover}"
  page:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.page}"
    padding: "{spacing.page-pad}"
  stamp-violet:
    textColor: "{colors.stamp-violet}"
    rounded: "{rounded.stamp}"
    padding: "1.1rem 1.3rem"
  stamp-red:
    textColor: "{colors.stamp-red}"
    padding: "1.5rem 1.9rem"
  stamp-green:
    textColor: "{colors.stamp-green}"
    rounded: "{rounded.stamp}"
    padding: "1.1rem 1.3rem"
  residence-card-title:
    backgroundColor: "{colors.cover-deep}"
    textColor: "{colors.foil}"
    padding: "0.9rem 1.6rem"
  command-block:
    backgroundColor: "{colors.cover-deep}"
    textColor: "{colors.on-cover}"
    rounded: "{rounded.command}"
    padding: "1.1rem"
---

# Design System: Budget Planner promo page

> **Scope.** This system governs the promo page in `docs/` only (`docs/index.html`, `docs/style.css`, `docs/rates.js`, `docs/img/`). The Budget Planner app at the project root (`index.html`, `style.css`) keeps its own plain look (system-ui type, light/dark neutrals, one green accent) and is **not** part of this world. Do not restyle the app from this file, and do not pull the app's tokens into the promo page.

## Overview

**Creative North Star: "Passport and Residence Card"**

The page is one passport, opened on its navy leather cover. Each section is a two-page spread of pale security paper printed with authored green guilloche linework; the visitor turns spreads from the opening page (holder fields, a machine-readable line) through the visa page where three rubber stamps press today's exchange rates in forints, then a month of the real app pasted in like mounted photos, a laminated residence card that states where the data lives, and finally the command to run it. The cover between spreads carries the section titles in foil capitals, as if embossed.

Density is document-like: generous page padding, short measures (46ch), small tracked capitals for field labels, and a single display headline per spread. Ornament is never free: the guilloche, the stamps, the photo corners and the MRZ line are all things real identity documents carry, and each one holds content (a rate, a screenshot, the product name). The page refuses the fintech landing: no headline beside a laptop, no row of three feature cards.

**Key Characteristics:**
- Navy cover as the ground; paper pages as the only reading surface.
- Spreads of two pages that stack into one sheet below 860px.
- Rubber-stamp inks (violet, red, green) multiplied onto the paper with a rough displaced edge.
- Expanded grotesque capitals for document headings; a mono for the MRZ, rates, code and the command.
- One laminated residence card on the cover, the only iridescent surface.
- Motion is one gesture: stamps press once when live rates arrive.

## Colors

Two grounds (navy leather and pale security paper) and three stamp inks; everything else is ink-on-paper or foil-on-leather.

### Primary
- **Cover Leather Navy** (cover): the page ground between spreads (with a soft lighter bloom, `#243759`, at the top of the viewport), the primary button, and the photo corners on screenshots.
- **Deep Cover Navy** (cover-deep): the back cover, the residence card's title band, and the command block. The darkest surface; it reads as the inside of the binding.
- **Foil Gold** (foil): embossed section titles on the cover, the residence card title, and links on the back cover. Only ever on navy.

### Secondary
- **Visa Violet** (stamp-violet): the tögrög stamp, the primary button's hover, focus rings, text selection, and the caret. The one interactive accent.
- **Entry Red** (stamp-red): the euro stamp and every over-plan warning ("Food: 10000 over plan"). Red always means a warning or the red stamp; never decoration.
- **Visa Green** (stamp-green): the dollar stamp and the copy-success status line.

### Neutral
- **Security Paper** (paper): every page surface, under the guilloche pattern.
- **Paper Band** (paper-band): inline code chips on paper.
- **Document Ink** (ink): headings and field values.
- **Soft Ink** (ink-soft): body copy, the lede, the MRZ line.
- **Field-Label Green** (label): tracked capitals for field labels, page titles, folios, screenshot notes, and their hairline rules (`rgba(74, 99, 82, 0.4)`).
- **Guilloche Green** (guilloche): the linework in `img/guilloche.svg` (at 0.32 stroke opacity), list markers, and the scrollbar thumb. Never text.
- **Cover Text** (on-cover) and **Soft Cover Text** (on-cover-soft): text on navy (button labels, command text; cover notes and the back cover).

### Named Rules
**The Two Grounds Rule.** Text sits on paper or on navy, never on anything else. Paper takes ink; navy takes foil or cover text.

**The Ink Means Something Rule.** Stamp inks are reserved for stamps, warnings, and state (violet for interaction, red for over-plan, green for success). No ink as a decorative fill.

## Typography

**Display Font:** Archivo variable (width 62–125, weight 400–900), with Arial Narrow fallback
**Body Font:** Archivo, with system-ui fallback
**Label/Mono Font:** JetBrains Mono (400, 600), with ui-monospace fallback

**Character:** One grotesque family stretched across its width axis: expanded (112–125%) and heavy for document headings and stamps, normal width for reading. The mono is the machine voice of the document: the MRZ line, the rates, code and the command.

### Hierarchy
- **Display** (850, clamp(2.8rem, 5.6vw, 5.2rem), 1.02): the opening headline only, the product name "Budget Planner".
- **Headline** (800, width 112%, clamp(1.6rem, 2.5vw, 2.2rem), 1.08): page headings on spreads.
- **Title** (800, width 112%, clamp(1.45rem, 2.2vw, 1.9rem), 1.1): the five "month in it" step headings.
- **Cover title** (800, width 125%, clamp(1.5rem, 3.2vw, 2.6rem), 0.05em, uppercase, foil): section titles embossed on the cover between spreads.
- **Document caps** (700, width 125%, 0.9–0.95rem, 0.18–0.2em, uppercase, label green, hairline rule below): a page's own title ("Today's entries"), as a document prints its issuing title.
- **Body** (400, 1.0625rem, 1.6): reading copy, max 46ch on pages; the lede steps up to clamp(1.1rem, 1.4vw, 1.25rem).
- **Label** (650, 0.72rem, 0.14em, uppercase): field labels (Holder, Lives in, Saved in) in holder fields and on the residence card.
- **Mono**: the MRZ line, sized to the page (`100cqi / 31`) so its 44 characters stay on one line; rates inside stamps (600, -0.02em, tabular); code chips (0.88em); the command.

### Named Rules
**The Width Axis Rule.** Hierarchy is carried by Archivo's width axis as much as by size: document voice is expanded (112–125%), reading voice is normal width. Don't introduce a second display family.

**The Machine Line Rule.** Mono is for what a machine reads or a person types: MRZ, rates, file names, URLs, commands. Not for labels or headings.

## Layout

A spread is a two-column grid (max 1180px, centred) of a left and right page, with no gap: the pages meet at a spine shaded by inset shadows on their inner edges. Spreads are separated by clamp(48px, 7vw, 96px) of navy cover. Page padding is clamp(24px, 4vw, 64px) (the opening spread is clamp(24px, 3.4vw, 52px) and at least clamp(560px, 100vh − 96px, 800px) tall), with an extra 1.5rem at the bottom for the centred folio (page number in mono). Page content stacks in a column with a 1.1rem gap. The main gutter is 16px.

Below 860px the spread becomes one column: the left page rounds its top corners, the right page its bottom corners, and the spine shadow moves to the seam between them. The opening spread collapses into a single sheet and reorders so the stamps follow the headline and the action, with folios hidden. Below 420px stamps drop their minimum width and the rate line may wrap.

Pages are size containers (`container-type: inline-size`), so the MRZ line and the command text scale to the page, not the viewport.

## Elevation & Depth

Depth is physical and sparse: the passport lies on the cover, things are pasted onto pages, and the residence card lies on the cover beside it. There are no elevation steps for UI chrome.

### Shadow Vocabulary
- **Passport on the cover** (`filter: drop-shadow(0 2px 1px rgba(205,211,199,0.9)) drop-shadow(0 26px 34px rgba(4,10,24,0.55))`): every spread; the first drop-shadow reads as the stacked page edges.
- **Spine** (`box-shadow: inset ±34px 0 34px -30px rgba(28,43,74,0.38)`): the inner edge of each page.
- **Mounted photo** (`box-shadow: 0 1px 2px rgba(20,32,57,0.12), 0 18px 34px -18px rgba(20,32,57,0.55)`): screenshots pasted on a page.
- **Laminated card** (`box-shadow: 0 28px 56px -20px rgba(4,10,24,0.8)`): the residence card.
- **Pressed button** (`box-shadow: 0 1px 0 rgba(255,255,255,0.15) inset, 0 6px 14px -8px rgba(20,32,57,0.7)`): primary buttons.
- **Command block** (`box-shadow: 0 16px 30px -18px rgba(4,10,24,0.9)`).

### Named Rules
**The Ink Has No Height Rule.** Stamps never cast shadows. They are ink multiplied into the paper (`mix-blend-mode: multiply`, opacity 0.92), roughened by the shared `#ink` SVG displacement filter.

## Shapes

Corners are soft and document-scaled: pages 14px on their outer corners only (square at the spine), the residence card 18px, stamps 16px (the red stamp is an oval, `50% / 42%`; the wide warning stamp 10px), the command block 10px, buttons 8px, screenshots 6px, code chips and focus rings 4px. Stamps carry a double border: a 3px outer rule in ink, then a 5px paper gap and a 1.5px inner rule (inset box-shadows), and each sits at its own small tilt (−6°, 5°, −2°, −3°). Screenshots are held by two navy triangular photo corners (22px, top-left and bottom-right).

## Components

### Buttons
Solid and pressed-in, like a navy cover button.
- **Shape:** gently rounded (8px).
- **Primary:** navy cover fill, cover text, Archivo 700 at width 112%, 1rem, padding 0.85rem 1.35rem; an optional 18px inline SVG icon at 0.55rem gap (Copy).
- **Hover / Active:** fill shifts to Visa Violet over 0.2s `cubic-bezier(0.16, 1, 0.3, 1)`; active nudges down 1px.
- **Focus:** 3px violet outline, 3px offset, everywhere.
- **Text link:** 650 weight in cover navy, 1.5px underline at 0.22em offset, violet on hover. Used beside the primary button and for "Source on GitHub".

### Pages
- **Corner Style:** 14px on outer corners only.
- **Background:** Security Paper under `img/guilloche.svg` tiled at 480 × 240px.
- **Shadow Strategy:** spine inset only; the spread carries the drop shadow.
- **Internal Padding:** clamp(24px, 4vw, 64px), plus a mono folio centred 16px from the bottom.

### Holder fields
A two-column definition grid at the foot of the opening page: tracked green labels over 650-weight ink values, followed by the MRZ line spelling only the product (`P<BUDGET<PLANNER<<…`). Never real-looking personal ID data.

### Entry stamps (signature)
Rubber stamps carrying a route (`₮ → Ft`, 900 weight, width 125%), a rate line (mono figures, the "1 MNT =" prefix at 0.75em), and a date and place in tracked caps. Three inks, three shapes, three tilts, in a two-column grid with the third stamp spanning both. When live rates arrive the stamps press once in sequence (`press` keyframes: scale 1.08 → 0.985 → 1 with opacity 0.55 → 0.92 over 0.55s `cubic-bezier(0.16, 1, 0.3, 1)`, staggered 0.14s); with reduced motion they are simply still. The wide variant (red, 10px corners, uppercase 850) stamps a warning onto a page.

### Mounted screenshots
Real app screenshots on white, 6px corners, held by navy photo corners, cropped to the app's content column; lift 3px on hover (0.25s). A short label-green note may follow.

### Residence card
The one laminated object: max 600px on the cover, 18px corners, a white hairline edge, guilloche over a pale iridescent gradient (`linear-gradient(128deg, #e8eef3, #dbe5ec 46%, #e8e2ef 72%, #e3ebe4)`), a deep-navy title band in foil caps, then label/value rows (9.5rem label column, single column below 860px).

### Command block
Deep navy, 10px corners, cover-text mono at a page-relative size (clamp(0.78rem, (100cqi − 2.2rem) / 33, 0.95rem)), line-height 1.75, wrapping only at marked breaks after "/". Followed by the primary Copy button and a green polite status line.

### Cover titles and back cover
Section titles sit on the navy between spreads in foil capitals; the back cover is a deep-navy band with soft cover text and foil links.

## Do's and Don'ts

### Do:
- **Do** put all reading content on paper pages; the cover carries only foil titles, short notes and the residence card.
- **Do** keep stamp inks for stamps, warnings and state: violet for interaction and focus, red for over-plan, green for success.
- **Do** carry document voice with Archivo's width axis (112–125%) and tracked uppercase labels in label green with a hairline rule.
- **Do** use the mono for machine text: MRZ, rates, file names, URLs, commands.
- **Do** keep stamps flat ink: multiply blend, the `#ink` displacement filter, a small tilt, no shadow.
- **Do** show the real app in screenshots with demo data, mounted with photo corners.
- **Do** stack spreads to one column below 860px, keeping reading order.
- **Do** keep motion to the single stamp press, and still for reduced motion.

### Don't:
- **Don't** apply this world to the Budget Planner app itself; it keeps its own plain look.
- **Don't** build a fintech landing: no headline beside a device mockup, no row of three feature cards.
- **Don't** print real-looking ID data (names, birth dates, document numbers) in holder fields or the MRZ; spell only the product.
- **Don't** set text on the guilloche green or use foil on paper.
- **Don't** add drop shadows to stamps or to text.
- **Don't** introduce a second display family or a system display face.
