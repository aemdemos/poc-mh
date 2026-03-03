function embedYouTube(link) {
  const url = new URL(link.href.includes('youtube') ? link.href : link.textContent.trim());
  let videoId;
  if (url.hostname.includes('youtu.be')) {
    videoId = url.pathname.slice(1);
  } else {
    videoId = url.searchParams.get('v');
  }
  if (!videoId) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'youtube-thumbnail';

  const img = document.createElement('img');
  img.src = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  img.alt = 'Video thumbnail';
  img.loading = 'lazy';
  wrapper.append(img);

  const playBtn = document.createElement('button');
  playBtn.className = 'youtube-play-btn';
  playBtn.setAttribute('aria-label', 'Play video');
  playBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>`;
  wrapper.append(playBtn);

  playBtn.addEventListener('click', () => {
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube.com/embed/${videoId}?rel=0&autoplay=1`;
    iframe.style.cssText = 'border:0;width:100%;height:100%;position:absolute;top:0;left:0';
    iframe.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media; accelerometer; gyroscope';
    iframe.allowFullscreen = true;
    wrapper.innerHTML = '';
    wrapper.style.cssText = 'position:relative;padding-bottom:56.25%;height:0';
    wrapper.append(iframe);
  });

  const p = link.closest('p');
  if (p) {
    // Insert thumbnail before the <p> (div inside p is invalid HTML)
    p.parentElement.insertBefore(wrapper, p);
    // Remove the link from the <p>
    link.remove();
    // Clean up leading <br> in the remaining <p>
    while (p.firstChild && p.firstChild.nodeName === 'BR') {
      p.firstChild.remove();
    }
    // Also remove leading whitespace text nodes
    while (p.firstChild && p.firstChild.nodeType === 3 && !p.firstChild.textContent.trim()) {
      p.firstChild.remove();
    }
    // If <p> is now empty, remove it
    if (!p.textContent.trim() && !p.querySelector('*')) {
      p.remove();
    }
  } else {
    link.replaceWith(wrapper);
    while (wrapper.nextSibling && wrapper.nextSibling.nodeName === 'BR') {
      wrapper.nextSibling.remove();
    }
  }
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
}
