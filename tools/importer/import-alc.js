/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import carouselHeroParser from './parsers/carousel-hero.js';
import carouselWinnersParser from './parsers/carousel-winners.js';
import cardsGameParser from './parsers/cards-game.js';
import cardsPromoParser from './parsers/cards-promo.js';

// TRANSFORMER IMPORTS
import alcCleanupTransformer from './transformers/alc-cleanup.js';
import alcSectionsTransformer from './transformers/alc-sections.js';

// PARSER REGISTRY
const parsers = {
  'carousel-hero': carouselHeroParser,
  'carousel-winners': carouselWinnersParser,
  'cards-game': cardsGameParser,
  'cards-promo': cardsPromoParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'alc',
  description: 'ALC homepage: hero promo carousel, recent winners slider, featured game tiles with right-rail promos',
  urls: [
    'https://www.alc.ca/content/alc/en.html',
  ],
  blocks: [
    {
      name: 'carousel-hero',
      instances: ['div.carousel.list.parbase.hero'],
    },
    {
      name: 'carousel-winners',
      instances: ['div.winners-carousel'],
    },
    {
      name: 'cards-game',
      instances: ['main.alc-container.cmp-container--game-tiles'],
    },
    {
      name: 'cards-promo',
      instances: ['div.alc-container.cmp-container--hide-column-gutters'],
    },
  ],
  sections: [
    {
      id: '1',
      name: 'hero-promo-carousel',
      selector: ['div.carousel.list.parbase.hero'],
      style: null,
      blocks: ['carousel-hero'],
      defaultContent: [],
    },
    {
      id: '2',
      name: 'recent-winners',
      selector: ['div.section-header.cmp-section-header--alc-blue'],
      style: 'winners',
      blocks: ['carousel-winners'],
      defaultContent: ['div.section-header.cmp-section-header--alc-blue'],
    },
    {
      id: '3',
      name: 'featured-games-and-promotions',
      selector: [
        'div.aem-Grid > div.alc-container:has(.cmp-container--game-tiles)',
        'div.section-header.cmp-section-header--alc-green',
      ],
      style: 'featured',
      blocks: ['cards-game', 'cards-promo'],
      defaultContent: ['div.section-header.cmp-section-header--alc-green'],
    },
  ],
};

// TRANSFORMER REGISTRY - section transformer runs after cleanup
const transformers = [
  alcCleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [alcSectionsTransformer] : []),
];

/**
 * Execute all page transformers for a specific hook
 * @param {string} hookName - 'beforeTransform' or 'afterTransform'
 * @param {Element} element - The DOM element to transform
 * @param {Object} payload - { document, url, html, params }
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = {
    ...payload,
    template: PAGE_TEMPLATE,
  };

  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all blocks on the page based on the embedded template configuration
 * @param {Document} document - The DOM document
 * @param {Object} template - The embedded PAGE_TEMPLATE object
 * @returns {Array} Array of block instances found on the page
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

export default {
  transform: (payload) => {
    const { document, url, params } = payload;

    const main = document.body;

    // 1. Initial cleanup + section break markers
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks on page
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block (skip elements already replaced by a prior parser)
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. Final cleanup + section metadata
    executeTransformers('afterTransform', main, payload);

    // 5. WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Path: the ALC English homepage (/content/alc/en.html) becomes the site root /index
    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '')
      .replace(/^\/content\/alc/, '');
    const isHome = rawPath === '' || rawPath === '/en';
    const path = WebImporter.FileUtils.sanitizePath(isHome ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
