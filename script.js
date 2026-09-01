// ============================================
// Mobile nav toggle
// ============================================
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

navToggle.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', String(isOpen));
});

navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

// ============================================
// Section reveal on scroll, staggered by sibling order
// ============================================
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!prefersReducedMotion) {
  const revealTargets = document.querySelectorAll('section > *');
  revealTargets.forEach((el, i) => {
    el.classList.add('reveal');
    el.style.transitionDelay = `${(i % 6) * 70}ms`;
  });

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal--visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  revealTargets.forEach(el => io.observe(el));

  // extra stagger for grid children (pillars, timeline, roles)
  document.querySelectorAll('.pillars__grid, .timeline, .join__roles').forEach(group => {
    Array.from(group.children).forEach((child, i) => {
      child.classList.add('reveal');
      child.style.transitionDelay = `${i * 110}ms`;
    });
    const groupIo = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal--visible');
          groupIo.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });
    Array.from(group.children).forEach(child => groupIo.observe(child));
  });
}

// inject minimal reveal styles (kept in JS so CSS file stays purely visual/static)
const style = document.createElement('style');
style.textContent = `
  .reveal{opacity:0; transform:translateY(16px); transition:opacity 0.7s ease, transform 0.7s ease;}
  .reveal--visible{opacity:1; transform:translateY(0);}
`;
document.head.appendChild(style);

// ============================================
// Hero logo: gentle mouse-parallax tilt
// ============================================
const heroMark = document.querySelector('.hero__mark');
const heroVisual = document.querySelector('.hero__visual');

if (heroMark && heroVisual && !prefersReducedMotion && window.matchMedia('(hover: hover)').matches) {
  heroVisual.addEventListener('mousemove', (e) => {
    const rect = heroVisual.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    heroMark.style.transform = `rotateY(${px * 14}deg) rotateX(${-py * 14}deg)`;
  });
  heroVisual.addEventListener('mouseleave', () => {
    heroMark.style.transform = '';
  });
}

// ============================================
// Nav: subtle shrink on scroll
// ============================================
const navEl = document.getElementById('nav');
let lastScrollState = false;
window.addEventListener('scroll', () => {
  const scrolled = window.scrollY > 40;
  if (scrolled !== lastScrollState) {
    navEl.classList.toggle('nav--scrolled', scrolled);
    lastScrollState = scrolled;
  }
});

// ============================================
// Background vitals canvas — a slow-drifting hex/particle
// field with a single heartbeat pulse tracing across it.
// This is the site's one signature motion element.
// ============================================
const canvas = document.getElementById('vitals-canvas');
const ctx = canvas.getContext('2d');

let w, h, particles, pulseX;

function resize() {
  w = canvas.width = window.innerWidth;
  h = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

function makeParticles(count) {
  return Array.from({ length: count }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    r: Math.random() * 1.4 + 0.3,
    vy: Math.random() * 0.12 + 0.03,
    o: Math.random() * 0.5 + 0.15
  }));
}
particles = makeParticles(Math.min(90, Math.floor((w * h) / 22000)));
pulseX = -200;

function drawHexGrid() {
  const size = 46;
  const hHex = size * Math.sqrt(3);
  ctx.strokeStyle = 'rgba(84,224,255,0.035)';
  ctx.lineWidth = 1;
  for (let y = -hHex; y < h + hHex; y += hHex / 2) {
    for (let x = -size; x < w + size; x += size * 1.5) {
      const offsetY = (Math.round(x / (size * 1.5)) % 2 === 0) ? 0 : hHex / 4;
      drawHex(x, y + offsetY, size * 0.42);
    }
  }
}

function drawHex(cx, cy, r) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i;
    const px = cx + r * Math.cos(angle);
    const py = cy + r * Math.sin(angle);
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();
}

function drawParticles() {
  particles.forEach(p => {
    p.y -= p.vy;
    if (p.y < -5) { p.y = h + 5; p.x = Math.random() * w; }
    ctx.beginPath();
    ctx.fillStyle = `rgba(84,224,255,${p.o})`;
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawPulse() {
  const y = h * 0.5;
  ctx.beginPath();
  ctx.strokeStyle = 'rgba(46,107,239,0.5)';
  ctx.lineWidth = 1.4;
  ctx.moveTo(0, y);
  for (let x = 0; x < w; x += 1) {
    let offset = 0;
    const distFromPulse = x - pulseX;
    if (distFromPulse > -40 && distFromPulse < 40) {
      const t = distFromPulse / 40;
      offset = Math.sin(t * Math.PI) * 26 * (1 - Math.abs(t));
      if (Math.abs(distFromPulse) < 6) offset = -offset * 1.6;
    }
    ctx.lineTo(x, y + offset);
  }
  ctx.stroke();

  pulseX += 3.2;
  if (pulseX > w + 200) pulseX = -200;
}

function loop() {
  ctx.clearRect(0, 0, w, h);
  drawHexGrid();
  drawParticles();
  if (!prefersReducedMotion) drawPulse();
  requestAnimationFrame(loop);
}
loop();

// ============================================
// Contact form -> WhatsApp handoff
// ============================================
const contactForm = document.getElementById('contactForm');
contactForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('cf-name').value.trim();
  const email = document.getElementById('cf-email').value.trim();
  const message = document.getElementById('cf-message').value.trim();

  const text = `Hello ZADE MedCore,%0A%0AName: ${encodeURIComponent(name)}%0AEmail: ${encodeURIComponent(email)}%0A%0AMessage:%0A${encodeURIComponent(message)}`;
  const waUrl = `https://wa.me/2348170252951?text=${text}`;
  window.open(waUrl, '_blank', 'noopener');
});
