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
js/pricing.js              price math + sample catalog (self-check results only)
js/autoevaluacion.js       self-check: questions, scoring, results. TEST_MODE / SUBMIT_URL at the top
js/legal.js                shows the ES or EN block on the legal pages
assets/                    logos, favicon, fonts, texture tile
```

## Run locally

```bash
python -m http.server 5173
```

Then open http://localhost:5173.

## Before launch

1. **Form endpoints:** set `signupEndpoint`, `contactEndpoint` and `guideEndpoint` in `js/main.js`, and `SUBMIT_URL` plus `TEST_MODE = false` in `js/autoevaluacion.js`. While `guideEndpoint` is empty, the guide still unlocks but the leads are **not saved** (there's a console warning).
2. **Legal pages:** fill in every highlighted `[placeholder]` (legal entity name, address, privacy email, hosting and form providers, EU representative if applicable, governing law), have an attorney review all three pages, and then remove the "Borrador para revisión legal" notes.
3. **Industry insights:** the hero card's numbers live in `INSIGHTS` in `js/main.js`. Add a source for them (a survey or report) before launch.
4. **Adding analytics later:** add an `analytics` category to `js/consent.js`, load the script only after `StratumConsent.allows("analytics")`, list it in `cookies.html`, and bump `POLICY_VERSION` so everyone is asked again.

## Deploy

- **GitHub Pages:** Settings → Pages → Source: `Deploy from a branch` → `main` / `(root)`.
- **Vercel / Netlify:** import the repo. Choose no framework, no build command, and `.` as the output directory.
