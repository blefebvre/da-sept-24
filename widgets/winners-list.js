import { fetchWinnersList, parseServiceDate, serviceGameId } from '../scripts/alc-data.js';

/*
 * Winners List widget: filterable, paginated list of a game's winners, recreating the
 * "Winners" tab of alc.ca game pages (GameDetailComponent.WinnerList).
 * Data: /services/WinnersListServlet (see scripts/alc-data.js); 10 winners per request,
 * "Load More Winners" requests the next page with offset = winners already shown.
 */

const ALC_ORIGIN = 'https://www.alc.ca';
const UNAVAILABLE = 'Results are unavailable right now.';
const NO_RESULTS = 'Your search returned "0" results';

/** Province filter (values are what the service expects). */
const PROVINCES = [
  { value: 'all', label: 'All Provinces' },
  { value: 'New Brunswick', label: 'New Brunswick' },
  { value: 'Newfoundland', label: 'Newfoundland & Labrador' },
  { value: 'Nova Scotia', label: 'Nova Scotia' },
  { value: 'Prince Edward Island', label: 'Prince Edward Island' },
];

const SORTS = [
  { value: 'recent', label: 'Most Recent' },
  { value: 'alphabetically', label: 'Alphabetically' },
];

/** Service game ids -> display names (used for the game logo alt text). */
const GAME_NAMES = {
  Lotto649: 'Lotto 6/49',
  Atlantic49: 'Atlantic 49',
  LottoMax: 'Lotto Max',
  DailyGrand: 'Daily Grand',
  Tag: 'TAG',
  Bucko: 'Bucko',
  Keno: 'Keno Atlantic',
  PokerLotto: 'Poker Lotto',
  SalsaBingo: 'Salsa Bingo',
};

/**
 * Settings per authored game code: the service game id and the game name.
 * Add an entry to reuse the widget on another lotto page (?game=...).
 */
const GAMES = {
  lotto649: { service: 'Lotto649' },
  atlantic49: { service: 'Atlantic49' },
  lottomax: { service: 'LottoMax' },
  dailygrand: { service: 'DailyGrand' },
};

const SHORT_PROVINCES = {
  'Nova Scotia': 'NS',
  'New Brunswick': 'NB',
  'Prince Edward Island': 'PE',
  PEI: 'PE',
  Newfoundland: 'NL',
  'Newfoundland and Labrador': 'NL',
  'Newfoundland & Labrador': 'NL',
  Alberta: 'AB',
  'British Columbia': 'BC',
  Manitoba: 'MB',
  'Northwest Territories': 'NT',
  Nunavut: 'NU',
  Ontario: 'ON',
  Quebec: 'QC',
  Saskatchewan: 'SK',
  Yukon: 'YT',
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

let widgetCount = 0;

/* ---------- formatting ---------- */

const shortProvince = (province) => SHORT_PROVINCES[province] || province || '';

const place = (city, province) => [city, shortProvince(province)].filter(Boolean).join(', ');

/** "15 Sep. 2026" (Atlantic time), as on the source; returns { text, iso }. */
function formatWinDate(value) {
  const date = parseServiceDate(value);
  if (!date) return null;
  const parts = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric', month: 'numeric', day: 'numeric', timeZone: 'America/Halifax',
  }).formatToParts(date).reduce((acc, p) => ({ ...acc, [p.type]: p.value }), {});
  const month = Number(parts.month);
  return {
    text: `${Number(parts.day)} ${MONTHS[month - 1]}. ${parts.year}`,
    iso: `${parts.year}-${String(month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`,
  };
}

/** Prize box groups: 1000000 -> ["1", "000", "000"], 1234.5 -> ["1", "234", ".50"] */
function prizeGroups(amount) {
  const num = Number(String(amount).replace(/[^\d.]/g, ''));
  if (!amount || Number.isNaN(num)) return [];
  const text = num % 1 ? num.toFixed(2) : String(num);
  const [whole, cents] = text.split('.');
  const groups = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ' ').split(' ');
  return cents ? [...groups, `.${cents}`] : groups;
}

const prizeLabel = (amount) => `$${prizeGroups(amount).join(',').replace(',.', '.')}`;

/** DAM paths ("/content/dam/...jpg" with spaces) -> absolute www.alc.ca URLs */
function damUrl(path) {
  if (!path) return '';
  if (/^https?:\/\//.test(path)) return path;
  return encodeURI(`${ALC_ORIGIN}${path.startsWith('/') ? '' : '/'}${path}`);
}

const gameLogo = (gameName) => `${ALC_ORIGIN}/content/dam/alc/images/static/game-tiles/${gameName}_en.png/_jcr_content/renditions/cq5dam.thumbnail.140.100.png`;

/* ---------- DOM ---------- */

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (value === undefined || value === null || value === false) return;
    if (key === 'className') node.className = value;
    else node.setAttribute(key, value === true ? '' : value);
  });
  children.flat().forEach((child) => {
    if (child === null || child === undefined || child === false || child === '') return;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  });
  return node;
}

function prizeElement(winner) {
  const groups = prizeGroups(winner.cashPrizeAmount);
  if (!groups.length) {
    return winner.nonCashPrize
      ? el('p', { className: 'winners-list-prize-text' }, winner.nonCashPrize)
      : null;
  }
  return el(
    'p',
    { className: 'winners-list-prize' },
    el('span', { className: 'winners-list-sr-only' }, prizeLabel(winner.cashPrizeAmount)),
    el('span', { className: 'winners-list-prize-boxes', 'aria-hidden': 'true' }, groups.map((g) => el('span', {}, g))),
  );
}

function winnerCard(winner) {
  const image = damUrl(winner.primaryImage || winner.featuredImage);
  const date = formatWinDate(winner.winClaimDate || winner.drawDate);
  const game = winner.gameName;
  return el(
    'article',
    { className: 'winners-list-winner' },
    el(
      'div',
      { className: 'winners-list-photo' },
      image ? el('img', {
        src: image, alt: '', loading: 'lazy', width: 132, height: 132,
      }) : null,
    ),
    el(
      'div',
      { className: 'winners-list-info' },
      el('h3', { className: 'winners-list-name' }, winner.winnerName),
      el('p', { className: 'winners-list-location' }, place(winner.winnerCity, winner.winnerProvince)),
      game ? el('img', {
        className: 'winners-list-game', src: gameLogo(game), alt: GAME_NAMES[game] || game, loading: 'lazy', width: 64, height: 40,
      }) : null,
      prizeElement(winner),
    ),
    el(
      'div',
      { className: 'winners-list-retailer' },
      date ? el('p', { className: 'winners-list-date' }, el('time', { datetime: date.iso }, date.text)) : null,
      winner.retailerName || winner.retailerCity ? el(
        'p',
        { className: 'winners-list-retailer-text' },
        el('span', { className: 'winners-list-retailer-label' }, 'Retailer:'),
        ' ',
        el('span', { className: 'winners-list-retailer-name' }, winner.retailerName),
        ' ',
        el('span', { className: 'winners-list-retailer-place' }, place(winner.retailerCity, winner.retailerProvince || winner.winnerProvince)),
      ) : null,
    ),
  );
}

const options = (list) => list.map(({ value, label }) => el('option', { value }, label));

/**
 * Decorates the winners list widget.
 * @param {Element} widget The widget element (dataset.game = authored game code)
 */
export default function decorate(widget) {
  widgetCount += 1;
  const idBase = `winners-list-${widgetCount}`;
  const code = String(widget.dataset.game || 'lotto649').toLowerCase();
  const game = (GAMES[code] && GAMES[code].service) || serviceGameId(code);

  const filters = widget.querySelector('.winners-list-filters');
  const toggle = widget.querySelector('.winners-list-filters-toggle');
  const form = widget.querySelector('.winners-list-form');
  const list = widget.querySelector('.winners-list-items');
  const message = widget.querySelector('.winners-list-message');
  const more = widget.querySelector('.winners-list-more');
  const moreButton = widget.querySelector('.winners-list-more-button');
  const status = widget.querySelector('.winners-list-status');

  // unique ids for labels and the mobile filter toggle
  form.id = `${idBase}-filters`;
  toggle.setAttribute('aria-controls', form.id);
  form.querySelectorAll('[data-id]').forEach((field) => { field.id = `${idBase}-${field.dataset.id}`; });
  form.querySelectorAll('label[data-for]').forEach((label) => { label.htmlFor = `${idBase}-${label.dataset.for}`; });
  form.elements.province.append(...options(PROVINCES));
  form.elements.sort.append(...options(SORTS));

  const state = { count: 0, total: 0, requestId: 0 };

  const setMessage = (text) => {
    message.textContent = text || '';
    message.hidden = !text;
  };

  /** Fetches a page; `reset` starts a new search from offset 0. */
  const search = async (reset) => {
    state.requestId += 1;
    const current = state.requestId;
    if (reset) {
      state.count = 0;
      state.total = 0;
      list.replaceChildren();
      setMessage('');
      more.hidden = true;
    }
    list.setAttribute('aria-busy', 'true');
    moreButton.disabled = true;
    const province = form.elements.province.value;
    const response = await fetchWinnersList(game, {
      sort: form.elements.sort.value,
      name: form.elements.name.value.trim(),
      offset: state.count,
      province: province === 'all' ? undefined : province,
    });
    if (current !== state.requestId) return;
    list.removeAttribute('aria-busy');
    moreButton.disabled = false;

    const data = response && response['winners-list'];
    if (!data || !Array.isArray(data.winners)) {
      setMessage(UNAVAILABLE);
      status.textContent = UNAVAILABLE;
      // keep "Load More" as a retry when a later page fails
      more.hidden = state.count === 0;
      return;
    }
    setMessage('');
    list.append(...data.winners.map(winnerCard));
    state.count += data.winners.length;
    state.total = Number(data.totalResults) || state.count;
    if (!state.count) setMessage(NO_RESULTS);
    more.hidden = state.count >= state.total || data.winners.length === 0;
    status.textContent = state.count
      ? `Showing ${state.count} of ${state.total} winners`
      : NO_RESULTS;
  };

  form.elements.province.addEventListener('change', () => search(true));
  form.elements.sort.addEventListener('change', () => search(true));
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    search(true);
  });
  moreButton.addEventListener('click', () => search(false));
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', open);
    filters.classList.toggle('is-open', open);
  });

  search(true);
}
