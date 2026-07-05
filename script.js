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
      // Recentre le fond quand la fenêtre perd le focus
      window.addEventListener('blur', () => { tmx = 0; tmy = 0; });
    }

    const t0 = performance.now();
    let running = true, rafId = 0;
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

      if (running) rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);

    // Coupe la boucle quand l'onglet est caché (économie CPU/batterie), relance au retour
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { running = false; cancelAnimationFrame(rafId); }
      else if (!running) { running = true; rafId = requestAnimationFrame(loop); }
    });
  }

  /* ─── Navigation : ombre au scroll + progression + retour en haut ────────── */
  const nav = document.getElementById('nav');
  const scrollBar = document.getElementById('scroll-progress');
  const toTop = document.getElementById('to-top');
  let navRaf = null;
  const onScroll = () => {
    navRaf = null;
    const y = window.scrollY;
    if (nav) nav.classList.toggle('scrolled', y > 12);
    if (scrollBar) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      scrollBar.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
    }
    if (toTop) {
      const show = y > 600;
      if (show && toTop.hidden) toTop.hidden = false;
      toTop.classList.toggle('show', show);
    }
  };
  window.addEventListener('scroll', () => { if (!navRaf) navRaf = requestAnimationFrame(onScroll); }, { passive: true });
  onScroll();
  if (toTop) toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));

  const burger = document.getElementById('nav-burger');
  const links  = document.querySelector('.nav__links');
  if (burger && links) {
    if (!links.id) links.id = 'nav-links';
    burger.setAttribute('aria-controls', links.id);
    const closeMenu = () => {
      links.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
      burger.setAttribute('aria-label', 'Ouvrir le menu');
    };
    burger.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
      if (open) { const first = links.querySelector('a'); if (first) first.focus(); }
    });
    links.addEventListener('click', (e) => { if (e.target.tagName === 'A') closeMenu(); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && links.classList.contains('open')) { closeMenu(); burger.focus(); }
    });
  }

  /* ─── Démo vidéo : charge l'iframe seulement au clic (façade) ────────────── */
  const demoFacade = document.getElementById('demo-facade');
  const demoPhone  = document.getElementById('demo-phone');
  if (demoFacade && demoPhone) {
    demoFacade.addEventListener('click', () => {
      const frame = document.createElement('iframe');
      frame.className = 'demo__frame';
      frame.src = 'promo.html';
      frame.title = 'Vidéo de présentation Stidia';
      frame.setAttribute('allow', 'autoplay');
      demoFacade.replaceWith(frame);
    });
  }

  /* ─── Démo vivante du mockup héro (frappe → générer → résultats, en boucle) ── */
  const mockPrompt = document.getElementById('mock-prompt');
  const mockGen    = document.getElementById('mock-gen');
  const mockOut    = document.getElementById('mock-out');
  if (mockPrompt && mockGen && mockOut) {
    const mockup   = mockPrompt.closest('.mockup');
    const chars    = Array.from(mockPrompt.textContent); // découpe par points de code (emoji sûrs)
    const cards    = Array.from(mockOut.children);
    let playing = false, visible = false;

    mockup.classList.add('mockup--live');
    const wait = (ms) => new Promise(r => setTimeout(r, ms));

    async function cycle() {
      if (playing) return;
      playing = true;
      while (visible) {
        cards.forEach(c => c.classList.remove('in'));
        mockPrompt.textContent = '';
        mockPrompt.classList.add('typing');
        await wait(650);
        for (let i = 0; i < chars.length && visible; i++) {
          mockPrompt.textContent += chars[i];
          await wait(32);
        }
        if (!visible) break;
        await wait(420);
        mockPrompt.classList.remove('typing');
        mockGen.classList.add('pressed');
        await wait(190);
        mockGen.classList.remove('pressed');
        await wait(680);
        for (const c of cards) {
          if (!visible) break;
          c.classList.add('in');
          await wait(430);
        }
        await wait(4200);
      }
      // Sortie propre : contenu complet affiché en statique
      mockPrompt.classList.remove('typing');
      mockPrompt.textContent = chars.join('');
      cards.forEach(c => c.classList.add('in'));
      playing = false;
    }

    let onScreen = true;
    const startStop = () => { visible = onScreen && !document.hidden; if (visible) cycle(); };
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(es => { onScreen = es[0].isIntersecting; startStop(); }, { threshold: 0.25 }).observe(mockup);
    } else {
      startStop();
    }
    document.addEventListener('visibilitychange', startStop);
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
      { sel: '.card, .stats__item', factor: 12, lift: 6, persp: 760 },
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

  /* ─── Widget de compte (nav) : connexion / inscription / session détectée ──── */
  const accRoot = document.getElementById('acc');
  if (accRoot) {
    const PAGE = 'stidia-dashboard', EXT = 'stidia-extension';
    let pending = {}, seq = 0, extReady = false, creds = null, currentProfile = null;

    const send = (action, payload) => new Promise((resolve) => {
      const id = 'a' + (++seq);
      pending[id] = resolve;
      window.postMessage({ source: PAGE, action, payload, reqId: id }, window.location.origin);
      setTimeout(() => {
        if (pending[id]) { pending[id]({ success: false, error: 'Pas de réponse de l\'extension.' }); delete pending[id]; }
      }, 6000);
    });
    window.addEventListener('message', (e) => {
      if (e.source !== window) return;
      const d = e.data;
      if (!d || d.source !== EXT) return;
      if (d.ready) extReady = true;
      if (d.reqId && pending[d.reqId]) { pending[d.reqId](d.response); delete pending[d.reqId]; }
    });

    const btn        = document.getElementById('acc-btn');
    const btnLabel   = document.getElementById('acc-btn-label');
    const btnAvatar  = document.getElementById('acc-avatar');
    const panel      = document.getElementById('acc-panel');
    const STATES     = ['acc-detect', 'acc-login', 'acc-register', 'acc-connected'];
    const showState  = (id) => STATES.forEach((s) => { document.getElementById(s).hidden = (s !== id); });

    const PLAN_LABELS = { free: 'Découverte', creator: 'Créateur', viral: 'Viral', studio: 'Studio' };

    function renderConnected(p) {
      currentProfile = p;
      const initial = (p.username[0] || '?').toUpperCase();
      btnAvatar.textContent = initial; btnAvatar.hidden = false;
      btnLabel.textContent = '@' + p.username;
      document.getElementById('acc-c-avatar').textContent = initial;
      document.getElementById('acc-c-name').textContent = '@' + p.username;
      document.getElementById('acc-c-plan').textContent = PLAN_LABELS[p.plan] || 'Découverte';
      showState('acc-connected');
    }

    function renderLoggedOut() {
      currentProfile = null; creds = null;
      btnAvatar.hidden = true;
      btnLabel.textContent = 'Se connecter';
      showState('acc-login');
    }

    // Détection extension + session déjà active (auto-connexion sans mot de passe)
    let tries = 0;
    const probe = setInterval(() => {
      if (extReady) {
        clearInterval(probe);
        send('DASH_WHOAMI', {}).then((res) => {
          if (res && res.success && res.profile) renderConnected(res.profile);
          else renderLoggedOut();
        });
        return;
      }
      send('DASH_PING', {});
      // Après le délai de détection, on ne bloque plus sur un mur "extension introuvable" :
      // on montre directement le formulaire de connexion (avec un lien d'installation en
      // secours). Si l'extension est bien là mais juste lente à répondre, la connexion
      // fonctionnera quand même ; sinon l'utilisateur obtient une erreur claire et explicite.
      if (++tries > 8) { clearInterval(probe); renderLoggedOut(); }
    }, 300);

    // Ouverture / fermeture du panneau
    function openPanel() { panel.hidden = false; btn.setAttribute('aria-expanded', 'true'); }
    function closePanel() { panel.hidden = true; btn.setAttribute('aria-expanded', 'false'); }
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      panel.hidden ? openPanel() : closePanel();
    });
    document.addEventListener('click', (e) => { if (!accRoot.contains(e.target)) closePanel(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePanel(); });

    // Connexion
    const lBtn = document.getElementById('acc-l-btn'), lErr = document.getElementById('acc-l-error');
    function doLogin() {
      const username = document.getElementById('acc-l-user').value.trim();
      const password = document.getElementById('acc-l-pass').value;
      lErr.classList.remove('show');
      lBtn.disabled = true; lBtn.textContent = 'Connexion…';
      send('DASH_LOGIN', { username, password }).then((res) => {
        lBtn.disabled = false; lBtn.textContent = 'Se connecter';
        if (!res || !res.success) { lErr.textContent = (res && res.error) || 'Connexion impossible.'; lErr.classList.add('show'); return; }
        creds = { username, password };
        renderConnected(res.profile);
      });
    }
    lBtn.addEventListener('click', doLogin);
    ['acc-l-user', 'acc-l-pass'].forEach((id) => document.getElementById(id).addEventListener('keydown', (e) => { if (e.key === 'Enter') doLogin(); }));

    // Inscription
    const rBtn = document.getElementById('acc-r-btn'), rErr = document.getElementById('acc-r-error');
    function doRegister() {
      const username = document.getElementById('acc-r-user').value.trim();
      const password = document.getElementById('acc-r-pass').value;
      const confirm  = document.getElementById('acc-r-confirm').value;
      const apiKey   = document.getElementById('acc-r-key').value.trim();
      rErr.classList.remove('show');
      if (password !== confirm) { rErr.textContent = 'Les mots de passe ne correspondent pas.'; rErr.classList.add('show'); return; }
      rBtn.disabled = true; rBtn.textContent = 'Création…';
      send('DASH_REGISTER', { username, password, apiKey }).then((res) => {
        rBtn.disabled = false; rBtn.textContent = 'Créer mon compte';
        if (!res || !res.success) { rErr.textContent = (res && res.error) || 'Création impossible.'; rErr.classList.add('show'); return; }
        creds = { username, password };
        renderConnected(res.profile);
      });
    }
    rBtn.addEventListener('click', doRegister);
    ['acc-r-user', 'acc-r-pass', 'acc-r-confirm', 'acc-r-key'].forEach((id) => document.getElementById(id).addEventListener('keydown', (e) => { if (e.key === 'Enter') doRegister(); }));

    // Bascule connexion / inscription
    document.getElementById('acc-go-register').addEventListener('click', (e) => { e.preventDefault(); lErr.classList.remove('show'); showState('acc-register'); });
    document.getElementById('acc-go-login').addEventListener('click', (e) => { e.preventDefault(); rErr.classList.remove('show'); showState('acc-login'); });

    // Déconnexion (locale au widget — n'affecte pas la session de l'extension elle-même)
    document.getElementById('acc-logout').addEventListener('click', () => {
      document.getElementById('acc-l-pass').value = '';
      renderLoggedOut();
      closePanel();
    });
  }
})();
