import { getMetadata, decorateIcons } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

const SOCIAL_LINKS = [
  { icon: 'instagram', url: 'https://www.instagram.com/royalnavy/' },
  { icon: 'youtube', url: 'http://youtube.com/RoyalNavyRecruitment' },
  { icon: 'facebook', url: 'https://www.facebook.com/RoyalNavyRecruitment' },
  { icon: 'twitter', url: 'https://twitter.com/RNJobsUK' },
];

/**
 * Ensure social-media icon links exist in the "Follow" column.
 * The AEM pipeline may strip icon markup from DA content, so we
 * recreate the links when they are missing.
 */
function ensureSocialIcons(footer) {
  const followCell = Array.from(footer.querySelectorAll('strong'))
    .find((s) => s.textContent.trim().startsWith('Follow'));
  if (!followCell) return;

  const cell = followCell.closest('div');
  if (!cell || cell.querySelector('.icon')) return;

  SOCIAL_LINKS.forEach(({ icon, url }) => {
    const a = document.createElement('a');
    a.href = url;
    const span = document.createElement('span');
    span.className = `icon icon-${icon}`;
    a.append(span);
    cell.append(a);
  });
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);

  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  ensureSocialIcons(footer);
  decorateIcons(footer);

  block.append(footer);
}
