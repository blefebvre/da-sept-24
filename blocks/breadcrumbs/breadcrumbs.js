/**
 * Title-cases a URL path segment ("our-games" -> "Our Games").
 * @param {string} segment Path segment
 * @returns {string}
 */
function segmentLabel(segment) {
  return decodeURIComponent(segment)
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Current page label: the first part of the page title ("Lotto 649 | Our Games | ...").
 * @param {string} fallback Label derived from the URL
 * @returns {string}
 */
function currentLabel(fallback) {
  const titleMeta = document.querySelector('meta[name="title" i], meta[property="og:title"]');
  const title = (document.title || titleMeta?.content || '').split('|')[0].trim();
  return title || fallback;
}

/**
 * Auto-generated breadcrumb (page metadata `Breadcrumbs: true`), built from the URL path.
 * @param {Element} block The breadcrumbs block element
 */
export default function decorate(block) {
  // the local preview serves pages under /content; production serves them at the root
  const path = window.location.pathname.replace(/^\/content(?=\/)/, '').replace(/\.html$/, '');
  const segments = path.split('/').filter(Boolean);
  const localPrefix = window.location.pathname.startsWith('/content/') ? '/content' : '';

  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'Breadcrumb');
  const ol = document.createElement('ol');

  const crumbs = [{ label: 'Home', href: `${localPrefix}/` }];
  segments.forEach((segment, i) => {
    const isCurrent = i === segments.length - 1;
    crumbs.push({
      label: isCurrent ? currentLabel(segmentLabel(segment)) : segmentLabel(segment),
      href: `${localPrefix}/${segments.slice(0, i + 1).join('/')}`,
    });
  });

  crumbs.forEach((crumb, i) => {
    const li = document.createElement('li');
    if (i === crumbs.length - 1) {
      const span = document.createElement('span');
      span.setAttribute('aria-current', 'page');
      span.textContent = crumb.label;
      li.append(span);
    } else {
      const a = document.createElement('a');
      a.href = crumb.href;
      a.textContent = crumb.label;
      li.append(a);
    }
    ol.append(li);
  });

  nav.append(ol);
  block.replaceChildren(nav);
}
