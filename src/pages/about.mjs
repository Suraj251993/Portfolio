import { html } from '../lib/html.mjs';
import { cutoutPortrait, icon } from '../lib/components.mjs';
import { profilePageLd, breadcrumbLd } from '../lib/seo.mjs';

export default function about(ctx) {
  const { site, data } = ctx;
  const { profile } = data;

  const facts = [
    ['6 years', 'at Moving Walls, across five roles'],
    ['2', 'AI-powered products built and deployed solo'],
    ['15 days', 'concept to production for one of them'],
    ['~30%', 'less development rework from discovery first'],
    ['20', 'independent research papers in 2026'],
    ['36', 'pages in Media Intelligence, Edition 01'],
  ];

  const body = html`
<section class="band band--clay page-head about-intro" aria-labelledby="page-title">
  <div class="wrap">
    <div class="grid">
      <div class="about-intro__text">
        <p class="kicker-mono">// Suraj Prakash</p>
        <h1 class="h-page" id="page-title">About</h1>
        <p class="deck">I'm a product manager who builds: six years of B2B SaaS and AdTech, hands-on AI application development, and independent research on how advertising and marketing technology are changing.</p>
        <div class="prose prose--muted mt-3">
          <p>I started in consultative sales, then took an MBA in business analysis and finance at Manipal International University in Malaysia. In March 2020 I joined ${site.employer}, a DOOH and programmatic advertising technology company, as a business analyst building retail dashboards.</p>
          <p>Over the next four years I onboarded clients across Latin America and Asia, ran an organisation-wide CRM rollout and worked on innovation strategy. From April 2024 I was Senior Executive Product Manager, responsible for strategy, roadmap and delivery on the programmatic DOOH platform, until I completed my time at ${site.employer} in 2026.</p>
          <p>Alongside that I build. For the past 18 months Claude Code and Replit have been daily tools, and I've designed, built and deployed two AI-powered products without an engineering team. I also write: twenty research papers in 2026, sixteen of them collected in the first edition of <a href="${ctx.href('magazine')}">Media Intelligence</a>, and all of them on <a href="${site.researchgate}" target="_blank" rel="me noopener">ResearchGate</a>.</p>
        </div>
      </div>
      <figure class="about-intro__figure portrait">
        ${cutoutPortrait(ctx, { lazy: false, alt: 'Portrait of Suraj Prakash', sizes: '(max-width: 60rem) 80vw, 26rem' })}
        <figcaption><strong>${site.name}</strong>${site.location}</figcaption>
      </figure>
    </div>
  </div>
</section>

<section class="band band--ink-2" id="introduction" aria-labelledby="intro-title">
  <div class="wrap">
    <p class="label">Introduction</p>
    <h2 class="visually-hidden" id="intro-title">An introduction</h2>
    <p class="intro-statement will-reveal">Product manager, <em>AI platform builder</em>, enterprise B2B SaaS professional, and AdTech and MarTech writer and researcher.</p>
    <ol class="identities" role="list">
      ${profile.identities.map((it) => html`<li class="identity will-reveal">
        <h3>${it.title}</h3>
        <p class="identity__sub">${it.sub}</p>
        <p>${it.body}</p>
        <ul role="list">${it.points.map((pt) => html`<li>${pt}</li>`)}</ul>
        <a href="${ctx.href(it.href)}">${it.link}</a>
      </li>`)}
    </ol>
    <ul class="intro-facts" role="list" aria-label="In numbers">
      ${facts.map(([n, t]) => html`<li><b>${n}</b><span>${t}</span></li>`)}
    </ul>
    <div class="actions intro-links">
      <a class="btn" href="${ctx.href('work')}">See the work</a>
      <a class="btn btn--ghost" href="${site.researchgate}" target="_blank" rel="me noopener">View my ResearchGate profile${icon('external')}</a>
      <a class="btn btn--ghost" href="${site.linkedin}" target="_blank" rel="me noopener">LinkedIn${icon('external')}</a>
    </div>
  </div>
</section>

<section class="band band--paper" aria-labelledby="connect-title">
  <div class="wrap">
    <div class="section-head">
      <div>
        <h2 class="h-section" id="connect-title">How the pieces connect</h2>
        <p class="lead">Each part of the work makes the others better. That's the reason I keep all of them.</p>
      </div>
    </div>
    <ul class="connect" role="list">
      <li><h3>Product</h3><p>Six years on a live programmatic platform keep the research grounded in how order management, auctions and budgets work in practice, not just in press releases.</p></li>
      <li><h3>Research</h3><p>Writing publicly forces a level of clarity that carries straight into how I write specifications and talk to stakeholders. It also keeps me reading the market, not just my own roadmap.</p></li>
      <li><h3>Execution</h3><p>Building products myself, from AI tools to CRM and ERP integrations, shortens the distance between an idea and evidence: working software in days, rather than quarters.</p></li>
    </ul>
  </div>
</section>

<section class="band band--paper-2" aria-labelledby="principles-title">
  <div class="wrap">
    <div class="section-head">
      <div><h2 class="h-section" id="principles-title">How I work</h2></div>
    </div>
    <ul class="principles" role="list">
      ${profile.principles.map((p) => html`<li><h3>${p.title}</h3><p>${p.body}</p></li>`)}
    </ul>
  </div>
</section>

<section class="band band--paper" aria-labelledby="career-title">
  <div class="wrap">
    <div class="section-head">
      <div><h2 class="h-section" id="career-title">Career</h2></div>
    </div>
    <ol class="career" role="list">
      ${profile.career.map((org) => html`<li class="career__org">
        <header><h3>${org.org}</h3><p>${org.orgNote}<br>${org.period}</p></header>
        <ol class="career__roles" role="list">
          ${org.roles.map((r) => html`<li><time>${r.start} to ${r.end}</time><h4>${r.title}</h4><p>${r.body}</p></li>`)}
        </ol>
      </li>`)}
    </ol>
  </div>
</section>

<section class="band band--paper-2" aria-labelledby="facts-title">
  <div class="wrap">
    <h2 class="visually-hidden" id="facts-title">Education, certifications and skills</h2>
    <div class="facts">
      <section aria-labelledby="edu-title">
        <h3 id="edu-title">Education</h3>
        <dl>${profile.education.map((e) => html`<div><dt>${e.degree}</dt><dd>${e.school}, ${e.period}. ${e.note}.</dd></div>`)}</dl>
        <h3 class="mt-3" id="cert-title">Certifications</h3>
        <dl>${profile.certifications.map((c) => html`<div><dt>${c.issuer}</dt><dd>${c.items.join('; ')}</dd></div>`)}</dl>
      </section>
      <section aria-labelledby="skills-title">
        <h3 id="skills-title">Skills and tools</h3>
        <div class="skill-groups">
          ${profile.skills.map((g) => html`<div><b>${g.group}</b><span>${g.items.join(', ')}</span></div>`)}
        </div>
        <p class="note mt-3"><b>Disclosure.</b> I worked at ${site.employer} from 2020 to 2026, in the industry my research covers. To avoid conflicts of interest, the competitive analyses in Media Intelligence do not assess ${site.employer}.</p>
      </section>
    </div>
  </div>
</section>

<section class="band band--tight" aria-labelledby="about-cta">
  <div class="wrap">
    <h2 class="h-section" id="about-cta">Let's talk</h2>
    <p class="lead mt-1">About a product role, an advisory project or the research.</p>
    <div class="actions mt-2">
      <a class="btn" href="${ctx.href('contact')}">Get in touch</a>
      <a class="btn btn--ghost" href="${site.linkedin}" target="_blank" rel="me noopener">LinkedIn</a>
      <a class="btn btn--ghost" href="${site.researchgate}" target="_blank" rel="me noopener">View my ResearchGate profile</a>
    </div>
  </div>
</section>`;

  return {
    id: 'about',
    current: 'about',
    title: 'About',
    docTitle: 'About Suraj Prakash, product manager and AdTech researcher',
    canonical: 'about',
    description: 'About Suraj Prakash: product manager, AI platform builder and AdTech and MarTech researcher. Six years at Moving Walls, two AI products built solo, 20 papers.',
    jsonLd: [profilePageLd(ctx), breadcrumbLd(ctx, [['Home', ''], ['About', 'about']])].filter(Boolean),
    body,
  };
}
