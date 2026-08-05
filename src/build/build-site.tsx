/**
 * Site build orchestration.
 *
 * `buildSite()` turns an OpenAPI document plus a resolved config into a
 * self-contained static site: `index.html`, `styles.css`, `client.js`,
 * `openapi.json`, and any local logo, favicon, or social-image assets. A site
 * that knows its own address (`site.url`) also gets `sitemap.xml` and
 * `robots.txt`. Every failure (missing spec, invalid document, unreadable
 * assets) throws with a clear message, because a broken input must never
 * produce a silently wrong site.
 */

import {
  closeSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  readSync,
  writeFileSync,
} from "node:fs";
import { basename, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { parse as parseYaml } from "yaml";

import { ApiDocs } from "../components/ApiDocs.jsx";
import { ConfigBuilder } from "../components/ConfigBuilder.jsx";
import type { ResolvedConfig } from "../config/config.js";
import { highlightCode } from "../render/highlight.js";
import { prepareDocsData } from "../render/prepare.js";
import { renderBuilderDocument, renderHtmlDocument, withBase } from "./html.js";
import { absoluteAssetUrl, renderRobotsTxt, renderSitemap, type SocialImage } from "./seo.js";

/**
 * Options for one site build.
 *
 * @property specPath Path to the OpenAPI document (JSON or YAML). Overrides
 *   the config's `spec` value when set.
 * @property outDir Output directory, created when missing.
 * @property config The resolved periwinkle configuration.
 * @property cwd Base directory for relative path resolution.
 * @property assetPaths Overrides for the packaged stylesheet and client
 *   bundle, used by tests and unusual embedding setups. Defaults to the
 *   files shipped next to the compiled package entry.
 */
export interface BuildSiteOptions {
  specPath?: string;
  outDir: string;
  config: ResolvedConfig;
  cwd?: string;
  assetPaths?: {
    stylesCss: string;
    clientJs: string;
    /**
     * Path to the pre-built config-builder client bundle. Optional so
     * tests can inject a lightweight stub; the packaged build resolves
     * it next to the compiled entry.
     */
    configBuilderJs?: string;
  };
}

/**
 * Result summary of a completed build.
 *
 * @property outDir Absolute output directory.
 * @property files Site-relative names of every written file.
 */
export interface BuildSiteResult {
  outDir: string;
  files: string[];
}

function packagedAssetPaths(): {
  stylesCss: string;
  clientJs: string;
  configBuilderJs: string;
} {
  return {
    stylesCss: fileURLToPath(new URL("./styles.css", import.meta.url)),
    clientJs: fileURLToPath(new URL("./client.js", import.meta.url)),
    configBuilderJs: fileURLToPath(new URL("./config-builder.js", import.meta.url)),
  };
}

function readSpec(specPath: string): unknown {
  if (!existsSync(specPath)) {
    throw new Error(`OpenAPI spec not found: ${specPath}`);
  }
  const raw = readFileSync(specPath, "utf8");
  const extension = extname(specPath).toLowerCase();
  try {
    return extension === ".yaml" || extension === ".yml" ? parseYaml(raw) : JSON.parse(raw);
  } catch (error) {
    throw new Error(
      `Failed to parse OpenAPI spec ${specPath}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

function isLocalAssetPath(value: string): boolean {
  return !/^([a-z]+:)?\/\//i.test(value) && !value.startsWith("data:") && !value.startsWith("/");
}

/** Media types of the image formats a social preview may use. */
const IMAGE_MEDIA_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

/** Byte length of a PNG signature plus the IHDR chunk header and its dimensions. */
const PNG_HEADER_LENGTH = 24;
const PNG_SIGNATURE = "\x89PNG\r\n\x1a\n";

/**
 * Reads the pixel dimensions of a PNG file.
 *
 * A PNG states its width and height in the IHDR chunk, which the format
 * requires to come first, so the first 24 bytes are enough and the image never
 * has to be decoded. Other formats return nothing, and the social card then
 * omits the dimension hints.
 *
 * @param file Absolute path of the image file.
 * @returns The dimensions, or `undefined` when the file is not a PNG.
 */
function readPngSize(file: string): { width: number; height: number } | undefined {
  const header = Buffer.alloc(PNG_HEADER_LENGTH);
  const handle = openSync(file, "r");
  let read: number;
  try {
    read = readSync(handle, header, 0, PNG_HEADER_LENGTH, 0);
  } finally {
    closeSync(handle);
  }
  if (read < PNG_HEADER_LENGTH || header.toString("latin1", 0, 8) !== PNG_SIGNATURE) {
    return undefined;
  }
  return { width: header.readUInt32BE(16), height: header.readUInt32BE(20) };
}

/**
 * Builds the static documentation site.
 *
 * @param options See {@link BuildSiteOptions}.
 * @returns The {@link BuildSiteResult} with the emitted file list.
 * @throws Error for missing/invalid specs, unreadable assets, or a missing
 *   packaged stylesheet/client bundle.
 */
export async function buildSite(options: BuildSiteOptions): Promise<BuildSiteResult> {
  const cwd = options.cwd ?? process.cwd();
  const config = options.config;

  const specPath = options.specPath ?? config.spec;
  if (!specPath) {
    throw new Error("No OpenAPI spec given: pass --spec or set `spec` in periwinkle.config.");
  }
  const resolvedSpecPath = resolve(cwd, specPath);
  const document = readSpec(resolvedSpecPath);

  const assets = options.assetPaths ?? packagedAssetPaths();
  for (const [label, path] of [
    ["stylesheet", assets.stylesCss],
    ["client bundle", assets.clientJs],
  ] as const) {
    if (!existsSync(path)) {
      throw new Error(`periwinkle ${label} missing at ${path}. Is the package built?`);
    }
  }
  // The builder page is opt-in (`features.configBuilder`, default false): a
  // published API reference should not ship the tool that authors its own
  // config. The bundle path is additionally optional at test time, so tests
  // can omit it to skip the second page.
  const configBuilderJs = config.features.configBuilder ? assets.configBuilderJs : undefined;
  if (configBuilderJs && !existsSync(configBuilderJs)) {
    throw new Error(
      `periwinkle config-builder bundle missing at ${configBuilderJs}. Is the package built?`,
    );
  }

  const outDir = resolve(cwd, options.outDir);
  mkdirSync(outDir, { recursive: true });
  const files: string[] = [];

  // Local logo/favicon/social-image files are copied into the site and
  // referenced by their base name; URLs and absolute paths pass through
  // untouched. One file may be configured in several places, e.g. as both the
  // navigation logo and the favicon, so each source is copied and listed once.
  const siteConfig = structuredClone(config);
  const bundledAssets = new Map<string, string>();
  const bundleLocalAsset = (value: string | undefined, label: string): string | undefined => {
    if (!value || !isLocalAssetPath(value)) return undefined;
    const source = resolve(cwd, value);
    const alreadyBundled = bundledAssets.get(source);
    if (alreadyBundled) return alreadyBundled;
    if (!existsSync(source)) {
      throw new Error(`Configured ${label} not found: ${source}`);
    }
    const fileName = basename(source);
    copyFileSync(source, resolve(outDir, fileName));
    files.push(fileName);
    const url = withBase(config.site.basePath, fileName);
    bundledAssets.set(source, url);
    return url;
  };
  for (const key of ["logo", "favicon"] as const) {
    const bundled = bundleLocalAsset(config.site[key], `site.${key}`);
    if (bundled) siteConfig.site[key] = bundled;
  }
  const bundledNavigationLogo = bundleLocalAsset(config.navigation.logo, "navigation.logo");
  if (bundledNavigationLogo) siteConfig.navigation.logo = bundledNavigationLogo;

  const socialImage = resolveSocialImage(config, cwd, bundleLocalAsset);

  // When the builder page is going to be generated, weave its top-nav
  // link into the docs' navigation config so both surfaces cross-link.
  if (configBuilderJs) {
    addBuilderNavLink(siteConfig.navigation, siteConfig.site.basePath);
  }

  const data = await prepareDocsData(document, siteConfig);
  // Pre-highlight the full OpenAPI contract for the "View OpenAPI contract"
  // dialog. The rendered Shiki markup is JSON-encoded and placed inside a
  // `<script type="application/json">` block so the client binder can hand
  // it to the CodeBlock frame the first time the dialog opens (see
  // `bindOpenApiContractDialog`).
  const contractHighlighted = await highlightCode(`${JSON.stringify(document, null, 2)}\n`, "json");
  const contractSourceJson = JSON.stringify(contractHighlighted).replace(/</g, "\\u003c");
  const bodyHtml = renderToStaticMarkup(
    <ApiDocs data={data} contractSourceJson={contractSourceJson} />,
  );
  const html = renderHtmlDocument(data, bodyHtml, {
    stylesheet: "styles.css",
    clientScript: "client.js",
    ...(siteConfig.site.favicon ? { favicon: siteConfig.site.favicon } : {}),
    ...(socialImage ? { socialImage } : {}),
  });

  writeFileSync(resolve(outDir, "index.html"), html);
  files.push("index.html");
  // Site-relative paths of the generated pages, in the order they are written,
  // which is also the order the sitemap lists them in.
  const pagePaths = [""];
  copyFileSync(assets.stylesCss, resolve(outDir, "styles.css"));
  files.push("styles.css");
  copyFileSync(assets.clientJs, resolve(outDir, "client.js"));
  files.push("client.js");
  writeFileSync(resolve(outDir, "openapi.json"), `${JSON.stringify(document, null, 2)}\n`);
  files.push("openapi.json");

  // Second page: the configuration builder. Shares the same document
  // chrome (top bar, theme, fonts) so both routes feel like one site.
  // Only emitted when the client bundle path is available, so tests can
  // opt out by omitting `assetPaths.configBuilderJs`.
  if (configBuilderJs) {
    // On the builder page, the home link ("API reference") must navigate
    // back to the docs in the same window, so its href points at the base-path
    // root (e.g. "/periwinkle/") instead of the docs' own homeHref (which is
    // usually "#"). Search is dropped here: the builder has no searchable
    // content and the client bundle never binds the trigger, so the button
    // would be a dead affordance.
    const builderNavigation: ResolvedConfig["navigation"] = {
      ...siteConfig.navigation,
      homeHref: withBase(siteConfig.site.basePath, ""),
      showSearch: false,
    };
    const builderBody = renderToStaticMarkup(<ConfigBuilder navigation={builderNavigation} />);
    const builderHtml = renderBuilderDocument(data, builderBody, {
      stylesheet: "styles.css",
      clientScript: "config-builder.js",
      ...(siteConfig.site.favicon ? { favicon: siteConfig.site.favicon } : {}),
      ...(socialImage ? { socialImage } : {}),
    });
    // The builder page is served as a directory index so its public URL is a
    // clean "…/config-builder/" rather than "…/config-builder.html". The
    // client bundle and stylesheet stay at the site root and are referenced by
    // absolute base-path URLs, so they resolve from the nested index.html.
    const builderDir = resolve(outDir, "config-builder");
    mkdirSync(builderDir, { recursive: true });
    writeFileSync(resolve(builderDir, "index.html"), builderHtml);
    files.push("config-builder/index.html");
    copyFileSync(configBuilderJs, resolve(outDir, "config-builder.js"));
    files.push("config-builder.js");
    pagePaths.push("config-builder/");
  }

  // Crawler files carry absolute addresses throughout, so they are only
  // meaningful once the site knows where it is published.
  if (config.site.url) {
    writeFileSync(resolve(outDir, "sitemap.xml"), renderSitemap(config, pagePaths, new Date()));
    files.push("sitemap.xml");
    writeFileSync(resolve(outDir, "robots.txt"), renderRobotsTxt(config));
    files.push("robots.txt");
  }

  return { outDir, files };
}

/**
 * Resolves the configured social preview image into the absolute reference the
 * metadata block needs.
 *
 * A local file is copied into the site output and its dimensions are read, so
 * platforms can lay the card out before they have fetched the image. An absolute
 * URL is used as it stands, since nothing about a foreign image is knowable at
 * build time. Either way the result needs an absolute address, so a local file
 * is only bundled when `site.url` says where the site is published; without it
 * the image would be copied into the output and referenced by nothing.
 *
 * @param config The resolved configuration.
 * @param cwd Base directory for relative path resolution.
 * @param bundle Copies a local asset into the site output and returns its
 *   site-relative URL.
 * @returns The resolved image, or `undefined` when the site has none.
 */
function resolveSocialImage(
  config: ResolvedConfig,
  cwd: string,
  bundle: (value: string | undefined, label: string) => string | undefined,
): SocialImage | undefined {
  const configured = config.site.socialImage;
  if (!configured) return undefined;
  const alt = config.site.socialImageAlt;

  if (!isLocalAssetPath(configured)) {
    const url = absoluteAssetUrl(config.site.url, configured);
    return url ? { url, ...(alt ? { alt } : {}) } : undefined;
  }

  if (!config.site.url) return undefined;
  const bundled = bundle(configured, "site.socialImage");
  const url = bundled ? absoluteAssetUrl(config.site.url, bundled) : undefined;
  if (!url) return undefined;
  const size = readPngSize(resolve(cwd, configured));
  const mediaType = IMAGE_MEDIA_TYPES[extname(configured).toLowerCase()];
  return {
    url,
    ...(alt ? { alt } : {}),
    ...(size ?? {}),
    ...(mediaType ? { mediaType } : {}),
  };
}

/**
 * When the config-builder page is generated, prepend an auto
 * "Config builder" nav-link to the docs' top bar so users can discover
 * the builder from any doc page. Skipped when the consumer already
 * added an entry that points at the builder (`config-builder/` or a legacy
 * `config-builder.html`), so no duplicates are added.
 */
function addBuilderNavLink(navigation: ResolvedConfig["navigation"], basePath: string): void {
  const alreadyHasBuilderLink = navigation.links.some((link) =>
    /config-builder(?:\.html|\/)(?:$|[?#])/.test(link.href),
  );
  if (alreadyHasBuilderLink) return;
  const builderHref = withBase(basePath, "config-builder/");
  // No target: the builder opens in the same window (cross-linked with the
  // docs home link), and on the builder page this item renders as the
  // non-interactive active item instead.
  navigation.links = [{ label: "Config builder", href: builderHref }, ...navigation.links];
}
