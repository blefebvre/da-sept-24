import { readBlockConfig, toClassName, toCamelCase } from '../../scripts/aem.js';

/**
 * Applies section metadata (style and any other key/value pairs) to the parent section,
 * then removes the metadata table from the rendered page.
 * @param {Element} block The section-metadata block element
 */
export default function decorate(block) {
  const section = block.closest('.section');
  if (section) {
    const config = readBlockConfig(block);
    Object.entries(config).forEach(([key, value]) => {
      if (key === 'style') {
        String(value).split(',')
          .map((style) => toClassName(style.trim()))
          .filter(Boolean)
          .forEach((style) => section.classList.add(style));
      } else {
        section.dataset[toCamelCase(key)] = value;
      }
    });
  }
  const wrapper = block.parentElement;
  if (wrapper && wrapper.classList.contains('section-metadata-wrapper')) {
    wrapper.remove();
  } else {
    block.remove();
  }
}
