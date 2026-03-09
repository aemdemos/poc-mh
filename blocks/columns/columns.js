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

  // Use an existing <picture> from the same column as thumbnail if available
  const col = link.closest('div');
  const existingPic = col ? col.querySelector('picture') : null;
  if (existingPic) {
    wrapper.append(existingPic);
  } else {
    const img = document.createElement('img');
    img.src = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    img.alt = 'Video thumbnail';
    img.loading = 'lazy';
    wrapper.append(img);
  }

  const playBtn = document.createElement('button');
  playBtn.className = 'youtube-play-btn';
  playBtn.setAttribute('aria-label', 'Play video');
  playBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>';
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
    while (wrapper.nextSibling && wrapper.nextSibling.nodeType === 3
      && !wrapper.nextSibling.textContent.trim()) {
      wrapper.nextSibling.remove();
    }
    while (wrapper.previousSibling && wrapper.previousSibling.nodeName === 'BR') {
      wrapper.previousSibling.remove();
    }
    while (wrapper.previousSibling && wrapper.previousSibling.nodeType === 3
      && !wrapper.previousSibling.textContent.trim()) {
      wrapper.previousSibling.remove();
    }
  }
}

function stripQuotationMarks(text) {
  return text.replace(/^[\s\u201C\u201D\u201E\u201F"]+|[\s\u201C\u201D\u201E\u201F"]+$/g, '');
}

function detectAndApplyBenefitsVariant(block) {
  // The "benefits" variant class is lost during html-to-plain conversion.
  // Detect the benefits section by checking for "Pay and Benefits" eyebrow text
  // in the section's default-content-wrapper, then re-apply the variant class.
  const section = block.closest('.section');
  if (!section) return;
  const dcw = section.querySelector('.default-content-wrapper');
  if (!dcw) return;
  const firstP = dcw.querySelector('p:first-child');
  if (!firstP || !firstP.textContent.trim().toLowerCase().includes('pay and benefits')) return;

  block.classList.add('benefits');

  // Restructure the dash-prefixed list in the text column into proper <ul><li>
  const textCol = block.querySelector(':scope > div > div:not(.columns-img-col)');
  if (!textCol) return;
  const p = textCol.querySelector('p');
  if (!p) return;

  const html = p.innerHTML;
  // Split on <br> tags to get individual lines
  const lines = html.split(/<br\s*\/?>/gi).map((l) => l.trim()).filter(Boolean);

  const introLines = [];
  const listItems = [];
  const afterLines = [];
  let phase = 'intro'; // intro -> list -> after

  lines.forEach((line) => {
    if (phase === 'intro' && line.startsWith('-')) {
      phase = 'list';
    }
    if (phase === 'list' && !line.startsWith('-')) {
      phase = 'after';
    }

    if (phase === 'intro') {
      introLines.push(line);
    } else if (phase === 'list') {
      // Remove leading "- " from the list item
      listItems.push(line.replace(/^-\s*/, ''));
    } else {
      afterLines.push(line);
    }
  });

  // Build the new structured content
  const fragment = document.createDocumentFragment();

  if (introLines.length) {
    const introP = document.createElement('p');
    introP.innerHTML = introLines.join('<br>');
    fragment.appendChild(introP);
  }

  if (listItems.length) {
    const ul = document.createElement('ul');
    listItems.forEach((item) => {
      const li = document.createElement('li');
      li.innerHTML = item;
      ul.appendChild(li);
    });
    fragment.appendChild(ul);
  }

  if (afterLines.length) {
    // Separate the CTA link from the "Want to earn even more?" paragraph
    const afterHTML = afterLines.join('<br>');
    const temp = document.createElement('div');
    temp.innerHTML = afterHTML;

    // Find the last <a> which is the CTA link
    const allLinks = temp.querySelectorAll('a');
    const ctaLink = allLinks.length > 0 ? allLinks[allLinks.length - 1] : null;

    if (ctaLink && ctaLink.textContent.trim().toLowerCase().includes('explore pay')) {
      // Remove the CTA link from the temp div
      ctaLink.remove();
      // Clean up trailing <br> before the CTA
      const tempHTML = temp.innerHTML.replace(/(<br\s*\/?>)+\s*$/gi, '').trim();
      if (tempHTML) {
        const afterP = document.createElement('p');
        afterP.innerHTML = tempHTML;
        fragment.appendChild(afterP);
      }
      // Create the CTA as a standalone paragraph
      const ctaP = document.createElement('p');
      ctaP.className = 'benefits-cta';
      ctaP.appendChild(ctaLink);
      fragment.appendChild(ctaP);
    } else {
      const afterP = document.createElement('p');
      afterP.innerHTML = afterHTML;
      fragment.appendChild(afterP);
    }
  }

  p.replaceWith(fragment);
}

function detectAndApplyWaysToJoinVariant(block) {
  // The "ways-to-join" variant class is lost during html-to-plain conversion.
  // Detect the section by checking for "Other ways to join" heading text
  // in the section's default-content-wrapper, then re-apply the variant class.
  const section = block.closest('.section');
  if (!section) return;
  const dcw = section.querySelector('.default-content-wrapper');
  if (!dcw) return;
  const h2 = dcw.querySelector('h2');
  if (!h2 || !h2.textContent.trim().toLowerCase().includes('other ways to join')) return;

  block.classList.add('ways-to-join');
}

function restructureQuoteAttribution(block) {
  // In the quote/testimonial section (muted-blue), the quote text and attribution
  // are in a single <p> with <br> separators. Restructure into separate elements
  // so CSS can target them independently.
  const section = block.closest('.section.muted-blue');
  if (!section) return;

  const textCol = block.querySelector(':scope > div > div:not(.columns-img-col)');
  if (!textCol) return;

  // Remove stray bare text nodes (e.g. lone quotation marks) outside <p>/<div>
  [...textCol.childNodes].forEach((node) => {
    if (node.nodeType === 3 && !node.textContent.trim().replace(/["\u201C\u201D]/g, '')) {
      node.remove();
    }
  });

  const p = textCol.querySelector('p');
  if (!p || !p.querySelector('strong')) return;

  const strong = p.querySelector('strong');
  // Split: everything before the <br><br><strong> is the quote,
  // <strong> and remaining text is the attribution
  const quoteP = document.createElement('p');
  quoteP.className = 'quote-text';
  const attrDiv = document.createElement('div');
  attrDiv.className = 'quote-attribution';

  // Walk through child nodes and split at the strong element
  const nodes = [...p.childNodes];
  let reachedAttribution = false;
  nodes.forEach((node) => {
    if (node === strong) {
      reachedAttribution = true;
    }
    // Skip <br> tags right before the attribution
    if (!reachedAttribution) {
      if (node.nodeName !== 'BR') {
        const clone = node.cloneNode(true);
        // Strip literal quotation marks from text nodes in the quote
        if (clone.nodeType === 3) {
          clone.textContent = stripQuotationMarks(clone.textContent);
          if (clone.textContent) quoteP.appendChild(clone);
        } else {
          quoteP.appendChild(clone);
        }
      }
    } else if (node.nodeName !== 'BR') {
      attrDiv.appendChild(node.cloneNode(true));
    }
  });

  // Also strip quotation marks from the assembled quote text
  if (quoteP.textContent) {
    quoteP.textContent = stripQuotationMarks(quoteP.textContent);
  }

  p.replaceWith(quoteP, attrDiv);
}

export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  // Add navigation arrows for 3-col layouts (Discover section)
  if (cols.length === 3) {
    const nav = document.createElement('div');
    nav.className = 'columns-3-cols-nav';
    const prevBtn = document.createElement('button');
    prevBtn.setAttribute('aria-label', 'Previous');
    prevBtn.disabled = true;
    prevBtn.innerHTML = '<svg viewBox="0 0 14 14"><polyline points="9,2 4,7 9,12" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    const nextBtn = document.createElement('button');
    nextBtn.setAttribute('aria-label', 'Next');
    nextBtn.disabled = true;
    nextBtn.innerHTML = '<svg viewBox="0 0 14 14"><polyline points="5,2 10,7 5,12" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    nav.append(prevBtn, nextBtn);
    block.prepend(nav);
  }

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

  // Restructure quote attribution in testimonial sections
  restructureQuoteAttribution(block);

  // Detect and apply benefits variant
  detectAndApplyBenefitsVariant(block);

  // Detect and apply ways-to-join variant
  detectAndApplyWaysToJoinVariant(block);
}
