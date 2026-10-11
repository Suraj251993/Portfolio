import { html } from '../lib/html.mjs';

// Shown after a form submission when JavaScript is off (Netlify Forms redirect).
export default function thanks(ctx) {
  const body = html`
<section class="band band--clay simple" aria-labelledby="page-title">
  <div class="wrap">
    <h1 class="h-page" id="page-title">Message sent</h1>
    <p class="lead mt-2">Thanks for getting in touch. I'll reply by email.</p>
    <div class="actions">
      <a class="btn" href="${ctx.href('')}">Back to the home page</a>
      <a class="btn btn--ghost" href="${ctx.href('research')}">Read the research</a>
    </div>
  </div>
</section>`;
  return { id: 'thanks', current: '', title: 'Message sent', canonical: 'thanks', noindex: true, body };
}
