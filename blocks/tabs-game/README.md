# tabs-game

Custom **tabs** block. Purpose: game-info-tabs.

## Authoring (Document Authoring)

Model: `standalone`

Single block table. See "Content structure" below.

## Supported variations

No variations.

## Universal Editor fields

N/A (Document Authoring project)

## Content structure

One row per tab, two cells:

| Tabs Game | |
| --- | --- |
| Prize Payout | [/fragments/lotto/lotto-6-49/prize-payout](/fragments/lotto/lotto-6-49/prize-payout) |
| Winners | [/fragments/lotto/lotto-6-49/winners](/fragments/lotto/lotto-6-49/winners) |

- Cell 1: tab label (plain text).
- Cell 2: panel content. Usually a single link to a fragment. A plain-text path (`/fragments/...`) or a lone link to another page on the same site is loaded with `loadFragment` when the tab is first opened. Any other content is shown as-is.
- Links containing `/fragments/` are already inlined by the global auto-blocker in `scripts/scripts.js`. The block keeps each link in its panel so the fragment lands there and is fetched only once.
- Empty rows are skipped. A missing label becomes "Tab N".
- Keyboard: Left/Right (or Up/Down) arrow keys move between tabs; Home/End jump to the first/last tab.
