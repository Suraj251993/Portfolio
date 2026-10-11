import { html } from '../lib/html.mjs';
import { contactForm } from '../lib/components.mjs';
import { breadcrumbLd } from '../lib/seo.mjs';

export default function consulting(ctx) {
  const { consulting: C } = ctx.data;

  const body = html`
<section class="band band--clay page-head" aria-labelledby="page-title">
  <div class="wrap">
    <div class="grid page-head__grid">
      <div class="page-head__title">
        <p class="kicker-mono">// Work with me</p>
        <h1 class="h-page" id="page-title">Consulting and collaboration</h1>
        <p class="lead">${C.lead}</p>
      </div>
      <div class="page-head__aside">
        <ul class="jump-list jump-list--stack" role="list" aria-label="Services">
          ${C.services.map((s) => html`<li><a href="#${s.id}">${s.title}</a></li>`)}
        </ul>
      </div>
    </div>
  </div>
</section>

<section class="band band--paper" aria-label="Services">
  <div class="wrap">
    ${C.services.map((s) => html`<article class="offer" id="${s.id}" aria-labelledby="${s.id}-title">
      <header class="offer__head">
        <h2 id="${s.id}-title">${s.title}</h2>
        <p>${s.body}</p>
      </header>
      <div class="offer__col">
        <h3>Problems I can help with</h3>
        <ul>${s.problems.map((x) => html`<li>${x}</li>`)}</ul>
      </div>
      <div class="offer__col">
        <h3>What you get</h3>
        <ul>${s.formats.map((x) => html`<li>${x}</li>`)}</ul>
      </div>
      <p class="offer__ground"><b>Grounded in:</b> ${s.grounding}</p>
    </article>`)}
  </div>
</section>

<section class="band band--paper-2" aria-labelledby="who-title">
  <div class="wrap">
    <div class="section-head">
      <div>
        <h2 class="h-section" id="who-title">Who it's for</h2>
      </div>
    </div>
    <ul class="audiences" role="list">
      ${C.audiences.map((a) => html`<li>${a}</li>`)}
    </ul>
  </div>
</section>

<section class="band band--paper" aria-labelledby="how-title">
  <div class="wrap">
    <div class="section-head">
      <div>
        <h2 class="h-section" id="how-title">How an engagement works</h2>
        <p class="lead">Each engagement is scoped to the question, and we agree its shape before any work starts.</p>
      </div>
    </div>
    <ol class="steps" role="list">
      ${C.process.map((p) => html`<li><h3>${p.title}</h3><p>${p.body}</p></li>`)}
    </ol>
    <p class="note mt-3">${C.disclosure}</p>
  </div>
</section>

<section class="band" id="enquiry" aria-labelledby="enquiry-title">
  <div class="wrap">
    <div class="grid contact-grid">
      <div class="contact-grid__channels">
        <h2 class="h-section" id="enquiry-title">Start with a short note</h2>
        <p class="lead mt-2">Tell me what you're working on and what you'd like help with. A few sentences is plenty. I'll reply by email.</p>
      </div>
      <div class="contact-grid__form">
        ${contactForm(ctx, { idPrefix: 'consult', topic: 'Consulting or advisory' })}
      </div>
    </div>
  </div>
</section>`;

  return {
    id: 'consulting',
    current: 'consulting',
    title: 'Consulting',
    docTitle: 'Consulting with Suraj Prakash: product and AdTech strategy',
    canonical: 'consulting',
    description: 'Product strategy, AdTech and MarTech product consulting, OOH and DOOH market intelligence, and AI product discovery from Suraj Prakash.',
    jsonLd: [breadcrumbLd(ctx, [['Home', ''], ['Consulting', 'consulting']])].filter(Boolean),
    body,
  };
}
