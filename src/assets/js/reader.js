/* Magazine reader: page images with single-page and spread layouts, keyboard
   and swipe navigation, thumbnails, and deep links (#page-9). */
(() => {
  'use strict';
  const root = document.querySelector('[data-reader]');
  if (!root) return;

  const total = Number(root.dataset.pages);
  const dir = root.dataset.dir;
  const titles = JSON.parse(root.dataset.titles || '[]');
  const stage = root.querySelector('[data-stage]');
  const status = root.querySelector('[data-status]');
  const titleEl = root.querySelector('[data-title]');
  const prevBtn = root.querySelector('[data-prev]');
  const nextBtn = root.querySelector('[data-next]');
  const layoutBtn = root.querySelector('[data-layout]');
  const thumbs = Array.from(root.querySelectorAll('[data-page]'));
  const pad = (n) => String(n).padStart(2, '0');
  const src = (n) => `${dir}/p${pad(n)}.webp`;

  const wide = window.matchMedia('(min-width: 60rem)');
  let spread = wide.matches;
  let page = 1;

  // Spreads follow the printed folios: even pages on the left, odd on the right.
  // The cover and the first printed page stand alone.
  const offset = Number(root.dataset.offset || 0);
  const spreadFor = (n) => {
    const printed = n - offset;
    if (!spread || printed <= 1) return [n];
    const left = (printed % 2 === 0 ? printed : printed - 1) + offset;
    return left + 1 <= total ? [left, left + 1] : [left];
  };

  const preload = (n) => { if (n >= 1 && n <= total) { const i = new Image(); i.decoding = 'async'; i.src = src(n); } };

  const pageEl = (n) => {
    const wrap = document.createElement('div');
    wrap.className = 'reader__page';
    const a = document.createElement('a');
    a.href = src(n);
    a.target = '_blank';
    a.rel = 'noopener';
    a.title = 'Open this page at full size';
    const img = document.createElement('img');
    img.src = src(n);
    img.width = 1200;
    img.height = 1697;
    img.decoding = 'async';
    img.alt = `Page ${n}. ${titles[n - 1] || ''}`;
    a.append(img);
    wrap.append(a);
    return wrap;
  };

  const render = () => {
    const shown = spreadFor(page);
    page = shown[0];
    stage.replaceChildren(...shown.map(pageEl));
    root.classList.toggle('reader--spread', shown.length === 2);
    const label = shown.length === 2 ? `Pages ${shown[0]}–${shown[1]} of ${total}` : `Page ${shown[0]} of ${total}`;
    status.textContent = label;
    titleEl.textContent = shown.map((n) => titles[n - 1]).filter(Boolean).join(' / ');
    prevBtn.disabled = shown[0] <= 1;
    nextBtn.disabled = shown[shown.length - 1] >= total;
    thumbs.forEach((t) => {
      const n = Number(t.dataset.page);
      if (shown.includes(n)) {
        t.setAttribute('aria-current', 'true');
        if (n === shown[0]) t.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
      } else t.removeAttribute('aria-current');
    });
    layoutBtn.setAttribute('aria-pressed', String(spread));
    layoutBtn.setAttribute('aria-label', spread ? 'Show one page at a time' : 'Show two pages side by side');
    // Warm the cache for the next turn in each direction.
    const last = shown[shown.length - 1];
    preload(last + 1); preload(last + 2); preload(shown[0] - 1);
  };

  const go = (n, opts = {}) => {
    page = Math.min(total, Math.max(1, n));
    render();
    if (opts.updateHash !== false) {
      try { history.replaceState(null, '', `#page-${page}`); } catch (_) { /* sandboxed frames */ }
    }
  };
  const step = (dirn) => {
    const shown = spreadFor(page);
    go(dirn > 0 ? shown[shown.length - 1] + 1 : shown[0] - 1);
  };

  prevBtn.addEventListener('click', () => step(-1));
  nextBtn.addEventListener('click', () => step(1));
  layoutBtn.addEventListener('click', () => { spread = !spread; render(); });
  thumbs.forEach((t) => t.addEventListener('click', () => go(Number(t.dataset.page))));

  stage.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); step(1); }
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); step(-1); }
    if (e.key === 'Home') { e.preventDefault(); go(1); }
    if (e.key === 'End') { e.preventDefault(); go(total); }
  });

  // Swipe on touch screens.
  let x0 = null;
  stage.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  stage.addEventListener('touchend', (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
    x0 = null;
  });

  wide.addEventListener('change', (m) => { spread = m.matches; render(); });

  // Contents links and deep links: #page-9
  const fromHash = (scroll) => {
    const m = /^#page-(\d+)$/.exec(location.hash);
    if (!m) return false;
    go(Number(m[1]), { updateHash: false });
    if (scroll) root.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return true;
  };
  document.querySelectorAll('[data-goto]').forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    go(Number(a.dataset.goto));
    root.scrollIntoView({ behavior: 'smooth', block: 'start' });
    stage.focus({ preventScroll: true });
  }));
  window.addEventListener('hashchange', () => fromHash(true));

  if (!fromHash(true)) render();
})();
