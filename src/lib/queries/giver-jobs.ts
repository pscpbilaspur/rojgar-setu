import "server-only";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { jobs, applications, locations } from "@/db/schema";

export async function getJobsForGiver(giverId: number) {
  return db
    .select({
      id: jobs.id,
      title: jobs.title,
      jobType: jobs.jobType,
      status: jobs.status,
      district: locations.district,
      createdAt: jobs.createdAt,
      applicantCount: sql<number>`(select count(*)::int from ${applications} where ${applications.jobId} = ${jobs.id})`,
    })
    .from(jobs)
    .innerJoin(locations, eq(jobs.locationId, locations.id))
    .where(eq(jobs.giverId, giverId))
    .orderBy(desc(jobs.createdAt));
}
