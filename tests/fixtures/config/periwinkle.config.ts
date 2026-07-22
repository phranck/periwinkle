// Imports the config module directly: jiti loads this fixture from source,
// and the package root would pull in JSX components jiti cannot parse.
// Real consumers import { defineConfig } from "periwinkle" (compiled JS).
import { defineConfig } from "../../../src/config/config.js";

export default defineConfig({
  site: {
    basePath: "/docs",
    serverUrl: "https://api.example.com",
  },
  theme: {
    colors: {
      light: { accent: "#123456" },
    },
    fonts: {
      heading: '"Example Sans", sans-serif',
      stylesheets: ["/fonts/fonts.css"],
    },
  },
  guide: {
    auth: "Send the `X-API-Key` header.",
    rateLimits: false,
  },
  customSections: [
    {
      id: "sdks",
      title: "SDK Downloads",
      markdown: "Grab the SDKs here.",
      position: "after-reference",
    },
  ],
  footer: {
    links: [{ label: "Imprint", href: "https://example.com/imprint" }],
    text: "© Example Corp",
  },
});
