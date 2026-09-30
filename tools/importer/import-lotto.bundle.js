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

  // tools/importer/import-lotto.js
  var import_lotto_exports = {};
  __export(import_lotto_exports, {
    default: () => import_lotto_default
  });

  // tools/importer/parsers/widget.js
  function pageSlug(document2, url, params) {
    const candidates = [params && params.originalURL, url, document2.location && document2.location.href];
    for (const c of candidates) {
      if (!c) continue;
      try {
        const seg = new URL(c, "https://www.alc.ca").pathname.split("/").filter(Boolean).pop() || "";
        const slug = seg.replace(/\.html?$/i, "");
        if (slug && slug !== "about:blank") return slug;
      } catch (e) {
      }
    }
    return "";
  }
  function gameCode(element, document2, url, params) {
    const host = element.closest("[data-game]") || document2.querySelector("[data-game]");
    const fromDom = host && host.getAttribute("data-game");
    if (fromDom && fromDom.trim()) return fromDom.trim().toLowerCase();
    return pageSlug(document2, url, params).toLowerCase().replace(/[^a-z0-9]/g, "");
  }
  function widgetName(element) {
    if (element.matches(".draw--full__winning-numbers")) return "winning-numbers";
    if (element.matches(".draw--full__jackpot")) return "jackpot";
    if (element.matches(".payout-tables") || element.closest(".prize-payout-content")) return "prize-payout";
    if (element.matches(".winners-list") || element.closest(".winners-tab-content")) return "winners-list";
    return null;
  }
  function widgetParagraph(document2, name, code) {
    const href = `/widgets/${name}.html${code ? `?game=${code}` : ""}`;
    const p = document2.createElement("p");
    const a = document2.createElement("a");
    a.href = href;
    a.textContent = href;
    p.append(a);
    return p;
  }
  function parse(element, { document: document2, url, params } = {}) {
    const name = widgetName(element);
    if (!name) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const code = gameCode(element, document2, url, params);
    const out = [widgetParagraph(document2, name, code)];
    if (name === "jackpot") {
      const cta = element.querySelector(".draw--full__jackpot__cta a[href], a.arrow-button[href]");
      if (cta && cta.textContent.trim()) {
        const p = document2.createElement("p");
        const a = document2.createElement("a");
        a.href = cta.getAttribute("href");
        a.textContent = cta.textContent.trim();
        const strong = document2.createElement("strong");
        strong.append(a);
        p.append(strong);
        out.push(p);
      }
    }
    if (name === "prize-payout") {
      const pane = element.closest(".prize-payout-content") || element.parentElement;
      if (pane) {
        pane.querySelectorAll(".collapse-expand, .atlantic-payout").forEach((el) => {
          if (!element.contains(el)) el.remove();
        });
      }
    }
    if (name === "winners-list") {
      const pane = element.closest(".winners-tab-content") || element.parentElement;
      const h1 = pane && pane.querySelector(":scope > h1");
      if (h1) {
        const h2 = document2.createElement("h2");
        h2.textContent = h1.textContent.trim();
        h1.replaceWith(h2);
      }
    }
    const block = document2.createElement("div");
    block.append(...out);
    element.replaceWith(block);
  }

  // tools/importer/parsers/tabs-game.js
  function slugify(text) {
    return (text || "").toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }
  function pageSlug2(document2, url, params) {
    const candidates = [params && params.originalURL, url, document2 && document2.location && document2.location.href];
    for (const c of candidates) {
      if (!c) continue;
      try {
        const seg = new URL(c, "https://www.alc.ca").pathname.split("/").filter(Boolean).pop() || "";
        const slug = seg.replace(/\.html?$/i, "");
        if (slug && slug !== "blank") return slug;
      } catch (e) {
      }
    }
    return "";
  }
  function paneSlug(pane, label) {
    if (pane) {
      const cls = [...pane.classList].find((c) => /-content$/.test(c) && c !== "tab-content");
      if (cls) return cls.replace(/(-tab)?-content$/, "");
      if (pane.id) return slugify(pane.id);
    }
    return slugify(label);
  }
  function parse2(element, { document: document2, url, params } = {}) {
    const page = pageSlug2(document2, url, params);
    const panes = [...element.querySelectorAll(".tab-content > .tab-pane")];
    let tabLinks = [...element.querySelectorAll('ul.nav-tabs > li > a, [role="tablist"] a[role="tab"]')];
    tabLinks = tabLinks.filter((a, i) => tabLinks.indexOf(a) === i);
    const items = [];
    if (tabLinks.length) {
      tabLinks.forEach((a, i) => {
        const label = a.textContent.replace(/\s+/g, " ").trim();
        const id = (a.getAttribute("href") || "").replace(/^.*#/, "");
        const pane = id && panes.find((p) => p.id === id) || panes[i] || null;
        items.push({ label, pane });
      });
    } else {
      panes.forEach((pane, i) => items.push({ label: `Tab ${i + 1}`, pane }));
    }
    const cells = [];
    items.forEach(({ label, pane }) => {
      const slug = paneSlug(pane, label);
      if (!slug) return;
      const path = `/fragments/lotto/${page}/${slug}`;
      const a = document2.createElement("a");
      a.href = path;
      a.textContent = path;
      cells.push([label, a]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "tabs-game", cells });
    element.replaceWith(block);
  }
  parse2.paneSlug = paneSlug;
  parse2.pageSlug = pageSlug2;

  // tools/importer/parsers/columns-winner.js
  function parse3(element, { document: document2 }) {
    const heading = element.querySelector("h1, h2, h3");
    const image = element.querySelector(".hero img, img");
    const heroCol = image && (image.closest(".hero") || image.parentElement);
    const textCell = [];
    if (heading && heading.textContent.trim()) {
      const h2 = document2.createElement("h2");
      h2.textContent = heading.textContent.replace(/\s+/g, " ").trim();
      textCell.push(h2);
    }
    [...element.querySelectorAll("p")].forEach((p) => {
      if (heroCol && heroCol.contains(p)) return;
      if (p.closest(".actions")) return;
      if (!p.textContent.trim()) return;
      textCell.push(p);
    });
    const ctas = [...element.querySelectorAll(".actions a[href]")];
    if (!ctas.length) {
      const fallback = element.querySelector("a.chevron-link[href], a.button[href]");
      if (fallback) ctas.push(fallback);
    }
    ctas.forEach((cta) => {
      const text = cta.textContent.replace(/\s+/g, " ").trim();
      if (!text) return;
      const a = document2.createElement("a");
      a.href = cta.getAttribute("href");
      a.textContent = text;
      const p = document2.createElement("p");
      p.append(a);
      textCell.push(p);
    });
    if (!textCell.length && !image) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [[textCell.length ? textCell : "", image || ""]];
    const block = WebImporter.Blocks.createBlock(document2, { name: "columns-winner", cells });
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
  function parse4(element, { document: document2 }) {
    let tiles = element.matches("div.game-tile, article.game-tile") ? [element] : [...element.querySelectorAll("div.game-tile.parbase")];
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

  // tools/importer/parsers/accordion-game.js
  function slugify2(text) {
    return (text || "").toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }
  function pageSlug3(document2, url, params) {
    const candidates = [params && params.originalURL, url, document2 && document2.location && document2.location.href];
    for (const c of candidates) {
      if (!c) continue;
      try {
        const seg = new URL(c, "https://www.alc.ca").pathname.split("/").filter(Boolean).pop() || "";
        const slug = seg.replace(/\.html?$/i, "");
        if (slug && slug !== "blank") return slug;
      } catch (e) {
      }
    }
    return "";
  }
  function getPanels(element) {
    let panels = [...element.querySelectorAll(":scope > .panel")];
    if (!panels.length) panels = [...element.querySelectorAll(".panel")].filter((p) => p.querySelector(".panel-heading"));
    return panels;
  }
  function panelTitle(panel) {
    const t = panel.querySelector(".panel-heading .panel-title, .panel-heading");
    return t ? t.textContent.replace(/\s+/g, " ").trim() : "";
  }
  function panelBody(panel) {
    return panel.querySelector(".panel-collapse > .panel-body, .panel-body");
  }
  function tableFragmentSources(element) {
    return getPanels(element).map((panel) => {
      const body = panelBody(panel);
      const table = body && [...body.children].find((c) => c.tagName === "TABLE" || c.querySelector("table"));
      if (!table) return null;
      const nodes = [];
      for (let n = table; n; n = n.nextElementSibling) nodes.push(n);
      return { name: slugify2(panelTitle(panel)), nodes };
    }).filter(Boolean);
  }
  function isEmptyNode(el) {
    if (el.tagName === "SCRIPT" || el.tagName === "STYLE") return true;
    if (el.querySelector("img, a[href], table, iframe")) return false;
    return !el.textContent.replace(/[\s ​]+/g, "");
  }
  function parse5(element, { document: document2, url, params } = {}) {
    const page = pageSlug3(document2, url, params);
    const fragments = tableFragmentSources(element);
    const cells = [];
    getPanels(element).forEach((panel) => {
      const titleText = panelTitle(panel);
      const titleEl = panel.querySelector(".panel-heading .panel-title, .panel-heading");
      const logo = titleEl && titleEl.querySelector("img");
      const titleCell = [];
      if (logo) titleCell.push(logo);
      if (titleText) titleCell.push(titleText);
      const body = panelBody(panel);
      const frag = fragments.find((f) => f.nodes[0] && body && body.contains(f.nodes[0]));
      const content = [];
      if (body) {
        for (const child of [...body.children]) {
          if (frag && child === frag.nodes[0]) {
            const path = `/fragments/lotto/${page}/${frag.name}`;
            const p = document2.createElement("p");
            const a = document2.createElement("a");
            a.href = path;
            a.textContent = path;
            p.append(a);
            content.push(p);
            break;
          }
          if (isEmptyNode(child)) continue;
          content.push(child);
        }
      }
      if (!titleCell.length && !content.length) return;
      cells.push([titleCell.length ? titleCell : "", content.length ? content : ""]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "accordion-game", cells });
    element.replaceWith(block);
  }
  parse5.tableFragmentSources = tableFragmentSources;
  parse5.pageSlug = pageSlug3;

  // tools/importer/parsers/embed-video.js
  function toWatchUrl(src) {
    if (!src) return "";
    let u;
    try {
      u = new URL(src, "https://www.youtube.com");
    } catch (e) {
      return src;
    }
    const host = u.hostname.replace(/^www\./, "");
    if (/(^|\.)youtube(-nocookie)?\.com$/.test(host)) {
      const m = u.pathname.match(/\/(?:embed|shorts|live|v)\/([\w-]{6,})/);
      if (m && m[1] !== "videoseries") {
        const start = u.searchParams.get("start") || u.searchParams.get("t");
        return `https://www.youtube.com/watch?v=${m[1]}${start ? `&t=${start}` : ""}`;
      }
      const list = u.searchParams.get("list");
      if (list) return `https://www.youtube.com/playlist?list=${list}`;
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/watch?v=${v}`;
    }
    if (host === "youtu.be") return `https://www.youtube.com/watch?v=${u.pathname.slice(1)}`;
    if (u.protocol === "http:" || u.protocol === "https:") return u.href;
    return src;
  }
  function parse6(element, { document: document2 }) {
    const iframe = element.matches("iframe") ? element : element.querySelector("iframe");
    const src = iframe && (iframe.getAttribute("src") || iframe.getAttribute("data-src"));
    const href = toWatchUrl(src);
    if (!href) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const a = document2.createElement("a");
    a.href = href;
    a.textContent = href;
    const cells = [[a]];
    const block = WebImporter.Blocks.createBlock(document2, { name: "embed-video", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/table-prize.js
  function isBlank(node) {
    if (node.querySelector && node.querySelector("img, a[href]")) return false;
    return !node.textContent.replace(/[\s ​]+/g, "");
  }
  function trimNbsp(el) {
    const walker = el.ownerDocument.createTreeWalker(
      el,
      4
      /* NodeFilter.SHOW_TEXT */
    );
    const texts = [];
    while (walker.nextNode()) texts.push(walker.currentNode);
    texts.forEach((t) => {
      t.textContent = t.textContent.replace(/ /g, " ").replace(/ {2,}/g, " ");
    });
    const last = texts[texts.length - 1];
    if (last) last.textContent = last.textContent.replace(/\s+$/, "");
    const first = texts[0];
    if (first) first.textContent = first.textContent.replace(/^\s+/, "");
  }
  function cellContent(cell) {
    if (isBlank(cell)) return "";
    const blocks = [...cell.children].filter((c) => /^(P|UL|OL|DIV)$/.test(c.tagName));
    if (blocks.length) {
      const kept = blocks.filter((b) => !isBlank(b));
      kept.forEach(trimNbsp);
      return kept.length === 1 && kept[0].tagName === "P" ? [...kept[0].childNodes] : kept;
    }
    trimNbsp(cell);
    return [...cell.childNodes];
  }
  function parse7(element, { document: document2 }) {
    const table = element.matches("table") ? element : element.querySelector("table");
    if (!table) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const rows = [...table.querySelectorAll(":scope > thead > tr, :scope > tbody > tr, :scope > tfoot > tr, :scope > tr")];
    const cells = [];
    rows.forEach((tr) => {
      const tds = [...tr.children].filter((c) => c.tagName === "TD" || c.tagName === "TH");
      if (!tds.length || tds.every(isBlank)) return;
      const row = [];
      tds.forEach((td, i) => {
        row.push(cellContent(td));
        const span = parseInt(td.getAttribute("colspan") || "1", 10);
        if (span > 1 && i < tds.length - 1) {
          for (let k = 1; k < span; k += 1) row.push("");
        }
      });
      cells.push(row);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    for (let n = element.nextElementSibling; n && n.tagName === "P"; n = n.nextElementSibling) {
      if (isBlank(n)) continue;
      trimNbsp(n);
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "table-prize", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/lotto-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function removeEmptyPromoSlots(element) {
    const isEmpty = (el) => !el.querySelector("img, iframe, .game-tile, a[href]") && !el.textContent.replace(/ /g, " ").trim();
    element.querySelectorAll("#promos .promo-box, #promos > .promo").forEach((slot) => {
      if (isEmpty(slot)) slot.remove();
    });
  }
  function removeXfChrome(element) {
    element.querySelectorAll("div.experiencefragment.aem-GridColumn, footer.experiencefragment.aem-GridColumn").forEach((xf) => {
      if (!xf.querySelector("#game-details")) xf.remove();
    });
  }
  function transform(hookName, element, payload) {
    const document2 = payload && payload.document || element.ownerDocument;
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, [
        // Qualtrics intercept placeholder. Found: <div id="ZN_3Eu2u7P45FmpwJ5">
        "#ZN_3Eu2u7P45FmpwJ5",
        // Login / MFA flow modal (+ its "Need help?" footer).
        // Found: <div class="multi-step-flow aem-GridColumn ..."><div class="main-content"><div id="loginFlow" class="alc-modal modal fade">
        "div.multi-step-flow",
        "#loginFlow",
        // Tutorial + browser-check modals. Found: <div class="common-modals"><div class="cmp-modal"><div id="modal-tutorial-en" ...>
        ".common-modals",
        "#modal-tutorial-en",
        // On game pages the browser-check modal sits directly under <body>.
        // Found: <div class="alc-modal modal-browser-check modal"><div class="modal-dialog">
        ".modal-browser-check",
        // Hidden rewards "Bonus Offer" banner (keep the sibling .rewards-earn-rate default content).
        // Found: <div id="rewards-banner" class="rewards-banner hidden"><span class="rewards-banner__badge">Bonus Offer</span>
        "#rewards-banner",
        // Breadcrumb (auto-generated in EDS via page metadata "Breadcrumbs: true").
        // Found: <div id="draw-subcomponent"><div class="draw--full__breadcrumb">
        "#draw-subcomponent > div.draw--full__breadcrumb",
        // Share bar (URLs built by JS). Found: <div id="game-details"> ... <section class="header blue"><div class="social">
        "#game-details > section.header.blue"
      ]);
      removeEmptyPromoSlots(element);
      element.querySelectorAll("#game-details > div.body-content").forEach((el) => {
        el.style.backgroundImage = "none";
      });
      element.querySelectorAll("button.modal-login.authorModal").forEach((btn) => {
        btn.replaceWith(document2.createTextNode(btn.textContent.trim()));
      });
    }
    if (hookName === TransformHook.afterTransform) {
      removeXfChrome(element);
      WebImporter.DOMUtils.remove(element, [
        // Skip link (homepage parity; absent on lotto cleaned.html).
        ".cmp-page__skiptomaincontent",
        // Global chrome (migrated separately as nav/footer).
        // Found: <div id="collapsible-promo" class="collapsible-promo">
        "#collapsible-promo",
        // Found: <header class="container hidden-xs tablet-desktop header-en alc"> and
        //        <header class="visible-xs navbar-fixed-top mobile header-en alc">
        "header.header-en",
        // Found: <div class="logged-in-info-wrapper hidden-xs"> (account dashboard)
        ".logged-in-info-wrapper",
        // Found: <div class="topnav"><div><div><div class="container-fluid header-nav alc-nav"> (megamenu)
        "div.topnav",
        // Found: <nav id="nav-mobile" class="nav-mobile navmenu ...">
        "#nav-mobile",
        // Found: <footer class="main-footer">
        "footer.main-footer",
        // JS-driven next-draw / jackpot text on game tiles (outside widget areas).
        // Found: <p class="next-jackpot-date">Next Draw: ...</p>, <p class="next-jackpot-prize">,
        //        <div class="jackpot-lottomax"><div class="prize-bar">...
        "#promos .next-jackpot-date",
        "#promos .next-jackpot-prize",
        "#promos .jackpot-lottomax",
        // Stylesheet links / scripts. Found: <link href="/etc.clientlibs/wcm/foundation/clientlibs/accessibility.min.css">
        "link",
        "noscript",
        "script"
      ]);
      element.querySelectorAll("iframe").forEach((iframe) => {
        const src = iframe.getAttribute("src") || "";
        if (!/(youtube\.com|youtube-nocookie\.com|youtu\.be)\//i.test(src)) iframe.remove();
      });
      element.querySelectorAll('section[id^="-"]').forEach((s) => {
        if (!s.children.length && !s.textContent.trim()) s.remove();
      });
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

  // tools/importer/transformers/alc-links.js
  var TransformHook2 = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  var ALC_HOST = /^https?:\/\/(www\.)?alc\.ca(?=\/|$)/i;
  var EN_PAGE = /^\/content\/alc\/en((?:\/[^?#]*?)?)((?:\.html)+)(\?[^#]*)?(#.*)?$/i;
  function rewriteAlcHref(href) {
    if (!href) return null;
    const raw = href.trim();
    const local = raw.replace(ALC_HOST, "");
    if (local === raw && !raw.startsWith("/")) return null;
    const m = local.match(EN_PAGE);
    if (!m) return null;
    const [, rest, , query = "", hash = ""] = m;
    let path = rest || "";
    if (path === "" || path === "/") path = "/";
    if (path.length > 1) path = path.replace(/\/+$/, "");
    return `${path}${query}${hash}`;
  }
  var DAM_ASSET = /^\/content\/dam\//i;
  function transform3(hookName, element, payload) {
    if (hookName === TransformHook2.afterTransform) {
      element.querySelectorAll("a[href]").forEach((a) => {
        const href = a.getAttribute("href");
        const next = DAM_ASSET.test(href.trim()) ? `https://www.alc.ca${href.trim()}` : rewriteAlcHref(href);
        if (next === null || next === href) return;
        a.setAttribute("href", next);
        if (a.textContent.trim() === href.trim()) a.textContent = next;
      });
    }
  }

  // tools/importer/import-lotto.js
  var parsers = {
    widget: parse,
    "tabs-game": parse2,
    "columns-winner": parse3,
    "cards-game": parse4,
    "accordion-game": parse5,
    "embed-video": parse6,
    "table-prize": parse7
  };
  var PAGE_TEMPLATE = {
    name: "lotto",
    description: "Game detail page (lotto): draw hero with live winning numbers + jackpot widgets, tabbed game info (prize payout, winners, how to play) with fragment-backed panels, winner promo, other-games rail",
    urls: [
      "https://www.alc.ca/content/alc/en/our-games/lotto/lotto-6-49.html"
    ],
    blocks: [
      {
        name: "widget",
        instances: [
          "#draw-subcomponent > div.draw--full.row > div.draw--full__winning-numbers",
          "#draw-subcomponent > div.draw--full.row > div.draw--full__jackpot",
          ".prize-payout-content > div.payout-tables",
          ".winners-tab-content > div.winners-list"
        ]
      },
      { name: "tabs-game", instances: ["div.content > div.tabs"] },
      { name: "columns-winner", instances: ["div.content div.winners-promo"] },
      { name: "cards-game", instances: ["#promos div.game-tile"] },
      { name: "accordion-game", instances: [".how-to-play-content .panel-group"] },
      { name: "embed-video", instances: [".how-to-play-content iframe"] },
      { name: "table-prize", instances: [".how-to-play-content .panel-group table"] }
    ],
    sections: [
      {
        id: "1",
        name: "draw-hero",
        selector: ["#game-details > div.alc-external-data--draw-full"],
        style: "lotto-draw",
        blocks: ["widget"],
        defaultContent: ["div.draw--full__jackpot__cta > a.arrow-button"]
      },
      {
        id: "2",
        name: "share-bar",
        selector: ["#game-details > section.header.blue"],
        style: null,
        blocks: [],
        defaultContent: []
      },
      {
        id: "3",
        name: "game-body",
        selector: ["#game-details > div.body-content"],
        style: "game-details",
        blocks: ["tabs-game", "columns-winner", "cards-game"],
        defaultContent: ["section.rewards-section > div.rewards-earn-rate", "#promos > h2"]
      }
    ]
  };
  var TAB_PANE_SELECTOR = "div.content > div.tabs .tab-content > .tab-pane";
  var FRAGMENT_BLOCKS = {
    "prize-payout": [{ name: "widget", selector: "div.payout-tables" }],
    winners: [{ name: "widget", selector: "div.winners-list" }],
    "how-to-play": [
      { name: "accordion-game", selector: "div.panel-group" },
      { name: "embed-video", selector: "iframe" }
    ],
    table: [{ name: "table-prize", selector: "table" }]
  };
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : [],
    transform3
  ];
  var fragmentTransformers = [transform, transform3];
  function executeTransformers(list, hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), {
      template: PAGE_TEMPLATE
    });
    list.forEach((transformerFn) => {
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
          if (blockDef.name !== "tabs-game" && element.closest("div.tabs")) return;
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
  function runParser(name, element, context) {
    if (!element.parentNode) return;
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
  function cloneFragmentSources(document2) {
    const fragments = [];
    document2.querySelectorAll(TAB_PANE_SELECTOR).forEach((pane) => {
      const name = parse2.paneSlug(pane);
      if (!name) return;
      const root = document2.createElement("div");
      root.append(pane.cloneNode(true));
      fragments.push({ name, kind: name, root });
      const panelGroup = name === "how-to-play" && pane.querySelector("div.panel-group");
      if (panelGroup) {
        parse5.tableFragmentSources(panelGroup).forEach(({ name: tableName, nodes }) => {
          const tableRoot = document2.createElement("div");
          nodes.forEach((node) => tableRoot.append(node.cloneNode(true)));
          fragments.push({ name: tableName, kind: "table", root: tableRoot });
        });
      }
    });
    return fragments;
  }
  function createMetadataBlock(main, document2) {
    const meta = {};
    if (document2.title) meta.Title = document2.title.replace(/[\n\t]/gm, "").trim();
    const desc = document2.querySelector('meta[name="description"]');
    if (desc && desc.content) meta.Description = desc.content;
    const ogImage = document2.querySelector('meta[property="og:image"]');
    if (ogImage && ogImage.content) {
      const img = document2.createElement("img");
      img.src = ogImage.content;
      meta.Image = img;
    }
    meta.Breadcrumbs = "true";
    meta.Share = "true";
    const block = WebImporter.Blocks.getMetadataBlock(document2, meta);
    main.append(block);
  }
  function pagePath(originalURL) {
    const rawPath = new URL(originalURL).pathname.replace(/\/$/, "").replace(/(\.html)+$/, "").replace(/^\/content\/alc\/en/, "");
    return WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
  }
  var import_lotto_default = {
    transform: (payload) => {
      const { document: document2, url, params } = payload;
      const main = document2.body;
      const context = { document: document2, url, params };
      executeTransformers(transformers, "beforeTransform", main, payload);
      const fragments = cloneFragmentSources(document2);
      const pageBlocks = findBlocksOnPage(document2, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => runParser(block.name, block.element, context));
      fragments.forEach((fragment) => {
        (FRAGMENT_BLOCKS[fragment.kind] || []).forEach(({ name, selector }) => {
          fragment.root.querySelectorAll(selector).forEach((el) => {
            if (el.parentElement && el.parentElement.closest(selector)) return;
            runParser(name, el, context);
          });
        });
      });
      executeTransformers(transformers, "afterTransform", main, payload);
      fragments.forEach((fragment) => {
        executeTransformers(fragmentTransformers, "afterTransform", fragment.root, payload);
      });
      const hr = document2.createElement("hr");
      main.appendChild(hr);
      createMetadataBlock(main, document2);
      WebImporter.rules.transformBackgroundImages(main, document2);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      fragments.forEach((fragment) => {
        WebImporter.rules.adjustImageUrls(fragment.root, url, params.originalURL);
      });
      const page = parse2.pageSlug(document2, url, params);
      const requested = new URL(params.originalURL).searchParams.get("fragment");
      if (requested) {
        const fragment = fragments.find((f) => f.name === requested);
        if (!fragment) throw new Error(`Fragment "${requested}" not found on ${params.originalURL}`);
        return [{
          element: fragment.root,
          path: WebImporter.FileUtils.sanitizePath(`/fragments/lotto/${page}/${fragment.name}`),
          report: {
            title: `${page} ${fragment.name}`,
            template: `${PAGE_TEMPLATE.name}-fragment`,
            blocks: (FRAGMENT_BLOCKS[fragment.kind] || []).map((b) => b.name)
          }
        }];
      }
      return [{
        element: main,
        path: pagePath(params.originalURL),
        report: {
          title: document2.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name),
          fragments: fragments.map((f) => f.name)
        }
      }];
    }
  };
  return __toCommonJS(import_lotto_exports);
})();
