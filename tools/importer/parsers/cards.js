/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards block
 *
 * Source: https://www.royalnavy.mod.uk/careers
 * Base Block: cards
 *
 * Block Structure (from block library example):
 * - Row 1: Block name header (2 columns)
 * - Each subsequent row: Image (col 1) | Text content with heading, description, optional CTA (col 2)
 *
 * Source HTML Pattern (from cleaned.html):
 *
 * Pattern A - section#discover-potential (simple cards):
 * <div class="card">
 *   <img alt="..." src="...">
 *   <h3>Heading</h3>
 *   <p>Description text</p>
 * </div>
 *
 * Pattern B - section#choose-profession (linked cards):
 * <div class="card">
 *   <a href="..."><img alt="..." src="..."></a>
 *   <h3><a href="...">Heading</a></h3>
 *   <p>Description text</p>
 *   <a href="...">Read more</a>
 * </div>
 *
 * Generated: 2026-02-19
 */
export default function parse(element, { document }) {
  // Find all card elements within the section
  // VALIDATED: Both section#discover-potential and section#choose-profession contain div.card elements
  const cardElements = Array.from(element.querySelectorAll('.card'));

  // If no .card elements found, try direct child divs as fallback
  const cards = cardElements.length > 0
    ? cardElements
    : Array.from(element.querySelectorAll(':scope > div'));

  // Build cells array - each row is [image, textContent]
  const cells = [];

  cards.forEach((card) => {
    // Extract image from card
    // VALIDATED: Each .card contains an <img>, sometimes wrapped in <a>
    const img = card.querySelector('img');

    // Extract heading
    // VALIDATED: Each .card contains <h3> (optionally with <a> child)
    const heading = card.querySelector('h3') || card.querySelector('h2');

    // Extract description paragraph(s)
    // VALIDATED: Each .card contains <p> elements
    const paragraphs = Array.from(card.querySelectorAll('p'));

    // Extract CTA links (not the ones wrapping images or inside headings)
    // VALIDATED: Pattern B cards have standalone <a> links like "Read more"
    const allLinks = Array.from(card.querySelectorAll('a'));
    const ctaLinks = allLinks.filter((a) => {
      // Exclude links that just wrap images
      if (a.querySelector('img')) return false;
      // Exclude links inside headings (those are heading links, not CTAs)
      if (a.closest('h2, h3, h4')) return false;
      return true;
    });

    // Build image cell (column 1)
    const imageCell = img ? [img] : [];

    // Build text cell (column 2) - heading + description + optional CTA
    const textCell = [];
    if (heading) textCell.push(heading);
    paragraphs.forEach((p) => textCell.push(p));
    ctaLinks.forEach((a) => textCell.push(a));

    cells.push([imageCell, textCell]);
  });

  // Create block using WebImporter utility
  const block = WebImporter.Blocks.createBlock(document, { name: 'Cards', cells });

  // Replace original element with structured block table
  element.replaceWith(block);
}
