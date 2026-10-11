# Site brief: discovery, strategy, design and open items

October 2026

## 1. What was reviewed

| Material | Status | Used for |
|---|---|---|
| CV (2 pages) | Read in full | Career, projects, skills, certifications, education, contact |
| Cover letter | Read in full | Voice, working principles, "both products are live" |
| 13 research papers (PDF) | Abstract, keywords, section structure and key figures extracted from each; claims checked against the text | Research library, paper pages, frameworks |
| Media Intelligence, edition 01 (36-page PDF) | Read in full | Magazine page, contents, evidence labels, layer structure, summaries of the 3 papers not supplied |
| October 2026 cover image | Used | Magazine feature, reader page 1, social card |
| Intro video (102 s) | Used until October 2026, then retired because it describes the Moving Walls role as current | Replaced by a written introduction on the About page; files kept in `originals/retired-intro-video/` |
| ResearchGate profile | Read on 11 October 2026: 25 items, including all 16 papers in the library and four more from 2026 on product management, AI and B2B SaaS | Profile link across the site; a direct link on each paper page; the four extra papers on the Research page |
| Painted portrait (1254×1254) | Used; background removed for the cut-out | Home About, About page, social card, structured data |
| Reference video (16 s, another person's portfolio) | Frames reviewed | Design principles (see section 4) |
| LinkedIn profile | **Not accessible**: LinkedIn shows a sign-in wall to anyone not logged in, and the articles aren't indexed by search engines yet | Linked to the profile and articles page instead |

### Sixteen papers, thirteen PDFs
The magazine's source library lists sixteen papers. Thirteen were supplied. The other three are on the site as summary entries built only from what the magazine says about them, and each says so on its page:
- Consolidation and Intelligence: The Global OOH, DOOH and Agentic AdTech Landscape (magazine chapter 05)
- Competitive Structure and AI Adoption in Global OOH AdTech: the Power Index 2026 (chapter 05)
- The Data Behind the Billboard: Africa edition (chapter 07)

The magazine synthesises chapter 05 from both of the first two papers, so the split of findings between them on the site is an editorial judgement. Please check it.

## 2. Verified facts the site relies on
- Moving Walls from March 2020 to 2026, five roles; Senior Executive Product Manager from April 2024 to 2026 (tenure complete, per your update of 11 October 2026). Business Analyst, Change Management: 2023 to 2024, per the same update (the CV said January to June 2023). The site says "six years at Moving Walls".
- Owned the roadmap for the DOOH programmatic platform serving advertisers across Asia; led the DSP revamp (OMS, auction mechanism, six modules, dual-sided), which was still in build at the time.
- Discovery practice: about 30% less development rework.
- Salesforce, Zoho Books and NetSuite integrations: manual reconciliation eliminated.
- Inventory Availability Viewer: CEO-commissioned, concept to production in 15 days, live.
- AI Performance Mirror: solo, Zoho Sprint API, two follow-on modules, live.
- Claude Code and Replit daily for 18+ months.
- MBA Manipal International University (2019–20); BBA Sikkim Manipal Institute of Technology (2013–17).
- Contact: surajprakash251993@gmail.com (from the CV), LinkedIn, Kuala Lumpur.

## 3. Strategy

**Audiences, in order:** hiring managers and recruiters for senior product roles; founders and product leaders at AdTech, MarTech and DOOH companies; potential advisory clients; editors and researchers.

**Positioning (broadened October 2026):** Product manager · AI platform builder · enterprise B2B SaaS · AdTech and MarTech writer and researcher. Five expertise areas on the home page (AdTech and MarTech product management; AI platform development; enterprise applications and B2B SaaS; writing, research and commentary; product strategy and digital innovation), each backed by checkable proof points rather than adjectives. The About page has a matching four-part introduction.

**Narrative:** a product manager who owns a live programmatic platform, studies the market it sits in, and builds working software himself. Each part makes the other two credible.

**Information architecture:** Home, Work, Research (16 papers, each with its own page; since October 2026 the 13 supplied papers can be read in full on their pages, with the original pages one tab away and the PDF still offered), Blog (posts with their own pages, plus all LinkedIn posts; added October 2026), Magazine (with an in-page reader), Consulting, About, Contact. Research is grouped by the magazine's own layers (transaction, data, proof, convergence, agentic turn, product frameworks), so the library and the magazine tell one story.

**Calls to action:** Explore my work, Read my research, Discuss a project. The closing line on the home page reuses the end of your intro video: "own the strategy and build the thing".

## 4. Design system (revised to match the sample video)

The site follows the sample portfolio's look section by section.

- **Palette:** a burnt-orange clay hero and page heads (#A4471F, lit towards the upper right, darker at the "floor"), off-white paper (#F4F2EE) for About and Research, cream (#EFE8D7) for Experience and Frameworks, near-black (#151311) for Projects and the magazine. Accents: pale peach for the italic word on clay, terracotta-rose on light bands, orange on dark. The clay was deepened slightly from the sample's on-screen colour so white text meets WCAG AA.
- **Type:** Newsreader in light weights for the name and headings; Schibsted Grotesk for reading; JetBrains Mono, in small spaced capitals, for the navigation, section index ("(01) — About"), kickers ("// Product manager"), dates, chips and buttons.
- **Home page order, as in the sample:** hero with name, tagline with one italic word, short paragraph, bottom line (location, availability, years) and a scroll cue; (01) About with statement, photo, skill chips and education; (02) Where I've worked; (03) Things I've built, dark, with filter tabs and illustrated cards. Then Research, Magazine, Frameworks, Consulting and Contact in the same style.
- **Hero scene:** the sample uses a 3D avatar. Without one, the right of the hero shows a screen on a stand. Since October 2026 it plays a five-slide introduction (portrait, six years at Moving Walls with tenure complete, product work, research, what's next) built from real text and edited in the content manager; it pauses off-screen, on request, and for reduced-motion users. It replaced a silent loop of the intro video, which was retired in October 2026 (the files are in `originals/retired-intro-video/`).
- **Motion:** the name comes into focus on load; headings, photos, rows and cards sharpen from a blur as they scroll in; the experience row under the cursor lights up; project cards lift on hover. All off under reduced-motion settings.
- **Project illustrations** are schematic (bars, lanes, slots, roadmap blocks, a flow) with no numbers, so nothing reads as a real dashboard.

## 5. Open items for you

**Going live (October 2026):**
- **Steps:** [GOING-LIVE.md](GOING-LIVE.md) has the full sequence: buy the domain at GoDaddy, put the site on GitHub, Netlify, the form, DNS (Netlify DNS recommended), HTTPS, then a check of the live site. Nothing is live yet: the domain, the GitHub repository and the Netlify project need your accounts.
- **Netlify's Free plan** has 300 credits a month, and each production deploy uses 15 of them. If the credits run out, the site is paused until the next month. To protect the allowance:
  - Builds are skipped for drafts, posts dated in the future, and docs.
  - The daily rebuild now only runs on days a scheduled post is due.
  - Upgrading to Personal ($9 a month, 1,000 credits) removes the worry.
- **The live check** (`scripts/check-live.mjs`, also a GitHub Action that runs every Monday) covers DNS, the certificate, redirects, headers, every page and file, the form and `/admin`. Its DNS, certificate and redirect checks are tested against simulated answers. Everything else is tested against a local stand-in for Netlify. It hasn't run against a real domain yet, because there isn't one.

**From the reading-view update (October 2026):**
- **Reading the papers on the site.** The text, figures, tables and references of the 13 PDFs were extracted with `scripts/prepare-papers.py` and checked against the PDFs (all body text present; reference counts match). The title, abstract and keywords are shown at the top of each page rather than repeated in the reading view. Skim one or two papers for anything that reads oddly, such as a caption in the wrong place.
- **PDF button in the claude.ai preview.** The preview runs in a sandbox that blocks new tabs, which is why the button did nothing. It now asks you to confirm a download instead. On the live site the button opens the PDF in a new tab, as before. The download prompt could only be tested here with a stand-in for claude.ai's.
- **New papers.** Follow "Add a new paper" in the README. One extra step makes it readable on its page: `python3 scripts/prepare-papers.py <slug>` (it needs `pip install pdfplumber pillow` and poppler's `pdftoppm`).

**From the October 2026 update (blog, LinkedIn, TV, dates):**
- **Exit months.** The site shows "2024 to 2026" and "Jan 2023 to 2024" because the months weren't given. Add them in `content/profile.json` (`"end"`) if you want them shown on the About page.
- **LinkedIn posts.** LinkedIn blocks automated access, so no posts could be collected from here. Add them in the content manager (paste each link; the date is read from it). Until then, both LinkedIn sections show a "Follow on LinkedIn" card.
- **Content manager.** Needs the one-time GitHub and Netlify setup in `docs/CONTENT-MANAGER.md` once the site is deployed. It can't run in the claude.ai preview.
- **Homepage TV, last slide.** "Open to what's next … open to product roles, advisory work and research collaborations" reuses the wording already on the site. Change it in the content manager if you've taken a new role or want different wording.
- **About page video.** Retired (it described the Moving Walls role as current). The About page now has a written introduction in its place. A new video can go in the same spot; the portfolio film, re-rendered with the new dates and wording, would fit.
- **ResearchGate links.** The profile link is exactly as you gave it, including `?ev=hdr_xprf`. The 20 paper links were copied from your profile page; ResearchGate blocks automated visits to individual papers, so please click two or three to confirm they open.
- **Contact form.** Works through Netlify Forms. Email delivery needs two switches in Netlify (form detection, and an email notification to your address); steps in `docs/GOING-LIVE.md` (step 4) and `docs/CONTACT-FORM.md`. Delivery to your inbox can only be tested on the live site.
- **Portfolio film.** Still shows "2024 — Now" and the earlier, AdTech-only positioning. It can be re-rendered.
- **Consulting disclosure** now reads "From 2020 to 2026 I worked at Moving Walls, most recently as Senior Executive Product Manager. I take on a small number of advisory and research engagements." Edit `content/consulting.json` if your situation needs different wording.

**From the original build:**

1. **LinkedIn links.** Paste each article URL into `content/articles.json` (`"linkedin"`) and the magazine post into `content/magazine.json`. Until then, links go to your LinkedIn articles page.
2. **The three missing papers.** Their originals are now linked on ResearchGate. Send the PDFs if you'd like them downloadable here too.
3. **Magazine PDF.** Its first page is an earlier cover showing a different person, and page 32 still contains the placeholder "[Add LinkedIn profile and contact details]". The web reader uses your October cover as page 1; the download is the PDF exactly as supplied. Worth fixing both in the source file.
4. **Employer sign-off.** The Work page describes Moving Walls platform work and two internal tools at CV level of detail. Confirm Moving Walls is comfortable with it being public.
5. **Consulting disclosure.** Updated in October 2026 (see above).
6. **Portrait and avatar.** If you have a 3D avatar (image or short video), it can take the hero's place exactly as in the sample.
7. **Photo.** The site uses the painted portrait you supplied (navy blazer, striped shirt), cut out from its white background and set in front of a circle, like the original: clay on the home page, cream on the About page and the social card. The square original is used for structured data. To change it, put the new portrait and a transparent cut-out in `originals/` as `Suraj_Prakash_Portrait.png` and `Suraj_Prakash_Portrait_Cutout.png` and run `npm run assets` and `npm run og`. The earlier version used a still from the intro video.
8. **Phone number.** Left off deliberately to avoid spam. Add it to `content/site.json` if you want it shown.
9. **Paper dates** come from the documents' own dates (September and October 2026), not from LinkedIn publication dates.
10. **Contact form.** Works on Netlify once deployed (see README). It could not be tested against a live Netlify site from here; the validation and the fallback that prepares an email were tested.
11. **Domain.** On Netlify the build now reads the site's address itself; redeploy once after adding the domain (GOING-LIVE.md, step 7).
