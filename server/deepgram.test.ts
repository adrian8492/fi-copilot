import { describe, expect, it } from "vitest";

/**
 * Validates that the DEEPGRAM_API_KEY environment variable is set and
 * the Deepgram SDK can be instantiated without throwing.
 * This is a lightweight credential check — it does not make a live API call.
 */
describe("Deepgram SDK integration", () => {
  it("DEEPGRAM_API_KEY is set in environment", () => {
    const key = process.env.DEEPGRAM_API_KEY;
    expect(key).toBeDefined();
    expect(typeof key).toBe("string");
    expect((key as string).length).toBeGreaterThan(10);
  });

  it("Deepgram SDK can be instantiated with the API key", async () => {
    const { createClient } = await import("@deepgram/sdk");
    const key = process.env.DEEPGRAM_API_KEY ?? "test-key";
    const deepgram = createClient(key);
    expect(deepgram).toBeDefined();
    expect(typeof deepgram.listen).toBe("object");
  });
});
