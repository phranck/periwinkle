/**
 * periwinkle client-side interactivity.
 *
 * A small framework-free enhancement layer over the statically rendered
 * markup. Everything binds through `data-pw-*` attributes, so the page stays
 * fully usable without JavaScript: native `details`/`summary` collapsing and
 * anchor navigation keep working; this layer adds persistence, filtering,
 * the theme toggle, and the schema view tabs.
 */

const STORAGE_PREFIX = "periwinkle:";
/** localStorage key holding the explicit theme choice (`light` or `dark`). */
export const THEME_STORAGE_KEY = `${STORAGE_PREFIX}theme`;

function storageGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function storageSet(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage may be unavailable (private mode, embedded contexts); the page
    // works without persistence.
  }
}

/**
 * Applies the initial theme: an explicit stored choice wins, otherwise the
 * OS preference. Sets `data-theme` on the document element.
 *
 * @param root The document to apply the theme to.
 */
export function initTheme(root: Document): void {
  const stored = storageGet(THEME_STORAGE_KEY);
  const preferred = window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  const theme = stored === "dark" || stored === "light" ? stored : preferred;
  root.documentElement.dataset.theme = theme;
}

/**
 * Binds every `[data-pw-theme-toggle]` button: clicking flips the
 * `data-theme` attribute and persists the explicit choice.
 *
 * @param root The document containing the toggles.
 */
export function bindThemeToggle(root: Document): void {
  for (const button of root.querySelectorAll<HTMLButtonElement>("[data-pw-theme-toggle]")) {
    button.addEventListener("click", () => {
      const next = root.documentElement.dataset.theme === "dark" ? "light" : "dark";
      root.documentElement.dataset.theme = next;
      storageSet(THEME_STORAGE_KEY, next);
    });
  }
}

function sectionStorageKey(key: string): string {
  return `${STORAGE_PREFIX}section:${key}:open`;
}

/**
 * Restores and persists the open state of every collapsible section
 * (`[data-pw-nav-section]` in the rail, `[data-pw-schema-card]` cards).
 *
 * @param root The document containing the sections.
 */
export function bindCollapsibles(root: Document): void {
  const sections = root.querySelectorAll<HTMLDetailsElement>(
    "[data-pw-nav-section], [data-pw-schema-card]",
  );
  for (const section of sections) {
    const key = section.dataset.pwNavSection ?? section.dataset.pwSchemaCard;
    if (!key) continue;
    if (storageGet(sectionStorageKey(key)) === "true") section.open = true;
    section.addEventListener("toggle", () => {
      storageSet(sectionStorageKey(key), String(section.open));
    });
  }
}

/**
 * Binds the expand/collapse-all control in the sidebar brand row: when any
 * section is closed the button expands all, otherwise it collapses all. The
 * surrounding nav carries `data-pw-all-expanded` so the stylesheet can swap
 * the button's direction icon, and each change persists like a manual
 * toggle.
 *
 * @param root The document containing the sidebar.
 */
export function bindToggleAll(root: Document): void {
  const nav = root.querySelector<HTMLElement>("[data-pw-nav]");
  const button = root.querySelector<HTMLButtonElement>("[data-pw-toggle-all]");
  if (!nav || !button) return;

  const sections = (): HTMLDetailsElement[] => [
    ...nav.querySelectorAll<HTMLDetailsElement>("[data-pw-nav-section]"),
  ];

  const update = (): void => {
    const allExpanded = sections().every((section) => section.open);
    nav.dataset.pwAllExpanded = String(allExpanded);
    const label = allExpanded ? "Collapse all sections" : "Expand all sections";
    button.setAttribute("aria-label", label);
    button.setAttribute("title", label);
  };

  button.addEventListener("click", () => {
    const shouldExpand = sections().some((section) => !section.open);
    for (const section of sections()) section.open = shouldExpand;
    update();
  });
  for (const section of sections()) section.addEventListener("toggle", update);
  update();
}

/**
 * Binds the sidebar filter input: matching compares the query against each
 * item's `data-pw-search-text`. Sections without any matching item hide;
 * sections with matches open while a query is active. Clearing the query
 * restores the pre-search open states.
 *
 * @param root The document containing the sidebar.
 */
export function bindSearch(root: Document): void {
  const input = root.querySelector<HTMLInputElement>("[data-pw-search]");
  if (!input) return;

  const items = [...root.querySelectorAll<HTMLElement>("[data-pw-nav-item][data-pw-search-text]")];
  const sections = [...root.querySelectorAll<HTMLDetailsElement>("[data-pw-nav-section]")];
  const openStates = new WeakMap<HTMLDetailsElement, boolean>();
  let searching = false;

  input.addEventListener("input", () => {
    const query = input.value.trim().toLowerCase();

    if (query && !searching) {
      searching = true;
      for (const section of sections) openStates.set(section, section.open);
    }

    if (!query) {
      for (const item of items) item.hidden = false;
      for (const section of sections) {
        section.hidden = false;
        if (searching) section.open = openStates.get(section) ?? false;
      }
      searching = false;
      return;
    }

    for (const item of items) {
      const text = item.dataset.pwSearchText ?? "";
      item.hidden = !text.includes(query);
    }
    for (const section of sections) {
      const sectionText = section.dataset.pwSearchText ?? "";
      const hasVisibleItem = [...section.querySelectorAll<HTMLElement>("[data-pw-nav-item]")].some(
        (item) => !item.hidden,
      );
      section.hidden = !hasVisibleItem && !sectionText.includes(query);
      if (!section.hidden) section.open = true;
    }
  });
}

/**
 * Binds the schema card view tabs: `[data-pw-tab]` buttons switch the
 * sibling `[data-pw-panel]` visibility inside the same card. Clicks must not
 * toggle the surrounding `details` element, so the handler stops the event.
 *
 * @param root The document containing the schema cards.
 */
export function bindSchemaTabs(root: Document): void {
  for (const card of root.querySelectorAll<HTMLElement>("[data-pw-schema-card]")) {
    const tabs = [...card.querySelectorAll<HTMLButtonElement>("[data-pw-tab]")];
    const panels = [...card.querySelectorAll<HTMLElement>("[data-pw-panel]")];
    for (const tab of tabs) {
      tab.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const view = tab.dataset.pwTab;
        if (!view) return;
        for (const other of tabs) {
          other.setAttribute("aria-pressed", String(other === tab));
        }
        for (const panel of panels) {
          panel.hidden = panel.dataset.pwPanel !== view;
        }
        const details = card.closest("details");
        if (details && !details.open) details.open = true;
      });
    }
  }
}

/**
 * Wires the complete interactivity layer for one document.
 *
 * @param root The document to enhance. Defaults are bound once; calling
 *   twice would double-register listeners.
 */
export function setupPeriwinkle(root: Document): void {
  initTheme(root);
  bindThemeToggle(root);
  bindCollapsibles(root);
  bindToggleAll(root);
  bindSearch(root);
  bindSchemaTabs(root);
}
