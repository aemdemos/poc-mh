import { moveInstrumentation } from '../../scripts/scripts.js';

const ARROW_SVG = `<svg viewBox="0 0 24 24" fill="currentColor">
  <path d="M12 19L11.29 18.29L17.08 12.5H5V11.5H17.08L11.29 5.71L12 5L18.29 11.29L19 12L18.29 12.71L12 19Z"/>
</svg>`;

const TAG_SVG = `<svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
  <path d="M16.9985 0.99895L16.9985 7.36291L8.09897 16.2624L1.73501 9.89845L10.6345 0.99895L16.9985 0.99895ZM17.9985 7.77712V-0.00104949H10.2203L0.320793 9.89845L8.09897 17.6766L17.9985 7.77712ZM14.8166 4.59523C14.426 4.98576 13.7929 4.98576 13.4024 4.59523C13.0118 4.20471 13.0118 3.57154 13.4024 3.18102C13.7929 2.79049 14.426 2.79049 14.8166 3.18102C15.2071 3.57154 15.2071 4.20471 14.8166 4.59523Z"/>
</svg>`;

const PREV_SVG = `<svg viewBox="0 0 25 24" fill="currentColor">
  <path d="M12.76 5L13.47 5.71L7.67 11.5H19.75V12.5H7.67L13.47 18.29L12.76 19L6.47 12.71L5.76 12L6.47 11.29L12.76 5Z"/>
</svg>`;

const NEXT_SVG = `<svg viewBox="0 0 24 24" fill="currentColor">
  <path d="M12 19L11.29 18.29L17.08 12.5H5V11.5H17.08L11.29 5.71L12 5L18.29 11.29L19 12L18.29 12.71L12 19Z"/>
</svg>`;

const INFO_SVG = `<svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
  <circle cx="10" cy="10" r="9.5" fill="none" stroke="currentColor" stroke-width="1"/>
  <text x="10" y="14.5" text-anchor="middle" font-size="12" font-weight="700" font-family="sans-serif">i</text>
</svg>`;

const BADGE_TOOLTIPS = {
  'fast-track': 'Recruits are in high demand \u2013 applying for one of these roles will mean your application is fast tracked and you\u2019ll start training sooner.',
  apprentice: 'As an apprentice you\u2019ll be learning on the job, making a vital contribution and earning a competitive wage from day one.',
  'high-interest': 'This is a highly competitive role with potential long lead time to join.',
};

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
          const key = text.toLowerCase().replace(/\s+/g, '-');
          const span = document.createElement('span');
          span.className = `carousel-badge carousel-badge-${key}`;
          span.textContent = text;

          const tip = BADGE_TOOLTIPS[key];
          if (tip) {
            const info = document.createElement('span');
            info.className = 'carousel-badge-info';
            info.setAttribute('aria-label', `Info about ${text}`);
            info.innerHTML = INFO_SVG;
            const tooltip = document.createElement('span');
            tooltip.className = 'carousel-badge-tooltip';
            tooltip.setAttribute('role', 'tooltip');
            tooltip.textContent = tip;
            slide.append(tooltip);
            info.addEventListener('mouseenter', () => tooltip.classList.add('carousel-badge-tooltip-visible'));
            info.addEventListener('mouseleave', () => tooltip.classList.remove('carousel-badge-tooltip-visible'));
            span.append(info);
          }

          badgesDiv.append(span);
        }
      });
      detailsDiv.append(badgesDiv);
    }

    slide.append(detailsDiv);

    // Extract filter tags from card data for carousel filtering.
    // Only tag cards that have a Service field (role carousels, not "Levels of entry").
    const hasService = detailItems.some((item) => /^service:/i.test(item));
    if (hasService) {
      const tags = [];
      // "Petty Officer" is an enlisted rank, not an officer
      const hasPettyOfficer = /\bpetty\s+officer\b/i.test(title);
      // "Cadet" = officer-track in the Royal Navy
      const isOfficer = (!hasPettyOfficer && /\bofficer\b/i.test(title))
        || /\bcadet\b/i.test(title);
      const isApprentice = /\bapprentice\b/i.test(title) || /apprentice/i.test(badgeText);
      if (!isOfficer) tags.push('Rating');
      if (isApprentice) tags.push('Apprenticeship');
      if (isOfficer) tags.push('Officer');
      detailItems.forEach((item) => {
        if (/^service:/i.test(item)) {
          const svc = item.substring(item.indexOf(':') + 1).trim();
          if (svc && !tags.includes(svc)) tags.push(svc);
        }
      });
      if (tags.length) slide.dataset.tags = tags.join(',');
    }
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
  // Collect unique tags from slide data attributes
  const slides = block.querySelectorAll('.carousel-slide');
  const tagSet = new Set();
  slides.forEach((slide) => {
    const { tags } = slide.dataset;
    if (tags) tags.split(',').forEach((t) => tagSet.add(t));
  });

  if (tagSet.size < 1) return;

  // Sort tags: Rating/Apprenticeship first, then services alphabetical, then Officer/Trainee
  const frontCategories = ['Rating', 'Apprenticeship'];
  const backCategories = ['Officer', 'Trainee'];
  const front = frontCategories.filter((c) => tagSet.has(c));
  const services = [...tagSet]
    .filter((t) => !frontCategories.includes(t) && !backCategories.includes(t)).sort();
  const back = backCategories.filter((c) => tagSet.has(c));
  const sortedTags = [...front, ...services, ...back];

  const filterBar = document.createElement('div');
  filterBar.className = 'carousel-filter-bar';

  const createPill = (text, isAll) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `carousel-filter-pill${isAll ? ' carousel-filter-pill-all carousel-filter-pill-active' : ''}`;
    btn.dataset.filter = isAll ? '' : text;
    btn.innerHTML = `<span class="carousel-filter-icon">${TAG_SVG}</span><span>${text}</span>`;
    return btn;
  };

  filterBar.append(createPill('All', true));
  sortedTags.forEach((tag) => filterBar.append(createPill(tag, false)));

  filterBar.addEventListener('click', (e) => {
    const pill = e.target.closest('.carousel-filter-pill');
    if (!pill || pill.disabled) return;

    filterBar.querySelectorAll('.carousel-filter-pill').forEach((p) => {
      p.classList.remove('carousel-filter-pill-active');
      p.disabled = false;
    });
    pill.classList.add('carousel-filter-pill-active');
    pill.disabled = true;

    const filterText = pill.dataset.filter;
    slides.forEach((slide) => {
      if (!filterText) {
        slide.classList.remove('carousel-slide-hidden');
      } else {
        const slideTags = (slide.dataset.tags || '').split(',');
        slide.classList.toggle('carousel-slide-hidden', !slideTags.includes(filterText));
      }
    });

    const slidesContainer = block.querySelector('.carousel-slides');
    if (slidesContainer) slidesContainer.scrollTo({ left: 0, behavior: 'smooth' });
    requestAnimationFrame(() => updateNavState(block));
  });

  // Disable the default active "All" button
  filterBar.querySelector('.carousel-filter-pill-active').disabled = true;

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
