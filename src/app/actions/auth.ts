"use server";

import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requestOtp, verifyOtp, OtpError } from "@/lib/otp";
import { createSession, destroySession } from "@/lib/session";
import { z } from "zod";

const mobileSchema = z
  .string()
  .trim()
  .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number.");

async function clientIp(): Promise<string | null> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return h.get("x-real-ip");
}

export type ActionState = { error?: string } | undefined;

/** Step 1 of login/registration — every seeker/giver/approver flow starts
 * here (Section 4.1: mobile+OTP for all three). Purpose is always "login" —
 * whether the mobile is new or returning is resolved after OTP verification,
 * not before, so no information about which mobiles are registered leaks
 * from this step. */
export async function requestOtpAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = mobileSchema.safeParse(formData.get("mobile"));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid mobile number." };
  }
  try {
    const ip = await clientIp();
    await requestOtp(parsed.data, "login", ip);
    return undefined;
  } catch (err) {
    if (err instanceof OtpError) return { error: err.message };
    console.error(err);
    return { error: "Something went wrong. Please try again." };
  }
}

export type VerifyResult =
  | { error: string }
  | { success: true; needsOnboarding: boolean; hasSeeker: boolean; hasGiver: boolean };

/** Step 2 — verify the code, find-or-create the USER row, start a session. */
export async function verifyOtpAction(
  mobile: string,
  code: string
): Promise<VerifyResult> {
  const parsedMobile = mobileSchema.safeParse(mobile);
  if (!parsedMobile.success) {
    return { error: "Invalid mobile number." };
  }
  try {
    await verifyOtp(parsedMobile.data, "login", code);
  } catch (err) {
    if (err instanceof OtpError) return { error: err.message };
    console.error(err);
    return { error: "Something went wrong. Please try again." };
  }

  let user = await db.query.users.findFirst({
    where: eq(users.mobile, parsedMobile.data),
  });
  if (!user) {
    const [created] = await db
      .insert(users)
      .values({ mobile: parsedMobile.data })
      .returning();
    user = created;
  }

  await createSession({ kind: "user", userId: user.id, mobile: user.mobile });

  const [seekerProfile, giverProfile] = await Promise.all([
    db.query.jobSeekerProfiles.findFirst({
      where: (t, { eq }) => eq(t.userId, user!.id),
    }),
    db.query.jobGiverProfiles.findFirst({
      where: (t, { eq }) => eq(t.userId, user!.id),
    }),
  ]);

  return {
    success: true,
    needsOnboarding: !seekerProfile && !giverProfile,
    hasSeeker: !!seekerProfile,
    hasGiver: !!giverProfile,
  };
}

export async function logoutAction() {
  await destroySession();
}
