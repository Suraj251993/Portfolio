// Per-page context: knows where the page lives so every link and asset path
// can be written relative to it. Relative URLs keep the site portable: it works
// at a domain root, in a sub-folder, from a local preview server and inside a
// claude.ai artifact.
//
// mode "prod":      clean links ("about", "papers/x"), served as about.html etc.
//                   by Netlify, Vercel, Cloudflare Pages and GitHub Pages.
// mode "artifact":  explicit ".html" links, Google Fonts, no form backend.

export function makeCtx({ mode, outPath, site, siteUrl, data, rootRelative = false }) {
  const depth = outPath.split('/').length - 1;
  const rel = rootRelative ? '/' : depth ? '../'.repeat(depth) : '';

  const href = (target = '') => {
    const [path, hash] = String(target).split('#');
    let url;
    if (path === '' || path === 'index') {
      url = mode === 'artifact' ? `${rel}index.html` : rel || './';
    } else {
      url = `${rel}${path}${mode === 'artifact' ? '.html' : ''}`;
    }
    return hash ? `${url}#${hash}` : url;
  };

  const asset = (p) => `${rel}${p}`;

  const base = siteUrl ? siteUrl.replace(/\/+$/, '') : '';
  const absolute = (target = '') => (base ? `${base}/${target}` : '');

  return { mode, outPath, rel, href, asset, absolute, site, siteUrl: base, data };
}
