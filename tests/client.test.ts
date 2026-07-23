// @vitest-environment happy-dom
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  bindCopyButtons,
  bindSchemaTabs,
  bindSidebarScrollState,
  bindThemeToggle,
  bindToggleAll,
  COPY_SUCCESS_DURATION_MS,
  initTheme,
  setupPeriwinkle,
  THEME_STORAGE_KEY,
} from "../src/client/client.js";
import { bindOpenApiContractDialog } from "../src/client/openapi-contract-dialog.js";
import { bindSearchDialog } from "../src/client/search.js";
import { SearchDialog } from "../src/components/SearchDialog.jsx";

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
    <nav class="sidebar api-reference-nav surface-card" data-pw-nav>
      <header class="sidebar__header">
        <button type="button" data-pw-toggle-all></button>
        <button type="button" data-pw-theme-toggle></button>
        <label class="pw-nav__search"><input type="search" readonly data-pw-search /></label>
      </header>
      <div class="sidebar__body" data-pw-nav-body>
        <details class="sidebar__section api-reference-nav__section" data-pw-nav-section="books" data-pw-search-text="books">
          <summary>Books</summary>
          <div class="api-reference-nav__content">
            <ul>
              <li><a data-pw-nav-item data-pw-search-text="all books get /books" href="#a">All books</a></li>
              <li><a data-pw-nav-item data-pw-search-text="create book post /books" href="#b">Create Book</a></li>
            </ul>
          </div>
        </details>
        <details class="sidebar__section api-reference-nav__section" data-pw-nav-section="authors" data-pw-search-text="authors">
          <summary>Authors</summary>
          <div class="api-reference-nav__content">
            <ul>
              <li><a data-pw-nav-item data-pw-search-text="list authors" href="#c">List Authors</a></li>
            </ul>
          </div>
        </details>
      </div>
    </nav>
    <main data-api-search-root>
      <article
        id="op-create-book"
        data-api-search-entry
        data-api-search-group="Books"
        data-api-search-title="Create Book"
        data-api-search-addon="POST /books"
        data-api-search-kind="operation"
        data-api-search-target="op-create-book"
      >
        <p>Create a new book in the catalog.</p>
      </article>
      <details
        id="schema-book"
        data-pw-schema-card="schema-book"
        data-schema-view="fields"
        data-api-search-entry
        data-api-search-group="Schemas"
        data-api-search-title="Book"
        data-api-search-addon="Schema"
        data-api-search-kind="schema"
        data-api-search-target="schema-book"
      >
        <summary>
          <div class="segmented-control" role="tablist" aria-label="Schema view for Book">
            <button
              type="button"
              class="segmented-control__item"
              id="schema-book-fields-tab"
              role="tab"
              aria-controls="schema-book-fields"
              aria-selected="true"
              tabindex="0"
              data-schema-view-tab="fields"
            >Fields</button>
            <button
              type="button"
              class="segmented-control__item"
              id="schema-book-json-tab"
              role="tab"
              aria-controls="schema-book-json"
              aria-selected="false"
              tabindex="-1"
              data-schema-view-tab="json"
            >JSON</button>
          </div>
        </summary>
        <div class="pw-schema-card__body">
          <div
            id="schema-book-fields"
            role="tabpanel"
            aria-labelledby="schema-book-fields-tab"
            data-schema-view-panel="fields"
          ><p>A book record.</p></div>
          <div
            id="schema-book-json"
            role="tabpanel"
            aria-labelledby="schema-book-json-tab"
            data-schema-view-panel="json"
            hidden
          ></div>
        </div>
      </details>
    </main>
  `;

/** The real dialog markup, so the fixture can never drift from the component. */
const DIALOG_FIXTURE = renderToStaticMarkup(createElement(SearchDialog));

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
  document.body.innerHTML = PAGE_FIXTURE + DIALOG_FIXTURE;
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

describe("search dialog", () => {
  function dialog(): HTMLDialogElement {
    const element = document.querySelector<HTMLDialogElement>("[data-api-search-dialog]");
    if (!element) throw new Error("missing search dialog");
    return element;
  }

  function dialogInput(): HTMLInputElement {
    const input = document.querySelector<HTMLInputElement>(".search-dialog__header-search-input");
    if (!input) throw new Error("missing dialog input");
    return input;
  }

  function pressKey(key: string): void {
    dialogInput().dispatchEvent(
      new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }),
    );
  }

  beforeEach(() => {
    vi.useFakeTimers();
    bindSearchDialog(document);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("opens as a modal when the sidebar trigger is clicked", () => {
    const trigger = document.querySelector<HTMLInputElement>("[data-pw-search]");
    trigger?.click();
    expect(dialog().open).toBe(true);
    expect(dialog().dataset.state).toBe("open");
    expect(dialogInput().getAttribute("aria-expanded")).toBe("true");
  });

  it("renders grouped results for a query", () => {
    document.querySelector<HTMLInputElement>("[data-pw-search]")?.click();
    const input = dialogInput();
    input.value = "book";
    input.dispatchEvent(new Event("input", { bubbles: true }));

    const groups = [...document.querySelectorAll(".search-dialog__group-header-title")];
    expect(groups.map((group) => group.textContent)).toEqual(["Schemas", "Books"]);
    const options = [...document.querySelectorAll<HTMLElement>('[role="option"]')];
    expect(options).toHaveLength(2);
    // The exact-title match ranks first and is preselected.
    expect(options[0]?.getAttribute("aria-selected")).toBe("true");
    expect(options[0]?.textContent).toContain("Book");
    expect(input.getAttribute("aria-activedescendant")).toBe(options[0]?.id);
  });

  it("closes on Escape without navigating", () => {
    document.querySelector<HTMLInputElement>("[data-pw-search]")?.click();
    pressKey("Escape");
    expect(dialog().dataset.state).toBe("closing");
    vi.runAllTimers();
    expect(dialog().open).toBe(false);
    expect(dialog().dataset.state).toBeUndefined();
  });

  it("navigates to the selected result on Enter", () => {
    document.querySelector<HTMLInputElement>("[data-pw-search]")?.click();
    const input = dialogInput();
    input.value = "book record";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    pressKey("Enter");
    vi.runAllTimers();

    expect(dialog().open).toBe(false);
    expect(window.location.hash).toBe("#schema-book");
    const schemaCard = document.querySelector<HTMLDetailsElement>("#schema-book");
    expect(schemaCard?.open).toBe(true);
    expect(document.querySelectorAll("mark[data-api-search-highlight]").length).toBeGreaterThan(0);
    const notice = document.querySelector<HTMLElement>(".api-search-highlight-notice");
    expect(notice?.hidden).toBe(false);
    expect(notice?.textContent).toContain("highlighted");
  });

  it("clears highlights via Escape outside the dialog", () => {
    document.querySelector<HTMLInputElement>("[data-pw-search]")?.click();
    const input = dialogInput();
    input.value = "book record";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    pressKey("Enter");
    vi.runAllTimers();

    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }),
    );
    expect(document.querySelectorAll("mark[data-api-search-highlight]")).toHaveLength(0);
    expect(document.querySelector<HTMLElement>(".api-search-highlight-notice")?.hidden).toBe(true);
  });
});

describe("toggle all", () => {
  it("expands all sections when any is closed, then collapses all", () => {
    bindToggleAll(document);
    const nav = document.querySelector<HTMLElement>("[data-pw-nav]");
    const button = document.querySelector<HTMLButtonElement>("[data-pw-toggle-all]");
    const sections = () => [
      ...document.querySelectorAll<HTMLDetailsElement>("[data-pw-nav-section]"),
    ];

    expect(nav?.dataset.pwAllExpanded).toBe("false");
    expect(button?.getAttribute("aria-label")).toBe("Expand all sections");

    button?.click();
    expect(sections().every((section) => section.open)).toBe(true);
    expect(nav?.dataset.pwAllExpanded).toBe("true");
    expect(button?.getAttribute("aria-label")).toBe("Collapse all sections");

    button?.click();
    expect(sections().every((section) => !section.open)).toBe(true);
    expect(nav?.dataset.pwAllExpanded).toBe("false");
  });
});

describe("sidebar scroll state", () => {
  it("mirrors the scroll region position onto the nav for the header shadow", () => {
    bindSidebarScrollState(document);
    const nav = document.querySelector<HTMLElement>("[data-pw-nav]");
    const scrollRegion = document.querySelector<HTMLElement>("[data-pw-nav-body]");
    expect(nav?.dataset.pwNavScrolled).toBe("false");

    if (scrollRegion) {
      scrollRegion.scrollTop = 40;
      scrollRegion.dispatchEvent(new Event("scroll"));
    }
    expect(nav?.dataset.pwNavScrolled).toBe("true");
  });
});

describe("schema tabs", () => {
  function jsonTab(): HTMLButtonElement | null {
    return document.querySelector<HTMLButtonElement>('[data-schema-view-tab="json"]');
  }
  function fieldsTab(): HTMLButtonElement | null {
    return document.querySelector<HTMLButtonElement>('[data-schema-view-tab="fields"]');
  }
  function fieldsPanel(): HTMLElement | null {
    return document.querySelector<HTMLElement>('[data-schema-view-panel="fields"]');
  }
  function jsonPanel(): HTMLElement | null {
    return document.querySelector<HTMLElement>('[data-schema-view-panel="json"]');
  }
  function card(): HTMLDetailsElement | null {
    return document.querySelector<HTMLDetailsElement>("[data-pw-schema-card]");
  }

  it("switches panels and aria-selected without closing the card", () => {
    bindSchemaTabs(document);
    const c = card();
    if (c) c.open = true;
    jsonTab()?.click();
    expect(jsonTab()?.getAttribute("aria-selected")).toBe("true");
    expect(fieldsTab()?.getAttribute("aria-selected")).toBe("false");
    expect(jsonTab()?.tabIndex).toBe(0);
    expect(fieldsTab()?.tabIndex).toBe(-1);
    expect(c?.dataset.schemaView).toBe("json");
    expect(fieldsPanel()?.hidden).toBe(true);
    expect(jsonPanel()?.hidden).toBe(false);
    expect(c?.open).toBe(true);
  });

  it("moves selection with ArrowRight/ArrowLeft/Home/End and focuses the new tab", () => {
    bindSchemaTabs(document);
    fieldsTab()?.focus();
    fieldsTab()?.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    expect(document.activeElement).toBe(jsonTab());
    expect(jsonTab()?.getAttribute("aria-selected")).toBe("true");

    jsonTab()?.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
    expect(document.activeElement).toBe(fieldsTab());
    expect(fieldsTab()?.getAttribute("aria-selected")).toBe("true");

    fieldsTab()?.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    expect(document.activeElement).toBe(jsonTab());

    jsonTab()?.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    expect(document.activeElement).toBe(fieldsTab());
  });

  it("persists the selected view per card and restores it on rebind", () => {
    bindSchemaTabs(document);
    jsonTab()?.click();
    expect(window.localStorage.getItem("periwinkle:schema-view:schema-book")).toBe("json");

    // Reset DOM to the pristine fixture (fields selected) and rebind — the
    // controller must restore the persisted view.
    document.body.innerHTML = PAGE_FIXTURE + DIALOG_FIXTURE;
    bindSchemaTabs(document);
    expect(card()?.dataset.schemaView).toBe("json");
    expect(jsonTab()?.getAttribute("aria-selected")).toBe("true");
    expect(fieldsPanel()?.hidden).toBe(true);
    expect(jsonPanel()?.hidden).toBe(false);
  });
});

describe("copy buttons", () => {
  /** Static markup mirroring the rendered CodeBlock compound. */
  const CODE_BLOCK_FIXTURE = `
    <div class="code-block" data-code-block>
      <div class="code-block__surface" data-code-line-numbers>
        <div class="code-block__actions">
          <button type="button" class="code-block__copy" aria-label="Copy code" title="Copy code" data-copy-code data-copy-target="code-abc123def456">
            <span data-copy-icon></span>
            <span data-copy-success hidden></span>
          </button>
        </div>
        <span class="sr-only" aria-live="polite" data-copy-status></span>
        <div id="code-abc123def456" class="content-panel code-block__frame"><pre class="shiki"><code><span class="line">{</span>
<span class="line">  "ok": true</span>
<span class="line">}</span></code></pre></div>
      </div>
    </div>
  `;

  let cleanup: (() => void) | undefined;

  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = CODE_BLOCK_FIXTURE;
  });

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
    vi.useRealTimers();
  });

  function copyButton(): HTMLButtonElement {
    const button = document.querySelector<HTMLButtonElement>("[data-copy-code]");
    if (!button) throw new Error("missing copy button");
    return button;
  }

  it("copies the raw source and shows the success state until the timeout", async () => {
    const writeText = vi.fn<(text: string) => Promise<void>>().mockResolvedValue(undefined);
    cleanup = bindCopyButtons(document, { writeText });
    const button = copyButton();
    const copyIcon = document.querySelector<HTMLElement>("[data-copy-icon]");
    const success = document.querySelector<HTMLElement>("[data-copy-success]");
    const status = document.querySelector<HTMLElement>("[data-copy-status]");

    button.click();
    await vi.advanceTimersByTimeAsync(0);

    expect(writeText).toHaveBeenCalledWith('{\n  "ok": true\n}');
    expect(copyIcon?.hidden).toBe(true);
    expect(success?.hidden).toBe(false);
    expect(button.getAttribute("aria-label")).toBe("Code copied");
    expect(status?.textContent).toBe("Code copied");

    await vi.advanceTimersByTimeAsync(COPY_SUCCESS_DURATION_MS);
    expect(copyIcon?.hidden).toBe(false);
    expect(success?.hidden).toBe(true);
    expect(button.getAttribute("aria-label")).toBe("Copy code");
    expect(status?.textContent).toBe("");
  });

  it("falls back to a selection hint when the clipboard write fails", async () => {
    const writeText = vi.fn<(text: string) => Promise<void>>().mockRejectedValue(new Error("nope"));
    cleanup = bindCopyButtons(document, { writeText });
    const button = copyButton();

    button.click();
    await vi.advanceTimersByTimeAsync(0);

    expect(button.getAttribute("aria-label")).toBe("Select code to copy");
    expect(document.querySelector<HTMLElement>("[data-copy-status]")?.textContent).toBe(
      "Copy unavailable",
    );
    expect(document.querySelector<HTMLElement>("[data-copy-success]")?.hidden).toBe(true);
  });
});

describe("setupPeriwinkle", () => {
  it("wires everything without throwing", () => {
    expect(() => setupPeriwinkle(document)).not.toThrow();
    expect(document.documentElement.dataset.theme).toMatch(/^(light|dark)$/);
  });
});

describe("openapi contract dialog", () => {
  const DIALOG_FIXTURE_MARKUP = `
    <button
      type="button"
      data-openapi-contract-trigger
      aria-controls="openapi-contract-dialog"
      aria-haspopup="dialog"
    >View OpenAPI contract</button>
    <dialog
      id="openapi-contract-dialog"
      class="api-dialog surface-card openapi-contract-dialog"
      data-openapi-contract-dialog
      data-openapi-contract-source="openapi-contract-source"
      data-openapi-contract-state="loading"
    >
      <button type="button" data-openapi-contract-close>Close</button>
      <div class="api-dialog__body">
        <div class="openapi-contract-dialog__loading"><span class="sr-only">Loading</span></div>
        <div class="code-block" data-code-block>
          <div class="code-block__surface">
            <div class="content-panel code-block__frame"></div>
          </div>
        </div>
      </div>
    </dialog>
    <script
      type="application/json"
      id="openapi-contract-source"
    >"&lt;pre class=&quot;shiki&quot;&gt;&lt;code&gt;line-1\\nline-2&lt;/code&gt;&lt;/pre&gt;"</script>
  `;

  beforeEach(() => {
    document.body.innerHTML = DIALOG_FIXTURE_MARKUP;
    // happy-dom's HTMLDialogElement lacks showModal/close in some versions;
    // patch minimal implementations so the client binder can drive the modal.
    const dialog = document.querySelector<HTMLDialogElement>("dialog");
    if (dialog) {
      dialog.showModal = function showModal() {
        this.open = true;
        this.dispatchEvent(new Event("open"));
      };
      dialog.close = function close() {
        if (!this.open) return;
        this.open = false;
        this.dispatchEvent(new Event("close"));
      };
    }
  });

  it("opens on trigger click and closes on Escape", () => {
    bindOpenApiContractDialog(document);
    const dialog = document.querySelector<HTMLDialogElement>("dialog");
    const trigger = document.querySelector<HTMLButtonElement>("[data-openapi-contract-trigger]");

    trigger?.click();
    expect(dialog?.open).toBe(true);

    // Native Escape dispatches a `cancel` event; the binder cancels the
    // default and closes explicitly so animations can play.
    const cancelEvent = new Event("cancel", { cancelable: true, bubbles: true });
    dialog?.dispatchEvent(cancelEvent);
    expect(dialog?.open).toBe(false);
  });

  it("closes when the dedicated close control is clicked", () => {
    bindOpenApiContractDialog(document);
    const dialog = document.querySelector<HTMLDialogElement>("dialog");
    const trigger = document.querySelector<HTMLButtonElement>("[data-openapi-contract-trigger]");
    const closeButton = document.querySelector<HTMLButtonElement>("[data-openapi-contract-close]");

    trigger?.click();
    expect(dialog?.open).toBe(true);
    closeButton?.click();
    expect(dialog?.open).toBe(false);
  });
});
