import { describe, it, expect } from "vitest";

describe("APP_BASE_URL", () => {
  it("should be set to the production domain", () => {
    const url = process.env.APP_BASE_URL;
    expect(url).toBeDefined();
    expect(url).toContain("finico-pilot-mqskutaj.manus.space");
  });
});
