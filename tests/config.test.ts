import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  DEFAULT_DARK_COLORS,
  DEFAULT_FONTS,
  DEFAULT_LIGHT_COLORS,
  DEFAULT_RADIUS,
  resolveConfig,
} from "../src/config/config.js";
import { loadConfig } from "../src/config/load-config.js";
import { compileThemeCss, cssVariableName } from "../src/config/theme-css.js";

const fixturesDir = fileURLToPath(new URL("./fixtures/config/", import.meta.url));

describe("resolveConfig", () => {
  it("resolves pure defaults for an empty config", () => {
    const resolved = resolveConfig();
    expect(resolved.site.basePath).toBe("/");
    expect(resolved.theme.colors.light).toEqual(DEFAULT_LIGHT_COLORS);
    expect(resolved.theme.colors.dark).toEqual(DEFAULT_DARK_COLORS);
    expect(resolved.theme.fonts).toEqual(DEFAULT_FONTS);
    expect(resolved.theme.radius).toBe(DEFAULT_RADIUS);
    expect(resolved.customSections).toEqual([]);
    expect(resolved.footer.links).toEqual([]);
  });

  it("merges color overrides over the default palette", () => {
    const resolved = resolveConfig({ theme: { colors: { light: { accent: "#ff0000" } } } });
    expect(resolved.theme.colors.light.accent).toBe("#ff0000");
    expect(resolved.theme.colors.light.background).toBe(DEFAULT_LIGHT_COLORS.background);
    expect(resolved.theme.colors.dark).toEqual(DEFAULT_DARK_COLORS);
  });

  it("keeps guide section content and false switches", () => {
    const resolved = resolveConfig({ guide: { auth: "Auth text.", rateLimits: false } });
    expect(resolved.guide.auth).toBe("Auth text.");
    expect(resolved.guide.rateLimits).toBe(false);
    expect(resolved.guide.errors).toBeUndefined();
  });

  it("rejects unknown keys to catch typos", () => {
    expect(() => resolveConfig({ sitte: {} })).toThrow(/unknown key "sitte"/);
    expect(() => resolveConfig({ theme: { color: {} } })).toThrow(/unknown key "color"/);
    expect(() => resolveConfig({ theme: { colors: { light: { accnt: "#fff" } } } })).toThrow(
      /unknown key "accnt"/,
    );
  });

  it("rejects malformed values with clear messages", () => {
    expect(() => resolveConfig({ site: { basePath: "docs" } })).toThrow(/must start with "\/"/);
    expect(() => resolveConfig({ guide: { auth: 42 } })).toThrow(/guide\.auth/);
    expect(() => resolveConfig({ footer: { links: [{ label: "x" }] } })).toThrow(
      /footer\.links\[0\]\.href/,
    );
  });

  it("rejects duplicate custom section ids", () => {
    const section = { id: "a", title: "A", markdown: "..." };
    expect(() => resolveConfig({ customSections: [section, section] })).toThrow(/duplicate id "a"/);
  });
});

describe("compileThemeCss", () => {
  it("emits root and dark blocks with all tokens", () => {
    const css = compileThemeCss(resolveConfig().theme);
    expect(css).toContain(":root {");
    expect(css).toContain('[data-theme="dark"] {');
    expect(css).toContain(`--pw-background: ${DEFAULT_LIGHT_COLORS.background};`);
    expect(css).toContain(`--pw-method-get: ${DEFAULT_LIGHT_COLORS.methodGet};`);
    expect(css).toContain(`--pw-method-get: ${DEFAULT_DARK_COLORS.methodGet};`);
    expect(css).toContain(`--pw-font-mono: ${DEFAULT_FONTS.mono};`);
    expect(css).toContain(`--pw-radius: ${DEFAULT_RADIUS};`);
  });

  it("derives kebab-case variable names", () => {
    expect(cssVariableName("background")).toBe("--pw-background");
    expect(cssVariableName("methodDelete")).toBe("--pw-method-delete");
    expect(cssVariableName("statusSuccess")).toBe("--pw-status-success");
  });
});

describe("loadConfig", () => {
  it("loads and resolves a TypeScript config file", async () => {
    const { config, path } = await loadConfig("periwinkle.config.ts", fixturesDir);
    expect(path).toContain("periwinkle.config.ts");
    expect(config.site.basePath).toBe("/docs");
    expect(config.site.serverUrl).toBe("https://api.example.com");
    expect(config.theme.colors.light.accent).toBe("#123456");
    expect(config.theme.fonts.heading).toContain("Example Sans");
    expect(config.theme.fonts.stylesheets).toEqual(["/fonts/fonts.css"]);
    expect(config.guide.rateLimits).toBe(false);
    expect(config.customSections[0]?.id).toBe("sdks");
  });

  it("discovers the config file in the working directory", async () => {
    const { config, path } = await loadConfig(undefined, fixturesDir);
    expect(path).toContain("periwinkle.config.ts");
    expect(config.site.basePath).toBe("/docs");
  });

  it("falls back to defaults when no config file exists", async () => {
    const { config, path } = await loadConfig(
      undefined,
      fileURLToPath(new URL("./fixtures/", import.meta.url)),
    );
    expect(path).toBeUndefined();
    expect(config.site.basePath).toBe("/");
  });

  it("fails loudly for a missing explicit path", async () => {
    await expect(loadConfig("missing.config.ts", fixturesDir)).rejects.toThrow(
      /config not found: missing\.config\.ts/,
    );
  });
});
