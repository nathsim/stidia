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

  /* ─── Fond animé EN CONTINU + réaction à la souris ───────────────────────── */
  /* Le fond dérive tout seul en permanence (mouvement ambiant sinusoïdal) et
     répond en plus à la souris. Une seule boucle rAF pilote chaque image.
     Effet signature du site : actif quel que soit le réglage système. */
  if (bg) {
    const layers = Array.prototype.slice.call(bg.querySelectorAll('.bg-3d__layer'));
    const fine   = window.matchMedia('(pointer:fine)').matches;

    let tmx = 0, tmy = 0;   // cible visée par la souris (-1 → 1)
    let cmx = 0, cmy = 0;   // valeur lissée courante

    if (fine) {
      window.addEventListener('mousemove', (e) => {
        tmx = (e.clientX / window.innerWidth  - 0.5) * 2;
        tmy = (e.clientY / window.innerHeight - 0.5) * 2;
      }, { passive: true });
      window.addEventListener('mouseleave', () => { tmx = 0; tmy = 0; });
    }

    const t0 = performance.now();
    const loop = (now) => {
      const s = (now - t0) / 1000; // secondes écoulées

      // Lissage doux vers la cible souris
      cmx += (tmx - cmx) * 0.06;
      cmy += (tmy - cmy) * 0.06;

      // Mouvement ambiant permanent (sinus/cosinus déphasés)
      const ax = Math.sin(s * 0.25) * 0.42 + Math.cos(s * 0.13) * 0.18;
      const ay = Math.cos(s * 0.21) * 0.36 + Math.sin(s * 0.17) * 0.15;

      const ox = cmx + ax; // décalage total X (souris + ambiant)
      const oy = cmy + ay; // décalage total Y

      for (const layer of layers) {
        const depth = parseFloat(layer.dataset.depth) || 20;
        layer.style.transform = `translate3d(${ox * depth * 1.4}px, ${oy * depth * 1.4}px, 0)`;
      }
      bg.style.transform = `rotateY(${ox * 8}deg) rotateX(${-oy * 8}deg)`;

      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
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

  /* ═══════════════════════════════════════════════════════════════════════════
     INTERACTIONS AVANCÉES À LA SOURIS
     (désactivées sur tactile et si prefers-reduced-motion)
  ═══════════════════════════════════════════════════════════════════════════ */
  const fine = window.matchMedia('(pointer:fine)').matches;
  if (fine) {

    /* ─── Inclinaison 3D + halo qui suit le curseur ────────────────────────── */
    /* Intensité douce pour les grands blocs (CTA, FAQ), plus marquée pour les cartes */
    const tiltGroups = [
      { sel: '.card, .step, .stats__item', factor: 12, lift: 6, persp: 760 },
      { sel: '.faq__item',                 factor: 6,  lift: 2, persp: 1000 },
      { sel: '.cta',                       factor: 5,  lift: 4, persp: 1200 },
    ];
    tiltGroups.forEach((g) => {
      document.querySelectorAll(g.sel).forEach((el) => {
        let raf = null, rx = 0, ry = 0, gx = 50, gy = 50;
        const apply = () => {
          raf = null;
          el.style.transform = `perspective(${g.persp}px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-${g.lift}px)`;
          el.style.setProperty('--mx', gx + '%');
          el.style.setProperty('--my', gy + '%');
        };
        el.addEventListener('pointerenter', () => el.classList.add('tilt'));
        el.addEventListener('pointermove', (e) => {
          const r = el.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width;   // 0 → 1
          const py = (e.clientY - r.top) / r.height;   // 0 → 1
          ry = (px - 0.5) * g.factor;   // rotation horizontale
          rx = (0.5 - py) * g.factor;   // rotation verticale
          gx = px * 100; gy = py * 100;
          if (!raf) raf = requestAnimationFrame(apply);
        });
        el.addEventListener('pointerleave', () => {
          if (raf) { cancelAnimationFrame(raf); raf = null; }
          el.classList.remove('tilt');
          el.style.transform = '';
        });
      });
    });

    /* ─── Puces modules : petit décalage 3D vers le curseur ────────────────── */
    document.querySelectorAll('.mod').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(400px) rotateX(${-py * 16}deg) rotateY(${px * 16}deg) translateY(-3px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });

    /* ─── Boutons magnétiques ──────────────────────────────────────────────── */
    document.querySelectorAll('.btn--primary').forEach((btn) => {
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) / (r.width / 2);
        const y = (e.clientY - r.top - r.height / 2) / (r.height / 2);
        btn.style.transform = `translate(${x * 7}px, ${y * 5}px)`;
      });
      btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
    });

    /* ─── Aperçu produit : pivote selon la souris dans le hero ─────────────── */
    const mockup = document.querySelector('.mockup');
    const hero   = document.querySelector('.hero');
    if (mockup && hero) {
      let mraf = null, mrx = 9, mry = 0;
      const mapply = () => { mraf = null; mockup.style.transform = `perspective(1400px) rotateX(${mrx}deg) rotateY(${mry}deg)`; };
      hero.addEventListener('pointermove', (e) => {
        const r = hero.getBoundingClientRect();
        mry = ((e.clientX - r.left) / r.width  - 0.5) * 12;
        mrx = 9 - ((e.clientY - r.top) / r.height - 0.5) * 10;
        if (!mraf) mraf = requestAnimationFrame(mapply);
      });
      hero.addEventListener('pointerleave', () => { mockup.style.transform = ''; });
    }
  }
})();
