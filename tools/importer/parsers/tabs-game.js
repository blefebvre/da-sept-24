/* eslint-disable */
/* global WebImporter */
/**
 * Parser for tabs-game. Base: tabs.
 * Source: https://www.alc.ca/content/alc/en/our-games/lotto/lotto-6-49.html
 * Generated: 2026-09-25
 *
 * Source structure (validated against block-context/tabs-game/source.html and the live DOM):
 *   div.content > div.tabs
 *     ul.nav.nav-tabs > li > a[href="#payout" | "#winners" | "#how-to-play"]  -> tab labels (order)
 *     div.tab-content
 *       div#payout.tab-pane.prize-payout-content       -> fragment "prize-payout"
 *       div#winners.tab-pane.winners-tab-content       -> fragment "winners"
 *       div#how-to-play.tab-pane.how-to-play-content   -> fragment "how-to-play"
 *
 * Output (library convention: 2 columns, 1 row per tab, source tab order):
 *   [ tab label | <a href="/fragments/lotto/{page}/{slug}">/fragments/lotto/{page}/{slug}</a> ]
 *   {page} = last URL path segment without .html (lotto-6-49); {slug} from the pane class
 *   (`{slug}-content` / `{slug}-tab-content`), fallback: slugified tab label.
 *
 * IMPORT SCRIPT CONTRACT (this parser discards the panes):
 *   BEFORE block parsing, clone every `div.tabs .tab-content > .tab-pane` into its own
 *   fragment document (path /fragments/lotto/{page}/{slug}, slug via parse.paneSlug(pane),
 *   i.e. `import tabsGameParser from ...; tabsGameParser.paneSlug(pane)`; page via
 *   tabsGameParser.pageSlug(document, url, params)).
 *   Then parse this block in the main document; it replaces div.tabs entirely.
 */

function slugify(text) {
  return (text || '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function pageSlug(document, url, params) {
  const candidates = [params && params.originalURL, url, document && document.location && document.location.href];
  for (const c of candidates) {
    if (!c) continue;
    try {
      const seg = new URL(c, 'https://www.alc.ca').pathname.split('/').filter(Boolean).pop() || '';
      const slug = seg.replace(/\.html?$/i, '');
      if (slug && slug !== 'blank') return slug;
    } catch (e) { /* ignore */ }
  }
  return '';
}

/** Fragment slug for a .tab-pane: prize-payout-content -> prize-payout, winners-tab-content -> winners. */
function paneSlug(pane, label) {
  if (pane) {
    const cls = [...pane.classList].find((c) => /-content$/.test(c) && c !== 'tab-content');
    if (cls) return cls.replace(/(-tab)?-content$/, '');
    if (pane.id) return slugify(pane.id);
  }
  return slugify(label);
}

export default function parse(element, { document, url, params } = {}) {
  const page = pageSlug(document, url, params);
  const panes = [...element.querySelectorAll('.tab-content > .tab-pane')];
  let tabLinks = [...element.querySelectorAll('ul.nav-tabs > li > a, [role="tablist"] a[role="tab"]')];
  tabLinks = tabLinks.filter((a, i) => tabLinks.indexOf(a) === i);

  const items = [];
  if (tabLinks.length) {
    tabLinks.forEach((a, i) => {
      const label = a.textContent.replace(/\s+/g, ' ').trim();
      const id = (a.getAttribute('href') || '').replace(/^.*#/, '');
      const pane = (id && panes.find((p) => p.id === id)) || panes[i] || null;
      items.push({ label, pane });
    });
  } else {
    panes.forEach((pane, i) => items.push({ label: `Tab ${i + 1}`, pane }));
  }

  const cells = [];
  items.forEach(({ label, pane }) => {
    const slug = paneSlug(pane, label);
    if (!slug) return;
    const path = `/fragments/lotto/${page}/${slug}`;
    const a = document.createElement('a');
    a.href = path;
    a.textContent = path;
    cells.push([label, a]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'tabs-game', cells });
  element.replaceWith(block);
}

// Helpers for the import script, attached to the default export (the parser module must
// expose only a default export for the validator).
parse.paneSlug = paneSlug;
parse.pageSlug = pageSlug;
