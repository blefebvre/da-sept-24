import {
  fetchWinningNumbers,
  parseServiceDate,
  serviceDateParam,
  serviceGameId,
} from '../scripts/alc-data.js';

/*
 * Prize Payout widget: collapsible payout tables for a lotto game and its secondary games,
 * recreating the "Prize Payout" tab of alc.ca game pages (game-detail-draw component).
 * Data: /services/WinningNumbersServlet (see scripts/alc-data.js). Follows the draw chosen in
 * the winning-numbers widget through the `alc:drawchange` event.
 */

const UNAVAILABLE = 'Results are unavailable right now.';
const TILES = 'https://www.alc.ca/content/dam/alc/images/static/game-tiles';
const tile = (id) => `${TILES}/${id}_en.png/_jcr_content/renditions/cq5dam.thumbnail.319.319.png`;

/**
 * Payout rules per service game (source: ALC.constants.topGameTiers / gameCosts).
 * A prize equal to the ticket price (or 0) is shown as "Free Ticket"; top tiers list the
 * region breakdown ("1 - Quebec") instead of the prize count.
 */
const PAYOUT_RULES = {
  Lotto649: {
    ticketPrice: 3,
    topTiers: ['Lotto649_6of6', 'Lotto649_5of6Bonus', 'Atlantic49_6of6', 'Atlantic49_5of6Bonus'],
  },
  Atlantic49: { topTiers: ['Atlantic49_6of6', 'Atlantic49_5of6Bonus'] },
  Tag: { topTiers: ['TAG_All6', 'TAG_Last5'] },
  LottoMax: { ticketPrice: 5, topTiers: ['LottoMax_7of7', 'LottoMax_6of7Bonus'] },
  DailyGrand: { ticketPrice: 3, topTiers: ['DailyGrand_5of5GrandNumber', 'DailyGrand_5of5'] },
};

/**
 * Panels per authored game code. `source` is the game whose draw feeds the panel,
 * `type` is `draw` (main payouts + bonus/guaranteed draws) or `tag` (TAG add-on).
 */
const GAMES = {
  lotto649: {
    panels: [
      {
        key: 'main',
        source: 'lotto649',
        type: 'draw',
        logo: {
          src: tile('Lotto649'), alt: 'Lotto 6/49', width: 71, height: 45,
        },
        // jackpot (Gold Ball) draws label the main table "Classic Draw"
        jackpotBallLabel: 'Classic Draw',
      },
      {
        key: 'tag',
        source: 'lotto649',
        type: 'tag',
        logo: {
          src: tile('TAG'), alt: 'TAG', width: 44, height: 33, inset: 10,
        },
      },
      {
        key: 'atlantic49',
        source: 'atlantic49',
        type: 'draw',
        logo: {
          src: tile('Atlantic49'), alt: 'Atlantic 49', width: 62, height: 25,
        },
      },
    ],
  },
  atlantic49: {
    panels: [
      {
        key: 'main',
        source: 'atlantic49',
        type: 'draw',
        logo: {
          src: tile('Atlantic49'), alt: 'Atlantic 49', width: 62, height: 25,
        },
      },
      {
        key: 'tag',
        source: 'atlantic49',
        type: 'tag',
        logo: {
          src: tile('TAG'), alt: 'TAG', width: 44, height: 33, inset: 10,
        },
      },
    ],
  },
};

let widgetCount = 0;

/* ---------- formatting (source: ALC.common.priceFormat / numberFormat / formatPrizeNumber) */

const groupDigits = (value) => String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/** "$5,000,000.00"; non-numeric values (e.g. "$1M/Yr for Life") are shown as-is. */
export function formatMoney(value) {
  if (value === null || value === undefined || value === '') return '';
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  const fixed = Math.abs(num).toFixed(2);
  return `${num < 0 ? '-' : ''}$${groupDigits(fixed)}`;
}

const formatCount = (value) => groupDigits(Number(value) || 0);

/** "4870629901" -> "48706299-01" */
const formatPrizeNumber = (value) => {
  const s = String(value || '');
  return s.length > 2 ? `${s.slice(0, -2)}-${s.slice(-2)}` : s;
};

/** "BritishColumbia" -> "British Columbia"; online/retail breakdowns -> "www.alc.ca, NL" */
function locationLabel({ region, city, province } = {}) {
  if (region) return region.replace(/([a-z])([A-Z])/g, '$1 $2');
  if (city && province) return `${city}, ${province}`;
  return province || '';
}

/** "Lotto649_5of6Bonus" -> "5/6 + B", "TAG_Last5" -> "Last 5 digits" */
function matchLabel(builder, type) {
  let name = String(type || '');
  if (name.includes('_')) name = name.split('_').pop();
  if (builder === 'Tag') return name.replace(/(\d+)/g, ' $1 digits').trim();
  if (builder === 'DailyGrand') {
    if (name === 'GrandNumber') name = `0of5${name}`;
    return name.replace('of', '/').replace('GrandNumber', ' + GN');
  }
  return name.replace('of', '/').replace('Bonus', ' + B');
}

/* ---------- data model (source: ALC.models.GamePayoutBuilder / GameDrawBuilder) ---------- */

function breakdownPrizes(payout) {
  return [...(payout.region_breakdowns || []), ...(payout.atlantic_breakdowns || [])]
    .filter((b) => b && b.region !== 'Atlantic')
    .map((b) => ({ count: b.number_of_prizes, location: locationLabel(b) }));
}

function payoutRow(builder, payout) {
  const rules = PAYOUT_RULES[builder] || {};
  const value = Number(payout.prize_value);
  const isFreeTicket = value === 0
    || (rules.ticketPrice !== undefined && value === rules.ticketPrice);
  let prizeValue = payout.prize_value;
  if (builder === 'DailyGrand' && payout.number_of_prizes < 2 && payout.guaranteed_prize_english) {
    prizeValue = payout.guaranteed_prize_english;
  }
  return {
    match: matchLabel(builder, payout.type),
    count: payout.number_of_prizes || 0,
    prizes: breakdownPrizes(payout),
    isTopTier: (rules.topTiers || []).includes(payout.type),
    isFreeTicket,
    prizeValue,
  };
}

const isHeroDraw = (d) => d && d.prize_payouts && d.prize_payouts[0] && d.prize_payouts[0].type === 'HERO';

/** Groups guaranteed draws by prize value (highest first). */
function guaranteedGroups(draws) {
  const groups = new Map();
  draws.forEach((draw) => {
    const first = draw.prize_payouts && draw.prize_payouts[0];
    if (!first) return;
    const amount = Number(first.prize_value);
    if (!groups.has(amount)) groups.set(amount, []);
    groups.get(amount).push(draw);
  });
  return [...groups.entries()].sort((a, b) => b[0] - a[0]).map(([amount, list]) => ({
    amount,
    winnerCount: list.length,
    items: list.flatMap((draw) => draw.prize_payouts.map((payout) => {
      const breakdown = payout.region_breakdowns !== null && payout.region_breakdowns !== undefined
        ? (payout.atlantic_breakdowns || payout.region_breakdowns)[0]
        : (payout.atlantic_breakdowns || [])[0];
      return {
        winningNumber: draw.winning_number,
        isHero: isHeroDraw(draw),
        location: breakdown ? locationLabel(breakdown) : '',
        prizeValue: payout.prize_value,
      };
    })),
  }));
}

const isValidDraw = (data) => !!(data && data.draw && Array.isArray(data.draw.prize_payouts));

/* ---------- DOM helpers ---------- */

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (value === undefined || value === null || value === false) return;
    if (key === 'className') node.className = value;
    else node.setAttribute(key, value === true ? '' : value);
  });
  children.flat().forEach((child) => {
    if (child === null || child === undefined || child === false) return;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  });
  return node;
}

function table(caption, headers, rows, { hiddenCaption = false, className } = {}) {
  return el(
    'table',
    { className: ['prize-payout-table', className].filter(Boolean).join(' ') },
    el('caption', { className: hiddenCaption ? 'prize-payout-sr-only' : 'prize-payout-caption' }, caption),
    el('thead', {}, el('tr', {}, headers.map((h) => el('th', { scope: 'col' }, h)))),
    el('tbody', {}, rows),
  );
}

/** "Number of Prizes" cell: region breakdown lines for top tiers, otherwise the total. */
function countCell(row) {
  if (row.isTopTier && row.prizes.length) {
    return el('td', { className: 'prize-payout-count' }, row.prizes.map((p) => el('p', {}, p.location ? `${p.count} - ${p.location}` : p.count)));
  }
  return el('td', { className: 'prize-payout-count' }, el('p', {}, formatCount(row.count)));
}

const valueCell = (row) => el('td', {}, row.isFreeTicket ? 'Free Ticket' : formatMoney(row.prizeValue));

function mainTable(builder, draw, caption) {
  const rows = draw.prize_payouts
    .filter((p) => !String(p.type).includes('Twist'))
    .map((p) => payoutRow(builder, p))
    .map((row) => el('tr', {}, el('th', { scope: 'row' }, row.match), countCell(row), valueCell(row)));
  return table(caption, ['Match', 'Number of Prizes', 'Prize Amount'], rows);
}

function bonusDrawsTable(data) {
  const payoutsOf = (promo) => promo.prize_payouts || [];
  const rows = data.promotional_draws.flatMap((promo) => payoutsOf(promo).map((payout) => {
    const prizes = breakdownPrizes(payout);
    const numbers = [].concat(promo.winning_numbers || promo.winning_number || []).join(',');
    return el(
      'tr',
      {},
      el('th', { scope: 'row' }, numbers),
      el('td', {}, prizes.length
        ? prizes.map((p) => el('p', {}, p.location ? `${p.count} - ${p.location}` : p.count))
        : el('p', {}, payout.number_of_prizes || 0)),
      el('td', {}, formatMoney(payout.prize_value)),
    );
  }));
  return table('Bonus Draws', ['Winning Numbers', 'Number of Prizes', 'Value'], rows, { className: 'prize-payout-secondary' });
}

function guaranteedTable(data, idBase) {
  const jackpotBall = data.guaranteed_draws.some(isHeroDraw);
  const rows = [];
  if (jackpotBall) {
    const balls = (Number(data.standard_balls) || 0) + (Number(data.jackpot_balls) || 0);
    rows.push(el('tr', { className: 'prize-payout-summary' }, el('td', { colspan: 3 }, `There were ${balls} balls in the Gold Ball Jackpot Draw`)));
  }
  guaranteedGroups(data.guaranteed_draws).forEach((group, gi) => {
    const collapsible = group.items.length > 1;
    const rowIds = group.items.map((_, i) => `${idBase}-g${gi}-${i}`);
    if (!jackpotBall || group.winnerCount > 1) {
      const label = jackpotBall ? 'Additional Draws - Cash' : 'Main Guaranteed Draw - Cash';
      const winners = `${group.winnerCount} ${group.winnerCount > 1 ? 'Winners' : 'Winner'}`;
      const toggle = collapsible
        ? el('button', {
          type: 'button', className: 'prize-payout-show-all', 'aria-expanded': 'false', 'aria-controls': rowIds.join(' '),
        }, 'Show All')
        : null;
      rows.push(el(
        'tr',
        { className: 'prize-payout-summary' },
        el('td', { colspan: 3 }, el(
          'div',
          { className: 'prize-payout-summary-inner' },
          el('span', { className: 'prize-payout-summary-title' }, `${label} ${formatMoney(group.amount)}`),
          el('span', { className: 'prize-payout-summary-count' }, winners),
          toggle,
        )),
      ));
    }
    group.items.forEach((item, i) => {
      const number = el('th', { scope: 'row', className: 'prize-payout-winning-number' }, formatPrizeNumber(item.winningNumber));
      if (item.isHero) number.append(el('br'), data.jackpot_ball_drawn ? 'GOLD BALL' : 'WHITE BALL');
      rows.push(el(
        'tr',
        { id: rowIds[i], hidden: collapsible },
        number,
        el('td', {}, item.location),
        el('td', {}, formatMoney(item.prizeValue)),
      ));
    });
  });
  return table(
    jackpotBall ? 'Gold Ball Draw' : 'GUARANTEED PRIZE DRAWS',
    ['Winning Number', 'Location', 'Value'],
    rows,
    { className: 'prize-payout-secondary' },
  );
}

function renderDraw(body, panel, data) {
  const builder = data.game || serviceGameId(panel.source);
  const jackpotBall = (data.guaranteed_draws || []).some(isHeroDraw);
  const caption = jackpotBall && panel.jackpotBallLabel ? panel.jackpotBallLabel : 'Main Draw';
  body.append(mainTable(builder, data.draw, caption));
  if (data.promotional_draws && data.promotional_draws.length) body.append(bonusDrawsTable(data));
  if (data.guaranteed_draws && data.guaranteed_draws.length) {
    body.append(guaranteedTable(data, body.id));
  }
}

function renderTag(body, panel, data) {
  const { tag = '', tag_prize_payouts: payouts } = data.draw;
  if (!Array.isArray(payouts) || !payouts.length) {
    body.append(el('p', { className: 'prize-payout-unavailable' }, UNAVAILABLE));
    return;
  }
  const rows = payouts.map((payout, i) => {
    const row = payoutRow('Tag', payout);
    return el(
      'tr',
      {},
      el('th', { scope: 'row' }, row.match),
      el('td', {}, String(tag).substring(i)),
      countCell(row),
      valueCell(row),
    );
  });
  body.append(table(`${panel.logo.alt} prize payout`, ['Match', 'Tag Numbers', 'Number of Prizes', 'Prize Amount'], rows, { hiddenCaption: true }));
}

function renderPanel(entry, data) {
  const { body, panel } = entry;
  body.replaceChildren();
  body.removeAttribute('aria-busy');
  if (!isValidDraw(data)) {
    body.append(el('p', { className: 'prize-payout-unavailable' }, UNAVAILABLE));
    return;
  }
  if (panel.type === 'tag') renderTag(body, panel, data);
  else renderDraw(body, panel, data);
}

/* ---------- panels ---------- */

function setExpanded(entry, expanded) {
  entry.button.setAttribute('aria-expanded', expanded);
  entry.body.hidden = !expanded;
}

function buildPanel(panel, idBase) {
  const bodyId = `${idBase}-${panel.key}`;
  const { logo } = panel;
  const img = el('img', {
    className: 'prize-payout-logo',
    src: logo.src,
    alt: logo.alt,
    width: logo.width,
    height: logo.height,
    loading: 'lazy',
  });
  img.style.height = `${logo.height}px`;
  if (logo.inset) img.style.marginInline = `${logo.inset}px`;
  const button = el(
    'button',
    {
      type: 'button', className: 'prize-payout-trigger', 'aria-expanded': 'false', 'aria-controls': bodyId,
    },
    img,
    el('span', { className: 'prize-payout-title' }, 'Prize Payout'),
  );
  const body = el('div', {
    className: 'prize-payout-body', id: bodyId, role: 'region', 'aria-label': `${logo.alt} prize payout`, 'aria-busy': 'true', hidden: true,
  });
  const section = el(
    'div',
    { className: `prize-payout-panel prize-payout-panel-${panel.key}` },
    el('h3', { className: 'prize-payout-heading' }, button),
    body,
  );
  return {
    panel, section, button, body,
  };
}

function print(widget) {
  const cleanup = () => {
    document.body.classList.remove('prize-payout-printing');
    widget.classList.remove('is-printing');
  };
  document.body.classList.add('prize-payout-printing');
  widget.classList.add('is-printing');
  window.addEventListener('afterprint', cleanup, { once: true });
  window.print();
}

function drawDateParam(data) {
  const date = isValidDraw(data) ? parseServiceDate(data.draw_date) : null;
  return date ? serviceDateParam(date) : undefined;
}

/**
 * Decorates the prize payout widget.
 * @param {Element} widget The widget element (dataset.game = authored game code)
 */
export default function decorate(widget) {
  widgetCount += 1;
  const idBase = `prize-payout-${widgetCount}`;
  const game = String(widget.dataset.game || 'lotto649').toLowerCase();
  const config = GAMES[game] || GAMES.lotto649;
  const container = widget.querySelector('.prize-payout-panels') || widget.appendChild(el('div', { className: 'prize-payout-panels' }));

  const entries = config.panels.map((panel) => buildPanel(panel, idBase));
  container.replaceChildren(...entries.map((e) => e.section));

  entries.forEach((entry) => {
    entry.button.addEventListener('click', () => {
      setExpanded(entry, entry.button.getAttribute('aria-expanded') !== 'true');
    });
  });
  widget.querySelector('.prize-payout-expand-all')?.addEventListener('click', () => entries.forEach((e) => setExpanded(e, true)));
  widget.querySelector('.prize-payout-collapse-all')?.addEventListener('click', () => entries.forEach((e) => setExpanded(e, false)));
  widget.querySelector('.prize-payout-print')?.addEventListener('click', () => print(widget));

  // "Show All" / "Hide All" for guaranteed draws with several winners
  container.addEventListener('click', (e) => {
    const toggle = e.target.closest('.prize-payout-show-all');
    if (!toggle) return;
    const expanded = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', expanded);
    toggle.textContent = expanded ? 'Hide All' : 'Show All';
    toggle.getAttribute('aria-controls').split(' ').forEach((id) => {
      const row = document.getElementById(id);
      if (row) row.hidden = !expanded;
    });
  });

  const primary = serviceGameId(game);
  const sources = [...new Set(config.panels.map((p) => p.source))];
  let requestId = 0;

  /**
   * Loads and renders a draw. `primaryData` (from the winning-numbers widget) skips the
   * primary fetch; secondary games (Atlantic 49) are fetched for the same draw date.
   */
  const load = async (date, primaryData) => {
    requestId += 1;
    const current = requestId;
    entries.forEach((e) => e.body.setAttribute('aria-busy', 'true'));
    const primaryPromise = primaryData !== undefined
      ? Promise.resolve(primaryData)
      : fetchWinningNumbers(game, date);
    const secondaryDate = date
      || (primaryData !== undefined ? drawDateParam(primaryData) : undefined);
    const results = await Promise.all(sources.map((source) => (
      serviceGameId(source) === primary
        ? primaryPromise
        : fetchWinningNumbers(source, secondaryDate)
    )));
    if (current !== requestId) return;
    const bySource = Object.fromEntries(sources.map((s, i) => [s, results[i]]));
    entries.forEach((entry) => renderPanel(entry, bySource[entry.panel.source]));
  };

  document.addEventListener('alc:drawchange', (e) => {
    const { game: changed, date, data } = e.detail || {};
    if (serviceGameId(changed) !== primary) return;
    load(date || drawDateParam(data), data === undefined ? undefined : data);
  });

  // latest draw (or ?date= like the source page) without waiting for other widgets
  load(new URLSearchParams(window.location.search).get('date') || undefined);
}
