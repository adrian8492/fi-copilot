/**
 * AES-256-GCM field-level encryption for CFPB-sensitive data.
 *
 * Encrypted values stored as:
 *   "enc:v1:<base64(iv)>:<base64(authTag)>:<base64(ciphertext)>"
 *
 * The prefix lets decrypt() distinguish encrypted from plaintext values,
 * enabling gradual migration without breaking existing data.
 */
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const PREFIX = "enc:v1:";

let _encryptionKey: Buffer | null = null;

function getKey(): Buffer | null {
  if (_encryptionKey) return _encryptionKey;

  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex || keyHex.length !== 64) {
    return null; // Encryption disabled — no key configured
  }

  _encryptionKey = Buffer.from(keyHex, "hex");
  return _encryptionKey;
}

export function encrypt(plaintext: string | null | undefined): string | null {
  if (plaintext == null) return null;
  const key = getKey();
  if (!key) return plaintext; // No key → store as plaintext

  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${PREFIX}${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted.toString("base64")}`;
}

export function decrypt(ciphertext: string | null | undefined): string | null {
  if (ciphertext == null) return null;
  if (!ciphertext.startsWith(PREFIX)) return ciphertext; // Plaintext or legacy

  const key = getKey();
  if (!key) return ciphertext; // No key → can't decrypt, return as-is

  const parts = ciphertext.slice(PREFIX.length).split(":");
  if (parts.length !== 3) throw new Error("Invalid encrypted value format");

  const iv = Buffer.from(parts[0], "base64");
  const authTag = Buffer.from(parts[1], "base64");
  const encrypted = Buffer.from(parts[2], "base64");

  const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

  return decrypted.toString("utf8");
}

export function encryptFields<T extends Record<string, unknown>>(obj: T, fields: (keyof T)[]): T {
  const result = { ...obj };
  for (const field of fields) {
    const val = result[field];
    if (typeof val === "string" || val === null || val === undefined) {
      (result as Record<string, unknown>)[field as string] = encrypt(val as string | null);
    }
  }
  return result;
}

export function decryptFields<T extends Record<string, unknown>>(obj: T, fields: (keyof T)[]): T {
  if (!obj) return obj;
  const result = { ...obj };
  for (const field of fields) {
    const val = result[field];
    if (typeof val === "string" || val === null || val === undefined) {
      (result as Record<string, unknown>)[field as string] = decrypt(val as string | null);
    }
  }
  return result;
}

export function decryptRows<T extends Record<string, unknown>>(rows: T[], fields: (keyof T)[]): T[] {
  return rows.map((row) => decryptFields(row, fields));
}
