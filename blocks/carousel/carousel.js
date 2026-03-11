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

function getVisibleSlides(block) {
  return [...block.querySelectorAll('.carousel-slide:not(.carousel-slide-hidden)')];
}

function scrollByCard(block, direction) {
  const slides = block.querySelector('.carousel-slides');
  const visible = getVisibleSlides(block);
  if (!visible.length) return;
  const gap = parseInt(window.getComputedStyle(slides).columnGap, 10) || 40;
  const cardWidth = visible[0].offsetWidth + gap;
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

  // Content section — extract heading, description, details, and badges
  const contentDiv = document.createElement('div');
  contentDiv.className = 'carousel-slide-content';

  let href = '';
  let title = '';

  // Collect paragraphs from content column
  const paragraphs = contentCol ? [...contentCol.querySelectorAll('p')] : [];
  const detailItems = [];
  let badgeText = '';

  paragraphs.forEach((p) => {
    const em = p.querySelector('em');
    const strong = p.querySelector('strong');
    const link = p.querySelector('a');

    if (em) {
      // Detail row: "<em>Starting salary: over £25,200</em>"
      detailItems.push(em.textContent.trim());
    } else if (strong && link && !href) {
      // Title row: "<strong><a>Title</a></strong>"
      href = link.href;
      title = link.textContent.trim();
    } else if (strong && !link && detailItems.length > 0) {
      // Badge row (comes after details): "<strong>Fast track, Apprentice</strong>"
      badgeText = strong.textContent.trim();
    } else if (!href && link) {
      // Fallback: bare link as title
      href = link.href;
      title = link.textContent.trim();
    } else if (title && !em && !strong) {
      // Description paragraph (plain text after title, before details)
      const desc = document.createElement('p');
      desc.textContent = p.textContent.trim();
      if (desc.textContent) contentDiv.append(desc);
    }
  });

  // Legacy format: single <p> with <strong><a>Title</a></strong><br>Description
  if (!title && paragraphs.length > 0) {
    const firstP = paragraphs[0];
    const link = firstP.querySelector('a');
    if (link) {
      href = link.href;
      title = link.textContent.trim();
    }
    const clone = firstP.cloneNode(true);
    const s = clone.querySelector('strong');
    if (s) s.remove();
    const br = clone.querySelector('br');
    if (br) br.remove();
    const descText = clone.textContent.trim();
    if (descText) {
      const desc = document.createElement('p');
      desc.textContent = descText;
      contentDiv.append(desc);
    }
  }

  // Insert heading at the top
  const heading = document.createElement('strong');
  if (href) {
    const headingLink = document.createElement('a');
    headingLink.href = href;
    headingLink.textContent = title;
    heading.append(headingLink);
  } else {
    heading.textContent = title;
  }
  contentDiv.prepend(heading);

  slide.append(contentDiv);

  // Details section (salary, profession, requirements)
  if (detailItems.length > 0) {
    const detailsDiv = document.createElement('div');
    detailsDiv.className = 'carousel-slide-details';

    const table = document.createElement('table');
    detailItems.forEach((item) => {
      const colonIdx = item.indexOf(':');
      if (colonIdx > -1) {
        const label = item.substring(0, colonIdx + 1).trim();
        const value = item.substring(colonIdx + 1).trim();
        const tr = document.createElement('tr');
        const th = document.createElement('th');
        th.textContent = label;
        const td = document.createElement('td');
        td.textContent = value;
        tr.append(th, td);
        table.append(tr);
      }
    });
    detailsDiv.append(table);

    // Badges
    if (badgeText) {
      const badgesDiv = document.createElement('div');
      badgesDiv.className = 'carousel-slide-badges';
      badgeText.split(',').forEach((badge) => {
        const text = badge.trim();
        if (text) {
          const span = document.createElement('span');
          span.className = `carousel-badge carousel-badge-${text.toLowerCase().replace(/\s+/g, '-')}`;
          span.textContent = text;
          badgesDiv.append(span);
        }
      });
      detailsDiv.append(badgesDiv);
    }

    slide.append(detailsDiv);
  }

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

function buildFilterBar(block) {
  const badges = block.querySelectorAll('.carousel-badge');
  const uniqueTags = new Map();
  badges.forEach((badge) => {
    const text = badge.textContent.trim();
    if (text && !uniqueTags.has(text)) {
      const cls = [...badge.classList].find((c) => c !== 'carousel-badge');
      uniqueTags.set(text, cls || '');
    }
  });

  if (uniqueTags.size < 1) return;

  const filterBar = document.createElement('div');
  filterBar.className = 'carousel-filter-bar';

  // "All" pill
  const allBtn = document.createElement('button');
  allBtn.type = 'button';
  allBtn.className = 'carousel-filter-pill carousel-filter-pill-active';
  allBtn.textContent = 'All';
  allBtn.dataset.filter = '';
  filterBar.append(allBtn);

  uniqueTags.forEach((cls, text) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `carousel-filter-pill${cls ? ` ${cls}` : ''}`;
    btn.textContent = text;
    btn.dataset.filter = text;
    filterBar.append(btn);
  });

  filterBar.addEventListener('click', (e) => {
    const pill = e.target.closest('.carousel-filter-pill');
    if (!pill) return;

    // Update active state
    filterBar.querySelectorAll('.carousel-filter-pill').forEach((p) => p.classList.remove('carousel-filter-pill-active'));
    pill.classList.add('carousel-filter-pill-active');

    const filterText = pill.dataset.filter;
    const slides = block.querySelectorAll('.carousel-slide');
    slides.forEach((slide) => {
      if (!filterText) {
        slide.classList.remove('carousel-slide-hidden');
      } else {
        const slideBadges = [...slide.querySelectorAll('.carousel-badge')].map((b) => b.textContent.trim());
        slide.classList.toggle('carousel-slide-hidden', !slideBadges.includes(filterText));
      }
    });

    // Reset scroll and update nav
    const slidesContainer = block.querySelector('.carousel-slides');
    if (slidesContainer) slidesContainer.scrollTo({ left: 0, behavior: 'smooth' });
    requestAnimationFrame(() => updateNavState(block));
  });

  block.prepend(filterBar);
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

  // Build filter bar from badge data (only if badges exist)
  buildFilterBar(block);

  // Bind scroll events
  if (!isSingleSlide) {
    block.querySelector('.slide-prev').addEventListener('click', () => scrollByCard(block, -1));
    block.querySelector('.slide-next').addEventListener('click', () => scrollByCard(block, 1));
    slidesWrapper.addEventListener('scroll', () => updateNavState(block), { passive: true });
    // Delay initial state check until after layout
    requestAnimationFrame(() => updateNavState(block));
  }
}
