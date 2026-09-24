/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-banner. Base: hero.
 * Source: https://www.wknd-trendsetters.site/ (closing-cta section.inverse-section)
 * Target model (blocks/hero-banner): row 1 = background image, row 2 = heading, text, CTA.
 * Selectors validated against migration-work/block-context/hero-banner/source.html.
 */
export default function parse(element, { document }) {
  const bgImage = element.querySelector('img.cover-image') || element.querySelector('img');

  const body = element.querySelector('.card-body') || element;
  const heading = body.querySelector('h1, h2, h3');
  const description = body.querySelector('p.subheading') || body.querySelector('p');
  let ctas = Array.from(body.querySelectorAll('.button-group a'));
  if (!ctas.length) ctas = Array.from(body.querySelectorAll('a.button'));

  if (!heading && !description && !bgImage) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  if (bgImage) cells.push([bgImage]);

  const contentCell = [];
  if (heading) contentCell.push(heading);
  if (description) contentCell.push(description);
  ctas.forEach((a) => {
    const p = document.createElement('p');
    const strong = document.createElement('strong');
    strong.append(a);
    p.append(strong);
    contentCell.push(p);
  });
  cells.push([contentCell]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-banner', cells });
  element.replaceWith(block);
}
