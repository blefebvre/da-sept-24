import { createOptimizedPicture } from '../../scripts/aem.js';

const OPTION_CLASSES = [];

/**
 * Hero (banner): background image with an overlay and a heading,
 * paragraph and CTA layered on top.
 * Authored as: row 1 = background image, row 2 = heading/text/link.
 * Rows may be in either order, merged into one cell, or missing the image.
 * @param {Element} block
 */
export default function decorate(block) {
  // eslint-disable-next-line no-unused-vars
  const active = [...block.classList].filter((c) => OPTION_CLASSES.includes(c));

  const background = document.createElement('div');
  background.className = 'hero-banner-background';
  const content = document.createElement('div');
  content.className = 'hero-banner-content';

  const firstPicture = block.querySelector('picture');
  if (firstPicture) {
    const img = firstPicture.querySelector('img');
    const parent = firstPicture.parentElement;
    background.append(img
      ? createOptimizedPicture(img.src, img.alt, true, [{ media: '(min-width: 900px)', width: '2000' }, { width: '900' }])
      : firstPicture);
    firstPicture.remove();
    if (parent && !parent.textContent.trim() && !parent.children.length) parent.remove();
  }

  [...block.children].forEach((row) => {
    [...row.children].forEach((cell) => {
      if (cell.textContent.trim() || cell.children.length) content.append(...cell.childNodes);
    });
  });

  block.replaceChildren();
  if (background.children.length) {
    block.classList.add('hero-banner-has-image');
    block.append(background);
  }
  block.append(content);
}
