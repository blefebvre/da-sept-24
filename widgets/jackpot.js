import { fetchLatestWinningNumbers, parseServiceDate, formatDrawDate } from '../scripts/alc-data.js';
import { getGameConfig } from './lotto-games.js';

const DATE_UNAVAILABLE = 'date unavailable';
const AMOUNT_UNAVAILABLE = 'The jackpot amount is unavailable right now.';

const formatMillions = (value) => `${Math.round((value / 1e6) * 10) / 10}M`;
const formatDollars = (value) => `$${Math.round(value).toLocaleString('en-CA')}`;

function h(tag, className, ...children) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  el.append(...children);
  return el;
}

/** "$14 | 000 | 000": one white box per thousands group, "$" raised in the first one. */
function renderAmount(container, amount) {
  container.classList.toggle('is-unavailable', !amount);
  if (!amount) {
    container.replaceChildren(h('span', 'jackpot-message', AMOUNT_UNAVAILABLE));
    return;
  }
  const groups = String(Math.round(amount)).replace(/\B(?=(\d{3})+(?!\d))/g, ',').split(',');
  const digits = h('span', 'jackpot-digits');
  digits.setAttribute('aria-hidden', 'true');
  groups.forEach((group, i) => {
    const box = h('span', 'jackpot-group');
    if (i === 0) box.append(h('span', 'jackpot-currency', '$'));
    box.append(group);
    digits.append(box);
  });
  container.replaceChildren(h('span', 'jackpot-sr', formatDollars(amount)), digits);
}

/** "GOLD BALL JACKPOT" with a gold ball standing in for the first "O". */
function renderGoldBallLabel(el, label) {
  const at = label.indexOf('O');
  const visual = h('span', '');
  visual.setAttribute('aria-hidden', 'true');
  if (at >= 0) {
    visual.append(`${label.slice(0, at)} `, h('span', 'jackpot-goldball-o'), ` ${label.slice(at + 1)}`);
  } else {
    visual.append(label);
  }
  el.replaceChildren(visual, h('span', 'jackpot-sr', label));
}

/**
 * Jackpot widget: next draw date, classic jackpot ribbon, Gold Ball jackpot amount for `data-game`.
 * @param {Element} widget The widget element
 */
export default async function decorate(widget) {
  const game = widget.dataset.game || 'lotto649';
  const config = getGameConfig(game);
  const q = (selector) => widget.querySelector(selector);
  if (!q('.jackpot-next')) return;

  q('.jackpot-game').textContent = config.name;

  const classic = q('.jackpot-classic');
  if (config.classicJackpot) {
    q('.jackpot-classic-label').textContent = config.classicJackpotLabel || 'CLASSIC JACKPOT';
    q('.jackpot-classic-amount').textContent = formatMillions(config.classicJackpot);
  } else {
    classic.remove();
  }

  const goldball = q('.jackpot-goldball');
  if (config.goldBallJackpotLabel) {
    renderGoldBallLabel(q('.jackpot-goldball-jackpot'), config.goldBallJackpotLabel);
    q('.jackpot-goldball-guaranteed').textContent = config.guaranteedPrizeLabel || '';
  } else {
    goldball.remove();
  }

  const data = await fetchLatestWinningNumbers(game);
  const next = data && data.next_draw;
  const nextDate = next && parseServiceDate(next.draw_date);
  const amount = next && Number(next.jackpot) > 0 ? Number(next.jackpot) : 0;

  const dateEl = q('.jackpot-next-date');
  dateEl.textContent = nextDate ? formatDrawDate(nextDate) : DATE_UNAVAILABLE;
  dateEl.classList.toggle('is-unavailable', !nextDate);

  if (config.classicJackpot && next && Number(next.classic_jackpot) > 0) {
    q('.jackpot-classic-amount').textContent = formatMillions(Number(next.classic_jackpot));
  }

  const amountEl = q('.jackpot-amount');
  renderAmount(amountEl, amount);
  amountEl.removeAttribute('aria-busy');

  // no standard balls left: no guaranteed alternative to the Gold Ball jackpot ("maxjackpot")
  if (goldball.isConnected && next && next.standard_balls === 0) goldball.classList.add('is-max');
}
