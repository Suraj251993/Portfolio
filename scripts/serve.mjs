// Minimal static server for local preview. Mirrors how Netlify, Vercel and
// Cloudflare Pages resolve clean URLs: /about serves about.html.
//   node scripts/serve.mjs dist [port]
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';

const root = resolve(process.argv[2] || 'dist');
const port = Number(process.argv[3] || process.env.PORT || 4321);
const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp',
  '.woff2': 'font/woff2', '.yml': 'text/yaml; charset=utf-8', '.pdf': 'application/pdf', '.mp4': 'video/mp4', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8',
};
// The production Content-Security-Policy is a meta tag in each built page, so
// this preview applies it automatically.
const csp = null;
const exists = async (p) => { try { return (await stat(p)).isFile(); } catch { return false; } };

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  let path = decodeURIComponent(url.pathname);
  if (req.method === 'POST') { res.writeHead(405).end('Method not allowed'); return; }
  const base = normalize(join(root, path));
  if (!base.startsWith(root)) { res.writeHead(403).end(); return; }
  const candidates = path.endsWith('/') ? [join(base, 'index.html')] : [base, `${base}.html`, join(base, 'index.html')];
  for (const file of candidates) {
    if (await exists(file)) {
      const body = await readFile(file);
      res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache', ...(csp ? { 'Content-Security-Policy': csp } : {}) });
      res.end(body);
      return;
    }
  }
  const notFound = join(root, '404.html');
  res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end((await exists(notFound)) ? await readFile(notFound) : 'Not found');
}).listen(port, () => console.log(`Serving ${root} at http://localhost:${port}`));
