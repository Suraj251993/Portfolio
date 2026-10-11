import { html } from '../lib/html.mjs';
import { kindTag, diagram } from '../lib/components.mjs';
import { breadcrumbLd } from '../lib/seo.mjs';

export default function work(ctx) {
  const { projects: P } = ctx.data;
  const list = P.projects;

  const body = html`
<section class="band band--clay page-head" aria-labelledby="page-title">
  <div class="wrap">
    <div class="grid page-head__grid">
      <div class="page-head__title">
        <p class="kicker-mono">// Work</p>
        <h1 class="h-page" id="page-title">Products and platforms</h1>
        <p class="lead">${P.intro}</p>
      </div>
      <div class="page-head__aside">
        <ul class="legend" role="list" aria-label="How projects are labelled">
          <li>${kindTag('team')} Led with a team at Moving Walls</li>
          <li>${kindTag('solo')} Designed, built and shipped by me</li>
        </ul>
      </div>
    </div>
    <ul class="jump-list" role="list" aria-label="Projects on this page">
      ${list.map((p) => html`<li><a href="#${p.id}">${p.title}</a></li>`)}
      <li><a href="#earlier">Earlier work</a></li>
    </ul>
  </div>
</section>

${list.map((p, i) => html`<article class="band ${i % 2 ? 'band--paper-2' : 'band--paper'} band--tight case" id="${p.id}" aria-labelledby="${p.id}-title">
  <div class="wrap">
    <div class="grid case__grid">
      <aside class="case__aside" aria-label="Project facts">
        <div>${kindTag(p.kind)}</div>
        ${p.metric ? html`<div class="case__metric"><b class="tnum">${p.metric.value}</b><span>${p.metric.label}</span></div>` : ''}
        <dl>
          <div><dt>Context</dt><dd>${p.org}</dd></div>
          ${p.area ? html`<div><dt>Area</dt><dd>${p.area}</dd></div>` : ''}
          <div><dt>When</dt><dd>${p.period}</dd></div>
          ${p.status ? html`<div><dt>Status</dt><dd>${p.status}</dd></div>` : ''}
        </dl>
      </aside>
      <div class="case__body">
        <h2 class="case__title" id="${p.id}-title">${p.title}</h2>
        <p class="case__subtitle">${p.subtitle}</p>
        <p class="case__summary">${p.summary}</p>
        <figure class="case__diagram">
          ${diagram(p.diagram)}
          <figcaption>${p.diagram.type === 'market' ? 'How the platform sits between both sides of the market.' : 'How the pieces connect.'}</figcaption>
        </figure>
        <div class="case__sections">
          <section class="case__section"><h3>The problem</h3><p>${p.problem}</p></section>
          <section class="case__section"><h3>Users and context</h3><p>${p.users}</p></section>
          <section class="case__section"><h3>My role</h3><p>${p.role}</p></section>
          <section class="case__section"><h3>Key decisions</h3><ul>${p.decisions.map((d) => html`<li>${d}</li>`)}</ul></section>
          ${p.tools ? html`<section class="case__section"><h3>Tools</h3><div class="case__tools">${p.tools.map((t) => html`<span class="tag">${t}</span>`)}</div></section>` : ''}
          <section class="case__section"><h3>Outcome</h3><p>${p.outcome}</p></section>
        </div>
      </div>
    </div>
  </div>
</article>`)}

<section class="band band--paper" id="earlier" aria-labelledby="earlier-title">
  <div class="wrap">
    <div class="section-head">
      <div>
        <h2 class="h-section" id="earlier-title">Earlier work at Moving Walls</h2>
        <p class="lead">Before product, four business-analysis roles. They are where I learned how clients, operations and data actually behave.</p>
      </div>
    </div>
    <ul class="earlier" role="list">
      ${P.earlier.map((e) => html`<li><h3>${e.role}</h3><time>${e.period}</time><p>${e.body}</p></li>`)}
    </ul>
    <p class="note mt-3">${P.note}</p>
  </div>
</section>

<section class="band band--tight" aria-labelledby="work-cta">
  <div class="wrap">
    <h2 class="h-section" id="work-cta">Building something similar?</h2>
    <div class="actions mt-2">
      <a class="btn" href="${ctx.href('contact')}">Discuss a project</a>
      <a class="btn btn--ghost" href="${ctx.href('consulting')}">See how I work with teams</a>
    </div>
  </div>
</section>`;

  return {
    id: 'work',
    current: 'work',
    title: 'Work',
    canonical: 'work',
    description: 'Product work by Suraj Prakash across AdTech, enterprise applications and AI: a DSP platform revamp, programmatic DOOH roadmap ownership, Salesforce and ERP integration, and two AI-powered products built and deployed solo.',
    jsonLd: [breadcrumbLd(ctx, [['Home', ''], ['Work', 'work']])].filter(Boolean),
    body,
  };
}
