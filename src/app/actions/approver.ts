"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  verificationRequests,
  verificationNotes,
  jobSeekerProfiles,
  jobGiverProfiles,
  auditLogs,
} from "@/db/schema";
import { requireApprover } from "@/lib/dal";
import { notify } from "@/lib/notify";
import { revalidatePath } from "next/cache";

async function applyDecision(
  requestId: number,
  decision: "confirmed" | "unable_to_confirm",
  note: string
) {
  const approverSession = await requireApprover();

  const request = await db.query.verificationRequests.findFirst({
    where: eq(verificationRequests.id, requestId),
  });
  if (!request) throw new Error("Verification request not found.");
  if (request.approverId !== approverSession.approverId) {
    // Server-side ownership check — never trust the client (Section 7).
    throw new Error("You are not the assigned Approver for this request.");
  }

  const before = { status: request.status };

  await db
    .update(verificationRequests)
    .set({ status: decision, updatedAt: new Date() })
    .where(eq(verificationRequests.id, requestId));

  const profileTable = request.profileType === "seeker" ? jobSeekerProfiles : jobGiverProfiles;
  const [updatedProfile] = await db
    .update(profileTable)
    .set({ verificationStatus: decision })
    .where(eq(profileTable.id, request.profileId))
    .returning();

  if (updatedProfile) {
    await notify(
      updatedProfile.userId,
      decision === "confirmed" ? "verification_confirmed" : "verification_unable_to_confirm",
      decision === "confirmed"
        ? "Your Basic Verification is now confirmed."
        : "Your Approver was unable to confirm your Basic Verification. You can reach out to them for details."
    );
  }

  if (note.trim()) {
    await db.insert(verificationNotes).values({
      verificationRequestId: requestId,
      approverId: approverSession.approverId,
      note: note.trim(),
    });
  }

  await db.insert(auditLogs).values({
    actorType: "approver",
    actorId: approverSession.approverId,
    action: `verification_${decision}`,
    targetType: request.profileType === "seeker" ? "job_seeker_profile" : "job_giver_profile",
    targetId: request.profileId,
    before,
    after: { status: decision },
  });

  revalidatePath("/approver/dashboard");
}

export async function confirmVerificationAction(requestId: number, note: string) {
  await applyDecision(requestId, "confirmed", note);
}

export async function markUnableToConfirmAction(requestId: number, note: string) {
  await applyDecision(requestId, "unable_to_confirm", note);
}
