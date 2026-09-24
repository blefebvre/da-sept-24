import { createOptimizedPicture } from '../../scripts/aem.js';

const OPTION_CLASSES = [];

/**
 * Columns (gallery): image-only grid. Every authored cell (any rows x columns)
 * becomes one gallery tile; the authored column count drives the desktop grid.
 * Empty cells are dropped; cells with text are kept as-is inside a tile.
 * @param {Element} block
 */
export default function decorate(block) {
  // eslint-disable-next-line no-unused-vars
  const active = [...block.classList].filter((c) => OPTION_CLASSES.includes(c));

  const colCount = Math.max(1, ...[...block.children].map((row) => row.children.length));
  const list = document.createElement('ul');
  list.className = 'columns-gallery-grid';

  [...block.children].forEach((row) => {
    [...row.children].forEach((cell) => {
      if (!cell.textContent.trim() && !cell.querySelector('picture, img')) return;
      const item = document.createElement('li');
      item.className = 'columns-gallery-item';
      const img = cell.querySelector('img');
      if (img && !cell.textContent.trim()) {
        item.append(createOptimizedPicture(img.src, img.alt, false, [{ width: '600' }]));
      } else {
        item.append(...cell.childNodes);
      }
      list.append(item);
    });
  });

  block.style.setProperty('--columns-gallery-cols', Math.min(colCount, 6));
  block.replaceChildren(list);
}
