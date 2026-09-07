import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { jobs, jobGiverProfiles, locations } from "@/db/schema";

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
      qualificationOther: jobs.qualificationOther,
      status: jobs.status,
      businessName: jobGiverProfiles.businessName,
      district: locations.district,
    })
    .from(jobs)
    .innerJoin(jobGiverProfiles, eq(jobs.giverId, jobGiverProfiles.id))
    .innerJoin(locations, eq(jobs.locationId, locations.id))
    .where(eq(jobs.id, jobId));
  return row ?? null;
}
