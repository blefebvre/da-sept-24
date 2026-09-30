import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Converts a YouTube timestamp (`90`, `90s`, `1m30s`, `1h2m3s`) to seconds.
 * @param {string} value
 * @returns {number}
 */
function toSeconds(value) {
  if (!value) return 0;
  if (/^\d+$/.test(value)) return Number(value);
  const match = value.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
  if (!match) return 0;
  const [, h = 0, m = 0, s = 0] = match;
  return Number(h) * 3600 + Number(m) * 60 + Number(s);
}

/**
 * Builds a privacy-friendly embed URL for a supported video link.
 * @param {URL} url The authored video URL
 * @returns {string|null} The embed src, or null if the URL is not supported
 */
function getEmbedSrc(url) {
  const host = url.hostname.replace(/^www\.|^m\./, '');

  if (['youtube.com', 'youtu.be', 'youtube-nocookie.com'].includes(host)) {
    let id = null;
    if (host === 'youtu.be') {
      [, id] = url.pathname.split('/');
    } else if (url.pathname === '/watch') {
      id = url.searchParams.get('v');
    } else {
      const match = url.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/?#]+)/);
      if (match) [, id] = match;
    }
    const list = url.searchParams.get('list');
    if (!id && !list) return null;

    const params = new URLSearchParams({ rel: '0', playsinline: '1' });
    const start = toSeconds(url.searchParams.get('t') || url.searchParams.get('start'));
    if (start) params.set('start', start);
    if (list) params.set('list', list);
    const path = id ? `embed/${encodeURIComponent(id)}` : 'embed/videoseries';
    return `https://www.youtube-nocookie.com/${path}?${params}`;
  }

  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const match = url.pathname.match(/(\d+)/);
    return match ? `https://player.vimeo.com/video/${match[1]}?dnt=1` : null;
  }

  return null;
}

function createIframe(src, title, autoplay) {
  const iframe = document.createElement('iframe');
  const url = new URL(src);
  if (autoplay) url.searchParams.set('autoplay', '1');
  iframe.src = url.href;
  iframe.title = title;
  iframe.loading = 'lazy';
  iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
  iframe.allowFullscreen = true;
  iframe.referrerPolicy = 'strict-origin-when-cross-origin';
  return iframe;
}

/**
 * Returns the text of a heading authored directly before the block (in the same section),
 * used to name the video when the link text is just the URL.
 * @param {HTMLElement} block
 * @returns {string}
 */
function findPrecedingHeading(block) {
  const wrapper = block.parentElement;
  let prev = wrapper && wrapper.previousElementSibling;
  if (prev && !/^H[1-6]$/.test(prev.tagName)) prev = prev.lastElementChild;
  return prev && /^H[1-6]$/.test(prev.tagName) ? prev.textContent.trim() : '';
}

export default function decorate(block) {
  const link = block.querySelector('a[href]');
  const rawUrl = link ? link.href : block.textContent.trim();
  let url;
  try {
    url = new URL(rawUrl, window.location.href);
  } catch {
    return;
  }

  const src = getEmbedSrc(url);
  // unsupported or missing URL: leave the authored content (e.g. a plain link) untouched
  if (!src) return;

  const linkText = link ? link.textContent.trim() : '';
  const hasLabel = linkText && linkText !== rawUrl && !/^https?:\/\//.test(linkText);
  const title = hasLabel ? linkText : (findPrecedingHeading(block) || 'Embedded video');
  const poster = block.querySelector('picture img');

  const player = document.createElement('div');
  player.className = 'embed-video-player';

  const load = (autoplay) => {
    if (player.querySelector('iframe')) return;
    player.replaceChildren(createIframe(src, title, autoplay));
    block.classList.add('embed-video-loaded');
  };

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'embed-video-play';
  button.setAttribute('aria-label', `Play video: ${title}`);
  button.innerHTML = '<span class="embed-video-play-icon" aria-hidden="true"></span>';
  button.addEventListener('click', () => load(true));

  if (poster) {
    // authored poster image: click to load (no third-party request until the user asks)
    const picture = createOptimizedPicture(poster.src, poster.alt || title, false, [{ media: '(min-width: 600px)', width: '1200' }, { width: '750' }]);
    picture.classList.add('embed-video-poster');
    player.append(picture, button);
  } else {
    // no poster: load the (cookie-less) player once the block approaches the viewport
    player.append(button);
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          load(false);
        }
      }, { rootMargin: '200px' });
      observer.observe(block);
    } else {
      load(false);
    }
  }

  block.replaceChildren(player);
}
