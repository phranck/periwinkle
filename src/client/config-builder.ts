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
 * - renders all 11 sections' field widgets into their body slots
 * - hooks up the top-bar actions (Reset, Copy, Save)
 * - exposes `render()` (full form rebuild after structural changes)
 *   and `updatePreview()` (fast path for text/toggle/color inputs)
 *
 * Step 5 wires the actual TypeScript serializer + preview highlighter.
 */

// ---------- Defaults (mirrored from src/config/config.ts) ----------

interface ColorPalette {
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

const COLOR_TOKEN_LABELS: Record<keyof ColorPalette, string> = {
  background: "background",
  surface: "surface",
  surfaceAlt: "surface (alt)",
  text: "text",
  textMuted: "text (muted)",
  textFaint: "text (faint)",
  accent: "accent",
  border: "border",
  link: "link",
  methodGet: "method GET",
  methodPost: "method POST",
  methodPut: "method PUT",
  methodPatch: "method PATCH",
  methodDelete: "method DELETE",
  statusSuccess: "status success",
  statusError: "status error",
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

type PlacementValue = "navigation" | "sidebar" | "off";

const PLACEMENT_OPTIONS: ReadonlyArray<{ key: PlacementValue; label: string }> = [
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

const GUIDE_SECTIONS: ReadonlyArray<GuideSection> = [
  { key: "intro", label: "Intro" },
  { key: "auth", label: "Authentication" },
  { key: "requests", label: "Requests" },
  { key: "errors", label: "Errors" },
  { key: "rateLimits", label: "Rate limits" },
  { key: "versioning", label: "Versioning" },
];

type GuideMode = "default" | "custom" | "off";

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

function toggleSection(container: HTMLElement, button: HTMLElement, key: string): void {
  const nextOpen = container.dataset.open !== "true";
  container.dataset.open = String(nextOpen);
  button.setAttribute("aria-expanded", String(nextOpen));
  sectionOpenState.set(key, nextOpen);
  persistSectionOpenState();
}

// ---------- Root state ----------

let state: BuilderState = createInitialState();

// ---------- DOM helpers ----------

type ChildNodeLike = Node | string | null | undefined | false | ChildNodeLike[];

interface ElementAttrs {
  class?: string;
  [key: string]: unknown;
}

const SVG_NS = "http://www.w3.org/2000/svg";

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: ElementAttrs = {},
  children: ChildNodeLike = [],
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  applyAttrs(node, attrs);
  appendChildren(node, children);
  return node;
}

function svg(tag: string, attrs: ElementAttrs = {}, children: ChildNodeLike = []): SVGElement {
  const node = document.createElementNS(SVG_NS, tag) as SVGElement;
  applyAttrs(node, attrs);
  appendChildren(node, children);
  return node;
}

function applyAttrs(node: Element, attrs: ElementAttrs): void {
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class" && typeof v === "string") {
      if (node instanceof SVGElement) node.setAttribute("class", v);
      else (node as HTMLElement).className = v;
    } else if (k.startsWith("on") && typeof v === "function") {
      node.addEventListener(k.slice(2).toLowerCase(), v as EventListener);
    } else if (v === true) {
      node.setAttribute(k, "");
    } else if (v === false || v === null || v === undefined) {
      /* skip */
    } else {
      node.setAttribute(k, String(v));
    }
  }
}

function appendChildren(node: Node, children: ChildNodeLike): void {
  if (children == null || children === false) return;
  if (Array.isArray(children)) {
    for (const child of children) appendChildren(node, child);
    return;
  }
  if (children instanceof Node) {
    node.appendChild(children);
  } else {
    node.appendChild(document.createTextNode(String(children)));
  }
}

// ---------- Field widgets ----------

interface TextFieldOptions {
  label: string;
  hint?: string;
  defaultLabel?: string;
  value: string;
  placeholder?: string;
  onInput: (value: string) => void;
}

function textField(opts: TextFieldOptions): HTMLElement {
  const input = el("input", {
    class: "field__input",
    type: "text",
    value: opts.value,
    placeholder: opts.placeholder ?? "",
    onInput: (e: Event) => opts.onInput((e.target as HTMLInputElement).value),
  });
  return el("div", { class: "field" }, [
    el("label", { class: "field__label" }, [
      opts.label,
      opts.defaultLabel
        ? el("span", { class: "field__default" }, `default: ${opts.defaultLabel}`)
        : null,
    ]),
    input,
    opts.hint ? el("div", { class: "field__hint" }, opts.hint) : null,
  ]);
}

interface TextareaFieldOptions {
  label: string;
  hint?: string;
  defaultLabel?: string;
  value: string;
  rows?: number;
  placeholder?: string;
  onInput: (value: string) => void;
}

function textareaField(opts: TextareaFieldOptions): HTMLElement {
  const input = el("textarea", {
    class: "field__input",
    rows: String(opts.rows ?? 3),
    placeholder: opts.placeholder ?? "",
    onInput: (e: Event) => opts.onInput((e.target as HTMLTextAreaElement).value),
  });
  input.value = opts.value;
  return el("div", { class: "field" }, [
    el("label", { class: "field__label" }, [
      opts.label,
      opts.defaultLabel
        ? el("span", { class: "field__default" }, `default: ${opts.defaultLabel}`)
        : null,
    ]),
    input,
    opts.hint ? el("div", { class: "field__hint" }, opts.hint) : null,
  ]);
}

interface ToggleFieldOptions {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function toggleField(opts: ToggleFieldOptions): HTMLElement {
  const box = el("input", {
    type: "checkbox",
    class: "toggle__box",
    onChange: (e: Event) => opts.onChange((e.target as HTMLInputElement).checked),
  });
  box.checked = opts.checked;
  return el("label", { class: "field" }, [
    el("div", { class: "toggle" }, [box, el("span", { class: "toggle__label" }, opts.label)]),
    opts.hint ? el("div", { class: "field__hint" }, opts.hint) : null,
  ]);
}

interface ColorFieldOptions {
  token: keyof ColorPalette;
  value: string;
  defaultValue: string;
  onChange: (value: string) => void;
}

function colorField(opts: ColorFieldOptions): HTMLElement {
  const swatch = el("input", {
    type: "color",
    class: "field__color-swatch",
    value: opts.value,
    onInput: (e: Event) => {
      const v = (e.target as HTMLInputElement).value;
      textInput.value = v;
      opts.onChange(v);
    },
  });
  const textInput = el("input", {
    type: "text",
    class: "field__input",
    value: opts.value,
    spellcheck: "false",
    onInput: (e: Event) => {
      const v = (e.target as HTMLInputElement).value;
      if (/^#[0-9a-fA-F]{6}$/.test(v)) swatch.value = v;
      opts.onChange(v);
    },
  });
  return el("div", { class: "palette__row", title: `default: ${opts.defaultValue}` }, [
    el("span", { class: "palette__row-label" }, COLOR_TOKEN_LABELS[opts.token]),
    swatch,
    textInput,
  ]);
}

// ---------- Slider widgets ----------

interface LengthParts {
  number: number;
  unit: string;
}

function parseLength(value: string, fallbackUnit = "rem"): LengthParts {
  const match = value.trim().match(/^(-?\d+(?:\.\d+)?)\s*([a-z%]+)?$/i);
  if (!match) return { number: 0, unit: fallbackUnit };
  return { number: Number(match[1]), unit: match[2] ?? fallbackUnit };
}

function formatLength(number: number, unit: string, decimals = 3): string {
  const rounded = Number(number.toFixed(decimals));
  return `${rounded}${unit}`;
}

interface SliderOptions {
  label: string;
  hint?: string;
  min: number;
  max: number;
  step: number;
  value: number;
  format: (n: number) => string;
  previewNode?: HTMLElement | null;
  onChange: (n: number) => void;
}

function slider(opts: SliderOptions): HTMLElement {
  const valueEl = el("span", { class: "slider__value" }, opts.format(opts.value));
  const input = el("input", {
    type: "range",
    class: "slider__input",
    min: String(opts.min),
    max: String(opts.max),
    step: String(opts.step),
    value: String(opts.value),
    onInput: (e: Event) => {
      const v = Number((e.target as HTMLInputElement).value);
      valueEl.textContent = opts.format(v);
      opts.onChange(v);
    },
  });
  return el("div", { class: "slider" }, [
    el("div", { class: "slider__head" }, [
      el("span", { class: "slider__label" }, opts.label),
      valueEl,
    ]),
    input,
    opts.previewNode ?? null,
    opts.hint ? el("div", { class: "slider__hint" }, opts.hint) : null,
  ]);
}

interface FontSliderOptions {
  key: string;
  label: string;
  sample: string;
  family: "body" | "heading" | "mono";
}

function fontSlider(opts: FontSliderOptions): HTMLElement {
  const parsed = parseLength(state.sizing[opts.key], "rem");
  const preview = el(
    "div",
    {
      class: `font-preview font-preview--${opts.family}`,
      style: `font-size: ${state.sizing[opts.key]}`,
    },
    opts.sample,
  );
  return slider({
    label: opts.label,
    hint: "Sample above renders at exactly the chosen size.",
    min: 0.5,
    max: 5,
    step: 0.0625,
    value: parsed.number,
    format: (n) => `${n.toFixed(3).replace(/\.?0+$/, "")}rem`,
    previewNode: preview,
    onChange: (n) => {
      const next = formatLength(n, parsed.unit || "rem");
      state.sizing[opts.key] = next;
      preview.style.fontSize = next;
      updatePreview();
    },
  });
}

interface LengthSliderOptions {
  key: string;
  label: string;
  min: number;
  max: number;
  step?: number;
  hint?: string;
}

function lengthSlider(opts: LengthSliderOptions): HTMLElement {
  const parsed = parseLength(state.sizing[opts.key], "rem");
  const bar = el("div", { class: "length-preview__bar" });
  const setBarWidth = (n: number) => {
    const pct = Math.min(100, Math.max(0, ((n - opts.min) / (opts.max - opts.min)) * 100));
    bar.style.width = `${pct}%`;
  };
  setBarWidth(parsed.number);
  const container = el("div", { class: "length-preview" }, bar);
  const step = opts.step ?? 0.25;
  return slider({
    label: opts.label,
    hint: opts.hint,
    min: opts.min,
    max: opts.max,
    step,
    value: parsed.number,
    format: (n) => `${n.toFixed(2).replace(/\.?0+$/, "")}${parsed.unit || "rem"}`,
    previewNode: container,
    onChange: (n) => {
      state.sizing[opts.key] = formatLength(n, parsed.unit || "rem", 3);
      setBarWidth(n);
      updatePreview();
    },
  });
}

const EASING_PRESETS: readonly string[] = [
  "linear",
  "ease",
  "ease-in",
  "ease-out",
  "ease-in-out",
  "cubic-bezier(0.16, 1, 0.3, 1)",
  "cubic-bezier(0.4, 0, 0.2, 1)",
];

function durationSlider(): HTMLElement {
  const parsed = parseLength(state.motion.duration, "ms");
  const dot = el("div", { class: "motion-preview__dot" });
  const track = el("div", { class: "motion-preview__track" });
  const preview = el("div", { class: "motion-preview" }, [track, dot]);
  const play = el(
    "button",
    {
      type: "button",
      class: "motion-preview__play",
      onClick: () => {
        const inner = preview.clientWidth - 24 - dot.offsetWidth;
        preview.style.setProperty("--track-length", `${Math.max(0, inner)}px`);
        dot.classList.remove("motion-preview__dot--running");
        void dot.offsetWidth;
        dot.style.animationDuration = state.motion.duration;
        dot.style.animationTimingFunction = state.motion.easing;
        dot.classList.add("motion-preview__dot--running");
      },
    },
    "▶ Play",
  );
  const widget = el("div", { class: "motion-widget" }, [preview, play]);
  return slider({
    label: "Base duration",
    hint: "Sidebar expand/collapse, dialog fade, chevron rotation. Click ▶ Play to see the effect.",
    min: 0,
    max: 800,
    step: 10,
    value: parsed.number,
    format: (n) => `${Math.round(n)}ms`,
    previewNode: widget,
    onChange: (n) => {
      state.motion.duration = `${Math.round(n)}ms`;
      updatePreview();
    },
  });
}

function easingField(): HTMLElement {
  const preset = EASING_PRESETS.includes(state.motion.easing) ? state.motion.easing : "custom";
  const customInput = el("input", {
    type: "text",
    class: "field__input",
    value: preset === "custom" ? state.motion.easing : "",
    placeholder: "cubic-bezier(0.2, 0.8, 0.2, 1)",
    onInput: (e: Event) => {
      if (select.value === "custom") {
        state.motion.easing = (e.target as HTMLInputElement).value;
        updatePreview();
      }
    },
  });
  const select = el(
    "select",
    {
      class: "field__select",
      onChange: (e: Event) => {
        const v = (e.target as HTMLSelectElement).value;
        if (v === "custom") {
          state.motion.easing = customInput.value || "cubic-bezier(0.2, 0.8, 0.2, 1)";
        } else {
          state.motion.easing = v;
        }
        render();
      },
    },
    [
      ...EASING_PRESETS.map((v) =>
        el("option", { value: v, ...(preset === v ? { selected: true } : {}) }, v),
      ),
      el(
        "option",
        { value: "custom", ...(preset === "custom" ? { selected: true } : {}) },
        "custom…",
      ),
    ],
  );
  select.value = preset;
  return el("div", { class: "slider" }, [
    el("div", { class: "slider__head" }, [
      el("span", { class: "slider__label" }, "Easing function"),
      el("span", { class: "slider__value" }, state.motion.easing),
    ]),
    select,
    preset === "custom" ? customInput : null,
    el("div", { class: "slider__hint" }, "Timing function paired with the base duration above."),
  ]);
}

function lineHeightSlider(): HTMLElement {
  const value = Number.parseFloat(state.motion.codeLineHeight) || 1.5;
  const preview = el(
    "div",
    { class: "lh-preview", style: `line-height: ${value}` },
    // biome-ignore lint/suspicious/noTemplateCurlyInString: literal source-code sample inside a string.
    "function greet(name) {\n  return `Hello, ${name}!`;\n}",
  );
  return slider({
    label: "Code line-height",
    hint: "Vertical rhythm inside code blocks. Impacts the 20-line scroll cap.",
    min: 1,
    max: 2.5,
    step: 0.05,
    value,
    format: (n) => n.toFixed(2),
    previewNode: preview,
    onChange: (n) => {
      state.motion.codeLineHeight = n.toFixed(2);
      preview.style.lineHeight = String(n);
      updatePreview();
    },
  });
}

interface PercentSliderOptions {
  key: string;
  label: string;
  hint: string;
  toneVarLight: string;
  toneVarDark: string;
}

function percentSlider(opts: PercentSliderOptions): HTMLElement {
  const initial = parseLength(state.motion[opts.key], "%").number;
  const swatchLight = el(
    "div",
    { class: "mix-preview__swatch", style: `color: ${DEFAULT_LIGHT_COLORS.text}` },
    "light",
  );
  const swatchDark = el(
    "div",
    { class: "mix-preview__swatch", style: `color: ${DEFAULT_DARK_COLORS.text}` },
    "dark",
  );
  const apply = (n: number) => {
    swatchLight.style.background = `color-mix(in srgb, ${opts.toneVarLight} ${n}%, ${DEFAULT_LIGHT_COLORS.surface})`;
    swatchDark.style.background = `color-mix(in srgb, ${opts.toneVarDark} ${n}%, ${DEFAULT_DARK_COLORS.surface})`;
  };
  apply(initial);
  const preview = el("div", { class: "mix-preview" }, [swatchLight, swatchDark]);
  return slider({
    label: opts.label,
    hint: opts.hint,
    min: 0,
    max: 40,
    step: 1,
    value: initial,
    format: (n) => `${Math.round(n)}%`,
    previewNode: preview,
    onChange: (n) => {
      state.motion[opts.key] = `${Math.round(n)}%`;
      apply(n);
      updatePreview();
    },
  });
}

function iconToneSlider(key: string, label: string): HTMLElement {
  const initial = parseLength(state.motion[key], "%").number;
  const mode = key.endsWith("Light") ? "light" : "dark";
  const surface =
    mode === "light" ? DEFAULT_LIGHT_COLORS.background : DEFAULT_DARK_COLORS.background;
  const iconColor = mode === "light" ? "#0a7c47" : "#7ee787";
  const iconEl = svg("svg", {
    viewBox: "0 0 24 24",
    width: "28",
    height: "28",
    fill: "none",
    stroke: "currentColor",
    "stroke-width": "2",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
  });
  iconEl.appendChild(svg("circle", { cx: "12", cy: "12", r: "9" }));
  iconEl.appendChild(svg("path", { d: "M8 12l3 3 5-6" }));
  const swatch = el(
    "div",
    {
      class: "mix-preview__swatch",
      style: `background: ${surface}; color: ${iconColor};`,
    },
    [iconEl],
  );
  const apply = (n: number) => {
    (iconEl as SVGElement).style.color = `color-mix(in srgb, ${iconColor} ${n}%, ${surface})`;
  };
  apply(initial);
  return slider({
    label,
    hint: `Icon opacity mix on the ${mode} surface. Higher = stronger currentColor.`,
    min: 0,
    max: 100,
    step: 5,
    value: initial,
    format: (n) => `${Math.round(n)}%`,
    previewNode: el("div", { class: "mix-preview" }, [swatch]),
    onChange: (n) => {
      state.motion[key] = `${Math.round(n)}%`;
      apply(n);
      updatePreview();
    },
  });
}

// ---------- Placement radio (shared between search + theme toggle) ----------

interface PlacementFieldOptions {
  label: string;
  hint: string;
  currentKey: PlacementValue;
  defaultKey: PlacementValue;
  onSelect: (key: PlacementValue) => void;
}

function placementField(opts: PlacementFieldOptions): HTMLElement {
  const seg = el(
    "div",
    { class: "segmented", role: "radiogroup", "aria-label": `${opts.label} placement` },
    PLACEMENT_OPTIONS.map((m) =>
      el(
        "button",
        {
          type: "button",
          class: "segmented__item",
          role: "radio",
          "aria-checked": String(opts.currentKey === m.key),
          "aria-pressed": String(opts.currentKey === m.key),
          onClick: () => opts.onSelect(m.key),
        },
        m.label,
      ),
    ),
  );
  return el("div", { class: "field" }, [
    el("label", { class: "field__label" }, [
      opts.label,
      el(
        "span",
        { class: "field__default" },
        `default: ${opts.defaultKey === "off" ? "off" : `"${opts.defaultKey}"`}`,
      ),
    ]),
    seg,
    el("div", { class: "field__hint" }, opts.hint),
  ]);
}

// ---------- Section renderers ----------

function renderSpec(): HTMLElement[] {
  return [
    textField({
      label: "Spec path",
      hint: "Path relative to the config file. The CLI flag --spec overrides it.",
      value: state.spec,
      placeholder: "openapi.json",
      onInput: (v) => {
        state.spec = v;
        updatePreview();
      },
    }),
  ];
}

function renderSite(): HTMLElement[] {
  const s = state.site;
  return [
    el("div", { class: "fields" }, [
      textField({
        label: "Base path",
        defaultLabel: '"/"',
        hint: "Path prefix the site is served under. Must start with /.",
        value: s.basePath,
        placeholder: "/",
        onInput: (v) => {
          s.basePath = v;
          updatePreview();
        },
      }),
      textField({
        label: "Server URL",
        defaultLabel: "first spec server",
        hint: "Base URL printed in generated curl examples.",
        value: s.serverUrl,
        placeholder: "https://api.example.com",
        onInput: (v) => {
          s.serverUrl = v;
          updatePreview();
        },
      }),
      textField({
        label: "Title",
        defaultLabel: "spec info.title",
        hint: "Document title and hero heading.",
        value: s.title,
        placeholder: "Example API",
        onInput: (v) => {
          s.title = v;
          updatePreview();
        },
      }),
      textField({
        label: "Favicon",
        hint: "Local path (bundled) or absolute URL.",
        value: s.favicon,
        placeholder: "assets/favicon.png",
        onInput: (v) => {
          s.favicon = v;
          updatePreview();
        },
      }),
      textField({
        label: "Site logo",
        hint: "Small logo next to the sidebar title. Local path or URL.",
        value: s.logo,
        placeholder: "assets/logo.svg",
        onInput: (v) => {
          s.logo = v;
          updatePreview();
        },
      }),
    ]),
  ];
}

function renderTheme(): HTMLElement[] {
  const t = state.theme;
  const paletteBlock = (mode: "light" | "dark") => {
    const defaults = mode === "light" ? DEFAULT_LIGHT_COLORS : DEFAULT_DARK_COLORS;
    const rows = (Object.entries(defaults) as [keyof ColorPalette, string][]).map(([token, def]) =>
      colorField({
        token,
        value: t.colors[mode][token],
        defaultValue: def,
        onChange: (v) => {
          t.colors[mode][token] = v;
          updatePreview();
        },
      }),
    );
    return el("div", { class: "palette" }, [
      el("div", { class: "palette__title" }, `${mode === "light" ? "Light" : "Dark"} palette`),
      el("div", { class: "palette__list" }, rows),
    ]);
  };
  return [
    el("h3", { class: "section__group-title" }, "Palettes"),
    el("div", { class: "palette-grid" }, [paletteBlock("light"), paletteBlock("dark")]),
    el("h3", { class: "section__group-title" }, "Fonts"),
    el("div", { class: "fields fields--single" }, [
      textField({
        label: "Base (body) stack",
        defaultLabel: "Barlow + system",
        value: t.fonts.base,
        onInput: (v) => {
          t.fonts.base = v;
          updatePreview();
        },
      }),
      textField({
        label: "Heading stack",
        defaultLabel: "Barlow Condensed + system",
        value: t.fonts.heading,
        onInput: (v) => {
          t.fonts.heading = v;
          updatePreview();
        },
      }),
      textField({
        label: "Mono (code) stack",
        defaultLabel: "system monospace",
        value: t.fonts.mono,
        onInput: (v) => {
          t.fonts.mono = v;
          updatePreview();
        },
      }),
      textareaField({
        label: "External font stylesheets",
        hint: "One URL per line. Linked in the document head so custom @font-face sources load before use.",
        defaultLabel: "Barlow Google Fonts",
        value: t.fonts.stylesheets.join("\n"),
        onInput: (v) => {
          t.fonts.stylesheets = v
            .split(/\n+/)
            .map((line) => line.trim())
            .filter(Boolean);
          updatePreview();
        },
      }),
    ]),
    el("h3", { class: "section__group-title" }, "Geometry"),
    el("div", { class: "fields" }, [
      textField({
        label: "Corner radius",
        defaultLabel: `"${DEFAULT_RADIUS}"`,
        hint: "Cards render at this radius, nested panels and compact controls at derived fractions.",
        value: t.radius,
        onInput: (v) => {
          t.radius = v;
          updatePreview();
        },
      }),
    ]),
  ];
}

function renderNavigation(): HTMLElement[] {
  const n = state.navigation;
  return [
    el("div", { class: "fields" }, [
      textField({
        label: "Brand logo",
        hint: "Brand mark on the far left, links to homeHref. Local path or URL.",
        value: n.logo,
        placeholder: "assets/logo.svg",
        onInput: (v) => {
          n.logo = v;
          updatePreview();
        },
      }),
      textField({
        label: "Home label",
        defaultLabel: `"${DEFAULT_NAVIGATION.homeLabel}"`,
        value: n.homeLabel,
        onInput: (v) => {
          n.homeLabel = v;
          updatePreview();
        },
      }),
      textField({
        label: "Home href",
        defaultLabel: `"${DEFAULT_NAVIGATION.homeHref}"`,
        value: n.homeHref,
        onInput: (v) => {
          n.homeHref = v;
          updatePreview();
        },
      }),
      textField({
        label: "GitHub URL",
        hint: "Renders a GitHub pill when set.",
        value: n.githubUrl,
        placeholder: "https://github.com/acme/api",
        onInput: (v) => {
          n.githubUrl = v;
          updatePreview();
        },
      }),
      textField({
        label: "GitHub label",
        defaultLabel: '"GitHub"',
        value: n.githubLabel,
        onInput: (v) => {
          n.githubLabel = v;
          updatePreview();
        },
      }),
    ]),
    el("div", { class: "fields" }, [
      toggleField({
        label: "Show home link",
        hint: "Leading nav pill with icon + text.",
        checked: n.showHome,
        onChange: (v) => {
          n.showHome = v;
          updatePreview();
        },
      }),
    ]),
    el("h3", { class: "section__group-title" }, "Shared controls (choose one location each)"),
    el("div", { class: "fields" }, [
      placementField({
        label: "Theme toggle",
        hint: "Where the light/dark toggle renders. Pick one location so the control never appears twice.",
        currentKey: state.themeTogglePlacement,
        defaultKey: THEME_TOGGLE_DEFAULT,
        onSelect: (key) => {
          state.themeTogglePlacement = key;
          render();
        },
      }),
      placementField({
        label: "Search",
        hint: "Where the document search trigger renders. ⌘K works either way.",
        currentKey: state.searchPlacement,
        defaultKey: SEARCH_DEFAULT,
        onSelect: (key) => {
          state.searchPlacement = key;
          render();
        },
      }),
    ]),
    el("h3", { class: "section__group-title" }, "Custom nav links"),
    ...renderNavigationLinks(),
  ];
}

function renderNavigationLinks(): HTMLElement[] {
  const links = state.navigation.links;
  const items = links.map((link, i) => {
    const targetToggle = el("input", {
      type: "checkbox",
      class: "toggle__box",
      onChange: (e: Event) => {
        link.target = (e.target as HTMLInputElement).checked ? "_blank" : "";
        updatePreview();
      },
    });
    if (link.target === "_blank") targetToggle.checked = true;
    return el("div", { class: "list-item" }, [
      el("div", { class: "list-item__header" }, [
        el("span", { class: "list-item__title" }, link.label || `Link ${i + 1}`),
        el(
          "button",
          {
            type: "button",
            class: "list-item__remove",
            onClick: () => {
              links.splice(i, 1);
              render();
            },
          },
          "Remove",
        ),
      ]),
      el("div", { class: "fields" }, [
        textField({
          label: "Label",
          value: link.label,
          placeholder: "Config builder",
          onInput: (v) => {
            link.label = v;
            updatePreview();
          },
        }),
        textField({
          label: "Href",
          value: link.href,
          placeholder: "/path or https://…",
          onInput: (v) => {
            link.href = v;
            updatePreview();
          },
        }),
      ]),
      el("label", { class: "field" }, [
        el("div", { class: "toggle" }, [
          targetToggle,
          el("span", { class: "toggle__label" }, "Open in new tab"),
        ]),
        el(
          "div",
          { class: "field__hint" },
          'Sets target="_blank" and adds rel="noopener noreferrer".',
        ),
      ]),
    ]);
  });
  return [
    ...items,
    el(
      "button",
      {
        type: "button",
        class: "add-btn",
        onClick: () => {
          links.push({ label: "", href: "", target: "" });
          render();
        },
      },
      "+ Add nav link",
    ),
  ];
}

function renderSidebar(): HTMLElement[] {
  const s = state.sidebar;
  return [
    el("div", { class: "fields" }, [
      textField({
        label: "Sidebar title",
        defaultLabel: `"${DEFAULT_SIDEBAR.title}"`,
        value: s.title,
        onInput: (v) => {
          s.title = v;
          updatePreview();
        },
      }),
      toggleField({
        label: "Show HTTP methods",
        hint: "Right-aligned method label in each endpoint item.",
        checked: s.showMethods,
        onChange: (v) => {
          s.showMethods = v;
          updatePreview();
        },
      }),
    ]),
  ];
}

function renderFeatures(): HTMLElement[] {
  const f = state.features;
  const item = (key: keyof FeaturesState, label: string, hint: string): HTMLElement =>
    toggleField({
      label,
      hint,
      checked: f[key],
      onChange: (v) => {
        f[key] = v;
        updatePreview();
      },
    });
  return [
    el("div", { class: "fields" }, [
      item(
        "openApiContract",
        "OpenAPI contract",
        "'View OpenAPI contract' panel + dialog with the raw spec.",
      ),
      item("accessBadge", "Access badge", "'Authentication required' / 'Public endpoint' pill."),
      item("deprecatedBadge", "Deprecated badge", "'Deprecated' pill next to the request line."),
      item("copyButton", "Copy button", "Copy-to-clipboard control in every code block."),
    ]),
  ];
}

function renderSizing(): HTMLElement[] {
  return [
    el("h3", { class: "section__group-title" }, "Typography (rem)"),
    el("div", { class: "fields" }, [
      fontSlider({
        key: "fontBody",
        label: "Body font size",
        sample: "Body copy, nav items, table cells",
        family: "body",
      }),
      fontSlider({
        key: "fontCode",
        label: "Code font size",
        sample: "const answer = 42;",
        family: "mono",
      }),
      fontSlider({
        key: "fontLead",
        label: "Lead paragraph",
        sample: "Lead paragraph & status codes",
        family: "body",
      }),
      fontSlider({
        key: "fontCardTitle",
        label: "Card title",
        sample: "Card & schema titles",
        family: "heading",
      }),
      fontSlider({
        key: "fontSubsection",
        label: "Subsection (H3)",
        sample: "Endpoint entry title",
        family: "heading",
      }),
      fontSlider({
        key: "fontSection",
        label: "Section (H2)",
        sample: "Chapter header",
        family: "heading",
      }),
      fontSlider({
        key: "fontHero",
        label: "Hero title (H1)",
        sample: "Page title",
        family: "heading",
      }),
    ]),
    el("h3", { class: "section__group-title" }, "Layout (rem)"),
    el("div", { class: "fields" }, [
      lengthSlider({
        key: "sidebarWidth",
        label: "Sidebar width",
        min: 12,
        max: 32,
        hint: "Column width of the left navigation rail.",
      }),
      lengthSlider({
        key: "containerMaxWidth",
        label: "Container max width",
        min: 48,
        max: 120,
        step: 1,
        hint: "Maximum content column width; the top bar recenters on the same measure.",
      }),
      lengthSlider({
        key: "pagePadding",
        label: "Page padding",
        min: 0.5,
        max: 4,
        step: 0.125,
        hint: "Outer page gutter; feeds top-bar inline padding and dialog width margins.",
      }),
    ]),
  ];
}

function renderMotion(): HTMLElement[] {
  return [
    el("h3", { class: "section__group-title" }, "Timing"),
    el("div", { class: "fields" }, [durationSlider(), easingField()]),
    el("h3", { class: "section__group-title" }, "Code line-height"),
    el("div", { class: "fields fields--single" }, [lineHeightSlider()]),
    el("h3", { class: "section__group-title" }, "Response card tint"),
    el("div", { class: "fields" }, [
      percentSlider({
        key: "responseTintLight",
        label: "Response tint (light)",
        hint: "Status color mixed into the response-card surface (light mode).",
        toneVarLight: DEFAULT_LIGHT_COLORS.methodPost,
        toneVarDark: DEFAULT_DARK_COLORS.methodPost,
      }),
      percentSlider({
        key: "responseTintDark",
        label: "Response tint (dark)",
        hint: "Same in dark mode.",
        toneVarLight: DEFAULT_LIGHT_COLORS.methodPost,
        toneVarDark: DEFAULT_DARK_COLORS.methodPost,
      }),
    ]),
    el("h3", { class: "section__group-title" }, "Card header chrome"),
    el("div", { class: "fields" }, [
      percentSlider({
        key: "cardChromeMixLight",
        label: "Card chrome mix (light)",
        hint: "How much text color mixes into card/panel header chrome.",
        toneVarLight: DEFAULT_LIGHT_COLORS.text,
        toneVarDark: DEFAULT_DARK_COLORS.text,
      }),
      percentSlider({
        key: "cardChromeMixDark",
        label: "Card chrome mix (dark)",
        hint: "Same in dark mode.",
        toneVarLight: DEFAULT_LIGHT_COLORS.text,
        toneVarDark: DEFAULT_DARK_COLORS.text,
      }),
    ]),
    el("h3", { class: "section__group-title" }, "Icon tone"),
    el("div", { class: "fields" }, [
      iconToneSlider("iconToneLight", "Icon tone (light)"),
      iconToneSlider("iconToneDark", "Icon tone (dark)"),
    ]),
  ];
}

function renderGuide(): HTMLElement[] {
  const modes: Array<{ key: GuideMode; label: string }> = [
    { key: "default", label: "Auto" },
    { key: "custom", label: "Custom" },
    { key: "off", label: "Off" },
  ];
  const items = GUIDE_SECTIONS.map((sec) => {
    const g = state.guide[sec.key];
    const seg = el(
      "div",
      { class: "segmented", role: "group", "aria-label": `${sec.label} mode` },
      modes.map((m) =>
        el(
          "button",
          {
            type: "button",
            class: "segmented__item",
            "aria-pressed": String(g.mode === m.key),
            onClick: () => {
              g.mode = m.key;
              render();
            },
          },
          m.label,
        ),
      ),
    );
    const ta = el("textarea", {
      class: "field__input",
      rows: "3",
      placeholder: "Markdown content…",
      onInput: (e: Event) => {
        g.markdown = (e.target as HTMLTextAreaElement).value;
        updatePreview();
      },
    });
    ta.value = g.markdown;
    return el("div", { class: "guide-item" }, [
      el("div", { class: "guide-item__head" }, [
        el("span", { class: "guide-item__title" }, sec.label),
        seg,
      ]),
      g.mode === "custom" ? ta : null,
    ]);
  });
  return items;
}

const CUSTOM_SECTION_POSITIONS: readonly string[] = [
  "before-guide",
  "after-guide",
  "after-reference",
];

function renderCustomSections(): HTMLElement[] {
  const list = state.customSections.map((s, i) => {
    const posSelect = el(
      "select",
      {
        class: "field__input",
        onChange: (e: Event) => {
          s.position = (e.target as HTMLSelectElement).value;
          updatePreview();
        },
      },
      [
        el("option", { value: "" }, "after-guide (default)"),
        ...CUSTOM_SECTION_POSITIONS.map((p) =>
          el("option", { value: p, ...(s.position === p ? { selected: true } : {}) }, p),
        ),
      ],
    );
    if (s.position) posSelect.value = s.position;
    const markdownTa = el("textarea", {
      class: "field__input",
      rows: "4",
      placeholder: "Markdown…",
      onInput: (e: Event) => {
        s.markdown = (e.target as HTMLTextAreaElement).value;
        updatePreview();
      },
    });
    markdownTa.value = s.markdown;
    return el("div", { class: "list-item" }, [
      el("div", { class: "list-item__header" }, [
        el("span", { class: "list-item__title" }, s.title || `Section ${i + 1}`),
        el(
          "button",
          {
            type: "button",
            class: "list-item__remove",
            onClick: () => {
              state.customSections.splice(i, 1);
              render();
            },
          },
          "Remove",
        ),
      ]),
      el("div", { class: "fields" }, [
        textField({
          label: "ID (anchor)",
          value: s.id,
          placeholder: "sdks",
          onInput: (v) => {
            s.id = v;
            updatePreview();
          },
        }),
        textField({
          label: "Title",
          value: s.title,
          placeholder: "SDK Downloads",
          onInput: (v) => {
            s.title = v;
            updatePreview();
          },
        }),
        el("div", { class: "field" }, [
          el("label", { class: "field__label" }, "Position"),
          posSelect,
        ]),
      ]),
      el("div", { class: "field" }, [
        el("label", { class: "field__label" }, "Markdown body"),
        markdownTa,
      ]),
    ]);
  });
  const addBtn = el(
    "button",
    {
      type: "button",
      class: "add-btn",
      onClick: () => {
        state.customSections.push({ id: "", title: "", markdown: "", position: "" });
        render();
      },
    },
    "+ Add section",
  );
  return [...list, addBtn];
}

function renderFooter(): HTMLElement[] {
  const f = state.footer;
  const linkItems = f.links.map((link, i) =>
    el("div", { class: "list-item" }, [
      el("div", { class: "list-item__header" }, [
        el("span", { class: "list-item__title" }, link.label || `Link ${i + 1}`),
        el(
          "button",
          {
            type: "button",
            class: "list-item__remove",
            onClick: () => {
              f.links.splice(i, 1);
              render();
            },
          },
          "Remove",
        ),
      ]),
      el("div", { class: "fields" }, [
        textField({
          label: "Label",
          value: link.label,
          onInput: (v) => {
            link.label = v;
            updatePreview();
          },
        }),
        textField({
          label: "Href",
          value: link.href,
          placeholder: "https://…",
          onInput: (v) => {
            link.href = v;
            updatePreview();
          },
        }),
      ]),
    ]),
  );
  return [
    textField({
      label: "Text",
      hint: "Free-form closing text, e.g. a copyright line.",
      value: f.text,
      onInput: (v) => {
        f.text = v;
        updatePreview();
      },
    }),
    el("h3", { class: "section__group-title" }, "Links"),
    ...linkItems,
    el(
      "button",
      {
        type: "button",
        class: "add-btn",
        onClick: () => {
          f.links.push({ label: "", href: "" });
          render();
        },
      },
      "+ Add link",
    ),
  ];
}

// ---------- Render loop ----------

const SECTION_RENDERERS: Record<string, () => HTMLElement[]> = {
  spec: renderSpec,
  site: renderSite,
  theme: renderTheme,
  navigation: renderNavigation,
  sidebar: renderSidebar,
  features: renderFeatures,
  sizing: renderSizing,
  motion: renderMotion,
  guide: renderGuide,
  customSections: renderCustomSections,
  footer: renderFooter,
};

/**
 * Full rebuild of every section body. Called after structural changes
 * (add/remove list items, mode switches, reset). Fills each SSR slot
 * (`data-pw-cb-body="<key>"`) with the section's field widgets.
 */
export function render(): void {
  for (const [key, renderer] of Object.entries(SECTION_RENDERERS)) {
    const slot = document.querySelector<HTMLElement>(`[data-pw-cb-body="${key}"]`);
    if (!slot) continue;
    slot.replaceChildren(...renderer());
  }
  updatePreview();
}

/**
 * Cheap update path used by every text / toggle / color input: mutates
 * state and refreshes only the preview. Step 5 wires the actual
 * serializer + tokenizer + highlighter; step 4 leaves the preview
 * empty so field wiring can be tested in isolation.
 */
export function updatePreview(): void {
  // Step 5 fills this with the config-source generator.
}

// ---------- Actions (Reset / Copy / Save) ----------

const TOAST_TIMEOUT = 1800;
let toastTimer: ReturnType<typeof setTimeout> | null = null;

function ensureToast(): HTMLElement {
  let toast = document.querySelector<HTMLElement>("[data-pw-cb-toast]");
  if (toast) return toast;
  toast = el("div", {
    class: "pw-cb__toast",
    "data-pw-cb-toast": "",
    role: "status",
    "aria-live": "polite",
  });
  document.body.appendChild(toast);
  return toast;
}

function showToast(text: string): void {
  const toast = ensureToast();
  toast.textContent = text;
  toast.classList.add("pw-cb__toast--visible");
  if (toastTimer !== null) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("pw-cb__toast--visible"), TOAST_TIMEOUT);
}

/**
 * Placeholder source generator. Step 5 replaces this with the real
 * TypeScript serializer that emits only non-default fields.
 */
function generateSource(): string {
  return `// periwinkle.config.ts — full serializer arrives in the next step.\n`;
}

async function copySource(): Promise<void> {
  try {
    await navigator.clipboard.writeText(generateSource());
    showToast("Copied to clipboard");
  } catch (err) {
    console.error(err);
    showToast("Copy failed — check console");
  }
}

async function saveSource(): Promise<void> {
  const source = generateSource();
  const suggestedName = "periwinkle.config.ts";
  const anyWindow = window as unknown as {
    showSaveFilePicker?: (opts: {
      suggestedName: string;
      types: Array<{ description: string; accept: Record<string, string[]> }>;
    }) => Promise<{
      createWritable(): Promise<{ write(data: string): Promise<void>; close(): Promise<void> }>;
    }>;
  };
  if (typeof anyWindow.showSaveFilePicker === "function") {
    try {
      const handle = await anyWindow.showSaveFilePicker({
        suggestedName,
        types: [
          {
            description: "TypeScript file",
            accept: { "application/typescript": [".ts"] },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(source);
      await writable.close();
      showToast("Saved");
      return;
    } catch (err) {
      if (err && (err as Error).name === "AbortError") return;
      console.error(err);
      // fall through to blob download
    }
  }
  const blob = new Blob([source], { type: "application/typescript" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = suggestedName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  showToast("Download started");
}

function openResetDialog(doc: Document): void {
  const dialog = doc.getElementById("pw-cb-reset-dialog") as HTMLDialogElement | null;
  dialog?.showModal();
}

function applyReset(): void {
  state = createInitialState();
  render();
  showToast("Defaults restored");
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
  // data-pw-cb-section with the section key. Restore any persisted
  // open state, then bind the click handler.
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

  // Top-bar actions
  for (const btn of doc.querySelectorAll<HTMLElement>("[data-pw-cb-action]")) {
    const action = btn.dataset.pwCbAction;
    if (action === "copy") btn.addEventListener("click", () => void copySource());
    else if (action === "save") btn.addEventListener("click", () => void saveSource());
    else if (action === "reset") btn.addEventListener("click", () => openResetDialog(doc));
  }

  // Reset dialog handlers
  const dialog = doc.getElementById("pw-cb-reset-dialog") as HTMLDialogElement | null;
  if (dialog) {
    dialog.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      if (target.hasAttribute("data-pw-cb-dialog-close")) dialog.close();
      else if (target.hasAttribute("data-pw-cb-dialog-confirm")) {
        dialog.close();
        applyReset();
      }
    });
  }

  render();
}
