#!/usr/bin/env node

/**
 * periwinkle CLI.
 *
 * Commands:
 * - `periwinkle build --spec openapi.json [--config periwinkle.config.ts] [--out dist]`
 * - `periwinkle preview [--dir dist] [--port 4173]`
 *
 * Every failure exits non-zero with a clear message; a broken spec or
 * config must never produce a silently wrong site.
 */

import { createRequire } from "node:module";
import { parseArgs } from "node:util";

import { buildSite } from "./build/build-site.jsx";
import { loadConfig } from "./config/load-config.js";
import { startPreviewServer } from "./preview/serve.js";

const HELP_TEXT = `periwinkle — static API documentation generator for OpenAPI 3.x

Usage:
  periwinkle build [--spec <file>] [--config <file>] [--out <dir>]
  periwinkle preview [--dir <dir>] [--port <number>]

Options:
  --spec     Path to the OpenAPI 3.x document (JSON or YAML).
             Falls back to the config's \`spec\` value.
  --config   Path to periwinkle.config.{ts,mts,js,mjs}.
             Auto-discovered in the working directory when omitted.
  --out      Output directory for the built site. Default: dist
  --dir      Directory served by preview. Default: dist
  --port     Preview port. Default: 4173
  --version  Print the periwinkle version.
  --help     Show this help.
`;

function printVersion(): void {
  const require = createRequire(import.meta.url);
  const pkg = require("../package.json") as { version: string };
  console.log(pkg.version);
}

async function runBuild(args: string[]): Promise<void> {
  const { values } = parseArgs({
    args,
    options: {
      spec: { type: "string" },
      config: { type: "string" },
      out: { type: "string", default: "dist" },
    },
  });
  const { config, path } = await loadConfig(values.config);
  if (path) console.log(`Using config ${path}`);
  const result = await buildSite({
    ...(values.spec !== undefined ? { specPath: values.spec } : {}),
    outDir: values.out,
    config,
  });
  console.log(`Built ${result.files.length} files into ${result.outDir}`);
}

async function runPreview(args: string[]): Promise<void> {
  const { values } = parseArgs({
    args,
    options: {
      dir: { type: "string", default: "dist" },
      port: { type: "string", default: "4173" },
    },
  });
  const port = Number.parseInt(values.port, 10);
  if (Number.isNaN(port)) throw new Error(`Invalid port: ${values.port}`);
  startPreviewServer(values.dir, port);
  console.log(`Serving ${values.dir} at http://localhost:${port}`);
}

async function main(): Promise<void> {
  const [command, ...rest] = process.argv.slice(2);
  if (!command || command === "--help" || command === "help") {
    console.log(HELP_TEXT);
    return;
  }
  if (command === "--version") {
    printVersion();
    return;
  }
  if (command === "build") {
    await runBuild(rest);
    return;
  }
  if (command === "preview") {
    await runPreview(rest);
    return;
  }
  throw new Error(`Unknown command: ${command}\n\n${HELP_TEXT}`);
}

main().catch((error: unknown) => {
  console.error(`periwinkle: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
