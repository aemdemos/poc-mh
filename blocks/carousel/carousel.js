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

// Fallback tooltip text for legacy content that doesn't include pipe-delimited tooltips.
// New content embeds tooltips directly: "Fast track | Recruits are in high demand..."
const BADGE_TOOLTIPS_FALLBACK = {
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

function enableDragScroll(slidesEl) {
  let isDown = false;
  let startX;
  let scrollStart;
  let hasDragged = false;

  slidesEl.addEventListener('mousedown', (e) => {
    // Ignore clicks on interactive elements
    if (e.target.closest('a, button')) return;
    isDown = true;
    hasDragged = false;
    startX = e.pageX;
    scrollStart = slidesEl.scrollLeft;
    slidesEl.classList.add('carousel-slides-dragging');
    e.preventDefault();
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    const dx = e.pageX - startX;
    if (Math.abs(dx) > 5) hasDragged = true;
    slidesEl.scrollLeft = scrollStart - dx;
  });

  window.addEventListener('mouseup', () => {
    if (!isDown) return;
    isDown = false;
    slidesEl.classList.remove('carousel-slides-dragging');
  });

  // Prevent link navigation when the user was dragging, not clicking
  slidesEl.addEventListener('click', (e) => {
    if (hasDragged) {
      e.preventDefault();
      e.stopPropagation();
      hasDragged = false;
    }
  }, true);
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
    // Bare <img> tags: external images (e.g. cd.royalnavy.mod.uk) are not
    // wrapped in <picture> by AEM's pipeline. Handle them directly.
    const bareImg = imageCol?.querySelector('img');
    if (bareImg) {
      bareImg.loading = 'lazy';
      imageDiv.append(bareImg);
    } else {
      // Fallback: external images authored as <a> links
      const link = imageCol?.querySelector('a');
      if (link && /\.(jpe?g|png|gif|webp|svg)/i.test(link.textContent || link.href)) {
        const img = document.createElement('img');
        img.src = link.textContent.trim() || link.href;
        img.alt = link.getAttribute('title') || '';
        img.loading = 'lazy';
        imageDiv.append(img);
      }
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
  const badges = []; // { label, tooltip }

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
      // Badge row (comes after details)
      const text = strong.textContent.trim();
      if (text.includes('|')) {
        // Content-driven format: "Label | Tooltip text"
        const [label, ...rest] = text.split('|');
        badges.push({ label: label.trim(), tooltip: rest.join('|').trim() });
      } else {
        // Legacy format: "Fast track, Apprentice" (comma-separated, no tooltips)
        text.split(',').forEach((b) => {
          const label = b.trim();
          if (label) badges.push({ label, tooltip: '' });
        });
      }
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

    // Badges — tooltip text from authored content (pipe-delimited) or fallback map
    if (badges.length > 0) {
      const badgesDiv = document.createElement('div');
      badgesDiv.className = 'carousel-slide-badges';
      badges.forEach(({ label, tooltip: tip }) => {
        const key = label.toLowerCase().replace(/\s+/g, '-');
        const span = document.createElement('span');
        span.className = `carousel-badge carousel-badge-${key}`;
        span.textContent = label;

        const resolvedTip = tip || BADGE_TOOLTIPS_FALLBACK[key] || '';
        if (resolvedTip) {
          const info = document.createElement('span');
          info.className = 'carousel-badge-info';
          info.setAttribute('aria-label', `Info about ${label}`);
          info.innerHTML = INFO_SVG;
          const tooltipEl = document.createElement('span');
          tooltipEl.className = 'carousel-badge-tooltip';
          tooltipEl.setAttribute('role', 'tooltip');
          tooltipEl.textContent = resolvedTip;
          slide.append(tooltipEl);
          info.addEventListener('mouseenter', () => tooltipEl.classList.add('carousel-badge-tooltip-visible'));
          info.addEventListener('mouseleave', () => tooltipEl.classList.remove('carousel-badge-tooltip-visible'));
          span.append(info);
        }

        badgesDiv.append(span);
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
      const isApprentice = /\bapprentice\b/i.test(title) || badges.some(({ label }) => /apprentice/i.test(label));
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

function buildFilterBar(block, contentLabels) {
  // Collect unique tags from slide data attributes (needed for filter logic)
  const slides = block.querySelectorAll('.carousel-slide');
  const tagSet = new Set();
  slides.forEach((slide) => {
    const { tags } = slide.dataset;
    if (tags) tags.split(',').forEach((t) => tagSet.add(t));
  });

  if (tagSet.size < 1) return;

  // Use content-driven labels if provided, otherwise infer order from tag data
  let sortedTags;
  if (contentLabels && contentLabels.length > 0) {
    // Content-driven: use exact labels and order from authored content
    // Skip "All" if present (it's always added as the first pill)
    sortedTags = contentLabels.filter((l) => l.toLowerCase() !== 'all');
  } else {
    // Legacy: sort tags — Rating/Apprenticeship first, services alphabetical, Officer/Trainee last
    const frontCategories = ['Rating', 'Apprenticeship'];
    const backCategories = ['Officer', 'Trainee'];
    const front = frontCategories.filter((c) => tagSet.has(c));
    const services = [...tagSet]
      .filter((t) => !frontCategories.includes(t) && !backCategories.includes(t)).sort();
    const back = backCategories.filter((c) => tagSet.has(c));
    sortedTags = [...front, ...services, ...back];
  }

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
  const allRows = [...block.querySelectorAll(':scope > div')];

  // Detect content-driven filter metadata row: single-cell row starting with "Filters:"
  let filterLabels = null;
  const rows = [];
  allRows.forEach((row) => {
    const cols = row.querySelectorAll(':scope > div');
    if (cols.length === 1 && cols[0].textContent.trim().startsWith('Filters:')) {
      const text = cols[0].textContent.trim().substring('Filters:'.length);
      filterLabels = text.split(',').map((l) => l.trim()).filter(Boolean);
      row.remove();
    } else {
      rows.push(row);
    }
  });

  const isSingleSlide = rows.length < 2;

  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'Carousel');

  // Navigation buttons — positioned on the same row as filter pills
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

  // Build filter bar — use content-driven labels if available, otherwise infer
  buildFilterBar(block, filterLabels);

  // Bind scroll events
  if (!isSingleSlide) {
    block.querySelector('.slide-prev').addEventListener('click', () => scrollByCard(block, -1));
    block.querySelector('.slide-next').addEventListener('click', () => scrollByCard(block, 1));
    slidesWrapper.addEventListener('scroll', () => updateNavState(block), { passive: true });
    enableDragScroll(slidesWrapper);
    // Use ResizeObserver so nav state updates once grid layout resolves
    // (single rAF can fire before scrollWidth is computed for the first carousel)
    new ResizeObserver(() => updateNavState(block)).observe(slidesWrapper);
  }
}
