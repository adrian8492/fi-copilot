import { describe, expect, it } from "vitest";

/**
 * Validates Deepgram is ready to use:
 *   1. DEEPGRAM_API_KEY is set (deployment readiness check — runs only when
 *      the env var is loaded; vitest doesn't auto-load .env.local so this
 *      test SKIPS in unit-test runs and only runs against a real boxed env).
 *   2. The SDK can be instantiated (always runs, no live API call).
 *
 * Live transcription wiring is in server/websocket.ts (WebSocket path) and
 * server/http-stream.ts (HTTP-stream fallback for proxy-blocked clients);
 * both use createClient + listen.live with the nova-2 model.
 */
describe("Deepgram SDK integration", () => {
  it.skipIf(!process.env.DEEPGRAM_API_KEY)(
    "DEEPGRAM_API_KEY is set in environment",
    () => {
      const key = process.env.DEEPGRAM_API_KEY;
      expect(key).toBeDefined();
      expect(typeof key).toBe("string");
      expect((key as string).length).toBeGreaterThan(10);
    }
  );

  it("Deepgram SDK can be instantiated with the API key", async () => {
    const { createClient } = await import("@deepgram/sdk");
    const key = process.env.DEEPGRAM_API_KEY ?? "test-key";
    const deepgram = createClient(key);
    expect(deepgram).toBeDefined();
    expect(typeof deepgram.listen).toBe("object");
  });
});
