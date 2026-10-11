// Loads the content that changes often: blog posts (content/blog/*.md) and
// LinkedIn posts (content/linkedin.json). Both are edited in the content
// manager at /admin, or by hand.

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import { splitFrontMatter } from './frontmatter.mjs';
import { plainText, slugify } from './markdown.mjs';

const today = (tz) => new Intl.DateTimeFormat('en-CA', { timeZone: tz || 'UTC', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const isoDate = (v) => {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  const m = String(v ?? '').trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : '';
};
const list = (v) => (Array.isArray(v) ? v : typeof v === 'string' && v.trim() ? v.split(',') : [])
  .map((x) => String(x ?? '').trim()).filter(Boolean)
  .filter((x, i, a) => a.findIndex((y) => y.toLowerCase() === x.toLowerCase()) === i);
const clip = (s, n) => (s.length <= n ? s : `${s.slice(0, n).replace(/\s+\S*$/, '')}…`);

// ---------- Blog ----------

export function loadBlog(root, { tz } = {}) {
  const dir = join(root, 'content/blog');
  if (!existsSync(dir)) return { posts: [], all: [] };
  const now = today(tz);
  const all = [];
  for (const f of readdirSync(dir).sort()) {
    if (!/\.(md|markdown)$/i.test(f) || f.startsWith('_') || /^readme\./i.test(f)) continue;
    const file = `content/blog/${f}`;
    const { data, body } = splitFrontMatter(readFileSync(join(dir, f), 'utf8'), file);
    const title = String(data.title ?? '').trim();
    const date = isoDate(data.date);
    if (!title) throw new Error(`${file}: the post needs a title.`);
    if (!date) throw new Error(`${file}: the post needs a publication date (YYYY-MM-DD).`);
    const slug = slugify(basename(f).replace(/\.(md|markdown)$/i, ''));
    const text = plainText(body);
    const firstPara = plainText((body.split(/\n\s*\n/).find((p) => plainText(p).length > 40 && !/^\s*(#|!\[|>|```|\||[-*+]\s|\d+[.)]\s)/.test(p)) || ''));
    const status = String(data.status ?? (data.draft === true ? 'draft' : 'published')).toLowerCase();
    const words = text ? text.split(/\s+/).length : 0;
    all.push({
      slug,
      file,
      title,
      date,
      updated: isoDate(data.updated),
      status,
      scheduled: status !== 'draft' && date > now,
      published: status !== 'draft' && date <= now,
      category: String(data.category ?? '').trim(),
      tags: list(data.tags),
      summary: String(data.summary ?? '').trim(),
      excerpt: clip(String(data.summary ?? '').trim() || firstPara || text, 240),
      cover: String(data.cover ?? '').trim(),
      coverAlt: String(data.coverAlt ?? data.cover_alt ?? '').trim(),
      linkedin: String(data.linkedin ?? '').trim(),
      words,
      minutes: Math.max(1, Math.round(words / 230)),
      body,
    });
  }
  const seen = new Set();
  for (const p of all) {
    if (seen.has(p.slug)) throw new Error(`Two blog posts would share the address blog/${p.slug}. Rename one of the files.`);
    seen.add(p.slug);
  }
  const posts = all.filter((p) => p.published).sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));
  return { posts, all };
}

// ---------- LinkedIn ----------

const LINKEDIN = /^https:\/\/([a-z]{2,3}\.)?(www\.)?linkedin\.com\//i;

// LinkedIn activity IDs carry their own timestamp: the first 41 bits are
// milliseconds since 1970. So a post's date can be read from its link.
export function dateFromLinkedInId(id) {
  try {
    const ms = Number(BigInt(id) >> 22n);
    const d = new Date(ms);
    const y = d.getUTCFullYear();
    return y >= 2015 && y <= 2040 ? d.toISOString().slice(0, 10) : '';
  } catch { return ''; }
}

export function describeLinkedInUrl(raw, ownerSlug = '') {
  let url = String(raw ?? '').trim();
  if (!url) return null;
  if (!/^https?:\/\//i.test(url)) url = `https://${url.replace(/^\/+/, '')}`;
  url = url.replace(/^http:/i, 'https:');
  let u;
  try { u = new URL(url); } catch { return null; }
  const host = u.hostname.replace(/^www\./, '');
  if (!/(^|\.)linkedin\.com$/.test(host) && host !== 'lnkd.in') return null;
  const path = decodeURIComponent(u.pathname);
  const clean = `https://${host === 'lnkd.in' ? 'lnkd.in' : 'www.linkedin.com'}${u.pathname.replace(/\/+$/, '')}${host === 'lnkd.in' ? '' : '/'}`;
  let kind = 'Post';
  let id = '';
  let words = '';
  let m;
  if ((m = path.match(/urn:li:(?:activity|share|ugcPost):(\d{15,20})/))) id = m[1];
  if ((m = path.match(/^\/posts\/([^/]+?)-(?:activity|share|ugcpost)-(\d{15,20})/i))) {
    id = m[2];
    const after = m[1].includes('_') ? m[1].slice(m[1].indexOf('_') + 1) : '';
    words = after;
  }
  if ((m = path.match(/^\/pulse\/([^/]+)/))) {
    kind = 'Article';
    words = m[1].replace(/-[a-z0-9]{4,6}$/i, '');
    if (ownerSlug) words = words.replace(new RegExp(`-${ownerSlug}(-[a-z0-9]+)?$`, 'i'), '');
  }
  if (/^\/newsletters\//.test(path)) kind = 'Newsletter';
  if (/^\/events\//.test(path)) kind = 'Event';
  const guess = words
    ? (() => {
      const UP = new Set(['ai', 'ooh', 'dooh', 'dsp', 'ssp', 'ctv', 'b2b', 'saas', 'api', 'kpi', 'okr', 'roi', 'pmp', 'cpm', 'cps', 'crm', 'erp', 'llm', 'apac', 'emea', 'us', 'uk', 'gtm', 'mcp']);
      const t = words.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim().split(' ').map((w) => (UP.has(w.toLowerCase()) ? w.toUpperCase() : w)).join(' ');
      return t.charAt(0).toUpperCase() + t.slice(1);
    })()
    : '';
  return { url: host === 'lnkd.in' ? url : clean, kind, id, date: id ? dateFromLinkedInId(id) : '', guess };
}

const stripTags = (s) => String(s ?? '').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
  .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n))).replace(/\s+/g, ' ').trim();

// Reads an RSS 2.0, Atom or JSON Feed document into { url, text, date } items.
export function parseFeed(body) {
  const text = String(body ?? '').trim();
  if (text.startsWith('{')) {
    const j = JSON.parse(text);
    return (j.items || []).map((it) => ({ url: it.url || it.external_url || '', text: stripTags(it.title || it.content_text || it.summary || it.content_html || ''), date: isoDate(it.date_published) }));
  }
  const tag = (block, name) => { const m = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'i')); return m ? m[1] : ''; };
  const items = [...text.matchAll(/<item[\s>][\s\S]*?<\/item>/gi)].map((m) => m[0]);
  if (items.length) {
    return items.map((b) => {
      const d = new Date(stripTags(tag(b, 'pubDate')) || stripTags(tag(b, 'dc:date')));
      return { url: stripTags(tag(b, 'link')) || stripTags(tag(b, 'guid')), text: stripTags(tag(b, 'title')) || stripTags(tag(b, 'description')), date: Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10) };
    });
  }
  return [...text.matchAll(/<entry[\s>][\s\S]*?<\/entry>/gi)].map((m) => {
    const b = m[0];
    const link = (b.match(/<link[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)/i) || b.match(/<link[^>]*href=["']([^"']+)/i) || [])[1] || '';
    const d = new Date(stripTags(tag(b, 'published')) || stripTags(tag(b, 'updated')));
    return { url: link, text: stripTags(tag(b, 'title')) || stripTags(tag(b, 'summary')), date: Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10) };
  });
}

export async function loadLinkedIn(root, { ownerSlug = '', fetchFeed = true, log = console.log } = {}) {
  const file = join(root, 'content/linkedin.json');
  const raw = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {};
  const entries = Array.isArray(raw.posts) ? raw.posts : [];
  const problems = [];
  const posts = [];
  const add = (p, source) => {
    const info = describeLinkedInUrl(p.url, ownerSlug);
    if (!info) { if (String(p.url ?? '').trim()) problems.push(`not a LinkedIn link: ${p.url}`); return; }
    if (posts.some((x) => x.url === info.url)) return;
    const text = String(p.text ?? '').trim();
    posts.push({
      url: info.url,
      kind: String(p.kind ?? '').trim() || info.kind,
      date: isoDate(p.date) || info.date,
      text: text || info.guess,
      textIsGuess: !text && !!info.guess,
      image: String(p.image ?? '').trim(),
      imageAlt: String(p.imageAlt ?? '').trim(),
      tags: list(p.tags),
      hidden: p.hidden === true,
      source,
    });
  };
  entries.forEach((p) => add(p, 'list'));

  // Optional: a feed of your LinkedIn activity from a third-party service.
  const feedUrl = String(raw.feedUrl ?? '').trim();
  if (feedUrl && fetchFeed) {
    try {
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), 10000);
      const res = await fetch(feedUrl, { signal: ctl.signal, headers: { Accept: 'application/rss+xml, application/atom+xml, application/feed+json, application/json, text/xml;q=0.9, */*;q=0.5' } });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const items = parseFeed(await res.text()).filter((it) => LINKEDIN.test(it.url) || /^https:\/\/lnkd\.in\//.test(it.url));
      const before = posts.length;
      items.forEach((it) => add({ url: it.url, text: clip(it.text, 400), date: it.date }, 'feed'));
      log(`LinkedIn feed: ${items.length} items read, ${posts.length - before} new.`);
    } catch (err) {
      log(`Warning: the LinkedIn feed (${feedUrl}) could not be read (${err.message}). Showing the posts in content/linkedin.json only.`);
    }
  }
  if (problems.length) log(`Warning: skipped in content/linkedin.json: ${problems.join('; ')}`);

  const visible = posts.filter((p) => !p.hidden);
  // Newest first; posts without a date keep their order, after dated ones.
  const indexed = visible.map((p, i) => ({ p, i }));
  indexed.sort((a, b) => (b.p.date || '').localeCompare(a.p.date || '') || a.i - b.i);
  return { posts: indexed.map((x) => x.p), feedUrl, intro: String(raw.intro ?? '').trim() };
}
