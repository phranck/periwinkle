/**
 * Config file discovery and loading.
 *
 * Loads `periwinkle.config.{ts,mts,js,mjs}` via jiti, so consumers can author
 * typed TypeScript configs without a build step of their own. The loaded
 * value is validated and resolved immediately; a config file that exists but
 * is broken fails loudly instead of silently falling back to defaults.
 */

import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { createJiti } from "jiti";

import { type ResolvedConfig, resolveConfig } from "./config.js";

/** File names probed during config discovery, in priority order. */
const CONFIG_FILE_NAMES = [
  "periwinkle.config.ts",
  "periwinkle.config.mts",
  "periwinkle.config.js",
  "periwinkle.config.mjs",
] as const;

/**
 * Result of {@link loadConfig}.
 *
 * @property config The validated, fully-resolved configuration.
 * @property path Absolute path of the loaded config file, or `undefined` when
 *   no file was found and pure defaults are in effect.
 */
export interface LoadedConfig {
  config: ResolvedConfig;
  path?: string;
}

/**
 * Loads and resolves the periwinkle configuration.
 *
 * @param explicitPath Config file path passed explicitly (e.g. via the CLI
 *   `--config` flag). When set, the file must exist — a missing explicit path
 *   is an error, not a fallback to defaults.
 * @param cwd Directory used for path resolution and discovery. Defaults to
 *   the process working directory.
 * @returns The resolved config and the path it was loaded from.
 * @throws Error when an explicit path is missing, the module cannot be
 *   loaded, or the config value fails validation.
 */
export async function loadConfig(
  explicitPath?: string,
  cwd = process.cwd(),
): Promise<LoadedConfig> {
  const path = explicitPath ? resolve(cwd, explicitPath) : discoverConfigFile(cwd);
  if (explicitPath && (!path || !existsSync(path))) {
    throw new Error(`periwinkle config not found: ${explicitPath}`);
  }
  if (!path) return { config: resolveConfig() };

  const jiti = createJiti(import.meta.url);
  const loaded = await jiti.import(path, { default: true });
  return { config: resolveConfig(loaded), path };
}

function discoverConfigFile(cwd: string): string | undefined {
  for (const fileName of CONFIG_FILE_NAMES) {
    const candidate = resolve(cwd, fileName);
    if (existsSync(candidate)) return candidate;
  }
  return undefined;
}
