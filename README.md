# periwinkle

Static API documentation generator for OpenAPI 3.x — turn a spec plus a small config into a polished, themable, self-contained docs site. Named after the violet-blooming periwinkle flower (Vinca).

> Status: early development. The design is documented in [docs/DESIGN.md](docs/DESIGN.md); the first release will be `0.1.0` on npm.

## What it will do

- `periwinkle build --spec openapi.json --config periwinkle.config.ts --out dist` — build a static API reference (HTML + CSS + a small vanilla-JS bundle, no framework at runtime)
- `periwinkle preview` — serve a built output directory locally
- Package exports for embedding the React components in an existing app (e.g. Astro with `@astrojs/react`)
- Theming via config: colors (light/dark), fonts, logo, integration guide content, custom sections

## License

This repository has been published under the [MIT](https://layered.mit-license.org) license.
