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

  // tools/importer/import-find-a-role.js
  var import_find_a_role_exports = {};
  __export(import_find_a_role_exports, {
    default: () => import_find_a_role_default
  });

  // tools/importer/parsers/intro-find-a-role.js
  function parse(element, { document }) {
    const heading = element.querySelector("h1") || element.querySelector("h2");
    const breadcrumbNav = element.querySelector('nav[aria-label="Breadcrumb"]');
    const breadcrumbItems = breadcrumbNav ? Array.from(breadcrumbNav.querySelectorAll("a")) : [];
    const introTextEl = element.querySelector('[class*="IntroTextSection_introText"]');
    const introParagraph = introTextEl ? introTextEl.querySelector("p") : null;
    const cells = [];
    const contentCell = [];
    if (breadcrumbItems.length > 0) {
      const breadcrumbP = document.createElement("p");
      breadcrumbItems.forEach((a, idx) => {
        const link = document.createElement("a");
        link.href = a.href;
        link.textContent = a.textContent.trim();
        breadcrumbP.append(link);
        if (idx < breadcrumbItems.length - 1) {
          breadcrumbP.append(document.createTextNode(" / "));
        }
      });
      contentCell.push(breadcrumbP);
    }
    if (heading) contentCell.push(heading);
    if (introParagraph) contentCell.push(introParagraph);
    cells.push(contentCell);
    const block = WebImporter.Blocks.createBlock(document, { name: "Hero", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/carousel-roles.js
  function parse2(element, { document }) {
    const sectionTitle = element.querySelector("h2");
    const roleCards = Array.from(element.querySelectorAll('[class*="RoleCard_roleCard"]'));
    const validCards = roleCards.filter((card) => {
      const h3 = card.querySelector("h3");
      const link = h3 ? h3.querySelector("a") : null;
      return link && link.textContent.trim().length > 0;
    });
    const cells = [];
    validCards.forEach((card) => {
      const img = card.querySelector("img");
      const h3 = card.querySelector("h3");
      const titleLink = h3 ? h3.querySelector("a") : null;
      const descEl = card.querySelector('[class*="RoleCard_description"]');
      const tableRows = card.querySelectorAll("table tr");
      const badges = Array.from(card.querySelectorAll('[class*="RoleCard_labels"] button'));
      const imageCell = [];
      if (img) {
        const newImg = document.createElement("img");
        newImg.src = img.src;
        newImg.alt = img.alt || "";
        imageCell.push(newImg);
      }
      const contentCell = [];
      if (titleLink) {
        const p = document.createElement("p");
        const strong = document.createElement("strong");
        const a = document.createElement("a");
        a.href = titleLink.href;
        a.textContent = titleLink.textContent.trim();
        strong.append(a);
        p.append(strong);
        contentCell.push(p);
      }
      if (descEl) {
        const p = document.createElement("p");
        p.textContent = descEl.textContent.trim();
        contentCell.push(p);
      }
      tableRows.forEach((row) => {
        const th = row.querySelector("th");
        const td = row.querySelector("td");
        if (th && td) {
          const p = document.createElement("p");
          const em = document.createElement("em");
          em.textContent = `${th.textContent.trim()} ${td.textContent.trim()}`;
          p.append(em);
          contentCell.push(p);
        }
      });
      if (badges.length > 0) {
        const p = document.createElement("p");
        const strong = document.createElement("strong");
        strong.textContent = badges.map((b) => b.textContent.trim()).join(", ");
        p.append(strong);
        contentCell.push(p);
      }
      cells.push([imageCell, contentCell]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "Carousel", cells });
    if (sectionTitle) {
      const heading = document.createElement("h2");
      heading.textContent = sectionTitle.textContent.trim();
      element.before(heading);
    }
    element.replaceWith(block);
  }

  // tools/importer/parsers/grid-cta.js
  function parse3(element, { document }) {
    const gridItems = element.querySelectorAll('[class*="GridContainerDouble_gridRowDoubleItem"]');
    const col1 = [];
    const col2 = [];
    if (gridItems.length >= 1) {
      const searchBox = gridItems[0];
      const searchTitle = searchBox.querySelector("h2");
      if (searchTitle) {
        const h2 = document.createElement("h2");
        h2.textContent = searchTitle.textContent.trim();
        col1.push(h2);
      }
      const searchInput = searchBox.querySelector("input");
      if (searchInput) {
        const p2 = document.createElement("p");
        p2.textContent = searchInput.placeholder || "Search keywords";
        col1.push(p2);
      }
      const p = document.createElement("p");
      const a = document.createElement("a");
      a.href = "/careers/find-a-role";
      a.textContent = "Search";
      p.append(a);
      col1.push(p);
    }
    if (gridItems.length >= 2) {
      const advisorBlock = gridItems[1];
      const advisorTitle = advisorBlock.querySelector("h2");
      if (advisorTitle) {
        const h2 = document.createElement("h2");
        h2.textContent = advisorTitle.textContent.trim();
        col2.push(h2);
      }
      const paragraphs = advisorBlock.querySelectorAll('[class*="TextBlock_text"] p');
      paragraphs.forEach((para) => {
        const p = document.createElement("p");
        p.textContent = para.textContent.trim();
        col2.push(p);
      });
      const ctaBtn = advisorBlock.querySelector('[class*="Button_textCircleButton"]');
      if (ctaBtn) {
        const p = document.createElement("p");
        const a = document.createElement("a");
        a.href = "#chat";
        a.textContent = ctaBtn.querySelector('[class*="Button_text"]') ? ctaBtn.querySelector('[class*="Button_text"]').textContent.trim() : "Chat now";
        p.append(a);
        col2.push(p);
      }
    }
    const cells = [[col1, col2]];
    const block = WebImporter.Blocks.createBlock(document, { name: "Columns", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/royalnavy-cleanup.js
  var TransformHook = {
    beforeTransform: "beforeTransform",
    afterTransform: "afterTransform"
  };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, [
        "header",
        "nav",
        "footer"
      ]);
      WebImporter.DOMUtils.remove(element, [
        "script",
        "style",
        "noscript"
      ]);
      WebImporter.DOMUtils.remove(element, [
        "#onetrust-consent-sdk",
        '[class*="chatbot"]',
        '[class*="Chatbot"]',
        '[id*="chatbot"]',
        '[class*="CookieBanner"]',
        '[class*="cookie"]'
      ]);
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        "iframe",
        "link",
        "source"
      ]);
    }
  }

  // tools/importer/transformers/find-a-role-cleanup.js
  var TransformHook2 = {
    beforeTransform: "beforeTransform",
    afterTransform: "afterTransform"
  };
  function transform2(hookName, element, payload) {
    if (hookName === TransformHook2.beforeTransform) {
      const introMediaElements = element.querySelectorAll('[class*="IntroMedia_leftMask"], [class*="IntroMedia_rightMask"], [class*="IntroMedia_bannerContent"]');
      introMediaElements.forEach((el) => el.remove());
      const sectionArrows = element.querySelectorAll('[class*="SectionArrow_arrow"], [class*="arrowWrapper"]');
      sectionArrows.forEach((el) => el.remove());
      const keylines = element.querySelectorAll('[class*="Keylines_keyline"], [class*="SectionWrapper_border"]');
      keylines.forEach((el) => el.remove());
      const carouselNav = element.querySelectorAll('[class*="Carousel_nav"]');
      carouselNav.forEach((el) => el.remove());
      const filterTabs = element.querySelectorAll('[class*="CarouselSection"] > ul');
      filterTabs.forEach((el) => el.remove());
      const roleCardDecorative = element.querySelectorAll('[class*="RoleCard_divider"], [class*="RoleCard_tooltips"]');
      roleCardDecorative.forEach((el) => el.remove());
    }
    if (hookName === TransformHook2.afterTransform) {
      const emptyWrappers = element.querySelectorAll('[class*="SectionWrapper_sectionWrapper"]');
      emptyWrappers.forEach((wrapper) => {
        if (wrapper.textContent.trim() === "" && !wrapper.querySelector("img")) {
          wrapper.remove();
        }
      });
    }
  }

  // tools/importer/import-find-a-role.js
  var parsers = {
    "intro-find-a-role": parse,
    "carousel-roles": parse2,
    "grid-cta": parse3
  };
  var transformers = [
    transform,
    transform2
  ];
  var PAGE_TEMPLATE = {
    name: "find-a-role",
    description: "Royal Navy Find a Role category pages with hero media, intro text, three carousels (levels of entry, RN roles, RFA roles), and grid CTAs",
    urls: [
      "https://www.royalnavy.mod.uk/careers/find-a-role/warfare",
      "https://www.royalnavy.mod.uk/careers/find-a-role/engineering",
      "https://www.royalnavy.mod.uk/careers/find-a-role/healthcare-and-medical",
      "https://www.royalnavy.mod.uk/careers/find-a-role/logistics-and-personnel"
    ],
    blocks: [
      {
        name: "intro-find-a-role",
        instances: ["[class*='IntroTextSection_introTextSection']"]
      },
      {
        name: "carousel-roles",
        instances: ["[class*='CarouselSection_carouselSection']"]
      },
      {
        name: "grid-cta",
        instances: ["[class*='GridContainerDouble_gridMiddleBottom']"]
      }
    ]
  };
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
            section: blockDef.section || null
          });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_find_a_role_default = {
    /**
     * Preprocess: runs before the helix-importer's internal processing.
     * Removes tracking pixels and elements with regex-breaking URL patterns
     * (e.g., [consent-string], [1|0]) that cause Invalid RegExp errors.
     */
    preprocess: ({ document }) => {
      document.querySelectorAll("script").forEach((el) => el.remove());
      document.querySelectorAll("noscript").forEach((el) => el.remove());
      document.querySelectorAll("style").forEach((el) => el.remove());
      document.querySelectorAll("link").forEach((el) => el.remove());
      document.querySelectorAll("iframe").forEach((el) => el.remove());
      document.querySelectorAll('#onetrust-consent-sdk, [class*="chatbot"], [class*="Chatbot"]').forEach((el) => el.remove());
      document.querySelectorAll("header, footer, nav").forEach((el) => el.remove());
    },
    /**
     * Main transformation function using one input / multiple outputs pattern
     */
    transform: (payload) => {
      const { document, url, html, params } = payload;
      const main = document.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
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
      executeTransformers("afterTransform", main, payload);
      const hr = document.createElement("hr");
      main.appendChild(hr);
      try {
        WebImporter.rules.createMetadata(main, document);
      } catch (e) {
        console.warn("createMetadata failed (non-fatal):", e.message);
      }
      try {
        WebImporter.rules.transformBackgroundImages(main, document);
      } catch (e) {
        console.warn("transformBackgroundImages failed (non-fatal):", e.message);
      }
      try {
        WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      } catch (e) {
        console.warn("adjustImageUrls failed (non-fatal):", e.message);
      }
      const path = WebImporter.FileUtils.sanitizePath(
        new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html$/, "")
      );
      return [{
        element: main,
        path,
        report: {
          title: document.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_find_a_role_exports);
})();
