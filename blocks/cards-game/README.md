# cards-game

Custom **cards** block. Purpose: game-tiles.

## Authoring (Document Authoring)

Model: `standalone`

Single block table. Content: one row, one cell of content.

## Behaviour

- One row per tile: image cell + content cell (heading, description, final link-only paragraph = CTA).
- The CTA link gets the global `button` class (ALC pill). The description is clamped to 50px, like the source.
- Below 768px the tiles become a one-at-a-time swipe carousel with prev/next and dot controls; from 768px it's a two-column grid.

## Supported variations

No variations.

## Universal Editor fields

N/A (Document Authoring project)
