/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-gallery. Base: columns.
 * Source: https://www.wknd-trendsetters.site/ (photo-gallery grid-layout.desktop-4-column)
 * Target model (blocks/columns-gallery): image-only grid; authored column count drives
 * the desktop grid. Source is a 4-column grid, so 8 tiles => 2 rows x 4 cells.
 * Selectors validated against migration-work/block-context/columns-gallery/source.html.
 */
export default function parse(element, { document }) {
  // Iterate the block-level tile wrappers (div.utility-aspect-1x1); fallback: direct child divs
  let tiles = Array.from(element.querySelectorAll(':scope > .utility-aspect-1x1'));
  if (!tiles.length) tiles = Array.from(element.querySelectorAll(':scope > div'));

  const images = tiles
    .map((tile) => tile.querySelector('img'))
    .filter(Boolean);

  if (!images.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // Column count from grid class (desktop-N-column), default 4
  const colMatch = (element.className || '').match(/desktop-(\d+)-column/);
  const cols = colMatch ? parseInt(colMatch[1], 10) : 4;

  const cells = [];
  for (let i = 0; i < images.length; i += cols) {
    const row = images.slice(i, i + cols);
    while (row.length < cols) row.push('');
    cells.push(row);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-gallery', cells });
  element.replaceWith(block);
}
