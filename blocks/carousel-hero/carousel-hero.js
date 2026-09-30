import createResponsivePicture from '../../scripts/responsive-picture.js';

// source timing: 800ms cross-fade (matches the CSS transition), then 6.5s on screen
const FADE_DURATION = 800;
const AUTOPLAY_DELAY = 6500 + FADE_DURATION;

let carouselId = 0;

function updateActiveSlide(block, slideIndex) {
  const previous = parseInt(block.dataset.activeSlide, 10);
  block.dataset.activeSlide = slideIndex;
  block.querySelectorAll('.carousel-hero-slide').forEach((slide, idx) => {
    const active = idx === slideIndex;
    slide.classList.toggle('is-active', active);
    // the outgoing slide stays on top while it fades out
    slide.classList.toggle('is-leaving', !active && idx === previous);
    slide.setAttribute('aria-hidden', !active);
    slide.querySelectorAll('a, button').forEach((el) => {
      if (active) el.removeAttribute('tabindex');
      else el.setAttribute('tabindex', '-1');
    });
  });
  block.querySelectorAll('.carousel-hero-indicator button').forEach((button, idx) => {
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
  const slides = block.querySelectorAll('.carousel-hero-slide');
  if (!slides.length) return;
  const idx = (slideIndex + slides.length) % slides.length;
  if (idx === parseInt(block.dataset.activeSlide, 10)) return;
  updateActiveSlide(block, idx);
}

const currentSlide = (block) => parseInt(block.dataset.activeSlide || '0', 10);

function setupAutoplay(block) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let timer;
  let paused = false;
  const stop = () => window.clearTimeout(timer);
  const schedule = () => {
    stop();
    if (reduceMotion || paused) return;
    timer = window.setTimeout(() => {
      showSlide(block, currentSlide(block) + 1);
      schedule();
    }, AUTOPLAY_DELAY);
  };
  const pause = () => { paused = true; stop(); };
  const resume = () => { paused = false; schedule(); };
  block.addEventListener('mouseenter', pause);
  block.addEventListener('mouseleave', () => {
    if (!block.contains(document.activeElement)) resume();
  });
  block.addEventListener('focusin', pause);
  block.addEventListener('focusout', (e) => {
    if (!block.contains(e.relatedTarget) && !block.matches(':hover')) resume();
  });
  schedule();
  // manual navigation restarts the countdown so the next slide gets its full time
  return schedule;
}

function bindEvents(block, restartAutoplay) {
  const go = (idx) => {
    showSlide(block, idx);
    restartAutoplay();
  };
  block.querySelectorAll('.carousel-hero-indicator button').forEach((button, idx) => {
    button.addEventListener('click', () => go(idx));
  });
  block.querySelector('.carousel-hero-prev').addEventListener('click', () => go(currentSlide(block) - 1));
  block.querySelector('.carousel-hero-next').addEventListener('click', () => go(currentSlide(block) + 1));
}

function createSlide(row, idx, id) {
  const slide = document.createElement('li');
  slide.className = 'carousel-hero-slide';
  slide.dataset.slideIndex = idx;
  slide.id = `carousel-hero-${id}-slide-${idx}`;

  const cells = [...row.children];
  // image cell = first cell containing a picture; everything else is content (CTA)
  const imageCell = cells.find((cell) => cell.querySelector('picture, img'));
  const contentCells = cells.filter((cell) => cell !== imageCell);

  // the slide artwork already contains the headline and CTA, so the authored
  // CTA link is used to make the whole artwork clickable instead of being rendered
  const link = contentCells.map((cell) => cell.querySelector('a[href]')).find(Boolean);
  if (link) {
    const wrapper = link.closest('p, .button-wrapper, .button-container');
    link.remove();
    if (wrapper && !wrapper.textContent.trim() && !wrapper.children.length) wrapper.remove();
  }

  if (imageCell) {
    imageCell.className = 'carousel-hero-slide-image';
    // first image = desktop artwork, optional second = mobile, optional third = tablet
    const [desktopImg, mobileImg, tabletImg] = imageCell.querySelectorAll('img');
    const eager = idx === 0;
    const optimized = createResponsivePicture(desktopImg, mobileImg, eager, '2000', tabletImg);
    if (eager) optimized.querySelector('img').setAttribute('fetchpriority', 'high');
    [mobileImg, tabletImg].filter(Boolean).forEach((img) => (img.closest('picture') || img).remove());
    if (tabletImg) slide.classList.add('has-tablet-art');
    (desktopImg.closest('picture') || desktopImg).replaceWith(optimized);
    // drop paragraphs left empty by the moved pictures
    imageCell.querySelectorAll('p').forEach((p) => {
      if (!p.textContent.trim() && !p.children.length) p.remove();
    });

    if (link) {
      const slideLink = document.createElement('a');
      slideLink.className = 'carousel-hero-slide-link';
      slideLink.href = link.href;
      if (link.title && link.title !== link.textContent.trim()) slideLink.title = link.title;
      if (link.target) slideLink.target = link.target;
      const label = document.createElement('span');
      label.className = 'carousel-hero-slide-label';
      label.textContent = link.textContent.trim() || link.title || link.href;
      slideLink.append(...imageCell.childNodes, label);
      imageCell.append(slideLink);
    }
    slide.append(imageCell);
  } else if (link) {
    // no artwork authored: fall back to rendering the CTA as content
    contentCells[0].prepend(link);
  }

  const hasContent = contentCells.some((cell) => cell.textContent.trim() || cell.querySelector('picture, img'));
  if (hasContent) {
    const content = document.createElement('div');
    content.className = 'carousel-hero-slide-content';
    contentCells.forEach((cell) => content.append(...cell.childNodes));
    slide.append(content);
  }

  return slide;
}

export default function decorate(block) {
  carouselId += 1;
  const id = carouselId;

  const rows = [...block.children].filter((row) => row.children.length);
  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'Carousel');

  const slides = document.createElement('ul');
  slides.className = 'carousel-hero-slides';
  rows.forEach((row, idx) => slides.append(createSlide(row, idx, id)));

  const container = document.createElement('div');
  container.className = 'carousel-hero-slides-container';
  container.append(slides);

  block.replaceChildren(container);

  if (rows.length < 2) return;

  const controls = document.createElement('div');
  controls.className = 'carousel-hero-controls';

  const prev = document.createElement('button');
  prev.type = 'button';
  prev.className = 'carousel-hero-prev';
  prev.setAttribute('aria-label', 'Previous slide');

  const next = document.createElement('button');
  next.type = 'button';
  next.className = 'carousel-hero-next';
  next.setAttribute('aria-label', 'Next slide');

  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'Carousel slide controls');
  const indicators = document.createElement('ol');
  indicators.className = 'carousel-hero-indicators';
  rows.forEach((_, idx) => {
    const li = document.createElement('li');
    li.className = 'carousel-hero-indicator';
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-label', `Show slide ${idx + 1} of ${rows.length}`);
    button.setAttribute('aria-controls', `carousel-hero-${id}-slide-${idx}`);
    li.append(button);
    indicators.append(li);
  });
  nav.append(indicators);

  controls.append(prev, nav, next);
  block.append(controls);

  updateActiveSlide(block, 0);
  bindEvents(block, setupAutoplay(block));
}
