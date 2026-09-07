"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { jobSeekerProfiles } from "@/db/schema";
import { requireUser } from "@/lib/dal";

export async function updateContactSharePolicyAction(
  policy: "never" | "on_application" | "always"
) {
  const { seekerProfile } = await requireUser();
  if (!seekerProfile) throw new Error("No Job Seeker profile.");

  await db
    .update(jobSeekerProfiles)
    .set({ contactSharePolicy: policy, updatedAt: new Date() })
    .where(eq(jobSeekerProfiles.id, seekerProfile.id));

  revalidatePath("/dashboard/privacy");
}
