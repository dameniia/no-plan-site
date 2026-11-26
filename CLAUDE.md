# CLAUDE.md

Marketing site for the **noplan** iOS app, live at https://no-plan.app. Moved here from adameniia.com/noplan (which now 301s to this site). The app itself lives in a separate private repo (`dameniia/no-plan-app`); never copy app code or the licensed exercise drawings into this repo — it is public.

## Commands

```bash
pnpm dev        # Vite dev server
pnpm build      # production build -> dist/
pnpm preview
pnpm lint
```

## Stack and structure

React 18 + React Router 7 + Vite (SWC), pnpm, no TypeScript. `pnpm build` also pre-renders every page to static HTML (`src/entry-server.jsx` + `scripts/prerender.js`, driven by the page list and per-page `<title>`/description in `src/routes.js`) so crawlers and AI agents that don't run JavaScript see the content; `main.jsx` hydrates that markup. Components must therefore render the same on the server and in the browser: touch `window`/`document` only inside effects. `index.html` holds the site's JSON-LD (Organization, WebSite, MobileApplication). Routes (`src/App.jsx`): `/` product page (`src/pages/NoPlan.jsx`), `/feedback` (`src/pages/Feedback.jsx`), `/faq` (`src/pages/Faq.jsx` — answers mirror app facts: min iOS, exercise count, AI providers, what leaves the device; keep in step with the app and `/privacy`), `/privacy` (`src/pages/Privacy.jsx` — the app's privacy policy, linked from the app and App Store Connect; it mirrors `docs/PRIVACY-POLICY.md` in the app repo, so change both together) and `/post` (a 1200x627 canvas used to screenshot a LinkedIn post). Styles are global: `src/css/noplan.css` owns the whole palette via `--np-*` variables on `.np-root` (the app's monochrome palette: black and white, no accent colour; links are underlined rather than coloured. Token values mirror `AppColors` in the app repo). The look is deliberately not Apple's: Archivo variable (`@fontsource-variable/archivo`, imported in `main.jsx`) with condensed heavy widths for headings and numbers, hard corners via `--np-r-sm` (4px) and `--np-r` (10px) instead of pills, and ink rules/borders instead of frosted glass and soft shadows; `src/index.css` is only a minimal reset. Hero video and screenshots are hosted on Cloudinary; the app icon and SVGs are in `public/images/`. Links back to the portfolio are plain `<a>` to https://adameniia.com. The app is live on the App Store as **noplan Fitness** (id `6838410863`, free): `src/lib/appStore.js` holds the link used by the nav CTA, hero, bottom bar, footer and FAQ; the same id is hard-coded in `index.html` (Smart App Banner `apple-itunes-app` meta and the MobileApplication JSON-LD) and `public/llms.txt`.

The product page has a parody "Loved by influencers (who don't exist)" section (`src/components/InfluencerReel.jsx`, personas in `src/data/influencers.js`, portraits in `public/images/influencers/`, generated with Higgsfield). Every persona is fictional and AI-generated: keep the disclosure in the heading and the "AI-generated" badge on every card, keep the quotes obviously over the top, never resemble a real creator or name a competitor, and don't reuse these images outside that labelled section (App Store, ads, `/post`).

Copy that mirrors the app (feature list, tech stack, roadmap phases in `NoPlan.jsx`) should be updated when the app's `docs/BACKLOG.md` / roadmap changes.

## Feedback form

`/feedback` posts JSON to `public/api/feedback.php` (deployed to `/api/feedback.php`), which emails **admin@no-plan.app** with PHP `mail()`. Fields: category, message (5-4000 chars), optional email (used as Reply-To). Protections: same-origin check, hidden `website` honeypot, per-visitor (5/h) and global (60/h) rate limits keyed on a hashed IP in the system temp dir. Nothing else is stored. Client logic and error copy live in `src/lib/sendFeedback.js`; the PHP error codes map to those messages, so change both together. Vite's dev server doesn't run PHP (and PHP isn't installed on the dev Mac), so `vite.config.js` has a dev-only `feedbackDevMock` plugin that answers `/api/feedback.php` with the same validation and JSON but only logs the message to the terminal (nothing is emailed; it is not part of the production build). If you change validation rules in `feedback.php`, mirror them in the mock. The real PHP and the email are only exercised on production (a successful test sends a real email to admin@).

## Deployment (Hostinger FTP — read before touching)

GitHub Actions (`.github/workflows/deploy.yml`) builds and uploads `dist/` on every push to `main`.

- The FTP account is `u103061112.no-plan.app`. Its home is `domains/no-plan.app/` and the web root is `public_html`, so the workflow uses the **absolute** `server-dir: /public_html/`. A relative `public_html/` nests into `public_html/public_html`; `/` writes above the web root. Both report green but nothing changes.
- Host (`FTP_SERVER`) is the bare IP `82.29.87.30`, no `ftp://`. Secrets are per repo: set them in the GitHub UI, or `gh secret set` after `cd`-ing into this repo (`gh` acts on the current repo — it once overwrote personal-site's secrets).
- `ECONNRESET (data socket)` is common and transient: re-run the job once before debugging.
- `public/.htaccess` serves real files as-is, maps the listed routes (`feedback|faq|privacy|post`) to their pre-rendered `<route>.html`, and answers everything else with a real 404 (body is the pre-rendered `404.html`). It also sends a `Link` header pointing at `/llms.txt` on the homepage. **A new route goes in `src/App.jsx`, `src/routes.js` and that RewriteRule list**, or it 404s on production (the Vite dev server doesn't read `.htaccess`, so it works locally). It also sends `Cache-Control: no-cache` for HTML. `public/robots.txt`, `sitemap.xml` and `llms.txt` list the public pages: update them with the routes too. Hostinger's CDN (`server: hcdn`) previously cached a WordPress placeholder for 7 days; if the plain URL looks wrong but `?x=$RANDOM` is right, purge the cache in hPanel.
- Use the `verify-deploy` skill after every deploy. A workflow change needs a new commit on `main` (re-running an old run replays the old workflow).
- Docs-only commits to `main` also trigger a deploy (a no-op upload).

## Conventions

Named exports for components, PropTypes on components with props, `pnpm` only, PascalCase components, lowercase CSS file names. Branch off `main` for anything beyond a docs tweak.
