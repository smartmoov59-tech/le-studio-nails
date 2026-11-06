/* ==========================================================
   Le Studio Nail's — animations & interactions
   GSAP + ScrollTrigger + Lenis (hébergés en local, aucun service externe)
   ========================================================== */
(() => {
  'use strict';

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const root = document.documentElement;

  const PHONE = '+33619799203';

  const fail = (err) => {
    if (err) console.error('[studio]', err);
    root.classList.remove('js');
    const l = $('#loader'); if (l) l.remove();
    $$('[data-reveal]').forEach((e) => e.classList.add('is-in'));
    $$('[data-split]').forEach((e) => { e.style.visibility = 'visible'; });
  };

  if (!window.gsap || !window.ScrollTrigger) return fail('GSAP indisponible');

  try { init(); } catch (e) { fail(e); }

  function init() {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });

    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
    const saveData = !!(navigator.connection && navigator.connection.saveData);

    /* ---------- Smooth scroll (Lenis) ---------- */
    let lenis = null;
    if (!reduced && window.Lenis) {
      lenis = new Lenis({ lerp: 0.085, smoothWheel: true });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
      lenis.stop();
    }
    const stopScroll = () => { if (lenis) lenis.stop(); else document.body.style.overflow = 'hidden'; };
    const startScroll = () => { if (lenis) lenis.start(); else document.body.style.overflow = ''; };

    /* ---------- Découpage du texte (lettres / mots) ---------- */
    function splitEl(el, mode) {
      if (el._parts) return el._parts;
      const parts = [];
      if (!el.hasAttribute('aria-hidden')) el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
      const walk = (node) => {
        Array.from(node.childNodes).forEach((ch) => {
          if (ch.nodeType === 3) {
            const frag = document.createDocumentFragment();
            ch.textContent.split(/([ \t\r\n]+)/).forEach((w) => {
              if (!w) return;
              if (/^[ \t\r\n]+$/.test(w)) { frag.appendChild(document.createTextNode(' ')); return; }
              const ws = document.createElement('span');
              ws.className = 'w'; ws.setAttribute('aria-hidden', 'true');
              if (mode === 'chars') {
                ws.style.overflow = 'visible';
                Array.from(w).forEach((c) => {
                  const cs = document.createElement('span'); cs.className = 'c';
                  const ci = document.createElement('span'); ci.className = 'ci'; ci.textContent = c;
                  cs.appendChild(ci); ws.appendChild(cs); parts.push(ci);
                });
              } else {
                const wi = document.createElement('span'); wi.className = 'wi'; wi.textContent = w;
                ws.appendChild(wi); parts.push(wi);
              }
              frag.appendChild(ws);
            });
            ch.replaceWith(frag);
          } else if (ch.nodeType === 1 && ch.tagName !== 'BR') walk(ch);
        });
      };
      walk(el);
      el.style.visibility = 'visible';
      el._parts = parts;
      return parts;
    }

    const heroTitle = $('.hero__title');
    const footGiant = $('.foot__giant');
    const heroParts = splitEl(heroTitle, 'chars');
    const footParts = splitEl(footGiant, 'chars');

    /* Titres de section : mots qui montent sous un masque */
    $$('[data-split]').forEach((el) => {
      if (el === heroTitle || el === footGiant) return;
      const parts = splitEl(el, el.dataset.split || 'words');
      if (reduced) return;
      gsap.set(parts, { yPercent: 118 });
      ScrollTrigger.create({
        trigger: el, start: 'top 88%', once: true,
        onEnter: () => gsap.to(parts, { yPercent: 0, duration: 1.3, ease: 'expo.out', stagger: 0.06 })
      });
    });

    /* Apparitions douces */
    $$('[data-reveal]').forEach((el) => {
      if (reduced) { el.classList.add('is-in'); return; }
      gsap.to(el, {
        opacity: 1, y: 0, duration: 1.15, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 91%', once: true },
        onComplete: () => { el.classList.add('is-in'); gsap.set(el, { clearProps: 'opacity,transform' }); }
      });
    });

    /* Footer : lettres géantes */
    if (!reduced) {
      gsap.set(footParts, { yPercent: 115 });
      ScrollTrigger.create({
        trigger: footGiant, start: 'top 92%', once: true,
        onEnter: () => gsap.to(footParts, { yPercent: 0, duration: 1.4, ease: 'expo.out', stagger: 0.04 })
      });
    }

    /* ---------- Vidéos ---------- */
    const heroVideo = $('#heroVideo');
    const small = innerWidth < 900 || saveData;
    heroVideo.src = small ? 'video/hero-720.mp4' : 'video/hero-1080.mp4';
    if (!reduced && !saveData) heroVideo.play().catch(() => {});

    if (!reduced && !saveData && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          const v = en.target;
          if (en.isIntersecting) {
            if (!v.src) v.src = v.dataset.lazyvideo;
            v.play().catch(() => {});
          } else v.pause();
        });
      }, { rootMargin: '200px 0px' });
      $$('[data-lazyvideo]').forEach((v) => io.observe(v));
    }
    // pause la vidéo du hero quand elle n'est plus visible
    if (!reduced && 'IntersectionObserver' in window) {
      new IntersectionObserver((en) => { en[0].isIntersecting ? heroVideo.play().catch(() => {}) : heroVideo.pause(); }, { threshold: 0.05 })
        .observe($('.hero'));
    }

    /* ---------- Intro du hero ---------- */
    gsap.set($$('[data-hero-in]'), { opacity: 0, y: 30 });
    if (!reduced) {
      gsap.set(heroParts, { yPercent: 118 });
      gsap.set('.hero__video', { scale: 1.4 });
      gsap.set('.hero__ph', { scale: 0.7, opacity: 0 });
      gsap.set('.fl', { scale: 0, opacity: 0 });
      gsap.set('.hero__wave', { opacity: 0 });
    }

    function heroIn() {
      if (reduced) {
        gsap.set($$('[data-hero-in]'), { opacity: 1, y: 0 });
        return;
      }
      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
      tl.to('.hero__video', { scale: 1.12, duration: 3 }, 0)
        .to(heroParts, { yPercent: 0, duration: 1.6, stagger: 0.045 }, 0.2)
        .to('[data-hero-in]', { opacity: 1, y: 0, duration: 1.2, stagger: 0.12 }, 0.65)
        .to('.hero__ph', { scale: 1, opacity: 1, duration: 1.8, stagger: 0.2 }, 0.45)
        .to('.fl', { scale: 1, opacity: 0.85, duration: 1.3, stagger: 0.09 }, 0.9)
        .to('.hero__wave', { opacity: 1, duration: 1 }, 0.5);
    }

    /* ---------- Préchargeur ---------- */
    function runLoader() {
      const loader = $('#loader');
      if (!loader || reduced) { if (loader) loader.remove(); startScroll(); heroIn(); ScrollTrigger.refresh(); return; }
      const num = $('#loaderNum'), fill = $('.loader__fill'), core = $('.loader__core');
      const o = { v: 0 };
      const ready = new Promise((res) => {
        if (document.readyState === 'complete') res();
        window.addEventListener('load', res, { once: true });
        setTimeout(res, 4500); // filet de sécurité
      });

      gsap.set(core, { opacity: 0, y: 24 });
      const tl = gsap.timeline();
      tl.to(core, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' }, 0)
        .to(o, {
          v: 100, duration: 2.1, ease: 'power2.inOut',
          onUpdate() {
            num.textContent = String(Math.round(o.v)).padStart(2, '0');
            fill.setAttribute('y', (140 * (1 - o.v / 100)).toFixed(1));
          }
        }, 0);

      const exit = () => {
        const ex = gsap.timeline({
          onComplete: () => { loader.remove(); startScroll(); ScrollTrigger.refresh(); }
        });
        ex.to(core, { scale: 1.2, opacity: 0, duration: 0.6, ease: 'power2.in' }, 0)
          .to(['.loader__count', '.loader__place'], { opacity: 0, y: -24, duration: 0.5, ease: 'power2.in' }, 0)
          .to('.loader__panel--l', { xPercent: -101, duration: 1.3, ease: 'expo.inOut' }, 0.5)
          .to('.loader__panel--r', { xPercent: 101, duration: 1.3, ease: 'expo.inOut' }, 0.5)
          .add(heroIn, 1.05);
      };
      tl.eventCallback('onComplete', () => { ready.then(exit); });
    }

    /* ---------- Navigation ---------- */
    const nav = $('#nav');
    const burger = $('#burger');
    const menu = $('#menu');
    let navHidden = false;
    let menuOpen = false;

    ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate: (self) => {
        const y = self.scroll();
        nav.classList.toggle('is-solid', y > 60);
        if (menuOpen) return;
        const shouldHide = y > 320 && self.direction === 1;
        const shouldShow = self.direction === -1 || y <= 320;
        if (shouldHide && !navHidden) { navHidden = true; gsap.to(nav, { yPercent: -110, duration: 0.6, ease: 'power3.out', overwrite: 'auto' }); }
        else if (shouldShow && navHidden) { navHidden = false; gsap.to(nav, { yPercent: 0, duration: 0.6, ease: 'power3.out', overwrite: 'auto' }); }
      }
    });

    function openMenu() {
      menuOpen = true;
      nav.classList.add('is-menu');
      gsap.set(nav, { yPercent: 0 });
      menu.style.visibility = 'visible';
      menu.setAttribute('aria-hidden', 'false');
      burger.setAttribute('aria-expanded', 'true');
      burger.setAttribute('aria-label', 'Fermer le menu');
      stopScroll();
      gsap.to(menu, { clipPath: 'circle(150% at 90% 6%)', duration: 1.1, ease: 'expo.inOut' });
      gsap.fromTo('.menu__nav a', { yPercent: 115 }, { yPercent: 0, duration: 1.1, ease: 'expo.out', stagger: 0.07, delay: 0.35 });
      gsap.fromTo('.menu__foot', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.9, delay: 0.7 });
      const first = $('.menu__nav a'); if (first) setTimeout(() => first.focus({ preventScroll: true }), 500);
    }
    function closeMenu() {
      if (!menuOpen) return;
      menuOpen = false;
      burger.setAttribute('aria-expanded', 'false');
      burger.setAttribute('aria-label', 'Ouvrir le menu');
      menu.setAttribute('aria-hidden', 'true');
      gsap.to(menu, {
        clipPath: 'circle(0% at 90% 6%)', duration: 0.8, ease: 'expo.inOut',
        onComplete: () => { menu.style.visibility = 'hidden'; nav.classList.remove('is-menu'); }
      });
      startScroll();
    }
    burger.addEventListener('click', () => (menuOpen ? closeMenu() : openMenu()));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });

    /* ---------- Ancres ---------- */
    $$('a[href^="#"]').forEach((a) => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href');
        if (!id || id === '#') return;
        const t = id === '#top' ? $('#top') : $(id);
        if (!t) return;
        e.preventDefault();
        const wasOpen = menuOpen;
        closeMenu();
        const go = () => {
          if (lenis) lenis.scrollTo(t, { duration: 1.7, easing: (x) => 1 - Math.pow(1 - x, 4) });
          else t.scrollIntoView({ behavior: 'auto', block: 'start' });
        };
        wasOpen ? setTimeout(go, 450) : go();
      });
    });

    /* ---------- Barre de progression ---------- */
    gsap.to('.progress i', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });

    /* ---------- Hero : parallax multicouche ---------- */
    if (!reduced) {
      const heroST = { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true };
      gsap.to('.hero__media', { yPercent: 16, ease: 'none', scrollTrigger: heroST });
      gsap.to('.hero__inner', { yPercent: -14, ease: 'none', scrollTrigger: heroST });
      $$('.hero__floaters [data-depth]').forEach((el) => {
        const d = parseFloat(el.dataset.depth);
        gsap.to(el, { yPercent: -45 * d, ease: 'none', scrollTrigger: heroST });
      });
      if (fine) {
        const qs = $$('.hero__floaters [data-depth]').map((el) => ({
          x: gsap.quickTo(el, 'x', { duration: 1.3, ease: 'power3' }),
          y: gsap.quickTo(el, 'y', { duration: 1.3, ease: 'power3' }),
          d: parseFloat(el.dataset.depth)
        }));
        $('.hero').addEventListener('pointermove', (e) => {
          const nx = e.clientX / innerWidth - 0.5, ny = e.clientY / innerHeight - 0.5;
          qs.forEach((q) => { q.x(-nx * 46 * q.d); q.y(-ny * 46 * q.d); });
        });
      }
    }

    /* ---------- Marquee réactif au scroll ---------- */
    if (!reduced) {
      $$('[data-marquee]').forEach((sec) => {
        const track = $('.marquee__track', sec);
        const group = $('.marquee__group', track);
        const need = Math.ceil((innerWidth * 2) / Math.max(1, group.offsetWidth)) + 1;
        for (let i = 0; i < need; i++) track.appendChild(group.cloneNode(true));
        let x = 0, dir = -1;
        gsap.ticker.add(() => {
          const v = lenis ? lenis.velocity : 0;
          if (v > 0.2) dir = -1; else if (v < -0.2) dir = 1;
          x += dir * (0.6 + Math.min(Math.abs(v) * 0.12, 16));
          const w = group.offsetWidth;
          if (x <= -w) x += w; else if (x >= 0) x -= w;
          track.style.transform = 'translate3d(' + x.toFixed(2) + 'px,0,0)';
        });
      });
    }

    /* ---------- Sections épinglées / horizontales ---------- */
    if (!reduced) {
      const mm = gsap.matchMedia();

      mm.add('(min-width: 900px)', () => {
        /* Studio : storytelling pinné */
        const frames = $$('.story__frame');
        const steps = $$('.step');
        const dots = $$('.story__dots i');
        const count = $('#storyCount');
        let current = 0;
        const setActive = (i) => {
          if (i === current) return;
          current = i;
          dots.forEach((d, k) => d.classList.toggle('is-on', k === i));
          count.textContent = '0' + (i + 1);
        };
        gsap.set(frames.slice(1), { clipPath: 'inset(100% 0% 0% 0%)' });
        gsap.set(steps.slice(1), { autoAlpha: 0, yPercent: 12 });
        gsap.set($$('img', frames[0]), { scale: 1.05 });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: '.story', start: 'top top', end: '+=330%', pin: '.story__pin', scrub: 0.8, anticipatePin: 1,
            onUpdate: (self) => setActive(Math.min(steps.length - 1, Math.round(self.progress * (steps.length - 1))))
          }
        });
        steps.forEach((s, i) => {
          if (!i) return;
          const t = i - 0.55;
          tl.to(steps[i - 1], { autoAlpha: 0, yPercent: -12, duration: 0.35, ease: 'power2.in' }, t)
            .to(frames[i], { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.85, ease: 'power3.inOut' }, t)
            .fromTo($('img', frames[i]), { scale: 1.35 }, { scale: 1.04, duration: 0.95, ease: 'power2.out' }, t)
            .to(steps[i], { autoAlpha: 1, yPercent: 0, duration: 0.5, ease: 'power3.out' }, t + 0.42);
        });
        tl.to({}, { duration: 0.45 });

        /* Signatures : défilement horizontal piloté par le scroll vertical */
        const track = $('.sig__track');
        const bar = $('.sig__bar i');
        const dist = () => Math.max(0, track.scrollWidth - innerWidth);
        const h = gsap.to(track, {
          x: () => -dist(), ease: 'none',
          scrollTrigger: {
            trigger: '.sig', start: 'top top', end: () => '+=' + dist(), pin: '.sig__pin', scrub: 0.7, anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => { bar.style.transform = 'scaleX(' + self.progress.toFixed(4) + ')'; }
          }
        });
        $$('.card__img img').forEach((img) => {
          gsap.fromTo(img, { xPercent: -8 }, {
            xPercent: 8, ease: 'none',
            scrollTrigger: { trigger: img.closest('.card'), containerAnimation: h, start: 'left right', end: 'right left', scrub: true }
          });
        });
        return () => { /* nettoyage automatique */ };
      });

      mm.add('(max-width: 899px)', () => {
        $$('.step').forEach((s) => {
          gsap.from(s, { opacity: 0, y: 40, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: s, start: 'top 88%', once: true } });
        });
      });

      /* Galerie : colonnes parallax + images qui bougent dans leur cadre */
      mm.add('(min-width: 761px)', () => {
        $$('.gcol').forEach((col) => {
          gsap.to(col, {
            yPercent: parseFloat(col.dataset.speed) || 0, ease: 'none',
            scrollTrigger: { trigger: '.gcols', start: 'top bottom', end: 'bottom top', scrub: true }
          });
        });
      });
      $$('.gitem').forEach((item) => {
        const img = $('img', item);
        gsap.fromTo(img, { yPercent: -7 }, {
          yPercent: 7, ease: 'none',
          scrollTrigger: { trigger: item, start: 'top bottom', end: 'bottom top', scrub: true }
        });
        gsap.fromTo(item, { clipPath: 'circle(0% at 50% 50%)' }, {
          clipPath: 'circle(78% at 50% 50%)', duration: 1.5, ease: 'expo.out',
          scrollTrigger: { trigger: item, start: 'top 92%', once: true },
          onComplete: () => gsap.set(item, { clearProps: 'clipPath' })
        });
      });

      /* Éventail du nuancier */
      const fan = $$('.fan i');
      gsap.to(fan, {
        rotation: (i) => (i - 3) * 17, ease: 'power2.out',
        scrollTrigger: { trigger: '.formes', start: 'top 88%', end: 'top 25%', scrub: 0.7 }
      });
    }

    /* ---------- Compteurs ---------- */
    if (!reduced) {
      $$('[data-count]').forEach((el) => {
        const end = parseFloat(el.dataset.count), dec = parseInt(el.dataset.dec || '0', 10);
        const o = { v: 0 };
        el.textContent = (0).toFixed(dec).replace('.', ',');
        ScrollTrigger.create({
          trigger: el, start: 'top 90%', once: true,
          onEnter: () => gsap.to(o, { v: end, duration: 2.2, ease: 'power3.out', onUpdate: () => { el.textContent = o.v.toFixed(dec).replace('.', ','); } })
        });
      });
    }

    /* ---------- Icônes « dessinées » ---------- */
    if (!reduced) {
      $$('.tile .ico').forEach((svg) => {
        const parts = $$('path,rect,circle', svg);
        parts.forEach((p) => { const L = p.getTotalLength(); p.style.strokeDasharray = L; p.style.strokeDashoffset = L; });
        ScrollTrigger.create({
          trigger: svg, start: 'top 90%', once: true,
          onEnter: () => gsap.to(parts, { strokeDashoffset: 0, duration: 1.7, ease: 'power2.inOut', stagger: 0.12 })
        });
      });
    }

    /* ---------- Inclinaison 3D + reflet / boutons magnétiques / curseur ---------- */
    if (fine && !reduced) {
      $$('[data-tilt]').forEach((el) => {
        gsap.set(el, { transformPerspective: 900 });
        const rx = gsap.quickTo(el, 'rotateX', { duration: 0.6, ease: 'power3.out' });
        const ry = gsap.quickTo(el, 'rotateY', { duration: 0.6, ease: 'power3.out' });
        el.addEventListener('pointermove', (e) => {
          const r = el.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
          ry((px - 0.5) * 13); rx(-(py - 0.5) * 13);
          el.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
          el.style.setProperty('--my', (py * 100).toFixed(1) + '%');
        });
        el.addEventListener('pointerleave', () => { rx(0); ry(0); });
      });

      $$('.magnetic').forEach((el) => {
        const xTo = gsap.quickTo(el, 'x', { duration: 0.7, ease: 'elastic.out(1, 0.55)' });
        const yTo = gsap.quickTo(el, 'y', { duration: 0.7, ease: 'elastic.out(1, 0.55)' });
        el.addEventListener('pointermove', (e) => {
          const r = el.getBoundingClientRect();
          xTo((e.clientX - (r.left + r.width / 2)) * 0.32);
          yTo((e.clientY - (r.top + r.height / 2)) * 0.32);
        });
        el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
      });

      const cur = $('.cursor');
      const cx = gsap.quickTo(cur, 'x', { duration: 0.45, ease: 'power3' });
      const cy = gsap.quickTo(cur, 'y', { duration: 0.45, ease: 'power3' });
      addEventListener('pointermove', (e) => { cur.classList.add('is-on'); cx(e.clientX); cy(e.clientY); }, { passive: true });
      document.addEventListener('pointerover', (e) => { cur.classList.toggle('is-hover', !!e.target.closest('a,button,summary,label,[data-tilt]')); });
      document.addEventListener('mouseleave', () => cur.classList.remove('is-on'));
    }

    /* ---------- Onglets des tarifs ---------- */
    const tabs = $$('.tabs [role=tab]');
    const panels = $$('.panel');
    function selectTab(i, focus) {
      tabs.forEach((t, j) => { t.setAttribute('aria-selected', j === i ? 'true' : 'false'); t.tabIndex = j === i ? 0 : -1; });
      panels.forEach((p, j) => { p.hidden = j !== i; });
      if (focus) tabs[i].focus();
      if (!reduced) {
        gsap.fromTo($$('.row', panels[i]), { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.07, clearProps: 'transform,opacity' });
      }
      ScrollTrigger.refresh();
    }
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => selectTab(i));
      t.addEventListener('keydown', (e) => {
        const k = e.key;
        if (['ArrowRight', 'ArrowDown'].includes(k)) { e.preventDefault(); selectTab((i + 1) % tabs.length, true); }
        else if (['ArrowLeft', 'ArrowUp'].includes(k)) { e.preventDefault(); selectTab((i - 1 + tabs.length) % tabs.length, true); }
        else if (k === 'Home') { e.preventDefault(); selectTab(0, true); }
        else if (k === 'End') { e.preventDefault(); selectTab(tabs.length - 1, true); }
      });
    });

    /* ---------- Formes d'ongles : morphing ---------- */
    const SHAPES = {
      'amande':        { n: 'Amande',        d: 'Douce et allongeante, une valeur sûre.',                               tm: .60, w0: 0,   k: 1.55, k2: 1.4,  be: 2,   sw: 1,    cr: 0 },
      'stiletto':      { n: 'Stiletto',      d: 'Longue et très effilée : pour celles qui assument.',                    tm: .74, w0: 0,   k: 1.25, k2: 1.15, be: 2,   sw: .84,  cr: 0 },
      'rond':          { n: 'Rond',          d: 'Naturel et facile à vivre, au quotidien.',                              tm: .50, w0: 0,   k: 2,    k2: 2,    be: 2,   sw: 1,    cr: 0 },
      'ballerine':     { n: 'Ballerine',     d: 'Fine, tout en légèreté, au bout délicatement tronqué.',                 tm: .62, w0: .30, k: 1,    k2: 1,    be: 2.2, sw: .92,  cr: .03 },
      'coffin':        { n: 'Coffin',        d: 'Bout carré, côtés effilés : l\'allure d\'un ongle de défilé.',          tm: .55, w0: .52, k: 1,    k2: 1,    be: 2.4, sw: 1,    cr: .04 },
      'carre':         { n: 'Carré',         d: 'Franc et graphique : il adore la french.',                              tm: .50, w0: .97, k: 1.2,  k2: 1,    be: 3.2, sw: 1,    cr: .012 },
      'carre-arrondi': { n: 'Carré arrondi', d: 'Le carré en plus doux : moins d\'angles, plus de confort.',             tm: .50, w0: .95, k: 1.2,  k2: 1,    be: 3,   sw: 1,    cr: .1 }
    };
    const N = 36;
    function outline(p) {
      const W = 46 * p.sw, H = 132;
      const right = [];
      for (let k = 0; k <= N; k++) {
        const t = 0.5 - 0.5 * Math.cos(Math.PI * k / N);
        let w;
        if (t <= p.tm) {
          const u = (p.tm - t) / p.tm;
          const core = Math.pow(Math.max(0, 1 - Math.pow(u, p.k)), 1 / p.k2);
          w = W * (p.w0 + (1 - p.w0) * core);
        } else {
          const u = (t - p.tm) / (1 - p.tm);
          w = W * Math.pow(Math.max(0, 1 - Math.pow(u, p.be)), 1 / p.be);
        }
        if (p.cr && t < p.cr) {
          const v = (p.cr - t) / p.cr;
          w -= W * p.w0 * (1 - Math.sqrt(Math.max(0, 1 - v * v))) * 0.9;
        }
        right.push([w, t * H]);
      }
      const pts = [];
      right.forEach(([w, y]) => pts.push(50 + w, y));
      for (let k = right.length - 1; k >= 0; k--) pts.push(50 - right[k][0], right[k][1]);
      return pts;
    }
    const toD = (pts) => {
      let d = 'M' + pts[0].toFixed(2) + ',' + pts[1].toFixed(2);
      for (let i = 2; i < pts.length; i += 2) d += 'L' + pts[i].toFixed(2) + ',' + pts[i + 1].toFixed(2);
      return d + 'Z';
    };
    const nailBody = $('#nailBody'), nailGloss = $('#nailGloss');
    let curPts = outline(SHAPES.amande);
    const draw = () => { const d = toD(curPts); nailBody.setAttribute('d', d); nailGloss.setAttribute('d', d); };
    draw();
    let shapeTween = null;
    function morphTo(key) {
      const target = outline(SHAPES[key]);
      const from = curPts.slice();
      const o = { p: 0 };
      if (shapeTween) shapeTween.kill();
      if (reduced) { curPts = target; draw(); return; }
      shapeTween = gsap.to(o, {
        p: 1, duration: 1.1, ease: 'expo.out',
        onUpdate: () => { curPts = from.map((v, i) => v + (target[i] - v) * o.p); draw(); }
      });
    }

    /* ---------- Sélection : prestations, forme, teinte → SMS ---------- */
    const sel = new Map();
    let chosenShape = null, chosenTint = null;
    const stage = $('.formes__stage');
    const fmtMin = (m) => { const h = Math.floor(m / 60), r = m % 60; return h ? (r ? h + 'h' + String(r).padStart(2, '0') : h + 'h') : r + ' min'; };
    const list = $('#rdvList'), empty = $('#rdvEmpty'), totalBox = $('#rdvTotal');
    const tray = $('#tray'), trayText = $('#trayText');
    const fName = $('#fName'), fWhen = $('#fWhen'), fMsg = $('#fMsg');
    const smsBtn = $('#smsBtn');
    let trayVisible = false;

    function buildSms() {
      const L = [];
      const name = fName.value.trim();
      L.push('Bonjour Emma, ' + (name ? 'c\'est ' + name + '. Je' : 'je') + ' souhaiterais prendre rendez-vous au Studio Nail\'s.');
      if (sel.size) {
        L.push('Prestation(s) :');
        let sum = 0, min = 0;
        sel.forEach((v) => { L.push('- ' + v.name + ' (' + v.price + ' €)'); sum += v.price; min += v.min; });
        L.push('Total estimé : ' + sum + ' € (environ ' + fmtMin(min) + ')');
      } else L.push('Prestation : à définir avec vous.');
      const extra = [];
      if (chosenShape) extra.push('Forme : ' + SHAPES[chosenShape].n.toLowerCase());
      if (chosenTint) extra.push('Teinte : ' + chosenTint.toLowerCase());
      if (extra.length) L.push(extra.join(' · '));
      if (fWhen.value.trim()) L.push('Disponibilités : ' + fWhen.value.trim());
      if (fMsg.value.trim()) L.push(fMsg.value.trim());
      L.push('Merci !');
      return L.join('\n');
    }
    function render() {
      list.textContent = '';
      let sum = 0, min = 0;
      sel.forEach((v, id) => {
        sum += v.price; min += v.min;
        const li = document.createElement('li');
        const a = document.createElement('span'); a.textContent = v.name;
        const b = document.createElement('span'); b.textContent = v.price + ' € ';
        const rm = document.createElement('button');
        rm.type = 'button'; rm.textContent = '×'; rm.setAttribute('aria-label', 'Retirer : ' + v.name);
        rm.addEventListener('click', () => toggle(id));
        b.appendChild(rm); li.append(a, b); list.appendChild(li);
      });
      empty.hidden = sel.size > 0;
      totalBox.hidden = sel.size === 0;
      $('#rdvSum').textContent = sum + ' €';
      $('#rdvTime').textContent = sel.size ? '≈ ' + fmtMin(min) : '';
      const sh = $('#rdvShape');
      const bits = [];
      if (chosenShape) bits.push('Forme : <b>' + SHAPES[chosenShape].n + '</b>');
      if (chosenTint) bits.push('Teinte : <b>' + chosenTint + '</b>');
      sh.hidden = !bits.length; sh.innerHTML = bits.join(' · ');
      $$('.row__add[aria-pressed]').forEach((b) => { b.setAttribute('aria-pressed', sel.has(b.closest('.row').dataset.id) ? 'true' : 'false'); });
      smsBtn.href = 'sms:' + PHONE + '?&body=' + encodeURIComponent(buildSms());

      trayText.textContent = sel.size + ' prestation' + (sel.size > 1 ? 's' : '') + ' · ' + sum + ' € · ' + fmtMin(min);
      updateTray();
    }
    function updateTray() {
      const want = sel.size > 0 && !inReserver;
      if (want === trayVisible) return;
      trayVisible = want;
      if (want) { tray.hidden = false; requestAnimationFrame(() => tray.classList.add('is-on')); }
      else { tray.classList.remove('is-on'); setTimeout(() => { if (!trayVisible) tray.hidden = true; }, 700); }
    }
    function toggle(id) {
      if (sel.has(id)) sel.delete(id);
      else {
        const row = $('.row[data-id="' + id + '"]');
        sel.set(id, { name: row.dataset.name, price: parseFloat(row.dataset.price), min: parseInt(row.dataset.min, 10) });
      }
      render();
    }
    $$('.row__add[aria-pressed]').forEach((b) => b.addEventListener('click', () => toggle(b.closest('.row').dataset.id)));
    [fName, fWhen, fMsg].forEach((i) => i.addEventListener('input', () => { smsBtn.href = 'sms:' + PHONE + '?&body=' + encodeURIComponent(buildSms()); }));

    let inReserver = false;
    ScrollTrigger.create({ trigger: '#reserver', start: 'top 70%', end: 'bottom top', onToggle: (s) => { inReserver = s.isActive; updateTray(); } });

    /* choix forme / teinte */
    const shapeBtns = $$('.shapes [role=radio]');
    shapeBtns.forEach((b) => b.addEventListener('click', () => {
      shapeBtns.forEach((x) => x.setAttribute('aria-checked', x === b ? 'true' : 'false'));
      const key = b.dataset.shape;
      chosenShape = key;
      $('#shapeName').textContent = SHAPES[key].n;
      $('#shapeDesc').textContent = SHAPES[key].d;
      morphTo(key);
      render();
    }));
    const tintBtns = $$('.tints [role=radio]');
    tintBtns.forEach((b) => b.addEventListener('click', () => {
      tintBtns.forEach((x) => x.setAttribute('aria-checked', x === b ? 'true' : 'false'));
      stage.style.setProperty('--nail', b.dataset.tint);
      chosenTint = b.dataset.name;
      render();
    }));
    render();

    /* ---------- Carrousel d'avis ---------- */
    const aTrack = $('#avisTrack');
    const aCards = $$('.quote', aTrack);
    const aBar = $('#avisBar');
    let rafId = 0;
    function aUpdate() {
      rafId = 0;
      const center = aTrack.scrollLeft + aTrack.clientWidth / 2;
      aCards.forEach((c) => {
        const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - center) / (aTrack.clientWidth * 0.6);
        c.style.setProperty('--k', Math.max(0, 1 - Math.min(1, d)).toFixed(3));
      });
      const max = aTrack.scrollWidth - aTrack.clientWidth;
      aBar.style.transform = 'scaleX(' + Math.max(0.12, max > 0 ? aTrack.scrollLeft / max : 1).toFixed(3) + ')';
    }
    aTrack.addEventListener('scroll', () => { if (!rafId) rafId = requestAnimationFrame(aUpdate); }, { passive: true });
    const step = () => (aCards[0].offsetWidth + 24);
    $('#avisPrev').addEventListener('click', () => aTrack.scrollBy({ left: -step(), behavior: 'smooth' }));
    $('#avisNext').addEventListener('click', () => aTrack.scrollBy({ left: step(), behavior: 'smooth' }));
    aUpdate();
    if (!reduced && 'IntersectionObserver' in window) {
      let paused = false, visible = false;
      const tick = () => {
        if (paused || !visible || document.hidden) return;
        const max = aTrack.scrollWidth - aTrack.clientWidth;
        if (aTrack.scrollLeft >= max - 4) aTrack.scrollTo({ left: 0, behavior: 'smooth' });
        else aTrack.scrollBy({ left: step(), behavior: 'smooth' });
      };
      setInterval(tick, 5200);
      ['pointerenter', 'focusin', 'touchstart'].forEach((ev) => aTrack.addEventListener(ev, () => { paused = true; }, { passive: true }));
      ['pointerleave', 'focusout'].forEach((ev) => aTrack.addEventListener(ev, () => { paused = false; }));
      new IntersectionObserver((en) => { visible = en[0].isIntersecting; }, { threshold: 0.4 }).observe(aTrack);
    }

    /* ---------- Galerie : lightbox ---------- */
    const gItems = $$('.gitem');
    const lb = $('#lb'), lbImg = $('#lbImg'), lbCap = $('#lbCap');
    let lbIndex = 0, lastFocus = null;
    function lbShow(i) {
      lbIndex = (i + gItems.length) % gItems.length;
      const it = gItems[lbIndex];
      lbImg.src = it.dataset.lb;
      lbImg.alt = $('img', it).alt;
      lbCap.textContent = it.dataset.cap;
    }
    function lbOpen(i) {
      lastFocus = document.activeElement;
      lbShow(i); lb.hidden = false; stopScroll();
      $('.lb__close', lb).focus();
      if (!reduced) gsap.fromTo(lb, { opacity: 0 }, { opacity: 1, duration: 0.4 });
    }
    function lbClose() { lb.hidden = true; startScroll(); if (lastFocus) lastFocus.focus(); }
    gItems.forEach((it, i) => it.addEventListener('click', () => lbOpen(i)));
    $('.lb__close', lb).addEventListener('click', lbClose);
    $('.lb__prev', lb).addEventListener('click', () => lbShow(lbIndex - 1));
    $('.lb__next', lb).addEventListener('click', () => lbShow(lbIndex + 1));
    lb.addEventListener('click', (e) => { if (e.target === lb) lbClose(); });
    document.addEventListener('keydown', (e) => {
      if (lb.hidden) return;
      if (e.key === 'Escape') lbClose();
      else if (e.key === 'ArrowLeft') lbShow(lbIndex - 1);
      else if (e.key === 'ArrowRight') lbShow(lbIndex + 1);
      else if (e.key === 'Tab') {
        const f = $$('button', lb); const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });

    /* ---------- FAQ : ouverture fluide ---------- */
    if (!reduced) {
      $$('.qa').forEach((d) => {
        const sum = $('summary', d), body = $('.qa__a', d);
        sum.addEventListener('click', (e) => {
          e.preventDefault();
          if (d.open) {
            gsap.to(body, { height: 0, duration: 0.5, ease: 'power3.inOut', onComplete: () => { d.open = false; gsap.set(body, { clearProps: 'height' }); ScrollTrigger.refresh(); } });
          } else {
            $$('.qa[open] summary').forEach((s) => { if (s !== sum) s.click(); });
            d.open = true;
            gsap.fromTo(body, { height: 0 }, { height: 'auto', duration: 0.6, ease: 'power3.out', onComplete: () => ScrollTrigger.refresh() });
          }
        });
      });
    }

    /* ---------- Horaires : jour courant ---------- */
    const today = $('.hours [data-day="' + new Date().getDay() + '"]');
    if (today) today.classList.add('is-today');

    /* ---------- Barre mobile ---------- */
    const mbar = $('#mbar');
    ScrollTrigger.create({
      trigger: '.hero', start: 'bottom 70%', endTrigger: '#reserver', end: 'top 75%',
      onToggle: (s) => mbar.classList.toggle('is-on', s.isActive)
    });

    /* ---------- Démarrage ---------- */
    runLoader();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
    addEventListener('load', () => ScrollTrigger.refresh());
  }
})();
