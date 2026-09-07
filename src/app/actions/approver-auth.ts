"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { db } from "@/db";
import { requestOtp, verifyOtp, OtpError } from "@/lib/otp";
import { createSession, destroySession } from "@/lib/session";

const mobileSchema = z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number.");

async function clientIp(): Promise<string | null> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return h.get("x-real-ip");
}

export type ApproverOtpRequestResult = { error?: string } | undefined;

export async function requestApproverOtpAction(
  _prev: ApproverOtpRequestResult,
  formData: FormData
): Promise<ApproverOtpRequestResult> {
  const parsed = mobileSchema.safeParse(formData.get("mobile"));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const approver = await db.query.approvers.findFirst({
    where: (a, { eq }) => eq(a.mobile, parsed.data),
  });
  // Same generic behavior whether or not the number is a registered
  // Approver — don't leak which mobiles are Approvers via timing/response.
  if (approver && approver.status === "active") {
    try {
      const ip = await clientIp();
      await requestOtp(parsed.data, "approver_login", ip);
    } catch (err) {
      if (err instanceof OtpError) return { error: err.message };
      console.error(err);
      return { error: "Something went wrong. Please try again." };
    }
  }
  return undefined;
}

export type ApproverVerifyResult = { error: string } | { success: true };

export async function verifyApproverOtpAction(
  mobile: string,
  code: string
): Promise<ApproverVerifyResult> {
  const parsedMobile = mobileSchema.safeParse(mobile);
  if (!parsedMobile.success) return { error: "Invalid mobile number." };

  const approver = await db.query.approvers.findFirst({
    where: (a, { eq }) => eq(a.mobile, parsedMobile.data),
  });
  if (!approver || approver.status !== "active") {
    return { error: "This number is not registered as an Approver." };
  }

  try {
    await verifyOtp(parsedMobile.data, "approver_login", code);
  } catch (err) {
    if (err instanceof OtpError) return { error: err.message };
    console.error(err);
    return { error: "Something went wrong. Please try again." };
  }

  await createSession({
    kind: "approver",
    approverId: approver.id,
    districtId: approver.districtId,
  });
  return { success: true };
}

export async function approverLogoutAction() {
  await destroySession();
}
