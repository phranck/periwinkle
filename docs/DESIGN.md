# periwinkle — Design

Static API documentation generator for OpenAPI 3.x. Named after the violet-blooming periwinkle flower (Vinca).

## Goal

periwinkle turns an OpenAPI 3.x document plus a small config into a polished, static API reference site: sidebar navigation with endpoint groups, an integration guide, endpoint detail blocks, and a schema section — rendered as static HTML with a minimal JavaScript layer for interactivity.

It replaces per-project, hand-built API doc setups with one reusable, themable tool.

## Consumer equality (hard rule)

- periwinkle contains **no project-specific code** — for no consumer, including the author's own projects.
- Every consumer uses the same public surface: the CLI with a config file, or the package exports.
- Everything project-specific (colors, fonts, logos, guide texts, extra sections) lives in the consuming project.
- If a consumer needs something the generic feature set cannot express, the generic feature set is extended. Special-case hooks are never added.
- Test fixtures in this repo are neutral example specs. Real-world specs may serve as additional test data but have no special status in the code.

## Architecture

Two consumption layers over one implementation:

1. **CLI** — `periwinkle build --spec openapi.json --config periwinkle.config.ts --out dist` produces a self-contained static site. `periwinkle preview` serves a built output directory locally.
2. **Package exports** — for embedding in an existing app (e.g. an Astro app with `@astrojs/react`):
   - `periwinkle`: the display model (`buildApiReference()`) and the React components (sidebar, integration guide, endpoint blocks, schema section)
   - `periwinkle/styles.css`: the token-based stylesheet
   - `periwinkle/client.js`: the interactivity bundle (search, collapsibles, dark-mode toggle)

The CLI is a thin wrapper around the same components — there is exactly one UI implementation.

### Display model

A normalizer decouples rendering from OpenAPI's raw shape:

- OpenAPI 3.x document → normalized display model
- Endpoints grouped by their first tag
- Navigation titles from `x-nav-title`, falling back to `operationId`, then `summary`
- Schema `$ref`s resolved; schema fields flattened into display-friendly field lists
- Validation with clear error messages; a broken spec fails the build loudly

### Rendering

- React 19 `renderToStaticMarkup` in a Node build script. React is a **build-time** dependency only; the output contains no React runtime.
- React was chosen over a site framework deliberately: React components work both in the CLI (static rendering) and embedded in host apps (e.g. Astro renders them server-side via `@astrojs/react`), while framework-specific components would only work inside that framework. A site framework's machinery (routing, islands, integrations) is not needed for a generated one-page site.
- Components are host-agnostic: all data arrives via props, no CLI/config globals.
- Syntax highlighting at build time via Shiki; Markdown in descriptions and guide content via marked.

### Interactivity

A small vanilla-JS bundle (no framework at runtime):

- Sidebar search/filter
- Collapsible sections with localStorage persistence
- Dark-mode toggle (respecting `prefers-color-scheme` by default)

### Styling

- Hand-written CSS with design tokens as CSS custom properties. Consumers need no Tailwind/UnoCSS/PostCSS.
- The theme config compiles to `:root` / `.dark-mode` variable blocks (colors light/dark, fonts, radii).
- Method badges (GET/POST/PUT/PATCH/DELETE) with per-method accent colors.

## Configuration

`periwinkle.config.ts` (also accepts `.js`/`.mjs`), typed:

- **Identity**: title, logo, favicon
- **Theme**: color palettes (light/dark), font families, optional external font CSS URLs or font-face sources, radii
- **Site**: `basePath` (e.g. `/docs`), server/base URL used in curl examples
- **Integration guide**: per-section Markdown content (auth, requests, errors, rate limits, versioning); each section can be disabled
- **Custom sections**: free-form Markdown/structured sections with a configurable position (before/after the guide, before/after the reference)
- **Footer**: links and legal text
- **Spec source**: path to the OpenAPI JSON/YAML file (CLI flag overrides config)

Every UI string that renders as content is either derived from the spec or configurable. Defaults are English.

## Output

A static `dist/` directory: `index.html`, one CSS file, one JS file, assets (logo, favicon, fonts if bundled). Deployable to any static host or served by any backend (nginx, Hono `serveStatic`, GitHub Pages, ...).

## Testing

- vitest
- Unit tests for the display model (grouping, nav titles, ref resolution, flattening, error cases)
- Snapshot test of a full build against a neutral fixture spec

## Licensing and distribution

- MIT, copyright phranck
- npm package `periwinkle`
- README with quickstart, config reference, and deploy recipes
