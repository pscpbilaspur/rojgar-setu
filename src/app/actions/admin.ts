"use server";

import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { approvers, reports, jobs, auditLogs, users, jobSeekerProfiles, jobGiverProfiles, verificationRequests } from "@/db/schema";
import { requireAdmin } from "@/lib/dal";

const approverSchema = z.object({
  name: z.string().trim().min(2),
  mobile: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number."),
  districtId: z.coerce.number().int().positive(),
});

export type CreateApproverResult = { error: string } | { success: true };

export async function createApproverAction(input: z.infer<typeof approverSchema>): Promise<CreateApproverResult> {
  const admin = await requireAdmin();
  const parsed = approverSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const existing = await db.query.approvers.findFirst({ where: eq(approvers.mobile, parsed.data.mobile) });
  if (existing) return { error: "An Approver with this mobile number already exists." };

  const [created] = await db.insert(approvers).values(parsed.data).returning();

  await db.insert(auditLogs).values({
    actorType: "admin",
    actorId: admin.adminId,
    action: "approver_created",
    targetType: "approver",
    targetId: created.id,
    before: null,
    after: { name: created.name, mobile: created.mobile, districtId: created.districtId },
  });

  revalidatePath("/admin/approvers");
  return { success: true };
}

export async function toggleApproverStatusAction(approverId: number) {
  const admin = await requireAdmin();
  const approver = await db.query.approvers.findFirst({ where: eq(approvers.id, approverId) });
  if (!approver) throw new Error("Approver not found.");

  const nextStatus = approver.status === "active" ? "inactive" : "active";
  await db.update(approvers).set({ status: nextStatus }).where(eq(approvers.id, approverId));

  await db.insert(auditLogs).values({
    actorType: "admin",
    actorId: admin.adminId,
    action: "approver_status_changed",
    targetType: "approver",
    targetId: approverId,
    before: { status: approver.status },
    after: { status: nextStatus },
  });

  revalidatePath("/admin/approvers");
}

export async function toggleUserStatusAction(userId: number) {
  const admin = await requireAdmin();
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) throw new Error("User not found.");

  const nextStatus = user.status === "active" ? "suspended" : "active";
  await db.update(users).set({ status: nextStatus }).where(eq(users.id, userId));

  await db.insert(auditLogs).values({
    actorType: "admin",
    actorId: admin.adminId,
    action: "user_status_changed",
    targetType: "user",
    targetId: userId,
    before: { status: user.status },
    after: { status: nextStatus },
  });

  revalidatePath("/admin/users");
}

export async function setJobModerationAction(jobId: number, state: "approved" | "flagged" | "removed") {
  const admin = await requireAdmin();
  const job = await db.query.jobs.findFirst({ where: eq(jobs.id, jobId) });
  if (!job) throw new Error("Job not found.");

  await db.update(jobs).set({ moderationState: state }).where(eq(jobs.id, jobId));

  await db.insert(auditLogs).values({
    actorType: "admin",
    actorId: admin.adminId,
    action: "job_moderation_changed",
    targetType: "job",
    targetId: jobId,
    before: { moderationState: job.moderationState },
    after: { moderationState: state },
  });

  revalidatePath("/admin/moderation");
}

/** Central Admin can directly set a profile's Basic Verification status —
 * a manual override alongside the normal Approver flow. This matters most
 * right now while many districts have no Approver assigned yet (Section
 * 4.2: "not yet done" is the correct resting state, but Admin still needs a
 * way to manually confirm someone when there's no one else to do it). Never
 * exposed as a public "Verified" badge (Section 5) — this only changes the
 * same internal status an Approver's decision would have set. */
export async function setProfileVerificationAction(
  profileType: "seeker" | "giver",
  profileId: number,
  status: "confirmed" | "unable_to_confirm" | "not_yet_done"
) {
  const admin = await requireAdmin();
  const table = profileType === "seeker" ? jobSeekerProfiles : jobGiverProfiles;

  const profile =
    profileType === "seeker"
      ? await db.query.jobSeekerProfiles.findFirst({ where: eq(jobSeekerProfiles.id, profileId) })
      : await db.query.jobGiverProfiles.findFirst({ where: eq(jobGiverProfiles.id, profileId) });
  if (!profile) throw new Error("Profile not found.");

  await db.update(table).set({ verificationStatus: status, updatedAt: new Date() }).where(eq(table.id, profileId));

  // Close out any still-pending Approver request for this profile so it
  // doesn't sit stale in an Approver's queue after Admin has already
  // decided (same "one decision is enough" rule as Section 4.2).
  await db
    .update(verificationRequests)
    .set({ status: status === "confirmed" ? "confirmed" : status === "unable_to_confirm" ? "unable_to_confirm" : "pending" })
    .where(
      and(
        eq(verificationRequests.profileType, profileType),
        eq(verificationRequests.profileId, profileId),
        eq(verificationRequests.status, "pending")
      )
    );

  await db.insert(auditLogs).values({
    actorType: "admin",
    actorId: admin.adminId,
    action: "profile_verification_changed",
    targetType: profileType === "seeker" ? "job_seeker_profile" : "job_giver_profile",
    targetId: profileId,
    before: { verificationStatus: profile.verificationStatus },
    after: { verificationStatus: status },
  });

  revalidatePath("/admin/users");
}

export async function setReportStatusAction(reportId: number, status: "reviewed" | "dismissed") {
  const admin = await requireAdmin();
  const report = await db.query.reports.findFirst({ where: eq(reports.id, reportId) });
  if (!report) throw new Error("Report not found.");

  await db.update(reports).set({ status }).where(eq(reports.id, reportId));

  await db.insert(auditLogs).values({
    actorType: "admin",
    actorId: admin.adminId,
    action: "report_status_changed",
    targetType: "report",
    targetId: reportId,
    before: { status: report.status },
    after: { status },
  });

  revalidatePath("/admin/reports");
}
