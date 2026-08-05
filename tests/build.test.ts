import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { buildSite } from "../src/build/build-site.jsx";
import { withBase } from "../src/build/html.js";
import { resolveConfig } from "../src/config/config.js";
import { startPreviewServer } from "../src/preview/serve.js";

const specPath = fileURLToPath(new URL("./fixtures/bookstore.openapi.json", import.meta.url));
const stylesCss = fileURLToPath(new URL("../src/styles/styles.css", import.meta.url));

function testAssetPaths(dir: string): {
  stylesCss: string;
  clientJs: string;
  configBuilderJs: string;
} {
  // The real client bundles only exist after a package build; tests inject
  // lightweight stubs so buildSite() can copy them without a full tsup run.
  const clientJs = join(dir, "client-stub.js");
  writeFileSync(clientJs, "/* stub */");
  const configBuilderJs = join(dir, "config-builder-stub.js");
  writeFileSync(configBuilderJs, "/* stub */");
  return { stylesCss, clientJs, configBuilderJs };
}

describe("buildSite", () => {
  let outDir: string;
  let html: string;

  beforeAll(async () => {
    const workDir = mkdtempSync(join(tmpdir(), "periwinkle-build-"));
    outDir = join(workDir, "dist");
    const result = await buildSite({
      specPath,
      outDir,
      config: resolveConfig({
        site: { basePath: "/docs" },
        features: { configBuilder: true },
      }),
      assetPaths: testAssetPaths(workDir),
    });
    expect(result.files.sort()).toEqual([
      "client.js",
      "config-builder.js",
      "config-builder/index.html",
      "index.html",
      "openapi.json",
      "styles.css",
    ]);
    html = readFileSync(join(outDir, "index.html"), "utf8");
  });

  it("emits a complete HTML document with base-path asset links", () => {
    expect(html).toContain("<!doctype html>");
    expect(html).toContain('<link rel="stylesheet" href="/docs/styles.css">');
    expect(html).toContain('<script defer src="/docs/client.js"></script>');
    expect(html).toContain("<title>Bookstore API</title>");
  });

  it("inlines the compiled theme variables and the early theme script", () => {
    expect(html).toContain("--pw-background:");
    expect(html).toContain('[data-theme="dark"]');
    expect(html).toContain('localStorage.getItem("periwinkle:theme")');
  });

  it("copies the spec into the site as openapi.json", () => {
    const spec = JSON.parse(readFileSync(join(outDir, "openapi.json"), "utf8"));
    expect(spec.info.title).toBe("Bookstore API");
  });

  it("keeps the head structure stable", () => {
    const head = html.slice(html.indexOf("<head>"), html.indexOf("</head>"));
    const normalized = head.replace(/<style>[\s\S]*?<\/style>/, "<style>…</style>");
    expect(normalized).toMatchSnapshot();
  });

  it("emits the config-builder page alongside the docs page", () => {
    const builderHtml = readFileSync(join(outDir, "config-builder", "index.html"), "utf8");
    expect(builderHtml).toContain("<!doctype html>");
    expect(builderHtml).toContain("Configuration builder for Bookstore API");
    expect(builderHtml).toContain('<link rel="stylesheet" href="/docs/styles.css">');
    expect(builderHtml).toContain('<script defer src="/docs/config-builder.js"></script>');
    expect(builderHtml).toContain("data-pw-cb-root");
  });

  it("adds an automatic 'Config builder' link to the docs top nav", () => {
    expect(html).toContain('href="/docs/config-builder/"');
    expect(html).toContain("Config builder");
  });

  it("marks the docs home item active and non-clickable on the docs page", () => {
    // The active item renders as a <span aria-current="page">, so it is not
    // focusable or clickable; on the docs page that is the "API reference" home.
    expect(html).toMatch(
      /public-navigation__link--active" aria-current="page">[\s\S]*?>API reference<\/span>/,
    );
    // The cross-link to the builder opens in the same window (no target).
    expect(html).toContain('<a class="public-navigation__link" href="/docs/config-builder/"');
    expect(html).not.toMatch(/config-builder\/"[^>]*target="_blank"/);
  });

  it("marks the builder item active and links home back to the docs page", () => {
    const builderHtml = readFileSync(join(outDir, "config-builder", "index.html"), "utf8");
    // On the builder page the "Config builder" item is the active, non-clickable span.
    expect(builderHtml).toMatch(
      /public-navigation__link--active" aria-current="page">[\s\S]*?>Config builder<\/span>/,
    );
    // "API reference" becomes a same-window link back to the docs root.
    expect(builderHtml).toContain('<a class="public-navigation__link" href="/docs/"');
    expect(builderHtml).not.toMatch(/href="\/docs\/"[^>]*target="_blank"/);
    // The builder has no searchable content, so its nav drops the search trigger.
    expect(builderHtml).not.toContain("data-pw-search-trigger");
  });
});

describe("buildSite theme default and brand mark", () => {
  it("pins the palette when a default mode is configured", async () => {
    const workDir = mkdtempSync(join(tmpdir(), "periwinkle-build-"));
    const outDir = join(workDir, "dist");
    await buildSite({
      specPath,
      outDir,
      config: resolveConfig({ theme: { defaultMode: "light" } }),
      assetPaths: testAssetPaths(workDir),
    });
    const html = readFileSync(join(outDir, "index.html"), "utf8");

    // A first-time visitor gets the configured palette; the OS preference is
    // only consulted for the "system" default.
    expect(html).toContain('t="light"');
    expect(html).toContain('if(t==="system")');
    // A stored choice still wins.
    expect(html).toContain('localStorage.getItem("periwinkle:theme")');
  });

  it("tints the brand mark with the text color when asked", async () => {
    const workDir = mkdtempSync(join(tmpdir(), "periwinkle-build-"));
    const outDir = join(workDir, "dist");
    const logo = join(workDir, "brand.png");
    writeFileSync(logo, "stub");
    await buildSite({
      specPath,
      outDir,
      cwd: workDir,
      config: resolveConfig({
        site: { basePath: "/docs" },
        navigation: { logo: "brand.png", logoTint: true },
      }),
      assetPaths: testAssetPaths(workDir),
    });
    const html = readFileSync(join(outDir, "index.html"), "utf8");

    // Tinted marks render as a masked box, not an <img>, so the mask can be
    // filled with currentColor.
    expect(html).toContain("public-header__brand-logo--tinted");
    expect(html).toContain("url(&quot;/docs/brand.png&quot;)");
    expect(html).not.toContain('<img class="public-header__brand-logo" src="/docs/brand.png"');
  });
});

describe("buildSite auto builder nav-link", () => {
  it("does not duplicate the auto link when the consumer already added one", async () => {
    const workDir = mkdtempSync(join(tmpdir(), "periwinkle-build-"));
    const outDir = join(workDir, "dist");
    await buildSite({
      specPath,
      outDir,
      config: resolveConfig({
        site: { basePath: "/docs" },
        features: { configBuilder: true },
        navigation: {
          links: [
            {
              label: "My builder link",
              href: "/docs/config-builder.html?custom=1",
              target: "_blank",
            },
          ],
        },
      }),
      assetPaths: testAssetPaths(workDir),
    });
    const html = readFileSync(join(outDir, "index.html"), "utf8");
    // The consumer's link is preserved; no second "Config builder" pill
    // appears (the auto helper detects the builder href and skips).
    expect(html).toContain("My builder link");
    expect(html).not.toContain(">Config builder<");
  });

  it("omits the builder page by default even when the bundle is available", async () => {
    // A published API reference must not ship the tool that authors its own
    // config, so the builder stays off until `features.configBuilder` opts in.
    const workDir = mkdtempSync(join(tmpdir(), "periwinkle-build-"));
    const outDir = join(workDir, "dist");
    const result = await buildSite({
      specPath,
      outDir,
      config: resolveConfig({ site: { basePath: "/docs" } }),
      assetPaths: testAssetPaths(workDir),
    });
    expect(result.files.sort()).toEqual(["client.js", "index.html", "openapi.json", "styles.css"]);
    const html = readFileSync(join(outDir, "index.html"), "utf8");
    expect(html).not.toContain("config-builder");
  });

  it("skips the auto link when the builder page is not generated", async () => {
    const workDir = mkdtempSync(join(tmpdir(), "periwinkle-build-"));
    const outDir = join(workDir, "dist");
    const clientJs = join(workDir, "client-stub.js");
    writeFileSync(clientJs, "/* stub */");
    // Omit configBuilderJs so buildSite skips the second page. The
    // auto link should be skipped too, since it would 404.
    await buildSite({
      specPath,
      outDir,
      config: resolveConfig({ site: { basePath: "/docs" } }),
      assetPaths: { stylesCss, clientJs },
    });
    const html = readFileSync(join(outDir, "index.html"), "utf8");
    expect(html).not.toContain("config-builder");
  });
});

/**
 * Writes a file carrying a valid PNG signature and IHDR chunk, which is exactly
 * what the build reads to learn an image's dimensions. The pixel data is left
 * out because the build copies the file byte for byte without decoding it.
 */
function writePngHeader(path: string, width: number, height: number): void {
  const header = Buffer.alloc(24);
  header.write("\x89PNG\r\n\x1a\n", 0, "latin1");
  header.writeUInt32BE(13, 8);
  header.write("IHDR", 12, "latin1");
  header.writeUInt32BE(width, 16);
  header.writeUInt32BE(height, 20);
  writeFileSync(path, header);
}

function parseJsonLd(document: string): {
  "@context": string;
  "@graph": Record<string, unknown>[];
} {
  const match = document.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  expect(match).not.toBeNull();
  return JSON.parse(match?.[1] ?? "{}");
}

describe("buildSite search-engine and social metadata", () => {
  let files: string[];
  let outDir: string;
  let html: string;
  let builderHtml: string;

  beforeAll(async () => {
    const workDir = mkdtempSync(join(tmpdir(), "periwinkle-seo-"));
    outDir = join(workDir, "dist");
    writePngHeader(join(workDir, "social-card.png"), 1200, 630);
    const result = await buildSite({
      specPath,
      outDir,
      cwd: workDir,
      config: resolveConfig({
        site: {
          basePath: "/docs",
          url: "https://example.com/docs",
          language: "en-GB",
          description: "Everything a client needs to talk to the Bookstore API.",
          socialImage: "social-card.png",
          socialImageAlt: "The Bookstore API wordmark.",
          extraSitemapPaths: ["handbook.html"],
        },
        features: { configBuilder: true },
      }),
      assetPaths: testAssetPaths(workDir),
    });
    files = result.files;
    html = readFileSync(join(outDir, "index.html"), "utf8");
    builderHtml = readFileSync(join(outDir, "config-builder", "index.html"), "utf8");
  });

  it("states the document language and where the page lives", () => {
    expect(html).toContain('<html lang="en-GB">');
    expect(html).toContain('<link rel="canonical" href="https://example.com/docs/">');
    expect(html).toContain('<meta property="og:url" content="https://example.com/docs/">');
    expect(html).toContain('<meta property="og:locale" content="en_GB">');
    expect(html).toContain(
      '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">',
    );
  });

  it("carries the configured description into every description field", () => {
    const description = "Everything a client needs to talk to the Bookstore API.";
    expect(html).toContain(`<meta name="description" content="${description}">`);
    expect(html).toContain(`<meta property="og:description" content="${description}">`);
    expect(html).toContain(`<meta name="twitter:description" content="${description}">`);
  });

  it("bundles the social image and states its dimensions", () => {
    expect(files).toContain("social-card.png");
    expect(html).toContain(
      '<meta property="og:image" content="https://example.com/docs/social-card.png">',
    );
    expect(html).toContain('<meta property="og:image:type" content="image/png">');
    expect(html).toContain('<meta property="og:image:width" content="1200">');
    expect(html).toContain('<meta property="og:image:height" content="630">');
    expect(html).toContain('<meta property="og:image:alt" content="The Bookstore API wordmark.">');
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image">');
  });

  it("offers the contract as an alternative representation and warms the font origins", () => {
    expect(html).toContain(
      '<link rel="alternate" type="application/json" href="/docs/openapi.json" title="OpenAPI contract">',
    );
    expect(html).toContain('<link rel="preconnect" href="https://fonts.googleapis.com">');
    expect(html).toContain('<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>');
  });

  it("describes the reference as structured data", () => {
    const graph = parseJsonLd(html);
    expect(graph["@context"]).toBe("https://schema.org");
    expect(graph["@graph"].map((node) => node["@type"])).toEqual(["WebSite", "APIReference"]);
    const reference = graph["@graph"][1];
    expect(reference?.url).toBe("https://example.com/docs/");
    expect(reference?.version).toBe("1.2.3");
    expect(reference?.image).toBe("https://example.com/docs/social-card.png");
    expect(reference?.isPartOf).toEqual({ "@id": "https://example.com/docs/#website" });
  });

  it("describes the builder page as an application reached from the reference", () => {
    expect(builderHtml).toContain(
      '<link rel="canonical" href="https://example.com/docs/config-builder/">',
    );
    const graph = parseJsonLd(builderHtml);
    expect(graph["@graph"].map((node) => node["@type"])).toEqual([
      "WebSite",
      "WebApplication",
      "BreadcrumbList",
    ]);
    expect(graph["@graph"][2]?.itemListElement).toEqual([
      {
        "@type": "ListItem",
        position: 1,
        name: "Bookstore API",
        item: "https://example.com/docs/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Configuration builder for Bookstore API",
        item: "https://example.com/docs/config-builder/",
      },
    ]);
  });

  it("lists every page in the sitemap and points robots.txt at it", () => {
    expect(files).toContain("sitemap.xml");
    expect(files).toContain("robots.txt");
    const sitemap = readFileSync(join(outDir, "sitemap.xml"), "utf8");
    expect(sitemap).toContain("<loc>https://example.com/docs/</loc>");
    expect(sitemap).toContain("<loc>https://example.com/docs/config-builder/</loc>");
    expect(sitemap).toContain("<loc>https://example.com/docs/handbook.html</loc>");
    expect(sitemap).toMatch(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/);
    const robots = readFileSync(join(outDir, "robots.txt"), "utf8");
    expect(robots).toContain("Sitemap: https://example.com/docs/sitemap.xml");
  });
});

describe("buildSite without a site URL", () => {
  it("keeps the relative metadata and skips everything that needs an address", async () => {
    const workDir = mkdtempSync(join(tmpdir(), "periwinkle-seo-relative-"));
    const outDir = join(workDir, "dist");
    writePngHeader(join(workDir, "social-card.png"), 1200, 630);
    const result = await buildSite({
      specPath,
      outDir,
      cwd: workDir,
      config: resolveConfig({ site: { socialImage: "social-card.png" } }),
      assetPaths: testAssetPaths(workDir),
    });
    const html = readFileSync(join(outDir, "index.html"), "utf8");

    expect(html).toContain('<meta name="description"');
    expect(html).toContain('<meta property="og:title" content="Bookstore API">');
    expect(html).not.toContain('rel="canonical"');
    expect(html).not.toContain("og:url");
    // A card image has to be absolute, so a local file is neither referenced
    // nor copied into a site that does not know where it is published.
    expect(html).not.toContain("og:image");
    expect(result.files).not.toContain("social-card.png");
    expect(result.files).not.toContain("sitemap.xml");
    expect(result.files).not.toContain("robots.txt");
    expect(html).not.toContain("application/ld+json");
  });
});

describe("buildSite failures", () => {
  it("fails loudly for a missing spec", async () => {
    const workDir = mkdtempSync(join(tmpdir(), "periwinkle-build-"));
    await expect(
      buildSite({
        specPath: "missing.json",
        outDir: join(workDir, "dist"),
        config: resolveConfig(),
        cwd: workDir,
        assetPaths: testAssetPaths(workDir),
      }),
    ).rejects.toThrow(/OpenAPI spec not found/);
  });

  it("fails loudly for an invalid document", async () => {
    const workDir = mkdtempSync(join(tmpdir(), "periwinkle-build-"));
    const badSpec = join(workDir, "bad.json");
    writeFileSync(badSpec, JSON.stringify({ openapi: "3.1.0" }));
    await expect(
      buildSite({
        specPath: badSpec,
        outDir: join(workDir, "dist"),
        config: resolveConfig(),
        assetPaths: testAssetPaths(workDir),
      }),
    ).rejects.toThrow(/Invalid OpenAPI document/);
  });

  it("fails loudly when no spec is configured at all", async () => {
    const workDir = mkdtempSync(join(tmpdir(), "periwinkle-build-"));
    await expect(
      buildSite({
        outDir: join(workDir, "dist"),
        config: resolveConfig(),
        assetPaths: testAssetPaths(workDir),
      }),
    ).rejects.toThrow(/No OpenAPI spec given/);
  });
});

describe("startPreviewServer", () => {
  const port = 4198;
  let close: (() => void) | undefined;

  afterAll(() => close?.());

  it("serves the built site with content types and traversal protection", async () => {
    const workDir = mkdtempSync(join(tmpdir(), "periwinkle-preview-"));
    const outDir = join(workDir, "dist");
    await buildSite({
      specPath,
      outDir,
      config: resolveConfig(),
      assetPaths: testAssetPaths(workDir),
    });

    const server = startPreviewServer(outDir, port);
    close = () => server.close();

    const index = await fetch(`http://localhost:${port}/`);
    expect(index.status).toBe(200);
    expect(index.headers.get("content-type")).toContain("text/html");
    expect(await index.text()).toContain("Bookstore API");

    const css = await fetch(`http://localhost:${port}/styles.css`);
    expect(css.headers.get("content-type")).toContain("text/css");

    const missing = await fetch(`http://localhost:${port}/nope.txt`);
    expect(missing.status).toBe(404);

    const traversal = await fetch(`http://localhost:${port}/%2e%2e/%2e%2e/etc/passwd`);
    expect([403, 404]).toContain(traversal.status);
  });

  it("refuses to serve a missing directory", () => {
    expect(() => startPreviewServer("/definitely/missing/dir", port + 1)).toThrow(
      /Preview directory not found/,
    );
  });
});

describe("withBase", () => {
  it("joins base paths and asset names", () => {
    expect(withBase("/", "styles.css")).toBe("/styles.css");
    expect(withBase("/docs", "client.js")).toBe("/docs/client.js");
    expect(withBase("/docs/", "/client.js")).toBe("/docs/client.js");
  });
});
