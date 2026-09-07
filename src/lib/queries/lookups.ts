import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { locations, qualifications, skills, approvers, jobSeekerSkills, seekerLocationPreferences } from "@/db/schema";

export async function getAllDistricts() {
  return db.select().from(locations).orderBy(asc(locations.isRemote), asc(locations.district));
}

export async function getQualifications() {
  return db.select().from(qualifications).orderBy(asc(qualifications.label));
}

export async function getSkills() {
  return db.select().from(skills).orderBy(asc(skills.label));
}

export async function getApproversForDistrict(districtId: number) {
  return db
    .select()
    .from(approvers)
    .where(eq(approvers.districtId, districtId));
}

export async function getSeekerSkillIds(seekerId: number) {
  const rows = await db
    .select({ skillId: jobSeekerSkills.skillId })
    .from(jobSeekerSkills)
    .where(eq(jobSeekerSkills.seekerId, seekerId));
  return rows.map((r) => r.skillId);
}

export async function getSeekerLocationIds(seekerId: number) {
  const rows = await db
    .select({ locationId: seekerLocationPreferences.locationId })
    .from(seekerLocationPreferences)
    .where(eq(seekerLocationPreferences.seekerId, seekerId));
  return rows.map((r) => r.locationId);
}
