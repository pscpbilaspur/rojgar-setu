"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  jobSeekerProfiles,
  seekerLocationPreferences,
  verificationRequests,
} from "@/db/schema";
import { requireUser } from "@/lib/dal";

const seekerSchema = z.object({
  name: z.string().trim().min(2),
  fatherName: z.string().trim().min(2),
  hometownDistrictId: z.coerce.number().int().positive(),
  qualificationId: z.coerce.number().int().positive().optional(),
  qualificationOther: z.string().trim().max(150).optional(),
  skillsText: z.string().trim().max(500).optional(),
  additionalNote: z.string().trim().max(1000).optional(),
  experience: z.string().trim().max(2000).optional(),
  expectedSalary: z.string().trim().max(60).optional(),
  jobType: z.enum(["full_time", "part_time", "wfh"]),
  preferredLocationIds: z.array(z.coerce.number().int().positive()).min(1),
  // Optional — Section 4.2: Approver selection is always optional and
  // skippable, and must never block account creation, including when a
  // district has no Approver assigned yet at all.
  approverId: z.coerce.number().int().positive().optional(),
  contactSharePolicy: z.enum(["never", "on_application", "always"]),
});

export type SeekerFormInput = z.infer<typeof seekerSchema>;

export type SeekerSubmitResult = { error: string } | { success: true };

export async function createSeekerProfileAction(
  input: SeekerFormInput
): Promise<SeekerSubmitResult> {
  const { user, seekerProfile, giverProfile } = await requireUser();
  if (seekerProfile) {
    return { error: "You already have a Job Seeker profile." };
  }
  // One role per account — an account already registered as a Job Giver
  // can't also become a Job Seeker. Never trust the client for this: the
  // onboarding page already explains and blocks this before the form is
  // even shown, but the check has to hold here too.
  if (giverProfile) {
    return {
      error:
        "This account is already registered as a Job Giver. An account can only be a Job Seeker or a Job Giver, not both.",
    };
  }

  const parsed = seekerSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const data = parsed.data;

  await db.transaction(async (tx) => {
    const [profile] = await tx
      .insert(jobSeekerProfiles)
      .values({
        userId: user.id,
        name: data.name,
        fatherName: data.fatherName,
        hometownDistrictId: data.hometownDistrictId,
        qualificationId: data.qualificationId,
        qualificationOther: data.qualificationOther,
        skillsText: data.skillsText,
        additionalNote: data.additionalNote,
        experience: data.experience,
        expectedSalary: data.expectedSalary,
        jobType: data.jobType,
        approverId: data.approverId,
        // No Approver picked (skipped, or none exists in this district yet)
        // -> stays "not_yet_done", never left on the default "pending" which
        // would misleadingly imply someone is actually working on it.
        verificationStatus: data.approverId ? "pending" : "not_yet_done",
        contactSharePolicy: data.contactSharePolicy,
      })
      .returning();

    await tx.insert(seekerLocationPreferences).values(
      data.preferredLocationIds.map((locationId) => ({
        seekerId: profile.id,
        locationId,
      }))
    );

    if (data.approverId) {
      await tx.insert(verificationRequests).values({
        profileType: "seeker",
        profileId: profile.id,
        approverId: data.approverId,
        status: "pending",
      });
    }
  });

  redirect("/dashboard");
}

const editSeekerSchema = z.object({
  name: z.string().trim().min(2),
  fatherName: z.string().trim().min(2),
  hometownDistrictId: z.coerce.number().int().positive(),
  qualificationId: z.coerce.number().int().positive().optional(),
  qualificationOther: z.string().trim().max(150).optional(),
  skillsText: z.string().trim().max(500).optional(),
  additionalNote: z.string().trim().max(1000).optional(),
  experience: z.string().trim().max(2000).optional(),
  expectedSalary: z.string().trim().max(60).optional(),
  jobType: z.enum(["full_time", "part_time", "wfh"]),
  preferredLocationIds: z.array(z.coerce.number().int().positive()).min(1),
});
export type EditSeekerInput = z.infer<typeof editSeekerSchema>;

/** Updates an existing Job Seeker profile's editable fields. Deliberately
 * leaves approverId and verification status untouched — changing your
 * profile details doesn't reopen or reset an already-decided Basic
 * Verification, and re-assigning an Approver is a separate, deliberate
 * action, not a side effect of an edit. */
export async function updateSeekerProfileAction(input: EditSeekerInput): Promise<SeekerSubmitResult> {
  const { seekerProfile } = await requireUser();
  if (!seekerProfile) return { error: "No Job Seeker profile to update." };

  const parsed = editSeekerSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const data = parsed.data;

  await db.transaction(async (tx) => {
    await tx
      .update(jobSeekerProfiles)
      .set({
        name: data.name,
        fatherName: data.fatherName,
        hometownDistrictId: data.hometownDistrictId,
        qualificationId: data.qualificationId,
        qualificationOther: data.qualificationOther,
        skillsText: data.skillsText,
        additionalNote: data.additionalNote,
        experience: data.experience,
        expectedSalary: data.expectedSalary,
        jobType: data.jobType,
        updatedAt: new Date(),
      })
      .where(eq(jobSeekerProfiles.id, seekerProfile.id));

    await tx.delete(seekerLocationPreferences).where(eq(seekerLocationPreferences.seekerId, seekerProfile.id));
    await tx.insert(seekerLocationPreferences).values(
      data.preferredLocationIds.map((locationId) => ({ seekerId: seekerProfile.id, locationId }))
    );
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profile");
  return { success: true };
}
