# columns-winner

Custom **columns** block. Purpose: winner-claim-promo.

## Authoring (Document Authoring)

Model: `standalone`

Single block table. See "Content structure" below.

## Supported variations

No variations.

## Universal Editor fields

N/A (Document Authoring project)

## Content structure

One row, two cells:

| Columns Winner | |
| --- | --- |
| ## Congrats! You're a winner, now what?<br>See how to claim your prize.<br>[CLAIM YOUR TICKET](/...) | (image) |

- Text cell: heading, paragraph(s), link. Extra text cells are merged into the first.
- Image cell: a single image, pinned top-right (overflowing the box top) from 768px up; on mobile it is a cropped strip between the copy and the CTA.
- A paragraph containing only a link becomes the chevron call to action.
- If there is no image, the text spans the full width.
