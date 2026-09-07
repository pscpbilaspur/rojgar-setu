import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { jobs, jobGiverProfiles, locations } from "@/db/schema";

export async function getRecentOpenJobs(limit = 3) {
  return db
    .select({
      id: jobs.id,
      title: jobs.title,
      jobType: jobs.jobType,
      salaryRange: jobs.salaryRange,
      createdAt: jobs.createdAt,
      businessName: jobGiverProfiles.businessName,
      district: locations.district,
    })
    .from(jobs)
    .innerJoin(jobGiverProfiles, eq(jobs.giverId, jobGiverProfiles.id))
    .innerJoin(locations, eq(jobs.locationId, locations.id))
    .where(and(eq(jobs.status, "open"), eq(jobs.moderationState, "approved")))
    .orderBy(desc(jobs.createdAt))
    .limit(limit);
}
