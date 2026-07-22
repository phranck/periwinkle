import { defineConfig } from "tsup";

/**
 * Build configuration for the periwinkle package.
 *
 * Produces the public library entry (`dist/index.js` with type declarations)
 * and the CLI binary (`dist/cli.js`, shebang preserved from the source file).
 * ESM only, matching the package's `"type": "module"` contract.
 */
export default defineConfig({
  entry: ["src/index.ts", "src/cli.ts"],
  format: ["esm"],
  target: "node20",
  dts: true,
  clean: true,
  sourcemap: true,
});
