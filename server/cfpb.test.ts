import { describe, expect, it, beforeAll } from "vitest";
import { randomBytes } from "crypto";

// Set up a test encryption key before importing the module
const TEST_KEY = randomBytes(32).toString("hex");
process.env.ENCRYPTION_KEY = TEST_KEY;

// Must import AFTER setting the env var
import { encrypt, decrypt, encryptFields, decryptFields, decryptRows } from "./_core/encryption";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Encryption Module Tests ────────────────────────────────────────────────

describe("encryption module", () => {
  it("encrypts and decrypts a string round-trip", () => {
    const plaintext = "John Doe";
    const encrypted = encrypt(plaintext);

    expect(encrypted).not.toBeNull();
    expect(encrypted).not.toBe(plaintext);
    expect(encrypted!.startsWith("enc:v1:")).toBe(true);

    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it("handles null and undefined gracefully", () => {
    expect(encrypt(null)).toBeNull();
    expect(encrypt(undefined)).toBeNull();
    expect(decrypt(null)).toBeNull();
    expect(decrypt(undefined)).toBeNull();
  });

  it("passes through plaintext (non-encrypted) values on decrypt", () => {
    const plaintext = "Some unencrypted value";
    expect(decrypt(plaintext)).toBe(plaintext);
  });

  it("encrypts different values to different ciphertexts (random IV)", () => {
    const a = encrypt("test");
    const b = encrypt("test");
    // Same plaintext should produce different ciphertexts due to random IV
    expect(a).not.toBe(b);
  });

  it("encryptFields encrypts specified fields only", () => {
    const obj = { customerName: "Jane Smith", dealNumber: "D-12345", status: "active" };
    const encrypted = encryptFields(obj, ["customerName"]);

    expect(encrypted.customerName).not.toBe("Jane Smith");
    expect((encrypted.customerName as string).startsWith("enc:v1:")).toBe(true);
    expect(encrypted.dealNumber).toBe("D-12345"); // untouched
    expect(encrypted.status).toBe("active"); // untouched
  });

  it("decryptFields decrypts specified fields only", () => {
    const obj = { customerName: "Jane Smith", dealNumber: "D-12345" };
    const encrypted = encryptFields(obj, ["customerName"]);
    const decrypted = decryptFields(encrypted, ["customerName"]);

    expect(decrypted.customerName).toBe("Jane Smith");
    expect(decrypted.dealNumber).toBe("D-12345");
  });

  it("decryptRows decrypts an array of rows", () => {
    const rows = [
      { text: "Hello", id: 1 },
      { text: "World", id: 2 },
    ];
    const encryptedRows = rows.map((r) => encryptFields(r, ["text"]));
    const decryptedRows = decryptRows(encryptedRows, ["text"]);

    expect(decryptedRows[0].text).toBe("Hello");
    expect(decryptedRows[1].text).toBe("World");
    expect(decryptedRows[0].id).toBe(1);
  });

  it("handles empty strings", () => {
    const encrypted = encrypt("");
    expect(encrypted).not.toBeNull();
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe("");
  });

  it("handles unicode and special characters", () => {
    const text = "José García — $5,000 (F&I) 🚗";
    const encrypted = encrypt(text);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(text);
  });
});

// ─── Consent Enforcement Tests ──────────────────────────────────────────────

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(overrides?: Partial<AuthenticatedUser>): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("sessions.create consent enforcement", () => {
  it("rejects session creation without consent (consentObtained: false)", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // z.literal(true) should reject false
    await expect(
      caller.sessions.create({
        customerName: "Test Customer",
        dealNumber: "D-001",
        vehicleType: "new",
        dealType: "retail_finance",
        consentObtained: false as any,
        consentMethod: "verbal",
      })
    ).rejects.toThrow();
  });

  it("rejects session creation without consentMethod", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.sessions.create({
        customerName: "Test Customer",
        dealNumber: "D-001",
        vehicleType: "new",
        dealType: "retail_finance",
        consentObtained: true,
        consentMethod: undefined as any,
      })
    ).rejects.toThrow();
  });

  it("rejects invalid consent method", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.sessions.create({
        customerName: "Test Customer",
        dealNumber: "D-001",
        vehicleType: "new",
        dealType: "retail_finance",
        consentObtained: true,
        consentMethod: "telepathy" as any,
      })
    ).rejects.toThrow();
  });
});
