import { html, raw, monthYear, readingMinutes, fullDate } from './html.mjs';

const ICONS = {
  arrowLeft: '<path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',
  arrowRight: '<path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',
  download: '<path d="M12 4v11m0 0l-4.5-4.5M12 15l4.5-4.5M5 19h14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',
  external: '<path d="M14 5h5v5M19 5l-8 8M17 14v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',
  search: '<circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M16 16l4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
  copy: '<rect x="8" y="8" width="11" height="11" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M5 15V6a1 1 0 0 1 1-1h9" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
  spread: '<rect x="3" y="5" width="8" height="14" rx="1" fill="none" stroke="currentColor" stroke-width="1.6"/><rect x="13" y="5" width="8" height="14" rx="1" fill="none" stroke="currentColor" stroke-width="1.6"/>',
  single: '<rect x="7" y="4" width="10" height="16" rx="1" fill="none" stroke="currentColor" stroke-width="1.6"/>',
  pause: '<path d="M8 5v14M16 5v14" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
  play: '<path d="M8 5l11 7-11 7z" fill="currentColor"/>',
};

export const icon = (name, label) =>
  raw(`<svg viewBox="0 0 24 24" ${label ? `role="img" aria-label="${label}"` : 'aria-hidden="true" focusable="false"'}>${ICONS[name]}</svg>`);

// `download` makes the browser save the file; artifact viewers ignore it, so the
// link simply opens the PDF there.
// PDF links open the file in a new tab. In the claude.ai preview, where new
// tabs and the browser's PDF viewer are blocked, site.js turns them into a
// download the viewer confirms (the preview's "downloads" capability).
export const downloadAttr = (ctx, filename = '') => raw(` target="_blank" rel="noopener"${filename ? ` data-pdf="${filename.replace(/"/g, '')}"` : ''}`);
export const pdfVerb = (ctx) => (ctx.mode === 'artifact' ? 'Download' : 'Open');

export const kindTag = (kind) =>
  kind === 'solo'
    ? html`<span class="tag tag--solo">Built solo</span>`
    : html`<span class="tag tag--team">Team product</span>`;

// ---------- Diagrams ----------

export function diagram(d) {
  if (!d) return '';
  if (d.type === 'market') {
    return html`<div class="market" role="img" aria-label="${`${d.left} (${d.leftItems.join(', ')}) connects through ${d.core.join(' and ')}, across ${d.lanes.join(', ')} deals, to the ${d.right.toLowerCase()} (${d.rightItems.join(', ')}).`}">
      <div class="market__side"><b>${d.left}</b><ul>${d.leftItems.map((i) => html`<li>${i}</li>`)}</ul></div>
      <div class="market__core"><b>${d.core.join(' + ')}</b><div class="market__lanes">${d.lanes.map((l) => html`<span>${l}</span>`)}</div></div>
      <div class="market__side"><b>${d.right}</b><ul>${d.rightItems.map((i) => html`<li>${i}</li>`)}</ul></div>
    </div>`;
  }
  return html`<div class="flow-wrap"><ol class="flow" aria-label="${d.steps.join(', then ')}">
      ${d.steps.map((s) => html`<li class="flow__step"><span>${s}</span></li>`)}
    </ol>
    ${d.modules ? html`<div class="flow__modules">Follow-on modules ${d.modules.map((m) => html`<span class="tag">${m}</span>`)}</div>` : ''}</div>`;
}

// ---------- Work row (home + lists) ----------

export function workRow(ctx, p) {
  return html`<article class="work-row">
    <div class="work-row__meta">
      ${kindTag(p.kind)}
      <span class="small muted">${p.org}</span>
      ${p.metric ? html`<div class="work-row__metric"><b class="tnum">${p.metric.value}</b><span>${p.metric.label}</span></div>` : html`<span class="small muted">${p.period}</span>`}
    </div>
    <div class="work-row__main">
      <h3><a href="${ctx.href(`work#${p.id}`)}">${p.title}</a></h3>
      <p>${p.summary}</p>
    </div>
    <div class="work-row__fig" aria-hidden="true">${diagram(p.diagram)}</div>
  </article>`;
}

// ---------- Research row ----------

export function paperRow(ctx, a, layers, { showLayer = true, headingLevel = 3 } = {}) {
  const layer = layers.find((l) => l.id === a.layer);
  const mins = readingMinutes(a.words);
  const H = headingLevel === 2 ? 'h2' : 'h3';
  const search = [a.title, a.subtitle, a.summary, layer?.name, a.region, ...(a.keywords || []), ...(showLayer ? [] : [a.abstract, ...(a.sections || [])])].filter(Boolean).join(' ').toLowerCase();
  const meta = html`
        ${a.date ? html`<span>${monthYear(a.date)}</span>` : ''}
        ${a.pages ? html`<span>${a.pages} pages</span>` : ''}
        ${mins ? html`<span>${mins} min read</span>` : ''}
        ${a.pdf ? (ctx.data.paperText?.[a.slug] ? html`<span class="is-online">Read in full here</span>` : '') : html`<span class="is-missing">Summary here. Full paper on ${a.researchgate ? 'ResearchGate' : 'LinkedIn'}</span>`}`;
  return html`<li class="paper${showLayer ? '' : ' paper--grouped'}" data-layer="${a.layer}" data-search="${search}">
    <div class="paper__layer">
      ${showLayer ? html`<span class="tag tag--layer">${layer?.name}</span>` : ''}
      ${a.region ? html`<span class="paper__region">${a.region}</span>` : ''}
      ${showLayer ? '' : html`<p class="paper__meta paper__meta--side">${meta}</p>`}
    </div>
    <div class="paper__main">
      ${raw(`<${H}>`)}<a href="${ctx.href(`papers/${a.slug}`)}">${a.title}</a>${raw(`</${H}>`)}
      <p class="paper__sub">${a.subtitle}</p>
      <p class="paper__summary">${a.summary}</p>
      ${showLayer ? html`<p class="paper__meta">${meta}</p>` : ''}
    </div>
    <div class="paper__fig figure-stat" aria-hidden="true"><b>${a.figure.value}</b><span>${a.figure.label}</span></div>
  </li>`;
}

// ---------- Framework chain ----------

export function chain(f) {
  const start = typeof f.startAt === 'number' ? f.startAt : 1;
  return html`<ol class="chain" style="--n:${f.stages.length};--start:${start - 1}" aria-label="${f.name}">
    ${f.stages.map((s, i) => html`<li class="chain__stage" style="--i:${i}">
      <span class="chain__dot" aria-hidden="true"></span>
      <span class="chain__num" aria-hidden="true"></span>
      <span class="chain__name">${s.name}</span>
      <span class="chain__detail">${s.detail}</span>
    </li>`)}
  </ol>`;
}

// ---------- Email with copy button ----------

export function emailLine(ctx) {
  const { email } = ctx.site;
  return html`<div class="email-line">
    <a class="email-line__address" href="mailto:${email}">${email}</a>
    <button class="btn btn--ghost btn--small copy-btn" type="button" data-copy="${email}">${icon('copy')}<span>Copy address</span></button>
  </div>`;
}

// ---------- Contact form ----------

export function contactForm(ctx, { idPrefix = 'enquiry', topic = '', heading = '' } = {}) {
  const { site } = ctx;
  const cfg = site.contactForm;
  const provider = ctx.mode === 'artifact' ? 'mailto' : cfg.provider;
  const formAttrs = {
    class: 'form',
    name: 'enquiry',
    novalidate: true,
    'data-form': true,
    'data-provider': provider,
    'data-email': site.email,
  };
  if (provider === 'netlify') {
    Object.assign(formAttrs, { method: 'POST', action: '/thanks', 'data-netlify': 'true', 'netlify-honeypot': 'company_website' });
  } else if (provider === 'formspree' && cfg.formspreeEndpoint) {
    Object.assign(formAttrs, { method: 'POST', action: cfg.formspreeEndpoint });
  } else {
    Object.assign(formAttrs, { method: 'GET', action: `mailto:${site.email}` });
  }
  const id = (n) => `${idPrefix}-${n}`;
  const attrStr = Object.entries(formAttrs)
    .map(([k, v]) => (v === true ? ` ${k}` : ` ${k}="${String(v).replace(/"/g, '&quot;')}"`))
    .join('');
  return html`<form${raw(attrStr)}>
    ${heading ? html`<h2 class="h-small">${heading}</h2>` : ''}
    <input type="hidden" name="form-name" value="enquiry">
    <input type="hidden" name="subject" value="Website enquiry">
    <p class="hp" aria-hidden="true"><label>Leave this empty <input name="company_website" tabindex="-1" autocomplete="off"></label></p>
    <div class="form__row">
      <div class="field">
        <label for="${id('name')}">Your name</label>
        <input id="${id('name')}" name="name" type="text" autocomplete="name" required maxlength="120">
        <p class="field__error" id="${id('name-error')}" aria-live="polite"></p>
      </div>
      <div class="field">
        <label for="${id('email')}">Email</label>
        <input id="${id('email')}" name="email" type="email" autocomplete="email" required maxlength="200" inputmode="email">
        <p class="field__error" id="${id('email-error')}" aria-live="polite"></p>
      </div>
    </div>
    <div class="form__row">
      <div class="field">
        <label for="${id('org')}">Organisation <span class="opt">(optional)</span></label>
        <input id="${id('org')}" name="organisation" type="text" autocomplete="organization" maxlength="160">
      </div>
      <div class="field">
        <label for="${id('topic')}">What it's about</label>
        <select id="${id('topic')}" name="topic">
          ${cfg.topics.map((t) => html`<option${t === topic ? raw(' selected') : ''}>${t}</option>`)}
        </select>
      </div>
    </div>
    <div class="field">
      <label for="${id('message')}">Message</label>
      <textarea id="${id('message')}" name="message" required minlength="20" maxlength="5000" rows="6"></textarea>
      <p class="field__error" id="${id('message-error')}" aria-live="polite"></p>
    </div>
    <div class="form__foot">
      <p class="form__privacy">Your details are used only to reply to you. Nothing is added to a mailing list.</p>
      <button class="btn" type="submit">Send message</button>
    </div>
    <div class="form__status" role="status" aria-live="polite"></div>
  </form>`;
}

// ---------- Project card illustrations (schematic shapes, no data) ----------

export function projectArt(art) {
  if (!art) return '';
  const label = html`<span class="proj__art-label">${art.label}</span>`;
  if (art.type === 'bars') {
    return html`${label}<div class="art art--bars">${art.bars.map((h, i) => html`<i class="${i === art.on ? 'on' : ''}" style="--h:${h}%"></i>`)}</div>`;
  }
  if (art.type === 'lanes') {
    return html`${label}<div class="art art--lanes">${art.lanes.map((l) => html`<div><span>${l.name}</span><b class="${l.on ? 'on' : ''}" style="--x:${l.x}%;--w:${l.w}%"></b></div>`)}</div>`;
  }
  if (art.type === 'slots') {
    const n = art.cols * art.rows;
    return html`${label}<div class="art art--slots" style="grid-template-columns:repeat(${art.cols},1fr)">${Array.from({ length: n }, (_, i) => html`<i class="${art.on.includes(i) ? 'on' : art.mid.includes(i) ? 'mid' : ''}"></i>`)}</div>`;
  }
  if (art.type === 'roadmap') {
    return html`${label}<div class="art art--roadmap">${art.cols.map((c) => html`<div><span>${c.name}</span>${Array.from({ length: c.blocks }, (_, i) => html`<i class="${c.on === i ? 'on' : ''}" style="width:${[92, 70, 82][i % 3]}%"></i>`)}</div>`)}</div>`;
  }
  if (art.type === 'nodes') {
    return html`${label}<div class="art art--nodes">${art.nodes.map((n, i) => html`${i ? html`<em></em>` : ''}<i class="${i === art.nodes.length - 1 ? 'on' : ''}">${n}</i>`)}</div>`;
  }
  return '';
}

export function projectCard(ctx, p) {
  return html`<article class="proj will-reveal" data-kind="${p.kind}">
    <div class="proj__art" aria-hidden="true">${projectArt(p.art)}</div>
    <div class="proj__body">
      <p class="proj__kind"><span class="${p.kind === 'solo' ? 'is-solo' : ''}">${p.kind === 'solo' ? 'Built solo' : 'Team product'}</span><span aria-hidden="true">·</span><span>${p.kind === 'solo' ? p.period : p.org}</span></p>
      <h3><a href="${ctx.href(`work#${p.id}`)}">${p.title}</a></h3>
      <p>${p.summary}</p>
      ${p.chips ? html`<ul class="chips" role="list" aria-label="Tools and topics">${p.chips.map((c) => html`<li>${c}</li>`)}</ul>` : ''}
    </div>
  </article>`;
}

// ---------- Hero screen: the introduction that plays on the TV ----------
// The slides come from content/tv.json (editable in the content manager), so
// the screen can be updated without making a new video. Text is real text:
// sharp at any size, readable by screen readers, and light to load.

export function heroScreen(ctx) {
  const tv = ctx.data.tv || { slides: [] };
  const slides = (tv.slides || []).filter((s) => s && (s.title || s.number));
  const seconds = Math.min(12, Math.max(3, Number(tv.seconds) || 5));
  const n = slides.length;
  const slide = (s, i) => {
    const layout = ['portrait', 'text', 'list', 'number'].includes(s.layout) ? s.layout : 'text';
    let k = 0;
    const d = () => `--i:${k++}`;
    const kicker = s.kicker ? html`<p class="tv__kicker" data-in style="${d()}">${s.kicker}</p>` : '';
    const badge = s.badge ? html`<p class="tv__badge" data-in style="${d()}">${s.badge}</p>` : '';
    let inner;
    if (layout === 'number') {
      inner = html`${kicker}<p class="tv__number" data-in style="${d()}">${s.number}</p><p class="tv__title tv__title--small" data-in style="${d()}">${s.title}</p>${s.text ? html`<p class="tv__text" data-in style="${d()}">${s.text}</p>` : ''}${badge}`;
    } else if (layout === 'list') {
      inner = html`${kicker}<p class="tv__title" data-in style="${d()}">${s.title}</p><ul class="tv__list" role="list">${(s.items || []).filter(Boolean).map((it) => html`<li data-in style="${d()}">${it}</li>`)}</ul>${badge}`;
    } else {
      inner = html`${kicker}<p class="tv__title${layout === 'portrait' ? ' tv__title--name' : ''}" data-in style="${d()}">${s.title}</p>${s.text ? html`<p class="tv__text" data-in style="${d()}">${s.text}</p>` : ''}${badge}`;
    }
    return html`<div class="tv__slide tv__slide--${layout}${i === 0 ? ' is-active' : ''}" data-slide role="group" aria-roledescription="slide" aria-label="${i + 1} of ${n}">
            <div class="tv__copy">${inner}</div>
            ${layout === 'portrait' ? html`<div class="tv__figure" aria-hidden="true"><i class="tv__disc"></i><img src="${ctx.asset('images/suraj-prakash-cutout-640.webp')}" width="640" height="640" alt="" loading="lazy" decoding="async"></div>` : ''}
          </div>`;
  };
  return html`<figure class="screen hero__scene">
    <div class="screen__body">
      <div class="screen__bezel">
        <div class="screen__glass">
          <div class="tv" data-tv style="--tv-dur:${seconds}s" role="region" aria-roledescription="slideshow" aria-label="Introduction">
            ${slides.map(slide)}
            <div class="tv__bar" data-tv-bar hidden>${slides.map((s, i) => html`<button class="tv__seg${i === 0 ? ' is-active' : ''}" type="button" data-go="${i}" aria-label="Show slide ${i + 1}: ${s.kicker || s.title}"><i></i></button>`)}</div>
          </div>
          <button class="screen__toggle" type="button" data-tv-toggle aria-label="Pause the introduction" hidden>${icon('pause')}</button>
        </div>
      </div>
      <div class="screen__neck" aria-hidden="true"></div>
      <div class="screen__base" aria-hidden="true"></div>
    </div>
    <figcaption>${tv.caption || ''} <a href="${ctx.href('about')}">More about me</a></figcaption>
  </figure>`;
}

// ---------- LinkedIn posts ----------

export function linkedinCard(ctx, p) {
  const text = p.text ? (p.textIsGuess ? `${p.text}…` : p.text) : `${p.kind} on LinkedIn`;
  return html`<li class="li-card${p.image ? ' li-card--img' : ''}">
    ${p.image ? html`<div class="li-card__img"><img src="${ctx.asset(p.image.replace(/^\/+/, ''))}" alt="${p.imageAlt}" loading="lazy" decoding="async"></div>` : ''}
    <div class="li-card__body">
      <p class="li-card__meta"><span>LinkedIn · ${p.kind}</span>${p.date ? html`<time datetime="${p.date}">${fullDate(p.date, { short: true })}</time>` : ''}</p>
      <p class="li-card__text${p.textIsGuess ? ' is-guess' : ''}">${text}</p>
      ${p.tags.length ? html`<ul class="li-card__tags" role="list">${p.tags.slice(0, 3).map((t) => html`<li>${t}</li>`)}</ul>` : ''}
      <a class="li-card__link" href="${p.url}" target="_blank" rel="noopener">Read on LinkedIn${icon('external')}<span class="visually-hidden">: ${text.slice(0, 90)}</span></a>
    </div>
  </li>`;
}

export function linkedinEmpty(ctx) {
  const { site } = ctx;
  return html`<li class="li-card li-card--empty">
    <div class="li-card__body">
      <p class="li-card__meta"><span>LinkedIn</span></p>
      <p class="li-card__text">Posts and long-form articles on AdTech, out-of-home and AI, published on LinkedIn.</p>
      <div class="actions">
        <a class="btn btn--small" href="${site.linkedin}" target="_blank" rel="me noopener">Follow on LinkedIn${icon('external')}</a>
        <a class="btn btn--ghost btn--small" href="${site.linkedinArticles}" target="_blank" rel="noopener">Read the articles${icon('external')}</a>
      </div>
    </div>
  </li>`;
}

export function linkedinGrid(ctx, posts, { limit = 0 } = {}) {
  const list = limit ? posts.slice(0, limit) : posts;
  return html`<ul class="li-grid" role="list">
    ${list.length ? list.map((p) => linkedinCard(ctx, p)) : linkedinEmpty(ctx)}
  </ul>`;
}

// ---------- Blog posts ----------

const coverSrc = (ctx, p) => (p.cover ? (/^https?:\/\//.test(p.cover) ? p.cover : ctx.asset(p.cover.replace(/^\/+/, ''))) : '');

export function postCover(ctx, p, { eager = false } = {}) {
  if (!p.cover) return '';
  return html`<img src="${coverSrc(ctx, p)}" alt="${p.coverAlt}"${eager ? '' : html` loading="lazy" decoding="async"`}>`;
}

export function postMeta(p) {
  return html`<p class="post-meta"><time datetime="${p.date}">${fullDate(p.date)}</time>${p.category ? html`<span>${p.category}</span>` : ''}<span>${p.minutes} min read</span></p>`;
}

export function postFeature(ctx, p) {
  const tagsKey = [p.category, ...p.tags].filter(Boolean).map((t) => t.toLowerCase()).join('|');
  return html`<article class="post-feature${p.cover ? '' : ' post-feature--text'}" data-post data-tags="${tagsKey}">
    ${p.cover ? html`<div class="post-feature__img">${postCover(ctx, p, { eager: true })}</div>` : ''}
    <div class="post-feature__body">
      <p class="label">Latest</p>
      <h2 class="post-feature__title"><a href="${ctx.href(`blog/${p.slug}`)}">${p.title}</a></h2>
      <p class="post-feature__excerpt">${p.excerpt}</p>
      ${postMeta(p)}
    </div>
  </article>`;
}

export function postRow(ctx, p, { headingLevel = 2 } = {}) {
  const tagsKey = [p.category, ...p.tags].filter(Boolean).map((t) => t.toLowerCase()).join('|');
  const H = headingLevel === 3 ? 'h3' : 'h2';
  return html`<li class="post-row${p.cover ? ' post-row--img' : ''}" data-post data-tags="${tagsKey}">
    <div class="post-row__when"><time datetime="${p.date}">${fullDate(p.date, { short: true })}</time>${p.category ? html`<span>${p.category}</span>` : ''}</div>
    <div class="post-row__main">
      ${raw(`<${H} class="post-row__title">`)}<a href="${ctx.href(`blog/${p.slug}`)}">${p.title}</a>${raw(`</${H}>`)}
      <p class="post-row__excerpt">${p.excerpt}</p>
      ${p.tags.length ? html`<ul class="keywords" role="list">${p.tags.map((t) => html`<li>${t}</li>`)}</ul>` : ''}
    </div>
    ${p.cover ? html`<div class="post-row__img" aria-hidden="true">${postCover(ctx, { ...p, coverAlt: '' })}</div>` : ''}
  </li>`;
}

// The portrait: the cut-out figure standing in front of a circle, as in the
// original painted portrait. The circle's colour comes from --circle.
export function cutoutPortrait(ctx, { alt = 'Portrait of Suraj Prakash in a navy blazer and striped shirt', lazy = true, sizes = '(max-width: 60rem) 80vw, 30rem' } = {}) {
  return html`<div class="cutout">
    <picture>
      <source type="image/webp" srcset="${ctx.asset('images/suraj-prakash-cutout-640.webp')} 640w, ${ctx.asset('images/suraj-prakash-cutout-960.webp')} 960w" sizes="${sizes}">
      <img src="${ctx.asset('images/suraj-prakash-cutout-640.png')}" width="640" height="640"${lazy ? html` loading="lazy" decoding="async"` : ''} alt="${alt}">
    </picture>
  </div>`;
}


// ---------- A research paper, readable on the page ----------
// The text, figures and tables come from scripts/prepare-papers.py, which reads
// them out of the PDF; content/papers/<slug>.json holds the result.

const external = (h) => h.replace(/<a href="(https?:[^"]+)">/g, '<a href="$1" target="_blank" rel="noopener">');
const plainText = (h) => String(h || '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'");

export function paperArticle(ctx, doc) {
  let fig = 0;
  const parts = doc.blocks.map((b) => {
    if (b.t === 'h2') return html`<h2 id="${b.id}">${b.text}</h2>`;
    if (b.t === 'h3') return html`<h3 id="${b.id}">${b.text}</h3>`;
    if (b.t === 'p') return html`<p>${raw(external(b.html))}</p>`;
    if (b.t === 'note') return html`<p class="paper-note">${raw(external(b.html))}</p>`;
    if (b.t === 'list') return html`<ul>${b.items.map((it) => html`<li>${raw(external(it))}</li>`)}</ul>`;
    if (b.t === 'refs') return html`<ul class="paper-refs" role="list">${b.items.map((it) => html`<li>${raw(external(it))}</li>`)}</ul>`;
    if (b.t === 'fig') {
      fig += 1;
      const alt = b.caption ? plainText(b.caption) : `Figure ${fig} from the paper`;
      return html`<figure class="paper-fig">
        <a href="${ctx.asset(b.src)}" target="_blank" rel="noopener" title="Open the figure at full size"><img src="${ctx.asset(b.src)}" width="${b.w}" height="${b.h}" loading="lazy" decoding="async" alt="${alt.slice(0, 300)}"></a>
        ${b.caption || b.note ? html`<figcaption>${b.caption ? raw(external(b.caption)) : ''}${b.note ? html` <span class="paper-fig__note">${raw(external(b.note))}</span>` : ''}</figcaption>` : ''}
      </figure>`;
    }
    if (b.t === 'table') {
      const [head, ...rows] = b.rows;
      const wide = head.length >= 4;
      return html`<figure class="paper-table${wide ? ' paper-table--wide' : ''}">
        ${b.caption ? html`<figcaption>${raw(external(b.caption))}</figcaption>` : ''}
        ${wide ? html`<p class="paper-table__hint" aria-hidden="true">Swipe sideways to see the whole table</p>` : ''}
        <div class="table-wrap" tabindex="0" role="region" aria-label="${(b.caption ? plainText(b.caption) : 'Table from the paper').slice(0, 160)}"><table>
          <thead><tr>${head.map((c) => html`<th scope="col">${c}</th>`)}</tr></thead>
          <tbody>${rows.map((r) => html`<tr>${r.map((c, i) => (i === 0 ? html`<th scope="row">${c}</th>` : html`<td>${c}</td>`))}</tr>`)}</tbody>
        </table></div>
        ${b.note ? html`<p class="paper-note">${raw(external(b.note))}</p>` : ''}
      </figure>`;
    }
    return '';
  });
  return html`${parts}`;
}

export function paperPages(ctx, doc, title) {
  const n = doc.pages.length;
  return html`<ol class="paper-pages" role="list">
    ${doc.pages.map((p, i) => html`<li id="page-${i + 1}">
      <img src="${ctx.asset(`papers/pages/${doc.slug}/p${String(i + 1).padStart(2, '0')}.webp`)}" width="${p.w}" height="${p.h}" loading="${i === 0 ? 'eager' : 'lazy'}" decoding="async" alt="Page ${i + 1} of ${n} of ${title}. The text of this page is in the Read online view.">
      <span class="paper-pages__no">Page ${i + 1} of ${n}</span>
    </li>`)}
  </ol>`;
}
