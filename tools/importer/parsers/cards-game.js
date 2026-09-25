/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-game. Base: cards.
 * Source: https://www.alc.ca/content/alc/en.html
 * Generated: 2026-09-24
 *
 * Source structure (validated against block-context/cards-game/source.html and live DOM):
 *   main.cmp-container--game-tiles > .cmp-container > div.game-tile.parbase (x8)
 *     > article.game-tile
 *       .game-tile-image-container  -> tile image (img in cleaned DOM, background-image on live page)
 *         .jackpot-* / .game-flag   -> live jackpot overlay / "NEW" badge — dropped
 *       .game-tile-content
 *         h3.game-tile-title        -> title
 *         .game-tile-description    -> description (may contain a "Read more" link)
 *         div > p.next-jackpot-date / p.next-jackpot-prize / p.prize-info -> JS-driven draw info — dropped
 *         a.button                  -> CTA
 *
 * Output (2 columns, 1 row per tile): cell 1 = image; cell 2 = h3 title, description, CTA.
 */
function tileImage(container, document) {
  if (!container) return null;
  // Direct child img only — nested imgs belong to jackpot overlays / badges.
  const img = container.querySelector(':scope > img');
  if (img && img.getAttribute('src')) return img;
  const style = container.getAttribute('style') || '';
  const m = style.match(/background-image:\s*url\(\s*["']?([^"')]+)["']?\s*\)/i);
  if (!m) return null;
  const el = document.createElement('img');
  el.src = m[1].trim();
  el.alt = '';
  return el;
}

export default function parse(element, { document }) {
  let tiles = [...element.querySelectorAll('div.game-tile.parbase')];
  if (!tiles.length) tiles = [...element.querySelectorAll('article.game-tile')];

  const cells = [];
  tiles.forEach((tile) => {
    const image = tileImage(tile.querySelector('.game-tile-image-container'), document);
    const content = tile.querySelector('.game-tile-content') || tile;

    const titleEl = content.querySelector('.game-tile-title, h3, h2');
    const descEl = content.querySelector('.game-tile-description');
    const ctaEl = content.querySelector(':scope > a.button, a.arrow-button');

    const body = [];
    if (titleEl && titleEl.textContent.trim()) {
      const h3 = document.createElement('h3');
      h3.textContent = titleEl.textContent.trim();
      body.push(h3);
    }
    if (descEl) {
      [...descEl.children].forEach((child) => {
        if (child.textContent.trim()) body.push(child);
      });
      if (!descEl.children.length && descEl.textContent.trim()) {
        const p = document.createElement('p');
        p.textContent = descEl.textContent.trim();
        body.push(p);
      }
    }
    if (ctaEl) {
      const a = document.createElement('a');
      a.href = ctaEl.getAttribute('href');
      a.textContent = ctaEl.textContent.trim() || ctaEl.getAttribute('title') || 'Learn more';
      const p = document.createElement('p');
      p.append(a);
      body.push(p);
    }

    if (!image && !body.length) return;
    cells.push([image || '', body.length ? body : '']);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-game', cells });
  element.replaceWith(block);
}
