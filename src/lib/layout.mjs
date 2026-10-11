import { createHash } from 'node:crypto';
import { html, raw, esc, toString } from './html.mjs';
import { icon } from './components.mjs';

// The one inline script on every page, allowed by its hash in the security policy.
const JS_FLAG = "document.documentElement.classList.add('js')";
const JS_FLAG_HASH = `sha256-${createHash('sha256').update(JS_FLAG).digest('base64')}`;

// Content-Security-Policy, set per page so the content manager at /admin can
// have its own. (frame-ancestors can't go in a meta tag; X-Frame-Options in
// netlify.toml and vercel.json covers framing.)
export function contentSecurityPolicy(site) {
  const formspree = site.contactForm?.provider === 'formspree' ? ' https://formspree.io' : '';
  return [
    "default-src 'self'",
    `script-src 'self' '${JS_FLAG_HASH}'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    "media-src 'self'",
    `connect-src 'self'${formspree}`,
    `form-action 'self' mailto:${formspree}`,
    "base-uri 'self'",
    "object-src 'none'",
  ].join('; ');
}

const GOOGLE_FONTS =
  'https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,300..700;1,6..72,300..700&family=Schibsted+Grotesk:wght@400..700&family=JetBrains+Mono:wght@400..600&display=swap';

const fontFaces = (ctx) => `
@font-face{font-family:"Newsreader";src:url("${ctx.asset('fonts/newsreader-roman.woff2')}") format("woff2");font-weight:300 700;font-style:normal;font-display:swap}
@font-face{font-family:"Newsreader";src:url("${ctx.asset('fonts/newsreader-italic.woff2')}") format("woff2");font-weight:300 700;font-style:italic;font-display:swap}
@font-face{font-family:"Schibsted Grotesk";src:url("${ctx.asset('fonts/schibsted-grotesk.woff2')}") format("woff2");font-weight:400 700;font-style:normal;font-display:swap}
@font-face{font-family:"JetBrains Mono";src:url("${ctx.asset('fonts/jetbrains-mono.woff2')}") format("woff2");font-weight:400 600;font-style:normal;font-display:swap}`;

function head(ctx, page) {
  const { site } = ctx;
  const title = page.docTitle || (page.title ? `${page.title} | ${site.name}` : `${site.name}: product manager, AI platform builder and AdTech researcher`);
  const description = page.description || site.description;
  const canonical = ctx.absolute(page.canonical ?? '');
  const ogImage = ctx.siteUrl ? ctx.absolute(page.ogImage || 'og/default.jpg') : '';
  const jsonLd = (page.jsonLd || []).map((obj) => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`).join('\n');

  const fonts = ctx.mode === 'artifact'
    ? html`<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${GOOGLE_FONTS}">`
    : html`<link rel="preload" href="${ctx.asset('fonts/newsreader-roman.woff2')}" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${ctx.asset('fonts/schibsted-grotesk.woff2')}" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${ctx.asset('fonts/jetbrains-mono.woff2')}" as="font" type="font/woff2" crossorigin>
<style>${raw(fontFaces(ctx))}</style>`;

  const csp = ctx.mode === 'prod' ? html`<meta http-equiv="Content-Security-Policy" content="${contentSecurityPolicy(site)}">
` : '';
  return html`${csp}<title>${title}</title>
<meta name="description" content="${description}">
${canonical ? html`<link rel="canonical" href="${canonical}">` : ''}
${page.noindex ? html`<meta name="robots" content="noindex">` : ''}
<meta name="author" content="${site.name}">
<meta name="theme-color" content="${site.themeColor}">
<meta property="og:type" content="${page.ogType || 'website'}">
<meta property="og:site_name" content="${site.name}">
<meta property="og:title" content="${page.ogTitle || page.title || site.name}">
<meta property="og:description" content="${description}">
<meta property="og:locale" content="${site.locale}">
${canonical ? html`<meta property="og:url" content="${canonical}">` : ''}
${ogImage ? html`<meta property="og:image" content="${ogImage}">
${!page.ogImage || page.ogImage.startsWith('og/') ? html`<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">` : ''}
<meta property="og:image:alt" content="${page.ogAlt || `${site.name}: ${page.title || 'product manager and AdTech researcher'}`}">` : ''}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${page.ogTitle || page.title || site.name}">
<meta name="twitter:description" content="${description}">
${ogImage ? html`<meta name="twitter:image" content="${ogImage}">` : ''}
<link rel="icon" href="${ctx.asset('favicon.svg')}" type="image/svg+xml">
<link rel="icon" href="${ctx.asset('favicon-32.png')}" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="${ctx.asset('apple-touch-icon.png')}">
${fonts}
<link rel="stylesheet" href="${ctx.asset('assets/css/site.css')}">
${page.feed ? html`<link rel="alternate" type="application/rss+xml" title="${site.name}: Blog" href="${page.feed}">` : ''}
<script>${raw(JS_FLAG)}</script>
${raw(jsonLd)}`;
}

export function siteHeader(ctx, current) {
  const { site } = ctx;
  return html`<header class="site-header" data-header>
  <div class="wrap site-header__inner">
    <a class="wordmark" href="${ctx.href('')}"${current === 'home' ? raw(' aria-current="page"') : ''}>${site.name}</a>
    <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="site-nav"><span class="menu-toggle__bars" aria-hidden="true"></span><span class="menu-toggle__label">Menu</span></button>
    <nav class="site-nav" id="site-nav" aria-label="Main">
      <ul class="site-nav__list" role="list">
        ${site.nav.map((item) => html`<li><a href="${ctx.href(item.href)}"${item.href === current ? raw(' aria-current="page"') : ''}>${item.label}</a></li>`)}
      </ul>
      <a class="site-nav__contact" href="${ctx.href('contact')}"${current === 'contact' ? raw(' aria-current="page"') : ''}>Contact</a>
    </nav>
  </div>
</header>`;
}

export function siteFooter(ctx) {
  const { site } = ctx;
  const year = new Date().getFullYear();
  return html`<footer class="site-footer">
  <div class="wrap">
    <div class="site-footer__grid">
      <div class="site-footer__id">
        <a class="wordmark" href="${ctx.href('')}">${site.name}</a>
        <p>Product manager, AI platform builder and AdTech and MarTech researcher. Editor of Media Intelligence. Based in ${site.location}.</p>
      </div>
      <nav class="site-footer__nav" aria-label="Footer">
        <h2>Pages</h2>
        <ul role="list">
          ${site.nav.map((item) => html`<li><a href="${ctx.href(item.href)}">${item.label}</a></li>`)}
          <li><a href="${ctx.href('contact')}">Contact</a></li>
        </ul>
      </nav>
      <div class="site-footer__contact">
        <h2>Get in touch</h2>
        <ul role="list">
          <li><a href="mailto:${site.email}">${site.email}</a></li>
          <li><a href="${site.linkedin}" rel="me noopener" target="_blank">LinkedIn</a></li>
          ${site.researchgate ? html`<li><a href="${site.researchgate}" rel="me noopener" target="_blank">ResearchGate</a></li>` : ''}
          <li>${site.location}</li>
        </ul>
      </div>
    </div>
    <div class="site-footer__base">
      <span>© ${year} ${site.name}</span>
      <span>No cookies, no tracking.</span>
    </div>
  </div>
</footer>`;
}

// Builds a complete page. In artifact mode the home page is emitted without
// its own <html>/<head>/<body> wrapper, because the artifact host adds one.
export function documentFor(ctx, page) {
  const headHtml = toString(head(ctx, page));
  const bodyHtml = toString(html`<a class="skip-link" href="#main">Skip to content</a>
<div class="page page--${page.id}">
${siteHeader(ctx, page.current)}
<main id="main" tabindex="-1">
${page.body}
</main>
${siteFooter(ctx)}
</div>
<script src="${ctx.asset('assets/js/site.js')}" defer></script>
${(page.scripts || []).map((s) => html`<script src="${ctx.asset(s)}" defer></script>`)}`);

  if (ctx.mode === 'artifact' && ctx.outPath === 'index.html') {
    return `${headHtml}\n${bodyHtml}\n`;
  }
  return `<!doctype html>
<html lang="${esc(ctx.site.language)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
${headHtml}
</head>
<body>
${bodyHtml}
</body>
</html>
`;
}

export { icon };
