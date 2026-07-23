/**
 * HTML document assembly for the generated site.
 *
 * Wraps the statically rendered page body in a complete HTML document:
 * meta tags, favicon and font links, the compiled theme variables (inlined
 * so the palette needs no extra request), the stylesheet link, an early
 * theme script that applies the stored/preferred scheme before first paint,
 * and the deferred client bundle.
 */

import { compileThemeCss } from "../config/theme-css.js";
import type { DocsData } from "../render/prepare.js";

/**
 * Applies the configured base path to a site-relative asset path.
 *
 * @param basePath The site base path, e.g. `/` or `/docs`.
 * @param path Asset path relative to the site root, e.g. `styles.css`.
 * @returns The absolute URL path, e.g. `/docs/styles.css`.
 */
export function withBase(basePath: string, path: string): string {
  const base = basePath.endsWith("/") ? basePath : `${basePath}/`;
  return `${base}${path.replace(/^\/+/, "")}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Runs before first paint to avoid a light/dark flash: applies the stored
 * explicit theme, falling back to the OS preference.
 */
const EARLY_THEME_SCRIPT =
  '(function(){try{var t=localStorage.getItem("periwinkle:theme");if(t!=="dark"&&t!=="light"){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.dataset.theme=t}catch(e){}})();';

/**
 * Assembles the complete `index.html` document.
 *
 * @param data Prepared docs data (title, theme, font stylesheets).
 * @param bodyHtml Statically rendered page body markup.
 * @param assets Site-relative file names of the emitted assets.
 * @returns The full HTML document text.
 */
export function renderHtmlDocument(
  data: DocsData,
  bodyHtml: string,
  assets: { stylesheet: string; clientScript: string; favicon?: string },
): string {
  const { basePath } = data.config.site;
  const themeCss = compileThemeCss(data.config);
  const fontLinks = data.config.theme.fonts.stylesheets
    .map((href) => `<link rel="stylesheet" href="${escapeHtml(href)}">`)
    .join("\n    ");
  const faviconLink = assets.favicon
    ? `<link rel="icon" href="${escapeHtml(assets.favicon)}">`
    : "";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(data.title)}</title>
    <meta name="description" content="${escapeHtml(`API reference for ${data.title}, version ${data.reference.version}.`)}">
    <meta name="generator" content="periwinkle">
    ${faviconLink}
    ${fontLinks}
    <script>${EARLY_THEME_SCRIPT}</script>
    <link rel="stylesheet" href="${escapeHtml(withBase(basePath, assets.stylesheet))}">
    <style>
${themeCss}    </style>
  </head>
  <body>
    ${bodyHtml}
    <script defer src="${escapeHtml(withBase(basePath, assets.clientScript))}"></script>
  </body>
</html>
`;
}
