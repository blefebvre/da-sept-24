/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-collage. Base: hero.
 * Source: https://www.wknd-trendsetters.site/ (header.section.secondary-section)
 * Target model (blocks/hero-collage): row 1 = collage images (single cell),
 * row 2 = heading, subheading, CTA links (single cell).
 * Selectors validated against migration-work/block-context/hero-collage/source.html.
 */
export default function parse(element, { document }) {
  // Images: img.cover-image inside the collage grid (fallback: any img in block)
  let images = Array.from(element.querySelectorAll('img.cover-image'));
  if (!images.length) images = Array.from(element.querySelectorAll('img'));

  const heading = element.querySelector('h1, h2, .h1-heading');
  const subheading = element.querySelector('p.subheading') || element.querySelector('p');
  let ctas = Array.from(element.querySelectorAll('.button-group a'));
  if (!ctas.length) ctas = Array.from(element.querySelectorAll('a.button'));

  if (!heading && !subheading && !images.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  if (images.length) cells.push([images]);

  const contentCell = [];
  if (heading) contentCell.push(heading);
  if (subheading) contentCell.push(subheading);
  if (ctas.length) {
    // Keep CTAs as separate paragraphs, primary first
    ctas.forEach((a) => {
      const p = document.createElement('p');
      if (a.classList.contains('secondary-button')) {
        const em = document.createElement('em');
        em.append(a);
        p.append(em);
      } else {
        const strong = document.createElement('strong');
        strong.append(a);
        p.append(strong);
      }
      contentCell.push(p);
    });
  }
  cells.push([contentCell]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-collage', cells });
  element.replaceWith(block);
}
