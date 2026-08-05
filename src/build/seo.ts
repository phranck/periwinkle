/**
 * Search-engine and social metadata for the generated pages.
 *
 * One page carries three kinds of address-bound information: where it lives
 * (the canonical link), how it should be presented when shared (Open Graph and
 * Twitter cards), and what it describes (a JSON-LD graph). All three need an
 * absolute address, which only `site.url` supplies, so everything here degrades
 * to the relative subset when that value is absent.
 *
 * The module also emits the two files that speak to crawlers directly,
 * `sitemap.xml` and `robots.txt`.
 */

import type { ResolvedConfig } from "../config/config.js";
import type { DocsData } from "../render/prepare.js";
import { escapeHtml, escapeXml } from "./escape.js";

/** Longest meta description generated from an unset `site.description`. */
const SUMMARY_MAX_LENGTH = 160;

/** Origin of the Google Fonts stylesheet host and the font files it points at. */
const GOOGLE_FONTS_STYLESHEET_ORIGIN = "https://fonts.googleapis.com";
const GOOGLE_FONTS_FILE_ORIGIN = "https://fonts.gstatic.com";

/** One node of the JSON-LD graph, kept loose because schema.org shapes vary. */
export type StructuredDataNode = Record<string, unknown>;

/**
 * The social preview image, already resolved to an absolute URL.
 *
 * Dimensions and media type are optional because they can only be read from a
 * local file the build has access to. Platforms fetch the image when they are
 * missing, so their absence costs a round trip rather than the card itself.
 *
 * @property url Absolute URL of the image.
 * @property alt Alternative text, read out in place of the image.
 * @property width Image width in pixels.
 * @property height Image height in pixels.
 * @property mediaType IANA media type, e.g. `image/png`.
 */
export interface SocialImage {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
  mediaType?: string;
}

/**
 * A machine-readable representation of the same page, offered to clients that
 * prefer it over the HTML document.
 *
 * @property href URL of the alternative representation.
 * @property type Its media type.
 * @property title Human-readable label shown by clients that surface it.
 */
export interface AlternateRepresentation {
  href: string;
  type: string;
  title: string;
}

/**
 * What distinguishes one page of the site from another.
 *
 * @property path Site-relative path of the page, `""` for the site root and
 *   e.g. `"config-builder/"` for a nested index.
 * @property title The document title, reused for the social card headline.
 * @property description Meta description and social card body text.
 */
export interface PageIdentity {
  path: string;
  title: string;
  description: string;
}

/**
 * A page's identity together with everything its head advertises about it.
 *
 * @property structuredData JSON-LD nodes describing this page.
 * @property alternates Machine-readable representations of the page.
 */
export interface PageMetadata extends PageIdentity {
  structuredData: StructuredDataNode[];
  alternates?: AlternateRepresentation[];
}

/**
 * Resolves a site-relative or absolute address against the configured site URL.
 *
 * @param siteUrl The normalized `site.url`, always ending in a slash.
 * @param path A site-relative path, a root-relative path, or an absolute URL.
 * @returns The absolute URL.
 */
export function absoluteUrl(siteUrl: string, path: string): string {
  return new URL(path, siteUrl).href;
}

/**
 * Resolves an asset reference to an absolute URL where that is possible.
 *
 * @param siteUrl The normalized `site.url`, or `undefined` when unconfigured.
 * @param value An absolute URL, a protocol-relative URL, or a site path.
 * @returns The absolute URL, or `undefined` when the value is relative and no
 *   site URL is configured to resolve it against.
 */
export function absoluteAssetUrl(siteUrl: string | undefined, value: string): string | undefined {
  if (/^[a-z][a-z0-9+.-]*:/i.test(value) || value.startsWith("//")) return value;
  return siteUrl ? new URL(value, siteUrl).href : undefined;
}

/**
 * Reduces Markdown to a single line of plain text short enough for a meta
 * description.
 *
 * Search engines and social platforms show roughly 160 characters, so the text
 * is cut at the last word boundary below that and closed with an ellipsis.
 *
 * @param markdown The authored Markdown, typically the spec's `info.description`.
 * @returns The condensed plain-text summary, empty when the input carries no text.
 */
export function summarizeMarkdown(markdown: string): string {
  const text = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_`>#]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= SUMMARY_MAX_LENGTH) return text;
  const cut = text.slice(0, SUMMARY_MAX_LENGTH);
  const lastSpace = cut.lastIndexOf(" ");
  const trimmed = lastSpace > 0 ? cut.slice(0, lastSpace) : cut;
  return `${trimmed.replace(/[\s,;:.]+$/, "")}…`;
}

/**
 * Determines the description of the documentation page.
 *
 * The authored `site.description` wins. Without one the spec's own
 * `info.description` is condensed, and a specification that carries none falls
 * back to a line naming the API and its version.
 *
 * @param data The prepared docs data.
 * @returns The plain-text description.
 */
export function resolveDescription(data: DocsData): string {
  if (data.config.site.description) return data.config.site.description;
  const summary = summarizeMarkdown(data.reference.description ?? "");
  return summary || `API reference for ${data.title}, version ${data.reference.version}.`;
}

/**
 * Builds the `preconnect` hints for the configured font stylesheets.
 *
 * A stylesheet on a foreign origin costs a DNS lookup, a TCP handshake, and a
 * TLS negotiation before the browser learns which font files it needs, and the
 * hint starts all three during HTML parsing. Google's stylesheet host serves
 * only CSS and points at a second origin for the font files, so that one is
 * hinted alongside it, with `crossorigin` because fonts are fetched anonymously.
 *
 * @param stylesheets The configured `theme.fonts.stylesheets` entries.
 * @returns The `<link rel="preconnect">` tags, one per line.
 */
export function renderPreconnectLinks(stylesheets: string[]): string[] {
  const origins: string[] = [];
  for (const href of stylesheets) {
    let origin: string;
    try {
      origin = new URL(href).origin;
    } catch {
      continue;
    }
    if (!origins.includes(origin)) origins.push(origin);
    if (origin === GOOGLE_FONTS_STYLESHEET_ORIGIN && !origins.includes(GOOGLE_FONTS_FILE_ORIGIN)) {
      origins.push(GOOGLE_FONTS_FILE_ORIGIN);
    }
  }
  return origins.map((origin) =>
    origin === GOOGLE_FONTS_FILE_ORIGIN
      ? `<link rel="preconnect" href="${escapeHtml(origin)}" crossorigin>`
      : `<link rel="preconnect" href="${escapeHtml(origin)}">`,
  );
}

function metaTag(kind: "name" | "property", key: string, value: string): string {
  return `<meta ${kind}="${key}" content="${escapeHtml(value)}">`;
}

/**
 * Renders the head metadata of one page.
 *
 * @param data The prepared docs data, supplying the site config and palette.
 * @param page The page's own identity, see {@link PageMetadata}.
 * @param image The resolved social preview image, when the site has one.
 * @returns The metadata tags, one per line and without indentation.
 */
export function renderSeoTags(data: DocsData, page: PageMetadata, image?: SocialImage): string[] {
  const { site } = data.config;
  const canonical = site.url ? absoluteUrl(site.url, page.path) : undefined;
  const tags: string[] = [];

  if (canonical) tags.push(`<link rel="canonical" href="${escapeHtml(canonical)}">`);
  tags.push(metaTag("name", "description", page.description));
  tags.push(metaTag("name", "robots", site.robots));
  tags.push(metaTag("name", "generator", "periwinkle"));

  // Both palettes are compiled into the page, so the browser chrome is told
  // which colour belongs to which scheme instead of guessing from one value.
  tags.push('<meta name="color-scheme" content="light dark">');
  tags.push(
    `<meta name="theme-color" content="${escapeHtml(data.config.theme.colors.light.background)}" media="(prefers-color-scheme: light)">`,
  );
  tags.push(
    `<meta name="theme-color" content="${escapeHtml(data.config.theme.colors.dark.background)}" media="(prefers-color-scheme: dark)">`,
  );

  tags.push(metaTag("property", "og:type", "website"));
  tags.push(metaTag("property", "og:site_name", data.title));
  tags.push(metaTag("property", "og:title", page.title));
  tags.push(metaTag("property", "og:description", page.description));
  tags.push(metaTag("property", "og:locale", site.language.replace(/-/g, "_")));
  if (canonical) tags.push(metaTag("property", "og:url", canonical));
  if (image) {
    tags.push(metaTag("property", "og:image", image.url));
    if (image.mediaType) tags.push(metaTag("property", "og:image:type", image.mediaType));
    if (image.width) tags.push(metaTag("property", "og:image:width", String(image.width)));
    if (image.height) tags.push(metaTag("property", "og:image:height", String(image.height)));
    if (image.alt) tags.push(metaTag("property", "og:image:alt", image.alt));
  }

  tags.push(metaTag("name", "twitter:card", image ? "summary_large_image" : "summary"));
  tags.push(metaTag("name", "twitter:title", page.title));
  tags.push(metaTag("name", "twitter:description", page.description));
  if (image) {
    tags.push(metaTag("name", "twitter:image", image.url));
    if (image.alt) tags.push(metaTag("name", "twitter:image:alt", image.alt));
  }

  for (const alternate of page.alternates ?? []) {
    tags.push(
      `<link rel="alternate" type="${escapeHtml(alternate.type)}" href="${escapeHtml(alternate.href)}" title="${escapeHtml(alternate.title)}">`,
    );
  }

  const jsonLd = renderStructuredData(page.structuredData);
  if (jsonLd) tags.push(jsonLd);
  return tags;
}

/**
 * Serializes the JSON-LD graph into a script element.
 *
 * `<` is written as its JSON escape so a string inside the data can never close
 * the surrounding element.
 *
 * @param nodes The graph nodes, empty when the site has no absolute address.
 * @returns The script element, or an empty string for an empty graph.
 */
export function renderStructuredData(nodes: StructuredDataNode[]): string {
  if (nodes.length === 0) return "";
  const graph = JSON.stringify({ "@context": "https://schema.org", "@graph": nodes }).replace(
    /</g,
    "\\u003c",
  );
  return `<script type="application/ld+json">${graph}</script>`;
}

/**
 * Describes the documentation page as a schema.org `APIReference` belonging to
 * the site it is part of.
 *
 * @param data The prepared docs data.
 * @param page The page's identity.
 * @param image The resolved social preview image, when the site has one.
 * @returns The graph nodes, empty when `site.url` is unset, because every node
 *   is identified by its address.
 */
export function referenceStructuredData(
  data: DocsData,
  page: PageIdentity,
  image?: SocialImage,
): StructuredDataNode[] {
  const { site } = data.config;
  if (!site.url) return [];
  const canonical = absoluteUrl(site.url, page.path);
  return [
    websiteNode(data, site.url),
    {
      "@type": "APIReference",
      "@id": `${canonical}#reference`,
      url: canonical,
      name: page.title,
      headline: page.title,
      description: page.description,
      version: data.reference.version,
      inLanguage: site.language,
      isPartOf: { "@id": `${site.url}#website` },
      mainEntityOfPage: { "@id": canonical },
      ...(image ? { image: image.url } : {}),
    },
  ];
}

/**
 * Describes the configuration builder as a browser application, and the trail
 * that leads to it from the reference.
 *
 * @param data The prepared docs data.
 * @param page The builder page's identity.
 * @returns The graph nodes, empty when `site.url` is unset.
 */
export function builderStructuredData(data: DocsData, page: PageIdentity): StructuredDataNode[] {
  const { site } = data.config;
  if (!site.url) return [];
  const canonical = absoluteUrl(site.url, page.path);
  return [
    websiteNode(data, site.url),
    {
      "@type": "WebApplication",
      "@id": `${canonical}#application`,
      url: canonical,
      name: page.title,
      description: page.description,
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Any",
      browserRequirements: "Requires JavaScript",
      inLanguage: site.language,
      isPartOf: { "@id": `${site.url}#website` },
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${canonical}#breadcrumbs`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: data.title, item: site.url },
        { "@type": "ListItem", position: 2, name: page.title, item: canonical },
      ],
    },
  ];
}

function websiteNode(data: DocsData, siteUrl: string): StructuredDataNode {
  return {
    "@type": "WebSite",
    "@id": `${siteUrl}#website`,
    url: siteUrl,
    name: data.title,
    description: resolveDescription(data),
    inLanguage: data.config.site.language,
  };
}

/**
 * Renders the sitemap listing every page of the site.
 *
 * Only `lastmod` accompanies each address: search engines ignore `changefreq`
 * and `priority`, so writing them would state something no reader acts on.
 *
 * @param config The resolved configuration; `site.url` must be set.
 * @param paths Site-relative paths of the generated pages.
 * @param lastModified Timestamp written as each entry's `lastmod` date.
 * @returns The complete `sitemap.xml` text.
 */
export function renderSitemap(config: ResolvedConfig, paths: string[], lastModified: Date): string {
  const siteUrl = config.site.url;
  if (!siteUrl) return "";
  const day = lastModified.toISOString().slice(0, 10);
  const entries = [...paths, ...config.site.extraSitemapPaths].map((path) => {
    const location = escapeXml(absoluteUrl(siteUrl, path));
    return `  <url>\n    <loc>${location}</loc>\n    <lastmod>${day}</lastmod>\n  </url>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</urlset>\n`;
}

/**
 * Renders the crawler instructions.
 *
 * A site whose `site.robots` asks for `noindex` disallows crawling outright, so
 * the file and the meta tag can never tell a crawler two different things.
 *
 * @param config The resolved configuration; `site.url` must be set.
 * @returns The complete `robots.txt` text.
 */
export function renderRobotsTxt(config: ResolvedConfig): string {
  const siteUrl = config.site.url;
  if (!siteUrl) return "";
  const indexable = !/\bnoindex\b/i.test(config.site.robots);
  const rule = indexable ? "Allow: /" : "Disallow: /";
  const sitemap = indexable ? `\nSitemap: ${absoluteUrl(siteUrl, "sitemap.xml")}\n` : "";
  return `User-agent: *\n${rule}\n${sitemap}`;
}
