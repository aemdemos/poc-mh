/* eslint-disable */
/* global WebImporter */

/**
 * Transformer for find-a-role page cleanup
 * Purpose: Remove decorative elements specific to find-a-role pages
 * Applies to: www.royalnavy.mod.uk/careers/find-a-role/*
 * Generated: 2026-03-10
 *
 * LESSONS LEARNED (warfare migration 2026-03-10):
 *
 * 1. PRESERVE HERO IMAGE: The IntroMedia section contains both decorative elements
 *    (masks, keylines, arrows) AND the hero background image. Only remove the
 *    decorative parts — preserve [class*="IntroMedia_bgImage"] which holds the <img>.
 *    The intro-find-a-role parser extracts this image via document.querySelector.
 *
 * 2. METADATA BREADCRUMBS: Remove breadcrumbs:true from the metadata block.
 *    Find-a-role pages have breadcrumbs built into the hero block content.
 *    If breadcrumbs:true is left in metadata, the EDS header auto-generates
 *    a second breadcrumb bar showing "Home > [page title]" next to the logo.
 *    CSS :has() rules in hero.css hide these, but removing the metadata is cleaner.
 *
 * 3. SEMASIO TRACKING: Royal Navy pages include Semasio tracking scripts with URLs
 *    containing [consent-string] and [1|0] patterns. These cause Invalid RegExp
 *    errors in helix-importer. The preprocess step (in import-find-a-role.js)
 *    must remove all script/noscript/iframe tags BEFORE helix-importer processes them.
 */

const TransformHook = {
  beforeTransform: 'beforeTransform',
  afterTransform: 'afterTransform',
};

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Remove decorative IntroMedia elements (masks, keylines, arrows)
    // IMPORTANT: Do NOT remove IntroMedia_bgImage — it contains the hero background
    // image that the intro-find-a-role parser needs to extract
    const introMediaElements = element.querySelectorAll('[class*="IntroMedia_leftMask"], [class*="IntroMedia_rightMask"], [class*="IntroMedia_bannerContent"]');
    introMediaElements.forEach((el) => el.remove());

    // Remove decorative orb images (Next.js Image components outside content areas)
    element.querySelectorAll('img[src*="orb"]').forEach((img) => {
      const p = img.closest('p, div:not([class])');
      if (p && !p.querySelector('[class]')) p.remove(); else img.remove();
    });

    // Remove section arrows (decorative scroll buttons)
    const sectionArrows = element.querySelectorAll('[class*="SectionArrow_arrow"], [class*="arrowWrapper"]');
    sectionArrows.forEach((el) => el.remove());

    // Remove keyline decorations (they are CSS-only visual elements)
    const keylines = element.querySelectorAll('[class*="Keylines_keyline"], [class*="SectionWrapper_border"]');
    keylines.forEach((el) => el.remove());

    // Remove carousel navigation buttons (these are rebuilt by the EDS carousel block)
    const carouselNav = element.querySelectorAll('[class*="Carousel_nav"]');
    carouselNav.forEach((el) => el.remove());

    // Remove carousel filter tabs (complex JS-driven behavior not migrated)
    const filterTabs = element.querySelectorAll('[class*="CarouselSection"] > ul');
    filterTabs.forEach((el) => el.remove());

    // Remove role card decorative elements (dividers, tooltips, label buttons wrapping)
    const roleCardDecorative = element.querySelectorAll('[class*="RoleCard_divider"], [class*="RoleCard_tooltips"]');
    roleCardDecorative.forEach((el) => el.remove());
  }

  if (hookName === TransformHook.afterTransform) {
    const { document } = payload;

    // Remove any remaining empty section wrappers
    const emptyWrappers = element.querySelectorAll('[class*="SectionWrapper_sectionWrapper"]');
    emptyWrappers.forEach((wrapper) => {
      if (wrapper.textContent.trim() === '' && !wrapper.querySelector('img')) {
        wrapper.remove();
      }
    });

    // Remove IntroMedia remnants — the intro parser already extracted the hero
    // image via document.querySelector, so the original element is no longer needed.
    // Without this, the bgImage becomes a stray <p><img> before the hero block.
    element.querySelectorAll('[class*="IntroMedia"]').forEach((el) => el.remove());

    // Remove specific stray elements that survive preprocess/beforeTransform:
    // - "Skip to content" accessibility links
    element.querySelectorAll('a[href="#main"]').forEach((a) => {
      const p = a.closest('p');
      if (p) p.remove(); else a.remove();
    });
    // - blob: URL images (from JS-rendered content that can't be fetched)
    element.querySelectorAll('img[src^="blob:"]').forEach((img) => {
      const p = img.closest('p');
      if (p) p.remove(); else img.remove();
    });
    // - "Chat Now" chatbot trigger text
    element.querySelectorAll('p, span, div').forEach((el) => {
      if (el.children.length === 0 && el.textContent.trim() === 'Chat Now') {
        el.remove();
      }
    });

    // --- Section structure ---
    // Find-a-role pages have 5 sections with alternating backgrounds:
    //   Section 1 (default navy): Hero only
    //   Section 2 (default navy): "Levels of entry" carousel
    //   Section 3 (white-bg): "Royal Navy [category] roles" carousel
    //   Section 4 (muted-blue): "RFA [category] roles" carousel
    //   Section 5 (default): Grid CTA (Columns apply)
    // Insert <hr> section dividers and section-metadata blocks.
    const h2Elements = [...element.querySelectorAll('h2')];

    // h2[0] = "Levels of entry" (starts section 2, hero gets its own section)
    // h2[1] = "Royal Navy * roles" (starts section 3)
    // h2[2] = "RFA * roles" (starts section 4)

    // Section break after hero, before "Levels of entry"
    if (h2Elements[0]) {
      h2Elements[0].before(document.createElement('hr'));
    }

    // Section break before "Royal Navy * roles"
    if (h2Elements[1]) {
      h2Elements[1].before(document.createElement('hr'));
    }

    // Section break before section 3, with white-bg metadata ending section 2
    if (h2Elements[2]) {
      const whiteBgMeta = WebImporter.Blocks.createBlock(document, {
        name: 'Section metadata',
        cells: [['style', 'white-bg']],
      });
      h2Elements[2].before(whiteBgMeta);
      h2Elements[2].before(document.createElement('hr'));
    }

    // Section break before section 4 (Columns), with muted-blue metadata ending section 3
    const allTables = [...element.querySelectorAll('table')];
    const columnsTable = allTables.find((table) => {
      const cell = table.querySelector('th, td');
      return cell && /columns/i.test(cell.textContent);
    });
    if (columnsTable) {
      const mutedBlueMeta = WebImporter.Blocks.createBlock(document, {
        name: 'Section metadata',
        cells: [['style', 'muted-blue']],
      });
      columnsTable.before(mutedBlueMeta);
      columnsTable.before(document.createElement('hr'));
    }

    // Remove breadcrumbs:true from metadata to prevent header auto-breadcrumbs.
    // The hero block has its own breadcrumb content; the header breadcrumbs
    // would show "Home > [page title]" text next to the logo.
    // Search all tables for the metadata table (it has a "breadcrumbs" row).
    allTables.forEach((table) => {
      const rows = table.querySelectorAll('tr');
      rows.forEach((row) => {
        const firstCell = row.querySelector('td');
        if (firstCell && firstCell.textContent.trim().toLowerCase() === 'breadcrumbs') {
          row.remove();
        }
      });
    });
  }
}
