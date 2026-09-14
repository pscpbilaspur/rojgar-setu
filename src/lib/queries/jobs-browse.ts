import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { jobs, jobGiverProfiles, jobSkills, skills, qualifications, locations } from "@/db/schema";

export async function browseOpenJobs(filters: { districtId?: number; jobType?: string } = {}) {
  const conditions = [eq(jobs.status, "open"), eq(jobs.moderationState, "approved")];
  if (filters.districtId) conditions.push(eq(jobs.locationId, filters.districtId));
  if (filters.jobType) conditions.push(eq(jobs.jobType, filters.jobType));

  return db
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
}

export async function getJobDetail(jobId: number) {
  const [row] = await db
    .select({
      id: jobs.id,
      title: jobs.title,
      description: jobs.description,
      jobType: jobs.jobType,
      salaryRange: jobs.salaryRange,
      qualification: qualifications.label,
      qualificationOther: jobs.qualificationOther,
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

  const skillRows = await db
    .select({ label: skills.label })
    .from(jobSkills)
    .innerJoin(skills, eq(jobSkills.skillId, skills.id))
    .where(eq(jobSkills.jobId, jobId));

  return {
    ...row,
    // A job can specify qualification via the preset dropdown (qualification)
    // or free-text "Other" (qualificationOther) — never both meaningfully,
    // so show whichever is set (Section 4.5: this field is optional).
    qualification: row.qualification ?? row.qualificationOther,
    skills: skillRows.map((s) => s.label),
  };
}
