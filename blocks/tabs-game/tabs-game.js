import { loadFragment } from '../fragment/fragment.js';

let blockCount = 0;

/**
 * Returns a same-origin path if the content is a lone reference to another document
 * (a single link, or a bare `/path` typed as plain text), otherwise null.
 * @param {Element[]} nodes The panel content nodes
 * @returns {{ path: string, link: HTMLAnchorElement|null }|null}
 */
function findReference(nodes) {
  const elements = nodes.filter((n) => n.nodeType === Node.ELEMENT_NODE);
  const text = nodes.map((n) => n.textContent).join('').trim();
  if (!text) return null;

  const links = elements.flatMap((el) => (el.tagName === 'A' ? [el] : [...el.querySelectorAll('a[href]')]));
  if (links.length === 1 && links[0].textContent.trim() === text) {
    const url = new URL(links[0].href, window.location.href);
    if (url.origin !== window.location.origin && !url.pathname.includes('/fragments/')) return null;
    return { path: url.pathname.replace(/\.(plain\.)?html$/, ''), link: links[0] };
  }
  if (!links.length && /^\/[^\s/][^\s]*$/.test(text)) return { path: text, link: null };
  return null;
}

/**
 * Fills a panel with its content. Links containing `/fragments/` are already queued by the
 * global auto-blocker (scripts.js buildAutoBlocks), which replaces the link's parent element
 * with the fragment content. For those, the link is kept inside a dedicated slot so the
 * fragment lands in this panel and is not fetched twice. Any other reference (plain-text
 * path, same-origin page link) is loaded here with loadFragment.
 * @param {HTMLElement} panel The tab panel
 * @param {Node[]} nodes The authored panel content
 * @returns {Function|null} A loader to run when the panel is first shown
 */
function fillPanel(panel, nodes) {
  const ref = findReference(nodes);
  if (!ref) {
    panel.append(...nodes);
    return null;
  }

  const slot = document.createElement('div');
  slot.className = 'tabs-game-fragment';
  panel.append(slot);

  if (ref.link && ref.link.href.includes('/fragments/')) {
    slot.append(ref.link);
    return null;
  }

  slot.append(...nodes);
  return async () => {
    try {
      const fragment = await loadFragment(ref.path);
      if (fragment) slot.replaceChildren(...fragment.childNodes);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('tabs-game: fragment loading failed', ref.path, error);
    }
  };
}

export default function decorate(block) {
  blockCount += 1;
  const idPrefix = `tabs-game-${blockCount}`;

  const tablist = document.createElement('div');
  tablist.className = 'tabs-game-list';
  tablist.setAttribute('role', 'tablist');

  const panels = document.createElement('div');
  panels.className = 'tabs-game-panels';

  const tabs = [];
  const loaders = [];

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    if (!cells.length && !row.textContent.trim()) return;

    const [labelCell, ...rest] = cells;
    // the panel is every cell after the label; if the auto-blocker already inlined a
    // fragment in place of a cell, its sections are row children too
    const contentNodes = rest.flatMap((cell) => (
      cell.matches('.section') ? [cell] : [...cell.childNodes]
    ));
    if (!labelCell.textContent.trim() && !contentNodes.length) return;

    const index = tabs.length;
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'tabs-game-tab';
    tab.id = `${idPrefix}-tab-${index}`;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', `${idPrefix}-panel-${index}`);
    const label = labelCell.textContent.trim();
    if (label) {
      tab.append(...labelCell.childNodes);
    } else {
      tab.textContent = `Tab ${index + 1}`;
    }
    tab.querySelectorAll('p').forEach((p) => p.replaceWith(...p.childNodes));
    // links inside a tab label would nest interactive content inside the button
    tab.querySelectorAll('a').forEach((a) => a.replaceWith(...a.childNodes));

    const panel = document.createElement('div');
    panel.className = 'tabs-game-panel';
    panel.id = `${idPrefix}-panel-${index}`;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tab.id);
    panel.tabIndex = 0;

    loaders.push(fillPanel(panel, contentNodes));
    tabs.push(tab);
    tablist.append(tab);
    panels.append(panel);
  });

  block.replaceChildren(tablist, panels);
  if (!tabs.length) return;

  const panelEls = [...panels.children];
  const select = (index, focus = false) => {
    tabs.forEach((tab, i) => {
      const selected = i === index;
      tab.setAttribute('aria-selected', selected);
      tab.tabIndex = selected ? 0 : -1;
      panelEls[i].hidden = !selected;
    });
    if (loaders[index]) {
      loaders[index]();
      loaders[index] = null;
    }
    if (focus) tabs[index].focus();
  };

  tablist.addEventListener('click', (e) => {
    const tab = e.target.closest('.tabs-game-tab');
    if (tab) select(tabs.indexOf(tab));
  });

  tablist.addEventListener('keydown', (e) => {
    const current = tabs.indexOf(document.activeElement);
    if (current < 0) return;
    let next;
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        next = (current + 1) % tabs.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        next = (current - 1 + tabs.length) % tabs.length;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = tabs.length - 1;
        break;
      default:
        return;
    }
    e.preventDefault();
    select(next, true);
  });

  select(0);
}
