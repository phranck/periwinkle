/**
 * Client bundle for the generated `config-builder.html` page.
 *
 * The React component in `components/ConfigBuilder.tsx` renders the
 * static shell (top bar, section headers, empty body wrappers, preview
 * pane). This module attaches the interactivity on top:
 *
 * - loads and merges section open/close state from localStorage
 * - wires the section-summary toggle with a grid-template-rows
 *   collapse animation that works in both directions
 * - keeps a mutable `state` tree that mirrors the resolved config
 *   shape; every field widget writes into it
 * - exposes `render()` (full form rebuild after structural changes)
 *   and `updatePreview()` (fast path for text/toggle/color inputs)
 *
 * Step 3 sets up the foundation only: constants, state, section
 * toggling, and stubs for field rendering. Step 4 fills the field
 * widgets and top-bar handlers, step 5 wires the preview.
 */

// ---------- Defaults (mirrored from src/config/config.ts) ----------

export interface ColorPalette {
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textMuted: string;
  textFaint: string;
  accent: string;
  border: string;
  link: string;
  methodGet: string;
  methodPost: string;
  methodPut: string;
  methodPatch: string;
  methodDelete: string;
  statusSuccess: string;
  statusError: string;
}

const DEFAULT_LIGHT_COLORS: ColorPalette = {
  background: "#ffffff",
  surface: "#f6f8fa",
  surfaceAlt: "#eff2f5",
  text: "#1f2328",
  textMuted: "#59636e",
  textFaint: "#818b98",
  accent: "#6667ab",
  border: "#d1d9e0",
  link: "#5253a3",
  methodGet: "#0969da",
  methodPost: "#1a7f37",
  methodPut: "#bc4c00",
  methodPatch: "#9a6700",
  methodDelete: "#d1242f",
  statusSuccess: "#1a7f37",
  statusError: "#d1242f",
};

const DEFAULT_DARK_COLORS: ColorPalette = {
  background: "#0d1117",
  surface: "#161b22",
  surfaceAlt: "#21262d",
  text: "#e6edf3",
  textMuted: "#8b949e",
  textFaint: "#6e7681",
  accent: "#9a9bd4",
  border: "#30363d",
  link: "#a8a9e0",
  methodGet: "#58a6ff",
  methodPost: "#3fb950",
  methodPut: "#db6d28",
  methodPatch: "#d29922",
  methodDelete: "#f85149",
  statusSuccess: "#3fb950",
  statusError: "#f85149",
};

interface FontsState {
  base: string;
  heading: string;
  mono: string;
  stylesheets: string[];
}

const DEFAULT_FONTS: FontsState = {
  base: '"Barlow", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  heading:
    '"Barlow Condensed", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  mono: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", monospace',
  stylesheets: [
    "https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@500;600;700&display=swap",
  ],
};

const DEFAULT_RADIUS = "1rem";

interface NavigationLinkState {
  label: string;
  href: string;
  /** "" (same tab) or "_blank" (new tab). */
  target: string;
}

interface NavigationState {
  logo: string;
  showHome: boolean;
  homeLabel: string;
  homeHref: string;
  githubUrl: string;
  githubLabel: string;
  links: NavigationLinkState[];
}

const DEFAULT_NAVIGATION: NavigationState = {
  logo: "",
  showHome: true,
  homeLabel: "API reference",
  homeHref: "#",
  githubUrl: "",
  githubLabel: "",
  links: [],
};

interface SidebarState {
  title: string;
  showMethods: boolean;
}

const DEFAULT_SIDEBAR: SidebarState = {
  title: "Reference",
  showMethods: false,
};

/** Where a shared control (search, theme toggle) renders. */
export type PlacementValue = "navigation" | "sidebar" | "off";

export const PLACEMENT_OPTIONS: ReadonlyArray<{ key: PlacementValue; label: string }> = [
  { key: "navigation", label: "Top navigation" },
  { key: "sidebar", label: "Sidebar" },
  { key: "off", label: "Off" },
];

const SEARCH_DEFAULT: PlacementValue = "navigation";
const THEME_TOGGLE_DEFAULT: PlacementValue = "navigation";

interface FeaturesState {
  openApiContract: boolean;
  accessBadge: boolean;
  deprecatedBadge: boolean;
  copyButton: boolean;
}

const DEFAULT_FEATURES: FeaturesState = {
  openApiContract: true,
  accessBadge: true,
  deprecatedBadge: true,
  copyButton: true,
};

type SizingState = Record<string, string>;

const DEFAULT_SIZING: SizingState = {
  fontBody: "1.125rem",
  fontCode: "1rem",
  fontLead: "1.5rem",
  fontCardTitle: "1.375rem",
  fontSubsection: "1.625rem",
  fontSection: "2.25rem",
  fontHero: "3.25rem",
  sidebarWidth: "20rem",
  containerMaxWidth: "88rem",
  pagePadding: "1.5rem",
};

type MotionState = Record<string, string>;

const DEFAULT_MOTION: MotionState = {
  duration: "160ms",
  easing: "ease-in-out",
  codeLineHeight: "1.5",
  responseTintLight: "12%",
  responseTintDark: "16%",
  cardChromeMixLight: "6%",
  cardChromeMixDark: "12%",
  iconToneLight: "60%",
  iconToneDark: "100%",
};

interface GuideSection {
  key: string;
  label: string;
}

export const GUIDE_SECTIONS: ReadonlyArray<GuideSection> = [
  { key: "intro", label: "Intro" },
  { key: "auth", label: "Authentication" },
  { key: "requests", label: "Requests" },
  { key: "errors", label: "Errors" },
  { key: "rateLimits", label: "Rate limits" },
  { key: "versioning", label: "Versioning" },
];

/** Per-guide-section state: auto (derive from spec), custom Markdown, off. */
export type GuideMode = "default" | "custom" | "off";

interface GuideItemState {
  mode: GuideMode;
  markdown: string;
}

interface CustomSectionState {
  id: string;
  title: string;
  markdown: string;
  position: string;
}

interface FooterLinkState {
  label: string;
  href: string;
}

interface FooterState {
  text: string;
  links: FooterLinkState[];
}

interface BuilderState {
  spec: string;
  site: {
    basePath: string;
    serverUrl: string;
    title: string;
    logo: string;
    favicon: string;
  };
  theme: {
    colors: { light: ColorPalette; dark: ColorPalette };
    fonts: FontsState;
    radius: string;
  };
  navigation: NavigationState;
  sidebar: SidebarState;
  themeTogglePlacement: PlacementValue;
  searchPlacement: PlacementValue;
  features: FeaturesState;
  sizing: SizingState;
  motion: MotionState;
  guide: Record<string, GuideItemState>;
  customSections: CustomSectionState[];
  footer: FooterState;
}

/**
 * Initial state for a fresh visit. Seeded with the demo config so a
 * newcomer sees a working example instead of an empty form. The
 * built-in periwinkle defaults still drive the diff in
 * buildConfigObject() (step 5) — this only seeds the form values.
 */
function createInitialState(): BuilderState {
  const guide: Record<string, GuideItemState> = {};
  for (const s of GUIDE_SECTIONS) guide[s.key] = { mode: "default", markdown: "" };
  guide.rateLimits = {
    mode: "custom",
    markdown: "This is a demo deployment of a fictional API — there are no real rate limits.",
  };
  return {
    spec: "tests/fixtures/bookstore.openapi.json",
    site: {
      basePath: "/periwinkle",
      serverUrl: "https://api.bookstore.example",
      title: "",
      logo: "",
      favicon: "",
    },
    theme: {
      colors: {
        light: { ...DEFAULT_LIGHT_COLORS },
        dark: { ...DEFAULT_DARK_COLORS },
      },
      fonts: { ...DEFAULT_FONTS, stylesheets: [...DEFAULT_FONTS.stylesheets] },
      radius: DEFAULT_RADIUS,
    },
    navigation: {
      ...DEFAULT_NAVIGATION,
      logo: "resources/Logo_Banner/logo.svg",
      links: [
        { label: "Config builder", href: "/periwinkle/config-builder.html", target: "_blank" },
      ],
    },
    sidebar: { ...DEFAULT_SIDEBAR },
    themeTogglePlacement: THEME_TOGGLE_DEFAULT,
    searchPlacement: SEARCH_DEFAULT,
    features: { ...DEFAULT_FEATURES },
    sizing: { ...DEFAULT_SIZING },
    motion: { ...DEFAULT_MOTION },
    guide,
    customSections: [
      {
        id: "about-this-demo",
        title: "About this demo",
        markdown:
          "This site is the living demo of **periwinkle**, a static API documentation generator for OpenAPI 3.x. It is built from a fictional bookstore contract on every push to `main`.\n\nGet the source and usage instructions at [github.com/phranck/periwinkle](https://github.com/phranck/periwinkle).",
        position: "before-guide",
      },
    ],
    footer: {
      text: "Built with periwinkle",
      links: [
        { label: "GitHub", href: "https://github.com/phranck/periwinkle" },
        { label: "OpenAPI contract", href: "/periwinkle/openapi.json" },
      ],
    },
  };
}

// ---------- Section open/close state (persisted in localStorage) ----------

const SECTION_OPEN_STORAGE_KEY = "pw-cb:section-open";
const sectionOpenState = new Map<string, boolean>(loadSectionOpenState());

function loadSectionOpenState(): Array<[string, boolean]> {
  try {
    const raw = localStorage.getItem(SECTION_OPEN_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return [];
    return Object.entries(parsed as Record<string, unknown>).filter(
      (entry): entry is [string, boolean] => typeof entry[1] === "boolean",
    );
  } catch {
    return [];
  }
}

function persistSectionOpenState(): void {
  try {
    const snapshot: Record<string, boolean> = Object.fromEntries(sectionOpenState);
    localStorage.setItem(SECTION_OPEN_STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // storage may be full or disabled — silently degrade
  }
}

/**
 * Toggles a section open/closed; the grid-template-rows CSS transition
 * on `.section__body-outer` animates the reveal/collapse. The `open`
 * marker is a `data-open` attribute so both the CSS transition and the
 * client stay in sync with the persisted state.
 */
function toggleSection(container: HTMLElement, button: HTMLElement, key: string): void {
  const nextOpen = container.dataset.open !== "true";
  container.dataset.open = String(nextOpen);
  button.setAttribute("aria-expanded", String(nextOpen));
  sectionOpenState.set(key, nextOpen);
  persistSectionOpenState();
}

// ---------- Root state ----------

let state: BuilderState = createInitialState();

/**
 * Public alias for the state — kept so step 4 can pass it into field
 * handlers without exporting the type publicly.
 */
export function getState(): BuilderState {
  return state;
}

export function replaceState(next: BuilderState): void {
  state = next;
}

// ---------- Render entry points ----------

/**
 * Full rebuild of every section's body. Called after structural
 * changes (add/remove list items, mode switches, reset). Step 4 fills
 * in the actual field widgets; step 3 leaves each body empty so the
 * animation and toggle behavior can already be verified.
 */
export function render(): void {
  // Placeholder — filled by step 4.
  updatePreview();
}

/**
 * Cheap update path used by every text / toggle / color input: mutates
 * state and refreshes only the preview. Step 5 hooks it up to the
 * serializer + tokenizer + highlighter.
 */
export function updatePreview(): void {
  // Placeholder — filled by step 5.
}

// ---------- Boot ----------

/**
 * Wires the interactivity on top of the pre-rendered shell. Called
 * from `config-builder-entry.ts` as soon as the DOM is complete.
 */
export function setupConfigBuilder(doc: Document): void {
  const root = doc.querySelector<HTMLElement>("[data-pw-cb-root]");
  if (!root) return;

  // Section summaries carry data-pw-cb-toggle; the container carries
  // data-pw-cb-section with the section key. Restore any persisted open
  // state, then bind the click handler.
  const sections = doc.querySelectorAll<HTMLElement>("[data-pw-cb-section]");
  for (const container of sections) {
    const key = container.dataset.pwCbSection ?? "";
    const summary = container.querySelector<HTMLElement>("[data-pw-cb-toggle]");
    if (!summary) continue;
    const persisted = sectionOpenState.get(key);
    if (persisted === true) {
      container.dataset.open = "true";
      summary.setAttribute("aria-expanded", "true");
    }
    summary.addEventListener("click", () => toggleSection(container, summary, key));
  }

  render();
}
