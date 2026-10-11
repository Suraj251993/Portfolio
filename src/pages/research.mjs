import { html } from '../lib/html.mjs';
import { paperRow, icon } from '../lib/components.mjs';
import { monthYear } from '../lib/html.mjs';
import { breadcrumbLd } from '../lib/seo.mjs';

export default function research(ctx) {
  const { articles, layers, magazine, researchgate: rg } = ctx.data;
  const { site } = ctx;
  const withPdf = articles.filter((a) => a.pdf).length;
  const ed = magazine.editions[0];

  const body = html`
<section class="band band--clay page-head" aria-labelledby="page-title">
  <div class="wrap">
    <div class="grid page-head__grid">
      <div class="page-head__title">
        <p class="kicker-mono">// ${articles.length + rg.items.length} papers · 2026</p>
        <h1 class="h-page" id="page-title">Research</h1>
        <p class="lead">Independent research written through 2026. Sixteen papers on how advertising is planned, bought, measured and proved, with a focus on out-of-home and digital out-of-home, which together became the first edition of <a href="${ctx.href('magazine')}">Media Intelligence</a>. Four more on product management, AI and B2B SaaS.</p>
      </div>
      <div class="page-head__aside">
        <a class="btn" href="${rg.profile}" target="_blank" rel="me noopener">View my ResearchGate profile${icon('external')}</a>
        <p class="note mt-2">${withPdf} papers can be read in full on this site, with their figures, tables and references, or opened as PDFs. ${articles.length - withPdf} are summarised from the magazine, with the original on ResearchGate. Every paper is on ResearchGate.</p>
      </div>
    </div>
  </div>
</section>

<section class="band band--paper" aria-label="Research library">
  <div class="wrap" data-library>
    <div class="library-tools">
      <div class="layer-chips" role="group" aria-label="Filter by layer">
        <button class="chip" type="button" data-filter="all" aria-pressed="true">All<span class="chip__count">${articles.length + rg.items.length}</span></button>
        ${layers.map((l) => html`<button class="chip" type="button" data-filter="${l.id}" aria-pressed="false">${l.name}<span class="chip__count">${articles.filter((a) => a.layer === l.id).length}</span></button>`)}
        <button class="chip" type="button" data-filter="product-and-ai" aria-pressed="false">Product and AI<span class="chip__count">${rg.items.length}</span></button>
      </div>
      <div class="search">
        <label class="visually-hidden" for="library-search">Search the research</label>
        ${icon('search')}
        <input id="library-search" type="search" placeholder="Search by company, region or topic" autocomplete="off" spellcheck="false">
      </div>
    </div>
    <p class="library-status" role="status" aria-live="polite"></p>

    ${layers.map((l) => {
      const items = articles.filter((a) => a.layer === l.id);
      return html`<section class="layer-group" id="${l.id}" data-group="${l.id}" aria-labelledby="${l.id}-title">
        <header class="layer-group__head">
          <h2 id="${l.id}-title"><span class="layer-group__part">Magazine part ${l.part}</span>${l.name}</h2>
          <p>${l.question}</p>
        </header>
        <ul class="paper-list" role="list">
          ${items.map((a) => paperRow(ctx, a, layers, { showLayer: false }))}
        </ul>
      </section>`;
    })}

    <section class="layer-group" id="product-and-ai" data-group="product-and-ai" aria-labelledby="product-and-ai-title">
      <header class="layer-group__head">
        <h2 id="product-and-ai-title"><span class="layer-group__part">On ResearchGate</span>Product management and AI</h2>
        <p>Four papers outside the magazine, on B2B SaaS product management, AI-native requirements, and agentic planning for out-of-home. They open on ResearchGate.</p>
      </header>
      <ul class="rg-list" role="list">
        ${rg.items.map((it) => html`<li class="rg-item paper" data-layer="product-and-ai" data-search="${[it.title, it.topic, 'researchgate product management ai b2b saas'].join(' ').toLowerCase()}">
          <p class="rg-item__meta"><span>${it.topic}</span><span>${monthYear(it.date)}</span></p>
          <h3><a href="${it.url}" target="_blank" rel="noopener">${it.title}</a></h3>
          <span class="rg-item__go" aria-hidden="true">ResearchGate${icon('external')}</span>
        </li>`)}
      </ul>
      <p class="mt-2"><a class="btn btn--ghost btn--small" href="${rg.profile}" target="_blank" rel="me noopener">Explore all my research on ResearchGate${icon('external')}</a></p>
    </section>

    <div class="empty-state" data-empty hidden>
      <h2>No papers match that search</h2>
      <p>Try a company such as Broadsign or Nielsen, a region such as Europe, or a topic such as attribution. <button class="btn btn--text" type="button" data-reset>Clear the search</button></p>
    </div>
  </div>
</section>

<section class="band band--ink-3 band--tight" aria-labelledby="mag-cta">
  <div class="wrap">
    <div class="grid split">
      <div class="split__main">
        <h2 class="h-section" id="mag-cta">Read them as one story</h2>
        <p class="lead mt-1">${ed.finding}</p>
      </div>
      <div class="split__aside actions">
        <a class="btn" href="${ctx.href('magazine')}">Open Media Intelligence</a>
      </div>
    </div>
  </div>
</section>`;

  return {
    id: 'research',
    current: 'research',
    title: 'Research',
    canonical: 'research',
    description: 'Twenty independent research papers by Suraj Prakash from 2026: AdTech, programmatic and agentic buying, OOH and DOOH data, measurement, brand lift and retail media, plus product management and AI. All on ResearchGate.',
    jsonLd: [breadcrumbLd(ctx, [['Home', ''], ['Research', 'research']])].filter(Boolean),
    scripts: [],
    body,
  };
}
