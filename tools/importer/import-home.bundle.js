/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-home.js
  var import_home_exports = {};
  __export(import_home_exports, {
    default: () => import_home_default
  });

  // tools/importer/parsers/hero-collage.js
  function parse(element, { document: document2 }) {
    let images = Array.from(element.querySelectorAll("img.cover-image"));
    if (!images.length) images = Array.from(element.querySelectorAll("img"));
    const heading = element.querySelector("h1, h2, .h1-heading");
    const subheading = element.querySelector("p.subheading") || element.querySelector("p");
    let ctas = Array.from(element.querySelectorAll(".button-group a"));
    if (!ctas.length) ctas = Array.from(element.querySelectorAll("a.button"));
    if (!heading && !subheading && !images.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    if (images.length) cells.push([images]);
    const contentCell = [];
    if (heading) contentCell.push(heading);
    if (subheading) contentCell.push(subheading);
    if (ctas.length) {
      ctas.forEach((a) => {
        const p = document2.createElement("p");
        if (a.classList.contains("secondary-button")) {
          const em = document2.createElement("em");
          em.append(a);
          p.append(em);
        } else {
          const strong = document2.createElement("strong");
          strong.append(a);
          p.append(strong);
        }
        contentCell.push(p);
      });
    }
    cells.push([contentCell]);
    const block = WebImporter.Blocks.createBlock(document2, { name: "hero-collage", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-feature.js
  function parse2(element, { document: document2 }) {
    const columns = Array.from(element.querySelectorAll(":scope > div"));
    const imageCol = columns.find((c) => c.querySelector("img") && !c.querySelector("h1, h2, h3, h4")) || null;
    const textCol = columns.find((c) => c.querySelector("h1, h2, h3, h4")) || columns[columns.length - 1];
    const image = imageCol ? imageCol.querySelector("img.cover-image") || imageCol.querySelector("img") : null;
    const heading = textCol ? textCol.querySelector("h1, h2, h3, h4") : null;
    if (!heading && !image) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const textCell = [];
    const breadcrumbs = textCol ? textCol.querySelector(".breadcrumbs") : null;
    if (breadcrumbs) {
      const links = Array.from(breadcrumbs.querySelectorAll("a"));
      if (links.length) {
        const p = document2.createElement("p");
        links.forEach((a, i) => {
          if (i > 0) p.append(document2.createTextNode(" "));
          const link = document2.createElement("a");
          link.href = a.getAttribute("href");
          link.textContent = a.textContent.trim();
          p.append(link);
        });
        textCell.push(p);
      }
    }
    if (heading) textCell.push(heading);
    const metaRows = textCol ? Array.from(textCol.querySelectorAll(".flex-horizontal")) : [];
    metaRows.forEach((row) => {
      const parts = Array.from(row.querySelectorAll("span")).map((s) => s.textContent.trim()).filter(Boolean);
      const text = parts.length ? parts.join(" ") : row.textContent.trim();
      if (text) {
        const p = document2.createElement("p");
        p.textContent = text;
        textCell.push(p);
      }
    });
    if (!metaRows.length && textCol) {
      textCol.querySelectorAll("p").forEach((p) => textCell.push(p));
    }
    const cells = [[image || "", textCell]];
    const block = WebImporter.Blocks.createBlock(document2, { name: "columns-feature", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-gallery.js
  function parse3(element, { document: document2 }) {
    let tiles = Array.from(element.querySelectorAll(":scope > .utility-aspect-1x1"));
    if (!tiles.length) tiles = Array.from(element.querySelectorAll(":scope > div"));
    const images = tiles.map((tile) => tile.querySelector("img")).filter(Boolean);
    if (!images.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const colMatch = (element.className || "").match(/desktop-(\d+)-column/);
    const cols = colMatch ? parseInt(colMatch[1], 10) : 4;
    const cells = [];
    for (let i = 0; i < images.length; i += cols) {
      const row = images.slice(i, i + cols);
      while (row.length < cols) row.push("");
      cells.push(row);
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "columns-gallery", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/tabs-testimonial.js
  function textParagraph(document2, text, bold) {
    const p = document2.createElement("p");
    if (bold) {
      const strong = document2.createElement("strong");
      strong.textContent = text;
      p.append(strong);
    } else {
      p.textContent = text;
    }
    return p;
  }
  function nameAndRole(container) {
    if (!container) return { name: "", role: "" };
    const strong = container.querySelector("strong");
    const name = strong ? strong.textContent.trim() : "";
    let role = "";
    const divs = Array.from(container.querySelectorAll("div")).filter((d) => !d.querySelector("div, img, p") && !d.querySelector("strong"));
    const roleDiv = divs.find((d) => d.textContent.trim() && d.textContent.trim() !== name);
    if (roleDiv) role = roleDiv.textContent.trim();
    return { name, role };
  }
  function parse4(element, { document: document2 }) {
    let panes = Array.from(element.querySelectorAll(".tabs-content > .tab-pane"));
    if (!panes.length) panes = Array.from(element.querySelectorAll('.tab-pane, [role="tabpanel"]'));
    const buttons = Array.from(element.querySelectorAll(".tab-menu .tab-menu-link, .tab-menu-link")).filter((b, i, arr) => arr.indexOf(b) === i);
    if (!panes.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    panes.forEach((pane, i) => {
      const idx = (pane.id || "").replace(/^tabpanel-/, "");
      const button = buttons.find((b) => b.id === `tab-${idx}`) || buttons[i] || null;
      const panelImg = pane.querySelector("img");
      const quote = pane.querySelector("p");
      const textCol = quote ? quote.parentElement : pane;
      const { name, role } = nameAndRole(textCol.querySelector(":scope > div") || textCol);
      const panelCell = [];
      if (panelImg) panelCell.push(panelImg);
      if (name) panelCell.push(textParagraph(document2, name, true));
      if (role) panelCell.push(textParagraph(document2, role, false));
      if (quote) panelCell.push(quote);
      const labelCell = [];
      if (button) {
        const avatar = button.querySelector(".avatar img") || button.querySelector("img");
        if (avatar) {
          if (!avatar.getAttribute("alt") && name) avatar.setAttribute("alt", name);
          labelCell.push(avatar);
        }
        const info = nameAndRole(button);
        const labelName = info.name || name;
        const labelRole = info.role || role;
        if (labelName) labelCell.push(textParagraph(document2, labelName, true));
        if (labelRole) labelCell.push(textParagraph(document2, labelRole, false));
      } else {
        if (name) labelCell.push(textParagraph(document2, name, true));
        if (role) labelCell.push(textParagraph(document2, role, false));
      }
      cells.push([labelCell.length ? labelCell : "", panelCell.length ? panelCell : ""]);
    });
    const block = WebImporter.Blocks.createBlock(document2, { name: "tabs-testimonial", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-article.js
  function parse5(element, { document: document2 }) {
    let items = Array.from(element.querySelectorAll(".article-card-body")).map((body) => ({
      body,
      image: body.parentElement ? body.parentElement.querySelector(".article-card-image img, img") : null,
      href: body.closest("a") ? body.closest("a").getAttribute("href") : null
    }));
    if (!items.length) {
      items = Array.from(element.querySelectorAll(":scope > a.article-card, :scope > a.card-link")).map((card) => ({
        body: card,
        image: card.querySelector("img"),
        href: card.getAttribute("href")
      }));
    }
    if (!items.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    items.forEach(({ body, image, href }) => {
      const textCell = [];
      const meta = body.querySelector(".article-card-meta");
      if (meta) {
        const p = document2.createElement("p");
        const tag = meta.querySelector(".tag");
        if (tag && tag.textContent.trim()) {
          const em = document2.createElement("em");
          em.textContent = tag.textContent.trim();
          p.append(em);
        }
        Array.from(meta.querySelectorAll("span")).filter((s) => s !== tag && s.textContent.trim()).forEach((s) => p.append(document2.createTextNode(` ${s.textContent.trim()}`)));
        if (p.textContent.trim()) textCell.push(p);
      }
      const heading = body.querySelector("h1, h2, h3, h4, h5, h6");
      if (heading) {
        if (href && !heading.querySelector("a")) {
          const a = document2.createElement("a");
          a.href = href;
          a.textContent = heading.textContent.trim();
          heading.textContent = "";
          heading.append(a);
        }
        textCell.push(heading);
      } else if (href) {
        const p = document2.createElement("p");
        const a = document2.createElement("a");
        a.href = href;
        a.textContent = href;
        p.append(a);
        textCell.push(p);
      }
      cells.push([image || "", textCell.length ? textCell : ""]);
    });
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards-article", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/accordion-faq.js
  function parse6(element, { document: document2 }) {
    let items = Array.from(element.querySelectorAll(":scope > details.faq-item"));
    if (!items.length) items = Array.from(element.querySelectorAll("details"));
    const cells = [];
    items.forEach((item) => {
      const summary = item.querySelector("summary.faq-question") || item.querySelector("summary");
      const questionEl = summary ? summary.querySelector("span") || summary : null;
      const question = questionEl ? questionEl.textContent.trim() : "";
      const answerEl = item.querySelector(".faq-answer") || Array.from(item.children).find((c) => c.tagName !== "SUMMARY");
      let answer = [];
      if (answerEl) {
        answer = Array.from(answerEl.children).filter((c) => c.textContent.trim() || c.querySelector("img"));
        if (!answer.length && answerEl.textContent.trim()) {
          const p = document2.createElement("p");
          p.textContent = answerEl.textContent.trim();
          answer = [p];
        }
      }
      if (!question && !answer.length) return;
      cells.push([question || "", answer.length ? answer : ""]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "accordion-faq", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/hero-banner.js
  function parse7(element, { document: document2 }) {
    const bgImage = element.querySelector("img.cover-image") || element.querySelector("img");
    const body = element.querySelector(".card-body") || element;
    const heading = body.querySelector("h1, h2, h3");
    const description = body.querySelector("p.subheading") || body.querySelector("p");
    let ctas = Array.from(body.querySelectorAll(".button-group a"));
    if (!ctas.length) ctas = Array.from(body.querySelectorAll("a.button"));
    if (!heading && !description && !bgImage) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    if (bgImage) cells.push([bgImage]);
    const contentCell = [];
    if (heading) contentCell.push(heading);
    if (description) contentCell.push(description);
    ctas.forEach((a) => {
      const p = document2.createElement("p");
      const strong = document2.createElement("strong");
      strong.append(a);
      p.append(strong);
      contentCell.push(p);
    });
    cells.push([contentCell]);
    const block = WebImporter.Blocks.createBlock(document2, { name: "hero-banner", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/wknd-trendsetters-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        // Found: <a href="#main-content" class="skip-link">Skip to main content</a>
        "a.skip-link",
        // Found: <div class="navbar"> (logo, nav-menu, mega-menu, subscribe button)
        "div.navbar",
        // Found: <footer class="footer inverse-footer">
        "footer.footer.inverse-footer"
      ]);
      element.querySelectorAll("*").forEach((el) => {
        Array.from(el.attributes).forEach((attr) => {
          if (attr.name.startsWith("data-astro-cid")) el.removeAttribute(attr.name);
        });
      });
    }
  }

  // tools/importer/transformers/wknd-trendsetters-sections.js
  var SECTION_MARKER_ATTR = "data-excat-section-id";
  function querySection(root, selectors) {
    const list = Array.isArray(selectors) ? selectors : [selectors];
    for (const sel of list) {
      if (!sel) continue;
      const el = root.querySelector(sel);
      if (el) return el;
    }
    return null;
  }
  function transform2(hookName, element, payload) {
    const sections = payload && payload.template && payload.template.sections || [];
    if (sections.length < 2) return;
    if (hookName === "beforeTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (i === 0 && !section.style) continue;
        const sectionEl = querySection(element, section.selector);
        if (!sectionEl) continue;
        const hr = document.createElement("hr");
        if (section.style) hr.setAttribute(SECTION_MARKER_ATTR, section.id);
        sectionEl.before(hr);
      }
    }
    if (hookName === "afterTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (!section.style) continue;
        const marker = element.querySelector(`[${SECTION_MARKER_ATTR}="${section.id}"]`);
        const anchor = marker || querySection(element, section.selector);
        if (!anchor) continue;
        const metadataBlock = WebImporter.Blocks.createBlock(document, {
          name: "Section Metadata",
          cells: { style: section.style }
        });
        anchor.after(metadataBlock);
        if (marker) {
          marker.removeAttribute(SECTION_MARKER_ATTR);
          if (i === 0) marker.remove();
        }
      }
    }
  }

  // tools/importer/import-home.js
  var parsers = {
    "hero-collage": parse,
    "columns-feature": parse2,
    "columns-gallery": parse3,
    "tabs-testimonial": parse4,
    "cards-article": parse5,
    "accordion-faq": parse6,
    "hero-banner": parse7
  };
  var PAGE_TEMPLATE = {
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
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : []
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: PAGE_TEMPLATE });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document2, template) {
    const pageBlocks = [];
    template.blocks.forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        const elements = document2.querySelectorAll(selector);
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
  var import_home_default = {
    transform: (payload) => {
      const { document: document2, url, params } = payload;
      const main = document2.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document2, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
        const parser = parsers[block.name];
        if (parser) {
          try {
            parser(block.element, { document: document2, url, params });
          } catch (e) {
            console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
          }
        } else {
          console.warn(`No parser found for block: ${block.name}`);
        }
      });
      executeTransformers("afterTransform", main, payload);
      const hr = document2.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document2);
      WebImporter.rules.transformBackgroundImages(main, document2);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: {
          title: document2.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_home_exports);
})();
