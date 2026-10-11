# Managing the blog, LinkedIn posts and the homepage TV

The site has a content manager at **/admin** (for example `https://your-site.netlify.app/admin`). It is Decap CMS, a free, open-source editor. You sign in with GitHub, and every save becomes a change in the site's GitHub repository. Netlify then rebuilds and publishes the site by itself, usually within a minute. You never run a build yourself.

Four things are managed there:

| In the menu | What it changes | File in the repository |
|---|---|---|
| Blog posts | The Blog page and one page per post | `content/blog/*.md` |
| LinkedIn posts | "Latest on LinkedIn" on the home page, and the full list on the Blog page | `content/linkedin.json` |
| Homepage TV | The slides playing on the screen in the home page hero | `content/tv.json` |
| ResearchGate | Your profile link, and the papers listed under "Product management and AI" on the Research page | `content/researchgate.json` |

Everything else (career, projects, papers) is still edited in the `content/*.json` files. GitHub's own editor is enough: open the file on github.com, click the pencil, save, and Netlify publishes the change.

---

## One-time setup (about 15 minutes)

You need the site on GitHub and Netlify first. The README's "Deploying" section covers that.

1. **Create a GitHub OAuth app** (this lets you sign in to /admin with GitHub).
   On GitHub, go to **Settings → Developer settings → OAuth Apps → New OAuth App**:
   - Application name: anything, for example "Suraj Prakash site editor"
   - Homepage URL: your site's address
   - Authorization callback URL: `https://api.netlify.com/auth/done`

   Save, copy the **Client ID**, then click **Generate a new client secret** and copy that too.

2. **Give the keys to Netlify.** In Netlify, open the site, go to **Project configuration → Security → OAuth (Access control)**, choose **Install provider → GitHub**, and paste the Client ID and secret.

3. **Open `/admin`** on your site and click **Login with GitHub**. That's it.

The repository name is picked up automatically on Netlify. On another host, put it in `content/site.json` under `"cms": { "repo": "your-github-name/your-repo" }`.

**Optional: scheduled posts.** Posts with a future date, and the optional LinkedIn feed, need the site to rebuild on the day. A daily check does that, and only rebuilds when something is actually due:
1. In Netlify, go to **Project configuration → Build & deploy → Build hooks → Add build hook** and copy its URL.
2. In GitHub, go to **Settings → Secrets and variables → Actions**.
   - **Secrets:** add `NETLIFY_BUILD_HOOK`, with the URL.
   - **Variables:** add `SITE_URL`, with your address (for example `https://www.yourname.com`).

The check in `.github/workflows/daily-rebuild.yml` runs at 06:05 Kuala Lumpur time.

**Saves and Netlify credits.** On Netlify's Free plan, each deploy uses 15 of 300 monthly credits, and the site is paused if they run out. So:
- **Free:** saving a **draft**, or a post dated in the future, doesn't deploy, because nothing changes on the site (`scripts/netlify-ignore.mjs`). Write and save drafts as often as you like.
- **One deploy each:** every save of a published post, the LinkedIn list, the TV slides or the ResearchGate list.

Make your edits, check them, and save once. [GOING-LIVE.md](GOING-LIVE.md#netlifys-free-plan-what-to-keep-an-eye-on) has the full budget.

---

## Writing a blog post

1. In /admin, choose **Blog posts → New Blog post**.
2. Fill in the title, the date, a category (Opinion, Research, Analysis or Notes) and any tags (AdTech, MarTech, OOH, DOOH, AI, Product management, or your own).
3. Write the post in the editor. Headings, bold, lists, quotes, links, images and tables all work. Use **Heading 2** for sections: the post title is already the page's main heading.
4. Optional: a one- or two-sentence summary (shown on the Blog page and in link previews), a cover image, and the link to the same post on LinkedIn.
5. **Status** starts as **Draft**. Drafts are saved to GitHub but don't appear on the site, and saving them doesn't use Netlify credits. When you're ready, set Status to **Published** and click **Save**.

**Edit** a post by opening it, changing it and saving. **Remove** it with **Delete entry** (or set it back to Draft to take it offline without losing it).

**Schedule** a post by publishing it with a future date. It appears on its day if the daily check is set up (above). Otherwise it appears with the next deploy after that date, for example your next save of something published.

The post's address comes from its title when you first create it (`/blog/why-dooh-needs-an-intelligence-layer`). It doesn't change if you edit the title later, so links you've shared keep working.

**Images:** a JPG or PNG under 1.5 MB, about 1600 × 900 for covers. The cover is also the picture LinkedIn shows when someone shares the post.

The Blog page filters posts by category and tag automatically, and the site publishes an RSS feed at `/blog/feed.xml` once the site address (`SITE_URL`) is set. Feed services and automation tools (for example Zapier or IFTTT) can share new posts to LinkedIn from that feed.

---

## Adding LinkedIn posts

LinkedIn doesn't let websites read a member's posts automatically. Its API for that is limited to approved partners. So the site keeps a list, and adding a post takes about ten seconds:

1. On LinkedIn, open the post's **⋯** menu and choose **Copy link to post**.
2. In /admin, open **LinkedIn posts**, click **Add post**, and paste the link.
3. Add the opening line or a one-sentence summary, so visitors know what it's about. If you leave it empty, a few words are taken from the link.
4. Save.

The date is read from the link itself for posts (LinkedIn post IDs contain their timestamp). For articles (links containing `/pulse/`), add the date yourself. An image is optional: upload it rather than pasting LinkedIn's image address, which expires. **Hide from the site** takes a post off without deleting it.

The home page shows the six newest. The Blog page shows them all.

**Automatic syncing (optional, advanced).** If you later use a third-party service that turns your LinkedIn activity into an RSS or JSON feed, paste the feed's address into **Feed address** on the same screen. Every rebuild, including the daily one, then adds any new LinkedIn links from that feed. Posts you've added by hand always stay. If the feed can't be reached, the site still builds with your own list. These services aren't official, and whether one works with your account and LinkedIn's terms is worth checking first.

---

## The homepage TV

**Homepage TV** holds the slides on the screen in the hero: the caption underneath, the seconds per slide, and the slides themselves. Each slide has a layout (Portrait and name, Text, List or Big number), a small label, a headline, and some text, list items, a number or a badge, depending on the layout.

The last slide, "Now", says what you're doing next. Update it when that changes, for example when you start a new role.

The slides pause when the screen scrolls out of view, can be paused with the button, and don't play by themselves for visitors who've asked their device to reduce motion.

---

## If something goes wrong

- **Login fails.** Check the OAuth app's callback URL is exactly `https://api.netlify.com/auth/done`, and that your GitHub account can push to the repository.
- **A change doesn't appear.** Open Netlify's **Deploys** page. A failed build names the file and the problem (for example "the post needs a publication date"). The previous version of the site stays live until the build succeeds.
- **Writing without the content manager.** A post is a Markdown file in `content/blog/` with a short header:

  ```
  ---
  title: Why DOOH needs an intelligence layer
  date: 2026-10-20
  status: published
  category: Opinion
  tags: [DOOH, AI]
  summary: One or two sentences for the list and link previews.
  ---
  The post, in Markdown.
  ```
