/**
 * Post-build export verification.
 *
 * Imports the built package entry and asserts the public surface exists,
 * then checks that every subpath export points at a real file. Run in CI
 * after `npm run build`; fails loudly so a broken exports map can never
 * reach a release.
 */

import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = fileURLToPath(new URL("..", import.meta.url));
const require = createRequire(import.meta.url);
const pkg = require("../package.json");

const entry = await import(resolve(packageRoot, pkg.exports["."].import));

const REQUIRED_EXPORTS = [
  "buildApiReference",
  "resolveConfig",
  "defineConfig",
  "loadConfig",
  "compileThemeCss",
  "prepareDocsData",
  "buildSite",
  "startPreviewServer",
  "ApiDocs",
  "SidebarNav",
  "EndpointBlock",
  "SchemaCard",
];

const missing = REQUIRED_EXPORTS.filter((name) => typeof entry[name] === "undefined");
if (missing.length > 0) {
  console.error(`verify-exports: missing exports: ${missing.join(", ")}`);
  process.exit(1);
}

for (const [subpath, target] of Object.entries(pkg.exports)) {
  const file = typeof target === "string" ? target : target.import;
  if (!existsSync(resolve(packageRoot, file))) {
    console.error(`verify-exports: exports["${subpath}"] points at missing file ${file}`);
    process.exit(1);
  }
  const types = typeof target === "object" && target.types;
  if (types && !existsSync(resolve(packageRoot, types))) {
    console.error(`verify-exports: exports["${subpath}"] types missing at ${types}`);
    process.exit(1);
  }
}

console.log(`verify-exports: ok (${REQUIRED_EXPORTS.length} exports, ${Object.keys(pkg.exports).length} subpaths)`);
