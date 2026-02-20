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
  wrapper.style.cssText = 'left:0;width:100%;height:0;position:relative;padding-bottom:56.25%';
  const iframe = document.createElement('iframe');
  iframe.src = `https://www.youtube.com/embed/${videoId}?rel=0`;
  iframe.style.cssText = 'border:0;top:0;left:0;width:100%;height:100%;position:absolute';
  iframe.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media; accelerometer; gyroscope';
  iframe.allowFullscreen = true;
  iframe.loading = 'lazy';
  iframe.title = 'Content from Youtube';
  wrapper.append(iframe);

  const p = link.closest('p') || link.parentElement;
  p.replaceWith(wrapper);
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
