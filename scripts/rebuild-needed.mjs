// Decides whether the live site needs rebuilding today, so the daily workflow
// (.github/workflows/daily-rebuild.yml) only asks Netlify for a new deploy when
// something would change. Each production deploy uses Netlify credits, and the
// free plan has a fixed monthly allowance, so a blind daily rebuild would use
// it up.
//
// A rebuild is needed when:
//   - a blog post with a future date has reached its day and isn't live yet, or
//   - a LinkedIn feed address is set and the feed has posts the site doesn't show.
//
// It reads /build-info.json from the live site (written by every build) to see
// what is live. If the live site can't be reached, it falls back to rebuilding
// only on the day a scheduled post falls due.
//
//   SITE_URL=https://www.example.com node scripts/rebuild-needed.mjs
//
// Prints its reasoning, writes rebuild=true|false to $GITHUB_OUTPUT when run in
// GitHub Actions, and always exits 0.

import { readFileSync, appendFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadBlog, loadLinkedIn } from '../src/lib/content.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const site = JSON.parse(readFileSync(join(ROOT, 'content/site.json'), 'utf8'));
const siteUrl = String(process.env.SITE_URL || site.siteUrl || '').trim().replace(/\/+$/, '');
const today = new Intl.DateTimeFormat('en-CA', { timeZone: site.tz || 'UTC', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

const reasons = [];
const notes = [];

const blog = loadBlog(ROOT, { tz: site.tz });
const ownerSlug = (String(site.linkedin || '').match(/\/in\/([^/]+?)(?:-\d+[a-z0-9]*)?\/?$/i) || [])[1] || '';
const linkedin = await loadLinkedIn(ROOT, { ownerSlug, fetchFeed: true, log: (m) => notes.push(m) });

let live = null;
if (siteUrl) {
  try {
    const res = await fetch(`${siteUrl}/build-info.json`, { headers: { 'cache-control': 'no-cache' }, signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    live = await res.json();
    notes.push(`The live site was built ${live.built} (${live.posts.length} post${live.posts.length === 1 ? "" : "s"}, ${live.linkedin.length} LinkedIn post${live.linkedin.length === 1 ? "" : "s"}).`);
  } catch (err) {
    notes.push(`Couldn't read ${siteUrl}/build-info.json (${err.message}).`);
  }
} else {
  notes.push('SITE_URL isn\'t set (GitHub: Settings → Secrets and variables → Actions → Variables), so the live site can\'t be compared.');
}

if (live) {
  const missing = blog.posts.filter((p) => !live.posts.includes(p.slug));
  missing.forEach((p) => reasons.push(`blog post "${p.title}" (${p.date}) is due but not live`));
  if (linkedin.feedUrl) {
    const fresh = linkedin.posts.filter((p) => !live.linkedin.includes(p.url));
    if (fresh.length) reasons.push(`${fresh.length} new LinkedIn post${fresh.length > 1 ? 's' : ''} in the feed`);
  }
} else {
  const dueToday = blog.posts.filter((p) => p.date === today);
  dueToday.forEach((p) => reasons.push(`blog post "${p.title}" is scheduled for today`));
  if (linkedin.feedUrl && new Date().getUTCDay() === 1) reasons.push('weekly LinkedIn feed refresh (the live site couldn\'t be compared)');
}

notes.forEach((n) => console.log(n));
const rebuild = reasons.length > 0;
console.log(rebuild ? `Rebuild needed: ${reasons.join('; ')}.` : `No rebuild needed on ${today}: nothing new to publish.`);
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `rebuild=${rebuild}\n`);
