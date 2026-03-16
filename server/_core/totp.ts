import { TOTP, Secret } from "otpauth";
import QRCode from "qrcode";

const ISSUER = "F&I Co-Pilot";
const PERIOD = 30; // seconds
const DIGITS = 6;
const ALGORITHM = "SHA1";

/**
 * Generate a new random TOTP secret (base32-encoded string).
 */
export function generateTotpSecret(): string {
  const secret = new Secret({ size: 20 });
  return secret.base32;
}

/**
 * Build a TOTP URI and render it as a data-URI PNG QR code.
 */
export async function generateQrCodeDataUri(
  base32Secret: string,
  accountName: string
): Promise<string> {
  const totp = new TOTP({
    issuer: ISSUER,
    label: accountName,
    algorithm: ALGORITHM,
    digits: DIGITS,
    period: PERIOD,
    secret: Secret.fromBase32(base32Secret),
  });
  const uri = totp.toString(); // otpauth://totp/...
  return QRCode.toDataURL(uri);
}

/**
 * Verify a 6-digit TOTP code against a base32 secret.
 * Allows ±1 window (i.e. previous, current, next period).
 */
export function verifyTotpCode(base32Secret: string, code: string): boolean {
  const totp = new TOTP({
    issuer: ISSUER,
    algorithm: ALGORITHM,
    digits: DIGITS,
    period: PERIOD,
    secret: Secret.fromBase32(base32Secret),
  });
  // delta returns null on failure, or the time-step offset on success
  const delta = totp.validate({ token: code, window: 1 });
  return delta !== null;
}
