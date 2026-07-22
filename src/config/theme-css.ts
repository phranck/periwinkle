/**
 * Theme-to-CSS compilation.
 *
 * Turns the resolved theme into CSS custom property blocks: `:root` carries
 * the light palette plus fonts and radius; `[data-theme="dark"]` overrides
 * the color tokens. The client bundle switches themes by toggling the
 * `data-theme` attribute, so no CSS is duplicated per mode.
 */

import type { ResolvedConfig, ThemeColors } from "./config.js";

/** Prefix of every periwinkle CSS custom property. */
export const CSS_VARIABLE_PREFIX = "--pw-";

/**
 * Converts a camelCase token name into its CSS custom property name,
 * e.g. `methodGet` → `--pw-method-get`.
 *
 * @param token Theme token name in camelCase.
 * @returns The prefixed kebab-case CSS custom property name.
 */
export function cssVariableName(token: string): string {
  return `${CSS_VARIABLE_PREFIX}${token.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()}`;
}

function colorDeclarations(colors: ThemeColors, indent: string): string {
  return Object.entries(colors)
    .map(([token, value]) => `${indent}${cssVariableName(token)}: ${value};`)
    .join("\n");
}

/**
 * Compiles the resolved theme into a CSS string with all custom properties.
 *
 * @param theme The `theme` part of a {@link ResolvedConfig}.
 * @returns CSS text: a `:root` block (light colors, fonts, radius) and a
 *   `[data-theme="dark"]` block (dark color overrides).
 */
export function compileThemeCss(theme: ResolvedConfig["theme"]): string {
  const indent = "  ";
  const rootLines = [
    colorDeclarations(theme.colors.light, indent),
    `${indent}${CSS_VARIABLE_PREFIX}font-base: ${theme.fonts.base};`,
    `${indent}${CSS_VARIABLE_PREFIX}font-heading: ${theme.fonts.heading};`,
    `${indent}${CSS_VARIABLE_PREFIX}font-mono: ${theme.fonts.mono};`,
    `${indent}${CSS_VARIABLE_PREFIX}radius: ${theme.radius};`,
  ].join("\n");

  const darkLines = colorDeclarations(theme.colors.dark, indent);

  return `:root {\n${rootLines}\n}\n\n[data-theme="dark"] {\n${darkLines}\n}\n`;
}
