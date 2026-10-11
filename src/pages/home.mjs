import { html } from '../lib/html.mjs';
import { paperRow, chain, emailLine, downloadAttr, pdfVerb, projectCard, heroScreen, cutoutPortrait, linkedinGrid, icon } from '../lib/components.mjs';
import { personLd, websiteLd } from '../lib/seo.mjs';

export default function home(ctx) {
  const { site, data } = ctx;
  const { projects, articles, layers, frameworks, magazine, consulting, profile } = data;
  const byId = Object.fromEntries(projects.projects.map((p) => [p.id, p]));
  const cards = projects.homeOrder.map((id) => byId[id]);
  const order = ['brand-lift-to-incremental-impact', 'repositioning-of-the-dsp', 'data-behind-the-billboard-apac', 'outcome-exchange-ooh', 'rabbit-ai-race-adtech'];
  const featuredPapers = order.map((s) => articles.find((a) => a.slug === s));
  const ed = magazine.editions[0];
  const roles = profile.career.flatMap((org) => org.roles.map((r) => ({ ...r, org: org.org, orgNote: org.orgNote })));
  const lastRole = roles[0];
  const li = data.linkedin || { posts: [] };
  const label = (n, text) => html`<p class="label">(${String(n).padStart(2, '0')}) — ${text}</p>`;

  const body = html`
<section class="band band--clay hero" data-hero aria-labelledby="hero-title">
  <div class="wrap">
    <div class="grid hero__grid">
      <div class="hero__text">
        <p class="kicker-mono">// ${site.headline}</p>
        <h1 class="display-name" id="hero-title"><span class="hero__name-line">Suraj</span> <span class="hero__name-line">Prakash</span></h1>
        <p class="hero__tagline">Building <em>intelligent</em> products, and the research behind them.</p>
        <p class="hero__lead">Product manager for AdTech, MarTech and B2B SaaS: six years at ${site.employer}, from programmatic DOOH roadmaps and CRM and ERP integrations to AI applications I design, build and deploy myself.</p>
        <div class="actions hero__actions">
          <a class="btn" href="${ctx.href('work')}">Explore my work</a>
          <a class="btn btn--ghost" href="${ctx.href('research')}">Read my research</a>
          <a class="btn btn--text" href="${ctx.href('contact')}">Discuss a project</a>
        </div>
      </div>
      ${heroScreen(ctx)}
    </div>
    <div class="hero__meta">
      <span>Kuala Lumpur, Malaysia</span>
      <span class="is-live">Open to conversations</span>
      <span>6 years in AdTech &amp; B2B SaaS</span>
      <a class="scroll-cue" href="#about">Scroll</a>
    </div>
  </div>
</section>

<section class="band band--paper" id="about" aria-labelledby="about-title">
  <div class="wrap">
    ${label(1, 'About')}
    <h2 class="statement will-reveal" id="about-title">I care about the whole product, from the first user interview to the <em>auction</em> logic underneath.</h2>
    <div class="grid about-grid">
      <figure class="about-photo will-reveal">
        ${cutoutPortrait(ctx)}
        <figcaption>${lastRole.title}, ${lastRole.org}, ${lastRole.years.replace(' — ', '–')}</figcaption>
      </figure>
      <div class="about-copy will-reveal">
        <p>From 2020 to 2026 I worked at ${site.employer}, a DOOH and programmatic advertising technology company: first as a business analyst on dashboards, client onboarding and an organisation-wide CRM rollout, then, from 2024, as the product manager responsible for its B2B programmatic platform: strategy, roadmap and delivery, on the demand and the supply side.</p>
        <p>I'm happiest where the product meets the system underneath it: deal types, budgets, auctions, the CRM and the ledger. I also build. With Claude Code and Replit, daily tools for 18 months, I design, build and deploy AI-powered applications myself, and I've taken two from idea to production without an engineering team.</p>
        <p>And I write: <strong>twenty independent research papers</strong> in 2026 on AdTech, MarTech, OOH, product management and AI, sixteen of them collected in the first edition of <a class="link" href="${ctx.href('magazine')}">Media Intelligence</a>, with the rest on <a class="link" href="${site.researchgate}" target="_blank" rel="me noopener">ResearchGate</a>.</p>
        <div class="skill-sets">
          ${profile.skillSets.map((g) => html`<div><span class="kicker">${g.name}</span><ul class="chips" role="list">${g.items.map((i) => html`<li>${i}</li>`)}</ul></div>`)}
        </div>
        <div class="edu">
          <span class="kicker">Education</span>
          ${profile.education.map((e) => html`<div><h3>${e.degree.replace('Master of Business Administration', 'MBA, Business Analysis').replace('Bachelor of Business Administration', 'BBA, Marketing and HR')}</h3><p>${e.school} · ${e.period.replace(' to ', '–')}</p></div>`)}
        </div>
      </div>
    </div>
  </div>
</section>

<section class="band band--night-3" id="expertise" aria-labelledby="expertise-title">
  <div class="wrap">
    <div class="section-head">
      <div>
        ${label(2, 'What I do')}
        <h2 class="h-section will-reveal" id="expertise-title">From strategy to working software</h2>
        <p class="lead">Five areas, one way of working: understand the business problem, then build the product that solves it.</p>
      </div>
      <div class="section-head__aside"><a class="btn btn--ghost" href="${ctx.href('consulting')}">Work with me</a></div>
    </div>
    <ol class="expertise" role="list">
      ${profile.expertise.map((e) => html`<li class="expertise__item will-reveal">
        <span class="expertise__letter" aria-hidden="true">${e.letter}</span>
        <h3>${e.title}</h3>
        <p>${e.body}</p>
        <ul class="expertise__points" role="list">${e.points.map((pt) => html`<li>${pt}</li>`)}</ul>
        <a class="expertise__link" href="${ctx.href(e.href)}">${e.link}</a>
      </li>`)}
    </ol>
  </div>
</section>

<section class="band band--cream" id="experience" aria-labelledby="xp-title">
  <div class="wrap">
    <div class="section-head">
      <div>
        ${label(3, 'Experience')}
        <h2 class="h-section will-reveal" id="xp-title">Where I've worked</h2>
      </div>
      <div class="section-head__aside"><a class="btn btn--ghost" href="${ctx.href('about#career-title')}">Full career</a></div>
    </div>
    <ol class="xp" role="list">
      ${roles.map((r, i) => html`<li class="xp__item will-reveal" style="--reveal-delay:${Math.min(i, 3) * 0.06}s">
        <time class="xp__when">${r.years}</time>
        <div class="xp__main">
          <h3>${r.title}</h3>
          <p class="xp__org">${r.org} · ${r.orgNote}</p>
          <p class="xp__desc">${r.short}</p>
        </div>
        <ul class="xp__tags" role="list" aria-label="Focus">${r.tags.map((t) => html`<li>${t}</li>`)}</ul>
      </li>`)}
    </ol>
  </div>
</section>

<section class="band band--night" id="projects" aria-labelledby="proj-title">
  <div class="wrap">
    <div class="section-head">
      <div>
        ${label(4, 'Selected projects')}
        <h2 class="h-section will-reveal" id="proj-title">Things I've built</h2>
      </div>
      <div class="section-head__aside proj-filter" role="group" aria-label="Show projects" data-proj-filter hidden>
        <button type="button" data-kind="all" aria-pressed="true">All</button>
        <button type="button" data-kind="team" aria-pressed="false">Team</button>
        <button type="button" data-kind="solo" aria-pressed="false">Solo</button>
      </div>
    </div>
    <div class="proj-grid" data-proj-grid>
      ${cards.map((p) => projectCard(ctx, p))}
    </div>
    <div class="actions mt-3"><a class="btn btn--ghost" href="${ctx.href('work')}">Read the case studies</a></div>
  </div>
</section>

<section class="band band--paper" id="research" aria-labelledby="research-title">
  <div class="wrap">
    <div class="section-head">
      <div>
        ${label(5, 'Research')}
        <h2 class="h-section will-reveal" id="research-title">Things I've written</h2>
        <p class="lead">Independent papers on the structure of the advertising technology market, written through 2026, plus product management and AI. Facts, interpretation and outlook are kept visibly apart.</p>
      </div>
      <div class="section-head__aside actions">
        <a class="btn btn--ghost" href="${ctx.href('research')}">All papers</a>
        <a class="btn btn--ghost" href="${site.researchgate}" target="_blank" rel="me noopener">View my ResearchGate profile${icon('external')}</a>
      </div>
    </div>
    <ul class="paper-list" role="list">
      ${featuredPapers.map((a) => paperRow(ctx, a, layers))}
    </ul>
    <nav class="layer-chips" aria-label="Research by layer">
      ${layers.map((l) => html`<a class="chip" href="${ctx.href(`research#${l.id}`)}">${l.name}<span class="chip__count">${articles.filter((a) => a.layer === l.id).length}</span></a>`)}
    </nav>
  </div>
</section>

<section class="band band--cream" id="linkedin" aria-labelledby="linkedin-title">
  <div class="wrap">
    <div class="section-head">
      <div>
        ${label(6, 'LinkedIn')}
        <h2 class="h-section will-reveal" id="linkedin-title">Latest on LinkedIn</h2>
        <p class="lead">${li.intro || 'Posts and articles I’ve published on LinkedIn. Each one opens the original.'}</p>
      </div>
      <div class="section-head__aside actions">
        ${li.posts.length > 6 ? html`<a class="btn btn--ghost" href="${ctx.href('blog#linkedin')}">All ${li.posts.length} posts</a>` : ''}
        <a class="btn btn--ghost" href="${ctx.href('blog')}">Read the blog</a>
      </div>
    </div>
    ${linkedinGrid(ctx, li.posts, { limit: 6 })}
    ${li.posts.length ? html`<div class="actions mt-3"><a class="btn btn--text" href="${site.linkedin}" target="_blank" rel="me noopener">Follow on LinkedIn${icon('external')}</a></div>` : ''}
  </div>
</section>

<section class="band band--night-2" id="magazine" aria-labelledby="mag-title">
  <div class="wrap">
    <div class="grid feature-mag__grid">
      <div class="feature-mag__cover">
        <figure class="cover will-reveal">
          <a href="${ctx.href('magazine')}">
            <picture>
              <source type="image/webp" srcset="${ctx.asset(`${ed.cover}-640.webp`)} 640w, ${ctx.asset(`${ed.cover}-1024.webp`)} 1024w" sizes="(max-width: 60rem) 20rem, 30rem">
              <img src="${ctx.asset(`${ed.cover}.jpg`)}" width="1024" height="1536" loading="lazy" decoding="async" alt="Cover of Media Intelligence, edition 01, October 2026. Cover story: The Intelligence Layer, with a portrait of Suraj Prakash.">
            </picture>
          </a>
        </figure>
      </div>
      <div class="feature-mag__text">
        ${label(7, 'Magazine')}
        <h2 class="mag-title will-reveal" id="mag-title">${magazine.title}</h2>
        <p class="mag-edition"><b>Edition ${ed.number}: ${ed.name}</b><span>${ed.date}</span><span>${ed.pages} pages</span></p>
        <p class="mag-coverline">${ed.coverLine}</p>
        <p class="mag-finding">${ed.finding} The edition reads the papers side by side, from the transaction layer to the agentic turn.</p>
        <ol class="parts" role="list">
          ${ed.parts.filter((p) => p.part !== 'Back').map((p) => html`<li><span>${p.part}</span><span>${p.name}</span></li>`)}
        </ol>
        <div class="actions feature-mag__actions">
          <a class="btn" href="${ctx.href('magazine')}">Read the magazine</a>
          <a class="btn btn--ghost" href="${ctx.asset(ed.pdf)}"${downloadAttr(ctx, 'Media Intelligence - Edition 01 - The Intelligence Layer.pdf')}><span data-pdf-label>${pdfVerb(ctx)} the PDF, ${ed.pdfSize}</span></a>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="band band--cream" id="frameworks" aria-labelledby="frameworks-title">
  <div class="wrap">
    <div class="section-head">
      <div>
        ${label(8, 'Frameworks')}
        <h2 class="h-section will-reveal" id="frameworks-title">How I think</h2>
        <p class="lead">${frameworks.intro}</p>
      </div>
    </div>
    <div class="frameworks" data-tabs>
      <div class="frameworks__tabs" role="tablist" aria-label="Frameworks" hidden>
        ${frameworks.frameworks.map((f, i) => html`<button class="frameworks__tab" type="button" role="tab" id="tab-${f.id}" aria-controls="fw-${f.id}" aria-selected="${i === 0 ? 'true' : 'false'}" tabindex="${i === 0 ? '0' : '-1'}">${f.name}</button>`)}
      </div>
      ${frameworks.frameworks.map((f) => html`<div class="framework" id="fw-${f.id}" role="tabpanel" aria-labelledby="tab-${f.id}">
        <div class="framework__head">
          <h3>${f.name}</h3>
          <p>${f.lede}</p>
        </div>
        ${chain(f)}
        <p class="framework__source">From <a class="link" href="${f.source ? ctx.href(`papers/${f.source}`) : ctx.href(f.sourceHref)}">${f.sourceLabel}</a></p>
      </div>`)}
    </div>
  </div>
</section>

<section class="band band--paper" id="consulting" aria-labelledby="consulting-title">
  <div class="wrap">
    <div class="section-head">
      <div>
        ${label(9, 'Consulting')}
        <h2 class="h-section will-reveal" id="consulting-title">How I can help</h2>
        <p class="lead">${consulting.lead}</p>
      </div>
      <div class="section-head__aside"><a class="btn btn--ghost" href="${ctx.href('consulting')}">Services in detail</a></div>
    </div>
    <ul class="services" role="list">
      ${consulting.services.map((s) => html`<li class="service">
        <h3><a class="plain-link" href="${ctx.href(`consulting#${s.id}`)}">${s.title}</a></h3>
        <p>${s.body}</p>
      </li>`)}
      <li class="service">
        <h3>Something else?</h3>
        <p>Editorial collaboration, citations of the research, or a conversation about a product role. <a class="link" href="${ctx.href('contact')}">Get in touch</a>.</p>
      </li>
    </ul>
  </div>
</section>

<section class="band band--clay" id="contact" aria-labelledby="cta-title">
  <div class="wrap">
    ${label(10, 'Contact')}
    <h2 class="cta-big will-reveal" id="cta-title">Looking for a product manager who can <em>own the strategy</em> and <em>build the thing</em>?</h2>
    <div class="cta-row">
      <p class="cta-row__text">I'm open to conversations about product roles, advisory work and research collaborations. Email is the quickest way to reach me.</p>
      <div class="cta-row__actions">
        ${emailLine(ctx)}
        <div class="actions mt-2">
          <a class="btn" href="${ctx.href('contact')}">Send a message</a>
          <a class="btn btn--ghost" href="${site.linkedin}" target="_blank" rel="me noopener">LinkedIn</a>
        </div>
      </div>
    </div>
  </div>
</section>`;

  return {
    id: 'home',
    current: 'home',
    title: '',
    docTitle: ctx.mode === 'artifact' ? site.name : '',
    canonical: '',
    description: 'Suraj Prakash: product manager, AI platform builder and AdTech researcher in Kuala Lumpur. Six years of B2B SaaS at Moving Walls and 20 research papers.',
    jsonLd: [personLd(ctx), websiteLd(ctx)],
    body,
  };
}
