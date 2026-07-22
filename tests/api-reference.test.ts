import { describe, expect, it } from "vitest";

import {
  buildApiReference,
  operationAnchor,
  schemaAnchor,
  schemaTypeLabel,
} from "../src/model/api-reference.js";
import bookstore from "./fixtures/bookstore.openapi.json";

/** Deep-clones the fixture so mutation-based failure tests stay isolated. */
function fixture(): Record<string, unknown> {
  return structuredClone(bookstore) as Record<string, unknown>;
}

describe("buildApiReference", () => {
  const reference = buildApiReference(bookstore);

  it("carries title, version, and description from info", () => {
    expect(reference.title).toBe("Bookstore API");
    expect(reference.version).toBe("1.2.3");
    expect(reference.description).toContain("neutral example");
  });

  it("orders groups by declared root tag order, untagged operations last", () => {
    expect(reference.groups.map((group) => group.name)).toEqual(["Books", "Authors", "Other"]);
  });

  it("annotates groups with root tag descriptions", () => {
    expect(reference.groups[0]?.description).toBe("Browse and manage books.");
    expect(reference.groups[2]?.description).toBeUndefined();
  });

  it("sorts operations within a group by path, then method", () => {
    const books = reference.groups[0];
    expect(books?.operations.map((op) => `${op.method} ${op.path}`)).toEqual([
      "GET /books",
      "POST /books",
      "GET /books/{id}",
    ]);
  });

  it("prefers x-nav-title, then humanized operationId, then shortened summary", () => {
    const [listBooks, createBook, getBook] = reference.groups[0]?.operations ?? [];
    expect(listBooks?.navTitle).toBe("All books");
    expect(createBook?.navTitle).toBe("Create Book");
    expect(getBook?.navTitle).toBe("Fetch a single book");
  });

  it("computes stable anchors for operations and schemas", () => {
    const getBook = reference.groups[0]?.operations[2];
    expect(getBook?.anchor).toBe(operationAnchor("get", "/books/{id}"));
    expect(getBook?.anchor).toBe("op-get-books-id");
    expect(reference.schemas.Book?.anchor).toBe(schemaAnchor("Book"));
    expect(reference.schemas.Book?.anchor).toBe("schema-book");
  });

  it("inherits document-level security and honors operation overrides", () => {
    const [listBooks, , getBook] = reference.groups[0]?.operations ?? [];
    const search = reference.groups[2]?.operations[0];
    expect(listBooks?.security).toEqual(["ApiKeyAuth"]);
    expect(getBook?.security).toEqual([]);
    expect(search?.security).toEqual(["BearerAuth"]);
  });

  it("normalizes security schemes sorted by name", () => {
    expect(reference.securitySchemes).toEqual([
      {
        name: "ApiKeyAuth",
        type: "apiKey",
        description: "API key issued per account.",
        location: "header",
        parameterName: "X-API-Key",
      },
      {
        name: "BearerAuth",
        type: "http",
        description: "OAuth access token.",
        httpScheme: "bearer",
      },
    ]);
  });

  it("marks deprecated operations", () => {
    const listAuthors = reference.groups[1]?.operations[0];
    expect(listAuthors?.deprecated).toBe(true);
    expect(reference.groups[0]?.operations[0]?.deprecated).toBe(false);
  });

  it("builds parameters with type labels", () => {
    const limit = reference.groups[0]?.operations[0]?.parameters[0];
    expect(limit).toEqual({
      name: "limit",
      location: "query",
      required: false,
      description: "Maximum number of books to return.",
      typeLabel: "integer",
    });
  });

  it("resolves request body and response schema references", () => {
    const createBook = reference.groups[0]?.operations[1];
    expect(createBook?.requestBody?.required).toBe(true);
    expect(createBook?.requestBody?.mediaTypes[0]?.schemaRef).toBe("BookInput");
    expect(createBook?.responses.map((response) => response.status)).toEqual(["201", "400"]);
    expect(createBook?.responses[0]?.mediaTypes[0]?.schemaRef).toBe("Book");
  });

  it("keeps authored media type examples", () => {
    const getBook = reference.groups[0]?.operations[2];
    expect(getBook?.responses[0]?.mediaTypes[0]?.example).toEqual({ id: 1, title: "Example" });
  });

  it("collects top-level oneOf variants as schemaRefs and schema variants", () => {
    const search = reference.groups[2]?.operations[0];
    expect(search?.responses[0]?.mediaTypes[0]?.schemaRefs).toEqual(["Book", "Author"]);
    expect(reference.schemas.SearchResult?.variants).toEqual([
      { name: "Book", anchor: "schema-book" },
      { name: "Author", anchor: "schema-author" },
    ]);
  });

  it("flattens schema fields with reading-order priorities and one nested level", () => {
    const book = reference.schemas.Book;
    const fieldPaths = book?.fields.map((field) => `${field.depth}:${field.path}`);
    expect(fieldPaths?.slice(0, 2)).toEqual(["0:id", "0:title"]);
    expect(fieldPaths).toContain("0:author");
    expect(fieldPaths).toContain("1:name");
    const author = book?.fields.find((field) => field.path === "author");
    expect(author?.schemaRef).toBe("Author");
    expect(author?.type).toBe("Author");
  });

  it("labels array, 3.1 type-array, and 3.0 nullable types", () => {
    const book = reference.schemas.Book;
    expect(book?.fields.find((field) => field.path === "tags")?.type).toBe("string[]");
    expect(book?.fields.find((field) => field.path === "rating")?.type).toBe("number | null");
    const author = reference.schemas.Author;
    expect(author?.fields.find((field) => field.path === "website")?.type).toBe("string | null");
  });

  it("cuts reference cycles while flattening", () => {
    const category = reference.schemas.Category;
    expect(category?.fields.some((field) => field.path === "parent")).toBe(true);
    expect(category?.fields.length).toBeLessThan(20);
  });

  it("marks required fields from the containing object", () => {
    const book = reference.schemas.Book;
    expect(book?.fields.find((field) => field.path === "id")?.required).toBe(true);
    expect(book?.fields.find((field) => field.path === "rating")?.required).toBe(false);
  });
});

describe("buildApiReference validation", () => {
  it("rejects non-object documents", () => {
    expect(() => buildApiReference("nope")).toThrow(/root must be an object/);
  });

  it("rejects unsupported OpenAPI versions", () => {
    const document = fixture();
    document.openapi = "2.0";
    expect(() => buildApiReference(document)).toThrow(/Unsupported OpenAPI version/);
  });

  it("rejects documents without info.title", () => {
    const document = fixture();
    document.info = { version: "1.0.0" };
    expect(() => buildApiReference(document)).toThrow(/missing info\.title/);
  });

  it("rejects unknown local schema references", () => {
    const document = fixture();
    const components = document.components as Record<string, unknown>;
    const schemas = components.schemas as Record<string, unknown>;
    (schemas.Book as Record<string, unknown>).properties = {
      ghost: { $ref: "#/components/schemas/Ghost" },
    };
    expect(() => buildApiReference(document)).toThrow(/Unknown OpenAPI schema reference: Ghost/);
  });

  it("rejects non-local schema references", () => {
    const document = fixture();
    const components = document.components as Record<string, unknown>;
    const schemas = components.schemas as Record<string, unknown>;
    (schemas.Book as Record<string, unknown>).properties = {
      external: { $ref: "external.json#/Book" },
    };
    expect(() => buildApiReference(document)).toThrow(/Unsupported OpenAPI schema reference/);
  });

  it("rejects operations referencing undeclared security schemes", () => {
    const document = fixture();
    const paths = document.paths as Record<string, unknown>;
    const search = (paths["/search"] as Record<string, unknown>).get as Record<string, unknown>;
    search.security = [{ MagicAuth: [] }];
    expect(() => buildApiReference(document)).toThrow(/undeclared security scheme "MagicAuth"/);
  });
});

describe("schemaTypeLabel", () => {
  it("labels plain and unknown schemas", () => {
    expect(schemaTypeLabel({ type: "string" }, {})).toBe("string");
    expect(schemaTypeLabel(undefined, {})).toBe("unknown");
    expect(schemaTypeLabel({}, {})).toBe("object");
  });

  it("joins composed variants with a pipe", () => {
    expect(schemaTypeLabel({ oneOf: [{ type: "string" }, { type: "integer" }] }, {})).toBe(
      "string | integer",
    );
  });
});
