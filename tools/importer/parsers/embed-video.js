/* eslint-disable */
/* global WebImporter */
/**
 * Parser for embed-video. Base: embed.
 * Source: https://www.alc.ca/content/alc/en/our-games/lotto/lotto-6-49.html
 * Generated: 2026-09-25
 *
 * Source structure (validated against block-context/embed-video/source.html and live DOM):
 *   .how-to-play-content div.youtube.section > div.center
 *     h3 "Lotto 6/49"                                   -> default content (left in place)
 *     div.youtube-holder > iframe[src="https://www.youtube.com/embed/wwM8Mah5sAA?rel=0"]
 *
 * Output (library convention: 1 column): one row, one cell holding the video link.
 *   Embed URLs are normalised: youtube(-nocookie).com/embed/ID -> https://www.youtube.com/watch?v=ID
 *   (start time kept as &t=). Non-YouTube URLs (e.g. Vimeo) are kept as-is.
 */
function toWatchUrl(src) {
  if (!src) return '';
  let u;
  try {
    u = new URL(src, 'https://www.youtube.com');
  } catch (e) {
    return src;
  }
  const host = u.hostname.replace(/^www\./, '');
  if (/(^|\.)youtube(-nocookie)?\.com$/.test(host)) {
    const m = u.pathname.match(/\/(?:embed|shorts|live|v)\/([\w-]{6,})/);
    if (m && m[1] !== 'videoseries') {
      const start = u.searchParams.get('start') || u.searchParams.get('t');
      return `https://www.youtube.com/watch?v=${m[1]}${start ? `&t=${start}` : ''}`;
    }
    const list = u.searchParams.get('list');
    if (list) return `https://www.youtube.com/playlist?list=${list}`;
    const v = u.searchParams.get('v');
    if (v) return `https://www.youtube.com/watch?v=${v}`;
  }
  if (host === 'youtu.be') return `https://www.youtube.com/watch?v=${u.pathname.slice(1)}`;
  if (u.protocol === 'http:' || u.protocol === 'https:') return u.href;
  return src;
}

export default function parse(element, { document }) {
  const iframe = element.matches('iframe') ? element : element.querySelector('iframe');
  const src = iframe && (iframe.getAttribute('src') || iframe.getAttribute('data-src'));
  const href = toWatchUrl(src);
  if (!href) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const a = document.createElement('a');
  a.href = href;
  a.textContent = href;

  const cells = [[a]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'embed-video', cells });
  element.replaceWith(block);
}
