/**
 * periwinkle configuration model.
 *
 * `PeriwinkleConfig` is the shape consumers author in `periwinkle.config.ts`;
 * every field is optional. `resolveConfig()` validates the authored value and
 * merges it over the defaults into a `ResolvedConfig`, the fully-populated
 * shape the rendering layer consumes.
 */

/**
 * Color tokens of one theme palette. Every value is a CSS color string.
 *
 * @property background Page background.
 * @property surface Cards, sidebar, and other raised surfaces.
 * @property surfaceAlt Code blocks, hovers, and inset surfaces.
 * @property text Primary copy color.
 * @property textMuted Secondary copy (descriptions, labels).
 * @property textFaint Tertiary copy (hints, footers).
 * @property accent Brand accent used for active states and highlights.
 * @property border Hairline borders and dividers.
 * @property link Hyperlink color.
 * @property methodGet Badge color for GET operations.
 * @property methodPost Badge color for POST operations.
 * @property methodPut Badge color for PUT operations.
 * @property methodPatch Badge color for PATCH operations.
 * @property methodDelete Badge color for DELETE operations.
 * @property statusSuccess 2xx response status accents.
 * @property statusError 4xx/5xx response status accents.
 */
export interface ThemeColors {
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

/**
 * Font family tokens and optional external font stylesheets.
 *
 * @property base Body font family stack.
 * @property heading Heading font family stack.
 * @property mono Code font family stack.
 * @property stylesheets URLs of CSS files (e.g. `/fonts/fonts.css`) linked in
 *   the document head so custom `@font-face` sources load before use.
 */
export interface ThemeFonts {
  base: string;
  heading: string;
  mono: string;
  stylesheets: string[];
}

/**
 * A free-form documentation section authored as Markdown.
 *
 * @property id Unique section id, used as the in-page anchor.
 * @property title Section heading shown in content and navigation.
 * @property markdown Section body as Markdown.
 * @property position Where the section renders relative to the built-in
 *   blocks. Defaults to `after-guide`.
 */
export interface CustomSection {
  id: string;
  title: string;
  markdown: string;
  position?: CustomSectionPosition;
}

/** Placement options for {@link CustomSection}. */
export type CustomSectionPosition = "before-guide" | "after-guide" | "after-reference";

/**
 * One footer link.
 */
export interface FooterLink {
  label: string;
  href: string;
}

/**
 * The integration guide's built-in sections. Each accepts Markdown content;
 * `false` removes the section entirely. Sections without authored content
 * fall back to generic English copy derived from the OpenAPI document.
 */
export interface GuideConfig {
  intro?: string | false;
  auth?: string | false;
  requests?: string | false;
  errors?: string | false;
  rateLimits?: string | false;
  versioning?: string | false;
}

/**
 * Sidebar customization. Controls the chapter header label and the visibility
 * of individual sidebar affordances.
 *
 * @property title Header label above the section list. Default `"Reference"`.
 * @property showMethods Render the HTTP method (`GET`, `POST`, …) right-aligned
 *   inside each endpoint nav item. Default `false`.
 * @property showThemeToggle Show the light/dark theme toggle in the sidebar
 *   header. Default `false` (the top navigation carries the theme toggle
 *   by default; enable this if you want it in both places).
 * @property showSearch Show the search field in the sidebar header (opens
 *   the same document search dialog as the top navigation trigger).
 *   Default `false` (the top navigation carries the search trigger by
 *   default; enable this if you want it in both places).
 */
export interface SidebarConfig {
  title?: string;
  showMethods?: boolean;
  showThemeToggle?: boolean;
  showSearch?: boolean;
}

/**
 * Optional GitHub link surfaced in the top navigation. Set `url` to the
 * repository or project home a visitor should reach; `label` overrides the
 * default aria-label/title text `"GitHub"`.
 */
export interface NavigationGithubLink {
  url: string;
  label?: string;
}

/**
 * Top navigation bar rendered above the reference shell. Sticky at the top
 * with a frosted glass backdrop once the page scrolls behind it. Every
 * affordance is toggleable; when everything is disabled the bar is not
 * rendered.
 *
 * @property logo Brand logo shown on the left side of the bar, linking to
 *   `homeHref`. A local file path is bundled into the site output; URLs and
 *   absolute paths pass through untouched. Default: none (no brand mark).
 * @property showHome Render the leading home link (title left-aligned).
 *   Default `true`.
 * @property homeLabel Text on the home link. Default `"API reference"`.
 * @property homeHref Anchor the home link points at. Default `"#"` (jumps to
 *   the top of the page).
 * @property showSearch Render a search trigger button that opens the document
 *   search dialog (same dialog the sidebar search field opens). Default `true`.
 * @property showThemeToggle Render the theme toggle on the far right. Default
 *   `true`.
 * @property github Optional GitHub link. Renders a GitHub mark left of the
 *   theme toggle when set.
 */
export interface NavigationConfig {
  logo?: string;
  showHome?: boolean;
  homeLabel?: string;
  homeHref?: string;
  showSearch?: boolean;
  showThemeToggle?: boolean;
  github?: NavigationGithubLink;
}

/**
 * Feature toggles. Each flag defaults to `true`; set to `false` to remove the
 * corresponding affordance from every rendered page.
 *
 * @property openApiContract "OpenAPI contract" panel in the integration guide
 *   and the dialog that shows the raw spec.
 * @property accessBadge "Authentication required" / "Public endpoint" pill in
 *   the endpoint header.
 * @property deprecatedBadge "Deprecated" pill next to the request line when the
 *   operation is marked `deprecated: true`.
 * @property copyButton Copy button in every rendered code block.
 */
export interface FeatureFlags {
  openApiContract?: boolean;
  accessBadge?: boolean;
  deprecatedBadge?: boolean;
  copyButton?: boolean;
}

/**
 * Typography sizes and layout dimensions. Every value is a CSS length string
 * (`rem`, `px`, `em`, …). Motion and code line-height sit under
 * {@link MotionConfig} because they belong to the animation family.
 *
 * @property fontBody Body copy font size.
 * @property fontCode Inline and block code font size.
 * @property fontLead Lead paragraphs and prominent labels.
 * @property fontCardTitle Schema card / content card title size.
 * @property fontSubsection Endpoint entry titles.
 * @property fontSection H2 chapter header size.
 * @property fontHero Intro title above the sidebar and content grid.
 * @property sidebarWidth Sidebar column width.
 * @property containerMaxWidth Maximum content column width.
 * @property pagePadding Outer page padding on the reference shell.
 */
export interface SizingConfig {
  fontBody?: string;
  fontCode?: string;
  fontLead?: string;
  fontCardTitle?: string;
  fontSubsection?: string;
  fontSection?: string;
  fontHero?: string;
  sidebarWidth?: string;
  containerMaxWidth?: string;
  pagePadding?: string;
}

/**
 * Animation timings, easing, and color-mix intensities that shape the visual
 * texture of the docs. Any value can be authored as a CSS-valid string.
 *
 * @property duration Base transition/animation duration for nav expand,
 *   dialog fade, chevron rotation, and similar affordances. Set to `"0ms"` to
 *   effectively disable animations without losing state hooks.
 * @property easing Timing function for the same set of transitions.
 * @property codeLineHeight Line-height inside code blocks.
 * @property responseTintLight Response-card status color mix in light mode
 *   (e.g. `"12%"` mixes 12% of the status color into the surface).
 * @property responseTintDark Response-card status color mix in dark mode.
 * @property cardChromeMixLight Card header chrome text-color mix in light
 *   mode (higher = darker header separation).
 * @property cardChromeMixDark Card header chrome text-color mix in dark mode.
 * @property iconToneLight Iconsax icon opacity mix in light mode (lower =
 *   lighter icons; `"100%"` is full currentColor).
 * @property iconToneDark Icon tone in dark mode.
 */
export interface MotionConfig {
  duration?: string;
  easing?: string;
  codeLineHeight?: string;
  responseTintLight?: string;
  responseTintDark?: string;
  cardChromeMixLight?: string;
  cardChromeMixDark?: string;
  iconToneLight?: string;
  iconToneDark?: string;
}

/**
 * Configuration authored by periwinkle consumers in `periwinkle.config.ts`.
 * Every field is optional; unset values fall back to defaults derived from
 * the OpenAPI document and the built-in periwinkle theme.
 */
export interface PeriwinkleConfig {
  /** Path to the OpenAPI 3.x JSON document. The CLI `--spec` flag overrides it. */
  spec?: string;
  site?: {
    /** Base path the site is served under, e.g. `/docs`. Default `/`. */
    basePath?: string;
    /** Server base URL used in curl examples. Defaults to the spec's first server. */
    serverUrl?: string;
    /** Overrides the page title. Defaults to the spec's `info.title`. */
    title?: string;
    /** Logo file path (bundled into the output) or absolute URL. */
    logo?: string;
    /** Favicon file path (bundled into the output) or absolute URL. */
    favicon?: string;
  };
  theme?: {
    colors?: {
      light?: Partial<ThemeColors>;
      dark?: Partial<ThemeColors>;
    };
    fonts?: Partial<ThemeFonts>;
    /** Corner radius applied to cards, badges, and buttons, e.g. `6px`. */
    radius?: string;
  };
  navigation?: NavigationConfig;
  sidebar?: SidebarConfig;
  features?: FeatureFlags;
  sizing?: SizingConfig;
  motion?: MotionConfig;
  guide?: GuideConfig;
  customSections?: CustomSection[];
  footer?: {
    links?: FooterLink[];
    /** Free-form footer text, e.g. a copyright line. */
    text?: string;
  };
}

/**
 * Fully-populated configuration consumed by the rendering layer. Produced by
 * {@link resolveConfig}; all defaults are applied, only genuinely optional
 * values (logo, serverUrl, ...) remain undefined.
 */
export interface ResolvedConfig {
  spec?: string;
  site: {
    basePath: string;
    serverUrl?: string;
    title?: string;
    logo?: string;
    favicon?: string;
  };
  theme: {
    colors: {
      light: ThemeColors;
      dark: ThemeColors;
    };
    fonts: ThemeFonts;
    radius: string;
  };
  navigation: Required<Omit<NavigationConfig, "github" | "logo">> & {
    logo: string | undefined;
    github: NavigationGithubLink | undefined;
  };
  sidebar: Required<SidebarConfig>;
  features: Required<FeatureFlags>;
  sizing: Required<SizingConfig>;
  motion: Required<MotionConfig>;
  guide: GuideConfig;
  customSections: CustomSection[];
  footer: {
    links: FooterLink[];
    text?: string;
  };
}

/**
 * Default light palette: GitHub light mode neutrals with the periwinkle
 * (velvet) accent kept for brand highlights and links.
 */
export const DEFAULT_LIGHT_COLORS: ThemeColors = {
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

/**
 * Default dark palette: GitHub dark mode neutrals with the periwinkle
 * (velvet) accent kept for brand highlights and links.
 */
export const DEFAULT_DARK_COLORS: ThemeColors = {
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

/**
 * Default font stacks: Barlow for body copy, Barlow Condensed for headings
 * (loaded via the default Google Fonts stylesheet, overridable per config),
 * and a system mono stack for code.
 */
export const DEFAULT_FONTS: ThemeFonts = {
  base: '"Barlow", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  heading:
    '"Barlow Condensed", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  mono: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", monospace',
  stylesheets: [
    "https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@500;600;700&display=swap",
  ],
};

/** Default corner radius token: cards render at this radius, compact controls at half of it. */
export const DEFAULT_RADIUS = "1rem";

/** Default sidebar affordances. */
export const DEFAULT_SIDEBAR: Required<SidebarConfig> = {
  title: "Reference",
  showMethods: false,
  showThemeToggle: false,
  showSearch: false,
};

/** Default top navigation bar: home + search + theme toggle, no logo, no GitHub link. */
export const DEFAULT_NAVIGATION: Required<Omit<NavigationConfig, "github" | "logo">> & {
  logo: string | undefined;
  github: NavigationGithubLink | undefined;
} = {
  logo: undefined,
  showHome: true,
  homeLabel: "API reference",
  homeHref: "#",
  showSearch: true,
  showThemeToggle: true,
  github: undefined,
};

/** Default feature flags: every affordance shipped by periwinkle is on. */
export const DEFAULT_FEATURES: Required<FeatureFlags> = {
  openApiContract: true,
  accessBadge: true,
  deprecatedBadge: true,
  copyButton: true,
};

/** Default typography sizes and layout dimensions. */
export const DEFAULT_SIZING: Required<SizingConfig> = {
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

/** Default motion timings and color-mix intensities. */
export const DEFAULT_MOTION: Required<MotionConfig> = {
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

const CUSTOM_SECTION_POSITIONS: ReadonlySet<string> = new Set([
  "before-guide",
  "after-guide",
  "after-reference",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function fail(message: string): never {
  throw new Error(`Invalid periwinkle config: ${message}`);
}

function assertOptionalString(value: unknown, label: string): asserts value is string | undefined {
  if (value !== undefined && typeof value !== "string") fail(`${label} must be a string.`);
}

function assertOptionalBoolean(
  value: unknown,
  label: string,
): asserts value is boolean | undefined {
  if (value !== undefined && typeof value !== "boolean") fail(`${label} must be a boolean.`);
}

function assertKnownKeys(value: Record<string, unknown>, known: string[], label: string): void {
  for (const key of Object.keys(value)) {
    if (!known.includes(key)) fail(`unknown key "${key}" in ${label}.`);
  }
}

function validateColorOverrides(value: unknown, label: string): Partial<ThemeColors> {
  if (value === undefined) return {};
  if (!isRecord(value)) fail(`${label} must be an object.`);
  const knownTokens = Object.keys(DEFAULT_LIGHT_COLORS);
  assertKnownKeys(value, knownTokens, label);
  for (const [token, color] of Object.entries(value)) {
    if (typeof color !== "string") fail(`${label}.${token} must be a CSS color string.`);
  }
  return value as Partial<ThemeColors>;
}

function validateGuideSection(value: unknown, label: string): string | false | undefined {
  if (value === undefined || value === false || typeof value === "string") return value;
  fail(`${label} must be a Markdown string or false.`);
}

function validateCustomSections(value: unknown): CustomSection[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) fail("customSections must be an array.");
  const seenIds = new Set<string>();
  return value.map((section, index) => {
    if (!isRecord(section)) fail(`customSections[${index}] must be an object.`);
    const { id, title, markdown, position } = section;
    if (typeof id !== "string" || id.length === 0) {
      fail(`customSections[${index}].id must be a non-empty string.`);
    }
    if (seenIds.has(id)) fail(`customSections contains duplicate id "${id}".`);
    seenIds.add(id);
    if (typeof title !== "string") fail(`customSections[${index}].title must be a string.`);
    if (typeof markdown !== "string") fail(`customSections[${index}].markdown must be a string.`);
    if (position !== undefined && !CUSTOM_SECTION_POSITIONS.has(position as string)) {
      fail(
        `customSections[${index}].position must be one of ${[...CUSTOM_SECTION_POSITIONS].join(", ")}.`,
      );
    }
    return {
      id,
      title,
      markdown,
      ...(position !== undefined ? { position: position as CustomSectionPosition } : {}),
    };
  });
}

function validateFooterLinks(value: unknown): FooterLink[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) fail("footer.links must be an array.");
  return value.map((link, index) => {
    if (!isRecord(link)) fail(`footer.links[${index}] must be an object.`);
    if (typeof link.label !== "string") fail(`footer.links[${index}].label must be a string.`);
    if (typeof link.href !== "string") fail(`footer.links[${index}].href must be a string.`);
    return { label: link.label, href: link.href };
  });
}

function validateNavigation(value: unknown): ResolvedConfig["navigation"] {
  if (value === undefined) return { ...DEFAULT_NAVIGATION };
  if (!isRecord(value)) fail("navigation must be an object.");
  assertKnownKeys(
    value,
    ["logo", "showHome", "homeLabel", "homeHref", "showSearch", "showThemeToggle", "github"],
    "navigation",
  );
  assertOptionalString(value.logo, "navigation.logo");
  assertOptionalBoolean(value.showHome, "navigation.showHome");
  assertOptionalString(value.homeLabel, "navigation.homeLabel");
  assertOptionalString(value.homeHref, "navigation.homeHref");
  assertOptionalBoolean(value.showSearch, "navigation.showSearch");
  assertOptionalBoolean(value.showThemeToggle, "navigation.showThemeToggle");
  let github: NavigationGithubLink | undefined;
  if (value.github !== undefined) {
    if (!isRecord(value.github)) fail("navigation.github must be an object.");
    assertKnownKeys(value.github, ["url", "label"], "navigation.github");
    if (typeof value.github.url !== "string" || value.github.url.length === 0) {
      fail("navigation.github.url must be a non-empty string.");
    }
    assertOptionalString(value.github.label, "navigation.github.label");
    github = {
      url: value.github.url,
      ...(value.github.label !== undefined ? { label: value.github.label as string } : {}),
    };
  }
  return {
    logo: (value.logo as string | undefined) ?? DEFAULT_NAVIGATION.logo,
    showHome: (value.showHome as boolean | undefined) ?? DEFAULT_NAVIGATION.showHome,
    homeLabel: (value.homeLabel as string | undefined) ?? DEFAULT_NAVIGATION.homeLabel,
    homeHref: (value.homeHref as string | undefined) ?? DEFAULT_NAVIGATION.homeHref,
    showSearch: (value.showSearch as boolean | undefined) ?? DEFAULT_NAVIGATION.showSearch,
    showThemeToggle:
      (value.showThemeToggle as boolean | undefined) ?? DEFAULT_NAVIGATION.showThemeToggle,
    github,
  };
}

function validateSidebar(value: unknown): Required<SidebarConfig> {
  if (value === undefined) return { ...DEFAULT_SIDEBAR };
  if (!isRecord(value)) fail("sidebar must be an object.");
  assertKnownKeys(value, ["title", "showMethods", "showThemeToggle", "showSearch"], "sidebar");
  assertOptionalString(value.title, "sidebar.title");
  assertOptionalBoolean(value.showMethods, "sidebar.showMethods");
  assertOptionalBoolean(value.showThemeToggle, "sidebar.showThemeToggle");
  assertOptionalBoolean(value.showSearch, "sidebar.showSearch");
  return {
    title: (value.title as string | undefined) ?? DEFAULT_SIDEBAR.title,
    showMethods: (value.showMethods as boolean | undefined) ?? DEFAULT_SIDEBAR.showMethods,
    showThemeToggle:
      (value.showThemeToggle as boolean | undefined) ?? DEFAULT_SIDEBAR.showThemeToggle,
    showSearch: (value.showSearch as boolean | undefined) ?? DEFAULT_SIDEBAR.showSearch,
  };
}

function validateFeatures(value: unknown): Required<FeatureFlags> {
  if (value === undefined) return { ...DEFAULT_FEATURES };
  if (!isRecord(value)) fail("features must be an object.");
  assertKnownKeys(
    value,
    ["openApiContract", "accessBadge", "deprecatedBadge", "copyButton"],
    "features",
  );
  assertOptionalBoolean(value.openApiContract, "features.openApiContract");
  assertOptionalBoolean(value.accessBadge, "features.accessBadge");
  assertOptionalBoolean(value.deprecatedBadge, "features.deprecatedBadge");
  assertOptionalBoolean(value.copyButton, "features.copyButton");
  return {
    openApiContract:
      (value.openApiContract as boolean | undefined) ?? DEFAULT_FEATURES.openApiContract,
    accessBadge: (value.accessBadge as boolean | undefined) ?? DEFAULT_FEATURES.accessBadge,
    deprecatedBadge:
      (value.deprecatedBadge as boolean | undefined) ?? DEFAULT_FEATURES.deprecatedBadge,
    copyButton: (value.copyButton as boolean | undefined) ?? DEFAULT_FEATURES.copyButton,
  };
}

function validateSizing(value: unknown): Required<SizingConfig> {
  if (value === undefined) return { ...DEFAULT_SIZING };
  if (!isRecord(value)) fail("sizing must be an object.");
  const knownKeys = Object.keys(DEFAULT_SIZING);
  assertKnownKeys(value, knownKeys, "sizing");
  for (const key of knownKeys) {
    assertOptionalString(value[key], `sizing.${key}`);
  }
  return { ...DEFAULT_SIZING, ...(value as Partial<Required<SizingConfig>>) };
}

function validateMotion(value: unknown): Required<MotionConfig> {
  if (value === undefined) return { ...DEFAULT_MOTION };
  if (!isRecord(value)) fail("motion must be an object.");
  const knownKeys = Object.keys(DEFAULT_MOTION);
  assertKnownKeys(value, knownKeys, "motion");
  for (const key of knownKeys) {
    assertOptionalString(value[key], `motion.${key}`);
  }
  return { ...DEFAULT_MOTION, ...(value as Partial<Required<MotionConfig>>) };
}

/**
 * Identity helper for typed config authoring:
 *
 * ```ts
 * import { defineConfig } from "periwinkle";
 * export default defineConfig({ site: { basePath: "/docs" } });
 * ```
 *
 * @param config The authored configuration.
 * @returns The same object, typed as {@link PeriwinkleConfig}.
 */
export function defineConfig(config: PeriwinkleConfig): PeriwinkleConfig {
  return config;
}

/**
 * Validates an authored config value and merges it over the periwinkle
 * defaults into the fully-populated shape the renderer consumes.
 *
 * @param config The authored configuration (typically a config file's default
 *   export). `undefined` resolves to pure defaults.
 * @returns The {@link ResolvedConfig} with all defaults applied.
 * @throws Error with an `Invalid periwinkle config:` message when the value
 *   has the wrong shape, unknown keys, or malformed entries.
 */
export function resolveConfig(config: unknown = {}): ResolvedConfig {
  if (!isRecord(config)) fail("config must be an object.");
  assertKnownKeys(
    config,
    [
      "spec",
      "site",
      "theme",
      "navigation",
      "sidebar",
      "features",
      "sizing",
      "motion",
      "guide",
      "customSections",
      "footer",
    ],
    "the config root",
  );

  assertOptionalString(config.spec, "spec");

  const site = config.site ?? {};
  if (!isRecord(site)) fail("site must be an object.");
  assertKnownKeys(site, ["basePath", "serverUrl", "title", "logo", "favicon"], "site");
  assertOptionalString(site.basePath, "site.basePath");
  assertOptionalString(site.serverUrl, "site.serverUrl");
  assertOptionalString(site.title, "site.title");
  assertOptionalString(site.logo, "site.logo");
  assertOptionalString(site.favicon, "site.favicon");
  const basePath = site.basePath ?? "/";
  if (!basePath.startsWith("/")) fail('site.basePath must start with "/".');

  const theme = config.theme ?? {};
  if (!isRecord(theme)) fail("theme must be an object.");
  assertKnownKeys(theme, ["colors", "fonts", "radius"], "theme");
  const colors = theme.colors ?? {};
  if (!isRecord(colors)) fail("theme.colors must be an object.");
  assertKnownKeys(colors, ["light", "dark"], "theme.colors");
  const fonts = theme.fonts ?? {};
  if (!isRecord(fonts)) fail("theme.fonts must be an object.");
  assertKnownKeys(fonts, ["base", "heading", "mono", "stylesheets"], "theme.fonts");
  assertOptionalString(fonts.base, "theme.fonts.base");
  assertOptionalString(fonts.heading, "theme.fonts.heading");
  assertOptionalString(fonts.mono, "theme.fonts.mono");
  if (
    fonts.stylesheets !== undefined &&
    (!Array.isArray(fonts.stylesheets) ||
      fonts.stylesheets.some((entry) => typeof entry !== "string"))
  ) {
    fail("theme.fonts.stylesheets must be an array of strings.");
  }
  assertOptionalString(theme.radius, "theme.radius");

  const guide = config.guide ?? {};
  if (!isRecord(guide)) fail("guide must be an object.");
  assertKnownKeys(
    guide,
    ["intro", "auth", "requests", "errors", "rateLimits", "versioning"],
    "guide",
  );

  const footer = config.footer ?? {};
  if (!isRecord(footer)) fail("footer must be an object.");
  assertKnownKeys(footer, ["links", "text"], "footer");
  assertOptionalString(footer.text, "footer.text");

  return {
    ...(config.spec !== undefined ? { spec: config.spec } : {}),
    site: {
      basePath,
      ...(site.serverUrl !== undefined ? { serverUrl: site.serverUrl } : {}),
      ...(site.title !== undefined ? { title: site.title } : {}),
      ...(site.logo !== undefined ? { logo: site.logo } : {}),
      ...(site.favicon !== undefined ? { favicon: site.favicon } : {}),
    },
    theme: {
      colors: {
        light: {
          ...DEFAULT_LIGHT_COLORS,
          ...validateColorOverrides(colors.light, "theme.colors.light"),
        },
        dark: {
          ...DEFAULT_DARK_COLORS,
          ...validateColorOverrides(colors.dark, "theme.colors.dark"),
        },
      },
      fonts: {
        base: (fonts.base as string | undefined) ?? DEFAULT_FONTS.base,
        heading: (fonts.heading as string | undefined) ?? DEFAULT_FONTS.heading,
        mono: (fonts.mono as string | undefined) ?? DEFAULT_FONTS.mono,
        stylesheets: (fonts.stylesheets as string[] | undefined) ?? DEFAULT_FONTS.stylesheets,
      },
      radius: (theme.radius as string | undefined) ?? DEFAULT_RADIUS,
    },
    navigation: validateNavigation(config.navigation),
    sidebar: validateSidebar(config.sidebar),
    features: validateFeatures(config.features),
    sizing: validateSizing(config.sizing),
    motion: validateMotion(config.motion),
    guide: {
      ...(validateGuideSection(guide.intro, "guide.intro") !== undefined
        ? { intro: validateGuideSection(guide.intro, "guide.intro") }
        : {}),
      ...(validateGuideSection(guide.auth, "guide.auth") !== undefined
        ? { auth: validateGuideSection(guide.auth, "guide.auth") }
        : {}),
      ...(validateGuideSection(guide.requests, "guide.requests") !== undefined
        ? { requests: validateGuideSection(guide.requests, "guide.requests") }
        : {}),
      ...(validateGuideSection(guide.errors, "guide.errors") !== undefined
        ? { errors: validateGuideSection(guide.errors, "guide.errors") }
        : {}),
      ...(validateGuideSection(guide.rateLimits, "guide.rateLimits") !== undefined
        ? { rateLimits: validateGuideSection(guide.rateLimits, "guide.rateLimits") }
        : {}),
      ...(validateGuideSection(guide.versioning, "guide.versioning") !== undefined
        ? { versioning: validateGuideSection(guide.versioning, "guide.versioning") }
        : {}),
    },
    customSections: validateCustomSections(config.customSections),
    footer: {
      links: validateFooterLinks(footer.links),
      ...(footer.text !== undefined ? { text: footer.text } : {}),
    },
  };
}
