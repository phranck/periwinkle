import { describe, expect, it } from "vitest";

import { PACKAGE_NAME } from "../src/index.js";

describe("package entry point", () => {
  it("exposes the package identity", () => {
    expect(PACKAGE_NAME).toBe("periwinkle");
  });
});
