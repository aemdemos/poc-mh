const ARROW_SVG = `<svg viewBox="0 0 24 24" fill="currentColor">
  <path d="M12 19L11.29 18.29L17.08 12.5H5V11.5H17.08L11.29 5.71L12 5L18.29 11.29L19 12L18.29 12.71L12 19Z"/>
</svg>`;

function embedYouTube(link) {
  const url = new URL(link.href.includes('youtube') ? link.href : link.textContent.trim());
  let videoId;
  if (url.hostname.includes('youtu.be')) {
    videoId = url.pathname.slice(1);
  } else {
    videoId = url.searchParams.get('v');
  }
  if (!videoId) return;

  // Create thumbnail with play button overlay (matching original site)
  const wrapper = document.createElement('div');
  wrapper.className = 'video-embed';

  const thumbImg = document.createElement('img');
  thumbImg.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  thumbImg.alt = '';
  thumbImg.loading = 'lazy';
  thumbImg.className = 'video-thumb';
  wrapper.append(thumbImg);

  const playBtn = document.createElement('button');
  playBtn.className = 'video-play-btn';
  playBtn.setAttribute('aria-label', 'Play video');
  playBtn.innerHTML = `<svg viewBox="0 0 68 48" fill="none">
    <path d="M66.52 7.74C65.72 4.52 63.2 2 59.98 1.2 54.72 0 33.67 0 33.67 0S12.62 0 7.36 1.2C4.14 2 1.62 4.52.82 7.74-.38 13 -.38 24 -.38 24s0 11 1.2 16.26c.8 3.22 3.32 5.74 6.54 6.54C12.62 48 33.67 48 33.67 48s21.05 0 26.31-1.2c3.22-.8 5.74-3.32 6.54-6.54C67.72 35 67.72 24 67.72 24s0-11-1.2-16.26z" fill="rgba(0,0,0,0.6)"/>
    <path d="M27 34V14l18 10-18 10z" fill="white"/>
  </svg>`;
  wrapper.append(playBtn);

  // Replace thumbnail with iframe on click
  playBtn.addEventListener('click', () => {
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube.com/embed/${videoId}?rel=0&autoplay=1`;
    iframe.style.cssText = 'border:0;top:0;left:0;width:100%;height:100%;position:absolute';
    iframe.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media; accelerometer; gyroscope';
    iframe.allowFullscreen = true;
    iframe.title = 'Content from Youtube';
    wrapper.innerHTML = '';
    wrapper.style.cssText = 'left:0;width:100%;height:0;position:relative;padding-bottom:56.25%';
    wrapper.append(iframe);
  });

  const p = link.closest('p') || link.parentElement;

  // Preserve text content after the YouTube link (titles, descriptions)
  link.remove();
  // Remove leading <br> tags left behind
  while (p.firstChild && p.firstChild.nodeName === 'BR') {
    p.firstChild.remove();
  }

  if (p.textContent.trim() || p.querySelector('strong, em, a')) {
    p.classList.add('video-caption');
    p.parentElement.insertBefore(wrapper, p);
  } else {
    p.replaceWith(wrapper);
  }
}

/**
 * Convert "Learn more" text buttons in white-bg sections
 * to teal circular arrow CTAs (matching original site)
 */
function addArrowCTAs(block) {
  const section = block.closest('.section');
  if (!section?.classList.contains('white-bg')) return;

  block.querySelectorAll('.button-container').forEach((bc) => {
    const link = bc.querySelector('a.button');
    if (!link) return;
    const { href } = link;
    const label = link.textContent.trim();

    const ctaLink = document.createElement('a');
    ctaLink.href = href;
    ctaLink.className = 'cta-arrow';
    ctaLink.setAttribute('aria-label', label);
    ctaLink.innerHTML = ARROW_SVG;
    bc.replaceWith(ctaLink);
  });
}

export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  // setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          picWrapper.classList.add('columns-img-col');
        }
      }

      // auto-embed YouTube links
      col.querySelectorAll('a').forEach((a) => {
        const text = a.textContent.trim();
        const { href } = a;
        if ((text.includes('youtube.com') || text.includes('youtu.be'))
          && text === href) {
          embedYouTube(a);
        }
      });
    });
  });

  // Add teal arrow CTAs in white-bg sections
  addArrowCTAs(block);
}
