import { html } from '../lib/html.mjs';
import { postFeature, postRow, linkedinGrid, icon } from '../lib/components.mjs';
import { breadcrumbLd } from '../lib/seo.mjs';

export default function blog(ctx) {
  const { site, data } = ctx;
  const posts = data.posts || [];
  const li = data.linkedin || { posts: [] };
  const [latest, ...rest] = posts;

  // Filter chips: categories and tags in use, most used first.
  const counts = new Map();
  posts.forEach((p) => [p.category, ...p.tags].filter(Boolean).forEach((t) => {
    const k = t.toLowerCase();
    const c = counts.get(k) || { label: t, n: 0 };
    c.n += 1;
    counts.set(k, c);
  }));
  const chips = [...counts.entries()].sort((a, b) => b[1].n - a[1].n || a[1].label.localeCompare(b[1].label));
  const feedUrl = ctx.siteUrl ? ctx.asset('blog/feed.xml') : '';

  const body = html`
<section class="band band--clay page-head" aria-labelledby="page-title">
  <div class="wrap">
    <div class="grid page-head__grid">
      <div class="page-head__title">
        <p class="kicker-mono">// Blog</p>
        <h1 class="h-page" id="page-title">Blog</h1>
        <p class="lead">Research notes and opinions on AdTech, MarTech, OOH and DOOH, AI and product management.</p>
      </div>
      <div class="page-head__aside">
        <ul class="jump-list jump-list--stack" role="list" aria-label="On this page">
          <li><a href="#posts">Posts${posts.length ? ` (${posts.length})` : ''}</a></li>
          <li><a href="#linkedin">On LinkedIn${li.posts.length ? ` (${li.posts.length})` : ''}</a></li>
          <li><a href="${ctx.href('research')}">Research papers</a></li>
          <li><a href="${site.researchgate}" target="_blank" rel="me noopener">ResearchGate profile ↗</a></li>
          ${feedUrl ? html`<li><a href="${feedUrl}">RSS feed</a></li>` : ''}
        </ul>
      </div>
    </div>
  </div>
</section>

<section class="band band--paper" id="posts" aria-label="Blog posts">
  <div class="wrap" data-blog>
    ${posts.length ? html`
    ${chips.length > 1 ? html`<div class="layer-chips blog-chips" role="group" aria-label="Filter posts by topic" data-blog-filter hidden>
      <button class="chip" type="button" data-topic="all" aria-pressed="true">All<span class="chip__count">${posts.length}</span></button>
      ${chips.map(([k, c]) => html`<button class="chip" type="button" data-topic="${k}" aria-pressed="false">${c.label}<span class="chip__count">${c.n}</span></button>`)}
    </div>
    <p class="library-status" role="status" aria-live="polite"></p>` : ''}
    ${postFeature(ctx, latest)}
    ${rest.length ? html`<ul class="post-list" role="list">${rest.map((p) => postRow(ctx, p))}</ul>` : ''}
    <div class="empty-state" data-empty hidden>
      <h2>No posts on that topic yet</h2>
      <p><button class="btn btn--text" type="button" data-reset>Show all posts</button></p>
    </div>` : html`
    <div class="blog-empty">
      <p class="label">Coming up</p>
      <h2 class="h-item">The first posts are on their way.</h2>
      <p class="lead">Until then, the research library has sixteen papers, and LinkedIn has the latest posts.</p>
      <div class="actions mt-2">
        <a class="btn" href="${ctx.href('research')}">Read the research</a>
        <a class="btn btn--ghost" href="${site.linkedin}" target="_blank" rel="me noopener">Follow on LinkedIn${icon('external')}</a>
      </div>
    </div>`}
  </div>
</section>

<section class="band band--cream" id="linkedin" aria-labelledby="linkedin-title">
  <div class="wrap">
    <div class="section-head">
      <div>
        <p class="label">LinkedIn</p>
        <h2 class="h-section" id="linkedin-title">On LinkedIn</h2>
        <p class="lead">${li.intro || 'Posts and articles I’ve published on LinkedIn. Each one opens the original.'}</p>
      </div>
      <div class="section-head__aside"><a class="btn btn--ghost" href="${site.linkedin}" target="_blank" rel="me noopener">Follow on LinkedIn${icon('external')}</a></div>
    </div>
    ${linkedinGrid(ctx, li.posts)}
  </div>
</section>`;

  return {
    id: 'blog',
    current: 'blog',
    title: 'Blog',
    canonical: 'blog',
    description: 'The blog of Suraj Prakash: research notes and opinions on AdTech, MarTech, OOH and DOOH, AI and product management, plus his posts on LinkedIn.',
    feed: feedUrl,
    jsonLd: [breadcrumbLd(ctx, [['Home', ''], ['Blog', 'blog']]), ctx.siteUrl ? {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: `${site.name}: Blog`,
      url: ctx.absolute('blog'),
      author: { '@type': 'Person', name: site.name, url: `${ctx.siteUrl}/` },
      blogPost: posts.slice(0, 20).map((p) => ({ '@type': 'BlogPosting', headline: p.title, datePublished: p.date, url: ctx.absolute(`blog/${p.slug}`) })),
    } : null].filter(Boolean),
    body,
  };
}
