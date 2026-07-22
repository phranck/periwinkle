// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from "vitest";

import {
  bindSchemaTabs,
  bindSearch,
  bindThemeToggle,
  initTheme,
  setupPeriwinkle,
  THEME_STORAGE_KEY,
} from "../src/client/client.js";

/** Minimal in-memory Storage stand-in; happy-dom does not expose localStorage. */
class MemoryStorage implements Pick<Storage, "getItem" | "setItem" | "removeItem" | "clear"> {
  private store = new Map<string, string>();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

Object.defineProperty(window, "localStorage", { value: new MemoryStorage(), configurable: true });

/** Static, fully trusted test fixture markup mirroring the rendered docs. */
const PAGE_FIXTURE = `
    <nav data-pw-nav>
      <button type="button" data-pw-theme-toggle></button>
      <input type="search" data-pw-search />
      <details data-pw-nav-section="books" data-pw-search-text="books">
        <summary>Books</summary>
        <ul>
          <li><a data-pw-nav-item data-pw-search-text="all books get /books" href="#a">All books</a></li>
          <li><a data-pw-nav-item data-pw-search-text="create book post /books" href="#b">Create Book</a></li>
        </ul>
      </details>
      <details data-pw-nav-section="authors" data-pw-search-text="authors">
        <summary>Authors</summary>
        <ul>
          <li><a data-pw-nav-item data-pw-search-text="list authors" href="#c">List Authors</a></li>
        </ul>
      </details>
    </nav>
    <details data-pw-schema-card="schema-book">
      <summary>
        <button type="button" data-pw-tab="fields" aria-pressed="true">Fields</button>
        <button type="button" data-pw-tab="json" aria-pressed="false">JSON</button>
      </summary>
      <div data-pw-panel="fields"></div>
      <div data-pw-panel="json" hidden></div>
    </details>
  `;

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
  document.body.innerHTML = PAGE_FIXTURE;
});

describe("theme", () => {
  it("initializes from the stored explicit choice", () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "dark");
    initTheme(document);
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("toggles and persists on click", () => {
    initTheme(document);
    bindThemeToggle(document);
    const initial = document.documentElement.dataset.theme;
    const button = document.querySelector<HTMLButtonElement>("[data-pw-theme-toggle]");
    button?.click();
    expect(document.documentElement.dataset.theme).not.toBe(initial);
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe(
      document.documentElement.dataset.theme,
    );
  });
});

describe("search", () => {
  function query(value: string): void {
    const input = document.querySelector<HTMLInputElement>("[data-pw-search]");
    if (!input) throw new Error("missing search input");
    input.value = value;
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }

  it("hides non-matching items and empty sections, opens matching sections", () => {
    bindSearch(document);
    query("create");
    const items = [...document.querySelectorAll<HTMLElement>("[data-pw-nav-item]")];
    expect(items.map((item) => item.hidden)).toEqual([true, false, true]);
    const [books, authors] = [
      ...document.querySelectorAll<HTMLDetailsElement>("details[data-pw-nav-section]"),
    ];
    expect(books?.hidden).toBe(false);
    expect(books?.open).toBe(true);
    expect(authors?.hidden).toBe(true);
  });

  it("restores visibility and open states when cleared", () => {
    bindSearch(document);
    query("create");
    query("");
    const items = [...document.querySelectorAll<HTMLElement>("[data-pw-nav-item]")];
    expect(items.every((item) => !item.hidden)).toBe(true);
    const sections = [
      ...document.querySelectorAll<HTMLDetailsElement>("details[data-pw-nav-section]"),
    ];
    expect(sections.every((section) => !section.hidden)).toBe(true);
    expect(sections.every((section) => !section.open)).toBe(true);
  });
});

describe("schema tabs", () => {
  it("switches panels and pressed states without closing the card", () => {
    bindSchemaTabs(document);
    const card = document.querySelector<HTMLDetailsElement>("[data-pw-schema-card]");
    if (card) card.open = true;
    const jsonTab = document.querySelector<HTMLButtonElement>('[data-pw-tab="json"]');
    jsonTab?.click();
    expect(jsonTab?.getAttribute("aria-pressed")).toBe("true");
    expect(document.querySelector<HTMLElement>('[data-pw-panel="fields"]')?.hidden).toBe(true);
    expect(document.querySelector<HTMLElement>('[data-pw-panel="json"]')?.hidden).toBe(false);
    expect(card?.open).toBe(true);
  });
});

describe("setupPeriwinkle", () => {
  it("wires everything without throwing", () => {
    expect(() => setupPeriwinkle(document)).not.toThrow();
    expect(document.documentElement.dataset.theme).toMatch(/^(light|dark)$/);
  });
});
