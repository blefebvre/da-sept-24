/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroCollageParser from './parsers/hero-collage.js';
import columnsFeatureParser from './parsers/columns-feature.js';
import columnsGalleryParser from './parsers/columns-gallery.js';
import tabsTestimonialParser from './parsers/tabs-testimonial.js';
import cardsArticleParser from './parsers/cards-article.js';
import accordionFaqParser from './parsers/accordion-faq.js';
import heroBannerParser from './parsers/hero-banner.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/wknd-trendsetters-cleanup.js';
import sectionsTransformer from './transformers/wknd-trendsetters-sections.js';

// PARSER REGISTRY
const parsers = {
  'hero-collage': heroCollageParser,
  'columns-feature': columnsFeatureParser,
  'columns-gallery': columnsGalleryParser,
  'tabs-testimonial': tabsTestimonialParser,
  'cards-article': cardsArticleParser,
  'accordion-faq': accordionFaqParser,
  'hero-banner': heroBannerParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  "name": "home",
  "description": "WKND Trendsetters homepage: collage hero, featured story, photo gallery, testimonials, latest articles, FAQ and closing CTA banner",
  "urls": [
    "https://www.wknd-trendsetters.site/"
  ],
  "blocks": [
    {
      "name": "hero-collage",
      "instances": [
        "#main-content > header.section.secondary-section"
      ]
    },
    {
      "name": "columns-feature",
      "instances": [
        "#main-content > section.section:nth-of-type(1) > div.container > div.grid-layout"
      ]
    },
    {
      "name": "columns-gallery",
      "instances": [
        "#main-content > section.section.secondary-section:nth-of-type(2) > div.container > div.grid-layout.desktop-4-column"
      ]
    },
    {
      "name": "tabs-testimonial",
      "instances": [
        "#main-content > section.section:nth-of-type(3) .tabs-wrapper"
      ]
    },
    {
      "name": "cards-article",
      "instances": [
        "#main-content > section.section.secondary-section:nth-of-type(4) > div.container > div.grid-layout.desktop-4-column"
      ]
    },
    {
      "name": "accordion-faq",
      "instances": [
        "#main-content > section.section:nth-of-type(5) .faq-list"
      ]
    },
    {
      "name": "hero-banner",
      "instances": [
        "#main-content > section.section.inverse-section"
      ]
    }
  ],
  "sections": [
    {
      "id": "rc1",
      "name": "intro-hero",
      "selector": [
        "#main-content > header.section.secondary-section",
        "header.section.secondary-section"
      ],
      "style": "grey",
      "blocks": [
        "hero-collage"
      ],
      "defaultContent": []
    },
    {
      "id": "rc2",
      "name": "featured-story",
      "selector": [
        "#main-content > section.section:nth-of-type(1)"
      ],
      "style": null,
      "blocks": [
        "columns-feature"
      ],
      "defaultContent": []
    },
    {
      "id": "rc3",
      "name": "photo-gallery",
      "selector": [
        "#main-content > section.section.secondary-section:nth-of-type(2)"
      ],
      "style": "grey",
      "blocks": [
        "columns-gallery"
      ],
      "defaultContent": [
        "#main-content > section.section.secondary-section:nth-of-type(2) > div.container > div.utility-text-align-center"
      ]
    },
    {
      "id": "rc4",
      "name": "testimonials",
      "selector": [
        "#main-content > section.section:nth-of-type(3)"
      ],
      "style": null,
      "blocks": [
        "tabs-testimonial"
      ],
      "defaultContent": []
    },
    {
      "id": "rc5",
      "name": "latest-articles",
      "selector": [
        "#main-content > section.section.secondary-section:nth-of-type(4)"
      ],
      "style": "grey",
      "blocks": [
        "cards-article"
      ],
      "defaultContent": [
        "#main-content > section.section.secondary-section:nth-of-type(4) > div.container > div.utility-text-align-center"
      ]
    },
    {
      "id": "rc6",
      "name": "faq",
      "selector": [
        "#main-content > section.section:nth-of-type(5)"
      ],
      "style": "faq-split",
      "blocks": [
        "accordion-faq"
      ],
      "defaultContent": [
        "#main-content > section.section:nth-of-type(5) > div.container > div.grid-layout > div:first-child"
      ]
    },
    {
      "id": "rc7",
      "name": "closing-cta",
      "selector": [
        "#main-content > section.section.inverse-section",
        "section.section.inverse-section"
      ],
      "style": "dark",
      "blocks": [
        "hero-banner"
      ],
      "defaultContent": []
    }
  ]
};

// TRANSFORMER REGISTRY - cleanup first, then section breaks/metadata
const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
];

/**
 * Execute all page transformers for a specific hook
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
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
        pageBlocks.push({ name: blockDef.name, selector, element, section: blockDef.section || null });
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

    // 3. Parse each block (skip elements already replaced by an earlier parser)
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

    // 4. Final cleanup + Section Metadata
    executeTransformers('afterTransform', main, payload);

    // 5. WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Sanitized path (root URL maps to /index)
    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

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
