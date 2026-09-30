/* eslint-disable */
/* global WebImporter */
/**
 * Parser for carousel-hero. Base: carousel.
 * Source: https://www.alc.ca/content/alc/en.html
 * Generated: 2026-09-24
 *
 * Source structure (validated against block-context/carousel-hero/source.html and live DOM):
 *   div.carousel.hero > .alc-carousel > ul.slides > li.slide (x5)
 *     > article.fca-carousel-slide-promo > a[href] > div.slide-content.picturefill-background
 *       - cleaned DOM: <img src> inside .slide-content
 *       - live DOM: background-image style + span[data-media][data-src] (picturefill)
 *       - .next-draw-timer (JS countdown) - intentionally dropped
 * Slide text is baked into the artwork, so each row = [image] | [CTA "Play now" link].
 *
 * Output (carousel convention, 2 columns): one row per slide.
 */
function resolveImage(slide, document) {
  const content = slide.querySelector('.slide-content, .picturefill-background') || slide;
  const existing = content.querySelector('img');
  if (existing && existing.getAttribute('src')) {
    if (!existing.getAttribute('alt')) existing.setAttribute('alt', '');
    return existing;
  }
  // picturefill spans: prefer the widest (desktop) rendition
  const spans = [...content.querySelectorAll('span[data-src]')];
  let src = '';
  if (spans.length) {
    const desktop = spans.find((s) => /1200/.test(s.getAttribute('data-media') || ''));
    src = (desktop || spans[spans.length - 1]).getAttribute('data-src');
  }
  if (!src) {
    const style = content.getAttribute('style') || '';
    const m = style.match(/background-image:\s*url\(["']?([^"')]+)["']?\)/i);
    if (m) src = m[1];
  }
  if (!src) return null;
  const img = document.createElement('img');
  img.src = src;
  img.alt = '';
  return img;
}

export default function parse(element, { document }) {
  // Iterate slides (li.slide) — not the anchors, which wrap block content.
  let slides = [...element.querySelectorAll(':scope ul.slides > li.slide')];
  if (!slides.length) slides = [...element.querySelectorAll('li.slide, .fca-carousel-slide-promo article')];

  const cells = [];
  slides.forEach((slide) => {
    const img = resolveImage(slide, document);
    const link = slide.querySelector('article a[href], a[href]');
    const ctaCell = [];
    if (link) {
      const cta = document.createElement('a');
      cta.href = link.getAttribute('href');
      const label = link.textContent.replace(/Time Remaining:|hr|min|sec/g, '').trim();
      cta.textContent = label || 'Play now';
      const p = document.createElement('p');
      p.append(cta);
      ctaCell.push(p);
    }
    if (!img && !ctaCell.length) return;
    // Source serves separate mobile (imageM, <768px) and tablet (imageT, 768-1199px) artwork:
    // author them as second and third images after the desktop one
    const imageCell = [];
    if (img) {
      imageCell.push(img);
      const src = img.getAttribute('src') || '';
      if (/\/imageD\./.test(src)) {
        ['/imageM.', '/imageT.'].forEach((rendition) => {
          const variant = document.createElement('img');
          variant.src = src.replace('/imageD.', rendition);
          variant.alt = img.getAttribute('alt') || '';
          imageCell.push(variant);
        });
      }
    }
    cells.push([imageCell.length ? imageCell : '', ctaCell.length ? ctaCell : '']);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-hero', cells });
  element.replaceWith(block);
}
