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
    // Remove header, navigation, and footer (not part of main content)
    // These are standard page structure elements present on all Royal Navy pages
    WebImporter.DOMUtils.remove(element, [
      'header',
      'nav',
      'footer',
    ]);

    // Remove script and style elements (standard cleanup)
    WebImporter.DOMUtils.remove(element, [
      'script',
      'style',
      'noscript',
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
