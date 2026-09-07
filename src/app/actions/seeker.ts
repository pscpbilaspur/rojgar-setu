"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  jobSeekerProfiles,
  seekerLocationPreferences,
  jobSeekerSkills,
  verificationRequests,
} from "@/db/schema";
import { requireUser } from "@/lib/dal";

const seekerSchema = z.object({
  name: z.string().trim().min(2),
  fatherName: z.string().trim().min(2),
  hometownDistrictId: z.coerce.number().int().positive(),
  qualificationId: z.coerce.number().int().positive().optional(),
  qualificationOther: z.string().trim().max(150).optional(),
  skillIds: z.array(z.coerce.number().int().positive()).default([]),
  experience: z.string().trim().max(2000).optional(),
  expectedSalary: z.string().trim().max(60).optional(),
  jobType: z.enum(["full_time", "part_time", "wfh"]),
  preferredLocationIds: z.array(z.coerce.number().int().positive()).min(1),
  approverId: z.coerce.number().int().positive(),
  contactSharePolicy: z.enum(["never", "on_application", "always"]),
});

export type SeekerFormInput = z.infer<typeof seekerSchema>;

export type SeekerSubmitResult = { error: string } | { success: true };

export async function createSeekerProfileAction(
  input: SeekerFormInput
): Promise<SeekerSubmitResult> {
  const { user, seekerProfile } = await requireUser();
  if (seekerProfile) {
    return { error: "You already have a Job Seeker profile." };
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
        experience: data.experience,
        expectedSalary: data.expectedSalary,
        jobType: data.jobType,
        approverId: data.approverId,
        contactSharePolicy: data.contactSharePolicy,
      })
      .returning();

    if (data.skillIds.length > 0) {
      await tx.insert(jobSeekerSkills).values(
        data.skillIds.map((skillId) => ({ seekerId: profile.id, skillId }))
      );
    }

    await tx.insert(seekerLocationPreferences).values(
      data.preferredLocationIds.map((locationId) => ({
        seekerId: profile.id,
        locationId,
      }))
    );

    await tx.insert(verificationRequests).values({
      profileType: "seeker",
      profileId: profile.id,
      approverId: data.approverId,
      status: "pending",
    });
  });

  redirect("/dashboard");
}

const editSeekerSchema = z.object({
  name: z.string().trim().min(2),
  fatherName: z.string().trim().min(2),
  hometownDistrictId: z.coerce.number().int().positive(),
  qualificationId: z.coerce.number().int().positive().optional(),
  qualificationOther: z.string().trim().max(150).optional(),
  skillIds: z.array(z.coerce.number().int().positive()).default([]),
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
        experience: data.experience,
        expectedSalary: data.expectedSalary,
        jobType: data.jobType,
        updatedAt: new Date(),
      })
      .where(eq(jobSeekerProfiles.id, seekerProfile.id));

    await tx.delete(jobSeekerSkills).where(eq(jobSeekerSkills.seekerId, seekerProfile.id));
    if (data.skillIds.length > 0) {
      await tx.insert(jobSeekerSkills).values(
        data.skillIds.map((skillId) => ({ seekerId: seekerProfile.id, skillId }))
      );
    }

    await tx.delete(seekerLocationPreferences).where(eq(seekerLocationPreferences.seekerId, seekerProfile.id));
    await tx.insert(seekerLocationPreferences).values(
      data.preferredLocationIds.map((locationId) => ({ seekerId: seekerProfile.id, locationId }))
    );
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profile");
  return { success: true };
}
