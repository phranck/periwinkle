/**
 * periwinkle client-side interactivity.
 *
 * A small framework-free enhancement layer over the statically rendered
 * markup. Everything binds through `data-pw-*` attributes, so the page stays
 * fully usable without JavaScript: native `details`/`summary` collapsing and
 * anchor navigation keep working; this layer adds persistence, the document
 * search dialog, the theme toggle, the sidebar header's scroll shadow, and
 * the schema view tabs.
 */

import { bindOpenApiContractDialog } from "./openapi-contract-dialog.js";
import { bindSearchDialog } from "./search.js";

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

const sectionAnimations = new WeakMap<HTMLDetailsElement, Animation>();
const sectionStates = new WeakMap<HTMLDetailsElement, boolean>();

/** Returns the CSS-controlled duration so reduced-motion remains authoritative. */
function sectionTransitionDuration(section: HTMLElement): number {
  return (
    Number.parseFloat(
      window.getComputedStyle(section).getPropertyValue("--pw-nav-transition-duration"),
    ) || 0
  );
}

/** Uses one quiet, symmetric easing curve for opening and closing disclosures. */
function sectionTransitionEasing(section: HTMLElement): string {
  return (
    window.getComputedStyle(section).getPropertyValue("--pw-nav-transition-easing").trim() ||
    "ease-in-out"
  );
}

function sectionContent(section: HTMLDetailsElement): HTMLElement | null {
  return section.querySelector<HTMLElement>(
    ":scope > .api-reference-nav__content, :scope > .pw-schema-card__body",
  );
}

/**
 * Animates a measured height instead of an interpolated grid track. This is
 * interruptible, avoids timer-based closing, and keeps native details usable
 * before JavaScript loads. Ported from the reference implementation.
 *
 * @param section The `details` element to open or close.
 * @param expanded Target state.
 */
export function setSectionOpen(section: HTMLDetailsElement, expanded: boolean): void {
  if ((sectionStates.get(section) ?? section.open) === expanded) return;
  const content = sectionContent(section);
  if (!content) {
    section.open = expanded;
    sectionStates.set(section, expanded);
    return;
  }

  const previousAnimation = sectionAnimations.get(section);
  previousAnimation?.commitStyles();
  previousAnimation?.cancel();
  sectionStates.set(section, expanded);

  const duration = sectionTransitionDuration(section);
  const easing = sectionTransitionEasing(section);
  const finishOpening = () => {
    content.style.height = "auto";
    content.style.opacity = "1";
    sectionAnimations.delete(section);
  };
  const finishClosing = () => {
    section.open = false;
    content.style.removeProperty("height");
    content.style.removeProperty("opacity");
    sectionAnimations.delete(section);
  };

  if (expanded) {
    section.open = true;
    section.dataset.pwExpanded = "true";
    content.style.height = "0px";
    content.style.opacity = "0";

    const targetHeight = content.scrollHeight;
    if (!duration || typeof content.animate !== "function") {
      finishOpening();
      return;
    }

    const animation = content.animate(
      [
        { height: "0px", opacity: 0 },
        { height: `${targetHeight}px`, opacity: 1 },
      ],
      { duration, easing, fill: "forwards" },
    );
    sectionAnimations.set(section, animation);
    void animation.finished
      .then(() => {
        if (sectionAnimations.get(section) === animation) finishOpening();
      })
      .catch(() => undefined);
    return;
  }

  section.dataset.pwExpanded = "false";
  const startHeight = content.getBoundingClientRect().height;
  content.style.height = `${startHeight}px`;
  content.style.opacity = "1";
  if (!duration || !startHeight || typeof content.animate !== "function") {
    finishClosing();
    return;
  }

  const animation = content.animate(
    [
      { height: `${startHeight}px`, opacity: 1 },
      { height: "0px", opacity: 0 },
    ],
    { duration, easing, fill: "forwards" },
  );
  sectionAnimations.set(section, animation);
  void animation.finished
    .then(() => {
      if (sectionAnimations.get(section) === animation) finishClosing();
    })
    .catch(() => undefined);
}

/**
 * Restores and persists the open state of every collapsible section
 * (`[data-pw-nav-section]` in the rail, `[data-pw-schema-card]` cards) and
 * routes summary clicks through the animated open/close, exactly like the
 * reference implementation.
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
    if (storageGet(sectionStorageKey(key)) === "true") {
      section.open = true;
      section.dataset.pwExpanded = "true";
      sectionStates.set(section, true);
    } else {
      sectionStates.set(section, false);
    }

    section.querySelector("summary")?.addEventListener("click", (event) => {
      // Tab buttons inside the summary switch views, they never toggle.
      if (event.target instanceof Element && event.target.closest("[data-schema-view-tab]")) return;
      event.preventDefault();
      const expanded = section.dataset.pwExpanded !== "true";
      setSectionOpen(section, expanded);
      storageSet(sectionStorageKey(key), String(expanded));
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
    const shouldExpand = sections().some(
      (section) => !(sectionStates.get(section) ?? section.open),
    );
    for (const section of sections()) {
      setSectionOpen(section, shouldExpand);
      const key = section.dataset.pwNavSection ?? section.dataset.pwSchemaCard;
      if (key) storageSet(sectionStorageKey(key), String(shouldExpand));
    }
    update();
  });
  for (const section of sections()) section.addEventListener("toggle", update);
  update();
}

/**
 * Keeps the sidebar header shadow tied to the rail's own scroll position,
 * exactly like the reference implementation: the nav carries
 * `data-pw-nav-scrolled` so the stylesheet can raise the glass header's
 * shadow once the scroll region (`[data-pw-nav-body]`) has scrolled.
 *
 * @param root The document containing the sidebar.
 */
export function bindSidebarScrollState(root: Document): void {
  for (const nav of root.querySelectorAll<HTMLElement>("[data-pw-nav]")) {
    const scrollRegion = nav.querySelector<HTMLElement>("[data-pw-nav-body]");
    if (!scrollRegion) continue;
    const update = (): void => {
      nav.dataset.pwNavScrolled = String(scrollRegion.scrollTop > 0);
    };
    update();
    scrollRegion.addEventListener("scroll", update, { passive: true });
  }
}

/** Keyboard keys that move focus/selection inside the schema view tablist. */
const SCHEMA_TAB_NAV_KEYS = new Set(["ArrowLeft", "ArrowRight", "Home", "End"]);

function schemaViewStorageKey(cardKey: string): string {
  return `${STORAGE_PREFIX}schema-view:${cardKey}`;
}

/**
 * Binds one schema card's view switch. The switch is a segmented control
 * with `role="tablist"`; each `[data-schema-view-tab]` sets a value the
 * client mirrors onto the card via `data-schema-view`, keeps
 * `aria-selected` and `tabIndex` in sync, and updates the sibling
 * `[data-schema-view-panel]` visibility. Arrow/Home/End keys cycle focus
 * exactly like the reference `SchemaCardsController`.
 *
 * The last selected view per card persists in `localStorage` under the
 * `periwinkle:schema-view:<anchor>` key so a reload restores the caller's
 * previous choice.
 */
function bindSchemaCard(card: HTMLElement): void {
  const tabs = [...card.querySelectorAll<HTMLButtonElement>("[data-schema-view-tab]")];
  if (tabs.length === 0) return;
  const panels = [...card.querySelectorAll<HTMLElement>("[data-schema-view-panel]")];
  const cardKey = card.dataset.pwSchemaCard;

  /** Available view names, taken from the tab attributes so the map is source-of-truth. */
  const views = new Set(tabs.map((tab) => tab.dataset.schemaViewTab ?? "fields"));

  const select = (view: string, focus = false): void => {
    if (!views.has(view)) return;
    card.dataset.schemaView = view;
    for (const tab of tabs) {
      const selected = tab.dataset.schemaViewTab === view;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (selected && focus) tab.focus();
    }
    for (const panel of panels) {
      panel.hidden = panel.dataset.schemaViewPanel !== view;
    }
    if (cardKey) storageSet(schemaViewStorageKey(cardKey), view);
  };

  // Restore the persisted view before wiring listeners so the initial paint
  // reflects the user's last choice instead of the SSR default.
  const stored = cardKey ? storageGet(schemaViewStorageKey(cardKey)) : null;
  if (stored && views.has(stored)) select(stored);

  for (const tab of tabs) {
    tab.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const view = tab.dataset.schemaViewTab;
      if (view) select(view);
    });
    tab.addEventListener("keydown", (event) => {
      if (!SCHEMA_TAB_NAV_KEYS.has(event.key)) return;
      event.preventDefault();
      event.stopPropagation();
      const currentIndex = tabs.indexOf(tab);
      const nextIndex =
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? tabs.length - 1
            : (currentIndex + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
      const nextTab = tabs[nextIndex];
      const nextView = nextTab?.dataset.schemaViewTab;
      if (nextView) select(nextView, true);
    });
  }
}

/**
 * Binds every schema card's tablist: click, keyboard navigation, and
 * per-card persistence of the selected view. Clicks inside the tablist must
 * not toggle the surrounding `details` element, which the summary handler
 * in {@link bindCollapsibles} already guards against by ignoring events
 * whose target sits inside `[data-schema-view-tab]`.
 *
 * @param root The document containing the schema cards.
 */
export function bindSchemaTabs(root: Document): void {
  for (const card of root.querySelectorAll<HTMLElement>("[data-pw-schema-card]")) {
    bindSchemaCard(card);
  }
}

/** Duration for the visible successful-copy acknowledgement. */
export const COPY_SUCCESS_DURATION_MS = 3000;

/** Minimal clipboard surface, injectable for tests. */
interface ClipboardWriter {
  writeText(text: string): Promise<void>;
}

/**
 * Binds one delegated copy listener for all rendered code blocks, ported
 * from the reference `code-copy` script: the button's `data-copy-target`
 * names the code frame, the copied text is read back from the rendered
 * `code` node (so the clipboard yields the exact source), the success icon
 * shows for {@link COPY_SUCCESS_DURATION_MS} with an `aria-live` status
 * update, and a failed write downgrades the control to a "select to copy"
 * hint instead of throwing.
 *
 * @param root The document containing the code blocks.
 * @param clipboard Clipboard writer; defaults to `navigator.clipboard`.
 * @returns Cleanup function removing the listener and pending reset timers,
 *   which keeps the behavior safe for tests and future page transitions.
 */
export function bindCopyButtons(
  root: Document,
  clipboard: ClipboardWriter = navigator.clipboard,
): () => void {
  const resetTimers = new Map<HTMLButtonElement, number>();

  /** Keeps the single visual control stable while swapping its semantic icon. */
  const setIconState = (button: HTMLButtonElement, copied: boolean) => {
    button.querySelector<HTMLElement>("[data-copy-icon]")?.toggleAttribute("hidden", copied);
    button.querySelector<HTMLElement>("[data-copy-success]")?.toggleAttribute("hidden", !copied);
  };

  const reset = (button: HTMLButtonElement) => {
    const block = button.closest<HTMLElement>("[data-code-block]");
    setIconState(button, false);
    button.setAttribute("aria-label", "Copy code");
    button.setAttribute("title", "Copy code");
    block?.querySelector<HTMLElement>("[data-copy-status]")?.replaceChildren();
    resetTimers.delete(button);
  };

  const onClick = async (event: Event) => {
    const button =
      event.target instanceof Element ? event.target.closest("[data-copy-code]") : null;
    if (!(button instanceof HTMLButtonElement)) return;

    const targetId = button.dataset.copyTarget;
    const target = targetId ? root.getElementById(targetId) : null;
    const code = target?.matches("code") ? target : target?.querySelector("code");
    const text = code?.textContent;
    if (!text) return;

    const block = button.closest<HTMLElement>("[data-code-block]");
    const success = block?.querySelector<HTMLElement>("[data-copy-success]");
    const status = block?.querySelector<HTMLElement>("[data-copy-status]");

    try {
      await clipboard.writeText(text);
      const previousTimer = resetTimers.get(button);
      if (previousTimer !== undefined) window.clearTimeout(previousTimer);
      if (success) {
        success.hidden = true;
        void success.offsetWidth;
      }
      setIconState(button, true);
      button.setAttribute("aria-label", "Code copied");
      button.setAttribute("title", "Code copied");
      status?.replaceChildren("Code copied");
      const timer = window.setTimeout(() => reset(button), COPY_SUCCESS_DURATION_MS);
      resetTimers.set(button, timer);
    } catch {
      setIconState(button, false);
      button.setAttribute("aria-label", "Select code to copy");
      button.setAttribute("title", "Select code to copy");
      status?.replaceChildren("Copy unavailable");
    }
  };

  root.addEventListener("click", onClick);
  return () => {
    root.removeEventListener("click", onClick);
    for (const timer of resetTimers.values()) window.clearTimeout(timer);
    resetTimers.clear();
  };
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
  bindSidebarScrollState(root);
  bindSearchDialog(root);
  bindSchemaTabs(root);
  bindCopyButtons(root);
  bindOpenApiContractDialog(root);
}
