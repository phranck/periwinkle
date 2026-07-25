/**
 * Section icon resolution.
 *
 * Endpoint groups take their sidebar icon from the tag name, so a freshly
 * generated reference does not show the same mark on every group. The
 * mapping lives in `section-icons.json` and is edited with the picker in
 * `tools/icon-picker.html`; anything without a match keeps the neutral
 * default icon.
 */

import mapping from "./section-icons.json";

const ICONS: Record<string, string> = mapping.icons;

/** Reference used for titles the mapping does not cover. */
export const DEFAULT_SECTION_ICON = mapping.default;

/**
 * One resolved section icon.
 *
 * @property name The Iconsax icon name.
 * @property variant The icon style to render it in.
 */
export interface SectionIcon {
  name: string;
  variant: "Bulk" | "TwoTone";
}

/**
 * Splits a mapping value into icon name and style. Values are plain names for
 * the default Bulk style (`"Shop"`) and carry a suffix otherwise
 * (`"Shop:TwoTone"`), so the common case stays terse.
 */
function parseReference(reference: string): SectionIcon {
  const [name, variant] = reference.split(":");
  return { name: name ?? reference, variant: variant === "TwoTone" ? "TwoTone" : "Bulk" };
}

/**
 * Normalizes a title for lookup: case and surrounding whitespace are
 * irrelevant, inner runs of whitespace collapse, and separators like `_`,
 * `-` or `/` read as spaces, so `Rate_Limits` and `Rate limits` match the
 * same entry.
 */
function normalize(title: string): string {
  return title
    .toLowerCase()
    .replace(/[_\-/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Resolves the Iconsax icon name for one section title.
 *
 * Lookup order: the normalized title, then its singular form, then its
 * plural form. API tags appear in both numbers in the wild (`Shop` vs
 * `Shops`), and maintaining every entry twice in the mapping would be
 * needless duplication.
 *
 * @param title The section title, typically an OpenAPI tag name.
 * @returns The resolved {@link SectionIcon}; falls back to the mapping's
 *   default when the title is not covered.
 */
export function sectionIcon(title: string): SectionIcon {
  const key = normalize(title);
  if (!key) return parseReference(DEFAULT_SECTION_ICON);

  const singular = key.endsWith("s") ? key.slice(0, -1) : undefined;
  const plural = key.endsWith("s") ? undefined : `${key}s`;

  return parseReference(
    ICONS[key] ??
      (singular ? ICONS[singular] : undefined) ??
      (plural ? ICONS[plural] : undefined) ??
      DEFAULT_SECTION_ICON,
  );
}
