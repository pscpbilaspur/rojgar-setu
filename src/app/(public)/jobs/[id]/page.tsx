import { notFound } from "next/navigation";
import Link from "next/link";
import { getJobDetail } from "@/lib/queries/jobs-browse";
import { getCurrentUser } from "@/lib/dal";
import { ApplyButton } from "./ApplyButton";
import { ReportJobButton } from "./ReportJobButton";

const JOB_TYPE_LABEL: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  wfh: "Work From Home",
};

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await getJobDetail(Number(id));
  if (!job) notFound();

  const current = await getCurrentUser();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div
        className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-5"
        style={{ boxShadow: "var(--shadow)" }}
      >
        <h1 className="text-xl font-bold text-[var(--ink)]">{job.title}</h1>
        <p className="text-[var(--ink-muted)] mt-1">{job.businessName}</p>
        <p className="text-sm text-[var(--ink-faint)] mt-1">
          {job.district} · {JOB_TYPE_LABEL[job.jobType]}
          {job.salaryRange ? ` · ${job.salaryRange}` : ""}
        </p>
        {job.qualificationOther && (
          <p className="text-sm text-[var(--ink-muted)] mt-1">Minimum qualification: {job.qualificationOther}</p>
        )}
        <p className="mt-4 whitespace-pre-line text-[var(--ink)]">{job.description}</p>

        <div className="mt-6">
          {!current ? (
            <Link href="/login" className="bg-[var(--accent)] text-white rounded-md px-5 py-2 font-medium inline-block">
              Login to Apply
            </Link>
          ) : !current.seekerProfile ? (
            <p className="text-sm text-[var(--ink-muted)]">
              You need a Job Seeker profile to apply.{" "}
              <Link href="/onboarding/seeker" className="underline">Create one</Link>
            </p>
          ) : (
            <ApplyButton jobId={job.id} />
          )}
        </div>

        {current && <ReportJobButton jobId={job.id} />}
      </div>
    </div>
  );
}
