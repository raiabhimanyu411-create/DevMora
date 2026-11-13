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
  const onScroll = () => {
    // Read first, then write, so the browser never has to re-layout mid-frame
    const y = window.scrollY;
    const max = progress ? document.documentElement.scrollHeight - window.innerHeight : 0;
    if (nav) nav.classList.toggle('is-scrolled', y > 30);
    if (progress) progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
  };

  let navTicking = false;
  window.addEventListener('scroll', () => {
    if (navTicking) return;
    navTicking = true;
    requestAnimationFrame(() => { navTicking = false; onScroll(); });
  }, { passive: true });
  requestAnimationFrame(onScroll);

  // Active link
  const page = document.body.dataset.page;
  document.querySelectorAll(`[data-nav="${page}"]`).forEach(el => el.classList.add('is-active'));
  // Service sub-pages also highlight "Services"
  if (/development|developers/.test(page || '')) {
    document.querySelectorAll('[data-nav="services"]').forEach(el => el.classList.add('is-active'));
  }

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

  /* ── Client-region clocks ── */
  const localClocks = [...document.querySelectorAll('[data-local-time]')];
  if (localClocks.length && window.Intl && Intl.DateTimeFormat) {
    const updateLocalClocks = () => {
      const now = new Date();
      localClocks.forEach(clock => {
        const zone = clock.dataset.timeZone;
        try {
          const time = new Intl.DateTimeFormat('en-GB', {
            timeZone: zone,
            hour: '2-digit',
            minute: '2-digit',
            hourCycle: 'h23'
          }).format(now);
          const zoneName = new Intl.DateTimeFormat('en-GB', {
            timeZone: zone,
            timeZoneName: 'short'
          }).formatToParts(now).find(part => part.type === 'timeZoneName')?.value || '';
          clock.querySelector('.world-clock__time').textContent = time;
          clock.querySelector('.world-clock__zone').textContent = zoneName;
          clock.dateTime = now.toISOString();
          clock.setAttribute('aria-label', `${clock.dataset.city}: ${time} ${zoneName}`);
        } catch (_) {
          clock.querySelector('.world-clock__time').textContent = '--:--';
          clock.querySelector('.world-clock__zone').textContent = '';
        }
      });
    };
    updateLocalClocks();
    window.setTimeout(() => window.setInterval(updateLocalClocks, 60_000), 60_000 - (Date.now() % 60_000));
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) updateLocalClocks();
    });
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
    const trackParts = tracks.map(track => ({
      track,
      line: track.querySelector('.process__line, .timeline__line'),
      steps: [...track.querySelectorAll('.step, .t-item')]
        .map(step => ({ step, dot: step.querySelector('.step__dot') }))
        .filter(x => x.dot)
    }));
    const update = () => {
      const vh = window.innerHeight;
      // Read phase
      const reads = trackParts.map(({ track, steps }) => ({
        r: track.getBoundingClientRect(),
        on: steps.map(({ dot }) => dot.getBoundingClientRect().top < vh * 0.75)
      }));
      // Write phase
      trackParts.forEach(({ line, steps }, i) => {
        const { r, on } = reads[i];
        const p = Math.min(Math.max((vh * 0.75 - r.top) / (r.height * 0.9), 0), 1);
        line?.style.setProperty('--p', reduceMotion ? 1 : p.toFixed(3));
        steps.forEach(({ step }, j) => step.classList.toggle('is-on', on[j]));
      });
    };
    let trackTicking = false;
    const schedule = () => {
      if (trackTicking) return;
      trackTicking = true;
      requestAnimationFrame(() => { trackTicking = false; update(); });
    };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    schedule();
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

  /* ── GA4 conversion events (no-op if gtag is blocked or missing) ── */
  const track = (name, params) => { try { if (typeof window.gtag === 'function') window.gtag('event', name, params || {}); } catch (_) {} };
  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href') || '';
    const label = (a.textContent || '').trim().slice(0, 80);
    if (/^https:\/\/(wa\.me|api\.whatsapp\.com)\//.test(href)) track('whatsapp_click', { link_url: href, link_text: label, page_path: location.pathname });
    else if (href.startsWith('tel:')) track('phone_click', { link_url: href, link_text: label, page_path: location.pathname });
    else if (href.startsWith('mailto:')) track('email_click', { link_url: href, link_text: label, page_path: location.pathname });
  });

  /* ── Work page: category filter ── */
  const filters = document.querySelector('.filters');
  if (filters) {
    const cards = document.querySelectorAll('.work-grid > [data-cat]');
    filters.addEventListener('click', e => {
      const btn = e.target.closest('button[data-filter]');
      if (!btn) return;
      const cat = btn.dataset.filter;
      filters.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
      cards.forEach(card => {
        card.hidden = cat !== 'all' && !card.dataset.cat.split(' ').includes(cat);
        card.classList.add('is-visible');
      });
    });
  }

  /* ── Contact form → sends enquiry by email (FormSubmit), WhatsApp fallback ── */
  const form = document.getElementById('contactForm');
  if (form) {
    // FormSubmit alias: enquiries reach the Devmora inbox without exposing any email address.
    const LEAD_EMAIL = '7fca19c4e0bc3ccdbeb47fc3354a4475';
    // Web3Forms access key (free, from web3forms.com). Public by design: it only allows sending to your inbox.
    const WEB3FORMS_KEY = '26a67c12-321a-446c-963d-cdd090d1a196';
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
      const name = (data.get('name') || `${data.get('firstName') || ''} ${data.get('lastName') || ''}`).trim();
      const firstName = name.split(/\s+/)[0] || '';
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

      // Try Web3Forms first, then FormSubmit. If one service is down the other still delivers the enquiry.
      const post = (url, body) =>
        fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(body)
        }).then(r => r.json().catch(() => ({})).then(j => {
          if (!r.ok || j.success === false || j.success === 'false') throw new Error('send failed');
          return j;
        }));

      const senders = [];
      if (WEB3FORMS_KEY) {
        senders.push(() => post('https://api.web3forms.com/submit', {
          access_key: WEB3FORMS_KEY,
          subject: payload._subject,
          from_name: 'Devmora Website',
          replyto: payload.Email,
          botcheck: '',
          ...Object.fromEntries(Object.entries(payload).filter(([k]) => !k.startsWith('_')))
        }));
      }
      senders.push(() => post(`https://formsubmit.co/ajax/${LEAD_EMAIL}`, payload));

      try {
        let sent = false;
        for (const send of senders) {
          try { await send(); sent = true; break; } catch (_) { /* try next service */ }
        }
        if (!sent) throw new Error('all senders failed');
        track('generate_lead', { form_id: 'contactForm', service: payload.Service, timeline: payload.Timeline });
        showSuccess(firstName, payload.Email);
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

    // Swap form → thank-you card without the page jumping: keep the card height,
    // then bring the card (not the section below it) into view.
    const success = document.getElementById('formSuccess');
    const card = form.closest('.form-card') || form.parentElement;
    const submitHtml = form.querySelector('[type="submit"]')?.innerHTML || '';
    function showSuccess(firstName, email) {
      if (!success) { form.style.display = 'none'; return; }
      const nameEl = document.getElementById('fsName');
      const emailEl = document.getElementById('fsEmail');
      const emailWrap = document.getElementById('fsEmailWrap');
      if (nameEl) nameEl.textContent = firstName ? `, ${String(firstName).trim()}` : '';
      if (emailEl) emailEl.textContent = email || '';
      if (emailWrap) emailWrap.hidden = !email;
      const keepY = window.scrollY;
      form.style.display = 'none';
      success.classList.add('is-shown');
      window.scrollTo({ top: keepY, behavior: 'instant' });
      const rect = card.getBoundingClientRect();
      const offset = 96; // sticky nav
      if (rect.top < offset || rect.top > window.innerHeight * 0.6) {
        window.scrollTo({ top: window.scrollY + rect.top - offset, behavior: reduceMotion ? 'auto' : 'smooth' });
      }
      success.focus({ preventScroll: true });
    }
    document.getElementById('fsAgain')?.addEventListener('click', () => {
      form.reset();
      success.classList.remove('is-shown');
      form.style.display = '';
      const btn = form.querySelector('[type="submit"]');
      if (btn) { btn.disabled = false; btn.innerHTML = submitHtml; }
      form.querySelectorAll('.is-error').forEach(f => f.classList.remove('is-error'));
      form.querySelector('input:not([type="hidden"])')?.focus({ preventScroll: true });
    });

    form.querySelectorAll('.input').forEach(f =>
      f.addEventListener('input', () => f.classList.remove('is-error'))
    );
  }

  /* ==========================================================================
     Liquid glass
     ========================================================================== */

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
