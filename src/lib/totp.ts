import "server-only";
import * as OTPAuth from "otpauth";
import QRCode from "qrcode";

const ISSUER = "Central Panchayat Rojgar Setu";

export function generateTotpSecret(): string {
  return new OTPAuth.Secret({ size: 20 }).base32;
}

export function totpUri(username: string, base32Secret: string): string {
  const totp = new OTPAuth.TOTP({
    issuer: ISSUER,
    label: username,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(base32Secret),
  });
  return totp.toString();
}

export async function totpQrCodeDataUri(uri: string): Promise<string> {
  return QRCode.toDataURL(uri, { width: 220, margin: 1 });
}

export function verifyTotp(base32Secret: string, token: string): boolean {
  const totp = new OTPAuth.TOTP({
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(base32Secret),
  });
  // Allow +/-1 step (30s) of clock drift.
  const delta = totp.validate({ token, window: 1 });
  return delta !== null;
}
