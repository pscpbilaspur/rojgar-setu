"use server";

import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { jobs, jobSkills, applications, jobSeekerProfiles, jobGiverProfiles } from "@/db/schema";
import { requireUser } from "@/lib/dal";
import { notify } from "@/lib/notify";

const postJobSchema = z.object({
  title: z.string().trim().min(2),
  description: z.string().trim().min(10),
  qualificationId: z.coerce.number().int().positive().optional(),
  qualificationOther: z.string().trim().max(150).optional(),
  skillIds: z.array(z.coerce.number().int().positive()).default([]),
  jobType: z.enum(["full_time", "part_time", "wfh"]),
  locationId: z.coerce.number().int().positive(),
  salaryRange: z.string().trim().max(100).optional(),
});
export type PostJobInput = z.infer<typeof postJobSchema>;
export type PostJobResult = { error: string } | { success: true; jobId: number };

export async function postJobAction(input: PostJobInput): Promise<PostJobResult> {
  const { giverProfile } = await requireUser();
  if (!giverProfile) {
    return { error: "You need a Job Giver profile to post a job." };
  }
  const parsed = postJobSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const data = parsed.data;

  const [job] = await db
    .insert(jobs)
    .values({
      giverId: giverProfile.id,
      title: data.title,
      description: data.description,
      qualificationId: data.qualificationId,
      qualificationOther: data.qualificationOther,
      jobType: data.jobType,
      locationId: data.locationId,
      salaryRange: data.salaryRange,
    })
    .returning();

  if (data.skillIds.length > 0) {
    await db.insert(jobSkills).values(data.skillIds.map((skillId) => ({ jobId: job.id, skillId })));
  }

  revalidatePath("/giver/jobs");
  return { success: true, jobId: job.id };
}

export type ApplyResult = { error: string } | { success: true };

export async function applyToJobAction(jobId: number): Promise<ApplyResult> {
  const { seekerProfile } = await requireUser();
  if (!seekerProfile) {
    return { error: "You need a Job Seeker profile to apply." };
  }

  const existing = await db.query.applications.findFirst({
    where: and(eq(applications.jobId, jobId), eq(applications.seekerId, seekerProfile.id)),
  });
  if (existing) {
    return { error: "You have already applied to this job." };
  }

  await db.insert(applications).values({ jobId, seekerId: seekerProfile.id });

  const job = await db.query.jobs.findFirst({ where: eq(jobs.id, jobId) });
  if (job) {
    const giver = await db.query.jobGiverProfiles.findFirst({ where: eq(jobGiverProfiles.id, job.giverId) });
    if (giver) {
      await notify(giver.userId, "new_applicant", `${seekerProfile.name} applied to your job "${job.title}".`);
    }
  }

  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/dashboard/applications");
  return { success: true };
}

export type ApplicationDecision = "shortlisted" | "not_a_fit";

export async function decideApplicationAction(applicationId: number, decision: ApplicationDecision) {
  const { giverProfile } = await requireUser();
  if (!giverProfile) throw new Error("Not a Job Giver.");

  const application = await db.query.applications.findFirst({
    where: eq(applications.id, applicationId),
  });
  if (!application) throw new Error("Application not found.");

  const job = await db.query.jobs.findFirst({ where: eq(jobs.id, application.jobId) });
  if (!job || job.giverId !== giverProfile.id) {
    // Server-side ownership check (Section 7) — never trust the client.
    throw new Error("This job does not belong to you.");
  }

  await db.update(applications).set({ status: decision, updatedAt: new Date() }).where(eq(applications.id, applicationId));

  const seeker = await db.query.jobSeekerProfiles.findFirst({ where: eq(jobSeekerProfiles.id, application.seekerId) });
  if (seeker) {
    await notify(
      seeker.userId,
      decision === "shortlisted" ? "application_shortlisted" : "application_not_a_fit",
      decision === "shortlisted"
        ? `You've been shortlisted for "${job.title}".`
        : `Your application for "${job.title}" was marked not a fit this time.`
    );
  }

  revalidatePath(`/giver/jobs/${job.id}/applicants`);
}
