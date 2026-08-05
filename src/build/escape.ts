/**
 * Text escaping for the generated markup.
 *
 * Every value that reaches an attribute or an element body passes through
 * here, because a title, a description, or an alternative text is authored
 * content and may legitimately contain angle brackets, ampersands, or quotes.
 */

/**
 * Escapes a value for use in HTML text and in double-quoted attributes.
 *
 * @param value The raw text.
 * @returns The text with `&`, `<`, `>`, and `"` replaced by entities.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Escapes a value for use in XML text, as the sitemap needs.
 *
 * XML has no named entity for the apostrophe beyond `&apos;`, and unlike the
 * HTML escaper this one covers it, so the result is safe in single-quoted
 * attributes as well.
 *
 * @param value The raw text.
 * @returns The text with every XML metacharacter replaced by an entity.
 */
export function escapeXml(value: string): string {
  return escapeHtml(value).replace(/'/g, "&apos;");
}
