# Stratum PR · FSQMS site

Bilingual (ES/EN) marketing site for Stratum PR LLC: landing page, the Walmart self-check
("autoevaluación") with its passport results, and legal pages. Read `README.md` for setup,
the form/email flow and environment variables.

## Working rules
- **Never push to GitHub unless the user explicitly says so.** Pushing to `main` deploys to
  production. Commit locally, show the changes, and wait for the go-ahead.
- Commit as the repo-local git user (`j.rodriguez@stratumpr.com`) and end commit messages
  with the `Co-Authored-By` line.
- The repo is **public**: never commit keys, secrets or personal emails.
- The user reviews visually: preview changes locally before proposing a push.
- Spanish is the primary language; every user-facing string also needs its English version.

## Stack
- Static HTML/CSS/JS, no build step, no npm dependencies. Language is toggled client-side (`data-i18n`).
- `/api/*.js` are Vercel Node serverless functions (CommonJS). `_`-prefixed files are not routes.
  `api/_lib.js` is the only file that talks to Resend (to be swapped for Azure later).
- `js/selfcheck-data.js` and `js/guide.js` are UMD files shared by the browser and the API.
  The server builds the passport email from item keys only, never from client-sent text.

## Hosting and services
- GitHub `Stratum-PR/FoodSafetyMVP` (public) → Vercel project `foodsafetymvp`
  (team `team_6GFJ8BJXaSAgrWrcb4m54NeX`) → https://mvp.stratumpr.com
- Resend sends all email from `noreply@stratumpr.com`; leads go to `contact@stratumpr.com`.
- The `RESEND_API_KEY` in Vercel must have **Full access**. A "Sending access" key sends
  mail but can't save contacts.
- Resend Audiences no longer exist. Confirmed newsletter subscribers (double opt-in) go
  to Contacts, in the segment **Food Safety MVP** (found by name).
- The secrets (`RESEND_API_KEY`, `CONFIRM_SECRET`) are set by the user in Vercel. Vercel
  can't read GitHub repo secrets.

## Status and decisions
- **Pre-launch: the whole site is `noindex`**, via meta tags and the `X-Robots-Tag` header in
  `vercel.json`. Keep it until the user says to launch.
- The SEO / AI-visibility plan is deliberately on hold until launch. Planned:
  - real `/en/` URLs with `hreflang`
  - sitemap, `robots.txt`, canonical tags, `og:image`
  - JSON-LD structured data
  - content pages built from the official-links guide
- The email footer and legal pages list Stratum PR LLC in Trujillo Alto, Puerto Rico.
  Newsletters sent from Resend Broadcasts need a full postal address to comply with CAN-SPAM.
- On the self-check:
  - it opens straight on step 1
  - contact details are asked at the end, right before the passport
  - the cost calculator shows for every pricing answer except "Sí"

## Local preview
`.claude/` is git-ignored, so the local dev server (`.claude/devserver.js`) only exists on the
original machine. It serves the site on http://localhost:5173 with no caching and runs `/api`
locally. Without `RESEND_API_KEY`, emails are written to `.claude/outbox`, browsable at `/__outbox`.
On a fresh clone, recreate a small Node server that does the same.
