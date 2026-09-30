/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import widgetParser from './parsers/widget.js';
import tabsGameParser from './parsers/tabs-game.js';
import columnsWinnerParser from './parsers/columns-winner.js';
import cardsGameParser from './parsers/cards-game.js';
import accordionGameParser from './parsers/accordion-game.js';
import embedVideoParser from './parsers/embed-video.js';
import tablePrizeParser from './parsers/table-prize.js';

// TRANSFORMER IMPORTS
import lottoCleanupTransformer from './transformers/lotto-cleanup.js';
import alcSectionsTransformer from './transformers/alc-sections.js';
import alcLinksTransformer from './transformers/alc-links.js';

// PARSER REGISTRY
const parsers = {
  widget: widgetParser,
  'tabs-game': tabsGameParser,
  'columns-winner': columnsWinnerParser,
  'cards-game': cardsGameParser,
  'accordion-game': accordionGameParser,
  'embed-video': embedVideoParser,
  'table-prize': tablePrizeParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json (template "lotto")
const PAGE_TEMPLATE = {
  name: 'lotto',
  description: 'Game detail page (lotto): draw hero with live winning numbers + jackpot widgets, tabbed game info (prize payout, winners, how to play) with fragment-backed panels, winner promo, other-games rail',
  urls: [
    'https://www.alc.ca/content/alc/en/our-games/lotto/lotto-6-49.html',
  ],
  blocks: [
    {
      name: 'widget',
      instances: [
        '#draw-subcomponent > div.draw--full.row > div.draw--full__winning-numbers',
        '#draw-subcomponent > div.draw--full.row > div.draw--full__jackpot',
        '.prize-payout-content > div.payout-tables',
        '.winners-tab-content > div.winners-list',
      ],
    },
    { name: 'tabs-game', instances: ['div.content > div.tabs'] },
    { name: 'columns-winner', instances: ['div.content div.winners-promo'] },
    { name: 'cards-game', instances: ['#promos div.game-tile'] },
    { name: 'accordion-game', instances: ['.how-to-play-content .panel-group'] },
    { name: 'embed-video', instances: ['.how-to-play-content iframe'] },
    { name: 'table-prize', instances: ['.how-to-play-content .panel-group table'] },
  ],
  sections: [
    {
      id: '1',
      name: 'draw-hero',
      selector: ['#game-details > div.alc-external-data--draw-full'],
      style: 'lotto-draw',
      blocks: ['widget'],
      defaultContent: ['div.draw--full__jackpot__cta > a.arrow-button'],
    },
    {
      id: '2',
      name: 'share-bar',
      selector: ['#game-details > section.header.blue'],
      style: null,
      blocks: [],
      defaultContent: [],
    },
    {
      id: '3',
      name: 'game-body',
      selector: ['#game-details > div.body-content'],
      style: 'game-details',
      blocks: ['tabs-game', 'columns-winner', 'cards-game'],
      defaultContent: ['section.rewards-section > div.rewards-earn-rate', '#promos > h2'],
    },
  ],
};

// Tab panels and table-bearing accordion items become separate fragment documents,
// each parsed with its own block selectors (the template wrappers are not cloned).
const TAB_PANE_SELECTOR = 'div.content > div.tabs .tab-content > .tab-pane';
const FRAGMENT_BLOCKS = {
  'prize-payout': [{ name: 'widget', selector: 'div.payout-tables' }],
  winners: [{ name: 'widget', selector: 'div.winners-list' }],
  'how-to-play': [
    { name: 'accordion-game', selector: 'div.panel-group' },
    { name: 'embed-video', selector: 'iframe' },
  ],
  table: [{ name: 'table-prize', selector: 'table' }],
};

// Section transformer runs after cleanup (cleanup removes the share bar before breaks are placed);
// link rewriting runs last so parser-created links are covered
const transformers = [
  lottoCleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [alcSectionsTransformer] : []),
  alcLinksTransformer,
];

// Fragments only need cleanup + link rewriting (no page sections)
const fragmentTransformers = [lottoCleanupTransformer, alcLinksTransformer];

/**
 * Execute page transformers for a specific hook
 * @param {Array} list Transformers to run
 * @param {string} hookName 'beforeTransform' or 'afterTransform'
 * @param {Element} element The DOM element to transform
 * @param {Object} payload { document, url, html, params }
 */
function executeTransformers(list, hookName, element, payload) {
  const enhancedPayload = {
    ...payload,
    template: PAGE_TEMPLATE,
  };

  list.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all blocks on the page based on the embedded template configuration.
 * Elements inside the tab widget are skipped: they are parsed in their fragment documents.
 * @param {Document} document The DOM document
 * @param {Object} template The embedded PAGE_TEMPLATE object
 * @returns {Array} Block instances found on the page
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];

  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        if (blockDef.name !== 'tabs-game' && element.closest('div.tabs')) return;
        pageBlocks.push({
          name: blockDef.name,
          selector,
          element,
          section: blockDef.section || null,
        });
      });
    });
  });

  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

/**
 * Run a parser defensively
 */
function runParser(name, element, context) {
  if (!element.parentNode) return; // already replaced by an earlier parser
  const parser = parsers[name];
  if (!parser) {
    console.warn(`No parser found for block: ${name}`);
    return;
  }
  try {
    parser(element, context);
  } catch (e) {
    console.error(`Failed to parse ${name}:`, e);
  }
}

/**
 * Clone fragment sources (tab panes and accordion tables) before block parsing,
 * because the tabs-game and accordion-game parsers replace the originals.
 * @returns {Array<{ name: string, kind: string, root: Element }>}
 */
function cloneFragmentSources(document) {
  const fragments = [];
  document.querySelectorAll(TAB_PANE_SELECTOR).forEach((pane) => {
    const name = tabsGameParser.paneSlug(pane);
    if (!name) return;
    const root = document.createElement('div');
    root.append(pane.cloneNode(true));
    fragments.push({ name, kind: name, root });

    // table-bearing accordion items in the how-to-play pane get their own fragment
    // (the prize-payout pane's tables are live draw data, replaced by the prize-payout widget)
    const panelGroup = name === 'how-to-play' && pane.querySelector('div.panel-group');
    if (panelGroup) {
      accordionGameParser.tableFragmentSources(panelGroup).forEach(({ name: tableName, nodes }) => {
        const tableRoot = document.createElement('div');
        nodes.forEach((node) => tableRoot.append(node.cloneNode(true)));
        fragments.push({ name: tableName, kind: 'table', root: tableRoot });
      });
    }
  });
  return fragments;
}

/**
 * Build the page metadata block (Title, Description, Image) plus Breadcrumbs: true,
 * which drives the auto-generated breadcrumb.
 */
function createMetadataBlock(main, document) {
  const meta = {};
  if (document.title) meta.Title = document.title.replace(/[\n\t]/gm, '').trim();
  const desc = document.querySelector('meta[name="description"]');
  if (desc && desc.content) meta.Description = desc.content;
  const ogImage = document.querySelector('meta[property="og:image"]');
  if (ogImage && ogImage.content) {
    const img = document.createElement('img');
    img.src = ogImage.content;
    meta.Image = img;
  }
  meta.Breadcrumbs = 'true';
  // share bar (built client-side by the share block; the source links are script-generated)
  meta.Share = 'true';
  const block = WebImporter.Blocks.getMetadataBlock(document, meta);
  main.append(block);
}

/**
 * Page path: /content/alc/en/our-games/lotto/lotto-6-49.html -> /our-games/lotto/lotto-6-49
 * (the English site root /content/alc/en is the EDS site root, matching alc-links.js)
 */
function pagePath(originalURL) {
  const rawPath = new URL(originalURL).pathname
    .replace(/\/$/, '')
    .replace(/(\.html)+$/, '')
    .replace(/^\/content\/alc\/en/, '');
  return WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;
    const context = { document, url, params };

    // 1. Initial cleanup + section break markers
    executeTransformers(transformers, 'beforeTransform', main, payload);

    // 2. Clone fragment sources before any block parsing
    const fragments = cloneFragmentSources(document);

    // 3. Parse main-page blocks
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
    pageBlocks.forEach((block) => runParser(block.name, block.element, context));

    // 4. Parse each fragment document with its own selectors
    fragments.forEach((fragment) => {
      (FRAGMENT_BLOCKS[fragment.kind] || []).forEach(({ name, selector }) => {
        fragment.root.querySelectorAll(selector).forEach((el) => {
          if (el.parentElement && el.parentElement.closest(selector)) return; // nested match
          runParser(name, el, context);
        });
      });
    });

    // 5. Final cleanup + section metadata + link rewriting
    executeTransformers(transformers, 'afterTransform', main, payload);
    fragments.forEach((fragment) => {
      executeTransformers(fragmentTransformers, 'afterTransform', fragment.root, payload);
    });

    // 6. Metadata + WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    createMetadataBlock(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
    fragments.forEach((fragment) => {
      WebImporter.rules.adjustImageUrls(fragment.root, url, params.originalURL);
    });

    // 7. Output: the bulk importer writes one document per URL, so each fragment is imported
    //    from the same page with ?fragment=<name> (see urls-lotto.txt); no param = the page itself
    const page = tabsGameParser.pageSlug(document, url, params);
    const requested = new URL(params.originalURL).searchParams.get('fragment');
    if (requested) {
      const fragment = fragments.find((f) => f.name === requested);
      if (!fragment) throw new Error(`Fragment "${requested}" not found on ${params.originalURL}`);
      return [{
        element: fragment.root,
        path: WebImporter.FileUtils.sanitizePath(`/fragments/lotto/${page}/${fragment.name}`),
        report: {
          title: `${page} ${fragment.name}`,
          template: `${PAGE_TEMPLATE.name}-fragment`,
          blocks: (FRAGMENT_BLOCKS[fragment.kind] || []).map((b) => b.name),
        },
      }];
    }

    return [{
      element: main,
      path: pagePath(params.originalURL),
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
        fragments: fragments.map((f) => f.name),
      },
    }];
  },
};
