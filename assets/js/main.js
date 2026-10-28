/* ==========================================================================
   DEVMORA TECHNOLOGY — Interactions & Animations
   ========================================================================== */
(() => {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ── Ready state ──
     No intro loader or exit curtain: content paints immediately, which keeps
     LCP fast for visitors and for Google's renderer. Hero entrance animations
     are pure CSS and start on first paint. */
  root.classList.add('is-loaded', 'is-ready');

  /* ── Navigation ── */
  const nav = document.querySelector('.nav');
  const progress = document.querySelector('.progress');
  let lastY = window.scrollY;

  const onScroll = () => {
    const y = window.scrollY;
    if (nav) {
      nav.classList.toggle('is-scrolled', y > 30);
    }
    if (progress) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    }
    lastY = y;
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Active link
  const page = document.body.dataset.page;
  document.querySelectorAll(`[data-nav="${page}"]`).forEach(el => el.classList.add('is-active'));

  // Mobile menu
  const burger = document.querySelector('.burger');
  burger?.addEventListener('click', () => {
    const open = document.body.classList.toggle('menu-open');
    burger.setAttribute('aria-expanded', open);
    nav?.classList.remove('is-hidden');
  });

  document.querySelectorAll('.mobile-menu a').forEach(a =>
    a.addEventListener('click', () => {
      document.body.classList.remove('menu-open');
      burger?.setAttribute('aria-expanded', 'false');
    })
  );

  /* ── Scroll reveal ── */
  document.querySelectorAll('[data-stagger]').forEach(group => {
    const step = parseFloat(group.dataset.stagger) || 0.08;
    group.querySelectorAll(':scope > [data-reveal]').forEach((el, i) => {
      el.style.setProperty('--d', `${(i * step).toFixed(2)}s`);
    });
  });

  const revealEls = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('is-visible'));
  }

  /* ── Counters ── */
  const counters = document.querySelectorAll('[data-count]');
  const runCount = el => {
    const target = parseFloat(el.dataset.count);
    if (reduceMotion) { el.textContent = target; return; }
    const dur = 1800;
    let t0;
    const tick = ts => {
      if (!t0) t0 = ts;
      const p = Math.min((ts - t0) / dur, 1);
      el.textContent = Math.round((1 - Math.pow(1 - p, 4)) * target);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  if (counters.length) {
    const cio = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // wait for the hero to be revealed before counting
          const go = () => runCount(entry.target);
          go();
          cio.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(el => cio.observe(el));
  }

  /* ── Rotating words ── */
  document.querySelectorAll('.rotator').forEach(rot => {
    const words = [...rot.children];
    if (words.length < 2) return;
    let i = 0;
    words[0].classList.add('is-active');
    if (reduceMotion) return;
    setInterval(() => {
      const cur = words[i];
      i = (i + 1) % words.length;
      const next = words[i];
      cur.classList.remove('is-active');
      cur.classList.add('is-out');
      next.classList.remove('is-out');
      next.classList.add('is-active');
      setTimeout(() => cur.classList.remove('is-out'), 800);
    }, 2600);
  });

  /* ── Card spotlight ── */
  if (finePointer) {
    document.querySelectorAll('.card').forEach(card => {
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${e.clientX - r.left}px`);
        card.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    });
  }

  /* ── Magnetic buttons ── */
  if (finePointer && !reduceMotion) {
    document.querySelectorAll('[data-magnetic]').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.25;
        const y = (e.clientY - r.top - r.height / 2) * 0.35;
        el.style.transform = `translate(${x}px, ${y}px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }

  /* ── Hero parallax orbs ── */
  const orbs = document.querySelectorAll('.hero .orb, .page-hero .orb');
  if (finePointer && !reduceMotion && orbs.length) {
    window.addEventListener('pointermove', e => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      orbs.forEach((orb, i) => {
        const f = (i + 1) * 14;
        orb.style.translate = `${x * f}px ${y * f}px`;
      });
    }, { passive: true });
  }

  /* ── Scroll-driven progress lines (process + timeline) ── */
  const tracks = [...document.querySelectorAll('[data-track]')];
  if (tracks.length) {
    const update = () => {
      const vh = window.innerHeight;
      tracks.forEach(track => {
        const line = track.querySelector('.process__line, .timeline__line');
        const r = track.getBoundingClientRect();
        const p = Math.min(Math.max((vh * 0.75 - r.top) / (r.height * 0.9), 0), 1);
        line?.style.setProperty('--p', reduceMotion ? 1 : p.toFixed(3));
        track.querySelectorAll('.step, .t-item').forEach(step => {
          const dot = step.querySelector('.step__dot');
          if (!dot) return;
          step.classList.toggle('is-on', dot.getBoundingClientRect().top < vh * 0.75);
        });
      });
    };
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* ── FAQ ── */
  document.querySelectorAll('.faq__q').forEach(q => {
    q.addEventListener('click', () => {
      const item = q.closest('.faq__item');
      const open = item.classList.contains('is-open');
      document.querySelectorAll('.faq__item.is-open').forEach(el => {
        el.classList.remove('is-open');
        el.querySelector('.faq__q').setAttribute('aria-expanded', 'false');
      });
      if (!open) {
        item.classList.add('is-open');
        q.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* ── Contact form → sends enquiry by email (FormSubmit), WhatsApp fallback ── */
  const form = document.getElementById('contactForm');
  if (form) {
    // FormSubmit alias: enquiries reach the Devmora inbox without exposing any email address.
    const LEAD_EMAIL = '7fca19c4e0bc3ccdbeb47fc3354a4475';
    const WA_NUMBER = '918092952307';
    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (form.querySelector('[name="_honey"]')?.value) return; // bot trap
      const required = [...form.querySelectorAll('[required]')];
      let firstBad = null;
      required.forEach(f => {
        const bad = !f.value.trim() || (f.type === 'email' && !/^\S+@\S+\.\S+$/.test(f.value));
        f.classList.toggle('is-error', bad);
        if (bad && !firstBad) firstBad = f;
      });
      if (firstBad) { firstBad.focus(); return; }

      const data = new FormData(form);
      const name = `${data.get('firstName') || ''} ${data.get('lastName') || ''}`.trim();
      const payload = {
        _subject: `New project enquiry: ${name}`,
        _template: 'table',
        _captcha: 'false',
        Name: name,
        Email: data.get('email') || '',
        'Company / Website': data.get('company') || '-',
        Service: data.get('service') || '-',
        Timeline: data.get('timeline') || '-',
        Message: data.get('message') || '',
        Page: location.href
      };

      const btn = form.querySelector('[type="submit"]');
      const btnHtml = btn ? btn.innerHTML : '';
      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }

      try {
        const res = await fetch(`https://formsubmit.co/ajax/${LEAD_EMAIL}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('send failed');
        form.style.display = 'none';
        document.getElementById('formSuccess')?.classList.add('is-shown');
      } catch (err) {
        const text = [
          `Hi Devmora, I'm ${name}.`,
          `Email: ${payload.Email}`,
          `Service: ${payload.Service} | Start: ${payload.Timeline}`,
          '',
          payload.Message
        ].join('\n');
        if (btn) { btn.disabled = false; btn.innerHTML = btnHtml; }
        alert('Could not send the form right now. We will open WhatsApp so you can send your enquiry directly.');
        window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
      }
    });

    form.querySelectorAll('.input').forEach(f =>
      f.addEventListener('input', () => f.classList.remove('is-error'))
    );
  }

  /* ==========================================================================
     Liquid glass
     ========================================================================== */

  /* ── Living colour field behind every page ── */
  if (!document.querySelector('.lg-backdrop')) {
    const bd = document.createElement('div');
    bd.className = 'lg-backdrop';
    bd.setAttribute('aria-hidden', 'true');
    bd.innerHTML = '<i></i><i></i><i></i><i></i><i></i>';
    document.body.prepend(bd);
  }

  /* ── Lens refraction on the header bar (Chromium only) ──
     Builds a displacement map for the bar's rounded shape: pixels near the
     edge are pulled inward, like light bending through the rim of a lens. */
  const isChromium = !!(navigator.userAgentData && navigator.userAgentData.brands.some(b => /Chromium/.test(b.brand)));
  const bar = document.querySelector('.nav__bar');
  if (bar && isChromium && !reduceMotion && CSS.supports('backdrop-filter', 'url(#a)')) {
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('width', '0'); svg.setAttribute('height', '0');
    svg.setAttribute('aria-hidden', 'true');
    svg.style.position = 'absolute';
    svg.innerHTML = '<filter id="lg-refract" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">' +
      '<feImage id="lg-map" x="0" y="0" preserveAspectRatio="none" result="map"/>' +
      '<feDisplacementMap in="SourceGraphic" in2="map" scale="38" xChannelSelector="R" yChannelSelector="G"/></filter>';
    document.body.appendChild(svg);
    const feImage = svg.querySelector('#lg-map');

    const buildMap = () => {
      const w = Math.round(bar.offsetWidth), h = Math.round(bar.offsetHeight);
      if (!w || !h) return;
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const ctx = c.getContext('2d');
      const img = ctx.createImageData(w, h);
      const r = Math.min(h / 2, parseFloat(getComputedStyle(bar).borderTopLeftRadius) || h / 2);
      const bezel = Math.min(22, h * 0.42);
      const cx = w / 2, cy = h / 2, hx = w / 2 - r, hy = h / 2 - r;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const px = x + 0.5 - cx, py = y + 0.5 - cy;
          const qx = Math.abs(px) - hx, qy = Math.abs(py) - hy;
          let nx = 0, ny = 0, dist;
          if (qx > 0 && qy > 0) {
            const l = Math.hypot(qx, qy) || 1;
            dist = r - l; nx = Math.sign(px) * qx / l; ny = Math.sign(py) * qy / l;
          } else if (qx > qy) { dist = r - qx; nx = Math.sign(px); }
          else { dist = r - qy; ny = Math.sign(py); }
          let m = 0;
          if (dist < bezel) { const t = 1 - Math.max(dist, 0) / bezel; m = t * t; }
          const i = (y * w + x) * 4;
          img.data[i] = 128 - nx * m * 127;
          img.data[i + 1] = 128 - ny * m * 127;
          img.data[i + 2] = 128;
          img.data[i + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
      feImage.setAttribute('width', w);
      feImage.setAttribute('height', h);
      feImage.setAttribute('href', c.toDataURL());
    };
    buildMap();
    root.classList.add('lg-refract');
    let rt;
    window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(buildMap, 150); });
  }

  /* ── Smooth inertia scrolling (mouse wheel / trackpad, desktop only) ──
     The page glides to its target with a soft, eased delay. Keyboard,
     scrollbar dragging and touch keep their native behaviour. */
  if (finePointer && !reduceMotion) {
    root.classList.add('has-smooth');
    const EASE = 0.09;
    let target = window.scrollY, current = target, raf = 0;
    const maxScroll = () => document.documentElement.scrollHeight - window.innerHeight;
    const clamp = v => Math.max(0, Math.min(maxScroll(), v));

    const tick = () => {
      current += (target - current) * EASE;
      if (Math.abs(target - current) < 0.4) {
        current = target;
        window.scrollTo(0, current);
        raf = 0;
        return;
      }
      window.scrollTo(0, current);
      raf = requestAnimationFrame(tick);
    };
    const glideTo = y => {
      if (!raf) current = window.scrollY;
      target = clamp(y);
      if (!raf) raf = requestAnimationFrame(tick);
    };
    window.devmoraScrollTo = glideTo;

    const canScrollInside = (el, dy) => {
      for (; el && el !== document.body && el !== document.documentElement; el = el.parentElement) {
        const oy = getComputedStyle(el).overflowY;
        if ((oy === 'auto' || oy === 'scroll') && el.scrollHeight > el.clientHeight) {
          if ((dy < 0 && el.scrollTop > 0) || (dy > 0 && el.scrollTop + el.clientHeight < el.scrollHeight)) return true;
        }
      }
      return false;
    };

    window.addEventListener('wheel', e => {
      if (e.ctrlKey || e.defaultPrevented || document.body.classList.contains('menu-open')) return;
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return; // horizontal gestures stay native
      let dy = e.deltaY;
      if (e.deltaMode === 1) dy *= 16;
      else if (e.deltaMode === 2) dy *= window.innerHeight;
      if (canScrollInside(e.target, dy)) return;
      e.preventDefault();
      if (!raf) { current = window.scrollY; target = current; }
      glideTo(target + dy);
    }, { passive: false });

    // Stay in sync when something else scrolls the page (keys, scrollbar, find-in-page)
    window.addEventListener('scroll', () => { if (!raf) { target = current = window.scrollY; } }, { passive: true });

    // In-page anchor links glide too
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href*="#"]');
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey) return;
      const url = new URL(a.href, location.href);
      if (url.pathname !== location.pathname || !url.hash) return;
      const el = url.hash === '#top' ? document.body : document.getElementById(decodeURIComponent(url.hash.slice(1)));
      if (!el) return;
      e.preventDefault();
      const offset = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
      glideTo(url.hash === '#top' ? 0 : el.getBoundingClientRect().top + window.scrollY - offset);
      history.pushState(null, '', url.hash);
    });
  }

  /* ── Gentle parallax on hero visuals ── */
  const parallax = [...document.querySelectorAll('.hero-visual')];
  if (parallax.length && !reduceMotion) {
    let pending = false;
    const move = () => {
      pending = false;
      const y = window.scrollY;
      if (y > window.innerHeight * 1.5) return;
      parallax.forEach(el => { el.style.translate = `0 ${(y * -0.08).toFixed(1)}px`; });
    };
    window.addEventListener('scroll', () => { if (!pending) { pending = true; requestAnimationFrame(move); } }, { passive: true });
  }

  /* ── Footer year ── */
  document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
})();
