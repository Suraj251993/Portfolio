# Suraj Prakash: personal site

Portfolio, research library, blog and magazine showcase for Suraj Prakash, product manager in advertising technology.

- **Static site, no framework, no runtime dependencies.** `npm run build` needs Node 20+ and nothing else.
- **Content lives in files** under `content/`. Pages are generated from them, so adding a paper, a project or a magazine edition is a content edit, not a code change.
- **A content manager at `/admin`** for the blog, LinkedIn posts and the homepage TV. Saving publishes the site automatically on Netlify; no build to run. See [docs/CONTENT-MANAGER.md](docs/CONTENT-MANAGER.md).
- **Fast by default:** self-hosted fonts, WebP images with explicit sizes, no tracking scripts, about 14 KB of JavaScript, no layout shift.

## Quick start

```bash
npm run build      # build the site into dist/
npm run preview    # serve dist/ at http://localhost:4321 with clean URLs
npm run check      # check every internal link, image and anchor in dist/
npm test           # tests for the live-site check
npm run check:live -- https://www.your-domain.com   # check the deployed site (see docs/GOING-LIVE.md)
```

`npm run dev` builds and serves in one step. Rebuild after editing content or styles.

## What's where

```
content/                 Everything the site says
  site.json              Name, role, contact details, nav, contact-form settings
  articles.json          The 16 research papers and the six layers they're grouped by
  projects.json          Case studies on the Work page
  frameworks.json        The four frameworks on the home page
  magazine.json          Media Intelligence editions: contents, page titles, evidence labels
  consulting.json        Services, audiences, engagement steps
  profile.json           Career, education, certifications, skills, working principles
  blog/*.md              Blog posts (Markdown with a short header), written in /admin or by hand
  linkedin.json          Links to LinkedIn posts shown on the home and Blog pages
  tv.json                The slides on the screen in the home page hero
  researchgate.json      Your ResearchGate profile link and the papers listed under Product management and AI
  papers/*.json          The full text of each paper, read out of its PDF by scripts/prepare-papers.py
src/
  build.mjs              The build: reads content/, writes dist/
  lib/                   Templating, layout, components, SEO, Markdown, the content manager's settings
  pages/                 One module per page type (home, work, research, paper, blog, post, magazine…)
  assets/css/site.css    The design system and all styles
  assets/js/site.js      Navigation, framework tabs, research filter, copy buttons, enquiry form
  assets/js/reader.js    The magazine page reader
public/                  Copied into dist/ as-is: fonts, images, PDFs, page images, paper figures, social cards
scripts/
  prepare-assets.mjs     Turns original PDFs, cover and portrait into the web assets in public/
  prepare-papers.py      Reads each paper PDF into text, figures, tables and page images for reading on the site
  make-social-images.mjs Generates the social sharing images and PNG favicons
  check-links.mjs        Link checker for the built site
  check-live.mjs         Checks the deployed site: DNS, HTTPS, redirects, headers, every page and file, form, /admin
  netlify-ignore.mjs     Tells Netlify to skip builds for changes that can't show on the site (drafts, docs)
  rebuild-needed.mjs     Decides whether the daily check should rebuild (a scheduled post is due, new LinkedIn posts)
  serve.mjs              Local preview server (the security policy is in each page, so it applies here too)
docs/GOING-LIVE.md       Domain at GoDaddy, hosting on Netlify, DNS, HTTPS, the form, and checking the live site
docs/BRIEF.md            Discovery notes, positioning, design system and open items
docs/CONTENT-MANAGER.md  Setting up and using /admin: blog posts, LinkedIn posts, ResearchGate, the homepage TV
docs/CONTACT-FORM.md     Where enquiries go, switching on email delivery, and what has been tested
.github/workflows/       A daily check that rebuilds when a scheduled post is due, and a weekly live-site check
```

## Editing content

**Blog posts, LinkedIn posts and the homepage TV** are edited at `/admin` once the site is on Netlify. The one-time setup and day-to-day use are in [docs/CONTENT-MANAGER.md](docs/CONTENT-MANAGER.md). Without the content manager, a post is a Markdown file in `content/blog/` (the guide shows the header it needs), and the other two are plain JSON files.

**Career dates.** Roles are in `content/profile.json` (the home page, About page and the photo caption all read from it). Earlier roles on the Work page are in `content/projects.json` under `"earlier"`.

**Add a LinkedIn link to a paper.** In `content/articles.json`, set the paper's `"linkedin"` field to the article URL. Its page then shows "Read on LinkedIn" instead of the general LinkedIn link. The magazine has the same field in `content/magazine.json`.

**Add a new paper.**
1. Put the PDF in your originals folder and add a line to the `PAPERS` list in `scripts/prepare-assets.mjs` (slug and file name).
2. Add an entry to `content/articles.json` with the same slug: title, subtitle, layer, summary, abstract, keywords, sections, key figure, date, pages, words and the related magazine chapter.
3. Run `npm run assets`, `python3 scripts/prepare-papers.py <slug>` (so the paper can be read on its page), `npm run og` and `npm run build`.

A paper without a PDF can be listed too: set `"pdf": false` and it shows as a summary that points to LinkedIn.

**Add a magazine edition.** Add an edition to `content/magazine.json`, put its assets in `public/editions/02/` (the asset script shows how they're produced), and the magazine page will need a small change to list editions (today it shows the first one).

**Add a project.** Add an entry to `content/projects.json`. `"kind": "team"` or `"solo"` controls the label, and `"featured": true` puts it on the home page.

## Deploying

The site is plain static files in `dist/`. Any static host works.

### Netlify (recommended: the contact form works with no code)
Step by step, from buying the domain at GoDaddy to checking the live site: [docs/GOING-LIVE.md](docs/GOING-LIVE.md). In short:
1. Push this folder to a GitHub repository.
2. In Netlify, choose **Add new project → Import an existing project** and pick the repository. `netlify.toml` sets everything: the build command (`npm run build`), the publish folder (`dist`), Node 24, security and caching headers, and a check that skips builds for changes that can't show on the site (`scripts/netlify-ignore.mjs`).
3. In **Forms**, enable form detection and redeploy. The form called `enquiry` appears. Under **Submission notifications**, add an email notification to your address. Step by step, with what has been tested: [docs/CONTACT-FORM.md](docs/CONTACT-FORM.md).
4. Add your domain under **Domain management** and redeploy once. The build takes the site's address from Netlify (its `URL` variable), which turns on canonical URLs, social cards, the blog's RSS feed and `sitemap.xml`. Set `SITE_URL` only to override it.
5. Set up the content manager: a GitHub OAuth app and Netlify's GitHub provider, about ten minutes. Steps in [docs/CONTENT-MANAGER.md](docs/CONTENT-MANAGER.md).
6. Check the live site: `npm run check:live -- https://www.your-domain.com --external --send-test-message`, or run **Actions → Check the live site** on GitHub (it also runs every Monday once the `SITE_URL` repository variable is set).

On Netlify's Free plan each production deploy uses 15 of 300 monthly credits, and the site is paused if they run out. [docs/GOING-LIVE.md](docs/GOING-LIVE.md#netlifys-free-plan-what-to-keep-an-eye-on) explains the budget.

No GitHub? Build locally (`npm run build`) and drag the `dist` folder onto app.netlify.com/drop. Forms work the same way; set `SITE_URL` before building in that case (`SITE_URL=https://your-domain npm run build`).

### Vercel, Cloudflare Pages or GitHub Pages
Build command `npm run build`, output folder `dist`. `vercel.json` is included. The content manager's GitHub sign-in uses Netlify's authentication service, so on these hosts it needs a separate small OAuth service (Decap CMS documents several). Netlify Forms won't exist on these hosts either, so for the contact form either:
- create a free form at formspree.io, put its endpoint in `content/site.json` as `"formspreeEndpoint"` and set `"provider": "formspree"`, or
- set `"provider": "mailto"`, and the form will prepare the message for the visitor to send from their own email app.

If the form can't reach its backend for any reason, it falls back to the prepared-email view, so a message is never silently lost.

GitHub Pages project sites live in a sub-folder (`user.github.io/repo/`). Every page works there, but the 404 page uses root paths, so it only looks right on a custom domain.

## Security policy

Each page carries its own Content-Security-Policy in a meta tag, written by the build (`contentSecurityPolicy()` in `src/lib/layout.mjs`). That lets `/admin` load the content manager's editor while the site itself stays locked down: no scripts other than the site's own, no third-party requests. Framing is blocked by the `X-Frame-Options` header in `netlify.toml` and `vercel.json`.

## Preview build for claude.ai

`npm run build:artifact` writes `dist-artifact/`, a variant with explicit `.html` links, Google-hosted fonts and the email-composing contact form, used for the shareable preview. It has no `/admin`, because the content manager needs the live site.

## Regenerating assets

Only needed when a source file changes. These scripts need `sharp`, `playwright`, `pdftoppm` (poppler) and `ffmpeg`, which are dev tools and not needed to build.

```bash
npm install                      # installs sharp and playwright (dev only)
npm run assets                   # originals/ → public/ (papers, magazine pages, cover, portrait and its cut-out)
npm run og                       # social cards and favicons
python3 scripts/prepare-papers.py   # papers → readable text, figures and page images (pip install pdfplumber pillow)
```

Fonts are Newsreader, Schibsted Grotesk and JetBrains Mono from the Google Fonts library (SIL Open Font License, included in `public/fonts/`), subset to Latin.
