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

React 18 + React Router 7 + Vite (SWC), pnpm, no TypeScript. Routes (`src/App.jsx`): `/` product page (`src/pages/NoPlan.jsx`), `/feedback` (`src/pages/Feedback.jsx`) and `/post` (a 1200x627 canvas used to screenshot a LinkedIn post). Styles are global: `src/css/noplan.css` owns the whole palette via `--np-*` variables on `.np-root` (light Apple-style, not the app's monochrome UI); `src/index.css` is only a minimal reset. Hero video and screenshots are hosted on Cloudinary; the app icon and SVGs are in `public/images/`. Links back to the portfolio are plain `<a>` to https://adameniia.com.

Copy that mirrors the app (feature list, tech stack, roadmap phases in `NoPlan.jsx`) should be updated when the app's `docs/BACKLOG.md` / roadmap changes.

## Feedback form

`/feedback` posts JSON to `public/api/feedback.php` (deployed to `/api/feedback.php`), which emails **admin@no-plan.app** with PHP `mail()`. Fields: category, message (5-4000 chars), optional email (used as Reply-To). Protections: same-origin check, hidden `website` honeypot, per-visitor (5/h) and global (60/h) rate limits keyed on a hashed IP in the system temp dir. Nothing else is stored. Client logic and error copy live in `src/lib/sendFeedback.js`; the PHP error codes map to those messages, so change both together. Vite's dev server doesn't run PHP (and PHP isn't installed on the dev Mac), so `vite.config.js` has a dev-only `feedbackDevMock` plugin that answers `/api/feedback.php` with the same validation and JSON but only logs the message to the terminal (nothing is emailed; it is not part of the production build). If you change validation rules in `feedback.php`, mirror them in the mock. The real PHP and the email are only exercised on production (a successful test sends a real email to admin@).

## Deployment (Hostinger FTP — read before touching)

GitHub Actions (`.github/workflows/deploy.yml`) builds and uploads `dist/` on every push to `main`.

- The FTP account is `u103061112.no-plan.app`. Its home is `domains/no-plan.app/` and the web root is `public_html`, so the workflow uses the **absolute** `server-dir: /public_html/`. A relative `public_html/` nests into `public_html/public_html`; `/` writes above the web root. Both report green but nothing changes.
- Host (`FTP_SERVER`) is the bare IP `82.29.87.30`, no `ftp://`. Secrets are per repo: set them in the GitHub UI, or `gh secret set` after `cd`-ing into this repo (`gh` acts on the current repo — it once overwrote personal-site's secrets).
- `ECONNRESET (data socket)` is common and transient: re-run the job once before debugging.
- `public/.htaccess` does the SPA fallback and sends `Cache-Control: no-cache` for HTML. Hostinger's CDN (`server: hcdn`) previously cached a WordPress placeholder for 7 days; if the plain URL looks wrong but `?x=$RANDOM` is right, purge the cache in hPanel.
- Use the `verify-deploy` skill after every deploy. A workflow change needs a new commit on `main` (re-running an old run replays the old workflow).
- Docs-only commits to `main` also trigger a deploy (a no-op upload).

## Conventions

Named exports for components, PropTypes on components with props, `pnpm` only, PascalCase components, lowercase CSS file names. Branch off `main` for anything beyond a docs tweak.
