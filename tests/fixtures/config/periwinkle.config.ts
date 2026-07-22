import { defineConfig } from "../../../src/index.js";

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
