// Netlify runs this before every build (netlify.toml → [build] ignore) and
// skips the build when the change can't alter the live site. On Netlify's
// credit-based plans each production deploy uses 15 credits, so this keeps
// saves that nobody can see from using them:
//   - saving or deleting a draft blog post, or a post scheduled for a later
//     date (it goes live through the daily check, .github/workflows/daily-rebuild.yml),
//   - changes to docs/, README.md or .github/ only.
// Anything else builds as normal. Builds started by a build hook always run
// (Netlify ignores this command for them), and so does a redeploy of the same
// commit, the first build, and any case where the change can't be worked out.
//
// Exit code 0 = skip this build, 1 = build.

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { splitFrontMatter } from '../src/lib/frontmatter.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const build = (why) => { console.log(`Building: ${why}.`); process.exit(1); };
const skip = (why) => { console.log(`Skipping this build: ${why}.`); process.exit(0); };

const from = process.env.CACHED_COMMIT_REF;
const to = process.env.COMMIT_REF;
if (!from || !to || from === to) build('first build or a redeploy');

let files;
try {
  files = execFileSync('git', ['diff', '--name-only', from, to], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).split('\n').filter(Boolean);
} catch {
  build("couldn't compare with the last build");
}
if (!files.length) build('no file changes found');

let tz = 'UTC';
try { tz = JSON.parse(readFileSync(join(ROOT, 'content/site.json'), 'utf8')).tz || 'UTC'; } catch { /* default */ }
const today = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

const at = (ref, file) => {
  try { return execFileSync('git', ['show', `${ref}:${file}`], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); } catch { return null; }
};
// A post is off the site when it doesn't exist, is a draft, or is dated later than today.
const offSite = (text) => {
  if (text === null) return true;
  try {
    const { data } = splitFrontMatter(text, 'post');
    const status = String(data.status ?? (data.draft === true ? 'draft' : 'published')).toLowerCase();
    const date = (String(data.date ?? '').match(/^\d{4}-\d{2}-\d{2}/) || [''])[0];
    return status === 'draft' || (date && date > today);
  } catch {
    return false;
  }
};

const invisible = (file) => {
  if (/^(docs\/|\.github\/)/.test(file) || file === 'README.md') return true;
  if (/^content\/blog\/[^/]+\.(md|markdown)$/i.test(file)) return offSite(at(from, file)) && offSite(at(to, file));
  return false;
};

if (files.every(invisible)) skip(`only ${files.join(', ')} changed, which doesn't show on the site`);
build(`${files.length} changed file${files.length === 1 ? '' : 's'}`);
