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

  // tools/importer/import-alc.js
  var import_alc_exports = {};
  __export(import_alc_exports, {
    default: () => import_alc_default
  });

  // tools/importer/parsers/carousel-hero.js
  function resolveImage(slide, document2) {
    const content = slide.querySelector(".slide-content, .picturefill-background") || slide;
    const existing = content.querySelector("img");
    if (existing && existing.getAttribute("src")) {
      if (!existing.getAttribute("alt")) existing.setAttribute("alt", "");
      return existing;
    }
    const spans = [...content.querySelectorAll("span[data-src]")];
    let src = "";
    if (spans.length) {
      const desktop = spans.find((s) => /1200/.test(s.getAttribute("data-media") || ""));
      src = (desktop || spans[spans.length - 1]).getAttribute("data-src");
    }
    if (!src) {
      const style = content.getAttribute("style") || "";
      const m = style.match(/background-image:\s*url\(["']?([^"')]+)["']?\)/i);
      if (m) src = m[1];
    }
    if (!src) return null;
    const img = document2.createElement("img");
    img.src = src;
    img.alt = "";
    return img;
  }
  function parse(element, { document: document2 }) {
    let slides = [...element.querySelectorAll(":scope ul.slides > li.slide")];
    if (!slides.length) slides = [...element.querySelectorAll("li.slide, .fca-carousel-slide-promo article")];
    const cells = [];
    slides.forEach((slide) => {
      const img = resolveImage(slide, document2);
      const link = slide.querySelector("article a[href], a[href]");
      const ctaCell = [];
      if (link) {
        const cta = document2.createElement("a");
        cta.href = link.getAttribute("href");
        const label = link.textContent.replace(/Time Remaining:|hr|min|sec/g, "").trim();
        cta.textContent = label || "Play now";
        const p = document2.createElement("p");
        p.append(cta);
        ctaCell.push(p);
      }
      if (!img && !ctaCell.length) return;
      const imageCell = [];
      if (img) {
        imageCell.push(img);
        const src = img.getAttribute("src") || "";
        if (/\/imageD\./.test(src)) {
          ["/imageM.", "/imageT."].forEach((rendition) => {
            const variant = document2.createElement("img");
            variant.src = src.replace("/imageD.", rendition);
            variant.alt = img.getAttribute("alt") || "";
            imageCell.push(variant);
          });
        }
      }
      cells.push([imageCell.length ? imageCell : "", ctaCell.length ? ctaCell : ""]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "carousel-hero", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/carousel-winners.js
  function bgUrl(el) {
    if (!el) return "";
    const style = el.getAttribute("style") || "";
    const m = style.match(/background-image:\s*url\(\s*["']?([^"')]+)["']?\s*\)/i);
    return m ? m[1].trim() : "";
  }
  function formatPrize(prizeEl) {
    if (!prizeEl) return "";
    const groups = [...prizeEl.querySelectorAll(":scope > span")].map((s) => s.textContent.replace(/[^0-9]/g, "")).filter(Boolean);
    const digits = groups.length ? groups.join("") : prizeEl.textContent.replace(/[^0-9]/g, "");
    if (!digits) return "";
    return `$${Number(digits).toLocaleString("en-US")}`;
  }
  function parse2(element, { document: document2 }) {
    let slides = [...element.querySelectorAll(".slick-track > .slick-slide:not(.slick-cloned)")];
    if (!slides.length) slides = [...element.querySelectorAll(".slide")];
    const cells = [];
    slides.forEach((slide) => {
      const photoWrap = slide.querySelector(".winner-image");
      let photo = photoWrap ? photoWrap.querySelector("img") : null;
      if (!photo) {
        const src = bgUrl(photoWrap);
        if (src) {
          photo = document2.createElement("img");
          photo.src = src;
        }
      }
      const info = slide.querySelector(".winner-info") || slide;
      const nameEl = info.querySelector("h3, h2, h4");
      const locationEl = info.querySelector("span.h2, .location");
      const ctaEl = info.querySelector("a.all-winners, a.button, a[href]");
      const logoEl = slide.querySelector(".prize-details img.winning-game-logo, .prize-details img");
      const prizeText = formatPrize(slide.querySelector(".prize-amount"));
      const name = nameEl ? nameEl.textContent.trim() : "";
      if (photo) photo.alt = name ? `${name}` : photo.alt || "";
      const content = [];
      if (logoEl) {
        const p = document2.createElement("p");
        if (!logoEl.getAttribute("alt")) logoEl.setAttribute("alt", "game logo");
        p.append(logoEl);
        content.push(p);
      }
      if (prizeText) {
        const h = document2.createElement("h3");
        h.textContent = prizeText;
        content.push(h);
      }
      if (name) {
        const p = document2.createElement("p");
        const strong = document2.createElement("strong");
        strong.textContent = name;
        p.append(strong);
        content.push(p);
      }
      if (locationEl && locationEl.textContent.trim()) {
        const p = document2.createElement("p");
        p.textContent = locationEl.textContent.trim();
        content.push(p);
      }
      if (ctaEl) {
        const a = document2.createElement("a");
        a.href = ctaEl.getAttribute("href").replace(/(\.html)+(?=$|[?#])/, ".html");
        a.textContent = ctaEl.textContent.trim() || "See all winners";
        const p = document2.createElement("p");
        p.append(a);
        content.push(p);
      }
      if (!photo && !content.length) return;
      cells.push([photo || "", content.length ? content : ""]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "carousel-winners", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-game.js
  function tileImage(container, document2) {
    if (!container) return null;
    const img = container.querySelector(":scope > img");
    if (img && img.getAttribute("src")) return img;
    const style = container.getAttribute("style") || "";
    const m = style.match(/background-image:\s*url\(\s*["']?([^"')]+)["']?\s*\)/i);
    if (!m) return null;
    const el = document2.createElement("img");
    el.src = m[1].trim();
    el.alt = "";
    return el;
  }
  function parse3(element, { document: document2 }) {
    let tiles = [...element.querySelectorAll("div.game-tile.parbase")];
    if (!tiles.length) tiles = [...element.querySelectorAll("article.game-tile")];
    const cells = [];
    tiles.forEach((tile) => {
      const image = tileImage(tile.querySelector(".game-tile-image-container"), document2);
      const content = tile.querySelector(".game-tile-content") || tile;
      const titleEl = content.querySelector(".game-tile-title, h3, h2");
      const descEl = content.querySelector(".game-tile-description");
      const ctaEl = content.querySelector(":scope > a.button, a.arrow-button");
      const body = [];
      if (titleEl && titleEl.textContent.trim()) {
        const h3 = document2.createElement("h3");
        h3.textContent = titleEl.textContent.trim();
        body.push(h3);
      }
      if (descEl) {
        [...descEl.children].forEach((child) => {
          if (child.textContent.trim()) body.push(child);
        });
        if (!descEl.children.length && descEl.textContent.trim()) {
          const p = document2.createElement("p");
          p.textContent = descEl.textContent.trim();
          body.push(p);
        }
      }
      if (ctaEl) {
        const a = document2.createElement("a");
        a.href = ctaEl.getAttribute("href");
        a.textContent = ctaEl.textContent.trim() || ctaEl.getAttribute("title") || "Learn more";
        const p = document2.createElement("p");
        p.append(a);
        body.push(p);
      }
      if (!image && !body.length) return;
      cells.push([image || "", body.length ? body : ""]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards-game", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-promo.js
  var ORIGIN = "https://www.alc.ca";
  function absolute(url) {
    if (!url) return "";
    const u = url.trim().split(/\s+/)[0];
    if (/^https?:\/\//i.test(u)) return u;
    if (u.startsWith("//")) return `https:${u}`;
    if (u.startsWith("/")) return `${ORIGIN}${u}`;
    return u;
  }
  function isExcluded(el) {
    return !!el.closest(".html-promo, .alc-mobile-banner, .banner, .hide-content");
  }
  function parse4(element, { document: document2 }) {
    let items = [...element.querySelectorAll("div.reference.parbase")].filter((el) => !isExcluded(el));
    if (!items.length) {
      items = [...element.querySelectorAll(".cmp-image")].filter((el) => !isExcluded(el));
    }
    const cells = [];
    items.forEach((item) => {
      const imgEl = item.querySelector("picture img, img");
      const linkEl = item.querySelector("a[href]");
      if (!imgEl && !linkEl) return;
      let image = "";
      if (imgEl) {
        const picture = imgEl.closest("picture");
        const desktop = picture && [...picture.querySelectorAll("source[srcset]")].find((s) => /1200/.test(s.getAttribute("media") || ""));
        const src = absolute(desktop && desktop.getAttribute("srcset") || imgEl.getAttribute("src"));
        const desktopImg = document2.createElement("img");
        desktopImg.src = src;
        desktopImg.alt = imgEl.getAttribute("alt") || "";
        image = [desktopImg];
        if (/\/imageD\./.test(src)) {
          const mobileImg = document2.createElement("img");
          mobileImg.src = src.replace("/imageD.", "/imageM.");
          mobileImg.alt = desktopImg.alt;
          image.push(mobileImg);
        }
      }
      let linkCell = "";
      if (linkEl) {
        const a = document2.createElement("a");
        a.href = linkEl.getAttribute("href");
        a.textContent = linkEl.textContent.trim() || linkEl.getAttribute("title") || imgEl && imgEl.getAttribute("alt") || "Learn more";
        const p = document2.createElement("p");
        p.append(a);
        linkCell = p;
      }
      cells.push([image, linkCell]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards-promo", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/alc-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function convertMobilePromo(element, document2) {
    element.querySelectorAll("div.html-promo").forEach((promo) => {
      const link = promo.querySelector("a[href]");
      const spans = [...promo.querySelectorAll("span[data-src]")];
      const mobile = spans.find((sp) => (sp.getAttribute("data-media") || "").includes("320px")) || spans[0];
      let src = mobile ? mobile.getAttribute("data-src") : "";
      if (!src && link) {
        const m = (link.getAttribute("style") || "").match(/url\(["']?([^"')]+)["']?\)/i);
        if (m) [, src] = m;
      }
      const img = promo.querySelector("img");
      if (!src && img) src = img.getAttribute("src");
      if (src) src = src.replace(/\/image[DT]\.img\.[a-z]+\/(\d+)\.[a-z]+/, "/imageM.img.jpg/$1.jpg");
      if (!link || !src) {
        promo.remove();
        return;
      }
      const a = document2.createElement("a");
      a.href = link.getAttribute("href");
      const image = document2.createElement("img");
      image.src = src;
      image.alt = "Check winning numbers";
      a.append(image);
      const p = document2.createElement("p");
      p.append(a);
      const meta = WebImporter.Blocks.createBlock(document2, {
        name: "Section Metadata",
        cells: { style: "mobile-promo" }
      });
      promo.replaceWith(p, meta, document2.createElement("hr"));
    });
  }
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      convertMobilePromo(element, payload.document);
      WebImporter.DOMUtils.remove(element, [
        // Hidden mobile "Download our App" bottom banner, nested inside the right-rail
        // promo container (div.alc-container.cmp-container--hide-column-gutters).
        // Found: <div id="alc-banner-..." class="alc-mobile-banner alc-mobile-banner--v1 publish">
        ".alc-mobile-banner",
        // Non-authorable countdown timers inside hero carousel slides.
        // Found: <div class="next-draw-timer"><div class="timer-head">Time Remaining:</div>...
        ".next-draw-timer",
        // Browser-upgrade modal. Found: <div class="common-modals aem-GridColumn ...">
        ".common-modals",
        // Login flow modal. Found: <div id="loginFlow" class="alc-modal modal fade">
        "#loginFlow",
        // Qualtrics intercept placeholder. Found: <div id="ZN_3Eu2u7P45FmpwJ5">
        "#ZN_3Eu2u7P45FmpwJ5"
      ]);
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        // Global header XF (migrated separately).
        // Found: <div class="experiencefragment aem-GridColumn aem-GridColumn--default--12">
        "div.experiencefragment.aem-GridColumn",
        // Global footer XF (migrated separately).
        // Found: <footer class="experiencefragment aem-GridColumn aem-GridColumn--default--12">
        "footer.experiencefragment.aem-GridColumn",
        // Skip link. Found: <div class="cmp-page__skiptomaincontent">
        ".cmp-page__skiptomaincontent",
        // Tracking pixels (doubleclick / adsrvr), stylesheet links, scripts.
        "iframe",
        "link",
        "noscript",
        "script"
      ]);
    }
  }

  // tools/importer/transformers/alc-sections.js
  var SECTION_MARKER_ATTR = "data-excat-section-id";
  function querySection(root, selectors) {
    const list = Array.isArray(selectors) ? selectors : [selectors];
    for (const sel of list) {
      if (!sel) continue;
      let el = null;
      try {
        el = root.querySelector(sel);
      } catch (e) {
        el = null;
      }
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

  // tools/importer/import-alc.js
  var parsers = {
    "carousel-hero": parse,
    "carousel-winners": parse2,
    "cards-game": parse3,
    "cards-promo": parse4
  };
  var PAGE_TEMPLATE = {
    name: "alc",
    description: "ALC homepage: hero promo carousel, recent winners slider, featured game tiles with right-rail promos",
    urls: [
      "https://www.alc.ca/content/alc/en.html"
    ],
    blocks: [
      {
        name: "carousel-hero",
        instances: ["div.carousel.list.parbase.hero"]
      },
      {
        name: "carousel-winners",
        instances: ["div.winners-carousel"]
      },
      {
        name: "cards-game",
        instances: ["main.alc-container.cmp-container--game-tiles"]
      },
      {
        name: "cards-promo",
        instances: ["div.alc-container.cmp-container--hide-column-gutters"]
      }
    ],
    sections: [
      {
        id: "1",
        name: "hero-promo-carousel",
        selector: ["div.carousel.list.parbase.hero"],
        style: null,
        blocks: ["carousel-hero"],
        defaultContent: []
      },
      {
        id: "2",
        name: "recent-winners",
        selector: ["div.section-header.cmp-section-header--alc-blue"],
        style: "winners",
        blocks: ["carousel-winners"],
        defaultContent: ["div.section-header.cmp-section-header--alc-blue"]
      },
      {
        id: "3",
        name: "featured-games-and-promotions",
        selector: [
          "div.aem-Grid > div.alc-container:has(.cmp-container--game-tiles)",
          "div.section-header.cmp-section-header--alc-green"
        ],
        style: "featured",
        blocks: ["cards-game", "cards-promo"],
        defaultContent: ["div.section-header.cmp-section-header--alc-green"]
      }
    ]
  };
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : []
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), {
      template: PAGE_TEMPLATE
    });
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
          pageBlocks.push({
            name: blockDef.name,
            selector,
            element,
            section: blockDef.section || null
          });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_alc_default = {
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
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "").replace(/^\/content\/alc/, "");
      const isHome = rawPath === "" || rawPath === "/en";
      const path = WebImporter.FileUtils.sanitizePath(isHome ? "/index" : rawPath);
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
  return __toCommonJS(import_alc_exports);
})();
