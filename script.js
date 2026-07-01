/* ═══════════════════════════════════════════════════════════════════════════════
   Stidia — Landing page · interactions
   Optimisé : rAF throttlé, IntersectionObserver, respect de prefers-reduced-motion.
   ═══════════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ─── Année dynamique ─────────────────────────────────────────────────────── */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ─── Fond 3D — génération des étoiles ───────────────────────────────────── */
  const STAR_COLORS = ['#A855F7', '#EC4899', '#D946EF', '#F472B6', '#C026D3', '#7C3AED', '#E879F9', '#FB7185'];
  const bg = document.getElementById('bg-3d');

  function generateStars() {
    if (!bg) return;
    bg.querySelectorAll('.bg-3d__stars').forEach((group) => {
      const count = parseInt(group.dataset.count, 10) || 12;
      const sMin  = parseFloat(group.dataset.sizeMin) || 2;
      const sMax  = parseFloat(group.dataset.sizeMax) || 4;
      const frag  = document.createDocumentFragment();
      for (let i = 0; i < count; i++) {
        const size  = sMin + Math.random() * (sMax - sMin);
        const color = STAR_COLORS[(Math.random() * STAR_COLORS.length) | 0];
        const star  = document.createElement('span');
        star.className = 'star';
        star.style.cssText =
          `left:${Math.random() * 100}%;top:${Math.random() * 100}%;` +
          `width:${size}px;height:${size}px;background:${color};` +
          `box-shadow:0 0 ${size * 2.6}px ${color};` +
          `animation-duration:${(2.5 + Math.random() * 4).toFixed(2)}s;` +
          `animation-delay:${(Math.random() * 4).toFixed(2)}s;`;
        frag.appendChild(star);
      }
      group.appendChild(frag);
    });
  }
  generateStars();

  /* ─── Parallaxe souris (throttlé via rAF) ────────────────────────────────── */
  if (bg && !reduceMotion && window.matchMedia('(pointer:fine)').matches) {
    const layers = Array.prototype.slice.call(bg.querySelectorAll('.bg-3d__layer'));
    let mx = 0, my = 0, raf = null;

    const apply = () => {
      raf = null;
      for (const layer of layers) {
        const depth = parseFloat(layer.dataset.depth) || 20;
        layer.style.transform = `translate3d(${mx * depth}px, ${my * depth}px, 0)`;
      }
      bg.style.transform = `rotateY(${mx * 7}deg) rotateX(${-my * 7}deg)`;
    };

    window.addEventListener('mousemove', (e) => {
      mx = (e.clientX / window.innerWidth  - 0.5) * 2;
      my = (e.clientY / window.innerHeight - 0.5) * 2;
      if (!raf) raf = requestAnimationFrame(apply);
    }, { passive: true });

    window.addEventListener('mouseleave', () => {
      mx = my = 0;
      for (const layer of layers) layer.style.transform = '';
      bg.style.transform = '';
    });
  }

  /* ─── Navigation : ombre au scroll + menu mobile ─────────────────────────── */
  const nav = document.getElementById('nav');
  let navRaf = null;
  const onScroll = () => {
    navRaf = null;
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 12);
  };
  window.addEventListener('scroll', () => { if (!navRaf) navRaf = requestAnimationFrame(onScroll); }, { passive: true });
  onScroll();

  const burger = document.getElementById('nav-burger');
  const links  = document.querySelector('.nav__links');
  if (burger && links) {
    burger.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    });
    links.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') {
        links.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ─── Révélation au scroll ───────────────────────────────────────────────── */
  const reveals = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    reveals.forEach((el) => el.classList.add('in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      }
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    // Léger décalage en cascade entre éléments voisins
    let i = 0, lastTop = -1;
    reveals.forEach((el) => {
      const top = el.getBoundingClientRect().top;
      i = Math.abs(top - lastTop) < 40 ? i + 1 : 0;
      lastTop = top;
      el.style.transitionDelay = Math.min(i * 70, 350) + 'ms';
      io.observe(el);
    });
  }

  /* ─── Compteurs animés ───────────────────────────────────────────────────── */
  const counters = document.querySelectorAll('.stats__num[data-count]');
  const animateCount = (el) => {
    const target = parseInt(el.dataset.count, 10) || 0;
    if (reduceMotion || target === 0) { el.textContent = String(target); return; }
    const dur = 1200;
    let start = null;
    const tick = (t) => {
      if (start === null) start = t;
      const p = Math.min((t - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = String(Math.round(target * eased));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  if ('IntersectionObserver' in window) {
    const cio = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) { animateCount(entry.target); cio.unobserve(entry.target); }
      }
    }, { threshold: 0.5 });
    counters.forEach((el) => cio.observe(el));
  } else {
    counters.forEach((el) => { el.textContent = el.dataset.count; });
  }
})();
