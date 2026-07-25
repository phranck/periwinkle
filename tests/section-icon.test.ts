import { describe, expect, it } from "vitest";

import { DEFAULT_SECTION_ICON, sectionIcon } from "../src/render/section-icon.js";
import mapping from "../src/render/section-icons.json";
import iconSet from "../tools/iconsax-bulk.json";

const KNOWN_ICONS = new Set(iconSet.map((entry) => entry.name));

describe("sectionIcon", () => {
  it("resolves a mapped title regardless of case and separators", () => {
    expect(sectionIcon("Shops").name).toBe("Shop");
    expect(sectionIcon("  shops  ").name).toBe("Shop");
    expect(sectionIcon("Rate_Limits").name).toBe("Timer1");
    expect(sectionIcon("rate-limits").name).toBe("Timer1");
  });

  it("matches the other grammatical number when only one is listed", () => {
    // "warehouse" is absent, so both numbers land on the default.
    expect(sectionIcon("Warehouses").name).toBe(DEFAULT_SECTION_ICON);
    // "invoice"/"invoices" share an icon, reached from either direction.
    expect(sectionIcon("Invoice").name).toBe(sectionIcon("Invoices").name);
  });

  it("keeps distinct marks where the icon set has a real plural", () => {
    expect(sectionIcon("User").name).toBe("Profile");
    expect(sectionIcon("Users").name).toBe("Profile2User");
    expect(sectionIcon("Message").name).toBe("Message");
    expect(sectionIcon("Messages").name).toBe("Messages");
  });

  it("falls back to the default for unknown and empty titles", () => {
    expect(sectionIcon("Totally unknown group").name).toBe(DEFAULT_SECTION_ICON);
    expect(sectionIcon("   ").name).toBe(DEFAULT_SECTION_ICON);
  });

  it("defaults to the Bulk style and reads an explicit variant suffix", () => {
    expect(sectionIcon("Shops").variant).toBe("Bulk");
    // The suffix form is what the picker writes for a TwoTone choice.
    const twoTone = Object.entries(mapping.icons).find(([, value]) =>
      String(value).endsWith(":TwoTone"),
    );
    if (twoTone) expect(sectionIcon(twoTone[0]).variant).toBe("TwoTone");
  });
});

describe("section-icons.json", () => {
  it("only references icons that exist in the icon set", () => {
    const iconName = (value: unknown): string => String(value).split(":")[0] ?? "";
    const unknown = Object.entries(mapping.icons)
      .map(([title, value]) => [title, iconName(value)] as const)
      .filter(([, icon]) => !KNOWN_ICONS.has(icon));
    expect(unknown).toEqual([]);
    expect(KNOWN_ICONS.has(iconName(mapping.default))).toBe(true);
  });

  it("stays alphabetically sorted so the picker and the file agree", () => {
    const keys = Object.keys(mapping.icons);
    expect(keys).toEqual([...keys].sort());
  });
});
