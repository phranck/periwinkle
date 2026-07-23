/**
 * Config for the public periwinkle demo on GitHub Pages.
 *
 * Uses the neutral bookstore fixture spec as a dummy API contract; the
 * Pages workflow builds this on every push to main.
 *
 * @type {import("../src/config/config.js").PeriwinkleConfig}
 */
export default {
  spec: "tests/fixtures/bookstore.openapi.json",
  site: {
    basePath: "/periwinkle",
    serverUrl: "https://api.bookstore.example",
  },
  navigation: {
    logo: "resources/Logo_Banner/logo.svg",
  },
  guide: {
    rateLimits: "This is a demo deployment of a fictional API — there are no real rate limits.",
  },
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
    links: [
      { label: "GitHub", href: "https://github.com/phranck/periwinkle" },
      { label: "OpenAPI contract", href: "/periwinkle/openapi.json" },
    ],
    text: "Built with periwinkle",
  },
};
