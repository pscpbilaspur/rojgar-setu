"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { skills } from "@/db/schema";
import { getApproversForDistrict } from "@/lib/queries/lookups";

export async function getApproversForDistrictAction(districtId: number) {
  return getApproversForDistrict(districtId);
}

/** "Add your own skill" — creates the skill row on demand if it doesn't
 * already exist (Section 6: the shared skills lookup list an Admin can
 * extend; here a user's free-text entry extends it the same way). */
export async function ensureSkillAction(label: string) {
  const trimmed = label.trim();
  if (!trimmed) return null;
  const existing = await db.query.skills.findFirst({
    where: eq(skills.label, trimmed),
  });
  if (existing) return existing;
  const [created] = await db.insert(skills).values({ label: trimmed }).returning();
  return created;
}
