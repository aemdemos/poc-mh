/* eslint-disable */
/* global WebImporter */

/**
 * Transformer for Royal Navy website cleanup
 * Purpose: Remove non-content elements and fix DOM issues
 * Applies to: www.royalnavy.mod.uk (all templates)
 * Generated: 2026-02-19
 *
 * SELECTORS EXTRACTED FROM:
 * - Captured DOM during migration workflow (cleaned.html)
 * - Page structure analysis from page migration workflow
 */

const TransformHook = {
  beforeTransform: 'beforeTransform',
  afterTransform: 'afterTransform',
};

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Remove header and footer (not part of main content)
    WebImporter.DOMUtils.remove(element, [
      'header',
      'footer',
    ]);
    // Remove nav elements except breadcrumb nav (needed by find-a-role hero parser)
    element.querySelectorAll('nav').forEach((nav) => {
      if (nav.getAttribute('aria-label') !== 'Breadcrumb') nav.remove();
    });

    // Remove script and style elements (standard cleanup)
    WebImporter.DOMUtils.remove(element, [
      'script',
      'style',
      'noscript',
    ]);

    // Remove cookie consent, chat widgets, and tracking elements
    // These contain URLs with regex-breaking patterns like [consent-string]
    WebImporter.DOMUtils.remove(element, [
      '#onetrust-consent-sdk',
      '[class*="chatbot"]',
      '[class*="Chatbot"]',
      '[id*="chatbot"]',
      '[class*="CookieBanner"]',
      '[class*="cookie"]',
    ]);
  }

  if (hookName === TransformHook.afterTransform) {
    // Remove remaining embedded elements after parsing
    WebImporter.DOMUtils.remove(element, [
      'iframe',
      'link',
      'source',
    ]);
  }
}
