import { loadFragment } from '../fragment/fragment.js';
import { createOptimizedPicture } from '../../scripts/aem.js';

const FRAGMENT_PATH = /^\/[^\s/]\S*$/;

/**
 * Prepares fragment references inside an item body.
 * - Links containing `/fragments/` are already queued by the global auto-blocker
 *   (scripts.js buildAutoBlocks), which replaces the link's parent element with the
 *   fragment. A bare link sitting directly in the body is wrapped in its own slot so only
 *   the slot, not the whole body, gets replaced.
 * - A paragraph that holds nothing but a plain-text path (e.g. `/fragments/x`) is not seen
 *   by the auto-blocker, so it is loaded here with loadFragment the first time the item opens.
 * @param {HTMLElement} body The item body
 * @returns {Function[]} Loaders to run on first open
 */
function prepareFragments(body) {
  [...body.querySelectorAll(':scope > a[href*="/fragments/"]')].forEach((link) => {
    const slot = document.createElement('div');
    slot.className = 'accordion-game-fragment';
    link.replaceWith(slot);
    slot.append(link);
  });

  return [...body.querySelectorAll(':scope > p')]
    .filter((p) => !p.querySelector('a, picture') && FRAGMENT_PATH.test(p.textContent.trim())
      && p.textContent.includes('/fragments/'))
    .map((p) => async () => {
      const path = p.textContent.trim();
      try {
        const fragment = await loadFragment(path);
        if (!fragment) return;
        const slot = document.createElement('div');
        slot.className = 'accordion-game-fragment';
        slot.append(...fragment.childNodes);
        p.replaceWith(slot);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('accordion-game: fragment loading failed', path, error);
      }
    });
}

function buildItem(row) {
  const [titleCell, ...rest] = [...row.children];

  const details = document.createElement('details');
  details.className = 'accordion-game-item';

  const summary = document.createElement('summary');
  summary.className = 'accordion-game-item-label';
  const title = document.createElement('span');
  title.className = 'accordion-game-item-title';
  if (titleCell) {
    title.append(...titleCell.childNodes);
    // keep inline content only: unwrap paragraphs, drop interactive links inside summary
    title.querySelectorAll('p').forEach((p) => p.replaceWith(...p.childNodes, ' '));
    title.querySelectorAll('a').forEach((a) => a.replaceWith(...a.childNodes));
  }
  summary.append(title);

  const body = document.createElement('div');
  body.className = 'accordion-game-item-body';
  // if the auto-blocker already inlined a fragment in place of a cell, its sections are
  // row children too
  rest.forEach((cell) => {
    if (cell.matches('.section')) body.append(cell);
    else body.append(...cell.childNodes);
  });

  details.append(summary, body);

  const loaders = prepareFragments(body);
  if (loaders.length) {
    details.addEventListener('toggle', () => {
      if (!details.open) return;
      loaders.splice(0).forEach((load) => load());
    });
  }
  return details;
}

export default function decorate(block) {
  const items = [...block.children]
    .filter((row) => row.textContent.trim() || row.querySelector('picture'))
    .map(buildItem);

  block.replaceChildren(...items);

  block.querySelectorAll('.accordion-game-item-title picture > img').forEach((img) => {
    img.closest('picture').replaceWith(
      createOptimizedPicture(img.src, img.alt, false, [{ width: '200' }]),
    );
  });
}
