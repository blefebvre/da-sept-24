# accordion-game

Custom **accordion** block. Purpose: game-rules-faq.

## Authoring (Document Authoring)

Model: `standalone`

Single block table. See "Content structure" below.

## Supported variations

No variations.

## Universal Editor fields

N/A (Document Authoring project)

## Content structure

One row per item, two cells:

| Accordion Game | |
| --- | --- |
| (optional logo image) Prize Payout | Rich text: paragraphs, lists, links |
| Odds of Winning | Intro text<br>[/fragments/lotto/lotto-6-49/odds-of-winning](/fragments/lotto/lotto-6-49/odds-of-winning) |

- Cell 1: item title. It can include a small logo image; links in the title are unwrapped, because the title is the toggle.
- Cell 2: item content (any rich text). If it is missing, the item has an empty body.
- Fragment references: a link containing `/fragments/` on its own line is inlined by the global auto-blocker (`scripts/scripts.js`) and lands inside the item. A plain-text path on its own line (e.g. `/fragments/lotto/lotto-6-49/odds-of-winning`) is loaded with `loadFragment` the first time the item opens.
- Uses native `<details>`/`<summary>`, so it works with the keyboard and screen readers without extra scripting. All items start collapsed.
