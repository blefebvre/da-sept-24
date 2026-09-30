/* eslint-disable */
/* global WebImporter */
/**
 * Parser for table-prize. Base: table.
 * Source: https://www.alc.ca/content/alc/en/our-games/lotto/lotto-6-49.html
 * Generated: 2026-09-25
 *
 * Runs inside the fragment documents /fragments/lotto/{page}/odds-of-winning and
 * /combination-play (see accordion-game.js clone contract); in those documents run it on
 * every `table`. The template selector `.how-to-play-content .panel-group table` is used for
 * validation against the live page.
 *
 * Source structure (validated against block-context/table-prize/source.html and live DOM):
 *   table > tbody > tr > td > p (+ b / i)   — no <th>; row 1 is the (bold) header row.
 *   Combination Play header: last cell has colspan="7" ("Number of wins per category").
 *   Cells padded with &nbsp;-only paragraphs.
 *
 * Output (library convention: first row = header row, one block per table):
 *   one block row per source <tr>, one cell per <td>/<th>.
 *   - &nbsp;-only cells -> '' ; fully empty rows are skipped.
 *   - A colspan on the LAST cell is kept as a shorter row (table-prize spans the last cell
 *     over the missing columns); a colspan elsewhere is expanded with empty cells.
 *   - Following-sibling footnote paragraphs (odds fragment) get their &nbsp; padding trimmed.
 */
function isBlank(node) {
  if (node.querySelector && node.querySelector('img, a[href]')) return false;
  return !node.textContent.replace(/[\s ​]+/g, '');
}

function trimNbsp(el) {
  const walker = el.ownerDocument.createTreeWalker(el, 4 /* NodeFilter.SHOW_TEXT */);
  const texts = [];
  while (walker.nextNode()) texts.push(walker.currentNode);
  texts.forEach((t) => {
    t.textContent = t.textContent.replace(/ /g, ' ').replace(/ {2,}/g, ' ');
  });
  const last = texts[texts.length - 1];
  if (last) last.textContent = last.textContent.replace(/\s+$/, '');
  const first = texts[0];
  if (first) first.textContent = first.textContent.replace(/^\s+/, '');
}

function cellContent(cell) {
  if (isBlank(cell)) return '';
  const blocks = [...cell.children].filter((c) => /^(P|UL|OL|DIV)$/.test(c.tagName));
  if (blocks.length) {
    const kept = blocks.filter((b) => !isBlank(b));
    kept.forEach(trimNbsp);
    return kept.length === 1 && kept[0].tagName === 'P' ? [...kept[0].childNodes] : kept;
  }
  trimNbsp(cell);
  return [...cell.childNodes];
}

export default function parse(element, { document }) {
  const table = element.matches('table') ? element : element.querySelector('table');
  if (!table) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const rows = [...table.querySelectorAll(':scope > thead > tr, :scope > tbody > tr, :scope > tfoot > tr, :scope > tr')];
  const cells = [];
  rows.forEach((tr) => {
    const tds = [...tr.children].filter((c) => c.tagName === 'TD' || c.tagName === 'TH');
    if (!tds.length || tds.every(isBlank)) return;
    const row = [];
    tds.forEach((td, i) => {
      row.push(cellContent(td));
      const span = parseInt(td.getAttribute('colspan') || '1', 10);
      if (span > 1 && i < tds.length - 1) {
        for (let k = 1; k < span; k += 1) row.push('');
      }
    });
    cells.push(row);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // Footnotes directly after the table (odds-of-winning): trim &nbsp; padding.
  for (let n = element.nextElementSibling; n && n.tagName === 'P'; n = n.nextElementSibling) {
    if (isBlank(n)) continue;
    trimNbsp(n);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'table-prize', cells });
  element.replaceWith(block);
}
