/**
 * Moves a cell's authored content into a table cell, unwrapping a lone paragraph
 * so simple values are not rendered with paragraph margins.
 * @param {Element} source The authored cell
 * @param {'th'|'td'} tag
 * @returns {HTMLTableCellElement}
 */
function buildCell(source, tag) {
  const cell = document.createElement(tag);
  const children = [...source.children];
  if (children.length === 1 && children[0].tagName === 'P') {
    cell.append(...children[0].childNodes);
  } else {
    cell.append(...source.childNodes);
  }
  return cell;
}

function isEmpty(cell) {
  return !cell.textContent.trim() && !cell.querySelector('picture, img, a');
}

/**
 * True when every visible text in the cell is bold (authored as a label, not a value).
 * @param {Element} cell
 */
function isEmphasized(cell) {
  if (!cell.textContent.trim()) return false;
  const walker = document.createTreeWalker(cell, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    if (node.textContent.trim()) {
      const bold = node.parentElement.closest('strong, b');
      if (!bold || !cell.contains(bold)) return false;
    }
    node = walker.nextNode();
  }
  return true;
}

/**
 * Builds a row, spanning the last cell across any missing columns.
 */
function buildRow(row, tag, columnCount, scope) {
  const tr = document.createElement('tr');
  const cells = [...row.children];
  cells.forEach((source, i) => {
    const cell = buildCell(source, tag);
    if (scope) cell.scope = scope;
    if (i === cells.length - 1 && cells.length < columnCount) {
      cell.colSpan = columnCount - cells.length + 1;
      if (tag === 'th') cell.scope = 'colgroup';
    }
    tr.append(cell);
  });
  return tr;
}

/**
 * A group label row: only the first cell has content (e.g. "Classic Draw").
 * Rendered as one full-width row header for the rows that follow.
 */
function isGroupRow(cells, columnCount) {
  return columnCount > 1 && cells.length > 1
    && !isEmpty(cells[0]) && cells.slice(1).every(isEmpty);
}

/**
 * A repeated column-label row inside the body (e.g. "$132 Wager | Total | 2/6 | ...").
 */
function isSubHeaderRow(cells) {
  const filled = cells.filter((cell) => !isEmpty(cell));
  return filled.length > 1 && filled.every(isEmphasized);
}

/**
 * When the header's last cell spans several columns ("Number of wins per category"),
 * the next row usually holds the labels of those columns, with empty cells beneath the
 * single-column headers. Returns that row if so.
 */
function findSecondHeaderRow(headerRow, nextRow, columnCount) {
  const headCount = headerRow.children.length;
  if (!nextRow || headCount >= columnCount) return null;
  const cells = [...nextRow.children];
  if (cells.length !== columnCount) return null;
  const leading = cells.slice(0, headCount - 1);
  const spanned = cells.slice(headCount - 1);
  return leading.every(isEmpty) && spanned.some((cell) => !isEmpty(cell)) ? nextRow : null;
}

export default function decorate(block) {
  const rows = [...block.children].filter((row) => row.children.length && row.textContent.trim());
  if (!rows.length) return;

  const columnCount = Math.max(...rows.map((row) => row.children.length));
  const [headerRow, ...bodyRows] = rows;
  // read before the header cells are moved into the table
  // (joined per cell: authored cells have no whitespace between them)
  const label = [...headerRow.children]
    .map((cell) => [...cell.querySelectorAll('p')].map((p) => p.textContent).join(' ') || cell.textContent)
    .map((text) => text.trim().replace(/\s+/g, ' '))
    .filter(Boolean)
    .join(', ');

  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const headTr = buildRow(headerRow, 'th', columnCount, 'col');
  thead.append(headTr);

  const secondHeader = findSecondHeaderRow(headerRow, bodyRows[0], columnCount);
  if (secondHeader) {
    bodyRows.shift();
    const headCount = headTr.children.length;
    // single-column headers span both header rows; the empty cells below them are dropped
    [...headTr.children].slice(0, headCount - 1).forEach((th) => { th.rowSpan = 2; });
    const tr = document.createElement('tr');
    [...secondHeader.children].slice(headCount - 1).forEach((source) => {
      const th = buildCell(source, 'th');
      th.scope = 'col';
      tr.append(th);
    });
    thead.append(tr);
  }
  table.append(thead);

  // group label rows and repeated sub-header rows each start a new row group
  let tbody = null;
  const startGroup = () => {
    tbody = document.createElement('tbody');
    table.append(tbody);
  };
  bodyRows.forEach((row) => {
    const cells = [...row.children];
    if (isGroupRow(cells, columnCount)) {
      startGroup();
      const tr = document.createElement('tr');
      tr.className = 'table-prize-group';
      const th = buildCell(cells[0], 'th');
      th.scope = 'rowgroup';
      tr.append(th);
      // the label sits in the first column; the remaining columns stay as empty cells
      for (let i = 1; i < columnCount; i += 1) tr.append(document.createElement('td'));
      tbody.append(tr);
    } else if (isSubHeaderRow(cells)) {
      startGroup();
      const tr = buildRow(row, 'th', columnCount, 'col');
      tr.className = 'table-prize-subheader';
      tr.firstElementChild.scope = 'rowgroup';
      tbody.append(tr);
    } else {
      if (!tbody) startGroup();
      tbody.append(buildRow(row, 'td', columnCount));
    }
  });

  // zebra striping runs across the whole table (header and all row groups),
  // which :nth-child cannot express once rows are split into several tbody elements
  [...table.rows].forEach((tr, i) => tr.classList.toggle('table-prize-alt', i % 2 === 1));

  // wide tables scroll horizontally on small screens instead of overflowing the page
  const scroller = document.createElement('div');
  scroller.className = 'table-prize-scroll';
  scroller.tabIndex = 0;
  if (label) {
    scroller.setAttribute('role', 'region');
    scroller.setAttribute('aria-label', label.length > 80 ? `${label.slice(0, 77)}...` : label);
  }
  scroller.append(table);

  block.replaceChildren(scroller);
}
