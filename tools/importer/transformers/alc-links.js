/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: ALC (alc.ca) internal link rewriting - shared by all ALC templates.
 *
 * Migrated pages live under the EDS site root:
 *   /content/alc/en.html                        -> /
 *   /content/alc/en/our-games/lotto/lotto-6-49.html -> /our-games/lotto/lotto-6-49
 *
 * Rule: an href (root-relative, or absolute on www.alc.ca / alc.ca) whose path matches
 *   ^/content/alc/en(/.*)?\.html  (optionally doubled ".html.html")
 * is rewritten by stripping the "/content/alc/en" prefix and the ".html" extension;
 * query string and hash are preserved. Found in cleaned.html, e.g.
 *   <a href="/content/alc/en.html">Home</a>
 *   <a href="/content/alc/en/our-games/lotto/lotto-max.html">
 *   <a href="/content/alc/en/referenced-content/external/help-redirect.html">
 *
 * Left untouched: /content/dam/... assets, /content/alc/fr... (French site),
 * external hosts, "#..." anchors, "?toggle" and anything not ending in .html.
 *
 * Runs in afterTransform only, so links created by block parsers are covered too.
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

const ALC_HOST = /^https?:\/\/(www\.)?alc\.ca(?=\/|$)/i;
// path, optional query, optional hash
const EN_PAGE = /^\/content\/alc\/en((?:\/[^?#]*?)?)((?:\.html)+)(\?[^#]*)?(#.*)?$/i;

/**
 * Returns the rewritten href, or null when the href is not an ALC English page link.
 */
function rewriteAlcHref(href) {
  if (!href) return null;
  const raw = href.trim();
  const local = raw.replace(ALC_HOST, '');
  if (local === raw && !raw.startsWith('/')) return null; // external or relative/anchor
  const m = local.match(EN_PAGE);
  if (!m) return null;
  const [, rest, , query = '', hash = ''] = m;
  let path = rest || '';
  if (path === '' || path === '/') path = '/';
  // "/foo/" style trailing slash (unlikely before .html) - normalise
  if (path.length > 1) path = path.replace(/\/+$/, '');
  return `${path}${query}${hash}`;
}

// DAM assets (PDFs etc.) are not migrated: keep them pointing at alc.ca
const DAM_ASSET = /^\/content\/dam\//i;

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.afterTransform) {
    element.querySelectorAll('a[href]').forEach((a) => {
      const href = a.getAttribute('href');
      const next = DAM_ASSET.test(href.trim()) ? `https://www.alc.ca${href.trim()}` : rewriteAlcHref(href);
      if (next === null || next === href) return;
      a.setAttribute('href', next);
      // Bare-URL links (text == href) should show the new URL too
      if (a.textContent.trim() === href.trim()) a.textContent = next;
    });
  }
}
