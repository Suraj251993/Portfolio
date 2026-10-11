// RSS feed for the blog (blog/feed.xml). Only built when the site's address is
// known, because feed links must be absolute. Feed readers, and services that
// share new posts to LinkedIn automatically, can subscribe to it.

const x = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]);
const rfc822 = (iso) => new Date(`${iso}T08:00:00+08:00`).toUTCString();

export function blogFeed({ site, siteUrl, posts }) {
  const base = siteUrl.replace(/\/+$/, '');
  const items = posts.slice(0, 50).map((p) => {
    const url = `${base}/blog/${p.slug}`;
    return `    <item>
      <title>${x(p.title)}</title>
      <link>${x(url)}</link>
      <guid isPermaLink="true">${x(url)}</guid>
      <pubDate>${rfc822(p.date)}</pubDate>
      <description>${x(p.excerpt)}</description>
${[p.category, ...p.tags].filter(Boolean).map((t) => `      <category>${x(t)}</category>`).join('\n')}
    </item>`;
  }).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${x(site.name)}: Blog</title>
    <link>${x(`${base}/blog`)}</link>
    <atom:link href="${x(`${base}/blog/feed.xml`)}" rel="self" type="application/rss+xml"/>
    <description>Research notes and opinions on AdTech, MarTech, OOH, DOOH, AI and product management.</description>
    <language>en</language>
${posts[0] ? `    <lastBuildDate>${rfc822(posts[0].date)}</lastBuildDate>\n` : ''}${items}
  </channel>
</rss>
`;
}
