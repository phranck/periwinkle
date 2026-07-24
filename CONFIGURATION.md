# Configuring periwinkle

Everything periwinkle renders is driven by two inputs: your OpenAPI 3.x document and a `periwinkle.config` file. This page documents **every** configuration option — what it does, what it defaults to, and where its effect appears on the rendered page.

## The config file

periwinkle looks for a config file in the working directory, trying these names in order:

1. `periwinkle.config.ts`
2. `periwinkle.config.mts`
3. `periwinkle.config.js`
4. `periwinkle.config.mjs`

TypeScript configs work out of the box (loaded via [jiti](https://github.com/unjs/jiti), no build step needed). Alternatively, pass an explicit path with `--config <file>`; the CLI fails loudly if that file does not exist.

Use `defineConfig` for typed authoring with editor completion:

```ts
import { defineConfig } from "periwinkle";

export default defineConfig({
  spec: "openapi.json",
});
```

**Every field is optional.** An empty config (or none at all, when `--spec` is passed) produces a fully working site with the built-in periwinkle look. Validation is strict: unknown keys, wrong types, or malformed entries abort the build with an `Invalid periwinkle config: …` message — a typo never silently degrades the output.

### Asset paths (logos, favicon)

Fields that accept an image (`site.logo`, `site.favicon`, `navigation.logo`) resolve in three ways:

| You write | What happens |
| --- | --- |
| Relative path (`assets/logo.svg`) | File is copied into the output directory and referenced by its base name (with `site.basePath` applied) |
| URL (`https://…`) or `data:` URI | Passed through untouched |
| Absolute path (`/logo.svg`) | Passed through untouched (useful when the host serves the file itself) |

A configured local file that does not exist fails the build.

## Top-level overview

```ts
export default defineConfig({
  spec: "openapi.json",       // where the contract lives
  site: { /* … */ },          // page identity: base path, title, favicon
  theme: { /* … */ },         // colors, fonts, corner radius
  navigation: { /* … */ },    // sticky top bar
  sidebar: { /* … */ },       // left navigation rail
  features: { /* … */ },      // on/off switches for built-in affordances
  sizing: { /* … */ },        // typography scale and layout dimensions
  motion: { /* … */ },        // animation timing and color-mix intensities
  guide: { /* … */ },         // "Integration guide" chapter content
  customSections: [ /* … */ ],// your own Markdown chapters
  footer: { /* … */ },        // links and closing text
});
```

---

## `spec`

| Type | Default |
| --- | --- |
| `string` | — |

Path to the OpenAPI 3.x document, JSON or YAML. The CLI flag `--spec <file>` overrides it. If neither is set, the build aborts. Broken or unparsable specs fail the build with a clear message.

---

## `site`

Page identity and serving location.

| Key | Type | Default | Effect |
| --- | --- | --- | --- |
| `basePath` | `string` | `"/"` | Path prefix the site is served under (must start with `/`). Applied to every generated asset URL — set it to `/docs` when the site lives at `example.com/docs`, or to the repo name for GitHub Pages project sites. |
| `serverUrl` | `string` | first `servers` entry of the spec | Base URL printed in every generated `curl` example and shown as the OpenAPI contract link in the integration guide. |
| `title` | `string` | the spec's `info.title` | Document `<title>` and the hero heading at the top of the page. |
| `logo` | `string` | — | Small logo rendered next to the sidebar title (see [asset paths](#asset-paths-logos-favicon)). |
| `favicon` | `string` | — | Browser favicon, linked in the document head. |

**Where it appears:** the hero block (title), the `curl` examples inside every endpoint and the integration guide (serverUrl), the sidebar header (logo), the browser tab (title, favicon).

---

## `theme`

Colors, fonts, and the corner-radius token. Compiled at build time into CSS custom properties, injected as a `<style>` block *after* the stylesheet link — your values always win over the built-in defaults.

### `theme.colors.light` / `theme.colors.dark`

Two partial palettes: any token you set overrides the default of that mode; everything else keeps the built-in value. Defaults are GitHub-light/GitHub-dark neutrals with the periwinkle (velvet) accent.

| Token | Light default | Dark default | Where it appears |
| --- | --- | --- | --- |
| `background` | `#ffffff` | `#0d1117` | Page background; also the base of the frosted top-bar wash and the search dialog backdrop veil |
| `surface` | `#f6f8fa` | `#161b22` | Cards, sidebar rail, dialogs — every raised surface |
| `surfaceAlt` | `#eff2f5` | `#21262d` | Inset surfaces: content panels, code frames, hover backdrops, inline code, keycaps |
| `text` | `#1f2328` | `#e6edf3` | Primary copy, headings, card titles |
| `textMuted` | `#59636e` | `#8b949e` | Descriptions, labels, sidebar links, meta rows |
| `textFaint` | `#818b98` | `#6e7681` | Hints, placeholders, footers, line numbers |
| `accent` | `#6667ab` | `#9a9bd4` | Active nav items, chapter icons, focus accents, segmented-control highlight, "Required" chips, 3xx response tone |
| `border` | `#d1d9e0` | `#30363d` | Hairline borders, dividers, table rules, field outlines |
| `link` | `#5253a3` | `#a8a9e0` | Hyperlinks in prose and schema references |
| `methodGet` | `#0969da` | `#58a6ff` | GET badge in endpoint headers and sidebar method hints |
| `methodPost` | `#1a7f37` | `#3fb950` | POST badge; also the 2xx response-card tone |
| `methodPut` | `#bc4c00` | `#db6d28` | PUT badge; also the 4xx response-card tone |
| `methodPatch` | `#9a6700` | `#d29922` | PATCH badge |
| `methodDelete` | `#d1242f` | `#f85149` | DELETE badge; also the 5xx response-card tone |
| `statusSuccess` | `#1a7f37` | `#3fb950` | Success accents (e.g. the copy-button confirmation) |
| `statusError` | `#d1242f` | `#f85149` | Error accents, "Deprecated" pill, required-field marks |

```ts
theme: {
  colors: {
    light: { accent: "#6667ab" },
    dark: { accent: "#9a9bd4", background: "#0a0a14" },
  },
},
```

### `theme.fonts`

| Key | Type | Default | Where it appears |
| --- | --- | --- | --- |
| `base` | `string` | `"Barlow", …` system stack | Body copy, navigation, labels |
| `heading` | `string` | `"Barlow Condensed", …` system stack | H1–H4, card titles, chapter headers |
| `mono` | `string` | `ui-monospace, …` system stack | Code blocks, endpoint paths, parameter names, media types, keycaps |
| `stylesheets` | `string[]` | one Google-Fonts URL loading Barlow + Barlow Condensed | `<link rel="stylesheet">` entries in the document head, so custom `@font-face` sources load before use. Set to `[]` when your stacks are system-only. |

### `theme.radius`

| Type | Default |
| --- | --- |
| `string` (CSS length) | `"1rem"` |

The single geometry token the whole design derives from: cards and dialogs render at the full radius, nested panels and compact controls at derived fractions, and the content inset that aligns free-standing headlines with card copy equals `radius / 2`. Change this one value and the entire surface family follows.

---

## `navigation`

The sticky top bar. It spans the full viewport width, blurs the content scrolling behind it (frosted glass), and deepens its wash once the page is scrolled. Every affordance is toggleable — **when the logo is unset and every `show*` flag is `false`, the bar is not rendered at all** and the layout reclaims its height.

| Key | Type | Default | Effect |
| --- | --- | --- | --- |
| `logo` | `string` | — | Brand mark on the far left, scaled to the control height, linking to `homeHref` (see [asset paths](#asset-paths-logos-favicon)). |
| `showHome` | `boolean` | `true` | Leading nav pill with an icon and the `homeLabel` text; marked as the current page. |
| `homeLabel` | `string` | `"API reference"` | Text of the home pill; also the accessible label of the logo link. |
| `homeHref` | `string` | `"#"` | Where the home pill and logo point. Default jumps to the top of the page; set an absolute URL to link back to a parent site. |
| `showSearch` | `boolean` | `true` | "Search" pill with the `⌘K` keycap. Opens the document search dialog (the `⌘K`/`Ctrl+K` shortcut works regardless). |
| `showThemeToggle` | `boolean` | `true` | Light/dark toggle on the far right. The chosen scheme persists in `localStorage`. |
| `github` | `{ url, label? }` | — | GitHub pill between search and theme toggle. `url` is required, opens in a new tab; `label` overrides the visible text and accessible name (default `"GitHub"`). |
| `links` | `Array<{ label, href, target? }>` | `[]` | Custom nav pills rendered between the built-in home/search affordances and the GitHub/theme cluster. Each entry needs `label` + `href`; set `target: "_blank"` to open in a new tab (`rel="noopener noreferrer"` is applied automatically). |

```ts
navigation: {
  logo: "assets/logo.svg",
  homeHref: "https://example.com",
  github: { url: "https://github.com/acme/api" },
},
```

---

## `sidebar`

The left rail: a sticky card with a glass header, one collapsible section per endpoint group (tag), and a schemas section. Section open-states persist in `localStorage`; the rail works without JavaScript.

| Key | Type | Default | Effect |
| --- | --- | --- | --- |
| `title` | `string` | `"Reference"` | Header label above the section list (next to `site.logo` when set). |
| `showMethods` | `boolean` | `false` | Right-aligned HTTP method (`GET`, `POST`, …) in each endpoint item, tinted in the method color — makes the rail scannable without opening groups. |
| `showThemeToggle` | `boolean` | `false` | Duplicate theme toggle in the sidebar header. Off by default because the top bar carries one; enable for both places. |
| `showSearch` | `boolean` | `false` | Search field in the sidebar header (opens the same dialog as the top-bar trigger). Off by default for the same reason. |

---

## `features`

Global on/off switches. Each defaults to `true`; `false` removes the affordance everywhere.

| Key | Default | What `false` removes |
| --- | --- | --- |
| `openApiContract` | `true` | The "OpenAPI contract" panel in the integration guide **and** the "View OpenAPI contract" dialog showing the raw highlighted spec. |
| `accessBadge` | `true` | The "Authentication required" / "Public endpoint" pill in every endpoint header. |
| `deprecatedBadge` | `true` | The "Deprecated" pill next to the request line of operations marked `deprecated: true`. |
| `copyButton` | `true` | The copy-to-clipboard button in every code block (curl examples, request examples, contract dialog). |

---

## `sizing`

Typography scale and layout dimensions. Every value is a CSS length string (`rem`, `px`, `em`, …). These compile into CSS custom properties, so they cascade through every component consistently.

| Key | Default | Where it appears |
| --- | --- | --- |
| `fontBody` | `"1.125rem"` | Body copy, nav items, descriptions, table cells |
| `fontCode` | `"1rem"` | Code blocks, inline code, parameter names, media types, chips |
| `fontLead` | `"1.5rem"` | Intro lead paragraph, endpoint method glyph, response status codes, section headers inside endpoints |
| `fontCardTitle` | `"1.375rem"` | Schema card titles, content card titles, sidebar header title |
| `fontSubsection` | `"1.625rem"` | Endpoint entry titles (H3 above each endpoint card) |
| `fontSection` | `"2.25rem"` | Chapter headers (H2: "Integration guide", group names, "Schemas") |
| `fontHero` | `"3.25rem"` | The page title at the very top |
| `sidebarWidth` | `"20rem"` | Width of the sidebar column in the two-column layout |
| `containerMaxWidth` | `"88rem"` | Maximum width of the content shell **and** the top bar's inner row — both recenter on the same measure |
| `pagePadding` | `"1.5rem"` | Outer page gutter; also feeds the top bar's inline padding and dialog width margins |

---

## `motion`

Animation timing and the color-mix intensities that shape the visual texture. Values are CSS strings.

| Key | Default | Effect |
| --- | --- | --- |
| `duration` | `"160ms"` | Base duration for sidebar expand/collapse, dialog fade, chevron rotation, hover transitions. `"0ms"` effectively disables animations (users with `prefers-reduced-motion` get that automatically). |
| `easing` | `"ease-in-out"` | Timing function for the same set of transitions. |
| `codeLineHeight` | `"1.5"` | Line-height inside code blocks (also drives the 20-line scroll cap of long blocks). |
| `responseTintLight` | `"12%"` | How much of the status color mixes into a response card's surface in light mode — higher = stronger green/orange/red tint on 2xx/4xx/5xx cards. |
| `responseTintDark` | `"16%"` | Same in dark mode (dark surfaces need a stronger mix to stay perceptible). |
| `cardChromeMixLight` | `"6%"` | Text-color share mixed into card/panel header chrome in light mode — higher = darker header separation. |
| `cardChromeMixDark` | `"12%"` | Same in dark mode. |
| `iconToneLight` | `"60%"` | Icon color intensity in light mode: icons render as a mix of their color into the surface beneath, so they read lifted instead of pure black. `"100%"` = full color. |
| `iconToneDark` | `"100%"` | Same in dark mode. |

---

## `guide`

Content of the built-in "Integration guide" chapter — a card with one panel per section plus an authenticated `curl` example. Each key accepts **Markdown** or **`false`**:

- *Markdown string* — replaces the panel's content.
- *`false`* — removes the panel entirely.
- *unset* — the panel renders generic English copy derived from the spec (declared security schemes, server URL, version).

| Key | Panel | Derived fallback content |
| --- | --- | --- |
| `intro` | Introductory panel at the top of the guide | Short generic intro |
| `auth` | "Authentication" | Lists the spec's `securitySchemes` (API key headers, bearer tokens) with usage notes |
| `requests` | "Requests" | Base URL and content-type conventions from the spec |
| `errors` | "Errors" | Generic HTTP status-code guidance |
| `rateLimits` | "Rate limits" | Generic note; author this if your API enforces limits |
| `versioning` | "Versioning" | The spec's `info.version` |

The "OpenAPI contract" panel in the same grid is controlled by `features.openApiContract`, not by `guide`.

```ts
guide: {
  auth: "Send the `X-API-Key` header with every request.",
  rateLimits: "100 requests per minute per key.",
  versioning: false,
},
```

---

## `customSections`

Your own Markdown chapters, woven into the page and picked up by the sidebar and the search index automatically.

| Key | Type | Notes |
| --- | --- | --- |
| `id` | `string` | Required, unique across all sections — becomes the in-page anchor (`#your-id`). Duplicates fail the build. |
| `title` | `string` | Chapter heading, shown in content, sidebar, and search results. |
| `markdown` | `string` | Body content, rendered as Markdown. |
| `position` | `"before-guide"` \| `"after-guide"` \| `"after-reference"` | Where the chapter appears: before the integration guide, between guide and endpoint reference (default), or after the schemas chapter. |

```ts
customSections: [
  {
    id: "sdks",
    title: "SDK Downloads",
    markdown: "Grab the SDKs from …",
    position: "after-reference",
  },
],
```

---

## `footer`

Rendered at the end of the content column, above a hairline separator.

| Key | Type | Default | Effect |
| --- | --- | --- | --- |
| `links` | `{ label, href }[]` | `[]` | Link row on the left. |
| `text` | `string` | — | Free-form closing text on the right, e.g. a copyright line. |

When both are empty, no footer is rendered.

```ts
footer: {
  links: [{ label: "Imprint", href: "https://example.com/imprint" }],
  text: "© Example Corp",
},
```
