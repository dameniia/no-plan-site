// Runs after the client and SSR builds: renders every page in src/routes.js to a
// static HTML file in dist/, so crawlers and AI agents that don't run JavaScript
// see the full text. The browser bundle then hydrates that markup.
import { readFile, writeFile, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const ssrDir = path.join(root, "dist-ssr");
const SITE = "https://no-plan.app";

const { render, PAGES } = await import(path.join(ssrDir, "entry-server.js"));
const template = await readFile(path.join(dist, "index.html"), "utf8");

const escape = (s) =>
  s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function replaceOnce(html, pattern, replacement, what) {
  if (!pattern.test(html)) throw new Error(`prerender: ${what} not found in dist/index.html`);
  return html.replace(pattern, replacement);
}

for (const page of PAGES) {
  let html = template;
  html = replaceOnce(html, /<title>[^<]*<\/title>/, `<title>${escape(page.title)}</title>`, "<title>");
  html = replaceOnce(
    html,
    /<meta name="description" content="[^"]*" \/>/,
    `<meta name="description" content="${escape(page.description)}" />`,
    "meta description"
  );
  html = replaceOnce(
    html,
    /<link rel="canonical" href="[^"]*" \/>/,
    page.noindex
      ? `<meta name="robots" content="noindex" />`
      : `<link rel="canonical" href="${SITE}${page.path === "/" ? "/" : page.path}" />`,
    "canonical link"
  );
  if (page.noAppBanner) {
    html = replaceOnce(html, /\s*<meta name="apple-itunes-app" content="[^"]*" \/>/, "", "apple-itunes-app meta");
  }
  html = replaceOnce(html, /<div id="root"><\/div>/, `<div id="root">${render(page.path)}</div>`, "#root");

  await writeFile(path.join(dist, page.file), html);
  console.log(`prerendered ${page.path.padEnd(10)} -> dist/${page.file}`);
}

await rm(ssrDir, { recursive: true, force: true });
