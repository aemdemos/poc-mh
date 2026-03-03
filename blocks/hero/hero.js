function buildIntroSection(block) {
  // Find the content row — contains an <h1> (AEM-rendered) or '#' text (raw markdown)
  const contentDiv = Array.from(block.querySelectorAll(':scope > div'))
    .find((div) => {
      if (div.querySelector('h1')) return true;
      const p = div.querySelector('p');
      return p && p.textContent.includes('#');
    });
  if (!contentDiv) return;

  const inner = contentDiv.querySelector(':scope > div');
  if (!inner) return;

  // ── Gather content pieces from either AEM-rendered or raw format ──
  let headingText = '';
  const descriptionEls = [];
  let ctaQuestionEl = null;
  let ctaButtonEl = null;

  const existingH1 = inner.querySelector('h1');

  if (existingH1) {
    // AEM-rendered format: sibling elements
    //   <p>label<br><em>tagline</em></p>  ← Screen 1 (stays in place)
    //   <h1>Royal Navy Careers</h1>
    //   <p>description...</p>
    //   <p>Ready to start your adventure?</p>
    //   <p class="button-container"><a class="button">CTA</a></p>
    headingText = existingH1.textContent.trim();

    // Collect siblings after h1
    const afterH1 = [];
    let el = existingH1.nextElementSibling;
    while (el) {
      afterH1.push(el);
      el = el.nextElementSibling;
    }

    // Find button container
    const btnIdx = afterH1.findIndex(
      (e) => e.classList.contains('button-container') || e.querySelector('a.button'),
    );
    if (btnIdx >= 0) {
      ctaButtonEl = afterH1[btnIdx];
      // Element just before button is the CTA question
      if (btnIdx > 0) {
        ctaQuestionEl = afterH1[btnIdx - 1];
        afterH1.slice(0, btnIdx - 1).forEach((e) => descriptionEls.push(e));
      }
    } else {
      afterH1.forEach((e) => descriptionEls.push(e));
    }

    // Remove parsed elements (Screen 1 <p> stays)
    existingH1.remove();
    descriptionEls.forEach((e) => e.remove());
    if (ctaQuestionEl) ctaQuestionEl.remove();
    if (ctaButtonEl) ctaButtonEl.remove();
  } else {
    // Raw format: single <p> with <br>-separated segments and '#' heading marker
    const p = inner.querySelector('p');
    if (!p) return;

    const nodes = Array.from(p.childNodes);
    const groups = [[]];
    nodes.forEach((node) => {
      if (node.nodeName === 'BR') groups.push([]);
      else groups[groups.length - 1].push(node);
    });
    const segments = groups.filter((g) => g.some((n) => n.textContent.trim()));

    let headingIdx = -1;
    segments.forEach((seg, i) => {
      seg.forEach((n) => {
        if (n.nodeType === 3 && n.textContent.includes('#')) {
          headingIdx = i;
          headingText = n.textContent.replace(/^[^#]*#\s*/, '').trim();
        }
      });
    });
    if (headingIdx < 0) return;

    let linkIdx = -1;
    segments.forEach((seg, i) => {
      if (i > headingIdx && seg.some((n) => n.nodeName === 'A')) {
        if (linkIdx < 0) linkIdx = i;
      }
    });

    // Build Screen 1 paragraph
    const screen1P = document.createElement('p');
    segments.slice(0, headingIdx).forEach((seg, i) => {
      if (i > 0) screen1P.append(document.createElement('br'));
      seg.forEach((n) => screen1P.append(n));
    });
    p.replaceWith(screen1P);

    // Build description elements
    const descEnd = linkIdx >= 0 ? linkIdx - 1 : segments.length;
    const descSegs = segments.slice(headingIdx + 1, descEnd);
    if (descSegs.length) {
      const descP = document.createElement('p');
      descSegs.forEach((seg, i) => {
        if (i > 0) descP.append(document.createElement('br'));
        seg.forEach((n) => descP.append(n));
      });
      descriptionEls.push(descP);
    }

    // CTA question
    if (linkIdx > 0) {
      const questionSeg = segments[linkIdx - 1];
      ctaQuestionEl = document.createElement('p');
      questionSeg.forEach((n) => ctaQuestionEl.append(n));
    }

    // CTA button
    if (linkIdx >= 0) {
      const linkSeg = segments[linkIdx];
      ctaButtonEl = document.createElement('p');
      ctaButtonEl.className = 'button-container';
      linkSeg.forEach((n) => {
        if (n.nodeName === 'A') n.className = 'button';
        ctaButtonEl.append(n);
      });
    }
  }

  // ── Build Screen 2: hero-intro section ──
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

  descriptionEls.forEach((el) => textCol.append(el));

  // CTA column
  const ctaCol = document.createElement('div');
  ctaCol.className = 'hero-intro-cta';

  if (ctaQuestionEl) ctaCol.append(ctaQuestionEl);
  if (ctaButtonEl) ctaCol.append(ctaButtonEl);

  intro.append(textCol, ctaCol);

  // Down-arrow button inside hero-intro (final resting position)
  const arrow = document.createElement('div');
  arrow.className = 'hero-intro-arrow';
  arrow.innerHTML = `<button aria-label="Next section" type="button">
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
      <path d="M7.5 12.08L13.29 6.29l.71.71-6.29 6.29-.01.01-.7.7-.01-.01L0 6.99l.71-.71L6.5 12.08V0h1v12.08z"/>
    </svg>
  </button>`;
  intro.append(arrow);

  inner.append(intro);

  // Floating arrow overlay at bottom of the video viewport (Screen 1)
  const videoArrow = document.createElement('div');
  videoArrow.className = 'hero-video-arrow';
  videoArrow.innerHTML = `<button aria-label="Next section" type="button">
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
      <path d="M7.5 12.0821L13.2936 6.28856L14.0007 6.99567L7.70747 13.2889L7.70805 13.2894L7.00094 13.9965L7.00037 13.996L6.99609 14.0002L6.28899 13.2931L6.29326 13.2889L0 6.99561L0.707107 6.2885L6.5 12.0814V0.000244141H7.5V12.0821Z"/>
    </svg>
  </button>`;

  // Click scrolls to the intro section
  videoArrow.querySelector('button').addEventListener('click', () => {
    intro.scrollIntoView({ behavior: 'smooth' });
  });

  // Insert the floating arrow as a direct child of the block
  block.append(videoArrow);

  // Fade out the floating arrow as user scrolls away from Screen 1
  const screen1 = inner.querySelector('p:first-child');
  if (screen1) {
    const observer = new IntersectionObserver(
      ([entry]) => {
        videoArrow.style.opacity = entry.intersectionRatio > 0.1 ? '1' : '0';
        videoArrow.style.pointerEvents = entry.intersectionRatio > 0.1 ? 'auto' : 'none';
      },
      { threshold: [0, 0.1, 0.5, 1] },
    );
    observer.observe(screen1);
  }
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
