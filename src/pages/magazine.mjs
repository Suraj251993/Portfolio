import { html } from '../lib/html.mjs';
import { icon, downloadAttr, pdfVerb } from '../lib/components.mjs';
import { magazineLd, breadcrumbLd } from '../lib/seo.mjs';

export default function magazine(ctx) {
  const { magazine: M } = ctx.data;
  const { site } = ctx;
  const ed = M.editions[0];
  const off = ed.pageOffset || 0;
  const pad = (n) => String(n).padStart(2, '0');
  const pages = Array.from({ length: ed.pages }, (_, i) => i + 1);
  const linkedin = ed.linkedin || site.linkedinArticles;

  const body = html`
<section class="band band--clay mag-hero" aria-labelledby="page-title">
  <div class="wrap">
    <div class="grid mag-hero__grid">
      <div class="mag-hero__text">
        <p class="kicker-mono">// Edition ${ed.number} · ${ed.date}</p>
        <h1 class="mag-title" id="page-title">${M.title}</h1>
        <p class="mag-edition"><b>Edition ${ed.number}: ${ed.name}</b><span>${ed.date}</span><span>${ed.pages} pages</span><span>Edited and written by ${site.name}</span></p>
        <p class="mag-coverline">${ed.strap}</p>
        <div class="prose prose--small prose--muted mt-2">
          ${ed.intro.map((p) => html`<p>${p}</p>`)}
        </div>
        <div class="actions mt-3">
          <a class="btn" href="#reader">Read it here</a>
          <a class="btn btn--ghost" href="${ctx.asset(ed.pdf)}"${downloadAttr(ctx, 'Media Intelligence - Edition 01 - The Intelligence Layer.pdf')}>${icon('download')}<span data-pdf-label>${pdfVerb(ctx)} the PDF, ${ed.pdfSize}</span></a>
          <a class="btn btn--text" href="${linkedin}" target="_blank" rel="noopener">${ed.linkedin ? 'See it on LinkedIn' : 'Follow on LinkedIn'}</a>
        </div>
      </div>
      <div class="mag-hero__cover">
        <figure class="cover">
          <picture>
            <source type="image/webp" srcset="${ctx.asset(`${ed.cover}-640.webp`)} 640w, ${ctx.asset(`${ed.cover}-1024.webp`)} 1024w" sizes="(max-width: 60rem) 18rem, 28rem">
            <img src="${ctx.asset(`${ed.cover}.jpg`)}" width="1024" height="1536" alt="Cover of Media Intelligence, edition 01, October 2026. Cover story: The Intelligence Layer. Cover lines: The data behind the billboard; The agentic turn; From exposure to proof; Commerce media meets the street; Outlook 2026 to 2030." fetchpriority="high">
          </picture>
        </figure>
      </div>
    </div>
  </div>
</section>

<section class="band band--paper" id="contents" aria-labelledby="contents-title">
  <div class="wrap">
    <div class="section-head">
      <div>
        <h2 class="h-section" id="contents-title">The story in seven parts</h2>
        <p class="lead">${ed.finding} Each chapter opens in the reader below.</p>
      </div>
    </div>
    <div class="contents">
      ${ed.parts.map((p) => html`<section class="contents__part" aria-label="Part ${p.part}: ${p.name}">
        <h3><span>${p.part === 'Back' ? '' : `Part ${p.part}`}</span>${p.name}</h3>
        <ol role="list">
          ${p.chapters.map((c) => html`<li><a href="#page-${c.page + off}" data-goto="${c.page + off}"><b>${c.title}</b><span class="pg">p. ${c.page}</span>${c.dek ? html`<small>${c.dek}</small>` : ''}</a></li>`)}
        </ol>
      </section>`)}
    </div>
  </div>
</section>

<section class="band band--ink-2" id="reader" aria-labelledby="reader-title">
  <div class="wrap">
    <div class="section-head section-head--tight">
      <div><h2 class="h-section" id="reader-title">Read edition ${ed.number}</h2></div>
    </div>
    <div class="reader" data-reader data-pages="${ed.pages}" data-dir="${ctx.asset(ed.pageDir)}" data-thumbs="${ctx.asset(ed.thumbDir)}" data-titles="${JSON.stringify(ed.pageTitles)}" data-offset="${off}">
      <div class="reader__bar">
        <div class="reader__nav">
          <button class="reader__btn" type="button" data-prev aria-label="Previous page">${icon('arrowLeft')}</button>
          <span class="reader__status" data-status aria-live="polite">Page 1 of ${ed.pages}</span>
          <button class="reader__btn" type="button" data-next aria-label="Next page">${icon('arrowRight')}</button>
        </div>
        <p class="reader__title" data-title>${ed.pageTitles[0]}</p>
        <div class="reader__tools">
          <button class="reader__btn" type="button" data-layout aria-pressed="false" aria-label="Show two pages side by side">${icon('spread')}</button>
          <a class="reader__btn" href="${ctx.asset(ed.pdf)}"${downloadAttr(ctx, 'Media Intelligence - Edition 01 - The Intelligence Layer.pdf')} aria-label="${pdfVerb(ctx)} the PDF">${icon('download')}</a>
        </div>
      </div>
      <div class="reader__stage" data-stage tabindex="0" aria-label="Magazine pages. Use the left and right arrow keys to turn pages.">
        <div class="reader__page"><a href="${ctx.asset(`${ed.pageDir}/p01.webp`)}" target="_blank" rel="noopener"><img src="${ctx.asset(`${ed.pageDir}/p01.webp`)}" width="1200" height="1697" alt="Page 1. ${ed.pageTitles[0]}"></a></div>
      </div>
      <ol class="reader__thumbs" data-thumbstrip role="list" aria-label="All pages">
        ${pages.map((n) => html`<li><button type="button" data-page="${n}" aria-label="Go to page ${n}: ${ed.pageTitles[n - 1]}"><img src="${ctx.asset(`${ed.thumbDir}/p${pad(n)}.webp`)}" width="220" height="311" loading="lazy" decoding="async" alt=""></button></li>`)}
      </ol>
      <p class="reader__hint">Select a page to open it at full size. Page numbers in the contents refer to the printed folios.</p>
      <noscript>
        <ol class="reader-fallback" role="list">
          ${pages.map((n) => html`<li><a href="${ctx.asset(`${ed.pageDir}/p${pad(n)}.webp`)}"><img src="${ctx.asset(`${ed.thumbDir}/p${pad(n)}.webp`)}" width="220" height="311" loading="lazy" alt="Page ${n}: ${ed.pageTitles[n - 1]}"></a></li>`)}
        </ol>
      </noscript>
    </div>
  </div>
</section>

<section class="band band--paper" aria-labelledby="evidence-title">
  <div class="wrap">
    <div class="section-head">
      <div>
        <h2 class="h-section" id="evidence-title">How to read the evidence</h2>
        <p class="lead">Every claim in the edition carries one of three labels. The distinction matters, because much of what circulates about AI in advertising blurs them.</p>
      </div>
    </div>
    <ul class="labels" role="list">
      ${ed.labels.map((l) => html`<li><h3>${l.name}</h3><p>${l.body}</p></li>`)}
    </ul>
    <ul class="standards" role="list">
      ${ed.standards.map((s) => html`<li>${s}</li>`)}
    </ul>
    <p class="small muted mt-3">${ed.cutoff} Check figures against current primary sources before strategic or investment use. Written for ${ed.audience}</p>
  </div>
</section>

<section class="band" aria-labelledby="note-title">
  <div class="wrap">
    <h2 class="visually-hidden" id="note-title">From the editor's note</h2>
    <blockquote>
      <p class="pull">${ed.editorsNote}</p>
      <footer class="pull-cite">${site.name}, editor's note, page 4</footer>
    </blockquote>
    <div class="actions mt-3">
      <a class="btn" href="${ctx.href('research')}">Browse the sixteen papers</a>
      <a class="btn btn--ghost" href="${ctx.href('contact')}">Talk about the research</a>
    </div>
  </div>
</section>`;

  return {
    id: 'magazine',
    current: 'magazine',
    title: 'Media Intelligence magazine',
    ogTitle: `Media Intelligence, edition ${ed.number}: ${ed.name}`,
    ogImage: 'og/magazine.jpg',
    canonical: 'magazine',
    description: `Media Intelligence, edition ${ed.number}: ${ed.name}. A ${ed.pages}-page publication by Suraj Prakash on the technology that plans, buys and measures advertising.`,
    jsonLd: [magazineLd(ctx, ed), breadcrumbLd(ctx, [['Home', ''], ['Magazine', 'magazine']])].filter(Boolean),
    scripts: ['assets/js/reader.js'],
    body,
  };
}
