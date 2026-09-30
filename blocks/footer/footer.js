import { loadScript } from '../../scripts/aem.js';

/*
 * Footer block.
 *
 * Content lives in the footer fragment (footer.plain.html); this block reads it and builds
 * the layout + interactive controls. Fragment sections, in order:
 *   1. newsletter    intro <p>; <ul> [label, placeholder, submit]; question <p> containing
 *                    "{email}"; terms <p> (checkbox label); <ul> [confirm, cancel]; note <p>
 *   2. utility bar   one <p> per cell (contact link, social icon links, "#feedback" link, badge)
 *   3. link columns  <h2> + optional intro <p> + <ul> per column (desktop)
 *   4. link panels   <h2> + <ul> per accordion panel (below desktop)
 *   5. other sites   <h2> + <p> of logo links (open in a new tab)
 *   6. legal         links <p>, text <p>s, certification marks <p>
 */

// newsletter service (source site form action; same-origin endpoints on www.alc.ca)
const NEWSLETTER_ACTION = 'https://www.alc.ca/services/pam/RegisterAnonymousPlayer';
const NEWSLETTER_TERMS = 'https://www.alc.ca/services/pam/GetTermsOfService?subJurisdictionId=1';
// Qualtrics site intercept that powers the "Leave a Comment" survey
const FEEDBACK_SCRIPT = 'https://zn3eu2u7p45fmpwj5-alclotoatlantique.siteintercept.qualtrics.com/SIE/?Q_ZID=ZN_3Eu2u7P45FmpwJ5';
const FEEDBACK_HASH = '#feedback';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Creates an element with attributes and children.
 * @param {string} tag element name
 * @param {Object} [attrs] attributes (className sets class)
 * @param {...(Node|string)} children child nodes or text
 * @returns {HTMLElement}
 */
function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (value === undefined || value === null || value === false) return;
    if (key === 'className') node.className = value;
    else node.setAttribute(key, value === true ? '' : value);
  });
  node.append(...children.filter((child) => child !== undefined && child !== null));
  return node;
}

/**
 * Fetches the footer fragment and returns its top-level sections.
 * Metadata-independent dual fetch: /content (local preview) first, then the site root (DA/EDS).
 * @returns {Promise<Element[]>}
 */
async function fetchFooterSections() {
  let resp = await fetch('/content/footer.plain.html');
  if (!resp.ok) resp = await fetch('/footer.plain.html');
  if (!resp.ok) return [];
  const doc = new DOMParser().parseFromString(await resp.text(), 'text/html');
  // resolve media relative to the fragment (not the current page)
  doc.querySelectorAll('img[src]').forEach((img) => {
    img.setAttribute('src', new URL(img.getAttribute('src'), resp.url).href);
    img.setAttribute('loading', 'lazy');
  });
  doc.querySelectorAll('source[srcset]').forEach((source) => {
    source.setAttribute('srcset', new URL(source.getAttribute('srcset'), resp.url).href);
  });
  return [...doc.body.children].filter((node) => node.tagName === 'DIV');
}

/**
 * Splits a section into groups, each starting at a heading.
 * @param {Element} section fragment section
 * @returns {{heading: Element, content: Element[]}[]}
 */
function groupByHeading(section) {
  const groups = [];
  [...section.children].forEach((child) => {
    if (/^H[1-6]$/.test(child.tagName)) groups.push({ heading: child, content: [] });
    else if (groups.length) groups[groups.length - 1].content.push(child);
  });
  return groups;
}

/** @returns {string[]} trimmed text of each list item */
const listItems = (list) => (list ? [...list.children].map((li) => li.textContent.trim()) : []);

/** Opens every link inside the container in a new tab. */
function openInNewTab(container) {
  container.querySelectorAll('a[href]').forEach((a) => {
    a.target = '_blank';
    a.rel = 'noopener';
  });
}

/**
 * Replaces a "{token}" in the element's text with the given node.
 * @param {Element} element element containing the token
 * @param {string} token token text, e.g. "{email}"
 * @param {Node} replacement node inserted in place of the token
 */
function replaceToken(element, token, replacement) {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    const index = node.textContent.indexOf(token);
    if (index >= 0) {
      const rest = node.splitText(index);
      rest.textContent = rest.textContent.slice(token.length);
      rest.before(replacement);
      return;
    }
    node = walker.nextNode();
  }
}

/**
 * Subscribes an email address to the newsletter (same flow as the source site).
 * @param {string} email address to subscribe
 */
async function subscribe(email) {
  const lang = (document.documentElement.lang || 'en').slice(0, 2);
  const termsResp = await fetch(`${NEWSLETTER_TERMS}&locale=${lang}-ca`, { credentials: 'include' });
  if (!termsResp.ok) throw new Error(`terms of service: ${termsResp.status}`);
  const { TermsOfServiceId } = await termsResp.json();
  const resp = await fetch(NEWSLETTER_ACTION, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      PlayerInformation: { Email: email, TermsOfServiceId, LocaleCode: `${lang}_CA` },
      Optin: { Channel: 1, Promotion: true, LargeDrawWin: true },
    }),
  });
  if (!resp.ok) throw new Error(`subscribe: ${resp.status}`);
}

/**
 * Builds the newsletter band: intro + email form with a confirmation step.
 * @param {Element} section newsletter fragment section
 * @returns {HTMLElement}
 */
function buildNewsletter(section) {
  const paragraphs = [...section.querySelectorAll(':scope > p')];
  const lists = [...section.querySelectorAll(':scope > ul')];
  const [labelText, placeholder, submitText] = listItems(lists[0]);
  const [confirmText, cancelText] = listItems(lists[1]);
  const questionIndex = paragraphs.findIndex((p) => p.textContent.includes('{email}'));
  const intro = paragraphs[0] !== paragraphs[questionIndex] ? paragraphs[0] : null;
  const question = paragraphs[questionIndex];
  const terms = questionIndex >= 0 ? paragraphs[questionIndex + 1] : null;
  const note = questionIndex >= 0 ? paragraphs[questionIndex + 2] : null;

  const input = el('input', {
    type: 'email',
    id: 'footer-newsletter-email',
    name: 'email',
    autocomplete: 'email',
    placeholder,
    required: true,
  });
  const submit = el('button', { type: 'submit', className: 'footer-newsletter-submit', disabled: true }, submitText || 'Subscribe');
  const form = el(
    'form',
    {
      className: 'footer-newsletter-form', action: NEWSLETTER_ACTION, method: 'post', novalidate: true,
    },
    el('label', { for: 'footer-newsletter-email', className: 'footer-newsletter-label' }, labelText || placeholder || ''),
    el('div', { className: 'footer-newsletter-field' }, input, submit),
  );

  // confirmation step
  const echo = el('span', { className: 'footer-newsletter-echo' });
  const checkbox = el('input', { type: 'checkbox', id: 'footer-newsletter-terms', required: true });
  const confirm = el('button', { type: 'button', className: 'footer-newsletter-confirm-button', disabled: true }, confirmText || 'Confirm');
  const cancel = el('button', { type: 'button', className: 'footer-newsletter-cancel' }, cancelText || 'Cancel');
  const dialog = el('div', {
    className: 'footer-newsletter-dialog', role: 'dialog', 'aria-labelledby': 'footer-newsletter-question', hidden: true,
  });
  if (question) {
    replaceToken(question, '{email}', echo);
    question.id = 'footer-newsletter-question';
    dialog.append(question);
  }
  if (terms) {
    const label = el('label', { for: 'footer-newsletter-terms' }, ...terms.childNodes);
    openInNewTab(label);
    dialog.append(el('p', { className: 'footer-newsletter-terms' }, checkbox, label));
  }
  dialog.append(el('p', { className: 'footer-newsletter-actions' }, confirm, cancel));
  if (note) {
    note.className = 'footer-newsletter-note';
    openInNewTab(note);
    dialog.append(note);
  }
  form.append(dialog);

  const isValid = () => EMAIL_PATTERN.test(input.value.trim());
  const close = () => {
    dialog.hidden = true;
    checkbox.checked = false;
    confirm.disabled = true;
  };
  input.addEventListener('input', () => {
    submit.disabled = !isValid();
    if (!isValid()) close();
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!isValid()) return;
    echo.textContent = input.value.trim();
    dialog.hidden = false;
    checkbox.focus();
  });
  checkbox.addEventListener('change', () => { confirm.disabled = !checkbox.checked; });
  cancel.addEventListener('click', () => { close(); input.focus(); });
  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { close(); input.focus(); }
  });
  confirm.addEventListener('click', async () => {
    if (!checkbox.checked || !isValid()) return;
    confirm.disabled = true;
    try {
      await subscribe(input.value.trim());
      input.value = '';
      submit.disabled = true;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('newsletter subscription failed', error);
    } finally {
      window.dataLayer?.push({ event: 'subscribe', subscription_type: 'newsletter', is_site_goal: 'false' });
      close();
    }
  });

  const band = el('div', { className: 'footer-newsletter' });
  const row = el('div', { className: 'footer-container footer-newsletter-row' });
  if (intro) {
    intro.className = 'footer-newsletter-intro';
    row.append(intro);
  }
  row.append(form);
  band.append(row);
  return band;
}

/**
 * Loads the feedback survey (Qualtrics site intercept, which binds to #footer-send-feedback).
 * @returns {Promise<boolean>} true once the intercept API is available
 */
async function loadFeedbackSurvey() {
  if (!window.QSI?.API) {
    try {
      await loadScript(FEEDBACK_SCRIPT, { async: '' });
    } catch {
      return false;
    }
  }
  for (let i = 0; i < 50 && !window.QSI?.API; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => { setTimeout(resolve, 100); });
  }
  return !!window.QSI?.API;
}

/**
 * Converts a "#feedback" link into the button that opens the feedback survey.
 * @param {HTMLAnchorElement} link authored link
 * @returns {HTMLButtonElement}
 */
function buildFeedbackButton(link) {
  const button = el('button', { type: 'button', id: 'footer-send-feedback', className: 'footer-feedback-button' }, ...link.childNodes);
  let ready = false;
  const preload = () => loadFeedbackSurvey().then((ok) => { ready = ok; });
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer.disconnect();
        preload();
      }
    }, { rootMargin: '200px' });
    observer.observe(button);
  }
  button.addEventListener('click', async () => {
    if (ready) return; // the intercept handles the click itself
    ready = await loadFeedbackSurvey();
    // replay the click once the intercept is bound
    if (ready) setTimeout(() => button.click(), 500);
  });
  return button;
}

/**
 * Builds the utility bar (contact, social icons, feedback, badge).
 * @param {Element} section utility fragment section
 * @returns {HTMLElement}
 */
function buildUtilityBar(section) {
  const bar = el('div', { className: 'footer-container footer-bar' });
  [...section.children].forEach((cell) => {
    const feedback = cell.querySelector(`a[href="${FEEDBACK_HASH}"]`);
    const imageLinks = cell.querySelectorAll('a img');
    if (feedback) {
      cell.className = 'footer-feedback';
      feedback.replaceWith(buildFeedbackButton(feedback));
    } else if (imageLinks.length) {
      cell.className = 'footer-social';
      imageLinks.forEach((img) => {
        const a = img.closest('a');
        a.className = 'footer-social-link';
        if (!a.title && img.alt) a.title = img.alt;
      });
    } else if (cell.querySelector('img') && !cell.querySelector('a')) {
      cell.className = 'footer-badge';
    } else {
      cell.className = 'footer-contact';
    }
    bar.append(cell);
  });
  return bar;
}

/**
 * Builds the static link columns (desktop).
 * @param {Element} section columns fragment section
 * @returns {HTMLElement}
 */
function buildColumns(section) {
  const nav = el('nav', { className: 'footer-columns', 'aria-label': 'Footer' });
  groupByHeading(section).forEach(({ heading, content }) => {
    content.filter((node) => node.tagName === 'P').forEach((p) => { p.className = 'footer-column-intro'; });
    nav.append(el('div', { className: 'footer-column' }, heading, ...content));
  });
  return nav;
}

/**
 * Builds the accordion link panels (below desktop). One panel open at a time.
 * @param {Element} section panels fragment section
 * @returns {HTMLElement}
 */
function buildAccordion(section) {
  const accordion = el('div', { className: 'footer-accordion' });
  const toggles = [];
  groupByHeading(section).forEach(({ heading, content }, i) => {
    const panelId = `footer-accordion-panel-${i}`;
    const toggle = el('button', {
      type: 'button', id: `footer-accordion-toggle-${i}`, 'aria-expanded': 'false', 'aria-controls': panelId,
    }, ...heading.childNodes);
    heading.append(toggle);
    const panel = el('div', {
      className: 'footer-accordion-panel', id: panelId, role: 'region', 'aria-labelledby': toggle.id,
    }, el('div', { className: 'footer-accordion-body' }, ...content));
    toggles.push(toggle);
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      toggles.forEach((other) => other.setAttribute('aria-expanded', 'false'));
      toggle.setAttribute('aria-expanded', String(open));
    });
    accordion.append(el('div', { className: 'footer-accordion-item' }, heading, panel));
  });
  return accordion;
}

/**
 * Builds the "other sites" row (logo links open in a new tab).
 * @param {Element} section other-sites fragment section
 * @returns {HTMLElement}
 */
function buildOtherSites(section) {
  section.className = 'footer-sites';
  openInNewTab(section);
  return section;
}

/**
 * Builds the legal row (links, notices, certification marks).
 * @param {Element} section legal fragment section
 * @returns {HTMLElement}
 */
function buildLegal(section) {
  section.className = 'footer-legal';
  [...section.children].forEach((p) => {
    if (p.querySelector('img') && !p.textContent.trim()) p.className = 'footer-legal-marks';
    else if (p.querySelector('a')) p.className = 'footer-legal-links';
    else p.className = 'footer-legal-text';
  });
  return section;
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const [newsletter, utility, columns, panels, otherSites, legal] = await fetchFooterSections();
  block.textContent = '';

  const head = el('div', { className: 'footer-head' });
  if (newsletter) head.append(buildNewsletter(newsletter));
  if (utility) head.append(buildUtilityBar(utility));

  const main = el('div', { className: 'footer-container footer-main' });
  if (columns) main.append(buildColumns(columns));
  if (panels) main.append(buildAccordion(panels));
  if (otherSites) main.append(buildOtherSites(otherSites));
  if (legal) main.append(buildLegal(legal));

  block.append(head, main);
}
