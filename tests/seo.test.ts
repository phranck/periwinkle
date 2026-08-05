import { describe, expect, it } from "vitest";
import {
  absoluteAssetUrl,
  absoluteUrl,
  renderPreconnectLinks,
  renderRobotsTxt,
  renderSitemap,
  renderStructuredData,
  summarizeMarkdown,
} from "../src/build/seo.js";
import { resolveConfig } from "../src/config/config.js";

describe("absoluteUrl", () => {
  it("resolves page paths against the site URL", () => {
    expect(absoluteUrl("https://example.com/docs/", "")).toBe("https://example.com/docs/");
    expect(absoluteUrl("https://example.com/docs/", "config-builder/")).toBe(
      "https://example.com/docs/config-builder/",
    );
    expect(absoluteUrl("https://example.com/", "sitemap.xml")).toBe(
      "https://example.com/sitemap.xml",
    );
  });
});

describe("absoluteAssetUrl", () => {
  it("passes absolute references through untouched", () => {
    expect(absoluteAssetUrl(undefined, "https://cdn.example.com/card.png")).toBe(
      "https://cdn.example.com/card.png",
    );
    expect(absoluteAssetUrl("https://example.com/", "//cdn.example.com/card.png")).toBe(
      "//cdn.example.com/card.png",
    );
  });

  it("resolves site paths against the site URL", () => {
    expect(absoluteAssetUrl("https://example.com/docs/", "/docs/card.png")).toBe(
      "https://example.com/docs/card.png",
    );
  });

  it("yields nothing for a relative reference without a site URL", () => {
    expect(absoluteAssetUrl(undefined, "/docs/card.png")).toBeUndefined();
  });
});

describe("summarizeMarkdown", () => {
  it("reduces Markdown to one line of plain text", () => {
    expect(summarizeMarkdown("**Bold** and [a link](https://example.com), plus `code`.")).toBe(
      "Bold and a link, plus code.",
    );
  });

  it("drops fenced code and images", () => {
    expect(summarizeMarkdown("Intro.\n\n```js\nconst a = 1;\n```\n\n![alt](pic.png) Outro.")).toBe(
      "Intro. Outro.",
    );
  });

  it("cuts at a word boundary and marks the cut", () => {
    const summary = summarizeMarkdown(`${"word ".repeat(60)}end`);
    expect(summary.length).toBeLessThanOrEqual(161);
    expect(summary.endsWith("…")).toBe(true);
    expect(summary).not.toContain("wor…");
  });

  it("returns nothing for text-free input", () => {
    expect(summarizeMarkdown("")).toBe("");
    expect(summarizeMarkdown("###")).toBe("");
  });
});

describe("renderPreconnectLinks", () => {
  it("hints the font file origin alongside the Google stylesheet host", () => {
    expect(renderPreconnectLinks(["https://fonts.googleapis.com/css2?family=Barlow"])).toEqual([
      '<link rel="preconnect" href="https://fonts.googleapis.com">',
      '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
    ]);
  });

  it("names each origin once and ignores site-relative stylesheets", () => {
    expect(
      renderPreconnectLinks([
        "https://cdn.example.com/a.css",
        "https://cdn.example.com/b.css",
        "/fonts/fonts.css",
      ]),
    ).toEqual(['<link rel="preconnect" href="https://cdn.example.com">']);
  });
});

describe("renderStructuredData", () => {
  it("escapes angle brackets so a value cannot close the script element", () => {
    const script = renderStructuredData([{ "@type": "WebSite", name: "</script><b>" }]);
    expect(script).not.toContain("</script><b>");
    expect(script).toContain("\\u003c/script>");
  });

  it("writes nothing for an empty graph", () => {
    expect(renderStructuredData([])).toBe("");
  });
});

describe("renderSitemap", () => {
  it("lists the generated pages and the extra paths with a build date", () => {
    const config = resolveConfig({
      site: {
        basePath: "/docs",
        url: "https://example.com/docs",
        extraSitemapPaths: ["handbook.html"],
      },
    });
    const sitemap = renderSitemap(
      config,
      ["", "config-builder/"],
      new Date("2026-08-06T09:00:00Z"),
    );
    expect(sitemap).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(sitemap).toContain("<loc>https://example.com/docs/</loc>");
    expect(sitemap).toContain("<loc>https://example.com/docs/config-builder/</loc>");
    expect(sitemap).toContain("<loc>https://example.com/docs/handbook.html</loc>");
    expect(sitemap).toContain("<lastmod>2026-08-06</lastmod>");
  });

  it("writes nothing without a site URL", () => {
    expect(renderSitemap(resolveConfig(), [""], new Date())).toBe("");
  });
});

describe("renderRobotsTxt", () => {
  it("invites crawlers and points them at the sitemap", () => {
    const config = resolveConfig({ site: { url: "https://example.com" } });
    expect(renderRobotsTxt(config)).toBe(
      "User-agent: *\nAllow: /\n\nSitemap: https://example.com/sitemap.xml\n",
    );
  });

  it("disallows crawling when the meta directive asks for noindex", () => {
    const config = resolveConfig({
      site: { url: "https://example.com", robots: "noindex, nofollow" },
    });
    expect(renderRobotsTxt(config)).toBe("User-agent: *\nDisallow: /\n");
  });

  it("writes nothing without a site URL", () => {
    expect(renderRobotsTxt(resolveConfig())).toBe("");
  });
});
