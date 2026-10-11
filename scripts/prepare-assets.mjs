// One-off asset preparation. Turns the original source files (PDFs, cover image,
// portrait) into optimised web assets under public/.
//
// Usage:  node scripts/prepare-assets.mjs --src /path/to/originals
//
// Needs (dev machine only, not needed for `npm run build`):
//   - poppler-utils (pdftoppm) and ffmpeg on PATH
//   - the `sharp` npm package (npm i -D sharp)
//
// The outputs are committed to the repo, so you only re-run this when a source
// file changes or a new paper / magazine edition is added.

import { execFileSync } from 'node:child_process';
import { mkdirSync, copyFileSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';

const require = createRequire(import.meta.url);
let sharp;
try { sharp = require('sharp'); } catch {
  sharp = createRequire('/opt/npm-tools/node_modules/')('sharp');
}

const arg = (name, fallback) => {
  const i = process.argv.indexOf(name);
  return i > -1 ? process.argv[i + 1] : fallback;
};
const SRC = resolve(arg('--src', './originals'));
const OUT = resolve('public');
const tmp = join(tmpdir(), 'sp-assets');
mkdirSync(tmp, { recursive: true });

// Paper slug -> original PDF file name. Keep in sync with content/articles.json.
const PAPERS = {
  'screens-to-intelligence': 'Screens_to_Intelligence_Suraj_Prakash.pdf',
  'repositioning-of-the-dsp': 'Death_of_the_DSP_Suraj_Prakash.pdf',
  'buyer-direct-supply-path': 'Buyer_Direct_Supply_Path_Optimization_Suraj_Prakash.pdf',
  'outcome-exchange-ooh': 'FromMediaBuyingtoOutcomeEngineeringAProposedOutcomeExchangeforOut-of-HomeAdvertising.pdf',
  'hidden-data-infrastructure-ooh': 'Third_Party_Data_OOH_DOOH_Suraj_Prakash.pdf',
  'data-behind-the-billboard-us': 'US_OOH_DOOH_Data_Ecosystem_Suraj_Prakash.pdf',
  'data-behind-the-billboard-europe': 'Europe_OOH_DOOH_Data_Ecosystem_Suraj_Prakash.pdf',
  'data-behind-the-billboard-apac': 'APAC_OOH_DOOH_Data_Ecosystem_Suraj_Prakash.pdf',
  'exposure-to-impact-brand-lift': 'From_Exposure_to_Impact_Brand_Lift_AdTech_MarTech_OOH_DOOH_Suraj_Prakash.pdf',
  'brand-lift-to-incremental-impact': 'From_Brand_Lift_to_Incremental_Impact_OOH_Suraj_Prakash.pdf',
  'ooh-retail-media-convergence': 'OOH_Retail_Media_Convergence_Suraj_Prakash.pdf',
  'feed-to-street-tiktok-dooh': 'From_Feed_to_Street_TikTok_DOOH_Suraj_Prakash.pdf',
  'rabbit-ai-race-adtech': 'Rabbit_Turtle_AI_Race_AdTech_Suraj_Prakash.pdf',
};
const MAGAZINE = 'The_Intelligence_Layer_Edition_01_2026_Suraj_Prakash.pdf';
const COVER = 'Media_Intelligence_Edition_01_Cover.png';
// Set to false to show the PDF's own first page in the web reader instead.
const USE_IMAGE_COVER_IN_READER = true;

const run = (cmd, args) => execFileSync(cmd, args, { stdio: ['ignore', 'ignore', 'inherit'] });
const src = (f) => {
  const p = join(SRC, f);
  if (!existsSync(p)) throw new Error(`Missing source file: ${p}`);
  return p;
};
const step = (label) => console.log(`\n▸ ${label}`);

// 1. Research papers: copy PDFs and render a first-page preview.
step('Research papers');
mkdirSync(join(OUT, 'papers/previews'), { recursive: true });
for (const [slug, file] of Object.entries(PAPERS)) {
  copyFileSync(src(file), join(OUT, 'papers', `${slug}.pdf`));
  const base = join(tmp, slug);
  run('pdftoppm', ['-r', '110', '-png', '-f', '1', '-l', '1', '-singlefile', src(file), base]);
  await sharp(`${base}.png`).resize({ width: 720 }).webp({ quality: 80 }).toFile(join(OUT, 'papers/previews', `${slug}.webp`));
  console.log('  ', slug);
}

// 2. Magazine: PDF, page images for the web reader, thumbnails.
step('Magazine, edition 01');
const mag = join(OUT, 'editions/01');
for (const d of ['pages', 'thumbs']) {
  rmSync(join(mag, d), { recursive: true, force: true });
  mkdirSync(join(mag, d), { recursive: true });
}
copyFileSync(src(MAGAZINE), join(mag, 'the-intelligence-layer-edition-01.pdf'));
const pageDir = join(tmp, 'mag');
rmSync(pageDir, { recursive: true, force: true });
mkdirSync(pageDir, { recursive: true });
run('pdftoppm', ['-r', '150', '-png', src(MAGAZINE), join(pageDir, 'p')]);
const pages = readdirSync(pageDir).filter((f) => f.endsWith('.png')).sort();
for (const [i, f] of pages.entries()) {
  const n = String(i + 1).padStart(2, '0');
  const img = sharp(join(pageDir, f));
  await img.clone().resize({ width: 1200 }).webp({ quality: 78 }).toFile(join(mag, 'pages', `p${n}.webp`));
  await img.clone().resize({ width: 220 }).webp({ quality: 70 }).toFile(join(mag, 'thumbs', `p${n}.webp`));
}
// The web reader opens on the October 2026 cover supplied as an image, set on a
// black A4 page. The downloadable PDF is left exactly as supplied.
if (USE_IMAGE_COVER_IN_READER) {
  const W = 1200, H = 1697;
  const art = await sharp(src(COVER)).resize({ height: H }).toBuffer();
  const meta = await sharp(art).metadata();
  const page1 = sharp({ create: { width: W, height: H, channels: 3, background: '#000000' } })
    .composite([{ input: art, left: Math.round((W - meta.width) / 2), top: 0 }]);
  const buf = await page1.png().toBuffer();
  await sharp(buf).webp({ quality: 80 }).toFile(join(mag, 'pages', 'p01.webp'));
  await sharp(buf).resize({ width: 220 }).webp({ quality: 70 }).toFile(join(mag, 'thumbs', 'p01.webp'));
}
console.log(`   ${pages.length} pages`);

// 3. Cover image (the October 2026 cover supplied separately).
step('Cover image');
for (const w of [1024, 640]) {
  await sharp(src(COVER)).resize({ width: w }).webp({ quality: 82 }).toFile(join(OUT, 'images', `media-intelligence-01-cover-${w}.webp`));
}
await sharp(src(COVER)).resize({ width: 1024 }).jpeg({ quality: 82, mozjpeg: true }).toFile(join(OUT, 'images', 'media-intelligence-01-cover.jpg'));

// 4. The intro video was retired in October 2026 (it described the Moving Walls
// role in the present tense). The files are kept in originals/retired-intro-video/.

// 5. Portrait. PORTRAIT is the square painted portrait on white; PORTRAIT_CUTOUT is
// the same image with the background removed (transparent PNG, same size). The
// site shows the cut-out over a clay circle; the square original is used where a
// plain image is needed (structured data, social card fallback).
step('Portrait');
const PORTRAIT = 'Suraj_Prakash_Portrait.png';
const PORTRAIT_CUTOUT = 'Suraj_Prakash_Portrait_Cutout.png';
await sharp(src(PORTRAIT)).resize({ width: 800 }).webp({ quality: 84 }).toFile(join(OUT, 'images/suraj-prakash-portrait.webp'));
await sharp(src(PORTRAIT)).resize({ width: 800 }).jpeg({ quality: 84, mozjpeg: true }).toFile(join(OUT, 'images/suraj-prakash-portrait.jpg'));
for (const w of [960, 640]) {
  await sharp(src(PORTRAIT_CUTOUT)).resize({ width: w }).webp({ quality: 84, alphaQuality: 90 }).toFile(join(OUT, `images/suraj-prakash-cutout-${w}.webp`));
}
await sharp(src(PORTRAIT_CUTOUT)).resize({ width: 640 }).png({ palette: true, quality: 90, compressionLevel: 9 }).toFile(join(OUT, 'images/suraj-prakash-cutout-640.png'));

console.log('\nDone. Now run `npm run og` to refresh social images, then `npm run build`.');
