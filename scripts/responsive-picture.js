import { createOptimizedPicture } from './aem.js';

const MOBILE_MEDIA = '(max-width: 767px)';
const TABLET_MEDIA = '(min-width: 768px) and (max-width: 1199px)';

/**
 * Prepends <source> entries for an alternate rendition, scoped to a media query.
 * @param {HTMLPictureElement} picture Target picture
 * @param {HTMLImageElement} img Alternate artwork
 * @param {string} media Media query the artwork applies to
 * @param {boolean} eager Load eagerly
 * @param {string} width Requested rendition width
 */
function prependVariant(picture, img, media, eager, width) {
  const variant = createOptimizedPicture(img.src, img.alt, eager, [{ width }]);
  variant.querySelectorAll('source').forEach((source) => source.setAttribute('media', media));
  const fallback = document.createElement('source');
  fallback.setAttribute('media', media);
  fallback.setAttribute('srcset', variant.querySelector('img').getAttribute('src'));
  picture.prepend(...variant.querySelectorAll('source'), fallback);
}

/**
 * Builds one <picture> from separately authored desktop, mobile and tablet artwork.
 * Mobile artwork is served below 768px and tablet artwork from 768px to 1199px
 * (the source site's breakpoints); desktop otherwise.
 * Falls back to a regular optimized picture when no alternate artwork is authored.
 * @param {HTMLImageElement} desktop Desktop image
 * @param {HTMLImageElement} [mobile] Optional mobile image
 * @param {boolean} [eager] Load eagerly (LCP)
 * @param {string} [desktopWidth] Requested desktop rendition width
 * @param {HTMLImageElement} [tablet] Optional tablet image
 * @returns {HTMLPictureElement}
 */
export default function createResponsivePicture(
  desktop,
  mobile,
  eager = false,
  desktopWidth = '2000',
  tablet = null,
) {
  const breakpoints = [{ width: desktopWidth }];
  const picture = createOptimizedPicture(desktop.src, desktop.alt, eager, breakpoints);
  // more specific media sources must precede the desktop sources
  if (tablet) prependVariant(picture, tablet, TABLET_MEDIA, eager, '1200');
  if (mobile) prependVariant(picture, mobile, MOBILE_MEDIA, eager, '750');
  return picture;
}
