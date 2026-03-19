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
  if (!toggle || !navLinks) return;

  toggle.addEventListener('click', () => {
    toggle.classList.toggle('open');
    navLinks.classList.toggle('open');
    document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
  });

  // Close menu on link click
  navLinks.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      toggle.classList.remove('open');
      navLinks.classList.remove('open');
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

    container.innerHTML = episodes.map(ep => {
      let badgeHTML = '';
      if (ep.isNew) badgeHTML = '<span class="episode-badge">New</span>';

      const thumbHTML = ep.thumbnail
        ? `<div class="episode-thumb"><img src="${ep.thumbnail}" alt="" loading="lazy"></div>`
        : '';

      return `
        <article class="episode-card${ep.isNew ? ' fade-up visible' : ' fade-up'}"${ep.isNew ? ' data-episode="new"' : ''}>
          ${thumbHTML}
          <div class="episode-meta">
            <span class="episode-date">${ep.dateStr}</span>
            ${badgeHTML}
          </div>
          <h4 class="episode-title">${ep.title}</h4>
          <div class="episode-actions">
            <a href="${ep.link}" class="btn btn-play" target="_blank" rel="noopener">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              Listen
            </a>
          </div>
        </article>`;
    }).join('');

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

// --- Merch size & color option toggles ---
(function initMerchOptions() {
  document.querySelectorAll('.merch-size-options').forEach(group => {
    group.addEventListener('click', e => {
      const btn = e.target.closest('.merch-size-btn');
      if (!btn) return;
      group.querySelectorAll('.merch-size-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  document.querySelectorAll('.merch-color-options').forEach(group => {
    group.addEventListener('click', e => {
      const btn = e.target.closest('.merch-color-btn');
      if (!btn) return;
      group.querySelectorAll('.merch-color-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
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
