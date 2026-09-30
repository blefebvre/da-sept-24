/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: ALC (alc.ca) site-wide cleanup.
 * All selectors verified in migration-work/cleaned.html (captured DOM).
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

/**
 * Mobile-only "Check winning numbers" banner above the hero (source shows it below 768px).
 * Found: <div class="html-promo parbase ..."><article><a href class="picturefill-background">
 *   <span data-media="(min-width: 320px)" data-src=".../imageM.img.jpg/...">
 * Becomes its own section: linked image + Section Metadata style "mobile-promo".
 */
function convertMobilePromo(element, document) {
  element.querySelectorAll('div.html-promo').forEach((promo) => {
    const link = promo.querySelector('a[href]');
    const spans = [...promo.querySelectorAll('span[data-src]')];
    const mobile = spans.find((sp) => (sp.getAttribute('data-media') || '').includes('320px')) || spans[0];
    let src = mobile ? mobile.getAttribute('data-src') : '';
    if (!src && link) {
      const m = (link.getAttribute('style') || '').match(/url\(["']?([^"')]+)["']?\)/i);
      if (m) [, src] = m;
    }
    const img = promo.querySelector('img');
    if (!src && img) src = img.getAttribute('src');
    // picturefill may have resolved the desktop rendition; the banner only shows on mobile
    if (src) src = src.replace(/\/image[DT]\.img\.[a-z]+\/(\d+)\.[a-z]+/, '/imageM.img.jpg/$1.jpg');
    if (!link || !src) {
      promo.remove();
      return;
    }
    const a = document.createElement('a');
    a.href = link.getAttribute('href');
    const image = document.createElement('img');
    image.src = src;
    image.alt = 'Check winning numbers';
    a.append(image);
    const p = document.createElement('p');
    p.append(a);
    const meta = WebImporter.Blocks.createBlock(document, {
      name: 'Section Metadata',
      cells: { style: 'mobile-promo' },
    });
    promo.replaceWith(p, meta, document.createElement('hr'));
  });
}

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    convertMobilePromo(element, payload.document);
    WebImporter.DOMUtils.remove(element, [
      // Hidden mobile "Download our App" bottom banner, nested inside the right-rail
      // promo container (div.alc-container.cmp-container--hide-column-gutters).
      // Found: <div id="alc-banner-..." class="alc-mobile-banner alc-mobile-banner--v1 publish">
      '.alc-mobile-banner',
      // Non-authorable countdown timers inside hero carousel slides.
      // Found: <div class="next-draw-timer"><div class="timer-head">Time Remaining:</div>...
      '.next-draw-timer',
      // Browser-upgrade modal. Found: <div class="common-modals aem-GridColumn ...">
      '.common-modals',
      // Login flow modal. Found: <div id="loginFlow" class="alc-modal modal fade">
      '#loginFlow',
      // Qualtrics intercept placeholder. Found: <div id="ZN_3Eu2u7P45FmpwJ5">
      '#ZN_3Eu2u7P45FmpwJ5',
    ]);
  }

  if (hookName === TransformHook.afterTransform) {
    WebImporter.DOMUtils.remove(element, [
      // Global header XF (migrated separately).
      // Found: <div class="experiencefragment aem-GridColumn aem-GridColumn--default--12">
      'div.experiencefragment.aem-GridColumn',
      // Global footer XF (migrated separately).
      // Found: <footer class="experiencefragment aem-GridColumn aem-GridColumn--default--12">
      'footer.experiencefragment.aem-GridColumn',
      // Skip link. Found: <div class="cmp-page__skiptomaincontent">
      '.cmp-page__skiptomaincontent',
      // Tracking pixels (doubleclick / adsrvr), stylesheet links, scripts.
      'iframe',
      'link',
      'noscript',
      'script',
    ]);
  }
}
