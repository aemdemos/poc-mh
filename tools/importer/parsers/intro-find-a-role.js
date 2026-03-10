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
 * Section 0 (IntroMedia): decorative masks, keylines, arrow button
 * Section 1 (IntroText): breadcrumb nav + h1 heading + optional intro paragraph
 *
 * Generated: 2026-03-10
 */
export default function parse(element, { document }) {
  // This parser handles the IntroTextSection which contains breadcrumb + h1
  // The IntroMedia section above is decorative only and produces no content

  const heading = element.querySelector('h1') || element.querySelector('h2');
  const breadcrumbNav = element.querySelector('nav[aria-label="Breadcrumb"]');

  // Extract breadcrumb links
  const breadcrumbItems = breadcrumbNav
    ? Array.from(breadcrumbNav.querySelectorAll('a'))
    : [];

  // Extract intro paragraph if present
  const introTextEl = element.querySelector('[class*="IntroTextSection_introText"]');
  const introParagraph = introTextEl ? introTextEl.querySelector('p') : null;

  // Build cells for Hero block
  const cells = [];

  // Row 1: Content - breadcrumb + heading + optional intro text
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
  if (introParagraph) contentCell.push(introParagraph);

  cells.push(contentCell);

  const block = WebImporter.Blocks.createBlock(document, { name: 'Hero', cells });
  element.replaceWith(block);
}
