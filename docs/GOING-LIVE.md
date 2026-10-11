# Going live on your own domain

This takes the site from files to a live address such as `https://www.yourname.com`, with the domain bought at GoDaddy and the site hosted on Netlify. Allow about an hour of clicking, spread over a day, because DNS changes can take a few hours to reach everyone.

| Piece | Where | Cost |
|---|---|---|
| The domain name | GoDaddy | GoDaddy's yearly price for the name |
| Hosting, the HTTPS certificate, the contact form | Netlify, Free plan | Free, within a monthly allowance (see "Netlify's free plan" below) |
| The site's files, and every save from the content manager | GitHub, private repository | Free |

You don't need GoDaddy's hosting, website builder or SSL certificate. Netlify hosts the site and gives it a free certificate that renews itself.

---

## 1. Buy the domain at GoDaddy

1. Buy just the domain. Say no to hosting, a website builder and an SSL certificate. Only add "professional email" if you want an email address at the new domain (see "Email at your domain" at the end).
2. Turn on **auto-renew**, so the domain can't lapse and take the site with it.
3. Turn on **2-step verification** for your GoDaddy account. GoDaddy may ask for a code when you change the domain's nameservers.
4. Decide on the main address: `www.yourname.com` or `yourname.com`. The other one will redirect to it automatically. Either works. **www is the safer choice**, because it works equally well with both DNS options in step 5.

## 2. Put the site on GitHub

The content manager saves to GitHub, and Netlify publishes from it.

1. Create a free account at github.com if you don't have one.
2. Create a repository: **New repository**, a name such as `suraj-portfolio`, **Private**, and no README (leave it empty). Click **Create repository**.
3. Upload the site's files. Either:
   - **Ask Claude to do it:** connect GitHub to Claude (claude.ai → Settings → Connectors → GitHub), then say which repository to use. Claude pushes the files.
   - **Or do it yourself with GitHub Desktop** (desktop.github.com): unzip the two archives into one folder, add it as a repository, commit, and **Publish** to the repository above. (GitHub's web uploader takes 100 files at a time, and the site has about 420 files.)

## 3. Create the Netlify project

1. Go to netlify.com and choose **Sign up** → **GitHub**. The Free plan is enough.
2. **Add new project → Import an existing project → GitHub**. Allow Netlify to see the repository, then pick it.
3. Leave the build settings as Netlify fills them in. They come from `netlify.toml` (build command `npm run build`, publish directory `dist`). Click **Deploy**.
4. When the deploy says **Published**, open the `…netlify.app` address Netlify shows and look around.
5. Optional: give it a readable name, under **Project configuration → General → Project details → Change project name**, for example `suraj-prakash`. The address becomes `suraj-prakash.netlify.app`. You need this address in step 5 if you keep DNS at GoDaddy.

## 4. Switch on the contact form

1. In the project, open **Forms** and click **Enable form detection**.
2. Go to **Deploys → Trigger deploy → Deploy project**. Netlify only finds forms on deploys made after detection is on.
3. Open **Forms** again. A form called **enquiry** is listed.
4. Under **Forms → Submission notifications**, choose **Add notification → Email notification**. Set the event to new submissions on the form **enquiry**, enter `surajprakash251993@gmail.com`, and save.

Notifications come from `formresponses@netlify.com`. Pressing **Reply** writes to the visitor. Check Gmail's Spam folder the first time. More detail is in [CONTACT-FORM.md](CONTACT-FORM.md).

## 5. Connect the domain

In Netlify: **Domain management → Add a domain → Add a domain you already own**. Enter `yourname.com` and confirm. Netlify adds both `yourname.com` and `www.yourname.com`.

Netlify then asks whether to use Netlify DNS or an external DNS provider. Pick one of these two options.

### Option A, recommended: Netlify runs the DNS

Netlify marks this as "most recommended". You don't type any records, the root domain gets Netlify's fast global routing, and certificates are automatic.

1. In Netlify, choose **Use Netlify DNS** and go through the steps. At the end it shows **four nameservers**, which look like `dns1.p05.nsone.net`.
2. In GoDaddy, go to **Domain Portfolio** → your domain → **DNS** → **Nameservers**. Choose **I'll use my own nameservers**, enter the four names, then **Save** and **Continue**. Enter the code if GoDaddy asks for one.
3. Wait. It usually takes under an hour, and can take up to 48.

After this, DNS records (for example, ones an email service asks for) are added in Netlify under **Domains**, not in GoDaddy. GoDaddy still holds the registration and the renewal.

### Option B: keep DNS at GoDaddy

1. In Netlify, choose the external DNS option.
2. In GoDaddy, go to **Domain Portfolio** → your domain → **DNS** → **DNS Records**, and make the records look like this:

   | Type | Name | Value |
   |---|---|---|
   | A | `@` | `75.2.60.5` |
   | CNAME | `www` | `suraj-prakash.netlify.app` (your Netlify address from step 3) |

   - **Edit** GoDaddy's existing A record for `@` (it points to a GoDaddy "parked" page). Don't add a second one, and delete any other A or AAAA records named `@`.
   - **Edit** the existing `www` CNAME (GoDaddy sets it to `@`).
   - Leave MX and TXT records alone if you use email at the domain.
3. In Netlify, under **Domain management**, open the **Options** menu next to `www.yourname.com` and choose **Set as primary domain**. With DNS outside Netlify, Netlify recommends www as the main address.

## 6. HTTPS

Nothing to buy or install. Once DNS points to Netlify, Netlify issues a free Let's Encrypt certificate for both names. The status is under **Domain management → HTTPS**. Visitors who type `http://` are sent to `https://` automatically, and the site tells browsers to stick to HTTPS.

If it still says it's waiting for DNS after a day, click **Verify DNS configuration** there. Then run the check in step 8, which names the record that's wrong.

## 7. Redeploy once

Go to **Deploys → Trigger deploy → Deploy project**. The site reads its own address from Netlify while it builds. This deploy writes your domain into the canonical links, the sitemap, the social-card images LinkedIn shows, and the blog's RSS feed. Until then, they name the `netlify.app` address.

## 8. Check everything

Run the live-site check. It covers:
- **Domain and HTTPS:** DNS, the certificate on both names, and the redirects (http → https, and the other name → the main one).
- **Pages and links:** security headers, every page and every file it links to, and the sections inside pages.
- **Search engines:** the 404 page, robots.txt, the sitemap and the RSS feed.
- **Downloads and forms:** PDFs, social images, whether Netlify has registered the form (optionally sending one real test message), and the content manager.

Run it in any of these ways:
- **On GitHub:** **Settings → Secrets and variables → Actions → Variables → New repository variable**. Name it `SITE_URL`, with your address (for example `https://www.yourname.com`). Then go to **Actions → Check the live site → Run workflow**, and tick "send a test message" the first time. After that, it runs by itself every Monday, and GitHub emails you if something breaks.
- **On a computer with Node 20 or later:** `node scripts/check-live.mjs https://www.yourname.com --external --send-test-message`
- **Ask Claude** to check the site.

Then do the three things a script can't:
- Confirm the test message reached Gmail.
- Look at the site on your phone.
- Log in to `/admin` (after step 9).

## 9. Content manager and scheduled posts (optional, about 15 minutes)

- **Signing in to /admin:** create a GitHub OAuth app and add it to Netlify. The steps are in [CONTENT-MANAGER.md](CONTENT-MANAGER.md).
- **Posts dated in the future, and the optional LinkedIn feed:**
  1. Create a build hook in Netlify.
  2. Save it in GitHub as the secret `NETLIFY_BUILD_HOOK`.
  3. Set the `SITE_URL` variable (step 8).

  A daily check then rebuilds the site only on days when something is due (see `.github/workflows/daily-rebuild.yml`).

---

## Netlify's free plan: what to keep an eye on

The Free plan has **300 credits a month**, and it is a hard limit. If they run out, Netlify pauses the site and shows "Site not available" until the next month. Upgrading to Personal ($9 a month, 1,000 credits) avoids that.

| Uses credits | How much |
|---|---|
| Each production deploy: a save in the content manager, a push to GitHub, **Trigger deploy** | 15 |
| Bandwidth | 20 per GB |
| Requests | 2 per 10,000 |
| Form submissions, failed deploys, deploy previews | Free |

What this means for this site:
- **Visits are cheap.** A first visit to the home page downloads about 0.5 MB, and later pages about 0.1 MB, because fonts and styles are cached. A thousand visits a month is roughly 1 GB, or about 20 credits.
- **Deploys are what count.** About 15 deploys a month still leaves plenty for traffic. So publish edits together rather than saving a published post ten times.
- **Saves that can't change the site are skipped**, and cost nothing. That covers drafts, posts dated in the future, and notes in `docs/` (see `scripts/netlify-ignore.mjs`).
- **The daily check only deploys** on days a scheduled post falls due.
- **Usage** is shown on your team's billing page in Netlify, and Netlify emails you at 50%, 75% and 100% of the month's credits.

## Email at your domain (optional)

The site uses your Gmail address, so email at the new domain isn't needed. If you want one, for example `hello@yourname.com`:
- GoDaddy sells mailboxes (Microsoft 365).
- A forwarding service can send it on to Gmail.

Either way, the service gives you MX and TXT records to add. Add them in GoDaddy's DNS with option B, or in Netlify's DNS with option A.

## If something goes wrong

- **The domain shows a GoDaddy page.** DNS hasn't switched yet, or (option B) the old parked A record is still there. Run the check: it names the record.
- **The certificate isn't issued.** Usually DNS isn't pointing to Netlify yet. If you added any CAA records, one must allow `letsencrypt.org`.
- **The form says it sent, but nothing arrives.** Check **Forms → enquiry** in Netlify. If the message is there, look at the notification settings and Gmail's Spam folder. If it's missing, check its **Spam submissions** list. If the form isn't listed at all, form detection is off (step 4).
- **A change doesn't appear.** Check **Deploys** in Netlify. A skipped deploy says why (for example, "only content/blog/… changed, which doesn't show on the site"). A failed deploy names the file at fault. The previous version stays live until a deploy succeeds.
