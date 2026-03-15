/* ============================================
   CURIOSITY THEORY — Interactivity
   ============================================ */

// --- Starfield Background ---
(function initStarfield() {
  const canvas = document.getElementById('starfield');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let stars = [];
  const STAR_COUNT = 200;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function createStars() {
    stars = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.5 + 0.3,
        alpha: Math.random() * 0.6 + 0.1,
        speed: Math.random() * 0.3 + 0.05,
        drift: (Math.random() - 0.5) * 0.15
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    stars.forEach(star => {
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(180, 180, 220, ${star.alpha})`;
      ctx.fill();

      // Slow drift
      star.y -= star.speed;
      star.x += star.drift;

      // Twinkle
      star.alpha += (Math.random() - 0.5) * 0.02;
      star.alpha = Math.max(0.05, Math.min(0.7, star.alpha));

      // Wrap around
      if (star.y < -5) {
        star.y = canvas.height + 5;
        star.x = Math.random() * canvas.width;
      }
      if (star.x < -5) star.x = canvas.width + 5;
      if (star.x > canvas.width + 5) star.x = -5;
    });
    requestAnimationFrame(draw);
  }

  resize();
  createStars();
  draw();
  window.addEventListener('resize', () => { resize(); createStars(); });
})();

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

      // Detect guest/collab episodes from title
      const isGuest = /\bw\/\b/i.test(title) || /\|/.test(title);
      const isCollab = /\bcollab\b/i.test(title);

      // Format date
      let dateStr = '';
      if (published) {
        const d = new Date(published);
        dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }

      return { title, link, dateStr, thumbnail, isGuest, isCollab, isNew: i === 0 };
    });

    container.innerHTML = episodes.map(ep => {
      let badgeHTML = '';
      if (ep.isNew) badgeHTML = '<span class="episode-badge">New</span>';
      else if (ep.isCollab) badgeHTML = '<span class="episode-badge guest">Collab</span>';
      else if (ep.isGuest) badgeHTML = '<span class="episode-badge guest">Guest</span>';

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
    '.episode-card, .platform-card, .host-card, .merch-card, .contact-layout, .hero-content, .hero-stats'
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
