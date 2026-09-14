import "server-only";
import { and, eq, desc, inArray, ne, sql } from "drizzle-orm";
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
  applications,
  chatParticipants,
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
  // Only ever true when browseSeekers was called with `viewer` (a logged-in
  // Giver) — a quick "you've already crossed paths" signal so a Giver
  // scrolling the People list can tell at a glance who has already applied
  // to one of their jobs, or already messaged them, instead of finding out
  // again by re-opening each profile.
  alreadyApplied: boolean;
  alreadyContacted: boolean;
};

/** `filters.districtId` matches a Job Giver's actual question — "who is
 * available to work in MY district?" — so it checks the seeker's *preferred*
 * work locations (seekerLocationPreferences), not just their hometown.
 * Hometown alone would silently hide someone who lives elsewhere but is
 * willing to work in this district, which defeats the point of the
 * preferred-locations field (Section 4.4/4.6 — location is the discovery
 * dimension). Hometown is still shown on the card for context.
 *
 * `viewer`, when passed (the logged-in Giver's own profile id + user id),
 * additionally marks each seeker who has already applied to one of this
 * Giver's jobs (`alreadyApplied`) or already started a chat with this
 * Giver (`alreadyContacted` — only Seekers can initiate a chat, so a shared
 * thread always means the Seeker reached out first). */
export async function browseSeekers(
  filters: { districtId?: number; qualificationId?: number; jobType?: string } = {},
  viewer?: { giverId: number; giverUserId: number }
) {
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

  let appliedSeekerIds = new Set<number>();
  let contactedSeekerIds = new Set<number>();
  if (viewer && seekerIds.length > 0) {
    const [appliedRows, contactedUserIds] = await Promise.all([
      db
        .select({ seekerId: applications.seekerId })
        .from(applications)
        .innerJoin(jobs, eq(applications.jobId, jobs.id))
        .where(and(eq(jobs.giverId, viewer.giverId), inArray(applications.seekerId, seekerIds))),
      fetchContactedUserIds(viewer.giverUserId),
    ]);
    appliedSeekerIds = new Set(appliedRows.map((r) => r.seekerId));
    if (contactedUserIds.length > 0) {
      const contactedRows = await db
        .select({ id: jobSeekerProfiles.id })
        .from(jobSeekerProfiles)
        .where(and(inArray(jobSeekerProfiles.userId, contactedUserIds), inArray(jobSeekerProfiles.id, seekerIds)));
      contactedSeekerIds = new Set(contactedRows.map((r) => r.id));
    }
  }

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    qualification: r.qualification ?? r.qualificationOther,
    jobType: r.jobType,
    district: r.district,
    preferredDistricts: preferredByseeker.get(r.id) ?? [],
    verificationPending: r.verificationStatus === "not_yet_done",
    alreadyApplied: appliedSeekerIds.has(r.id),
    alreadyContacted: contactedSeekerIds.has(r.id),
  }));
}

/** userIds of everyone who shares a chat thread with `giverUserId` — since
 * only a Seeker can ever start a chat (startChatAction requires a Seeker
 * profile), any such thread means that other person messaged this Giver
 * first, not the other way round. */
async function fetchContactedUserIds(giverUserId: number): Promise<number[]> {
  const giverThreads = await db
    .select({ threadId: chatParticipants.threadId })
    .from(chatParticipants)
    .where(eq(chatParticipants.userId, giverUserId));
  const threadIds = giverThreads.map((t) => t.threadId);
  if (threadIds.length === 0) return [];
  const others = await db
    .select({ userId: chatParticipants.userId })
    .from(chatParticipants)
    .where(and(inArray(chatParticipants.threadId, threadIds), ne(chatParticipants.userId, giverUserId)));
  return others.map((o) => o.userId);
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
      skillsText: jobSeekerProfiles.skillsText,
      additionalNote: jobSeekerProfiles.additionalNote,
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

  // The Seeker's own free-typed skills (current). Older profiles created
  // before this changed (e.g. via the Admin CSV importer, which still
  // writes into the structured jobSeekerSkills table) fall back to a
  // comma-joined list from there, so nothing already on file disappears.
  let skillsDisplay = profile.skillsText;
  if (!skillsDisplay) {
    const skillRows = await db
      .select({ label: skills.label })
      .from(jobSeekerSkills)
      .innerJoin(skills, eq(jobSeekerSkills.skillId, skills.id))
      .where(eq(jobSeekerSkills.seekerId, id));
    if (skillRows.length > 0) skillsDisplay = skillRows.map((s) => s.label).join(", ");
  }

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
    skills: skillsDisplay,
    additionalNote: profile.additionalNote,
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
