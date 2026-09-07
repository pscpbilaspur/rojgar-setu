import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { applications, jobSeekerProfiles, users, jobs } from "@/db/schema";

export type ApplicantRow = {
  applicationId: number;
  status: string;
  seekerName: string;
  fatherName: string;
  jobType: string;
  expectedSalary: string | null;
  verificationStatus: string;
  mobile: string | null; // null when contact sharing policy hides it
  createdAt: Date;
};

/** Mobile visibility follows the seeker's own contactSharePolicy
 * (Section 4.3): 'always' or 'on_application' both reveal it here since the
 * seeker has applied to this specific job; 'never' keeps it hidden even
 * from a Job Giver they applied to. */
export async function getApplicantsForJob(jobId: number, giverId: number): Promise<ApplicantRow[] | null> {
  const job = await db.query.jobs.findFirst({ where: eq(jobs.id, jobId) });
  if (!job || job.giverId !== giverId) return null; // ownership check

  const rows = await db
    .select({
      applicationId: applications.id,
      status: applications.status,
      seekerName: jobSeekerProfiles.name,
      fatherName: jobSeekerProfiles.fatherName,
      jobType: jobSeekerProfiles.jobType,
      expectedSalary: jobSeekerProfiles.expectedSalary,
      verificationStatus: jobSeekerProfiles.verificationStatus,
      contactSharePolicy: jobSeekerProfiles.contactSharePolicy,
      mobile: users.mobile,
      createdAt: applications.createdAt,
    })
    .from(applications)
    .innerJoin(jobSeekerProfiles, eq(applications.seekerId, jobSeekerProfiles.id))
    .innerJoin(users, eq(jobSeekerProfiles.userId, users.id))
    .where(eq(applications.jobId, jobId))
    .orderBy(desc(applications.createdAt));

  return rows.map((r) => ({
    applicationId: r.applicationId,
    status: r.status,
    seekerName: r.seekerName,
    fatherName: r.fatherName,
    jobType: r.jobType,
    expectedSalary: r.expectedSalary,
    verificationStatus: r.verificationStatus,
    mobile: r.contactSharePolicy === "never" ? null : r.mobile,
    createdAt: r.createdAt,
  }));
}
