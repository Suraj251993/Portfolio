# The contact form: how it works and how to switch on email

The form appears on the Contact page and the Consulting page. Both are the same form, called `enquiry`.

## Where a message goes

| Where the site is running | What happens when a visitor presses Send |
|---|---|
| **Netlify (the live site)** | The message is posted to Netlify Forms, Netlify's built-in form service. Netlify stores it under **Forms → enquiry** in your Netlify dashboard and, once you switch it on, emails it to you. |
| **The claude.ai preview** | Nothing is sent. The page prepares the message as an email in the visitor's own email app, addressed to surajprakash251993@gmail.com, for them to send. The preview has no server to receive forms. |
| **Netlify, if the post fails** | The visitor isn't left guessing: the page shows the message ready to send by email instead, with an "Open in your email app" button. |

**There's no backend to build and no credentials to store.** Netlify Forms is the backend. No API key or password is in the site's code or needed in environment variables. The only settings are switches in the Netlify dashboard, below.

The site uses Netlify Forms in the standard way:
- The form tag has `data-netlify="true"` and the name `enquiry`.
- A hidden `form-name` field is included.
- A honeypot field (`company_website`) catches spam bots.
- It posts URL-encoded data.

Netlify's own spam filtering applies too.

## What you need to do (about 5 minutes, after the site is on Netlify)

1. **Turn on form detection.** In Netlify, open the site and go to **Forms**. If you see **Enable form detection**, click it, then redeploy: **Deploys → Trigger deploy → Deploy site**. After that, a form called **enquiry** appears under Forms.
2. **Send the messages to your inbox.** Go to **Forms → Submission notifications → Add notification → Email notification**. Enter **surajprakash251993@gmail.com**, choose the form **enquiry**, and save.
3. **Test it end to end.** Open your live site's Contact page and send yourself a message. Check that it appears under **Forms → enquiry** and arrives in Gmail; look in Spam the first time. If it went to Spam, mark it "Not spam", or add `formresponses@netlify.com` to your contacts.
4. **Reply as normal.** Notifications come from `formresponses@netlify.com`. Because the form's email field is named `email`, Netlify sets **Reply-To** to the visitor's address, so pressing Reply in Gmail writes to them.

The notification's subject line reads "Website enquiry · [topic]: [visitor's name]". It's set by the page just before sending. Without JavaScript, it falls back to "Website enquiry".

Check **Forms → enquiry → Spam submissions** now and then: messages Netlify's filter wasn't sure about wait there, not in your inbox. Form submissions are free and unlimited on Netlify's current (credit-based) plans, including Free.

**Checking it on the live site.** `node scripts/check-live.mjs https://www.your-domain.com --send-test-message` (or the **Check the live site** action on GitHub, with "send a test message" ticked) confirms that Netlify has registered the form, that its fields are right, and that Netlify accepts a message. What's left for you is to see the message arrive in Gmail.

## What has been tested, and what hasn't

Tested here, against a local server standing in for Netlify's form endpoint:
- An empty or incomplete form is blocked, with a message at each field; a badly formed email address is caught.
- A valid message is posted once to `/`, URL-encoded, with `form-name=enquiry`, the subject line and every field (name, email, organisation, topic, message), and the honeypot empty. The visitor sees "Message sent" and the form clears.
- If the server returns an error, or the network fails, the visitor gets the message ready to email to you instead, and the Send button works again.
- A bot filling the hidden honeypot field sends nothing.
- The Consulting page's form posts with "Consulting or advisory" preselected.
- With JavaScript switched off, the browser posts the form to `/thanks` and shows the thank-you page, which is what Netlify does.
- In the preview, the form prepares an email to your address and sends nothing.

Tested against a local stand-in for Netlify (`scripts/check-live.mjs`): a registered form is recognised and a test message is accepted; an unregistered form (form detection off) is reported with the fix.

**Not tested: delivery to your Gmail.** That needs the live Netlify site and the notification switched on (steps 1 and 2), which need your Netlify account. Step 3 is the end-to-end test.

## Hosting somewhere other than Netlify

Netlify Forms only exists on Netlify. On Vercel, Cloudflare Pages or GitHub Pages, create a free form at formspree.io. In `content/site.json`, set `"provider": "formspree"` and put the form's endpoint in `"formspreeEndpoint"`. The endpoint is meant to be public, so it isn't a secret. Formspree then emails you each message.
