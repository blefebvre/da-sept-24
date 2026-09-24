/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: WKND Trendsetters site-wide cleanup.
 * All selectors verified in migration-work/cleaned.html.
 *
 * NOTE: do NOT remove bare `header` - the hero is `main > header.section.secondary-section`
 * (authorable, mapped to hero-collage). Only site chrome is targeted below.
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  // NOTE: <div class="breadcrumbs"> (Home > Case studies) in the featured-story section is kept -
  // columns-feature renders a links-only first paragraph as a breadcrumb.

  if (hookName === TransformHook.afterTransform) {
    WebImporter.DOMUtils.remove(element, [
      // Found: <a href="#main-content" class="skip-link">Skip to main content</a>
      'a.skip-link',
      // Found: <div class="navbar"> (logo, nav-menu, mega-menu, subscribe button)
      'div.navbar',
      // Found: <footer class="footer inverse-footer">
      'footer.footer.inverse-footer',
    ]);

    // Found: data-astro-cid-* attributes (Astro build artifacts)
    element.querySelectorAll('*').forEach((el) => {
      Array.from(el.attributes).forEach((attr) => {
        if (attr.name.startsWith('data-astro-cid')) el.removeAttribute(attr.name);
      });
    });
  }
}
