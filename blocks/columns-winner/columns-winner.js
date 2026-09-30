import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * A cell is an image cell when its only meaningful content is a picture (optionally linked).
 * @param {Element} cell
 */
function isImageCell(cell) {
  return !!cell.querySelector('picture') && !cell.textContent.trim();
}

export default function decorate(block) {
  const rows = [...block.children].filter((row) => row.children.length || row.textContent.trim());

  rows.forEach((row) => {
    row.classList.add('columns-winner-row');
    const cells = [...row.children];
    cells.forEach((cell) => {
      cell.classList.add(isImageCell(cell) ? 'columns-winner-image' : 'columns-winner-text');
    });

    // merge multiple text cells so the row keeps a single text column next to the image
    const texts = cells.filter((cell) => cell.classList.contains('columns-winner-text'));
    texts.slice(1).forEach((extra) => {
      texts[0].append(...extra.childNodes);
      extra.remove();
    });

    if (!row.querySelector('.columns-winner-image')) row.classList.add('columns-winner-no-image');
  });

  // a paragraph holding nothing but a link is the call to action (chevron link)
  block.querySelectorAll('.columns-winner-text p').forEach((p) => {
    const link = p.querySelector(':scope > a, :scope > strong > a, :scope > em > a');
    if (link && p.textContent.trim() === link.textContent.trim()) p.classList.add('columns-winner-cta');
  });

  block.querySelectorAll('.columns-winner-image picture > img').forEach((img) => {
    img.closest('picture').replaceWith(
      createOptimizedPicture(img.src, img.alt, false, [{ media: '(min-width: 600px)', width: '600' }, { width: '450' }]),
    );
  });
}
