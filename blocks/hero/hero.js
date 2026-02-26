export default function decorate(block) {
  // Check for a video link (mp4) in the block
  const allLinks = block.querySelectorAll('a');
  const videoLink = Array.from(allLinks).find((a) => a.href.includes('.mp4'));
  if (!videoLink) return;

  const videoSrc = videoLink.href;

  // Remove the link from the DOM
  const linkParent = videoLink.closest('p') || videoLink.parentElement;
  linkParent.remove();

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
}
