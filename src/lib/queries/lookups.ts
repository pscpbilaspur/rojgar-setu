import "server-only";
import { and, asc, eq, inArray, or } from "drizzle-orm";
import { db } from "@/db";
import { locations, qualifications, skills, approvers, jobSeekerSkills, seekerLocationPreferences } from "@/db/schema";
import { ACTIVE_DISTRICTS } from "@/db/seed-data/districts";

/**
 * Districts (+ the Remote/Anywhere tag) currently offered to ordinary
 * visitors — registration, job posting, search filters. Scoped down to
 * ACTIVE_DISTRICTS (src/db/seed-data/districts.ts) since the platform is
 * only really active in a handful of districts right now. Every other real
 * district still exists in the database untouched — Admin screens (Import,
 * Approvers & Districts) query `locations` directly and still see all of
 * them, for setting up a district ahead of it going "live" here.
 */
export async function getAllDistricts() {
  return db
    .select()
    .from(locations)
    .where(or(inArray(locations.district, ACTIVE_DISTRICTS), eq(locations.isRemote, true)))
    .orderBy(asc(locations.isRemote), asc(locations.district));
}

export async function getQualifications() {
  return db.select().from(qualifications).orderBy(asc(qualifications.label));
}

export async function getSkills() {
  return db.select().from(skills).orderBy(asc(skills.label));
}

// Only "active" Approvers are offered to a seeker/giver picking one during
// registration — an Admin can deactivate an Approver (Approvers &
// Districts → toggle status) without it silently still appearing as a
// choice here. Multiple active Approvers in the same district are fully
// supported and all show up (no uniqueness constraint on districtId).
export async function getApproversForDistrict(districtId: number) {
  return db
    .select()
    .from(approvers)
    .where(and(eq(approvers.districtId, districtId), eq(approvers.status, "active")));
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
