function buildIntroSection(block) {
  // Find the content row — the div containing text with a '#' heading marker
  const contentDiv = Array.from(block.querySelectorAll(':scope > div'))
    .find((div) => {
      const p = div.querySelector('p');
      return p && p.textContent.includes('#');
    });
  if (!contentDiv) return;

  const inner = contentDiv.querySelector(':scope > div');
  if (!inner) return;

  const p = inner.querySelector('p');
  if (!p) return;

  // Split paragraph childNodes at <br> elements into segments
  const nodes = Array.from(p.childNodes);
  const groups = [[]];
  nodes.forEach((node) => {
    if (node.nodeName === 'BR') {
      groups.push([]);
    } else {
      groups[groups.length - 1].push(node);
    }
  });

  // Keep only non-empty segments
  const segments = groups.filter((g) => g.some((n) => n.textContent.trim()));

  // Find the heading segment (contains "# ")
  let headingIdx = -1;
  let headingText = '';
  segments.forEach((seg, i) => {
    seg.forEach((n) => {
      if (n.nodeType === 3 && n.textContent.includes('#')) {
        headingIdx = i;
        headingText = n.textContent.replace(/^[^#]*#\s*/, '').trim();
      }
    });
  });

  if (headingIdx < 0) return;

  // Find the segment containing the CTA link
  let linkIdx = -1;
  segments.forEach((seg, i) => {
    if (i > headingIdx && seg.some((n) => n.nodeName === 'A')) {
      if (linkIdx < 0) linkIdx = i;
    }
  });

  // ── Screen 1: everything before the heading (label + tagline) ──
  const screen1P = document.createElement('p');
  segments.slice(0, headingIdx).forEach((seg, i) => {
    if (i > 0) screen1P.append(document.createElement('br'));
    seg.forEach((n) => screen1P.append(n));
  });
  p.replaceWith(screen1P);

  // ── Screen 2: build the hero-intro section ──
  const intro = document.createElement('div');
  intro.className = 'hero-intro';

  // Text column: label + heading + description
  const textCol = document.createElement('div');
  textCol.className = 'hero-intro-text';

  const label = document.createElement('p');
  label.className = 'hero-intro-label';
  label.textContent = 'Royal Navy';
  textCol.append(label);

  const h1 = document.createElement('h1');
  h1.textContent = headingText;
  textCol.append(h1);

  // Description: segments between heading and CTA question
  const descEnd = linkIdx >= 0 ? linkIdx - 1 : segments.length;
  const descSegs = segments.slice(headingIdx + 1, descEnd);
  if (descSegs.length) {
    const descP = document.createElement('p');
    descSegs.forEach((seg, i) => {
      if (i > 0) descP.append(document.createElement('br'));
      seg.forEach((n) => descP.append(n));
    });
    textCol.append(descP);
  }

  // CTA column
  const ctaCol = document.createElement('div');
  ctaCol.className = 'hero-intro-cta';

  // CTA question text (segment before the link)
  if (linkIdx > 0) {
    const questionSeg = segments[linkIdx - 1];
    const ctaP = document.createElement('p');
    questionSeg.forEach((n) => ctaP.append(n));
    ctaCol.append(ctaP);
  }

  // CTA button
  if (linkIdx >= 0) {
    const linkSeg = segments[linkIdx];
    const btnContainer = document.createElement('p');
    btnContainer.className = 'button-container';
    linkSeg.forEach((n) => {
      if (n.nodeName === 'A') n.className = 'button';
      btnContainer.append(n);
    });
    ctaCol.append(btnContainer);
  }

  intro.append(textCol, ctaCol);

  // Down-arrow button
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
