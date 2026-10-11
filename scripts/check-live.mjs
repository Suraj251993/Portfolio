// Checks the deployed site from the outside, the way a visitor reaches it:
// domain and DNS, the HTTPS certificate, redirects, security headers, every
// page and every file it links to, the 404 page, sitemap and robots.txt,
// PDFs, the contact form and the content manager.
//
//   node scripts/check-live.mjs https://www.example.com
//   node scripts/check-live.mjs https://www.example.com --external
//       also check links to other websites
//   node scripts/check-live.mjs https://www.example.com --send-test-message
//       also send one real message through the contact form, to check that it
//       reaches Netlify (and from there your inbox). Uses the address in
//       content/site.json as the sender, or --email=you@example.com.
//   node scripts/check-live.mjs http://localhost:4321 --local
//       page checks only, against a local preview (no DNS, HTTPS or redirects)
//
// Needs Node 20 or later and nothing else. Exits with code 1 if anything
// failed, so it can run in GitHub Actions (.github/workflows/check-live-site.yml).

import dns from 'node:dns/promises';
import tls from 'node:tls';
import { readFileSync, appendFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const NETLIFY_LB = '75.2.60.5';
const UA = 'Mozilla/5.0 (compatible; site-check/1.0; +scripts/check-live.mjs)';
const TIMEOUT = 20000;

// ---------- Pure checks (exported for tests) ----------

const bare = (h) => String(h || '').replace(/\.$/, '').toLowerCase();

export function evaluateDns({ apex, www, primary, ns = [], apexA = [], apexAAAA = [], wwwCname = [], wwwA = [], caa = [] }) {
  const out = [];
  const add = (status, text) => out.push({ status, text });
  ns = ns.map(bare);
  const netlifyDns = ns.some((n) => n.endsWith('.nsone.net'));
  const godaddy = ns.some((n) => n.endsWith('.domaincontrol.com'));
  if (!ns.length) add('fail', `No nameservers found for ${apex}. Check the domain is registered and active in GoDaddy.`);
  else if (netlifyDns) add('pass', `Nameservers are Netlify DNS (${ns.join(', ')})`);
  else add('info', `Nameservers are ${godaddy ? "GoDaddy's" : 'not Netlify'} (${ns.join(', ')}), so the records below must point to Netlify`);

  if (netlifyDns) {
    if (apexA.length || apexAAAA.length) add('pass', `${apex} resolves (${[...apexA, ...apexAAAA].slice(0, 4).join(', ')})`);
    else add('fail', `${apex} has no address yet. In Netlify, check the domain is added to this site (Domain management).`);
    if (wwwA.length || wwwCname.length) add('pass', `${www} resolves (${[...wwwCname.map(bare), ...wwwA].slice(0, 4).join(', ')})`);
    else add('fail', `${www} has no address yet. In Netlify, Domain management → add ${www} as a domain alias.`);
  } else {
    const others = apexA.filter((ip) => ip !== NETLIFY_LB);
    if (apexA.length === 1 && apexA[0] === NETLIFY_LB) add('pass', `${apex} → A ${NETLIFY_LB} (Netlify's load balancer)`);
    else if (apexA.includes(NETLIFY_LB)) add('fail', `${apex} has other A records (${others.join(', ')}) as well as Netlify's ${NETLIFY_LB}. Delete the others in GoDaddy's DNS (often a "Parked" record), or some visitors see the wrong site.`);
    else if (apexA.length) add('fail', `${apex} points to ${apexA.join(', ')}, not Netlify. In GoDaddy's DNS, edit the A record named @ to ${NETLIFY_LB}.`);
    else add('fail', `${apex} has no A record. In GoDaddy's DNS, add an A record: name @, value ${NETLIFY_LB}.`);
    if (apexAAAA.length) add('fail', `${apex} has IPv6 (AAAA) records (${apexAAAA.join(', ')}). Delete them in GoDaddy's DNS: they send some visitors somewhere other than Netlify.`);
    const cn = wwwCname.map(bare);
    if (cn.some((c) => c.endsWith('.netlify.app'))) add('pass', `${www} → CNAME ${cn.find((c) => c.endsWith('.netlify.app'))}`);
    else if (cn.length) add('fail', `${www} points to ${cn[0]}. In GoDaddy's DNS, change the CNAME named www to your Netlify address (yoursite.netlify.app).`);
    else if (wwwA.length) add('fail', `${www} has an A record (${wwwA.join(', ')}). Replace it with a CNAME named www pointing to yoursite.netlify.app.`);
    else add('fail', `${www} doesn't resolve. In GoDaddy's DNS, add a CNAME: name www, value yoursite.netlify.app.`);
    if (primary === apex) add('warn', `With DNS at GoDaddy, Netlify recommends ${www} as the primary domain: the root domain can't use Netlify's CDN routing. It works either way.`);
  }

  const issuers = caa.map((r) => r.issue ?? r.issuewild).filter((v) => v !== undefined);
  if (issuers.length && !issuers.some((v) => /letsencrypt\.org/i.test(v))) {
    add('fail', `CAA records allow only ${issuers.join(', ')} to issue certificates. Add one for letsencrypt.org, or Netlify can't issue the HTTPS certificate.`);
  } else if (issuers.length) add('pass', `CAA records allow Let's Encrypt (${issuers.join(', ')})`);
  return out;
}

export function evaluateCert(c, now = new Date()) {
  if (c.error) return { status: 'fail', text: `${c.host}: no HTTPS connection (${c.error}). Netlify issues the certificate once DNS points to it: Domain management → HTTPS.` };
  if (c.hostError) return { status: 'fail', text: `${c.host}: the certificate doesn't cover this name yet (it's for ${c.subject || 'another name'}). In Netlify: Domain management → HTTPS → Verify DNS configuration, then Provision certificate.` };
  if (!c.authorized) return { status: 'fail', text: `${c.host}: the certificate isn't trusted (${c.authError}).` };
  const days = Math.floor((c.validTo - now) / 86400000);
  if (days < 0) return { status: 'fail', text: `${c.host}: the certificate expired ${-days} days ago.` };
  const desc = `${c.host}: valid certificate from ${c.issuer || 'unknown issuer'}, ${c.protocol}, expires in ${days} days`;
  if (days < 14) return { status: 'warn', text: `${desc}. Netlify renews about 30 days before expiry, so renewal may be stuck: Domain management → HTTPS → Renew certificate.` };
  return { status: 'pass', text: `${desc} (renews automatically)` };
}

export function evaluateRedirect(from, hops, expected) {
  const last = hops[hops.length - 1];
  const steps = hops.map((h) => `${h.status}`).join(' → ');
  if (!last || last.error) return { status: 'fail', text: `${from}: ${last?.error || 'no response'}` };
  if (last.url !== expected || last.status !== 200) return { status: 'fail', text: `${from} ends at ${last.url} (${steps}), expected ${expected}` };
  if (hops.length === 1) return { status: 'pass', text: `${from} answers directly` };
  const temporary = hops.slice(0, -1).filter((h) => ![301, 308].includes(h.status));
  if (temporary.length) return { status: 'warn', text: `${from} → ${expected} uses a temporary redirect (${steps}); permanent (301) is better for search engines` };
  return { status: 'pass', text: `${from} → ${expected} (${steps})` };
}

// ---------- HTML helpers ----------

const decode = (s) => s.replace(/&amp;/g, '&').replace(/&#39;|&#x27;/g, "'").replace(/&quot;/g, '"');
const attr = (tag, name) => { const m = tag.match(new RegExp(`\\s${name}="([^"]*)"`, 'i')); return m ? decode(m[1]) : null; };
const tags = (html, name) => [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'gi'))].map((m) => m[0]);
const refsIn = (html) => [
  ...[...html.matchAll(/\s(?:href|src|poster|action)="([^"]+)"/g)].map((m) => decode(m[1])),
  ...[...html.matchAll(/\ssrcset="([^"]+)"/g)].flatMap((m) => decode(m[1]).split(',').map((s) => s.trim().split(/\s+/)[0])),
].filter((u) => u && !/^(mailto:|tel:|data:|javascript:|#$)/i.test(u));
const idsIn = (html) => new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));

// ---------- Network helpers ----------

async function get(url, opts = {}) {
  const t0 = Date.now();
  const res = await fetch(url, {
    method: opts.method || 'GET',
    redirect: opts.redirect || 'follow',
    headers: { 'user-agent': UA, 'accept-encoding': 'br, gzip', ...(opts.headers || {}) },
    body: opts.body,
    signal: AbortSignal.timeout(opts.timeout || TIMEOUT),
  });
  const text = opts.text ? await res.text() : (await res.arrayBuffer(), '');
  return { res, text, ms: Date.now() - t0 };
}

async function hops(url) {
  const out = [];
  let current = url;
  for (let i = 0; i < 6; i++) {
    try {
      const { res } = await get(current, { redirect: 'manual' });
      const loc = res.headers.get('location');
      out.push({ url: current, status: res.status, location: loc });
      if (res.status >= 300 && res.status < 400 && loc) { current = new URL(loc, current).href; continue; }
      return out;
    } catch (err) {
      out.push({ url: current, error: err.cause?.code || err.message });
      return out;
    }
  }
  return out;
}

function certificate(host) {
  return new Promise((resolve) => {
    const socket = tls.connect({ host, port: 443, servername: host, rejectUnauthorized: false, timeout: TIMEOUT }, () => {
      const cert = socket.getPeerCertificate();
      const hostErr = tls.checkServerIdentity(host, cert);
      resolve({
        host,
        authorized: socket.authorized,
        authError: socket.authorizationError,
        hostError: !!hostErr,
        subject: cert.subject?.CN,
        issuer: [cert.issuer?.O, cert.issuer?.CN].filter(Boolean).join(' '),
        validTo: new Date(cert.valid_to),
        protocol: socket.getProtocol(),
      });
      socket.end();
    });
    socket.on('timeout', () => { socket.destroy(); resolve({ host, error: 'timed out' }); });
    socket.on('error', (err) => resolve({ host, error: err.code || err.message }));
  });
}

async function lookup(kind, name) {
  const resolver = new dns.Resolver({ timeout: 5000, tries: 2 });
  resolver.setServers(['1.1.1.1', '8.8.8.8']);
  const empty = (e) => ['ENODATA', 'ENOTFOUND', 'ESERVFAIL', 'NOTFOUND'].includes(e.code);
  try { return await resolver[kind](name); } catch (e) {
    if (empty(e)) return [];
    try { return await dns[kind](name); } catch (e2) { if (empty(e2)) return []; throw e2; }
  }
}

async function pool(items, n, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) { const k = i++; out[k] = await fn(items[k], k); }
  }));
  return out;
}

// ---------- The check ----------

async function main() {
  const args = process.argv.slice(2);
  if (!args.length || args.includes('--help')) {
    console.log('Usage: node scripts/check-live.mjs https://www.example.com [--external] [--send-test-message] [--email=you@example.com] [--local]');
    process.exit(args.length ? 0 : 1);
  }
  const target = args.find((a) => !a.startsWith('--'));
  const flag = (f) => args.includes(f);
  const LOCAL = flag('--local');
  let start;
  try { start = new URL(target); } catch { console.error(`Not a web address: ${target}`); process.exit(1); }
  const origin = start.origin;
  const primary = start.hostname.toLowerCase();
  const onNetlifySubdomain = primary.endsWith('.netlify.app');
  const apex = primary.replace(/^www\./, '');
  const www = `www.${apex}`;
  const alias = primary === apex ? www : apex;
  const site = JSON.parse(readFileSync(join(ROOT, 'content/site.json'), 'utf8'));

  const groups = [];
  let group;
  const section = (name) => { group = { name, items: [] }; groups.push(group); };
  const report = (status, text) => group.items.push({ status, text });

  console.log(`Checking ${origin} …\n`);

  // Domain and DNS
  if (!LOCAL && !onNetlifySubdomain) {
    section('Domain and DNS');
    try {
      const [ns, apexA, apexAAAA, wwwCname, wwwA, caa] = await Promise.all([
        lookup('resolveNs', apex), lookup('resolve4', apex), lookup('resolve6', apex),
        lookup('resolveCname', www), lookup('resolve4', www), lookup('resolveCaa', apex),
      ]);
      evaluateDns({ apex, www, primary, ns, apexA, apexAAAA, wwwCname, wwwA, caa }).forEach((r) => report(r.status, r.text));
    } catch (err) {
      report('fail', `DNS lookups failed (${err.code || err.message}). Is this computer online?`);
    }
  }

  // HTTPS and redirects
  if (!LOCAL) {
    section('HTTPS and redirects');
    const hosts = onNetlifySubdomain ? [primary] : [primary, alias];
    for (const h of hosts) { const r = evaluateCert(await certificate(h)); report(r.status, r.text); }
    const home = `https://${primary}/`;
    const froms = onNetlifySubdomain ? [`http://${primary}/`] : [`http://${primary}/`, `http://${alias}/`, `https://${alias}/`];
    for (const f of froms) { const r = evaluateRedirect(f, await hops(f), home); report(r.status, r.text); }
  }

  // Home page and headers
  section('Security headers and speed');
  let homeHtml = '';
  try {
    const { res, text, ms } = await get(`${origin}/`, { text: true });
    homeHtml = text;
    const h = (n) => res.headers.get(n);
    if (!LOCAL) {
      if (/netlify/i.test(h('server') || '')) report('pass', 'Served by Netlify');
      else report('warn', `Server says "${h('server') || 'nothing'}", not Netlify. Is the domain pointing at the right host?`);
    }
    const want = {
      'strict-transport-security': (v) => /max-age=\d{7,}/.test(v),
      'x-content-type-options': (v) => v === 'nosniff',
      'x-frame-options': (v) => /sameorigin|deny/i.test(v),
      'referrer-policy': (v) => !!v,
      'permissions-policy': (v) => !!v,
    };
    // HSTS only means something over HTTPS, so a local preview skips it.
    const missing = Object.entries(want)
      .filter(([n]) => !(LOCAL && n === 'strict-transport-security'))
      .filter(([n, ok]) => !(h(n) && ok(h(n)))).map(([n]) => n);
    if (missing.length) report('fail', `Missing or weak security headers: ${missing.join(', ')}. They're set in netlify.toml.`);
    else report('pass', `Security headers present (${Object.keys(want).filter((n) => h(n)).join(', ')})`);
    if (/<meta http-equiv="Content-Security-Policy"/i.test(text)) report('pass', 'Content-Security-Policy set on the page');
    else report('fail', 'No Content-Security-Policy on the home page.');
    const enc = h('content-encoding');
    report(enc || LOCAL ? 'pass' : 'warn', `Home page: ${Math.round(text.length / 1024)} KB of HTML${enc ? `, sent ${enc}-compressed` : ''}, answered in ${ms} ms`);
  } catch (err) {
    report('fail', `The home page didn't load (${err.cause?.code || err.message}).`);
  }

  // Pages and links
  section('Pages and links');
  const pages = new Map(); // url -> { status, html, type }
  const resources = new Map(); // url (no hash) -> Set(pageUrl)
  const fragments = []; // { page, url, hash }
  const external = new Map(); // url -> Set(pageUrl)
  let sitemapUrls = [];
  try {
    const { res, text } = await get(`${origin}/sitemap.xml`, { text: true });
    if (res.ok) sitemapUrls = [...text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
  } catch { /* reported below */ }
  const queue = ['/', ...sitemapUrls.map((u) => { try { return new URL(u).pathname; } catch { return null; } }).filter(Boolean)];
  const seen = new Set();
  const isPagePath = (p) => !/\.[a-z0-9]{2,5}$/i.test(p) || p.endsWith('.html');
  while (queue.length && pages.size < 400) {
    const batch = [...new Set(queue.splice(0))].filter((p) => !seen.has(p));
    batch.forEach((p) => seen.add(p));
    await pool(batch, 8, async (path) => {
      const url = origin + path;
      try {
        const { res, text } = await get(url, { text: true });
        const type = res.headers.get('content-type') || '';
        pages.set(path, { status: res.status, html: type.includes('html') ? text : '', type, finalUrl: res.url });
        if (!type.includes('html') || res.status !== 200) return;
        for (const ref of refsIn(text)) {
          let u;
          try { u = new URL(ref, url); } catch { continue; }
          if (!/^https?:$/.test(u.protocol)) continue;
          if (u.origin !== origin) {
            if (![primary, alias].includes(u.hostname)) { if (!external.has(u.href)) external.set(u.href, new Set()); external.get(u.href).add(path); }
            else { if (!resources.has(u.origin + u.pathname)) resources.set(u.origin + u.pathname, new Set()); resources.get(u.origin + u.pathname).add(path); }
            continue;
          }
          if (u.hash && u.hash.length > 1) fragments.push({ page: path, path: u.pathname, hash: decodeURIComponent(u.hash.slice(1)) });
          if (isPagePath(u.pathname) && !u.pathname.startsWith('/admin')) { if (!seen.has(u.pathname)) queue.push(u.pathname); }
          else { const key = origin + u.pathname; if (!resources.has(key)) resources.set(key, new Set()); resources.get(key).add(path); }
        }
      } catch (err) {
        pages.set(path, { status: 0, error: err.cause?.code || err.message, html: '' });
      }
    });
  }

  const htmlPages = [...pages].filter(([, p]) => p.status === 200 && p.html);
  const badPages = [...pages].filter(([, p]) => p.status !== 200);
  if (badPages.length) badPages.forEach(([path, p]) => report('fail', `${path} → ${p.status || p.error}`));
  else report('pass', `All ${pages.size} pages load (HTTP 200)`);

  // Titles, descriptions, canonical links, mixed content
  const noTitle = [], noDesc = [], badCanon = [], mixed = [];
  for (const [path, p] of htmlPages) {
    const title = (p.html.match(/<title>([^<]*)<\/title>/i) || [])[1] || '';
    if (!title.trim()) noTitle.push(path);
    if (!/<meta name="description" content="[^"]{20,}"/i.test(p.html)) noDesc.push(path);
    const canon = tags(p.html, 'link').find((t) => /rel="canonical"/i.test(t));
    const href = canon ? attr(canon, 'href') : null;
    const isNoindex = /<meta name="robots" content="noindex"/i.test(p.html);
    if (!isNoindex) {
      const norm = (u) => u.replace(/\/+$/, '') || '/';
      if (!href) badCanon.push(`${path} (none)`);
      else if (norm(href) !== norm(origin + path) && !(path === '/' && norm(href) === norm(origin))) badCanon.push(`${path} → ${href}`);
    }
    const insecure = [...p.html.matchAll(/\s(?:src|srcset)="http:\/\/[^"]+"|<link[^>]+href="http:\/\/[^"]+"/g)].map((m) => m[0]);
    if (insecure.length && !LOCAL) mixed.push(`${path}: ${insecure[0].trim()}`);
  }
  report(noTitle.length ? 'fail' : 'pass', noTitle.length ? `Pages without a title: ${noTitle.join(', ')}` : 'Every page has a title');
  report(noDesc.length ? 'warn' : 'pass', noDesc.length ? `Pages without a description: ${noDesc.join(', ')}` : 'Every page has a description for search results');
  if (badCanon.length) report('fail', `Canonical links don't match this address on ${badCanon.length} page(s), e.g. ${badCanon.slice(0, 3).join('; ')}. If they show the netlify.app address, redeploy now that the domain is primary.`);
  else report('pass', 'Canonical links point to this address');
  report(mixed.length ? 'fail' : 'pass', mixed.length ? `Insecure (http://) files on HTTPS pages: ${mixed.slice(0, 3).join('; ')}` : 'No insecure (http://) files on any page');

  // Every file the pages use
  const resList = [...resources.keys()];
  const resResults = await pool(resList, 8, async (u) => {
    try {
      let { res } = await get(u, { method: 'HEAD' });
      if (res.status === 405 || res.status === 501) ({ res } = await get(u));
      return { u, status: res.status, type: res.headers.get('content-type') || '', length: Number(res.headers.get('content-length') || 0) };
    } catch (err) { return { u, status: 0, error: err.cause?.code || err.message }; }
  });
  const brokenRes = resResults.filter((r) => r.status !== 200);
  if (brokenRes.length) brokenRes.slice(0, 15).forEach((r) => report('fail', `${r.u.replace(origin, '')} → ${r.status || r.error} (linked from ${[...resources.get(r.u)].slice(0, 2).join(', ')})`));
  else report('pass', `All ${resList.length} images, styles, scripts, fonts and downloads load`);
  if (brokenRes.length > 15) report('fail', `…and ${brokenRes.length - 15} more broken files`);

  // In-page links (#section)
  const missingFrag = fragments.filter((f) => {
    const target = pages.get(f.path);
    if (!target || !target.html) return false; // reported as a broken page already
    return !/^page-\d+$/.test(f.hash) && !idsIn(target.html).has(f.hash);
  });
  const uniqFrag = [...new Map(missingFrag.map((f) => [`${f.path}#${f.hash}`, f])).values()];
  report(uniqFrag.length ? 'fail' : 'pass', uniqFrag.length ? `Links to missing sections: ${uniqFrag.slice(0, 5).map((f) => `${f.page} → ${f.path}#${f.hash}`).join('; ')}` : `All ${fragments.length} links to sections within pages land on their section`);

  // PDFs
  const pdfs = resResults.filter((r) => /\.pdf$/i.test(r.u));
  const badPdf = pdfs.filter((r) => r.status === 200 && !/application\/pdf/i.test(r.type));
  if (pdfs.length) report(badPdf.length ? 'fail' : 'pass', badPdf.length ? `PDFs served with the wrong type: ${badPdf.map((r) => r.u.replace(origin, '')).join(', ')}` : `${pdfs.length} PDFs download as PDF files`);

  // Site files: 404, robots, sitemap, feed, social image
  section('Search engines and sharing');
  try {
    const { res, text } = await get(`${origin}/this-page-does-not-exist-${Date.now()}`, { text: true });
    if (res.status === 404 && /<title>/i.test(text)) report('pass', 'Unknown addresses show the site\'s own 404 page, with status 404');
    else report('fail', `Unknown addresses return ${res.status}, expected 404.`);
  } catch (err) { report('fail', `404 check failed (${err.message})`); }
  try {
    const { res, text } = await get(`${origin}/robots.txt`, { text: true });
    const okSitemap = new RegExp(`Sitemap: ${origin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/sitemap\\.xml`).test(text);
    if (!res.ok) report('fail', `robots.txt → ${res.status}`);
    else if (!/Disallow: \/admin\//.test(text)) report('fail', 'robots.txt doesn\'t keep /admin/ out of search engines');
    else report(okSitemap ? 'pass' : 'fail', okSitemap ? 'robots.txt points search engines to the sitemap and keeps /admin/ out' : `robots.txt doesn't point to ${origin}/sitemap.xml. Redeploy after setting the primary domain.`);
  } catch (err) { report('fail', `robots.txt failed (${err.message})`); }
  if (sitemapUrls.length) {
    const offsite = sitemapUrls.filter((u) => !u.startsWith(`${origin}/`) && u !== origin);
    report(offsite.length ? 'fail' : 'pass', offsite.length ? `The sitemap lists ${offsite.length} address(es) on another domain, e.g. ${offsite[0]}. Redeploy now that the domain is primary.` : `The sitemap lists ${sitemapUrls.length} pages, all on ${primary}`);
  } else report('fail', 'No sitemap.xml. It is written when the build knows the site address.');
  try {
    const { res, text } = await get(`${origin}/blog/feed.xml`, { text: true });
    report(res.ok && /<rss/.test(text) ? 'pass' : 'warn', res.ok ? 'The blog\'s RSS feed is published' : `The blog's RSS feed returns ${res.status}`);
  } catch (err) { report('warn', `RSS feed check failed (${err.message})`); }
  const ogTag = tags(homeHtml, 'meta').find((t) => /property="og:image"/i.test(t));
  const og = ogTag ? attr(ogTag, 'content') : null;
  if (!og) report('fail', 'The home page has no social image (og:image), so LinkedIn previews show no picture.');
  else {
    try {
      const { res } = await get(og, { method: 'HEAD' });
      report(res.ok && /image\//.test(res.headers.get('content-type') || '') && og.startsWith(origin) ? 'pass' : 'fail', `Social image for link previews: ${og.replace(origin, '')} → ${res.status}${og.startsWith(origin) ? '' : ` (on another domain: ${og})`}`);
    } catch (err) { report('fail', `Social image ${og} failed (${err.message})`); }
  }
  try {
    const { res, text } = await get(`${origin}/build-info.json`, { text: true });
    if (res.ok) { const info = JSON.parse(text); report('info', `Deployed version built ${info.built}${info.commit ? ` from commit ${info.commit.slice(0, 7)}` : ''}`); }
  } catch { /* optional */ }

  // Google Analytics: one tag per page, with the ID from content/site.json
  section('Google Analytics');
  const gaWant = String(site.analytics?.ga4 || '');
  if (!gaWant) report('info', 'No Google Analytics ID in content/site.json.');
  else {
    const counts = htmlPages.map(([path, p]) => [path, (p.html.match(/googletagmanager\.com\/gtag\/js\?id=G-[A-Z0-9]+/g) || []).length, (p.html.match(/gtag\('config'/g) || []).length, (p.html.match(/gtag\/js\?id=(G-[A-Z0-9]+)/) || [])[1]]);
    const none = counts.filter(([, n]) => n === 0).map(([p]) => p);
    const extra = counts.filter(([, n, c]) => n > 1 || c > 1).map(([p]) => p);
    const wrong = counts.filter(([, n, , id]) => n && id !== gaWant).map(([p]) => p);
    if (none.length === counts.length) report(LOCAL ? 'info' : 'fail', `The Google tag (${gaWant}) isn't on the pages. It's only added in Netlify production builds${LOCAL ? '' : ': redeploy from Netlify'}.`);
    else if (none.length) report('fail', `The Google tag is missing on ${none.length} page(s): ${none.slice(0, 5).join(', ')}`);
    if (extra.length) report('fail', `The Google tag or its config appears more than once on: ${extra.slice(0, 5).join(', ')}. That would double-count page views.`);
    if (wrong.length) report('fail', `A different measurement ID is used on: ${wrong.slice(0, 5).join(', ')}`);
    if (!none.length && !extra.length && !wrong.length) report('pass', `The Google tag (${gaWant}) is on all ${counts.length} pages, once each`);
  }

  // Contact form
  section('Contact form');
  const contact = pages.get('/contact');
  const formTag = contact?.html ? tags(contact.html, 'form').find((t) => /name="enquiry"/.test(t)) : null;
  if (!formTag) report('fail', 'No contact form (name="enquiry") on /contact.');
  else {
    const formHtml = contact.html.slice(contact.html.indexOf(formTag), contact.html.indexOf('</form>', contact.html.indexOf(formTag)));
    const fields = [...new Set(tags(formHtml, '(?:input|select|textarea)').map((t) => attr(t, 'name')).filter(Boolean))];
    report('pass', `Form "enquiry" is on /contact with fields: ${fields.filter((f) => !['form-name', 'company_website', 'subject'].includes(f)).join(', ')}`);
    // Netlify's build strips these attributes from forms it has registered, so
    // finding them on the live page means form detection is off.
    if (/\sdata-netlify=|\snetlify-honeypot=|\snetlify(\s|>)/.test(formTag)) {
      if (LOCAL) report('info', 'Form not processed (expected on a local preview: Netlify registers the form when it deploys).');
      else report('fail', 'Netlify isn\'t handling the form yet: it was deployed without form detection. In Netlify: Forms → Enable form detection, then Deploys → Trigger deploy.');
    } else report('pass', 'Netlify has registered the form (its build step processed the form tag)');
    report(fields.includes('form-name') ? 'pass' : 'fail', fields.includes('form-name') ? 'The form identifies itself to Netlify (form-name)' : 'The form has no form-name field.');
    report(fields.includes('company_website') ? 'pass' : 'warn', fields.includes('company_website') ? 'Spam trap (hidden honeypot field) in place' : 'No honeypot field on the form.');
    report(fields.includes('email') ? 'pass' : 'warn', fields.includes('email') ? 'The visitor\'s email field is named "email", so pressing Reply in the notification email writes to them' : 'No field named "email": notification emails won\'t have a Reply-To.');
    const consulting = pages.get('/consulting');
    if (consulting?.html) report(/<form[^>]+name="enquiry"/.test(consulting.html) ? 'pass' : 'warn', /<form[^>]+name="enquiry"/.test(consulting.html) ? 'The Consulting page uses the same form' : 'No form on /consulting.');

    if (flag('--send-test-message')) {
      const email = (args.find((a) => a.startsWith('--email=')) || '').slice(8) || site.email;
      const options = [...formHtml.matchAll(/<option([^>]*)>([^<]*)<\/option>/g)].map((m) => attr(m[1], 'value') ?? decode(m[2]).trim()).filter(Boolean);
      const topic = options.find((o) => /something else/i.test(o)) || options.at(-1) || '';
      const values = {
        'form-name': 'enquiry',
        subject: `Website enquiry · Test: live site check`,
        name: 'Live site check',
        email,
        topic,
        message: `Test message sent by scripts/check-live.mjs on ${new Date().toISOString()} to confirm the contact form works after deployment. No reply needed.`,
        company_website: '',
      };
      const body = new URLSearchParams(Object.fromEntries(fields.map((f) => [f, values[f] ?? ''])));
      try {
        const { res } = await get(`${origin}/`, { method: 'POST', redirect: 'manual', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: body.toString() });
        if (res.status === 200 || res.status === 303 || res.status === 302) report('pass', `Test message accepted by Netlify (HTTP ${res.status}). Check Forms → enquiry in Netlify, and the inbox set up for notifications (from formresponses@netlify.com; look in Spam the first time).`);
        else if (res.status === 404) report('fail', 'Netlify answered 404 to the test message: the form isn\'t registered. Enable form detection and redeploy.');
        else report('fail', `Test message answered HTTP ${res.status}.`);
      } catch (err) { report('fail', `Test message failed (${err.message})`); }
    } else report('info', 'No test message sent. Add --send-test-message to send one and check it reaches your inbox.');
  }

  // Content manager
  section('Content manager (/admin)');
  try {
    const { res, text } = await get(`${origin}/admin/`, { text: true });
    if (!res.ok) report('fail', `/admin/ → ${res.status}`);
    else {
      report(/decap-cms@[\d.]+\/dist\/decap-cms\.js/.test(text) ? 'pass' : 'fail', 'The editor page loads at /admin/');
      const robots = res.headers.get('x-robots-tag') || '';
      if (!LOCAL) report(/noindex/i.test(robots) ? 'pass' : 'warn', /noindex/i.test(robots) ? 'Kept out of search engines' : '/admin/ has no X-Robots-Tag: noindex header.');
      const cfg = await get(`${origin}/admin/config.yml`, { text: true });
      const repo = (cfg.text.match(/^\s*repo:\s*"?([^"\n]+)"?/m) || [])[1] || '';
      if (!cfg.res.ok) report('fail', `/admin/config.yml → ${cfg.res.status}`);
      else if (!repo || repo === 'OWNER/REPOSITORY') report('fail', 'The editor doesn\'t know the GitHub repository. Deploy from GitHub, or set cms.repo in content/site.json.');
      else report('pass', `The editor saves to the GitHub repository ${repo}. Signing in needs the GitHub OAuth app (docs/CONTENT-MANAGER.md); test it by logging in.`);
    }
  } catch (err) { report('fail', `/admin/ failed (${err.message})`); }

  // Other websites
  if (flag('--external')) {
    section('Links to other websites');
    const list = [...external.keys()].filter((u) => !/fonts\.(googleapis|gstatic)\.com/.test(u));
    const results = await pool(list, 6, async (u) => {
      try {
        let { res } = await get(u, { method: 'HEAD', timeout: 15000 });
        if (res.status >= 400) ({ res } = await get(u, { timeout: 15000 }));
        return { u, status: res.status };
      } catch (err) { return { u, status: 0, error: err.cause?.code || err.name }; }
    });
    const ok = results.filter((r) => r.status >= 200 && r.status < 400);
    const blocked = results.filter((r) => [401, 403, 429, 999].includes(r.status));
    const broken = results.filter((r) => [404, 410].includes(r.status) || (r.error && /ENOTFOUND/.test(r.error)));
    const flaky = results.filter((r) => !ok.includes(r) && !blocked.includes(r) && !broken.includes(r));
    report('pass', `${ok.length} of ${list.length} links to other websites open`);
    if (blocked.length) report('info', `${blocked.length} site(s) refuse automated checks (LinkedIn, ResearchGate and similar), so open these by hand: ${[...new Set(blocked.map((r) => new URL(r.u).hostname))].join(', ')}`);
    broken.slice(0, 25).forEach((r) => report('fail', `Broken link: ${r.u} → ${r.status || r.error} (on ${[...external.get(r.u)].slice(0, 2).join(', ')})`));
    if (broken.length > 25) report('fail', `…and ${broken.length - 25} more broken links`);
    flaky.slice(0, 15).forEach((r) => report('warn', `No clear answer from ${r.u} (${r.status || r.error}); try it by hand`));
    if (flaky.length > 15) report('warn', `…and ${flaky.length - 15} more without a clear answer`);
  }

  // Print
  const icon = { pass: '✓', warn: '!', fail: '✗', info: '·' };
  const counts = { pass: 0, warn: 0, fail: 0, info: 0 };
  for (const g of groups) {
    if (!g.items.length) continue;
    console.log(g.name);
    for (const it of g.items) { counts[it.status]++; console.log(`  ${icon[it.status]} ${it.text}`); }
    console.log('');
  }
  console.log(`${counts.pass} passed, ${counts.warn} warning${counts.warn === 1 ? '' : 's'}, ${counts.fail} failed.`);
  if (process.env.GITHUB_STEP_SUMMARY) {
    const md = [`## Live site check: ${origin}`, '', ...groups.filter((g) => g.items.length).flatMap((g) => [`### ${g.name}`, '', ...g.items.map((it) => `- ${{ pass: '✅', warn: '⚠️', fail: '❌', info: 'ℹ️' }[it.status]} ${it.text}`), '']), `**${counts.pass} passed, ${counts.warn} warnings, ${counts.fail} failed.**`, ''];
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, md.join('\n'));
  }
  process.exit(counts.fail ? 1 : 0);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
