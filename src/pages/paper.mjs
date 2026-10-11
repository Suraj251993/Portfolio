import { html, monthYear, readingMinutes } from '../lib/html.mjs';
import { icon, downloadAttr, pdfVerb, paperArticle, paperPages } from '../lib/components.mjs';
import { paperLd, breadcrumbLd } from '../lib/seo.mjs';

export default function paper(ctx, a) {
  const { articles, layers, magazine } = ctx.data;
  const { site } = ctx;
  const layer = layers.find((l) => l.id === a.layer);
  const ed = magazine.editions[0];
  const mins = readingMinutes(a.words);
  const idx = articles.findIndex((x) => x.slug === a.slug);
  const prev = articles[(idx - 1 + articles.length) % articles.length];
  const next = articles[(idx + 1) % articles.length];
  const pdfHref = ctx.asset(`papers/${a.slug}.pdf`);
  const linkedin = a.linkedin || site.linkedinArticles;
  const magPage = a.magazine.page + (ed.pageOffset || 0);
  const doc = a.pdf ? ctx.data.paperText?.[a.slug] : null;
  const pdfName = `Suraj Prakash - ${a.title}.pdf`.replace(/[\\/:*?"<>|]/g, '');
  const pdfLink = (cls, label) => html`<a class="${cls}" href="${pdfHref}"${downloadAttr(ctx, pdfName)}>${icon(ctx.mode === 'artifact' ? 'download' : 'external')}<span data-pdf-label>${label}</span></a>`;
  const toc = doc ? doc.blocks.filter((b) => b.t === 'h2') : [];

  const body = html`
<article>
<header class="band band--clay page-head" aria-labelledby="page-title">
  <div class="wrap">
    <nav aria-label="Breadcrumb">
      <ol class="breadcrumb" role="list">
        <li><a href="${ctx.href('research')}">Research</a></li>
        <li><a href="${ctx.href(`research#${layer.id}`)}">${layer.name}</a></li>
      </ol>
    </nav>
    <h1 class="article-head__title" id="page-title">${a.title}</h1>
    <p class="article-head__sub">${a.subtitle}</p>
    <dl class="meta-row">
      <div><dt>Author</dt><dd>${site.name}</dd></div>
      ${a.date ? html`<div><dt>Written</dt><dd><time datetime="${a.date}">${monthYear(a.date)}</time></dd></div>` : ''}
      ${a.pages ? html`<div><dt>Length</dt><dd>${a.pages} pages</dd></div>` : ''}
      ${mins ? html`<div><dt>Reading time</dt><dd>About ${mins} minutes</dd></div>` : ''}
      ${a.region ? html`<div><dt>Region</dt><dd>${a.region}</dd></div>` : ''}
      <div><dt>Type</dt><dd>Independent research paper</dd></div>
    </dl>
    <div class="actions article-actions">
      ${doc ? html`<a class="btn" href="#read">Read the paper</a>` : ''}
      ${a.pdf ? pdfLink(doc ? 'btn btn--ghost' : 'btn', `${pdfVerb(ctx)} the PDF`) : ''}
      ${a.researchgate ? html`<a class="btn ${a.pdf ? 'btn--ghost' : ''}" href="${a.researchgate}" target="_blank" rel="noopener">${a.pdf ? 'View on ResearchGate' : 'Read on ResearchGate'}${icon('external')}</a>` : ''}
      <a class="btn btn--ghost" href="${linkedin}" target="_blank" rel="noopener">${a.linkedin ? 'Read on LinkedIn' : 'More on LinkedIn'}${icon('external')}</a>
    </div>
  </div>
</header>

<section class="band band--paper" aria-label="Paper summary">
  <div class="wrap">
    <div class="grid article-body">
      <div class="article-main">
        <p class="article-summary">${a.summary}</p>
        <div class="keyfig"><b>${a.figure.value}</b><span>${a.figure.label}</span></div>

        ${a.abstract ? html`<section class="article-section" aria-labelledby="abstract">
          <h2 id="abstract">Abstract</h2>
          <div class="prose"><p>${a.abstract}</p></div>
        </section>` : html`<section class="article-section">
          <p class="note"><b>The full paper isn't on this site yet.</b> This entry summarises what chapter ${a.magazine.chapter} of Media Intelligence reports from it. The original is on ${a.researchgate ? html`<a class="link" href="${a.researchgate}" target="_blank" rel="noopener">ResearchGate</a>` : html`<a class="link" href="${linkedin}" target="_blank" rel="noopener">LinkedIn</a>`}.</p>
        </section>`}

        ${a.keywords?.length ? html`<section class="article-section" aria-labelledby="keywords">
          <h2 id="keywords">Keywords</h2>
          <ul class="keywords" role="list">${a.keywords.map((k) => html`<li>${k}</li>`)}</ul>
        </section>` : ''}
      </div>

      <aside class="article-aside">
        ${a.pdf ? html`<div class="aside-block">
          <h2>The paper</h2>
          <a class="preview-card" href="${doc ? '#read' : pdfHref}"${doc ? '' : downloadAttr(ctx, pdfName)}>
            <div class="preview-card__img"><img src="${ctx.asset(`papers/previews/${a.slug}.webp`)}" width="720" height="932" loading="lazy" decoding="async" alt="First page of the paper ${a.title}"></div>
            <span class="preview-card__label"><span>${doc ? 'Read it here' : `${pdfVerb(ctx)} the PDF`}</span><span>${a.pages} pages</span></span>
          </a>
          <p class="mt-1">${pdfLink('btn btn--text btn--small', `${pdfVerb(ctx)} the PDF`)}</p>
        </div>` : ''}
        <div class="aside-block">
          <h2>In Media Intelligence</h2>
          <a class="mag-ref" href="${ctx.href(`magazine#page-${magPage}`)}">
            <small>Edition ${ed.number}, chapter ${a.magazine.chapter}</small>
            <b>${a.magazine.title}</b>
            <span>Open at page ${a.magazine.page}</span>
          </a>
        </div>
        <div class="aside-block">
          <h2>On ResearchGate</h2>
          <a class="mag-ref" href="${site.researchgate}" target="_blank" rel="me noopener"><small>All my research</small><b>View my ResearchGate profile</b><span>Opens ResearchGate</span></a>
        </div>
        ${!doc && a.sections?.length ? html`<div class="aside-block">
          <h2>Inside the paper</h2>
          <ol class="toc" role="list">${a.sections.map((s) => html`<li>${s}</li>`)}</ol>
        </div>` : ''}
      </aside>
    </div>
  </div>
</section>

${doc ? html`<section class="band band--paper-2 paper-read" id="read" aria-labelledby="read-title">
  <div class="wrap" data-tabs>
    <div class="paper-read__head">
      <div>
        <p class="label">The full paper</p>
        <h2 class="h-section" id="read-title">Read the paper</h2>
        <p class="lead">The complete text, figures, tables and references, read here. Or see the original pages, or ${ctx.mode === 'artifact' ? 'download' : 'open'} the PDF.</p>
      </div>
      <div class="paper-read__tools">
        <div class="reader-tabs" role="tablist" aria-label="How to read the paper" hidden>
          <button class="reader-tabs__tab" type="button" role="tab" id="tab-text" aria-controls="panel-text" aria-selected="true" tabindex="0">Read online</button>
          <button class="reader-tabs__tab" type="button" role="tab" id="tab-pages" aria-controls="panel-pages" aria-selected="false" tabindex="-1">Original pages <span class="reader-tabs__n">${doc.pages.length}</span></button>
        </div>
        ${pdfLink('btn btn--ghost btn--small', `${pdfVerb(ctx)} the PDF`)}
      </div>
    </div>
    <div class="grid paper-read__grid">
      <div class="paper-read__main">
        <div class="paper-text prose prose--post" id="panel-text" role="tabpanel" aria-labelledby="tab-text">
          ${paperArticle(ctx, doc)}
        </div>
        <div id="panel-pages" role="tabpanel" aria-labelledby="tab-pages">
          ${paperPages(ctx, doc, a.title)}
        </div>
      </div>
      <aside class="paper-read__aside" aria-label="Sections of the paper">
        <h2>Sections</h2>
        <ol class="toc" role="list">${toc.map((h) => html`<li><a href="#${h.id}">${h.text.replace(/^\d+(\.\d+)*\.?\s+/, '')}</a></li>`)}</ol>
        <p class="paper-read__meta">${doc.pages.length} pages${doc.figures ? ` · ${doc.figures} figures` : ''}${doc.tables ? ` · ${doc.tables} table${doc.tables > 1 ? 's' : ''}` : ''}</p>
      </aside>
    </div>
  </div>
</section>` : ''}
</article>

<nav class="band band--paper-2 band--tight" aria-label="More research">
  <div class="wrap">
    <div class="pager">
      <a href="${ctx.href(`papers/${prev.slug}`)}"><small>Previous paper</small><b>${prev.title}</b></a>
      <a href="${ctx.href(`papers/${next.slug}`)}"><small>Next paper</small><b>${next.title}</b></a>
    </div>
    <div class="actions mt-2"><a class="btn btn--ghost" href="${ctx.href('research')}">All research</a></div>
  </div>
</nav>`;

  return {
    id: 'paper',
    current: 'research',
    title: a.title,
    ogTitle: a.title,
    ogType: 'article',
    ogImage: `og/papers/${a.slug}.jpg`,
    ogAlt: `${a.title}: ${a.subtitle}. Research by ${site.name}.`,
    canonical: `papers/${a.slug}`,
    description: a.summary.length > 160 ? `${a.summary.slice(0, a.summary.lastIndexOf(' ', 155))}…` : a.summary,
    jsonLd: [paperLd(ctx, a), breadcrumbLd(ctx, [['Home', ''], ['Research', 'research'], [a.title, `papers/${a.slug}`]])].filter(Boolean),
    body,
  };
}
