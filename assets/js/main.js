/* ==========================================================================
   DEVMORA TECHNOLOGY — Interactions & Animations
   ========================================================================== */
(() => {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  const store = {
    get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* ignore */ } }
  };

  /* ── Loader / page transition ── */
  const firstVisit = !store.get('dm-visited');
  store.set('dm-visited', '1');

  const curtain = document.querySelector('.curtain');
  if (!firstVisit && curtain) curtain.querySelector('.curtain__word')?.remove();

  const revealDelay = reduceMotion ? 0 : (firstVisit ? 1100 : 150);

  const start = () => {
    setTimeout(() => {
      root.classList.add('is-loaded');
      setTimeout(() => root.classList.add('is-ready'), reduceMotion ? 0 : 450);
    }, revealDelay);
  };

  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start, { once: true });

  // Safety net in case load is slow (fonts, etc.)
  setTimeout(() => { root.classList.add('is-loaded', 'is-ready'); }, 3500);

  window.addEventListener('pageshow', e => {
    if (e.persisted) {
      root.classList.remove('is-leaving');
      root.classList.add('is-loaded', 'is-ready');
    }
  });

  document.addEventListener('click', e => {
    const a = e.target.closest('a[href]');
    if (!a || reduceMotion) return;
    if (a.target === '_blank' || a.hasAttribute('download')) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;

    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;
    if (!/^https?:$/.test(url.protocol)) return;

    const norm = p => p.replace(/\.html$/, '').replace(/\/index$/, '/').replace(/\/$/, '');
    const samePage = norm(url.pathname) === norm(location.pathname);
    if (samePage && url.hash) return; // in-page anchor
    if (samePage && !url.hash) { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }

    e.preventDefault();
    document.body.classList.remove('menu-open');
    root.classList.remove('is-loaded');
    root.classList.add('is-leaving');
    setTimeout(() => { location.href = url.href; }, 650);
  });

  /* ── Navigation ── */
  const nav = document.querySelector('.nav');
  const progress = document.querySelector('.progress');
  let lastY = window.scrollY;

  const onScroll = () => {
    const y = window.scrollY;
    if (nav) {
      nav.classList.toggle('is-scrolled', y > 30);
      if (!document.body.classList.contains('menu-open')) {
        if (y > lastY + 6 && y > 200) nav.classList.add('is-hidden');
        else if (y < lastY - 6) nav.classList.remove('is-hidden');
      }
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
          root.classList.contains('is-ready') ? go() : setTimeout(go, 1200);
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

  /* ── Footer year ── */
  document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
})();
