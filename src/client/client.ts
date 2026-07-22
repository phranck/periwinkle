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
      if (event.target instanceof Element && event.target.closest("[data-pw-tab]")) return;
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
  bindSidebarScrollState(root);
  bindSearchDialog(root);
  bindSchemaTabs(root);
}
