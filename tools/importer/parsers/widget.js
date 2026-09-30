/* eslint-disable */
/* global WebImporter */
/**
 * Parser for widget. Base: widget (project infrastructure block).
 * Source: https://www.alc.ca/content/alc/en/our-games/lotto/lotto-6-49.html
 * Generated: 2026-09-25
 *
 * Content model: a widget is NOT authored as a block table. scripts.js auto-blocks any
 * paragraph holding a single `/widgets/{name}.html?params` link into the `widget` block.
 * So this parser replaces each live-data area with:
 *   <p><a href="/widgets/{name}.html?game={code}">/widgets/{name}.html?game={code}</a></p>
 * (WebImporter.Blocks.createBlock is intentionally NOT used; the paragraphs are wrapped in a
 * plain <div> that html2md unwraps.)
 *
 * Instances (template "lotto"), validated against the live page / cleaned.html:
 *   #draw-subcomponent > div.draw--full.row > div.draw--full__winning-numbers -> winning-numbers
 *   #draw-subcomponent > div.draw--full.row > div.draw--full__jackpot          -> jackpot
 *       keeps div.draw--full__jackpot__cta > a.arrow-button ("Get your ticket") as a
 *       default-content paragraph after the widget link.
 *   .prize-payout-content > div.payout-tables                                  -> prize-payout
 *       also removes the sibling live-only controls div.collapse-expand (Expand/Collapse/Print)
 *       and div.atlantic-payout (Atlantic 49 payout table, sibling of .payout-tables on the
 *       live DOM). The static disclaimer + "Watch the latest draw" link (#par2) are kept.
 *   .winners-tab-content > div.winners-list                                    -> winners-list
 *       filters, winner articles, load-more are dropped; the pane's h1.title is demoted to h2;
 *       div.winners-page-link ("See winners for all games") is kept.
 *
 * Game code: [data-game] on #game-details / #draw-subcomponent ("Lotto649" -> "lotto649").
 * Fallback (fragment documents have no [data-game]): last URL path segment without .html,
 * dashes removed ("lotto-6-49" -> "lotto649").
 */

function pageSlug(document, url, params) {
  const candidates = [params && params.originalURL, url, document.location && document.location.href];
  for (const c of candidates) {
    if (!c) continue;
    try {
      const seg = new URL(c, 'https://www.alc.ca').pathname.split('/').filter(Boolean).pop() || '';
      const slug = seg.replace(/\.html?$/i, '');
      if (slug && slug !== 'about:blank') return slug;
    } catch (e) { /* ignore */ }
  }
  return '';
}

function gameCode(element, document, url, params) {
  const host = element.closest('[data-game]') || document.querySelector('[data-game]');
  const fromDom = host && host.getAttribute('data-game');
  if (fromDom && fromDom.trim()) return fromDom.trim().toLowerCase();
  return pageSlug(document, url, params).toLowerCase().replace(/[^a-z0-9]/g, '');
}

function widgetName(element) {
  if (element.matches('.draw--full__winning-numbers')) return 'winning-numbers';
  if (element.matches('.draw--full__jackpot')) return 'jackpot';
  if (element.matches('.payout-tables') || element.closest('.prize-payout-content')) return 'prize-payout';
  if (element.matches('.winners-list') || element.closest('.winners-tab-content')) return 'winners-list';
  return null;
}

function widgetParagraph(document, name, code) {
  const href = `/widgets/${name}.html${code ? `?game=${code}` : ''}`;
  const p = document.createElement('p');
  const a = document.createElement('a');
  a.href = href;
  a.textContent = href;
  p.append(a);
  return p;
}

export default function parse(element, { document, url, params } = {}) {
  const name = widgetName(element);
  if (!name) {
    element.replaceWith(...element.childNodes);
    return;
  }
  const code = gameCode(element, document, url, params);
  const out = [widgetParagraph(document, name, code)];

  if (name === 'jackpot') {
    // Keep the authored "Get your ticket" CTA (section default content).
    const cta = element.querySelector('.draw--full__jackpot__cta a[href], a.arrow-button[href]');
    if (cta && cta.textContent.trim()) {
      const p = document.createElement('p');
      const a = document.createElement('a');
      a.href = cta.getAttribute('href');
      a.textContent = cta.textContent.trim();
      // bold link = authored primary button (the source CTA is an arrow pill button)
      const strong = document.createElement('strong');
      strong.append(a);
      p.append(strong);
      out.push(p);
    }
  }

  if (name === 'prize-payout') {
    const pane = element.closest('.prize-payout-content') || element.parentElement;
    if (pane) {
      pane.querySelectorAll('.collapse-expand, .atlantic-payout').forEach((el) => {
        if (!element.contains(el)) el.remove();
      });
    }
  }

  if (name === 'winners-list') {
    const pane = element.closest('.winners-tab-content') || element.parentElement;
    const h1 = pane && pane.querySelector(':scope > h1');
    if (h1) {
      const h2 = document.createElement('h2');
      h2.textContent = h1.textContent.trim();
      h1.replaceWith(h2);
    }
  }

  // Plain wrapper div (unwrapped by html2md) so the replacement is a single node.
  const block = document.createElement('div');
  block.append(...out);
  element.replaceWith(block);
}
