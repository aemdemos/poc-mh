function buildIntroSection(block) {
  const contentDiv = Array.from(block.querySelectorAll(':scope > div'))
    .find((div) => div.querySelector('h1'));
  if (!contentDiv) return;

  const inner = contentDiv.querySelector(':scope > div');
  if (!inner) return;

  const h1 = inner.querySelector('h1');
  if (!h1) return;

  // Collect "Screen 2" elements: everything from h1 onward
  const screen2Els = [];
  let el = h1;
  while (el) {
    const next = el.nextElementSibling;
    screen2Els.push(el);
    el = next;
  }

  // Split into text elements and CTA elements.
  // CTA starts at the paragraph right before the button-container.
  const ctaIdx = screen2Els.findIndex(
    (e) => e.classList.contains('button-container'),
  );
  const ctaStart = ctaIdx > 0 ? ctaIdx - 1 : ctaIdx;
  const textEls = ctaStart > 0 ? screen2Els.slice(0, ctaStart) : [screen2Els[0]];
  const ctaEls = ctaStart >= 0 ? screen2Els.slice(ctaStart) : [];

  // Build the two-column intro wrapper
  const intro = document.createElement('div');
  intro.className = 'hero-intro';

  const textCol = document.createElement('div');
  textCol.className = 'hero-intro-text';
  textEls.forEach((e) => textCol.append(e));

  const ctaCol = document.createElement('div');
  ctaCol.className = 'hero-intro-cta';
  ctaEls.forEach((e) => ctaCol.append(e));

  intro.append(textCol, ctaCol);

  // Add the down-arrow button
  const arrow = document.createElement('div');
  arrow.className = 'hero-intro-arrow';
  arrow.innerHTML = `<button aria-label="Next section" type="button">
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
      <path d="M7.5 12.08L13.29 6.29l.71.71-6.29 6.29-.01.01-.7.7-.01-.01L0 6.99l.71-.71L6.5 12.08V0h1v12.08z"/>
    </svg>
  </button>`;
  intro.append(arrow);

  inner.append(intro);
}

export default function decorate(block) {
  // Check for a video link (mp4) in the block.
  // EDS rewrites external URLs so .mp4 may only appear in the link text, not the href.
  const allLinks = block.querySelectorAll('a');
  const videoLink = Array.from(allLinks).find(
    (a) => a.href.includes('.mp4') || a.textContent.includes('.mp4'),
  );
  if (!videoLink) return;

  // Use textContent as source — the AEM pipeline may rewrite the href
  const videoSrc = videoLink.textContent.includes('.mp4')
    ? videoLink.textContent.trim()
    : videoLink.href;

  // Remove the link and its empty row wrapper from the DOM
  const linkParent = videoLink.closest('p') || videoLink.parentElement;
  const row = linkParent.closest('.hero > div');
  linkParent.remove();
  if (row && !row.textContent.trim() && !row.querySelector('picture, img')) {
    row.remove();
  }

  // Create a background video element
  const video = document.createElement('video');
  video.className = 'hero-video';
  video.autoplay = true;
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.setAttribute('playsinline', '');

  const source = document.createElement('source');
  source.src = videoSrc;
  source.type = 'video/mp4';
  video.append(source);

  // Insert video as a direct child of the block so it stays visible
  // even when the fallback image row is hidden
  block.prepend(video);

  // Only hide the fallback image once the video actually starts playing.
  // This keeps the fallback visible if the video fails to load.
  const imgRow = Array.from(block.querySelectorAll(':scope > div')).find((div) => div.querySelector('img'));
  if (imgRow) {
    video.addEventListener('playing', () => {
      imgRow.style.display = 'none';
    }, { once: true });
  }

  // Restructure Screen 2 into two-column intro with CTA box and arrow
  buildIntroSection(block);
}
