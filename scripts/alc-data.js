/*
 * ALC draw data access for widgets.
 *
 * Data comes from ALC's own services (e.g. /services/WinningNumbersServlet). Those services
 * send no CORS headers, so they only work same-origin: in production the CDN serving
 * www.alc.ca must route /services/* to ALC's servers. The base URL can be overridden with
 * page metadata `alc-data-base` (e.g. a proxy that adds CORS headers) or window.ALC_DATA_BASE.
 * When data can't be reached, fetchers resolve to null and widgets show their "unavailable" state.
 */

const SERVICE_GAME_IDS = {
  lotto649: 'Lotto649',
  atlantic49: 'Atlantic49',
  lottomax: 'LottoMax',
  dailygrand: 'DailyGrand',
  tag: 'Tag',
};

/**
 * Maps an authored game code ("lotto649") to the service game id ("Lotto649").
 * @param {string} game Authored game code
 * @returns {string}
 */
export function serviceGameId(game) {
  const key = String(game || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  return SERVICE_GAME_IDS[key] || game;
}

function dataBase() {
  const meta = document.querySelector('meta[name="alc-data-base" i]');
  return (window.ALC_DATA_BASE || (meta && meta.content) || '').replace(/\/$/, '');
}

/**
 * Fetches JSON from an ALC service path; resolves to null on any failure.
 * @param {string} path Service path starting with /services/
 * @param {Object} params Query parameters
 * @returns {Promise<Object|null>}
 */
export async function fetchService(path, params = {}) {
  const url = new URL(`${dataBase()}${path}`, window.location.href);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) url.searchParams.set(key, value);
  });
  try {
    const resp = await fetch(url.href, { headers: { Accept: 'application/json' } });
    if (!resp.ok) return null;
    const type = resp.headers.get('content-type') || '';
    if (!type.includes('json')) return null;
    return await resp.json();
  } catch {
    return null;
  }
}

/**
 * Parses the services' date formats: "/Date(1790476199000-0300)/" or ISO strings.
 * @param {string} value Date value from a service
 * @returns {Date|null}
 */
export function parseServiceDate(value) {
  if (!value) return null;
  const ms = String(value).match(/\/Date\((-?\d+)/);
  const date = ms ? new Date(Number(ms[1])) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Formats a draw date like the source site: "Sat. 26 Sep. 2026" (Atlantic time).
 * @param {Date} date Draw date
 * @param {string} [locale] Locale
 * @returns {string}
 */
export function formatDrawDate(date, locale = 'en-CA') {
  if (!date) return '';
  const parts = new Intl.DateTimeFormat(locale, {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'America/Halifax',
  }).formatToParts(date).reduce((acc, p) => ({ ...acc, [p.type]: p.value.replace(/\.$/, '') }), {});
  return `${parts.weekday}. ${parts.day} ${parts.month}. ${parts.year}`;
}

/**
 * Formats a draw date for the service's date parameter (YYYY-MM-DD, Atlantic time).
 * @param {Date} date Draw date
 * @returns {string}
 */
export function serviceDateParam(date) {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'America/Halifax',
  }).format(date);
}

/**
 * Winning numbers, prize payouts and next draw for a game.
 * Without a date the latest draw is returned (it includes `next_draw` with the jackpots).
 * @param {string} game Authored game code
 * @param {Date|string} [date] Draw date
 * @returns {Promise<Object|null>}
 */
export function fetchWinningNumbers(game, date) {
  const dateParam = date instanceof Date ? serviceDateParam(date) : date;
  return fetchService('/services/WinningNumbersServlet', { game: serviceGameId(game), date: dateParam });
}

const latestDraws = new Map();

/**
 * Latest winning numbers for a game, shared by every widget on the page (one request per game).
 * Failed requests (null) are not kept, so a later call retries.
 * @param {string} game Authored game code
 * @returns {Promise<Object|null>}
 */
export function fetchLatestWinningNumbers(game) {
  const key = serviceGameId(game);
  if (!latestDraws.has(key)) {
    latestDraws.set(key, fetchWinningNumbers(game).then((data) => {
      if (!data) latestDraws.delete(key);
      return data;
    }));
  }
  return latestDraws.get(key);
}

/**
 * Winners list for a game.
 * @param {string} game Authored game code
 * @param {Object} [options] { sort: 'recent'|'alpha', name, offset, province }
 * @returns {Promise<Object|null>}
 */
export function fetchWinnersList(game, options = {}) {
  const {
    sort = 'recent', name = '', offset = 0, province,
  } = options;
  return fetchService('/services/WinnersListServlet', {
    game: serviceGameId(game), sort, name, offset, province,
  });
}
