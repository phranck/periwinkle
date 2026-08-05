/**
 * HTML document assembly for the generated site.
 *
 * Wraps the statically rendered page body in a complete HTML document:
 * meta tags, search-engine and social metadata, favicon and font links, the
 * compiled theme variables (inlined so the palette needs no extra request), the
 * stylesheet link, an early theme script that applies the stored/preferred
 * scheme before first paint, and the deferred client bundle.
 */

import type { ThemeMode } from "../config/config.js";
import { compileThemeCss } from "../config/theme-css.js";
import type { DocsData } from "../render/prepare.js";
import { escapeHtml } from "./escape.js";
import {
  builderStructuredData,
  type PageIdentity,
  type PageMetadata,
  referenceStructuredData,
  renderPreconnectLinks,
  renderSeoTags,
  resolveDescription,
  type SocialImage,
} from "./seo.js";

/**
 * Site-relative names of the assets a generated document links to.
 *
 * @property stylesheet File name of the emitted stylesheet.
 * @property clientScript File name of the deferred bundle the page loads.
 * @property favicon Already base-path-prefixed favicon URL, when configured.
 * @property socialImage The resolved social preview image, when configured.
 */
export interface DocumentAssets {
  stylesheet: string;
  clientScript: string;
  favicon?: string;
  socialImage?: SocialImage;
}

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

/**
 * Builds the script that runs before first paint to avoid a light/dark flash.
 *
 * A visitor's stored choice always wins. Without one, the site's configured
 * default applies, and only `system` consults the OS preference.
 *
 * @param defaultMode The configured `theme.defaultMode`.
 * @returns The inline script source.
 */
function earlyThemeScript(defaultMode: ThemeMode): string {
  return `(function(){try{var t=localStorage.getItem("periwinkle:theme");if(t!=="dark"&&t!=="light"){t=${JSON.stringify(defaultMode)}}if(t==="system"){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.dataset.theme=t}catch(e){}})();`;
}

/**
 * Assembles a complete HTML document.
 *
 * Both generated pages share this chrome, comprising the metadata block, the
 * favicon, the font stylesheets and their preconnect hints, the compiled theme
 * variables, the early theme script, and the main stylesheet, so the two routes
 * look and behave like one site. Only the page identity, the body markup, and
 * the loaded client bundle differ.
 *
 * @param data Prepared docs data (title, theme, font stylesheets).
 * @param page The page's own identity, see {@link PageMetadata}.
 * @param bodyHtml Statically rendered page body markup.
 * @param assets See {@link DocumentAssets}.
 * @returns The full HTML document text.
 */
function renderDocument(
  data: DocsData,
  page: PageMetadata,
  bodyHtml: string,
  assets: DocumentAssets,
): string {
  const { basePath, language } = data.config.site;
  const themeCss = compileThemeCss(data.config);
  const head = [
    `<title>${escapeHtml(page.title)}</title>`,
    ...renderSeoTags(data, page, assets.socialImage),
    ...(assets.favicon ? [`<link rel="icon" href="${escapeHtml(assets.favicon)}">`] : []),
    ...renderPreconnectLinks(data.config.theme.fonts.stylesheets),
    ...data.config.theme.fonts.stylesheets.map(
      (href) => `<link rel="stylesheet" href="${escapeHtml(href)}">`,
    ),
  ].join("\n    ");

  return `<!doctype html>
<html lang="${escapeHtml(language)}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    ${head}
    <script>${earlyThemeScript(data.config.theme.defaultMode)}</script>
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

/**
 * Assembles the documentation page, emitted as `index.html`.
 *
 * @param data Prepared docs data (title, theme, font stylesheets).
 * @param bodyHtml Statically rendered page body markup.
 * @param assets See {@link DocumentAssets}.
 * @returns The full HTML document text.
 */
export function renderHtmlDocument(
  data: DocsData,
  bodyHtml: string,
  assets: DocumentAssets,
): string {
  const identity: PageIdentity = {
    path: "",
    title: data.title,
    description: resolveDescription(data),
  };
  return renderDocument(
    data,
    {
      ...identity,
      structuredData: referenceStructuredData(data, identity, assets.socialImage),
      alternates: [
        {
          href: withBase(data.config.site.basePath, "openapi.json"),
          type: "application/json",
          title: "OpenAPI contract",
        },
      ],
    },
    bodyHtml,
    assets,
  );
}

/**
 * Assembles the configuration-builder document, emitted as
 * `config-builder/index.html`.
 *
 * @param data Prepared docs data (title, theme, font stylesheets).
 * @param bodyHtml Statically rendered configuration-builder markup.
 * @param assets See {@link DocumentAssets}, with the builder's own client
 *   bundle as `clientScript`.
 * @returns The full HTML document text.
 */
export function renderBuilderDocument(
  data: DocsData,
  bodyHtml: string,
  assets: DocumentAssets,
): string {
  const identity: PageIdentity = {
    path: "config-builder/",
    title: `Configuration builder for ${data.title}`,
    description: `Assemble a periwinkle.config.ts for ${data.title} in the browser, with a live preview of the palette, fonts, and layout.`,
  };
  return renderDocument(
    data,
    { ...identity, structuredData: builderStructuredData(data, identity) },
    bodyHtml,
    assets,
  );
}
