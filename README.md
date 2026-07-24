<div align="center">

[![CI](https://github.com/phranck/periwinkle/actions/workflows/ci.yml/badge.svg)](https://github.com/phranck/periwinkle/actions/workflows/ci.yml)
[![Deploy demo to GitHub Pages](https://github.com/phranck/periwinkle/actions/workflows/pages.yml/badge.svg)](https://phranck.github.io/periwinkle/)
[![License](https://img.shields.io/github/license/phranck/periwinkle)](https://layered.mit-license.org)
[![Last commit](https://img.shields.io/github/last-commit/phranck/periwinkle)](https://github.com/phranck/periwinkle/commits/main)

![periwinkle banner](resources/Logo_Banner/banner.png)

</div>

# periwinkle

Static API documentation generator for OpenAPI 3.x — turn a spec plus a small config into a polished, themable, self-contained docs site. Named after the violet-blooming periwinkle flower (Vinca).

**Live demo:** [phranck.github.io/periwinkle](https://phranck.github.io/periwinkle/) — built from a fictional bookstore contract on every push.

- Static output: `index.html`, one stylesheet, one small vanilla-JS bundle. No runtime framework, deployable to any host.
- Sticky top navigation with a frosted-glass backdrop: optional brand logo, home link, search, GitHub link, and theme toggle — every affordance toggleable via config.
- Sidebar navigation with endpoint groups, integration guide, endpoint blocks with generated curl examples, schema cards with field tables and raw JSON view.
- Light/dark theming via CSS custom properties, fully configurable (colors, fonts, logo, radius).
- Document search dialog (`⌘K`) and persisted collapsible sections — all progressive enhancement over working plain HTML.
- Embeddable React components for host apps (e.g. Astro via `@astrojs/react`).

## Quickstart

```bash
npm install --save-dev periwinkle
npx periwinkle build --spec openapi.json --out dist
npx periwinkle preview --dir dist
```

The spec may be JSON or YAML. Broken specs fail the build loudly — periwinkle never produces a silently wrong site.

## Configuration

Create a `periwinkle.config.ts` (or `.mts`/`.js`/`.mjs`) next to your project; it is discovered automatically, or passed explicitly with `--config`. Every field is optional — an empty config produces a fully working site.

```ts
import { defineConfig } from "periwinkle";

export default defineConfig({
  spec: "openapi.json",
  site: { basePath: "/docs", title: "Example API" },
  theme: {
    colors: {
      light: { accent: "#6667ab" },
      dark: { accent: "#9a9bd4" },
    },
  },
  navigation: { logo: "assets/logo.svg", github: { url: "https://github.com/acme/api" } },
});
```

The config covers site identity, the full color palette per mode, fonts, corner radius, the top navigation bar, sidebar affordances, feature switches, typography/layout sizing, animation timing, the integration guide content, custom Markdown chapters, and the footer.

- **Full reference:** every option, its type, default, and where it appears on the page is documented in [CONFIGURATION.md](CONFIGURATION.md).
- **Interactive builder:** click your config together at [phranck.github.io/periwinkle/config-builder.html](https://phranck.github.io/periwinkle/config-builder.html) — live preview, copy to clipboard, save file. The demo site links to it from its own top-nav ("Config builder"). Locally the same page ships as [`config-builder.html`](config-builder.html) at the project root.

## Deploying

The output directory is plain static files. Recipes:

**Any static host (nginx, GitHub Pages, …)** — upload `dist/`. With a sub-path (e.g. Pages project sites), set `site.basePath` accordingly.

**GitHub Actions → Pages** — see [`.github/workflows/pages.yml`](.github/workflows/pages.yml) in this repo; it builds the live demo.

**Hono / Node backend under `/docs`:**

```ts
import { serveStatic } from "@hono/node-server/serve-static";

app.use("/docs/*", serveStatic({ root: "./docs-dist", rewriteRequestPath: (p) => p.replace(/^\/docs/, "") }));
```

Build with `site.basePath: "/docs"` and serve the directory — no server-side rendering involved.

## Embedding in an existing app

The same components that power the CLI are exported for host apps:

```tsx
import { ApiDocs, prepareDocsData, resolveConfig } from "periwinkle";
import "periwinkle/styles.css";

const data = await prepareDocsData(openApiDocument, resolveConfig({ site: { basePath: "/docs" } }));
// e.g. in Astro with @astrojs/react:
<ApiDocs data={data} />
```

Add `periwinkle/client.js` as a deferred script for search, collapsing, and the theme toggle, and emit `compileThemeCss(config)` (it takes the full resolved config, since sizing and motion tokens compile alongside the palette) into a `<style>` tag placed after the stylesheet link. All interactivity binds via `data-pw-*` attributes; the markup works without JavaScript.

## CLI

```
periwinkle build   [--spec <file>] [--config <file>] [--out <dir>]
periwinkle preview [--dir <dir>] [--port <number>]
periwinkle --version | --help
```

## License

This repository has been published under the [MIT](https://layered.mit-license.org) license.
