/* eslint-disable */
/* global WebImporter */
/**
 * Parser for carousel-winners. Base: carousel.
 * Source: https://www.alc.ca/content/alc/en.html
 * Generated: 2026-09-24
 *
 * Source structure (validated against block-context/carousel-winners/source.html and live DOM):
 *   div.winners-carousel .slick-track > div.slick-slide (clones have .slick-cloned — skipped)
 *     .slide > .container
 *       .winner-image            -> photo (background-image style on live page; img fallback)
 *       .winner-info h3          -> winner name
 *       .winner-info span.h2     -> location
 *       .winner-info a.all-winners -> "See all winners" CTA
 *       .prize-details img.winning-game-logo -> game logo
 *       .prize-details p.prize-amount > span* -> prize digits (groups of thousands)
 *   Decorative: slide background img, province map, "Winner" ribbon — dropped.
 *
 * Output (2 columns, 1 row per winner):
 *   cell 1 = winner photo
 *   cell 2 = game logo, prize (h3), name, location, CTA
 * The block JS routes headings/pictures to the prize column and other content to details,
 * so the name is emitted as a <p><strong> and the prize as the heading.
 */
function bgUrl(el) {
  if (!el) return '';
  const style = el.getAttribute('style') || '';
  const m = style.match(/background-image:\s*url\(\s*["']?([^"')]+)["']?\s*\)/i);
  return m ? m[1].trim() : '';
}

function formatPrize(prizeEl) {
  if (!prizeEl) return '';
  const groups = [...prizeEl.querySelectorAll(':scope > span')]
    .map((s) => s.textContent.replace(/[^0-9]/g, ''))
    .filter(Boolean);
  // Digit groups may be split per span or merged into one span on the live page;
  // normalise to a thousands-separated amount either way.
  const digits = groups.length ? groups.join('') : prizeEl.textContent.replace(/[^0-9]/g, '');
  if (!digits) return '';
  return `$${Number(digits).toLocaleString('en-US')}`;
}

export default function parse(element, { document }) {
  // Only real (non-cloned) slick slides; fall back to .slide wrappers if slick is not initialised.
  let slides = [...element.querySelectorAll('.slick-track > .slick-slide:not(.slick-cloned)')];
  if (!slides.length) slides = [...element.querySelectorAll('.slide')];

  const cells = [];
  slides.forEach((slide) => {
    const photoWrap = slide.querySelector('.winner-image');
    let photo = photoWrap ? photoWrap.querySelector('img') : null;
    if (!photo) {
      const src = bgUrl(photoWrap);
      if (src) {
        photo = document.createElement('img');
        photo.src = src;
      }
    }

    const info = slide.querySelector('.winner-info') || slide;
    const nameEl = info.querySelector('h3, h2, h4');
    const locationEl = info.querySelector('span.h2, .location');
    const ctaEl = info.querySelector('a.all-winners, a.button, a[href]');
    const logoEl = slide.querySelector('.prize-details img.winning-game-logo, .prize-details img');
    const prizeText = formatPrize(slide.querySelector('.prize-amount'));

    const name = nameEl ? nameEl.textContent.trim() : '';
    if (photo) photo.alt = name ? `${name}` : (photo.alt || '');

    const content = [];
    if (logoEl) {
      const p = document.createElement('p');
      if (!logoEl.getAttribute('alt')) logoEl.setAttribute('alt', 'game logo');
      p.append(logoEl);
      content.push(p);
    }
    if (prizeText) {
      const h = document.createElement('h3');
      h.textContent = prizeText;
      content.push(h);
    }
    if (name) {
      const p = document.createElement('p');
      const strong = document.createElement('strong');
      strong.textContent = name;
      p.append(strong);
      content.push(p);
    }
    if (locationEl && locationEl.textContent.trim()) {
      const p = document.createElement('p');
      p.textContent = locationEl.textContent.trim();
      content.push(p);
    }
    if (ctaEl) {
      const a = document.createElement('a');
      // Source link carries a doubled extension (winners.html.html)
      a.href = ctaEl.getAttribute('href').replace(/(\.html)+(?=$|[?#])/, '.html');
      a.textContent = ctaEl.textContent.trim() || 'See all winners';
      const p = document.createElement('p');
      p.append(a);
      content.push(p);
    }

    if (!photo && !content.length) return;
    cells.push([photo || '', content.length ? content : '']);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-winners', cells });
  element.replaceWith(block);
}
