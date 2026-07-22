/**
 * Build-time syntax highlighting via Shiki.
 *
 * A single lazily-created highlighter instance serves all code blocks of one
 * build. Colors come from the periwinkle CSS custom properties through the
 * `css-variables`-style dual themes, so highlighted code follows the active
 * light/dark palette without re-rendering.
 */

import { createHighlighter, type Highlighter } from "shiki";

/** Languages periwinkle highlights: request examples and JSON payloads. */
const HIGHLIGHT_LANGUAGES = ["bash", "json"] as const;

/** Shiki language identifier accepted by {@link highlightCode}. */
export type HighlightLanguage = (typeof HIGHLIGHT_LANGUAGES)[number];

let highlighterPromise: Promise<Highlighter> | undefined;

function getHighlighter(): Promise<Highlighter> {
  highlighterPromise ??= createHighlighter({
    themes: ["github-light", "github-dark"],
    langs: [...HIGHLIGHT_LANGUAGES],
  });
  return highlighterPromise;
}

/**
 * Highlights a code snippet to dual-theme HTML.
 *
 * The returned markup carries both palettes: the light colors inline and the
 * dark colors in CSS variables that `styles.css` activates under
 * `[data-theme="dark"]`.
 *
 * @param code Raw source text of the snippet.
 * @param language Snippet language, one of {@link HighlightLanguage}.
 * @returns HTML string containing the highlighted `<pre><code>` block.
 */
export async function highlightCode(code: string, language: HighlightLanguage): Promise<string> {
  const highlighter = await getHighlighter();
  return highlighter.codeToHtml(code, {
    lang: language,
    themes: { light: "github-light", dark: "github-dark" },
    defaultColor: "light",
  });
}
