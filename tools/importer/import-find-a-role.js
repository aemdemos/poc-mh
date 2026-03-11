/* eslint-disable */
/* global WebImporter */

/**
 * Import script for Royal Navy "Find a Role" category pages.
 *
 * MIGRATION NOTES (warfare page — 2026-03-10):
 *
 * HELIX-IMPORTER CRASH:
 * Royal Navy pages include Semasio tracking scripts with URLs containing
 * [consent-string] and [1|0] bracket patterns. These cause Invalid RegExp
 * errors in helix-importer's internal URL processing. The preprocess step
 * MUST remove all script, noscript, and iframe tags before helix-importer
 * touches the DOM. Each WebImporter.rules.* call is wrapped in try-catch
 * as an additional safety net.
 *
 * CONTENT MANAGEMENT:
 * Content files (.plain.html) are managed through DA (Document Authoring)
 * at content.da.live — NOT through git. The /content directory is excluded
 * from git via .git/info/exclude. After generating content locally, upload
 * to DA at: https://da.live/#/aemdemos/poc-mh/careers/find-a-role/
 *
 * HERO BLOCK VARIANT:
 * The hero uses variant "Hero (find-a-role)" which generates CSS class
 * "hero find-a-role block". This activates variant CSS in hero.css for:
 * - Full-width background image with breadcrumb/H1 overlay
 * - position:static fix on image row (prevents 0-height collapse)
 * - :has() rules hiding header breadcrumbs, section piping, keylines
 *
 * METADATA:
 * Do NOT include breadcrumbs:true in page metadata. The hero block has its
 * own breadcrumb content. The header auto-breadcrumbs would show "Home >
 * [page title]" next to the logo. The find-a-role-cleanup transformer
 * strips this metadata field as a safety measure.
 */

// PARSER IMPORTS - Import all parsers needed for this template
import introFindARoleParser from './parsers/intro-find-a-role.js';
import carouselRolesParser from './parsers/carousel-roles.js';
import gridCtaParser from './parsers/grid-cta.js';

// TRANSFORMER IMPORTS
import royalnavyCleanupTransformer from './transformers/royalnavy-cleanup.js';
import findARoleCleanupTransformer from './transformers/find-a-role-cleanup.js';

// PARSER REGISTRY - Map parser names to functions
const parsers = {
  'intro-find-a-role': introFindARoleParser,
  'carousel-roles': carouselRolesParser,
  'grid-cta': gridCtaParser,
};

// TRANSFORMER REGISTRY - Array of transformer functions
const transformers = [
  royalnavyCleanupTransformer,
  findARoleCleanupTransformer,
];

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'find-a-role',
  description: 'Royal Navy Find a Role category pages with hero media, intro text, three carousels (levels of entry, RN roles, RFA roles), and grid CTAs',
  urls: [
    'https://www.royalnavy.mod.uk/careers/find-a-role/warfare',
    'https://www.royalnavy.mod.uk/careers/find-a-role/engineering',
    'https://www.royalnavy.mod.uk/careers/find-a-role/healthcare-and-medical',
    'https://www.royalnavy.mod.uk/careers/find-a-role/logistics-and-personnel',
  ],
  blocks: [
    {
      name: 'intro-find-a-role',
      instances: ["[class*='IntroTextSection_introTextSection']"],
    },
    {
      name: 'carousel-roles',
      instances: ["[class*='CarouselSection_carouselSection']"],
    },
    {
      name: 'grid-cta',
      instances: ["[class*='GridContainerDouble_gridMiddleBottom']"],
    },
  ],
};

/**
 * Execute all page transformers for a specific hook
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

// EXPORT DEFAULT CONFIGURATION
export default {
  /**
   * Preprocess: runs before the helix-importer's internal processing.
   * Removes tracking pixels and elements with regex-breaking URL patterns
   * (e.g., [consent-string], [1|0]) that cause Invalid RegExp errors.
   *
   * CRITICAL: These removals prevent helix-importer crashes from Semasio
   * tracking URLs. Do not reduce the scope of removals without testing.
   */
  preprocess: ({ document }) => {
    // Remove all script tags (tracking scripts contain regex-breaking URLs)
    document.querySelectorAll('script').forEach((el) => el.remove());
    // Remove noscript tags (often contain tracking pixels)
    document.querySelectorAll('noscript').forEach((el) => el.remove());
    // Remove style tags
    document.querySelectorAll('style').forEach((el) => el.remove());
    // Remove link tags (stylesheets, preloads, etc.)
    document.querySelectorAll('link').forEach((el) => el.remove());
    // Remove iframes (chat widgets, analytics, consent managers)
    document.querySelectorAll('iframe').forEach((el) => el.remove());
    // Remove cookie/consent overlays
    document.querySelectorAll('#onetrust-consent-sdk, [class*="chatbot"], [class*="Chatbot"]').forEach((el) => el.remove());
    // Remove header and footer (not part of content)
    document.querySelectorAll('header, footer').forEach((el) => el.remove());
    // Remove nav elements EXCEPT breadcrumb nav (needed by intro-find-a-role parser)
    document.querySelectorAll('nav').forEach((el) => {
      if (el.getAttribute('aria-label') !== 'Breadcrumb') el.remove();
    });
    // Remove HTML comments containing tracking URLs with regex-breaking patterns
    const walker = document.createTreeWalker(document, NodeFilter.SHOW_COMMENT);
    const comments = [];
    while (walker.nextNode()) comments.push(walker.currentNode);
    comments.forEach((c) => c.remove());
    // Sanitize any remaining attributes containing regex-breaking URL patterns
    // (e.g., semasio [1|0], [consent-string] in data-* or src attributes)
    document.querySelectorAll('*').forEach((el) => {
      [...el.attributes].forEach((attr) => {
        if (/semasio|consent-string|\[1\|0\]/.test(attr.value)) {
          el.removeAttribute(attr.name);
        }
      });
    });
  },

  /**
   * Main transformation function using one input / multiple outputs pattern
   */
  transform: (payload) => {
    const { document, url, html, params } = payload;

    const main = document.body;

    // 1. Execute beforeTransform transformers (initial cleanup)
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks on page using embedded template
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block using registered parsers
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

    // 4. Execute afterTransform transformers (final cleanup)
    executeTransformers('afterTransform', main, payload);

    // 5. Apply WebImporter built-in rules (wrapped in try-catch to handle
    //    regex errors from URLs with special characters like [consent-string])
    const hr = document.createElement('hr');
    main.appendChild(hr);
    try {
      WebImporter.rules.createMetadata(main, document);
    } catch (e) {
      console.warn('createMetadata failed (non-fatal):', e.message);
    }
    try {
      WebImporter.rules.transformBackgroundImages(main, document);
    } catch (e) {
      console.warn('transformBackgroundImages failed (non-fatal):', e.message);
    }
    try {
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
    } catch (e) {
      console.warn('adjustImageUrls failed (non-fatal):', e.message);
    }

    // 6. Generate sanitized path
    const path = WebImporter.FileUtils.sanitizePath(
      new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html$/, ''),
    );

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
