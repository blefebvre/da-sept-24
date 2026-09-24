import { createOptimizedPicture, toClassName } from '../../scripts/aem.js';

const OPTION_CLASSES = [];

let instance = 0;

function optimizeImages(el, width) {
  el.querySelectorAll('picture > img').forEach((img) => {
    img.closest('picture').replaceWith(
      createOptimizedPicture(img.src, img.alt, false, [{ width }]),
    );
  });
}

/**
 * Tabs (testimonial): switchable testimonial panels selected by
 * avatar/name/role buttons shown beneath the active panel.
 * Each row: col 1 = tab label (avatar, name, role), col 2 = panel
 * (large image, name, role, quote). Single-cell rows reuse the cell as panel
 * and derive the label from its first text.
 * @param {Element} block
 */
export default async function decorate(block) {
  // eslint-disable-next-line no-unused-vars
  const active = [...block.classList].filter((c) => OPTION_CLASSES.includes(c));
  instance += 1;

  const panels = document.createElement('div');
  panels.className = 'tabs-testimonial-panels';
  const tablist = document.createElement('div');
  tablist.className = 'tabs-testimonial-list';
  tablist.setAttribute('role', 'tablist');

  const rows = [...block.children].filter((row) => row.textContent.trim() || row.querySelector('picture'));
  rows.forEach((row, i) => {
    const cells = [...row.children];
    const labelCell = cells.length > 1 ? cells[0] : null;
    const panelCell = cells.length > 1 ? cells[cells.length - 1] : cells[0];
    if (!panelCell) return;

    const labelText = (labelCell || panelCell).textContent.trim();
    const id = `${toClassName(labelText).slice(0, 40) || 'item'}-${instance}-${i}`;

    // panel
    const panel = document.createElement('div');
    panel.className = 'tabs-testimonial-panel';
    panel.id = `tabpanel-${id}`;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', `tab-${id}`);
    panel.setAttribute('aria-hidden', i !== 0);

    const media = document.createElement('div');
    media.className = 'tabs-testimonial-media';
    const body = document.createElement('div');
    body.className = 'tabs-testimonial-body';
    [...panelCell.children].forEach((child) => {
      const isPic = child.matches('picture') || child.querySelector('picture');
      if (isPic && !child.textContent.trim() && !media.children.length) {
        media.append(child);
      } else {
        body.append(child);
      }
    });
    if (!panelCell.children.length && panelCell.textContent.trim()) {
      const p = document.createElement('p');
      p.append(...panelCell.childNodes);
      body.append(p);
    }
    optimizeImages(media, '750');
    if (media.children.length) panel.append(media);
    panel.append(body);
    panels.append(panel);

    // tab button
    const button = document.createElement('button');
    button.className = 'tabs-testimonial-tab';
    button.id = `tab-${id}`;
    button.type = 'button';
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-controls', panel.id);
    button.setAttribute('aria-selected', i === 0);
    if (labelCell) {
      optimizeImages(labelCell, '120');
      const avatar = labelCell.querySelector('picture');
      if (avatar) {
        const avatarWrap = document.createElement('span');
        avatarWrap.className = 'tabs-testimonial-avatar';
        const parent = avatar.parentElement;
        avatarWrap.append(avatar);
        if (parent !== labelCell && !parent.textContent.trim() && !parent.children.length) {
          parent.remove();
        }
        button.append(avatarWrap);
      }
      const text = document.createElement('span');
      text.className = 'tabs-testimonial-label';
      text.append(...labelCell.childNodes);
      button.append(text);
    } else {
      [button.textContent] = labelText.split('\n');
    }
    button.addEventListener('click', () => {
      panels.querySelectorAll('[role=tabpanel]').forEach((p) => p.setAttribute('aria-hidden', true));
      tablist.querySelectorAll('[role=tab]').forEach((b) => b.setAttribute('aria-selected', false));
      panel.setAttribute('aria-hidden', false);
      button.setAttribute('aria-selected', true);
    });
    tablist.append(button);
  });

  block.replaceChildren(panels, tablist);
}
