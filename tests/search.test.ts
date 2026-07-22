// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from "vitest";

import {
  buildDocumentSearchIndex,
  clearDocumentSearchHighlight,
  highlightDocumentSearchMatches,
  searchDocumentIndex,
} from "../src/client/search.js";

/** Static, fully trusted fixture mirroring the attributes the components render. */
const CONTENT_FIXTURE = `
    <main data-api-search-root>
      <div
        id="guide-auth"
        data-api-search-entry
        data-api-search-group="Integration guide"
        data-api-search-title="Authentication"
        data-api-search-addon="Guide"
        data-api-search-kind="chapter"
        data-api-search-target="guide-auth"
      >
        <p>Every request needs an API key header.</p>
        <pre>curl -H "X-API-Key: secret"</pre>
        <button type="button">Copy</button>
      </div>
      <article
        id="op-create-book"
        data-api-search-entry
        data-api-search-group="Books"
        data-api-search-title="Create Book"
        data-api-search-addon="POST /books"
        data-api-search-kind="operation"
        data-api-search-target="op-create-book"
      >
        <p>Create a new book record in the catalog.</p>
      </article>
      <article
        id="op-list-books"
        data-api-search-entry
        data-api-search-group="Books"
        data-api-search-title="All Books"
        data-api-search-addon="GET /books"
        data-api-search-kind="operation"
        data-api-search-target="op-list-books"
      >
        <p>${"List every stored book. ".repeat(12)}The pagination cursor keeps result pages stable.</p>
      </article>
      <details
        id="schema-book"
        data-api-search-entry
        data-api-search-group="Schemas"
        data-api-search-title="Book"
        data-api-search-addon="Schema"
        data-api-search-kind="schema"
        data-api-search-target="schema-book"
      >
        <summary>Book</summary>
        <p>A single book record.</p>
      </details>
      <div data-api-search-entry data-api-search-title="No group, never indexed"></div>
      <section id="fallbacks" data-api-search-entry data-api-search-group="Misc" data-api-search-title="Fallbacks">
        <p>Uses its own id and the default kind.</p>
      </section>
    </main>
  `;

function contentRoot(): HTMLElement {
  const root = document.querySelector<HTMLElement>("[data-api-search-root]");
  if (!root) throw new Error("missing content root");
  return root;
}

beforeEach(() => {
  document.body.innerHTML = CONTENT_FIXTURE;
});

describe("buildDocumentSearchIndex", () => {
  it("indexes only fully marked entries", () => {
    const entries = buildDocumentSearchIndex(contentRoot());
    expect(entries.map((entry) => entry.targetId)).toEqual([
      "guide-auth",
      "op-create-book",
      "op-list-books",
      "schema-book",
      "fallbacks",
    ]);
  });

  it("strips code, buttons, and controls from the searchable text", () => {
    const entries = buildDocumentSearchIndex(contentRoot());
    const guide = entries.find((entry) => entry.targetId === "guide-auth");
    expect(guide?.text).toBe("Every request needs an API key header.");
    expect(guide?.text).not.toContain("curl");
    expect(guide?.text).not.toContain("Copy");
  });

  it("falls back to the element id and the document kind", () => {
    const entries = buildDocumentSearchIndex(contentRoot());
    const fallback = entries.find((entry) => entry.targetId === "fallbacks");
    expect(fallback?.kind).toBe("document");
    expect(fallback?.addon).toBeUndefined();
  });
});

describe("searchDocumentIndex", () => {
  it("returns nothing for an empty query", () => {
    const entries = buildDocumentSearchIndex(contentRoot());
    expect(searchDocumentIndex(entries, "")).toEqual([]);
    expect(searchDocumentIndex(entries, "   ")).toEqual([]);
  });

  it("ranks exact title matches before prefix and substring matches", () => {
    const entries = buildDocumentSearchIndex(contentRoot());
    const groups = searchDocumentIndex(entries, "book");
    const flat = groups.flatMap((group) => group.results);
    // Exact title "Book" first, then title matches, then text-only matches.
    expect(flat[0]?.targetId).toBe("schema-book");
    expect(groups[0]?.group).toBe("Schemas");
    expect(flat.map((result) => result.targetId)).toContain("op-create-book");
  });

  it("groups results under their visible area preserving rank order", () => {
    const entries = buildDocumentSearchIndex(contentRoot());
    const groups = searchDocumentIndex(entries, "books");
    const bookGroup = groups.find((group) => group.group === "Books");
    expect(bookGroup?.results.map((result) => result.targetId)).toEqual([
      "op-list-books",
      "op-create-book",
    ]);
  });

  it("requires every term of a multi-word query to match", () => {
    const entries = buildDocumentSearchIndex(contentRoot());
    const groups = searchDocumentIndex(entries, "book catalog");
    const flat = groups.flatMap((group) => group.results);
    expect(flat.map((result) => result.targetId)).toEqual(["op-create-book"]);
    expect(flat[0]?.matchedTerm).toBe("book");
  });

  it("shortens long prose into an ellipsed snippet around the match", () => {
    const entries = buildDocumentSearchIndex(contentRoot());
    const groups = searchDocumentIndex(entries, "pagination");
    const result = groups.flatMap((group) => group.results)[0];
    expect(result?.targetId).toBe("op-list-books");
    expect(result?.snippet.length).toBeLessThan(result?.text.length ?? 0);
    expect(result?.snippet).toContain("pagination");
    expect(result?.snippet.startsWith("…")).toBe(true);
  });
});

describe("highlightDocumentSearchMatches", () => {
  it("marks every prose occurrence outside code blocks", () => {
    const guide = document.getElementById("guide-auth");
    if (!guide) throw new Error("missing guide entry");
    const marks = highlightDocumentSearchMatches(guide, "api key");
    expect(marks).toHaveLength(1);
    expect(marks[0]?.textContent).toBe("API key");
    expect(document.querySelector("pre")?.querySelector("mark")).toBeNull();
  });

  it("keeps a contiguous phrase in one mark before single terms", () => {
    const entry = document.getElementById("op-create-book");
    if (!entry) throw new Error("missing entry");
    const marks = highlightDocumentSearchMatches(entry, "book record");
    expect(marks.map((mark) => mark.textContent)).toEqual(["book record"]);
  });

  it("replaces earlier marks and clears without leaving split text nodes", () => {
    const entry = document.getElementById("op-create-book");
    if (!entry) throw new Error("missing entry");
    highlightDocumentSearchMatches(entry, "book");
    expect(document.querySelectorAll("mark[data-api-search-highlight]").length).toBeGreaterThan(0);
    clearDocumentSearchHighlight(document);
    expect(document.querySelectorAll("mark[data-api-search-highlight]")).toHaveLength(0);
    expect(entry.querySelector("p")?.textContent).toBe("Create a new book record in the catalog.");
  });
});
