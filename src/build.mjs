#!/usr/bin/env node
// Static site build. No dependencies: Node 18+ only.
//
//   node src/build.mjs              -> dist/            (production)
//   node src/build.mjs --artifact   -> dist-artifact/   (claude.ai artifact preview)
//
// Set SITE_URL (for example https://surajprakash.com) to emit canonical URLs,
// Open Graph image URLs and a sitemap. On Netlify and Vercel the deploy URL is
// picked up automatically if SITE_URL is not set.

import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync, statSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeCtx } from './lib/ctx.mjs';
import { documentFor } from './lib/layout.mjs';
import { loadBlog, loadLinkedIn } from './lib/content.mjs';
import { cmsFiles } from './lib/cms.mjs';
import { blogFeed } from './lib/feed.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const mode = process.argv.includes('--artifact') ? 'artifact' : 'prod';
const OUT = join(ROOT, mode === 'artifact' ? 'dist-artifact' : 'dist');

const readJson = (p) => JSON.parse(readFileSync(join(ROOT, 'content', p), 'utf8'));
const site = readJson('site.json');
const articlesFile = readJson('articles.json');
const data = {
  projects: readJson('projects.json'),
  articles: articlesFile.articles,
  layers: articlesFile.layers,
  frameworks: readJson('frameworks.json'),
  magazine: readJson('magazine.json'),
  consulting: readJson('consulting.json'),
  profile: readJson('profile.json'),
  tv: readJson('tv.json'),
  researchgate: readJson('researchgate.json'),
};
if (data.researchgate.profile) site.researchgate = data.researchgate.profile;
data.paperText = {};
for (const a of data.articles) {
  const f = join(ROOT, 'content/papers', `${a.slug}.json`);
  if (a.pdf && existsSync(f)) data.paperText[a.slug] = JSON.parse(readFileSync(f, 'utf8'));
}
const blog = loadBlog(ROOT, { tz: site.tz });
data.posts = blog.posts;
const ownerSlug = (site.linkedin.match(/\/in\/([^/]+?)(?:-\d+[a-z0-9]*)?\/?$/i) || [])[1] || '';
const linkedin = await loadLinkedIn(ROOT, { ownerSlug, fetchFeed: process.env.SKIP_FEED !== '1' });
data.linkedin = linkedin;

const envUrl = process.env.SITE_URL || site.siteUrl
  || (process.env.CONTEXT === 'production' && process.env.URL)
  || (process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`)
  || '';
const siteUrl = mode === 'artifact' ? '' : envUrl;

// ---------- Pages ----------

const pages = [
  ['index.html', 'home'],
  ['work.html', 'work'],
  ['research.html', 'research'],
  ['magazine.html', 'magazine'],
  ['consulting.html', 'consulting'],
  ['about.html', 'about'],
  ['blog.html', 'blog'],
  ['contact.html', 'contact'],
  ['thanks.html', 'thanks'],
  ['404.html', 'notfound'],
];

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

// Static files first, then generated pages on top.
cpSync(join(ROOT, 'public'), OUT, { recursive: true });
cpSync(join(ROOT, 'src/assets'), join(OUT, 'assets'), { recursive: true });
if (mode === 'artifact') {
  // The artifact preview loads fonts from Google Fonts and has no public URL for
  // social cards, so these folders aren't needed there.
  for (const d of ['fonts', 'og']) rmSync(join(OUT, d), { recursive: true, force: true });
}

const write = (rel, content) => {
  const file = join(OUT, rel);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
};

const built = [];
for (const [outPath, name] of pages) {
  const { default: render } = await import(`./pages/${name}.mjs`);
  const rootRelative = mode === 'prod' && outPath === '404.html';
  const ctx = makeCtx({ mode, outPath, site, siteUrl, data, rootRelative });
  write(outPath, documentFor(ctx, render(ctx)));
  built.push(outPath);
}

const { default: paperPage } = await import('./pages/paper.mjs');
for (const a of data.articles) {
  const outPath = `papers/${a.slug}.html`;
  const ctx = makeCtx({ mode, outPath, site, siteUrl, data });
  write(outPath, documentFor(ctx, paperPage(ctx, a)));
  built.push(outPath);
}

const { default: postPage } = await import('./pages/post.mjs');
for (const p of data.posts) {
  const outPath = `blog/${p.slug}.html`;
  const ctx = makeCtx({ mode, outPath, site, siteUrl, data });
  write(outPath, documentFor(ctx, postPage(ctx, p)));
  built.push(outPath);
}

// ---------- Blog feed and the content manager ----------

if (mode === 'prod') {
  if (siteUrl) write('blog/feed.xml', blogFeed({ site, siteUrl, posts: data.posts }));
  const cms = cmsFiles(site, siteUrl);
  write('admin/index.html', cms.index);
  write('admin/config.yml', cms.config);
  if (!cms.repo) console.log('Note: the content manager (/admin) needs the GitHub repository. On Netlify it is detected automatically; elsewhere set "cms.repo" in content/site.json.');
  // What this deploy contains. The daily check (scripts/rebuild-needed.mjs)
  // compares it with the content in GitHub, so the site is only rebuilt when a
  // scheduled post is due or the LinkedIn feed has something new.
  write('build-info.json', `${JSON.stringify({
    built: new Date().toISOString(),
    commit: process.env.COMMIT_REF || '',
    posts: data.posts.map((p) => p.slug),
    linkedin: linkedin.posts.map((p) => p.url),
  })}\n`);
}

// ---------- SEO files ----------

if (mode === 'prod') {
  const indexable = built.filter((p) => !['thanks.html', '404.html'].includes(p));
  if (siteUrl) {
    // lastmod only where a real date is known (papers and posts): search
    // engines ignore a lastmod that is simply the build date on every page.
    const dated = new Map([
      ...data.articles.filter((a) => a.date).map((a) => [`papers/${a.slug}.html`, a.date]),
      ...data.posts.map((p) => [`blog/${p.slug}.html`, p.updated || p.date]),
    ]);
    const urls = indexable.map((p) => {
      const clean = p === 'index.html' ? '' : p.replace(/\.html$/, '');
      const lastmod = dated.get(p);
      return `  <url><loc>${siteUrl}/${clean}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`;
    });
    write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);
    write('robots.txt', `User-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: ${siteUrl}/sitemap.xml\n`);
  } else {
    write('robots.txt', 'User-agent: *\nAllow: /\nDisallow: /admin/\n');
  }
}

// ---------- Report ----------

const size = (dir) => readdirSync(dir).reduce((sum, f) => {
  const p = join(dir, f);
  return sum + (statSync(p).isDirectory() ? size(p) : statSync(p).size);
}, 0);
const drafts = blog.all.filter((p) => p.status === 'draft').length;
const scheduled = blog.all.filter((p) => p.scheduled).length;
console.log(`Blog: ${data.posts.length} published${drafts ? `, ${drafts} draft${drafts > 1 ? 's' : ''}` : ''}${scheduled ? `, ${scheduled} scheduled` : ''}. LinkedIn: ${linkedin.posts.length} posts.`);
console.log(`Built ${built.length} pages in ${mode} mode -> ${OUT.replace(ROOT + '/', '')} (${(size(OUT) / 1e6).toFixed(1)} MB)`);
if (mode === 'prod' && !siteUrl) console.log('Note: no site address (SITE_URL, or Netlify\'s URL in production), so canonical URLs, og:image, the RSS feed and sitemap.xml were skipped.');
if (mode === 'prod' && !existsSync(join(OUT, 'og/default.jpg'))) console.log('Note: social images missing. Run `npm run og`.');
