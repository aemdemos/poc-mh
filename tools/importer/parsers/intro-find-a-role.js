/* eslint-disable */
/* global WebImporter */

/**
 * Parser for intro sections on find-a-role pages (intro_media + intro_text)
 *
 * Source: https://www.royalnavy.mod.uk/careers/find-a-role/*
 * Base Block: hero
 *
 * Combines the decorative IntroMedia section with the IntroTextSection
 * (breadcrumb + H1) into a single Hero block. The intro_media section
 * is purely decorative (masks/keylines) with no content image.
 *
 * Source HTML Pattern:
 * Section 0 (IntroMedia): decorative masks, keylines, arrow button + background image
 * Section 1 (IntroText): breadcrumb nav + h1 heading + optional intro paragraph
 *
 * LESSONS LEARNED (warfare migration 2026-03-10):
 *
 * 1. BLOCK VARIANT: When generating content HTML for EDS, use the block table
 *    header "Hero (find-a-role)" instead of plain "Hero". This activates
 *    variant CSS in blocks/hero/hero.css that provides:
 *    - Full-width background image (position: absolute; inset: 0)
 *    - Breadcrumb + H1 overlaid on image with gradient
 *    - Hides .hero-container::after keyline
 *    - Hides header auto-breadcrumbs (hero has its own)
 *    - Hides section piping/keylines from styles.css
 *
 * 2. HERO IMAGE: The IntroMedia section contains a background image at
 *    selector [class*="IntroMedia_bgImage"] img. This image should be
 *    included as Row 1 of the hero block. The content (breadcrumb + H1)
 *    goes in Row 2. Without the image, the hero renders without a background.
 *
 * 3. CSS FIX: hero.css has `.hero.find-a-role > div:first-child { position: static }`
 *    to prevent the image row from collapsing to 0 height. Without this fix,
 *    the absolutely-positioned picture is trapped in its parent's positioning context.
 *
 * 4. METADATA: Do NOT include breadcrumbs:true in the content metadata.
 *    The hero has its own breadcrumb. Header auto-breadcrumbs are hidden
 *    via CSS :has() rules, but removing the metadata flag is the proper fix.
 *
 * 5. PREPROCESS: The import preprocess removes all <nav> elements globally.
 *    The breadcrumb <nav> inside IntroTextSection will be removed before
 *    this parser runs. Use <ol> as a fallback selector for breadcrumb links.
 *
 * Generated: 2026-03-10
 */
export default function parse(element, { document }) {
  // This parser handles the IntroTextSection which contains breadcrumb + h1.
  // The IntroMedia section (sibling in page DOM) contains the hero background image.

  // Extract hero background image from IntroMedia section (outside this element)
  const heroImage = document.querySelector('[class*="IntroMedia_bgImage"] img')
    || document.querySelector('[class*="IntroMedia"] img');

  const heading = element.querySelector('h1') || element.querySelector('h2');

  // Breadcrumb: try nav first, fall back to ol (preprocess may remove nav elements)
  const breadcrumbNav = element.querySelector('nav[aria-label="Breadcrumb"]');
  const breadcrumbOl = breadcrumbNav
    ? breadcrumbNav.querySelector('ol')
    : element.querySelector('ol');
  const breadcrumbItems = breadcrumbOl
    ? Array.from(breadcrumbOl.querySelectorAll('a'))
    : [];

  // Build cells for Hero (find-a-role) block
  const cells = [];

  // Row 1: Background image from IntroMedia section
  if (heroImage) {
    const img = document.createElement('img');
    img.src = heroImage.src;
    img.alt = heroImage.alt || '';
    cells.push([img]);
  }

  // Row 2: Content - breadcrumb + heading
  const contentCell = [];

  // Add breadcrumb as a paragraph with links
  if (breadcrumbItems.length > 0) {
    const breadcrumbP = document.createElement('p');
    breadcrumbItems.forEach((a, idx) => {
      const link = document.createElement('a');
      link.href = a.href;
      link.textContent = a.textContent.trim();
      breadcrumbP.append(link);
      if (idx < breadcrumbItems.length - 1) {
        breadcrumbP.append(document.createTextNode(' / '));
      }
    });
    contentCell.push(breadcrumbP);
  }

  if (heading) contentCell.push(heading);

  cells.push(contentCell);

  // Use variant name to activate find-a-role CSS in hero.css
  const block = WebImporter.Blocks.createBlock(document, { name: 'Hero (find-a-role)', cells });
  element.replaceWith(block);
}
