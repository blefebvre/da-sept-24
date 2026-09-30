/* eslint-disable */
/* global WebImporter */
/**
 * Parser for accordion-game. Base: accordion.
 * Source: https://www.alc.ca/content/alc/en/our-games/lotto/lotto-6-49.html
 * Generated: 2026-09-25
 *
 * Source structure (validated against block-context/accordion-game/source.html and live DOM):
 *   .how-to-play-content .panel-group#accordion649
 *     div.panel.panel-default (x8)
 *       div.panel-heading > div.panel-title > a[role=button]   -> item title (optional logo img)
 *       div.panel-collapse > div.panel-body                    -> item content (p, ul, a, table)
 *
 * Output (library convention: 2 columns, 1 row per item): [ title | content ]
 *   - Empty (&nbsp;-only) paragraphs and <script> are dropped.
 *   - Items whose body holds a <table> (lotto-6-49: "Odds of Winning", "Combination Play"):
 *     the first table AND every element after it in the .panel-body (odds footnotes) are
 *     replaced by <p><a href="/fragments/lotto/{page}/{slug}">/fragments/lotto/{page}/{slug}</a></p>,
 *     slug = slugified title (odds-of-winning, combination-play). Text before the table stays.
 *
 * IMPORT SCRIPT CONTRACT (table fragments):
 *   BEFORE block parsing, for each `.panel` of this panel-group whose
 *   `.panel-collapse > .panel-body` contains a `table`, clone the table plus all its following
 *   element siblings (selector relative to the panel: `.panel-body > table` + following
 *   siblings) into a fragment document /fragments/lotto/{page}/{slug}.
 *   Helper: accordionGameParser.tableFragmentSources(panelGroup) ->
 *     [{ name: 'odds-of-winning', nodes: [table, p, p, ...] }, { name: 'combination-play', nodes: [table, p] }]
 *   Run the table-prize parser on every `table` inside those fragment documents.
 *   Page slug {page}: last URL path segment of params.originalURL without .html.
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

function getPanels(element) {
  let panels = [...element.querySelectorAll(':scope > .panel')];
  if (!panels.length) panels = [...element.querySelectorAll('.panel')].filter((p) => p.querySelector('.panel-heading'));
  return panels;
}

function panelTitle(panel) {
  const t = panel.querySelector('.panel-heading .panel-title, .panel-heading');
  return t ? t.textContent.replace(/\s+/g, ' ').trim() : '';
}

function panelBody(panel) {
  return panel.querySelector('.panel-collapse > .panel-body, .panel-body');
}

/** Table-backed fragment sources: [{ name, nodes }] (live nodes; clone them). */
function tableFragmentSources(element) {
  return getPanels(element).map((panel) => {
    const body = panelBody(panel);
    const table = body && [...body.children].find((c) => c.tagName === 'TABLE' || c.querySelector('table'));
    if (!table) return null;
    const nodes = [];
    for (let n = table; n; n = n.nextElementSibling) nodes.push(n);
    return { name: slugify(panelTitle(panel)), nodes };
  }).filter(Boolean);
}

function isEmptyNode(el) {
  if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE') return true;
  if (el.querySelector('img, a[href], table, iframe')) return false;
  return !el.textContent.replace(/[\s ​]+/g, '');
}

export default function parse(element, { document, url, params } = {}) {
  const page = pageSlug(document, url, params);
  const fragments = tableFragmentSources(element);

  const cells = [];
  getPanels(element).forEach((panel) => {
    const titleText = panelTitle(panel);
    const titleEl = panel.querySelector('.panel-heading .panel-title, .panel-heading');
    const logo = titleEl && titleEl.querySelector('img');
    const titleCell = [];
    if (logo) titleCell.push(logo);
    if (titleText) titleCell.push(titleText);

    const body = panelBody(panel);
    const frag = fragments.find((f) => f.nodes[0] && body && body.contains(f.nodes[0]));
    const content = [];
    if (body) {
      for (const child of [...body.children]) {
        if (frag && child === frag.nodes[0]) {
          const path = `/fragments/lotto/${page}/${frag.name}`;
          const p = document.createElement('p');
          const a = document.createElement('a');
          a.href = path;
          a.textContent = path;
          p.append(a);
          content.push(p);
          break; // table + everything after it lives in the fragment
        }
        if (isEmptyNode(child)) continue;
        content.push(child);
      }
    }

    if (!titleCell.length && !content.length) return;
    cells.push([titleCell.length ? titleCell : '', content.length ? content : '']);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'accordion-game', cells });
  element.replaceWith(block);
}

// Helpers for the import script, attached to the default export (the parser module must
// expose only a default export for the validator).
parse.tableFragmentSources = tableFragmentSources;
parse.pageSlug = pageSlug;
