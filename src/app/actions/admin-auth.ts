"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { adminAccounts } from "@/db/schema";
import { createSession, destroySession } from "@/lib/session";
import {
  generateTotpSecret,
  totpUri,
  totpQrCodeDataUri,
  verifyTotp,
} from "@/lib/totp";

// Section 4.1: "Central Admin does NOT use mobile OTP — password + a second
// factor (authenticator app)". This is a two-step flow: password first, then
// either TOTP verification (already enrolled) or one-time enrollment
// (first login) before a session is created.

export type PasswordStepResult =
  | { error: string }
  | { stage: "enroll"; username: string; secret: string; qrDataUri: string }
  | { stage: "totp"; username: string };

export async function adminPasswordAction(
  username: string,
  password: string
): Promise<PasswordStepResult> {
  const admin = await db.query.adminAccounts.findFirst({
    where: eq(adminAccounts.username, username),
  });

  // Same generic error whether the username exists or the password is
  // wrong — don't leak which one failed.
  const genericError = "Incorrect username or password.";

  if (!admin || admin.status !== "active") {
    return { error: genericError };
  }
  const passwordOk = await bcrypt.compare(password, admin.passwordHash);
  if (!passwordOk) {
    return { error: genericError };
  }

  if (!admin.totpSecret) {
    const secret = generateTotpSecret();
    const uri = totpUri(admin.username, secret);
    const qrDataUri = await totpQrCodeDataUri(uri);
    return { stage: "enroll", username: admin.username, secret, qrDataUri };
  }

  return { stage: "totp", username: admin.username };
}

export type TotpStepResult = { error: string } | { success: true };

/** First-login enrollment: confirm the authenticator app produces a valid
 * code for `secret`, then persist it and start the session. */
export async function adminEnrollTotpAction(
  username: string,
  secret: string,
  code: string
): Promise<TotpStepResult> {
  if (!verifyTotp(secret, code)) {
    return { error: "Incorrect code. Check your authenticator app and try again." };
  }
  const admin = await db.query.adminAccounts.findFirst({
    where: eq(adminAccounts.username, username),
  });
  if (!admin) return { error: "Account not found." };
  if (admin.totpSecret) {
    // Already enrolled by a concurrent request — don't overwrite silently.
    return { error: "Two-factor authentication is already set up for this account." };
  }

  await db
    .update(adminAccounts)
    .set({ totpSecret: secret })
    .where(eq(adminAccounts.id, admin.id));

  await createSession({ kind: "admin", adminId: admin.id, username: admin.username });
  return { success: true };
}

/** Ordinary login (already enrolled): just verify the stored secret. */
export async function adminVerifyTotpAction(
  username: string,
  code: string
): Promise<TotpStepResult> {
  const admin = await db.query.adminAccounts.findFirst({
    where: eq(adminAccounts.username, username),
  });
  if (!admin || !admin.totpSecret) {
    return { error: "Account not found or not enrolled." };
  }
  if (!verifyTotp(admin.totpSecret, code)) {
    return { error: "Incorrect code." };
  }

  await createSession({ kind: "admin", adminId: admin.id, username: admin.username });
  return { success: true };
}

export async function adminLogoutAction() {
  await destroySession();
}
