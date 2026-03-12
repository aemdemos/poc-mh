/* eslint-disable */
/* global WebImporter */

/**
 * Parser for grid CTA sections (shared between find-a-role and careers-home).
 *
 * Source: https://www.royalnavy.mod.uk/careers, https://www.royalnavy.mod.uk/careers/find-a-role/*
 * Base Block: columns (apply)
 *
 * Two different DOM patterns:
 *
 * 1. Find-a-role pages:
 *    GridContainerDouble_gridRowDoubleItem elements
 *    - Column 1: "Search roles" with search input
 *    - Column 2: "Speak to an advisor" with description + "Chat now" button
 *
 * 2. Careers homepage:
 *    <article> elements inside GridContainerDouble_gridMiddleBottom
 *    - Column 1: "Start your application" with description + "Register interest" link
 *    - Column 2: "Got a question" with description + "Chatbot" button
 *
 * Outputs: Columns (apply) with two cells per row.
 */
export default function parse(element, { document }) {
  const col1 = [];
  const col2 = [];

  // Detect find-a-role pattern by presence of search input
  const hasSearchInput = !!element.querySelector('input');

  if (hasSearchInput) {
    // --- Find-a-role pattern: search box + advisor chat ---
    const gridItems = element.querySelectorAll('[class*="GridContainerDouble_gridRowDoubleItem"]');

    if (gridItems.length >= 1) {
      const searchBox = gridItems[0];
      const searchTitle = searchBox.querySelector('h2');
      if (searchTitle) {
        const h2 = document.createElement('h2');
        h2.textContent = searchTitle.textContent.trim();
        col1.push(h2);
      }
      const searchInput = searchBox.querySelector('input');
      if (searchInput) {
        const p = document.createElement('p');
        p.textContent = searchInput.placeholder || 'Search keywords';
        col1.push(p);
      }
      const sp = document.createElement('p');
      const sa = document.createElement('a');
      sa.href = '/careers/find-a-role';
      sa.textContent = 'Search';
      sp.append(sa);
      col1.push(sp);
    }

    if (gridItems.length >= 2) {
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
  } else {
    // --- Careers homepage pattern: articles with h2/p/link/button ---
    const articles = element.querySelectorAll('article');

    const extractArticle = (article, target) => {
      const h2 = article.querySelector('h2');
      if (h2) {
        const heading = document.createElement('h2');
        heading.textContent = h2.textContent.trim();
        target.push(heading);
      }

      const p = article.querySelector('p');
      if (p) {
        const para = document.createElement('p');
        para.textContent = p.textContent.trim();
        target.push(para);
      }

      // Link CTA (e.g., "Register interest")
      const link = article.querySelector('a[href]');
      if (link) {
        const lp = document.createElement('p');
        const a = document.createElement('a');
        a.href = link.href;
        a.textContent = link.textContent.trim() || 'Learn more';
        lp.append(a);
        target.push(lp);
      }

      // Button CTA (e.g., "Chatbot") — convert to link
      if (!link) {
        const btn = article.querySelector('button');
        if (btn) {
          const bp = document.createElement('p');
          const a = document.createElement('a');
          a.href = '#chat';
          a.textContent = btn.textContent.trim() || 'Chat now';
          bp.append(a);
          target.push(bp);
        }
      }
    };

    if (articles.length >= 1) extractArticle(articles[0], col1);
    if (articles.length >= 2) extractArticle(articles[1], col2);
  }

  const cells = [[col1, col2]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'Columns (apply)', cells });
  element.replaceWith(block);
}
