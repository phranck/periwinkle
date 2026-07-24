/**
 * Site build orchestration.
 *
 * `buildSite()` turns an OpenAPI document plus a resolved config into a
 * self-contained static site: `index.html`, `styles.css`, `client.js`,
 * `openapi.json`, and any local logo/favicon assets. Every failure (missing
 * spec, invalid document, unreadable assets) throws with a clear message —
 * a broken input must never produce a silently wrong site.
 */

import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
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
  // The config-builder client bundle is optional at test time: tests may
  // omit the path to skip building the second page. In production it is
  // always resolved from the packaged assets (packagedAssetPaths).
  const configBuilderJs = assets.configBuilderJs;
  if (configBuilderJs && !existsSync(configBuilderJs)) {
    throw new Error(
      `periwinkle config-builder bundle missing at ${configBuilderJs}. Is the package built?`,
    );
  }

  const outDir = resolve(cwd, options.outDir);
  mkdirSync(outDir, { recursive: true });
  const files: string[] = [];

  // Local logo/favicon files are copied into the site and referenced by
  // their base name; URLs and absolute paths pass through untouched.
  const siteConfig = structuredClone(config);
  const bundleLocalAsset = (value: string | undefined, label: string): string | undefined => {
    if (!value || !isLocalAssetPath(value)) return undefined;
    const source = resolve(cwd, value);
    if (!existsSync(source)) {
      throw new Error(`Configured ${label} not found: ${source}`);
    }
    const fileName = basename(source);
    copyFileSync(source, resolve(outDir, fileName));
    files.push(fileName);
    return withBase(config.site.basePath, fileName);
  };
  for (const key of ["logo", "favicon"] as const) {
    const bundled = bundleLocalAsset(config.site[key], `site.${key}`);
    if (bundled) siteConfig.site[key] = bundled;
  }
  const bundledNavigationLogo = bundleLocalAsset(config.navigation.logo, "navigation.logo");
  if (bundledNavigationLogo) siteConfig.navigation.logo = bundledNavigationLogo;

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
  });

  writeFileSync(resolve(outDir, "index.html"), html);
  files.push("index.html");
  copyFileSync(assets.stylesCss, resolve(outDir, "styles.css"));
  files.push("styles.css");
  copyFileSync(assets.clientJs, resolve(outDir, "client.js"));
  files.push("client.js");
  writeFileSync(resolve(outDir, "openapi.json"), `${JSON.stringify(document, null, 2)}\n`);
  files.push("openapi.json");

  // Second page: the configuration builder. Shares the same document
  // chrome (top bar, theme, fonts) so both routes feel like one site.
  // Only emitted when the client bundle path is available — tests can
  // opt out by omitting `assetPaths.configBuilderJs`.
  if (configBuilderJs) {
    const builderBody = renderToStaticMarkup(<ConfigBuilder navigation={siteConfig.navigation} />);
    const builderHtml = renderBuilderDocument(data, builderBody, {
      stylesheet: "styles.css",
      builderScript: "config-builder.js",
      ...(siteConfig.site.favicon ? { favicon: siteConfig.site.favicon } : {}),
    });
    writeFileSync(resolve(outDir, "config-builder.html"), builderHtml);
    files.push("config-builder.html");
    copyFileSync(configBuilderJs, resolve(outDir, "config-builder.js"));
    files.push("config-builder.js");
  }

  return { outDir, files };
}

/**
 * When the config-builder page is generated, prepend an auto
 * "Config builder" nav-link to the docs' top bar so users can discover
 * the builder from any doc page. Skipped when the consumer already
 * added an entry that points at `config-builder.html` (no duplicates).
 */
function addBuilderNavLink(navigation: ResolvedConfig["navigation"], basePath: string): void {
  const alreadyHasBuilderLink = navigation.links.some((link) =>
    /config-builder\.html(?:$|[?#])/.test(link.href),
  );
  if (alreadyHasBuilderLink) return;
  const builderHref = withBase(basePath, "config-builder.html");
  navigation.links = [
    { label: "Config builder", href: builderHref, target: "_blank" },
    ...navigation.links,
  ];
}
