/* eslint-disable */
/* global WebImporter */

/**
 * Parser for grid CTA section on find-a-role pages
 *
 * Source: https://www.royalnavy.mod.uk/careers/find-a-role/*
 * Base Block: columns
 *
 * Two-column CTA grid:
 * - Column 1: "Search roles" with search input
 * - Column 2: "Speak to an advisor" with description + "Chat now" button
 *
 * Maps to existing Columns block with two cells per row.
 *
 * Generated: 2026-03-10
 */
export default function parse(element, { document }) {
  // Find the two grid items
  const gridItems = element.querySelectorAll('[class*="GridContainerDouble_gridRowDoubleItem"]');

  const col1 = [];
  const col2 = [];

  if (gridItems.length >= 1) {
    // Column 1: Search roles
    const searchBox = gridItems[0];
    const searchTitle = searchBox.querySelector('h2');
    if (searchTitle) {
      const h2 = document.createElement('h2');
      h2.textContent = searchTitle.textContent.trim();
      col1.push(h2);
    }
    // Add search description/placeholder
    const searchInput = searchBox.querySelector('input');
    if (searchInput) {
      const p = document.createElement('p');
      p.textContent = searchInput.placeholder || 'Search keywords';
      col1.push(p);
    }
    // Add a search CTA link
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.href = '/careers/find-a-role';
    a.textContent = 'Search';
    p.append(a);
    col1.push(p);
  }

  if (gridItems.length >= 2) {
    // Column 2: Speak to an advisor
    const advisorBlock = gridItems[1];
    const advisorTitle = advisorBlock.querySelector('h2');
    if (advisorTitle) {
      const h2 = document.createElement('h2');
      h2.textContent = advisorTitle.textContent.trim();
      col2.push(h2);
    }
    const paragraphs = advisorBlock.querySelectorAll('[class*="TextBlock_text"] p');
    paragraphs.forEach((para) => {
      const p = document.createElement('p');
      p.textContent = para.textContent.trim();
      col2.push(p);
    });
    // CTA button
    const ctaBtn = advisorBlock.querySelector('[class*="Button_textCircleButton"]');
    if (ctaBtn) {
      const p = document.createElement('p');
      const a = document.createElement('a');
      a.href = '#chat';
      a.textContent = ctaBtn.querySelector('[class*="Button_text"]')
        ? ctaBtn.querySelector('[class*="Button_text"]').textContent.trim()
        : 'Chat now';
      p.append(a);
      col2.push(p);
    }
  }

  const cells = [[col1, col2]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'Columns (apply)', cells });
  element.replaceWith(block);
}
