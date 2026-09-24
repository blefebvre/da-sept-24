const OPTION_CLASSES = [];

/**
 * Accordion (FAQ): expandable question/answer items using native
 * <details>/<summary>. Each row: col 1 = question, col 2 = answer.
 * Single-cell rows use the first element as the question and the rest as answer.
 * @param {Element} block
 */
export default function decorate(block) {
  // eslint-disable-next-line no-unused-vars
  const active = [...block.classList].filter((c) => OPTION_CLASSES.includes(c));

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    if (!row.textContent.trim()) {
      row.remove();
      return;
    }

    let label = cells[0];
    let body = cells.slice(1);
    if (cells.length === 1 && label.children.length > 1) {
      const [first, ...rest] = [...label.children];
      label = first;
      const wrap = document.createElement('div');
      wrap.append(...rest);
      body = [wrap];
    }

    const summary = document.createElement('summary');
    summary.className = 'accordion-faq-item-label';
    const question = document.createElement('span');
    question.className = 'accordion-faq-item-question';
    question.append(...label.childNodes);
    const icon = document.createElement('span');
    icon.className = 'accordion-faq-item-icon';
    icon.setAttribute('aria-hidden', 'true');
    summary.append(question, icon);

    const answer = document.createElement('div');
    answer.className = 'accordion-faq-item-body';
    body.forEach((cell) => answer.append(...cell.childNodes));

    const details = document.createElement('details');
    details.className = 'accordion-faq-item';
    details.append(summary, answer);
    row.replaceWith(details);
  });
}
