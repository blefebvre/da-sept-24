import { createOptimizedPicture } from '../../scripts/aem.js';

let carouselId = 0;

function currentIndex(block) {
  return parseInt(block.dataset.activeSlide || '0', 10);
}

function updateActiveSlide(block, slideIndex) {
  block.dataset.activeSlide = slideIndex;
  block.querySelectorAll('.carousel-winners-slide').forEach((slide, idx) => {
    const active = idx === slideIndex;
    slide.setAttribute('aria-hidden', !active);
    slide.querySelectorAll('a, button').forEach((el) => {
      if (active) el.removeAttribute('tabindex');
      else el.setAttribute('tabindex', '-1');
    });
  });
  block.querySelectorAll('.carousel-winners-indicator button').forEach((button, idx) => {
    if (idx === slideIndex) {
      button.setAttribute('disabled', '');
      button.setAttribute('aria-current', 'true');
    } else {
      button.removeAttribute('disabled');
      button.removeAttribute('aria-current');
    }
  });
}

function showSlide(block, slideIndex) {
  const slides = block.querySelectorAll('.carousel-winners-slide');
  if (!slides.length) return;
  const idx = (slideIndex + slides.length) % slides.length;
  block.querySelector('.carousel-winners-slides').scrollTo({
    top: 0,
    left: slides[idx].offsetLeft,
    behavior: 'smooth',
  });
  updateActiveSlide(block, idx);
}

function bindEvents(block) {
  block.querySelectorAll('.carousel-winners-indicator button').forEach((button, idx) => {
    button.addEventListener('click', () => showSlide(block, idx));
  });
  block.querySelector('.carousel-winners-prev')
    .addEventListener('click', () => showSlide(block, currentIndex(block) - 1));
  block.querySelector('.carousel-winners-next')
    .addEventListener('click', () => showSlide(block, currentIndex(block) + 1));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        updateActiveSlide(block, parseInt(entry.target.dataset.slideIndex, 10));
      }
    });
  }, { threshold: 0.5 });
  block.querySelectorAll('.carousel-winners-slide').forEach((slide) => observer.observe(slide));
}

function optimize(container, width) {
  container.querySelectorAll('picture > img').forEach((img) => {
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width }]));
  });
}

const PROVINCES = ['NB', 'NS', 'PE', 'NL'];
const RIBBON_LABELS = { en: 'Winner', fr: 'Gagnant' };

/**
 * Tags the name / location / CTA paragraphs and derives the province (for the map backdrop)
 * from a trailing ", XX" in the location line.
 */
function decorateDetails(details, slide) {
  [...details.children].forEach((el) => {
    const link = el.querySelector('a[href]');
    if (link && el.textContent.trim() === link.textContent.trim()) {
      el.classList.add('carousel-winners-slide-cta');
      link.classList.add('button');
      return;
    }
    const strong = el.querySelector('strong, b');
    if (strong && el.textContent.trim() === strong.textContent.trim()) {
      el.classList.add('carousel-winners-slide-name');
      return;
    }
    el.classList.add('carousel-winners-slide-location');
    const match = el.textContent.trim().match(/,\s*([A-Za-z]{2})\.?$/);
    const province = match && match[1].toUpperCase();
    if (province && PROVINCES.includes(province) && !slide.dataset.province) {
      slide.dataset.province = province;
    }
  });
}

/**
 * Game logo gets a "Winner" ribbon; a "$1,234,567" heading is split into digit-group boxes
 * (visual only — the original amount stays available to assistive tech).
 */
function decoratePrize(prize) {
  const logo = [...prize.children].find((el) => el.querySelector('picture'));
  if (logo) {
    logo.classList.add('carousel-winners-slide-game');
    // game key from the logo file name (e.g. ".../LottoMax_en.png/...") for per-logo placement
    const img = logo.querySelector('img');
    const [, game] = (img && decodeURIComponent(img.src).match(/\/([A-Za-z0-9]+)_(?:en|fr)\.png/i)) || [];
    if (game) logo.dataset.game = game;
    const lang = (document.documentElement.lang || 'en').slice(0, 2).toLowerCase();
    const ribbon = document.createElement('span');
    ribbon.className = 'carousel-winners-slide-ribbon';
    ribbon.textContent = RIBBON_LABELS[lang] || RIBBON_LABELS.en;
    logo.append(ribbon);
  }

  const heading = prize.querySelector('h1, h2, h3, h4, h5, h6');
  if (!heading) return;
  heading.classList.add('carousel-winners-slide-amount');
  const amount = heading.textContent.trim();
  const match = amount.match(/^\$\s*(\d{1,3}(?:[,\s]\d{3})*)$/);
  if (!match) return;

  const label = document.createElement('span');
  label.className = 'carousel-winners-sr-only';
  label.textContent = amount;
  const digits = document.createElement('span');
  digits.className = 'carousel-winners-slide-digits';
  digits.setAttribute('aria-hidden', 'true');
  match[1].split(/[,\s]/).forEach((group, idx) => {
    const box = document.createElement('span');
    // leading space after the CSS "$" matches the source's "$ 500" spacing
    box.textContent = idx === 0 ? ` ${group}` : group;
    digits.append(box);
  });
  heading.replaceChildren(label, digits);
}

/**
 * Slide layout: photo | details (name, location, CTA) | prize (game logo + prize heading).
 * Cell 1 = winner photo. Remaining cells are merged; pictures and headings in them go to the
 * prize column, all other content goes to the details column.
 */
function createSlide(row, idx, id) {
  const slide = document.createElement('li');
  slide.className = 'carousel-winners-slide';
  slide.dataset.slideIndex = idx;
  slide.id = `carousel-winners-${id}-slide-${idx}`;

  const cells = [...row.children];
  const photoCell = cells.find((cell) => cell.querySelector('picture')
    && !cell.textContent.trim());
  const otherCells = cells.filter((cell) => cell !== photoCell);

  if (photoCell) {
    photoCell.className = 'carousel-winners-slide-photo';
    optimize(photoCell, '400');
    slide.append(photoCell);
  }

  const details = document.createElement('div');
  details.className = 'carousel-winners-slide-details';
  const prize = document.createElement('div');
  prize.className = 'carousel-winners-slide-prize';

  otherCells.forEach((cell) => {
    [...cell.childNodes].forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        if (node.textContent.trim()) {
          const p = document.createElement('p');
          p.textContent = node.textContent.trim();
          details.append(p);
        }
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      const isHeading = /^H[1-6]$/.test(node.tagName);
      const isPictureOnly = node.querySelector('picture') && !node.textContent.trim();
      if (isHeading || isPictureOnly || node.tagName === 'PICTURE') prize.append(node);
      else details.append(node);
    });
  });

  decorateDetails(details, slide);
  optimize(prize, '400');
  decoratePrize(prize);
  if (details.children.length) slide.append(details);
  if (prize.children.length) slide.append(prize);

  const heading = prize.querySelector('h1, h2, h3, h4, h5, h6');
  if (heading && heading.id) slide.setAttribute('aria-labelledby', heading.id);

  return slide;
}

export default function decorate(block) {
  carouselId += 1;
  const id = carouselId;

  const rows = [...block.children].filter((row) => row.children.length);
  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'Carousel');

  const slides = document.createElement('ul');
  slides.className = 'carousel-winners-slides';
  rows.forEach((row, idx) => slides.append(createSlide(row, idx, id)));

  const container = document.createElement('div');
  container.className = 'carousel-winners-slides-container';
  container.append(slides);
  block.replaceChildren(container);

  if (rows.length < 2) return;

  // side arrows overlaid on the slide track
  const navButtons = document.createElement('div');
  navButtons.className = 'carousel-winners-navigation-buttons';
  const prev = document.createElement('button');
  prev.type = 'button';
  prev.className = 'carousel-winners-prev';
  prev.setAttribute('aria-label', 'Previous winner');
  const next = document.createElement('button');
  next.type = 'button';
  next.className = 'carousel-winners-next';
  next.setAttribute('aria-label', 'Next winner');
  navButtons.append(prev, next);
  container.append(navButtons);

  // dots below the track
  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'Winner slide controls');
  const indicators = document.createElement('ol');
  indicators.className = 'carousel-winners-indicators';
  rows.forEach((_, idx) => {
    const li = document.createElement('li');
    li.className = 'carousel-winners-indicator';
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-label', `Show winner ${idx + 1} of ${rows.length}`);
    button.setAttribute('aria-controls', `carousel-winners-${id}-slide-${idx}`);
    li.append(button);
    indicators.append(li);
  });
  nav.append(indicators);
  block.append(nav);

  updateActiveSlide(block, 0);
  bindEvents(block);
}
