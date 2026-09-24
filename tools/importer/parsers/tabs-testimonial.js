/* eslint-disable */
/* global WebImporter */
/**
 * Parser for tabs-testimonial. Base: tabs.
 * Source: https://www.wknd-trendsetters.site/ (testimonials .tabs-wrapper)
 * Target model (blocks/tabs-testimonial): one row per tab, 2 columns:
 *   col 1 = tab label (avatar image, name, role)
 *   col 2 = panel (large image, name, role, quote)
 * Iterates the block-level .tab-pane wrappers and pairs each with its
 * .tab-menu-link button (by id suffix, falling back to index) - never keyed on buttons alone.
 * Panel images tab-campus.avif / tab-staff.avif are absolute source URLs; they are kept as-is.
 * Selectors validated against migration-work/block-context/tabs-testimonial/source.html.
 */

function textParagraph(document, text, bold) {
  const p = document.createElement('p');
  if (bold) {
    const strong = document.createElement('strong');
    strong.textContent = text;
    p.append(strong);
  } else {
    p.textContent = text;
  }
  return p;
}

// Extract [name, role] from a container of stacked divs: <div><strong>Name</strong></div><div>Role</div>
function nameAndRole(container) {
  if (!container) return { name: '', role: '' };
  const strong = container.querySelector('strong');
  const name = strong ? strong.textContent.trim() : '';
  let role = '';
  const divs = Array.from(container.querySelectorAll('div'))
    .filter((d) => !d.querySelector('div, img, p') && !d.querySelector('strong'));
  const roleDiv = divs.find((d) => d.textContent.trim() && d.textContent.trim() !== name);
  if (roleDiv) role = roleDiv.textContent.trim();
  return { name, role };
}

export default function parse(element, { document }) {
  let panes = Array.from(element.querySelectorAll('.tabs-content > .tab-pane'));
  if (!panes.length) panes = Array.from(element.querySelectorAll('.tab-pane, [role="tabpanel"]'));
  const buttons = Array.from(element.querySelectorAll('.tab-menu .tab-menu-link, .tab-menu-link'))
    .filter((b, i, arr) => arr.indexOf(b) === i);

  if (!panes.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  panes.forEach((pane, i) => {
    // Pair pane with tab button: tabpanel-N <-> tab-N, else by index
    const idx = (pane.id || '').replace(/^tabpanel-/, '');
    const button = buttons.find((b) => b.id === `tab-${idx}`) || buttons[i] || null;

    // Panel content
    const panelImg = pane.querySelector('img');
    const quote = pane.querySelector('p');
    const textCol = quote ? quote.parentElement : pane;
    const { name, role } = nameAndRole(textCol.querySelector(':scope > div') || textCol);

    const panelCell = [];
    if (panelImg) panelCell.push(panelImg);
    if (name) panelCell.push(textParagraph(document, name, true));
    if (role) panelCell.push(textParagraph(document, role, false));
    if (quote) panelCell.push(quote);

    // Label content
    const labelCell = [];
    if (button) {
      const avatar = button.querySelector('.avatar img') || button.querySelector('img');
      if (avatar) {
        if (!avatar.getAttribute('alt') && name) avatar.setAttribute('alt', name);
        labelCell.push(avatar);
      }
      const info = nameAndRole(button);
      const labelName = info.name || name;
      const labelRole = info.role || role;
      if (labelName) labelCell.push(textParagraph(document, labelName, true));
      if (labelRole) labelCell.push(textParagraph(document, labelRole, false));
    } else {
      if (name) labelCell.push(textParagraph(document, name, true));
      if (role) labelCell.push(textParagraph(document, role, false));
    }

    cells.push([labelCell.length ? labelCell : '', panelCell.length ? panelCell : '']);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'tabs-testimonial', cells });
  element.replaceWith(block);
}
