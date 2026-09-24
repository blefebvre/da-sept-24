import { readBlockConfig, toCamelCase, toClassName } from '../../scripts/aem.js';

/**
 * Applies section metadata to the parent section and removes the block.
 * `style` values become section classes; other keys become data attributes.
 * @param {Element} block The section-metadata block element
 */
export default function decorate(block) {
  const section = block.closest('.section');
  if (section) {
    const config = readBlockConfig(block);
    Object.entries(config).forEach(([key, value]) => {
      if (key === 'style') {
        const styles = [value].flat().join(',').split(',')
          .map((style) => toClassName(style.trim()))
          .filter(Boolean);
        section.classList.add(...styles);
      } else {
        section.dataset[toCamelCase(key)] = [value].flat().join(',');
      }
    });
  }

  const wrapper = block.parentElement;
  block.remove();
  if (wrapper && wrapper.classList.contains('section-metadata-wrapper') && !wrapper.children.length) {
    wrapper.remove();
  }
}
