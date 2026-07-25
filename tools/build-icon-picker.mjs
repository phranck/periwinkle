/**
 * Builds the standalone icon-picker tool.
 *
 * The page itself lives in `icon-picker.template.html` as ordinary HTML, CSS
 * and JavaScript. This script only injects data into it: the whole Iconsax set
 * and the shipped mapping are inlined, so the result works when opened
 * straight from disk with no server and no network.
 *
 * Keeping the page in its own file is deliberate. It used to be a JavaScript
 * template literal in here, where every backtick, dollar-brace and quote in
 * the markup was an escaping trap that repeatedly broke the generated script.
 * A plain file has none of those hazards, and editors can check it.
 *
 *   node tools/build-icon-picker.mjs
 *
 * Regenerate the icon data first with `node tools/extract-icons.mjs` when the
 * iconsax-react dependency changes.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const toolsDir = fileURLToPath(new URL(".", import.meta.url));
const templatePath = `${toolsDir}icon-picker.template.html`;
const iconsPath = `${toolsDir}iconsax-bulk.json`;
const mappingPath = `${toolsDir}../src/render/section-icons.json`;
const outPath = `${toolsDir}icon-picker.html`;

const icons = JSON.parse(readFileSync(iconsPath, "utf8"));
const mapping = JSON.parse(readFileSync(mappingPath, "utf8"));

/**
 * Serializes a value for inlining inside a script block.
 *
 * @param value Any JSON-serializable value.
 * @returns JSON with `<` escaped, so a string in the data can never close the
 *   surrounding script element.
 */
function embed(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

const replacements = {
  __ICONS_JSON__: embed(icons),
  __DEFAULTS_JSON__: embed(mapping),
  __ICON_COUNT__: String(icons.length),
};

let html = readFileSync(templatePath, "utf8");
for (const [placeholder, value] of Object.entries(replacements)) {
  if (!html.includes(placeholder)) {
    throw new Error(`Template is missing the ${placeholder} placeholder.`);
  }
  html = html.replaceAll(placeholder, value);
}

writeFileSync(outPath, html);
process.stdout.write(`Wrote ${outPath} (${(html.length / 1024).toFixed(0)} KB)\n`);
