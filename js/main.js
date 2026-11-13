/* =========================================================
   PORTAFOLIO — Interacciones y animaciones
   GSAP + ScrollTrigger (animaciones) y Lenis (scroll suave)
   ========================================================= */

(function () {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canAnimate = !reduceMotion && window.gsap && window.ScrollTrigger;

  document.getElementById('year').textContent = new Date().getFullYear();

  setupMenu();
  setupServices();

  if (!canAnimate) {
    root.classList.remove('js-anim');
    setupNav(null);
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  // En iOS la barra de direcciones cambia la altura al hacer scroll; sin esto las animaciones "saltan"
  ScrollTrigger.config({ ignoreMobileResize: true });

  const lenis = setupSmoothScroll();
  setupNav(lenis);
  hideInitialStates();
  runLoader().then(animateHero);
  // Se crea antes que el resto: al fijar la sección cambia la altura de la página
  setupProjects();
  animateReveals();
  animateTitles();
  animateStatement();
  animateCounters();
  animateParallax();
  animateProgress();

  /* ---------- Scroll suave ---------- */
  function setupSmoothScroll() {
    if (!window.Lenis) return null;

    const lenis = new Lenis({ duration: 1.1, anchors: { offset: -70 } });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    return lenis;
  }

  /* ---------- Estados iniciales ----------
     Se pasan a estilos en línea para que el respaldo de 3 s del <head>
     no muestre de golpe los elementos que aún no se animan. */
  function hideInitialStates() {
    gsap.set('[data-hero], [data-hero-photo], [data-reveal]', { autoAlpha: 0 });
    // y: 0 anula el translateY del CSS para que no se sume al yPercent
    gsap.set('[data-hero-line]', { y: 0, yPercent: 110 });
    if (!root.classList.contains('no-loader')) {
      document.querySelector('.loader').classList.add('is-active');
    }
    root.classList.remove('js-anim');
  }

  /* ---------- Pantalla de carga: contador 0 → 100 (solo primera visita) ---------- */
  function runLoader() {
    const loader = document.querySelector('.loader');

    if (root.classList.contains('no-loader')) {
      loader.style.display = 'none';
      return Promise.resolve();
    }
    try { sessionStorage.setItem('nt-visited', '1'); } catch (e) { /* almacenamiento no disponible */ }

    const count = loader.querySelector('.loader__count');
    const counter = { value: 0 };
    if (lenis) lenis.stop();

    return new Promise((resolve) => {
      gsap.timeline({
        onComplete: () => {
          loader.classList.remove('is-active');
          loader.style.display = 'none';
          if (lenis) lenis.start();
        }
      })
        .to(counter, {
          value: 100, duration: 0.5, ease: 'power2.inOut',
          onUpdate: () => { count.textContent = Math.round(counter.value); }
        })
        .to('.loader__bar', { scaleX: 1, duration: 0.5, ease: 'power2.inOut' }, 0)
        .add(resolve)
        .to(loader, { yPercent: -100, duration: 0.45, ease: 'power4.inOut' }, '<');
    });
  }

  /* ---------- Portada ---------- */
  function animateHero() {
    gsap.timeline({ defaults: { ease: 'power4.out' }, delay: 0.1 })
      .to('[data-hero-line]', { yPercent: 0, duration: 1.1, stagger: 0.12 })
      .fromTo('[data-hero-photo]',
        { autoAlpha: 0, y: 40, scale: 0.96 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 1.2 }, '-=0.9')
      .fromTo('[data-hero]',
        { autoAlpha: 0, y: 24 },
        { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.1 }, '-=1');
  }

  /* ---------- Aparición de bloques al hacer scroll ---------- */
  function animateReveals() {
    gsap.utils.toArray('[data-reveal]').forEach((el) => {
      gsap.fromTo(el,
        { autoAlpha: 0, y: 40 },
        {
          autoAlpha: 1, y: 0, duration: 1.1, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true }
        });
    });
  }

  /* ---------- Títulos: cada línea sube desde una máscara ----------
     Se separa por <br>; el marcado es el propio del HTML. */
  function animateTitles() {
    document.querySelectorAll('[data-split]').forEach((title) => {
      title.innerHTML = title.innerHTML
        .split(/<br\s*\/?>/i)
        .map((part) => `<span class="line"><span class="line__inner">${part.trim()}</span></span>`)
        .join('');

      gsap.fromTo(title.querySelectorAll('.line__inner'),
        { yPercent: 105 },
        {
          yPercent: 0, duration: 1.1, ease: 'power4.out', stagger: 0.1,
          scrollTrigger: { trigger: title, start: 'top 85%', once: true }
        });
    });
  }

  /* ---------- Texto "Sobre mí": se ilumina palabra por palabra ---------- */
  function animateStatement() {
    document.querySelectorAll('[data-words]').forEach((el) => {
      const words = el.textContent.trim().split(/\s+/);
      el.textContent = '';
      words.forEach((word, i) => {
        const span = document.createElement('span');
        span.className = 'word';
        span.textContent = word;
        el.append(span);
        if (i < words.length - 1) el.append(' ');
      });

      gsap.fromTo(el.querySelectorAll('.word'),
        { opacity: 0.15, y: 6 },
        {
          opacity: 1, y: 0, stagger: 0.1, ease: 'none',
          scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: true }
        });
    });
  }

  /* ---------- Contadores de resultados ---------- */
  function animateCounters() {
    document.querySelectorAll('[data-count]').forEach((el) => {
      const end = Number(el.dataset.count);
      const prefix = el.textContent.trim().startsWith('+') ? '+' : '';
      const counter = { value: 0 };

      gsap.to(counter, {
        value: end, duration: 1.6, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
        onUpdate: () => { el.textContent = prefix + Math.round(counter.value); }
      });
    });
  }

  /* ---------- Proyectos ----------
     Pantallas grandes (≥ 1000 × 700 px): la sección se fija y los proyectos pasan de lado.
     Resto: lista vertical con las imágenes descubriéndose como cortina. */
  function setupProjects() {
    const mm = gsap.matchMedia();

    mm.add('(min-width: 1000px) and (min-height: 700px)', () => {
      root.classList.add('is-h');

      const pin = document.querySelector('.projects-pin');
      const track = document.querySelector('.projects');
      const cards = gsap.utils.toArray('.project');
      const count = document.querySelector('.projects-status__count b');
      const bar = document.querySelector('.projects-status__bar i');
      const distance = () => track.scrollWidth - window.innerWidth;

      const scroll = gsap.to(track, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: pin,
          start: 'top top',
          end: () => '+=' + distance(),
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            bar.style.transform = `scaleX(${self.progress})`;
            const index = Math.min(cards.length, Math.floor(self.progress * cards.length) + 1);
            count.textContent = String(index).padStart(2, '0');
          }
        }
      });

      // Palabra de fondo que avanza más lento que las tarjetas
      gsap.to('.projects-bgword', {
        xPercent: -30, ease: 'none',
        scrollTrigger: { trigger: pin, start: 'top top', end: () => '+=' + distance(), scrub: 1, invalidateOnRefresh: true }
      });

      // Cada imagen se descubre cuando entra en pantalla por la derecha
      gsap.utils.toArray('.project__media').forEach((media, i) => {
        const trigger = i === 0
          ? { trigger: media, start: 'top 85%', once: true }
          : { trigger: media, containerAnimation: scroll, start: 'left 90%', once: true };
        revealMedia(media, trigger, 'inset(0% 0% 0% 100% round 24px)');
      });

      return () => root.classList.remove('is-h');
    });

    mm.add('(max-width: 999px), (max-height: 699px)', () => {
      gsap.utils.toArray('.project__media').forEach((media) => {
        revealMedia(media, { trigger: media, start: 'top 85%', once: true }, 'inset(100% 0% 0% 0% round 24px)');
        gsap.fromTo(media, { y: 40 }, {
          y: -40, ease: 'none',
          scrollTrigger: { trigger: media, start: 'top bottom', end: 'bottom top', scrub: true }
        });
      });
    });
  }

  /* Imagen que se descubre como una cortina */
  function revealMedia(media, scrollTrigger, from) {
    gsap.timeline({ scrollTrigger })
      .fromTo(media,
        { clipPath: from },
        { clipPath: 'inset(0% 0% 0% 0% round 24px)', duration: 1.3, ease: 'power4.inOut' })
      // clearProps devuelve el control al zoom del :hover definido en CSS
      .fromTo(media.children, { scale: 1.2 }, { scale: 1, duration: 1.6, ease: 'power3.out', clearProps: 'transform' }, 0);
  }

  /* ---------- Parallax sutil de la portada ---------- */
  function animateParallax() {
    gsap.to('.hero__inner', {
      yPercent: -10, autoAlpha: 0.2, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });
  }

  /* ---------- Barra de progreso de lectura ---------- */
  function animateProgress() {
    gsap.to('.progress', {
      scaleX: 1, ease: 'none',
      scrollTrigger: { start: 0, end: 'max', scrub: 0.3 }
    });
  }

  /* ---------- Barra de navegación: se oculta al bajar y aparece al subir ---------- */
  function setupNav(lenis) {
    const nav = document.getElementById('nav');
    let lastY = 0;

    const onScroll = (y) => {
      nav.classList.toggle('is-scrolled', y > 40);
      nav.classList.toggle('is-hidden', y > lastY && y > 300);
      lastY = y;
    };

    if (lenis) lenis.on('scroll', ({ scroll }) => onScroll(scroll));
    else window.addEventListener('scroll', () => onScroll(window.scrollY), { passive: true });
  }

  /* ---------- Menú móvil ---------- */
  function setupMenu() {
    const toggle = document.getElementById('nav-toggle');
    const links = document.getElementById('nav-links');

    const setOpen = (open) => {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      links.classList.toggle('is-open', open);
      // menu-open evita que la barra se oculte mientras el menú está abierto
      root.classList.toggle('menu-open', open);
      // iOS Safari solo bloquea el scroll de fondo si se bloquea también <html>
      root.style.overflow = open ? 'hidden' : '';
      document.body.style.overflow = open ? 'hidden' : '';
    };

    toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
    links.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
  }

  /* ---------- Servicios: acordeón ----------
     inert saca el detalle cerrado del orden de tabulación y de los lectores de pantalla. */
  function setupServices() {
    const items = [...document.querySelectorAll('.service')].map((service) => {
      const row = service.querySelector('.service__row');
      const detail = service.querySelector('.service__detail');
      const setOpen = (open) => {
        service.classList.toggle('is-open', open);
        row.setAttribute('aria-expanded', String(open));
        detail.inert = !open;
      };
      return { service, row, setOpen };
    });

    items.forEach((item, i) => {
      item.row.addEventListener('click', () => {
        const willOpen = !item.service.classList.contains('is-open');
        items.forEach((other) => other.setOpen(false));
        item.setOpen(willOpen);
        if (window.ScrollTrigger) setTimeout(() => ScrollTrigger.refresh(), 650);
      });
      item.setOpen(i === 0);
    });
  }
})();
