import "server-only";
import bcrypt from "bcryptjs";
import { and, desc, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { otpCodes } from "@/db/schema";
import { sendSms } from "@/lib/sms";

const OTP_LENGTH = 6;
const OTP_TTL_MINUTES = 5;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_REQUESTS_PER_MOBILE_PER_WINDOW = 5; // per 10 minutes
const MAX_REQUESTS_PER_IP_PER_WINDOW = 10; // per 10 minutes, catches one bad actor rotating numbers
const RATE_WINDOW_MINUTES = 10;
const MAX_VERIFY_ATTEMPTS = 5;

export type OtpPurpose = "register" | "login" | "mobile_change" | "approver_login";

export class OtpError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

function generateCode(): string {
  // Not Math.random() — this guards an auth flow.
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  const code = (buf[0] % 10 ** OTP_LENGTH).toString().padStart(OTP_LENGTH, "0");
  return code;
}

/** Request an OTP for `mobile`. Throws OtpError on cooldown/rate-limit. */
export async function requestOtp(
  mobile: string,
  purpose: OtpPurpose,
  ipAddress: string | null
) {
  const windowStart = new Date(Date.now() - RATE_WINDOW_MINUTES * 60 * 1000);

  const recentForMobile = await db
    .select()
    .from(otpCodes)
    .where(and(eq(otpCodes.mobile, mobile), gt(otpCodes.createdAt, windowStart)))
    .orderBy(desc(otpCodes.createdAt));

  if (recentForMobile.length > 0) {
    const last = recentForMobile[0];
    const secondsSinceLast = (Date.now() - last.createdAt.getTime()) / 1000;
    if (secondsSinceLast < RESEND_COOLDOWN_SECONDS) {
      throw new OtpError(
        "cooldown",
        `Please wait ${Math.ceil(RESEND_COOLDOWN_SECONDS - secondsSinceLast)}s before requesting another code.`
      );
    }
  }

  if (recentForMobile.length >= MAX_REQUESTS_PER_MOBILE_PER_WINDOW) {
    throw new OtpError(
      "rate_limited_mobile",
      "Too many code requests for this number. Please try again later."
    );
  }

  if (ipAddress) {
    const recentForIp = await db
      .select()
      .from(otpCodes)
      .where(
        and(eq(otpCodes.ipAddress, ipAddress), gt(otpCodes.createdAt, windowStart))
      );
    if (recentForIp.length >= MAX_REQUESTS_PER_IP_PER_WINDOW) {
      throw new OtpError(
        "rate_limited_ip",
        "Too many code requests from this device. Please try again later."
      );
    }
  }

  const code = generateCode();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  await db.insert(otpCodes).values({
    mobile,
    codeHash,
    purpose,
    ipAddress: ipAddress ?? undefined,
    expiresAt,
  });

  await sendSms(
    mobile,
    `${code} is your Central Panchayat Rojgar Setu verification code. Valid for ${OTP_TTL_MINUTES} minutes. Do not share this code.`
  );
}

/** Verify an OTP. Returns true on success. Throws OtpError otherwise. */
export async function verifyOtp(
  mobile: string,
  purpose: OtpPurpose,
  code: string
): Promise<void> {
  const [latest] = await db
    .select()
    .from(otpCodes)
    .where(and(eq(otpCodes.mobile, mobile), eq(otpCodes.purpose, purpose)))
    .orderBy(desc(otpCodes.createdAt))
    .limit(1);

  if (!latest) {
    throw new OtpError("not_found", "No code was requested for this number.");
  }
  if (latest.consumedAt) {
    throw new OtpError("already_used", "This code has already been used.");
  }
  if (latest.expiresAt.getTime() < Date.now()) {
    throw new OtpError("expired", "This code has expired. Request a new one.");
  }
  if (latest.attempts >= MAX_VERIFY_ATTEMPTS) {
    throw new OtpError(
      "too_many_attempts",
      "Too many incorrect attempts. Request a new code."
    );
  }

  const matches = await bcrypt.compare(code, latest.codeHash);
  if (!matches) {
    await db
      .update(otpCodes)
      .set({ attempts: latest.attempts + 1 })
      .where(eq(otpCodes.id, latest.id));
    throw new OtpError("incorrect", "Incorrect code.");
  }

  await db
    .update(otpCodes)
    .set({ consumedAt: new Date() })
    .where(eq(otpCodes.id, latest.id));
}
