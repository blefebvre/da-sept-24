import { createOptimizedPicture } from '../../scripts/aem.js';

const OPTION_CLASSES = [];

/**
 * Cards (article): linked article teasers - image on top, then a tag + date
 * line and a linked heading. Each row is one card; col 1 = image, col 2 = body.
 * Rows missing an image or with extra cells still render as cards.
 * @param {Element} block
 */
export default function decorate(block) {
  // eslint-disable-next-line no-unused-vars
  const active = [...block.classList].filter((c) => OPTION_CLASSES.includes(c));

  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    if (!row.textContent.trim() && !row.querySelector('picture')) return;
    const li = document.createElement('li');
    li.className = 'cards-article-card';
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture') && !div.textContent.trim()) {
        div.className = 'cards-article-card-image';
      } else {
        div.className = 'cards-article-card-body';
        // the paragraph preceding the heading carries tag + date
        const heading = div.querySelector('h1, h2, h3, h4, h5, h6');
        const meta = heading ? heading.previousElementSibling : div.querySelector('p');
        if (meta && meta.tagName === 'P') {
          meta.classList.add('cards-article-meta');
          const tag = meta.querySelector('em, code, strong');
          if (tag) tag.classList.add('cards-article-tag');
        }
      }
    });
    // make the whole card clickable via the heading link (stretched link)
    const link = li.querySelector('h1 a, h2 a, h3 a, h4 a, h5 a, h6 a');
    if (link) li.classList.add('cards-article-linked');
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => img.closest('picture').replaceWith(
    createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]),
  ));
  block.replaceChildren(ul);
}
