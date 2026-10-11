import { html, raw, fullDate } from '../lib/html.mjs';
import { icon, postCover } from '../lib/components.mjs';
import { breadcrumbLd } from '../lib/seo.mjs';
import { renderMarkdown } from '../lib/markdown.mjs';

export default function post(ctx, p) {
  const { site, data } = ctx;
  const posts = data.posts;
  const idx = posts.findIndex((x) => x.slug === p.slug);
  const newer = posts[idx - 1];
  const older = posts[idx + 1];
  const more = posts.filter((x) => x.slug !== p.slug).slice(0, 3);

  // Links in a post: site paths like /research or /images/blog/x.jpg become
  // relative, so they work on any host and in the preview.
  const url = (u) => {
    if (/^\/(images|papers|editions|video)\//.test(u)) return ctx.asset(u.slice(1));
    if (/^\/[a-z0-9-/]*(#.*)?$/i.test(u) && !u.startsWith('//')) return ctx.href(u.slice(1).replace(/\/$/, ''));
    return u;
  };
  const bodyHtml = renderMarkdown(p.body, { url });
  const share = ctx.absolute(`blog/${p.slug}`);

  const body = html`
<article>
<header class="band band--clay page-head" aria-labelledby="page-title">
  <div class="wrap">
    <nav aria-label="Breadcrumb">
      <ol class="breadcrumb" role="list">
        <li><a href="${ctx.href('blog')}">Blog</a></li>
        ${p.category ? html`<li>${p.category}</li>` : ''}
      </ol>
    </nav>
    <h1 class="article-head__title" id="page-title">${p.title}</h1>
    ${p.summary ? html`<p class="article-head__sub">${p.summary}</p>` : ''}
    <dl class="meta-row">
      <div><dt>Author</dt><dd>${site.name}</dd></div>
      <div><dt>Published</dt><dd><time datetime="${p.date}">${fullDate(p.date)}</time></dd></div>
      ${p.updated && p.updated !== p.date ? html`<div><dt>Updated</dt><dd><time datetime="${p.updated}">${fullDate(p.updated)}</time></dd></div>` : ''}
      <div><dt>Reading time</dt><dd>About ${p.minutes} minute${p.minutes === 1 ? '' : 's'}</dd></div>
      ${p.category ? html`<div><dt>Type</dt><dd>${p.category}</dd></div>` : ''}
    </dl>
  </div>
</header>

<section class="band band--paper" aria-label="Post">
  <div class="wrap">
    <div class="grid article-body">
      <div class="article-main post-main">
        ${p.cover ? html`<figure class="post-cover">${postCover(ctx, p, { eager: true })}</figure>` : ''}
        <div class="prose prose--post">${raw(bodyHtml)}</div>
        ${p.tags.length ? html`<ul class="keywords post-tags" role="list" aria-label="Tags">${p.tags.map((t) => html`<li>${t}</li>`)}</ul>` : ''}
      </div>
      <aside class="article-aside">
        <div class="aside-block">
          <h2>Share</h2>
          <div class="actions">
            <button class="btn btn--ghost btn--small copy-btn" type="button" data-copy="${share}" data-copy-page>${icon('copy')}<span>Copy link</span></button>
            ${share ? html`<a class="btn btn--ghost btn--small" href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(share)}" target="_blank" rel="noopener">Share on LinkedIn${icon('external')}</a>` : ''}
            ${p.linkedin ? html`<a class="btn btn--small" href="${p.linkedin}" target="_blank" rel="noopener">Discuss on LinkedIn${icon('external')}</a>` : ''}
          </div>
        </div>
        ${more.length ? html`<div class="aside-block">
          <h2>More from the blog</h2>
          <ul class="aside-posts" role="list">${more.map((x) => html`<li><a href="${ctx.href(`blog/${x.slug}`)}"><b>${x.title}</b><span>${fullDate(x.date, { short: true })}</span></a></li>`)}</ul>
        </div>` : ''}
        <div class="aside-block">
          <h2>Elsewhere</h2>
          <a class="mag-ref" href="${ctx.href('research')}"><small>Research</small><b>Sixteen independent papers</b><span>Open the library</span></a>
        </div>
      </aside>
    </div>
  </div>
</section>
</article>

${newer || older ? html`<nav class="band band--paper band--tight" aria-label="More posts">
  <div class="wrap">
    <div class="pager">
      ${older ? html`<a href="${ctx.href(`blog/${older.slug}`)}"><small>Older post</small><b>${older.title}</b></a>` : html`<span></span>`}
      ${newer ? html`<a href="${ctx.href(`blog/${newer.slug}`)}"><small>Newer post</small><b>${newer.title}</b></a>` : ''}
    </div>
  </div>
</nav>` : ''}

<section class="band band--tight" aria-labelledby="post-cta">
  <div class="wrap">
    <h2 class="h-section" id="post-cta">Want to talk about it?</h2>
    <div class="actions mt-2">
      <a class="btn" href="${ctx.href('contact')}">Get in touch</a>
      <a class="btn btn--ghost" href="${ctx.href('blog')}">All posts</a>
    </div>
  </div>
</section>`;

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: p.title,
    description: p.excerpt,
    datePublished: p.date,
    dateModified: p.updated || p.date,
    wordCount: p.words,
    keywords: [p.category, ...p.tags].filter(Boolean).join(', ') || undefined,
    inLanguage: 'en',
    author: { '@type': 'Person', name: site.name, url: ctx.siteUrl ? `${ctx.siteUrl}/` : undefined },
  };
  if (ctx.siteUrl) {
    ld.url = ctx.absolute(`blog/${p.slug}`);
    ld.mainEntityOfPage = ld.url;
    if (p.cover) ld.image = /^https?:/.test(p.cover) ? p.cover : ctx.absolute(p.cover.replace(/^\/+/, ''));
  }

  return {
    id: 'post',
    current: 'blog',
    title: p.title,
    canonical: `blog/${p.slug}`,
    description: p.excerpt,
    ogType: 'article',
    ogImage: p.cover && !/^https?:/.test(p.cover) ? p.cover.replace(/^\/+/, '') : '',
    ogAlt: p.coverAlt || p.title,
    feed: ctx.siteUrl ? ctx.asset('blog/feed.xml') : '',
    jsonLd: [ld, breadcrumbLd(ctx, [['Home', ''], ['Blog', 'blog'], [p.title, `blog/${p.slug}`]])].filter(Boolean),
    body,
  };
}
