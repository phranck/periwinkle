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

  it("renders endpoint blocks with anchors, method text, and access labels", () => {
    expect(defaultHtml).toContain('id="op-get-books-id"');
    // Endpoint header carries the method as text in the method accent color
    // (reference .endpoint-card__method), not as a pill badge.
    expect(defaultHtml).toContain("pw-endpoint__header--post");
    expect(defaultHtml).toContain('class="pw-endpoint__method">POST<');
    // sidebar.showMethods defaults to false (reference behavior), so no
    // method chip appears next to sidebar operations by default.
    expect(defaultHtml).not.toContain("pw-nav__item-method--post");
    expect(defaultHtml).toContain("Authentication required");
    expect(defaultHtml).toContain("Public endpoint");
  });

  it("renders responses without code blocks (reference behavior)", () => {
    // The reference response-card renders no CodeBlock for its media examples
    // — only the media/schema header row. Verify no code-block markup appears
    // inside any .pw-response.
    const responseSlices = [
      ...defaultHtml.matchAll(/class="pw-response [^"]*"[\s\S]*?<\/li>/g),
    ].map((match) => match[0]);
    expect(responseSlices.length).toBeGreaterThan(0);
    for (const slice of responseSlices) {
      expect(slice).not.toContain("data-code-block");
      expect(slice).not.toContain("code-block__frame");
    }
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

  it("wraps the docs in a single surface-card shell", () => {
    // The reference builds every page inside `.api-reference-shell` +
    // `.api-reference-layout`; the sidebar itself carries `surface-card`.
    expect(defaultHtml).toContain('class="api-reference-shell"');
    expect(defaultHtml).toContain("api-reference-layout");
    expect(defaultHtml).toContain('class="sidebar api-reference-nav surface-card"');
  });

  it("renders Integration essentials as one content-card with a panel grid", () => {
    // Guide chapter body must contain the ContentCard header/title plus the
    // integration-panel grid with individually addressable panels (five
    // derived-guide sections + the OpenAPI-contract panel).
    expect(defaultHtml).toContain('class="surface-card content-card"');
    expect(defaultHtml).toMatch(/content-card__title[^>]*>Integration essentials</);
    expect(defaultHtml).toContain("integration-panel-grid");
    expect(defaultHtml).toContain('id="integration-openapi-contract"');
    expect(defaultHtml).toMatch(/content-panel__header-title[^>]*>OpenAPI contract</);
    expect(defaultHtml).toContain("View OpenAPI contract");
  });

  it("renders the OpenAPI-contract dialog with aria wiring", () => {
    expect(defaultHtml).toContain('id="openapi-contract-dialog"');
    expect(defaultHtml).toContain('data-openapi-contract-dialog=""');
    expect(defaultHtml).toContain('aria-controls="openapi-contract-dialog"');
    expect(defaultHtml).toContain('id="openapi-contract-source"');
  });

  it("renders the sidebar header with fixed 'Reference' chapter title", () => {
    // The reference header labels the chapter as "Reference"; the site title
    // stays in the intro headline, not in the sidebar.
    expect(defaultHtml).toMatch(/sidebar__header-title[^>]*>[\s\S]*?Reference/);
    expect(defaultHtml).toMatch(/data-pw-toggle-all/);
    expect(defaultHtml).toMatch(/data-pw-theme-toggle/);
  });

  it("renders the search dialog and marks searchable entries", () => {
    expect(defaultHtml).toContain("data-api-search-dialog");
    expect(defaultHtml).toContain("data-api-search-root");
    expect(defaultHtml).toContain('data-api-search-group="Books"');
    expect(defaultHtml).toContain('data-api-search-group="Integration guide"');
    expect(defaultHtml).toContain('data-api-search-kind="schema"');
    expect(defaultHtml).toContain('id="api-document-search-results"');
    expect(defaultHtml).toContain("api-search-highlight-notice");
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
