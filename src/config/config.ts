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
    ["spec", "site", "theme", "guide", "customSections", "footer"],
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
