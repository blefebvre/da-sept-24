/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-feature. Base: columns.
 * Source: https://www.wknd-trendsetters.site/ (featured-story grid-layout)
 * Target model (blocks/columns-feature): one row, two cells:
 *   cell 1 = feature image, cell 2 = breadcrumb (links-only first paragraph),
 *   heading, byline paragraph, date/read-time paragraph.
 * Selectors validated against migration-work/block-context/columns-feature/source.html.
 */
export default function parse(element, { document }) {
  const columns = Array.from(element.querySelectorAll(':scope > div'));

  // Image column: first direct child that holds an image but no heading
  const imageCol = columns.find((c) => c.querySelector('img') && !c.querySelector('h1, h2, h3, h4'))
    || null;
  const textCol = columns.find((c) => c.querySelector('h1, h2, h3, h4')) || columns[columns.length - 1];

  const image = imageCol
    ? (imageCol.querySelector('img.cover-image') || imageCol.querySelector('img'))
    : null;

  const heading = textCol ? textCol.querySelector('h1, h2, h3, h4') : null;
  if (!heading && !image) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const textCell = [];

  // Breadcrumb: keep as a links-only first paragraph (decorated as breadcrumb by the block)
  const breadcrumbs = textCol ? textCol.querySelector('.breadcrumbs') : null;
  if (breadcrumbs) {
    const links = Array.from(breadcrumbs.querySelectorAll('a'));
    if (links.length) {
      const p = document.createElement('p');
      links.forEach((a, i) => {
        if (i > 0) p.append(document.createTextNode(' '));
        const link = document.createElement('a');
        link.href = a.getAttribute('href');
        link.textContent = a.textContent.trim();
        p.append(link);
      });
      textCell.push(p);
    }
  }

  if (heading) textCell.push(heading);

  // Byline / meta rows: each .flex-horizontal becomes one paragraph of its span texts
  const metaRows = textCol ? Array.from(textCol.querySelectorAll('.flex-horizontal')) : [];
  metaRows.forEach((row) => {
    const parts = Array.from(row.querySelectorAll('span'))
      .map((s) => s.textContent.trim())
      .filter(Boolean);
    const text = parts.length ? parts.join(' ') : row.textContent.trim();
    if (text) {
      const p = document.createElement('p');
      p.textContent = text;
      textCell.push(p);
    }
  });

  // Fallback: any plain paragraphs in the text column not already captured
  if (!metaRows.length && textCol) {
    textCol.querySelectorAll('p').forEach((p) => textCell.push(p));
  }

  const cells = [[image || '', textCell]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-feature', cells });
  element.replaceWith(block);
}
