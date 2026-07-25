import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { transformSync } from "esbuild";
import { describe, expect, it } from "vitest";

const toolsDir = fileURLToPath(new URL("../tools/", import.meta.url));
const html = readFileSync(`${toolsDir}icon-picker.html`, "utf8");
const template = readFileSync(`${toolsDir}icon-picker.template.html`, "utf8");

describe("icon picker", () => {
  it("emits a script that actually parses", () => {
    // The page used to be built from a JavaScript template literal, where a
    // stray backtick or quote in the markup produced a syntactically broken
    // script that only surfaced in the browser. esbuild parses the result
    // without running it, so that class of bug fails the suite instead.
    const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
    expect(script).toBeTruthy();
    expect(() => transformSync(script as string, { loader: "js" })).not.toThrow();
  });

  it("leaves no placeholder unfilled", () => {
    expect(html).not.toMatch(/__[A-Z_]+__/);
  });

  it("inlines the icon set and the mapping", () => {
    expect(html).toContain("const ICONS =");
    expect(html).toContain("const DEFAULTS =");
    // A known icon and a known title prove real data landed in the page.
    expect(html).toContain('"Shop"');
    expect(html).toContain('"shops"');
  });

  it("keeps the data placeholders in the template", () => {
    for (const placeholder of ["__ICONS_JSON__", "__DEFAULTS_JSON__", "__ICON_COUNT__"]) {
      expect(template).toContain(placeholder);
    }
  });
});
