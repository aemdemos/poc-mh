import { moveInstrumentation } from '../../scripts/scripts.js';

const ARROW_SVG = `<svg viewBox="0 0 24 24" fill="currentColor">
  <path d="M12 19L11.29 18.29L17.08 12.5H5V11.5H17.08L11.29 5.71L12 5L18.29 11.29L19 12L18.29 12.71L12 19Z"/>
</svg>`;

const PREV_SVG = `<svg viewBox="0 0 25 24" fill="currentColor">
  <path d="M12.76 5L13.47 5.71L7.67 11.5H19.75V12.5H7.67L13.47 18.29L12.76 19L6.47 12.71L5.76 12L6.47 11.29L12.76 5Z"/>
</svg>`;

const NEXT_SVG = `<svg viewBox="0 0 24 24" fill="currentColor">
  <path d="M12 19L11.29 18.29L17.08 12.5H5V11.5H17.08L11.29 5.71L12 5L18.29 11.29L19 12L18.29 12.71L12 19Z"/>
</svg>`;

function scrollByCard(block, direction) {
  const slides = block.querySelector('.carousel-slides');
  const card = slides.querySelector('.carousel-slide');
  if (!card) return;
  const gap = parseInt(window.getComputedStyle(slides).columnGap, 10) || 40;
  const cardWidth = card.offsetWidth + gap;
  slides.scrollBy({ left: direction * cardWidth, behavior: 'smooth' });
}

function updateNavState(block) {
  const slides = block.querySelector('.carousel-slides');
  const prevBtn = block.querySelector('.slide-prev');
  const nextBtn = block.querySelector('.slide-next');
  if (!slides || !prevBtn || !nextBtn) return;

  const { scrollLeft, scrollWidth, clientWidth } = slides;
  prevBtn.disabled = scrollLeft <= 1;
  nextBtn.disabled = scrollLeft + clientWidth >= scrollWidth - 1;
}

function createSlide(row, slideIndex, carouselId) {
  const slide = document.createElement('li');
  slide.dataset.slideIndex = slideIndex;
  slide.setAttribute('id', `carousel-${carouselId}-slide-${slideIndex}`);
  slide.classList.add('carousel-slide');

  const columns = row.querySelectorAll(':scope > div');
  const imageCol = columns[0];
  const contentCol = columns[1];

  // Image section
  const imageDiv = document.createElement('div');
  imageDiv.className = 'carousel-slide-image';
  const picture = imageCol?.querySelector('picture');
  if (picture) {
    imageDiv.append(picture);
  } else {
    // External images: AEM strips <picture> for external URLs, so we author
    // them as plain <a> links (same pattern EDS uses for external videos).
    // Use textContent for the src — the AEM pipeline may rewrite the href.
    const link = imageCol?.querySelector('a');
    if (link && /\.(jpe?g|png|gif|webp|svg)/i.test(link.textContent || link.href)) {
      const img = document.createElement('img');
      img.src = link.textContent.trim() || link.href;
      img.alt = link.getAttribute('title') || '';
      img.loading = 'lazy';
      imageDiv.append(img);
    }
  }
  slide.append(imageDiv);

  // Content section — extract heading link and description
  const contentDiv = document.createElement('div');
  contentDiv.className = 'carousel-slide-content';

  let href = '';
  let title = '';
  let description = '';

  if (contentCol) {
    const link = contentCol.querySelector('a');
    if (link) {
      href = link.href;
      title = link.textContent.trim();
    }

    // Get description: text after the link's container
    const paragraph = contentCol.querySelector('p');
    if (paragraph) {
      const clone = paragraph.cloneNode(true);
      const strong = clone.querySelector('strong');
      if (strong) strong.remove();
      const br = clone.querySelector('br');
      if (br) br.remove();
      description = clone.textContent.trim();
    }
  }

  const heading = document.createElement('strong');
  if (href) {
    const headingLink = document.createElement('a');
    headingLink.href = href;
    headingLink.textContent = title;
    heading.append(headingLink);
  } else {
    heading.textContent = title;
  }
  contentDiv.append(heading);

  if (description) {
    const desc = document.createElement('p');
    desc.textContent = description;
    contentDiv.append(desc);
  }

  slide.append(contentDiv);

  // CTA arrow
  if (href) {
    const ctaDiv = document.createElement('div');
    ctaDiv.className = 'carousel-slide-cta';
    const ctaLink = document.createElement('a');
    ctaLink.href = href;
    ctaLink.setAttribute('aria-label', `Read more about ${title}`);
    ctaLink.innerHTML = `<span class="carousel-cta-icon">${ARROW_SVG}</span>`;
    ctaDiv.append(ctaLink);
    slide.append(ctaDiv);
  }

  return slide;
}

let carouselId = 0;
export default async function decorate(block) {
  carouselId += 1;
  block.setAttribute('id', `carousel-${carouselId}`);
  const rows = [...block.querySelectorAll(':scope > div')];
  const isSingleSlide = rows.length < 2;

  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'Carousel');

  // Navigation buttons — positioned above the cards
  if (!isSingleSlide) {
    const slideNavButtons = document.createElement('div');
    slideNavButtons.classList.add('carousel-navigation-buttons');
    slideNavButtons.innerHTML = `
      <button type="button" class="slide-prev" aria-label="Previous Slide" disabled>
        <span class="carousel-nav-icon">${PREV_SVG}</span>
      </button>
      <button type="button" class="slide-next" aria-label="Next Slide">
        <span class="carousel-nav-icon">${NEXT_SVG}</span>
      </button>
    `;
    block.prepend(slideNavButtons);
  }

  // Slides container
  const container = document.createElement('div');
  container.classList.add('carousel-slides-container');

  const slidesWrapper = document.createElement('ul');
  slidesWrapper.classList.add('carousel-slides');

  rows.forEach((row, idx) => {
    const slide = createSlide(row, idx, carouselId);
    moveInstrumentation(row, slide);
    slidesWrapper.append(slide);
    row.remove();
  });

  container.append(slidesWrapper);
  block.append(container);

  // Bind scroll events
  if (!isSingleSlide) {
    block.querySelector('.slide-prev').addEventListener('click', () => scrollByCard(block, -1));
    block.querySelector('.slide-next').addEventListener('click', () => scrollByCard(block, 1));
    slidesWrapper.addEventListener('scroll', () => updateNavState(block), { passive: true });
    // Delay initial state check until after layout
    requestAnimationFrame(() => updateNavState(block));
  }
}
