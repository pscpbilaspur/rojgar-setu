import "server-only";
import { and, desc, eq, inArray, or, ilike } from "drizzle-orm";
import { db } from "@/db";
import { jobs, jobGiverProfiles, jobSkills, skills, qualifications, locations, applications } from "@/db/schema";

/** `viewerSeekerId`, when passed, marks each job the logged-in Seeker has
 * already applied to (`alreadyApplied`) — so the same job doesn't just show
 * a plain "Apply" invite again once they've already sent one.
 *
 * `q` is a free-text keyword — matched against the job title, the Giver's
 * business name, and the free-text skills note (a partial, case-insensitive
 * match on any one of the three is enough), so "tally" or "shivam" both
 * find something reasonable the way a plain search box is expected to. */
export async function browseOpenJobs(
  filters: { districtId?: number; jobType?: string; q?: string } = {},
  viewerSeekerId?: number
) {
  const conditions = [eq(jobs.status, "open"), eq(jobs.moderationState, "approved")];
  if (filters.districtId) conditions.push(eq(jobs.locationId, filters.districtId));
  if (filters.jobType) conditions.push(eq(jobs.jobType, filters.jobType));
  if (filters.q?.trim()) {
    const needle = `%${filters.q.trim()}%`;
    conditions.push(
      or(ilike(jobs.title, needle), ilike(jobGiverProfiles.businessName, needle), ilike(jobs.skillsNote, needle))!
    );
  }

  const rows = await db
    .select({
      id: jobs.id,
      title: jobs.title,
      description: jobs.description,
      jobType: jobs.jobType,
      salaryRange: jobs.salaryRange,
      createdAt: jobs.createdAt,
      businessName: jobGiverProfiles.businessName,
      district: locations.district,
    })
    .from(jobs)
    .innerJoin(jobGiverProfiles, eq(jobs.giverId, jobGiverProfiles.id))
    .innerJoin(locations, eq(jobs.locationId, locations.id))
    .where(and(...conditions))
    .orderBy(desc(jobs.createdAt));

  let appliedJobIds = new Set<number>();
  if (viewerSeekerId && rows.length > 0) {
    const applied = await db
      .select({ jobId: applications.jobId })
      .from(applications)
      .where(
        and(
          eq(applications.seekerId, viewerSeekerId),
          inArray(
            applications.jobId,
            rows.map((r) => r.id)
          )
        )
      );
    appliedJobIds = new Set(applied.map((a) => a.jobId));
  }

  return rows.map((r) => ({ ...r, alreadyApplied: appliedJobIds.has(r.id) }));
}

/** `viewerSeekerId`, when passed, marks whether that Seeker has already
 * applied to this job (`alreadyApplied`) — so revisiting the job detail
 * page after applying shows that state instead of a plain "Apply" button
 * that would just error ("You have already applied") on click. */
export async function getJobDetail(jobId: number, viewerSeekerId?: number) {
  const [row] = await db
    .select({
      id: jobs.id,
      title: jobs.title,
      description: jobs.description,
      jobType: jobs.jobType,
      salaryRange: jobs.salaryRange,
      qualification: qualifications.label,
      qualificationOther: jobs.qualificationOther,
      skillsNote: jobs.skillsNote,
      status: jobs.status,
      giverId: jobs.giverId,
      businessName: jobGiverProfiles.businessName,
      district: locations.district,
    })
    .from(jobs)
    .innerJoin(jobGiverProfiles, eq(jobs.giverId, jobGiverProfiles.id))
    .innerJoin(locations, eq(jobs.locationId, locations.id))
    .leftJoin(qualifications, eq(jobs.qualificationId, qualifications.id))
    .where(eq(jobs.id, jobId));
  if (!row) return null;

  // The Giver's own free-typed skills/requirements note (current). Older
  // jobs posted before this changed fall back to a comma-joined list from
  // the structured jobSkills table, so nothing already posted disappears.
  let skillsDisplay = row.skillsNote;
  if (!skillsDisplay) {
    const skillRows = await db
      .select({ label: skills.label })
      .from(jobSkills)
      .innerJoin(skills, eq(jobSkills.skillId, skills.id))
      .where(eq(jobSkills.jobId, jobId));
    if (skillRows.length > 0) skillsDisplay = skillRows.map((s) => s.label).join(", ");
  }

  let alreadyApplied = false;
  if (viewerSeekerId) {
    const [existing] = await db
      .select({ id: applications.id })
      .from(applications)
      .where(and(eq(applications.jobId, jobId), eq(applications.seekerId, viewerSeekerId)));
    alreadyApplied = Boolean(existing);
  }

  return {
    ...row,
    // A job can specify qualification via the preset dropdown (qualification)
    // or free-text "Other" (qualificationOther) — never both meaningfully,
    // so show whichever is set (Section 4.5: this field is optional).
    qualification: row.qualification ?? row.qualificationOther,
    skills: skillsDisplay,
    alreadyApplied,
  };
}
