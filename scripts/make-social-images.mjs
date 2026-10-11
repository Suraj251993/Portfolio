// Generates Open Graph images (1200×630) and PNG favicons with Playwright,
// using the site's own fonts and content.
//   node scripts/make-social-images.mjs
import { readFileSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
let playwright;
try { playwright = require('playwright'); } catch { playwright = createRequire('/opt/npm-tools/node_modules/')('playwright'); }

const ROOT = resolve('.');
const pub = (p) => pathToFileURL(join(ROOT, 'public', p)).href;
const json = (p) => JSON.parse(readFileSync(join(ROOT, 'content', p), 'utf8'));
const site = json('site.json');
const { articles, layers } = json('articles.json');
const ed = json('magazine.json').editions[0];
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const base = `
@font-face{font-family:"Newsreader";src:url("${pub('fonts/newsreader-roman.woff2')}") format("woff2");font-weight:300 700}
@font-face{font-family:"Newsreader";font-style:italic;src:url("${pub('fonts/newsreader-italic.woff2')}") format("woff2");font-weight:300 700}
@font-face{font-family:"Schibsted Grotesk";src:url("${pub('fonts/schibsted-grotesk.woff2')}") format("woff2");font-weight:400 700}
@font-face{font-family:"JetBrains Mono";src:url("${pub('fonts/jetbrains-mono.woff2')}") format("woff2");font-weight:400 600}
*{box-sizing:border-box;margin:0}
html,body{width:1200px;height:630px;overflow:hidden}
body{background:radial-gradient(ellipse 70% 80% at 74% 34%,#b65326 0%,rgba(182,83,38,0) 70%),linear-gradient(180deg,#a4471f 0%,#a4471f 62%,#86391a 100%);color:#fff5ee;font-family:"Schibsted Grotesk",sans-serif;-webkit-font-smoothing:antialiased}
.frame{position:absolute;inset:0;padding:64px 72px;display:flex;flex-direction:column}
.serif{font-family:"Newsreader",serif;font-optical-sizing:auto}
.muted{color:#f7d9c8}
.mono{font-family:"JetBrains Mono",monospace;font-size:18px;letter-spacing:.16em;text-transform:uppercase}
.accent{color:#ffd2bb}
.rule{height:1px;background:rgba(163,179,206,.25);position:relative}
.rule::before{content:"";position:absolute;left:0;top:0;width:56px;height:1px;background:#7fb0ff}
.foot{margin-top:auto;display:flex;justify-content:space-between;align-items:flex-end;font-size:22px}
.foot b{font-family:"Newsreader",serif;font-weight:400;font-size:30px;color:#fff5ee}
`;

const defaultCard = () => `<style>${base}
.name{font-size:132px;line-height:.9;letter-spacing:-.035em;font-weight:350;font-variation-settings:"opsz" 72;white-space:nowrap}
.tag{margin-top:26px;font-family:"Newsreader",serif;font-size:46px;line-height:1.12;letter-spacing:-.02em;font-weight:350;max-width:620px}
.tag em{color:#ffd2bb}
.pillars{display:flex;gap:28px;margin-top:44px;font-size:34px;letter-spacing:-.01em}
.photo{position:absolute;right:28px;bottom:0;width:440px;height:440px;overflow:hidden;isolation:isolate}
.photo::before{content:"";position:absolute;left:2.4%;top:35%;width:95.3%;aspect-ratio:1;border-radius:50%;background:#efe8d7;z-index:-1}
.photo img{display:block;width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 14px 18px rgba(40,18,8,.22))}
</style><div class="frame">
  <div class="mono muted" style="margin-bottom:22px;font-size:15px">// Product manager · AI platform builder · B2B SaaS · Researcher</div>
  <div class="serif name">Suraj Prakash</div>
  <div class="tag">Building <em>intelligent</em> products, and the research behind them.</div>
  <div class="foot"><span class="mono muted" style="font-size:16px">${esc(site.location)} · 6 years in AdTech &amp; B2B SaaS</span></div>
</div>
<div class="photo"><img src="${pub('images/suraj-prakash-cutout-960.webp')}"></div>`;

const magCard = () => `<style>${base}
body{background:#1c1916;color:#f2ede7}
.muted{color:#a69c92}
.t{font-size:96px;line-height:.95;letter-spacing:-.03em;font-weight:350;max-width:640px}
.ed{margin-top:22px;font-size:24px;max-width:600px}
.line{margin-top:34px;font-size:40px;line-height:1.18;max-width:600px;letter-spacing:-.01em}
.cover{position:absolute;right:88px;top:40px;width:367px;height:550px;box-shadow:0 30px 60px -20px rgba(0,0,0,.7)}
.cover img{width:100%;height:100%;object-fit:cover;border-radius:2px}
</style><div class="frame">
  <div class="serif t">Media Intelligence</div>
  <div class="ed"><b>Edition ${ed.number}: ${esc(ed.name)}</b> <span class="muted">· ${esc(ed.date)} · ${ed.pages} pages</span></div>
  <div class="serif line">${esc(ed.coverLine)}</div>
  <div class="foot"><b>${esc(site.name)}</b></div>
</div>
<div class="cover"><img src="${pub('images/media-intelligence-01-cover.jpg')}"></div>`;

const paperCard = (a) => {
  const layer = layers.find((l) => l.id === a.layer);
  const long = a.title.length > 48;
  return `<style>${base}
body{background:#f4f2ee;color:#1d1916}
.muted{color:#635b54}
.accent{color:#a84a37}
.foot b{color:#1d1916}
.k{font-family:"JetBrains Mono",monospace;font-size:17px;letter-spacing:.16em;text-transform:uppercase;font-weight:500}
.t{margin-top:26px;font-size:${long ? 64 : 76}px;line-height:1.02;letter-spacing:-.025em;font-weight:400;max-width:700px}
.s{margin-top:22px;font-size:28px;line-height:1.3;font-style:italic;max-width:760px}
.fig{position:absolute;right:72px;top:64px;width:300px;text-align:right}
.fig b{display:block;white-space:nowrap;font-family:"Newsreader",serif;font-weight:500;font-size:${a.figure.value.length > 9 ? 50 : a.figure.value.length > 5 ? 64 : 84}px;line-height:1;letter-spacing:-.03em;color:#a84a37}
.fig span{display:block;margin-top:14px;font-size:20px;line-height:1.35;color:#635b54}
</style><div class="frame">
  <div class="k accent">// Research · ${esc(layer.name)}${a.region ? ` · ${esc(a.region)}` : ''}</div>
  <div class="serif t">${esc(a.title)}</div>
  <div class="serif s muted">${esc(a.subtitle)}</div>
  <div class="foot"><b>${esc(site.name)}</b><span class="muted">${a.pages ? `${a.pages}-page paper` : 'Summary'} · 2026</span></div>
</div>
<div class="fig"><b>${esc(a.figure.value)}</b><span>${esc(a.figure.label)}</span></div>`;
};

const iconCard = (size) => `<style>${base}
html,body{width:${size}px;height:${size}px;background:#a4471f}
.m{position:absolute;inset:0;display:grid;place-items:center;font-family:"Newsreader",serif;font-weight:500;font-size:${Math.round(size * 0.52)}px;letter-spacing:-.04em;color:#fff5ee;padding-bottom:${Math.round(size * 0.06)}px}
.b{position:absolute;left:28%;right:28%;bottom:${Math.round(size * 0.16)}px;height:${Math.max(1, Math.round(size * 0.035))}px;background:#ffd2bb}
</style><div class="m">SP</div><div class="b"></div>`;

const browser = await playwright.chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
const shoot = async (html, out, size) => {
  if (size) await page.setViewportSize({ width: size, height: size });
  else await page.setViewportSize({ width: 1200, height: 630 });
  // Load from a file:// URL so the local fonts and images resolve.
  const tmp = join(tmpdir(), `og-${Date.now()}.html`);
  writeFileSync(tmp, `<!doctype html><html><head><meta charset="utf-8"></head><body>${html}</body></html>`);
  await page.goto(pathToFileURL(tmp).href, { waitUntil: 'load' });
  rmSync(tmp);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(ROOT, 'public', out), ...(out.endsWith('.jpg') ? { type: 'jpeg', quality: 86 } : { type: 'png' }) });
  console.log('  ', out);
};

mkdirSync(join(ROOT, 'public/og/papers'), { recursive: true });
await shoot(defaultCard(), 'og/default.jpg');
await shoot(magCard(), 'og/magazine.jpg');
for (const a of articles) await shoot(paperCard(a), `og/papers/${a.slug}.jpg`);
await shoot(iconCard(180), 'apple-touch-icon.png', 180);
await shoot(iconCard(32), 'favicon-32.png', 32);
await browser.close();
