/**
 * Theme-to-CSS compilation.
 *
 * Turns the resolved config into CSS custom property blocks: `:root` carries
 * the light palette plus fonts, radius, sizing, motion, and the light-mode
 * intensity tokens; `[data-theme="dark"]` overrides the color tokens and the
 * dark-mode intensity tokens. The client bundle switches themes by toggling
 * the `data-theme` attribute, so no CSS is duplicated per mode.
 */

import type { ResolvedConfig, ThemeColors } from "./config.js";

/** Prefix of every periwinkle CSS custom property. */
export const CSS_VARIABLE_PREFIX = "--pw-";

/**
 * Converts a camelCase token name into its CSS custom property name,
 * e.g. `methodGet` → `--pw-method-get`, `cardChromeMixLight` →
 * `--pw-card-chrome-mix-light`.
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

function declaration(indent: string, token: string, value: string): string {
  return `${indent}${cssVariableName(token)}: ${value};`;
}

/**
 * Compiles the resolved config into a CSS string with all custom properties.
 *
 * @param config The resolved periwinkle configuration.
 * @returns CSS text: a `:root` block (light colors, fonts, radius, sizing,
 *   motion, light-mode intensity tokens) and a `[data-theme="dark"]` block
 *   (dark color + dark-mode intensity overrides).
 */
export function compileThemeCss(config: ResolvedConfig): string {
  const indent = "  ";
  const { theme, sizing, motion } = config;

  const rootLines = [
    colorDeclarations(theme.colors.light, indent),
    declaration(indent, "fontBase", theme.fonts.base),
    declaration(indent, "fontHeading", theme.fonts.heading),
    declaration(indent, "fontMono", theme.fonts.mono),
    declaration(indent, "radius", theme.radius),
    // Sizing: font sizes and layout dimensions
    declaration(indent, "textBody", sizing.fontBody),
    declaration(indent, "textCode", sizing.fontCode),
    declaration(indent, "textLead", sizing.fontLead),
    declaration(indent, "textCardTitle", sizing.fontCardTitle),
    declaration(indent, "textSubsection", sizing.fontSubsection),
    declaration(indent, "textSection", sizing.fontSection),
    declaration(indent, "textHero", sizing.fontHero),
    declaration(indent, "sidebarWidth", sizing.sidebarWidth),
    declaration(indent, "containerMaxWidth", sizing.containerMaxWidth),
    declaration(indent, "pagePadding", sizing.pagePadding),
    // Motion + intensity tokens (light branch)
    declaration(indent, "navTransitionDuration", motion.duration),
    declaration(indent, "navTransitionEasing", motion.easing),
    declaration(indent, "codeLineHeight", motion.codeLineHeight),
    declaration(indent, "responseTint", motion.responseTintLight),
    declaration(indent, "cardChromeMix", motion.cardChromeMixLight),
    declaration(indent, "iconTone", motion.iconToneLight),
  ].join("\n");

  const darkLines = [
    colorDeclarations(theme.colors.dark, indent),
    declaration(indent, "responseTint", motion.responseTintDark),
    declaration(indent, "cardChromeMix", motion.cardChromeMixDark),
    declaration(indent, "iconTone", motion.iconToneDark),
  ].join("\n");

  return `:root {\n${rootLines}\n}\n\n[data-theme="dark"] {\n${darkLines}\n}\n`;
}
