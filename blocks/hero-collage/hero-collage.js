import { createOptimizedPicture } from '../../scripts/aem.js';

const OPTION_CLASSES = [];

/**
 * Hero (collage): headline, subheading and CTAs beside a multi-image collage.
 * Authored as: row 1 = images (one or more, any cells), row 2 = heading/text/links.
 * Tolerates rows in either order and missing/extra cells.
 * @param {Element} block
 */
export default function decorate(block) {
  // eslint-disable-next-line no-unused-vars
  const active = [...block.classList].filter((c) => OPTION_CLASSES.includes(c));

  const content = document.createElement('div');
  content.className = 'hero-collage-content';
  const media = document.createElement('div');
  media.className = 'hero-collage-media';

  [...block.children].forEach((row) => {
    [...row.children].forEach((cell) => {
      const pictures = [...cell.querySelectorAll('picture')];
      const hasText = [...cell.children].some((el) => !el.querySelector('picture') && el.textContent.trim());
      pictures.forEach((pic) => {
        const img = pic.querySelector('img');
        const item = document.createElement('div');
        item.className = 'hero-collage-image';
        item.append(img
          ? createOptimizedPicture(img.src, img.alt, true, [{ width: '750' }])
          : pic);
        media.append(item);
        // drop the now-empty wrapper paragraph
        const parent = pic.parentElement;
        pic.remove();
        const emptyParent = parent && parent !== cell
          && !parent.textContent.trim() && !parent.children.length;
        if (emptyParent) parent.remove();
      });
      if (hasText || (!pictures.length && cell.textContent.trim())) {
        content.append(...cell.childNodes);
      }
    });
  });

  media.classList.add(`hero-collage-media-${Math.min(media.children.length, 4)}`);
  block.replaceChildren(content);
  if (media.children.length) block.append(media);
}
