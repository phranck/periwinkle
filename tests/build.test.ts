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
      config: resolveConfig({ site: { basePath: "/docs" } }),
      assetPaths: testAssetPaths(workDir),
    });
    expect(result.files.sort()).toEqual([
      "client.js",
      "config-builder.html",
      "config-builder.js",
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
    const builderHtml = readFileSync(join(outDir, "config-builder.html"), "utf8");
    expect(builderHtml).toContain("<!doctype html>");
    expect(builderHtml).toContain("Bookstore API — configuration builder");
    expect(builderHtml).toContain('<link rel="stylesheet" href="/docs/styles.css">');
    expect(builderHtml).toContain('<script defer src="/docs/config-builder.js"></script>');
    expect(builderHtml).toContain("data-pw-cb-root");
  });

  it("adds an automatic 'Config builder' link to the docs top nav", () => {
    expect(html).toContain('href="/docs/config-builder.html"');
    expect(html).toContain("Config builder");
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

  it("skips the auto link when the builder page is not generated", async () => {
    const workDir = mkdtempSync(join(tmpdir(), "periwinkle-build-"));
    const outDir = join(workDir, "dist");
    const clientJs = join(workDir, "client-stub.js");
    writeFileSync(clientJs, "/* stub */");
    // Omit configBuilderJs so buildSite skips the second page — the
    // auto link should be skipped too, since it would 404.
    await buildSite({
      specPath,
      outDir,
      config: resolveConfig({ site: { basePath: "/docs" } }),
      assetPaths: { stylesCss, clientJs },
    });
    const html = readFileSync(join(outDir, "index.html"), "utf8");
    expect(html).not.toContain("config-builder.html");
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
