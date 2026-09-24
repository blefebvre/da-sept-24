/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-article. Base: cards.
 * Source: https://www.wknd-trendsetters.site/ (latest-articles grid-layout.desktop-4-column)
 * Target model (blocks/cards-article): one row per card, 2 columns:
 *   col 1 = image, col 2 = meta paragraph (<em>tag</em> date) + heading linked to the article.
 * Iteration is keyed on the inner block wrapper .article-card-body (NOT the a.article-card
 * anchors, which html2md preprocessing may merge); the href is read off the wrapper anchor.
 * Selectors validated against migration-work/block-context/cards-article/source.html.
 */
export default function parse(element, { document }) {
  let items = Array.from(element.querySelectorAll('.article-card-body')).map((body) => ({
    body,
    image: body.parentElement ? body.parentElement.querySelector('.article-card-image img, img') : null,
    href: body.closest('a') ? body.closest('a').getAttribute('href') : null,
  }));
  if (!items.length) {
    // Fallback: wrappers intact, iterate the card anchors
    items = Array.from(element.querySelectorAll(':scope > a.article-card, :scope > a.card-link')).map((card) => ({
      body: card,
      image: card.querySelector('img'),
      href: card.getAttribute('href'),
    }));
  }

  if (!items.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  items.forEach(({ body, image, href }) => {
    const textCell = [];

    // Meta line: tag + date
    const meta = body.querySelector('.article-card-meta');
    if (meta) {
      const p = document.createElement('p');
      const tag = meta.querySelector('.tag');
      if (tag && tag.textContent.trim()) {
        const em = document.createElement('em');
        em.textContent = tag.textContent.trim();
        p.append(em);
      }
      Array.from(meta.querySelectorAll('span'))
        .filter((s) => s !== tag && s.textContent.trim())
        .forEach((s) => p.append(document.createTextNode(` ${s.textContent.trim()}`)));
      if (p.textContent.trim()) textCell.push(p);
    }

    // Heading, linked to the article
    const heading = body.querySelector('h1, h2, h3, h4, h5, h6');
    if (heading) {
      if (href && !heading.querySelector('a')) {
        const a = document.createElement('a');
        a.href = href;
        a.textContent = heading.textContent.trim();
        heading.textContent = '';
        heading.append(a);
      }
      textCell.push(heading);
    } else if (href) {
      const p = document.createElement('p');
      const a = document.createElement('a');
      a.href = href;
      a.textContent = href;
      p.append(a);
      textCell.push(p);
    }

    cells.push([image || '', textCell.length ? textCell : '']);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-article', cells });
  element.replaceWith(block);
}
