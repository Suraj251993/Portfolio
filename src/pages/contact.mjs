import { html } from '../lib/html.mjs';
import { contactForm, emailLine } from '../lib/components.mjs';
import { breadcrumbLd } from '../lib/seo.mjs';

export default function contact(ctx) {
  const { site } = ctx;
  const body = html`
<section class="band band--clay page-head" aria-labelledby="page-title">
  <div class="wrap">
    <div class="grid contact-grid">
      <div class="contact-grid__channels">
        <p class="kicker-mono">// Get in touch</p>
        <h1 class="h-page" id="page-title">Contact</h1>
        <p class="lead mt-2">Employers and recruiters, founders, product leaders, consulting clients, collaborators and editors are all welcome. Email is the quickest way to reach me.</p>
        <ul class="channels mt-3" role="list">
          <li><small>Email</small>${emailLine(ctx)}</li>
          <li><small>LinkedIn</small><a href="${site.linkedin}" target="_blank" rel="me noopener">linkedin.com/in/suraj-prakash-8460bb147</a></li>
          <li><small>Research</small><a href="${site.researchgate}" target="_blank" rel="me noopener">View my ResearchGate profile</a></li>
          <li><small>Based in</small><p>${site.location} <span class="muted small">(${site.timezone})</span></p></li>
        </ul>
      </div>
      <div class="contact-grid__form">
        ${contactForm(ctx, { idPrefix: 'contact' })}
      </div>
    </div>
  </div>
</section>`;

  return {
    id: 'contact',
    current: 'contact',
    title: 'Contact',
    canonical: 'contact',
    description: 'Contact Suraj Prakash about product roles, consulting, or research and editorial collaboration.',
    jsonLd: [breadcrumbLd(ctx, [['Home', ''], ['Contact', 'contact']])].filter(Boolean),
    body,
  };
}
