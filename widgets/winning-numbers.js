import {
  fetchWinningNumbers,
  fetchLatestWinningNumbers,
  parseServiceDate,
  formatDrawDate,
  serviceDateParam,
} from '../scripts/alc-data.js';
import { getGameConfig, ALC_ASSETS } from './lotto-games.js';

const UNAVAILABLE = 'Results are unavailable right now.';
const UNAVAILABLE_SHORT = 'Unavailable right now';
// how many past draws the date dropdown offers (older draws stay reachable via the calendar)
const RECENT_DRAWS = 52;
const DAY_MS = 86400000;

let idCounter = 0;
const nextId = (prefix) => {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
};

/* Draw dates are handled as Atlantic-time calendar days ("YYYY-MM-DD"). */
const toUtcDay = (ymd) => {
  const [y, m, d] = ymd.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};
const fromUtcDay = (ms) => new Date(ms).toISOString().slice(0, 10);
// a Date inside that calendar day in Atlantic time (for formatting and events)
const dayToDate = (ymd) => new Date(toUtcDay(ymd) + 16 * 3600000);

/** Latest draw day on or before `ymd`. */
function drawOnOrBefore(ymd, drawDays) {
  let day = toUtcDay(ymd);
  for (let i = 0; i < 7; i += 1) {
    if (drawDays.includes(new Date(day).getUTCDay())) return fromUtcDay(day);
    day -= DAY_MS;
  }
  return ymd;
}

/** The `count` most recent draw days, newest first, ending at `latest`. */
function recentDrawDays(latest, drawDays, count) {
  const days = [];
  let day = toUtcDay(latest);
  while (days.length < count) {
    if (drawDays.includes(new Date(day).getUTCDay())) days.push(fromUtcDay(day));
    day -= DAY_MS;
  }
  return days;
}

/** `?date=YYYY-MM-DD` (or the source site's MM/DD/YYYY) from the page URL. */
function requestedDate() {
  const value = new URLSearchParams(window.location.search).get('date') || '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const us = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return us ? `${us[3]}-${us[1]}-${us[2]}` : null;
}

const isDraw = (data) => !!(data && data.draw && Array.isArray(data.draw.winning_numbers)
  && data.draw.winning_numbers.length);

/** "4870629901" -> "48706299-01" (as on the source site). */
const formatPrizeNumber = (value) => {
  const s = String(value || '');
  return s.length > 2 ? `${s.slice(0, -2)}-${s.slice(-2)}` : s;
};

const formatMillions = (value) => `${Math.round((value / 1e6) * 10) / 10}M`;

function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (value === undefined || value === null || value === false) return;
    if (key === 'class') el.className = value;
    else el.setAttribute(key, value);
  });
  el.append(...children.flat().filter((c) => c !== undefined && c !== null && c !== false));
  return el;
}

/** Label + numbered balls; without numbers the unavailable message takes their place. */
function ballGroup(kind, label, numbers) {
  const id = nextId('winning-numbers-label');
  const group = h(
    'div',
    { class: `winning-numbers-group winning-numbers-${kind}` },
    h('span', { class: 'winning-numbers-label', id }, label),
  );
  if (numbers && numbers.length) {
    group.append(h(
      'ol',
      { class: 'winning-numbers-balls', 'aria-labelledby': id },
      numbers.map((n) => h('li', { class: 'winning-numbers-ball' }, String(n))),
    ));
  } else if (kind === 'bonus') {
    group.append(h('span', { class: 'winning-numbers-ball is-empty', 'aria-hidden': 'true' }));
  } else {
    group.append(h('p', { class: 'winning-numbers-unavailable' }, UNAVAILABLE));
  }
  return group;
}

function tagBlock(tag) {
  return h(
    'div',
    { class: 'winning-numbers-tag' },
    h('span', { class: 'winning-numbers-tag-logo', role: 'img', 'aria-label': 'TAG' }),
    tag
      ? h('span', { class: 'winning-numbers-tag-number' }, String(tag))
      : h('span', { class: 'winning-numbers-tag-number is-empty' }, h('span', { 'aria-hidden': 'true' }, '–'), h('span', { class: 'winning-numbers-sr' }, UNAVAILABLE_SHORT)),
  );
}

function drawRow(config, data) {
  const ok = isDraw(data);
  return h(
    'div',
    { class: 'winning-numbers-row' },
    ballGroup('main', config.mainLabel, ok && data.draw.winning_numbers),
    ballGroup('bonus', 'BONUS', ok && data.draw.bonus_number && [data.draw.bonus_number]),
    config.tag && tagBlock(ok && data.draw.tag),
  );
}

/** Plain guaranteed prize draw: label + prize number. */
function guaranteedNumber(label, number) {
  return h(
    'div',
    { class: 'winning-numbers-guaranteed' },
    h('span', { class: 'winning-numbers-label' }, label),
    h('p', { class: `winning-numbers-guaranteed-number${number ? '' : ' is-empty'}` }, number || UNAVAILABLE_SHORT),
  );
}

/** Lotto 6/49 Gold Ball draw: white/gold ball with the prize, ribbon with the drawn number. */
function goldBallDraw(config, data) {
  const guaranteed = data && data.guaranteed_draws && data.guaranteed_draws[0];
  const payout = guaranteed && guaranteed.prize_payouts && guaranteed.prize_payouts[0];
  const gold = !!(data && data.jackpot_ball_drawn);
  const colour = gold ? 'Gold' : 'White';
  return h(
    'div',
    { class: 'winning-numbers-guaranteed is-goldball' },
    h('span', { class: 'winning-numbers-label' }, config.guaranteedLabel),
    h(
      'div',
      { class: 'winning-numbers-gold' },
      h(
        'span',
        { class: `winning-numbers-gold-ball ${gold ? 'is-gold' : 'is-white'}` },
        h('img', {
          src: gold ? ALC_ASSETS.goldBall : ALC_ASSETS.whiteBall, alt: '', width: 49, height: 60, loading: 'lazy',
        }),
        payout && payout.prize_value && h(
          'span',
          { class: 'winning-numbers-gold-amount' },
          h('span', { class: 'winning-numbers-gold-currency' }, '$'),
          formatMillions(payout.prize_value),
        ),
      ),
      h(
        'p',
        { class: `winning-numbers-gold-banner${guaranteed ? '' : ' is-empty'}` },
        guaranteed ? `${colour} Ball - ${formatPrizeNumber(guaranteed.winning_number)}` : UNAVAILABLE_SHORT,
      ),
    ),
  );
}

function renderResults(container, config, data) {
  const ok = isDraw(data);
  const parts = [drawRow(config, data)];
  if (config.guaranteedLabel) {
    const guaranteed = ok && data.guaranteed_draws && data.guaranteed_draws[0];
    const payout = guaranteed && guaranteed.prize_payouts && guaranteed.prize_payouts[0];
    // draws before the Gold Ball era carry a classic guaranteed prize number instead
    const goldBall = config.goldBall && (!guaranteed || (payout && /hero/i.test(payout.type)));
    parts.push(goldBall
      ? goldBallDraw(config, ok ? data : null)
      : guaranteedNumber('GUARANTEED PRIZE DRAW:', guaranteed && formatPrizeNumber(guaranteed.winning_number)));
  }
  container.replaceChildren(...parts);
}

function renderSecondary(panel, config, data) {
  const ok = isDraw(data);
  const guaranteed = ok && data.guaranteed_draws && data.guaranteed_draws[0];
  panel.replaceChildren(
    drawRow({ ...config, tag: false }, data),
    h(
      'div',
      { class: 'winning-numbers-extra' },
      config.guaranteedLabel
        && guaranteedNumber(config.guaranteedLabel, guaranteed && guaranteed.winning_number),
      config.tag && tagBlock(ok && data.draw.tag),
    ),
  );
}

/**
 * Collapsible companion game (e.g. Atlantic 49) for the selected date; fetched on first expand.
 * @returns {Function} called with the new date whenever the selected draw changes
 */
function setupSecondary(widget, config, getDate) {
  const section = widget.querySelector('.winning-numbers-secondary');
  const secondary = config.secondary && getGameConfig(config.secondary);
  if (!section || !secondary) {
    if (section) section.remove();
    return () => {};
  }
  const toggle = section.querySelector('.winning-numbers-secondary-toggle');
  const panel = section.querySelector('.winning-numbers-secondary-panel');
  const logo = section.querySelector('.winning-numbers-secondary-logo');
  if (secondary.logo) {
    logo.src = secondary.logo;
    logo.alt = secondary.name;
  } else {
    logo.replaceWith(h('span', { class: 'winning-numbers-secondary-name' }, secondary.name));
  }
  panel.id = nextId('winning-numbers-secondary');
  panel.setAttribute('aria-label', `${secondary.name} winning numbers`);
  toggle.setAttribute('aria-controls', panel.id);
  section.hidden = false;

  const cache = new Map();
  let shownFor = null;
  const load = async () => {
    const ymd = getDate();
    if (!ymd || shownFor === ymd) return;
    shownFor = ymd;
    panel.setAttribute('aria-busy', 'true');
    let data = cache.get(ymd);
    if (data === undefined) {
      data = await fetchWinningNumbers(config.secondary, ymd);
      if (isDraw(data)) cache.set(ymd, data);
    }
    if (getDate() !== ymd) return; // a newer date was picked meanwhile
    if (!isDraw(data)) shownFor = null; // retry on next expand / date change
    renderSecondary(panel, secondary, data);
    panel.removeAttribute('aria-busy');
  };

  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open));
    section.classList.toggle('is-open', open);
    panel.hidden = !open;
    if (open) load();
  });

  return () => {
    if (!panel.hidden) load();
  };
}

/**
 * Winning numbers widget: latest (or chosen) draw for `data-game`, date picker, companion game.
 * Dispatches `alc:drawchange` on document with { game, date, data } after every draw load.
 * @param {Element} widget The widget element
 */
export default async function decorate(widget) {
  const game = widget.dataset.game || 'lotto649';
  const config = getGameConfig(game);
  const card = widget.querySelector('.winning-numbers-card');
  if (!card) return;

  const logo = card.querySelector('.winning-numbers-logo');
  if (config.logo) {
    logo.src = config.logo;
    logo.alt = config.name;
  } else {
    logo.remove();
  }

  const select = card.querySelector('.winning-numbers-select');
  const calendar = card.querySelector('.winning-numbers-calendar');
  const picker = card.querySelector('.winning-numbers-picker');
  const results = card.querySelector('.winning-numbers-results');
  const status = card.querySelector('.winning-numbers-status');
  const drawDays = config.drawDays || [0, 1, 2, 3, 4, 5, 6];

  let current = null;
  let latestDay = null;
  let request = 0;
  const cache = new Map();
  const secondaryChanged = setupSecondary(widget, config, () => current);

  const option = (ymd) => h('option', { value: ymd }, formatDrawDate(dayToDate(ymd)));
  const ensureOption = (ymd) => {
    const options = [...select.options];
    if (options.some((o) => o.value === ymd)) return;
    const before = options.find((o) => o.value < ymd);
    select.insertBefore(option(ymd), before || null);
  };

  const show = async (ymd, { announce = false, preloaded } = {}) => {
    request += 1;
    const mine = request;
    current = ymd;
    ensureOption(ymd);
    select.value = ymd;
    picker.value = ymd;
    results.setAttribute('aria-busy', 'true');

    let data = preloaded !== undefined ? preloaded : cache.get(ymd);
    if (data === undefined) {
      data = await fetchWinningNumbers(game, ymd);
      if (isDraw(data)) cache.set(ymd, data);
    }
    if (mine !== request) return;

    const ok = isDraw(data);
    renderResults(results, config, ok ? data : null);
    results.removeAttribute('aria-busy');
    if (announce) {
      status.textContent = ok
        ? `Showing winning numbers for ${formatDrawDate(dayToDate(ymd))}.`
        : UNAVAILABLE;
    }
    secondaryChanged(ymd);
    const date = (ok && parseServiceDate(data.draw_date)) || dayToDate(ymd);
    document.dispatchEvent(new CustomEvent('alc:drawchange', {
      detail: { game, date, data: ok ? data : null },
    }));
  };

  select.addEventListener('change', () => show(select.value, { announce: true }));
  picker.addEventListener('change', () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(picker.value)) return;
    const picked = latestDay && picker.value > latestDay ? latestDay : picker.value;
    const day = drawOnOrBefore(picked, drawDays);
    if (day === current) picker.value = day;
    else show(day, { announce: true });
  });
  calendar.addEventListener('click', () => {
    if (typeof picker.showPicker === 'function') {
      try {
        picker.showPicker();
        return;
      } catch {
        // fall back to showing the native input
      }
    }
    card.classList.add('is-picker-visible');
    picker.tabIndex = 0;
    picker.focus();
  });

  // chrome renders while the latest draw loads (messages stay hidden while aria-busy)
  renderResults(results, config, null);

  const latest = await fetchLatestWinningNumbers(game);
  const latestDate = isDraw(latest) && parseServiceDate(latest.draw_date);
  if (latestDate) {
    latestDay = serviceDateParam(latestDate);
    cache.set(latestDay, latest);
  } else {
    // no data: offer the draw schedule up to the last draw day before today
    const today = serviceDateParam(new Date());
    latestDay = drawOnOrBefore(fromUtcDay(toUtcDay(today) - DAY_MS), drawDays);
  }
  select.replaceChildren(...recentDrawDays(latestDay, drawDays, RECENT_DRAWS).map(option));
  picker.max = latestDay;

  const asked = requestedDate();
  if (asked && asked < latestDay) {
    await show(drawOnOrBefore(asked, drawDays));
  } else {
    await show(latestDay, { preloaded: latestDate ? latest : null });
  }
}
