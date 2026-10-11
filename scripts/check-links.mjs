// Checks every internal link, image, script, stylesheet and media reference in
// a built site, plus in-page #anchors. External links are listed, not fetched.
//   node scripts/check-links.mjs dist
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';

const root = resolve(process.argv[2] || 'dist');
const files = [];
const walk = (d) => readdirSync(d).forEach((f) => {
  const p = join(d, f);
  if (statSync(p).isDirectory()) walk(p); else if (p.endsWith('.html')) files.push(p);
});
walk(root);

const resolveTarget = (fromFile, url) => {
  const clean = url.split('#')[0].split('?')[0];
  let p = clean.startsWith('/') ? join(root, clean) : resolve(dirname(fromFile), clean || relative(dirname(fromFile), fromFile));
  if (clean === '' ) return fromFile;
  const candidates = [p, `${p}.html`, join(p, 'index.html')];
  return candidates.find((c) => existsSync(c) && statSync(c).isFile()) || null;
};
const idsIn = (file) => new Set([...readFileSync(file, 'utf8').matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));

let problems = 0;
const external = new Set();
for (const file of files) {
  const html = readFileSync(file, 'utf8');
  const refs = [...html.matchAll(/\s(?:href|src|poster|action)="([^"]+)"/g)].map((m) => m[1]);
  const srcsets = [...html.matchAll(/\ssrcset="([^"]+)"/g)].flatMap((m) => m[1].split(',').map((s) => s.trim().split(/\s+/)[0]));
  for (const url of [...refs, ...srcsets]) {
    if (/^(https?:)?\/\//.test(url)) { external.add(url); continue; }
    if (/^(mailto:|tel:|data:|javascript:)/.test(url)) continue;
    if (url === '/thanks' && file.endsWith('.html')) { if (!existsSync(join(root, 'thanks.html'))) { problems++; console.log(`✗ ${relative(root, file)} -> ${url}`); } continue; }
    const target = resolveTarget(file, url);
    if (!target) { problems++; console.log(`✗ ${relative(root, file)} -> ${url}`); continue; }
    const hash = url.includes('#') ? url.split('#')[1] : '';
    if (hash && target.endsWith('.html') && !/^page-\d+$/.test(hash) && !idsIn(target).has(decodeURIComponent(hash))) {
      problems++; console.log(`✗ ${relative(root, file)} -> ${url} (no #${hash})`);
    }
  }
}
console.log(`\nChecked ${files.length} pages. ${problems ? `${problems} broken reference(s).` : 'No broken internal references.'}`);
console.log(`External links (${external.size}):\n  ${[...external].sort().join('\n  ')}`);
process.exit(problems ? 1 : 0);
