/* ============================================
   CURIOSITY THEORY — Interactivity
   ============================================ */

// --- Dynamic Space Background ---
(function initStarfield() {
  const canvas = document.getElementById('starfield');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let stars = [];
  let shootingStars = [];
  let nebulae = [];
  const STAR_COUNT = 300;
  let time = 0;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function createStars() {
    stars = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      const colorRoll = Math.random();
      let r, g, b;
      if (colorRoll < 0.15) { r = 255; g = 220; b = 150; }       // gold stars
      else if (colorRoll < 0.3) { r = 200; g = 200; b = 255; }    // blue-white
      else if (colorRoll < 0.4) { r = 255; g = 200; b = 180; }    // warm
      else { r = 210; g = 210; b = 230; }                          // white
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.8 + 0.2,
        alpha: Math.random() * 0.7 + 0.1,
        baseAlpha: Math.random() * 0.5 + 0.2,
        speed: Math.random() * 0.2 + 0.02,
        drift: (Math.random() - 0.5) * 0.1,
        twinkleSpeed: Math.random() * 0.03 + 0.01,
        twinkleOffset: Math.random() * Math.PI * 2,
        r, g, b
      });
    }

    nebulae = [];
    for (let i = 0; i < 4; i++) {
      nebulae.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 300 + 200,
        r: Math.random() < 0.5 ? 212 : 100,
        g: Math.random() < 0.5 ? 168 : 80,
        b: Math.random() < 0.5 ? 71 : 150,
        alpha: Math.random() * 0.03 + 0.01,
        driftX: (Math.random() - 0.5) * 0.08,
        driftY: (Math.random() - 0.5) * 0.08
      });
    }
  }

  function spawnShootingStar() {
    if (shootingStars.length >= 2) return;
    shootingStars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height * 0.5,
      length: Math.random() * 80 + 40,
      speed: Math.random() * 6 + 4,
      angle: Math.PI / 4 + (Math.random() - 0.5) * 0.3,
      alpha: 1,
      decay: Math.random() * 0.015 + 0.01
    });
  }

  function draw() {
    time++;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Nebulae
    nebulae.forEach(n => {
      const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.radius);
      grad.addColorStop(0, `rgba(${n.r}, ${n.g}, ${n.b}, ${n.alpha})`);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(n.x - n.radius, n.y - n.radius, n.radius * 2, n.radius * 2);
      n.x += n.driftX;
      n.y += n.driftY;
      if (n.x < -n.radius) n.x = canvas.width + n.radius;
      if (n.x > canvas.width + n.radius) n.x = -n.radius;
      if (n.y < -n.radius) n.y = canvas.height + n.radius;
      if (n.y > canvas.height + n.radius) n.y = -n.radius;
    });

    // Stars
    stars.forEach(star => {
      star.alpha = star.baseAlpha + Math.sin(time * star.twinkleSpeed + star.twinkleOffset) * 0.3;
      star.alpha = Math.max(0.05, Math.min(0.9, star.alpha));

      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${star.r}, ${star.g}, ${star.b}, ${star.alpha})`;
      ctx.fill();

      // Glow for brighter stars
      if (star.radius > 1.2) {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${star.r}, ${star.g}, ${star.b}, ${star.alpha * 0.1})`;
        ctx.fill();
      }

      star.y -= star.speed;
      star.x += star.drift;
      if (star.y < -5) { star.y = canvas.height + 5; star.x = Math.random() * canvas.width; }
      if (star.x < -5) star.x = canvas.width + 5;
      if (star.x > canvas.width + 5) star.x = -5;
    });

    // Shooting stars
    if (Math.random() < 0.003) spawnShootingStar();
    shootingStars = shootingStars.filter(s => {
      const tailX = s.x - Math.cos(s.angle) * s.length;
      const tailY = s.y - Math.sin(s.angle) * s.length;
      const grad = ctx.createLinearGradient(tailX, tailY, s.x, s.y);
      grad.addColorStop(0, `rgba(212, 168, 71, 0)`);
      grad.addColorStop(1, `rgba(255, 240, 200, ${s.alpha})`);
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(s.x, s.y);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      s.x += Math.cos(s.angle) * s.speed;
      s.y += Math.sin(s.angle) * s.speed;
      s.alpha -= s.decay;
      return s.alpha > 0;
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
