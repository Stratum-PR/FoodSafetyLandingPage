# Stratum landing page

Marketing site for **Stratum PR**: a landing page, the Walmart self-check (with the passport results), and the legal pages. It's static HTML, CSS and JS with no build step and no dependencies. Every page is bilingual (ES/EN).

```
index.html                 landing page (Spanish in the HTML; English in js/main.js)
autoevaluacion.html        5-step self-check → Walmart passport, to-do list, guide, calculator
privacidad.html            Privacy Policy     (GDPR / ePrivacy draft; needs legal review)
terminos.html              Terms of Use       (draft; needs legal review)
cookies.html               Cookie Policy

css/fonts.css              self-hosted Archivo (no Google Fonts request)
css/styles.css             landing + legal page styles; tokens at the top in :root
css/consent.css            cookie banner, shared by every page
css/autoevaluacion.css     self-check styles
css/motion.css             landing animations (skipped for prefers-reduced-motion)
css/autoeval-motion.css    self-check animations
js/motion.js               landing animation triggers
js/autoeval-motion.js      self-check screen transitions and results animations
js/consent.js              cookie consent manager (window.StratumConsent)
js/main.js                 landing: language, nav, insights card, guide, forms. CONFIG at the top
js/guide.js                official links for the guide (shared by the landing and the results)
js/selfcheck-data.js       self-check requirements, tiers, sections (shared with api/selfcheck)
js/pricing.js              price math + sample catalog (self-check results only)
js/autoevaluacion.js       self-check: questions, scoring, results. TEST_MODE / SUBMIT_URL at the top
js/legal.js                shows the ES or EN block on the legal pages
api/                       Vercel functions: form submissions → Resend (see below)
assets/                    logos, favicon, fonts, texture tile
```

## Forms and email (Resend)

Every form posts to a Vercel function in `api/` (no dependencies). `api/_lib.js` is the only file that talks to Resend, so moving to Azure later means replacing that one file.

| Endpoint | Sends |
| --- | --- |
| `/api/selfcheck` | **Passport email to the user** + lead email to `LEADS_TO` with every answer. Hot-lead email when they ask for a lab or the free review. |
| `/api/guide` | Lead email to `LEADS_TO` |
| `/api/signup` | Lead email + double opt-in confirmation to the user |
| `/api/contact` | Message to `LEADS_TO` (Reply-To = sender) |
| `/api/confirm` | Confirmation link target: adds the address to the Resend audience |

Anyone who ticks a "noticias" box (guide, early access, self-check) gets a confirmation email and joins the mailing list only after clicking it. Until the Azure database exists, **the lead emails in contact@ are the record of submissions**.

The passport email is built on the server from `js/selfcheck-data.js` (looked up by item key), never from text sent by the browser, and names can't contain links, so the forms can't be used to mail arbitrary content to strangers. There's also an origin check, a honeypot and a basic rate limit.

**Vercel → foodsafetymvp → Settings → Environment Variables** (Production + Preview):

| Variable | Value |
| --- | --- |
| `RESEND_API_KEY` | Resend API key with sending access |
| `RESEND_FROM` | `Stratum <noreply@stratumpr.com>` (the domain must be verified in Resend) |
| `RESEND_AUDIENCE_ID` | ID of the Resend audience used as the mailing list |
| `LEADS_TO` | `contact@stratumpr.com` |
| `CONFIRM_SECRET` | A long random string. Signs the confirmation links; required once the API key is set |
| `SITE_URL` | `https://mvp.stratumpr.com` |

Without `RESEND_API_KEY` nothing is sent: the functions run in **dry-run** mode and the site keeps working.

## Run locally

```bash
node .claude/devserver.js
```

Serves the site at http://localhost:5173 with no caching and runs the `api/` functions in dry-run mode: emails are saved to `.claude/outbox/` and listed at http://localhost:5173/__outbox.

## Before launch

1. **Resend:** set the environment variables above.
2. **Legal pages:** fill in the remaining `[placeholders]` (legal entity name, address, privacy email, EU representative if applicable, governing law), have an attorney review all three pages, then remove the "Borrador para revisión legal" notes. Put the postal address in the email footer too (`api/_lib.js`, CAN-SPAM).
3. **Industry insights:** add a source for the numbers in `INSIGHTS` (`js/main.js`) and for the Costco claim.

## Search engines

The site is **noindex** while it's pre-launch: every page has `<meta name="robots" content="noindex, nofollow">` and `vercel.json` sends an `X-Robots-Tag: noindex, nofollow` header. At launch, remove both (and don't block crawlers in robots.txt, or they can't see the change).

## Deploy

Vercel project **foodsafetymvp** (team Stratum PR Projects) is connected to this repo; every push to `main` deploys to **https://mvp.stratumpr.com**. It needs Vercel (or another host that runs the `api/` functions); plain static hosting like GitHub Pages would serve the pages but the forms wouldn't work.
