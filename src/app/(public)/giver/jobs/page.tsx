import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { getJobsForGiver } from "@/lib/queries/giver-jobs";

export default async function MyJobsPage() {
  const { giverProfile } = await requireUser();
  if (!giverProfile) redirect("/onboarding/giver");

  const jobsList = await getJobsForGiver(giverProfile.id);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-[var(--ink)]">My Jobs</h1>
        <Link href="/giver/jobs/new" className="bg-[var(--accent)] text-white rounded-md px-4 py-2 text-sm font-medium">
          + Post a Job
        </Link>
      </div>
      {jobsList.length === 0 ? (
        <p className="text-[var(--ink-muted)]">You haven&apos;t posted any jobs yet.</p>
      ) : (
        <div className="space-y-3">
          {jobsList.map((job) => (
            <Link
              key={job.id}
              href={`/giver/jobs/${job.id}/applicants`}
              className="block bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-4"
              style={{ boxShadow: "var(--shadow)" }}
            >
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-[var(--ink)]">{job.title}</h3>
                <span className="text-xs bg-[var(--accent-soft)] text-[var(--accent-ink)] px-2 py-1 rounded-full">
                  {job.applicantCount} applicant{job.applicantCount === 1 ? "" : "s"}
                </span>
              </div>
              <p className="text-xs text-[var(--ink-faint)] mt-1">{job.district} · {job.status}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
