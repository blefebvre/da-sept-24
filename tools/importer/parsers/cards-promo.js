/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-promo. Base: cards.
 * Source: https://www.alc.ca/content/alc/en.html
 * Generated: 2026-09-24
 *
 * Source structure (validated against block-context/cards-promo/source.html and live DOM):
 *   div.alc-container.cmp-container--hide-column-gutters > ... > .cmp-container
 *     div.reference.parbase (x4) > .cmp-image a[href] > picture > source[srcset]* + img
 *   Second grid column holds .alc-mobile-banner (mobile-only app banner) — skipped,
 *   as is any div.html-promo.parbase.
 *
 * Iterates the div.reference.parbase wrappers (not the anchors) to avoid inline-merge collapse.
 * Images were not downloaded locally, so absolute alc.ca URLs are kept (desktop rendition
 * from the (min-width: 1200px) <source> when available, else img src).
 *
 * Output (2 columns, 1 row per promo): cell 1 = image; cell 2 = link to promo target.
 */
const ORIGIN = 'https://www.alc.ca';

function absolute(url) {
  if (!url) return '';
  const u = url.trim().split(/\s+/)[0];
  if (/^https?:\/\//i.test(u)) return u;
  if (u.startsWith('//')) return `https:${u}`;
  if (u.startsWith('/')) return `${ORIGIN}${u}`;
  return u;
}

function isExcluded(el) {
  return !!el.closest('.html-promo, .alc-mobile-banner, .banner, .hide-content');
}

export default function parse(element, { document }) {
  let items = [...element.querySelectorAll('div.reference.parbase')].filter((el) => !isExcluded(el));
  if (!items.length) {
    items = [...element.querySelectorAll('.cmp-image')].filter((el) => !isExcluded(el));
  }

  const cells = [];
  items.forEach((item) => {
    const imgEl = item.querySelector('picture img, img');
    const linkEl = item.querySelector('a[href]');
    if (!imgEl && !linkEl) return;

    let image = '';
    if (imgEl) {
      const picture = imgEl.closest('picture');
      const desktop = picture
        && [...picture.querySelectorAll('source[srcset]')]
          .find((s) => /1200/.test(s.getAttribute('media') || ''));
      const src = absolute((desktop && desktop.getAttribute('srcset')) || imgEl.getAttribute('src'));
      const desktopImg = document.createElement('img');
      desktopImg.src = src;
      desktopImg.alt = imgEl.getAttribute('alt') || '';
      image = [desktopImg];
      // Source serves separate mobile artwork (imageM) below 768px: author it as a second image
      if (/\/imageD\./.test(src)) {
        const mobileImg = document.createElement('img');
        mobileImg.src = src.replace('/imageD.', '/imageM.');
        mobileImg.alt = desktopImg.alt;
        image.push(mobileImg);
      }
    }

    let linkCell = '';
    if (linkEl) {
      const a = document.createElement('a');
      a.href = linkEl.getAttribute('href');
      a.textContent = linkEl.textContent.trim()
        || linkEl.getAttribute('title')
        || (imgEl && imgEl.getAttribute('alt'))
        || 'Learn more';
      const p = document.createElement('p');
      p.append(a);
      linkCell = p;
    }

    cells.push([image, linkCell]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-promo', cells });
  element.replaceWith(block);
}
