import { createOptimizedPicture } from '../../scripts/aem.js';

function isLinkOnly(el) {
  if (el.tagName === 'A') return true;
  const links = el.querySelectorAll('a');
  return links.length > 0
    && [...links].map((a) => a.textContent).join('').trim() === el.textContent.trim();
}

function buildCard(row) {
  const li = document.createElement('li');
  li.className = 'cards-game-card';

  [...row.children].forEach((cell) => {
    const pictureOnly = cell.querySelector('picture') && !cell.textContent.trim();
    if (pictureOnly && !li.querySelector('.cards-game-card-image')) {
      cell.className = 'cards-game-card-image';
    } else {
      cell.className = 'cards-game-card-body';
    }
    li.append(cell);
  });

  // merge multiple body cells so the tile has a single content box
  const bodies = [...li.querySelectorAll(':scope > .cards-game-card-body')];
  if (bodies.length > 1) {
    bodies.slice(1).forEach((extra) => {
      bodies[0].append(...extra.childNodes);
      extra.remove();
    });
  }

  const body = bodies[0];
  if (!body) return li;

  const children = [...body.children];
  const last = children[children.length - 1];
  let cta = null;
  if (last && isLinkOnly(last) && children.length > 1) {
    cta = last;
    cta.classList.add('cards-game-card-cta');
    const link = cta.tagName === 'A' ? cta : cta.querySelector('a');
    if (link) link.classList.add('button');
  }

  const heading = children.find((el) => /^H[1-6]$/.test(el.tagName));
  if (heading) heading.classList.add('cards-game-card-title');

  // everything between the title and the CTA is the (clamped) description
  const descItems = children.filter((el) => el !== heading && el !== cta);
  if (descItems.length) {
    const desc = document.createElement('div');
    desc.className = 'cards-game-card-description';
    descItems[0].before(desc);
    desc.append(...descItems);
  }

  return li;
}

/**
 * Mobile (< 768px) shows one tile at a time with prev/next and dot controls,
 * matching the source carousel. On larger screens the controls are hidden by CSS.
 */
function buildControls(block, ul) {
  const cards = [...ul.children];
  if (cards.length < 2) return;

  const controls = document.createElement('div');
  controls.className = 'cards-game-controls';

  const makeArrow = (dir, label) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `cards-game-${dir}`;
    btn.setAttribute('aria-label', label);
    btn.innerHTML = '<span class="cards-game-chevron" aria-hidden="true"></span>';
    return btn;
  };
  const prev = makeArrow('prev', 'Previous tile');
  const next = makeArrow('next', 'Next tile');

  const dots = document.createElement('div');
  dots.className = 'cards-game-dots';
  cards.forEach((card, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'cards-game-dot';
    dot.dataset.index = i;
    dot.setAttribute('aria-label', `Show tile ${i + 1} of ${cards.length}`);
    dots.append(dot);
  });

  controls.append(prev, next, dots);
  block.append(controls);

  const current = () => Math.round(ul.scrollLeft / (ul.clientWidth || 1));
  const goTo = (index) => {
    const target = (index + cards.length) % cards.length;
    ul.scrollTo({ left: cards[target].offsetLeft - ul.offsetLeft, behavior: 'smooth' });
  };
  const update = () => {
    const active = current();
    [...dots.children].forEach((dot, i) => {
      const isActive = i === active;
      dot.classList.toggle('active', isActive);
      if (isActive) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
  };

  prev.addEventListener('click', () => goTo(current() - 1));
  next.addEventListener('click', () => goTo(current() + 1));
  dots.addEventListener('click', (e) => {
    const dot = e.target.closest('.cards-game-dot');
    if (dot) goTo(Number(dot.dataset.index));
  });

  let ticking = false;
  ul.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      update();
      ticking = false;
    });
  }, { passive: true });

  update();
}

export default function decorate(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    if (!row.children.length && !row.textContent.trim()) return;
    ul.append(buildCard(row));
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    img.closest('picture').replaceWith(
      createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]),
    );
  });

  block.replaceChildren(ul);
  buildControls(block, ul);
}
