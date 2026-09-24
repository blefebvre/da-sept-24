import { createOptimizedPicture } from '../../scripts/aem.js';

const OPTION_CLASSES = [];

/**
 * Columns (feature): a large image beside a text column
 * (breadcrumb links, heading, byline, date/read-time).
 * Works with any number of columns; image-only cells become media columns.
 * @param {Element} block
 */
export default function decorate(block) {
  // eslint-disable-next-line no-unused-vars
  const active = [...block.classList].filter((c) => OPTION_CLASSES.includes(c));

  [...block.children].forEach((row) => {
    row.classList.add('columns-feature-row');
    const cols = [...row.children];
    row.classList.add(`columns-feature-${cols.length}-cols`);
    cols.forEach((col) => {
      const pic = col.querySelector('picture');
      const imageOnly = pic && !col.textContent.trim();
      if (imageOnly) {
        col.className = 'columns-feature-image';
        const img = pic.querySelector('img');
        if (img) {
          pic.replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '900' }]));
        }
      } else {
        col.className = 'columns-feature-content';
        // first paragraph made only of links acts as a breadcrumb trail
        const first = col.firstElementChild;
        const isLinkTrail = first && first.tagName === 'P'
          && first.querySelectorAll('a').length > 1
          && [...first.querySelectorAll('a')].every((a) => !a.closest('strong, em'));
        if (isLinkTrail) first.classList.add('columns-feature-breadcrumb');
      }
    });
  });
}
