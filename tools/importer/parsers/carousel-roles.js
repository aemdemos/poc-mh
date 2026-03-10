/* eslint-disable */
/* global WebImporter */

/**
 * Parser for role card carousels on find-a-role pages
 *
 * Source: https://www.royalnavy.mod.uk/careers/find-a-role/*
 * Base Block: carousel
 *
 * Handles all three carousel variants:
 * - Levels of entry (4 cards, no filters)
 * - Royal Navy [category] roles (13+ cards, filter tabs)
 * - RFA [category] roles (4 cards, no filters)
 *
 * Each RoleCard has: image, title (linked), description, salary/details table, badges, CTA link
 *
 * The existing carousel block decorator (blocks/carousel/carousel.js) expects:
 * - Row per card: Column 1 = image, Column 2 = content (strong>a for title, p for description)
 *
 * This parser extends the content to include salary details and badges as additional paragraphs.
 *
 * Generated: 2026-03-10
 */
export default function parse(element, { document }) {
  // Extract section heading (carousel title like "Levels of entry")
  const sectionTitle = element.querySelector('h2');

  // Find all RoleCard elements within this carousel section
  const roleCards = Array.from(element.querySelectorAll('[class*="RoleCard_roleCard"]'));

  // Filter out empty/duplicate cards (carousel animation artifacts)
  const validCards = roleCards.filter((card) => {
    const h3 = card.querySelector('h3');
    const link = h3 ? h3.querySelector('a') : null;
    return link && link.textContent.trim().length > 0;
  });

  // Build cells array - each row is [image, textContent]
  const cells = [];

  validCards.forEach((card) => {
    // Extract image
    const img = card.querySelector('img');

    // Extract title and link
    const h3 = card.querySelector('h3');
    const titleLink = h3 ? h3.querySelector('a') : null;

    // Extract description
    const descEl = card.querySelector('[class*="RoleCard_description"]');

    // Extract salary/details table rows
    const tableRows = card.querySelectorAll('table tr');

    // Extract badges
    const badges = Array.from(card.querySelectorAll('[class*="RoleCard_labels"] button'));

    // Build image cell
    const imageCell = [];
    if (img) {
      const newImg = document.createElement('img');
      newImg.src = img.src;
      newImg.alt = img.alt || '';
      imageCell.push(newImg);
    }

    // Build content cell
    const contentCell = [];

    // Title as strong > a (matches existing carousel block decorator)
    if (titleLink) {
      const p = document.createElement('p');
      const strong = document.createElement('strong');
      const a = document.createElement('a');
      a.href = titleLink.href;
      a.textContent = titleLink.textContent.trim();
      strong.append(a);
      p.append(strong);
      contentCell.push(p);
    }

    // Description
    if (descEl) {
      const p = document.createElement('p');
      p.textContent = descEl.textContent.trim();
      contentCell.push(p);
    }

    // Salary/details as individual paragraphs
    tableRows.forEach((row) => {
      const th = row.querySelector('th');
      const td = row.querySelector('td');
      if (th && td) {
        const p = document.createElement('p');
        const em = document.createElement('em');
        em.textContent = `${th.textContent.trim()} ${td.textContent.trim()}`;
        p.append(em);
        contentCell.push(p);
      }
    });

    // Badges
    if (badges.length > 0) {
      const p = document.createElement('p');
      const strong = document.createElement('strong');
      strong.textContent = badges.map((b) => b.textContent.trim()).join(', ');
      p.append(strong);
      contentCell.push(p);
    }

    cells.push([imageCell, contentCell]);
  });

  // Create the Carousel block
  const block = WebImporter.Blocks.createBlock(document, { name: 'Carousel', cells });

  // Preserve the section heading as default content above the block
  if (sectionTitle) {
    const heading = document.createElement('h2');
    heading.textContent = sectionTitle.textContent.trim();
    element.before(heading);
  }

  element.replaceWith(block);
}
