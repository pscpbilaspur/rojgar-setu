import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { applications, jobs, jobGiverProfiles, locations } from "@/db/schema";

export async function getApplicationsForSeeker(seekerId: number) {
  return db
    .select({
      applicationId: applications.id,
      status: applications.status,
      jobId: jobs.id,
      title: jobs.title,
      businessName: jobGiverProfiles.businessName,
      district: locations.district,
      createdAt: applications.createdAt,
    })
    .from(applications)
    .innerJoin(jobs, eq(applications.jobId, jobs.id))
    .innerJoin(jobGiverProfiles, eq(jobs.giverId, jobGiverProfiles.id))
    .innerJoin(locations, eq(jobs.locationId, locations.id))
    .where(eq(applications.seekerId, seekerId))
    .orderBy(desc(applications.createdAt));
}
