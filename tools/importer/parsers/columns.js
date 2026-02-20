/* eslint-disable */
/* global WebImporter */

/**
 * Parser for columns block
 *
 * Source: https://www.royalnavy.mod.uk/careers
 * Base Block: columns
 *
 * Block Structure (from block library example):
 * - Row 1: Block name header (multiple columns)
 * - Subsequent rows: Multiple cells per row, each containing text/images/links
 *
 * Source HTML Patterns (from cleaned.html):
 *
 * Pattern A - section#testimonial (image + quote):
 * <section id="testimonial">
 *   <img alt="..." src="...">
 *   <blockquote>"Quote text"</blockquote>
 *   <p>Sam</p>
 *   <p>Engineering</p>
 * </section>
 *
 * Pattern B - section#pay-benefits (image + text list):
 * <section id="pay-benefits">
 *   <h2>...</h2><p>...</p>
 *   <img alt="..." src="...">
 *   <p>...</p><ul><li>...</li></ul>
 *   <p>...</p><a href="...">CTA</a>
 * </section>
 *
 * Pattern C - section#other-ways (side-by-side cards with images):
 * <section id="other-ways">
 *   <h2>...</h2><p>...</p>
 *   <div class="card">image + h2 + p + a</div>
 *   <div class="card">image + h2 + p + a</div>
 * </section>
 *
 * Pattern D - section#cta (side-by-side text CTAs):
 * <section id="cta">
 *   <h2>Start your application</h2><p>...</p><a>...</a>
 *   <h2>Got a question</h2><p>...</p>
 * </section>
 *
 * Generated: 2026-02-19
 */
export default function parse(element, { document }) {
  const cells = [];

  // Detect which pattern this section follows
  // VALIDATED: section IDs from cleaned.html
  const sectionId = element.getAttribute('id') || '';
  const hasCards = element.querySelectorAll('.card').length > 0;
  const hasBlockquote = element.querySelector('blockquote') !== null;
  const headings = Array.from(element.querySelectorAll(':scope > h2'));

  if (hasCards) {
    // Pattern C: Side-by-side cards (section#other-ways)
    // VALIDATED: section#other-ways has div.card elements, each with img, h2, p, a
    const cardElements = Array.from(element.querySelectorAll('.card'));
    const row = cardElements.map((card) => {
      const content = [];
      const img = card.querySelector('img');
      const heading = card.querySelector('h2') || card.querySelector('h3');
      const paragraphs = Array.from(card.querySelectorAll('p'));
      const links = Array.from(card.querySelectorAll('a'));

      if (img) content.push(img);
      if (heading) content.push(heading);
      paragraphs.forEach((p) => content.push(p));
      links.forEach((a) => content.push(a));

      return content;
    });

    cells.push(row);
  } else if (hasBlockquote) {
    // Pattern A: Testimonial with image + quote (section#testimonial)
    // VALIDATED: section#testimonial has img, blockquote, p elements
    const img = element.querySelector('img');
    const quote = element.querySelector('blockquote');
    const paragraphs = Array.from(element.querySelectorAll('p'));

    const col1 = [];
    if (img) col1.push(img);

    const col2 = [];
    if (quote) col2.push(quote);
    paragraphs.forEach((p) => col2.push(p));

    cells.push([col1, col2]);
  } else if (headings.length >= 2) {
    // Pattern D: Multiple headings indicate side-by-side CTAs (section#cta)
    // VALIDATED: section#cta has two h2 elements with associated p and a elements
    // Split content at each h2 heading into separate columns
    const col1 = [];
    const col2 = [];
    let currentCol = col1;

    const children = Array.from(element.children);
    let headingCount = 0;

    children.forEach((child) => {
      if (child.tagName === 'H2') {
        headingCount++;
        if (headingCount === 2) currentCol = col2;
      }
      currentCol.push(child);
    });

    cells.push([col1, col2]);
  } else {
    // Pattern B: Image + text content side by side (section#pay-benefits)
    // VALIDATED: section#pay-benefits has img, p, ul, a elements after default content h2/p
    const img = element.querySelector('img');
    const paragraphs = Array.from(element.querySelectorAll('p'));
    const lists = Array.from(element.querySelectorAll('ul, ol'));
    const links = Array.from(element.querySelectorAll(':scope > a'));

    // Skip the first h2 and first p (they are default content, not part of columns block)
    const firstH2 = element.querySelector(':scope > h2');
    const defaultParagraphs = [];
    if (firstH2) {
      // Find paragraphs between h2 and img (these are default content intro text)
      let sibling = firstH2.nextElementSibling;
      while (sibling && sibling.tagName !== 'IMG' && sibling !== img) {
        if (sibling.tagName === 'P') defaultParagraphs.push(sibling);
        sibling = sibling.nextElementSibling;
      }
    }

    // Column 1: Image
    const col1 = [];
    if (img) col1.push(img);

    // Column 2: Text content (paragraphs after image + lists + CTA links)
    const col2 = [];
    const contentParagraphs = paragraphs.filter(
      (p) => !defaultParagraphs.includes(p),
    );
    contentParagraphs.forEach((p) => col2.push(p));
    lists.forEach((list) => col2.push(list));
    links.forEach((a) => col2.push(a));

    cells.push([col1, col2]);
  }

  // Create block using WebImporter utility
  const block = WebImporter.Blocks.createBlock(document, { name: 'Columns', cells });

  // Replace original element with structured block table
  element.replaceWith(block);
}
