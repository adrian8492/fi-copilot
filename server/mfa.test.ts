import { describe, it, expect } from "vitest";
import { generateTotpSecret, generateQrCodeDataUri, verifyTotpCode } from "./_core/totp";
import { TOTP, Secret } from "otpauth";

describe("TOTP Module", () => {
  it("generates a base32 secret of expected length", () => {
    const secret = generateTotpSecret();
    expect(secret).toBeTruthy();
    expect(secret.length).toBeGreaterThanOrEqual(16);
    // base32 characters only
    expect(/^[A-Z2-7]+=*$/.test(secret)).toBe(true);
  });

  it("generates a QR code data URI", async () => {
    const secret = generateTotpSecret();
    const dataUri = await generateQrCodeDataUri(secret, "test@example.com");
    expect(dataUri).toMatch(/^data:image\/png;base64,/);
  });

  it("verifies a valid TOTP code", () => {
    const secret = generateTotpSecret();
    // Generate a valid code using the same library
    const totp = new TOTP({
      issuer: "F&I Co-Pilot",
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: Secret.fromBase32(secret),
    });
    const validCode = totp.generate();
    expect(verifyTotpCode(secret, validCode)).toBe(true);
  });

  it("rejects an invalid TOTP code", () => {
    const secret = generateTotpSecret();
    expect(verifyTotpCode(secret, "000000")).toBe(false);
  });

  it("rejects a code that is too short", () => {
    const secret = generateTotpSecret();
    expect(verifyTotpCode(secret, "123")).toBe(false);
  });

  it("generates different secrets each time", () => {
    const s1 = generateTotpSecret();
    const s2 = generateTotpSecret();
    expect(s1).not.toBe(s2);
  });
});
