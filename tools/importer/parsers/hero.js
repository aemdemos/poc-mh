/* eslint-disable */
/* global WebImporter */

/**
 * Parser for hero block
 *
 * Source: https://www.royalnavy.mod.uk/careers
 * Base Block: hero
 *
 * Block Structure (from block library example):
 * - Row 1: Background image (optional, single column)
 * - Row 2: Content - heading, subheading/text, CTA (single column)
 *
 * Source HTML Pattern (from cleaned.html section#hero):
 * <section id="hero">
 *   <img alt="..." src="...">
 *   <h1>Royal navy careers</h1>
 *   <p>Much more than a 9-5...</p>
 *   <p>Ready to start your adventure?</p>
 *   <a href="/careers/register-interest">Register interest</a>
 * </section>
 *
 * Generated: 2026-02-19
 */
export default function parse(element, { document }) {
  // Extract background image
  // VALIDATED: section#hero contains <img> as direct child
  const bgImage = element.querySelector('img');

  // Extract heading
  // VALIDATED: section#hero contains <h1> element
  const heading = element.querySelector('h1') || element.querySelector('h2');

  // Extract description paragraphs
  // VALIDATED: section#hero contains <p> elements after the heading
  const paragraphs = Array.from(element.querySelectorAll('p'));

  // Extract CTA link
  // VALIDATED: section#hero contains <a> elements for CTAs
  const ctaLinks = Array.from(element.querySelectorAll('a'));

  // Build cells array matching Hero block table structure
  const cells = [];

  // Row 1: Background image (optional)
  if (bgImage) {
    cells.push([bgImage]);
  }

  // Row 2: Content - heading + paragraphs + CTAs in single column
  const contentCell = [];
  if (heading) contentCell.push(heading);
  paragraphs.forEach((p) => contentCell.push(p));
  ctaLinks.forEach((a) => contentCell.push(a));

  cells.push(contentCell);

  // Create block using WebImporter utility
  const block = WebImporter.Blocks.createBlock(document, { name: 'Hero', cells });

  // Replace original element with structured block table
  element.replaceWith(block);
}
