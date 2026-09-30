/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-winner. Base: columns.
 * Source: https://www.alc.ca/content/alc/en/our-games/lotto/lotto-6-49.html
 * Generated: 2026-09-25
 *
 * Source structure (validated against block-context/columns-winner/source.html and live DOM):
 *   div.winners-promo > div.winner-help > div.top-half > div.row
 *     div.col-sm-8 > h1                         -> heading (demoted to h2: one h1 per page)
 *     div.col-sm-8 > p                          -> text
 *     div.hero > img                            -> image (right column)
 *     div.actions ... a.chevron-link            -> CTA ("CLAIM YOUR TICKET")
 *
 * Output (1 row, 2 cells): [ h2 + paragraph(s) + CTA link | image ]
 */
export default function parse(element, { document }) {
  const heading = element.querySelector('h1, h2, h3');
  const image = element.querySelector('.hero img, img');
  const heroCol = image && (image.closest('.hero') || image.parentElement);

  const textCell = [];
  if (heading && heading.textContent.trim()) {
    const h2 = document.createElement('h2');
    h2.textContent = heading.textContent.replace(/\s+/g, ' ').trim();
    textCell.push(h2);
  }

  // Body paragraphs: everything outside the image column and actions.
  [...element.querySelectorAll('p')].forEach((p) => {
    if (heroCol && heroCol.contains(p)) return;
    if (p.closest('.actions')) return;
    if (!p.textContent.trim()) return;
    textCell.push(p);
  });

  const ctas = [...element.querySelectorAll('.actions a[href]')];
  if (!ctas.length) {
    const fallback = element.querySelector('a.chevron-link[href], a.button[href]');
    if (fallback) ctas.push(fallback);
  }
  ctas.forEach((cta) => {
    const text = cta.textContent.replace(/\s+/g, ' ').trim();
    if (!text) return;
    const a = document.createElement('a');
    a.href = cta.getAttribute('href');
    a.textContent = text;
    const p = document.createElement('p');
    p.append(a);
    textCell.push(p);
  });

  if (!textCell.length && !image) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [[textCell.length ? textCell : '', image || '']];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-winner', cells });
  element.replaceWith(block);
}
