/**
 * Markdown rendering for OpenAPI prose and configured guide content.
 *
 * Content rendered here is trusted input: it comes from the consumer's own
 * OpenAPI contract and periwinkle config, never from site visitors. The
 * output is static HTML baked at build time.
 */

import { Marked } from "marked";

const marked = new Marked({ gfm: true, breaks: false, async: false });

/**
 * Renders a Markdown string to HTML (block-level output).
 *
 * @param markdown Markdown source, e.g. an OpenAPI `description`.
 * @returns HTML string, empty for empty input.
 */
export function renderMarkdown(markdown: string): string {
  if (!markdown.trim()) return "";
  return marked.parse(markdown) as string;
}

/**
 * Renders a one-line Markdown string to inline HTML without a wrapping
 * paragraph, for use inside table cells and compact rows.
 *
 * @param markdown Markdown source, e.g. a schema field description.
 * @returns Inline HTML string, empty for empty input.
 */
export function renderInlineMarkdown(markdown: string): string {
  if (!markdown.trim()) return "";
  return marked.parseInline(markdown) as string;
}
