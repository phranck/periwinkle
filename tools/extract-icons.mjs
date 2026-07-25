/**
 * Extracts every Iconsax icon in the Bulk and TwoTone variants into `iconsax-bulk.json`.
 *
 * The icon picker needs the raw SVG markup of the whole set so it can render
 * previews offline. Rendering each icon through React is the reliable way to
 * get it: the package ships React components, not plain SVG files, and the
 * Bulk variant is one of several branches inside each component.
 *
 * Run after upgrading iconsax-react, then rebuild the picker:
 *
 *   node tools/extract-icons.mjs
 *   node tools/build-icon-picker.mjs
 */

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import * as Iconsax from "iconsax-react";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const outPath = fileURLToPath(new URL("./iconsax-bulk.json", import.meta.url));
const icons = [];

/** Renders one icon variant and returns its inner SVG markup. */
function renderVariant(Component, variant) {
  try {
    const markup = renderToStaticMarkup(
      createElement(Component, { variant, color: "currentColor" }),
    );
    const inner = markup.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
    return inner.includes("<path") ? inner : undefined;
  } catch {
    // Non-icon exports fail to render; they are simply not icons.
    return undefined;
  }
}

for (const [name, Component] of Object.entries(Iconsax)) {
  // Icons are forwardRef objects, not plain functions, so both kinds pass.
  const kind = typeof Component;
  if (Component === null || (kind !== "function" && kind !== "object")) continue;
  const bulk = renderVariant(Component, "Bulk");
  if (!bulk) continue;
  const twoTone = renderVariant(Component, "TwoTone");
  icons.push({ name, bulk, ...(twoTone ? { twoTone } : {}) });
}

icons.sort((a, b) => a.name.localeCompare(b.name));
writeFileSync(outPath, JSON.stringify(icons));
process.stdout.write(`Extracted ${icons.length} Bulk icons to ${outPath}\n`);
