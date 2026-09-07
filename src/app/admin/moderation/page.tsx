import { requireAdmin } from "@/lib/dal";
import { db } from "@/db";
import { jobs, jobGiverProfiles } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { JobModerationRow } from "./JobModerationRow";

export default async function ModerationPage() {
  await requireAdmin();

  const allJobs = await db
    .select({
      id: jobs.id,
      title: jobs.title,
      moderationState: jobs.moderationState,
      businessName: jobGiverProfiles.businessName,
    })
    .from(jobs)
    .innerJoin(jobGiverProfiles, eq(jobs.giverId, jobGiverProfiles.id))
    .orderBy(desc(jobs.createdAt));

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold text-[var(--ink)] mb-6">Job Moderation ({allJobs.length})</h1>
      {allJobs.length === 0 ? (
        <p className="text-[var(--ink-muted)]">No jobs posted yet.</p>
      ) : (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-4 overflow-x-auto" style={{ boxShadow: "var(--shadow)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[var(--ink-muted)] border-b border-[var(--border)]">
                <th className="py-2 px-2">Title</th>
                <th className="py-2 px-2">Posted by</th>
                <th className="py-2 px-2">State</th>
                <th className="py-2 px-2"></th>
              </tr>
            </thead>
            <tbody>
              {allJobs.map((j) => (
                <JobModerationRow key={j.id} {...j} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
