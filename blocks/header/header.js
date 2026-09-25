// media query match that indicates desktop width
const isDesktop = window.matchMedia('(width >= 900px)');

// top-level nav fragment sections, in authoring order
const SECTION_NAMES = ['brand', 'search', 'tools', 'sections', 'mobile-extras'];

/**
 * Fetches the nav fragment. Metadata-independent dual fetch:
 * /content/nav.plain.html (local aem up) first, then /nav.plain.html (DA/EDS).
 * @returns {Promise<HTMLElement|null>} container holding the fragment sections
 */
async function fetchNavFragment() {
  // metadata-independent: /content first (localhost), then root (DA/EDS prod)
  let resp = await fetch('/content/nav.plain.html');
  if (!resp.ok) resp = await fetch('/nav.plain.html');
  if (!resp.ok) return null;
  const container = document.createElement('div');
  container.innerHTML = await resp.text();
  // resolve relative media paths against the fragment location
  const base = new URL(resp.url, window.location.href);
  container.querySelectorAll('img[src]').forEach((img) => {
    img.src = new URL(img.getAttribute('src'), base).href;
  });
  container.querySelectorAll('source[srcset]').forEach((source) => {
    source.srcset = new URL(source.getAttribute('srcset'), base).href;
  });
  return container;
}

function slugify(text) {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function unwrapParagraphs(el) {
  el.querySelectorAll(':scope > p').forEach((p) => p.replaceWith(...p.childNodes));
}

/**
 * Builds a search form from the first link of the search section
 * (link href = form action, link text = placeholder).
 */
function buildSearchForm(section, idSuffix) {
  const link = section && section.querySelector('a');
  if (!link) return null;
  const form = document.createElement('form');
  form.className = 'nav-search-form';
  form.setAttribute('role', 'search');
  form.action = link.getAttribute('href');
  form.method = 'get';
  const input = document.createElement('input');
  input.type = 'text';
  input.name = 'q';
  input.maxLength = 2048;
  input.id = `nav-search-${idSuffix}`;
  input.placeholder = link.textContent.trim();
  input.setAttribute('aria-label', link.textContent.trim());
  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.className = 'nav-search-submit';
  submit.setAttribute('aria-label', 'Search');
  form.append(input, submit);
  return form;
}

function closeAllPanels(navSections, except) {
  navSections.querySelectorAll('.nav-drop').forEach((drop) => {
    if (drop === except) return;
    drop.classList.remove('is-open');
    const trigger = drop.querySelector('.nav-drop-trigger');
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
  });
}

function togglePanel(drop, navSections, force) {
  const trigger = drop.querySelector('.nav-drop-trigger');
  const open = force !== undefined ? force : !drop.classList.contains('is-open');
  // single-expand on both desktop (dropdown) and mobile (accordion)
  closeAllPanels(navSections, drop);
  drop.classList.toggle('is-open', open);
  trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
}

/**
 * Turns a nested list of cards into a megamenu panel.
 * - li with an image  -> card (image link + optional CTA; <strong> CTA = button)
 * - li without CTA    -> promo card (full-bleed image)
 * - li with nested ul -> side column (heading + optional background image + links)
 */
function buildPanel(list) {
  const panel = document.createElement('div');
  panel.className = 'nav-megamenu';
  const grid = document.createElement('ul');
  grid.className = 'nav-megamenu-cards';
  const aside = document.createElement('div');
  aside.className = 'nav-megamenu-more';

  [...list.children].forEach((item) => {
    const nested = item.querySelector(':scope > ul');
    if (nested) {
      const heading = document.createElement('p');
      heading.className = 'nav-megamenu-more-title';
      const bg = item.querySelector('img');
      item.querySelectorAll(':scope > p').forEach((p) => {
        if (!p.querySelector('img') && p.textContent.trim()) heading.textContent = p.textContent.trim();
      });
      // decorative image is rendered as a CSS background (as on the source)
      if (bg) {
        aside.classList.add('has-bg');
        aside.style.setProperty('--nav-more-bg', `url("${bg.src}")`);
      }
      nested.className = 'nav-megamenu-more-links';
      aside.prepend(heading);
      aside.append(nested);
      return;
    }
    unwrapParagraphs(item);
    const img = item.querySelector('img');
    const links = [...item.querySelectorAll('a')];
    const imageLink = links.find((a) => a.querySelector('img'));
    const ctaLink = links.find((a) => !a.querySelector('img'));
    item.className = 'nav-card';
    if (img) img.loading = 'lazy';
    if (imageLink) imageLink.className = 'nav-card-image';
    if (ctaLink) {
      const strong = ctaLink.closest('strong');
      ctaLink.className = strong ? 'nav-card-button' : 'nav-card-link';
      if (strong) strong.replaceWith(ctaLink);
    } else {
      item.classList.add('nav-card-promo');
    }
    // text label used by the mobile accordion list (reads the image alt text)
    if (imageLink && img && img.alt) {
      const label = document.createElement('a');
      label.className = 'nav-card-label';
      label.href = imageLink.getAttribute('href');
      label.textContent = img.alt;
      item.append(label);
    }
    // drop stray whitespace text nodes
    [...item.childNodes].forEach((n) => { if (n.nodeType === Node.TEXT_NODE) n.remove(); });
    grid.append(item);
  });

  panel.append(grid);
  if (aside.childElementCount) panel.append(aside);
  return panel;
}

function decorateSections(section, navSections) {
  const list = section.querySelector('ul');
  if (!list) return;
  list.className = 'nav-list';
  [...list.children].forEach((item) => {
    item.classList.add('nav-item');
    const trigger = item.querySelector(':scope > p > a, :scope > a');
    const sub = item.querySelector(':scope > ul');
    unwrapParagraphs(item);
    if (!trigger) return;
    trigger.classList.add('nav-link');
    if (!sub) return;
    item.classList.add('nav-drop');
    trigger.classList.add('nav-drop-trigger');
    trigger.setAttribute('role', 'button');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-haspopup', 'true');
    const caret = document.createElement('span');
    caret.className = 'nav-caret';
    caret.setAttribute('aria-hidden', 'true');
    trigger.append(caret);
    const panel = buildPanel(sub);
    sub.replaceWith(panel);
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      togglePanel(item, navSections);
    });
  });
}

function decorateTools(section) {
  const list = section.querySelector('ul');
  if (!list) return;
  list.className = 'nav-tools-list';
  [...list.children].forEach((item) => {
    const link = item.querySelector('a');
    if (!link) return;
    item.classList.add('nav-tool', `nav-tool-${slugify(link.textContent)}`);
    const strong = link.closest('strong');
    if (strong) {
      strong.replaceWith(link);
      item.classList.add('nav-tool-cta');
    }
    // plain text links keep their text directly in the anchor (as on the source);
    // only the icon-based tools (cart, sign-in) get icon + text spans
    const hasIconMarkup = item.classList.contains('nav-tool-cta')
      || item.classList.contains('nav-tool-shopping-cart');
    if (!hasIconMarkup) return;
    const icon = document.createElement('span');
    icon.className = 'nav-tool-icon';
    icon.setAttribute('aria-hidden', 'true');
    const text = document.createElement('span');
    text.className = 'nav-tool-text';
    text.append(...link.childNodes);
    link.append(icon, text);
  });
}

function toggleMenu(nav, forceExpanded) {
  const expanded = forceExpanded !== undefined
    ? !forceExpanded
    : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  if (button) {
    button.setAttribute('aria-expanded', expanded ? 'false' : 'true');
    button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  }
  document.body.style.overflowY = (!expanded && !isDesktop.matches) ? 'hidden' : '';
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const fragment = await fetchNavFragment();
  if (!fragment) return;
  block.textContent = '';

  const sections = {};
  [...fragment.querySelectorAll(':scope > div')].forEach((div, i) => {
    const name = SECTION_NAMES[i] || `extra-${i}`;
    div.className = `nav-${name}`;
    sections[name] = div;
  });

  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-expanded', 'false');
  nav.setAttribute('aria-label', 'Primary');

  // row 0: brand bar
  const bar = document.createElement('div');
  bar.className = 'nav-bar';
  const barInner = document.createElement('div');
  barInner.className = 'nav-bar-inner';
  bar.append(barInner);

  const mobileLabel = sections['mobile-extras']
    ? [...sections['mobile-extras'].querySelectorAll('li')].find((li) => !li.querySelector('a'))
    : null;
  const hamburger = document.createElement('div');
  hamburger.className = 'nav-hamburger';
  const hamburgerButton = document.createElement('button');
  hamburgerButton.type = 'button';
  hamburgerButton.setAttribute('aria-controls', 'nav');
  hamburgerButton.setAttribute('aria-expanded', 'false');
  hamburgerButton.setAttribute('aria-label', 'Open navigation');
  hamburgerButton.innerHTML = '<span class="nav-hamburger-icon"><span></span><span></span><span></span></span>';
  if (mobileLabel) {
    const label = document.createElement('span');
    label.className = 'nav-hamburger-label';
    label.textContent = mobileLabel.textContent.trim();
    hamburgerButton.append(label);
  }
  hamburgerButton.addEventListener('click', () => toggleMenu(nav));
  hamburger.append(hamburgerButton);
  barInner.append(hamburger);

  if (sections.brand) {
    unwrapParagraphs(sections.brand);
    const brandLink = sections.brand.querySelector('a');
    if (brandLink) brandLink.classList.add('nav-brand-link');
    barInner.append(sections.brand);
  }

  const searchWrap = document.createElement('div');
  searchWrap.className = 'nav-search';
  const searchForm = buildSearchForm(sections.search, 'desktop');
  if (searchForm) searchWrap.append(searchForm);
  barInner.append(searchWrap);

  if (sections.tools) {
    decorateTools(sections.tools);
    barInner.append(sections.tools);
  }

  // mobile-only links shown in the brand bar (e.g. short language toggle)
  if (sections['mobile-extras']) {
    const extras = document.createElement('div');
    extras.className = 'nav-mobile-extras';
    sections['mobile-extras'].querySelectorAll('a').forEach((a) => extras.append(a));
    if (extras.childElementCount) barInner.append(extras);
  }

  // row 1: primary navigation (desktop bar / mobile drawer)
  const navSections = document.createElement('div');
  navSections.className = 'nav-sections';
  if (sections.sections) {
    decorateSections(sections.sections, navSections);
    const inner = document.createElement('div');
    inner.className = 'nav-sections-inner';
    const list = sections.sections.querySelector('.nav-list');
    if (list) inner.append(list);

    // mobile drawer: account actions on top, search + utility links at the bottom
    if (sections.tools) {
      const account = document.createElement('div');
      account.className = 'nav-drawer-account';
      sections.tools.querySelectorAll('.nav-tool-create-account a, .nav-tool-cta a').forEach((a) => {
        const clone = a.cloneNode(true);
        clone.classList.add(a.closest('.nav-tool-cta') ? 'nav-drawer-cta' : 'nav-drawer-link');
        account.append(clone);
      });
      if (account.childElementCount) inner.prepend(account);
    }
    const footer = document.createElement('div');
    footer.className = 'nav-drawer-footer';
    const drawerSearch = buildSearchForm(sections.search, 'mobile');
    if (drawerSearch) footer.append(drawerSearch);
    if (sections.tools) {
      const utilList = document.createElement('ul');
      utilList.className = 'nav-drawer-utility';
      const utilLinks = [...sections.tools.querySelectorAll('.nav-tool')]
        .filter((li) => li.querySelector('a') && !li.matches('.nav-tool-cta, .nav-tool-create-account, .nav-tool-shopping-cart'))
        .reverse();
      utilLinks.forEach((li) => {
        const clone = li.cloneNode(true);
        clone.className = `${[...li.classList].filter((c) => c.startsWith('nav-tool-')).join(' ')} nav-drawer-utility-item`;
        utilList.append(clone);
      });
      if (utilList.childElementCount) footer.append(utilList);
    }
    if (footer.childElementCount) inner.append(footer);
    navSections.append(inner);
  }

  nav.append(bar, navSections);

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);

  // close desktop panels on outside click / Escape
  document.addEventListener('click', (e) => {
    if (isDesktop.matches && !navSections.contains(e.target)) closeAllPanels(navSections);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const open = navSections.querySelector('.nav-drop.is-open');
    if (open && isDesktop.matches) {
      closeAllPanels(navSections);
      open.querySelector('.nav-drop-trigger').focus();
    } else if (!isDesktop.matches && nav.getAttribute('aria-expanded') === 'true') {
      toggleMenu(nav, false);
      hamburgerButton.focus();
    }
  });

  // viewport resize: reset mobile drawer + panels when crossing the breakpoint
  isDesktop.addEventListener('change', () => {
    toggleMenu(nav, false);
    closeAllPanels(navSections);
  });
}
