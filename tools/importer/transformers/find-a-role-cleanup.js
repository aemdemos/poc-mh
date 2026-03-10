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
    // Remove any remaining empty section wrappers
    const emptyWrappers = element.querySelectorAll('[class*="SectionWrapper_sectionWrapper"]');
    emptyWrappers.forEach((wrapper) => {
      if (wrapper.textContent.trim() === '' && !wrapper.querySelector('img')) {
        wrapper.remove();
      }
    });

    // Remove breadcrumbs:true from metadata to prevent header auto-breadcrumbs.
    // The hero block has its own breadcrumb content; the header breadcrumbs
    // would show "Home > [page title]" text next to the logo.
    const metadataTable = element.querySelector('table');
    if (metadataTable) {
      const rows = metadataTable.querySelectorAll('tr');
      rows.forEach((row) => {
        const firstCell = row.querySelector('td');
        if (firstCell && firstCell.textContent.trim().toLowerCase() === 'breadcrumbs') {
          row.remove();
        }
      });
    }
  }
}
