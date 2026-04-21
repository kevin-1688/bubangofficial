// ── BǑ-BĀNG 無望 — main.js v3 ──

// ── 1. SCROLL REVEAL ──
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      revealObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// ── 2. MOBILE MENU ──
const burger = document.getElementById('nav-burger');
const mobileMenu = document.getElementById('mobile-menu');

function closeMenu() {
  burger.classList.remove('open');
  burger.setAttribute('aria-expanded', 'false');
  mobileMenu.classList.remove('open');
  mobileMenu.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}
function openMenu() {
  burger.classList.add('open');
  burger.setAttribute('aria-expanded', 'true');
  mobileMenu.classList.add('open');
  mobileMenu.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}
if (burger) {
  burger.addEventListener('click', () => burger.classList.contains('open') ? closeMenu() : openMenu());
}
document.querySelectorAll('.mobile-link').forEach(l => l.addEventListener('click', closeMenu));
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

// ── 3. NAV SCROLL SHRINK ──
const nav = document.getElementById('main-nav');
window.addEventListener('scroll', () => {
  if (!nav) return;
  const compact = window.scrollY > 60;
  nav.style.background = compact ? 'rgba(17,17,24,0.98)' : '';
  nav.style.borderBottomColor = compact ? 'rgba(196,98,45,0.2)' : '';
}, { passive: true });

// ── 4. HERO TYPEWRITER on tagline ──
function typewriter(el, text, speed = 38) {
  el.textContent = '';
  const cursor = document.createElement('span');
  cursor.className = 'typewriter-cursor';
  el.appendChild(cursor);
  let i = 0;
  const interval = setInterval(() => {
    if (i < text.length) {
      el.insertBefore(document.createTextNode(text[i]), cursor);
      i++;
    } else {
      clearInterval(interval);
      setTimeout(() => { cursor.style.display = 'none'; }, 2000);
    }
  }, speed);
}

// Trigger typewriter after hero animation settles
const taglineEl = document.querySelector('.hero-tagline');
const originalText = taglineEl ? taglineEl.childNodes[0]?.textContent?.trim() : '';
if (taglineEl && originalText) {
  setTimeout(() => {
    const line1 = 'In an era where everything is stripped away,';
    const line2 = '\nyour body is the last frontier of freedom.';
    const zhEl = taglineEl.querySelector('.hero-tagline-zh');
    taglineEl.textContent = '';
    if (zhEl) taglineEl.appendChild(zhEl);
    typewriter(taglineEl, line1 + line2, 32);
  }, 2000);
}

// ── 5. CANVAS PARTICLE SYSTEM (ember sparks) ──
const canvas = document.getElementById('particles');
if (canvas) {
  const ctx = canvas.getContext('2d');
  let W, H, particles = [];

  function resize() {
    W = canvas.width = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x = Math.random() * W;
      this.y = H + Math.random() * 20;
      this.vx = (Math.random() - 0.5) * 0.4;
      this.vy = -(Math.random() * 0.8 + 0.3);
      this.life = 1;
      this.decay = Math.random() * 0.004 + 0.002;
      this.size = Math.random() * 1.5 + 0.5;
      const hue = 20 + Math.random() * 20;
      this.color = `hsla(${hue}, 80%, 55%,`;
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.life -= this.decay;
      if (this.life <= 0 || this.y < -10) this.reset();
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = this.color + this.life * 0.6 + ')';
      ctx.fill();
    }
  }

  const COUNT = window.innerWidth < 640 ? 30 : 60;
  for (let i = 0; i < COUNT; i++) {
    const p = new Particle();
    p.y = Math.random() * H; // scatter initially
    particles.push(p);
  }

  let heroVisible = true;
  new IntersectionObserver(entries => {
    heroVisible = entries[0].isIntersecting;
  }, { threshold: 0 }).observe(document.getElementById('hero'));

  function loop() {
    if (heroVisible) {
      ctx.clearRect(0, 0, W, H);
      particles.forEach(p => { p.update(); p.draw(); });
    }
    requestAnimationFrame(loop);
  }
  loop();
}

// ── 6. SF BAR ANIMATION (RAF, only when visible) ──
const barFills = document.querySelectorAll('.sf-bar-fill');
let tick = 0, sfRaf;

function animateBars() {
  tick += 0.018;
  barFills.forEach((bar, i) => {
    const base = i === 0 ? 65 : 38;
    const wave = Math.sin(tick + i * 1.6) * 9;
    bar.style.width = Math.max(8, base + wave) + '%';
  });
  sfRaf = requestAnimationFrame(animateBars);
}

const sfSection = document.getElementById('sf-system');
if (sfSection && barFills.length) {
  new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) { sfRaf = requestAnimationFrame(animateBars); }
    else { cancelAnimationFrame(sfRaf); }
  }, { threshold: 0.1 }).observe(sfSection);
}

// ── 7. PARALLAX on hero-bg (desktop only) ──
if (window.matchMedia('(min-width: 1024px)').matches) {
  const heroBg = document.querySelector('.hero-bg');
  window.addEventListener('scroll', () => {
    if (!heroBg) return;
    const y = window.scrollY;
    if (y < window.innerHeight) {
      heroBg.style.transform = `translateY(${y * 0.25}px)`;
    }
  }, { passive: true });
}

// ── 8. EMAIL SIGNUP ──
const form = document.getElementById('signup-form');
const emailInput = document.getElementById('signup-email');
const msg = document.getElementById('signup-msg');

function showMsg(text, type) {
  if (!msg) return;
  msg.textContent = text;
  msg.className = 'signup-note' + (type ? ' ' + type : '');
}

if (form) {
  form.addEventListener('submit', e => {
    e.preventDefault();
    const email = emailInput.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showMsg('請輸入有效的 Email — Please enter a valid email.', 'error');
      emailInput.focus();
      return;
    }
    try {
      const stored = JSON.parse(localStorage.getItem('bb_signups') || '[]');
      if (stored.includes(email)) {
        showMsg("你已在名單上 — You're already on the list.", '');
        return;
      }
      stored.push(email);
      localStorage.setItem('bb_signups', JSON.stringify(stored));
      showMsg("感謝登記，上線時通知你。— We'll be in touch.", 'success');
      emailInput.value = '';
    } catch (_) {
      window.location.href = 'mailto:hello@awack.studio?subject=BU-BANG Early Access&body=' + encodeURIComponent(email);
    }
  });
  emailInput.addEventListener('input', () => {
    if (msg && msg.classList.contains('error')) showMsg('', '');
  });
}

// ── 9. ACTIVE NAV HIGHLIGHT on scroll ──
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a');

const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.id;
      navLinks.forEach(a => {
        a.style.color = a.getAttribute('href') === '#' + id ? 'var(--ember-glow)' : '';
      });
    }
  });
}, { threshold: 0.4 });
sections.forEach(s => sectionObserver.observe(s));
