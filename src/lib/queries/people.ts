import "server-only";
import { and, eq, desc, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  jobSeekerProfiles,
  jobGiverProfiles,
  jobSeekerSkills,
  seekerLocationPreferences,
  skills,
  qualifications,
  locations,
  users,
  jobs,
} from "@/db/schema";

// ---------------------------------------------------------------------------
// Visibility model (Section 5 of the master build prompt):
//   - Father's Name: never shown here (verification-only, Approver/Admin).
//   - Expected Salary: hidden from anonymous visitors, visible once logged in.
//   - Mobile number: never to an anonymous visitor; to a logged-in visitor
//     only when the seeker's own contactSharePolicy is 'always' (the
//     'on_application'/'never' cases only ever surface a seeker's mobile to
//     a Giver they specifically applied to — see queries/applicants.ts).
//   - Verification status: never a public "Verified" badge — only ever a
//     "not yet done" label, and only while that's actually true.
// ---------------------------------------------------------------------------

export type SeekerListRow = {
  id: number;
  name: string;
  qualification: string | null;
  jobType: string;
  district: string;
  preferredDistricts: string[];
  verificationPending: boolean;
};

/** `filters.districtId` matches a Job Giver's actual question — "who is
 * available to work in MY district?" — so it checks the seeker's *preferred*
 * work locations (seekerLocationPreferences), not just their hometown.
 * Hometown alone would silently hide someone who lives elsewhere but is
 * willing to work in this district, which defeats the point of the
 * preferred-locations field (Section 4.4/4.6 — location is the discovery
 * dimension). Hometown is still shown on the card for context. */
export async function browseSeekers(filters: { districtId?: number; qualificationId?: number; jobType?: string } = {}) {
  const conditions = [];
  if (filters.districtId) {
    conditions.push(
      inArray(
        jobSeekerProfiles.id,
        db
          .select({ id: seekerLocationPreferences.seekerId })
          .from(seekerLocationPreferences)
          .where(eq(seekerLocationPreferences.locationId, filters.districtId))
      )
    );
  }
  if (filters.qualificationId) conditions.push(eq(jobSeekerProfiles.qualificationId, filters.qualificationId));
  if (filters.jobType) conditions.push(eq(jobSeekerProfiles.jobType, filters.jobType));

  const rows = await db
    .select({
      id: jobSeekerProfiles.id,
      name: jobSeekerProfiles.name,
      qualification: qualifications.label,
      qualificationOther: jobSeekerProfiles.qualificationOther,
      jobType: jobSeekerProfiles.jobType,
      district: locations.district,
      verificationStatus: jobSeekerProfiles.verificationStatus,
    })
    .from(jobSeekerProfiles)
    .leftJoin(qualifications, eq(jobSeekerProfiles.qualificationId, qualifications.id))
    .innerJoin(locations, eq(jobSeekerProfiles.hometownDistrictId, locations.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(jobSeekerProfiles.createdAt));

  const seekerIds = rows.map((r) => r.id);
  const preferredByseeker = await fetchPreferredDistricts(seekerIds);

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    qualification: r.qualification ?? r.qualificationOther,
    jobType: r.jobType,
    district: r.district,
    preferredDistricts: preferredByseeker.get(r.id) ?? [],
    verificationPending: r.verificationStatus === "not_yet_done",
  }));
}

async function fetchPreferredDistricts(seekerIds: number[]): Promise<Map<number, string[]>> {
  const map = new Map<number, string[]>();
  if (seekerIds.length === 0) return map;
  const rows = await db
    .select({ seekerId: seekerLocationPreferences.seekerId, district: locations.district })
    .from(seekerLocationPreferences)
    .innerJoin(locations, eq(seekerLocationPreferences.locationId, locations.id))
    .where(inArray(seekerLocationPreferences.seekerId, seekerIds));
  for (const r of rows) {
    const list = map.get(r.seekerId) ?? [];
    list.push(r.district);
    map.set(r.seekerId, list);
  }
  return map;
}

export async function getSeekerPublicProfile(id: number, isLoggedIn: boolean) {
  const [profile] = await db
    .select({
      id: jobSeekerProfiles.id,
      name: jobSeekerProfiles.name,
      qualification: qualifications.label,
      qualificationOther: jobSeekerProfiles.qualificationOther,
      experience: jobSeekerProfiles.experience,
      expectedSalary: jobSeekerProfiles.expectedSalary,
      jobType: jobSeekerProfiles.jobType,
      district: locations.district,
      verificationStatus: jobSeekerProfiles.verificationStatus,
      contactSharePolicy: jobSeekerProfiles.contactSharePolicy,
      mobile: users.mobile,
      userId: jobSeekerProfiles.userId,
    })
    .from(jobSeekerProfiles)
    .leftJoin(qualifications, eq(jobSeekerProfiles.qualificationId, qualifications.id))
    .innerJoin(locations, eq(jobSeekerProfiles.hometownDistrictId, locations.id))
    .innerJoin(users, eq(jobSeekerProfiles.userId, users.id))
    .where(eq(jobSeekerProfiles.id, id));

  if (!profile) return null;

  const skillRows = await db
    .select({ label: skills.label })
    .from(jobSeekerSkills)
    .innerJoin(skills, eq(jobSeekerSkills.skillId, skills.id))
    .where(eq(jobSeekerSkills.seekerId, id));

  const preferredRows = await db
    .select({ district: locations.district })
    .from(seekerLocationPreferences)
    .innerJoin(locations, eq(seekerLocationPreferences.locationId, locations.id))
    .where(eq(seekerLocationPreferences.seekerId, id));

  return {
    id: profile.id,
    userId: profile.userId,
    name: profile.name,
    qualification: profile.qualification ?? profile.qualificationOther,
    experience: profile.experience,
    jobType: profile.jobType,
    district: profile.district,
    skills: skillRows.map((s) => s.label),
    preferredDistricts: preferredRows.map((p) => p.district),
    expectedSalary: isLoggedIn ? profile.expectedSalary : null,
    verificationPending: profile.verificationStatus === "not_yet_done",
    mobile: isLoggedIn && profile.contactSharePolicy === "always" ? profile.mobile : null,
  };
}

export type GiverListRow = {
  id: number;
  businessName: string;
  category: string;
  district: string;
};

export async function browseGivers(filters: { districtId?: number } = {}) {
  const conditions = [];
  if (filters.districtId) conditions.push(eq(jobGiverProfiles.locationId, filters.districtId));

  const rows = await db
    .select({
      id: jobGiverProfiles.id,
      businessName: jobGiverProfiles.businessName,
      category: jobGiverProfiles.category,
      categoryOther: jobGiverProfiles.categoryOther,
      district: locations.district,
    })
    .from(jobGiverProfiles)
    .innerJoin(locations, eq(jobGiverProfiles.locationId, locations.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(jobGiverProfiles.createdAt));

  return rows.map((r) => ({
    id: r.id,
    businessName: r.businessName,
    category: r.category,
    district: r.district,
  }));
}

export async function getGiverPublicProfile(id: number, isLoggedIn: boolean) {
  const [profile] = await db
    .select({
      id: jobGiverProfiles.id,
      businessName: jobGiverProfiles.businessName,
      contactPersonName: jobGiverProfiles.contactPersonName,
      category: jobGiverProfiles.category,
      categoryOther: jobGiverProfiles.categoryOther,
      about: jobGiverProfiles.about,
      website: jobGiverProfiles.website,
      district: locations.district,
      verificationStatus: jobGiverProfiles.verificationStatus,
      userId: jobGiverProfiles.userId,
    })
    .from(jobGiverProfiles)
    .innerJoin(locations, eq(jobGiverProfiles.locationId, locations.id))
    .where(eq(jobGiverProfiles.id, id));

  if (!profile) return null;

  const openJobs = await db
    .select({ id: jobs.id, title: jobs.title, jobType: jobs.jobType })
    .from(jobs)
    .where(and(eq(jobs.giverId, id), eq(jobs.status, "open"), eq(jobs.moderationState, "approved")))
    .orderBy(desc(jobs.createdAt));

  return {
    id: profile.id,
    userId: profile.userId,
    businessName: profile.businessName,
    category: profile.category,
    about: profile.about,
    website: profile.website,
    district: profile.district,
    verificationPending: profile.verificationStatus === "not_yet_done",
    contactPersonName: isLoggedIn ? profile.contactPersonName : null,
    openJobs,
  };
}

export async function countPlatformStats() {
  const [seekerCount] = await db.select({ n: sql<number>`count(*)::int` }).from(jobSeekerProfiles);
  const [giverCount] = await db.select({ n: sql<number>`count(*)::int` }).from(jobGiverProfiles);
  const [openJobCount] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(jobs)
    .where(and(eq(jobs.status, "open"), eq(jobs.moderationState, "approved")));
  return { seekers: seekerCount.n, givers: giverCount.n, openJobs: openJobCount.n };
}
