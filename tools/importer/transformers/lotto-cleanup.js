/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: ALC (alc.ca) cleanup for the "lotto" game-detail template
 * (e.g. /content/alc/en/our-games/lotto/lotto-6-49.html).
 *
 * All selectors verified in migration-work/cleaned.html (captured DOM of lotto-6-49).
 * The homepage-oriented alc-cleanup.js is intentionally left untouched.
 *
 * Must run BEFORE alc-sections.js: the share bar (template section "share-bar",
 * style null) is removed in beforeTransform so the section transformer skips it and
 * no empty section is produced.
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

/**
 * Right rail (#promos) contains empty promo slots around the game tile.
 * Found: <div id="promos"><div class="col-xs-12 promo"><div></div></div> ...
 *        <div class="promo-box parbase section"></div> ...
 *        <div class="col-lg-12 col-md-6 promo"><div></div></div>
 * Only slots with no text, no image and no game tile are removed.
 */
function removeEmptyPromoSlots(element) {
  const isEmpty = (el) => !el.querySelector('img, iframe, .game-tile, a[href]')
    && !el.textContent.replace(/ /g, ' ').trim();
  element.querySelectorAll('#promos .promo-box, #promos > .promo').forEach((slot) => {
    if (isEmpty(slot)) slot.remove();
  });
}

/**
 * Global header / footer XF wrappers (as used by alc.ca on the homepage).
 * Not present in the lotto cleaned.html, kept for parity with alc-cleanup.js;
 * guarded so a wrapper holding the page body (#game-details) is never removed.
 */
function removeXfChrome(element) {
  element.querySelectorAll('div.experiencefragment.aem-GridColumn, footer.experiencefragment.aem-GridColumn')
    .forEach((xf) => {
      if (!xf.querySelector('#game-details')) xf.remove();
    });
}

export default function transform(hookName, element, payload) {
  const document = (payload && payload.document) || element.ownerDocument;

  if (hookName === TransformHook.beforeTransform) {
    WebImporter.DOMUtils.remove(element, [
      // Qualtrics intercept placeholder. Found: <div id="ZN_3Eu2u7P45FmpwJ5">
      '#ZN_3Eu2u7P45FmpwJ5',
      // Login / MFA flow modal (+ its "Need help?" footer).
      // Found: <div class="multi-step-flow aem-GridColumn ..."><div class="main-content"><div id="loginFlow" class="alc-modal modal fade">
      'div.multi-step-flow',
      '#loginFlow',
      // Tutorial + browser-check modals. Found: <div class="common-modals"><div class="cmp-modal"><div id="modal-tutorial-en" ...>
      '.common-modals',
      '#modal-tutorial-en',
      // On game pages the browser-check modal sits directly under <body>.
      // Found: <div class="alc-modal modal-browser-check modal"><div class="modal-dialog">
      '.modal-browser-check',
      // Hidden rewards "Bonus Offer" banner (keep the sibling .rewards-earn-rate default content).
      // Found: <div id="rewards-banner" class="rewards-banner hidden"><span class="rewards-banner__badge">Bonus Offer</span>
      '#rewards-banner',
      // Breadcrumb (auto-generated in EDS via page metadata "Breadcrumbs: true").
      // Found: <div id="draw-subcomponent"><div class="draw--full__breadcrumb">
      '#draw-subcomponent > div.draw--full__breadcrumb',
      // Share bar (URLs built by JS). Found: <div id="game-details"> ... <section class="header blue"><div class="social">
      '#game-details > section.header.blue',
    ]);
    removeEmptyPromoSlots(element);

    // Site-wide textured page background comes from the site stylesheet
    // (div.body-content { background-image: url(.../static/alc-images/background.jpg) }).
    // It belongs in CSS, not in every page, so keep transformBackgroundImages from authoring it.
    element.querySelectorAll('#game-details > div.body-content').forEach((el) => {
      el.style.backgroundImage = 'none';
    });

    // Authored text contains a JS-only login trigger:
    // Found: <u><button class="modal-login authorModal btn-link">Sign in or Create an alc.ca account</button></u>
    // Keep the sentence readable by replacing the button with its text.
    element.querySelectorAll('button.modal-login.authorModal').forEach((btn) => {
      btn.replaceWith(document.createTextNode(btn.textContent.trim()));
    });
  }

  if (hookName === TransformHook.afterTransform) {
    removeXfChrome(element);
    WebImporter.DOMUtils.remove(element, [
      // Skip link (homepage parity; absent on lotto cleaned.html).
      '.cmp-page__skiptomaincontent',
      // Global chrome (migrated separately as nav/footer).
      // Found: <div id="collapsible-promo" class="collapsible-promo">
      '#collapsible-promo',
      // Found: <header class="container hidden-xs tablet-desktop header-en alc"> and
      //        <header class="visible-xs navbar-fixed-top mobile header-en alc">
      'header.header-en',
      // Found: <div class="logged-in-info-wrapper hidden-xs"> (account dashboard)
      '.logged-in-info-wrapper',
      // Found: <div class="topnav"><div><div><div class="container-fluid header-nav alc-nav"> (megamenu)
      'div.topnav',
      // Found: <nav id="nav-mobile" class="nav-mobile navmenu ...">
      '#nav-mobile',
      // Found: <footer class="main-footer">
      'footer.main-footer',
      // JS-driven next-draw / jackpot text on game tiles (outside widget areas).
      // Found: <p class="next-jackpot-date">Next Draw: ...</p>, <p class="next-jackpot-prize">,
      //        <div class="jackpot-lottomax"><div class="prize-bar">...
      '#promos .next-jackpot-date',
      '#promos .next-jackpot-prize',
      '#promos .jackpot-lottomax',
      // Stylesheet links / scripts. Found: <link href="/etc.clientlibs/wcm/foundation/clientlibs/accessibility.min.css">
      'link',
      'noscript',
      'script',
    ]);

    // Tracking pixels (doubleclick fls / adsrvr insight). Keep YouTube embeds:
    // Found: <div class="youtube-holder"><iframe src="https://www.youtube.com/embed/wwM8Mah5sAA?rel=0">
    element.querySelectorAll('iframe').forEach((iframe) => {
      const src = iframe.getAttribute('src') || '';
      if (!/(youtube\.com|youtube-nocookie\.com|youtu\.be)\//i.test(src)) iframe.remove();
    });

    // Empty ID-only section left by the page shell. Found: <section id="-0ed86527-34c1-42a5-8092-0658e21078df"></section>
    element.querySelectorAll('section[id^="-"]').forEach((s) => {
      if (!s.children.length && !s.textContent.trim()) s.remove();
    });
  }
}
