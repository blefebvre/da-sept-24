# table-prize

Custom **table** block. Purpose: prize-odds-table.

## Authoring (Document Authoring)

Model: `standalone`

Single block table. See "Content structure" below.

## Supported variations

No variations.

## Universal Editor fields

N/A (Document Authoring project)

## Content structure

The first row is the header row; each row after it is a data row:

| Table Prize | | |
| --- | --- | --- |
| Number of winning numbers | Total | Number of wins per category |
| 6/6 | ... | ... |

- Rendered as a real `<table>`: the first row becomes `<thead>` with `<th scope="col">`, the other rows become `<tbody>`.
- A row with fewer cells than the widest row has its last cell span the missing columns. Empty rows are skipped.
- Wide tables scroll horizontally on small screens; the scroll region can be focused with the keyboard.
