# Backlog

Site work that's known but not done yet. Newest first within each section. Move an item to
"Decided: won't do" (with the reason) rather than deleting it, so it isn't re-raised.

## Next

Nothing queued.

## Fixes

- **Footer year can mismatch after New Year** (`src/components/SiteFooter.jsx`). The year is
  pre-rendered at build time; a page built in 2026 and visited in 2027 makes React log a
  hydration text mismatch and patch it. Fix: set the year in an effect after hydration, or just
  redeploy early in January.
- **Tech toggle hover uses `#fff`** (`src/css/noplan.css`, `.np-tech summary:hover .np-tech-plus`).
  Use `var(--np-bg)` so the palette stays in `--np-*` variables.
- **`SiteNav.jsx` header comment is inaccurate between 601 and 660px.** Roadmap hides at
  <=660px purely for width; the bottom bar (with Send feedback) only hides at <=600px. Reword.

## Later

- **App rich result in Google.** The `MobileApplication` JSON-LD in `index.html` can't get a
  rich result without `aggregateRating` or `review`. Add a real rating once the App Store
  listing has some; never invent one.

## Decided: won't do

- **Put "noplan" back in the nav CTA's `aria-label`.** The label must contain the visible text
  ("Download on the App Store" / "Download") for Voice Control (WCAG 2.5.3); on the site itself
  the product is obvious.
- **Strip the Smart App Banner from `/post` in `pnpm dev` too.** Only the production pre-render
  removes it; it only shows in iOS Safari, so it only matters when screenshotting `/post` from a
  phone against the dev server. Screenshot from `pnpm preview` or production instead.
- **Underline the footer App Store link.** It's styled as a button, like `.np-pill`; the
  "links are underlined" rule is for text links.
