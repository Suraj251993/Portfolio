/* Suraj Prakash — site behaviour. Progressive enhancement only: every page is
   complete and usable without this file. */
(() => {
  'use strict';
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Mobile navigation ---------- */
  const toggle = $('.menu-toggle');
  const nav = $('#site-nav');
  if (toggle && nav) {
    const label = $('.menu-toggle__label', toggle);
    const setOpen = (open) => {
      toggle.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
      document.body.classList.toggle('nav-open', open);
      const hd = document.querySelector('[data-header]');
      if (hd) hd.classList.toggle('nav-forced', open);
      if (label) label.textContent = open ? 'Close' : 'Menu';
    };
    toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
    nav.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { setOpen(false); toggle.focus(); }
    });
    window.matchMedia('(min-width: 52.01rem)').addEventListener('change', (m) => { if (m.matches) setOpen(false); });
  }


  /* ---------- Header: clear over the opening clay band, solid after ---------- */
  const header = $('[data-header]');
  const firstBand = $('main > .band--clay:first-child, main > article:first-child > .band--clay:first-child');
  if (header && firstBand) {
    let ticking = false;
    const update = () => {
      ticking = false;
      const h = header.offsetHeight;
      header.classList.toggle('is-solid', firstBand.getBoundingClientRect().bottom <= h + 1);
    };
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener('resize', update);
    update();
  } else if (header) header.classList.add('is-solid');

  /* ---------- Hero screen: silent loop plays while visible ---------- */
  const loop = $('video[data-loop]');
  if (loop) {
    const btn = $('[data-loop-toggle]');
    let userPaused = reduceMotion;
    const icons = { pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>', play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5l11 7-11 7z" fill="currentColor"/></svg>' };
    const sync = () => {
      if (!btn) return;
      const playing = !loop.paused;
      btn.innerHTML = playing ? icons.pause : icons.play;
      btn.setAttribute('aria-label', playing ? 'Pause the video' : 'Play the video');
    };
    const play = () => { const pr = loop.play(); if (pr && pr.catch) pr.catch(() => {}); };
    if (btn) {
      btn.hidden = false;
      btn.addEventListener('click', () => {
        if (loop.paused) { userPaused = false; play(); } else { userPaused = true; loop.pause(); }
      });
    }
    loop.addEventListener('play', sync);
    loop.addEventListener('pause', sync);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((en) => {
        en.forEach((e) => { if (e.isIntersecting && !userPaused) play(); else if (!e.isIntersecting) loop.pause(); });
      }, { threshold: 0.25 }).observe(loop);
    } else if (!userPaused) play();
    sync();
  }

  /* ---------- Hero screen: the introduction slides ---------- */
  const tv = $('[data-tv]');
  if (tv) {
    const slides = $$('[data-slide]', tv);
    const bar = $('[data-tv-bar]', tv);
    const segs = $$('.tv__seg', tv);
    const btn = $('[data-tv-toggle]');
    const dur = (parseFloat(getComputedStyle(tv).getPropertyValue('--tv-dur')) || 5) * 1000;
    const icons = { pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>', play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5l11 7-11 7z" fill="currentColor"/></svg>' };
    let current = 0;
    let timer = null;
    let startedAt = 0;
    let remaining = dur;
    let userPaused = reduceMotion; // as with the old video: no autoplay for reduced motion
    let visible = true;

    const show = (i) => {
      current = (i + slides.length) % slides.length;
      slides.forEach((sl, j) => {
        const on = j === current;
        sl.classList.toggle('is-active', on);
        sl.setAttribute('aria-hidden', String(!on));
      });
      segs.forEach((sg, j) => {
        sg.classList.remove('is-active');
        sg.classList.toggle('is-done', j < current);
        sg.setAttribute('aria-current', j === current ? 'true' : 'false');
      });
      const seg = segs[current];
      if (seg) { void seg.offsetWidth; seg.classList.add('is-active'); }
      remaining = dur;
    };
    const stop = () => {
      if (timer) { clearTimeout(timer); timer = null; remaining = Math.max(0, remaining - (Date.now() - startedAt)); }
    };
    const run = () => {
      if (timer || userPaused || !visible || slides.length < 2) return;
      startedAt = Date.now();
      timer = setTimeout(() => { timer = null; show(current + 1); run(); }, remaining);
    };
    const sync = () => {
      const paused = userPaused || !visible;
      tv.classList.toggle('is-paused', paused);
      if (paused) stop(); else run();
      if (btn) {
        btn.innerHTML = userPaused ? icons.play : icons.pause;
        btn.setAttribute('aria-label', userPaused ? 'Play the introduction' : 'Pause the introduction');
      }
    };
    if (slides.length > 1) {
      if (bar) bar.hidden = false;
      if (btn) {
        btn.hidden = false;
        btn.addEventListener('click', () => { userPaused = !userPaused; sync(); });
      }
      segs.forEach((sg) => sg.addEventListener('click', () => { stop(); show(Number(sg.dataset.go)); sync(); }));
      if ('IntersectionObserver' in window) {
        new IntersectionObserver((en) => { visible = en[0].isIntersecting; sync(); }, { threshold: 0.25 }).observe(tv);
      }
      document.addEventListener('visibilitychange', () => { visible = document.visibilityState === 'visible'; sync(); });
      show(0);
      sync();
    }
  }

  /* ---------- Links into a hidden tab panel open that tab first ---------- */
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = decodeURIComponent(a.getAttribute('href').slice(1));
    const target = id && document.getElementById(id);
    const panel = target && target.closest('[role="tabpanel"]');
    if (panel && panel.hidden) {
      const tab = document.querySelector(`[role="tab"][aria-controls="${panel.id}"]`);
      if (tab) tab.click();
    }
  });

  /* ---------- PDFs in the claude.ai preview ---------- */
  // The preview runs inside a protected frame where new tabs and the browser's
  // PDF viewer are blocked, so a PDF link would do nothing. When the preview
  // offers its "downloads" capability, the link saves the PDF instead (the
  // viewer confirms). On the live site this never runs: links open normally.
  const pdfLinks = $$('a[data-pdf]');
  if (pdfLinks.length && window.claude && typeof window.claude.use === 'function') {
    window.claude.use('downloads').then((dl) => {
      if (!dl) return;
      pdfLinks.forEach((a) => {
        const label = $('[data-pdf-label]', a);
        const original = label ? label.textContent : '';
        const say = (text, ms = 2600) => {
          if (!label) return;
          label.textContent = text;
          if (ms) setTimeout(() => { label.textContent = original; }, ms);
        };
        a.addEventListener('click', async (e) => {
          e.preventDefault();
          a.setAttribute('aria-busy', 'true');
          say('Preparing…', 0);
          try {
            const res = await fetch(a.href);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const blob = await res.blob();
            await dl.save({ filename: a.dataset.pdf || 'paper.pdf', data: blob });
            say('Saved');
          } catch (err) {
            const code = err && err.code;
            if (code === 'declined' || code === 'rate_limited') say(original, 1);
            else say('Not available here: read it on this page', 4000);
          } finally {
            a.removeAttribute('aria-busy');
          }
        });
      });
    }).catch(() => {});
  }

  /* ---------- Blog: filter by topic ---------- */
  const blogFilter = $('[data-blog-filter]');
  if (blogFilter) {
    const root = $('[data-blog]');
    const chips = $$('[data-topic]', blogFilter);
    const items = $$('[data-post]', root);
    const status = $('.library-status', root);
    const empty = $('[data-empty]', root);
    blogFilter.hidden = false;
    const set = (topic) => {
      let shown = 0;
      chips.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.topic === topic)));
      items.forEach((it) => {
        const on = topic === 'all' || (it.dataset.tags || '').split('|').includes(topic);
        it.hidden = !on;
        if (on) shown += 1;
      });
      if (empty) empty.hidden = shown !== 0;
      const chip = chips.find((c) => c.dataset.topic === topic);
      if (status) status.textContent = topic === 'all' ? '' : `${shown} ${shown === 1 ? 'post' : 'posts'} on ${chip ? chip.firstChild.textContent.trim() : topic}`;
    };
    chips.forEach((c) => c.addEventListener('click', () => set(c.dataset.topic)));
    const reset = $('[data-reset]', root);
    if (reset) reset.addEventListener('click', () => set('all'));
  }

  /* ---------- Project filter ---------- */
  const pf = $('[data-proj-filter]');
  const pg = $('[data-proj-grid]');
  if (pf && pg) {
    pf.hidden = false;
    const btns = $$('button', pf);
    const cards = $$('.proj', pg);
    btns.forEach((b) => b.addEventListener('click', () => {
      const k = b.dataset.kind;
      btns.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      cards.forEach((c) => { c.hidden = !(k === 'all' || c.dataset.kind === k); if (!c.hidden) c.classList.add('is-revealed'); });
      pg.classList.toggle('is-filtered', k !== 'all');
    }));
  }

  /* ---------- Content comes into focus on scroll (below the fold only) ---------- */
  if (!reduceMotion && 'IntersectionObserver' in window) {
    const els = $$('.will-reveal');
    const fold = window.innerHeight;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add('is-revealed'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.2 });
    els.forEach((el) => {
      if (el.getBoundingClientRect().top < fold) { el.classList.remove('will-reveal'); return; }
      io.observe(el);
    });
    // Safety net: never leave a heading soft if the observer doesn't fire.
    setTimeout(() => els.forEach((el) => el.classList.add('is-revealed')), 6000);
  } else {
    $$('.will-reveal').forEach((el) => el.classList.remove('will-reveal'));
  }

  /* ---------- Framework tabs ---------- */
  $$('[data-tabs]').forEach((root) => {
    const list = $('[role="tablist"]', root);
    const tabs = $$('[role="tab"]', root);
    const panels = tabs.map((t) => document.getElementById(t.getAttribute('aria-controls')));
    if (!list || !tabs.length) return;
    list.hidden = false;
    root.classList.add('frameworks--enhanced');
    const light = (panel) => {
      const c = $('.chain', panel);
      if (!c) return;
      c.classList.remove('is-lit');
      void c.offsetWidth;
      requestAnimationFrame(() => c.classList.add('is-lit'));
    };
    const select = (i, focus) => {
      tabs.forEach((t, j) => {
        const on = i === j;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        panels[j].hidden = !on;
      });
      if (focus) tabs[i].focus();
      light(panels[i]);
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(i, false));
      t.addEventListener('keydown', (e) => {
        const k = e.key;
        let n = null;
        if (k === 'ArrowRight') n = (i + 1) % tabs.length;
        if (k === 'ArrowLeft') n = (i - 1 + tabs.length) % tabs.length;
        if (k === 'Home') n = 0;
        if (k === 'End') n = tabs.length - 1;
        if (n !== null) { e.preventDefault(); select(n, true); }
      });
    });
    select(0, false);
    // Light the first chain when it scrolls into view.
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((en) => {
        if (en[0].isIntersecting) { light(panels.find((p) => !p.hidden)); io.disconnect(); }
      }, { threshold: 0.4 });
      io.observe(root);
    }
  });

  /* ---------- Copy buttons ---------- */
  $$('[data-copy]').forEach((btn) => {
    const text = btn.getAttribute('data-copy') || (btn.hasAttribute('data-copy-page') ? location.href.split('#')[0] : '');
    const label = $('span', btn);
    const original = label ? label.textContent : '';
    const done = (msg) => {
      btn.dataset.state = 'copied';
      if (label) label.textContent = msg;
      setTimeout(() => { delete btn.dataset.state; if (label) label.textContent = original; }, 2400);
    };
    btn.addEventListener('click', () => {
      const fallback = () => {
        const target = btn.parentElement.querySelector('.email-line__address');
        if (target) {
          const range = document.createRange();
          range.selectNodeContents(target);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
          done('Selected, press Ctrl+C');
        }
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => done('Copied'), fallback);
      } else fallback();
    });
  });

  /* ---------- Research library: filter + search ---------- */
  const lib = $('[data-library]');
  if (lib) {
    const chips = $$('[data-filter]', lib);
    const input = $('#library-search', lib);
    const groups = $$('[data-group]', lib);
    const items = $$('.paper', lib);
    const status = $('.library-status', lib);
    const empty = $('[data-empty]', lib);
    let layer = 'all';

    const apply = () => {
      const q = (input.value || '').trim().toLowerCase();
      const terms = q.split(/\s+/).filter(Boolean);
      let shown = 0;
      items.forEach((it) => {
        const okLayer = layer === 'all' || it.dataset.layer === layer;
        const hay = it.dataset.search || '';
        const okQuery = terms.every((t) => hay.includes(t));
        const on = okLayer && okQuery;
        it.hidden = !on;
        if (on) shown += 1;
      });
      groups.forEach((g) => { g.hidden = !$$('.paper', g).some((it) => !it.hidden); });
      empty.hidden = shown !== 0;
      const what = layer === 'all' ? '' : ` in ${chips.find((c) => c.dataset.filter === layer).firstChild.textContent.trim()}`;
      status.textContent = q || layer !== 'all'
        ? `${shown} ${shown === 1 ? 'paper' : 'papers'}${what}${q ? ` matching “${input.value.trim()}”` : ''}`
        : '';
    };
    const setLayer = (id) => {
      layer = id;
      chips.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.filter === id)));
      apply();
    };
    chips.forEach((c) => c.addEventListener('click', () => setLayer(c.dataset.filter)));
    input.addEventListener('input', apply);
    const reset = $('[data-reset]', lib);
    if (reset) reset.addEventListener('click', () => { input.value = ''; setLayer('all'); input.focus(); });

    // A link like research#proof selects that layer.
    const fromHash = () => {
      const id = decodeURIComponent(location.hash.slice(1));
      if (chips.some((c) => c.dataset.filter === id)) setLayer(id);
    };
    fromHash();
    window.addEventListener('hashchange', fromHash);
  }

  /* ---------- Enquiry forms ---------- */
  const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
  $$('form[data-form]').forEach((form) => {
    const provider = form.dataset.provider;
    const to = form.dataset.email;
    const status = $('.form__status', form);
    const submit = $('button[type="submit"]', form);
    const fields = {
      name: form.elements.name,
      email: form.elements.email,
      message: form.elements.message,
    };
    const errors = {
      name: () => (fields.name.value.trim().length < 2 ? 'Enter your name.' : ''),
      email: () => (!fields.email.value.trim() ? 'Enter your email address so I can reply.' : !isEmail(fields.email.value.trim()) ? 'Enter an email address in the format name@example.com.' : ''),
      message: () => (fields.message.value.trim().length < 20 ? 'Add a little more detail: at least 20 characters.' : ''),
    };
    const show = (key) => {
      const msg = errors[key]();
      const el = fields[key];
      const out = form.querySelector(`#${el.id}-error`);
      el.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (msg) el.setAttribute('aria-describedby', `${el.id}-error`); else el.removeAttribute('aria-describedby');
      if (out) out.textContent = msg;
      return !msg;
    };
    Object.keys(fields).forEach((k) => {
      fields[k].addEventListener('blur', () => { if (fields[k].value) show(k); });
      fields[k].addEventListener('input', () => { if (fields[k].getAttribute('aria-invalid') === 'true') show(k); });
    });

    const setStatus = (tone, nodes) => {
      status.dataset.tone = tone;
      status.replaceChildren(...nodes);
    };
    const p = (text) => { const el = document.createElement('p'); el.textContent = text; return el; };

    const composeFallback = (intro) => {
      const data = new FormData(form);
      const subject = `${data.get('topic')}: message from ${data.get('name')}`;
      const text = [
        `Name: ${data.get('name')}`,
        `Email: ${data.get('email')}`,
        data.get('organisation') ? `Organisation: ${data.get('organisation')}` : null,
        `Topic: ${data.get('topic')}`,
        '',
        data.get('message'),
      ].filter((x) => x !== null).join('\n');
      const pre = document.createElement('pre');
      pre.textContent = `To: ${to}\nSubject: ${subject}\n\n${text}`;
      const actions = document.createElement('div');
      actions.className = 'actions';
      const mail = document.createElement('a');
      mail.className = 'btn btn--small';
      mail.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
      mail.textContent = 'Open in your email app';
      const copy = document.createElement('button');
      copy.type = 'button';
      copy.className = 'btn btn--ghost btn--small';
      copy.textContent = 'Copy message';
      copy.addEventListener('click', () => {
        const ok = () => { copy.textContent = 'Copied'; };
        const sel = () => { const r = document.createRange(); r.selectNodeContents(pre); const s = getSelection(); s.removeAllRanges(); s.addRange(r); copy.textContent = 'Selected, press Ctrl+C'; };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(pre.textContent).then(ok, sel); else sel();
      });
      actions.append(mail, copy);
      setStatus('draft', [p(intro), pre, actions, p(`Your message has not been sent yet. Send it from your email app, or copy it into an email to ${to}.`)]);
    };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (form.elements.company_website && form.elements.company_website.value) return; // honeypot
      const ok = ['name', 'email', 'message'].map(show).every(Boolean);
      if (!ok) {
        const first = ['name', 'email', 'message'].find((k) => fields[k].getAttribute('aria-invalid') === 'true');
        if (first) fields[first].focus();
        setStatus('error', [p('Check the highlighted fields and try again.')]);
        return;
      }

      // The subject of the notification email: "Consulting or advisory: Jane Smith".
      if (form.elements.subject) form.elements.subject.value = `Website enquiry · ${form.elements.topic.value}: ${fields.name.value.trim()}`.slice(0, 200);

      if (provider === 'mailto') {
        composeFallback('Your message is ready.');
        return;
      }

      submit.disabled = true;
      const label = submit.textContent;
      submit.textContent = 'Sending…';
      try {
        let res;
        if (provider === 'netlify') {
          const body = new URLSearchParams(new FormData(form)).toString();
          res = await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
        } else {
          res = await fetch(form.action, { method: 'POST', headers: { Accept: 'application/json' }, body: new FormData(form) });
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        form.reset();
        setStatus('ok', [p(`Message sent. Thanks, I'll reply by email.`)]);
      } catch (err) {
        composeFallback('The message could not be sent from this page, so here it is ready to email instead.');
      } finally {
        submit.disabled = false;
        submit.textContent = label;
      }
    });
  });
})();
