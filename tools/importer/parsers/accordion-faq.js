/* eslint-disable */
/* global WebImporter */
/**
 * Parser for accordion-faq. Base: accordion.
 * Source: https://www.wknd-trendsetters.site/ (faq .faq-list)
 * Target model (blocks/accordion-faq): one row per item, 2 columns:
 *   col 1 = question text, col 2 = answer content.
 * The decorative +/- icon (data: SVG img inside summary) is dropped.
 * Selectors validated against migration-work/block-context/accordion-faq/source.html.
 */
export default function parse(element, { document }) {
  let items = Array.from(element.querySelectorAll(':scope > details.faq-item'));
  if (!items.length) items = Array.from(element.querySelectorAll('details'));

  const cells = [];
  items.forEach((item) => {
    const summary = item.querySelector('summary.faq-question') || item.querySelector('summary');
    const questionEl = summary ? (summary.querySelector('span') || summary) : null;
    const question = questionEl ? questionEl.textContent.trim() : '';

    const answerEl = item.querySelector('.faq-answer')
      || Array.from(item.children).find((c) => c.tagName !== 'SUMMARY');
    let answer = [];
    if (answerEl) {
      answer = Array.from(answerEl.children).filter((c) => c.textContent.trim() || c.querySelector('img'));
      if (!answer.length && answerEl.textContent.trim()) {
        const p = document.createElement('p');
        p.textContent = answerEl.textContent.trim();
        answer = [p];
      }
    }

    if (!question && !answer.length) return;
    cells.push([question || '', answer.length ? answer : '']);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'accordion-faq', cells });
  element.replaceWith(block);
}
