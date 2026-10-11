import { html } from '../lib/html.mjs';

export default function notfound(ctx) {
  // Built with root-relative paths in production (see build.mjs), because a
  // 404 can be served from any URL depth.
  const to = (p) => ctx.href(p);
  const body = html`
<section class="band band--clay simple" aria-labelledby="page-title">
  <div class="wrap">
    <h1 class="h-page" id="page-title">This page isn't here</h1>
    <p class="lead mt-2">The link may be out of date, or the page may have moved. These are the main sections of the site.</p>
    <div class="actions">
      <a class="btn" href="${to('')}">Home</a>
      <a class="btn btn--ghost" href="${to('work')}">Work</a>
      <a class="btn btn--ghost" href="${to('research')}">Research</a>
      <a class="btn btn--ghost" href="${to('magazine')}">Magazine</a>
      <a class="btn btn--ghost" href="${to('contact')}">Contact</a>
    </div>
  </div>
</section>`;
  return { id: 'notfound', current: '', title: 'Page not found', noindex: true, body };
}
