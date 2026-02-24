export default function decorate(block) {
  // Check for a video link (mp4) in the block
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

  // Insert video before the picture element (or at the start of the block)
  const picture = block.querySelector('picture');
  if (picture) {
    picture.parentElement.prepend(video);
  } else {
    block.prepend(video);
  }
}
