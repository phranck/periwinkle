import { renderToStaticMarkup } from "react-dom/server";
import { beforeAll, describe, expect, it } from "vitest";

import { ApiDocs } from "../src/components/ApiDocs.jsx";
import { resolveConfig } from "../src/config/config.js";
import { type DocsData, prepareDocsData } from "../src/render/prepare.js";
import bookstore from "./fixtures/bookstore.openapi.json";

let defaultHtml: string;

beforeAll(async () => {
  const data = await prepareDocsData(bookstore, resolveConfig());
  defaultHtml = renderToStaticMarkup(<ApiDocs data={data} />);
});

describe("ApiDocs", () => {
  it("renders the intro with spec title and version", () => {
    expect(defaultHtml).toContain("Bookstore API");
    expect(defaultHtml).toContain("version 1.2.3");
  });

  it("renders sidebar sections for groups and schemas with counts", () => {
    expect(defaultHtml).toContain('data-pw-nav-section="books"');
    expect(defaultHtml).toContain('data-pw-nav-section="authors"');
    expect(defaultHtml).toContain('data-pw-nav-section="schemas"');
  });

  it("renders endpoint blocks with anchors, method badges, and access labels", () => {
    expect(defaultHtml).toContain('id="op-get-books-id"');
    expect(defaultHtml).toContain("pw-method--post");
    expect(defaultHtml).toContain("Authentication required");
    expect(defaultHtml).toContain("Public endpoint");
  });

  it("marks deprecated operations", () => {
    expect(defaultHtml).toContain("Deprecated");
  });

  it("renders highlighted curl examples with auth headers", () => {
    expect(defaultHtml).toContain("X-API-Key");
    expect(defaultHtml).toContain("shiki");
  });

  it("renders schema cards with field tables and variant links", () => {
    expect(defaultHtml).toContain('id="schema-book"');
    expect(defaultHtml).toContain('data-presence="included"');
    expect(defaultHtml).toContain('href="#schema-author"');
  });

  it("renders the derived integration guide", () => {
    expect(defaultHtml).toContain('id="integration-guide"');
    expect(defaultHtml).toContain('id="guide-auth"');
    expect(defaultHtml).toContain("generated from API version 1.2.3");
  });
});

describe("ApiDocs with custom config", () => {
  let data: DocsData;
  let html: string;

  beforeAll(async () => {
    data = await prepareDocsData(
      bookstore,
      resolveConfig({
        site: { title: "Custom Title", serverUrl: "https://api.custom.test" },
        guide: { auth: "Custom auth copy.", versioning: false },
        customSections: [
          {
            id: "sdks",
            title: "SDK Downloads",
            markdown: "Grab them here.",
            position: "after-reference",
          },
        ],
        footer: { links: [{ label: "Imprint", href: "/imprint" }], text: "© Test" },
      }),
    );
    html = renderToStaticMarkup(<ApiDocs data={data} />);
  });

  it("prefers the configured title and server URL", () => {
    expect(data.title).toBe("Custom Title");
    expect(html).toContain("Custom Title");
    expect(html).toContain("https://api.custom.test/books");
  });

  it("uses authored guide content and drops disabled sections", () => {
    expect(html).toContain("Custom auth copy.");
    expect(html).not.toContain('id="guide-versioning"');
  });

  it("renders custom sections with sidebar links and footer", () => {
    expect(html).toContain('id="sdks"');
    expect(html).toContain("SDK Downloads");
    expect(html).toContain('href="#sdks"');
    expect(html).toContain("© Test");
    expect(html).toContain('href="/imprint"');
  });
});

describe("ApiDocs sidebar ordering", () => {
  it("mirrors the content order for custom sections around the guide", async () => {
    const data = await prepareDocsData(
      bookstore,
      resolveConfig({
        customSections: [
          { id: "intro-note", title: "Intro note", markdown: "First.", position: "before-guide" },
          { id: "appendix", title: "Appendix", markdown: "Last.", position: "after-reference" },
        ],
      }),
    );
    const html = renderToStaticMarkup(<ApiDocs data={data} />);
    const sidebar = html.slice(0, html.indexOf("pw-content"));
    const beforeLink = sidebar.indexOf('href="#intro-note"');
    const guideLink = sidebar.indexOf('href="#integration-guide"');
    const appendixLink = sidebar.indexOf('href="#appendix"');
    const schemasSection = sidebar.indexOf('data-pw-nav-section="schemas"');
    expect(beforeLink).toBeGreaterThan(-1);
    expect(beforeLink).toBeLessThan(guideLink);
    expect(schemasSection).toBeLessThan(appendixLink);
  });
});
