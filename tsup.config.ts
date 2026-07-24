import { defineConfig } from "tsup";

/**
 * Build configuration for the periwinkle package.
 *
 * Two artifacts: the Node library (public entry with type declarations plus
 * the CLI binary, shebang preserved from the source file) and the browser
 * interactivity bundle (`dist/client.js`, self-contained IIFE loaded via a
 * `script` tag in the generated site). The stylesheet is copied verbatim.
 */
export default defineConfig([
  {
    entry: ["src/index.ts", "src/cli.ts"],
    format: ["esm"],
    target: "node20",
    dts: true,
    clean: true,
    sourcemap: true,
    onSuccess: "cp src/styles/styles.css dist/styles.css",
  },
  {
    entry: { client: "src/client/entry.ts" },
    format: ["iife"],
    platform: "browser",
    target: "es2020",
    minify: true,
    outExtension: () => ({ js: ".js" }),
  },
  {
    // Standalone browser bundle for the generated config-builder.html page.
    // Same IIFE + defer-load contract as the docs client bundle.
    entry: { "config-builder": "src/client/config-builder-entry.ts" },
    format: ["iife"],
    platform: "browser",
    target: "es2020",
    minify: true,
    outExtension: () => ({ js: ".js" }),
  },
]);
