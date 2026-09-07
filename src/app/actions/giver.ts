"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { jobGiverProfiles, verificationRequests } from "@/db/schema";
import { requireUser } from "@/lib/dal";

const giverSchema = z.object({
  businessName: z.string().trim().min(2),
  contactPersonName: z.string().trim().min(2),
  category: z.string().trim().min(1),
  categoryOther: z.string().trim().max(120).optional(),
  locationId: z.coerce.number().int().positive(),
  about: z.string().trim().max(2000).optional(),
  website: z.string().trim().max(300).optional(),
  approverId: z.coerce.number().int().positive(),
});

export type GiverFormInput = z.infer<typeof giverSchema>;
export type GiverSubmitResult = { error: string } | { success: true };

export async function createGiverProfileAction(
  input: GiverFormInput
): Promise<GiverSubmitResult> {
  const { user, giverProfile } = await requireUser();
  if (giverProfile) {
    return { error: "You already have a Job Giver profile." };
  }

  const parsed = giverSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const data = parsed.data;

  await db.transaction(async (tx) => {
    const [profile] = await tx
      .insert(jobGiverProfiles)
      .values({
        userId: user.id,
        businessName: data.businessName,
        contactPersonName: data.contactPersonName,
        category: data.category,
        categoryOther: data.categoryOther,
        locationId: data.locationId,
        about: data.about,
        website: data.website,
        approverId: data.approverId,
      })
      .returning();

    await tx.insert(verificationRequests).values({
      profileType: "giver",
      profileId: profile.id,
      approverId: data.approverId,
      status: "pending",
    });
  });

  redirect("/dashboard");
}

const editGiverSchema = z.object({
  businessName: z.string().trim().min(2),
  contactPersonName: z.string().trim().min(2),
  category: z.string().trim().min(1),
  categoryOther: z.string().trim().max(120).optional(),
  locationId: z.coerce.number().int().positive(),
  about: z.string().trim().max(2000).optional(),
  website: z.string().trim().max(300).optional(),
});
export type EditGiverInput = z.infer<typeof editGiverSchema>;

/** Same rationale as updateSeekerProfileAction: leaves approverId and
 * verification status untouched — an edit is not a reason to reopen an
 * already-decided Basic Verification. */
export async function updateGiverProfileAction(input: EditGiverInput): Promise<GiverSubmitResult> {
  const { giverProfile } = await requireUser();
  if (!giverProfile) return { error: "No Job Giver profile to update." };

  const parsed = editGiverSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const data = parsed.data;

  await db
    .update(jobGiverProfiles)
    .set({
      businessName: data.businessName,
      contactPersonName: data.contactPersonName,
      category: data.category,
      categoryOther: data.categoryOther,
      locationId: data.locationId,
      about: data.about,
      website: data.website,
      updatedAt: new Date(),
    })
    .where(eq(jobGiverProfiles.id, giverProfile.id));

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/business-profile");
  return { success: true };
}
