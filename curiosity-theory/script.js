/* ============================================
   CURIOSITY THEORY — Interactivity
   ============================================ */


// --- Navbar scroll effect ---
(function initNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  function checkScroll() {
    if (window.scrollY > 60) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }
  window.addEventListener('scroll', checkScroll, { passive: true });
  checkScroll();
})();

// --- Active nav link on scroll ---
(function initActiveNav() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  function updateActive() {
    const scrollPos = window.scrollY + 200;
    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const id = section.getAttribute('id');
      if (scrollPos >= top && scrollPos < top + height) {
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === '#' + id) {
            link.classList.add('active');
          }
        });
      }
    });
  }
  window.addEventListener('scroll', updateActive, { passive: true });
  updateActive();
})();

// --- Mobile menu toggle ---
(function initMobileMenu() {
  const toggle = document.getElementById('mobileToggle');
  const navLinks = document.getElementById('navLinks');
  const navActions = document.querySelector('.nav-actions');
  if (!toggle || !navLinks) return;

  toggle.addEventListener('click', () => {
    toggle.classList.toggle('open');
    navLinks.classList.toggle('open');
    if (navActions) navActions.classList.toggle('open');
    document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
  });

  // Close menu on link click
  navLinks.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      toggle.classList.remove('open');
      navLinks.classList.remove('open');
      if (navActions) navActions.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
})();

// --- Dynamic episode loading from RSS feed ---
(async function loadEpisodes() {
  const container = document.getElementById('episodeList');
  if (!container) return;

  const EPISODE_COUNT = 8;
  // Use the API proxy on Vercel, fall back to a CORS proxy for local dev
  const YT_FEED = 'https://www.youtube.com/feeds/videos.xml?playlist_id=PLerj-DEth8q7EzA53mekUtVwuWog6n8GQ';
  const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  const FEED_URL = isLocal
    ? 'https://api.allorigins.win/raw?url=' + encodeURIComponent(YT_FEED)
    : '/api/feed';

  try {
    const res = await fetch(FEED_URL);
    if (!res.ok) throw new Error('Feed fetch failed');

    const xml = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'application/xml');
    const entries = doc.querySelectorAll('entry');

    if (entries.length === 0) throw new Error('No episodes found');

    const episodes = Array.from(entries).slice(0, EPISODE_COUNT).map((entry, i) => {
      const title = entry.querySelector('title')?.textContent || 'Untitled';
      const videoId = entry.querySelector('videoId')?.textContent || '';
      const link = videoId ? `https://www.youtube.com/watch?v=${videoId}` : '#';
      const published = entry.querySelector('published')?.textContent || '';
      // Use maxresdefault with fallback to hqdefault
      const thumbnail = videoId
        ? `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`
        : '';

      // Format date
      let dateStr = '';
      if (published) {
        const d = new Date(published);
        dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }

      return { title, link, dateStr, thumbnail, isNew: i === 0 };
    });

    container.innerHTML = '';
    episodes.forEach(ep => {
      const article = document.createElement('article');
      article.className = 'episode-card fade-up' + (ep.isNew ? ' visible' : '');
      if (ep.isNew) article.dataset.episode = 'new';

      if (ep.thumbnail) {
        const thumbDiv = document.createElement('div');
        thumbDiv.className = 'episode-thumb';
        const img = document.createElement('img');
        img.src = ep.thumbnail;
        img.alt = ep.title;
        img.loading = 'lazy';
        thumbDiv.appendChild(img);
        article.appendChild(thumbDiv);
      }

      const meta = document.createElement('div');
      meta.className = 'episode-meta';
      const dateSpan = document.createElement('span');
      dateSpan.className = 'episode-date';
      dateSpan.textContent = ep.dateStr;
      meta.appendChild(dateSpan);
      if (ep.isNew) {
        const badge = document.createElement('span');
        badge.className = 'episode-badge';
        badge.textContent = 'New';
        meta.appendChild(badge);
      }
      article.appendChild(meta);

      const title = document.createElement('h4');
      title.className = 'episode-title';
      title.textContent = ep.title;
      article.appendChild(title);

      const actions = document.createElement('div');
      actions.className = 'episode-actions';
      const link = document.createElement('a');
      link.href = ep.link;
      link.className = 'btn btn-play';
      link.target = '_blank';
      link.rel = 'noopener';
      link.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg> Listen';
      actions.appendChild(link);
      article.appendChild(actions);

      container.appendChild(article);
    });

    // Re-run scroll reveal on new cards
    initScrollReveal();
  } catch (err) {
    container.innerHTML = `
      <div class="episode-error">
        <p>Couldn't load episodes right now.</p>
        <a href="https://www.curiositytheorypod.com/episodes" class="btn btn-outline" target="_blank" rel="noopener">
          View on curiositytheorypod.com
        </a>
      </div>`;
  }
})();

// --- Scroll reveal animations ---
function initScrollReveal() {
  const elements = document.querySelectorAll(
    '.episode-card, .platform-card, .host-card, .merch-card, .contact-layout, .hero-content'
  );

  elements.forEach(el => {
    if (!el.classList.contains('fade-up')) el.classList.add('fade-up');
  });

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  elements.forEach(el => observer.observe(el));
}
initScrollReveal();

// --- Smooth scroll for anchor links ---
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// --- Dynamic merch loading from Printify API ---
(async function loadMerch() {
  const grid = document.getElementById('merchGrid');
  const ctaContainer = document.getElementById('merchCta');
  const shopLink = document.getElementById('merchShopLink');
  if (!grid) return;

  const MERCH_URL = '/api/merch';

  try {
    const res = await fetch(MERCH_URL);
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || errData.error || `API returned ${res.status}`);
    }

    const data = await res.json();
    // Curate specific product types: 1 hoodie, 1 "Young Black and Rigorous" shirt, 1 mug
    const allVisible = (data.products || []).filter(p => p.visible !== false);
    const titleLower = p => p.title.toLowerCase();
    const hoodie = allVisible.find(p => titleLower(p).includes('hoodie'));
    const shirt = allVisible.find(p => titleLower(p).includes('young black') && titleLower(p).includes('rigorous'));
    const mug = allVisible.find(p => titleLower(p).includes('mug'));
    const products = [hoodie, shirt, mug].filter(Boolean);

    if (products.length === 0) throw new Error('No products found');

    // Set up "Shop All Merch" link
    if (data.shop && data.shop.url && shopLink) {
      shopLink.href = data.shop.url;
      ctaContainer.style.display = '';
    } else if (shopLink) {
      // Fallback to existing merch page
      shopLink.href = 'https://curiosity-theory-merch.printify.me/';
      ctaContainer.style.display = '';
    }

    grid.innerHTML = '';
    products.forEach(product => {
      const priceText = product.hasVariants
        ? `from $${product.price.toFixed(2)}`
        : `$${product.price.toFixed(2)}`;
      const btnText = product.hasVariants ? 'View Options' : 'Add to Cart';
      const productUrl = product.externalUrl
        || (data.shop && data.shop.url ? data.shop.url : 'https://curiosity-theory-merch.printify.me/');

      const card = document.createElement('div');
      card.className = 'merch-card fade-up';

      const imageDiv = document.createElement('div');
      imageDiv.className = 'merch-image';
      if (product.image) {
        const img = document.createElement('img');
        img.src = product.image;
        img.alt = product.title;
        img.loading = 'lazy';
        imageDiv.appendChild(img);
      }
      card.appendChild(imageDiv);

      const info = document.createElement('div');
      info.className = 'merch-info';
      const name = document.createElement('h5');
      name.className = 'merch-name';
      name.textContent = product.title;
      info.appendChild(name);
      const price = document.createElement('p');
      price.className = 'merch-price';
      price.textContent = priceText;
      info.appendChild(price);
      const btn = document.createElement('a');
      btn.href = productUrl;
      btn.className = 'merch-btn';
      btn.target = '_blank';
      btn.rel = 'noopener';
      btn.textContent = btnText;
      info.appendChild(btn);
      card.appendChild(info);

      grid.appendChild(card);
    });

    // Re-run scroll reveal on new cards
    initScrollReveal();
  } catch (err) {
    grid.innerHTML = `
      <div class="merch-error">
        <p>Couldn't load merch right now.</p>
        <a href="https://curiosity-theory-merch.printify.me/" class="btn btn-outline" target="_blank" rel="noopener">
          Shop on curiositytheorypod.com
        </a>
      </div>`;
    if (ctaContainer) ctaContainer.style.display = 'none';
  }
})();

// --- Host bio expand/collapse ---
(function initBioToggles() {
  document.querySelectorAll('.host-bio-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const wrapper = btn.closest('.host-bio-wrapper');
      wrapper.classList.toggle('expanded');
    });
  });
})();
